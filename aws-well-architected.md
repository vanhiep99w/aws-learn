# AWS Well-Architected Framework


## Mục lục

- [Tổng quan](#tổng-quan)
- [6 Pillars (Trụ cột)](#6-pillars-trụ-cột)
- [1. Operational Excellence (Vận hành xuất sắc)](#1-operational-excellence-vận-hành-xuất-sắc)
- [2. Security (Bảo mật)](#2-security-bảo-mật)
- [3. Reliability (Độ tin cậy) ️](#3-reliability-độ-tin-cậy)
- [4. Performance Efficiency (Hiệu năng) ⚡](#4-performance-efficiency-hiệu-năng)
- [5. Cost Optimization (Tối ưu chi phí)](#5-cost-optimization-tối-ưu-chi-phí)
- [6. Sustainability (Bền vững)](#6-sustainability-bền-vững)
- [AWS Well-Architected Tool](#aws-well-architected-tool)
- [Trade-offs giữa các Pillars](#trade-offs-giữa-các-pillars)
- [Ví dụ thực tế: E-commerce Application](#ví-dụ-thực-tế-e-commerce-application)
- [Well-Architected Labs](#well-architected-labs)
- [Resources](#resources)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**AWS Well-Architected Framework** là bộ best practices và guidelines giúp bạn thiết kế và vận hành hệ thống trên AWS một cách **reliable, secure, efficient, cost-effective, và sustainable**. 

Framework này được xây dựng từ kinh nghiệm của AWS Solutions Architects sau khi review hàng nghìn kiến trúc của khách hàng.

> [!TIP]
> Framework không phải là audit mechanism mà là cuộc hội thoại mang tính xây dựng về các quyết định kiến trúc.

---

## 6 Pillars (Trụ cột)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AWS Well-Architected Framework                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                         6 PILLARS                                     │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │   │
│  │  │ OPERATIONAL │  │  SECURITY   │  │ RELIABILITY │                    │   │
│  │  │ EXCELLENCE  │  │             │  │             │                    │   │
│  │  │      🔧     │  │      🔒     │  │      🛡️     │                    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                    │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐                   │   │
│  │  │ PERFORMANCE │  │    COST     │  │SUSTAINABILITY│                   │   │
│  │  │ EFFICIENCY  │  │OPTIMIZATION │  │              │                   │   │
│  │  │      ⚡      │  │      💰     │  │      🌱      │                   │   │
│  │  └─────────────┘  └─────────────┘  └──────────────┘                   │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Pillar | Mô tả |
|--------|-------|
| **Operational Excellence** | Khả năng vận hành và monitor hệ thống để deliver business value |
| **Security** | Bảo vệ data, systems, và assets |
| **Reliability** | Khả năng hoạt động đúng chức năng một cách consistent |
| **Performance Efficiency** | Sử dụng tài nguyên hiệu quả |
| **Cost Optimization** | Deliver business value với chi phí thấp nhất |
| **Sustainability** | Giảm thiểu tác động môi trường |

---

## 1. Operational Excellence (Vận hành xuất sắc)

### Định nghĩa

Khả năng build software đúng cách và consistently deliver trải nghiệm tốt cho khách hàng, bao gồm:
- Tổ chức team
- Thiết kế workload
- Vận hành ở scale lớn
- Cải tiến liên tục

### Design Principles

| Principle | Mô tả | AWS Services |
|-----------|-------|--------------|
| **Organize around business outcomes** | Tổ chức team theo kết quả kinh doanh, không theo function | - |
| **Implement observability** | Hiểu behavior, performance, reliability, cost của workload | CloudWatch, X-Ray, CloudTrail |
| **Safely automate** | Automate operations với guardrails, rate control, error thresholds | CloudFormation, CDK, Systems Manager |
| **Make small, reversible changes** | Deploy incremental, có khả năng rollback nhanh | CodePipeline, CodeDeploy |
| **Refine procedures frequently** | Cập nhật và validate procedures định kỳ | Runbooks, Playbooks |
| **Anticipate failure** | Test failure scenarios để hiểu risk profile | Fault Injection Simulator |
| **Learn from failures** | Post-incident reviews, share lessons learned | - |
| **Use managed services** | Giảm operational burden | Lambda, Fargate, RDS |

### Best Practices Areas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Operational Excellence Areas                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │   ORGANIZE  │     │   PREPARE   │     │   OPERATE   │                    │
│  │             │     │             │     │             │                    │
│  │ • Team      │ ──► │ • Design    │ ──► │ • Monitor   │                    │
│  │   structure │     │   telemetry │     │ • Respond   │                    │
│  │ • Culture   │     │ • Runbooks  │     │ • Events    │                    │
│  │ • KPIs      │     │ • Test      │     │ • Incidents │                    │
│  └─────────────┘     └─────────────┘     └─────────────┘                    │
│                                                 │                           │
│                                                 ▼                           │
│                                    ┌─────────────┐                          │
│                                    │   EVOLVE    │                          │
│                                    │             │                          │
│                                    │ • Learn     │                          │
│                                    │ • Improve   │                          │
│                                    │ • Share     │                          │
│                                    └─────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Security (Bảo mật)

### Định nghĩa

Khả năng bảo vệ data, systems, và assets để tận dụng cloud technologies cải thiện security.

### Design Principles

| Principle | Mô tả | AWS Services |
|-----------|-------|--------------|
| **Strong identity foundation** | Least privilege, separation of duties, no long-term credentials | IAM, Organizations, SSO |
| **Maintain traceability** | Monitor, alert, audit real-time | CloudTrail, CloudWatch, Config |
| **Apply security at all layers** | Defense in depth - network, VPC, instance, OS, code | Security Groups, WAF, Shield |
| **Automate security best practices** | Security controls as code | CloudFormation, Config Rules |
| **Protect data in transit and at rest** | Encryption, tokenization, access control | KMS, ACM, Secrets Manager |
| **Keep people away from data** | Reduce direct access và manual processing | Systems Manager, Lambda |
| **Prepare for security events** | Incident response plans, simulations | GuardDuty, Detective, Macie |

### Security Best Practices Areas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Security Areas                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Identity & Access Management                    │    │
│  │  IAM Users/Roles → Organizations → SSO → MFA                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │  Detection  │     │Infrastructure│     │    Data    │                    │
│  │             │     │  Protection │     │ Protection  │                    │
│  │ • GuardDuty │     │ • VPC       │     │ • KMS       │                    │
│  │ • CloudTrail│     │ • WAF       │     │ • Macie     │                    │
│  │ • Config    │     │ • Shield    │     │ • Secrets   │                    │
│  │ • Detective │     │ • Firewall  │     │   Manager   │                    │
│  └─────────────┘     └─────────────┘     └─────────────┘                    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Incident Response                                │    │
│  │  Detection → Investigation → Containment → Recovery → Lessons       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Reliability (Độ tin cậy)

### Định nghĩa

Khả năng của workload thực hiện đúng chức năng một cách correctly và consistently khi expected, bao gồm khả năng vận hành và test xuyên suốt lifecycle.

### Design Principles

| Principle | Mô tả | AWS Services |
|-----------|-------|--------------|
| **Automatically recover from failure** | Monitor KPIs, automate recovery | CloudWatch Alarms, Auto Scaling |
| **Test recovery procedures** | Simulate failures, validate recovery | Fault Injection Simulator |
| **Scale horizontally** | Multiple small resources thay vì 1 large resource | ELB, Auto Scaling |
| **Stop guessing capacity** | Monitor và auto-scale theo demand | Auto Scaling, Compute Optimizer |
| **Manage change through automation** | Infrastructure as Code | CloudFormation, CDK |

### Reliability Best Practices Areas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Reliability Areas                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Foundations                                 │    │
│  │  Service Quotas → Network Topology → Service Limits                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          ▼                         ▼                         ▼              │
│  ┌─────────────┐          ┌─────────────┐           ┌─────────────┐         │
│  │  Workload   │          │   Change    │           │   Failure   │         │
│  │ Architecture│          │ Management  │           │ Management  │         │
│  │             │          │             │           │             │         │
│  │ • Design for│          │ • IaC       │           │ • Backup    │         │
│  │   failures  │          │ • CI/CD     │           │ • DR        │         │
│  │ • Loose     │          │ • Testing   │           │ • Self-heal │         │
│  │   coupling  │          │ • Rollback  │           │ • Chaos     │         │
│  └─────────────┘          └─────────────┘           └─────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Reliability Concepts

| Concept | Định nghĩa | Target |
|---------|------------|--------|
| **Availability** | % thời gian workload available | 99.9% - 99.999% |
| **RTO** | Recovery Time Objective - thời gian phục hồi | Minutes - Hours |
| **RPO** | Recovery Point Objective - data loss acceptable | Seconds - Hours |
| **MTTR** | Mean Time To Recovery | < 1 hour |
| **MTBF** | Mean Time Between Failures | > 1 month |

---

## 4. Performance Efficiency (Hiệu năng)

### Định nghĩa

Khả năng sử dụng tài nguyên cloud hiệu quả để đáp ứng performance requirements và maintain efficiency khi demand thay đổi.

### Design Principles

| Principle | Mô tả | AWS Services |
|-----------|-------|--------------|
| **Democratize advanced technologies** | Consume technology as a service | AI/ML services, DynamoDB |
| **Go global in minutes** | Deploy multi-region cho low latency | Global Accelerator, CloudFront |
| **Use serverless architectures** | Không cần manage servers | Lambda, Fargate, S3 |
| **Experiment more often** | Test different configurations dễ dàng | EC2, A/B Testing |
| **Consider mechanical sympathy** | Chọn technology phù hợp với use case | Database selection |

### Performance Efficiency Areas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Performance Efficiency Areas                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐            │
│  │  Compute    │     │   Storage   │     │      Database       │            │
│  │             │     │             │     │                     │            │
│  │ • EC2 types │     │ • S3 classes│     │ • RDS vs DynamoDB   │            │
│  │ • Lambda    │     │ • EBS types │     │ • Read replicas     │            │
│  │ • Container │     │ • FSx       │     │ • Caching           │            │
│  │ • Graviton  │     │ • S3 Express│     │ • DAX, ElastiCache  │            │
│  └─────────────┘     └─────────────┘     └─────────────────────┘            │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                   Networking & Content Delivery                    │     │
│  │  VPC → ELB → CloudFront → Global Accelerator → Route 53            │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Selection Guide

| Workload Type | Recommended Services |
|---------------|---------------------|
| **Stateless, event-driven** | Lambda, API Gateway |
| **Web application** | ECS Fargate, ALB |
| **High performance computing** | EC2 (C instances), Parallel Cluster |
| **Big data processing** | EMR, Glue |
| **Real-time processing** | Kinesis, MSK |
| **Static content** | CloudFront, S3 |

---

## 5. Cost Optimization (Tối ưu chi phí)

### Định nghĩa

Khả năng run systems để deliver business value với chi phí thấp nhất.

### Design Principles

| Principle | Mô tả | AWS Services |
|-----------|-------|--------------|
| **Implement Cloud Financial Management** | Invest in FinOps capability | Cost Explorer, Budgets |
| **Adopt a consumption model** | Pay only for what you use | Auto Scaling, Lambda |
| **Measure overall efficiency** | Business output / cost | CloudWatch, custom metrics |
| **Stop spending on undifferentiated heavy lifting** | Use managed services | RDS, Lambda, Fargate |
| **Analyze and attribute expenditure** | Cost allocation, tagging | Cost Explorer, Tags |

### Cost Optimization Areas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Cost Optimization Areas                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Cloud Financial Management                       │    │
│  │  Budgeting → Forecasting → Cost Allocation → Optimization           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          ▼                         ▼                         ▼              │
│  ┌─────────────┐          ┌──────────────┐           ┌─────────────┐        │
│  │ Expenditure │          │Cost-effective│           │ Resource    │        │
│  │ Awareness   │          │ Resources    │           │ Right-sizing│        │
│  │             │          │              │           │             │        │
│  │ • Tagging   │          │ • Reserved   │           │ • Compute   │        │
│  │ • Budgets   │          │   Instances  │           │   Optimizer │        │
│  │ • Reports   │          │ • Spot       │           │ • Trusted   │        │
│  │ • Alerts    │          │ • Savings    │           │   Advisor   │        │
│  │             │          │   Plans      │           │             │        │
│  └─────────────┘          └──────────────┘           └─────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pricing Models

| Model | Use Case | Discount |
|-------|----------|----------|
| **On-Demand** | Unpredictable workloads | 0% |
| **Reserved Instances** | Steady-state, predictable | 30-72% |
| **Savings Plans** | Consistent usage commitment | 30-72% |
| **Spot Instances** | Fault-tolerant, flexible | 60-90% |
| **Dedicated Hosts** | License compliance | Varies |

---

## 6. Sustainability (Bền vững)

### Định nghĩa

Tập trung vào environmental impacts, đặc biệt là energy consumption và efficiency.

### Design Principles

| Principle | Mô tả |
|-----------|-------|
| **Understand your impact** | Measure và model cloud workload impact |
| **Establish sustainability goals** | Long-term goals cho từng workload |
| **Maximize utilization** | Right-size, 60% utilization tốt hơn 30% |
| **Anticipate and adopt efficient hardware** | Graviton, new instance types |
| **Use managed services** | Share resources, maximize utilization |
| **Reduce downstream impact** | Reduce energy cần để sử dụng services |

### Sustainability Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Sustainability Areas                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐            │
│  │   Region    │     │   Compute   │     │     Storage         │            │
│  │  Selection  │     │             │     │                     │            │
│  │             │     │ • Graviton  │     │ • S3 Lifecycle      │            │
│  │ • Low carbon│     │ • Right-size│     │ • Intelligent-      │            │
│  │   regions   │     │ • Serverless│     │   Tiering           │            │
│  │ • Proximity │     │ • Spot      │     │ • Data lifecycle    │            │
│  └─────────────┘     └─────────────┘     └─────────────────────┘            │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐            │
│  │    Data     │     │   Network   │     │   Development       │            │
│  │ Management  │     │             │     │                     │            │
│  │             │     │ • Compression│     │ • Efficient code   │            │
│  │ • Minimize  │     │ • Caching   │     │ • Remove unused     │            │
│  │   data move │     │ • Edge      │     │   resources         │            │
│  └─────────────┘     └─────────────┘     └─────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AWS Sustainability Initiatives

| Initiative | Mô tả |
|------------|-------|
| **100% Renewable Energy** | Mục tiêu năm 2025 cho all operations |
| **Graviton Processors** | Up to 60% energy efficient hơn x86 |
| **Customer Carbon Footprint Tool** | Track carbon emissions |
| **AWS Water+** | Trả lại nhiều nước hơn sử dụng by 2030 |

---

## AWS Well-Architected Tool

### Tổng quan

AWS cung cấp **AWS Well-Architected Tool** (miễn phí) để review workloads:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS Well-Architected Tool                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  1. Define Workload                                                 │    │
│  │     Name, description, industry, environment                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  2. Answer Questions                                                │    │
│  │     Questions cho mỗi pillar                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  3. Review Report                                                   │    │
│  │     • High Risk Issues (HRI)                                        │    │
│  │     • Medium Risk Issues (MRI)                                      │    │
│  │     • Improvement Plan                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  4. Implement Improvements                                          │    │
│  │     Track milestones, update review                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Lenses

Ngoài Framework chính, AWS cung cấp **Lenses** cho specific use cases:

| Lens | Focus Area |
|------|------------|
| **Serverless Lens** | Lambda, API Gateway, Step Functions |
| **SaaS Lens** | Multi-tenant SaaS applications |
| **Machine Learning Lens** | ML workloads |
| **Data Analytics Lens** | Analytics và big data |
| **IoT Lens** | Internet of Things |
| **SAP Lens** | SAP on AWS |
| **Games Lens** | Gaming workloads |
| **Financial Services Lens** | Financial industries |

---

## Trade-offs giữa các Pillars

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Common Trade-offs                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Performance vs Cost                                                        │
│  ─────────────────                                                          │
│  • Larger instances = Better performance = Higher cost                      │
│  • Multi-AZ = Higher availability = Higher cost                             │
│  • Reserved Instances = Lower cost = Less flexibility                       │
│                                                                             │
│  Security vs Performance                                                    │
│  ──────────────────────                                                     │
│  • More encryption = More CPU overhead                                      │
│  • More logging = More storage                                              │
│  • Stricter access = More latency                                           │
│                                                                             │
│  Reliability vs Cost                                                        │
│  ─────────────────                                                          │
│  • Multi-region DR = Higher cost                                            │
│  • More backups = More storage cost                                         │
│  • Redundancy = Higher cost                                                 │
│                                                                             │
│  Sustainability vs Performance                                              │
│  ────────────────────────────                                               │
│  • Right-sizing = May reduce peak performance                               │
│  • Cold storage = Higher retrieval latency                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Ví dụ thực tế: E-commerce Application

### Architecture Review

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    E-commerce Well-Architected Review                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Pillar: Operational Excellence                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  ✅ Infrastructure as Code (CloudFormation)                         │     │
│  │  ✅ CI/CD Pipeline (CodePipeline)                                   │     │
│  │  ✅ Centralized logging (CloudWatch Logs)                           │     │
│  │  ⚠️ Missing runbooks for common failures                            │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  Pillar: Security                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  ✅ IAM Roles (no access keys in code)                              │     │
│  │  ✅ Encryption at rest (KMS)                                        │     │
│  │  ✅ WAF enabled on CloudFront                                       │     │
│  │  ⚠️ No secrets rotation configured                                  │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  Pillar: Reliability                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  ✅ Multi-AZ deployment                                             │     │
│  │  ✅ Auto Scaling configured                                         │     │
│  │  ✅ RDS Multi-AZ                                                    │     │
│  │  ⚠️ No cross-region DR plan                                         │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  Pillar: Performance Efficiency                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  ✅ CloudFront for static content                                   │     │
│  │  ✅ ElastiCache for session caching                                 │     │
│  │  ⚠️ Database queries not optimized                                  │     │
│  │  ⚠️ No performance testing in CI/CD                                 │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  Pillar: Cost Optimization                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  ⚠️ No Reserved Instances for production                            │     │
│  │  ✅ S3 Lifecycle policies configured                                │     │
│  │  ⚠️ Dev environment runs 24/7                                       │     │
│  │  ⚠️ No cost allocation tags                                         │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  Pillar: Sustainability                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  ⚠️ Not using Graviton instances                                    │     │
│  │  ⚠️ Dev resources not scheduled                                     │     │
│  │  ✅ S3 Intelligent-Tiering enabled                                  │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Well-Architected Labs

AWS cung cấp hands-on labs miễn phí: [wellarchitectedlabs.com](https://wellarchitectedlabs.com)

| Category | Labs |
|----------|------|
| **Operational Excellence** | Inventory and Patch Compliance, Event-Driven Architecture |
| **Security** | Quest: Identity, Quest: Quick Wins |
| **Reliability** | Testing Resiliency, Backup and Recovery |
| **Performance Efficiency** | Performance Testing, Right-sizing |
| **Cost Optimization** | AWS Account Setup, Expenditure Awareness |
| **Sustainability** | Carbon Footprint, Optimization |

---

## Resources

| Resource | Link |
|----------|------|
| **Framework Documentation** | [docs.aws.amazon.com/wellarchitected](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) |
| **Well-Architected Tool** | AWS Console |
| **Pillar Whitepapers** | AWS Whitepapers |
| **Well-Architected Labs** | [wellarchitectedlabs.com](https://wellarchitectedlabs.com) |
| **Partner Program** | AWS Well-Architected Partners |

---

## Tổng kết

| Pillar | Key Focus | Key Question |
|--------|-----------|--------------|
| **Operational Excellence** | Operations, automation, continuous improvement | Làm sao để vận hành và cải tiến workload? |
| **Security** | Protection, compliance, incident response | Làm sao để bảo vệ data và systems? |
| **Reliability** | Availability, recovery, change management | Làm sao để đảm bảo workload luôn available? |
| **Performance Efficiency** | Right resources, global reach, monitoring | Làm sao để sử dụng resources hiệu quả? |
| **Cost Optimization** | FinOps, right-sizing, pricing models | Làm sao để deliver value với chi phí thấp nhất? |
| **Sustainability** | Environmental impact, efficiency | Làm sao để giảm environmental footprint? |

> [!IMPORTANT]
> Well-Architected không phải là một lần review mà là **continuous process**. Review workloads định kỳ và update khi có thay đổi significant.

> [!TIP]
> Sử dụng **AWS Well-Architected Tool** (miễn phí) để track reviews và theo dõi improvement plan.
