# AWS Auto Scaling


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các loại Auto Scaling](#các-loại-auto-scaling)
- [Kiến trúc EC2 Auto Scaling](#kiến-trúc-ec2-auto-scaling)
- [Các thành phần chính](#các-thành-phần-chính)
- [Scaling Policies](#scaling-policies-chính-sách-mở-rộng)
- [Kết hợp với Load Balancer](#kết-hợp-với-load-balancer)
- [Health Checks](#health-checks)
- [Instance Lifecycle](#instance-lifecycle)
- [Multi-AZ Deployment](#multi-az-deployment)
- [Scaling với Spot và Mixed Instances](#scaling-với-spot--mixed-instances)
- [Cooldown Period](#cooldown-period)
- [Termination Policies](#termination-policies)
- [Monitoring và Metrics](#monitoring--metrics)
- [Instance Protection](#instance-protection)
- [Instance Refresh](#instance-refresh)
- [Warm Pools](#warm-pools-preview)
- [Exam Tips](#exam-tips-cloud-practitioner--saa)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Auto Scaling** là dịch vụ cho phép tự động điều chỉnh capacity (số lượng tài nguyên) dựa trên nhu cầu thực tế, giúp:

- ✅ **High Availability**: Đảm bảo luôn có đủ resources để handle traffic
- ✅ **Cost Optimization**: Chỉ trả tiền cho những gì bạn thực sự cần
- ✅ **Fault Tolerance**: Tự động thay thế instances bị lỗi
- ✅ **Better Performance**: Tránh tình trạng quá tải

---

## Các loại Auto Scaling

### 1. EC2 Auto Scaling
Mở rộng/thu hẹp số lượng EC2 instances trong Auto Scaling Group.

### 2. Application Auto Scaling
Mở rộng các dịch vụ AWS khác:
- ECS services
- DynamoDB tables và Global Secondary Indexes
- Aurora Replicas
- Lambda provisioned concurrency
- Spot Fleet requests
- EMR clusters
- AppStream 2.0 fleets
- SageMaker endpoints

### 3. AWS Auto Scaling (Unified)
Console tập trung để quản lý scaling cho nhiều resources cùng lúc với **Scaling Plans**.

---

## Kiến trúc EC2 Auto Scaling

```
┌────────────────────────────────────────────────────────────────────┐
│                        Auto Scaling Group                          │
│                                                                    │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐              │
│  │    EC2     │    │    EC2     │    │    EC2     │   ...        │
│  │ Instance 1 │    │ Instance 2 │    │ Instance 3 │              │
│  │   (AZ-a)   │    │   (AZ-b)   │    │   (AZ-a)   │              │
│  └────────────┘    └────────────┘    └────────────┘              │
│                                                                    │
│  Minimum Capacity: 1                                               │
│  Desired Capacity: 3                                               │
│  Maximum Capacity: 6                                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
                              ▲
                              │
              ┌───────────────┴───────────────┐
              │                               │
      ┌───────┴───────┐              ┌────────┴────────┐
      │Launch Template│              │ Scaling Policies│
      │  (How to      │              │ (When to        │
      │   launch)     │              │  scale)         │
      └───────────────┘              └─────────────────┘
```

---

## Các thành phần chính

### 1. Launch Template (Khuyên dùng) / Launch Configuration (Legacy)

Launch Template định nghĩa cách tạo EC2 instances:

| Thuộc tính | Mô tả |
|------------|-------|
| AMI ID | Image để launch instance |
| Instance Type | t2.micro, m5.large, etc. |
| Key Pair | SSH key để truy cập |
| Security Groups | Firewall rules |
| IAM Role | Permissions cho instance |
| User Data | Scripts chạy khi boot |
| EBS Volumes | Storage configuration |
| Network Settings | VPC, Subnet preferences |

> [!TIP]
> **Launch Template** là phiên bản mới hơn, hỗ trợ versioning và nhiều tính năng hơn Launch Configuration.

### 2. Auto Scaling Group (ASG)

ASG quản lý một nhóm EC2 instances:

```
┌─────────────────────────────────────────────────────────────┐
│                    Auto Scaling Group                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Minimum ◄────────── Desired ──────────► Maximum           │
│     1                    3                   10              │
│     │                    │                   │               │
│     │    ┌───┐ ┌───┐ ┌───┐                  │               │
│     └───►│ I │ │ I │ │ I │◄─────────────────┘               │
│          └───┘ └───┘ └───┘                                   │
│          Current: 3 instances                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Capacity Settings:**
- **Minimum Capacity**: Số instance tối thiểu (không bao giờ scale xuống dưới)
- **Desired Capacity**: Số instance mong muốn hiện tại
- **Maximum Capacity**: Số instance tối đa (không bao giờ scale lên trên)

---

## Scaling Policies (Chính sách mở rộng)

### 1. Target Tracking Scaling (Recommended)

Tự động điều chỉnh để duy trì metric ở mức target.

```
Ví dụ: Giữ CPU Utilization = 50%

CPU hiện tại: 70% → Scale OUT (thêm instances)
CPU hiện tại: 30% → Scale IN (giảm instances)
CPU hiện tại: 50% → Không thay đổi
```

**Predefined Metrics:**
| Metric | Mô tả |
|--------|-------|
| `ASGAverageCPUUtilization` | Trung bình CPU của ASG |
| `ASGAverageNetworkIn` | Trung bình bytes nhận vào |
| `ASGAverageNetworkOut` | Trung bình bytes gửi đi |
| `ALBRequestCountPerTarget` | Số requests per target từ ALB |

> [!NOTE]
> Target Tracking là cách đơn giản và hiệu quả nhất. AWS sẽ tự động tạo và quản lý CloudWatch alarms.

---

### 2. Step Scaling

Scale theo các "bước" dựa trên mức độ alarm.

```
┌────────────────────────────────────────────────────────────┐
│                    Step Scaling Policy                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  CPU 0-40%    │ Scale IN:  Remove 2 instances              │
│  CPU 40-60%   │ No Action                                  │
│  CPU 60-80%   │ Scale OUT: Add 1 instance                  │
│  CPU 80-100%  │ Scale OUT: Add 3 instances                 │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Ưu điểm**: Có thể định nghĩa các mức độ scale khác nhau tùy theo severity.

---

### 3. Simple Scaling

Scale một lượng cố định khi alarm triggered, sau đó có **cooldown period**.

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  Alarm "High CPU" triggered → Add 2 instances                │
│                              ↓                               │
│                     Cooldown: 300 seconds                    │
│                     (Không scale trong 5 phút)               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> Simple Scaling có hạn chế vì cooldown period có thể gây chậm trễ khi traffic thay đổi liên tục. Ưu tiên dùng **Step Scaling** hoặc **Target Tracking**.

---

### 4. Scheduled Scaling

Scale theo lịch định trước - phù hợp khi bạn biết trước pattern.

```
Ví dụ: Website bán hàng

┌─────────────────────────────────────────────────────────────┐
│  Thời gian           │ Action              │ Desired        │
├──────────────────────┼─────────────────────┼────────────────┤
│  Mỗi ngày 8:00 AM    │ Scale OUT           │ 5 instances    │
│  Mỗi ngày 10:00 PM   │ Scale IN            │ 2 instances    │
│  Black Friday        │ Scale OUT           │ 20 instances   │
│  Chủ nhật            │ Scale IN            │ 1 instance     │
└─────────────────────────────────────────────────────────────┘
```

**Cron Expression Format:**
```
cron(0 8 * * ? *)    # Mỗi ngày lúc 8:00 UTC
cron(0 22 * * ? *)   # Mỗi ngày lúc 22:00 UTC
```

---

### 5. Predictive Scaling

Sử dụng Machine Learning để phân tích traffic patterns và **scale trước khi cần**.

```
┌────────────────────────────────────────────────────────────────┐
│                     Predictive Scaling                          │
│                                                                  │
│  Traffic    ^                                                    │
│  Pattern    │     ╭──╮                                          │
│             │    ╱    ╲      ← ML dự đoán traffic tăng          │
│             │   ╱      ╲                                        │
│             │──╱────────╲──                                     │
│             └──────────────────► Time                           │
│                                                                  │
│  Scaling    ^                                                    │
│  Action     │  ╭──╮                                              │
│             │ ╱    ╲         ← Scale TRƯỚC khi traffic tăng     │
│             │╱      ╲                                           │
│             └──────────────────► Time                           │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

**Yêu cầu:**
- Cần ít nhất **24 giờ** historical data
- Hoạt động tốt nhất với **patterns định kỳ** (daily, weekly)

---

## Kết hợp với Load Balancer

### Kiến trúc tích hợp

```
                              Internet
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    Application Load     │
                    │       Balancer          │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │      Target Group       │◄── Health Check
                    │  (Auto-registered by    │    (từ ALB)
                    │       ASG)              │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
      ┌──────────┐        ┌──────────┐        ┌──────────┐
      │   EC2    │        │   EC2    │        │   EC2    │
      │Instance 1│        │Instance 2│        │Instance 3│
      └──────────┘        └──────────┘        └──────────┘
            ▲                   ▲                   ▲
            └───────────────────┼───────────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │   Auto Scaling Group    │
                    │ • Auto-register to TG   │
                    │ • Health Check từ ELB   │
                    └─────────────────────────┘
```

### ASG vs Target Group - So sánh chi tiết

| Đặc điểm | Auto Scaling Group | Target Group |
|----------|-------------------|--------------|
| **Thuộc về** | EC2 Auto Scaling | Elastic Load Balancer |
| **Mục đích chính** | Quản lý số lượng instances | Định tuyến traffic |
| **Tạo/Xóa instances** | ✅ Có | ❌ Không |
| **Routing traffic** | ❌ Không | ✅ Có |
| **Health Check** | EC2 hoặc ELB | HTTP/HTTPS/TCP |
| **Khi unhealthy** | Terminate & replace | Ngừng gửi traffic |

### ASG hoạt động độc lập với Load Balancer

ASG và Load Balancer là **2 dịch vụ hoàn toàn độc lập**, có thể dùng riêng lẻ hoặc kết hợp:

| Scenario | ASG | LB | Use Case |
|----------|-----|----|---------| 
| Chỉ dùng ASG | ✅ | ❌ | Batch jobs, SQS workers, scheduled tasks |
| Chỉ dùng LB | ❌ | ✅ | Static fleet với số lượng cố định |
| Dùng cả hai | ✅ | ✅ | Web apps (Best practice) |

### Auto Registration vào Target Group

Khi ASG được attach với Target Group, việc register/deregister instances diễn ra **hoàn toàn tự động**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ASG + TARGET GROUP AUTO REGISTRATION                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCALE OUT (Thêm instance):                                              │
│  ─────────────────────────────                                           │
│  ASG launch instance ──► Boot & Health check ──► Auto register vào TG  │
│                                                  ──► LB gửi traffic     │
│                                                                          │
│  SCALE IN (Xóa instance):                                                │
│  ────────────────────────                                                │
│  ASG terminate ──► Auto deregister khỏi TG ──► Connection draining     │
│                                              ──► Instance terminated    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| Action | ASG tự động làm |
|--------|-----------------|
| Launch instance mới | Register vào Target Group |
| Terminate instance | Deregister khỏi Target Group |
| Instance unhealthy | Terminate, launch mới, register vào TG |

> [!NOTE]
> Điều này chỉ hoạt động khi bạn đã **attach ASG với Target Group** trong cấu hình ASG.

---

## Health Checks

### Các loại Health Check

```
┌─────────────────────────────────────────────────────────────────┐
│                      Health Check Types                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. EC2 Health Check (Default)                                  │
│     └── Kiểm tra: Instance status = running                     │
│     └── Khi fail: Instance bị terminate & replace               │
│                                                                  │
│  2. ELB Health Check                                            │
│     └── Kiểm tra: HTTP response từ application                  │
│     └── Khi fail: Instance bị mark unhealthy                    │
│     └── ASG sẽ terminate & launch instance mới                  │
│                                                                  │
│  3. Custom Health Check                                          │
│     └── Sử dụng API: set-instance-health                        │
│     └── Ứng dụng tự report health status                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Khi sử dụng với Load Balancer, nên bật **ELB Health Check** để ASG có thể thay thế instances mà application không responsive.

### Health Check Grace Period

```
Instance Launch ─────────────────────────────────────────► Running
                │                                         │
                │◄────── Grace Period (default 300s) ────►│
                │                                         │
                │  Trong thời gian này:                   │
                │  • Không check health                   │
                │  • Instance đang boot/init              │
                │  • Application đang start               │
                                                          │
                                              Health Check bắt đầu
```

---

## Instance Lifecycle

### Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Instance Lifecycle                            │
│                                                                      │
│  ┌─────────┐    ┌─────────────┐    ┌───────────┐    ┌─────────────┐ │
│  │ Pending │───►│Pending:Wait │───►│InService  │───►│ Terminating │ │
│  └─────────┘    └─────────────┘    └───────────┘    └─────────────┘ │
│       │              │                   │                │         │
│       │              │                   │                │         │
│       │         Lifecycle Hook     Normal Running    Lifecycle Hook│
│       │         (optional)                            (optional)    │
│       │                                                             │
│  Launch                                                   Terminate │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Lifecycle Hooks

Cho phép thực hiện custom actions khi instance đang scale:

**Use Cases:**
- **Scale OUT Hook**: Install software, pull config từ S3, register vào service discovery
- **Scale IN Hook**: Drain connections, backup logs, deregister từ external systems

```
┌─────────────────────────────────────────────────────────────────┐
│                      Lifecycle Hook Flow                         │
│                                                                  │
│  Scale OUT:                                                      │
│  Pending ──► Pending:Wait ──► [Custom Action] ──► InService     │
│                    │                                             │
│                    ├── Pull config from S3                       │
│                    ├── Register to DNS                           │
│                    └── Warm up cache                             │
│                                                                  │
│  Scale IN:                                                       │
│  InService ──► Terminating:Wait ──► [Custom Action] ──► Terminated│
│                       │                                          │
│                       ├── Drain connections                      │
│                       ├── Upload logs to S3                      │
│                       └── Notify monitoring system               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Multi-AZ Deployment

### AZ Rebalancing

ASG tự động phân phối instances đều giữa các Availability Zones:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Auto Scaling Group                            │
│                    Desired: 6 instances                          │
│                                                                  │
│    AZ-a              AZ-b              AZ-c                     │
│  ┌──────┐          ┌──────┐          ┌──────┐                   │
│  │ I-1  │          │ I-3  │          │ I-5  │                   │
│  │ I-2  │          │ I-4  │          │ I-6  │                   │
│  └──────┘          └──────┘          └──────┘                   │
│    2 instances       2 instances       2 instances              │
│                                                                  │
│  ✅ Evenly distributed across AZs                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> Khi một AZ gặp vấn đề, ASG sẽ tự động launch instances ở các AZ còn lại.

---

## Scaling với Spot & Mixed Instances

### Mixed Instances Policy

Kết hợp On-Demand và Spot instances để tối ưu chi phí:

```
┌─────────────────────────────────────────────────────────────────┐
│               Mixed Instances Auto Scaling                       │
│                                                                  │
│   On-Demand Instances (Base Capacity)                           │
│   ┌────┐ ┌────┐                                                 │
│   │ OD │ │ OD │  ← Guaranteed capacity (2 instances)            │
│   └────┘ └────┘                                                 │
│                                                                  │
│   Spot Instances (Scale capacity - 70% cheaper!)                │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐                                  │
│   │ SP │ │ SP │ │ SP │ │ SP │  ← Cost-optimized (4 instances)  │
│   └────┘ └────┘ └────┘ └────┘                                  │
│                                                                  │
│   Configuration:                                                 │
│   • On-Demand Base: 2                                           │
│   • On-Demand Percentage Above Base: 30%                        │
│   • Spot Allocation: Lowest Price or Capacity Optimized         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cooldown Period

Thời gian chờ giữa các scaling activities:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cooldown Period                             │
│                                                                  │
│  Scale OUT ────► Cooldown (300s) ────► Ready for next scale    │
│       │                                                          │
│       │ Trong cooldown:                                         │
│       │ • Không trigger thêm scaling                            │
│       │ • Ignore CloudWatch alarms                              │
│       │ • Chờ instances ổn định                                 │
│                                                                  │
│  Default: 300 seconds (5 phút)                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> Với **Target Tracking**, AWS tự động quản lý cooldown tối ưu. Không cần configure thủ công.

---

## Termination Policies

Khi scale IN, ASG quyết định terminate instance nào dựa trên policy:

| Policy | Mô tả |
|--------|-------|
| **Default** | AZ có nhiều instances nhất → Instance gần billing hour nhất |
| **OldestInstance** | Terminate instance cũ nhất |
| **NewestInstance** | Terminate instance mới nhất |
| **OldestLaunchConfiguration** | Terminate instance dùng Launch Config cũ nhất |
| **OldestLaunchTemplate** | Terminate instance dùng Launch Template cũ nhất |
| **ClosestToNextInstanceHour** | Terminate instance gần billing hour nhất |
| **AllocationStrategy** | Dựa trên allocation strategy (Spot/On-Demand) |

### Default Termination Policy Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 Default Termination Policy                       │
│                                                                  │
│  1. Chọn AZ có nhiều instances nhất                             │
│           │                                                      │
│           ▼                                                      │
│  2. Chọn instance với oldest Launch Template/Config             │
│           │                                                      │
│           ▼                                                      │
│  3. Nếu nhiều instances cùng điều kiện:                         │
│     Chọn instance gần next billing hour nhất                    │
│           │                                                      │
│           ▼                                                      │
│  4. Nếu vẫn còn tie: Random                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Metrics

### CloudWatch Metrics cho ASG

| Metric | Ý nghĩa |
|--------|---------|
| `GroupMinSize` | Minimum size của ASG |
| `GroupMaxSize` | Maximum size của ASG |
| `GroupDesiredCapacity` | Desired capacity hiện tại |
| `GroupInServiceInstances` | Số instances đang InService |
| `GroupPendingInstances` | Số instances đang Pending |
| `GroupTerminatingInstances` | Số instances đang Terminating |
| `GroupTotalInstances` | Tổng số instances |

### Enable Group Metrics

```bash
aws autoscaling enable-metrics-collection \
    --auto-scaling-group-name my-asg \
    --granularity "1Minute"
```

---

## Instance Protection

Bảo vệ instances khỏi bị terminate khi scale IN:

```
┌─────────────────────────────────────────────────────────────────┐
│                   Instance Protection                            │
│                                                                  │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐               │
│   │  EC2   │  │  EC2   │  │  EC2   │  │  EC2   │               │
│   │  (🔒)  │  │        │  │  (🔒)  │  │        │               │
│   └────────┘  └────────┘  └────────┘  └────────┘               │
│   Protected   Normal      Protected   Normal                    │
│                                                                  │
│   Khi Scale IN: Chỉ terminate instances KHÔNG protected        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Use Cases:**
- Master/Primary instances
- Instances đang xử lý long-running jobs
- Instances cần manual intervention trước khi terminate

---

## Instance Refresh

Update instances trong ASG với zero/minimal downtime:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Instance Refresh                              │
│                                                                  │
│  Before: All instances use AMI v1                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │
│  │AMI-1 │ │AMI-1 │ │AMI-1 │ │AMI-1 │                           │
│  └──────┘ └──────┘ └──────┘ └──────┘                           │
│                                                                  │
│  During Refresh (min healthy: 50%):                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │
│  │AMI-2 │ │AMI-2 │ │AMI-1 │ │AMI-1 │  ← Rolling update         │
│  └──────┘ └──────┘ └──────┘ └──────┘                           │
│                                                                  │
│  After: All instances use AMI v2                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │
│  │AMI-2 │ │AMI-2 │ │AMI-2 │ │AMI-2 │                           │
│  └──────┘ └──────┘ └──────┘ └──────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Warm Pools (Preview)

Pre-initialized instances để giảm thời gian scale OUT.

### Khái niệm

Warm Pool là một nhóm các instances đã được **pre-initialized** (đã boot, đã cài đặt software) nhưng chưa phục vụ traffic. Khi cần scale OUT, ASG sẽ lấy instance từ Warm Pool thay vì launch mới từ đầu.

### Kiến trúc

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         AUTO SCALING GROUP                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ACTIVE INSTANCES (InService)              WARM POOL                      │
│   ================================          ==========================     │
│                                                                            │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐   ┌──────────┐ ┌──────────┐     │
│   │ Instance │ │ Instance │ │ Instance │   │ Instance │ │ Instance │     │
│   │    A     │ │    B     │ │    C     │   │    D     │ │    E     │     │
│   │ [RUNNING]│ │ [RUNNING]│ │ [RUNNING]│   │ [STOPPED]│ │ [STOPPED]│     │
│   └──────────┘ └──────────┘ └──────────┘   └──────────┘ └──────────┘     │
│        │            │            │              │             │           │
│        └────────────┴────────────┘              └─────────────┘           │
│                     │                                  │                   │
│            Serving Traffic                    Pre-warmed, Ready           │
│                                               (Boot completed,            │
│                                                App installed)             │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

### Scale OUT Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SCALE OUT COMPARISON                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  WITHOUT WARM POOL (Traditional):                                        │
│  ─────────────────────────────────                                       │
│                                                                          │
│  CloudWatch     Launch        Boot OS      Install      Register        │
│   Alarm    ──►  Instance  ──►  (60s)   ──►  App    ──►  to ELB    ──► Ready│
│    │              │             │          (120s)       (30s)            │
│    └──────────────┴─────────────┴────────────┴───────────┘               │
│                        Total: 3-5 minutes                                │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  WITH WARM POOL (Optimized):                                             │
│  ──────────────────────────────                                          │
│                                                                          │
│  CloudWatch     Start from      Register                                 │
│   Alarm    ──►  Warm Pool   ──►  to ELB   ──► Ready                      │
│    │            (10-20s)         (30s)                                   │
│    └────────────┴────────────────┘                                       │
│                Total: 30-60 seconds                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Warm Pool States

| State | Mô tả | Cost |
|-------|-------|------|
| **Stopped** | Instance đã boot xong, sau đó bị stop | Chỉ trả tiền EBS |
| **Running** | Instance running nhưng chưa serve traffic | Trả tiền EC2 + EBS |
| **Hibernated** | Instance hibernated (RAM saved to EBS) | Chỉ trả tiền EBS |

### Benefits

- **Faster scale out**: Giảm từ 3-5 phút xuống còn 30-60 giây
- **Pre-configured**: Instances đã boot, cài software, pull config
- **Cost effective**: Dùng Stopped state để tiết kiệm chi phí
- **Reliability**: Instances đã được verify hoạt động trước khi serve traffic

---

## Exam Tips (Cloud Practitioner / SAA)

### Key Points to Remember

1. **Auto Scaling = Horizontal Scaling**
   - Thêm/bớt instances (không phải tăng size của instance)
   
2. **Free Service**
   - Auto Scaling miễn phí, chỉ trả tiền cho EC2 instances được launch

3. **Scaling Policy Priority**
   - **Target Tracking** > Step Scaling > Simple Scaling
   - Target Tracking là recommended cho hầu hết use cases

4. **Health Check Types**
   - EC2 (default) - chỉ check instance status
   - ELB - check application response (recommended khi dùng với ALB)

5. **Cooldown Period**
   - Ngăn scaling quá nhanh
   - Default 300 seconds
   - Target Tracking tự quản lý cooldown

6. **Launch Template vs Launch Configuration**
   - **Launch Template** là recommended (versioning, mới hơn)
   - Launch Configuration là legacy (không thể modify)

7. **Multi-AZ**
   - ASG tự động distribute instances across AZs
   - AZ Rebalancing đảm bảo even distribution

8. **Predictive Scaling**
   - Sử dụng ML để dự đoán traffic
   - Scale TRƯỚC khi cần

### Common Exam Scenarios

| Scenario | Solution |
|----------|----------|
| Scale based on CPU | Target Tracking với ASGAverageCPUUtilization |
| Scale at specific times | Scheduled Scaling |
| Scale for predictable patterns | Predictive Scaling |
| Handle sudden traffic spikes | Step Scaling hoặc Target Tracking |
| Update instances với new AMI | Instance Refresh |
| Scale faster | Warm Pools |
| Reduce costs | Mixed Instances (On-Demand + Spot) |

---

## Tài liệu tham khảo

- [AWS Auto Scaling Documentation](https://docs.aws.amazon.com/autoscaling/)
- [EC2 Auto Scaling User Guide](https://docs.aws.amazon.com/autoscaling/ec2/userguide/)
- [Application Auto Scaling User Guide](https://docs.aws.amazon.com/autoscaling/application/userguide/)
