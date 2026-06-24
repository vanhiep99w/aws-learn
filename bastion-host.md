# Bastion Host

## Mục lục

- [Tổng quan](#tổng-quan)
- [Bastion Host là gì](#bastion-host-là-gì)
- [Bastion Host giải quyết vấn đề gì](#bastion-host-giải-quyết-vấn-đề-gì)
- [Kiến trúc cơ bản](#kiến-trúc-cơ-bản)
- [Luồng truy cập SSH qua Bastion Host](#luồng-truy-cập-ssh-qua-bastion-host)
- [SSH Jump / ProxyJump](#ssh-jump--proxyjump)
- [Security Group mẫu](#security-group-mẫu)
- [Network ACL cần lưu ý](#network-acl-cần-lưu-ý)
- [Bastion Host và NAT Gateway khác nhau thế nào](#bastion-host-và-nat-gateway-khác-nhau-thế-nào)
- [Bastion Host truyền thống vs Session Manager](#bastion-host-truyền-thống-vs-session-manager)
- [Thiết kế Bastion Host an toàn](#thiết-kế-bastion-host-an-toàn)
- [High Availability cho Bastion Host](#high-availability-cho-bastion-host)
- [Logging và audit](#logging-và-audit)
- [Các biến thể thường gặp](#các-biến-thể-thường-gặp)
- [Troubleshooting](#troubleshooting)
- [Lỗi hiểu nhầm thường gặp](#lỗi-hiểu-nhầm-thường-gặp)
- [Gợi ý khi gặp trong đề thi AWS](#gợi-ý-khi-gặp-trong-đề-thi-aws)
- [Nguồn AWS chính thức](#nguồn-aws-chính-thức)

---

## Tổng quan

**Bastion Host** còn gọi là **Jump Server** hoặc **Jump Box**. Đây là một máy chủ trung gian dùng để truy cập vào các tài nguyên nằm trong mạng private.

Trong AWS, Bastion Host thường là một **Amazon EC2 instance đặt trong public subnet**. Admin/devops SSH vào Bastion Host trước, sau đó từ Bastion Host mới SSH tiếp vào EC2 instance nằm trong private subnet.

```text
Admin laptop
   │
   │ SSH/RDP qua Internet
   ▼
Public subnet
[Bastion Host / Jump Server]
   │
   │ SSH/RDP qua private IP trong VPC
   ▼
Private subnet
[Private EC2 / App Server / Admin Server]
```

Mục tiêu chính:

- Không expose trực tiếp EC2 private ra Internet.
- Gom luồng quản trị SSH/RDP vào một điểm kiểm soát.
- Dễ giới hạn source IP, audit, logging, hardening.
- Giữ private server không cần public IP.

> AWS VPC documentation khuyến nghị dùng **private subnets** cho instance không nên được truy cập trực tiếp từ Internet, và có thể dùng **bastion host** hoặc **NAT gateway** cho Internet access từ private subnet. Cần hiểu đúng: Bastion chủ yếu phục vụ **admin inbound access**, còn NAT Gateway phục vụ **outbound Internet access**.

---

## Bastion Host là gì

Nói ngắn gọn:

> **Bastion Host = Jump Server trong AWS.**

Nó là một EC2 instance được harden kỹ hơn bình thường, đứng ở rìa network để làm cổng vào quản trị.

Ví dụ bạn có một app server trong private subnet:

```text
Private EC2
- Private IP: 10.0.2.20
- Public IP: không có
- Security Group: không allow SSH từ Internet
```

Từ laptop ngoài Internet, bạn không thể SSH trực tiếp vào `10.0.2.20`, vì đó là private IP trong VPC. Thay vào đó bạn đi qua Bastion:

```text
Laptop public IP 203.0.113.10
   │
   │ SSH tới public IP của Bastion
   ▼
Bastion public IP 54.10.10.10
Bastion private IP 10.0.1.10
   │
   │ SSH tới private IP của EC2
   ▼
Private EC2 10.0.2.20
```

Bastion không phải là app server, không phải NAT Gateway, không phải firewall appliance đầy đủ. Nó là **điểm nhảy quản trị**.

---

## Bastion Host giải quyết vấn đề gì

Nếu EC2 private cần được quản trị, có vài cách:

| Cách | Mô tả | Nhược điểm |
|---|---|---|
| Gắn public IP cho private EC2 | SSH trực tiếp vào từng EC2 | Không còn thật sự private, attack surface lớn |
| Mở VPN/Direct Connect | Admin vào VPC qua mạng riêng | Tốt nhưng cần setup network riêng |
| Dùng Bastion Host | Chỉ expose một điểm vào | Phải quản lý bastion, SSH key, patching |
| Dùng SSM Session Manager | Không cần mở inbound port | Cần IAM/SSM Agent/connectivity tới SSM |

Bastion Host phù hợp khi:

- Hệ thống cũ vẫn cần SSH/RDP truyền thống.
- Team đã quen dùng SSH toolchain.
- Cần port forwarding/tunnel nhanh vào tài nguyên private.
- Chưa triển khai đầy đủ Session Manager, VPN hoặc Zero Trust access.

Tuy nhiên trong kiến trúc hiện đại, nếu có thể, nên cân nhắc **AWS Systems Manager Session Manager** để giảm nhu cầu mở inbound SSH và giảm vận hành jump server.

---

## Kiến trúc cơ bản

Một setup Bastion Host truyền thống thường gồm:

| Thành phần | Vị trí | Vai trò |
|---|---|---|
| VPC | AWS account/region | Network boundary chính |
| Internet Gateway | Attach vào VPC | Cho public subnet ra/vào Internet |
| Public subnet | Route `0.0.0.0/0` tới Internet Gateway | Chứa Bastion Host |
| Bastion Host | EC2 có public IP hoặc Elastic IP | Nhận SSH/RDP từ admin |
| Private subnet | Không route trực tiếp tới Internet Gateway | Chứa app/database/internal EC2 |
| NAT Gateway | Public subnet, optional | Cho private EC2 đi ra Internet để update/download |
| Security Group của Bastion | Instance level firewall | Allow SSH/RDP từ IP admin/VPN |
| Security Group của private EC2 | Instance level firewall | Allow SSH/RDP từ SG của Bastion |
| Network ACL | Subnet level firewall | Defense-in-depth, stateless |

Ví dụ route table:

```text
Public subnet route table:
10.0.0.0/16    local
0.0.0.0/0      igw-xxxxxxxx

Private subnet route table:
10.0.0.0/16    local
# Không có route 0.0.0.0/0 tới Internet Gateway
# Có thể có route 0.0.0.0/0 tới NAT Gateway nếu cần outbound Internet
```

Diagram tổng quát:

```text
                         VPC 10.0.0.0/16
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Public subnet 10.0.1.0/24             Private subnet 10.0.2.0/24   │
│  ┌──────────────────────┐              ┌─────────────────────────┐  │
│  │ Bastion Host         │ SSH private  │ Private EC2             │  │
│  │ Public IP: 54.x.x.x  │─────────────►│ Private IP: 10.0.2.20   │  │
│  │ Private IP: 10.0.1.10│              │ No public IP            │  │
│  └──────────▲───────────┘              └─────────────────────────┘  │
│             │                                                       │
└─────────────┼───────────────────────────────────────────────────────┘
              │ SSH 22 từ IP admin
              │
        Internet Gateway
              │
              ▼
        Admin laptop
```

---

## Luồng truy cập SSH qua Bastion Host

Ví dụ:

```text
Admin laptop public IP: 203.0.113.10
Bastion public IP:      54.10.10.10
Bastion private IP:     10.0.1.10
Private EC2 IP:         10.0.2.20
```

### Bước 1: Admin SSH vào Bastion Host

```bash
ssh -i bastion-key.pem ec2-user@54.10.10.10
```

Traffic:

```text
203.0.113.10:<ephemeral-port>  --->  54.10.10.10:22
```

Security Group của Bastion cần allow:

```text
Inbound:
TCP 22 từ 203.0.113.10/32
```

Không nên allow:

```text
TCP 22 từ 0.0.0.0/0
```

### Bước 2: Từ Bastion SSH vào EC2 private

```bash
ssh ec2-user@10.0.2.20
```

Traffic:

```text
10.0.1.10:<ephemeral-port>  --->  10.0.2.20:22
```

Security Group của EC2 private nên allow source là **Security Group của Bastion**, không phải Internet:

```text
Inbound:
TCP 22 từ sg-bastion
```

Cách này tốt hơn allow theo CIDR rộng như `10.0.0.0/16`, vì nếu instance khác trong VPC bị compromise thì cũng không tự nhiên SSH được vào private EC2.

---

## SSH Jump / ProxyJump

Bạn không nhất thiết phải SSH vào Bastion rồi gõ tiếp SSH thủ công. SSH client hỗ trợ jump host.

### Cách 1: Dùng `-J`

```bash
ssh -i private-key.pem \
  -J ec2-user@54.10.10.10 \
  ec2-user@10.0.2.20
```

Ý nghĩa:

```text
Local machine -> Bastion -> Private EC2
```

### Cách 2: Dùng `~/.ssh/config`

```sshconfig
Host bastion
  HostName 54.10.10.10
  User ec2-user
  IdentityFile ~/.ssh/bastion-key.pem

Host private-app
  HostName 10.0.2.20
  User ec2-user
  IdentityFile ~/.ssh/private-key.pem
  ProxyJump bastion
```

Sau đó chỉ cần:

```bash
ssh private-app
```

### Cảnh báo về private key

Không nên copy private key của private EC2 lên Bastion nếu không cần. Nếu Bastion bị compromise, attacker có thể lấy key đó để đi tiếp vào các máy khác.

Các lựa chọn an toàn hơn:

- Dùng SSH agent forwarding cẩn thận.
- Dùng `ProxyJump` từ laptop, giữ private key trên laptop.
- Dùng EC2 Instance Connect hoặc Session Manager.
- Dùng short-lived credentials/key thay vì long-term SSH key.

Nếu bắt buộc dùng agent forwarding, chỉ bật cho host cụ thể, không bật global cho mọi host.

---

## Security Group mẫu

Security Group là **stateful**. Nếu inbound request được allow, response traffic chiều ngược lại tự được cho phép.

### Bastion Host Security Group

Inbound:

| Type | Protocol | Port | Source | Ghi chú |
|---|---|---:|---|---|
| SSH | TCP | 22 | `203.0.113.10/32` | Chỉ IP admin hoặc VPN office |
| RDP | TCP | 3389 | `203.0.113.10/32` | Chỉ dùng nếu Bastion Windows |

Outbound:

| Type | Protocol | Port | Destination | Ghi chú |
|---|---|---:|---|---|
| SSH | TCP | 22 | `sg-private-ec2` hoặc private subnet CIDR | SSH vào Linux private EC2 |
| RDP | TCP | 3389 | `sg-private-windows` | RDP vào Windows private EC2 |
| HTTPS | TCP | 443 | `0.0.0.0/0` hoặc VPC endpoints | Optional: update package, SSM, download tools |

Nếu muốn siết chặt hơn, outbound của Bastion chỉ nên tới đúng security group hoặc CIDR cần quản trị, không mở toàn bộ `0.0.0.0/0` nếu không cần.

### Private EC2 Security Group

Inbound:

| Type | Protocol | Port | Source | Ghi chú |
|---|---|---:|---|---|
| SSH | TCP | 22 | `sg-bastion` | Chỉ Bastion được SSH vào Linux instance |
| RDP | TCP | 3389 | `sg-bastion` | Chỉ Bastion được RDP vào Windows instance |
| App port | TCP | 8080/443/... | ALB SG hoặc app SG | Tùy workload |

Outbound:

| Type | Protocol | Port | Destination | Ghi chú |
|---|---|---:|---|---|
| HTTPS | TCP | 443 | `0.0.0.0/0` hoặc VPC endpoints | Optional cho update/API calls |
| App dependencies | TCP | Tùy app | DB/cache/internal service | Theo nhu cầu ứng dụng |

### Vì sao source nên là Security Group thay vì IP Bastion

Nếu rule private EC2 là:

```text
TCP 22 từ sg-bastion
```

thì dù Bastion đổi private IP, rule vẫn đúng. Đây là cách quản trị ổn định hơn so với hard-code IP.

---

## Network ACL cần lưu ý

Network ACL là **stateless**, nên nếu bạn dùng NACL để siết subnet, phải mở cả chiều request và response.

AWS VPC documentation so sánh rõ:

| Đặc điểm | Security Group | Network ACL |
|---|---|---|
| Scope | Instance level | Subnet level |
| Rule | Allow rules only | Allow và deny rules |
| Return traffic | Tự động allowed, stateful | Phải explicitly allowed, stateless |

### Internet SSH vào Bastion

Client ngoài Internet kết nối:

```text
Client ephemeral port 54321 ---> Bastion port 22
```

Response từ Bastion:

```text
Bastion port 22 ---> Client ephemeral port 54321
```

NACL cho public subnet chứa Bastion thường cần:

Inbound:

```text
ALLOW TCP 22 từ IP admin
ALLOW TCP 1024-65535 từ IP admin nếu cần cho return traffic của kết nối outbound khác
```

Outbound:

```text
ALLOW TCP 1024-65535 đến IP admin
ALLOW TCP 22 đến private subnet nếu Bastion SSH vào private EC2 ở subnet khác
```

Nếu chỉ mở inbound port 22 mà outbound không cho ephemeral ports, packet SSH có thể đi vào subnet nhưng Bastion không trả lời ra được, kết quả là SSH timeout.

### Bastion SSH vào private EC2

Khi Bastion SSH vào private EC2, Bastion là **client**, private EC2 là **SSH server**.

Ví dụ Bastion chọn ephemeral port `45678`:

```text
Request : Bastion 10.0.1.10:45678  --->  Private EC2 10.0.2.20:22
Response: Private EC2 10.0.2.20:22 --->  Bastion 10.0.1.10:45678
```

Vì vậy NACL của **private subnet** chứa EC2 private cần:

Inbound:

```text
ALLOW TCP 22 từ private IP/CIDR của Bastion subnet
```

Outbound:

```text
ALLOW TCP 1024-65535 về Bastion subnet
```

Đồng thời NACL của **public/facing subnet** chứa Bastion cũng cần cho chiều về của connection 2:

Inbound:

```text
ALLOW TCP 1024-65535 từ private subnet
```

Outbound:

```text
ALLOW TCP 22 đến private subnet
```

Điểm dễ nhầm: response từ private EC2 **không đi về port 22 của Bastion**. Nó đi về ephemeral port mà Bastion đã dùng khi mở connection, ví dụ `45678`.

### 2 TCP connections = 4 luồng traffic

SSH qua Bastion tạo 2 TCP connections riêng:

```text
Connection 1: Laptop  ↔ Bastion
Connection 2: Bastion ↔ Private EC2
```

Mỗi connection có chiều đi và chiều về, nên khi xét NACL sẽ có 4 luồng chính:

```text
1. Laptop:ephemeral  ---> Bastion:22
2. Bastion:22        ---> Laptop:ephemeral
3. Bastion:ephemeral ---> Private EC2:22
4. Private EC2:22    ---> Bastion:ephemeral
```

Đây là **4 luồng traffic**, không phải chỉ đúng 4 packet vật lý. Thực tế TCP/SSH có nhiều packet như SYN, SYN-ACK, ACK, SSH handshake, encrypted data và keepalive.

Cách nhớ:

```text
Security Group = stateful = mở request, response tự được phép
Network ACL    = stateless = phải mở cả request và response
Client         = dùng ephemeral port
Server SSH     = dùng port 22
```

---

## Bastion Host và NAT Gateway khác nhau thế nào

Đây là phần rất hay bị nhầm trong đề thi AWS.

| Tiêu chí | Bastion Host | NAT Gateway |
|---|---|---|
| Mục đích | Admin truy cập vào private instance | Private instance đi ra Internet |
| Hướng chính | Inbound admin access | Outbound Internet access |
| Ví dụ | Laptop -> Bastion -> Private EC2 | Private EC2 -> NAT -> Internet |
| Có nhận SSH từ Internet không | Có thể có | Không dùng để SSH vào private EC2 |
| Thường đặt ở đâu | Public subnet | Public subnet |
| Đích đến phía sau | EC2/private resource | Internet/service public endpoint |

Diagram:

```text
Bastion Host:
Admin Internet ──► Bastion ──► Private EC2

NAT Gateway:
Private EC2 ──► NAT Gateway ──► Internet
```

Nếu câu hỏi nói:

- “SSH/RDP vào instance trong private subnet” → nghĩ tới **Bastion Host** hoặc **Session Manager**.
- “Instance trong private subnet cần download patch/update từ Internet” → nghĩ tới **NAT Gateway** hoặc **VPC endpoint**.

---

## Bastion Host truyền thống vs Session Manager

AWS Systems Manager Session Manager là lựa chọn hiện đại để truy cập EC2/managed nodes mà không cần mở inbound port, không cần duy trì bastion host, và không cần quản lý SSH keys theo kiểu truyền thống.

AWS documentation mô tả Session Manager là fully managed Systems Manager tool, cho phép quản lý EC2 instances, on-premises servers và VMs qua browser-based shell hoặc AWS CLI. Tài liệu cũng nêu rõ Session Manager cung cấp secure node management **without the need to open inbound ports, maintain bastion hosts, or manage SSH keys**.

| Tiêu chí | Bastion truyền thống | Session Manager |
|---|---|---|
| Cần public IP | Thường có, nếu SSH từ Internet | Không cần |
| Cần mở inbound SSH/RDP | Có, nếu dùng SSH/RDP trực tiếp | Không cần mở inbound port |
| Access control | SSH key, OS user, SG, có thể thêm VPN/MFA | IAM policy, SSM permissions, tags |
| Logging | Tự cấu hình OS/audit/VPC Flow Logs | Tích hợp CloudTrail, S3, CloudWatch Logs |
| Attack surface | Bastion có thể exposed ra Internet | Nhỏ hơn vì không mở inbound SSH/RDP |
| Vận hành | Phải patch, harden, rotate key | Ít vận hành host trung gian hơn |
| Tooling | Hợp với SSH/RDP truyền thống | Hợp với AWS-native access |

Lưu ý: Session Manager vẫn cần các điều kiện:

- Instance có SSM Agent.
- Instance có IAM role phù hợp.
- Instance kết nối được tới Systems Manager endpoints qua Internet/NAT hoặc VPC endpoints.
- User có IAM permission để start session.

---

## Thiết kế Bastion Host an toàn

Nếu vẫn dùng Bastion Host, nên harden như một tài sản nhạy cảm.

### Network hardening

- Chỉ mở SSH/RDP từ IP cố định của admin hoặc VPN, ví dụ `203.0.113.10/32`.
- Không mở `22` hoặc `3389` từ `0.0.0.0/0`.
- Private EC2 chỉ allow SSH/RDP từ Security Group của Bastion.
- Không đặt database hoặc app backend trong public subnet chỉ vì cần admin access.
- Nếu có nhiều môi trường, tách bastion theo môi trường hoặc giới hạn route/security group rõ ràng.

### OS hardening

- Tắt password login, chỉ dùng key/certificate/SSM/EIC.
- Tắt root login trực tiếp qua SSH.
- Cập nhật OS package định kỳ.
- Cài agent logging/monitoring cần thiết.
- Giới hạn user có quyền sudo.
- Dùng CIS benchmark hoặc hardened AMI nếu tổ chức yêu cầu.

Ví dụ `/etc/ssh/sshd_config` thường gặp:

```text
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
AllowUsers ec2-user deploy-admin
```

Sau khi sửa SSH config:

```bash
sudo systemctl restart sshd
```

### Key management

- Không share chung một private key cho cả team.
- Không copy private key lên Bastion nếu không thật sự cần.
- Rotate key định kỳ hoặc dùng short-lived key.
- Ưu tiên EC2 Instance Connect hoặc IAM-based access nếu phù hợp.
- Khi một nhân sự rời team, phải revoke access ngay.

### IAM và tagging

Bastion truyền thống chủ yếu dùng SSH, nhưng vẫn nên dùng IAM/tags để quản trị:

- Tag instance: `Name=bastion-prod`, `Environment=prod`, `Owner=platform`.
- Dùng IAM để giới hạn ai được start/stop/terminate/modify security group của Bastion.
- Dùng AWS Config/Security Hub để phát hiện rule SSH mở rộng quá mức.

---

## High Availability cho Bastion Host

Bastion Host thường không nằm trên data path của application, nhưng nếu nó down thì admin không thể truy cập private instances theo cách truyền thống.

Các lựa chọn HA:

### 1. Bastion đơn giản

```text
1 EC2 Bastion + Elastic IP
```

Phù hợp lab/dev/small environment.

Ưu điểm:

- Rẻ.
- Dễ vận hành.

Nhược điểm:

- Single point of failure cho admin access.

### 2. Bastion mỗi Availability Zone

```text
Public subnet AZ-a -> Bastion A
Public subnet AZ-b -> Bastion B
Private subnet AZ-a -> private EC2 A
Private subnet AZ-b -> private EC2 B
```

Ưu điểm:

- Nếu một AZ có vấn đề, còn bastion ở AZ khác.
- Giảm phụ thuộc cross-AZ cho admin traffic.

Nhược điểm:

- Nhiều host hơn để patch/harden/monitor.

### 3. Auto Scaling Group cho Bastion

Có thể dùng Launch Template + Auto Scaling Group để tự thay thế Bastion khi instance lỗi.

Cần lưu ý:

- Không lưu state quan trọng trên Bastion.
- Dùng user data/bootstrap để cấu hình nhất quán.
- Logging đẩy ra CloudWatch/S3, không chỉ để local.
- Nếu cần IP cố định, thiết kế thêm Elastic IP association automation hoặc dùng DNS.

### 4. Thay bằng Session Manager

Nếu mục tiêu chỉ là admin access, Session Manager thường giảm đáng kể nhu cầu HA cho Bastion vì không còn phụ thuộc một jump server public.

---

## Logging và audit

Bastion là điểm nhạy cảm, nên cần audit tốt.

Các lớp logging nên cân nhắc:

| Lớp | Ghi nhận gì |
|---|---|
| CloudTrail | API calls như start/stop instance, modify security group, EC2 Instance Connect API |
| VPC Flow Logs | Network flow tới/từ Bastion |
| OS auth logs | SSH login, sudo, failed login |
| CloudWatch Agent | Đẩy `/var/log/secure`, `/var/log/auth.log` lên CloudWatch Logs |
| Session Manager logs | Nếu dùng SSM session, log ra S3/CloudWatch tùy cấu hình |
| GuardDuty/Security Hub | Phát hiện hành vi đáng ngờ hoặc exposure |

Ví dụ log quan trọng trên Linux:

```text
Amazon Linux / RHEL / CentOS: /var/log/secure
Ubuntu / Debian:             /var/log/auth.log
```

Nên có cảnh báo cho các sự kiện:

- SSH failed login tăng bất thường.
- Security Group của Bastion bị mở `0.0.0.0/0` cho port 22/3389.
- Bastion bị stop/terminate ngoài change window.
- User lạ dùng sudo.
- Traffic bất thường từ Bastion tới nhiều host nội bộ.

---

## Các biến thể thường gặp

### Linux Bastion

Dùng SSH để vào Linux private EC2.

```text
Admin -> SSH 22 -> Linux Bastion -> SSH 22 -> Linux private EC2
```

### Windows Bastion

Dùng RDP để vào Windows jump server, rồi RDP tiếp vào Windows private server.

```text
Admin -> RDP 3389 -> Windows Bastion -> RDP 3389 -> Windows private server
```

Với Windows, càng cần giới hạn source IP và cân nhắc Session Manager/SSM Fleet Manager hoặc VPN vì RDP exposed ra Internet là attack surface lớn.

### Bastion qua VPN

Bastion không nhất thiết phải exposed trực tiếp ra Internet. Có thể chỉ cho phép SSH từ VPN corporate:

```text
Admin -> Corporate VPN -> Bastion private IP -> Private EC2
```

Cách này giảm public exposure.

### Bastion private + Session Manager

Một pattern hiện đại hơn là Bastion không có public IP. Admin connect vào Bastion bằng Session Manager, rồi từ Bastion đi tiếp vào private resources nếu cần.

```text
Admin -> Session Manager -> Private Bastion -> Private EC2
```

Pattern này giảm nhu cầu mở inbound SSH từ Internet.

---

## Troubleshooting

### 1. SSH vào Bastion bị timeout

Kiểm tra:

- Bastion có public IP hoặc Elastic IP không?
- Bastion nằm trong public subnet không?
- Route table của subnet có `0.0.0.0/0 -> Internet Gateway` không?
- Security Group của Bastion có allow TCP 22 từ IP hiện tại của bạn không?
- NACL public subnet có allow inbound 22 và outbound ephemeral ports không?
- Local firewall/corporate network có chặn outbound SSH không?

### 2. SSH vào Bastion báo `Permission denied`

Kiểm tra:

- Đúng private key chưa?
- Đúng username chưa?
  - Amazon Linux: `ec2-user`
  - Ubuntu: `ubuntu`
  - RHEL: `ec2-user` hoặc `cloud-user` tùy AMI
- File key local có permission đúng chưa?

```bash
chmod 400 bastion-key.pem
```

### 3. SSH từ Bastion vào private EC2 bị timeout

Kiểm tra:

- Private EC2 đang chạy không?
- Dùng đúng private IP không?
- Security Group của private EC2 có allow TCP 22 từ `sg-bastion` không?
- Security Group outbound của Bastion có allow TCP 22 tới private EC2 không?
- NACL private subnet có mở inbound 22 và outbound ephemeral về Bastion không?
- Route table trong VPC có route local `10.0.0.0/16 local` không? Route local mặc định luôn có nhưng cần kiểm tra CIDR đúng.

### 4. SSH từ Bastion vào private EC2 báo `Permission denied`

Kiểm tra:

- Key dùng cho private EC2 có đúng không?
- User OS có đúng không?
- Public key có nằm trong `~/.ssh/authorized_keys` trên private EC2 không?
- Nếu dùng agent forwarding, agent đã load key chưa?

```bash
ssh-add -l
```

### 5. Private EC2 không ra Internet để update package

Đây không phải vấn đề Bastion. Private EC2 cần một trong các cách:

- NAT Gateway/NAT instance.
- VPC endpoints cho AWS services.
- Proxy nội bộ.

Bastion không thay thế NAT Gateway.

---

## Lỗi hiểu nhầm thường gặp

### 1. “Bastion Host chính là NAT Gateway”

Không đúng.

- Bastion = cửa vào cho admin.
- NAT Gateway = cửa ra Internet cho private instances.

### 2. “Private subnet nghĩa là không ai truy cập được”

Không đúng. Private subnet nghĩa là không có direct inbound public access qua Internet Gateway. Tài nguyên bên trong vẫn có thể được truy cập qua:

- Bastion Host
- VPN
- Direct Connect
- Session Manager
- PrivateLink
- VPC peering/Transit Gateway nếu route và security cho phép

### 3. “Có Bastion thì private EC2 cần public IP”

Không cần. Bastion SSH vào private EC2 bằng **private IP** trong VPC.

### 4. “Bastion làm app server an toàn hơn”

Bastion không thay thế Security Group, IAM, patching, logging, hardening hoặc segmentation. Nó chỉ là một điểm trung gian để quản trị.

### 5. “Network ACL chỉ cần mở inbound SSH”

Không đủ nếu NACL đang siết outbound. Vì NACL stateless, response traffic phải được allow ở chiều ngược lại.

### 6. “Copy private key lên Bastion là bình thường”

Đây là thói quen rủi ro. Nếu Bastion bị compromise, attacker có thể lấy key và lateral movement sang private instances. Ưu tiên ProxyJump, agent forwarding cẩn thận, EC2 Instance Connect hoặc Session Manager.

---

## Gợi ý khi gặp trong đề thi AWS

Keyword nhận diện Bastion Host:

- `SSH into instances in a private subnet`
- `RDP to private Windows instances`
- `jump server`
- `jump box`
- `administrative access`
- `private subnet access from the Internet`
- `single point of entry for administrators`

Nếu câu hỏi nhấn mạnh bảo mật/operational overhead thấp hơn, đáp án hiện đại có thể là:

- **AWS Systems Manager Session Manager**
- **EC2 Instance Connect Endpoint** hoặc EC2 Instance Connect tùy ngữ cảnh
- VPN/Direct Connect nếu cần private network access rộng hơn

Phân biệt nhanh:

| Đề hỏi | Dịch vụ/giải pháp thường đúng |
|---|---|
| Admin SSH vào EC2 private | Bastion Host hoặc Session Manager |
| Không muốn mở inbound port/không muốn quản lý SSH key | Session Manager |
| Private EC2 download update từ Internet | NAT Gateway hoặc VPC endpoints |
| User cần truy cập private application qua network | VPN, Client VPN, PrivateLink, ALB nội bộ tùy bài |
| Truy cập database private bằng tunnel tạm thời | Bastion SSH tunnel hoặc Session Manager port forwarding |

---

## Nguồn AWS chính thức

- [Infrastructure security in Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html)
- [Compare security groups and network ACLs - Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html#VPC_Security_Comparison)
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [Start a session - AWS Systems Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html)
- [Access a bastion host by using Session Manager and Amazon EC2 Instance Connect - AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/access-a-bastion-host-by-using-session-manager-and-amazon-ec2-instance-connect.html)
- [Securely Connect to Linux Instances Running in a Private Amazon VPC - AWS Security Blog](https://aws.amazon.com/blogs/security/securely-connect-to-linux-instances-running-in-a-private-amazon-vpc/)
- [Toward a bastion-less world - AWS Blog](https://aws.amazon.com/blogs/infrastructure-and-automation/toward-a-bastion-less-world/)
