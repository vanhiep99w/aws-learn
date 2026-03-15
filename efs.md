# Amazon Elastic File System (EFS)


## Mục lục

- [EFS là gì?](#efs-là-gì)
- [Tại sao cần EFS?](#tại-sao-cần-efs)
- [EFS xử lý Concurrent Access như thế nào?](#efs-xử-lý-concurrent-access-như-thế-nào)
- [EBS Multi-Attach thì sao?](#ebs-multi-attach-thì-sao)
- [EFS vs S3 - Khác nhau hoàn toàn!](#efs-vs-s3-khác-nhau-hoàn-toàn)
- [Tóm lại các loại Storage](#tóm-lại-các-loại-storage)
- [So sánh EFS vs EBS vs Instance Store](#so-sánh-efs-vs-ebs-vs-instance-store)
- [EFS hoạt động như thế nào?](#efs-hoạt-động-như-thế-nào)
- [File System Types](#file-system-types)
- [Storage Classes](#storage-classes)
- [Performance Modes](#performance-modes)
- [Throughput Modes](#throughput-modes)
- [Mount EFS trên EC2](#mount-efs-trên-ec2)
- [Security](#security)
- [Use Cases](#use-cases)
- [EFS với các AWS Services khác](#efs-với-các-aws-services-khác)
- [Pricing](#pricing)
- [Hạn chế](#hạn-chế)
- [Tạo EFS qua CLI](#tạo-efs-qua-cli)
- [Liên kết với các dịch vụ khác](#liên-kết-với-các-dịch-vụ-khác)

---

## EFS là gì?

**Amazon EFS** là dịch vụ **file storage** được quản lý hoàn toàn (fully managed), cho phép chia sẻ file giữa nhiều EC2 instances cùng lúc.

## Tại sao cần EFS?

**Vấn đề**: Nhiều EC2 instances cần **đọc/ghi cùng 1 file**.

```
KHÔNG CÓ EFS (EBS chỉ gắn được 1 instance):

┌──────────┐     ┌──────────┐     ┌──────────┐
│   EC2    │     │   EC2    │     │   EC2    │
│  Server1 │     │  Server2 │     │  Server3 │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     ▼                ▼                ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│   EBS    │     │   EBS    │     │   EBS    │
│ /images  │     │ /images  │     │ /images  │
│ (copy 1) │     │ (copy 2) │     │ (copy 3) │
└──────────┘     └──────────┘     └──────────┘

❌ 3 bản copy khác nhau → KHÔNG ĐỒNG BỘ!


CÓ EFS:

┌──────────┐     ┌──────────┐     ┌──────────┐
│   EC2    │     │   EC2    │     │   EC2    │
│  Server1 │     │  Server2 │     │  Server3 │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     └────────────────┼────────────────┘
                      │
                      ▼
               ┌──────────────┐
               │     EFS      │
               │   /images    │
               │ (1 bản duy   │
               │   nhất)      │
               └──────────────┘

✅ Tất cả đọc/ghi cùng 1 file → ĐỒNG BỘ!
```

### Ví dụ thực tế

**Website WordPress với nhiều servers:**
```
User upload ảnh lên Server1
        │
        ▼
┌─────────────────────────────────────────────────────┐
│                      EFS                            │
│              /var/www/html/uploads/                 │
│                   image.jpg                         │
└─────────────────────────────────────────────────────┘
        │
        ├──► Server1: thấy image.jpg ✅
        ├──► Server2: thấy image.jpg ✅
        └──► Server3: thấy image.jpg ✅

Nếu dùng EBS: User upload lên Server1, Server2 và Server3 KHÔNG thấy file!
```

## EFS xử lý Concurrent Access như thế nào?

EFS dùng **NFS protocol** với file locking, tránh data corruption:

```
Instance 1: Muốn ghi file A
Instance 2: Muốn ghi file A (cùng lúc)

        │               │
        ▼               ▼
┌─────────────────────────────────────┐
│              EFS                    │
│                                     │
│  NFS Lock Manager:                  │
│  ┌───────────────────────────────┐  │
│  │ file A: LOCKED by Instance 1  │  │
│  │                               │  │
│  │ Instance 2: CHỜ...            │  │
│  └───────────────────────────────┘  │
│                                     │
│  1. Instance 1 ghi xong → unlock    │
│  2. Instance 2 được lock → ghi      │
│                                     │
└─────────────────────────────────────┘

→ Không corrupt vì ghi TUẦN TỰ
```

## EBS Multi-Attach thì sao?

EBS có Multi-Attach nhưng **rất hạn chế**:

```
EBS Multi-Attach:                    EFS:
┌────────────────────────┐          ┌────────────────────────────────┐
│    CHỈ TRONG 1 AZ      │          │      ACROSS NHIỀU AZs          │
│                        │          │                                │
│  ┌────┐ ┌────┐ ┌────┐  │          │  AZ-a    AZ-b    AZ-c          │
│  │EC2 │ │EC2 │ │EC2 │  │          │  ┌────┐  ┌────┐  ┌────┐        │
│  └──┬─┘ └──┬─┘ └──┬─┘  │          │  │EC2 │  │EC2 │  │EC2 │        │
│     └──────┼──────┘    │          │  └──┬─┘  └──┬─┘  └──┬─┘        │
│            ▼           │          │     └──────┼──────┘           │
│     ┌───────────┐      │          │            ▼                  │
│     │EBS io1/io2│      │          │     ┌───────────┐             │
│     └───────────┘      │          │     │    EFS    │             │
└────────────────────────┘          │     └───────────┘             │
                                    └────────────────────────────────┘
```

| | EBS Multi-Attach | EFS |
|---|------------------|-----|
| Across AZs | ❌ Chỉ 1 AZ | ✅ Nhiều AZs |
| Volume type | Chỉ io1/io2 (đắt) | Tất cả |
| Max instances | 16 | Hàng nghìn |
| File locking | ❌ Cần cluster filesystem | ✅ Tự động (NFS) |
| Dễ dùng | ❌ Phức tạp | ✅ Mount như folder |

> 📌 **Thực tế**: 99% cần shared storage → dùng EFS. EBS Multi-Attach chỉ cho clustered databases đặc biệt.

## EFS vs S3 - Khác nhau hoàn toàn!

```
┌─────────────────────────────────────────────────────────────────┐
│                           S3                                    │
│                     (Object Storage)                            │
│                                                                 │
│   Truy cập qua: HTTP API (GET, PUT, DELETE)                     │
│                                                                 │
│   aws s3 cp s3://bucket/image.jpg ./image.jpg                   │
│                                                                 │
│   ❌ KHÔNG mount như folder được                                │
│   ❌ Sửa file = download → sửa → upload lại                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           EFS                                   │
│                      (File Storage)                             │
│                                                                 │
│   Truy cập qua: Mount như folder bình thường                    │
│                                                                 │
│   mount -t efs fs-xxx:/ /mnt/efs                                │
│   ls /mnt/efs/                                                  │
│   vim /mnt/efs/config.txt                                       │
│                                                                 │
│   ✅ Dùng như ổ cứng bình thường                                │
│   ✅ Sửa file trực tiếp                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| | S3 | EFS |
|---|-----|-----|
| Truy cập | HTTP API | Mount như folder |
| Sửa 1 phần file | ❌ Download → sửa → upload | ✅ Sửa trực tiếp |
| App cần file path | ❌ Phải đổi code | ✅ Dùng luôn /mnt/efs/... |
| Random access | ❌ Không | ✅ Có |
| Cost | Rẻ hơn | Đắt hơn |

### Ví dụ chọn S3 hay EFS

| Tình huống | Dùng |
|------------|------|
| WordPress uploads | **EFS** - mount vào /uploads, không đổi code |
| App đọc config /etc/myapp/config.yaml | **EFS** - app đọc file bình thường |
| Video editing (đọc/ghi random trong file) | **EFS** - cần random access |
| Backup 10TB ảnh (ít truy cập) | **S3** - rẻ hơn nhiều |
| Static website hosting | **S3** - có tính năng hosting |

## Tóm lại các loại Storage

| Storage | Giống như | Use case |
|---------|-----------|----------|
| **S3** | Google Drive (upload/download) | Backup, static files, data lake |
| **EFS** | Ổ cứng mạng (NAS) | App cần file path, shared config |
| **EBS** | Ổ cứng USB | Database, OS, 1 instance |

## So sánh EFS vs EBS vs Instance Store

```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│                │     EBS        │     EFS        │ Instance Store │
├────────────────┼────────────────┼────────────────┼────────────────┤
│ Loại storage   │ Block storage  │ File storage   │ Block storage  │
│ Mount từ       │ 1 instance*    │ Nhiều instances│ 1 instance     │
│ Across AZs     │ ❌ Không       │ ✅ Có          │ ❌ Không       │
│ Auto scaling   │ ❌ Phải resize │ ✅ Tự động     │ ❌ Cố định     │
│ Data persist   │ ✅ Có          │ ✅ Có          │ ❌ Mất khi stop│
│ Protocol       │ Block (attach) │ NFS v4.1       │ Block (local)  │
│ Use case       │ Database, OS   │ Shared files   │ Cache, temp    │
└────────────────┴────────────────┴────────────────┴────────────────┘

* EBS io1/io2 hỗ trợ Multi-Attach nhưng giới hạn trong cùng 1 AZ
```

## EFS hoạt động như thế nào?

### Mount Target là gì?

**Mount Target** = Điểm kết nối để EC2 truy cập vào EFS. Nó có **IP address** trong subnet của bạn.

```
Giống như ổ cứng mạng ở nhà:

Ở nhà:
┌──────────┐         ┌──────────┐
│  Laptop  │──WiFi──►│   NAS    │  ← NAS có IP 192.168.1.100
│          │         │ (ổ mạng) │
└──────────┘         └──────────┘

Trên AWS:
┌──────────┐         ┌──────────────┐         ┌──────────┐
│   EC2    │──VPC───►│ Mount Target │────────►│   EFS    │
│          │         │(IP: 10.0.1.50)│         │          │
└──────────┘         └──────────────┘         └──────────┘
```

### Tại sao cần Mount Target?

```
EC2 muốn đọc file từ EFS
        │
        ▼
Phải kết nối qua NETWORK (NFS protocol)
        │
        ▼
Cần 1 IP address để kết nối đến
        │
        ▼
Mount Target cung cấp IP đó (10.0.1.50)
        │
        ▼
EC2 mount: mount -t nfs 10.0.1.50:/ /mnt/efs
```

### Mount Target trong mỗi AZ

Để EC2 ở các AZ khác nhau đều truy cập được EFS, tạo **Mount Target trong mỗi AZ**:

```
┌─────────────────────────────────────────────────────────────────┐
│                           VPC                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                        EFS File System                      ││
│  └─────────────────────────────────────────────────────────────┘│
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │Mount Target │      │Mount Target │      │Mount Target │      │
│  │ 10.0.1.50   │      │ 10.0.2.50   │      │ 10.0.3.50   │      │
│  │   (AZ-a)    │      │   (AZ-b)    │      │   (AZ-c)    │      │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘      │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │    EC2      │      │    EC2      │      │    EC2      │      │
│  │  (AZ-a)     │      │  (AZ-b)     │      │  (AZ-c)     │      │
│  └─────────────┘      └─────────────┘      └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Best Practice

| Rule | Lý do |
|------|-------|
| Tạo Mount Target trong **mỗi AZ** | High availability |
| EC2 mount từ Mount Target **cùng AZ** | Nhanh hơn + không tốn data transfer |
| EC2 có thể mount từ **AZ khác** | Nhưng chậm hơn + tốn phí |

```
EC2 ở AZ-a → Mount từ Mount Target ở AZ-a ✅ (nhanh, miễn phí)
EC2 ở AZ-a → Mount từ Mount Target ở AZ-b ⚠️ (chậm hơn, tốn phí cross-AZ)
```

### Mount Target có mất phí không?

**Không!** Mount Target **miễn phí**. Cứ tạo ở mỗi AZ.

| Thành phần | Có phí? |
|------------|---------|
| Mount Target | ❌ Miễn phí |
| Storage (GB/tháng) | ✅ Có |
| Data transfer cross-AZ | ✅ Có |

## File System Types

### Regional (Khuyến nghị)

AWS **tự động replicate** data qua nhiều AZs (bạn không thấy, không quản lý):

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS (behind the scenes)                 │
│                                                                 │
│   AZ-a              AZ-b              AZ-c                      │
│   ┌──────┐          ┌──────┐          ┌──────┐                  │
│   │ Data │◄────────►│ Data │◄────────►│ Data │                  │
│   │(copy)│   sync   │(copy)│   sync   │(copy)│                  │
│   └──────┘          └──────┘          └──────┘                  │
│                                                                 │
│   AWS TỰ ĐỘNG sync - Bạn KHÔNG thấy, KHÔNG quản lý              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Bạn thấy (từ góc nhìn user)                  │
│                                                                 │
│                 ┌─────────────────────┐                         │
│                 │    1 EFS duy nhất   │                         │
│                 │    /my-files/       │                         │
│                 └─────────────────────┘                         │
│                                                                 │
│   Ghi file → AWS lo replicate qua các AZs                       │
│   1 AZ down → Vẫn hoạt động ✅                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### One Zone

Data **chỉ lưu trong 1 AZ**, nhưng **vẫn share được** từ EC2 ở AZ khác:

```
┌──────────────────────────────────────────────────────────────────┐
│                       One Zone EFS (ở AZ-a)                      │
│                                                                  │
│   AZ-a                    AZ-b                    AZ-c           │
│   ┌──────────────┐        ┌──────────────┐        ┌─────────────┐│
│   │ ┌──────────┐ │        │              │        │             ││
│   │ │EFS Data  │ │        │  (không có   │        │ (không có   ││
│   │ │(chỉ đây) │ │        │   data)      │        │  data)      ││
│   │ └────┬─────┘ │        │              │        │             ││
│   │      │       │        │              │        │             ││
│   │ ┌────▼─────┐ │        │              │        │             ││
│   │ │  Mount   │◄┼────────┼──────────────┼────────┼──────────── ││
│   │ │  Target  │ │        │  cross-AZ    │        │  cross-AZ   ││
│   │ └────┬─────┘ │        │  traffic     │        │  traffic    ││
│   │      │       │        │      │       │        │     │       ││
│   │      ▼       │        │      ▼       │        │     ▼       ││
│   │ ┌────────┐   │        │ ┌────────┐   │        │ ┌────────┐  ││
│   │ │  EC2   │   │        │ │  EC2   │   │        │ │  EC2   │  ││
│   │ └────────┘   │        │ └────────┘   │        │ └────────┘  ││
│   └──────────────┘        └──────────────┘        └─────────────┘│
│                                                                  │
│   EC2 ở AZ-b, AZ-c VẪN TRUY CẬP ĐƯỢC (qua network cross-AZ)      │
│   ⚠️ AZ-a down = KHÔNG truy cập được data                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### So sánh Regional vs One Zone

| | Regional | One Zone |
|---|----------|----------|
| Data lưu ở đâu | Replicate qua nhiều AZs | Chỉ 1 AZ |
| EC2 ở AZ khác truy cập được? | ✅ Được | ✅ Được (qua network) |
| 1 AZ down | Vẫn OK | ❌ Không truy cập được |
| Mount Target | Mỗi AZ có 1 | Chỉ 1 ở AZ chứa data |
| Cost | Đắt hơn | Rẻ hơn ~47% |
| Use case | Production, critical | Dev/test, có thể recreate |

## Storage Classes

**Storage Classes** = Các **loại lưu trữ** với giá và tốc độ khác nhau, để tiết kiệm tiền.

```
Ý tưởng đơn giản:

File truy cập thường xuyên → Lưu ở chỗ NHANH → ĐẮT
File ít truy cập          → Lưu ở chỗ CHẬM  → RẺ
```

### Ví dụ thực tế

```
Công ty bạn có 1TB files trong EFS:

├── 200GB: Code, config (dùng hàng ngày)     → Cần NHANH
├── 500GB: Logs tháng trước (xem đôi khi)    → Chậm chút OK
└── 300GB: Logs năm ngoái (gần như ko xem)   → Chậm cũng được
```

### 3 Storage Classes

```
┌─────────────────┐
│    Standard     │  ← Files dùng hàng ngày
│   (nhanh, đắt)  │     $0.30/GB/tháng
└────────┬────────┘
         │
         │  30 ngày không ai mở
         ▼
┌─────────────────┐
│ Infrequent      │  ← Files ít dùng
│ Access (IA)     │     $0.016/GB/tháng (rẻ hơn 92%)
│ (chậm hơn, rẻ)  │
└────────┬────────┘
         │
         │  90 ngày không ai mở
         ▼
┌─────────────────┐
│    Archive      │  ← Files gần như không dùng
│(chậm nhất, rẻ   │     $0.008/GB/tháng (rẻ nhất)
│     nhất)       │
└─────────────────┘
```

### So sánh chi phí

| | Standard | IA | Archive |
|---|----------|-----|---------|
| Giá storage | $0.30/GB | $0.016/GB | $0.008/GB |
| Giá access | Miễn phí | $0.01/GB | $0.03-0.06/GB |
| Tốc độ | Nhanh nhất | Chậm hơn | Chậm nhất |
| Dùng cho | Files dùng thường xuyên | Files ít dùng | Files gần như không dùng |

### Lifecycle Management

EFS **tự động chuyển** files giữa storage classes dựa trên access pattern. Bạn không cần tự move files:

```
File "report.pdf" tạo ngày 1/1

Ngày 1-30:   Standard  ($0.30)   ← mới tạo
Ngày 31-90:  IA        ($0.016)  ← 30 ngày không ai mở → tự động chuyển
Ngày 91+:    Archive   ($0.008)  ← 90 ngày không ai mở → tự động chuyển

Ngày 100: Có người mở → Tự động chuyển về Standard (nếu cấu hình)
```

### Ví dụ tiết kiệm cost

```
Có 1TB data trong EFS:
├── 200GB: Truy cập hàng ngày
├── 500GB: Truy cập vài lần/tháng  
└── 300GB: Không truy cập cả năm

KHÔNG có Lifecycle (tất cả ở Standard):
└── 1TB × $0.30 = $300/tháng

CÓ Lifecycle (tự động chuyển):
├── 200GB Standard × $0.30 = $60
├── 500GB IA × $0.016 = $8
└── 300GB Archive × $0.008 = $2.4
└── Total = $70.4/tháng

Tiết kiệm: $230/tháng (~77%)
```

### Cấu hình Lifecycle Policy

```bash
aws efs put-lifecycle-configuration \
    --file-system-id fs-12345678 \
    --lifecycle-policies \
        TransitionToIA=AFTER_30_DAYS \
        TransitionToArchive=AFTER_90_DAYS \
        TransitionToPrimaryStorageClass=AFTER_1_ACCESS
```

| Policy | Ý nghĩa |
|--------|---------|
| `TransitionToIA=AFTER_30_DAYS` | Sau 30 ngày không access → chuyển sang IA |
| `TransitionToArchive=AFTER_90_DAYS` | Sau 90 ngày không access → chuyển sang Archive |
| `TransitionToPrimaryStorageClass=AFTER_1_ACCESS` | Khi access lại → chuyển về Standard |

### Lưu ý

| Lưu ý | Chi tiết |
|-------|----------|
| Minimum storage duration | Archive: 90 ngày (tính phí dù xóa sớm) |
| Minimum file size | IA/Archive: 128KB (file nhỏ hơn vẫn tính 128KB) |
| Access cost | IA/Archive có phí khi đọc/ghi - đừng dùng cho files truy cập thường xuyên |

> 📌 **Best Practice**: Bật Lifecycle Management để tự động tiết kiệm cost. Không cần quản lý thủ công.

## Performance Modes

**Performance Mode** quyết định **latency** và **số connections** - chọn khi tạo EFS, **không đổi được**.

```
Giống như loại đường:

General Purpose: Đường 4 làn, ít xe → nhanh, mượt
Max I/O: Đường 20 làn, nhiều xe → chậm hơn nhưng chứa được nhiều
```

| | General Purpose | Max I/O |
|---|-----------------|---------|
| Latency | Thấp (sub-millisecond) | Cao hơn |
| Max connections | Hàng nghìn | Hàng chục nghìn |
| Use case | Web, CMS, home dirs | Big data, media processing |
| Khuyến nghị | ✅ 99% trường hợp | Chỉ khi cần rất nhiều connections |

> ⚠️ **Lưu ý**: Sau khi tạo EFS, **không thể đổi** Performance Mode. Phải tạo EFS mới.

## Throughput Modes

**Throughput Mode** quyết định **tốc độ đọc/ghi (MB/s)** - có thể đổi sau khi tạo.

```
Throughput = Tốc độ truyền data

Throughput 100 MB/s → Đọc file 1GB mất 10 giây
Throughput 1 GB/s   → Đọc file 1GB mất 1 giây
```

### So sánh Performance Mode vs Throughput Mode

| | Performance Mode | Throughput Mode |
|---|------------------|-----------------|
| Quyết định gì? | Latency + số connections | Tốc độ đọc/ghi (MB/s) |
| Đổi được không? | ❌ Không | ✅ Có |
| Options | General Purpose, Max I/O | Elastic, Bursting, Provisioned |

### 3 Throughput Modes

```
Elastic (khuyến nghị):
       ▲
   10GB│                    ┌────┐
       │        ┌───────────┘    └───┐
    1GB│────────┘                    └────────
       └──────────────────────────────────────► Time
       Tự động tăng/giảm theo nhu cầu
       Trả tiền theo thực tế


Bursting:
       ▲
       │   ┌─┐        ┌─┐
       │   │ │        │ │   Burst khi cần
   ────┼───┴─┴────────┴─┴──────────────────
       │   Baseline (dựa trên storage size)
       └──────────────────────────────────────► Time
       Miễn phí (gồm trong storage cost)


Provisioned:
       ▲
  500MB│────────────────────────────────────
       │   Cố định, luôn có sẵn
       └──────────────────────────────────────► Time
       Trả phí cố định hàng tháng
```

| Mode | Throughput | Trả tiền | Dùng khi |
|------|------------|----------|----------|
| **Elastic** | Tự động scale | Theo thực tế | Không biết cần bao nhiêu |
| **Bursting** | Dựa trên size | Gồm trong storage | EFS nhỏ, tiết kiệm |
| **Provisioned** | Cố định | Cố định/tháng | Cần throughput ổn định |

> 📌 **99% trường hợp**: Chọn **General Purpose** + **Elastic** là xong.

## Mount EFS trên EC2

### Cài đặt EFS Utils

```bash
# Amazon Linux 2023
sudo dnf install -y amazon-efs-utils

# Amazon Linux 2
sudo yum install -y amazon-efs-utils

# Ubuntu
sudo apt-get install -y amazon-efs-utils
```

### Mount EFS

```bash
# Mount bằng EFS mount helper (khuyến nghị)
sudo mount -t efs fs-12345678:/ /mnt/efs

# Mount với encryption in transit (TLS)
sudo mount -t efs -o tls fs-12345678:/ /mnt/efs

# Mount bằng NFS (nếu không có efs-utils)
sudo mount -t nfs4 -o nfsvers=4.1 \
    fs-12345678.efs.us-east-1.amazonaws.com:/ /mnt/efs
```

### Auto mount khi boot (/etc/fstab)

```bash
# Thêm vào /etc/fstab
fs-12345678:/ /mnt/efs efs defaults,_netdev 0 0

# Với encryption
fs-12345678:/ /mnt/efs efs tls,_netdev 0 0
```

## Security

### Security Groups

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  EC2 Instance                    Mount Target                   │
│  ┌───────────────┐              ┌───────────────┐               │
│  │ SG: sg-ec2    │──── NFS ────►│ SG: sg-efs    │               │
│  │               │   Port 2049  │               │               │
│  └───────────────┘              └───────────────┘               │
│                                                                 │
│  sg-efs Inbound Rule:                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Type: NFS                                               │    │
│  │ Port: 2049                                              │    │
│  │ Source: sg-ec2  (Security Group của EC2)                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Encryption

| Loại | Mô tả |
|------|-------|
| **At rest** | Data được encrypt khi lưu trên disk (dùng KMS) |
| **In transit** | Data được encrypt khi truyền qua network (TLS) |

```bash
# Mount với encryption in transit
sudo mount -t efs -o tls fs-12345678:/ /mnt/efs
```

### Access Points

**Access Points** = Cổng vào EFS với **permissions và root directory riêng** cho mỗi application.

```
KHÔNG có Access Points:

EFS /
├── /app1/
├── /app2/
└── /shared/

Tất cả apps đều thấy toàn bộ EFS → Rủi ro!
App1 có thể xóa data của App2 💥


CÓ Access Points:

EFS /
├── /app1/  ◄── Access Point 1 (chỉ App1 thấy)
├── /app2/  ◄── Access Point 2 (chỉ App2 thấy)
└── /shared/ ◄── Access Point 3 (cả 2 apps thấy)

Mỗi app chỉ thấy folder của mình → An toàn!
```

**Ví dụ với Containers:**

```
┌─────────────────────────────────────────────────────────────────┐
│                           EFS                                   │
│                            /                                    │
│       ┌────────────────────┼────────────────────┐               │
│       │                    │                    │               │
│    /wordpress/          /api/              /logs/               │
│       │                    │                    │               │
│       ▲                    ▲                    ▲               │
│       │                    │                    │               │
│  Access Point 1       Access Point 2       Access Point 3       │
│  (uid=1001)           (uid=1002)           (uid=1003)           │
│       │                    │                    │               │
│       ▼                    ▼                    ▼               │
│  ┌─────────┐          ┌─────────┐          ┌─────────┐          │
│  │WordPress│          │ API     │          │ Logging │          │
│  │Container│          │Container│          │Container│          │
│  └─────────┘          └─────────┘          └─────────┘          │
│                                                                 │
│  WordPress thấy /wordpress/ như là root (/)                     │
│  Không thấy /api/ hay /logs/                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Access Point config:**

| Config | Ý nghĩa |
|--------|---------|
| Root directory | Folder nào app được thấy (ví dụ: /app1/) |
| POSIX user (uid/gid) | App chạy với user nào (ví dụ: uid=1001) |
| Permissions | Quyền đọc/ghi |

**Tạo Access Point:**

```bash
aws efs create-access-point \
    --file-system-id fs-12345678 \
    --posix-user Uid=1001,Gid=1001 \
    --root-directory "Path=/wordpress,CreationInfo={OwnerUid=1001,OwnerGid=1001,Permissions=755}"
```

> 📌 **Dùng khi**: Nhiều apps/containers share 1 EFS, cần isolation giữa chúng.

## Use Cases

| Use Case | Tại sao dùng EFS? |
|----------|-------------------|
| **Web serving** | Nhiều web servers share cùng content |
| **CMS (WordPress, Drupal)** | Shared uploads, themes, plugins |
| **Home directories** | User files accessible từ nhiều instances |
| **Container storage** | ECS/EKS tasks share data |
| **Lambda** | Serverless functions cần file system |
| **Machine Learning** | Training data shared giữa nhiều instances |
| **Big Data** | Analytics trên shared dataset |

## EFS với các AWS Services khác

```
┌─────────────────────────────────────────────────────────────────┐
│                         Amazon EFS                              │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│   ┌──────────┐        ┌──────────┐        ┌──────────┐          │
│   │   EC2    │        │   ECS    │        │  Lambda  │          │
│   │          │        │   EKS    │        │          │          │
│   └──────────┘        └──────────┘        └──────────┘          │
│                                                                 │
│   ┌──────────┐        ┌──────────┐        ┌──────────┐          │
│   │ On-prem  │        │   AWS    │        │ DataSync │          │
│   │ (Direct  │        │  Backup  │        │          │          │
│   │ Connect) │        │          │        │          │          │
│   └──────────┘        └──────────┘        └──────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Pricing

| Thành phần | Chi phí (us-east-1) |
|------------|---------------------|
| **Standard storage** | $0.30/GB/tháng |
| **IA storage** | $0.016/GB/tháng |
| **Archive storage** | $0.008/GB/tháng |
| **IA access** | $0.01/GB đọc/ghi |
| **Archive access** | $0.03/GB đọc, $0.06/GB ghi |
| **Elastic Throughput** | $0.04/GB transferred |

> 📌 One Zone storage classes rẻ hơn ~47% so với Regional

## Hạn chế

| Hạn chế | Chi tiết |
|---------|----------|
| **Không hỗ trợ Windows** | Chỉ Linux-based instances |
| **Chi phí cao hơn EBS** | Đổi lại được shared access |
| **Latency cao hơn EBS** | Vì qua network (NFS) |
| **Chỉ trong 1 VPC** | Một file system chỉ có mount targets trong 1 VPC |

## Tạo EFS qua CLI

```bash
# Tạo file system
aws efs create-file-system \
    --performance-mode generalPurpose \
    --throughput-mode elastic \
    --encrypted \
    --tags Key=Name,Value=my-efs

# Tạo mount target trong mỗi subnet
aws efs create-mount-target \
    --file-system-id fs-12345678 \
    --subnet-id subnet-aaaaaaaa \
    --security-groups sg-xxxxxxxx
```

## Liên kết với các dịch vụ khác

- [EC2](ec2.md) - Mount EFS trên EC2 instances
- [EBS](ebs.md) - So sánh block storage vs file storage
- [VPC](vpc.md) - EFS mount targets nằm trong VPC subnets
- [Security Groups](security-groups.md) - Bảo vệ access đến EFS

---

**Nguồn tham khảo:**
- [What is Amazon EFS? - AWS Documentation](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- [How Amazon EFS works - AWS Documentation](https://docs.aws.amazon.com/efs/latest/ug/how-it-works.html)
- [EFS Storage Classes - AWS](https://aws.amazon.com/efs/storage-classes/)
