# AWS Security Token Service (STS)

## Mục lục

- [Tổng quan](#tổng-quan)
- [STS giải quyết vấn đề gì](#sts-giải-quyết-vấn-đề-gì)
- [Temporary credentials gồm những gì](#temporary-credentials-gồm-những-gì)
- [STS hoạt động như thế nào](#sts-hoạt-động-như-thế-nào)
- [Các API STS quan trọng](#các-api-sts-quan-trọng)
- [AssumeRole chi tiết](#assumerole-chi-tiết)
- [AssumeRoleWithWebIdentity và Cognito](#assumerolewithwebidentity-và-cognito)
- [AssumeRoleWithSAML](#assumerolewithsaml)
- [GetSessionToken và GetFederationToken](#getsessiontoken-và-getfederationtoken)
- [Session Policies](#session-policies)
- [Session Tags và ABAC](#session-tags-và-abac)
- [Duration và Expiration](#duration-và-expiration)
- [Regional vs Global Endpoint](#regional-vs-global-endpoint)
- [Common Architectures](#common-architectures)
- [Security Best Practices](#security-best-practices)
- [Exam Tips](#exam-tips)
- [Quick Reference](#quick-reference)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Security Token Service (AWS STS)** là dịch vụ tạo **temporary security credentials** để truy cập AWS resources.

Nói ngắn gọn:

```
Long-term credentials:
  IAM user access key / secret key
  └── Sống lâu, rủi ro cao nếu bị lộ

Temporary credentials:
  AccessKeyId + SecretAccessKey + SessionToken + Expiration
  └── Sống ngắn, tự hết hạn, gắn với role/session cụ thể
```

AWS STS thường xuất hiện khi bạn dùng:

- **IAM Role**
- **Cross-account access**
- **AWS service role** như EC2, Lambda, ECS task role
- **Federation** với SAML/OIDC
- **Amazon Cognito Identity Pool**
- **AWS IAM Identity Center**
- **GitHub Actions OIDC vào AWS**

```
┌─────────────────────────────────────────────────────────────────────┐
│                             AWS STS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Input:                                                             │
│  - IAM principal, SAML assertion, OIDC JWT, hoặc web identity token  │
│                                                                     │
│  Output:                                                            │
│  - Temporary AWS credentials                                        │
│  - Có expiration                                                    │
│  - Bị giới hạn bởi IAM role policy + session policy                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> Nguồn: [Temporary security credentials in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)

---

## STS giải quyết vấn đề gì

### Vấn đề với long-term credentials

Nếu bạn hardcode access key trong app:

```
app.js
├── AWS_ACCESS_KEY_ID=AKIA...
└── AWS_SECRET_ACCESS_KEY=...
```

Rủi ro:

- Key có thể bị commit lên GitHub.
- Key có thể nằm trong server, container image, log, hoặc máy developer.
- Nếu bị lộ, attacker dùng được đến khi bạn rotate hoặc disable.
- Khó cấp quyền tạm thời cho user ngoài AWS account.

### STS dùng temporary credentials

STS tạo credentials **khi cần**, có thời hạn, và gắn với session cụ thể.

```
User/App/Service
    │
    │ request temporary credentials
    ▼
AWS STS
    │
    │ returns credentials with expiration
    ▼
Use AWS APIs
```

AWS nêu các lợi ích chính của temporary credentials:

- Không cần phân phối hoặc nhúng long-term credentials trong application.
- Có thể cấp quyền cho users không có AWS identity riêng.
- Credentials có lifetime giới hạn, hết hạn thì không thể tái sử dụng.

> Nguồn: [Temporary security credentials in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)

---

## Temporary credentials gồm những gì

Temporary credentials từ STS thường gồm:

| Thành phần | Ý nghĩa |
|-----------|---------|
| `AccessKeyId` | Access key ID tạm thời |
| `SecretAccessKey` | Secret key tạm thời |
| `SessionToken` | Token bắt buộc đi kèm request |
| `Expiration` | Thời điểm credentials hết hạn |

Ví dụ response rút gọn:

```xml
<Credentials>
  <AccessKeyId>ASIA...</AccessKeyId>
  <SecretAccessKey>...</SecretAccessKey>
  <SessionToken>...</SessionToken>
  <Expiration>2026-04-16T10:30:00Z</Expiration>
</Credentials>
```

Điểm quan trọng:

- Temporary credentials hoạt động gần giống access key dài hạn khi gọi AWS API.
- Khác biệt chính là phải gửi thêm **session token**.
- Sau khi hết hạn, AWS không còn chấp nhận request ký bằng credentials đó.
- Không nên giả định kích thước tối đa cố định của `SessionToken`; AWS khuyến nghị không hardcode giới hạn token size.

> Nguồn: [Request temporary security credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html)

---

## STS hoạt động như thế nào

Flow tổng quát:

```
┌──────────────┐
│ Principal    │
│ User/App/IdP │
└──────┬───────┘
       │ 1. Prove identity / request role
       ▼
┌──────────────┐
│ AWS STS      │
└──────┬───────┘
       │ 2. Validate trust policy, token, MFA, conditions
       ▼
┌──────────────┐
│ IAM Role     │
│ Policy       │
└──────┬───────┘
       │ 3. Return temporary credentials
       ▼
┌──────────────┐
│ AWS APIs     │
│ S3, EC2...   │
└──────────────┘
```

Có 2 lớp quyền quan trọng:

| Lớp | Trả lời câu hỏi | Ví dụ |
|-----|-----------------|-------|
| **Trust policy** | Ai được assume role? | User, role, service, SAML provider, OIDC provider |
| **Permissions policy** | Role làm được gì sau khi assume? | `s3:GetObject`, `ec2:DescribeInstances` |

Ví dụ trust policy cho EC2 assume role:

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

Ví dụ permissions policy sau khi role được assume:

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
      "Resource": "arn:aws:s3:::course-documents/*"
    }
  ]
}
```

---

## Các API STS quan trọng

| API | Dùng khi nào | Caller |
|-----|--------------|--------|
| `AssumeRole` | IAM user/role assume IAM role, thường dùng cross-account hoặc privilege elevation có kiểm soát | IAM user hoặc IAM role |
| `AssumeRoleWithWebIdentity` | OIDC/JWT web identity, Cognito, GitHub Actions OIDC | Caller có JWT hợp lệ từ IdP |
| `AssumeRoleWithSAML` | Enterprise federation qua SAML 2.0 | Caller có SAML assertion |
| `GetSessionToken` | Lấy temporary credentials cho IAM user, thường dùng MFA-protected API access | IAM user hoặc root |
| `GetFederationToken` | Custom federation broker cấp temporary credentials cho federated user | IAM user hoặc root |
| `GetCallerIdentity` | Kiểm tra identity hiện tại của credentials | Gần như mọi principal |

```
AssumeRole
  IAM principal ──► STS ──► Role credentials

AssumeRoleWithWebIdentity
  OIDC JWT ──► STS ──► Role credentials

AssumeRoleWithSAML
  SAML assertion ──► STS ──► Role credentials
```

> Nguồn: [Compare AWS STS credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_sts-comparison.html)

---

## AssumeRole chi tiết

`AssumeRole` trả về temporary credentials để truy cập AWS resources.

Use cases phổ biến:

- User ở Account A truy cập resource ở Account B.
- Developer tạm thời assume admin/support role có MFA.
- CI/CD role assume deploy role.
- Role chaining trong một số workflow.

### Flow cross-account

```
Account A                                  Account B
─────────                                  ─────────

IAM User / Role
    │
    │ 1. sts:AssumeRole
    │    RoleArn=arn:aws:iam::B:role/ProdReadOnly
    ▼
AWS STS
    │
    │ 2. Check trust policy on role in Account B
    ▼
ProdReadOnly Role
    │
    │ 3. Return temporary credentials
    ▼
User/App uses temporary credentials
    │
    │ 4. Access allowed resources in Account B
    ▼
S3 / EC2 / CloudWatch / ...
```

### Hai điều kiện cần có

Để cross-account assume role thành công:

1. **Role trust policy** ở Account B phải trust principal/account từ Account A.
2. Principal ở Account A phải có identity policy cho phép gọi `sts:AssumeRole` vào role ARN ở Account B.

AWS nói rõ `AssumeRole` tạo credentials gồm access key ID, secret access key, và security token; thường dùng trong cùng account hoặc cross-account access.

> Nguồn: [AssumeRole - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)

### AssumeRole với MFA

Trust policy có thể yêu cầu MFA:

```json
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::111122223333:user/alice"
  },
  "Action": "sts:AssumeRole",
  "Condition": {
    "Bool": {
      "aws:MultiFactorAuthPresent": "true"
    }
  }
}
```

Khi gọi `AssumeRole`, caller truyền:

- `SerialNumber`: ARN hoặc serial của MFA device
- `TokenCode`: mã TOTP hiện tại

Pattern này hay gặp trong:

- Cross-account admin access
- Break-glass role
- Production access

---

## AssumeRoleWithWebIdentity và Cognito

`AssumeRoleWithWebIdentity` đổi **OIDC-compatible JWT** thành temporary credentials.

AWS mô tả API này trả về AWS security credentials tạm thời khi nhận JSON Web Token từ identity provider như Login with Amazon, Facebook, Google, GitHub Actions, Azure DevOps, hoặc provider tương thích OIDC.

Flow:

```
Web/Mobile User
    │
    │ 1. Sign in
    ▼
OIDC Provider / Cognito User Pool
    │
    │ 2. JWT token
    ▼
App / Cognito Identity Pool
    │
    │ 3. AssumeRoleWithWebIdentity
    ▼
AWS STS
    │
    │ 4. Validate token and role trust policy
    ▼
Temporary AWS credentials
    │
    │ 5. Call AWS APIs
    ▼
S3 / DynamoDB / ...
```

### Liên hệ với Cognito User Pool và Identity Pool

Trong kiến trúc Cognito:

```
Cognito User Pool
  └── Xác thực user, phát JWT

Cognito Identity Pool
  └── Tin JWT/claims từ User Pool hoặc IdP khác
  └── Lấy temporary AWS credentials

AWS STS
  └── Nền tảng cấp temporary credentials phía sau
```

Ví dụ upload S3 theo user:

```
User login
  │
  ▼
Cognito User Pool returns JWT
  │
  ▼
Identity Pool maps authenticated user to IAM role
  │
  ▼
STS returns temporary credentials
  │
  ▼
App uploads to:
s3://course-documents/cognito/app/${cognito-identity.amazonaws.com:sub}/file.pdf
```

Điểm cần nhớ:

- `AssumeRoleWithWebIdentity` không yêu cầu AWS credentials để ký request.
- Request dùng web identity token/JWT làm bằng chứng.
- AWS validate chữ ký token qua public keys của IdP và kiểm tra role trust policy.

> Nguồn: [Requesting credentials through an OIDC provider](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#api_assumerolewithwebidentity)

---

## AssumeRoleWithSAML

`AssumeRoleWithSAML` dùng khi doanh nghiệp có identity provider hỗ trợ **SAML 2.0**.

Use cases:

- Nhân viên login qua corporate IdP như Active Directory Federation Services, Okta, Ping, Azure AD/Entra ID.
- Không tạo IAM user cho từng nhân viên.
- IdP gửi SAML assertion sang AWS.
- AWS STS trả temporary credentials cho role phù hợp.

Flow:

```
Employee
    │
    │ 1. Login corporate IdP
    ▼
SAML Identity Provider
    │
    │ 2. SAML assertion
    ▼
AWS STS AssumeRoleWithSAML
    │
    │ 3. Validate assertion
    ▼
Temporary credentials
    │
    │ 4. Access AWS resources
    ▼
AWS Account
```

Khác với `AssumeRole`:

- Caller không cần long-term AWS credentials trước đó.
- Caller cần SAML assertion hợp lệ từ known identity provider.
- Phù hợp với enterprise SSO/federation.

> Nguồn: [Requesting credentials through a SAML 2.0 identity provider](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#api_assumerolewithsaml)

---

## GetSessionToken và GetFederationToken

### GetSessionToken

`GetSessionToken` tạo temporary credentials cho IAM user hoặc root user.

Thường dùng để:

- Yêu cầu MFA trước khi gọi API nhạy cảm.
- Tạo session tạm thời từ IAM user credentials.

Điểm cần nhớ:

- Hỗ trợ MFA.
- Không hỗ trợ session policy.
- Temporary credentials từ `GetSessionToken` bị giới hạn khi gọi một số IAM/STS APIs.

### GetFederationToken

`GetFederationToken` dùng trong custom federation broker.

Pattern:

```
Custom identity system
    │
    │ authenticate user
    ▼
Custom broker with AWS credentials
    │
    │ GetFederationToken
    ▼
Temporary credentials for federated user
```

Trong thực tế hiện đại, nhiều workload ưu tiên:

- IAM Identity Center cho workforce SSO
- Cognito cho web/mobile users
- OIDC federation cho CI/CD như GitHub Actions

---

## Session Policies

**Session policy** là policy truyền vào khi tạo temporary session.

Điểm quan trọng:

```
Effective permissions
  =
Role identity-based policy
  INTERSECT
Session policy
```

Session policy **chỉ có thể giảm quyền**, không thể tăng quyền.

Ví dụ role cho phép S3 full access trong một bucket:

```json
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": [
    "arn:aws:s3:::course-documents",
    "arn:aws:s3:::course-documents/*"
  ]
}
```

Khi assume role, truyền session policy chỉ cho một prefix:

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
      "Resource": "arn:aws:s3:::course-documents/users/alice/*"
    }
  ]
}
```

Kết quả:

- Session chỉ được `GetObject` và `PutObject`.
- Chỉ trong prefix `users/alice/*`.
- Không được quyền ngoài role gốc.

AWS nêu rõ session permissions là giao của role identity-based policies và session policies.

> Nguồn: [AssumeRole - Permissions](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)

---

## Session Tags và ABAC

**Session tags** là tag key-value gắn vào role session khi gọi STS.

Ví dụ:

```text
Project=CoursePlatform
Department=Education
UserId=alice
```

Sau đó IAM policy có thể dùng principal tag:

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::course-documents/*",
  "Condition": {
    "StringEquals": {
      "s3:ExistingObjectTag/Department": "${aws:PrincipalTag/Department}"
    }
  }
}
```

Ứng dụng:

- ABAC: Attribute-Based Access Control
- Phân quyền theo department, project, tenant, cost center
- Audit tốt hơn trong CloudTrail

Lưu ý:

- Principal cần quyền pass session tags.
- Có thể đánh dấu tag là **transitive** để tag đi tiếp trong role chaining.
- Session tags có packed binary limit cùng session policies; response `PackedPolicySize` cho biết mức gần giới hạn.

> Nguồn: [AssumeRole - Tags](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)

---

## Duration và Expiration

Duration phụ thuộc API và cấu hình role.

Với `AssumeRole`:

| Thuộc tính | Giá trị |
|-----------|---------|
| Minimum | 900 giây, tức 15 phút |
| Default | 3600 giây, tức 1 giờ |
| Maximum | Tối đa theo maximum session duration của role, có thể đến 12 giờ |
| Role chaining | Tối đa 1 giờ |

Ví dụ:

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/ReadOnlyRole \
  --role-session-name hiep-readonly \
  --duration-seconds 3600
```

Nếu role max session duration là 6 giờ mà bạn request 12 giờ, request sẽ fail.

Nếu bạn đang dùng role A rồi assume role B, đó là **role chaining**. Trong role chaining, session qua AWS CLI/API bị giới hạn tối đa 1 giờ.

> Nguồn: [AssumeRole - DurationSeconds](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)

---

## Regional vs Global Endpoint

AWS STS có:

- Global endpoint: `https://sts.amazonaws.com`
- Regional endpoints: ví dụ `https://sts.us-east-1.amazonaws.com`

AWS nói bạn có thể gửi STS API calls đến global endpoint hoặc Regional endpoints. Regional endpoint gần hơn có thể:

- Giảm latency
- Cải thiện performance
- Cho phép failover sang endpoint Region khác nếu không liên lạc được endpoint ban đầu

Điểm quan trọng:

```
Credentials lấy từ Region nào vẫn có thể dùng global,
miễn là service/resource/action cho phép theo IAM và service behavior.
```

> Nguồn: [AWS STS and AWS regions](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html#sts-regions)

---

## Common Architectures

### 1. EC2 truy cập S3 bằng Instance Profile

```
EC2 Instance
    │
    │ app calls AWS SDK
    ▼
Instance Metadata Service
    │
    │ temporary credentials for IAM role
    ▼
AWS STS / IAM role credentials
    │
    ▼
Amazon S3
```

Không hardcode access key trên EC2. Gắn IAM role vào instance profile.

### 2. Lambda truy cập DynamoDB

```
Lambda Function
    │
    │ execution role
    ▼
Temporary credentials
    │
    ▼
DynamoDB
```

Lambda service assume execution role thay function.

### 3. Cross-account deployment

```
CI/CD Account
    │
    │ sts:AssumeRole
    ▼
Prod Account DeployRole
    │
    ▼
CloudFormation / ECS / Lambda / S3
```

Trust policy ở Prod Account trust CI/CD Account hoặc CI/CD role.

### 4. GitHub Actions OIDC vào AWS

```
GitHub Actions
    │
    │ OIDC JWT
    ▼
AWS STS AssumeRoleWithWebIdentity
    │
    ▼
Temporary credentials
    │
    ▼
Deploy to AWS
```

Không cần lưu AWS access key trong GitHub secrets.

### 5. Cognito User Pool + Identity Pool + S3

```
User
    │ login
    ▼
Cognito User Pool
    │ JWT
    ▼
Cognito Identity Pool
    │ maps authenticated user to IAM role
    ▼
AWS STS temporary credentials
    │
    ▼
Amazon S3
```

Đây là flow của câu hỏi edtech course documents.

---

## Security Best Practices

### 1. Ưu tiên role thay vì long-term access keys

```
Bad:
  Hardcode access keys in app

Good:
  App runs with IAM role and temporary credentials
```

### 2. Dùng least privilege

Role permissions policy chỉ nên chứa action/resource cần thiết.

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::course-documents/public/*"
}
```

Không dùng `Action: "*"` và `Resource: "*"` trừ khi thật sự cần.

### 3. Trust policy phải chặt

Trust policy là cửa vào của role.

Với cross-account third party, dùng:

- `ExternalId`
- `aws:PrincipalArn`
- `aws:PrincipalOrgID`
- MFA condition khi phù hợp

### 4. Dùng MFA cho privileged AssumeRole

Production/admin roles nên yêu cầu MFA:

```json
"Condition": {
  "Bool": {
    "aws:MultiFactorAuthPresent": "true"
  }
}
```

### 5. Dùng session duration ngắn vừa đủ

Nguyên tắc:

| Use case | Duration gợi ý |
|----------|----------------|
| CI/CD deploy | Vừa đủ cho pipeline |
| Human admin access | Ngắn, thường 1-4 giờ |
| Break-glass access | Rất ngắn, audit chặt |
| App service role | Để SDK/service tự refresh |

### 6. Không log credentials

Không log:

- `SecretAccessKey`
- `SessionToken`
- Full environment variables chứa credentials

### 7. Audit bằng CloudTrail

Theo dõi các event:

- `AssumeRole`
- `AssumeRoleWithWebIdentity`
- `AssumeRoleWithSAML`
- `GetSessionToken`
- `GetFederationToken`

Kiểm tra:

- Ai assume role?
- Assume role từ đâu?
- Session name là gì?
- Có source identity/session tags không?
- Có MFA không?

---

## Exam Tips

```
Nếu đề nói:

"temporary credentials"
→ Nghĩ đến STS

"cross-account access"
→ IAM Role + sts:AssumeRole

"web/mobile user access AWS services"
→ Cognito Identity Pool + STS temporary credentials

"OIDC provider / GitHub Actions"
→ AssumeRoleWithWebIdentity

"SAML enterprise federation"
→ AssumeRoleWithSAML

"require MFA before API calls"
→ AssumeRole with MFA hoặc GetSessionToken with MFA

"do not store access keys"
→ IAM Role / STS
```

### STS không phải là gì?

| Hiểu nhầm | Sự thật |
|----------|---------|
| STS lưu user database | Không, đó là IAM/Identity Center/Cognito/IdP |
| STS tự quyết định quyền | Không, quyền đến từ IAM role/policy/session policy |
| Temporary credentials không cần token | Sai, phải dùng `SessionToken` |
| User Pool trực tiếp grant quyền S3 | Sai, cần Identity Pool/STS/IAM role |
| Session policy tăng quyền role | Sai, chỉ giảm quyền bằng intersection |

---

## Quick Reference

| Câu hỏi | Đáp án nhanh |
|--------|--------------|
| STS dùng để làm gì? | Cấp temporary security credentials |
| Credentials gồm gì? | AccessKeyId, SecretAccessKey, SessionToken, Expiration |
| API phổ biến nhất? | `AssumeRole` |
| Cross-account dùng gì? | `sts:AssumeRole` |
| OIDC/JWT dùng gì? | `AssumeRoleWithWebIdentity` |
| SAML dùng gì? | `AssumeRoleWithSAML` |
| Temporary credentials hết hạn thì sao? | AWS không chấp nhận API request ký bằng credentials đó |
| Session policy có tăng quyền không? | Không, chỉ giới hạn thêm |
| Role chaining duration tối đa? | 1 giờ |
| AssumeRole default duration? | 1 giờ |
| AssumeRole minimum duration? | 15 phút |
| AssumeRole max duration? | Theo role max session duration, tối đa 12 giờ |

---

## Tài liệu tham khảo

- [Temporary security credentials in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html)
- [Request temporary security credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html)
- [Compare AWS STS credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_sts-comparison.html)
- [AssumeRole - AWS Security Token Service](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [IAM roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)
- [Amazon Cognito: Getting credentials](https://docs.aws.amazon.com/cognito/latest/developerguide/getting-credentials.html)
