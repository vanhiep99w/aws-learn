# AWS WAF (Web Application Firewall)

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Kiến trúc và thành phần](#kiến-trúc-và-thành-phần)
- [Web ACL](#web-acl)
- [Rules và Rule Groups](#rules-và-rule-groups)
- [Managed Rules](#managed-rules)
- [Bot Control](#bot-control)
- [Fraud Control](#fraud-control)
- [Integration với AWS Services](#integration-với-aws-services)
- [So sánh WAF vs Shield vs Firewall Manager](#so-sánh-waf-vs-shield-vs-firewall-manager)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Giới thiệu

**AWS WAF** là **Web Application Firewall** giúp bảo vệ ứng dụng web và API khỏi các **web exploits phổ biến** như SQL injection, XSS, và các bot độc hại.

### WAF bảo vệ khỏi những gì?

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS WAF Protection                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐                                              │
│  │   Attacker    │                                              │
│  └───────┬───────┘                                              │
│          │                                                      │
│          │ Malicious Requests:                                  │
│          │ • SQL Injection: ' OR 1=1 --                         │
│          │ • XSS: <script>alert('hack')</script>                │
│          │ • Bad Bots: Scrapers, credential stuffing            │
│          │ • DDoS: Layer 7 attacks                              │
│          │ • Fraud: Fake account creation                       │
│          ▼                                                      │
│  ┌───────────────────────────────────────────┐                  │
│  │              AWS WAF                      │                  │
│  │  ┌─────────────────────────────────────┐  │                  │
│  │  │           Web ACL                   │  │                  │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │  │                  │
│  │  │  │Rule1│ │Rule2│ │Rule3│ │Rule4│    │  │                  │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘    │  │                  │
│  │  └─────────────────────────────────────┘  │                  │
│  │                                           │                  │
│  │  ❌ BLOCK malicious requests              │                  │
│  │  ✅ ALLOW legitimate requests             │                  │
│  └───────────────────────────────────────────┘                  │
│          │                                                      │
│          ▼                                                      │
│  ┌───────────────────────────────────────────┐                  │
│  │  CloudFront / ALB / API Gateway / AppSync │                  │
│  └───────────────────────────────────────────┘                  │
│          │                                                      │
│          ▼                                                      │
│  ┌───────────────────────────────────────────┐                  │
│  │         Your Application                  │                  │
│  └───────────────────────────────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Layer** | Layer 7 (Application Layer) |
| **Managed Service** | Fully managed, không cần quản lý infrastructure |
| **Real-time** | Block requests ngay lập tức |
| **Visibility** | CloudWatch metrics và logs |
| **Flexibility** | Custom rules + Managed rules |

---

## Kiến trúc và thành phần

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AWS WAF Architecture                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                        Web ACL                                 │     │
│   │                                                                │     │
│   │   ┌─────────────────────────────────────────────────────────┐  │     │
│   │   │                    Rule Groups                          │  │     │
│   │   │                                                         │  │     │
│   │   │  ┌──────────────────┐  ┌──────────────────┐             │  │     │
│   │   │  │ AWS Managed      │  │ Your Custom      │             │  │     │
│   │   │  │ Rule Groups      │  │ Rule Groups      │             │  │     │
│   │   │  │                  │  │                  │             │  │     │
│   │   │  │ • Core Rule Set  │  │ • IP whitelist   │             │  │     │
│   │   │  │ • SQL injection  │  │ • Geo blocking   │             │  │     │
│   │   │  │ • Bad inputs     │  │ • Rate limiting  │             │  │     │
│   │   │  │ • Bot Control    │  │ • Custom logic   │             │  │     │
│   │   │  └──────────────────┘  └──────────────────┘             │  │     │
│   │   └─────────────────────────────────────────────────────────┘  │     │
│   │                                                                │     │
│   │   ┌─────────────────────────────────────────────────────────┐  │     │
│   │   │                   Individual Rules                      │  │     │
│   │   │                                                         │  │     │
│   │   │  Rule 1 ──► Rule 2 ──► Rule 3 ──► ... ──► Default Action│  │     │
│   │   │                                                         │  │     │
│   │   │  Đánh giá theo thứ tự priority (số nhỏ = ưu tiên cao)   │  │     │
│   │   └─────────────────────────────────────────────────────────┘  │     │
│   │                                                                │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                                    │                                     │
│                    Associated với Resources                              │
│                                    │                                     │
│         ┌───────────────────────────┼───────────────────────────┐        │
│         │               │           │           │               │        │
│         ▼               ▼           ▼           ▼               ▼        │
│   ┌──────────┐   ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌──────────┐    │
│   │CloudFront│   │   ALB    │ │   API    │ │ AppSync  │  │ Cognito  │    │
│   │          │   │          │ │ Gateway  │ │          │  │          │    │
│   └──────────┘   └──────────┘ └──────────┘ └──────────┘  └──────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Các thành phần chính

| Thành phần | Mô tả |
|------------|-------|
| **Web ACL** | Container chính chứa tất cả rules |
| **Rule** | Điều kiện kiểm tra request |
| **Rule Group** | Nhóm nhiều rules lại với nhau |
| **IP Set** | Danh sách IP addresses để allow/block |
| **Regex Pattern Set** | Patterns để match request content |

---

## Web ACL

**Web ACL (Web Access Control List)** là resource chính trong AWS WAF, chứa các rules để inspect và quyết định action cho mỗi request.

### Actions

| Action | Mô tả | Khi nào dùng |
|--------|-------|--------------|
| **ALLOW** | Cho phép request đi qua | Whitelist IPs, known good traffic |
| **BLOCK** | Chặn request, trả về 403 | Malicious requests |
| **COUNT** | Đếm nhưng không block | Testing rules trước khi enforce |
| **CAPTCHA** | Yêu cầu giải CAPTCHA | Nghi ngờ bot |
| **Challenge** | JavaScript challenge | Silent bot detection |

### Web ACL Capacity Units (WCUs)

Mỗi rule tiêu thụ một lượng **WCU** nhất định. Web ACL có giới hạn **1,500 WCUs** mặc định.

```
┌─────────────────────────────────────────────────────────────┐
│                    WCU Examples                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Rule Type                          │ WCU Cost              │
│  ─────────────────────────────────────────────────────────  │
│  IP Set match                       │ 1 WCU                 │
│  Single string match                │ 2 WCUs                │
│  Regex pattern set (up to 10)       │ 25 WCUs               │
│  SQL injection detection            │ 20 WCUs               │
│  XSS detection                      │ 40 WCUs               │
│  Rate-based rule                    │ 2 WCUs                │
│  AWS Managed Rule Groups            │ Varies (25-700 WCUs)  │
│                                                             │
│  ⚠️ Vượt quá 1,500 WCUs → tính phí thêm $0.20/1M requests   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Rules và Rule Groups

### Các loại Rules

#### 1. Regular Rules
Match dựa trên conditions như IP, headers, body, query string...

```yaml
# Ví dụ: Block requests từ country cụ thể
Type: Regular Rule
Conditions:
  - GeoMatch: [CN, RU, KP]
Action: BLOCK
```

#### 2. Rate-based Rules
Block IP khi vượt quá threshold requests trong khoảng thời gian.

```
┌─────────────────────────────────────────────────────────────┐
│                    Rate-based Rule                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Threshold: 2000 requests / 5 minutes (per IP)              │
│                                                             │
│  IP: 203.0.113.50                                           │
│  ├── Request 1........Request 1999  → ✅ ALLOW              │
│  └── Request 2000+                  → ❌ BLOCK (temporarily)│
│                                                             │
│  Use cases:                                                 │
│  • Brute force protection                                   │
│  • API abuse prevention                                     │
│  • DDoS mitigation                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Rule Groups

Nhóm nhiều rules lại với nhau để tái sử dụng.

| Loại | Mô tả |
|------|-------|
| **AWS Managed** | Rules do AWS tạo và maintain |
| **AWS Marketplace** | Rules từ third-party vendors |
| **Your Own** | Custom rule groups bạn tự tạo |

---

## Managed Rules

**Managed Rules** là các rule groups được cấu hình sẵn, tự động update bởi AWS hoặc vendors.

### AWS Managed Rule Groups

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    AWS Managed Rule Groups                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  BASELINE RULE GROUPS (Khuyên dùng cho mọi ứng dụng)             │    │
│  │                                                                  │    │
│  │  • AWSManagedRulesCommonRuleSet (Core Rule Set - CRS)            │    │
│  │    → OWASP Top 10, SQL injection, XSS, path traversal            │    │
│  │                                                                  │    │
│  │  • AWSManagedRulesAdminProtectionRuleSet                         │    │
│  │    → Block external access to admin pages                        │    │
│  │                                                                  │    │
│  │  • AWSManagedRulesKnownBadInputsRuleSet                          │    │
│  │    → Block known bad request patterns                            │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  USE-CASE SPECIFIC RULE GROUPS                                   │    │
│  │                                                                  │    │
│  │  • AWSManagedRulesSQLiRuleSet         → SQL injection protection │    │
│  │  • AWSManagedRulesLinuxRuleSet        → Linux-specific attacks   │    │
│  │  • AWSManagedRulesUnixRuleSet         → Unix-specific attacks    │    │
│  │  • AWSManagedRulesWindowsRuleSet      → Windows-specific attacks │    │
│  │  • AWSManagedRulesPHPRuleSet          → PHP-specific attacks     │    │
│  │  • AWSManagedRulesWordPressRuleSet    → WordPress vulnerabilities│    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  IP REPUTATION RULE GROUPS                                       │    │
│  │                                                                  │    │
│  │  • AWSManagedRulesAmazonIpReputationList                         │    │
│  │    → Block known malicious IPs từ AWS threat intelligence        │    │
│  │                                                                  │    │
│  │  • AWSManagedRulesAnonymousIpList                                │    │
│  │    → Block traffic từ VPNs, Tor, proxies, hosting providers      │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Lựa chọn Managed Rules

| Ứng dụng | Recommended Rule Groups |
|----------|------------------------|
| **Mọi web app** | Core Rule Set, Known Bad Inputs |
| **WordPress** | + WordPress Rule Set |
| **PHP app** | + PHP Rule Set |
| **Linux server** | + Linux Rule Set |
| **API** | + API Gateway optimized rules |
| **Admin panels** | + Admin Protection |

---

## Bot Control

**AWS WAF Bot Control** giúp phát hiện và quản lý bot traffic.

### Hai mức độ

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Bot Control Levels                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │  COMMON BOT CONTROL                                           │       │
│  │                                                               │       │
│  │  • Phát hiện bots phổ biến (scrapers, crawlers, bots tốt)     │       │
│  │  • Categorize: Verified bots, Unverified bots, Good bots      │       │
│  │  • Fingerprinting dựa trên request patterns                   │       │
│  │                                                               │       │
│  │  Cost: $1/million requests (10M free/month)                   │       │
│  │                                                               │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │  TARGETED BOT CONTROL                                         │       │
│  │                                                               │       │
│  │  • ML-based detection cho sophisticated bots                  │       │
│  │  • Behavioral analysis                                        │       │
│  │  • Browser fingerprinting                                     │       │
│  │  • JavaScript challenge interstitials                         │       │
│  │                                                               │       │
│  │  Cost: $10/million requests (1M free/month)                   │       │
│  │                                                               │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Bot Categories

| Category | Ví dụ | Action thường dùng |
|----------|-------|-------------------|
| **Verified Bots** | Googlebot, Bingbot | ALLOW |
| **Unverified Bots** | Unknown crawlers | COUNT or BLOCK |
| **Good Bots** | Monitoring tools | ALLOW |
| **Bad Bots** | Scrapers, spammers | BLOCK |

---

## Fraud Control

**Fraud Control** bảo vệ login và signup pages khỏi các cuộc tấn công fraud.

### Hai features chính

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Fraud Control Features                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │  ACCOUNT TAKEOVER PREVENTION (ATP)                            │       │
│  │                                                               │       │
│  │  Bảo vệ LOGIN pages khỏi:                                     │       │
│  │  • Credential stuffing (dùng leaked passwords)                │       │
│  │  • Credential cracking (brute force)                          │       │
│  │  • Distributed attacks từ nhiều IPs                           │       │
│  │                                                               │       │
│  │  Cách hoạt động:                                              │       │
│  │  1. Inspect login requests                                    │       │
│  │  2. Check credentials against stolen credential databases     │       │
│  │  3. Analyze login patterns (rate, success/failure)            │       │
│  │  4. Block suspicious attempts                                 │       │
│  │                                                               │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │  ACCOUNT CREATION FRAUD PREVENTION (ACFP)                     │       │
│  │                                                               │       │
│  │  Bảo vệ SIGNUP pages khỏi:                                    │       │
│  │  • Automated fake account creation                            │       │
│  │  • Bonus abuse (tạo nhiều accounts lấy promo)                 │       │
│  │  • Spam accounts                                              │       │
│  │                                                               │       │
│  │  Cách hoạt động:                                              │       │
│  │  1. Analyze signup request patterns                           │       │
│  │  2. Check email/phone reputation                              │       │
│  │  3. Detect automated behavior                                 │       │
│  │  4. CAPTCHA or block suspicious signups                       │       │
│  │                                                               │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  Cost: $10/month per Web ACL + $1/1000 requests                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Integration với AWS Services

### Supported Resources

| Service | Region | Notes |
|---------|--------|-------|
| **Amazon CloudFront** | Global (us-east-1) | CDN protection |
| **Application Load Balancer** | Regional | Web app protection |
| **Amazon API Gateway** | Regional | REST API protection |
| **AWS AppSync** | Regional | GraphQL API protection |
| **Amazon Cognito** | Regional | User pool protection |
| **AWS App Runner** | Regional | Container apps |
| **AWS Verified Access** | Regional | Zero trust |

### Ví dụ tích hợp với CloudFront

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CloudFront + WAF Integration                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│     Users (Worldwide)                                                    │
│           │                                                              │
│           ▼                                                              │
│   ┌───────────────────────────────────────────────────────────────┐      │
│   │                    CloudFront (Edge)                          │      │
│   │                                                               │      │
│   │  ┌──────────────────────────────────────────────────────────  │      │
│   │  │                     AWS WAF                              │ │      │
│   │  │                                                          │ │      │
│   │  │  ✅ Request allowed                                      │ │      │
│   │  │  ❌ Request blocked → Return 403                         │ │      │
│   │  │                                                          │ │      │
│   │  └──────────────────────────────────────────────────────────┘ │      │
│   │                                                               │      │
│   │  Cache Hit? → Return cached content                           │      │
│   │  Cache Miss? → Forward to origin                              │      │
│   │                                                               │      │
│   └───────────────────────────────────────────────────────────────┘      │
│           │                                                              │
│           ▼                                                              │
│   ┌───────────────────────────────────────────────────────────────┐      │
│   │                      Origin (S3, ALB, EC2)                    │      │
│   └───────────────────────────────────────────────────────────────┘      │
│                                                                          │
│   Lợi ích:                                                               │
│   • Block tại Edge trước khi traffic đến origin                          │
│   • Giảm load cho origin servers                                         │
│   • Global protection                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## So sánh WAF vs Shield vs Firewall Manager

```
┌──────────────────────────────────────────────────────────────────────────┐
│              WAF vs Shield vs Firewall Manager                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │                        AWS WAF                                  │     │
│  │                                                                 │     │
│  │  Layer: 7 (Application)                                         │     │
│  │  Protects: Web apps, APIs                                       │     │
│  │  Against: SQL injection, XSS, bots, L7 DDoS                     │     │
│  │  Cost: Pay per rule, request                                    │     │
│  │                                                                 │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │                       AWS Shield                                │     │
│  │                                                                 │     │
│  │  Layer: 3, 4 (Network, Transport)                               │     │
│  │  Protects: All AWS resources                                    │     │
│  │  Against: DDoS attacks (SYN floods, UDP reflection)             │     │
│  │                                                                 │     │
│  │  ┌─────────────────┐  ┌─────────────────────────────────────┐   │     │
│  │  │ Shield Standard │  │ Shield Advanced                     │   │     │
│  │  │                 │  │                                     │   │     │
│  │  │ • FREE          │  │ • $3,000/month                      │   │     │
│  │  │ • Auto-enabled  │  │ • 24/7 DRT support                  │   │     │
│  │  │ • L3/L4 DDoS    │  │ • L3/L4/L7 DDoS                     │   │     │
│  │  │                 │  │ • Cost protection                   │   │     │
│  │  │                 │  │ • WAF included                      │   │     │
│  │  └─────────────────┘  └─────────────────────────────────────┘   │     │
│  │                                                                 │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │                   AWS Firewall Manager                          │     │
│  │                                                                 │     │
│  │  Purpose: Centralized management                                │     │
│  │  Manages: WAF, Shield Advanced, Security Groups, Network FW     │     │
│  │  Scope: Across AWS Organization (multiple accounts)             │     │
│  │  Cost: $100/month per region                                    │     │
│  │                                                                 │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### So sánh chi tiết

| Tiêu chí | AWS WAF | Shield Standard | Shield Advanced | Firewall Manager |
|----------|---------|-----------------|-----------------|------------------|
| **Layer** | 7 | 3, 4 | 3, 4, 7 | N/A (management) |
| **DDoS** | L7 only | L3/L4 basic | L3/L4/L7 advanced | N/A |
| **Web exploits** | ✅ | ❌ | ✅ (via WAF) | N/A |
| **Cost** | Pay-per-use | FREE | $3,000/month | $100/region/month |
| **Auto-enabled** | ❌ | ✅ | ❌ | ❌ |
| **Multi-account** | ❌ | ❌ | ✅ | ✅ |
| **DRT Support** | ❌ | ❌ | ✅ 24/7 | ❌ |

### Khi nào dùng gì?

| Scenario | Solution |
|----------|----------|
| Bảo vệ web app khỏi SQL injection, XSS | **WAF** |
| DDoS protection cơ bản | **Shield Standard** (đã có sẵn) |
| Enterprise, high-profile target | **Shield Advanced + WAF** |
| Nhiều AWS accounts | **Firewall Manager** |
| VPC network protection | **Network Firewall** (khác service) |

---

## Pricing

### AWS WAF Base Pricing

| Component | Cost |
|-----------|------|
| **Web ACL** | $5.00/month |
| **Rule** | $1.00/month per rule |
| **Managed Rule Group** | $1.00/month + vendor fee |
| **Requests** | $0.60/million requests |
| **Extra WCUs** | $0.20/million requests per 500 WCUs |

### Bot Control Pricing

| Level | Free Tier | After Free Tier |
|-------|-----------|-----------------|
| **Common** | 10M requests/month | $1/million requests |
| **Targeted** | 1M requests/month | $10/million requests |

### Fraud Control Pricing

| Component | Cost |
|-----------|------|
| **Subscription** | $10/month per Web ACL |
| **Requests** | ~$1/1,000 requests |
| **Free Tier** | 10,000 requests/month |

### Ví dụ tính giá

```
┌─────────────────────────────────────────────────────────────┐
│             Monthly Cost Example                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup:                                                     │
│  • 1 Web ACL attached to CloudFront                         │
│  • 5 custom rules                                           │
│  • AWS Core Rule Set (managed)                              │
│  • 10 million requests/month                                │
│                                                             │
│  Calculation:                                               │
│  ─────────────────────────────────────────────              │
│  Web ACL:           1 × $5.00     = $5.00                   │
│  Custom Rules:      5 × $1.00     = $5.00                   │
│  Managed Rule:      1 × $1.00     = $1.00                   │
│  Requests:          10M × $0.60/M = $6.00                   │
│  ─────────────────────────────────────────────              │
│  TOTAL:                           = $17.00/month            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> 💡 **Tip:** Nếu dùng **Shield Advanced**, WAF base costs (Web ACL, rules, requests) được **miễn phí** cho protected resources!

---

## Best Practices

### 1. Start with Managed Rules

```
Recommended setup:
1. AWSManagedRulesCommonRuleSet (Core Rule Set)
2. AWSManagedRulesKnownBadInputsRuleSet
3. AWSManagedRulesAmazonIpReputationList
4. Rate-based rule (2000 requests/5 min)
```

### 2. Use COUNT mode first

```
Trước khi BLOCK:
1. Thêm rule với action = COUNT
2. Monitor trong 1-2 tuần
3. Review false positives trong WAF logs
4. Adjust rules nếu cần
5. Chuyển sang BLOCK
```

### 3. Rule Priority Order

```
┌─────────────────────────────────────────────────────────────┐
│                    Recommended Order                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Priority 0:    IP Whitelist (ALLOW)                        │
│  Priority 100:  IP Blocklist (BLOCK)                        │
│  Priority 200:  Rate-based rules (BLOCK)                    │
│  Priority 300:  Geo restrictions (BLOCK)                    │
│  Priority 400:  Managed rules (BLOCK)                       │
│  Priority 500:  Custom rules (BLOCK)                        │
│  Default:       ALLOW                                       │
│                                                             │
│  ⚠️ Số priority nhỏ = xử lý trước                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Logging

- Enable **WAF Logs** → S3, CloudWatch Logs, hoặc Kinesis Firehose
- Analyze blocked/counted requests
- Set up CloudWatch alarms for attack detection

---

## Exam Tips

### Key Points for AWS Exams

1. **WAF = Layer 7 protection**
   - SQL injection, XSS, bad bots
   - Attach to CloudFront, ALB, API Gateway

2. **Shield = DDoS protection**
   - Standard = FREE, auto-enabled
   - Advanced = $3,000/month, 24/7 DRT

3. **Firewall Manager = Central management**
   - Across AWS Organization
   - Manages WAF, Shield, Security Groups

4. **WAF Rules**
   - Regular rules = match conditions
   - Rate-based rules = threshold blocking
   - Managed rules = pre-configured, auto-updated

5. **Actions**
   - ALLOW, BLOCK, COUNT
   - CAPTCHA và Challenge cho bot detection

### Common Exam Scenarios

| Scenario | Answer |
|----------|--------|
| Block SQL injection | **AWS WAF** |
| DDoS protection (free) | **Shield Standard** |
| 24/7 DDoS response team | **Shield Advanced** |
| Centrally manage WAF across accounts | **Firewall Manager** |
| Block IPs exceeding request threshold | **Rate-based rule** |
| Test rules without blocking | **COUNT action** |
| Protect CloudFront from bots | **WAF Bot Control** |
| Block traffic from specific countries | **Geo Match condition** |

---

## Liên kết liên quan

- [CloudFront](./cloudfront.md)
- [API Gateway](./api-gateway.md)
- [ELB](./elb.md)
- [AWS Organizations](./aws-organizations.md) - Firewall Manager
- [Security Groups](./security-groups.md)
