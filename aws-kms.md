# AWS Key Management Service (KMS)


## Mục lục

- [Tổng quan](#tổng-quan)
- [Hiểu đơn giản: KMS làm gì?](#hiểu-đơn-giản-kms-làm-gì)
- [Các loại KMS Keys](#các-loại-kms-keys)
- [Envelope Encryption](#envelope-encryption)
- [Key Rotation](#key-rotation)
- [Key Policies](#key-policies)
- [KMS Integration với AWS Services](#kms-integration-với-aws-services)
- [Multi-Region Keys](#multi-region-keys)
- [Custom Key Store Options](#custom-key-store-options)
- [So sánh KMS với các services liên quan](#so-sánh-kms-với-các-services-liên-quan)
- [Pricing](#pricing)
- [Exam Tips cho Cloud Practitioner](#exam-tips-cho-cloud-practitioner)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**AWS KMS** là dịch vụ quản lý **encryption keys** được AWS quản lý hoàn toàn. KMS giúp bạn tạo, quản lý và sử dụng các keys để mã hóa data một cách dễ dàng và an toàn.

```
┌─────────────────────────────────────────────────────────────────┐
│                       AWS KMS                                    │
│       "Create and control encryption keys easily"               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   KMS Key ──────► Encrypt Data ──────► Encrypted Data           │
│      │                                       │                   │
│      │                                       │                   │
│      └─────────► Decrypt Data ◄──────────────┘                  │
│                                                                  │
│   Integrates with 100+ AWS services:                            │
│   S3, EBS, RDS, DynamoDB, Lambda, Secrets Manager...            │
│                                                                  │
│   ✅ FIPS 140-2 Level 2 validated                               │
│   ✅ All key usage logged in CloudTrail                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hiểu đơn giản: KMS làm gì?

```
Ví dụ đời thường:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bạn có một két sắt (encrypted data)
  └── Cần chìa khóa (encryption key) để mở

KMS = Dịch vụ quản lý chìa khóa cho bạn
  ├── Tạo chìa khóa mới
  ├── Bảo vệ chìa khóa (AWS giữ an toàn)
  ├── Cho phép ai dùng chìa khóa (IAM policies)
  ├── Tự động thay chìa khóa mới định kỳ (rotation)
  └── Ghi log ai đã dùng chìa khóa (CloudTrail)
```

**Tại sao cần KMS thay vì tự quản lý keys?**
- ✅ AWS bảo vệ keys trong hardware an toàn
- ✅ Keys tự động rotate (thay mới)
- ✅ Dễ dàng set permissions (ai được dùng key)
- ✅ Audit trail (biết ai đã decrypt data)
- ✅ Tích hợp sẵn với 100+ AWS services

---

## Các loại KMS Keys

### 1. Phân loại theo người quản lý

```
┌─────────────────────────────────────────────────────────────────┐
│                    Types of KMS Keys                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AWS Owned Keys                                               │
│     └── AWS tạo và quản lý hoàn toàn                            │
│     └── Bạn KHÔNG thấy trong KMS console                        │
│     └── Dùng cho nhiều accounts                                  │
│     └── FREE                                                     │
│                                                                  │
│  2. AWS Managed Keys (aws/service-name)                         │
│     └── AWS tạo, bạn thấy trong console                         │
│     └── Auto-rotate mỗi năm                                      │
│     └── Không thể delete hoặc modify policy                     │
│     └── FREE                                                     │
│     └── VD: aws/s3, aws/rds, aws/ebs                            │
│                                                                  │
│  3. Customer Managed Keys (CMK)                                  │
│     └── BẠN tạo và quản lý                                      │
│     └── Full control (policy, rotation, delete)                 │
│     └── $1/month + $0.03/10,000 API calls                       │
│     └── Best for: sensitive data, compliance                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### So sánh

| Type | Ai tạo | Bạn thấy? | Control | Cost |
|------|--------|-----------|---------|------|
| **AWS Owned** | AWS | ❌ | ❌ | Free |
| **AWS Managed** | AWS | ✅ | Limited | Free |
| **Customer Managed** | Bạn | ✅ | Full | $1/month |

> [!TIP]
> **Best Practice:** Dùng **Customer Managed Keys** cho sensitive data để có full control và audit.

### 2. Phân loại theo loại key

| Key Type | Mô tả | Use Case |
|----------|-------|----------|
| **Symmetric** | 1 key cho cả encrypt + decrypt (AES-256) | Mặc định, dùng cho AWS services |
| **Asymmetric** | Public + Private key pair (RSA, ECC) | Digital signatures, encrypt outside AWS |
| **HMAC** | Hash-based Message Authentication | Verify integrity |

---

## Envelope Encryption

KMS dùng **Envelope Encryption** để encrypt data lớn một cách hiệu quả:

```
┌─────────────────────────────────────────────────────────────────┐
│                   Envelope Encryption                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Vấn đề: KMS chỉ encrypt được 4KB data trực tiếp               │
│          Làm sao encrypt file 1GB?                              │
│                                                                  │
│  Giải pháp: 2 levels of keys                                    │
│                                                                  │
│  ┌─────────────┐                                                │
│  │  KMS Key    │  (Root key - stays in KMS)                    │
│  │  (Master)   │                                                │
│  └──────┬──────┘                                                │
│         │ encrypts                                               │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  Data Key   │  (Generated by KMS)                           │
│  └──────┬──────┘                                                │
│         │ encrypts                                               │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  Your Data  │  (Any size - 1GB, 10GB...)                    │
│  │   (File)    │                                                │
│  └─────────────┘                                                │
│                                                                  │
│  Lưu trữ: Encrypted Data Key + Encrypted Data                  │
│  Khi decrypt: KMS decrypt Data Key → Data Key decrypt Data     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Workflow:**
1. **Encrypt:** Call KMS `GenerateDataKey` → Get Data Key (plaintext + encrypted)
2. Use plaintext Data Key to encrypt your data locally
3. Store encrypted Data Key + encrypted data together
4. **Decrypt:** Call KMS `Decrypt` to get plaintext Data Key → Decrypt data locally

---

## Key Rotation

### Automatic Rotation

```
┌─────────────────────────────────────────────────────────────────┐
│                    Key Rotation                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AWS Managed Keys:                                               │
│  └── Auto-rotate mỗi năm (bắt buộc)                            │
│                                                                  │
│  Customer Managed Keys:                                          │
│  └── Optional, cấu hình rotation period (90 days - 7 years)    │
│  └── Có thể rotate on-demand                                    │
│                                                                  │
│  Khi rotate:                                                     │
│  ├── Key ID giữ nguyên                                          │
│  ├── KMS giữ lại old key material (để decrypt old data)        │
│  ├── New encryptions dùng new key material                      │
│  └── Hoàn toàn transparent cho applications                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Policies

Key Policies contrrol ai có thể dùng KMS key:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Allow Admin",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::123456789:user/Admin"},
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow Encrypt Only",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::123456789:role/AppRole"},
      "Action": [
        "kms:Encrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    }
  ]
}
```

**Key Actions:**
- `kms:Encrypt` - Mã hóa data
- `kms:Decrypt` - Giải mã data
- `kms:GenerateDataKey` - Tạo data key cho envelope encryption
- `kms:DescribeKey` - Xem thông tin key
- `kms:CreateGrant` - Cho phép người khác dùng key tạm thời

---

## KMS Integration với AWS Services

```
┌─────────────────────────────────────────────────────────────────┐
│               KMS Integration (100+ services)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Storage:                                                        │
│  ├── S3: Server-Side Encryption (SSE-KMS)                       │
│  ├── EBS: Encrypted volumes                                     │
│  └── EFS: Encrypt file system                                   │
│                                                                  │
│  Database:                                                       │
│  ├── RDS: Encrypt at rest                                       │
│  ├── DynamoDB: Encrypt tables                                   │
│  └── Aurora: Encrypt cluster                                    │
│                                                                  │
│  Secrets:                                                        │
│  ├── Secrets Manager: Encrypt secrets                           │
│  └── Parameter Store: Encrypt parameters                        │
│                                                                  │
│  Compute:                                                        │
│  ├── Lambda: Encrypt env variables                              │
│  └── ECS: Encrypt secrets                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Multi-Region Keys

```
┌─────────────────────────────────────────────────────────────────┐
│                  Multi-Region Keys                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     Region A (Primary)          Region B (Replica)              │
│    ┌─────────────┐             ┌─────────────┐                  │
│    │  KMS Key    │────────────►│  KMS Key    │                  │
│    │  (primary)  │  replicate  │  (replica)  │                  │
│    └─────────────┘             └─────────────┘                  │
│          │                           │                           │
│          ▼                           ▼                           │
│    Encrypt data              Decrypt same data                   │
│    in Region A               in Region B                         │
│                                                                  │
│  Use cases:                                                      │
│  ├── Disaster Recovery                                           │
│  ├── Global applications                                         │
│  └── Data encrypted in one region, decrypted in another        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Custom Key Store Options

| Option | Mô tả | Security Level |
|--------|-------|----------------|
| **Standard KMS** | Keys trong AWS managed HSMs | FIPS 140-2 Level 2 |
| **CloudHSM Key Store** | Keys trong dedicated CloudHSM | FIPS 140-2 Level 3 |
| **External Key Store (XKS)** | Keys stored outside AWS | Depends on your HSM |
| **Imported Key Material (BYOK)** | Import your own keys | FIPS 140-2 Level 2 |

---

## So sánh KMS với các services liên quan

| Service | Lưu gì | Dùng khi nào |
|---------|--------|--------------|
| **KMS** | Encryption keys | Encrypt AWS resources (S3, EBS, RDS) |
| **CloudHSM** | Keys (dedicated hardware) | FIPS Level 3, full control |
| **Secrets Manager** | Passwords, API keys | DB credentials, auto-rotate |
| **Parameter Store** | Config, secrets | App config (free) |
| **ACM** | SSL certificates | HTTPS for websites |

---

## Pricing

| Component | Cost |
|-----------|------|
| **Customer Managed Key** | $1/month |
| **AWS Managed Key** | Free |
| **API Calls** | $0.03 per 10,000 requests |
| **Multi-Region Key** | $1/month per replica |

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ KMS:**
> - **Managed encryption keys** cho AWS services
> - Tích hợp với **100+ AWS services** (S3, EBS, RDS...)
> - **FIPS 140-2 Level 2** validated
> - All key usage logged in **CloudTrail**
> - **Customer Managed Keys** = Full control, $1/month

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Service nào quản lý encryption keys? | **AWS KMS** |
| KMS encrypt S3 objects như thế nào? | **SSE-KMS** (Server-Side Encryption) |
| Ai có thể dùng KMS key? | Định nghĩa bởi **Key Policy** |
| Làm sao encrypt data > 4KB? | **Envelope Encryption** (Data Keys) |
| KMS hay CloudHSM cho general use? | **KMS** (CloudHSM cho FIPS Level 3) |
| Key loại gì dùng phổ biến nhất? | **Symmetric** (AES-256) |

### So sánh Key Types

```
┌─────────────────────────┬─────────────────────────────────────┐
│     AWS Managed         │        Customer Managed             │
├─────────────────────────┼─────────────────────────────────────┤
│ AWS tạo (aws/s3...)     │ Bạn tạo                             │
│ Auto-rotate 1 năm       │ Configure rotation                  │
│ Cannot delete           │ Can delete, disable                 │
│ Limited control         │ Full control                        │
│ FREE                    │ $1/month                            │
└─────────────────────────┴─────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS KMS Summary                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Managed encryption key service                              │
│  ✅ Integrates with 100+ AWS services                           │
│  ✅ FIPS 140-2 Level 2 validated                                │
│  ✅ All usage logged in CloudTrail                              │
│                                                                  │
│  Key Types:                                                      │
│  ├── AWS Owned (free, invisible)                                │
│  ├── AWS Managed (free, visible, limited control)              │
│  └── Customer Managed ($1/month, full control)                  │
│                                                                  │
│  Features:                                                       │
│  ├── Envelope Encryption (encrypt large data)                  │
│  ├── Key Rotation (automatic or on-demand)                     │
│  ├── Multi-Region Keys (DR, global apps)                       │
│  └── Key Policies (access control)                              │
│                                                                  │
│  Pricing: $1/key/month + $0.03/10K API calls                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
