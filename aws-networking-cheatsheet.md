# AWS Networking — Cheatsheet Ghi Nhớ Nhanh

## Mục lục

- [Bức tranh tổng thể](#bức-tranh-tổng-thể)
- [6 loại kết nối — phân theo "từ đâu → tới đâu"](#6-loại-kết-nối--phân-theo-từ-đâu--tới-đâu)
- [Mẹo nhớ nhanh — PING](#mẹo-nhớ-nhanh--ping)
- [Chi tiết từng loại](#chi-tiết-từng-loại)
- [ENI và Route Table — 2 khái niệm nền tảng](#eni-và-route-table--2-khái-niệm-nền-tảng)
- [Interface Endpoint tạo ENI ở đâu?](#interface-endpoint-tạo-eni-ở-đâu)
- [Tại sao S3/DynamoDB cần cả Gateway lẫn Interface Endpoint?](#tại-sao-s3dynamodb-cần-cả-gateway-lẫn-interface-endpoint)
- [Bảng so sánh tổng hợp](#bảng-so-sánh-tổng-hợp)
- [Câu hỏi thi hay gặp](#câu-hỏi-thi-hay-gặp)
- [Tài liệu liên quan trong repo](#tài-liệu-liên-quan-trong-repo)

---

## Bức tranh tổng thể

```
                           🌐 INTERNET
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
        CloudFront        Route 53          Global Accelerator
        (CDN/cache)       (DNS)             (TCP/UDP routing)
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
     Internet GW          NAT Gateway          Egress-only IGW
     (public, 2 chiều)   (private→out)         (IPv6 only, out)
          │                    │                    │
┌─────────┴────────────────────┴────────────────────┴───────────┐
│                                                               │
│                        YOUR VPC                               │
│                                                               │
│  ┌─ Public Subnet ─┐    ┌─ Private Subnet ──────────────────┐ │
│  │  EC2 (web/ALB)  │    │  EC2, RDS, Lambda                 │ │
│  │  NAT Gateway    │    │     │           │                 │ │
│  └─────────────────┘    │     │           │                 │ │
│                         │  GW Endpoint   Interface Endpoint │ │
│                         │  → S3, DDB     → SQS, SNS, ...    │ │
│                         └───────────────────────────────────┘ │
│                                                               │
└───────┬──────────────┬──────────────────┬─────────────────────┘
        │              │                  │
   VPC Peering    Transit GW         PrivateLink
   (1:1 VPC)     (hub nhiều VPC)    (expose 1 service)
        │              │                  │
   ┌────┘         ┌────┘                  │
   VPC khác       VPC B, C, D...      VPC khác (chỉ 1 service)
                       │
              ┌────────┴────────┐
              │                 │
         Site-to-Site VPN    Direct Connect
         (qua internet,     (đường riêng,
          mã hóa, rẻ)        đắt, ổn định)
              │                 │
              └────────┬────────┘
                       │
                🏢 ON-PREMISES
```

---

## 6 loại kết nối — phân theo "từ đâu → tới đâu"

```
①  Trong VPC ←→ Trong VPC         → Private IP (tự động, không cần gì)
②  VPC → AWS Services (S3, SQS)   → VPC Endpoints (Gateway / Interface)
③  VPC ←→ VPC                     → VPC Peering / Transit GW / PrivateLink
④  On-Premises ←→ AWS             → VPN / Direct Connect
⑤  VPC → Internet                 → IGW / NAT GW / Egress-only IGW
⑥  User → App (phân phối)         → CloudFront / Route 53 / Global Accelerator
```

---

## Mẹo nhớ nhanh — PING

Dùng chữ **PING** để nhớ 4 nhóm chính:

| Chữ | Nhóm | Gồm |
|-----|-------|------|
| **P** — Private access | VPC → AWS Services | Gateway Endpoint, Interface Endpoint |
| **I** — Inter-VPC | VPC ←→ VPC | VPC Peering, Transit Gateway, PrivateLink |
| **N** — Network bridge | On-Prem ←→ AWS | Site-to-Site VPN, Direct Connect, Client VPN |
| **G** — Global delivery | User → App | CloudFront, Route 53, Global Accelerator |

---

## Chi tiết từng loại

### ① Trong cùng VPC — Tự động

Không cần cấu hình gì. Cùng VPC → gọi qua private IP.

```
EC2 (10.0.1.5) ←── private IP ──→ RDS (10.0.2.10)
```

---

### ② VPC → AWS Public Services — VPC Endpoints

> Xem chi tiết: [vpc-endpoints.md](vpc-endpoints.md)

**Bài toán**: EC2 trong private subnet muốn gọi S3, SQS... mà không đi qua internet.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Gateway Endpoint               Interface Endpoint       │
│  ════════════════               ══════════════════       │
│  • Chỉ S3 + DynamoDB           • Hàng trăm services      │
│  • Thêm route trong            • Tạo ENI (có private     │
│    route table                    IP) trong subnet       │
│  • MIỄN PHÍ                    • CÓ PHÍ                  │
│  • Chỉ trong VPC               • On-prem, cross-region   │
│                                                          │
│  EC2 ──route table──→ S3       EC2 ──→ ENI ──→ SQS       │
│       (bẻ hướng)                    (gọi IP)             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Cách nhớ**: **G**ateway = **G**ratis (miễn phí) = chỉ **2G** (S3 + DynamoDB)

---

### ③ VPC ←→ VPC — Peering / Transit GW / PrivateLink

> Xem chi tiết: [vpc.md](vpc.md)

```
VPC Peering                Transit Gateway              PrivateLink
═══════════                ═══════════════              ═══════════
Nối 1:1                    Hub trung tâm                Expose 1 service
                                                        
VPC A ←────→ VPC B         VPC A ──┐                    VPC A
                           VPC B ──┼→ 🔀 TGW            [NLB] → app
                           VPC C ──┘                       │
                                                        VPC B
                                                        [ENI] → gọi app

Dùng khi:                  Dùng khi:                    Dùng khi:
• 2-3 VPC                  • Nhiều VPC (>3)             • Chỉ expose 1 service
• Đơn giản                 • On-prem + VPC              • Không mở toàn bộ mạng
• KHÔNG transitive         • Routing tập trung          • SaaS provider model
```

**Cách nhớ**:
- **Peering** = **P**air (cặp đôi, 1:1)
- **Transit GW** = **T**rạm trung chuyển (hub)
- **PrivateLink** = "cho mượn 1 phòng, không cho vào nhà"

**VPC Peering KHÔNG transitive** — đây là bẫy thi cực phổ biến:

```
  A ←→ B ←→ C

  ❌ A KHÔNG nói chuyện được với C qua B
  ✅ Muốn A ↔ C phải tạo thêm peering riêng
```

---

### ④ On-Premises ←→ AWS — VPN / Direct Connect

> Xem chi tiết: [direct-connect.md](direct-connect.md)

```
                    Site-to-Site VPN          Direct Connect
                    ═══════════════          ══════════════
Đường đi:          Qua INTERNET              Đường vật lý RIÊNG
Mã hóa:            IPSec (có)                Không mặc định (thêm VPN nếu cần)
Setup:             Vài phút                  Vài tuần → vài tháng
Chi phí:           Rẻ                        Đắt (1/10 Gbps port)
Bandwidth:         Không đảm bảo             Ổn định, cam kết
Latency:           Biến động                 Thấp, ổn định
Redundancy:        2 tunnels tự động         Cần order 2 connections riêng

🏢 ──🔒──→ Internet ──→ VPC     🏢 ════ đường riêng ════→ VPC
       (VPN)                          (Direct Connect)
```

**Cách nhớ**:
- **VPN** = **V**ừa rẻ **V**ừa nhanh setup, nhưng **V**ô chừng bandwidth
- **Direct Connect** = **D**ắt nhưng **D**ành riêng, **D**ùng cho workload nhạy cảm latency

**Client VPN** — khác Site-to-Site:

```
Site-to-Site VPN = nối CẢ MẠNG công ty ←→ AWS
Client VPN       = nối TỪNG NGƯỜI (laptop) → AWS
```

**VPN CloudHub** — hub-and-spoke cho nhiều site:

> Xem chi tiết: [vpc.md#75-aws-vpn-cloudhub](vpc.md#75-aws-vpn-cloudhub)

**4 thuật ngữ phải biết trước** (giải thích ngắn — chi tiết xem `vpc.md`):

| Viết tắt | Là gì? | Ví dụ đời thực |
|----------|--------|----------------|
| **VGW** (Virtual Private Gateway) | Cổng VPN **phía AWS**, gắn vào VPC | Ổ cắm mạng trong nhà AWS |
| **CGW** (Customer Gateway) | Object AWS **khai báo router của bạn** (public IP, ASN) | Tờ khai CMND của router nhà bạn |
| **BGP** (Border Gateway Protocol) | Giao thức router **tự trao đổi route động** | Bảng tin chung — ai có route mới thì dán lên |
| **ASN** (Autonomous System Number) | **"Số nhà"** của mỗi mạng trong BGP, mỗi CGW 1 số | Số CMND, không được trùng |

```
Bài toán: nhiều chi nhánh muốn NÓI CHUYỆN VỚI NHAU qua AWS
          (không chỉ nói với VPC)

            ┌─ VGW (hub duy nhất) ─┐
            │                      │
     ┌──────┼──────┬───────────────┤
     │      │      │               │
   🏢 A   🏢 B   🏢 C            🏢 DX-site
  CGW#1  CGW#2  CGW#3           (Direct Connect
  ASN    ASN    ASN              cũng join được)
  65001  65002  65003

Yêu cầu:
• 1 VGW làm hub
• Mỗi Customer Gateway có BGP ASN riêng (unique)
• BGP dynamic routing (bắt buộc — KHÔNG dùng static)
• Các site KHÔNG chồng CIDR

Khi VGW nhận prefix từ Site A → re-advertise cho B, C
→ Các site thấy nhau qua VGW
```

**Cách nhớ**: CloudHub = **H**ub-and-spoke cho VPN, **H**oạt động nhờ BGP, **H**ỗ trợ cả không có VPC.

Phân biệt với Transit Gateway:

```
VPN CloudHub       → Hub cho nhiều SITE on-prem (qua VGW, bắt buộc BGP)
Transit Gateway    → Hub cho nhiều VPC + on-prem (linh hoạt hơn)
```

---

### ⑤ VPC → Internet

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Internet GW (IGW)    NAT Gateway    Egress-only    │
│  ═════════════════    ═══════════    ════════════   │
│  Public subnet        Private subnet  Private subnet│
│  2 chiều ↕            1 chiều → out   1 chiều → out │
│  IPv4 / IPv6          IPv4 only       IPv6 only     │
│  Miễn phí             Có phí/GB       Miễn phí      │
│                                                     │
│  EC2 ←→ 🌐            EC2 → 🌐 only   EC2 → 🌐      │
│                       🌐 ✗→ EC2       (IPv6)        │
└─────────────────────────────────────────────────────┘
```

**Cách nhớ**: **NAT** = **N**o **A**ccess from ou**T**side (chỉ ra, không vào)

---

### ⑥ Global Delivery — CloudFront / Route 53 / Global Accelerator

> Xem chi tiết: [cloudfront.md](cloudfront.md) | [route53.md](route53.md) | [global-applications-architecture.md](global-applications-architecture.md)

```
CloudFront               Route 53              Global Accelerator
══════════               ════════              ══════════════════
CDN — cache content      DNS — phân giải tên   Anycast IP — routing
ở edge locations         miền, health check     TCP/UDP qua AWS backbone

User → Edge → Cache?     User → DNS query      User → Anycast IP
       ├─ Yes → trả về          → IP routing          → AWS backbone
       └─ No → origin                                  → nearest Region
          (S3/ALB/EC2)

Dùng khi:                Dùng khi:             Dùng khi:
• Static content         • Domain routing      • Non-HTTP (TCP/UDP)
• Dynamic acceleration   • Failover            • Static IP cần thiết
• HTTPS/DDoS Shield      • Geolocation         • Fast regional failover
```

**Cách nhớ**:
- **CloudFront** = **C**ache **C**ontent ở **C**lose (gần user)
- **Route 53** = **R**oute traffic bằng DNS (port 53)
- **Global Accelerator** = không cache, chỉ **A**ccelerate đường đi

---

## ENI và Route Table — 2 khái niệm nền tảng

### ENI (Elastic Network Interface) — "Card mạng ảo"

ENI = card mạng ảo trong AWS. Muốn có IP trong VPC → cần ENI.

> Xem chi tiết: [eni.md](eni.md)

Mỗi ENI mang theo: **Private IP** (bắt buộc), MAC address, Security Groups, Public/Elastic IP (tùy chọn).

```
┌─────────────── Subnet (10.0.1.0/24) ──────────────────┐
│                                                       │
│   EC2 Instance                                        │
│   ├── eth0 (Primary ENI) ← tự động tạo khi launch     │
│   │   └── Private IP: 10.0.1.15                       │
│   └── eth1 (Secondary ENI) ← gắn thêm nếu cần         │
│       └── Private IP: 10.0.1.99                       │
│                                                       │
│   RDS Instance                                        │
│   └── ENI (tự động) ← Private IP: 10.0.1.50           │
│                                                       │
│   Lambda (trong VPC)                                  │
│   └── ENI (tự động) ← Private IP: 10.0.1.72           │
│                                                       │
│   Interface VPC Endpoint (ví dụ: SQS)                 │
│   └── ENI (tự động) ← Private IP: 10.0.1.88           │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Quy tắc**: Nằm trong VPC = có ENI = có private IP. Nằm ngoài VPC = không có ENI.

```
CÓ ENI (nằm trong VPC):              KHÔNG CÓ ENI (nằm ngoài VPC):
EC2, RDS, ElastiCache, ELB,          S3, DynamoDB, SQS, SNS,
Lambda (VPC mode), NAT Gateway,      Lambda (mặc định), CloudWatch,
Interface Endpoint, EFS mount,        IAM, Route 53, CloudFront,
WorkSpaces, Redshift, OpenSearch      API Gateway, Step Functions
```

**Hay bị nhầm — Lambda**:

```
Lambda MẶC ĐỊNH  → không có ENI, chạy trong mạng AWS
                 → gọi S3, internet OK, nhưng KHÔNG gọi được RDS trong private subnet

Lambda VPC MODE  → AWS tạo ENI trong subnet bạn chọn
                 → gọi được RDS, nhưng MẤT internet (cần NAT Gateway)
```

### Route Table — "Bảng chỉ đường"

Route table cho VPC biết: traffic đi đâu thì rẽ hướng nào.

```
Route Table của Private Subnet
┌──────────────────────┬─────────────────────┐
│ Destination          │ Target              │
├──────────────────────┼─────────────────────┤
│ 10.0.0.0/16          │ local               │  ← trong VPC → đi nội bộ
│ 0.0.0.0/0            │ nat-gw-xxx          │  ← ra internet → qua NAT
│ pl-S3 (S3 prefix)    │ vpce-s3-xxx         │  ← tới S3 → qua Gateway EP
│ pl-DDB (DDB prefix)  │ vpce-ddb-xxx        │  ← tới DynamoDB → qua Gateway EP
└──────────────────────┴─────────────────────┘
```

**Khác biệt cốt lõi giữa 2 loại endpoint**:

| | Gateway Endpoint | Interface Endpoint |
|---|---|---|
| **Cơ chế** | Thêm route trong route table | Tạo ENI trong subnet |
| **Có IP không?** | Không — "cổng" trừu tượng | **Có** — ENI có private IP |
| **Cấu hình ở đâu?** | Route table | Subnet + Security Group trên ENI |

**Ví dụ dễ nhớ**:
- **Route table** = biển chỉ đường: "Đi S3 → rẽ phải vào cao tốc"
- **Gateway Endpoint** = lối ra cao tốc — không có địa chỉ, chỉ là nơi rẽ vào
- **ENI** = địa chỉ nhà cụ thể — có số nhà, bạn đến gõ cửa trực tiếp
- **Interface Endpoint** = văn phòng đại diện (có địa chỉ, có ENI) ngay trong khu phố của bạn

---

## Interface Endpoint tạo ENI ở đâu?

Điểm hay nhầm: SQS, SNS... bản thân **không có ENI**, vậy Interface Endpoint hoạt động sao?

**Câu trả lời**: Interface Endpoint tạo ENI **trong VPC của bạn**, không phải trong SQS.

```
TRƯỚC KHI tạo Interface Endpoint:

┌──────── VPC ─────────┐
│                      │          SQS (nằm ngoài VPC)
│  EC2 (10.0.1.5)      │          (không có IP trong VPC)
│       │              │
│       └──→ ❌ Phải ra internet mới tới được SQS
│                      │
└──────────────────────┘


SAU KHI tạo Interface Endpoint cho SQS:

┌──────── VPC ──────────────────────────────────┐
│                                               │
│  EC2 (10.0.1.5)      ENI (10.0.1.88)          │
│       │                  │                    │
│       │  gọi SQS         │  ← AWS tạo ENI     │
│       └──────────────→───┘    này cho bạn     │
│                          │                    │
└──────────────────────────┼────────────────────┘
                           │
                      PrivateLink (AWS backbone)
                           │
                           ▼
                     Amazon SQS
```

**Cách nhớ**: ENI của Interface Endpoint là **"đại sứ quán"** của SQS đặt trong VPC bạn.

| | Bản thân SQS | Interface Endpoint cho SQS |
|---|---|---|
| Nằm ở đâu? | Ngoài VPC (AWS managed) | **Trong VPC của bạn** |
| Có ENI? | Không | **Có** — ENI trong subnet bạn chọn |
| Có private IP? | Không | **Có** — ví dụ 10.0.1.88 |
| Ai tạo? | AWS quản lý | **Bạn tạo**, AWS provision ENI |

```
SQS không dọn vào VPC bạn ở
  → Thay vào đó, SQS mở "đại sứ quán" (ENI) trong VPC bạn
  → EC2 gõ cửa đại sứ quán (gửi request tới 10.0.1.88)
  → Đại sứ quán chuyển tiếp qua PrivateLink → SQS thật
```

---

## Tại sao S3/DynamoDB cần cả Gateway lẫn Interface Endpoint?

Gateway Endpoint miễn phí, nhanh hơn — vậy tại sao AWS còn hỗ trợ Interface Endpoint cho S3/DynamoDB?

**Vì Gateway Endpoint có 1 hạn chế lớn: chỉ hoạt động trong cùng VPC.**

```
Gateway Endpoint = route trong route table
  → Route table chỉ áp dụng cho traffic BÊN TRONG VPC
  → Traffic từ bên ngoài VPC không đi qua route table này
```

### Các trường hợp Gateway Endpoint KHÔNG dùng được

```
① On-Premises → S3 qua Direct Connect

  🏢 ──Direct Connect──→ VPC ──→ S3?

  ❌ Gateway: traffic từ on-prem không bị route table bẻ hướng
  ✅ Interface: on-prem resolve DNS → private IP (ENI) → S3


② Cross-Region VPC → S3 qua VPC Peering

  VPC (us-east-1) ──Peering──→ VPC (ap-southeast-1) ──→ S3?

  ❌ Gateway: chỉ hoạt động LOCAL trong VPC đó
  ✅ Interface: có IP, DNS resolve được từ VPC khác Region


③ Nhiều VPC qua Transit Gateway → S3

  VPC A ──┐
  VPC B ──┼──→ Transit GW ──→ S3?
  VPC C ──┘

  ❌ Gateway: Transit GW không đi qua route table của VPC
  ✅ Interface: các VPC gọi qua private IP của ENI
```

### Quy tắc chọn cho S3/DynamoDB

| Ai gọi S3/DynamoDB? | Dùng gì? | Vì sao? |
|---|---|---|
| EC2 trong **cùng VPC** | **Gateway** | Miễn phí, nhanh, đủ dùng |
| **On-premises** qua DX/VPN | **Interface** | Gateway không thấy traffic từ ngoài VPC |
| **VPC khác Region** qua Peering | **Interface** | Gateway chỉ local |
| Qua **Transit Gateway** | **Interface** | Traffic qua TGW, không qua route table VPC |

**Cách nhớ**: Trong cùng VPC → Gateway (miễn phí). Từ bên ngoài vào → Interface (cần IP thật để route tới).

---

## Bảng so sánh tổng hợp

| Từ → Tới | Giải pháp | Chi phí | Keyword nhớ |
|-----------|-----------|---------|-------------|
| VPC → S3/DDB | Gateway Endpoint | Miễn phí | Route table, chỉ 2 service |
| VPC → SQS/SNS/... | Interface Endpoint | Có phí | ENI, private IP, PrivateLink |
| VPC ↔ VPC (ít) | VPC Peering | Data transfer | 1:1, không transitive |
| VPC ↔ VPC (nhiều) | Transit Gateway | Hourly + data | Hub trung tâm |
| On-prem ↔ AWS (rẻ) | Site-to-Site VPN | ~$0.05/hr | Qua internet, mã hóa |
| Nhiều site ↔ nhau qua AWS | VPN CloudHub | Theo VPN connection | 1 VGW + nhiều CGW, BGP |
| On-prem ↔ AWS (pro) | Direct Connect | Port + data | Đường riêng, ổn định |
| Private → Internet | NAT Gateway | $0.045/hr + /GB | 1 chiều ra, IPv4 |
| Public ↔ Internet | Internet Gateway | Miễn phí | 2 chiều |
| User → App (cache) | CloudFront | Per request + /GB | Edge, cache |
| User → App (routing) | Global Accelerator | Fixed + /GB | Anycast, no cache |

---

## Câu hỏi thi hay gặp

| Đề bài nói... | Nghĩ tới... |
|----------------|-------------|
| "private subnet access S3" | Gateway Endpoint |
| "on-premises access S3 privately" | Interface Endpoint (qua DX/VPN) |
| "connect hundreds of VPCs" | Transit Gateway |
| "dedicated, consistent network" | Direct Connect |
| "encrypted connection over internet" | Site-to-Site VPN |
| "reduce S3 data transfer cost" | Gateway Endpoint (miễn phí) hoặc CloudFront |
| "cannot communicate transitively" | VPC Peering (không transitive) |
| "static IP for global app" | Global Accelerator |
| "cache at edge" | CloudFront |
| "IPv6 outbound only" | Egress-only Internet Gateway |
| "individual user VPN access" | Client VPN |
| "expose service to another VPC without opening network" | PrivateLink |
| "hub-and-spoke between multiple branch/remote sites" | VPN CloudHub |
| "branch offices communicate with each other via AWS" | VPN CloudHub |
| "multiple customer gateways, unique BGP ASN" | VPN CloudHub |

---

## Tài liệu liên quan trong repo

- [VPC](vpc.md) — VPC, Subnet, CIDR, NAT Gateway, Peering, Transit Gateway
- [VPC Endpoints](vpc-endpoints.md) — Gateway Endpoint, Interface Endpoint, PrivateLink
- [Direct Connect](direct-connect.md) — Dedicated Connection, Private/Transit VIF, LAG
- [Security Groups](security-groups.md) — Virtual Firewall cho VPC resources
- [Route 53](route53.md) — DNS, Hosted Zones, Routing Policies, Health Checks
- [CloudFront](cloudfront.md) — CDN, Edge Locations, Caching, Lambda@Edge
- [Global Applications Architecture](global-applications-architecture.md) — Multi-Region, DR, CloudFront vs Global Accelerator
- [S3 Security](s3-security.md) — VPC Endpoints cho S3, Access Control

---

*Nguồn: [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/) | [AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/) | [AWS Direct Connect](https://docs.aws.amazon.com/directconnect/latest/UserGuide/)*
