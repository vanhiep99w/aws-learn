# AWS Cost Anomaly Detection

## Mục lục

- [Tổng quan](#tổng-quan)
- [Vấn đề giải quyết](#vấn-đề-giải-quyết)
- [Cách hoạt động](#cách-hoạt-động)
- [Cost Monitors](#cost-monitors)
- [Alert Subscriptions](#alert-subscriptions)
- [Detected Anomalies và Root Cause](#detected-anomalies-và-root-cause)
- [Tích hợp thông báo](#tích-hợp-thông-báo)
- [Thiết lập nhanh](#thiết-lập-nhanh)
- [Best Practices](#best-practices)
- [So sánh với AWS Budgets và Cost Explorer](#so-sánh-với-aws-budgets-và-cost-explorer)
- [Lưu ý quan trọng](#lưu-ý-quan-trọng)
- [Use Cases](#use-cases)
- [Tóm tắt](#tóm-tắt)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Cost Anomaly Detection** là tính năng trong **AWS Billing and Cost Management** dùng **machine learning** để phát hiện các mẫu chi tiêu AWS bất thường và gửi cảnh báo khi chi phí tăng ngoài kỳ vọng.

Dịch vụ này giúp trả lời các câu hỏi như:

- Tại sao bill hôm nay tăng đột biến?
- Service/account/Region/usage type nào gây tăng chi phí?
- Có workload nào bị cấu hình sai, chạy quá mức, hoặc phát sinh usage ngoài kế hoạch không?
- Có cần cảnh báo ngay khi anomaly xảy ra thay vì chờ cuối tháng không?

```
┌─────────────────────────────────────────────────────────────────┐
│                  AWS Cost Anomaly Detection                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Billing Data / Cost Explorer Data                              │
│              │                                                  │
│              ▼                                                  │
│  ┌───────────────────────────────┐                              │
│  │ ML-based anomaly detection    │                              │
│  │ • Seasonality                 │                              │
│  │ • Natural growth              │                              │
│  │ • Historical spend patterns   │                              │
│  └───────────────┬───────────────┘                              │
│                  │                                              │
│                  ▼                                              │
│  ┌───────────────────────────────┐                              │
│  │ Detected anomaly              │                              │
│  │ • Actual spend                │                              │
│  │ • Expected spend              │                              │
│  │ • Cost impact                 │                              │
│  │ • Root causes                 │                              │
│  └───────────────┬───────────────┘                              │
│                  │                                              │
│                  ▼                                              │
│  Email / SNS / Chat / EventBridge / User Notifications          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Vấn đề giải quyết

Nếu chỉ dùng báo cáo chi phí thủ công, bạn thường phát hiện vấn đề quá muộn:

| Vấn đề | Hậu quả |
|--------|---------|
| EC2/RDS bị quên tắt | Bill tăng từng ngày |
| Data transfer tăng bất thường | Khó tìm nguyên nhân nếu không theo dõi sát |
| NAT Gateway hoặc CloudWatch Logs tăng đột biến | Chi phí tăng nhưng không có alert sớm |
| Account con trong AWS Organizations phát sinh workload mới | Management account có thể phát hiện muộn |
| Service mới được bật nhầm | Cost Explorer chỉ giúp phân tích sau khi đã phát sinh |

**Cost Anomaly Detection** giúp phát hiện sớm các biến động bất thường thay vì chỉ đặt ngưỡng tĩnh như “vượt $1,000/tháng”.

---

## Cách hoạt động

Luồng cơ bản:

```
1. Tạo Cost Monitor
   └── Xác định phần chi phí cần theo dõi
       • AWS services
       • Linked accounts
       • Cost allocation tags
       • Cost categories

2. Tạo Alert Subscription
   └── Xác định ai nhận cảnh báo, qua kênh nào, và threshold nào
       • Email
       • Amazon SNS
       • Daily summary
       • Weekly summary
       • Individual alerts

3. AWS phân tích billing data bằng ML
   └── So sánh actual spend với expected spend

4. Khi phát hiện anomaly
   └── Gửi alert nếu anomaly đạt threshold
   └── Hiển thị trong Detected anomalies
   └── Cung cấp root cause để điều tra
```

Theo AWS, Cost Anomaly Detection dùng dữ liệu từ Cost Explorer và có thể có độ trễ tối đa khoảng **24 giờ**. Sau khi billing data được xử lý, dịch vụ chạy khoảng **3 lần mỗi ngày** để kiểm tra anomaly trên **net unblended cost**.

---

## Cost Monitors

**Cost Monitor** định nghĩa phạm vi chi phí mà bạn muốn theo dõi.

### Monitor dimensions

| Dimension | Khi nào dùng |
|-----------|--------------|
| **AWS services** | Theo dõi chi phí theo từng dịch vụ AWS, ví dụ EC2, S3, Lambda |
| **Linked account** | Theo dõi từng member account trong AWS Organizations |
| **Cost allocation tag** | Theo dõi theo tag như `Team`, `Project`, `Environment` |
| **Cost category** | Theo dõi theo nhóm business logic đã định nghĩa trong Cost Categories |

### AWS managed monitors vs customer managed monitors

| Loại monitor | Mô tả | Phù hợp khi |
|--------------|-------|-------------|
| **AWS managed monitor** | AWS tự động theo dõi tất cả giá trị trong dimension đã chọn | Muốn coverage rộng, ít cấu hình thủ công |
| **Customer managed monitor** | Bạn chọn cụ thể các giá trị cần theo dõi | Muốn theo dõi một số account/service/tag cụ thể |

Ví dụ:

```text
AWS managed monitor:
- Dimension: AWS services
- Tự động theo dõi tất cả AWS services có phát sinh chi phí

Customer managed monitor:
- Dimension: Linked account
- Chỉ theo dõi account A, B, C
```

> [!NOTE]
> Theo AWS docs, cost monitors cho linked accounts, cost allocation tags và cost categories chỉ có thể được tạo trong **management account**.

---

## Alert Subscriptions

**Alert Subscription** xác định cách nhận thông báo khi monitor phát hiện anomaly.

### Alerting frequency

| Frequency | Kênh | Mô tả |
|-----------|------|-------|
| **Individual alerts** | Amazon SNS | Gửi khi anomaly được phát hiện; có thể nhận nhiều alert trong ngày |
| **Daily summaries** | Email | Gửi summary hằng ngày về top anomalies của ngày trước |
| **Weekly summaries** | Email | Gửi summary hằng tuần |

### Threshold

Bạn có thể cấu hình threshold để chỉ nhận cảnh báo cho anomaly đáng chú ý.

AWS hỗ trợ hai kiểu threshold chính:

| Threshold type | Ý nghĩa |
|----------------|---------|
| **Absolute threshold** | Alert khi cost impact vượt một số tiền cụ thể, ví dụ `$100` |
| **Percentage threshold** | Alert khi cost impact percentage vượt tỷ lệ cụ thể, ví dụ `40%` so với expected spend |

Có thể kết hợp nhiều threshold bằng logic **AND** hoặc **OR**.

Ví dụ:

```text
Alert nếu:
- Cost impact >= $100
AND
- Cost impact percentage >= 40%
```

> [!IMPORTANT]
> Nếu anomaly thấp hơn alert threshold, nó vẫn có thể xuất hiện trong tab **Detected anomalies**. Threshold chỉ quyết định việc gửi alert, không phải việc model có phát hiện anomaly hay không.

---

## Detected Anomalies và Root Cause

Khi phát hiện anomaly, AWS hiển thị thông tin để điều tra:

| Thành phần | Ý nghĩa |
|------------|---------|
| **Actual spend** | Chi phí thực tế |
| **Expected spend** | Chi phí AWS kỳ vọng dựa trên pattern lịch sử |
| **Cost impact** | Chênh lệch giữa actual và expected spend |
| **Impact percentage** | Tỷ lệ chênh lệch so với expected spend |
| **Root causes** | Các yếu tố có khả năng gây anomaly |

Root cause analysis có thể phân tích theo các chiều như:

- **AWS service**
- **AWS account**
- **Region**
- **Usage type**

Ví dụ root cause:

```text
Anomaly: Chi phí tăng $480 so với expected spend

Root causes:
1. Service: Amazon EC2
   Account: prod-account
   Region: us-east-1
   Usage type: BoxUsage:m6i.4xlarge
   Estimated impact: $320

2. Service: NAT Gateway
   Account: analytics-account
   Region: ap-southeast-1
   Usage type: DataProcessing-Bytes
   Estimated impact: $160
```

---

## Tích hợp thông báo

Cost Anomaly Detection có thể gửi alert qua nhiều kênh:

```
┌──────────────────────────────┐
│ Cost Anomaly Detection       │
└───────────────┬──────────────┘
                │
        ┌───────┴────────┬───────────────┬────────────────────┐
        ▼                ▼               ▼                    ▼
      Email          Amazon SNS      EventBridge       User Notifications
                         │
                         ▼
                Slack / Amazon Chime
                qua AWS Chatbot hoặc
                Amazon Q Developer in chat applications
```

### Amazon SNS

Để gửi individual alerts qua SNS, topic cần cho phép service principal của Cost Anomaly Detection publish message:

```json
{
  "Sid": "AWSAnomalyDetectionSNSPublishingPermissions",
  "Effect": "Allow",
  "Principal": {
    "Service": "costalerts.amazonaws.com"
  },
  "Action": "SNS:Publish",
  "Resource": "arn:aws:sns:region:account-id:topic-name"
}
```

Có thể thêm điều kiện `aws:SourceAccount` hoặc `aws:SourceArn` để giảm rủi ro confused deputy.

---

## Thiết lập nhanh

Các bước trong console:

```text
Billing and Cost Management console
→ Cost Anomaly Detection
→ Cost monitors
→ Create monitor
→ Chọn monitor type
→ Tạo hoặc chọn alert subscription
→ Chọn frequency và threshold
→ Create monitor
```

Checklist thiết lập:

- [ ] Bật/đã có dữ liệu Cost Explorer
- [ ] Xác định phạm vi monitor: service, account, tag, hoặc cost category
- [ ] Chọn AWS managed monitor nếu muốn tự động bao phủ giá trị mới
- [ ] Chọn customer managed monitor nếu chỉ muốn theo dõi subset cụ thể
- [ ] Tạo alert subscription
- [ ] Đặt threshold hợp lý để tránh noise
- [ ] Với alert realtime, dùng SNS individual alerts
- [ ] Nếu dùng SNS encrypted topic, kiểm tra KMS key policy
- [ ] Gửi alert vào kênh vận hành như Slack/Chime nếu team cần phản ứng nhanh

---

## Best Practices

### 1. Bắt đầu với AWS managed monitor

Nếu dùng AWS Organizations, nên bắt đầu bằng managed monitor cho:

- **AWS services** để phát hiện service tăng bất thường
- **Linked account** để phát hiện account con phát sinh chi phí lạ

Managed monitor tự động bao phủ account/tag/category mới, giảm rủi ro quên cập nhật monitor.

### 2. Dùng Cost Allocation Tags cho team/project

Nếu tổ chức chargeback/showback theo team, hãy bật cost allocation tags như:

```text
Team=platform
Team=data
Project=mobile-app
Environment=prod
Environment=dev
```

Sau đó tạo monitor theo tag để phát hiện team/project nào tăng chi phí bất thường.

### 3. Chọn threshold theo mức độ vận hành

| Môi trường | Gợi ý threshold |
|------------|-----------------|
| Production | Threshold thấp hơn, alert nhanh qua SNS |
| Dev/Test | Threshold cao hơn để tránh noise |
| Sandbox | Có thể dùng daily summary |
| Shared services | Kết hợp absolute + percentage threshold |

### 4. Kết hợp với Cost Explorer

Cost Anomaly Detection phát hiện và cảnh báo. Cost Explorer giúp drill-down chi phí sâu hơn sau khi có alert.

Luồng xử lý:

```text
Alert từ Cost Anomaly Detection
→ Xem root cause
→ Mở Cost Explorer
→ Group by Service / Account / Region / Usage Type
→ Tìm workload gây tăng chi phí
→ Remediate
```

### 5. Review anomaly định kỳ

Không chỉ xử lý alert lớn. Nên review định kỳ các anomaly nhỏ để phát hiện pattern lặp lại, ví dụ:

- Batch job chạy sai lịch
- Log ingestion tăng vào cuối tuần
- Data transfer tăng theo campaign
- Dev environment bị để chạy qua đêm

---

## So sánh với AWS Budgets và Cost Explorer

| Công cụ | Mục đích chính | Cách phát hiện |
|---------|----------------|----------------|
| **AWS Cost Anomaly Detection** | Phát hiện chi phí bất thường | ML so sánh actual với expected spend |
| **AWS Budgets** | Cảnh báo khi vượt budget hoặc forecast vượt budget | Ngưỡng tĩnh theo budget |
| **AWS Cost Explorer** | Phân tích và visualize chi phí | Báo cáo, filter, group, forecast |
| **AWS Pricing Calculator** | Ước tính chi phí trước khi triển khai | Mô hình estimate thủ công |

### Khi nào dùng cái nào?

| Tình huống | Dùng |
|------------|------|
| Muốn biết chi phí tháng này có vượt $5,000 không | AWS Budgets |
| Muốn phát hiện EC2 tăng bất thường so với pattern bình thường | Cost Anomaly Detection |
| Muốn phân tích service nào tốn tiền nhất 6 tháng qua | Cost Explorer |
| Muốn estimate kiến trúc trước khi deploy | Pricing Calculator |

Nên dùng kết hợp:

```text
Pricing Calculator → Estimate trước
Budgets            → Guardrail theo ngân sách
Cost Explorer      → Phân tích chi phí
Cost Anomaly Detection → Phát hiện bất thường sớm
```

---

## Lưu ý quan trọng

| Điểm cần nhớ | Chi tiết |
|--------------|----------|
| **Không realtime tuyệt đối** | Dữ liệu từ Cost Explorer có thể trễ tới khoảng 24 giờ |
| **Cần dữ liệu lịch sử** | Service mới cần dữ liệu usage lịch sử trước khi model phát hiện anomaly ổn định |
| **Monitor thuộc account tạo ra** | Chỉ truy cập cost monitors và alert subscriptions trong account đã tạo chúng |
| **Management account** | Monitor cho linked accounts, cost allocation tags, cost categories chỉ tạo trong management account |
| **Threshold không chặn chi phí** | Dịch vụ chỉ cảnh báo, không tự stop resource |
| **Không thay thế Budgets** | Budgets vẫn cần cho kiểm soát ngân sách theo ngưỡng cụ thể |

Theo AWS docs, với một service subscription mới, cần khoảng **10 ngày dữ liệu lịch sử service usage** trước khi có thể phát hiện anomaly cho service đó.

---

## Use Cases

### 1. Phát hiện EC2 tăng bất thường

```text
Monitor: AWS services
Anomaly: Amazon EC2 tăng $700 so với expected spend
Root cause: m6i.4xlarge chạy ở us-east-1 trong prod-account
Action: Kiểm tra Auto Scaling, instance bị quên tắt, hoặc deployment mới
```

### 2. Theo dõi account con trong AWS Organizations

```text
Monitor: Linked account
Anomaly: dev-account tăng 300% so với expected spend
Root cause: NAT Gateway data processing tăng mạnh
Action: Kiểm tra route table, private subnet traffic, data egress pattern
```

### 3. Theo dõi team bằng cost allocation tag

```text
Monitor: Cost allocation tag Team
Anomaly: Team=data tăng chi phí S3 và Glue
Root cause: ETL job xử lý dữ liệu nhiều hơn bình thường
Action: Kiểm tra job schedule và input data volume
```

### 4. Gửi alert tới kênh vận hành

```text
Monitor: AWS services
Alert frequency: Individual alerts
Channel: SNS → Slack/Chime
Threshold: cost impact >= $100 AND impact >= 40%
Action: FinOps/Ops xử lý trong ngày
```

---

## Tóm tắt

**AWS Cost Anomaly Detection** dùng để phát hiện chi phí AWS bất thường bằng ML và cảnh báo sớm cho team vận hành/FinOps.

Cần nhớ:

- Dùng **Cost Monitor** để chọn phạm vi theo dõi.
- Dùng **Alert Subscription** để chọn người nhận, kênh nhận và threshold.
- Hỗ trợ monitor theo **AWS services**, **linked accounts**, **cost allocation tags**, **cost categories**.
- Alert có thể gửi qua **email**, **Amazon SNS**, chat integration, EventBridge hoặc User Notifications.
- Có **root cause analysis** để chỉ ra service/account/Region/usage type gây tăng chi phí.
- Không thay thế AWS Budgets; nên dùng cùng Budgets và Cost Explorer.
- Không realtime tuyệt đối vì billing data/Cost Explorer có độ trễ.

---

## Tài liệu tham khảo

- [AWS Cost Anomaly Detection - Product page](https://aws.amazon.com/aws-cost-management/aws-cost-anomaly-detection/)
- [Detecting unusual spend with AWS Cost Anomaly Detection - AWS Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html)
- [Getting started with AWS Cost Anomaly Detection - AWS Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/getting-started-ad.html)
- [Creating an Amazon SNS topic for anomaly notifications - AWS Documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/ad-SNS.html)
- [CreateAnomalySubscription - AWS Cost Management API Reference](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_CreateAnomalySubscription.html)
