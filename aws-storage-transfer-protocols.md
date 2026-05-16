# AWS Storage & Transfer Protocols Cheatsheet

## Mục lục

- [Tóm tắt nhanh](#tóm-tắt-nhanh)
- [Storage/File Protocols](#storagefile-protocols)
- [Transfer Protocols](#transfer-protocols)
- [Bảng chọn service theo protocol](#bảng-chọn-service-theo-protocol)
- [Các cặp dễ nhầm](#các-cặp-dễ-nhầm)
- [Ví dụ đọc đề thi](#ví-dụ-đọc-đề-thi)
- [Mẹo nhớ](#mẹo-nhớ)
- [Nguồn AWS chính thức](#nguồn-aws-chính-thức)

---

## Tóm tắt nhanh

File này chỉ tập trung vào 2 nhóm protocol dễ nhầm trong AWS:

1. **Storage/File protocols** — app/server dùng để **mount/truy cập storage như file system hoặc block device**.
2. **Transfer protocols** — user/partner dùng để **upload/download file qua một endpoint transfer**.

Một câu phân biệt:

> **NFS/SMB/iSCSI/VTL = storage access.**  
> **SFTP/FTPS/FTP/AS2 = file transfer endpoint.**

| Nhóm | Protocol | Nghĩ tới service AWS |
|---|---|---|
| Storage/File | **NFS** | EFS, FSx for OpenZFS/ONTAP, Storage Gateway, DataSync source/destination |
| Storage/File | **SMB** | FSx for Windows File Server, FSx for ONTAP, Storage Gateway, DataSync source/destination |
| Storage/File | **iSCSI** | Storage Gateway Volume Gateway, FSx for ONTAP |
| Storage/File | **VTL / Tape** | Storage Gateway Tape Gateway |
| Storage/File/Object | **S3 API / Object** | S3, DataSync object locations, S3 File Gateway backend |
| Transfer | **SFTP** | AWS Transfer Family |
| Transfer | **FTPS** | AWS Transfer Family |
| Transfer | **FTP** | AWS Transfer Family |
| Transfer/B2B | **AS2** | AWS Transfer Family |

---

## Storage/File Protocols

### NFS — Network File System

**NFS** là file protocol phổ biến cho Linux/Unix. App/server mount file system rồi đọc/ghi file như thư mục local.

```text
Linux app / EC2 / on-prem server
        │
        │ NFS mount
        ▼
File storage
```

Trong AWS, NFS thường gắn với:

| Service | Vai trò |
|---|---|
| **Amazon EFS** | Managed elastic file system, hỗ trợ NFSv4.0/NFSv4.1 |
| **Amazon FSx for OpenZFS** | Managed OpenZFS file system, truy cập qua NFS |
| **Amazon FSx for NetApp ONTAP** | Multi-protocol storage, có NFS |
| **AWS Storage Gateway - S3 File Gateway** | On-prem app dùng NFS để đọc/ghi file, gateway map sang S3 object |
| **AWS DataSync** | Copy/sync dữ liệu từ/đến NFS location |

Khi thấy keyword:

```text
NFS, Linux file share, mount target, POSIX-style file access
```

thường nghĩ tới **EFS / FSx / Storage Gateway / DataSync**, tùy bài toán là runtime storage hay migration.

---

### SMB — Server Message Block

**SMB** là file sharing protocol phổ biến trong Windows environment.

```text
Windows app / user / server
        │
        │ SMB share: \\server\share
        ▼
Windows-compatible file storage
```

Trong AWS, SMB thường gắn với:

| Service | Vai trò |
|---|---|
| **Amazon FSx for Windows File Server** | Managed Windows file server, native SMB |
| **Amazon FSx for NetApp ONTAP** | Multi-protocol storage, có SMB |
| **AWS Storage Gateway - S3 File Gateway** | On-prem app dùng SMB share, gateway map file sang S3 object |
| **AWS DataSync** | Copy/sync dữ liệu từ/đến SMB location |

Khi thấy keyword:

```text
SMB, Windows file share, \\server\share, Active Directory, home directory
```

thường nghĩ tới **FSx for Windows File Server** hoặc **Storage Gateway**, nếu là migration/sync thì **DataSync**.

---

### iSCSI — Internet Small Computer Systems Interface

**iSCSI** trình bày storage qua mạng như **block device**. OS/app thấy nó giống disk/volume, không phải file share.

```text
Server
  sees block disk / volume
        │
        │ iSCSI
        ▼
Cloud-backed block storage
```

Trong AWS, iSCSI thường gắn với:

| Service | Vai trò |
|---|---|
| **AWS Storage Gateway - Volume Gateway** | Cloud-backed iSCSI volumes cho on-prem application servers |
| **AWS Storage Gateway - Tape Gateway** | Virtual tape library cũng dùng iSCSI VTL model |
| **Amazon FSx for NetApp ONTAP** | Có thể dùng iSCSI LUN cho block storage use case |

Khi thấy keyword:

```text
iSCSI, block device, LUN, volume, SAN-like storage
```

thường nghĩ tới **Storage Gateway Volume Gateway** hoặc **FSx for ONTAP**.

---

### VTL / Tape — Virtual Tape Library

**VTL** là mô hình giả lập tape library để backup software hiện có vẫn tưởng nó đang ghi tape.

```text
Backup software
        │
        │ iSCSI VTL / virtual tape
        ▼
Storage Gateway Tape Gateway
        │
        ▼
S3 Glacier Flexible Retrieval / S3 Glacier Deep Archive
```

Trong AWS, keyword này gần như trỏ tới:

```text
AWS Storage Gateway - Tape Gateway
```

Dùng khi muốn thay physical tape bằng cloud archive nhưng không muốn đổi backup software/workflow quá nhiều.

---

### S3 API / Object access

**S3 không phải file system protocol như NFS/SMB.** S3 là object storage, truy cập qua API/HTTPS.

```text
Application / AWS SDK / CLI
        │
        │ S3 API over HTTPS
        ▼
Amazon S3 bucket / object
```

Trong AWS, S3 API/object access thường gắn với:

| Service | Vai trò |
|---|---|
| **Amazon S3** | Object storage chính |
| **AWS DataSync** | Transfer tới/từ S3 hoặc object storage |
| **AWS Storage Gateway - S3 File Gateway** | App dùng NFS/SMB ở phía on-prem, gateway ghi object vào S3 phía backend |
| **AWS Transfer Family** | User/partner dùng SFTP/FTPS/FTP/AS2, file lưu vào S3 backend |

Điểm cần nhớ:

> App dùng **S3 API** thì nói chuyện trực tiếp với S3.  
> App dùng **NFS/SMB** nhưng backend là S3 thì thường là **Storage Gateway S3 File Gateway**.  
> Partner dùng **SFTP/FTP/AS2** nhưng backend là S3 thì thường là **Transfer Family**.

---

## Transfer Protocols

### SFTP — SSH File Transfer Protocol

**SFTP** là file transfer protocol chạy trên SSH. Đây là protocol hay gặp nhất khi đối tác/vendor gửi file cho doanh nghiệp.

```text
Partner / vendor / user
        │
        │ SFTP client: WinSCP, FileZilla, script sftp
        ▼
AWS Transfer Family
        │
        ▼
Amazon S3 hoặc Amazon EFS
```

Trong AWS, khi thấy **SFTP managed endpoint**, gần như chọn:

```text
AWS Transfer Family
```

Không nhầm với Storage Gateway:

- SFTP là **connect-upload/download-disconnect**.
- NFS/SMB là **mount file share rồi app đọc/ghi như local folder**.

---

### FTPS — FTP over TLS/SSL

**FTPS** là FTP có mã hóa TLS/SSL. Dùng khi hệ thống legacy/partner yêu cầu FTP-style workflow nhưng cần encryption.

Trong AWS:

```text
FTPS endpoint → AWS Transfer Family → S3/EFS
```

Keyword:

```text
FTPS, FTP over TLS, legacy secure FTP partner
```

→ nghĩ **AWS Transfer Family**.

---

### FTP — File Transfer Protocol

**FTP** là protocol file transfer cũ, không mã hóa theo mặc định. Chỉ dùng khi legacy system bắt buộc.

Trong AWS:

```text
FTP endpoint → AWS Transfer Family → S3/EFS
```

Lưu ý: nếu đề yêu cầu bảo mật/encryption, thường ưu tiên **SFTP** hoặc **FTPS** thay vì FTP plain.

---

### AS2 — Applicability Statement 2

**AS2** thường dùng trong B2B/EDI workflow, ví dụ supply chain, logistics, payments, ERP/CRM integrations.

```text
Business partner
        │
        │ AS2
        ▼
AWS Transfer Family
        │
        ▼
Amazon S3
```

Keyword:

```text
AS2, EDI, B2B transaction, supply chain, trading partner
```

→ nghĩ **AWS Transfer Family**.

---

## Bảng chọn service theo protocol

| Nếu đề bài nói... | Protocol | Service nên nghĩ tới | Lý do |
|---|---|---|---|
| Linux app cần shared file system | NFS | **Amazon EFS** | EFS hỗ trợ NFSv4.0/NFSv4.1 |
| Windows app cần file share managed | SMB | **FSx for Windows File Server** | Native Windows file system + SMB |
| App on-prem cần NFS/SMB share nhưng data nằm trên S3 | NFS/SMB | **Storage Gateway - S3 File Gateway** | File interface vào S3 + local cache |
| Copy dữ liệu từ NAS NFS/SMB lên S3/EFS/FSx | NFS/SMB | **AWS DataSync** | Transfer/sync task, migration/replication |
| On-prem server cần cloud-backed block volume | iSCSI | **Storage Gateway - Volume Gateway** | iSCSI volume cho application server |
| Backup software cần virtual tape | iSCSI VTL | **Storage Gateway - Tape Gateway** | VTL archive lên S3 Glacier classes |
| Partner upload file bằng SFTP | SFTP | **AWS Transfer Family** | Managed SFTP endpoint vào S3/EFS |
| Partner chỉ hỗ trợ FTPS/FTP | FTPS/FTP | **AWS Transfer Family** | Managed FTP/FTPS endpoint |
| B2B/EDI cần AS2 | AS2 | **AWS Transfer Family** | Transfer Family hỗ trợ AS2 |
| App viết bằng SDK cần object storage | S3 API/HTTPS | **Amazon S3** | Object storage API |

---

## Các cặp dễ nhầm

### SFTP vs SMB/NFS

| Điểm | SFTP | SMB/NFS |
|---|---|---|
| Bản chất | File transfer | File system access |
| Cách dùng | Login rồi upload/download file | Mount share rồi đọc/ghi như thư mục |
| AWS service chính | Transfer Family | EFS, FSx, Storage Gateway |
| Người dùng thường gặp | Partner/vendor/external user | App/server nội bộ |
| Ví dụ | `sftp user@host`, `put report.csv` | `mount -t nfs ...`, `\\server\share` |

### Transfer Family vs Storage Gateway

| Điểm | Transfer Family | Storage Gateway |
|---|---|---|
| Cho ai? | Partner/user/client transfer file | App/server on-prem dùng storage |
| Protocol | SFTP, FTPS, FTP, AS2 | NFS, SMB, iSCSI, VTL |
| Backend | S3 hoặc EFS | S3, FSx, cloud-backed volumes, Glacier archive |
| Có local cache appliance on-prem? | Không phải ý chính | Có |
| Thay thế cái gì? | SFTP/FTP/AS2 server tự quản | NAS/SAN/tape gateway on-prem |

### DataSync vs Transfer Family

| Điểm | DataSync | Transfer Family |
|---|---|---|
| Bản chất | Migration/sync tool | Managed file transfer server |
| Source | NFS, SMB, HDFS, object, AWS storage | SFTP/FTPS/FTP/AS2 client |
| Kiểu chạy | Task, schedule, verify, retry | Endpoint để user/partner gửi/nhận file |
| Ví dụ | Sync 20 TB NAS lên S3 mỗi đêm | Partner upload CSV qua SFTP mỗi ngày |

---

## Ví dụ đọc đề thi

### Ví dụ 1

> Công ty có Linux workloads cần shared file system, nhiều EC2 cùng mount, tự scale dung lượng.

Keyword: `Linux`, `shared file system`, `mount`  
Protocol: **NFS**  
Chọn: **Amazon EFS**

---

### Ví dụ 2

> Công ty có Windows applications cần SMB file share và tích hợp Active Directory.

Keyword: `Windows`, `SMB`, `Active Directory`  
Protocol: **SMB**  
Chọn: **Amazon FSx for Windows File Server**

---

### Ví dụ 3

> App on-prem đang ghi vào SMB share. Muốn lưu dữ liệu lâu dài trên S3, nhưng không sửa app.

Keyword: `on-prem app`, `SMB share`, `S3`, `không sửa app`  
Protocol: **SMB phía app, S3 phía backend**  
Chọn: **AWS Storage Gateway - S3 File Gateway**

---

### Ví dụ 4

> Cần migrate 40 TB từ NAS NFS on-prem lên S3, có verification và schedule.

Keyword: `migrate`, `40 TB`, `NFS`, `verification`, `schedule`  
Protocol: **NFS source**  
Chọn: **AWS DataSync**

---

### Ví dụ 5

> Đối tác gửi file hằng ngày bằng SFTP, file cần lưu vào S3.

Keyword: `partner`, `SFTP`, `daily file`, `S3`  
Protocol: **SFTP**  
Chọn: **AWS Transfer Family**

---

### Ví dụ 6

> Backup software hiện tại chỉ support tape library, muốn archive lên AWS cloud.

Keyword: `backup software`, `tape library`, `archive`  
Protocol/model: **VTL / virtual tape**  
Chọn: **AWS Storage Gateway - Tape Gateway**

---

## Mẹo nhớ

```text
NFS  = Linux/Unix file share      → EFS, FSx, Storage Gateway, DataSync
SMB  = Windows file share         → FSx Windows, FSx ONTAP, Storage Gateway, DataSync
iSCSI = Block volume over network → Storage Gateway Volume, FSx ONTAP
VTL  = Tape backup                → Storage Gateway Tape
S3 API = Object access            → S3

SFTP = Secure partner upload      → Transfer Family
FTPS = Secure legacy FTP          → Transfer Family
FTP  = Legacy file transfer       → Transfer Family
AS2  = B2B/EDI transfer           → Transfer Family
```

Cách hỏi nhanh:

```text
Có chữ “mount”, “share”, “volume”, “file system”, “block”, “tape”?
→ Storage/File protocol.

Có chữ “partner upload”, “SFTP”, “FTP”, “AS2”, “B2B file exchange”?
→ Transfer protocol.
```

---

## Nguồn AWS chính thức

- [Amazon EFS - What is Amazon Elastic File System?](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- [Amazon FSx for Windows File Server - What is FSx for Windows File Server?](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/what-is.html)
- [Amazon FSx for NetApp ONTAP - How it works](https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/how-it-works-fsx-ontap.html)
- [Amazon FSx for Lustre - What is Amazon FSx for Lustre?](https://docs.aws.amazon.com/fsx/latest/LustreGuide/what-is.html)
- [Amazon S3 File Gateway](https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html)
- [AWS Storage Gateway - Volume Gateway](https://docs.aws.amazon.com/storagegateway/latest/vgw/WhatIsStorageGateway.html)
- [AWS Storage Gateway - Tape Gateway](https://docs.aws.amazon.com/storagegateway/latest/tgw/WhatIsStorageGateway.html)
- [AWS DataSync - What is AWS DataSync?](https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html)
- [AWS Transfer Family - What is AWS Transfer Family?](https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html)
