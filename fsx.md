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
│                        Amazon FSx                               │
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

### Hiểu đơn giản

**FSx for NetApp ONTAP = một hệ thống NetApp ONTAP được AWS vận hành giúp bạn**. Nếu trước đây doanh nghiệp có một cụm NetApp NAS on-premises để chia sẻ file cho Windows/Linux/macOS, chạy NFS/SMB, tạo snapshot, clone, replication... thì FSx ONTAP mang gần như cùng mô hình đó lên AWS dưới dạng managed service.

Điểm dễ nhầm: đây **không chỉ là một file share đơn giản**. Nó là một nền tảng storage enterprise có nhiều lớp tài nguyên:

```
FSx for ONTAP File System
│
├── HA pair(s): cặp file server active/standby do AWS quản lý
│
├── Storage Virtual Machine (SVM)
│   ├── Endpoint NFS / SMB / iSCSI / Management
│   ├── Có thể join Active Directory
│   └── Giống một "file server ảo" độc lập
│
└── Volumes
    ├── Chứa dữ liệu thực tế
    ├── Mount bằng NFS/SMB hoặc expose block bằng iSCSI/NVMe-over-TCP
    ├── Thin-provisioned: chỉ tiêu thụ dung lượng thật đã ghi
    └── Có snapshot, clone, tiering policy riêng
```

Nói cách khác:

- **File system**: giống một cụm ONTAP/NetApp cluster.
- **SVM**: giống một file server/NAS ảo bên trong cluster, có DNS/IP endpoint riêng.
- **Volume**: nơi chứa dataset/app/user share cụ thể, ví dụ `/finance`, `/home`, `/app-data`.
- **Client**: EC2, ECS, EKS, WorkSpaces, on-premises... mount volume qua NFS/SMB hoặc dùng block protocol.

### Đặc điểm chính

- **Enterprise-grade NAS/SAN** chạy NetApp ONTAP software, nhưng AWS quản lý phần hạ tầng, phần cứng, thay thế node, failover, backup integration.
- **Latency sub-millisecond** cho dữ liệu nằm trên SSD tier; throughput có thể scale rất cao tùy generation/số HA pair.
- Hỗ trợ nhiều protocol: **NFS**, **SMB**, **iSCSI**, và tài liệu AWS hiện cũng nêu hỗ trợ **NVMe-over-TCP** cho block access.
- **Multi-protocol access**: Windows, Linux, macOS có thể truy cập cùng hệ thống, nhưng cần cấu hình identity/permission đúng nếu cùng dataset được truy cập bằng cả SMB và NFS.
- Dung lượng logic có thể rất lớn vì volume thin-provisioned và capacity pool có thể scale đến petabyte cho dữ liệu ít truy cập.

### Vì sao ONTAP khác EFS hoặc FSx Windows?

| Nhu cầu | FSx ONTAP mạnh ở điểm nào? |
|---------|-----------------------------|
| Có cả Linux và Windows | Một hệ thống có thể phục vụ **NFS + SMB** |
| Đang dùng NetApp on-premises | Dễ migrate/replicate bằng **SnapMirror** |
| Cần snapshot/clone nhanh | **Snapshot** và **FlexClone** gần như tức thì, tiết kiệm dung lượng |
| Muốn giảm chi phí data lạnh | **Data tiering** tự chuyển block ít dùng sang capacity pool |
| Cần storage block chia sẻ | Hỗ trợ **iSCSI/NVMe-over-TCP** bên cạnh file protocols |
| Cần hybrid cloud | Kết nối on-prem NetApp ↔ AWS bằng SnapMirror/FlexCache |

### Storage tiers: SSD và capacity pool

FSx ONTAP có 2 tầng lưu trữ chính:

1. **Primary SSD storage**
   - Dành cho dữ liệu nóng/active dataset.
   - Hiệu năng cao, latency thấp.
   - Bạn provision dung lượng SSD và throughput capacity cho file system.

2. **Capacity pool storage**
   - Tầng lưu trữ elastic, cost-optimized cho dữ liệu lạnh/infrequently accessed.
   - Có thể scale đến petabytes.
   - Dữ liệu được tự động chuyển giữa SSD và capacity pool dựa trên **tiering policy** của từng volume.

Ví dụ thực tế:

```
Ứng dụng ghi/đọc file thường xuyên ──► SSD tier
File cũ ít truy cập sau N ngày ──────► Capacity pool
Khi file cũ được đọc lại ────────────► ONTAP phục vụ lại cho client, có thể đưa data nóng về SSD tùy policy
```

Điểm quan trọng: với app/client, đường dẫn mount vẫn không đổi. Việc block nào nằm ở SSD hay capacity pool là do ONTAP quản lý bên dưới.

### Snapshot, clone và vì sao tiết kiệm dung lượng

- **Snapshot**: ảnh chụp point-in-time của volume. Ban đầu snapshot gần như không copy toàn bộ dữ liệu; nó giữ metadata/tham chiếu đến block hiện có. Khi dữ liệu thay đổi, chỉ phần block thay đổi mới phát sinh thêm dung lượng.
- **FlexClone**: tạo bản clone ghi được từ snapshot. Clone xuất hiện rất nhanh và chỉ tiêu thụ thêm dung lượng cho các thay đổi mới.

Use case dễ hiểu:

```
Production volume: /app-data
        │
        ├── Snapshot lúc 00:00
        │
        └── FlexClone từ snapshot ──► /app-data-test
                                  └── Dev/test chạy trên clone mà không copy cả TB dữ liệu
```

Vì vậy FSx ONTAP rất hợp cho dev/test, database/file dataset lớn, analytics sandbox, hoặc các môi trường cần tạo nhiều bản sao tạm thời.

### SnapMirror và hybrid cloud

**SnapMirror** là tính năng replication của NetApp. Với FSx ONTAP, bạn có thể replicate dữ liệu giữa:

- NetApp ONTAP on-premises ↔ FSx ONTAP trên AWS
- FSx ONTAP ở Region này ↔ FSx ONTAP ở Region khác
- Volume production ↔ volume data protection/read-only

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

Use case:

- Migrate dữ liệu NetApp on-prem sang AWS.
- Disaster Recovery: replicate sang AWS, khi on-prem lỗi có thể promote dữ liệu ở AWS.
- Hybrid workload: dữ liệu chính ở một nơi, cache/replica ở nơi khác để compute gần dữ liệu hơn.

### Multi-AZ, Single-AZ và failover

FSx ONTAP dùng mô hình **HA pair**: một file server active và một file server standby.

- **Single-AZ**: active/standby nằm trong cùng một AZ nhưng khác fault domain. Rẻ hơn, phù hợp dev/test, secondary copy, hoặc workload đã có replication ở tầng khác.
- **Multi-AZ**: active và standby nằm ở 2 AZ khác nhau, dữ liệu được replicate đồng bộ giữa AZ. Phù hợp production/business-critical cần chịu được lỗi AZ.

Khi node active lỗi hoặc AWS bảo trì:

1. FSx tự failover sang standby.
2. Endpoint IP/DNS client dùng để truy cập NFS/SMB vẫn giữ nguyên.
3. Linux/Windows/macOS client thường tiếp tục I/O sau một khoảng gián đoạn ngắn, không cần admin đổi mount target thủ công.

SLA tham khảo:

- **Multi-AZ**: 99.99%
- **Single-AZ HA**: 99.9%

### Khi nào nên chọn FSx ONTAP?

Chọn FSx ONTAP khi bạn có một hoặc nhiều nhu cầu sau:

- Doanh nghiệp đã quen/dùng **NetApp ONTAP** và muốn migrate lên AWS ít thay đổi vận hành.
- Cần **NFS + SMB** trong cùng một nền tảng storage.
- Cần tính năng enterprise như snapshot, clone, deduplication, compression, compaction, SnapMirror.
- Muốn tiết kiệm chi phí bằng cách tự động tier dữ liệu lạnh xuống capacity pool.
- Cần kết nối hybrid cloud giữa on-premises và AWS.
- Cần storage cho VMware Cloud on AWS, EKS/ECS/EC2, WorkSpaces hoặc workload enterprise file share phức tạp.

Không nhất thiết chọn FSx ONTAP nếu bạn chỉ cần một NFS share Linux đơn giản; khi đó **EFS** thường dễ vận hành hơn. Nếu bạn chỉ cần SMB native cho Windows app và tích hợp AD đơn giản, **FSx for Windows File Server** có thể phù hợp hơn.

### Nguồn AWS chính thức

- [How Amazon FSx for NetApp ONTAP works](https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/how-it-works-fsx-ontap.html)
- [Availability, durability, and deployment options](https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/high-availability-AZ.html)
- [FSx for NetApp ONTAP Features](https://aws.amazon.com/fsx/netapp-ontap/features/)

---

## 3. FSx for OpenZFS

### Hiểu đơn giản

**FSx for OpenZFS = OpenZFS file system được AWS quản lý sẵn cho bạn**. Nếu FSx ONTAP phù hợp với môi trường NetApp enterprise, thì FSx OpenZFS phù hợp hơn với các workload Linux/Unix quen dùng **ZFS hoặc NFS file server** và cần hiệu năng rất thấp latency.

OpenZFS bản chất là file system nổi tiếng với các khả năng như snapshot, clone, compression, quota, data integrity. FSx for OpenZFS lấy các khả năng đó và đóng gói thành managed service: bạn không cần tự dựng server ZFS, tự thay disk, tự cấu hình failover, tự backup thủ công.

Mô hình tài nguyên có thể hình dung như sau:

```
FSx for OpenZFS File System
│
├── File server / HA file servers do AWS quản lý
│
├── Root volume
│   └── Volume mặc định khi tạo file system
│
├── Child volumes
│   ├── /app-data
│   ├── /dev-test
│   └── /analytics
│
└── NFS endpoint
    └── Linux / macOS / Windows NFS client mount vào để đọc ghi file
```

Nói ngắn gọn:

- **File system**: hệ thống OpenZFS managed bởi AWS.
- **Volume**: container logic chứa dữ liệu, có mount path, quota, compression, snapshot riêng.
- **Snapshot**: ảnh point-in-time của volume.
- **Clone**: volume ghi được tạo gần như tức thì từ snapshot.
- **Client**: EC2, ECS, EKS, on-premises... truy cập chủ yếu qua **NFS**.

### Đặc điểm chính

- Fully managed **OpenZFS file system**.
- Truy cập qua **NFS** từ Linux, Windows, macOS; rất hợp với workload Linux/NFS.
- AWS nêu FSx OpenZFS được thiết kế đạt **latency vài trăm microseconds/sub-millisecond**, hơn 1 triệu IOPS cho dữ liệu cached, và throughput tối đa khoảng **21 GB/s** tùy cấu hình.
- Có thể scale riêng các thành phần: storage capacity, throughput capacity, SSD IOPS.
- Hỗ trợ nhiều tính năng ZFS quen thuộc: **snapshot**, **clone**, **compression**, **thin provisioning**, **multi-volume**, **user/group quota**.
- Có thể truy cập dữ liệu từ AWS compute/container như EC2, ECS, EKS, VMware Cloud on AWS, WorkSpaces, AppStream 2.0; cũng có thể truy cập từ on-prem qua VPN/Direct Connect nếu network cho phép.

### Vì sao OpenZFS khác ONTAP, EFS và FSx Windows?

| Nhu cầu | OpenZFS phù hợp vì |
|---------|--------------------|
| Linux/NFS performance cao | NFS + latency rất thấp + throughput/IOPS cao |
| Đang dùng ZFS on-prem | Dễ migrate tư duy vận hành: volume, snapshot, clone, compression |
| Dev/test cần copy dataset nhanh | Clone volume gần như tức thì từ snapshot |
| Cần nhiều volume trong một file system | Mỗi app/team có volume, quota, compression riêng |
| Cần POSIX permission | Hợp với Linux/Unix style permission |
| Không cần SMB/AD native | Đơn giản hơn ONTAP/Windows nếu workload chủ yếu là NFS |

Không nên nhầm OpenZFS với EFS:

- **EFS**: NFS managed đơn giản, elastic tự động, ít phải nghĩ về dung lượng/performance.
- **FSx OpenZFS**: NFS hiệu năng cao hơn và nhiều tính năng ZFS hơn, nhưng bạn phải quan tâm hơn đến capacity/throughput/IOPS, volume, snapshot, clone.

### Volume, thin provisioning và quota

Trong FSx OpenZFS, bạn có thể tạo nhiều **volume** trong cùng một file system. Mỗi volume giống một dataset riêng:

```
File system: fs-abc
│
├── Volume: /prod-app       quota 20 TiB, compression LZ4
├── Volume: /analytics      quota 50 TiB, compression ZSTD
└── Volume: /dev-clone      clone từ snapshot production
```

Các volume có thể dùng **thin provisioning**: bạn đặt logical size/quota lớn, nhưng hệ thống chỉ tiêu thụ dung lượng vật lý theo dữ liệu thực sự ghi vào. Điều này giúp chia không gian linh hoạt cho nhiều team/app mà không phải copy hoặc cấp phát cứng toàn bộ ngay từ đầu.

Quota hữu ích khi bạn muốn:

- Giới hạn một team/app không dùng quá nhiều dung lượng.
- Tách dữ liệu production, dev/test, analytics.
- Áp compression khác nhau cho từng volume tùy kiểu dữ liệu.

### Snapshot: backup nhanh ở cấp volume

**Snapshot** là ảnh chụp read-only của một volume tại một thời điểm. Snapshot trong OpenZFS rất nhẹ vì nó không copy toàn bộ dữ liệu ngay lập tức; nó chỉ lưu phần dữ liệu thay đổi so với snapshot trước đó.

Ví dụ:

```
10:00  Volume /app-data có 5 TiB dữ liệu
10:01  Tạo snapshot snap-10h
10:30  App sửa 20 GiB dữ liệu
       Snapshot chỉ cần giữ lại phần block cũ bị thay đổi
```

Snapshot giúp:

- Khôi phục file/folder bị xóa nhầm.
- So sánh version cũ/mới của dữ liệu.
- Tạo clone cho dev/test.
- Restore volume về trạng thái trước đó.

Theo tài liệu AWS, snapshot nằm trong thư mục ẩn **`.zfs/snapshot`** ở root của volume. Người dùng có thể tự copy file cũ từ snapshot về vị trí mong muốn nếu export NFS được cấu hình phù hợp.

### Clone vs Full-copy volume

Từ một snapshot, FSx OpenZFS có thể tạo volume mới theo 2 cách:

| Cách tạo | Đặc điểm | Khi dùng |
|----------|----------|----------|
| **Clone volume** | Tạo gần như tức thì, ban đầu gần như không tốn thêm dung lượng; chỉ tốn thêm khi clone/source thay đổi | Dev/test, CI/CD, thử nghiệm schema/app trên dataset lớn |
| **Full-copy volume** | Copy toàn bộ dữ liệu để tạo volume độc lập; lâu hơn và tốn dung lượng hơn | Khi cần bản copy độc lập, không phụ thuộc snapshot gốc |

Ví dụ clone cho môi trường test:

```
Production volume: /prod-db-files
        │
        ├── Snapshot: before-release
        │
        └── Clone volume: /test-release
                 └── QA chạy test trên dữ liệu gần giống production
                     mà không cần copy nhiều TB dữ liệu
```

Lưu ý quan trọng: clone volume còn phụ thuộc vào snapshot nguồn. Nếu clone vẫn tồn tại, snapshot nguồn có thể chưa xóa được cho đến khi xóa clone hoặc tạo full-copy độc lập.

### Compression: LZ4 và ZSTD

FSx OpenZFS hỗ trợ compression như **LZ4** và **ZSTD**.

- **LZ4**: thường rất nhanh, ít ảnh hưởng CPU, hợp workload cần latency/performance.
- **ZSTD**: thường nén tốt hơn, có thể tiết kiệm dung lượng hơn, phù hợp dữ liệu compressible.

Compression giúp:

- Giảm dung lượng SSD tiêu thụ.
- Giảm dung lượng backup.
- Có thể tăng effective throughput nếu dữ liệu nén tốt vì hệ thống đọc/ghi ít byte vật lý hơn.

### Deployment types và availability

FSx OpenZFS có các lựa chọn deployment khác nhau:

| Deployment | Mô tả | Phù hợp |
|------------|------|---------|
| **Multi-AZ (HA)** | Có cặp file server ở 2 AZ, dữ liệu replicate đồng bộ giữa AZ, tự failover thường trong <60 giây | Production/business-critical, database/workload cần HA cao |
| **Single-AZ (HA)** | Có primary/standby file server trong cùng một AZ, tự failover thường trong <60 giây | Workload cần HA nhưng không cần chống lỗi cả AZ, ví dụ analytics/EDA |
| **Single-AZ (non-HA)** | Một file server trong một AZ; khi failure/maintenance có thể downtime khoảng 30 phút | Dev/test hoặc workload chịu được gián đoạn |

SLA tham khảo:

- **Multi-AZ**: 99.99%
- **Single-AZ HA**: 99.9%
- **Single-AZ non-HA**: 99.5%

### Khi nào nên chọn FSx OpenZFS?

Chọn FSx OpenZFS khi bạn có một hoặc nhiều nhu cầu sau:

- Cần **NFS shared storage hiệu năng cao** cho Linux/app/container.
- Đang chạy ZFS hoặc NFS file server on-prem và muốn migrate lên AWS.
- Cần snapshot/clone nhanh cho dev/test, CI/CD, database testing, media pipeline.
- Cần latency rất thấp, IOPS cao, throughput cao hơn nhu cầu NFS thông thường.
- Muốn dùng compression, quota, multi-volume theo kiểu ZFS.
- Workload như analytics, EDA, genomics, media processing, build farm, hoặc application data cần file semantics.

Không nhất thiết chọn FSx OpenZFS nếu bạn chỉ cần NFS đơn giản và muốn storage tự động co giãn ít phải quản trị; lúc đó **EFS** có thể đơn giản hơn. Nếu cần SMB/Windows/Active Directory native, cân nhắc **FSx for Windows File Server** hoặc **FSx for NetApp ONTAP**.

### Nguồn AWS chính thức

- [Amazon FSx for OpenZFS Documentation overview](https://aws.amazon.com/documentation-overview/fsx-openzfs/)
- [Protecting your data with snapshots](https://docs.aws.amazon.com/fsx/latest/OpenZFSGuide/snapshots-openzfs.html)
- [Availability and durability for Amazon FSx for OpenZFS](https://docs.aws.amazon.com/fsx/latest/OpenZFSGuide/availability-durability.html)

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
│                  Active Directory                   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              FSx for Windows File Server            │
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
| OpenZFS | 99.99% | 99.9% (HA) / 99.5% (non-HA) |
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
