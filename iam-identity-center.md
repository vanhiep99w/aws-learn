# AWS IAM Identity Center


## Mục lục

- [Tổng Quan](#tổng-quan)
- [Tại Sao Công Ty Cần Nhiều AWS Accounts?](#tại-sao-công-ty-cần-nhiều-aws-accounts)
- [SSO Đến Business Applications](#sso-đến-business-applications)
- [Hai Cơ Chế Hoạt Động Khác Nhau](#hai-cơ-chế-hoạt-động-khác-nhau)
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
│                              │                                          │
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
│    │◄──────────── Welcome Hiệp! ─────────── │                           │
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

## Hai Cơ Chế Hoạt Động Khác Nhau

> [!NOTE]
> Đây là điểm quan trọng dễ gây nhầm lẫn: Identity Center dùng **hai cơ chế hoàn toàn khác nhau** tùy thuộc vào đích đến là AWS Account hay ứng dụng bên ngoài (Jira, Slack...).

### Tóm Tắt Nhanh

| | AWS Accounts | Jira / Slack / Salesforce... |
|---|---|---|
| **Cơ chế** | AWS STS (Temporary Credentials) | SAML 2.0 Assertion |
| **Thứ gửi đi** | Access Key + Secret + Session Token | File XML được ký điện tử |
| **Ai xử lý** | AWS nội bộ | App tự verify chữ ký |
| **Jira có tài khoản không?** | N/A | Có, sync tự động qua SCIM hoặc JIT |
| **Hết hạn** | 1–12 giờ (tự gia hạn) | Assertion hết hạn sau vài phút (sau đó dùng session của Jira) |

---

### Cơ Chế 1: AWS STS — Dành Cho AWS Accounts

Khi click vào một AWS Account trên portal, Identity Center gọi **AWS STS** (Security Token Service) để tạo ra *Temporary Credentials* — một bộ thẻ tạm thời có giới hạn thời gian.

```
Nam click "Dev Account" trên Access Portal
           │
           ▼
┌──────────────────────┐
│  IAM Identity Center │
│                      │
│  Kiểm tra:           │
│  ✓ Nam đã login      │
│  ✓ Nam có quyền vào  │
│    Dev Account       │
│  ✓ Permission Set:   │
│    Developer         │
└──────────┬───────────┘
           │ Gọi AWS STS
           ▼
┌──────────────────────┐
│   AWS STS            │
│                      │
│  Tạo Temporary Creds:│
│  {                   │
│    AccessKeyId:      │
│     "ASIAXXX...",    │
│    SecretAccessKey:  │
│     "abc123...",     │
│    SessionToken:     │
│     "FQoGZXIv...",   │
│    Expiration:       │
│     "...T10:00:00Z"  │
│  }         ↑         │
│      Hết hạn 1 giờ   │
└──────────┬───────────┘
           │
           ▼
    AWS Console mở ra
    với quyền Developer ✅

Sau 1 giờ → tự động xin thẻ mới
Nam không biết gì, mọi thứ vẫn chạy
```

**Tại sao dùng STS thay vì password?**
- Không có access key nào tồn tại vĩnh viễn → nếu bị lộ, sau 1 giờ thẻ tự hết hạn
- IAM User truyền thống: access key tồn tại **mãi mãi** cho đến khi bạn tự xóa → rủi ro cao hơn

---

### Cơ Chế 2: SAML 2.0 — Dành Cho Jira, Slack, Salesforce...

SAML (Security Assertion Markup Language) là **giao thức chuẩn quốc tế**, không liên quan đến AWS. Jira, Salesforce, Microsoft 365... đều hỗ trợ SAML, vì thế Identity Center mới có thể tích hợp được.

#### Bước 0 — Admin setup một lần duy nhất

```
┌─────────────────────────────────────────────────────┐
│  Admin cấu hình "trust" giữa hai phía:              │
│                                                     │
│  Bên Jira:                                          │
│    Settings → Authentication → SAML 2.0             │
│    → "Identity Provider URL": (URL của Identity     │
│       Center)                                       │
│    → "Certificate": (copy từ Identity Center)       │
│    → Save ✓                                         │
│                                                     │
│  Bên Identity Center:                               │
│    Applications → Add → Jira                        │
│    → "ACS URL": (URL callback của Jira)             │
│    → "Entity ID": (ID định danh Jira)               │
│    → Save ✓                                         │
│                                                     │
│  Kết quả: Jira "tin tưởng" Identity Center          │
│           từ đây về sau                             │
└─────────────────────────────────────────────────────┘
```

#### Bước 1–4 — Mỗi lần Nam click vào Jira

```
Nam click "Jira" trên Access Portal
           │
           ▼
┌──────────────────────────────────────────────┐
│  Identity Center tạo SAML Assertion          │
│  (file XML, được ký bằng private key của IC) │
│                                              │
│  <SAMLResponse>                              │
│    <Assertion>                               │
│      <Subject>                               │
│        <NameID>nam@techvn.com</NameID>       │
│      </Subject>                              │
│      <Attributes>                            │
│        email: nam@techvn.com                 │
│        displayName: Nam Nguyen               │
│        groups: developers                    │
│      </Attributes>                           │
│      <Conditions NotOnOrAfter="+5min"/>      │
│      <Signature>ABC123XYZ...</Signature>     │
│    </Assertion>                              │
│  </SAMLResponse>                             │
└──────────────────┬───────────────────────────┘
                   │ Gửi qua trình duyệt
                   ▼
┌──────────────────────────────────────────────┐
│  Jira nhận SAML Assertion và kiểm tra:       │
│                                              │
│  1. Chữ ký có hợp lệ không?                  │
│     → Dùng certificate của Identity Center   │
│       để verify                              │
│     → ✓ Đúng là IC ký, không ai giả mạo      │
│                                              │
│  2. Assertion còn hạn không?                 │
│     → NotOnOrAfter: còn trong 5 phút ✓       │
│                                              │
│  3. User nam@techvn.com có trong Jira chưa?  │
│     → Có rồi (hoặc tự tạo — xem JIT bên      │
│       dưới)                                  │
│                                              │
│  → Cho Nam vào! Không hỏi password ✅        │
└──────────────────────────────────────────────┘
```

> [!NOTE]
> SAML Assertion chỉ dùng **một lần** và hết hạn sau vài phút. Sau khi Jira xác nhận xong, Jira tạo **session riêng** cho Nam (như cookie đăng nhập bình thường). Nếu Nam tắt trình duyệt và mở lại, quá trình SAML sẽ lặp lại — nhưng Nam vẫn không cần nhập password.

---

### Vậy Jira Có Tài Khoản Riêng Không?

**Có!** Jira vẫn có database user riêng. Identity Center không "thay thế" Jira — nó chỉ **đảm nhận phần xác thực (authentication)**. Có 2 cách tạo tài khoản Jira:

#### Cách 1: SCIM — Tự Động Hoàn Toàn (Khuyến nghị)

```
SCIM = System for Cross-domain Identity Management
       (Giao thức sync user tự động)

Admin thêm Nam vào Identity Center
           │
           │ Identity Center gọi Jira API
           ▼
  Jira tự tạo user nam@techvn.com ✓
  (không cần Admin vào Jira làm gì)

Admin disable Nam trong Identity Center
           │
           │ Identity Center gọi Jira API
           ▼
  Jira tự disable user nam@techvn.com ✓
  (ngay lập tức, không bỏ sót)
```

#### Cách 2: JIT (Just-In-Time) Provisioning — Tạo Khi Cần

```
Lần ĐẦU TIÊN Nam click vào Jira:

  Jira nhận SAML Assertion
  → Tìm user nam@techvn.com trong DB... Không có!
  → Tự tạo user mới từ thông tin trong Assertion:
      email: nam@techvn.com
      name: Nam Nguyen
      group: developers
  → Cho Nam vào ✓

Lần SAU Nam vào Jira:
  → Tìm user nam@techvn.com... Có rồi!
  → Cho vào luôn ✓

⚠️ Nhược điểm của JIT: Khi Nam nghỉ việc,
   account Jira vẫn tồn tại (dù không login được
   vì không qua được Identity Center).
   → SCIM giải quyết vấn đề này tốt hơn.
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
     │                                   │  │  ┌──────────┐┌─────────────────┐│
     │                                   └──│  │Salesforce││ Microsoft 365   ││
     │                                      │  └──────────┘└─────────────────┘│
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
│          │                     │                       │                │
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

> **Identity Source = "Tao lấy danh sách user từ đâu"**

IAM Identity Center đóng vai trò **bảo vệ cổng công ty** — khi nhân viên đến đăng nhập, nó cần tra cứu "người này có phải nhân viên không?". **Identity Source chính là quyển danh sách nhân viên đó**, và có thể để ở 3 chỗ khác nhau tùy công ty bạn.

> [!IMPORTANT]
> Mỗi AWS Organization chỉ được có **1 Identity Source duy nhất** tại một thời điểm. Thay đổi sau khi đã setup có thể **mất toàn bộ assignments** — cần cân nhắc kỹ trước khi chọn!

### 1. Identity Center Directory (Built-in)

**Dùng khi:** Công ty chưa có hệ thống quản lý user nào, hoặc team nhỏ muốn bắt đầu nhanh.

Admin tự tạo user/group trực tiếp trong AWS console, AWS lưu toàn bộ thông tin user trong Identity Center. Miễn phí, không cần cài đặt gì thêm.

**Ví dụ thực tế:**
```
Startup 5 người chưa có gì:
  Admin vào AWS Console → Identity Center → Users → Create user
  Nhập: tên, email, group "Developers"
  → User nhận email để set password → đăng nhập được luôn
```

**Hạn chế:** Phải tạo và xóa user thủ công trong AWS — khi nhân viên nghỉ phải nhớ vào AWS để disable.

### 2. Microsoft Active Directory

**Dùng khi:** Công ty đã có hệ thống Windows Server + Active Directory từ trước (rất phổ biến ở enterprise).

**Hai cách kết nối:**
- **AWS Managed Microsoft AD**: AWS host AD trên cloud cho bạn
- **AD Connector**: Proxy kết nối về AD on-premises, không sync dữ liệu lên AWS

**Ví dụ thực tế:**
```
Công ty 500 người đã dùng Windows AD từ 10 năm nay:
  Nhân viên login máy tính bằng: domain\hiep + password AD
  → Cùng account đó login vào AWS Access Portal luôn
  → Không cần tạo thêm account mới trong AWS
  → IT disable trong AD → mất quyền AWS ngay lập tức
```

### 3. External Identity Provider (IdP)

**Dùng khi:** Công ty đã dùng Okta, Azure AD, Google Workspace... để quản lý tất cả SaaS apps.

**Luồng hoạt động:**
```
Nhân viên vào AWS Access Portal
        |
        | Identity Center redirect sang IdP
        v
Okta / Azure AD / Google Workspace
  (nhân viên nhập credentials ở đây)
        |
        | IdP xác nhận qua SAML 2.0
        v
Identity Center cho vào portal
```

**User sync tự động qua SCIM:**
```
IT thêm nhân viên mới trong Okta
        | SCIM tự động sync
        v
User xuất hiện trong Identity Center ngay (không cần tạo thủ công)

IT disable nhân viên trong Okta
        | SCIM tự động sync
        v
User bị disable trong Identity Center ngay lap tuc
```

**Các IdP được hỗ trợ:** Okta, Microsoft Entra ID (Azure AD), Google Workspace, OneLogin, Ping Identity

**Ví dụ thực tế:**
```
Công ty tech 200 người đang dùng Okta cho Slack, Zoom, Gmail:
  → Set External IdP = Okta
  → Nhân viên dùng cùng 1 Okta account để login vào AWS
  → IT chỉ quản lý user ở Okta, AWS tự động cập nhật
```

### So Sánh Identity Sources

| | **Built-in** | **Active Directory** | **External IdP** |
|---|---|---|---|
| **Phù hợp với** | Startup, team nho | Cong ty dung Windows/AD | Cloud-first, da co Okta/Azure AD |
| **Chi phi** | Mien phi | Chi phi AD (neu dung AWS Managed AD) | Phi license IdP |
| **Cai dat** | Don gian | Trung binh | Trung binh |
| **Quan ly user** | Thu cong trong AWS Console | Tu dong sync tu AD | Tu dong sync qua SCIM |
| **MFA** | Built-in trong Identity Center | MFA cua AD hoac IdP | MFA cua IdP |
| **Khi nhan vien nghi** | Xoa thu cong trong AWS | Disable trong AD → tu dong | Disable trong IdP → tu dong |

> [!TIP]
> Da so enterprise chon **External IdP (Okta/Azure AD)** vi da co san he thong IdP. Startup moi thuong bat dau bang **Built-in** roi migrate sau.

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
│        ▼                     ▼                 ▼                    │
│   ┌──────────┐         ┌──────────┐       ┌──────────┐              │
│   │ Developer│    +    │ DevTeam  │  +    │  Dev     │              │
│   │ Access   │         │ Group    │       │  Account │              │
│   └──────────┘         └──────────┘       └──────────┘              │
│                             │                                       │
│                             ▼                                       │
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
│   │ └─ user2    │                                                         │
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
│                             │                                      │
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
│                             │                                      │
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
