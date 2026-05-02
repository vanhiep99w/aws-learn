# Hướng dẫn toàn diện: AWS File Storage & Khái niệm nền tảng

## Mục lục

- [Tổng quan 3 loại Storage](#tổng-quan-3-loại-storage)
- [Khái niệm nền tảng](#khái-niệm-nền-tảng)
- [NFS vs SMB — Hai giao thức chia sẻ file](#nfs-vs-smb--hai-giao-thức-chia-sẻ-file)
- [NTFS — File System của Windows](#ntfs--file-system-của-windows)
- [NTFS vs SMB — Khác tầng, khác việc](#ntfs-vs-smb--khác-tầng-khác-việc)
- [Active Directory (AD)](#active-directory-ad)
- [Windows Ecosystem: AD + SMB + NTFS](#windows-ecosystem-ad--smb--ntfs)
- [Amazon EFS — NAS cho Linux trên Cloud](#amazon-efs--nas-cho-linux-trên-cloud)
- [FSx for Windows File Server — Windows file server trên Cloud](#fsx-for-windows-file-server--windows-file-server-trên-cloud)
- [FSx for Lustre — Siêu xe cho tính toán nặng](#fsx-for-lustre--siêu-xe-cho-tính-toán-nặng)
- [AWS Storage Gateway — Cầu nối On-premises và AWS](#aws-storage-gateway--cầu-nối-on-premises-và-aws)
- [FSx for NetApp ONTAP và OpenZFS](#fsx-for-netapp-ontap-và-openzfs)
- [Bảng so sánh tổng hợp](#bảng-so-sánh-tổng-hợp)
- [Bản đồ toàn cảnh AWS File Storage](#bản-đồ-toàn-cảnh-aws-file-storage)
- [Bức tranh toàn cảnh: 5 nhóm Storage trong AWS](#bức-tranh-toàn-cảnh-5-nhóm-storage-trong-aws)
- [Cheat Sheet cho thi](#cheat-sheet-cho-thi)
- [Mẹo phân biệt nhanh khi làm bài](#mẹo-phân-biệt-nhanh-khi-làm-bài)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan 3 loại Storage

Trước khi đi vào file storage, cần hiểu AWS có **3 loại storage** hoàn toàn khác nhau:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. BLOCK STORAGE (ổ cứng)         → EBS, Instance Store        │
│     - Gắn vào 1 EC2 (như ổ C:\ hay /dev/sda)                    │
│     - Bạn tự format (ext4, NTFS, XFS...)                        │
│     - KHÔNG share được (trừ EBS Multi-Attach rất hạn chế)       │
│                                                                 │
│  2. FILE STORAGE (folder chia sẻ)  → EFS, FSx                   │
│     - Nhiều máy mount cùng lúc                                  │
│     - Đã có sẵn file system (NFS/SMB)                           │
│     - Share giữa nhiều EC2/containers                           │
│                                                                 │
│  3. OBJECT STORAGE (kho chứa)      → S3, Glacier                │
│     - Truy cập qua HTTP API                                     │
│     - Không mount như ổ đĩa                                     │
│     - Lưu file/ảnh/video/backup                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ dễ hiểu:**

| Loại | Ví dụ đời thực | AWS Service |
|------|----------------|-------------|
| Block Storage | Ổ cứng gắn trong máy tính — chỉ máy đó dùng | EBS, Instance Store |
| File Storage | Folder share trên mạng nội bộ — nhiều máy cùng truy cập | EFS, FSx |
| Object Storage | Google Drive/Dropbox — upload/download qua internet | S3, Glacier |

> **EBS thuộc Block Storage** — hoàn toàn khác loại so với EFS, FSx. EBS là "ổ cứng ảo" gắn vào 1 EC2 instance, bạn tự format thành NTFS (Windows) hoặc ext4 (Linux).

---

## Khái niệm nền tảng

### NFS vs SMB — Hai giao thức chia sẻ file

Khi muốn nhiều máy tính cùng truy cập 1 folder trên server, cần một **giao thức mạng** (network protocol) để giao tiếp — giống như 2 người nói chuyện cần chung 1 ngôn ngữ.

| | **NFS** (Network File System) | **SMB** (Server Message Block) |
|---|---|---|
| **Xuất xứ** | Thế giới Unix/Linux | Thế giới Windows |
| **Dùng cho** | Linux servers, containers | Windows desktops, AD environments |
| **Ví dụ** | Web server cluster share code | Văn phòng Windows share `\\server\shared` |
| **Xác thực** | IP-based, Kerberos | Active Directory, username/password |
| **Mount kiểu** | `mount -t nfs server:/share /mnt` | Map network drive `Z:\` hoặc `\\server\share` |
| **AWS Service** | EFS, S3 File Gateway | FSx for Windows, FSx File Gateway |

**Quy tắc nhớ:**
- **NFS = Linux/Unix** (nghĩ đến EC2 Linux, containers, HPC)
- **SMB = Windows** (nghĩ đến Active Directory, Windows desktops, Windows apps)

---

### NTFS — File System của Windows

**NTFS (New Technology File System)** là hệ thống file mặc định của Windows — cách ổ cứng **tổ chức và lưu trữ dữ liệu**.

```
Các file system phổ biến:

┌────────────┬──────────────┬──────────────────────────────────────┐
│ File System│  Dùng cho    │  Đặc điểm                            │
├────────────┼──────────────┼──────────────────────────────────────┤
│ NTFS       │ Windows      │ Permissions, encryption, compression,│
│            │              │ quotas, journaling                   │
├────────────┼──────────────┼──────────────────────────────────────┤
│ ext4       │ Linux        │ File system mặc định của Linux       │
├────────────┼──────────────┼──────────────────────────────────────┤
│ XFS        │ Linux (HPC)  │ Tối ưu cho file lớn                  │
├────────────┼──────────────┼──────────────────────────────────────┤
│ FAT32      │ USB, thẻ nhớ │ Đơn giản, giới hạn file ≤ 4GB        │
└────────────┴──────────────┴──────────────────────────────────────┘
```

**NTFS hỗ trợ:**
- **File-level permissions**: ai được đọc, ghi, xóa file nào (kết hợp với AD)
- **Disk quotas**: giới hạn dung lượng cho từng user
- **Encryption**: mã hóa file/folder (EFS — Encrypting File System, khác với Amazon EFS)
- **Journaling**: khôi phục dữ liệu khi mất điện đột ngột

---

### NTFS vs SMB — Khác tầng, khác việc

Hai cái này hay bị nhầm vì luôn đi cùng nhau trong Windows, nhưng ở **2 tầng hoàn toàn khác nhau**:

```
NTFS = cách tổ chức file TRÊN ổ đĩa        (File System)
SMB  = cách chia sẻ file QUA mạng           (Network Protocol)

Ví dụ đời thực:
──────────────────────────────────────────────────────────
NTFS = cách sắp xếp đồ TRONG tủ     (ngăn nào để gì, ai được mở ngăn nào)
SMB  = cánh cửa để người khác vào lấy đồ   (giao tiếp qua mạng)
```

**Ví dụ chi tiết trên Windows Server:**

```
Máy Windows Server (file server):

┌──────────────────────────────────────────────────┐
│  Ổ đĩa D:\                                       │
│  ┌───────────────────────────────────┐           │
│  │         NTFS (File System)        │ ← Tầng 1  │
│  │                                   │           │
│  │  D:\shared\                       │           │
│  │  ├── report.docx  (Owner: hiep)   │           │
│  │  ├── data.xlsx    (Read-only)     │           │
│  │  └── secret.pdf   (Admin only)    │           │
│  │                                   │           │
│  │  NTFS lo việc:                    │           │
│  │  • Lưu file lên disk thế nào      │           │
│  │  • Permissions: ai đọc/ghi/xóa    │           │
│  │  • Encryption, compression        │           │
│  │  • Journaling (chống mất data)    │           │
│  └───────────────────────────────────┘           │
│                                                  │
│  ┌───────────────────────────────────┐           │
│  │      SMB (Network Protocol)       │ ← Tầng 2  │
│  │                                   │           │
│  │  Share folder D:\shared qua mạng  │           │
│  │  Tên share: \\server\shared       │           │
│  │                                   │           │
│  │  SMB lo việc:                     │           │
│  │  • Truyền file qua network        │           │
│  │  • Xác thực user (qua AD)         │           │
│  │  • Lock file khi đang mở          │           │
│  │  • Cho nhiều máy truy cập cùng lúc│           │
│  └───────────────────────────────────┘           │
└──────────────────────────────────────────────────┘

         │ SMB qua mạng
         ▼
┌──────────────────┐  ┌──────────────────┐
│  PC nhân viên A  │  │  PC nhân viên B  │
│  Map \\server\   │  │  Map \\server\   │
│     shared → Z:\ │  │     shared → Z:\ │
└──────────────────┘  └──────────────────┘
```

**So sánh trực tiếp:**

| | **NTFS** | **SMB** |
|---|---|---|
| **Là gì** | File System (hệ thống tập tin) | Network Protocol (giao thức mạng) |
| **Làm gì** | Tổ chức data trên ổ đĩa | Truyền data qua mạng |
| **Hoạt động ở đâu** | Trên chính cái máy đó | Giữa 2+ máy qua network |
| **Tương đương Linux** | ext4, XFS | NFS |
| **Không có thì sao** | Không lưu được file lên ổ đĩa | Lưu được, nhưng chỉ máy đó dùng |

**Cách chúng phối hợp khi mở file qua mạng:**

```
Nhân viên mở file \\server\shared\report.docx:

Bước 1: PC gửi yêu cầu qua SMB ──────► Server nhận
Bước 2: Server kiểm tra AD ──────────► "hiep" thuộc group nào?
Bước 3: Server kiểm tra NTFS permission ► "hiep" có quyền đọc file?
Bước 4: NTFS đọc file từ ổ đĩa ──────► Lấy data
Bước 5: SMB trả file về PC ──────────► Nhân viên mở được file

        SMB = đường truyền
        NTFS = kho hàng + bảo vệ
        AD = xác minh danh tính
```

---

### Active Directory (AD)

**Active Directory** là hệ thống **quản lý users và quyền truy cập** của Microsoft, dùng phổ biến trong doanh nghiệp.

```
┌────────────────────────────────────────────────────────┐
│              ACTIVE DIRECTORY SERVER                   │
│                                                        │
│  Users:                                                │
│  ├── hieptran (Developer team)                         │
│  ├── ngocle (HR team)                                  │
│  └── minhvu (Admin team)                               │
│                                                        │
│  Groups:                                               │
│  ├── Developers → truy cập folder /code                │
│  ├── HR         → truy cập folder /hr-docs             │
│  └── Admins     → truy cập tất cả                      │
│                                                        │
│  Policies:                                             │
│  ├── Password phải ≥ 12 ký tự                          │
│  ├── Lock sau 5 lần sai password                       │
│  └── Tự động lock máy sau 10 phút                      │
└────────────────────────────────────────────────────────┘
```

**AD làm gì?**
- **Đăng nhập 1 lần** (Single Sign-On): login 1 account → truy cập email, file share, printer, ứng dụng nội bộ
- **Phân quyền theo group**: Developer vào folder code, HR vào folder nhân sự
- **Quản lý tập trung**: IT admin thêm/xóa user, đặt policy từ 1 chỗ

**Tại sao liên quan đến FSx for Windows?**

```
Nhân viên login Windows → AD xác thực → Tự động map folder \\fileserver\shared
                                          (quyền theo AD group)
```

FSx for Windows File Server tích hợp AD nên khi migrate lên AWS, nhân viên login y như cũ, quyền truy cập giữ nguyên. **EFS không có tính năng này**.

---

### Windows Ecosystem: AD + SMB + NTFS

Ba thứ này luôn đi cùng nhau:

```
Windows ecosystem:   AD (quản lý user) + SMB (giao thức share) + NTFS (file system)
                     ──────────────────────────────────────────────────────────────
                     → AWS: FSx for Windows File Server (hỗ trợ cả 3)

Linux ecosystem:     NFS (giao thức share) + ext4/XFS (file system) + POSIX permissions
                     ──────────────────────────────────────────────────────────────
                     → AWS: EFS hoặc FSx for Lustre

Block storage:       Ổ cứng thô, tự format
                     ──────────────────────────────────────────────────────────────
                     → AWS: EBS (gắn 1 EC2) hoặc Instance Store (tạm thời)
```

---

## Amazon EFS — NAS cho Linux trên Cloud

| Đặc điểm | Chi tiết |
|-----------|----------|
| **Protocol** | NFS (v4.0, v4.1) |
| **Client** | Linux EC2, ECS, EKS, Lambda |
| **Windows** | KHÔNG hỗ trợ (không có SMB) |
| **Scaling** | Tự động scale — dung lượng tăng/giảm theo file thực tế |
| **Availability** | Multi-AZ — data replicate across AZs |
| **Max throughput** | ~10 GB/s |
| **Use cases** | Web serving, content management, shared config, container storage |

```
                  ┌─────────────────────────┐
                  │      Amazon EFS         │
                  │   (Multi-AZ replicated) │
                  └───────┬─────────────────┘
                          │  NFS v4
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │ EC2 (AZ1)│  │ EC2 (AZ2)│  │ ECS Task │
     │  Linux   │  │  Linux   │  │  (AZ1)   │
     └──────────┘  └──────────┘  └──────────┘
```

**Khi nào chọn EFS?** → Cần shared file storage cho **Linux workloads**, không cần Windows/AD.

---

## FSx for Windows File Server — Windows file server trên Cloud

| Đặc điểm | Chi tiết |
|-----------|----------|
| **Protocol** | SMB (2.0, 2.1, 3.0, 3.1.1) |
| **File System** | NTFS |
| **Client** | Windows, Linux, macOS (qua SMB) — thiết kế cho Windows ecosystem |
| **Active Directory** | Tích hợp AD — quản lý users/permissions |
| **Features** | NTFS permissions, DFS (Distributed File System), quotas, deduplication |
| **Deployment** | Single-AZ hoặc Multi-AZ |
| **Max throughput** | 12-20 GB/s |
| **Use cases** | Windows file shares, .NET apps, SQL Server, SharePoint, Home directories |

```
                  ┌──────────────────────────────┐
                  │   FSx for Windows File Server│
                  │   NTFS + SMB + AD integration│
                  └──────────┬───────────────────┘
                             │  SMB
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Windows  │  │ Windows  │  │ Windows  │
        │ EC2      │  │ EC2      │  │ WorkSpace│
        │ \\fsx\   │  │ \\fsx\   │  │ \\fsx\   │
        │  share   │  │  share   │  │  share   │
        └──────────┘  └──────────┘  └──────────┘
                    ▲
                    │ Xác thực qua
              ┌─────────────┐
              │   Active    │
              │  Directory  │
              └─────────────┘
```

**Khi nào chọn?** → Câu hỏi nhắc đến: **Active Directory, SMB, Windows file shares, NTFS, DFS, Windows-based applications**.

---

## FSx for Lustre — Siêu xe cho tính toán nặng

| Đặc điểm | Chi tiết |
|-----------|----------|
| **Protocol** | Lustre (POSIX-compliant, custom protocol tối ưu hiệu năng) |
| **Client** | CHỈ Linux |
| **Throughput** | Lên đến **1000 GB/s**, hàng triệu IOPS |
| **S3 Integration** | Tự động import/export data từ S3 bucket |
| **Deployment** | Chỉ Single-AZ (Persistent hoặc Scratch) |
| **Latency** | Sub-millisecond |
| **Use cases** | HPC, Machine Learning training, video processing, financial modeling, genomics |

```
     ┌──────────────┐        ┌───────────────────────┐
     │   S3 Bucket  │◄──────►│   FSx for Lustre      │
     │ (data lake)  │  auto  │   1000 GB/s throughput│
     └──────────────┘  sync  └──────────┬────────────┘
                                         │  Lustre protocol
                           ┌─────────────┼─────────────┐
                           ▼             ▼             ▼
                    ┌──────────┐  ┌──────────┐  ┌──────────┐
                    │ HPC Node │  │ ML Train │  │ Video    │
                    │  (Linux) │  │  (Linux) │  │ Process  │
                    └──────────┘  └──────────┘  └──────────┘
```

**So sánh EFS vs FSx for Lustre:**

| | EFS | FSx for Lustre |
|---|---|---|
| Throughput max | ~10 GB/s | **1000 GB/s** |
| S3 integration | Không có native | Tự động link S3 bucket |
| AZ | Multi-AZ | Single-AZ only |
| Use case | General-purpose shared files | HPC, ML, big data processing |
| Multi-AZ SLA | 99.99% | 99.5% (single-AZ) |

**Keywords trong thi:** "high performance", "compute-intensive", "machine learning training data", "HPC cluster", "process large datasets from S3".

---

## AWS Storage Gateway — Cầu nối On-premises và AWS

Storage Gateway là dịch vụ **hybrid** — đặt tại on-premises, giúp app cũ truy cập AWS storage mà **không cần thay đổi code**.

```
On-Premises                              AWS Cloud

┌──────────┐    NFS/SMB    ┌──────────────┐    HTTPS    ┌─────────┐
│  App cũ  │──────────────►│   Storage    │────────────►│  S3 /   │
│(không đổi│               │   Gateway    │             │  FSx /  │
│   code)  │               │  (VM/HW)     │             │  EBS    │
└──────────┘               └──────────────┘             └─────────┘
                           Cache locally ↑
                           (truy cập nhanh)
```

### 4 loại Gateway

| Loại | Backend AWS | Protocol | Use case |
|------|------------|----------|----------|
| **S3 File Gateway** | S3 | NFS, SMB | File → Object storage, backup, data lake |
| **FSx File Gateway** | FSx for Windows | SMB | Cache local cho FSx Windows shares |
| **Volume Gateway** | S3 + EBS snapshots | iSCSI | Block storage hybrid |
| **Tape Gateway** | S3 + Glacier | iSCSI/VTL | Thay thế tape backup vật lý |

**S3 File Gateway** — phổ biến nhất:
```
On-premises app              S3 File Gateway              AWS
┌──────────┐   NFS/SMB   ┌──────────────┐   HTTPS   ┌──────────┐
│ App dùng │────────────►│ Convert file │──────────►│   S3     │
│ NFS/SMB  │             │ → S3 object  │           │ (objects)│
└──────────┘             │ + local cache│           └──────────┘
                         └──────────────┘
```

**FSx File Gateway** — cho Windows multi-region:
```
On-premises (Region A)       FSx File Gateway       AWS (Region B)
┌──────────┐    SMB     ┌──────────────┐   SMB   ┌──────────────┐
│ Windows  │───────────►│  Local cache │────────►│ FSx Windows  │
│ clients  │            │  (low lat.)  │         │ File Server  │
└──────────┘            └──────────────┘         └──────────────┘
```

**Keywords trong thi:** "on-premises", "hybrid", "local cache", "migrate to cloud without changing applications".

---

## FSx for NetApp ONTAP và OpenZFS

Ngoài Windows và Lustre, FSx còn 2 loại nữa thỉnh thoảng xuất hiện trong thi:

### FSx for NetApp ONTAP

| Đặc điểm | Chi tiết |
|-----------|----------|
| **Protocol** | NFS + SMB + iSCSI (cả 3!) |
| **Đặc biệt** | Multi-protocol, tự động tiering (hot/cold), data dedup, SnapMirror |
| **Use case** | Migrate NAS appliances lên AWS, cần cả NFS lẫn SMB cùng lúc |

**Keyword:** "multi-protocol", "NFS and SMB simultaneously", "NAS migration", "iSCSI"

### FSx for OpenZFS

| Đặc điểm | Chi tiết |
|-----------|----------|
| **Protocol** | NFS |
| **Đặc biệt** | Snapshots, cloning, compression, latency <0.5ms |
| **Use case** | Migrate Linux ZFS file servers, dev/test environments |

**Keyword:** "ZFS", "Linux file server migration", "snapshots and cloning"

---

## Bảng so sánh tổng hợp

### Protocol và Compatibility

| Dịch vụ | File System | Protocol | Client OS | AD Support |
|---------|-------------|----------|-----------|------------|
| **EFS** | NFS-managed | NFS v4 | Linux only | Không |
| **FSx Windows** | NTFS | SMB | Windows, Linux, macOS | Có |
| **FSx Lustre** | Lustre | Lustre (POSIX) | Linux only | Không |
| **FSx NetApp ONTAP** | WAFL | NFS + SMB + iSCSI | Tất cả | Có |
| **FSx OpenZFS** | ZFS | NFS | Windows, Linux, macOS | Không |
| **EBS** | Tự format | N/A (block) | Gắn 1 EC2 | N/A |

### Performance

| Dịch vụ | Max Throughput | Max IOPS | Latency |
|---------|---------------|----------|---------|
| **EFS** | ~10 GB/s | Hàng trăm nghìn | <1ms |
| **FSx Windows** | 12-20 GB/s | Hàng trăm nghìn | <1ms |
| **FSx Lustre** | **1000 GB/s** | Hàng triệu | <1ms |
| **FSx NetApp ONTAP** | 72-80 GB/s | Hàng triệu | <1ms |
| **FSx OpenZFS** | 10-21 GB/s | 1-2 triệu | <0.5ms |

### Availability

| Dịch vụ | Deployment | SLA |
|---------|-----------|-----|
| **EFS** | Multi-AZ (mặc định) | 99.99% |
| **FSx Windows** | Single-AZ hoặc Multi-AZ | Multi-AZ: 99.99%, Single-AZ: 99.5% |
| **FSx Lustre** | Single-AZ (Persistent/Scratch) | 99.5% |
| **FSx NetApp ONTAP** | Single-AZ hoặc Multi-AZ | Multi-AZ: 99.99%, Single-AZ: 99.9% |
| **FSx OpenZFS** | Single-AZ hoặc Multi-AZ | Multi-AZ: 99.99%, Single-AZ: 99.5% |

---

## Bản đồ toàn cảnh AWS File Storage

Diagram dưới đây gom **tất cả các chiều** quan trọng vào 1 bức tranh duy nhất: client/use case → protocol → service → đặc tính chính, kèm lớp hybrid và bối cảnh rộng hơn (Block vs File vs Object).

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                        AWS FILE STORAGE — ONE-PAGE OVERVIEW                                   │
│                                                                                               │
│  CLIENT / USE CASE          PROTOCOL          SERVICE                      KEY SPECS          │
│  ══════════════════        ══════════        ═══════════════════          ═══════════════     │
│                                                                                               │
│  Linux apps                                   ┌─────────────────────┐     Multi-AZ · 99.99%   │
│  Containers (ECS/EKS) ───── NFS v4 ─────────► │  Amazon EFS         │     ~10 GB/s            │
│  Lambda, general share                        │  (managed NFS)      │     No AD · Auto-scale  │
│                                               └─────────────────────┘                         │
│                                                                                               │
│  Windows apps, .NET                           ┌─────────────────────┐     Single/Multi-AZ     │
│  SharePoint, SQL Server ──  SMB 2/3  ───────► │  FSx for Windows    │     12-20 GB/s          │
│  Home dirs, DFS             (+ NTFS on disk)  │  File Server        │     Active Directory ✓  │
│  (AD-integrated)            (AD auth)         └─────────────────────┘     NTFS permissions    │
│                                                                                               │
│  HPC, ML training                             ┌─────────────────────┐     Single-AZ · 99.5%   │
│  Genomics, video            Lustre            │  FSx for Lustre     │     1000 GB/s           │
│  Big data from S3    ─────  (POSIX)  ───────► │  (Linux only)       │     Auto-sync với S3    │
│                                               └─────────────────────┘     Sub-ms latency      │
│                                                                                               │
│  NAS migration                                ┌─────────────────────┐     Single/Multi-AZ     │
│  Cần cả Windows + Linux     NFS + SMB         │  FSx for NetApp     │     72-80 GB/s          │
│  Enterprise appliances ──── + iSCSI  ───────► │  ONTAP              │     AD ✓ · SnapMirror   │
│                                               └─────────────────────┘     Tiering · Dedup     │
│                                                                                               │
│  ZFS Linux migration                          ┌─────────────────────┐     Single/Multi-AZ     │
│  Dev/test, snapshots  ───── NFS     ────────► │  FSx for OpenZFS    │     10-21 GB/s          │
│  & cloning                                    │                     │     <0.5ms latency      │
│                                               └─────────────────────┘     Clone · Compression │
│                                                                                               │
│ ──────────────────────────────────────────────────────────────────────────────────────────────│
│  HYBRID (On-premises ↔ AWS)                                                                   │
│                                                                                               │
│  On-prem app (không sửa code)                 ┌───────────────────────────────┐               │
│  ┌─────────────┐                              │  AWS Storage Gateway          │               │
│  │ NFS/SMB/    │                              │  ├─ S3 File Gateway    → S3   │               │
│  │ iSCSI client│ ──── NFS/SMB/iSCSI ────────► │  ├─ FSx File Gateway  → FSx W │               │
│  └─────────────┘        (+ local cache)       │  ├─ Volume Gateway    → EBS   │               │
│                                               │  └─ Tape Gateway      → Glac. │               │
│                                               └───────────────────────────────┘               │
│                                                                                               │
│ ══════════════════════════════════════════════════════════════════════════════════════════════│
│  BỐI CẢNH — File Storage chỉ là 1 trong 3 loại Core Storage                                   │
│                                                                                               │
│     BLOCK (ổ cứng 1-EC2)       ║    FILE (folder share)      ║    OBJECT (HTTP API)           │
│     ────────────────────       ║    ─────────────────        ║    ─────────────────           │
│     • EBS (persistent)         ║   • EFS                     ║   • S3                         │
│     • Instance Store (ephemeral)║   • FSx (4 loại)           ║   • S3 Glacier                 │
│     Format NTFS/ext4/XFS       ║    Mount qua NFS/SMB        ║    GET/PUT/DELETE              │
│                                                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Quick decision tree — chọn service nào?**

```
OS của client?         Windows + AD ─────────────► FSx for Windows
                       Linux, general-purpose ───► EFS
                       Linux, cực nhanh (HPC/ML) ► FSx for Lustre
Cần cả NFS + SMB? ─────────────────────────────────► FSx for NetApp ONTAP
Migrate ZFS? ──────────────────────────────────────► FSx for OpenZFS
App cũ on-prem? ───────────────────────────────────► Storage Gateway
Chỉ 1 EC2 dùng? ───────────────────────────────────► EBS (Block, không phải File)
```

> **Lưu ý thuật ngữ — NAS (Network Attached Storage):** thiết bị/server chuyên dụng chứa file và chia sẻ qua mạng cho nhiều máy cùng truy cập (NFS/SMB). Hãng NAS phổ biến: NetApp, Dell EMC, Synology, QNAP. Trong AWS: **EFS** (NAS cho Linux), **FSx for Windows** (NAS cho Windows), **FSx for NetApp ONTAP** (thay thế trực tiếp NAS appliance on-premises).

---

## Bức tranh toàn cảnh: 5 nhóm Storage trong AWS

File storage không đứng một mình — nó nằm trong hệ sinh thái rộng hơn gồm **5 nhóm** dịch vụ. Hiểu toàn cảnh giúp tránh nhầm lẫn giữa các service.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. CORE STORAGE — Nơi dữ liệu thực sự nằm                                  │
│                                                                             │
│  Block Storage        File Storage (Shared)         Object Storage          │
│  ┌──────────────┐     ┌──────────────────────┐     ┌──────────────┐         │
│  │ EBS          │     │ EFS (NFS · Linux)    │     │ S3           │         │
│  │ Instance     │     │ FSx Windows (SMB·AD) │     │ S3 Glacier   │         │
│  │   Store      │     │ FSx Lustre (HPC)     │     │              │         │
│  │              │     │ FSx ONTAP (NFS+SMB   │     │              │         │
│  │              │     │   +iSCSI)            │     │              │         │
│  │              │     │ FSx OpenZFS (NFS)    │     │              │         │
│  └──────────────┘     └──────────────────────┘     └──────────────┘         │
├─────────────────────────────────────────────────────────────────────────────┤
│  2. HYBRID — Kết nối On-Premises ↔ AWS                                      │
│                                                                             │
│  Storage Gateway                                                            │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │ S3 File Gateway      → App on-prem truy cập S3 qua NFS/SMB │             │
│  │ FSx File Gateway     → Cache local cho FSx Windows         │             │
│  │ Volume Gateway       → Block storage → EBS Snapshots       │             │
│  │ Tape Gateway         → Giả lập băng từ → S3 Glacier        │             │
│  └────────────────────────────────────────────────────────────┘             │
├─────────────────────────────────────────────────────────────────────────────┤
│  3. DATA TRANSFER — Di chuyển dữ liệu vào/ra AWS                            │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │ Transfer Family  │  │ DataSync         │  │ Snow Family               │  │
│  │ SFTP·FTPS·FTP·AS2│  │ Sync nhanh       │  │ Snowcone·Snowball·        │  │
│  │ → upload vào     │  │ on-prem ↔ AWS    │  │ Snowmobile                │  │
│  │   S3 hoặc EFS    │  │ hoặc AWS ↔ AWS   │  │ Chuyển vật lý TB → EB     │  │
│  └──────────────────┘  └──────────────────┘  └───────────────────────────┘  │
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │ S3 Transfer      │                                                       │
│  │ Acceleration     │                                                       │
│  │ Upload nhanh     │                                                       │
│  │ qua Edge         │                                                       │
│  └──────────────────┘                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  4. ACCESS & DELIVERY — Cách truy cập dữ liệu                               │
│                                                                             │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ CloudFront   │  │ S3 Access      │  │ VPC Endpoints│  │ Direct       │   │
│  │ CDN · cache  │  │ Points         │  │ Truy cập S3/ │  │ Connect      │   │
│  │ S3 gần user  │  │ Điểm truy cập  │  │ EFS không qua│  │ Kết nối      │   │
│  │              │  │ riêng per app  │  │ Internet     │  │ chuyên dụng  │   │
│  └──────────────┘  └────────────────┘  └──────────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  5. MANAGEMENT — Quản lý & bảo vệ                                           │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AWS Backup   │  │ S3 Lifecycle │  │ S3           │  │ S3 Storage   │     │
│  │ Backup tập   │  │ Tự chuyển    │  │ Replication  │  │ Lens         │     │
│  │ trung EBS/   │  │ class:       │  │ CRR · SRR    │  │ Phân tích    │     │
│  │ EFS/FSx/S3   │  │ Std→IA→Glac  │  │ Cross/Same   │  │ usage &      │     │
│  │              │  │              │  │ Region       │  │ dashboard    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tóm tắt nhanh:**

| Nhóm | Câu hỏi trả lời | Services chính |
|------|-----------------|----------------|
| **Core Storage** | "Lưu ở đâu?" | EBS, EFS, FSx (4 loại), S3, Glacier |
| **Hybrid** | "On-prem kết nối AWS thế nào?" | Storage Gateway (4 loại) |
| **Data Transfer** | "Di chuyển data vào/ra AWS bằng gì?" | Transfer Family, DataSync, Snow Family, S3 Transfer Acceleration |
| **Access & Delivery** | "Truy cập data nhanh/an toàn thế nào?" | CloudFront, S3 Access Points, VPC Endpoints, Direct Connect |
| **Management** | "Bảo vệ & tối ưu data thế nào?" | AWS Backup, S3 Lifecycle, S3 Replication, Storage Lens |

> **Lưu ý:** AWS Transfer Family (SFTP/FTPS/FTP/AS2) là **cổng upload** — nó không lưu trữ data mà chuyển file từ bên ngoài vào S3 hoặc EFS. Đừng nhầm với File Storage.

---

## Cheat Sheet cho thi

### Keyword → Chọn dịch vụ nào

| Keyword trong đề | → Chọn |
|---|---|
| Linux shared file, NFS, containers | **EFS** |
| Windows, SMB, Active Directory, NTFS, DFS | **FSx for Windows** |
| HPC, ML, high throughput, S3 integration, compute-intensive | **FSx for Lustre** |
| On-premises ↔ Cloud, hybrid, local cache, no app changes | **Storage Gateway** |
| NAS migration, multi-protocol (NFS + SMB + iSCSI) | **FSx for NetApp ONTAP** |
| ZFS, Linux file server migration | **FSx for OpenZFS** |
| Ổ cứng gắn 1 EC2, block storage, boot volume | **EBS** |
| SFTP, FTPS, FTP, AS2, managed file transfer | **AWS Transfer Family** |
| Sync data on-prem ↔ AWS nhanh, scheduled transfer | **AWS DataSync** |
| Petabytes, physical transfer, offline migration | **Snow Family** |
| Upload S3 nhanh từ xa, global users upload | **S3 Transfer Acceleration** |

---

## Mẹo phân biệt nhanh khi làm bài

1. **Thấy "Active Directory" + "file share"** → FSx for Windows (EFS không có AD)
2. **Thấy "NFS" + "Linux" + "shared"** → EFS
3. **Thấy "HPC" hoặc "machine learning" + "file system"** → FSx for Lustre
4. **Thấy "on-premises" cần access cloud storage** → Storage Gateway
5. **Thấy "S3 File Gateway"** → on-prem app truy cập S3 qua NFS/SMB (data lưu thành objects trong S3)
6. **Thấy "FSx File Gateway"** → on-prem cần local cache cho FSx Windows shares
7. **Thấy "NFS and SMB" cùng lúc** → FSx for NetApp ONTAP
8. **Thấy "DFS" (Distributed File System)** → FSx for Windows
9. **Thấy "Lustre" + "S3"** → FSx for Lustre (tự động sync data với S3)
10. **Thấy "tape backup" + "cloud"** → Storage Gateway (Tape Gateway)

### Các cạm bẫy thường gặp

| Cạm bẫy | Sai | Đúng |
|----------|-----|------|
| "Linux cần shared file" → chọn FSx Windows | FSx Windows | **EFS** |
| "Windows cần shared file" → chọn EFS | EFS | **FSx for Windows** |
| "HPC cần high throughput" → chọn EFS | EFS | **FSx for Lustre** |
| "On-prem cần access S3" → chọn EFS/FSx | EFS/FSx | **S3 File Gateway** |
| "Cần NFS + SMB cùng lúc" → chọn EFS | EFS | **FSx NetApp ONTAP** |

---

## Tài liệu tham khảo

- [Choosing an Amazon FSx File System](https://aws.amazon.com/fsx/when-to-choose-fsx/) — So sánh chi tiết 4 loại FSx
- [AWS Storage Gateway - File Gateway](https://aws.amazon.com/storagegateway/file/) — S3 File Gateway vs FSx File Gateway
- [Replatforming File Shares](https://docs.aws.amazon.com/prescriptive-guidance/latest/migration-replatforming-cots-applications/replatforming-file-shares.html) — Hướng dẫn migrate file shares lên AWS
- [AWS Storage Services Overview (Whitepaper)](https://docs.aws.amazon.com/whitepapers/latest/aws-overview/storage-services.html) — Tổng quan tất cả storage services

### Tài liệu liên quan trong repo

- [Amazon EFS](efs.md) — Chi tiết về EFS
- [Amazon FSx](fsx.md) — Chi tiết 4 loại FSx
- [AWS Storage Gateway](aws-storage-gateway.md) — Chi tiết 4 loại Gateway
- [AWS Storage Deep Dive](aws-storage-deep-dive.md) — So sánh tất cả loại storage
- [AWS Transfer Family](aws-transfer-family.md) — SFTP/FTPS/FTP/AS2 managed file transfer
- [AWS DataSync](aws-datasync.md) — Sync data on-prem ↔ AWS
- [Snow Family](snow-family.md) — Physical data transfer
- [S3 Transfer Acceleration](s3-transfer-acceleration.md) — Upload S3 nhanh qua Edge
- [EBS](ebs.md) — Block Storage chi tiết
