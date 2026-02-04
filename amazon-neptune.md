# Amazon Neptune


## Mục lục

- [Tổng quan](#tổng-quan)
- [Graph Database là gì](#graph-database-là-gì)
- [Các loại Graph Models](#các-loại-graph-models)
- [Kiến trúc](#kiến-trúc)
- [Use Cases](#use-cases)
- [So sánh với các Database khác](#so-sánh-với-các-database-khác)
- [Neptune Features](#neptune-features)
- [Neptune Serverless](#neptune-serverless)
- [Neptune ML](#neptune-ml)
- [Exam Tips](#exam-tips)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Amazon Neptune** là **fully managed graph database service** của AWS, được tối ưu cho việc lưu trữ và truy vấn các mối quan hệ phức tạp giữa dữ liệu.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AMAZON NEPTUNE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Định nghĩa ngắn gọn:                                                       │
│   ════════════════════                                                       │
│   • Fully managed GRAPH DATABASE                                             │
│   • Optimized cho highly connected data                                      │
│   • Hỗ trợ cả Property Graph và RDF                                         │
│   • Query bằng Gremlin, SPARQL, hoặc openCypher                             │
│                                                                              │
│   Khi nào dùng?                                                              │
│   ════════════════════                                                       │
│   • Social networks (ai là bạn của ai?)                                     │
│   • Recommendation engines (bạn có thể thích gì?)                           │
│   • Fraud detection (giao dịch nào đáng ngờ?)                               │
│   • Knowledge graphs (entities liên quan thế nào?)                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Graph Database là gì

### Relational vs Graph Database

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  RELATIONAL vs GRAPH DATABASE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  RELATIONAL DATABASE (RDS, Aurora):                                         │
│  ══════════════════════════════════                                         │
│                                                                              │
│  Users Table          Friends Table                                          │
│  ┌────┬───────┐      ┌─────────┬─────────┐                                  │
│  │ ID │ Name  │      │ User_ID │Friend_ID│                                  │
│  ├────┼───────┤      ├─────────┼─────────┤                                  │
│  │ 1  │ Alice │      │    1    │    2    │                                  │
│  │ 2  │ Bob   │      │    1    │    3    │                                  │
│  │ 3  │ Carol │      │    2    │    3    │                                  │
│  └────┴───────┘      └─────────┴─────────┘                                  │
│                                                                              │
│  → Cần JOIN nhiều bảng để tìm relationships                                 │
│  → Slow khi relationships phức tạp                                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GRAPH DATABASE (Neptune):                                                   │
│  ══════════════════════════                                                  │
│                                                                              │
│           ┌───────┐                                                          │
│           │ Alice │                                                          │
│           └───┬───┘                                                          │
│        FRIEND │ FRIEND                                                       │
│          ┌────┴────┐                                                         │
│          ▼         ▼                                                         │
│      ┌───────┐ ┌───────┐                                                    │
│      │  Bob  │─│ Carol │                                                    │
│      └───────┘ └───────┘                                                    │
│           FRIEND                                                             │
│                                                                              │
│  → Relationships là first-class citizens                                    │
│  → Traversal nhanh, không cần JOIN                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Thuật ngữ cơ bản

| Term | Mô tả | Ví dụ |
|------|-------|-------|
| **Node/Vertex** | Entity trong graph | User, Product, Movie |
| **Edge** | Relationship giữa nodes | FRIEND_OF, PURCHASED, RATED |
| **Property** | Attribute của node hoặc edge | name, age, since |
| **Label** | Category của node | Person, Product |

---

## Các loại Graph Models

Neptune hỗ trợ 2 loại graph models:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GRAPH MODELS IN NEPTUNE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. PROPERTY GRAPH                                                           │
│  ═══════════════════                                                         │
│                                                                              │
│  • Query languages: Gremlin, openCypher                                     │
│  • Nodes và edges có properties (key-value pairs)                           │
│  • Phổ biến cho: Social networks, fraud detection                           │
│                                                                              │
│     ┌──────────────┐    PURCHASED     ┌──────────────┐                      │
│     │ User: Alice  │ ───────────────► │ Product: X   │                      │
│     │ age: 30      │    price: $100   │ category: Y  │                      │
│     └──────────────┘                  └──────────────┘                      │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  2. RDF (Resource Description Framework)                                    │
│  ═══════════════════════════════════════                                    │
│                                                                              │
│  • Query language: SPARQL                                                   │
│  • Data stored as triples: Subject - Predicate - Object                    │
│  • Phổ biến cho: Knowledge graphs, semantic web                             │
│                                                                              │
│     Subject          Predicate         Object                               │
│     ────────         ─────────         ──────                               │
│     :Alice           :knows            :Bob                                 │
│     :Alice           :age              30                                   │
│     :Alice           :worksAt          :AWS                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Query Languages

| Model | Query Language | Syntax Style |
|-------|---------------|--------------|
| Property Graph | **Gremlin** | Imperative (step-by-step) |
| Property Graph | **openCypher** | Declarative (like SQL) |
| RDF | **SPARQL** | Declarative |

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NEPTUNE ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ┌─────────────────┐                                │
│                          │   Application   │                                │
│                          └────────┬────────┘                                │
│                                   │                                          │
│                    Gremlin / SPARQL / openCypher                            │
│                                   │                                          │
│                                   ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     NEPTUNE CLUSTER                                  │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │                    PRIMARY INSTANCE                            │  │   │
│   │  │                    (Read/Write)                                │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   │                              │                                       │   │
│   │         ┌────────────────────┼────────────────────┐                 │   │
│   │         ▼                    ▼                    ▼                 │   │
│   │  ┌────────────┐       ┌────────────┐       ┌────────────┐          │   │
│   │  │  Replica   │       │  Replica   │       │  Replica   │          │   │
│   │  │ (Read only)│       │ (Read only)│       │ (Read only)│          │   │
│   │  └────────────┘       └────────────┘       └────────────┘          │   │
│   │         AZ-a                AZ-b                AZ-c                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 SHARED STORAGE (6 copies across 3 AZs)              │   │
│   │                    Auto-scaling up to 128 TB                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Mô tả |
|---------|-------|
| **High Availability** | Multi-AZ, automatic failover |
| **Durability** | 6 copies across 3 AZs |
| **Scalability** | Up to 15 read replicas |
| **Storage** | Auto-scaling up to 128 TB |
| **Backup** | Continuous backup to S3 |
| **Encryption** | At rest (KMS) và in transit (TLS) |

---

## Use Cases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NEPTUNE USE CASES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SOCIAL NETWORKING                                                        │
│  ═════════════════════                                                       │
│                                                                              │
│     "Tìm bạn của bạn của Alice"                                             │
│     "Ai có nhiều connections nhất?"                                         │
│     "Gợi ý kết bạn dựa trên mutual friends"                                 │
│                                                                              │
│  2. RECOMMENDATION ENGINES                                                   │
│  ═══════════════════════════                                                 │
│                                                                              │
│     "Người dùng đã mua X cũng mua Y"                                        │
│     "Movies tương tự mà bạn có thể thích"                                   │
│     "Sản phẩm phổ biến trong network của bạn"                               │
│                                                                              │
│  3. FRAUD DETECTION                                                          │
│  ═══════════════════                                                         │
│                                                                              │
│     "Account này có liên kết với fraud ring không?"                         │
│     "Phát hiện circular transactions"                                       │
│     "Identify suspicious patterns"                                          │
│                                                                              │
│  4. KNOWLEDGE GRAPHS                                                         │
│  ═══════════════════                                                         │
│                                                                              │
│     "Barack Obama là tổng thống của nước nào?"                              │
│     "Các công ty con của Amazon là gì?"                                     │
│     "Semantic search và reasoning"                                          │
│                                                                              │
│  5. NETWORK/IT OPERATIONS                                                    │
│  ═════════════════════════                                                   │
│                                                                              │
│     "Server nào kết nối với server này?"                                    │
│     "Impact analysis khi 1 node down"                                       │
│     "Dependency mapping"                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## So sánh với các Database khác

| Feature | Neptune | DynamoDB | RDS/Aurora | DocumentDB |
|---------|---------|----------|------------|------------|
| **Type** | Graph | Key-Value/Document | Relational | Document |
| **Best for** | Relationships | Simple lookups | Structured data | JSON documents |
| **Query** | Gremlin/SPARQL | PartiQL | SQL | MongoDB API |
| **Joins** | Native traversal | Not supported | Expensive | Limited |
| **Schema** | Flexible | Flexible | Fixed | Flexible |

### Khi nào dùng Neptune vs RDS?

| Scenario | Dùng |
|----------|------|
| Nhiều JOINs phức tạp giữa entities | **Neptune** |
| "Ai biết ai biết ai?" (deep traversal) | **Neptune** |
| Standard CRUD operations | **RDS** |
| Reporting, analytics với SQL | **RDS** |
| Dữ liệu có relationships đơn giản | **RDS** |

---

## Neptune Features

### 1. Neptune Streams

Track changes trong graph database:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NEPTUNE STREAMS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Neptune DB ──► Stream ──► Lambda ──► Downstream processing               │
│                                                                              │
│   Use cases:                                                                 │
│   • Real-time notifications khi data thay đổi                               │
│   • Sync data to other systems (Elasticsearch, etc.)                        │
│   • Audit trail of all changes                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Neptune Notebooks

Jupyter notebooks để explore và visualize graph data.

### 3. Neptune Workbench

Web-based tool để query và visualize graphs.

---

## Neptune Serverless

**Neptune Serverless** tự động scale capacity dựa trên workload:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NEPTUNE SERVERLESS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Capacity                                                                   │
│       ▲                                                                      │
│       │     ____                                                             │
│       │    /    \          Auto-scales up khi load tăng                     │
│       │   /      \    /\                                                    │
│       │  /        \  /  \                                                   │
│       │ /          \/    \____                                              │
│       └──────────────────────────► Time                                     │
│                                                                              │
│   Benefits:                                                                  │
│   • Pay only for what you use                                               │
│   • No capacity planning needed                                             │
│   • Scales to zero when idle (cost savings)                                 │
│   • Instant scaling                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Neptune ML

Sử dụng machine learning trên graph data:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NEPTUNE ML                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Neptune DB ──► SageMaker ──► ML Model ──► Predictions                     │
│                                                                              │
│   Use cases:                                                                 │
│   • Node classification ("User này là fraud không?")                        │
│   • Link prediction ("User này có thể kết bạn với ai?")                     │
│   • Node embeddings for ML                                                   │
│                                                                              │
│   Powered by: Graph Neural Networks (GNN)                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips

### Key Points cần nhớ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXAM TIPS - AMAZON NEPTUNE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Neptune = GRAPH DATABASE                                                 │
│     • Keyword: relationships, connections, graph                            │
│     • KHÔNG phải relational, KHÔNG phải NoSQL document                      │
│                                                                              │
│  2. Query Languages:                                                         │
│     • Gremlin, openCypher (Property Graph)                                  │
│     • SPARQL (RDF)                                                          │
│     • KHÔNG dùng SQL                                                        │
│                                                                              │
│  3. Use Cases:                                                               │
│     • Social networks → "friends of friends"                                │
│     • Fraud detection → "connected to fraud ring?"                          │
│     • Recommendation → "users who bought X also bought Y"                   │
│     • Knowledge graphs → semantic relationships                             │
│                                                                              │
│  4. High Availability:                                                       │
│     • Multi-AZ                                                               │
│     • 6 copies of data across 3 AZs                                         │
│     • Up to 15 read replicas                                                │
│                                                                              │
│  5. Fully Managed:                                                           │
│     • Auto backups                                                           │
│     • Encryption at rest and in transit                                     │
│     • Serverless option available                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sample Exam Questions

| Câu hỏi | Đáp án |
|---------|--------|
| "Database nào tốt nhất cho social network relationships?" | **Neptune** |
| "Cần query 'friends of friends of friends'?" | **Neptune** |
| "Fully managed graph database?" | **Neptune** |
| "Database hỗ trợ Gremlin và SPARQL?" | **Neptune** |
| "Fraud detection với complex relationships?" | **Neptune** |

---

## Tài liệu tham khảo

- [Amazon Neptune Documentation](https://docs.aws.amazon.com/neptune/)
- [Neptune User Guide](https://docs.aws.amazon.com/neptune/latest/userguide/)
- [Graph Data Modeling](https://docs.aws.amazon.com/neptune/latest/userguide/graph-modeling.html)
- [Gremlin Query Language](https://tinkerpop.apache.org/gremlin.html)
