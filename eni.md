# Elastic Network Interface (ENI)

## Mục lục

- [ENI là gì?](#eni-là-gì)
- [Thuộc tính của ENI](#thuộc-tính-của-eni)
- [Private IP và Public IP](#private-ip-và-public-ip)
- [Nhiều ENI trên 1 EC2](#nhiều-eni-trên-1-ec2)
- [Cách tạo và attach ENI](#cách-tạo-và-attach-eni)
- [Use Cases](#use-cases)
- [Giới hạn](#giới-hạn)

---

## ENI là gì?

**ENI (Elastic Network Interface)** = "Card mạng ảo" gắn vào EC2 instance.

### Card mạng ảo (Virtual Network Card) là gì?

| | Card mạng vật lý (Laptop) | Card mạng ảo (ENI) |
|--|---------------------------|-------------------|
| **Là gì** | Phần cứng thật (chip WiFi, cổng Ethernet) | Phần mềm mô phỏng card mạng |
| **Ở đâu** | Laptop/Server vật lý | EC2/VM trên cloud |
| **MAC** | In sẵn trên chip | AWS generate |
| **IP** | Router cấp | AWS/VPC cấp |
| **Di chuyển** | Tháo ra cắm máy khác | Detach rồi attach EC2 khác |

### Tại sao cần ENI?

**Không có ENI = Không kết nối được gì cả!**

```
KHÔNG CÓ ENI:                      CÓ ENI:
├── ❌ Không có IP                 ├── ✅ Có IP: 10.0.1.50
├── ❌ Không SSH được              ├── ✅ SSH được
├── ❌ Không gọi API được          ├── ✅ Gọi API được
├── ❌ Không connect DB            ├── ✅ Connect RDS được
└── ❌ Máy bị cô lập               └── ✅ Ra Internet được
```

> 💡 **Tóm lại:** ENI cho phép EC2 có IP và kết nối mạng. Giống như laptop cần card WiFi để lên mạng, EC2 cần ENI để kết nối trong VPC!

```
┌─────────────────────────────────────────────────────────────────┐
│                        EC2 Instance                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   ENI (Network Interface)               │   │
│   │                                                         │   │
│   │   ├── Private IP: 10.0.1.50                             │   │
│   │   ├── Public IP: 54.123.45.67 (optional)                │   │
│   │   ├── Elastic IP: 52.1.2.3 (optional)                   │   │
│   │   ├── MAC Address: 02:xx:xx:xx:xx:xx                    │   │
│   │   ├── Security Groups: [sg-web, sg-ssh]                 │   │
│   │   └── Subnet: subnet-12345                              │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

> 💡 **Quan trọng:** Mọi thứ về network (IP, Security Group, MAC) đều gắn vào **ENI**, không phải EC2 trực tiếp!

---

## Thuộc tính của ENI

| Thuộc tính | Mô tả |
|------------|-------|
| **Private IP(s)** | 1 primary + nhiều secondary IPs (bắt buộc có) |
| **Public IP** | Auto-assigned hoặc Elastic IP (optional) |
| **Elastic IP** | Static public IP gắn vào ENI |
| **MAC Address** | Địa chỉ MAC duy nhất |
| **Security Groups** | 1 hoặc nhiều SG gắn vào ENI |
| **Subnet** | ENI thuộc về 1 subnet cụ thể |
| **Source/Dest Check** | Enable/Disable (disable cho NAT instance) |

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENI = "Network Identity"                     │
│                                                                 │
│   Mọi thứ về network đều gắn vào ENI:                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                        ENI                              │   │
│   │                                                         │   │
│   │   ├── Private IP(s)     ← Gắn vào ENI                   │   │
│   │   ├── Public IP         ← Gắn vào ENI                   │   │
│   │   ├── Elastic IP        ← Gắn vào ENI                   │   │
│   │   ├── MAC Address       ← Thuộc về ENI                  │   │
│   │   ├── Security Groups   ← Gắn vào ENI                   │   │
│   │   └── Subnet            ← ENI thuộc về subnet           │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│                          ▼                                      │
│                    EC2 Instance                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Private IP và Public IP

### Private IP: Luôn có (bắt buộc)

```
┌─────────────────────────────────────────────────────────────────┐
│                         ENI                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Private IP:  ✅ BẮT BUỘC (luôn có)                            │
│                Ví dụ: 10.0.1.50                                 │
│                                                                 │
│   1 ENI có thể có NHIỀU Private IPs:                            │
│   ├── Primary:   10.0.1.50 (không thể xóa)                      │
│   ├── Secondary: 10.0.1.51                                      │
│   └── Secondary: 10.0.1.52                                      │
│                                                                 │
│   Use case: Host nhiều websites trên 1 EC2                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Public IP: Tùy chọn (optional)

| Loại | Mô tả | Khi nào có |
|------|-------|------------|
| **Auto-assigned Public IP** | AWS tự gán, thay đổi khi restart | Subnet có auto-assign = ON |
| **Elastic IP** | Static, không thay đổi | Bạn tự gán vào ENI |

```
ENI ở Public Subnet (auto-assign ON):
├── Private IP: 10.0.1.50 ✅
└── Public IP:  54.1.2.3  ✅ (auto)

ENI ở Private Subnet:
├── Private IP: 10.0.2.50 ✅
└── Public IP:  ❌ Không có

ENI ở Private Subnet + Elastic IP:
├── Private IP: 10.0.2.50 ✅
└── Elastic IP: 54.4.5.6  ✅ (static)
```

> ⚠️ **Lưu ý:** 1 ENI chỉ có thể có **1 Public IP hoặc 1 Elastic IP**, nhưng có thể có **nhiều Private IPs**.

---

## Nhiều ENI trên 1 EC2

1 EC2 có thể gắn **nhiều ENIs**, số lượng tùy thuộc **instance type**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 VỚI NHIỀU ENIs                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    EC2 Instance                         │   │
│   │                                                         │   │
│   │   eth0 (Primary ENI)          eth1 (Secondary ENI)      │   │
│   │   ├── 10.0.1.50               ├── 10.0.2.50             │   │
│   │   ├── Public Subnet           ├── Private Subnet        │   │
│   │   └── SG: web-sg              └── SG: db-sg             │   │
│   │                                                         │   │
│   │   ⚠️ eth0 không thể detach                               │   │
│   │   ✅ eth1, eth2... có thể detach/attach                 │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Giới hạn theo Instance Type

| Instance Type | Max ENIs | Max Private IPs/ENI |
|---------------|----------|---------------------|
| t2.micro | 2 | 2 |
| t3.medium | 3 | 6 |
| m5.large | 3 | 10 |
| m5.xlarge | 4 | 15 |
| m5.4xlarge | 8 | 30 |
| c5.18xlarge | 15 | 50 |

---

## Cách tạo và attach ENI

### Qua AWS Console

```
EC2 Dashboard → Network Interfaces → Create network interface

1. Tạo ENI mới:
   ├── Chọn Subnet (⚠️ cùng AZ với EC2!)
   ├── Chọn Security Groups
   └── (Optional) Assign Private IP

2. Attach vào EC2:
   ├── Chọn ENI vừa tạo
   ├── Actions → Attach
   └── Chọn EC2 Instance
```

### Qua AWS CLI

```bash
# 1. Tạo ENI
aws ec2 create-network-interface \
  --subnet-id subnet-12345 \
  --groups sg-12345 \
  --description "Secondary ENI"

# Output: eni-abc123

# 2. Attach vào EC2
aws ec2 attach-network-interface \
  --network-interface-id eni-abc123 \
  --instance-id i-12345 \
  --device-index 1

# 3. Kiểm tra trong EC2
ssh ec2-user@<ip>
ip addr show
# eth0: 10.0.1.50 (Primary)
# eth1: 10.0.2.50 (Secondary - mới attach)
```

### Lưu ý quan trọng

| Lưu ý | Chi tiết |
|-------|----------|
| **Cùng AZ** | ENI và EC2 phải ở **cùng Availability Zone** |
| **Device Index** | eth0 = 0 (primary), eth1 = 1, eth2 = 2... |
| **Hot-attach** | Có thể attach ENI khi EC2 đang chạy |
| **Primary ENI** | eth0 **không thể detach**, chỉ secondary mới được |
| **OS config** | Có thể cần config thêm routing trong OS |

---

## Use Cases

### 1. Dual-homed Instance

```
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 Instance                                 │
│                                                                 │
│   eth0 (Public)               eth1 (Private)                    │
│   ├── 10.0.0.10               ├── 10.0.1.10                     │
│   ├── EIP: 54.1.2.3           └── Connect to RDS                │
│   └── Web traffic                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

→ Web traffic qua eth0, Database traffic qua eth1
→ Security Groups riêng cho từng ENI
```

### 2. Management Network

```
eth0: Production traffic (app, api)
eth1: Management traffic (SSH, monitoring)
      → Chỉ cho phép IP của admin team
```

### 3. Failover - Move ENI

```
TRƯỚC:
EC2-A ──► ENI (IP: 10.0.1.50, EIP: 54.1.2.3)

EC2-A chết!

SAU (move ENI sang EC2-B):
EC2-B ──► ENI (IP: 10.0.1.50, EIP: 54.1.2.3)

→ Client không cần đổi IP kết nối!
→ Phù hợp cho HA setup
```

### 4. Network/Security Appliance

```
NAT Instance với 2 ENIs:

eth0 (Public)        eth1 (Private)
├── EIP              ├── Route từ private subnets
└── Internet         └── nhận traffic từ private EC2

Traffic: Private EC2 → eth1 → NAT → eth0 → Internet
```

---

## Giới hạn

| Giới hạn | Giá trị |
|----------|---------|
| **Max ENIs per instance** | Tùy instance type (2-15) |
| **Max IPs per ENI** | Tùy instance type (2-50) |
| **ENI và EC2 cùng AZ** | Bắt buộc |
| **Primary ENI (eth0)** | Không thể detach |
| **Security Groups per ENI** | Max 5 |

---

## ENI dùng cho service nào?

### Quy tắc đơn giản

> 💡 **Trong VPC + cần IP = cần ENI**

ENI là cầu nối giữa AWS resource và network (VPC). Không có ENI = Không có IP trong VPC = Không kết nối được!

### Phân loại Services

```
┌─────────────────────────────────────────────────────────────────┐
│  1️⃣  VPC-BASED SERVICES (Cần ENI trong VPC của BẠN)             │
│                                                                 │
│      EC2, RDS, Lambda (VPC), ECS, EKS, ElastiCache,             │
│      NAT Gateway, ALB/NLB, VPC Endpoints (Interface)...         │
│                                                                 │
│      → Nằm TRONG VPC của bạn                                    │
│      → IP thuộc subnet của bạn (vd: 10.0.1.50)                  │
│      → BẠN quản lý network                                      │
│      → Cần ENI để có IP trong VPC                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  2️⃣  PUBLIC/REGIONAL SERVICES (AWS quản lý IP)                  │
│                                                                 │
│      S3, DynamoDB, SQS, SNS, Lambda (không VPC)...              │
│                                                                 │
│      → Nằm NGOÀI VPC của bạn                                    │
│      → Connect qua URL: s3.amazonaws.com                        │
│      → AWS quản lý IP (bạn không thấy, không control)           │
│      → KHÔNG cần ENI trong VPC của bạn                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Chi tiết theo Service

| Service | Loại | ENI | Ghi chú |
|---------|------|-----|---------|
| **EC2** | VPC-based | ✅ Bạn quản lý | Có thể tạo/attach/detach ENI |
| **RDS** | VPC-based | ✅ AWS tạo ngầm | ENI trong DB Subnet Group |
| **Lambda (VPC)** | VPC-based | ✅ AWS tạo ngầm | ENI để access VPC resources |
| **ECS (awsvpc)** | VPC-based | ✅ AWS tạo ngầm | Mỗi task có ENI riêng |
| **ALB/NLB** | VPC-based | ✅ AWS tạo ngầm | ENI trong mỗi subnet |
| **NAT Gateway** | VPC-based | ✅ AWS tạo ngầm | 1 ENI với Elastic IP |
| **VPC Endpoint (Interface)** | VPC-based | ✅ AWS tạo ngầm | ENI trong subnet bạn chọn |
| **S3** | Public | ❌ | Connect qua URL/VPC Endpoint |
| **DynamoDB** | Public | ❌ | Connect qua URL/VPC Endpoint |
| **SQS/SNS** | Public | ❌ | Connect qua URL |
| **Lambda (không VPC)** | Public | ❌ | Chạy trong AWS network |

### Ví dụ kết nối

```
Bạn connect S3:
   App → Internet/VPC Endpoint → S3 (IP của AWS, không phải VPC bạn)

Bạn connect RDS:
   App → ENI → RDS (IP 10.0.x.x trong VPC của bạn)
```

---

## Liên kết

- [EC2](ec2.md) - Elastic Compute Cloud
- [VPC](vpc.md) - Virtual Private Cloud
- [Security Groups](security-groups.md) - Firewall rules

> **Nguồn:** [AWS ENI Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html)
