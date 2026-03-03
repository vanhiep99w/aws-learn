# AWS Service Catalog

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Kiến trúc và thành phần](#kiến-trúc-và-thành-phần)
- [Cách hoạt động](#cách-hoạt-động)
- [Portfolios và Products](#portfolios-và-products)
- [Constraints](#constraints)
- [Tích hợp với các dịch vụ AWS khác](#tích-hợp-với-các-dịch-vụ-aws-khác)
- [Use Cases](#use-cases)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Giới thiệu

**AWS Service Catalog** cho phép tổ chức **tạo và quản lý các catalog chứa IT services đã được phê duyệt** để sử dụng trên AWS. Nó giúp đạt được **governance** và **compliance** đồng thời cho phép users **self-service** provision resources.

### Vấn đề cần giải quyết

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    KHÔNG có Service Catalog                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Developer muốn tạo EC2 + RDS:                                              │
│                                                                              │
│   ┌─────────────┐     "Anh ơi, em cần         ┌─────────────┐                │
│   │  Developer  │ ─────────────────────────►  │    Ops/     │                │
│   └─────────────┘     EC2 + RDS với spec      │    Admin    │                │
│                       như này..."             └──────┬──────┘                │
│                                                      │                       │
│                                                      ▼                       │
│   ❌ Mất thời gian chờ đợi                    ┌─────────────┐                │
│   ❌ Ops phải làm thủ công                    │   Manual    │                │
│   ❌ Dễ sai cấu hình                          │   Setup     │                │
│   ❌ Không consistent                         └─────────────┘                │
│   ❌ Khó audit/track                                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    CÓ Service Catalog                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                          ┌─────────────────────────────┐   │
│   │  Developer  │ ───► Service Catalog ───►│  Pre-approved Templates     │   │
│   └─────────────┘      (Self-service)      │                             │   │
│                                            │  ☐ Web App (EC2+RDS)        │   │
│   ✅ Self-service                          │  ☐ Data Analytics Stack     │   │
│   ✅ Pre-approved, compliant               │  ☐ Dev Environment          │   │
│   ✅ Consistent deployments                │  ☐ ML Training Env          │   │
│   ✅ Automated                             └─────────────────────────────┘   │
│   ✅ Easy to audit                                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Lợi ích chính

| Lợi ích | Mô tả |
|---------|-------|
| **Governance** | Chỉ cho phép dùng resources đã được approve |
| **Compliance** | Đảm bảo tuân thủ security, cost policies |
| **Self-service** | Users tự provision mà không cần IT support |
| **Standardization** | Consistent configurations across organization |
| **Cost Control** | Giới hạn instance types, sizes, regions |

---

## Kiến trúc và thành phần

### Các thành phần chính

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     AWS Service Catalog Architecture                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ADMIN (IT/Platform Team)                            │
│                                   │                                          │
│                                   ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                         PORTFOLIO                                   │    │
│   │   "Data Science Tools"                                              │    │
│   │                                                                     │    │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │    │
│   │   │  PRODUCT 1  │  │  PRODUCT 2  │  │  PRODUCT 3  │                 │    │
│   │   │  ─────────  │  │  ─────────  │  │  ─────────  │                 │    │
│   │   │  SageMaker  │  │  EMR        │  │  Redshift   │                 │    │
│   │   │  Notebook   │  │  Cluster    │  │  Cluster    │                 │    │
│   │   │             │  │             │  │             │                 │    │
│   │   │ CFN Template│  │ CFN Template│  │ CFN Template│                 │    │
│   │   └─────────────┘  └─────────────┘  └─────────────┘                 │    │
│   │                                                                     │    │
│   │   + Constraints (Launch, Template, Notification)                    │    │
│   │   + Tags                                                            │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                   │                                          │
│                         Share with IAM Users/Groups                          │
│                                   │                                          │
│                                   ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                      END USERS (Developers)                         │    │
│   │                                                                     │    │
│   │   ┌───────────┐    Browse Catalog     ┌─────────────────────────┐   │    │
│   │   │   User    │ ─────────────────────►│  Available Products     │   │    │
│   │   └───────────┘    Launch Product     │  from shared Portfolios │   │    │
│   │                                       └─────────────────────────┘   │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Thành phần chi tiết

| Thành phần | Mô tả |
|------------|-------|
| **Portfolio** | Tập hợp các Products, được share cho users/groups |
| **Product** | IT service có thể deploy (CloudFormation template) |
| **Provisioned Product** | Instance của Product đã được deploy |
| **Constraint** | Rules giới hạn cách Product có thể được launch |
| **Launch Constraint** | IAM role dùng để launch product |
| **Tag Option** | Tags được tự động apply khi launch |

---

## Cách hoạt động

### Workflow cơ bản

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Service Catalog Workflow                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STEP 1: Admin tạo Portfolio + Products                                     │
│   ─────────────────────────────────────                                      │
│                                                                              │
│   ┌─────────────┐     ┌──────────────────────────────────────────────────┐   │
│   │   Admin     │────►│  Portfolio: "Development Environments"           │   │
│   └─────────────┘     │                                                  │   │
│                       │  Products:                                       │   │
│                       │  ├── Dev EC2 Instance (t3.micro - t3.large)      │   │
│                       │  ├── Dev RDS MySQL (db.t3.micro)                 │   │
│                       │  └── Dev S3 Bucket (encrypted, versioned)        │   │
│                       │                                                  │   │
│                       │  Constraints:                                    │   │
│                       │  └── Only us-east-1 and us-west-2                │   │
│                       └──────────────────────────────────────────────────┘   │
│                                                                              │
│   STEP 2: Admin share Portfolio với Users/Groups                             │
│   ──────────────────────────────────────────────                             │
│                                                                              │
│   Portfolio ───────► IAM Group: "Developers"                                 │
│                                                                              │
│   STEP 3: User browse và launch Product                                      │
│   ─────────────────────────────────────                                      │
│                                                                              │
│   ┌─────────────┐     ┌──────────────────────────────────────────────────┐   │
│   │  Developer  │────►│  Service Catalog Console                         │   │
│   └─────────────┘     │                                                  │   │
│                       │  Available Products:                             │   │
│                       │  ├── [Launch] Dev EC2 Instance                   │   │
│                       │  ├── [Launch] Dev RDS MySQL                      │   │
│                       │  └── [Launch] Dev S3 Bucket                      │   │
│                       └──────────────────────────────────────────────────┘   │
│                                                                              │
│   STEP 4: CloudFormation creates resources                                   │
│   ────────────────────────────────────────                                   │
│                                                                              │
│   Service Catalog ──► CloudFormation ──► EC2, RDS, S3, etc.                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### User không cần quyền trực tiếp!

```
┌──────────────────────────────────────────────────────────────────────────────┐
│              Key Concept: Launch Constraint (IAM Role)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User (Developer)                                                           │
│   └── IAM Policy: ONLY "servicecatalog:*"                                    │
│       └── KHÔNG có quyền ec2:*, rds:*, s3:*                                  │
│                                                                              │
│   Nhưng vẫn launch được??                                                    │
│                                                                              │
│   ┌─────────────┐    Launch     ┌────────────────────────────────────────┐   │
│   │  Developer  │──────────────►│  Service Catalog                       │   │
│   │  (No EC2    │               │                                        │   │
│   │   perms)    │               │  Uses: Launch Constraint IAM Role      │   │
│   └─────────────┘               │         (has EC2, RDS, S3 perms)       │   │
│                                 └──────────────────┬─────────────────────┘   │
│                                                    │                         │
│                                                    ▼                         │
│                                           ┌──────────────┐                   │
│                                           │     EC2      │  ✅ Created!      │
│                                           └──────────────┘                   │
│                                                                              │
│   🎯 User không cần quyền AWS trực tiếp, chỉ cần quyền Service Catalog!      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Portfolios và Products

### Portfolio

**Portfolio** là tập hợp các Products được nhóm lại theo business function, team, hoặc project.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Portfolio Examples                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Portfolio: "Web Applications"                                  │
│  ├── 3-Tier Web App (EC2 + ALB + RDS)                           │
│  ├── Serverless API (Lambda + API Gateway + DynamoDB)           │
│  └── Static Website (S3 + CloudFront)                           │
│                                                                 │
│  Portfolio: "Data & Analytics"                                  │
│  ├── Data Lake (S3 + Glue + Athena)                             │
│  ├── EMR Cluster                                                │
│  └── Redshift Cluster                                           │
│                                                                 │
│  Portfolio: "Machine Learning"                                  │
│  ├── SageMaker Notebook                                         │
│  ├── Training Environment                                       │
│  └── Inference Endpoint                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Product Versioning

Mỗi Product có thể có **nhiều versions**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Product Versioning                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Product: "3-Tier Web App"                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Version 1.0 (deprecated)                               │    │
│  │  └── EC2: t2.micro, RDS: db.t2.micro                    │    │
│  │                                                         │    │
│  │  Version 2.0 (active)                                   │    │
│  │  └── EC2: t3.micro, RDS: db.t3.micro, ALB added         │    │
│  │                                                         │    │
│  │  Version 3.0 (active - default)                         │    │
│  │  └── EC2: t3.small, RDS: db.t3.small, CloudWatch added  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  • Users có thể chọn version khi launch                         │
│  • Admin có thể deprecate/delete old versions                   │
│  • Provisioned products có thể update lên version mới           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Constraints

**Constraints** giới hạn cách Products có thể được launch.

### Các loại Constraints

| Loại | Mô tả |
|------|-------|
| **Launch Constraint** | IAM role dùng để launch (quan trọng nhất!) |
| **Template Constraint** | Giới hạn parameters trong CloudFormation |
| **Notification Constraint** | SNS topic nhận events |
| **Stack Set Constraint** | Deploy across multiple accounts/regions |

### Launch Constraint

```
┌─────────────────────────────────────────────────────────────────┐
│                    Launch Constraint                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Không có Launch Constraint:                                    │
│  ────────────────────────────                                   │
│  User cần có đầy đủ IAM permissions (ec2:*, rds:*, etc.)        │
│  → Không đạt được governance!                                    │
│                                                                 │
│  Có Launch Constraint:                                          │
│  ──────────────────────                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IAM Role: ServiceCatalogLaunchRole                       │  │
│  │                                                           │  │
│  │  {                                                        │  │
│  │    "Effect": "Allow",                                     │  │
│  │    "Action": [                                            │  │
│  │      "ec2:*",                                             │  │
│  │      "rds:*",                                             │  │
│  │      "cloudformation:*"                                   │  │
│  │    ],                                                     │  │
│  │    "Resource": "*"                                        │  │
│  │  }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  User chỉ cần: servicecatalog:ProvisionProduct                 │
│  → Governance đạt được! ✅                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Template Constraint

Giới hạn parameter choices trong CloudFormation template:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Template Constraint                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Original CloudFormation Parameters:                            │
│  ──────────────────────────────────                             │
│  InstanceType: [t3.micro, t3.small, t3.medium, t3.large,       │
│                 t3.xlarge, t3.2xlarge, m5.large, c5.xlarge...] │
│                                                                 │
│  Template Constraint (JSON):                                    │
│  ──────────────────────────                                     │
│  {                                                              │
│    "Rules": {                                                   │
│      "InstanceType": {                                          │
│        "Assertions": [{                                         │
│          "Assert": {                                            │
│            "Fn::Contains": [                                    │
│              ["t3.micro", "t3.small", "t3.medium"],            │
│              {"Ref": "InstanceType"}                            │
│            ]                                                    │
│          }                                                      │
│        }]                                                       │
│      }                                                          │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  User chỉ thấy: [t3.micro, t3.small, t3.medium]                │
│  → Cost control! 💰                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tích hợp với các dịch vụ AWS khác

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   Service Catalog Integrations                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              Service Catalog                                  │
│                                    │                                         │
│     ┌──────────────────────────────┼──────────────────────────────┐         │
│     │              │               │               │              │         │
│     ▼              ▼               ▼               ▼              ▼         │
│  ┌──────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐    │
│  │ CFN  │    │   AWS    │    │   AWS    │    │   SNS   │    │  AWS    │    │
│  │      │    │  Config  │    │  Orgs    │    │         │    │  SSM    │    │
│  │Deploy│    │Compliance│    │Multi-acc │    │ Notify  │    │  Docs   │    │
│  └──────┘    └──────────┘    └──────────┘    └─────────┘    └─────────┘    │
│                                                                              │
│  CloudFormation: Underlying engine để deploy                                 │
│  AWS Config: Track compliance của provisioned products                       │
│  AWS Organizations: Share portfolios across accounts                         │
│  SNS: Notifications khi products được launch/update                          │
│  SSM Documents: Automation documents trong products                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Sharing với AWS Organizations

```
┌─────────────────────────────────────────────────────────────────┐
│              Portfolio Sharing across Accounts                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                  Management Account                             │
│                  ┌─────────────────┐                           │
│                  │  Portfolio:     │                           │
│                  │  "Approved      │                           │
│                  │   Resources"    │                           │
│                  └────────┬────────┘                           │
│                           │                                     │
│            Share via AWS Organizations                          │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         │                 │                 │                  │
│         ▼                 ▼                 ▼                  │
│   ┌───────────┐    ┌───────────┐    ┌───────────┐             │
│   │  Dev      │    │  Staging  │    │   Prod    │             │
│   │  Account  │    │  Account  │    │  Account  │             │
│   │           │    │           │    │           │             │
│   │ Imported  │    │ Imported  │    │ Imported  │             │
│   │ Portfolio │    │ Portfolio │    │ Portfolio │             │
│   └───────────┘    └───────────┘    └───────────┘             │
│                                                                 │
│   ✅ Centralized governance                                    │
│   ✅ Consistent across all accounts                            │
│   ✅ Update once, applies everywhere                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### 1. Developer Self-Service Portal

```
Scenario: Developers cần environments nhanh chóng
Solution: Service Catalog với pre-approved dev stacks
Benefits:
  • Developers tự provision trong vài phút
  • IT không bị bottleneck
  • Consistent, compliant environments
```

### 2. Cost Control

```
Scenario: Ngăn developers dùng expensive instance types
Solution: Template Constraints giới hạn options
Benefits:
  • Chỉ cho phép t3.micro - t3.medium
  • Block production-grade instances trong dev
  • Budget predictable
```

### 3. Compliance/Governance

```
Scenario: Healthcare company cần HIPAA compliance
Solution: Pre-approved templates với encryption, logging
Benefits:
  • All resources encrypted by default
  • CloudTrail logging enabled
  • VPC flow logs configured
```

### 4. Multi-Account Standardization

```
Scenario: Enterprise với 50+ AWS accounts
Solution: Share portfolios via AWS Organizations
Benefits:
  • Single source of truth
  • Update once, deploy everywhere
  • Consistent naming, tagging
```

---

## Pricing

### Mô hình giá

| Component | Chi phí |
|-----------|---------|
| **Service Catalog** | ✅ **Miễn phí** |
| **API Calls** | ✅ **Miễn phí** |
| **Resources deployed** | 💰 Trả theo resources thực tế (EC2, RDS, etc.) |

> 💡 **Key point:** Service Catalog itself is FREE! Bạn chỉ trả cho resources được provision.

---

## Best Practices

### 1. Portfolio Organization

| Practice | Mô tả |
|----------|-------|
| **Group by function** | Portfolios theo team/use case (Web, Data, ML) |
| **Naming conventions** | Consistent naming cho portfolios và products |
| **Version management** | Deprecate old versions, set defaults |
| **Documentation** | Clear descriptions cho mỗi product |

### 2. Security

```
┌─────────────────────────────────────────────────────────────────┐
│                   Security Best Practices                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Always use Launch Constraints                               │
│     → Users không cần quyền AWS trực tiếp                       │
│                                                                 │
│  ✅ Least privilege cho Launch Role                             │
│     → Chỉ cho quyền cần thiết cho product                       │
│                                                                 │
│  ✅ Template Constraints cho cost control                        │
│     → Giới hạn instance types, sizes                            │
│                                                                 │
│  ✅ Tag Options cho tracking                                     │
│     → Mandatory tags: CostCenter, Owner, Environment            │
│                                                                 │
│  ✅ Review và audit regularly                                    │
│     → Check provisioned products, unused resources               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Governance

- **Review templates** trước khi add vào catalog
- **Test thoroughly** trước khi share với production accounts
- **Monitor usage** via CloudTrail và CloudWatch
- **Regular updates** để patch security vulnerabilities

---

## Exam Tips

### Key Points for AWS Exams

1. **Mục đích chính**
   - Governance + Self-service
   - Pre-approved, compliant resources
   - Users không cần quyền AWS trực tiếp

2. **Core Concepts**
   - Portfolio = Collection of Products
   - Product = CloudFormation template
   - Launch Constraint = IAM role để launch

3. **Key Feature: Launch Constraint**
   - Users chỉ cần `servicecatalog:*` permissions
   - Launch Constraint Role có quyền AWS (ec2, rds, etc.)
   - = Governance achieved!

4. **Sharing**
   - Share portfolios via AWS Organizations
   - Cross-account governance

5. **Pricing**
   - Service Catalog = FREE
   - Pay for resources provisioned

### Common Exam Scenarios

| Scenario | Answer |
|----------|--------|
| Developers need self-service with governance | AWS Service Catalog |
| Restrict EC2 instance types for cost | Template Constraints |
| Users deploy without direct AWS perms | Launch Constraints |
| Share approved resources across accounts | Portfolio sharing via Organizations |
| Compliant infrastructure deployment | Pre-approved templates in Service Catalog |

---

## So sánh với các dịch vụ khác

| Feature | Service Catalog | CloudFormation | Control Tower |
|---------|----------------|----------------|---------------|
| **Purpose** | Self-service + Governance | Infrastructure as Code | Account governance |
| **User target** | End users (developers) | DevOps/Admins | Security/Compliance |
| **Abstraction** | High (curated products) | Low (raw templates) | High (guardrails) |
| **Multi-account** | Via Organizations | Via StackSets | Native |

---

## Liên kết liên quan

- [AWS CloudFormation](./cloudformation.md)
- [AWS Organizations](./aws-organizations.md)
- [AWS Config](./aws-config.md)
- [IAM](./iam.md)
