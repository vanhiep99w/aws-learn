# IAM Roles - Deep Dive


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các loại Role](#các-loại-role)
- [Trust Policy vs Permissions Policy](#trust-policy-vs-permissions-policy)
- [Role Chaining](#role-chaining)
- [Cross-Account Access](#cross-account-access)
- [Confused Deputy Problem](#confused-deputy-problem)
- [IAM Roles Anywhere](#iam-roles-anywhere)
- [Session Policies](#session-policies)
- [Best Practices](#best-practices)
- [Quick Reference](#quick-reference)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**IAM Role** là một **identity** trong AWS với permissions cụ thể, được thiết kế để **bất kỳ ai cần** đều có thể assume (đảm nhận), thay vì gắn cố định với một người dùng.

```
┌─────────────────────────────────────────────────────────────┐
│                      IAM Role                               │
├─────────────────────────────────────────────────────────────┤
│  • Không có long-term credentials (password/access keys)    │
│  • Cung cấp temporary credentials khi được assume           │
│  • Credentials tự động rotate (15 phút - 12 giờ)            │
│  • Có thể được assume bởi nhiều entities khác nhau          │
└─────────────────────────────────────────────────────────────┘
```

**Ai có thể assume Role?**
- IAM Users (cùng account hoặc khác account)
- IAM Roles khác (role chaining)
- AWS Services (EC2, Lambda, ECS...)
- Federated users (SAML 2.0, OpenID Connect)
- External workloads (IAM Roles Anywhere)

---

## Các loại Role

### 1. Service Role

**Service Role** là role mà một AWS service assume để thực hiện actions thay bạn.

```
Ví dụ:
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     EC2      │ assume  │ Service Role │ access  │      S3      │
│   Instance   │────────▶│ EC2-S3-Role  │────────▶│    Bucket    │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Đặc điểm:**
- Bạn tự tạo và quản lý
- Bạn có thể chỉnh sửa permissions
- Trust policy cho phép AWS service assume

**Ví dụ Trust Policy cho EC2 Service Role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 2. Service-Linked Role

**Service-Linked Role** là loại service role **được liên kết trực tiếp** với một AWS service cụ thể.

```
So sánh:

Service Role:                    Service-Linked Role:
├── Bạn tạo                      ├── AWS service tạo tự động
├── Bạn đặt tên                  ├── Tên cố định (AWSServiceRoleFor...)
├── Bạn chỉnh permissions        ├── Permissions cố định (chỉ xem)
└── Bạn có thể xóa bất kỳ lúc    └── Phải xóa related resources trước
```

**Ví dụ Service-Linked Roles:**
| Service | Role Name | Mục đích |
|---------|-----------|----------|
| Auto Scaling | `AWSServiceRoleForAutoScaling` | Manage EC2 instances |
| ECS | `AWSServiceRoleForECS` | Manage ECS resources |
| RDS | `AWSServiceRoleForRDS` | Enhanced monitoring |
| Elastic Load Balancing | `AWSServiceRoleForElasticLoadBalancing` | Manage load balancers |

> **Nguồn:** [AWS services that work with IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-services-that-work-with-iam.html)

---

## Trust Policy vs Permissions Policy

Mỗi IAM Role có **2 phần policy** (cả 2 đều cần thiết):

```
                    IAM Role
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐          ┌─────────────────┐
│  Trust Policy   │          │Permissions Policy│
│  (Ai được       │          │  (Làm được gì   │
│   assume?)      │          │   sau khi       │
│                 │          │   assume?)      │
└─────────────────┘          └─────────────────┘
```

### Trust Policy

Định nghĩa **ai** (principals) được phép assume role.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111122223333:user/developer"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}
```

**Các loại Principal trong Trust Policy:**

| Principal Type | Ví dụ | Use case |
|---------------|-------|----------|
| **AWS Account** | `"AWS": "arn:aws:iam::123456789012:root"` | Cho phép toàn bộ account |
| **IAM User** | `"AWS": "arn:aws:iam::123456789012:user/alice"` | Cho phép user cụ thể |
| **IAM Role** | `"AWS": "arn:aws:iam::123456789012:role/AdminRole"` | Role chaining |
| **AWS Service** | `"Service": "lambda.amazonaws.com"` | Cho phép AWS service |
| **Federated** | `"Federated": "arn:aws:iam::123456789012:saml-provider/ExampleProvider"` | SSO/Identity federation |

### Permissions Policy

Định nghĩa **những gì** role được phép làm sau khi assume.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

---

## Role Chaining

**Role chaining** là khi bạn dùng một role để assume role khác.

```
User → assume RoleA → assume RoleB → access resources
         (hop 1)        (hop 2)
```

**Ví dụ thực tế:**

```
Developer (Account A)
    │
    │ 1. Assume DevRole
    ▼
┌─────────────────┐
│    DevRole      │ (Account A)
│ Trust: User     │
│ Permission:     │
│ sts:AssumeRole  │
│ on ProdRole     │
└────────┬────────┘
         │
         │ 2. Assume ProdRole
         ▼
┌─────────────────┐
│   ProdRole      │ (Account B - Production)
│ Trust: DevRole  │
│ Permission:     │
│ s3:*, ec2:*     │
└────────┬────────┘
         │
         │ 3. Access resources
         ▼
    S3, EC2 in Prod
```

### ⚠️ Giới hạn quan trọng của Role Chaining

| Giới hạn | Giá trị |
|----------|---------|
| **Maximum session duration** | **1 giờ** (bất kể setting của role) |
| **Session tags** | Phải set `Transitive` để pass qua các hop |

> **Nguồn:** [Role chaining limits](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)

---

## Cross-Account Access

### Cross-Account là gì?

**Cross-Account Access** là khi người/resource ở **Account A** cần truy cập resources ở **Account B** - là **2 AWS accounts hoàn toàn riêng biệt**.

```
Account A                              Account B
┌─────────────────────────┐           ┌─────────────────────────┐
│ Account ID: 111111111111│           │ Account ID: 222222222222│
│ Root: dev@company.com   │           │ Root: prod@company.com  │
│                         │           │                         │
│ - Riêng billing         │           │ - Riêng billing         │
│ - Riêng resources       │           │ - Riêng resources       │
│ - Riêng IAM users       │           │ - Riêng IAM users       │
└─────────────────────────┘           └─────────────────────────┘
         ▲                                      ▲
         │                                      │
    Root riêng                             Root riêng
    (KHÔNG chung)                         (KHÔNG chung)
```

### Tại sao công ty có nhiều AWS accounts?

Thực tế các công ty thường tách accounts theo môi trường:

```
                    AWS Organization (quản lý tập trung, optional)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Dev Account │      │ Staging Acct │      │ Prod Account │
│  ID: 111...  │      │  ID: 222...  │      │  ID: 333...  │
│  Root riêng  │      │  Root riêng  │      │  Root riêng  │
└──────────────┘      └──────────────┘      └──────────────┘
```

**Lý do tách accounts:**

| Lý do | Giải thích |
|-------|------------|
| **Isolation** | Lỗi ở Dev không ảnh hưởng Prod |
| **Billing** | Biết chi phí từng môi trường |
| **Security** | Giới hạn blast radius khi bị hack |
| **Compliance** | Prod có policy riêng chặt hơn |

### Vấn đề cần giải quyết

```
Developer Hiệp ở Dev Account muốn xem logs ở Prod Account

❌ Cách xấu: Tạo thêm IAM User cho Hiệp ở Prod
   → Quản lý 2 credentials
   → Khó revoke khi Hiệp nghỉ việc
   → Hiệp có permanent access

✅ Cách tốt: Cross-Account Access với IAM Role
   → Hiệp chỉ cần 1 user ở Dev
   → Assume role để tạm thời có quyền ở Prod
   → Credentials tự hết hạn sau 1 giờ
```

### Giải pháp: IAM Role làm "cầu nối"

```
Account A (Dev)                    Account B (Prod)
┌──────────────────┐              ┌──────────────────────────────┐
│                  │              │                              │
│  User: Hiệp      │              │  Role: CrossAccountRole      │
│  (có quyền       │   assume     │  ┌────────────────────────┐  │
│   assume role)   │─────────────▶│  │ Trust: Account A       │  │
│                  │              │  │ Permissions: S3 Read   │  │
│                  │              │  └───────────┬────────────┘  │
└──────────────────┘              │              │               │
                                  │              ▼               │
                                  │  ┌────────────────────────┐  │
                                  │  │ S3 Bucket "prod-logs"  │  │
                                  │  └────────────────────────┘  │
                                  └──────────────────────────────┘
```

### Cần CẢ HAI bên cho phép!

```
                    CẦN CẢ 2 ĐIỀU KIỆN
                           
Account A                              Account B
┌─────────────────┐                   ┌─────────────────┐
│ User Policy:    │                   │ Role Trust:     │
│ "Hiệp được      │        +          │ "Cho phép       │
│  assume role    │                   │  Account A      │
│  ở Account B"   │                   │  assume role"   │
└─────────────────┘                   └─────────────────┘
        ▲                                     ▲
        │                                     │
   Điều kiện 1                           Điều kiện 2
   (Sếp Hiệp cho đi)                (Chủ nhà Prod cho vào)

→ Thiếu 1 trong 2 = DENIED!
```

### Từng bước setup

#### Bước 1: Account B (Prod) tạo Role - "Chủ nhà mời khách"

Account B nói: *"Tôi cho phép Account A vào, nhưng chỉ được đọc S3 logs thôi"*

**Trust Policy** - Ai được vào:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111111111111:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Permissions Policy** - Được làm gì sau khi vào:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::prod-logs",
        "arn:aws:s3:::prod-logs/*"
      ]
    }
  ]
}
```

#### Bước 2: Account A (Dev) cấp quyền cho Hiệp - "Sếp cho nhân viên đi"

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::222222222222:role/CrossAccountRole"
    }
  ]
}
```

#### Bước 3: Hiệp assume role và truy cập

```bash
# Hiệp "mượn" identity của Role bên Account B
aws sts assume-role \
  --role-arn "arn:aws:iam::222222222222:role/CrossAccountRole" \
  --role-session-name "hiep-session"

# AWS trả về temporary credentials
{
  "Credentials": {
    "AccessKeyId": "ASIA...",           # Tạm thời
    "SecretAccessKey": "...",            # Tạm thời  
    "SessionToken": "...",               # Tạm thời
    "Expiration": "2025-01-20T12:00:00Z" # Hết hạn sau 1 giờ
  }
}

# Dùng credentials đó để đọc S3 ở Account B
export AWS_ACCESS_KEY_ID=ASIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...

aws s3 ls s3://prod-logs
```

### Ví dụ thực tế hay gặp

| Scenario | Account A | Account B |
|----------|-----------|-----------|
| Dev team cần xem prod logs | Dev Account | Prod Account |
| CI/CD deploy lên production | DevOps Account | Prod Account |
| Security team audit nhiều accounts | Security Account | Tất cả accounts |
| Vendor/Partner cần access | Partner's Account | Your Account |

---

## Confused Deputy Problem

**Confused Deputy** là vấn đề bảo mật khi một entity **không có quyền** có thể lừa một entity **có nhiều quyền hơn** thực hiện actions thay mình.

### Ví dụ thực tế: Datadog Monitoring

**Datadog** là SaaS monitoring service - bạn cần cấp quyền để Datadog đọc CloudWatch metrics từ AWS account của bạn.

#### Datadog hoạt động như thế nào?

```
┌─────────────────────────────────────────────────────────────┐
│                     Datadog (SaaS)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Datadog Web UI                       │   │
│  │                                                      │   │
│  │   Khách hàng đăng nhập → Chọn AWS Account → Xem data│   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Datadog Backend (AWS Account)             │   │
│  │            Account ID: 464622532012                  │   │
│  │                                                      │   │
│  │   Nhận request → Assume role → Lấy metrics → Trả về │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Bước 1: Bạn setup Datadog

```
BẠN đăng ký Datadog:
├── Tạo account trên Datadog
├── Datadog hướng dẫn tạo IAM Role trong AWS account của bạn
├── Trust Policy cho phép Datadog's account assume role
└── Datadog giờ có thể đọc CloudWatch metrics của bạn
```

#### Bước 2: Hacker cũng là khách hàng Datadog

```
                      Datadog (Account: 464622532012)
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
      Khách hàng 1       Khách hàng 2        HACKER
      (Bạn - 111...)     (Công ty B)      (cũng là khách
                                           của Datadog)
```

#### Bước 3: Tấn công Confused Deputy

Hacker sửa request để yêu cầu Datadog đọc metrics từ account **của BẠN**:

```
HACKER đăng nhập Datadog
    │
    │ Sửa request: "Lấy metrics từ account 111111111111" 
    │              (Account của BẠN!)
    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Datadog Backend                           │
│                                                             │
│  Nhận request: "Lấy metrics từ 111111111111"               │
│       │                                                     │
│       │  Nếu Datadog KHÔNG validate request này từ ai      │
│       ▼                                                     │
│  Assume role vào account 111111111111 (của BẠN)            │
│       │                                                     │
│       ▼                                                     │
│  Lấy CloudWatch metrics của BẠN                            │
│       │                                                     │
│       ▼                                                     │
│  Trả data về cho... HACKER! 😱                             │
└─────────────────────────────────────────────────────────────┘
```

#### Vấn đề: Trust Policy không phân biệt ai yêu cầu

```
Trust Policy của BẠN (KHÔNG AN TOÀN):
{
  "Principal": {
    "AWS": "arn:aws:iam::464622532012:root"  ← Datadog account
  }
}

→ Cho phép Datadog assume role
→ KHÔNG phân biệt Datadog assume cho ai (bạn hay hacker)
→ Hacker lợi dụng điều này!
```

### Giải pháp: External ID

**External ID** = "mật khẩu bí mật" giữa bạn và Datadog.

#### Cách hoạt động

```
Bước 1: Datadog cấp cho bạn External ID duy nhất
        → External ID: "abc123xyz789..."
        → Chỉ BẠN và Datadog biết (Hacker không biết)

Bước 2: Bạn thêm External ID vào Trust Policy
```

**Trust Policy có External ID (AN TOÀN):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::464622532012:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "abc123xyz789..."
        }
      }
    }
  ]
}
```

#### Giờ Hacker bị chặn

```
Datadog assume role cho BẠN:
→ Gửi kèm External ID: "abc123xyz789..." 
→ ✅ ALLOWED (External ID khớp)

Datadog assume role cho HACKER (vào account bạn):
→ Hacker có External ID riêng: "hacker-different-id"
→ Hoặc không biết External ID của bạn
→ ❌ DENIED! External ID không khớp
```

#### Tại sao 1 giờ credentials vẫn nguy hiểm?

```
Không có External ID:
───────────────────────
Hacker assume role lần 1 → 1 giờ access → Đọc data
         │
         │ Hết hạn
         ▼
Hacker assume role lần 2 → 1 giờ nữa → Đọc tiếp
         │
         ▼
    Lặp lại vô hạn! 🔄

Có External ID:
───────────────
Hacker assume role → ❌ DENIED ngay lập tức
                   → 0 giây access
                   → Không bao giờ vào được
```

### Tóm tắt

| Khái niệm | Giải thích |
|-----------|------------|
| **Confused Deputy** | Third-party (Datadog) bị lừa để truy cập sai account |
| **Deputy (người bị lừa)** | Datadog - third-party service |
| **Kẻ tấn công** | Hacker cũng là khách hàng của Datadog |
| **Nạn nhân** | Bạn - chủ account bị truy cập trái phép |
| **External ID** | Mật khẩu bí mật để chống bị lừa |

**Quy tắc:** Khi cho third-party access vào account, **LUÔN yêu cầu External ID**!

> **Nguồn thực tế:** [Datadog AWS Integration](https://docs.datadoghq.com/integrations/amazon_web_services/) yêu cầu External ID khi setup.

### Cross-Service Confused Deputy

Khi AWS service access resources thay bạn, dùng các condition keys:

| Condition Key | Mô tả |
|--------------|-------|
| `aws:SourceAccount` | Account ID của service gọi |
| `aws:SourceArn` | ARN của resource gốc |
| `aws:SourceOrgID` | Organization ID |

**Ví dụ:** CloudTrail ghi logs vào S3:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::my-logs-bucket/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "123456789012"
        },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:cloudtrail:*:123456789012:trail/*"
        }
      }
    }
  ]
}
```

> **Nguồn:** [The confused deputy problem](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html)

---

## IAM Roles Anywhere

### Vấn đề cần giải quyết

Bạn có server **nằm ngoài AWS** (on-premises, datacenter công ty, hoặc cloud khác) cần truy cập AWS resources.

```
┌─────────────────────────────┐        ┌─────────────────────────┐
│     Datacenter công ty      │        │         AWS             │
│     (Ngoài AWS)             │        │                         │
│                             │        │   ┌─────────────────┐   │
│   ┌───────────────────┐     │   ???  │   │    S3 Bucket    │   │
│   │  Server ứng dụng  │─────┼───────▶│   │                 │   │
│   │  (on-premises)    │     │        │   └─────────────────┘   │
│   └───────────────────┘     │        │                         │
└─────────────────────────────┘        └─────────────────────────┘

Làm sao server này truy cập S3?
```

### Cách cũ: Access Key (KHÔNG AN TOÀN)

```
❌ Tạo IAM User → Lấy Access Key → Lưu vào server

Vấn đề:
├── Access Key là long-term credentials (không tự hết hạn)
├── Phải tự rotate định kỳ (dễ quên)
├── Lộ key = hacker truy cập mãi mãi
└── Khó quản lý khi có nhiều servers
```

### Cách mới: IAM Roles Anywhere

**Ý tưởng:** Dùng **certificate (chứng chỉ số)** thay vì Access Key.

```
Server có certificate → Dùng certificate xin temporary credentials → Truy cập AWS
```

### Tại sao certificate tốt hơn Access Key?

| Access Key | Certificate |
|------------|-------------|
| Không tự hết hạn (phải tự rotate) | Có ngày hết hạn tự động |
| Chỉ là chuỗi text dễ copy | Gắn với identity cụ thể |
| Lộ = mất luôn | Có thể revoke ngay lập tức |
| Khó biết ai đang dùng | Biết rõ certificate thuộc server nào |

### Luồng hoạt động chi tiết

```
┌─────────────────────────────────────────────────────────────────┐
│                    Datacenter công ty                           │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐│
│  │  Server ứng dụng│    │  Certificate (do công ty cấp)       ││
│  │                 │◀──▶│  - Subject: app-server-01           ││
│  │                 │    │  - Issuer: Company CA               ││
│  │                 │    │  - Expiry: 2026-01-01               ││
│  └────────┬────────┘    └─────────────────────────────────────┘│
│           │                                                     │
└───────────┼─────────────────────────────────────────────────────┘
            │
            │ 1. "Tôi là app-server-01, đây là certificate của tôi"
            │    "Cho tôi credentials để truy cập S3"
            ▼
┌───────────────────────────────────────────────────────────────┐
│                           AWS                                  │
│                                                                │
│  ┌─────────────────┐      ┌─────────────────────────────────┐ │
│  │  Trust Anchor   │      │  IAM Roles Anywhere             │ │
│  │  (CA của công ty│◀────▶│                                 │ │
│  │   đăng ký với   │      │  2. Kiểm tra certificate hợp lệ │ │
│  │   AWS)          │      │     - Đúng CA đã đăng ký? ✅    │ │
│  └─────────────────┘      │     - Còn hạn? ✅               │ │
│                           │     - Bị revoke chưa? ❌         │ │
│                           └──────────────┬──────────────────┘ │
│                                          │                     │
│                           3. OK! Cấp temporary credentials     │
│                                          │                     │
│                                          ▼                     │
│                           ┌─────────────────────────────────┐ │
│                           │  Temporary Credentials          │ │
│                           │  - AccessKeyId: ASIA...         │ │
│                           │  - SecretAccessKey: ...         │ │
│                           │  - Expiration: 1 giờ sau        │ │
│                           └──────────────┬──────────────────┘ │
│                                          │                     │
│                           4. Dùng credentials truy cập S3     │
│                                          │                     │
│                                          ▼                     │
│                           ┌─────────────────────────────────┐ │
│                           │         S3 Bucket               │ │
│                           └─────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Ví dụ thực tế: Jenkins CI/CD

**Scenario:** Công ty có Jenkins server on-premises, cần deploy code lên AWS.

```
Trước đây (Access Key):
────────────────────────
1. Tạo IAM User "jenkins-deploy"
2. Tạo Access Key
3. Lưu Access Key vào Jenkins server
4. Jenkins dùng key để deploy lên AWS
   → Lộ key = hacker deploy malware lên production! 😱

Bây giờ (Roles Anywhere):
─────────────────────────
1. Công ty có Private CA (Certificate Authority)
2. Cấp certificate cho Jenkins server
3. Đăng ký CA với AWS (Trust Anchor)
4. Jenkins dùng certificate xin temporary credentials
5. Deploy lên AWS với credentials tạm thời
   → Credentials hết hạn sau 1 giờ
   → Lộ cũng chỉ dùng được 1 giờ
   → Có thể revoke certificate ngay lập tức
```

### Các khái niệm chính

| Khái niệm | Giải thích | Ví dụ |
|-----------|------------|-------|
| **Certificate Authority (CA)** | Nơi cấp certificates | AWS Private CA, hoặc CA công ty tự dựng |
| **Trust Anchor** | Đăng ký CA với AWS để AWS tin tưởng | "AWS ơi, certificates từ CA này là hợp lệ nhé" |
| **Certificate** | Chứng chỉ số của server | Giống CMND của server |
| **Profile** | Config chọn role nào sẽ assume | "Certificate này được assume role XYZ" |

### Khi nào dùng IAM Roles Anywhere?

| Dùng Roles Anywhere | KHÔNG cần Roles Anywhere |
|---------------------|--------------------------|
| Server on-premises | EC2, Lambda (đã có Instance/Execution Role) |
| Server ở Azure, GCP | ECS, EKS (đã có Task/Pod Role) |
| CI/CD on-premises (Jenkins, GitLab) | GitHub Actions (có OIDC Federation) |
| Edge devices, IoT | Bất kỳ workload chạy trong AWS |

### So sánh các cách authenticate từ bên ngoài AWS

```
┌─────────────────┬──────────────────┬────────────────────┐
│    Access Key   │  Roles Anywhere  │  OIDC Federation   │
├─────────────────┼──────────────────┼────────────────────┤
│ Long-term       │ Temporary        │ Temporary          │
│ Text-based      │ Certificate      │ Token-based        │
│ Khó rotate      │ Tự động rotate   │ Tự động rotate     │
│ Cho mọi trường  │ Cho on-premises  │ Cho GitHub Actions,│
│ hợp             │ servers          │ GitLab CI, etc.    │
├─────────────────┼──────────────────┼────────────────────┤
│ ❌ Không nên    │ ✅ Recommended   │ ✅ Recommended     │
└─────────────────┴──────────────────┴────────────────────┘
```

### Yêu cầu Certificate

| Yêu cầu | Giá trị |
|---------|---------|
| **Version** | X.509v3 |
| **Basic Constraints** | CA: false |
| **Key Usage** | Digital Signature |
| **Signing Algorithm** | SHA256 hoặc mạnh hơn |

### Setup cơ bản

```bash
# 1. Tạo Trust Anchor (đăng ký CA với AWS)
aws rolesanywhere create-trust-anchor \
  --name "my-company-ca" \
  --source "sourceType=AWS_ACM_PCA,sourceData={acmPcaArn=arn:aws:acm-pca:...}"

# 2. Tạo IAM Role với trust policy cho Roles Anywhere
```

**Trust Policy cho Role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "rolesanywhere.amazonaws.com"
      },
      "Action": [
        "sts:AssumeRole",
        "sts:SetSourceIdentity",
        "sts:TagSession"
      ],
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:rolesanywhere:region:account:trust-anchor/anchor-id"
        }
      }
    }
  ]
}
```

```bash
# 3. Tạo Profile (liên kết Trust Anchor với Role)
aws rolesanywhere create-profile \
  --name "jenkins-profile" \
  --role-arns "arn:aws:iam::123456789012:role/JenkinsDeployRole"

# 4. Trên Jenkins server, dùng credential helper để lấy credentials
./aws_signing_helper credential-process \
  --certificate /path/to/jenkins-cert.pem \
  --private-key /path/to/jenkins-key.pem \
  --trust-anchor-arn arn:aws:rolesanywhere:... \
  --profile-arn arn:aws:rolesanywhere:... \
  --role-arn arn:aws:iam::123456789012:role/JenkinsDeployRole
```

> **Nguồn:** [What is IAM Roles Anywhere?](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html)

---

## Session Policies

### Session Policy là gì?

**Vấn đề:** Role có nhiều quyền, nhưng bạn chỉ muốn dùng **một phần nhỏ** trong một session cụ thể.

```
Role "DevOpsRole" có quyền:
├── s3:*        (full S3)
├── ec2:*       (full EC2)  
├── lambda:*    (full Lambda)
└── dynamodb:*  (full DynamoDB)

Nhưng task hôm nay chỉ cần đọc S3 thôi!
→ Dùng Session Policy để giới hạn
```

### Cách hoạt động

**Session Policy** là policy được pass khi assume role để **giới hạn thêm** permissions.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Role Permissions          Session Policy         Kết quả      │
│   (Role có gì)              (Giới hạn thêm)        (Được gì)    │
│                                                                 │
│   ┌─────────────┐          ┌─────────────┐       ┌─────────────┐│
│   │ s3:*        │          │ s3:GetObject│       │ s3:GetObject││
│   │ ec2:*       │    ∩     │ s3:ListBucket│  =   │ s3:ListBucket│
│   │ lambda:*    │          │             │       │             ││
│   │ dynamodb:*  │          │             │       │             ││
│   └─────────────┘          └─────────────┘       └─────────────┘│
│                                                                 │
│   (Rất nhiều quyền)        (Chỉ cho S3 read)     (Chỉ S3 read) │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

→ Session Policy lấy GIAO (intersection) với Role permissions
→ Kết quả luôn ≤ Role permissions (không thể thêm quyền mới)
```

### Ví dụ cụ thể

**Scenario:** Bạn có script cần đọc file từ S3, nhưng role có full access.

```bash
# Assume role VỚI session policy giới hạn
aws sts assume-role \
  --role-arn "arn:aws:iam::123456789012:role/DevOpsRole" \
  --role-session-name "read-only-session" \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]
    }]
  }'
```

**Kết quả:**

```
Credentials nhận được CHỈ có quyền:
├── s3:GetObject trên my-bucket
└── s3:ListBucket trên my-bucket

KHÔNG có (dù role có):
├── s3:DeleteObject  (bị giới hạn bởi session policy)
├── ec2:*            (bị loại bỏ)
├── lambda:*         (bị loại bỏ)
└── dynamodb:*       (bị loại bỏ)
```

### Điểm quan trọng

```
⚠️ Session Policy CHỈ có thể GIẢM quyền, KHÔNG THỂ THÊM quyền

Ví dụ:
Role có: s3:GetObject, s3:PutObject
Session Policy yêu cầu: s3:GetObject, s3:DeleteObject
                                           ↑
                                     Role không có!

Kết quả: Chỉ có s3:GetObject (giao của 2 tập hợp)
         KHÔNG có s3:DeleteObject (vì role không có sẵn)
```

### Tại sao cần Session Policy?

| Lý do | Giải thích |
|-------|------------|
| **Least privilege** | Chỉ lấy đúng quyền cần dùng cho task cụ thể |
| **Giảm blast radius** | Nếu credentials bị lộ, hacker chỉ có quyền hạn chế |
| **Scoped tokens** | Tạo tokens khác nhau cho các tasks khác nhau từ cùng 1 role |
| **Temporary restrictions** | Giới hạn tạm thời mà không cần sửa role |

### So sánh: Có vs Không có Session Policy

```
Không dùng Session Policy:          Dùng Session Policy:
──────────────────────────          ─────────────────────
aws sts assume-role \               aws sts assume-role \
  --role-arn "...DevOpsRole"          --role-arn "...DevOpsRole" \
                                      --policy '{...chỉ S3 read...}'
         │                                     │
         ▼                                     ▼
   Full permissions                    Restricted permissions
   s3:*, ec2:*, lambda:*               s3:GetObject only
         │                                     │
         ▼                                     ▼
   Lộ credentials = mất hết           Lộ credentials = chỉ đọc được S3
```

---

## Best Practices

### 1. Luôn dùng Role thay vì Access Keys khi có thể

```
❌ Lưu Access Keys trong EC2, Lambda, ECS
✅ Attach Role vào compute resources
```

### 2. Principle of Least Privilege

```
❌ Trust: "AWS": "*"  (Cho phép bất kỳ ai)
✅ Trust: "AWS": "arn:aws:iam::SPECIFIC-ACCOUNT:role/SPECIFIC-ROLE"
```

### 3. Dùng Conditions trong Trust Policy

```json
{
  "Condition": {
    "Bool": {"aws:MultiFactorAuthPresent": "true"},
    "IpAddress": {"aws:SourceIp": "203.0.113.0/24"},
    "StringEquals": {"sts:ExternalId": "your-external-id"}
  }
}
```

### 4. Set Maximum Session Duration phù hợp

| Tác vụ | Recommended Duration |
|--------|---------------------|
| Interactive console | 1-4 giờ |
| Automated pipelines | 1-2 giờ |
| Long-running jobs | 6-12 giờ |

### 5. Monitor với CloudTrail

Theo dõi các events:
- `AssumeRole`
- `AssumeRoleWithSAML`
- `AssumeRoleWithWebIdentity`

### 6. Dùng External ID cho third-party access

```
Luôn yêu cầu third-party cung cấp External ID duy nhất
→ Ngăn chặn Confused Deputy attacks
```

### 7. Review IAM Access Analyzer

```
Định kỳ kiểm tra:
- Roles được access từ external entities
- Unused permissions
- Over-permissive trust policies
```

---

## Quick Reference

### Assume Role với AWS CLI

```bash
# Assume role
aws sts assume-role \
  --role-arn "arn:aws:iam::123456789012:role/MyRole" \
  --role-session-name "my-session"

# Dùng credentials
export AWS_ACCESS_KEY_ID=ASIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...
```

### AWS CLI Profile với Role

```ini
# ~/.aws/config
[profile prod-admin]
role_arn = arn:aws:iam::PROD-ACCOUNT:role/AdminRole
source_profile = default
mfa_serial = arn:aws:iam::MY-ACCOUNT:mfa/myuser
duration_seconds = 3600

# Sử dụng:
aws s3 ls --profile prod-admin
```

### Kiểm tra Role hiện tại

```bash
aws sts get-caller-identity
# {
#   "UserId": "AROA...:my-session",
#   "Account": "123456789012",
#   "Arn": "arn:aws:sts::123456789012:assumed-role/MyRole/my-session"
# }
```

---

## Tài liệu tham khảo

- [IAM Roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)
- [The confused deputy problem](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html)
- [IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html)
- [Common scenarios for roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios.html)
- [How to use trust policies with IAM roles](https://aws.amazon.com/blogs/security/how-to-use-trust-policies-with-iam-roles/)
