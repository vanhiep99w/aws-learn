# Amazon Route 53

## Tổng quan

**Amazon Route 53** là dịch vụ **Domain Name System (DNS)** có tính sẵn sàng cao và khả năng mở rộng của AWS. Tên "Route 53" lấy từ **cổng 53** - cổng tiêu chuẩn của giao thức DNS.

> **Nguồn:** [Route 53 Developer Guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/)

---

## 3 Chức năng chính

Route 53 cung cấp **3 chức năng chính**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Amazon Route 53                               │
│                                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │     Domain      │  │       DNS       │  │     Health      │    │
│   │  Registration   │  │     Routing     │  │     Checks      │    │
│   │                 │  │                 │  │                 │    │
│   │  Đăng ký tên    │  │  Phân giải DNS  │  │  Kiểm tra sức   │    │
│   │  miền mới       │  │  & routing      │  │  khỏe resources │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

| Chức năng | Mô tả | Ví dụ |
|-----------|-------|-------|
| **Domain Registration** | Đăng ký và quản lý tên miền | `example.com`, `myapp.io` |
| **DNS Routing** | Phân giải domain → IP address | `example.com` → `54.231.12.45` |
| **Health Checks** | Giám sát sức khỏe của resources | Kiểm tra endpoint còn sống không |

---

## DNS là gì?

**DNS (Domain Name System)** là hệ thống "danh bạ điện thoại" của Internet, chuyển đổi tên miền thành địa chỉ IP.

> **Quan trọng:** DNS là hệ thống **phân tán toàn cầu**, KHÔNG phải do AWS quản lý. Route 53 chỉ là **một trong nhiều** dịch vụ Authoritative DNS mà bạn có thể chọn.

### Ai quản lý DNS?

| Thành phần | Ai quản lý? |
|------------|-------------|
| **Root DNS** (.) | 13 tổ chức toàn cầu (ICANN, Verisign, NASA...) |
| **TLD** (.com, .vn...) | Domain registries (Verisign, VNNIC...) |
| **Authoritative DNS** (domain của bạn) | **Bạn chọn** - có thể là Route 53, Cloudflare, Google DNS... |

### DNS Resolution Flow (Chi tiết)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        DNS Resolution Flow                                    │
│                                                                              │
│   Bạn gõ: www.example.com                                                    │
│                                                                              │
│   ┌──────────┐      ①       ┌──────────────┐                                │
│   │ Browser  │ ───────────▶ │ DNS Resolver │  (ISP hoặc 8.8.8.8)            │
│   └──────────┘              └──────┬───────┘                                │
│                                    │                                         │
│                         ②  Không có cache? Hỏi Root                         │
│                                    ▼                                         │
│                             ┌────────────┐                                   │
│                             │ Root DNS   │  "Tôi không biết, hỏi .com đi"   │
│                             │    (.)     │  → Trả về địa chỉ TLD servers    │
│                             └──────┬─────┘                                   │
│                                    │                                         │
│                         ③  Hỏi TLD server                                   │
│                                    ▼                                         │
│                             ┌────────────┐                                   │
│                             │ TLD DNS    │  "example.com? Hỏi Route 53"     │
│                             │  (.com)    │  → Trả về NS của example.com     │
│                             └──────┬─────┘                                   │
│                                    │                                         │
│                         ④  Hỏi Authoritative DNS (Route 53)                 │
│                                    ▼                                         │
│                             ┌────────────┐                                   │
│                             │ Route 53   │  "www.example.com = 54.231.12.45"│
│                             │(AWS)       │  → Trả về IP address             │
│                             └──────┬─────┘                                   │
│                                    │                                         │
│                         ⑤  Resolver cache + trả về cho browser              │
│                                    ▼                                         │
│   ┌──────────┐      ⑥       ┌──────────────┐                                │
│   │ Browser  │ ◀─────────── │ DNS Resolver │  IP: 54.231.12.45              │
│   └────┬─────┘              └──────────────┘                                │
│        │                                                                     │
│        │  ⑦  Kết nối trực tiếp đến server                                   │
│        ▼                                                                     │
│   ┌──────────┐                                                              │
│   │ Server   │  54.231.12.45                                                │
│   └──────────┘                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### DNS Caching

**DNS Resolver** sẽ cache kết quả theo **TTL**, nên không phải lần nào cũng đi qua tất cả các bước:

```
Lần đầu truy cập:
Browser → Resolver → Root → TLD → Route 53 → Resolver → Browser
         (4 bước, chậm ~100-200ms)

Lần sau (trong TTL):
Browser → Resolver (đã cache!) → Browser
         (1 bước, nhanh ~1-10ms)
```

### DNS Cache được lưu ở đâu?

DNS Cache được lưu ở **nhiều tầng khác nhau**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DNS Cache Layers                                      │
│                                                                             │
│   ① Browser Cache                                                           │
│   └── Chrome, Firefox... cache DNS records                                  │
│   └── Thời gian: vài phút đến vài giờ                                       │
│   └── Clear: chrome://net-internals/#dns                                    │
│                                                                             │
│   ② OS Cache (Local DNS Cache)                                              │
│   └── Windows: DNS Client service                                           │
│   └── Linux: systemd-resolved, nscd                                         │
│   └── macOS: mDNSResponder                                                  │
│   └── Clear: ipconfig /flushdns (Windows), sudo dscacheutil -flushcache     │
│                                                                             │
│   ③ DNS Resolver Cache (ISP hoặc Public DNS)                                │
│   └── ISP DNS servers                                                       │
│   └── Google 8.8.8.8                                                        │
│   └── Cloudflare 1.1.1.1                                                    │
│   └── Cache theo TTL của record                                             │
│                                                                             │
│   ④ Authoritative DNS (Route 53)                                            │
│   └── KHÔNG cache - đây là nguồn chính thức!                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Flow khi query:**

```
Browser gõ example.com
         │
         ▼
① Check Browser Cache ──── Có? → Dùng luôn, XONG
         │ Không
         ▼
② Check OS Cache ────────── Có? → Dùng luôn, XONG
         │ Không
         ▼
③ Hỏi DNS Resolver ─────── Có cache? → Trả về, XONG
         │ Không
         ▼
④ Resolver hỏi Root → TLD → Authoritative DNS (Route 53)
         │
         ▼
    Cache kết quả theo TTL tại ③②① rồi trả về
```

### DNS Hierarchy

```
                    ┌─────────────────┐
                    │  Root (.)       │  Root DNS servers (13 tổ chức)
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │  .com   │         │  .org   │         │  .io    │   TLD servers
    └────┬────┘         └────┬────┘         └────┬────┘
         │                   │                   │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │example  │         │ wiki    │         │ myapp   │   Authoritative DNS
    │.com     │         │ .org    │         │ .io     │   (Route 53, Cloudflare...)
    └────┬────┘         └─────────┘         └─────────┘
         │
    ┌────▼────┐
    │  www    │   Subdomain
    └─────────┘
```

---

## Hosted Zones

**Hosted Zone** = **"Tủ hồ sơ"** chứa tất cả DNS records cho một domain.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOSTED ZONE: example.com                      │
│                    (Tủ hồ sơ của domain)                         │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  DNS RECORDS (Các hồ sơ trong tủ)                        │   │
│   │                                                         │   │
│   │  📄 example.com      → 54.231.12.45       (A record)    │   │
│   │  📄 www.example.com  → example.com        (CNAME)       │   │
│   │  📄 api.example.com  → 54.231.12.46       (A record)    │   │
│   │  📄 mail.example.com → mailserver.com     (MX record)   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

→ 1 domain = 1 Hosted Zone
→ Trong Hosted Zone có nhiều DNS records (A, CNAME, MX...)
```

### Hosted Zone được lưu ở đâu?

Khi bạn tạo Hosted Zone, AWS tự động assign **4 Name Servers**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Route 53 assign 4 Name Servers cho Hosted Zone của bạn:        │
│                                                                 │
│   ns-123.awsdns-45.com        (TLD .com)                       │
│   ns-456.awsdns-78.net        (TLD .net)                       │
│   ns-789.awsdns-12.org        (TLD .org)                       │
│   ns-012.awsdns-34.co.uk      (TLD .co.uk)                     │
│                                                                 │
│   → 4 TLDs khác nhau = High Availability!                      │
│   → Nếu .com TLD bị sự cố, vẫn còn .net, .org, .co.uk hoạt động│
│   → Phân tán trên 100+ AWS Edge Locations toàn cầu             │
└─────────────────────────────────────────────────────────────────┘
```

### Loại Hosted Zone

| Loại | Ai có thể query? | Use Case |
|------|------------------|----------|
| **Public Hosted Zone** | Cả thế giới qua Internet | Website, API công khai |
| **Private Hosted Zone** | Chỉ trong VPC của bạn | Database, microservices nội bộ |

```
Public Hosted Zone:                    Private Hosted Zone:
┌─────────────────────────┐            ┌─────────────────────────┐
│   example.com           │            │   internal.myapp.local  │
│   (ai cũng query được   │            │   (chỉ VPC query được)  │
│    từ Internet)         │            │                         │
│                         │            │                         │
│   www → 54.231.12.45    │            │   db → 10.0.1.50        │
│   api → 54.231.12.46    │            │   cache → 10.0.2.100    │
└─────────────────────────┘            └─────────────────────────┘
         │                                        │
         ▼                                        ▼
    Users toàn cầu                        EC2 trong VPC only
```

### Chi phí Hosted Zone

- **$0.50/tháng** cho mỗi hosted zone
- 25 hosted zones đầu tiên: $0.50/zone/tháng
- Hosted zone 26 trở đi: $0.10/zone/tháng

---

## Record Types

DNS Records = **"Danh bạ"** với nhiều loại thông tin khác nhau.

### Các loại DNS Records phổ biến

| Record Type | Trỏ đến | Use case thực tế |
|-------------|---------|------------------|
| **A** | IPv4 | Website: `example.com` → EC2 |
| **AAAA** | IPv6 | Website hỗ trợ IPv6 |
| **CNAME** | Domain khác | `www` → `example.com`, CDN |
| **MX** | Mail server | Nhận email @example.com |
| **NS** | Name servers | Route 53 quản lý domain |
| **TXT** | Văn bản | SPF, DKIM, xác minh domain |
| **SOA** | Zone metadata | Thông tin Hosted Zone (tự động) |

### Chi tiết từng loại Record

**1️⃣ A Record** - Trỏ domain → IPv4
```
"example.com có địa chỉ IP là gì?"

example.com  ──────▶  54.231.12.45
   domain                 IPv4
```

**2️⃣ CNAME Record** - Alias (Biệt danh)
```
"www là tên khác của example.com"

www.example.com ──▶ example.com ──▶ 54.231.12.45
    biệt danh         domain gốc        IP
```

**3️⃣ MX Record** - Mail Exchange
```
"Email gửi đến @example.com thì đi đâu?"

hello@example.com ──▶ mail.google.com (priority 10)
                  ──▶ mail2.google.com (priority 20, backup)
```

**4️⃣ NS Record** - Name Server
```
"Domain này dùng Name Server nào?"

example.com ──▶ ns-123.awsdns-45.com (Route 53)
```

**5️⃣ TXT Record** - Text
```
"Ghi chú thông tin cho domain"

example.com ──▶ "v=spf1 include:_spf.google.com ~all"
            ──▶ "google-site-verification=abc123"
```

### Ví dụ thực tế cho 1 website

```
┌─────────────────────────────────────────────────────────────────┐
│  Hosted Zone: mycompany.com                                      │
│                                                                 │
│  Record Type │ Name              │ Value                        │
│  ────────────┼───────────────────┼──────────────────────────────│
│  A           │ mycompany.com     │ 54.231.12.45 (Load Balancer) │
│  A           │ api.mycompany.com │ 54.231.12.46 (API server)    │
│  CNAME       │ www               │ mycompany.com                │
│  CNAME       │ blog              │ myblog.wordpress.com         │
│  MX          │ mycompany.com     │ mail.google.com (Gmail)      │
│  TXT         │ mycompany.com     │ google-site-verification=xxx │
│  NS          │ mycompany.com     │ ns-xxx.awsdns-xx.com         │
└─────────────────────────────────────────────────────────────────┘
```

### Nhiều A Records (DNS Round Robin)

Nếu có **nhiều A records cùng tên domain**, DNS trả về tất cả IPs và client chọn random:

```
┌─────────────────────────────────────────────────────────────────┐
│  Type: A  │  Name: example.com  │  Value: 152.42.220.42         │
│  Type: A  │  Name: example.com  │  Value: 152.42.220.43         │
│  Type: A  │  Name: example.com  │  Value: 152.42.220.44         │
└─────────────────────────────────────────────────────────────────┘

Query example.com → DNS trả về 3 IPs → Client chọn RANDOM 1

→ Đây gọi là "DNS Round Robin" (Load Balancing đơn giản)
→ Nhược điểm: Không có health check, server chết vẫn có thể được chọn!
→ Production nên dùng Load Balancer thay vì nhiều A records!
```

### DNS biết query loại Record nào?

**DNS query chỉ định rõ loại record cần lấy** - không phải random!

```
Browser cần IP để kết nối website:
Query: "Cho tôi A record của example.com"
→ DNS trả về: 54.231.12.45

Email client gửi email:
Query: "Cho tôi MX record của example.com"
→ DNS trả về: mail.google.com
```

| Ứng dụng | Query Type | Tại sao? |
|----------|------------|----------|
| **Browser** (Chrome, Firefox) | A hoặc AAAA | Cần IP để kết nối |
| **Email client** (Gmail, Outlook) | MX | Cần mail server |
| **DNS tools** (dig, nslookup) | Bạn chỉ định | Debug |

```bash
# Test với dig command
dig A example.com       # Query A record
dig MX example.com      # Query MX record  
dig NS example.com      # Query NS record
dig ANY example.com     # Query tất cả records
```

### A Record vs CNAME

```
A Record (trực tiếp):
┌─────────────────┐         ┌─────────────────┐
│ www.example.com │ ──────▶ │   54.231.12.45  │
└─────────────────┘         └─────────────────┘
        1 DNS lookup = nhanh

CNAME Record (gián tiếp):
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ www.example.com │ ──────▶ │   example.com   │ ──────▶ │   54.231.12.45  │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        2 DNS lookups = chậm hơn
```

### Hạn chế của CNAME

**CNAME không thể dùng cho zone apex (root domain)**:

```
✓ CNAME cho subdomain:
  www.example.com → myapp.elb.amazonaws.com

✗ CNAME cho zone apex:
  example.com → myapp.elb.amazonaws.com  ← KHÔNG THỂ!
```

---

## Alias Records (Route 53 Exclusive)

**Alias Record** là tính năng riêng của Route 53, giải quyết hạn chế của CNAME.

### So sánh Alias vs CNAME

| Tiêu chí | CNAME | Alias |
|----------|-------|-------|
| Zone apex (root domain) | ❌ Không hỗ trợ | ✅ Hỗ trợ |
| DNS lookup | 2 lookups | 1 lookup (trả về IP trực tiếp) |
| Chi phí query | Tính phí | **Miễn phí** (cho AWS resources) |
| Custom TTL | ✅ Có thể set | ❌ Tự động theo resource |
| Target | Bất kỳ DNS name | Chỉ AWS resources |

### Các AWS resources hỗ trợ Alias

```
Alias Record có thể trỏ đến:
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Elastic Load Balancer (ALB, NLB, CLB)                        │
│  ✓ CloudFront Distribution                                      │
│  ✓ API Gateway                                                   │
│  ✓ Elastic Beanstalk                                            │
│  ✓ S3 Website                                                   │
│  ✓ VPC Interface Endpoint                                       │
│  ✓ Global Accelerator                                           │
│  ✓ Route 53 record (cùng hosted zone)                           │
└─────────────────────────────────────────────────────────────────┘

Alias Record KHÔNG thể trỏ đến:
┌─────────────────────────────────────────────────────────────────┐
│  ✗ EC2 DNS name                                                 │
│  ✗ RDS DNS name                                                 │
│  ✗ ECS DNS name                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ví dụ Alias Record

```
Sử dụng Alias cho zone apex:

example.com (A record, Alias = Yes)
    │
    └──▶ dualstack.myapp-123456.us-east-1.elb.amazonaws.com
              │
              └──▶ IP: 54.231.12.45

→ Client query example.com → Nhận trực tiếp IP 54.231.12.45
→ 1 lookup, MIỄN PHÍ!
```

---

## TTL (Time To Live)

**TTL** xác định thời gian DNS resolvers cache record trước khi query lại.

```
TTL = 300s (5 phút):

T=0s                    T=300s                   T=600s
│                       │                        │
▼                       ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│     Query lần 1       │       Cached          │   Query lần 2   │
│     (đến Route 53)    │   (trả từ cache)      │  (đến Route 53) │
└─────────────────────────────────────────────────────────────────┘
```

### Trade-off TTL

| TTL | Ưu điểm | Nhược điểm |
|-----|---------|------------|
| **Cao (24h)** | Ít queries → giảm chi phí, giảm latency | Thay đổi IP mất thời gian propagate |
| **Thấp (60s)** | Thay đổi nhanh | Nhiều queries → tăng chi phí |

**Khuyến nghị:**
- **Bình thường**: 300s - 3600s
- **Trước khi thay đổi IP**: Giảm TTL xuống 60s trước vài giờ
- **Alias records**: TTL tự động theo AWS resource (không set được)

---

## Routing Policies

Route 53 cung cấp **8 routing policies** để điều khiển cách traffic được định tuyến.

### 1. Simple Routing

**Trường hợp cơ bản nhất**: 1 domain → 1 hoặc nhiều IP addresses.

```
example.com
    │
    └──▶ 54.231.12.45
         54.231.12.46   (random selection nếu nhiều values)
         54.231.12.47
```

- ❌ **Không hỗ trợ health checks**
- ✅ Có thể trả về nhiều values (client chọn random)

---

### 2. Weighted Routing

**Phân phối traffic theo tỷ lệ weight**.

```
example.com
    │
    │   Weight: 70
    ├─────────────────────▶ Server A (Production)
    │
    │   Weight: 20
    ├─────────────────────▶ Server B (Production)
    │
    │   Weight: 10
    └─────────────────────▶ Server C (Canary/Testing)

→ 70% traffic → A, 20% → B, 10% → C
```

**Use cases:**
- Load balancing giữa các regions
- **Canary deployment** (test tính năng mới với % nhỏ users)
- A/B testing
- Blue-green deployment

**Công thức tính %:**
```
Traffic % = (Weight của record) / (Tổng tất cả weights) × 100

Ví dụ: Weight A=70, B=20, C=10
Traffic A = 70 / (70+20+10) = 70%
```

---

### 3. Latency-based Routing

**Định tuyến đến region có latency thấp nhất** đến user.

```
User ở Tokyo                         User ở Paris
    │                                    │
    ▼                                    ▼
   ┌─────────────────────────────────────────────────────┐
   │              Route 53 đo latency                    │
   │   Tokyo → ap-northeast-1: 20ms                     │
   │   Tokyo → eu-west-1: 250ms                         │
   │   Paris → ap-northeast-1: 300ms                    │
   │   Paris → eu-west-1: 15ms                          │
   └─────────────────────────────────────────────────────┘
    │                                    │
    ▼                                    ▼
 ap-northeast-1                      eu-west-1
 (Japan)                             (Ireland)
```

**Lưu ý:** Latency-based routing đo **network latency**, không phải geographic distance.

---

### 4. Failover Routing

**Disaster recovery**: Primary → Secondary khi primary fails.

```
                    Health Check
                         │
                         ▼
example.com ───▶ Primary (Active)
    │                 │
    │                 │ UNHEALTHY!
    │                 ▼
    └────────▶ Secondary (Standby) ← Traffic tự động chuyển qua
```

**Cấu hình:**
- Primary record + Health check
- Secondary record (failover target)

```
┌─────────────────────────────────────────────────────────────────┐
│  Primary healthy?                                               │
│       │                                                         │
│       ├── YES → Trả về Primary IP                               │
│       │                                                         │
│       └── NO  → Trả về Secondary IP                             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Geolocation Routing

**Định tuyến dựa trên vị trí địa lý của user**.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Route 53 Geolocation                         │
│                                                                 │
│   User từ Vietnam    ──────▶  Server Singapore                  │
│   User từ Japan      ──────▶  Server Tokyo                      │
│   User từ France     ──────▶  Server Paris                      │
│   User từ nơi khác   ──────▶  Default Server                    │
│                               (bắt buộc phải có!)               │
└─────────────────────────────────────────────────────────────────┘
```

**Use cases:**
- Phục vụ content theo ngôn ngữ/region
- Tuân thủ regulations (GDPR - data phải ở EU)
- Restricting content distribution

**Quan trọng:** Luôn tạo **Default record** để xử lý các locations không match!

---

### 6. Geoproximity Routing

**Định tuyến dựa trên khoảng cách địa lý** giữa user và resources, với khả năng điều chỉnh **bias**.

```
                        Bias = 0 (mặc định)
User ở giữa 2 servers     │
         │                ▼
         │          ┌───────────────┐
         │          │ 50%  │  50%   │
         │          └───────────────┘
         │              │       │
         ▼              ▼       ▼
    ┌─────────┐    Server A   Server B
```

```
                        Bias điều chỉnh
Server A: Bias = +50          Server B: Bias = -25
         │                            │
         ▼                            ▼
    ┌────────────────────────────────────────┐
    │        70%          │        30%       │ (thay vì 50-50)
    └────────────────────────────────────────┘
```

**Bias range:** -99 đến +99
- **Positive bias** (+): Mở rộng phạm vi, thu hút nhiều traffic hơn
- **Negative bias** (-)**: Thu hẹp phạm vi, giảm traffic

**Yêu cầu:** Phải sử dụng **Route 53 Traffic Flow** để configure.

---

### 7. IP-based Routing

**Định tuyến dựa trên IP address range** của client (CIDR blocks).

```
┌─────────────────────────────────────────────────────────────────┐
│   Client IP               │           Target                    │
├───────────────────────────┼─────────────────────────────────────┤
│   24.232.0.0/16          │   Server A (Comcast users)          │
│   203.0.113.0/24         │   Server B (Enterprise network)     │
│   10.0.0.0/8             │   Server C (Internal VPN)           │
└─────────────────────────────────────────────────────────────────┘
```

**Use cases:**
- ISP-specific routing
- Enterprise customer routing
- Migrating traffic từ network này sang network khác

---

### 8. Multivalue Answer Routing

**Trả về nhiều IP addresses** (tối đa 8), kết hợp với health checks.

```
Query: example.com
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route 53 trả về tối đa 8 healthy records:                      │
│                                                                 │
│    54.231.12.45  ✓ Healthy                                      │
│    54.231.12.46  ✓ Healthy                                      │
│    54.231.12.47  ✗ Unhealthy (không trả về)                     │
│    54.231.12.48  ✓ Healthy                                      │
└─────────────────────────────────────────────────────────────────┘

Client nhận 3 IPs, tự chọn random → load balancing ở client-side
```

**So sánh với Simple Routing:**
- Simple: Không health checks, trả về tất cả values
- Multivalue: Có health checks, chỉ trả về healthy values

**Lưu ý:** Multivalue Answer **KHÔNG phải** thay thế cho ELB. Đây là "client-side load balancing" đơn giản.

---

### So sánh Routing Policies

| Policy | Use Case | Health Check | Điểm nổi bật |
|--------|----------|--------------|--------------|
| **Simple** | Đơn giản, 1 resource | ❌ | Cơ bản nhất |
| **Weighted** | Phân phối theo % | ✅ | Canary, A/B testing |
| **Latency** | Performance tốt nhất | ✅ | Multi-region apps |
| **Failover** | Disaster recovery | ✅ (bắt buộc) | Active-passive HA |
| **Geolocation** | Content localization | ✅ | Compliance, localization |
| **Geoproximity** | Flexible geo routing | ✅ | Bias adjustment |
| **IP-based** | ISP/Network routing | ✅ | Enterprise routing |
| **Multivalue** | Simple load balancing | ✅ | Client-side LB |

---

## Health Checks

Route 53 Health Checks giám sát sức khỏe của resources và tích hợp với routing policies.

### Các loại Health Checks

```
┌─────────────────────────────────────────────────────────────────┐
│                    Route 53 Health Checks                        │
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│   │    Endpoint     │  │   Calculated    │  │   CloudWatch    │ │
│   │   Health Check  │  │   Health Check  │  │   Alarm-based   │ │
│   │                 │  │                 │  │                 │ │
│   │ Kiểm tra trực   │  │ Tổng hợp nhiều  │  │ Dựa trên        │ │
│   │ tiếp endpoint   │  │ health checks   │  │ CloudWatch      │ │
│   │ (HTTP/HTTPS/TCP)│  │ con             │  │ metrics         │ │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Endpoint Health Check

**Giám sát endpoint qua HTTP, HTTPS, hoặc TCP**.

```
Route 53 Health Checkers (15+ locations)
         │
         │  HTTP GET /health
         ▼
┌─────────────────┐
│   Your Server   │
│                 │
│  Response:      │
│  HTTP 200 OK    │ ← Healthy nếu 2xx hoặc 3xx
│  "OK"           │ ← Có thể check text trong response
└─────────────────┘
```

**Cấu hình quan trọng:**

| Parameter | Default | Mô tả |
|-----------|---------|-------|
| **Interval** | 30s | Tần suất check (10s = Fast, chi phí cao hơn) |
| **Failure Threshold** | 3 | Số lần fail liên tiếp để coi là unhealthy |
| **Protocol** | HTTP | HTTP, HTTPS, TCP |
| **Port** | 80/443 | Port để kiểm tra |
| **Path** | / | URL path cho HTTP/HTTPS |
| **String Matching** | - | Kiểm tra response body chứa text cụ thể |

**Điều kiện Healthy:**
- HTTP/HTTPS: Response code 2xx hoặc 3xx
- TCP: Connection successful
- String matching: Response body chứa expected string (trong 5120 bytes đầu)

### 2. Calculated Health Check

**Tổng hợp kết quả từ nhiều health checks con**.

```
                    Parent Health Check
                    (Calculated)
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    Child HC 1      Child HC 2      Child HC 3
    (Web server)    (API server)    (DB server)
         │               │               │
         ▼               ▼               ▼
      Healthy?        Healthy?        Healthy?

Logic conditions:
├── OR:  Ít nhất 1 child healthy → Parent healthy
├── AND: Tất cả children healthy → Parent healthy
└── At least N: Ít nhất N children healthy → Parent healthy
```

### 3. CloudWatch Alarm-based Health Check

**Giám sát resources không public** thông qua CloudWatch metrics.

```
Private Resource (không thể access từ Internet)
         │
         ▼
    CloudWatch Metric
    (CPU, Memory, Custom)
         │
         ▼
    CloudWatch Alarm
    (Threshold: CPU > 80%)
         │
         ▼
    Route 53 Health Check
    (Monitors alarm state)
```

**Use cases:**
- Private resources trong VPC
- DynamoDB throttles
- Custom application metrics

---

## Route 53 + ELB Integration

**Best practice**: Sử dụng Alias record để trỏ từ domain đến ELB.

```
                        Route 53
                           │
                           │ Alias record
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    example.com                                   │
│                         │                                        │
│           Alias → myapp-lb.us-east-1.elb.amazonaws.com          │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
               ┌─────────────────┐
               │  Load Balancer  │
               └────────┬────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │   EC2   │    │   EC2   │    │   EC2   │
    └─────────┘    └─────────┘    └─────────┘
```

**Tại sao dùng Alias cho ELB?**
- ✅ Hỗ trợ zone apex (`example.com`)
- ✅ Không tốn phí query
- ✅ Tự động update khi ELB IP thay đổi

---

## Domain Registration

Route 53 có thể đăng ký và quản lý domain names.

### Quy trình đăng ký

```
┌─────────────────────────────────────────────────────────────────┐
│                    Domain Registration Flow                      │
│                                                                 │
│   1. Search domain        ───▶  Check availability              │
│                                                                 │
│   2. Register domain      ───▶  Provide contact info            │
│                                                                 │
│   3. Payment              ───▶  Annual fee (varies by TLD)      │
│                                                                 │
│   4. Verification         ───▶  Email verification (required)   │
│                                                                 │
│   5. Auto-create          ───▶  Hosted Zone created             │
│      Hosted Zone                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Chi phí (ví dụ)

| TLD | Chi phí/năm |
|-----|-------------|
| .com | $12 |
| .net | $11 |
| .org | $12 |
| .io | $39 |
| .dev | $12 |

---

## Traffic Flow (Visual Editor)

**Traffic Flow** là công cụ visual để tạo complex routing configurations.

```
Traffic Flow Visual Editor:

                    ┌─────────────────┐
                    │  Start Point    │
                    │  example.com    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Geolocation    │
                    │  Rule           │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   Asia-Pacific          Europe               Americas
        │                    │                    │
        ▼                    ▼                    ▼
  ┌───────────┐        ┌───────────┐        ┌───────────┐
  │ Weighted  │        │ Weighted  │        │ Failover  │
  └─────┬─────┘        └─────┬─────┘        └─────┬─────┘
        │                    │                    │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   ▼         ▼          ▼         ▼          ▼         ▼
Tokyo   Singapore   Ireland   Frankfurt   Primary Secondary
```

- **Chi phí**: $50/month cho mỗi traffic policy record
- **Lợi ích**: Versioning, tái sử dụng policies

---

## DNSSEC

**DNSSEC (DNS Security Extensions)** bảo vệ chống lại DNS spoofing attacks.

```
Không có DNSSEC (DNS Spoofing):

Client                  Attacker               Real DNS
   │                       │                      │
   │   "example.com?"      │                      │
   │ ──────────────────────│──────────────────────▶
   │                       │                      │
   │   (Intercept!)        │                      │
   │ ◀─────────────────────│                      │
   │   "IP: 1.2.3.4"       │  (fake IP)          │
   │   (malicious)         │                      │
   ▼                       │                      │

Với DNSSEC:

   │   "example.com?"      │                      │
   │ ──────────────────────│──────────────────────▶
   │                       │                      │
   │   Response:           │                      │
   │   IP: 54.231.12.45    │                      │
   │   + Digital Signature │  ← SIGNED!           │
   │ ◀─────────────────────────────────────────────
   │                       │
   │   Verify signature?   │
   │   ✓ Valid → Trust response
```

---

## Pricing

| Component | Chi phí |
|-----------|---------|
| **Hosted Zone** | $0.50/hosted zone/tháng |
| **Queries (Standard)** | $0.40/1M queries (first 1B) |
| **Queries (Latency-based)** | $0.60/1M queries |
| **Queries (Geo DNS)** | $0.70/1M queries |
| **Health Checks (basic)** | $0.50/health check/tháng |
| **Health Checks (HTTPS/String)** | $0.75/health check/tháng |
| **Health Checks (Fast, 10s)** | $1.00/health check/tháng |
| **Traffic Flow Policy** | $50/policy record/tháng |

> **Nguồn:** [Route 53 Pricing](https://aws.amazon.com/route53/pricing/)

---

## Best Practices

### 1. Alias over CNAME

```
✓ LUÔN dùng Alias cho AWS resources
  - Miễn phí queries
  - Hỗ trợ zone apex
  - Auto-update IP

✗ KHÔNG dùng CNAME cho AWS resources
  - Tốn phí
  - Không dùng được cho zone apex
```

### 2. Combine Routing Policies

```
Kết hợp Latency + Weighted:

                    Latency Routing
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
       US-East-1                  EU-West-1
           │                           │
     Weighted 90/10              Weighted 90/10
     │         │                 │         │
     ▼         ▼                 ▼         ▼
Production  Canary          Production  Canary
```

### 3. Health Check Strategy

```
Production Setup:

Primary (Active)
    │
    ├── Health Check (HTTP 200)
    │       │
    │       └── Unhealthy → Failover
    │
    ▼
Secondary (Standby in different AZ/Region)
    │
    └── Health Check
```

### 4. TTL Strategy trước khi thay đổi

```
Timeline thay đổi IP:

T-24h: Giảm TTL xuống 60s
       │
T-0h:  Thay đổi IP address
       │
T+1h:  Xác nhận traffic đã chuyển
       │
T+24h: Tăng TTL lên 3600s
```

---

## Exam Tips (AWS Certification)

| Keyword trong câu hỏi | Routing Policy |
|----------------------|----------------|
| "lowest latency" | Latency-based |
| "disaster recovery", "active-passive" | Failover |
| "localized content", "compliance", "restrict by country" | Geolocation |
| "canary deployment", "A/B testing", "gradually shift" | Weighted |
| "expand/shrink traffic region" | Geoproximity với Bias |
| "route based on client IP range" | IP-based |
| "return multiple healthy IPs" | Multivalue Answer |

---

## Liên kết

- [ELB](elb.md) - Load Balancing
- [CloudFront](cloudfront.md) - CDN
- [VPC](vpc.md) - Networking
- [EC2](ec2.md) - Compute instances
