# AWS Storage Gateway

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Các loại Gateway](#các-loại-gateway)
- [S3 File Gateway](#s3-file-gateway)
- [FSx File Gateway](#fsx-file-gateway)
- [Volume Gateway](#volume-gateway)
- [Tape Gateway](#tape-gateway)
- [So sánh các loại Gateway](#so-sánh-các-loại-gateway)
- [Deployment Options](#deployment-options)
- [Use Cases](#use-cases)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Giới thiệu

**AWS Storage Gateway** là dịch vụ **hybrid cloud storage** kết nối môi trường on-premises với AWS cloud storage. Nó cung cấp một **gateway (cầu nối)** được cài đặt tại data center của bạn, cho phép ứng dụng on-premises sử dụng AWS storage một cách liền mạch.

### Vấn đề cần giải quyết

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    KHÔNG có Storage Gateway                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   On-Premises                              AWS Cloud                         │
│                                                                              │
│   ┌─────────────┐                         ┌─────────────┐                    │
│   │   App       │   ❌ Không biết S3      │     S3      │                    │
│   │  (dùng NFS) │   ❌ Cần rewrite app    └─────────────┘                    │
│   └─────────────┘   ❌ Phức tạp                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    CÓ Storage Gateway                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   On-Premises                              AWS Cloud                         │
│                                                                              │
│   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐                   │
│   │   App       │────►│   Storage    │────►│     S3      │                   │
│   │  (dùng NFS) │ NFS │   Gateway    │HTTPS│             │                   │
│   └─────────────┘     └──────────────┘     └─────────────┘                   │
│                                                                              │
│   ✅ App không cần thay đổi                                                  │
│   ✅ Gateway translate NFS → S3                                              │
│   ✅ Local cache cho low latency                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Lợi ích chính

| Lợi ích | Mô tả |
|---------|-------|
| **Hybrid storage** | Kết nối on-prem với AWS storage |
| **Protocol translation** | NFS, SMB, iSCSI → S3, EBS, Glacier |
| **Local caching** | Low latency access cho frequently used data |
| **No app changes** | Ứng dụng on-prem không cần modify |
| **Cost effective** | Chỉ lưu hot data local, cold data trên AWS |

### ⚠️ Hiểu đúng về Storage Gateway

> [!IMPORTANT]
> **Storage Gateway là CẦU NỐI LIÊN TỤC, không phải tool migrate data một lần!**

#### Gateway làm gì?

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         TRƯỚC (không có Gateway)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   App  ────ghi file────►  NAS/Storage On-Premises                            │
│                                (data ở đây)                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

                              ▼▼▼

┌──────────────────────────────────────────────────────────────────────────────┐
│                         SAU (có Gateway)                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   App  ────ghi file────►  Storage Gateway  ────sync────►  S3                 │
│                           (cache ở đây)       (data ở đây!)                  │
│                                                                              │
│   📍 App không biết gì - vẫn tưởng đang ghi vào ổ cứng local                 │
│   📍 Gateway làm phiên dịch - nhận file → upload lên S3                      │
│   📍 Cache local - data hay đọc được giữ lại để truy cập nhanh               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Data cũ ở On-Premises thì sao?

> [!WARNING]
> **Gateway KHÔNG tự động migrate data cũ!** Data cũ cần được migrate riêng.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│           Data cũ ở On-Premises - Cần MIGRATE riêng!                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   On-Premises                              AWS Cloud                         │
│                                                                              │
│   ┌─────────────┐                                                            │
│   │  Data cũ    │  ──── Cần dùng tool khác ────►  S3                         │
│   │  (50TB)     │                                                            │
│   └─────────────┘                                                            │
│                                                                              │
│   Tools để migrate data cũ:                                                  │
│   ├── AWS DataSync (qua mạng, nhanh, tự động sync)                           │
│   ├── Snow Family (ship ổ cứng vật lý, cho data rất lớn)                     │
│   └── Copy qua Gateway (chậm, nhưng được)                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Nếu dùng Gateway mà chưa migrate data cũ?

> [!CAUTION]
> **Bạn sẽ KHÔNG thấy data cũ qua Gateway!** Gateway chỉ hiển thị data có trong S3.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│        Chưa migrate → Không thấy data cũ qua Gateway!                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   On-Premises                          AWS Cloud                             │
│                                                                              │
│   ┌─────────────┐                      ┌─────────────┐                       │
│   │  Data cũ    │   ❌ KHÔNG kết nối   │     S3      │                       │
│   │  (50TB)     │                      │   (trống)   │                       │
│   └─────────────┘                      └─────────────┘                       │
│                                               ▲                              │
│                                               │                              │
│                         ┌─────────────┐       │                              │
│   App mount ──────────► │   Gateway   │───────┘                              │
│                         └─────────────┘                                      │
│                                                                              │
│   App thấy gì? → TRỐNG! (vì S3 bucket trống)                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Trường hợp | App thấy gì qua Gateway? |
|------------|--------------------------|
| S3 trống (chưa migrate) | **Trống** - không thấy gì |
| S3 có data (đã migrate) | **Thấy hết** data trong S3 |

#### Quy trình triển khai đầy đủ

| Bước | Làm gì | Tool |
|------|--------|------|
| **1** | Migrate data cũ lên S3 | **DataSync** hoặc **Snow Family** |
| **2** | Cài Storage Gateway | Gateway VM/Appliance |
| **3** | Config Gateway point tới S3 bucket | AWS Console |
| **4** | Mount Gateway trên app | NFS/SMB mount |
| **5** | App đọc data cũ + ghi data mới | Tất cả qua Gateway → S3 |

---

## Các loại Gateway

AWS Storage Gateway có **4 loại chính**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AWS Storage Gateway Types                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                        FILE GATEWAYS                                │    │
│   │                                                                     │    │
│   │   ┌─────────────────────┐     ┌─────────────────────┐               │    │
│   │   │   S3 File Gateway   │     │  FSx File Gateway   │               │    │
│   │   │                     │     │                     │               │    │
│   │   │   NFS/SMB → S3      │     │   SMB → FSx Windows │               │    │
│   │   └─────────────────────┘     └─────────────────────┘               │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                       VOLUME GATEWAY                                │    │
│   │                                                                     │    │
│   │   ┌─────────────────────┐     ┌─────────────────────┐               │    │
│   │   │   Cached Volumes    │     │   Stored Volumes    │               │    │
│   │   │                     │     │                     │               │    │
│   │   │   iSCSI → S3        │     │   iSCSI → S3        │               │    │
│   │   │   (hot data local)  │     │   (all data local)  │               │    │
│   │   └─────────────────────┘     └─────────────────────┘               │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                        TAPE GATEWAY                                 │    │
│   │                                                                     │    │
│   │   ┌───────────────────────────────────────────────────────────────┐ │    │
│   │   │   Virtual Tape Library (VTL)                                  │ │    │
│   │   │                                                               │ │    │
│   │   │   iSCSI → S3/Glacier                                          │ │    │
│   │   │   (Thay thế physical tape)                                    │ │    │
│   │   └───────────────────────────────────────────────────────────────┘ │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## S3 File Gateway

**S3 File Gateway** cho phép lưu trữ files như objects trong S3, trong khi cung cấp file interface (NFS/SMB) cho on-premises applications.

### Cách hoạt động

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          S3 File Gateway                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   On-Premises                                           AWS Cloud            │
│                                                                              │
│   ┌─────────────┐    NFS v3/v4.1    ┌──────────────┐    HTTPS                │
│   │   Linux     │───────────────────│              │──────────┐              │
│   │   Servers   │                   │              │          │              │
│   └─────────────┘                   │     S3       │          ▼              │
│                                     │     File     │    ┌────────────┐       │
│   ┌─────────────┐    SMB            │   Gateway    │    │    S3      │       │
│   │   Windows   │───────────────────│              │    │   Bucket   │       │
│   │   Servers   │                   │  ┌────────┐  │    │            │       │
│   └─────────────┘                   │  │ Cache  │  │    │  Objects   │       │
│   │             │(local)            │              │    │            │       │
│   │             └───────────────────┘              │    └────────────┘       │
│                                     └──────────────┘          │              │
│                                                               ▼              │
│   Files nhìn thấy như:                              ┌───────────────────┐    │
│   /share/folder/file.txt                            │  S3 Lifecycle     │    │
│                                                     │  → Standard-IA    │    │
│   Lưu trữ trên S3 như:                              │  → Glacier        │    │
│   s3://bucket/folder/file.txt                       └───────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Đặc điểm

| Đặc điểm | Chi tiết |
|----------|----------|
| **Protocols** | NFS v3/v4.1, SMB |
| **Storage backend** | Amazon S3 (Standard, Standard-IA, One Zone-IA, Intelligent-Tiering) |
| **Local cache** | Có - cho frequently accessed data |
| **File size limit** | 5 TB per file (S3 object limit) |
| **Metadata** | File metadata → S3 object metadata |
| **Integration** | S3 Lifecycle, S3 Versioning, S3 Replication |

### Use Cases

- File shares accessible từ on-premises
- Backup files to S3
- Machine learning datasets
- Data lakes input

---

## FSx File Gateway

**FSx File Gateway** cung cấp low-latency, on-premises access đến fully managed Windows file shares trên FSx for Windows File Server.

### Cách hoạt động

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FSx File Gateway                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   On-Premises                                           AWS Cloud            │
│                                                                              │
│   ┌─────────────┐         SMB       ┌──────────────┐         SMB             │
│   │   Windows   │───────────────────│              │─────────────┐           │
│   │   Servers   │                   │     FSx      │             │           │
│   └─────────────┘                   │     File     │             ▼           │
│                                     │   Gateway    │    ┌───────────────┐    │
│   ┌─────────────┐                   │              │    │  FSx for      │    │
│   │   Windows   │───────────────────│  ┌────────┐  │    │  Windows      │    │
│   │   Clients   │                   │  │ Cache  │  │    │  File Server  │    │
│   └─────────────┘                   │  │(local) │  │    │               │    │
│                                     │  └────────┘  │    │  - AD integ.  │    │
│                                     └──────────────┘    │  - DFS        │    │
│                                                         │  - Shadow     │    │
│   ✅ Low latency local access                           │    copies     │    │
│   ✅ Full SMB semantics                                 └───────────────┘    │
│   ✅ Active Directory integration                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Đặc điểm

| Đặc điểm | Chi tiết |
|----------|----------|
| **Protocol** | SMB only |
| **Storage backend** | Amazon FSx for Windows File Server |
| **Local cache** | Có - cho frequently accessed data |
| **AD Integration** | ✅ Full Active Directory support |
| **Features** | DFS, Shadow Copies, File permissions |

### Use Cases

- Windows file shares với low latency từ on-premises
- Hybrid Windows environments
- Lift-and-shift Windows applications

---

## Volume Gateway

**Volume Gateway** cung cấp block storage (iSCSI) được backup bởi S3. Có 2 modes: **Cached** và **Stored**.

### Cached Volumes

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       Volume Gateway - Cached Volumes                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   On-Premises                                           AWS Cloud            │
│                                                                              │
│   ┌─────────────┐       iSCSI       ┌──────────────┐                         │
│   │  Application│─────────────────► │    Volume    │                         │
│   │   Server    │                   │   Gateway    │                         │
│   └─────────────┘                   │              │                         │
│         │                           │  ┌────────┐  │    ┌───────────────┐    │
│         │ Sees as                   │  │ Cache  │  │───►│      S3        │   │
│         │ local disk                │  │(hot    │  │    │   (Primary     │   │
│         ▼                           │  │ data)  │  │    │    storage)    │   │
│   ┌─────────────┐                   │  └────────┘  │    └───────────────┘    │
│   │   /dev/sdb  │                   └──────────────┘            │            │
│   │   500GB     │                                              ▼             │
│   └─────────────┘                                    ┌───────────────────┐   │
│                                                      │   EBS Snapshots    │  │
│   📍 Cache size: small (SSD)                         │   (for backup)     │  │
│   📍 Primary data: on S3                             └───────────────────┘   │
│   📍 Volume size: up to 32 TB per volume                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Đặc điểm Cached Volumes:**
- Primary data stored on **S3**
- Frequently accessed data cached **locally**
- Volume size: **1 GB - 32 TB** per volume
- Total: **32 volumes** = up to **1 PB**
- Ideal khi: Cần **nhiều storage**, chấp nhận higher latency cho cold data

---

### Stored Volumes

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                       Volume Gateway - Stored Volumes                                      │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│   On-Premises                                           AWS Cloud                          │
│                                                                                            │
│   ┌─────────────┐       iSCSI       ┌──────────────┐                                       │
│   │  Application│─────────────────► │    Volume    │                                       │
│   │   Server    │                   │   Gateway    │                                       │
│   └─────────────┘                   │              │                                       │
│         │                           │ ┌──────────┐ │   Async                               │
│         │ Sees as                   │ │ Full     │ │   Backup                              │
│         │ local disk                │ │ Local    │ │───────────┐                           │
│         ▼                           │ │ Storage  │ │           │                           │
│   ┌─────────────┐                   │ │(Primary) │ │           ▼                           │
│   │   /dev/sdb  │                   │ └──────────┘ │    ┌────────────┐                     │
│   │   500GB     │                   └──────────────┘    │    S3      │                     │
│   └─────────────┘                                       │ (backup as │                     │
│                                                         │ snapshots) │                     │
│   📍 All data stored locally                            └────────────┘                     │
│   📍 Async backup to S3 as EBS snapshots                       │                           │
│   📍 Volume size: up to 16 TB per volume                       ▼                           │
│   📍 Low latency (all data local)                    ┌────────────────────────────────────┐│
│                                                      │   EBS Snapshots                    ││
│                                                      │   (can restore                     ││
│                                                      │    to EC2)                         ││
│                                                      └────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Đặc điểm Stored Volumes:**
- Primary data stored **locally** (on-premises)
- **Async backup** to S3 as EBS snapshots
- Volume size: **1 GB - 16 TB** per volume
- Total: **32 volumes** = up to **512 TB**
- Ideal khi: Cần **low latency** cho tất cả data, dùng S3 cho backup/DR

---

### So sánh Cached vs Stored

| Tiêu chí | Cached Volumes | Stored Volumes |
|----------|----------------|----------------|
| **Primary storage** | S3 | Local (on-premises) |
| **Local** | Cache only (hot data) | Full dataset |
| **Max volume size** | 32 TB | 16 TB |
| **Total capacity** | 1 PB | 512 TB |
| **Latency** | Higher (cold data from S3) | Low (all data local) |
| **Use case** | Large datasets, cost-saving | DR, low-latency required |

---

## Tape Gateway

**Tape Gateway** cung cấp Virtual Tape Library (VTL) interface, cho phép thay thế physical tape infrastructure bằng cloud storage.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Tape Gateway                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   On-Premises                                           AWS Cloud            │
│                                                                              │
│   ┌─────────────────┐                                                        │
│   │  Backup App     │  (Veeam, Veritas, Commvault,                           │
│   │  ─────────────  │   NetBackup, Microsoft DPM...)                         │
│   │  Sees: Virtual  │                                                        │
│   │  Tape Library   │                                                        │
│   └────────┬────────┘                                                        │
│            │ iSCSI                                                           │
│            ▼                                                                 │
│   ┌────────────────────┐                                                     │
│   │    Tape Gateway    │                                                     │
│   │                    │                                                     │
│   │  ┌──────────────┐  │        ┌─────────────────────────────────────────┐  │
│   │  │ Virtual Tape │  │───────►│                S3                       │  │
│   │  │   Library    │  │        │  ┌────────────────────────────────┐     │  │
│   │  │              │  │        │  │  Virtual Tapes (active use)    │     │  │
│   │  │ - Media      │  │        │  │  - Stored in S3                │     │  │
│   │  │   Changer    │  │        │  └────────────────────────────────┘     │  │
│   │  │ - Tape       │  │        │                 │                       │  │
│   │  │   Drives     │  │        │         Archive (eject tape)            │  │
│   │  └──────────────┘  │        │                 ▼                       │  │
│   └────────────────────┘        │  ┌────────────────────────────────┐     │  │
│                                 │  │  Virtual Tape Shelf (archived) │     │  │
│   📍 Replaces physical tapes    │  │  - S3 Glacier Flexible         │     │  │
│   📍 Compatible with existing   │  │  - S3 Glacier Deep Archive     │     │  │
│      backup software            │  └────────────────────────────────┘     │  │
│   📍 Unlimited virtual tapes    └─────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Đặc điểm

| Đặc điểm | Chi tiết |
|----------|----------|
| **Protocol** | iSCSI VTL (Virtual Tape Library) |
| **Virtual tape size** | 100 GB - 5 TB per tape |
| **Total library** | 1 PB of virtual tapes |
| **Active tapes storage** | S3 |
| **Archived tapes** | S3 Glacier Flexible Retrieval or Deep Archive |
| **Backup software** | Veeam, Veritas, Commvault, NetBackup, AWS Backup, etc. |

### Use Cases

- Replace physical tape backup infrastructure
- Long-term archival với Glacier
- Compliance requirements (data retention policies)

---

## So sánh các loại Gateway

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Gateway Type Comparison                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Question: What interface do your applications need?                     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                          │                                                   │
│        ┌─────────────────┼─────────────────┬───────────────────┐             │
│        │                 │                 │                   │             │
│        ▼                 ▼                 ▼                   ▼             │
│   ┌─────────┐      ┌─────────┐      ┌───────────┐      ┌─────────────┐       │
│   │   NFS   │      │   SMB   │      │   iSCSI   │      │   Tape/VTL  │       │
│   │  (Linux)│      │(Windows)│      │  (Block)  │      │  (Backup)   │       │
│   └────┬────┘      └────┬────┘      └─────┬─────┘      └──────┬──────┘       │
│        │                │                 │                   │              │
│        ▼                ▼                 ▼                   ▼              │
│   ┌─────────┐    ┌─────────────┐   ┌───────────────┐   ┌───────────┐         │
│   │   S3    │    │    S3 or    │   │    Volume     │   │   Tape    │         │
│   │  File   │    │    FSx      │   │   Gateway     │   │  Gateway  │         │
│   │ Gateway │    │  File GW    │   │(Cached/Stored)│   │   (VTL)   │         │
│   └─────────┘    └─────────────┘   └───────────────┘   └───────────┘         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Bảng so sánh chi tiết

| Tiêu chí | S3 File Gateway | FSx File Gateway | Volume Gateway | Tape Gateway |
|----------|----------------|------------------|----------------|--------------|
| **Protocol** | NFS, SMB | SMB | iSCSI | iSCSI VTL |
| **Backend** | S3 | FSx Windows | S3 + EBS Snapshots | S3 + Glacier |
| **Use case** | File shares | Windows shares | Block storage | Backup/Archive |
| **AD support** | Limited | Full | N/A | N/A |
| **Max size** | 5 TB/file | FSx limits | 32 TB/volume | 5 TB/tape |
| **Best for** | Linux apps | Windows apps | Databases, VMs | Replace tapes |

---

## Deployment Options

### Deployment Methods

| Option | Mô tả |
|--------|-------|
| **VMware ESXi** | Deploy as VM on vSphere |
| **Microsoft Hyper-V** | Deploy as VM on Hyper-V |
| **Linux KVM** | Deploy as VM on KVM |
| **Hardware Appliance** | Physical device from AWS (for locations with limited VM infrastructure) |
| **Amazon EC2** | Deploy in AWS (for cloud-to-cloud workflows) |

```
┌─────────────────────────────────────────────────────────────────┐
│                  Deployment Options                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   On-Premises (VM)              On-Premises (Hardware)          │
│   ────────────────              ──────────────────────          │
│   ┌─────────────┐               ┌─────────────────────┐         │
│   │   VMware    │               │   Hardware          │         │
│   │   Hyper-V   │               │   Appliance         │         │
│   │   KVM       │               │  (Dell EMC, AWS)    │         │
│   └─────────────┘               └─────────────────────┘         │
│                                                                 │
│   AWS Cloud (EC2)                                               │
│   ───────────────                                               │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  EC2 Instance with Storage Gateway AMI              │       │
│   │  (for cloud-to-cloud or development/testing)        │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hardware Requirements (VM)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **vCPUs** | 4 | 8+ |
| **RAM** | 16 GB | 32 GB+ |
| **Cache storage** | 150 GB | Based on working set |
| **Root disk** | 80 GB | 80 GB |

---

## Use Cases

### 1. Hybrid Cloud Storage

```
Scenario: Extend on-premises storage to AWS
Solution: S3 File Gateway
Benefits:
  • Unlimited storage capacity
  • Pay only for what you use
  • S3 Lifecycle for cost optimization
```

### 2. Backup and Archive

```
Scenario: Replace physical tape library
Solution: Tape Gateway
Benefits:
  • No physical media management
  • Glacier for cheap long-term storage
  • Works with existing backup software
```

### 3. Disaster Recovery

```
Scenario: Need DR capability for on-prem VMs
Solution: Volume Gateway (Cached or Stored)
Benefits:
  • EBS Snapshots for point-in-time recovery
  • Can restore to EC2 instances
  • Async replication to S3
```

### 4. Cloud Data Processing

```
Scenario: On-prem data needs to be processed by AWS services
Solution: S3 File Gateway
Benefits:
  • Data lands in S3
  • Can trigger Lambda, use Athena, SageMaker
  • No data movement needed
```

---

## Pricing

### Pricing Components

| Component | Pricing |
|-----------|---------|
| **Gateway usage** | Based on data written (per GB) |
| **Storage** | S3, FSx, Glacier rates apply |
| **Data transfer** | Standard AWS data transfer rates |
| **Requests** | S3 request pricing |

### Approximate Costs

| Gateway Type | Gateway Fee | Storage |
|--------------|-------------|---------|
| **File Gateway** | $0.01/GB written | S3 rates (~$0.023/GB) |
| **Volume Gateway** | $0.01/GB written | S3 + Snapshot rates |
| **Tape Gateway** | $0.01/GB written | S3 Glacier rates (~$0.004/GB) |

---

## Best Practices

### 1. Cache Sizing

```
┌──────────────────────────────────────────────────────────────────┐
│                    Cache Sizing Guidelines                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Cache should hold:                                              │
│  • Working set (frequently accessed data)                        │
│  • Recently written data (pending upload)                        │
│                                                                  │
│  Rule of thumb:                                                  │
│  Cache size = 20% of total dataset (minimum)                     │
│                                                                  │
│  ⚠️ Too small cache = Frequent S3 reads = Higher latency         │
│  ⚠️ Use SSD/NVMe for cache storage                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Network Bandwidth

| Recommendation | Details |
|----------------|---------|
| **Minimum** | 100 Mbps |
| **Recommended** | 1 Gbps+ for production |
| **Consider** | AWS Direct Connect for consistent performance |

### 3. Monitoring

- Use **CloudWatch metrics** for gateway health
- Monitor **cache hit ratio** (should be high)
- Alert on **upload buffer** usage

---

## Exam Tips

### Key Points for AWS Exams

1. **4 Gateway Types**
   - S3 File Gateway (NFS/SMB → S3)
   - FSx File Gateway (SMB → FSx Windows)
   - Volume Gateway - Cached (iSCSI, data on S3)
   - Volume Gateway - Stored (iSCSI, data local)
   - Tape Gateway (VTL → S3/Glacier)

2. **Protocol Mapping**
   - NFS/SMB → File Gateways
   - iSCSI → Volume Gateway
   - VTL → Tape Gateway

3. **Cached vs Stored Volumes**
   - Cached: Primary on S3, cache locally (larger capacity)
   - Stored: Primary local, backup to S3 (lower latency)

4. **Tape Gateway**
   - Replaces physical tapes
   - Active tapes → S3
   - Archived tapes → Glacier

5. **All Gateways have local cache** for low-latency access

### Common Exam Scenarios

| Scenario | Answer |
|----------|--------|
| On-prem Linux NFS needs S3 backend | S3 File Gateway |
| On-prem Windows shares, need AD | FSx File Gateway |
| Block storage với low-latency required | Volume Gateway (Stored) |
| Large block storage, cost-effective | Volume Gateway (Cached) |
| Replace physical tape library | Tape Gateway |
| Backup software using VTL | Tape Gateway |

---

## Liên kết liên quan

- [Amazon S3](./s3.md)
- [Amazon FSx](./fsx.md)
- [AWS Snow Family](./snow-family.md)
- [AWS DataSync](./aws-storage-deep-dive.md)
- [Amazon EBS](./ebs.md)
