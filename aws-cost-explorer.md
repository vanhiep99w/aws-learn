# AWS Cost Explorer


## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng chính](#tính-năng-chính)
- [Các loại Cost Views](#các-loại-cost-views)
- [Forecasting (Dự báo chi phí)](#forecasting-dự-báo-chi-phí)
- [Charge Types (Loại phí)](#charge-types-loại-phí)
- [Rightsizing Recommendations](#rightsizing-recommendations)
- [Reserved Instance Recommendations](#reserved-instance-recommendations)
- [Cost Explorer API](#cost-explorer-api)
- [Granularity Options](#granularity-options)
- [So sánh với các công cụ khác](#so-sánh-với-các-công-cụ-khác)
- [Best Practices](#best-practices)
- [Natural Language Queries (Amazon Q)](#natural-language-queries-amazon-q)
- [Enabling Cost Explorer](#enabling-cost-explorer)
- [Tóm tắt](#tóm-tắt)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Cost Explorer** là công cụ quản lý chi phí đám mây cho phép bạn:
- **Visualize** - Xem và phân tích chi phí AWS theo thời gian
- **Understand** - Hiểu rõ chi phí và mức sử dụng
- **Manage** - Quản lý và tối ưu hóa chi phí

```
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Cost Explorer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Historical │  │   Current   │  │       Forecasted        │  │
│  │    Data     │  │   Month     │  │      Future Costs       │  │
│  │  13 months  │  │             │  │      18 months          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Cost & Usage Reports                     ││
│  │  • Preconfigured Views    • Custom Reports                  ││
│  │  • Filtering & Grouping   • CSV Export                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Recommendations                          ││
│  │  • Reserved Instance      • Savings Plans                   ││
│  │  • Rightsizing            • Cost Optimization               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Tính năng chính

### 1. Xem dữ liệu lịch sử và dự báo

| Loại dữ liệu | Thời gian | Mô tả |
|--------------|-----------|-------|
| **Historical Data** | 13 tháng gần nhất | Dữ liệu chi phí và sử dụng trong quá khứ |
| **Current Month** | Tháng hiện tại | Cập nhật ít nhất mỗi 24 giờ |
| **Forecast** | 18 tháng tương lai | Dự báo chi phí dựa trên patterns hiện tại |

> [!NOTE]
> Khi bạn đăng ký Cost Explorer lần đầu, dữ liệu tháng hiện tại sẽ available trong ~24 giờ. Dữ liệu lịch sử sẽ mất thêm vài ngày.

### 2. Preconfigured Views (Báo cáo có sẵn)

Cost Explorer cung cấp các báo cáo được cấu hình sẵn:

```
┌──────────────────────────────────────────────────────────────┐
│                    Default Reports                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Cost & Usage Reports                                     │
│     • Monthly costs by service                               │
│     • Daily costs                                            │
│     • Monthly costs by linked account                        │
│                                                              │
│  📈 Reservation Reports                                      │
│     • RI utilization                                         │
│     • RI coverage                                            │
│     • Savings Plans utilization                              │
│     • Savings Plans coverage                                 │
│                                                              │
│  💡 Recommendations                                          │
│     • Reserved Instance recommendations                      │
│     • Savings Plans recommendations                          │
│     • Rightsizing recommendations                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3. Filtering & Grouping

Cost Explorer cho phép lọc và nhóm dữ liệu theo nhiều dimensions:

| Filter Category | Options |
|-----------------|---------|
| **Service** | EC2, S3, Lambda, RDS, etc. |
| **Linked Account** | Individual accounts trong Organizations |
| **Region** | us-east-1, eu-west-1, ap-southeast-1, etc. |
| **Instance Type** | t2.micro, m5.large, c5.xlarge, etc. |
| **Usage Type** | Data Transfer, Running Hours, Storage, etc. |
| **Tag** | User-defined cost allocation tags |
| **Availability Zone** | AZs within a Region |
| **Purchase Option** | On-Demand, Reserved, Spot, Savings Plans |
| **Charge Type** | Usage, Tax, Credit, Refund, etc. |

---

## Các loại Cost Views

### Cost Metrics giải thích

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cost Metrics Types                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ UNBLENDED COSTS                                         │    │
│  │ Chi phí gốc trước khi áp dụng discounts                 │    │
│  │ → Hiển thị chi phí theo giá on-demand                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ NET UNBLENDED COSTS                                     │    │
│  │ Chi phí sau khi áp dụng discounts                       │    │
│  │ → Loại trừ RI Volume Discounts                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ AMORTIZED COSTS                                         │    │
│  │ Chi phí RI/Savings Plans trải đều theo thời gian        │    │
│  │ → Upfront fees phân bổ theo usage period                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ NET AMORTIZED COSTS                                     │    │
│  │ Amortized costs + post-discount                         │    │
│  │ → True cost với discounts đã áp dụng                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### So sánh các loại Cost

| Cost Type | Mô tả | Use Case |
|-----------|-------|----------|
| **Unblended** | Chi phí on-demand gốc | Xem chi phí thực tế theo giá list |
| **Net Unblended** | Chi phí sau discounts | Xem chi phí thực tế đã áp dụng giảm giá |
| **Amortized** | RI/SP fees trải đều | Phân tích chi phí RI/Savings Plans |
| **Net Amortized** | Amortized + discounts | Chi phí thực tế nhất với commitments |

---

## Forecasting (Dự báo chi phí)

### Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cost Forecasting                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Historical Usage Data                                          │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────┐                                            │
│  │ Machine Learning│                                            │
│  │    Algorithm    │                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Forecast Output                            │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  Upper Bound ─────────────────────              │    │    │
│  │  │                                     \           │    │    │
│  │  │  Mean Forecast ───────────────────── \          │    │    │
│  │  │                                       \         │    │    │
│  │  │  Lower Bound ──────────────────────────\        │    │    │
│  │  │                                                 │    │    │
│  │  │  ◄─────── 80% Prediction Interval ──────►       │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Các điểm quan trọng về Forecast

| Aspect | Chi tiết |
|--------|----------|
| **Prediction Interval** | 80% (mặc định) |
| **Forecast Range** | Lên đến 18 tháng tương lai |
| **Minimum Data Required** | Ít nhất 1 billing cycle đầy đủ |
| **AI Explanations** | Giải thích các yếu tố ảnh hưởng đến dự báo |
| **Discounts** | Được bao gồm mặc định trong forecast |

> [!IMPORTANT]
> Nếu AWS không có đủ dữ liệu để đạt 80% prediction interval, Cost Explorer sẽ KHÔNG cung cấp forecast. Điều này thường xảy ra với accounts mới.

---

## Charge Types (Loại phí)

### Bảng các loại Charge Type

| Charge Type | Mô tả |
|-------------|-------|
| **Usage** | Chi phí sử dụng on-demand (không có RI discount) |
| **Reservation applied usage** | Chi phí sử dụng đã được áp dụng RI discount |
| **Upfront reservation fee** | Phí trả trước khi mua All/Partial Upfront RI |
| **Recurring reservation fee** | Phí định kỳ hàng tháng cho Partial/No Upfront RI |
| **Savings Plan covered usage** | Chi phí được cover bởi Savings Plan |
| **Savings Plan recurring fee** | Phí định kỳ cho Savings Plan |
| **Savings Plan upfront fee** | Phí trả trước cho Savings Plan |
| **Credit** | AWS credits được áp dụng |
| **Refund** | Hoàn tiền (hiển thị là số âm) |
| **Tax** | Thuế (VAT, GST, etc.) |
| **Support fee** | Phí support plan hàng tháng |

### AWS Credits là gì?

**AWS Credits** = Voucher/tiền thưởng từ AWS để trừ vào hóa đơn.

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS CREDIT                               │
├─────────────────────────────────────────────────────────────────┤
│  Value:    $100                                                 │
│  Expires:  July 2024                                            │
│  Valid for: EC2, S3                                             │
│                                                                 │
│  → Giống voucher giảm giá, tự động trừ vào bill                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Nguồn nhận AWS Credits

| Nguồn | Mô tả |
|-------|-------|
| **AWS Activate** | Chương trình cho startups (lên đến $100,000) |
| **AWS Educate** | Cho sinh viên/giáo viên |
| **Promotional credits** | Khuyến mãi từ AWS events, workshops |
| **Support refunds** | AWS hoàn tiền khi có sự cố |
| **Partner programs** | Qua các đối tác AWS |

#### Cách AWS áp dụng nhiều Credits

> [!IMPORTANT]
> **Exam Tip**: AWS áp dụng credits theo thứ tự ưu tiên:
> 1. **Hết hạn sớm nhất trước** (earliest expiring first)
> 2. **Ít linh hoạt nhất trước** (nếu cùng ngày hết hạn)

**Ví dụ thực tế:**

```
Credits có:
├── Credit 1: $100 (cho EC2 hoặc S3, hết hạn July)  ← Apply trước
└── Credit 2: $50  (chỉ cho EC2, hết hạn Dec)

Hóa đơn:
├── EC2: $1,000
└── S3:  $500
─────────────────
Tổng:   $1,500

Sau khi apply credits:
├── Credit 1 ($100) → trừ vào EC2 hoặc S3
├── Credit 2 ($50)  → trừ vào EC2
─────────────────
Bạn phải trả: $1,500 - $150 = $1,350
```

> [!NOTE]
> Tất cả credits được apply **cùng lúc** trong 1 billing cycle, không phải chọn 1 credit để dùng.

---

## Rightsizing Recommendations

Cost Explorer cung cấp đề xuất tối ưu hóa cho EC2 instances:

```
┌─────────────────────────────────────────────────────────────────┐
│                  Rightsizing Recommendations                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Underutilized EC2                       │    │
│  │                                                         │    │
│  │  Current: m5.2xlarge     │     Recommendation:          │    │
│  │  vCPU: 8                 │     DOWNSIZE to m5.large     │    │
│  │  Memory: 32 GB           │     vCPU: 2, Memory: 8 GB    │    │
│  │  Avg CPU: 5%             │                              │    │
│  │                          │     Savings: $120/month      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Idle EC2                             │    │
│  │                                                         │    │
│  │  Instance: i-0abc123     │     Recommendation:          │    │
│  │  Running: 720 hours      │     TERMINATE instance       │    │
│  │  Avg CPU: 0.5%           │                              │    │
│  │  Network: Minimal        │     Savings: $85/month       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Loại Recommendations

| Type | Mô tả | Action |
|------|-------|--------|
| **Downsize** | Instance quá lớn so với usage | Chuyển sang instance type nhỏ hơn |
| **Terminate** | Instance gần như không sử dụng | Tắt/xóa instance |
| **Modify** | Thay đổi cấu hình | Điều chỉnh specs phù hợp hơn |

---

## Reserved Instance Recommendations

```
┌─────────────────────────────────────────────────────────────────┐
│              Reserved Instance Recommendations                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Based on your usage patterns, we recommend:                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Instance Type: m5.large                                │    │
│  │  Region: us-east-1                                      │    │
│  │  Payment Option: Partial Upfront                        │    │
│  │  Term: 1 Year                                           │    │
│  │                                                         │    │
│  │  Current On-Demand Cost:    $1,200/month                │    │
│  │  With Reserved Instance:    $780/month                  │    │
│  │  ─────────────────────────────────────                  │    │
│  │  Estimated Monthly Savings: $420 (35%)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AWS Services hỗ trợ Reservations

> [!IMPORTANT]
> **Exam Tip**: Câu hỏi thường gặp - "Which AWS services support reservations to optimize costs?"

| Service | Loại Reservation | Max Savings |
|---------|-----------------|-------------|
| **Amazon EC2** | Reserved Instances, Savings Plans | Lên đến 72% |
| **Amazon RDS** | Reserved DB Instances | Lên đến 69% |
| **Amazon DynamoDB** | Reserved Capacity | Lên đến 77% |
| **Amazon Redshift** | Reserved Nodes | Lên đến 75% |
| **Amazon ElastiCache** | Reserved Cache Nodes | Lên đến 55% |
| **Amazon OpenSearch** | Reserved Instances | Lên đến 60% |
| **Amazon SageMaker** | Savings Plans | Lên đến 64% |
| **AWS Lambda** | ❌ KHÔNG có (pay per invocation) | - |
| **Amazon S3** | ❌ KHÔNG có (chỉ có Storage Classes) | - |
| **Amazon SQS/SNS** | ❌ KHÔNG có (pay per request) | - |
| **Amazon DocumentDB** | ❌ KHÔNG có | - |
| **AWS API Gateway** | ❌ KHÔNG có | - |

**Quy tắc nhớ nhanh:**
- ✅ **CÓ Reservations**: Services chạy **liên tục** (compute instances, databases)
- ❌ **KHÔNG có Reservations**: Services **serverless/pay-per-use** (Lambda, S3, SQS)

---

## Cost Explorer API

### Pricing

| Method | Cost |
|--------|------|
| **Console UI** | FREE |
| **API Request** | $0.01 per paginated request |

> [!CAUTION]
> Một khi đã enable Cost Explorer, bạn KHÔNG thể disable nó.

### API Use Cases

```python
# Ví dụ sử dụng Cost Explorer API với boto3
import boto3
from datetime import datetime, timedelta

client = boto3.client('ce')

# Lấy chi phí theo service trong 30 ngày qua
response = client.get_cost_and_usage(
    TimePeriod={
        'Start': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
        'End': datetime.now().strftime('%Y-%m-%d')
    },
    Granularity='MONTHLY',
    Metrics=['UnblendedCost'],
    GroupBy=[
        {'Type': 'DIMENSION', 'Key': 'SERVICE'}
    ]
)
```

### Các API Operations chính

| Operation | Mô tả |
|-----------|-------|
| `GetCostAndUsage` | Lấy dữ liệu chi phí và usage |
| `GetCostForecast` | Lấy dự báo chi phí |
| `GetReservationCoverage` | Xem RI coverage |
| `GetReservationUtilization` | Xem RI utilization |
| `GetRightsizingRecommendation` | Lấy đề xuất rightsizing |
| `GetSavingsPlansCoverage` | Xem Savings Plans coverage |
| `GetSavingsPlansUtilization` | Xem Savings Plans utilization |

---

## Granularity Options

### Các mức độ chi tiết dữ liệu

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Granularity                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │   MONTHLY   │ ← Default                                      │
│  │             │   Tổng hợp chi phí theo tháng                  │
│  └─────────────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │    DAILY    │ ← Standard                                     │
│  │             │   Chi phí từng ngày                            │
│  └─────────────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │   HOURLY    │ ← Requires opt-in                              │
│  │             │   Chi phí từng giờ (thêm phí)                  │
│  └─────────────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │  RESOURCE   │ ← Requires opt-in                              │
│  │   LEVEL     │   Chi phí theo từng resource ID                │
│  └─────────────┘                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **Hourly** và **Resource-level** granularity cần được enable trong Cost Explorer settings và có thể phát sinh thêm chi phí storage.

---

## So sánh với các công cụ khác

| Feature | Cost Explorer | Budgets | Cost & Usage Reports |
|---------|---------------|---------|---------------------|
| **Visualization** | ✅ Interactive charts | ❌ No charts | ❌ Raw data only |
| **Forecasting** | ✅ 18 months | ✅ Limited | ❌ No |
| **Alerts** | ❌ No | ✅ Yes | ❌ No |
| **Custom Reports** | ✅ Save & share | ❌ No | ✅ Detailed CSVs |
| **API Access** | ✅ Paid | ✅ Free | ✅ S3 delivery |
| **Granularity** | Day/Hour/Resource | Month | Hour/Resource |
| **Recommendations** | ✅ RI, SP, Rightsizing | ❌ No | ❌ No |

---

## Best Practices

### 1. Cost Allocation Tags

```
┌─────────────────────────────────────────────────────────────────┐
│                   Cost Allocation Strategy                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sử dụng tags để tracking chi phí theo:                         │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Environment   │  │     Project     │  │    Cost Center  │  │
│  │   - prod        │  │   - project-a   │  │   - marketing   │  │
│  │   - staging     │  │   - project-b   │  │   - engineering │  │
│  │   - dev         │  │   - project-c   │  │   - finance     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │      Team       │  │   Application   │  │      Owner      │  │
│  │   - frontend    │  │   - web-app     │  │   - john@co.com │  │
│  │   - backend     │  │   - api         │  │   - jane@co.com │  │
│  │   - devops      │  │   - database    │  │   - team-alpha  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Regular Review Cadence

| Frequency | Focus Areas |
|-----------|-------------|
| **Daily** | Anomaly detection, unexpected spikes |
| **Weekly** | Service-level costs, team budgets |
| **Monthly** | Overall trends, RI/SP utilization |
| **Quarterly** | Rightsizing, RI/SP purchases |

### 3. Kết hợp với các công cụ khác

```
                    ┌──────────────────┐
                    │   AWS Budgets    │
                    │   (Set alerts)   │
                    └────────┬─────────┘
                             │
                             ▼
┌───────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ Cost Explorer │───▶│  Analysis Loop   │───▶│ Cost Optimization  │
│ (Analyze)     │    │                  │    │ Hub (Implement)    │
└───────────────┘    └──────────────────┘    └────────────────────┘
        ▲                    │
        │                    ▼
        │            ┌──────────────────┐
        └────────────│ Cost & Usage     │
                     │ Reports (Deep    │
                     │ analysis)        │
                     └──────────────────┘
```

---

## Natural Language Queries (Amazon Q)

Cost Explorer tích hợp với **Amazon Q Developer** cho phép hỏi đáp bằng ngôn ngữ tự nhiên:

### Ví dụ câu hỏi

| Question | Giải thích |
|----------|----------|
| "Which region had the largest cost increase last month?" | Tìm region có chi phí tăng nhiều nhất |
| "What were my highest-cost services last quarter?" | Top services tốn kém nhất |
| "Why did my EC2 costs spike on January 15th?" | Phân tích nguyên nhân tăng đột biến |
| "How much am I spending on unused resources?" | Tìm resources lãng phí |

---

## Enabling Cost Explorer

### Bước kích hoạt

1. Đăng nhập AWS Management Console với **management account** (root account trong Organizations)
2. Navigate đến **Billing and Cost Management** console
3. Chọn **Cost Explorer** từ navigation pane
4. Click **Enable Cost Explorer**
5. Đợi ~24 giờ để dữ liệu được chuẩn bị

> [!WARNING]
> Chỉ **management account** (payer account) mới có thể enable Cost Explorer cho toàn bộ organization. Member accounts có thể xem dữ liệu của riêng mình sau khi được enable.

---

## Tóm tắt

| Aspect | Chi tiết |
|--------|----------|
| **Mục đích** | Visualize, understand, và manage AWS costs |
| **Historical Data** | 13 tháng |
| **Forecast** | 18 tháng |
| **Console Cost** | FREE |
| **API Cost** | $0.01/request |
| **Granularity** | Monthly, Daily, Hourly, Resource-level |
| **Key Features** | Reports, Forecasting, Recommendations, Filtering |

### Khi nào sử dụng Cost Explorer?

- ✅ Phân tích chi phí và trends
- ✅ Xác định cost drivers
- ✅ Lập forecast và budget planning
- ✅ Tìm opportunities tối ưu (rightsizing, RI/SP)
- ✅ Compare costs across time periods
- ✅ Build custom cost reports

---

## Tài liệu tham khảo

- [AWS Cost Explorer Official Page](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)
- [Cost Explorer User Guide](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)
- [Cost Explorer API Reference](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/Welcome.html)
- [Rightsizing Recommendations](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-rightsizing.html)
