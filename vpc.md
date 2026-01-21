# Amazon VPC (Virtual Private Cloud)

## VPC là gì?

**VPC** là mạng ảo riêng của bạn trên AWS, nơi bạn có toàn quyền kiểm soát:
- Dải địa chỉ IP
- Subnets
- Route tables
- Gateways
- Security (Security Groups, Network ACLs)

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                  VPC (10.0.0.0/16)                        │  │
│   │                  = Mạng riêng của bạn                     │  │
│   │                  = 65,536 IP addresses                    │  │
│   │                                                           │  │
│   │   ┌─────────────────┐       ┌─────────────────┐          │  │
│   │   │ Subnet A        │       │ Subnet B        │          │  │
│   │   │ 10.0.1.0/24     │       │ 10.0.2.0/24     │          │  │
│   │   │                 │       │                 │          │  │
│   │   │  ┌───┐ ┌───┐   │       │  ┌───┐ ┌───┐   │          │  │
│   │   │  │EC2│ │EC2│   │       │  │RDS│ │EC2│   │          │  │
│   │   │  └───┘ └───┘   │       │  └───┘ └───┘   │          │  │
│   │   └─────────────────┘       └─────────────────┘          │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                  VPC khác (172.16.0.0/16)                 │  │
│   │                  = Hoàn toàn cách ly                      │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Tác dụng của VPC

| Tác dụng | Mô tả |
|----------|-------|
| **Cách ly mạng** | Tài nguyên trong VPC này không thể truy cập VPC khác (trừ khi cấu hình) |
| **Kiểm soát IP** | Tự định nghĩa dải IP (CIDR block) |
| **Bảo mật** | Kiểm soát traffic vào/ra bằng Security Groups, NACLs |
| **Kết nối linh hoạt** | Kết nối internet, on-premise, hoặc VPC khác |

---

## Chi phí VPC

### Miễn phí

| Thành phần | Chi phí |
|------------|---------|
| **VPC** | ✅ Miễn phí |
| **Subnet** | ✅ Miễn phí |
| **Route Table** | ✅ Miễn phí |
| **Internet Gateway** | ✅ Miễn phí |
| **Security Group** | ✅ Miễn phí |
| **Network ACL** | ✅ Miễn phí |
| **VPC Peering** | ✅ Miễn phí (chỉ trả data transfer) |

### Có phí

| Thành phần | Chi phí (US East) | Ghi chú |
|------------|-------------------|---------|
| **NAT Gateway** | $0.045/giờ + $0.045/GB | ~$32/tháng + data |
| **Public IPv4** | $0.005/giờ | ~$3.6/tháng mỗi IP |
| **Elastic IP (không dùng)** | $0.005/giờ | Phí khi không gắn vào instance |
| **VPC Endpoint (Interface)** | $0.01/giờ + $0.01/GB | ~$7.2/tháng |
| **VPC Endpoint (Gateway)** | ✅ Miễn phí | Chỉ cho S3, DynamoDB |
| **Data Transfer cross-AZ** | $0.01/GB | Cả 2 chiều |

### Ví dụ tính chi phí thực tế

**Dự án nhỏ (1 NAT Gateway, 2 Public IPs):**
```
NAT Gateway:
  Hourly:    $0.045 × 24h × 30 days = $32.40
  Data 50GB: $0.045 × 50 = $2.25
  
Public IPv4 (2 IPs):
  $0.005 × 24h × 30 days × 2 = $7.20

Tổng: ~$42/tháng
```

**Dự án Production (2 NAT Gateways cho HA, 5 Public IPs):**
```
NAT Gateway (2 cái cho 2 AZ):
  Hourly:     $0.045 × 24h × 30 days × 2 = $64.80
  Data 200GB: $0.045 × 200 = $9.00
  
Public IPv4 (5 IPs):
  $0.005 × 24h × 30 days × 5 = $18.00

Tổng: ~$92/tháng
```

### Tips tiết kiệm chi phí

| Vấn đề | Giải pháp |
|--------|-----------|
| NAT Gateway đắt | Dùng **NAT Instance** (EC2 t3.micro ~$8/tháng) cho dev/test |
| Trả phí Public IPv4 | Dùng **IPv6** khi có thể (miễn phí) |
| Data transfer cross-AZ | Đặt resources cùng AZ khi có thể |
| Gọi S3 qua NAT Gateway | Dùng **VPC Gateway Endpoint** cho S3 (miễn phí) |
| Elastic IP không dùng | **Xóa ngay** khi không cần |

---

## Subnet là gì?

**Subnet** là phân đoạn nhỏ của VPC, nằm trong **1 Availability Zone** duy nhất.

```
┌─────────────────────────────────────────────────────────────────┐
│                    VPC (10.0.0.0/16)                            │
│                                                                  │
│      Availability Zone A     │     Availability Zone B          │
│                              │                                   │
│   ┌───────────────────────┐  │  ┌───────────────────────┐       │
│   │ Subnet 10.0.1.0/24    │  │  │ Subnet 10.0.2.0/24    │       │
│   │ 256 IPs               │  │  │ 256 IPs               │       │
│   │                       │  │  │                       │       │
│   │  ┌─────┐   ┌─────┐   │  │  │  ┌─────┐   ┌─────┐   │       │
│   │  │ EC2 │   │ EC2 │   │  │  │  │ EC2 │   │ EC2 │   │       │
│   │  └─────┘   └─────┘   │  │  │  └─────┘   └─────┘   │       │
│   └───────────────────────┘  │  └───────────────────────┘       │
│                              │                                   │
│   → Nếu AZ-A chết, AZ-B     │  → High Availability!            │
│     vẫn chạy                 │                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Tác dụng của Subnet

| Tác dụng | Mô tả |
|----------|-------|
| **Chia nhỏ VPC** | Tổ chức tài nguyên theo chức năng |
| **High Availability** | Đặt ở nhiều AZ để tránh single point of failure |
| **Kiểm soát truy cập** | Public subnet vs Private subnet |
| **Network ACL riêng** | Mỗi subnet có thể có rules khác nhau |

---

## Public Subnet vs Private Subnet

### So sánh chi tiết

| Đặc điểm | Public Subnet | Private Subnet |
|----------|---------------|----------------|
| **Internet truy cập vào** | ✅ Có thể | ❌ Không thể |
| **Route đến Internet Gateway** | ✅ Có | ❌ Không |
| **Public IP** | ✅ Có thể gán | ❌ Không có ý nghĩa |
| **Đặt gì?** | Web server, Load Balancer, Bastion, NAT Gateway | App server, Database, Backend, Cache |
| **Bảo mật** | Thấp hơn (exposed) | Cao hơn (ẩn) |
| **Chi phí** | Thấp | Cao hơn nếu cần NAT Gateway |

### Điểm khác biệt cốt lõi: Route Table

```
PUBLIC Subnet Route Table:
┌─────────────────┬─────────────────────────────────────┐
│   Destination   │     Target                          │
├─────────────────┼─────────────────────────────────────┤
│   10.0.0.0/16   │     local                           │ ← Trong VPC
│   0.0.0.0/0     │     igw-xxxxxx (Internet Gateway)   │ ← Ra internet ✅
└─────────────────┴─────────────────────────────────────┘

PRIVATE Subnet Route Table:
┌─────────────────┬─────────────────────────────────────┐
│   Destination   │     Target                          │
├─────────────────┼─────────────────────────────────────┤
│   10.0.0.0/16   │     local                           │ ← Trong VPC
│   0.0.0.0/0     │     nat-xxxxxx (NAT Gateway)        │ ← Ra qua NAT
└─────────────────┴─────────────────────────────────────┘
                  ❌ KHÔNG có route trực tiếp đến IGW
```

### Luồng traffic thực tế

```
                              Internet
                                 │
                                 ▼
                    ┌────────────────────┐
                    │  Internet Gateway  │
                    └──────────┬─────────┘
                               │
       ┌───────────────────────┼────────────────────────┐
       │                       │                   VPC  │
       │                       ▼                        │
       │  ┌──────────────────────────────────────────┐  │
       │  │           PUBLIC SUBNET                   │  │
       │  │                                           │  │
       │  │  ┌───────────┐         ┌──────────────┐  │  │
       │  │  │    EC2    │         │     NAT      │  │  │
       │  │  │   (Web)   │         │   Gateway    │  │  │
       │  │  │           │         │              │  │  │
       │  │  │ Public IP │         │  Cho private │  │  │
       │  │  │ có thể    │         │  subnet ra   │  │  │
       │  │  │ truy cập  │         │  internet    │  │  │
       │  │  └───────────┘         └───────┬──────┘  │  │
       │  └────────────────────────────────┼─────────┘  │
       │                                   │            │
       │                                   ▼            │
       │  ┌──────────────────────────────────────────┐  │
       │  │          PRIVATE SUBNET                   │  │
       │  │                                           │  │
       │  │  ┌───────────┐         ┌──────────────┐  │  │
       │  │  │    EC2    │         │     RDS      │  │  │
       │  │  │   (App)   │         │  (Database)  │  │  │
       │  │  │           │         │              │  │  │
       │  │  │ Chỉ có    │         │ Hoàn toàn    │  │  │
       │  │  │ private   │         │ ẩn khỏi      │  │  │
       │  │  │ IP        │         │ internet     │  │  │
       │  │  └───────────┘         └──────────────┘  │  │
       │  │                                           │  │
       │  │  ❌ Internet KHÔNG THỂ truy cập vào      │  │
       │  │  ✅ Có thể gọi ra internet qua NAT       │  │
       │  └──────────────────────────────────────────┘  │
       └────────────────────────────────────────────────┘
```

### Tại sao cần Private Subnet?

```
Hacker từ Internet muốn tấn công Database:

Public Subnet:
  → Nếu Security Group cấu hình sai → BỊ TẤN CÔNG 💀

Private Subnet:
  → Dù Security Group mở toang → VẪN KHÔNG THỂ truy cập ✅
  → Vì không có đường đi từ internet vào

= THÊM 1 LỚP BẢO VỆ
```

---

## Các thành phần trong VPC Dashboard

```
VPC Dashboard
│
├── 🔹 CORE (Cốt lõi)
│   ├── Your VPCs          → Mạng ảo chính
│   ├── Subnets            → Phân chia VPC
│   ├── Route Tables       → Định tuyến traffic đi đâu
│   └── Internet Gateways  → Cổng ra internet
│
├── 🔹 NAT & CONNECTIVITY (Kết nối)
│   ├── NAT Gateways       → Cho private subnet ra internet
│   ├── Elastic IPs        → IP tĩnh public
│   ├── VPC Peering        → Kết nối 2 VPC với nhau
│   ├── Transit Gateways   → Hub kết nối nhiều VPC
│   └── VPN Connections    → Kết nối on-premise ↔ AWS
│
├── 🔹 SECURITY (Bảo mật)
│   ├── Security Groups    → Firewall cho instance
│   ├── Network ACLs       → Firewall cho subnet
│   └── VPC Flow Logs      → Log traffic để audit
│
├── 🔹 ENDPOINTS (Kết nối AWS Services)
│   ├── Endpoints          → Truy cập S3, DynamoDB không qua internet
│   └── Endpoint Services  → Expose service cho VPC khác
│
└── 🔹 DNS & DHCP
    ├── DHCP Option Sets   → Cấu hình DNS, domain
    └── DNS Settings       → Enable/disable DNS trong VPC
```

---

### 1. Internet Gateway (IGW)

**Tác dụng:** Cho phép VPC kết nối với Internet (2 chiều).

```
Internet ◄──────► Internet Gateway ◄──────► Public Subnet
                        │
                   (2 chiều)
```

| Đặc điểm | Giá trị |
|----------|---------|
| Số lượng | 1 IGW / VPC |
| Chi phí | ✅ Miễn phí |
| Cần làm | Attach vào VPC + Thêm route trong Route Table |

---

### 2. NAT Gateway

**Tác dụng:** Cho phép Private Subnet gọi **ra** internet, nhưng internet **không thể gọi vào**.

```
                    Internet
                        ▲
                        │ (chỉ 1 chiều ra)
                        │
              ┌─────────┴─────────┐
              │  Internet Gateway │
              └─────────┬─────────┘
                        │
              ┌─────────┴─────────┐
              │    NAT Gateway    │ ← Đặt trong PUBLIC subnet
              │  (có Elastic IP)  │
              └─────────┬─────────┘
                        │
              ┌─────────┴─────────┐
              │  Private Subnet   │
              │  (EC2 App, DB)    │
              └───────────────────┘
```

| Đặc điểm | Giá trị |
|----------|---------|
| Đặt ở đâu | Public Subnet |
| Chi phí | 💰 $0.045/giờ + $0.045/GB (~$32/tháng) |
| Use case | EC2 private cần apt update, gọi external API |
| HA | Tạo 1 NAT Gateway mỗi AZ |

**Thay thế rẻ hơn:** NAT Instance (EC2 t3.micro ~$8/tháng) cho dev/test.

---

### 3. Route Table

**Tác dụng:** Quyết định traffic đi đâu dựa trên destination IP.

```
┌─────────────────────────────────────────────────────────────┐
│                        Route Table                           │
├─────────────────┬───────────────────────────────────────────┤
│   Destination   │   Target              │   Ý nghĩa         │
├─────────────────┼───────────────────────┼───────────────────┤
│   10.0.0.0/16   │   local               │   Trong VPC       │
│   0.0.0.0/0     │   igw-xxx             │   Ra internet     │
│   0.0.0.0/0     │   nat-xxx             │   Ra qua NAT      │
│   172.16.0.0/16 │   pcx-xxx             │   Qua VPC Peering │
│   192.168.0.0/16│   vgw-xxx             │   Qua VPN         │
└─────────────────┴───────────────────────┴───────────────────┘
```

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí | ✅ Miễn phí |
| Liên kết | Mỗi Subnet phải gắn với 1 Route Table |
| Mặc định | VPC có 1 Main Route Table |

---

### 4. Elastic IP (EIP)

**Tác dụng:** Địa chỉ IPv4 tĩnh, không đổi khi stop/start instance.

```
┌─────────────────────────────────────────────────────────────┐
│  Elastic IP: 52.1.2.3                                       │
│      │                                                      │
│      ▼                                                      │
│  ┌─────────┐     Stop/Start     ┌─────────┐                │
│  │  EC2-A  │  ───────────────►  │  EC2-A  │                │
│  │ 52.1.2.3│                    │ 52.1.2.3│ ← IP giữ nguyên│
│  └─────────┘                    └─────────┘                │
│                                                             │
│  So với Public IP tự động:                                  │
│  ┌─────────┐     Stop/Start     ┌─────────┐                │
│  │  EC2-B  │  ───────────────►  │  EC2-B  │                │
│  │ 54.9.8.7│                    │ 18.2.3.4│ ← IP đổi!      │
│  └─────────┘                    └─────────┘                │
└─────────────────────────────────────────────────────────────┘
```

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí đang dùng | 💰 $0.005/giờ (~$3.6/tháng) |
| Chi phí KHÔNG dùng | 💰 $0.005/giờ (vẫn tính phí!) |
| Use case | Server cần IP cố định (mail server, whitelist firewall) |

> ⚠️ **Lưu ý:** Xóa Elastic IP ngay khi không dùng để tránh phí!

---

### 5. VPC Peering

**Tác dụng:** Kết nối 2 VPC với nhau (cùng hoặc khác account/region).

```
┌─────────────────┐              ┌─────────────────┐
│    VPC-Prod     │              │    VPC-Dev      │
│  10.0.0.0/16    │◄────────────►│  172.16.0.0/16  │
│                 │ VPC Peering  │                 │
│   ┌─────────┐   │    Connection│   ┌─────────┐   │
│   │   EC2   │   │              │   │   EC2   │   │
│   └─────────┘   │              │   └─────────┘   │
└─────────────────┘              └─────────────────┘

EC2 trong VPC-Prod có thể gọi EC2 trong VPC-Dev qua private IP
```

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí | ✅ Miễn phí (chỉ trả data transfer) |
| Data transfer | $0.01/GB cross-AZ |
| Giới hạn | Không transitive (A↔B, B↔C ≠ A↔C) |
| CIDR | Không được trùng nhau |

---

### 6. Transit Gateway

**Tác dụng:** Hub trung tâm kết nối nhiều VPC và on-premise (thay thế nhiều VPC Peering).

```
                    ┌─────────────────┐
                    │ Transit Gateway │
                    │   (Hub trung    │
                    │    tâm)         │
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │  VPC-A   │      │  VPC-B   │      │  VPC-C   │
    └──────────┘      └──────────┘      └──────────┘
           │                 │                 │
           └─────────────────┴─────────────────┘
                   Tất cả có thể gọi nhau!

So với VPC Peering:
  3 VPC cần 3 peering connections (A↔B, B↔C, A↔C)
  Transit Gateway: chỉ cần 1 hub
```

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí | 💰 $0.05/giờ + $0.02/GB |
| Use case | Nhiều VPC (>3), kết nối on-premise |
| Transitive | ✅ Có (A↔Hub↔C = A có thể gọi C) |

---

### 7. VPN Connection (Site-to-Site VPN)

**Tác dụng:** Kết nối on-premise data center với AWS qua internet (encrypted).

```
┌─────────────────┐                      ┌─────────────────┐
│  On-Premise     │                      │      AWS        │
│  Data Center    │                      │      VPC        │
│                 │    IPSec Tunnel      │                 │
│  ┌───────────┐  │◄════════════════════►│  ┌───────────┐  │
│  │ Customer  │  │    (Encrypted)       │  │  Virtual  │  │
│  │ Gateway   │  │                      │  │ Private   │  │
│  │           │  │                      │  │ Gateway   │  │
│  └───────────┘  │                      │  └───────────┘  │
│   192.168.0.0/16│                      │   10.0.0.0/16  │
└─────────────────┘                      └─────────────────┘
```

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí | 💰 $0.05/giờ (~$36/tháng) + data transfer |
| Bandwidth | Tối đa ~1.25 Gbps |
| Use case | Hybrid cloud, kết nối văn phòng với AWS |

**Thay thế nhanh hơn:** AWS Direct Connect (kết nối vật lý, đắt hơn).

---

### 8. Security Groups

**Tác dụng:** Virtual firewall cho **instance** (EC2, RDS, Lambda...).

Xem chi tiết: [Security Groups](security-groups.md)

| Đặc điểm | Giá trị |
|----------|---------|
| Cấp độ | Instance (ENI) |
| Stateful | ✅ Có (response tự động cho phép) |
| Rules | Chỉ ALLOW |
| Chi phí | ✅ Miễn phí |

---

### 9. Network ACLs (NACLs)

**Tác dụng:** Firewall cho **subnet** (lớp bảo vệ thêm ngoài Security Group).

```
              Internet
                 │
                 ▼
         ┌──────────────┐
         │ Network ACL  │ ◄── Layer 1: Subnet level
         │  (Stateless) │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │Security Group│ ◄── Layer 2: Instance level
         │  (Stateful)  │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  EC2 Instance│
         └──────────────┘
```

| Đặc điểm | Security Group | Network ACL |
|----------|----------------|-------------|
| Cấp độ | Instance | Subnet |
| Stateful | ✅ Có | ❌ Không (phải tạo rule cả 2 chiều) |
| Rules | Chỉ Allow | Allow + Deny |
| Đánh giá | Tất cả rules | Theo thứ tự số (100, 200...) |
| Chi phí | ✅ Miễn phí | ✅ Miễn phí |

**Ví dụ NACL rule:**
```
┌────────┬──────────┬──────────┬───────┬────────┬────────┐
│ Rule # │   Type   │ Protocol │ Port  │ Source │ Action │
├────────┼──────────┼──────────┼───────┼────────┼────────┤
│  100   │   HTTP   │   TCP    │  80   │0.0.0.0/0│ ALLOW │
│  110   │   HTTPS  │   TCP    │  443  │0.0.0.0/0│ ALLOW │
│  120   │   SSH    │   TCP    │  22   │10.0.0.0/8│ ALLOW │
│  *     │ All traffic│  All   │  All  │0.0.0.0/0│ DENY  │ ← Default
└────────┴──────────┴──────────┴───────┴────────┴────────┘
```

---

### 10. VPC Endpoints

**Tác dụng:** Truy cập AWS services (S3, DynamoDB, ECR...) mà **không cần đi qua internet**.

```
KHÔNG có Endpoint:
  EC2 (Private) → NAT Gateway → Internet → S3
                  💰 Tốn phí NAT + chậm

CÓ Endpoint:
  EC2 (Private) → VPC Endpoint → S3
                  ✅ Nhanh + có thể miễn phí
```

**2 loại Endpoint:**

| Loại | Gateway Endpoint | Interface Endpoint |
|------|------------------|-------------------|
| Dùng cho | S3, DynamoDB | 100+ services khác (ECR, SSM, SQS...) |
| Chi phí | ✅ Miễn phí | 💰 $0.01/giờ + $0.01/GB |
| Cách hoạt động | Thêm route trong Route Table | Tạo ENI trong subnet |

**Ví dụ tạo Gateway Endpoint cho S3:**
```bash
aws ec2 create-vpc-endpoint \
    --vpc-id vpc-xxx \
    --service-name com.amazonaws.ap-southeast-1.s3 \
    --route-table-ids rtb-xxx
```

---

### 11. VPC Flow Logs

**Tác dụng:** Ghi log tất cả traffic vào/ra VPC (để audit, troubleshoot, security).

```
┌─────────────────────────────────────────────────────────────┐
│                     VPC Flow Log Record                      │
├─────────────────────────────────────────────────────────────┤
│ version account-id interface-id srcaddr dstaddr srcport     │
│ dstport protocol packets bytes start end action log-status  │
├─────────────────────────────────────────────────────────────┤
│ 2 123456789012 eni-abc123 10.0.1.5 52.94.76.1 49152 443     │
│ 6 10 840 1620140761 1620140821 ACCEPT OK                    │
└─────────────────────────────────────────────────────────────┘
  │         │           │          │       │
  │         │           │          │       └─ Port đích (HTTPS)
  │         │           │          └─ IP đích (external)
  │         │           └─ IP nguồn (EC2 private)
  │         └─ Network Interface
  └─ Account ID
```

| Đặc điểm | Giá trị |
|----------|---------|
| Lưu ở đâu | CloudWatch Logs hoặc S3 |
| Chi phí | 💰 Phí lưu trữ log |
| Use case | Debug connectivity, security audit, compliance |

---

### 12. DHCP Option Sets

**Tác dụng:** Cấu hình DNS, domain name, NTP cho VPC.

| Option | Mô tả | Default |
|--------|-------|---------|
| domain-name | Domain nội bộ | ec2.internal (us-east-1) |
| domain-name-servers | DNS servers | AmazonProvidedDNS |
| ntp-servers | Time servers | Amazon Time Sync |
| netbios-name-servers | WINS servers | None |

**Khi nào cần custom?**
- Dùng Active Directory nội bộ
- Custom domain nội bộ (mycompany.local)
- Dùng DNS server riêng

---

## Bảng tổng hợp thành phần

| Thành phần | Tác dụng | Chi phí | Quan trọng? |
|------------|----------|---------|-------------|
| VPC | Mạng ảo | ✅ Free | ⭐⭐⭐ Bắt buộc |
| Subnet | Chia VPC | ✅ Free | ⭐⭐⭐ Bắt buộc |
| Route Table | Định tuyến | ✅ Free | ⭐⭐⭐ Bắt buộc |
| Internet Gateway | Ra internet | ✅ Free | ⭐⭐⭐ Cần cho public |
| NAT Gateway | Private ra internet | 💰 $32+/tháng | ⭐⭐ Tùy chọn |
| Elastic IP | IP tĩnh | 💰 $3.6/tháng | ⭐ Tùy chọn |
| Security Group | Firewall instance | ✅ Free | ⭐⭐⭐ Bắt buộc |
| Network ACL | Firewall subnet | ✅ Free | ⭐ Tùy chọn |
| VPC Peering | Nối 2 VPC | ✅ Free | ⭐ Khi cần |
| Transit Gateway | Hub nhiều VPC | 💰 $36+/tháng | ⭐ Khi cần |
| VPN Connection | Nối on-premise | 💰 $36+/tháng | ⭐ Khi cần |
| VPC Endpoint | Nối AWS services | ✅/💰 | ⭐⭐ Nên dùng |
| Flow Logs | Audit traffic | 💰 | ⭐ Production |

---

## Khi nào tạo VPC mới?

| Tình huống | Tạo VPC mới? | Lý do |
|------------|--------------|-------|
| Môi trường khác (Dev/Staging/Prod) | ✅ Có | Cách ly hoàn toàn |
| Dự án/khách hàng khác nhau | ✅ Có | Bảo mật, billing riêng |
| Team khác nhau cần độc lập | ✅ Có | Tự quản lý |
| Thêm tính năng trong cùng dự án | ❌ Không | Thêm subnet thôi |

## Khi nào tạo Subnet mới?

| Tình huống | Tạo Subnet mới? | Lý do |
|------------|-----------------|-------|
| Cần thêm AZ (high availability) | ✅ Có | Mỗi AZ cần subnet riêng |
| Tách public/private | ✅ Có | Bảo mật |
| Tầng ứng dụng khác nhau (Web/App/DB) | ✅ Có | Dễ quản lý, security riêng |
| Thêm EC2 cùng vai trò | ❌ Không | Đặt chung subnet |

---

## Ví dụ thực tế theo quy mô

### Startup nhỏ (MVP)

```
1 VPC
├── Public Subnet  → 1 EC2 (web + app)
├── Private Subnet → 1 RDS
└── Xong! 🎉

Chi phí thấp, đơn giản
```

### Công ty vừa

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Account                           │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   VPC-Prod     │  │  VPC-Staging   │  │    VPC-Dev     │ │
│  │                │  │                │  │                │ │
│  │ 4 subnets      │  │ 4 subnets      │  │ 2 subnets      │ │
│  │ (2 public,     │  │ (2 public,     │  │ (1 public,     │ │
│  │  2 private)    │  │  2 private)    │  │  1 private)    │ │
│  │                │  │                │  │                │ │
│  │ 10+ EC2        │  │ 4 EC2          │  │ 2 EC2          │ │
│  │ 2 RDS          │  │ 1 RDS          │  │ 1 RDS          │ │
│  │ Load Balancer  │  │                │  │                │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Công ty lớn / Enterprise

```
Multiple AWS Accounts:
├── Account Production
│   ├── VPC-App-A (10+ subnets)
│   ├── VPC-App-B (10+ subnets)
│   └── VPC-Shared-Services
│
├── Account Staging
│   └── VPC-Staging
│
├── Account Development
│   └── VPC-Dev
│
└── Account Network (Transit Gateway để kết nối tất cả)
```

---

## Quản lý VPC với AWS CLI

### Tạo VPC

```bash
aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=my-vpc}]'
```

### Tạo Subnet

```bash
# Public Subnet
aws ec2 create-subnet \
    --vpc-id vpc-xxx \
    --cidr-block 10.0.1.0/24 \
    --availability-zone ap-southeast-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1}]'

# Private Subnet
aws ec2 create-subnet \
    --vpc-id vpc-xxx \
    --cidr-block 10.0.2.0/24 \
    --availability-zone ap-southeast-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1}]'
```

### Tạo Internet Gateway

```bash
# Tạo IGW
aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=my-igw}]'

# Gắn vào VPC
aws ec2 attach-internet-gateway \
    --internet-gateway-id igw-xxx \
    --vpc-id vpc-xxx
```

### Xem thông tin VPC

```bash
aws ec2 describe-vpcs
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-xxx"
```

---

## Best Practices

### ✅ Nên làm

1. **Tách môi trường bằng VPC** - Dev, Staging, Prod riêng biệt
2. **Sử dụng nhiều AZ** - Tối thiểu 2 AZ cho production
3. **Private Subnet cho database** - Không bao giờ để DB ở public
4. **Đặt tên rõ ràng** - `prod-public-subnet-1a`, `dev-private-subnet-1b`
5. **Plan CIDR block** - Tránh overlap khi cần VPC Peering

### ❌ Không nên làm

1. **Dùng default VPC cho production** - Không đủ bảo mật
2. **CIDR quá nhỏ** - Khó mở rộng sau này
3. **Tất cả EC2 ở public subnet** - Tăng attack surface
4. **Quên NAT Gateway cho private subnet** - EC2 không update được

---

## CIDR Block là gì?

**CIDR (Classless Inter-Domain Routing)** là cách viết gọn để định nghĩa một dải địa chỉ IP.

### Cách đọc CIDR

```
    10.0.0.0/16
    ────┬───  ─┬─
        │      │
   IP bắt đầu  Số bit cố định (network prefix)
```

**Quy tắc đơn giản:**
- Số sau `/` càng **nhỏ** → Dải IP càng **lớn**
- Số sau `/` càng **lớn** → Dải IP càng **nhỏ**

### Bảng CIDR phổ biến

| CIDR | Số IP khả dụng | Dùng cho | Ví dụ |
|------|----------------|----------|-------|
| /16 | 65,536 | VPC lớn | 10.0.0.0/16 → 10.0.0.0 - 10.0.255.255 |
| /20 | 4,096 | VPC vừa | 10.0.0.0/20 → 10.0.0.0 - 10.0.15.255 |
| /24 | 256 | Subnet thông thường | 10.0.1.0/24 → 10.0.1.0 - 10.0.1.255 |
| /28 | 16 | Subnet nhỏ | 10.0.1.0/28 → 10.0.1.0 - 10.0.1.15 |
| /32 | 1 | Một IP duy nhất | 10.0.1.5/32 → Chỉ 10.0.1.5 |

### Cách tính nhanh số IP

```
Số IP = 2^(32 - số sau dấu /)

Ví dụ:
  /16 → 2^(32-16) = 2^16 = 65,536 IPs
  /24 → 2^(32-24) = 2^8  = 256 IPs
  /28 → 2^(32-28) = 2^4  = 16 IPs
```

### AWS Reserved IPs

> ⚠️ **Lưu ý**: Trong mỗi subnet, AWS **giữ lại 5 IP đầu và cuối**:

```
Subnet 10.0.1.0/24 (256 IPs):
  10.0.1.0   → Network address (không dùng được)
  10.0.1.1   → VPC Router
  10.0.1.2   → DNS Server
  10.0.1.3   → Reserved cho tương lai
  10.0.1.255 → Broadcast (không dùng được)
  
  → Thực tế dùng được: 256 - 5 = 251 IPs
```

### Private IP Ranges (RFC 1918)

Các dải IP dùng cho mạng nội bộ (không đi ra internet):

| Dải | Range | Thường dùng |
|-----|-------|-------------|
| **10.0.0.0/8** | 10.0.0.0 - 10.255.255.255 | VPC AWS (phổ biến nhất) |
| **172.16.0.0/12** | 172.16.0.0 - 172.31.255.255 | VPC AWS |
| **192.168.0.0/16** | 192.168.0.0 - 192.168.255.255 | Mạng gia đình, văn phòng nhỏ |

### Ví dụ phân chia thực tế

**Dự án nhỏ:**
```
VPC: 10.0.0.0/16

├── Public Subnet:  10.0.1.0/24  (251 IPs khả dụng)
└── Private Subnet: 10.0.2.0/24  (251 IPs khả dụng)
```

**Dự án production (Multi-AZ):**
```
VPC: 10.0.0.0/16 (65,536 IPs)

├── Public Subnet AZ-A:   10.0.1.0/24   (251 IPs)
├── Public Subnet AZ-B:   10.0.2.0/24   (251 IPs)
├── Private Subnet AZ-A:  10.0.10.0/24  (251 IPs)
├── Private Subnet AZ-B:  10.0.11.0/24  (251 IPs)
├── DB Subnet AZ-A:       10.0.20.0/24  (251 IPs)
└── DB Subnet AZ-B:       10.0.21.0/24  (251 IPs)

Tổng đã dùng: 6 x 256 = 1,536 IPs
Còn lại: 65,536 - 1,536 = 64,000 IPs (dư sức mở rộng)
```

**Nhiều môi trường:**
```
Account AWS:

├── VPC-Prod:    10.0.0.0/16   (65,536 IPs)
├── VPC-Staging: 10.1.0.0/16   (65,536 IPs)  ← Không overlap!
└── VPC-Dev:     10.2.0.0/16   (65,536 IPs)  ← Có thể VPC Peering

⚠️ Nếu muốn kết nối các VPC, CIDR KHÔNG ĐƯỢC TRÙNG nhau
```

### Tips chọn CIDR

| Tình huống | Khuyến nghị |
|------------|-------------|
| VPC mới, chưa biết scale | **/16** - dư dả, không tốn tiền |
| Cần VPC Peering nhiều VPC | Lên kế hoạch trước, tránh overlap |
| Subnet cho NAT Gateway | **/28** là đủ (chỉ cần vài IP) |
| Subnet cho EKS/K8s | **/19 hoặc /20** - K8s cần nhiều IP cho pods |

---

## Tài liệu tham khảo

- [Amazon VPC Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [VPC Subnets](https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html)
- [VPC Pricing](https://aws.amazon.com/vpc/pricing/)

---

*Liên kết:*
- [Security Groups](security-groups.md) - Virtual Firewall
- [IAM](iam.md) - Identity and Access Management
