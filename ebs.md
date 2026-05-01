# Amazon EBS (Elastic Block Store)


## Mục lục

- [EBS là gì?](#ebs-là-gì)
- [Ví dụ thực tế: EBS dùng để làm gì?](#ví-dụ-thực-tế-ebs-dùng-để-làm-gì)
- [Root Volume vs Data Volume](#root-volume-vs-data-volume)
- [EBS vs Instance Store](#ebs-vs-instance-store)
- [Các loại EBS Volume](#các-loại-ebs-volume)
- [EBS Snapshots](#ebs-snapshots)
- [EBS Encryption](#ebs-encryption)
- [EBS Multi-Attach](#ebs-multi-attach)
- [Elastic Volumes](#elastic-volumes)
- [Sử dụng EBS Volume: Attach, Format, Mount](#sử-dụng-ebs-volume-attach-format-mount)
- [Data Lifecycle Manager (DLM)](#data-lifecycle-manager-dlm)
- [EBS Pricing (Chi phí)](#ebs-pricing-chi-phí)
- [Best Practices](#best-practices)
- [Liên kết](#liên-kết)
- [Tham khảo](#tham-khảo)

---

## EBS là gì?

Amazon Elastic Block Store (EBS) là dịch vụ **block storage** có hiệu suất cao, được thiết kế để sử dụng với Amazon EC2. EBS cho phép bạn tạo các storage volumes và attach vào EC2 instances.

**Đặc điểm chính:**
- Hoạt động như ổ cứng ảo (virtual hard drive) cho EC2
- Dữ liệu được lưu trữ độc lập với vòng đời của EC2 instance
- Có thể detach từ instance này và attach vào instance khác (cùng Availability Zone)
- Tự động replicate trong một Availability Zone để đảm bảo durability

> 📖 **Nguồn:** [What is Amazon EBS?](https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html)

---

## Ví dụ thực tế: EBS dùng để làm gì?

### Scenario 1: Web Server với Database

```
┌─────────────────────────────────────────┐
│           EC2 Instance                  │
│         (Web Application)               │
├─────────────────────────────────────────┤
│  EBS Volume 1 (gp3, 8GB)                │  ← Root volume (OS: Ubuntu)
│  /dev/xvda                              │
├─────────────────────────────────────────┤
│  EBS Volume 2 (gp3, 100GB)              │  ← Data volume (MySQL data)
│  /dev/xvdb → mount /data                │
└─────────────────────────────────────────┘
```

**Lợi ích:**
- Stop EC2 → dữ liệu MySQL vẫn còn
- Terminate EC2 → data volume vẫn giữ được (nếu set `DeleteOnTermination=false`)
- Tạo snapshot → backup database trước khi upgrade

### Scenario 2: Disaster Recovery

```
Ngày 1:  Volume (100GB data) → Snapshot A
Ngày 7:  Volume thêm 5GB    → Snapshot B (chỉ backup 5GB mới)
Ngày 14: Oops! Xóa nhầm data

Recovery: Snapshot B → Tạo Volume mới → Attach vào EC2 → Data trở lại!
```

---

## Root Volume vs Data Volume

### Root Volume là gì?

Khi launch EC2, AWS tự động tạo **Root Volume** từ AMI. Đây là EBS volume chứa **toàn bộ hệ điều hành**:

```
Root Volume (/dev/xvda)
│
├── /boot          → Kernel, bootloader (GRUB)
├── /etc           → Config files (nginx.conf, ssh config...)
├── /home          → User files, SSH keys
├── /var           → Logs, app data, databases (nếu cài ở đây)
├── /usr           → Installed programs (nginx, python, nodejs...)
├── /opt           → Custom software
└── /root          → Root user's home
```

**Ví dụ:** Bạn launch EC2 Ubuntu, cài đặt nginx, nodejs, mysql → tất cả đều nằm trong root volume.

### Tạo EBS Volume mới

Khi bạn tạo EBS volume mới (không từ snapshot) → **ổ cứng trống** với size bạn chọn.

```
Tạo EBS Volume mới
├── Size: 100 GB
├── Type: gp3
└── Trạng thái: TRỐNG (chưa có gì, chưa có filesystem)
```

### 2 cách tạo EBS Volume

| Cách tạo | Kết quả |
|----------|---------|
| **Tạo mới (blank)** | Ổ trống, cần format |
| **Tạo từ Snapshot** | Có sẵn data và filesystem |

### So sánh Root Volume vs Data Volume

| Đặc điểm | Root Volume | Data Volume |
|----------|-------------|-------------|
| Tạo bởi | AWS (khi launch EC2) | Bạn (tự tạo) |
| Nội dung ban đầu | OS từ AMI | Trống hoặc từ snapshot |
| Mount point | `/` | Bạn chọn (vd: `/data`) |
| DeleteOnTermination mặc định | `true` (bị xóa) | `false` (giữ lại) |

### Stop vs Terminate EC2

| Hành động | Root Volume | Data Volume |
|-----------|-------------|-------------|
| **Stop** | ✅ Giữ nguyên | ✅ Giữ nguyên |
| **Terminate** | ❌ Mặc định bị XÓA | ✅ Mặc định giữ lại |

> ⚠️ Nếu muốn giữ root volume sau terminate → set `DeleteOnTermination=false`

### Best Practice: Tách data ra volume riêng

```
EC2 Instance
├── /dev/xvda (Root, 8GB)     → Chỉ OS + apps
└── /dev/xvdb (Data, 100GB)   → mount /data
    ├── /data/mysql
    ├── /data/uploads
    └── /data/logs
```

### Tại sao không dùng root volume cho tất cả + snapshot?

**Câu hỏi:** "Chỉ cần root volume rồi snapshot là được, sao phải tách data volume?"

**Trả lời:** Có thể, nhưng có nhiều vấn đề:

#### 1. Rủi ro DeleteOnTermination

```
Root Volume: DeleteOnTermination = true (mặc định)
             → Terminate EC2 = MẤT NGAY, không kịp snapshot

Data Volume: DeleteOnTermination = false (mặc định)
             → Terminate EC2 = Data vẫn còn
```

#### 2. Snapshot lớn hơn, tốn tiền hơn

```
Cách 1: Tất cả trong root volume (50GB)
┌─────────────────────────────┐
│ OS Ubuntu (10GB)            │  ← Không cần backup
│ Nginx, MySQL binaries (5GB) │  ← Không cần backup  
│ App data (35GB)             │  ← CẦN backup
└─────────────────────────────┘
Snapshot: 50GB → trả tiền cho cả OS

Cách 2: Tách riêng
Root (15GB): OS + apps        → Không cần snapshot thường xuyên
Data (35GB): Chỉ data         → Snapshot 35GB
→ Tiết kiệm ~30% chi phí snapshot
```

#### 3. Restore chậm hơn

```
Cách 1: Restore từ root snapshot
- Phải launch EC2 mới hoặc tạo AMI
- Mất thời gian setup lại

Cách 2: Tách data volume
- Snapshot → New Volume → Attach → Mount
- EC2 vẫn chạy, chỉ swap volume
- Nhanh hơn nhiều
```

#### 4. Không thể attach vào instance khác

```
Scenario: EC2 bị lỗi, cần lấy data gấp

Cách 1 (root volume):
EC2 chết → Không SSH được → Phải tạo snapshot → Đợi → Tạo EC2 mới

Cách 2 (data volume):
EC2 chết → Detach data volume → Attach vào EC2 khác → Mount → Lấy data ngay
```

#### 5. Không thể dùng volume type khác nhau

```
Root: gp3 (rẻ, đủ cho OS)
Data: io2 (IOPS cao cho database)

Nếu gộp chung → phải dùng io2 cho cả OS (đắt vô ích)
```

### Khi nào dùng root volume cho tất cả?

| Scenario | Chỉ root volume | Tách data volume |
|----------|-----------------|------------------|
| Dev/test tạm thời | ✅ OK | Không cần |
| Stateless app | ✅ OK | Không cần |
| Production database | ❌ Rủi ro | ✅ Nên tách |
| Data quan trọng | ❌ Rủi ro | ✅ Nên tách |

---

## EBS vs Instance Store

| Đặc điểm | EBS | Instance Store |
|----------|-----|----------------|
| Persistence | ✅ Persistent (dữ liệu giữ lại sau stop/terminate) | ❌ Ephemeral (mất khi stop/terminate) |
| Detach/Attach | ✅ Có thể | ❌ Không thể |
| Backup | ✅ Snapshots | ❌ Không có |
| Use case | Database, boot volumes | Cache, temporary data |

### Root Volume: EBS-backed vs Instance Store-backed

EC2 instance có thể có root volume là **EBS** hoặc **Instance Store**, tùy vào AMI:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EC2 ROOT VOLUME TYPES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  EBS-BACKED (Phổ biến - 99%)        INSTANCE STORE-BACKED (Hiếm)            │
│  ───────────────────────────        ────────────────────────────            │
│                                                                             │
│  ✅ Stop/Start được                 ❌ KHÔNG Stop được (chỉ Terminate)      │
│  ✅ Data tồn tại sau Stop           ❌ Data MẤT khi Stop/Terminate          │
│  ✅ Có thể resize                   ❌ Không resize được                    │
│  ✅ Snapshot được                   ❌ Không snapshot được                  │
│  ✅ Hibernate được                  ❌ Không hibernate được                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| | EBS-backed Root | Instance Store-backed Root |
|--|-----------------|---------------------------|
| **Stop instance** | ✅ Có thể | ❌ Không (chỉ Terminate) |
| **Data persistence** | ✅ Tồn tại sau Stop | ❌ Mất khi Stop/Terminate |
| **Boot time** | Chậm hơn (network) | Nhanh hơn (local disk) |
| **Resize** | ✅ Có thể | ❌ Không |
| **Snapshot** | ✅ Có | ❌ Không |
| **AMI support** | Hầu hết AMIs | Một số AMIs cũ/đặc biệt |

> 💡 **Thực tế:** AWS mặc định tạo EBS-backed instances. Instance Store-backed chủ yếu cho workloads đặc biệt cần local disk performance.

### Delete on Termination

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELETE ON TERMINATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ROOT VOLUME (EBS):                                             │
│  ├── Delete on Termination = TRUE (MẶC ĐỊNH)                    │
│  └── → Terminate EC2 → Root EBS bị XÓA                          │
│                                                                 │
│  ADDITIONAL VOLUMES (EBS thêm):                                 │
│  ├── Delete on Termination = FALSE (MẶC ĐỊNH)                   │
│  └── → Terminate EC2 → Additional EBS vẫn CÒN                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Volume Type | Default DeleteOnTermination | Terminate EC2 → EBS? |
|-------------|----------------------------|---------------------|
| **Root Volume** | ✅ TRUE (bật) | **Bị xóa** |
| **Additional Volumes** | ❌ FALSE (tắt) | **Giữ lại** |

**Cách giữ Root Volume sau Terminate:**

```bash
# Khi launch EC2 (Console):
# Add Storage → Root volume → Delete on Termination: ❌ Bỏ tick

# Hoặc sau khi đã launch (AWS CLI):
aws ec2 modify-instance-attribute \
  --instance-id i-xxx \
  --block-device-mappings "[{\"DeviceName\":\"/dev/xvda\",\"Ebs\":{\"DeleteOnTermination\":false}}]"
```

> ⚠️ **Tóm lại:**
> - **Stop** → EBS root volume **vẫn còn** ✅
> - **Terminate** → EBS root volume **bị xóa** (mặc định) 
> - Muốn giữ sau Terminate → Tắt "Delete on Termination"

---

## Các loại EBS Volume

### IOPS vs Throughput là gì?

Trước khi xem các loại volume, cần hiểu 2 khái niệm:

#### IOPS (Input/Output Operations Per Second)

**IOPS = số lần đọc/ghi mỗi giây**

```
Database MySQL:
┌─────────────────────────────────────┐
│ SELECT * FROM users WHERE id = 1    │  → 1 operation
│ SELECT * FROM users WHERE id = 2    │  → 1 operation  
│ SELECT * FROM users WHERE id = 3    │  → 1 operation
│ ...                                 │
│ 5000 queries/giây                   │  → Cần 5000 IOPS
└─────────────────────────────────────┘
```

**Đặc điểm:** Nhiều thao tác nhỏ, truy cập ngẫu nhiên (random I/O)

#### Throughput (Băng thông)

**Throughput = lượng data truyền mỗi giây (MB/s, MiB/s)**

```
Copy/Stream file lớn:
┌─────────────────────────────────────┐
│ Copy video 1GB                      │
│ ████████████████████████ 500 MiB/s  │  → Throughput cao
│ Xong trong 2 giây                   │
└─────────────────────────────────────┘
```

**Đặc điểm:** Ít thao tác nhưng data lớn, đọc tuần tự (sequential I/O)

#### So sánh IOPS vs Throughput

| | IOPS | Throughput |
|---|------|------------|
| **Đo gì** | Số lần đọc/ghi | Lượng data/giây |
| **Đơn vị** | operations/s | MiB/s |
| **Workload** | Database, random access | Video streaming, big data |
| **Ví dụ** | 10,000 queries nhỏ/giây | Copy file 500MB/giây |

#### Ví dụ thực tế

```
Database MySQL (cần IOPS cao):
- 5000 queries/giây, mỗi query đọc 4KB
- IOPS cần: 5000
- Throughput: 5000 × 4KB = 20 MB/s (thấp)
→ Chọn: gp3 hoặc io2

Video streaming/Big data (cần Throughput cao):
- Đọc file video liên tục
- IOPS: thấp (ít operations)
- Throughput: 500 MB/s (cao)
→ Chọn: st1
```

### SSD-backed Volumes (cho IOPS workloads)

| Type | Volume Type | Use Cases | Size | Max IOPS | Max Throughput |
|------|-------------|-----------|------|----------|----------------|
| **gp3** | General Purpose SSD | Boot volumes, dev/test, low-latency apps | 1 GiB - 64 TiB | 80,000 | 2,000 MiB/s |
| **gp2** | General Purpose SSD | Boot volumes, virtual desktops | 1 GiB - 16 TiB | 16,000 | 250 MiB/s |
| **io2 Block Express** | Provisioned IOPS SSD | Critical databases, sub-millisecond latency | 4 GiB - 64 TiB | 256,000 | 4,000 MiB/s |
| **io1** | Provisioned IOPS SSD | I/O-intensive databases | 4 GiB - 16 TiB | 64,000 | 1,000 MiB/s |

### HDD-backed Volumes (cho throughput workloads)

| Type | Volume Type | Use Cases | Size | Max IOPS | Max Throughput |
|------|-------------|-----------|------|----------|----------------|
| **st1** | Throughput Optimized HDD | Big data, data warehouses, log processing | 125 GiB - 16 TiB | 500 | 500 MiB/s |
| **sc1** | Cold HDD | Infrequent access, lowest cost | 125 GiB - 16 TiB | 250 | 250 MiB/s |

### Lưu ý quan trọng

- **Boot volume**: Chỉ SSD volumes (gp2, gp3, io1, io2) được dùng làm boot volume
- **gp3 vs gp2**: gp3 mới hơn, cho phép configure IOPS và throughput độc lập
- **io2 Block Express**: Durability 99.999% (0.001% annual failure rate)
- Các loại khác: Durability 99.8%-99.9% (0.1%-0.2% annual failure rate)

> 📖 **Nguồn:** [Amazon EBS volume types](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html)

---

## EBS Snapshots

**Snapshot** là bản backup point-in-time của EBS volume, được lưu trữ trên **Amazon S3**.

```
EBS Volume (100GB)          Snapshot
┌──────────────────┐       ┌──────────────────┐
│ /data            │  ──►  │ Backup lúc 10:00 │
│ ├── app/         │       │ Lưu trên S3      │
│ ├── db/          │       │ Durability:      │
│ └── logs/        │       │ 99.999999999%    │
└──────────────────┘       └──────────────────┘
```

### Incremental Snapshots (chỉ backup phần thay đổi)

```
Ngày 1: Volume có 100GB data
        Snapshot A: backup 100GB (full)

Ngày 2: Thêm 5GB data mới
        Snapshot B: chỉ backup 5GB (incremental)
        
Ngày 3: Sửa 2GB data
        Snapshot C: chỉ backup 2GB (incremental)

Tổng lưu trữ: 100 + 5 + 2 = 107GB (không phải 300GB)
```

**Lợi ích:** Tiết kiệm storage cost, tạo snapshot nhanh hơn.

### Snapshot vs Volume

| | EBS Volume | EBS Snapshot |
|---|------------|--------------|
| **Lưu ở đâu** | Trong 1 AZ | S3 (across AZs) |
| **Truy cập** | Attach vào EC2 | Không truy cập trực tiếp |
| **Dùng để** | Đọc/ghi data | Backup, restore, copy |
| **Giới hạn AZ** | Bị lock trong 1 AZ | Có thể copy cross-region |

### Use Cases

**1. Backup trước khi làm gì đó nguy hiểm:**
```
Trước khi upgrade MySQL:
Volume → Snapshot → Upgrade → Lỗi? → Restore từ Snapshot
```

**2. Migrate data sang AZ/Region khác:**
```
Volume (ap-southeast-1a) → Snapshot → Copy → Snapshot (us-east-1) → New Volume
```

**3. Share data với account khác:**
```
Snapshot (Account A) → Share → Account B có thể tạo Volume
```

### Các lệnh với Snapshot

```bash
# Tạo snapshot
aws ec2 create-snapshot \
    --volume-id vol-0abc123 \
    --description "Backup before upgrade"

# Tạo volume từ snapshot
aws ec2 create-volume \
    --snapshot-id snap-0xyz789 \
    --availability-zone ap-southeast-1a \
    --volume-type gp3

# Copy snapshot sang region khác
aws ec2 copy-snapshot \
    --source-region ap-southeast-1 \
    --source-snapshot-id snap-0xyz789 \
    --destination-region us-east-1

# Xóa snapshot
aws ec2 delete-snapshot --snapshot-id snap-0xyz789
```

### Snapshot Lifecycle

```
                    ┌─────────────┐
                    │   Volume    │
                    └──────┬──────┘
                           │ create-snapshot
                           ▼
┌─────────────────────────────────────────────┐
│              Snapshot (S3)                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Snap A  │──│ Snap B  │──│ Snap C  │      │
│  │ (full)  │  │(increm.)│  │(increm.)│      │
│  └─────────┘  └─────────┘  └─────────┘      │
└─────────────────────────────────────────────┘
        │                           │
        │ create-volume             │ copy-snapshot
        ▼                           ▼
┌──────────────┐            ┌──────────────┐
│ New Volume   │            │ Snapshot in  │
│ (any AZ)     │            │ other Region │
└──────────────┘            └──────────────┘
```

### Lưu ý quan trọng

| Điều cần biết | Chi tiết |
|---------------|----------|
| **Snapshot đang tạo** | Volume vẫn dùng được bình thường |
| **Consistency** | Nên stop I/O hoặc unmount trước khi snapshot (đặc biệt với DB) |
| **Xóa snapshot giữa** | Không mất data, AWS tự merge |
| **Encrypted volume** | Snapshot cũng encrypted |
| **Lazy loading** | Volume từ snapshot có thể chậm lúc đầu (data load từ S3) |

### EBS Snapshot Archive

- Tier lưu trữ giá rẻ hơn 75%
- Yêu cầu lưu tối thiểu 90 ngày
- Thời gian restore: 24-72 giờ
- Dùng cho: compliance, long-term backup

### Fast Snapshot Restore (FSR)

Giải quyết vấn đề lazy loading:

```
Không có FSR:
Volume mới ← lazy load từ S3 ← Snapshot
Lần đọc đầu: chậm

Có FSR:
Volume mới ← data sẵn sàng ngay
Lần đọc đầu: nhanh
```

**Chi phí:** ~$0.75/snapshot/AZ/giờ (đắt, chỉ dùng khi cần performance ngay)

---

## EBS Encryption

Amazon EBS encryption sử dụng **AWS KMS** keys để mã hóa:

- Data at rest trong volume
- Data in transit giữa volume và instance
- Tất cả snapshots được tạo từ volume
- Tất cả volumes được tạo từ encrypted snapshots

### Lưu ý:
- Encryption xảy ra trên EC2 host servers (transparent với instance)
- Minimal impact on latency
- Có thể enable encryption by default cho tất cả new volumes trong account

---

## EBS Multi-Attach

Cho phép attach một **io1/io2** volume vào nhiều EC2 instances cùng lúc (trong cùng AZ).

```
Bình thường:                    Multi-Attach:
┌──────┐     ┌──────┐          ┌──────┐
│ EC2  │────▶│ EBS  │          │EC2 A │───┐
└──────┘     └──────┘          └──────┘   │     ┌──────┐
                               ┌──────┐   ├────▶│ EBS  │
1:1                            │EC2 B │───┤     │(io2) │
                               └──────┘   │     └──────┘
                               ┌──────┐   │
                               │EC2 C │───┘     1:N (max 16)
                               └──────┘
```

### Tại sao cần Multi-Attach?

**Vấn đề: Failover chậm khi không có Multi-Attach**

```
EC2 A (Active) ────▶ EBS Volume
EC2 B (Standby)     (không có data)

EC2 A chết:
1. Detach volume từ EC2 A (đợi...)
2. Attach volume vào EC2 B (đợi...)
3. Mount trong EC2 B (đợi...)
→ Downtime: 2-5 phút!
```

**Giải pháp: Multi-Attach**

```
EC2 A (Active)  ───┐
                   ├───▶ EBS Volume (cả 2 đã attach sẵn)
EC2 B (Standby) ───┘

EC2 A chết → EC2 B lên ngay!
→ Downtime: vài giây
```

### Ví dụ: Oracle RAC (Database Cluster)

**Oracle RAC = nhiều servers chạy cùng 1 database**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Oracle RAC  │  │  Oracle RAC  │  │  Oracle RAC  │
│   Node 1     │  │   Node 2     │  │   Node 3     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └────────────┬────┴────────────────┘
                    ▼
         ┌─────────────────────────────┐
         │     EBS io2 Volume          │
         │     Multi-Attach Enabled    │
         │     (Shared Database)       │
         └─────────────────────────────┘
```

**Tại sao RAC cần shared storage?**

```
Nếu mỗi node có EBS riêng:
Node 1 → EBS A: balance = 50  (đã update)
Node 2 → EBS B: balance = 100 (chưa update)
→ Data không đồng bộ!

Với Multi-Attach (shared storage):
Node 1 ───┐
          ├──▶ Shared EBS: balance = 50
Node 2 ───┘
→ Tất cả nodes thấy cùng 1 data
```

### Các Database khác có cần Multi-Attach không?

**KHÔNG!** Đa số database dùng **Replication**, không cần shared storage.

```
MySQL/PostgreSQL (Replication):
┌─────────┐     ┌───────┐
│ Primary │────▶│ EBS A │ ← Ghi vào đây
└────┬────┘     └───────┘
     │ replicate (copy qua network)
     ▼
┌─────────┐     ┌───────┐
│ Replica │────▶│ EBS B │ ← Data được copy sang
└─────────┘     └───────┘

→ Mỗi node có EBS RIÊNG, KHÔNG cần Multi-Attach
```

### So sánh các Database

| Database | Cách Clustering | Cần Multi-Attach? |
|----------|-----------------|-------------------|
| **Oracle RAC** | Shared Storage | ✅ Cần |
| **SQL Server FCI** | Shared Storage | ✅ Cần |
| **MySQL** | Replication | ❌ Không |
| **PostgreSQL** | Replication | ❌ Không |
| **MongoDB** | Replica Set | ❌ Không |
| **Redis** | Replication | ❌ Không |

### So sánh Shared Storage vs Replication

| | Shared Storage (Oracle RAC) | Replication (MySQL, PostgreSQL) |
|---|----------------------------|--------------------------------|
| **Write** | Vào bất kỳ node | Chỉ vào Primary |
| **Data** | 1 bản, shared | Nhiều bản, copy |
| **Độ trễ** | Không có | Có (1-2 giây) |
| **Cần Multi-Attach** | ✅ Có | ❌ Không |
| **Phổ biến** | Enterprise (ngân hàng) | Đa số ứng dụng |

### Giới hạn Multi-Attach

| Giới hạn | Chi tiết |
|----------|----------|
| **Volume type** | Chỉ **io1** và **io2** |
| **Số instances** | Tối đa **16** |
| **AZ** | Tất cả instances phải **cùng AZ** |
| **OS** | Chỉ **Linux** |
| **File system** | Cần **cluster-aware FS** (GFS2, OCFS2) |

### Cách bật Multi-Attach

```bash
# Tạo volume với Multi-Attach
aws ec2 create-volume \
    --availability-zone ap-southeast-1a \
    --volume-type io2 \
    --size 100 \
    --iops 10000 \
    --multi-attach-enabled

# Attach vào nhiều instances
aws ec2 attach-volume --volume-id vol-xxx --instance-id i-111
aws ec2 attach-volume --volume-id vol-xxx --instance-id i-222
```

### Khi nào dùng Multi-Attach?

| Scenario | Dùng Multi-Attach? |
|----------|-------------------|
| Oracle RAC, SQL Server FCI | ✅ Cần |
| MySQL, PostgreSQL cluster | ❌ Dùng Replication |
| AWS managed (RDS, Aurora) | ❌ AWS lo hết |
| Web app thông thường | ❌ Không cần |

### Những điều cần AWARE khi dùng Multi-Attach

#### 1. Data Corruption nếu không dùng đúng File System

```
NGUY HIỂM:
EC2 A: echo "hello" > /data/file.txt  ──┐
                                        ├──▶ file.txt bị CORRUPT!
EC2 B: echo "world" > /data/file.txt  ──┘

Hai instances ghi cùng lúc vào 1 file = DATA CORRUPTION
```

**Giải pháp:** PHẢI dùng **Cluster-aware File System**:

| File System | Hỗ trợ Multi-Attach |
|-------------|---------------------|
| ext4, xfs | ❌ KHÔNG - sẽ corrupt data |
| GFS2 (Red Hat) | ✅ Có |
| OCFS2 (Oracle) | ✅ Có |

#### 2. Application phải hỗ trợ Shared Storage

```
❌ SAI: Chạy 2 MySQL instances trên cùng 1 Multi-Attach volume
       → MySQL không thiết kế cho shared storage → CORRUPT

✅ ĐÚNG: Oracle RAC được thiết kế cho shared storage
         → Có cơ chế locking, coordination giữa các nodes
```

**Không phải app nào cũng dùng được Multi-Attach!**

#### 3. I/O Fencing (tránh Split-Brain)

```
Vấn đề Split-Brain:
Node 1 nghĩ Node 2 chết → tiếp tục ghi
Node 2 nghĩ Node 1 chết → tiếp tục ghi
→ Cả 2 ghi cùng lúc → DATA CORRUPTION

Giải pháp: I/O Fencing
- Khi phát hiện node lỗi → "fence" (cô lập) node đó
- Node bị fence không thể ghi vào volume nữa
- Cần cấu hình đúng trong cluster software
```

#### 4. Tất cả instances phải cùng AZ

```
❌ KHÔNG hoạt động:
EC2 (ap-southeast-1a) ───┐
                         ├──▶ EBS Volume (ap-southeast-1a)
EC2 (ap-southeast-1b) ───┘  ← KHÔNG thể attach!

✅ Hoạt động:
EC2 (ap-southeast-1a) ───┐
                         ├──▶ EBS Volume (ap-southeast-1a)
EC2 (ap-southeast-1a) ───┘
```

→ Nếu cần cross-AZ → dùng EFS thay vì EBS Multi-Attach

#### 5. Chi phí cao

```
Multi-Attach chỉ với io1/io2:
- io2: $0.125/GB + $0.065/IOPS
- 1TB + 10,000 IOPS = $125 + $650 = $775/tháng

So với gp3:
- gp3: $0.08/GB + $0.005/IOPS (sau 3000 free)
- 1TB + 10,000 IOPS = $80 + $35 = $115/tháng

→ Multi-Attach đắt hơn ~6-7 lần!
```

#### 6. Không tự động sync application state

```
Multi-Attach chỉ share STORAGE, không share:
- Memory/RAM
- Process state
- Network connections
- Application cache

→ Application phải tự handle coordination giữa các nodes
```

### Checklist trước khi dùng Multi-Attach

| Kiểm tra | Đã làm? |
|----------|---------|
| App hỗ trợ shared storage (Oracle RAC, SQL Server FCI)? | ☐ |
| Dùng cluster-aware file system (GFS2, OCFS2)? | ☐ |
| Tất cả instances cùng AZ? | ☐ |
| Đã cấu hình I/O fencing? | ☐ |
| Dùng Nitro-based instances? | ☐ |
| Chấp nhận chi phí io1/io2? | ☐ |
| Đã test failover scenario? | ☐ |

> ⚠️ **Khuyến nghị:** Nếu không chắc chắn, hãy dùng **EFS** hoặc **Replication** thay vì Multi-Attach. Multi-Attach phức tạp và dễ gây data corruption nếu config sai.

---

## Elastic Volumes

Cho phép thay đổi volume configuration **mà không cần downtime**:

- Tăng size
- Thay đổi volume type (ví dụ: gp2 → gp3)
- Điều chỉnh IOPS và throughput (với gp3, io1, io2)

```bash
# Ví dụ: Modify volume size
aws ec2 modify-volume --volume-id vol-xxx --size 200

# Sau khi modify, cần extend file system trong OS
```

---

## Sử dụng EBS Volume: Attach, Format, Mount

### Device Name là gì?

**Device Name** = Tên đường dẫn để OS nhận diện ổ đĩa EBS trong EC2.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVICE NAME vs MOUNT POINT                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DEVICE NAME              MOUNT POINT (FOLDER)                  │
│  ─────────────            ────────────────────                  │
│  /dev/xvdb                /home/user/data                       │
│       │                        │                                │
│       ▼                         ▼                               │
│  Đại diện cho ổ đĩa       Folder để TRUY CẬP data               │
│  (như USB, ổ cứng)        (bạn tự tạo)                          │
│                                                                 │
│  Phải MOUNT để nối 2 thứ lại:                                   │
│  mount /dev/xvdb /home/user/data                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Device Name | Ý nghĩa |
|-------------|---------|
| `/dev/xvda` | Root volume (OS) - luôn là volume đầu tiên |
| `/dev/xvdb`, `/dev/xvdc`... | Data volumes bạn thêm vào |
| `/dev/sdf`, `/dev/sdg`... | Cách đặt tên cũ (AWS tự convert thành xvdf, xvdg) |

> 💡 Device Name = "Địa chỉ" của ổ đĩa trong OS, giống như Disk 0, Disk 1 trong Windows!

### Khi nào cần mount?

```
┌─────────────────────────────────────────────────────────────────┐
│                    KHI NÀO CẦN MOUNT?                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ ROOT VOLUME (/dev/xvda)                                     │
│     → AWS TỰ ĐỘNG mount vào /                                   │
│     → Bạn KHÔNG cần làm gì                                      │
│                                                                 │
│  2️⃣ DATA VOLUME MỚI (lần đầu attach)                            │
│     → Phải FORMAT + MOUNT tay (1 lần)                           │
│                                                                 │
│  3️⃣ DATA VOLUME ĐÃ CÓ DATA (attach lại)                         │
│     → Chỉ cần MOUNT (không format lại)                          │
│     → Hoặc config /etc/fstab để TỰ ĐỘNG mount                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Trường hợp | Cần mount tay? | Ghi chú |
|------------|----------------|---------|
| **Root volume** | ❌ Không | AWS tự động lo |
| **Data volume lần đầu** | ✅ Cần format + mount | Làm 1 lần duy nhất |
| **Data volume attach lại** | ✅ Cần mount (hoặc fstab) | Không cần format |
| **Reboot EC2** | ❌ Nếu có fstab | Tự động mount |

**Tự động mount với /etc/fstab:**

```bash
# Thêm vào /etc/fstab để tự động mount khi reboot
echo "/dev/xvdb /data xfs defaults,nofail 0 2" | sudo tee -a /etc/fstab

# Từ giờ mỗi lần EC2 restart → volume tự động mount!
```

---

### Vòng đời của EBS Volume

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Tạo mới    │ →  │   Attach    │ →  │   Format    │ →  │    Mount    │
│  (Available)│    │ (In-use)    │    │ (có FS)     │    │ (dùng được) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

### Trạng thái 1: Mới tạo, chưa Attach

```
AWS Console:
┌─────────────────────────────────────┐
│  Volume: vol-0abc123                │
│  State: available                   │  ← Đang "trôi nổi", chưa gắn vào đâu
│  Size: 100 GiB                      │
│  Attached to: -                     │  ← Không có instance
└─────────────────────────────────────┘

EC2 Instance:
$ lsblk
xvda    8G   ← Chỉ thấy root volume
              (không thấy volume 100GB)
```

**Ở trạng thái này:**
- Volume tồn tại trong AWS, bạn đang trả tiền
- Nhưng chưa dùng được vì chưa gắn vào EC2 nào
- Giống như mua ổ cứng nhưng chưa cắm vào máy tính

---

### Trạng thái 2: Đã Attach, chưa Format

```
AWS Console:
┌─────────────────────────────────────┐
│  Volume: vol-0abc123                │
│  State: in-use                      │  ← Đã gắn vào instance
│  Attached to: i-xyz789 (/dev/xvdb)  │
└─────────────────────────────────────┘

EC2 Instance:
$ lsblk
xvda    8G   ← Root volume
xvdb  100G   ← Volume mới xuất hiện!

$ sudo file -s /dev/xvdb
/dev/xvdb: data   ← "data" nghĩa là chưa có filesystem
```

**Ở trạng thái này:**
- EC2 thấy ổ cứng (`/dev/xvdb`)
- Nhưng **chưa lưu file được** vì chưa có filesystem
- Thử mount sẽ **bị lỗi**:

```bash
$ sudo mount /dev/xvdb /data
mount: /data: wrong fs type, bad option, bad superblock...
```

**Cần làm:** Format để tạo filesystem

```bash
$ sudo mkfs.ext4 /dev/xvdb
mke2fs 1.45.5 (07-Jan-2020)
Creating filesystem with 26214400 4k blocks...
Allocating group tables: done
Writing superblocks: done
```

---

### Trạng thái 3: Đã Format, chưa Mount

```
$ sudo file -s /dev/xvdb
/dev/xvdb: Linux rev 1.0 ext4 filesystem data   ← Đã có filesystem!

$ lsblk
xvda    8G   /        ← Root đã mount
xvdb  100G            ← Có ổ nhưng chưa mount (không có mount point)
```

**Ở trạng thái này:**
- Ổ cứng đã sẵn sàng lưu file
- Nhưng **chưa truy cập được** vì chưa có "cửa vào"
- Không có thư mục nào trỏ đến ổ này

```bash
$ cd /dev/xvdb
-bash: cd: /dev/xvdb: Not a directory   ← Không vào được như thư mục
```

**Cần làm:** Mount vào một thư mục

```bash
$ sudo mkdir /data
$ sudo mount /dev/xvdb /data
```

---

### Trạng thái 4: Đã Mount (sử dụng được)

```
$ lsblk
xvda    8G   /        ← Root volume
xvdb  100G  /data     ← Đã mount!

$ df -h
/dev/xvda    8G   2G   6G  25%  /
/dev/xvdb  100G   0G 100G   0%  /data   ← Thấy ổ 100GB
```

**Ở trạng thái này:**
- Truy cập `/data` = truy cập ổ 100GB
- Mọi file trong `/data` nằm trên EBS volume

```bash
$ cd /data
$ echo "hello" > test.txt    # Lưu vào EBS volume
$ ls -la
-rw-r--r-- 1 root root 6 Jan 24 10:00 test.txt
```

---

### Tổng hợp các trạng thái

| Trạng thái | EC2 thấy không? | Lưu file được? | Cần làm gì? |
|------------|-----------------|----------------|-------------|
| **Tạo mới, chưa attach** | ❌ Không | ❌ Không | Attach vào EC2 |
| **Attached, chưa format** | ✅ Thấy `/dev/xvdb` | ❌ Không | Format (`mkfs.ext4`) |
| **Formatted, chưa mount** | ✅ Thấy `/dev/xvdb` | ❌ Không | Mount vào thư mục |
| **Mounted** | ✅ Thấy `/dev/xvdb` | ✅ Được | Dùng thôi! |

---

### Lệnh đầy đủ từ đầu đến cuối

```bash
# 1. Sau khi attach từ AWS Console, kiểm tra
lsblk
# xvda    8G
# xvdb  100G   ← volume mới

# 2. Kiểm tra đã có filesystem chưa
sudo file -s /dev/xvdb
# Nếu output là "data" → chưa format
# Nếu output có "ext4 filesystem" → đã format, skip bước 3

# 3. Format (CHỈ với volume trống!)
sudo mkfs.ext4 /dev/xvdb

# 4. Tạo mount point
sudo mkdir /data

# 5. Mount
sudo mount /dev/xvdb /data

# 6. Kiểm tra
df -h | grep xvdb
# /dev/xvdb  100G   0G 100G   0%  /data

# 7. (Optional) Auto-mount khi reboot
echo '/dev/xvdb /data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
```

---

### Lưu ý quan trọng

| Trường hợp | Cần Format? |
|------------|-------------|
| Volume **mới tạo** (trống) | ✅ Cần |
| Volume từ **Snapshot** | ❌ Không (đã có filesystem + data) |
| **Root volume** | ❌ Không (AMI đã format sẵn) |
| **Detach rồi attach lại** | ❌ Không (filesystem vẫn còn) |

> ⚠️ **CẢNH BÁO:** Format volume đã có data → **MẤT HẾT DATA**!

---

## Data Lifecycle Manager (DLM)

**Amazon Data Lifecycle Manager** tự động hóa việc tạo, lưu giữ và xóa **EBS snapshots** và **EBS-backed AMIs** — không tốn thêm phí dịch vụ.

```
┌──────────────────────────────────────────────────────────────┐
│                DATA LIFECYCLE MANAGER (DLM)                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Bạn định nghĩa:                DLM tự động:                │
│  ─────────────────               ──────────────              │
│  Target tags                     Tạo snapshot/AMI theo lịch  │
│  Schedule (daily/weekly/...)     Xóa bản cũ khi hết hạn     │
│  Retention (giữ bao lâu)        Copy cross-region           │
│  Cross-region copy rules         Share cross-account         │
│                                                              │
│  Volume ──► [DLM Policy] ──► Snap₁ → Snap₂ → Snap₃ → ...   │
│  (tag: backup=true)              ▲         xóa ◄── retention │
│                                  │                           │
│                             tạo mới mỗi 12h                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Policy Types

| Loại | Target | Tạo ra | Ghi chú |
|------|--------|--------|---------|
| **EBS Snapshot Policy** | Volumes hoặc Instances | Snapshots | Phổ biến nhất |
| **EBS-backed AMI Policy** | Instances | AMIs | Bao gồm tất cả EBS volumes của instance |
| **Cross-account Copy Event Policy** | Shared snapshots | Snapshot copies | Tự copy snapshot được share từ account khác |

### Default Policy vs Custom Policy

| Feature | Default Policy | Custom Policy |
|---------|---------------|---------------|
| **Target** | Tất cả volumes/instances trong Region | Chỉ resources có **specific tags** |
| **Schedule** | Mỗi 1–7 ngày | Daily, weekly, monthly, yearly, hoặc **cron expression** |
| **Retention** | 2–14 ngày (age-based) | Tối đa 1000 snapshots (count) hoặc 100 năm (age) |
| **Số schedules** | 1 | Tối đa **4 schedules** per policy |
| **Fast Snapshot Restore** | ❌ | ✅ |
| **Snapshot Archiving** | ❌ | ✅ |
| **Cross-Region Copy** | ✅ (default settings) | ✅ (custom settings) |
| **Cross-Account Share** | ❌ | ✅ |
| **Pre/Post Scripts** | ❌ | ✅ (application-consistent snapshots) |
| **Giới hạn** | 1 per resource type per Region | 100 policies per Region |

### Cách hoạt động — Target Tags

Custom policy dùng **tags** để xác định resources cần backup:

```
Volume A (tag: backup=daily)  ──► DLM Policy "daily-backup"
Volume B (tag: backup=daily)  ──►   (target tag: backup=daily)
Volume C (tag: backup=weekly) ──► DLM Policy "weekly-backup"
Volume D (không có tag)       ──► Không được backup
```

> ⚠️ DLM **chỉ quản lý** snapshots/AMIs do chính nó tạo ra. Snapshots tạo thủ công hoặc bằng cách khác sẽ không bị DLM xóa.

### Ví dụ: Tạo Custom Snapshot Policy (CLI)

**Scenario:** Backup hàng ngày lúc 3:00 UTC, giữ 7 bản gần nhất, copy sang `eu-west-1`:

```bash
aws dlm create-lifecycle-policy \
  --description "Daily backup with cross-region copy" \
  --state ENABLED \
  --execution-role-arn arn:aws:iam::123456789012:role/AWSDataLifecycleManagerDefaultRole \
  --policy-details '{
    "PolicyType": "EBS_SNAPSHOT_MANAGEMENT",
    "ResourceTypes": ["VOLUME"],
    "TargetTags": [{"Key": "backup", "Value": "daily"}],
    "Schedules": [{
      "Name": "DailySnapshots",
      "CreateRule": {
        "Interval": 24,
        "IntervalUnit": "HOURS",
        "Times": ["03:00"]
      },
      "RetainRule": {
        "Count": 7
      },
      "CopyTags": true,
      "CrossRegionCopyRules": [{
        "TargetRegion": "eu-west-1",
        "Encrypted": true,
        "RetainRule": { "IntervalUnit": "DAYS", "Interval": 7 }
      }]
    }]
  }'
```

### Retention Types

```
Count-based (giữ N bản gần nhất):
══════════════════════════════════
Snap₁  Snap₂  Snap₃  Snap₄  Snap₅  Snap₆  Snap₇  Snap₈(mới)
 xóa ◄──────────────────────────────────────────────  giữ 7 bản

Age-based (giữ theo thời gian):
══════════════════════════════════
|◄── 30 ngày ──►|
Snap cũ hơn 30 ngày → xóa
Snap trong 30 ngày   → giữ
```

### Multiple Schedules

Một policy có thể có **tối đa 4 schedules** — ví dụ daily + weekly + monthly:

```
Policy "production-backup":
├── Schedule 1: Daily   — mỗi 24h, giữ 7 bản
├── Schedule 2: Weekly  — mỗi thứ 2, giữ 4 bản
└── Schedule 3: Monthly — ngày 1 hàng tháng, giữ 12 bản

Nếu 2 schedules chạy cùng lúc (VD: thứ 2 đầu tháng):
→ DLM chỉ tạo 1 snapshot
→ Áp dụng retention dài nhất (monthly = 12 tháng)
→ Gắn tags của cả 2 schedules
```

### Cross-Region & Cross-Account

```
Cross-Region Copy:
══════════════════
us-east-1               eu-west-1
┌──────────┐    copy    ┌──────────┐
│ Snapshot  │──────────►│ Copy     │
│ (source)  │           │ (DR)     │
└──────────┘            └──────────┘
  Retention: 7 ngày       Retention: riêng (có thể khác)
  Encryption: tuỳ         Encryption: có thể re-encrypt

Cross-Account Copy (Event Policy):
═══════════════════════════════════
Account A                Account B
┌──────────┐   share     ┌──────────────────┐
│ Snapshot  │───────────►│ Event Policy      │
│ + DLM     │            │ (tự copy khi     │
│           │            │  nhận được share) │
└──────────┘             └──────────────────┘
```

### DLM Tags tự động gắn

DLM tự gắn system tags lên mỗi snapshot/AMI:

| Tag | Mô tả |
|-----|-------|
| `aws:dlm:lifecycle-policy-id` | ID của policy tạo ra snapshot |
| `aws:dlm:lifecycle-schedule-name` | Tên schedule đã trigger |
| `aws:dlm:expirationTime` | Thời điểm xóa (age-based) |
| `dlm:managed` | Đánh dấu snapshot do DLM quản lý |

### Quotas

| Resource | Giới hạn |
|----------|---------|
| Custom policies per Region | 100 |
| Default policy for snapshots per Region | 1 |
| Default policy for AMIs per Region | 1 |
| Schedules per custom policy | 4 |
| Tags per resource | 45 |
| Cross-Region copy destinations | Tối đa 3 Regions |

> 📖 **Nguồn:** [Amazon Data Lifecycle Manager](https://docs.aws.amazon.com/ebs/latest/userguide/snapshot-lifecycle.html) · [Default vs Custom Policies](https://docs.aws.amazon.com/ebs/latest/userguide/policy-differences.html) · [Custom Snapshot Policy](https://docs.aws.amazon.com/ebs/latest/userguide/snapshot-ami-policy.html)

---

## EBS Pricing (Chi phí)

### Cách tính phí EBS

EBS tính phí theo **3 thành phần chính**:

```
Tổng chi phí = Storage + IOPS (nếu có) + Throughput (nếu có) + Snapshots
```

> [!IMPORTANT]
> **Per-Second Billing (từ 10/2017):**
> - **EBS Volume storage**: Tính theo giây (minimum 1 phút)
> - **Provisioned IOPS** (io1/io2): Tính theo giây
> - **EBS Snapshots**: Vẫn tính theo giờ

### 1. Storage (dung lượng)

Tính theo **GB-month** (số GB × số tháng sử dụng).

| Volume Type | Giá tham khảo (us-east-1) | Ghi chú |
|-------------|---------------------------|---------|
| **gp3** | ~$0.08/GB-month | Rẻ nhất cho SSD |
| **gp2** | ~$0.10/GB-month | Đắt hơn gp3 |
| **io2** | ~$0.125/GB-month | + phí IOPS |
| **io1** | ~$0.125/GB-month | + phí IOPS |
| **st1** | ~$0.045/GB-month | HDD, throughput |
| **sc1** | ~$0.015/GB-month | HDD, rẻ nhất |

### 2. IOPS (chỉ với io1, io2, gp3)

| Volume Type | Phí IOPS |
|-------------|----------|
| **gp3** | 3,000 IOPS miễn phí, thêm ~$0.005/IOPS-month |
| **io1/io2** | ~$0.065/IOPS-month |

### 3. Throughput (chỉ với gp3)

- **gp3**: 125 MiB/s miễn phí, thêm ~$0.04/MiB/s-month

### 4. Snapshots

| Loại | Giá |
|------|-----|
| Standard | ~$0.05/GB-month |
| Archive | ~$0.0125/GB-month (rẻ hơn 75%) |

### Ví dụ tính chi phí

**Scenario: Web server với database**

```
Root volume:  gp3, 20 GB
Data volume:  gp3, 100 GB, 5000 IOPS, 200 MiB/s
Snapshots:    50 GB

Chi phí/tháng:
┌─────────────────────────────────────────────────────┐
│ Root:     20 GB × $0.08           = $1.60           │
│ Data:     100 GB × $0.08          = $8.00           │
│ IOPS:     (5000-3000) × $0.005    = $10.00          │
│ Throughput: (200-125) × $0.04     = $3.00           │
│ Snapshots: 50 GB × $0.05          = $2.50           │
├─────────────────────────────────────────────────────┤
│ TỔNG:                             ≈ $25.10/tháng    │
└─────────────────────────────────────────────────────┘
```

### Lưu ý quan trọng về chi phí

| Điều cần biết | Chi tiết |
|---------------|----------|
| **Trả tiền khi chưa dùng** | Volume ở trạng thái `available` (chưa attach) vẫn tính phí |
| **Stop EC2 vẫn trả tiền EBS** | EC2 stop = không tính phí EC2, nhưng EBS vẫn tính |
| **Snapshot incremental** | Snapshot thứ 2 trở đi chỉ tính phần thay đổi |
| **Delete volume** | Xóa volume mới hết phí, chỉ stop EC2 thì không đủ |

### So sánh chi phí các volume type

```
Chi phí cho 100GB/tháng (chỉ storage):

sc1:  $1.50   ████
st1:  $4.50   ████████████
gp3:  $8.00   █████████████████████
gp2:  $10.00  ██████████████████████████
io2:  $12.50  ████████████████████████████████ (+ IOPS phí)
```

### Tips tiết kiệm chi phí

1. **Dùng gp3 thay gp2** - Rẻ hơn 20% và performance tốt hơn
2. **Xóa volume không dùng** - Kiểm tra volumes ở trạng thái `available`
3. **Xóa snapshots cũ** - Dùng DLM để tự động xóa
4. **Dùng sc1/st1** cho data ít truy cập
5. **Archive snapshots** cần giữ lâu (>90 ngày)

> 📖 **Giá chính xác:** [Amazon EBS Pricing](https://aws.amazon.com/ebs/pricing/) (giá thay đổi theo region và thời điểm)

---

## Best Practices

1. **Chọn đúng volume type** theo workload:
   - Boot volumes: gp3 (cost-effective)
   - Databases: io2 Block Express (high IOPS, durability)
   - Big data: st1 (throughput)

2. **Enable encryption** cho sensitive data

3. **Regular snapshots** với DLM policies

4. **Monitor với CloudWatch**: VolumeReadOps, VolumeWriteOps, BurstBalance

5. **Sử dụng EBS-optimized instances** để đạt full performance

---

## Liên kết

- [EC2](ec2.md) - EBS volumes được attach vào EC2 instances
- [VPC](vpc.md) - EBS volumes nằm trong một AZ của VPC

---

## Tham khảo

- [Amazon EBS User Guide](https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html)
- [EBS Volume Types](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html)
- [Amazon EBS Pricing](https://aws.amazon.com/ebs/pricing/)
