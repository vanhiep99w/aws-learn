---
title: "VPC Cheatsheet — Toàn bộ thành phần & Setup thực tế"
description: "Tổng hợp tất cả thành phần VPC, cách chúng tương tác, setup phổ biến và best practices — dễ nhớ, dễ tra cứu"
---

# VPC Cheatsheet — Toàn bộ thành phần & Setup thực tế

## Mục lục

- [Bản đồ VPC — Tất cả thành phần một cái nhìn](#bản-đồ-vpc--tất-cả-thành-phần-một-cái-nhìn)
- [Cheat Table — 14 thành phần VPC](#cheat-table--14-thành-phần-vpc)
- [Traffic Flow — Packet đi qua những gì?](#traffic-flow--packet-đi-qua-những-gì)
- [Cách nhớ: Ai làm gì?](#cách-nhớ-ai-làm-gì)
- [Kết nối ra ngoài VPC — 6 cách](#kết-nối-ra-ngoài-vpc--6-cách)
- [Kết nối giữa các VPC — So sánh 3 cách](#kết-nối-giữa-các-vpc--so-sánh-3-cách)
- [Setup #1 — Startup / MVP](#setup-1--startup--mvp)
- [Setup #2 — Production chuẩn (Multi-AZ)](#setup-2--production-chuẩn-multi-az)
- [Setup #3 — Enterprise Multi-Account](#setup-3--enterprise-multi-account)
- [Best Practices — Checklist](#best-practices--checklist)
- [Anti-Patterns — Những sai lầm phổ biến](#anti-patterns--những-sai-lầm-phổ-biến)
- [Chi phí VPC — Cái gì tốn tiền?](#chi-phí-vpc--cái-gì-tốn-tiền)
- [Quick Reference — Exam Keywords](#quick-reference--exam-keywords)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Bản đồ VPC — Tất cả thành phần một cái nhìn

```
                         🌐 Internet
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         VPC (10.0.0.0/16) — Regional Resource                   │
│                                                                                 │
│  ┌──────────────────────┐                                                       │
│  │   Internet Gateway   │ ← 1 per VPC, FREE, cổng 2 chiều                       │
│  └──────────┬───────────┘                                                       │
│             │                                                                   │
│  ┌──────────▼──────────────────────────────────────────────────────────────────┐ │
│  │                   PUBLIC SUBNET (10.0.1.0/24) — AZ-a                       │ │
│  │                                                                            │ │
│  │  Route Table: 0.0.0.0/0 → IGW                                              │ │
│  │  NACL: Stateless firewall (subnet level)                                   │ │
│  │                                                                            │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │ │
│  │  │      ALB      │  │ NAT Gateway   │  │ Bastion Host  │                    │ │
│  │  │  (có ENI+SG)  │  │ (có Elastic   │  │ (SSH jump)    │                    │ │
│  │  │  Load balance │  │  IP, cho      │  │               │                    │ │
│  │  │  traffic      │  │  Private ra   │  │               │                    │ │
│  │  │  vào app      │  │  Internet)    │  │               │                    │ │
│  │  └───────┬───────┘  └───────┬───────┘  └───────────────┘                    │ │
│  └──────────┼──────────────────┼───────────────────────────────────────────────┘ │
│             │                  │                                                 │
│  ┌──────────▼──────────────────▼───────────────────────────────────────────────┐ │
│  │                  PRIVATE SUBNET (10.0.2.0/24) — AZ-a                       │ │
│  │                                                                            │ │
│  │  Route Table: 0.0.0.0/0 → NAT, S3 prefix → GW Endpoint                    │ │
│  │  NACL: Stateless firewall (subnet level)                                   │ │
│  │                                                                            │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │ │
│  │  │   EC2 App     │  │    RDS DB     │  │  Interface    │                    │ │
│  │  │  (có ENI+SG)  │  │  (có ENI+SG)  │  │  Endpoint     │                    │ │
│  │  │  sg: allow    │  │  sg: allow    │  │  (ENI → SQS,  │                    │ │
│  │  │  80 from ALB  │  │  3306 from    │  │   SSM, ECR)   │                    │ │
│  │  │               │  │  sg-app       │  │               │                    │ │
│  │  └───────────────┘  └───────────────┘  └───────────────┘                    │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐             │
│  │ Gateway Endpoint │   │  VPC Peering     │   │ Virtual Private  │             │
│  │ (S3, DynamoDB)   │   │  (nối 2 VPC)     │   │ Gateway / TGW    │             │
│  │ FREE, chỉ route  │   │  FREE            │   │ (VPN/DX to       │             │
│  └──────────────────┘   └──────────────────┘   │  On-Premises)    │             │
│                                                └──────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Cheat Table — 14 thành phần VPC

### 🏗️ Nền tảng (Foundation)

| # | Thành phần | Vai trò | Scope | Chi phí |
|---|-----------|---------|-------|---------|
| 1 | **VPC** | Mạng ảo riêng | 1 Region, nhiều AZ | FREE |
| 2 | **Subnet** | Chia nhỏ VPC | 1 AZ duy nhất | FREE |
| 3 | **Route Table** | Quyết định traffic đi đâu | 1 VPC, gán vào subnet | FREE |
| 4 | **ENI** | "Card mạng ảo" — mọi IP, SG gắn vào đây | 1 AZ | FREE |

### 🚪 Cổng kết nối (Gateways)

| # | Thành phần | Vai trò | Scope | Chi phí |
|---|-----------|---------|-------|---------|
| 5 | **Internet Gateway** | Cổng 2 chiều ra Internet | 1 per VPC | FREE |
| 6 | **NAT Gateway** | Cho Private Subnet ra Internet (1 chiều) | 1 AZ | ~$32/tháng |
| 7 | **VPC Endpoint (Gateway)** | Đường riêng đến S3, DynamoDB | 1 VPC | FREE |
| 8 | **VPC Endpoint (Interface)** | ENI đến 100+ AWS services | 1 Subnet | ~$7.2/tháng |

### 🔒 Bảo mật (Security)

| # | Thành phần | Vai trò | Level | Stateful? | Allow/Deny |
|---|-----------|---------|-------|-----------|------------|
| 9 | **Security Group** | Firewall cho instance | ENI (instance) | ✅ Stateful | Chỉ Allow |
| 10 | **Network ACL** | Firewall cho subnet | Subnet | ❌ Stateless | Allow + Deny |

### 🔗 Kết nối (Connectivity)

| # | Thành phần | Vai trò | Chi phí |
|---|-----------|---------|---------|
| 11 | **Elastic IP** | IP public tĩnh, không đổi | $3.6/tháng |
| 12 | **VPC Peering** | Nối 2 VPC (không transitive) | FREE (chỉ data) |
| 13 | **Transit Gateway** | Hub nối nhiều VPC + on-prem | $36/tháng per VPC |
| 14 | **VPN / Direct Connect** | Nối on-premises ↔ AWS | $36+/tháng |

### 📊 Giám sát (Monitoring)

| # | Thành phần | Vai trò | Chi phí |
|---|-----------|---------|---------|
| 15 | **VPC Flow Logs** | Ghi log tất cả traffic | Phí lưu trữ |

---

## Traffic Flow — Packet đi qua những gì?

### Flow 1: Internet → EC2 App (qua ALB)

> User truy cập website → request đi qua những gì trước khi đến EC2?

```
┌────────┐    ┌─────┐    ┌────────┐    ┌──────┐    ┌────────┐    ┌─────┐    ┌────────┐    ┌──────┐    ┌─────┐
│  User  │───▶│ IGW │───▶│NACL    │───▶│SG    │───▶│  ALB   │───▶│NACL │───▶│SG      │───▶│ ENI  │───▶│ EC2 │
│        │    │     │    │(Public)│    │(ALB) │    │        │    │(Pri)│    │(App)   │    │      │    │ App │
└────────┘    └─────┘    └────────┘    └──────┘    └────────┘    └─────┘    └────────┘    └──────┘    └─────┘
  Internet     Cổng,       Firewall     Firewall    Route đến     Firewall   Firewall     Card       Nhận
               không       subnet       instance    target        subnet     instance     mạng ảo    request!
               filter      (allow/      (chỉ        group         private    (allow 80
                           deny)        allow                     subnet     from
                                        80,443)                              sg-alb)
```

| Bước | Thành phần | Làm gì | Chặn được không? |
|------|-----------|--------|-----------------|
| ① | **Internet Gateway** | Mở cửa cho traffic vào VPC | ❌ Không filter |
| ② | **NACL (Public)** | Kiểm tra IP/port theo rules | ✅ Allow hoặc Deny |
| ③ | **Security Group (ALB)** | Chỉ cho phép port 80, 443 | ✅ Chỉ Allow |
| ④ | **ALB** | Forward request đến EC2 phù hợp | — |
| ⑤ | **NACL (Private)** | Kiểm tra traffic vào private subnet | ✅ Allow hoặc Deny |
| ⑥ | **Security Group (EC2)** | Chỉ cho phép từ sg-alb | ✅ Chỉ Allow |
| ⑦ | **ENI → EC2** | EC2 nhận và xử lý request | — |

### Flow 2: EC2 Private → Internet (apt update, gọi API)

> EC2 trong private subnet muốn chạy `apt update` — đi đường nào?

```
┌─────┐    ┌────────┐    ┌──────┐    ┌─────────┐    ┌─────┐    ┌──────────┐
│ EC2 │───▶│Route   │───▶│NACL  │───▶│   NAT   │───▶│ IGW │───▶│ Internet │
│ App │    │Table   │    │(Pri) │    │ Gateway │    │     │    │          │
└─────┘    └────────┘    └──────┘    └─────────┘    └─────┘    └──────────┘
 Private    "0.0.0.0/0    Check       Đổi IP:       Cổng       apt.ubuntu
 Subnet     → NAT"        outbound    10.0.2.5      ra         .com
                                      → 52.1.2.3    ngoài
                                      (Elastic IP)
```

| Bước | Thành phần | Làm gì |
|------|-----------|--------|
| ① | **Route Table** | Tra bảng: `0.0.0.0/0 → nat-xxx` → gửi đến NAT |
| ② | **NACL (Private)** | Kiểm tra outbound rules |
| ③ | **NAT Gateway** | Thay private IP bằng Elastic IP (public) |
| ④ | **IGW** | Đẩy ra Internet |

> ⚠️ **Chiều ngược lại KHÔNG được!** Internet không thể gửi request VÀO qua NAT → EC2 private an toàn.

### Flow 3: EC2 Private → S3 (qua Gateway Endpoint)

> EC2 upload file lên S3 — **không đi qua Internet**, không cần NAT

```
┌─────┐    ┌────────┐    ┌───────────┐    ┌──────────────┐    ┌─────┐
│ EC2 │───▶│Route   │───▶│  Gateway  │───▶│ AWS Private  │───▶│  S3 │
│ App │    │Table   │    │ Endpoint  │    │   Network    │    │     │
└─────┘    └────────┘    └───────────┘    └──────────────┘    └─────┘
 Private    "S3 prefix    Không tạo       Nhanh, bảo mật,
 Subnet     → vpce-s3"   ENI, chỉ        không qua
                          thêm route      Internet
```

| So sánh | Qua NAT Gateway | Qua Gateway Endpoint |
|---------|-----------------|---------------------|
| **Đường đi** | EC2 → NAT → IGW → Internet → S3 | EC2 → Endpoint → S3 |
| **Chi phí** | $32/tháng + $0.045/GB | **FREE** |
| **Tốc độ** | Chậm hơn (qua Internet) | Nhanh hơn (AWS backbone) |
| **Bảo mật** | Traffic đi qua Internet | Traffic ở trong AWS |

### Flow 4: EC2 Private → SQS (qua Interface Endpoint)

> EC2 gửi message đến SQS — cũng không cần Internet

```
┌─────┐    ┌──────────────────┐    ┌──────────────┐    ┌─────┐
│ EC2 │───▶│ Interface        │───▶│ AWS Private  │───▶│ SQS │
│ App │    │ Endpoint (ENI)   │    │   Network    │    │     │
│     │    │ IP: 10.0.2.100   │    │              │    │     │
└─────┘    └──────────────────┘    └──────────────┘    └─────┘
 Private    Tạo ENI trong subnet
 Subnet     Cần Security Group
            (allow 443 from VPC)
```

**Khác Gateway Endpoint:**

| | Gateway Endpoint | Interface Endpoint |
|---|---|---|
| **Dùng cho** | S3, DynamoDB (2 cái) | 100+ services (SQS, SSM, ECR...) |
| **Cách hoạt động** | Thêm route | Tạo ENI trong subnet |
| **Cần SG?** | ❌ | ✅ (vì có ENI) |
| **Chi phí** | FREE | $7.2/tháng |

---

## Cách nhớ: Ai làm gì?

> **Mẹo ghi nhớ:** Nghĩ VPC như một **tòa nhà văn phòng**

| VPC Component | Ví dụ tòa nhà | Vai trò |
|---------------|---------------|---------|
| **VPC** | Tòa nhà | Không gian riêng biệt |
| **Subnet** | Tầng lầu | Phân khu (tầng public, tầng private) |
| **Internet Gateway** | Cổng chính | Ai cũng đi qua, không kiểm tra |
| **Route Table** | Bảng chỉ đường | "Tầng 3 rẽ phải, tầng 5 đi thang máy" |
| **NACL** | Bảo vệ tầng | Kiểm tra ID ở cửa thang máy mỗi tầng |
| **Security Group** | Khóa cửa phòng | Chỉ người có chìa khóa mới vào được |
| **NAT Gateway** | Quầy gửi bưu phẩm | Người trong tầng private gửi đồ ra ngoài |
| **Bastion** | Phòng khách | Khách đến đây trước, rồi mới vào phòng trong |
| **VPC Endpoint** | Đường hầm nội bộ | Đi thẳng đến kho (S3) không cần ra cổng |
| **VPC Peering** | Cầu nối 2 tòa | Đi sang tòa bên cạnh qua cầu |
| **Transit Gateway** | Bến xe trung tâm | Từ đây đi đến BẤT KỲ tòa nào |
| **ENI** | Ổ cắm mạng | Mỗi phòng cần ổ cắm để có mạng |
| **Elastic IP** | Số phòng cố định | Dù đổi phòng, số vẫn giữ nguyên |
| **Flow Logs** | Camera giám sát | Ghi lại ai ra vào, lúc nào |

---

## Kết nối ra ngoài VPC — 6 cách

```
                               ┌──────────────────────────────┐
                               │        YOUR VPC              │
                               │                              │
① IGW ◄─────── Internet ──────►│ Public Subnet (2 chiều)      │
                               │                              │
② NAT ◄─────── Internet ──────►│ Private Subnet (chỉ ra)      │
                               │                              │
③ GW Endpoint ◄── AWS Net ───►│ Private → S3/DynamoDB         │
                               │                              │
④ IF Endpoint ◄── AWS Net ───►│ Private → SQS/SSM/ECR...     │
                               │                              │
⑤ VPN ◄──── IPsec/Internet ──►│ On-premises (encrypted)      │
                               │                              │
⑥ DX ◄──── Cáp riêng ────────►│ On-premises (dedicated)      │
                               │                              │
                               └──────────────────────────────┘
```

| # | Cách | Từ | Đến | Qua | Chi phí |
|---|------|-----|------|------|---------|
| ① | IGW | Public Subnet | Internet | Internet Gateway | FREE |
| ② | NAT | Private Subnet | Internet (chỉ ra) | NAT → IGW | $32+/tháng |
| ③ | GW Endpoint | Private Subnet | S3, DynamoDB | AWS Private Net | FREE |
| ④ | IF Endpoint | Private Subnet | 100+ services | ENI → AWS Net | $7.2/tháng |
| ⑤ | Site-to-Site VPN | On-premises | VPC | Internet (IPsec) | $36/tháng |
| ⑥ | Direct Connect | On-premises | VPC | Cáp quang riêng | $239+/tháng |

---

## Kết nối giữa các VPC — So sánh 3 cách

| Tiêu chí | VPC Peering | Transit Gateway | PrivateLink |
|----------|-------------|-----------------|-------------|
| **Kết nối** | 2 VPC toàn bộ | N VPC + on-prem | 1 service cụ thể |
| **Transitive** | ❌ A↔B, B↔C ≠ A↔C | ✅ Có | ❌ Không |
| **CIDR trùng** | ❌ Không được | ❌ Không được | ✅ OK |
| **Scale** | Phức tạp (N*(N-1)/2) | Dễ (N connections) | Dễ |
| **Chi phí** | FREE (chỉ data) | $36/tháng per VPC | $7.2/tháng |
| **Khi nào** | 2-3 VPC | 4+ VPC, on-prem | Expose 1 service |

---

## Setup #1 — Startup / MVP

> Đơn giản, rẻ, đủ dùng cho MVP hoặc side project

```
VPC: 10.0.0.0/16
│
├── Public Subnet:  10.0.1.0/24 (AZ-a)
│   └── EC2 (web + app) + Public IP
│
├── Private Subnet: 10.0.2.0/24 (AZ-a)
│   └── RDS (database)
│
├── Internet Gateway ✅
├── Route Table Public: 0.0.0.0/0 → IGW
├── Route Table Private: chỉ local
├── Security Group Web: allow 80, 443 from 0.0.0.0/0
├── Security Group DB:  allow 3306 from sg-web
└── Gateway Endpoint S3 ✅ (miễn phí, tại sao không?)
```

**Chi phí VPC:** ~$0 (chỉ trả EC2 + RDS)

**Hạn chế:**
- ❌ Không HA (1 AZ)
- ❌ EC2 private không ra được Internet (không có NAT)
- ❌ Không có Load Balancer

---

## Setup #2 — Production chuẩn (Multi-AZ)

> **Setup phổ biến nhất** — đây là cách AWS recommend cho production workloads
>
> Ref: [AWS VPC with servers in private subnets and NAT](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Scenario2.html)

```
VPC: 10.0.0.0/16

├── AZ-a
│   ├── Public Subnet:  10.0.1.0/24
│   │   ├── NAT Gateway (Elastic IP)
│   │   └── ALB node
│   ├── Private Subnet: 10.0.10.0/24
│   │   └── EC2 App (Auto Scaling Group)
│   └── DB Subnet:      10.0.20.0/24
│       └── RDS Primary
│
├── AZ-b
│   ├── Public Subnet:  10.0.2.0/24
│   │   ├── NAT Gateway (Elastic IP)
│   │   └── ALB node
│   ├── Private Subnet: 10.0.11.0/24
│   │   └── EC2 App (Auto Scaling Group)
│   └── DB Subnet:      10.0.21.0/24
│       └── RDS Standby
│
├── Internet Gateway
├── Route Table Public:  0.0.0.0/0 → IGW
├── Route Table Private-a: 0.0.0.0/0 → NAT-a
├── Route Table Private-b: 0.0.0.0/0 → NAT-b
│
├── Security Groups
│   ├── sg-alb:  Inbound 80,443 from 0.0.0.0/0
│   ├── sg-app:  Inbound 80 from sg-alb
│   ├── sg-db:   Inbound 3306 from sg-app
│   └── sg-vpce: Inbound 443 from 10.0.0.0/16
│
├── Gateway Endpoint → S3 (FREE)
├── Interface Endpoint → SSM (cho SSH không cần Bastion)
│
└── VPC Flow Logs → S3 bucket
```

### Route Tables chi tiết

**Public Subnet Route Table:**

| Destination | Target | Ghi chú |
|-------------|--------|---------|
| 10.0.0.0/16 | local | Traffic nội bộ VPC |
| 0.0.0.0/0 | igw-xxx | Ra Internet |

**Private Subnet Route Table (AZ-a):**

| Destination | Target | Ghi chú |
|-------------|--------|---------|
| 10.0.0.0/16 | local | Traffic nội bộ VPC |
| 0.0.0.0/0 | nat-a-xxx | Ra Internet qua NAT |
| S3 prefix-list | vpce-s3 | Đến S3 qua Endpoint |

### Security Group Referencing Chain

```
Internet → sg-alb (allow 80,443 from 0.0.0.0/0)
               │
               ▼
           sg-app (allow 80 from sg-alb)     ← SG referencing!
               │
               ▼
           sg-db (allow 3306 from sg-app)    ← SG referencing!
```

> **Tại sao SG referencing?** Khi EC2 scale thêm/bớt, không cần update IP trong SG rules. Chỉ cần EC2 thuộc đúng SG là tự động được phép.

### Chi phí VPC ước tính

| Thành phần | Chi phí/tháng |
|------------|---------------|
| NAT Gateway × 2 | ~$65 |
| Public IPv4 × 2 (NAT EIP) | ~$7 |
| Interface Endpoint (SSM) | ~$7 |
| Flow Logs storage | ~$5 |
| **Tổng** | **~$84/tháng** |

---

## Setup #3 — Enterprise Multi-Account

> Dùng AWS Organizations, mỗi team/env có account riêng

```
AWS Organizations
│
├── Account: Network (central)
│   ├── Transit Gateway (hub)
│   ├── VPC Shared Services
│   │   ├── Active Directory
│   │   ├── Logging / Monitoring
│   │   └── VPN / Direct Connect endpoint
│   └── Share subnets cho các account khác (VPC Sharing)
│
├── Account: Production
│   ├── VPC-App-A (10.0.0.0/16) ──── attach TGW
│   └── VPC-App-B (10.1.0.0/16) ──── attach TGW
│
├── Account: Staging
│   └── VPC-Staging (10.2.0.0/16) ── attach TGW
│
└── Account: Development
    └── VPC-Dev (10.3.0.0/16) ────── attach TGW

Tất cả VPC kết nối qua Transit Gateway:
  VPC-App-A ↔ TGW ↔ VPC-App-B ↔ TGW ↔ On-premises
  (transitive routing = tất cả có thể gọi nhau)
```

**Tại sao không dùng VPC Peering?**
- 4 VPC = cần 6 peering connections
- 10 VPC = cần 45 peering connections 😱
- Transit Gateway: N VPC = N connections ✅

---

## Best Practices — Checklist

### 🏗️ Thiết kế VPC

- [ ] VPC CIDR chọn **/16** (65K IPs) — dư dả, không tốn tiền
- [ ] **Không trùng CIDR** giữa các VPC nếu cần Peering/TGW sau này
- [ ] Plan CIDR trước: `10.0.0.0/16` (Prod), `10.1.0.0/16` (Staging), `10.2.0.0/16` (Dev)
- [ ] **Tối thiểu 2 AZ** cho production
- [ ] Bật **DNS Resolution + DNS Hostnames** cho VPC

### 🏠 Subnet

- [ ] **Public subnet**: chỉ đặt ALB, NAT Gateway, Bastion
- [ ] **Private subnet**: đặt EC2 app, Lambda, ECS
- [ ] **DB subnet**: riêng cho RDS, ElastiCache (isolated hơn)
- [ ] Mỗi AZ tạo đủ 3 tầng: public + private + db

### 🔒 Security

- [ ] **Security Group referencing** thay vì hard-code IP
- [ ] **Principle of least privilege** — chỉ mở port cần thiết
- [ ] **KHÔNG** mở SSH (22) từ 0.0.0.0/0 — dùng SSM Session Manager hoặc Bastion
- [ ] Tách SG theo role: sg-alb, sg-app, sg-db, sg-cache
- [ ] NACL: giữ default (allow all), chỉ thêm rule khi cần block IP cụ thể

### 🚪 Connectivity

- [ ] **Gateway Endpoint cho S3** — luôn tạo (FREE!)
- [ ] NAT Gateway **mỗi AZ** cho HA (không share 1 NAT cho nhiều AZ)
- [ ] Interface Endpoint cho SSM → SSH không cần Bastion, không cần NAT
- [ ] Direct Connect + VPN backup cho on-premises kết nối

### 📊 Monitoring

- [ ] **VPC Flow Logs** bật cho production
- [ ] Lưu Flow Logs vào S3 (rẻ hơn CloudWatch)
- [ ] GuardDuty để phát hiện traffic bất thường

### 💰 Tiết kiệm chi phí

- [ ] Dev/Test: dùng **NAT Instance** (t3.micro ~$8) thay NAT Gateway ($32)
- [ ] Dùng **IPv6** khi có thể (miễn phí public IP)
- [ ] Xóa **Elastic IP** không dùng (vẫn bị tính phí!)
- [ ] S3 traffic đi qua **Gateway Endpoint** (FREE) thay vì NAT ($0.045/GB)

---

## Anti-Patterns — Những sai lầm phổ biến

| ❌ Sai | ✅ Đúng | Tại sao |
|--------|---------|---------|
| Database ở Public Subnet | Database ở Private Subnet | Hacker không thể truy cập trực tiếp |
| Dùng Default VPC cho prod | Tạo Custom VPC | Default VPC không đủ bảo mật |
| 1 Security Group cho tất cả | Tách SG theo role | Least privilege, dễ quản lý |
| SSH (22) mở 0.0.0.0/0 | SSM Session Manager | Không expose port SSH ra Internet |
| S3 traffic qua NAT Gateway | Gateway Endpoint (FREE) | Tiết kiệm ~$32/tháng + $0.045/GB |
| 1 NAT Gateway cho nhiều AZ | 1 NAT per AZ | HA — nếu AZ chết, AZ kia vẫn ra Internet |
| Hard-code IP trong SG | SG referencing (sg-xxx) | Tự động update khi scale |
| VPC Peering cho 10+ VPC | Transit Gateway | 45 peering vs 10 attachments |
| VPC CIDR /24 (256 IPs) | VPC CIDR /16 (65K IPs) | Dư dả mở rộng, CIDR không tốn tiền |
| Quên bật DNS Hostnames | Bật cả DNS Resolution + Hostnames | Interface Endpoint cần để hoạt động |

---

## Chi phí VPC — Cái gì tốn tiền?

### FREE (Không tốn tiền)

| Thành phần | Ghi chú |
|------------|---------|
| VPC | Tạo bao nhiêu cũng miễn phí |
| Subnet | Không giới hạn |
| Route Table | Không giới hạn |
| Internet Gateway | 1 per VPC |
| Security Group | Không giới hạn |
| Network ACL | Không giới hạn |
| VPC Peering | Chỉ trả data transfer |
| Gateway Endpoint (S3, DDB) | Hoàn toàn miễn phí |

### CÓ PHÍ (Tốn tiền hàng tháng)

| Thành phần | Chi phí/tháng | Tips tiết kiệm |
|------------|---------------|----------------|
| **NAT Gateway** | ~$32 + $0.045/GB | Dev: dùng NAT Instance ($8) |
| **Public IPv4** | ~$3.6 per IP | Dùng IPv6 khi có thể |
| **Elastic IP** (không dùng) | ~$3.6 | Xóa ngay khi không cần |
| **Interface Endpoint** | ~$7.2 per endpoint | Chỉ tạo khi thực sự cần |
| **Transit Gateway** | ~$36 per attachment | Dùng Peering nếu <4 VPC |
| **VPN Connection** | ~$36 | Dùng VPN thay DX nếu budget thấp |
| **Direct Connect** | ~$239+ | Chỉ khi cần bandwidth >1.25Gbps |
| **Flow Logs** | Phí storage | Lưu S3 rẻ hơn CloudWatch |

---

## Quick Reference — Exam Keywords

| Keyword trong đề | Nghĩ đến |
|-------------------|----------|
| "Block specific IP" | **NACL** (SG chỉ có Allow) |
| "Return traffic automatically" | **Security Group** (stateful) |
| "Private subnet access S3" | **Gateway Endpoint** (FREE) |
| "Private subnet access internet" | **NAT Gateway** |
| "Connect on-premises, need encryption" | **Site-to-Site VPN** (hoặc DX + VPN) |
| "Consistent bandwidth, low latency" | **Direct Connect** |
| "Connect 10+ VPCs" | **Transit Gateway** |
| "Expose service to another VPC" | **PrivateLink** (Endpoint Service) |
| "Multi-account shared VPC" | **VPC Sharing** (RAM) |
| "Defense in depth" | **SG + NACL** (2 layers) |
| "Firewall at subnet level" | **NACL** |
| "Static IP for NLB" | **Elastic IP** |
| "Monitor VPC traffic" | **VPC Flow Logs** |
| "No public IP but needs to call AWS API" | **Interface Endpoint** hoặc NAT |
| "Highest availability VPN" | **2 Direct Connect ở 2 locations** |

---

## Tài liệu tham khảo

- [How Amazon VPC works](https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html)
- [VPC with servers in private subnets and NAT](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Scenario2.html)
- [Security best practices for your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)
- [VPC Pricing](https://aws.amazon.com/vpc/pricing/)
- [Amazon VPC Quotas](https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html)

---

*Liên kết:*
- [VPC](./vpc/) — Chi tiết từng thành phần VPC
- [Security Groups](../security/security-groups/) — Virtual Firewall
- [ENI](./eni/) — Elastic Network Interface
- [VPC Endpoints](./vpc-endpoints/) — Kết nối AWS Services
- [Direct Connect](./direct-connect/) — Kết nối vật lý chuyên dụng
- [ELB](../compute/elb/) — Load Balancer
