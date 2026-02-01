# Amazon VPC (Virtual Private Cloud)


## Mục lục

- [VPC là gì?](#vpc-là-gì)
- [Tác dụng của VPC](#tác-dụng-của-vpc)
- [CIDR Notation trong VPC](#cidr-notation-trong-vpc)
- [Chi phí VPC](#chi-phí-vpc)
- [Subnet là gì?](#subnet-là-gì)
- [Tác dụng của Subnet](#tác-dụng-của-subnet)
- [Public Subnet vs Private Subnet](#public-subnet-vs-private-subnet)
- [Các thành phần trong VPC Dashboard](#các-thành-phần-trong-vpc-dashboard)
- [Khi nào tạo VPC mới?](#khi-nào-tạo-vpc-mới)
- [Khi nào tạo Subnet mới?](#khi-nào-tạo-subnet-mới)
- [Ví dụ thực tế theo quy mô](#ví-dụ-thực-tế-theo-quy-mô)
- [Quản lý VPC với AWS CLI](#quản-lý-vpc-với-aws-cli)
- [Best Practices](#best-practices)
- [CIDR Block là gì?](#cidr-block-là-gì)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

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

### VPC Scope: Regional Resource

> ⚠️ **Quan trọng:** VPC là **Regional resource** - chỉ thuộc **1 Region** nhưng có thể span **nhiều Availability Zones** trong region đó.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    VPC Scope - Regional Resource                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AWS Region: ap-southeast-1 (Singapore)                                     │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                        VPC (10.0.0.0/16)                                │ │
│   │                                                                         │ │
│   │    AZ: ap-se-1a        AZ: ap-se-1b        AZ: ap-se-1c               │ │
│   │   ┌────────────┐      ┌────────────┐      ┌────────────┐              │ │
│   │   │ Subnet A   │      │ Subnet B   │      │ Subnet C   │              │ │
│   │   │10.0.1.0/24 │      │10.0.2.0/24 │      │10.0.3.0/24 │              │ │
│   │   │            │      │            │      │            │              │ │
│   │   │ (1 AZ only)│      │ (1 AZ only)│      │ (1 AZ only)│              │ │
│   │   └────────────┘      └────────────┘      └────────────┘              │ │
│   │                                                                         │ │
│   │   ✅ VPC span MULTIPLE AZs trong cùng 1 Region                         │ │
│   │   ✅ Subnet chỉ thuộc 1 AZ duy nhất                                    │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ❌ VPC KHÔNG span multiple Regions!                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

   AWS Region: us-east-1 (N. Virginia)
   ┌────────────────────────────────────────────────────────────────────────┐
   │                    VPC KHÁC (172.16.0.0/16)                            │
   │                    (Hoàn toàn riêng biệt, cần Peering để kết nối)      │
   └────────────────────────────────────────────────────────────────────────┘
```

| Resource | Scope | Span |
|----------|-------|------|
| **VPC** | 1 Region | Multiple AZs |
| **Subnet** | 1 Availability Zone | Không span AZ khác |
| **Security Group** | 1 VPC | Áp dụng cho resources trong VPC |
| **Internet Gateway** | 1 VPC | Attached to 1 VPC |
| **NAT Gateway** | 1 AZ | Deploy trong 1 subnet |
| **Route Table** | 1 VPC | Associate với nhiều subnets |

**Kết nối VPCs ở nhiều Regions:** Dùng [VPC Peering](#vpc-peering) hoặc [Transit Gateway](#transit-gateway-tgw) với cross-region peering.

---

## CIDR Notation trong VPC

**CIDR (Classless Inter-Domain Routing)** là cách biểu diễn dải địa chỉ IP:

```
10 . 0 . 0 . 0 / 16
│    │   │   │   │
│    │   │   │   └─ Subnet mask (16 bits cố định cho network)
│    │   │   └─ Octet 4 (Host)
│    │   └─ Octet 3 (thường dùng phân biệt subnet)
│    └─ Octet 2
└─ Octet 1
```

### Ý nghĩa của /16, /24, /8

| Subnet Mask | Octet cố định | Octet thay đổi | Số IP |
|-------------|---------------|----------------|-------|
| `/8` | 1 | 2, 3, 4 | 16,777,216 |
| `/16` | 1, 2 | 3, 4 | 65,536 |
| `/24` | 1, 2, 3 | 4 | 256 |

**Với VPC /16 (phổ biến nhất):**
- Octet 1, 2 cố định (ví dụ: `10.0`)
- Octet 3 dùng để **phân biệt subnet** (`10.0.1.x`, `10.0.2.x`...)
- Octet 4 dùng cho **host** trong subnet

### Dải Private IP được phép dùng

| Dải Private IP | CIDR phổ biến | Ghi chú |
|----------------|---------------|---------|
| `10.0.0.0/8` | `10.0.0.0/16`, `10.1.0.0/16`... | Phổ biến nhất |
| `172.16.0.0/12` | `172.16.0.0/16`, `172.31.0.0/16`... | AWS default VPC |
| `192.168.0.0/16` | `192.168.0.0/24` | Thường dùng cho mạng nhỏ |

### Ví dụ quy hoạch CIDR cho nhiều VPC

```
VPC Dev:     10.0.0.0/16  → 10.0.x.x
VPC Staging: 10.1.0.0/16  → 10.1.x.x  
VPC Prod:    10.2.0.0/16  → 10.2.x.x
```

> ⚠️ **Lưu ý:** Nếu cần **VPC Peering** sau này, các CIDR không được trùng nhau!

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

### VPC Traffic Control - Ai làm gì?

Nhiều người nhầm lẫn các components trong VPC. Đây là tóm tắt:

```
                         Internet
                             │
                             ▼
                    ┌─────────────────┐
        GATEWAY     │ Internet Gateway│  ← Chỉ là "cửa", KHÔNG filter
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
        ROUTING     │   Route Table   │  ← Quyết định traffic ĐI ĐÂU (outbound)
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
        FIREWALL    │      NACL       │  ← Firewall SUBNET (allow/deny)
        (Layer 1)   └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
        FIREWALL    │ Security Group  │  ← Firewall INSTANCE (allow only)
        (Layer 2)   └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │       EC2       │
                    └─────────────────┘
```

| Component | Vai trò | Kiểm soát | Inbound? | Outbound? |
|-----------|---------|-----------|----------|-----------|
| **Internet Gateway** | Cửa ngõ | ❌ Không filter | - | - |
| **Route Table** | Định tuyến | Traffic đi đường nào | ❌ | ✅ |
| **NACL** | Firewall subnet | Allow/Deny ports | ✅ | ✅ |
| **Security Group** | Firewall instance | Allow ports | ✅ | ✅ |

> ⚠️ **Lưu ý quan trọng:**
> - **Route Table** chỉ kiểm soát **outbound** (đi ra), không kiểm soát inbound
> - **Security Group + NACL** kiểm soát cả **inbound lẫn outbound**
> - **Internet Gateway** chỉ là "đường đi", không quyết định ai được vào

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

### Bảng tổng hợp thành phần

| STT | Thành phần | Tác dụng | Chi phí | Quan trọng? |
|-----|------------|----------|---------|-------------|
| - | VPC | Mạng ảo | ✅ Free | ⭐⭐⭐ Bắt buộc |
| - | Subnet | Chia VPC | ✅ Free | ⭐⭐⭐ Bắt buộc |
| 1 | [Internet Gateway](#1-internet-gateway-igw) | Ra internet | ✅ Free | ⭐⭐⭐ Cần cho public |
| 2 | [NAT Gateway](#2-nat-gateway) | Private ra internet | 💰 $32+/tháng | ⭐⭐ Tùy chọn |
| 3 | [Route Table](#3-route-table) | Định tuyến | ✅ Free | ⭐⭐⭐ Bắt buộc |
| 4 | [Elastic IP](#4-elastic-ip-eip) | IP tĩnh | 💰 $3.6/tháng | ⭐ Tùy chọn |
| 5 | [VPC Peering](#5-vpc-peering) | Nối 2 VPC | ✅ Free | ⭐ Khi cần |
| 6 | [Transit Gateway](#6-transit-gateway) | Hub nhiều VPC | 💰 $36+/tháng | ⭐ Khi cần |
| 7 | [VPN Connection](#7-vpn-connection-site-to-site-vpn) | Nối on-premise | 💰 $36+/tháng | ⭐ Khi cần |
| 8 | [Client VPN](#8-aws-client-vpn) | VPN cá nhân | 💰 $0.05/giờ | ⭐ Khi cần |
| 9 | [Security Group](#9-security-groups) | Firewall instance | ✅ Free | ⭐⭐⭐ Bắt buộc |
| 10 | [Network ACL](#10-network-acls-nacls) | Firewall subnet | ✅ Free | ⭐ Tùy chọn |
| 11 | [VPC Endpoint](#11-vpc-endpoints) | Nối AWS services | ✅/💰 | ⭐⭐ Nên dùng |
| 12 | [PrivateLink](#12-aws-privatelink) | Expose service | 💰 $0.01/giờ | ⭐ Khi cần |
| 13 | [Flow Logs](#13-vpc-flow-logs) | Audit traffic | 💰 | ⭐ Production |
| 14 | [DHCP Option Sets](#14-dhcp-option-sets) | Cấu hình DNS | ✅ Free | ⭐ Tùy chọn |

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

#### NAT là gì?

**NAT (Network Address Translation)** = Dịch địa chỉ IP private → public để ra internet.

```
Private Subnet                NAT Gateway              Internet
┌─────────┐                  ┌─────────┐
│   EC2   │  10.0.1.5  ───►  │   NAT   │  52.1.2.3  ───►  google.com
│(private)│                  │(public) │
└─────────┘                  └─────────┘
     │                            │
     └── Không có public IP       └── Có public IP, "đại diện" gửi request
```

**Tại sao cần NAT?**
- EC2 trong **private subnet** không có public IP
- Nhưng vẫn cần ra internet (cập nhật OS, gọi API, download package...)
- NAT đứng giữa, dùng IP public của nó để gửi request thay

| Chiều | Có thể? |
|-------|---------|
| Private → Internet | ✅ Được (qua NAT) |
| Internet → Private | ❌ Không được |

> ⚠️ **Lưu ý:** NAT chỉ cần cho traffic **ra internet**. EC2 trong private subnet **vẫn kết nối bình thường** với các resources khác trong VPC (qua local route):

```
┌─────────────────────────────────────────────────────────────┐
│                         VPC (10.0.0.0/16)                   │
│                                                             │
│   ┌─────────────────┐         ┌─────────────────┐          │
│   │ Public Subnet   │         │ Private Subnet  │          │
│   │                 │   ✅    │                 │          │
│   │  ┌───────────┐  │ Kết nối │  ┌───────────┐  │          │
│   │  │ EC2 Web   │◄─┼─────────┼─►│ EC2 App   │  │          │
│   │  └───────────┘  │  OK!    │  └─────┬─────┘  │          │
│   └─────────────────┘         │   ✅   ▼        │          │
│                               │  ┌───────────┐  │          │
│                               │  │    RDS    │  │          │
│                               │  └───────────┘  │          │
│                               └─────────────────┘          │
└─────────────────────────────────────────────────────────────┘

Route Table: 10.0.0.0/16 → local (traffic trong VPC không cần NAT)
```

#### NAT Gateway trong AWS

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

#### NAT Gateway vs NAT Instance

| Tiêu chí | NAT Gateway | NAT Instance |
|----------|-------------|--------------|
| **Managed by** | ✅ AWS quản lý hoàn toàn | ❌ Bạn tự quản lý (EC2) |
| **High Availability** | ✅ Tự động trong 1 AZ | ❌ Phải tự setup failover |
| **Bandwidth** | Tự động scale đến 100 Gbps | Phụ thuộc instance type |
| **Maintenance** | ✅ AWS patching | ❌ Bạn tự patch OS |
| **Security Group** | ❌ Không hỗ trợ | ✅ Có thể attach SG |
| **Bastion Host** | ❌ Không thể | ✅ Có thể dùng làm bastion |
| **Port forwarding** | ❌ Không hỗ trợ | ✅ Có thể cấu hình |
| **Chi phí** | 💰 ~$32/tháng + data | 💸 ~$8/tháng (t3.micro) |

> 💡 **NAT Instance** là giải pháp cũ trước khi AWS có NAT Gateway (2015). Hiện tại chỉ nên dùng cho dev/test để tiết kiệm chi phí.

#### NAT vs Bastion - Hiểu đơn giản

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NAT vs BASTION (Jump Server)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BASTION / JUMP SERVER                  NAT GATEWAY                     │
│  ──────────────────────                 ────────────                    │
│                                                                         │
│  Internet ──► Bastion ──► Private EC2   Private EC2 ──► NAT ──► Internet│
│                                                                         │
│  ✅ Cho phép VÀO (inbound)              ✅ Cho phép RA (outbound)       │
│  ❌ Không dùng cho outbound             ❌ Không cho VÀO                │
│                                                                         │
│  Mục đích: SSH/RDP vào private EC2      Mục đích: EC2 ra internet       │
│            từ bên ngoài                           (update, API calls)   │
│                                                                         │
│              ┌─────────────────────────────┐                            │
│              │       PRIVATE SUBNET        │                            │
│              │                             │                            │
│ ┌─────────┐  │      ┌─────────────┐        │      ┌──────────┐          │
│ │  Admin  │──┼─────►│   EC2 App   │────────┼─────►│ Internet │          │
│ │ (SSH)   │  │      └─────────────┘        │      │ (apt-get)│          │
│ └─────────┘  │                             │      └──────────┘          │
│      │       │                             │           ▲                │
│      ▼       │                             │           │                │
│ ┌─────────┐  │                             │      ┌─────────┐           │
│ │ Bastion │──┘                             └──────│   NAT   │           │
│ └─────────┘                                       └─────────┘           │
│ (Cửa VÀO)                                        (Cửa RA)               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

> 🎯 **Tóm lại:** Bastion = "Cửa VÀO" (cho admin SSH vào), NAT = "Cửa RA" (cho EC2 ra internet)

#### Tại sao NAT phải đặt riêng?

NAT không thể chạy trong chính EC2 mà nó bảo vệ vì:
1. **NAT cần Public IP** để giao tiếp với internet → nếu EC2 có Public IP → internet gọi được VÀO → mất tính "private"
2. **NAT là "cầu nối"** giữa private network và internet → phải đứng ở giữa, không thể nằm trong 1 bên

---

### 3. Route Table

**Tác dụng:** Quyết định traffic **đi ra (outbound)** đi đâu dựa trên destination IP.

> ⚠️ **Lưu ý quan trọng:** Route Table chỉ kiểm soát **outbound traffic**, không kiểm soát inbound.

#### Các loại Route Table

| Loại | Mô tả |
|------|-------|
| **Main Route Table** | Route table **mặc định** tạo tự động khi tạo VPC. Subnet không associate với custom route table sẽ dùng Main. |
| **Custom Route Table** | Route table bạn **tự tạo** để cấu hình routing riêng cho từng subnet. |

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPC                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   MAIN ROUTE TABLE (mặc định)                                    │
│   └── Tự động tạo khi tạo VPC                                   │
│   └── Chỉ có route "local" (10.0.0.0/16 → local)               │
│   └── Subnet không associate → dùng Main                        │
│   └── KHÔNG THỂ XÓA (chỉ có thể thay đổi Main)                  │
│                                                                  │
│   CUSTOM ROUTE TABLE (tự tạo)                                    │
│   └── Bạn tự tạo cho mục đích riêng                             │
│   └── Thêm route đến IGW, NAT, VPN...                           │
│   └── Associate với subnet cụ thể                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Route Table Associations

Route Table có thể associate vào **2 loại**:

| Association Type | Mô tả | Use Case |
|------------------|-------|----------|
| **Subnet Association** | Mỗi subnet **phải** associate với 1 route table | Định tuyến traffic ra/vào subnet (phổ biến nhất) |
| **Gateway Association** | Route table gắn vào IGW hoặc VGW | Kiểm soát traffic **inbound** từ gateway (nâng cao) |

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTE TABLE ASSOCIATIONS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1️⃣ SUBNET ASSOCIATION (phổ biến nhất)                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━                                        │
│                                                                  │
│     Route Table "Public"                                         │
│          │                                                       │
│          ├── Public Subnet 1  → 0.0.0.0/0 → IGW                 │
│          └── Public Subnet 2                                    │
│                                                                  │
│     Route Table "Private"                                        │
│          │                                                       │
│          ├── Private Subnet 1 → 0.0.0.0/0 → NAT                 │
│          └── Private Subnet 2                                   │
│                                                                  │
│  2️⃣ GATEWAY ASSOCIATION (Edge Association - nâng cao)           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                      │
│                                                                  │
│     Route Table ────── Internet Gateway                          │
│     Route Table ────── Virtual Private Gateway (VPN)            │
│                                                                  │
│     → Kiểm soát traffic INBOUND từ gateway vào VPC              │
│     → Dùng cho Middlebox routing (firewall appliance...)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Quy tắc | Chi tiết |
|---------|---------|
| **1 Subnet - 1 Route Table** | Mỗi subnet chỉ associate với **1 route table** tại 1 thời điểm |
| **1 Route Table - Nhiều Subnet** | 1 route table có thể associate với **nhiều subnets** |
| **Implicit association** | Subnet không explicit associate → dùng **Main Route Table** |
| **Main không xóa được** | Main Route Table **không thể xóa**, chỉ có thể đổi Main sang table khác |
| **Local route bắt buộc** | Mọi route table đều có route "local" (VPC CIDR → local), **không thể xóa** |

#### Local Route - Kết nối nội bộ trong VPC

**Local route** (`10.0.0.0/16 → local`) là route **tự động có sẵn** trong mọi Route Table, cho phép traffic **trong VPC** đi đến nhau.

```
┌─────────────────────────────────────────────────────────────────┐
│  MỌI ROUTE TABLE ĐỀU CÓ SẴN:                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┬─────────────┐                                 │
│   │ Destination │   Target    │                                 │
│   ├─────────────┼─────────────┤                                 │
│   │ 10.0.0.0/16 │   local     │ ← TỰ ĐỘNG, KHÔNG XÓA ĐƯỢC!     │
│   │ 0.0.0.0/0   │   igw-xxx   │ ← Bạn thêm (nếu cần)           │
│   └─────────────┴─────────────┘                                 │
│                                                                  │
│   "local" = VPC's implicit router                               │
│   → Traffic trong VPC sẽ đi nội bộ, không ra internet          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Mặc định trong VPC có kết nối được với nhau không?**

| Lớp | Chức năng | Mặc định |
|-----|-----------|----------|
| **Route Table (Local route)** | Có đường đi không? | ✅ Có (không xóa được) |
| **Security Group** | Cho phép traffic không? | ⚠️ Phải cấu hình! |

```
EC2-A (10.0.1.50) muốn gọi RDS (10.0.2.100) port 3306:

1. ROUTING CHECK:
   Route Table: 10.0.0.0/16 → local ✅
   → Có đường đi!

2. SECURITY CHECK:
   Security Group của RDS:
   - Inbound: Allow port 3306 from 10.0.1.50?
     - Nếu CÓ → ✅ Kết nối được!
     - Nếu KHÔNG → ❌ Bị block!
```

> 💡 **Local route chỉ giải quyết ROUTING** (có đường đi), còn **Security Group quyết định có cho đi qua hay không**!

```
EC2 gửi request đến google.com:

1. OUTBOUND: Route Table quyết định đi đường nào
   EC2 → Route Table kiểm tra → NAT Gateway → Internet → google.com
        "0.0.0.0/0 → nat-xxx"

2. RESPONSE: Tự động quay về theo đường cũ
   google.com → Internet → NAT Gateway → EC2
        (không cần route riêng)
```

| Loại traffic | Route Table quyết định? |
|--------------|------------------------|
| Outbound (gửi đi) | ✅ Có |
| Response (trả về) | ❌ Không (tự động) |
| Inbound từ bên ngoài | ❌ Không (Security Group/NACL kiểm soát) |

**Ví dụ Route Table:**

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

**Tác dụng:** Kết nối 2 VPC với nhau (cùng hoặc khác account/region), cho phép giao tiếp bằng **private IP**.

#### Vấn đề: VPC mặc định cách ly hoàn toàn

```
┌─────────────────┐              ┌─────────────────┐
│    VPC-Prod     │      ❌      │    VPC-Dev      │
│  10.0.0.0/16    │   Không thể  │  172.16.0.0/16  │
│                 │   kết nối!   │                 │
│   ┌─────────┐   │              │   ┌─────────┐   │
│   │  EC2-A  │──────────────────│   │  EC2-B  │   │
│   │10.0.1.5 │   │              │   │172.16.1.5│  │
│   └─────────┘   │              │   └─────────┘   │
└─────────────────┘              └─────────────────┘

EC2-A muốn gọi EC2-B bằng private IP?
→ KHÔNG THỂ! (khác VPC = khác mạng hoàn toàn)
```

#### Giải pháp: VPC Peering

```
┌─────────────────┐              ┌─────────────────┐
│    VPC-Prod     │◄────────────►│    VPC-Dev      │
│  10.0.0.0/16    │ VPC Peering  │  172.16.0.0/16  │
│                 │  Connection  │                 │
│   ┌─────────┐   │      ✅      │   ┌─────────┐   │
│   │  EC2-A  │◄─────────────────►  │  EC2-B  │   │
│   │10.0.1.5 │   │  Gọi được!   │   │172.16.1.5│  │
│   └─────────┘   │              │   └─────────┘   │
└─────────────────┘              └─────────────────┘

EC2-A ping 172.16.1.5 → ✅ Thành công!
```

#### Use Cases thực tế

| Tình huống | Giải thích |
|------------|------------|
| **Dev gọi Prod database** | Team dev cần test với data thật từ RDS Prod |
| **Shared Services** | VPC chung chứa logging, monitoring cho nhiều VPC khác dùng |
| **Multi-account** | Công ty có nhiều AWS account, mỗi account có VPC riêng nhưng cần giao tiếp |
| **Microservices** | Service A (VPC-1) cần gọi Service B (VPC-2) |

#### Tại sao không gọi qua Internet?

| Cách | Ưu điểm | Nhược điểm |
|------|---------|------------|
| **Qua Internet** | Đơn giản | 💰 Tốn phí NAT, 🐢 Latency cao, 🔓 Kém bảo mật |
| **VPC Peering** | ✅ Miễn phí*, ⚡ Low latency, 🔒 Private | Cần setup route tables |

```
Qua Internet:
  EC2-A → NAT Gateway → Internet → NAT Gateway → EC2-B
          💰 $0.045/GB    🐢 Latency cao    🔓 Public

VPC Peering:
  EC2-A → Private Network → EC2-B
          ✅ Free*         ⚡ Low latency   🔒 Private

(*Chỉ trả data transfer nếu cross-AZ/region: $0.01/GB)
```

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí | ✅ Miễn phí (chỉ trả data transfer cross-AZ/region) |
| Data transfer | $0.01/GB cross-AZ |
| Giới hạn | Không transitive (A↔B, B↔C ≠ A↔C) |
| CIDR | Không được trùng nhau |

> ⚠️ **Lưu ý về Transitive:** VPC Peering không hỗ trợ transitive routing. Nếu VPC-A peering với VPC-B, và VPC-B peering với VPC-C, **VPC-A không thể gọi VPC-C** qua VPC-B. Cần tạo peering riêng A↔C hoặc dùng Transit Gateway.

---

### 6. Transit Gateway

**Tác dụng:** Hub trung tâm kết nối nhiều VPC và on-premise (thay thế nhiều VPC Peering).

#### Vấn đề: Kết nối nhiều VPC với VPC Peering

```
KHÔNG có Transit Gateway (dùng VPC Peering):

    VPC-A ◄──────► VPC-B
      │              │
      │              │
      ▼              ▼
    VPC-C ◄──────► VPC-D

3 VPC cần 3 peering: A↔B, A↔C, B↔C
4 VPC cần 6 peering: A↔B, A↔C, A↔D, B↔C, B↔D, C↔D
5 VPC cần 10 peering...
10 VPC cần 45 peering!!! 😱

→ Công thức: n(n-1)/2 peering connections
→ Quản lý RẤT PHỨC TẠP!
```

#### Giải pháp: Transit Gateway

```
CÓ Transit Gateway:

                    ┌─────────────────┐
                    │ Transit Gateway │
                    │   (Hub trung    │
                    │     tâm)        │
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           │         │       │       │         │
           ▼         ▼       ▼       ▼         ▼
        ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
        │VPC-A│  │VPC-B│  │VPC-C│  │VPC-D│  │VPC-E│
        └─────┘  └─────┘  └─────┘  └─────┘  └─────┘
  
10 VPC? Chỉ cần 10 attachments!
→ Tất cả VPC đều có thể gọi nhau (transitive routing)!
→ Quản lý TẬP TRUNG!
```

#### So sánh VPC Peering vs Transit Gateway

| Tiêu chí | VPC Peering | Transit Gateway |
|----------|-------------|-----------------|
| **Topology** | Mesh (lưới) | Hub-and-spoke (trục) |
| **Transitive** | ❌ Không (A↔B, B↔C ≠ A↔C) | ✅ Có (A↔Hub↔C = A↔C) |
| **Số connections (10 VPC)** | 45 peering 😱 | 10 attachments ✅ |
| **On-premise** | ❌ Không hỗ trợ | ✅ Hỗ trợ (VPN, Direct Connect) |
| **Cross-region** | ✅ Có | ✅ Có (peering giữa TGW) |
| **Chi phí** | Free (chỉ data) | 💰 $0.05/giờ + $0.02/GB |
| **Quản lý** | Phức tạp khi scale | Tập trung |

#### Use Cases

| Tình huống | Giải thích |
|------------|------------|
| **Nhiều VPC (>3)** | Tránh quản lý hàng chục peering connections |
| **Shared Services** | VPC chung (logging, monitoring) cần kết nối với tất cả VPC khác |
| **Hybrid Cloud** | Kết nối on-premise với nhiều VPC qua VPN hoặc Direct Connect |
| **Multi-region** | Kết nối VPC ở nhiều region khác nhau (TGW peering) |
| **Multi-account** | Công ty có nhiều AWS account, mỗi account có VPC |

#### Chi phí

| Thành phần | Chi phí |
|------------|---------|
| **Per attachment** | 💰 $0.05/giờ (~$36/tháng mỗi VPC) |
| **Per GB** | 💰 $0.02/GB (cross-VPC traffic) |

**Ví dụ:** 5 VPC attachments + 100GB data/tháng:
```
Attachments: $0.05 × 24h × 30 × 5 = $180/tháng
Data:        $0.02 × 100 = $2/tháng
Tổng:        ~$182/tháng
```

#### Khi nào dùng cái nào?

| Số VPC | Recommendation |
|--------|----------------|
| **2-3 VPC** | 🏆 VPC Peering (đơn giản, miễn phí) |
| **4+ VPC** | 🏆 Transit Gateway (dễ quản lý) |
| **Cần on-premise** | 🏆 Transit Gateway |
| **Budget hạn chế** | VPC Peering (dù nhiều VPC) |

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí | 💰 $0.05/giờ per attachment + $0.02/GB |
| Use case | Nhiều VPC (>3), kết nối on-premise, multi-region |
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

#### Tại sao Site-to-Site VPN cần Public Internet?

Site-to-Site VPN **sử dụng kết nối Internet có sẵn** của công ty (từ ISP như Viettel, VNPT, FPT) để tạo tunnel mã hóa đến AWS.

```
┌──────────────┐                                          ┌──────────────┐
│  On-Premises │                                          │     AWS      │
│              │      ┌─────────────────────────┐         │              │
│  ┌────────┐  │      │   PUBLIC INTERNET       │         │  ┌────────┐  │
│  │ VPN    │◄─┼─────►│   🌐 🌐 🌐 🌐 🌐 🌐     │◄───────┼─►│ VGW    │  │
│  │Gateway │  │      │   (ISP → Internet →ISP) │         │  │        │  │
│  └────────┘  │      └─────────────────────────┘         │  └────────┘  │
│              │           ▲                              │              │
└──────────────┘           │                              └──────────────┘
                    IPsec Tunnel (encrypted)
```

**Lý do cần Internet:**
- Công ty **đã có sẵn đường Internet** từ ISP → không cần đầu tư hạ tầng mới
- VPN chỉ cần **tạo tunnel mã hóa (IPsec)** đi qua Internet có sẵn đó
- **Setup nhanh, chi phí thấp** (chỉ vài phút - vài giờ)
- Nhưng: Latency **phụ thuộc vào chất lượng Internet**, không ổn định

> 💡 **So với Direct Connect:** Direct Connect dùng **đường cáp quang riêng** (dedicated fiber) từ on-premises đến AWS, **không đi qua Internet** → latency thấp, ổn định, nhưng setup 4-12 tuần và chi phí cao hơn.

**Xem thêm:** [AWS Direct Connect](direct-connect.md) - Kết nối vật lý chuyên dụng, không qua Internet.

---

### 8. AWS Client VPN

**Tác dụng:** Cho phép **người dùng cá nhân** (developer, admin) kết nối **từ laptop** vào VPC một cách an toàn.

#### Phân biệt Site-to-Site VPN vs Client VPN

| Tiêu chí | Site-to-Site VPN | Client VPN |
|----------|------------------|------------|
| **Mục đích** | Kết nối văn phòng/DC | Kết nối người dùng cá nhân |
| **Ai dùng** | Toàn bộ network | Developer, admin, remote worker |
| **Thiết bị** | Router/Firewall | Laptop, PC (VPN client app) |
| **Protocol** | IPSec | OpenVPN (SSL/TLS) |
| **Setup** | Phức tạp (cần hardware) | Đơn giản (chỉ cần app) |

```
┌─────────────────────────────────────────────────────────────────────┐
│                     2 LOẠI VPN TRONG AWS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   SITE-TO-SITE VPN                    CLIENT VPN                     │
│   (Kết nối văn phòng)                 (Kết nối cá nhân)              │
│                                                                      │
│   ┌──────────────┐                    ┌──────────────┐               │
│   │  On-Premise  │                    │   Laptop     │               │
│   │  Data Center │                    │   (Từ nhà)   │               │
│   │  (Nhiều máy) │                    │   (1 người)  │               │
│   └──────┬───────┘                    └──────┬───────┘               │
│          │                                   │                       │
│          │ IPSec Tunnel                      │ OpenVPN/SSL           │
│          │                                   │                       │
│          ▼                                   ▼                       │
│   ┌──────────────┐                    ┌──────────────┐               │
│   │   Virtual    │                    │  Client VPN  │               │
│   │   Private    │                    │   Endpoint   │               │
│   │   Gateway    │                    │              │               │
│   └──────┬───────┘                    └──────┬───────┘               │
│          │                                   │                       │
│          ▼                                   ▼                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                          YOUR VPC                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Client VPN hoạt động như thế nào?

```
┌─────────────────┐
│  Your Laptop    │
│   (Từ nhà)      │
│ ┌─────────────┐ │
│ │ VPN Client  │ │
│ └──────┬──────┘ │
└────────┼────────┘
         │
         │ OpenVPN (SSL/TLS encrypted)
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              VPC                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    Client VPN Endpoint                        │   │
│   │            (Assign IP: 10.0.100.10 cho laptop)               │   │
│   └───────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│                               │ Laptop giờ "như trong VPC"          │
│                               ▼                                      │
│   ┌─────────────────┐                                               │
│   │  PRIVATE Subnet │                                               │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐                   │
│   │  │   EC2     │  │   RDS     │  │   ECS     │                   │
│   │  └───────────┘  └───────────┘  └───────────┘                   │
│   └─────────────────┘                                               │
│                                                                      │
│   Developer SSH trực tiếp vào EC2, connect RDS, truy cập internal web│
└─────────────────────────────────────────────────────────────────────┘
```

#### So sánh Client VPN vs Jump Server (Bastion Host)

Nhiều công ty dùng **Jump Server (Bastion Host)** để truy cập VPC. Đây là so sánh:

| Tiêu chí | Jump Server (Bastion) | Client VPN |
|----------|----------------------|------------|
| **Cách hoạt động** | SSH qua 1 máy trung gian | Laptop "như trong VPC" |
| **Số bước** | 2 bước (Laptop → Bastion → EC2) | 1 bước (Laptop → EC2 trực tiếp) |
| **Expose ra internet** | ✅ Bastion có Public IP | ❌ Không cần expose gì |
| **Bảo mật** | ⚠️ Bastion là attack surface | 🔒 Không có server exposed |
| **Truy cập RDS** | ❌ Khó (cần tunnel hoặc tool) | ✅ Trực tiếp connect |
| **Truy cập web internal** | ❌ Cần port forwarding | ✅ Mở browser trực tiếp |
| **Quản lý user** | Quản lý SSH key trên Bastion | Quản lý qua Certificate/AD/SSO |

**Chi phí so sánh:**

| | Jump Server | Client VPN |
|---|-------------|------------|
| **Infra** | EC2 t3.micro ~$8/tháng | $72/tháng (endpoint) |
| **Connection** | Free | $0.05/giờ/connection |
| **10 dev, 8h/ngày** | ~$8/tháng | ~$152/tháng |

#### Khi nào dùng cái nào?

| Tình huống | Nên dùng |
|------------|----------|
| **Startup nhỏ, ít người, tiết kiệm** | 🏆 Jump Server |
| **Chỉ cần SSH vào EC2** | Jump Server OK |
| **Cần truy cập RDS, ElastiCache, internal web** | 🏆 Client VPN |
| **Nhiều developer, cần quản lý tập trung** | 🏆 Client VPN |
| **Compliance/Security cao** | 🏆 Client VPN |
| **Không muốn expose bất kỳ gì ra internet** | 🏆 Client VPN |

#### Authentication Methods

| Method | Mô tả | Khi nào dùng |
|--------|-------|--------------|
| **Mutual Certificate** | Client + Server đều có certificate | Đơn giản, không cần AD |
| **Active Directory** | Xác thực qua AD/LDAP | Công ty đã có AD |
| **SAML (SSO)** | Xác thực qua Okta, Azure AD... | Dùng chung với SSO |

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí Endpoint | 💰 $0.10/giờ (~$72/tháng) |
| Chi phí Connection | 💰 $0.05/giờ/connection |
| Use case | Developer remote, admin access, security audit |

#### Sau khi bật VPN, bạn có thể làm gì?

```
┌─────────────────────────────────────────────────────────────────┐
│  SAU KHI BẬT CLIENT VPN, LAPTOP CÓ THỂ:                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ SSH vào EC2 private:  ssh ec2-user@10.0.1.50                │
│  ✅ Connect RDS trực tiếp: mysql -h 10.0.2.100 -u admin -p      │
│  ✅ Connect Redis:        redis-cli -h 10.0.3.50 -p 6379        │
│  ✅ Truy cập internal web: http://10.0.1.100:8080               │
│  ✅ Debug microservices:   curl http://api-internal:8080        │
│  ✅ Dùng tools GUI:        DBeaver, DataGrip, MySQL Workbench   │
│                                                                  │
│  → Laptop NHƯ ĐANG NGỒI TRONG VPC!                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Vai trò | Dùng Client VPN để... |
|---------|----------------------|
| **Backend Developer** | SSH vào EC2, connect RDS để debug, test API internal |
| **Data Engineer** | Connect Redshift, OpenSearch, query data trực tiếp |
| **DevOps/SRE** | SSH vào private instances, check health services |
| **DBA** | Connect RDS/Aurora để query, backup, tuning |

#### Alternatives (tiết kiệm chi phí)

| Giải pháp | Chi phí/tháng | Ưu điểm | Nhược điểm |
|-----------|---------------|---------|------------|
| **AWS Client VPN** | ~$100+ | Dễ dùng, full access VPC | 💰 Đắt |
| **SSM Session Manager** | **FREE** | Miễn phí, không expose | Chỉ SSH, cần IAM |
| **Bastion Host** | ~$8 (t3.micro) | Rẻ | Chỉ SSH, cần port forward |
| **Tailscale/Wireguard** | Free hoặc rẻ | Đơn giản, nhanh | Tự quản lý |

> 💡 **SSM Session Manager** - không cần Bastion, không cần VPN, truy cập EC2 qua AWS Console. Hoàn toàn miễn phí! Nhiều công ty dùng **Tailscale** thay vì AWS Client VPN để tiết kiệm.

---

### 9. Security Groups

**Tác dụng:** Virtual firewall cho **instance** (EC2, RDS, Lambda...).

Xem chi tiết: [Security Groups](security-groups.md)

| Đặc điểm | Giá trị |
|----------|---------|
| Cấp độ | Instance (ENI) |
| Stateful | ✅ Có (response tự động cho phép) |
| Rules | Chỉ ALLOW |
| Chi phí | ✅ Miễn phí |

---

### 10. Network ACLs (NACLs)

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
| Cấp độ | Instance (ENI) | Subnet |
| Stateful | ✅ Có (response tự động) | ❌ Không (phải tạo rule cả 2 chiều) |
| Rules | Chỉ Allow | Allow + Deny |
| Đánh giá | Tất cả rules | Theo thứ tự số (100, 200...) |
| Chi phí | ✅ Miễn phí | ✅ Miễn phí |

#### NACL Stateless - Giải thích chi tiết

```
SECURITY GROUP (Stateful):
━━━━━━━━━━━━━━━━━━━━━━━━━━
Chỉ cần 1 rule:
  Inbound: Allow port 80

User ──► Request (port 80) ──► EC2    ✅ Inbound rule
User ◄── Response ◄────────── EC2    ✅ TỰ ĐỘNG (nhớ connection)


NACL (Stateless):
━━━━━━━━━━━━━━━━━
Cần 2 rules:
  Inbound:  Allow port 80
  Outbound: Allow ephemeral ports (1024-65535)   ← BẮT BUỘC!

User ──► Request (port 80) ──► EC2    ✅ Inbound rule
User ◄── Response (port 5xxxx) ◄── EC2    ✅ Outbound rule

⚠️ Thiếu outbound rule → Response bị chặn dù inbound OK!
```

> 💡 **Tại sao cần ephemeral ports (1024-65535)?**  
> Response từ server trả về qua **port ngẫu nhiên** (ephemeral port) do client mở, KHÔNG phải port 80!  
> Ví dụ: Client gửi request từ port 54321 → Server response về port 54321.

**Ví dụ NACL rule ĐÚNG (cần cả Inbound + Outbound):**
```
INBOUND RULES:
┌────────┬──────────┬──────────┬───────┬───────────┬────────┐
│ Rule # │   Type   │ Protocol │ Port  │  Source   │ Action │
├────────┼──────────┼──────────┼───────┼───────────┼────────┤
│  100   │   HTTP   │   TCP    │  80   │ 0.0.0.0/0 │ ALLOW  │
│  110   │   HTTPS  │   TCP    │  443  │ 0.0.0.0/0 │ ALLOW  │
│  120   │   SSH    │   TCP    │  22   │10.0.0.0/8 │ ALLOW  │
│  *     │ All traffic│  All   │  All  │ 0.0.0.0/0 │ DENY   │ ← Default
└────────┴──────────┴──────────┴───────┴───────────┴────────┘

OUTBOUND RULES:
┌────────┬──────────┬──────────┬────────────┬───────────┬────────┐
│ Rule # │   Type   │ Protocol │    Port    │   Dest    │ Action │
├────────┼──────────┼──────────┼────────────┼───────────┼────────┤
│  100   │  Custom  │   TCP    │ 1024-65535 │ 0.0.0.0/0 │ ALLOW  │ ← Ephemeral!
│  110   │   HTTP   │   TCP    │     80     │ 0.0.0.0/0 │ ALLOW  │
│  120   │   HTTPS  │   TCP    │    443     │ 0.0.0.0/0 │ ALLOW  │
│  *     │ All traffic│  All   │    All     │ 0.0.0.0/0 │ DENY   │ ← Default
└────────┴──────────┴──────────┴────────────┴───────────┴────────┘
```

#### Rule Number - Thứ tự đánh giá

**Rule Number** = **Thứ tự ưu tiên**. Số **nhỏ hơn** = **ưu tiên cao hơn**. NACL kiểm tra theo thứ tự và **DỪNG ngay** khi match rule đầu tiên.

```
Traffic đến → Kiểm tra rule 100 → 110 → 120 → ... → DỪNG khi match!

┌────────┬──────────┬───────────┬────────┐
│ Rule # │   Port   │  Source   │ Action │
├────────┼──────────┼───────────┼────────┤
│  100   │    22    │ 10.0.0.0/8│ ALLOW  │ ← Kiểm tra đầu tiên
│  110   │    80    │ 0.0.0.0/0 │ ALLOW  │
│  200   │    22    │ 0.0.0.0/0 │ DENY   │ ← SSH từ ngoài bị chặn
│   *    │   All    │ 0.0.0.0/0 │ DENY   │ ← Default (cuối, không xóa được)
└────────┴──────────┴───────────┴────────┘

Ví dụ:
  SSH từ 10.0.1.50 → Match rule 100 → ✅ ALLOW (dừng, không đến rule 200)
  SSH từ 203.0.113.5 → Không match 100 → Match rule 200 → ❌ DENY
```

**Best Practices:**

| Tip | Giải thích |
|-----|------------|
| **Đánh số cách nhau** | 100, 110, 120... để còn chỗ chèn (105, 115) |
| **DENY đặt số nhỏ** | Để block IP độc hại TRƯỚC khi đến ALLOW |
| **Rule * không xóa được** | Default DENY all, luôn ở cuối |

#### Khi nào cần dùng NACL?

| Use Case | Mô tả |
|----------|-------|
| **Block IP độc hại** | Chặn toàn bộ dải IP đang tấn công ra khỏi subnet |
| **Defense in depth** | Thêm lớp bảo vệ ngoài Security Group |
| **Cần rule DENY** | Security Group chỉ có ALLOW, NACL mới có DENY |
| **Compliance/Audit** | Một số tiêu chuẩn yêu cầu nhiều lớp firewall |

**Ví dụ thực tế:**
```
Bị tấn công DDoS từ dải IP 203.0.113.0/24?

Security Group: ❌ Không thể block (chỉ có ALLOW)
Network ACL:    ✅ Thêm rule DENY 203.0.113.0/24 → chặn toàn subnet!
```

#### Có bắt buộc cấu hình NACL không?

**Không bắt buộc!** 

- Default NACL của AWS **cho phép tất cả traffic** (ALLOW all inbound/outbound)
- Hầu hết chỉ cần dùng **Security Group** là đủ
- NACL thường dùng trong môi trường **enterprise** hoặc khi cần **compliance chặt chẽ**

```
Dự án nhỏ/startup:
  → Chỉ cần Security Group ✅

Dự án enterprise/regulated (ngân hàng, healthcare):
  → Security Group + NACL ✅✅
```

> 💡 **Tip:** Nếu không chắc cần NACL hay không, hãy giữ nguyên default. Chỉ thêm NACL rules khi có yêu cầu cụ thể về security hoặc compliance.

---

### 11. VPC Endpoints

**Tác dụng:** Truy cập AWS services (S3, DynamoDB, ECR...) mà **không cần đi qua internet**.

#### Hiểu lầm phổ biến: S3 nằm trong VPC?

> ⚠️ **Không!** S3, DynamoDB, SQS, SNS... là các service **PUBLIC** của AWS, tồn tại **bên ngoài** VPC của bạn.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Region (ap-southeast-1)                   │
│                                                                      │
│   ┌──────────────────────────────────────────┐                      │
│   │              YOUR VPC                     │                      │
│   │           (10.0.0.0/16)                   │                      │
│   │                                           │                      │
│   │   ┌───────────────┐  ┌───────────────┐   │                      │
│   │   │ Public Subnet │  │ Private Subnet│   │                      │
│   │   │  ┌─────────┐  │  │  ┌─────────┐  │   │                      │
│   │   │  │   EC2   │  │  │  │   EC2   │  │   │                      │
│   │   │  │   RDS   │  │  │  │   RDS   │  │   │                      │
│   │   │  └─────────┘  │  │  └─────────┘  │   │                      │
│   │   └───────────────┘  └───────────────┘   │                      │
│   │                                           │                      │
│   │   ❌ S3, DynamoDB KHÔNG Ở ĐÂY!           │                      │
│   └──────────────────────────────────────────┘                      │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                  AWS MANAGED SERVICES                        │   │
│   │              (Bên ngoài VPC của bạn)                         │   │
│   │                                                              │   │
│   │   ┌─────┐  ┌─────────┐  ┌─────┐  ┌─────┐  ┌──────────────┐  │   │
│   │   │ S3  │  │DynamoDB │  │ SQS │  │ SNS │  │ SSM Parameter│  │   │
│   │   └─────┘  └─────────┘  └─────┘  └─────┘  └──────────────┘  │   │
│   │                                                              │   │
│   │   → Truy cập qua PUBLIC ENDPOINT (internet)                  │   │
│   │   → s3.ap-southeast-1.amazonaws.com                          │   │
│   └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Phân loại AWS Services

| Loại | Trong VPC | Bên ngoài VPC (Public) |
|------|-----------|------------------------|
| **Ví dụ** | EC2, RDS, ElastiCache, Lambda (VPC mode) | S3, DynamoDB, SQS, SNS, SSM, Secrets Manager |
| **Private IP** | ✅ Có | ❌ Không |
| **Truy cập** | Qua private network | Qua **internet endpoint** |

#### Vấn đề: EC2 Private muốn gọi S3

```
EC2 trong Private Subnet → Không có public IP → Không ra được internet

                               ┌─────────────────┐
                               │       S3        │
                               │ s3.amazonaws.com│ ← Public endpoint
                               └────────┬────────┘
                                        │
                                   Internet
                                        │
                                        ❌ Không có đường đi!
                                        │
    ┌───────────────────────────────────┼───────────────────────────────┐
    │                         VPC       │                                │
    │   ┌─────────────────┐             │                                │
    │   │ Private Subnet  │             │                                │
    │   │  ┌───────────┐  │             │                                │
    │   │  │    EC2    │──┼─────────────┘                                │
    │   │  │ (no public│  │   Muốn upload file lên S3                    │
    │   │  │    IP)    │  │   → KHÔNG THỂ! (không ra được internet)      │
    │   │  └───────────┘  │                                              │
    │   └─────────────────┘                                              │
    └────────────────────────────────────────────────────────────────────┘
```

#### 2 cách để EC2 Private gọi S3

**Cách 1: Dùng NAT Gateway (tốn phí)**
```
EC2 (Private) → NAT Gateway → Internet Gateway → Internet → S3
                    │                                  │
               💰 $0.045/giờ                    💰 $0.045/GB data
                    │
               ~$32/tháng + data transfer
```

**Cách 2: Dùng VPC Endpoint (miễn phí cho S3!)**
```
┌───────────────────────────────────────────────────────────────────┐
│                              VPC                                   │
│                                                                    │
│   ┌─────────────────┐         ┌─────────────────┐                 │
│   │ Private Subnet  │         │  VPC Endpoint   │                 │
│   │                 │         │   (Gateway)     │──────────► S3   │
│   │  ┌───────────┐  │         │                 │    AWS          │
│   │  │    EC2    │──┼────────►│  Đường đi riêng │    Private      │
│   │  │           │  │         │  trong AWS      │    Network      │
│   │  └───────────┘  │         └─────────────────┘                 │
│   └─────────────────┘                                              │
│                                                                    │
│   ❌ Không cần NAT Gateway                                         │
│   ❌ Không đi qua Internet                                         │
│   ✅ Miễn phí (với S3, DynamoDB)                                   │
│   ✅ Bảo mật hơn (traffic không ra public)                         │
└────────────────────────────────────────────────────────────────────┘
```

#### So sánh 2 cách

| Tiêu chí | Qua NAT Gateway | Qua VPC Endpoint |
|----------|-----------------|------------------|
| **Chi phí** | 💰 $32+/tháng + data | ✅ Miễn phí (Gateway Endpoint) |
| **Bảo mật** | Traffic đi qua internet | 🔒 Traffic ở trong AWS backbone |
| **Tốc độ** | Phụ thuộc internet | ⚡ Nhanh hơn |
| **Setup** | Cần NAT Gateway | Chỉ cần tạo endpoint + route |

#### 2 loại VPC Endpoint

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

> 💡 **Best Practice:** Luôn tạo Gateway Endpoint cho S3 và DynamoDB (miễn phí!) để tiết kiệm chi phí NAT Gateway và tăng bảo mật.

---

### 12. AWS PrivateLink

**Tác dụng:** Expose service của bạn cho VPC khác (hoặc khách hàng) mà **không cần qua internet**.

#### Vấn đề: Share service giữa các VPC

```
Bạn có 1 service (API) trong VPC-A, muốn cho VPC-B truy cập:

Cách 1: VPC Peering
  → Phải mở toàn bộ network giữa 2 VPC
  → Có thể truy cập được nhiều thứ khác (không muốn)
  → CIDR không được trùng

Cách 2: Qua Internet (Public endpoint)
  → 💰 Tốn phí
  → 🔓 Kém bảo mật
  → 🐢 Chậm

Cách 3: PrivateLink ✅
  → Chỉ expose đúng service cần thiết
  → Traffic đi qua AWS backbone (private)
  → Không cần lo CIDR trùng
```

#### PrivateLink hoạt động như thế nào?

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE PROVIDER (VPC-A)                        │
│                                                                      │
│   ┌─────────────────┐         ┌─────────────────────┐               │
│   │  Your Service   │────────►│ Network Load Balancer│               │
│   │  (EC2, ECS...)  │         │       (NLB)         │               │
│   └─────────────────┘         └──────────┬──────────┘               │
│                                          │                           │
│                               ┌──────────▼──────────┐               │
│                               │  VPC Endpoint Service│ ◄── Bạn tạo  │
│                               │    (PrivateLink)     │               │
│                               └──────────┬──────────┘               │
└──────────────────────────────────────────┼──────────────────────────┘
                                           │
                         AWS Private Network (không qua internet)
                                           │
┌──────────────────────────────────────────┼──────────────────────────┐
│                      SERVICE CONSUMER (VPC-B)                        │
│                                                                      │
│                               ┌──────────▼──────────┐               │
│                               │  Interface Endpoint │ ◄── Consumer   │
│                               │  (ENI với private IP)│     tạo       │
│                               └──────────┬──────────┘               │
│                                          │                           │
│   ┌─────────────────┐                    │                           │
│   │   EC2 Consumer  │◄───────────────────┘                           │
│   │  (gọi service)  │  Gọi qua private IP!                          │
│   └─────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘
```

#### Các thành phần của PrivateLink

| Thành phần | Vai trò | Ai tạo? |
|------------|---------|---------|
| **Network Load Balancer** | Phía trước service của bạn | Provider |
| **VPC Endpoint Service** | Expose NLB qua PrivateLink | Provider |
| **Interface Endpoint** | Kết nối đến Endpoint Service | Consumer |

#### Use Cases thực tế

| Tình huống | Giải thích |
|------------|------------|
| **SaaS Provider** | Bạn là nhà cung cấp SaaS, muốn cho khách hàng truy cập API của bạn một cách private |
| **Multi-account** | Team Platform expose shared services cho các team khác trong org |
| **3rd Party Integration** | Truy cập service của vendor qua private network (MongoDB Atlas, Snowflake, Datadog...) |
| **Microservices** | Service ở VPC này cần gọi service ở VPC khác mà không muốn mở toàn bộ VPC |

#### So sánh PrivateLink vs VPC Peering

| Tiêu chí | VPC Peering | PrivateLink |
|----------|-------------|-------------|
| **Phạm vi** | Toàn bộ VPC | Chỉ 1 service cụ thể |
| **CIDR trùng** | ❌ Không được trùng | ✅ OK (không quan tâm CIDR) |
| **Bảo mật** | Mở rộng hơn | 🔒 Chặt hơn (chỉ expose service cần) |
| **Transitive** | ❌ Không | ❌ Không |
| **Chi phí** | Free (chỉ data transfer) | 💰 $0.01/giờ + data |
| **Scalability** | Quản lý phức tạp khi nhiều VPC | Dễ scale cho nhiều consumer |

#### Ví dụ thực tế

```
Công ty bạn có:
  - VPC Platform: chứa Auth Service, Logging Service
  - VPC Team-A: App của team A
  - VPC Team-B: App của team B
  
Dùng VPC Peering:
  → Team A có thể truy cập MỌI THỨ trong VPC Platform
  → Team B có thể truy cập MỌI THỨ trong VPC Platform
  → Không an toàn!

Dùng PrivateLink:
  → Team A chỉ truy cập được Auth Service (qua endpoint)
  → Team B chỉ truy cập được Logging Service (qua endpoint)
  → Kiểm soát chặt chẽ hơn!
```

| Đặc điểm | Giá trị |
|----------|---------|
| Chi phí Endpoint | 💰 $0.01/giờ (~$7.2/tháng) |
| Chi phí Data | 💰 $0.01/GB |
| Khi nào dùng | Expose service cho VPC khác/khách hàng một cách private |

> 💡 **Tip:** Nhiều AWS services (như ECR, SSM, Secrets Manager) thực chất sử dụng PrivateLink dưới dạng Interface Endpoint. Khi bạn tạo Interface Endpoint đến các service này, bạn đang dùng PrivateLink!

#### Tóm tắt: Provider vs Consumer - Ai tạo gì?

```
┌────────────────────────────────────────────────────────────────┐
│                 VPC ENDPOINT vs PRIVATELINK                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROVIDER (Bạn có service)    CONSUMER (Khách muốn dùng)      │
│                                                                 │
│   Tạo: ENDPOINT SERVICE        Tạo: VPC ENDPOINT               │
│         (PrivateLink)                (Interface type)          │
│                                                                 │
│   ┌─────────────────┐          ┌─────────────────┐             │
│   │  Your Service   │          │  Customer EC2   │             │
│   │  (NLB + App)    │◄─────────│  (Client)       │             │
│   │                 │ Private  │                 │             │
│   │                 │ Network  │                 │             │
│   └─────────────────┘          └─────────────────┘             │
│                                                                 │
│   Bạn EXPOSE service           Khách KẾT NỐI đến bạn           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

| Vai trò | Tạo gì | Mục đích | Trong AWS Console |
|---------|--------|----------|-------------------|
| **Provider (nhà cung cấp)** | Endpoint Service | Expose service của bạn | VPC → Endpoint Services |
| **Consumer (khách hàng)** | VPC Endpoint | Kết nối đến service | VPC → Endpoints |

**Flow khi kết nối:**

```
1. PROVIDER:
   ├── Có service chạy đằng sau Network Load Balancer (NLB)
   ├── Tạo Endpoint Service (PrivateLink) trỏ đến NLB
   └── Gửi Service Name cho khách hàng
       (dạng: com.amazonaws.vpce.ap-southeast-1.vpce-svc-xxx)

2. CONSUMER:
   ├── Nhận Service Name từ Provider
   ├── Tạo VPC Endpoint (Interface type) với Service Name đó
   └── Traffic đi PRIVATE, không qua Internet!
```

> [!IMPORTANT]
> **AWS services (S3, SQS, SNS...)** cũng hoạt động như vậy:
> - AWS là **Provider** (đã tạo sẵn Endpoint Service)
> - Bạn là **Consumer** (tạo VPC Endpoint để kết nối)

---

### 13. VPC Flow Logs

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

### 14. DHCP Option Sets

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

### Nên làm

1. **Tách môi trường bằng VPC** - Dev, Staging, Prod riêng biệt
2. **Sử dụng nhiều AZ** - Tối thiểu 2 AZ cho production
3. **Private Subnet cho database** - Không bao giờ để DB ở public
4. **Đặt tên rõ ràng** - `prod-public-subnet-1a`, `dev-private-subnet-1b`
5. **Plan CIDR block** - Tránh overlap khi cần VPC Peering

### Không nên làm

1. **Dùng default VPC cho production** - Không đủ bảo mật
2. **CIDR quá nhỏ** - Khó mở rộng sau này
3. **Tất cả EC2 ở public subnet** - Tăng attack surface
4. **Quên NAT Gateway cho private subnet** - EC2 không update được

---

## CIDR Block là gì?

**CIDR (Classless Inter-Domain Routing)** là cách viết gọn để định nghĩa một dải địa chỉ IP.

> 📚 **Xem chi tiết:** [CIDR Documentation](cidr.md) - Giải thích đầy đủ về CIDR notation, cách tính số IP, Private IP ranges, và ví dụ chia subnet.

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
- [CIDR](cidr.md) - Classless Inter-Domain Routing
- [ENI](eni.md) - Elastic Network Interface
- [Security Groups](security-groups.md) - Virtual Firewall
- [IAM](iam.md) - Identity and Access Management
