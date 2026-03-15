# AWS IAM Identity Center


## Mục lục

- [Tổng Quan](#tổng-quan)
- [Tại Sao Công Ty Cần Nhiều AWS Accounts?](#tại-sao-công-ty-cần-nhiều-aws-accounts)
- [SSO Đến Business Applications](#sso-đến-business-applications)
- [Kiến Trúc](#kiến-trúc)
- [Identity Sources](#identity-sources)
- [Permission Sets](#permission-sets)
- [Tích Hợp AWS Organizations](#tích-hợp-aws-organizations)
- [Security Features](#security-features)
- [So Sánh Với IAM Truyền Thống](#so-sánh-với-iam-truyền-thống)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Pricing](#pricing)
- [Exam Tips (SAA, SAP, SCS)](#exam-tips-saa-sap-scs)
- [Tài Liệu Tham Khảo](#tài-liệu-tham-khảo)

---

> **Tên cũ:** AWS Single Sign-On (SSO) - đổi tên vào tháng 7/2022

AWS IAM Identity Center là dịch vụ quản lý truy cập tập trung, cho phép workforce users đăng nhập một lần (SSO) để truy cập nhiều AWS accounts và ứng dụng.

---

1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc](#kiến-trúc)
3. [Identity Sources](#identity-sources)
4. [Permission Sets](#permission-sets)
5. [Tích Hợp AWS Organizations](#tích-hợp-aws-organizations)
6. [Security Features](#security-features)
7. [So Sánh Với IAM Truyền Thống](#so-sánh-với-iam-truyền-thống)
8. [Use Cases](#use-cases)
9. [Best Practices](#best-practices)

---

## Tổng Quan

### IAM Identity Center Là Gì?

```
┌─────────────────────────────────────────────────────────────────────┐
│                      IAM Identity Center                            │
│                                                                     │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│   │   Identity       │    │   Permission     │    │    Access    │  │
│   │   Source         │───▶│   Sets           │───▶│    Portal    │  │
│   └──────────────────┘    └──────────────────┘    └──────────────┘  │
│          │                        │                       │         │
│          ▼                        ▼                       ▼         │
│   • Built-in directory      • Admin Access         Single login     │
│   • External IdP            • Developer Access     to all AWS       │
│   • Active Directory        • ReadOnly Access      accounts &       │
│                                                     applications    │
└─────────────────────────────────────────────────────────────────────┘
```

### Tại Sao Cần IAM Identity Center?

| Vấn Đề Với IAM Truyền Thống | Giải Pháp Với Identity Center |
|----------------------------|------------------------------|
| Tạo IAM users riêng cho mỗi account | Một danh tính duy nhất cho tất cả accounts |
| Quản lý nhiều credentials | Single Sign-On |
| Khó audit across accounts | Centralized logging qua CloudTrail |
| Manual permission assignment | Permission sets tái sử dụng |
| Không tích hợp corporate IdP | SAML 2.0 & OIDC support |

---

## 🤔 Tại Sao Công Ty Cần Nhiều AWS Accounts?

> [!NOTE]
> Trước khi hiểu IAM Identity Center, cần hiểu tại sao công ty không dùng 1 account cho tất cả.

### Vấn Đề: Tất Cả Trong 1 Account

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    1 AWS ACCOUNT CHO TẤT CẢ                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Account "MyCompany"                                                   │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │  Dev EC2, RDS     Staging EC2, RDS     Prod EC2, RDS              │ │
│   │  Dev S3 buckets   Staging S3           Prod S3                    │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│   😱 VẤN ĐỀ:                                                            │
│                                                                         │
│   1. XÓA NHẦM PROD:                                                     │
│      Developer có quyền xóa EC2 để dọn dev                              │
│      → Nhầm tay xóa Production Database! 💥                             │
│                                                                         │
│   2. BILLING LẪN LỘN:                                                   │
│      CFO hỏi: "Chi phí Dev bao nhiêu? Prod bao nhiêu?"                  │
│      → "Khó tách lắm..." 😅                                             │
│                                                                         │
│   3. LIMITS CHUNG:                                                      │
│      Dev team dùng hết 18/20 EC2 slots                                  │
│      → Prod chỉ còn 2 slots!                                            │
│                                                                         │
│   4. SECURITY:                                                          │
│      Auditor: "Ai có quyền access prod?"                                │
│      → Rất khó kiểm soát                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Giải Pháp: Multi-Account Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AWS ORGANIZATIONS (Multi-Account)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  DEV ACCOUNT   │  │ STAGING ACCOUNT│  │  PROD ACCOUNT  │             │
│  │                │  │                │  │                │             │
│  │  Bill: $5,000  │  │  Bill: $3,000  │  │  Bill: $42,000 │             │
│  │  Limits: riêng │  │  Limits: riêng │  │  Limits: riêng │             │
│  │                │  │                │  │                │             │
│  │  Devs: FULL    │  │  Devs: limited │  │  Devs: READ    │             │
│  │  access        │  │  access        │  │  ONLY          │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                         │
│  ✅ Devs có FULL quyền trong Dev Account                                │
│  ✅ Devs KHÔNG THỂ xóa nhầm Prod (vì khác account hoàn toàn!)           │
│  ✅ Billing tách riêng từng account                                     │
│  ✅ Limits riêng, không ảnh hưởng nhau                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Vấn Đề Mới: Quá Nhiều Tài Khoản!

```
┌─────────────────────────────────────────────────────────────────────────┐
│               KHÔNG CÓ IAM IDENTITY CENTER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Developer "Hiệp" cần access 5 accounts:                                │
│                                                                         │
│  Account Dev     → Tạo IAM User "hiep" + password + MFA                 │
│  Account Staging → Tạo IAM User "hiep" + password + MFA                 │
│  Account Prod    → Tạo IAM User "hiep" + password + MFA                 │
│  Account Logs    → Tạo IAM User "hiep" + password + MFA                 │
│  Account Network → Tạo IAM User "hiep" + password + MFA                 │
│                                                                         │
│  😱 5 accounts = 5 passwords + 5 MFA devices!                           │
│  😱 Hiệp nghỉ việc → Admin phải vào 5 accounts để xóa user              │
│  😱 50 developers × 10 accounts = 500 IAM Users!                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                 CÓ IAM IDENTITY CENTER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Developer "Hiệp":                                                      │
│                                                                         │
│  1. Đăng nhập 1 lần vào AWS Access Portal                               │
│     https://my-company.awsapps.com/start                                │
│                                                                         │
│  2. Thấy TẤT CẢ accounts được phân quyền:                               │
│     ┌────────────────────────────────────────────┐                      │
│     │  🏠 AWS Access Portal                      │                      │
│     │                                            │                      │
│     │  Account Dev     → [Console] [CLI]         │                      │
│     │  Account Staging → [Console] [CLI]         │                      │
│     │  Account Prod    → [Console] [CLI]         │                      │
│     └────────────────────────────────────────────┘                      │
│                                                                         │
│  3. Click vào account nào → Tự động vào! (không cần password nữa)       │
│                                                                         │
│  ✅ 1 password + 1 MFA cho TẤT CẢ accounts                              │
│  ✅ Hiệp nghỉ việc → Disable 1 chỗ = mất quyền tất cả                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 SSO Đến Business Applications

> [!IMPORTANT]
> IAM Identity Center không chỉ để login vào AWS, mà còn có thể SSO đến các **business apps** như Salesforce, Slack, Zoom, Microsoft 365!

### Các App Phổ Biến Là Gì?

| App | Loại | Dùng để làm gì? |
|-----|------|-----------------|
| **Salesforce** | CRM | Quản lý khách hàng, sales pipeline, leads |
| **Slack** | Team messaging | Chat, collaboration trong công ty |
| **Zoom** | Video conferencing | Họp online |
| **Microsoft 365** | Office suite | Email (Outlook), Word, Excel, Teams |
| **Jira/Confluence** | Project management | Quản lý tasks, documentation |
| **GitHub Enterprise** | Code repository | Source code, collaboration |

### Vấn Đề: Quá Nhiều Tài Khoản Apps

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 KHÔNG CÓ SSO - Nhân viên phải nhớ                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Sáng thứ 2, bắt đầu làm việc:                                          │
│                                                                         │
│  ┌──────────────┐  Username: hiep@company.com                           │
│  │  Salesforce  │  Password: Xyz123!@#                                  │
│  └──────────────┘  MFA: App riêng                                       │
│                                                                         │
│  ┌──────────────┐  Username: hiep@company.com                           │
│  │    Slack     │  Password: Abc456$%^                                  │
│  └──────────────┘  MFA: SMS                                             │
│                                                                         │
│  ┌──────────────┐  Username: hiep@company.com                           │
│  │    Zoom      │  Password: Qwe789&*(                                  │
│  └──────────────┘  MFA: Email                                           │
│                                                                         │
│  ┌──────────────┐  Username: hiep@company.com                           │
│  │ Microsoft365 │  Password: Rty012!@#                                  │
│  └──────────────┘  MFA: MS Authenticator                                │
│                                                                         │
│  ┌──────────────┐  Username: hiep-dev                                   │
│  │  AWS Dev     │  Password: Asd345$%^                                  │
│  └──────────────┘  MFA: Khác                                            │
│                                                                         │
│  😱 5+ passwords, 5+ MFA devices!                                       │
│  😱 Quên password → Gọi IT helpdesk                                     │
│  😱 Hiệp nghỉ việc → IT phải disable 5+ tài khoản                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Giải Pháp: Single Sign-On (SSO)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SINGLE SIGN-ON (SSO)                              │
│              "Đăng nhập 1 lần, truy cập tất cả"                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Hiệp đăng nhập 1 lần vào Identity Provider:                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    AWS IAM Identity Center                      │    │
│  │                                                                 │    │
│  │   Username: hiep@company.com                                    │    │
│  │   Password: **********                                          │    │
│  │   MFA: 123456                                                   │    │
│  │                                                                 │    │
│  │   [Login]                                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                             │                                           │
│                              │ ✅ Đã xác thực                           │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      ACCESS PORTAL                              │    │
│  │                                                                 │    │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐                │    │
│  │   │ Salesforce │  │   Slack    │  │    Zoom    │                │    │
│  │   │   [Open]   │  │   [Open]   │  │   [Open]   │                │    │
│  │   └────────────┘  └────────────┘  └────────────┘                │    │
│  │                                                                 │    │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐                │    │
│  │   │ Microsoft  │  │  AWS Dev   │  │  AWS Prod  │                │    │
│  │   │    365     │  │   [Open]   │  │   [Open]   │                │    │
│  │   │   [Open]   │  └────────────┘  └────────────┘                │    │
│  │   └────────────┘                                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   Click [Open] → Tự động đăng nhập vào app đó! (không cần password)     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cách Hoạt Động: SAML 2.0

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SAML SSO FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Hiệp click "Salesforce" trong portal                                │
│                                                                         │
│  2. IAM Identity Center:                                                │
│     "Hiệp đã login, cho phép vào Salesforce"                            │
│     → Tạo SAML Token (giấy chứng nhận)                                  │
│                                                                         │
│  3. Gửi SAML Token đến Salesforce                                       │
│                                                                         │
│  4. Salesforce:                                                         │
│     "Token này từ IAM Identity Center mà tôi TRUST"                     │
│     → Cho Hiệp vào, không hỏi password!                                 │
│                                                                         │
│                                                                         │
│   User          Identity Center         Salesforce                      │
│    │                  │                     │                           │
│    │──── Login ──────►│                     │                           │
│    │                  │                     │                           │
│    │◄─── OK ──────────│                     │                           │
│    │                  │                     │                           │
│    │── Click Salesforce (with SAML Token) ─►│                           │
│    │                                        │                           │
│    │◄──────────── Welcome Hiệp! ───────────│                            │
│    │          (no password needed)          │                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### So Sánh Không SSO vs Có SSO

| | Không có SSO | Có SSO (IAM Identity Center) |
|---|--------------|------------------------------|
| **Passwords** | 5+ riêng biệt | **1 password** |
| **MFA** | 5+ apps | **1 MFA** |
| **Đăng nhập** | Login từng app | **Login 1 lần** |
| **Quên password** | Gọi IT 5 lần | **Gọi IT 1 lần** |
| **Nhân viên nghỉ** | Disable 5+ nơi | **Disable 1 chỗ** |
| **Security** | Mỗi app bảo mật riêng | **Tập trung, dễ audit** |

### IAM Identity Center Có Thể SSO Đến

```
┌────────────────────────────────────────────────────────────────┐
│           IAM IDENTITY CENTER SSO CAPABILITIES                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  AWS Resources:                                                │
│    ✅ AWS Accounts (Dev, Staging, Prod...)                     │
│    ✅ AWS Console                                              │
│    ✅ AWS CLI (temporary credentials)                          │
│                                                                │
│  Business Applications (SAML 2.0):                             │
│    ✅ Salesforce                                               │
│    ✅ Slack                                                    │
│    ✅ Zoom                                                     │
│    ✅ Microsoft 365 (Office, Outlook, Teams)                   │
│    ✅ Dropbox                                                  │
│    ✅ Jira, Confluence                                         │
│    ✅ GitHub Enterprise                                        │
│    ✅ Box                                                      │
│    ✅ ServiceNow                                               │
│    ✅ ... và hàng nghìn apps khác hỗ trợ SAML!                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Kiến Trúc

### Luồng Xác Thực

```
                                      AWS Cloud
                                         │
┌─────────┐     ┌──────────────────────┐ │  ┌─────────────────────────────────┐
│  User   │────▶│  IAM Identity Center │─┼─▶│         AWS Organizations       │
│         │     │       (SSO)          │ │  │  ┌─────────┐ ┌─────────────────┐│
└─────────┘     └──────────────────────┘ │  │  │ Account │ │ Account         ││
     │                    │              │  │  │    A    │ │    B            ││
     │                    ▼              │  │  └─────────┘ └─────────────────┘│
     │          ┌──────────────────────┐ │  │  ┌─────────┐ ┌─────────────────┐│
     │          │   Identity Source    │ │  │  │ Account │ │ Account         ││
     │          │  ┌────────────────┐  │ │  │  │    C    │ │    D            ││
     │          │  │ • Built-in     │  │ │  │  └─────────┘ └─────────────────┘│
     │          │  │ • External IdP │  │ │  └─────────────────────────────────┘
     │          │  │ • Active Dir   │  │ │
     │          │  └────────────────┘  │ │  ┌─────────────────────────────────┐
     │          └──────────────────────┘ │  │       Third-party Apps          │
     │                                   │  │  ┌─────────┐ ┌─────────────────┐│
     │                                   └──│  │Salesforce│ │ Microsoft 365  ││
     │                                      │  └─────────┘ └─────────────────┘│
     │                                      │  ┌─────────┐ ┌─────────────────┐│
     └──────────────────────────────────────│  │  Slack  │ │     Zoom        ││
                                            │  └─────────┘ └─────────────────┘│
              Access Portal                 └─────────────────────────────────┘
```

### Các Thành Phần Chính

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         IAM Identity Center                             │
│                                                                         │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────────────┐  │
│  │ IDENTITY SOURCE │   │ PERMISSION SETS │   │    ASSIGNMENTS        │  │
│  │                 │   │                 │   │                       │  │
│  │ Who can access? │   │ What can they   │   │ Which accounts/apps   │  │
│  │                 │   │ do?             │   │ can they access?      │  │
│  └─────────────────┘   └─────────────────┘   └───────────────────────┘  │
│          │                     │                        │               │
│          └─────────────────────┼───────────────────────┘                │
│                                ▼                                        │
│                    ┌───────────────────────┐                            │
│                    │     ACCESS PORTAL     │                            │
│                    │  https://d-xxx.awsapps│                            │
│                    │  .com/start           │                            │
│                    └───────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Identity Sources

IAM Identity Center hỗ trợ 3 loại Identity Sources:

### 1. Identity Center Directory (Built-in)

```yaml
Type: Native directory trong AWS
Use Case: Tổ chức nhỏ, không có IdP sẵn
Features:
  - Tạo users/groups trực tiếp trong console
  - Fully managed by AWS
  - Free
```

### 2. Microsoft Active Directory

```yaml
Type: On-premises hoặc AWS Managed Microsoft AD
Connection: 
  - AWS Managed Microsoft AD
  - AD Connector (proxy to on-prem AD)
Use Case: Enterprise đã có AD infrastructure
Features:
  - Sync users/groups từ AD
  - Seamless với Windows environment
```

### 3. External Identity Provider (IdP)

```yaml
Type: Third-party IdP
Protocols: SAML 2.0, SCIM
Supported IdPs:
  - Okta
  - Microsoft Entra ID (Azure AD)
  - Google Workspace
  - OneLogin
  - Ping Identity
Features:
  - Automatic provisioning với SCIM
  - Federation authentication
```

### So Sánh Identity Sources

| Feature | Built-in | Active Directory | External IdP |
|---------|----------|------------------|--------------|
| **Cost** | Free | AD costs | IdP license |
| **Setup Complexity** | Easy | Medium | Medium |
| **User Management** | Manual | Sync from AD | Sync via SCIM |
| **MFA** | Built-in | AD/IdP MFA | IdP MFA |
| **Best For** | Small orgs | Windows shops | Cloud-first orgs |

---

## Permission Sets

Permission Sets là collections of IAM policies được gán cho users/groups để truy cập AWS accounts.

### Cách Hoạt Động

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Permission Set Flow                           │
│                                                                      │
│  ┌─────────────┐     ┌─────────────────┐     ┌────────────────────┐  │
│  │ Permission  │     │   Assignment    │     │   AWS Account      │  │
│  │    Set      │────▶│                 │────▶│                    │  │
│  │             │     │ User/Group +    │     │  IAM Role Created  │  │
│  │ Admin       │     │ Account + PS    │     │  Automatically     │  │
│  └─────────────┘     └─────────────────┘     └────────────────────┘  │
│                                                       │              │
│                                                       ▼              │
│                                              ┌────────────────────┐  │
│                                              │ AWSReservedSSO_    │  │
│                                              │ AdminAccess_*      │  │
│                                              └────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Types of Permission Sets

#### 1. AWS Managed Permission Sets (Predefined)

```
┌────────────────────────────────────────────────────┐
│         AWS Managed Permission Sets                │
├────────────────────────────────────────────────────┤
│ • AdministratorAccess    - Full admin              │
│ • PowerUserAccess        - Dev without IAM         │
│ • ViewOnlyAccess         - Read-only               │
│ • ReadOnlyAccess         - Read-only (alternate)   │
│ • DatabaseAdministrator  - DB admin                │
│ • NetworkAdministrator   - Network admin           │
│ • SecurityAudit          - Security auditing       │
│ • SystemAdministrator    - EC2, RDS, etc.          │
│ • Billing                - Billing access          │
└────────────────────────────────────────────────────┘
```

#### 2. Custom Permission Sets

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3FullAccess",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    },
    {
      "Sid": "EC2ReadOnly",
      "Effect": "Allow",
      "Action": "ec2:Describe*",
      "Resource": "*"
    }
  ]
}
```

#### 3. Inline Policies + Managed Policies

Một Permission Set có thể combine:
- **AWS Managed Policies**: Policies do AWS tạo sẵn
- **Customer Managed Policies**: Policies bạn tạo trong IAM
- **Inline Policies**: Policies viết trực tiếp trong permission set
- **Permissions Boundary**: Giới hạn maximum permissions

### Session Duration

```yaml
Default: 1 hour
Maximum: 12 hours
Configuration: Per permission set

# Ví dụ: Developer cần session dài hơn cho long-running tasks
DeveloperAccessSet:
  SessionDuration: 8 hours
  
# Admin cần session ngắn hơn vì sensitive
AdminAccessSet:
  SessionDuration: 1 hour
```

---

## Tích Hợp AWS Organizations

IAM Identity Center hoạt động tốt nhất với AWS Organizations:

### Organization Structure

```
                    ┌───────────────────────┐
                    │   Management Account  │
                    │   (Organization Root) │
                    │                       │
                    │  IAM Identity Center  │
                    │     resides here      │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
     ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
     │   OU:       │   │   OU:       │   │   OU:       │
     │   Security  │   │   Workloads │   │   Sandbox   │
     └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
            │                 │                 │
     ┌──────┴──────┐   ┌──────┼──────┐   ┌──────┴──────┐
     │  Log        │   │ Dev  │ Prod │   │  Dev1  Dev2 │
     │  Audit      │   │      │      │   │             │
     └─────────────┘   └──────┴──────┘   └─────────────┘
```

### Assignment Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Permission Assignment                            │
│                                                                     │
│   Permission Set    +    User/Group    +    Account/OU              │
│        │                     │                 │                    │
│        ▼                     ▼                  ▼                   │
│   ┌──────────┐         ┌──────────┐       ┌──────────┐              │
│   │ Developer│    +    │ DevTeam  │  +    │  Dev     │              │
│   │ Access   │         │ Group    │       │  Account │              │
│   └──────────┘         └──────────┘       └──────────┘              │
│                             │                                       │
│                              ▼                                      │
│              DevTeam members có Developer Access                    │
│              trong Dev Account                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Features

### Multi-Factor Authentication (MFA)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MFA Options                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌────────────────┐   ┌────────────────┐   ┌────────────────────┐  │
│   │  FIDO2/WebAuthn│   │  TOTP Apps     │   │  Built-in          │  │
│   │                │   │                │   │  Authenticator     │  │
│   │  • YubiKey     │   │  • Google Auth │   │                    │  │
│   │  • Windows     │   │  • Authy       │   │  • Push notif      │  │
│   │    Hello       │   │  • Microsoft   │   │  • AWS mobile app  │  │
│   │  • Touch ID    │   │    Auth        │   │                    │  │
│   └────────────────┘   └────────────────┘   └────────────────────┘  │
│                                                                     │
│   MFA Enforcement Options:                                          │
│   • Context-aware: Require MFA based on risk                        │
│   • Every sign-in: Always require MFA                               │
│   • Only specific apps: Selective enforcement                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Temporary Credentials

```
┌────────────────────────────────────────────────────────────────────┐
│               IAM Identity Center vs Long-term Credentials         │
│                                                                    │
│   Traditional IAM User               IAM Identity Center           │
│   ┌─────────────────────┐           ┌─────────────────────┐        │
│   │ Access Key ID       │           │ Temporary Creds     │        │
│   │ Secret Access Key   │           │                     │        │
│   │                     │           │ • Auto-rotated      │        │
│   │ • Never expires     │           │ • Time-limited      │        │
│   │ • Must rotate       │           │ • Role-based        │        │
│   │   manually          │           │ • No static keys    │        │
│   │ • Risk if leaked    │           │                     │        │
│   └─────────────────────┘           └─────────────────────┘        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Access Control Models

```yaml
# Role-Based Access Control (RBAC)
RBAC:
  Description: Permissions based on job function
  Example:
    - Developers get DeveloperAccess permission set
    - DBAs get DatabaseAdmin permission set
    - Auditors get SecurityAudit permission set

# Attribute-Based Access Control (ABAC)  
ABAC:
  Description: Permissions based on user attributes
  Attributes:
    - Department: Engineering, Finance, HR
    - CostCenter: CC-001, CC-002
    - Project: ProjectA, ProjectB
  Example:
    Condition:
      StringEquals:
        "aws:PrincipalTag/Department": "Engineering"
```

### CloudTrail Integration

```json
// Ví dụ CloudTrail event cho SSO authentication
{
  "eventSource": "sso.amazonaws.com",
  "eventName": "Authenticate",
  "userIdentity": {
    "type": "Unknown",
    "userName": "john.doe@company.com",
    "identityProvider": "EXTERNAL_IDP"
  },
  "requestParameters": {
    "instanceArn": "arn:aws:sso:::instance/ssoins-xxxxx"
  },
  "responseElements": {
    "result": "SUCCESS"
  }
}
```

---

## So Sánh Với IAM Truyền Thống

### IAM Users vs IAM Identity Center Users

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│   IAM Users                              IAM Identity Center              │
│   ─────────                              ──────────────────────           │
│                                                                           │
│   ┌─────────────┐                       ┌─────────────────────┐           │
│   │ Account A   │                       │ Identity Center     │           │
│   │ ├─ user1    │                       │                     │           │
│   │ └─ user2    │                       │ user1 ──┬──▶ Acc A  │           │
│   └─────────────┘                       │         ├──▶ Acc B  │           │
│                                         │         └──▶ Acc C  │           │
│   ┌─────────────┐                       │                     │           │
│   │ Account B   │                       │ user2 ──┬──▶ Acc A  │           │
│   │ ├─ user1    │   Same user,          │         └──▶ Acc B  │           │
│   │ └─ user2    │   different creds     │                     │           │
│   └─────────────┘                       └─────────────────────┘           │
│                                          One identity,                    │
│   ┌─────────────┐                        multiple accounts                │
│   │ Account C   │                                                         │
│   │ ├─ user1    │                                                         │
│   │ └─ user2   │                                                          │
│   └─────────────┘                                                         │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Feature Comparison

| Feature | IAM Users | IAM Identity Center |
|---------|-----------|---------------------|
| **Scope** | Per-account | Cross-account |
| **Credentials** | Long-term (access keys) | Temporary (STS) |
| **Password Management** | Per-account policy | Centralized |
| **MFA** | Per-user config | Centralized enforcement |
| **Groups** | Per-account | Cross-account |
| **External IdP** | Limited (SAML roles) | Native support |
| **Audit** | CloudTrail per account | Unified audit |
| **Cost** | Free | Free |

### Khi Nào Dùng Cái Nào?

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Decision Matrix                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Use IAM Users when:                                               │
│   ✓ Single AWS account                                              │
│   ✓ Service accounts/applications (với access keys)                 │
│   ✓ Legacy requirements                                             │
│   ✓ Very simple use case                                            │
│                                                                     │
│   Use IAM Identity Center when:                                     │
│   ✓ Multiple AWS accounts (recommended)                             │
│   ✓ Human users accessing console/CLI                               │
│   ✓ Integration với corporate directory                             │
│   ✓ Centralized access management                                   │
│   ✓ Compliance requirements                                         │
│   ✓ AWS Organizations đã được setup                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### 1. Multi-Account Access

```
┌────────────────────────────────────────────────────────────────────┐
│   Developer accesses multiple accounts với single login            │
│                                                                    │
│   ┌─────────┐      ┌──────────────────┐                            │
│   │Developer│─────▶│ Identity Center  │                            │
│   │   👤    │      │     Portal       │                            │
│   └─────────┘      └────────┬─────────┘                            │
│                            │                                       │
│              ┌──────────────┼──────────────┐                       │
│              ▼              ▼              ▼                       │
│        ┌──────────┐   ┌──────────┐   ┌──────────┐                  │
│        │ Dev Acc  │   │ Stage Acc│   │ Prod Acc │                  │
│        │          │   │          │   │          │                  │
│        │ Admin    │   │ Admin    │   │ ReadOnly │                  │
│        └──────────┘   └──────────┘   └──────────┘                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2. Business Application SSO

```
┌────────────────────────────────────────────────────────────────────┐
│   Single login cho AWS + Business Apps                             │
│                                                                    │
│   ┌─────────┐      ┌──────────────────┐                            │
│   │ Employee│─────▶│ Identity Center  │                            │
│   │   👤    │      │     Portal       │                            │
│   └─────────┘      └────────┬─────────┘                            │
│                            │                                       │
│        ┌────────────────────┼────────────────────┐                 │
│        ▼                    ▼                    ▼                 │
│   ┌────────────┐      ┌────────────┐      ┌────────────┐           │
│   │    AWS     │      │ Salesforce │      │ Microsoft  │           │
│   │  Console   │      │            │      │    365     │           │
│   └────────────┘      └────────────┘      └────────────┘           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 3. AWS CLI/SDK với SSO

```bash
# Configure AWS CLI to use SSO
aws configure sso
# SSO start URL: https://d-xxxxxxxxxx.awsapps.com/start
# SSO region: us-east-1
# Choose account and role from list

# Use SSO profile
aws s3 ls --profile my-sso-profile

# Login when session expires
aws sso login --profile my-sso-profile

# ~/.aws/config example
[profile my-sso-profile]
sso_start_url = https://d-xxxxxxxxxx.awsapps.com/start
sso_region = us-east-1
sso_account_id = 123456789012
sso_role_name = DeveloperAccess
region = us-east-1
output = json
```

---

## Best Practices

### 1. Identity Source Best Practices

```yaml
Recommendations:
  - Use External IdP: Nếu có (Okta, Azure AD, etc.)
  - Enable SCIM: Automatic user provisioning
  - Don't use built-in: Chỉ cho testing/small orgs
  
Anti-patterns:
  - Manually creating users khi có IdP
  - Multiple identity sources (chọn 1)
```

### 2. Permission Sets Best Practices

```yaml
Recommendations:
  - Start with AWS managed: AdministratorAccess, ViewOnlyAccess
  - Least privilege: Chỉ cấp quyền cần thiết
  - Use permission boundaries: Limit maximum permissions
  - Short session durations: 1-4 hours cho production
  
Naming Convention:
  - PS-{Function}-{Level}
  - Examples:
    - PS-Developer-FullAccess
    - PS-DBA-ReadOnly
    - PS-Security-Audit
```

### 3. Security Best Practices

```yaml
MFA:
  - Enable for ALL users
  - Use hardware keys (FIDO2) for admins
  - Context-aware MFA cho risk-based auth

Monitoring:
  - Enable CloudTrail in all regions
  - Set up alerts for:
    - Failed login attempts
    - Permission changes
    - New user creation
    
Access Reviews:
  - Quarterly access reviews
  - Remove unused permissions
  - Audit permission set assignments
```

### 4. Operational Best Practices

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Operational Checklist                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ☐ Enable in Management Account only                                 │
│ ☐ Connect to AWS Organizations                                      │
│ ☐ Configure identity source (IdP recommended)                       │
│ ☐ Create standard permission sets                                   │
│ ☐ Set up MFA enforcement                                            │
│ ☐ Enable CloudTrail logging                                         │
│ ☐ Document access portal URL for users                              │
│ ☐ Create runbook for onboarding/offboarding                         │
│ ☐ Set up emergency access (break-glass) procedure                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pricing

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Pricing                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   IAM Identity Center:  FREE ✓                                      │
│                                                                     │
│   You only pay for:                                                 │
│   • Underlying AWS services users access                            │
│   • AWS Managed Microsoft AD (if used)                              │
│   • External IdP licenses (Okta, Azure AD, etc.)                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips (SAA, SAP, SCS)

> [!IMPORTANT]
> **Key Concepts for AWS Exams**

1. **IAM Identity Center = AWS SSO (tên cũ)** - Đọc kỹ câu hỏi, có thể dùng tên cũ

2. **Multi-account access** - Keyword: "centralized access", "single sign-on", "multiple accounts"

3. **Permission Sets vs IAM Policies** - Permission Sets chỉ dùng trong Identity Center, tự động tạo IAM roles

4. **Identity Sources** - Biết 3 loại: Built-in, AD, External IdP

5. **AWS Organizations required** - Để có full features

6. **Temporary credentials** - Không dùng long-term access keys

7. **SAML 2.0 & SCIM** - Protocols để integrate với External IdPs

---

## Tài Liệu Tham Khảo

- [AWS IAM Identity Center Documentation](https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html)
- [Getting Started với IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html)
- [Permission Sets](https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html)
- [Connect External IdP](https://docs.aws.amazon.com/singlesignon/latest/userguide/manage-your-identity-source-idp.html)
