# S3 Security

## Mục lục

- [Tổng quan](#tổng-quan)
- [Access Control](#access-control)
- [Encryption](#encryption)
- [S3 Block Public Access](#s3-block-public-access)
- [CORS](#cors)
- [MFA Delete](#mfa-delete)
- [Pre-signed URLs](#pre-signed-urls)
- [VPC Endpoints](#vpc-endpoints)
- [S3 Access Logs](#s3-access-logs)
- [Logging & Monitoring](#logging--monitoring)
- [Best Practices](#best-practices)
- [Liên kết](#liên-kết)

---

## Tổng quan

S3 Security dựa trên nguyên tắc **Defense in Depth** - nhiều lớp bảo vệ chồng lên nhau:

```
┌─────────────────────────────────────────────────────────────────┐
│                    S3 SECURITY LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Network                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ VPC Endpoints, S3 Access Points, Block Public Access    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  Layer 2: Identity & Access                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ IAM Policies, Bucket Policies, ACLs, Pre-signed URLs    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  Layer 3: Data Protection                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Encryption (SSE-S3, SSE-KMS, SSE-C), Versioning         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  Layer 4: Compliance & Audit                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Object Lock, Access Logs, CloudTrail, Macie             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Mặc định:** Buckets và objects là **private** - chỉ owner có quyền access.

---

## Access Control

### So sánh các phương pháp

| Method | Scope | Attach vào | Use Case |
|--------|-------|------------|----------|
| **IAM Policies** | User/Role | IAM User, Group, Role | Internal users, services trong cùng account |
| **Bucket Policies** | Bucket | S3 Bucket | Cross-account, public access, IP restrictions |
| **Access Points** | Named endpoint | S3 Bucket | Multi-team access, simplified permissions |
| **ACLs** | Object/Bucket | Object hoặc Bucket | ⚠️ Legacy, không khuyến khích |

### IAM Policies vs Bucket Policies

```
┌─────────────────────────────────────────────────────────────────┐
│                    POLICY EVALUATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request đến S3:                                                 │
│                                                                  │
│  1. Check IAM Policy (caller có permission không?)               │
│  2. Check Bucket Policy (bucket cho phép caller không?)          │
│  3. Check ACL (nếu enabled)                                      │
│                                                                  │
│  → Kết quả = UNION của Allow - Explicit Deny wins                │
│                                                                  │
│  Ví dụ:                                                          │
│  - IAM: Allow s3:GetObject                                       │
│  - Bucket Policy: Allow Principal: *                             │
│  - Có Explicit Deny? → DENY                                      │
│  - Không có Deny? → ALLOW                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Bucket Policy Examples

**1. Public Read (cho static website):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

**2. Cross-Account Access:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CrossAccountAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:root"
      },
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

**3. Restrict by IP (chỉ cho phép từ office IP):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "IPRestriction",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "NotIpAddress": {
          "aws:SourceIp": ["203.0.113.0/24", "198.51.100.0/24"]
        }
      }
    }
  ]
}
```

**4. Force HTTPS (deny HTTP):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ForceHTTPS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

### S3 Access Points

Simplify access management cho shared datasets - tạo **nhiều "cổng vào" riêng** cho cùng 1 bucket.

### Vấn đề: 1 Bucket Policy cho nhiều teams

Khi nhiều teams cùng dùng 1 bucket, bạn phải viết **1 bucket policy rất dài và phức tạp**:

```json
// Bucket policy KHỔNG LỒ - khó maintain, giới hạn 20KB!
{
  "Statement": [
    { "Sid": "DataScienceRead", "Principal": {"AWS": "role/data-science"}, "Resource": ".../ml/*" },
    { "Sid": "DataScienceWrite", "Principal": {"AWS": "role/data-science"}, "Resource": ".../ml/*" },
    { "Sid": "AnalyticsRead", "Principal": {"AWS": "role/analytics"}, "Resource": ".../analytics/*" },
    { "Sid": "MarketingRead", "Principal": {"AWS": "role/marketing"}, "Resource": ".../mkt/*" }
    // ... 50 statements nữa cho các team khác
  ]
}
```

### Giải pháp: Mỗi team có Access Point riêng

```
┌─────────────────────────────────────────────────────────────────┐
│                    S3 ACCESS POINTS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Không có Access Points:                                        │
│  ═══════════════════════                                        │
│    Team A ──┐                                                   │
│    Team B ──┼──► [ 1 cửa vào + 1 policy dài ] ──► Bucket       │
│    Team C ──┘                                                   │
│                                                                  │
│  Có Access Points:                                              │
│  ═════════════════                                              │
│    Team A ──► [ Cửa A + policy A ] ──┐                          │
│    Team B ──► [ Cửa B + policy B ] ──┼──► Bucket                │
│    Team C ──► [ Cửa C + policy C ] ──┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ví dụ cụ thể

Bucket `company-data` chứa 3 folders: `/ml/`, `/analytics/`, `/mkt/`

**Access Point cho team Data Science** - chỉ được đọc/ghi `/ml/`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::123456789012:role/data-science"},
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:us-east-1:123456789012:accesspoint/data-science/object/ml/*"
  }]
}
```

**Access Point cho team Marketing** - chỉ được đọc `/mkt/`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::123456789012:role/marketing"},
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:us-east-1:123456789012:accesspoint/marketing/object/mkt/*"
  }]
}
```

### Cách team sử dụng

Mỗi team gọi qua access point của mình thay vì bucket trực tiếp:

```bash
# Trước: tất cả team dùng chung endpoint
aws s3 cp s3://company-data/ml/model.pkl .

# Sau: mỗi team dùng access point riêng
aws s3 cp s3://arn:aws:s3:us-east-1:123456789012:accesspoint/data-science/ml/model.pkl .
```

**Endpoint format:** `https://<access-point-name>-<account-id>.s3-accesspoint.<region>.amazonaws.com`

### So sánh có và không có Access Points

| Không có Access Points | Có Access Points |
|----------------------|-----------------|
| 1 bucket policy cho tất cả | Mỗi team có policy riêng |
| Policy dài, phức tạp | Mỗi policy ngắn, đơn giản |
| Giới hạn 20KB | Không lo giới hạn |
| Thay đổi ảnh hưởng tất cả | Thay đổi chỉ ảnh hưởng 1 team |
| Khó debug khi có lỗi | Dễ xác định lỗi ở team nào |

> 💡 **Hiểu đơn giản:** Access Point giống như tạo **nhiều "cổng vào" cho cùng 1 kho hàng**, mỗi cổng có bảo vệ riêng, quy định riêng về ai được vào và lấy gì.

---

## Encryption

### ⚡ Default Encryption (Từ Jan 2023)

> **Quan trọng:** Từ **tháng 1/2023**, AWS đã bật **SSE-S3 encryption mặc định** cho TẤT CẢ objects mới upload lên S3. **Bạn không cần làm gì!**

```
┌─────────────────────────────────────────────────────────────────┐
│              S3 DEFAULT ENCRYPTION (Jan 2023+)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Trước Jan 2023:              Sau Jan 2023 (hiện tại):          │
│  ─────────────────            ────────────────────────          │
│  Upload object                Upload object                      │
│       │                            │                             │
│       ▼                            ▼                             │
│  Không encrypt                Tự động encrypt với SSE-S3        │
│  (trừ khi bạn specify)        (AES-256, AWS managed keys)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Aspect | Default Behavior |
|--------|------------------|
| **Encryption type** | SSE-S3 (AES-256) |
| **Key management** | AWS quản lý hoàn toàn |
| **Cost** | **Free** |
| **Bạn cần làm gì?** | Không cần làm gì! |
| **Có thể đổi?** | Có - đổi sang SSE-KMS nếu cần audit |

### Server-Side Encryption (SSE)

S3 tự động encrypt data khi lưu và decrypt khi GET:

| Type | Key quản lý | Audit | Khi nào dùng |
|------|-------------|-------|--------------|
| **SSE-S3** | AWS (tự động) | ❌ | Default, đơn giản nhất |
| **SSE-KMS** | Bạn (KMS) | ✅ CloudTrail | Compliance, audit trail |
| **SSE-C** | Bạn (gửi mỗi request) | ❌ | Full control |
| **DSSE-KMS** | KMS, dual-layer | ✅ | Extra security |

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION COMPARISON                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SSE-S3 (Default từ Jan 2023)                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PUT object → S3 tự encrypt với AES-256                  │    │
│  │ GET object → S3 tự decrypt                               │    │
│  │ Key: AWS quản lý hoàn toàn, bạn không thấy              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  SSE-KMS                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PUT object → S3 gọi KMS để lấy Data Key → encrypt       │    │
│  │ GET object → S3 gọi KMS để decrypt Data Key → decrypt   │    │
│  │ Key: Bạn quản lý trong KMS, có audit log                │    │
│  │ ⚠️ KMS có request limits (5,500-30,000 req/s per Region)│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  SSE-C                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PUT: Gửi object + encryption key trong header           │    │
│  │ GET: Gửi encryption key trong header để decrypt         │    │
│  │ Key: Bạn quản lý hoàn toàn, AWS không lưu               │    │
│  │ ⚠️ HTTPS bắt buộc (để bảo vệ key trong transit)         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Side Encryption

- Encrypt **trước** khi upload
- Decrypt **sau** khi download
- AWS không bao giờ thấy plaintext data

```
Client-Side Encryption:
┌────────────┐   encrypt   ┌────────────┐   upload   ┌────────────┐
│ Plaintext  │ ──────────► │ Ciphertext │ ─────────► │     S3     │
└────────────┘             └────────────┘            └────────────┘
                                                     (stores cipher)
```

### Bucket Default Encryption

Bật encryption mặc định cho bucket (tất cả objects mới sẽ được encrypt):

```
Bucket Properties → Default encryption:
- SSE-S3 (default)
- SSE-KMS (chọn KMS key)

→ Objects upload không specify encryption sẽ dùng default
```

### Force Encryption with Bucket Policy

**Tại sao cần Force khi đã có Default?**

Default encryption chỉ áp dụng khi client **không specify** encryption. Client vẫn có thể **override** bằng header:

```bash
# Bucket default: SSE-S3
# Nhưng client có thể override:
aws s3api put-object \
  --bucket my-bucket \
  --key myfile.txt \
  --body myfile.txt \
  --server-side-encryption aws:kms    # ← Override sang KMS
```

```
┌─────────────────────────────────────────────────────────────────┐
│              DEFAULT vs FORCE ENCRYPTION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DEFAULT ENCRYPTION:                                             │
│  - Upload không specify → S3 tự động áp dụng default            │
│  - Upload có specify → Dùng encryption client chọn (override)   │
│                                                                  │
│  FORCE ENCRYPTION (Bucket Policy):                               │
│  - Upload PHẢI dùng encryption được chỉ định                    │
│  - Nếu không đúng → DENY! (kể cả không specify)                 │
│  - Đảm bảo 100% compliance, không ai bypass được                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Bucket Policy để Force SSE-KMS:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyNonKMSEncryption",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    }
  ]
}
```

**Kết quả:**
- Upload với SSE-S3 → ❌ **DENIED**
- Upload với SSE-KMS → ✅ **ALLOWED**
- Upload không specify → ❌ **DENIED**

**Khi nào cần Force Encryption?**

| Scenario | Cần Force? |
|----------|-----------|
| Dữ liệu thông thường | ❌ Default SSE-S3 đủ |
| Cần audit log (ai đọc/ghi) | ✅ Force SSE-KMS |
| Compliance (HIPAA, PCI, SOC2) | ✅ Force SSE-KMS |
| Dùng customer-managed key | ✅ Force SSE-KMS với specific key |

---

## S3 Block Public Access

**Safety net** để ngăn accidentally expose data ra public:

```
┌─────────────────────────────────────────────────────────────────┐
│           S3 BLOCK PUBLIC ACCESS (4 settings)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ☑️ BlockPublicAcls                                              │
│     → Block PUT bucket/object ACL nếu grants public access       │
│                                                                  │
│  ☑️ IgnorePublicAcls                                             │
│     → Ignore existing public ACLs (treat như không có)           │
│                                                                  │
│  ☑️ BlockPublicPolicy                                            │
│     → Block PUT bucket policy nếu grants public access           │
│                                                                  │
│  ☑️ RestrictPublicBuckets                                        │
│     → Restrict access to bucket với public policy chỉ cho        │
│        AWS services và authorized users trong account            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Có thể apply ở 2 levels:**
- **Account level** - apply cho tất cả buckets trong account
- **Bucket level** - apply cho specific bucket

> 💡 **Best Practice:** Enable tất cả 4 settings ở Account level, chỉ disable ở bucket level khi thực sự cần public access.

---

## CORS

**CORS (Cross-Origin Resource Sharing)** - cơ chế cho phép web browser gọi đến S3 bucket từ **domain khác**.

### Vấn đề: Same-Origin Policy

Browser có **Same-Origin Policy** - chặn requests đến domain khác vì lý do bảo mật:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAME-ORIGIN POLICY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Website: https://myapp.com                                      │
│                                                                  │
│  ✅ Fetch from https://myapp.com/api      (same origin)          │
│  ❌ Fetch from https://my-bucket.s3...    (cross-origin!)        │
│  ❌ Fetch from https://api.other.com      (cross-origin!)        │
│                                                                  │
│  Origin = protocol + domain + port                               │
│  → Nếu khác bất kỳ thành phần nào → Cross-Origin                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Làm thế nào để Browser kết nối được S3?

Có **2 cách chính**:

**Cách 1: Cấu hình CORS trên S3 bucket** (Browser gọi trực tiếp)

```
Website (myapp.com)     →     S3 Bucket (có CORS enabled)

1. JS: fetch("https://bucket.s3.amazonaws.com/file")
               │
               ▼
2. Browser: "Cross-origin → gửi preflight OPTIONS trước"
               │
               ▼
3. S3: Check CORS config → có allow myapp.com → OK!
       Trả về: Access-Control-Allow-Origin: https://myapp.com
               │
               ▼
4. Browser: "S3 cho phép" → Gửi request thật → Nhận data ✅
```

**Cách 2: Đi qua Backend (Proxy)** - không cần CORS

```
Website (myapp.com)  →  Backend (myapp.com/api)  →  S3

1. JS: fetch("/api/get-file")      (same origin!) ✅
               │
               ▼  
2. Backend: aws sdk → S3 (server-to-server)
               │
               ▼
3. Backend trả data về browser

→ Browser không biết S3 tồn tại
→ Server-to-server KHÔNG bị Same-Origin Policy
```

| Phương pháp | Cần CORS? | Khi nào dùng |
|-------------|----------|--------------|
| **Browser → S3 trực tiếp** | ✅ Cần | Upload/download file trực tiếp, static assets |
| **Browser → Backend → S3** | ❌ Không | Cần xử lý logic, bảo mật sensitive operations |

> 💡 **Key insight:** Same-Origin Policy là **browser** chặn, không phải S3. CORS là cách S3 **nói với browser** "tao cho phép origin này gọi tao".

### CORS giải quyết thế nào?

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORS FLOW                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Browser gửi Preflight request (OPTIONS)                      │
│     Origin: https://myapp.com                                    │
│          │                                                       │
│          ▼                                                       │
│  2. S3 check CORS config → có allow myapp.com?                  │
│          │                                                       │
│          ▼                                                       │
│  3. S3 trả về CORS headers                                       │
│     Access-Control-Allow-Origin: https://myapp.com               │
│     Access-Control-Allow-Methods: GET, PUT                       │
│          │                                                       │
│          ▼                                                       │
│  4. Browser nhận → OK, cho phép request thật                     │
│          │                                                       │
│          ▼                                                       │
│  5. Browser gửi actual request (GET/PUT...)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cấu hình CORS trên S3

Bucket → Permissions → Cross-origin resource sharing (CORS):

```json
[
  {
    "AllowedOrigins": [
      "https://myapp.com",
      "https://www.myapp.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-meta-custom-header"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Giải thích các fields

| Field | Mô tả | Ví dụ |
|-------|-------|-------|
| **AllowedOrigins** | Domains được phép gọi | `["https://myapp.com"]` hoặc `["*"]` (all) |
| **AllowedMethods** | HTTP methods được phép | `["GET", "PUT", "POST", "DELETE"]` |
| **AllowedHeaders** | Headers client được gửi | `["*"]` hoặc `["Content-Type", "Authorization"]` |
| **ExposeHeaders** | Headers S3 trả về mà JS có thể đọc | `["ETag", "x-amz-meta-*"]` |
| **MaxAgeSeconds** | Cache preflight response (giây) | `3600` (1 hour) |

### Use Cases phổ biến

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORS USE CASES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Static Website + S3 Assets                                   │
│     Website ở CloudFront/Vercel, images/fonts ở S3              │
│                                                                  │
│  2. Direct Upload từ Browser                                     │
│     User upload file trực tiếp lên S3 (với pre-signed URL)      │
│                                                                  │
│  3. SPA (React/Vue) + S3 API                                     │
│     Frontend gọi S3 để lấy JSON/data files                      │
│                                                                  │
│  4. Web Fonts                                                    │
│     Font files (.woff2) hosted trên S3                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ví dụ: Allow all origins (Development)

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

> ⚠️ **Cảnh báo:** Không dùng `"*"` cho production với write operations!

### Troubleshooting CORS Errors

```
❌ Error: "No 'Access-Control-Allow-Origin' header is present"

Checklist:
1. ✅ CORS config đã được thêm vào bucket?
2. ✅ AllowedOrigins có chứa domain của bạn?
3. ✅ AllowedMethods có chứa method bạn dùng?
4. ✅ Bucket policy có block request không?
5. ✅ CloudFront có forward Origin header không?
```

---

## MFA Delete

**MFA Delete** - yêu cầu MFA (Multi-Factor Authentication) để thực hiện các thao tác **xóa quan trọng** trên S3.

### Tại sao cần MFA Delete?

```
┌─────────────────────────────────────────────────────────────────┐
│                    MFA DELETE PROTECTION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Scenario nguy hiểm:                                             │
│                                                                  │
│  1. Hacker có được AWS credentials (access key bị lộ)           │
│  2. Hacker xóa tất cả objects + versions                        │
│  3. Hacker tắt versioning                                        │
│  4. Data mất vĩnh viễn! 💀                                       │
│                                                                  │
│  Với MFA Delete enabled:                                         │
│                                                                  │
│  1. Hacker có credentials                                        │
│  2. Hacker DELETE object version → ❌ DENIED (cần MFA code)     │
│  3. Hacker tắt versioning → ❌ DENIED (cần MFA code)            │
│  4. Data vẫn an toàn! ✅                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### MFA Delete bảo vệ những gì?

| Action | Cần MFA? |
|--------|----------|
| **Delete object version** (permanently delete) | ✅ Cần MFA |
| **Suspend/Disable versioning** | ✅ Cần MFA |
| Delete object (tạo delete marker) | ❌ Không cần |
| Enable versioning | ❌ Không cần |
| List/Get objects | ❌ Không cần |

> 💡 **Lưu ý:** MFA Delete chỉ bảo vệ **permanent delete** (xóa version cụ thể), không phải soft delete (tạo delete marker).

### Yêu cầu để enable MFA Delete

```
┌─────────────────────────────────────────────────────────────────┐
│                    MFA DELETE REQUIREMENTS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ✅ Bucket phải có Versioning ENABLED                         │
│                                                                  │
│  2. ✅ Chỉ ROOT ACCOUNT owner mới có thể enable/disable         │
│        (IAM users KHÔNG THỂ, kể cả có full admin permissions)   │
│                                                                  │
│  3. ✅ Phải dùng AWS CLI (không thể dùng Console!)              │
│                                                                  │
│  4. ✅ Root account phải có MFA device configured               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cách enable MFA Delete

```bash
# Chỉ root account mới chạy được!
# Phải dùng CLI, không có option trên Console

aws s3api put-bucket-versioning \
  --bucket my-bucket \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::123456789012:mfa/root-account-mfa-device 123456"
                                                            ^
                                                    MFA code từ device
```

### Khi delete cần MFA

```bash
# Delete một version cụ thể (permanent delete)
aws s3api delete-object \
  --bucket my-bucket \
  --key myfile.txt \
  --version-id "abc123" \
  --mfa "arn:aws:iam::123456789012:mfa/root-account-mfa-device 654321"
```

### MFA Delete vs Object Lock

| Feature | MFA Delete | Object Lock |
|---------|------------|-------------|
| **Bảo vệ** | Cần MFA để delete | Không ai có thể delete |
| **Linh hoạt** | Vẫn có thể delete (với MFA) | Hoàn toàn không thể delete |
| **Use case** | Chống unauthorized delete | Compliance (WORM) |
| **Enable bởi** | Root account only | Khi tạo bucket |

### Khi nào dùng MFA Delete?

| Scenario | Recommendation |
|----------|----------------|
| Critical backups | ✅ Enable MFA Delete |
| Compliance data (WORM required) | ✅ Use Object Lock thay vì MFA Delete |
| Shared AWS account | ✅ Enable MFA Delete |
| Data có thể recreate | ❌ Không cần |

> ⚠️ **Lưu ý quan trọng:** MFA Delete chỉ có thể enable/disable bởi **root account**. Nếu root account bị mất access, bạn không thể tắt MFA Delete!

---

## Pre-signed URLs

Tạo temporary URLs để grant access **không cần AWS credentials**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-SIGNED URLs                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Use case: Cho user download private object qua browser          │
│                                                                  │
│  1. User request download                                        │
│  2. Backend generate pre-signed URL (có thời hạn)               │
│  3. Return URL cho user                                          │
│  4. User download trực tiếp từ S3                                │
│                                                                  │
│  ┌────────┐  request   ┌────────┐  generate   ┌────────┐        │
│  │  User  │ ─────────► │ Backend│ ──────────► │   S3   │        │
│  └────────┘            └───┬────┘             └────────┘        │
│       ▲                    │                       ▲             │
│       │    pre-signed URL  │                       │             │
│       └────────────────────┘         download      │             │
│       │────────────────────────────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**AWS CLI:**

```bash
# Generate pre-signed URL (default 1 hour)
aws s3 presign s3://my-bucket/my-object

# Specify expiration (max 7 days = 604800 seconds)
aws s3 presign s3://my-bucket/my-object --expires-in 3600
```

**Pre-signed URL format:**
```
https://my-bucket.s3.amazonaws.com/my-object
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=...
  &X-Amz-Date=...
  &X-Amz-Expires=3600
  &X-Amz-SignedHeaders=host
  &X-Amz-Signature=...
```

**Use cases:**
- Allow downloads without AWS credentials
- Allow uploads to specific path
- Temporary access for external users

---

## VPC Endpoints

Truy cập S3 qua **private network** thay vì internet:

```
┌─────────────────────────────────────────────────────────────────┐
│                    VPC ENDPOINTS FOR S3                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Without VPC Endpoint:                                           │
│  EC2 ──► NAT Gateway ──► Internet Gateway ──► Internet ──► S3   │
│                           (tốn NAT cost, slow, less secure)      │
│                                                                  │
│  With Gateway Endpoint (FREE):                                   │
│  EC2 ──────────────────► VPC Endpoint ──────────────────► S3    │
│                           (private, fast, no NAT cost)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**2 loại VPC Endpoints cho S3:**

| Type | Network | Cost | Use Case |
|------|---------|------|----------|
| **Gateway Endpoint** | Route table entry | **Free** | Default choice |
| **Interface Endpoint** | ENI with private IP | ~$7/month | On-premises access, specific compliance |

**Bucket Policy restrict to VPC Endpoint:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VPCEndpointOnly",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "StringNotEquals": {
          "aws:sourceVpce": "vpce-1234567890abcdef0"
        }
      }
    }
  ]
}
```

---

## S3 Access Logs

**S3 Access Logs** ghi lại mọi requests đến bucket - ai truy cập, làm gì, khi nào.

### Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│                    S3 ACCESS LOGGING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                    ┌──────────────────────┐   │
│  │ Source Bucket│  ───► Logs ───►    │ Target Bucket (logs) │   │
│  │ (my-data)    │                    │ (my-data-logs)       │   │
│  └──────────────┘                    └──────────────────────┘   │
│                                            │                     │
│                                            ▼                     │
│                               2024-01-15-00-45-32-ABC123.log    │
│                               2024-01-15-01-12-45-DEF456.log    │
│                               ...                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Log format (các fields quan trọng)

```
79a59df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47ef2be  ← Bucket Owner ID
my-bucket                                                          ← Bucket Name  
[15/Jan/2024:09:47:23 +0000]                                       ← Time
192.168.1.100                                                      ← Requester IP
arn:aws:iam::123456789012:user/john                                ← Requester ARN
ABC123XYZ                                                          ← Request ID
REST.GET.OBJECT                                                    ← Operation
myfile.txt                                                         ← Key
"GET /my-bucket/myfile.txt HTTP/1.1"                               ← Request-URI
200                                                                ← HTTP Status
-                                                                  ← Error Code
1024                                                               ← Bytes Sent
234                                                                ← Object Size
50                                                                 ← Total Time (ms)
12                                                                 ← Turn-Around Time (ms)
"-"                                                                ← Referrer
"aws-sdk-java/1.11.123"                                            ← User-Agent
```

### Cách enable S3 Access Logs

**Console:** Bucket → Properties → Server access logging → Edit → Enable

**CLI:**

```bash
# Tạo target bucket cho logs
aws s3 mb s3://my-bucket-logs

# Enable logging
aws s3api put-bucket-logging \
  --bucket my-bucket \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "my-bucket-logs",
      "TargetPrefix": "logs/my-bucket/"
    }
  }'
```

### Target Bucket Policy

Target bucket cần có policy cho phép S3 log delivery:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3LogDeliveryWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::my-bucket-logs/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "123456789012"
        }
      }
    }
  ]
}
```

### Use Cases

| Use Case | Mô tả |
|----------|-------|
| **Security audit** | Ai đã truy cập sensitive files? |
| **Access patterns** | Files nào được access nhiều nhất? |
| **Cost analysis** | Requests đến từ đâu, bao nhiêu? |
| **Troubleshooting** | Tại sao request failed? (error codes) |
| **Compliance** | Chứng minh access history |

### Lưu ý quan trọng

```
⚠️  KHÔNG bật logging vào chính bucket đó!

    Source Bucket ──► logs ──► Source Bucket (SAME!)
                                    │
                                    ▼
                              Infinite loop!
                              Log ghi → tạo log mới → ghi → ...
                              → Bucket đầy, tốn tiền!

✅  ĐÚNG: Dùng bucket riêng cho logs

    Source Bucket ──► logs ──► Target Bucket (KHÁC!)
```

| Điểm cần lưu ý | Chi tiết |
|----------------|----------|
| **Best-effort delivery** | Không đảm bảo 100% logs được ghi |
| **Delay** | Logs có thể delay vài phút |
| **Cost** | Chỉ tốn phí storage cho log files |
| **Format** | Text files, space-delimited |

### S3 Access Logs vs CloudTrail

| Feature | S3 Access Logs | CloudTrail |
|---------|----------------|------------|
| **Scope** | Requests đến bucket | AWS API calls |
| **Chi tiết** | Rất chi tiết (bytes, latency) | Ít chi tiết hơn |
| **Delivery** | Best-effort | Near real-time |
| **Cost** | Storage only | Per event (data events) |
| **Analysis** | Athena, custom scripts | CloudWatch, Athena |
| **Use case** | Deep analysis | Audit, compliance |

> 💡 **Recommendation:** Dùng **cả hai** cho comprehensive monitoring. CloudTrail cho real-time audit, Access Logs cho detailed analysis.

---

## Logging & Monitoring

### CloudTrail

Log **management events** (bucket creation, policy changes) và **data events** (GetObject, PutObject):

- Management events: mặc định đã log
- Data events: phải bật riêng (tốn phí)

### Amazon Macie

Tự động discover **sensitive data** (PII, credentials) trong S3:

- Scan buckets tìm sensitive data
- Alert về public buckets, unencrypted data
- Compliance reports

---

## Best Practices

### Checklist bảo mật S3

| Category | Action | Priority |
|----------|--------|----------|
| **Access** | Enable S3 Block Public Access ở account level | 🔴 Critical |
| **Access** | Disable ACLs (dùng Bucket owner enforced) | 🟠 High |
| **Access** | Sử dụng least privilege IAM policies | 🟠 High |
| **Encryption** | Enable default encryption (SSE-S3 hoặc SSE-KMS) | 🟠 High |
| **Encryption** | Force HTTPS với bucket policy | 🟡 Medium |
| **Data Protection** | Enable versioning cho critical data | 🟠 High |
| **Data Protection** | Enable MFA Delete cho critical buckets | 🟡 Medium |
| **Network** | Sử dụng VPC Endpoints | 🟡 Medium |
| **Monitoring** | Enable S3 Access Logs | 🟡 Medium |
| **Monitoring** | Enable CloudTrail data events | 🟡 Medium |
| **Compliance** | Sử dụng Object Lock cho WORM requirements | 🟡 As needed |

### Common Mistakes

```
❌ Bucket policy với Principal: "*" mà không có Condition
   → Public bucket!

❌ ACLs enabled (legacy) có thể vô tình grant public access
   → Dùng "Bucket owner enforced" để disable ACLs

❌ Quên enable versioning trước khi bật Object Lock
   → Object Lock yêu cầu versioning

❌ SSE-C qua HTTP
   → Keys bị exposed! Phải dùng HTTPS
```

---

## Liên kết

- [S3](s3.md) - Main S3 documentation
- [AWS KMS](aws-kms.md) - Key Management Service
- [VPC Endpoints](vpc-endpoints.md) - Private access to AWS services
- [IAM](iam.md) - Identity and Access Management
- [Amazon Macie](amazon-macie.md) - Sensitive data discovery

---

## Tài liệu tham khảo

- [S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [S3 Access Control](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-overview.html)
- [S3 Encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html)
