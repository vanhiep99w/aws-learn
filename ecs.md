# Amazon ECS (Elastic Container Service)


## Mục lục

- [Tổng quan](#tổng-quan)
- [️ Kiến trúc ECS](#kiến-trúc-ecs)
- [Launch Types: EC2 vs Fargate](#launch-types-ec2-vs-fargate)
- [Network Modes](#network-modes)
- [ECS Service](#ecs-service)
- [Container Images & ECR](#container-images-ecr)
- [IAM Roles trong ECS](#iam-roles-trong-ecs)
- [Auto Scaling](#auto-scaling)
- [Secrets & Configuration](#secrets-configuration)
- [Logging](#logging)
- [Pricing: EC2 vs Fargate chi tiết](#pricing-ec2-vs-fargate-chi-tiết)
- [ECS vs EKS vs Fargate](#ecs-vs-eks-vs-fargate)
- [Hands-on Labs](#hands-on-labs)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Ví dụ: Thiết kế Microservices E-commerce](#ví-dụ-thiết-kế-microservices-e-commerce)
- [Tóm tắt](#tóm-tắt)

---

## Tổng quan

**Amazon ECS (Elastic Container Service)** là dịch vụ quản lý container được AWS quản lý hoàn toàn (fully managed). ECS giúp bạn chạy, dừng và quản lý Docker containers trên một cluster.

### Container là gì?

```
┌────────────────────────────────────────────────────────────┐
│                    VIRTUAL MACHINE                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   App A  │  │   App B  │  │   App C  │                  │
│  ├──────────┤  ├──────────┤  ├──────────┤                  │
│  │  Libs A  │  │  Libs B  │  │  Libs C  │                  │
│  ├──────────┤  ├──────────┤  ├──────────┤                  │
│  │ Guest OS │  │ Guest OS │  │ Guest OS │  ← Mỗi VM có OS  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Hypervisor (VMware, KVM)               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                    Host OS                          │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                      CONTAINERS                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   App A  │  │   App B  │  │   App C  │                  │
│  │ + Libs A │  │ + Libs B │  │ + Libs C │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Container Runtime (Docker)                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                Host OS (1 OS duy nhất!)             │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Tại sao dùng Containers?

| VM (Virtual Machine) | Container |
|---------------------|-----------|
| ❌ Khởi động chậm (phút) | ✅ Khởi động nhanh (giây) |
| ❌ Tốn nhiều resources | ✅ Nhẹ, chia sẻ OS kernel |
| ❌ Mỗi VM cần Guest OS | ✅ Không cần Guest OS |
| ❌ Image size lớn (GBs) | ✅ Image size nhỏ (MBs) |
| ✅ Isolation hoàn toàn | ⚠️ Isolation ít hơn |

### Tại sao cần ECS?

| Tự quản lý Docker | Amazon ECS |
|-------------------|------------|
| Phải setup Docker Swarm/K8s | AWS quản lý hoàn toàn |
| Tự scheduling containers | ECS tự động scheduling |
| Tự quản lý cluster | Cluster quản lý sẵn |
| Tự thiết lập load balancing | Tích hợp ALB/NLB |
| Tự cấu hình auto-scaling | Application Auto Scaling |

#### Giải thích chi tiết từng điểm:

---

**1. Phải setup Docker Swarm/K8s vs AWS quản lý hoàn toàn**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TỰ QUẢN LÝ (Docker Swarm/K8s)                    │
│                                                                     │
│   Bạn phải:                                                         │
│   ├── Cài đặt Docker trên từng server                               │
│   ├── Setup Swarm cluster hoặc K8s master/worker nodes              │
│   ├── Cấu hình network overlay (Flannel, Calico, Weave)             │
│   ├── Setup etcd cluster để lưu state                               │
│   ├── Cấu hình TLS certificates                                     │
│   ├── Monitor cluster health                                        │
│   └── Upgrade/patch cluster components                              │
│                                                                     │
│   ⏰ Thời gian setup: 2-5 ngày                                      │
│   👨‍💻 Yêu cầu: DevOps engineer có kinh nghiệm                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         AMAZON ECS                                  │
│                                                                     │
│   Bạn chỉ cần:                                                      │
│   └── aws ecs create-cluster --cluster-name my-cluster              │
│                                                                     │
│   ⏰ Thời gian setup: 5 phút                                        │
│   👨‍💻 Yêu cầu: Biết cơ bản về containers                             │
│                                                                     │
│   AWS lo phần còn lại:                                              │
│   ├── Control plane                                                 │
│   ├── State management                                              │
│   ├── API server                                                    │
│   └── Cluster coordination                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

**2. Tự scheduling containers vs ECS tự động scheduling**

**Scheduling** = Quyết định container nào chạy trên server nào.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TỰ SCHEDULING                               │
│                                                                     │
│  Bạn có 3 servers, mỗi server có resources khác nhau:               │
│                                                                     │
│  Server 1: 4 CPU, 8GB RAM (đang dùng 3 CPU, 6GB)                    │
│  Server 2: 2 CPU, 4GB RAM (đang dùng 0.5 CPU, 1GB)                  │
│  Server 3: 4 CPU, 16GB RAM (đang dùng 4 CPU, 14GB)                  │
│                                                                     │
│  → Bạn muốn deploy container cần 1 CPU, 2GB RAM                     │
│  → Bạn phải TỰ kiểm tra server nào có đủ resources                  │
│  → Nếu Server 3 đầy, bạn phải đổi sang Server 1/2                   │
│  → Phải viết logic để handle failures, retries                      │
│                                                                     │
│  ❌ Prone to human error                                            │
│  ❌ Khó scale khi có 50+ servers                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       ECS SCHEDULER                                 │
│                                                                     │
│  ECS tự động:                                                       │
│  ├── Track resources của tất cả instances                           │
│  ├── Tìm instance phù hợp nhất (bin packing)                        │
│  ├── Handle constraints (AZ, instance type, custom)                 │
│  ├── Retry nếu placement fail                                       │
│  └── Rebalance khi cần                                              │
│                                                                     │
│  Placement Strategies:                                              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   BINPACK    │  │   SPREAD     │  │   RANDOM     │               │
│  │              │  │              │  │              │               │
│  │ Tối ưu cost  │  │ Tối ưu HA    │  │ Đơn giản     │               │
│  │ Pack đầy 1   │  │ Spread đều   │  │ Chọn random  │               │
│  │ server trước │  │ các AZs      │  │              │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                     │
│  ✅ Tự động, không cần can thiệp                                    │
│  ✅ Scale tới hàng ngàn containers                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ Placement Strategy:**

```bash
# Spread tasks across Availability Zones (HA)
aws ecs create-service \
  --placement-strategy type=spread,field=attribute:ecs.availability-zone

# Pack tasks to minimize EC2 instances (cost)
aws ecs create-service \
  --placement-strategy type=binpack,field=memory
```

---

**3. Tự quản lý cluster vs Cluster quản lý sẵn**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TỰ QUẢN LÝ CLUSTER                               │
│                                                                     │
│  Khi 1 server chết:                                                 │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  1. Monitor alert (bạn phải setup monitoring trước)        │     │
│  │  2. SSH vào server để debug (nếu còn access được)          │     │
│  │  3. Quyết định: repair hay replace?                        │     │
│  │  4. Nếu replace:                                           │     │
│  │     a. Provision server mới                                │     │
│  │     b. Cài Docker                                          │     │
│  │     c. Join vào cluster                                    │     │
│  │     d. Migrate containers                                  │     │
│  │  5. Remove server cũ khỏi cluster                          │     │
│  │  6. Update DNS/LB nếu cần                                  │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ⏰ Thời gian: 30 phút - vài giờ                                    │
│  🚨 Có thể xảy ra lúc 3 giờ sáng!                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     ECS MANAGED CLUSTER                             │
│                                                                     │
│  Với Fargate:                                                       │
│  └── Không có server để quản lý! AWS lo tất cả.                     │
│                                                                     │
│  Với EC2 + ECS:                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  1. ECS detect container instance unhealthy                │     │
│  │  2. Tasks được reschedule sang instance khác TỰ ĐỘNG       │     │
│  │  3. Auto Scaling Group thay thế instance mới               │     │
│  │  4. Instance mới tự động join cluster (ECS Agent)          │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ⏰ Thời gian: 1-5 phút (tự động)                                   │
│  😴 Bạn có thể tiếp tục ngủ!                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

**4. Tự thiết lập load balancing vs Tích hợp ALB/NLB**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TỰ SETUP LOAD BALANCING                          │
│                                                                     │
│  Bạn phải:                                                          │
│  ├── Setup HAProxy/Nginx làm load balancer                          │
│  ├── Cấu hình health checks                                         │
│  ├── Update config mỗi khi container start/stop                     │
│  ├── Handle SSL termination                                         │
│  └── Setup HA cho chính load balancer                               │
│                                                                     │
│  Vấn đề với Dynamic Ports:                                          │
│  ┌──────────────────────────────────────────────────┐               │
│  │  Container 1: host:32768 → container:80          │               │
│  │  Container 2: host:32769 → container:80          │               │
│  │  Container 3: host:32770 → container:80          │               │
│  │                                                  │               │
│  │  → Port thay đổi mỗi lần deploy!                 │               │
│  │  → Phải update LB config liên tục                │               │
│  │  → Thường dùng Service Discovery (Consul, etc)   │               │
│  └──────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ECS + ALB INTEGRATION                            │
│                                                                     │
│         ┌─────────────────────────────────────┐                     │
│         │     Application Load Balancer       │                     │
│         │     (AWS managed, HA by default)    │                     │
│         └───────────────┬─────────────────────┘                     │
│                        │                                            │
│         ┌───────────────┼───────────────┐                           │
│         ▼               ▼               ▼                           │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐                        │
│    │ Task 1  │    │ Task 2  │    │ Task 3  │                        │
│    │ :32768  │    │ :32769  │    │ :32770  │                        │
│    └─────────┘    └─────────┘    └─────────┘                        │
│                                                                     │
│  ECS tự động:                                                       │
│  ├── Register task vào Target Group khi start                       │
│  ├── Deregister khi task stop                                       │
│  ├── Handle dynamic ports (ECS biết port mapping)                   │
│  ├── Connection draining trước khi remove                           │
│  └── Health check integration                                       │
│                                                                     │
│  ✅ Zero manual intervention!                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ cấu hình:**

```json
// Service Definition với Load Balancer
{
  "serviceName": "my-service",
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:...:targetgroup/my-tg/xxx",
      "containerName": "my-app",
      "containerPort": 80
    }
  ],
  "healthCheckGracePeriodSeconds": 60
}
```

---

**5. Tự cấu hình auto-scaling vs Application Auto Scaling**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TỰ SETUP AUTO SCALING                            │
│                                                                     │
│  Bạn phải viết custom solution:                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  1. Collect metrics (Prometheus, custom scripts)             │   │
│  │  2. Viết scaling logic:                                      │   │
│  │     if cpu > 70%:                                            │   │
│  │         spawn_more_containers()                              │   │
│  │     if cpu < 30%:                                            │   │
│  │         terminate_containers()                               │   │
│  │  3. Handle cooldown periods                                  │   │
│  │  4. Prevent thrashing (scale up/down liên tục)               │   │
│  │  5. Implement min/max limits                                 │   │
│  │  6. Scale servers (nếu hết capacity)                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ❌ Phức tạp, dễ bugs                                               │
│  ❌ Không scale đủ nhanh                                            │
│  ❌ Có thể scale sai (over/under provision)                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                 ECS + APPLICATION AUTO SCALING                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    CloudWatch                                │   │
│  │        ┌─────────────────────────────────────┐               │   │
│  │        │  ECSServiceAverageCPUUtilization    │               │   │
│  │        │         Current: 75%                │               │   │
│  │        │         Target: 70%                 │               │   │
│  │        └─────────────────┬───────────────────┘               │   │
│  │                          │                                   │   │
│  │                          ▼                                   │   │
│  │        ┌─────────────────────────────────────┐               │   │
│  │        │    Application Auto Scaling          │              │   │
│  │        │    Action: Scale Out                 │              │   │
│  │        └─────────────────┬───────────────────┘               │   │
│  │                          │                                   │   │
│  │                          ▼                                   │   │
│  │        ┌─────────────────────────────────────┐               │   │
│  │        │    ECS Service                       │              │   │
│  │        │    Desired: 3 → 4 tasks             │               │   │
│  │        └─────────────────────────────────────┘               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Các loại scaling policies:                                         │
│                                                                     │
│  1. Target Tracking (set-and-forget):                               │
│     "Giữ CPU ở mức 70%"                                             │
│                                                                     │
│  2. Step Scaling (chi tiết hơn):                                    │
│     CPU 70-80%: +1 task                                             │
│     CPU 80-90%: +2 tasks                                            │
│     CPU > 90%: +4 tasks                                             │
│                                                                     │
│  3. Scheduled Scaling:                                              │
│     9 AM: Scale to 10 tasks (giờ cao điểm)                          │
│     6 PM: Scale to 3 tasks (giờ thấp điểm)                          │
│                                                                     │
│  ✅ AWS đã test và tối ưu                                           │
│  ✅ Integrate seamlessly với ECS                                    │
│  ✅ Predictive scaling (ML-based)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ cấu hình Target Tracking:**

```bash
# Đăng ký scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/my-cluster/my-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Tạo scaling policy (Target Tracking)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/my-cluster/my-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu70-target-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'
```

---

### Tóm tắt: Tự quản lý vs ECS

| Công việc | Tự quản lý | ECS |
|-----------|-----------|-----|
| Setup cluster | 2-5 ngày | 5 phút |
| Scheduling | Code custom | Built-in |
| Server failure | Manual response | Auto heal |
| Load balancing | DIY + maintain | 1 config |
| Auto scaling | Custom scripts | Policy config |
| **Total DevOps effort** | **Cao** | **Thấp** |

> 💡 **Kết luận**: ECS cho phép bạn tập trung vào **application code** thay vì **infrastructure management**. Đặc biệt với **Fargate**, bạn không cần quan tâm đến servers nữa!

---

## Kiến trúc ECS

### Các thành phần chính

```
┌─────────────────────────────────────────────────────────────┐
│                        ECS CLUSTER                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    ECS SERVICE                      │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │  │  TASK    │  │  TASK    │  │  TASK    │           │    │
│  │  │┌────────┐│  │┌────────┐│  │┌────────┐│           │    │
│  │  ││Container││  ││Container││  ││Container││        │    │
│  │  │└────────┘│  │└────────┘│  │└────────┘│           │    │
│  │  └──────────┘  └──────────┘  └──────────┘           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐       │
│  │ Container Instance 1  │  │ Container Instance 2  │       │
│  │ (EC2 hoặc Fargate)    │  │ (EC2 hoặc Fargate)    │       │
│  └───────────────────────┘  └───────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. Cluster (Cụm)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           ECS CLUSTER                               │
│                                                                     │
│   = Một "nhóm logic" để quản lý tất cả resources ECS                │
│                                                                     │
│   Ví von: Cluster giống như 1 CÔNG TY                               │
│   - Công ty có nhiều phòng ban (Services)                           │
│   - Mỗi phòng ban có nhiều nhân viên (Tasks)                        │
│   - Công ty thuê văn phòng (EC2) hoặc coworking space (Fargate)     │
│                                                                     │
│   Trong 1 cluster có:                                               │
│   ├── Nhiều Services                                                │
│   ├── Nhiều Tasks                                                   │
│   ├── Compute resources (EC2 hoặc Fargate)                          │
│   └── Configs, settings chung                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Khi nào tạo nhiều clusters?**
- Môi trường khác nhau: `dev-cluster`, `staging-cluster`, `prod-cluster`
- Projects tách biệt hoàn toàn
- Regions khác nhau

---

### 2. Task Definition (Bản thiết kế)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TASK DEFINITION                              │
│                                                                     │
│   = BẢN THIẾT KẾ / BLUEPRINT để tạo container                       │
│   = Giống như "công thức nấu ăn"                                    │
│                                                                     │
│   Task Definition KHÔNG PHẢI là container đang chạy!                │
│   Nó chỉ MÔ TẢ cách tạo container.                                  │
│                                                                     │
│   Một Task Definition bao gồm:                                      │
│   ├── Image nào? (nginx:latest, my-app:v1.2.3)                      │
│   ├── Cần bao nhiêu CPU, Memory?                                    │
│   ├── Port mapping? (host:80 → container:80)                        │
│   ├── Environment variables?                                        │
│   ├── Secrets? (password từ Secrets Manager)                        │
│   ├── Logging config? (CloudWatch)                                  │
│   ├── Volume mounts?                                                │
│   └── IAM roles?                                                    │
│                                                                     │
│   Versioned: my-app:1, my-app:2, my-app:3 (revisions)               │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ Task Definition JSON:**
```json
{
  "family": "my-web-app",
  "cpu": "256",
  "memory": "512",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "nginx",
      "image": "nginx:1.21",
      "portMappings": [
        { "containerPort": 80 }
      ],
      "environment": [
        { "name": "ENV", "value": "production" }
      ],
      "secrets": [
        { "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..." }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-web-app"
        }
      }
    }
  ]
}
```

---

### 3. Task (Công việc đang chạy)

```
┌─────────────────────────────────────────────────────────────────────┐
│                             TASK                                    │
│                                                                     │
│   = INSTANCE của Task Definition đang chạy                          │
│   = Container(s) thực sự đang chạy                                  │
│                                                                     │
│   Ví von:                                                           │
│   - Task Definition = Công thức pizza                               │
│   - Task = Chiếc pizza thật đang được làm/ăn                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1 Task có thể chứa NHIỀU Containers!

```
TRƯỜNG HỢP 1: 1 Task = 1 Container (phổ biến nhất - 90%)
┌─────────────────────────────────────────────┐
│                  TASK                       │
│   ┌─────────────────────────────────────┐   │
│   │         Container: user-api         │   │
│   │         (Node.js app)               │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

TRƯỜNG HỢP 2: 1 Task = NHIỀU Containers (sidecar pattern)
┌─────────────────────────────────────────────┐
│                  TASK                       │
│   ┌─────────────────┐  ┌─────────────────┐  │
│   │  Container 1:   │  │  Container 2:   │  │
│   │  nginx          │  │  app            │  │
│   │  (reverse proxy)│  │  (Python Flask) │  │
│   └─────────────────┘  └─────────────────┘  │
│                                             │
│   Cả 2 chia sẻ:                             │
│   - Network (gọi nhau qua localhost)        │
│   - Storage volumes                         │
│   - Lifecycle (sống chết cùng nhau)         │
└─────────────────────────────────────────────┘
```

**Khi nào dùng nhiều containers trong 1 Task?**
| Pattern | Ví dụ |
|---------|-------|
| **Sidecar** | App + Log collector |
| **Reverse Proxy** | Nginx + Python app |
| **Service Mesh** | Envoy + Your app |

> ⚠️ **Lưu ý**: Containers trong cùng Task **KHÔNG THỂ scale riêng** - cả nhóm scale cùng nhau!

---

### 4. Service (Dịch vụ)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVICE                                   │
│                                                                     │
│   = Đảm bảo số lượng Tasks mong muốn LUÔN CHẠY                      │
│   = "Supervisor" giám sát Tasks                                     │
│                                                                     │
│   Service nói: "Tôi muốn luôn có 3 tasks chạy"                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│   │  Task 1  │  │  Task 2  │  │  Task 3  │                          │
│   │ RUNNING  │  │ RUNNING  │  │ RUNNING  │                          │
│   └──────────┘  └──────────┘  └──────────┘                          │
│                                                                     │
│   Nếu Task 2 chết:                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│   │  Task 1  │  │  Task 2  │  │  Task 4  │ ← Service tự tạo mới!    │
│   │ RUNNING  │  │  DEAD ❌ │  │ RUNNING  │                          │
│   └──────────┘  └──────────┘  └──────────┘                          │
│                                                                     │
│   Service làm gì?                                                   │
│   ├── Duy trì số lượng tasks (desired count)                        │
│   ├── Tự động restart tasks bị crash                                │
│   ├── Kết nối với Load Balancer                                     │
│   ├── Rolling deployments (cập nhật từ từ)                          │
│   ├── Health checks                                                 │
│   └── Auto scaling                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Task vs Service:**
| Task | Service |
|------|---------|
| Chạy 1 lần rồi kết thúc | Chạy liên tục, tự restart |
| Batch jobs, cron jobs | Web servers, APIs |
| Manually start/stop | Tự động maintain |

---

### 5. Container Instance (Chỉ với EC2 Launch Type)

```
┌──────────────────────────────────────────────────────────────────────┐
│                      CONTAINER INSTANCE                              │
│                                                                      │
│   = EC2 instance đã đăng ký với ECS cluster                          │
│   = Máy chủ thật chạy containers                                     │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                   EC2 Instance                              │    │
│   │  ┌──────────────────────────────────────────────────────┐    │   │
│   │  │  ECS Agent (chạy sẵn trong ECS-optimized AMI)        │    │   │
│   │  │  - Giao tiếp với ECS control plane                   │    │   │
│   │  │  - Nhận lệnh start/stop containers                   │    │   │
│   │  │  - Báo cáo resource usage                            │    │   │
│   │  └──────────────────────────────────────────────────────┘    │   │
│   │                                                             │    │
│   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │   │
│   │  │ Container 1 │ │ Container 2 │ │ Container 3 │             │   │
│   │  └─────────────┘ └─────────────┘ └─────────────┘             │   │
│   │                                                             │    │
│   │  Docker daemon, OS, etc.                                    │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ⚠️ Fargate KHÔNG có Container Instance - AWS quản lý hết!          │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Tổng kết quan hệ các thành phần

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLUSTER                                   │
│    = Công ty / Tổ chức                                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        SERVICE A                              │  │
│  │    = Phòng ban (luôn duy trì X nhân viên)                     │  │
│  │                                                               │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │  │
│  │  │ Task 1  │  │ Task 2  │  │ Task 3  │   = Nhân viên          │  │
│  │  └─────────┘  └─────────┘  └─────────┘                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        SERVICE B                              │  │
│  │  ┌─────────┐  ┌─────────┐                                     │  │
│  │  │ Task 1  │  │ Task 2  │                                     │  │
│  │  └─────────┘  └─────────┘                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  TASK DEFINITION = Hướng dẫn tạo Task (blueprint)                   │
│  CONTAINER INSTANCE = Văn phòng (EC2) - nơi làm việc                │
└─────────────────────────────────────────────────────────────────────┘
```

| Thành phần | Ví von | Mô tả |
|------------|--------|-------|
| **Cluster** | Công ty | Nhóm logic quản lý mọi thứ |
| **Task Definition** | Bản mô tả công việc | Blueprint để tạo container |
| **Task** | Nhân viên đang làm việc | Container(s) đang chạy |
| **Service** | Phòng ban | Đảm bảo luôn có đủ Tasks |
| **Container Instance** | Văn phòng | EC2 chạy containers |

---

## Launch Types: EC2 vs Fargate

### Tại sao ECS cần EC2 hoặc Fargate? Mỗi cái làm gì?

> **Điểm quan trọng cần hiểu**: 
> - ECS là **bộ não điều khiển** (không có CPU/RAM)
> - EC2/Fargate là **cơ bắp thực thi** (có CPU/RAM thật)
> - Container = chương trình → cần MÁY THẬT để chạy!
> - **Không có EC2/Fargate = ECS không thể chạy container nào cả!**

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ECS (Orchestrator)                         │
│                       🧠 "BỘ NÃO ĐIỀU KHIỂN"                        │
│                                                                     │
│   ECS LÀM:                                                          │
│   ├── Quyết định container chạy ở đâu (scheduling)                  │
│   ├── Ra lệnh khởi động/dừng containers                             │
│   ├── Theo dõi health của containers                                │
│   ├── Tự động restart container nếu chết                            │
│   ├── Scale số lượng containers lên/xuống                           │
│   └── Kết nối containers với Load Balancer                          │
│                                                                     │
│   ECS KHÔNG LÀM:                                                    │
│   ├── ❌ Cung cấp CPU/RAM để chạy containers                        │
│   └── ❌ Thực sự "chạy" container processes                         │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ ECS ra lệnh: "Chạy container này!"
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EC2 (Compute Resources)                         │
│                        💪 "CƠ BẮP THỰC THI"                         │
│                                                                     │
│   EC2 LÀM:                                                          │
│   ├── Cung cấp CPU, RAM, Disk vật lý                                │
│   ├── Chạy Docker daemon (container runtime)                        │
│   ├── Thực sự execute container processes                           │
│   └── Cung cấp network interface cho containers                     │
│                                                                     │
│   EC2 KHÔNG LÀM:                                                    │
│   ├── ❌ Biết nên chạy container nào (chờ lệnh từ ECS)              │
│   ├── ❌ Tự động scale containers                                   │
│   └── ❌ Quyết định logic deployment                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 🍕 Ví dụ: Tiệm Pizza

| Vai trò | Trong tiệm Pizza | Trong AWS |
|---------|------------------|-----------|
| **Manager** | Nhận order, phân công thợ làm pizza nào | **ECS** (Orchestrator) |
| **Thợ làm bánh** | Thực sự nhào bột, nướng bánh | **EC2** (Compute) |
| **Pizza** | Sản phẩm được tạo ra | **Container** (App) |
| **Công thức** | Hướng dẫn làm pizza | **Task Definition** |

**Nếu chỉ có Manager (ECS), không có Thợ (EC2)**:
```
Manager: "Làm 5 pizza Margherita!"
...
...
Không ai làm 😅 → Cần có thợ (EC2/Fargate) để thực hiện!
```

**Nếu chỉ có Thợ (EC2), không có Manager (ECS)**:
```
Thợ: "Tôi có tay, có lò nướng... nhưng làm pizza nào?"
Thợ: "Ai order? Bao nhiêu cái? Loại gì?"
→ Cần có manager (ECS) để điều phối!
```

### Vậy 2 Launch Types là gì?

**Launch Type = Cách bạn cung cấp "thợ làm bánh" cho ECS**

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ECS CLUSTER                                  │
│                     (Manager/Orchestrator)                           │
│                                                                      │
│                              │                                       │
│          ┌───────────────────┴───────────────────┐                   │
│          ▼                                       ▼                   │
│  ┌───────────────────┐                ┌────────────────────┐         │
│  │  EC2 LAUNCH TYPE  │                │ FARGATE LAUNCH TYPE│         │
│  │                   │                │                    │         │
│  │  Bạn thuê EC2     │                │  AWS cung cấp      │         │
│  │  instances và     │                │  compute ẩn danh   │         │
│  │  đăng ký với ECS  │                │  tự động           │         │
│  │                   │                │                    │         │
│  │  🏠 Thuê nhà      │                │  🏨 Ở khách sạn    │         │
│  │  (tự lo mọi thứ)  │                │  (họ lo tất cả)    │         │
│  └───────────────────┘                └────────────────────┘         │
└──────────────────────────────────────────────────────────────────────┘
```

| | EC2 Launch Type | Fargate Launch Type |
|--|-----------------|---------------------|
| **Ai cung cấp máy?** | Bạn tạo EC2 instances | AWS tự động cung cấp |
| **Bạn thấy servers?** | ✅ Có, SSH được | ❌ Không thấy, serverless |
| **Ví von** | Thuê nhà, tự quản lý | Ở khách sạn, họ lo hết |

### So sánh tổng quan

```
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│           EC2 LAUNCH TYPE             │  │         FARGATE LAUNCH TYPE           │
│         "Thuê nhà riêng"              │  │          "Ở khách sạn"                │
│                                        │  │                                        │
│  ┌────────────────────────────────┐   │  │  ┌────────────────────────────────┐   │
│  │      BẠN QUẢN LÝ                │   │  │      AWS QUẢN LÝ                  │   │
│  │  ┌──────────────────────────┐  │   │  │  ┌──────────────────────────┐    │   │
│  │  │ EC2 Instances            │  │   │  │  │ Compute Resources        │    │   │
│  │  │ - Provisioning           │  │   │  │  │ (Serverless containers)  │    │   │
│  │  │ - Scaling                │  │   │  │  └──────────────────────────┘    │   │
│  │  │ - Patching               │  │   │  └────────────────────────────────┘   │
│  │  │ - AMI updates            │  │   │                                        │
│  │  └──────────────────────────┘  │   │  ┌────────────────────────────────┐   │
│  └────────────────────────────────┘   │  │      BẠN QUẢN LÝ                │   │
│                                        │  │  - Task Definitions              │   │
│  Bạn: Trả tiền EC2 + quản lý servers  │  │  - Container images              │   │
│                                        │  │  - Application code              │   │
│                                        │  └────────────────────────────────┘   │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

### So sánh chi tiết

| Tiêu chí | EC2 Launch Type | Fargate Launch Type |
|----------|-----------------|---------------------|
| **Quản lý server** | Bạn quản lý EC2 | AWS quản lý |
| **Pricing** | Trả tiền EC2 instances | Trả theo vCPU + Memory sử dụng |
| **Scaling** | Phải scale EC2 + Tasks | Chỉ scale Tasks |
| **Control** | Full control (SSH, AMI) | Ít control hơn |
| **Patching** | Bạn patch OS | AWS lo |
| **GPU support** | ✅ Có | ❌ Không |
| **Persistent storage** | ✅ EBS volumes | ⚠️ Ephemeral (có EFS) |
| **Startup time** | Nhanh hơn (EC2 sẵn) | Chậm hơn 1-2 phút |
| **Use case** | Workloads ổn định, GPU | Variable workloads, dev/test |

### Khi nào dùng EC2 vs Fargate?

| Sử dụng EC2 khi | Sử dụng Fargate khi |
|-----------------|---------------------|
| Cần GPU/special hardware | Không muốn quản lý servers |
| Workload ổn định, dự đoán được | Workload biến động |
| Cần SSH debug | Startup, MVP, nhanh chóng |
| Có Reserved Instances | Không muốn lo capacity |
| Cần tận dụng Spot Instances | Development, testing |

### Khi hết resources thì sao?

#### Với EC2 Launch Type:

```
Bạn có 2 EC2, mỗi cái 4 CPU, 8GB RAM
Đang chạy 8 containers (mỗi cái 1 CPU, 2GB)
→ HẾT CHỖ!

ECS: "Tôi cần chạy Container #9"
     → Không có EC2 nào còn resources
     → Container #9 bị PENDING... mãi mãi ❌

Giải pháp: Setup Capacity Provider + Auto Scaling Group
→ Tự động tạo thêm EC2 khi cần
→ Tự động xóa EC2 khi không cần
```

| Trạng thái | Không có Auto Scaling | Có Auto Scaling (Capacity Provider) |
|------------|----------------------|-------------------------------------|
| Hết resources | Task PENDING mãi | Tự động tạo EC2 mới → Task chạy |
| Dư resources | Vẫn trả tiền EC2 | Tự động terminate EC2 thừa |

#### Với Fargate Launch Type:

```
Bạn đang chạy 8 containers
ECS: "Tôi cần chạy Container #9"
AWS Fargate: "OK! Tôi tự tìm compute và chạy ngay!" ✅

→ Container #9 chạy trong 1-2 phút
→ KHÔNG CẦN lo capacity
→ AWS có "vô hạn" resources (từ góc nhìn của bạn)
```

| So sánh | EC2 (không Auto Scaling) | EC2 (có Auto Scaling) | Fargate |
|---------|--------------------------|----------------------|---------|
| **Hết resources** | ❌ Task PENDING | ⏳ Chờ EC2 mới (3-5 phút) | ✅ Chạy ngay (1-2 phút) |
| **Cấu hình** | Không cần | Phải setup ASG + Capacity Provider | Không cần |
| **Độ phức tạp** | Thấp | Cao | Thấp |

---

## Network Modes

### 4 Network Modes trong ECS

```
┌─────────────────────────────────────────────────────────────┐
│                    1. awsvpc MODE                           │
│         (Recommended cho Fargate và EC2)                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    VPC                              │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │    │
│  │  │   Task 1   │  │   Task 2   │  │   Task 3   │     │    │
│  │  │ ENI: 10.0.1.5│ │ ENI: 10.0.1.6│ │ ENI: 10.0.1.7│ │    │
│  │  └────────────┘  └────────────┘  └────────────┘     │    │
│  │       ▲              ▲              ▲               │    │
│  │       └──────────────┴──────────────┘               │    │
│  │              Mỗi task có ENI riêng                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ✅ Mỗi task có Private IP riêng                            │
│  ✅ Security Groups ở task level                            │
│  ✅ REQUIRED cho Fargate                                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    2. bridge MODE                            │
│              (Default cho EC2 Linux)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              EC2 Instance (docker0 bridge)          │     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │    │
│  │  │ Container 1│  │ Container 2│  │ Container 3│      │    │
│  │  │  Port 8080 │  │  Port 8081 │  │  Port 8082 │      │    │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘      │    │
│  │        └───────────────┼───────────────┘             │    │
│  │                   Docker Bridge                     │     │
│  │                        │                             │    │
│  │              EC2 ENI: 10.0.1.5                      │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ⚠️ Containers chia sẻ ENI của EC2                           │
│  ⚠️ Dynamic port mapping                                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    3. host MODE                              │
│                 (EC2 Linux only)                             │
│                                                              │
│  Container dùng trực tiếp network stack của EC2              │
│  Không có port mapping, container port = host port           │
│                                                              │
│  ⚠️ Chỉ 1 task/port/instance                                 │
│  ⚠️ Không có network isolation                               │
│  ✅ Performance tốt nhất                                     │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    4. none MODE                             │
│                                                             │
│  Container không có external network connectivity           │
│  Chỉ có loopback interface                                  │
└─────────────────────────────────────────────────────────────┘
```

### Chọn Network Mode nào?

| Mode | Use Case |
|------|----------|
| **awsvpc** | Mặc định cho Fargate, recommended cho EC2 mới |
| **bridge** | Legacy EC2, khi cần dynamic port mapping |
| **host** | Maximum performance, single task per port |
| **none** | Batch jobs không cần network |

### Network Mode vs Security Group

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   NETWORK MODE = LÀM SAO để container CÓ ĐƯỢC địa chỉ mạng?         │
│   (Giống như: Máy tính được cắm dây mạng kiểu gì?)                  │
│                                                                     │
│   SECURITY GROUP = AI ĐƯỢC PHÉP gửi/nhận request?                   │
│   (Giống như: Bảo vệ cho ai vào, ai không cho vào)                  │
│                                                                     │
│   → Cả 2 làm việc CÙNG NHAU, không thay thế nhau!                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 🔌 awsvpc chi tiết: EC2 có NHIỀU ENIs

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EC2 INSTANCE                                │
│                                                                     │
│   EC2 có IP chính: 10.0.1.100 (Primary ENI - eth0)                  │
│                                                                     │
│   Với awsvpc, mỗi Task được gắn thêm ENI riêng!                     │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │  Primary ENI (eth0)     │  10.0.1.100  │ EC2 management   │     │
│   ├───────────────────────────────────────────────────────────┤     │
│   │  Task 1 ENI (eth1)      │  10.0.1.5    │ ← Task 1 dùng    │     │
│   ├───────────────────────────────────────────────────────────┤     │
│   │  Task 2 ENI (eth2)      │  10.0.1.8    │ ← Task 2 dùng    │     │
│   ├───────────────────────────────────────────────────────────┤     │
│   │  Task 3 ENI (eth3)      │  10.0.1.12   │ ← Task 3 dùng    │     │
│   └───────────────────────────────────────────────────────────┘     │
│                                                                     │
│   → Mỗi Task có "card mạng" riêng, IP riêng!                        │
│   → Traffic ĐI THẲNG đến Task, KHÔNG qua IP chính của EC2!          │
└─────────────────────────────────────────────────────────────────────┘
```

### Traffic đi như thế nào với awsvpc?

```
     ALB
      │
      │ Request đến 10.0.1.5:3000
      │
      ▼
┌─────────────────────────────────────────────────────────────────────┐
│   EC2 Instance (10.0.1.100) ← KHÔNG đi qua IP này!                  │
│                                                                     │
│   ┌──────────────────┐                                              │
│   │ Task 1           │ ← Traffic đi THẲNG vào ENI của Task 1        │
│   │ ENI: 10.0.1.5    │                                              │
│   │ Port: 3000       │                                              │
│   └──────────────────┘                                              │
│                                                                     │
│   ┌──────────────────┐                                              │
│   │ Task 2           │                                              │
│   │ ENI: 10.0.1.8    │                                              │
│   └──────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Task gọi Task trên cùng EC2

```
Task 1 (10.0.1.5) gọi Task 2 (10.0.1.8) trên CÙNG EC2:

┌─────────────────────────────────────────────────────────────────────┐
│   EC2 Instance                                                      │
│                                                                     │
│   Task 1 (10.0.1.5)  ────────────────────►  Task 2 (10.0.1.8)       │
│                                                                     │
│   → Traffic đi qua VPC network layer                                │
│   → KHÔNG cần đi qua EC2's primary IP (10.0.1.100)                  │
│   → Giống như 2 máy tính riêng biệt trong cùng mạng LAN             │
└─────────────────────────────────────────────────────────────────────┘
```

### Tại sao awsvpc + Security Group quan trọng?

```
VỚI BRIDGE MODE:
┌─────────────────────────────────────────────────────────────────────┐
│   EC2 có 1 Security Group chung cho TẤT CẢ containers               │
│   ├── Container A (web) - cần port 80                               │
│   ├── Container B (admin) - chỉ internal                            │
│   └── → Không thể kiểm soát riêng từng container ❌                 │
└─────────────────────────────────────────────────────────────────────┘

VỚI AWSVPC MODE:
┌─────────────────────────────────────────────────────────────────────┐
│   Mỗi Task có ENI riêng → có Security Group riêng!                  │
│   ├── Task A (web): SG cho phép port 80 từ ALB                      │
│   ├── Task B (admin): SG chỉ cho phép từ VPN                        │
│   └── → Kiểm soát riêng từng task ✅                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Giới hạn: Số ENI trên mỗi EC2

| Instance Type | Max ENIs | Max Tasks (awsvpc) |
|---------------|----------|-------------------|
| t3.micro | 2 | 1 task |
| t3.small | 3 | 2 tasks |
| t3.medium | 3 | 2 tasks |
| m5.large | 3 | 2 tasks |
| m5.xlarge | 4 | 3 tasks |

> 💡 **Fargate không có vấn đề này** - AWS quản lý compute, không giới hạn ENI!

---

## ECS Service

### Service là gì?

Service đảm bảo số lượng tasks mong muốn luôn chạy:

```
┌─────────────────────────────────────────────────────────────┐
│                      ECS SERVICE                            │
│                                                             │
│  Desired Count: 3                                           │
│  Running Count: 3 ✅                                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Task 1  │  │  Task 2  │  │  Task 3  │                   │
│  │ RUNNING  │  │ RUNNING  │  │ RUNNING  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                             │
│  Nếu Task 2 chết:                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Task 1  │  │  Task 2  │  │  Task 4  │ ← Service tự tạo  │
│  │ RUNNING  │  │  DEAD ❌ │  │ RUNNING  │   task mới!       │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Service Scheduler Types

| Type | Mô tả |
|------|-------|
| **REPLICA** | Duy trì số lượng tasks cố định |
| **DAEMON** | Một task trên mỗi container instance (EC2 only) |

### Service Load Balancing

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   Application Load Balancer                 │
│                         │                                   │
│              ┌───────────┼───────────┐                      │
│              ▼           ▼           ▼                      │
│        ┌──────────┐┌──────────┐┌──────────┐                 │
│        │  Task 1  ││  Task 2  ││  Task 3  │                 │
│        │ Port 80  ││ Port 80  ││ Port 80  │                 │
│        └──────────┘└──────────┘└──────────┘                 │
│                                                             │
│  ✅ Health checks tự động                                   │
│  ✅ Deregister unhealthy tasks                              │
│  ✅ Session stickiness (nếu cần)                            │
└─────────────────────────────────────────────────────────────┘
```

#### ECS tự động quản lý Load Balancer:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ALB + ECS INTEGRATION                            │
│                                                                     │
│   ALB                    Target Group: user-service-tg              │
│   ┌─────────────┐       ┌─────────────────────────────────────────┐ │
│   │             │       │  Targets (ECS tự động cập nhật):        │ │
│   │  Listener   │──────►│  ├── 10.0.1.5:3000 (Task 1) ✅ healthy  │ │
│   │  :80        │       │  ├── 10.0.2.8:3000 (Task 2) ✅ healthy  │ │
│   │             │       │  └── 10.0.1.12:3000 (Task 3) ✅ healthy │ │
│   └─────────────┘       └─────────────────────────────────────────┘ │
│                                                                     │
│   🔄 Khi scale up (thêm Task 4):                                    │
│   - ECS tự động đăng ký Task 4 vào Target Group                     │
│   - ALB bắt đầu gửi traffic đến Task 4                              │
│                                                                     │
│   🔄 Khi Task 2 chết:                                               │
│   - Health check fail → ALB ngừng gửi traffic                       │
│   - ECS hủy đăng ký Task 2 khỏi Target Group                        │
│   - ECS tạo Task mới thay thế                                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Cấu hình Service với Load Balancer:

```json
{
  "serviceName": "user-service",
  "taskDefinition": "user-service:15",
  "desiredCount": 3,
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:...:targetgroup/user-tg/xxx",
      "containerName": "user-api",
      "containerPort": 3000
    }
  ],
  "healthCheckGracePeriodSeconds": 60
}
```

> **Lưu ý**: `healthCheckGracePeriodSeconds` cho phép task thời gian khởi động trước khi health check bắt đầu.

### Deployment Strategies

| Strategy | Mô tả | Use case |
|----------|-------|----------|
| **Rolling Update** | Thay thế tasks dần dần | Default, zero-downtime |
| **Blue/Green** | Chuyển traffic giữa 2 environments | Production, rollback nhanh |

#### Rolling Update Parameters

```
minimumHealthyPercent: 50   ← Ít nhất 50% tasks phải healthy
maximumPercent: 200         ← Có thể chạy tối đa 200% tasks
```

```
Desired: 4 tasks, min: 50%, max: 200%

Step 1: Đang chạy 4 tasks (v1)
Step 2: Tạo thêm 4 tasks (v2) → 8 tasks (200%)
Step 3: Stop 4 tasks v1
Step 4: Còn 4 tasks v2 ✅
```

### 🏢 High Availability & Multi-AZ

ECS hỗ trợ **High Availability** bằng cách spread tasks qua nhiều AZs và EC2 instances:

```
┌─────────────────────────────────────────────────────────────────────┐
│                              VPC                                    │
│                                                                     │
│  ┌─────────────────────────────┐   ┌─────────────────────────────┐  │
│  │     Availability Zone A     │   │     Availability Zone B     │  │
│  │                             │   │                             │  │
│  │   ┌──────────────────────┐  │   │   ┌──────────────────────┐  │  │
│  │   │   EC2 Instance #1    │  │   │   │   EC2 Instance #2    │  │  │
│  │   │                      │  │   │   │                      │  │  │
│  │   │   ┌──────┐ ┌──────┐ │  │   │   │   ┌──────┐ ┌──────┐ │    │  │
│  │   │   │Task 1│ │Task 2│ │  │   │   │   │Task 3│ │Task 4│ │    │  │
│  │   │   └──────┘ └──────┘ │  │   │   │   └──────┘ └──────┘ │    │  │
│  │   └──────────────────────┘  │   │   └──────────────────────┘  │  │
│  │                             │   │                             │  │
│  │   ┌──────────────────────┐  │   │   ┌──────────────────────┐  │  │
│  │   │   EC2 Instance #3    │  │   │   │   EC2 Instance #4    │  │  │
│  │   │   ┌──────┐           │  │   │   │   ┌──────┐ ┌──────┐ │   │  │
│  │   │   │Task 5│           │  │   │   │   │Task 6│ │Task 7│ │   │  │
│  │   │   └──────┘           │  │   │   │   └──────┘ └──────┘ │   │  │
│  │   └──────────────────────┘  │   │   └──────────────────────┘  │  │
│  └─────────────────────────────┘   └─────────────────────────────┘  │
│                                                                     │
│   SERVICE: user-service (desired count: 7)                          │
│   → ECS tự động SPREAD tasks across AZs và EC2 instances            │
│                                                                     │
│   Nếu AZ-A chết toàn bộ:                                            │
│   → Tasks 1, 2, 5 bị mất                                            │
│   → Tasks 3, 4, 6, 7 vẫn chạy ✅ (HA)                               │
│   → ECS tự động tạo tasks mới ở AZ-B                                │
└─────────────────────────────────────────────────────────────────────┘
```

#### Placement Strategies (Chiến lược đặt Tasks)

ECS có các strategies để quyết định đặt task ở đâu:

| Strategy | Mô tả | Use case |
|----------|-------|----------|
| **SPREAD** | Phân bổ đều theo AZ hoặc instance | **HA (khuyến nghị)** |
| **BINPACK** | Nhồi đầy 1 instance trước | Tiết kiệm chi phí |
| **RANDOM** | Random | Testing |

```json
// Service definition với SPREAD strategy
{
  "serviceName": "user-service",
  "placementStrategy": [
    {
      "type": "spread",
      "field": "attribute:ecs.availability-zone"
    },
    {
      "type": "spread",
      "field": "instanceId"
    }
  ]
}
```

#### Cấu hình Multi-AZ với Fargate:

```json
// Fargate Service - chỉ cần chỉ định subnets ở nhiều AZs
{
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-aza-1",   // Private subnet AZ-A
        "subnet-azb-1"    // Private subnet AZ-B
      ],
      "securityGroups": ["sg-xxx"],
      "assignPublicIp": "DISABLED"
    }
  }
}
```

→ Fargate tự động spread tasks giữa các AZs!

---

## Container Images & ECR

### Amazon ECR (Elastic Container Registry)

```
┌─────────────────────────────────────────────────────────────┐
│                    Amazon ECR                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Repository: my-app                                 │    │
│  │                                                     │    │
│  │  Images:                                            │    │
│  │  ├── my-app:latest     (123 MB)                     │    │
│  │  ├── my-app:v1.2.3     (123 MB)                     │    │
│  │  ├── my-app:v1.2.2     (120 MB)                     │    │
│  │  └── my-app:dev        (125 MB)                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Features:                                                  │
│  ✅ Private registry                                        │
│  ✅ Image scanning (vulnerabilities)                        │
│  ✅ Image lifecycle policies                                │
│  ✅ Cross-region replication                                │
│  ✅ IAM integration                                         │
└─────────────────────────────────────────────────────────────┘
```

### Push Image to ECR

```bash
# 1. Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Build image
docker build -t my-app .

# 3. Tag image
docker tag my-app:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest

# 4. Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
```

---

## IAM Roles trong ECS

### 2 loại IAM Roles quan trọng

```
┌─────────────────────────────────────────────────────────────┐
│                    ECS IAM ROLES                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Task Execution Role                              │    │
│  │    (ecsTaskExecutionRole)                           │    │
│  │                                                     │    │
│  │    ECS Agent dùng để:                               │    │
│  │    - Pull images từ ECR                             │    │
│  │    - Push logs to CloudWatch                        │    │
│  │    - Get secrets từ Secrets Manager                 │    │
│  │                                                     │    │
│  │    Policy: AmazonECSTaskExecutionRolePolicy         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 2. Task Role                                        │    │
│  │    (Application permissions)                        │    │
│  │                                                     │    │
│  │    Container app dùng để:                           │    │
│  │    - Access S3 buckets                              │    │
│  │    - Query DynamoDB                                 │    │
│  │    - Send messages to SQS                           │    │
│  │    - Bất kỳ AWS service nào app cần                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Ví dụ Task Role Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/my-table"
    }
  ]
}
```

---

## Auto Scaling

### ECS Service Auto Scaling

```
┌─────────────────────────────────────────────────────────────┐
│                  ECS SERVICE AUTO SCALING                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         CloudWatch Alarm: CPU > 70%                 │    │
│  │                    │                                │    │
│  │                    ▼                                │    │
│  │         Application Auto Scaling                    │    │
│  │                    │                                │    │
│  │                    ▼                                │    │
│  │         Scale Out: 3 tasks → 6 tasks                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Scaling Policies:                                          │
│  ├── Target Tracking: Maintain CPU at 70%                   │
│  ├── Step Scaling: Add 2 tasks if CPU > 80%                 │
│  └── Scheduled Scaling: Scale up at 9 AM                    │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Metrics phổ biến

| Metric | Mô tả |
|--------|-------|
| **ECSServiceAverageCPUUtilization** | CPU trung bình của service |
| **ECSServiceAverageMemoryUtilization** | Memory trung bình |
| **ALBRequestCountPerTarget** | Requests per target từ ALB |
| **Custom metrics** | SQS queue depth, etc. |

### EC2 Auto Scaling (cho EC2 Launch Type)

```
Fargate: Chỉ cần scale Service (tasks)

EC2 Launch Type: Phải scale CẢ HAI:
  1. EC2 Auto Scaling Group (instances)
  2. ECS Service Auto Scaling (tasks)

ECS Cluster Capacity Providers giúp tự động hoá!
```

---

## Secrets & Configuration

### Cách truyền secrets vào containers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECRETS MANAGEMENT                       │
│                                                             │
│  ┌─────────────────┐     ┌─────────────────────────────┐    │
│  │ AWS Secrets     │     │ AWS Systems Manager         │    │
│  │ Manager         │     │ Parameter Store             │    │
│  │                 │     │                             │    │
│  │ DB passwords    │     │ API_ENDPOINT                │    │
│  │ API keys        │     │ FEATURE_FLAG                │    │
│  │ Certificates    │     │ CONFIG_VALUES               │    │
│  └────────┬────────┘     └───────────┬─────────────────┘    │
│           │                          │                      │
│           └────────────┬─────────────┘                      │
│                        ▼                                    │
│           ┌─────────────────────────────┐                   │
│           │     ECS Task Definition     │                   │
│           │    (secrets reference)      │                   │
│           └─────────────────────────────┘                   │
│                        │                                    │
│                        ▼                                    │
│           ┌─────────────────────────────┐                   │
│           │        Container            │                   │
│           │   env: DB_PASSWORD=***      │                   │
│           └─────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Task Definition với Secrets

```json
{
  "containerDefinitions": [
    {
      "name": "my-app",
      "image": "my-app:latest",
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:my-db-password"
        },
        {
          "name": "API_KEY",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/my-api-key"
        }
      ],
      "environment": [
        {
          "name": "APP_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

---

## Logging

### Container Logging với CloudWatch

```
┌─────────────────────────────────────────────────────────────┐
│                    ECS LOGGING                              │
│                                                             │
│  ┌────────────────┐          ┌────────────────────────┐     │
│  │   Container    │  stdout  │   CloudWatch Logs      │     │
│  │   (app logs)   │─────────▶│   /ecs/my-service      │     │
│  │                │  stderr  │   └── task-id/...      │     │
│  └────────────────┘          └────────────────────────┘     │
│                                                             │
│  Log Driver: awslogs                                        │
│                                                             │
│  Task Definition:                                           │
│  {                                                          │
│    "logConfiguration": {                                    │
│      "logDriver": "awslogs",                                │
│      "options": {                                           │
│        "awslogs-group": "/ecs/my-service",                  │
│        "awslogs-region": "us-east-1",                       │
│        "awslogs-stream-prefix": "ecs"                       │
│      }                                                      │
│    }                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Các Log Drivers khác

| Driver | Destination |
|--------|-------------|
| **awslogs** | CloudWatch Logs |
| **splunk** | Splunk |
| **fluentd** | Fluentd |
| **awsfirelens** | Kinesis, S3, Elasticsearch (via Fluent Bit) |

---

## Pricing: EC2 vs Fargate chi tiết

### Điểm khác biệt cốt lõi

| | EC2 Launch Type | Fargate Launch Type |
|--|-----------------|---------------------|
| **Trả tiền cho** | EC2 instances (dù container chạy hay không) | Từng container (vCPU + Memory) |
| **Không chạy gì** | Vẫn trả tiền EC2! | $0 |
| **Ví von** | Thuê nhà tháng (trả cả tháng) | Thuê phòng theo giờ |

### EC2 Launch Type - Cách tính

```
Bạn thuê 2 x t3.medium ($0.0416/giờ mỗi cái)
Chi phí cố định: $0.0832/giờ × 24 × 30 = ~$60/tháng

┌───────────────────────────────────────────────────────────────┐
│  EC2 #1                    EC2 #2                             │
│  ┌────────────────┐        ┌────────────────┐                 │
│  │ Container A    │        │ [TRỐNG]        │ ← Vẫn trả tiền! │
│  │ [TRỐNG]        │        │ [TRỐNG]        │                 │
│  └────────────────┘        └────────────────┘                 │
│                                                               │
│  Dù chỉ chạy 1 container hay 0 container → vẫn ~$60/tháng     │
└───────────────────────────────────────────────────────────────┘
```

### Fargate Launch Type - Cách tính

```
Giá (US East - tham khảo):
- vCPU: $0.04048 / vCPU / giờ
- Memory: $0.004445 / GB / giờ

Ví dụ 1 container (0.5 vCPU, 1GB RAM):
- vCPU:   0.5 × $0.04048 = $0.02024/giờ
- Memory: 1 × $0.004445 = $0.00445/giờ
- Tổng:   $0.0247/giờ

Chạy 24/7 trong 1 tháng: $0.0247 × 24 × 30 = ~$17.8/container

✅ Không chạy = $0!
```

### So sánh thực tế: 3 containers (0.5 vCPU, 1GB mỗi cái)

| Thời gian chạy | EC2 (2 x t3.medium) | Fargate | Ai rẻ hơn? |
|----------------|---------------------|---------|------------|
| **24/7 cả tháng** | ~$60 | ~$53 | Fargate ✅ |
| **12h/ngày** | ~$60 | ~$26 | Fargate ✅ |
| **8h/ngày (giờ làm việc)** | ~$60 | ~$18 | Fargate ✅ |
| **4h/ngày** | ~$60 | ~$9 | Fargate ✅ |
| **Tắt hết** | ~$60 | **$0** | Fargate ✅ |

> ⚠️ **Lưu ý**: Ví dụ trên EC2 chưa tối ưu. Với Reserved Instances hoặc Spot, EC2 sẽ rẻ hơn nhiều!

### Khi nào EC2 rẻ hơn?

```
┌───────────────────────────────────────────────────────────────────┐
│                    ĐIỂM HÒA VỐN (~65% utilization)                │
│                                                                   │
│   Cost│                                                           │
│    ▲   │          Fargate                                         │
│        │         /                                                │
│        │        /        EC2 (On-Demand)                          │
│        │       /        ─────────────────────                     │
│        │      /                                                   │
│        │     /     EC2 (Reserved)                                 │
│        │    /     ────────────────                                │
│        │   /                                                      │
│        │  /                                                       │
│        │ /                                                        │
│        └───────────────────────────────────────────► Utilization  │
│          0%        50%       65%       80%      100%              │
│                              ▲                                    │
│                    Điểm hòa vốn                                   │
│                                                                   │
│   Utilization < 65%: Fargate rẻ hơn                               │
│   Utilization > 65%: EC2 rẻ hơn                                   │
│   Có Reserved/Spot: EC2 rẻ hơn sớm hơn                            │
└───────────────────────────────────────────────────────────────────┘
```

### Các cách tiết kiệm

| Phương pháp | EC2 | Fargate | Tiết kiệm |
|-------------|-----|---------|-----------|
| **On-Demand** | ✅ | ✅ | 0% (baseline) |
| **Reserved Instances** | ✅ | ❌ | 30-60% |
| **Spot Instances** | ✅ | ✅ (Fargate Spot) | 50-70% |
| **Savings Plans** | ✅ | ✅ | 30-50% |

#### 🎟️ Reserved Instances (RI) là gì?

```
┌──────────────────────────────────────────────────────────────────────┐
│                    RESERVED INSTANCES                                │
│                                                                      │
│   Bạn: "Tôi cam kết dùng t3.medium 1 năm"                            │
│   AWS: "OK! Giảm 40% giá!"                                           │
│                                                                      │
│   Ví dụ:                                                             │
│   On-Demand: $0.0416/giờ × 8760 giờ = $364/năm                       │
│   Reserved:  $0.025/giờ  × 8760 giờ = $219/năm ← TIẾT KIỆM $145!     │
│                                                                      │
│   Các option:                                                        │
│   ├── 1 năm: Giảm ~30-40%                                            │
│   ├── 3 năm: Giảm ~50-60%                                            │
│   ├── Trả trước toàn bộ: Giảm thêm                                   │
│   └── Trả hàng tháng: Ít giảm hơn                                    │
│                                                                      │
│   ⚠️ Rủi ro: Cam kết rồi không dùng → vẫn phải trả!                  │
└──────────────────────────────────────────────────────────────────────┘
```

| Ví von | Reserved Instances |
|--------|-------------------|
| 🚕 On-Demand | Đi taxi, bật đồng hồ |
| 🚗 Reserved | Thuê xe tháng/năm - cam kết, rẻ hơn |

#### Spot Instances là gì?

```
┌──────────────────────────────────────────────────────────────────────┐
│                      SPOT INSTANCES                                  │
│                                                                      │
│   AWS có 1000 máy EC2, đang dùng 700 máy                             │
│   → 300 máy đang rảnh (idle)                                         │
│   → AWS bán rẻ những máy này! (giảm 50-90%)                          │
│                                                                      │
│   On-Demand: $0.10/giờ                                               │
│   Spot:      $0.03/giờ  ← GIẢM 70%!                                  │
│                                                                      │
│   ⚠️ NHƯNG: Khi AWS cần máy, bạn bị "đuổi" với 2 phút cảnh báo!      │
└──────────────────────────────────────────────────────────────────────┘
```

| Ví von | Spot Instances |
|--------|----------------|
| ✈️ Vé máy bay giờ chót | Rẻ nhưng có thể bị hủy |

#### 🚨 Khi AWS lấy lại Spot Instance thì sao?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SPOT INTERRUPTION FLOW                           │
│                                                                     │
│   AWS: "Tôi cần lấy lại máy này trong 2 phút!"                      │
│         │                                                           │
│          ▼ (2 phút warning)                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. ECS nhận được thông báo                                 │   │
│   │  2. ECS đánh dấu instance DRAINING (không nhận task mới)    │   │
│   │  3. ALB ngừng gửi traffic đến tasks trên instance này       │   │
│   │  4. Tasks được graceful shutdown (SIGTERM)                  │   │
│   │  5. Instance bị terminate                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│          ▼                                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  6. ECS thấy: "Desired = 3, Running = 2" → thiếu 1 task!    │   │
│   │  7. ECS tự động khởi động Task mới ở instance khác!         │   │
│   │  8. Running = 3 lại như cũ ✅                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   → User KHÔNG BỊ ẢNH HƯỞNG (nếu setup đúng)                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Best Practices với Spot:**

| Practice | Tại sao? |
|----------|----------|
| Chạy **nhiều tasks** (ít nhất 2) | Nếu 1 bị đuổi, còn task khác phục vụ |
| **Spread across AZs** | Spot bị đuổi theo AZ, spread ra giảm risk |
| **Mix 70% Spot + 30% On-Demand** | Luôn có On-Demand backup |
| **Handle SIGTERM gracefully** | App xử lý shutdown để không mất data |

**Khi nào KHÔNG nên dùng Spot?**

| ❌ Không dùng Spot | Lý do |
|-------------------|-------|
| Database (RDS, self-hosted) | Data có thể mất/corrupt |
| Single instance app | Bị đuổi = downtime |
| Long-running jobs không checkpoint | Mất hết progress |

### Tóm tắt: Chọn loại nào?

| Tình huống | Recommendation |
|------------|----------------|
| Dev/Test, chạy vài giờ/ngày | **Fargate** (trả theo giờ) |
| Startup, MVP | **Fargate** (đơn giản, không lo capacity) |
| Production 24/7, workload ổn định | **EC2 + Reserved** (rẻ hơn 40-60%) |
| Workload biến động (peak hours) | **Fargate** (scale linh hoạt) |
| Cần Spot để tiết kiệm | **EC2 Spot** hoặc **Fargate Spot** |

---

## ECS vs EKS vs Fargate

### So sánh các Container Services

```
┌────────────────────────────────────────────────────────────────┐
│                   AWS CONTAINER SERVICES                       │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐    │
│  │    ECS     │  │    EKS     │  │       FARGATE          │    │
│  │            │  │            │  │   (Serverless Compute) │    │
│  │  AWS-native│  │ Kubernetes │  │                        │    │
│  │ orchestrator│  │  managed   │  │  Works with ECS or EKS│    │
│  └────────────┘  └────────────┘  └────────────────────────┘    │
│                                                                │
│  Fargate = Launch Type, không phải orchestrator                │
│  Có thể dùng Fargate với cả ECS và EKS                         │
└────────────────────────────────────────────────────────────────┘
```

| Tiêu chí | ECS | EKS |
|----------|-----|-----|
| **Learning curve** | Dễ hơn | Khó hơn |
| **AWS integration** | Native, deep | Qua add-ons |
| **Portability** | AWS only | Multi-cloud |
| **Ecosystem** | Nhỏ hơn | Lớn (Kubernetes) |
| **Pricing** | Free control plane | ~$0.10/hour/cluster |
| **Use case** | AWS-focused | Multi-cloud, existing K8s |

---

## Hands-on Labs

### Lab 1: Tạo ECS Cluster với Fargate

```bash
# Tạo cluster
aws ecs create-cluster --cluster-name my-cluster

# Verify
aws ecs list-clusters
```

### Lab 2: Register Task Definition

```json
// task-definition.json
{
  "family": "my-web-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "nginx",
      "image": "nginx:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-web-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# List task definitions
aws ecs list-task-definitions
```

### Lab 3: Tạo ECS Service

```bash
# Tạo service
aws ecs create-service \
  --cluster my-cluster \
  --service-name my-web-service \
  --task-definition my-web-app:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz],assignPublicIp=ENABLED}"

# List services
aws ecs list-services --cluster my-cluster

# Describe service
aws ecs describe-services --cluster my-cluster --services my-web-service
```

### Lab 4: Scale Service

```bash
# Scale up
aws ecs update-service \
  --cluster my-cluster \
  --service my-web-service \
  --desired-count 4

# Scale down
aws ecs update-service \
  --cluster my-cluster \
  --service my-web-service \
  --desired-count 1
```

### Lab 5: Deploy mới (Rolling Update)

```bash
# Update task definition với image mới
# Sau đó force new deployment
aws ecs update-service \
  --cluster my-cluster \
  --service my-web-service \
  --task-definition my-web-app:2 \
  --force-new-deployment
```

---

## Best Practices

### 1. Container Best Practices

| Practice | Mô tả |
|----------|-------|
| **One process per container** | Mỗi container chạy 1 process chính |
| **Small images** | Dùng alpine/distroless base images |
| **Tag images** | Không dùng `:latest` cho production |
| **Health checks** | Định nghĩa health check trong task def |
| **Logging** | Log ra stdout/stderr |

### 2. Security Best Practices

| Practice | Mô tả |
|----------|-------|
| **Least privilege** | Task roles chỉ có permissions cần thiết |
| **Secrets Manager** | Không hardcode secrets |
| **Private ECR** | Không dùng public images cho production |
| **VPC endpoints** | Truy cập AWS services qua VPC endpoints |
| **Read-only root** | Readonly filesystem khi có thể |

### 3. Reliability Best Practices

| Practice | Mô tả |
|----------|-------|
| **Multi-AZ** | Distribute tasks across AZs |
| **Health checks** | ALB + Container health checks |
| **Auto Scaling** | Scale based on metrics |
| **Circuit breaker** | Enable deployment circuit breaker |
| **Graceful shutdown** | Handle SIGTERM signals |

### 4. Cost Optimization

| Practice | Mô tả |
|----------|-------|
| **Right-sizing** | Chọn đúng CPU/Memory |
| **Fargate Spot** | Dùng cho fault-tolerant workloads |
| **Reserved capacity** | Compute Savings Plans |
| **Turn off dev/test** | Scheduled scaling về 0 |

---

## Troubleshooting

### Common Issues

| Issue | Nguyên nhân | Giải pháp |
|-------|-------------|-----------|
| **Task stuck in PENDING** | Không đủ resources | Check cluster capacity |
| **Task fails to start** | Image pull failed | Check ECR permissions |
| **Service unstable** | Health check fails | Check health check config |
| **Container keeps restarting** | App crash | Check container logs |
| **Cannot connect** | Security group/network | Check SG rules, VPC config |

### Debug Commands

```bash
# Check task status
aws ecs describe-tasks \
  --cluster my-cluster \
  --tasks arn:aws:ecs:...:task/...

# View stopped task reason
aws ecs describe-tasks \
  --cluster my-cluster \
  --tasks arn:aws:ecs:...:task/... \
  --query 'tasks[0].stoppedReason'

# View container logs
aws logs get-log-events \
  --log-group-name /ecs/my-service \
  --log-stream-name ecs/container-name/task-id

# List services with details
aws ecs describe-services \
  --cluster my-cluster \
  --services my-service

# Check events
aws ecs describe-services \
  --cluster my-cluster \
  --services my-service \
  --query 'services[0].events[:10]'
```

---

## 🛒 Ví dụ: Thiết kế Microservices E-commerce

### Các Microservices

```
┌──────────────────────────────────────────────────────────────────────┐
│                     E-COMMERCE PLATFORM                              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   Frontend   │  │   User API   │  │  Product API │                │
│  │   (React)    │  │   (Node.js)  │  │   (Python)   │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   Cart API   │  │  Order API   │  │ Payment API  │                │
│  │   (Node.js)  │  │    (Java)    │  │    (Go)      │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                  │
│  │ Notification │  │   Search     │                                  │
│  │   (Python)   │  │(Elasticsearch)│                                 │
│  └──────────────┘  └──────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Thiết kế trên ECS

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ECS CLUSTER: prod-cluster                    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     ALB (Application Load Balancer)            │ │
│  │    api.myshop.com                                              │ │
│  │    /users/*  → User Service                                    │ │
│  │    /products/* → Product Service                               │ │
│  │    /orders/* → Order Service                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                             │                                       │
│          ┌───────────────────┼───────────────────┐                  │
│          ▼                   ▼                   ▼                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│  │ SERVICE: user    │ │SERVICE: product  │ │ SERVICE: order    │    │
│  │ Desired: 2 tasks │ │ Desired: 3 tasks │ │ Desired: 2 tasks  │    │
│  │                  │ │                  │ │                   │    │
│  │ ┌────┐ ┌────┐   │ │ ┌────┐┌────┐┌────┐│ │ ┌────┐ ┌────┐     │    │
│  │ │Task│ │Task│   │ │ │Task││Task││Task││ │ │Task│ │Task│     │    │
│  │ └────┘ └────┘   │ │ └────┘└────┘└────┘│ │ └────┘ └────┘     │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘     │
│                                                                     │
│            ↓                    ↓                 ↓                 │
│          ┌───────────────────────────────────────┐                  │
│          │                    DATABASES          │                  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐                   │   │
│  │  │ RDS     │    │ RDS     │    │ RDS     │                   │   │
│  │  │ (users) │    │(products)│   │ (orders)│                   │   │
│  │  └─────────┘    └─────────┘    └─────────┘                   │   │
│          └───────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Chi tiết từng Service

| Service | Tasks | CPU | RAM | Launch Type | Auto Scale |
|---------|-------|-----|-----|-------------|------------|
| **user-service** | 2 | 0.5 vCPU | 1 GB | Fargate | 2-10 |
| **product-service** | 3 | 1 vCPU | 2 GB | Fargate | 3-15 |
| **order-api** | 2 | 1 vCPU | 2 GB | Fargate | 2-8 |
| **order-worker** | 1 | 0.5 vCPU | 1 GB | Fargate | 1-5 |
| **cart-service** | 2 | 0.5 vCPU | 1 GB | Fargate | 2-10 |
| **payment-service** | 2 | 0.5 vCPU | 1 GB | Fargate | 2-6 |
| **notification** | 1 | 0.25 vCPU | 512 MB | Fargate | 1-3 |

### Networking

```
┌─────────────────────────────────────────────────────────────────────┐
│                              VPC                                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    PUBLIC SUBNETS                           │    │
│  │   ┌─────────────┐                                           │    │
│  │   │     ALB     │  ← Internet facing                        │    │
│  │   └─────────────┘                                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   PRIVATE SUBNETS                           │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │    │
│  │  │ User    │ │ Product │ │ Order   │ │ Payment │            │    │
│  │  │ Tasks   │ │ Tasks   │ │ Tasks   │ │ Tasks   │            │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │    │
│  │  (Each task has its own ENI - awsvpc mode)                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   DATABASE SUBNETS                          │    │
│  │   ┌─────────┐ ┌─────────┐ ┌───────────┐                     │    │
│  │   │   RDS   │ │   RDS   │ │ElastiCache│                     │    │
│  │   └─────────┘ └─────────┘ └───────────┘                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### CI/CD Deployment Flow

```
Developer push code
        │
        ▼
┌───────────────┐
│   GitHub      │
│   Actions     │
└───────┬───────┘
        │ Build & Push image
        ▼
┌───────────────┐
│     ECR       │
│  (Container   │
│   Registry)   │
└───────┬───────┘
        │ Update Task Definition
        ▼
┌───────────────┐
│     ECS       │──► Rolling deployment
│   Service     │    (từ từ replace tasks)
└───────────────┘
```

---

## Tóm tắt

### Khi nào dùng ECS?

| Use Case | Recommendation |
|----------|----------------|
| Mới bắt đầu với containers | ✅ ECS + Fargate |
| Team quen AWS | ✅ ECS |
| Đã có Kubernetes experience | → EKS |
| Multi-cloud strategy | → EKS |
| Serverless containers | ✅ ECS + Fargate |
| GPU workloads | ECS + EC2 |

### Quick Reference

```
ECS = Container Orchestrator (AWS native)
Fargate = Serverless compute for containers
ECR = Container image registry

Cluster → Service → Task → Container

Launch Types:
  EC2 = You manage servers
  Fargate = AWS manages servers

Task Definition = Blueprint for containers
Service = Ensures desired tasks running
```
