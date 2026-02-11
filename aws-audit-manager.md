# AWS Audit Manager


## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Kiến trúc & Workflow](#2-kiến-trúc--workflow)
- [3. Core Concepts](#3-core-concepts)
- [4. Prebuilt Frameworks](#4-prebuilt-frameworks)
- [5. Evidence Types](#5-evidence-types)
- [6. Tích hợp AWS Services](#6-tích-hợp-aws-services)
- [7. So sánh với các dịch vụ liên quan](#7-so-sánh-với-các-dịch-vụ-liên-quan)
- [8. Pricing](#8-pricing)
- [9. Exam Tips](#9-exam-tips)
- [10. Tài liệu tham khảo](#10-tài-liệu-tham-khảo)

---

## 1. Tổng quan

**AWS Audit Manager** là dịch vụ giúp bạn **tự động thu thập evidence** (bằng chứng) để đánh giá xem AWS resources có tuân thủ các tiêu chuẩn compliance hay không. Nó giúp **chuẩn bị audit** nhanh hơn, từ hàng tuần xuống còn vài phút.

### Audit Manager giải quyết vấn đề gì?

| Vấn đề truyền thống | Giải pháp với Audit Manager |
|---|---|
| Thu thập evidence thủ công → chậm, dễ sai | **Tự động thu thập** từ Config, CloudTrail, Security Hub |
| Không biết comply những gì | **30+ prebuilt frameworks** (GDPR, HIPAA, PCI DSS, SOC 2) |
| Audit reports mất nhiều tuần | **Assessment reports** tự động generate |
| Khó track compliance liên tục | **Continuous evidence** collection |
| Multi-account audit phức tạp | **Organizations integration** - collect across accounts |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AWS Audit Manager                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   "Continuously audit your AWS usage to simplify                            │
│    how you assess risk and compliance"                                      │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│   │  Prebuilt   │  │  Automated  │  │  Delegation  │  │  Assessment │      │
│   │  Frameworks │  │  Evidence   │  │  & Review    │  │  Reports    │      │
│   │             │  │  Collection │  │  Workflow    │  │             │      │
│   │  GDPR       │  │  Config     │  │  Assign to  │  │  Audit-     │      │
│   │  HIPAA      │  │  CloudTrail │  │  experts     │  │  ready      │      │
│   │  PCI DSS    │  │  Sec Hub    │  │  for review  │  │  reports    │      │
│   │  SOC 2      │  │  API calls  │  │              │  │             │      │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kiến trúc & Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Audit Manager Workflow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Choose Framework                                                   │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │  Prebuilt (GDPR, HIPAA, PCI DSS, SOC 2, ...)             │              │
│  │  hoặc Custom framework                                    │              │
│  └──────────────────────────┬─────────────────────────────────┘              │
│                             ▼                                               │
│  STEP 2: Create Assessment                                                  │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │  Chọn framework + AWS accounts + services trong scope     │              │
│  └──────────────────────────┬─────────────────────────────────┘              │
│                             ▼                                               │
│  STEP 3: Automated Evidence Collection                                      │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │              │
│  │  │ Config   │  │CloudTrail│  │ Sec Hub  │  │ API Calls│  │              │
│  │  │ Rules    │  │ Logs     │  │ Checks   │  │ Snapshots│  │              │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │              │
│  └──────────────────────────┬─────────────────────────────────┘              │
│                             ▼                                               │
│  STEP 4: Review & Delegate                                                  │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │  Delegate control sets → Subject matter experts review    │              │
│  │  Add comments, mark controls as reviewed                  │              │
│  └──────────────────────────┬─────────────────────────────────┘              │
│                             ▼                                               │
│  STEP 5: Generate Assessment Report                                         │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │  → Summary + organized evidence folders                   │              │
│  │  → Share with auditors                                    │              │
│  └────────────────────────────────────────────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Concepts

### 3.1. Thuật ngữ quan trọng

| Concept | Mô tả | Ví dụ |
|---|---|---|
| **Framework** | Bộ controls mapping tới compliance standard | GDPR framework, PCI DSS v4.0 |
| **Assessment** | Instance của framework áp dụng cho accounts/services | "PCI DSS assessment cho Prod account" |
| **Control Set** | Nhóm controls liên quan trong framework | "Data Protection" control set |
| **Control** | Một yêu cầu compliance cụ thể | "S3 buckets phải encrypt" |
| **Evidence** | Bằng chứng chứng minh comply hoặc không | Config snapshot, CloudTrail log |
| **Delegation** | Giao control set cho expert review | Delegate "Network Security" cho Security team |
| **Assessment Report** | Báo cáo tổng hợp cho auditor | PDF + evidence folders |

### 3.2. Framework Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Framework Types                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  📋 STANDARD FRAMEWORKS          │  │  ✏️  CUSTOM FRAMEWORKS           │ │
│  │  ──────────────────────────────  │  │  ──────────────────────────────  │ │
│  │                                  │  │                                  │ │
│  │  • Prebuilt bởi AWS              │  │  • Bạn tự tạo                    │ │
│  │  • 30+ frameworks có sẵn         │  │  • Customize controls            │ │
│  │  • Mapping theo industry std     │  │  • Map tới data sources          │ │
│  │  • Tự động update                │  │  • Kết hợp manual + automated    │ │
│  │                                  │  │                                  │ │
│  │  Ví dụ:                          │  │  Ví dụ:                          │ │
│  │  → GDPR, HIPAA, PCI DSS         │  │  → Internal security policy      │ │
│  │  → SOC 2, ISO 27001             │  │  → Custom compliance program     │ │
│  │  → CIS Benchmarks               │  │  → Hybrid on-prem + cloud        │ │
│  │  → NIST 800-53                   │  │                                  │ │
│  │  → AWS Best Practices            │  │                                  │ │
│  │  → Generative AI Best Practices  │  │                                  │ │
│  └──────────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Prebuilt Frameworks

| Framework | Focus | Controls |
|---|---|---|
| **GDPR** | EU data protection | Data privacy, consent, data subject rights |
| **HIPAA** | US healthcare data | PHI protection, access controls, audit trails |
| **PCI DSS v4.0** | Payment card data | Encryption, network security, access control |
| **SOC 2** | Service organization | Security, availability, processing integrity |
| **ISO 27001** | Information security | ISMS controls, risk management |
| **NIST 800-53** | US federal agencies | Security and privacy controls |
| **NIST CSF** | Cybersecurity | Identify, Protect, Detect, Respond, Recover |
| **CIS Benchmarks** | Security hardening | Configuration best practices |
| **AWS Best Practices** | AWS-specific | AWS Well-Architected alignment |
| **GxP (FDA 21 CFR Part 11)** | Life sciences | Electronic records, electronic signatures |
| **Generative AI Best Practices** | AI/ML | Responsible AI use, data governance |

> [!NOTE]
> Bạn có thể **customize** bất kỳ prebuilt framework nào, thêm/bớt controls, hoặc tạo framework hoàn toàn mới cho internal policies.

---

## 5. Evidence Types

### 5.1. Automated Evidence

| Evidence Type | Source | Ví dụ |
|---|---|---|
| **Compliance check** | AWS Config Rules, Security Hub | "S3 bucket encryption enabled: COMPLIANT" |
| **Configuration data** | AWS Config snapshots | EC2 instance configuration snapshot |
| **User activity** | CloudTrail logs | API calls showing who did what |
| **API-generated** | Direct API calls | Current state of resources |

### 5.2. Manual Evidence

| Type | Mô tả |
|---|---|
| **File upload** | Upload documents, policies, screenshots |
| **Plaintext** | Ghi chú, giải thích, manual observations |
| **On-premises evidence** | Evidence từ non-AWS environment |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Evidence Collection Flow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AWS Services                         Audit Manager                         │
│                                                                             │
│  ┌──────────────┐                     ┌─────────────────────────────────┐   │
│  │ AWS Config   │ ──── Rules ────►    │                                 │   │
│  └──────────────┘   compliance        │   Assessment                    │   │
│  ┌──────────────┐                     │                                 │   │
│  │ CloudTrail   │ ──── Logs ─────►    │   ┌──────────┐ ┌──────────┐    │   │
│  └──────────────┘   user activity     │   │Control 1 │ │Control 2 │    │   │
│  ┌──────────────┐                     │   │ Evidence │ │ Evidence │    │   │
│  │ Security Hub │ ──── Findings ──►   │   │ ✅ ✅ ❌  │ │ ✅ ✅ ✅  │    │   │
│  └──────────────┘   compliance        │   └──────────┘ └──────────┘    │   │
│  ┌──────────────┐                     │                                 │   │
│  │ Manual       │ ──── Upload ────►   │   → Assessment Report          │   │
│  │ Evidence     │                     │                                 │   │
│  └──────────────┘                     └─────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Tích hợp AWS Services

| Service | Vai trò trong Audit Manager |
|---|---|
| **AWS Config** | Evidence từ configuration changes và compliance rules |
| **AWS CloudTrail** | Evidence từ API activity logs |
| **AWS Security Hub** | Evidence từ security compliance checks |
| **AWS Organizations** | Multi-account evidence collection |
| **AWS KMS** | Encrypt assessment reports |
| **Amazon S3** | Store assessment reports và evidence |
| **AWS IAM** | Access control cho Audit Manager |

> [!IMPORTANT]
> Audit Manager **KHÔNG tự kiểm tra compliance**. Nó **thu thập evidence từ các services khác** (Config, Security Hub, CloudTrail) và **tổ chức thành assessment reports**. Config Rules và Security Hub mới là nơi kiểm tra compliance thực sự.

---

## 7. So sánh với các dịch vụ liên quan

| Feature | Audit Manager | AWS Config | Security Hub | AWS Artifact |
|---|---|---|---|---|
| **Chức năng chính** | Thu thập evidence, chuẩn bị audit | Record config changes, check rules | Aggregate security findings | Download compliance reports từ AWS |
| **Evidence collection** | ✅ Tự động | Là nguồn evidence | Là nguồn evidence | ❌ |
| **Frameworks** | ✅ 30+ prebuilt | ❌ (chỉ rules) | ✅ Security standards | ❌ |
| **Assessment reports** | ✅ Tạo reports cho auditor | ❌ | ❌ | ✅ AWS compliance certs |
| **Delegation workflow** | ✅ | ❌ | ❌ | ❌ |
| **Custom controls** | ✅ | ✅ (custom rules) | ✅ (custom insights) | ❌ |
| **Best for** | Chuẩn bị audit, compliance evidence | Real-time config compliance | Security posture management | Download AWS certs/reports |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    How they work together                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐  ┌────────────┐                                             │
│  │ AWS Config │  │ Security   │  ← Nguồn evidence (detect compliance)       │
│  │ Rules      │  │ Hub        │                                             │
│  └─────┬──────┘  └─────┬──────┘                                             │
│        │               │                                                    │
│        └───────┬───────┘                                                    │
│                ▼                                                            │
│  ┌──────────────────────┐                                                   │
│  │   AUDIT MANAGER      │  ← Thu thập, tổ chức, report                     │
│  │   (Assessment)       │                                                   │
│  └──────────┬───────────┘                                                   │
│             ▼                                                               │
│  ┌──────────────────────┐                                                   │
│  │  Assessment Report   │  ← Giao cho Auditor                              │
│  │  (S3)                │                                                   │
│  └──────────────────────┘                                                   │
│                                                                             │
│  ┌──────────────────────┐                                                   │
│  │   AWS Artifact       │  ← Riêng biệt: download AWS's OWN               │
│  │                      │    compliance certs (SOC, PCI, ISO)              │
│  └──────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **AWS Artifact** = download **AWS's compliance reports** (AWS chứng minh AWS comply)
> **AWS Audit Manager** = thu thập evidence cho **YOUR compliance** (bạn chứng minh bạn comply)

---

## 8. Pricing

| Component | Cost |
|---|---|
| **Resource assessments** | $1.25 per 100 resource assessments/tháng |
| **Free Tier** | Không có |

> [!NOTE]
> Một **resource assessment** = mỗi lần Audit Manager thu thập evidence cho 1 resource (ví dụ: check 1 S3 bucket compliance = 1 resource assessment). Chi phí phụ thuộc vào số lượng resources và tần suất thu thập.

---

## 9. Exam Tips

1. **Audit Manager** = "thu thập evidence tự động để chuẩn bị audit" → chọn khi đề nói "streamline audit preparation" hoặc "collect compliance evidence"
2. **Audit Manager ≠ AWS Artifact**: Audit Manager = YOUR compliance evidence, Artifact = AWS's compliance certs
3. **Frameworks**: 30+ prebuilt (GDPR, HIPAA, PCI DSS, SOC 2) + custom frameworks
4. Evidence sources: **AWS Config** + **CloudTrail** + **Security Hub** + manual upload
5. Hỗ trợ **multi-account** qua AWS Organizations
6. Audit Manager **KHÔNG enforce compliance** - chỉ **collect evidence**. Config Rules và SCPs mới enforce
7. Khi đề nói "continuous compliance monitoring" → có thể là **Config** hoặc **Security Hub**. Khi nói "prepare for audit" → **Audit Manager**
8. Supports **delegation workflow** - giao controls cho team members review

---

## 10. Tài liệu tham khảo

- [AWS Audit Manager Documentation](https://docs.aws.amazon.com/audit-manager/)
- [AWS Audit Manager Features](https://aws.amazon.com/audit-manager/features/)
- [AWS Audit Manager Pricing](https://aws.amazon.com/audit-manager/pricing/)
- [Prebuilt Frameworks List](https://docs.aws.amazon.com/audit-manager/latest/userguide/framework-overviews.html)
- [AWS Config](aws-config.md) - Nguồn evidence chính
- [AWS Artifact](aws-artifact.md) - So sánh: AWS's compliance reports
