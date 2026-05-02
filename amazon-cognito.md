# Amazon Cognito


## Mục lục

- [Tổng quan](#tổng-quan)
- [Hiểu đơn giản](#hiểu-đơn-giản)
- [User Pools - Chi tiết](#user-pools-chi-tiết)
- [Identity Pools - Chi tiết](#identity-pools-chi-tiết)
- [User Pools vs Identity Pools](#user-pools-vs-identity-pools)
- [Common Architecture](#common-architecture)
- [Lambda Triggers](#lambda-triggers)
- [Hosted UI](#hosted-ui)
- [Security Features](#security-features)
- [Pricing](#pricing)
- [Exam Tips cho Cloud Practitioner](#exam-tips-cho-cloud-practitioner)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**Amazon Cognito** cung cấp **authentication**, **authorization**, và **user management** cho web và mobile applications. Cognito giúp bạn thêm tính năng đăng nhập/đăng ký mà không cần tự build backend xác thực.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Amazon Cognito                             │
│      "Add sign-up, sign-in, and access control easily"          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Cognito có 2 thành phần chính:                                │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  1. USER POOLS                                          │   │
│   │     └── User directory (sign-up, sign-in)               │   │
│   │     └── Trả về JWT tokens                               │   │
│   │     └── "WHO are you?" (Authentication)                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  2. IDENTITY POOLS (Federated Identities)               │   │
│   │     └── Cấp AWS credentials tạm thời                    │   │
│   │     └── Access AWS services (S3, DynamoDB...)           │   │
│   │     └── "WHAT can you do?" (Authorization)              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hiểu đơn giản

```
Ví dụ: Bạn muốn users đăng nhập vào mobile app

KHÔNG có Cognito:
  └── Bạn phải tự build:
      ├── Database lưu users
      ├── API đăng ký/đăng nhập
      ├── Password hashing
      ├── Email verification
      ├── Forgot password
      ├── MFA
      └── OAuth integration (Google, Facebook...)
      
      = NHIỀU việc, dễ sai, security concerns

CÓ Cognito:
  └── Cognito làm hết:
      ├── ✅ User directory (lưu users)
      ├── ✅ Sign-up/Sign-in APIs
      ├── ✅ Password policies
      ├── ✅ Email/SMS verification
      ├── ✅ Forgot password
      ├── ✅ MFA
      ├── ✅ Social login (Google, Facebook, Apple)
      └── ✅ SAML/OIDC federation
      
      = Bạn chỉ cần integrate, không cần build
```

---

## User Pools - Chi tiết

**User Pool** = **User Directory** để quản lý users và xác thực.

### Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Pool Features                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Authentication:                                                │
│  ├── Sign-up / Sign-in                                          │
│  ├── Email/Phone verification                                   │
│  ├── Password policies (min length, special chars...)           │
│  ├── MFA (SMS, TOTP, hardware keys)                             │
│  └── Account recovery                                           │
│                                                                 │
│  Social/Enterprise Identity Providers:                          │
│  ├── Google, Facebook, Apple, Amazon                            │
│  ├── SAML 2.0 (Okta, Azure AD, OneLogin...)                     │
│  └── OIDC (OpenID Connect)                                      │
│                                                                 │
│  Customization:                                                 │
│  ├── Hosted UI (ready-to-use login page)                        │
│  ├── Custom UI (use your own)                                   │
│  ├── Lambda Triggers (custom logic)                             │
│  └── Custom attributes                                          │
│                                                                 │
│  Output: JWT Tokens (ID Token, Access Token, Refresh Token)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                User Pool Authentication Flow                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  User                    Cognito                  Your App   │
│    │                     User Pool                    │      │
│    │                        │                         │      │
│    │  1. Sign up/Sign in    │                         │      │
│    │───────────────────────►│                         │      │
│    │                        │                         │      │
│    │  2. Verify (email/MFA) │                         │      │
│    │◄──────────────────────►│                         │      │
│    │                        │                         │      │
│    │  3. JWT Tokens         │                         │      │
│    │◄───────────────────────│                         │      │
│    │                        │                         │      │
│    │  4. Call API with token                          │      │
│    │─────────────────────────────────────────────────►│      │
│    │                        │                         │      │
│    │                        │  5. Verify token        │      │
│    │                        │◄────────────────────────│      │
│    │                        │                         │      │
│    │  6. Response           │                         │      │
│    │◄─────────────────────────────────────────────────│      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### JWT Tokens

| Token | Mô tả | Expiry |
|-------|-------|--------|
| **ID Token** | Chứa user info (email, name...) | 1 hour |
| **Access Token** | Dùng để call APIs | 1 hour |
| **Refresh Token** | Dùng để lấy tokens mới | 30 days (configurable) |

---

## Identity Pools - Chi tiết

**Identity Pool** = Cấp **AWS credentials tạm thời** để access AWS services trực tiếp.

### Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                Identity Pool Workflow                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User authenticates với User Pool (hoặc external IdP)     │
│                                        │                     │
│                                        ▼                     │
│  2. Get JWT Token                                            │
│                                        │                     │
│                                        ▼                     │
│  3. Exchange token với Identity Pool                         │
│                                        │                     │
│                                        ▼                     │
│  4. Identity Pool gọi STS AssumeRoleWithWebIdentity          │
│                                        │                     │
│                                        ▼                     │
│  5. Nhận AWS credentials tạm thời (Access Key, Secret Key)   │
│                                        │                     │
│                                        ▼                     │
│  6. Access AWS services (S3, DynamoDB, API Gateway...)       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### IAM Roles

Identity Pool có 2 loại IAM Roles:

```
┌─────────────────────────────────────────────────────────────────┐
│                  Identity Pool IAM Roles                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Authenticated Role:                                            │
│  └── Cho users đã đăng nhập                                     │
│  └── Có nhiều permissions hơn                                   │
│                                                                 │
│  Unauthenticated Role (Guest):                                  │
│  └── Cho users CHƯA đăng nhập                                   │
│  └── Permissions hạn chế (read-only, limited)                   │
│                                                                 │
│  Example Authenticated Policy:                                  │
│  {                                                              │
│    "Effect": "Allow",                                           │
│    "Action": ["s3:GetObject", "s3:PutObject"],                  │
│    "Resource": "arn:aws:s3:::bucket/${cognito-identity.sub}/*"  │
│  }                                                              │
│  └── User chỉ access được folder của riêng họ                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Pools vs Identity Pools

### Cốt lõi: 2 câu hỏi hoàn toàn khác nhau

Đây là điểm hay làm người mới rối — tưởng 2 cái cùng làm 1 việc (login). Thực ra chúng giải quyết **2 vấn đề riêng biệt**:

```
USER POOL trả lời:       "Bạn là AI?"                  → Authentication
IDENTITY POOL trả lời:   "Bạn được làm gì trên AWS?"   → Authorization (cho AWS resources)
```

### Ví dụ đời thực: Đi vào tòa nhà công ty

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  USER POOL  =  Quầy Lễ Tân                                  │
│  ─────────────────────                                      │
│  • Bạn xuất trình CMND, lễ tân kiểm tra                     │
│  • Lễ tân in cho bạn 1 thẻ khách (badge)                    │
│  • Trên thẻ ghi: "Tên: Hiệp, Vai trò: Khách hàng"           │
│  • → Đây là JWT token                                       │
│                                                             │
│  Nhưng cái thẻ này chỉ chứng minh BẠN LÀ AI.                │
│  Nó KHÔNG mở được cửa phòng server, kho, két sắt...         │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│  IDENTITY POOL  =  Quầy đổi thẻ ra "chìa khóa từ"           │
│  ──────────────────────────────────────                     │
│  • Bạn đưa thẻ khách (JWT) vào                              │
│  • Hệ thống kiểm tra: "Khách thì được vào phòng nào?"       │
│  • Nó đưa cho bạn 1 chìa khóa từ tạm thời (~1 tiếng)        │
│  • Chìa khóa này MỞ ĐƯỢC cửa phòng họp, máy in              │
│  • → Đây là AWS Credentials tạm thời (Access Key + Secret)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Vì sao phải tách ra 2 thứ?

**Câu trả lời ngắn:** JWT từ User Pool **không phải** AWS credentials. AWS SDK (S3, DynamoDB...) **chỉ chấp nhận AWS credentials**, nó không hiểu JWT.

```
JWT Token              ≠       AWS Credentials
──────────                     ────────────────
"Tôi là Hiệp"                  "Tôi được phép gọi s3:PutObject vào bucket X"
Backend của BẠN hiểu           AWS API hiểu (qua chữ ký SigV4)
Dùng cho: API Gateway,         Dùng cho: gọi trực tiếp S3, DynamoDB,
          Lambda của bạn                 SQS, Kinesis... từ client
```

### Bảng so sánh

| Aspect | User Pools | Identity Pools |
|--------|------------|----------------|
| **Purpose** | Authentication (Who are you?) | Authorization (What can you do on AWS?) |
| **Output** | JWT Tokens (ID/Access/Refresh) | AWS Credentials tạm thời (~1h) |
| **Ai "hiểu" output này?** | Backend của bạn (API Gateway, Lambda) | AWS Services (S3, DynamoDB, ...) |
| **Use case** | Login vào app của bạn | Cho client gọi thẳng AWS service |
| **Lưu trữ users?** | ✅ Có (như database user) | ❌ Không |
| **Social login** | ✅ Native (Google, Facebook, SAML, OIDC) | Thường lấy identity từ User Pool |

### 2 kịch bản thực tế — khi nào cần cái nào

**Kịch bản A — Chỉ cần User Pool** (phổ biến nhất)

```
Mobile App ──login──► User Pool ──JWT──► Mobile App
                                             │
                                             │ Authorization: Bearer <JWT>
                                             ▼
                                        API Gateway ──► Lambda ──► DynamoDB
                                        (validate JWT)   (chạy với IAM role
                                                          của Lambda, KHÔNG
                                                          phải của user)
```

→ Backend của BẠN tự gọi DynamoDB. User chỉ nói chuyện với API của bạn. **Không cần Identity Pool.**

**Kịch bản B — Cần cả 2** (client gọi AWS trực tiếp)

```
Mobile App ──login──► User Pool ──JWT──► Mobile App
                                             │
                                             │ Đưa JWT này
                                             ▼
                                        Identity Pool
                                             │
                                             │ Trả AWS Credentials
                                             ▼
                                        Mobile App
                                             │
                                             │ Dùng AWS SDK
                                             ▼
                                        S3 (upload ảnh trực tiếp)
```

→ App **gọi thẳng S3** từ điện thoại, không qua backend của bạn. **Bắt buộc cần Identity Pool** để có AWS credentials hợp lệ.

### Khi nào cần Identity Pool?

Chỉ khi **client (mobile/web/IoT) gọi trực tiếp dịch vụ AWS** — không qua backend của bạn:

- Upload ảnh/video thẳng từ điện thoại lên **S3**
- Đọc/ghi **DynamoDB** trực tiếp từ web app
- Gọi **AWS AppSync / Kinesis / IoT Core** từ device
- Cho phép **guest user** (chưa login) xem một số resource công khai trong S3

Nếu bạn có backend (API Gateway + Lambda, hoặc EC2/ECS chạy code của bạn) làm trung gian → **chỉ cần User Pool**.

### Tóm 1 câu để nhớ

> **User Pool** = "thẻ nhân viên" để app của BẠN nhận biết user.
> **Identity Pool** = "chìa khóa AWS" để user (qua app) tự mở cửa kho AWS.

---

## Common Architecture

### Architecture 1: User Pool + API Gateway

```
┌──────────────────────────────────────────────────────────────┐
│      User Pool + API Gateway (Most Common)                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Mobile/Web ──► Cognito ──► JWT Token                        │
│     App         User Pool                                    │
│     │                                                        │
│     │ JWT Token in Authorization header                      │
│     ▼                                                        │
│  API Gateway ──► Lambda ──► DynamoDB                         │
│     │                                                        │
│     └── Cognito Authorizer validates JWT                     │
│                                                              │
│  Benefits: Serverless, scalable, secure                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Architecture 2: User Pool + Identity Pool + S3

```
┌──────────────────────────────────────────────────────────────┐
│      Direct AWS Access (S3 Upload from Client)               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Mobile ──► Cognito ──► JWT ──► Cognito ──► AWS Credentials  │
│   App       User Pool          Identity Pool                 │
│    │                                                         │
│    │ AWS SDK with credentials                                │
│    ▼                                                         │
│   S3 (upload photos to user's folder)                        │
│                                                              │
│  Policy: s3:PutObject on bucket/${cognito-identity.sub}/*    │
│  └── Each user can only access their own folder              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Lambda Triggers

User Pool có thể trigger Lambda functions tại các events:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lambda Triggers                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pre Sign-up:                                                   │
│  └── Validate user, auto-confirm, auto-verify                   │
│                                                                 │
│  Post Confirmation:                                             │
│  └── Welcome email, create user in database                     │
│                                                                 │
│  Pre Authentication:                                            │
│  └── Custom validation before login                             │
│                                                                 │
│  Post Authentication:                                           │
│  └── Log login activity, update last login                      │
│                                                                 │
│  Pre Token Generation:                                          │
│  └── Add custom claims to JWT                                   │
│                                                                 │
│  Custom Message:                                                │
│  └── Customize verification email/SMS                           │
│                                                                 │
│  User Migration:                                                │
│  └── Migrate users from old system on-the-fly                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hosted UI

Cognito cung cấp **Hosted UI** - trang login ready-to-use:

```
┌─────────────────────────────────────────────────────────────────┐
│                       Hosted UI                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  URL: https://your-domain.auth.region.amazoncognito.com/login   │
│                                                                 │
│  ┌───────────────────────────────────────────────┐              │
│  │                                               │              │
│  │   ┌─────────────────────────────────────┐     │              │
│  │   │          Your App Logo              │     │              │
│  │   └─────────────────────────────────────┘     │              │
│  │                                               │              │
│  │   Email: [_________________________]          │              │
│  │                                               │              │
│  │   Password: [_________________________]       │              │
│  │                                               │              │
│  │   [         Sign In         ]                 │              │
│  │                                               │              │
│  │   ─────────── OR ───────────                  │              │
│  │                                               │              │
│  │   [ Sign in with Google ]                     │              │
│  │   [ Sign in with Facebook ]                   │              │
│  │                                               │              │
│  │   Don't have account? Sign up                 │              │
│  │                                               │              │
│  └───────────────────────────────────────────────┘              │
│                                                                 │
│  Customizable: Logo, CSS, colors                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Features

| Feature | Description |
|---------|-------------|
| **MFA** | SMS, TOTP (Google Authenticator), Hardware keys |
| **Adaptive Authentication** | Risk-based, block suspicious logins |
| **Compromised Credentials** | Block logins with leaked passwords |
| **Advanced Security** | WAF integration, bot detection |
| **Encryption** | Data encrypted at rest và in transit |

---

## Pricing

| Component | Free Tier | After Free Tier |
|-----------|-----------|-----------------|
| **MAU (Monthly Active Users)** | 50,000 MAU | $0.0055/MAU |
| **SAML/OIDC federation** | - | $0.015/MAU |
| **Advanced Security** | - | Additional cost |

> [!TIP]
> 50,000 MAU free tier rất generous - hầu hết startups không cần trả tiền.

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ Cognito:**
> - **User Pools** = Authentication (WHO are you?) → JWT Tokens
> - **Identity Pools** = Authorization (WHAT can you do?) → AWS Credentials
> - Social login (Google, Facebook), SAML, OIDC
> - MFA, password policies, email verification

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Service nào cho user sign-up/sign-in? | **Cognito User Pools** |
| Làm sao mobile app access S3 trực tiếp? | **Cognito Identity Pools** |
| Integrate với Google/Facebook login? | **Cognito User Pools** |
| User Pools output gì? | **JWT Tokens** |
| Identity Pools output gì? | **AWS Credentials** (temporary) |
| Serverless authentication? | **Cognito** |

### So sánh nhanh

```
┌─────────────────────────┬─────────────────────────────────────┐
│       User Pools        │          Identity Pools             │
├─────────────────────────┼─────────────────────────────────────┤
│ Authentication          │ Authorization                       │
│ "Who are you?"          │ "What can you do?"                  │
│ Returns JWT tokens      │ Returns AWS credentials             │
│ For your app's backend  │ For direct AWS access               │
│ Stores user data        │ Does not store users                │
└─────────────────────────┴─────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                   Amazon Cognito Summary                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Managed authentication & authorization                      │
│  ✅ User Pools: Sign-up, sign-in, JWT tokens                    │
│  ✅ Identity Pools: AWS credentials for direct access           │
│  ✅ Social login (Google, Facebook, Apple)                      │
│  ✅ Enterprise federation (SAML, OIDC)                          │
│  ✅ MFA, password policies, email verification                  │
│  ✅ Lambda triggers for custom logic                            │
│  ✅ Hosted UI or custom UI                                      │
│                                                                 │
│  Common Pattern:                                                │
│  User Pool → JWT → API Gateway → Lambda                         │
│  User Pool → Identity Pool → S3/DynamoDB (direct access)        │
│                                                                 │
│  Pricing: 50,000 MAU free, then $0.0055/MAU                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
