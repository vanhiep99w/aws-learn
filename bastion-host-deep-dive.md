# Bastion Host Deep Dive & Các cách thay thế truy cập EC2

## Mục lục

- [Mục tiêu của doc này](#mục-tiêu-của-doc-này)
- [Phần 1: Vì sao cần "secure access" vào EC2](#phần-1-vì-sao-cần-secure-access-vào-ec2)
- [Phần 2: Bastion Host truyền thống — mechanics sâu](#phần-2-bastion-host-truyền-thống-mechanics-sâu)
- [Phần 3: SSH qua Bastion — 4 cách và vì sao khác nhau](#phần-3-ssh-qua-bastion-4-cách-và-vì-sao-khác-nhau)
- [Phần 4: ssh-agent, ProxyJump và Agent Forwarding](#phần-4-ssh-agent-proxyjump-và-agent-forwarding)
- [Phần 5: AWS Systems Manager Session Manager](#phần-5-aws-systems-manager-session-manager)
- [Phần 6: Amazon EC2 Instance Connect Endpoint](#phần-6-amazon-ec2-instance-connect-endpoint)
- [Phần 7: AWS Client VPN](#phần-7-aws-client-vpn)
- [Phần 8: Third-party hardened access (Teleport, Boundary, Tailscale)](#phần-8-third-party-hardened-access-teleport-boundary-tailscale)
- [Phần 9: Decision matrix — chọn cách nào](#phần-9-decision-matrix--chọn-cách-nào)
- [Phần 10: Production patterns](#phần-10-production-patterns)
- [Phần 11: Common pitfalls](#phần-11-common-pitfalls)
- [Phần 12: Cheatsheet](#phần-12-cheatsheet)
- [Gợi ý khi gặp trong đề thi / phỏng vấn](#gợi-ý-khi-gặp-trong-đề-thi--phỏng-vấn)
- [Nguồn AWS chính thức](#nguồn-aws-chính-thức)

---

## Mục tiêu của doc này

Doc này là phần **deep dive** của [`bastion-host.md`](bastion-host.md). File kia giải thích "bastion là gì", file này trả lời các câu hỏi sâu hơn:

- 1 lệnh `ssh` thực sự tạo ra bao nhiêu TCP connection khi đi qua bastion?
- Tại sao `-J` (ProxyJump) an toàn hơn `-A` (Agent Forwarding)?
- `ssh-agent` giữ key như thế nào, và vì sao `-A` có rủi ro?
- Trên production người ta có còn dùng bastion không, hay chuyển sang cái gì?
- Session Manager, EC2 Instance Connect Endpoint, Client VPN khác nhau thế nào, khi nào dùng cái nào?

Đi kèm doc này là diagram minh hoạ packet flow. Trên webapp, diagram được render trực tiếp từ file PNG đã export từ Excalidraw:

![Full SSH flow qua Bastion gồm 2 TCP connections và 4 luồng traffic](/diagrams/vpc-ssh-full-flow-2-connections.png)

File nguồn để chỉnh sửa diagram:

- [`docs/diagrams/vpc-ssh-full-flow-2-connections.excalidraw`](docs/diagrams/vpc-ssh-full-flow-2-connections.excalidraw)

---

## Phần 1: Vì sao cần "secure access" vào EC2

Trong 3-tier VPC, các EC2 nằm ở **private subnet** thường:

```text
- Không có public IP
- Không mở port 22 ra Internet
- Chỉ nhận traffic nội bộ VPC (từ ALB, app tier, ...)
```

Vậy khi admin cần SSH vào để debug/patch/cài đặt, làm sao truy cập được nếu không có public IP?

Có 2 triết lý trả lời câu hỏi này:

### Triết lý 1: Bastion Host (cổ điển)

> Đặt 1 EC2 ở **public subnet**, mở port 22 cho IP của admin. Admin SSH vào bastion, rồi từ bastion SSH tiếp vào private EC2.

```text
Internet ──► Bastion (public) ──► Private EC2
```

### Triết lý 2: Bastion-less (hiện đại)

> Không cần bastion vật lý. Dùng dịch vụ của AWS làm "identity-aware proxy", auth bằng IAM thay vì SSH key, không mở port 22.

```text
Internet ──► AWS Proxy (SSM / EIC Endpoint) ──► Private EC2
```

Phần 2–4 đi sâu vào triết lý 1. Phần 5–8 đi sâu vào triết lý 2 và các biến thể.

---

## Phần 2: Bastion Host truyền thống — mechanics sâu

### 2.1 Kiến trúc tham chiếu

```text
┌─────────────────────────── VPC 10.0.0.0/16 ─────────────────────────────┐
│                                                                         │
│  ┌── Public subnet 10.0.1.0/24 ───┐    ┌── Private subnet 10.0.3.0/24 ─┐│
│  │                                │    │                               ││
│  │  ┌──────────────┐              │    │  ┌──────────────┐             ││
│  │  │ Bastion EC2  │              │    │  │ Private EC2  │             ││
│  │  │ 10.0.1.76    │══════════════┼────┼─►│ 10.0.3.57    │             ││
│  │  │ public IP    │              │local  │ no public IP │             ││
│  │  │ SG: 22 open  │              │route  │ SG: 22 only  │             ││
│  │  └──────────────┘              │    │  │ from bastion │             ││
│  │         ▲                      │    │  └──────────────┘             ││
│  └─────────┼──────────────────────┘    └───────────────────────────────┘│
│            │                                                            │
└────────────┼────────────────────────────────────────────────────────────┘
             │
        ┌────┴────┐
        │ Internet│
        │ Gateway │
        └────┬────┘
             │
        Admin laptop (public IP)
```

### 2.2 Nhận diện sai lầm phổ biến: 1 lệnh `ssh -J` KHÔNG phải 1 TCP connection

Khi bạn chạy:

```bash
ssh -i singapo.pem -J ec2-user@47.129.159.247 ec2-user@10.0.3.57
```

Thực tế có **2 TCP connections riêng biệt** và **2 SSH handshakes riêng biệt**:

```text
Connection 1 (Laptop ↔ Bastion):
  - TCP: laptop:ephemeral ↔ 47.129.159.247:22
  - SSH: authenticate với bastion bằng key

Connection 2 (Bastion ↔ Private EC2):
  - TCP: 10.0.1.76:ephemeral ↔ 10.0.3.57:22
  - SSH: authenticate với private EC2 bằng key
```

Hai connection này độc lập. Tắt một cái không tự tắt cái kia (nếu không dùng `-J`). Mỗi connection bị kiểm bởi **bộ NACL/SG riêng của subnet chứa nó**.

### 2.3 Trace packet chi tiết (xem diagram đi kèm)

Diagram dưới đây vẽ đầy đủ **4 luồng traffic chính**:

![Full SSH flow qua Bastion gồm 2 TCP connections và 4 luồng traffic](/diagrams/vpc-ssh-full-flow-2-connections.png)

```text
2 TCP connections × 2 chiều = 4 luồng traffic
```

Lưu ý: đây là 4 **flow direction** khi xét NACL/SG, không phải chỉ đúng 4 packet vật lý. Thực tế TCP/SSH sẽ có nhiều packet: SYN, SYN-ACK, ACK, SSH key exchange, encrypted data, keepalive, v.v.

| Luồng | Packet mẫu | Đi qua checkpoint nào |
|---|---|---|
| **C1 Request** (Laptop→Bastion) | `59.153.x.x:51544 → 47.129.159.247:22` | IGW → facing NACL IN(22) → bastion-SG IN(22) → Bastion |
| **C1 Response** (Bastion→Laptop) | `47.129.159.247:22 → 59.153.x.x:51544` | Bastion → bastion-SG OUT(auto) → facing NACL OUT(ephemeral) → IGW |
| **C2 Request** (Bastion→Private) | `10.0.1.76:45678 → 10.0.3.57:22` | bastion-SG OUT(22) → facing NACL OUT(22) → public RT → VPC router → service NACL IN(22) → service-SG IN(22) → Private EC2 |
| **C2 Response** (Private→Bastion) | `10.0.3.57:22 → 10.0.1.76:45678` | service-SG OUT(auto) → service NACL OUT(ephemeral) → VPC router → facing NACL IN(ephemeral) → bastion-SG IN(auto) → Bastion |

#### Vì sao C2 Response không về port 22 của Bastion?

Ở connection 2, Bastion là **SSH client**, private EC2 là **SSH server**:

```text
Bastion:45678  --->  Private EC2:22
```

Port `45678` là ephemeral port do Bastion tự chọn khi mở connection. Khi private EC2 trả lời, TCP packet sẽ đảo chiều source/destination:

```text
Private EC2:22  --->  Bastion:45678
```

Vì NACL là **stateless**, NACL không tự hiểu đây là response hợp lệ. Nó chỉ nhìn packet hiện tại. Do packet đi vào public/facing subnet có **destination port = 45678**, facing NACL inbound phải allow ephemeral range từ private subnet.

> ⚠️ Điểm dễ sai: **NACL inbound của facing subnet phải mở ephemeral port** (ví dụ 32768-65535 hoặc 1024-65535 tùy OS/client) cho return traffic từ private subnet, vì return packet có destination port = ephemeral của Bastion, không phải 22. Xem chi tiết ở [`docs/diagrams/nacl-sg-step-by-step-packet-path.png`](docs/diagrams/nacl-sg-step-by-step-packet-path.png).

### 2.4 Rule set tối thiểu để 2 connection thông

**bastion-SG (gắn vào Bastion):**

```text
INBOUND  : TCP 22 from <admin-public-ip>/32     ← cho connection 1
OUTBOUND : TCP 22 to service-SG (sg-xxx)        ← cho connection 2 forward
```

**service-SG (gắn vào Private EC2):**

```text
INBOUND  : TCP 22 from bastion-SG (sg-xxx)
OUTBOUND : (stateful, auto-allow return)
```

**facing NACL (subnet public):**

```text
INBOUND  : TCP 22 from 0.0.0.0/0 (hoặc IP admin)            ← C1 req
           TCP 32768-65535 from 10.0.3.0/24                  ← C2 res (ephemeral!)
OUTBOUND : TCP 32768-65535 to <admin-public-ip>/32          ← C1 res (ephemeral!)
           TCP 22 to 10.0.3.0/24                            ← C2 req
```

**service NACL (subnet private):**

```text
INBOUND  : TCP 22 from 10.0.1.0/24                          ← C2 req
OUTBOUND : TCP 32768-65535 to 10.0.1.0/24                   ← C2 res (ephemeral!)
```

> Nguồn: [Custom network ACLs — VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/custom-network-acl.html). Phần "Ephemeral ports" giải thích rõ vì sao range 32768-65535 (Amazon Linux) hoặc 1024-65535 (NAT/ELB).

---

## Phần 3: SSH qua Bastion — 4 cách và vì sao khác nhau

Có 4 cách để từ laptop SSH tới private EC2 qua bastion. Tất cả đều tạo 2 TCP connections giống nhau, **chỉ khác ở chỗ ai giữ key và ai terminate SSH session 2**.

### Cách A: Copy key `.pem` lên bastion (❌ TỆ NHẤT)

```bash
scp singapo.pem ec2-user@47.129.159.247:~/
ssh ec2-user@47.129.159.247
ssh -i singapo.pem ec2-user@10.0.3.57
```

- Bastion giữ file key thật trên ổ cứng
- Bastion bị hack → attacker copy `.pem` → **lộ key vĩnh viễn**
- Không bao giờ nên làm vậy ngoài lab

### Cách B: `-A` Agent Forwarding (⚠️ Có rủi ro)

```bash
ssh-add singapo.pem              # nạp key vào agent trên laptop
ssh -A ec2-user@47.129.159.247   # forward agent socket sang bastion
ssh ec2-user@10.0.3.57           # bastion mượn agent laptop để ký
```

- Key file **không** trên bastion
- Nhưng socket `/tmp/ssh-XXXX/agent.NNN` tồn tại trên bastion trong suốt session
- Root trên bastion có thể mượn socket đó để ký challenge → login vào private EC2 (hoặc bất kỳ host nào key valid) mà không cần file key

### Cách C: `-J` ProxyJump (✅ KHUYẾN NGHỊ)

```bash
ssh -i singapo.pem -J ec2-user@47.129.159.247 ec2-user@10.0.3.57
```

- Bastion chỉ là **raw TCP tunnel**
- Laptop tự authenticate với private EC2 (handshake đi qua tunnel)
- Bastion chỉ thấy encrypted bytes, không có key, không có agent socket
- An toàn nhất trong 4 cách

### Cách D: `-L` Local Port Forwarding (thủ công)

```bash
# Terminal 1: mở tunnel
ssh -L 2222:10.0.3.57:22 ec2-user@47.129.159.247

# Terminal 2: dùng tunnel
ssh -p 2222 ec2-user@localhost
```

- Laptop mở port 2222 cục bộ, tunnel qua bastion tới `10.0.3.57:22`
- Tương tự `-J` nhưng setup thủ công, 2 terminal
- Hữu ích khi cần tunnel nhiều port cùng lúc (DB, JMX, web debug)

### Bảng so sánh 4 cách

| Tiêu chí | A: copy key | B: `-A` | C: `-J` | D: `-L` |
|---|---|---|---|---|
| File key trên bastion | ✗ Có | ✗ Không | ✗ Không | ✗ Không |
| Agent socket trên bastion | — | ✓ Có (rủi ro) | ✗ Không | ✗ Không |
| Bastion bị hack → lộ key | **Vĩnh viễn** | Chỉ trong session | Không | Không |
| Số lệnh | 3 | 3 | 1 | 2 |
| Tốc độ authenticate | Nhanh | Chậm (round trip agent) | Nhanh | Nhanh |
| Đề xuất | Không | Hạn chế | **Default** | Khi cần multi-port |

---

## Phần 4: ssh-agent, ProxyJump và Agent Forwarding

### 4.1 ssh-agent là gì

`ssh-agent` là một **background process** giữ private key (đã giải mã) trong RAM, ký challenge SSH khi được nhờ, **không bao giờ đưa key ra ngoài**.

```text
ssh-agent (RAM)
  ├── singapo.pem        ← đã giải mã, sống đến khi logout/reboot
  ├── bastion-key.pem
  └── github-key.pem
```

### 4.2 Vòng đời key trong agent

```text
Bật máy
  ↓
ssh-agent khởi động (thường tự động)
  ↓ RAM trống
ssh-add singapo.pem
  ↓ gõ passphrase 1 LẦN DUY NHẤT
  ↓ key (đã giải mã) vào RAM agent
  ↓
ssh ec2-user@...   ← không cần gõ passphrase nữa, agent ký hộ
  ↓
Tắt máy / kill agent
  ↓ RAM bị xóa → key mất, phải ssh-add lại sau reboot
```

Trừ khi dùng **macOS Keychain** (`ssh-add --apple-use-keychain`) hoặc GNOME Keyring để tự nạp lại sau reboot.

### 4.3 Lệnh thường dùng

| Lệnh | Tác dụng |
|---|---|
| `ssh-agent` | Khởi động daemon |
| `ssh-add key.pem` | Nạp key vào agent |
| `ssh-add -l` | Xem agent đang giữ key nào |
| `ssh-add -D` | Xóa hết key khỏi agent |
| `ssh -A host` | Forward agent socket sang remote |
| `ssh -J jump target` | Dùng bastion làm tunnel (an toàn hơn) |

### 4.4 Vì sao `-A` nguy hiểm hơn `-J`

`-A` tạo **UNIX socket tunnel** từ bastion về agent trên laptop:

```text
/tmp/agent.BASTION (trên bastion, thuộc quyền ec2-user)
       │ tunnel qua SSH connection
       ▼
/tmp/agent.LAPTOP (trên laptop)
       │
       ▼
   ssh-agent (RAM laptop) → key
```

Bất kỳ process nào đọc được socket đó đều mượn được agent:

```bash
# Nếu attacker có root trên bastion trong lúc session còn sống:
SSH_AUTH_SOCK=/tmp/ssh-XXXX/agent.NNN ssh ec2-user@10.0.3.57   # mượn agent của BẠN
SSH_AUTH_SOCK=/tmp/.../agent.NNN git clone git@github.com:you/private-repo
```

Agent ký challenge vì nó **không phân biệt ai request**. Key không lộ, nhưng **khả năng ký bị mượn** trong suốt session.

`-J` không có rủi ro này vì không có agent socket nào trên bastion.

### 4.5 Khi nào THỰC SỰ cần `-A`

Chỉ dùng `-A` khi bastion cần **tự authenticate với bên thứ 3** (GitHub, container registry,Artifact store...) mà không muốn copy key:

```bash
ssh -A ec2-user@bastion
git clone git@github.com:myorg/private-app.git   # bastion push/pull GitHub bằng key của bạn
```

Mọi trường hợp SSH vào private EC2 khác → dùng `-J`.

---

## Phần 5: AWS Systems Manager Session Manager

Đây là **cách thay thế bastion phổ biến nhất** trên AWS-native infra. KHÔNG cần bastion, KHÔNG cần mở port 22, KHÔNG cần SSH key.

### 5.1 Cách hoạt động

```text
Admin laptop                          AWS SSM service
   │                                       ▲
   │ aws ssm start-session                 │
   └───────────────────────────────────────┤
                                           │
              Private EC2 (SSM Agent) ─────┘
              outbound HTTPS :443 tới SSM endpoint
```

- EC2 chạy **SSM Agent** (Amazon Linux cài sẵn)
- Agent mở **outbound HTTPS :443** tới SSM service (hoặc qua VPC endpoint)
- Admin auth bằng **IAM credentials** (không phải SSH key)
- Traffic end-to-end TLS, session data có thể log vào S3/CloudWatch Logs
- Mọi session được log vào **CloudTrail**

> Nguồn: [AWS blog "Toward a bastion-less world"](https://aws.amazon.com/blogs/infrastructure-and-automation/toward-a-bastion-less-world/), [Session Manager prerequisites](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-prerequisites.html)

### 5.2 Prerequisites

| Yêu cầu | Chi tiết |
|---|---|
| SSM Agent | Có sẵn trên Amazon Linux 2/2023, Windows. Min version 2.3.68.0+ cho Session Manager |
| IAM role cho EC2 |_attached instance profile_ với `AmazonSSMManagedInstanceCore` (hoặc policy `ssmmessages:*` inline) |
| Network | Outbound HTTPS :443 tới SSM endpoints, **HOẶC** SSM VPC endpoints (PrivateLink) nếu private subnet không có NAT |
| (Tuỳ chọn) KMS key | Để mã hóa session data |
| (Tuỳ chọn) S3/CloudWatch | Để log session output |

### 5.3 Cách dùng

```bash
# Cài Session Manager plugin cho AWS CLI trước
# Shell tương tác:
aws ssm start-session --target i-0abc123def456

# Port forwarding tới service private (VD RDS):
aws ssm start-session \
  --target i-0abc123def456 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"hostNumber":["10.0.3.57"],"portNumber":["3306"]}'
```

Hoặc dùng `ssh` quen thuộc với SSM làm transport (qua SSH ProxyCommand):

```bash
# ~/.ssh/config
Host i-*
  ProxyCommand sh -c "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"

# Rồi:
ssh i-0abc123def456
```

### 5.4 Ưu/nhược

| ✅ Ưu điểm | ❌ Nhược điểm |
|---|---|
| Không cần bastion, không mở port 22 | Cần SSM Agent + IAM role đúng |
| Auth bằng IAM, không cần manage SSH key | Instance phải reach SSM endpoint (NAT hoặc VPC endpoint) |
| CloudTrail log built-in | Không phải tool nào cũng tương thích (scp hơi lắt lé) |
| Hỗ trợ port forwarding tới RDS/internal web | IAM quyền `ssm:StartSession` cần scope kỹ |
| Miễn phí (chỉ tính SSM API call) | Windows session management đôi khi chậm |

---

## Phần 6: Amazon EC2 Instance Connect Endpoint

Ra mắt năm 2023, EIC Endpoint là **identity-aware TCP proxy** do AWS quản lý. Vẫn dùng `ssh` client quen thuộc nhưng không cần bastion, không cần public IP, không cần IGW cho VPC.

> Nguồn: [Connect using EC2 Instance Connect Endpoint](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-with-ec2-instance-connect-endpoint.html), [AWS Compute Blog — EIC Endpoint](https://aws.amazon.com/blogs/compute/secure-connectivity-from-public-to-private-introducing-ec2-instance-connect-endpoint-june-13-2023/)

### 6.1 Cách hoạt động

```text
Admin laptop
   │ WebSocket tunnel (auth bằng IAM credentials)
   ▼
EC2 Instance Connect Endpoint  ← AWS-managed, đặt trong subnet của VPC
   │ private IP, không expose ra internet
   ▼
Private EC2 (port 22 nội bộ VPC)
```

- Tạo 1 endpoint trong VPC (chọn subnet + SG)
- AWS push **ephemeral SSH key** (RSA, TTL 60 giây) vào `authorized_keys` của instance
- Admin SSH qua WebSocket tunnel, IAM auth và authorize **trước khi** traffic vào VPC
- Mọi attempt (thành công + thất bại) log vào **CloudTrail**

### 6.2 Prerequisites

| Yêu cầu | Chi tiết |
|---|---|
| EIC Endpoint | Tạo bằng Console/CLI/Terraform trong 1 subnet của VPC |
| IAM permission | `ec2-instance-connect:OpenTunnel`, `ec2:DescribeInstances`, `ec2-instance-connect:SendSSHPublicKey` |
| Instance | Có thể reach được từ endpoint (route table cho phép), có SG mở 22 cho endpoint |
| **KHÔNG cần** | Bastion, public IP, IGW, SSM Agent |

### 6.3 Cách dùng

```bash
# Tạo endpoint
aws ec2 create-instance-connect-endpoint \
  --subnet-id subnet-0abc123 \
  --security-group-id sg-0xyz789

# SSH qua endpoint (CLI tự push ephemeral key):
aws ec2-instance-connect ssh --instance-id i-0abc123def456

# Hoặc scp:
scp -o ProxyCommand="aws ec2-instance-connect open-tunnel --instance-id i-0abc123def456" \
    file.txt i-0abc123def456:/tmp/
```

Vẫn dùng OpenSSH client, PuTTY, WinSCP — tooling không đổi.

### 6.4 Ưu/nhược

| ✅ Ưu điểm | ❌ Nhược điểm |
|---|---|
| Không bastion, không public IP, không IGW | AWS only (không multi-cloud) |
| UX vẫn là `ssh` quen thuộc | Cần tạo endpoint trước (1 lần/VPC) |
| IAM auth + CloudTrail + ephemeral key | Cross-AZ data transfer có phí |
| Miễn phí (trừ cross-AZ transfer) | Chỉ support SSH/RDP qua TCP, không phải mọi port |

### 6.5 So sánh SSM Session Manager vs EIC Endpoint

| | SSM Session Manager | EIC Endpoint |
|---|---|---|
| Cài agent trên instance | **Có** (SSM Agent) | Không |
| Auth | IAM | IAM + ephemeral SSH key |
| UX | `aws ssm start-session` | `ssh`/`scp` quen thuộc |
| Outbound từ instance | HTTPS :443 tới SSM | Không cần (instance bị động) |
| Port forwarding tới host khác | ✓ (RDS, internal web) | ✓ |
| Multi-cloud | Không | Không |
| Phù hợp khi | Đã có SSM Agent, muốn audit mạnh | Muốn UX ssh thuần, zero-agent |

---

## Phần 7: AWS Client VPN

Khác bastion và SSM/EIC, Client VPN là **mạng riêng ảo** — client kết nối VPN rồi instance private "thấy" client như 1 IP nội bộ.

### 7.1 Cách hoạt động

```text
Admin laptop ──VPN tunnel──► AWS Client VPN endpoint (ngang hàng VPC)
                                  │
                                  ▼ authorize tới private subnet
                              Private EC2 (port 22 nội bộ)
```

- Cài AWS VPN client (hoặc OpenVPN client)
- Auth bằng **mutual TLS certificate** (ACM) hoặc **SAML SSO** (IAM Identity Center/Okta)
- Client nhận IP từ CIDR VPN, route tới subnet private
- Mỗi user có certificate riêng → audit được

### 7.2 Khi nào dùng

- Cả dev team cần truy cập nhiều resource nội bộ (DB, internal web, EC2) cùng lúc
- Cần SSO enterprise (SAML với Okta/Azure AD)
- Muốn một đường hầm "all traffic" thay vì từng port

### 7.3 Ưu/nhược

| ✅ | ❌ |
|---|---|
| Cả team vào 1 lần, dùng mọi tool nội bộ | Chi phí endpoint theo giờ + connection-hour |
| SAML SSO, MFA dễ tích hợp | Setup phức tạp hơn SSM/EIC |
| Route cả subnet, không cần proxy từng host | Client phải cài VPN client |

---

## Phần 8: Third-party hardened access (Teleport, Boundary, Tailscale)

Khi enterprise cần nhiều hơn IAM audit (VD: session recording, RBAC fine-grained, MFA per-session), người ta dựng **bastion hardened** bằng tool chuyên dụng.

| Tool | Tính năng nổi bật | Khi nào dùng |
|---|---|---|
| **Teleport** (Gravitational) | RBAC bằng roles, session recording, short-lived certificate, access plugins (Slack/Jira approval) | Enterprise hybrid, cần approval workflow |
| **HashiCorp Boundary** | Identity-based access, không cần manage SSH key, dynamic credential, multi-cloud | Đã dùng HashiCorp stack, multi-cloud |
| **Tailscale SSH** | WireGuard mesh, SSH mà không cần SSH key (client cert từ Tailscale), zero-config | Team quen SSH, muốn zero-trust nhẹ cân |
| **AWS Verified Access** | AWS-native, verify device posture + identity trước khi cho vào app | Đã dùng AWS Directory/Identity Center |

Đặc điểm chung: **thay SSH key dài hạn bằng short-lived certificate + RBAC + audit**, từ đó giảm rủi ro "key lộ vĩnh viễn".

---

## Phần 9: Decision matrix — chọn cách nào

### 9.1 Bảng tổng hợp

| Tiêu chí | Bastion + `-J` | SSM Session Manager | EIC Endpoint | Client VPN | Teleport/Boundary |
|---|---|---|---|---|---|
| Cần EC2 public | ✓ Bastion | ✗ | ✗ | ✗ | Tùy setup |
| Mở port 22 ra internet | ✓ (cho bastion) | ✗ | ✗ | ✗ | ✗ |
| Auth bằng | SSH key | IAM | IAM + ephemeral key | Cert/SAML | Short-lived cert |
| Cài agent | Không | SSM Agent | Không | VPN client | Agent riêng |
| Audit | Tự setup | CloudTrail built-in | CloudTrail built-in | Connection log | Session recording |
| Cost | Bastion chạy 24/7 | Free | Free (trừ cross-AZ) | Endpoint per-hour + per-connection | License |
| Multi-cloud | ✓ | ✗ AWS | ✗ AWS | ✓ | ✓ |
| UX | `ssh` quen thuộc | `aws ssm` | `ssh` quen thuộc | Mọi tool nội bộ | `tsh`/`boundary` |

### 9.2 Decision tree

```text
Instance nằm 100% trong AWS?
├─ KHÔNG (hybrid/multi-cloud)
│   └─→ Dùng Bastion hardened (Teleport/Boundary) hoặc Client VPN
└─ CÓ
    ├─ Đã có SSM Agent + IAM role + (NAT hoặc VPC endpoint)?
    │   └─→ SSM Session Manager  ← default, audit mạnh nhất
    ├─ Muốn UX ssh thuần, không muốn cài agent?
    │   └─→ EC2 Instance Connect Endpoint
    ├─ Cả team cần vào nhiều resource cùng lúc?
    │   └─→ Client VPN
    └─ Lab / học fundamentals / interview?
        └─→ Bastion truyền thống + `-J`
```

### 9.3 Thực tế ngành 2024-2026

```text
- Startup nhỏ / lab:           Raw EC2 bastion + ssh -J
- Scale-up AWS-native:         Chuyển sang SSM Session Manager
- Enterprise / regulated:      Teleport / Boundary / Client VPN
- Legacy / on-prem hybrid:     Vẫn bastion truyền thống, dần migrate
```

AWS Managed Services (AMS) cho enterprise dùng **bastion trong Shared Services account**, chỉ reach được qua VPN/Direct Connect, auth bằng Active Directory. Bastion không "chết", nó **tiến hóa** thành bastion hardened.

---

## Phần 10: Production patterns

### 10.1 Bastion HA (High Availability)

Đừng để 1 bastion = single point of failure. Pattern:

```text
- 2 bastion ở 2 AZ khác nhau
- Đặt trong Auto Scaling Group (min=2, max=2)
- Phía trước đặt NLB (Network Load Balancer) với listener :22
- DNS record (Route 53) trỏ tới NLB
```

Khi 1 bastion hỏng, ASG tự launch cái mới. Admin SSH tới DNS name thay vì IP cố định.

### 10.2 Bastion trong private subnet (pattern của AWS CDK blog)

> "Deploy bastion hosts into **private subnets** rather than public ones, providing temporary and limited access... leveraging AWS Systems Manager Session Manager for secure connectivity."
> — [AWS CDK blog](https://aws.amazon.com/blogs/infrastructure-and-automation/deploy-bastion-hosts-into-private-subnets-with-aws-cdk/)

Đặt bastion trong **private subnet**, không có public IP, vào qua SSM. Rủi ro attack surface giảm mạnh.

### 10.3 Hardening checklist

```text
□ SG inbound chỉ mở 22 cho IP admin cụ thể (KHÔNG 0.0.0.0/0)
□ Dùng SSH key Ed25519 (mạnh hơn RSA), có passphrase
□ Tắt password authentication: /etc/ssh/sshd_config -> PasswordAuthentication no
□ Tắt root login: PermitRootLogin no
□ Cài fail2ban hoặc AWS GuardDuty
□ Bật session recording (auditd, tlog, Teleport)
□ Bắt buộc MFA (PAM + Duo, hoặc Teleport/Boundary)
□ Patch định kỳ qua SSM Patch Manager
□ IAM instance profile least-privilege (không AmazonS3FullAccess)
□ CloudWatch Logs thu thump /var/log/secure
□ Auto-terminate sau N giờ không hoạt động (lambda + CloudWatch)
```

### 10.4 Session recording

| Tool | Cách record |
|---|---|
| `tlog` (OSS) | Record terminal session, lưu JSON log |
| Teleport | Built-in session recording + playback |
| Boundary | Session recording, có thể disable selective |
| AWS SSM | `s3BucketName` / `cloudWatchLogGroup` trong Session preferences |
| auditd + syslog | Log command, không record video terminal |

> Compliance (SOC 2, HIPAA, PCI DSS) thường yêu cầu session recording cho mọi admin access.

---

## Phần 11: Common pitfalls

### Pitfall 1: Nghĩ `-A` và `-J` giống nhau về security

```text
-J : bastion chỉ là tunnel, không có agent socket → an toàn
-A : bastion có agent socket → root mượn được trong session
```

→ Default là `-J`, chỉ dùng `-A` khi bastion cần git push/pull.

### Pitfall 2: NACL inbound của facing subnet chỉ mở port 22

```text
SAI: facing NACL IN : TCP 22 from 10.0.3.0/24
      → return traffic từ private EC2 có dst port ephemeral → bị DROP

ĐÚNG: facing NACL IN : TCP 32768-65535 from 10.0.3.0/24
```

NACL stateless → phải allow cả return traffic, và return có destination port = ephemeral.

### Pitfall 3: Copy `.pem` lên bastion

```text
Bastion bị hack 1 phút → scp .pem ra ngoài → lộ key vĩnh viễn
```

→ Không bao giờ. Dùng `-J` hoặc `-A`.

### Pitfall 4: Quên rằng `-J` tạo 2 SSH session, mỗi session cần 1 key hợp lệ

Nếu bastion và private EC2 dùng **2 keypair khác nhau**, phải config cả 2:

```text
# ~/.ssh/config
Host bastion
  HostName 47.129.159.247
  IdentityFile ~/.ssh/bastion-key.pem

Host private-ec2
  HostName 10.0.3.57
  IdentityFile ~/.ssh/private-ec2-key.pem
  ProxyJump bastion
```

### Pitfall 5: SSM không work vì thiếu VPC endpoint

Private subnet **không có NAT** → SSM Agent không reach SSM service qua internet. Phải tạo **SSM VPC endpoints** (PrivateLink):

```text
ssm.<region>.amazonaws.com
ssmmessages.<region>.amazonaws.com
ec2messages.<region>.amazonaws.com
```

### Pitfall 6: EIC Endpoint không reach instance vì route table/SG

Endpoint đặt ở subnet A, instance ở subnet B. Phải:

- Route table của subnet A cho phép tới subnet B (local route auto)
- SG của instance cho phép 22 từ SG của endpoint

---

## Phần 12: Cheatsheet

### Mối quan hệ giữa các khái niệm

```text
Private EC2 (không public IP)
    │
    │ "Làm sao vào được?"
    ├─ Bastion truyền thống ─── ssh -J bastion ────► cần key, mở port 22 cho bastion
    ├─ SSM Session Manager ──── aws ssm ─────────► cần SSM Agent + IAM + (NAT hoặc VPC endpoint)
    ├─ EIC Endpoint ─────────── aws ec2-... ssh ──► cần endpoint trong VPC, IAM, ephemeral key
    ├─ Client VPN ───────────── VPN tunnel ───────► cần VPN endpoint + cert/SAML
    └─ Teleport/Boundary ────── tsh/boundary ────► cần tool riêng, RBAC + recording
```

### 1 dòng cho mỗi cách

| Cách | 1 dòng tóm tắt |
|---|---|
| Bastion + `-J` | Tunnel TCP qua bastion, laptop tự auth, không lộ key |
| Bastion + `-A` | Forward agent socket sang bastion, root mượn được trong session |
| SSM Session Manager | Không bastion, IAM auth, CloudTrail built-in, cần agent |
| EIC Endpoint | Identity-aware TCP proxy, ssh UX thuần, ephemeral key, không cần agent |
| Client VPN | Cả team vào VPC như nội bộ, cần VPN client + endpoint |
| Teleport/Boundary | Bastion hardened với RBAC, MFA, session recording |

### Lệnh nhanh

```bash
# Bastion -J (default cho lab)
ssh -i singapo.pem -J ec2-user@47.129.159.247 ec2-user@10.0.3.57

# Bastion -A (chỉ khi cần git từ bastion)
ssh-add singapo.pem
ssh -A ec2-user@47.129.159.247

# SSM Session Manager
aws ssm start-session --target i-0abc123def456

# EIC Endpoint
aws ec2-instance-connect ssh --instance-id i-0abc123def456

# Port forwarding tới RDS qua SSM
aws ssm start-session --target i-0abc123def456 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"hostNumber":["10.0.3.57"],"portNumber":["3306"]}'
```

---

## Gợi ý khi gặp trong đề thi / phỏng vấn

- **"How to securely access EC2 in private subnet?"** → Bastion host, SSM Session Manager, EIC Endpoint, Client VPN. AWS hiện nay ưu tiên **Session Manager** vì không cần mở port 22.
- **"Bastion vs NAT Gateway?"** → Bastion = admin **inbound** SSH access. NAT Gateway = **outbound** Internet access cho private subnet. Khác hẳn mục đích.
- **"SSM Agent failed to connect?"** → Check IAM role (`AmazonSSMManagedInstanceCore`), check outbound HTTPS :443 tới SSM endpoints, check SSM VPC endpoints nếu không có NAT.
- **"No public IP, no bastion, no NAT — how to SSH?"** → **EIC Endpoint** hoặc SSM với VPC endpoints.
- **"Why ProxyJump over Agent Forwarding?"** → `-A` forward agent socket → root trên bastion mượn được. `-J` chỉ tunnel, bastion không thấy key.
- **"Session recording cho compliance?"** → Teleport, Boundary, hoặc SSM session logging vào S3/CloudWatch.
- **"NACL inbound của facing subnet cần gì để SSH return traffic?"** → Ephemeral port range (32768-65535 cho Amazon Linux) từ private subnet CIDR.

---

## Nguồn AWS chính thức

- [Custom network ACLs for your VPC — Ephemeral ports](https://docs.aws.amazon.com/vpc/latest/userguide/custom-network-acl.html) — giải thích vì sao range ephemeral khác nhau theo OS
- [Security group rules — VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html) — SG stateful, default outbound all
- [Amazon EC2 security group connection tracking](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-connection-tracking.html) — vì sao SG stateful
- [Connect using EC2 Instance Connect Endpoint](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-with-ec2-instance-connect-endpoint.html) — identity-aware TCP proxy
- [AWS Compute Blog — EIC Endpoint (June 2023)](https://aws.amazon.com/blogs/compute/secure-connectivity-from-public-to-private-introducing-ec2-instance-connect-endpoint-june-13-2023/)
- [Session Manager prerequisites](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-prerequisites.html) — SSM Agent version, IAM, network
- [AWS blog "Toward a bastion-less world"](https://aws.amazon.com/blogs/infrastructure-and-automation/toward-a-bastion-less-world/) — Session Manager thay bastion
- [AWS blog "Port Forwarding using SSM Session Manager"](https://aws.amazon.com/blogs/aws/new-port-forwarding-using-aws-system-manager-sessions-manager/)
- [AWS blog "Deploy bastion hosts into private subnets with CDK"](https://aws.amazon.com/blogs/infrastructure-and-automation/deploy-bastion-hosts-into-private-subnets-with-aws-cdk/)
- [Prescriptive Guidance — Access a bastion host by using Session Manager and EC2 Instance Connect](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/access-a-bastion-host-by-using-session-manager-and-amazon-ec2-instance-connect.html)

---

_Doc đi kèm diagram render trực tiếp từ [`/diagrams/vpc-ssh-full-flow-2-connections.png`](/diagrams/vpc-ssh-full-flow-2-connections.png). File nguồn chỉnh sửa: [`docs/diagrams/vpc-ssh-full-flow-2-connections.excalidraw`](docs/diagrams/vpc-ssh-full-flow-2-connections.excalidraw). Xem thêm [`bastion-host.md`](bastion-host.md) cho phần nền tảng._
