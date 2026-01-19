# AWS IAM (Identity and Access Management)

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

## 1. Root User

**Root User** là tài khoản được tạo khi đăng ký AWS account.

| Đặc điểm | Mô tả |
|----------|-------|
| **Quyền** | **Full access** - làm được mọi thứ |
| **Đăng nhập** | Email + Password |
| **Không thể restrict** | Không thể giới hạn quyền của root |

### ⚠️ Best Practices cho Root User

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

### Trust Policy vs Permissions Policy

Mỗi Role có **2 loại policy**:

| Policy | Mô tả |
|--------|-------|
| **Trust Policy** | **Ai** được phép assume role này |
| **Permissions Policy** | **Làm gì** được khi assume role |

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
