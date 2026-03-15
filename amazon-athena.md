# Amazon Athena

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Kiến trúc](#kiến-trúc)
- [Cách hoạt động](#cách-hoạt-động)
- [Data Formats](#data-formats)
- [Partitioning](#partitioning)
- [Tích hợp với các dịch vụ AWS](#tích-hợp-với-các-dịch-vụ-aws)
- [Federated Query](#federated-query)
- [Workgroups](#workgroups)
- [Pricing](#pricing)
- [Performance Optimization](#performance-optimization)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Giới thiệu

**Amazon Athena** là dịch vụ **serverless interactive query** cho phép phân tích dữ liệu trực tiếp trong **Amazon S3** bằng **SQL chuẩn**.

### Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Serverless** | Không cần quản lý infrastructure |
| **Pay-per-query** | Chỉ trả tiền cho data scanned |
| **Standard SQL** | Dùng Presto/Trino engine |
| **No ETL required** | Query trực tiếp trên S3 |
| **Fast** | Kết quả trong vài giây |

### Vấn đề cần giải quyết

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    KHÔNG có Athena                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   S3 Bucket (1TB logs)                                                       │
│   ┌─────────────────┐                                                        │
│   │ access.log      │     ❌ Phải download về local                          │
│   │ error.log       │     ❌ Setup database server                           │
│   │ app.log         │     ❌ Load data vào database                          │
│   │ ...             │     ❌ Mất thời gian, tốn tiền                         │
│   └─────────────────┘                                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    CÓ Athena                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   S3 Bucket (1TB logs)                Athena                                 │
│   ┌─────────────────┐                ┌─────────────────────────────────────┐ │
│   │ access.log      │◄──── SQL ───── │ SELECT * FROM logs                  │ │
│   │ error.log       │                │ WHERE status = 500                  │ │
│   │ app.log         │                │ AND date > '2024-01-01'             │ │
│   │ ...             │                └─────────────────────────────────────┘ │
│   └─────────────────┘                                                        │
│                                                                              │
│   ✅ Query trực tiếp S3 - không cần copy data                                │
│   ✅ Serverless - không quản lý server                                       │
│   ✅ Pay-per-query - chỉ trả $5/TB scanned                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Kiến trúc

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Amazon Athena Architecture                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                                                            │
│   │    User     │                                                            │
│   └──────┬──────┘                                                            │
│          │ SQL Query                                                         │
│          ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                         Amazon Athena                               │    │
│   │                                                                     │    │
│   │   ┌─────────────────┐     ┌─────────────────┐                        │   │
│   │   │  Query Engine   │     │   AWS Glue      │                        │   │
│   │   │  (Presto/Trino) │◄────│   Data Catalog  │                        │   │
│   │   └────────┬────────┘     │   (Metadata)    │                        │   │
│   │            │              └─────────────────┘                        │   │
│   └────────────┼────────────────────────────────────────────────────────┘    │
│                │                                                             │
│                │ Scan Data                                                   │
│                ▼                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                         Amazon S3                                   │    │
│   │                                                                     │    │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│   │   │   Bucket A  │  │   Bucket B  │  │   Bucket C  │                  │   │
│   │   │  (CSV/JSON) │  │  (Parquet)  │  │   (ORC)     │                  │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   Query Results → S3 Bucket (staging location)                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Mô tả |
|-----------|-------|
| **Athena Engine** | Presto/Trino-based SQL engine |
| **AWS Glue Data Catalog** | Metadata store (databases, tables, schemas) |
| **S3** | Data source (nơi chứa data thực tế) |
| **Query Results Location** | S3 bucket lưu kết quả query |

---

## Cách hoạt động

### Step-by-step

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         How Athena Works                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STEP 1: Tạo Database và Table (pointing to S3)                             │
│   ──────────────────────────────────────────────                             │
│                                                                              │
│   CREATE EXTERNAL TABLE logs (                                               │
│       timestamp STRING,                                                      │
│       ip STRING,                                                             │
│       request STRING,                                                        │
│       status INT                                                             │
│   )                                                                          │
│   ROW FORMAT DELIMITED FIELDS TERMINATED BY ','                              │
│   LOCATION 's3://my-bucket/logs/';                                           │
│                                                                              │
│   📍 Table là schema/definition - không copy data                            │
│   📍 Data vẫn ở S3 bucket                                                    │
│                                                                              │
│   STEP 2: Query trực tiếp                                                    │
│   ───────────────────────                                                    │
│                                                                              │
│   SELECT ip, COUNT(*) as requests                                            │
│   FROM logs                                                                  │
│   WHERE status = 500                                                         │
│   GROUP BY ip                                                                │
│   ORDER BY requests DESC                                                     │
│   LIMIT 10;                                                                  │
│                                                                              │
│   STEP 3: Athena scan S3, return results                                     │
│   ──────────────────────────────────────                                     │
│                                                                              │
│   • Athena đọc data từ S3 location                                           │
│   • Apply filters, aggregations                                              │
│   • Return results (also saved to S3)                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### EXTERNAL TABLE concept

```
┌─────────────────────────────────────────────────────────────────┐
│                 EXTERNAL TABLE vs Regular Table                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Regular Table (MySQL, PostgreSQL):                            │
│   ───────────────────────────────────                           │
│   • Data được copy VÀO database                                 │
│   • Database quản lý data                                       │
│   • DROP TABLE → Xóa cả definition VÀ data                      │
│                                                                 │
│   External Table (Athena):                                      │
│   ────────────────────────                                      │
│   • Data VẪN Ở S3 - không copy                                  │
│   • Athena chỉ có schema/definition                             │
│   • DROP TABLE → Chỉ xóa definition, DATA VẪN CÒN trong S3      │
│                                                                 │
│   ┌─────────────┐         ┌─────────────────────────┐           │
│   │   Athena    │         │          S3             │           │
│   │             │ POINTS  │                         │           │
│   │  Table def  │────────►│  Actual data files      │           │
│   │  (schema)   │   TO    │  (CSV, Parquet, JSON)   │           │
│   └─────────────┘         └─────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Formats

Athena hỗ trợ nhiều data formats:

| Format | Compression | Use Case | Performance |
|--------|-------------|----------|-------------|
| **CSV/TSV** | GZIP, BZIP2 | Simple logs | ⭐⭐ |
| **JSON** | GZIP | Semi-structured data | ⭐⭐ |
| **Parquet** | Snappy, GZIP | Analytics | ⭐⭐⭐⭐⭐ |
| **ORC** | Snappy, ZLIB | Analytics | ⭐⭐⭐⭐⭐ |
| **Avro** | Snappy | Schema evolution | ⭐⭐⭐ |

### Columnar vs Row-based

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Row-based vs Columnar Formats                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ROW-BASED (CSV, JSON):                                                     │
│   ──────────────────────                                                     │
│   Row 1: [id=1, name="John", age=30, city="NYC"]                             │
│   Row 2: [id=2, name="Jane", age=25, city="LA"]                              │
│   Row 3: [id=3, name="Bob", age=35, city="SF"]                               │
│                                                                              │
│   Query: SELECT name FROM users                                              │
│   → Phải đọc TẤT CẢ columns rồi mới lọc "name"                               │
│   → Scan nhiều data = TỐN TIỀN 💰                                            │
│                                                                              │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│   COLUMNAR (Parquet, ORC):                                                   │
│   ────────────────────────                                                   │
│   Column id:   [1, 2, 3]                                                     │
│   Column name: ["John", "Jane", "Bob"]                                       │
│   Column age:  [30, 25, 35]                                                  │
│   Column city: ["NYC", "LA", "SF"]                                           │
│                                                                              │
│   Query: SELECT name FROM users                                              │
│   → Chỉ đọc column "name"                                                    │
│   → Skip các columns khác                                                    │
│   → Scan ÍT data = TIẾT KIỆM 💰                                              │
│                                                                              │
│   ⭐ BEST PRACTICE: Convert CSV/JSON → Parquet để tiết kiệm 30-90%           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Partitioning

**Partitioning** chia data thành các phần nhỏ hơn dựa trên column values, giúp **giảm data scanned**.

### Ví dụ Partition by Date

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Partitioning Example                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   S3 Structure (Partitioned by year/month/day):                              │
│   ─────────────────────────────────────────────                              │
│                                                                              │
│   s3://my-bucket/logs/                                                       │
│   ├── year=2024/                                                             │
│   │   ├── month=01/                                                          │
│   │   │   ├── day=01/                                                        │
│   │   │   │   └── data.parquet  (10 GB)                                      │
│   │   │   ├── day=02/                                                        │
│   │   │   │   └── data.parquet  (10 GB)                                      │
│   │   │   └── ...                                                            │
│   │   ├── month=02/                                                          │
│   │   │   └── ...                                                            │
│   │   └── ...                                                                │
│   └── year=2025/                                                             │
│       └── ...                                                                │
│                                                                              │
│   Total: 3.6 TB (1 year of data)                                             │
│                                                                              │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│   Query WITHOUT partition filter:                                            │
│   SELECT * FROM logs WHERE status = 500                                      │
│   → Scan: 3.6 TB → Cost: $18 💰💰💰                                          │
│                                                                              │
│   Query WITH partition filter:                                               │
│   SELECT * FROM logs                                                         │
│   WHERE status = 500                                                         │
│   AND year = '2024' AND month = '01' AND day = '15'                          │
│   → Scan: 10 GB → Cost: $0.05 💰                                             │
│                                                                              │
│   ⭐ Partition pruning: Athena chỉ đọc folder cần thiết!                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Add Partitions

```sql
-- Manual add partition
ALTER TABLE logs ADD PARTITION (year='2024', month='01', day='15')
LOCATION 's3://my-bucket/logs/year=2024/month=01/day=15/';

-- Auto-discover partitions (better!)
MSCK REPAIR TABLE logs;
```

---

## Tích hợp với các dịch vụ AWS

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Athena Integrations                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              Amazon Athena                                   │
│                                    │                                         │
│     ┌──────────────────────────────┼──────────────────────────────┐          │
│     │              │               │               │               │         │
│     ▼              ▼               ▼               ▼              ▼          │
│  ┌──────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐      │
│  │  S3  │    │   Glue   │    │QuickSight│    │ Lambda  │    │   EMR   │      │
│  │      │    │  Catalog │    │   (BI)   │    │(Trigger)│    │ (ETL)   │      │
│  │ Data │    │ Metadata │    │Dashboard │    │         │    │         │      │
│  └──────┘    └──────────┘    └──────────┘    └─────────┘    └─────────┘      │
│                                                                              │
│  S3: Data source                                                             │
│  Glue Data Catalog: Table definitions, schema                                │
│  QuickSight: Visualize Athena query results                                  │
│  Lambda: Trigger queries programmatically                                    │
│  EMR: Process data, output to S3 for Athena                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Common Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics Pipeline                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Raw Data          Transform           Query      Visualize    │
│                                                                 │
│   ┌───────┐      ┌───────────┐      ┌─────────┐   ┌────────────┐│
│   │ Kinesis│─────►│   Glue    │─────►│ Athena  │──►│QuickSight ││
│   │Firehose│      │  (ETL to  │      │ (Query) │   │  (BI)     ││
│   └───────┘      │  Parquet) │      └─────────┘   └────────────┘│
│       │          └───────────┘                                  │
│       ▼               │                                         │
│   ┌───────┐          ▼                                          │
│   │  S3   │      ┌───────┐                                      │
│   │ (raw) │      │  S3    │                                     │
│   └───────┘      │(clean) │                                     │
│   └───────┘                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Federated Query

**Federated Query** cho phép Athena query data từ **nhiều nguồn khác ngoài S3**.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Federated Query                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              Amazon Athena                                   │
│                                    │                                         │
│                         Federated Query Engine                               │
│                                    │                                         │
│     ┌──────────┬──────────┬────────┼────────┬──────────┬──────────┐          │
│     ▼          ▼          ▼        ▼        ▼          ▼          ▼          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │  S3  │  │ RDS  │  │MySQL │  │Redis │  │ Doc  │  │Cloud │  │ On-  │        │
│  │      │  │      │  │Aurora│  │Elasti│  │ DB   │  │Watch │  │ Prem │        │
│  │      │  │      │  │      │  │cache │  │      │  │ Logs │  │      │        │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘        │
│                                                                              │
│   Data Source Connectors (Lambda-based):                                     │
│   • Amazon-provided connectors                                               │
│   • Custom connectors (build your own)                                       │
│                                                                              │
│   Example: JOIN S3 data với RDS data trong một query!                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Workgroups

**Workgroups** giúp tách biệt queries, users, và control costs.

| Feature | Mô tả |
|---------|-------|
| **Query isolation** | Tách queries theo team/project |
| **Cost control** | Set data scan limits per query |
| **IAM integration** | Control access to workgroups |
| **Query history** | Track queries per workgroup |
| **Settings** | Different result locations, encryption |

```
┌─────────────────────────────────────────────────────────────────┐
│                      Workgroups                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Workgroup: "data-science"                                     │
│   ├── Members: data science team                                │
│   ├── Data limit: 100 GB per query                              │
│   ├── Result location: s3://athena-results/data-science/        │
│   └── Queries tracked separately                                │
│                                                                 │
│   Workgroup: "business-analytics"                               │
│   ├── Members: business analysts                                │
│   ├── Data limit: 10 GB per query                               │
│   ├── Result location: s3://athena-results/analytics/           │
│   └── Queries tracked separately                                │
│                                                                 │
│   ⭐ Prevent runaway queries eating budget!                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pricing

### Pricing Model

| Component | Price |
|-----------|-------|
| **Data scanned** | $5 per TB scanned |
| **DDL statements** | FREE (CREATE, DROP, ALTER) |
| **Failed queries** | FREE |
| **Cancelled queries** | Pay for data scanned before cancel |

### Cost Optimization

| Technique | Savings |
|-----------|---------|
| **Columnar formats (Parquet/ORC)** | 30-90% less data scanned |
| **Compression** | 30-50% less data |
| **Partitioning** | Only scan needed partitions |
| **LIMIT clause** | Limit results (doesn't help much) |

### Cost Example

```
Scenario: Query 1 TB of CSV logs daily

WITHOUT optimization:
- 1 TB × $5 × 30 days = $150/month

WITH optimization (Convert to Parquet + Partition):
- Data reduction: 90%
- Partition pruning: 95% (only query today's data)
- Effective scan: 1 TB × 0.1 × 0.05 = 5 GB
- Cost: 0.005 TB × $5 × 30 days = $0.75/month

💰 Savings: 99.5%!
```

---

## Performance Optimization

### 1. Use Columnar Formats

```sql
-- Convert CSV to Parquet using CTAS
CREATE TABLE logs_parquet
WITH (
    format = 'PARQUET',
    external_location = 's3://my-bucket/logs-parquet/'
)
AS SELECT * FROM logs_csv;
```

### 2. Partition Data

```sql
-- Create partitioned table
CREATE EXTERNAL TABLE logs (
    ip STRING,
    request STRING,
    status INT
)
PARTITIONED BY (year STRING, month STRING, day STRING)
STORED AS PARQUET
LOCATION 's3://my-bucket/logs-partitioned/';
```

### 3. Use Compression

```sql
-- Recommended: Snappy for Parquet (good balance)
CREATE TABLE logs_compressed
WITH (
    format = 'PARQUET',
    parquet_compression = 'SNAPPY'
)
AS SELECT * FROM logs;
```

### 4. Optimize Queries

| Do | Don't |
|----|-------|
| `SELECT col1, col2` | `SELECT *` |
| Filter on partition columns | Scan entire dataset |
| Use `LIMIT` for testing | Run full query for testing |
| Use `EXPLAIN` to understand | Guess query performance |

---

## Use Cases

### 1. Log Analysis

```
Use case: Analyze CloudTrail, VPC Flow Logs, ALB Access Logs
How: Query directly from S3 without ETL
Benefit: Pay only when you query
```

### 2. Ad-hoc Data Exploration

```
Use case: Data scientists explore new datasets
How: Create table, run SQL queries
Benefit: No infrastructure setup
```

### 3. BI Dashboards

```
Use case: Business analytics with QuickSight
How: QuickSight connects to Athena, Athena queries S3
Benefit: Low-cost BI on large datasets
```

### 4. Data Lake Analytics

```
Use case: Query petabytes in data lake
How: Glue crawls S3, Athena queries
Benefit: Schema-on-read, no data movement
```

---

## Best Practices

### Data Organization

| Practice | Reason |
|----------|--------|
| Use **Parquet/ORC** | Columnar = less data scanned |
| **Partition** by date/region | Partition pruning |
| **Compress** data | Smaller files = cheaper |
| **Right-size files** | 128 MB - 512 MB optimal |

### Query Optimization

| Practice | Reason |
|----------|--------|
| Select **specific columns** | Don't use `SELECT *` |
| **Filter on partitions** | Avoid full table scans |
| Use **LIMIT** for testing | Save costs during development |
| **EXPLAIN** queries | Understand query plans |

### Cost Control

| Practice | Reason |
|----------|--------|
| Set **workgroup limits** | Prevent runaway queries |
| **Monitor** with CloudWatch | Track spending |
| Use **Saved Queries** | Reuse optimized queries |

---

## Exam Tips

### Key Points

1. **Serverless** - No infrastructure to manage
2. **Pay-per-query** - $5/TB scanned
3. **Standard SQL** - Presto/Trino engine
4. **S3 as data source** - Query data in place
5. **Glue Data Catalog** - Metadata storage

### Cost Optimization (important!)

- **Columnar formats** (Parquet/ORC) reduce costs 30-90%
- **Partitioning** reduces data scanned
- **Compression** reduces data size
- **Workgroups** control costs per team

### Common Exam Scenarios

| Scenario | Answer |
|----------|--------|
| Query S3 data with SQL, serverless | Amazon Athena |
| Analyze CloudTrail/VPC Flow Logs | Athena |
| Ad-hoc queries on data lake | Athena |
| Reduce Athena costs | Parquet + Partitioning |
| BI on S3 data | QuickSight + Athena |
| Query multiple data sources | Federated Query |

### So sánh với các dịch vụ khác

| Feature | Athena | Redshift | EMR |
|---------|--------|----------|-----|
| **Type** | Serverless query | Data warehouse | Cluster |
| **Pricing** | Per query | Per hour | Per hour |
| **Best for** | Ad-hoc, occasional | BI, dashboards | ETL, ML |
| **Setup** | Instant | Minutes | Minutes |
| **Data location** | S3 | Redshift storage | S3/HDFS |

---

## Liên kết liên quan

- [Amazon S3](./s3.md)
- [AWS Glue](./aws-glue.md)
- [Amazon QuickSight](./amazon-quicksight.md)
- [Amazon EMR](./amazon-emr.md)
- [AWS Lake Formation](./aws-lake-formation.md)
