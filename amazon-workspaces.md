# Amazon WorkSpaces


## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Kiến trúc](#2-kiến-trúc)
- [3. WorkSpaces Personal vs Pools](#3-workspaces-personal-vs-pools)
- [4. Bundle Types](#4-bundle-types)
- [5. Streaming Protocols](#5-streaming-protocols)
- [6. Directory Integration](#6-directory-integration)
- [7. Security](#7-security)
- [8. Multi-Region Resilience](#8-multi-region-resilience)
- [9. Pricing](#9-pricing)
- [10. So sánh với các dịch vụ khác](#10-so-sánh-với-các-dịch-vụ-khác)
- [11. Exam Tips](#11-exam-tips)
- [12. Tài liệu tham khảo](#12-tài-liệu-tham-khảo)

---

## 1. Tổng quan

**Amazon WorkSpaces** là dịch vụ **Desktop as a Service (DaaS)** fully managed, cho phép bạn cung cấp **virtual desktops** trên cloud cho users, thay thế desktop vật lý hoặc VDI on-premises.

### Tại sao cần WorkSpaces?

| Vấn đề truyền thống (On-premises VDI) | Giải pháp với WorkSpaces |
|---|---|
| Phải mua và quản lý hardware | **Fully managed** - AWS lo hạ tầng |
| Khó scale khi thêm nhân viên | **Scale nhanh** - provision trong vài phút |
| Upfront cost cao | **Pay-as-you-go** - trả theo tháng hoặc giờ |
| Phải patch OS, update security | **AWS managed** updates và patches |
| Khó support remote workers | **Access từ mọi nơi** - chỉ cần internet |
| Phức tạp khi deploy globally | **Multi-Region** deployment |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Amazon WorkSpaces                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Desktop as a Service (DaaS)                       │   │
│  │                                                                      │   │
│  │   Users access virtual desktops from ANY device, ANYWHERE            │   │
│  │   → Laptop, Tablet, iPad, Zero Client, Chromebook, Web Browser       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Supported OS:                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ Windows 10 │ │ Windows 11 │ │ Amazon     │ │ Ubuntu     │               │
│  │            │ │            │ │ Linux 2    │ │            │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│                                                                             │
│  Access via:                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Windows  │ │ macOS    │ │ Linux    │ │ iPad     │ │ Web      │         │
│  │ Client   │ │ Client   │ │ Client   │ │ Client   │ │ Browser  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       WorkSpaces Architecture                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User Devices                        AWS Cloud                             │
│   ┌──────────┐                                                              │
│   │ Laptop   │ ──┐                                                          │
│   └──────────┘   │                                                          │
│   ┌──────────┐   │    ┌───────────┐    ┌─────────────────────────────┐      │
│   │ Tablet   │ ──┼──► │ Internet  │──► │  WorkSpaces Gateway         │      │
│   └──────────┘   │    │ / VPN     │    │  (Authentication)           │      │
│   ┌──────────┐   │    └───────────┘    └────────────┬────────────────┘      │
│   │ Browser  │ ──┘                                  │                       │
│   └──────────┘                                      ▼                       │
│                                        ┌─────────────────────────────┐      │
│                                        │        Your VPC             │      │
│                                        │                             │      │
│                                        │   ┌─────────────────────┐   │      │
│                                        │   │  Directory Service   │   │      │
│                                        │   │  (AD / Simple AD)   │   │      │
│                                        │   └─────────┬───────────┘   │      │
│                                        │             │               │      │
│                                        │   ┌─────────▼───────────┐   │      │
│                                        │   │    WorkSpaces        │   │      │
│                                        │   │  ┌─────┐ ┌─────┐    │   │      │
│                                        │   │  │ WS1 │ │ WS2 │    │   │      │
│                                        │   │  └─────┘ └─────┘    │   │      │
│                                        │   │  ┌─────┐ ┌─────┐    │   │      │
│                                        │   │  │ WS3 │ │ WS4 │    │   │      │
│                                        │   │  └─────┘ └─────┘    │   │      │
│                                        │   └─────────────────────┘   │      │
│                                        │                             │      │
│                                        └─────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Mô tả |
|---|---|
| **WorkSpaces Gateway** | Entry point, handles authentication |
| **Directory Service** | User identity (AD Connector, Simple AD, Managed AD) |
| **WorkSpace Instance** | Virtual desktop chạy trong VPC |
| **Root Volume (C:)** | OS và applications (EBS) |
| **User Volume (D:)** | User data và profile (EBS) |
| **ENI** | 2 ENIs: 1 cho management, 1 cho user traffic |

---

## 3. WorkSpaces Personal vs Pools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WorkSpaces Types                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────┐  ┌─────────────────────────────────┐ │
│  │  🖥️  WorkSpaces PERSONAL          │  │  👥 WorkSpaces POOLS            │ │
│  │  ───────────────────────────────  │  │  ───────────────────────────── │ │
│  │                                   │  │                               │ │
│  │  • 1 user = 1 dedicated desktop   │  │  • Shared pool of desktops    │ │
│  │  • PERSISTENT storage             │  │  • NON-PERSISTENT storage     │ │
│  │  • Cài đặt apps, lưu files        │  │  • Reset sau mỗi session      │ │
│  │  • Personalized settings          │  │  • Giống nhau cho mọi user    │ │
│  │                                   │  │                               │ │
│  │  Best for:                        │  │  Best for:                    │ │
│  │  → Developers                     │  │  → Call center agents         │ │
│  │  → Knowledge workers              │  │  → Task workers               │ │
│  │  → Long-term employees            │  │  → Seasonal/temporary staff   │ │
│  │  → Power users                    │  │  → Shared workstations        │ │
│  └───────────────────────────────────┘  └─────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Feature | Personal | Pools |
|---|---|---|
| **Persistence** | ✅ Persistent (data lưu lại) | ❌ Non-persistent (reset mỗi session) |
| **Dedication** | 1:1 (1 user = 1 desktop) | N:M (nhiều users share pool) |
| **Customization** | Cao (cài app, save settings) | Thấp (standard image) |
| **Cost** | Cao hơn | Thấp hơn (efficient resource use) |
| **Auto Stop** | ✅ Stop khi không dùng | N/A (pool scales down) |
| **Use case** | Full-time employees | Part-time, seasonal, task workers |

---

## 4. Bundle Types

**Bundle** = combination of compute, memory, storage được pre-configured.

| Bundle | vCPU | Memory | Storage | Use Case |
|--------|------|--------|---------|----------|
| **Value** | 1 | 2 GB | 10 GB root + 10 GB user | Light tasks, browsing |
| **Standard** | 2 | 4 GB | 80 GB root + 50 GB user | Office apps, email |
| **Performance** | 2 | 8 GB | 80 GB root + 100 GB user | Business apps, development |
| **Power** | 4 | 16 GB | 175 GB root + 100 GB user | Data analysis, engineering |
| **PowerPro** | 8 | 32 GB | 175 GB root + 100 GB user | Heavy workloads |
| **Graphics.g4dn** | 4 | 16 GB | 100 GB root + 100 GB user | 3D modeling, video editing |
| **GraphicsPro.g4dn** | 16 | 64 GB | 100 GB root + 100 GB user | GPU-intensive apps |

> [!NOTE]
> Storage có thể customize. Root volume (OS) và User volume (data) là **EBS volumes riêng biệt**, cho phép snapshot và restore độc lập.

---

## 5. Streaming Protocols

WorkSpaces hỗ trợ **2 giao thức streaming**:

| Protocol | PCoIP | DCV (NICE Desktop Cloud Visualization) |
|---|---|---|
| **Developed by** | Teradici | NICE (AWS) |
| **Best for** | General desktop, video | High-performance graphics, GPU |
| **UDP support** | ✅ | ✅ |
| **Bidirectional video** | ❌ | ✅ (webcam, video calls) |
| **Network tolerance** | Tốt | Tốt hơn (higher loss/latency tolerance) |
| **Web Access** | ✅ | ✅ |
| **Linux support** | ❌ | ✅ |
| **Recommendation** | Legacy workloads | **Recommended** cho mới |

> [!TIP]
> **DCV là protocol được khuyến nghị** cho các deployments mới vì hiệu suất tốt hơn, hỗ trợ webcam/video calls, và tolerance cao hơn với network issues.

---

## 6. Directory Integration

WorkSpaces **BẮT BUỘC** phải kết nối với một directory service để quản lý user identity.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Directory Options                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Option 1: Simple AD (AWS Managed)                                          │
│  ┌──────────────────────────────────────────────┐                           │
│  │  • Standalone directory by AWS                │                           │
│  │  • Small: ≤ 500 users | Large: ≤ 5,000 users │                           │
│  │  • Best for: Small orgs, không có AD sẵn     │                           │
│  │  • ⚠️ Không support MFA, trusts              │                           │
│  └──────────────────────────────────────────────┘                           │
│                                                                             │
│  Option 2: AD Connector                                                     │
│  ┌──────────────────────────────────────────────┐                           │
│  │  • Proxy tới on-premises Active Directory     │                           │
│  │  • Không lưu data trên AWS                    │                           │
│  │  • Best for: Có AD on-prem sẵn, hybrid       │                           │
│  │  • ✅ Support MFA qua RADIUS                  │                           │
│  └──────────────────────────────────────────────┘                           │
│                                                                             │
│  Option 3: AWS Managed Microsoft AD                                         │
│  ┌──────────────────────────────────────────────┐                           │
│  │  • Full Microsoft AD trên AWS                 │                           │
│  │  • Trust relationship với on-prem AD          │                           │
│  │  • Best for: Enterprise, cần full AD features │                           │
│  │  • ✅ Support MFA, Group Policies, Trusts     │                           │
│  └──────────────────────────────────────────────┘                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security

### 7.1. Encryption

| Data | Encryption |
|---|---|
| **In-transit** | AES-256 (PCoIP/DCV protocol) |
| **Root volume (EBS)** | ✅ KMS encryption available |
| **User volume (EBS)** | ✅ KMS encryption available |
| **Data dùng AWS owned key hoặc customer managed CMK** | ✅ |

### 7.2. Network Security

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Network Security                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  • WorkSpaces nằm trong VPC → Security Groups áp dụng                       │
│  • IP Access Control Groups: whitelist client IP ranges                     │
│  • Có thể restrict clipboard, file transfer, printing                       │
│  • MFA support (RADIUS)                                                     │
│  • Smart card authentication (CAC/PIV)                                      │
│  • Certificate-based authentication                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3. Access Controls

| Feature | Mô tả |
|---|---|
| **Clipboard redirection** | Enable/disable copy-paste giữa local ↔ WorkSpace |
| **File transfer** | Enable/disable transfer files giữa local ↔ WorkSpace |
| **Printing** | Local printing từ WorkSpace |
| **Drive redirection** | Map local drives vào WorkSpace |
| **Time-based access** | Restrict access theo giờ làm việc |

---

## 8. Multi-Region Resilience

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Multi-Region Resilience                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Primary Region (ap-southeast-1)     Standby Region (ap-northeast-1)        │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐        │
│  │                             │     │                             │        │
│  │   ┌─────┐  ┌─────┐         │     │   ┌─────┐  ┌─────┐         │        │
│  │   │ WS1 │  │ WS2 │  ACTIVE │     │   │ WS1'│  │ WS2'│ STANDBY │        │
│  │   └─────┘  └─────┘         │     │   └─────┘  └─────┘         │        │
│  │   ┌─────┐  ┌─────┐         │     │   ┌─────┐  ┌─────┐         │        │
│  │   │ WS3 │  │ WS4 │         │     │   │ WS3'│  │ WS4'│         │        │
│  │   └─────┘  └─────┘         │     │   └─────┘  └─────┘         │        │
│  │                             │     │                             │        │
│  └─────────────────────────────┘     └─────────────────────────────┘        │
│                                                                             │
│  Khi primary region gặp sự cố → Failover sang standby region               │
│  • Chỉ cho WorkSpaces Personal                                              │
│  • User data được sync cross-region                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Pricing

### 9.1. Pricing Models

| Model | Cách tính | Best for |
|---|---|---|
| **Monthly** | Fixed rate/tháng (luôn bật) | Full-time users dùng > 80h/tháng |
| **Hourly** | Small fixed monthly fee + $/giờ sử dụng | Part-time, < 80h/tháng |
| **Pools** | $/user/tháng + $/giờ streaming | Shared, non-persistent desktops |

### 9.2. Pricing Examples (US East - Virginia)

| Bundle | Monthly | Hourly (Monthly fee + /hour) |
|--------|---------|------------------------------|
| **Value** | ~$21/tháng | $7.25/tháng + $0.17/giờ |
| **Standard** | ~$35/tháng | $9.75/tháng + $0.30/giờ |
| **Performance** | ~$48/tháng | $11.25/tháng + $0.46/giờ |
| **Power** | ~$78/tháng | $13.00/tháng + $0.80/giờ |
| **Graphics** | ~$53/tháng | $14.00/tháng + $1.92/giờ |

> [!NOTE]
> - Prices chưa bao gồm **Windows RDS SAL** (thêm ~$4.19/user/tháng nếu dùng Windows)
> - **AutoStop** (hourly mode): WorkSpace auto-stop sau khoảng thời gian idle → tiết kiệm chi phí
> - Giá có thể thay đổi, check [AWS Pricing Page](https://aws.amazon.com/workspaces/pricing/) để biết giá mới nhất

---

## 10. So sánh với các dịch vụ khác

| Feature | Amazon WorkSpaces | Amazon AppStream 2.0 | EC2 + RDP |
|---|---|---|---|
| **Loại** | Full Desktop (DaaS) | Application Streaming | Self-managed desktop |
| **Persistence** | ✅ (Personal) | ❌ Non-persistent | ✅ |
| **User experience** | Full Windows/Linux desktop | Chỉ app cụ thể | Full desktop |
| **Management** | Fully managed | Fully managed | Self-managed |
| **Directory** | Bắt buộc (AD) | Optional | Tùy bạn |
| **Scaling** | Manual (add WorkSpaces) | Auto scale | Manual |
| **Cost model** | Monthly/Hourly per user | Per user streaming hour | Per instance |
| **Best for** | Remote workforce, VDI replacement | Deliver specific apps | Dev/test, custom needs |

> [!IMPORTANT]
> **WorkSpaces** = cung cấp **FULL DESKTOP** cho users
> **AppStream 2.0** = chỉ stream **SPECIFIC APPLICATIONS** (không cần full desktop)
>
> Đề thi hay hỏi phân biệt 2 dịch vụ này!

---

## 11. Exam Tips

1. **WorkSpaces** = managed DaaS, thay thế **VDI on-premises** → chọn khi đề nói "virtual desktops for remote workers"
2. **WorkSpaces vs AppStream 2.0**: WorkSpaces = full desktop, AppStream = chỉ streaming apps cụ thể
3. **WorkSpaces Personal** = persistent, **Pools** = non-persistent (cost-effective cho task workers)
4. **Directory bắt buộc**: Simple AD, AD Connector, hoặc AWS Managed AD
5. **Protocols**: PCoIP và DCV - DCV là recommended cho deployments mới
6. **Pricing**: Monthly (full-time) vs Hourly (part-time) - AutoStop giúp tiết kiệm
7. Khi đề nói "securely access desktops from anywhere" hoặc "cloud-based virtual desktops" → **WorkSpaces**
8. **Multi-Region Resilience** cho DR scenario - chỉ cho WorkSpaces Personal
9. WorkSpaces chạy trong **VPC** của bạn → áp dụng Security Groups, NACLs
10. **Encryption** at rest (KMS) và in transit (AES-256) đều supported

---

## 12. Tài liệu tham khảo

- [Amazon WorkSpaces Documentation](https://docs.aws.amazon.com/workspaces/)
- [Amazon WorkSpaces Features](https://aws.amazon.com/workspaces/features/)
- [Amazon WorkSpaces Pricing](https://aws.amazon.com/workspaces/pricing/)
- [WorkSpaces Personal vs Pools](https://docs.aws.amazon.com/workspaces/)
- [Amazon AppStream 2.0](https://aws.amazon.com/appstream2/) - So sánh với WorkSpaces
