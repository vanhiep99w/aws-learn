# AWS Policies & Compliance (For Cloud Practitioner)


## Mục lục

- [Tổng quan](#tổng-quan)
- [AWS Acceptable Use Policy (AUP)](#aws-acceptable-use-policy-aup)
- [Penetration Testing Policy](#penetration-testing-policy)
- [AWS Artifact](#aws-artifact)
- [Compliance Programs](#compliance-programs)
- [Shared Responsibility Model (Liên quan)](#shared-responsibility-model-liên-quan)
- [AWS Support Plans](#aws-support-plans)
- [AWS Abuse Team](#aws-abuse-team)
- [Exam Tips - Câu hỏi thường gặp](#exam-tips-câu-hỏi-thường-gặp)
- [AWS Partner Network (APN)](#aws-partner-network-apn)
- [Tổng kết](#tổng-kết)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

Phần này thuộc **Domain 3: Security and Compliance (30%)** của AWS Cloud Practitioner exam.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  AWS Legal & Compliance Documents                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Core Documents                                   │   │
│   │                                                                     │   │
│   │   📋 AWS Customer Agreement                                         │   │
│   │      → Hợp đồng chính giữa bạn và AWS                               │   │
│   │                                                                     │   │
│   │   📋 AWS Acceptable Use Policy (AUP)                                │   │
│   │      → Những gì ĐƯỢC và KHÔNG ĐƯỢC làm trên AWS                     │   │
│   │                                                                     │   │
│   │   📋 AWS Service Terms                                              │   │
│   │      → Điều khoản cụ thể cho từng service                           │   │
│   │                                                                     │   │
│   │   📋 AWS Privacy Policy                                             │   │
│   │      → Cách AWS xử lý data của bạn                                  │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## AWS Acceptable Use Policy (AUP)

### Định nghĩa

**AWS Acceptable Use Policy** là document định nghĩa những hoạt động **ĐƯỢC PHÉP** và **BỊ CẤM** khi sử dụng AWS services.

### Những điều BỊ CẤM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROHIBITED ACTIVITIES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🚫 ILLEGAL ACTIVITIES:                                                    │
│   ─────────────────────────────────────────────────────────                 │
│   • Hoạt động vi phạm pháp luật                                             │
│   • Child sexual abuse material (CSAM)                                      │
│   • Fraud, identity theft                                                   │
│   • Money laundering                                                        │
│                                                                             │
│   🚫 SECURITY VIOLATIONS:                                                   │
│   ─────────────────────────────────────────────────────────                 │
│   • Unauthorized access to systems (hacking)                                │
│   • Distribute malware, viruses                                             │
│   • Phishing attacks                                                        │
│   • Credential harvesting                                                   │
│                                                                             │
│   🚫 NETWORK ABUSE:                                                         │
│   ─────────────────────────────────────────────────────────                 │
│   • Spam / Unsolicited bulk email                                           │
│   • DDoS attacks                                                            │
│   • DNS hijacking                                                           │
│   • Port scanning without authorization                                     │
│                                                                             │
│   🚫 HARM TO AWS INFRASTRUCTURE:                                            │
│   ─────────────────────────────────────────────────────────                 │
│   • Làm gián đoạn AWS services                                              │
│   • Harm other AWS customers                                                │
│   • Overwhelm AWS resources                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Vi phạm thì sao?

| Hành động AWS có thể làm |
|--------------------------|
| Suspend account |
| Terminate account |
| Remove content |
| Report to law enforcement |

---

## Penetration Testing Policy

### Những gì ĐƯỢC PHÉP (không cần xin phép)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Permitted Penetration Testing Services                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ✅ Bạn ĐƯỢC PHÉP pen test các services sau MÀ KHÔNG CẦN xin phép AWS:     │
│                                                                             │
│   • Amazon EC2 instances                                                    │
│   • Amazon RDS                                                              │
│   • Amazon Aurora                                                           │
│   • Amazon CloudFront                                                       │
│   • Amazon API Gateway                                                      │
│   • AWS Lambda                                                              │
│   • AWS Lightsail                                                           │
│   • Amazon Elastic Beanstalk                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Những gì LUÔN BỊ CẤM

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Always Prohibited Activities                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🚫 LUÔN BỊ CẤM (dù có xin phép cũng không được):                           │
│                                                                              │
│   • DNS zone walking via Route 53                                            │
│   • DDoS attacks / simulations                                               │
│   • Port flooding                                                            │
│   • Protocol flooding                                                        │
│   • Request flooding                                                         │
│                                                                              │
│   ⚠️ LƯU Ý:                                                                  │
│   • Chỉ được test trên resources CỦA MÌNH                                    │
│   • Không được làm ảnh hưởng đến customers khác                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Exam hay hỏi**: "Muốn pen test EC2, cần làm gì?"
> → **KHÔNG cần xin phép AWS** (nằm trong danh sách permitted)

---

## AWS Artifact

**AWS Artifact** là service cung cấp **on-demand access** đến AWS **compliance reports** và **agreements**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS Artifact                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   📋 ARTIFACT REPORTS:                                                      │
│   ─────────────────────────────────────────                                 │
│   Download compliance reports từ third-party auditors                       │
│                                                                             │
│   • SOC 1, SOC 2, SOC 3 reports                                             │
│   • PCI DSS reports                                                         │
│   • ISO certifications (27001, 27017, 27018)                                │
│   • FedRAMP reports                                                         │
│   • HIPAA reports                                                           │
│                                                                             │
│   📋 ARTIFACT AGREEMENTS:                                                   │
│   ─────────────────────────────────────────                                 │
│   Review và accept agreements với AWS                                       │
│                                                                             │
│   • Business Associate Agreement (BAA) - for HIPAA                          │
│   • GDPR Data Processing Agreement                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Use Cases

| Scenario | Dùng Artifact để |
|----------|------------------|
| Auditor yêu cầu AWS SOC 2 report | Download từ Artifact Reports |
| Cần comply với HIPAA | Sign BAA qua Artifact Agreements |
| Cần chứng minh AWS có ISO 27001 | Download ISO certification |

> [!TIP]
> **Exam hay hỏi**: "Làm sao để lấy AWS compliance reports?"
> → **AWS Artifact**

---

## Compliance Programs

AWS tuân thủ nhiều compliance programs:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AWS Compliance Programs                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🏥 HEALTHCARE:                                                             │
│   • HIPAA (US healthcare data protection)                                    │
│                                                                              │
│   💳 PAYMENT:                                                                │
│   • PCI DSS (Payment Card Industry)                                          │
│                                                                              │
│   🏛️ GOVERNMENT:                                                             │
│   • FedRAMP (US Federal)                                                     │
│   • GovCloud (US Government workloads)                                       │
│                                                                              │
│   🌍 DATA PROTECTION:                                                        │
│   • GDPR (EU data protection)                                                │
│   • SOC 1, SOC 2, SOC 3                                                      │
│                                                                              │
│   🔐 SECURITY:                                                               │
│   • ISO 27001, 27017, 27018                                                  │
│   • CSA STAR                                                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Shared Responsibility Model (Liên quan)

Hiểu rõ ai chịu trách nhiệm gì:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Shared Responsibility Model                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║                    CUSTOMER RESPONSIBILITY                             ║│
│   ║                    (Security IN the Cloud)                             ║│
│   ╠═══════════════════════════════════════════════════════════════════════╣ │
│   ║  • Customer Data                                                       ║│
│   ║  • Platform, Applications, IAM                                         ║│
│   ║  • Operating System, Network, Firewall Configuration                  ║ │
│   ║  • Client-side Encryption                                              ║│
│   ║  • Tuân thủ Acceptable Use Policy                                      ║│
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║                    AWS RESPONSIBILITY                                  ║│
│   ║                    (Security OF the Cloud)                             ║│
│   ╠═══════════════════════════════════════════════════════════════════════╣ │
│   ║  • Hardware/AWS Global Infrastructure                                  ║│
│   ║  • Regions, Availability Zones, Edge Locations                        ║ │
│   ║  • Compute, Storage, Database, Networking (Hardware)                  ║ │
│   ║  • Physical security of data centers                                   ║│
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## AWS Support Plans

AWS cung cấp **5 Support Plans** với các mức độ hỗ trợ khác nhau:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS SUPPORT PLANS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    Enterprise ───▶ $15,000+/tháng  │ Designated TAM, 15-min critical        │
│         ↑                                                                   │
│    Enterprise On-Ramp ───▶ $5,500+/tháng │ TAM pool, 30-min critical        │
│         ↑                                                                   │
│    Business ───▶ $100+/tháng │ 24/7 support, 1-hour urgent                  │
│         ↑                                                                   │
│    Developer ───▶ $29+/tháng │ Email only, business hours                   │
│         ↑                                                                   │
│    Basic ───▶ FREE │ Documentation, forums only                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Bảng so sánh tổng hợp

| Feature | Basic | Developer | Business | Enterprise On-Ramp | Enterprise |
|---------|:-----:|:---------:|:--------:|:-----------------:|:----------:|
| **Giá/tháng** | FREE | $29+ | $100+ | $5,500+ | $15,000+ |
| **Ai mở case** | ❌ | 1 người | Unlimited | Unlimited | Unlimited |
| **Kênh hỗ trợ** | Docs, Forums | Email | 24/7 Phone/Chat/Email | 24/7 Phone/Chat/Email | 24/7 Phone/Chat/Email |
| **Trusted Advisor** | 7 core checks | 7 core checks | ✅ Full | ✅ Full | ✅ Full |
| **Third-party software** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Contextual architecture** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **TAM** | ❌ | ❌ | ❌ | Pool of TAMs | Designated TAM |
| **Concierge Support** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Infrastructure Event Mgmt** | ❌ | ❌ | ❌ | 1/year | Unlimited |

### Response Time

| Severity | Developer | Business | Ent. On-Ramp | Enterprise |
|----------|:---------:|:--------:|:------------:|:----------:|
| General guidance | 24 biz hrs | 24 hrs | 24 hrs | 24 hrs |
| System impaired | 12 biz hrs | 12 hrs | 12 hrs | 12 hrs |
| Production down | ❌ | **4 hrs** | **4 hrs** | **4 hrs** |
| Production critical | ❌ | **1 hr** | **1 hr** | **1 hr** |
| Business-critical down | ❌ | ❌ | **30 min** | **15 min** |

### Key Features giải thích

#### 1. Third-party Software Support (Business+)

Hỗ trợ configuration và troubleshooting AWS **interoperability** với phần mềm bên thứ 3:

| Category | Examples |
|----------|----------|
| OS | Ubuntu, RHEL, Windows Server |
| Web/DB | Apache, Nginx, MySQL, PostgreSQL |
| Containers | Docker, Kubernetes |

#### 2. Architectural Guidance

| Plan | Level |
|------|-------|
| Basic | ❌ Chỉ documentation |
| Developer | General guidance (chung chung) |
| **Business+** | ✅ **Contextual** - tư vấn cho use-case CỤ THỂ của bạn |
| Enterprise | ✅ Proactive guidance từ **designated TAM** |

#### 3. Trusted Advisor

| Plan | Access |
|------|--------|
| Basic/Developer | 7 core checks only |
| **Business+** | ✅ Full checks + API access + CloudWatch integration |

#### 4. TAM vs Concierge Support Team

**TAM** và **Concierge** là **2 team hoàn toàn khác nhau** trong Enterprise Support:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              ENTERPRISE SUPPORT - 2 TEAMS KHÁC NHAU                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TAM (Technical Account Manager)                                        │
│  ════════════════════════════════                                       │
│  • Designated technical expert                                          │
│  • Architecture reviews                                                 │
│  • Operational best practices                                           │
│  • Infrastructure event management                                      │
│  • Proactive technical guidance                                         │
│                                                                         │
│  Concierge Support Team                                                 │
│  ══════════════════════════                                             │
│  • Billing và payment questions                                         │
│  • Account issues                                                       │
│  • Service limits increases                                             │
│  • Cost optimization tips                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

| Đặc điểm | TAM | Concierge |
|----------|-----|-----------|
| **Chuyên môn** | Technical (Kỹ thuật) | Billing & Account (Non-technical) |
| **Hỗ trợ về** | Architecture, troubleshooting, optimization | Billing, account issues, cost tips |
| **Có trong plan** | Enterprise On-Ramp+ | Enterprise On-Ramp+ |

> [!TIP]
> **Exam Tip**: Câu hỏi về **technical issues, architecture** → **TAM**. Câu hỏi về **billing, account, payment** → **Concierge**.

### Exam Tips - Chọn plan nào?

| Yêu cầu | Plan cần |
|---------|----------|
| Third-party software support | **Business+** |
| Contextual architectural guidance | **Business+** |
| Full Trusted Advisor | **Business+** |
| Technical Account Manager (TAM) | **Enterprise On-Ramp+** |
| 15-minute critical response | **Enterprise** only |
| Designated TAM (không phải pool) | **Enterprise** only |

---

## AWS Abuse Team

Khi phát hiện resources của bạn bị abuse (spam, attack) hoặc bạn là victim:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS Abuse Team                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   📧 Contact: abuse@amazonaws.com                                           │
│                                                                             │
│   Report các trường hợp:                                                    │
│   • Spam từ AWS resources                                                   │
│   • Port scanning                                                           │
│   • DDoS attacks                                                            │
│   • Hosting illegal content                                                 │
│   • Malware distribution                                                    │
│                                                                             │
│   🔄 Process:                                                               │
│   1. Report to AWS Abuse Team                                               │
│   2. AWS investigates                                                       │
│   3. AWS takes action (warning, suspend, terminate)                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips - Câu hỏi thường gặp

### Câu hỏi về Policies

| Câu hỏi | Đáp án |
|---------|--------|
| "Document nào định nghĩa những gì không được làm trên AWS?" | **Acceptable Use Policy** |
| "Muốn lấy AWS SOC 2 report?" | **AWS Artifact** |
| "Muốn pen test EC2, cần làm gì?" | **Không cần xin phép** (permitted service) |
| "DDoS simulation có được không?" | **KHÔNG, luôn bị cấm** |
| "Cần sign HIPAA BAA với AWS?" | **AWS Artifact Agreements** |
| "Report spam từ AWS IP?" | **AWS Abuse Team** |

### Câu hỏi về Compliance

| Câu hỏi | Đáp án |
|---------|--------|
| "AWS có HIPAA compliant không?" | **Có** (với BAA qua Artifact) |
| "Làm sao biết AWS có certifications nào?" | **AWS Artifact** |
| "Ai chịu trách nhiệm patch OS trên EC2?" | **Customer** |
| "Ai chịu trách nhiệm physical security?" | **AWS** |

---

## AWS Partner Network (APN)

**APN** = **AWS Partner Network** - Chương trình đối tác chính thức của AWS.

### Tại sao cần APN?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Tại sao cần APN?                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Tình huống: Bạn là công ty ABC, muốn dùng AWS nhưng...                    │
│                                                                             │
│   😰 "Chúng tôi không biết gì về AWS!"                                      │
│   😰 "Không có người để build infrastructure!"                              │
│   😰 "Muốn migrate từ on-premises lên cloud nhưng không biết làm!"          │
│                                                                             │
│   → Giải pháp: Thuê CONSULTING PARTNER (công ty tư vấn)                     │
│     Họ sẽ giúp bạn design, build, migrate, manage AWS                       │
│                                                                             │
│   ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│   😰 "Cần thêm monitoring tool cho AWS nhưng CloudWatch không đủ!"          │
│   😰 "Muốn dùng MongoDB trên AWS!"                                          │
│   😰 "Cần security software chạy trên EC2!"                                 │
│                                                                             │
│   → Giải pháp: Mua từ TECHNOLOGY PARTNER (qua AWS Marketplace)              │
│     Họ bán software chạy trên/tích hợp với AWS                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2 Loại Partners

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AWS Partner Network (APN)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   AWS có 2 loại Partners chính:                                             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🏢 CONSULTING PARTNERS                                             │   │
│   │                                                                     │   │
│   │  = Công ty tư vấn, giúp customers thiết kế, xây dựng,               │   │
│   │    migrate và quản lý workloads trên AWS                            │   │
│   │                                                                     │   │
│   │  Họ làm gì?                                                         │   │
│   │  • Tư vấn architecture                                              │   │
│   │  • Migrate on-premises → AWS                                        │   │
│   │  • Xây dựng solutions                                               │   │
│   │  • Managed services                                                 │   │
│   │  • Training                                                         │   │
│   │                                                                     │   │
│   │  Ví dụ: Accenture, Deloitte, Rackspace, NashTech...                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  📦 TECHNOLOGY PARTNERS                                             │   │
│   │                                                                     │   │
│   │  = Công ty cung cấp software/tools chạy trên hoặc                   │   │
│   │    tích hợp với AWS                                                 │   │
│   │                                                                     │   │
│   │  Họ làm gì?                                                         │   │
│   │  • Cung cấp software trên AWS Marketplace                           │   │
│   │  • Tools tích hợp với AWS                                           │   │
│   │  • SaaS solutions                                                   │   │
│   │                                                                     │   │
│   │  Ví dụ: Datadog, Splunk, MongoDB, HashiCorp, Confluent...           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### So sánh Consulting vs Technology Partners

| | Consulting Partners | Technology Partners |
|--|---------------------|---------------------|
| **Họ là ai** | Công ty tư vấn/services | Công ty software/tools |
| **Họ bán gì** | Professional services, expertise | Software products |
| **Ví dụ** | Accenture, Deloitte, Infosys | Datadog, MongoDB, Splunk |
| **Giúp bạn** | Design, build, migrate, manage | Extend AWS với software |

### Partner Tiers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Partner Tiers                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🥇 Premier Partner    ← Cao nhất, expertise sâu nhất                      │
│            ↑                                                                │
│   🥈 Advanced Partner   ← Đã certified, có experience                       │
│            ↑                                                                │
│   🥉 Select Partner     ← Entry level, đang build experience                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AWS Marketplace

**AWS Marketplace** là nơi Technology Partners bán software:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS Marketplace                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   📦 Mua và deploy software trực tiếp trên AWS                              │
│                                                                             │
│   • AMIs (pre-configured EC2 images)                                        │
│   • CloudFormation templates                                                │
│   • SaaS products                                                           │
│   • Data products                                                           │
│   • Professional services                                                   │
│                                                                             │
│   💰 Billing: Tích hợp vào AWS bill (consolidated billing)                  │
│                                                                             │
│   Ví dụ products:                                                           │
│   • Security: Trend Micro, Palo Alto                                        │
│   • Monitoring: Datadog, Splunk                                             │
│   • Databases: MongoDB, Redis                                               │
│   • DevOps: HashiCorp Terraform, Jenkins                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Exam hay hỏi**:
> - "Cần help migrate to AWS?" → **APN Consulting Partner**
> - "Tìm third-party software cho AWS?" → **AWS Marketplace**

### Ví dụ thực tế

**Consulting Partner - Thuê để làm việc cho mình:**
```
Công ty bạn: "Chúng tôi cần migrate 100 servers lên AWS trong 6 tháng"

        ↓ Thuê

Accenture (Consulting Partner):
  • Đánh giá hiện trạng
  • Design architecture trên AWS  
  • Thực hiện migration
  • Training team của bạn

        ↓

Kết quả: Có infrastructure trên AWS mà không cần build team từ đầu
```

**Technology Partner - Mua software của họ:**
```
Công ty bạn: "Cần monitoring tốt hơn CloudWatch"

        ↓ Mua trên AWS Marketplace

Datadog (Technology Partner):
  • Software monitoring chạy trên AWS
  • Deploy trực tiếp từ Marketplace
  • Billing tích hợp vào AWS bill

        ↓

Kết quả: Có công cụ monitoring mạnh, billing đơn giản
```

### So sánh dễ nhớ

| | Consulting Partner | Technology Partner |
|--|---------------------|---------------------|
| **Giống như** | Thuê công ty xây nhà | Mua đồ nội thất |
| **Họ làm gì** | Làm việc cho bạn | Bán sản phẩm cho bạn |
| **Bạn trả** | Phí dịch vụ | Phí license software |

### Tại sao AWS có chương trình này?

```
AWS:  "Chúng tôi cung cấp cloud infrastructure"
      "Nhưng không phải ai cũng biết dùng"
      "Nên chúng tôi partner với các công ty khác để giúp customers"
  
Win-win-win:
  • AWS: Có thêm customers
  • Partners: Có business
  • Customers: Có help và tools
```

### Sample Exam Questions

```
❓ "Công ty XYZ muốn migrate to AWS nhưng không có expertise. 
    Họ nên làm gì?"

   A. Tự học AWS
   B. Thuê AWS employee
   C. ✅ Engage an APN Consulting Partner
   D. Mua software từ Marketplace

❓ "Cách nào để tìm third-party security software cho EC2?"

   A. AWS Support
   B. ✅ AWS Marketplace
   C. AWS Config
   D. AWS Inspector
```

---

## Tổng kết

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Key Points for Cloud Practitioner                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   📋 DOCUMENTS:                                                              │
│   ─────────────────────────────────────────                                  │
│   • Acceptable Use Policy (AUP) → Những gì được/không được làm               │
│   • Customer Agreement → Hợp đồng với AWS                                    │
│   • Service Terms → Điều khoản từng service                                  │
│                                                                              │
│   🔐 PENETRATION TESTING:                                                    │
│   ─────────────────────────────────────────                                  │
│   • Permitted: EC2, RDS, Lambda, CloudFront... (không cần xin phép)          │
│   • Prohibited: DDoS, DNS zone walking, flooding                             │
│                                                                              │
│   📊 AWS ARTIFACT:                                                           │
│   ─────────────────────────────────────────                                  │
│   • Reports = Compliance reports (SOC, ISO, PCI)                             │
│   • Agreements = Legal agreements (BAA, GDPR DPA)                            │
│                                                                              │
│   📧 AWS ABUSE TEAM:                                                         │
│   ─────────────────────────────────────────                                  │
│   • Report: abuse@amazonaws.com                                              │
│   • Cho spam, attacks, illegal content                                       │
│                                                                              │
│   ⚠️ REMEMBER:                                                               │
│   ─────────────────────────────────────────                                  │
│   • "Fair Use Policy" → KHÔNG TỒN TẠI                                        │
│   • "Applicable Use Policy" → KHÔNG TỒN TẠI                                  │
│   • Chỉ có "Acceptable Use Policy"                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Acceptable Use Policy](https://aws.amazon.com/aup/)
- [AWS Customer Agreement](https://aws.amazon.com/agreement/)
- [AWS Artifact](https://aws.amazon.com/artifact/)
- [AWS Compliance Programs](https://aws.amazon.com/compliance/programs/)
- [Penetration Testing Policy](https://aws.amazon.com/security/penetration-testing/)
