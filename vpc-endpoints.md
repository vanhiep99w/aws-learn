# VPC Endpoints

VPC Endpoint cho phép EC2 trong Private Subnet kết nối đến AWS Services (S3, SQS, DynamoDB...) **mà không cần đi qua Internet**.

## Mục lục

- [Tại sao cần VPC Endpoint?](#tại-sao-cần-vpc-endpoint)
- [2 loại VPC Endpoint](#2-loại-vpc-endpoint)
- [Interface Endpoint hoạt động như thế nào?](#interface-endpoint-hoạt-động-như-thế-nào)
- [Hướng dẫn setup Interface Endpoint](#hướng-dẫn-setup-interface-endpoint)
- [Troubleshooting](#troubleshooting)

---

## Tại sao cần VPC Endpoint?

### Vấn đề: AWS Services nằm BÊN NGOÀI VPC

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Region                                    │
│                                                                      │
│   ┌──────────────────────────────────────┐                          │
│   │           YOUR VPC                    │                          │
│   │                                       │                          │
│   │   ┌───────────────────────────────┐  │                          │
│   │   │     Private Subnet            │  │                          │
│   │   │    ┌──────────────┐           │  │                          │
│   │   │    │     EC2      │           │  │                          │
│   │   │    │ (no public IP)│           │  │                          │
│   │   │    └──────────────┘           │  │                          │
│   │   └───────────────────────────────┘  │                          │
│   │                                       │                          │
│   │   ❌ SQS, S3, SNS KHÔNG Ở TRONG VPC! │                          │
│   └──────────────────────────────────────┘                          │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                  AWS PUBLIC SERVICES                          │  │
│   │            (Truy cập qua INTERNET endpoint)                   │  │
│   │                                                                │  │
│   │   ┌─────┐  ┌─────────┐  ┌─────┐  ┌─────┐  ┌─────┐            │  │
│   │   │ SQS │  │   SNS   │  │ S3  │  │ SSM │  │ ECR │            │  │
│   │   └─────┘  └─────────┘  └─────┘  └─────┘  └─────┘            │  │
│   │                                                                │  │
│   │   Endpoint: sqs.ap-southeast-2.amazonaws.com (PUBLIC!)        │  │
│   └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### EC2 trong Private Subnet không có đường ra Internet

```
EC2 (Private) → sqs.amazonaws.com → ???
                        │
                        │  Private Subnet không có:
                        │  • Public IP
                        │  • NAT Gateway
                        │
                        ▼
                ❌ KHÔNG ĐẾN ĐƯỢC SQS!
```

### 2 cách giải quyết

| Cách | Chi phí | Bảo mật | Tốc độ |
|------|---------|---------|--------|
| **NAT Gateway** | 💰 $32+/tháng | 🔓 Qua internet | Chậm hơn |
| **VPC Endpoint** | 💰 $7.2/tháng | 🔒 Private network | Nhanh hơn |

---

## 2 loại VPC Endpoint

| Loại | Dùng cho | Chi phí | Cách hoạt động |
|------|----------|---------|----------------|
| **Gateway Endpoint** | S3, DynamoDB | ✅ Miễn phí | Thêm route trong Route Table |
| **Interface Endpoint** | 100+ services khác | 💰 $0.01/giờ | Tạo ENI trong subnet |

### Gateway Endpoint (S3, DynamoDB)

```
EC2 → Route Table → Gateway Endpoint → S3
                         │
                    Chỉ thêm route
                    Không tạo ENI
                    MIỄN PHÍ!
```

### Interface Endpoint (SQS, SSM, ECR...)

```
EC2 → ENI (Private IP) → AWS Private Network → SQS
           │
      Tạo ENI trong subnet
      Có Private IP
      Cần Security Group
```

### Tại sao S3 dùng Gateway, còn SQS dùng Interface?

**Vấn đề chính:** VPC là "nhà kín", EC2 không có đường ra ngoài để gọi AWS services.

#### S3 (Gateway Endpoint) = Có "đường hầm" sẵn

```
┌─────────────────────────────────────────────────────────────┐
│                        YOUR VPC                              │
│                                                              │
│   ┌──────────┐        Route Table                ┌───────┐  │
│   │   EC2    │            │                      │       │  │
│   │          │────────────┼─────────────────────►│  S3   │  │
│   │          │            │                      │       │  │
│   └──────────┘     "S3 → đi thẳng"               └───────┘  │
│                                                              │
│   KHÔNG CẦN CỬA (ENI)!                                      │
│   AWS đã xây sẵn đường hầm xuyên tường cho S3               │
│   → Chỉ cần bảng chỉ đường (Route)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### SQS (Interface Endpoint) = Cần "cửa" để ra

```
┌─────────────────────────────────────────────────────────────┐
│                        YOUR VPC                              │
│                                                              │
│   ┌──────────┐     ┌────────────┐                 ┌───────┐ │
│   │   EC2    │     │    ENI     │                 │       │ │
│   │          │────►│   (cửa)    │────────────────►│  SQS  │ │
│   │          │     │            │ AWS Private     │       │ │
│   └──────────┘     └────────────┘ Network         └───────┘ │
│                          │                                   │
│                    CẦN CỬA (ENI) để đi ra!                  │
│                    (có địa chỉ: 10.100.11.149)               │
│                                                              │
│   SQS không có đường hầm sẵn                                │
│   → Phải mở cửa (ENI) trong VPC                             │
│   → Cửa cần bảo vệ (Security Group)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Tóm tắt

| Service | Có "đường hầm" sẵn? | Cần "cửa" (ENI)? | Security Group? |
|---------|---------------------|------------------|-----------------|
| **S3, DynamoDB** | ✅ AWS xây sẵn | ❌ Không cần | ❌ Không |
| **SQS, SSM, ECR...** | ❌ Không có | ✅ Cần (ENI) | ✅ Cần |

> 💡 **Tại sao S3 có đường hầm sẵn?** S3 là service được dùng **cực nhiều** (hàng exabytes/ngày), AWS đầu tư xây đường riêng cho nó. Các service khác ít traffic hơn nên dùng giải pháp chung là ENI.

## Interface Endpoint hoạt động như thế nào?

### Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                              YOUR VPC                                │
│                          (10.100.0.0/16)                             │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                    Private Subnet                           │    │
│   │                   (10.100.11.0/24)                          │    │
│   │                                                             │    │
│   │   ┌──────────────┐         ┌──────────────────────────┐    │    │
│   │   │     EC2      │   443   │   Interface Endpoint     │    │    │
│   │   │ 10.100.11.163│────────►│   (ENI: 10.100.11.149)   │    │    │
│   │   │              │         │                          │    │    │
│   │   │  SG: allow   │         │   SG: allow 443 từ VPC  │    │    │
│   │   │  outbound 443│         │                          │    │    │
│   │   └──────────────┘         └────────────┬─────────────┘    │    │
│   │                                         │                   │    │
│   └─────────────────────────────────────────┼───────────────────┘    │
│                                             │                        │
│   VPC DNS (10.100.0.2):                     │                        │
│   sqs.ap-southeast-2.amazonaws.com          │                        │
│         → 10.100.11.149 (Endpoint IP)       │                        │
│                                             │                        │
└─────────────────────────────────────────────┼────────────────────────┘
                                              │
                                   AWS Private Network
                                   (không qua Internet!)
                                              │
                                              ▼
                               ┌──────────────────────────┐
                               │          SQS             │
                               │  (AWS Managed Service)   │
                               └──────────────────────────┘
```

### Flow chi tiết

```
1. EC2 muốn gọi: sqs.ap-southeast-2.amazonaws.com
        │
        ▼
2. Hỏi DNS Server (10.100.0.2):
   "sqs.ap-southeast-2.amazonaws.com là IP gì?"
        │
        ▼
3. VPC DNS kiểm tra:
   "VPC này có Interface Endpoint cho SQS!"
   → Trả về Private IP: 10.100.11.149 (thay vì Public IP)
        │
        ▼
4. EC2 gửi request đến 10.100.11.149:443
        │
        ▼
5. Security Group của Endpoint kiểm tra:
   "Request từ 10.100.11.163 (trong VPC CIDR) → ALLOW!"
        │
        ▼
6. Endpoint chuyển request qua AWS Private Network đến SQS
        │
        ▼
7. SQS xử lý và trả response về qua đường ngược lại
```

### Tại sao cần Private DNS?

| Private DNS | nslookup sqs.amazonaws.com | Kết quả |
|-------------|----------------------------|---------|
| ❌ OFF | Trả về Public IP (52.x.x.x) | ❌ Traffic đi qua Internet |
| ✅ ON | Trả về Private IP (10.x.x.x) | ✅ Traffic đi qua Endpoint |

---

## Hướng dẫn setup Interface Endpoint

### Ví dụ: EC2 Private Subnet → SQS

#### Bước 1: Kiểm tra VPC DNS Settings

```
VPC → Your VPCs → Chọn VPC → Actions → Edit VPC settings

✅ Enable DNS resolution: ON
✅ Enable DNS hostnames: ON
```

> ⚠️ **Quan trọng:** Thiếu 1 trong 2 setting này sẽ khiến Endpoint không hoạt động!

#### Bước 2: Tạo Security Group cho Endpoint

```
VPC → Security Groups → Create security group

Name: sg-sqs-endpoint
VPC: Chọn VPC của bạn

Inbound Rules:
┌──────────┬──────┬─────────────────┬───────────────────────┐
│ Protocol │ Port │     Source      │        Mô tả          │
├──────────┼──────┼─────────────────┼───────────────────────┤
│   TCP    │ 443  │ 10.100.0.0/16   │ Allow HTTPS từ VPC    │
└──────────┴──────┴─────────────────┴───────────────────────┘
```

#### Bước 3: Tạo Interface Endpoint

```
VPC → Endpoints → Create endpoint

1. Name: sqs-endpoint
2. Service category: AWS services
3. Services: Tìm "sqs" → chọn com.amazonaws.{region}.sqs
4. VPC: Chọn VPC của bạn
5. Subnets: ✅ Tick subnet chứa EC2
6. Security groups: Chọn sg-sqs-endpoint
7. Policy: Full access
8. ✅ Enable DNS name: BẮT BUỘC TICK!

→ Create endpoint
→ Đợi Status = Available (1-2 phút)
```

#### Bước 4: Kiểm tra EC2 Security Group

```
EC2 → Instances → Chọn EC2 → Security → Security Groups

Outbound Rules phải có:
┌──────────┬──────┬─────────────────┐
│ Protocol │ Port │   Destination   │
├──────────┼──────┼─────────────────┤
│   TCP    │ 443  │ 0.0.0.0/0       │
└──────────┴──────┴─────────────────┘

(Mặc định thường đã có All traffic outbound)
```

#### Bước 5: Gắn IAM Role cho EC2

```
EC2 → Instances → Chọn EC2 → Actions → Security → Modify IAM role
```

Tạo Role với policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sqs:SendMessage",
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:GetQueueUrl",
                "sqs:GetQueueAttributes",
                "sqs:ListQueues"
            ],
            "Resource": "*"
        }
    ]
}
```

#### Bước 6: Test kết nối

SSH vào EC2:

```bash
# 1. Kiểm tra DNS (phải trả về PRIVATE IP)
nslookup sqs.ap-southeast-2.amazonaws.com

# Kết quả đúng:
# Address: 10.100.x.x  ← Private IP = OK!

# Kết quả sai:
# Address: 52.x.x.x    ← Public IP = Endpoint chưa hoạt động!

# 2. Test kết nối port 443
curl -v --connect-timeout 10 https://sqs.ap-southeast-2.amazonaws.com

# 3. Test gọi SQS
aws sqs list-queues --region ap-southeast-2
```

---

## Troubleshooting

### Lỗi 1: nslookup trả về Public IP

**Triệu chứng:**
```
nslookup sqs.ap-southeast-2.amazonaws.com
Address: 52.x.x.x  ← Public IP!
```

**Nguyên nhân & Fix:**

| Nguyên nhân | Fix |
|-------------|-----|
| VPC DNS Hostnames = OFF | VPC → Edit VPC settings → Enable DNS hostnames |
| Endpoint Private DNS = OFF | Endpoints → Modify private DNS name → Enable |
| Endpoint chưa Available | Đợi 1-2 phút |

### Lỗi 2: Connection timeout

**Triệu chứng:**
```
curl https://sqs.amazonaws.com
→ Trying 10.100.11.149:443... (đợi mãi)
```

**Nguyên nhân & Fix:**

| Nguyên nhân | Fix |
|-------------|-----|
| Endpoint SG chặn port 443 | Thêm Inbound rule: TCP 443 từ VPC CIDR |
| EC2 SG chặn outbound 443 | Thêm Outbound rule: TCP 443 |

### Lỗi 3: Access Denied

**Triệu chứng:**
```
aws sqs list-queues
An error occurred (AccessDenied)...
```

**Nguyên nhân & Fix:**

| Nguyên nhân | Fix |
|-------------|-----|
| EC2 không có IAM Role | Gắn IAM Role với SQS permissions |
| Role thiếu permissions | Thêm sqs:* vào policy |

### Debug với VPC Reachability Analyzer

```
VPC → Reachability Analyzer → Create path

Source: EC2 instance
Destination: Interface Endpoint
Protocol: TCP
Port: 443

→ AWS sẽ phân tích và cho biết CHỖ NÀO BỊ CHẶN!
```

---

## Checklist tổng hợp

```
┌─────────────────────────────────────────────────────────────┐
│                 INTERFACE ENDPOINT CHECKLIST                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  VPC Settings:                                               │
│    ☐ DNS Resolution = Enabled                                │
│    ☐ DNS Hostnames = Enabled                                 │
│                                                              │
│  Interface Endpoint:                                         │
│    ☐ Status = Available                                      │
│    ☐ Cùng VPC với EC2                                        │
│    ☐ Subnet chứa EC2 được chọn                               │
│    ☐ Private DNS = Enabled                                   │
│    ☐ Security Group allow TCP 443 từ VPC CIDR                │
│                                                              │
│  EC2:                                                        │
│    ☐ Security Group allow outbound 443                       │
│    ☐ IAM Role với permissions phù hợp                        │
│                                                              │
│  Test:                                                       │
│    ☐ nslookup trả về Private IP (10.x.x.x)                   │
│    ☐ curl không timeout                                      │
│    ☐ AWS CLI command thành công                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Chi phí

| Thành phần | Chi phí |
|------------|---------|
| Interface Endpoint | $0.01/giờ (~$7.2/tháng) |
| Data transfer qua Endpoint | $0.01/GB |

> 💡 **So sánh:** NAT Gateway = $0.045/giờ (~$32/tháng) + $0.045/GB data

---

## Tài liệu tham khảo

- [AWS VPC Endpoints Documentation](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [Interface VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpce-interface.html)
- [VPC Endpoint Pricing](https://aws.amazon.com/privatelink/pricing/)

---

*Liên kết:*
- [VPC](vpc.md) - Virtual Private Cloud
- [Security Groups](security-groups.md) - Virtual Firewall
- [IAM](iam.md) - Identity and Access Management
