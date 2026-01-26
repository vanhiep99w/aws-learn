# So sánh chuyên sâu các loại lưu trữ trên AWS

Tài liệu này cung cấp cái nhìn toàn diện về hệ sinh thái lưu trữ của AWS, vượt ra ngoài ba loại cơ bản (Block, File, Object) để bao gồm các giải pháp lai (Hybrid), biên (Edge), truyền tải dữ liệu và sao lưu.

## 1. Phân loại tổng quan

AWS cung cấp hơn 15 loại dịch vụ lưu trữ khác nhau, được chia thành các nhóm chính:

| Nhóm | Dịch vụ đại diện | Mô tả ngắn |
| :--- | :--- | :--- |
| **Block Storage** | EBS, Instance Store | Lưu trữ hiệu năng cao cho database, boot volume |
| **File Storage** | EFS, FSx Family | Hệ thống tệp chia sẻ (NFS, SMB, Lustre, ZFS) |
| **Object Storage** | S3, Glacier | Lưu trữ dữ liệu phi cấu trúc, backup, archive |
| **Hybrid & Edge** | Storage Gateway, Snow Family | Cầu nối on-premise hoặc thiết bị vật lý tại biên |
| **Data Transfer** | DataSync, Transfer Family | Dịch vụ chuyển dữ liệu tự động hoặc qua giao thức cũ |
| **Backup & DR** | AWS Backup, Elastic DR | Quản lý sao lưu tập trung và phục hồi thảm họa |

---

## 2. Block Storage (Lưu trữ khối)

Dữ liệu được chia thành các khối (blocks) có địa chỉ riêng biệt. Hệ điều hành nhìn nhận như một ổ cứng vật lý.

### Amazon EBS (Elastic Block Store)
*   **Loại:** Network-attached storage (NAS) giả lập block.
*   **Đặc điểm:** Dữ liệu bền vững (persistent), tồn tại độc lập với EC2 instance.
*   **Các dòng:**
    *   **General Purpose (gp2, gp3):** Cân bằng giá/hiệu năng. Dùng cho boot volume, database nhỏ/vừa.
    *   **Provisioned IOPS (io1, io2 Block Express):** Hiệu năng cực cao (lên tới 256,000 IOPS). Dùng cho mission-critical DB.
    *   **HDD (st1, sc1):** Tối ưu throughput hoặc lưu trữ lạnh giá rẻ (Big Data, Log).
*   **Giới hạn:** Chỉ gắn được vào 1 EC2 tại một thời điểm (trừ dòng io1/io2 có tính năng Multi-Attach), chỉ trong 1 Availability Zone (AZ).

### EC2 Instance Store (Lưu trữ cục bộ)
*   **Loại:** Ổ cứng vật lý gắn trực tiếp trên máy chủ host (Direct-attached).
*   **Đặc điểm:** Tốc độ cực nhanh (triệu IOPS), độ trễ cực thấp.
*   **Nhược điểm chí mạng:** Dữ liệu là **tạm thời (ephemeral)**. Nếu tắt (stop) hoặc terminate EC2, dữ liệu mất vĩnh viễn.
*   **Use case:** Cache, buffer, dữ liệu tạm, database có cơ chế replication riêng (như Cassandra, MongoDB).

---

## 3. File Storage (Lưu trữ tệp)

Hệ thống lưu trữ chia sẻ qua mạng, hỗ trợ giao thức chuẩn (NFS, SMB) để nhiều máy cùng truy cập.

### Amazon EFS (Elastic File System)
*   **Giao thức:** NFSv4 (Linux).
*   **Đặc điểm:** Serverless, tự động scale dung lượng, truy cập được từ nhiều AZ.
*   **Use case:** Web server farm, thư mục home directory, ứng dụng container (EKS/ECS).

### Amazon FSx Family (Dành cho workload đặc thù)
AWS cung cấp 4 loại FSx tối ưu cho các hệ thống khác nhau:
1.  **FSx for Windows File Server:** Chạy protocol SMB, tích hợp Active Directory. Dùng cho ứng dụng Windows, SharePoint, SQL Server.
2.  **FSx for Lustre:** Hiệu năng cực cao (sub-millisecond), throughput lớn. Dùng cho Machine Learning, High Performance Computing (HPC).
3.  **FSx for NetApp ONTAP:** Dành cho doanh nghiệp đang dùng NetApp on-premise muốn chuyển lên mây (lift-and-shift).
4.  **FSx for OpenZFS:** Dành cho workload dùng ZFS, hiệu năng cao hơn EFS (lên tới 1 triệu IOPS).

---

## 4. Object Storage (Lưu trữ đối tượng)

Lưu trữ dữ liệu dạng phẳng (flat structure) với metadata đi kèm, truy cập qua API HTTP/REST.

### Amazon S3 (Simple Storage Service)
*   **Độ bền:** 99.999999999% (11 số 9).
*   **Các lớp lưu trữ (Storage Classes):**
    *   **Standard:** Truy cập thường xuyên.
    *   **Intelligent-Tiering:** Tự động di chuyển dữ liệu để tối ưu chi phí.
    *   **Standard-IA / One Zone-IA:** Truy cập không thường xuyên (rẻ hơn, nhưng phí lấy dữ liệu cao hơn).
    *   **S3 Express One Zone:** Mới ra mắt, độ trễ cực thấp (single-digit millisecond), dùng thay thế EFS/EBS cho 1 số workload AI/Analytics.

### Amazon S3 Glacier (Lưu trữ lạnh)
Dùng cho mục đích archive (lưu trữ lâu dài, ít khi đọc lại).
*   **Glacier Instant Retrieval:** Lấy ngay lập tức nhưng phí lưu rẻ hơn S3 Standard-IA.
*   **Glacier Flexible Retrieval:** Lấy dữ liệu mất vài phút đến vài giờ.
*   **Glacier Deep Archive:** Rẻ nhất AWS (~$1/TB/tháng), lấy dữ liệu mất 12-48h.

---

## 5. Hybrid & Edge Storage (Lai & Biên)

Giải pháp khi không thể đưa toàn bộ dữ liệu lên cloud ngay lập tức hoặc cần xử lý tại nơi không có internet tốt.

### AWS Storage Gateway
Cầu nối phần mềm cài tại on-premise để đẩy dữ liệu lên AWS:
*   **File Gateway:** Server ở cty nhìn thấy ổ đĩa mạng (NFS/SMB), nhưng dữ liệu thực tế đẩy vào S3.
*   **Volume Gateway:** Server nhìn thấy ổ cứng iSCSI, dữ liệu backup dạng EBS Snapshots.
*   **Tape Gateway:** Giả lập thư viện băng từ (VTL) để thay thế hệ thống backup băng từ vật lý.

### AWS Snow Family
Thiết bị vật lý AWS gửi về tận nơi để copy dữ liệu:
*   **Snowcone:** Nhỏ gọn (như hộp khăn giấy), 8-14TB. Dùng cho IoT, edge computing nhẹ.
*   **Snowball Edge:** Kích thước như case PC, 80TB. Có thể chạy EC2/Lambda trực tiếp trên thiết bị để xử lý dữ liệu tại chỗ.
*   **Snowmobile:** Xe container 45-foot, chở 100PB dữ liệu (chỉ dành cho Exabyte-scale migration).

---

## 6. Data Transfer & Migration (Truyền tải)

*   **AWS DataSync:** Agent phần mềm giúp copy dữ liệu tự động, tốc độ cao giữa on-premise và AWS (S3, EFS, FSx). Nhanh hơn copy thủ công 10 lần.
*   **AWS Transfer Family:** Server FTP/SFTP được quản lý (managed service). Giúp các cty vẫn dùng giao thức cũ (FTP) upload file thẳng vào S3/EFS mà không cần duy trì server FTP.

---

## Bảng so sánh nhanh các tiêu chí quan trọng

| Tiêu chí | Block (EBS) | File (EFS) | Object (S3) | Local (Instance Store) | Archive (Glacier) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Độ trễ (Latency)** | Thấp (<10ms) | Trung bình | Cao hơn (>20ms) | Cực thấp (<1ms) | Rất cao (phút/giờ) |
| **Throughput** | Cao | Rất cao (Parallel) | Rất cao (Distributed) | Cực cao | Thấp |
| **Truy cập đồng thời** | 1 EC2 (thường) | Hàng nghìn EC2 | Không giới hạn | 1 EC2 | Không giới hạn |
| **Chi phí ($/GB)** | Cao (~$0.08) | Cao (~$0.30) | Thấp (~$0.023) | Free (kèm EC2) | Rất thấp (~$0.00099) |
| **Bền vững (Durability)**| 99.999% | 99.999999999% | 99.999999999% | Kém (mất khi stop) | 99.999999999% |

## Lời khuyên chọn lựa (Decision Guide)

1.  **Cài Database (MySQL, Postgres):** Chọn **EBS** (Block).
2.  **Làm Web Server (WordPress, Magento) cần share file code/media:** Chọn **EFS** (File).
3.  **Lưu user upload (avatar, video), backup logs:** Chọn **S3** (Object).
4.  **Cần cache siêu nhanh, dữ liệu mất cũng không sao:** Chọn **Instance Store**.
5.  **Dùng Windows Server, SQL Server:** Chọn **FSx for Windows**.
6.  **Train AI/ML cần tốc độ đọc file cực nhanh:** Chọn **FSx for Lustre**.
7.  **Lưu hồ sơ bệnh án 10 năm theo luật:** Chọn **S3 Glacier Deep Archive**.
