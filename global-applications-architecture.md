# Global Applications Architecture


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. AWS Services cho Global Architecture](#1-aws-services-cho-global-architecture)
- [2. AWS Global Accelerator](#2-aws-global-accelerator)
- [3. CloudFront vs Global Accelerator](#3-cloudfront-vs-global-accelerator)
- [4. Disaster Recovery Patterns](#4-disaster-recovery-patterns)
- [5. Tổng kết](#5-tổng-kết)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Global Applications Architecture** là kiến trúc thiết kế ứng dụng phục vụ users trên toàn cầu với:
- **Low Latency**: Giảm độ trễ cho users ở mọi nơi
- **High Availability**: Ứng dụng luôn sẵn sàng
- **Disaster Recovery**: Khôi phục nhanh khi có sự cố

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   🌐 Route 53 (Global DNS)                                      │
│        ↓                                                        │
│   ⚡ CloudFront / Global Accelerator (Edge Network)             │
│        ↓                                                        │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │  Region A   │←──→│  Region B   │←──→│  Region C   │         │
│   │  (Primary)  │    │ (Secondary) │    │  (Backup)   │         │
│   └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

1. [AWS Services cho Global Architecture](#1-aws-services-cho-global-architecture)
2. [AWS Global Accelerator](#2-aws-global-accelerator)
3. [CloudFront vs Global Accelerator](#3-cloudfront-vs-global-accelerator)
4. [Disaster Recovery Patterns](#4-disaster-recovery-patterns)

---

## 1. AWS Services cho Global Architecture

### 1.1 Bảng tổng hợp Services

| Service | Layer | Chức năng chính | Use Case |
|---------|-------|-----------------|----------|
| **Route 53** | DNS | Global DNS routing, health checks | Domain routing, failover |
| **CloudFront** | CDN | Cache content tại Edge | Static/dynamic content delivery |
| **Global Accelerator** | Network | Tối ưu network path | Low-latency applications |
| **S3 Cross-Region Replication** | Storage | Replicate objects | Data redundancy |
| **DynamoDB Global Tables** | Database | Multi-Region NoSQL | Global read/write |
| **Aurora Global Database** | Database | Multi-Region SQL | Cross-region failover |
| **S3 Transfer Acceleration** | Transfer | Tăng tốc upload/download | Large file transfers |

### 1.2 Route 53 - Global DNS

```
┌─────────────────────────────────────────────────────────────┐
│                      ROUTE 53 ROUTING                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   User Request → Route 53                                   │
│                     ↓                                       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │            Routing Policies                         │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ • Simple      → Single resource                     │   │
│   │ • Weighted    → % traffic distribution              │   │
│   │ • Latency     → Lowest latency region               │   │
│   │ • Failover    → Primary/Secondary                   │   │
│   │ • Geolocation → Based on user location              │   │
│   │ • Geoproximity → Based on geographic distance       │   │
│   │ • Multi-Value → Multiple healthy resources          │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Routing Policies cho Global Apps:**

| Policy | Mô tả | Use Case |
|--------|-------|----------|
| **Latency** | Route đến region có latency thấp nhất | Performance optimization |
| **Geolocation** | Route theo vị trí địa lý user | Compliance, localization |
| **Failover** | Tự động chuyển khi primary down | Disaster recovery |
| **Weighted** | Phân chia traffic theo % | Blue/green, canary |

### 1.3 CloudFront - Global CDN

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFRONT CDN                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Users Worldwide                                           │
│        ↓                                                    │
│   ┌─────────────────────────────────────────────────────┐   │
│   │     400+ Edge Locations (Points of Presence)        │   │
│   │                                                     │   │
│   │  🌐 Americas  │  🌐 Europe  │  🌐 Asia  │  🌐 Others │  │
│   └─────────────────────────────────────────────────────┘   │
│        ↓                                                    │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Regional Edge Caches                   │   │
│   └─────────────────────────────────────────────────────┘   │
│        ↓                                                    │
│   ┌─────────────────────────────────────────────────────┐   │
│   │     Origin (S3, ALB, EC2, Custom HTTP)              │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Các tính năng chính:**
- **Edge Caching**: Cache content gần users
- **Lambda@Edge**: Run code tại Edge
- **Origin Shield**: Reduce origin load
- **Real-time Logs**: Monitor CDN performance

### 1.4 S3 Cross-Region Replication (CRR)

```
┌─────────────────────────────────────────────────────────────┐
│               S3 CROSS-REGION REPLICATION                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐         ┌──────────────┐                 │
│   │  Source      │ ──────→ │ Destination  │                 │
│   │  Bucket      │   CRR   │   Bucket     │                 │
│   │  (us-east-1) │         │ (eu-west-1)  │                 │
│   └──────────────┘         └──────────────┘                 │
│                                                             │
│   Requirements:                                             │
│   • Versioning enabled on both buckets                      │
│   • IAM permissions for replication                         │
│   • Objects encrypted with same key type                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Use Cases:**
- Disaster Recovery
- Compliance (data in multiple regions)
- Reduce latency for global users
- Cross-account replication

### 1.5 DynamoDB Global Tables

```
┌─────────────────────────────────────────────────────────────┐
│             DYNAMODB GLOBAL TABLES                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│        ┌──────────────┐                                     │
│        │ Global Table │                                     │
│        └──────┬───────┘                                     │
│               │                                             │
│    ┌──────────┼──────────┬──────────┐                       │
│    ↓          ↓          ↓          ↓                       │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                      │
│ │ US   │←→│ EU   │←→│ Asia │←→│ SA   │                      │
│ │Replica│  │Replica│  │Replica│  │Replica│                      │
│ └──────┘  └──────┘  └──────┘  └──────┘                      │
│                                                             │
│   • Active-Active replication                               │
│   • < 1 second replication latency                          │
│   • Read/Write to any replica                               │
│   • Automatic conflict resolution (last writer wins)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.6 Aurora Global Database

```
┌─────────────────────────────────────────────────────────────┐
│              AURORA GLOBAL DATABASE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌────────────────────────────────────────┐                │
│   │         PRIMARY REGION (us-east-1)     │                │
│   │  ┌──────────────────────────────────┐   │               │
│   │  │      Primary Cluster             │   │               │
│   │  │  (Read + Write)                  │   │               │
│   │  └──────────────────────────────────┘   │               │
│   └────────────────────────────────────────┘                │
│                    │                                        │
│                    │ Async Replication                      │
│                    │ (< 1 second lag)                       │
│                    ↓                                        │
│   ┌────────────────────────────────────────┐                │
│   │       SECONDARY REGION (eu-west-1)     │                │
│   │  ┌──────────────────────────────────┐   │               │
│   │  │     Secondary Cluster            │   │               │
│   │  │  (Read Only - can promote)       │   │               │
│   │  └──────────────────────────────────┘   │               │
│   └────────────────────────────────────────┘                │
│                                                             │
│   Failover: < 1 minute (RPO ~1 second)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. AWS Global Accelerator

### 2.1 Tổng quan

**AWS Global Accelerator** là service tối ưu hóa network path từ users đến applications bằng cách sử dụng **AWS Global Network**.

```
┌─────────────────────────────────────────────────────────────┐
│                  GLOBAL ACCELERATOR                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   WITHOUT Global Accelerator:                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  User → ISP1 → ISP2 → ISP3 → ... → AWS Region       │   │
│   │        (Multiple hops qua public internet)          │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   WITH Global Accelerator:                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  User → Edge Location → AWS Private Network → Region│   │
│   │       (Vào AWS network sớm nhất có thể)             │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Kiến trúc chi tiết

```
┌─────────────────────────────────────────────────────────────────┐
│                GLOBAL ACCELERATOR ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Users                                                         │
│     │                                                           │
│     ↓                                                           │
│   ┌───────────────────────────────────────────────────────┐     │
│   │         2 Static Anycast IP Addresses                 │     │
│   │         (Entry point to AWS network)                  │     │
│   └───────────────────────────────────────────────────────┘     │
│     │                                                           │
│     ↓                                                           │
│   ┌───────────────────────────────────────────────────────┐     │
│   │              Edge Locations (Global)                  │     │
│   │   User được route đến Edge Location gần nhất          │     │
│   └───────────────────────────────────────────────────────┘     │
│     │                                                           │
│     ↓  (AWS Private Global Network)                             │
│   ┌───────────────────────────────────────────────────────┐     │
│   │                     Listener                          │     │
│   │                  (Port + Protocol)                    │     │
│   └───────────────────────────────────────────────────────┘     │
│     │                                                           │
│     ↓                                                           │
│   ┌───────────────────────────────────────────────────────┐     │
│   │               Endpoint Groups                         │     │
│   │            (One per AWS Region)                       │     │
│   │                                                       │     │
│   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │    │
│   │  │  us-east-1  │   │  eu-west-1  │   │ ap-south-1  │   │    │
│   │  │  Weight: 50 │   │  Weight: 30 │   │  Weight: 20 │   │    │
│   │  └─────────────┘   └─────────────┘   └─────────────┘   │    │
│   └───────────────────────────────────────────────────────┘     │
│     │                                                           │
│     ↓                                                           │
│   ┌───────────────────────────────────────────────────────┐     │
│   │                  Endpoints                            │     │
│   │     ALB, NLB, EC2, Elastic IP                         │     │
│   └───────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Thành phần chính

| Component | Mô tả |
|-----------|-------|
| **Accelerator** | Entry point với 2 static anycast IPs |
| **Listener** | Process connections (TCP/UDP, port range) |
| **Endpoint Group** | Nhóm endpoints trong 1 region |
| **Endpoints** | ALB, NLB, EC2, Elastic IP |

### 2.4 Tính năng quan trọng

**1. Static Anycast IP:**
```
┌─────────────────────────────────────────────────────────────┐
│   2 Static IP addresses (không đổi khi scale/failover)      │
│                                                             │
│   • IP 1: 1.2.3.4  ─┐                                       │
│                     ├── Anycast → Nearest Edge Location     │
│   • IP 2: 5.6.7.8  ─┘                                       │
│                                                             │
│   → Có thể whitelist trong firewall                         │
│   → Không cần thay đổi DNS khi failover                     │
└─────────────────────────────────────────────────────────────┘
```

**2. Health Checks & Failover:**
```
┌─────────────────────────────────────────────────────────────┐
│                   AUTOMATIC FAILOVER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Normal Operation:                                         │
│   User → Edge → Region A (Primary, Healthy ✓)               │
│                                                             │
│   Failover (< 1 minute):                                    │
│   User → Edge → Region A (Unhealthy ✗)                      │
│              └→ Region B (Secondary, Healthy ✓)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**3. Traffic Dials:**
- Điều chỉnh % traffic đến mỗi endpoint group (0-100%)
- Dùng cho Blue/Green deployment, gradual rollout

**4. Client Affinity:**
- `NONE`: Requests distributed based on health, weight
- `SOURCE_IP`: Sticky sessions based on client IP

### 2.5 Use Cases

| Use Case | Mô tả |
|----------|-------|
| **Gaming** | UDP traffic, low latency requirement |
| **IoT** | MQTT over TCP, stable connections |
| **Voice/Video** | Real-time communication |
| **Financial Trading** | Ultra-low latency |
| **Health Apps** | Static IP for compliance |

---

## 3. CloudFront vs Global Accelerator

### 3.1 So sánh tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│          CLOUDFRONT vs GLOBAL ACCELERATOR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   CLOUDFRONT (Content Delivery):                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  User → Edge (CACHE) → Origin                           │   │
│   │         ↑                                               │   │
│   │    Content cached                                       │   │
│   │    tại Edge Location                                    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   GLOBAL ACCELERATOR (Network Optimization):                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  User → Edge (NO CACHE) → AWS Network → Origin          │   │
│   │         ↑                                               │   │
│   │    Chỉ là entry point                                   │   │
│   │    vào AWS private network                              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Bảng so sánh chi tiết

| Feature | CloudFront | Global Accelerator |
|---------|------------|-------------------|
| **Mục đích chính** | Content delivery & caching | Network path optimization |
| **Caching** | ✅ Yes (Edge caching) | ❌ No |
| **Protocol** | HTTP/HTTPS only | TCP, UDP |
| **Static IP** | ❌ No (DNS-based) | ✅ Yes (2 Anycast IPs) |
| **DDoS Protection** | AWS Shield Standard | AWS Shield Standard |
| **Origin Types** | S3, ALB, EC2, Custom HTTP | ALB, NLB, EC2, EIP |
| **Edge Functions** | Lambda@Edge, CloudFront Functions | ❌ No |
| **WebSocket** | ✅ Yes | ✅ Yes |
| **Pricing** | Data transfer + requests | Fixed hourly + data transfer |

### 3.3 Khi nào dùng cái nào?

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION FLOWCHART                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Cần cache content?                                            │
│        │                                                        │
│   ┌────┴────┐                                                   │
│   ↓         ↓                                                   │
│  YES       NO                                                   │
│   │         │                                                   │
│   ↓         ↓                                                   │
│ CloudFront  Cần static IP?                                      │
│                  │                                              │
│             ┌────┴────┐                                         │
│             ↓         ↓                                         │
│            YES       NO                                         │
│             │         │                                         │
│             ↓         ↓                                         │
│     Global Accelerator   Dùng TCP/UDP (non-HTTP)?               │
│                               │                                 │
│                          ┌────┴────┐                            │
│                          ↓         ↓                            │
│                         YES       NO                            │
│                          │         │                            │
│                          ↓         ↓                            │
│               Global Accelerator  CloudFront                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Use Case Mapping

| Scenario | Recommend | Why |
|----------|-----------|-----|
| Static website | CloudFront | Cache HTML, CSS, JS, images |
| API Gateway backend | CloudFront | Cache API responses |
| Gaming (UDP) | Global Accelerator | UDP support, low latency |
| VoIP application | Global Accelerator | UDP, stable connection |
| IoT with fixed IP | Global Accelerator | Static IP for whitelist |
| Streaming video | CloudFront | Cache video segments |
| Dynamic web app (no cache) | Global Accelerator | Network optimization |
| Global failover | Global Accelerator | Health checks, instant failover |

### 3.5 Kết hợp cả hai

```
┌─────────────────────────────────────────────────────────────────┐
│            SỬ DỤNG CẢ HAI CÙNG LÚC                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     Users                               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                    │                   │                        │
│            Static Content      Dynamic/Real-time                │
│                    ↓                   ↓                        │
│   ┌───────────────────────┐   ┌───────────────────────┐         │
│   │      CloudFront       │   │  Global Accelerator   │         │
│   │   (Images, CSS, JS)   │   │   (WebSocket, API)    │         │
│   └───────────────────────┘   └───────────────────────┘         │
│                    │                   │                        │
│                    ↓                   ↓                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Application (ALB + EC2/ECS)                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Disaster Recovery Patterns

### 4.1 Các metrics quan trọng

| Metric | Định nghĩa | Ý nghĩa |
|--------|------------|---------|
| **RPO** (Recovery Point Objective) | Lượng data tối đa có thể mất | "Bao nhiêu data backup bị mất?" |
| **RTO** (Recovery Time Objective) | Thời gian downtime chấp nhận được | "Bao lâu để recover?" |

```
┌─────────────────────────────────────────────────────────────────┐
│                    RPO vs RTO                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Timeline:                                                     │
│   ───────────────────────────────────────────────────────────── │
│   │ Last Backup │←── RPO ──→│ Disaster │←── RTO ──→│ Recovery  ││
│   │             │  (Data    │          │ (Downtime)|           ││
│   │             │   Loss)   │          │           |           ││
│   ───────────────────────────────────────────────────────────── │
│                                                                 │
│   Ví dụ: RPO = 1 hour, RTO = 4 hours                            │
│   → Mất tối đa 1 giờ data                                       │
│   → Downtime tối đa 4 giờ                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Bốn DR Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│              DR PATTERNS: COST vs RECOVERY TIME                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Cost ↑                                                        │
│        │                                                        │
│        │                              ┌─────────────────┐       │
│        │                              │  Active-Active  │       │
│        │                              │   (RTO: ~0)     │       │
│        │                              └─────────────────┘       │
│        │                    ┌─────────────────┐                 │
│        │                    │  Warm Standby   │                 │
│        │                    │   (RTO: Min)    │                 │
│        │                    └─────────────────┘                 │
│        │          ┌─────────────────┐                           │
│        │          │   Pilot Light   │                           │
│        │          │  (RTO: 10+ Min) │                           │
│        │          └─────────────────┘                           │
│        │ ┌─────────────────┐                                    │
│        │ │ Backup/Restore  │                                    │
│        │ │  (RTO: Hours)   │                                    │
│        │ └─────────────────┘                                    │
│        └────────────────────────────────────────→ Recovery Time │
│         Fast                                    Slow            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Pattern 1: Backup & Restore

```
┌─────────────────────────────────────────────────────────────────┐
│               BACKUP & RESTORE                                  │
│         RPO: Hours | RTO: Hours | Cost: $                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PRIMARY REGION                    DR REGION                   │
│   ┌──────────────────┐             ┌──────────────────┐         │
│   │                  │             │                  │         │
│   │  ┌────────────┐  │   Backup    │  (No running      │        │
│   │  │ Application │  │  ────────→ │   infrastructure) │        │
│   │  └────────────┘  │             │                   │        │
│   │                  │             │  ┌────────────┐   │        │
│   │  ┌────────────┐  │   S3 CRR    │  │ AMIs       │   │        │
│   │  │ Database   │  │  ────────→ │  │ Snapshots  │    │        │
│   │  └────────────┘  │             │  │ Backups    │   │        │
│   │                  │             │  └────────────┘   │        │
│   └──────────────────┘             └──────────────────┘         │
│                                                                 │
│   Disaster: Restore từ backups → Launch infrastructure          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- ✅ Chi phí thấp nhất
- ❌ Recovery time dài nhất
- Use for: Non-critical workloads, dev/test environments

### 4.4 Pattern 2: Pilot Light

```
┌─────────────────────────────────────────────────────────────────┐
│                   PILOT LIGHT                                   │
│         RPO: Minutes | RTO: 10+ Minutes | Cost: $$              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PRIMARY REGION                    DR REGION                   │
│   ┌──────────────────┐             ┌──────────────────┐         │
│   │                  │             │                  │         │
│   │  ┌────────────┐  │             │  (App servers     │        │
│   │  │ App + Web  │  │             │   OFF/minimal)    │        │
│   │  │ Servers    │  │             │                   │        │
│   │  └────────────┘  │             │                   │        │
│   │                  │    Async    │  ┌────────────┐   │        │
│   │  ┌────────────┐  │   Replicate │  │ Database   │   │        │
│   │  │ Database   │  │  ────────→ │  │ (Running!) │    │        │
│   │  │ (Primary)  │  │             │  │ (Read only)│   │        │
│   │  └────────────┘  │             │  └────────────┘   │        │
│   │                  │             │                  │         │
│   └──────────────────┘             └──────────────────┘         │
│                                           ↓                     │
│   Disaster: Scale up app servers, promote DB                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Core infrastructure (DB) luôn chạy và sync
- App servers chỉ start khi cần
- Tên từ "pilot light" trong gas heater - ngọn lửa nhỏ luôn cháy

### 4.5 Pattern 3: Warm Standby

```
┌─────────────────────────────────────────────────────────────────┐
│                   WARM STANDBY                                  │
│         RPO: Seconds | RTO: Minutes | Cost: $$$                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PRIMARY REGION                    DR REGION                   │
│   ┌──────────────────┐             ┌──────────────────┐         │
│   │                  │             │                  │         │
│   │  ┌────────────┐  │             │  ┌────────────┐   │        │
│   │  │ App + Web  │  │             │  │ App + Web  │   │        │
│   │  │ (100%)     │  │             │  │ (25%)      │   │        │
│   │  └────────────┘  │             │  │ (Running!) │   │        │
│   │                  │             │  └────────────┘   │        │
│   │                  │    Async    │                  │         │
│   │  ┌────────────┐  │   Replicate │  ┌────────────┐   │        │
│   │  │ Database   │  │  ────────→ │  │ Database   │    │        │
│   │  │ (Primary)  │  │             │  │ (Replica)  │   │        │
│   │  └────────────┘  │             │  └────────────┘   │        │
│   │                  │             │                  │         │
│   └──────────────────┘             └──────────────────┘         │
│                                           ↓                     │
│   Disaster: Scale up to 100%, promote DB, Route53 failover      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Scaled-down version chạy sẵn trong DR region
- Có thể xử lý traffic ngay lập tức
- Scale up khi failover

### 4.6 Pattern 4: Active-Active (Multi-Site)

```
┌─────────────────────────────────────────────────────────────────┐
│                   ACTIVE-ACTIVE                                 │
│         RPO: ~0 | RTO: ~0 | Cost: $$$$                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     Route 53                            │   │
│   │              (Latency/Weighted Routing)                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                    │                   │                        │
│                    ↓                   ↓                        │
│   ┌──────────────────┐             ┌──────────────────┐         │
│   │   REGION A       │             │   REGION B       │         │
│   │   (Active)       │             │   (Active)       │         │
│   │                  │             │                  │         │
│   │  ┌────────────┐  │             │  ┌────────────┐   │        │
│   │  │ App + Web  │  │             │  │ App + Web  │   │        │
│   │  │ (100%)     │  │             │  │ (100%)     │   │        │
│   │  └────────────┘  │             │  └────────────┘   │        │
│   │                  │             │                  │         │
│   │  ┌────────────┐  │  Bi-direct  │  ┌────────────┐   │        │
│   │  │ Database   │  │ ←────────→ │  │ Database   │    │        │
│   │  │ (Primary)  │  │  Replicate │  │ (Primary)  │    │        │
│   │  └────────────┘  │             │  └────────────┘   │        │
│   │                  │             │                  │         │
│   └──────────────────┘             └──────────────────┘         │
│                                                                 │
│   Cả 2 region đều serve traffic đồng thời                       │
│   Database: DynamoDB Global Tables / Aurora Global              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Cả 2 regions đều nhận traffic
- Zero downtime
- Chi phí cao nhất (gấp đôi)
- Phức tạp về data consistency

### 4.7 So sánh các DR Patterns

| Pattern | RPO | RTO | Cost | Complexity | Use Case |
|---------|-----|-----|------|------------|----------|
| **Backup & Restore** | Hours | 24+ hours | $ | Low | Dev, non-critical |
| **Pilot Light** | Minutes | 10-30 min | $$ | Medium | Core business apps |
| **Warm Standby** | Seconds-Mins | Minutes | $$$ | Medium-High | Business critical |
| **Active-Active** | ~0 | ~0 | $$$$ | High | Mission critical |

### 4.8 DR Implementation Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                 DR IMPLEMENTATION CHECKLIST                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Planning:                                                     │
│   □ Define RPO và RTO requirements                              │
│   □ Identify critical workloads                                 │
│   □ Choose DR pattern based on budget                           │
│   □ Select DR region                                            │
│                                                                 │
│   Infrastructure:                                               │
│   □ Setup data replication (RDS, S3, DynamoDB)                  │
│   □ Prepare AMIs in DR region                                   │
│   □ Configure Route 53 health checks                            │
│   □ Setup monitoring and alerting                               │
│                                                                 │
│   Testing:                                                      │
│   □ Document runbooks                                           │
│   □ Regular DR drills (quarterly)                               │
│   □ Test failover and failback                                  │
│   □ Validate RTO/RPO targets                                    │
│                                                                 │
│   Automation:                                                   │
│   □ Automate failover with Lambda                               │
│   □ Use CloudFormation/CDK for DR stack                         │
│   □ Implement chaos engineering                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Tổng kết

### Service Selection Matrix

| Requirement | Primary Service | Alternative |
|-------------|-----------------|-------------|
| Low latency content delivery | CloudFront | - |
| Low latency non-HTTP traffic | Global Accelerator | - |
| Static IP required | Global Accelerator | - |
| Global DNS with health checks | Route 53 | - |
| Global NoSQL database | DynamoDB Global Tables | - |
| Global SQL database | Aurora Global Database | - |
| Cross-region data replication | S3 CRR | DynamoDB Streams |
| Fast file uploads globally | S3 Transfer Acceleration | - |
| Edge computing | Local Zones, Wavelength | Outposts |

### Architecture Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE GLOBAL ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         Users                                   │
│                           │                                     │
│   ┌───────────────────────┴───────────────────────┐             │
│   ↓                                               ↓             │
│ Route 53                                    Route 53            │
│ (Latency/Geo Routing)                   (Health Check)          │
│   │                                               │             │
│   ↓                                               ↓             │
│ ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐     │
│ │ CloudFront  │     │   Global    │     │ S3 Transfer      │    │
│ │   (CDN)     │     │ Accelerator │     │ Acceleration     │    │
│ └─────────────┘     └─────────────┘     └─────────────────┘     │
│   │                       │                        │            │
│   └───────────────────────┼───────────────────────┘             │
│                           ↓                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                Multi-Region Infrastructure              │   │
│   │                                                         │   │
│   │  Region A (Primary)        Region B (Secondary)         │   │
│   │  ┌─────────────────┐      ┌─────────────────┐            │  │
│   │  │ ALB + ECS/EC2   │      │ ALB + ECS/EC2   │            │  │
│   │  └─────────────────┘      └─────────────────┘            │  │
│   │           │                        │                     │  │
│   │  ┌─────────────────┐      ┌─────────────────┐            │  │
│   │  │ Aurora Primary  │←────→│ Aurora Secondary│            │  │
│   │  └─────────────────┘      └─────────────────┘            │  │
│   │                                                         │   │
│   │  ┌─────────────────────────────────────────────────┐     │  │
│   │  │         DynamoDB Global Tables                  │     │  │
│   │  │    (Active-Active across all regions)           │     │  │
│   │  └─────────────────────────────────────────────────┘     │  │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Global Accelerator Documentation](https://docs.aws.amazon.com/global-accelerator/)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)
- [Route 53 Developer Guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/)
- [Disaster Recovery of Workloads on AWS](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/)
- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/)
