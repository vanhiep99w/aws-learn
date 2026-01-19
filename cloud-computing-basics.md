# Cloud Computing Basics

## Traditional Server là gì?

Máy chủ vật lý do công ty sở hữu hoặc thuê, đặt tại data center riêng hoặc colocation.

### Hoạt động như thế nào?
1. **Mua/thuê phần cứng**: Server, storage, thiết bị mạng
2. **Cài đặt**: OS, middleware, ứng dụng
3. **Vận hành**: Tự bảo trì, nâng cấp, thay thế khi hỏng
4. **Mở rộng**: Mua thêm phần cứng (mất vài tuần đến vài tháng)

### Hạn chế chính
- **Phải estimate capacity trước**: Dự đoán nhu cầu sử dụng trong 3-5 năm tới
  - Mua dư → lãng phí tiền
  - Mua thiếu → không đáp ứng được nhu cầu, mất khách hàng
- **Chi phí CapEx cao**: Đầu tư vốn lớn ban đầu
- **Rủi ro**: Hỏng phần cứng, thiên tai, mất điện

---

## Cloud Computing là gì?

Thuê tài nguyên IT (compute, storage, database, networking...) qua internet từ nhà cung cấp như AWS, Azure, GCP.

### Hoạt động như thế nào?
1. **Đăng ký tài khoản** với nhà cung cấp cloud
2. **Provision tài nguyên** qua web console hoặc API (trong vài phút)
3. **Sử dụng** tài nguyên như máy chủ của mình
4. **Trả tiền theo pay-as-you-go**: Dùng bao nhiêu trả bấy nhiêu (tính theo giờ/giây)
5. **Scale** lên/xuống linh hoạt theo nhu cầu thực tế

### Ưu điểm chính
- **Không cần estimate trước**: Điều chỉnh capacity realtime
- **Chi phí OpEx**: Chi phí vận hành, không cần vốn lớn ban đầu
- **Tốc độ triển khai nhanh**: Vài phút thay vì vài tháng
- **Global reach**: Triển khai ở nhiều region trên thế giới

---

## So sánh Traditional Server vs Cloud Computing

| Tiêu chí | Traditional Server | Cloud Computing |
|----------|-------------------|-----------------|
| **Chi phí ban đầu** | Cao (CapEx) | Thấp (OpEx, pay-as-you-go) |
| **Capacity planning** | Estimate trước 3-5 năm | Điều chỉnh realtime |
| **Thời gian triển khai** | Vài tuần - vài tháng | Vài phút |
| **Mở rộng (Scale)** | Chậm, mua thêm phần cứng | Nhanh, tự động |
| **Bảo trì** | Tự quản lý | Nhà cung cấp quản lý |
| **Tính khả dụng** | Phụ thuộc hạ tầng tự xây | SLA cao (99.9%+) |
| **Vị trí** | Data center riêng | Global regions |
| **Rủi ro phần cứng** | Tự chịu | Phân tán, dự phòng tự động |

---

## Các mô hình dịch vụ Cloud (IaaS / PaaS / SaaS)

Cloud không chỉ là "thuê máy ảo". Có 3 mô hình dịch vụ với mức độ quản lý khác nhau:

| Mô hình | Bạn quản lý | Nhà cung cấp quản lý | Ví dụ AWS |
|---------|-------------|---------------------|-----------|
| **IaaS** (Infrastructure) | OS, runtime, app, data | Hardware, networking, virtualization | EC2, EBS, VPC |
| **PaaS** (Platform) | App, data | Tất cả phía dưới (OS, runtime, scaling) | Elastic Beanstalk, RDS, Lambda |
| **SaaS** (Software) | Chỉ dùng | Toàn bộ | WorkMail, Chime |

**Càng lên cao (SaaS) → càng ít phải quản lý → nhưng ít linh hoạt hơn.**

---

## Shared Responsibility Model

Khi dùng cloud, **trách nhiệm được chia sẻ** giữa bạn và nhà cung cấp:

| AWS chịu trách nhiệm | Bạn chịu trách nhiệm |
|---------------------|---------------------|
| Bảo mật **của** cloud | Bảo mật **trong** cloud |
| Hardware, data center, network vật lý | IAM (users, roles, policies) |
| Virtualization layer | Cấu hình security groups, firewall |
| Patch hạ tầng | Patch OS (nếu dùng EC2) |
| | Encryption data |
| | Application security |

⚠️ **Lưu ý quan trọng**: Cloud không có nghĩa là AWS lo hết. Nếu bạn cấu hình sai IAM, mở port rộng, hoặc không mã hóa data → **bạn chịu trách nhiệm**.

---

## Region và Availability Zone (AZ)

### Region
- Là **khu vực địa lý** (vd: Singapore, Tokyo, Frankfurt)
- Mỗi region hoạt động **độc lập**
- Chọn region gần user để giảm latency

### Availability Zone (AZ)
- Là **1 hoặc nhiều data center** trong 1 region
- Các AZ trong cùng region **kết nối tốc độ cao, độ trễ thấp**
- Các AZ **cách ly vật lý** (điện, mạng riêng) → 1 AZ gặp sự cố không ảnh hưởng AZ khác

### Multi-AZ = High Availability
Để đạt **SLA cao** và **tính khả dụng tốt**, cần triển khai **Multi-AZ**:

```
        Region: ap-southeast-1 (Singapore)
        ┌─────────────┬─────────────┬─────────────┐
        │    AZ-1a    │    AZ-1b    │    AZ-1c    │
        │   ┌─────┐   │   ┌─────┐   │   ┌─────┐   │
        │   │ EC2 │   │   │ EC2 │   │   │ EC2 │   │
        │   └─────┘   │   └─────┘   │   └─────┘   │
        └─────────────┴─────────────┴─────────────┘
                           │
                    Load Balancer (ALB)
```

**Ví dụ**: RDS Multi-AZ tự động replicate sang AZ khác → nếu primary fail, tự động failover.

---

## Khi nào nên dùng?

### Chọn Traditional Server khi:
- Có yêu cầu compliance/regulation đặc biệt (data không được ra khỏi công ty)
- Workload ổn định, dự đoán được trong dài hạn
- Đã có sẵn hạ tầng và đội ngũ vận hành

### Chọn Cloud Computing khi:
- Startup, cần triển khai nhanh
- Workload biến động (seasonal, unpredictable)
- Muốn tập trung vào sản phẩm, không muốn quản lý hạ tầng
- Cần triển khai global

---

## Khái niệm bổ sung: SLA

**SLA (Service Level Agreement)** là cam kết mức độ dịch vụ từ nhà cung cấp cloud đối với khách hàng.

**Ví dụ**: AWS EC2 đảm bảo uptime **99.99%** → chỉ cho phép downtime khoảng **52 phút/năm**.

**Nếu vi phạm SLA**: Khách hàng được bồi thường bằng service credit (giảm tiền hóa đơn).

| Uptime SLA | Downtime cho phép/năm |
|------------|----------------------|
| 99.9%      | ~8.76 giờ            |
| 99.99%     | ~52 phút             |
| 99.999%    | ~5 phút              |

---

## Tài liệu tham khảo
- [AWS - What is Cloud Computing?](https://aws.amazon.com/what-is-cloud-computing/)
- [AWS - Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [AWS Service Level Agreements](https://aws.amazon.com/legal/service-level-agreements/)
