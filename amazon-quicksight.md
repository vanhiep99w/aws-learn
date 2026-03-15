# Amazon QuickSight

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Cách hoạt động](#cách-hoạt-động)
- [SPICE Engine](#spice-engine)
- [Data Sources](#data-sources)
- [Visualizations](#visualizations)
- [Amazon Q in QuickSight](#amazon-q-in-quicksight)
- [Sharing và Embedding](#sharing-và-embedding)
- [Pricing](#pricing)
- [So sánh với các BI Tools khác](#so-sánh-với-các-bi-tools-khác)
- [Use Cases](#use-cases)
- [Exam Tips](#exam-tips)

---

## Giới thiệu

**Amazon QuickSight** là dịch vụ **Business Intelligence (BI) serverless** và **cloud-native** của AWS, cho phép tạo **dashboards**, **visualizations** và **reports** từ nhiều data sources khác nhau.

### Tại sao cần QuickSight?

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                     Vấn đề: Có data nhưng khó hiểu!                           │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────┐                                                             │
│   │  Data thô   │   ❌ Hàng triệu rows                                        │
│   │  (S3, RDS,  │   ❌ Khó nhìn patterns                                      │
│   │  Redshift)  │   ❌ Mất thời gian phân tích                                │
│   └─────────────┘                                                             │
│                                                                               │
│                              ▼▼▼                                              │
│                                                                               │
│   ┌─────────────┐     ┌───────────────┐     ┌─────────────────────────┐       │
│   │    Data     │────►│   QuickSight  │────►│   Dashboard dễ hiểu!    │       │
│   │   Sources   │     │    (BI Tool)  │     │   📊 📈 🗺️ 📉           │       │
│   └─────────────┘     └───────────────┘     └─────────────────────────┘       │
│                                                                               │
│   ✅ Visualize data bằng charts, graphs                                       │
│   ✅ Interactive dashboards                                                   │
│   ✅ Share với team, embed vào app                                            │
│   ✅ AI-powered insights với Amazon Q                                         │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Serverless** | Không cần quản lý infrastructure |
| **Scalable** | Tự động scale theo số users |
| **Pay-per-session** | Chỉ trả tiền khi user thực sự dùng |
| **SPICE engine** | In-memory engine cho query nhanh |
| **ML-powered** | Anomaly detection, forecasting tự động |
| **Generative BI** | Amazon Q để hỏi bằng ngôn ngữ tự nhiên |

---

## Cách hoạt động

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Amazon QuickSight Architecture                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DATA SOURCES                    QUICKSIGHT                 CONSUMERS       │
│   ───────────                    ───────────                 ─────────       │
│                                                                              │
│   ┌─────────────┐              ┌──────────────────────┐                      │
│   │  Amazon S3  │───┐          │                      │     ┌───────────────┐│
│   └─────────────┘   │          │   ┌──────────────┐   │     │  Authors      ││
│                     │          │   │    SPICE     │   │     │(tạo dashboard)││
│   ┌─────────────┐   │          │   │  (In-memory  │   │     └───────────────┘│
│   │  Amazon RDS │───┤          │   │   cache)     │   │            │         │
│   └─────────────┘   │          │   └──────────────┘   │           ▼          │
│   │──────────►       ▼              │              ┌──────────────────────┐  │
│   ┌─────────────┐   │          │   ┌──────────────┐   │────►│ Readers       ││
│   │  Redshift   │───┤          │   │  Dashboards  │   │     │(xem reports)  ││
│   └─────────────┘   │          │   │  & Reports   │   │     └───────────────┘│
│                     │          │   └──────────────┘   │            │         │
│   ┌─────────────┐   │          │                      │           ▼          │
│   │  Athena     │───┤          │   ┌──────────────┐   │     ┌───────────────┐│
│   └─────────────┘   │          │   │   Amazon Q   │   │     │  Embedded     ││
│                     │          │   │ (Natural     │   │────►│  in Apps      ││
│   ┌─────────────┐   │          │   │  Language)   │   │     └───────────────┘│
│   │ On-Premises │───┘          │   └──────────────┘    │                     │
│   │ (via JDBC)  │              │                      │                      │
│   └─────────────┘              └──────────────────────┘                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Workflow

| Bước | Mô tả |
|------|-------|
| **1. Connect** | Kết nối tới data sources (S3, RDS, Redshift...) |
| **2. Prepare** | Clean, filter, transform data |
| **3. Import to SPICE** | Load data vào in-memory engine (optional) |
| **4. Analyze** | Tạo visualizations, calculations |
| **5. Share** | Publish dashboards, schedule reports |

---

## SPICE Engine

**SPICE** = **S**uper-fast **P**arallel **I**n-memory **C**alculation **E**ngine

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                            SPICE vs Direct Query                              │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   DIRECT QUERY                           SPICE                                │
│   ─────────────                          ─────                                │
│                                                                               │
│   ┌─────────────┐                      ┌─────────────┐                        │
│   │ QuickSight  │                      │ QuickSight  │                        │
│   └──────┬──────┘                      └──────┬──────┘                        │
│          │                                     │                              │
│          │ Query mỗi lần                      │ Query từ cache                │
│          │ refresh                            │ (siêu nhanh!)                 │
│          ▼                                    ▼                               │
│   ┌─────────────┐                      ┌─────────────┐                        │
│   │  Database   │                      │   SPICE     │ ◄── Data được          │
│   │  (chậm)     │                      │  (In-RAM)   │     import trước       │
│   └─────────────┘                      └─────────────┘                        │
│                                                │                              │
│   ❌ Slow với big data                        │ Scheduled refresh             │
│   ❌ Tốn load cho DB                          ▼                               │
│   ✅ Real-time data               ┌─────────────────┐                         │
│                                   │  Actual DB      │                         │
│                                   └─────────────────┘                         │
│                                                                               │
│                                   ✅ Sub-second responses                     │
│                                   ✅ Không load DB                            │
│                                   ⚠️ Data có thể hơi cũ (based on refresh)    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### SPICE Capacity

| Tier | SPICE per user |
|------|----------------|
| **Standard** | 10 GB per author |
| **Enterprise** | 10 GB per author (có thể mua thêm) |
| **Max rows** | 2 billion rows per dataset |

---

## Data Sources

### Supported Data Sources

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      QuickSight Data Sources                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AWS NATIVE                        FILES                                    │
│   ──────────                        ─────                                    │
│   ├── Amazon S3                     ├── CSV, TSV                             │
│   ├── Amazon RDS                    ├── Excel (XLSX)                         │
│   ├── Amazon Redshift               ├── JSON                                 │
│   ├── Amazon Athena                 └── Log files                            │
│   ├── Amazon OpenSearch                                                      │
│   ├── Amazon Timestream             SAAS                                     │
│   └── AWS IoT Analytics             ────                                     │
│                                     ├── Salesforce                           │
│   DATABASES                         ├── Twitter                              │
│   ─────────                         ├── GitHub                               │
│   ├── MySQL                         ├── JIRA                                 │
│   ├── PostgreSQL                    └── ServiceNow                           │
│   ├── MariaDB                                                                │
│   ├── SQL Server                    ON-PREMISES                              │
│   ├── Oracle                        ───────────                              │
│   ├── Snowflake                     └── Any JDBC-compatible                  │
│   ├── Teradata                          database                             │
│   ├── Presto/Trino                                                           │
│   └── Google BigQuery                                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Visualizations

### Các loại Charts

| Category | Chart Types |
|----------|-------------|
| **Comparison** | Bar charts, Stacked bars, Clustered bars |
| **Trend** | Line charts, Area charts, Combo charts |
| **Distribution** | Histograms, Box plots, Scatter plots |
| **Composition** | Pie charts, Donut charts, Tree maps, Sunburst |
| **Relationship** | Scatter plots, Bubble charts, Network graphs |
| **Geospatial** | Maps, Choropleth, Heat maps, Point maps |
| **KPIs** | KPI visuals, Gauges, Sparklines |
| **Tables** | Tables, Pivot tables |
| **Other** | Word clouds, Radar charts, Sankey diagrams |

### Dashboard Components

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      Sample QuickSight Dashboard                              │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌──────────────────────────────────────────────────────────────────────┐    │
│   │  📅 Date Filter: [Last 30 days ▼]    🏢 Region: [All ▼]              │    │
│   └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐    │
│   │   KPI Card    │  │   KPI Card    │  │   KPI Card    │  │  KPI Card   │    │
│   │   Revenue     │  │   Orders      │  │   Users       │  │  Avg Order  │    │
│   │   $1.2M ▲12%  │  │   45,230 ▲8%  │  │   12,500 ▲15% │  │  $26.50 ▼2% │    │
│   └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘    │
│                                                                               │
│   ┌────────────────────────────────────┐  ┌─────────────────────────────┐     │
│   │         Revenue Trend              │  │    Sales by Category        │     │
│   │   📈 Line Chart                    │  │    🥧 Pie Chart             │     │
│   │   ┌──────────────────────┐         │  │    ┌─────────────────┐        │   │
│   │   │    ╱╲                │         │  │    │   ████ 35%      │        │   │
│   │   │   ╱  ╲  ╱╲           │         │  │    │   ████ 28%      │        │   │
│   │   │  ╱    ╲╱  ╲          │         │  │    │   ████ 22%      │        │   │
│   │   └──────────────────────┘         │  │    │   ████ 15%      │        │   │
│   │   Jan  Feb  Mar  Apr  May          │  │    └─────────────────┘        │   │
│   └────────────────────────────────────┘  └─────────────────────────────┘     │
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐     │
│   │                        Sales by Region (Map)                        │     │
│   │   🗺️                                                                │     │
│   │   ┌───────────────────────────────────────────────────────────────┐   │   │
│   │   │     ●●●           ●●                     ●                    │   │   │
│   │   │        ●●●●    ●●●●●●           ●●●●                         │    │   │
│   │   │           ●●●●●                                               │   │   │
│   │   └───────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Amazon Q in QuickSight

**Amazon Q** = Generative AI assistant tích hợp trong QuickSight

### Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Amazon Q in QuickSight                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  User: "Show me top 5 products by revenue last month"               │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  Amazon Q:                                                          │    │
│   │  ┌───────────────────────────────────────────────────────────────┐   │   │
│   │  │  Product          Revenue     Change                          │   │   │
│   │  │  ───────          ───────     ──────                          │   │   │
│   │  │  Product A        $125,000    ▲ 15%                           │   │   │
│   │  │  Product B        $98,500     ▲ 8%                            │   │   │
│   │  │  Product C        $87,200     ▼ 3%                            │   │   │
│   │  │  Product D        $76,800     ▲ 12%                           │   │   │
│   │  │  Product E        $65,000     ▲ 5%                            │   │   │
│   │  └───────────────────────────────────────────────────────────────┘   │   │
│   │                                                                     │    │
│   │  💡 Amazon Q auto-creates visualization từ natural language!        │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   FEATURES:                                                                  │
│   ├── Natural Language Queries - Hỏi bằng tiếng Anh                          │
│   ├── Auto-create Visuals - Tự động tạo charts phù hợp                       │
│   ├── Data Stories - Tự động tạo narrative từ data                           │
│   ├── Anomaly Detection - Phát hiện bất thường                               │
│   ├── Forecasting - Dự báo trends                                            │
│   └── Executive Summaries - Tóm tắt key insights                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Sharing và Embedding

### User Types

| User Type | Capabilities | Pricing |
|-----------|-------------|---------|
| **Author** | Create/edit analyses, dashboards, datasets | Monthly subscription |
| **Reader** | View dashboards, apply filters | Pay-per-session |
| **Admin** | Manage users, settings, capacity | Included with Author |

### Sharing Options

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Sharing & Distribution Options                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INTERNAL SHARING                                                           │
│   ────────────────                                                           │
│   ├── Share với users trong QuickSight account                               │
│   ├── Share với groups                                                       │
│   └── Row-level security (mỗi user thấy data khác nhau)                      │
│                                                                              │
│   SCHEDULED REPORTS                                                          │
│   ─────────────────                                                          │
│   ├── Email reports theo schedule (PDF, CSV, Excel)                          │
│   ├── Subscribe users to dashboards                                          │
│   └── Threshold alerts                                                       │
│                                                                              │
│   EMBEDDING                                                                  │
│   ─────────                                                                  │
│   ├── Embed dashboards vào web apps                                          │
│   ├── Embed Q search bar                                                     │
│   ├── Single-sign-on (SSO)                                                   │
│   └── Custom branding                                                        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │   Your Web Application                                              │    │
│   │   ┌───────────────────────────────────────────────────────────────┐  │   │
│   │   │   Header                                                      │  │   │
│   │   ├───────────────────────────────────────────────────────────────┤ │    │
│   │   │   ┌─────────────────────────────────────────────────────────┐ │  │   │
│   │   │   │         Embedded QuickSight Dashboard                   │ │  │   │
│   │   │   │         (looks native to your app)                      │ │  │   │
│   │   │   └─────────────────────────────────────────────────────────┘ │  │   │
│   │   └───────────────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Pricing

### Pricing Model

| Edition | Author | Reader |
|---------|--------|--------|
| **Standard** | $9/month | N/A (no reader role) |
| **Enterprise** | $18/month | $0.30/session (max $5/month) |

### SPICE Pricing

| Amount | Price |
|--------|-------|
| First 10 GB/user | Included |
| Additional | ~$0.25/GB/month |

### Key Point

> [!TIP]
> **Pay-per-session** cho Readers rất cost-effective! User chỉ trả khi thực sự mở dashboard (max $5/month). Rất phù hợp cho việc share dashboards với nhiều users không thường xuyên dùng.

---

## So sánh với các BI Tools khác

| Feature | QuickSight | Tableau | Power BI |
|---------|------------|---------|----------|
| **Deployment** | Serverless (AWS) | On-prem/Cloud | Cloud/On-prem |
| **AWS Integration** | ✅ Native | Plugin | Plugin |
| **ML/AI Features** | ✅ Built-in | Add-on | Built-in |
| **Pricing** | Pay-per-session | Per user | Per user |
| **SPICE Engine** | ✅ In-memory | Hyper | VertiPaq |
| **Embedding** | ✅ Easy | Complex | Complex |
| **Learning Curve** | Easy | Steep | Medium |

### Khi nào dùng QuickSight?

| Scenario | Recommended? |
|----------|--------------|
| Heavy AWS workload (S3, Redshift, Athena) | ✅ Ideal |
| Need serverless, no infrastructure | ✅ Ideal |
| Pay-per-session pricing model | ✅ Ideal |
| Embed BI into SaaS product | ✅ Ideal |
| Already using Tableau/Power BI | ⚠️ Consider migration effort |
| Need very complex visualizations | ⚠️ Tableau might be better |

---

## Use Cases

### 1. Business Dashboards

```
Marketing team dashboard:
├── Campaign performance metrics
├── Lead conversion funnels
├── Ad spend vs revenue
└── Social media analytics
```

### 2. Operational Monitoring

```
Operations dashboard:
├── Real-time metrics from CloudWatch
├── Application performance
├── Error rates and alerts
└── Resource utilization
```

### 3. Embedded Analytics

```
SaaS product:
├── Customer-facing analytics
├── Usage reports cho customers
├── White-labeled dashboards
└── Self-service reporting
```

### 4. Data Lake Analytics

```
Data lake visualization:
├── S3 data via Athena → QuickSight
├── Ad-hoc analysis
├── Data exploration
└── ML-powered insights
```

---

## Exam Tips

### Key Points for AWS Exams

1. **Serverless BI** - Không cần quản lý servers
2. **SPICE** - In-memory engine cho fast queries
3. **Pay-per-session** - Reader chỉ trả khi dùng (Enterprise)
4. **ML Insights** - Anomaly detection, forecasting built-in
5. **Amazon Q** - Natural language queries (Generative BI)
6. **Embedding** - Dễ dàng embed vào web apps

### Common Exam Scenarios

| Scenario | Answer |
|----------|--------|
| Need BI tool integrated with AWS services | **QuickSight** |
| Visualize data from S3/Athena | **QuickSight** with SPICE |
| Serverless analytics dashboard | **QuickSight** |
| Embed dashboards in customer app | **QuickSight** embedded |
| Pay only when users view reports | **QuickSight** (pay-per-session) |
| Ask questions in natural language | **Amazon Q in QuickSight** |
| Need ML-powered forecasting in BI | **QuickSight** ML Insights |

### Phân biệt với services khác

| Need | Service |
|------|---------|
| Query data từ S3 | Athena |
| Visualize data | QuickSight |
| ETL/Transform data | Glue |
| Data warehouse | Redshift |
| Search & Analytics | OpenSearch |

---

## Liên kết liên quan

- [Amazon Athena](./athena.md)
- [AWS Glue](./aws-glue.md)
- [Amazon Redshift](./redshift.md)
- [Amazon S3](./s3.md)
- [AWS Lake Formation](./lake-formation.md)
