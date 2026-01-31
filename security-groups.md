# AWS Security Groups


## Mục lục

- [Security Group là gì?](#security-group-là-gì)
- [Đặc điểm chính](#đặc-điểm-chính)
- [Thành phần của Security Group Rule](#thành-phần-của-security-group-rule)
- [Default Security Group](#default-security-group)
- [Security Group Referencing](#security-group-referencing)
- [Ví dụ thực tế: Web Application](#ví-dụ-thực-tế-web-application)
- [Quotas (Giới hạn)](#quotas-giới-hạn)
- [Security Group vs Network ACL](#security-group-vs-network-acl)
- [Traffic không bị filter](#traffic-không-bị-filter)
- [Quản lý Security Groups với AWS CLI](#quản-lý-security-groups-với-aws-cli)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Security Group là gì?

**Security Group** hoạt động như một **virtual firewall** kiểm soát lưu lượng truy cập (traffic) đến và đi từ các tài nguyên AWS trong [VPC](vpc.md) (như EC2 instances, RDS, Lambda trong VPC, v.v.).

```
┌─────────────────────────────────────────────────────────────────────┐
│                              VPC                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        Subnet                                │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │              Security Group                          │   │   │
│  │   │   ┌─────────────────────────────────────────────┐   │   │   │
│  │   │   │              EC2 Instance                    │   │   │   │
│  │   │   └─────────────────────────────────────────────┘   │   │   │
│  │   │                                                      │   │   │
│  │   │   Inbound Rules ──▶  [Cho phép traffic vào]         │   │   │
│  │   │   Outbound Rules ──▶ [Cho phép traffic ra]          │   │   │
│  │   └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Đặc điểm chính

### 1. Stateful (Có trạng thái)

Security Group **nhớ** các kết nối. Khi bạn cho phép traffic đi vào, traffic phản hồi **tự động được phép** đi ra mà không cần tạo rule riêng.

**Ví dụ thực tế:**
```
Bạn có EC2 chạy web server, tạo rule: "Cho phép port 443 từ internet"

┌─────────────┐                    ┌─────────────┐
│   Khách     │                    │     EC2     │
│   hàng      │ ──── Request ────▶ │  Web Server │
│             │    (port 443)      │             │
│             │ ◀─── Response ──── │             │
└─────────────┘   (TỰ ĐỘNG OK!)    └─────────────┘

→ Bạn CHỈ cần 1 inbound rule (port 443)
→ Response tự động được phép đi ra, KHÔNG cần outbound rule
```

**Ngược lại cũng đúng:**
```
EC2 gọi API bên ngoài (outbound), response tự động được phép vào

┌─────────────┐                    ┌─────────────┐
│     EC2     │                    │  External   │
│             │ ──── Request ────▶ │    API      │
│             │   (outbound OK)    │             │
│             │ ◀─── Response ──── │             │
└─────────────┘   (TỰ ĐỘNG OK!)    └─────────────┘
```

### 2. Chỉ có Allow Rules (Không có Deny)

- Bạn **chỉ có thể tạo rule CHO PHÉP** traffic
- **Không thể tạo rule CHẶN** traffic cụ thể
- Mặc định: **Deny tất cả** - traffic nào không match rule nào thì bị chặn

**Ví dụ:**
```
Security Group của bạn có rules:
  ✅ Cho phép SSH (22) từ IP công ty
  ✅ Cho phép HTTP (80) từ mọi nơi

Kết quả:
  → IP công ty: SSH ✅, HTTP ✅
  → IP khác:    SSH ❌ (không match), HTTP ✅
  → FTP (21):   ❌ Tất cả bị chặn (không có rule)
```

### 3. Áp dụng ở Instance Level (ENI)

Security Group gắn vào **Network Interface** của instance, không phải subnet.

```
┌────────────────────────────────────────────────┐
│                    Subnet                       │
│                                                 │
│   ┌─────────────┐      ┌─────────────┐         │
│   │   EC2-A     │      │   EC2-B     │         │
│   │ ┌─────────┐ │      │ ┌─────────┐ │         │
│   │ │  SG-Web │ │      │ │  SG-DB  │ │         │
│   │ └─────────┘ │      │ └─────────┘ │         │
│   └─────────────┘      └─────────────┘         │
│                                                 │
│   → Cùng subnet nhưng KHÁC Security Group      │
│   → Mỗi instance có firewall riêng             │
└────────────────────────────────────────────────┘
```

### 4. Đánh giá TẤT CẢ Rules cùng lúc

Khi có traffic đến, AWS kiểm tra **tất cả rules** và cho phép nếu **bất kỳ rule nào match**.

```
Security Group có 3 rules:
  Rule 1: Cho phép SSH từ 10.0.0.0/8
  Rule 2: Cho phép HTTP từ 0.0.0.0/0  
  Rule 3: Cho phép HTTPS từ 0.0.0.0/0

Traffic đến port 80 từ internet:
  → Kiểm tra Rule 1: Không match (port khác)
  → Kiểm tra Rule 2: MATCH! ✅
  → Kiểm tra Rule 3: Không cần (đã match)
  → Kết quả: CHO PHÉP
```

> 💡 **So sánh với Network ACL**: Network ACL đánh giá theo **thứ tự số** (rule 100 trước rule 200), dừng lại khi match đầu tiên.

### 5. Miễn phí

- Không tính phí tạo và sử dụng Security Groups
- Có thể tạo nhiều Security Groups tùy nhu cầu

## Thành phần của Security Group Rule

### Inbound Rules (Traffic vào)

| Thành phần | Mô tả | Ví dụ |
|------------|-------|-------|
| **Type** | Loại traffic | SSH, HTTP, HTTPS, Custom TCP |
| **Protocol** | Giao thức | TCP (6), UDP (17), ICMP (1) |
| **Port Range** | Cổng hoặc dải cổng | 22, 80, 443, 1024-65535 |
| **Source** | Nguồn được phép | IP, CIDR, Security Group ID, Prefix List |
| **Description** | Mô tả (tùy chọn) | "Allow SSH from office" |

### Outbound Rules (Traffic ra)

| Thành phần | Mô tả | Ví dụ |
|------------|-------|-------|
| **Type** | Loại traffic | All traffic, HTTPS |
| **Protocol** | Giao thức | TCP, UDP, All |
| **Port Range** | Cổng hoặc dải cổng | 443, 0-65535 |
| **Destination** | Đích được phép | IP, CIDR, Security Group ID, Prefix List |
| **Description** | Mô tả (tùy chọn) | "Allow all outbound" |

### Các loại Source/Destination

```
┌────────────────────────────────────────────────────────────────────┐
│                     Source / Destination Types                      │
├────────────────────────────────────────────────────────────────────┤
│  • Single IP:     203.0.113.1/32                                   │
│  • CIDR Block:    10.0.0.0/16, 203.0.113.0/24                     │
│  • IPv6:          2001:db8:1234:1a00::/64                          │
│  • Security Group: sg-0abcdef1234567890                            │
│  • Prefix List:   pl-1234abc1234abc123                             │
│  • Anywhere IPv4: 0.0.0.0/0                                        │
│  • Anywhere IPv6: ::/0                                             │
└────────────────────────────────────────────────────────────────────┘
```

## Default Security Group

Khi tạo VPC, AWS tự động tạo **default security group** với các rules:

| Rule Type | Protocol | Port | Source/Destination |
|-----------|----------|------|---------------------|
| **Inbound** | All | All | Chính security group đó (sg-xxx) |
| **Outbound** | All | All | 0.0.0.0/0 (Anywhere) |

> ⚠️ **Best Practice**: Không sử dụng default security group. Luôn tạo custom security groups với rules cụ thể.

## Security Group Referencing

Cho phép reference một Security Group khác làm source/destination thay vì IP:

```
┌───────────────────────────────────────────────────────────────────┐
│                            VPC                                     │
│                                                                    │
│   ┌──────────────────┐         ┌──────────────────┐               │
│   │  sg-web-servers  │         │  sg-db-servers   │               │
│   │                  │         │                  │               │
│   │  ┌────────────┐  │         │  ┌────────────┐  │               │
│   │  │ Web Server │  │────────▶│  │  Database  │  │               │
│   │  └────────────┘  │         │  └────────────┘  │               │
│   │                  │  MySQL  │                  │               │
│   └──────────────────┘  3306   │  Inbound Rule:   │               │
│                                │  Source:         │               │
│                                │  sg-web-servers  │               │
│                                └──────────────────┘               │
└───────────────────────────────────────────────────────────────────┘
```

**Ưu điểm:**
- Không cần update IP khi thêm/xóa instances
- Dễ quản lý và bảo trì
- Tự động áp dụng cho tất cả instances trong security group được reference

## Ví dụ thực tế: Web Application

### Architecture 3-tier với Security Groups

```
                     Internet
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                     sg-load-balancer                            │
│  Inbound: 80, 443 from 0.0.0.0/0                               │
│  Outbound: All to sg-web-servers                               │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   sg-web-servers                          │  │
│  │  Inbound: 80, 443 from sg-load-balancer                  │  │
│  │  Outbound: 3306 to sg-database                           │  │
│  │                         │                                 │  │
│  │                         ▼                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                   sg-database                       │  │  │
│  │  │  Inbound: 3306 from sg-web-servers                 │  │  │
│  │  │  Outbound: None (hoặc specific)                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Security Group cho Load Balancer

| Rule | Type | Protocol | Port | Source/Dest |
|------|------|----------|------|-------------|
| Inbound | HTTP | TCP | 80 | 0.0.0.0/0 |
| Inbound | HTTPS | TCP | 443 | 0.0.0.0/0 |
| Outbound | Custom TCP | TCP | 80 | sg-web-servers |

### Security Group cho Web Servers

| Rule | Type | Protocol | Port | Source/Dest |
|------|------|----------|------|-------------|
| Inbound | HTTP | TCP | 80 | sg-load-balancer |
| Inbound | HTTPS | TCP | 443 | sg-load-balancer |
| Inbound | SSH | TCP | 22 | 10.0.0.0/8 (bastion) |
| Outbound | MySQL | TCP | 3306 | sg-database |
| Outbound | HTTPS | TCP | 443 | 0.0.0.0/0 |

### Security Group cho Database

| Rule | Type | Protocol | Port | Source/Dest |
|------|------|----------|------|-------------|
| Inbound | MySQL | TCP | 3306 | sg-web-servers |

## Quotas (Giới hạn)

| Resource | Default Limit | Có thể tăng? |
|----------|---------------|--------------|
| Security Groups per VPC | 2,500 | Có |
| Inbound rules per Security Group | 60 | Có (tối đa 1000 khi tính cả outbound) |
| Outbound rules per Security Group | 60 | Có (tối đa 1000 khi tính cả inbound) |
| Security Groups per Network Interface | 5 | Có (tối đa 16) |

> 📌 **Lưu ý**: Tổng số rules = (Inbound + Outbound rules) × Security Groups per interface ≤ 1,000

## Security Group vs Network ACL

| Đặc điểm | Security Group | Network ACL |
|----------|----------------|-------------|
| **Cấp độ** | Instance (ENI) | Subnet |
| **Stateful/Stateless** | Stateful | Stateless |
| **Rules** | Chỉ Allow | Allow và Deny |
| **Thứ tự rules** | Tất cả rules được đánh giá | Theo thứ tự number (thấp → cao) |
| **Default** | Deny tất cả inbound, Allow tất cả outbound | Allow tất cả |
| **Áp dụng** | Phải gán vào instance | Tự động áp dụng cho subnet |

```
              Internet
                 │
                 ▼
         ┌──────────────┐
         │ Network ACL  │ ◀── Layer 1: Subnet level
         │  (Stateless) │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │Security Group│ ◀── Layer 2: Instance level
         │  (Stateful)  │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  EC2 Instance│
         └──────────────┘
```

## Traffic không bị filter

Security Groups **KHÔNG** filter traffic đến/từ:
- Amazon DNS
- Amazon DHCP
- EC2 Instance Metadata (169.254.169.254)
- ECS Task Metadata endpoints
- Windows License Activation
- Amazon Time Sync Service
- Reserved IP của VPC router

## Quản lý Security Groups với AWS CLI

### Tạo Security Group

```bash
aws ec2 create-security-group \
    --group-name my-sg \
    --description "My security group" \
    --vpc-id vpc-1234567890abcdef0
```

### Thêm Inbound Rule

```bash
# Cho phép SSH từ IP cụ thể
aws ec2 authorize-security-group-ingress \
    --group-id sg-1234567890abcdef0 \
    --protocol tcp \
    --port 22 \
    --cidr 203.0.113.0/24

# Cho phép từ Security Group khác
aws ec2 authorize-security-group-ingress \
    --group-id sg-1234567890abcdef0 \
    --protocol tcp \
    --port 80 \
    --source-group sg-0987654321fedcba0
```

### Xem Security Group Rules

```bash
aws ec2 describe-security-groups \
    --group-ids sg-1234567890abcdef0
```

### Xóa Rule

```bash
aws ec2 revoke-security-group-ingress \
    --group-id sg-1234567890abcdef0 \
    --protocol tcp \
    --port 22 \
    --cidr 203.0.113.0/24
```

### Xóa Security Group

```bash
aws ec2 delete-security-group \
    --group-id sg-1234567890abcdef0
```

## Best Practices

### Nên làm

1. **Principle of Least Privilege**: Chỉ mở ports cần thiết
2. **Sử dụng Security Group referencing** thay vì hard-code IP
3. **Đặt tên và mô tả rõ ràng** cho mỗi security group và rule
4. **Tách riêng Security Groups** theo chức năng (web, app, db)
5. **Regular audit** các security group rules
6. **Sử dụng VPC Flow Logs** để monitor traffic

### Không nên làm

1. **Không mở 0.0.0.0/0** cho SSH (port 22) hoặc RDP (port 3389)
2. **Không mở large port ranges** (VD: 1-65535)
3. **Không sử dụng default security group** cho production
4. **Không để security group không sử dụng** - dọn dẹp định kỳ
5. **Không ignore outbound rules** - cần restrict nếu có thể

## Troubleshooting

### Không kết nối được đến instance

1. Kiểm tra **Inbound rules** của Security Group
2. Kiểm tra **Network ACL** của subnet
3. Kiểm tra **Route tables**
4. Kiểm tra instance có **public IP** không (nếu kết nối từ internet)
5. Kiểm tra **Internet Gateway** đã attached chưa

### Instance không thể kết nối internet

1. Kiểm tra **Outbound rules** của Security Group
2. Kiểm tra có **NAT Gateway** hoặc **Internet Gateway** không
3. Kiểm tra **Route tables** có route đến 0.0.0.0/0 không

## Exam Tips

### Key Points for AWS Exams

1. **Security Group chỉ có ALLOW rules**
   - Không có DENY rules
   - Mặc định deny tất cả (implicit deny)
   - Nếu cần DENY specific IPs → dùng **NACL**

2. **Stateful vs Stateless**
   - Security Group = **Stateful** → response tự động cho phép
   - NACL = **Stateless** → phải tạo rule cả 2 chiều

3. **Default behavior**
   - Inbound: Deny all (phải thêm rule để allow)
   - Outbound: Allow all (default)

4. **Instance level, không phải subnet**
   - Security Group gắn vào ENI (Network Interface)
   - NACL áp dụng cho cả subnet

### Common Exam Scenarios

| Scenario | Answer |
|----------|--------|
| Block specific IP addresses | **NACL** (Security Group không có deny) |
| Allow return traffic automatically | **Security Group** (stateful) |
| Defense in depth at subnet level | **NACL** |
| Firewall per instance | **Security Group** |
| Need both Allow AND Deny rules | **NACL** |

---

## Tài liệu tham khảo

- [AWS Security Groups Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)
- [Security Group Rules](https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html)
- [Amazon VPC Quotas](https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html)
- [Compare Security Groups and Network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Security.html)

---

*Liên kết:*
- [VPC](vpc.md) - Virtual Private Cloud, Subnets, Public vs Private
- [IAM](iam.md) - Identity and Access Management
