# AWS Compute - So sánh ECS, Fargate, App Runner và các dịch vụ liên quan

## Mục lục

- [Ba layer khi chạy container](#ba-layer-khi-chạy-container)
- [Mỗi dịch vụ giải quyết layer nào?](#mỗi-dịch-vụ-giải-quyết-layer-nào)
- [Các combo thực tế hay dùng](#các-combo-thực-tế-hay-dùng)
- [Ví von thực tế](#ví-von-thực-tế)
- [Bảng so sánh chi tiết](#bảng-so-sánh-chi-tiết)
- [Decision Tree - Chọn dịch vụ nào?](#decision-tree---chọn-dịch-vụ-nào)

---

## Ba layer khi chạy container

Để chạy một container trên AWS, bạn cần giải quyết 3 layer:

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER 3: PLATFORM                                           │
│  Load balancer, HTTPS, CI/CD, custom domain, scaling policy  │
├──────────────────────────────────────────────────────────────┤
│  LAYER 2: ORCHESTRATION                                      │
│  Điều phối container: chạy ở đâu, bao nhiêu cái,            │
│  restart khi chết, rolling deploy...                         │
├──────────────────────────────────────────────────────────────┤
│  LAYER 1: COMPUTE                                            │
│  Máy thật (CPU/RAM) để container thực sự chạy trên đó        │
└──────────────────────────────────────────────────────────────┘
```

---

## Mỗi dịch vụ giải quyết layer nào?

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: PLATFORM                                                  │
│                                                                     │
│  ┌───────────────────────────┐   ┌──────────────────────────────┐   │
│  │      APP RUNNER           │   │   Elastic Beanstalk          │   │
│  │  Lo hết layer 3           │   │   Lo hết layer 3             │   │
│  │  + gọi ECS/Fargate bên    │   │   + dùng EC2 bên dưới        │   │
│  │  dưới tự động             │   │                              │   │
│  └───────────────────────────┘   └──────────────────────────────┘   │
│                                                                     │
│  ⚠️ ECS/EKS KHÔNG lo layer này — bạn phải tự setup ALB,            │
│     target group, listener rules                                    │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2: ORCHESTRATION                                             │
│                                                                     │
│  ┌──────────────────┐   ┌──────────────────┐                        │
│  │      ECS         │   │      EKS         │                        │
│  │  AWS-native      │   │  Kubernetes      │                        │
│  │  Task/Service    │   │  Pod/Deployment  │                        │
│  └──────────────────┘   └──────────────────┘                        │
│                                                                     │
│  ⚠️ ECS/EKS chỉ là "não điều khiển" — KHÔNG có CPU/RAM thật        │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 1: COMPUTE                                                   │
│                                                                     │
│  ┌──────────────────┐   ┌──────────────────┐                        │
│  │      EC2         │   │     FARGATE      │                        │
│  │  Bạn quản lý     │   │  AWS quản lý     │                        │
│  │  servers         │   │  (serverless)    │                        │
│  └──────────────────┘   └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Các combo thực tế hay dùng

| Combo | Bạn lo gì | AWS lo gì |
|-------|-----------|-----------|
| **ECS + EC2** | Orchestration + servers | Không nhiều |
| **ECS + Fargate** | Chỉ orchestration (task definitions, services) | Servers |
| **EKS + EC2** | Kubernetes workloads + servers | Kubernetes control plane |
| **EKS + Fargate** | Chỉ Kubernetes workloads | Servers + control plane |
| **App Runner** | Chỉ code hoặc image | Tất cả (LB, HTTPS, scaling, deploy) |
| **Elastic Beanstalk** | Upload code/Docker | LB, EC2 instances, ASG |
| **Lambda** | Chỉ function code | Tất cả + billing per ms |

---

## Ví von thực tế

| Dịch vụ | Giống như... |
|---------|-------------|
| **EC2** | Mua đất, tự xây nhà, tự sửa chữa |
| **ECS + EC2** | Thuê kiến trúc sư (ECS) nhưng vẫn tự mua đất (EC2) |
| **ECS + Fargate** | Thuê kiến trúc sư (ECS), đất thì thuê theo dự án (Fargate) |
| **App Runner** | Thuê căn hộ dịch vụ — dọn phòng, điện nước, bảo vệ có sẵn hết |
| **Elastic Beanstalk** | Thuê nhà có đồ nội thất — bạn chỉ mang đồ cá nhân vào |
| **Lambda** | Thuê phòng họp theo giờ — chỉ trả khi đang dùng |

---

## Bảng so sánh chi tiết

| Tiêu chí | EC2 | ECS+Fargate | EKS+Fargate | App Runner | Lambda |
|----------|-----|-------------|-------------|------------|--------|
| **Quản lý server** | Bạn tự lo | AWS lo | AWS lo | AWS lo | AWS lo |
| **Orchestration** | Không có | ECS (AWS-native) | Kubernetes | Tự động | Không cần |
| **Load Balancer** | Tự setup ALB | Tự setup ALB | Tự setup ALB | Có sẵn ✅ | Có sẵn ✅ |
| **HTTPS / TLS** | Tự setup ACM | Tự setup ACM | Tự setup ACM | Tự động ✅ | Tự động ✅ |
| **CI/CD** | Tự setup | Tự setup | Tự setup | GitHub → auto deploy ✅ | Tự setup |
| **Auto Scaling** | Phải cấu hình ASG | Phải cấu hình | Phải cấu hình | Tự động ✅ | Tự động ✅ |
| **GPU support** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Max runtime** | Không giới hạn | Không giới hạn | Không giới hạn | Không giới hạn | 15 phút |
| **Cold start** | Không | ~1-2 phút | ~1-2 phút | Vài giây | ms-giây |
| **Pricing** | EC2 theo giờ | vCPU+mem khi chạy | vCPU+mem khi chạy | vCPU+mem (active) + mem (idle) | Per request + ms |
| **Độ phức tạp** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐⭐ |
| **Kiểm soát** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

---

## Decision Tree - Chọn dịch vụ nào?

```
Cần chạy code / container trên AWS?
              │
              ▼
   Chạy theo event (HTTP request, SQS, schedule...)?
   Runtime < 15 phút?
   ├── Có → LAMBDA ✅
   └── Không ↓

   Cần tối giản nhất (web app / API đơn giản)?
   Không muốn config bất cứ thứ gì?
   ├── Có → APP RUNNER ✅
   └── Không ↓

   Đã quen Kubernetes hoặc cần chạy K8s workloads?
   ├── Có → EKS + Fargate ✅  (hoặc EKS + EC2 nếu cần GPU)
   └── Không ↓

   → ECS + Fargate ✅  (phổ biến nhất, cân bằng tốt)

   Ngoại lệ — chọn EC2 launch type khi:
     • Cần GPU
     • Workload 24/7 utilization cao → EC2 Reserved rẻ hơn
     • Cần SSH vào container host để debug
```

---

## Tóm lại 1 câu

- **ECS / EKS** = **bộ não** điều phối (không có máy thật)
- **EC2 / Fargate** = **cơ bắp** thực thi (EC2: bạn quản, Fargate: AWS quản)
- **App Runner** = gói tất cả lại, bạn chỉ cần đưa code/image là xong

> ECS + Fargate = bạn chỉ lo "**chạy cái gì**" (task definition, service config)
> App Runner = bạn chỉ lo "**code là gì**" (source code hoặc image)
