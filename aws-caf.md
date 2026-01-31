# AWS Cloud Adoption Framework (AWS CAF)


## Mục lục

- [Tổng quan](#tổng-quan)
- [6 Perspectives (Góc nhìn)](#6-perspectives-góc-nhìn)
- [Cách nhớ 6 Perspectives](#cách-nhớ-6-perspectives)
- [4 Transformation Phases](#4-transformation-phases)
- [Ví dụ thực tế](#ví-dụ-thực-tế)
- [So sánh với Well-Architected Framework](#so-sánh-với-well-architected-framework)
- [Exam Tips (Cloud Practitioner)](#exam-tips-cloud-practitioner)
- [Tổng kết](#tổng-kết)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Cloud Adoption Framework (CAF)** là một framework giúp tổ chức lên kế hoạch và thực hiện **cloud adoption journey** một cách hiệu quả. 

Nói đơn giản: **"Hướng dẫn từ AWS để giúp bạn chuyển đổi lên cloud đúng cách"**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  AWS Cloud Adoption Framework (CAF)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 MỤC ĐÍCH:                                                              │
│   ─────────────────────────────────────────                                 │
│   • Giúp tổ chức hiểu được cần làm gì để adopt cloud                        │
│   • Xác định gaps và areas cần cải thiện                                    │
│   • Tạo roadmap cho cloud transformation                                    │
│                                                                             │
│   📋 CẤU TRÚC:                                                              │
│   ─────────────────────────────────────────                                 │
│   • 6 PERSPECTIVES (góc nhìn khác nhau)                                     │
│   • 4 TRANSFORMATION PHASES (giai đoạn chuyển đổi)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6 Perspectives (Góc nhìn)

CAF chia thành **6 perspectives**, mỗi perspective đại diện cho một khía cạnh khác nhau của cloud adoption:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        6 CAF PERSPECTIVES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    BUSINESS CAPABILITIES                            │   │
│   │            (Focus on Business & Organizational)                     │   │
│   │                                                                     │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│   │   │  BUSINESS    │  │   PEOPLE     │  │  GOVERNANCE  │             │   │
│   │   │     💼       │  │     👥       │  │      📋      │             │   │
│   │   │              │  │              │  │              │             │   │
│   │   │ Strategy,    │  │ Culture,     │  │ Risk,        │             │   │
│   │   │ Outcomes,    │  │ Training,    │  │ Compliance,  │             │   │
│   │   │ Finance      │  │ Leadership   │  │ Portfolio    │             │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    TECHNICAL CAPABILITIES                           │   │
│   │            (Focus on Technical & Infrastructure)                    │   │
│   │                                                                     │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│   │   │  PLATFORM    │  │  SECURITY    │  │  OPERATIONS  │             │   │
│   │   │     🏗️       │  │     🔐       │  │      ⚙️      │             │   │
│   │   │              │  │              │  │              │             │   │
│   │   │ Architecture,│  │ IAM,         │  │ Monitoring,  │             │   │
│   │   │ CI/CD,       │  │ Detection,   │  │ Incident,    │             │   │
│   │   │ Modernization│  │ Protection   │  │ Automation   │             │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết từng Perspective

| Perspective | Focus | Stakeholders | Câu hỏi chính |
|-------------|-------|--------------|---------------|
| **Business** | Strategy & outcomes | CEO, CFO, CIO | "Cloud mang lại business value gì?" |
| **People** | Culture & change | HR, CIO, CTO | "Team cần skills gì? Làm sao thay đổi culture?" |
| **Governance** | Risk & compliance | CFO, CRO, CDO | "Làm sao quản lý risk và compliance?" |
| **Platform** | Architecture & infra | CTO, Architects | "Infrastructure cần gì? Làm sao modernize?" |
| **Security** | Protection & IAM | CISO, Security team | "Làm sao bảo vệ data và workloads?" |
| **Operations** | Monitoring & support | Ops team, SRE | "Làm sao vận hành và monitor hiệu quả?" |

### Foundational Capabilities (CAF 3.0)

> [!IMPORTANT]
> CAF 3.0 định nghĩa các **Foundational Capabilities** cụ thể cho mỗi perspective. Đây là kiến thức cần thiết cho exam!

#### Business Perspective Capabilities

| Capability | Mô tả |
|------------|-------|
| **Strategy management** | Định nghĩa và communicate cloud strategy |
| **Portfolio management** | Quản lý portfolio of cloud initiatives |
| **Innovation management** | Foster innovation culture, rapid experimentation |
| **Product management** | Quản lý products với agile methods, customer feedback |
| **Strategic partnership** | Partnerships với AWS và partners |
| **Data monetization** | Tạo value từ data assets |
| **Business insight** | Data-driven decision making |

#### People Perspective Capabilities

| Capability | Mô tả |
|------------|-------|
| **Culture evolution** | Thay đổi culture hướng cloud-native |
| **Transformational leadership** | Leaders drive và support transformation |
| **Cloud fluency** | Training và upskilling cho cloud |
| **Workforce transformation** | Restructure teams cho cloud operating model |
| **Change acceleration** | Manage organizational change effectively |
| **Organization design** | **Tổ chức cross-functional teams around products** |
| **Organizational alignment** | Align organization structure với cloud goals |

#### Governance Perspective Capabilities

| Capability | Mô tả |
|------------|-------|
| **Program và project management** | Quản lý cloud initiatives |
| **Benefits management** | Track và realize cloud benefits |
| **Risk management** | Identify và mitigate cloud risks |
| **Cloud financial management** | FinOps, cost optimization |
| **Application portfolio management** | Assess và prioritize applications |
| **Data governance** | Data quality, lifecycle, compliance |
| **Data curation** | Organize và manage data assets |

#### Platform Perspective Capabilities

| Capability | Mô tả |
|------------|-------|
| **Platform architecture** | Design scalable cloud architecture |
| **Data architecture** | Design data platforms và pipelines |
| **Platform engineering** | Build và maintain cloud platform |
| **Data engineering** | Build data infrastructure |
| **Provisioning và orchestration** | Automate infrastructure deployment |
| **Modern application development** | Cloud-native development practices |
| **CI/CD** | Continuous integration và delivery |

#### Security Perspective Capabilities

| Capability | Mô tả |
|------------|-------|
| **Security governance** | Security policies và standards |
| **Security assurance** | Compliance và audit |
| **Identity và access management** | IAM, least privilege |
| **Threat detection** | Detect security threats |
| **Vulnerability management** | Identify và fix vulnerabilities |
| **Infrastructure protection** | Protect cloud infrastructure |
| **Data protection** | Encrypt và protect data |
| **Application security** | Secure applications |
| **Incident response** | Respond to security incidents |

#### Operations Perspective Capabilities

| Capability | Mô tả |
|------------|-------|
| **Observability** | Monitoring, logging, tracing |
| **Event management** | Detect và respond to events |
| **Incident và problem management** | Handle incidents effectively |
| **Change và release management** | Safe deployments |
| **Performance và capacity management** | Optimize performance |
| **Configuration management** | Manage configurations |
| **Patch management** | Keep systems updated |
| **Availability và continuity management** | Ensure uptime, DR |
| **Application management** | Manage applications lifecycle |

---

## Cách nhớ 6 Perspectives

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Mẹo nhớ 6 Perspectives                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🏢 BUSINESS-FOCUSED (3):    🔧 TECHNICAL-FOCUSED (3):                     │
│   ─────────────────────────   ─────────────────────────                     │
│   B - Business                P - Platform                                  │
│   P - People                  S - Security                                  │
│   G - Governance              O - Operations                                │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   Nhớ: "Business People need Governance"                                   │
│        "Platform needs Security for Operations"                            │
│                                                                             │
│   Hoặc: BPG + PSO = 6 Perspectives                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4 Transformation Phases

CAF định nghĩa 4 giai đoạn để thực hiện cloud transformation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    4 TRANSFORMATION PHASES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │ ENVISION │───►│  ALIGN   │───►│  LAUNCH  │───►│  SCALE   │             │
│   │    🔭    │    │    🎯    │    │    🚀    │    │    📈    │             │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘             │
│                                                                             │
│   Phase 1:        Phase 2:        Phase 3:        Phase 4:                 │
│   ENVISION        ALIGN           LAUNCH          SCALE                    │
│   ─────────       ─────           ──────          ─────                    │
│   Xác định        Xác định        Triển khai      Mở rộng                  │
│   opportunities   gaps và         pilots,         production,              │
│   và business     dependencies,   demo value      realize                  │
│   outcomes        create plan                     benefits                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết từng Phase

| Phase | Mục đích | Output |
|-------|----------|--------|
| **Envision** | Xác định opportunities, tạo vision | Business case, strategic objectives |
| **Align** | Xác định gaps, tạo roadmap | Cloud readiness assessment, action plan |
| **Launch** | Triển khai pilots, demo value | MVP in production, lessons learned |
| **Scale** | Mở rộng, realize full benefits | Full cloud adoption, optimized operations |

---

## Ví dụ thực tế

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Ví dụ: Công ty XYZ muốn migrate to AWS                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Dùng CAF để đánh giá 6 perspectives:                                      │
│                                                                             │
│   💼 BUSINESS:                                                              │
│      ✅ "Chúng tôi muốn giảm 30% chi phí infrastructure"                    │
│      ✅ "Cần tăng speed-to-market"                                          │
│                                                                             │
│   👥 PEOPLE:                                                                │
│      ❌ "Team chưa có cloud skills"                                         │
│      → Action: Training AWS, hire cloud engineers                          │
│                                                                             │
│   📋 GOVERNANCE:                                                            │
│      ❌ "Chưa có cloud governance policies"                                 │
│      → Action: Define policies, cost management, compliance                │
│                                                                             │
│   🏗️ PLATFORM:                                                              │
│      ❌ "Chưa có landing zone, CI/CD"                                       │
│      → Action: Setup AWS Landing Zone, implement CI/CD                     │
│                                                                             │
│   🔐 SECURITY:                                                              │
│      ⚠️ "Có IAM nhưng chưa có security monitoring"                         │
│      → Action: Implement GuardDuty, Security Hub                           │
│                                                                             │
│   ⚙️ OPERATIONS:                                                            │
│      ❌ "Chưa có cloud monitoring strategy"                                 │
│      → Action: Setup CloudWatch, define runbooks                           │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   → Kết quả: Roadmap chi tiết cho cloud transformation                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## So sánh với Well-Architected Framework

| | Cloud Adoption Framework (CAF) | Well-Architected Framework |
|--|--------------------------------|---------------------------|
| **Focus** | Organization transformation | Workload design |
| **Scope** | Toàn bộ organization | Specific workload/application |
| **Khi dùng** | Planning cloud journey | Designing/reviewing architecture |
| **Perspectives/Pillars** | 6 perspectives | 6 pillars |
| **Output** | Transformation roadmap | Architecture improvements |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Khi nào dùng cái nào?                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   "Công ty tôi muốn move to cloud, cần plan như thế nào?"                  │
│   → AWS Cloud Adoption Framework (CAF)                                     │
│                                                                             │
│   "Tôi đang design architecture cho app, làm sao cho tốt?"                 │
│   → AWS Well-Architected Framework                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips (Cloud Practitioner)

### Câu hỏi thường gặp

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Sample Exam Questions                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ❓ "Framework nào giúp organization plan cloud adoption?"                   │
│    → AWS Cloud Adoption Framework (CAF)                                    │
│                                                                             │
│ ❓ "CAF có bao nhiêu perspectives?"                                         │
│    → 6 perspectives                                                         │
│                                                                             │
│ ❓ "Perspective nào focus on training và culture change?"                   │
│    → People perspective                                                     │
│                                                                             │
│ ❓ "Perspective nào focus on risk và compliance?"                           │
│    → Governance perspective                                                 │
│                                                                             │
│ ❓ "Perspective nào giúp build scalable infrastructure?"                    │
│    → Platform perspective                                                   │
│                                                                             │
│ ❓ "Business perspective stakeholders gồm ai?"                              │
│    → CEO, CFO, CIO, CTO                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Points cần nhớ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY POINTS                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ✅ CAF = Planning framework for cloud transformation                     │
│                                                                             │
│   ✅ 6 PERSPECTIVES:                                                        │
│      Business-focused: Business, People, Governance                        │
│      Technical-focused: Platform, Security, Operations                     │
│                                                                             │
│   ✅ 4 PHASES: Envision → Align → Launch → Scale                           │
│                                                                             │
│   ✅ STAKEHOLDER MAPPING:                                                   │
│      • Business = CEO, CFO                                                 │
│      • People = HR, CIO                                                    │
│      • Governance = CFO, CRO                                               │
│      • Platform = CTO, Architects                                          │
│      • Security = CISO                                                     │
│      • Operations = Ops team, SRE                                          │
│                                                                             │
│   ✅ Khác với Well-Architected (workload-focused)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS CAF SUMMARY                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Framework để plan cloud adoption                                 │
│                                                                             │
│   📊 6 PERSPECTIVES:                                                        │
│      💼 Business - Strategy & outcomes                                      │
│      👥 People - Culture & skills                                           │
│      📋 Governance - Risk & compliance                                      │
│      🏗️ Platform - Architecture & infra                                     │
│      🔐 Security - Protection & IAM                                         │
│      ⚙️ Operations - Monitoring & automation                                │
│                                                                             │
│   🚀 4 PHASES: Envision → Align → Launch → Scale                           │
│                                                                             │
│   💡 KEY INSIGHT:                                                           │
│      CAF = "Organizational readiness for cloud"                            │
│      Well-Architected = "Workload architecture quality"                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Cloud Adoption Framework](https://aws.amazon.com/cloud-adoption-framework/)
- [AWS CAF Whitepaper](https://d1.awsstatic.com/whitepapers/aws-caf-ebook.pdf)
- [AWS CAF Documentation](https://docs.aws.amazon.com/whitepapers/latest/overview-aws-cloud-adoption-framework/welcome.html)
