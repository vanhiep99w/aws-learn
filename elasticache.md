# Amazon ElastiCache


## Mục lục

- [Tổng quan](#tổng-quan)
- [Tại sao cần Cache?](#tại-sao-cần-cache)
- [Hai loại Engine](#hai-loại-engine)
- [ElastiCache for Redis - Chi tiết](#elasticache-for-redis-chi-tiết)
- [Redis Multi-AZ và Automatic Failover](#redis-multi-az-và-automatic-failover)
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
┌──────────────────────────────────────────────────────────────────┐
│                    Amazon ElastiCache                            │
│        "Managed In-Memory Caching for Microsecond Latency"       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Application ────► ElastiCache ────► Database                   │
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
│   Latency: Database ~ms → ElastiCache ~µs (1000x faster)         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tại sao cần Cache?

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vấn đề & Giải pháp                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VẤN ĐỀ:                                                        │
│  ├── Database bị overload (quá nhiều queries)                   │
│  ├── Response time chậm (đọc từ disk mất thời gian)             │
│  └── Cost cao (RDS scale up = tốn tiền)                         │
│                                                                 │
│  GIẢI PHÁP - CACHING:                                           │
│  ├── Lưu data hay đọc vào RAM (ElastiCache)                     │
│  ├── Đọc từ cache thay vì DB → nhanh 1000x                      │
│  └── Giảm load cho DB → tiết kiệm chi phí                       │
│                                                                 │
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
│                 Redis vs Memcached - Chọn gì?                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Chọn REDIS (95% cases) khi:                                    │
│  ├── Cần High Availability (Multi-AZ Failover)                  │
│  ├── Cần backup/persistence (data quan trọng)                   │
│  ├── Cần complex data types (lists, sets, sorted sets)          │
│  ├── Cần Pub/Sub (real-time messaging)                          │
│  └── Cần Read Replicas (scale reads)                            │
│                                                                 │
│  Chọn MEMCACHED khi:                                            │
│  ├── Chỉ cần simple key-value caching                           │
│  ├── Data có thể mất (sẽ query lại từ DB)                       │
│  ├── Multi-threaded (large objects, high concurrency)           │
│  └── Legacy application đã dùng Memcached                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Mặc định:**, chọn **Redis** cho hầu hết use cases. Memcached chỉ dùng khi có lý do cụ thể.

---

## ElastiCache for Redis - Chi tiết

### Architecture

```
                        ┌───────────────────────────────────────┐
                        │             Region                    │
                        │                                       │
                        │  ┌─────────────────────────────────┐  │
                        │  │      ElastiCache Cluster        │  │
                        │  │                                 │  │
   Application ─────────┼──┼──►┌─────────┐  ┌─────────┐      │  │
                        │  │   │ Primary │─►│ Replica │      │  │
                        │  │   │  (AZ-a) │  │  (AZ-b) │      │  │
                        │  │   │  R/W    │  │   Read  │      │  │
                        │  │   └─────────┘  └─────────┘      │  │
                        │  │        │            ▲           │  │
                        │  │        │   Auto     │           │  │
                        │  │        └──Failover──┘           │  │
                        │  └─────────────────────────────────┘  │
                        └───────────────────────────────────────┘
```

### Cluster Mode

| Mode | Mô tả | Max Data |
|------|-------|----------|
| **Cluster Mode Disabled** | 1 primary + up to 5 replicas | ~310 GB |
| **Cluster Mode Enabled** | Multiple shards, mỗi shard có primary + replicas | Up to 500 nodes, multi-TB |

#### Cluster Mode Disabled

```
┌─────────────────────────────────────────────────────────────────┐
│              Cluster Mode Disabled - Endpoints                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐         ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Primary │────────►│Replica 1│  │Replica 2│  │Replica 3│      │
│  │  (R/W)  │  Async  │  (Read) │  │  (Read) │  │  (Read) │      │
│  └────┬────┘         └────┬────┘  └────┬────┘  └────┬────┘      │
│       │                   │            │            │           │
│       ▼                   └────────────┴────────────┘           │
│  Primary Endpoint                      │                        │
│  (writes + reads)              Reader Endpoint                  │
│                            (load-balanced reads)                │
│                                                                 │
│  Endpoints:                                                     │
│  ├── Primary: mycluster.xxx.cache.amazonaws.com                 │
│  └── Reader:  mycluster-ro.xxx.cache.amazonaws.com              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Primary Endpoint** (1): Kết nối đến Primary node → R/W
- **Reader Endpoint** (1): Load-balanced đến **tất cả Replicas** → Read only
- **Replicas hỗ trợ READ** → Scale reads, giảm load cho Primary
- **KHÔNG** scale writes (chỉ có 1 Primary)

#### Cluster Mode Enabled (Sharding)

```
┌─────────────────────────────────────────────────────────────────┐
│              Cluster Mode Enabled - Sharding                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │    Shard 1     │  │    Shard 2     │  │    Shard 3     │     │
│  │   (keys A-G)   │  │   (keys H-N)   │  │   (keys O-Z)   │     │
│  │  ┌───────────┐ │  │  ┌───────────┐ │  │  ┌───────────┐ │     │
│  │  │Primary(RW)│ │  │  │Primary(RW)│ │  │  │Primary(RW)│ │     │
│  │  └────┬──────┘ │  │  └────┬──────┘ │  │  └────┬──────┘ │     │
│  │  ┌────▼─────┐  │  │  ┌────▼─────┐  │  │  ┌────▼─────┐  │     │
│  │  │Replica(R)│  │  │  │Replica(R)│  │  │  │Replica(R)│  │     │ 
│  │  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
│           ▲                  ▲                  ▲               │
│           └──────────────────┼──────────────────┘               │
│                              │                                  │
│                Configuration Endpoint (1)                       │
│              mycluster.xxx.clustercfg.cache.amazonaws.com       │
│                  (auto-route to correct shard)                  │
│                                                                 │
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

---

## Redis Multi-AZ và Automatic Failover

### Vấn đề: cache cũng cần HA, không chỉ database

ElastiCache Redis thường nằm giữa application và database:

```
Application ──► ElastiCache Redis ──► RDS / Aurora / DynamoDB
                 (hot path)
```

Nếu Redis primary node bị lỗi:

- App có thể không ghi/read cache được trong một khoảng thời gian
- Database phía sau bị dồn traffic vì cache miss tăng mạnh
- Latency tăng, user experience giảm
- Nếu Redis đang giữ session, leaderboard, queue nhẹ, token, rate-limit counter... thì mất cache có thể ảnh hưởng trực tiếp tới business flow

Vì vậy, production Redis không nên chỉ có 1 node. Cấu hình chuẩn là **replication group** có **primary + read replicas**, đặt ở nhiều AZ, và bật **Multi-AZ with automatic failover**.

---

### Multi-AZ with Automatic Failover là gì?

**Multi-AZ with automatic failover** cho ElastiCache Redis/Valkey nghĩa là:

1. Có ít nhất 1 **primary node** nhận write.
2. Có ít nhất 1 **read replica** ở AZ khác.
3. Redis replication chạy từ primary sang replica.
4. Khi primary lỗi, ElastiCache tự động chọn replica phù hợp nhất để promote thành primary mới.
5. ElastiCache cập nhật DNS của **primary endpoint**, nên application thường không cần đổi endpoint.

```
Trước sự cố:

┌───────────── AZ-a ─────────────┐      ┌───────────── AZ-b ─────────────┐
│  Primary Redis                 │─────►│  Read Replica                  │
│  Read + Write                  │Async │  Read only                     │
└──────────────┬────────────────┘      └────────────────────────────────┘
               │
               ▼
      Primary Endpoint
      myredis.xxxxxx.cache.amazonaws.com

Sau khi Primary fail:

┌───────────── AZ-a ─────────────┐      ┌───────────── AZ-b ─────────────┐
│  Failed primary                │      │  Promoted Primary              │
│  offline                       │      │  Read + Write                  │
└────────────────────────────────┘      └──────────────┬────────────────┘
                                                        │
                                                        ▼
                                             Primary Endpoint trỏ sang node mới
```

AWS mô tả trực tiếp rằng khi bật Multi-AZ, downtime được giảm thiểu vì primary tự động fail over sang read replica:

> "This replacement results in some downtime for the cluster, but if Multi-AZ is enabled, the downtime is minimized. The role of primary node will automatically fail over to one of the read replicas."
>
> *→ Việc thay primary có gây downtime cho cluster, nhưng nếu bật Multi-AZ thì downtime được giảm thiểu. Vai trò primary node sẽ tự động fail over sang một read replica.*

---

### Failover diễn ra như thế nào?

Khi **chỉ primary node fail**, ElastiCache thực hiện flow sau:

| Bước | ElastiCache làm gì | Ý nghĩa |
|------|---------------------|---------|
| 1 | Đưa primary lỗi ra khỏi service | Ngăn app ghi vào node lỗi |
| 2 | Chọn read replica có **replication lag thấp nhất** | Giảm data loss |
| 3 | Promote replica đó thành primary mới | App có nơi nhận write mới |
| 4 | Propagate DNS name tới primary endpoint | App không cần đổi connection string |
| 5 | Tạo replacement replica ở AZ của primary cũ | Khôi phục topology HA |
| 6 | Các replica sync lại với primary mới | Cluster ổn định trở lại |

AWS ghi rõ:

> "If only the primary node fails, the read replica with the least replication lag is promoted to primary."
>
> *→ Nếu chỉ primary node lỗi, read replica có replication lag thấp nhất sẽ được promote thành primary.*

Và sau khi promote:

> "Writes can resume as soon as the promotion process is complete, typically just a few seconds."
>
> *→ Write có thể tiếp tục ngay khi quá trình promote hoàn tất, thường chỉ vài giây.*

---

### Read Replicas khác gì Multi-AZ Automatic Failover?

Đây là bẫy thi rất phổ biến.

| Tiêu chí | Chỉ thêm Read Replicas | Multi-AZ + Automatic Failover |
|----------|-------------------------|-------------------------------|
| Có bản sao dữ liệu | ✅ Có | ✅ Có |
| Scale read traffic | ✅ Có | ✅ Có |
| Replica đặt ở AZ khác | ✅ Có thể | ✅ Nên có / cần cho HA |
| Tự promote replica khi primary fail | ❌ Không đảm bảo nếu không bật automatic failover | ✅ Có |
| Tự cập nhật primary endpoint | ❌ Không phải trọng tâm của option | ✅ Có |
| Giảm downtime khi primary fail | ⚠️ Một phần, nhưng cần thao tác failover | ✅ Mục tiêu chính |
| Đáp án exam khi hỏi "minimal downtime" | ❌ Thường chưa đủ | ✅ Chọn |

**Rule nhớ:**

> **Read Replica = có bản sao + scale reads.**  
> **Multi-AZ Automatic Failover = có bản sao + tự động thay primary khi lỗi.**

Nếu đề hỏi **high availability**, **minimal downtime**, **automatic failover**, **disaster recovery cho Redis primary** → chọn **Multi-AZ with automatic failover**, không chỉ chọn “add read replicas”.

---

### Data loss: có mất dữ liệu không?

Có thể mất **một lượng nhỏ dữ liệu** nếu primary fail trước khi dữ liệu replicate sang replica.

Lý do: Redis/Valkey replication trong ElastiCache là **asynchronous**.

> "Valkey and Redis OSS replication is asynchronous. Therefore, when a primary node fails over to a replica, a small amount of data might be lost due to replication lag."
>
> *→ Replication của Valkey và Redis OSS là bất đồng bộ. Vì vậy, khi primary fail over sang replica, một lượng nhỏ dữ liệu có thể mất do replication lag.*

Vì vậy:

- Multi-AZ automatic failover giúp **minimal data loss**, không phải **zero data loss**.
- ElastiCache giảm rủi ro bằng cách chọn replica có **least replication lag**.
- Nếu workload yêu cầu transactional durability tuyệt đối, Redis cache không phải nơi lưu bản ghi nguồn duy nhất; database bền vững như RDS/Aurora/DynamoDB mới nên là source of truth.

---

### Backup/Snapshot có thay thế Multi-AZ không?

**Không.** Backup dùng cho restore, không phải failover real-time.

| Cơ chế | Dùng để làm gì | RTO/RPO |
|--------|----------------|---------|
| **Multi-AZ Automatic Failover** | Primary lỗi → promote replica để app tiếp tục chạy | RTO thấp, thường vài giây; RPO thấp nhưng có thể mất ít data do lag |
| **Automatic Backups / Snapshots** | Restore cache mới từ backup | RTO cao hơn vì phải tạo/restore cache; RPO phụ thuộc backup gần nhất |
| **Manual Backup** | Backup trước thay đổi lớn, migration, archive | Không xử lý failover tự động |

AWS mô tả automatic backups là tạo backup hằng ngày và restore cache mới khi có failure:

> "When automatic backups are enabled, ElastiCache creates a backup of the cache on a daily basis."
>
> *→ Khi bật automatic backups, ElastiCache tạo backup cache hằng ngày.*

> "In the event of a failure, you can create a new cache, restoring your data from the most recent backup."
>
> *→ Khi xảy ra sự cố, bạn có thể tạo cache mới và restore dữ liệu từ backup gần nhất.*

Backup vẫn quan trọng, nhưng nó trả lời câu hỏi **"khôi phục dữ liệu sau sự cố"**, không trả lời câu hỏi **"làm sao downtime thấp nhất khi primary chết"**.

---

### AOF và Multi-AZ: đừng chọn nhầm

Redis có cơ chế persistence gọi là **append-only file (AOF)**, nhưng với ElastiCache Redis OSS, **AOF và Multi-AZ loại trừ lẫn nhau**.

AWS ghi rõ:

> "ElastiCache for Redis OSS Multi-AZ and append-only file (AOF) are mutually exclusive. If you enable one, you can't enable the other."
>
> *→ ElastiCache for Redis OSS Multi-AZ và append-only file (AOF) loại trừ lẫn nhau. Nếu bật một cái thì không thể bật cái còn lại.*

Do đó, nếu đề hỏi:

- minimal downtime
- automatic failover
- high availability
- disaster recovery cho Redis primary

thì **không chọn AOF**. Chọn **Multi-AZ with automatic failover**.

---

### Failure scenarios cần nhớ

| Scenario | ElastiCache Multi-AZ xử lý thế nào | Data impact |
|----------|-------------------------------------|-------------|
| Chỉ primary fail | Promote replica có lag thấp nhất thành primary | Có thể mất ít data do async replication |
| Primary + một số replica fail | Promote replica còn sống có lag thấp nhất | Có thể mất nhiều hơn nếu replica còn lại lag |
| Toàn bộ cluster fail | Recreate nodes cùng AZ ban đầu | Data trong cluster mất; cần restore từ backup nếu cần |
| Customer reboot primary | Không trigger automatic failover theo tài liệu AWS | Cẩn thận vì có thể gây data loss |

> [!WARNING]
> Multi-AZ giảm downtime khi node/AZ failure, nhưng không thay thế backup. Production Redis nên có cả **Multi-AZ automatic failover** cho HA và **automatic backups** cho restore/warm start.

---

### Cấu hình tối thiểu để bật Multi-AZ

Theo AWS:

- Multi-AZ chỉ hỗ trợ Redis OSS/Valkey cluster có **nhiều hơn 1 node trong mỗi shard**.
- Cluster mode disabled cần có ít nhất **1 available read replica**.
- Multi-AZ chỉ tự động enable nếu cluster có ít nhất một replica ở **AZ khác primary** trong mọi shard.
- Redis OSS Multi-AZ không hỗ trợ T1 node types.

Ví dụ AWS CLI bật Multi-AZ + automatic failover cho replication group có sẵn replica:

```bash
aws elasticache modify-replication-group \
  --replication-group-id redis12 \
  --automatic-failover-enabled \
  --multi-az-enabled \
  --apply-immediately
```

---

### Exam pattern

| Keyword trong đề | Nên nghĩ tới |
|------------------|--------------|
| Redis + minimal downtime | **Multi-AZ with automatic failover** |
| Redis + primary node failure | **Automatic failover promote replica** |
| Redis + reduce read load | **Read replicas / reader endpoint** |
| Redis + restore from point-in-time/snapshot | **Automatic/manual backups** |
| Redis + low RPO/RTO | **Multi-AZ + backups**, nhưng đáp án realtime HA là Multi-AZ |
| Redis + AOF + HA | Cẩn thận: **AOF không thay Multi-AZ** |

**Câu hỏi mẫu:**

> Công ty dùng ElastiCache Redis trước RDS, cần DR cho caching layer với minimal downtime, minimal data loss, good performance. Chọn gì?

✅ **Đáp án:** Enable **Multi-AZ with automatic failover**.  
❌ Không chọn “chỉ thêm read replicas” vì thiếu automatic promotion.  
❌ Không chọn daily backups vì đó là restore, không phải failover realtime.  
❌ Không chọn AOF vì không phù hợp với Multi-AZ và không giải quyết automatic failover.

---

### Nguồn AWS chính thức

- [Minimizing downtime in ElastiCache by using Multi-AZ with Valkey and Redis OSS](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/AutoFailover.html)
- [Minimizing downtime with Multi-AZ](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/multi-az.html)
- [High availability using replication groups](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Replication.html)
- [Scheduling automatic backups](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/backups-automatic.html)
- [Snapshot and restore](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/backups.html)

---

### Data Types trong Redis

```
┌─────────────────────────────────────────────────────────────────┐
│                    Redis Data Types                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  String:    "user:123" → "John Doe"                             │
│  List:      "queue:tasks" → [task1, task2, task3]               │
│  Set:       "tags:post:1" → {aws, cloud, devops}                │
│  Hash:      "user:123" → {name: "John", email: "john@email.com"}│
│  Sorted Set: "leaderboard" → {(user1, 1000), (user2, 950)}      │
│  Stream:    Real-time event streaming                           │
│  Geospatial: Location-based queries (find nearby)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ElastiCache for Memcached - Chi tiết

### Architecture

```
                        ┌───────────────────────────────────────┐
                        │             Region                    │
                        │                                       │
                        │  ┌─────────────────────────────────┐  │
                        │  │      Memcached Cluster          │  │
                        │  │                                 │  │
   Application ─────────┼──┼──►┌─────┐ ┌─────┐ ┌─────┐       │  │
       │                │  │   │Node1│ │Node2│ │Node3│       │  │
       │                │  │   │ AZ-a│ │ AZ-b│ │ AZ-c│       │  │
       │                │  │   └─────┘ └─────┘ └─────┘       │  │
       │                │  │      ▲       ▲       ▲          │  │
       │                │  │      └───────┴───────┘          │  │
       └────────────────┼──┼──── App phân phối data          │  │
                        │  │     (client-side sharding)      │  │
                        │  └─────────────────────────────────┘  │
                        └───────────────────────────────────────┘
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
│              Database Query Caching                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User request → Check cache → Cache HIT? → Return immediately   │
│                     │                                           │
│                      └── Cache MISS? → Query DB → Store in cache│
│                                                                 │
│  Example:                                                       │
│  key: "user:123"                                                │
│  value: {"name": "John", "email": "john@email.com"}             │
│  TTL: 3600 seconds (1 hour)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Session Store

```
┌─────────────────────────────────────────────────────────────────┐
│                    Session Management                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Vấn đề: Nhiều EC2 instances, làm sao share session?            │
│                                                                 │
│      EC2-1 ──┐                                                  │
│             │                                                   │
│      EC2-2 ──┼──► ElastiCache (Redis) ←── Lưu sessions          │
│              │        │                                         │
│      EC2-3 ──┘        │                                         │
│                       ▼                                         │
│           session:abc123 → {user_id: 123, cart: [...]}          │
│                                                                 │
│  Benefits: Stateless EC2s, sessions persist qua failover        │
│                                                                 │
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
│               ElastiCache Serverless                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Auto-scaling (không cần chọn node type)                     │
│  ✅ Pay per use (GB-hours + ECPUs)                              │
│  ✅ Multi-AZ by default                                         │
│  ✅ Không cần quản lý capacity                                  │
│                                                                 │
│  Best for: Variable workloads, không muốn manage cluster        │
│                                                                 │
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
│                  Security Configuration                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. VPC & Security Groups                                       │
│     └── ElastiCache trong VPC, private subnets                  │
│     └── Security Group cho phép port 6379 (Redis)               │
│                                                                 │
│  2. Authentication                                              │
│     └── Redis AUTH (password)                                   │
│     └── Redis ACL (user-level permissions)                      │
│     └── IAM Authentication (Redis 7.0+)                         │
│                                                                 │
│  3. Subnet Groups                                               │
│     └── Define which subnets ElastiCache can use                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Caching Strategies

### 1. Lazy Loading (Cache-Aside)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lazy Loading Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CACHE HIT (Fast path):                                         │
│  ┌─────┐    1.GET     ┌───────┐    2.Return     ┌─────┐         │
│  │ App │ ───────────► │ Cache │ ───────────────►│ App │         │
│  └─────┘              └───────┘                 └─────┘         │
│                                                                 │
│  CACHE MISS (Slow path):                                        │
│  ┌─────┐    1.GET     ┌───────┐                                 │
│  │ App │ ───────────► │ Cache │ ── MISS ──┐                     │
│  └──┬──┘              └───────┘           │                     │
│     │                     ▲               ▼                     │
│     │   4.Return          │ 3.SET    ┌────────┐                 │
│     │◄────────────────────┴──────────│   DB   │                 │
│     │                     data       └────────┘                 │
│                                        2.Query                  │
│                                                                 │
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
│                   Write-Through Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WRITE:                                                         │
│  ┌─────┐    1.Write    ┌───────┐    2.Write    ┌────────┐       │
│  │ App │ ────────────► │ Cache │ ────────────► │   DB   │       │
│  └─────┘               └───────┘               └────────┘       │
│                            │                        │           │
│                            └────────────────────────┘           │
│                              Both updated together              │
│                                                                 │
│  READ (always hit):                                             │
│  ┌─────┐    1.GET     ┌───────┐    2.Return                     │
│  │ App │ ───────────► │ Cache │ ───────────► Data (always fresh)│
│  └─────┘              └───────┘                                 │
│                                                                 │
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
│                      TTL Flow                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SET with TTL:                                                  │
│  ┌─────┐    SET key "value" EX 3600    ┌───────┐                │
│  │ App │ ─────────────────────────────►│ Cache │                │
│  └─────┘      (expire in 1 hour)       └───────┘                │
│                                             │                   │
│                                             ▼                   │
│  Timeline:                                                      │
│  ──────────────────────────────────────────────────────────►    │
│  │         │                              │                     │
│  t=0       t=30min                         t=60min              │
│  SET       GET (HIT)                       EXPIRED → MISS       │
│            returns "value"                 │                    │
│                                            ▼                    │
│                                    Auto-deleted from cache      │
│                                                                 │
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
│                  Write-Around / Cache Invalidation              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WRITE (invalidate cache):                                      │
│  ┌─────┐                  ┌───────┐                             │
│  │ App │ ── 1.DELETE ───► │ Cache │  (invalidate/xóa cache)     │
│  └──┬──┘                  └───────┘                             │
│     │                                                           │
│     └── 2.Write ──────────────────────► ┌────────┐              │
│                                         │   DB   │              │
│                                         └────────┘              │
│                                                                 │
│  READ (sau đó - Lazy Loading):                                  │
│  ┌─────┐   1.GET    ┌───────┐                                   │
│  │ App │ ─────────► │ Cache │ ── MISS (vì đã bị DELETE)         │
│  └──┬──┘            └───┬───┘                                   │
│     │    4.Return       │ 3.SET (data mới từ DB)                │
│     │◄──────────────────┤                                       │
│     │                   │                                       │
│     └── 2.Query DB ─────┴───────────► ┌────────┐                │
│                                       │   DB   │                │
│                                       └────────┘                │
│                                                                 │
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
│                     Write-Behind Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WRITE (async to DB):                                           │
│  ┌─────┐   1.Write (sync)   ┌───────┐                           │
│  │ App │ ──────────────────►│ Cache │                           │
│  └─────┘    Return fast!    └───┬───┘                           │
│                                 │                               │
│                                 │ 2.Async write (background)    │
│                                 ▼                               │
│                            ┌────────┐                           │
│                            │   DB   │                           │
│                            └────────┘                           │
│                                                                 │
│  Timeline:                                                      │
│  ──────────────────────────────────────────────────────────►    │
│  │              │                     │                         │
│  t=0            t=50ms                 t=100ms                  │
│  Write to       Return to App          Background write to DB   │
│  Cache (sync)   (fast!)                (async, batched)         │
│                                                                 │
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
│         Redis           │           Memcached                 │
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
│                 Amazon ElastiCache Summary                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Managed in-memory caching (Redis / Memcached)               │
│  ✅ Microsecond latency (1000x faster than database)            │
│  ✅ Reduce database load                                        │
│  ✅ Session store, leaderboards, real-time apps                 │
│                                                                 │
│  Redis (95% cases):                                             │
│  ├── HA with Multi-AZ Failover                                  │
│  ├── Persistence (snapshots, AOF)                               │
│  ├── Complex data types                                         │
│  └── Pub/Sub, Read Replicas                                     │
│                                                                 │
│  Memcached (5% cases):                                          │
│  ├── Simple key-value                                           │
│  ├── Multi-threaded                                             │
│  └── No persistence, no HA                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
