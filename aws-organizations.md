# AWS Organizations

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

#### Strategy 2: Allow List

Remove `FullAWSAccess`, chỉ **explicitly allow** những services cần thiết.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "s3:*",
        "rds:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3.4. Ví dụ SCPs thực tế

#### Restrict Regions (chỉ cho phép ap-southeast-1)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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
        }
      }
    }
  ]
}
```

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
```

---

## 4. Các loại Policies khác

### 4.1. Tag Policies

Đảm bảo **consistent tagging** across tất cả accounts.

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

**Use cases:**
- Enforce cost allocation tags (`CostCenter`, `Project`, `Team`)
- Standardize naming conventions
- Enable compliance reporting

### 4.2. Backup Policies

Quản lý **backup plans centrally** cho tất cả accounts.

```json
{
  "plans": {
    "DailyBackupPlan": {
      "regions": {
        "@@assign": ["ap-southeast-1"]
      },
      "rules": {
        "DailyRule": {
          "schedule_expression": {"@@assign": "cron(0 5 ? * * *)"},
          "target_backup_vault_name": {"@@assign": "Default"},
          "lifecycle": {
            "delete_after_days": {"@@assign": "35"}
          }
        }
      },
      "selections": {
        "tags": {
          "BackupRequired": {
            "iam_role_arn": {"@@assign": "arn:aws:iam::$account:role/BackupRole"},
            "tag_key": {"@@assign": "Backup"},
            "tag_value": {"@@assign": ["required", "true"]}
          }
        }
      }
    }
  }
}
```

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
