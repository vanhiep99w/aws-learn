# AWS Batch


## Mục lục

- [Tổng quan](#tổng-quan)
- [️ Kiến trúc AWS Batch](#kiến-trúc-aws-batch)
- [EC2 vs Fargate trong AWS Batch](#ec2-vs-fargate-trong-aws-batch)
- [Job Dependencies](#job-dependencies)
- [Chi phí AWS Batch](#chi-phí-aws-batch)
- [AWS Batch vs Các Services Khác](#aws-batch-vs-các-services-khác)
- [Ví dụ thực tế: Video Processing Pipeline](#ví-dụ-thực-tế-video-processing-pipeline)
- [️ Tích hợp với các AWS Services](#tích-hợp-với-các-aws-services)
- [Best Practices](#best-practices)
- [Monitoring và Debugging](#monitoring-và-debugging)
- [Tổng kết](#tổng-kết)
- [Liên kết](#liên-kết)

---

## Tổng quan

**AWS Batch** là dịch vụ được AWS quản lý hoàn toàn để chạy **batch computing workloads** ở bất kỳ quy mô nào. AWS Batch tự động cung cấp compute resources và tối ưu hóa việc phân phối workload dựa trên số lượng và yêu cầu resources của jobs.

### Batch Computing là gì?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME vs BATCH PROCESSING                    │
│                                                                     │
│  ┌─────────────────────────────────┐                                │
│  │      REAL-TIME PROCESSING       │                                │
│  │                                 │                                │
│  │   Request → Process → Response  │                                │
│  │      ↓         ↓         ↓      │                                │
│  │   User     Ngay lập   User      │                                │
│  │   gửi      tức xử lý   nhận     │                                │
│  │                                 │                                │
│  │   Ví dụ: Web API, Chat app      │                                │
│  │   Latency: milliseconds         │                                │
│  └─────────────────────────────────┘                                │
│                                                                     │
│  ┌─────────────────────────────────┐                                │
│  │       BATCH PROCESSING          │                                │
│  │                                 │                                │
│  │   Jobs → Queue → Process        │                                │
│  │    ↓       ↓        ↓           │                                │
│  │  Collect  Wait   Process        │                                │
│  │  nhiều   đến     tất cả         │                                │
│  │  jobs    lượt    cùng lúc       │                                │
│  │                                 │                                │
│  │   Ví dụ: Video encoding,        │                                │
│  │          Data analysis,         │                                │
│  │          ML training            │                                │
│  │   Duration: minutes → hours     │                                │
│  └─────────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Tại sao cần AWS Batch?

| Tự quản lý Batch Jobs | AWS Batch |
|----------------------|-----------|
| Tự setup job queue system | Built-in job queues |
| Tự provision EC2/containers | Tự động provision |
| Tự scale compute resources | Auto-scaling tích hợp |
| Tự quản lý job dependencies | Dependency management |
| Tự retry failed jobs | Automatic retries |
| Tự tối ưu resource usage | Optimal resource allocation |

### Use Cases phổ biến

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS BATCH USE CASES                            │
│                                                                     │
│  1. 🎬 MEDIA PROCESSING                                             │
│     ├── Video transcoding (1000s videos cùng lúc)                   │
│     ├── Image processing pipelines                                  │
│     └── Audio normalization                                         │
│                                                                     │
│  2. 🧬 SCIENTIFIC COMPUTING                                         │
│     ├── Genomics data analysis                                      │
│     ├── Drug discovery simulations                                  │
│     └── Climate modeling                                            │
│                                                                     │
│  3. 🤖 MACHINE LEARNING                                             │
│     ├── Model training (đặc biệt với GPU)                           │
│     ├── Hyperparameter tuning                                       │
│     └── Batch inference                                             │
│                                                                     │
│  4. 📊 DATA PROCESSING                                              │
│     ├── ETL jobs (Extract, Transform, Load)                         │
│     ├── Log processing                                              │
│     └── Financial simulations                                       │
│                                                                     │
│  5. 🏗️ RENDERING                                                     │
│     ├── 3D rendering (Animation studios)                            │
│     ├── VFX processing                                              │
│     └── Architectural visualization                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Kiến trúc AWS Batch

### Các thành phần chính

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AWS BATCH ARCHITECTURE                          │
│                                                                     │
│  ┌─────────────┐                                                    │
│  │   Submit    │ ──→ Job Definition (blueprint)                     │
│  │    Job      │                                                    │
│  └─────────────┘                                                    │
│        │                                                            │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      JOB QUEUE                              │    │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐          │    │
│  │  │ Job 1 │ │ Job 2 │ │ Job 3 │ │ Job 4 │ │ Job 5 │          │    │
│  │  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│        │                                                            │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  AWS BATCH SCHEDULER                        │    │
│  │         (Evaluates when, where, how to run jobs)            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│        │                                                            │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │               COMPUTE ENVIRONMENT                           │    │
│  │                                                             │    │
│  │   EC2 Instances hoặc Fargate                                │    │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐                       │    │
│  │   │ Job 1   │ │ Job 2   │ │ Job 3   │                       │    │
│  │   │ Running │ │ Running │ │ Running │                       │    │
│  │   └─────────┘ └─────────┘ └─────────┘                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 1. Job Definition

```
┌─────────────────────────────────────────────────────────────────────┐
│                        JOB DEFINITION                               │
│                                                                     │
│   = BLUEPRINT / Template cho jobs                                   │
│   = Tương tự Task Definition trong ECS                              │
│                                                                     │
│   Định nghĩa:                                                       │
│   ├── Container image (Docker image)                                │
│   ├── vCPU và Memory requirements                                   │
│   ├── Job role (IAM permissions)                                    │
│   ├── Environment variables                                         │
│   ├── Mount points và volumes                                       │
│   ├── Retry strategy                                                │
│   ├── Timeout settings                                              │
│   └── Platform (EC2 hoặc Fargate)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ Job Definition:**

```json
{
  "jobDefinitionName": "video-transcode-job",
  "type": "container",
  "platformCapabilities": ["FARGATE"],
  "containerProperties": {
    "image": "my-registry/video-encoder:latest",
    "resourceRequirements": [
      { "type": "VCPU", "value": "4" },
      { "type": "MEMORY", "value": "8192" }
    ],
    "jobRoleArn": "arn:aws:iam::123456789:role/BatchJobRole",
    "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
    "environment": [
      { "name": "OUTPUT_BUCKET", "value": "my-output-bucket" }
    ],
    "command": ["python", "transcode.py", "Ref::inputFile"]
  },
  "retryStrategy": {
    "attempts": 3
  },
  "timeout": {
    "attemptDurationSeconds": 3600
  }
}
```

---

### 2. Job

```
┌─────────────────────────────────────────────────────────────────────┐
│                              JOB                                    │
│                                                                     │
│   = Instance của Job Definition đang chạy                           │
│   = Một unit of work được submit                                    │
│                                                                     │
│   Job States:                                                       │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐         │
│   │ SUBMITTED│ → │ PENDING  │ → │ RUNNABLE │ → │ STARTING │         │
│   └──────────┘   └──────────┘   └──────────┘   └──────────┘         │
│                                                      │              │
│                                                       ▼             │
│                                               ┌──────────┐          │
│                                               │ RUNNING  │          │
│                                               └──────────┘          │
│                                                   │                 │
│                                    ┌───────────────┼───────────────┐│
│                                    ▼               ▼               ▼│
│                              ┌──────────┐   ┌──────────┐   ┌──────────┐
│                              │SUCCEEDED │   │  FAILED  │   │  TIMED │
│                              └──────────┘   └──────────┘   │   OUT  │
│                                                            └──────────┘
└─────────────────────────────────────────────────────────────────────┘
```

**Các loại Jobs:**

| Loại | Mô tả |
|------|-------|
| **Single Job** | 1 job = 1 container |
| **Array Job** | 1 job definition → N jobs song song (batch) |
| **Multi-node Job** | Job chạy trên nhiều nodes (HPC, ML training) |

**Array Job Example:**

```bash
# Submit array job với 1000 tasks
aws batch submit-job \
  --job-name "process-images" \
  --job-queue "high-priority" \
  --job-definition "image-processor" \
  --array-properties size=1000
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARRAY JOB                                   │
│                                                                     │
│   1 Job Definition → 1000 Jobs song song                            │
│                                                                     │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐         ┌─────────┐           │
│   │ Job[0]  │ │ Job[1]  │ │ Job[2]  │  ...    │Job[999] │           │
│   │image-0  │ │image-1  │ │image-2  │         │image-999│           │
│   └─────────┘ └─────────┘ └─────────┘         └─────────┘           │
│                                                                     │
│   Mỗi job nhận AWS_BATCH_JOB_ARRAY_INDEX env variable               │
│   để biết mình xử lý item nào                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3. Job Queue

```
┌─────────────────────────────────────────────────────────────────────┐
│                          JOB QUEUE                                  │
│                                                                     │
│   = Hàng đợi chứa jobs chờ được xử lý                               │
│   = Kết nối với 1 hoặc nhiều Compute Environments                   │
│                                                                     │
│   Features:                                                         │
│   ├── Priority: Queues có priority khác nhau                        │
│   ├── Scheduling: FIFO trong cùng priority                          │
│   ├── State: ENABLED / DISABLED                                     │
│   └── Fallback: Nếu CE 1 đầy → chuyển sang CE 2                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Multi-Queue với Priority:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRIORITY QUEUE SYSTEM                            │
│                                                                     │
│   ┌─────────────────────────────┐  Priority: 100 (CAO NHẤT)         │
│   │    HIGH PRIORITY QUEUE      │  → Production jobs                │
│   │    ┌────┐ ┌────┐ ┌────┐    │                                    │
│   │    │Job1│ │Job2│ │Job3│     │  ← Được xử lý TRƯỚC               │
│   └─────────────────────────────┘                                   │
│                                                                     │
│   ┌─────────────────────────────┐  Priority: 50                     │
│   │    MEDIUM PRIORITY QUEUE    │  → Development jobs               │
│   │    ┌────┐ ┌────┐           │                                    │
│   │    │Job4│ │Job5│            │  ← Xử lý SAU high priority        │
│   └─────────────────────────────┘                                   │
│                                                                     │
│   ┌─────────────────────────────┐  Priority: 10 (THẤP NHẤT)         │
│   │     LOW PRIORITY QUEUE      │  → Batch reports                  │
│   │    ┌────┐ ┌────┐ ┌────┐    │                                    │
│   │    │    │ │    │ │    │     │  ← Xử lý cuối cùng                │
│   └─────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4. Compute Environment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPUTE ENVIRONMENT                              │
│                                                                     │
│   = Compute resources để chạy jobs                                  │
│   = Tương tự ECS Cluster                                            │
│                                                                     │
│   2 LOẠI CHÍNH:                                                     │
│                                                                     │
│   ┌───────────────────────────┐  ┌───────────────────────────┐      │
│   │    MANAGED (AWS quản lý)  │  │  UNMANAGED (Bạn quản lý)  │      │
│   │                           │  │                           │      │
│   │  AWS tự động:             │  │  Bạn phải:                │      │
│   │  - Provision EC2/Fargate  │  │  - Tự tạo ECS cluster     │      │
│   │  - Scale lên/xuống        │  │  - Tự scale instances     │      │
│   │  - Patch instances        │  │  - Tự manage lifecycle    │      │
│   │                           │  │                           │      │
│   │  ✅ Recommended           │  │  ⚠️ Advanced use cases     │      │
│   └───────────────────────────┘  └───────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

**Managed Compute Environment - EC2:**

```json
{
  "computeEnvironmentName": "my-batch-ce",
  "type": "MANAGED",
  "state": "ENABLED",
  "computeResources": {
    "type": "EC2",
    "allocationStrategy": "BEST_FIT_PROGRESSIVE",
    "minvCpus": 0,
    "maxvCpus": 256,
    "desiredvCpus": 0,
    "instanceTypes": ["optimal"],
    "subnets": ["subnet-xxx", "subnet-yyy"],
    "securityGroupIds": ["sg-xxx"],
    "instanceRole": "arn:aws:iam::123456789:instance-profile/ecsInstanceRole"
  }
}
```

**Managed Compute Environment - Fargate:**

```json
{
  "computeEnvironmentName": "my-fargate-ce",
  "type": "MANAGED",
  "state": "ENABLED",
  "computeResources": {
    "type": "FARGATE",
    "maxvCpus": 256,
    "subnets": ["subnet-xxx", "subnet-yyy"],
    "securityGroupIds": ["sg-xxx"]
  }
}
```

---

## EC2 vs Fargate trong AWS Batch

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EC2 vs FARGATE for BATCH                         │
│                                                                     │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │           EC2                │  │          FARGATE             │ │
│  │                              │  │                              │ │
│  │  ✅ GPU support              │  │  ✅ Serverless, no servers   │ │
│  │  ✅ Spot instances (rẻ)      │  │  ✅ Faster startup           │ │
│  │  ✅ Custom AMIs              │  │  ✅ Simple pricing           │ │
│  │  ✅ Large instance types     │  │  ✅ No capacity planning     │ │
│  │                              │  │                              │ │
│  │  ❌ Slower cold start        │  │  ❌ No GPU support           │ │
│  │  ❌ More config needed       │  │  ❌ Max 4 vCPU, 30GB RAM     │ │
│  │                              │  │  ❌ No Spot pricing          │ │
│  │                              │  │                              │ │
│  │  Best for:                   │  │  Best for:                   │ │
│  │  - GPU workloads             │  │  - Quick, small jobs         │ │
│  │  - Large memory jobs         │  │  - Variable workloads        │ │
│  │  - Cost optimization (Spot)  │  │  - Simple batch processing   │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### EC2 Allocation Strategies

| Strategy | Mô tả | Use Case |
|----------|-------|----------|
| **BEST_FIT** | Chọn instance rẻ nhất đủ resources | Cost optimization |
| **BEST_FIT_PROGRESSIVE** | BEST_FIT + thêm instance types | Balance cost & availability |
| **SPOT_CAPACITY_OPTIMIZED** | Chọn Spot ít bị interrupt nhất | Long-running jobs |

---

## Job Dependencies

```
┌─────────────────────────────────────────────────────────────────────┐
│                      JOB DEPENDENCIES                               │
│                                                                     │
│   AWS Batch hỗ trợ chạy jobs theo thứ tự dependencies               │
│                                                                     │
│   Ví dụ: ETL Pipeline                                               │
│                                                                     │
│   ┌─────────────┐                                                   │
│   │   Extract   │ Job A: Download data từ S3                        │
│   │   Job A     │                                                   │
│   └──────┬──────┘                                                   │
│          │ depends on                                               │
│          ▼                                                          │
│   ┌─────────────┐                                                   │
│   │  Transform  │ Job B: Process và transform data                  │
│   │   Job B     │                                                   │
│   └──────┬──────┘                                                   │
│          │ depends on                                               │
│          ▼                                                          │
│   ┌─────────────┐                                                   │
│   │    Load     │ Job C: Load vào database                          │
│   │   Job C     │                                                   │
│   └─────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Dependency Types:**

```python
# Sequential dependency
aws batch submit-job \
  --job-name "transform-job" \
  --job-queue "my-queue" \
  --job-definition "transform-def" \
  --depends-on jobId=extract-job-id

# N_TO_N: Array job phụ thuộc vào array job khác
# Mỗi child trong array B đợi corresponding child trong array A
aws batch submit-job \
  --job-name "process-array" \
  --depends-on jobId=download-array-id,type=N_TO_N
```

---

## Chi phí AWS Batch

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS BATCH PRICING                            │
│                                                                     │
│   AWS Batch = FREE! 🎉                                              │
│                                                                     │
│   Bạn chỉ trả tiền cho:                                             │
│   ├── EC2 instances (hoặc Fargate)                                  │
│   ├── Data transfer                                                 │
│   └── Các AWS services khác (S3, ECR, etc.)                         │
│                                                                     │
│   TIẾT KIỆM CHI PHÍ:                                                │
│                                                                     │
│   1. Dùng SPOT INSTANCES (tiết kiệm đến 90%)                        │
│      ┌──────────────────────────────────────┐                       │
│      │  On-Demand: $0.096/hour              │                       │
│      │  Spot:      $0.029/hour (70% off!)   │                       │
│      └──────────────────────────────────────┘                       │
│                                                                     │
│   2. Set minvCpus = 0 (scale to zero khi idle)                      │
│                                                                     │
│   3. Right-size job resources                                       │
│      Đừng request 8 vCPU nếu chỉ cần 2 vCPU                         │
│                                                                     │
│   4. Dùng Savings Plans cho predictable workloads                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## AWS Batch vs Các Services Khác

### AWS Batch vs Lambda

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AWS BATCH vs LAMBDA                              │
│                                                                     │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │         AWS BATCH            │  │          LAMBDA              │ │
│  │                              │  │                              │ │
│  │  Duration: Minutes → Hours   │  │  Duration: Max 15 minutes    │ │
│  │  Memory: Up to TBs           │  │  Memory: Max 10 GB           │ │
│  │  CPU: Up to 100s vCPUs       │  │  CPU: Max 6 vCPUs            │ │
│  │  GPU: ✅ Yes                 │  │  GPU: ❌ No                  │ │
│  │  Custom runtime: ✅ Docker   │  │  Custom: Limited runtimes    │ │
│  │  Cold start: Slower          │  │  Cold start: Faster          │ │
│  │                              │  │                              │ │
│  │  Best for:                   │  │  Best for:                   │ │
│  │  - Long-running jobs         │  │  - Quick tasks (<15 min)     │ │
│  │  - Batch processing          │  │  - Event-driven              │ │
│  │  - HPC, ML training          │  │  - API backends              │ │
│  │  - GPU workloads             │  │  - Real-time processing      │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### AWS Batch vs ECS

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AWS BATCH vs ECS                                │
│                                                                     │
│  AWS Batch = Built ON TOP of ECS                                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                       AWS BATCH                              │   │
│  │   + Job queuing                                              │   │
│  │   + Job scheduling                                           │   │
│  │   + Automatic scaling based on job queue                     │   │
│  │   + Job dependencies                                         │   │
│  │   + Retry policies                                           │   │
│  │   ┌──────────────────────────────────────────────────────┐   │   │
│  │   │                     ECS                               │  │   │
│  │   │   Container orchestration                             │  │   │
│  │   └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Chọn ECS khi:                  Chọn Batch khi:                     │
│  - Long-running services        - Batch/job workloads               │
│  - Web APIs, microservices      - Scheduled processing              │
│  - Always-on applications       - Run-to-completion jobs            │
└─────────────────────────────────────────────────────────────────────┘
```

### So sánh tổng quan

| Feature | Lambda | AWS Batch | ECS/Fargate |
|---------|--------|-----------|-------------|
| **Use case** | Event-driven | Batch jobs | Long-running services |
| **Duration** | Max 15 min | Hours/Days | Continuous |
| **Scaling** | Per request | Per job queue | Per service |
| **GPU** | ❌ | ✅ | ✅ |
| **Custom runtime** | Limited | Docker | Docker |
| **Management** | Serverless | Managed | Managed |
| **Pricing** | Per invocation | Per compute | Per compute |

---

## Ví dụ thực tế: Video Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│              VIDEO PROCESSING PIPELINE với AWS BATCH                │
│                                                                     │
│   User uploads video → S3 → Lambda → AWS Batch Jobs                 │
│                                                                     │
│   ┌────────┐    ┌────────┐    ┌─────────────────────────────────┐   │
│   │  User  │ →  │   S3   │ →  │         EventBridge             │   │
│   │        │    │(Upload)│    └─────────────┬───────────────────┘   │
│   └────────┘    └────────┘                 │                        │
│                                              ▼                      │
│                               ┌─────────────────────────────────┐   │
│                               │      Submit to AWS Batch        │   │
│                               └─────────────────────────────────┘   │
│                                            │                        │
│                                              ▼                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      JOB QUEUE                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                            │                        │
│             ┌────────────────────────────────┼────────────────┐     │
│             ▼                                ▼                ▼     │
│   ┌─────────────────┐            ┌─────────────────┐ ┌─────────────┐│
│   │ Job 1: Extract  │            │ Job 2: Transcode│ │Job 3: Upload││
│   │ - Download      │ depends →  │ - 1080p         │ │ - S3 output ││
│   │ - Validate      │            │ - 720p          │ │ - Notify    ││
│   └─────────────────┘            │ - 480p          │ └─────────────┘│
│             └─────────────────────────────────────────────────┘     │
│                                                                     │
│   Compute Environment: EC2 với GPU instances (g4dn.xlarge)          │
│   Spot Instances để tiết kiệm 70% chi phí                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Job Definition cho Video Transcode:**

```json
{
  "jobDefinitionName": "video-transcode",
  "type": "container",
  "platformCapabilities": ["EC2"],
  "containerProperties": {
    "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/ffmpeg:latest",
    "resourceRequirements": [
      { "type": "GPU", "value": "1" },
      { "type": "VCPU", "value": "4" },
      { "type": "MEMORY", "value": "16384" }
    ],
    "command": [
      "ffmpeg", "-i", "Ref::inputFile",
      "-c:v", "h264_nvenc",
      "-preset", "fast",
      "Ref::outputFile"
    ],
    "environment": [
      { "name": "OUTPUT_BUCKET", "value": "processed-videos" }
    ],
    "mountPoints": [
      {
        "containerPath": "/data",
        "sourceVolume": "data-volume"
      }
    ],
    "volumes": [
      {
        "name": "data-volume",
        "host": { "sourcePath": "/tmp/data" }
      }
    ]
  },
  "retryStrategy": { "attempts": 3 },
  "timeout": { "attemptDurationSeconds": 7200 }
}
```

---

## Tích hợp với các AWS Services

```
┌─────────────────────────────────────────────────────────────────────┐
│                  AWS BATCH INTEGRATIONS                             │
│                                                                     │
│   ┌───────────────┐  Submit jobs                                    │
│   │  EventBridge  │ ──────────────────┐                             │
│   │  (Scheduler)  │                  │                              │
│   └───────────────┘                   ▼                             │
│                               ┌───────────────┐                     │
│   ┌───────────────┐           │              │                      │
│   │  Step         │ ────────► │   AWS BATCH  │                      │
│   │  Functions    │           │              │                      │
│   └───────────────┘           └───────┬───────┘                     │
│                                      │                              │
│   ┌───────────────┐                   │ Jobs read/write             │
│   │    Lambda     │ ────────────────►│                              │
│                               │  (Trigger)    │                   ▼ │
│   └───────────────┘           ┌───────────────┐                     │
│                               │     S3        │                     │
│   ┌───────────────┐           │   (Data)     │                      │
│   │     ECR       │ ◄─────────┤              │                      │
│   │ (Container    │           └───────────────┘                     │
│                               │  Images)      │                     │
│   └───────────────┘           ┌───────────────┐                     │
│                               │  CloudWatch   │                     │
│   ┌───────────────┐           │  (Logs &     │                      │
│   │   Secrets     │           │   Metrics)   │                      │
│   │   Manager     │           └───────────────┘                     │
│                               └───────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step Functions Integration

```json
{
  "Comment": "ML Training Pipeline",
  "StartAt": "PrepareData",
  "States": {
    "PrepareData": {
      "Type": "Task",
      "Resource": "arn:aws:states:::batch:submitJob.sync",
      "Parameters": {
        "JobName": "prepare-data",
        "JobDefinition": "data-prep-job",
        "JobQueue": "ml-queue"
      },
      "Next": "TrainModel"
    },
    "TrainModel": {
      "Type": "Task",
      "Resource": "arn:aws:states:::batch:submitJob.sync",
      "Parameters": {
        "JobName": "train-model",
        "JobDefinition": "ml-training-job",
        "JobQueue": "gpu-queue"
      },
      "End": true
    }
  }
}
```

---

## Best Practices

### 1. Compute Environment

```
✅ DO:
├── Set minvCpus = 0 để scale to zero
├── Dùng SPOT instances cho fault-tolerant jobs
├── Dùng "optimal" instance type để AWS chọn tốt nhất
└── Tách Compute Environments theo workload type (GPU vs CPU)

❌ DON'T:
├── Đừng set minvCpus cao nếu không cần
├── Đừng dùng single instance type
└── Đừng dùng On-Demand cho tất cả jobs
```

### 2. Job Design

```
✅ DO:
├── Design jobs idempotent (có thể retry an toàn)
├── Checkpoint progress cho long-running jobs
├── Log chi tiết để debug
└── Set reasonable timeouts

❌ DON'T:
├── Đừng hardcode credentials trong container
├── Đừng ignore retry logic
└── Đừng request quá nhiều resources
```

### 3. Cost Optimization

```
1. SPOT INSTANCES
   - Tiết kiệm 70-90%
   - Dùng cho fault-tolerant jobs
   - Set SPOT_CAPACITY_OPTIMIZED allocation strategy

2. RIGHT-SIZING
   - Monitor actual resource usage
   - Chỉ request resources thực sự cần

3. SCALE TO ZERO
   - minvCpus = 0
   - Không trả tiền khi không có jobs

4. FARGATE SPOT
   - Fargate + Spot pricing
   - Tiết kiệm đến 70% so với Fargate On-Demand
```

---

## Monitoring và Debugging

### CloudWatch Metrics

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDWATCH METRICS                               │
│                                                                     │
│   Job Queue Metrics:                                                │
│   ├── JobsSubmitted                                                 │
│   ├── JobsPending                                                   │
│   ├── JobsRunning                                                   │
│   ├── JobsSucceeded                                                 │
│   └── JobsFailed                                                    │
│                                                                     │
│   Compute Environment Metrics:                                      │
│   ├── DesiredvCpus                                                  │
│   ├── ActualvCpus                                                   │
│   └── RunningJobs                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### CloudWatch Logs

```python
# Job definition với logging
{
  "containerProperties": {
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/aws/batch/job",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "batch"
      }
    }
  }
}
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AWS BATCH SUMMARY                               │
│                                                                     │
│   WHAT: Managed batch computing service                             │
│                                                                     │
│   COMPONENTS:                                                       │
│   ├── Job Definition: Blueprint cho jobs                            │
│   ├── Job: Unit of work thực thi                                    │
│   ├── Job Queue: Hàng đợi với priority                              │
│   └── Compute Environment: EC2 hoặc Fargate                         │
│                                                                     │
│   WHEN TO USE:                                                      │
│   ├── Long-running batch jobs (>15 minutes)                         │
│   ├── GPU workloads (ML training, video encoding)                   │
│   ├── Massively parallel processing                                 │
│   └── Scheduled data processing                                     │
│                                                                     │
│   KEY FEATURES:                                                     │
│   ├── Auto-scaling compute resources                                │
│   ├── Job dependencies và orchestration                             │
│   ├── Spot instance support (cost savings)                          │
│   ├── Fair share scheduling                                         │
│   └── Integration với Step Functions, EventBridge                   │
│                                                                     │
│   PRICING: Free! Chỉ trả cho underlying compute (EC2/Fargate)       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Liên kết

- [← Lambda](lambda.md) - Serverless functions (jobs < 15 phút)
- [→ ECS](ecs.md) - Long-running container services
- [→ Step Functions](step-functions.md) - Orchestrate Batch jobs

---

*Cập nhật: Tháng 1, 2026*
