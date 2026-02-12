# Amazon Timestream

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
- [Timestream Engines](#timestream-engines)
- [Data Model](#data-model)
- [Storage Tiers](#storage-tiers)
- [Querying Data](#querying-data)
- [Integrations](#integrations)
- [Security](#security)
- [Pricing](#pricing)
- [Timestream vs InfluxDB vs OpenSearch](#timestream-vs-influxdb-vs-opensearch)
- [Use Cases](#use-cases)
- [Key Takeaways](#key-takeaways)

---

## Tổng quan

**Amazon Timestream** là fully managed **time series database** được thiết kế để lưu trữ và phân tích hàng tỷ events per day từ IoT devices, applications, và infrastructure.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AMAZON TIMESTREAM                               │
│                                                                       │
│   "Purpose-built time series database, serverless, fully managed"   │
│                                                                       │
│   TIME SERIES DATA = Data points có TIMESTAMP                        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Ví dụ: IoT sensor readings mỗi giây                        │   │
│   │                                                               │   │
│   │  timestamp              │ device_id │ temperature │ humidity │   │
│   │  ───────────────────────┼───────────┼─────────────┼──────────│   │
│   │  2024-01-01 10:00:00    │ sensor-1  │ 25.5        │ 60%      │   │
│   │  2024-01-01 10:00:01    │ sensor-1  │ 25.6        │ 61%      │   │
│   │  2024-01-01 10:00:02    │ sensor-1  │ 25.4        │ 60%      │   │
│   │  ...                    │           │             │          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ✅ Serverless (không quản lý servers)                             │
│   ✅ Auto-scales (trillions of events/day)                          │
│   ✅ 1000x faster queries than relational DBs                       │
│   ✅ Smart storage tiers (memory → magnetic)                        │
│   ✅ Built-in time series analytics functions                       │
│   ✅ Pay-per-use (chỉ trả tiền cho resources dùng)                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Tại sao cần Time Series Database?

```
┌─────────────────────────────────────────────────────────────────────┐
│         WHY TIME SERIES DATABASE vs RELATIONAL DB?                   │
│                                                                       │
│   RELATIONAL DB (MySQL, PostgreSQL):                                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ❌ Không tối ưu cho time-ordered data                      │   │
│   │  ❌ Chậm khi aggregating large time ranges                  │   │
│   │  ❌ Storage không tối ưu cho writes liên tục               │   │
│   │  ❌ Không có built-in time series functions                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   TIMESTREAM:                                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ✅ Optimized cho time-ordered inserts                      │   │
│   │  ✅ Automatic data lifecycle (recent → cold storage)       │   │
│   │  ✅ Built-in: interpolation, smoothing, approximation      │   │
│   │  ✅ Query trillions of rows trong seconds                   │   │
│   │  ✅ 1/10 cost so với relational DB                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                   TIMESTREAM ARCHITECTURE                            │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    DATA SOURCES                              │   │
│   │   IoT Devices   │   Applications   │   Infrastructure       │   │
│   │   ┌─────────┐   │   ┌─────────┐   │   ┌─────────┐           │   │
│   │   │ Sensors │   │   │ Metrics │   │   │ Logs    │           │   │
│   │   └────┬────┘   │   └────┬────┘   │   └────┬────┘           │   │
│   └────────┼────────┴────────┼────────┴────────┼────────────────┘   │
│            │                 │                 │                     │
│            ▼                 ▼                 ▼                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    INGESTION LAYER                           │   │
│   │                                                               │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│   │   │ AWS SDK  │  │ Kinesis  │  │  Lambda  │  │ Telegraf │   │   │
│   │   └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│   │                                                               │   │
│   │   Millions of events per second                              │   │
│   └───────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    STORAGE LAYER                             │   │
│   │                                                               │   │
│   │   ┌─────────────────────┐    ┌─────────────────────┐        │   │
│   │   │    MEMORY STORE     │    │   MAGNETIC STORE    │        │   │
│   │   │   (Recent data)     │───▶│   (Historical)      │        │   │
│   │   │   Fast queries      │auto│   Cost-optimized    │        │   │
│   │   │   Hours - Days      │move│   Months - Years    │        │   │
│   │   └─────────────────────┘    └─────────────────────┘        │   │
│   └───────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    QUERY LAYER                               │   │
│   │                                                               │   │
│   │   SQL Queries + Built-in Time Series Functions               │   │
│   │   • Unified view across Memory + Magnetic stores            │   │
│   │   • Scan trillions of events in seconds                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                   VISUALIZATION                              │   │
│   │   QuickSight   │   Grafana   │   Custom Apps                │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

Key: Decoupled architecture - Ingestion, Storage, Query scale independently
```

---

## Timestream Engines

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TIMESTREAM ENGINES                                │
│                                                                       │
│   1. TIMESTREAM FOR LIVEANALYTICS (Proprietary)                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • AWS custom high-performance engine                        │   │
│   │  • Millisecond latency queries                               │   │
│   │  • Trillions of events per day                               │   │
│   │  • Built-in time series functions                            │   │
│   │  • Up to 99.99% availability                                 │   │
│   │                                                               │   │
│   │  Best for: Custom apps, IoT, DevOps monitoring              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   2. TIMESTREAM FOR INFLUXDB (Open Source)                           │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Managed InfluxDB on AWS                                   │   │
│   │  • Easy migration từ self-hosted InfluxDB                   │   │
│   │  • InfluxQL + Flux query languages                           │   │
│   │  • Schema-on-write flexibility                               │   │
│   │  • Up to 99.9% availability                                  │   │
│   │                                                               │   │
│   │  Best for: Teams already using InfluxDB                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   CHỌN ENGINE NÀO?                                                   │
│   ┌──────────────────┬───────────────────┬───────────────────────┐  │
│   │ Criteria         │ LiveAnalytics     │ InfluxDB              │  │
│   ├──────────────────┼───────────────────┼───────────────────────┤  │
│   │ New project      │ ✅ Recommended    │                       │  │
│   │ Migrate InfluxDB │                   │ ✅ Recommended        │  │
│   │ Query language   │ SQL               │ InfluxQL/Flux         │  │
│   │ AWS native       │ ✅ Full           │ Managed open-source   │  │
│   └──────────────────┴───────────────────┴───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TIMESTREAM DATA MODEL                             │
│                                                                       │
│   HIERARCHY:                                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  DATABASE (Container)                                        │   │
│   │     └── TABLE (Group of time series)                        │   │
│   │            └── RECORDS (Individual data points)             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   RECORD STRUCTURE:                                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                               │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│   │  │  DIMENSIONS  │  │   MEASURES   │  │    TIMESTAMP     │   │   │
│   │  │  (metadata)  │  │   (values)   │  │   (time)         │   │   │
│   │  └──────────────┘  └──────────────┘  └──────────────────┘   │   │
│   │                                                               │   │
│   │  Dimensions: Identify the time series                        │   │
│   │  • device_id = "sensor-001"                                  │   │
│   │  • region = "us-east-1"                                      │   │
│   │  • environment = "production"                                │   │
│   │                                                               │   │
│   │  Measures: The actual metric values                          │   │
│   │  • temperature = 25.5 (DOUBLE)                               │   │
│   │  • humidity = 60 (BIGINT)                                    │   │
│   │  • status = "healthy" (VARCHAR)                              │   │
│   │                                                               │   │
│   │  Timestamp: When the measurement was taken                   │   │
│   │  • 2024-01-01T10:00:00.000Z                                  │   │
│   │                                                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   EXAMPLE TABLE:                                                     │
│   ┌────────────────────────────────────────────────────────────────┐│
│   │ time                 │ device_id  │ region    │ temp │ humid ││
│   │──────────────────────┼────────────┼───────────┼──────┼───────││
│   │ 2024-01-01 10:00:00  │ sensor-001 │ us-east-1 │ 25.5 │ 60    ││
│   │ 2024-01-01 10:00:01  │ sensor-001 │ us-east-1 │ 25.6 │ 61    ││
│   │ 2024-01-01 10:00:00  │ sensor-002 │ eu-west-1 │ 22.1 │ 55    ││
│   └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Storage Tiers

```
┌─────────────────────────────────────────────────────────────────────┐
│                      STORAGE TIERS                                   │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    MEMORY STORE                              │   │
│   │                 (Hot data, recent)                           │   │
│   │                                                               │   │
│   │   • In-memory storage for FAST queries                       │   │
│   │   • Sub-millisecond latency                                  │   │
│   │   • Retention: Hours to Days (configurable)                  │   │
│   │   • Higher cost per GB                                       │   │
│   │   • Use for: Real-time dashboards, alerts                   │   │
│   │                                                               │   │
│   └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│                    Automatic │ Data Lifecycle                        │
│                              │ (Policy-based)                        │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                   MAGNETIC STORE                             │   │
│   │                 (Cold data, historical)                      │   │
│   │                                                               │   │
│   │   • SSD-backed, cost-optimized storage                       │   │
│   │   • Milliseconds latency (still fast!)                       │   │
│   │   • Retention: Months to Years                               │   │
│   │   • ~1/10 cost của Memory Store                             │   │
│   │   • Use for: Historical analysis, compliance                │   │
│   │                                                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   RETENTION POLICY EXAMPLE:                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Memory Store Retention: 24 hours                            │   │
│   │  Magnetic Store Retention: 1 year                            │   │
│   │                                                               │   │
│   │  Data flow:                                                   │   │
│   │  Ingest → Memory (24h) → Auto-move → Magnetic (1 year)      │   │
│   │                                      → Auto-delete           │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Querying Data

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUERYING TIMESTREAM                               │
│                                                                       │
│   SQL + Built-in Time Series Functions                               │
│                                                                       │
│   BASIC QUERY:                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  SELECT device_id, time, temperature                        │   │
│   │  FROM "mydb"."sensor_data"                                   │   │
│   │  WHERE time BETWEEN ago(1h) AND now()                       │   │
│   │    AND device_id = 'sensor-001'                              │   │
│   │  ORDER BY time DESC                                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   BUILT-IN TIME SERIES FUNCTIONS:                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  INTERPOLATION (fill missing values):                        │   │
│   │  INTERPOLATE_LINEAR(temperature, time)                       │   │
│   │                                                               │   │
│   │  BUCKETING (group by time intervals):                        │   │
│   │  bin(time, 1h)  -- Group by 1-hour buckets                  │   │
│   │                                                               │   │
│   │  AGGREGATIONS:                                                │   │
│   │  AVG(temperature), MAX(temperature), MIN(temperature)       │   │
│   │  APPROX_PERCENTILE(temperature, 0.95)                        │   │
│   │                                                               │   │
│   │  DERIVATIVES (rate of change):                               │   │
│   │  DERIVATIVE(temperature, time)                               │   │
│   │                                                               │   │
│   │  TIME FUNCTIONS:                                              │   │
│   │  ago(1h), now(), date_trunc('hour', time)                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   EXAMPLE: Average temperature per hour, last 24 hours              │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  SELECT                                                       │   │
│   │      bin(time, 1h) AS hour,                                  │   │
│   │      device_id,                                               │   │
│   │      AVG(temperature) AS avg_temp                            │   │
│   │  FROM "mydb"."sensor_data"                                   │   │
│   │  WHERE time BETWEEN ago(24h) AND now()                      │   │
│   │  GROUP BY bin(time, 1h), device_id                          │   │
│   │  ORDER BY hour DESC                                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Integrations

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATIONS                                      │
│                                                                       │
│   DATA INGESTION:                                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│   │  │AWS SDK   │  │Kinesis   │  │Lambda    │  │IoT Core  │    │   │
│   │  │(direct)  │  │Data Strm │  │          │  │          │    │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│   │                                                               │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │   │
│   │  │Telegraf  │  │Kafka     │  │Prometheus│  (Open source)    │   │
│   │  │(agent)   │  │Connect   │  │remote    │                    │   │
│   │  └──────────┘  └──────────┘  │write     │                    │   │
│   │                              └──────────┘                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   VISUALIZATION:                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │   │
│   │  │QuickSight│  │Grafana   │  │Custom    │                    │   │
│   │  │(native)  │  │(plugin)  │  │Apps      │                    │   │
│   │  └──────────┘  └──────────┘  └──────────┘                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ANALYTICS & ML:                                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │   │
│   │  │Athena    │  │SageMaker │  │Lambda    │                    │   │
│   │  │(federate)│  │(ML)      │  │(process) │                    │   │
│   │  └──────────┘  └──────────┘  └──────────┘                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   Xem thêm:                                                          │
│   • [kinesis.md](kinesis.md) - Real-time streaming ingestion        │
│   • [amazon-quicksight.md](amazon-quicksight.md) - Visualization    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY                                      │
│                                                                       │
│   ENCRYPTION:                                                        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  At Rest: AES-256 with AWS KMS (default enabled)            │   │
│   │  In Transit: TLS 1.2+                                        │   │
│   │  Customer-managed CMK supported                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ACCESS CONTROL:                                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • IAM policies (fine-grained)                               │   │
│   │  • Database/table level permissions                          │   │
│   │  • VPC Endpoints (PrivateLink) available                     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   COMPLIANCE:                                                        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  SOC 1/2/3, PCI DSS, HIPAA eligible, ISO certifications     │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pricing

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRICING (LiveAnalytics)                           │
│                                                                       │
│   PAY-PER-USE MODEL:                                                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. WRITES                                                    │   │
│   │     • $0.50 per million 1KB writes                           │   │
│   │                                                               │   │
│   │  2. MEMORY STORE                                              │   │
│   │     • $0.036 per GB-hour (~$26/GB-month)                    │   │
│   │     • For recent, hot data                                   │   │
│   │                                                               │   │
│   │  3. MAGNETIC STORE                                            │   │
│   │     • $0.03 per GB-month                                     │   │
│   │     • ~1/800 of memory store cost!                          │   │
│   │                                                               │   │
│   │  4. QUERIES                                                   │   │
│   │     • $0.01 per GB scanned                                   │   │
│   │     • Minimum 10 MB per query                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   COST OPTIMIZATION:                                                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Giảm Memory Store retention → data chuyển Magnetic sớm  │   │
│   │  • Batch writes (group records per request)                  │   │
│   │  • Use predicates to limit data scanned                      │   │
│   │  • Create scheduled queries for common aggregations          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ⚠️ Timestream KHÔNG có Free Tier!                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Timestream vs InfluxDB vs OpenSearch

```
┌─────────────────────────────────────────────────────────────────────┐
│        TIMESTREAM vs INFLUXDB vs OPENSEARCH                          │
│                                                                       │
│   ┌──────────────┬───────────────┬───────────────┬─────────────────┐│
│   │ Feature      │ Timestream    │ InfluxDB      │ OpenSearch      ││
│   │              │ LiveAnalytics │ (self/managed)│                 ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Type         │ Time Series   │ Time Series   │ Search/         ││
│   │              │ (AWS native)  │ (Open source) │ Analytics       ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Query        │ SQL           │ InfluxQL/Flux │ DSL/SQL         ││
│   │ Language     │               │               │                 ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Serverless   │ ✅ Yes        │ ❌ No         │ ⚠️ Serverless  ││
│   │              │               │ (instance)    │    option       ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Auto tiering │ ✅ Yes        │ ❌ Manual     │ ❌ Manual       ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Time series  │ ✅ Built-in   │ ✅ Built-in   │ ⚠️ Limited     ││
│   │ functions    │               │               │                 ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Best for     │ IoT, metrics  │ InfluxDB      │ Logs, search,   ││
│   │              │ DevOps        │ migration     │ full-text       ││
│   └──────────────┴───────────────┴───────────────┴─────────────────┘│
│                                                                       │
│   WHEN TO USE WHAT:                                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ Timestream: Pure time series, IoT, metrics, serverless     │   │
│   │                                                               │   │
│   │ Timestream for InfluxDB: Migrating from self-hosted InfluxDB│   │
│   │                                                               │   │
│   │ OpenSearch: Need full-text search + time series logs        │   │
│   │             (e.g., application logs with search)            │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USE CASES                                       │
│                                                                       │
│   1. IOT APPLICATIONS                                                │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Sensor data (temperature, humidity, pressure)            │   │
│   │  • Connected vehicles (GPS, telemetry)                       │   │
│   │  • Smart buildings (HVAC, energy)                            │   │
│   │  • Industrial equipment monitoring                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   2. DEVOPS & INFRASTRUCTURE MONITORING                              │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Application metrics (latency, errors, throughput)        │   │
│   │  • Server health (CPU, memory, disk)                        │   │
│   │  • Container/Kubernetes metrics                              │   │
│   │  • Custom business metrics                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   3. ANALYTICS & BUSINESS INTELLIGENCE                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • E-commerce: Clickstream, user behavior over time         │   │
│   │  • Financial: Stock prices, trading volume                   │   │
│   │  • Gaming: Player activity, in-game metrics                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   4. REAL-TIME DASHBOARDS & ALERTS                                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Live operational dashboards                               │   │
│   │  • Threshold-based alerting                                  │   │
│   │  • Anomaly detection                                         │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KEY TAKEAWAYS FOR EXAM                            │
│                                                                       │
│   ✅ Timestream = Purpose-built TIME SERIES database                │
│                                                                       │
│   ✅ Serverless, fully managed (no servers to provision)            │
│                                                                       │
│   ✅ 2 Engines: LiveAnalytics (AWS) vs InfluxDB (open source)       │
│                                                                       │
│   ✅ 2 Storage Tiers:                                                │
│      • Memory Store = Recent data, fast, expensive                   │
│      • Magnetic Store = Historical, slow, cheap                      │
│                                                                       │
│   ✅ Automatic data lifecycle (memory → magnetic → delete)          │
│                                                                       │
│   ✅ SQL queries với built-in time series functions                 │
│                                                                       │
│   ✅ 1000x faster than relational DBs cho time series               │
│                                                                       │
│   ✅ Ingestion: AWS SDK, Kinesis, IoT Core, Telegraf                │
│                                                                       │
│   ✅ Visualization: QuickSight, Grafana                             │
│                                                                       │
│   ✅ Use cases: IoT, DevOps monitoring, metrics, analytics          │
│                                                                       │
│   ⚠️ KHÔNG có Free Tier!                                            │
│                                                                       │
│   🆚 vs DynamoDB:                                                    │
│      • Timestream = Time series, analytics                           │
│      • DynamoDB = Key-value, transactional                           │
│                                                                       │
│   🆚 vs OpenSearch:                                                  │
│      • Timestream = Pure time series                                 │
│      • OpenSearch = Full-text search + logs                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tiếp theo

- [Kinesis](kinesis.md) - Real-time data streaming
- [Amazon QuickSight](amazon-quicksight.md) - BI visualization
- [CloudWatch](cloudwatch.md) - AWS native monitoring
- [DynamoDB](dynamodb.md) - Key-value NoSQL database
