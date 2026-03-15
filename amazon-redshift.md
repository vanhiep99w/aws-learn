# Amazon Redshift

## Mục lục

- [Redshift là gì?](#redshift-là-gì)
- [Kiến trúc Redshift](#kiến-trúc-redshift)
- [Provisioned vs Serverless](#provisioned-vs-serverless)
- [Node Types](#node-types)
- [Data Distribution và Sort Keys](#data-distribution-và-sort-keys)
- [Redshift Spectrum](#redshift-spectrum)
- [Zero-ETL Integration](#zero-etl-integration)
- [Concurrency Scaling](#concurrency-scaling)
- [Data Sharing](#data-sharing)
- [Redshift ML](#redshift-ml)
- [Bảo mật](#bảo-mật)
- [Chi phí](#chi-phí)
- [So sánh với các dịch vụ khác](#so-sánh-với-các-dịch-vụ-khác)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Redshift là gì?

**Amazon Redshift** là dịch vụ **Data Warehouse** được quản lý hoàn toàn bởi AWS, được thiết kế cho **OLAP (Online Analytical Processing)** - phân tích dữ liệu lớn với quy mô petabyte.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Warehouse Concept                           │
│                                                                     │
│   OLTP (Transactional)              OLAP (Analytical)               │
│   ─────────────────────              ──────────────────             │
│   - INSERT, UPDATE, DELETE           - SELECT, aggregate            │
│   - Nhiều transaction nhỏ            - Ít query nhưng phức tạp      │
│   - RDS, Aurora, DynamoDB            - Redshift, Athena             │
│                                                                     │
│   ┌──────────────────┐              ┌──────────────────┐            │
│   │  App Database    │   ──ETL──►   │  Data Warehouse  │            │
│   │  (OLTP)          │              │  (OLAP)          │            │
│   │                  │              │                  │            │
│   │  Orders          │              │  Analytics       │            │
│   │  Customers       │              │  Reports         │            │
│   │  Products        │              │  BI Dashboard    │            │
│   └──────────────────┘              └──────────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Columnar Storage** | Lưu trữ theo cột, tối ưu cho query analytical |
| **MPP (Massively Parallel Processing)** | Xử lý song song trên nhiều node |
| **Petabyte Scale** | Xử lý dữ liệu từ GB đến PB |
| **SQL Compatible** | Dùng PostgreSQL-compatible SQL |
| **BI Integration** | Tích hợp với QuickSight, Tableau, Power BI... |
| **Data Lakehouse** | Kết hợp data lake (S3) + data warehouse |

### Columnar vs Row Storage

```
ROW-BASED STORAGE (OLTP - RDS, Aurora):
┌──────┬────────┬─────────┬────────┐
│ ID   │ Name   │ Amount  │ Date   │
├──────┼────────┼─────────┼────────┤
│ 1    │ Alice  │ 100     │ Jan    │ ← Row 1
│ 2    │ Bob    │ 200     │ Feb    │ ← Row 2
│ 3    │ Carol  │ 150     │ Mar    │ ← Row 3
└──────┴────────┴─────────┴────────┘
→ Tốt cho: SELECT * FROM orders WHERE id = 1

COLUMNAR STORAGE (OLAP - Redshift):
┌──────────────────────────────────────┐
│ ID Column:     [1, 2, 3, ...]        │ ← Đọc riêng
│ Name Column:   [Alice, Bob, Carol]   │
│ Amount Column: [100, 200, 150, ...]  │ ← Chỉ đọc cột này
│ Date Column:   [Jan, Feb, Mar, ...]  │
└──────────────────────────────────────┘
→ Tốt cho: SELECT SUM(amount) FROM orders
→ Chỉ đọc 1 cột thay vì toàn bộ row
→ Compression tốt hơn (dữ liệu cùng type)
```

---

## Kiến trúc Redshift

### Cluster Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Redshift Cluster                             │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      LEADER NODE                            │   │
│   │                                                             │   │
│   │  - Nhận query từ client                                     │   │
│   │  - Parse và optimize query                                  │   │
│   │  - Tạo execution plan                                       │   │
│   │  - Phân phối task đến compute nodes                         │   │
│   │  - Aggregate kết quả                                        │   │
│   │  - Trả về kết quả cho client                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                             │                                       │
│              ┌───────────────┼───────────────┐                      │
│              │               │               │                      │
│              ▼               ▼               ▼                      │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│   │ COMPUTE NODE 1│ │ COMPUTE NODE 2│ │ COMPUTE NODE 3 │            │
│   │               │ │               │ │                │            │
│   │ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐  │            │
│   │ │  Slice 1  │ │ │ │  Slice 1  │ │ │ │  Slice 1  │  │            │
│   │ │  Slice 2  │ │ │ │  Slice 2  │ │ │ │  Slice 2  │  │            │
│   │ └───────────┘ │ │ └───────────┘ │ │ └───────────┘  │            │
│   │               │ │               │ │                │            │
│   │  Store data   │ │  Store data   │ │  Store data    │            │
│   │  Execute      │ │  Execute      │ │  Execute       │            │
│   │  queries      │ │  queries      │ │  queries       │            │
│   └───────────────┘ └───────────────┘ └───────────────┘             │
│                                                                     │
│                    Redshift Managed Storage (RMS)                   │
│              ┌───────────────────────────────┐                      │
│              │                         Amazon S3                           │                      │
│              │              (Durable storage cho RA3 nodes)                │                      │
│              └───────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Thành phần chính

| Component | Mô tả |
|-----------|-------|
| **Leader Node** | Nhận query, optimize, phân phối task, aggregate kết quả |
| **Compute Nodes** | Lưu trữ data, thực thi query song song |
| **Slices** | Phân vùng nhỏ trong mỗi compute node, xử lý độc lập |
| **Redshift Managed Storage (RMS)** | S3-backed storage cho RA3 nodes |

---

## Provisioned vs Serverless

### So sánh

| Tiêu chí | Provisioned | Serverless |
|----------|-------------|------------|
| **Quản lý** | Bạn chọn số lượng, type node | AWS tự động quản lý |
| **Scaling** | Manual hoặc Elastic Resize | Tự động scale |
| **Billing** | Per node-hour | Per RPU-second |
| **Use case** | Workload ổn định, predictable | Variable, unpredictable workload |
| **Setup** | Phức tạp hơn | Đơn giản, nhanh |
| **Reserved pricing** | ✅ Có (lên đến 75% discount) | ✅ Có (lên đến 24% discount) |

### Provisioned Cluster

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROVISIONED CLUSTER                         │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│   │ ra3.xlplus  │  │ ra3.xlplus  │  │ ra3.xlplus  │             │
│   │    Node 1   │  │    Node 2   │  │    Node 3   │             │
│   └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│   Chi phí: $1.086/hour × 3 nodes = $3.258/hour                  │
│   Luôn chạy 24/7 dù không query                                 │
│                                                                 │
│   ✅ Predictable cost                                           │
│   ✅ Reserved Instances discount (up to 75%)                    │
│   ❌ Trả tiền khi idle                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Serverless

```
┌─────────────────────────────────────────────────────────────────┐
│                     REDSHIFT SERVERLESS                         │
│                                                                 │
│   Workload ─────► ┌───────────────────────────────┐             │
│                   │  AWS tự động provision        │             │
│                   │  8 RPU ──► 128 RPU ──► 8 RPU  │             │
│                   │           (scale)             │             │
│                   └───────────────────────────────┘             │
│                                                                 │
│   RPU = Redshift Processing Unit                                │
│   Chi phí: $0.375/RPU-hour (us-east-1)                          │
│   Base 8 RPU = $3.00/hour khi active                            │
│                                                                 │
│   ✅ Chỉ trả khi query                                          │
│   ✅ Auto scaling                                               │
│   ✅ Không cần quản lý infrastructure                           │
│   ❌ Có thể đắt hơn với workload ổn định 24/7                   │
└─────────────────────────────────────────────────────────────────┘
```

### Khi nào chọn cái nào?

| Tình huống | Recommendation |
|------------|----------------|
| Workload 24/7, ổn định | 🏆 **Provisioned + Reserved** |
| Workload peak hours (8h/ngày) | 🏆 **Serverless** |
| POC, development, testing | 🏆 **Serverless** |
| Unpredictable workload | 🏆 **Serverless** |
| Budget hạn chế, cần optimize | Tính toán so sánh |

---

## Node Types

### RA3 Nodes (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                          RA3 NODES                              │
│                    (Managed Storage - RMS)                      │
│                                                                 │
│   ┌─────────────┐                     ┌─────────────────────┐   │
│   │ RA3 Node    │◄── Hot data ──────► │ Local SSD Cache     │   │
│   │             │                     │ (Fast access)       │   │
│   │             │◄── Warm/Cold ─────► │ Amazon S3 (RMS)     │   │
│   │             │     data            │ (Unlimited storage) │   │
│   └─────────────┘                     └─────────────────────┘   │
│                                                                 │
│   ✅ Compute và Storage scale độc lập                           │
│   ✅ Chỉ trả storage theo GB thực tế dùng                       │
│   ✅ Automatic data tiering                                     │
└─────────────────────────────────────────────────────────────────┘
```

| Node Type | vCPU | Memory | Storage | Price/hour |
|-----------|------|--------|---------|------------|
| ra3.xlplus | 4 | 32 GB | RMS | ~$1.086 |
| ra3.4xlarge | 12 | 96 GB | RMS | ~$3.26 |
| ra3.16xlarge | 48 | 384 GB | RMS | ~$13.04 |

### DC2 Nodes (Dense Compute)

```
┌─────────────────────────────────────────────────────────────────┐
│                          DC2 NODES                              │
│                     (Local SSD Storage)                         │
│                                                                 │
│   ┌─────────────────────────────────────────────┐               │
│   │ DC2 Node                                    │               │
│   │                                             │               │
│   │  ┌─────────────────────────────────────┐    │               │
│   │  │        Local NVMe SSD                │   │               │
│   │  │        (Fixed storage per node)      │   │               │
│   │  └─────────────────────────────────────┘    │               │
│   └─────────────────────────────────────────────┘               │
│                                                                 │
│   ✅ Fastest performance (all data local)                       │
│   ✅ Tốt cho datasets < 1TB uncompressed                        │
│   ❌ Storage fixed, scale bằng cách thêm nodes                  │
└─────────────────────────────────────────────────────────────────┘
```

| Node Type | vCPU | Memory | Storage | Price/hour |
|-----------|------|--------|---------|------------|
| dc2.large | 2 | 15 GB | 160 GB SSD | ~$0.25 |
| dc2.8xlarge | 32 | 244 GB | 2.56 TB SSD | ~$4.80 |

### Chọn node nào?

| Tiêu chí | Recommendation |
|----------|----------------|
| Data < 1TB, performance critical | DC2 |
| Data growing, cần flexibility | **RA3** (recommended) |
| Muốn scale compute riêng storage | **RA3** |
| Budget limited, small dataset | DC2.large |

---

## Data Distribution và Sort Keys

### Distribution Styles

Cách Redshift phân phối data giữa các nodes quyết định performance của JOIN và aggregation.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTION STYLES                          │
│                                                                 │
│  1. KEY Distribution                                            │
│  ─────────────────────                                          │
│     Rows với cùng key value → cùng node                         │
│     Tốt cho: JOIN trên cùng key                                 │
│                                                                 │
│     ┌─────────┐    ┌─────────┐    ┌─────────┐                   │
│     │ Node 1  │    │ Node 2  │    │ Node 3  │                   │
│     │ key=A   │    │ key=B   │    │ key=C   │                   │
│     │ key=A   │    │ key=B   │    │ key=C   │                   │
│     └─────────┘    └─────────┘    └─────────┘                   │
│                                                                 │
│  2. ALL Distribution                                            │
│  ─────────────────────                                          │
│     Copy toàn bộ table đến mọi node                             │
│     Tốt cho: Dimension tables nhỏ                               │
│                                                                 │
│     ┌─────────┐    ┌─────────┐    ┌─────────┐                   │
│     │ Full    │    │ Full    │    │ Full    │                   │
│     │ table   │    │ table   │    │ table   │                   │
│     │ copy    │    │ copy    │    │ copy    │                   │
│     └─────────┘    └─────────┘    └─────────┘                   │
│                                                                 │
│  3. EVEN Distribution (default)                                 │
│  ─────────────────────                                          │
│     Round-robin phân đều rows                                   │
│     Tốt cho: Tables không JOIN thường xuyên                     │
│                                                                 │
│  4. AUTO Distribution                                           │
│  ─────────────────────                                          │
│     Redshift tự chọn EVEN hoặc ALL                              │
│     Recommended: Để Redshift quyết định                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Sort Keys

```
┌─────────────────────────────────────────────────────────────────┐
│                        SORT KEYS                                │
│                                                                 │
│  Compound Sort Key:                                             │
│  ─────────────────────                                          │
│  SORTKEY (date, region, product_id)                             │
│                                                                 │
│  Data sorted: date → region → product_id                        │
│  ✅ Tốt khi filter theo thứ tự: date, hoặc date+region          │
│  ❌ Không hiệu quả nếu chỉ filter region                        │
│                                                                 │
│  Interleaved Sort Key:                                          │
│  ─────────────────────                                          │
│  INTERLEAVED SORTKEY (date, region, product_id)                 │
│                                                                 │
│  ✅ Filter theo bất kỳ column nào đều hiệu quả                  │
│  ❌ Chậm hơn khi load data                                      │
│  ❌ Cần VACUUM thường xuyên                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Best Practices

| Scenario | Recommendation |
|----------|----------------|
| Time-series data | **Compound** sort key (date first) |
| Multi-dimension filtering | **Interleaved** sort key |
| Large fact table JOIN | **KEY** distribution (join column) |
| Small dimension table | **ALL** distribution |
| Don't know | **AUTO** (let Redshift decide) |

---

## Redshift Spectrum

**Redshift Spectrum** cho phép query data trực tiếp trên **S3** mà không cần load vào Redshift.

```
┌─────────────────────────────────────────────────────────────────┐
│                      REDSHIFT SPECTRUM                          │
│                                                                 │
│   ┌───────────────┐                                             │
│   │ Redshift      │                                             │
│   │ Cluster       │                                             │
│   │               │   SELECT * FROM                             │
│   │               │   spectrum_schema.s3_table                  │
│   │               │   WHERE date > '2024-01-01'                 │
│   └───────┬───────┘                                             │
│          │                                                      │
│           ▼                                                     │
│   ┌───────────────────────────────────────────────┐             │
│   │            Spectrum Layer                     │             │
│   │  (Thousands of nodes for parallel processing) │             │
│   └───────────────────────────────────────────────┘             │
│          │                                                      │
│           ▼                                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      Amazon S3                          │   │
│   │                                                         │   │
│   │  s3://my-bucket/data/                                   │   │
│   │  ├── sales/                                             │   │
│   │  │   ├── year=2024/month=01/ (Parquet, ORC, JSON, CSV)  │   │
│   │  │   ├── year=2024/month=02/                            │   │
│   │  │   └── ...                                            │   │
│   │  └── customers/                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Chi phí: $5.00 / TB data scanned                              │
│                                                                 │
│   ✅ Query data trực tiếp trên S3                               │
│   ✅ Không cần load data vào Redshift                           │
│   ✅ Tiết kiệm storage cost                                     │
│   ✅ Partition pruning (chỉ scan partitions cần thiết)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Khi nào dùng Spectrum?

| Scenario | Recommendation |
|----------|----------------|
| Historical data, ít query | 🏆 Spectrum (S3) |
| Hot data, query thường xuyên | Redshift tables |
| Data lake integration | 🏆 Spectrum |
| Ad-hoc exploration | 🏆 Spectrum |

---

## Zero-ETL Integration

**Zero-ETL** là tính năng mới cho phép replicate data từ operational databases vào Redshift **tự động**, không cần xây dựng ETL pipeline.

```
┌─────────────────────────────────────────────────────────────────┐
│                       ZERO-ETL INTEGRATION                      │
│                                                                 │
│   ┌───────────────┐         Automatic         ┌───────────────┐ │
│   │               │         Replication       │               │ │
│   │    Aurora     │ ══════════════════════════►│   Redshift   │ │
│   │   MySQL       │                           │               │ │
│   │   PostgreSQL  │   - No ETL code needed    │   Analytics   │ │
│   │               │   - Near real-time        │   & BI        │ │
│   └───────────────┘   - Incremental sync      └───────────────┘ │
│                                                                 │
│   ┌───────────────┐         Automatic         ┌───────────────┐ │
│   │    RDS for    │ ══════════════════════════►│   Redshift   │ │
│   │    MySQL      │                           │               │ │
│   └───────────────┘                           └───────────────┘ │
│                                                                 │
│   ┌───────────────┐         Automatic         ┌───────────────┐ │
│   │   DynamoDB    │ ══════════════════════════►│   Redshift   │ │
│   │               │                           │               │ │
│   └───────────────┘                           └───────────────┘ │
│                                                                 │
│   ✅ Không cần viết ETL code                                    │
│   ✅ Near real-time analytics                                   │
│   ✅ Automatic schema sync                                      │
│   ✅ Không có phí riêng (chỉ trả Redshift + source DB)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Supported Sources

| Source | Status |
|--------|--------|
| Amazon Aurora MySQL | ✅ GA |
| Amazon Aurora PostgreSQL | ✅ GA |
| Amazon RDS for MySQL | ✅ GA |
| Amazon DynamoDB | ✅ GA |

---

## Concurrency Scaling

**Concurrency Scaling** tự động thêm capacity khi có quá nhiều concurrent queries.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONCURRENCY SCALING                          │
│                                                                 │
│   Normal Load:                                                  │
│   ┌─────────────┐                                               │
│   │ Main Cluster│◄── 10 queries ──► OK                          │
│   └─────────────┘                                               │
│                                                                 │
│   Peak Load (queue building up):                                │
│   ┌─────────────┐         ┌─────────────────────────────┐       │
│   │ Main Cluster│         │ Concurrency Scaling Cluster │       │
│   │             │◄── 50 queries ───►                    │       │
│   │             │    Auto offload   │ Temporary cluster │       │
│   └─────────────┘         │ (scale out)                 │       │
│                                     └─────────────────────┘     │
│                                                                 │
│   ✅ Tự động, không cần cấu hình                                │
│   ✅ 1 giờ miễn phí/ngày cho hầu hết clusters                   │
│   💰 Sau đó tính theo on-demand rate                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Sharing

**Data Sharing** cho phép chia sẻ data giữa các Redshift clusters/serverless mà **không cần copy data**.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SHARING                             │
│                                                                 │
│   Producer Cluster                    Consumer Clusters         │
│   (Account A)                         (Account A, B, C)         │
│                                                                 │
│   ┌─────────────────┐                ┌─────────────────┐        │
│   │                 │   Datashare    │  BI Cluster     │        │
│   │   Production    │ ──────────────►│  (Read-only)    │        │
│   │   Warehouse     │                └─────────────────┘        │
│   │                │                                            │
│   │   "Main data"   │                ┌─────────────────┐        │
│   │                 │   Datashare    │  Data Science   │        │
│   │                 │ ──────────────►│  Cluster        │        │
│   └─────────────────┘                └─────────────────┘        │
│                                                                 │
│   ✅ Live data (không copy)                                     │
│   ✅ Cross-account, cross-region                                │
│   ✅ Consumer trả compute, Producer giữ data                    │
│   ✅ Granular access control                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Use Cases

| Scenario | Giải thích |
|----------|------------|
| **Multi-tenant SaaS** | Mỗi tenant có cluster riêng, đọc từ shared data |
| **BI vs ETL separation** | BI team đọc từ shared data, không ảnh hưởng ETL |
| **Cross-account analytics** | Share data với partners, subsidiaries |

---

## Redshift ML

**Redshift ML** cho phép train và deploy ML models trực tiếp trong Redshift bằng SQL.

```sql
-- 1. Create model
CREATE MODEL customer_churn_model
FROM training_data
TARGET churn
FUNCTION predict_churn
IAM_ROLE 'arn:aws:iam::123456789:role/RedshiftML';

-- 2. Use model in queries
SELECT customer_id, 
       predict_churn(customer_id, tenure, monthly_charges)
FROM customers
WHERE predict_churn(...) = 1;
```

| Feature | Mô tả |
|---------|-------|
| **AutoML** | Tự động chọn algorithm, tune hyperparameters |
| **Bring Your Own Model** | Import models từ SageMaker |
| **SQL Interface** | Không cần biết Python/ML frameworks |
| **Pricing** | $20/million cells (first 10M) |

---

## Bảo mật

### Security Features

```
┌─────────────────────────────────────────────────────────────────┐
│                      REDSHIFT SECURITY                          │
│                                                                 │
│   Network Security:                                             │
│   ─────────────────                                             │
│   ┌─────────────────────────────────────────────┐               │
│   │                    VPC                      │               │
│   │  ┌─────────────────────────────────────┐    │               │
│   │  │          Private Subnet              │   │               │
│   │  │  ┌─────────────────────────────┐    │    │               │
│   │  │  │    Redshift Cluster          │    │   │               │
│   │  │  │    (No public access)        │    │   │               │
│   │  │  └─────────────────────────────┘    │    │               │
│   │  │              │                       │   │               │
│   │  │              ▼                       │   │               │
│   │  │       Security Group                 │   │               │
│   │  │    (Port 5439 from app)              │   │               │
│   │  └─────────────────────────────────────┘    │               │
│   └─────────────────────────────────────────────┘               │
│                                                                 │
│   Encryption:                                                   │
│   ─────────────────                                             │
│   - At rest: AES-256 (KMS or HSM)                               │
│   - In transit: SSL/TLS                                         │
│                                                                 │
│   Access Control:                                               │
│   ─────────────────                                             │
│   - IAM for cluster management                                  │
│   - Database users/groups for data access                       │
│   - Row-level security (RLS)                                    │
│   - Column-level security (Dynamic Data Masking)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Access Control Options

| Feature | Mô tả |
|---------|-------|
| **IAM Integration** | authenticate với IAM users/roles |
| **AWS IAM Identity Center** | SSO cho federated users |
| **Row-Level Security** | Filter rows based on user |
| **Column-Level Security** | Grant access đến specific columns |
| **Dynamic Data Masking** | Mask sensitive data (PII, etc.) |

---

## Chi phí

### Provisioned Pricing (us-east-1)

| Node Type | On-Demand/hour | 1-yr Reserved | 3-yr Reserved |
|-----------|----------------|---------------|---------------|
| dc2.large | $0.25 | $0.145 (-42%) | $0.063 (-75%) |
| ra3.xlplus | $1.086 | $0.63 (-42%) | $0.27 (-75%) |
| ra3.4xlarge | $3.26 | $1.89 (-42%) | $0.82 (-75%) |

**Managed Storage (RMS):** $0.024/GB-month

### Serverless Pricing

| Component | Price |
|-----------|-------|
| **RPU-hour** | ~$0.375 (base 8 RPU = $3/hour) |
| **Managed Storage** | $0.024/GB-month |
| **Spectrum** | Included in RPU |
| **Concurrency Scaling** | Included in RPU |

### Ví dụ tính chi phí

**Provisioned (2 x ra3.xlplus, 24/7):**
```
On-Demand:
  $1.086 × 2 nodes × 24h × 30 days = $1,563/month
  + Storage 1TB: $0.024 × 1000 = $24/month
  Total: ~$1,587/month

3-year Reserved:
  $0.27 × 2 × 24 × 30 = $389/month
  + Storage: $24/month
  Total: ~$413/month (74% savings!)
```

**Serverless (8 hours/day, 8 RPU base):**
```
  $0.375 × 8 RPU × 8 hours × 22 workdays = $528/month
  + Storage 1TB: $24/month
  Total: ~$552/month
```

---

## So sánh với các dịch vụ khác

### Redshift vs Athena vs RDS

| Tiêu chí | Redshift | Athena | RDS |
|----------|----------|--------|-----|
| **Type** | Data Warehouse | Serverless Query | OLTP Database |
| **Use case** | BI, Analytics | Ad-hoc queries on S3 | Transactions |
| **Data size** | GB - PB | GB - PB (S3) | GB - TB |
| **Latency** | Seconds | Seconds - Minutes | Milliseconds |
| **Pricing** | Node-hours / RPU | Per query ($5/TB) | Instance hours |
| **ETL needed** | ✅ Yes (load data) | ❌ No (query S3 directly) | N/A |
| **Concurrency** | High | Moderate | Very High |

### Khi nào dùng gì?

| Scenario | Recommendation |
|----------|----------------|
| Complex BI dashboards, reporting | 🏆 **Redshift** |
| Ad-hoc queries on S3 data lake | 🏆 **Athena** |
| Application database | 🏆 **RDS / Aurora** |
| Real-time analytics | Kinesis + Redshift |
| Data exploration, occasional queries | 🏆 **Athena** |
| Predictable, heavy analytics workload | 🏆 **Redshift Provisioned** |

---

## Best Practices

### Design

| Practice | Giải thích |
|----------|------------|
| **Chọn Sort Key đúng** | Dựa trên WHERE clause phổ biến nhất |
| **Chọn Distribution Key đúng** | Dựa trên JOIN conditions |
| **Dùng RA3 nodes** | Tách compute & storage, flexibility |
| **Compress data** | Automatic, nhưng analyze compression |

### Performance

| Practice | Giải thích |
|----------|------------|
| **VACUUM regularly** | Sau DELETE/UPDATE để reclaim space |
| **ANALYZE tables** | Update statistics cho query optimizer |
| **Use Workload Management (WLM)** | Prioritize queries, set timeouts |
| **Monitor with CloudWatch** | Query performance, disk space, CPU |

### Cost Optimization

| Practice | Giải thích |
|----------|------------|
| **Reserved Instances** | Lên đến 75% savings cho steady workload |
| **Pause cluster** | Khi không dùng (dev/test) |
| **Use Spectrum** | Cho cold data thay vì load vào Redshift |
| **Right-size nodes** | Monitor và resize nếu underutilized |

---

## Exam Tips

### Key Points

> 💡 **Redshift = Data Warehouse = OLAP = Analytics**

| Keyword trong đề | Nghĩ đến |
|------------------|----------|
| Data warehouse, analytics, BI | **Redshift** |
| Petabyte scale analytics | **Redshift** |
| OLAP, complex queries | **Redshift** |
| Columnar storage | **Redshift** |
| MPP (Massively Parallel Processing) | **Redshift** |
| Query S3 data lake | **Redshift Spectrum** hoặc **Athena** |
| Real-time dashboard | **Redshift** (với materialized views) |
| ETL from Aurora/RDS | **Zero-ETL** hoặc **Glue** |

### So sánh nhanh

| Scenario | Service |
|----------|---------|
| "Data warehouse for BI" | Redshift |
| "Ad-hoc queries on S3" | Athena |
| "Transactional database" | RDS/Aurora |
| "Real-time streaming analytics" | Kinesis Data Analytics |
| "ETL jobs" | Glue |
| "Serverless data warehouse" | Redshift Serverless |

### Gotchas

| Trap | Sự thật |
|------|---------|
| "Redshift là database?" | ❌ Là Data Warehouse (OLAP), không phải OLTP |
| "Redshift auto-scales?" | Provisioned: ❌ Manual, Serverless: ✅ Auto |
| "Spectrum cần load data?" | ❌ Query trực tiếp trên S3 |
| "Redshift chạy trong VPC?" | ✅ Luôn trong VPC |

---

## Tài liệu tham khảo

- [Amazon Redshift Documentation](https://docs.aws.amazon.com/redshift/)
- [Redshift Best Practices](https://docs.aws.amazon.com/redshift/latest/dg/best-practices.html)
- [Redshift Pricing](https://aws.amazon.com/redshift/pricing/)
- [Redshift Serverless](https://aws.amazon.com/redshift/redshift-serverless/)
