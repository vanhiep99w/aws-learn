# Amazon CloudWatch


## Mục lục

- [Tổng Quan](#tổng-quan)
- [CloudWatch Core Components](#cloudwatch-core-components)
- [CloudWatch Metrics](#cloudwatch-metrics)
- [CloudWatch Logs](#cloudwatch-logs)
- [CloudWatch Alarms](#cloudwatch-alarms)
- [️ CloudWatch Agent](#cloudwatch-agent)
- [CloudWatch Dashboards](#cloudwatch-dashboards)
- [CloudWatch Synthetics (Canaries)](#cloudwatch-synthetics-canaries)
- [CloudWatch ServiceLens & X-Ray Integration](#cloudwatch-servicelens-x-ray-integration)
- [CloudWatch Container Insights](#cloudwatch-container-insights)
- [EventBridge Integration (formerly CloudWatch Events)](#eventbridge-integration-formerly-cloudwatch-events)
- [CloudWatch Pricing](#cloudwatch-pricing)
- [️ Common Use Cases & Best Practices](#common-use-cases-best-practices)
- [❓ CloudWatch FAQ](#cloudwatch-faq)
- [Related Services](#related-services)
- [Tổng Kết](#tổng-kết)

---

## Tổng Quan

**Amazon CloudWatch** là dịch vụ **monitoring và observability** toàn diện của AWS, cho phép bạn giám sát tài nguyên AWS, ứng dụng và dịch vụ chạy trên cloud hoặc on-premises.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AMAZON CLOUDWATCH ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │   Metrics   │    │    Logs     │    │   Alarms    │    │  Dashboards │  │
│   │   📈        │    │   📋        │    │   🔔        │    │   📊        │  │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│          │                  │                  │                   │        │
│          └──────────────────┼──────────────────┼──────────────────┘         │
│                             │                   │                           │
│                    ┌────────▼────────┐   ┌─────▼─────┐                      │
│                    │ CloudWatch Logs │   │    SNS    │                      │
│                    │    Insights     │   │  Lambda   │                      │
│                    └────────┬────────┘   │Auto Scale │                      │
│                             │            └───────────┘                      │
│                    ┌────────▼────────┐                                      │
│                    │  Events/Alarms  │                                      │
│                    │   Automation    │                                      │
│                    └─────────────────┘                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudWatch Core Components

| Component | Mô Tả | Use Case |
|-----------|-------|----------|
| **Metrics** | Dữ liệu time-series về performance | CPU, Memory, Network I/O |
| **Logs** | Thu thập và lưu trữ log files | Application logs, System logs |
| **Alarms** | Cảnh báo dựa trên metrics | Notify khi CPU > 80% |
| **Dashboards** | Visualization tập trung | Tổng hợp metrics nhiều services |
| **Events** | React to AWS resource changes | Trigger Lambda khi EC2 stop |
| **Insights** | Query và analyze logs | Troubleshooting, Analytics |
| **Synthetics** | Canary scripts | Monitor endpoints, APIs |
| **ServiceLens** | End-to-end observability | Distributed tracing |

---

## CloudWatch Metrics

### 1. Metrics Là Gì?

**Metric** là một biến đo lường theo thời gian (time-series data), ví dụ: CPU utilization của EC2 instance.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDWATCH METRICS FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐    │
│   │ AWS Services │────▶│ CloudWatch       │────▶│ Dashboards/Alarms    │    │
│   │ (EC2, RDS,   │     │ Metrics Store    │     │ Analysis/Automation  │    │
│   │  Lambda...)  │     │ (15 months)      │     │                      │    │
│   └──────────────┘     └──────────────────┘     └──────────────────────┘    │
│                                                                             │
│   ┌──────────────┐     ┌──────────────────┐                                 │
│   │ Custom Apps  │────▶│ PutMetricData    │────┐                            │
│   │ (Your Code)  │     │ API/SDK          │     │                           │
│   └──────────────┘     └──────────────────┘     │                           │
│                                                 ▼                           │
│                                        CloudWatch Metrics                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Metrics Structure

```
Namespace     : AWS/EC2
MetricName    : CPUUtilization
Dimensions    : InstanceId=i-1234567890abcdef0
Timestamp     : 2024-01-15T10:00:00Z
Value         : 45.5
Unit          : Percent
```

| Component | Mô Tả | Ví Dụ |
|-----------|-------|-------|
| **Namespace** | Container cho metrics | `AWS/EC2`, `AWS/RDS`, `Custom/MyApp` |
| **Metric Name** | Tên của metric | `CPUUtilization`, `RequestCount` |
| **Dimensions** | Key-value pairs để filter | `InstanceId`, `AutoScalingGroupName` |
| **Timestamp** | Thời điểm data point | ISO 8601 format |
| **Value** | Giá trị đo được | `45.5`, `1024` |
| **Unit** | Đơn vị đo | `Percent`, `Bytes`, `Count` |

### 3. Default Metrics vs Detailed Monitoring

| Loại | Resolution | Chi Phí | Availability |
|------|------------|---------|--------------|
| **Basic (Default)** | 5 phút | Miễn phí | Tất cả EC2 instances |
| **Detailed Monitoring** | 1 phút | Có phí | Phải enable |
| **High-Resolution Custom** | 1 giây | Có phí cao hơn | Custom metrics only |

### 4. Important Default Metrics by Service

#### EC2 Instance Metrics

| Metric | Mô Tả | ⚠️ Lưu Ý |
|--------|-------|----------|
| `CPUUtilization` | % CPU được sử dụng | Default có sẵn |
| `NetworkIn/Out` | Bytes network traffic | Default có sẵn |
| `DiskReadBytes/WriteBytes` | Disk I/O bytes | **Instance store only** |
| `StatusCheckFailed` | Health check status | System & Instance check |
| **`MemoryUtilization`** | % RAM sử dụng | ❌ **KHÔNG CÓ mặc định** - Cần CloudWatch Agent |
| **`DiskSpaceUtilization`** | % Disk sử dụng | ❌ **KHÔNG CÓ mặc định** - Cần CloudWatch Agent |

> [!IMPORTANT]
> **Memory và Disk Space** KHÔNG được thu thập mặc định bởi CloudWatch. Bạn cần cài đặt **CloudWatch Agent** để có các metrics này.

#### RDS Metrics

| Metric | Mô Tả |
|--------|-------|
| `CPUUtilization` | CPU % |
| `DatabaseConnections` | Số connections đang mở |
| `FreeableMemory` | RAM khả dụng |
| `ReadIOPS/WriteIOPS` | I/O operations per second |
| `FreeStorageSpace` | Disk space còn lại |

#### Lambda Metrics

| Metric | Mô Tả |
|--------|-------|
| `Invocations` | Số lần function được gọi |
| `Duration` | Thời gian thực thi (ms) |
| `Errors` | Số lần lỗi |
| `Throttles` | Số lần bị throttle |
| `ConcurrentExecutions` | Số executions đồng thời |

### 5. Custom Metrics

Bạn có thể push custom metrics từ ứng dụng của mình:

```python
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

# Push custom metric
cloudwatch.put_metric_data(
    Namespace='CustomApp/OrderService',
    MetricData=[
        {
            'MetricName': 'OrdersProcessed',
            'Dimensions': [
                {
                    'Name': 'Environment',
                    'Value': 'Production'
                },
                {
                    'Name': 'Region',
                    'Value': 'us-east-1'
                }
            ],
            'Timestamp': datetime.utcnow(),
            'Value': 150,
            'Unit': 'Count'
        },
        {
            'MetricName': 'ProcessingTime',
            'Value': 234.5,
            'Unit': 'Milliseconds',
            'StorageResolution': 1  # High resolution (1 second)
        }
    ]
)
```

### 6. Namespace và Dimensions Chi Tiết

#### Namespace là gì?

**Namespace** là **container/category** để nhóm các metrics liên quan lại với nhau. Nó giống như một "thư mục" để tổ chức metrics.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDWATCH NAMESPACES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  NAMESPACE: AWS/EC2                                                   │ │
│   │  ├── CPUUtilization                                                   │ │
│   │  ├── NetworkIn / NetworkOut                                           │ │
│   │  └── StatusCheckFailed                                                │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  NAMESPACE: AWS/Lambda                                                │ │
│   │  ├── Invocations                                                      │ │
│   │  ├── Duration                                                         │ │
│   │  └── Errors                                                           │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  NAMESPACE: MyCompany/OrderService  ← Custom namespace                │ │
│   │  ├── OrdersProcessed                                                  │ │
│   │  └── PaymentSuccess                                                   │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| AWS Service | Namespace |
|-------------|-----------|
| EC2 | `AWS/EC2` |
| RDS | `AWS/RDS` |
| Lambda | `AWS/Lambda` |
| ALB | `AWS/ApplicationELB` |
| DynamoDB | `AWS/DynamoDB` |
| S3 | `AWS/S3` |
| SQS | `AWS/SQS` |
| Custom | `MyCompany/MyApp` (tự đặt, KHÔNG dùng `AWS/` prefix) |

#### Dimensions là gì?

**Dimensions** là **key-value pairs** dùng để **xác định và phân loại** một metric cụ thể. Nó giống như "filters/tags" để phân biệt các metrics cùng tên.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         METRIC DIMENSIONS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   MetricName: CPUUtilization (cùng tên)                                     │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  Dimension: InstanceId = i-abc123  → CPU của instance abc123          │ │
│   │  Dimension: InstanceId = i-xyz789  → CPU của instance xyz789          │ │
│   │                                                                       │ │
│   │  Dimension: AutoScalingGroupName = web-asg → Tất cả trong ASG         │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   MULTI-DIMENSION (combine):                                                │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  Dimensions:                                                          │ │
│   │    - InstanceId = i-abc123                                            │ │
│   │    - AutoScalingGroupName = web-asg                                   │ │
│   │  → CPU của instance abc123 TRONG ASG web-asg                          │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Service | Common Dimensions |
|---------|-------------------|
| **EC2** | `InstanceId`, `AutoScalingGroupName`, `ImageId` |
| **RDS** | `DBInstanceIdentifier`, `DBClusterIdentifier` |
| **Lambda** | `FunctionName`, `Resource`, `Version` |
| **ALB** | `LoadBalancer`, `TargetGroup`, `AvailabilityZone` |
| **SQS** | `QueueName` |
| **DynamoDB** | `TableName`, `GlobalSecondaryIndexName` |

#### Tổng hợp: Namespace + MetricName + Dimensions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 UNIQUE METRIC IDENTIFICATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CloudWatch Metric = Namespace + MetricName + Dimensions                   │
│                       ─────────   ──────────   ──────────                   │
│                       Thư mục     Tên file     Tags/Filters                 │
│                                                                             │
│   Ví dụ:                                                                    │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  Namespace:   AWS/EC2                                                 │ │
│   │  MetricName:  CPUUtilization                                          │ │
│   │  Dimensions:  InstanceId = i-abc123                                   │ │
│   │              Environment = Production                                 │ │
│   │  ─────────────────────────────────────────────────────────            │ │
│   │  → 1 UNIQUE time series (CPU của i-abc123 trong Production)           │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   KEY RULES:                                                                │
│   • Max 30 dimensions per metric                                            │
│   • Mỗi unique combination = 1 custom metric (tính phí riêng!)              │
│   • Custom namespace: KHÔNG dùng prefix "AWS/"                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudWatch Logs

### 1. Logs Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLOUDWATCH LOGS ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          LOG GROUP                                  │    │
│  │  (Container cho logs từ cùng một source, e.g., /aws/lambda/myFunc)  │    │
│  │                                                                     │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │ LOG STREAM 1                                                    │ │   │
│  │  │ (Sequence of log events từ cùng source instance)               │  │   │
│  │  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │   │   │
│  │  │ │Event 1 │ │Event 2 │ │Event 3 │ │Event 4 │ │Event 5 │ ...    │   │   │
│  │  │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │   │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │ LOG STREAM 2                                                    │ │   │
│  │  │ ┌────────┐ ┌────────┐ ┌────────┐                               │  │   │
│  │  │ │Event 1 │ │Event 2 │ │Event 3 │ ...                           │  │   │
│  │  │ └────────┘ └────────┘ └────────┘                               │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Concept | Mô Tả | Ví Dụ |
|---------|-------|-------|
| **Log Group** | Container cho related log streams | `/aws/lambda/my-function` |
| **Log Stream** | Sequence of events từ cùng source | `2024/01/15/[$LATEST]abc123` |
| **Log Event** | Single log entry với timestamp | `{"timestamp": ..., "message": "..."}` |

### 2. Log Sources

Có 2 nhóm nguồn chính gửi logs đến CloudWatch:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LOG SOURCES → CLOUDWATCH                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ╔═══════════════════════════════╗    ╔═══════════════════════════════╗    │
│   ║   AWS NATIVE SERVICES         ║    ║   CUSTOM SOURCES              ║    │
│   ║   (Built-in Integration)      ║    ║   (Cần CloudWatch Agent/SDK)  ║    │
│   ╠═══════════════════════════════╣    ╠═══════════════════════════════╣    │
│   ║                               ║    ║                               ║    │
│   ║  • Lambda (Tự động)           ║    ║  • EC2 Instances              ║    │
│   ║  • API Gateway                ║    ║  • On-Premises Servers        ║    │
│   ║  • ECS/EKS (awslogs driver)   ║    ║  • Docker Containers          ║    │
│   ║  • Route 53 (Query logs)      ║    ║  • Custom Applications        ║    │
│   ║  • VPC Flow Logs              ║    ║  • Any server with CW Agent   ║    │
│   ║  • CloudTrail                 ║    ║                               ║    │
│   ║  • RDS (Slow query logs)      ║    ║                               ║    │
│   ║                               ║    ║                               ║    │
│   ╚═══════════════╦═══════════════╝    ╚═══════════════╦═══════════════╝    │
│                   ║                                    ║                    │
│                   ║                                    ║                    │
│                   ▼                                    ▼                    │
│              ┌─────────────────────────────────────────────┐                │
│              │            CloudWatch Logs                  │                │
│              │  (Central log storage & analysis)           │                │
│              └─────────────────────────────────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Nhóm | Cách Gửi Logs | Ví Dụ |
|------|---------------|-------|
| **AWS Native** | Tự động hoặc enable trong console | Lambda logs tự động đến `/aws/lambda/<function-name>` |
| **Custom Sources** | Cài CloudWatch Agent hoặc dùng SDK | EC2 cần install agent để push `/var/log/*` |

### 3. Log Retention

```
┌────────────────────────────────────────────────────────┐
│              LOG RETENTION OPTIONS                     │
├────────────────────────────────────────────────────────┤
│  1 day  │  3 days │  5 days │  1 week │  2 weeks       │
│  1 month │ 2 months │ 3 months │ 6 months              │
│  1 year  │ 13 months │ 18 months │ 2 years             │
│  3 years │ 5 years │ 6 years │ 7 years │ 8 years       │
│  9 years │ 10 years │ Never expire (default)           │
└────────────────────────────────────────────────────────┘
```

> [!WARNING]
> **Mặc định logs KHÔNG bao giờ expire!** Điều này có thể gây ra chi phí lưu trữ cao. Luôn set retention policy phù hợp.

### 4. Log Export & Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOUDWATCH LOGS EXPORT OPTIONS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌─────────────────┐                                 │
│                         │ CloudWatch Logs │                                 │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│          ┌───────────────────────┼───────────────────────┐                  │
│          │                       │                        │                 │
│          ▼                       ▼                       ▼                  │
│   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐            │
│   │     S3       │       │  Kinesis     │       │  Lambda        │          │
│   │  (Export)    │       │  Firehose    │       │(Subscription)  │          │
│   │              │       │  (Real-time) │       │                │          │
│   └──────────────┘       └──────────────┘       └──────────────┘            │
│          │                       │                        │                 │
│          ▼                       ▼                        │                 │
│   ┌──────────────┐       ┌──────────────┐                 │                 │
│   │ Athena       │       │ OpenSearch   │                 │                 │
│   │ Glue         │       │ Splunk       │                 │                 │
│   │ QuickSight   │       │ Datadog      │               ▼                   │
│   └──────────────┘       └──────────────┘       ┌──────────────┐            │
│          │ Any Custom                                    │                  │
│          │ Processing                                    │                  │
│          └───────────────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Export Method | Use Case | Real-time? |
|---------------|----------|------------|
| **S3 Export** | Archival, long-term storage, Athena analysis | ❌ Batch (up to 12h delay) |
| **Subscription Filter → Kinesis Firehose** | Real-time streaming to S3/OpenSearch | ✅ Near real-time |
| **Subscription Filter → Lambda** | Custom processing, alerting | ✅ Near real-time |
| **Subscription Filter → Kinesis Data Streams** | Complex event processing | ✅ Real-time |

### 5. CloudWatch Logs Insights

Query language mạnh mẽ để analyze logs:

```sql
-- Tìm tất cả ERROR logs trong 1 giờ qua
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- Count errors by type
fields @message
| filter @message like /ERROR/
| parse @message "ERROR: *" as errorType
| stats count(*) as count by errorType
| sort count desc

-- Calculate average response time
fields @timestamp, @message
| parse @message "ResponseTime: * ms" as responseTime
| stats avg(responseTime) as avgTime, 
        max(responseTime) as maxTime,
        min(responseTime) as minTime
| limit 1

-- Top 10 most expensive Lambda invocations
fields @timestamp, @billedDuration, @memorySize
| filter @type = "REPORT"
| sort @billedDuration desc
| limit 10
```

---

## 🔔 CloudWatch Alarms

### 1. Alarm States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLOUDWATCH ALARM STATES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │     ┌────────────┐                           ┌────────────┐          │  │
│   │     │            │   Threshold Breached      │            │          │  │
│   │     │     OK     │ ────────────────────────▶ │   ALARM    │          │  │
│   │     │    ✅      │                           │    🔴      │          │  │
│   │     │            │ ◀──────────────────────── │            │          │  │
│   │     └────────────┘   Threshold Recovered     └────────────┘          │  │
│   │           ▲                                        ▲                │   │
│   │           │                                        │                 │  │
│   │           │         ┌────────────┐                 │                 │  │
│   │           │         │            │                 │                 │  │
│   │           └─────────│INSUFFICIENT│─────────────────┘                 │  │
│   │      Not enough     │   DATA     │    Not enough                     │  │
│   │      data points    │    ⚪      │    data points                    │  │
│   │                     │            │                                   │  │
│   │                     └────────────┘                                   │  │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| State | Ý Nghĩa |
|-------|---------|
| **OK** | Metric trong ngưỡng bình thường |
| **ALARM** | Metric đã vượt ngưỡng |
| **INSUFFICIENT_DATA** | Không đủ data để đánh giá (mới tạo hoặc metric không có data) |

### 2. Alarm Configuration

```yaml
AlarmName: HighCPUAlarm
MetricName: CPUUtilization
Namespace: AWS/EC2
Dimensions:
  - Name: InstanceId
    Value: i-1234567890abcdef0

# Threshold Configuration
Statistic: Average          # Sum, SampleCount, Minimum, Maximum
Period: 300                  # 5 minutes (in seconds)
EvaluationPeriods: 3         # Check 3 consecutive periods
DatapointsToAlarm: 2         # 2 out of 3 periods must breach
Threshold: 80                # 80%
ComparisonOperator: GreaterThanThreshold

# Actions
ActionsEnabled: true
AlarmActions:
  - arn:aws:sns:us-east-1:123456789012:notify-ops
  - arn:aws:automate:us-east-1:ec2:recover
OKActions:
  - arn:aws:sns:us-east-1:123456789012:notify-ops
InsufficientDataActions:
  - arn:aws:sns:us-east-1:123456789012:notify-ops
```

### 3. Alarm Actions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDWATCH ALARM ACTIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌──────────────────┐                                 │
│                        │ CloudWatch Alarm │                                 │
│                        │     TRIGGERS     │                                 │
│                        └────────┬─────────┘                                 │
│                                  │                                          │
│     ┌───────────────────────────┼───────────────────────────┐               │
│     │               │           │           │                │              │
│     ▼               ▼           ▼           ▼               ▼               │
│ ┌───────┐     ┌──────────┐ ┌─────────┐ ┌─────────┐    ┌─────────┐           │
│ │  SNS  │     │ Auto     │ │   EC2   │ │   EC2   │    │ Systems │           │
│ │       │     │ Scaling  │ │  Stop   │ │ Recover │    │ Manager │           │
│ │ Email │     │          │ │         │ │         │    │         │           │
│ │ SMS   │     │ Scale    │ │ Reduce  │ │ Auto    │    │Run      │           │
│ │Lambda │     │ In/Out   │ │ Costs   │ │ Healing │    │Command  │           │
│ └───────┘     └──────────┘ └─────────┘ └─────────┘    └─────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Action Type | Use Case | Example |
|-------------|----------|---------|
| **SNS** | Notifications | Email, SMS, Lambda trigger |
| **Auto Scaling** | Scale resources | Add EC2 when CPU > 80% |
| **EC2 Stop** | Cost optimization | Stop dev instance after hours |
| **EC2 Terminate** | Cleanup | Terminate unhealthy instance |
| **EC2 Recover** | Self-healing | Recover failed instance |
| **Systems Manager** | Automation | Run remediation runbook |

### 4. Composite Alarms

Combine multiple alarms với AND/OR logic:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPOSITE ALARM EXAMPLE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Individual Alarms:                                                        │
│   ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│   │ HighCPU Alarm      │  │ HighMemory Alarm   │  │ HighDisk Alarm     │    │
│   │ CPU > 80%          │  │ Memory > 85%       │  │ Disk > 90%         │    │
│   └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘    │
│             │                       │                        │              │
│             └───────────────────────┼───────────────────────┘               │
│                                      │                                      │
│                                     ▼                                       │
│                    ┌────────────────────────────────────┐                   │
│                    │        COMPOSITE ALARM             │                   │
│                    │                                    │                   │
│                    │  Rule: (HighCPU AND HighMemory)    │                   │
│                    │        OR HighDisk                 │                   │
│                    │                                    │                   │
│                    │  → Only alert when TRULY critical  │                   │
│                    │  → Reduce alert fatigue            │                   │
│                    └────────────────────────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ CloudWatch Agent

### 1. Tại Sao Cần CloudWatch Agent?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEFAULT METRICS vs AGENT METRICS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Without Agent (Default)           │  With CloudWatch Agent                 │
│  ─────────────────────────────────│──────────────────────────────────────   │
│                                     │                                       │
│  ✅ CPU Utilization                │  ✅ All Default Metrics                │
│  ✅ Network In/Out                 │  ➕ Memory Utilization                 │
│  ✅ Disk Read/Write (Instance      │  ➕ Disk Space Utilization             │
│     Store only)                    │  ➕ Swap Usage                         │
│  ✅ Status Check                   │  ➕ Netstat Metrics                    │
│  ❌ Memory - NOT AVAILABLE         │  ➕ Process-level Metrics              │
│  ❌ Disk Space - NOT AVAILABLE     │  ➕ Custom Application Logs            │
│  ❌ Application Logs               │  ➕ StatsD/collectd Metrics            │
│                                     │                                       │
└────────────────────────────────────┴────────────────────────────────────────┘
```

### 2. Agent Installation & Configuration

```bash
# 1. Download & Install (Amazon Linux 2)
sudo yum install amazon-cloudwatch-agent -y

# 2. Create configuration using wizard
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# 3. Start agent with config
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json \
    -s
```

### 3. Agent Configuration File

```json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "metrics": {
    "namespace": "CustomEC2Metrics",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
        "totalcpu": true
      },
      "mem": {
        "measurement": ["mem_used_percent", "mem_available_percent"]
      },
      "disk": {
        "measurement": ["disk_used_percent", "disk_free"],
        "resources": ["/", "/data"]
      },
      "swap": {
        "measurement": ["swap_used_percent"]
      }
    },
    "append_dimensions": {
      "InstanceId": "${aws:InstanceId}",
      "AutoScalingGroupName": "${aws:AutoScalingGroupName}"
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/ec2/system/messages",
            "log_stream_name": "{instance_id}",
            "timestamp_format": "%b %d %H:%M:%S"
          },
          {
            "file_path": "/var/log/myapp/*.log",
            "log_group_name": "/ec2/myapp",
            "log_stream_name": "{instance_id}/{file_name}",
            "multi_line_start_pattern": "^\\d{4}-\\d{2}-\\d{2}"
          }
        ]
      }
    }
  }
}
```

---

## CloudWatch Dashboards

### 1. Dashboard Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLOUDWATCH DASHBOARD EXAMPLE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Production Overview                                      [Time: Last 3h ▼] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐           │
│  │  📈 EC2 CPU Utilization     │  │  📈 RDS Connections         │           │
│  │  ┌─────────────────────┐    │  │  ┌─────────────────────┐     │          │
│  │  │     ___/\___        │    │  │  │   ___    ___        │     │          │
│  │  │    /       \        │    │  │  │  /   \__/   \___    │     │          │
│  │  │___/         \___    │    │  │  │_/               \_  │     │          │
│  │  └─────────────────────┘    │  │  └─────────────────────┘     │          │
│  │  Avg: 45%  Max: 78%         │  │  Current: 127  Max: 200     │           │
│  └─────────────────────────────┘  └─────────────────────────────┘           │
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐           │
│  │  📊 Lambda Errors (Table)   │  │  🔢 Active Alarms           │           │
│  │  ┌─────────────────────┐    │  │                              │          │
│  │  │ Function   | Errors │    │  │  ⚠️  HighCPU-Web-Server       │          │
│  │  │ OrderProc  |   3    │    │  │  ⚠️  LowDiskSpace-DB          │          │
│  │  │ PaymentSvc |   0    │    │  │  ✅  All other alarms OK     │          │
│  │  │ UserAuth   |   1    │    │  │                              │          │
│  │  └─────────────────────┘    │  │                              │          │
│  └─────────────────────────────┘  └─────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Widget Types

| Widget Type | Use Case | Example |
|-------------|----------|---------|
| **Line** | Time series trends | CPU over time |
| **Stacked Area** | Show composition | Memory breakdown |
| **Number** | Single current value | Error count |
| **Gauge** | Show vs threshold | CPU vs 80% limit |
| **Bar** | Compare values | Requests by endpoint |
| **Pie** | Show distribution | Traffic by region |
| **Text** | Markdown content | Instructions, links |
| **Alarm Status** | Show alarm states | Critical alarms |
| **Logs Table** | Recent log entries | Error logs |
| **Explorer** | Dynamic resource view | All EC2 instances |

### 3. Cross-Account & Cross-Region Dashboards

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-ACCOUNT CLOUDWATCH SETUP                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────┐                    ┌─────────────────────┐        │
│   │  Monitoring Account │                    │   Source Account A   │       │
│   │  (Central View)     │◀───────────────────│   (Production)       │       │
│   │                     │  CloudWatch        │                      │       │
│   │  ┌───────────────┐  │  Cross-Account     └─────────────────────┘        │
│   │  │  Unified      │  │  Sharing                                          │
│   │  │  Dashboard    │  │                    ┌─────────────────────┐        │
│   │  │               │  │◀───────────────────│   Source Account B  │        │
│   │  │  All Accounts │  │                    │   (Development)     │        │
│   │  │  All Regions  │  │                    │                     │        │
│   │  └───────────────┘  │                    └─────────────────────┘        │
│   │                     │                                                   │
│   └─────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudWatch Synthetics (Canaries)

### 1. Canary Overview

**Canaries** là configurable scripts chạy theo schedule để monitor endpoints và APIs.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLOUDWATCH SYNTHETICS FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────┐   │
│   │   Canary        │         │   Your Website  │         │ CloudWatch  │   │
│   │   Script        │────────▶│   or API        │────────▶│ Metrics/    │   │
│   │   (Scheduled)   │ Request │                 │ Response│ Alarms      │   │
│   └─────────────────┘         └─────────────────┘         └─────────────┘   │
│          │                                                        │         │
│          │ Run every                                              │         │
│          │ X minutes                                            ▼           │
│          │                                              ┌─────────────┐     │
│          │                                              │ SNS Alert     │   │
│          │                                              │ if Failed     │   │
│          ▼                                              └─────────────┘     │
│   ┌─────────────────┐                                                       │
│   │ S3 Bucket       │                                                       │
│   │ - Screenshots   │                                                       │
│   │ - HAR files     │                                                       │
│   │ - Logs          │                                                       │
│   └─────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Canary Use Cases

| Use Case | Description |
|----------|-------------|
| **Heartbeat Monitoring** | Simple availability check |
| **API Monitoring** | Validate API responses |
| **UI Workflow** | Test login flows, checkout process |
| **Visual Monitoring** | Screenshot comparison |
| **Broken Link Checker** | Find 404 errors |

### 3. Sample Canary Script (Node.js)

```javascript
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const flowBuilderBlueprint = async function () {
    // Configure the browser
    let page = await synthetics.getPage();
    
    // Step 1: Navigate to homepage
    await synthetics.executeStep('navigateToHomepage', async function () {
        await page.goto('https://www.example.com', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
    });
    
    // Step 2: Verify page title
    await synthetics.executeStep('verifyTitle', async function () {
        const title = await page.title();
        if (!title.includes('Example')) {
            throw new Error('Title does not contain expected text');
        }
        log.info('Page title verified: ' + title);
    });
    
    // Step 3: Check API endpoint
    await synthetics.executeStep('checkAPIEndpoint', async function () {
        const response = await page.goto('https://api.example.com/health');
        if (response.status() !== 200) {
            throw new Error(`API returned status ${response.status()}`);
        }
    });
};

exports.handler = async () => {
    return await flowBuilderBlueprint();
};
```

---

## CloudWatch ServiceLens & X-Ray Integration

### 1. End-to-End Observability

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOUDWATCH SERVICELENS ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User Request                                                              │
│       │                                                                     │
│       ▼                                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│   │   ALB   │───▶│   API   │───▶│ Lambda  │───▶│ DynamoDB│                  │
│   │         │    │ Gateway │    │Function │    │         │                  │
│   └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘                  │
│        │              │              │               │                      │
│        │              │              │               │                      │
│        └──────────────┴──────────────┴──────────────┘                       │
│                              │                                              │
│                              ▼                                              │
│                    ┌──────────────────┐                                     │
│                    │   AWS X-Ray      │                                     │
│                    │   (Traces)       │                                     │
│                    └────────┬─────────┘                                     │
│                              │                                              │
│                             ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    CloudWatch ServiceLens                           │   │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                   │ │
│   │  │   Service    │ │  Resource    │ │   Trace      │                   │ │
│   │  │   Map        │ │  Health      │ │   Analysis   │                   │ │
│   │  └──────────────┘ └──────────────┘ └──────────────┘                   │ │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. ServiceLens Features

| Feature | Description |
|---------|-------------|
| **Service Map** | Visual map of application dependencies |
| **Trace Analysis** | Follow requests across services |
| **Correlated Metrics** | Link traces with CloudWatch metrics |
| **Latency Analysis** | Identify slow components |
| **Error Tracking** | Trace error paths |

---

## CloudWatch Container Insights

### 1. Container Monitoring

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONTAINER INSIGHTS ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          EKS / ECS Cluster                          │   │
│   │                                                                     │   │
│   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐              │  │
│   │   │ Node 1  │   │ Node 2  │   │ Node 3  │   │ Node N  │              │  │
│   │   │┌───────┐│   │┌───────┐│   │┌───────┐│   │┌───────┐│              │  │
│   │   ││Pod A  ││   ││Pod D  ││   ││Pod G  ││   ││Pod J  ││              │  │
│   │   │├───────┤│   │├───────┤│   │├───────┤│   │├───────┤│              │  │
│   │   ││Pod B  ││   ││Pod E  ││   ││Pod H  ││   ││Pod K  ││              │  │
│   │   │├───────┤│   │├───────┤│   │├───────┤│   │├───────┤│              │  │
│   │   ││Pod C  ││   ││Pod F  ││   ││Pod I  ││   ││Pod L  ││              │  │
│   │   │└───────┘│   │└───────┘│   │└───────┘│   │└───────┘│              │  │
│   │   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘              │  │
│   │        │             │             │             │                   │  │
│   └────────┼─────────────┼─────────────┼─────────────┼──────────────────┘   │
│            │             │             │               │                    │
│            └─────────────┴─────────────┴─────────────┘                      │
│                                     │                                       │
│                                    ▼                                        │
│                    ┌───────────────────────────────┐                        │
│                    │   CloudWatch Container        │                        │
│                    │   Insights Agent              │                        │
│                    │   (DaemonSet / Sidecar)       │                        │
│                    └───────────────┬───────────────┘                        │
│                                     │                                       │
│                                    ▼                                        │
│                    ┌───────────────────────────────┐                        │
│                    │   CloudWatch Logs & Metrics   │                        │
│                    │   - Cluster metrics           │                        │
│                    │   - Node metrics              │                        │
│                    │   - Pod metrics               │                        │
│                    │   - Container metrics         │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Container Insights Metrics

| Level | Metrics Collected |
|-------|-------------------|
| **Cluster** | Node count, Pod count, CPU/Memory reservation |
| **Node** | CPU, Memory, Network, Filesystem, Pod count |
| **Pod** | CPU, Memory, Network, Container restarts |
| **Container** | CPU, Memory limits/requests |

---

## EventBridge Integration (formerly CloudWatch Events)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 CLOUDWATCH EVENTS → EVENTBRIDGE EVOLUTION                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CloudWatch Events (Legacy)              EventBridge (Current)              │
│  ┌─────────────────────────┐             ┌─────────────────────────┐        │
│  │ • Basic event routing   │   ────▶     │ • Advanced event bus    │        │
│  │ • AWS events only       │             │ • SaaS integrations     │        │
│  │ • Simple rules          │             │ • Schema registry       │        │
│  │                         │             │ • Event archive/replay  │        │
│  │                         │             │ • Cross-account events  │        │
│  └─────────────────────────┘             └─────────────────────────┘        │
│                                                                             │
│  Note: CloudWatch Events API still works but routes to EventBridge          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **CloudWatch Events** đã được rebrand thành **Amazon EventBridge**. Xem file `eventbridge.md` để biết chi tiết đầy đủ.

---

## CloudWatch Pricing

### 1. Pricing Components

| Component | Free Tier | Paid Pricing |
|-----------|-----------|--------------|
| **Metrics** | 10 custom metrics | $0.30/metric/month (first 10K) |
| **Dashboards** | 3 dashboards | $3/dashboard/month |
| **Alarms** | 10 alarms | $0.10/alarm/month (standard) |
| **Logs Ingestion** | 5GB | $0.50/GB |
| **Logs Storage** | 5GB | $0.03/GB/month |
| **Logs Insights** | None | $0.005/GB scanned |
| **Contributor Insights** | 1 rule | $0.02/matching log event |
| **Canaries** | None | $0.0012/canary run |

### 2. Cost Optimization Tips

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLOUDWATCH COST OPTIMIZATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SET LOG RETENTION                                                       │
│     ─────────────────                                                       │
│     Change from "Never Expire" to appropriate retention period              │
│     Most logs don't need > 30 days retention                                │
│                                                                             │
│  2. USE LOG FILTERS WISELY                                                  │
│     ───────────────────────                                                 │
│     Create metric filters instead of querying all logs                      │
│     Push aggregated metrics, not every data point                           │
│                                                                             │
│  3. EXPORT TO S3                                                            │
│     ──────────────────                                                      │
│     For long-term storage, export to S3 (cheaper than CW Logs storage)      │
│     Use Athena for querying archived logs                                   │
│                                                                             │
│  4. OPTIMIZE METRIC RESOLUTION                                              │
│     ────────────────────────                                                │
│     Use standard resolution (1 min) unless you truly need high-res          │
│     High-resolution metrics cost significantly more                         │
│                                                                             │
│  5. CONSOLIDATE DASHBOARDS                                                  │
│     ────────────────────                                                    │
│     Each dashboard costs $3/month                                           │
│     Combine related metrics into fewer dashboards                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Common Use Cases & Best Practices

### 1. Basic EC2 Monitoring Setup

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

# Create alarm for high CPU
cloudwatch.put_metric_alarm(
    AlarmName='HighCPU-WebServer',
    ComparisonOperator='GreaterThanThreshold',
    EvaluationPeriods=2,
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Period=300,
    Statistic='Average',
    Threshold=80.0,
    ActionsEnabled=True,
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789012:AlertTopic'
    ],
    AlarmDescription='Alert when CPU exceeds 80%',
    Dimensions=[
        {
            'Name': 'InstanceId',
            'Value': 'i-1234567890abcdef0'
        },
    ]
)
```

### 2. Application Logging Pattern

```python
import logging
import watchtower  # pip install watchtower

# Setup CloudWatch Logs handler
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add CloudWatch handler
logger.addHandler(watchtower.CloudWatchLogHandler(
    log_group='/myapp/production',
    stream_name='web-server-{date}',
    create_log_group=True
))

# Use structured logging
logger.info('Order processed', extra={
    'order_id': '12345',
    'customer_id': 'C-999',
    'amount': 150.00,
    'status': 'completed'
})
```

### 3. Metric Filter for Error Counting

```yaml
# CloudFormation snippet
MetricFilter:
  Type: AWS::Logs::MetricFilter
  Properties:
    LogGroupName: /aws/lambda/my-function
    FilterPattern: "ERROR"
    MetricTransformations:
      - MetricName: ErrorCount
        MetricNamespace: CustomApp/Lambda
        MetricValue: "1"
        DefaultValue: 0
```

---

## CloudWatch FAQ

### Q: CloudWatch Agent vs Built-in Metrics - Khi nào cần Agent?

| Scenario | Cần Agent? |
|----------|------------|
| Monitor CPU/Network của EC2 | ❌ Không |
| Monitor Memory của EC2 | ✅ Có |
| Monitor Disk Space | ✅ Có |
| Collect application logs từ EC2 | ✅ Có |
| Monitor Lambda metrics | ❌ Không (tự động) |
| Monitor on-premises servers | ✅ Có |

### Q: Log Group vs Log Stream?

```
Log Group: /aws/lambda/order-service     ← Container (billing, retention)
├── Log Stream: 2024/01/15/[$LATEST]abc  ← Single Lambda instance log
├── Log Stream: 2024/01/15/[$LATEST]def  ← Another instance
└── Log Stream: 2024/01/16/[$LATEST]ghi  ← Next day instance
```

### Q: Standard vs High-Resolution Metrics?

| Aspect | Standard | High-Resolution |
|--------|----------|-----------------|
| Resolution | 1 minute | 1 second |
| Retention | 15 months | 3 hours (then aggregated) |
| Cost | Lower | ~10x higher |
| Use Case | Most workloads | Real-time trading, gaming |

### Q: CloudWatch Alarms vs EventBridge?

| Feature | CloudWatch Alarms | EventBridge |
|---------|-------------------|-------------|
| **Trigger Based On** | Metric thresholds | Events/State changes |
| **Example** | CPU > 80% for 5 min | EC2 instance stopped |
| **Actions** | SNS, EC2, Auto Scaling | Lambda, Step Functions, SQS, etc. |
| **Pattern Matching** | Simple threshold | Complex event patterns |

---

## Related Services

| Service | Relationship với CloudWatch |
|---------|----------------------------|
| **SNS** | Nhận alarm notifications |
| **EventBridge** | Event-driven automation (successor of CW Events) |
| **X-Ray** | Distributed tracing, ServiceLens integration |
| **Auto Scaling** | Scale based on CW metrics/alarms |
| **Systems Manager** | Run automation based on alarms |
| **Lambda** | Log destination, alarm target |
| **Kinesis Firehose** | Real-time log streaming |

---

## Tổng Kết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLOUDWATCH KEY TAKEAWAYS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Metrics: Time-series data, default + custom, 1-second to 5-min res      │
│                                                                             │
│  ✅ Logs: Centralized logging, retention policies, Insights for queries     │
│                                                                             │
│  ✅ Alarms: Threshold-based alerts, 3 states (OK/ALARM/INSUFFICIENT)        │
│                                                                             │
│  ✅ Agent: Required for Memory/Disk metrics and custom logs                 │
│                                                                             │
│  ✅ Dashboards: Unified visualization, cross-account/region support         │
│                                                                             │
│  ✅ Canaries: Synthetic monitoring for endpoints and workflows              │
│                                                                             │
│  ✅ Container Insights: EKS/ECS monitoring with cluster/pod/container       │
│                         level metrics                                       │
│                                                                             │
│  ✅ ServiceLens: End-to-end observability with X-Ray integration            │
│                                                                             │
│  ⚠️  Memory & Disk Space: NOT default metrics - need CloudWatch Agent        │
│                                                                             │
│  ⚠️  Log retention: Default is "Never Expire" - SET RETENTION POLICY!        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
