# AWS Trusted Advisor


## Mục lục

- [Tổng quan](#tổng-quan)
- [5 Categories of Checks](#5-categories-of-checks)
- [Access theo Support Plan](#access-theo-support-plan)
- [Integration với AWS Services](#integration-với-aws-services)
- [Trusted Advisor vs Các Services Khác](#trusted-advisor-vs-các-services-khác)
- [Trusted Advisor Priority (Enterprise)](#trusted-advisor-priority-enterprise)
- [Key Checks to Remember (Exam)](#key-checks-to-remember-exam)
- [Pricing](#pricing)
- [Tóm tắt](#tóm-tắt)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Trusted Advisor** là dịch vụ cung cấp **recommendations** dựa trên best practices của AWS để giúp bạn:
- **Tiết kiệm chi phí** (Cost Optimization)
- **Tăng hiệu suất** (Performance)
- **Cải thiện bảo mật** (Security)
- **Tăng tính sẵn sàng** (Fault Tolerance)
- **Kiểm soát Service Limits**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS Trusted Advisor                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   "Real-time guidance to help you provision resources                       │
│    following AWS best practices"                                            │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     5 CHECK CATEGORIES                              │   │
│   │                                                                     │   │
│   │   ┌────────────┐  ┌───────────┐  ┌───────────┐                      │   │
│   │   │   COST     │  │PERFORMANCE│  │ SECURITY  │                      │   │
│   │   │Optimization│  │           │  │           │                      │   │
│   │   │    💰      │  │    ⚡      │  │    🔐     │                      │   │
│   │   └────────────┘  └───────────┘  └───────────┘                      │   │
│   │                                                                     │   │
│   │   ┌────────────┐  ┌───────────┐                                     │   │
│   │   │   FAULT    │  │  SERVICE  │                                     │   │
│   │   │ TOLERANCE  │  │  LIMITS   │                                     │   │
│   │   │    🔄      │  │    📊     │                                     │   │
│   │   └────────────┘  └───────────┘                                     │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5 Categories of Checks

### 1. Cost Optimization 💰

**Mục đích**: Tìm cách **tiết kiệm tiền**.

| Check | Mô tả |
|-------|-------|
| **Idle EC2 Instances** | Instances có CPU usage < 10% trong 14 ngày |
| **Underutilized EBS Volumes** | Volumes ít được sử dụng |
| **Unassociated Elastic IPs** | EIPs không attached vào instance (tốn tiền!) |
| **Idle Load Balancers** | Load Balancers không có traffic |
| **Reserved Instance Optimization** | Đề xuất mua RI để tiết kiệm |
| **Savings Plans** | Đề xuất Savings Plans phù hợp |

```
Ví dụ:
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ Warning: You have 5 unassociated Elastic IP addresses                    │
│                                                                              │
│  EIP: eip-abc123 - Not attached - $3.50/month wasted                         │
│  EIP: eip-def456 - Not attached - $3.50/month wasted                         │
│  ...                                                                         │
│                                                                              │
│  💡 Recommendation: Release unused EIPs to save $17.50/month                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Performance ⚡

**Mục đích**: Cải thiện **hiệu suất** ứng dụng.

| Check | Mô tả |
|-------|-------|
| **High Utilization EC2** | Instances đang overloaded |
| **EBS Provisioned IOPS** | IOPS không đủ cho workload |
| **CloudFront Optimization** | CDN không tối ưu |
| **EC2 to EBS Throughput** | Bandwidth giữa EC2 và EBS |

---

### 3. Security 🔐

**Mục đích**: Phát hiện **lỗ hổng bảo mật**.

| Check | Mô tả |
|-------|-------|
| **S3 Bucket Permissions** | Buckets public hoặc quá mở |
| **Security Groups - Open Ports** | SG cho phép 0.0.0.0/0 vào SSH (22), RDP (3389) |
| **IAM Access Key Rotation** | Access keys quá cũ (>90 days) |
| **MFA on Root Account** | Root account không có MFA |
| **IAM Password Policy** | Password policy yếu |
| **Exposed Access Keys** | Keys bị exposed trên GitHub, etc. |

```
Ví dụ:
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔴 Critical: Security Groups - Unrestricted SSH Access                     │
│                                                                             │
│  sg-abc123: Port 22 open to 0.0.0.0/0                                       │
│  sg-def456: Port 22 open to 0.0.0.0/0                                       │
│                                                                             │
│  💡 Recommendation: Restrict SSH access to specific IP ranges               │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Một số **Security checks** có sẵn cho tất cả AWS accounts (kể cả Basic Support)!

---

### 4. Fault Tolerance 🔄

**Mục đích**: Tăng **khả năng chịu lỗi** và availability.

| Check | Mô tả |
|-------|-------|
| **EBS Snapshots** | Volumes không có snapshots |
| **EC2 Availability Zone Balance** | Instances không phân bố đều AZs |
| **RDS Multi-AZ** | RDS không enable Multi-AZ |
| **ELB Health Check** | Health check không configured |
| **Auto Scaling Group Health** | ASG configuration issues |

---

### 5. Service Limits 📊

**Mục đích**: Kiểm tra **quotas/limits** sắp đạt ngưỡng.

| Check | Mô tả |
|-------|-------|
| **VPCs** | Số VPCs gần limit |
| **EC2 Instances** | Số instances gần limit |
| **EBS Volumes** | Số volumes gần limit |
| **IAM Users/Roles** | Số IAM entities gần limit |

```
Ví dụ:
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ Warning: Service Quota Approaching Limit                                 │
│                                                                              │
│  VPCs per Region: 4/5 (80%)                                                  │
│  On-Demand EC2 Instances: 18/20 (90%)                                        │
│                                                                              │
│  💡 Recommendation: Request quota increase trước khi hết                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Service Limits** checks có sẵn cho tất cả AWS accounts (kể cả Basic Support)!

---

## Access theo Support Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Trusted Advisor Access by Support Plan                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  BASIC / DEVELOPER SUPPORT:                                         │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │  ✅ Service Limits (ALL checks)                               │  │   │
│   │  │  ✅ Security (SELECTED checks only)                           │  │   │
│   │  │     • S3 Bucket Permissions                                   │  │   │
│   │  │     • Security Groups - SSH                                   │  │   │
│   │  │     • IAM Use                                                 │  │   │
│   │  │     • MFA on Root Account                                     │  │   │
│   │  │     • EBS Public Snapshots                                    │  │   │
│   │  │     • RDS Public Snapshots                                    │  │   │
│   │  │  ❌ Cost Optimization                                         │  │   │
│   │  │  ❌ Performance                                               │  │   │
│   │  │  ❌ Fault Tolerance (full)                                    │  │   │
│   │  │  ❌ API access                                                │  │   │
│   │  │  ❌ Auto-refresh                                              │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   │                                                                     │   │
│   │  BUSINESS SUPPORT+ / ENTERPRISE:                                    │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │  ✅ ALL Checks (100+ checks)                                  │  │   │
│   │  │  ✅ API access                                                │  │   │
│   │  │  ✅ Auto-refresh                                              │  │   │
│   │  │  ✅ EventBridge integration                                   │  │   │
│   │  │  ✅ Organizational view                                       │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tóm tắt Access

| Feature | Basic/Developer | Business+/Enterprise |
|---------|-----------------|---------------------|
| **Service Limits** | ✅ All | ✅ All |
| **Security** | ⚠️ 6 core checks | ✅ All |
| **Cost Optimization** | ❌ | ✅ All |
| **Performance** | ❌ | ✅ All |
| **Fault Tolerance** | ⚠️ Limited | ✅ All |
| **API Access** | ❌ | ✅ |
| **Auto Refresh** | ❌ | ✅ Weekly |
| **EventBridge** | ❌ | ✅ |

---

## Integration với AWS Services

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Trusted Advisor Integrations                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Trusted Advisor                                                           │
│        │                                                                    │
│        ├──────────► EventBridge                                             │
│        │            → Trigger automation khi có recommendation mới          │
│        │            → Notify via SNS                                        │
│        │                                                                    │
│        ├──────────► Organizations                                           │
│        │            → Organizational view across all accounts               │
│        │                                                                    │
│        ├──────────► AWS Config                                              │
│        │            → Some checks powered by Config rules                   │
│        │                                                                    │
│        └──────────► Security Hub                                            │
│                     → View findings in Security Hub                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Trusted Advisor vs Các Services Khác

| Service | Focus | Khác biệt |
|---------|-------|-----------|
| **Trusted Advisor** | Best practices recommendations | 5 pillars: Cost, Performance, Security, Fault Tolerance, Limits |
| **AWS Config** | Configuration compliance | Track config changes, evaluate rules |
| **Security Hub** | Security findings aggregation | Aggregate từ nhiều services |
| **Cost Explorer** | Cost analysis | Deep dive vào chi phí |
| **Compute Optimizer** | EC2/Lambda sizing | Right-sizing recommendations |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         When to Use What?                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  "Tôi muốn biết AWS best practices chung?"                                  │
│  → Trusted Advisor                                                          │
│                                                                             │
│  "Tôi muốn track config changes và compliance?"                             │
│  → AWS Config                                                               │
│                                                                             │
│  "Tôi muốn aggregate security findings?"                                    │
│  → Security Hub                                                             │
│                                                                             │
│  "Tôi muốn deep dive vào costs?"                                            │
│  → Cost Explorer                                                            │
│                                                                             │
│  "Tôi muốn right-size EC2 instances?"                                       │
│  → Compute Optimizer                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Trusted Advisor Priority (Enterprise)

Dành cho **Enterprise Support** - AWS Technical Account Manager (TAM) sẽ:
- Ưu tiên recommendations quan trọng nhất
- Tư vấn cách fix
- Track progress

---

## Key Checks to Remember (Exam)

### Security Checks (Available in Basic!)

| Check | Phát hiện gì? |
|-------|---------------|
| **S3 Bucket Permissions** | Buckets public |
| **Security Groups - SSH** | Port 22 open to 0.0.0.0/0 |
| **MFA on Root Account** | Root không có MFA |
| **IAM Use** | Không sử dụng IAM users |
| **EBS/RDS Public Snapshots** | Snapshots public |

### Cost Checks (Business+)

| Check | Phát hiện gì? |
|-------|---------------|
| **Idle EC2** | Instances không dùng |
| **Unassociated EIP** | EIPs tốn tiền |
| **Underutilized EBS** | Volumes không dùng |
| **Reserved Instance** | Đề xuất mua RI |

---

## Pricing

**Trusted Advisor là FREE** - nhưng access phụ thuộc vào Support Plan:

| Support Plan | Monthly Cost | Trusted Advisor Access |
|--------------|--------------|------------------------|
| Basic | $0 | Limited (6 security + service limits) |
| Developer | $29+ | Limited |
| Business+ | $100+ | **FULL ACCESS** |
| Enterprise | $15,000+ | **FULL ACCESS** + Priority |

---

## Tóm tắt

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS Trusted Advisor Summary                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎯 WHAT: Best practices recommendations service                            │
│                                                                             │
│  📊 5 CATEGORIES:                                                           │
│     💰 Cost Optimization - Tìm cách tiết kiệm                               │
│     ⚡ Performance - Cải thiện hiệu suất                                     │
│     🔐 Security - Phát hiện lỗ hổng                                         │
│     🔄 Fault Tolerance - Tăng availability                                  │
│     📊 Service Limits - Check quotas                                        │
│                                                                             │
│  🔑 REMEMBER FOR EXAM:                                                      │
│     ┌───────────────────────────────────────────────────────────────────┐   │
│     │  BASIC SUPPORT có sẵn:                                            │   │
│     │    ✅ Service Limits (all)                                        │   │
│     │    ✅ 6 Core Security checks                                      │   │
│     │                                                                   │   │
│     │  BUSINESS+ trở lên:                                               │   │
│     │    ✅ ALL checks (100+)                                           │   │
│     │    ✅ API access                                                  │   │
│     │    ✅ EventBridge integration                                     │   │
│     └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  💡 KEY INSIGHT:                                                            │
│     Trusted Advisor = "AWS Cloud Expert giving you advice"                  │
│     (dựa trên best practices từ hàng trăm ngàn customers)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Trusted Advisor Documentation](https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html)
- [Trusted Advisor Check Reference](https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor-check-reference.html)
- [AWS Support Plans](https://aws.amazon.com/premiumsupport/plans/)
