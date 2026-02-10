# AWS Monitoring & Audit - Tổng Quan & Diagrams

## 📋 Mục lục

- [Overview Diagram](#overview-diagram)
- [Từng service làm gì?](#từng-service-làm-gì)
- [CloudWatch - Monitoring](#cloudwatch---monitoring)
- [CloudTrail - Audit](#cloudtrail---audit)
- [AWS Config - Compliance](#aws-config---compliance)
- [X-Ray - Distributed Tracing](#x-ray---distributed-tracing)
- [Tổng hợp: Khi nào dùng service nào?](#tổng-hợp-khi-nào-dùng-service-nào)
- [Data Flow tổng thể](#data-flow-tổng-thể)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Overview Diagram

### Toàn cảnh hệ thống Monitoring & Audit trong AWS

```mermaid
graph TB
    subgraph APP["🏗️ AWS Resources"]
        EC2["💻 EC2"]
        LAMBDA["⚡ Lambda"]
        RDS["🗄️ RDS"]
        S3["📦 S3"]
        ECS["🐳 ECS"]
        API["🌐 API Gateway"]
    end

    subgraph MONITOR["📊 MONITORING - Hệ thống chạy thế nào?"]
        CW["📊 CloudWatch<br/>Metrics + Logs + Alarms"]
        XRAY["🔍 X-Ray<br/>Distributed Tracing"]
    end

    subgraph AUDIT["📝 AUDIT - Ai làm gì? Cấu hình đúng ko?"]
        CT["📝 CloudTrail<br/>API Call Logging"]
        CONFIG["⚙️ AWS Config<br/>Configuration Compliance"]
    end

    subgraph ADVISOR["💡 ADVISORY - Có gì cần cải thiện?"]
        TA["✅ Trusted Advisor<br/>Best Practice Checks"]
        HD["🏥 Health Dashboard<br/>Service Status"]
        CO["📐 Compute Optimizer<br/>Rightsizing"]
    end

    subgraph RESPOND["🚨 RESPONSE - Phản ứng tự động"]
        EB["📡 EventBridge"]
        SNS_R["📧 SNS"]
        LAMBDA_R["⚡ Lambda Auto-fix"]
    end

    APP -->|"metrics & logs"| CW
    APP -->|"traces"| XRAY
    APP -->|"API calls"| CT
    APP -->|"config changes"| CONFIG

    CW -->|"alarms"| EB
    CT -->|"events"| EB
    CONFIG -->|"non-compliant"| EB
    HD -->|"health events"| EB

    EB --> SNS_R
    EB --> LAMBDA_R

    style APP fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style MONITOR fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style AUDIT fill:#2c1810,color:#ecf0f1,stroke:#e67e22,stroke-width:2px
    style ADVISOR fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style RESPOND fill:#3b1520,color:#ecf0f1,stroke:#e74c3c,stroke-width:2px

    style EC2 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style LAMBDA fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style RDS fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style S3 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style ECS fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style API fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px

    style CW fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style XRAY fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style CT fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style CONFIG fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style TA fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style HD fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style CO fill:#1a5276,color:#fff,stroke:#2980b9,stroke-width:2px

    style EB fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style SNS_R fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
    style LAMBDA_R fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
```

---

## Từng service làm gì?

### Bảng so sánh nhanh

| Service | Câu hỏi trả lời | Dữ liệu | Ví dụ |
|---------|-----------------|----------|-------|
| **CloudWatch** | Hệ thống **chạy thế nào**? | Metrics, Logs, Alarms | CPU 85%, Error rate 2% |
| **CloudTrail** | **Ai** đã làm **gì**? | API call logs | "John xóa S3 bucket lúc 3AM" |
| **AWS Config** | Cấu hình có **đúng chuẩn** không? | Configuration history | "SG mở port 22 ra 0.0.0.0/0" |
| **X-Ray** | Request đi qua đâu, **chậm ở đâu**? | Traces, Service Map | "DynamoDB query mất 800ms" |
| **Trusted Advisor** | Có gì cần **cải thiện**? | Best practice checks | "3 EIPs không dùng, phí $52/tháng" |
| **Health Dashboard** | AWS service có **sự cố** gì? | Service/Account events | "EC2 degraded ở us-east-1" |
| **Compute Optimizer** | Resource có **đúng size**? | Rightsizing recommendations | "EC2 m5.xlarge → m5.large" |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MONITORING vs AUDIT vs ADVISORY                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 MONITORING (Real-time)       📝 AUDIT (Historical)                    │
│  ════════════════════════        ════════════════════                       │
│  "Hệ thống đang chạy sao?"      "Ai đã làm gì? Đúng chuẩn ko?"          │
│                                                                             │
│  • CloudWatch  → Metrics/Logs    • CloudTrail → API logs                   │
│  • X-Ray       → Traces          • Config     → Compliance                 │
│                                                                             │
│  💡 ADVISORY (Recommendations)   🚨 RESPONSE (Automation)                 │
│  ════════════════════════════    ════════════════════════                   │
│  "Có gì cần cải thiện?"         "Tự động xử lý khi có vấn đề"            │
│                                                                             │
│  • Trusted Advisor → 5 pillars   • EventBridge → Route events             │
│  • Health Dashboard → Incidents  • SNS         → Notify                    │
│  • Compute Optimizer → Sizing    • Lambda      → Auto-remediate            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudWatch - Monitoring

### "Hệ thống đang chạy thế nào?"

```mermaid
graph TB
    subgraph SOURCES["📥 Data Sources"]
        direction LR
        AWS_SVC["AWS Services<br/>EC2, RDS, Lambda..."]
        AGENT["CloudWatch Agent<br/>Memory, Disk, Custom"]
        APP_LOG["Application Logs<br/>stdout, log files"]
    end

    subgraph CW_CORE["📊 CloudWatch Core"]
        METRICS["📈 Metrics<br/>Time-series data<br/>VD: CPUUtilization"]
        LOGS["📋 Logs<br/>Log Groups → Log Streams<br/>VD: /var/log/app.log"]
        ALARMS["🔔 Alarms<br/>Threshold-based alerts<br/>VD: CPU > 80%"]
        DASH["📺 Dashboards<br/>Visualization<br/>Cross-region, cross-account"]
        INSIGHTS["🔍 Logs Insights<br/>SQL-like queries<br/>trên CloudWatch Logs"]
    end

    subgraph ACTIONS["🎯 Actions"]
        direction LR
        SNS_A["📧 SNS Notification"]
        ASG_A["📐 Auto Scaling"]
        EC2_A["🔄 EC2 Actions<br/>Stop/Terminate/Reboot"]
        LAMBDA_A["⚡ Lambda"]
    end

    SOURCES --> CW_CORE
    ALARMS -->|"ALARM state"| ACTIONS

    style SOURCES fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style CW_CORE fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style ACTIONS fill:#3b1520,color:#ecf0f1,stroke:#e74c3c,stroke-width:2px
    style AWS_SVC fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style AGENT fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style APP_LOG fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style METRICS fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style LOGS fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style ALARMS fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style DASH fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style INSIGHTS fill:#0e6655,color:#fff,stroke:#16a085,stroke-width:2px
    style SNS_A fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
    style ASG_A fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
    style EC2_A fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
    style LAMBDA_A fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
```

### Điểm quan trọng cần nhớ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 CLOUDWATCH KEY POINTS                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ⚠️ EC2 Default Metrics:                                                   │
│  ├── ✅ CÓ sẵn: CPU, Network, Disk I/O, Status Checks                     │
│  ├── ❌ KHÔNG có: Memory, Disk space (cần CloudWatch Agent)                │
│  └── Default period: 5 phút (Detailed: 1 phút, có phí)                    │
│                                                                             │
│  🔔 Alarm States: OK → ALARM → INSUFFICIENT_DATA                          │
│                                                                             │
│  📋 Log Retention: Mặc định NEVER EXPIRE (phải set manually)              │
│                                                                             │
│  📈 High-Resolution Metrics: Xuống tới 1 giây (custom metrics)            │
│                                                                             │
│  💡 Composite Alarms: Kết hợp nhiều alarms bằng AND/OR                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CloudTrail - Audit

### "Ai đã làm gì, khi nào, từ đâu?"

```mermaid
graph TB
    subgraph WHO["👤 Ai gọi API?"]
        direction LR
        CONSOLE["🖥️ Console User"]
        CLI["⌨️ CLI/SDK"]
        SERVICE["⚙️ AWS Service"]
    end

    subgraph CT_CORE["📝 CloudTrail"]
        MGMT["📋 Management Events<br/>Control plane operations<br/>CreateVPC, RunInstances<br/>✅ Mặc định BẬT"]
        DATA["📦 Data Events<br/>Data plane operations<br/>S3 GetObject, Lambda Invoke<br/>❌ Mặc định TẮT - phí cao"]
        INSIGHT["🧠 Insights Events<br/>Unusual activity detection<br/>Spike in API calls<br/>❌ Mặc định TẮT - phí"]
    end

    subgraph STORE["💾 Lưu trữ"]
        HISTORY["📜 Event History<br/>90 ngày miễn phí<br/>Xem trên Console"]
        S3_STORE["📦 S3 Bucket<br/>Lưu vĩnh viễn<br/>JSON logs"]
        CW_LOGS["📊 CloudWatch Logs<br/>Query & Alert<br/>Real-time monitoring"]
    end

    WHO -->|"mọi API call"| CT_CORE
    CT_CORE --> STORE

    style WHO fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style CT_CORE fill:#2c1810,color:#ecf0f1,stroke:#e67e22,stroke-width:2px
    style STORE fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style CONSOLE fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style CLI fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style SERVICE fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style MGMT fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style DATA fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style INSIGHT fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style HISTORY fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style S3_STORE fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style CW_LOGS fill:#0e6655,color:#fff,stroke:#16a085,stroke-width:2px
```

### CloudTrail Event Record

```json
{
  "eventTime":    "2024-01-15T10:30:00Z",
  "eventSource":  "s3.amazonaws.com",
  "eventName":    "DeleteBucket",
  "userIdentity": {
    "type": "IAMUser",
    "userName": "john"
  },
  "sourceIPAddress": "203.0.113.50",
  "requestParameters": {
    "bucketName": "my-important-bucket"
  },
  "responseElements": null,
  "errorCode": null
}
```

> → **"john" xóa bucket "my-important-bucket" lúc 10:30 từ IP 203.0.113.50**

---

## AWS Config - Compliance

### "Cấu hình có đúng chuẩn không?"

```mermaid
graph TB
    subgraph RESOURCES["🏗️ AWS Resources thay đổi"]
        RES["EC2, S3, RDS, VPC,<br/>Security Groups, IAM..."]
    end

    subgraph CONFIG_CORE["⚙️ AWS Config"]
        RECORDER["📹 Configuration Recorder<br/>Ghi lại MỌI thay đổi"]
        CI["📝 Configuration Items<br/>Snapshot tại thời điểm"]
        TIMELINE["📅 Configuration Timeline<br/>Lịch sử thay đổi"]

        subgraph RULES["📏 Config Rules"]
            MANAGED_R["AWS Managed Rules<br/>250+ rules có sẵn"]
            CUSTOM_R["Custom Rules<br/>Lambda functions"]
        end
    end

    subgraph RESULT["📊 Kết quả"]
        COMPLIANT["✅ COMPLIANT"]
        NON["❌ NON-COMPLIANT"]
    end

    subgraph RESPOND_C["🔧 Remediation"]
        AUTO["🤖 Auto Remediation<br/>SSM Automation"]
        MANUAL["👤 Manual Fix"]
    end

    RES -->|"config changes"| RECORDER
    RECORDER --> CI
    CI --> TIMELINE
    CI --> RULES
    RULES --> COMPLIANT
    RULES --> NON
    NON --> RESPOND_C

    style RESOURCES fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style CONFIG_CORE fill:#2c1810,color:#ecf0f1,stroke:#e67e22,stroke-width:2px
    style RULES fill:#1c2833,color:#ecf0f1,stroke:#f1c40f,stroke-width:1px
    style RESULT fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style RESPOND_C fill:#3b1520,color:#ecf0f1,stroke:#e74c3c,stroke-width:2px
    style RES fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:2px
    style RECORDER fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style CI fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style TIMELINE fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style MANAGED_R fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style CUSTOM_R fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style COMPLIANT fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:3px
    style NON fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:3px
    style AUTO fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
    style MANUAL fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
```

### Popular Config Rules

| Rule | Kiểm tra gì? |
|------|--------------|
| `s3-bucket-public-read-prohibited` | S3 bucket không public read |
| `ec2-instance-no-public-ip` | EC2 không có public IP |
| `rds-storage-encrypted` | RDS storage encrypted |
| `encrypted-volumes` | EBS volumes encrypted |
| `iam-root-access-key-check` | Root không có access keys |
| `restricted-ssh` | SSH không mở 0.0.0.0/0 |

> [!IMPORTANT]
> AWS Config **KHÔNG ngăn chặn** changes — chỉ **recording và evaluating**.
> Để prevent changes → dùng SCPs hoặc IAM Policies.

---

## X-Ray - Distributed Tracing

### "Request đi qua đâu, chậm ở đâu?"

```mermaid
graph LR
    CLIENT["👤 Client"] --> APIGW["🌐 API Gateway<br/>12ms"]
    APIGW --> LAMBDA_X["⚡ Lambda<br/>45ms"]
    LAMBDA_X --> DDB["📊 DynamoDB<br/>8ms"]
    LAMBDA_X --> SQS_X["📨 SQS<br/>3ms"]
    SQS_X --> WORKER["⚡ Worker Lambda<br/>120ms"]
    WORKER --> S3_X["📦 S3<br/>15ms"]
    WORKER --> EXT["🌍 External API<br/>800ms ⚠️"]

    style CLIENT fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style APIGW fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style LAMBDA_X fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style DDB fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style SQS_X fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style WORKER fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style S3_X fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style EXT fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:3px
```

> ☝️ X-Ray Service Map cho thấy **External API** mất **800ms** — đây là bottleneck!

### X-Ray Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 X-RAY KEY CONCEPTS                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Trace    = Toàn bộ journey của 1 request (end-to-end)                     │
│  Segment  = 1 service xử lý request đó                                     │
│  Subsegment = Chi tiết bên trong segment (DB call, HTTP call)              │
│                                                                             │
│  ┌─── TRACE ─────────────────────────────────────────────────────────┐     │
│  │                                                                    │     │
│  │  ┌─ Segment: API GW ─┐ ┌─ Segment: Lambda ──────────────────┐   │     │
│  │  │    12ms            │ │    45ms                              │   │     │
│  │  └────────────────────┘ │  ┌─ Sub: DynamoDB ─┐                │   │     │
│  │                         │  │    8ms           │                │   │     │
│  │                         │  └──────────────────┘                │   │     │
│  │                         │  ┌─ Sub: SQS ──────┐                │   │     │
│  │                         │  │    3ms           │                │   │     │
│  │                         │  └──────────────────┘                │   │     │
│  │                         └─────────────────────────────────────────┘     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Annotations = Key-value pairs để SEARCH traces                            │
│  Metadata    = Key-value pairs KHÔNG searchable (thêm context)             │
│  Sampling    = Chỉ trace 1 phần requests (tiết kiệm cost)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tổng hợp: Khi nào dùng service nào?

```mermaid
graph TB
    Q["❓ Bạn cần gì?"]

    Q -->|"CPU, Memory,<br/>Error rate?"| CW_R["📊 CloudWatch<br/>Performance Monitoring"]
    Q -->|"Ai xóa resource?<br/>API audit?"| CT_R["📝 CloudTrail<br/>API Call Audit"]
    Q -->|"SG mở sai port?<br/>Encryption check?"| CF_R["⚙️ AWS Config<br/>Compliance Check"]
    Q -->|"Request chậm ở đâu?<br/>Bottleneck?"| XR_R["🔍 X-Ray<br/>Distributed Tracing"]
    Q -->|"AWS đang có sự cố?<br/>Maintenance?"| HD_R["🏥 Health Dashboard<br/>Service Status"]
    Q -->|"Best practices?<br/>Tiết kiệm chi phí?"| TA_R["✅ Trusted Advisor<br/>Recommendations"]
    Q -->|"EC2 quá lớn?<br/>Right-sizing?"| CO_R["📐 Compute Optimizer<br/>Resource Sizing"]

    style Q fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:3px
    style CW_R fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style CT_R fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style CF_R fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style XR_R fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style HD_R fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style TA_R fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style CO_R fill:#1a5276,color:#fff,stroke:#2980b9,stroke-width:2px
```

### Câu hỏi thường gặp trong exam

| Câu hỏi | Đáp án |
|----------|--------|
| "Ai xóa S3 bucket?" | **CloudTrail** |
| "CPU EC2 bao nhiêu %?" | **CloudWatch** |
| "Security Group có mở port nguy hiểm?" | **AWS Config** |
| "Lambda function chậm do service nào?" | **X-Ray** |
| "EC2 us-east-1 có đang bị sự cố?" | **Health Dashboard** |
| "Có instance nào quá lớn lãng phí tiền?" | **Trusted Advisor / Compute Optimizer** |
| "S3 bucket có bật encryption chưa?" | **AWS Config** |
| "Phát hiện unusual API activity?" | **CloudTrail Insights** |
| "Log retention Policy?" | **CloudWatch Logs** |
| "Cấu hình resource thay đổi thế nào theo thời gian?" | **AWS Config (Timeline)** |

---

## Data Flow tổng thể

### Cách các services kết nối với nhau

```mermaid
graph TB
    subgraph COLLECT["📥 Thu thập dữ liệu"]
        E1["💻 EC2/ECS/EKS"]
        E2["⚡ Lambda"]
        E3["🗄️ RDS"]
        E4["📦 S3"]
    end

    subgraph PROCESS["⚙️ Xử lý & Phân tích"]
        CW_P["📊 CloudWatch<br/>Metrics + Logs"]
        CT_P["📝 CloudTrail<br/>API Logs"]
        CFG_P["⚙️ Config<br/>Compliance"]
        XR_P["🔍 X-Ray<br/>Traces"]
    end

    subgraph STORE_ALL["💾 Lưu trữ lâu dài"]
        S3_ALL["📦 S3<br/>Archive logs"]
        CWL["📋 CloudWatch Logs<br/>Query & Search"]
    end

    subgraph VISUALIZE["📺 Visualization"]
        CW_DASH["📊 CW Dashboards"]
        XR_MAP["🗺️ X-Ray Service Map"]
        CFG_TL["📅 Config Timeline"]
    end

    subgraph ALERT_ALL["🚨 Alert & Automate"]
        EB_ALL["📡 EventBridge"]
        SNS_ALL["📧 SNS → Email/Slack"]
        LBD_ALL["⚡ Lambda → Auto-fix"]
    end

    COLLECT --> PROCESS
    CW_P --> STORE_ALL
    CT_P --> S3_ALL
    PROCESS --> VISUALIZE
    CW_P -->|"Alarms"| EB_ALL
    CT_P -->|"Events"| EB_ALL
    CFG_P -->|"Non-compliant"| EB_ALL
    EB_ALL --> SNS_ALL
    EB_ALL --> LBD_ALL

    style COLLECT fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style PROCESS fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style STORE_ALL fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style VISUALIZE fill:#2c1830,color:#ecf0f1,stroke:#8e44ad,stroke-width:2px
    style ALERT_ALL fill:#3b1520,color:#ecf0f1,stroke:#e74c3c,stroke-width:2px

    style E1 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style E2 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style E3 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style E4 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style CW_P fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style CT_P fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style CFG_P fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style XR_P fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style S3_ALL fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style CWL fill:#0e6655,color:#fff,stroke:#16a085,stroke-width:2px
    style CW_DASH fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style XR_MAP fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style CFG_TL fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style EB_ALL fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style SNS_ALL fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
    style LBD_ALL fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
```

---

## Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING & AUDIT BEST PRACTICES                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣  CLOUDWATCH                                                            │
│  ├── ✅ Cài CloudWatch Agent cho Memory & Disk metrics                     │
│  ├── ✅ Set Alarms cho critical metrics (CPU, Memory, Error rate)          │
│  ├── ✅ Dùng Composite Alarms tránh false positives                        │
│  ├── ✅ Set Log Retention (tránh lưu vĩnh viễn tốn phí)                   │
│  └── ✅ Dùng Logs Insights để query thay vì đọc raw logs                  │
│                                                                             │
│  2️⃣  CLOUDTRAIL                                                            │
│  ├── ✅ Enable cho ALL REGIONS (không chỉ region đang dùng)               │
│  ├── ✅ Lưu logs vào S3 với encryption + versioning                        │
│  ├── ✅ Enable Log File Validation (chống tamper)                          │
│  ├── ✅ Enable Insights cho unusual activity detection                     │
│  └── ❌ KHÔNG tắt CloudTrail (audit requirement)                           │
│                                                                             │
│  3️⃣  AWS CONFIG                                                            │
│  ├── ✅ Enable cho tất cả resource types                                   │
│  ├── ✅ Dùng Conformance Packs cho compliance frameworks                   │
│  ├── ✅ Set up Auto Remediation cho critical rules                         │
│  └── ✅ Dùng Aggregator cho multi-account visibility                      │
│                                                                             │
│  4️⃣  X-RAY                                                                │
│  ├── ✅ Enable cho production workloads                                    │
│  ├── ✅ Dùng Sampling Rules (không trace 100% requests)                    │
│  ├── ✅ Thêm Annotations cho searchable metadata                          │
│  └── ✅ Kết hợp với CloudWatch ServiceLens                                │
│                                                                             │
│  5️⃣  GENERAL                                                               │
│  ├── ✅ Dùng EventBridge để kết nối tất cả services                       │
│  ├── ✅ Centralized logging account (Organizations)                        │
│  ├── ✅ Set up automated responses cho security events                     │
│  └── ✅ Review dashboards và reports định kỳ                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips

> [!TIP]
> **Ghi nhớ nhanh:**
> - **CloudWatch** = PERFORMANCE monitoring (metrics, logs, alarms)
> - **CloudTrail** = API AUDIT (ai, làm gì, khi nào)
> - **Config** = COMPLIANCE (cấu hình đúng chuẩn không?)
> - **X-Ray** = TRACING (request đi qua đâu, bottleneck?)
> - **Health Dashboard** = AWS SERVICE STATUS
> - **Trusted Advisor** = BEST PRACTICE recommendations (5 pillars)

> [!CAUTION]
> **Dễ nhầm lẫn:**
> - "EC2 Memory metric?" → **CloudWatch Agent** (KHÔNG phải default metric!)
> - CloudTrail vs Config? → Trail = **ai làm gì** / Config = **cấu hình đúng ko**
> - CloudWatch vs CloudTrail Logs? → CW = **application logs** / CT = **API call logs**
> - Config có ngăn changes không? → **KHÔNG** (chỉ detect & alert)
> - CloudTrail Event History? → Chỉ **90 ngày** miễn phí trên Console
> - X-Ray vs CloudWatch? → X-Ray = **distributed tracing** / CW = **metrics & logs**

---

## Liên kết tài liệu

- [CloudWatch chi tiết](./cloudwatch.md)
- [CloudTrail chi tiết](./cloudtrail.md)
- [AWS Config chi tiết](./aws-config.md)
- [X-Ray chi tiết](./aws-xray.md)
- [Health Dashboard](./aws-health-dashboard.md)
- [Trusted Advisor](./aws-trusted-advisor.md)
- [Compute Optimizer](./aws-compute-optimizer.md)
- [EventBridge](./eventbridge.md)
