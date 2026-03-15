# AWS CloudTrail


## Mục lục

- [Tổng Quan](#tổng-quan)
- [CloudTrail vs CloudWatch](#cloudtrail-vs-cloudwatch)
- [CloudTrail Event Types](#cloudtrail-event-types)
- [️ CloudTrail Architecture](#cloudtrail-architecture)
- [CloudTrail Event Structure](#cloudtrail-event-structure)
- [CloudTrail Security Best Practices](#cloudtrail-security-best-practices)
- [CloudTrail + CloudWatch Integration](#cloudtrail-cloudwatch-integration)
- [Querying CloudTrail Logs](#querying-cloudtrail-logs)
- [CloudTrail + EventBridge](#cloudtrail-eventbridge)
- [CloudTrail Pricing](#cloudtrail-pricing)
- [CloudTrail Lake](#cloudtrail-lake)
- [❓ CloudTrail FAQ](#cloudtrail-faq)
- [Related Services](#related-services)
- [Tổng Kết](#tổng-kết)

---

## Tổng Quan

**AWS CloudTrail** là dịch vụ **audit và governance** cho phép bạn ghi lại, giám sát và lưu giữ lịch sử tất cả các API calls và hoạt động trong AWS account của bạn.

> **Một câu tóm tắt:** CloudTrail = **"Security Camera"** cho AWS account - ghi lại AI làm GÌ, KHI NÀO, và TỪ ĐÂU.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         AWS CLOUDTRAIL OVERVIEW                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   WHO did WHAT, WHEN, and from WHERE?                                                            │
│                                                                                                  │
│   ┌─────────────┐                              ┌─────────────────────────┐                       │
│   │   Users     │──┐                           │    CloudTrail Event                           │ │
│   │ (Console)   │  │                           ├─────────────────────────┤                       │
│   └─────────────┘  │   ┌─────────────────┐     │ WHO: user/arn                                 │ │
│                    ├──▶│   AWS API   │────▶                         │ WHAT: action performed  │  │
│   ┌─────────────┐  │   │   Calls         │     │ WHEN: timestamp                               │ │
│   │Applications │──┤   └─────────────────┘     │ WHERE: source IP                              │ │
│   │ (SDK/CLI)   │  │                           │ WHICH: resource ARN                           │ │
│   └─────────────┘  │                           │ RESULT: success/failure                       │ │
│                    │                           └─────────────────────────┘                       │
│   ┌─────────────┐                              │                                              │  │
│   │  Services   │──┘                                      ▼                                      │
│   │ (Lambda,etc)│                              ┌─────────────────────────┐                       │
│   └─────────────┘                              │ S3 / CloudWatch Logs                         │  │
│                                             │ (Long-term storage)                            │   │
│                                             └─────────────────────────┘                          │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudTrail vs CloudWatch

| Aspect | CloudTrail | CloudWatch |
|--------|------------|------------|
| **Mục đích chính** | Audit & Compliance (AI làm gì?) | Monitoring & Performance (Hệ thống chạy như nào?) |
| **Ghi lại** | API calls, user actions | Metrics, logs, events |
| **Câu hỏi trả lời** | "Ai đã xóa S3 bucket lúc 3AM?" | "CPU đang ở bao nhiêu %?" |
| **Use case** | Security audit, troubleshooting changes | Performance monitoring, alerting |
| **Data type** | Event records (JSON) | Time-series metrics, log entries |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOUDTRAIL vs CLOUDWATCH COMPARISON                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CloudTrail (Audit)                     CloudWatch (Monitoring)            │
│   ┌─────────────────────┐                ┌─────────────────────┐            │
│   │                     │                │                     │            │
│   │  📝 "WHO did WHAT"  │                │  📊 "HOW is it      │            │
│   │                     │                │      PERFORMING"    │            │
│   │  • User created EC2 │                │                     │            │
│   │  • User deleted S3  │                │  • CPU = 75%        │            │
│   │  • Role assumed     │                │  • Error count = 5  │            │
│   │  • Policy changed   │                │  • Latency = 200ms  │            │
│   │                     │                │                     │            │
│   └─────────────────────┘                └─────────────────────┘            │
│            │                                       │                        │
│            │  CÓ THỂ TÍch hợp                      │                        │
│            └───────────────┬───────────────────────┘                        │
│                            │                                                │
│                            ▼                                                │
│               ┌─────────────────────────┐                                   │
│               │ CloudTrail → CloudWatch │                                   │
│               │ Logs → Alarms           │                                   │
│               │ (Alert on API actions)  │                                   │
│               └─────────────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudTrail Event Types

### 1. Ba Loại Events

| Event Type | Mô Tả | Ví Dụ | Default? |
|------------|-------|-------|----------|
| **Management Events** | Control plane operations (quản lý resources) | CreateBucket, DeleteInstance, AttachPolicy | ✅ Enabled |
| **Data Events** | Data plane operations (truy cập data) | GetObject, PutObject, Invoke Lambda | ❌ Disabled (high volume) |
| **Insights Events** | Unusual activity detection | Spike in API calls, unusual patterns | ❌ Disabled (extra cost) |

### 2. Visual Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDTRAIL EVENT TYPES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  MANAGEMENT EVENTS (Control Plane)                    [DEFAULT ON]  │   │
│   │  ─────────────────────────────────                                  │   │
│   │  Operations that modify or manage AWS resources                     │   │
│   │                                                                     │   │
│   │  Examples:                                                          │   │
│   │  • CreateVPC, DeleteVPC                                             │   │
│   │  • RunInstances, TerminateInstances                                 │   │
│   │  • CreateUser, AttachRolePolicy                                     │   │
│   │  • CreateBucket, DeleteBucket                                       │   │
│   │                                                                     │   │
│   │  📊 Volume: Low-Medium (hundreds to thousands per day)              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  DATA EVENTS (Data Plane)                          [DEFAULT OFF]    │   │
│   │  ──────────────────────────                                         │   │
│   │  Operations performed ON resources (data access)                    │   │
│   │                                                                     │   │
│   │  Examples:                                                          │   │
│   │  • S3: GetObject, PutObject, DeleteObject                           │   │
│   │  • Lambda: Invoke                                                   │   │
│   │  • DynamoDB: GetItem, PutItem, Query                                │   │
│   │                                                                     │   │
│   │  📊 Volume: Very High (millions per day) → 💰 Expensive if enabled  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  INSIGHTS EVENTS                                   [DEFAULT OFF]    │   │
│   │  ───────────────                                                    │   │
│   │  Detects unusual API activity patterns automatically                │   │
│   │                                                                     │   │
│   │  Examples:                                                          │   │
│   │  • Sudden spike in TerminateInstances calls                         │   │
│   │  • Unusual burst of IAM CreateUser calls                            │   │
│   │  • Abnormal pattern of S3 DeleteObject                              │   │
│   │                                                                     │   │
│   │  📊 Use case: Security anomaly detection                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Read vs Write Events

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        READ vs WRITE EVENTS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   WRITE Events (Default: ON)              READ Events (Default: ON)         │
│   ┌─────────────────────────┐             ┌─────────────────────────┐       │
│   │                         │             │                         │       │
│   │  • CreateBucket         │             │  • DescribeBuckets      │       │
│   │  • PutObject            │             │  • GetObject            │       │
│   │  • DeleteObject         │             │  • ListInstances        │       │
│   │  • RunInstances         │             │  • DescribeVPCs         │       │
│   │  • TerminateInstances   │             │  • GetPolicy            │       │
│   │                         │             │                         │       │
│   │  → Modify state         │             │  → Read state only      │       │
│   └─────────────────────────┘             └─────────────────────────┘       │
│                                                                             │
│   💡 Tip: Có thể chỉ enable Write events để giảm volume & cost              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudTrail Architecture

### 1. Trail Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDTRAIL TRAIL TYPES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  SINGLE-REGION TRAIL                                                   ║│
│   ║  ────────────────────                                                  ║│
│   ║                                                                        ║│
│   ║  ┌─────────────────┐                                                   ║│
│   ║  │   us-east-1     │ ──────▶ S3 Bucket                                ║ │
│   ║  │   (only)        │         (Events from this region only)           ║ │
│   ║  └─────────────────┘                                                   ║│
│   ║                                                                        ║│
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  MULTI-REGION TRAIL (Recommended)                                      ║│
│   ║  ─────────────────────────────────                                     ║│
│   ║                                                                        ║│
│   ║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  ║ │
│   ║  │us-east-1 │ │us-west-2 │ │eu-west-1 │ │ap-south-1│  ...             ║ │
│   ║  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘                  ║ │
│   ║       │            │            │            │                        ║ │
│   ║       └────────────┴────────────┴────────────┘                        ║ │
│   ║                          │                                             ║│
│   ║                          ▼                                             ║│
│   ║                   ┌─────────────┐                                      ║│
│   ║                   │  S3 Bucket  │  (All regions consolidated)         ║ │
│   ║                   └─────────────┘                                      ║│
│   ║                                                                        ║│
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  ORGANIZATION TRAIL (AWS Organizations)                                ║│
│   ║  ──────────────────────────────────────                                ║│
│   ║                                                                        ║│
│   ║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    ║ │
│   ║  │ Account A   │  │ Account B   │  │ Account C   │                    ║ │
│   ║  │ (all regions│  │ (all regions│  │ (all regions│                    ║ │
│   ║  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                    ║ │
│   ║         │                │                │                           ║ │
│   ║         └────────────────┼────────────────┘                           ║ │
│   ║                          ▼                                             ║│
│   ║                ┌──────────────────┐                                    ║│
│   ║                │ Central S3 Bucket│  (All accounts, all regions)      ║ │
│   ║                │ (Management Acct)│                                    ║│
│   ║                └──────────────────┘                                    ║│
│   ║                                                                        ║│
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Log Delivery Flow

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                       CLOUDTRAIL LOG DELIVERY FLOW                            │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   API Call                                                                    │
│        │                                                                      │
│      ▼                                                                        │
│   ┌─────────────────┐                                                         │
│   │   CloudTrail    │                                                         │
│   │   (Captures)    │                                                         │
│   └────────┬────────┘                                                         │
│              │                                                                │
│            │  Events delivered within ~15 minutes                             │
│              │                                                                │
│    ┌───────┴───────┬──────────────────┬──────────────────┐                    │
│    │               │                  │                     │                 │
│    ▼               ▼                  ▼                  ▼                    │
│ ┌──────┐    ┌────────────┐    ┌─────────────┐    ┌─────────────┐              │
│ │  S3  │    │ CloudWatch │    │ EventBridge │    │    SNS      │              │
│ │Bucket│    │   Logs     │    │  (Filter &  │    │(Notifications │            │
│ │      │    │            │    │   Route)    │    │   )         │              │
│ └──┬───┘    └─────┬──────┘    └──────┬──────┘    └─────────────┘              │
│    │              │                    │                                      │
│    ▼              ▼                  ▼                                        │
│ ┌──────┐    ┌────────────┐    ┌─────────────┐                                 │
│ │Athena│    │  Alarms    │    │   Lambda    │                                 │
│ │Query │    │  Metrics   │    │Step Function│                                 │
│ └──────┘    └────────────┘    └─────────────┘                                 │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 CloudTrail Event Structure

### Sample Event (JSON)

```json
{
    "eventVersion": "1.08",
    "userIdentity": {
        "type": "IAMUser",
        "principalId": "AIDAEXAMPLE123",
        "arn": "arn:aws:iam::123456789012:user/alice",
        "accountId": "123456789012",
        "accessKeyId": "AKIAEXAMPLE",
        "userName": "alice"
    },
    "eventTime": "2024-01-15T10:30:00Z",
    "eventSource": "s3.amazonaws.com",
    "eventName": "DeleteBucket",
    "awsRegion": "us-east-1",
    "sourceIPAddress": "203.0.113.50",
    "userAgent": "aws-cli/2.0.0",
    "requestParameters": {
        "bucketName": "my-important-bucket"
    },
    "responseElements": null,
    "requestID": "EXAMPLE123456789",
    "eventID": "EXAMPLE-event-ID",
    "readOnly": false,
    "resources": [
        {
            "ARN": "arn:aws:s3:::my-important-bucket",
            "accountId": "123456789012",
            "type": "AWS::S3::Bucket"
        }
    ],
    "eventType": "AwsApiCall",
    "recipientAccountId": "123456789012"
}
```

### Key Fields Explained

| Field | Mô Tả | Example |
|-------|-------|---------|
| `userIdentity` | Ai thực hiện action | IAM User, Role, Root |
| `eventTime` | Khi nào | ISO 8601 timestamp |
| `eventSource` | Service nào | s3.amazonaws.com, ec2.amazonaws.com |
| `eventName` | Action gì | DeleteBucket, RunInstances |
| `sourceIPAddress` | Từ đâu | IP address hoặc AWS service |
| `userAgent` | Tool nào | aws-cli, console, SDK |
| `requestParameters` | Request details | Bucket name, instance type |
| `responseElements` | Response từ AWS | Instance ID created |
| `errorCode` | Nếu failed | AccessDenied, ValidationError |
| `readOnly` | Read hay Write | true = read, false = write |

---

## CloudTrail Security Best Practices

### 1. Log File Integrity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOG FILE INTEGRITY VALIDATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐         ┌─────────────────┐                           │
│   │  CloudTrail     │────────▶│   S3 Bucket     │                           │
│   │  Log Files      │         │                 │                           │
│   └─────────────────┘         └────────┬────────┘                           │
│          │                             │                                    │
│          │                             │                                    │
│          ▼                             ▼                                    │
│   ┌─────────────────┐         ┌─────────────────┐                           │
│   │  Digest Files   │         │  Log Files      │                           │
│   │  (Hourly hash)  │         │  (Every 5 min)  │                           │
│   └─────────────────┘         └─────────────────┘                           │
│          │                                                                  │
│          │  SHA-256 hash                                                    │
│          │                                                                  │
│          ▼                                                                  │
│   ┌─────────────────────────────────────────────┐                           │
│   │  aws cloudtrail validate-logs               │                           │
│   │  --trail-arn arn:aws:cloudtrail:...         │                           │
│   │  --start-time 2024-01-01T00:00:00Z          │                           │
│   │                                             │                           │
│   │  ✅ Logs have NOT been tampered with        │                           │
│   └─────────────────────────────────────────────┘                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Security Recommendations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOUDTRAIL SECURITY CHECKLIST                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Enable CloudTrail in ALL regions (Multi-region trail)                   │
│                                                                             │
│  ✅ Enable Log File Validation (detect tampering)                           │
│                                                                             │
│  ✅ Encrypt logs with KMS (SSE-KMS)                                         │
│                                                                             │
│  ✅ Enable S3 MFA Delete on log bucket                                      │
│                                                                             │
│  ✅ Restrict access to CloudTrail logs bucket                               │
│                                                                             │
│  ✅ Enable CloudTrail Insights for anomaly detection                        │
│                                                                             │
│  ✅ Send logs to CloudWatch Logs for real-time monitoring                   │
│                                                                             │
│  ✅ Create CloudWatch Alarms for critical events:                           │
│      • Root account usage                                                   │
│      • IAM policy changes                                                   │
│      • Security group changes                                               │
│      • Unauthorized API calls                                               │
│                                                                             │
│  ✅ For Organizations: Use Organization Trail                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudTrail + CloudWatch Integration

### 1. Real-time Alerting Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CLOUDTRAIL → CLOUDWATCH LOGS → ALERTS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐         │
│   │ CloudTrail  │─────▶│ CloudWatch Logs │─────▶│  Metric Filter  │         │
│   │ Trail       │      │ Log Group       │      │                 │         │
│   └─────────────┘      └─────────────────┘      └────────┬────────┘         │
│                                                          │                  │
│                                                          ▼                  │
│                                                 ┌─────────────────┐         │
│                                                 │ CloudWatch      │         │
│                                                 │ Alarm           │         │
│                                                 └────────┬────────┘         │
│                                                          │                  │
│                              ┌────────────────┬──────────┴──────────┐       │
│                              │                │                      │      │
│                              ▼                ▼                     ▼       │
│                        ┌──────────┐    ┌──────────┐          ┌──────────┐   │
│                        │   SNS    │    │  Lambda  │          │ SSM Auto │   │
│                        │  Email   │    │ Response │          │ Runbook  │   │
│                        └──────────┘    └──────────┘          └──────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Common Metric Filters

```hcl
# Alert on Root Account Login
resource "aws_cloudwatch_log_metric_filter" "root_login" {
  name           = "RootAccountUsage"
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "RootAccountUsageCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

# Alert on IAM Policy Changes
resource "aws_cloudwatch_log_metric_filter" "iam_changes" {
  name           = "IAMPolicyChanges"
  pattern        = "{ ($.eventName = DeleteGroupPolicy) || ($.eventName = DeleteRolePolicy) || ($.eventName = DeleteUserPolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "IAMPolicyChangeCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

# Alert on Unauthorized API Calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api" {
  name           = "UnauthorizedAPICalls"
  pattern        = "{ ($.errorCode = \"*UnauthorizedAccess*\") || ($.errorCode = \"AccessDenied*\") }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "UnauthorizedAPICallCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

# Alert on Security Group Changes
resource "aws_cloudwatch_log_metric_filter" "sg_changes" {
  name           = "SecurityGroupChanges"
  pattern        = "{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "SecurityGroupChangeCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}
```

---

## Querying CloudTrail Logs

### 1. Using Athena

```sql
-- Create table from CloudTrail logs in S3
CREATE EXTERNAL TABLE cloudtrail_logs (
    eventVersion STRING,
    userIdentity STRUCT<
        type: STRING,
        principalId: STRING,
        arn: STRING,
        accountId: STRING,
        userName: STRING,
        invokedBy: STRING
    >,
    eventTime STRING,
    eventSource STRING,
    eventName STRING,
    awsRegion STRING,
    sourceIPAddress STRING,
    userAgent STRING,
    requestParameters STRING,
    responseElements STRING,
    errorCode STRING,
    errorMessage STRING
)
ROW FORMAT SERDE 'com.amazon.emr.hive.serde.CloudTrailSerde'
LOCATION 's3://my-cloudtrail-bucket/AWSLogs/123456789012/CloudTrail/';

-- Find all actions by a specific user
SELECT eventTime, eventName, sourceIPAddress
FROM cloudtrail_logs
WHERE userIdentity.userName = 'alice'
ORDER BY eventTime DESC
LIMIT 100;

-- Find all S3 bucket deletions
SELECT eventTime, 
       userIdentity.userName,
       requestParameters,
       sourceIPAddress
FROM cloudtrail_logs
WHERE eventName = 'DeleteBucket'
ORDER BY eventTime DESC;

-- Find all failed API calls
SELECT eventTime, eventName, errorCode, errorMessage
FROM cloudtrail_logs
WHERE errorCode IS NOT NULL
ORDER BY eventTime DESC
LIMIT 50;

-- Find console logins
SELECT eventTime,
       userIdentity.userName,
       sourceIPAddress,
       responseElements
FROM cloudtrail_logs
WHERE eventName = 'ConsoleLogin'
ORDER BY eventTime DESC;
```

### 2. Using CloudWatch Logs Insights

```sql
-- Find all actions by root user
fields @timestamp, eventName, sourceIPAddress, userAgent
| filter userIdentity.type = "Root"
| sort @timestamp desc
| limit 100

-- Count actions by user
fields userIdentity.userName
| stats count(*) as actionCount by userIdentity.userName
| sort actionCount desc
| limit 20

-- Find all errors in last 24 hours
fields @timestamp, eventName, errorCode, errorMessage
| filter errorCode like /Error/
| sort @timestamp desc

-- Find S3 data access patterns
fields @timestamp, eventName, requestParameters.bucketName
| filter eventSource = "s3.amazonaws.com"
| stats count(*) as accessCount by eventName, requestParameters.bucketName
| sort accessCount desc
```

---

## CloudTrail + EventBridge

### Real-time Event Processing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 CLOUDTRAIL → EVENTBRIDGE INTEGRATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐         │
│   │ CloudTrail  │─────▶│   EventBridge   │─────▶│ Matching Rules  │         │
│   │ API Events  │      │   (Default Bus) │      │                 │         │
│   └─────────────┘      └─────────────────┘      └────────┬────────┘         │
│                                                          │                  │
│                     ┌────────────────────────────────────┼──────┐           │
│                     │                    │               │       │          │
│                     ▼                    ▼               ▼      ▼           │
│               ┌──────────┐        ┌──────────┐    ┌──────────┐ ┌────────┐   │
│               │  Lambda  │        │   SNS    │    │   SQS    │ │Step Fn │   │
│               │ Function │        │  Topic   │    │  Queue   │ │        │   │
│               └──────────┘        └──────────┘    └──────────┘ └────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### EventBridge Rule Examples

```json
// Rule: Alert when EC2 instance is terminated
{
  "source": ["aws.ec2"],
  "detail-type": ["AWS API Call via CloudTrail"],
  "detail": {
    "eventSource": ["ec2.amazonaws.com"],
    "eventName": ["TerminateInstances"]
  }
}

// Rule: Alert on IAM user creation
{
  "source": ["aws.iam"],
  "detail-type": ["AWS API Call via CloudTrail"],
  "detail": {
    "eventSource": ["iam.amazonaws.com"],
    "eventName": ["CreateUser"]
  }
}

// Rule: Alert on S3 bucket policy changes
{
  "source": ["aws.s3"],
  "detail-type": ["AWS API Call via CloudTrail"],
  "detail": {
    "eventSource": ["s3.amazonaws.com"],
    "eventName": ["PutBucketPolicy", "DeleteBucketPolicy"]
  }
}
```

---

## CloudTrail Pricing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDTRAIL PRICING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  FREE TIER                                                          │   │
│   │  ─────────                                                          │   │
│   │  • One trail that delivers management events to S3 - FREE           │   │
│   │  • Event history in console (90 days) - FREE                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  PAID FEATURES                                                      │   │
│   │  ─────────────                                                      │   │
│   │  • Additional trails: $2.00 per 100,000 management events           │   │
│   │  • Data events: $0.10 per 100,000 events                            │   │
│   │  • Insights events: $0.35 per 100,000 events analyzed               │   │
│   │  • CloudTrail Lake: Query pricing per data scanned                  │   │
│   │                                                                     │   │
│   │  + S3 storage costs for log files                                   │   │
│   │  + CloudWatch Logs ingestion costs (if enabled)                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   💡 Cost Optimization:                                                     │
│   • Use one multi-region trail (free) instead of multiple single-region     │
│   • Enable data events only for critical buckets/functions                  │
│   • Use S3 lifecycle policies to archive/delete old logs                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🆕 CloudTrail Lake

### Overview

**CloudTrail Lake** là managed data lake để lưu trữ và query CloudTrail events với SQL.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDTRAIL LAKE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Traditional Trail                    CloudTrail Lake                      │
│   ┌─────────────────┐                  ┌─────────────────┐                  │
│   │                 │                  │                 │                  │
│   │  CloudTrail     │                  │  CloudTrail     │                  │
│   │       │         │                  │       │          │                 │
│   │       ▼         │                  │       ▼         │                  │
│   │      S3         │                  │  Event Data     │                  │
│   │       │         │                  │  Store           │                 │
│   │       ▼         │                  │  (Managed)      │                  │
│   │    Athena       │                  │       │          │                 │
│   │   (Manual       │                  │       ▼         │                  │
│   │    Setup)       │                  │  Built-in SQL   │                  │
│   │                 │                  │  Query Console  │                  │
│   └─────────────────┘                  └─────────────────┘                  │
│                                                                             │
│   Pros: Cheaper storage                Pros: No S3/Athena setup             │
│   Cons: Complex setup                  Cons: Higher query cost              │
│         Manual table mgmt                    Retention up to 7 years        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudTrail FAQ

### Q: CloudTrail có ghi lại tất cả API calls không?

| Service Type | Recorded? | Notes |
|--------------|-----------|-------|
| Most AWS Services | ✅ Yes | EC2, S3, IAM, RDS, Lambda, etc. |
| Data plane operations | ⚠️ Optional | S3 GetObject, Lambda Invoke - need to enable Data Events |
| Some newer services | ⏳ Delayed | May take time to add support |

### Q: Logs được deliver sau bao lâu?

| Destination | Delivery Time |
|-------------|---------------|
| S3 | Within ~15 minutes |
| CloudWatch Logs | Within ~15 minutes |
| Event History (Console) | Near real-time |

### Q: Trail vs Event History?

| Feature | Event History | Trail |
|---------|---------------|-------|
| Setup required | ❌ No (default) | ✅ Yes |
| Retention | 90 days | Unlimited (S3) |
| Export | Limited | Full (S3, CW Logs) |
| Data events | ❌ No | ✅ Yes |
| Multi-account | ❌ No | ✅ Yes |
| Cost | Free | May have costs |

### Q: Làm sao biết ai đã xóa resource của mình?

```sql
-- Query in CloudWatch Logs Insights hoặc Athena
SELECT eventTime, userIdentity.userName, userIdentity.arn,
       sourceIPAddress, requestParameters
FROM cloudtrail_logs
WHERE eventName = 'DeleteBucket'  -- hoặc TerminateInstances, DeleteTable, etc.
  AND requestParameters LIKE '%my-resource-name%'
ORDER BY eventTime DESC;
```

---

## Related Services

| Service | Relationship |
|---------|--------------|
| **CloudWatch** | Send trails to CW Logs for metrics/alarms |
| **EventBridge** | Real-time event-driven automation |
| **S3** | Long-term log storage |
| **Athena** | SQL queries on S3 logs |
| **AWS Config** | Config = resource state, CloudTrail = who changed it |
| **GuardDuty** | Uses CloudTrail as data source for threat detection |
| **Security Hub** | Aggregates CloudTrail findings |

---

## CloudTrail vs AWS Config (Chi tiết)

### Câu hỏi thường gặp: "CloudTrail làm được hết mà?"

> [!IMPORTANT]
> **KHÔNG!** CloudTrail và AWS Config có overlap nhưng KHÁC NHAU về mục đích và coverage.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│             CloudTrail vs AWS Config - Không phải Superset                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ❌ KHÔNG PHẢI: CloudTrail ⊃ AWS Config (CloudTrail chứa hết)               │
│                                                                              │
│   ✅ ĐÚNG: Chúng OVERLAP một phần, nhưng mỗi cái có vùng riêng               │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                                                                     │    │
│   │    CHỈ CloudTrail        OVERLAP           CHỈ AWS Config           │    │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐             │   │
│   │   │              │   │              │   │              │             │   │
│   │   │ • Failed API │   │  Resource    │   │ • Periodic   │             │   │
│   │   │   calls      │   │  change      │   │   checks     │             │   │
│   │   │ • Read ops   │   │  events      │   │ • Drift      │             │   │
│   │   │   (Describe) │   │              │   │   detection  │             │   │
│   │   │ • Login      │   │              │   │ • Compliance │             │   │
│   │   │   events     │   │              │   │   rules      │             │   │
│   │   │ • Calls ko   │   │              │   │ • Auto       │             │   │
│   │   │   thay đổi   │   │              │   │   remediate  │             │   │
│   │   │   state      │   │              │   │              │             │   │
│   │   │              │   │              │   │              │             │   │
│   │   └──────────────┘   └──────────────┘   └──────────────┘             │   │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Cùng 1 sự kiện - 2 góc nhìn khác nhau

```
┌──────────────────────────────────────────────────────────────────────────────┐
│       User mở port 22 ra 0.0.0.0/0 trong Security Group                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              │                                               │
│                              ▼                                               │
│              ┌───────────────┴───────────────┐                               │
│              │      API Call xảy ra          │                               │
│              │  AuthorizeSecurityGroupIngress│                               │
│              └───────────────┬───────────────┘                               │
│                              │                                               │
│              ┌───────────────┴───────────────┐                               │
│              ▼                               ▼                               │
│   ┌─────────────────────┐       ┌─────────────────────┐                      │
│   │     CLOUDTRAIL      │       │     AWS CONFIG      │                      │
│   │                     │       │                     │                      │
│   │  GHI LẠI:           │       │  GHI LẠI:           │                      │
│   │  ─────────          │       │  ─────────          │                      │
│   │  • Ai: john@co.com  │       │  • State MỚI của SG │                      │
│   │  • Làm gì: Authorize│       │  • Port 22 open to  │                      │
│   │  • Lúc nào: 10:30   │       │    0.0.0.0/0        │                      │
│   │  • IP nguồn: 1.2.3.4│       │  • COMPLIANT hay    │                      │
│   │  • Success/Failed   │       │    NON-COMPLIANT?   │                      │
│   │                     │       │                     │                      │
│   │  KHÔNG biết:        │       │  KHÔNG biết:        │                      │
│   │  • SG có comply ko  │       │  • AI làm           │                      │
│   │  • State hiện tại   │       │  • Từ IP nào        │                      │
│   └─────────────────────┘       └─────────────────────┘                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Điểm khác biệt quan trọng

| | CloudTrail CÓ | AWS Config CÓ |
|--|--------------|---------------|
| **Trigger** | Mọi API call | Khi resource state thay đổi |
| **Failed calls** | ✅ Ghi lại | ❌ Không ghi (state không đổi) |
| **Read operations** | ✅ DescribeInstances, ListBuckets | ❌ Không ghi |
| **Periodic checks** | ❌ Không | ✅ Check định kỳ |
| **Compliance rules** | ❌ Không | ✅ Có |
| **Auto remediation** | ❌ Không | ✅ Có (SSM) |
| **Resources tạo từ trước** | ❌ Không (cần API call mới) | ✅ Phát hiện được |

### Ví dụ cụ thể

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       3 Scenarios cụ thể                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   SCENARIO 1: S3 bucket TẠO TỪ TRƯỚC đang public                             │
│   ─────────────────────────────────────────────────                          │
│   Không có API call mới nào                                                  │
│   CloudTrail: ❌ Không ghi gì (không có API call)                            │
│   AWS Config: ✅ PHÁT HIỆN "bucket này NON-COMPLIANT" (periodic check)       │
│                                                                              │
│   → AWS Config check ĐỊNH KỲ, không cần đợi API call!                        │
│                                                                              │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│   SCENARIO 2: User cố DELETE bucket nhưng THẤT BẠI (Access Denied)           │
│   ─────────────────────────────────────────────────────────────────          │
│   CloudTrail: ✅ GHI LẠI "DeleteBucket FAILED - AccessDenied"                │
│   AWS Config: ❌ KHÔNG ghi gì (state không đổi)                              │
│                                                                              │
│   → CloudTrail ghi cả failed calls!                                          │
│                                                                              │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│   SCENARIO 3: User chỉ XEM list EC2 (DescribeInstances)                      │
│   ──────────────────────────────────────────────────                         │
│   CloudTrail: ✅ GHI LẠI "DescribeInstances by user X"                       │
│   AWS Config: ❌ KHÔNG ghi gì (state không đổi)                              │
│                                                                              │
│   → CloudTrail ghi read operations!                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Khi nào dùng gì?

| Use Case | CloudTrail | AWS Config |
|----------|------------|------------|
| "Ai đã xóa S3 bucket này?" | ✅ | |
| "Từ IP nào có người login lạ?" | ✅ | |
| "User nào thay đổi Security Group?" | ✅ | |
| "SG nào đang mở port 22 ra 0.0.0.0/0?" | | ✅ |
| "S3 bucket nào đang public?" | | ✅ |
| "Tự động fix nếu resources violate rules" | | ✅ |
| "Check tất cả resources có comply không?" | | ✅ |

### Kết hợp cả 2: Complete Picture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                CloudTrail + AWS Config = Complete Picture                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Security Incident Investigation:                                           │
│                                                                              │
│   AWS Config: "Security Group sg-123 hiện đang NON-COMPLIANT                 │
│                vì port 22 open to 0.0.0.0/0"                                 │
│                                                                              │
│   → Đi check CloudTrail                                                      │
│                                                                              │
│   CloudTrail: "User john@company.com gọi AuthorizeSecurityGroupIngress       │
│                lúc 10:30 AM từ IP 1.2.3.4"                                   │
│                                                                              │
│   → Complete Picture: BIẾT cấu hình hiện tại + BIẾT ai đã làm                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Ví von để nhớ:**
> - **CloudTrail** = Camera an ninh ghi "AI vào cửa lúc nào"
> - **AWS Config** = Bảo vệ check "cửa có khóa đúng cách không?"
>
> Cả 2 đều trigger khi có người mở cửa, nhưng ghi lại thông tin khác nhau!

---

## Tổng Kết

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       CLOUDTRAIL KEY TAKEAWAYS                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ✅ CloudTrail = Security Camera: WHO did WHAT, WHEN, WHERE                  │
│                                                                              │
│  ✅ 3 Event Types: Management (default), Data, Insights                      │
│                                                                              │
│  ✅ Management Events FREE cho 1 trail                                       │
│                                                                              │
│  ✅ Data Events cho S3/Lambda - phải enable riêng (high volume, costs)       │
│                                                                              │
│  ✅ Multi-region trail recommended (all regions → 1 bucket)                  │
│                                                                              │
│  ✅ Organization trail cho multi-account                                     │
│                                                                              │
│  ✅ Enable Log File Validation để detect tampering                           │
│                                                                              │
│  ✅ Send to CloudWatch Logs cho real-time alerts                             │
│                                                                              │
│  ✅ Use EventBridge cho event-driven automation                              │
│                                                                              │
│  ⚠️  Event History chỉ giữ 90 ngày - create trail để lưu lâu hơn             │
│                                                                              │
│  ⚠️  Delivery delay ~15 phút (không phải real-time)                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```
