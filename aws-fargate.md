# AWS Fargate

## Mục lục

- [Tổng quan](#tổng-quan)
- [Fargate hoạt động như thế nào?](#fargate-hoạt-động-như-thế-nào)
- [Task Sizing - vCPU & Memory](#task-sizing---vcpu--memory)
- [Networking](#networking)
- [Security & IAM](#security--iam)
- [Storage](#storage)
- [Fargate Spot](#fargate-spot)
- [Pricing](#pricing)
- [ECS on Fargate vs EKS on Fargate](#ecs-on-fargate-vs-eks-on-fargate)
- [Khi nào dùng Fargate?](#khi-nào-dùng-fargate)
- [Best Practices](#best-practices)
- [Câu hỏi thường gặp trong thi cử](#câu-hỏi-thường-gặp-trong-thi-cử)

---

## Tổng quan

**AWS Fargate** là một **serverless compute engine** dành cho containers — bạn không cần quản lý EC2 instances nào cả. Fargate có thể dùng với cả **ECS** và **EKS**.

```
┌──────────────────────────────────────────────────────────────┐
│                      SERVERLESS CONTAINERS                   │
│                                                              │
│   Bạn chỉ cần định nghĩa:                                    │
│   ┌───────────────────────────────────────────┐              │
│   │  • Container image (từ ECR, Docker Hub)   │              │
│   │  • CPU & Memory cần dùng                  │              │
│   │  • Network settings                       │              │
│   │  • IAM Role                               │              │
│   └───────────────────────────────────────────┘              │
│                        ↓                                     │
│   Fargate tự lo:                                             │
│   ┌───────────────────────────────────────────┐              │
│   │  ✅ Server provisioning                   │              │
│   │  ✅ OS patching                           │              │
│   │  ✅ Docker daemon                         │              │
│   │  ✅ Capacity planning                     │              │
│   │  ✅ Cluster management                    │              │
│   └───────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

> **Ví von**: Gọi Grab (Fargate) vs tự lái xe (EC2). Bạn chỉ cần nói điểm đến, không cần biết xe là gì.

### Fargate là gì so với EC2 Launch Type?

| | EC2 Launch Type | Fargate Launch Type |
|--|-----------------|---------------------|
| **Bạn thấy servers?** | ✅ SSH được | ❌ Không có server để SSH |
| **Ai quản lý OS?** | Bạn tự patch | AWS lo hết |
| **Scaling** | Phải scale cả EC2 lẫn tasks | Chỉ scale tasks |
| **Pricing** | Trả tiền EC2 24/7 | Trả theo vCPU + Memory × thời gian chạy |
| **Khởi động** | Nhanh hơn (EC2 sẵn) | Chậm hơn ~1-2 phút (cold start) |
| **GPU support** | ✅ Có | ❌ Không |
| **Windows containers** | ✅ Có | ✅ Có (Windows Server) |

---

## Fargate hoạt động như thế nào?

### Luồng chạy một task

```
Bạn deploy Task                            Fargate infrastructure
─────────────────                          ──────────────────────

1. Tạo Task Definition          ──────►    (Không có gì xảy ra)
   (image, cpu, memory, ...)

2. ECS/EKS nhận yêu cầu        ──────►    AWS tìm compute resources
   "Chạy task này!"                        phù hợp (ẩn danh với bạn)

3. Task PENDING                 ──────►    Fargate allocate vCPU + Memory
                                           Pull container image
                                           Cấu hình network (awsvpc)

4. Task RUNNING                 ◄──────    Container đang chạy
   (bạn thấy task status)                  trên hardware của AWS
   
5. Task STOPPED                 ◄──────    Giải phóng tài nguyên
   (task kết thúc / lỗi)                   ✅ Không còn tính tiền
```

### Kiến trúc microVM (Firecracker)

AWS Fargate sử dụng **Firecracker microVM** — mỗi task chạy trong microVM riêng biệt, cô lập hoàn toàn với các customer khác.

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Physical Host                        │
│                                                             │
│  ┌───────────────────┐   ┌───────────────────┐              │
│  │  microVM (Task A) │   │  microVM (Task B) │              │
│  │  ┌─────────────┐  │   │  ┌─────────────┐  │              │
│  │  │ Container 1 │  │   │  │ Container 2 │  │              │
│  │  │ Container 2 │  │   │  │             │  │              │
│  │  └─────────────┘  │   │  └─────────────┘  │              │
│  │  Kernel riêng     │   │  Kernel riêng     │              │
│  └───────────────────┘   └───────────────────┘              │
│                                                             │
│  ✅ Isolated: Task A không thể thấy Task B                  │
│  ✅ Security: mỗi task có kernel space riêng                │
└─────────────────────────────────────────────────────────────┘
```

---

## Task Sizing - vCPU & Memory

Fargate không cho phép chọn tùy ý — phải chọn trong **bảng combination hợp lệ**:

### Bảng CPU & Memory hợp lệ

| vCPU | Memory (GB) |
|------|-------------|
| 0.25 | 0.5, 1, 2 |
| 0.5  | 1, 2, 3, 4 |
| 1    | 2, 3, 4, 5, 6, 7, 8 |
| 2    | 4 → 16 (bước 1 GB) |
| 4    | 8 → 30 (bước 1 GB) |
| 8    | 16 → 60 (bước 4 GB) |
| 16   | 32 → 120 (bước 8 GB) |

### Task-level vs Container-level sizing

```
Task Definition:
┌───────────────────────────────────────────────┐
│  Task CPU: 1 vCPU  (1024 CPU units)           │
│  Task Memory: 2 GB                            │
│                                               │
│  ┌───────────────┐   ┌───────────────┐        │
│  │ Container A   │   │ Container B   │        │
│  │ cpu: 512      │   │ cpu: 512      │        │
│  │ memory: 1024  │   │ memory: 1024  │        │
│  └───────────────┘   └───────────────┘        │
│                                               │
│  Tổng container ≤ Task level                  │
└───────────────────────────────────────────────┘
```

---

## Networking

### awsvpc Mode (bắt buộc với Fargate)

Fargate **bắt buộc** dùng **awsvpc** network mode. Mỗi task nhận một **ENI (Elastic Network Interface) riêng** với IP address riêng trong VPC của bạn.

```
┌────────────────────────────────────────────────────────────┐
│                          VPC                               │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Private Subnet                     │   │
│  │                                                     │   │
│  │  ┌──────────────────┐   ┌──────────────────┐        │   │
│  │  │  Fargate Task 1  │   │  Fargate Task 2  │        │   │
│  │  │  ENI: 10.0.1.10  │   │  ENI: 10.0.1.11  │        │   │
│  │  │  SG: sg-abc123   │   │  SG: sg-abc123   │        │   │
│  │  └──────────────────┘   └──────────────────┘        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ✅ Mỗi task có private IP riêng                           │
│  ✅ Security Groups áp dụng ở task level                   │
│  ✅ Tích hợp trực tiếp với ALB/NLB                         │
└────────────────────────────────────────────────────────────┘
```

### Public IP cho Fargate Tasks

```
Nếu task cần kết nối internet để pull image:

Option 1: Public subnet + Auto-assign public IP
  Subnet: public
  assignPublicIp: ENABLED

Option 2: Private subnet + NAT Gateway (khuyến nghị production)
  Subnet: private
  Route: 0.0.0.0/0 → NAT Gateway → Internet Gateway
  assignPublicIp: DISABLED  ← Không cần public IP
```

### VPC Endpoints (tiết kiệm chi phí)

Nếu Fargate cần kết nối S3, ECR, CloudWatch Logs → dùng **VPC Endpoints** để tránh NAT Gateway costs:

```
Endpoint cần có cho Fargate trong private subnet:
  • com.amazonaws.<region>.ecr.api        (ECR API)
  • com.amazonaws.<region>.ecr.dkr        (ECR Docker)
  • com.amazonaws.<region>.s3             (S3 - pull layers)
  • com.amazonaws.<region>.logs           (CloudWatch Logs)
  • com.amazonaws.<region>.secretsmanager (nếu dùng Secrets Manager)
```

---

## Security & IAM

### Hai loại IAM Role trong Fargate

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Task Execution Role (ecsTaskExecutionRole)                  │
│     → Fargate infrastructure dùng để SETUP task                 │
│                                                                 │
│     Permissions cần có:                                         │
│     • ecr:GetAuthorizationToken     (pull image từ ECR)         │
│     • ecr:BatchGetImage             (pull image)                │
│     • logs:CreateLogGroup           (tạo log group)             │
│     • logs:CreateLogStream          (tạo log stream)            │
│     • logs:PutLogEvents             (gửi logs)                  │
│     • secretsmanager:GetSecretValue (nếu dùng secrets)          │
│     • ssm:GetParameters             (nếu dùng SSM Params)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  2. Task Role                                                   │
│     → Container APPLICATION dùng để gọi AWS services            │
│                                                                 │
│     Ví dụ app cần:                                              │
│     • s3:GetObject, s3:PutObject   (đọc/ghi S3)                 │
│     • dynamodb:GetItem             (đọc DynamoDB)               │
│     • sqs:SendMessage              (gửi SQS)                    │
└─────────────────────────────────────────────────────────────────┘
```

> **Nhớ**: Task Execution Role = Fargate cần (setup/infra). Task Role = App cần (business logic).

### Security Groups

Vì mỗi task có ENI riêng, bạn gán Security Group ở **task level**:

```json
{
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-abc123"],
      "securityGroups": ["sg-web-tier"],
      "assignPublicIp": "DISABLED"
    }
  }
}
```

### Secrets Management

**Không bao giờ** hardcode secrets vào container image. Dùng:

```
Option 1: AWS Secrets Manager
  → Task Definition → secrets → valueFrom: arn:aws:secretsmanager:...

Option 2: SSM Parameter Store
  → Task Definition → secrets → valueFrom: arn:aws:ssm:...

Cách inject:
  • Environment variable  → secrets[].name = "DB_PASSWORD"
  • File mount           → volumes[].efsVolumeConfiguration
```

---

## Storage

### Ephemeral Storage (mặc định)

```
Mặc định: 20 GB ephemeral storage (miễn phí)
Có thể tăng lên: 200 GB (tính phí thêm)

⚠️ Ephemeral = mất khi task dừng!
✅ Dùng cho: temp files, build artifacts, cache ngắn hạn
```

### EFS (Elastic File System) - Persistent Storage

Để lưu trữ lâu dài với Fargate, dùng **EFS**:

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Fargate Task 1  ──┐                                   │
│                    ├──► EFS File System (persistent)   │
│  Fargate Task 2  ──┘    /data mounted vào /mnt/efs     │
│                                                        │
│  ✅ Data tồn tại sau khi task dừng                     │
│  ✅ Nhiều tasks cùng mount                             │
│  ✅ Multi-AZ tự động                                   │
└────────────────────────────────────────────────────────┘
```

```json
// Task Definition với EFS volume
{
  "volumes": [{
    "name": "efs-data",
    "efsVolumeConfiguration": {
      "fileSystemId": "fs-12345678",
      "rootDirectory": "/",
      "transitEncryption": "ENABLED",
      "authorizationConfig": {
        "accessPointId": "fsap-abc123",
        "iam": "ENABLED"
      }
    }
  }],
  "containerDefinitions": [{
    "name": "app",
    "mountPoints": [{
      "sourceVolume": "efs-data",
      "containerPath": "/mnt/data"
    }]
  }]
}
```

---

## Fargate Spot

**Fargate Spot** = phiên bản spot của Fargate → tiết kiệm **~70%** so với On-Demand, nhưng có thể bị AWS reclaim bất kỳ lúc nào (có 2 phút notice).

```
┌────────────────────────────────────────────────────────────┐
│                   FARGATE SPOT                             │
│                                                            │
│  On-Demand Fargate: $0.04048/vCPU/h                        │
│  Fargate Spot:      ~$0.01218/vCPU/h  (70% rẻ hơn)         │
│                                                            │
│  ⚠️ Có thể bị interrupt với 2 phút warning                 │
│  ✅ SIGTERM → container có 2 phút để graceful shutdown     │
└────────────────────────────────────────────────────────────┘
```

### Khi nào nên dùng Fargate Spot?

```
✅ NÊN dùng Fargate Spot:           ❌ KHÔNG nên dùng Fargate Spot:
  • Batch processing jobs             • Production web services (yêu cầu HA)
  • CI/CD pipelines                   • Database connections cần ổn định
  • Dev/test environments             • Stateful workloads không tolerate interrupt
  • Fault-tolerant workloads          • Real-time processing quan trọng
  • Scheduled tasks
```

### Cấu hình Capacity Provider Strategy

```json
// Kết hợp On-Demand + Spot (khuyến nghị cho production)
{
  "capacityProviderStrategy": [
    {
      "capacityProvider": "FARGATE",
      "weight": 1,
      "base": 1        // ← Ít nhất 1 task chạy On-Demand (HA)
    },
    {
      "capacityProvider": "FARGATE_SPOT",
      "weight": 4      // ← 4 tasks Spot cho mỗi 1 task On-Demand
    }
  ]
}
```

---

## Pricing

### Cách tính giá (US East - tham khảo, verify tại aws.amazon.com/fargate/pricing)

```
Fargate On-Demand:
  vCPU:   $0.04048 / vCPU / giờ
  Memory: $0.004445 / GB / giờ

Fargate Spot (giá dao động):
  vCPU:   ~$0.01218 / vCPU / giờ  (tiết kiệm ~70%)
  Memory: ~$0.00133 / GB / giờ

Windows Fargate: cao hơn ~20% so với Linux
```

### Ví dụ tính phí thực tế

```
Bài toán: API service chạy 0.5 vCPU + 1GB RAM, 24/7 cả tháng

On-Demand:
  vCPU:   0.5 × $0.04048 × 24 × 30 = $14.57
  Memory: 1.0 × $0.004445 × 24 × 30 = $3.20
  Tổng:   ~$17.77/tháng/task

Fargate Spot:
  vCPU:   0.5 × $0.01218 × 24 × 30 = $4.38
  Memory: 1.0 × $0.00133 × 24 × 30 = $0.96
  Tổng:   ~$5.34/tháng/task  (tiết kiệm ~70%)
```

### So sánh với EC2

```
┌─────────────────────────────────────────────────────────────────┐
│              ĐIỂM HÒA VỐN (Break-Even Point)                    │
│                                                                 │
│  Cost                                                           │
│   ▲   Fargate On-Demand ─────────────────────────────────       │
│   │              ╱                                              │
│   │             ╱   EC2 On-Demand ──────────────────────        │
│   │            ╱          ╱                                     │
│   │           ╱          ╱  EC2 Reserved ────────────           │
│   │          ╱          ╱        ╱                              │
│   │         ╱          ╱        ╱  Fargate Spot ─────           │
│   └────────────────────────────────────────────► Utilization    │
│        0%       40%      65%     80%    100%                    │
│                           ▲                                     │
│                  Điểm hòa vốn                                   │
│                  Fargate vs EC2 On-Demand                       │
│                                                                 │
│  Utilization < 65%: Fargate rẻ hơn EC2 On-Demand                │
│  Utilization > 65%: EC2 rẻ hơn (đặc biệt nếu Reserved)          │
└─────────────────────────────────────────────────────────────────┘
```

### Compute Savings Plans cho Fargate

Tương tự EC2 Reserved Instances, **Compute Savings Plans** áp dụng cho Fargate:

| Plan | Tiết kiệm |
|------|-----------|
| On-Demand | 0% (baseline) |
| Fargate Spot | ~70% |
| Compute Savings Plans (1 năm) | ~20% |
| Compute Savings Plans (3 năm) | ~40% |

---

## ECS on Fargate vs EKS on Fargate

Fargate có thể làm "compute engine" cho cả ECS lẫn EKS:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FARGATE                                  │
│              (Serverless Container Compute)                     │
│                                                                 │
│         ┌───────────────────────────────┐                       │
│         │                               │                       │
│    ┌────┴────┐                    ┌─────┴──────┐                │
│    │   ECS   │                    │   EKS      │                │
│    │         │                    │            │                │
│    │ AWS-    │                    │ Kubernetes │                │
│    │ native  │                    │ API        │                │
│    │ Tasks & │                    │ Pods &     │                │
│    │ Services│                    │ Deployments│                │
│    └─────────┘                    └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

| | ECS + Fargate | EKS + Fargate |
|--|---------------|---------------|
| **Orchestration** | AWS-native (ECS) | Kubernetes |
| **Learning curve** | Thấp | Cao (cần biết K8s) |
| **Portability** | AWS only | Chạy được on-prem, GKE, AKS |
| **Config unit** | Task Definition | Pod Spec (YAML) |
| **Ecosystem** | AWS tools | CNCF ecosystem (Helm, Istio...) |
| **Khi dùng** | Greenfield AWS project | Đã có K8s, hybrid cloud |

### EKS Fargate Profile

Với EKS, bạn cần tạo **Fargate Profile** để chỉ định pods nào chạy trên Fargate:

```yaml
# Fargate Profile - chỉ pods trong namespace "production" mới dùng Fargate
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
fargateProfiles:
  - name: prod-profile
    selectors:
      - namespace: production
        labels:
          compute: fargate
```

> **Lưu ý**: EKS Fargate không hỗ trợ DaemonSets, NodePort Services, hoặc privileged containers.

---

## Khi nào dùng Fargate?

### Fargate là lựa chọn tốt khi:

```
✅ Bạn muốn chạy containers mà không cần quản lý servers
✅ Workload biến động (dev/test, scheduled jobs, burst traffic)
✅ Team nhỏ, không có DevOps riêng cho infra
✅ Bạn muốn pay-per-use (chỉ trả khi container chạy)
✅ Cần isolation bảo mật cao (microVM per task)
✅ Migrate từ monolith → microservices nhanh
✅ CI/CD pipelines, batch jobs
```

### Không nên dùng Fargate khi:

```
❌ Cần GPU workloads (machine learning, video encoding)
❌ Workload chạy 24/7 với utilization cao (EC2 Reserved rẻ hơn)
❌ Cần truy cập trực tiếp vào host OS
❌ Cần Windows với custom kernel config
❌ Latency cực thấp (cold start ~1-2 phút có thể là vấn đề)
❌ Batch jobs cần > 16 vCPU (giới hạn task size)
```

### Decision Tree

```
Cần chạy containers trên AWS?
         │
         ▼
  Muốn quản lý servers?
  ├── Có → EC2 Launch Type (ECS/EKS với self-managed nodes)
  └── Không → FARGATE ✅
                │
                ▼
         Đã biết Kubernetes?
         ├── Có → EKS + Fargate
         └── Không → ECS + Fargate (đơn giản hơn)
```

---

## Best Practices

### 1. Right-sizing Tasks

```
❌ Sai: Chọn 4 vCPU cho app chỉ dùng 0.2 vCPU
   → Lãng phí chi phí

✅ Đúng: Dùng CloudWatch Container Insights để monitor
         CPU/Memory utilization, rồi điều chỉnh task size
```

### 2. Sử dụng Private Subnets + VPC Endpoints

```
❌ Sai: Fargate tasks trong public subnet, pull ECR qua internet
   → Tốn NAT Gateway costs, security risk

✅ Đúng: Private subnet + VPC Endpoints cho ECR, S3, Logs
   → Không cần NAT, tiết kiệm chi phí, bảo mật hơn
```

### 3. Image Optimization

```
✅ Dùng minimal base images (Alpine, Distroless) → pull nhanh hơn
✅ Multi-stage builds → image nhỏ hơn
✅ Pin image tags (không dùng :latest) → reproducible deployments
✅ Dùng ECR → pull nhanh hơn Docker Hub, không bị rate limit
```

### 4. Health Checks

```json
// Container health check trong Task Definition
{
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 60  // ← Grace period cho app khởi động
  }
}
```

### 5. Graceful Shutdown cho Fargate Spot

```python
# Xử lý SIGTERM (Fargate Spot interrupt signal)
import signal
import sys

def handle_sigterm(sig, frame):
    print("Nhận SIGTERM - đang graceful shutdown...")
    # Finish current work, close connections, flush cache
    cleanup()
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)
```

### 6. Logging

```json
// Dùng awslogs driver để gửi logs lên CloudWatch
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/my-app",
      "awslogs-region": "ap-southeast-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

---

## Câu hỏi thường gặp trong thi cử

### Q1: Fargate bắt buộc dùng network mode nào?
**A**: `awsvpc` — đây là yêu cầu bắt buộc của Fargate. Mỗi task nhận ENI và private IP riêng.

### Q2: Fargate Spot bị interrupt, có bao nhiêu thời gian để shutdown?
**A**: **2 phút** — Fargate gửi SIGTERM, container có 2 phút để graceful shutdown trước khi bị SIGKILL.

### Q3: Để Fargate task đọc secret từ Secrets Manager, cần role nào?
**A**: **Task Execution Role** (không phải Task Role). Task Execution Role là Fargate dùng trong quá trình setup task (pull image, inject secrets).

### Q4: Fargate có hỗ trợ GPU không?
**A**: **Không**. GPU workloads phải dùng EC2 Launch Type.

### Q5: Fargate có thể dùng với EKS không?
**A**: **Có** — thông qua **EKS Fargate Profile**, bạn chỉ định namespaces/labels nào sẽ chạy trên Fargate.

### Q6: Một công ty muốn container app chạy serverless, không quản lý servers, chi phí thấp nhất. Chọn gì?
**A**: **ECS + Fargate Spot** (nếu workload fault-tolerant) hoặc **ECS + Fargate On-Demand** (nếu cần HA). Kết hợp cả hai qua Capacity Provider Strategy là tối ưu nhất.

### Q7: Fargate default ephemeral storage là bao nhiêu?
**A**: **20 GB** (có thể tăng lên 200 GB với phí thêm). Data mất khi task dừng.

### Q8: Nhiều Fargate tasks cần share persistent storage. Dùng gì?
**A**: **Amazon EFS** — mount vào nhiều tasks đồng thời, data persistent, multi-AZ.

---

**Tài liệu tham khảo:**
- [AWS Fargate - Official Docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [ECS Task Definition Reference](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html)
- [EKS Fargate Profile](https://docs.aws.amazon.com/eks/latest/userguide/fargate-profile.html)
- [Fargate Spot Interruption Handling](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html)
