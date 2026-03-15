# Amazon EKS (Elastic Kubernetes Service)


## Mục lục

- [Tổng quan](#tổng-quan)
- [EKS vs Tự cài Kubernetes](#eks-vs-tự-cài-kubernetes)
- [️ Kiến trúc EKS](#kiến-trúc-eks)
- [Kubernetes Core Concepts](#kubernetes-core-concepts)
- [EKS Node Types](#eks-node-types)
- [EKS Integrations với AWS](#eks-integrations-với-aws)
- [EKS Cluster Setup](#eks-cluster-setup)
- [EKS vs ECS - Khi nào dùng cái nào?](#eks-vs-ecs-khi-nào-dùng-cái-nào)
- [Production Best Practices](#production-best-practices)
- [Monitoring & Logging](#monitoring-logging)
- [Tổng kết](#tổng-kết)
- [Resources hữu ích](#resources-hữu-ích)

---

## Tổng quan

**Amazon EKS (Elastic Kubernetes Service)** là dịch vụ Kubernetes được AWS quản lý hoàn toàn (fully managed). EKS giúp bạn chạy Kubernetes trên AWS mà không cần cài đặt, vận hành và maintain Kubernetes control plane.

### Kubernetes là gì?

```
┌─────────────────────────────────────────────────────────────────────┐
│                      KUBERNETES (K8s)                               │
│                                                                     │
│   = Hệ thống ORCHESTRATION cho containers                           │
│   = "Bộ não" điều khiển hàng ngàn containers                        │
│   = Open-source, được Google phát triển ban đầu                     │
│                                                                     │
│   Kubernetes làm gì?                                                │
│   ├── Scheduling: Container nào chạy ở đâu?                         │
│   ├── Scaling: Tự động scale containers lên/xuống                   │
│   ├── Healing: Restart containers bị lỗi                            │
│   ├── Load Balancing: Phân phối traffic                             │
│   ├── Service Discovery: Containers tìm thấy nhau                   │
│   └── Rolling Updates: Deploy version mới không downtime            │
└─────────────────────────────────────────────────────────────────────┘
```

### Tại sao K8s phổ biến?

| Tiêu chí | Docker Swarm | Kubernetes |
|----------|--------------|------------|
| **Độ phức tạp** | ✅ Đơn giản | ❌ Phức tạp hơn |
| **Tính năng** | Cơ bản | ✅ Toàn diện |
| **Hệ sinh thái** | Nhỏ | ✅ Khổng lồ (CNCF) |
| **Enterprise adoption** | Ít | ✅ 96% Fortune 500 |
| **Community** | Nhỏ | ✅ Lớn nhất |

> 💡 K8s đã trở thành **industry standard** cho container orchestration!

---

## EKS vs Tự cài Kubernetes

### Tự quản lý Kubernetes

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SELF-MANAGED KUBERNETES                           │
│                                                                     │
│   Bạn phải lo:                                                      │
│   ├── Cài đặt K8s cluster (kubeadm, kops, kubespray)                │
│   ├── Setup etcd cluster (distributed state store)                  │
│   ├── Cấu hình API server, scheduler, controller-manager            │
│   ├── Setup network plugin (Calico, Flannel, Weave)                 │
│   ├── TLS certificates cho tất cả components                        │
│   ├── Upgrade K8s version (có thể breaking changes!)                │
│   ├── Backup & restore etcd                                         │
│   ├── High Availability cho control plane                           │
│   └── Security patches                                              │
│                                                                     │
│   ⏰ Setup: 1-2 tuần                                                │
│   👨‍💻 Cần: Senior DevOps/Platform Engineer                           │
│   💰 Chi phí ẩn: Operations, maintenance, on-call                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Amazon EKS

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AMAZON EKS                                   │
│                                                                     │
│   AWS lo (Control Plane):                     Bạn lo (Data Plane):  │
│   ├── API Server                              ├── Worker nodes      │
│   ├── etcd cluster                            ├── Applications      │
│   ├── Scheduler                               ├── Pods, Services    │
│   ├── Controller Manager                      └── Container images  │
│   ├── Updates & patches                                             │
│   ├── HA across 3 AZs                                               │
│   └── Backup & security                                             │
│                                                                     │
│   ⏰ Setup: 15-30 phút                                              │
│   👨‍💻 Cần: Biết K8s concepts                                         │
│   💰 Chi phí: $0.10/hour cho control plane + worker nodes           │
└─────────────────────────────────────────────────────────────────────┘
```

### So sánh tổng quan

| Tiêu chí | Self-managed K8s | Amazon EKS |
|----------|------------------|------------|
| **Control plane** | Bạn quản lý | AWS quản lý |
| **High Availability** | Tự setup | Built-in (3 AZs) |
| **Upgrades** | Phức tạp, rủi ro | 1-click hoặc managed |
| **Integration AWS** | Tự cấu hình | Native (ALB, IAM, VPC) |
| **Chi phí control plane** | EC2 costs | $0.10/hour |
| **Compliance** | Tự chứng minh | SOC, PCI, HIPAA ready |

---

## Kiến trúc EKS

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS CLOUD                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    EKS CONTROL PLANE                        │    │
│  │                   (AWS Managed - ẨN)                        │    │
│  │                                                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │    │
│  │  │ API      │  │ etcd     │  │ Scheduler│                   │    │
│  │  │ Server   │  │ Cluster  │  │          │                   │    │
│  │  └──────────┘  └──────────┘  └──────────┘                   │    │
│  │                                                             │    │
│  │  ┌──────────────────────────────────────────┐               │    │
│  │  │        Controller Manager                 │              │    │
│  │  └──────────────────────────────────────────┘               │    │
│  │                                                             │    │
│  │  🔒 Runs across 3 AZs, fully managed by AWS                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                             │                                       │
│                              │ kubectl / API calls                  │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    EKS DATA PLANE                           │    │
│  │                   (Your VPC - Bạn quản lý)                  │    │
│  │                                                             │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                   │    │
│  │  │  Worker Node     │  │  Worker Node     │                 │    │
│  │  │  (EC2/Fargate)   │  │  (EC2/Fargate)   │                 │    │
│  │  │  ┌─────┐┌─────┐ │  │  ┌─────┐┌─────┐ │                   │    │
│  │  │  │ Pod ││ Pod │ │  │  │ Pod ││ Pod │ │                   │    │
│  │  │  └─────┘└─────┘ │  │  └─────┘└─────┘ │                   │    │
│  │  └─────────────────┘  └─────────────────┘                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📘 Kubernetes Core Concepts

### 1. Pod - Đơn vị nhỏ nhất

```
┌──────────────────────────────────────────────────────────────────────┐
│                             POD                                      │
│                                                                      │
│   = Đơn vị deploy nhỏ nhất trong K8s                                 │
│   = Wrapper xung quanh 1 hoặc nhiều containers                       │
│   = Có IP riêng trong cluster                                        │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                        POD                                  │    │
│   │  ┌─────────────────┐  ┌─────────────────┐                    │   │
│   │  │   Container     │  │   Container     │                    │   │
│   │  │   (app)         │  │   (sidecar)     │                    │   │
│   │  └─────────────────┘  └─────────────────┘                    │   │
│   │                                                             │    │
│   │  Shared:                                                    │    │
│   │  ├── Network namespace (cùng IP, localhost)                 │    │
│   │  ├── Storage volumes                                        │    │
│   │  └── Lifecycle (sống chết cùng nhau)                         │   │
│   │                                                             │    │
│   │  IP: 10.0.0.15 (cluster internal)                           │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ⚠️ Pod là EPHEMERAL - có thể bị xóa và tạo mới bất cứ lúc nào!     │
└──────────────────────────────────────────────────────────────────────┘
```

**Pod manifest ví dụ:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: web
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

---

### 2. Deployment - Quản lý Pods

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DEPLOYMENT                                 │
│                                                                     │
│   = Quản lý việc deploy và scale Pods                               │
│   = Đảm bảo số lượng Pods mong muốn luôn chạy                       │
│   = Hỗ trợ rolling updates, rollbacks                               │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     DEPLOYMENT: my-app                      │   │
│   │                     replicas: 3                             │   │
│   │                                                             │   │
│   │  ┌──────────────────────────────────────────────────────┐   │   │
│   │  │                    REPLICASET                         │  │   │
│   │  │                                                       │  │   │
│   │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐               │   │   │
│   │  │  │  Pod 1  │  │  Pod 2  │  │  Pod 3  │               │   │   │
│   │  │  │ nginx   │  │ nginx   │  │ nginx   │               │   │   │
│   │  │  └─────────┘  └─────────┘  └─────────┘               │   │   │
│   │  └──────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Pod chết → ReplicaSet tạo Pod mới → Luôn có 3 Pods!               │
└─────────────────────────────────────────────────────────────────────┘
```

**Deployment manifest ví dụ:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:v1.0.0
        ports:
        - containerPort: 8080
```

---

### 3. Service - Networking abstraction

```
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVICE                                   │
│                                                                     │
│   = Stable endpoint để truy cập Pods                                │
│   = Pods có IP thay đổi, Service có IP cố định                      │
│   = Load balancing giữa các Pods                                    │
│                                                                     │
│   Vấn đề:                                                           │
│   ┌───────────┐                                                     │
│   │ Pod A     │ IP: 10.0.0.15 → Pod chết → IP mất!                  │
│   └───────────┘                                                     │
│   ┌───────────┐                                                     │
│   │ Pod A'    │ IP: 10.0.0.47 → Pod mới, IP khác!                   │
│   └───────────┘                                                     │
│                                                                     │
│   Giải pháp: SERVICE                                                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                  SERVICE: my-app-svc                        │   │
│   │                  ClusterIP: 10.100.50.20 (cố định!)         │   │
│   │                  Port: 80                                   │   │
│   │                                                             │   │
│   │            ┌──────────┬──────────┬──────────┐               │   │
│   │            ▼          ▼          ▼                          │   │
│   │       ┌─────────┐┌─────────┐┌─────────┐                     │   │
│   │       │  Pod 1  ││  Pod 2  ││  Pod 3  │                     │   │
│   │       │10.0.0.15││10.0.0.16││10.0.0.17│                     │   │
│   │       └─────────┘└─────────┘└─────────┘                     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Client gọi: my-app-svc:80 → Service route tới 1 trong 3 Pods      │
└─────────────────────────────────────────────────────────────────────┘
```

**Các loại Service:**

| Type | Mô tả | Use case |
|------|-------|----------|
| **ClusterIP** | Internal IP, chỉ trong cluster | Microservices gọi nhau |
| **NodePort** | Expose trên port của Node | Dev/testing |
| **LoadBalancer** | Tạo external LB (cloud) | Production, external traffic |

**Service manifest ví dụ:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
```

---

### 4. Namespace - Logical separation

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KUBERNETES CLUSTER                          │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │   NAMESPACE: dev     │  │   NAMESPACE: prod    │                 │
│  │                      │  │                      │                 │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │                 │
│  │  │ Deployment:    │  │  │  │ Deployment:    │  │                 │
│  │  │ my-app         │  │  │  │ my-app         │  │                 │
│  │  │ (3 replicas)   │  │  │  │ (10 replicas)  │  │                 │
│  │  └────────────────┘  │  │  └────────────────┘  │                 │
│  │                      │  │                      │                 │
│  │  Resource quotas:    │  │  Resource quotas:    │                 │
│  │  CPU: 4 cores        │  │  CPU: 32 cores       │                 │
│  │  Memory: 8Gi         │  │  Memory: 64Gi        │                 │
│  │                      │  │                      │                 │
│  └──────────────────────┘  └──────────────────────┘                 │
│                                                                     │
│  ✅ Cùng tên "my-app" nhưng hoàn toàn tách biệt!                    │
│  ✅ Resource quotas khác nhau                                       │
│  ✅ RBAC (quyền truy cập) khác nhau                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5. ConfigMap & Secret

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONFIGMAP & SECRET                               │
│                                                                     │
│   ConfigMap = Lưu config không nhạy cảm                             │
│   Secret = Lưu data nhạy cảm (encoded base64)                       │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ConfigMap: app-config                                      │   │
│   │  ├── DATABASE_HOST=mydb.example.com                         │   │
│   │  ├── LOG_LEVEL=info                                         │   │
│   │  └── FEATURE_FLAG=true                                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Secret: app-secrets                                        │   │
│   │  ├── DATABASE_PASSWORD=c2VjcmV0cGFzcw==                     │   │
│   │  └── API_KEY=YXBpLWtleS0xMjM0NQ==                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Inject vào Pod như environment variables hoặc volume mounts       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 6. Ingress - HTTP routing

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INGRESS                                   │
│                                                                     │
│   = HTTP/HTTPS routing vào cluster                                  │
│   = Host-based và path-based routing                                │
│   = SSL/TLS termination                                             │
│                                                                     │
│                      Internet                                       │
│                         │                                           │
│                          ▼                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              INGRESS CONTROLLER (ALB)                       │   │
│   │                                                             │   │
│   │  Rules:                                                     │   │
│   │  ├── api.example.com → Service: api-svc                     │   │
│   │  ├── web.example.com → Service: web-svc                     │   │
│   │  └── example.com/admin → Service: admin-svc                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                    │           │          │                         │
│                    ▼           ▼           ▼                        │
│              ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│              │ api-svc │ │ web-svc │ │admin-svc│                    │
│              │  Pods   │ │  Pods   │ │  Pods   │                    │
│              └─────────┘ └─────────┘ └─────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

**Ingress manifest ví dụ:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 80
```

---

## EKS Node Types

### EC2 Managed Node Groups

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EKS MANAGED NODE GROUPS                          │
│                                                                     │
│   = EC2 instances AWS quản lý                                       │
│   = Tự động provisioning, updates, scaling                          │
│   = Sử dụng EKS-optimized AMI                                       │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                  NODE GROUP: general-purpose                │   │
│   │                                                             │   │
│   │  Instance type: m5.large                                    │   │
│   │  Min: 2, Max: 10, Desired: 3                                │   │
│   │                                                             │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│   │  │   Node 1    │  │   Node 2    │  │   Node 3    │          │   │
│   │  │  m5.large   │  │  m5.large   │  │  m5.large   │          │   │
│   │  │ (AZ-a)      │  │ (AZ-b)      │  │ (AZ-c)      │          │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   AWS lo:                              Bạn lo:                      │
│   ├── Provisioning EC2               ├── Chọn instance type         │
│   ├── Join nodes vào cluster         ├── Scaling policies           │
│   ├── AMI updates                    └── Application deployment     │
│   └── Drain & replace nodes                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Self-managed Node Groups

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SELF-MANAGED NODE GROUPS                          │
│                                                                     │
│   = Bạn tự quản lý EC2 instances                                    │
│   = Flexibility cao nhất                                            │
│   = Cần expertise nhiều hơn                                         │
│                                                                     │
│   Khi nào dùng?                                                     │
│   ├── Custom AMI requirements                                       │
│   ├── GPU instances (p3, g4)                                        │
│   ├── Spot instances (cost saving)                                  │
│   └── Special networking needs                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### EKS Fargate

```
┌──────────────────────────────────────────────────────────────────────┐
│                        EKS FARGATE                                   │
│                                                                      │
│   = Serverless compute cho Kubernetes                                │
│   = Không cần quản lý nodes                                          │
│   = Pay-per-pod (theo CPU/Memory sử dụng)                            │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                  FARGATE PROFILE                            │    │
│   │                                                             │    │
│   │  Selector:                                                  │    │
│   │  ├── namespace: production                                  │    │
│   │  └── labels: compute=fargate                                 │   │
│   │                                                             │    │
│   │  Pods matching → Run on Fargate automatically!              │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                              │
│   │  Pod 1  │  │  Pod 2  │  │  Pod 3  │                              │
│   │ Fargate │  │ Fargate │  │ Fargate │                              │
│   │ (ẩn)    │  │ (ẩn)    │  │ (ẩn)    │                              │
│   └─────────┘  └─────────┘  └─────────┘                              │
│                                                                      │
│   ✅ No nodes to manage                                              │
│   ✅ Right-sized per pod                                             │
│   ⚠️ Một số giới hạn (DaemonSets, privileged pods)                   │
└──────────────────────────────────────────────────────────────────────┘
```

### So sánh Node Types

| Tiêu chí | Managed Node Group | Self-managed | Fargate |
|----------|-------------------|--------------|---------|
| **Quản lý** | AWS | Bạn | AWS |
| **Scaling** | Tự động | Tự cấu hình | Per-pod |
| **Cost** | EC2 pricing | EC2 pricing | Per vCPU/GB/s |
| **Flexibility** | Trung bình | Cao nhất | Thấp |
| **DaemonSets** | ✅ | ✅ | ❌ |
| **GPU support** | ✅ | ✅ | ❌ |
| **Best for** | General workloads | Custom needs | Stateless apps |

---

## 🔌 EKS Integrations với AWS

### AWS Load Balancer Controller

```
┌─────────────────────────────────────────────────────────────────────┐
│               AWS LOAD BALANCER CONTROLLER                          │
│                                                                     │
│   = Tự động provision ALB/NLB từ K8s resources                      │
│   = Ingress → ALB                                                   │
│   = Service type LoadBalancer → NLB                                 │
│                                                                     │
│                    ┌─────────────────────┐                          │
│                    │   K8s Ingress       │                          │
│                    │   (yaml manifest)   │                          │
│                    └──────────┬──────────┘                          │
│                             │                                       │
│                               ▼                                     │
│                    ┌─────────────────────┐                          │
│                    │  AWS LB Controller  │                          │
│                    │  (watches & acts)   │                          │
│                    └──────────┬──────────┘                          │
│                             │                                       │
│                               ▼                                     │
│                    ┌─────────────────────┐                          │
│                    │   Application       │                          │
│                    │   Load Balancer     │                          │
│                    │   (auto created!)   │                          │
│                    └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

### IAM Roles for Service Accounts (IRSA)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 IAM ROLES FOR SERVICE ACCOUNTS                      │
│                                                                     │
│   = Fine-grained IAM permissions cho Pods                           │
│   = Không cần hardcode AWS credentials                              │
│   = Mỗi Pod có IAM Role riêng (thay vì node-level)                  │
│                                                                     │
│   Trước IRSA:                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Node IAM Role: Admin access (quá nhiều quyền!)             │   │
│   │                                                             │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │   │
│   │  │ Pod A   │  │ Pod B   │  │ Pod C   │  ← Tất cả dùng       │   │
│   │  │ S3 only │  │ RDS only│  │ SQS only│    cùng IAM Role!    │   │
│   │  └─────────┘  └─────────┘  └─────────┘                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Với IRSA:                                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │   │
│   │  │ Pod A   │  │ Pod B   │  │ Pod C   │                      │   │
│   │  │ Role:S3 │  │ Role:RDS│  │Role:SQS │  ← Mỗi Pod có        │   │
│   │  └─────────┘  └─────────┘  └─────────┘    IAM Role riêng!   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ✅ Least privilege principle                                      │
│   ✅ Pod identity                                                   │
│   ✅ Audit trong CloudTrail                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Secrets Manager Integration

```yaml
# ExternalSecret CRD - sync từ AWS Secrets Manager vào K8s Secret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: db-secret            # K8s Secret name
  data:
  - secretKey: password
    remoteRef:
      key: prod/database       # AWS Secrets Manager key
      property: password
```

---

## EKS Cluster Setup

### Tạo EKS Cluster với eksctl

```bash
# Cài đặt eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Tạo cluster cơ bản
eksctl create cluster \
  --name my-cluster \
  --version 1.28 \
  --region ap-southeast-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed
```

### Tạo Cluster với Terraform

```hcl
# main.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "my-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      min_size     = 2
      max_size     = 10
      desired_size = 3

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }
}
```

### Kết nối tới Cluster

```bash
# Update kubeconfig
aws eks update-kubeconfig --name my-cluster --region ap-southeast-1

# Verify connection
kubectl get nodes
kubectl cluster-info
```

---

## EKS vs ECS - Khi nào dùng cái nào?

```
┌─────────────────────────────────────────────────────────────────────┐
│                       EKS vs ECS                                    │
│                                                                     │
│   ECS                              EKS                              │
│   ┌───────────────────┐            ┌───────────────────┐            │
│   │ AWS Proprietary   │            │ Open Source K8s   │            │
│   │                   │            │                   │            │
│   │ ✅ Simpler        │            │ ✅ Portable       │            │
│   │ ✅ Less learning  │            │ ✅ Rich ecosystem │            │
│   │ ✅ Lower cost     │            │ ✅ Industry std   │            │
│   │                   │            │                   │            │
│   │ ❌ AWS lock-in    │            │ ❌ More complex   │            │
│   │ ❌ Limited tools  │            │ ❌ Steeper curve  │            │
│   └───────────────────┘            └───────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### Decision Matrix

| Tiêu chí | Chọn ECS | Chọn EKS |
|----------|----------|----------|
| **Team size** | Nhỏ, ít DevOps | Có dedicated platform team |
| **K8s experience** | Không/ít | Đã có kinh nghiệm |
| **Multi-cloud** | Không cần | Cần portability |
| **Ecosystem** | AWS-native đủ | Cần Helm, Prometheus, etc. |
| **Learning curve** | Muốn nhanh | Sẵn sàng đầu tư |
| **Cost sensitivity** | Quan trọng | Có budget cho $0.10/hr |

### Khi nào chọn EKS?

1. **Đã dùng K8s on-prem** → Migrate lên EKS dễ dàng
2. **Multi-cloud strategy** → Code K8s chạy được AWS, GCP, Azure
3. **Rich ecosystem needs** → Helm charts, operators, service mesh
4. **Industry compliance** → Một số compliance yêu cầu K8s
5. **Team expertise** → Đã có K8s skills

### Khi nào chọn ECS?

1. **Simple container needs** → Không cần K8s complexity
2. **AWS-focused** → Không cần multi-cloud
3. **Small team** → Ít người quản lý infrastructure
4. **Cost conscious** → Không muốn trả $0.10/hr cho control plane
5. **New to containers** → Learning curve thấp hơn

---

## Production Best Practices

### 1. Cluster Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                 PRODUCTION EKS ARCHITECTURE                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                        VPC                                  │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │                  PUBLIC SUBNETS                       │  │    │
│  │  │  ┌─────────────────────────────────────────────────┐ │   │    │
│  │  │  │          Application Load Balancer              │ │   │    │
│  │  │  └─────────────────────────────────────────────────┘ │   │    │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │    │    │
│  │  │  │ NAT GW (a) │  │ NAT GW (b) │  │ NAT GW (c) │     │    │    │
│  │  │  └────────────┘  └────────────┘  └────────────┘     │    │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │                                                             │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │                 PRIVATE SUBNETS                       │  │    │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐         │   │    │
│  │  │  │  Node     │  │  Node     │  │  Node     │         │   │    │
│  │  │  │  (AZ-a)   │  │  (AZ-b)   │  │  (AZ-c)   │         │   │    │
│  │  │  │ ┌─────┐   │  │ ┌─────┐   │  │ ┌─────┐   │         │   │    │
│  │  │  │ │Pods │   │  │ │Pods │   │  │ │Pods │   │         │   │    │
│  │  │  │ └─────┘   │  │ └─────┘   │  │ └─────┘   │         │   │    │
│  │  │  └───────────┘  └───────────┘  └───────────┘         │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✅ Nodes trong private subnets                                     │
│  ✅ ALB trong public subnets                                        │
│  ✅ NAT Gateway cho outbound traffic                                │
│  ✅ Multi-AZ cho high availability                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Security Best Practices

```yaml
# Network Policy - Restrict Pod-to-Pod traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - port: 5432
```

### 3. Resource Quotas

```yaml
# Giới hạn resources per namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
    pods: "100"
```

### 4. Pod Disruption Budgets

```yaml
# Đảm bảo luôn có min pods running
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api
```

---

## Monitoring & Logging

### CloudWatch Container Insights

```
┌─────────────────────────────────────────────────────────────────────┐
│               CLOUDWATCH CONTAINER INSIGHTS                         │
│                                                                     │
│   = Metrics và logs từ EKS vào CloudWatch                           │
│   = Pre-built dashboards                                            │
│   = Automatic alarms                                                │
│                                                                     │
│   Metrics thu thập:                                                 │
│   ├── CPU/Memory utilization (cluster, node, pod)                   │
│   ├── Network I/O                                                   │
│   ├── Storage utilization                                           │
│   ├── Container restart counts                                      │
│   └── Pod scheduling status                                         │
│                                                                     │
│   Enable:                                                           │
│   aws eks update-cluster-config \                                   │
│     --name my-cluster \                                             │
│     --logging '{"clusterLogging":[{"types":["api","audit",          │
│                 "authenticator","controllerManager","scheduler"],   │
│                 "enabled":true}]}'                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Prometheus & Grafana Stack

```yaml
# Sử dụng Helm để install
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

---

## Tổng kết

### EKS Core Concepts

| Concept | K8s | EKS specifics |
|---------|-----|---------------|
| **Cluster** | K8s cluster | AWS managed control plane |
| **Nodes** | Worker machines | EC2, Fargate, Self-managed |
| **Pods** | Container wrapper | Same |
| **Deployments** | Pod management | Same |
| **Services** | Networking | Can create AWS ALB/NLB |
| **Ingress** | HTTP routing | AWS ALB Ingress Controller |

### Khi nào dùng EKS?

✅ Đã có kinh nghiệm K8s
✅ Cần multi-cloud portability
✅ Cần rich K8s ecosystem (Helm, Operators)
✅ Enterprise-grade container orchestration
✅ Complex microservices architectures

### Chi phí EKS

| Component | Cost |
|-----------|------|
| **Control plane** | $0.10/hour (~$73/month) |
| **Worker nodes** | EC2 pricing |
| **Fargate** | vCPU + Memory pricing |
| **Data transfer** | Standard AWS rates |

---

## Resources hữu ích

- [EKS Documentation](https://docs.aws.amazon.com/eks/)
- [eksctl - Official CLI](https://eksctl.io/)
- [EKS Workshop](https://www.eksworkshop.com/)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
