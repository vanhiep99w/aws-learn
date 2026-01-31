# Load Balancing Patterns: AWS vs K8s vs Spring Cloud


## Mục lục

- [Tổng quan](#tổng-quan)
- [Server-side vs Client-side Load Balancing](#server-side-vs-client-side-load-balancing)
- [Khi nào dùng loại nào?](#khi-nào-dùng-loại-nào)
- [Spring Cloud LoadBalancer + Eureka](#spring-cloud-loadbalancer-eureka)
- [Chi tiết theo môi trường](#chi-tiết-theo-môi-trường)
- [So sánh Load Balancing](#so-sánh-load-balancing)
- [So sánh Auto Scaling](#so-sánh-auto-scaling)
- [Các kiến trúc Microservices phổ biến](#các-kiến-trúc-microservices-phổ-biến)
- [Bảng so sánh tổng hợp](#bảng-so-sánh-tổng-hợp)
- [So sánh Cost chi tiết](#so-sánh-cost-chi-tiết)
- [Decision Tree: Chọn kiến trúc nào?](#decision-tree-chọn-kiến-trúc-nào)
- [Tại sao cần AWS ALB trước K8s?](#tại-sao-cần-aws-alb-trước-k8s)
- [Liên kết](#liên-kết)

---

## Tổng quan

So sánh các giải pháp Load Balancing và Auto Scaling ở các layer khác nhau:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Infrastructure                            │
│  AWS ELB/ASG ─────────────────────────────────────────────────  │
│  (Manage EC2 instances, hardware level)                         │
├─────────────────────────────────────────────────────────────────┤
│                    Container Orchestration                       │
│  Kubernetes Service/Ingress/HPA ────────────────────────────── │
│  (Manage Pods/Containers)                                       │
├─────────────────────────────────────────────────────────────────┤
│                        Application                               │
│  Spring Cloud LoadBalancer ─────────────────────────────────── │
│  (Client-side, trong code)                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Server-side vs Client-side Load Balancing

### Server-side Load Balancing

Traffic đi qua một LB server trung gian:

```
Client ───▶ [ LB Server ] ───▶ Targets
                 ↑
          LB quyết định routing
```

| Môi trường | Giải pháp | Mô tả |
|------------|-----------|-------|
| **AWS** | ELB (ALB/NLB/GWLB) | Managed service, tính phí |
| **K8s** | Service, Ingress | Built-in, miễn phí trong cluster |
| **Spring** | ❌ Không có | Spring không cung cấp server LB |

### Client-side Load Balancing

LB logic nằm trong application code:

```
┌─────────────────────┐
│ Client              │───▶ Targets
│ [LB logic trong app]│
└─────────────────────┘
         ↑
   Client tự quyết định
```

| Môi trường | Giải pháp | Mô tả |
|------------|-----------|-------|
| **AWS** | ❌ Không có | AWS không cung cấp client-side LB |
| **K8s** | ❌ Không có native | Dùng Envoy sidecar, gRPC client |
| **Spring** | Spring Cloud LoadBalancer | Thư viện trong code |

### Ví dụ: Spring Cloud LoadBalancer + Eureka

**Câu hỏi:** Tại sao client-side LB không cần LB server riêng?

**Trả lời:** Vì LB logic là **thư viện trong code**, không phải server. Nhưng vẫn cần **Service Registry** (như Eureka) để biết danh sách targets.

```
┌─────────────────────────────────────────────────────────────────┐
│                     EUREKA ≠ LOAD BALANCER                      │
│                                                                 │
│   Eureka Server: "Tôi biết ai ở đâu" (lưu danh sách IP)         │
│   Spring Cloud LB: "Tôi chọn gọi ai"                            │
│ (logic trong code và lưu ở trong chính server chỉ dùng eruka để đông bộ về)│
│   → Eureka KHÔNG route traffic, chỉ cung cấp thông tin          │
└─────────────────────────────────────────────────────────────────┘
```

**Flow hoạt động:**

```
┌────────────────────┐
│   Eureka Server    │  ← Chỉ LƯU danh sách, KHÔNG route traffic
│                    │
│ user-service:      │
│   - 10.0.1.1:8080  │
│   - 10.0.1.2:8080  │
│   - 10.0.1.3:8080  │
└─────────┬──────────┘
          │
          │ ① Hỏi: "user-service ở đâu?"
          │ ② Trả: [10.0.1.1, 10.0.1.2, 10.0.1.3]
          │
          ▼
┌─────────────────────────┐              ┌─────────────────────┐
│     Order Service       │              │    User Service     │
│                         │              │    (3 instances)    │
│ ┌─────────────────────┐ │   ③ Gọi     │                     │
│ │ Spring Cloud LB     │ │   THẲNG!    │  ┌───────────────┐  │
│ │                     │ │ ───────────▶│  │  10.0.1.1     │  │
│ │ Cache:              │ │             │  ├───────────────┤  │
│ │  - 10.0.1.1 ✓      │ │             │  │  10.0.1.2     │  │
│ │  - 10.0.1.2        │ │             │  ├───────────────┤  │
│ │  - 10.0.1.3        │ │             │  │  10.0.1.3     │  │
│ │                     │ │             │  └───────────────┘  │
│ │ Chọn: 10.0.1.1     │ │             │                     │
│ │ (Round Robin)       │ │             │                     │
│ └─────────────────────┘ │             │                     │
└─────────────────────────┘             └─────────────────────┘

→ Traffic KHÔNG đi qua Eureka!
→ Order Service gọi THẲNG đến User Service
→ Eureka chỉ cung cấp danh sách IP
```

**So sánh Eureka vs ELB:**

| | Eureka (Service Registry) | ELB (Load Balancer) |
|--|---------------------------|---------------------|
| **Vai trò** | Lưu danh sách instances | Route traffic |
| **Traffic đi qua** | ❌ Không | ✅ Có |
| **Single point of failure** | Không (client có cache) | Có |
| **Chết thì sao** | Client dùng cache, vẫn gọi được | Mất kết nối hoàn toàn |

**Eureka chết thì sao?**

```
Eureka Server ❌ DOWN

┌─────────────────────────┐              ┌─────────────────────┐
│     Order Service       │              │    User Service     │
│                         │   Vẫn gọi    │                     │
│ ┌─────────────────────┐ │   được!     │                     │
│ │ Spring Cloud LB     │ │ ───────────▶│                     │
│ │                     │ │             │                     │
│ │ Cache (còn lưu):    │ │             │                     │
│ │  - 10.0.1.1        │ │             │                     │
│ │  - 10.0.1.2        │ │             │                     │
│ │  - 10.0.1.3        │ │             │                     │
│ └─────────────────────┘ │             │                     │
└─────────────────────────┘             └─────────────────────┘

→ Client cache danh sách instances
→ Vẫn hoạt động được (trong 1 thời gian)
→ Không có single point of failure!
```

**Tóm lại:**

| Component | Vai trò | Là server riêng? |
|-----------|---------|------------------|
| **Eureka** | Lưu danh sách IP | Có (nhưng không route traffic) |
| **Spring Cloud LB** | Chọn IP để gọi | Không (là thư viện trong code) |
| **ELB** | Route traffic | Có |

### So sánh

| Tiêu chí | Server-side | Client-side |
|----------|-------------|-------------|
| **LB ở đâu** | Server riêng biệt | Trong app code |
| **Single point of failure** | Có | Không |
| **Chi phí** | Tốn tiền (ELB, Nginx) | Miễn phí (là code) |
| **Latency** | Cao hơn (thêm 1 hop) | Thấp hơn (gọi thẳng) |
| **Phù hợp cho** | External traffic (FE→BE) | Internal traffic (BE→BE) |
| **Client cần biết targets** | Không | Có (từ Service Discovery) |

---

## Khi nào dùng loại nào?

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   FE → BE:     Chỉ server-side LB ✅                            │
│                (FE không có LB logic, chỉ biết 1 URL)           │
│                                                                 │
│   BE → BE:     Cả 2 đều được ✅                                 │
│                (Server-side HOẶC Client-side)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Traffic FE → BE

```
┌──────────┐
│ Browser  │
│ (FE)     │  FE không có Spring Cloud LB!
└────┬─────┘  FE chỉ biết 1 URL: api.example.com
     │
     ▼
┌─────────┐
│ AWS ELB │  ← BẮT BUỘC cần server-side LB
└────┬────┘
     │
     ▼
┌─────────┐
│ Backend │
└─────────┘
```

### Traffic BE → BE

```
┌───────────────────┐         ┌─────────────────┐
│ Order Service     │         │ User Service    │
│                   │         │ (3 instances)   │
│ ┌───────────────┐ │         │                 │
│ │Spring Cloud LB│─┼────────▶│ 10.0.1.1       │
│ │ Chọn 1 IP     │ │  Gọi    │ 10.0.1.2       │
│ └───────────────┘ │  thẳng! │ 10.0.1.3       │
└───────────────────┘         └─────────────────┘

→ Không qua ELB, tiết kiệm phí + giảm latency
```

---

## Spring Cloud LoadBalancer + Eureka

Spring Cloud LB cần **Service Registry** (Eureka) để biết danh sách instances:

```
┌────────────────┐
│ Eureka Server  │  ← Chỉ lưu danh sách, KHÔNG route traffic
│                │
│ user-service:  │
│  - 10.0.1.1    │
│  - 10.0.1.2    │
│  - 10.0.1.3    │
└───────┬────────┘
        │
        │ 1. Hỏi: "user-service ở đâu?"
        │ 2. Trả: [10.0.1.1, 10.0.1.2, 10.0.1.3]
        │
        ▼
┌───────────────────┐         ┌─────────────────┐
│ Order Service     │  3. Gọi │ User Service    │
│ ┌───────────────┐ │  thẳng! │                 │
│ │Spring Cloud LB│─┼────────▶│                 │
│ └───────────────┘ │         │                 │
└───────────────────┘         └─────────────────┘

→ Traffic KHÔNG đi qua Eureka
→ Eureka chỉ cung cấp thông tin
```

### Eureka vs ELB

| | Eureka (Service Registry) | ELB (Load Balancer) |
|--|---------------------------|---------------------|
| **Vai trò** | Lưu danh sách instances | Route traffic |
| **Traffic đi qua** | ❌ Không | ✅ Có |
| **Chết thì sao** | Client dùng cache, vẫn gọi được | Mất kết nối hoàn toàn |
| **Loại** | Registry server | Proxy server |

---

## Chi tiết theo môi trường

### AWS

```
┌─────────────────────────────────────────────────┐
│                    AWS                           │
├─────────────────────────────────────────────────┤
│ Server-side LB:                                 │
│   • ALB (Layer 7 - HTTP)                        │
│   • NLB (Layer 4 - TCP/UDP)                     │
│   • GWLB (Layer 3 - Firewalls)                  │
│                                                 │
│ Client-side LB:                                 │
│   • ❌ Không có native                          │
│   • Phải dùng Spring Cloud LB hoặc gRPC client │
│                                                 │
│ Service Discovery:                              │
│   • AWS Cloud Map                               │
│                                                 │
│ Auto Scaling:                                   │
│   • ASG (EC2 instances)                        │
│   • ECS Service Auto Scaling                   │
└─────────────────────────────────────────────────┘
```

### Kubernetes

```
┌─────────────────────────────────────────────────┐
│                 Kubernetes                       │
├─────────────────────────────────────────────────┤
│ Server-side LB:                                 │
│   • Service (ClusterIP) - internal             │
│   • Service (LoadBalancer) - external + cloud  │
│   • Service (NodePort) - external              │
│   • Ingress - Layer 7 routing                  │
│                                                 │
│ Client-side LB:                                 │
│   • ❌ Không có native                          │
│   • Envoy sidecar (Service Mesh - Istio)       │
│   • gRPC client-side LB                        │
│                                                 │
│ Service Discovery:                              │
│   • CoreDNS (built-in)                         │
│   • kube-proxy                                 │
│                                                 │
│ Auto Scaling:                                   │
│   • HPA (Horizontal Pod Autoscaler)            │
│   • VPA (Vertical Pod Autoscaler)              │
│   • Cluster Autoscaler (scale nodes)           │
└─────────────────────────────────────────────────┘
```

### Spring Cloud

```
┌─────────────────────────────────────────────────┐
│                Spring Cloud                      │
├─────────────────────────────────────────────────┤
│ Server-side LB:                                 │
│   • ❌ Không có                                  │
│   • Phải dùng Nginx, AWS ELB, K8s Service      │
│                                                 │
│ Client-side LB:                                 │
│   • Spring Cloud LoadBalancer                  │
│   • (cũ: Netflix Ribbon - deprecated)          │
│                                                 │
│ Service Discovery:                              │
│   • Eureka                                     │
│   • Consul                                     │
│   • AWS Cloud Map                              │
│                                                 │
│ Auto Scaling:                                   │
│   • ❌ Không có                                  │
│   • Phải dùng AWS ASG hoặc K8s HPA             │
└─────────────────────────────────────────────────┘
```

---

## So sánh Load Balancing

| Tiêu chí | AWS ELB | K8s Service/Ingress | Spring Cloud LB |
|----------|---------|---------------------|-----------------|
| **Layer** | Infrastructure | Container | Application (code) |
| **Loại** | Server-side | Server-side | **Client-side** |
| **Quản lý bởi** | AWS | K8s cluster | Application code |
| **Target** | EC2, IP, Lambda | Pods | Service instances |
| **Cần infra riêng** | Có (AWS resource) | Có (K8s cluster) | Không |
| **Chi phí** | Tính phí | Free trong cluster | Free (là code) |

---

## So sánh Auto Scaling

| Tiêu chí | AWS ASG | K8s HPA/VPA | Spring (không có) |
|----------|---------|-------------|-------------------|
| **Scale gì** | EC2 instances | Pods | ❌ Không scale |
| **Dựa trên** | CloudWatch metrics | Metrics Server | - |
| **Min/Max** | Có | Có | - |
| **Predictive** | Có | Không (cần KEDA) | - |

---

## Các kiến trúc Microservices phổ biến

### Kiến trúc 1: AWS Only (không K8s)

```
Internet or Client (FE)
    │
    ▼
┌─────────┐
│ AWS ALB │  ← Server-side LB
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    AWS ECS / EC2                         │
│                                                         │
│  ┌───────────┐    Spring Cloud LB    ┌───────────────┐ │
│  │API Gateway│ ─────────────────────▶│ User Service  │ │
│  │(ECS Task) │                       │ (3 tasks)     │ │
│  └───────────┘                       └───────┬───────┘ │
│                                              │         │
│                              ┌───────────────┘         │
│                              ▼                         │
│                       ┌───────────────┐                │
│                       │ Order Service │                │
│                       │ (3 tasks)     │                │
│                       └───────────────┘                │
│                                                        │
│  Service Discovery: AWS Cloud Map                      │
└─────────────────────────────────────────────────────────┘
```

**Cost estimate (3 services × 3 instances):**

| Component | Cost/tháng |
|-----------|------------|
| ALB | ~$20 + data |
| ECS Fargate (9 tasks × 0.5vCPU) | ~$150 |
| Cloud Map | ~$1 |
| **Tổng** | **~$170+** |

---

### Kiến trúc 2: K8s + K8s Service (không Spring Cloud LB)

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              EKS Cluster                                 │
│                                                         │
│  ┌──────────────────┐                                   │
│  │ AWS LB Controller│ → Tự tạo ALB                     │
│  └────────┬─────────┘                                   │
│           │                                             │
│           ▼                                             │
│  ┌─────────────┐      K8s Service     ┌─────────────┐  │
│  │ Ingress     │ ────────────────────▶│ User SVC    │  │
│  │             │      (ClusterIP)     │ (3 pods)    │  │
│  └─────────────┘                      └──────┬──────┘  │
│                                              │         │
│                              K8s Service     │         │
│                              (ClusterIP)     │         │
│                                              ▼         │
│                                       ┌─────────────┐  │
│                                       │ Order SVC   │  │
│                                       │ (3 pods)    │  │
│                                       └─────────────┘  │
│                                                        │
│  Service Discovery: CoreDNS (built-in, free)          │
└─────────────────────────────────────────────────────────┘
```

**Cost estimate:**

| Component | Cost/tháng |
|-----------|------------|
| ALB (auto-created) | ~$20 + data |
| EKS Control Plane | ~$75 |
| EC2 Nodes (3 × t3.medium) | ~$90 |
| CoreDNS, K8s Service | $0 (free) |
| **Tổng** | **~$185+** |

---

### Kiến trúc 3: K8s + Istio Service Mesh

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              EKS Cluster + Istio                         │
│                                                         │
│  ┌─────────────────┐                                    │
│  │ Istio Ingress   │  ← Thay thế K8s Ingress           │
│  │ Gateway         │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ User Service Pod                                │   │
│  │ ┌─────────────┐  ┌─────────────┐               │   │
│  │ │ App         │  │ Envoy Proxy │ ← Sidecar     │   │
│  │ │ Container   │◀▶│ (LB + mTLS) │               │   │
│  │ └─────────────┘  └──────┬──────┘               │   │
│  └─────────────────────────┼───────────────────────┘   │
│                            │                           │
│                            ▼ Client-side LB            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Order Service Pod                               │   │
│  │ ┌─────────────┐  ┌─────────────┐               │   │
│  │ │ App         │◀▶│ Envoy Proxy │               │   │
│  │ └─────────────┘  └─────────────┘               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  Features: mTLS, tracing, circuit breaker, retries    │
└─────────────────────────────────────────────────────────┘
```

**Cost estimate:**

| Component | Cost/tháng |
|-----------|------------|
| NLB (Istio Ingress) | ~$20 + data |
| EKS Control Plane | ~$75 |
| EC2 Nodes (3 × t3.large - cần RAM cho Envoy) | ~$180 |
| Istio | $0 (open source) |
| **Tổng** | **~$275+** |

---

### Kiến trúc 4: Serverless (Lambda + API Gateway)

```
Internet
    │
    ▼
┌─────────────────┐
│ API Gateway     │  ← Managed, auto-scale
│ (HTTP API)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                    AWS Lambda                            │
│                                                         │
│  ┌───────────────┐       ┌───────────────┐             │
│  │ User Function │       │ Order Function│             │
│  │ (auto-scale)  │◀─────▶│ (auto-scale)  │             │
│  └───────────────┘  SDK  └───────────────┘             │
│         │           call          │                     │
│         │                         │                     │
│         ▼                         ▼                     │
│  ┌───────────────────────────────────────┐             │
│  │            DynamoDB                    │             │
│  └───────────────────────────────────────┘             │
│                                                        │
│  No LB needed! API Gateway + Lambda = auto-scale      │
└─────────────────────────────────────────────────────────┘
```

**Cost estimate (1M requests/tháng):**

| Component | Cost/tháng |
|-----------|------------|
| API Gateway | ~$3.50 |
| Lambda (1M invocations) | ~$0.20 |
| DynamoDB | ~$5 |
| **Tổng** | **~$10** |

---

### Kiến trúc 5: AWS + K8s + Spring (Full Stack)

```
Internet
    │
    ▼
┌─────────┐
│ AWS ALB │ ← Server-side (external traffic)
└────┬────┘    + WAF, Shield, ACM
     │
     ▼
┌─────────────────────────────────────────────────────┐
│              Kubernetes Cluster                      │
│                                                     │
│  ┌─────────────┐                                    │
│  │ K8s Ingress │ ← Server-side (routing rules)     │
│  └──────┬──────┘                                    │
│         │                                           │
│         ▼                                           │
│  ┌─────────────┐      ┌─────────────┐              │
│  │ API Gateway │─────▶│ User Service│              │
│  │ (Pod)       │      │ (Pod)       │              │
│  │             │      │ ┌─────────┐ │              │
│  │             │      │ │Spring   │ │              │
│  │             │      │ │Cloud LB │─┼──┐           │
│  │             │      │ └─────────┘ │  │           │
│  └─────────────┘      └─────────────┘  │           │
│                                        │           │
│                              ┌─────────┘           │
│                              ▼                     │
│                       ┌─────────────┐              │
│                       │Order Service│              │
│                       │ (3 Pods)    │              │
│                       └─────────────┘              │
│                              ↑                     │
│                    Client-side LB                  │
│                    (Spring Cloud, gọi thẳng)       │
└─────────────────────────────────────────────────────┘
```

---

## Bảng so sánh tổng hợp

| Tiêu chí | AWS Only | K8s + Service | K8s + Istio | Serverless |
|----------|----------|---------------|-------------|------------|
| **Cost/tháng** | ~$170+ | ~$185+ | ~$275+ | ~$10+ |
| **Complexity** | Trung bình | Trung bình | Cao | Thấp |
| **Auto-scale** | ASG | HPA | HPA | Tự động |
| **Service-to-service LB** | Spring Cloud | K8s Service | Envoy (client-side) | SDK call |
| **mTLS** | Tự config | Tự config | Built-in | Managed |
| **Observability** | CloudWatch | Prometheus | Kiali, Jaeger | X-Ray |
| **Vendor lock-in** | Cao | Thấp | Thấp | Cao |
| **Cold start** | Không | Không | Không | Có |
| **Phù hợp** | Đội quen AWS | Đội quen K8s | Cần advanced features | Traffic không đều |

---

## So sánh Cost chi tiết

```
Traffic: 10M requests/tháng, 3 services × 3 instances

┌────────────────┬─────────────────────────────────────────┐
│                │              Cost/tháng                 │
│   Kiến trúc    ├─────────┬─────────┬─────────┬──────────┤
│                │ Compute │   LB    │  Other  │  Total   │
├────────────────┼─────────┼─────────┼─────────┼──────────┤
│ AWS ECS        │  $150   │  $25    │  $5     │  ~$180   │
├────────────────┼─────────┼─────────┼─────────┼──────────┤
│ K8s + Service  │  $165   │  $25    │  $0     │  ~$190   │
├────────────────┼─────────┼─────────┼─────────┼──────────┤
│ K8s + Istio    │  $255   │  $25    │  $0     │  ~$280   │
├────────────────┼─────────┼─────────┼─────────┼──────────┤
│ Serverless     │  $2     │  $35    │  $10    │  ~$50    │
│ (Lambda)       │         │ (APIGW) │ (DynamoDB)         │
└────────────────┴─────────┴─────────┴─────────┴──────────┘

* Serverless rẻ nhất với traffic thấp-trung bình
* Traffic cao → Container/EC2 rẻ hơn Lambda
```

---

## Decision Tree: Chọn kiến trúc nào?

```
                         │
              Traffic pattern?
                         │
         ┌───────────────┴───────────────┐
         │                               │
    Không đều,                      Ổn định,
    burst nhiều                     predictable
         │                               │
         ▼                               ▼
    ┌──────────┐                 Team experience?
    │Serverless│                         │
    │ (Lambda) │              ┌──────────┴──────────┐
    └──────────┘              │                     │
                         Quen AWS              Quen K8s
                              │                     │
                              ▼                     ▼
                    ┌──────────────┐        ┌─────────────┐
                    │ AWS ECS/EC2  │        │    EKS      │
                    │ + Spring Cloud│        │ + K8s Service│
                    └──────────────┘        └──────┬──────┘
                                                   │
                                           Cần mTLS, tracing?
                                                   │
                                           ┌───────┴───────┐
                                           │               │
                                          Yes             No
                                           │               │
                                           ▼               ▼
                                    ┌──────────┐    ┌──────────┐
                                    │  Istio   │    │ K8s only │
                                    └──────────┘    └──────────┘
```

---

## Tại sao cần AWS ALB trước K8s?

K8s có thể tự tạo LB, nhưng có trường hợp cần ALB riêng:

### Cách 1: K8s tự tạo LB (đơn giản)

```
Internet → K8s Service (LoadBalancer) → AWS tự tạo ELB
```

### Cách 2: ALB riêng phía trước (enterprise)

```
Internet → AWS ALB → K8s Ingress → Pods
```

**Lý do chọn Cách 2:**

| Lý do | Giải thích |
|-------|------------|
| **AWS WAF** | Web Application Firewall - chặn SQL injection, XSS |
| **AWS Shield** | DDoS protection |
| **ACM** | Quản lý SSL certificates dễ hơn |
| **Multi-cluster** | 1 ALB cho nhiều K8s clusters |
| **Hybrid** | Traffic đến cả K8s + EC2 + Lambda |
| **Compliance** | Logging, audit theo yêu cầu enterprise |

---

## Liên kết

- [ELB](elb.md) - AWS Elastic Load Balancing
- [ASG](asg.md) - AWS Auto Scaling Group
- [EC2](ec2.md) - Compute instances
- [VPC](vpc.md) - Networking
