# S3 Storage Lens

## Mục lục

- [Tổng quan](#tổng-quan)
- [Dashboards](#dashboards)
- [Metrics Categories](#metrics-categories)
- [Recommendations](#recommendations)
- [Pricing](#pricing)
- [Liên kết](#liên-kết)

---

## Tổng quan

**S3 Storage Lens** là tính năng analytics cho S3, cung cấp **visibility toàn bộ storage** của organization với **60+ metrics** và **recommendations** để tối ưu cost và security.

```
┌─────────────────────────────────────────────────────────────────┐
│                    S3 STORAGE LENS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   AWS Organization                      │   │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│   │   │Account 1│  │Account 2│  │Account 3│  │Account N│    │   │
│   │   │┌───────┐│  │┌───────┐│  │┌───────┐│  │┌───────┐│    │   │
│   │   ││Bucket ││  ││Bucket ││  ││Bucket ││  ││Bucket ││    │   │
│   │   │└───────┘│  │└───────┘│  │└───────┘│  │└───────┘│    │   │
│   │   └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                              ▼                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              S3 Storage Lens Dashboard                  │   │
│   │                                                         │   │
│   │   📊 60+ Metrics    📈 Trends    💡 Recommendations     │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Mô tả |
|---------|-------|
| **Organization-wide visibility** | Xem tất cả accounts, buckets trong 1 dashboard |
| **60+ metrics** | Usage, activity, cost optimization, security |
| **Recommendations** | Actionable suggestions để tối ưu |
| **Historical data** | Lưu đến 15 tháng (với Advanced) |
| **Drill-down** | Từ Organization → Account → Bucket → Prefix |

---

## Dashboards

### Default Dashboard

AWS tự động tạo **default dashboard** miễn phí cho mỗi account:
- Cập nhật hàng ngày
- 14 ngày historical data
- Free metrics only

### Custom Dashboards

Bạn có thể tạo custom dashboards với:

| Scope | Mô tả |
|-------|-------|
| **Single Account** | 1 account, specific Region hoặc all Regions |
| **Organization** | Tất cả accounts trong AWS Organizations |

```
Dashboard Scopes:

Organization Dashboard:
├── Account 1 (us-east-1, eu-west-1)
├── Account 2 (ap-southeast-1)
└── Account 3 (all regions)

Account Dashboard:
├── Bucket A
├── Bucket B
└── Bucket C
```

---

## Metrics Categories

### Free Metrics (28 metrics)

| Category | Metrics ví dụ |
|----------|---------------|
| **Summary** | Total storage, Object count |
| **Cost Optimization** | Incomplete MPU bytes, Noncurrent version bytes |
| **Data Protection** | Versioned bytes, Encrypted bytes |

### Advanced Metrics (thêm 35+ metrics) - $0.20/million objects

| Category | Metrics ví dụ |
|----------|---------------|
| **Activity** | GET requests, PUT requests, Bytes downloaded/uploaded |
| **Detailed Status Codes** | 4xx errors, 5xx errors |
| **Advanced Cost Optimization** | Per storage class breakdown |
| **Advanced Data Protection** | Replication status, Object Lock status |

### So sánh Free vs Advanced

| Feature | Free | Advanced |
|---------|------|----------|
| **Metrics** | 28 | 60+ |
| **Historical data** | 14 days | **15 months** |
| **Prefix aggregation** | ❌ | ✅ |
| **CloudWatch publishing** | ❌ | ✅ |
| **Activity metrics** | ❌ | ✅ |
| **Cost** | Free | $0.20/million objects monitored |

---

## Recommendations

Storage Lens cung cấp **contextual recommendations** để tối ưu:

### Cost Optimization

```
┌──────────────────────────────────────────────────────────────────┐
│                    COST RECOMMENDATIONS                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠️ 500GB incomplete multipart uploads found                     │
│     └── Recommendation: Create lifecycle rule to abort           │
│                                                                  │
│  ⚠️ 2TB noncurrent versions in bucket-logs                       │
│     └── Recommendation: Review versioning, add lifecycle         │
│                                                                  │
│  ⚠️ 80% of bucket-archive not accessed in 90 days                │
│     └── Recommendation: Transition to Glacier                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

| Recommendation | Action |
|----------------|--------|
| **Incomplete MPU** | Abort multipart uploads không hoàn thành |
| **Noncurrent versions** | Clean up old versions với lifecycle |
| **Infrequent access** | Chuyển sang IA/Glacier |
| **Delete markers** | Remove expired delete markers |

### Security & Data Protection

| Recommendation | Action |
|----------------|--------|
| **Unencrypted buckets** | Enable SSE |
| **No versioning** | Enable versioning cho critical data |
| **No replication** | Setup CRR/SRR cho DR |
| **Public buckets** | Review và restrict access |

---

## Pricing

| Component | Price |
|-----------|-------|
| **Default dashboard** | **Free** |
| **Free metrics** | **Free** |
| **Advanced metrics** | $0.20/million objects monitored/month |
| **CloudWatch publishing** | + CloudWatch charges |

### Ví dụ

```
10 million objects với Advanced metrics:
= 10 × $0.20 = $2.00/month

100 million objects với Advanced metrics:
= 100 × $0.20 = $20.00/month
```

---

## Use Cases

| Use Case | Mô tả |
|----------|-------|
| **Cost optimization** | Tìm storage không cần thiết, optimize lifecycle |
| **Security audit** | Kiểm tra encryption, public access |
| **Capacity planning** | Track growth trends, forecast |
| **Compliance** | Verify replication, versioning status |
| **Troubleshooting** | Activity metrics để debug issues |

---

## Export Options

Storage Lens có thể export metrics ra:

| Destination | Format | Use Case |
|-------------|--------|----------|
| **S3 Bucket** | CSV, Parquet | Long-term storage, custom analysis |
| **CloudWatch** | Metrics | Alarms, dashboards integration |

```
Export to S3:
Storage Lens → Daily Export → S3 Bucket → Athena/QuickSight

Export to CloudWatch:
Storage Lens → CloudWatch Metrics → Alarms → SNS → Email
```

---

## Liên kết

- [S3](s3.md) - Main S3 documentation
- [CloudWatch](cloudwatch.md) - Monitoring integration

---

## Tài liệu tham khảo

- [S3 Storage Lens](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage_lens.html)
- [S3 Storage Lens metrics glossary](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage_lens_metrics_glossary.html)
