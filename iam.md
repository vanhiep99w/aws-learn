# AWS IAM (Identity and Access Management)


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các thành phần chính](#các-thành-phần-chính)
- [ARN (Amazon Resource Name)](#arn-amazon-resource-name)
- [1. Root User](#1-root-user)
- [2. IAM Users](#2-iam-users)
- [3. IAM Groups](#3-iam-groups)
- [4. IAM Roles](#4-iam-roles)
- [5. IAM Policies](#5-iam-policies)
- [Policy Evaluation Logic](#policy-evaluation-logic)
- [Best Practices](#best-practices)
- [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
- [IAM Security Tools](#iam-security-tools)
- [Ví dụ thực tế](#ví-dụ-thực-tế)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**IAM** là dịch vụ **miễn phí** của AWS để quản lý:
- **Ai** (Who) có thể truy cập AWS resources
- **Làm gì** (What) với những resources đó

```
IAM trả lời câu hỏi:

WHO (Authentication)     +     WHAT (Authorization)
    │                              │
    ▼                              ▼
"Bạn là ai?"              "Bạn được phép làm gì?"
```

**Đặc điểm quan trọng**:
- ✅ **Global service** - không thuộc region cụ thể
- ✅ **Miễn phí** - không tính phí sử dụng IAM
- ✅ **Eventual consistency** - thay đổi có thể mất vài giây để apply globally

---

## Các thành phần chính

```
                         AWS Account
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
         Root User        IAM Users      IAM Roles
              │               │               │
              │               ▼               │
              │          IAM Groups           │
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                        IAM Policies
                              │
                              ▼
                       AWS Resources
                    (EC2, S3, RDS...)
```

---

## ARN (Amazon Resource Name)

**ARN** là định danh duy nhất để xác định **bất kỳ resource nào** trong AWS. ARN được dùng rất nhiều trong IAM Policies.

### Format của ARN

```
arn:partition:service:region:account-id:resource-type/resource-id
```

| Phần | Ý nghĩa | Ví dụ |
|------|---------|-------|
| `arn` | Cố định | `arn` |
| `partition` | AWS partition | `aws`, `aws-cn` (China), `aws-us-gov` |
| `service` | Tên service | `s3`, `ec2`, `lambda`, `iam` |
| `region` | Region (có thể trống) | `us-east-1`, `ap-southeast-1` |
| `account-id` | AWS Account ID | `123456789012` |
| `resource` | Resource type và ID | `bucket/my-bucket`, `role/MyRole` |

### Ví dụ ARN

```bash
# S3 Bucket (global → không có region, account)
arn:aws:s3:::my-bucket
arn:aws:s3:::my-bucket/folder/file.txt

# IAM Role (global → không có region)
arn:aws:iam::123456789012:role/MyRole

# EC2 Instance (regional → có đầy đủ)
arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0

# Lambda Function
arn:aws:lambda:ap-southeast-1:123456789012:function:my-function

# RDS Database
arn:aws:rds:us-east-1:123456789012:db:my-database
```

### Tại sao có `:::` vs `:` ?

Một số trường có thể **BỎ TRỐNG** → tạo ra nhiều dấu `:` liền nhau:

```
S3 Bucket:
arn:aws:s3:::my-bucket
         │ │││
         │ ││└─ resource (my-bucket)
         │ │└── account-id (TRỐNG - S3 bucket name globally unique)
         │ └─── region (TRỐNG - S3 là global)
         └──── service (s3)

IAM Role:
arn:aws:iam::123456789012:role/MyRole
          │ │            │
          │ │            └─ resource
          │ └────────────── account-id (có)
          └──────────────── region (TRỐNG - IAM là global)

EC2 Instance:
arn:aws:ec2:us-east-1:123456789012:instance/i-123
          │         │            │
          │         │            └─ resource
          │         └────────────── account-id (có)
          └──────────────────────── region (có - EC2 là regional)
```

### Quy tắc nhớ nhanh

```
┌─────────────────────────────────────────────────────────────────┐
│  GLOBAL SERVICES (không có region):                             │
│  ├── IAM        → arn:aws:iam::account:...                     │
│  ├── S3         → arn:aws:s3:::bucket-name                     │
│  ├── CloudFront → arn:aws:cloudfront::account:...              │
│  └── Route53    → arn:aws:route53:::...                        │
│                                                                   │
│  REGIONAL SERVICES (có đầy đủ region + account):                │
│  ├── EC2        → arn:aws:ec2:region:account:...               │
│  ├── Lambda     → arn:aws:lambda:region:account:...            │
│  ├── RDS        → arn:aws:rds:region:account:...               │
│  └── ECS        → arn:aws:ecs:region:account:...               │
└─────────────────────────────────────────────────────────────────┘
```

### ARN trong IAM Policies

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-bucket/*"   ← ARN xác định bucket
}
```

---

## 1. Root User

**Root User** là tài khoản được tạo khi đăng ký AWS account.

| Đặc điểm | Mô tả |
|----------|-------|
| **Quyền** | **Full access** - làm được mọi thứ |
| **Đăng nhập** | Email + Password |
| **Không thể restrict** | Không thể giới hạn quyền của root |

### Best Practices cho Root User

```
❌ KHÔNG NÊN:
- Dùng root cho daily tasks
- Share root credentials
- Tạo access keys cho root

✅ NÊN:
- Enable MFA cho root
- Chỉ dùng root cho account-level tasks
- Tạo IAM admin user để dùng hàng ngày
```

**Khi nào BẮT BUỘC dùng Root?**
- Thay đổi account settings (name, email, password)
- Close AWS account
- Restore IAM user permissions
- Change/cancel AWS Support plan
- Register as seller in Reserved Instance Marketplace
- Enable MFA delete trên S3 bucket

---

## 2. IAM Users

**IAM User** đại diện cho **1 người hoặc 1 application** cần truy cập AWS.

### Đặc điểm

| Thuộc tính | Mô tả |
|------------|-------|
| **Username** | Unique trong account |
| **Credentials** | Password (console) và/hoặc Access Keys (CLI/API) |
| **Permissions** | Được gán qua policies (trực tiếp hoặc qua group) |
| **Mặc định** | **Không có quyền gì** khi mới tạo |

### Ví dụ tạo IAM User

```
Tạo user "developer-john":
├── Console access: ✅ (password)
├── Programmatic access: ✅ (access key)
├── Groups: developers, read-only-s3
└── Permissions: Inherited from groups
```

### Access Keys

Dùng để truy cập AWS qua **CLI, SDK, API** (không phải Console):

```
Access Key ID:     AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

⚠️ Secret chỉ hiển thị 1 lần khi tạo
⚠️ Không share, không commit vào code
```

**Best Practices**:
- Rotate access keys định kỳ (90 ngày)
- Không dùng access keys của root user
- 1 user có tối đa 2 access keys (để rotate)

---

## 3. IAM Groups

**IAM Group** là tập hợp các IAM Users để **quản lý permissions dễ hơn**.

```
                    IAM Groups
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌───────────┐   ┌──────────┐
    │  Admins │    │Developers │   │ Auditors │
    ├─────────┤    ├───────────┤   ├──────────┤
    │ Alice   │    │   John    │   │   Bob    │
    │ Bob     │    │   Jane    │   │   Eve    │
    └─────────┘    │   Mike    │   └──────────┘
                   └───────────┘
```

### Đặc điểm

| Thuộc tính | Mô tả |
|------------|-------|
| **Chứa gì** | Chỉ chứa IAM Users (không chứa group khác) |
| **1 user thuộc nhiều groups** | ✅ Được phép |
| **Group không có credentials** | Group không đăng nhập được |
| **Permissions** | Attach policies vào group → users thừa hưởng |

### Ví dụ

```
User "John" thuộc 2 groups:

Group: developers           Group: read-only-s3
├── Policy: EC2FullAccess   ├── Policy: S3ReadOnly
└── Policy: LambdaFullAccess

→ John có: EC2FullAccess + LambdaFullAccess + S3ReadOnly
```

---

## 4. IAM Roles

**IAM Role** là identity với **temporary credentials** để delegate access.

### Khác biệt User vs Role

| | IAM User | IAM Role |
|---|---|---|
| **Ai dùng** | 1 người/application cố định | Nhiều entities có thể assume |
| **Credentials** | Long-term (password, access keys) | **Temporary** (tự động rotate) |
| **Use case** | Employees, permanent apps | AWS services, cross-account, federated users |

### Khi nào dùng Role?

```
1. AWS Services cần access resources khác
   └── EC2 instance cần đọc S3 → attach role vào EC2

2. Cross-account access
   └── Account A cần access Account B → assume role ở B

3. Federated users (SSO)
   └── Users từ corporate directory → assume role

4. Temporary elevated permissions
   └── Developer cần admin access tạm thời → assume admin role
```

### Ví dụ: EC2 Instance Role

```
┌─────────────────────────────────────────┐
│              EC2 Instance               │
│  ┌───────────────────────────────────┐  │
│  │     Application needs S3 access  │  │
│  └───────────────────────────────────┘  │
│                   │                     │
│                   ▼                     │
│           Instance Profile              │
│           (attached role)               │
│                   │                     │
└───────────────────┼─────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   IAM Role    │
            │ S3ReadAccess  │
            └───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   S3 Bucket   │
            └───────────────┘

✅ Không cần hardcode credentials trong EC2
✅ Credentials tự động rotate
```

### Tại sao dùng Role thay vì User/Access Key?

```
❌ Cách sai: Lưu Access Key trong EC2
   → Lộ key = hacker truy cập mãi mãi
   → Phải tự rotate key thủ công

✅ Cách đúng: Gắn Role vào EC2  
   → Không cần lưu credentials trong code
   → Credentials tự động rotate mỗi vài giờ
   → An toàn hơn nhiều
```

### Các trường hợp phổ biến dùng Role

| Tình huống | Ví dụ | Tại sao dùng Role |
|------------|-------|-------------------|
| **AWS Service → Service** | EC2 đọc S3, Lambda ghi DynamoDB | Service không thể đăng nhập bằng password |
| **Cross-account access** | Account Dev truy cập Account Prod | An toàn hơn share credentials |
| **Quyền cao tạm thời** | Developer cần Admin để deploy | Quyền tự hết hạn sau 1-12 giờ |
| **Federated users (SSO)** | Nhân viên đăng nhập bằng Google/Okta | Không cần tạo IAM User cho từng người |

### Trust Policy vs Permissions Policy

Mỗi Role có **2 loại policy**:

```
┌─────────────────────────────────────────────────────────┐
│                      IAM ROLE                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TRUST POLICY (Ai được mượn role?)                     │
│  ─────────────────────────────────                      │
│  "Cho phép EC2 service assume role này"                │
│  "Cho phép Account B assume role này"                  │
│  "Cho phép User X assume role này"                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PERMISSIONS POLICY (Mượn role rồi được làm gì?)       │
│  ───────────────────────────────────────────────        │
│  "Được đọc S3 bucket ABC"                              │
│  "Được ghi DynamoDB table XYZ"                         │
│  "KHÔNG được xóa bất cứ thứ gì"                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| Policy | Trả lời câu hỏi | Ví dụ |
|--------|-----------------|-------|
| **Trust Policy** | "Ai được assume role này?" | EC2, Lambda, Account B |
| **Permissions Policy** | "Assume rồi được làm gì?" | s3:GetObject, dynamodb:PutItem |

```json
// Trust Policy: EC2 service được assume role này
{
  "Version": "2012-10-17",
  "Statement": {
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }
}
```

### User Assume Role như thế nào?

```
User "John" bình thường chỉ có quyền đọc.
Khi cần deploy, John assume role "DeployRole":

┌──────────┐         ┌─────────────────┐         ┌──────────────┐
│   John   │ ──────→ │  DeployRole     │ ──────→ │ Temporary    │
│  (User)  │ assume  │  Trust: John ✅ │         │ Credentials  │
└──────────┘         └─────────────────┘         │ (1-12 giờ)   │
                                                  └──────────────┘

# AWS CLI assume role
aws sts assume-role --role-arn arn:aws:iam::123456:role/DeployRole

# Trả về credentials tạm thời
{
  "AccessKeyId": "ASIA...",
  "SecretAccessKey": "...",
  "SessionToken": "...",
  "Expiration": "2024-01-15T10:00:00Z"  ← Hết hạn tự động
}
```

### So sánh: Gán Policy trực tiếp vs Assume Role

```
Gán Policy vào User:              Assume Role:
────────────────────              ────────────
User ←── Policy                   User ──→ Role ──→ Temp Credentials
     (quyền cố định)                   (quyền tạm thời)

• Quyền có mãi mãi                • Quyền hết hạn sau vài giờ
• Không log khi dùng quyền        • Log được ai assume lúc nào  
• Nguy hiểm nếu bị hack           • An toàn hơn
```

### Credentials hết hạn thì sao?

| | EC2/Lambda Role | User Assume Role |
|---|---|---|
| **Refresh** | **Tự động** (SDK lo) | **Thủ công** (phải gọi lại) |
| **Cơ chế** | SDK gọi Instance Metadata Service | User gọi `sts assume-role` |
| **Hết hạn** | Không bao giờ mất quyền | Phải assume lại |

**EC2 Role - Tự động refresh:**

```
┌─────────────────────────────────────────────────────────┐
│                     EC2 Instance                        │
│                                                         │
│  App gọi: s3.getObject("file.txt")                     │
│              │                                          │
│              ▼                                          │
│  AWS SDK tự động gọi Instance Metadata Service          │
│  (http://169.254.169.254/latest/meta-data/iam/...)     │
│              │                                          │
│              ▼                                          │
│  Nhận credentials mới (nếu cũ sắp hết hạn)             │
│              │                                          │
│              ▼                                          │
│  Gọi S3 với credentials mới ✅                         │
└─────────────────────────────────────────────────────────┘

→ App không cần code xử lý, SDK lo hết
```

**User Assume Role - Phải refresh thủ công:**

```
aws sts assume-role --role-arn ...  (lần 1)
         │
         ▼
Credentials có hạn 1-12 giờ
         │
         ▼
    ⏰ HẾT HẠN
         │
         ▼
aws sts assume-role --role-arn ...  (lần 2, phải gọi lại)
```

**Cách làm tự động hơn cho User:**

```ini
# ~/.aws/config - CLI tự động assume role
[profile deploy]
role_arn = arn:aws:iam::123456:role/DeployRole
source_profile = default

# Dùng:
aws s3 ls --profile deploy
# → CLI tự gọi assume-role khi cần
```

| Cách | Mô tả |
|------|-------|
| **AWS CLI profiles** | Config role_arn trong `~/.aws/config`, CLI tự assume |
| **SDK credential providers** | Code tự refresh khi gần hết hạn |
| **AWS SSO** | Đăng nhập 1 lần, tự động assume roles |

### Local vs EC2: Credentials khác nhau, code giống nhau

```
LOCAL (máy dev):                  EC2 (production):
────────────────                  ─────────────────
Cần Access Key                    Không cần, dùng Role
     │                                  │
     ▼                                  ▼
~/.aws/credentials                EC2 có Role gắn sẵn
[default]                         → SDK tự lấy credentials
aws_access_key_id=AKIA...         → Không cần config gì
aws_secret_access_key=...
```

**Code không cần thay đổi:**

```python
import boto3

s3 = boto3.client('s3')
s3.upload_file('file.txt', 'my-bucket', 'file.txt')

# Local: SDK dùng ~/.aws/credentials
# EC2:   SDK tự lấy từ Instance Metadata (Role)
# Lambda: SDK tự lấy từ Lambda Role
```

**Thứ tự AWS SDK tìm credentials (Credential Provider Chain):**

```
1. Environment variables
   └── AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

2. ~/.aws/credentials file
   └── [default] hoặc [profile-name]

3. ~/.aws/config file
   └── role_arn (assume role)

4. EC2 Instance Metadata ← chỉ có khi chạy trên EC2
   └── Role gắn vào EC2

5. ECS Task Role ← chỉ có khi chạy trong ECS

6. Lambda Execution Role ← chỉ có khi chạy trong Lambda
```

→ **Viết code 1 lần**, chạy được ở mọi nơi:
- Local: dùng Access Key
- EC2/ECS/Lambda: dùng Role (an toàn hơn)

---

## 5. IAM Policies

**Policy** là JSON document định nghĩa **permissions**.

### Cấu trúc Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Read",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "IpAddress": {"aws:SourceIp": "203.0.113.0/24"}
      }
    }
  ]
}
```

### Giải thích các thành phần

| Element | Mô tả | Ví dụ |
|---------|-------|-------|
| **Version** | Policy language version | `"2012-10-17"` (luôn dùng này) |
| **Statement** | Danh sách permissions | Array of objects |
| **Sid** | Statement ID (optional) | `"AllowS3Read"` |
| **Effect** | Allow hoặc Deny | `"Allow"` / `"Deny"` |
| **Action** | Các actions được phép/cấm | `"s3:GetObject"` |
| **Resource** | Resources áp dụng | ARN của resource |
| **Condition** | Điều kiện áp dụng (optional) | IP, time, MFA... |

### Loại Policies

| Loại | Mô tả | Khi nào dùng |
|------|-------|--------------|
| **AWS Managed** | AWS tạo sẵn, maintain | Bắt đầu nhanh, common use cases |
| **Customer Managed** | Bạn tự tạo | Cần custom permissions |
| **Inline** | Gắn trực tiếp vào user/role | 1-1 relationship, không reuse |

### Ví dụ AWS Managed Policies

```
AdministratorAccess      → Full access mọi thứ
PowerUserAccess          → Full access trừ IAM
ReadOnlyAccess           → Chỉ đọc tất cả services
AmazonS3FullAccess       → Full access S3
AmazonEC2ReadOnlyAccess  → Chỉ đọc EC2
```

---

## Policy Evaluation Logic

Khi có nhiều policies, AWS evaluate theo thứ tự:

```
                    Request đến
                         │
                         ▼
              ┌─────────────────────┐
              │  Explicit DENY?     │──── Yes ──→ ❌ DENIED
              └─────────────────────┘
                         │ No
                         ▼
              ┌─────────────────────┐
              │  Explicit ALLOW?    │──── No ───→ ❌ DENIED
              └─────────────────────┘              (implicit deny)
                         │ Yes
                         ▼
                    ✅ ALLOWED
```

**Nguyên tắc quan trọng**:
1. **Default: Deny** - Không có permission = denied
2. **Explicit Deny wins** - Deny luôn thắng Allow
3. **Allow phải explicit** - Phải có Allow statement

---

## Best Practices

### 1. Least Privilege Principle
```
Chỉ cấp ĐÚNG quyền cần thiết, KHÔNG hơn

❌ "Admin cho nhanh"
✅ "Chỉ S3 read cho bucket cụ thể"
```

### 2. Sử dụng Groups
```
❌ Attach policy trực tiếp vào user
✅ Tạo group → attach policy vào group → add user vào group
```

### 3. Enable MFA

```
Đặc biệt quan trọng cho:
- Root user
- Admin users
- Users với sensitive permissions
```

---

## Multi-Factor Authentication (MFA)

**MFA** thêm một lớp bảo mật bằng cách yêu cầu **2 yếu tố** để đăng nhập:

```
┌─────────────────────────────────────────────────────────────────┐
│                Multi-Factor Authentication                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Factor 1: Something you KNOW                                   │
│   └── Password                                                   │
│                                                                  │
│   Factor 2: Something you HAVE                                   │
│   └── MFA device (phone app, hardware key...)                   │
│                                                                  │
│   Password + MFA Code = ✅ Access granted                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Các loại MFA Devices AWS hỗ trợ

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Virtual MFA** | App trên điện thoại | Google Authenticator, Authy, Microsoft Authenticator |
| **U2F Security Key** | Hardware key cắm USB | YubiKey, Feitian |
| **Hardware MFA** | Token device chuyên dụng | Gemalto (legacy), Thales |
| **TOTP Hardware** | Hardware tạo OTP | Token2, SafeNet |

### 1. Virtual MFA Device

Phổ biến nhất, sử dụng app trên smartphone.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Virtual MFA Setup                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Cài app: Google Authenticator / Authy                       │
│                                                                  │
│  2. IAM Console → User → Security credentials → Assign MFA      │
│                                                                  │
│  3. Scan QR code bằng app                                       │
│     ┌──────────────┐                                            │
│     │   [QR CODE]  │  ← Scan với app                           │
│     │              │                                             │
│     └──────────────┘                                            │
│                                                                  │
│  4. Nhập 2 consecutive MFA codes                                │
│     Code 1: 123456                                               │
│     (Đợi code đổi)                                               │
│     Code 2: 789012                                               │
│                                                                  │
│  5. Done! ✅                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Ưu điểm:**
- ✅ Miễn phí
- ✅ Dễ setup
- ✅ Có thể backup (Authy)

**Nhược điểm:**
- ❌ Mất điện thoại = mất MFA
- ❌ Bị phishing (nhập code vào trang giả)

### 2. U2F Security Key (FIDO U2F)

**Universal 2nd Factor (U2F)** là chuẩn xác thực mở sử dụng hardware key.

```
┌─────────────────────────────────────────────────────────────────┐
│                    U2F Security Key                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌──────────────────┐                         │
│                    │   ┌──────────┐   │                         │
│                    │   │ YubiKey  │   │ ← Hardware key          │
│                    │   │    🔑    │   │                         │
│                    │   └──────────┘   │                         │
│                    │       USB        │                         │
│                    └────────┬─────────┘                         │
│                             │                                    │
│                             ▼                                    │
│                    Cắm vào USB port                              │
│                             │                                    │
│                             ▼                                    │
│                    Chạm key khi được yêu cầu                    │
│                             │                                    │
│                             ▼                                    │
│                    ✅ Authenticated                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cách hoạt động:**

```
Browser                     U2F Key                      AWS
   │                           │                           │
   │  1. Login (user+pass)     │                           │
   │───────────────────────────────────────────────────────►│
   │                           │                           │
   │  2. Challenge (random data + origin)                  │
   │◄───────────────────────────────────────────────────────│
   │                           │                           │
   │  3. Gửi challenge ────────►                           │
   │  (User chạm key)          │                           │
   │                           │                           │
   │  4. Signature (private key)                           │
   │◄───────────────────────────                           │
   │                           │                           │
   │  5. Gửi signature ────────────────────────────────────►│
   │                           │                           │
   │  6. Verify ✅             │                           │
   │◄───────────────────────────────────────────────────────│
```

**Ưu điểm:**
- ✅ **Phishing-resistant** - Không thể bị lừa nhập vào trang giả
- ✅ **Không cần nhập code** - Chỉ cần chạm key
- ✅ **Dùng cho nhiều accounts** - 1 key cho nhiều services
- ✅ **Không cần pin/điện thoại** - Có key là đủ

**Nhược điểm:**
- ❌ Tốn tiền (~$25-50)
- ❌ Mất key = không login được (nên có backup key)

**Các U2F Keys phổ biến:**

| Key | Giá khoảng | Đặc điểm |
|-----|------------|----------|
| **YubiKey 5 NFC** | $45-55 | USB-A/C + NFC, nhiều protocols |
| **YubiKey Security Key** | $25 | Chỉ FIDO U2F/FIDO2, giá rẻ |
| **Feitian ePass** | $20-30 | USB-A, giá rẻ |
| **Google Titan Key** | $30-35 | USB-A + NFC, by Google |

### 3. Hardware MFA Device

Legacy hardware tokens, ít phổ biến hơn.

```
┌─────────────────────────────────────────────────────────────────┐
│                 Hardware MFA Token                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│               ┌──────────────────────┐                          │
│               │  ┌────────────────┐  │                          │
│               │  │   347829       │  │ ← Màn hình hiển thị code │
│               │  └────────────────┘  │                          │
│               │      [GEMALTO]       │                          │
│               └──────────────────────┘                          │
│                                                                  │
│   • Mỗi 30-60 giây đổi code mới                                 │
│   • Không cần điện thoại                                         │
│   • Tốn phí mua device                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### So sánh các loại MFA

| Tiêu chí | Virtual MFA | U2F Key | Hardware Token |
|----------|-------------|---------|----------------|
| **Chi phí** | Free | $25-50 | $15-30 |
| **Phishing resistant** | ❌ | ✅ | ❌ |
| **Cần điện thoại** | ✅ | ❌ | ❌ |
| **Dễ backup** | ✅ (Authy) | ❌ (cần mua 2 key) | ❌ |
| **Dễ sử dụng** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Bảo mật** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### MFA cho Root User - QUAN TRỌNG!

```
┌─────────────────────────────────────────────────────────────────┐
│                    ⚠️ ROOT USER MFA                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Root user có FULL ACCESS → BẮT BUỘC enable MFA                │
│                                                                  │
│   Best practice cho Root:                                        │
│   ├── 1. Enable MFA ngay sau khi tạo account                   │
│   ├── 2. Dùng U2F Security Key (phishing resistant)            │
│   ├── 3. Có BACKUP MFA device (2 keys hoặc virtual backup)     │
│   └── 4. Lưu backup codes an toàn                               │
│                                                                  │
│   AWS khuyến nghị: U2F Key > Hardware Token > Virtual MFA       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Require MFA trong IAM Policies

Bạn có thể yêu cầu MFA để thực hiện các actions quan trọng:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAllActionsWithMFA",
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    },
    {
      "Sid": "DenyAllWithoutMFA",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

### Exam Tips - MFA

> [!IMPORTANT]
> **Keywords để nhớ MFA:**
> - Virtual MFA = App điện thoại (Google Authenticator, Authy)
> - U2F Security Key = Hardware key (YubiKey) - **Phishing resistant**
> - Root user PHẢI enable MFA
> - U2F là lựa chọn bảo mật nhất

| Câu hỏi | Trả lời |
|---------|---------|
| MFA nào chống phishing tốt nhất? | **U2F Security Key** |
| MFA miễn phí? | **Virtual MFA** (app) |
| Root user nên dùng MFA nào? | **U2F Security Key** (AWS recommended) |
| U2F hoạt động thế nào? | Cắm USB + chạm key, **không cần nhập code** |

### 4. Rotate Credentials
```
- Access keys: 90 ngày
- Passwords: theo company policy
- Dùng IAM Credential Report để audit
```

### 5. Dùng Roles thay vì Access Keys
```
❌ Hardcode access keys trong EC2
✅ Attach IAM role vào EC2
```

### 6. Review Permissions Regularly
```
- IAM Access Analyzer
- IAM Credential Report
- Unused permissions → remove
```

---

## IAM Security Tools

| Tool | Mô tả |
|------|-------|
| **IAM Credential Report** | Account-level report về tất cả users và credentials |
| **IAM Access Analyzer** | Phát hiện resources shared với external entities |
| **IAM Policy Simulator** | Test policies trước khi apply |
| **IAM Access Advisor** | Xem services mà user đã access và last accessed time |

---

## Ví dụ thực tế

### Scenario: Setup team development

```
Cấu trúc:
├── Group: admins
│   ├── Policy: AdministratorAccess
│   └── Users: alice
│
├── Group: developers  
│   ├── Policy: PowerUserAccess (trừ IAM)
│   ├── Policy: IAMReadOnlyAccess
│   └── Users: john, jane, mike
│
├── Group: readonly
│   ├── Policy: ReadOnlyAccess
│   └── Users: auditor-bob
│
└── Role: ec2-s3-access
    ├── Trust: EC2 service
    └── Policy: S3ReadWrite cho bucket "app-data"
```

---

## Tài liệu tham khảo
- [IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Policy Evaluation Logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
