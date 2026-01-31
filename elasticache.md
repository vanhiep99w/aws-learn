# Amazon ElastiCache


## Mục lục

- [Tổng quan](#tổng-quan)
- [Tại sao cần Cache?](#tại-sao-cần-cache)
- [Hai loại Engine](#hai-loại-engine)
- [ElastiCache for Redis - Chi tiết](#elasticache-for-redis-chi-tiết)
- [ElastiCache for Memcached - Chi tiết](#elasticache-for-memcached-chi-tiết)
- [Use Cases](#use-cases)
- [ElastiCache Serverless (2024)](#elasticache-serverless-2024)
- [Security](#security)
- [Caching Strategies](#caching-strategies)
- [Pricing](#pricing)
- [So sánh với các Caching Options khác](#so-sánh-với-các-caching-options-khác)
- [Exam Tips cho Cloud Practitioner](#exam-tips-cho-cloud-practitioner)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**Amazon ElastiCache** là dịch vụ **in-memory caching** được quản lý hoàn toàn, giúp tăng tốc ứng dụng bằng cách lưu trữ data trong RAM thay vì disk.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Amazon ElastiCache                            │
│        "Managed In-Memory Caching for Microsecond Latency"       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Application ────► ElastiCache ────► Database                  │
│       │                  │                 │                     │
│       │                  │                 │                     │
│       │     Cache Hit    │                 │                     │
│       │◄─────────────────│                 │                     │
│       │   (microseconds) │                 │                     │
│       │                  │   Cache Miss    │                     │
│       │                  │────────────────►│                     │
│       │                  │  Query DB       │                     │
│       │                  │◄────────────────│                     │
│       │                  │  Store in cache │                     │
│                                                                  │
│   Latency: Database ~ms → ElastiCache ~µs (1000x faster)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tại sao cần Cache?

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vấn đề & Giải pháp                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VẤN ĐỀ:                                                        │
│  ├── Database bị overload (quá nhiều queries)                  │
│  ├── Response time chậm (đọc từ disk mất thời gian)            │
│  └── Cost cao (RDS scale up = tốn tiền)                        │
│                                                                  │
│  GIẢI PHÁP - CACHING:                                           │
│  ├── Lưu data hay đọc vào RAM (ElastiCache)                    │
│  ├── Đọc từ cache thay vì DB → nhanh 1000x                     │
│  └── Giảm load cho DB → tiết kiệm chi phí                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ đời thường:**
> Bạn hay uống cà phê mỗi sáng. Thay vì đi cafe 2km mỗi ngày (= query database), bạn mua máy pha cà phê để ở nhà (= cache). Nhanh hơn và tiện hơn!

---

## Hai loại Engine

ElastiCache hỗ trợ **2 engines**:

| Feature | Redis | Memcached |
|---------|-------|-----------|
| **Data Types** | Strings, Lists, Sets, Hashes, Sorted Sets, Streams, Geospatial | Chỉ Key-Value (Strings) |
| **Persistence** | ✅ Có (snapshots, AOF) | ❌ Không (mất khi restart) |
| **High Availability** | ✅ Multi-AZ Auto-Failover | ❌ Không có |
| **Replication** | ✅ Read Replicas | ❌ Không |
| **Pub/Sub** | ✅ Có | ❌ Không |
| **Multi-threading** | Single-threaded | ✅ Multi-threaded |
| **Scaling** | Cluster Mode (up to 500 nodes) | Up to 20 nodes |
| **Use case** | Production, HA, complex data | Simple caching, large objects |

### Chọn cái nào?

```
┌─────────────────────────────────────────────────────────────────┐
│                 Redis vs Memcached - Chọn gì?                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Chọn REDIS (95% cases) khi:                                    │
│  ├── Cần High Availability (Multi-AZ Failover)                 │
│  ├── Cần backup/persistence (data quan trọng)                  │
│  ├── Cần complex data types (lists, sets, sorted sets)         │
│  ├── Cần Pub/Sub (real-time messaging)                         │
│  └── Cần Read Replicas (scale reads)                           │
│                                                                  │
│  Chọn MEMCACHED khi:                                             │
│  ├── Chỉ cần simple key-value caching                          │
│  ├── Data có thể mất (sẽ query lại từ DB)                      │
│  ├── Multi-threaded (large objects, high concurrency)          │
│  └── Legacy application đã dùng Memcached                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Mặc định:**, chọn **Redis** cho hầu hết use cases. Memcached chỉ dùng khi có lý do cụ thể.

---

## ElastiCache for Redis - Chi tiết

### Architecture

```
                         ┌──────────────────────────────────────┐
                         │             Region                    │
                         │                                       │
                         │  ┌─────────────────────────────────┐ │
                         │  │        ElastiCache Cluster       │ │
                         │  │                                  │ │
    Application ─────────┼──┼──►┌─────────┐    ┌─────────┐    │ │
                         │  │   │ Primary │───►│ Replica │    │ │
                         │  │   │  (AZ-a) │    │  (AZ-b) │    │ │
                         │  │   │  R/W    │    │   Read  │    │ │
                         │  │   └─────────┘    └─────────┘    │ │
                         │  │        │              ▲          │ │
                         │  │        │   Auto       │          │ │
                         │  │        └───Failover───┘          │ │
                         │  └─────────────────────────────────┘ │
                         └──────────────────────────────────────┘
```

### Cluster Mode

| Mode | Mô tả | Max Data |
|------|-------|----------|
| **Cluster Mode Disabled** | 1 primary + up to 5 replicas | ~310 GB |
| **Cluster Mode Enabled** | Multiple shards, mỗi shard có primary + replicas | Up to 500 nodes, multi-TB |

### Data Types trong Redis

```
┌─────────────────────────────────────────────────────────────────┐
│                    Redis Data Types                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  String:    "user:123" → "John Doe"                             │
│  List:      "queue:tasks" → [task1, task2, task3]               │
│  Set:       "tags:post:1" → {aws, cloud, devops}                │
│  Hash:      "user:123" → {name: "John", email: "john@email.com"}│
│  Sorted Set: "leaderboard" → {(user1, 1000), (user2, 950)}      │
│  Stream:    Real-time event streaming                           │
│  Geospatial: Location-based queries (find nearby)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ElastiCache for Memcached - Chi tiết

### Architecture

```
                         ┌──────────────────────────────────────┐
                         │             Region                    │
                         │                                       │
                         │  ┌─────────────────────────────────┐ │
                         │  │     Memcached Cluster            │ │
                         │  │                                  │ │
    Application ─────────┼──┼──►┌─────┐ ┌─────┐ ┌─────┐       │ │
        │                │  │   │Node1│ │Node2│ │Node3│       │ │
        │                │  │   │ AZ-a│ │ AZ-b│ │ AZ-c│       │ │
        │                │  │   └─────┘ └─────┘ └─────┘       │ │
        │                │  │      ▲       ▲       ▲           │ │
        │                │  │      └───────┴───────┘           │ │
        └────────────────┼──┼──── App phân phối data           │ │
                         │  │     (client-side sharding)       │ │
                         │  └─────────────────────────────────┘ │
                         └──────────────────────────────────────┘
```

**Đặc điểm:**
- Không có replication (nếu 1 node fail → mất data của node đó)
- Application tự hash key để chọn node
- Scale out bằng cách thêm nodes

---

## Use Cases

### 1. Database Caching (Read-Through)

```
┌─────────────────────────────────────────────────────────────────┐
│              Database Query Caching                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User request → Check cache → Cache HIT? → Return immediately   │
│                      │                                           │
│                      └── Cache MISS? → Query DB → Store in cache│
│                                                                  │
│  Example:                                                        │
│  key: "user:123"                                                 │
│  value: {"name": "John", "email": "john@email.com"}             │
│  TTL: 3600 seconds (1 hour)                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Session Store

```
┌─────────────────────────────────────────────────────────────────┐
│                    Session Management                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Vấn đề: Nhiều EC2 instances, làm sao share session?            │
│                                                                  │
│      EC2-1 ──┐                                                   │
│              │                                                   │
│      EC2-2 ──┼──► ElastiCache (Redis) ←── Lưu sessions          │
│              │         │                                         │
│      EC2-3 ──┘         │                                         │
│                        ▼                                         │
│           session:abc123 → {user_id: 123, cart: [...]}          │
│                                                                  │
│  Benefits: Stateless EC2s, sessions persist qua failover        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Real-time Leaderboard

```
Redis Sorted Set:
  ZADD leaderboard 1000 "player1"
  ZADD leaderboard 950 "player2"
  ZADD leaderboard 1200 "player3"

  ZREVRANGE leaderboard 0 9  → Top 10 players
```

### 4. Pub/Sub Messaging

```
Channel: "notifications"
├── Publisher: API Server
└── Subscribers: WebSocket servers → Push to clients

Real-time notifications, chat messages, live updates
```

### 5. Rate Limiting

```
key: "rate:user:123:api:get"
value: count of requests
TTL: 60 seconds

If count > 100 → Return 429 Too Many Requests
```

---

## ElastiCache Serverless (2024)

AWS giờ có **Serverless option** cho cả Redis và Memcached:

```
┌─────────────────────────────────────────────────────────────────┐
│               ElastiCache Serverless                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Auto-scaling (không cần chọn node type)                     │
│  ✅ Pay per use (GB-hours + ECPUs)                              │
│  ✅ Multi-AZ by default                                          │
│  ✅ Không cần quản lý capacity                                   │
│                                                                  │
│  Best for: Variable workloads, không muốn manage cluster        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security

### Encryption

| Type | Description |
|------|-------------|
| **At-rest encryption** | Data encrypted trên disk (Redis snapshots) |
| **In-transit encryption** | TLS/SSL giữa app và ElastiCache |

### Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                  Security Configuration                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. VPC & Security Groups                                        │
│     └── ElastiCache trong VPC, private subnets                  │
│     └── Security Group cho phép port 6379 (Redis)               │
│                                                                  │
│  2. Authentication                                               │
│     └── Redis AUTH (password)                                   │
│     └── Redis ACL (user-level permissions)                      │
│     └── IAM Authentication (Redis 7.0+)                         │
│                                                                  │
│  3. Subnet Groups                                                │
│     └── Define which subnets ElastiCache can use               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Caching Strategies

### 1. Lazy Loading (Cache-Aside)

```
Read:
1. Check cache
2. If MISS → Query DB → Store in cache → Return
3. If HIT → Return from cache

Pros: Only cache what's needed
Cons: Cache miss = slow (3 trips)
```

### 2. Write-Through

```
Write:
1. Write to DB
2. Write to cache (immediately)

Pros: Cache always up-to-date
Cons: Write penalty, unused data cached
```

### 3. TTL (Time-To-Live)

```
SET user:123 "John" EX 3600  (expire in 1 hour)

- Ensures stale data is eventually removed
- Balance between freshness and performance
```

---

## Pricing

| Component | Redis | Memcached |
|-----------|-------|-----------|
| **Node pricing** | Per node-hour | Per node-hour |
| **Smallest node** | cache.t4g.micro (~$12/month) | cache.t4g.micro (~$12/month) |
| **Reserved** | Up to 55% discount | Up to 55% discount |
| **Serverless** | GB-hours + ECPUs | GB-hours + ECPUs |

---

## So sánh với các Caching Options khác

| Option | Managed | Use Case |
|--------|---------|----------|
| **ElastiCache Redis** | ✅ | Production, HA, complex features |
| **ElastiCache Memcached** | ✅ | Simple caching, multi-threaded |
| **DynamoDB DAX** | ✅ | DynamoDB-specific caching |
| **CloudFront** | ✅ | Edge caching (CDN) |
| **Self-managed Redis** | ❌ | Full control (EC2) |

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ ElastiCache:**
> - **In-memory caching** → Microsecond latency
> - **Redis** = HA, persistence, complex data types (chọn mặc định)
> - **Memcached** = Simple, multi-threaded, no persistence
> - Reduce database load, improve performance

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Service nào cho in-memory caching? | **ElastiCache** |
| Redis hay Memcached cho HA? | **Redis** (Multi-AZ Failover) |
| Redis hay Memcached cho persistence? | **Redis** (snapshots, AOF) |
| Lưu session data cho multiple EC2s? | **ElastiCache (Redis)** |
| Cần Pub/Sub messaging? | **Redis** |
| Simple key-value, có thể mất data? | **Memcached** |

### So sánh nhanh Redis vs Memcached

```
┌─────────────────────────┬─────────────────────────────────────┐
│         Redis           │           Memcached                  │
├─────────────────────────┼─────────────────────────────────────┤
│ Complex data types      │ Only strings                        │
│ Persistence (backup)    │ No persistence                      │
│ Multi-AZ Failover       │ No failover                         │
│ Read Replicas           │ No replication                      │
│ Pub/Sub                 │ No Pub/Sub                          │
│ Single-threaded         │ Multi-threaded                      │
│ 95% use cases           │ 5% use cases                        │
└─────────────────────────┴─────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                 Amazon ElastiCache Summary                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Managed in-memory caching (Redis / Memcached)               │
│  ✅ Microsecond latency (1000x faster than database)            │
│  ✅ Reduce database load                                         │
│  ✅ Session store, leaderboards, real-time apps                 │
│                                                                  │
│  Redis (95% cases):                                              │
│  ├── HA with Multi-AZ Failover                                  │
│  ├── Persistence (snapshots, AOF)                               │
│  ├── Complex data types                                          │
│  └── Pub/Sub, Read Replicas                                      │
│                                                                  │
│  Memcached (5% cases):                                           │
│  ├── Simple key-value                                            │
│  ├── Multi-threaded                                              │
│  └── No persistence, no HA                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
