# Amazon Macie


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các chức năng chính](#các-chức-năng-chính)
- [Các loại dữ liệu nhạy cảm Macie phát hiện](#các-loại-dữ-liệu-nhạy-cảm-macie-phát-hiện)
- [Kiến trúc hoạt động](#kiến-trúc-hoạt-động)
- [Các loại Findings (Phát hiện)](#các-loại-findings-phát-hiện)
- [Sensitive Data Discovery Jobs](#sensitive-data-discovery-jobs)
- [Custom Data Identifiers](#custom-data-identifiers)
- [Integration với các AWS Services](#integration-với-các-aws-services)
- [So sánh với các dịch vụ bảo mật khác](#so-sánh-với-các-dịch-vụ-bảo-mật-khác)
- [Pricing Model](#pricing-model)
- [Best Practices](#best-practices)
- [Use Cases thực tế](#use-cases-thực-tế)
- [Exam Tips cho Cloud Practitioner](#exam-tips-cho-cloud-practitioner)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**Amazon Macie** là một dịch vụ bảo mật dữ liệu được quản lý hoàn toàn, sử dụng **machine learning** và **pattern matching** để tự động phát hiện, phân loại và bảo vệ dữ liệu nhạy cảm trong **Amazon S3**.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Amazon Macie                              │
│  "Discover and protect your sensitive data at scale"            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│   │  Machine    │    │   Pattern   │    │  Sensitive Data     │ │
│   │  Learning   │ +  │  Matching   │ =  │  Discovery          │ │
│   └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                                  │
│   Target: Amazon S3 buckets only                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Các chức năng chính

| Chức năng | Mô tả |
|-----------|-------|
| **Sensitive Data Discovery** | Tự động quét và phát hiện dữ liệu nhạy cảm trong S3 |
| **Data Classification** | Phân loại dữ liệu theo mức độ nhạy cảm |
| **Security Assessment** | Đánh giá cấu hình bảo mật S3 bucket |
| **Continuous Monitoring** | Giám sát liên tục các thay đổi về bảo mật |
| **Compliance Support** | Hỗ trợ tuân thủ GDPR, HIPAA, PCI-DSS |

---

## Các loại dữ liệu nhạy cảm Macie phát hiện

### 1. PII (Personally Identifiable Information)

```
┌────────────────────────────────────────────────────┐
│           Personal Identifiable Information         │
├────────────────────────────────────────────────────┤
│  • Họ tên đầy đủ (Full names)                       │
│  • Địa chỉ email                                    │
│  • Số điện thoại                                    │
│  • Địa chỉ nhà/công ty                              │
│  • Ngày sinh                                        │
│  • Số CMND/CCCD/Hộ chiếu                            │
│  • Số an sinh xã hội (SSN - Social Security Number) │
│  • Số bằng lái xe                                   │
└────────────────────────────────────────────────────┘
```

### 2. Financial Data

| Loại dữ liệu | Ví dụ |
|--------------|-------|
| Credit Card Numbers | 4111-1111-1111-1111 |
| Bank Account Numbers | Số tài khoản ngân hàng |
| CVV/CVC Codes | Mã bảo mật thẻ |
| Financial Statements | Báo cáo tài chính |

### 3. Credentials & Secrets

```
┌──────────────────────────────────────┐
│        Credentials & Secrets          │
├──────────────────────────────────────┤
│  • AWS Access Keys                    │
│  • AWS Secret Keys                    │
│  • API Keys / Tokens                  │
│  • Private Keys (SSH, SSL)            │
│  • Database Credentials               │
│  • Passwords trong config files       │
└──────────────────────────────────────┘
```

### 4. Healthcare Data (PHI - Protected Health Information)

- Medical records
- Health insurance information
- Prescription data

---

## Kiến trúc hoạt động

```
                         ┌────────────────────┐
                         │    Amazon Macie    │
                         │   (Analysis Engine)│
                         └─────────┬──────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
    │  S3 Bucket  │        │  S3 Bucket  │        │  S3 Bucket  │
    │     #1      │        │     #2      │        │     #3      │
    └─────────────┘        └─────────────┘        └─────────────┘


                         ┌────────────────────┐
                         │     Findings       │
                         │   (Phát hiện)      │
                         └─────────┬──────────┘
                                   │
        ┌──────────────┬───────────┼───────────┬──────────────┐
        ▼              ▼           ▼           ▼              ▼
   ┌─────────┐   ┌──────────┐ ┌─────────┐ ┌─────────┐   ┌─────────┐
   │CloudWatch│   │EventBridge│ │Security │ │   SNS   │   │  Lambda │
   │  Logs   │   │(Automate) │ │   Hub   │ │(Notify) │   │(Remediate)│
   └─────────┘   └──────────┘ └─────────┘ └─────────┘   └─────────┘
```

---

## Các loại Findings (Phát hiện)

### 1. Sensitive Data Findings

Phát hiện khi Macie tìm thấy dữ liệu nhạy cảm trong S3 objects.

| Finding Type | Mô tả |
|--------------|-------|
| `SensitiveData:S3Object/Personal` | Phát hiện PII |
| `SensitiveData:S3Object/Financial` | Phát hiện dữ liệu tài chính |
| `SensitiveData:S3Object/Credentials` | Phát hiện credentials |
| `SensitiveData:S3Object/CustomIdentifier` | Phát hiện dữ liệu theo custom pattern |

### 2. Policy Findings

Phát hiện các vấn đề về cấu hình bảo mật S3.

| Finding Type | Mô tả |
|--------------|-------|
| `Policy:IAMUser/S3BucketPublic` | Bucket được public access |
| `Policy:IAMUser/S3BucketSharedExternally` | Bucket được share ra ngoài AWS account |
| `Policy:IAMUser/S3BucketReplicatedExternally` | Bucket được replicate ra account khác |
| `Policy:IAMUser/S3BlockPublicAccessDisabled` | Block public access bị tắt |

---

## Sensitive Data Discovery Jobs

### Cách tạo Discovery Job

```
┌─────────────────────────────────────────────────────────────┐
│                    Discovery Job Setup                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Chọn S3 Buckets để quét                                 │
│     └── Specific buckets hoặc All buckets                   │
│                                                              │
│  2. Chọn Managed Data Identifiers                           │
│     └── AWS cung cấp sẵn (PII, Financial, Credentials...)   │
│                                                              │
│  3. Thêm Custom Data Identifiers (tùy chọn)                 │
│     └── Regex patterns do bạn định nghĩa                    │
│                                                              │
│  4. Đặt lịch chạy                                           │
│     └── One-time hoặc Scheduled (daily, weekly, monthly)    │
│                                                              │
│  5. Cấu hình Sampling                                       │
│     └── Quét toàn bộ hoặc sample theo %                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Job Types

| Type | Mô tả | Use Case |
|------|-------|----------|
| **One-time Job** | Chạy 1 lần duy nhất | Audit ban đầu, kiểm tra ad-hoc |
| **Scheduled Job** | Chạy theo lịch định kỳ | Monitoring liên tục, compliance |

---

## Custom Data Identifiers

Cho phép bạn tạo regex patterns riêng để phát hiện dữ liệu đặc thù của tổ chức.

### Ví dụ Custom Identifiers

```
┌─────────────────────────────────────────────────────────────┐
│                 Custom Data Identifier Examples              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Employee ID:                                                │
│  ├── Pattern: EMP-[0-9]{6}                                  │
│  └── Match: EMP-123456                                       │
│                                                              │
│  Project Code:                                               │
│  ├── Pattern: PROJ-[A-Z]{3}-[0-9]{4}                        │
│  └── Match: PROJ-AWS-2024                                    │
│                                                              │
│  Internal Account Number:                                    │
│  ├── Pattern: ACC[0-9]{10}                                  │
│  └── Match: ACC1234567890                                    │
│                                                              │
│  Vietnam Phone Number:                                       │
│  ├── Pattern: (0|\\+84)[0-9]{9,10}                          │
│  └── Match: 0901234567, +84901234567                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Mô tả | Required |
|-----------|-------|----------|
| **Regex** | Pattern để match dữ liệu | ✅ Yes |
| **Keywords** | Từ khóa phải xuất hiện gần match | ❌ Optional |
| **Ignore Words** | Từ để loại trừ kết quả false positive | ❌ Optional |
| **Maximum Match Distance** | Khoảng cách tối đa giữa keyword và match | ❌ Optional |

---

## Integration với các AWS Services

### 1. Amazon EventBridge

```
Macie Finding → EventBridge Rule → Target Action
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                   ┌─────────┐    ┌─────────┐    ┌─────────┐
                   │ Lambda  │    │   SNS   │    │  Step   │
                   │(Remediate)│    │(Notify) │    │Functions│
                   └─────────┘    └─────────┘    └─────────┘
```

**Use Cases:**
- Tự động encrypt S3 object khi phát hiện sensitive data
- Gửi notification khi có policy violation
- Trigger workflow để review và xử lý

### 2. AWS Security Hub

```
┌──────────────────────────────────────────────────────────┐
│                    AWS Security Hub                       │
│              (Centralized Security View)                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│   │  Macie  │  │GuardDuty│  │Inspector│  │ Config  │    │
│   │Findings │  │Findings │  │Findings │  │Findings │    │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│        │            │            │            │          │
│        └────────────┴─────┬──────┴────────────┘          │
│                           ▼                               │
│              ┌─────────────────────────┐                 │
│              │   Unified Dashboard     │                 │
│              │   Compliance Reports    │                 │
│              └─────────────────────────┘                 │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 3. Amazon CloudWatch

- Metrics về số lượng findings
- Alerts khi vượt ngưỡng
- Dashboard monitoring

---

## So sánh với các dịch vụ bảo mật khác

| Service | Focus | Target Resources |
|---------|-------|------------------|
| **Amazon Macie** | Sensitive data discovery | **S3 only** |
| **Amazon GuardDuty** | Threat detection | AWS accounts, workloads |
| **Amazon Inspector** | Vulnerability assessment | EC2, ECR, Lambda |
| **AWS Security Hub** | Aggregation & Compliance | All security services |
| **AWS Config** | Configuration compliance | AWS resources |

```
┌────────────────────────────────────────────────────────────────────┐
│                    AWS Security Services Comparison                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  "Dữ liệu nhạy cảm trong S3 ở đâu?"      → Amazon Macie            │
│                                                                     │
│  "Có ai đang tấn công AWS account?"      → Amazon GuardDuty        │
│                                                                     │
│  "EC2/Container có lỗ hổng bảo mật?"     → Amazon Inspector        │
│                                                                     │
│  "Tổng hợp tất cả findings ở đâu?"       → AWS Security Hub        │
│                                                                     │
│  "Resource có đúng cấu hình không?"      → AWS Config              │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Pricing Model

### Chi phí Macie

| Component | Pricing |
|-----------|---------|
| **S3 Bucket Evaluation** | Miễn phí (bucket inventory & evaluation) |
| **Sensitive Data Discovery** | Tính theo GB data được quét |
| **First 1 GB/month** | Miễn phí (Free Tier) |

### Ví dụ tính chi phí

```
Scenario: Quét 100 GB data trong S3

  First 50 TB/month:    $1.00 per GB
  Next 450 TB/month:    $0.50 per GB
  Over 500 TB/month:    $0.25 per GB

  Chi phí = 100 GB × $1.00 = $100/month
```

> [!TIP]
> Sử dụng **Sampling** để giảm chi phí khi quét bucket lớn. Ví dụ: chỉ quét 10% objects thay vì 100%.

---

## Best Practices

### 1. Thiết lập ban đầu

```
┌─────────────────────────────────────────────────────────┐
│              Macie Implementation Checklist              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  □ Enable Macie trong tất cả regions cần thiết          │
│  □ Chạy initial discovery job cho tất cả S3 buckets     │
│  □ Review và address các policy findings                 │
│  □ Tạo custom data identifiers cho dữ liệu đặc thù      │
│  □ Setup EventBridge rules cho automated response        │
│  □ Integrate với Security Hub                            │
│  □ Configure alerts trong CloudWatch                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Ongoing Operations

| Practice | Mô tả |
|----------|-------|
| **Scheduled Jobs** | Chạy discovery jobs định kỳ (weekly/monthly) |
| **Review Findings** | Review và triage findings thường xuyên |
| **Update Custom Identifiers** | Cập nhật patterns khi có data types mới |
| **Multi-account** | Sử dụng AWS Organizations để quản lý Macie centrally |

### 3. Cost Optimization

- Sử dụng **sampling** cho buckets lớn
- Exclude các buckets không chứa user data (logs, backups)
- Chạy one-time jobs thay vì scheduled cho data ít thay đổi

---

## Use Cases thực tế

### 1. GDPR Compliance

```
Requirement: Phải biết PII của EU citizens được lưu ở đâu

Solution:
  1. Enable Macie cho tất cả S3 buckets
  2. Run discovery job với PII identifiers
  3. Export findings để tạo data inventory
  4. Implement access controls cho sensitive data
```

### 2. Security Audit

```
Requirement: Audit xem có credentials nào bị commit vào S3 không

Solution:
  1. Create discovery job với Credentials identifiers
  2. Scan tất cả buckets chứa code/configs
  3. Remediate: rotate exposed credentials
  4. Setup scheduled jobs để monitor ongoing
```

### 3. Data Classification

```
Requirement: Phân loại data để apply đúng retention policy

Solution:
  1. Run Macie discovery với tất cả data identifiers
  2. Tag S3 objects dựa trên classification
  3. Apply S3 Lifecycle policies theo tags
```

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ Macie:**
> - S3 + Sensitive Data + Machine Learning
> - PII (Personally Identifiable Information)
> - Data Discovery & Classification
> - Compliance (GDPR, HIPAA, PCI-DSS)

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Macie hoạt động với services nào? | **Chỉ Amazon S3** |
| Macie dùng công nghệ gì để phát hiện? | **Machine Learning + Pattern Matching** |
| Macie giúp gì cho compliance? | Phát hiện **PII**, hỗ trợ **GDPR**, **HIPAA**, **PCI-DSS** |
| Macie findings gửi đi đâu? | **EventBridge**, **Security Hub**, **CloudWatch** |

### Phân biệt với GuardDuty

```
┌─────────────────────────┬─────────────────────────┐
│       Amazon Macie       │    Amazon GuardDuty     │
├─────────────────────────┼─────────────────────────┤
│ Tìm SENSITIVE DATA      │ Tìm THREATS/ATTACKS     │
│ Chỉ scan S3             │ Scan nhiều data sources │
│ PII, Financial, Creds   │ Malicious activity      │
│ Compliance focus        │ Security focus          │
└─────────────────────────┴─────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                     Amazon Macie Summary                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Phát hiện sensitive data trong S3 bằng ML                   │
│  ✅ Phát hiện policy violations (public buckets...)             │
│  ✅ Hỗ trợ custom data identifiers                              │
│  ✅ Integration với EventBridge, Security Hub                    │
│  ✅ Compliance: GDPR, HIPAA, PCI-DSS                            │
│                                                                  │
│  ❌ KHÔNG scan các services khác (chỉ S3)                       │
│  ❌ KHÔNG phát hiện threats/attacks (đó là GuardDuty)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
