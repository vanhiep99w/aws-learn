# Amazon FSx


## Mục lục

- [Tổng quan](#tổng-quan)
- [Chọn File System phù hợp](#chọn-file-system-phù-hợp)
- [1. FSx for Lustre](#1-fsx-for-lustre)
- [2. FSx for NetApp ONTAP](#2-fsx-for-netapp-ontap)
- [3. FSx for OpenZFS](#3-fsx-for-openzfs)
- [4. FSx for Windows File Server](#4-fsx-for-windows-file-server)
- [So sánh Performance](#so-sánh-performance)
- [So sánh Protocols & Compatibility](#so-sánh-protocols-compatibility)
- [Availability SLA](#availability-sla)
- [Pricing Model](#pricing-model)
- [Khi nào chọn FSx?](#khi-nào-chọn-fsx)
- [FSx vs EFS - Khi nào chọn cái nào?](#fsx-vs-efs-khi-nào-chọn-cái-nào)
- [So sánh với các Storage Services khác](#so-sánh-với-các-storage-services-khác)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

Amazon FSx là dịch vụ fully managed file storage cho phép bạn khởi chạy và quản lý các hệ thống file phổ biến mà không cần provisioning hardware, cấu hình software, patching hoặc backup.

FSx cung cấp **4 loại file system** khác nhau, mỗi loại tối ưu cho các use case riêng:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Amazon FSx                                │
├────────────────┬────────────────┬────────────────┬──────────────┤
│  FSx for       │  FSx for       │  FSx for       │  FSx for     │
│  Lustre        │  NetApp ONTAP  │  OpenZFS       │  Windows     │
│                │                │                │  File Server │
├────────────────┼────────────────┼────────────────┼──────────────┤
│ HPC, ML, Video │ Enterprise NAS │ Linux workloads│ Windows apps │
│ Processing     │ Migration      │ ZFS migration  │ SMB shares   │
└────────────────┴────────────────┴────────────────┴──────────────┘
```

## Chọn File System phù hợp

| Storage hiện tại | Nên chọn |
|-----------------|----------|
| Lustre hoặc parallel file systems | FSx for Lustre |
| NetApp ONTAP hoặc NAS appliances | FSx for NetApp ONTAP |
| ZFS hoặc Linux-based file servers | FSx for OpenZFS |
| Microsoft Windows Server | FSx for Windows File Server |

---

## 1. FSx for Lustre

### Đặc điểm
- **High-performance parallel file system** cho HPC, ML, video processing
- Throughput lên đến **1000 GB/s**, IOPS hàng triệu
- Latency < 1 ms
- Kích thước tối đa: **Multiple PBs**
- **Chỉ hỗ trợ Linux clients**

### Deployment Types

| Type | Mô tả | Use case |
|------|-------|----------|
| **Scratch** | Temporary storage, không replicate data | Short-term processing, cost-optimized |
| **Persistent 1** | Longer-term storage, SSD/HDD | Workloads cần data persistence |
| **Persistent 2** | Latest generation, higher IOPS | Latency-sensitive workloads |

### Storage Classes
- **SSD**: Low-latency, full dataset access
- **HDD**: Cost-effective, consistent ms latency
- **Intelligent-Tiering**: Tự động tier data theo access frequency

### Tích hợp S3
- **Unique feature**: Tự động import/export data từ/đến S3
- Lazy loading: Chỉ load data khi cần
- Phù hợp cho data lake và ML training

```
┌──────────────┐      Link      ┌──────────────┐
│   S3 Bucket  │◄──────────────►│ FSx Lustre   │
│  (Data Lake) │  Auto sync     │ (High Perf)  │
└──────────────┘                └──────────────┘
         │                              │
         │                              │
         ▼                              ▼
   Cold Storage                  Hot Processing
   (Archive)                     (EC2 Compute)
```

---

## 2. FSx for NetApp ONTAP

### Đặc điểm
- **Enterprise-grade NAS** với NetApp ONTAP software
- Latency < 1 ms, throughput 72-80 GB/s
- Kích thước: **Virtually unlimited (10s of PBs)**
- Hỗ trợ **SMB, NFS, iSCSI** (shared block storage)
- **Multi-protocol access**: Windows, Linux, macOS

### Key Features
- **Snapshots & Cloning**: Instant, space-efficient
- **Data Tiering**: Tự động move cold data sang capacity pool (cost savings)
- **Data Deduplication & Compression**
- **SnapMirror**: Cross-region replication
- **FlexCache**: On-premises caching, compute burst

### Hybrid Cloud
```
┌─────────────────┐        SnapMirror        ┌─────────────────┐
│   On-premises   │◄────────────────────────►│  FSx ONTAP      │
│   NetApp        │    Replication           │  (AWS)          │
└─────────────────┘                          └─────────────────┘
        │                                            │
        │ FlexCache                                  │
        ▼                                            ▼
   Local Cache                              Multi-AZ/Single-AZ
```

### Availability
- **Multi-AZ**: 99.99% SLA
- **Single-AZ**: 99.9% SLA

---

## 3. FSx for OpenZFS

### Đặc điểm
- Fully managed **OpenZFS file system**
- **Latency < 0.5 ms** (thấp nhất trong các FSx)
- Throughput 10-21 GB/s, IOPS 1-2 million
- Kích thước tối đa: **512 TiB**
- Hỗ trợ NFS 3, 4.0, 4.1, 4.2

### Key Features
- **Instant Cloning**: Space-efficient clones
- **Snapshots**: Point-in-time recovery
- **Data Compression**: LZ4, ZSTD
- **Cross-region backups**

### Use Cases
- Migrate ZFS-based workloads sang AWS
- Linux application development/testing
- Media processing pipelines
- CI/CD environments (clone for testing)

### Availability
- **Multi-AZ**: 99.99% SLA
- **Single-AZ**: 99.5% SLA

---

## 4. FSx for Windows File Server

### Đặc điểm
- **Native Windows file system** built on Windows Server
- SMB protocol (2.0, 2.1, 3.0, 3.1.1)
- Latency < 1 ms, throughput 12-20 GB/s
- Kích thước tối đa: **64 TiB**
- **Active Directory integration**

### Key Features
- **DFS Namespaces & Replication**
- **Data Deduplication**: Giảm storage costs
- **User Quotas**: Giới hạn storage per user
- **Shadow Copies**: End-user file restore
- **File Access Auditing**

### Deployment Types

| Type | Mô tả | Downtime khi failure |
|------|-------|---------------------|
| **Single-AZ** | Single file server, 1 AZ | ~30 phút |
| **Multi-AZ** | HA cluster, 2 AZs, auto failover | Seconds (transparent) |

### Storage Options
- **SSD**: Low-latency workloads
- **HDD**: Cost-optimized, infrequent access

### Use Cases
- Windows-based applications
- SQL Server high availability (CA shares)
- User home directories
- Enterprise file shares
- Amazon WorkSpaces, AppStream 2.0

```
┌─────────────────────────────────────────────────────┐
│                  Active Directory                    │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              FSx for Windows File Server             │
│  ┌─────────────────┐    ┌─────────────────┐         │
│  │  Primary (AZ1)  │◄──►│ Standby (AZ2)   │ Multi-AZ│
│  └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
┌─────────────┐           ┌─────────────┐
│ EC2 Windows │           │ WorkSpaces  │
└─────────────┘           └─────────────┘
```

---

## So sánh Performance

| Metric | Lustre | NetApp ONTAP | OpenZFS | Windows |
|--------|--------|--------------|---------|---------|
| **Latency** | < 1 ms | < 1 ms | **< 0.5 ms** | < 1 ms |
| **Max Throughput** | **1000 GB/s** | 72-80 GB/s | 10-21 GB/s | 12-20 GB/s |
| **Single Client Throughput** | **150 GB/s** | 18 GB/s | 10 GB/s | 20 GB/s |
| **Max IOPS** | Millions | Millions | 1-2 million | 100s of K |
| **Max Size** | **Multiple PBs** | 10s of PBs | 512 TiB | 64 TiB |

## So sánh Protocols & Compatibility

| Feature | Lustre | NetApp ONTAP | OpenZFS | Windows |
|---------|--------|--------------|---------|---------|
| **Linux** | ✓ | ✓ | ✓ | ✓ |
| **Windows** | ✗ | ✓ | ✓ | ✓ |
| **macOS** | ✗ | ✓ | ✓ | ✓ |
| **SMB** | ✗ | ✓ | ✗ | ✓ |
| **NFS** | ✗ | ✓ | ✓ | ✗ |
| **iSCSI** | ✗ | ✓ | ✗ | ✗ |
| **S3 Integration** | ✓ | ✗ | ✗ | ✗ |

## Availability SLA

| File System | Multi-AZ | Single-AZ |
|-------------|----------|-----------|
| NetApp ONTAP | 99.99% | 99.9% |
| OpenZFS | 99.99% | 99.5% |
| Windows | 99.99% | 99.5% |
| Lustre | N/A | 99.5% |

---

## Pricing Model

Tất cả FSx đều theo mô hình **pay-as-you-go**:
- Không có minimum fees hoặc setup charges
- Trả theo resources sử dụng

Chi phí phụ thuộc vào:
- Storage capacity (GB-month)
- Throughput capacity
- Backup storage
- Data transfer

**Nguồn**: [Amazon FSx Pricing](https://aws.amazon.com/fsx/pricing/)

---

## Khi nào chọn FSx?

| Scenario | Recommendation |
|----------|----------------|
| HPC, ML training, video rendering | **FSx for Lustre** |
| Migrate NetApp/NAS sang AWS | **FSx for NetApp ONTAP** |
| Hybrid cloud với on-premises NetApp | **FSx for NetApp ONTAP** |
| ZFS migration, Linux dev/test | **FSx for OpenZFS** |
| Windows applications, AD integration | **FSx for Windows** |
| SQL Server HA | **FSx for Windows** (Multi-AZ) |
| Lowest latency requirement | **FSx for OpenZFS** |
| Highest throughput requirement | **FSx for Lustre** |

---

## FSx vs EFS - Khi nào chọn cái nào?

| | **EFS** | **FSx** |
|---|---------|---------|
| **Protocol** | NFS only | SMB, NFS, Lustre, iSCSI (tùy loại) |
| **OS** | Linux only | Linux, Windows, macOS |
| **Performance** | Tốt (~GB/s) | Rất cao (lên đến 1000 GB/s với Lustre) |
| **Use case** | Linux shared storage đơn giản | Workloads đặc thù, enterprise, HPC |
| **Quản lý** | AWS native, đơn giản | Giữ features của file system gốc (AD, snapshots, dedup...) |

**Chọn EFS khi:**
- Chỉ cần NFS cho Linux EC2
- Muốn đơn giản, không cần cấu hình nhiều

**Chọn FSx khi:**
- Cần **Windows/SMB** → FSx Windows
- Cần **Active Directory** integration → FSx Windows/ONTAP
- Cần **performance cực cao** (ML, HPC, video) → FSx Lustre
- Đang dùng **NetApp/ZFS** on-prem, muốn migrate → FSx ONTAP/OpenZFS

> **Tóm lại**: EFS = NFS đơn giản cho Linux. FSx = file system chuyên dụng cho từng nhu cầu cụ thể.

---

## So sánh với các Storage Services khác

| Feature | FSx | EBS | EFS | S3 |
|---------|-----|-----|-----|-----|
| **Type** | File | Block | File | Object |
| **Access** | Multi-instance | Single instance* | Multi-instance | Any |
| **Protocol** | SMB/NFS/Lustre | Block device | NFS | HTTP/S3 API |
| **Use case** | Shared file storage | EC2 boot/data volumes | Linux shared storage | Object storage, backup |
| **Performance** | Very high | High | High | High (throughput) |

*EBS Multi-Attach available cho io1/io2 với một số giới hạn

---

## Tài liệu tham khảo

- [Choosing an Amazon FSx File System](https://aws.amazon.com/fsx/when-to-choose-fsx/)
- [FSx for Lustre User Guide](https://docs.aws.amazon.com/fsx/latest/LustreGuide/)
- [FSx for Windows File Server User Guide](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/)
- [FSx for NetApp ONTAP User Guide](https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/)
- [FSx for OpenZFS User Guide](https://docs.aws.amazon.com/fsx/latest/OpenZFSGuide/)
- [Amazon FSx Pricing](https://aws.amazon.com/fsx/pricing/)
