# Amazon Inspector


## Mục lục

- [Tổng quan](#tổng-quan)
- [Scan Targets](#scan-targets)
- [Đặc điểm chính](#đặc-điểm-chính)
- [Yêu cầu cho EC2 Scanning](#yêu-cầu-cho-ec2-scanning)
- [Integration với AWS Organizations](#integration-với-aws-organizations)
- [Integration với các Services khác](#integration-với-các-services-khác)
- [Amazon Inspector vs Các Services Khác](#amazon-inspector-vs-các-services-khác)
- [Pricing](#pricing)
- [Use Cases](#use-cases)
- [Tóm tắt](#tóm-tắt)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Amazon Inspector** là dịch vụ **vulnerability management** tự động phát hiện và quét workloads để tìm:
- **Software vulnerabilities** (CVEs)
- **Unintended network exposure**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Amazon Inspector                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   "Tự động tìm lỗ hổng bảo mật trong EC2, Container Images, Lambda"         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     Scan Targets                                    │   │
│   │                                                                     │   │
│   │   ┌──────────┐     ┌──────────┐     ┌──────────┐                    │   │
│   │   │   EC2    │     │   ECR    │     │  Lambda  │                    │   │
│   │   │Instances │     │  Images  │     │Functions │                    │   │
│   │   │          │     │          │     │          │                    │   │
│   │   │ • OS     │     │ • Docker │     │ • Code   │                    │   │
│   │   │ • Apps   │     │ • Base   │     │ • Deps   │                    │   │
│   │   │ • Network│     │   image  │     │          │                    │   │
│   │   └────┬─────┘     └────┬─────┘     └────┬─────┘                    │   │
│   │        │                │                │                          │   │
│   │        └────────────────┼────────────────┘                          │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │              ┌─────────────────────┐                                │   │
│   │              │  Amazon Inspector   │                                │   │
│   │              │                     │                                │   │
│   │              │  • Scan for CVEs    │                                │   │
│   │              │  • Network exposure │                                │   │
│   │              │  • Generate findings│                                │   │
│   │              └──────────┬──────────┘                                │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │              ┌─────────────────────┐                                │   │
│   │              │     Findings        │                                │   │
│   │              │  (Vulnerabilities)  │                                │   │
│   │              └─────────────────────┘                                │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Scan Targets

Amazon Inspector có thể scan 3 loại resources:

| Target | Scan gì? | Cách hoạt động |
|--------|----------|----------------|
| **EC2 Instances** | OS vulnerabilities, software packages, network exposure | Cần SSM Agent |
| **ECR Images** | Container image vulnerabilities | Scan khi push image |
| **Lambda Functions** | Code dependencies, vulnerabilities | Scan function code + layers |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     What Inspector Scans                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  EC2 Instances:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  • Operating system packages (rpm, dpkg, etc.)                      │    │
│  │  • Application dependencies                                         │    │
│  │  • Network reachability (open ports, security groups)               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ECR Container Images:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  • Base image vulnerabilities                                       │    │
│  │  • OS packages trong image                                          │    │
│  │  • Application dependencies (npm, pip, maven, etc.)                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Lambda Functions:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  • Function code dependencies                                       │    │
│  │  • Lambda layers                                                    │    │
│  │  • Package vulnerabilities                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Đặc điểm chính

### 1. Continuous Scanning (Tự động, liên tục)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Continuous Scanning                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CẦN schedule scan thủ công!                                          │
│                                                                             │
│  Inspector tự động rescan khi:                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  ✅ Cài package mới trên EC2                                        │    │
│  │  ✅ Push image mới lên ECR                                          │    │
│  │  ✅ Deploy Lambda function mới                                      │    │
│  │  ✅ CVE mới được publish                                            │    │
│  │  ✅ Có thay đổi network config                                      │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Amazon Inspector Score (CVSS-based)

Inspector tính toán **risk score** dựa trên:
- CVE severity từ National Vulnerability Database (NVD)
- **Điều chỉnh theo môi trường của bạn**

```
Ví dụ:
  CVE-2023-XXXX có CVSS base score: 9.8 (Critical)
  
  Nhưng nếu EC2 instance:
    → Không có internet access
    → Nằm trong private subnet
    → Không expose ports
  
  → Inspector Score có thể THẤP HƠN vì exploit khó hơn
```

### 3. Findings

Khi phát hiện vulnerability, Inspector tạo **Finding** với:

| Thông tin | Mô tả |
|-----------|-------|
| **Severity** | Critical, High, Medium, Low, Informational |
| **Inspector Score** | CVSS-based score (0-10) |
| **Resource Details** | Instance ID, Image URI, Function ARN |
| **Vulnerability Details** | CVE ID, description |
| **Remediation** | Cách fix (update package, patch, etc.) |

---

## Yêu cầu cho EC2 Scanning

Để Inspector scan được EC2 instances:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   EC2 Scanning Requirements                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. SSM Agent phải được cài và running                                     │
│      → Hầu hết AMIs đã có sẵn                                               │
│                                                                             │
│   2. Instance phải là "Managed Instance" của SSM                            │
│      → Cần IAM role với AmazonSSMManagedInstanceCore                        │
│                                                                             │
│   3. Instance phải có network connectivity đến SSM endpoint                 │
│      → Qua internet hoặc VPC endpoint                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Inspector dùng SSM Agent** để scan EC2 instances. Nếu instance không phải managed node của SSM → Inspector không scan được!

---

## Integration với AWS Organizations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Multi-Account Management                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────┐                                                   │
│   │  Management Account │                                                   │
│   │                     │                                                   │
│   │  Delegate Inspector │                                                   │
│   │  to Security Account│                                                   │
│   └──────────┬──────────┘                                                   │
│              │                                                              │
│              ▼                                                              │
│   ┌─────────────────────┐                                                   │
│   │  Delegated Admin    │  ← Security Team account                          │
│   │  (Security Account) │                                                   │
│   │                     │                                                   │
│   │  • View all findings│                                                   │
│   │  • Enable/disable   │                                                   │
│   │    scans            │                                                   │
│   │  • Aggregate reports│                                                   │
│   └──────────┬──────────┘                                                   │
│              │                                                              │
│              ▼                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     Member Accounts                                 │   │
│   │                                                                     │   │
│   │   Account A    Account B    Account C    Account D                  │   │
│   │   (scanned)    (scanned)    (scanned)    (scanned)                  │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration với các Services khác

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Inspector Integrations                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Amazon Inspector                                                          │
│        │                                                                    │
│        ├──────────► AWS Security Hub                                        │
│        │            → Aggregate findings với GuardDuty, Config, etc.        │
│        │                                                                    │
│        ├──────────► Amazon EventBridge                                      │
│        │            → Trigger Lambda, SNS khi có new finding                │
│        │                                                                    │
│        └──────────► S3                                                      │
│                     → Export findings reports                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ví dụ: Auto-remediate với EventBridge

```
Finding → EventBridge → Lambda → SSM Run Command → Patch instance
                                    ↓
                              "yum update -y package-name"
```

---

## Amazon Inspector vs Các Services Khác

| Service | Mục đích | Khác biệt |
|---------|----------|-----------|
| **Amazon Inspector** | Vulnerability scanning (CVEs) | Scan software vulnerabilities |
| **Amazon GuardDuty** | Threat detection | Phát hiện tấn công đang xảy ra |
| **AWS Config** | Configuration compliance | Check cấu hình đúng rules không |
| **Security Hub** | Aggregate security findings | Tổng hợp từ nhiều services |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Security Services Positioning                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   TRƯỚC (Prevention):                                                       │
│   → Inspector: "Có lỗ hổng nào không?" (vulnerability)                      │
│   → Config: "Cấu hình đúng chưa?" (configuration)                           │
│                                                                             │
│   TRONG (Detection):                                                        │
│   → GuardDuty: "Có ai đang tấn công không?" (threat)                        │
│                                                                             │
│   SAU (Response):                                                           │
│   → Security Hub: "Tổng hợp mọi thứ, action tiếp" (aggregate)               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pricing

Amazon Inspector định giá theo số lượng resources được scan:

| Resource Type | Pricing |
|--------------|---------|
| **EC2 instances** | ~$1.25/instance/month |
| **ECR images** | $0.09/image scanned |
| **Lambda functions** | $0.30/function/month |

> [!TIP]
> - First 15 instances: FREE tier (30 days)
> - Pricing có thể thay đổi theo region

---

## Use Cases

### 1. CI/CD Pipeline Security

```
Developer push code
        ↓
Build Docker image
        ↓
Push to ECR
        ↓
Inspector scans image ← AUTO
        ↓
If Critical CVE found → Block deployment
        ↓
If no issues → Deploy to ECS/EKS
```

### 2. Compliance Reporting

```
Inspector scans all EC2 instances
        ↓
Aggregate findings về Security Hub
        ↓
Generate compliance reports
        ↓
Prove to auditors: "Chúng tôi đang monitor vulnerabilities"
```

### 3. Automated Patching

```
Inspector finds CVE in EC2
        ↓
EventBridge event
        ↓
Trigger Systems Manager Automation
        ↓
Auto-patch instance
        ↓
Inspector re-scan → Finding closed
```

---

## Tóm tắt

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Amazon Inspector Summary                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎯 WHAT: Vulnerability management service                                  │
│                                                                             │
│  📍 SCANS:                                                                  │
│     • EC2 instances (OS, packages, network)                                 │
│     • ECR container images                                                  │
│     • Lambda functions                                                      │
│                                                                             │
│  ⚡ KEY FEATURES:                                                            │
│     • Continuous scanning (không cần schedule)                              │
│     • Context-aware scoring (Inspector Score)                               │
│     • Multi-account với Organizations                                       │
│     • Integration với Security Hub, EventBridge                             │
│                                                                             │
│  🔧 REQUIREMENTS:                                                           │
│     • EC2: SSM Agent + Managed Instance                                     │
│     • ECR: Enable scanning in repository settings                           │
│     • Lambda: Enable in Inspector                                           │
│                                                                             │
│  💡 REMEMBER:                                                               │
│     • Inspector = "Có lỗ hổng nào không?" (preventive)                      │
│     • GuardDuty = "Có ai đang tấn công không?" (detective)                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [Amazon Inspector User Guide](https://docs.aws.amazon.com/inspector/latest/user/)
- [Scanning Amazon EC2 instances](https://docs.aws.amazon.com/inspector/latest/user/scanning-ec2.html)
- [ECR Image Scanning](https://docs.aws.amazon.com/inspector/latest/user/scanning-ecr.html)
- [Lambda Function Scanning](https://docs.aws.amazon.com/inspector/latest/user/scanning-lambda.html)
