# Amazon EC2 (Elastic Compute Cloud)

## Tổng quan

**Amazon EC2** là dịch vụ cung cấp **compute capacity có thể mở rộng** (scalable) trong AWS Cloud. EC2 cho phép bạn khởi tạo các **virtual servers** (gọi là **instances**) theo nhu cầu, không cần đầu tư phần cứng vật lý trước.

### Lợi ích chính
- **Scale up/down linh hoạt**: Thêm/giảm capacity theo workload thực tế
- **Pay-as-you-go**: Chỉ trả tiền cho những gì sử dụng (tính theo giây, tối thiểu 60 giây)
- **Triển khai nhanh**: Khởi tạo instance trong vài phút
- **Đa dạng cấu hình**: Nhiều instance types với các tổ hợp CPU, memory, storage, network khác nhau

> **Nguồn**: [What is Amazon EC2?](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html)

---

## Các thành phần chính

### 1. EC2 Instance
- Virtual server chạy trong AWS Cloud
- Mỗi instance có cấu hình phần cứng được xác định bởi **instance type**

### 2. Amazon Machine Image (AMI)
- **Template** chứa OS và phần mềm cần thiết để khởi tạo instance
- Có thể sử dụng AMI có sẵn của AWS, AWS Marketplace, hoặc tự tạo custom AMI

### 3. Instance Types
Các loại instance được phân loại theo mục đích sử dụng:

| Category | Mô tả | Use Cases |
|----------|-------|-----------|
| **General Purpose** (M, T series) | Cân bằng compute, memory, network | Web servers, small databases |
| **Compute Optimized** (C series) | CPU mạnh | Batch processing, gaming servers |
| **Memory Optimized** (R, X series) | RAM lớn | In-memory databases, real-time analytics |
| **Storage Optimized** (I, D series) | High IOPS | Data warehousing, distributed file systems |
| **Accelerated Computing** (P, G series) | GPU/hardware accelerators | Machine learning, graphics rendering |

> **Nguồn**: [Amazon EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/)

### 4. Storage Options

| Loại | Đặc điểm | Persistence |
|------|----------|-------------|
| **Amazon EBS** | Block storage, có thể attach/detach | Persistent (tồn tại sau khi terminate nếu cấu hình) |
| **Instance Store** | Storage vật lý gắn với host | Ephemeral (mất khi stop/terminate) |

### 5. Key Pairs
- Cặp **public/private key** để đăng nhập instance an toàn
- AWS giữ public key, bạn giữ private key

### 6. Security Groups
- **Virtual firewall** kiểm soát traffic vào/ra instance
- Quy định protocol, port, source/destination IP được phép

---

## Pricing Models

Amazon EC2 cung cấp nhiều mô hình pricing để tối ưu chi phí:

| Mô hình | Đặc điểm | Discount | Phù hợp với |
|---------|----------|----------|-------------|
| **On-Demand** | Trả theo giây sử dụng, không cam kết | Không | Workload ngắn hạn, không dự đoán được |
| **Savings Plans** | Cam kết sử dụng 1 hoặc 3 năm (USD/giờ) | Lên đến 72% | Workload ổn định, flexible instance types |
| **Reserved Instances** | Cam kết instance type + Region, 1 hoặc 3 năm | Lên đến 75% | Workload ổn định, biết trước cấu hình |
| **Spot Instances** | Sử dụng capacity thừa của AWS | Lên đến 90% | Fault-tolerant, flexible workloads |
| **Dedicated Hosts** | Physical server riêng | Varies | Compliance, BYOL (Bring Your Own License) |

### Free Tier
- **750 giờ/tháng** cho t2.micro hoặc t3.micro (12 tháng đầu tiên)
- Chi tiết: [AWS Free Tier](https://aws.amazon.com/free/)

### Per-Second Billing (Tính phí theo giây)

> [!IMPORTANT]
> **Từ tháng 10/2017**, EC2 và EBS chuyển từ per-hour sang **per-second billing**.

| Service | Billing | Minimum |
|---------|---------|---------|
| **Linux EC2** (On-Demand, Reserved, Spot) | Per-second ⏱️ | 1 phút (60 giây) |
| **Windows EC2** | Per-hour ⏰ | 1 giờ |
| **EBS Volumes** (provisioned storage) | Per-second | 1 phút |
| **EBS Provisioned IOPS** (io1/io2) | Per-second | - |
| **EBS Snapshots** | Per-hour | - |

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PER-SECOND BILLING EXAMPLE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Linux instance chạy 5 phút 30 giây:                                │
│  → Bạn trả cho: 5 phút 30 giây = 330 giây                           │
│                                                                      │
│  Linux instance chạy 45 giây:                                       │
│  → Bạn trả cho: 1 phút (minimum)                                    │
│                                                                      │
│  Windows instance chạy 5 phút 30 giây:                              │
│  → Bạn trả cho: 1 giờ (per-hour billing)                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Lợi ích per-second billing:**
- ✅ CI/CD pipelines - build xong terminate ngay
- ✅ Dev/Test environments - spin up/down nhanh
- ✅ Batch processing - jobs chạy vài phút
- ✅ Auto Scaling - scale nhanh không lo phí thừa

> **Nguồn**: [Per-Second Billing for EC2 and EBS](https://aws.amazon.com/blogs/aws/new-per-second-billing-for-ec2-instances-and-ebs-volumes/)

> **Nguồn**: [Amazon EC2 Pricing](https://aws.amazon.com/ec2/pricing/)

---

## Cách truy cập EC2

1. **AWS Management Console** - Giao diện web
2. **AWS CLI** - Command line interface
3. **AWS SDKs** - Tích hợp vào code (Python/Boto3, JavaScript, Java, etc.)
4. **CloudFormation** - Infrastructure as Code
5. **AWS Tools for PowerShell**

---

## Các dịch vụ liên quan

### 1. EC2 Auto Scaling

Tự động điều chỉnh số lượng EC2 instances dựa trên demand.

**Lưu ý quan trọng:** Auto Scaling **chỉ thêm/bớt instances** - không tự routing traffic. Cần kết hợp với **ELB** để phân phối requests:

```
                         ┌─────────────────┐
     Users ──────────▶   │  Load Balancer  │
                         └────────┬────────┘
                                  │ distributes traffic
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
         ┌─────────┐         ┌─────────┐         ┌─────────┐
         │ EC2 #1  │         │ EC2 #2  │         │ EC2 #3  │
         └─────────┘         └─────────┘         └─────────┘
                    └─────────────┬─────────────┘
                                  │
                         Auto Scaling Group
                      (manages instance count)
```

| Component | Nhiệm vụ |
|-----------|----------|
| **Auto Scaling** | Thêm/bớt instances dựa trên metrics |
| **ELB** | Routing requests đến các instances healthy |

**Cách hoạt động:**
- Định nghĩa **Auto Scaling Group (ASG)** với min/max/desired capacity
- Sử dụng **scaling policies** để trigger scale out/in dựa trên CloudWatch metrics (CPU, memory, network I/O)
- Tự động thay thế instances bị unhealthy

**Tính năng chính:**
| Feature | Mô tả |
|---------|-------|
| **Dynamic Scaling** | Scale dựa trên metrics real-time |
| **Predictive Scaling** | Dự đoán traffic và scale trước |
| **Scheduled Scaling** | Scale theo lịch định sẵn |
| **Health Checks** | EC2 health checks hoặc ELB health checks |

**Mixed Instances Policy:**
- Kết hợp **On-Demand + Spot Instances** trong cùng ASG
- Đặt base capacity với On-Demand, scale thêm với Spot để tiết kiệm chi phí

**Instance Identification:**
- Instances **không có tên cố định** - được identify bằng Instance ID (`i-0abc123def`)
- Có thể config **Name tag** trong Launch Template (tất cả instances cùng tag, phân biệt bằng ID)
- IP thay đổi mỗi lần launch → **dùng ELB DNS** làm entry point, không dựa vào IP

**Chi phí (Pricing):**

| Thành phần | Chi phí |
|------------|---------|
| Auto Scaling service | **Miễn phí** |
| EC2 instances | Trả theo instances đang chạy |
| ELB | Theo giờ + data processed |
| CloudWatch | Metrics cơ bản miễn phí |

*Chiến lược tiết kiệm:* Base capacity với On-Demand/Reserved, scale thêm với **Spot** (giảm đến 90%).

> **Nguồn**: [Amazon EC2 Auto Scaling Pricing](https://aws.amazon.com/ec2/autoscaling/pricing/)

---

### 2. Elastic Load Balancing (ELB)

Phân phối traffic đến nhiều EC2 instances, containers, hoặc IP addresses.

**Các loại Load Balancer:**

| Loại | Layer | Use Cases |
|------|-------|-----------|
| **Application Load Balancer (ALB)** | Layer 7 (HTTP/HTTPS) | Web applications, microservices, path-based routing |
| **Network Load Balancer (NLB)** | Layer 4 (TCP/UDP) | Ultra-low latency, millions of requests/second |
| **Gateway Load Balancer (GWLB)** | Layer 3 | Deploy và scale virtual appliances (firewalls, IDS/IPS) |
| **Classic Load Balancer** | Layer 4/7 | Legacy, không khuyến khích cho ứng dụng mới |

**Tích hợp với Auto Scaling:**
- Instances trong ASG tự động được **register/deregister** với load balancer
- ELB health checks có thể trigger ASG thay thế unhealthy instances
- Traffic được phân phối đều bằng **least outstanding requests** algorithm

> **Nguồn**: [Use ELB with Auto Scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/autoscaling-load-balancer.html)

---

### 3. Amazon CloudWatch

Dịch vụ monitoring và observability cho AWS resources.

**Metrics cho EC2:**
- **CPU Utilization**, Network In/Out, Disk Read/Write
- **Status Checks**: Instance status và system status
- Custom metrics (memory, disk space) qua CloudWatch Agent

**Metrics cho Auto Scaling:**
- `GroupDesiredCapacity`, `GroupInServiceInstances`
- `GroupPendingInstances`, `GroupTerminatingInstances`
- Predictive scaling metrics

**Tính năng:**
| Feature | Mô tả |
|---------|-------|
| **CloudWatch Alarms** | Trigger actions khi metric vượt ngưỡng |
| **CloudWatch Logs** | Collect và store log files |
| **CloudWatch Dashboards** | Visualize metrics |
| **CloudWatch Events/EventBridge** | React to state changes |

> **Nguồn**: [CloudWatch metrics for EC2 Auto Scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-metrics.html)

---

### 4. AWS Systems Manager

Quản lý EC2 instances và on-premises servers at scale.

**Tính năng chính:**

| Feature | Mô tả |
|---------|-------|
| **Session Manager** | SSH/RDP không cần mở ports, không cần bastion host |
| **Run Command** | Chạy scripts trên nhiều instances cùng lúc |
| **Patch Manager** | Tự động patch OS và applications |
| **Parameter Store** | Lưu trữ configuration data, secrets |
| **State Manager** | Maintain consistent configuration |
| **Inventory** | Collect metadata từ instances |

**Yêu cầu:**
- **SSM Agent** phải được cài đặt trên instance (có sẵn trên Amazon Linux, Ubuntu, Windows AMIs)
- Instance cần **IAM role** với policy `AmazonSSMManagedInstanceCore`

---

### 5. EC2 Image Builder

Tự động tạo, test, và distribute custom AMIs hoặc container images.

**Pipeline workflow:**
1. **Base Image** → Chọn source AMI (Amazon Linux, Windows, Ubuntu, etc.)
2. **Components** → Thêm software, configurations, security hardening
3. **Test** → Chạy automated tests để validate image
4. **Distribute** → Copy AMI đến các regions, share với accounts khác

**Lợi ích:**
- **Automated patching**: Tự động rebuild images khi có security updates
- **Compliance**: Áp dụng CIS Benchmarks, STIG hardening
- **Version control**: Track changes qua semantic versioning
- **Integration**: Tích hợp với Systems Manager Parameter Store

**Pricing:** Chỉ trả tiền cho underlying resources (EC2, EBS, S3) - không có phí riêng cho Image Builder.

> **Nguồn**: [EC2 Image Builder Features](https://aws.amazon.com/image-builder/features/)

---

### 6. Amazon EBS (Elastic Block Store)

Block-level storage volumes cho EC2 instances.

**Volume Types:**

| Type | Use Case | Max IOPS | Max Throughput |
|------|----------|----------|----------------|
| **gp3** (General Purpose SSD) | Most workloads | 16,000 | 1,000 MB/s |
| **gp2** (General Purpose SSD) | Boot volumes, dev/test | 16,000 | 250 MB/s |
| **io2/io2 Block Express** | Critical databases | 256,000 | 4,000 MB/s |
| **st1** (Throughput HDD) | Big data, log processing | 500 | 500 MB/s |
| **sc1** (Cold HDD) | Infrequent access | 250 | 250 MB/s |

**Tính năng:**
- **Snapshots**: Backup incremental, lưu trên S3
- **Encryption**: Encrypt at rest và in transit
- **Multi-Attach**: Attach io1/io2 volume đến nhiều instances (cùng AZ)
- **Elastic Volumes**: Thay đổi size, type, IOPS mà không downtime

---

### 7. Amazon VPC (Virtual Private Cloud)

Network isolation cho EC2 instances.

| Component | Mô tả |
|-----------|-------|
| **Subnets** | Public (có Internet Gateway) hoặc Private |
| **Route Tables** | Điều hướng traffic |
| **Internet Gateway** | Cho phép access Internet |
| **NAT Gateway** | Private instances access Internet (outbound only) |
| **VPC Endpoints** | Truy cập AWS services mà không qua Internet |

---

### 8. AWS Backup

Centralized backup cho EC2 instances và EBS volumes.

- **Backup Plans**: Định nghĩa schedule, retention, lifecycle
- **Cross-region/Cross-account**: Copy backups đến regions/accounts khác
- **Point-in-time recovery**: Restore đến thời điểm cụ thể

---

## Best Practices

1. **Chọn đúng instance type** - Sử dụng [AWS Compute Optimizer](https://aws.amazon.com/compute-optimizer/) để nhận recommendations
2. **Sử dụng Auto Scaling** - Tự động điều chỉnh capacity theo demand
3. **Tận dụng Spot Instances** - Cho workloads có thể bị interrupt
4. **Right-sizing** - Thường xuyên review và điều chỉnh instance size
5. **Security Groups** - Chỉ mở những ports cần thiết (principle of least privilege)
6. **Multi-AZ deployment** - Triển khai instances trên nhiều Availability Zones để đảm bảo high availability

---

## Tham khảo thêm

- [EC2 User Guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/)
- [EC2 Instance Types Guide](https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-types.html)
- [EC2 Cost and Capacity Optimization](https://aws.amazon.com/ec2/cost-and-capacity/)
- [Getting Started with EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
