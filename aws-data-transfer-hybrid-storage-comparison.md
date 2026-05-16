# AWS Data Transfer & Hybrid Storage Comparison

## Mục lục

- [Tóm tắt nhanh](#tóm-tắt-nhanh)
- [Câu hỏi chọn dịch vụ](#câu-hỏi-chọn-dịch-vụ)
- [Bảng phân biệt chính](#bảng-phân-biệt-chính)
- [DataSync vs Storage Gateway](#datasync-vs-storage-gateway)
- [Các dịch vụ tương tự dễ nhầm](#các-dịch-vụ-tương-tự-dễ-nhầm)
- [Decision Tree](#decision-tree)
- [Kịch bản thường gặp](#kịch-bản-thường-gặp)
- [Mẹo nhớ](#mẹo-nhớ)
- [Nguồn AWS chính thức](#nguồn-aws-chính-thức)

---

## Tóm tắt nhanh

Nếu chỉ cần nhớ một dòng:

| Dịch vụ | Nhớ nhanh | Khi chọn |
|---|---|---|
| **AWS DataSync** | **Copy/sync dữ liệu qua mạng** | Migrate/replicate dữ liệu giữa on-prem, AWS storage, hoặc cloud khác |
| **AWS Storage Gateway** | **Cho app on-prem dùng AWS storage như local storage** | Cần hybrid storage liên tục, local cache, NFS/SMB/iSCSI/tape |
| **AWS Transfer Family** | **Managed SFTP/FTPS/FTP/AS2 server** | Partner/user vẫn dùng giao thức file transfer truyền thống |
| **AWS Snow Family** | **Ship thiết bị vật lý** | Dữ liệu rất lớn, mạng chậm/không ổn định, offline transfer/edge |
| **AWS Data Transfer Terminal** | **Địa điểm vật lý 100 Gbps để upload** | Mang thiết bị lưu trữ tới cơ sở AWS để upload dataset lớn |
| **S3 Transfer Acceleration** | **Tăng tốc upload/download S3 qua edge** | Client ở xa region S3, cần tăng tốc object transfer vào một bucket S3 |
| **Direct Connect** | **Đường mạng riêng tới AWS** | Cần kết nối network ổn định/dự đoán được cho nhiều workload, không phải service copy data |

---

## Câu hỏi chọn dịch vụ

### 1. Bạn muốn **di chuyển/copy dữ liệu** hay **truy cập storage liên tục**?

- **Di chuyển/copy/sync dữ liệu theo task** → **DataSync**
- **Ứng dụng on-prem cần mount storage và dùng lâu dài** → **Storage Gateway**

### 2. Người dùng/partner đang dùng SFTP/FTP/AS2?

- Có → **AWS Transfer Family**
- Không → xem DataSync/Storage Gateway/Snow tùy nhu cầu

### 3. Dữ liệu quá lớn để chuyển qua mạng?

- Có, offline/thiếu bandwidth → **Snow Family** hoặc **Data Transfer Terminal**
- Không, có network ổn → **DataSync**

### 4. Vấn đề là network connection, không phải công cụ transfer?

- Cần đường truyền riêng, ổn định, latency/bandwidth dự đoán được → **Direct Connect**
- Cần tăng tốc object upload/download tới S3 từ xa → **S3 Transfer Acceleration**

---

## Bảng phân biệt chính

| Tiêu chí | DataSync | Storage Gateway | Transfer Family | Snow Family | Data Transfer Terminal |
|---|---|---|---|---|---|
| **Bản chất** | Data transfer service | Hybrid cloud storage appliance | Managed file transfer endpoint | Thiết bị vật lý/edge device | Cơ sở vật lý để upload data |
| **Mục tiêu** | Copy/sync data nhanh và tin cậy | On-prem app dùng AWS storage như local | Giữ workflow SFTP/FTP/AS2 | Offline transfer/edge compute | Upload dataset lớn qua 100 Gbps facility |
| **Kiểu hoạt động** | Task-based, schedule được | Liên tục/online, có cache local | Server endpoint managed | Offline shipping hoặc edge | Đặt lịch, mang storage device tới terminal |
| **Protocol chính** | NFS, SMB, HDFS, object; AWS storage APIs | NFS/SMB, iSCSI, VTL | SFTP, FTPS, FTP, AS2, web | NFS/S3 adapter/tùy thiết bị | Network upload tại facility |
| **Storage đích phổ biến** | S3, EFS, FSx | S3, FSx, EBS snapshot, Glacier qua Tape | S3, EFS | Thường import/export với S3 | AWS Cloud storage, thường cho data lớn |
| **Có cần agent/appliance?** | Có agent khi source/destination cần | Có gateway appliance | Không cần server tự quản | Có thiết bị vật lý | Không, dùng facility AWS |
| **Phù hợp migration một lần?** | Rất phù hợp | Không phải lựa chọn chính | Chỉ nếu migration workflow SFTP | Phù hợp khi offline | Phù hợp dataset lớn |
| **Phù hợp vận hành lâu dài?** | Replication/sync định kỳ | Rất phù hợp | Rất phù hợp cho MFT/B2B | Edge/offline đặc thù | Không phải storage runtime |
| **Điểm dễ nhầm** | Không làm app mount storage để dùng realtime | Không phải bulk migration tool chính | Không tối ưu cho sync file system lớn | Không phải online sync | Không thay thế DataSync cho sync tự động |

---

## DataSync vs Storage Gateway

Đây là cặp dễ nhầm nhất.

### Chọn DataSync khi

- Bạn có **dataset hiện hữu** cần chuyển từ on-prem lên AWS.
- Cần **sync định kỳ** từ NAS/file server/object storage sang S3/EFS/FSx.
- Cần migrate giữa AWS storage services hoặc từ cloud khác sang AWS.
- Bạn quan tâm tới transfer task: include/exclude filter, verification, bandwidth limit, schedule.

Ví dụ:

```text
On-prem NAS ──DataSync task──► Amazon S3
On-prem SMB ──DataSync task──► Amazon FSx for Windows File Server
Amazon EFS ──DataSync task──► Amazon S3 archive
Azure Blob ──DataSync task──► Amazon S3
```

### Chọn Storage Gateway khi

- Ứng dụng on-prem vẫn cần **NFS/SMB/iSCSI/tape interface**.
- Muốn data nằm trên AWS nhưng app local vẫn truy cập qua protocol quen thuộc.
- Cần **local cache** cho dữ liệu hay dùng.
- Cần thay thế/extend backup tape bằng **Tape Gateway**.

Ví dụ:

```text
On-prem app ──NFS/SMB──► S3 File Gateway ──► Amazon S3
On-prem server ──iSCSI──► Volume Gateway ──► Cloud-backed volumes/snapshots
Backup software ──VTL──► Tape Gateway ──► S3 Glacier storage classes
```

### Một câu phân biệt

> **DataSync chuyển dữ liệu. Storage Gateway trình bày AWS storage như storage local cho app on-prem.**

---

## Các dịch vụ tương tự dễ nhầm

### AWS Transfer Family

Dùng khi bài toán là **managed file transfer**, không phải file system sync.

Chọn khi:
- Partner/client chỉ hỗ trợ **SFTP, FTPS, FTP, AS2**.
- Bạn muốn bỏ server SFTP tự quản nhưng giữ nguyên client-side workflow.
- Đích là **Amazon S3** hoặc **Amazon EFS**.

Không chọn nếu:
- Cần migrate hàng triệu file từ NAS sang S3 với verification và schedule phức tạp → dùng **DataSync**.
- App on-prem cần mount NFS/SMB và cache local → dùng **Storage Gateway**.

### AWS Snow Family

Dùng khi transfer qua mạng không hợp lý.

Chọn khi:
- Dataset rất lớn, bandwidth thấp, thời gian upload qua mạng quá dài.
- Site không có kết nối ổn định.
- Cần edge compute/storage ở môi trường remote.

Lưu ý: với nhu cầu online transfer, AWS thường hướng tới **DataSync**; với physical transfer, cần kiểm tra tình trạng dịch vụ Snow/thiết bị hiện còn phù hợp theo region và điều kiện khách hàng.

### AWS Data Transfer Terminal

Dùng khi bạn có thiết bị lưu trữ chứa dataset lớn và có thể **mang tới địa điểm Data Transfer Terminal** để upload qua kết nối tốc độ cao. Tài liệu AWS mô tả mỗi facility có **hai kết nối fiber optic 100 Gbps** cho tốc độ và redundancy. Lưu ý: AWS docs ghi Data Transfer Terminal hiện chỉ khả dụng cho **AWS Enterprise customers**.

Khác Snow Family:
- **Snow Family**: AWS ship device tới bạn, bạn copy rồi ship lại.
- **Data Transfer Terminal**: bạn đặt lịch và mang storage device tới facility để upload.

### S3 Transfer Acceleration

Dùng cho **S3 object transfer** khi client ở xa bucket region. Nó không thay thế DataSync vì không quản lý migration task, verification toàn dataset, NFS/SMB/HDFS source, hoặc sync lịch trình.

### Direct Connect

Direct Connect là **network connectivity**, không phải data migration service. Nó có thể hỗ trợ DataSync/Storage Gateway chạy ổn định hơn, nhưng tự nó không copy data.

---

## Decision Tree

```text
Bạn cần làm gì?
│
├─ Copy/sync dữ liệu qua mạng?
│  └─ AWS DataSync
│
├─ App on-prem cần truy cập AWS storage như local?
│  └─ AWS Storage Gateway
│     ├─ File qua NFS/SMB → S3 File Gateway / FSx File Gateway
│     ├─ Block qua iSCSI → Volume Gateway
│     └─ Backup tape/VTL → Tape Gateway
│
├─ Partner/user cần SFTP, FTPS, FTP, AS2?
│  └─ AWS Transfer Family
│
├─ Data quá lớn hoặc mạng không phù hợp?
│  ├─ AWS ship device tới bạn → Snow Family
│  └─ Bạn mang device tới AWS facility → Data Transfer Terminal
│
├─ Chỉ cần tăng tốc upload/download S3 object?
│  └─ S3 Transfer Acceleration
│
└─ Cần đường mạng riêng ổn định tới AWS?
   └─ Direct Connect
```

---

## Kịch bản thường gặp

| Kịch bản | Dịch vụ nên chọn | Vì sao |
|---|---|---|
| Migrate 50 TB từ NAS on-prem lên S3 qua mạng | **DataSync** | Transfer task, schedule, verification, NFS/SMB source |
| App legacy on-prem ghi file qua SMB nhưng muốn lưu object trên S3 | **Storage Gateway - S3 File Gateway** | App vẫn dùng SMB/NFS, gateway map tới S3 |
| Công ty bảo hiểm nhận file từ partner qua SFTP vào S3 | **Transfer Family** | Managed SFTP endpoint, giữ workflow partner |
| Backup software hiện ghi tape, muốn archive cloud | **Storage Gateway - Tape Gateway** | Virtual Tape Library, tích hợp backup app |
| Factory remote có dữ liệu lớn, mạng yếu | **Snow Family** | Offline/edge scenario |
| Đội xe/thiết bị ghi dataset lớn và cần upload nhanh tại địa điểm AWS | **Data Transfer Terminal** | Upload qua 100 Gbps facility |
| User toàn cầu upload object lớn vào S3 bucket ở một region | **S3 Transfer Acceleration** | Tối ưu đường đi qua AWS edge |
| Cần kết nối private từ data center tới VPC/AWS public services | **Direct Connect** | Dedicated network link |
| Replicate EFS sang S3 định kỳ để archive | **DataSync** | AWS-to-AWS transfer/sync |
| On-prem server cần block storage iSCSI có snapshot lên AWS | **Storage Gateway - Volume Gateway** | Cloud-backed iSCSI volumes |

---

## Mẹo nhớ

```text
DataSync         = MOVE/SYNC data
Storage Gateway  = MOUNT/USE cloud storage from on-prem
Transfer Family  = MANAGED SFTP/FTP/AS2
Snow Family      = SHIP device
DTT              = BRING device to AWS terminal
S3 Acceleration  = SPEED UP S3 object transfer
Direct Connect   = PRIVATE NETWORK pipe
```

Cách đọc đề thi/câu hỏi:

- Có từ khóa **NFS/SMB/HDFS/object storage migration, sync, schedule, verify** → nghĩ **DataSync**.
- Có từ khóa **hybrid storage, local cache, on-prem app, NFS/SMB/iSCSI, tape backup** → nghĩ **Storage Gateway**.
- Có từ khóa **SFTP/FTPS/FTP/AS2, partner, B2B, managed file transfer** → nghĩ **Transfer Family**.
- Có từ khóa **petabyte, offline, ship device, limited bandwidth, edge location** → nghĩ **Snow Family** hoặc **Data Transfer Terminal**.
- Có từ khóa **dedicated connection, private VIF/public VIF, predictable bandwidth** → nghĩ **Direct Connect**.

---

## Nguồn AWS chính thức

- [AWS DataSync - What is AWS DataSync?](https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html)
- [AWS Storage Gateway - What is Volume Gateway?](https://docs.aws.amazon.com/storagegateway/latest/vgw/WhatIsStorageGateway.html)
- [Amazon S3 File Gateway](https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html)
- [AWS Transfer Family - What is AWS Transfer Family?](https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html)
- [Choosing an AWS storage service - Migration options](https://docs.aws.amazon.com/decision-guides/latest/storage-on-aws-how-to-choose/choosing-aws-storage-service.html)
- [AWS Data Transfer Terminal](https://docs.aws.amazon.com/datatransferterminal/latest/userguide/what-is-dtt.html)
- [AWS Direct Connect - What is Direct Connect?](https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html)
- [Amazon S3 Transfer Acceleration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html)
