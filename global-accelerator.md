# AWS Global Accelerator

## Mục lục

- [Tổng quan](#tổng-quan)
- [Cách hoạt động](#cách-hoạt-động)
- [Static Anycast IP Addresses](#static-anycast-ip-addresses)
- [Thành phần chính](#thành-phần-chính)
- [So sánh với CloudFront](#so-sánh-với-cloudfront)
- [Use Cases](#use-cases)
- [Health Checks & Failover](#health-checks--failover)
- [Pricing](#pricing)
- [Liên kết](#liên-kết)

---

## Tổng quan

**AWS Global Accelerator** là dịch vụ **network layer** giúp cải thiện availability và performance cho applications bằng cách sử dụng **AWS global network**.

> ⚠️ **Lưu ý:** Global Accelerator là **SERVICE RIÊNG**, không phải feature của CloudFront!

```
┌─────────────────────────────────────────────────────────────────┐
│              KHÔNG CÓ GLOBAL ACCELERATOR                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User (Vietnam) ──► Public Internet ──► ALB/EC2 (US)           │
│                      │                                          │
│                      └─► Nhiều hops, unpredictable latency       │
│                      └─► Congestion, packet loss                 │
│                      └─► ~200-300ms latency                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              CÓ GLOBAL ACCELERATOR                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User (Vietnam) ─► Edge Location ─► AWS Global Network ─► ALB  │
│                      │                                          │
│                      └─► Vào AWS network ngay gần user          │
│                      └─► Đi qua AWS backbone (optimized)        │
│                      └─► ~60-100ms latency (60% faster!)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│              GLOBAL ACCELERATOR ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AWS cấp 2 Static Anycast IPs                                │
│     75.2.x.x và 99.83.x.x                                       │
│                          │                                       │
│                          ▼                                       │
│  2. User request đến IP → route tới Edge gần nhất               │
│                          │                                       │
│                          ▼                                       │
│  3. Traffic đi qua AWS Private Global Network                   │
│     (optimized, low latency)                                    │
│                          │                                       │
│                          ▼                                       │
│  4. Đến Endpoints: ALB / NLB / EC2 / Elastic IP                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Static Anycast IP Addresses

### Anycast là gì?

**Anycast** = cùng 1 IP được quảng bá từ nhiều locations. Request tự động route đến location **gần nhất**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNICAST vs ANYCAST                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UNICAST (thông thường):                                         │
│  1 IP = 1 server cố định                                         │
│                                                                  │
│  User (Vietnam) ──► 1.2.3.4 ──► Server (US)  (xa!)              │
│  User (Japan)   ──► 1.2.3.4 ──► Server (US)  (xa!)              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ANYCAST:                                                        │
│  1 IP = nhiều servers khắp nơi                                   │
│                                                                  │
│  User (Vietnam) ──► 1.2.3.4 ──► Edge (Singapore)  (gần!)        │
│  User (Japan)   ──► 1.2.3.4 ──► Edge (Tokyo)      (gần!)        │
│                                                                  │
│  → Cùng IP, nhưng route đến nơi gần nhất                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tại sao 2 IPs?

**Redundancy / High Availability:**

```
IP 1: 75.2.x.x   ──► Network A (AWS infrastructure)
IP 2: 99.83.x.x  ──► Network B (AWS infrastructure)

Nếu 1 IP có vấn đề → IP còn lại vẫn hoạt động
```

| Số lượng | Đánh giá |
|----------|----------|
| 1 IP | ❌ Không redundancy |
| 2 IPs | ✅ Đủ HA + đơn giản |
| 3+ IPs | ⚠️ Quá mức cần thiết |

### Cách sử dụng 2 IPs

**Cách 1: DNS Record (phổ biến nhất)**

```
myapp.example.com  →  A Record  →  75.2.1.10
                   →  A Record  →  99.83.2.20
```

**Cách 2: Firewall Whitelist**

```
ALLOW outbound to:
• 75.2.1.10
• 99.83.2.20

✅ Chỉ 2 IPs cố định (không như ELB thay đổi liên tục)
```

**Cách 3: Dùng DNS name của Accelerator**

```
CNAME myapp.example.com → abc123.awsglobalaccelerator.com

→ DNS tự động trả về cả 2 IPs
→ Anycast routing lo phần còn lại!
```

---

## Thành phần chính

| Thành phần | Mô tả |
|------------|-------|
| **Static IP Addresses** | 2 anycast IPs, global, không thay đổi |
| **Accelerator** | Entry point, chứa listeners |
| **Listener** | Port + protocol (TCP/UDP), route traffic |
| **Endpoint Group** | Region-level grouping (weight-based routing) |
| **Endpoints** | ALB, NLB, EC2, Elastic IP |

---

## So sánh với CloudFront

```
┌─────────────────────────────────────────────────────────────────┐
│              CLOUDFRONT vs GLOBAL ACCELERATOR                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CloudFront (CDN - Layer 7):                                     │
│  • Cache content ở edge                                         │
│  • HTTP/HTTPS only                                               │
│  • Tốt cho static content, websites                              │
│  • Có thể modify request/response                               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Global Accelerator (Network - Layer 4):                         │
│  • KHÔNG cache, proxy traffic                                    │
│  • TCP/UDP (gaming, IoT, VoIP)                                   │
│  • Tốt cho dynamic content, non-HTTP                            │
│  • Static IP addresses (whitelist friendly)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Feature | CloudFront | Global Accelerator |
|---------|------------|-------------------|
| **Layer** | Layer 7 (HTTP/HTTPS) | Layer 4 (TCP/UDP) |
| **Caching** | ✅ Có | ❌ Không |
| **Protocol** | HTTP, HTTPS, WebSocket | TCP, UDP |
| **Static IP** | ❌ Không (dùng DNS) | ✅ 2 Anycast IPs |
| **Use case** | Websites, APIs, streaming | Gaming, IoT, VoIP |
| **Edge logic** | ✅ Functions, Lambda@Edge | ❌ Không |

### So sánh với S3 Transfer Acceleration

| Feature | S3 Transfer Acceleration | Global Accelerator |
|---------|--------------------------|-------------------|
| **Mục đích** | Tăng tốc S3 upload/download | Tăng tốc any TCP/UDP app |
| **Hỗ trợ S3?** | ✅ Có (chính) | ❌ Không |
| **Hỗ trợ ALB/EC2?** | ❌ Không | ✅ Có |

> 💡 S3 Transfer Acceleration = "Global Accelerator cho riêng S3"

---

## Use Cases

| Use Case | Tại sao Global Accelerator? |
|----------|----------------------------|
| **Gaming** | UDP support, low latency |
| **IoT** | TCP/UDP, stable connections |
| **VoIP** | UDP, instant failover |
| **Financial trading** | Microseconds matter |
| **Static IP requirement** | Firewall whitelist |
| **Multi-region failover** | Health checks + automatic routing |

---

## Health Checks & Failover

```
┌─────────────────────────────────────────────────────────────────┐
│              INSTANT FAILOVER                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Bình thường:                                                     │
│  User ─► Global Accelerator ─► us-east-1 (healthy) ✅           │
│                                                                  │
│  Khi us-east-1 fail:                                            │
│  User ─► Global Accelerator ─► eu-west-1 (healthy) ✅           │
│                              (tự động trong < 1 giây)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key points:**
- Health checks mỗi 10 giây (configurable)
- Failover trong **< 1 giây** (không đợi DNS propagation như Route 53)
- Client không cần biết - vẫn dùng cùng IP

### Client IP Preservation

| Endpoint Type | Client IP |
|---------------|-----------|
| **ALB** | X-Forwarded-For header |
| **NLB** | Source IP preserved |
| **EC2** | Cần enable explicitly |

---

## Pricing

| Component | Cost |
|-----------|------|
| **Fixed fee** | $0.025/hour per accelerator (~$18/month) |
| **Data Transfer** | $0.015 - $0.035/GB (theo region) |

---

## Exam Tips

> ✅ Khi đề bài nói:
> - "need static IP" 
> - "UDP traffic"
> - "gaming"
> - "non-HTTP"
> - "instant failover"
> 
> → Nghĩ đến **Global Accelerator**, không phải CloudFront!

---

## Liên kết

- [CloudFront](cloudfront.md) - So sánh CDN vs Network acceleration
- [Route 53](route53.md) - DNS-based routing (khác với Anycast)
- [ELB](elb.md) - Load Balancer endpoints
- [S3](s3.md) - S3 Transfer Acceleration (service tương tự cho S3)
