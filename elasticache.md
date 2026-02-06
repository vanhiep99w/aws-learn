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

#### Cluster Mode Disabled

```
┌─────────────────────────────────────────────────────────────────┐
│              Cluster Mode Disabled - Endpoints                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐         ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ Primary │────────►│Replica 1│  │Replica 2│  │Replica 3│     │
│  │  (R/W)  │  Sync   │  (Read) │  │  (Read) │  │  (Read) │     │
│  └────┬────┘         └────┬────┘  └────┬────┘  └────┬────┘     │
│       │                   │            │            │           │
│       ▼                   └────────────┴────────────┘           │
│  Primary Endpoint                      │                        │
│  (writes + reads)              Reader Endpoint                  │
│                            (load-balanced reads)                │
│                                                                  │
│  Endpoints:                                                      │
│  ├── Primary: mycluster.xxx.cache.amazonaws.com                 │
│  └── Reader:  mycluster-ro.xxx.cache.amazonaws.com              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

- **Primary Endpoint** (1): Kết nối đến Primary node → R/W
- **Reader Endpoint** (1): Load-balanced đến **tất cả Replicas** → Read only
- **Replicas hỗ trợ READ** → Scale reads, giảm load cho Primary
- **KHÔNG** scale writes (chỉ có 1 Primary)

#### Cluster Mode Enabled (Sharding)

```
┌─────────────────────────────────────────────────────────────────┐
│              Cluster Mode Enabled - Sharding                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │    Shard 1     │  │    Shard 2     │  │    Shard 3     │    │
│  │   (keys A-G)   │  │   (keys H-N)   │  │   (keys O-Z)   │    │
│  │  ┌──────────┐  │  │  ┌──────────┐  │  │  ┌──────────┐  │    │
│  │  │Primary(RW)│  │  │  │Primary(RW)│  │  │  │Primary(RW)│  │    │
│  │  └────┬─────┘  │  │  └────┬─────┘  │  │  └────┬─────┘  │    │
│  │  ┌────▼─────┐  │  │  ┌────▼─────┐  │  │  ┌────▼─────┐  │    │
│  │  │Replica(R)│  │  │  │Replica(R)│  │  │  │Replica(R)│  │    │
│  │  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│           ▲                  ▲                  ▲               │
│           └──────────────────┼──────────────────┘               │
│                              │                                  │
│                Configuration Endpoint (1)                       │
│              mycluster.xxx.clustercfg.cache.amazonaws.com       │
│                  (auto-route to correct shard)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

- **Configuration Endpoint** (1): Client chỉ cần **1 endpoint**, Redis tự route
- **Multiple Primaries** → **Scale WRITES** (mỗi shard có 1 Primary)
- **Multiple Replicas** → Scale reads
- Data được **hash** và phân chia qua các shards

#### So sánh Cluster Mode

| Feature | Cluster Mode Disabled | Cluster Mode Enabled |
|---------|----------------------|----------------------|
| **Shards** | 1 | 1 - 500 |
| **Write nodes** | 1 Primary only | **Multiple Primaries** |
| **Scale writes** | ❌ | ✅ |
| **Scale reads** | ✅ (Replicas) | ✅ (Replicas) |
| **Max data** | ~310 GB | Multi-TB |
| **Endpoints cần dùng** | 2 (Primary + Reader) | **1** (Configuration) |
| **Replicas per shard** | 0-5 | 0-5 |

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
┌─────────────────────────────────────────────────────────────────┐
│                    Lazy Loading Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CACHE HIT (Fast path):                                          │
│  ┌─────┐    1.GET     ┌───────┐    2.Return     ┌─────┐         │
│  │ App │ ───────────► │ Cache │ ───────────────► │ App │         │
│  └─────┘              └───────┘                  └─────┘         │
│                                                                  │
│  CACHE MISS (Slow path):                                         │
│  ┌─────┐    1.GET     ┌───────┐                                  │
│  │ App │ ───────────► │ Cache │ ── MISS ──┐                      │
│  └──┬──┘              └───────┘           │                      │
│     │                     ▲               ▼                      │
│     │   4.Return          │ 3.SET    ┌────────┐                  │
│     │◄────────────────────┴──────────│   DB   │                  │
│     │                     data       └────────┘                  │
│                                        2.Query                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Chỉ cache data thực sự cần | Cache miss = chậm (3 trips) |
| Tiết kiệm memory | Data có thể stale |
| Node fail không ảnh hưởng app | Initial request luôn chậm |

---

### 2. Write-Through

```
┌─────────────────────────────────────────────────────────────────┐
│                   Write-Through Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WRITE:                                                          │
│  ┌─────┐    1.Write    ┌───────┐    2.Write    ┌────────┐       │
│  │ App │ ────────────► │ Cache │ ────────────► │   DB   │       │
│  └─────┘               └───────┘               └────────┘       │
│                            │                        │            │
│                            └────────────────────────┘            │
│                              Both updated together               │
│                                                                  │
│  READ (always hit):                                              │
│  ┌─────┐    1.GET     ┌───────┐    2.Return                     │
│  │ App │ ───────────► │ Cache │ ───────────► Data (always fresh)│
│  └─────┘              └───────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Cache luôn up-to-date | Write chậm hơn (2 writes) |
| Read không bao giờ miss | Cache data không dùng đến |
| Không có stale data | Tốn memory hơn |

---

### 3. TTL (Time-To-Live)

```
┌─────────────────────────────────────────────────────────────────┐
│                      TTL Flow                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SET with TTL:                                                   │
│  ┌─────┐    SET key "value" EX 3600    ┌───────┐                │
│  │ App │ ─────────────────────────────► │ Cache │                │
│  └─────┘      (expire in 1 hour)       └───────┘                │
│                                             │                    │
│                                             ▼                    │
│  Timeline:                                                       │
│  ──────────────────────────────────────────────────────────►    │
│  │         │                               │                     │
│  t=0       t=30min                         t=60min               │
│  SET       GET (HIT)                       EXPIRED → MISS        │
│            returns "value"                 │                     │
│                                            ▼                     │
│                                    Auto-deleted from cache       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tự động cleanup stale data | Data có thể stale trước TTL |
| Kết hợp được với Lazy Loading | Cần chọn TTL phù hợp |
| Giảm memory usage | TTL quá ngắn = nhiều cache miss |

---

### 4. Write-Around (Cache Invalidation)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Write-Around / Cache Invalidation               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WRITE (invalidate cache):                                       │
│  ┌─────┐                  ┌───────┐                             │
│  │ App │ ── 1.DELETE ───► │ Cache │  (invalidate/xóa cache)     │
│  └──┬──┘                  └───────┘                             │
│     │                                                            │
│     └── 2.Write ──────────────────────► ┌────────┐              │
│                                         │   DB   │              │
│                                         └────────┘              │
│                                                                  │
│  READ (sau đó - Lazy Loading):                                   │
│  ┌─────┐   1.GET    ┌───────┐                                   │
│  │ App │ ─────────► │ Cache │ ── MISS (vì đã bị DELETE)         │
│  └──┬──┘            └───┬───┘                                   │
│     │    4.Return       │ 3.SET (data mới từ DB)                │
│     │◄──────────────────┤                                       │
│     │                   │                                        │
│     └── 2.Query DB ─────┴───────────► ┌────────┐                │
│                                       │   DB   │                │
│                                       └────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tránh cache data không dùng | Read sau write sẽ chậm (miss) |
| Đơn giản, dễ implement | Cần kết hợp với Lazy Loading |
| Tiết kiệm cache memory | Có thể có race condition |

---

### 5. Write-Behind (Write-Back)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Write-Behind Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WRITE (async to DB):                                            │
│  ┌─────┐   1.Write (sync)   ┌───────┐                           │
│  │ App │ ──────────────────► │ Cache │                           │
│  └─────┘    Return fast!    └───┬───┘                           │
│                                 │                                │
│                                 │ 2.Async write (background)     │
│                                 ▼                                │
│                            ┌────────┐                            │
│                            │   DB   │                            │
│                            └────────┘                            │
│                                                                  │
│  Timeline:                                                       │
│  ──────────────────────────────────────────────────────────►    │
│  │              │                      │                         │
│  t=0            t=50ms                 t=100ms                   │
│  Write to       Return to App          Background write to DB   │
│  Cache (sync)   (fast!)                (async, batched)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Write cực nhanh (chỉ write cache) | Có thể mất data nếu cache fail |
| Giảm load cho DB | Phức tạp hơn để implement |
| Có thể batch writes | Data trong DB có thể stale tạm thời |

> [!WARNING]
> **Write-Behind** có risk mất data nếu cache node fail trước khi sync xuống DB. Chỉ dùng khi chấp nhận được eventual consistency.

---

### 6. So sánh Strategies

| Strategy | On Write | On Read | Data Freshness | Best For |
|----------|----------|---------|----------------|----------|
| **Lazy Loading** | - | Miss → Query DB → Cache | Có thể stale | Read-heavy |
| **Write-Through** | Write Cache + DB | Always hit | Luôn fresh | Data quan trọng |
| **Write-Around** | Delete Cache + Write DB | Miss → Lazy load | Fresh khi read | Write-heavy |
| **Write-Behind** | Write Cache only | Always hit | Eventual | High write throughput |
| **TTL** | - | Auto-expire | Controlled | Kết hợp với strategies khác |

> [!TIP]
> **Common Patterns:**
> - **Read-heavy apps**: Lazy Loading + TTL
> - **Write-heavy apps**: Write-Around + Lazy Loading
> - **Real-time apps**: Write-Through
> - **High throughput**: Write-Behind (cẩn thận với data loss)

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
