# AWS Developer Tools (Code* Services)


## Mục lục

- [Tổng Quan](#tổng-quan)
- [So Sánh Các Services](#so-sánh-các-services)
- [Config Files: buildspec.yml vs appspec.yml](#config-files-buildspecyml-vs-appspecyml)
- [Khái Niệm](#khái-niệm)
- [Đặc Điểm Chính](#đặc-điểm-chính)
- [Authentication](#authentication)
- [Cross-Account Access](#cross-account-access)
- [Triggers & Notifications](#triggers-notifications)
- [Khái Niệm](#khái-niệm)
- [Build Triggers](#build-triggers)
- [buildspec.yml](#buildspecyml)
- [Phases Chi Tiết](#phases-chi-tiết)
- [Environment Variables](#environment-variables)
- [Build trong VPC](#build-trong-vpc)
- [Khái Niệm](#khái-niệm)
- [Deployment Targets](#deployment-targets)
- [CodeDeploy Agent](#codedeploy-agent)
- [appspec.yml (EC2/On-premises)](#appspecyml-ec2on-premises)
- [Deployment Hooks Lifecycle](#deployment-hooks-lifecycle)
- [Deployment Strategies](#deployment-strategies)
- [appspec.yml (Lambda)](#appspecyml-lambda)
- [appspec.yml (ECS)](#appspecyml-ecs)
- [Rollback Strategies](#rollback-strategies)
- [Khái Niệm](#khái-niệm)
- [Pipeline Structure](#pipeline-structure)
- [Artifacts và S3](#artifacts-và-s3)
- [Action Types](#action-types)
- [CloudWatch Events Integration](#cloudwatch-events-integration)
- [Parallel và Sequential Actions](#parallel-và-sequential-actions)
- [Khái Niệm](#khái-niệm)
- [Supported Package Types](#supported-package-types)
- [Usage Example](#usage-example)
- [Upstream Repositories](#upstream-repositories)
- [Khái Niệm](#khái-niệm)
- [Components](#components)
- [CodeGuru Reviewer Integration](#codeguru-reviewer-integration)
- [Khái Niệm](#khái-niệm)
- [Features](#features)
- [Key Points for AWS Certification](#key-points-for-aws-certification)
- [Common Scenarios](#common-scenarios)

---

> AWS Developer Tools là bộ công cụ CI/CD hoàn chỉnh giúp tự động hóa quy trình phát triển phần mềm từ source code đến deployment.

## Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS CodePipeline                                │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │ CodeCommit   │ → │ CodeBuild    │ → │ CodeDeploy   │                 │
│  │   (Source)   │   │   (Build)    │   │  (Deploy)    │                 │
│  └──────────────┘   └──────────────┘   └──────────────┘                 │
│         ↑                  ↑                  ↑                         │
│    Git Repository    Build & Test       Deploy to EC2,                  │
│                                         ECS, Lambda...                  │
└─────────────────────────────────────────────────────────────────────────┘
                              ↑
                    CodeArtifact (Package Management)
                    CodeGuru (Code Review AI)
                    CodeStar (Project Management)
```

## So Sánh Các Services

| Service | Mục đích | Tương đương |
|---------|----------|-------------|
| **CodeCommit** | Git repository | GitHub, GitLab |
| **CodeBuild** | Build & test | Jenkins, CircleCI |
| **CodeDeploy** | Deployment automation | Ansible, Octopus |
| **CodePipeline** | CI/CD orchestration | Jenkins Pipeline, GitLab CI |
| **CodeArtifact** | Package management | Nexus, Artifactory |
| **CodeGuru** | AI code review | SonarQube |
| **CodeStar** | Project management | Azure DevOps |

## Config Files: buildspec.yml vs appspec.yml

AWS tách riêng Build và Deploy thành các services khác nhau, mỗi service có **config file riêng**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Config Files                                 │
│                                                                     │
│   CodeBuild                         CodeDeploy                      │
│   ┌─────────────────┐              ┌─────────────────┐              │
│   │ buildspec.yml   │              │ appspec.yml     │              │
│   │                 │              │                 │              │
│   │ - Build steps   │              │ - Deploy steps  │              │
│   │ - Install deps  │              │ - Copy files    │              │
│   │ - Run tests     │              │ - Run hooks     │              │
│   │ - Create output │              │ - Permissions   │              │
│   └─────────────────┘              └─────────────────┘              │
│                                                                     │
│   📍 Root of source                📍 Root of artifact              │
└─────────────────────────────────────────────────────────────────────┘
```

| | **buildspec.yml** | **appspec.yml** |
|--|-------------------|-----------------|
| **Service** | CodeBuild | CodeDeploy |
| **Mục đích** | Define build steps | Define deployment steps |
| **Phases** | install, pre_build, build, post_build | Hooks: BeforeInstall, AfterInstall, etc. |
| **Output** | Artifacts (files để deploy) | Deployed application |
| **Location** | Root của source code | Root của artifact bundle |

### Project Structure Example

```
my-project/
├── buildspec.yml      ← CodeBuild đọc file này
├── appspec.yml        ← CodeDeploy đọc file này  
├── scripts/
│   ├── install_deps.sh
│   ├── stop_server.sh
│   └── start_server.sh
└── src/
    └── application code...
```

### Complete Flow

```
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  Source     │        │   Build     │        │   Deploy    │
│  Code       │        │             │        │             │
│             │        │ CodeBuild   │        │ CodeDeploy  │
│ buildspec   │───────►│ reads       │───────►│ reads       │
│ appspec     │        │ buildspec   │   S3   │ appspec     │
│ src/        │        │             │artifact│             │
└─────────────┘        └─────────────┘        └─────────────┘
```

> [!NOTE]
> Cả 2 files đều nằm trong **source code repository**, nhưng được đọc bởi **services khác nhau** ở **stages khác nhau** của pipeline!

---

# 1️⃣ AWS CodeCommit

## Khái Niệm

**CodeCommit** là dịch vụ Git repository được quản lý hoàn toàn bởi AWS.

> [!NOTE]
> **Update 2024**: AWS đã thông báo CodeCommit sẽ không nhận thêm khách hàng mới. Khuyến nghị sử dụng GitHub, GitLab, hoặc Bitbucket thay thế.

## Đặc Điểm Chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Fully Managed** | Không cần quản lý infrastructure |
| **Highly Available** | Multi-AZ replication |
| **Secure** | Encryption at rest (KMS), in-transit (HTTPS/SSH) |
| **Scalable** | Không giới hạn repositories |
| **Integration** | Tích hợp với AWS services |

## Authentication

```
┌─────────────────────────────────────────────────────────┐
│                   CodeCommit Auth                       │
├─────────────────────────────────────────────────────────┤
│  1. HTTPS Git Credentials                               │
│     └── IAM Console → Generate credentials              │
│                                                         │
│  2. SSH Keys                                            │
│     └── IAM Console → Upload SSH public key             │
│                                                         │
│  3. AWS CLI Credential Helper                           │
│     └── git config --global credential.helper           │
│         '!aws codecommit credential-helper $@'          │
└─────────────────────────────────────────────────────────┘
```

## Cross-Account Access

```yaml
# Account B muốn access repo ở Account A
# Step 1: Account A - Tạo IAM Role với trust policy
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::ACCOUNT_B_ID:root"
  },
  "Action": "sts:AssumeRole"
}

# Step 2: Account B - User assume role
aws sts assume-role --role-arn arn:aws:iam::ACCOUNT_A_ID:role/CrossAccountRole
```

## Triggers & Notifications

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  CodeCommit  │ ──► │ EventBridge     │ ──► │ Lambda       │
│  Events:     │     │ (CloudWatch)    │     │ SNS          │
│  - Push      │     └─────────────────┘     │ CodePipeline │
│  - Branch    │                             └──────────────┘
│  - PR        │
└──────────────┘
```

---

# 2️⃣ AWS CodeBuild

## Khái Niệm

**CodeBuild** là dịch vụ build được quản lý hoàn toàn, tự động scale và chỉ tính tiền khi build.

```
┌─────────────────────────────────────────────────────────────┐
│                      CodeBuild Flow                         │
│                                                             │
│  Source        Build Environment        Output              │
│  ┌─────┐      ┌─────────────────┐      ┌───────────┐        │
│  │Code │ ──►  │ Docker Container│ ──►  │ Artifacts │        │
│  │Commit│      │ (Managed/Custom)│      │ (S3)     │        │
│  │S3   │      │                 │      │           │        │
│  │GitHub     │ buildspec.yml   │      │ Reports    │        │
│  └─────┘      └─────────────────┘      └───────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Build Triggers

CodeBuild có thể được trigger theo nhiều cách:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CodeBuild Trigger Methods                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. CodePipeline (Phổ biến nhất)                                    │
│     ┌──────────┐    ┌────────────┐    ┌───────────┐                 │
│     │CodeCommit│───►│CodePipeline│───►│ CodeBuild │                 │
│     │ GitHub   │    │            │    │           │                 │
│     └──────────┘    └────────────┘    └───────────┘                 │
│                                                                     │
│  2. EventBridge (CloudWatch Events)                                 │
│     ┌──────────┐    ┌────────────┐    ┌───────────┐                 │
│     │CodeCommit│───►│EventBridge │───►│ CodeBuild │                 │
│     │ S3 Event │    │   Rule     │    │           │                 │
│     └──────────┘    └────────────┘    └───────────┘                 │
│                                                                     │
│  3. GitHub/Bitbucket Webhooks                                       │
│     ┌──────────┐    ┌────────────┐    ┌───────────┐                 │
│     │  GitHub  │───►│  Webhook   │───►│ CodeBuild │                 │
│     │ Bitbucket│    │            │    │           │                 │
│     └──────────┘    └────────────┘    └───────────┘                 │
│                                                                     │
│  4. Manual / CLI / SDK                                              │
│     aws codebuild start-build --project-name my-project             │
│                                                                     │
│  5. Scheduled (via EventBridge)                                     │
│     cron(0 8 * * ? *) → Build daily at 8 AM UTC                     │
│                                                                     │
│  6. Lambda / Step Functions                                         │
│     Lambda gọi codebuild:StartBuild API                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Trigger Methods Summary

| Trigger Method | Use Case | Configuration |
|---------------|----------|---------------|
| **CodePipeline** | CI/CD pipeline tự động | Build stage trong pipeline |
| **Webhooks** | GitHub/Bitbucket direct integration | Enable trong CodeBuild project |
| **EventBridge** | CodeCommit, S3 changes, scheduled | EventBridge Rule → CodeBuild target |
| **Manual/CLI** | Testing, on-demand builds | `aws codebuild start-build` |
| **Lambda** | Custom logic triggers | Call `StartBuild` API |
| **Step Functions** | Orchestrated workflows | CodeBuild integration |

### EventBridge Rule Example

```json
{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "detail": {
    "event": ["referenceCreated", "referenceUpdated"],
    "referenceType": ["branch"],
    "referenceName": ["main", "develop"]
  }
}
```

### Webhook Events (GitHub/Bitbucket)

| Event Type | Description |
|------------|-------------|
| **PUSH** | Trigger on git push |
| **PULL_REQUEST_CREATED** | Trigger when PR created |
| **PULL_REQUEST_UPDATED** | Trigger when PR updated |
| **PULL_REQUEST_MERGED** | Trigger when PR merged |

> [!TIP]
> Sử dụng **Filter Groups** để control chính xác khi nào build được trigger (ví dụ: chỉ build khi push vào branch `main` hoặc khi file path match pattern).

## buildspec.yml

File cấu hình build, phải đặt ở **root của source code** hoặc chỉ định path.

```yaml
version: 0.2

env:
  variables:
    JAVA_HOME: "/usr/lib/jvm/java-11-openjdk"
  parameter-store:
    DB_PASSWORD: "/app/db/password"
  secrets-manager:
    API_KEY: "prod/api-key"

phases:
  install:
    runtime-versions:
      java: corretto11
      nodejs: 16
    commands:
      - echo "Installing dependencies..."
      - npm install
  
  pre_build:
    commands:
      - echo "Running tests..."
      - npm test
      - echo "Logging in to ECR..."
      - aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
  
  build:
    commands:
      - echo "Building application..."
      - npm run build
      - docker build -t $IMAGE_TAG .
  
  post_build:
    commands:
      - echo "Pushing to ECR..."
      - docker push $ECR_URI:$IMAGE_TAG

artifacts:
  files:
    - '**/*'
  base-directory: dist
  discard-paths: no

reports:
  junit-reports:
    files:
      - 'test-results/**/*.xml'
    file-format: JUNITXML

cache:
  paths:
    - 'node_modules/**/*'
    - '/root/.m2/**/*'
```

## Phases Chi Tiết

| Phase | Mô tả | Use Cases |
|-------|-------|-----------|
| **install** | Cài đặt dependencies | npm install, pip install |
| **pre_build** | Chuẩn bị trước build | Login ECR, run tests |
| **build** | Build chính | Compile, docker build |
| **post_build** | Sau khi build | Push images, deploy |

## Environment Variables

```
┌─────────────────────────────────────────────────────────────┐
│             Environment Variables Sources                   │
├─────────────────────────────────────────────────────────────┤
│  1. Plaintext (buildspec.yml)                               │
│     └── Không nên dùng cho sensitive data                   │
│                                                             │
│  2. SSM Parameter Store                                     │
│     └── parameter-store: KEY: "/path/to/param"              │
│                                                             │
│  3. Secrets Manager                                         │
│     └── secrets-manager: KEY: "secret-name"                 │
│                                                             │
│  4. Build Project Settings                                  │
│     └── Console/CLI configuration                           │
└─────────────────────────────────────────────────────────────┘
```

## Build trong VPC

```
┌─────────────────────────────────────────────────────────────┐
│                         VPC                                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Private Subnet                         │   │
│   │    ┌────────────┐        ┌────────────┐             │   │
│   │    │ CodeBuild  │ ────►  │ RDS/        │            │   │
│   │    │ Container  │        │ ElastiCache │            │   │
│   │    └────────────┘        └────────────┘             │   │
│   │          │                                          │   │
│   │          ▼                                          │   │
│   │    ┌────────────┐                                   │   │
│   │    │ NAT Gateway│ ──► Internet (for packages)       │   │
│   │    └────────────┘                                   │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Khi chạy CodeBuild trong VPC, cần NAT Gateway hoặc VPC Endpoints để access AWS services và download dependencies.

---

# 3️⃣ AWS CodeDeploy

## Khái Niệm

**CodeDeploy** tự động hóa việc deploy application đến EC2, Lambda, ECS, On-premises servers.

## Deployment Targets

```
┌─────────────────────────────────────────────────────────────┐
│                  CodeDeploy Targets                         │
├───────────────┬─────────────────────────────────────────────┤
│ EC2/On-prem   │ - CodeDeploy Agent required                 │
│               │ - appspec.yml at root                       │
│               │ - In-place or Blue/Green                    │
├───────────────┼─────────────────────────────────────────────┤
│ Lambda        │ - Traffic shifting                          │
│               │ - Canary, Linear, AllAtOnce                 │
│               │ - No agent needed                           │
├───────────────┼─────────────────────────────────────────────┤
│ ECS           │ - Blue/Green only                           │
│               │ - Task definition update                    │
│               │ - Load balancer traffic shift               │
└───────────────┴─────────────────────────────────────────────┘
```

## CodeDeploy Agent

### Tại sao cần Agent?

CodeDeploy service nằm trên AWS Cloud, nhưng EC2/server là máy riêng biệt. **Agent** đóng vai trò "tai mắt và tay chân" của CodeDeploy trên server:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CodeDeploy Agent Flow                            │
│                                                                     │
│   AWS Cloud                           Your EC2/On-prem              │
│   ┌─────────────┐                    ┌─────────────────────┐        │
│   │ CodeDeploy  │ ◄─── polling ───── │ CodeDeploy Agent    │        │
│   │ Service     │    "Có việc gì?"   │ (chạy trên server)  │        │
│   │             │                    │                     │        │
│   │             │ ─── "Deploy!" ───► │  → Download bundle  │        │
│   │             │                    │  → Run appspec.yml  │        │
│   │             │ ◄─── "Done!" ───── │  → Execute hooks    │        │
│   └─────────────┘                    └─────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### Tại sao dùng Agent thay vì SSH?

| | **SSH Approach** | **Agent Approach** ✅ |
|--|------------------|----------------------|
| **Connection** | Push: AWS SSH vào server | Pull: Agent polling từ server |
| **Security** | Mở port 22, quản lý SSH keys | Chỉ HTTPS outbound (443) |
| **Firewall** | Allow inbound SSH | Không cần mở inbound port |
| **Scaling** | Khó scale nhiều servers | Dễ scale - mỗi agent tự polling |
| **Key mgmt** | Phức tạp | Dùng IAM Role |

```
SSH (❌ Rủi ro):                    Agent (✅ An toàn):
┌──────────┐   SSH (22)            ┌──────────┐   HTTPS (443)
│CodeDeploy│ ───────────►          │CodeDeploy│ ◄───────────
│          │   Inbound             │          │   Outbound only
└──────────┘   Port mở!            └──────────┘   Không mở port!
```

### Cài đặt Agent

```bash
# Amazon Linux / RHEL
sudo yum install -y ruby wget
wget https://aws-codedeploy-REGION.s3.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto

# Ubuntu / Debian  
sudo apt-get install -y ruby wget
wget https://aws-codedeploy-REGION.s3.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto

# Kiểm tra agent
sudo service codedeploy-agent status
```

### Agent Requirements

| Target | Agent? | Lý do |
|--------|--------|-------|
| **EC2** | ✅ Cần | Agent nhận lệnh và thực thi deploy |
| **On-premises** | ✅ Cần | Như EC2 |
| **Lambda** | ❌ Không | AWS quản lý, chỉ update function |
| **ECS** | ❌ Không | Deploy qua Task Definition |

> [!IMPORTANT]
> EC2 instance cần **IAM Role** với quyền:
> - `s3:GetObject` - Download artifacts
> - `codedeploy:*` - Giao tiếp với CodeDeploy service

## appspec.yml (EC2/On-premises)

```yaml
version: 0.0
os: linux

files:
  - source: /
    destination: /var/www/html
  - source: /config/nginx.conf
    destination: /etc/nginx/nginx.conf

permissions:
  - object: /var/www/html
    owner: www-data
    group: www-data
    mode: 755

hooks:
  ApplicationStop:
    - location: scripts/stop_server.sh
      timeout: 300
      runas: root

  BeforeInstall:
    - location: scripts/install_dependencies.sh
      timeout: 300

  AfterInstall:
    - location: scripts/change_permissions.sh
      timeout: 300

  ApplicationStart:
    - location: scripts/start_server.sh
      timeout: 300

  ValidateService:
    - location: scripts/validate_service.sh
      timeout: 300
```

## Deployment Hooks Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                    EC2 Deployment Lifecycle                      │
│                                                                  │
│  ┌─────────────────┐                                             │
│  │ ApplicationStop │  ← Stop current application                 │
│  └────────┬────────┘                                             │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ DownloadBundle  │  ← Download from S3/GitHub (built-in)       │
│  └────────┬────────┘                                             │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ BeforeInstall   │  ← Decrypt files, backup                    │
│  └────────┬────────┘                                             │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ Install         │  ← Copy files (built-in)                    │
│  └────────┬────────┘                                             │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ AfterInstall    │  ← Configure, change permissions            │
│  └────────┬────────┘                                             │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ ApplicationStart│  ← Start services                           │
│  └────────┬────────┘                                             │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ ValidateService │  ← Health checks                            │
│  └─────────────────┘                                             │
└──────────────────────────────────────────────────────────────────┘
```

## Deployment Strategies

CodeDeploy có các deployment strategies khác nhau cho từng target:

```
┌─────────────────────────────────────────────────────────────────────┐
│              All Deployment Strategies by Target                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  EC2/On-premises:                                                   │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │   In-Place      │  │   Blue/Green    │                           │
│  │ - AllAtOnce     │  │ - New instances │                           │
│  │ - OneAtATime    │  │ - Switch traffic│                           │
│  │ - HalfAtATime   │  │ - Easy rollback │                           │
│  └─────────────────┘  └─────────────────┘                           │
│                                                                     │
│  Lambda:                 (Traffic Shifting)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   AllAtOnce     │  │   Canary        │  │   Linear        │      │
│  │ (100% ngay)     │  │ (10% → 100%)    │  │ (10% mỗi phút)  │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                     │
│  ECS:                    (Blue/Green + Traffic Shifting)            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   AllAtOnce     │  │   Canary        │  │   Linear        │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Summary Table

| Target | Strategies | Cơ chế | Phí thêm? |
|--------|------------|--------|-----------|
| **EC2/On-prem** | In-Place, Blue/Green | Instance replacement | Blue/Green có phí EC2 mới |
| **Lambda** | AllAtOnce, Canary, Linear | Traffic shifting giữa versions | Không |
| **ECS** | AllAtOnce, Canary, Linear | Traffic shifting qua ALB | Không (đã có ECS tasks) |

### EC2: In-Place Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    In-Place Deployment                      │
│                                                             │
│  Instance 1  ●──────────●  ✓ Updated                        │
│  Instance 2       ●──────────●  ✓ Updated                   │
│  Instance 3            ●──────────●  ✓ Updated              │
│              ─────────────────────────────────► Time        │
│                                                             │
│  Configurations:                                            │
│  - OneAtATime: 1 instance tại một thời điểm                 │
│  - HalfAtATime: 50% instances                               │
│  - AllAtOnce: Tất cả cùng lúc                               │
│  - Custom: Tự định nghĩa percentage                         │
└─────────────────────────────────────────────────────────────┘
```

### EC2: Blue/Green Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                   Blue/Green Deployment                     │
│                                                             │
│  Step 1: New instances (Green) created                      │
│  ┌─────────┐  ┌─────────┐                                   │
│  │ Blue v1 │  │ Green v2│  ← Provisioning                   │
│  │ (Live)  │  │ (New)   │                                   │
│  └────┬────┘  └────┬────┘                                   │
│       │           │                                         │
│       ▼            ▼                                        │
│  ┌─────────────────────┐                                    │
│  │   Load Balancer     │                                    │
│  └─────────────────────┘                                    │
│                                                             │
│  Step 2: Traffic shifted to Green                           │
│  ┌─────────┐  ┌─────────┐                                   │
│  │ Blue v1 │  │ Green v2│  ← Now receiving traffic          │
│  │ (Old)   │  │ (Live)  │                                   │
│  └─────────┘  └────┬────┘                                   │
│       ↓           │                                         │
│  Terminated        ▼                                        │
│  or kept      ┌─────────────────────┐                       │
│               │   Load Balancer     │                       │
│               └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Cost Comparison

| Strategy | Chi phí | Mô tả |
|----------|---------|-------|
| **In-Place** | Thấp | Chỉ phí CodeDeploy (có free tier) |
| **Blue/Green** | **Cao hơn** | Phí EC2 instances mới + Load Balancer |

```
In-Place: Không phí thêm
┌─────────────┐      ┌─────────────┐
│ Instance 1  │  →   │ Instance 1  │  ← Cùng instance
│ (v1 → v2)   │      │ (v2)        │
└─────────────┘      └─────────────┘

Blue/Green: Phí chạy song song
┌─────────────┐      ┌─────────────┐  ┌─────────────┐
│ Blue (v1)   │  →   │ Blue (v1)   │  │ Green (v2)  │
│             │      │ Running     │  │ Running     │
└─────────────┘      └─────────────┘  └─────────────┘
                     ↑________________↑
                     Trả phí cho CẢ 2 trong thời gian này!
```

> [!WARNING]
> **Blue/Green cost** = Thời gian 2 environments chạy song song × Phí EC2 + Load Balancer.
> Sau khi deploy xong, terminate Blue environment để dừng tính phí.

### Khi nào dùng strategy nào?

| Scenario | Strategy | Lý do |
|----------|----------|-------|
| **Dev/Test** | In-Place (AllAtOnce) | Tiết kiệm, downtime OK |
| **Production** | Blue/Green | Zero downtime, easy rollback |
| **Budget limited** | In-Place (OneAtATime) | Không tốn thêm EC2 |
| **Need instant rollback** | Blue/Green | Chỉ cần switch traffic back |
| **Stateful apps** | In-Place | Giữ data trên instance |

## appspec.yml (Lambda)

```yaml
version: 0.0
Resources:
  - MyLambdaFunction:
      Type: AWS::Lambda::Function
      Properties:
        Name: my-function
        Alias: live
        CurrentVersion: 1
        TargetVersion: 2

Hooks:
  - BeforeAllowTraffic: LambdaPreTrafficHook
  - AfterAllowTraffic: LambdaPostTrafficHook
```

### Lambda: Traffic Shifting Strategies

| Strategy | Mô tả | Use Case |
|----------|-------|----------|
| **Canary10Percent5Minutes** | 10% traffic, đợi 5 phút, rồi 100% | Safe deployment |
| **Linear10PercentEvery1Minute** | Tăng 10% mỗi phút | Gradual rollout |
| **AllAtOnce** | 100% ngay lập tức | Fast deployment |

## appspec.yml (ECS)

```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "arn:aws:ecs:region:account:task-definition/my-task:2"
        LoadBalancerInfo:
          ContainerName: "my-container"
          ContainerPort: 80

Hooks:
  - BeforeInstall: "LambdaBeforeInstallHook"
  - AfterInstall: "LambdaAfterInstallHook"
  - AfterAllowTestTraffic: "LambdaAfterAllowTestTrafficHook"
  - BeforeAllowTraffic: "LambdaBeforeAllowTrafficHook"
  - AfterAllowTraffic: "LambdaAfterAllowTrafficHook"
```

## Rollback Strategies

```
┌─────────────────────────────────────────────────────────────┐
│                    Rollback Options                         │
├─────────────────────────────────────────────────────────────┤
│  1. Automatic Rollback                                      │
│     └── Trigger: Deployment failure hoặc alarm threshold    │
│                                                             │
│  2. Manual Rollback                                         │
│     └── Redeploy previous revision                          │
│                                                             │
│  3. Disable Rollback                                        │
│     └── Không rollback, giữ failed state để debug           │
└─────────────────────────────────────────────────────────────┘
```

---

# 4️⃣ AWS CodePipeline

## Khái Niệm

**CodePipeline** là dịch vụ CI/CD orchestration, tự động hóa toàn bộ quy trình từ source đến production.

## Pipeline Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CodePipeline                                │
│                                                                     │
│  Stage 1: Source                                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────────────┐  Output: SourceArtifact                       │ │
│  │ │ CodeCommit   │  ──────────────────────────►                  │ │
│  │ │ GitHub       │                                               │ │
│  │ │ S3           │                                               │ │
│  │ └──────────────┘                                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                             │                                       │
│                              ▼                                      │
│  Stage 2: Build                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────────────┐  Input: SourceArtifact                        │ │
│  │ │ CodeBuild    │  Output: BuildArtifact                        │ │
│  │ │ Jenkins      │  ──────────────────────────►                  │ │
│  │ └──────────────┘                                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                             │                                       │
│                              ▼                                      │
│  Stage 3: Test                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────────────┐  ┌──────────────┐                             │ │
│  │ │ CodeBuild    │  │ Third-party  │  (Parallel Actions)         │ │
│  │ │ (Unit Tests) │  │ Testing Tool │                             │ │
│  │ └──────────────┘  └──────────────┘                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                             │                                       │
│                              ▼                                      │
│  Stage 4: Approval (Manual)                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────────────┐                                               │ │
│  │ │ Manual       │  SNS Notification → Approve/Reject            │ │
│  │ │ Approval     │                                               │ │
│  │ └──────────────┘                                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                             │                                       │
│                              ▼                                      │
│  Stage 5: Deploy                                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │ │ CodeDeploy   │  │ ECS          │  │ CloudFormation│          │ │
│  │ │ (EC2)        │  │ (Containers) │  │ (Infrastructure)         │ │
│  │ └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Artifacts và S3

```
┌─────────────────────────────────────────────────────────────┐
│                    Artifact Flow                            │
│                                                             │
│  ┌─────────┐        ┌─────────────────┐        ┌─────────┐  │
│  │ Stage 1 │──────► │ S3 Artifact     │──────► │ Stage 2 │  │
│  │ Source  │        │ Bucket          │        │ Build   │  │
│  └─────────┘        │ (Encrypted KMS) │        └─────────┘  │
│                     └─────────────────┘                     │
│                             │                               │
│  Cross-region:               ▼                              │
│  ┌─────────┐        ┌─────────────────┐                     │
│  │Region A │──────► │ S3 Replication  │──────► Region B     │
│  │Artifact │        │                 │        Deploy       │
│  └─────────┘        └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Action Types

| Category | Actions | Mô tả |
|----------|---------|-------|
| **Source** | CodeCommit, GitHub, S3, ECR | Trigger pipeline |
| **Build** | CodeBuild, Jenkins | Compile, test |
| **Test** | CodeBuild, Device Farm | Testing |
| **Deploy** | CodeDeploy, ECS, S3, CloudFormation | Deployment |
| **Approval** | Manual Approval | Human gate |
| **Invoke** | Lambda, Step Functions | Custom actions |

## CloudWatch Events Integration

```yaml
# EventBridge Rule để trigger pipeline
{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "resources": ["arn:aws:codecommit:region:account:repo-name"],
  "detail": {
    "event": ["referenceCreated", "referenceUpdated"],
    "referenceType": ["branch"],
    "referenceName": ["main", "master"]
  }
}
```

## Parallel và Sequential Actions

```
┌─────────────────────────────────────────────────────────────┐
│                Stage: Deploy                                │
│                                                             │
│  RunOrder 1 (Sequential):                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Prepare Environment                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                             │                               │
│                              ▼                              │
│  RunOrder 2 (Parallel):                                     │
│  ┌──────────────────┐ ┌──────────────────┐                  │
│  │ Deploy to        │ │ Deploy to        │                  │
│  │ Region A         │ │ Region B         │                  │
│  └──────────────────┘ └──────────────────┘                  │
│                             │                               │
│                              ▼                              │
│  RunOrder 3:                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Smoke Tests                                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

# 5️⃣ AWS CodeArtifact

## Khái Niệm

**CodeArtifact** là artifact repository service để lưu trữ và chia sẻ software packages.

```
┌─────────────────────────────────────────────────────────────────┐
│                      CodeArtifact                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                        Domain                               ││
│  │  ┌────────────────┐  ┌────────────────┐                     ││
│  │  │  Repository A  │  │  Repository B  │                     ││
│  │  │  (npm, pip)    │  │  (maven)       │                     ││
│  │  │                │  │                │                     ││
│  │  │ ┌───────────┐  │  │ ┌───────────┐  │                     ││
│  │  │ │ Package 1 │  │  │ │ Package X │  │                     ││
│  │  │ │ Package 2 │  │  │ │ Package Y │  │                     ││
│  │  │ └───────────┘  │  │ └───────────┘  │                     ││
│  │  └────────────────┘  └────────────────┘                     ││
│  │           │                                                 ││
│  │           ▼                                                 ││
│  │  ┌────────────────────────────────────┐                     ││
│  │  │ Upstream: npm, PyPI, Maven Central │                     ││
│  │  └────────────────────────────────────┘                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Supported Package Types

| Package Manager | Language |
|-----------------|----------|
| npm | JavaScript/TypeScript |
| pip/twine | Python |
| Maven/Gradle | Java |
| NuGet | .NET |

## Usage Example

```bash
# Login npm
aws codeartifact login --tool npm --domain my-domain --repository my-repo

# Login pip
aws codeartifact login --tool pip --domain my-domain --repository my-repo

# Now use normally
npm install my-package
pip install my-package
```

## Upstream Repositories

```
┌──────────────────────────────────────────────────────────────┐
│                  Upstream Flow                               │
│                                                              │
│  Developer Request     CodeArtifact         Public Registry  │
│       │                    │                     │           │
│       │  npm install       │                     │           │
│       │ ────────────────►  │                     │           │
│       │                    │  Not in cache?      │           │
│       │                    │ ─────────────────►  │           │
│       │                    │                     │           │
│       │                    │  ◄───── Package ─────│           │
│       │                    │  (Cached for future)│           │
│       │  ◄──── Package ────│                     │           │
│       │                    │                     │           │
└──────────────────────────────────────────────────────────────┘
```

---

# 6️⃣ AWS CodeGuru

## Khái Niệm

**CodeGuru** sử dụng Machine Learning để automated code review và application performance recommendations.

## Components

```
┌─────────────────────────────────────────────────────────────┐
│                       CodeGuru                              │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │     CodeGuru Reviewer   │  │    CodeGuru Profiler    │   │
│  │                         │  │                         │   │
│  │  - Code quality         │  │  - Runtime analysis     │   │
│  │  - Security issues      │  │  - CPU utilization      │   │
│  │  - Best practices       │  │  - Memory analysis      │   │
│  │  - AWS SDK usage        │  │  - Latency bottlenecks  │   │
│  │                         │  │                         │   │
│  │  Languages:             │  │  Languages:             │   │
│  │  - Java                 │  │  - Java                 │   │
│  │  - Python               │  │  - Python               │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## CodeGuru Reviewer Integration

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Pull Request ──► CodeGuru Reviewer ──► Comments with        │
│                        │                 Recommendations     │
│                       │                                      │
│                        ▼                                     │
│  Detects:                                                    │
│  - Resource leaks                                            │
│  - Security vulnerabilities                                  │
│  - Concurrency issues                                        │
│  - Input validation problems                                 │
│  - AWS best practice violations                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 7️⃣ AWS CodeStar

## Khái Niệm

**CodeStar** là unified interface để quản lý software development activities.

> [!NOTE]
> CodeStar đang được phased out. AWS khuyến nghị sử dụng các services riêng lẻ (CodeCommit, CodeBuild, CodePipeline, CodeDeploy).

## Features

- One dashboard cho toàn bộ project
- Pre-configured templates
- Team management with IAM
- Issue tracking integration (JIRA)
- IDE integration

---

# 🔄 Complete CI/CD Pipeline Example

```yaml
# Full Pipeline với tất cả services
┌─────────────────────────────────────────────────────────────────────┐
│                     Complete CI/CD Flow                             │
│                                                                     │
│  Developer                                                          │
│     │                                                               │
│      │ git push                                                     │
│      ▼                                                              │
│  ┌──────────────┐                                                   │
│  │ CodeCommit   │  ──► EventBridge ──► Triggers Pipeline            │
│  └──────────────┘                                                   │
│        │                                                            │
│         ▼         ┌──────────────┐                                  │
│  ┌──────────────┐ │ CodeArtifact │ ◄── Dependencies                 │
│  │ CodeBuild    │─┤              │                                  │
│  │ (Build+Test) │ └──────────────┘                                  │
│                   └──────────────┘                                  │
│        │                                                            │
│         │ Artifacts ──► S3                                          │
│         ▼                                                           │
│  ┌──────────────┐                                                   │
│  │ CodeGuru     │  ◄── Reviews code changes                         │
│  │ Reviewer     │                                                   │
│  └──────────────┘                                                   │
│        │                                                            │
│         ▼                                                           │
│  ┌──────────────┐                                                   │
│  │ Manual       │  ──► SNS Notification                             │
│  │ Approval     │                                                   │
│  └──────────────┘                                                   │
│        │                                                            │
│         ▼                                                           │
│  ┌──────────────┐  ┌─────────────────────────────────────────┐      │
│  │ CodeDeploy   │──│ EC2 / ECS / Lambda                      │      │
│  └──────────────┘  │                                         │      │
│                    │ ┌────────────┐                          │      │
│                    │ │ CodeGuru   │ ◄── Runtime profiling    │      │
│                    │ │ Profiler   │                          │      │
│                    │ └────────────┘                          │      │
│                    └─────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 📋 Exam Tips

## Key Points for AWS Certification

| Topic | Remember |
|-------|----------|
| **buildspec.yml** | Root of source code, phases: install, pre_build, build, post_build |
| **appspec.yml** | Root for EC2, hooks define lifecycle |
| **CodeBuild VPC** | Cần NAT Gateway hoặc VPC Endpoints |
| **Lambda deploy** | Traffic shifting: Canary, Linear, AllAtOnce |
| **ECS deploy** | Blue/Green only |
| **Artifacts** | Stored in S3, encrypted với KMS |
| **Cross-region** | Need S3 replication |
| **CodeArtifact** | Upstream từ public registries |

## Common Scenarios

```
1. "Cần build trong VPC để access RDS"
   → CodeBuild với VPC configuration + NAT Gateway

2. "Gradual deployment với rollback"
   → CodeDeploy Blue/Green hoặc Lambda Canary

3. "Cần approval trước khi deploy production"
   → CodePipeline Manual Approval action + SNS

4. "Share packages across teams"
   → CodeArtifact với domain

5. "Automated code review"
   → CodeGuru Reviewer integration với pull requests
```

---

# 🔗 Related Resources

- [CloudFormation](./cloudformation.md) - Infrastructure as Code
- [CDK](./cdk.md) - Cloud Development Kit
- [Lambda](./lambda.md) - Serverless compute
- [ECS](./ecs.md) - Container orchestration
