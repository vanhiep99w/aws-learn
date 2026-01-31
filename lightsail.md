# Amazon Lightsail


## Mục lục

- [1. Key Features](#1-key-features)
- [2. Pricing Model (Mô hình giá)](#2-pricing-model-mô-hình-giá)
- [3. Lightsail vs. EC2](#3-lightsail-vs-ec2)
- [4. Use Cases (Trường hợp sử dụng)](#4-use-cases-trường-hợp-sử-dụng)
- [5. Hands-on: Tạo WordPress Site](#5-hands-on-tạo-wordpress-site)

---

**Amazon Lightsail** là server ảo (Virtual Private Server - VPS) dễ sử dụng nhất của AWS, được thiết kế cho người mới bắt đầu, các ứng dụng web đơn giản, hoặc các dự án nhỏ cần chi phí dự đoán được.

Nó cung cấp mọi thứ cần thiết để khởi chạy một ứng dụng hoặc website: compute (máy chủ), storage (lưu trữ), networking (mạng), và security (bảo mật) trong một gói dịch vụ với mức giá cố định hàng tháng thấp.

## 1. Key Features

### 1.1. Virtual Servers (Instances)
*   **Blueprints:** Khởi tạo server nhanh chóng với hệ điều hành (OS only) hoặc ứng dụng được cài sẵn (App + OS).
    *   **OS Only:** Amazon Linux 2, Ubuntu, Windows Server, CentOS, Debian.
    *   **Apps:** WordPress, LAMP stack, Node.js, Django, Magento, MEAN stack, GitLab, cPanel & WHM.
*   **Access:** Truy cập terminal trực tiếp qua trình duyệt (SSH/RDP) hoặc SSH key.

### 1.2. Container Service
*   Chạy các container Docker (containerized applications) một cách đơn giản mà không cần quản lý server hay cluster phức tạp như ECS/EKS.
*   Lightsail tự động quản lý hạ tầng, load balancing và SSL.

### 1.3. Managed Databases
*   Cung cấp MySQL và PostgreSQL được quản lý hoàn toàn (Fully managed).
*   Tự động backup (7 ngày), bảo trì, và bảo mật.
*   Có tùy chọn High Availability (HA) để dự phòng.

### 1.4. Networking
*   **Static IP:** Mỗi instance có thể gắn một địa chỉ IP tĩnh miễn phí (miễn là instance đang chạy).
*   **Load Balancers:** Phân phối traffic tới nhiều instances, hỗ trợ Health check và tự động renew SSL certificate miễn phí.
*   **CDN (Content Delivery Network):** Tích hợp CloudFront để phân phối nội dung toàn cầu.
*   **DNS Management:** Quản lý DNS record cho domain của bạn ngay trong Lightsail console.

### 1.5. Storage
*   **Block Storage:** Ổ đĩa SSD (GP2) gắn thêm vào instance để mở rộng lưu trữ.
*   **Object Storage (Buckets):** Lưu trữ file tĩnh (tương tự S3) để dùng cho website hoặc backup.

## 2. Pricing Model (Mô hình giá)

Lightsail sử dụng mô hình giá **Bundled Pricing** (Giá trọn gói), giúp dễ dàng dự đoán chi phí. Một gói cơ bản bao gồm:
1.  **Server:** vCPU và RAM (Memory)
2.  **Storage:** SSD Disk
3.  **Data Transfer:** Lượng băng thông (Data Transfer Out) hàng tháng.

**Ví dụ (Linux Instance - Giá tham khảo 2024):**
*   **$3.50/tháng:** 512 MB Memory, 1 vCPU, 20 GB SSD, 1 TB Transfer.
*   **$5/tháng:** 1 GB Memory, 1 vCPU, 40 GB SSD, 2 TB Transfer.
*   **$10/tháng:** 2 GB Memory, 1 vCPU, 60 GB SSD, 3 TB Transfer.

> **Lưu ý:**
> *   Từ 2024, AWS bắt đầu tính tiền IPv4 Public IP. Lightsail có điều chỉnh giá hoặc cung cấp các gói IPv6-only để tiết kiệm chi phí.
> *   Dữ liệu vượt quá hạn mức gói sẽ bị tính phí overage (tương tự EC2 data transfer).

## 3. Lightsail vs. EC2

| Đặc điểm | Amazon Lightsail | Amazon EC2 |
| :--- | :--- | :--- |
| **Độ phức tạp** | Rất đơn giản, "One-click" experience. | Phức tạp, nhiều tùy chọn cấu hình. |
| **Mục tiêu** | Web đơn giản, Blog, Dev/Test, Small Business. | Enterprise apps, Big Data, ML, Microservices. |
| **Giá cả** | Trọn gói (Compute + Disk + Net), dễ dự đoán. | Pay-as-you-go, tính riêng lẻ từng thành phần. |
| **Networking** | Cơ bản, ít tùy chỉnh VPC. | VPC đầy đủ tính năng (Subnet, ACL, Peering, VPN). |
| **Scalability** | Giới hạn, scale thủ công (snapshot -> larger plan). | Auto Scaling Group (ASG), linh hoạt vô hạn. |

**Khi nào nên chuyển từ Lightsail sang EC2?**
*   Khi ứng dụng cần khả năng Auto Scaling.
*   Khi cần các loại instance đặc biệt (GPU, High Performance Computing).
*   Khi cần cấu hình mạng phức tạp (VPC peering, Transit Gateway).
*   Khi cần quyền kiểm soát chi tiết về IOPS của ổ cứng hoặc placement groups.
*   Lightsail hỗ trợ tính năng **VPC Peering** để kết nối với các dịch vụ AWS khác (như RDS, S3 trong tài khoản AWS chính).

## 4. Use Cases (Trường hợp sử dụng)

1.  **Vps Giá Rẻ:** Chạy server Linux/Windows cá nhân.
2.  **Simple Web Applications:** Website công ty, Portfolio, Landing page.
3.  **CMS/Blogs:** WordPress (đây là use case phổ biến nhất), Ghost, Drupal.
4.  **Dev/Test Environments:** Tạo nhanh môi trường để test code và xóa đi khi xong.
5.  **Learning:** Nơi tuyệt vời cho sinh viên/người mới học Linux và server quản trị.

## 5. Hands-on: Tạo WordPress Site

1.  Vào **Lightsail Console**.
2.  Click **Create instance**.
3.  Chọn **Instance location** (Region/AZ).
4.  Chọn **Pick your instance image**:
    *   Platform: Linux/Unix
    *   Blueprint: **WordPress**
5.  Chọn **Instance plan** (ví dụ gói $3.50 hoặc $5).
6.  Đặt tên cho instance và click **Create instance**.
7.  Sau vài phút, instance sẽ ở trạng thái *Running*.
8.  Kết nối SSH qua trình duyệt (nút icon terminal màu cam) để lấy mật khẩu admin (`cat bitnami_application_password`).
9.  Truy cập Public IP để vào website WordPress.
