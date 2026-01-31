# AWS Glue


## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
- [Thành phần chính (Core Components)](#thành-phần-chính-core-components)
- [AWS Glue Studio](#aws-glue-studio)
- [AWS Glue Features](#aws-glue-features)
- [Job Bookmarks (Incremental Processing)](#job-bookmarks-incremental-processing)
- [Streaming ETL](#streaming-etl)
- [Worker Types & Pricing](#worker-types-pricing)
- [So sánh với các dịch vụ khác](#so-sánh-với-các-dịch-vụ-khác)
- [Ví dụ thực tế: E-commerce Data Pipeline](#ví-dụ-thực-tế-e-commerce-data-pipeline)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)
- [Tích hợp với các dịch vụ AWS](#tích-hợp-với-các-dịch-vụ-aws)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**AWS Glue** là một dịch vụ **serverless data integration** giúp bạn khám phá, chuẩn bị, di chuyển và tích hợp dữ liệu từ nhiều nguồn khác nhau. Nó được thiết kế cho:

- **Analytics** - Chuẩn bị dữ liệu cho phân tích
- **Machine Learning** - ETL pipeline cho ML workflows
- **Application Development** - Tích hợp dữ liệu cho ứng dụng

> [!TIP]
> AWS Glue là **fully managed** - bạn không cần quản lý infrastructure. Nó tự động scale và bạn chỉ trả tiền khi job đang chạy.

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Glue Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   S3        │     │   RDS       │     │  Redshift   │   Data Sources    │
│  │   Bucket    │     │  Database   │     │  Cluster    │                   │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                   │
│         │                   │                   │                           │
│         └───────────────────┼───────────────────┘                           │
│                             │                                               │
│                             ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │    Crawlers     │  ← Tự động khám phá schema           │
│                    └────────┬────────┘                                      │
│                             │                                               │
│                             ▼                                               │
│         ┌───────────────────────────────────────┐                          │
│         │         AWS Glue Data Catalog         │                          │
│         │  ┌─────────────────────────────────┐  │                          │
│         │  │  Databases  │  Tables  │ Schema │  │  ← Central Metadata      │
│         │  └─────────────────────────────────┘  │                          │
│         └───────────────────┬───────────────────┘                          │
│                             │                                               │
│                             ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │    ETL Jobs     │  ← Transform data                    │
│                    │  (Spark / Ray)  │                                      │
│                    └────────┬────────┘                                      │
│                             │                                               │
│         ┌───────────────────┼───────────────────┐                          │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │  S3 Data    │     │  Redshift   │     │  Other      │   Data Targets    │
│  │  Lake       │     │  Tables     │     │  Targets    │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Thành phần chính (Core Components)

### 1. AWS Glue Data Catalog

**Data Catalog** là nơi lưu trữ metadata (persistent metadata store) của AWS Glue:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS Glue Data Catalog                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Databases                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │ sales_db    │  │ users_db    │  │ logs_db     │     │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │   │
│  │         │                │                │             │   │
│  │         ▼                ▼                ▼             │   │
│  │    ┌─────────┐      ┌─────────┐      ┌─────────┐       │   │
│  │    │ Tables  │      │ Tables  │      │ Tables  │       │   │
│  │    │ • orders│      │ • users │      │ • access│       │   │
│  │    │ • items │      │ • prefs │      │ • errors│       │   │
│  │    └─────────┘      └─────────┘      └─────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Mỗi Table chứa:                                         │   │
│  │  • Column names & data types                             │   │
│  │  • Partition information                                 │   │
│  │  • Location của data (S3, RDS, etc.)                     │   │
│  │  • Classification (JSON, Parquet, CSV, etc.)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Đặc điểm quan trọng:**
- Mỗi AWS account có **một Data Catalog per Region**
- Tables chỉ chứa **metadata**, không chứa actual data
- Data thực tế vẫn ở data store gốc (S3, RDS, etc.)
- Sử dụng được với: **Amazon Athena, Amazon EMR, Amazon Redshift Spectrum**

---

### 2. Crawlers

**Crawler** là chương trình tự động kết nối với data store và tạo metadata:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Crawler Workflow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │  S3 Bucket  │                                                │
│  │  ───────────│                                                │
│  │  /raw/      │                                                │
│  │   ├─ 2024/  │ ──────┐                                        │
│  │   │  ├─ jan/│       │                                        │
│  │   │  └─ feb/│       │                                        │
│  │   └─ 2025/  │       │                                        │
│  └─────────────┘       │                                        │
│                        ▼                                        │
│              ┌─────────────────┐                                │
│              │    Crawler      │                                │
│              │ ─────────────── │                                │
│              │ 1. Connect      │                                │
│              │ 2. Classify     │ ← Xác định format (CSV, JSON..│
│              │ 3. Infer Schema │ ← Tự động detect columns      │
│              │ 4. Write to     │                                │
│              │    Catalog      │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │  Data Catalog   │                                │
│              │ ─────────────── │                                │
│              │ Table: raw_data │                                │
│              │ Columns:        │                                │
│              │  - id: bigint   │                                │
│              │  - name: string │                                │
│              │  - date: date   │                                │
│              │ Partitions:     │                                │
│              │  - year         │                                │
│              │  - month        │                                │
│              └─────────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Crawler hỗ trợ:**
- **Data stores**: S3, DynamoDB, MongoDB, JDBC databases (RDS, Redshift)
- **File formats**: CSV, JSON, Parquet, Avro, ORC, XML

---

### 3. Classifiers

**Classifier** xác định schema của data:

| Classifier Type | Mô tả |
|----------------|-------|
| **Built-in** | CSV, JSON, Avro, XML, Parquet, ORC |
| **JDBC** | Cho relational databases |
| **Grok** | Custom patterns (tương tự Logstash) |
| **XML** | Dùng row tag |

```python
# Ví dụ Grok pattern cho Apache access log
%{COMBINEDAPACHELOG}

# Sẽ parse log thành columns:
# - clientip
# - ident
# - auth
# - timestamp
# - verb
# - request
# - httpversion
# - response
# - bytes
```

---

### 4. Connections

**Connection** lưu thông tin kết nối đến data store:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Connection Types                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  JDBC Connections                                        │   │
│  │  • Amazon RDS (MySQL, PostgreSQL, Oracle, SQL Server)   │   │
│  │  • Amazon Redshift                                       │   │
│  │  • On-premises databases (qua VPN/Direct Connect)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Network Connections                                     │   │
│  │  • VPC configuration (subnet, security group)           │   │
│  │  • AWS Secrets Manager for credentials                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Native Connections (70+ sources)                        │   │
│  │  • MongoDB, DocumentDB                                   │   │
│  │  • Kafka, Amazon MSK                                     │   │
│  │  • Salesforce, SAP, Snowflake                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. ETL Jobs

**Job** chứa business logic để ETL data:

```
┌─────────────────────────────────────────────────────────────────┐
│                          ETL Job Types                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │  Spark ETL Jobs                                    │         │
│  │  ─────────────────────────────────────────────────│         │
│  │  • PySpark hoặc Scala scripts                     │         │
│  │  • Distributed processing trên cluster            │         │
│  │  • Xử lý batch và streaming data                  │         │
│  │  • Hỗ trợ DynamicFrame và DataFrame               │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │  Python Shell Jobs                                 │         │
│  │  ─────────────────────────────────────────────────│         │
│  │  • Python scripts không dùng Spark               │         │
│  │  • Phù hợp cho small data hoặc simple ETL        │         │
│  │  • Chi phí thấp hơn                               │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌───────────────────────────────────────────────────┐         │
│  │  Ray Jobs (mới)                                    │         │
│  │  ─────────────────────────────────────────────────│         │
│  │  • Dùng Ray framework                             │         │
│  │  • Tối ưu cho ML workloads                        │         │
│  │  • Distributed Python                             │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6. DynamicFrame

**DynamicFrame** là abstraction của AWS Glue (khác với Spark DataFrame):

```
┌─────────────────────────────────────────────────────────────────┐
│                DynamicFrame vs DataFrame                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────┐    ┌───────────────────────┐        │
│  │     DynamicFrame      │    │      DataFrame        │        │
│  ├───────────────────────┤    ├───────────────────────┤        │
│  │ • Self-describing     │    │ • Fixed schema        │        │
│  │   records             │    │                       │        │
│  │ • Schema-on-read      │    │ • Schema-on-write     │        │
│  │ • Handles nested data │    │ • Flat structure      │        │
│  │ • Schema flexibility  │    │ • Schema enforcement  │        │
│  │ • Built-in transforms │    │ • Standard Spark ops  │        │
│  └───────────────────────┘    └───────────────────────┘        │
│                                                                 │
│  # Convert giữa hai loại:                                       │
│  df = dynamic_frame.toDF()           # DynamicFrame → DataFrame │
│  dyf = DynamicFrame.fromDF(df, glue_context)  # DataFrame → DyF │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Ưu điểm DynamicFrame:**
- Xử lý semi-structured data dễ dàng
- Schema flexibility cho dirty data
- Built-in transforms: `ApplyMapping`, `DropFields`, `ResolveChoice`

---

### 7. Triggers

**Trigger** kích hoạt ETL jobs:

| Trigger Type | Mô tả | Use Case |
|-------------|-------|----------|
| **Scheduled** | Chạy theo cron expression | Daily/weekly ETL |
| **On-demand** | Chạy manual | Testing, ad-hoc |
| **Event-based** | Kích hoạt bởi event | S3 upload → ETL |
| **Conditional** | Chạy khi job khác hoàn thành | Job chaining |

```
┌─────────────────────────────────────────────────────────────────┐
│                        Trigger Examples                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Scheduled Trigger:                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  cron(0 8 * * ? *)  ──────►  Run ETL Job                │   │
│  │  (Every day at 8 AM UTC)                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Event-based Trigger:                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  S3 Object Created  ───►  EventBridge  ───►  Glue Job   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Job Chaining:                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Job A (Extract) ───► Job B (Transform) ───► Job C (Load)│   │
│  │       SUCCEEDED            SUCCEEDED                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 8. Workflows

**Workflow** orchestrate multiple crawlers, jobs, và triggers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Glue Workflow Example                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐                                                    │
│  │ START   │                                                    │
│  │ Trigger │ (Scheduled: Daily 1 AM)                            │
│  └────┬────┘                                                    │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────┐                                               │
│  │  Crawler 1   │ (Crawl S3 raw data)                          │
│  └──────┬───────┘                                               │
│         │ On Success                                            │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  ETL Job 1   │ (Clean & Transform)                          │
│  └──────┬───────┘                                               │
│         │ On Success                                            │
│    ┌────┴────┐                                                  │
│    ▼         ▼                                                  │
│ ┌────────┐ ┌────────┐                                           │
│ │Job 2A  │ │Job 2B  │ (Parallel processing)                    │
│ │(Agg)   │ │(Export)│                                           │
│ └───┬────┘ └───┬────┘                                           │
│     │          │                                                │
│     └────┬─────┘                                                │
│          ▼                                                      │
│     ┌────────┐                                                  │
│     │ Job 3  │ (Final load to Redshift)                        │
│     └────────┘                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Glue Studio

**Glue Studio** là giao diện visual để tạo ETL jobs:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Glue Studio Interface                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Visual Job Editor                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│    ┌─────────┐                                                  │
│    │  S3     │ ← Data Source node                              │
│    │ Source  │                                                  │
│    └────┬────┘                                                  │
│         │                                                       │
│         ▼                                                       │
│    ┌─────────┐                                                  │
│    │ Apply   │ ← Transform node                                │
│    │ Mapping │   (drag & drop columns)                         │
│    └────┬────┘                                                  │
│         │                                                       │
│         ▼                                                       │
│    ┌─────────┐                                                  │
│    │ Filter  │ ← Transform node                                │
│    │ Rows    │   (remove null values)                          │
│    └────┬────┘                                                  │
│         │                                                       │
│         ▼                                                       │
│    ┌─────────┐                                                  │
│    │  S3     │ ← Data Target node                              │
│    │ Target  │                                                  │
│    └─────────┘                                                  │
│                                                                 │
│  [Run] [Save] [View Script]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Tính năng Glue Studio:**
- **Visual ETL** - Drag & drop để tạo pipeline
- **Auto-generated scripts** - Tự động sinh PySpark code
- **Schema preview** - Xem schema ở mỗi step
- **Data preview** - Sample data ở mỗi transform
- **Job monitoring** - Track job runs trong cùng interface

---

## AWS Glue Features

### Data Discovery & Organization

| Feature | Mô tả |
|---------|-------|
| **Data Catalog** | Centralized metadata repository |
| **Crawlers** | Tự động discover và catalog data |
| **70+ connectors** | Kết nối nhiều data sources |
| **Schema Registry** | Quản lý và versioning schemas |

### Data Transformation

| Feature | Mô tả |
|---------|-------|
| **Visual ETL** | Glue Studio visual editor |
| **Spark ETL** | Distributed processing |
| **Streaming ETL** | Real-time data processing |
| **FindMatches ML** | Deduplicate và fuzzy matching |
| **Sensitive Data Detection** | Tự động detect PII |

### Data Pipeline

| Feature | Mô tả |
|---------|-------|
| **Auto-scaling** | Scale workers theo workload |
| **Event triggers** | Event-driven ETL |
| **Workflows** | Orchestrate complex pipelines |
| **Job Bookmarks** | Track processed data (incremental) |

---

## Job Bookmarks (Incremental Processing)

**Job Bookmark** giúp xử lý incremental data:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Job Bookmark Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Day 1: First Run                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  S3: file1.csv, file2.csv, file3.csv                     │   │
│  │       ↓           ↓           ↓                          │   │
│  │  [Process All] ────────────────────────► Output          │   │
│  │                                                          │   │
│  │  Bookmark saved: file3.csv (last processed)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Day 2: Second Run (new files added)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  S3: file1.csv, file2.csv, file3.csv, file4.csv, file5.csv │
│  │       (skip)      (skip)     (skip)      ↓          ↓    │   │
│  │                                                          │   │
│  │  [Process Only New] ───► file4 + file5 ───► Output       │   │
│  │                                                          │   │
│  │  Bookmark updated: file5.csv                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Enable Job Bookmark:**
```python
# Trong Glue job settings
glueContext = GlueContext(SparkContext.getOrCreate())
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# ... processing code ...

job.commit()  # ← Lưu bookmark state
```

---

## Streaming ETL

**AWS Glue Streaming** xử lý real-time data:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Streaming ETL Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Kinesis   │     │  Amazon     │     │   Apache    │       │
│  │   Data      │     │  MSK        │     │   Kafka     │       │
│  │   Streams   │     │             │     │             │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                          │
│                    │   Glue Spark    │                          │
│                    │   Streaming     │                          │
│                    │   (continuous)  │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│               ┌─────────────┼─────────────┐                     │
│               ▼             ▼             ▼                     │
│        ┌───────────┐ ┌───────────┐ ┌───────────┐               │
│        │    S3     │ │ Redshift  │ │ Elastic   │               │
│        │ Data Lake │ │           │ │ search    │               │
│        └───────────┘ └───────────┘ └───────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Use cases:**
- Real-time log analytics
- IoT data ingestion
- Fraud detection
- Live dashboards

---

## Worker Types & Pricing

### Worker Types

| Worker Type | vCPU | Memory | Disk | Use Case |
|------------|------|--------|------|----------|
| **Standard** | 4 | 16 GB | 50 GB | General ETL |
| **G.1X** | 4 | 16 GB | 64 GB | Memory-efficient |
| **G.2X** | 8 | 32 GB | 128 GB | ML, complex transforms |
| **G.4X** | 16 | 64 GB | 256 GB | Large datasets |
| **G.8X** | 32 | 128 GB | 512 GB | Very large datasets |

### Memory-Optimized (cho ML workloads)

| Worker Type | vCPU | Memory | Disk |
|------------|------|--------|------|
| **R.1X** | 4 | 32 GB | 64 GB |
| **R.2X** | 8 | 64 GB | 128 GB |
| **R.4X** | 16 | 128 GB | 256 GB |
| **R.8X** | 32 | 256 GB | 512 GB |

### Pricing Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        Glue Pricing                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETL Jobs (Spark):                                              │
│  • Charged per DPU-hour (Data Processing Unit)                  │
│  • 1 DPU = 4 vCPU + 16 GB RAM                                   │
│  • Billed per second (minimum 1 minute)                         │
│                                                                 │
│  Data Catalog:                                                  │
│  • First 1 million objects stored: FREE                         │
│  • First 1 million requests/month: FREE                         │
│  • $1 per 100,000 objects stored beyond free tier               │
│                                                                 │
│  Crawlers:                                                      │
│  • Charged per DPU-hour                                         │
│  • Same rate as ETL jobs                                        │
│                                                                 │
│  Development Endpoints (deprecated - use Interactive Sessions): │
│  • Charged per DPU-hour while active                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## So sánh với các dịch vụ khác

### AWS Glue vs Other ETL Services

| Feature | AWS Glue | AWS Data Pipeline | Amazon EMR |
|---------|----------|-------------------|------------|
| **Type** | Serverless ETL | Managed workflow | Managed Hadoop/Spark |
| **Scaling** | Automatic | Manual | Manual/Auto |
| **Management** | Fully managed | AWS managed | Self-managed cluster |
| **Data Catalog** | Built-in | ❌ | Use Glue Catalog |
| **Cost model** | Pay per use | Per activity | Per instance-hour |
| **Best for** | ETL pipelines | Data movement | Big data processing |

### Khi nào dùng AWS Glue?

| Scenario | Recommendation |
|----------|---------------|
| Serverless ETL cần scale tự động | ✅ AWS Glue |
| Simple data movement S3 ↔ RDS | Consider Data Pipeline |
| Complex ML + Spark with custom control | Consider EMR |
| Need central metadata catalog | ✅ AWS Glue Data Catalog |
| Visual ETL development | ✅ AWS Glue Studio |
| Real-time streaming ETL | ✅ AWS Glue Streaming |

---

## Ví dụ thực tế: E-commerce Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│            E-commerce Analytics Pipeline với Glue                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Data Sources:                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    RDS      │  │     S3      │  │   Kinesis   │             │
│  │  (orders)   │  │  (logs)     │  │ (clickstream)│            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                Glue Crawlers (scheduled daily)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Glue Data Catalog                       │   │
│  │   • orders_db.orders                                     │   │
│  │   • logs_db.access_logs                                  │   │
│  │   • clickstream_db.events                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Glue ETL Jobs                          │   │
│  │                                                          │   │
│  │   Job 1: Clean & Standardize                             │   │
│  │   • Remove duplicates (FindMatches)                      │   │
│  │   • Handle null values                                   │   │
│  │   • Normalize data types                                 │   │
│  │                                                          │   │
│  │   Job 2: Transform & Aggregate                           │   │
│  │   • Join orders + clickstream                            │   │
│  │   • Calculate metrics                                    │   │
│  │   • Partition by date                                    │   │
│  │                                                          │   │
│  │   Job 3: Load to Data Warehouse                          │   │
│  │   • Write to Redshift                                    │   │
│  │   • Update materialized views                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ S3 Data Lake│     │  Redshift   │     │   Athena    │       │
│  │  (Parquet)  │     │ (analytics) │     │ (ad-hoc)    │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Code Examples

### PySpark ETL Job

```python
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

# Initialize
args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read from Data Catalog
datasource = glueContext.create_dynamic_frame.from_catalog(
    database="sales_db",
    table_name="raw_orders"
)

# Transform: Apply mappings
mapped = ApplyMapping.apply(
    frame=datasource,
    mappings=[
        ("order_id", "string", "order_id", "string"),
        ("customer_id", "string", "customer_id", "string"),
        ("amount", "double", "order_amount", "double"),
        ("order_date", "string", "order_date", "date")
    ]
)

# Transform: Filter
filtered = Filter.apply(
    frame=mapped,
    f=lambda x: x["order_amount"] > 0
)

# Write to S3 in Parquet format
glueContext.write_dynamic_frame.from_options(
    frame=filtered,
    connection_type="s3",
    connection_options={
        "path": "s3://my-bucket/processed/orders/",
        "partitionKeys": ["order_date"]
    },
    format="parquet"
)

job.commit()
```

### Crawler CLI

```bash
# Create a crawler
aws glue create-crawler \
    --name my-s3-crawler \
    --role AWSGlueServiceRole \
    --database-name my_database \
    --targets '{"S3Targets": [{"Path": "s3://my-bucket/raw-data/"}]}'

# Run the crawler
aws glue start-crawler --name my-s3-crawler

# Check crawler status
aws glue get-crawler --name my-s3-crawler \
    --query 'Crawler.State'
```

---

## Best Practices

### Performance

| Practice | Mô tả |
|----------|-------|
| **Partition data** | Partition theo date/time để tăng performance |
| **Use Parquet/ORC** | Columnar formats cho analytics workloads |
| **Enable Job Bookmarks** | Incremental processing, tránh xử lý lại |
| **Right-size workers** | Chọn worker type phù hợp với workload |
| **Use pushdown predicates** | Filter tại source để giảm data transfer |

### Cost Optimization

| Practice | Mô tả |
|----------|-------|
| **Auto-scaling** | Enable auto-scaling để tối ưu resources |
| **Timeout settings** | Set job timeout để tránh runaway jobs |
| **Development Endpoints** | Dùng Interactive Sessions thay vì Dev Endpoints |
| **Monitor DPU usage** | Theo dõi và optimize DPU consumption |

### Security

| Practice | Mô tả |
|----------|-------|
| **IAM Roles** | Least privilege cho Glue service role |
| **Encryption** | Enable encryption at rest và in transit |
| **VPC** | Chạy jobs trong VPC cho data sources private |
| **Data Catalog security** | Dùng Lake Formation cho fine-grained access |

---

## Tích hợp với các dịch vụ AWS

```
┌─────────────────────────────────────────────────────────────────┐
│                  AWS Glue Integration Ecosystem                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Data Sources:                   Analytics:                     │
│  • Amazon S3                     • Amazon Athena                │
│  • Amazon RDS                    • Amazon Redshift Spectrum     │
│  • Amazon DynamoDB               • Amazon EMR                   │
│  • Amazon Redshift               • Amazon QuickSight            │
│  • JDBC databases                                               │
│                                                                 │
│  Streaming:                      Security:                      │
│  • Amazon Kinesis                • AWS IAM                      │
│  • Amazon MSK (Kafka)            • AWS Lake Formation           │
│  • Apache Kafka                  • AWS KMS                      │
│                                  • AWS Secrets Manager          │
│                                                                 │
│  Orchestration:                  Monitoring:                    │
│  • AWS Step Functions            • Amazon CloudWatch            │
│  • Amazon EventBridge            • AWS CloudTrail               │
│  • Apache Airflow (MWAA)         • Glue Job Metrics             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tổng kết

| Component | Mục đích |
|-----------|----------|
| **Data Catalog** | Central metadata store |
| **Crawlers** | Auto-discover schemas |
| **ETL Jobs** | Transform data (Spark/Python/Ray) |
| **Glue Studio** | Visual ETL development |
| **Triggers** | Schedule/event-based execution |
| **Workflows** | Orchestrate complex pipelines |
| **Job Bookmarks** | Incremental processing |
| **Streaming** | Real-time ETL |

> [!IMPORTANT]
> AWS Glue là lựa chọn tốt khi:
> - Cần serverless ETL không quản lý infrastructure
> - Muốn central metadata catalog cho data lake
> - Cần tích hợp với Athena, Redshift, EMR
> - Muốn visual ETL development với Glue Studio
