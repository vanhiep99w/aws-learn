# AWS Control Tower


## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Kiến trúc Landing Zone](#2-kiến-trúc-landing-zone)
- [3. Guardrails (Controls)](#3-guardrails-controls)
- [4. Account Factory](#4-account-factory)
- [5. Dashboards & Monitoring](#5-dashboards--monitoring)
- [6. So sánh với AWS Organizations](#6-so-sánh-với-aws-organizations)
- [7. Pricing](#7-pricing)
- [8. Exam Tips (SAA-C03)](#8-exam-tips-saa-c03)
- [9. Tài liệu tham khảo](#9-tài-liệu-tham-khảo)

---

## 1. Tổng quan

**AWS Control Tower** là dịch vụ cung cấp cách dễ nhất để **thiết lập và quản trị (govern)** một môi trường AWS multi-account an toàn, tuân thủ best practices. Control Tower được **xây dựng trên nền tảng AWS Organizations** và tự động hóa những gì bạn phải làm thủ công khi chỉ dùng Organizations.

### Control Tower giải quyết vấn đề gì?

| Vấn đề khi chỉ dùng Organizations | Giải pháp với Control Tower |
|---|---|
| Phải tự tạo OU structure | **Landing Zone** tự động set up best-practice structure |
| Phải tự viết SCPs từ đầu | **Guardrails** sẵn có (Preventive, Detective, Proactive) |
| Phải tự tạo và configure accounts | **Account Factory** tự động provisioning |
| Không có dashboard tổng quan compliance | **Control Tower Dashboard** hiển thị compliance status |
| Best practices phải tự research | **Built-in blueprints** theo AWS Well-Architected |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AWS Control Tower                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │  Landing     │   │  Guardrails  │   │   Account    │   │ Dashboard  │  │
│  │  Zone        │   │  (Controls)  │   │   Factory    │   │            │  │
│  │              │   │              │   │              │   │            │  │
│  │  Pre-built   │   │  Preventive  │   │  Automated   │   │ Compliance │  │
│  │  multi-acct  │   │  Detective   │   │  account     │   │ overview   │  │
│  │  environment │   │  Proactive   │   │  creation    │   │            │  │
│  └──────────────┘   └──────────────┘   └──────────────┘   └────────────┘  │
│                                                                             │
│  Built on top of:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AWS Organizations │ AWS Service Catalog │ AWS IAM Identity Center  │   │
│  │  AWS Config        │ AWS CloudTrail      │ AWS CloudFormation       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kiến trúc Landing Zone

**Landing Zone** là môi trường multi-account được thiết lập sẵn theo best practices. Khi bạn bật Control Tower, nó tự động tạo:

### 2.1. Landing Zone Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Landing Zone Structure                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌───────────────────┐                               │
│                         │       ROOT        │                               │
│                         │  Management Acct  │                               │
│                         └────────┬──────────┘                               │
│                                  │                                          │
│            ┌─────────────────────┼──────────────────────┐                  │
│            │                     │                      │                  │
│     ┌──────▼──────┐     ┌───────▼───────┐     ┌───────▼───────┐          │
│     │ Security OU │     │  Sandbox OU   │     │ Custom OUs... │          │
│     │  (Required) │     │  (Optional)   │     │               │          │
│     └──────┬──────┘     └───────┬───────┘     └───────────────┘          │
│            │                    │                                          │
│     ┌──────┴──────┐     ┌──────┴──────┐                                   │
│     │             │     │             │                                   │
│  ┌──▼──────────┐ ┌▼────────────┐  ┌──▼──────────┐                        │
│  │ Log Archive │ │Security    │  │  Developer  │                        │
│  │ Account     │ │Audit Acct  │  │  Accounts   │                        │
│  │             │ │(optional)  │  │             │                        │
│  │ CloudTrail  │ │ GuardDuty  │  │             │                        │
│  │ Config Logs │ │ Sec Hub    │  │             │                        │
│  │ (Immutable) │ │ Inspector  │  │             │                        │
│  └─────────────┘ └────────────┘  └─────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Thành phần được tạo tự động

| Thành phần | Mô tả |
|---|---|
| **Management Account** | Account chạy Control Tower, quản lý org |
| **Security OU** | OU bắt buộc chứa Log Archive và Audit accounts |
| **Log Archive Account** | Lưu trữ centralized logs (CloudTrail, Config) - immutable |
| **Audit Account** | (Tùy chọn) Cross-account access cho security audit |
| **Sandbox OU** | (Tùy chọn) Cho developer experimentation |
| **IAM Identity Center** | Single Sign-On cho tất cả accounts |
| **CloudTrail Organization Trail** | Logging cho toàn org |
| **AWS Config** | Configuration recording cho compliance |

> [!IMPORTANT]
> Landing Zone cần **khoảng 60 phút** để thiết lập lần đầu. Sau khi xong, bạn có ngay môi trường multi-account sẵn sàng sử dụng.

---

## 3. Guardrails (Controls)

**Guardrails** (còn gọi là **Controls**) là các rules tự động đảm bảo môi trường AWS tuân thủ policies. Có **3 loại**:

### 3.1. Phân loại Guardrails

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Guardrails (Controls)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🚫 PREVENTIVE                                                      │   │
│  │  ───────────────────────────────────────────────────────────        │   │
│  │  Implemented via: SCPs / Declarative Policies                       │   │
│  │  Action: NGĂN CHẶN hành động trước khi xảy ra                      │   │
│  │  Example: "Không cho phép tạo S3 bucket không encrypt"              │   │
│  │  Status: Enforced / Not enabled                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 DETECTIVE                                                       │   │
│  │  ───────────────────────────────────────────────────────────        │   │
│  │  Implemented via: AWS Config Rules                                  │   │
│  │  Action: PHÁT HIỆN vi phạm sau khi xảy ra (alert)                  │   │
│  │  Example: "Phát hiện S3 bucket có public access"                    │   │
│  │  Status: Clear / In violation                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚡ PROACTIVE                                                       │   │
│  │  ───────────────────────────────────────────────────────────        │   │
│  │  Implemented via: CloudFormation Hooks                              │   │
│  │  Action: CHẶN resource creation nếu không comply                   │   │
│  │  Example: "Block CloudFormation stack nếu RDS không encrypt"       │   │
│  │  Status: Pass / Fail                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. So sánh 3 loại Guardrails

| Aspect | Preventive | Detective | Proactive |
|--------|-----------|-----------|-----------|
| **Cơ chế** | SCPs / Declarative Policies | AWS Config Rules | CloudFormation Hooks |
| **Thời điểm** | Trước khi action xảy ra | Sau khi resource tạo | Trước khi resource tạo (via CFN) |
| **Action** | Block API call | Alert + Report | Block CFN deployment |
| **Scope** | Tất cả API calls | Resources đã tạo | Chỉ CloudFormation |
| **Ví dụ** | Deny `s3:DeleteBucket` | Detect unencrypted EBS | Block non-compliant CFN stack |

### 3.3. Guardrail Behavior Categories

| Category | Mô tả | Ví dụ |
|----------|-------|-------|
| **Mandatory** | Bật sẵn, **KHÔNG thể tắt** | Không cho phép thay đổi Log Archive |
| **Strongly Recommended** | AWS khuyến nghị bật | Encrypt EBS volumes |
| **Elective** | Tùy chọn, bật khi cần | Restrict region access |

> [!NOTE]
> Khi bạn enable guardrail trên một OU, nó tự động **áp dụng cho tất cả accounts** trong OU đó (giống SCP inheritance).

---

## 4. Account Factory

**Account Factory** tự động hóa việc tạo và cấu hình AWS accounts mới tuân thủ best practices.

### 4.1. Account Factory hoạt động thế nào?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Account Factory                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Request New Account                                                        │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │  Input:                                               │                  │
│  │  • Account Name                                       │                  │
│  │  • Email (unique)                                     │                  │
│  │  • Target OU                                          │                  │
│  │  • IAM Identity Center config                         │                  │
│  │  • VPC configuration (optional)                       │                  │
│  └──────────────────────┬───────────────────────────────┘                  │
│                         │                                                   │
│                         ▼                                                   │
│  Automated Provisioning                                                     │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │  Control Tower automatically:                         │                  │
│  │  ✅ Creates AWS account                               │                  │
│  │  ✅ Applies guardrails from target OU                 │                  │
│  │  ✅ Sets up CloudTrail logging                        │                  │
│  │  ✅ Enables AWS Config recording                      │                  │
│  │  ✅ Configures IAM Identity Center access             │                  │
│  │  ✅ Creates VPC (if configured)                       │                  │
│  │  ✅ Baseline security settings                        │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Account Factory Methods

| Method | Mô tả | Use case |
|--------|-------|----------|
| **Console (Service Catalog)** | Tạo account qua AWS Service Catalog | Đơn giản, ít accounts |
| **Account Factory for Terraform (AFT)** | Terraform module tự động hóa | IaC, batch operations, GitOps |
| **APIs** | Programmatic account creation | CI/CD pipelines |

### 4.3. Account Factory for Terraform (AFT)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Account Factory for Terraform (AFT)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│  │ Git Repo    │ ──► │ Terraform   │ ──► │ Control     │                  │
│  │ (Account    │     │ Pipeline    │     │ Tower       │                  │
│  │  Requests)  │     │ (CodePipe)  │     │ (Provision) │                  │
│  └─────────────┘     └─────────────┘     └─────────────┘                  │
│                                                                             │
│  ✅ GitOps-driven (GitHub, GitLab, CodeCommit)                              │
│  ✅ Batch account creation                                                  │
│  ✅ Advanced customization (VPC deletion, CloudTrail data events)          │
│  ✅ Full Terraform pipeline integration                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Dashboards & Monitoring

### 5.1. Control Tower Dashboard

Control Tower cung cấp **dashboard tổng quan** để theo dõi:

| Dashboard Feature | Mô tả |
|---|---|
| **Compliance status** | Bao nhiêu accounts/OUs đang comply hoặc violating |
| **Enabled guardrails** | Danh sách guardrails đang active |
| **Account list** | Tất cả accounts trong Landing Zone |
| **Non-compliant resources** | Resources vi phạm guardrails |
| **Drift detection** | Phát hiện khi cấu hình bị thay đổi ngoài ý muốn |

### 5.2. Drift Detection

**Drift** xảy ra khi cấu hình Landing Zone bị thay đổi bên ngoài Control Tower:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Drift Examples                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ⚠️  Ai đó xóa OU qua AWS Organizations Console                            │
│  ⚠️  Ai đó sửa SCP mà Control Tower quản lý                                │
│  ⚠️  Ai đó xóa CloudTrail trail                                            │
│  ⚠️  Ai đó thay đổi cấu hình Log Archive account                           │
│                                                                             │
│  → Control Tower PHÁT HIỆN drift                                            │
│  → Alert trên Dashboard                                                     │
│  → Bạn có thể "Repair" để đưa về trạng thái đúng                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **Không nên thay đổi** các resources do Control Tower quản lý (SCPs, OUs, CloudTrail, Config) bên ngoài Control Tower Console. Luôn dùng Control Tower để quản lý.

---

## 6. So sánh với AWS Organizations

| Feature | AWS Organizations | AWS Control Tower |
|---|---|---|
| **Core Function** | Multi-account management framework | Automated landing zone + governance |
| **Setup** | Manual - bạn tự configure mọi thứ | Automated - best practices sẵn có |
| **SCPs / Guardrails** | Tự viết SCPs | Pre-built guardrails (400+ controls) |
| **Account Creation** | Manual qua Console/CLI | Account Factory tự động |
| **Compliance Monitoring** | Tự setup (Config, CloudTrail) | Built-in dashboard |
| **Drift Detection** | Không có | Tự động phát hiện |
| **Learning Curve** | Thấp hơn (but more DIY) | Cao hơn (but more automated) |
| **Flexibility** | Cao hơn (custom setup) | Thấp hơn (opinionated) |
| **Price** | FREE | FREE (trả tiền cho underlying services) |
| **Best For** | Custom, experienced teams | Rapid start, compliance-focused |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Relationship between Services                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              AWS CONTROL TOWER (Higher-Level)                       │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │           AWS ORGANIZATIONS (Foundation)                      │ │   │
│  │  │                                                               │ │   │
│  │  │  • Root, OUs, Accounts                                       │ │   │
│  │  │  • SCPs                                                       │ │   │
│  │  │  • Consolidated Billing                                       │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  + Landing Zone       + Account Factory                            │   │
│  │  + Guardrails         + Dashboard                                  │   │
│  │  + Drift Detection    + Blueprints                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Control Tower = Organizations + Automation + Best Practices               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> - Nếu bạn **mới bắt đầu** multi-account strategy → Dùng **Control Tower**
> - Nếu bạn cần **custom setup** hoặc đã có org lâu → Dùng **Organizations** trực tiếp
> - Control Tower **KHÔNG thay thế** Organizations, nó **xây dựng trên** Organizations

---

## 7. Pricing

| Feature | Cost |
|---|---|
| **AWS Control Tower** | **FREE** |
| **Underlying services** | Trả tiền bình thường |

Chi phí underlying services bao gồm:

| Service | Cost |
|---|---|
| **AWS Config** | Charges per configuration item recorded |
| **CloudTrail** | Organization trail (free for management events) |
| **S3** | Storage cho logs |
| **SNS** | Notifications |
| **AWS Service Catalog** | Free |

> [!NOTE]
> Bản thân Control Tower miễn phí. Bạn chỉ trả tiền cho các AWS services nó sử dụng bên dưới (chủ yếu là AWS Config recording và S3 log storage).

---

## 8. Exam Tips (SAA-C03)

1. **Control Tower** được xây dựng **trên nền tảng AWS Organizations** - không phải service riêng biệt hoàn toàn
2. **Landing Zone** = môi trường multi-account được thiết lập tự động theo best practices
3. **Guardrails** chia 3 loại: **Preventive** (SCPs), **Detective** (Config Rules), **Proactive** (CFN Hooks)
4. **Account Factory** = tự động tạo và configure accounts
5. Khi đề bài hỏi "cách **nhanh nhất** để set up compliant multi-account" → **Control Tower**
6. Khi đề bài hỏi "manage multi-account, consolidated billing, SCPs" → **Organizations**
7. Control Tower cung cấp **dashboard** để theo dõi compliance - Organizations thì không
8. **Drift detection** là tính năng chỉ có ở Control Tower

---

## 9. Tài liệu tham khảo

- [AWS Control Tower Documentation](https://docs.aws.amazon.com/controltower/)
- [AWS Control Tower User Guide](https://docs.aws.amazon.com/controltower/latest/userguide/)
- [Controls Reference Guide](https://docs.aws.amazon.com/controltower/latest/controlreference/)
- [Account Factory for Terraform (AFT)](https://docs.aws.amazon.com/controltower/latest/userguide/aft-overview.html)
- [AWS Organizations](aws-organizations.md) - Foundation service
