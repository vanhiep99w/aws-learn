# Amazon DocumentDB

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
- [MongoDB Compatibility](#mongodb-compatibility)
- [Cluster Types](#cluster-types)
- [High Availability & Durability](#high-availability--durability)
- [Scaling](#scaling)
- [Security](#security)
- [Pricing](#pricing)
- [DocumentDB vs MongoDB Atlas vs DynamoDB](#documentdb-vs-mongodb-atlas-vs-dynamodb)
- [Use Cases](#use-cases)
- [Key Takeaways](#key-takeaways)

---

## Tổng quan

**Amazon DocumentDB** là fully managed **document database** service tương thích với MongoDB, được thiết kế cho workloads cần lưu trữ, truy vấn và index JSON data.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AMAZON DOCUMENTDB                              │
│                                                                     │
│   "MongoDB-compatible document database, fully managed by AWS"      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ✅ MongoDB API compatible (drivers, tools cũ vẫn work)     │   │
│   │  ✅ Fully managed (không cần quản lý servers)               │   │
│   │  ✅ High availability (replicated 6x across 3 AZs)          │   │
│   │  ✅ Auto storage scaling (up to 128 TiB)                    │   │
│   │  ✅ Encryption at rest và in transit                        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Không phải MongoDB!                                               │
│   └── DocumentDB dùng AWS custom engine (built on Aurora platform)  │
│   └── Compatible với MongoDB API, KHÔNG PHẢI fork MongoDB           │
└─────────────────────────────────────────────────────────────────────┘
```

### Khi nào dùng DocumentDB?

| Scenario | DocumentDB | 
|----------|------------|
| ✅ Ứng dụng MongoDB muốn migrate lên AWS managed | Phù hợp |
| ✅ Cần lưu flexible JSON documents | Phù hợp |
| ✅ Cần scale reads với replicas | Phù hợp |
| ❌ Cần 100% MongoDB feature parity | Dùng MongoDB Atlas |
| ❌ Simple key-value lookups | Dùng DynamoDB |

---

## Kiến trúc

### Cloud-Native Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   DOCUMENTDB ARCHITECTURE                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    COMPUTE LAYER                            │   │
│   │                                                             │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│   │   │   PRIMARY   │  │   REPLICA   │  │   REPLICA   │         │   │
│   │   │  Instance   │  │  Instance   │  │  Instance   │         │   │
│   │   │   (R/W)     │  │   (R only)  │  │   (R only)  │         │   │
│   │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │   │
│   │          │                │                │                │   │
│   │          AZ-1             AZ-2             AZ-3             │   │
│   └──────────┼────────────────┼────────────────┼────────────────┘   │
│              │                │               │                     │
│              └────────────────┼────────────────┘                    │
│                               ▼                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    STORAGE LAYER                            │   │
│   │                 (Distributed, SSD-backed)                   │   │
│   │                                                             │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│   │   │ Copy 1  │ │ Copy 2  │ │ Copy 3  │ │ Copy 4  │           │   │
│   │   │  AZ-1   │ │  AZ-1   │ │  AZ-2   │ │  AZ-2   │ ...       │   │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│   │                                                             │   │
│   │   📦 6 copies of data across 3 AZs                          │   │
│   │   📦 Auto-scales: 10 GB → 128 TiB                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

Tương tự Aurora:
• Compute và Storage TÁCH BIỆT (scale independently)
• Storage layer dùng AWS custom distributed storage
• Storage tự động mở rộng, không cần provision trước
```

---

## MongoDB Compatibility

### Supported MongoDB Versions

```
┌─────────────────────────────────────────────────────────────────────┐
│              MONGODB API COMPATIBILITY                              │
│                                                                     │
│   ┌──────────────────┬───────────────────────────────────────────┐  │
│   │ DocumentDB Ver.  │ MongoDB API Compatibility                 │  │
│   ├──────────────────┼───────────────────────────────────────────┤  │
│   │ DocumentDB 4.0   │ MongoDB 4.0 API                           │  │
│   ├──────────────────┼───────────────────────────────────────────┤  │
│   │ DocumentDB 5.0   │ MongoDB 5.0 API                           │  │
│   │                  │ + Document compression                    │  │
│   │                  │ + Client-side Field Level Encryption      │  │
│   │                  │ + Text search, Partial indexes            │  │
│   ├──────────────────┼───────────────────────────────────────────┤  │
│   │ DocumentDB 8.0   │ MongoDB 8.0 API (+ 6.0, 7.0 support)      │  │
│   │   (NEW 2024)     │ + New query planner (up to 7x faster)     │  │
│   │                  │ + 5x better compression                   │  │
│   │                  │ + Vector search ($vectorSearch)           │  │
│   │                  │ + Collation, Views                        │  │
│   └──────────────────┴───────────────────────────────────────────┘  │
│                                                                     │
│   ⚠️ QUAN TRỌNG:                                                     │
│   • DocumentDB KHÔNG phải MongoDB fork                              │
│   • Một số MongoDB features KHÔNG được support                      │
│   • Test kỹ trước khi migrate!                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Migration từ MongoDB

```
┌─────────────────────────────────────────────────────────────────────┐
│              MIGRATE MONGODB → DOCUMENTDB                           │
│                                                                     │
│   Option 1: mongodump/mongorestore                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  MongoDB ──mongodump──▶ BSON files ──mongorestore──▶ DocDB  │   │
│   │                                                             │   │
│   │  ✅ Simple, familiar tools                                  │   │
│   │  ❌ Downtime required                                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Option 2: AWS DMS (Database Migration Service)                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  MongoDB ──DMS (CDC)──▶ DocumentDB                          │   │
│   │                                                             │   │
│   │  ✅ Near-zero downtime                                      │   │
│   │  ✅ Continuous replication (CDC)                            │   │
│   │  ✅ Supports ongoing sync                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Xem thêm: [aws-dms.md](aws-dms.md)                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cluster Types

### Instance-based Cluster (Standard)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  INSTANCE-BASED CLUSTER                             │
│                                                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│   │   PRIMARY   │  │  REPLICA 1  │  │  REPLICA 2  │  ... up to 15   │
│   │  (writes)   │  │  (reads)    │  │  (reads)    │                 │
│   └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│   Instance Types:                                                   │
│   • db.r6g (Graviton2), db.r8g (Graviton4) ← Recommended            │
│   • db.r5, db.r6i (Intel)                                           │
│   • db.t4g, db.t3 (burstable, dev/test)                             │
│                                                                     │
│   Scaling:                                                          │
│   • Add/remove read replicas (scale reads)                          │
│   • Change instance class (scale up/down compute)                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Elastic Clusters (Serverless-like scaling)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ELASTIC CLUSTERS                                 │
│               (Sharding cho virtually limitless scale)              │
│                                                                     │
│   Khi standard cluster không đủ:                                    │
│   • Millions of writes/second                                       │
│   • Petabytes of data                                               │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │   Shard 1          Shard 2          Shard 3          ...    │   │
│   │   ┌───────────┐   ┌───────────┐   ┌───────────┐             │   │
│   │   │ Primary   │   │ Primary   │   │ Primary   │             │   │
│   │   │ + Replicas│   │ + Replicas│   │ + Replicas│             │   │
│   │   └───────────┘   └───────────┘   └───────────┘             │   │
│   │                                                             │   │
│   │   Data distributed across shards by shard key               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ✅ Virtually unlimited scale                                      │
│   ✅ Automatic shard management                                     │
│   ⚠️ Higher complexity, cost                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## High Availability & Durability

```
┌─────────────────────────────────────────────────────────────────────┐
│              HIGH AVAILABILITY & DURABILITY                         │
│                                                                     │
│   STORAGE DURABILITY:                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  📦 6 copies of data across 3 Availability Zones            │   │
│   │  📦 Designed for 99.999999999% (11 9s) durability           │   │
│   │  📦 Self-healing storage (tự detect/repair corrupt data)    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   AUTOMATIC FAILOVER:                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Primary fails →                                            │   │
│   │      │                                                      │   │
│   │      ▼                                                      │   │
│   │  Replica promoted (60-120 seconds)                          │   │
│   │      │                                                      │   │
│   │      ▼                                                      │   │
│   │  Application reconnects automatically                       │   │
│   │                                                             │   │
│   │  ⚠️ Brief downtime (60-120s) during failover                 │   │
│   │  💡 Use retry logic trong application                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   BACKUPS:                                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Continuous, incremental backups to S3                    │   │
│   │  • Point-in-time recovery (PITR): up to 35 days             │   │
│   │  • Manual snapshots: retain indefinitely                    │   │
│   │  • Cross-region snapshot copy supported                     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   GLOBAL CLUSTERS:                                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Primary Region        Secondary Regions                    │   │
│   │  ┌────────────┐       ┌────────────┐  ┌────────────┐        │   │
│   │  │ R/W Cluster│ ───▶  │ R/O Cluster│  │ R/O Cluster│        │   │
│   │  │ us-east-1  │ async │ eu-west-1  │  │ ap-south-1 │        │   │
│   │  └────────────┘ <1s   └────────────┘  └────────────┘        │   │
│   │                                                             │   │
│   │  ✅ Low latency reads globally                              │   │
│   │  ✅ DR: promote secondary to primary                        │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Scaling

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SCALING OPTIONS                               │
│                                                                     │
│   STORAGE (Auto):                                                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Tự động scale từ 10 GB → 128 TiB                         │   │
│   │  • Không cần provision trước                                │   │
│   │  • Tăng theo increments 10 GB                               │   │
│   │  • ❌ Không thể giảm (shrink)                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   COMPUTE (Manual/Auto):                                            │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Scale UP (vertical):                                       │   │
│   │  • Modify instance class (e.g., db.r6g.large → xlarge)      │   │
│   │  • Brief downtime during modification                       │   │
│   │                                                             │   │
│   │  Scale OUT (horizontal reads):                              │   │
│   │  • Add read replicas (up to 15)                             │   │
│   │  • No downtime                                              │   │
│   │  • Use Reader Endpoint for automatic load balancing         │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ⚠️ Writes chỉ scale VERTICAL (bigger instance)                     │
│   ⚠️ Hoặc dùng Elastic Clusters (sharding) cho extreme scale         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY                                     │
│                                                                     │
│   ENCRYPTION:                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  At Rest:                                                   │   │
│   │  • AES-256 encryption with AWS KMS                          │   │
│   │  • Cluster storage, snapshots, logs đều encrypted           │   │
│   │                                                             │   │
│   │  In Transit:                                                │   │
│   │  • TLS connections (enforced by default)                    │   │
│   │  • Dùng CA certificate từ AWS                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   AUTHENTICATION:                                                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Username/password (stored in cluster)                    │   │
│   │  • AWS Secrets Manager (auto rotation!) ⭐                  │   │
│   │  • IAM Database Authentication ❌ (không support)           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   NETWORK:                                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • VPC only (không public access by default)                │   │
│   │  • Security Groups control access                           │   │
│   │  • VPC Endpoints (PrivateLink) available                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Xem thêm: [aws-secrets-manager.md](aws-secrets-manager.md)        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pricing

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRICING MODEL                                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. INSTANCE HOURS                                          │   │
│   │     • Pay per instance per hour                             │   │
│   │     • On-Demand hoặc Reserved Instances                     │   │
│   │     • Ví dụ: db.r6g.large ~$0.206/hour (US East)            │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  2. STORAGE                                                 │   │
│   │     • $0.10 per GB-month                                    │   │
│   │     • Auto-scaled, pay for what you use                     │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  3. I/O REQUESTS                                            │   │
│   │     Standard: $0.20 per 1 million I/Os                      │   │
│   │     I/O-Optimized: Higher storage cost, unlimited I/O       │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  4. BACKUP STORAGE                                          │   │
│   │     • Free: backup storage ≤ total cluster storage          │   │
│   │     • Excess: $0.021 per GB-month                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   💡 Cost Optimization Tips:                                        │
│   • Use Graviton instances (r6g, r8g) - better price/performance    │
│   • Stop idle clusters (dev/test) - zero compute cost when stopped  │
│   • I/O-Optimized for high I/O workloads                            │
│   • Reserved Instances cho production (save up to 60%)              │
│                                                                     │
│   ⚠️ DocumentDB KHÔNG có Free Tier!                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## DocumentDB vs MongoDB Atlas vs DynamoDB

```
┌─────────────────────────────────────────────────────────────────────┐
│          DOCUMENTDB vs MONGODB ATLAS vs DYNAMODB                    │
│                                                                     │
│   ┌──────────────┬───────────────┬───────────────┬─────────────────┐│
│   │ Feature      │ DocumentDB    │ MongoDB Atlas │ DynamoDB        ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Type         │ Document DB   │ Document DB   │ Key-Value +     ││
│   │              │               │               │ Document        ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ MongoDB      │ Compatible    │ 100% MongoDB  │ ❌ No           ││
│   │ API          │ (subset)      │               │                 ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Query        │ Rich (joins,  │ Very Rich     │ Limited (simple ││
│   │ Flexibility  │ aggregation)  │ (full MongoDB)│ queries, GSI)   ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Scaling      │ Instance +    │ Instance +    │ Unlimited       ││
│   │              │ Elastic Clust.│ Sharding      │ (serverless)    ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Latency      │ ~ms           │ ~ms           │ Single-digit ms ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ AWS          │ Native AWS    │ 3rd party     │ Native AWS      ││
│   │ Integration  │ (full)        │ integration   │ (full)          ││
│   ├──────────────┼───────────────┼───────────────┼─────────────────┤│
│   │ Free Tier    │ ❌ No         │ ✅ Yes        │ ✅ Yes          ││
│   └──────────────┴───────────────┴───────────────┴─────────────────┘│
│                                                                     │
│   WHEN TO USE WHAT:                                                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ DocumentDB: MongoDB apps on AWS, complex queries, need AWS  │   │
│   │             ecosystem integration                           │   │
│   │                                                             │   │
│   │ MongoDB Atlas: Need 100% MongoDB, multi-cloud, advanced     │   │
│   │                MongoDB features (change streams, etc.)      │   │
│   │                                                             │   │
│   │ DynamoDB: Simple access patterns, extreme scale,            │   │
│   │           single-digit millisecond latency, serverless      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Xem thêm: [dynamodb.md](dynamodb.md)                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USE CASES                                      │
│                                                                     │
│   1. CONTENT MANAGEMENT                                             │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Articles, blog posts có flexible schema                  │   │
│   │  • Media metadata                                           │   │
│   │  • User-generated content                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   2. CATALOGS & PROFILES                                            │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Product catalogs (e-commerce)                            │   │
│   │  • User profiles với varying attributes                     │   │
│   │  • Game player profiles                                     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   3. MOBILE & WEB BACKENDS                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • RESTful APIs storing JSON                                │   │
│   │  • Session storage                                          │   │
│   │  • Real-time applications                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   4. MONGODB MIGRATION                                              │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Self-managed MongoDB → DocumentDB                        │   │
│   │  • Want fully managed, AWS-integrated                       │   │
│   │  • Use AWS DMS for migration with minimal downtime          │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KEY TAKEAWAYS FOR EXAM                           │
│                                                                     │
│   ✅ DocumentDB = MongoDB-compatible document database              │
│                                                                     │
│   ✅ NOT MongoDB! (AWS custom engine trên Aurora platform)          │
│                                                                     │
│   ✅ Architecture: 6 copies across 3 AZs (giống Aurora)             │
│                                                                     │
│   ✅ Storage auto-scales: 10 GB → 128 TiB                           │
│                                                                     │
│   ✅ Up to 15 read replicas (scale reads)                           │
│                                                                     │
│   ✅ Failover: 60-120 seconds                                       │
│                                                                     │
│   ✅ MongoDB API compat: 4.0, 5.0, 8.0                              │
│                                                                     │
│   ✅ Encryption: At rest (KMS) + In transit (TLS)                   │
│                                                                     │
│   ✅ VPC only, Security Groups                                      │
│                                                                     │
│   ✅ Migrate từ MongoDB dùng: mongodump/restore hoặc AWS DMS        │
│                                                                     │
│   ⚠️ KHÔNG có Free Tier!                                             │
│                                                                     │
│   ⚠️ KHÔNG support IAM Database Authentication                       │
│                                                                     │
│   ⚠️ Một số MongoDB features KHÔNG được support                      │
│                                                                     │
│   🆚 vs DynamoDB:                                                   │
│      • DocumentDB = Rich queries, MongoDB compatible                │
│      • DynamoDB = Simple queries, extreme scale, serverless         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tiếp theo

- [DynamoDB](dynamodb.md) - NoSQL key-value database
- [Aurora](aurora.md) - High-performance relational database
- [AWS DMS](aws-dms.md) - Database Migration Service
- [AWS Secrets Manager](aws-secrets-manager.md) - Secret rotation for DocumentDB
