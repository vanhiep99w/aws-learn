# Amazon EMR (Elastic MapReduce)

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Kiến trúc](#kiến-trúc)
- [Deployment Options](#deployment-options)
- [Frameworks hỗ trợ](#frameworks-hỗ-trợ)
- [Use Cases](#use-cases)
- [Pricing](#pricing)
- [So sánh với các services khác](#so-sánh-với-các-services-khác)
- [Exam Tips](#exam-tips)

---

## Giới thiệu

**Amazon EMR** (Elastic MapReduce) là **managed cluster platform** giúp chạy các **big data frameworks** như Apache Spark, Hadoop, Hive, Presto để xử lý và phân tích **petabytes of data**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Amazon EMR Overview                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   📊 BIG DATA PROCESSING PLATFORM                                           │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Your Big Data                                    │   │
│   │       Logs  │  Clickstreams  │  IoT  │  Transactions                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Amazon EMR                                     │   │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│   │   │  Spark   │ │  Hadoop  │ │   Hive   │ │  Presto  │               │   │
│   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘               │   │
│   │                                                                     │   │
│   │   Auto-scaling  │  Managed  │  Cost-effective  │  Fast              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Insights & Results                             │   │
│   │   Reports  │  ML Models  │  Analytics  │  Data Warehouse            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Managed Service** | AWS quản lý cluster, bạn focus vào data processing |
| **Scalable** | Xử lý từ GB đến PB data |
| **Cost-effective** | Per-second billing, Spot Instances support |
| **Open Source** | Spark, Hadoop, Hive, Presto, Flink... |
| **Flexible** | EC2, EKS, hoặc Serverless deployment |

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EMR Cluster Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    APPLICATIONS & PROGRAMS                          │   │
│   │   Spark │ Hive │ Presto │ Flink │ HBase │ TensorFlow │ Hudi         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    DATA PROCESSING FRAMEWORK                        │   │
│   │              Hadoop MapReduce  │  Apache Spark                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    RESOURCE MANAGEMENT                              │   │
│   │                         YARN                                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    STORAGE LAYER                                    │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │   │     HDFS     │  │    EMRFS     │  │   Local FS   │              │   │
│   │   │  (ephemeral) │  │ (S3-backed)  │  │              │              │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### EMR Cluster Nodes

| Node Type | Vai trò | Bắt buộc |
|-----------|---------|----------|
| **Master Node** | Quản lý cluster, run YARN ResourceManager | ✅ Yes |
| **Core Node** | Chạy tasks + lưu data trong HDFS | Tùy chọn |
| **Task Node** | Chỉ chạy tasks, không lưu data | Tùy chọn |

### Storage Options

| Storage | Đặc điểm | Dùng khi |
|---------|----------|----------|
| **HDFS** | Ephemeral, distributed, fast I/O | Temporary processing |
| **EMRFS (S3)** | Persistent, scalable, cost-effective | Long-term storage |
| **Local FS** | Instance storage | Buffers, caches |

> **EMRFS** = EMR File System - cho phép EMR đọc/ghi S3 như file system thông thường

---

## Deployment Options

EMR có **3 deployment options**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EMR Deployment Options                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│   │    EMR on EC2        │  │    EMR on EKS        │  │  EMR Serverless  │  │
│   │                      │  │                      │  │                  │  │
│   │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────┐  │  │
│   │  │  EC2 Instances │  │  │  │ EKS Pods       │  │  │  │ Auto-scale │  │  │
│   │  │  ┌────┐┌────┐  │  │  │  │ ┌────┐┌────┐   │  │  │  │ resources  │  │  │
│   │  │  │    ││    │  │  │  │  │ │    ││    │   │  │  │  └────────────┘  │  │
│   │  │  └────┘└────┘  │  │  │  │ └────┘└────┘   │  │  │                  │  │
│   │  └────────────────┘  │  │  └────────────────┘  │  │  No cluster      │  │
│   │                      │  │                      │  │  management!     │  │
│   │  Full control        │  │  Kubernetes          │  │                  │  │
│   │  Spot Instances      │  │  Container-based     │  │  Pay per use     │  │
│   └──────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### So sánh Deployment Options

| | EMR on EC2 | EMR on EKS | EMR Serverless |
|--|------------|------------|----------------|
| **Quản lý** | Bạn quản lý cluster | Bạn quản lý EKS | AWS quản lý hoàn toàn |
| **Control** | Full control instances | Container-level | Chỉ submit jobs |
| **Scaling** | Manual/Managed | Kubernetes autoscaling | Auto (fine-grained) |
| **Spot support** | ✅ | ✅ (EC2 mode) | ❌ |
| **Best for** | Long-running, predictable | Kubernetes shops | Bursty, batch jobs |

---

## Frameworks hỗ trợ

| Framework | Dùng để | Đặc điểm |
|-----------|---------|----------|
| **Apache Spark** | General processing, ML, streaming | In-memory, rất nhanh |
| **Apache Hadoop** | Batch processing | MapReduce traditional |
| **Apache Hive** | SQL queries on big data | Data warehouse style |
| **Presto** | Interactive SQL queries | Fast, federated queries |
| **Apache Flink** | Real-time streaming | Low latency |
| **Apache HBase** | NoSQL database | Random read/write |
| **Apache Hudi** | Data lake transactions | ACID on data lakes |
| **TensorFlow/MXNet** | Machine Learning | Distributed ML training |

---

## Use Cases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EMR Use Cases                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   📊 BIG DATA ANALYTICS                                                     │
│   • Analyze clickstream data                                                │
│   • Process log files                                                       │
│   • Business intelligence                                                   │
│                                                                             │
│   🔄 ETL (Extract, Transform, Load)                                         │
│   • Clean và transform data                                                 │
│   • Move data between systems                                               │
│   • Data pipeline processing                                                │
│                                                                             │
│   🤖 MACHINE LEARNING                                                       │
│   • Train ML models on large datasets                                       │
│   • Feature engineering                                                     │
│   • Hyperparameter tuning                                                   │
│                                                                             │
│   📈 REAL-TIME STREAMING                                                    │
│   • Process IoT data                                                        │
│   • Real-time analytics                                                     │
│   • Fraud detection                                                         │
│                                                                             │
│   🔍 INTERACTIVE ANALYTICS                                                  │
│   • Ad-hoc SQL queries                                                      │
│   • Data exploration                                                        │
│   • BI tools integration                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pricing

### Per-second billing (1-minute minimum)

| Deployment | Chi phí |
|------------|---------|
| **EMR on EC2** | EC2 price + EMR uplift (varies by instance) |
| **EMR on EKS** | EKS price ($0.10/hr) + EC2/Fargate + EMR uplift |
| **EMR Serverless** | vCPU/hr + Memory/hr + Storage/hr |

### Cost Optimization Tips

| Strategy | Tiết kiệm |
|----------|-----------|
| **Spot Instances** | Đến 90% cho Task nodes |
| **EMR Serverless** | Chỉ trả cho resources dùng |
| **Auto-termination** | Terminate cluster khi xong job |
| **Right-sizing** | Chọn instance types phù hợp |

### Ví dụ pricing

```
EMR on EC2 example (m6g.xlarge):
─────────────────────────────────
EC2 price:   $0.154/hr
EMR uplift:  $0.045/hr
────────────────────────
Total:       $0.199/hr

→ 10-node cluster chạy 2 giờ = 10 × $0.199 × 2 = $3.98
```

---

## So sánh với các services khác

| Service | Dùng khi |
|---------|----------|
| **EMR** | Big data processing với open-source frameworks (Spark, Hadoop) |
| **AWS Glue** | Serverless ETL, nhẹ hơn EMR |
| **Athena** | Ad-hoc SQL queries trên S3 (không cần cluster) |
| **Redshift** | Data warehouse, structured data |
| **Kinesis** | Real-time streaming ingestion |

### EMR vs Glue

| | EMR | AWS Glue |
|--|-----|----------|
| **Type** | Cluster-based | Serverless ETL |
| **Control** | Full control, flexible | Limited, managed |
| **Frameworks** | Nhiều (Spark, Hadoop, Hive...) | Spark only |
| **Pricing** | Per-second (cluster) | Per DPU-hour |
| **Best for** | Complex processing, ML | Simple ETL jobs |

---

## Exam Tips

### Key Points cho Cloud Practitioner

| Câu hỏi | Đáp án |
|---------|--------|
| "Process petabytes of data với Hadoop/Spark?" | **Amazon EMR** |
| "Managed big data cluster platform?" | **Amazon EMR** |
| "Run Apache Spark on AWS?" | **Amazon EMR** |
| "ETL với full control, nhiều frameworks?" | **Amazon EMR** |
| "Simple serverless ETL?" | **AWS Glue** (không phải EMR) |

### Nhớ

```
EMR = "Elastic MapReduce"
    = Managed cluster cho BIG DATA
    = Chạy Spark, Hadoop, Hive, Presto...
    
3 deployment options:
├── EMR on EC2     → Full control
├── EMR on EKS     → Kubernetes
└── EMR Serverless → No cluster management

Storage:
├── HDFS    → Ephemeral (in-cluster)
└── EMRFS   → Persistent (S3-backed)
```

---

## Tài liệu tham khảo

- [Amazon EMR Documentation](https://docs.aws.amazon.com/emr/)
- [EMR Pricing](https://aws.amazon.com/emr/pricing/)
- [EMR Best Practices Guide](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan.html)
