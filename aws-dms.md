# AWS Database Migration Service (DMS)

## Mục lục

- [Tổng quan](#tổng-quan)
- [6Rs Migration Strategies](#6rs-migration-strategies)
- [Cách hoạt động](#cách-hoạt-động)
- [AWS DMS Serverless](#aws-dms-serverless)
- [Migration Types](#migration-types)
- [Supported Databases](#supported-databases)
- [AWS Schema Conversion Tool (SCT)](#aws-schema-conversion-tool-sct)
- [DMS vs SCT](#dms-vs-sct)
- [Use Cases](#use-cases)
- [Pricing](#pricing)
- [Exam Tips](#exam-tips)

---

## Tổng quan

**AWS DMS (Database Migration Service)** = Service giúp **migrate databases** từ on-premises, EC2, hoặc RDS sang AWS một cách dễ dàng.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS DMS                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 MỤC ĐÍCH: Migrate databases với minimal downtime            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  Source DB                     Target DB                │    │
│  │  ┌──────────┐                  ┌──────────┐             │    │
│  │  │ Oracle   │                  │ Aurora   │             │    │
│  │  │ MySQL    │  ─────DMS─────►  │ RDS      │             │    │
│  │  │ SQL Srv  │                  │ DynamoDB │             │    │
│  │  │PostgreSQL│                  │ Redshift │             │    │
│  │  └──────────┘                  └──────────┘             │    │
│  │  On-prem/EC2/RDS                AWS                     │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ✅ Source DB KHÔNG bị downtime trong khi migration             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Mô tả |
|---------|-------|
| **Minimal downtime** | Source DB vẫn hoạt động bình thường khi migrate |
| **Continuous replication** | Sync data liên tục (CDC - Change Data Capture) |
| **Homogeneous** | Cùng database engine (MySQL → MySQL) |
| **Heterogeneous** | Khác database engine (Oracle → Aurora) |
| **Schema conversion** | Tích hợp với SCT để convert schema |

---

## 6Rs Migration Strategies

> [!IMPORTANT]
> 6Rs là các strategies để migrate workloads lên Cloud. Đây là kiến thức **quan trọng cho exam**!

```
┌─────────────────────────────────────────────────────────────────┐
│                    6Rs MIGRATION STRATEGIES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  1. REHOST          "Lift and Shift"                     │   │
│  │     └─ Chuyển nguyên xi, không thay đổi gì               │   │
│  │     └─ VD: MySQL → MySQL trên EC2                        │   │
│  │                                                          │   │
│  │  2. REPLATFORM      "Lift and Reshape"                   │   │
│  │     └─ Thay đổi một chút để tận dụng cloud               │   │
│  │     └─ VD: MySQL → RDS MySQL (managed)                   │   │
│  │                                                          │   │
│  │  3. REPURCHASE      "Drop and Shop"                      │   │
│  │     └─ Mua solution mới (SaaS)                           │   │
│  │     └─ VD: CRM cũ → Salesforce                           │   │
│  │                                                          │   │
│  │  4. REFACTOR        "Re-architect"                       │   │
│  │     └─ Viết lại code để cloud-native                     │   │
│  │     └─ VD: Monolith → Microservices + Aurora Serverless  │   │
│  │                                                          │   │
│  │  5. RETIRE          "Tắt đi"                             │   │
│  │     └─ Không dùng nữa, decommission                      │   │
│  │     └─ VD: App cũ không còn users                        │   │
│  │                                                          │   │
│  │  6. RETAIN          "Giữ lại"                            │   │
│  │     └─ Giữ on-prem, không migrate                        │   │
│  │     └─ VD: Legacy system quá phức tạp để migrate         │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Chi tiết từng Strategy

| Strategy | Ý nghĩa | Effort | Khi nào dùng? |
|----------|---------|--------|---------------|
| **Rehost** | Lift & Shift - chuyển nguyên xi | Thấp | Migrate nhanh, không muốn thay đổi |
| **Replatform** | Thay đổi nhỏ để dùng managed services | Thấp-TB | **Muốn giảm operational burden** |
| **Repurchase** | Mua SaaS thay thế | TB | Có SaaS phù hợp, muốn outsource |
| **Refactor** | Viết lại cloud-native | **Cao** | Cần tối ưu performance, scalability |
| **Retire** | Tắt bỏ | Thấp | App không còn giá trị |
| **Retain** | Giữ on-prem | Không có | Chưa sẵn sàng, quá phức tạp |

### Rehost vs Replatform (Hay hỏi trong exam!)

```
┌─────────────────────────────────────────────────────────────────┐
│                REHOST vs REPLATFORM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  REHOST (Lift & Shift):                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MySQL on-prem → MySQL trên EC2                         │    │
│  │                                                         │    │
│  │  • Y hệt như cũ, chỉ đổi chỗ                            │    │
│  │  • BẠN vẫn phải quản lý OS, patching, backup            │    │
│  │  • Operational burden: KHÔNG GIẢM                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  REPLATFORM (Lift & Reshape):                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MySQL on-prem → RDS MySQL (managed)                    │    │
│  │                                                         │    │
│  │  • Vẫn là MySQL, nhưng giờ là MANAGED SERVICE           │    │
│  │  • AWS lo OS, patching, backup, scaling                 │    │
│  │  • Operational burden: GIẢM ĐÁNG KỂ ✓                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  → Câu hỏi "reduce operational burden" = REPLATFORM             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6Rs - Quick Reference

| Keyword trong câu hỏi | Strategy |
|-----------------------|----------|
| "Move as-is", "no changes" | **Rehost** |
| "Reduce operational burden", "managed service" | **Replatform** |
| "Buy new software", "SaaS" | **Repurchase** |
| "Rewrite", "cloud-native", "microservices" | **Refactor** |
| "No longer needed", "decommission" | **Retire** |
| "Keep on-premises", "not ready" | **Retain** |

## Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│                    DMS ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐      ┌──────────────────┐      ┌──────────┐       │
│  │  Source  │      │  DMS Replication │      │  Target  │       │
│  │ Database │─────►│     Instance     │─────►│ Database │       │
│  │          │      │                  │      │          │       │
│  └──────────┘      │  ┌────────────┐  │      └──────────┘       │
│                    │  │ Replication│  │                         │
│                    │  │    Task    │  │                         │
│                    │  └────────────┘  │                         │
│                    └──────────────────┘                         │
│                                                                 │
│  Components:                                                    │
│  • Source Endpoint: Connection info của source DB               │
│  • Target Endpoint: Connection info của target DB               │
│  • Replication Instance: EC2 chạy DMS software                  │
│  • Replication Task: Định nghĩa migrate cái gì, như thế nào     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow

1. **Create Replication Instance** - EC2 chạy DMS engine
2. **Create Source/Target Endpoints** - Connection settings
3. **Create Replication Task** - Define migration settings
4. **Start Migration** - Full load + CDC (ongoing replication)
5. **Cutover** - Switch app sang target DB (minimal downtime)

---

## AWS DMS Serverless

**AWS DMS Serverless** = mode DMS không cần tự chọn/sizing **replication instance**. AWS DMS tự tính toán, provision và scale replication resources dựa trên workload thực tế.

Dùng khi câu hỏi nhấn mạnh:

- **Full load + CDC** nhưng workload/throughput dao động
- Không muốn quản lý replication instance
- Muốn compute tự động scale theo migration/replication workload
- Cần migrate/replicate database với operational burden thấp hơn DMS Standard

> 📖 **Nguồn:** [Working with AWS DMS Serverless](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Serverless.html)

### DMS Standard vs DMS Serverless

| Tiêu chí | DMS Standard | DMS Serverless |
|----------|--------------|----------------|
| Compute | Chọn **replication instance** | Chọn **Min/Max DCU** |
| Sizing | Bạn tự estimate instance size | DMS tự compute/provision capacity |
| Scaling | Phải monitor và resize | Autoscaling trong giới hạn cấu hình |
| Ops burden | Cao hơn | Thấp hơn |
| Phù hợp | Workload ổn định, predictable | Workload dao động, muốn managed scaling |
| Billing | Theo replication instance | Pay-for-use theo DCU đang dùng |

### DMS Capacity Unit (DCU)

Với DMS Serverless, bạn cấu hình **Compute Config** bằng:

| Setting | Ý nghĩa |
|---------|---------|
| **MinCapacityUnits** | Số DCU tối thiểu DMS provision; cũng là mức scale-down thấp nhất |
| **MaxCapacityUnits** | Số DCU tối đa DMS có thể provision; cũng là mức scale-up cao nhất |
| **MultiAZ** | Tạo standby replica ở AZ khác để failover; AWS khuyến nghị bật nếu dùng CDC/ongoing replication |

> AWS định nghĩa **1 DCU = 2 GB RAM**. DMS tính phí theo số DCU replication đang dùng.

> 📖 **Nguồn:** [AWS DMS Serverless components - Compute Config](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Serverless.Components.html#CHAP_Serverless.computeconfig)

### Replication phases trong DMS Serverless

DMS Serverless vẫn hỗ trợ các kiểu replication quan trọng của DMS:

| Phase / Type | Ý nghĩa | Khi nào dùng? |
|--------------|---------|---------------|
| **Full load** | Copy dữ liệu hiện có tại thời điểm bắt đầu replication | Initial migration |
| **CDC initial** | Copy các thay đổi xảy ra trong lúc full load đang chạy | Bắt kịp source DB sau full load |
| **CDC ongoing** | Tiếp tục replicate thay đổi khi chúng xảy ra | Near-zero downtime / continuous replication |
| **Full load and CDC** | Migrate dữ liệu hiện có + thay đổi phát sinh trong quá trình replication | Pattern hay gặp nhất khi migrate DB đang chạy |

```
On-prem Oracle                        Amazon RDS for Oracle
┌──────────────┐                      ┌──────────────┐
│ Existing data│ ─── Full load ─────► │ Existing data│
│ Transactions │ ─── CDC ongoing ───► │ New changes  │
└──────────────┘                      └──────────────┘
        │                                      ▲
        └──── DMS Serverless tự scale DCU ────┘
```

### Autoscaling hoạt động thế nào?

Sau khi replication ở trạng thái **RUNNING**, AWS DMS quản lý capacity của underlying resources để thích ứng với workload thay đổi.

- Workload tăng vượt threshold → DMS có thể **scale up** replication resources
- Workload giảm đủ lâu → DMS có thể **scale down** để tiết kiệm chi phí
- Scaling bị giới hạn bởi **MinCapacityUnits** và **MaxCapacityUnits**
- Serverless replication **không autoscale down trong khi full load đang chạy**

> 📖 **Nguồn:** [Understanding autoscaling in AWS DMS Serverless](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Serverless.Components.html#CHAP_Serverless.autoscaling)

### Supported endpoints

DMS Serverless hỗ trợ nhiều source/target, bao gồm **Oracle** ở cả hai phía:

| Vai trò | Ví dụ supported endpoints |
|---------|----------------------------|
| **Sources** | Oracle, SQL Server, PostgreSQL-compatible, MySQL-compatible, MariaDB, MongoDB, Amazon S3, IBM Db2 |
| **Targets** | Oracle, SQL Server, PostgreSQL, MySQL-compatible, Amazon S3, Redshift, DynamoDB, Kinesis Data Streams, MSK, OpenSearch, Neptune |

Ví dụ exam:

```text
On-premises Oracle → Amazon RDS for Oracle
Existing data + continuous transactional changes
Data volume fluctuates
Wants automatic compute provisioning

=> AWS DMS Serverless replication
=> Replication type: Full load and CDC
```

### Khi nào chọn DMS Serverless?

| Keyword trong đề | Đáp án nên nghĩ tới |
|------------------|---------------------|
| "automatically provision compute resources" | **DMS Serverless** |
| "workload fluctuates" / "spikes in transaction volume" | **DMS Serverless autoscaling** |
| "existing records and ongoing changes" | **Full load + CDC** |
| "Oracle on-premises to RDS for Oracle" | **DMS homogeneous migration/replication** |
| "reduce replication instance management" | **DMS Serverless** |

### Lưu ý dễ sai

- **DMS Serverless không phải Lambda**: Lambda không phải managed CDC engine cho database transaction logs.
- **DMS Serverless không phải Glue**: Glue phù hợp ETL/batch/data integration, không phải lựa chọn chính cho transactional CDC migration.
- **DMS Serverless không phải EC2 Auto Scaling**: bạn không tự deploy DMS replication instance trên EC2 rồi scale bằng script; DMS quản lý replication resources.
- Nếu target là **cùng engine** như Oracle → RDS Oracle: thường **không cần SCT**, vì đây là homogeneous migration.

---

## Migration Types

### 1. Homogeneous Migration (Cùng engine)

**Source và Target cùng database engine** → Không cần convert schema.

```
┌─────────────────────────────────────────────────────────────────┐
│                HOMOGENEOUS MIGRATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MySQL (on-prem)  ───DMS───►  RDS MySQL                         │
│  PostgreSQL       ───DMS───►  Aurora PostgreSQL                 │
│  Oracle           ───DMS───►  RDS Oracle                        │
│                                                                 │
│  → KHÔNG cần AWS SCT                                            │
│  → Schema và data types giống nhau                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Heterogeneous Migration (Khác engine)

**Source và Target khác database engine** → CẦN convert schema trước.

```
┌─────────────────────────────────────────────────────────────────┐
│               HETEROGENEOUS MIGRATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Convert Schema (dùng AWS SCT)                          │
│  ┌──────────┐     ┌─────────┐     ┌──────────┐                  │
│  │ Oracle   │────►│   SCT   │────►│ Aurora   │                  │
│  │ Schema   │     │         │     │ Schema   │                  │
│  └──────────┘     └─────────┘     └──────────┘                  │
│                                                                 │
│  Step 2: Migrate Data (dùng AWS DMS)                            │
│  ┌──────────┐     ┌─────────┐     ┌──────────┐                  │
│  │ Oracle   │────►│   DMS   │────►│ Aurora   │                  │
│  │ Data     │     │         │     │ Data     │                  │
│  └──────────┘     └─────────┘     └──────────┘                  │
│                                                                 │
│  Examples:                                                      │
│  • Oracle → Aurora PostgreSQL                                   │
│  • SQL Server → Aurora MySQL                                    │
│  • Oracle → DynamoDB                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Supported Databases

### Sources (Nguồn)

| Category | Databases |
|----------|-----------|
| **On-premises** | Oracle, SQL Server, MySQL, PostgreSQL, MariaDB, SAP, MongoDB |
| **AWS** | RDS (all engines), Aurora, S3, DocumentDB |
| **Cloud** | Azure SQL, Azure MySQL, Azure PostgreSQL |

### Targets (Đích)

| Category | Databases |
|----------|-----------|
| **Relational** | RDS, Aurora, Redshift, Oracle, SQL Server, MySQL, PostgreSQL |
| **NoSQL** | DynamoDB, DocumentDB, Neptune |
| **Data Lake** | S3 (Parquet, CSV, JSON) |
| **Streaming** | Kinesis Data Streams |
| **Search** | OpenSearch Service |

---

## AWS Schema Conversion Tool (SCT)

**AWS SCT** = Tool convert **database schema** từ một engine sang engine khác.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS SCT                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 Converts:                                                   │
│     • Tables, Views, Indexes                                    │
│     • Stored Procedures, Functions                              │
│     • Triggers, Sequences                                       │
│     • Data types                                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  Oracle PL/SQL        SCT         Aurora PostgreSQL     │    │
│  │  ┌──────────────┐    ─────►     ┌──────────────┐        │    │
│  │  │ CREATE TABLE │               │ CREATE TABLE │        │    │
│  │  │ VARCHAR2     │    Convert    │ VARCHAR      │        │    │
│  │  │ NUMBER       │    ─────►     │ NUMERIC      │        │    │
│  │  │ PROCEDURE    │               │ FUNCTION     │        │    │
│  │  └──────────────┘               └──────────────┘        │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  📊 Assessment Report:                                          │
│     • % code có thể auto-convert                                │
│     • % code cần manual fix                                     │
│     • Estimated effort                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SCT Features

| Feature | Mô tả |
|---------|-------|
| **Assessment Report** | Phân tích độ phức tạp của migration |
| **Auto-convert** | Tự động convert ~80-90% schema |
| **Manual fixes** | Highlight code cần sửa manual |
| **Data extraction agents** | Extract data từ data warehouses |

---

## DMS vs SCT

| | AWS DMS | AWS SCT |
|---|---------|---------|
| **Purpose** | **Migrate DATA** | **Convert SCHEMA** |
| **When to use** | Mọi database migration | Chỉ khi heterogeneous migration |
| **Output** | Data trong target DB | SQL scripts cho schema |
| **Runs on** | AWS Cloud (Replication Instance hoặc Serverless Replication) | Local machine (Desktop app) |
| **Cost** | Pay for replication instance hoặc DMS Serverless DCU | **FREE** |

### Khi nào dùng cái nào?

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION TREE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Source và Target cùng DB engine?                               │
│                │                                                │
│        ┌───────┴───────┐                                        │
│        │               │                                        │
│       YES             NO                                        │
│        │               │                                        │
│        ▼               ▼                                        │
│   Dùng DMS        Dùng SCT + DMS                                │
│   (không cần       (SCT convert schema,                         │
│    SCT)             DMS migrate data)                           │
│                                                                 │
│  Examples:                                                      │
│  MySQL → RDS MySQL        = DMS only                            │
│  Oracle → Aurora MySQL    = SCT + DMS                           │
│  SQL Server → PostgreSQL  = SCT + DMS                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### 1. On-Premises to AWS

```
Data Center                      AWS
┌──────────┐                     ┌──────────┐
│ Oracle   │ ───DMS + SCT───►    │ Aurora   │
│ Database │                     │PostgreSQL│
└──────────┘                     └──────────┘
```

### 2. Cloud to Cloud

```
Azure                            AWS
┌──────────┐                     ┌──────────┐
│ Azure    │ ───────DMS───────►  │ RDS      │
│ MySQL    │                     │ MySQL    │
└──────────┘                     └──────────┘
```

### 3. Consolidation

```
Multiple DBs AWS
┌──────────┐
│ MySQL    │ ─────┐
└──────────┘      │
                  │               ┌──────────┐
┌──────────┐      ├───DMS───────► │ Aurora   │
│PostgreSQL│──────┤               │ MySQL    │
└──────────┘      │               └──────────┘
                  │
┌──────────┐      │
│ Oracle   │ ─────┘
└──────────┘
```

### 4. Continuous Replication (CDC)

```
On-Premises (still running)      AWS (for analytics)
┌──────────┐                     ┌──────────┐
│ MySQL    │ ───CDC ongoing────► │ Redshift │
│ (OLTP)   │                     │ (OLAP)   │
└──────────┘                     └──────────┘
         ↓
   App vẫn chạy                  Analytics queries
```

---

## Pricing

| Component | Pricing |
|-----------|---------|
| **Replication Instance** | Per hour (like EC2) |
| **DMS Serverless DCU** | Pay-for-use theo DMS Capacity Units đang dùng |
| **Storage** | Per GB-month |
| **Data Transfer** | Standard AWS data transfer rates |
| **SCT** | **FREE** |

### Instance sizing

| Size | vCPU | Memory | Use case |
|------|------|--------|----------|
| **dms.t3.micro** | 2 | 1 GB | Testing |
| **dms.t3.medium** | 2 | 4 GB | Small workloads |
| **dms.r5.large** | 2 | 16 GB | Production |
| **dms.r5.xlarge** | 4 | 32 GB | Large production |

---

## Exam Tips

> [!IMPORTANT]
> DMS = **Migrate DATABASE** với **minimal downtime**. SCT = **Convert SCHEMA** khi khác engine.

### Keyword → Answer

| Keyword trong câu hỏi | Đáp án |
|-----------------------|--------|
| "Migrate database to AWS" | **AWS DMS** |
| "Minimal downtime migration" | **AWS DMS** |
| "Continuous replication" | **AWS DMS** (CDC) |
| "Convert Oracle to Aurora" | **AWS SCT** (schema) + **DMS** (data) |
| "Same engine migration" | **DMS only** |
| "Different engine migration" | **SCT + DMS** |
| "Automatically provision compute resources" | **DMS Serverless** |
| "Data transfer volume fluctuates" | **DMS Serverless** |

### Key Points

- **DMS** = Migrate DATA
- **SCT** = Convert SCHEMA (FREE, runs locally)
- **Homogeneous** (same engine) = DMS only
- **Heterogeneous** (different engine) = SCT + DMS
- **Source DB không downtime** khi migration
- **CDC** = Change Data Capture (continuous sync)
- **DMS Serverless** = DMS tự provision/scale replication resources, không cần tự chọn replication instance
- **Full load + CDC + workload dao động** = DMS Serverless

### Common Scenarios

| Scenario | Solution |
|----------|----------|
| "Migrate MySQL to RDS MySQL" | DMS only |
| "Migrate Oracle to Aurora PostgreSQL" | SCT + DMS |
| "Keep data synced during migration" | DMS with CDC |
| "Existing data + ongoing changes + fluctuating volume" | DMS Serverless Full load + CDC |
| "Migrate to data lake (S3)" | DMS to S3 |
| "Migrate data warehouse to Redshift" | SCT (data extraction) + DMS |

---

## Tài liệu tham khảo

- [AWS DMS Documentation](https://docs.aws.amazon.com/dms/)
- [AWS SCT Documentation](https://docs.aws.amazon.com/SchemaConversionTool/)
- [DMS Best Practices](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_BestPractices.html)
- [Supported Sources and Targets](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.html)
- [Working with AWS DMS Serverless](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Serverless.html)
- [AWS DMS Serverless Components](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Serverless.Components.html)
