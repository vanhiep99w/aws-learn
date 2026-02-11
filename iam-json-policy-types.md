# IAM JSON Policy Types

## Mục lục

- [Tổng quan](#tổng-quan)
- [Các loại Policy trong IAM](#các-loại-policy-trong-iam)
- [1. Identity-based Policies](#1-identity-based-policies)
- [2. Resource-based Policies](#2-resource-based-policies)
- [3. Permissions Boundaries](#3-permissions-boundaries)
- [4. Organizations SCPs](#4-organizations-scps)
- [5. Access Control Lists (ACLs)](#5-access-control-lists-acls)
- [6. Session Policies](#6-session-policies)
- [So sánh các loại Policy](#so-sánh-các-loại-policy)
- [Policy Evaluation Flow](#policy-evaluation-flow)
- [Ví dụ JSON cho từng loại](#ví-dụ-json-cho-từng-loại)
- [Exam Tips](#exam-tips)

---

## Tổng quan

AWS IAM sử dụng **JSON documents** để định nghĩa permissions. Có **6 loại policy** khác nhau, mỗi loại phục vụ một mục đích riêng.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         IAM Policy Types Overview                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  1. Identity-based Policies  → Gắn vào Users, Groups, Roles       │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  2. Resource-based Policies  → Gắn vào Resources (S3, SQS...)     │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  3. Permissions Boundaries   → Giới hạn max permissions           │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  4. Organizations SCPs       → Giới hạn quyền cho Account/OU      │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  5. Access Control Lists     → Cross-account access (legacy)       │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  6. Session Policies         → Giới hạn quyền của session tạm      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Các loại Policy trong IAM

### 1. Identity-based Policies

Policy **gắn vào IAM identities** (Users, Groups, Roles). Đây là loại policy phổ biến nhất.

#### Có 3 sub-types:

| Sub-type | Mô tả | Quản lý bởi |
|----------|--------|-------------|
| **AWS Managed** | AWS tạo sẵn, update tự động | AWS |
| **Customer Managed** | Bạn tự tạo, tự quản lý | Bạn |
| **Inline** | Gắn trực tiếp 1-1 vào entity | Bạn |

#### Ví dụ: AWS Managed Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3FullAccess",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    }
  ]
}
```

#### Ví dụ: Customer Managed Policy (chỉ cho phép update DynamoDB)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDynamoDBUpdate",
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:ap-southeast-1:123456789012:table/MyTable"
    }
  ]
}
```

#### Ví dụ: Inline Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSpecificEC2Instance",
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances"
      ],
      "Resource": "arn:aws:ec2:us-east-1:123456789012:instance/i-0abc123def456789"
    }
  ]
}
```

```
So sánh 3 sub-types:

AWS Managed:                Customer Managed:           Inline:
───────────                 ────────────────            ──────
• AWS tạo, AWS update       • Bạn tạo, bạn update      • Gắn trực tiếp vào 1 entity
• Reuse cho nhiều entities  • Reuse cho nhiều entities  • KHÔNG reuse
• Không chỉnh sửa được     • Chỉnh sửa thoải mái      • Xóa entity = xóa policy
• Tiện, nhanh               • Linh hoạt                 • Strict 1-1 relationship

Khi nào dùng?
• AWS Managed  → Common use cases (S3Full, EC2ReadOnly...)
• Customer Managed → Custom permissions cho tổ chức
• Inline → Policy ĐẶC BIỆT, chỉ áp dụng cho 1 entity duy nhất
```

---

### 2. Resource-based Policies

Policy **gắn trực tiếp vào AWS resources** (không gắn vào identity). Có **`Principal`** field để chỉ định ai được access.

#### Services hỗ trợ Resource-based Policies:

| Service | Tên Policy | Ví dụ use case |
|---------|-----------|----------------|
| **S3** | Bucket Policy | Public read, cross-account access |
| **SQS** | Queue Policy | Cho phép SNS gửi message vào queue |
| **SNS** | Topic Policy | Cho phép services khác publish |
| **Lambda** | Function Policy | Cho phép API Gateway invoke |
| **KMS** | Key Policy | Quản lý ai dùng được encryption key |
| **ECR** | Repository Policy | Cross-account image pull |
| **Secrets Manager** | Resource Policy | Cross-account secret access |

#### Ví dụ: S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCrossAccountAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111122223333:root"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-shared-bucket/*"
    }
  ]
}
```

#### Ví dụ: SQS Queue Policy (cho phép SNS gửi message)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSNSToSendMessage",
      "Effect": "Allow",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:ap-southeast-1:123456789012:MyQueue",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:sns:ap-southeast-1:123456789012:MyTopic"
        }
      }
    }
  ]
}
```

```
Identity-based vs Resource-based:

Identity-based Policy:           Resource-based Policy:
──────────────────────           ──────────────────────
Gắn vào USER/ROLE                Gắn vào RESOURCE
KHÔNG có "Principal"             CÓ "Principal" (ai được access)
"User A được làm gì?"           "Resource X cho phép ai?"

    ┌──────────┐                     ┌──────────┐
    │  User A  │──── Policy          │  S3 Bucket│──── Bucket Policy
    └──────────┘  "Được đọc S3"      └──────────┘  "Account B được đọc"
```

> [!IMPORTANT]
> **Cross-account access**: Resource-based policies cho phép **không cần assume role**. User Account B có thể truy cập trực tiếp S3 của Account A nếu Bucket Policy cho phép.

---

### 3. Permissions Boundaries

**Giới hạn maximum permissions** mà một IAM User hoặc Role có thể có. Permissions Boundary **không cấp quyền**, chỉ **giới hạn**.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Permissions Boundary                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Identity Policy cho phép:     Permissions Boundary cho phép:               │
│   ┌───────────────────────┐     ┌───────────────────────┐                   │
│   │  S3:*                 │     │  S3:GetObject          │                   │
│   │  EC2:*                │     │  S3:ListBucket         │                   │
│   │  DynamoDB:*           │     │  EC2:Describe*         │                   │
│   └───────────────────────┘     └───────────────────────┘                   │
│                                                                              │
│   Effective permissions = INTERSECTION (phần giao)                           │
│   ┌───────────────────────┐                                                  │
│   │  S3:GetObject      ✅ │  ← Có trong CẢ HAI                              │
│   │  S3:ListBucket     ✅ │  ← Có trong CẢ HAI                              │
│   │  EC2:Describe*     ✅ │  ← Có trong CẢ HAI                              │
│   │  S3:PutObject      ❌ │  ← Boundary KHÔNG cho phép                      │
│   │  EC2:RunInstances  ❌ │  ← Boundary KHÔNG cho phép                      │
│   │  DynamoDB:*        ❌ │  ← Boundary KHÔNG cho phép                      │
│   └───────────────────────┘                                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Ví dụ: Permissions Boundary

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowOnlyS3AndEC2Read",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutObject",
        "ec2:Describe*",
        "cloudwatch:Get*",
        "cloudwatch:List*"
      ],
      "Resource": "*"
    }
  ]
}
```

**Use case phổ biến**: Cho phép developer tự tạo IAM roles nhưng **giới hạn** quyền tối đa của role đó:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCreateRoleWithBoundary",
      "Effect": "Allow",
      "Action": "iam:CreateRole",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "iam:PermissionsBoundary": "arn:aws:iam::123456789012:policy/DevBoundary"
        }
      }
    }
  ]
}
```

---

### 4. Organizations SCPs

**Service Control Policies (SCPs)** giới hạn quyền cho **toàn bộ Account hoặc OU** (Organizational Unit).

> [!NOTE]
> SCPs **không cấp quyền**. SCPs chỉ **giới hạn** quyền tối đa. IAM policies trong account vẫn cần Allow riêng.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyLeaveOrganization",
      "Effect": "Deny",
      "Action": "organizations:LeaveOrganization",
      "Resource": "*"
    },
    {
      "Sid": "DenyDisableCloudTrail",
      "Effect": "Deny",
      "Action": [
        "cloudtrail:StopLogging",
        "cloudtrail:DeleteTrail"
      ],
      "Resource": "*"
    }
  ]
}
```

```
SCP vs IAM Policy:

SCP:                              IAM Policy:
────                              ──────────
Cấp độ: Account/OU               Cấp độ: User/Group/Role
Áp dụng: TẤT CẢ users trong     Áp dụng: Chỉ entity được gắn
          account (trừ root*)
Mục đích: Guardrails              Mục đích: Grant permissions

* Root user của Management Account KHÔNG bị SCP ảnh hưởng
```

Xem chi tiết tại [aws-organizations.md](./aws-organizations.md)

---

### 5. Access Control Lists (ACLs)

**ACLs** là policy **cross-account** ở cấp network/resource. Dùng phổ biến nhất với **S3** và **VPC**.

> [!WARNING]
> ACLs là **legacy mechanism**. AWS khuyến nghị dùng **Resource-based Policies** (Bucket Policy) thay thế ACLs cho hầu hết use cases.

| Service | ACL Type | Mô tả |
|---------|----------|-------|
| **S3** | Bucket ACL / Object ACL | Quản lý read/write ở cấp bucket hoặc object |
| **VPC** | Network ACL (NACL) | Stateless firewall ở cấp subnet |

#### S3 ACL (XML-based, không phải JSON)

```
S3 ACLs cho phép:
• READ – Đọc objects
• WRITE – Upload/delete objects
• READ_ACP – Đọc ACL
• WRITE_ACP – Sửa ACL
• FULL_CONTROL – Tất cả

⚠️ AWS khuyến nghị: TẮT ACLs (S3 Object Ownership = "Bucket owner enforced")
   → Dùng Bucket Policy thay thế
```

---

### 6. Session Policies

**Session Policies** giới hạn quyền của một **temporary session** khi assume role hoặc federated user.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Session Policies                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Khi assume role, bạn có thể truyền thêm Session Policy:                   │
│                                                                              │
│   Role's Permission Policy:    Session Policy:                               │
│   ┌───────────────────────┐    ┌───────────────────────┐                    │
│   │  S3:*                 │    │  S3:GetObject          │                    │
│   │  EC2:*                │    │  (chỉ bucket-A/*)      │                    │
│   └───────────────────────┘    └───────────────────────┘                    │
│                                                                              │
│   Effective = INTERSECTION                                                   │
│   → Chỉ được S3:GetObject trên bucket-A/*                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Ví dụ: Assume Role với Session Policy

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/MyRole \
  --role-session-name my-session \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::bucket-A/*"
      }
    ]
  }'
```

---

## So sánh các loại Policy

| Loại | Gắn vào | Có Principal? | Cấp quyền? | Giới hạn quyền? |
|------|---------|---------------|------------|-----------------|
| **Identity-based** | User/Group/Role | ❌ | ✅ | ❌ |
| **Resource-based** | Resource (S3, SQS...) | ✅ | ✅ | ❌ |
| **Permissions Boundary** | User/Role | ❌ | ❌ | ✅ |
| **SCP** | Account/OU | ❌ | ❌ | ✅ |
| **ACL** | Resource | N/A (legacy) | ✅ | ❌ |
| **Session Policy** | Session | ❌ | ❌ | ✅ |

```
Cấp quyền (Grant):              Giới hạn (Restrict):
─────────────────                ─────────────────────
• Identity-based                 • Permissions Boundary
• Resource-based                 • SCP
• ACL                            • Session Policy

Effective Permissions = Grant ∩ Restrict (phần giao)
```

---

## Policy Evaluation Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Complete Policy Evaluation Flow                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Request đến                                                                │
│       │                                                                      │
│       ▼                                                                      │
│   ┌─────────────────────────────┐                                           │
│   │ 1. Explicit DENY anywhere? │──── Yes ─→ ❌ DENIED                       │
│   │    (bất kỳ policy nào)     │                                            │
│   └─────────────────────────────┘                                           │
│       │ No                                                                   │
│       ▼                                                                      │
│   ┌─────────────────────────────┐                                           │
│   │ 2. SCP allows?             │──── No ──→ ❌ DENIED (implicit)            │
│   │    (nếu trong Org)          │                                            │
│   └─────────────────────────────┘                                           │
│       │ Yes                                                                  │
│       ▼                                                                      │
│   ┌─────────────────────────────┐                                           │
│   │ 3. Resource-based policy   │──── Yes ─→ ✅ ALLOWED                      │
│   │    allows? (nếu có)        │    (resource-based policy đủ)              │
│   └─────────────────────────────┘                                           │
│       │ No / N/A                                                             │
│       ▼                                                                      │
│   ┌─────────────────────────────┐                                           │
│   │ 4. Identity-based policy   │──── No ──→ ❌ DENIED (implicit)            │
│   │    allows?                  │                                            │
│   └─────────────────────────────┘                                           │
│       │ Yes                                                                  │
│       ▼                                                                      │
│   ┌─────────────────────────────┐                                           │
│   │ 5. Permissions Boundary    │──── No ──→ ❌ DENIED (implicit)            │
│   │    allows? (nếu có)        │                                            │
│   └─────────────────────────────┘                                           │
│       │ Yes                                                                  │
│       ▼                                                                      │
│   ┌─────────────────────────────┐                                           │
│   │ 6. Session policy allows?  │──── No ──→ ❌ DENIED (implicit)            │
│   │    (nếu có)                 │                                            │
│   └─────────────────────────────┘                                           │
│       │ Yes                                                                  │
│       ▼                                                                      │
│   ✅ ALLOWED                                                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Ví dụ JSON cho từng loại

### Identity-based: Cho phép Developer update EC2 tags

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEC2TagUpdates",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:DescribeTags",
        "ec2:DescribeInstances"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Environment": "dev"
        }
      }
    }
  ]
}
```

### Resource-based: Lambda cho phép API Gateway invoke

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAPIGatewayInvoke",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:ap-southeast-1:123456789012:function:MyFunction",
      "Condition": {
        "ArnLike": {
          "AWS:SourceArn": "arn:aws:execute-api:ap-southeast-1:123456789012:api-id/*/GET/resource"
        }
      }
    }
  ]
}
```

### Deny Policy: Chặn không cho xóa CloudTrail logs

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyCloudTrailDeletion",
      "Effect": "Deny",
      "Action": [
        "cloudtrail:DeleteTrail",
        "cloudtrail:StopLogging",
        "cloudtrail:UpdateTrail"
      ],
      "Resource": "arn:aws:cloudtrail:*:123456789012:trail/CompanyAuditTrail"
    }
  ]
}
```

### Condition-based: Chỉ cho phép từ IP cụ thể và yêu cầu MFA

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowWithMFAAndIP",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::production-bucket/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "203.0.113.0/24"
        },
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}
```

---

## Exam Tips

> [!IMPORTANT]
> **Keywords để nhớ IAM Policy Types:**
> - **Identity-based** = Gắn vào User/Group/Role, **KHÔNG** có Principal
> - **Resource-based** = Gắn vào resource, **CÓ** Principal
> - **Permissions Boundary** = Giới hạn max quyền, dùng cho **delegation** an toàn
> - **SCP** = Guardrails cho cả Account/OU, **KHÔNG** cấp quyền
> - **Explicit Deny LUÔN THẮNG** - bất kể policy nào

| Câu hỏi | Trả lời |
|---------|---------|
| Cross-account access không cần assume role? | **Resource-based Policy** |
| Giới hạn max quyền cho developer tự tạo roles? | **Permissions Boundary** |
| Guardrails cho toàn bộ accounts trong Organization? | **SCP** |
| Policy có `Principal` field? | **Resource-based Policy** (hoặc Trust Policy) |
| Policy loại nào KHÔNG cấp quyền? | **Permissions Boundary**, **SCP**, **Session Policy** |
| Effective permissions khi có nhiều loại policy? | **INTERSECTION** (phần giao) của tất cả policies |

---

## Tài liệu tham khảo

- [IAM Policy Types](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)
- [Policy Evaluation Logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [Permissions Boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)
- [Resource-based Policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html)

Xem thêm: [IAM](./iam.md) | [IAM Roles](./iam-roles.md) | [AWS Organizations](./aws-organizations.md)
