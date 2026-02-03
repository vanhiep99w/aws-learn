# Amazon CloudFront


## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc CloudFront](#kiến-trúc-cloudfront)
- [Origins (Nguồn nội dung)](#origins-nguồn-nội-dung)
- [Cache Behaviors](#cache-behaviors)
- [CloudFront Functions vs Lambda@Edge](#cloudfront-functions-vs-lambdaedge)
- [Security Features](#security-features)
- [Invalidation (Xóa cache)](#invalidation-xóa-cache)
- [Real-time Logs & Monitoring](#real-time-logs-monitoring)
- [Pricing](#pricing)
- [Use Cases phổ biến](#use-cases-phổ-biến)
- [Best Practices](#best-practices)
- [So sánh với các CDN khác](#so-sánh-với-các-cdn-khác)
- [Kết hợp với Route 53](#kết-hợp-với-route-53)
- [Troubleshooting](#troubleshooting)
- [Tham khảo thêm](#tham-khảo-thêm)

---

## Tổng quan

**Amazon CloudFront** là dịch vụ **Content Delivery Network (CDN)** của AWS, giúp phân phối nội dung (web, API, video, static files) đến người dùng toàn cầu với **độ trễ thấp** và **tốc độ cao**.

### CDN là gì?

```
Không có CDN:
┌────────────┐                                           ┌────────────┐
│   User     │ ───────────── 200ms ─────────────────────▶│   Origin   │
│ (Vietnam)  │                                           │   (US)     │
└────────────┘                                           └────────────┘

Có CDN (CloudFront):
┌────────────┐         ┌────────────┐                   ┌────────────┐
│   User     │ ──20ms─▶│   Edge     │ ◀── cached ──────│   Origin   │
│ (Vietnam)  │         │  Location  │                   │   (US)     │
└────────────┘         │ (Singapore)│                   └────────────┘
                       └────────────┘
```

**Lợi ích chính:**
- **Giảm latency**: Content được cache gần người dùng
- **Giảm tải origin**: Không phải request đến origin mỗi lần
- **Tăng availability**: Nhiều edge locations = redundancy
- **Bảo mật**: DDoS protection, WAF integration

---

## Kiến trúc CloudFront

### Các thành phần chính

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CloudFront Distribution                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │    User     │    │    User     │    │    User     │    │    User     │       │
│  │  (Vietnam)  │    │   (Japan)   │    │   (Europe)  │    │    (US)     │       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│         │                  │                  │                  │               │
│         ▼                  ▼                  ▼                  ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │    Edge     │    │    Edge     │    │    Edge     │    │    Edge     │       │
│  │  Location   │    │  Location   │    │  Location   │    │  Location   │       │
│  │ (Singapore) │    │  (Tokyo)    │    │ (Frankfurt) │    │ (Virginia)  │       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│         │                  │                  │                  │               │
│         └──────────────────┴────────┬─────────┴──────────────────┘               │
│                                     ▼                                             │
│                          ┌───────────────────┐                                   │
│                          │  Regional Edge    │  (Mid-tier cache)                 │
│                          │     Cache         │                                   │
│                          └─────────┬─────────┘                                   │
│                                    │                                              │
│                                    ▼                                              │
│                          ┌───────────────────┐                                   │
│                          │   Origin Shield   │  (Optional - Centralized cache)  │
│                          │                   │                                   │
│                          └─────────┬─────────┘                                   │
│                                    │                                              │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     ▼
                    ┌─────────────────────────────────────┐
                    │            Origins                   │
                    ├─────────────────────────────────────┤
                    │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐│
                    │  │ S3  │  │ ALB │  │ EC2 │  │HTTP │ │
                    │  │     │  │     │  │     │  │     │ │
                    │  └─────┘  └─────┘  └─────┘  └─────┘│
                    └─────────────────────────────────────┘
```

### 1. Edge Locations

- **750+ PoPs** (Points of Presence) trên toàn cầu
- **100+ cities**, **50+ countries**
- Là nơi content được cache gần người dùng nhất
- Tự động route request đến edge location gần nhất

```
Ví dụ Edge Locations ở Asia Pacific:
├── Singapore (3 locations)
├── Tokyo (5 locations)
├── Osaka (2 locations)
├── Hong Kong (3 locations)
├── Seoul (4 locations)
├── Mumbai (3 locations)
└── Sydney (3 locations)
```

### 2. Regional Edge Caches

- **Mid-tier cache** giữa Edge Locations và Origin
- Cache lớn hơn, giữ content lâu hơn
- Giảm số request đến Origin

### 3. Origin Shield (Optional)

- **Centralized caching layer** bổ sung
- Tất cả regional edge caches đều đi qua Origin Shield
- Giảm tải origin đáng kể cho high-traffic sites

```
Không có Origin Shield:
Edge Tokyo     ──▶ Regional Cache (Tokyo)    ──┐
Edge Singapore ──▶ Regional Cache (Singapore)──┼──▶ Origin (mỗi Regional Cache fetch riêng = nhiều requests)
Edge Sydney    ──▶ Regional Cache (Sydney)   ──┘

Có Origin Shield:
Edge Tokyo     ──▶ Regional Cache (Tokyo)    ──┐
Edge Singapore ──▶ Regional Cache (Singapore)──┼──▶ Origin Shield ──▶ Origin (chỉ 1 request)
Edge Sydney    ──▶ Regional Cache (Sydney)   ──┘
```

**Tại sao cần Origin Shield?**
- Có **13+ Regional Edge Caches** trên toàn cầu
- Không có Origin Shield: mỗi Regional Cache fetch từ Origin riêng = **13+ requests** cho cùng 1 file
- Có Origin Shield: tất cả Regional Caches đi qua 1 điểm = **1 request** đến Origin
- Đặc biệt hữu ích cho: high-traffic sites, origins có capacity giới hạn, origins tính phí per-request

---

## Origins (Nguồn nội dung)

CloudFront hỗ trợ nhiều loại origin:

### 1. S3 Bucket

```yaml
# Phổ biến nhất cho static content
Origin:
  DomainName: my-bucket.s3.amazonaws.com
  Id: S3Origin
  S3OriginConfig:
    OriginAccessIdentity: origin-access-identity/cloudfront/XXXXX
```

**Origin Access Control (OAC)** - Cách mới (khuyến nghị):
```yaml
OriginAccessControl:
  Name: my-oac
  SigningBehavior: always
  SigningProtocol: sigv4
  OriginAccessControlOriginType: s3
```

### 2. Application Load Balancer (ALB)

```yaml
# Cho dynamic content, microservices
Origin:
  DomainName: my-alb-123456.us-east-1.elb.amazonaws.com
  Id: ALBOrigin
  CustomOriginConfig:
    HTTPPort: 80
    HTTPSPort: 443
    OriginProtocolPolicy: https-only
```

### 3. EC2 Instance

```yaml
# Direct EC2 access (phải public)
Origin:
  DomainName: ec2-52-xx-xx-xx.compute-1.amazonaws.com
  CustomOriginConfig:
    HTTPPort: 80
    OriginProtocolPolicy: http-only
```

### 4. Custom HTTP Server

```yaml
# Any HTTP endpoint
Origin:
  DomainName: api.example.com
  CustomOriginConfig:
    HTTPSPort: 443
    OriginProtocolPolicy: https-only
```

### 5. Origin Groups (Failover)

```yaml
# High availability with automatic failover
OriginGroup:
  Id: my-origin-group
  Members:
    - OriginId: PrimaryOrigin    # S3 bucket 1
    - OriginId: SecondaryOrigin  # S3 bucket 2 (backup)
  FailoverCriteria:
    StatusCodes:
      - 500
      - 502
      - 503
      - 504
```

---

## Cache Behaviors

### Cách hoạt động của Cache

```
Request từ User:
┌────────────────────────────────────────────────────────────────┐
│ GET /images/logo.png HTTP/1.1                                   │
│ Host: cdn.example.com                                           │
│ Accept: image/*                                                 │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Edge Location  │
                    │   Cache Check   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       ┌─────────────┐              ┌─────────────┐
       │ Cache Hit   │              │ Cache Miss  │
       │ (X-Cache:   │              │ Fetch from  │
       │  Hit)       │              │   Origin    │
       └──────┬──────┘              └──────┬──────┘
              │                            │
              │                            ▼
              │                    ┌─────────────┐
              │                    │ Cache the   │
              │                    │  response   │
              │                    └──────┬──────┘
              │                           │
              └───────────┬───────────────┘
                          ▼
                 Return to User
```

### CloudFront Domain - Quan trọng!

Khi tạo Distribution, CloudFront cấp cho bạn một **domain riêng**:

```
d1234abcd5678.cloudfront.net
```

**⚠️ Cache CHỈ hoạt động khi request đi qua CloudFront domain:**

```
User gọi trực tiếp S3 (KHÔNG qua CloudFront):
https://my-bucket.s3.amazonaws.com/logo.png
└──▶ Bypass hoàn toàn CloudFront
└──▶ Mỗi request = 1 GET đến S3
└──▶ Tốn tiền S3, không có cache benefit

User gọi qua CloudFront:
https://d1234.cloudfront.net/logo.png
└──▶ Request 1: Cache miss → fetch từ S3
└──▶ Request 2,3,4...: Cache HIT → serve từ edge
└──▶ Nhanh hơn, rẻ hơn!
```

**Thường dùng custom domain (qua Route 53):**

```
Route 53:
cdn.example.com ──▶ ALIAS ──▶ d1234abcd5678.cloudfront.net

User gọi:
https://cdn.example.com/images/logo.png  ──▶ Thực ra là CloudFront!
```

**Trong code frontend, phải dùng đúng URL:**

```html
<!-- ❌ SAI - Bypass CloudFront -->
<img src="https://my-bucket.s3.amazonaws.com/logo.png">

<!-- ✅ ĐÚNG - Qua CloudFront -->
<img src="https://cdn.example.com/logo.png">
```

### CloudFront Cache những gì?

**CloudFront KHÔNG cache mọi thứ mặc định** - bạn control hoàn toàn:

| Content Type | Cache mặc định? | Lý do |
|-------------|-----------------|-------|
| Static files (.jpg, .css, .js) | ✅ Thường có | Origin set `Cache-Control` |
| HTML pages | ⚠️ Tùy config | Phụ thuộc Cache Behavior |
| API responses (GET) | ⚠️ Tùy config | Thường disable cache |
| POST/PUT/DELETE | ❌ Không bao giờ | Modifying requests |

**Quy tắc quyết định cache:**

```
Request đến CloudFront:
│
├── POST/PUT/DELETE? ──▶ KHÔNG cache (forward đến origin)
│
└── GET/HEAD?
    │
    └── Check Cache Behavior config:
        │
        ├── CachingDisabled? ──▶ KHÔNG cache
        │
        └── CachingOptimized?
            │
            └── Origin response có Cache-Control?
                ├── no-cache ──▶ KHÔNG cache
                ├── max-age=3600 ──▶ Cache 1 hour
                └── Không có ──▶ Dùng Default TTL
```

**AWS Managed Cache Policies:**

| Policy | Behavior | Use Case |
|--------|----------|----------|
| **CachingDisabled** | Không cache, forward tất cả | APIs, dynamic content |
| **CachingOptimized** | Cache theo origin headers | Static assets |
| **CachingOptimizedForUncompressedObjects** | Như trên, không compress | Already compressed files |

**Ví dụ config theo path:**

```yaml
Distribution:
  CacheBehaviors:
    # API - KHÔNG cache
    - PathPattern: "/api/*"
      CachePolicyId: CachingDisabled
      
    # Static - Cache lâu
    - PathPattern: "/static/*"
      CachePolicyId: CachingOptimized
      
    # Images - Cache 1 năm
    - PathPattern: "*.jpg"
      CachePolicyId: CachingOptimized
```

### Cache Key

CloudFront cache key mặc định là: **Host + Path**

Có thể customize bằng:
- Query strings
- Headers
- Cookies

```yaml
# Ví dụ: Cache theo query string
CacheBehavior:
  PathPattern: "/api/*"
  CachePolicy:
    QueryStringsConfig:
      QueryStringBehavior: whitelist
      QueryStrings:
        - page
        - limit
```

### TTL (Time To Live)

```yaml
# 3 loại TTL
CachePolicy:
  DefaultTTL: 86400    # 24 hours (khi origin không set Cache-Control)
  MinTTL: 0            # Tối thiểu
  MaxTTL: 31536000     # 1 year (tối đa)
```

**Quy tắc ưu tiên:**
1. Origin `Cache-Control: max-age=X` → dùng X (nếu MinTTL ≤ X ≤ MaxTTL)
2. Origin không set → dùng DefaultTTL
3. Origin set `no-cache` → request đến origin mỗi lần (nhưng vẫn có thể serve stale if-modified)

### Cache Behaviors Patterns

```yaml
# Multiple cache behaviors cho khác nhau content types
Distribution:
  DefaultCacheBehavior:
    PathPattern: "*"           # Default
    ViewerProtocolPolicy: redirect-to-https
    CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized
    
  CacheBehaviors:
    - PathPattern: "/api/*"
      CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled
      OriginRequestPolicyId: 216adef6-5c7f-47e4-b989-5492eafa07d3
      
    - PathPattern: "/static/*"
      CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized
      Compress: true
      
    - PathPattern: "*.jpg"
      CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
      Compress: false  # Images already compressed
```

---

## CloudFront Functions vs Lambda@Edge

### Tại sao cần chạy code ở Edge?

Đôi khi bạn cần **xử lý logic** trước khi CloudFront trả response. Ví dụ:
- Redirect `/old-page` → `/new-page`
- Thêm security headers
- Check authentication
- A/B testing

**AWS cho bạn 2 cách:**

### Request đi qua Function như thế nào?

```
                    Function có thể:
                    1. Modify request rồi cho đi tiếp
                    2. Hoặc trả response luôn (không đến Origin)
                          │
                          ▼
┌──────┐     ┌─────────────────────┐     ┌───────┐     ┌────────┐
│ User │────▶│ CloudFront Function │────▶│ Cache │────▶│ Origin │
└──────┘     └─────────────────────┘     └───────┘     └────────┘
                          │
                          │ (có thể return sớm)
                          ▼
                    Response cho User
```

**Trường hợp 1: Function MODIFY request rồi cho đi tiếp**

```javascript
function handler(event) {
    var request = event.request;
    
    // Sửa URL: /blog/123 → /blog?id=123
    if (request.uri.startsWith('/blog/')) {
        var id = request.uri.split('/')[2];
        request.uri = '/blog';
        request.querystring = { id: { value: id } };
    }
    
    return request;  // ← Return REQUEST = đi tiếp đến Origin
}
```

**Trường hợp 2: Function TRẢ RESPONSE LUÔN (không đến Origin)**

```javascript
function handler(event) {
    var request = event.request;
    
    // Redirect - trả response luôn
    if (request.uri === '/old-page') {
        return {
            statusCode: 301,
            headers: { location: { value: '/new-page' } }
        };  // ← Return RESPONSE = dừng ở đây
    }
    
    return request;  // Các request khác đi tiếp
}
```

**Tóm lại:**
- **Return `request`** → Request đi tiếp (có thể đã bị modify)
- **Return `response`** → Dừng luôn, trả response cho user

---

### 4 điểm có thể đặt Function (Trigger Points)

```
User ──▶ ①Viewer Request ──▶ Cache ──▶ ②Origin Request ──▶ Origin
     ◀── ④Viewer Response ◀── Cache ◀── ③Origin Response ◀──
```

| Điểm | Khi nào chạy? | Dùng để làm gì? |
|------|---------------|-----------------|
| ① Viewer Request | Mỗi request từ user | Redirect, auth check, modify URL |
| ② Origin Request | Chỉ khi cache miss | Thêm headers cho origin |
| ③ Origin Response | Nhận response từ origin | Modify trước khi cache |
| ④ Viewer Response | Trước khi trả cho user | Thêm security headers |

---

### So sánh CloudFront Functions vs Lambda@Edge

| Feature | CloudFront Functions | Lambda@Edge |
|---------|---------------------|-------------|
| **Tốc độ** | ⚡ < 1ms | 🐢 Viewer: 5s, Origin: 30s |
| **Giá** | 💰 $0.10/1M | 💰💰 $0.60/1M + compute |
| **Gọi API/DB** | ❌ KHÔNG | ✅ Có |
| **Language** | JavaScript only | Node.js, Python |
| **Trigger Points** | ① và ④ only | ①②③④ (tất cả) |
| **Use Case** | Việc đơn giản | Logic phức tạp |

### CloudFront Functions - "Nhẹ và nhanh"

```javascript
// Redirect www → non-www
function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;
    
    if (host.startsWith('www.')) {
        return {
            statusCode: 301,
            headers: { location: { value: 'https://example.com' + request.uri } }
        };
    }
    return request;
}
```

```javascript
// Add security headers
function handler(event) {
    var response = event.response;
    response.headers['x-frame-options'] = { value: 'DENY' };
    response.headers['x-content-type-options'] = { value: 'nosniff' };
    return response;
}
```

### Lambda@Edge - "Mạnh mẽ hơn"

```python
# Resize ảnh on-the-fly (cần gọi S3 - CloudFront Functions KHÔNG làm được)
import boto3
from PIL import Image

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    
    # Gọi S3 để lấy ảnh gốc
    s3 = boto3.client('s3')
    image = s3.get_object(Bucket='my-bucket', Key=request['uri'][1:])
    
    # Resize và trả về
    resized = resize_image(image, width=200)
    return resized
```

### Khi nào dùng cái nào?

| Việc cần làm | Dùng gì? | Lý do |
|-------------|----------|-------|
| Redirect URL | CloudFront Functions | Đơn giản, không cần API |
| Thêm security headers | CloudFront Functions | Chỉ modify response |
| URL rewrite | CloudFront Functions | String manipulation |
| Check JWT token | Lambda@Edge | Cần verify signature |
| Resize ảnh | Lambda@Edge | Cần gọi S3 |
| A/B testing với DB | Lambda@Edge | Cần đọc config |

**Rule of thumb:** Nếu CloudFront Functions làm được → dùng nó (rẻ + nhanh hơn)

---

## Security Features

### 1. HTTPS/SSL

```yaml
Distribution:
  ViewerCertificate:
    AcmCertificateArn: arn:aws:acm:us-east-1:123456789:certificate/xxx
    SslSupportMethod: sni-only
    MinimumProtocolVersion: TLSv1.2_2021
```

**Lưu ý quan trọng**: SSL certificate cho CloudFront **phải** ở region **us-east-1**!

### 2. Origin Access Control (OAC)

**OAC là gì?**

OAC (Origin Access Control) là cơ chế cho phép **CloudFront access S3 bucket private**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Origin Access Control (OAC)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User → CloudFront → [OAC Sign Request] → S3 (private)         │
│                              ↑                                  │
│                    AWS Signature V4                             │
│                                                                 │
│  User truy cập S3 trực tiếp: ❌ 403 Forbidden                  │
│  User truy cập qua CloudFront: ✅ 200 OK                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Tại sao cần OAC (signing) khi đã có Bucket Policy?**

Bucket Policy chỉ định nghĩa "AI được phép", không verify "đó có thật là CloudFront không":

```
Bucket Policy: "Cho phép cloudfront.amazonaws.com"
                    ↓
Nhưng làm sao S3 biết request ĐẾN TỪ CloudFront thật sự?
                    ↓
OAC signing = Chứng minh danh tính (như thẻ nhân viên + vân tay)
```

**Cách OAC hoạt động:**

```
1. User request → CloudFront
2. CloudFront SIGN request với AWS Signature V4
3. Request có chữ ký → gửi đến S3
4. S3 verify chữ ký → "OK, đây là CloudFront được phép"
5. S3 trả content → CloudFront → User

Lưu ý: Chỉ sign khi Cache MISS (cần lấy từ S3)
       Cache HIT → trả từ cache, không gọi S3
```

**OAC vs OAI (cũ):**

| Feature | OAI (Legacy) | OAC (Mới - 2022) |
|---------|--------------|------------------|
| **Signing** | CloudFront identity | AWS Signature V4 |
| **SSE-KMS** | ❌ Không hỗ trợ | ✅ Hỗ trợ |
| **POST/PUT** | ❌ Chỉ GET | ✅ Tất cả methods |
| **All regions** | ❌ Một số | ✅ Tất cả |
| **Recommended** | ❌ | ✅ |

**Origins hỗ trợ OAC:**

| Origin Type | OAC Support | Cách bảo mật khác |
|-------------|-------------|-------------------|
| **S3** | ✅ | - |
| **MediaStore** | ✅ | - |
| **Lambda Function URL** | ✅ | - |
| **ALB/EC2** | ❌ | Custom header + Security Group |
| **API Gateway** | ❌ | IAM / API Key |

**Setup OAC:**

1. Tạo OAC trong CloudFront Console (Origin settings)
2. S3 giữ "Block Public Access: ON"
3. Thêm Bucket Policy cho CloudFront:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::my-bucket/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::123456789:distribution/XXXXX"
                }
            }
        }
    ]
}
```

**Lưu ý về S3 Endpoint:**

| S3 Endpoint | OAC Support |
|-------------|-------------|
| `bucket.s3.region.amazonaws.com` (REST API) | ✅ Có |
| `bucket.s3-website-region.amazonaws.com` (Website) | ❌ Không |

Nếu dùng S3 Website Endpoint → không có OAC → S3 phải public.

### 3. Signed URLs / Signed Cookies

```python
# Tạo Signed URL bằng Python
from datetime import datetime, timedelta
import boto3
from botocore.signers import CloudFrontSigner
import rsa

def rsa_signer(message):
    with open('private_key.pem', 'rb') as key_file:
        private_key = rsa.PrivateKey.load_pkcs1(key_file.read())
    return rsa.sign(message, private_key, 'SHA-1')

def generate_signed_url(url, expire_minutes=60):
    key_id = 'APKAXXXXXXXXXXXXXXXX'  # CloudFront Key Pair ID
    expire_date = datetime.utcnow() + timedelta(minutes=expire_minutes)
    
    cf_signer = CloudFrontSigner(key_id, rsa_signer)
    signed_url = cf_signer.generate_presigned_url(
        url,
        date_less_than=expire_date
    )
    
    return signed_url

# Sử dụng
url = generate_signed_url('https://d123.cloudfront.net/private/video.mp4')
```

### 4. Geo Restriction

```yaml
Distribution:
  Restrictions:
    GeoRestriction:
      RestrictionType: whitelist  # hoặc blacklist
      Locations:
        - VN
        - US
        - JP
```

### 5. AWS WAF Integration

```yaml
Distribution:
  WebACLId: arn:aws:wafv2:us-east-1:123456789:global/webacl/my-webacl/xxx

# WAF có thể:
# - Block SQL injection
# - Block XSS attacks
# - Rate limiting
# - IP blocking
# - Bot management
```

### 6. Field-Level Encryption

Encrypt sensitive fields ngay tại edge:

```
User POST request:
{
  "name": "John",
  "credit_card": "4111-1111-1111-1111"  ──▶ Encrypted at edge
}

Origin receives:
{
  "name": "John",
  "credit_card": "AQICAHh...encrypted_base64..."  ──▶ Decrypt với private key
}
```

---

## Invalidation (Xóa cache)

### Cách invalidate

```bash
# AWS CLI
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/images/*" "/index.html"
```

```python
# Boto3
import boto3

client = boto3.client('cloudfront')

response = client.create_invalidation(
    DistributionId='E1234567890',
    InvalidationBatch={
        'Paths': {
            'Quantity': 2,
            'Items': ['/images/*', '/index.html']
        },
        'CallerReference': 'my-invalidation-001'
    }
)
```

### Chi phí Invalidation

- **1,000 paths/tháng**: FREE
- Sau đó: **$0.005/path**

### Best Practice: Versioning thay vì Invalidation

```html
<!-- Thay vì invalidate /css/style.css -->
<link href="/css/style.v2.css" rel="stylesheet">

<!-- Hoặc dùng hash -->
<link href="/css/style.a1b2c3d4.css" rel="stylesheet">
```

---

## Real-time Logs & Monitoring

### CloudFront Standard Logs (S3)

```yaml
Distribution:
  Logging:
    Enabled: true
    Bucket: my-logs-bucket.s3.amazonaws.com
    Prefix: cloudfront-logs/
    IncludeCookies: false
```

Log format:
```
date time x-edge-location sc-bytes c-ip cs-method cs(Host) cs-uri-stem sc-status cs(Referer) cs(User-Agent) ...
```

### Real-time Logs (Kinesis)

```yaml
RealtimeLogConfig:
  Name: my-realtime-logs
  EndPoints:
    - StreamType: Kinesis
      KinesisStreamConfig:
        RoleARN: arn:aws:iam::123456789:role/cloudfront-realtime-logs
        StreamARN: arn:aws:kinesis:us-east-1:123456789:stream/cf-logs
  Fields:
    - timestamp
    - c-ip
    - sc-status
    - cs-uri-stem
    - time-taken
```

### CloudWatch Metrics

Các metrics quan trọng:
- `Requests` - Tổng số requests
- `BytesDownloaded` - Bandwidth
- `4xxErrorRate` / `5xxErrorRate` - Error rates
- `CacheHitRate` - Tỷ lệ cache hit (quan trọng!)

---

## Pricing

### Data Transfer Out

| Region | First 10TB | Next 40TB | Next 100TB |
|--------|-----------|-----------|------------|
| US, EU, Canada | $0.085/GB | $0.080/GB | $0.060/GB |
| Asia Pacific | $0.120/GB | $0.100/GB | $0.085/GB |
| South America | $0.170/GB | $0.130/GB | $0.110/GB |

### Requests

| Region | HTTP | HTTPS |
|--------|------|-------|
| US, EU | $0.0075/10K | $0.0100/10K |
| Asia Pacific | $0.0090/10K | $0.0120/10K |

### Free Tier

- **1 TB** data transfer out/tháng
- **10,000,000** HTTP/HTTPS requests/tháng
- **2,000,000** CloudFront Function invocations/tháng

### Data Transfer từ Origin

**FREE** từ các AWS origins:
- S3 → CloudFront: FREE
- EC2/ALB/ELB → CloudFront: FREE

### Price Classes

Có thể giới hạn edge locations để giảm chi phí:

```yaml
Distribution:
  PriceClass: PriceClass_100  # Chỉ US, EU, Canada
  # PriceClass_200: + Asia Pacific, Middle East, Africa
  # PriceClass_All: Tất cả regions
```

---

## Use Cases phổ biến

### 1. React/SPA + S3 (Phổ biến nhất!)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Browser   │──────▶│  CloudFront │──────▶│  S3 Bucket  │
│             │       │  + ACM cert │       │  (React app)│
└─────────────┘       └─────────────┘       └─────────────┘
```

**Khi build React app:**

```bash
npm run build

# Output:
build/
├── index.html                    # Entry point
├── static/
│   ├── js/main.a1b2c3d4.js      # Hash trong tên file!
│   └── css/main.e5f6g7h8.css
└── assets/images/
```

**Cache Strategy quan trọng:**

```
┌─────────────────────────────────────────────────────────┐
│                   CloudFront Cache                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  index.html ────── ❌ KHÔNG cache                       │
│                    → Luôn lấy version mới               │
│                    → Chứa link đến JS/CSS mới           │
│                                                          │
│  static/js/*.js ── ✅ Cache 1 NĂM (immutable)           │
│  static/css/*.css  → Có hash trong tên file            │
│                    → Code đổi → tên file đổi            │
│                    → KHÔNG CẦN invalidate!              │
│                                                          │
│  assets/images/* ─ ✅ Cache 1 tháng - 1 năm             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Tại sao index.html không cache?**

```
Deploy 1: index.html chứa <script src="main.AAA.js">
Deploy 2: index.html chứa <script src="main.BBB.js">  ← Tên mới!

Nếu index.html bị cache → User vẫn load code cũ!
```

**Upload S3 với Cache Headers:**

```bash
# Static files - cache 1 năm
aws s3 sync build/static s3://my-bucket/static \
  --cache-control "max-age=31536000, immutable"

# index.html - không cache
aws s3 cp build/index.html s3://my-bucket/ \
  --cache-control "no-cache, no-store, must-revalidate"
```

**Khi deploy version mới:**

```
1. Build React → tạo main.NEW123.js (tên mới)
2. Upload S3
3. KHÔNG CẦN invalidate CloudFront!

Vì:
- index.html không cache → user nhận HTML mới
- HTML mới link đến main.NEW123.js
- File mới → chưa có cache → lấy từ S3
```

**Deploy Script đầy đủ:**

```bash
#!/bin/bash
# deploy-react.sh

BUCKET="my-react-app"
DISTRIBUTION_ID="E1234567890"

# 1. Build
npm run build

# 2. Upload static files với long cache
aws s3 sync build/ s3://$BUCKET/ \
    --exclude "index.html" \
    --exclude "*.map" \
    --cache-control "public, max-age=31536000, immutable"

# 3. Upload index.html với no-cache
aws s3 cp build/index.html s3://$BUCKET/index.html \
    --cache-control "no-cache, no-store, must-revalidate"

# 4. (Optional) Invalidate index.html để chắc chắn
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/index.html"

echo "Deploy completed!"
```

**CloudFront Behaviors cho React SPA:**

| Priority | Path Pattern | Cache Policy | Ghi chú |
|----------|--------------|--------------|---------|
| 0 | `/index.html` | CachingDisabled | Luôn fresh |
| 1 | `/api/*` | CachingDisabled | API calls |
| 2 | Default `*` | CachingOptimized | Static assets |

**Xử lý Client-Side Routing (React Router):**

Khi user truy cập `/about` trực tiếp → S3 trả 404 (không có file `/about`). 

Giải pháp với CloudFront Custom Error Response:

```yaml
CustomErrorResponses:
  - ErrorCode: 403
    ResponsePagePath: /index.html
    ResponseCode: 200
  - ErrorCode: 404
    ResponsePagePath: /index.html
    ResponseCode: 200
```

Hoặc dùng CloudFront Function:

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Nếu không có extension → SPA route → trả về index.html
    if (!uri.includes('.')) {
        request.uri = '/index.html';
    }
    
    return request;
}
```

### 2. API Acceleration

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Mobile    │──────▶│  CloudFront │──────▶│     ALB     │
│    App      │       │   (cache    │       │   + ECS     │
└─────────────┘       │   API resp) │       └─────────────┘
                      └─────────────┘
```

### 3. Live & On-Demand Video

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Viewer    │──────▶│  CloudFront │──────▶│MediaPackage │
│             │       │  (HLS/DASH) │       │or MediaStore│
└─────────────┘       └─────────────┘       └─────────────┘
```

### 4. Multi-Origin Architecture

```yaml
# Route based on path
Distribution:
  Origins:
    - Id: S3Static
      DomainName: static.s3.amazonaws.com
    - Id: APIBackend
      DomainName: api-alb.us-east-1.elb.amazonaws.com
      
  CacheBehaviors:
    - PathPattern: "/api/*"
      TargetOriginId: APIBackend
    - PathPattern: "/static/*"
      TargetOriginId: S3Static
```

---

## Best Practices

### 1. Caching

```yaml
# Maximize cache hit ratio
- Dùng consistent URL (tránh random query strings)
- Set Cache-Control headers từ origin
- Chỉ forward headers/cookies cần thiết
- Dùng Origin Shield cho high-traffic
```

### 2. Security

```yaml
# Security checklist
- ✅ HTTPS only (redirect HTTP)
- ✅ TLS 1.2+ minimum
- ✅ OAC cho S3 origins
- ✅ WAF cho public APIs
- ✅ Signed URLs cho private content
- ✅ Geo restriction nếu cần
```

### 3. Performance

```yaml
# Performance tips
- ✅ Enable compression (gzip, brotli)
- ✅ Dùng HTTP/2 (mặc định enabled)
- ✅ Cache static assets lâu (1 year) với versioned URLs
- ✅ Dùng CloudFront Functions cho lightweight logic
```

### 4. Cost Optimization

```yaml
# Giảm chi phí
- Dùng Price Class phù hợp (không cần All nếu không có users global)
- Versioned URLs thay vì Invalidation
- Monitor CacheHitRate (target > 80%)
- Reserved capacity cho high-volume
```

---

## So sánh với các CDN khác

| Feature | CloudFront | Cloudflare | Fastly |
|---------|-----------|------------|--------|
| **Pricing** | Pay-as-you-go | Free tier + plans | Pay-as-you-go |
| **Edge Locations** | 750+ | 300+ | 80+ |
| **Edge Compute** | Lambda@Edge, Functions | Workers | Compute@Edge |
| **AWS Integration** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Free SSL** | ✅ (ACM) | ✅ | ✅ |
| **DDoS Protection** | AWS Shield | ✅ Built-in | ✅ |
| **WAF** | AWS WAF ($) | ✅ Built-in | ✅ ($) |
| **Real-time Logs** | ✅ (Kinesis) | ✅ | ✅ |

**Khi nào chọn CloudFront:**
- Đã dùng AWS ecosystem
- Cần tight integration với S3, ALB, Lambda
- Cần Origin Shield
- Enterprise với AWS support

---

## Kết hợp với Route 53

```
┌──────────────────────────────────────────────────────────────────┐
│                         Route 53                                  │
│  cdn.example.com ──▶ Alias Record ──▶ d123.cloudfront.net       │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        CloudFront                                 │
│  Distribution: d123.cloudfront.net                               │
│  Alternate Domain: cdn.example.com                               │
│  Certificate: *.example.com (ACM - us-east-1)                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Cache không hoạt động?

```bash
# Check headers
curl -I https://cdn.example.com/image.png

# Look for:
# X-Cache: Hit from cloudfront  ← Cache hit
# X-Cache: Miss from cloudfront ← Cache miss
# Age: 3600                     ← Cached for 1 hour
```

### 403 Forbidden?

```
Nguyên nhân phổ biến:
1. S3 bucket policy chưa cho phép CloudFront
2. OAC/OAI chưa config đúng
3. S3 Block Public Access blocking
4. Object-level permissions
```

### 502/504 Errors?

```
502 Bad Gateway:
- Origin không phản hồi
- SSL handshake fail với origin
- Origin trả về response không hợp lệ

504 Gateway Timeout:
- Origin mất quá lâu để phản hồi (> 30s default)
- Tăng Origin Response Timeout
```

---

## Tham khảo thêm

- [S3](s3.md) - Origin phổ biến nhất
- [Route 53](route53.md) - DNS và domain management
- [Lambda](lambda.md) - Lambda@Edge source
- [ALB/ELB](elb.md) - Dynamic content origin
- [AWS ACM](aws-acm.md) - SSL certificates, tại sao cert cho CloudFront phải ở us-east-1

