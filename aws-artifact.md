# AWS Artifact

## Mục lục

- [Tổng quan](#tổng-quan)
- [Hai thành phần chính](#hai-thành-phần-chính)
- [Compliance Reports](#compliance-reports)
- [Agreements](#agreements)
- [Cách sử dụng](#cách-sử-dụng)
- [So sánh với các services khác](#so-sánh-với-các-services-khác)
- [Exam Tips](#exam-tips)

---

## Tổng quan

**AWS Artifact** = **Compliance document portal** - Nơi download các tài liệu compliance và security của AWS.

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS ARTIFACT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 AWS Artifact = "Thư viện compliance documents của AWS"      │
│                                                                 │
│  Bạn có thể:                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  📄 Download AWS compliance REPORTS                     │    │
│  │     • SOC reports                                       │    │
│  │     • PCI DSS reports                                   │    │
│  │     • ISO certifications                                │    │
│  │     • HIPAA documentation                               │    │
│  │                                                         │    │
│  │  📝 Accept/manage AGREEMENTS                            │    │
│  │     • HIPAA BAA (Business Associate Addendum)           │    │
│  │     • GDPR DPA (Data Processing Addendum)               │    │
│  │     • Australian Privacy Act                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  💰 Cost: FREE (included in AWS account)                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hai thành phần chính

### 1. AWS Artifact Reports

**Reports** = Tài liệu chứng nhận compliance của AWS từ third-party auditors.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARTIFACT REPORTS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dùng khi: "Tôi cần chứng minh AWS đã được certify"             │
│                                                                 │
│  Download được:                                                 │
│  • SOC 1, SOC 2, SOC 3 reports                                  │
│  • PCI DSS Attestation of Compliance                            │
│  • ISO 27001, 27017, 27018 certifications                       │
│  • FedRAMP reports                                              │
│  • HIPAA compliance documentation                               │
│  • And 50+ more compliance reports...                           │
│                                                                 │
│  Use case:                                                      │
│  → Auditor yêu cầu: "AWS có SOC 2 report không?"                │
│  → Vào Artifact → Download SOC 2 report → Gửi cho auditor       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. AWS Artifact Agreements

**Agreements** = Các thỏa thuận pháp lý giữa bạn và AWS.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARTIFACT AGREEMENTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dùng khi: "Tôi cần ký thỏa thuận compliance với AWS"           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  🏥 HIPAA BAA (Business Associate Addendum)             │    │
│  │     • Bắt buộc nếu xử lý PHI (Protected Health Info)    │    │
│  │     • Accept trong Artifact → Được dùng HIPAA services  │    │
│  │                                                         │    │
│  │  🇪🇺 GDPR DPA (Data Processing Addendum)                 │    │
│  │     • Cho EU data protection requirements               │    │
│  │                                                         │    │
│  │  🇦🇺 Australian Privacy Act                              │    │
│  │     • Cho Australian privacy requirements               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Có thể accept cho:                                             │
│  • Single account                                               │
│  • All accounts trong AWS Organization                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Compliance Reports

### Các reports phổ biến

| Report | Mô tả | Ai cần? |
|--------|-------|---------|
| **SOC 1** | Financial controls | Auditors, Finance teams |
| **SOC 2** | Security, Availability, Confidentiality | Security teams, Customers |
| **SOC 3** | Public summary of SOC 2 | Marketing, Public disclosure |
| **PCI DSS** | Payment card security | E-commerce, Payment processing |
| **ISO 27001** | Information security management | Enterprise compliance |
| **HIPAA** | Healthcare data protection | Healthcare organizations |
| **FedRAMP** | US Government cloud security | Government contractors |

---

## Agreements

### HIPAA BAA (Business Associate Addendum)

```
┌─────────────────────────────────────────────────────────────────┐
│                      HIPAA BAA                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 HIPAA = Health Insurance Portability and Accountability Act │
│  🏥 PHI = Protected Health Information (dữ liệu bệnh nhân)      │
│                                                                 │
│  Nếu bạn xử lý PHI trên AWS:                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  1. Vào AWS Artifact                                    │    │
│  │  2. Tìm HIPAA BAA                                       │    │
│  │  3. Review và Accept agreement                          │    │
│  │  4. Chỉ dùng HIPAA-eligible services                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ⚠️ QUAN TRỌNG:                                                  │
│  • Không phải TẤT CẢ AWS services đều HIPAA-eligible            │
│  • Phải check danh sách HIPAA-eligible services                 │
│  • Common eligible: S3, EC2, RDS, Lambda, DynamoDB, etc.        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cách sử dụng

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOW TO USE ARTIFACT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AWS Console → AWS Artifact                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  📂 Reports                                             │    │
│  │  └─ Browse → Select report → Download PDF                │   │
│  │                                                         │    │
│  │  📝 Agreements                                          │    │
│  │  └─ Browse → Select agreement → Review → Accept          │   │
│  │                                                         │    │
│  │  🏢 Organization Agreements (nếu dùng AWS Orgs)         │    │
│  │  └─ Accept for ALL accounts trong organization           │   │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Permissions needed: IAM policy với artifact:* permissions      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## So sánh với các services khác

| Câu hỏi | Service | Giải thích |
|---------|---------|------------|
| "Download AWS compliance documents" | **AWS Artifact** | Download reports từ AWS |
| "Check if MY resources comply" | **AWS Config** | Evaluate YOUR config rules |
| "Get best practice recommendations" | **AWS Trusted Advisor** | Recommendations, không phải docs |
| "Scan for vulnerabilities" | **AWS Inspector** | Vulnerability scanning |
| "View audit logs" | **AWS CloudTrail** | API activity logs |

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHÂN BIỆT QUAN TRỌNG                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AWS Artifact:                                                  │
│  → "AWS's compliance documentation" (của AWS)                   │
│  → Download để chứng minh AWS đã comply                         │
│                                                                 │
│  AWS Config:                                                    │
│  → "Your resources' compliance" (của BẠN)                       │
│  → Check xem resources của bạn có đúng config không             │
│                                                                 │
│  AWS Audit Manager:                                             │
│  → "Your compliance audits" (của BẠN)                           │
│  → Automate collecting evidence cho audits                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips

> [!IMPORTANT]
> AWS Artifact = **Download AWS compliance documents**. Nhớ keyword: "compliance reports", "certifications", "agreements", "HIPAA BAA"

### Câu hỏi thường gặp

| Keyword trong câu hỏi | Đáp án |
|-----------------------|--------|
| "Download compliance reports" | AWS Artifact |
| "Review AWS certifications" | AWS Artifact |
| "HIPAA BAA agreement" | AWS Artifact |
| "SOC reports" | AWS Artifact |
| "PCI DSS attestation" | AWS Artifact |

### Key Points

- **FREE** - Included with AWS account
- **Self-service** - Download anytime
- **Two components**: Reports (download) + Agreements (accept)
- **Organization-wide** - Can accept agreements for all accounts
- **Third-party audited** - Reports from independent auditors

---

## Tài liệu tham khảo

- [AWS Artifact](https://aws.amazon.com/artifact/)
- [AWS Compliance Programs](https://aws.amazon.com/compliance/programs/)
- [HIPAA-eligible Services](https://aws.amazon.com/compliance/hipaa-eligible-services-reference/)
