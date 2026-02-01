# Elastic Load Balancing (ELB)


## Mục lục

- [Tổng quan](#tổng-quan)
  - [ELB Scope: Regional Service](#elb-scope-regional-service)
  - [Cross-Region Load Balancing](#cross-region-load-balancing)
- [Các loại Load Balancer](#các-loại-load-balancer)
- [Application Load Balancer (ALB)](#application-load-balancer-alb)
- [Network Load Balancer (NLB)](#network-load-balancer-nlb)
- [Gateway Load Balancer (GWLB)](#gateway-load-balancer-gwlb)
- [Các thành phần chính](#các-thành-phần-chính)
- [Health Checks](#health-checks)
- [Cross-Zone Load Balancing](#cross-zone-load-balancing)
- [Connection Draining (Deregistration Delay)](#connection-draining-deregistration-delay)
- [SSL/TLS Certificates](#ssltls-certificates)
- [Tích hợp với Auto Scaling](#tích-hợp-với-auto-scaling)
- [Pricing](#pricing)
- [Liên kết](#liên-kết)

---

## Tổng quan

**Elastic Load Balancing (ELB)** là dịch vụ của AWS tự động phân phối traffic đến nhiều targets (EC2 instances, containers, IP addresses, Lambda functions) để đảm bảo **high availability** và **scalability** cho ứng dụng.

> **Nguồn:** [ELB User Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/)

### ELB Scope: Regional Service

ELB là **Regional service**, hoạt động trong **1 Region** và có thể span **nhiều AZ**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGION (ap-southeast-1)                       │
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                         ELB                                │ │
│   │              (1 ELB, span nhiều AZ trong region)          │ │
│   └───────────────────────────────────────────────────────────┘ │
│              │                    │                    │        │
│              ▼                    ▼                    ▼        │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│   │      AZ-1a      │  │      AZ-1b      │  │      AZ-1c      ││
│   │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  ││
│   │  │   EC2     │  │  │  │   EC2     │  │  │  │   EC2     │  ││
│   │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  ││
│   └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

| Câu hỏi | Trả lời |
|---------|---------|
| ELB là Global? | ❌ Không |
| ELB là Regional? | ✅ **Có** |
| ELB span nhiều AZ? | ✅ Có (trong cùng region) |
| ELB cross-region? | ❌ Không thể route đến targets ở region khác |

### Cross-Region Load Balancing

Nếu cần load balance **cross-region**, dùng **Global service** đứng phía trước:

```
                            User Request
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  GLOBAL SERVICE          │
                    │  • Route 53 (DNS)        │
                    │  • Global Accelerator    │
                    │  • CloudFront            │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                                   ▼
   ┌──────────────────────┐           ┌──────────────────────┐
   │   REGION 1 (Seoul)   │           │  REGION 2 (Tokyo)    │
   │   ┌──────────────┐   │           │   ┌──────────────┐   │
   │   │     ALB      │   │           │   │     ALB      │   │
   │   └──────┬───────┘   │           │   └──────┬───────┘   │
   │          ▼           │           │          ▼           │
   │   ┌────┐ ┌────┐      │           │   ┌────┐ ┌────┐      │
   │   │EC2 │ │EC2 │      │           │   │EC2 │ │EC2 │      │
   │   └────┘ └────┘      │           │   └────┘ └────┘      │
   └──────────────────────┘           └──────────────────────┘
```

| Option | Mô tả | Use Case |
|--------|-------|----------|
| **Route 53** | DNS-based routing (Latency, Geolocation, Failover) | Phổ biến nhất, flexible |
| **Global Accelerator** | Anycast IP, route qua AWS backbone | Low latency, gaming, real-time |
| **CloudFront** | CDN + Origin failover | Static content, caching |

> 💡 **Phổ biến nhất:** Dùng **Route 53** với Latency-based routing để route user đến region gần nhất!

## Các loại Load Balancer

AWS cung cấp **4 loại** Load Balancer:

| Loại | Layer | Protocol | Use Case |
|------|-------|----------|----------|
| **Application Load Balancer (ALB)** | Layer 7 | HTTP, HTTPS, gRPC | Web apps, microservices, container-based apps |
| **Network Load Balancer (NLB)** | Layer 4 | TCP, TLS, UDP, QUIC | Ultra-low latency, static IP, gaming, IoT |
| **Gateway Load Balancer (GWLB)** | Layer 3 | IP | Third-party virtual appliances (firewalls, IDS/IPS) |
| **Classic Load Balancer (CLB)** | Layer 4/7 | TCP, SSL, HTTP, HTTPS | Legacy (không khuyến khích cho apps mới) |

> **Nguồn:** [ELB API Reference](https://docs.aws.amazon.com/elasticloadbalancing/latest/APIReference/Welcome.html)

---

## Application Load Balancer (ALB)

### Đặc điểm chính

- **Layer 7** (application layer) - hiểu HTTP/HTTPS
- Routing dựa trên:
  - **Path-based**: `/api/*` → API servers, `/images/*` → Image servers
  - **Host-based**: `api.example.com` vs `web.example.com`
  - **Query string/Headers**: `?platform=mobile`
- Hỗ trợ **HTTP/2**, **gRPC**, **WebSockets**
- Native **IPv6** support
- Tích hợp **AWS WAF** (Web Application Firewall)

### Target Types

- **Instance**: EC2 instance ID
- **IP**: Private IP addresses (bao gồm on-premises qua VPN/Direct Connect)
- **Lambda**: Lambda functions

### Tính năng nổi bật

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Load Balancer                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Listener   │  │  Listener   │  │     Listener        │  │
│  │  HTTP:80    │  │  HTTPS:443  │  │     HTTPS:8443      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
    ┌───────────┐    ┌───────────┐       ┌───────────┐
    │  Target   │    │  Target   │       │  Target   │
    │  Group 1  │    │  Group 2  │       │  Group 3  │
    │ (Web)     │    │ (API)     │       │ (Admin)   │
    └───────────┘    └───────────┘       └───────────┘
```

| Tính năng | Mô tả |
|-----------|-------|
| **SSL/TLS Termination** | Offload SSL processing tại ALB |
| **SNI (Server Name Indication)** | Multiple SSL certs trên 1 ALB |
| **Sticky Sessions** | Session affinity via cookies |
| **Authentication** | Tích hợp Cognito, OIDC |
| **Request Tracing** | X-Amzn-Trace-Id header |
| **Redirects/Fixed Response** | 301/302 redirects, custom error pages |

> **Nguồn:** [ALB Features](https://aws.amazon.com/elasticloadbalancing/application-load-balancer/)

---

## Network Load Balancer (NLB)

### NLB hoạt động ở đâu trong OSI Model?

```
OSI Model:
┌─────────────────────────────┐
│ Layer 7 - Application (HTTP)│ ← ALB hoạt động ở đây
├─────────────────────────────┤
│ Layer 6 - Presentation      │
├─────────────────────────────┤
│ Layer 5 - Session           │
├─────────────────────────────┤
│ Layer 4 - Transport (TCP/UDP)│ ← NLB hoạt động ở đây
├─────────────────────────────┤
│ Layer 3 - Network (IP)      │
├─────────────────────────────┤
│ Layer 2 - Data Link         │
├─────────────────────────────┤
│ Layer 1 - Physical          │
└─────────────────────────────┘
```

### Đặc điểm chính

- **Layer 4** (transport layer) - TCP/UDP/TLS
- **Ultra-low latency** (millions requests/second)
- **Static IP** per AZ (hoặc Elastic IP)
- **Preserve source IP** của client
- Phù hợp: gaming, IoT, real-time apps, databases

### Tại sao NLB nhanh hơn ALB?

NLB nhanh hơn vì **ít bước xử lý hơn**:

```
Khi packet đến ALB (Layer 7):
┌─────────────────────────────────────────────────────────┐
│  1. Nhận TCP packet                                     │
│  2. Mở packet ra, đọc HTTP headers                      │
│  3. Parse: Method? Path? Host? Cookies? Query string?   │
│  4. So sánh với routing rules                           │
│  5. Quyết định target group                             │
│  6. Đóng gói lại thành request mới                      │
│  7. Tạo connection mới đến target                       │
│  8. Forward request                                     │
└─────────────────────────────────────────────────────────┘
        ↑ Nhiều bước xử lý = chậm hơn

Khi packet đến NLB (Layer 4):
┌─────────────────────────────────────────────────────────┐
│  1. Nhận TCP packet                                     │
│  2. Đọc: Source IP, Dest IP, Port                       │
│  3. Hash → chọn target                                  │
│  4. Forward nguyên packet (không mở ra)                 │
└─────────────────────────────────────────────────────────┘
        ↑ Ít bước = nhanh hơn
```

**Ví dụ trực quan:**

```
ALB nhìn vào BÊN TRONG packet:
┌─────────────────────────────────────┐
│ GET /api/users HTTP/1.1             │ ← Đọc path
│ Host: api.example.com               │ ← Đọc host
│ Cookie: session=abc123              │ ← Đọc cookie
└─────────────────────────────────────┘
→ So sánh rules → Quyết định target

NLB chỉ nhìn VỎ NGOÀI packet:
┌─────────────────────────────────────┐
│ Source: 1.2.3.4:50123               │
│ Dest: 10.0.1.5:443                  │
│ Protocol: TCP                       │
│ [██ payload - không quan tâm ██]    │
└─────────────────────────────────────┘
→ Hash IP/Port → Forward luôn
```

### Connection handling

```
ALB tạo 2 connections (terminate & re-establish):
Client ←──conn 1──→ ALB ←──conn 2──→ Target
                     ↑
              ALB terminate connection cũ,
              tạo connection mới đến target

NLB chỉ forward (pass-through):
Client ←─────────────────────────────→ Target
                    ↑
              NLB ở giữa, không terminate
              Forward nguyên packet
```

### Static IP - Điểm khác biệt quan trọng

```
ALB:                              NLB:
┌─────────────────┐               ┌─────────────────┐
│ DNS: my-alb...  │               │ Static IP:      │
│ IP thay đổi!    │               │ 52.1.2.3 (AZ-A) │
│ (chỉ dùng DNS)  │               │ 52.4.5.6 (AZ-B) │
└─────────────────┘               └─────────────────┘
```

**Use cases cần Static IP:**
- Firewall whitelist (chỉ cho phép IP cụ thể)
- Legacy apps không hỗ trợ DNS resolution
- Compliance requirements

### Client IP Preservation

```
Với ALB:
Client (1.2.3.4) → ALB (10.0.1.5) → EC2
                   │
                   └── EC2 thấy source IP = 10.0.1.5 (IP của ALB)
                       Phải đọc X-Forwarded-For header để lấy IP thật

Với NLB:
Client (1.2.3.4) → NLB → EC2
                   │
                   └── EC2 thấy source IP = 1.2.3.4 (IP thật của client!)
```

### Protocols hỗ trợ

| Protocol | Port | Use Case |
|----------|------|----------|
| **TCP** | Any | Database (MySQL 3306, PostgreSQL 5432), SSH (22) |
| **UDP** | Any | Gaming, DNS (53), VoIP, streaming |
| **TLS** | 443 | TCP + encryption (NLB terminate TLS) |
| **TCP_UDP** | Any | Cả TCP và UDP trên cùng port |
| **QUIC** | 443 | HTTP/3, modern web apps |

### Khi nào dùng NLB thay vì ALB?

| Tình huống | Dùng NLB |
|------------|----------|
| Ứng dụng **không phải HTTP** (database, gaming, IoT) | ✅ |
| Cần **Static IP** hoặc **Elastic IP** | ✅ |
| Cần **preserve client IP** thật | ✅ |
| Cần **ultra-low latency** (~100 microseconds) | ✅ |
| Xử lý **millions requests/second** | ✅ |

### Ví dụ thực tế

**1. Database cluster:**
```
App Servers → NLB (TCP:3306) → MySQL Primary + Replicas
              │
              └── Static IP cho firewall rules
              └── Preserve client IP cho audit logs
```

**2. Gaming server:**
```
Game Clients → NLB (UDP:7777) → Game Servers
               │
               └── Ultra-low latency (<1ms)
               └── Millions concurrent connections
```

### So sánh tổng hợp với ALB

| Tiêu chí | ALB | NLB |
|----------|-----|-----|
| Layer | 7 (HTTP/HTTPS) | 4 (TCP/UDP) |
| Latency | ~ms (milliseconds) | ~μs (microseconds) |
| Static IP | Không | Có |
| Preserve client IP | Không (dùng X-Forwarded-For) | Có |
| Protocol | HTTP, HTTPS, gRPC | TCP, UDP, TLS, QUIC |
| Routing | Path, Host, Headers, Cookies | IP + Port hash |
| Processing | Parse HTTP content | Forward raw packets |

> **Nguồn:** [NLB User Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html)

---

## Gateway Load Balancer (GWLB)

### GWLB là gì?

GWLB **không phải** load balancer cho app servers như ALB/NLB. GWLB là **load balancer cho security appliances** (firewalls, IDS/IPS).

### Tại sao cần GWLB?

**Vấn đề:** Bạn muốn tất cả traffic đi qua firewall trước khi đến app.

```
Đặt 1 firewall ở trước (không có GWLB):

                ┌──────────┐
Internet ──────▶│ Firewall │──────▶ App
                └──────────┘
                     │
                     ├── Firewall chết = MẤT TOÀN BỘ TRAFFIC!
                     └── Traffic tăng = 1 firewall không xử lý kịp!
```

**Giải pháp:** Dùng GWLB để load balance và HA cho firewalls.

```
Có GWLB (HA + Scale cho firewalls):

              GWLB (tự động failover)
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐
│Firewall│ │Firewall│ │Firewall│
│   1    │ │   2    │ │   3    │
└────────┘ └────────┘ └────────┘

→ Firewall 1 chết? Traffic tự động qua 2 & 3
→ Traffic tăng 10x? Thêm firewall instances
```

### Traffic flow với GWLB

```
                                    GWLB
                                      │
Internet ───▶ [Kiểm tra bởi Firewall] ───▶ ALB/NLB ───▶ App Servers
                      │
                      ├── Malware? → Chặn
                      ├── SQL Injection? → Chặn  
                      ├── DDoS? → Chặn
                      └── OK? → Cho qua đến app
```

### GWLB làm 2 việc

| Vai trò | Mô tả |
|---------|-------|
| **Gateway** | Điểm vào/ra duy nhất của traffic (bắt buộc đi qua) |
| **Load Balancer** | Phân tải traffic qua nhiều firewall instances |

### So sánh: Không GWLB vs Có GWLB

| Không GWLB | Có GWLB |
|------------|---------|
| 1 firewall chết = chết hết | Failover tự động sang firewall khác |
| Traffic tăng = bottleneck | Scale bằng cách thêm firewalls |
| Tự config routing phức tạp | AWS quản lý routing |

### Đặc điểm kỹ thuật

- **Layer 3** - hoạt động ở network layer (IP packets)
- Dùng cho **virtual appliances**: firewalls, IDS/IPS, deep packet inspection
- Kết hợp **transparent network gateway** + **load balancer**
- Sử dụng **GENEVE protocol** (port 6081)

### Tóm lại

```
ALB  = Load Balancer cho HTTP app servers
NLB  = Load Balancer cho TCP/UDP app servers  
GWLB = Load Balancer cho security appliances (firewalls)
```

> **Nguồn:** [GWLB User Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/)

---

## Các thành phần chính

### 1. Listeners

- Kiểm tra connection requests từ clients
- Cấu hình **protocol + port**
- ALB: HTTP (80), HTTPS (443)
- NLB: TCP, TLS, UDP

### 2. Target Groups

- Nhóm các targets để routing traffic
- Có **health check** riêng
- Hỗ trợ **weighted target groups** (ALB)

### 3. Rules (ALB)

- Định nghĩa cách routing requests
- Conditions: path, host, headers, query strings, source IP
- Actions: forward, redirect, fixed-response, authenticate

---

## Health Checks

ELB liên tục kiểm tra sức khỏe của targets:

```
┌─────────┐         Health Check         ┌─────────┐
│   ELB   │ ────────────────────────────▶│ Target  │
└─────────┘   GET /health HTTP/1.1       └─────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Healthy: 2xx │
              │ Unhealthy: else│
              └──────────────┘
```

| Parameter | Default | Mô tả |
|-----------|---------|-------|
| **Protocol** | HTTP | HTTP, HTTPS, TCP |
| **Path** | / | Endpoint kiểm tra |
| **Interval** | 30s | Thời gian giữa các checks |
| **Timeout** | 5s | Thời gian chờ response |
| **Healthy threshold** | 5 | Số lần pass để coi là healthy |
| **Unhealthy threshold** | 2 | Số lần fail để coi là unhealthy |

---

## Cross-Zone Load Balancing

```
Không Cross-Zone:              Có Cross-Zone:
┌────────────────────┐         ┌────────────────────┐
│      AZ-A (50%)    │         │      AZ-A          │
│  ┌────┐  ┌────┐    │         │  ┌────┐  ┌────┐    │
│  │25% │  │25% │    │         │  │20% │  │20% │    │
│  └────┘  └────┘    │         │  └────┘  └────┘    │
├────────────────────┤         ├────────────────────┤
│      AZ-B (50%)    │         │      AZ-B          │
│  ┌────┐            │         │  ┌────┐            │
│  │50% │            │         │  │20% │            │
│  └────┘            │         │  └────┘            │
├────────────────────┤         ├────────────────────┤
│      AZ-C (0%)     │         │      AZ-C          │
│  ┌────┐  ┌────┐    │         │  ┌────┐  ┌────┐    │
│  │0%  │  │0%  │    │         │  │20% │  │20% │    │
│  └────┘  └────┘    │         │  └────┘  └────┘    │
└────────────────────┘         └────────────────────┘
```

| Loại LB | Cross-Zone mặc định | Chi phí data transfer |
|---------|---------------------|----------------------|
| ALB | Enabled | Không tính phí |
| NLB | Disabled | Tính phí nếu enable |
| GWLB | Disabled | Tính phí nếu enable |
| CLB | Disabled | Không tính phí |

---

## Connection Draining (Deregistration Delay)

### Vấn đề

Khi remove instance khỏi Load Balancer (update, scale in, unhealthy), instance có thể đang xử lý requests dở:

```
Client A ────────────────▶ Instance 1 (đang download file 50%)
Client B ────────────────▶ Instance 1 (đang submit form)
Client C ────────────────▶ Instance 1 (đang checkout giỏ hàng)
                               │
                               ▼
                    Remove instance ngay lập tức?
                               │
                               ▼
                    ❌ Tất cả requests bị cắt ngang!
                    ❌ Download fail, form mất, checkout lỗi
```

### Giải pháp: Connection Draining

```
Bước 1: Đánh dấu instance "draining" (đang thoát)
        → KHÔNG gửi requests MỚI đến instance này

Bước 2: Chờ requests CŨ hoàn thành (default 300s)

Client A ──────▶ Instance 1 (tiếp tục download... done ✓)
Client B ──────▶ Instance 1 (tiếp tục submit... done ✓)  
Client C ──────▶ Instance 1 (tiếp tục checkout... done ✓)

Client D (mới) ──────▶ Instance 2 (requests mới đi instance khác)

Bước 3: Sau khi tất cả xong → Remove instance an toàn
```

### Timeline

```
T=0s          T=300s (default timeout)
│             │
▼             ▼
┌─────────────────────────────────────┐
│         DRAINING PERIOD             │
│                                     │
│  ✓ Requests cũ: tiếp tục xử lý     │
│  ✗ Requests mới: đi instance khác  │
│                                     │
└─────────────────────────────────────┘
                │
                ▼
        Instance bị remove
```

### Config ở đâu?

Config của **Target Group** (không phải instance hay LB):

```
┌─────────────────────────────────────────────────────┐
│                  Load Balancer                       │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │            Target Group                      │   │
│   │                                             │   │
│   │   deregistration_delay = 300s  ← CONFIG     │   │
│   │                                             │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│   │   │Instance 1│  │Instance 2│  │Instance 3│ │   │
│   │   └──────────┘  └──────────┘  └──────────┘ │   │
│   └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

→ 1 Target Group = 1 setting chung cho tất cả instances
```

### Giá trị

| Giá trị | Ý nghĩa | Use case |
|---------|---------|----------|
| **0s** | Tắt (remove ngay) | Stateless app, không cần chờ |
| **30s** | Chờ 30 giây | API ngắn, response nhanh |
| **300s** | Default | Web app thông thường |
| **3600s** | Max | File download lớn, long-running requests |

```bash
# Thay đổi qua CLI
aws elbv2 modify-target-group-attributes \
  --target-group-arn <arn> \
  --attributes Key=deregistration_delay.timeout_seconds,Value=60
```

**Tóm lại:** Connection Draining = "chờ khách ăn xong rồi mới đóng cửa nhà hàng"

---

## SSL/TLS Certificates

- Quản lý bằng **AWS Certificate Manager (ACM)**
- Hoặc upload certificate từ bên thứ ba lên **IAM**
- ALB/NLB hỗ trợ **SNI** (multiple certs)
- Chọn **Security Policy** để define SSL/TLS protocols và ciphers

---

## Tích hợp với Auto Scaling

ELB + ASG là combo phổ biến:

```
Internet
    │
    ▼
┌─────────┐
│   ELB   │ ◀─── Health Check ────┐
└────┬────┘                       │
     │                            │
     ▼                            │
┌─────────────────────────────────┴──────────┐
│           Auto Scaling Group                │
│  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │  EC2   │  │  EC2   │  │  EC2   │        │
│  └────────┘  └────────┘  └────────┘        │
└─────────────────────────────────────────────┘
```

- ASG tự động register/deregister instances với ELB
- ELB health check có thể trigger ASG thay thế unhealthy instances

---

## Pricing

| Thành phần | Tính phí |
|------------|----------|
| **LCU (Load Balancer Capacity Units)** | Dựa trên: new connections/s, active connections, processed bytes, rule evaluations |
| **Hourly charge** | Mỗi giờ LB hoạt động |
| **Data processed** | Tính theo GB |

> **Nguồn:** [ELB Pricing](https://aws.amazon.com/elasticloadbalancing/pricing/)

---

## Liên kết

- [EC2](ec2.md) - Compute instances
- [Auto Scaling Group](asg.md) - Tự động scale EC2
- [VPC](vpc.md) - Networking
- [Security Groups](security-groups.md) - Firewall rules
- [Load Balancing Patterns](load-balancing-patterns.md) - So sánh AWS ELB vs K8s vs Spring Cloud
