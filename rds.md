# Amazon RDS (Relational Database Service)


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các Database Engine được hỗ trợ](#các-database-engine-được-hỗ-trợ)
- [DB Instance Classes (Loại Instance)](#db-instance-classes-loại-instance)
- [Storage Types](#storage-types)
- [Bảo mật RDS](#bảo-mật-rds)
- [⚡ High Availability với Multi-AZ](#high-availability-với-multi-az)
- [Read Replicas](#read-replicas)
- [Scaling Patterns & Real-world Usage](#scaling-patterns-real-world-usage)
- [Backup và Recovery](#backup-và-recovery)
- [Maintenance và Patching](#maintenance-và-patching)
- [Monitoring](#monitoring)
- [Pricing](#pricing)
- [Hands-on Labs](#hands-on-labs)
- [Best Practices](#best-practices)
- [❓ RDS vs Aurora vs Self-managed](#rds-vs-aurora-vs-self-managed)
- [Exam Tips (SAA-C03)](#exam-tips-saa-c03)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## 📖 Tổng quan

**Amazon RDS (Relational Database Service)** là dịch vụ cơ sở dữ liệu quan hệ được quản lý toàn diện (fully managed) của AWS. RDS giúp đơn giản hóa việc thiết lập, vận hành và mở rộng các cơ sở dữ liệu quan hệ trên đám mây.

### Tại sao cần RDS?

| Tự quản lý (EC2 + Database) | Amazon RDS |
|----------------------------|------------|
| Phải cài đặt, cấu hình phần cứng | AWS quản lý hoàn toàn |
| Tự backup, restore | Tự động backup |
| Tự patch, update | AWS tự động vá lỗi |
| Tự monitoring | CloudWatch tích hợp sẵn |
| Tự thiết lập HA/DR | Multi-AZ có sẵn |

---

## 🔧 Các Database Engine được hỗ trợ

RDS hỗ trợ **6 database engine** phổ biến:

### 1. **Amazon Aurora**
- Database của AWS, tương thích MySQL và PostgreSQL
- Hiệu suất gấp 5x MySQL và 3x PostgreSQL
- Auto-scaling storage từ 10GB đến 128TB
- Giá cao hơn nhưng performance tốt nhất

#### 🔍 Tại sao Aurora nhanh hơn 5x MySQL và 3x PostgreSQL?

Aurora nhanh hơn không phải vì thay đổi MySQL/PostgreSQL engine, mà vì **AWS thiết kế lại hoàn toàn tầng storage**.

**Kiến trúc truyền thống vs Aurora:**

```
┌─────────────────────────────────────────────────────────────┐
│              MYSQL/POSTGRESQL TRUYỀN THỐNG                  │
│                                                             │
│   DB Engine ──▶ Write full pages (16KB) ──▶ EBS Primary    │
│                        │                                    │
│                        └──▶ Replicate 16KB ──▶ Standby EBS │
│                                                             │
│   ❌ Ghi toàn bộ page 16KB dù chỉ thay đổi 1 byte          │
│   ❌ Network I/O rất nặng                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     AMAZON AURORA                           │
│                                                             │
│   DB Engine ──▶ Write only REDO LOG (~bytes)               │
│                        │                                    │
│                        ▼                                    │
│   ┌─────────────────────────────────────────────────┐      │
│   │      Aurora Distributed Storage (6 copies)      │      │
│   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│      │
│   │  │AZ-a │ │AZ-a │ │AZ-b │ │AZ-b │ │AZ-c │ │AZ-c ││      │
│   │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│      │
│   └─────────────────────────────────────────────────┘      │
│                                                             │
│   ✅ Chỉ gửi log records (rất nhỏ) - Giảm 90%+ I/O        │
│   ✅ Storage nodes tự rebuild pages                         │
│   ✅ Quorum writes: Chỉ cần 4/6 nodes ACK = COMMIT         │
└─────────────────────────────────────────────────────────────┘
```

**Các cải tiến chính:**

| Cải tiến | Tác động |
|----------|----------|
| **Log-structured storage** | Giảm 90%+ network I/O |
| **Quorum-based writes (4/6)** | Không đợi tất cả nodes |
| **Parallel distributed I/O** | Ghi đồng thời 6 nodes |
| **Shared storage layer** | All replicas đọc cùng 1 storage |
| **Replica lag ~10-20ms** | Thay vì seconds như RDS |

**Ví dụ cụ thể:**
- UPDATE 1 row (thay đổi 100 bytes)
- **MySQL**: Ghi lại page 16KB + replicate 16KB
- **Aurora**: Chỉ gửi log ~100 bytes, storage tự rebuild

### 2. **MySQL**
- Open-source phổ biến nhất
- Phiên bản: 5.7, 8.0
- Phù hợp: Web applications, CMS (WordPress, Drupal)

### 3. **PostgreSQL**
- Open-source với nhiều tính năng enterprise
- Hỗ trợ JSONB, full-text search
- Phù hợp: Analytics, GIS applications

### 4. **MariaDB**
- Fork của MySQL với cải tiến
- Tương thích MySQL
- Phù hợp: Thay thế MySQL với performance tốt hơn

### 5. **Oracle**
- Enterprise database mạnh mẽ
- License: BYOL (Bring Your Own License) hoặc License Included
- Phù hợp: Enterprise applications

### 6. **Microsoft SQL Server**
- Database của Microsoft
- Các edition: Express, Web, Standard, Enterprise
- Phù hợp: .NET applications, Windows environment

---

## 💻 DB Instance Classes (Loại Instance)

### Các họ Instance chính:

| Loại | Mô tả | Use Case |
|------|-------|----------|
| **db.t3/t4g** | Burstable, giá rẻ | Dev/Test, low traffic |
| **db.m5/m6g** | General purpose | Production workloads |
| **db.r5/r6g** | Memory optimized | High-memory applications |
| **db.x2g** | Memory intensive | Large in-memory databases |

### Ví dụ đặt tên:
```
db.m6g.large
│   │   │
│   │   └── Size: large, xlarge, 2xlarge...
│   └── Generation: 6g (Graviton2)
└── Family: m (general purpose)
```

---

## 💾 Storage Types

RDS sử dụng **Amazon EBS (Elastic Block Store)** - là **network-attached storage**, KHÔNG phải Instance Store.

### Tại sao RDS dùng EBS thay vì Instance Store?

```
┌──────────────────┐         Network          ┌────────┐
│  RDS Instance    │◄───────────────────────► │  EBS   │
│  (Compute)       │    (Network-attached)    │ Volume │
└──────────────────┘                          └────────┘
```

| Tiêu chí | Instance Store | EBS (RDS dùng) |
|----------|----------------|----------------|
| **Persistence** | ❌ Mất khi stop/terminate | ✅ Data tồn tại độc lập |
| **Durability** | ❌ Không replicate | ✅ Tự động replicate trong AZ |
| **Snapshot** | ❌ Không hỗ trợ | ✅ Có thể backup |
| **Resize** | ❌ Cố định | ✅ Có thể mở rộng |

> ⚠️ **Aurora** KHÔNG dùng EBS mà dùng **distributed storage layer riêng** (6 copies/3 AZs)

### Các loại EBS Storage cho RDS:

#### 1. **General Purpose SSD (gp2/gp3)**
```
- gp2: 3 IOPS/GB, tối đa 16,000 IOPS
- gp3: Cấu hình IOPS độc lập (3,000 - 16,000)
- Dung lượng: 20GB - 64TB
- Phù hợp: Hầu hết workloads
```

#### 2. **Provisioned IOPS SSD (io1/io2)**
```
- IOPS: 1,000 - 256,000
- Dung lượng: 100GB - 64TB
- Phù hợp: High-performance, I/O intensive
```

#### 3. **Magnetic (Standard)**
```
- Legacy storage - Không khuyến nghị cho production mới
```

### Storage Auto Scaling
- Tự động mở rộng storage khi gần đầy
- Set maximum storage limit
- Không downtime khi scaling

---

## 🔒 Bảo mật RDS

### 1. Network Security

```
┌─────────────────────────────────────┐
│              VPC                    │
│  ┌────────────────────────────┐     │
│  │      Private Subnet        │     │
│  │  ┌─────────────────────┐   │     │
│  │  │   RDS Instance      │   │     │
│  │  │  (No public IP)     │   │     │
│  │  └─────────────────────┘   │     │
│  └────────────────────────────┘     │
│                                     │
│  Security Group: Allow port 3306    │
│  from specific sources only         │
└─────────────────────────────────────┘
```

- **VPC**: Đặt RDS trong private subnet
- **Security Groups**: Kiểm soát inbound/outbound traffic
- **Subnet Groups**: Nhóm các subnet cho Multi-AZ

### 2. Encryption

#### At-rest Encryption:
- Sử dụng AWS KMS
- Encrypt cả storage, backups, snapshots, read replicas
- Phải enable khi tạo instance (không thể enable sau)

#### In-transit Encryption:
- SSL/TLS cho connections
- Download certificate từ AWS

### 3. Authentication

| Phương thức | Mô tả |
|-------------|-------|
| **Password Auth** | Username/password truyền thống |
| **IAM Auth** | Dùng IAM credentials thay password |
| **Kerberos** | Active Directory integration (SQL Server, Oracle) |

### IAM Database Authentication:
```python
# Không lưu password trong code
# Dùng IAM token thay thế
import boto3

rds_client = boto3.client('rds')
token = rds_client.generate_db_auth_token(
    DBHostname='mydb.xxxxxxxx.us-east-1.rds.amazonaws.com',
    Port=3306,
    DBUsername='myuser'
)
```

---

## ⚡ High Availability với Multi-AZ

### 3 Loại Multi-AZ Deployment

#### 1. **Single-AZ (1 Instance)** - Đơn giản nhất

```
┌─────────────────┐
│      AZ-1       │     ❌ Không có backup instance
│   ┌─────────┐   │     ❌ Nếu AZ chết = mất DB
│   │ Primary │   │     ❌ Không có failover
│   │  (RW)   │   │
│   └─────────┘   │     Phù hợp: Dev/Test only
└─────────────────┘
```

#### 2. **Multi-AZ Instance (2 Instances)** - Truyền thống

```
┌─────────────────┐              ┌─────────────────┐
│      AZ-a       │   Sync       │      AZ-b       │
│   ┌─────────┐   │  Replicate   │   ┌─────────┐   │
│   │ Primary │   │◄────────────►│   │ Standby │   │
│   │  (RW)   │   │              │   │(NO READ)│   │
│   └─────────┘   │              │   └─────────┘   │
└─────────────────┘              └─────────────────┘
        │
        ▼
  Single Endpoint (Writer only)
  
  ❌ KHÔNG THỂ đọc từ Standby - chỉ dùng cho failover
```

#### 3. **Multi-AZ Cluster (3 Instances)** - Mới nhất

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│    AZ-1    │     │    AZ-2    │     │    AZ-3    │
│ ┌────────┐ │     │ ┌────────┐ │     │ ┌────────┐ │
│ │ Writer │ │     │ │ Reader │ │     │ │ Reader │ │
│ │  (RW)  │ │     │ │  (RO)  │ │     │ │  (RO)  │ │
│ └────────┘ │     │ └────────┘ │     │ └────────┘ │
└────────────┘     └────────────┘     └────────────┘
      │                  │                  │
      ▼                  └────────┬─────────┘
Writer Endpoint                   ▼
(for writes)              Reader Endpoint
                          (for reads)

  ✅ CÓ THỂ đọc từ 2 Readers
  ✅ Failover nhanh hơn (~35s)
```

### So sánh 3 loại deployment

| Tiêu chí | Single-AZ | Multi-AZ Instance | Multi-AZ Cluster |
|----------|-----------|-------------------|------------------|
| **Instances** | 1 | 2 | 3 |
| **HA** | ❌ | ✅ | ✅ |
| **Đọc từ Standby** | - | ❌ | ✅ |
| **Failover time** | - | ~60-120s | ~35s |
| **Endpoints** | 1 | 1 | 2 (Writer + Reader) |
| **Chi phí** | $ | $$ (~2x) | $$$ (~3x) |
| **Use case** | Dev/Test | Production | High-perf Production |

---

### Multi-Writer trong AWS RDS?

> ⚠️ **AWS RDS KHÔNG có Multi-Writer!** Tất cả deployment đều là **Single Writer**.

| Database Service | Multi-Writer? |
|-----------------|---------------|
| RDS MySQL/PostgreSQL | ❌ Single writer |
| RDS Multi-AZ Cluster | ❌ 1 writer + 2 readers |
| Aurora | ❌ Single writer |
| **DynamoDB** | ✅ Multi-writer (NoSQL) |

---

### Replication Lag & Stale Reads

Khi đọc từ Reader, có thể gặp **Stale Read** (đọc data cũ):

```
Writer:  UPDATE user SET name='John'
              │
              ▼ COMMIT
              │
              │  ← Replication lag (~10-20ms cho Multi-AZ Cluster)
              │
Reader:  SELECT * FROM user
              │
              ▼
         Có thể trả về name cũ nếu chưa sync xong!
```

#### Replication lag theo deployment:

| Deployment | Lag |
|------------|-----|
| Multi-AZ Instance | ~0 (Standby không đọc được) |
| **Multi-AZ Cluster** | **~10-20ms** (semi-sync) |
| Read Replicas | Seconds → minutes |
| Aurora Replicas | ~10-20ms |

#### AWS có tự động xử lý không?

| AWS tự động | Bạn phải làm |
|-------------|--------------|
| ✅ Sync data (~10-20ms) | ❌ Chọn endpoint nào để đọc |
| ✅ Tạo 2 endpoints | ❌ Quyết định read nào cần consistency |
| ✅ Failover tự động | ❌ Route critical reads về Writer |

#### Best practice:

```python
WRITER = "mydb.cluster-xxx.rds.amazonaws.com"
READER = "mydb.cluster-ro-xxx.rds.amazonaws.com"

# Sau khi UPDATE → đọc từ WRITER
def update_profile(user_id, name):
    writer_conn.execute("UPDATE users SET name=%s WHERE id=%s", (name, user_id))
    return writer_conn.execute("SELECT * FROM users WHERE id=%s", (user_id,))

# Dashboard/Reports → đọc từ READER (chấp nhận lag)
def get_stats():
    return reader_conn.execute("SELECT COUNT(*) FROM orders")
```

> **Tin tốt**: Với Multi-AZ Cluster, lag chỉ ~10-20ms. Khi user refresh page (200-500ms), data thường đã sync xong!

---

### Các tầng Replication

| Loại Replication | RDS (non-Aurora) | Aurora |
|------------------|------------------|--------|
| **Trong cùng AZ** | ✅ EBS tự động | ✅ Tự động |
| **Cross-AZ** | 🔧 Phải bật Multi-AZ | ✅ **Mặc định 3 AZs** |
| **Số copies** | 2 (Primary + Standby) | 6 copies |

> **Lưu ý**: EBS tự động replicate TRONG cùng AZ. Cần Multi-AZ cho cross-AZ protection.

---

### Cách bật Multi-AZ

**Trong AWS Console:**
```
Create database → Availability & durability:
┌─────────────────────────────────────────────────────┐
│ ○ Single-AZ (1 instance)                            │
│ ○ Multi-AZ DB instance (2 instances)                │
│ ● Multi-AZ DB cluster (3 instances) ◄── Recommended │
└─────────────────────────────────────────────────────┘
```

**Bằng AWS CLI:**
```bash
# Multi-AZ Instance
aws rds create-db-instance ... --multi-az

# Modify existing
aws rds modify-db-instance --db-instance-identifier my-db --multi-az
```

### Khi nào failover xảy ra?
1. AZ outage
2. Primary instance failure
3. Instance type change
4. Software patching
5. Manual failover (testing)

---

## 📖 Read Replicas

### Mục đích
- **Scale read workloads** - Phân tải các query đọc
- **Disaster Recovery** - Cross-region backup

### Kiến trúc Read Replica:

```
                    ┌──────────────────┐
     Writes ───────▶│  Primary (RW)   │
                    └────────┬─────────┘
                             │ Async Replication
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
 Reads  │ Replica 1│  │ Replica 2│  │ Replica 3│
   │    │   (RO)   │  │   (RO)   │  │   (RO)   │
   │    └──────────┘  └──────────┘  └──────────┘
   │         │              │              │
   └─────────┴──────────────┴──────────────┘
        Application reads từ replicas
```

### Đặc điểm:
| Feature | Giá trị |
|---------|---------|
| Max replicas | 5 per source |
| Replication | Asynchronous |
| Cross-region | ✅ Có |
| Promote to Primary | ✅ Có |
| Separate endpoint | ✅ Mỗi replica có endpoint riêng |

### So sánh Multi-AZ vs Read Replica:

| Tính năng | Multi-AZ | Read Replica |
|-----------|----------|--------------|
| Mục đích | High Availability | Scalability |
| Replication | Synchronous | Asynchronous |
| Có thể đọc | ❌ Không | ✅ Có |
| Failover tự động | ✅ Có | ❌ Không |
| Cross-region | ❌ Không | ✅ Có |
| Chi phí network | Free (same AZ) | Có phí cross-AZ/region |

---

## 📈 Scaling Patterns & Real-world Usage

### Single Writer có đủ không?

> ✅ **CÓ, đủ cho 95%+ ứng dụng!**

```
Thực tế workload: READ 80-95% | WRITE 5-20%
→ Write thường KHÔNG phải bottleneck!
```

| Instance | Writes/sec | Đủ cho |
|----------|------------|--------|
| db.t3.medium | ~1,000-3,000 | Startup, MVP |
| db.r6g.large | ~5,000-10,000 | App vừa, SaaS |
| db.r6g.4xlarge | ~20,000-50,000 | Large production |

**Khi nào cần multi-writer?** IoT massive, real-time gaming, social media scale → Dùng DynamoDB hoặc sharding.

---

### Single Reader có đủ không?

> ⚠️ **Reads thường là bottleneck TRƯỚC writes!**

| Instance | Reads/sec | Connections |
|----------|-----------|-------------|
| db.t3.medium | ~2,000-5,000 | 50-100 |
| db.r6g.large | ~10,000-20,000 | 200-500 |
| db.r6g.4xlarge | ~50,000-100,000 | 1,000+ |

**Khi nào cần Read Replicas?**
- CPU > 70% liên tục
- Connection limit gần max
- Query latency tăng

---

### Caching - Giảm 90% database reads

```
TRƯỚC:  App ──► Database (100,000 reads/sec)

SAU:    App ──► Redis/ElastiCache ──► Database
                     │                 (10,000 reads/sec)
                     └── 90,000 reads/sec từ cache!
```

> **Pro tip**: Thêm caching TRƯỚC khi thêm Read Replicas!

---

### Scaling stages thực tế

```
Stage 1: MVP (100-1,000 users)
→ Single instance, no replicas. ĐỦ!

Stage 2: Growing (1,000-10,000 users)
→ Primary + 1-2 Read Replicas

Stage 3: Scale (10,000-100,000 users)
→ Primary + Replicas + Redis caching

Stage 4: Large (100,000+ users)
→ Aurora auto-scaling + Heavy caching
```

---

### RDS vs Self-managed trên EC2?

| Tiêu chí | RDS | Self-managed EC2 |
|----------|-----|------------------|
| **Ai dùng?** | 90% startups/SMB | Enterprise đặc thù |
| **Setup time** | Vài phút | Vài ngày-tuần |
| **DBA cần?** | Không | Cần team DBA |
| **Maintenance** | AWS lo | Tự làm tất cả |
| **Multi-master?** | ❌ | ✅ (Galera, Patroni) |

**Khi nào self-manage?**
- Cần multi-master (Galera Cluster)
- Database không hỗ trợ (CockroachDB, TiDB)
- Compliance đặc thù
- Có DBA team riêng

> **Bottom line**: 90% dự án dùng **RDS/Aurora**. Chỉ self-manage khi có lý do đặc biệt!

---

### Self-managed HA trên EC2 - Cách setup

Nếu cần self-manage, đây là các options phổ biến:

#### Option 1: **MySQL/MariaDB Galera Cluster** (Multi-master)

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   EC2-1    │     │   EC2-2    │     │   EC2-3    │
│  (AZ-a)    │     │  (AZ-b)    │     │  (AZ-c)    │
│ ┌────────┐ │     │ ┌────────┐ │     │ ┌────────┐ │
│ │ Galera │◄├─────┼─┤ Galera │◄├─────┼─┤ Galera │ │
│ │  (RW)  │ │     │ │  (RW)  │ │     │ │  (RW)  │ │
│ └────────┘ │     │ └────────┘ │     │ └────────┘ │
└────────────┘     └────────────┘     └────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         ▼
              ProxySQL / HAProxy (Load Balancer)

✅ TRUE Multi-Master (all nodes can write)
✅ Synchronous replication
❌ Complex to setup and maintain
```

#### Option 2: **PostgreSQL Patroni + etcd** (Auto-failover)

```
┌────────────────────────────────────────────────┐
│              etcd Cluster (consensus)          │
└────────────────────────────────────────────────┘
                        │
     ┌──────────────────┼──────────────────┐
     ▼                  ▼                  ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Patroni  │      │ Patroni  │      │ Patroni  │
│ PG Leader│─────►│ PG Replica│─────►│PG Replica│
│   (RW)   │      │   (RO)   │      │   (RO)   │
└──────────┘      └──────────┘      └──────────┘

✅ Automatic failover khi leader chết
✅ Dùng bởi GitLab, Zalando
❌ Vẫn single-writer
```

#### Option 3: **MongoDB Replica Set**

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Primary   │────►│ Secondary  │────►│ Secondary  │
│   (RW)     │     │   (RO)     │     │   (RO)     │
└────────────┘     └────────────┘     └────────────┘

Automatic election khi Primary fail
```

#### So sánh chi phí

| Hạng mục | RDS Multi-AZ | Self-managed |
|----------|--------------|--------------|
| Instance | ~$300/mo | ~$200/mo |
| DBA Salary | $0 | $8,000-15,000/mo |
| Downtime risk | Low (AWS SLA) | Higher |
| **Total** | ~$300/mo | ~$250/mo + risk + người |

## 💾 Backup và Recovery

### 1. Automated Backups

```
┌─────────────────────────────────────────┐
│          Automated Backup               │
│                                         │
│  • Daily full backup (backup window)   │
│  • Transaction logs (every 5 minutes)   │
│  • Retention: 0-35 days                 │
│  • Point-in-time recovery              │
│  • Stored in S3 (managed by AWS)       │
└─────────────────────────────────────────┘
```

**Point-in-time Recovery (PITR):**
- Restore đến bất kỳ thời điểm nào trong retention period
- Độ chính xác: đến 5 phút gần nhất

### 2. Manual Snapshots

```
┌─────────────────────────────────────────┐
│          Manual Snapshot                │
│                                         │
│  • User-initiated                       │
│  • No expiration                        │
│  • Can copy cross-region               │
│  • Can share with other accounts        │
└─────────────────────────────────────────┘
```

### Restore Process:
1. Restore tạo ra **database instance MỚI**
2. Phải update connection string trong application
3. Không restore vào instance hiện tại

---

## 🔧 Maintenance và Patching

### Maintenance Window
- OS patching, DB engine updates
- Multi-AZ: Update standby trước, failover, update old primary
- Single-AZ: Có downtime

### Minor vs Major Version Upgrade

| Loại | Auto Upgrade | Cách thức |
|------|--------------|-----------|
| Minor (5.7.1 → 5.7.2) | ✅ Có thể enable | Trong maintenance window |
| Major (5.7 → 8.0) | ❌ Manual | Phải test kỹ trước |

---

## 📊 Monitoring

### CloudWatch Metrics:
- **CPUUtilization**: % CPU usage
- **DatabaseConnections**: Số connections
- **FreeableMemory**: RAM khả dụng
- **ReadIOPS/WriteIOPS**: I/O operations
- **ReadLatency/WriteLatency**: Độ trễ I/O
- **FreeStorageSpace**: Disk còn trống
- **ReplicaLag**: Độ trễ replication (replicas)

### Enhanced Monitoring:
- Metrics ở OS level (processes, threads)
- Granularity: 1-60 seconds
- Lưu trong CloudWatch Logs

### Performance Insights:
- Phân tích database load
- Tìm bottlenecks
- Top SQL queries
- Wait events

---

## 💰 Pricing

### Các thành phần tính phí:

| Thành phần | Mô tả |
|------------|-------|
| **Instance hours** | Theo loại instance, tính theo giờ/giây |
| **Storage** | $/GB/tháng |
| **Provisioned IOPS** | $/IOPS/tháng (nếu dùng io1/io2) |
| **Backup storage** | Vượt quá DB size sẽ tính phí |
| **Data transfer** | Outbound và cross-region |
| **Multi-AZ** | ~2x giá (2 instances) |

### Pricing Options:

#### 1. On-Demand
- Pay-as-you-go
- Không commitment
- Phù hợp: Dev/test, variable workloads

#### 2. Reserved Instances
- 1 hoặc 3 năm commitment
- Tiết kiệm đến 69%
- Options: All upfront, Partial upfront, No upfront

### Free Tier (12 tháng đầu):
- 750 giờ/tháng db.t2.micro hoặc db.t3.micro
- 20 GB General Purpose SSD
- 20 GB backup storage
- Chỉ áp dụng Single-AZ

---

## 📝 Hands-on Labs

### Lab 1: Tạo RDS MySQL Instance

```bash
# Sử dụng AWS CLI
aws rds create-db-instance \
    --db-instance-identifier my-mysql-db \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0 \
    --master-username admin \
    --master-user-password MyPassword123! \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-xxxxxxxx \
    --db-subnet-group-name my-subnet-group \
    --no-publicly-accessible \
    --backup-retention-period 7 \
    --multi-az
```

### Lab 2: Kết nối từ EC2

```bash
# Install MySQL client trên EC2
sudo yum install mysql -y

# Connect to RDS
mysql -h mydb.xxxxxxxxx.us-east-1.rds.amazonaws.com \
      -P 3306 \
      -u admin \
      -p

# Test query
mysql> SHOW DATABASES;
mysql> CREATE DATABASE testdb;
mysql> USE testdb;
mysql> CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
mysql> INSERT INTO users VALUES (1, 'John');
mysql> SELECT * FROM users;
```

### Lab 3: Tạo Read Replica

```bash
aws rds create-db-instance-read-replica \
    --db-instance-identifier my-mysql-replica \
    --source-db-instance-identifier my-mysql-db \
    --db-instance-class db.t3.micro \
    --availability-zone us-east-1b
```

### Lab 4: Tạo Snapshot và Restore

```bash
# Tạo manual snapshot
aws rds create-db-snapshot \
    --db-instance-identifier my-mysql-db \
    --db-snapshot-identifier my-mysql-snapshot

# Restore từ snapshot
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier my-mysql-restored \
    --db-snapshot-identifier my-mysql-snapshot \
    --db-instance-class db.t3.micro
```

---

## 🎯 Best Practices

### 1. Security
- ✅ Đặt RDS trong private subnet
- ✅ Sử dụng Security Groups restrictive
- ✅ Enable encryption at-rest
- ✅ Dùng SSL/TLS cho connections
- ✅ Sử dụng IAM authentication khi có thể

### 2. Performance
- ✅ Chọn instance class phù hợp workload
- ✅ Dùng Provisioned IOPS cho high I/O
- ✅ Sử dụng Read Replicas cho read-heavy
- ✅ Monitor với CloudWatch và Performance Insights

### 3. Availability
- ✅ Enable Multi-AZ cho production
- ✅ Set backup retention phù hợp
- ✅ Test failover scenarios
- ✅ Có Cross-region replica cho DR

### 4. Cost Optimization
- ✅ Right-size instances
- ✅ Dùng Reserved Instances cho stable workloads
- ✅ Dọn dẹp old snapshots
- ✅ Tắt dev/test instances ngoài giờ

---

## ❓ RDS vs Aurora vs Self-managed

| Tiêu chí | Self-managed (EC2) | RDS | Aurora |
|----------|-------------------|-----|--------|
| Quản lý | Tự quản lý hoàn toàn | AWS managed | AWS managed |
| Customization | Cao | Trung bình | Thấp |
| HA/DR | Tự setup | Multi-AZ | Built-in |
| Performance | Tùy cấu hình | Tốt | Rất tốt |
| Cost | Thấp (nếu tự làm tốt) | Trung bình | Cao |
| Phù hợp | Legacy, special needs | Hầu hết use cases | High performance needs |

---

## 📚 Exam Tips (SAA-C03)

1. **Multi-AZ**: Cho HA, automatic failover, KHÔNG dùng để đọc
2. **Read Replica**: Cho scalability, CÓ THỂ đọc, manual promotion
3. **Encryption**: Phải enable khi tạo, không thể enable sau
4. **Restore**: Luôn tạo instance MỚI
5. **Aurora**: Hiệu suất cao nhất, đắt nhất
6. **IAM Auth**: Cho MySQL và PostgreSQL
7. **Subnet Groups**: Cần ít nhất 2 AZs cho Multi-AZ
8. **Cross-region Read Replica**: DR và low-latency reads

---

## 🔗 Tài liệu tham khảo

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [RDS User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/)
- [RDS Pricing](https://aws.amazon.com/rds/pricing/)
- [RDS FAQs](https://aws.amazon.com/rds/faqs/)
