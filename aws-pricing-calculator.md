# AWS Pricing Calculator


## Mục lục

- [Tổng quan](#tổng-quan)
- [Đặc điểm chính](#đặc-điểm-chính)
- [Cách sử dụng](#cách-sử-dụng)
- [Các thông số cần configure](#các-thông-số-cần-configure)
- [Pricing Options trong Calculator](#pricing-options-trong-calculator)
- [Export & Share Options](#export-share-options)
- [Groups - Tổ chức Estimates](#groups-tổ-chức-estimates)
- [So sánh với các Cost Tools khác](#so-sánh-với-các-cost-tools-khác)
- [Tips sử dụng hiệu quả](#tips-sử-dụng-hiệu-quả)
- [Use Cases thực tế](#use-cases-thực-tế)
- [Exam Tips cho Cloud Practitioner](#exam-tips-cho-cloud-practitioner)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**AWS Pricing Calculator** là công cụ **miễn phí** của AWS giúp bạn ước tính chi phí sử dụng AWS services **trước khi** thực sự sử dụng chúng.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Pricing Calculator                       │
│            https://calculator.aws                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   "Estimate your AWS costs BEFORE you deploy"                   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Select Services → Configure → Get Estimate → Share    │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ✅ Free to use                                                │
│   ✅ No AWS account required                                    │
│   ✅ Shareable estimates via link                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**URL:** [https://calculator.aws](https://calculator.aws)

---

## Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Free** | Hoàn toàn miễn phí |
| **No Account Required** | Không cần AWS account để sử dụng |
| **170+ Services** | Hỗ trợ hầu hết AWS services |
| **Shareable** | Chia sẻ estimates qua link/export |
| **Region-aware** | Giá khác nhau theo region |
| **Compare Options** | So sánh các pricing options |

---

## Cách sử dụng

### Workflow cơ bản

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pricing Calculator Workflow                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Estimate                                             │
│     └── Đặt tên cho estimate                                    │
│                                                                 │
│  2. Add Service                                                 │
│     └── Chọn service (EC2, S3, RDS...)                          │
│                                                                 │
│  3. Configure Service                                           │
│     ├── Chọn Region                                             │
│     ├── Chọn instance type/storage class                        │
│     ├── Nhập usage (hours, GB, requests...)                     │
│     └── Chọn pricing option (On-Demand, Reserved...)            │
│                                                                 │
│  4. Review Estimate                                             │
│     ├── Monthly cost                                            │
│     ├── Upfront cost (nếu có)                                   │
│     └── 12-month total                                          │
│                                                                 │
│  5. Export/Share                                                │
│     ├── Share link                                              │
│     ├── Export CSV                                              │
│     └── Export PDF                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-step

1. **Truy cập** [calculator.aws](https://calculator.aws)
2. **Create estimate** → Đặt tên
3. **Add service** → Tìm và chọn service
4. **Configure** → Điền thông số
5. **Add to estimate**
6. Lặp lại cho các services khác
7. **Export/Share** khi hoàn thành

---

## Các thông số cần configure

### EC2 Example

```
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 Configuration                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Basic Settings:                                                │
│  ├── Region: ap-southeast-1 (Singapore)                         │
│  ├── OS: Linux                                                  │
│  ├── Quantity: 2 instances                                      │
│  └── Usage: 730 hours/month (24/7)                              │
│                                                                 │
│  Instance Type:                                                 │
│  ├── Family: t3                                                 │
│  ├── Size: medium                                               │
│  └── vCPU: 2, Memory: 4 GB                                      │
│                                                                 │
│  Pricing Strategy:                                              │
│  ├── On-Demand                                                  │
│  ├── Reserved (1yr/3yr, No/Partial/All Upfront)                 │
│  └── Savings Plans                                              │
│                                                                 │
│  Storage (EBS):                                                 │
│  ├── Type: gp3                                                  │
│  ├── Size: 100 GB                                               │
│  └── IOPS/Throughput: default                                   │
│                                                                 │
│  Data Transfer:                                                 │
│  ├── Inbound: Free                                              │
│  └── Outbound: 100 GB/month                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### S3 Example

| Parameter | Value |
|-----------|-------|
| Storage Class | S3 Standard |
| Storage Amount | 500 GB |
| PUT/COPY/POST requests | 100,000/month |
| GET/SELECT requests | 1,000,000/month |
| Data Transfer Out | 50 GB/month |

### RDS Example

| Parameter | Value |
|-----------|-------|
| Engine | MySQL |
| Instance Type | db.t3.medium |
| Deployment | Multi-AZ |
| Storage | 200 GB gp3 |
| Backup Storage | 50 GB |

---

## Pricing Options trong Calculator

### EC2 Pricing Options

```
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 Pricing Comparison                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  On-Demand ($100/month ví dụ)                                   │
│  ├── Flexibility: ★★★★★                                         │
│  ├── Commitment: None                                           │
│  └── Discount: 0%                                               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Reserved Instance - 1 Year                                     │
│  ├── No Upfront:      ~$75/month (25% off)                      │
│  ├── Partial Upfront: ~$70/month (30% off)                      │
│  └── All Upfront:     ~$65/month (35% off)                      │
│                                                                 │
│  Reserved Instance - 3 Year                                     │
│  ├── No Upfront:      ~$55/month (45% off)                      │
│  ├── Partial Upfront: ~$50/month (50% off)                      │
│  └── All Upfront:     ~$40/month (60% off)                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Savings Plans                                                  │
│  ├── Compute SP: Flexible (any instance)                        │
│  └── EC2 Instance SP: Specific instance family                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Export & Share Options

| Option | Format | Use Case |
|--------|--------|----------|
| **Share Link** | URL | Chia sẻ với team/manager |
| **Export CSV** | .csv | Import vào Excel/Sheets |
| **Export PDF** | .pdf | Báo cáo/proposal |

---

## Groups - Tổ chức Estimates

Bạn có thể nhóm services theo:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Estimate with Groups                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  My Application Estimate                                        │
│  ├── 📁 Production Environment         $2,500/month             │
│  │   ├── EC2 (4 instances)                                      │
│  │   ├── RDS Multi-AZ                                           │
│  │   ├── ElastiCache                                            │
│  │   └── S3 + CloudFront                                        │
│ │                                                               │
│  ├── 📁 Staging Environment            $800/month               │
│  │   ├── EC2 (2 instances)                                      │
│  │   └── RDS Single-AZ                                          │
│ │                                                               │
│  └── 📁 Development Environment        $300/month               │
│      ├── EC2 (1 instance)                                       │
│      └── RDS Single-AZ                                          │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│  TOTAL MONTHLY:                        $3,600/month             │
│  TOTAL 12-MONTH:                       $43,200/year             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## So sánh với các Cost Tools khác

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Pricing Calculator** | Estimate **trước** khi deploy | Planning, budgeting, proposals |
| **AWS Cost Explorer** | Analyze **sau** khi deploy | Monitor actual spending |
| **AWS Budgets** | Set alerts cho spending | Cost control, notifications |
| **Cost & Usage Report** | Detailed billing data | Deep analysis, chargeback |

```
┌────────────────────────────────────────────────────────────────┐
│                   AWS Cost Management Tools                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   BEFORE deployment:                                           │
│   └── AWS Pricing Calculator (estimate)                        │
│                                                                │
│   AFTER deployment:                                            │
│   ├── AWS Cost Explorer (analyze historical costs)             │
│   ├── AWS Budgets (set spending limits & alerts)               │
│   └── Cost & Usage Report (detailed breakdown)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Tips sử dụng hiệu quả

### 1. Đừng quên các chi phí ẩn

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hidden Costs to Consider                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️ Data Transfer Out                                            │
│     └── Internet egress không free (sau 100GB/month)            │
│                                                                 │
│  ⚠️ Cross-Region/Cross-AZ Transfer                               │
│     └── Traffic giữa regions/AZs tính phí                       │
│                                                                 │
│  ⚠️ API Requests                                                 │
│     └── S3 PUT/GET, Lambda invocations...                       │
│                                                                 │
│  ⚠️ Snapshots & Backups                                          │
│     └── EBS snapshots, RDS backups...                           │
│                                                                 │
│  ⚠️ NAT Gateway                                                  │
│     └── Hourly charge + data processing                         │
│                                                                 │
│  ⚠️ Elastic IPs (unused)                                         │
│     └── Tính phí nếu không attach                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Compare Regions

- Giá khác nhau đáng kể giữa regions
- US regions thường rẻ nhất
- Asia Pacific thường đắt hơn 10-20%

### 3. Use Groups

- Nhóm theo environment (prod/staging/dev)
- Nhóm theo team/department
- Dễ so sánh và track

---

## Use Cases thực tế

### 1. Budget Proposal

```
Scenario: Cần estimate chi phí cho dự án mới trình management

Steps:
1. List tất cả services cần dùng
2. Tạo estimate với 3 options:
   - Minimal: On-Demand, smallest instances
   - Recommended: Balanced cost/performance
   - Enterprise: Reserved, Multi-AZ, HA
3. Export PDF
4. Trình bày các trade-offs
```

### 2. Migration Planning

```
Scenario: Migrate từ on-premises lên AWS

Steps:
1. Map current infra → AWS equivalents
2. Estimate với multiple regions
3. Compare On-Demand vs Reserved
4. Include data transfer costs
5. Calculate TCO (Total Cost of Ownership)
```

### 3. Cost Optimization

```
Scenario: Đang dùng On-Demand, muốn tối ưu

Steps:
1. Export current usage từ Cost Explorer
2. Nhập vào Pricing Calculator
3. Compare với Reserved/Savings Plans
4. Calculate potential savings
5. Propose commitment term
```

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ AWS Pricing Calculator:**
> - Estimate costs **BEFORE** deploying
> - **Free** to use
> - **No AWS account** required
> - Compare pricing options
> - Export/Share estimates

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Tool nào estimate chi phí trước khi deploy? | **AWS Pricing Calculator** |
| Cost Explorer hay Pricing Calculator để forecast? | **Pricing Calculator** (trước deploy) |
| Cần AWS account để dùng Pricing Calculator? | **KHÔNG** cần |
| Tool nào analyze chi phí đã phát sinh? | **Cost Explorer** (không phải Calculator) |

### Phân biệt các Cost Tools

```
┌─────────────────────────┬─────────────────────────────────────┐
│         Tool            │              Purpose                │
├─────────────────────────┼─────────────────────────────────────┤
│ Pricing Calculator      │ Estimate TRƯỚC khi deploy           │
│ Cost Explorer           │ Analyze SAU khi deploy              │
│ Budgets                 │ Set alerts khi vượt ngưỡng          │
│ Trusted Advisor         │ Cost optimization recommendations   │
│ Compute Optimizer       │ Right-sizing EC2/EBS/Lambda         │
└─────────────────────────┴─────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                AWS Pricing Calculator Summary                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Estimate AWS costs BEFORE deploying                         │
│  ✅ Free, no AWS account required                               │
│  ✅ 170+ services supported                                     │
│  ✅ Compare On-Demand vs Reserved vs Savings Plans              │
│  ✅ Export to PDF/CSV, share via link                           │
│  ✅ Group services by environment/project                       │
│                                                                 │
│  URL: https://calculator.aws                                    │
│                                                                 │
│  Nhớ: "Pricing Calculator = ƯỚC TÍNH trước khi dùng"            │
│       "Cost Explorer = PHÂN TÍCH sau khi dùng"                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
