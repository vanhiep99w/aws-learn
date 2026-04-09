# Auto Scaling Group (ASG)


## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
- [Các thông số cơ bản](#các-thông-số-cơ-bản)
- [Launch Template vs Launch Configuration](#launch-template-vs-launch-configuration)
- [Placement Groups với ASG](#placement-groups-với-asg)
- [Scaling Policies](#scaling-policies)
  - [Manual Scaling](#1-manual-scaling)
  - [Dynamic Scaling](#2-dynamic-scaling)
    - [Target Tracking Scaling](#a-target-tracking-scaling)
    - [Step Scaling](#b-step-scaling)
    - [Simple Scaling](#c-simple-scaling)
  - [Scheduled Scaling](#3-scheduled-scaling)
  - [Predictive Scaling](#4-predictive-scaling)
- [Scaling Cooldown](#scaling-cooldown)
- [Health Checks](#health-checks)
- [Instance Refresh](#instance-refresh)
- [Warm Pools](#warm-pools)
- [Multi-AZ Deployment](#multi-az-deployment)
- [Termination Policies](#termination-policies)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Mixed Instances Policy](#mixed-instances-policy)
- [Instance Protection](#instance-protection)
- [CloudWatch Metrics](#cloudwatch-metrics)
- [Tích hợp với ELB](#tích-hợp-với-elb)
- [Best Practices](#best-practices)
- [Liên kết](#liên-kết)

---

## Tổng quan

**Auto Scaling Group (ASG)** là tập hợp các EC2 instances được quản lý và scale tự động bởi **Amazon EC2 Auto Scaling**. ASG đảm bảo số lượng instances phù hợp với demand và thay thế unhealthy instances tự động.

> **Nguồn:** [Auto Scaling Groups](https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-groups.html)

---

## Kiến trúc tổng quan

```
                         ┌─────────────────────────────────────┐
                         │        Auto Scaling Group           │
                         │                                     │
    ┌────────────┐       │   Min: 2    Desired: 3    Max: 5    │
    │ CloudWatch │◀──────│                                     │
    │   Alarms   │       │  ┌────┐   ┌────┐   ┌────┐           │
    └─────┬──────┘       │  │EC2 │   │EC2 │   │EC2 │           │
          │              │  └────┘   └────┘   └────┘           │
          ▼              │     │        │        │             │
    ┌────────────┐       │     └────────┴────────┘             │
    │  Scaling   │──────▶│              │                      │
    │  Policies  │       │              ▼                      │
    └────────────┘       │    ┌─────────────────┐              │
                         │    │ Target Group    │              │
                         │    │ (ELB)           │              │
                         │    └─────────────────┘              │
                         └─────────────────────────────────────┘
```

---

## Các thông số cơ bản

| Thông số | Mô tả |
|----------|-------|
| **Minimum capacity** | Số instances tối thiểu (không bao giờ dưới) |
| **Maximum capacity** | Số instances tối đa (không bao giờ vượt) |
| **Desired capacity** | Số instances mong muốn hiện tại |

```
Min ≤ Desired ≤ Max

Ví dụ: Min=2, Desired=3, Max=5
- Luôn có ít nhất 2 instances
- Hiện tại maintain 3 instances
- Có thể scale up tới 5 instances
```

---

## Launch Template vs Launch Configuration

### Launch Template là gì?

**Launch Template** là một bản cấu hình định nghĩa các tham số để khởi tạo EC2 instance. Khi ASG cần tạo instance mới, nó dùng Launch Template như một "công thức".

```
Launch Template chứa:
┌───────────────────────────────────────────────────────┐
│  AMI ID           │ ami-0abcdef1234567890             │
│  Instance Type    │ t3.medium                         │
│  Key Pair         │ my-keypair                        │
│  Security Groups  │ sg-0123456789abcdef0              │
│  IAM Role         │ arn:aws:iam::123:instance-profile │
│  User Data        │ #!/bin/bash\napt update...        │
│  EBS Volumes      │ /dev/xvda: 20GB gp3               │
│  Network          │ subnet, public IP, etc.           │
│  Tags             │ Name=web-server, Env=prod         │
│  Tenancy          │ default / dedicated / host        │
└───────────────────────────────────────────────────────┘
```

**Versioning** — điểm mạnh của Launch Template:

```
Launch Template: lt-0abc123
  ├── Version 1 (default) — t3.medium, AMI cũ
  ├── Version 2           — t3.large, AMI mới
  └── Version 3 (latest)  — t3.large, AMI mới + thêm EBS

ASG có thể chỉ định: dùng version $Latest, $Default, hoặc version cụ thể
→ Dễ dàng rollback về version cũ nếu có vấn đề
```

### So sánh Launch Template vs Launch Configuration

| Tiêu chí | Launch Template | Launch Configuration |
|----------|-----------------|----------------------|
| **Trạng thái** | Recommended | Legacy (deprecated) |
| **Versioning** | Có | Không |
| **Spot + On-Demand mix** | Có | Không |
| **Multiple instance types** | Có | Không |
| **T2/T3 Unlimited** | Có | Không |
| **Placement Groups** | Có | Không |

> **Khuyến nghị:** Luôn dùng **Launch Template**

---

## Placement Groups với ASG

**Placement Groups** kiểm soát cách EC2 instances được đặt trên physical hardware. Kết hợp với ASG qua **Launch Template**.

### Cách tích hợp

```
Tạo Placement Group → Gán vào Launch Template → ASG dùng Template đó
                                                   ↓
                                           Instances tự động được đặt theo strategy
```

### Các kịch bản

| Scenario | Placement Group | Lưu ý |
|----------|-----------------|--------|
| **HPC cluster** | Cluster | Low latency, nhưng nếu 1 rack fail → tất cả fail |
| **HA web servers** | Spread | **Max 7 instances/AZ** - ASG không thể vượt quá! |
| **Kafka/Cassandra** | Partition | Instances được phân bổ vào các partitions |

### ⚠️ Lưu ý quan trọng

1. **Spread + ASG**: Max 7 instances/AZ. Nếu ASG cố scale lên 8+ → `InsufficientCapacity Error`

2. **Cluster + ASG**: Tốt nhất launch tất cả cùng lúc. Scale thêm sau có thể gặp capacity error

3. **Launch Configuration không hỗ trợ** Placement Groups → bắt buộc dùng **Launch Template**

### Microservice thông thường có cần Placement Groups?

**Không** - 99% microservices chỉ cần **Multi-AZ + ASG** là đủ:

| App Type | Cần Placement Groups? | Lý do |
|----------|----------------------|-------|
| **Web API, REST services** | ❌ Không | Latency vài ms là chấp nhận được |
| **Microservices thường** | ❌ Không | Multi-AZ + ELB đủ HA |
| **HPC, ML training** | ✅ Cluster | Cần < 10μs latency, 10-25 Gbps |
| **Critical services (payment)** | ⚠️ Spread (optional) | Muốn hardware-level isolation |
| **Kafka, Cassandra, HDFS** | ✅ Partition | Cần partition-awareness |

> 💡 **Tóm lại**: Chỉ dùng Placement Groups cho workloads đặc biệt (HPC, Big Data, distributed databases). Backend services bình thường **không cần**.

> Xem chi tiết về Placement Groups tại [EC2 - Placement Groups](ec2.md#placement-groups)

---

## Scaling Policies

### 1. Manual Scaling

Thay đổi desired capacity thủ công:

```bash
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name my-asg \
  --desired-capacity 5
```

### 2. Dynamic Scaling

Tự động scale dựa trên metrics. Có 3 loại:

#### a) Target Tracking Scaling

- Maintain metric ở target value
- Đơn giản nhất, khuyến nghị dùng

```
Ví dụ: Giữ CPU utilization = 50%
- CPU > 50% → Scale OUT
- CPU < 50% → Scale IN
```

Predefined metrics:
- `ASGAverageCPUUtilization`
- `ASGAverageNetworkIn`
- `ASGAverageNetworkOut`
- `ALBRequestCountPerTarget`

#### b) Step Scaling

- Scale theo các "bậc thang" dựa trên mức độ alarm

```
CPU 50-70%  → Add 1 instance
CPU 70-90%  → Add 2 instances
CPU > 90%   → Add 3 instances
```

#### c) Simple Scaling

- Dạng scaling cơ bản nhất — **1 CloudWatch Alarm → 1 scaling action cố định**
- Khi alarm triggered → thực hiện **đúng 1 adjustment**, sau đó **chờ hết cooldown** mới xử lý alarm tiếp
- **Không phản ứng theo mức độ** của metric (khác với Step Scaling)

```
CloudWatch Alarm: CPU > 70%
         │
         ▼
    Add 1 instance
         │
         ▼
    ┌─────────────────────┐
    │  Cooldown (300s)    │ ← Mọi alarm mới bị IGNORE
    └─────────────────────┘
         │
         ▼
    Sẵn sàng scale tiếp
```

```bash
# Tạo Simple Scaling Policy
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name my-asg \
  --policy-name scale-out-simple \
  --policy-type SimpleScaling \
  --adjustment-type ChangeInCapacity \
  --scaling-adjustment 1 \
  --cooldown 300
```

**Adjustment Types:**

| Type | Ví dụ | Mô tả |
|------|-------|-------|
| `ChangeInCapacity` | `+2` | Thêm/bớt số lượng cố định |
| `ExactCapacity` | `5` | Set desired capacity = 5 |
| `PercentChangeInCapacity` | `+50%` | Thêm/bớt theo % |

**So sánh Simple vs Step Scaling:**

```
Simple Scaling:                    Step Scaling:
CPU > 70% → Add 1 (luôn luôn)     CPU 50-70%  → Add 1
                                   CPU 70-90%  → Add 2
                                   CPU > 90%   → Add 3
                                   (phản ứng theo mức độ)
```

> ⚠️ **Không khuyến nghị** dùng Simple Scaling vì:
> 1. **Cooldown chặn alarm** — trong thời gian cooldown, mọi alarm mới bị bỏ qua dù CPU đang 100%
> 2. **Không linh hoạt** — luôn add/remove cùng số lượng bất kể mức độ nghiêm trọng
> 3. **Phản ứng chậm** — phải chờ cooldown xong mới scale tiếp
>
> → Dùng **Target Tracking** hoặc **Step Scaling** thay thế

### 3. Scheduled Scaling

Scale theo lịch định sẵn:

```bash
aws autoscaling put-scheduled-update-group-action \
  --auto-scaling-group-name my-asg \
  --scheduled-action-name scale-out-morning \
  --recurrence "0 9 * * MON-FRI" \
  --desired-capacity 10
```

Ví dụ use cases:
- Scale up lúc 9h sáng ngày làm việc
- Scale down lúc 6h chiều
- Scale up trước Black Friday

### 4. Predictive Scaling

- Sử dụng **machine learning** để dự đoán traffic
- Dựa trên historical data (14 ngày)
- Proactively scale trước khi demand tăng

> **Nguồn:** [Predictive Scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/predictive-scaling-create-policy.html)

---

## Scaling Cooldown

- Thời gian chờ sau scaling activity trước khi thực hiện action tiếp
- Default: **300 seconds**
- Tránh scale liên tục (thrashing)

```
Scale OUT → [Cooldown 300s] → Có thể scale tiếp
                ↑
                │ Ignore new alarms trong thời gian này
```

---

## Health Checks

ASG sử dụng health checks để phát hiện và thay thế unhealthy instances:

| Loại | Mô tả |
|------|-------|
| **EC2** | Kiểm tra EC2 status checks (default) |
| **ELB** | Kiểm tra ELB health check (khi attach với ELB) |
| **Custom** | VPC Lattice hoặc custom health check |

```
Health Check Flow:
┌────────┐     Unhealthy      ┌────────────┐
│Instance│ ──────────────────▶│ Terminate  │
└────────┘                    └─────┬──────┘
                                    │
                                    ▼
                              ┌────────────┐
                              │ Launch New │
                              │  Instance  │
                              └────────────┘
```

**Grace Period:** Thời gian chờ sau khi launch instance mới trước khi bắt đầu health check (default: 300s)

### Hành vi mặc định khi instance unhealthy (quan trọng)

Khi ASG xác định instance `InService` là unhealthy (EC2/ELB/custom health check), **mặc định**:

1. ASG tạo scaling activity để **terminate unhealthy instance** trước
2. Trong lúc đó, ASG tạo scaling activity khác để **launch instance thay thế**

Điều này là hành vi mặc định `terminate and launch`.

Nếu muốn ưu tiên availability để launch trước rồi mới terminate, cấu hình **instance maintenance policy** theo kiểu `launch before terminating`.

> **Nguồn:** [View the reason for health check failures](https://docs.aws.amazon.com/autoscaling/ec2/userguide/replace-unhealthy-instance.html), [Instance maintenance policy for Auto Scaling group](https://docs.aws.amazon.com/autoscaling/ec2/userguide/instance-maintenance-policy-overview-and-considerations.html)

---

## Instance Refresh

Cập nhật instances trong ASG với zero downtime:

```bash
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name my-asg \
  --preferences '{"MinHealthyPercentage": 90}'
```

| Parameter | Mô tả |
|-----------|-------|
| **MinHealthyPercentage** | % instances phải healthy trong quá trình refresh |
| **InstanceWarmup** | Thời gian chờ instance warm up |
| **SkipMatching** | Bỏ qua instances đã match với config mới |

---

## Warm Pools

Pre-initialize instances để giảm thời gian launch:

```
┌─────────────────────────────────────────────────────┐
│                 Auto Scaling Group                  │
│                                                     │
│  Active Pool          Warm Pool                     │
│  ┌────┐ ┌────┐       ┌────┐ ┌────┐                  │
│  │Run │ │Run │       │Stop│ │Stop│                  │
│  └────┘ └────┘       └────┘ └────┘                  │
│                         │                           │
│                         │ Scale Out                 │
│                         ▼                           │
│                    ┌────────┐                       │
│                    │ Start  │ (nhanh hơn launch)    │
│                    └────────┘                       │
└─────────────────────────────────────────────────────┘
```

### Pool States và Chi phí

| Pool State | Phí EC2 | Phí EBS | Mô tả |
|------------|---------|---------|-------|
| **Stopped** | ❌ Không | ✅ Có | Instance dừng, chỉ trả EBS storage |
| **Hibernated** | ❌ Không | ✅ Có | RAM preserved, fastest warm-up |
| **Running** | ✅ Có | ✅ Có | Instance chạy đầy đủ, tốn nhất |

```
Ví dụ: Warm Pool với 3 instances (t3.medium + 20GB EBS)

Stopped state (khuyến nghị):
  EC2: $0 (không chạy)
  EBS: 3 × 20GB × $0.10/GB = $6/tháng
  → Tổng: ~$6/tháng

Running state:
  EC2: 3 × $0.0416/h × 720h = ~$90/tháng
  EBS: $6/tháng
  → Tổng: ~$96/tháng
```

> **Khuyến nghị:** Dùng **Stopped** state để tiết kiệm - chỉ trả tiền EBS, không trả compute.

> **Nguồn:** [Warm Pools](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-warm-pools.html)

> Phù hợp cho apps có boot time dài

---

## Multi-AZ Deployment

ASG tự động phân bổ instances across AZs:

```
┌─────────────────────────────────────────────────────┐
│              Auto Scaling Group (Desired: 6)        │
├─────────────────┬─────────────────┬─────────────────┤
│      AZ-A       │      AZ-B       │      AZ-C       │
│  ┌────┐ ┌────┐  │  ┌────┐ ┌────┐  │  ┌────┐ ┌────┐  │
│  │EC2 │ │EC2 │  │  │EC2 │ │EC2 │  │  │EC2 │ │EC2 │  │
│  └────┘ └────┘  │  └────┘ └────┘  │  └────┘ └────┘  │
└─────────────────┴─────────────────┴─────────────────┘
```

- **Rebalancing**: ASG tự động rebalance khi có AZ imbalance
- **Availability Zone Distribution**: Phân bố đều instances

**Thứ tự khi AZ rebalancing (mặc định):**
- ASG **launch instance mới trước**, sau đó mới **terminate instance cũ**
- Mục tiêu: không làm giảm performance/availability trong lúc cân bằng lại AZ
- ASG có thể tạm thời vượt `max capacity` (tối đa 10% hoặc ít nhất 1 instance) để hoàn tất rebalancing

> **Nguồn:** [Control which Auto Scaling instances terminate during scale in](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-instance-termination.html)

---

## Termination Policies

Xác định instance nào bị terminate khi scale in:

| Policy | Mô tả |
|--------|-------|
| **Default** | AZ balance → Outdated configs (①Launch Config ②Different Launch Template ③Oldest version current LT) → Closest to billing hour → Random |
| **OldestInstance** | Terminate instance cũ nhất |
| **NewestInstance** | Terminate instance mới nhất |
| **OldestLaunchConfiguration** | Terminate instance với launch config cũ nhất |
| **OldestLaunchTemplate** | Terminate instance với launch template version cũ nhất |
| **AllocationStrategy** | Dựa trên allocation strategy (Spot) |
| **ClosestToNextInstanceHour** | Gần billing hour nhất |

---

## Lifecycle Hooks

Thực hiện custom actions trong quá trình launch/terminate:

```
                    Launch Lifecycle
┌─────────┐    ┌─────────────────────┐    ┌───────────┐
│Pending  │───▶│Pending:Wait         │───▶│InService  │
└─────────┘    │(Lifecycle Hook)     │    └───────────┘
               │ - Run scripts       │
               │ - Configure app     │
               │ - Register DNS      │
               └─────────────────────┘

                   Terminate Lifecycle
┌───────────┐    ┌─────────────────────┐    ┌───────────┐
│InService  │───▶│Terminating:Wait     │───▶│Terminated │
└───────────┘    │(Lifecycle Hook)     │    └───────────┘
                 │ - Drain connections │
                 │ - Save logs         │
                 │ - Deregister DNS    │
                 └─────────────────────┘
```

---

## Mixed Instances Policy

Kết hợp On-Demand và Spot Instances:

```json
{
  "LaunchTemplate": {...},
  "InstancesDistribution": {
    "OnDemandBaseCapacity": 2,
    "OnDemandPercentageAboveBaseCapacity": 50,
    "SpotAllocationStrategy": "capacity-optimized"
  },
  "Overrides": [
    {"InstanceType": "c5.large"},
    {"InstanceType": "c5.xlarge"},
    {"InstanceType": "m5.large"}
  ]
}
```

- **OnDemandBaseCapacity**: Số On-Demand cố định
- **OnDemandPercentageAboveBaseCapacity**: % On-Demand cho phần còn lại
- **SpotAllocationStrategy**: `capacity-optimized` hoặc `lowest-price`

---

## Instance Protection

Bảo vệ instances khỏi bị terminate:

- **Scale-in protection**: Không bị terminate khi scale in
- Không bảo vệ khỏi:
  - Manual termination
  - Health check failures
  - Spot interruption

---

## CloudWatch Metrics

Metrics mặc định (1 phút - không phí):

| Metric | Mô tả |
|--------|-------|
| `GroupMinSize` | Min capacity |
| `GroupMaxSize` | Max capacity |
| `GroupDesiredCapacity` | Desired capacity |
| `GroupInServiceInstances` | Số instances InService |
| `GroupPendingInstances` | Số instances Pending |
| `GroupTerminatingInstances` | Số instances Terminating |
| `GroupTotalInstances` | Tổng số instances |

---

## Tích hợp với ELB

```bash
# Attach ASG với Target Group
aws autoscaling attach-load-balancer-target-groups \
  --auto-scaling-group-name my-asg \
  --target-group-arns arn:aws:elasticloadbalancing:...
```

- ASG tự động register/deregister instances
- Dùng ELB health checks cho ASG
- Connection draining khi terminate

---

## Best Practices

1. **Dùng Launch Template** thay vì Launch Configuration
2. **Multi-AZ deployment** để high availability
3. **Target Tracking Scaling** là lựa chọn đầu tiên
4. **Kết hợp Predictive + Dynamic** scaling
5. **Warm Pools** cho apps boot chậm
6. **Instance Refresh** để update với zero downtime
7. **Mixed Instances** để tối ưu cost với Spot

---

## Liên kết

- [EC2](ec2.md) - Compute instances
- [ELB](elb.md) - Load Balancing
- [AMI](ami.md) - Machine Images cho Launch Template
- [VPC](vpc.md) - Networking và subnets
- [Load Balancing Patterns](load-balancing-patterns.md) - So sánh AWS vs K8s vs Spring Cloud (LB + Auto Scaling)
