# AWS App Runner

## Mục lục

- [Tổng quan](#tổng-quan)
- [Cách App Runner hoạt động](#cách-app-runner-hoạt-động)
- [Nguồn deploy (Source)](#nguồn-deploy-source)
- [Cấu hình Service](#cấu-hình-service)
- [Auto Scaling](#auto-scaling)
- [Networking & VPC](#networking--vpc)
- [Observability](#observability)
- [Security & IAM](#security--iam)
- [Pricing](#pricing)
- [So sánh với các dịch vụ khác](#so-sánh-với-các-dịch-vụ-khác)
- [Khi nào dùng App Runner?](#khi-nào-dùng-app-runner)
- [Câu hỏi thường gặp trong thi cử](#câu-hỏi-thường-gặp-trong-thi-cử)

---

## Tổng quan

**AWS App Runner** là dịch vụ fully managed giúp deploy **web applications** và **APIs** từ source code hoặc container image — **không cần biết về servers, load balancers, hay auto scaling**.

```
┌─────────────────────────────────────────────────────────────────┐
│                       APP RUNNER                                │
│                                                                 │
│  Bạn cung cấp:              App Runner tự lo:                   │
│  ┌──────────────────┐       ┌──────────────────────────────┐    │
│  │ • Source code    │  ──►  │ ✅ Build & deploy            │    │
│  │   (GitHub repo)  │       │ ✅ Load balancer (HTTPS)     │    │
│  │ hoặc             │       │ ✅ Auto scaling (lên/xuống)  │    │
│  │ • Container image│       │ ✅ TLS certificate           │    │
│  │   (ECR)          │       │ ✅ Health checks             │    │
│  └──────────────────┘       │ ✅ Custom domain             │    │
│                             └──────────────────────────────┘    │
│                                                                 │
│  Kết quả: URL HTTPS sẵn dùng trong vài phút                     │
└─────────────────────────────────────────────────────────────────┘
```

> **Ví von**: App Runner giống như **Heroku của AWS** — push code lên là chạy, không cần lo infra.

### Vị trí trong hệ sinh thái AWS Compute

```
Mức độ kiểm soát (Control) vs Mức độ quản lý (Management)

Less Control ◄─────────────────────────────────► More Control
More Managed                                      Less Managed

[App Runner] → [Fargate] → [ECS EC2] → [EKS] → [EC2]
     ↑               ↑
  Tối giản       Serverless
  nhất           containers
```

---

## Cách App Runner hoạt động

### Luồng triển khai

```
1. Bạn chọn source (ECR image hoặc GitHub repo)
         │
         ▼
2. App Runner build image (nếu từ source code)
   sử dụng buildpacks hoặc custom build command
         │
         ▼
3. App Runner tạo service với:
   • HTTPS endpoint (*.awsapprunner.com)
   • Load balancer tự động
   • Health check tự động
         │
         ▼
4. Traffic đến → App Runner scale containers
   Không có traffic → scale về 0 (nếu bật)
         │
         ▼
5. Khi có thay đổi code/image:
   • Auto-deploy (nếu bật CI/CD integration)
   • Blue/green deployment tự động
   • Zero-downtime deploy
```

### Kiến trúc bên trong

```
┌─────────────────────────────────────────────────────────────────┐
│                     APP RUNNER SERVICE                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Managed Load Balancer                      │   │
│  │            https://xxx.awsapprunner.com                  │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│              ┌────────────┼─────────────┐                       │
│              ▼            ▼             ▼                       │
│       ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│       │Container │ │Container │ │Container │  ← auto-scaled     │
│       │ Instance │ │ Instance │ │ Instance │                    │
│       └──────────┘ └──────────┘ └──────────┘                    │
│                                                                 │
│  AWS quản lý: OS, runtime, networking, certs, scaling           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Nguồn deploy (Source)

App Runner hỗ trợ **2 loại source**:

### 1. Container Registry (ECR)

```
┌──────────────────────────────────────────────────────────┐
│  ECR (Elastic Container Registry)                        │
│                                                          │
│  • ECR Public  → image công khai (Docker Hub-like)       │
│  • ECR Private → image nội bộ (cần IAM permissions)      │
│                                                          │
│  App Runner pull image khi:                              │
│  • Deploy lần đầu                                        │
│  • Auto-deploy: theo dõi ECR tag → image mới → redeploy  │
└──────────────────────────────────────────────────────────┘
```

### 2. Source Code Repository (GitHub)

```
┌──────────────────────────────────────────────────────────┐
│  GitHub Integration                                      │
│                                                          │
│  App Runner:                                             │
│  1. Kết nối GitHub repo qua App Runner GitHub Connection │
│  2. Tự động build mỗi khi có commit/PR merge             │
│  3. Hỗ trợ runtime có sẵn:                               │
│     • Python 3 (3.8, 3.9, 3.10, 3.11)                    │
│     • Node.js (12, 14, 16, 18)                           │
│     • Java (corretto-8, corretto-11, corretto-17)        │
│     • .NET (6, 7)                                        │
│     • PHP (8.1)                                          │
│     • Ruby (3.1)                                         │
│     • Go (1.18)                                          │
└──────────────────────────────────────────────────────────┘
```

### apprunner.yaml (cấu hình build)

```yaml
version: 1.0
runtime: python311
build:
  commands:
    build:
      - pip install -r requirements.txt
run:
  runtime-version: 3.11
  command: python app.py
  network:
    port: 8080
  env:
    - name: ENV
      value: production
```

---

## Cấu hình Service

### Compute (CPU & Memory)

| CPU | Memory | Ghi chú |
|-----|--------|---------|
| 0.25 vCPU | 0.5 GB | Dev/test nhỏ |
| 0.5 vCPU | 1 GB | Mặc định |
| 1 vCPU | 2 GB | Web apps vừa |
| 2 vCPU | 4 GB | APIs với traffic cao |
| 4 vCPU | 8 GB, 10 GB, 12 GB | Heavy workloads |

> App Runner dùng **per-instance** sizing, không phải per-task như Fargate.

### Environment Variables & Secrets

```
Cách inject config:
  • Plain text env vars  → Service configuration → Environment variables
  • Secrets Manager      → valueFrom: arn:aws:secretsmanager:...
  • SSM Parameter Store  → valueFrom: arn:aws:ssm:...

⚠️ KHÔNG hardcode credentials vào source code hoặc image
```

### Custom Domain

```
Mặc định: https://<random>.awsapprunner.com

Thêm custom domain:
  1. Associate domain trong App Runner console
  2. App Runner tạo HTTPS certificate tự động (ACM)
  3. Thêm CNAME record vào DNS của bạn
  4. Xong! TLS tự gia hạn

✅ Hỗ trợ apex domain (example.com) và subdomain (api.example.com)
```

---

## Auto Scaling

App Runner có **Auto Scaling Configuration** riêng — không phải EC2 ASG:

```
┌─────────────────────────────────────────────────────────────────────┐
│              AUTO SCALING CONFIGURATION                             │
│                                                                     │
│  minSize:          Số instances tối thiểu (mặc định: 1)             │
│  maxSize:          Số instances tối đa (mặc định: 25)               │
│  maxConcurrency:   Số requests đồng thời / instance (mặc định: 100) │
│                                                                     │
│  Trigger scale-out: concurrent requests > maxConcurrency            │
│  Trigger scale-in:  concurrent requests giảm → remove instances     │
└─────────────────────────────────────────────────────────────────────┘
```

### Scale-to-zero (Pause)

```
App Runner hỗ trợ 2 trạng thái:
  
  RUNNING: Có ít nhất minSize instances hoạt động
           → Không có cold start
           → Trả tiền kể cả khi idle
  
  PAUSED:  Scale về 0 hoàn toàn
           → Không tốn tiền compute khi idle
           → Cold start khi có request đầu tiên (~vài giây)
           → Phù hợp cho dev/test environments
```

---

## Networking & VPC

### Mặc định (không VPC)

```
Internet → App Runner Managed LB → Containers
                                      ↓
                              Public internet để gọi
                              DynamoDB, S3, external APIs
```

### Với VPC Connector (kết nối resources private)

Khi app cần truy cập **RDS, ElastiCache, internal services** trong VPC:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Internet ──► App Runner Service                                │
│                      │                                          │
│                      │ VPC Connector                            │
│                      ▼                                          │
│  ┌─────────────── VPC ─────────────────────────────────┐        │
│  │                                                     │        │
│  │  ┌─────────────┐   ┌──────────────┐                 │        │
│  │  │  RDS MySQL  │   │  ElastiCache │                 │        │
│  │  │  (private)  │   │  (private)   │                 │        │
│  │  └─────────────┘   └──────────────┘                 │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  ✅ App Runner gọi được RDS qua private IP                      │
│  ✅ Không cần expose database ra internet                       │
└─────────────────────────────────────────────────────────────────┘
```

```
Cấu hình VPC Connector:
  • Chọn VPC + subnets (private subnets khuyến nghị)
  • Chọn Security Group cho outbound traffic
  • App Runner dùng connector này để route traffic vào VPC
```

### Inbound Private Endpoint

Ngược lại — nếu muốn App Runner chỉ nhận traffic từ **bên trong VPC** (không public):

```
VPC Resources ──► Private Endpoint (Interface Endpoint)
                        │
                        ▼
                  App Runner Service
                  (KHÔNG accessible từ internet)
```

---

## Observability

### CloudWatch Metrics tự động

App Runner tự gửi metrics vào CloudWatch:

| Metric | Mô tả |
|--------|-------|
| `RequestCount` | Tổng số HTTP requests |
| `2xxStatusResponses` | Requests thành công |
| `4xxStatusResponses` | Client errors |
| `5xxStatusResponses` | Server errors |
| `RequestLatency` | Latency trung bình (ms) |
| `ActiveInstances` | Số instances đang chạy |

### CloudWatch Logs

```
App Runner tự động stream logs lên CloudWatch:
  /aws/apprunner/<service-name>/<service-id>/application  ← app logs
  /aws/apprunner/<service-name>/<service-id>/system       ← system logs (build, deploy)
```

### AWS X-Ray (Distributed Tracing)

```
Bật X-Ray trong App Runner service configuration
→ Tự động trace requests qua app
→ Xem Service Map trong X-Ray console
→ Kết hợp với downstream services (DynamoDB, SQS...)
```

---

## Security & IAM

### Instance Role (Task Role tương đương)

Gán IAM Role cho App Runner service để app có thể gọi AWS services:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Service": "tasks.apprunner.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
```

### Access Role (cho ECR Private)

Khi source là ECR Private image, App Runner cần role để pull:

```
Access Role cần:
  • ecr:GetAuthorizationToken
  • ecr:BatchGetImage
  • ecr:GetDownloadUrlForLayer

Managed policy: AWSAppRunnerServicePolicyForECRAccess
```

### WAF Integration

```
App Runner ──► AWS WAF (Web ACL)
               • Rate limiting
               • IP blocking
               • SQL injection protection
               • Bot control
```

---

## Pricing

### Hai thành phần chi phí

```
1. Compute (khi instances ĐANG CHẠY):
   $0.064 / vCPU / giờ
   $0.007 / GB RAM / giờ

2. Memory (khi instances PAUSE/provisioned nhưng không active):
   $0.007 / GB RAM / giờ  ← chỉ tính memory, không tính CPU
   
→ Khi không có traffic nhưng minSize > 0:
   Bạn vẫn trả tiền memory (không trả CPU)
```

### Ví dụ tính phí

```
Service: 1 vCPU, 2 GB, chạy 8h/ngày có traffic, 16h còn lại idle

Thời gian có traffic (8h/ngày × 30 = 240h):
  CPU:    1 × $0.064 × 240 = $15.36
  Memory: 2 × $0.007 × 240 = $3.36
  Subtotal: $18.72

Thời gian idle (16h/ngày × 30 = 480h):
  CPU:    $0 (không tính)
  Memory: 2 × $0.007 × 480 = $6.72
  Subtotal: $6.72

Tổng: $25.44/tháng

So sánh:
  Fargate On-Demand 24/7: 1 vCPU × $0.04048 × 720h + 2GB × $0.004445 × 720h
                        = $29.15 + $6.40 = $35.55
  → App Runner rẻ hơn ~28% trong scenario này
```

---

## So sánh với các dịch vụ khác

### App Runner vs Fargate vs Elastic Beanstalk vs Lambda

| Tiêu chí | App Runner | Fargate (ECS) | Elastic Beanstalk | Lambda |
|----------|-----------|---------------|-------------------|--------|
| **Loại workload** | Web apps, APIs | Bất kỳ container | Web apps | Event-driven functions |
| **Quản lý infra** | Không cần gì | Không cần servers | Bán managed | Không cần gì |
| **Source input** | Code hoặc image | Image only | Code (zip) hoặc Docker | Code (zip) |
| **Scaling** | Tự động (request-based) | Tùy chỉnh nhiều | Tự động (nhiều policy) | Tự động (event-based) |
| **Cold start** | Vài giây (scale từ 0) | ~1-2 phút | ~phút | ms-giây |
| **Max runtime** | Không giới hạn | Không giới hạn | Không giới hạn | 15 phút |
| **Pricing model** | vCPU+mem (active) + mem (idle) | vCPU+mem (running time) | EC2 instances | Per request + duration |
| **VPC access** | Qua VPC Connector | Native | Native | Qua VPC config |
| **Complexity** | ⭐ Thấp nhất | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Control** | ⭐ Thấp nhất | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

### App Runner vs Fargate - Khi nào chọn cái nào?

```
Chọn APP RUNNER khi:                  Chọn FARGATE khi:
─────────────────────                 ─────────────────────
✅ Prototype / MVP nhanh              ✅ Cần kiểm soát nhiều hơn
✅ Team nhỏ, ít DevOps                ✅ Nhiều microservices phức tạp
✅ Web app đơn giản / REST API        ✅ Cần sidecar containers
✅ Muốn zero-config CI/CD             ✅ Batch processing
✅ GitHub → deploy tự động            ✅ GPU workloads
                                      ✅ Custom networking sâu hơn
```

---

## Khi nào dùng App Runner?

### Phù hợp nhất:

```
✅ Startup / indie developer cần deploy nhanh
✅ Internal tools, admin dashboards
✅ REST APIs, GraphQL endpoints
✅ Microservices đơn giản
✅ Dev / staging environments
✅ Web apps chạy trên Node.js, Python, Java, Go...
✅ Khi bạn muốn CI/CD out-of-the-box (GitHub push → auto deploy)
```

### Không phù hợp:

```
❌ Workloads cần GPU
❌ Apps cần privileged containers
❌ Complex multi-container setups (dùng ECS/EKS)
❌ Batch jobs (dùng AWS Batch)
❌ Stateful apps cần persistent local storage (dùng ECS + EFS)
❌ Apps với traffic pattern cực kỳ biến động cần fine-tune scaling
```

---

## Câu hỏi thường gặp trong thi cử

### Q1: Điểm khác biệt chính giữa App Runner và Fargate là gì?
**A**: App Runner **fully managed** hơn — tự xử lý load balancer, TLS, CI/CD integration, auto scaling mà không cần cấu hình gì. Fargate vẫn cần bạn setup ECS task definitions, services, load balancer, target groups. App Runner phù hợp với web apps/APIs đơn giản; Fargate linh hoạt hơn cho workloads phức tạp.

### Q2: App Runner có thể kết nối tới RDS trong private VPC không?
**A**: **Có** — thông qua **VPC Connector**. Bạn cấu hình connector với subnets và security groups, App Runner dùng nó để route outbound traffic vào VPC.

### Q3: Làm thế nào để App Runner deploy tự động khi push code lên GitHub?
**A**: Khi tạo service từ GitHub, bật tùy chọn **Automatic deployments** — App Runner sẽ theo dõi branch được chỉ định và tự build + deploy mỗi khi có commit mới.

### Q4: Khi không có traffic, App Runner có tính tiền không?
**A**: **Có nhưng chỉ tính memory** (không tính CPU). Nếu muốn $0 hoàn toàn khi idle, cần **Pause** service (scale về 0) — nhưng sẽ có cold start khi có request đầu tiên.

### Q5: Một công ty muốn deploy REST API từ container image, không muốn quản lý servers hay load balancers, cần HTTPS tự động. Dịch vụ nào phù hợp nhất?
**A**: **AWS App Runner** — deploy từ ECR image, HTTPS endpoint tự động, load balancer managed, auto scaling built-in, không cần cấu hình gì thêm.

### Q6: App Runner hỗ trợ những runtime nào nếu deploy từ source code?
**A**: Python, Node.js, Java (Corretto), .NET, PHP, Ruby, Go. Ngoài ra có thể dùng custom Dockerfile nếu runtime không có trong danh sách.

### Q7: So sánh App Runner với Lambda — khi nào chọn App Runner?
**A**: Chọn **App Runner** khi: workload chạy lâu hơn 15 phút, cần server-style framework (Express, FastAPI, Spring Boot), app có state trong memory giữa requests, muốn container-based deployment. Chọn **Lambda** khi: event-driven, function ngắn, cần scale cực nhanh từ 0 → nhiều, tính tiền theo millisecond.

---

**Tài liệu tham khảo:**
- [AWS App Runner - Official Docs](https://docs.aws.amazon.com/apprunner/latest/dg/what-is-apprunner.html)
- [App Runner Pricing](https://aws.amazon.com/apprunner/pricing/)
- [App Runner VPC Connector](https://docs.aws.amazon.com/apprunner/latest/dg/network-vpc.html)
- [App Runner GitHub Integration](https://docs.aws.amazon.com/apprunner/latest/dg/service-source-code.html)
