# AWS Organizations


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các khái niệm cơ bản](#các-khái-niệm-cơ-bản)
- [Feature Sets](#feature-sets)
- [Organization Policies](#organization-policies)
- [Service Control Policies (SCPs)](#service-control-policies-scps)
- [1. Tổng quan](#1-tổng-quan)
- [2. Kiến trúc và Các thành phần cốt lõi](#2-kiến-trúc-và-các-thành-phần-cốt-lõi)
- [3. Service Control Policies (SCPs)](#3-service-control-policies-scps)
- [Resource Control Policies (RCPs)](#resource-control-policies-rcps)
- [Management Policies](#management-policies)

---

<<<<<<< HEAD
## Tổng quan

**AWS Organizations** là dịch vụ giúp bạn quản lý tập trung và điều hành môi trường AWS khi bạn mở rộng quy mô. Với Organizations, bạn có thể:
- **Tạo accounts** và phân bổ tài nguyên
- **Nhóm accounts** để tổ chức workflows
- **Áp dụng policies** để quản trị
- **Tối ưu billing** với một phương thức thanh toán duy nhất

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS Organizations                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────────┐                                │
│                              │    ROOT     │ ← Administrative Root          │
│                              │             │                                │
│                              └──────┬──────┘                                │
│                                     │                                       │
│                     ┌───────────────┼───────────────┐                       │
│                     │               │               │                       │
│               ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐                   │
│               │    OU     │  │    OU     │  │    OU     │  ← Organizational │
│               │Production │  │   Dev     │  │ Security  │    Units (OUs)    │
│               └─────┬─────┘  └─────┬─────┘  └─────┬─────┘                   │
│                     │              │              │                         │
│               ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐                   │
│               │  Account  │  │  Account  │  │  Account  │ ← Member Accounts │
│               │  Account  │  │  Account  │  │           │                   │
│               └───────────┘  └───────────┘  └───────────┘                   │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │  Policies: SCPs, RCPs, Tag Policies, Backup Policies, etc.      │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Các khái niệm cơ bản

### Organization Structure

| Thành phần | Mô tả |
|------------|-------|
| **Organization** | Tập hợp các AWS accounts được quản lý tập trung |
| **Root** | Container cấp cao nhất trong hierarchy |
| **Management Account** | Account tạo organization, có toàn quyền quản lý |
| **Member Accounts** | Các accounts thuộc organization (không phải management) |
| **Organizational Units (OUs)** | Nhóm các accounts để áp dụng policies chung |

### Ví dụ Organization Structure

```
                            ┌─────────────────────┐
                            │        ROOT         │
                            │                     │
                            └──────────┬──────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
     ┌──────▼──────┐            ┌──────▼──────┐            ┌──────▼──────┐
     │ Production  │            │ Development │            │  Security   │
     │     OU      │            │     OU      │            │     OU      │
     └──────┬──────┘            └──────┬──────┘            └──────┬──────┘
            │                          │                          │
     ┌──────┴──────┐            ┌──────┴──────┐            ┌──────┴──────┐
     │             │            │             │            │             │
  ┌──▼──┐      ┌──▼──┐      ┌──▼──┐      ┌──▼──┐      ┌──▼──┐      ┌──▼──┐
  │Prod │      │Prod │      │ Dev │      │ QA  │      │Audit│      │ Log │
  │App A│      │App B│      │     │      │     │      │     │      │     │
  └─────┘      └─────┘      └─────┘      └─────┘      └─────┘      └─────┘
```

---

## Feature Sets

AWS Organizations hỗ trợ 2 feature sets:

### 1. All Features (Default - Recommended)

**All Features** là feature set mặc định và đầy đủ nhất khi tạo organization mới:

- ✅ Tất cả tính năng của Consolidated Billing
- ✅ **SCPs** - Giới hạn permissions cho IAM users/roles
- ✅ **RCPs** - Giới hạn access đến resources
- ✅ **Tag Policies** - Chuẩn hóa tags
- ✅ **Backup Policies** - Centralized backup management
- ✅ **AI Services Opt-out** - Kiểm soát data collection
- ✅ **AWS Service Integrations** - GuardDuty, Security Hub, CloudTrail, etc.
- ✅ **Delegated Administrator** - Phân quyền quản lý cho member accounts

### 2. Consolidated Billing Only (Legacy)

**Consolidated Billing Only** là mode cơ bản (legacy) - chỉ có chức năng thanh toán:

- ✅ **Một hóa đơn** cho tất cả accounts trong organization
- ✅ **Volume discounts** - Aggregate usage để được giá tốt hơn
- ✅ **Share Reserved Instances** - Chia sẻ RIs across accounts
- ✅ **Share Savings Plans** - Chia sẻ Savings Plans across accounts
- ❌ **KHÔNG có SCPs** - Không thể giới hạn permissions
- ❌ **KHÔNG có policies khác** - Không có Tag, Backup, AI opt-out policies
- ❌ **KHÔNG có AWS service integrations** - Không thể enable GuardDuty, Security Hub cho organization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Feature Sets Comparison                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Consolidated Billing Only              All Features                       │
│   ┌─────────────────────────────┐       ┌─────────────────────────────┐    │
│   │                             │       │                             │    │
│   │  💰 BILLING ONLY            │       │  💰 BILLING                 │    │
│   │  ────────────────────────   │       │  ────────────────────────   │    │
│   │  • Single bill              │       │  • Single bill              │    │
│   │  • Volume discounts         │       │  • Volume discounts         │    │
│   │  • Share RIs                │       │  • Share RIs                │    │
│   │  • Share Savings Plans      │       │  • Share Savings Plans      │    │
│   │                             │       │                             │    │
│   │                             │       │  🔐 GOVERNANCE              │    │
│   │                             │       │  ────────────────────────   │    │
│   │  ❌ No SCPs                 │       │  • SCPs                     │    │
│   │  ❌ No RCPs                 │       │  • RCPs                     │    │
│   │  ❌ No Tag Policies         │       │  • Tag Policies             │    │
│   │  ❌ No Backup Policies      │       │  • Backup Policies          │    │
│   │                             │       │                             │    │
│   │                             │       │  🔗 INTEGRATIONS            │    │
│   │                             │       │  ────────────────────────   │    │
│   │  ❌ No service integrations │       │  • GuardDuty                │    │
│   │                             │       │  • Security Hub             │    │
│   │                             │       │  • CloudTrail Org           │    │
│   │                             │       │  • IAM Identity Center      │    │
│   │                             │       │  • + 50 more services       │    │
│   └─────────────────────────────┘       └─────────────────────────────┘    │
│                                                                             │
│   ⚠️ Legacy mode                        ✅ Recommended                      │
│   (Không nên sử dụng cho new orgs)      (Default cho new organizations)    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!WARNING]
> **Consolidated Billing Only** là mode legacy từ thời đầu của Organizations. **Không khuyến khích** sử dụng cho organizations mới vì bạn sẽ mất toàn bộ khả năng governance và security controls.

### Upgrade từ Consolidated Billing → All Features

Nếu organization của bạn đang ở mode **Consolidated Billing Only**, bạn có thể upgrade:

1. **Management account** khởi tạo upgrade request
2. AWS gửi **invitation** đến tất cả **invited member accounts** (accounts được mời tham gia, không phải accounts được tạo trong org)
3. Tất cả invited member accounts phải **accept** invitation
4. Sau khi tất cả accept → All Features được enabled

> [!NOTE]
> - Accounts được **tạo trong organization** (không phải mời) tự động được approve
> - Chỉ accounts được **mời từ bên ngoài** mới cần accept
> - Upgrade là **one-way** - không thể rollback về Consolidated Billing Only

### So sánh Feature Sets

| Feature | All Features | Consolidated Billing Only |
|---------|--------------|---------------------------|
| **Consolidated Billing** | ✅ | ✅ |
| **Service Control Policies (SCPs)** | ✅ | ❌ |
| **Resource Control Policies (RCPs)** | ✅ | ❌ |
| **Tag Policies** | ✅ | ❌ |
| **Backup Policies** | ✅ | ❌ |
| **AI Opt-out Policies** | ✅ | ❌ |
| **AWS Service Integrations** | ✅ | ❌ |
| **Delegated Administrator** | ✅ | ❌ |

---

## Organization Policies

### Phân loại Policies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Organization Policies                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    AUTHORIZATION POLICIES                              │  │
│  │  Kiểm soát quyền truy cập                                              │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────┐     ┌─────────────────────────┐          │  │
│  │  │  Service Control        │     │  Resource Control       │          │  │
│  │  │  Policies (SCPs)        │     │  Policies (RCPs)        │          │  │
│  │  │                         │     │                         │          │  │
│  │  │  Principal-centric      │     │  Resource-centric       │          │  │
│  │  │  controls               │     │  controls               │          │  │
│  │  └─────────────────────────┘     └─────────────────────────┘          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    MANAGEMENT POLICIES                                 │  │
│  │  Cấu hình và quản lý AWS services                                      │  │
│  │                                                                        │  │
│  │  • Backup Policies        • Tag Policies                              │  │
│  │  • AI Services Opt-out    • Chat Applications Policies                │  │
│  │  • Declarative Policies   • Security Hub Policies                     │  │
│  │  • Amazon Inspector       • Amazon Bedrock Policies                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Control Policies (SCPs)

### SCPs là gì?

**Service Control Policies (SCPs)** là policies kiểm soát **maximum permissions** cho IAM users và roles trong organization.

### "Maximum Permissions" nghĩa là gì?

**SCPs đặt ra "trần" (ceiling)** cho những permissions mà IAM users/roles **có thể có** - nhưng **KHÔNG tự động cấp** permissions đó.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Permission Layers                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Layer 1: SCP (Maximum/Ceiling)                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  "Bạn NHIỀU NHẤT có thể làm được đến đây"                           │   │
│   │  (Không grant, chỉ giới hạn)                                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│   Layer 2: IAM Policy (Actual Grant)                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  "Đây là những gì bạn THỰC SỰ được phép làm"                        │   │
│   │  (Grant permissions)                                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│   Effective = Giao của SCP ∩ IAM Policy                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Ví dụ cụ thể

```
Scenario: Account trong Production OU

SCP nói:        "Cho phép TẤT CẢ services NGOẠI TRỪ không được xóa S3"
                → Maximum: Mọi thứ trừ s3:DeleteObject

IAM Policy:     "User A được phép s3:* (tất cả S3 actions)"
                → Granted: Tất cả S3 actions

──────────────────────────────────────────────────────────────────────────────
Effective:      User A có thể dùng S3 NHƯNG KHÔNG THỂ xóa objects
                (vì SCP đã đặt ceiling - chặn DeleteObject)
```

#### So sánh SCP vs IAM Policy

| Aspect | SCP | IAM Policy |
|--------|-----|------------|
| **Chức năng** | Đặt **giới hạn tối đa** (ceiling) | **Cấp quyền** (grant) |
| **Có tự cấp quyền không?** | ❌ KHÔNG | ✅ CÓ |
| **Một mình có đủ không?** | ❌ (cần IAM Policy) | ✅ (nhưng bị SCP giới hạn) |

> [!IMPORTANT]
> - **SCP** = Bạn **KHÔNG THỂ vượt quá** giới hạn này (ceiling)
> - **IAM Policy** = Bạn **ĐƯỢC PHÉP** làm những thứ trong phạm vi này (grant)
> - **Kết quả** = Phần giao (intersection) của cả hai

### SCP Permission Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCP Permission Model                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐                                                       │
│   │  SCP Attached   │  SCPs KHÔNG grant permissions                         │
│   │  to Account/OU  │  SCPs chỉ define GIỚI HẠN permissions                 │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │    ALL POSSIBLE          SCP BOUNDARY        IAM POLICY             │  │
│   │    AWS ACTIONS           (Maximum)           (Granted)              │  │
│   │                                                                     │  │
│   │    ┌──────────┐          ┌──────────┐        ┌──────────┐          │  │
│   │    │██████████│    →     │████      │   →    │██        │          │  │
│   │    │██████████│          │████      │        │██        │          │  │
│   │    │██████████│          │████      │        │          │          │  │
│   │    │██████████│          │          │        │          │          │  │
│   │    └──────────┘          └──────────┘        └──────────┘          │  │
│   │                                                                     │  │
│   │                                               ▲                     │  │
│   │                                               │                     │  │
│   │                                      EFFECTIVE PERMISSIONS          │  │
│   │                                      (Intersection)                 │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Đặc điểm quan trọng của SCPs

| Đặc điểm | Mô tả |
|----------|-------|
| **Không grant permissions** | SCPs chỉ giới hạn, không cấp quyền |
| **Không áp dụng cho Management Account** | Management account không bị ảnh hưởng bởi SCPs |
| **Áp dụng cho member account root user** | Root user trong member accounts vẫn bị giới hạn bởi SCPs |
| **Không ảnh hưởng Service-linked roles** | Service-linked roles không bị restrict bởi SCPs |
| **Kế thừa theo hierarchy** | Policies được kế thừa từ parent xuống |

### SCP Inheritance

```
                        ┌─────────────────────┐
                        │        ROOT         │
                        │  SCP: FullAWSAccess │
                        └──────────┬──────────┘
                                   │
                                   │ Inherited
                                   ▼
                        ┌─────────────────────┐
                        │   Production OU     │
                        │  SCP: DenyEC2Stop   │
                        │       +             │
                        │  FullAWSAccess      │
                        └──────────┬──────────┘
                                   │
                                   │ Inherited
                                   ▼
                        ┌─────────────────────┐
                        │    Member Account   │
                        │  SCP: DenyS3Delete  │
                        │       +             │
                        │  DenyEC2Stop        │  ← Effective: Tất cả SCPs
                        │       +             │     từ parent được áp dụng
                        │  FullAWSAccess      │
                        └─────────────────────┘
```

### SCP Strategies

#### 1. Deny List Strategy (Recommended)
=======
## 1. Tổng quan

**AWS Organizations** là dịch vụ quản lý tập trung cho phép bạn **consolidate (hợp nhất)** và **govern (quản trị)** nhiều AWS accounts từ một nơi duy nhất. Đây là nền tảng cốt lõi để xây dựng môi trường cloud an toàn, scalable và dễ quản lý.

### Tại sao cần AWS Organizations?

| Vấn đề khi dùng nhiều accounts riêng lẻ | Giải pháp với Organizations |
|---|---|
| Mỗi account có bill riêng, khó theo dõi | **Consolidated Billing** - một hóa đơn duy nhất |
| Không thể áp dụng policy chung | **Service Control Policies (SCPs)** - kiểm soát tập trung |
| Khó chia sẻ Reserved Instances | **RI/Savings Plans sharing** tự động |
| Quản lý security rời rạc | **Centralized governance** - policy inheritance |

---

## 2. Kiến trúc và Các thành phần cốt lõi

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ORGANIZATION                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                          ROOT                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              Management Account (Payer)                  │  │  │
│  │  │  • Owns the organization                                 │  │  │
│  │  │  • Consolidated billing                                  │  │  │
│  │  │  • Apply SCPs (but NOT affected by SCPs)                 │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                              │                                 │  │
│  │          ┌───────────────────┼───────────────────┐            │  │
│  │          ▼                   ▼                   ▼            │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │  │
│  │  │  OU: Prod    │    │  OU: Dev     │    │  OU: Security│    │  │
│  │  │  ┌────────┐  │    │  ┌────────┐  │    │  ┌────────┐  │    │  │
│  │  │  │Account1│  │    │  │Account3│  │    │  │Log     │  │    │  │
│  │  │  └────────┘  │    │  └────────┘  │    │  │Archive │  │    │  │
│  │  │  ┌────────┐  │    │  ┌────────┐  │    │  └────────┘  │    │  │
│  │  │  │Account2│  │    │  │Account4│  │    │  ┌────────┐  │    │  │
│  │  │  └────────┘  │    │  └────────┘  │    │  │Security│  │    │  │
│  │  └──────────────┘    └──────────────┘    │  │Audit   │  │    │  │
│  │                                          │  └────────┘  │    │  │
│  │                                          └──────────────┘    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.1. Root

- **Container cao nhất** chứa tất cả accounts và OUs
- Mỗi organization chỉ có **1 Root duy nhất**
- Policies áp dụng tại Root sẽ **inherit xuống tất cả** OUs và accounts

### 2.2. Management Account (Payer Account)

| Đặc điểm | Mô tả |
|---|---|
| **Quyền sở hữu** | Account tạo và sở hữu organization |
| **Full control** | Toàn quyền quản lý tất cả member accounts |
| **Billing** | Nhận và thanh toán hóa đơn tổng hợp |
| **SCP exemption** | **KHÔNG bị ảnh hưởng bởi SCPs** |

> [!CAUTION]
> **Best Practice**: KHÔNG deploy workloads vào Management Account. Chỉ dùng để quản lý Organizations, SCPs, và billing để giảm thiểu security exposure.

### 2.3. Member Accounts

- Các AWS accounts thuộc về organization
- Chịu ảnh hưởng của policies từ organization/OUs
- Có thể được tạo mới hoặc invite accounts có sẵn

### 2.4. Organizational Units (OUs)

**OUs** là các container logic để **nhóm accounts** theo:
- Business function (Sales, Marketing, Engineering)
- Environment (Production, Development, Staging)
- Compliance requirements (PCI, HIPAA)

```
Root
├── OU: Infrastructure
│   ├── Account: Networking
│   └── Account: Shared Services
├── OU: Workloads
│   ├── OU: Production
│   │   ├── Account: Prod-App1
│   │   └── Account: Prod-App2
│   └── OU: Development
│       ├── Account: Dev-App1
│       └── Account: Dev-App2
└── OU: Security
    ├── Account: Log Archive
    └── Account: Security Audit
```

> [!TIP]
> **Policy Inheritance**: Policies áp dụng cho parent OU sẽ tự động **inherit xuống tất cả child OUs và accounts** bên trong.

---

## 3. Service Control Policies (SCPs)

### 3.1. Khái niệm

**SCPs** là guardrails kiểm soát **maximum permissions** cho tất cả accounts trong organization. SCPs **không grant permissions**, chúng chỉ **giới hạn** những gì IAM policies có thể grant.

```
┌─────────────────────────────────────────────────────────────────┐
│                    EFFECTIVE PERMISSIONS                         │
│                                                                  │
│   ┌─────────────┐                                                │
│   │     SCP     │  ← Defines MAXIMUM boundary                    │
│   │  (Guardrail)│                                                │
│   └──────┬──────┘                                                │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────┐                                                │
│   │ IAM Policy  │  ← Grants permissions WITHIN SCP boundary      │
│   │ (Permission)│                                                │
│   └──────┬──────┘                                                │
│          │                                                       │
│          ▼                                                       │
│   ╔═════════════╗                                                │
│   ║  EFFECTIVE  ║  = Intersection của SCP và IAM Policy          │
│   ║ PERMISSIONS ║                                                │
│   ╚═════════════╝                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2. Đặc điểm quan trọng của SCPs

| Đặc điểm | Mô tả |
|---|---|
| **Không grant permissions** | Chỉ define boundary, không thể grant access |
| **Affect all principals** | Ảnh hưởng tất cả IAM users, roles, **kể cả root user** của member accounts |
| **Management Account exempt** | **KHÔNG** ảnh hưởng Management Account |
| **Service-linked roles exempt** | Không ảnh hưởng service-linked roles |
| **Inheritance** | Policies inherit từ parent → child |

### 3.3. SCP Strategies

#### Strategy 1: Deny List (Default)

Mặc định, AWS tạo sẵn policy `FullAWSAccess` allow tất cả. Bạn thêm các **Deny statements** để chặn những gì không muốn.
>>>>>>> origin/main

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
<<<<<<< HEAD
        "cloudtrail:DeleteTrail",
        "cloudtrail:StopLogging"
=======
        "cloudtrail:StopLogging",
        "cloudtrail:DeleteTrail"
>>>>>>> origin/main
      ],
      "Resource": "*"
    }
  ]
}
```

<<<<<<< HEAD
#### 2. Allow List Strategy
=======
#### Strategy 2: Allow List

Remove `FullAWSAccess`, chỉ **explicitly allow** những services cần thiết.
>>>>>>> origin/main

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
<<<<<<< HEAD
      "Sid": "AllowOnlyEC2AndS3",
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "s3:*"
=======
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "s3:*",
        "rds:*"
>>>>>>> origin/main
      ],
      "Resource": "*"
    }
  ]
}
```

<<<<<<< HEAD
> [!WARNING]
> **Allow List Strategy** cần cẩn thận: Bạn phải explicitly allow mọi action cần thiết. Nếu quên, users sẽ không thể thực hiện các actions quan trọng.

### Actions không bị SCPs restrict

| Action | Lý do |
|--------|------|
| Actions trong Management Account | Management account được miễn trừ |
| Service-linked role actions | Cần cho AWS services hoạt động |
| Register for Enterprise support | Root user action |
| CloudFront private content signing | Root user action |

---

## Resource Control Policies (RCPs)

### RCPs là gì?

**Resource Control Policies (RCPs)** kiểm soát **maximum permissions cho resources** trong organization.

| Aspect | SCP | RCP |
|--------|-----|-----|
| **Focus** | Principal-centric (IAM users/roles) | Resource-centric (AWS resources) |
| **Kiểm soát** | Ai có thể làm gì | Ai có thể truy cập resource |
| **Use case** | Giới hạn actions của internal users | Ngăn external access đến resources |

### Ví dụ RCP
=======
### 3.4. Ví dụ SCPs thực tế

#### Restrict Regions (chỉ cho phép ap-southeast-1)
>>>>>>> origin/main

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
<<<<<<< HEAD
      "Sid": "RestrictAccessToOrgOnly",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalOrgID": "o-xxxxxxxxxx"
=======
      "Sid": "DenyAllOutsideAllowedRegions",
      "Effect": "Deny",
      "NotAction": [
        "iam:*",
        "organizations:*",
        "support:*",
        "sts:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["ap-southeast-1", "us-east-1"]
>>>>>>> origin/main
        }
      }
    }
  ]
}
```

<<<<<<< HEAD
---

## Management Policies

Management Policies dùng để **cấu hình và quản lý centrally** các AWS services trên toàn organization.

### Tổng quan các loại Management Policies

| Policy Type | Một câu mô tả |
|-------------|---------------|
| **Backup Policies** | "Backup tự động cho toàn org" |
| **Tag Policies** | "Enforce tag naming standards" |
| **AI Opt-out** | "Không cho AWS dùng data train AI" |
| **Declarative Policies** | "Enforce service configurations" |
| **Chat Applications** | "Control Slack/Teams integration" |
| **Security Hub Policies** | "Centralize security findings" |
| **Amazon Inspector** | "Centralize vulnerability scanning" |

---

### 1. Backup Policies 📦

**Mục đích**: Tự động backup resources theo schedule cho toàn organization.

```
Ví dụ thực tế:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Bạn muốn TẤT CẢ EC2 instances trong organization                           │
│  được backup hàng ngày lúc 2AM, giữ 30 ngày                                 │
│                                                                             │
│  → Tạo 1 Backup Policy, attach vào Root                                     │
│  → Tất cả accounts tự động có backup plan này                               │
│  → Không cần configure từng account riêng lẻ!                               │
└─────────────────────────────────────────────────────────────────────────────┘
=======
#### Prevent S3 Public Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyS3PublicAccess",
      "Effect": "Deny",
      "Action": [
        "s3:PutBucketPublicAccessBlock",
        "s3:DeletePublicAccessBlock"
      ],
      "Resource": "*"
    }
  ]
}
>>>>>>> origin/main
```

---

<<<<<<< HEAD
### 2. Tag Policies 🏷️

**Mục đích**: Enforce chuẩn hóa tags trên resources.

```
Ví dụ thực tế:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Bạn muốn mọi resource PHẢI có tag "Environment"                            │
│  với giá trị chỉ được là: Production, Development, Staging                  │
│                                                                             │
│  → Tạo Tag Policy để enforce rule này                                       │
│  → Nếu ai tạo resource với Environment = "Prod" (viết tắt)                  │
│  → Bị reject hoặc flag non-compliant!                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. AI Services Opt-out Policies 🤖

**Mục đích**: Kiểm soát AWS có được dùng data của bạn để train AI không.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AWS mặc định:                                                              │
│  → Có thể dùng data từ Lex, Polly, Rekognition để improve AI models        │
│                                                                             │
│  Với Opt-out Policy:                                                        │
│  → Bạn có thể nói "KHÔNG, đừng dùng data của tôi để train AI"              │
│  → Apply cho toàn bộ organization                                           │
│  → Quan trọng cho compliance (GDPR, HIPAA, etc.)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Declarative Policies 📜

**Mục đích**: Enforce cấu hình services một cách declarative (tự động maintain).

```
Ví dụ thực tế:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Bạn muốn:                                                                  │
│  • TẤT CẢ EBS volumes PHẢI encrypt                                          │
│  • Không ai được share AMI ra public                                        │
│  • Serial console access PHẢI disabled                                      │
│                                                                             │
│  → Declarative Policy: Define những rules này                               │
│  → AWS tự động enforce khi có APIs/features mới                             │
│  → Không cần update policy khi AWS release feature mới                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Chat Applications Policies 💬

**Mục đích**: Kiểm soát access từ Slack/Microsoft Teams đến AWS.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dùng khi: Bạn integrate AWS Chatbot với Slack/Teams                        │
│            để cho phép run commands từ chat                                 │
│                                                                             │
│  Policy cho phép kiểm soát:                                                 │
│  • Ai được dùng chatbot?                                                    │
│  • Channels nào được phép?                                                  │
│  • Commands nào được allow/deny?                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Security Hub Policies 🔐

**Mục đích**: Cấu hình centrally AWS Security Hub.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Security Hub = Dashboard tổng hợp security findings                        │
│                                                                             │
│  Với Policy bạn có thể:                                                     │
│  • Enable Security Hub cho tất cả accounts                                  │
│  • Chọn security standards nào cần comply (CIS, PCI-DSS, etc.)             │
│  • Aggregate findings về delegated admin account                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 7. Amazon Inspector Policies 🔍

**Mục đích**: Quản lý vulnerability scanning centrally.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Amazon Inspector = Tự động scan vulnerabilities                            │
│                     trong EC2, Lambda functions, ECR images                 │
│                                                                             │
│  Với Policy bạn có thể:                                                     │
│  • Enable Inspector cho tất cả accounts                                     │
│  • Cấu hình scan frequency                                                  │
│  • Aggregate findings về central account                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

> [!TIP]
> **Quan trọng nhất để nhớ**: 
> - **Backup Policies** và **Tag Policies** - dùng thực tế nhiều nhất
> - **AI Opt-out** - quan trọng cho compliance/privacy
> - Các policies khác - hiểu concept là đủ

### Tag Policies Example
=======
## 4. Các loại Policies khác

### 4.1. Tag Policies

Đảm bảo **consistent tagging** across tất cả accounts.
>>>>>>> origin/main

```json
{
  "tags": {
    "Environment": {
      "tag_key": {
        "@@assign": "Environment"
      },
      "tag_value": {
        "@@assign": [
          "Production",
          "Development",
          "Staging"
        ]
      },
      "enforced_for": {
        "@@assign": [
          "ec2:instance",
          "s3:bucket"
        ]
      }
    }
  }
}
```

<<<<<<< HEAD
### Backup Policies Example
=======
**Use cases:**
- Enforce cost allocation tags (`CostCenter`, `Project`, `Team`)
- Standardize naming conventions
- Enable compliance reporting

### 4.2. Backup Policies

Quản lý **backup plans centrally** cho tất cả accounts.
>>>>>>> origin/main

```json
{
  "plans": {
    "DailyBackupPlan": {
      "regions": {
<<<<<<< HEAD
        "@@assign": ["us-east-1", "eu-west-1"]
      },
      "rules": {
        "DailyRule": {
          "schedule_expression": {
            "@@assign": "cron(0 5 ? * * *)"
          },
          "start_backup_window_minutes": {
            "@@assign": "60"
          },
          "target_backup_vault_name": {
            "@@assign": "Default"
          },
          "lifecycle": {
            "delete_after_days": {
              "@@assign": "30"
            }
=======
        "@@assign": ["ap-southeast-1"]
      },
      "rules": {
        "DailyRule": {
          "schedule_expression": {"@@assign": "cron(0 5 ? * * *)"},
          "target_backup_vault_name": {"@@assign": "Default"},
          "lifecycle": {
            "delete_after_days": {"@@assign": "35"}
>>>>>>> origin/main
          }
        }
      },
      "selections": {
        "tags": {
<<<<<<< HEAD
          "BackupDaily": {
            "iam_role_arn": {
              "@@assign": "arn:aws:iam::$account:role/BackupRole"
            },
            "tag_key": {
              "@@assign": "Backup"
            },
            "tag_value": {
              "@@assign": ["Daily"]
            }
=======
          "BackupRequired": {
            "iam_role_arn": {"@@assign": "arn:aws:iam::$account:role/BackupRole"},
            "tag_key": {"@@assign": "Backup"},
            "tag_value": {"@@assign": ["required", "true"]}
>>>>>>> origin/main
          }
        }
      }
    }
  }
}
```

<<<<<<< HEAD
---

## Consolidated Billing

### Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Consolidated Billing                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌───────────────────┐                                                    │
│    │ Management Account│ ← Nhận consolidated bill                           │
│    │    (Payer)        │   cho toàn bộ organization                         │
│    └─────────┬─────────┘                                                    │
│              │                                                              │
│    ┌─────────┴─────────────────────────────────────┐                        │
│    │                                               │                        │
│    ▼                                               ▼                        │
│  ┌─────────────────┐                          ┌─────────────────┐           │
│  │ Member Account A│                          │ Member Account B│           │
│  │  Usage: $500    │                          │  Usage: $300    │           │
│  └─────────────────┘                          └─────────────────┘           │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐  │
│    │                        Benefits:                                    │  │
│    │  • Single Bill            → Một hóa đơn cho tất cả accounts        │  │
│    │  • Volume Discounts       → Aggregated usage = bigger discounts    │  │
│    │  • Reserved Instance      → Share RIs across accounts              │  │
│    │  • Savings Plans Sharing  → Share Savings Plans across accounts    │  │
│    │  • Free tier Sharing      → Share Free Tier usage                  │  │
│    └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Volume Discount Example

```
Scenario: S3 storage với tiered pricing

Nếu RIÊNG LẺ:
  Account A: 100 TB → $0.023/GB
  Account B: 100 TB → $0.023/GB
  
Với CONSOLIDATED BILLING:
  Tổng: 200 TB → $0.022/GB (higher volume = lower price tier)
  
  → SAVINGS!
```

---

## AWS Service Integration

### Service Integration là gì?

Khi một service **integrate với Organizations**, nghĩa là service đó có thể:
- **Enable/Configure** cho toàn organization cùng lúc
- **Aggregate data** từ tất cả accounts về một chỗ
- Sử dụng **Delegated Administrator** để phân quyền quản lý

> [!IMPORTANT]
> **Service Integration ≠ Enable/Disable dịch vụ**
> - **Integration** = Cho phép quản lý service ở **cấp organization** (centralized)
> - Muốn **chặn** service → Dùng **SCP** với `Effect: Deny`

### Quy trình Enable Service Integration (2 bước)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        2-Step Process                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   BƯỚC 1: Enable Trusted Access (Organizations Console)                    │
│   ─────────────────────────────────────────────────────────                 │
│   → Cho phép service có quyền hoạt động ở cấp organization                 │
│   → Chỉ là "mở cửa" cho service thôi, CHƯA BẬT service                     │
│                                                                             │
│                              ↓                                              │
│                                                                             │
│   BƯỚC 2: Enable/Configure (Service Console)                               │
│   ─────────────────────────────────────────────────────────                 │
│   → Vào console của service đó (GuardDuty, Security Hub, etc.)             │
│   → Enable organization-wide                                                │
│   → Configure settings                                                      │
│   → Bây giờ mới THỰC SỰ bật!                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Ví dụ: Enable GuardDuty cho Organization

  Bước 1: AWS Organizations Console
    → Services → GuardDuty → Enable trusted access ✓
  
  Bước 2: GuardDuty Console  
    → Settings → Enable organization management
    → Add all member accounts ✓
```

> [!TIP]
> **Best Practice**: Vào **service console** (VD: GuardDuty, Security Hub) và enable organization-level từ đó. AWS sẽ **tự động** enable trusted access ở Organizations.

### Các dịch vụ tích hợp với Organizations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS Service Integration Categories                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔐 SECURITY SERVICES                                                       │
│  ─────────────────────────────────────────────────────────                  │
│  • GuardDuty      = "Ai đang tấn công tôi?" (threat detection)             │
│  • Security Hub   = "Tổng hợp mọi security findings" (dashboard)           │
│  • Inspector      = "Có vulnerabilities nào không?" (scan)                 │
│  • Firewall Mgr   = "Quản lý firewall rules" (WAF, SG)                     │
│                                                                             │
│  📝 AUDIT & COMPLIANCE                                                      │
│  ─────────────────────────────────────────────────────────                  │
│  • CloudTrail     = "Ai làm gì, khi nào?" (API logs)                       │
│  • AWS Config     = "Resources cấu hình thế nào?" (config tracking)        │
│                                                                             │
│  🔑 ACCESS MANAGEMENT                                                       │
│  ─────────────────────────────────────────────────────────                  │
│  • IAM Identity   = "Một chỗ login, access mọi nơi" (SSO)                  │
│    Center                                                                   │
│                                                                             │
│  🔗 RESOURCE SHARING                                                        │
│  ─────────────────────────────────────────────────────────                  │
│  • AWS RAM        = "Share VPC/subnets giữa accounts" (sharing)            │
│  • Service        = "Share approved products" (catalog)                     │
│    Catalog                                                                  │
│                                                                             │
│  💰 COST & OPERATIONS                                                       │
│  ─────────────────────────────────────────────────────────                  │
│  • Cost Explorer  = "Xem chi phí toàn org" (billing)                       │
│  • AWS Backup     = "Backup centralized" (backup)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Bảng tóm tắt các services

| Service | Nó là cái gì? | Integrate với Orgs để làm gì? |
|---------|---------------|-------------------------------|
| **IAM Identity Center** | SSO - Single Sign-On | Một chỗ login → access tất cả accounts |
| **CloudTrail** | Ghi log mọi API calls | Một trail ghi logs cho toàn org |
| **AWS Config** | Track cấu hình resources | Aggregate config data từ all accounts |
| **GuardDuty** | Threat detection (phát hiện tấn công) | Centralize security alerts |
| **Security Hub** | Dashboard security findings | Xem security issues của toàn org |
| **AWS RAM** | Resource Access Manager | Share VPC, subnets, Route53 zones |
| **AWS Backup** | Managed backup service | Centralized backup cho all accounts |
| **Service Catalog** | Catalog các products | Share products across accounts |
| **Firewall Manager** | Manage WAF, SG, Shield | Centralized firewall rules |
| **Cost Explorer** | Analyze chi phí | Xem costs của toàn organization |

### Ví dụ thực tế: Với vs Không Integration

```
Scenario: Công ty có 50 accounts

KHÔNG có Organizations Integration:
┌─────────────────────────────────────────────────────────────────────────────┐
│  → Phải enable GuardDuty trong 50 accounts RIÊNG LẺ                        │
│  → Phải check security findings ở 50 dashboards KHÁC NHAU                  │
│  → 😱 Nightmare management!                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

VỚI Organizations Integration:
┌─────────────────────────────────────────────────────────────────────────────┐
│  → Enable GuardDuty 1 LẦN từ management account                            │
│  → Tất cả findings aggregate về 1 DASHBOARD                                │
│  → Delegate Security Team account làm admin                                 │
│  → 😊 Easy centralized management!                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Delegated Administrator

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Delegated Administrator                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌─────────────────────┐                                                  │
│    │  Management Account │                                                  │
│    │                     │                                                  │
│    │  "Delegate Security │                                                  │
│    │   Hub management    │                                                  │
│    │   to Security OU"   │                                                  │
│    └──────────┬──────────┘                                                  │
│               │                                                             │
│               │ Delegate                                                    │
│               ▼                                                             │
│    ┌─────────────────────┐     ┌─────────────────────────────────────────┐ │
│    │  Security Account   │     │  Benefits:                              │ │
│    │  (Delegated Admin)  │     │  • Giảm tải cho Management Account     │ │
│    │                     │     │  • Phân quyền theo chuyên môn          │ │
│    │  → Manages Security │     │  • Separation of duties                 │ │
│    │    Hub for all      │     │  • Better security                      │ │
│    │    member accounts  │     └─────────────────────────────────────────┘ │
│    └─────────────────────┘                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Account Management

### Tạo và mời Accounts

| Method | Mô tả |
|--------|-------|
| **Create Account** | Tạo account mới trong organization |
| **Invite Account** | Mời account có sẵn tham gia |

### Account Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Account Lifecycle                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌───────────────────┐    │
│  │ Create  │ →  │ Active  │ →  │ Suspended   │ →  │ Closed/Removed    │    │
│  │         │    │         │    │ (90 days)   │    │                   │    │
│  └─────────┘    └─────────┘    └─────────────┘    └───────────────────┘    │
│                                                                             │
│  Khi tạo account mới trong Organizations:                                   │
│  • Email unique cho root user                                               │
│  • Account name                                                             │
│  • IAM role cho cross-account access (OrganizationAccountAccessRole)        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### 1. Organization Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Recommended OU Structure                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌───────────┐                                  │
│                              │   ROOT    │                                  │
│                              └─────┬─────┘                                  │
│                                    │                                        │
│    ┌───────────┬───────────┬───────┼───────┬───────────┬───────────┐       │
│    │           │           │       │       │           │           │       │
│    ▼           ▼           ▼       ▼       ▼           ▼           ▼       │
│ ┌──────┐  ┌──────┐  ┌──────────┐ ┌────┐ ┌──────┐  ┌──────┐  ┌──────────┐  │
│ │Secur-│  │Infra-│  │Sandboxes │ │Dev │ │ QA   │  │ Prod │  │Suspended │  │
│ │ity   │  │struc-│  │          │ │    │ │      │  │      │  │ Accounts │  │
│ │      │  │ture  │  │          │ │    │ │      │  │      │  │          │  │
│ └──────┘  └──────┘  └──────────┘ └────┘ └──────┘  └──────┘  └──────────┘  │
│                                                                             │
│  Security:    Audit, Log Archive, Security Tools                           │
│  Infra:       Networking, Shared Services, DNS                             │
│  Sandboxes:   POC, Experiments                                             │
│  Dev/QA/Prod: Workload environments                                        │
│  Suspended:   Accounts pending deletion                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Security Best Practices

| Practice | Mô tả |
|----------|-------|
| **Protect Management Account** | Không chạy workloads trong management account |
| **Use SCPs for guardrails** | Implement deny-list để prevent dangerous actions |
| **Enable CloudTrail** | Organization trail cho audit |
| **Centralize logging** | Dedicated log archive account |
| **Use IAM Identity Center** | SSO cho human access |
| **Delegate admin** | Phân quyền cho specialized accounts |

### 3. SCP Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SCP Best Practices                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ DO:                                                                     │
│     • Test SCPs trong sandbox trước khi apply production                   │
│     • Use deny-list strategy (mặc định allow all, deny specific)           │
│     • Attach FullAWSAccess ở root                                          │
│     • Document all SCPs                                                     │
│     • Version control SCP JSON                                              │
│                                                                             │
│  ❌ DON'T:                                                                  │
│     • Rely solely on SCPs cho security (vẫn cần IAM policies)              │
│     • Lock yourself out (always test first)                                 │
│     • Forget that Management Account is exempt                              │
│     • Remove FullAWSAccess without replacement allow policy                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Essential SCPs

```json
// Prevent leaving organization
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "organizations:LeaveOrganization",
      "Resource": "*"
    }
  ]
}

// Prevent disabling security services
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "guardduty:DeleteDetector",
        "guardduty:DisassociateFromMasterAccount",
        "securityhub:DisableSecurityHub"
      ],
      "Resource": "*"
    }
  ]
}

// Restrict regions
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "NotAction": [
        "iam:*",
        "organizations:*",
        "support:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["us-east-1", "eu-west-1"]
        }
      }
    }
  ]
}
```

---

## Quotas và Limits

| Resource | Limit |
|----------|-------|
| **Accounts per organization** | Default: 10, có thể tăng |
| **OUs per organization** | 1000 |
| **OU nesting depth** | 5 levels dưới root |
| **Policies per organization** | 1000 mỗi loại policy |
| **SCPs attached per OU/Account** | 5 |
| **SCP size** | 5120 characters |

---

## Pricing

| Aspect | Cost |
|--------|------|
| **AWS Organizations** | **FREE** |
| **Số accounts** | Không giới hạn |
| **Policies** | Không tính phí |

> [!TIP]
> AWS Organizations hoàn toàn miễn phí. Bạn chỉ trả tiền cho các AWS resources mà accounts sử dụng.

---

## So sánh với AWS Control Tower

| Aspect | AWS Organizations | AWS Control Tower |
|--------|-------------------|-------------------|
| **Purpose** | Multi-account management | Pre-configured landing zone |
| **Setup** | Manual configuration | Automated best-practice setup |
| **Guardrails** | DIY với SCPs | Pre-built guardrails |
| **Account Factory** | API/Console | Automated provisioning |
| **Compliance** | Tự configure | Built-in detective controls |
| **Complexity** | More flexible | Easier to start |

---

## Tóm tắt

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AWS Organizations Summary                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🏢 WHAT:     Dịch vụ quản lý multi-account                                 │
│  💰 COST:     FREE                                                          │
│  🔑 KEY:      SCPs, OUs, Consolidated Billing                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Core Components                                 │   │
│  │  • Management Account → Toàn quyền, không bị SCP restrict           │   │
│  │  • Member Accounts    → Thuộc organization, bị SCP restrict         │   │
│  │  • OUs                → Nhóm accounts                                │   │
│  │  • SCPs               → Permission boundaries (KHÔNG grant)         │   │
│  │  • RCPs               → Resource access boundaries                  │   │
│  │  • Consolidated Bill  → Single payment cho all accounts            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Key Benefits                                    │   │
│  │  ✅ Centralized management                                          │   │
│  │  ✅ Policy-based governance                                         │   │
│  │  ✅ Consolidated billing & volume discounts                         │   │
│  │  ✅ Share resources (RIs, Savings Plans)                            │   │
│  │  ✅ AWS service integrations                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Organizations User Guide](https://docs.aws.amazon.com/organizations/latest/userguide/)
- [SCP Examples](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_examples.html)
- [Best practices for Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_best-practices.html)
- [Organizing Your AWS Environment](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html)
=======
### 4.3. AI Services Opt-out Policies

Ngăn AWS sử dụng data của bạn để **train AI models**.

```json
{
  "services": {
    "@@operators_allowed_for_child_policies": ["@@none"],
    "default": {
      "@@operators_allowed_for_child_policies": ["@@none"],
      "opt_out_policy": {
        "@@assign": "optOut"
      }
    }
  }
}
```

> [!IMPORTANT]
> Áp dụng AI opt-out policy tại Root sẽ prevent data sharing cho **tất cả accounts** trong organization.

---

## 5. Consolidated Billing

### 5.1. Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSOLIDATED BILLING                          │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ Management      │ ◄─── Receives ONE combined bill             │
│  │ Account (Payer) │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│    Aggregates usage from:                                        │
│           │                                                      │
│  ┌────────┼────────┬──────────────┬──────────────┐              │
│  ▼        ▼        ▼              ▼              ▼              │
│ ┌───┐   ┌───┐    ┌───┐         ┌───┐         ┌───┐             │
│ │Dev│   │Stg│    │Prod│        │QA │         │DR │             │
│ │$50│   │$30│    │$500│        │$20│         │$100│            │
│ └───┘   └───┘    └───┘         └───┘         └───┘             │
│                                                                  │
│ TOTAL = $50 + $30 + $500 + $20 + $100 = $700/month              │
│                                                                  │
│ BENEFITS:                                                        │
│ • Volume discounts (aggregated usage)                            │
│ • Shared Reserved Instances                                      │
│ • Shared Savings Plans                                           │
│ • Single payment method                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2. Lợi ích chính

| Lợi ích | Mô tả |
|---|---|
| **Volume Discounts** | Tổng hợp usage để đạt discount tiers cao hơn |
| **RI/Savings Plans Sharing** | Tự động chia sẻ Reserved Instances và Savings Plans |
| **Single Invoice** | Một hóa đơn duy nhất cho tất cả accounts |
| **Cost Visibility** | Dễ dàng track và allocate costs |
| **No Extra Fee** | Consolidated billing **miễn phí** |

---

## 6. Multi-Account Strategy Best Practices

### 6.1. Recommended OU Structure

```
Root
│
├── Security OU
│   ├── Log Archive Account      ← Centralized logs, immutable
│   └── Security Audit Account   ← Security tools, GuardDuty, etc.
│
├── Infrastructure OU
│   ├── Network Account          ← Transit Gateway, VPN
│   └── Shared Services Account  ← AD, DNS, common tools
│
├── Sandbox OU
│   └── Developer Sandbox Accounts
│
├── Workloads OU
│   ├── Production OU
│   │   ├── App1 Prod Account
│   │   └── App2 Prod Account
│   ├── Pre-Production OU
│   │   └── Staging Accounts
│   └── Development OU
│       └── Dev Accounts
│
├── Policy Staging OU            ← Test SCPs here first
│
└── Suspended OU                 ← Accounts pending deletion
```

### 6.2. Key Principles

| Principle | Mô tả |
|---|---|
| **Workload Isolation** | Tách Production khỏi Dev/Test |
| **Security Centralization** | Log Archive và Security tools tập trung |
| **Least Privilege Management Account** | Không deploy workloads vào Management Account |
| **OU-based Policies** | Áp dụng SCPs tại OU level, không phải individual accounts |
| **Test Policies First** | Dùng Policy Staging OU để test trước khi apply broad |

### 6.3. Foundational Accounts

#### 1. Management Account
- **Chỉ dùng cho**: Organizations, SCPs, Billing
- **KHÔNG deploy**: Workloads, applications

#### 2. Log Archive Account
- **Mục đích**: Centralized, immutable log storage
- **Best Practice**: Apply SCP để prevent log deletion

#### 3. Security Audit Account
- **Mục đích**: Security tools (GuardDuty, Security Hub, Detective)
- **Best Practice**: Cross-account read access to all accounts

---

## 7. Tạo Organization và Thêm Accounts

### 7.1. Tạo Organization

```bash
# Bật Organizations (từ account sẽ trở thành Management Account)
aws organizations create-organization --feature-set ALL

# Liệt kê organization info
aws organizations describe-organization
```

### 7.2. Tạo Account mới

```bash
# Tạo account mới trong organization
aws organizations create-account \
  --email "newaccount@company.com" \
  --account-name "Production-App1"
```

### 7.3. Invite Account có sẵn

```bash
# Gửi invitation
aws organizations invite-account-to-organization \
  --target Id=123456789012,Type=ACCOUNT

# Member account chấp nhận invitation
aws organizations accept-handshake \
  --handshake-id h-abcd1234
```

### 7.4. Tạo OU

```bash
# Lấy Root ID
ROOT_ID=$(aws organizations list-roots --query 'Roots[0].Id' --output text)

# Tạo OU
aws organizations create-organizational-unit \
  --parent-id $ROOT_ID \
  --name "Production"
```

### 7.5. Move Account vào OU

```bash
aws organizations move-account \
  --account-id 123456789012 \
  --source-parent-id $ROOT_ID \
  --destination-parent-id ou-xxxx-xxxxxxxx
```

---

## 8. So sánh với AWS Control Tower

| Feature | AWS Organizations | AWS Control Tower |
|---|---|---|
| **Core Function** | Multi-account management | Landing Zone automation |
| **SCPs** | Manual setup | Pre-configured guardrails |
| **Account Factory** | Manual creation | Automated provisioning |
| **Best Practices** | Bạn tự implement | Built-in blueprints |
| **Dashboard** | Basic | Visual dashboard |
| **Complexity** | Lower | Higher (more features) |
| **Use Case** | Custom setup | Rapid, compliant setup |

> [!NOTE]
> **AWS Control Tower** được **xây dựng trên AWS Organizations**. Nếu bạn mới bắt đầu multi-account strategy, Control Tower là lựa chọn tốt để có sẵn best practices.

---

## 9. Pricing

| Feature | Cost |
|---|---|
| **AWS Organizations** | **FREE** |
| **Consolidated Billing** | **FREE** |
| **SCPs, Tag Policies, etc.** | **FREE** |

> [!TIP]
> AWS Organizations hoàn toàn miễn phí. Bạn chỉ trả tiền cho resources trong các member accounts.

---

## 10. Exam Tips (SAA-C03)

1. **SCPs không grant permissions** - chỉ define maximum boundary
2. **Management Account không bị ảnh hưởng bởi SCPs**
3. **SCPs affect root user** của member accounts (nhưng không affect Management Account)
4. **Consolidated Billing** = volume discounts + RI sharing
5. **OUs có thể nested** - policies inherit xuống
6. **All features enabled** cần thiết để dùng SCPs
7. **Control Tower** builds on top of Organizations

---

## 11. Tài liệu tham khảo

- [AWS Organizations Documentation](https://docs.aws.amazon.com/organizations/)
- [SCP Examples](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_examples.html)
- [Multi-Account Strategy Whitepaper](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/)
- [AWS Control Tower](https://docs.aws.amazon.com/controltower/)
>>>>>>> origin/main
