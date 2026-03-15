# AWS Compute Optimizer


## Mục lục

- [Tổng quan](#tổng-quan)
- [Cách hoạt động](#cách-hoạt-động)
- [Recommendation Types](#recommendation-types)
- [Supported Resources](#supported-resources)
- [So sánh với các service khác](#so-sánh-với-các-service-khác)
- [Requirements](#requirements)
- [Graviton Recommendations](#graviton-recommendations)
- [Exam Tips (Cloud Practitioner)](#exam-tips-cloud-practitioner)
- [Tổng kết](#tổng-kết)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Compute Optimizer** là service sử dụng **machine learning** để phân tích historical utilization metrics và đưa ra recommendations cho việc **rightsizing** AWS resources.

Nói đơn giản: **"Chỉ cho bạn resource nào đang over-provisioned hoặc under-provisioned"**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AWS COMPUTE OPTIMIZER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 MỤC ĐÍCH:                                                              │
│   ─────────────────────────────────────────                                 │
│   • Phân tích utilization metrics của resources                             │
│   • Đưa ra recommendations để optimize cost và performance                  │
│   • Giảm over-provisioning (đang dùng quá lớn)                              │
│   • Giảm under-provisioning (đang dùng quá nhỏ)                             │
│                                                                             │
│   📊 SUPPORTED RESOURCES:                                                   │
│   ─────────────────────────────────────────                                 │
│   • EC2 Instances                                                           │
│   • EC2 Auto Scaling Groups                                                 │
│   • EBS Volumes                                                             │
│   • Lambda Functions                                                        │
│   • ECS Services (Fargate)                                                  │
│   • License recommendations (SQL Server, Oracle, etc.)                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOW COMPUTE OPTIMIZER WORKS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│   │  CloudWatch  │─────►│   Compute    │─────►│  Rightsizing │              │
│   │   Metrics    │      │   Optimizer  │      │ Recommendations│              │
│   │  (14 days+)  │      │   (ML/AI)    │      │              │              │
│   └──────────────┘      └──────────────┘      └──────────────┘              │
│                                                                             │
│   PROCESS:                                                                  │
│                                                                             │
│   1. COLLECT: Thu thập utilization metrics từ CloudWatch                    │
│      • CPU utilization                                                      │
│      • Memory utilization (cần CloudWatch agent)                            │
│      • Network I/O                                                          │
│      • Disk I/O                                                             │
│                                                                             │
│   2. ANALYZE: Dùng Machine Learning phân tích patterns                      │
│      • Historical usage patterns                                            │
│      • Peak/Average utilization                                             │
│      • Workload characteristics                                             │
│                                                                             │
│   3. RECOMMEND: Đưa ra recommendations                                      │
│      • Right-size (tăng/giảm instance type)                                 │
│      • Graviton migration                                                   │
│      • Idle resource detection                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Recommendation Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RECOMMENDATION TYPES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🔴 OVER-PROVISIONED (Đang dùng quá lớn)                            │   │
│   │                                                                     │   │
│   │  Hiện tại: m5.xlarge (4 vCPU, 16 GB RAM)                            │   │
│   │  CPU Utilization: Average 5%, Peak 20%                              │   │
│   │                                                                     │   │
│   │  → Recommendation: Downsize to m5.large (2 vCPU, 8 GB RAM)          │   │
│   │  → Savings: ~50% cost reduction                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🟡 UNDER-PROVISIONED (Đang dùng quá nhỏ)                           │   │
│   │                                                                     │   │
│   │  Hiện tại: t3.micro (2 vCPU, 1 GB RAM)                              │   │
│   │  CPU Utilization: Average 95%, Peak 100% (throttling!)              │   │
│   │                                                                     │   │
│   │  → Recommendation: Upsize to t3.medium (2 vCPU, 4 GB RAM)           │   │
│   │  → Benefit: Better performance, no throttling                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ✅ OPTIMIZED (Đang dùng phù hợp)                                   │   │
│   │                                                                     │   │
│   │  Hiện tại: m5.large (2 vCPU, 8 GB RAM)                              │   │
│   │  CPU Utilization: Average 60%, Peak 85%                             │   │
│   │                                                                     │   │
│   │  → Recommendation: Keep current configuration                       │   │
│   │  → Status: Already optimized!                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ⚪ IDLE (Không sử dụng)                                            │   │
│   │                                                                     │   │
│   │  Hiện tại: m5.large running 24/7                                    │   │
│   │  CPU Utilization: Average 0.5%, no network traffic                  │   │
│   │                                                                     │   │
│   │  → Recommendation: Consider terminating or stopping                 │   │
│   │  → Savings: 100% if terminated                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Supported Resources

| Resource | Metrics Analyzed | Recommendations |
|----------|-----------------|-----------------|
| **EC2 Instances** | CPU, Memory, Network, Disk | Instance type, Graviton migration |
| **Auto Scaling Groups** | Same as EC2 | Optimal instance type for group |
| **EBS Volumes** | IOPS, Throughput | Volume type, size, IOPS |
| **Lambda Functions** | Memory, Duration, Invocations | Memory size |
| **ECS Fargate** | CPU, Memory | Task size |
| **Licenses** | Utilization | Right-size licenses |

---

## So sánh với các service khác

```
┌─────────────────────────────────────────────────────────────────────────────┐
│            COMPUTE OPTIMIZER vs RELATED SERVICES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  AWS COMPUTE OPTIMIZER                                              │   │
│   │  • Focus: Rightsizing compute resources                             │   │
│   │  • Resources: EC2, ASG, EBS, Lambda, ECS Fargate                    │   │
│   │  • Output: Instance type recommendations                            │   │
│   │  • Method: ML-based analysis                                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  AWS TRUSTED ADVISOR                                                │   │
│   │  • Focus: Best practices across 5 categories                        │   │
│   │  • Scope: Cost, Performance, Security, Fault Tolerance, Limits      │   │
│   │  • Output: General recommendations                                  │   │
│   │  • Method: Rule-based checks                                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  AWS COST EXPLORER (Rightsizing Recommendations)                    │   │
│   │  • Focus: Cost optimization for EC2                                 │   │
│   │  • Resources: EC2 only                                              │   │
│   │  • Output: Instance type changes with cost impact                   │   │
│   │  • Method: Utilization-based                                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quick Comparison Table

| Feature | Compute Optimizer | Trusted Advisor | Cost Explorer |
|---------|-------------------|-----------------|---------------|
| **Focus** | Rightsizing | Best practices | Cost analysis |
| **Method** | ML-based | Rule-based | Utilization-based |
| **EC2** | ✅ | ✅ | ✅ |
| **EBS** | ✅ | Limited | ❌ |
| **Lambda** | ✅ | ❌ | ❌ |
| **ECS Fargate** | ✅ | ❌ | ❌ |
| **Free** | ✅ | Partial | ✅ |

---

## Requirements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REQUIREMENTS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   📋 MINIMUM REQUIREMENTS:                                                  │
│   ─────────────────────────────────────────                                 │
│   • Metrics data: Ít nhất 14 ngày (30 ngày recommended)                     │
│   • CloudWatch: Enabled (default)                                           │
│   • Opt-in: Phải enable Compute Optimizer cho account                       │
│                                                                             │
│   📊 ENHANCED RECOMMENDATIONS (Optional):                                   │
│   ─────────────────────────────────────────                                 │
│   • CloudWatch Agent: Cài để thu thập memory metrics                        │
│   • Extended metrics: 3 tháng lookback (paid feature)                       │
│   • External metrics: Third-party monitoring tools                          │
│                                                                             │
│   💰 PRICING:                                                               │
│   ─────────────────────────────────────────                                 │
│   • Basic recommendations: FREE                                             │
│   • Enhanced infrastructure metrics: $0.0003367 per resource per hour       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Graviton Recommendations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GRAVITON MIGRATION RECOMMENDATIONS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Compute Optimizer có thể recommend migrate từ x86 → Graviton              │
│                                                                             │
│   Current: m5.xlarge (x86, Intel)                                           │
│       ↓                                                                     │
│   Recommended: m6g.xlarge (Graviton2, ARM)                                  │
│       ↓                                                                     │
│   Benefits:                                                                 │
│   • ~20% better price/performance                                           │
│   • Lower cost                                                              │
│   • Same or better performance                                              │
│                                                                             │
│   ⚠️ NOTE: Cần verify application compatible với ARM architecture            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips (Cloud Practitioner)

### Câu hỏi thường gặp

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAMPLE EXAM QUESTIONS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ❓ "Service nào giúp rightsizing EC2 instances dựa trên utilization?"       │
│    → AWS Compute Optimizer                                                  │
│                                                                             │
│ ❓ "Service nào dùng ML để recommend optimal instance types?"               │
│    → AWS Compute Optimizer                                                  │
│                                                                             │
│ ❓ "Làm sao biết EC2 instance đang over-provisioned?"                       │
│    → AWS Compute Optimizer                                                  │
│                                                                             │
│ ❓ "Service nào recommend Lambda memory configuration?"                     │
│    → AWS Compute Optimizer                                                  │
│                                                                             │
│ ❓ "Service nào giúp detect idle EC2 instances?"                            │
│    → AWS Compute Optimizer (hoặc Trusted Advisor)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Points cần nhớ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY POINTS                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ✅ Compute Optimizer = Rightsizing recommendations (ML-based)             │
│                                                                             │
│   ✅ SUPPORTED RESOURCES:                                                   │
│      • EC2 Instances                                                        │
│      • Auto Scaling Groups                                                  │
│      • EBS Volumes                                                          │
│      • Lambda Functions                                                     │
│      • ECS Fargate                                                          │
│                                                                             │
│   ✅ RECOMMENDATION TYPES:                                                  │
│      • Over-provisioned → Downsize                                          │
│      • Under-provisioned → Upsize                                           │
│      • Optimized → Keep                                                     │
│      • Idle → Consider terminating                                          │
│                                                                             │
│   ✅ REQUIREMENTS:                                                          │
│      • 14 days of CloudWatch metrics (minimum)                              │
│      • CloudWatch agent for memory metrics                                  │
│                                                                             │
│   ✅ PRICING: Basic = FREE                                                  │
│                                                                             │
│   ✅ Khác với Trusted Advisor:                                              │
│      • Compute Optimizer = ML, deeper rightsizing                           │
│      • Trusted Advisor = Rule-based, broader checks                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPUTE OPTIMIZER SUMMARY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: ML-based service để rightsizing compute resources                │
│                                                                             │
│   📊 ANALYZES:                                                              │
│      • CPU, Memory, Network, Disk utilization                               │
│      • Historical patterns                                                  │
│                                                                             │
│   💡 OUTPUTS:                                                               │
│      • Over-provisioned → "Downsize to save cost"                           │
│      • Under-provisioned → "Upsize for better performance"                  │
│      • Idle → "Consider terminating"                                        │
│      • Graviton → "Migrate for better price/performance"                    │
│                                                                             │
│   🆚 COMPARISON:                                                            │
│      • Compute Optimizer = Deep ML analysis for compute                     │
│      • Trusted Advisor = Broad best practices checks                        │
│      • Cost Explorer = Cost-focused EC2 rightsizing                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Compute Optimizer](https://aws.amazon.com/compute-optimizer/)
- [Compute Optimizer User Guide](https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html)
- [Viewing Recommendations](https://docs.aws.amazon.com/compute-optimizer/latest/ug/viewing-recommendations.html)
