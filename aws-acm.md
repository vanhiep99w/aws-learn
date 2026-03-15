# AWS Certificate Manager (ACM)

## Mục lục
- [Tổng quan](#tổng-quan)
- [Các loại Certificate](#các-loại-certificate)
- [Tính năng chính](#tính-năng-chính)
- [Tích hợp với AWS Services](#tích-hợp-với-aws-services)
- [Quy trình tạo Certificate](#quy-trình-tạo-certificate)
- [Validation Methods](#validation-methods)
- [Certificate Renewal](#certificate-renewal)
- [Import Certificate từ bên ngoài](#import-certificate-từ-bên-ngoài)
- [Private Certificate Authority](#private-certificate-authority)
- [Giới hạn và Lưu ý](#giới-hạn-và-lưu-ý)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [So sánh với các giải pháp khác](#so-sánh-với-các-giải-pháp-khác)
- [Exam Tips](#exam-tips)

---

## Tổng quan

**AWS Certificate Manager (ACM)** là dịch vụ quản lý SSL/TLS certificates, giúp bạn dễ dàng provision, quản lý và deploy certificates cho các AWS services và ứng dụng.

### SSL/TLS là gì?

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTTPS Connection                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Browser                              Server                   │
│      │                                    │                     │
│      │──── "Tôi muốn HTTPS" ─────────────▶│                     │
│      │                                    │                     │
│      │◀─── Server gửi Certificate ────────│                     │
│      │     (chứa public key)              │                     │
│      │                                    │                     │
│      │     Browser verify certificate     │                     │
│      │     ✓ Có được CA tin cậy sign?     │                     │
│      │     ✓ Domain có match?             │                     │
│      │     ✓ Còn hạn không?               │                     │
│      │                                    │                     │
│      │──── Encrypted session key ────────▶│                     │
│      │                                    │                     │
│      │◀════ Encrypted Communication ═════▶│                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tại sao cần ACM?

| Không có ACM | Có ACM |
|--------------|--------|
| Tự mua certificate từ CA | AWS cấp miễn phí |
| Tự cài đặt lên server | Tự động deploy |
| Tự renew trước khi hết hạn | Tự động renew |
| Quản lý private key | AWS quản lý an toàn |

---

## Các loại Certificate

### 1. Public Certificates (ACM-issued)

Certificates được cấp bởi **Amazon Trust Services** - một public Certificate Authority được browsers tin tưởng.

```
┌─────────────────────────────────────────┐
│         Public Certificate              │
├─────────────────────────────────────────┤
│  Issuer: Amazon Trust Services          │
│  Domain: www.example.com                │
│  Valid: 13 months                       │
│  Auto-renew: ✅ Yes                     │
│  Cost: FREE (với AWS services)          │
└─────────────────────────────────────────┘
```

**Đặc điểm:**
- ✅ Miễn phí khi dùng với AWS services
- ✅ Tự động renew
- ✅ Được browsers tin tưởng globally
- ❌ Không export được private key (trước đây)
- ✅ Có thể export (từ 2025, có phí)

### 2. Imported Certificates

Certificates bạn mua từ CA khác (DigiCert, Let's Encrypt, etc.) và import vào ACM.

```
┌─────────────────────────────────────────┐
│        Imported Certificate             │
├─────────────────────────────────────────┤
│  Issuer: DigiCert, Let's Encrypt, etc.  │
│  Domain: www.example.com                │
│  Valid: Tuỳ CA                          │
│  Auto-renew: ❌ No (phải import lại)    │
│  Cost: Tuỳ CA + FREE để import          │
└─────────────────────────────────────────┘
```

**Đặc điểm:**
- ✅ Import miễn phí
- ✅ Có thể dùng với AWS services
- ❌ Không tự động renew
- ⚠️ ACM sẽ cảnh báo trước khi hết hạn

### 3. Private Certificates (AWS Private CA)

Certificates cho internal applications, không cần public trust.

```
┌─────────────────────────────────────────┐
│        Private Certificate              │
├─────────────────────────────────────────┤
│  Issuer: Your Private CA                │
│  Domain: internal.corp.local            │
│  Valid: Tuỳ chỉnh                       │
│  Use case: Internal apps, IoT, VPN      │
│  Cost: $400/month/CA + per cert         │
└─────────────────────────────────────────┘
```

---

## Tính năng chính

### 1. Centralized Management

```
┌──────────────────────────────────────────────────────────────┐
│                    ACM Console                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📜 www.example.com          ✅ Issued    Expires: 2025-12   │
│  📜 api.example.com          ✅ Issued    Expires: 2025-12   │
│  📜 *.staging.example.com    ⏳ Pending   Validation needed  │
│  📜 internal.corp            🔒 Private   Expires: 2026-06   │
│                                                              │
│  [Request Certificate]  [Import Certificate]                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2. Secure Key Storage

- Private keys được lưu trữ và mã hoá bởi AWS
- Keys **không bao giờ** rời khỏi ACM (trừ exportable certs)
- Được bảo vệ bởi AWS KMS

### 3. Automatic Renewal

```
ACM Certificate Lifecycle:
                                    
Issue ──▶ Active ──▶ Approaching Expiry ──▶ Auto Renew ──▶ Active
                          │                      ▲
                          │ (60 days before)     │
                          └─ ACM attempts renew ─┘
```

**Điều kiện để auto-renew:**
- Certificate được cấp bởi ACM (không phải imported)
- Certificate đang được sử dụng với AWS service
- DNS validation record vẫn còn (nếu dùng DNS validation)

### 4. Wildcard Support

```
Certificate cho: *.example.com

Covers:
  ✅ www.example.com
  ✅ api.example.com
  ✅ app.example.com
  ✅ anything.example.com
  
  ❌ example.com (root domain - cần thêm riêng)
  ❌ sub.api.example.com (nested subdomain)
```

**Tip:** Request certificate với cả root và wildcard:
- `example.com`
- `*.example.com`

---

## Tích hợp với AWS Services

ACM tích hợp native với nhiều AWS services:

| Service | Use Case |
|---------|----------|
| **Elastic Load Balancer (ALB/NLB)** | HTTPS termination |
| **CloudFront** | HTTPS cho CDN distributions |
| **API Gateway** | Custom domain với HTTPS |
| **Elastic Beanstalk** | HTTPS cho web apps |
| **AWS Amplify** | HTTPS cho frontend hosting |
| **AWS App Runner** | HTTPS cho container apps |

### Lưu ý quan trọng về Region:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  QUAN TRỌNG: Certificate Region                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CloudFront        →  Certificate phải ở US-EAST-1 (N.Virginia) │
│                                                                 │
│  ALB, API Gateway  →  Certificate phải ở CÙNG REGION với service│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tại sao CloudFront yêu cầu Certificate ở US-EAST-1?

**CloudFront là Global Service** - không thuộc region nào cụ thể:

```
┌─────────────────────────────────────────────────────────────────┐
│              CloudFront Architecture                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────────────────────────────┐                      │
│    │     CloudFront Control Plane        │                      │
│    │        (US-EAST-1 only!)            │                      │
│    │                                     │                      │
│    │  • Distribution configs             │                      │
│    │  • SSL Certificates                 │                      │
│    │  • Cache behaviors                  │                      │
│    └─────────────────────────────────────┘                      │
│                      │                                          │
│                      │ Replicate to all edges                   │
│                      ▼                                          │
│    ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                  │
│    │Tokyo│  │Seoul│  │ SG  │  │Paris│  │ NYC │  ... 400+ POPs   │
│    └─────┘  └─────┘  └─────┘  └─────┘  └─────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Quan trọng:** Certificate ở us-east-1 chỉ là **nơi lưu config**, không ảnh hưởng latency!

```
User ở Singapore
        │
        │ HTTPS request
        ▼
┌─────────────────────────┐
│  CloudFront Edge        │
│  SINGAPORE              │  ← Certificate được deploy TẠI ĐÂY
│  (SSL termination)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  S3 / ALB Singapore     │  ← Origin vẫn ở Singapore
└─────────────────────────┘
```

### AWS Global Services (Control Plane ở US-EAST-1)

Đây là các services cũng lưu configs ở us-east-1:

| Service | Config ở US-EAST-1 | Mô tả |
|---------|-------------------|-----------|
| **CloudFront** | ✅ | CDN toàn cầu |
| **Route 53** | ✅ | DNS toàn cầu |
| **IAM** | ✅ | Users, Roles, Policies |
| **WAF** (cho CloudFront) | ✅ | Web ACLs cho CloudFront |
| **AWS Organizations** | ✅ | Multi-account management |
| **AWS Global Accelerator** | ✅ | Anycast routing |
| **ACM** (cho CloudFront) | ✅ | Certificates cho CloudFront |

### Tạo Certificate ở nhiều Regions

Bạn có thể tạo **cùng certificate** ở nhiều regions (đều miễn phí!):

```bash
# 1. Cho CloudFront (bắt buộc us-east-1)
aws acm request-certificate \
    --domain-name example.com \
    --subject-alternative-names "*.example.com" \
    --validation-method DNS \
    --region us-east-1

# 2. Cho ALB ở Singapore
aws acm request-certificate \
    --domain-name example.com \
    --subject-alternative-names "*.example.com" \
    --validation-method DNS \
    --region ap-southeast-1
```

**Cùng DNS validation record** có thể validate cho cả 2 certificates!

---

## Quy trình tạo Certificate

### Step 1: Request Certificate

```bash
aws acm request-certificate \
    --domain-name example.com \
    --subject-alternative-names "*.example.com" \
    --validation-method DNS \
    --region us-east-1
```

### Step 2: Validate Domain Ownership

Bạn phải chứng minh mình sở hữu domain (xem phần Validation Methods)

### Step 3: Certificate Issued

Sau khi validate thành công, certificate sẽ được cấp trong vài phút.

---

## Validation Methods

### 1. DNS Validation (Khuyến nghị ✅)

Thêm một CNAME record vào DNS:

```
┌─────────────────────────────────────────────────────────────────┐
│  DNS Validation Record                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Record Name:  _abc123.example.com                              │
│  Record Type:  CNAME                                            │
│  Record Value: _xyz789.acm-validations.aws.                     │
│                                                                 │
│  ACM checks: "Nếu record này tồn tại → Bạn control domain"      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Ưu điểm:**
- ✅ Chỉ cần setup 1 lần
- ✅ Tự động renew (nếu giữ CNAME record)
- ✅ Không cần email

**Dùng Route 53?** ACM có thể tự động tạo record cho bạn!

### 2. Email Validation

ACM gửi email đến domain owner addresses:

```
Emails sent to:
  - admin@example.com
  - administrator@example.com
  - hostmaster@example.com
  - postmaster@example.com
  - webmaster@example.com
```

**Ưu điểm:**
- Không cần access DNS

**Nhược điểm:**
- ❌ Phải có email setup
- ❌ Phải manually approve cho mỗi lần renew
- ❌ Không khuyến nghị cho production

---

## Certificate Renewal

### ACM-issued Certificates

```
Timeline:
├─ Certificate issued (valid 13 months)
├─ ...
├─ 60 days before expiry: ACM bắt đầu renewal
│   ├─ Check 1: Certificate đang được dùng?
│   ├─ Check 2: DNS validation record còn không? (if DNS validation)
│   └─ Check 3: Có thể validate lại domain?
├─ Renewal successful → Certificate updated
└─ No action needed from you!
```

### Imported Certificates

```
Timeline:
├─ Certificate imported
├─ ...
├─ 45 days before expiry: ACM gửi CloudWatch Event
├─ 30 days before expiry: ACM gửi notification
├─ 7 days before expiry: ⚠️ Critical warning
└─ Expiry: ❌ Certificate invalid → HTTPS fails!

Action needed: Import certificate mới thủ công
```

---

## Import Certificate từ bên ngoài

### Khi nào cần import?

- Đã có certificate từ CA khác
- Cần Extended Validation (EV) certificate (hiển thị tên công ty)
- Cần certificate cho non-AWS resources (nhưng muốn quản lý tập trung)

### Cách import:

```bash
aws acm import-certificate \
    --certificate fileb://certificate.pem \
    --private-key fileb://private-key.pem \
    --certificate-chain fileb://certificate-chain.pem \
    --region us-east-1
```

### Requirements:

| Component | Format | Required |
|-----------|--------|----------|
| Certificate | PEM | ✅ |
| Private Key | PEM (unencrypted) | ✅ |
| Certificate Chain | PEM | ⚠️ Recommended |

---

## Private Certificate Authority

AWS Private CA cho phép tạo private PKI infrastructure.

### Use Cases:

```
┌─────────────────────────────────────────────────────────────────┐
│  Private CA Use Cases                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏢 Internal Applications                                       │
│     - Microservices mTLS                                        │
│     - Internal APIs                                             │
│                                                                 │
│  🔌 IoT Devices                                                 │
│     - Device authentication                                     │
│     - Secure communication                                      │
│                                                                 │
│  🔐 VPN & Network                                               │
│     - Client certificates                                       │
│     - Network device authentication                             │
│                                                                 │
│  📱 Mobile Apps                                                 │
│     - Certificate pinning                                       │
│     - App authentication                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Pricing (đắt!):

| Component | Cost |
|-----------|------|
| General-purpose CA | $400/month |
| Short-lived cert CA (≤7 days) | $50/month |
| Private certificates | Tiered pricing |

---

## Giới hạn và Lưu ý

### Regional Limits:

| Resource | Default Limit |
|----------|---------------|
| ACM certificates per region | 2,500 |
| Domains per certificate | 10 (có thể tăng lên 100) |
| Private CAs per account | 200 |

### Quan trọng:

```
⚠️ Không thể dùng ACM certificate trên EC2 trực tiếp!

   ACM Certificate ──▶ ALB ──▶ EC2  ✅
   
   ACM Certificate ──▶ EC2 directly  ❌
   
Lý do: EC2 cần access private key, nhưng ACM không cho export
(trừ exportable certificates có phí)
```

### Workaround cho EC2:

1. Dùng ALB/NLB phía trước
2. Import certificate từ bên ngoài (Let's Encrypt)
3. Dùng exportable certificates ($15-149/year)

---

## Pricing

### Public Certificates (ACM-issued):

| Type | Cost |
|------|------|
| **Non-exportable** (dùng với AWS services) | **FREE** ✅ |
| **Exportable** - Standard domain | $15/year |
| **Exportable** - Wildcard | $149/year |

### Imported Certificates:

| Action | Cost |
|--------|------|
| Import | **FREE** |
| Use with AWS services | **FREE** |

### Private CA:

| Component | Cost |
|-----------|------|
| General-purpose CA | $400/month |
| Short-lived CA | $50/month |
| Certificates (1-1000) | $0.75 each |
| Certificates (1001-10000) | $0.35 each |

---

## Best Practices

### 1. Dùng DNS Validation

```
✅ DNS Validation
   - Automatic renewal
   - No email management
   - Works with Route 53 auto-create

❌ Email Validation  
   - Manual renewal
   - Email management overhead
```

### 2. Request cả Root và Wildcard

```bash
# Request certificate với:
--domain-name example.com
--subject-alternative-names "*.example.com"

# Covers:
# - example.com ✅
# - www.example.com ✅
# - api.example.com ✅
```

### 3. Giữ DNS Validation Records

```
Xoá CNAME record = Không thể auto-renew!

Giữ record này vĩnh viễn:
_abc123.example.com → _xyz789.acm-validations.aws.
```

### 4. Monitor Certificate Expiry

```bash
# CloudWatch Alarm for certificate expiry
aws cloudwatch put-metric-alarm \
    --alarm-name "CertificateExpiringSoon" \
    --metric-name "DaysToExpiry" \
    --namespace "AWS/CertificateManager" \
    --statistic Minimum \
    --period 86400 \
    --threshold 30 \
    --comparison-operator LessThanThreshold
```

### 5. Cho CloudFront - Luôn dùng us-east-1

```bash
# CloudFront certificates MUST be in us-east-1
aws acm request-certificate \
    --domain-name example.com \
    --region us-east-1  # <-- Bắt buộc!
```

---

## So sánh với các giải pháp khác

| Feature | ACM | Let's Encrypt | Commercial CA |
|---------|-----|---------------|---------------|
| **Cost** | Free | Free | $10-1000+/year |
| **Auto Renewal** | ✅ | ✅ (với certbot) | ❌ |
| **Validity** | 13 months | 90 days | 1-2 years |
| **Wildcard** | ✅ | ✅ | ✅ |
| **EV Certificate** | ❌ | ❌ | ✅ |
| **AWS Integration** | ✅✅✅ | ⚠️ (import) | ⚠️ (import) |
| **Use on EC2** | ❌ (trực tiếp) | ✅ | ✅ |
| **Management** | AWS Console | CLI/automation | Manual |

---

## Exam Tips

> 💡 **CloudFront certificates phải ở us-east-1** - Đây là câu hỏi phổ biến!

> 💡 **ACM certificates miễn phí** khi dùng với AWS services (ELB, CloudFront, API Gateway)

> 💡 **Không thể export private key** từ ACM standard certificates - nếu cần key, dùng exportable hoặc import từ bên ngoài

> 💡 **DNS validation > Email validation** cho production workloads

> 💡 **Private CA đắt** ($400/month) - chỉ dùng cho enterprise use cases

> 💡 **ACM không hỗ trợ trực tiếp trên EC2** - phải dùng qua Load Balancer hoặc import certificate khác

---

## Tài liệu tham khảo

- [AWS Certificate Manager Documentation](https://docs.aws.amazon.com/acm/)
- [ACM Pricing](https://aws.amazon.com/certificate-manager/pricing/)
- [ACM FAQs](https://aws.amazon.com/certificate-manager/faqs/)
- [AWS Private CA](https://docs.aws.amazon.com/privateca/)
