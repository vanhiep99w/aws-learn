# AWS IAM Management - Tổng Quan & Best Practices

## 📋 Mục lục

- [Overview Diagram](#overview-diagram)
- [Các thành phần chính](#các-thành-phần-chính)
- [Luồng xác thực & phân quyền](#luồng-xác-thực--phân-quyền)
- [Policy Evaluation Flow](#policy-evaluation-flow)
- [Multi-Account Architecture](#multi-account-architecture)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Overview Diagram

### Toàn cảnh hệ thống IAM trong AWS

```mermaid
graph TB
    subgraph AWS_ACCOUNT["☁️ AWS Account 123456789012"]
        ROOT["🔑 Root User<br/>Email + Password<br/>⚠️ TOÀN QUYỀN"]

        subgraph IAM_SERVICE["🛡️ IAM Service - Global - Miễn phí"]
            direction TB

            subgraph IDENTITIES["👤 IAM Identities - Principals"]
                direction LR
                USERS["👤 IAM Users<br/>Long-term credentials<br/>Password + MFA<br/>Access Keys"]
                GROUPS["👥 IAM Groups<br/>Nhóm users<br/>KHÔNG nested groups<br/>User thuộc nhiều groups"]
                ROLES["🎭 IAM Roles<br/>Temporary credentials<br/>Cho services/users/apps<br/>Auto-rotate"]
            end

            subgraph POLICIES["📜 IAM Policies"]
                direction LR
                MANAGED["AWS Managed Policies<br/>Do AWS tạo và duy trì<br/>VD: AmazonS3ReadOnlyAccess"]
                CUSTOM["Customer Managed Policies<br/>Do bạn tạo<br/>Tùy chỉnh theo nhu cầu"]
                INLINE["Inline Policies<br/>Gắn trực tiếp vào identity<br/>Không reuse được"]
            end

            PB["🚧 Permissions Boundary<br/>Giới hạn MAX permissions<br/>Áp dụng cho Users và Roles"]
        end

        subgraph RESOURCES["🏗️ AWS Resources"]
            direction LR
            EC2["💻 EC2"]
            S3["📦 S3"]
            RDS["🗄️ RDS"]
            LAMBDA["⚡ Lambda"]
            DDB["📊 DynamoDB"]
            OTHER["🔧 Khác..."]
        end

        RP["📋 Resource-based Policies<br/>S3 Bucket Policy<br/>SQS Queue Policy<br/>Lambda Resource Policy"]
    end

    subgraph EXTERNAL["🌍 Bên ngoài AWS"]
        FED_USER["🏢 Federated Users<br/>Google, SAML, OIDC"]
        CROSS["🔄 Cross-Account Access"]
    end

    %% Relationships
    ROOT -->|"tạo và quản lý"| IAM_SERVICE
    USERS -->|"thuộc về"| GROUPS
    MANAGED -->|"gắn vào"| USERS
    MANAGED -->|"gắn vào"| GROUPS
    MANAGED -->|"gắn vào"| ROLES
    CUSTOM -->|"gắn vào"| USERS
    CUSTOM -->|"gắn vào"| GROUPS
    CUSTOM -->|"gắn vào"| ROLES
    INLINE -->|"gắn vào"| USERS
    INLINE -->|"gắn vào"| ROLES

    USERS -->|"truy cập qua<br/>Identity-based Policy"| RESOURCES
    ROLES -->|"truy cập qua<br/>Trust + Permission Policy"| RESOURCES
    RP -->|"cho phép ai<br/>truy cập resource"| RESOURCES

    FED_USER -->|"AssumeRoleWithSAML<br/>AssumeRoleWithWebIdentity"| ROLES
    CROSS -->|"AssumeRole"| ROLES

    PB -->|"giới hạn"| USERS
    PB -->|"giới hạn"| ROLES

    style ROOT fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style USERS fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style GROUPS fill:#1a5276,color:#fff,stroke:#2980b9,stroke-width:2px
    style ROLES fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style MANAGED fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style CUSTOM fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style INLINE fill:#0e6655,color:#fff,stroke:#16a085,stroke-width:2px
    style PB fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style EC2 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style S3 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style RDS fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style LAMBDA fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style DDB fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style OTHER fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style RP fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style FED_USER fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style CROSS fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style AWS_ACCOUNT fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style IAM_SERVICE fill:#1c2833,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style IDENTITIES fill:#1a2732,color:#ecf0f1,stroke:#2980b9,stroke-width:1px
    style POLICIES fill:#1a2732,color:#ecf0f1,stroke:#27ae60,stroke-width:1px
    style RESOURCES fill:#1a2732,color:#ecf0f1,stroke:#2ecc71,stroke-width:1px
    style EXTERNAL fill:#2c1810,color:#ecf0f1,stroke:#e67e22,stroke-width:2px
```

---

### Mối quan hệ giữa các thành phần

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           AWS ACCOUNT                                               │
│                                                                                     │
│   ┌──────────┐                                                                      │
│   │Root User │──── ⚠️ Toàn quyền, chỉ dùng khi thật sự cần thiết                    │
│   └──────────┘                                                                      │
│         │                                                                           │
│         │ tạo & quản lý                                                             │
│         ▼                                                                           │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                        IAM SERVICE (Global)                                 │   │
│   │                                                                             │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │                    IDENTITIES (Ai?)                                 │   │   │
│   │   │                                                                     │   │   │
│   │   │   ┌──────────┐    ┌──────────────┐    ┌──────────────┐              │   │   │
│   │   │   │  Users   │───▶│    Groups    │    │    Roles     │              │   │   │
│   │   │   │          │    │              │    │              │              │   │   │
│   │   │   │ • John   │    │ • Developers │    │ • EC2-S3Role │              │   │   │
│   │   │   │ • Jane   │    │ • Admins     │    │ • Lambda-Role│              │   │   │
│   │   │   │ • Bob    │    │ • DevOps     │    │ • CrossAcct  │              │   │   │
│   │   │   └──────────┘    └──────────────┘    └──────────────┘              │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   │                              │                                              │   │
│   │                    gắn policies vào                                         │   │
│   │                              │                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │                    POLICIES (Được phép làm gì?)                     │   │   │
│   │   │                                                                     │   │   │
│   │   │   JSON Document:                                                    │   │   │
│   │   │   {                                                                 │   │   │
│   │   │     "Effect": "Allow" | "Deny",                                     │   │   │
│   │   │     "Action": "s3:GetObject",        ← Hành động gì?                │   │   │
│   │   │     "Resource": "arn:aws:s3:::*",    ← Trên resource nào?           │   │   │
│   │   │     "Condition": { ... }             ← Với điều kiện gì?            │   │   │
│   │   │   }                                                                 │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   │                              │                                              │   │
│   │                    cho phép/từ chối                                         │   │
│   │                              ▼                                              │   │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │   │                    AWS RESOURCES                                    │   │   │
│   │   │                                                                     │   │   │
│   │   │    EC2    S3    RDS    Lambda    DynamoDB    SQS    SNS   ...       │   │   │
│   │   └─────────────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Các thành phần chính

### 1. 🔑 Root User

| Đặc điểm | Mô tả |
|-----------|-------|
| **Credentials** | Email + Password đăng ký AWS account |
| **Quyền** | TOÀN QUYỀN - không thể bị giới hạn bởi bất kỳ policy nào |
| **Dùng khi nào** | Chỉ khi bắt buộc: đóng account, thay đổi support plan, restore IAM permissions |

### 2. 👤 IAM Users

```
IAM User = "1 người hoặc 1 ứng dụng" cần truy cập AWS

Xác thực bằng:
├── Console Access: Username + Password + MFA (optional)
└── Programmatic Access: Access Key ID + Secret Access Key
```

| Đặc điểm | Giá trị |
|-----------|---------|
| Tối đa users/account | 5,000 |
| Groups/user | Tối đa 10 |
| Policies/user | Tối đa 10 managed policies |

### 3. 👥 IAM Groups

```
Group = "Nhóm users có cùng quyền"

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developers    │    │     Admins      │    │    Auditors     │
│                 │    │                 │    │                 │
│ • John          │    │ • Alice         │    │ • Charlie       │
│ • Jane          │    │ • Bob           │    │ • Diana         │
│                 │    │                 │    │                 │
│ Policy:         │    │ Policy:         │    │ Policy:         │
│ EC2, S3, Lambda │    │ AdminAccess     │    │ ReadOnlyAccess  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

> [!IMPORTANT]
> - Groups **KHÔNG phải identity** → không thể dùng trong Resource-based Policy
> - Groups **KHÔNG thể nested** (group trong group)
> - User **KHÔNG bắt buộc** thuộc group nào
> - User có thể thuộc **NHIỀU groups** cùng lúc

### 4. 🎭 IAM Roles

```mermaid
graph LR
    subgraph ROLE["IAM Role"]
        TP["Trust Policy<br/>Ai được phép assume?"]
        PP["Permissions Policy<br/>Được làm gì?"]
    end

    EC2["💻 EC2 Instance"] -->|"assume"| ROLE
    LAMBDA["⚡ Lambda Function"] -->|"assume"| ROLE
    USER["👤 IAM User"] -->|"assume"| ROLE
    CROSS["🔄 External Account"] -->|"assume"| ROLE

    ROLE -->|"temporary credentials<br/>15min - 12h"| AWS["🏗️ AWS Resources"]

    style ROLE fill:#1c2833,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style TP fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style PP fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style EC2 fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style LAMBDA fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style USER fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style CROSS fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style AWS fill:#2c3e50,color:#fff,stroke:#2ecc71,stroke-width:2px
```

**Khi nào dùng Role?**

| Tình huống | Ví dụ |
|------------|-------|
| **AWS Service cần quyền** | EC2 đọc S3, Lambda ghi DynamoDB |
| **Cross-account access** | Account A truy cập resource ở Account B |
| **Federated users** | Login bằng Google/Facebook/SAML |
| **Temporary access** | Contractor cần quyền tạm thời |

### 5. 📜 IAM Policies

```mermaid
graph TB
    subgraph POLICY_TYPES["Các loại Policy"]
        direction TB
        
        subgraph IB["Identity-based Policies"]
            AMP["✅ AWS Managed<br/>VD: AmazonS3ReadOnly"]
            CMP["✅ Customer Managed<br/>VD: CustomEC2Policy"]
            INL["⚠️ Inline Policy<br/>Gắn trực tiếp, ko reuse"]
        end

        subgraph RB["Resource-based Policies"]
            S3P["S3 Bucket Policy"]
            SQSP["SQS Queue Policy"]
            LAMP["Lambda Resource Policy"]
        end

        subgraph OTHER_P["Các Policy khác"]
            PBP["Permissions Boundary<br/>Giới hạn MAX"]
            SCP["SCP Organizations<br/>Giới hạn toàn account"]
            SESS["Session Policy"]
        end
    end

    IB -->|"gắn vào User/Group/Role"| EFFECT["Quyết định:<br/>Allow / Deny"]
    RB -->|"gắn vào Resource"| EFFECT
    OTHER_P -->|"giới hạn scope"| EFFECT

    style POLICY_TYPES fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style IB fill:#1c2833,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style RB fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style OTHER_P fill:#2c1810,color:#ecf0f1,stroke:#e67e22,stroke-width:2px
    style AMP fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style CMP fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style INL fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style S3P fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style SQSP fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style LAMP fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style PBP fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style SCP fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style SESS fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style EFFECT fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:3px
```

#### Cấu trúc của 1 Policy (JSON)

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
        "IpAddress": {
          "aws:SourceIp": "203.0.113.0/24"
        }
      }
    }
  ]
}
```

| Trường | Ý nghĩa | Bắt buộc? |
|--------|----------|-----------|
| **Effect** | `Allow` hoặc `Deny` | ✅ |
| **Action** | Hành động gì? (`s3:GetObject`, `ec2:*`) | ✅ |
| **Resource** | Trên resource nào? (ARN) | ✅ (Identity-based) |
| **Principal** | Ai? | ✅ (Resource-based) |
| **Condition** | Điều kiện gì? (IP, MFA, time...) | ❌ |

---

## Luồng xác thực & phân quyền

### Authentication (Xác thực - "Bạn là ai?")

```mermaid
graph LR
    USER_REQ["👤 Request đến AWS"]
    
    USER_REQ --> CONSOLE["🖥️ Console<br/>Username + Password + MFA"]
    USER_REQ --> CLI["⌨️ CLI/SDK<br/>Access Key + Secret Key"]
    USER_REQ --> ROLE_A["🎭 Role<br/>Temporary Credentials<br/>STS Token"]

    CONSOLE --> AUTH["✅ Authenticated"]
    CLI --> AUTH
    ROLE_A --> AUTH

    AUTH --> AUTHZ["➡️ Chuyển sang Authorization"]

    style USER_REQ fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style CONSOLE fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style CLI fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style ROLE_A fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style AUTH fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style AUTHZ fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
```

### Authorization (Phân quyền - "Bạn được phép làm gì?")

```mermaid
graph TB
    REQ["📨 API Request<br/>s3:GetObject"]
    
    REQ --> DENY_CHECK{"Có Explicit Deny<br/>trong ANY policy?"}
    DENY_CHECK -->|"CÓ"| DENIED["❌ DENIED<br/>Deny luôn thắng"]
    DENY_CHECK -->|"KHÔNG"| SCP_CHECK{"SCP cho phép?<br/>nếu dùng Organizations"}
    
    SCP_CHECK -->|"KHÔNG"| DENIED
    SCP_CHECK -->|"CÓ / N/A"| PB_CHECK{"Permissions Boundary<br/>cho phép?"}
    
    PB_CHECK -->|"KHÔNG"| DENIED
    PB_CHECK -->|"CÓ / N/A"| ALLOW_CHECK{"Có Explicit Allow<br/>trong Identity-based<br/>HOẶC Resource-based?"}
    
    ALLOW_CHECK -->|"CÓ"| ALLOWED["✅ ALLOWED"]
    ALLOW_CHECK -->|"KHÔNG"| DENIED_DEFAULT["❌ DENIED<br/>Default Deny"]

    style REQ fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style DENY_CHECK fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style SCP_CHECK fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style PB_CHECK fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style ALLOW_CHECK fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style DENIED fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:3px
    style DENIED_DEFAULT fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:3px
    style ALLOWED fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:3px
```

### Quy tắc vàng

```
1. Mặc định: TẤT CẢ đều bị DENY (Default Deny)
2. Explicit Allow ghi đè Default Deny
3. Explicit Deny LUÔN THẮNG Allow (Deny wins)
4. SCP/Permissions Boundary = "trần" (ceiling)
   → Chỉ GIỚI HẠN, KHÔNG CẤP quyền
```

---

## Multi-Account Architecture

### Với AWS Organizations + SCPs

```mermaid
graph TB
    subgraph ORG["🏢 AWS Organizations"]
        MGMT["🔧 Management Account<br/>Tạo Organization<br/>Quản lý SCPs<br/>Consolidated Billing"]

        subgraph ROOT_OU["📁 Root OU"]
            SCP_ROOT["SCP: DenyLeaveOrg"]

            subgraph PROD_OU["📁 Production OU"]
                SCP_PROD["SCP: DenyDeleteVPC"]
                ACC_PROD1["Account: Prod-App"]
                ACC_PROD2["Account: Prod-DB"]
            end

            subgraph DEV_OU["📁 Development OU"]
                SCP_DEV["SCP: DenyProdResources"]
                ACC_DEV1["Account: Dev-Team1"]
                ACC_DEV2["Account: Dev-Team2"]
            end

            subgraph SEC_OU["📁 Security OU"]
                SCP_SEC["SCP: DenyS3Public"]
                ACC_LOG["Account: Logging"]
                ACC_SEC["Account: Security-Tools"]
            end
        end
    end

    MGMT -->|"quản lý"| ROOT_OU
    SCP_ROOT -->|"áp dụng xuống<br/>kế thừa"| PROD_OU
    SCP_ROOT -->|"áp dụng xuống<br/>kế thừa"| DEV_OU
    SCP_ROOT -->|"áp dụng xuống<br/>kế thừa"| SEC_OU

    style ORG fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style ROOT_OU fill:#1c2833,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style MGMT fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style SCP_ROOT fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style PROD_OU fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style DEV_OU fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style SEC_OU fill:#3b1520,color:#ecf0f1,stroke:#e74c3c,stroke-width:2px
    style SCP_PROD fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:1px
    style SCP_DEV fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:1px
    style SCP_SEC fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:1px
    style ACC_PROD1 fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:1px
    style ACC_PROD2 fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:1px
    style ACC_DEV1 fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:1px
    style ACC_DEV2 fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:1px
    style ACC_LOG fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
    style ACC_SEC fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:1px
```

### SCP vs IAM Policy - Sự khác biệt

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   SCP (Organizations)          IAM Policy (Account)              │
│   ═══════════════════          ═════════════════════             │
│                                                                  │
│   • Áp dụng cho TOÀN account   • Áp dụng cho user/group/role     │
│   • Chỉ GIỚI HẠN (ceiling)     • CẤP QUYỀN (Allow/Deny)          │
│   • Không áp dụng cho          • Áp dụng cho mọi identity        │
│     Management Account           trong account                   │
│   • Kế thừa từ OU cha          • Không kế thừa                   │
│                                                                  │
│   Effective Permissions = SCP ∩ IAM Policy                       │
│   (Giao của 2 tập hợp)                                           │
│                                                                  │
│   ┌─────────────────────────────┐                                │
│   │        SCP Allow            │                                │
│   │    ┌──────────────┐         │                                │
│   │    │ ████████████ │←── Effective Permissions                 │
│   │    │ ████████████ │    (chỉ phần GIAO)                       │
│   │    └──────────────┘         │                                │
│   │         IAM Allow ──────────┤                                │
│   └─────────────────────────────┘                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tóm tắt: Ai / Cái gì / Bằng cách nào?

```mermaid
graph TB
    subgraph WHO["👤 AI TRUY CẬP? - Principal"]
        W1["Root User"]
        W2["IAM User"]
        W3["IAM Role"]
        W4["Federated User"]
        W5["AWS Service"]
    end

    subgraph HOW["📜 BẰNG CÁCH NÀO? - Policy"]
        H1["Identity-based Policy<br/>gắn vào User/Group/Role"]
        H2["Resource-based Policy<br/>gắn vào Resource"]
        H3["Permissions Boundary<br/>giới hạn User/Role"]
        H4["SCP<br/>giới hạn toàn Account"]
        H5["Session Policy<br/>giới hạn session"]
    end

    subgraph WHAT["🏗️ TRUY CẬP CÁI GÌ? - Resource"]
        R1["EC2, S3, RDS"]
        R2["Lambda, DynamoDB"]
        R3["SQS, SNS, Kinesis"]
        R4["VPC, CloudFront"]
        R5["IAM itself"]
    end

    WHO -->|"xác thực"| HOW
    HOW -->|"phân quyền"| WHAT

    style WHO fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style HOW fill:#2c1810,color:#ecf0f1,stroke:#e67e22,stroke-width:2px
    style WHAT fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style W1 fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style W2 fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style W3 fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style W4 fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style W5 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:2px
    style H1 fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style H2 fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style H3 fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style H4 fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style H5 fill:#0e6655,color:#fff,stroke:#16a085,stroke-width:2px
    style R1 fill:#2c3e50,color:#fff,stroke:#2ecc71,stroke-width:1px
    style R2 fill:#2c3e50,color:#fff,stroke:#2ecc71,stroke-width:1px
    style R3 fill:#2c3e50,color:#fff,stroke:#2ecc71,stroke-width:1px
    style R4 fill:#2c3e50,color:#fff,stroke:#2ecc71,stroke-width:1px
    style R5 fill:#2c3e50,color:#fff,stroke:#2ecc71,stroke-width:1px
```

---

## Best Practices

### 🔐 Security Best Practices

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AWS IAM BEST PRACTICES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1️⃣  ROOT USER                                                         │
│  ├── ✅ Enable MFA (dùng hardware key nếu được)                        │
│  ├── ✅ Xóa root access keys                                           │
│  ├── ❌ KHÔNG dùng root cho daily tasks                                 │
│  └── ❌ KHÔNG share root credentials                                    │
│                                                                         │
│  2️⃣  USERS & GROUPS                                                    │
│  ├── ✅ 1 user = 1 người thật (KHÔNG share accounts)                   │
│  ├── ✅ Dùng Groups để gán permissions (không gán trực tiếp cho user)  │
│  ├── ✅ Enable MFA cho tất cả users                                    │
│  └── ✅ Tạo strong password policy                                     │
│                                                                         │
│  3️⃣  PERMISSIONS                                                       │
│  ├── ✅ Least Privilege: chỉ cấp quyền TỐI THIỂU cần thiết           │
│  ├── ✅ Dùng AWS Managed Policies khi có thể                           │
│  ├── ✅ Review permissions định kỳ (IAM Access Analyzer)               │
│  ├── ✅ Dùng Conditions trong policies (IP, MFA, time...)              │
│  └── ❌ KHÔNG dùng wildcard (*) cho Actions và Resources               │
│                                                                         │
│  4️⃣  ROLES                                                             │
│  ├── ✅ Dùng Roles cho AWS services (EC2, Lambda...) thay vì Access Keys│
│  ├── ✅ Dùng Roles cho cross-account access                            │
│  ├── ✅ Dùng Roles cho federated users (SSO)                           │
│  └── ✅ Dùng External ID để chống Confused Deputy                      │
│                                                                         │
│  5️⃣  ACCESS KEYS                                                       │
│  ├── ✅ Rotate định kỳ (90 ngày)                                       │
│  ├── ✅ Remove unused keys                                              │
│  ├── ❌ KHÔNG commit vào source code                                    │
│  └── ❌ KHÔNG embed trong AMI/container                                 │
│                                                                         │
│  6️⃣  MONITORING & AUDITING                                             │
│  ├── ✅ Enable CloudTrail (log tất cả API calls)                       │
│  ├── ✅ Dùng IAM Access Analyzer (phát hiện unintended access)         │
│  ├── ✅ Review IAM Credential Report định kỳ                           │
│  └── ✅ Set up CloudWatch Alarms cho suspicious activities             │
│                                                                         │
│  7️⃣  ORGANIZATIONS (Multi-Account)                                     │
│  ├── ✅ Tách accounts theo môi trường (Dev/Staging/Prod)               │
│  ├── ✅ Dùng SCPs để enforce security guardrails                       │
│  ├── ✅ Centralized logging account                                     │
│  └── ✅ Dùng IAM Identity Center cho SSO                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Least Privilege Workflow

```mermaid
graph LR
    START["🚀 Bắt đầu:<br/>Cấp ZERO permissions"]
    START --> NEED["📋 Xác định:<br/>User cần làm gì?"]
    NEED --> GRANT["✅ Cấp quyền<br/>TỐI THIỂU"]
    GRANT --> TEST["🧪 Test:<br/>Hoạt động OK?"]
    TEST -->|"Thiếu quyền"| ADD["➕ Thêm quyền<br/>cần thiết"]
    ADD --> TEST
    TEST -->|"OK"| MONITOR["👀 Monitor:<br/>IAM Access Analyzer"]
    MONITOR -->|"Phát hiện<br/>unused permissions"| REMOVE["➖ Thu hồi<br/>quyền thừa"]
    REMOVE --> MONITOR

    style START fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style NEED fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style GRANT fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style TEST fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style ADD fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style MONITOR fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style REMOVE fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
```

---

## Công cụ hỗ trợ quản lý IAM

| Công cụ | Mục đích | Tần suất |
|---------|----------|----------|
| **IAM Credential Report** | Liệt kê tất cả users + trạng thái credentials | Định kỳ (monthly) |
| **IAM Access Advisor** | Xem services nào user đã/chưa access | Khi review permissions |
| **IAM Access Analyzer** | Phát hiện resources bị chia sẻ ra ngoài | Liên tục (automated) |
| **IAM Policy Simulator** | Test policies trước khi apply | Khi tạo/sửa policies |
| **CloudTrail** | Log tất cả API calls (ai, làm gì, khi nào) | Luôn bật |
| **AWS Config** | Track thay đổi cấu hình IAM | Luôn bật |

---

## Exam Tips (Cloud Practitioner / SAA)

> [!TIP]
> **Ghi nhớ nhanh:**
> - **Users** = người/app cụ thể, long-term credentials
> - **Groups** = nhóm users, KHÔNG nested, KHÔNG phải identity
> - **Roles** = temporary credentials, cho services/cross-account/federation
> - **Policies** = JSON documents, Allow/Deny, Deny luôn thắng
> - **SCP** = ceiling cho account, KHÔNG cấp quyền, KHÔNG áp dụng Management Account
> - **Root** = toàn quyền, KHÔNG dùng hàng ngày, MFA bắt buộc
> - **Least Privilege** = câu trả lời "an toàn" nhất trong mọi tình huống

> [!CAUTION]
> **Câu hỏi hay gặp lẫn:**
> - "Làm sao để EC2 truy cập S3?" → **IAM Role** (KHÔNG PHẢI Access Keys trên EC2)
> - "Làm sao để giới hạn toàn bộ account?" → **SCP** (cần Organizations)
> - "Group có phải identity không?" → **KHÔNG** (không dùng được trong Resource-based Policy)
> - "SCP có cấp quyền không?" → **KHÔNG** (chỉ giới hạn) 
> - "Permissions Boundary cấp quyền?" → **KHÔNG** (chỉ giới hạn MAX)

---

## Liên kết tài liệu

- [IAM chi tiết](./iam.md)
- [IAM Roles - Deep Dive](./iam-roles.md)
- [IAM Identity Center](./iam-identity-center.md)
- [AWS Organizations](./aws-organizations.md)
- [Security Groups](./security-groups.md)
- [S3 Security](./s3-security.md)
