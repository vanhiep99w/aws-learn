# AWS Elastic Beanstalk


## Mục lục

- [Tổng quan](#tổng-quan)
- [️ Kiến trúc Beanstalk](#kiến-trúc-beanstalk)
- [Supported Platforms](#supported-platforms)
- [Deployment Options](#deployment-options)
- [Beanstalk CLI (EB CLI)](#beanstalk-cli-eb-cli)
- [⚙️ Configuration](#configuration)
- [Beanstalk với RDS](#beanstalk-với-rds)
- [Monitoring & Logs](#monitoring-logs)
- [Pricing](#pricing)
- [Beanstalk vs ECS vs Lambda](#beanstalk-vs-ecs-vs-lambda)
- [⚠️ Limitations - Khi nào KHÔNG dùng Beanstalk](#limitations-khi-nào-không-dùng-beanstalk)
- [Best Practices](#best-practices)
- [Tổng kết](#tổng-kết)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Elastic Beanstalk** là dịch vụ **Platform as a Service (PaaS)** cho phép bạn deploy và quản lý applications mà **không cần lo về infrastructure**.

### Beanstalk làm gì?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL DEPLOYMENT                           │
│                                                                     │
│   Developer phải tự:                                                │
│   ├── Tạo VPC, Subnets                                              │
│   ├── Tạo EC2 instances                                             │
│   ├── Cài đặt runtime (Java, Node.js, Python...)                    │
│   ├── Configure Load Balancer                                       │
│   ├── Setup Auto Scaling                                            │
│   ├── Configure Security Groups                                     │
│   └── Deploy application code                                       │
│                                                                     │
│   😓 Tốn rất nhiều thời gian!                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    WITH ELASTIC BEANSTALK                           │
│                                                                     │
│   Developer chỉ cần:                                                │
│   └── Upload code → Done!                                           │
│                                                                     │
│   Beanstalk tự động:                                                │
│   ├── Provision EC2, Load Balancer, Auto Scaling                    │
│   ├── Cài đặt runtime phù hợp                                       │
│   ├── Deploy application                                            │
│   ├── Monitor health                                                │
│   └── Handle scaling                                                │
│                                                                     │
│   😊 Focus vào code, không lo infrastructure!                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Beanstalk vs Các Services Khác

| Service | Mô tả | Khi nào dùng |
|---------|-------|--------------|
| **EC2** | Full control, tự quản lý | Cần customize sâu |
| **Elastic Beanstalk** | PaaS, AWS quản lý infra | Deploy nhanh, standard apps |
| **ECS/EKS** | Container orchestration | Microservices, containers |
| **Lambda** | Serverless functions | Event-driven, short tasks |
| **Lightsail** | Simple VPS | Beginners, simple apps |

### Beanstalk vẫn dùng EC2 - Bạn có thể truy cập OS!

> ⚠️ **Quan trọng cho exam:** Elastic Beanstalk **tự động tạo và quản lý EC2**, nhưng bạn **vẫn có thể truy cập** các instances đó!

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Beanstalk: Managed nhưng vẫn có access                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Bạn thấy:                          Bên dưới (AWS tự tạo):                  │
│   ──────────                         ─────────────────────                   │
│                                                                              │
│   ┌─────────────────┐                ┌─────────────────────────────────────┐ │
│   │  Elastic        │   TỰ ĐỘNG      │  • EC2 instances  ← BẠN CÓ THỂ SSH! │ │
│   │  Beanstalk      │ ────────────►  │  • Auto Scaling Group               │ │
│   │  Environment    │   PROVISION    │  • Load Balancer (ALB/NLB)          │ │
│   │                 │                │  • Security Groups                  │ │
│   │  (Upload code)  │                │  • CloudWatch monitoring            │ │
│   └─────────────────┘                └─────────────────────────────────────┘ │
│                                                                              │
│   📍 AWS quản lý: Provisioning, scaling, patching, deployment                │
│   📍 Bạn vẫn có thể:                                                         │
│      • SSH vào EC2 instances (eb ssh)                                        │
│      • Xem EC2 trong console                                                 │
│      • Install thêm packages                                                 │
│      • Modify configurations                                                 │
│      • Access logs trực tiếp trên instance                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**So sánh mức độ access OS:**

| Service | Dùng EC2? | Access OS? | Level |
|---------|-----------|------------|-------|
| **EC2** | ✅ Tự tạo | ✅ Full control | IaaS |
| **Elastic Beanstalk** | ✅ AWS tạo | ✅ Có thể SSH, modify | PaaS |
| **Lambda** | ❌ Không | ❌ Không | Serverless |
| **Fargate** | ❌ Không | ❌ Không | Serverless Container |

> 🎯 **Exam tip:** Nếu đề bài yêu cầu "auto deploy" + "access to underlying OS" → **Elastic Beanstalk** là đáp án!

---

## Kiến trúc Beanstalk

### Các thành phần

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BEANSTALK COMPONENTS                             │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      APPLICATION                            │   │
│   │   (Container logic cho app - ví dụ: "my-web-app")           │   │
│   │                                                             │   │
│   │   ┌─────────────────────┐   ┌─────────────────────┐         │   │
│   │   │    ENVIRONMENT 1    │   │    ENVIRONMENT 2    │         │   │
│   │   │       (Dev)         │   │       (Prod)        │         │   │
│   │   │                     │   │                     │         │   │
│   │   │  ┌───────────────┐  │   │  ┌───────────────┐  │         │   │
│   │   │  │   Version 1   │  │   │  │   Version 2   │  │         │   │
│   │   │  │  (deployed)   │  │   │  │  (deployed)   │  │         │   │
│   │   │  └───────────────┘  │   │  └───────────────┘  │         │   │
│   │   └─────────────────────┘   └─────────────────────┘         │   │
│   │                                                             │   │
│   │   Application Versions: v1, v2, v3, v4 (stored in S3)       │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

| Component | Mô tả |
|-----------|-------|
| **Application** | Container logic, chứa environments và versions |
| **Environment** | Chạy 1 version của app (Dev, Staging, Prod) |
| **Application Version** | Code package được upload (stored in S3) |
| **Environment Configuration** | Settings cho environment (instance type, scaling...) |

### Environment Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT TYPES                                │
│                                                                     │
│   1. WEB SERVER ENVIRONMENT                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   Internet ──→ ELB ──→ Auto Scaling Group ──→ EC2 Instances │   │
│   │                              │                              │   │
│   │                         CloudWatch                          │   │
│   │                                                             │   │
│   │   Use case: Web apps, REST APIs                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   2. WORKER ENVIRONMENT                                             │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   SQS Queue ──→ Auto Scaling Group ──→ EC2 Instances        │   │
│   │                         │                                   │   │
│   │                    CloudWatch                               │   │
│   │                                                             │   │
│   │   Use case: Background jobs, async processing               │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Supported Platforms

Beanstalk hỗ trợ nhiều ngôn ngữ và platforms:

| Platform | Versions |
|----------|----------|
| **Java** | Java SE, Tomcat |
| **Python** | Python 3.x với WSGI |
| **Node.js** | Node.js với npm |
| **.NET** | .NET Core on Linux, .NET on Windows |
| **PHP** | PHP với Apache |
| **Ruby** | Ruby với Puma |
| **Go** | Go |
| **Docker** | Single/Multi-container Docker |
| **Custom** | Packer Builder |

---

## Deployment Options

### Deployment Policies

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT POLICIES                               │
│                                                                      │
│   1. ALL AT ONCE (Fastest, có downtime)                              │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │   [v1] [v1] [v1] [v1]  →  [v2] [v2] [v2] [v2]               │    │
│   │        ↓ Deploy v2 to all                                   │    │
│   │   ⚠️ Downtime trong lúc deploy                              │    │
│   │   ✅ Fastest deployment                                     │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   2. ROLLING (Batches, giảm capacity tạm thời)                       │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │   [v1] [v1] [v1] [v1]                                       │    │
│   │     ↓    ↓                                                  │    │
│   │   [v2] [v2] [v1] [v1]  →  [v2] [v2] [v2] [v2]               │    │
│   │                                                             │    │
│   │   ✅ No downtime                                            │    │
│   │   ⚠️ Capacity giảm trong lúc deploy                         │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   3. ROLLING WITH ADDITIONAL BATCH (No reduced capacity)             │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │   [v1] [v1] [v1] [v1] + [v2] (new batch)                    │    │
│   │                          ↓                                  │    │
│   │   [v2] [v1] [v1] [v1] + [v2]                                │    │
│   │     ↓    ↓                                                  │    │
│   │   [v2] [v2] [v2] [v2] (terminate extra)                     │    │
│   │                                                             │    │
│   │   ✅ Full capacity during deployment                        │    │
│   │   ⚠️ Tốn thêm cost cho extra instances                      │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   4. IMMUTABLE (New ASG, safest)                                     │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │   ASG 1: [v1] [v1] [v1] [v1] (existing)                     │    │
│   │                  +                                          │    │
│   │   ASG 2: [v2] [v2] [v2] [v2] (new, temporary)               │    │
│   │                  ↓                                          │    │
│   │   Merge ASG 2 into ASG 1, terminate old instances           │    │
│   │                                                             │    │
│   │   ✅ Fastest rollback (terminate new ASG)                   │    │
│   │   ✅ Full capacity                                          │    │
│   │   ⚠️ Double capacity cost during deployment                 │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   5. BLUE/GREEN (Separate environment)                               │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │   Blue (Prod):  [v1] [v1] [v1] [v1] ←── DNS                 │    │
│   │                                          │                   │   │
│   │   Green (New):  [v2] [v2] [v2] [v2]      │                   │   │
│   │                        ↓                  │                  │   │
│   │   Swap DNS ─────────────────────────────→│                   │   │
│   │                                                             │    │
│   │   ✅ Zero downtime                                          │    │
│   │   ✅ Easy rollback (swap back)                              │    │
│   │   ⚠️ Cần 2 environments (gấp đôi cost)                      │    │
│   └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### So sánh Deployment Policies

| Policy | Downtime | Deploy Time | Cost | Rollback |
|--------|----------|-------------|------|----------|
| **All at Once** | ✅ Yes | Fastest | Lowest | Redeploy |
| **Rolling** | ❌ No | Medium | Low | Redeploy |
| **Rolling + Batch** | ❌ No | Medium | +Extra batch | Redeploy |
| **Immutable** | ❌ No | Slow | Double | Fast (terminate ASG) |
| **Blue/Green** | ❌ No | Slow | Double | Fast (swap DNS) |

---

## Beanstalk CLI (EB CLI)

### Cài đặt

```bash
pip install awsebcli
eb --version
```

### Các lệnh thường dùng

```bash
# Initialize Beanstalk app
eb init

# Create environment
eb create my-env

# Deploy current code
eb deploy

# Open app in browser
eb open

# View logs
eb logs

# SSH vào EC2 instance
eb ssh

# View environment status
eb status

# Terminate environment
eb terminate my-env
```

### Workflow điển hình

```bash
# 1. Init project
cd my-app
eb init -p node.js-18 my-app-name

# 2. Create dev environment
eb create dev-env

# 3. Make changes to code
# ...edit code...

# 4. Deploy
eb deploy

# 5. Create production
eb create prod-env --single  # Single instance, no load balancer
```

---

## ⚙️ Configuration

### .ebextensions

Folder `.ebextensions/` chứa config files để customize environment:

```
my-app/
├── .ebextensions/
│   ├── 01-packages.config     # Install packages
│   ├── 02-environment.config  # Environment variables
│   └── 03-options.config      # Beanstalk options
├── app.js
└── package.json
```

**Ví dụ: Install packages**
```yaml
# .ebextensions/01-packages.config
packages:
  yum:
    git: []
    postgresql-devel: []
```

**Ví dụ: Environment variables**
```yaml
# .ebextensions/02-environment.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    DB_HOST: mydb.xxx.rds.amazonaws.com
```

**Ví dụ: Configure Auto Scaling**
```yaml
# .ebextensions/03-options.config
option_settings:
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Statistic: Average
    Unit: Percent
    UpperThreshold: 80
    LowerThreshold: 30
```

### Saved Configurations

```bash
# Save current config
eb config save my-config

# Apply saved config
eb config --cfg my-config
```

---

## Beanstalk với RDS

### Option 1: RDS trong Beanstalk (NOT recommended for prod)

```
┌──────────────────────────────────────────────────────────────────────┐
│   ⚠️ WARNING: RDS lifecycle tied to environment!                     │
│                                                                      │
│   Environment                                                        │
│   ├── EC2 Instances                                                  │
│   └── RDS Instance ← Bị XÓA khi terminate environment!               │
│                                                                      │
│   Use case: Dev/Test only                                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Option 2: RDS bên ngoài (Recommended for prod)

```
┌─────────────────────────────────────────────────────────────────────┐
│   ✅ RDS independent, can be shared across environments             │
│                                                                     │
│   Beanstalk Environment          External RDS                       │
│   ├── EC2 Instances ────────────→ RDS Instance                      │
│   └── (no RDS here)              (created separately)               │
│                                                                     │
│   - RDS survives environment termination                            │
│   - Can be shared between dev/prod                                  │
│   - Separate backup/maintenance                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```yaml
# .ebextensions/db-connection.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    DB_HOST: !Ref DBInstance  # External RDS endpoint
    DB_NAME: mydb
```

---

## Monitoring & Logs

### Health Monitoring

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HEALTH STATUS                                    │
│                                                                     │
│   🟢 OK         - All instances healthy                             │
│   🟡 Warning    - Some instances degraded                           │
│   🟠 Degraded   - Significant issues                                │
│   🔴 Severe     - Critical issues                                   │
│   ⚪ Grey       - Insufficient data                                 │
│                                                                     │
│   Enhanced Health Reporting:                                        │
│   ├── Instance health (CPU, memory, disk)                           │
│   ├── Application health (request latency, 5xx errors)              │
│   └── Environment health (deployment status)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Logs

```bash
# View recent logs
eb logs

# Request full logs (saved to S3)
eb logs --all

# Stream logs real-time
eb logs --stream
```

**Log locations trong EC2**:
```
/var/log/eb-engine.log        # Beanstalk engine logs
/var/log/eb-hooks.log         # Platform hooks
/var/log/nginx/access.log     # Web server access
/var/log/nginx/error.log      # Web server errors
/var/log/web.stdout.log       # Application stdout
```

---

## Pricing

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BEANSTALK PRICING                                │
│                                                                     │
│   Elastic Beanstalk = FREE!                                         │
│                                                                     │
│   Bạn chỉ trả tiền cho resources được tạo ra:                       │
│   ├── EC2 Instances                                                 │
│   ├── Elastic Load Balancer                                         │
│   ├── RDS (nếu dùng)                                                │
│   ├── S3 (lưu application versions)                                 │
│   └── CloudWatch (logs, metrics)                                    │
│                                                                     │
│   💡 Tip: Dùng Single Instance mode cho dev để tiết kiệm            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Beanstalk vs ECS vs Lambda

```
┌─────────────────────────────────────────────────────────────────────┐
│               WHEN TO USE WHAT?                                     │
│                                                                     │
│   ELASTIC BEANSTALK                                                 │
│   ├── Traditional web apps (Java, Node, Python...)                  │
│   ├── Team không quen containers                                    │
│   ├── Muốn deploy nhanh, không lo infrastructure                    │
│   └── Cần managed platform                                          │
│                                                                     │
│   ECS/EKS                                                           │
│   ├── Microservices architecture                                    │
│   ├── Container-based applications                                  │
│   ├── Cần fine-grained control                                      │
│   └── Team có kinh nghiệm Docker/K8s                                │
│                                                                     │
│   LAMBDA                                                            │
│   ├── Event-driven, short-running tasks                             │
│   ├── APIs với traffic không đều                                    │
│   ├── Không muốn quản lý servers                                    │
│   └── Pay per execution                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Limitations - Khi nào KHÔNG dùng Beanstalk

### 1 Environment = 1 Application = 1 Scaling Config

```
┌─────────────────────────────────────────────────────────────────────┐
│   ❌ BEANSTALK LIMITATION - KHÔNG THỂ:                              │
│                                                                     │
│   1 Environment chứa nhiều services với scaling khác nhau:          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │   Environment                                               │   │
│   │   ├── User Service (scale: 2-10)                            │   │
│   │   ├── Order Service (scale: 5-20)    ← KHÔNG ĐƯỢC!          │   │
│   │   └── Payment Service (scale: 1-3)                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Tất cả instances trong 1 environment scale CÙNG NHAU!             │
└─────────────────────────────────────────────────────────────────────┘
```

### Nếu có Microservices → Dùng ECS/EKS + CloudFormation

```
┌─────────────────────────────────────────────────────────────────────┐
│   ✅ ECS/EKS cho Microservices - Mỗi service scale RIÊNG BIỆT:      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │   ECS Cluster                                               │   │
│   │                                                             │   │
│   │   User Service    ──→ 2-10 tasks (containers)               │   │
│   │   Order Service   ──→ 5-20 tasks                            │   │
│   │   Payment Service ──→ 1-3 tasks                             │   │
│   │                                                             │   │
│   │   Mỗi service có scaling rules riêng!                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### CloudFormation có thể define được Microservices

```yaml
# cloudformation-ecs-microservices.yaml
Resources:
  MyCluster:
    Type: AWS::ECS::Cluster

  # User Service - Scale 2-10
  UserService:
    Type: AWS::ECS::Service
    Properties:
      DesiredCount: 2
      # ...

  UserAutoScaling:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MinCapacity: 2
      MaxCapacity: 10

  # Order Service - Scale 5-20 (khác với User Service!)
  OrderService:
    Type: AWS::ECS::Service
    Properties:
      DesiredCount: 5
      # ...

  OrderAutoScaling:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MinCapacity: 5
      MaxCapacity: 20
```

### So sánh: Beanstalk vs CloudFormation

| | Beanstalk | CloudFormation |
|---|-----------|----------------|
| **Mục đích** | Deploy single application | Define ANY AWS resources |
| **Input** | Application code | YAML/JSON template |
| **Microservices** | ❌ Không phù hợp | ✅ Full support với ECS |
| **Flexibility** | Limited (opinionated) | Full control |
| **Complexity** | Low | High |
| **Use case** | Monolith web app | Bất kỳ infrastructure nào |

### Khi nào dùng gì?

| Architecture | Recommended Tool |
|--------------|------------------|
| **Monolith app đơn giản** | ✅ Beanstalk |
| **Microservices (nhiều services)** | ✅ CloudFormation/CDK + ECS/EKS |
| **Complex infrastructure** | ✅ CloudFormation/CDK |

## Best Practices

### 1. Separate RDS from Beanstalk

```bash
# ❌ Don't create RDS inside Beanstalk for production
# ✅ Create RDS separately and connect via environment variables
```

### 2. Use saved configurations

```bash
# Save config for reuse
eb config save production-config

# Apply to new environment
eb create prod-env --cfg production-config
```

### 3. Use Blue/Green for production deploys

```bash
# Clone production environment
eb clone prod-env --clone_name prod-green

# Deploy new version to green
eb deploy prod-green

# Test green environment
# If OK, swap CNAMEs
eb swap prod-env --destination_name prod-green
```

### 4. Enable Enhanced Health Reporting

```yaml
# .ebextensions/health.config
option_settings:
  aws:elasticbeanstalk:healthreporting:system:
    SystemType: enhanced
```

### 5. Configure proper scaling

```yaml
option_settings:
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    UpperThreshold: 70
    LowerThreshold: 30
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ELASTIC BEANSTALK SUMMARY                          │
│                                                                     │
│   ✅ PaaS - Upload code, Beanstalk lo infrastructure                │
│   ✅ Supports: Java, Python, Node.js, PHP, Ruby, Go, Docker         │
│   ✅ Auto provisions: EC2, ELB, ASG, CloudWatch                     │
│   ✅ Multiple deployment policies (Rolling, Immutable, Blue/Green)  │
│   ✅ Free service - chỉ trả tiền cho resources                      │
│   ✅ .ebextensions để customize                                     │
│                                                                     │
│   📚 Learning Path:                                                 │
│   1. eb init → Tạo Beanstalk app                                    │
│   2. eb create → Tạo environment                                    │
│   3. eb deploy → Deploy code                                        │
│   4. .ebextensions → Customize configuration                        │
│   5. Blue/Green deployment cho production                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [Elastic Beanstalk Developer Guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/)
- [EB CLI Reference](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)
- [Deployment Policies](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.deploy-existing-version.html)
- [Configuration Options](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options.html)
