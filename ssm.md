# AWS Systems Manager (SSM)


## Mục lục

- [Tổng Quan](#tổng-quan)
- [Các Tính Năng Chính](#các-tính-năng-chính)
- [Khái Niệm](#khái-niệm)
- [Pre-installed AMIs](#pre-installed-amis)
- [Requirements](#requirements)
- [Khái Niệm](#khái-niệm)
- [Kiến Trúc Chi Tiết](#kiến-trúc-chi-tiết)
- [Lợi Ích So Với SSH](#lợi-ích-so-với-ssh)
- [Requirements](#requirements)
- [VPC Endpoints cho Private Subnet](#vpc-endpoints-cho-private-subnet)
- [Cách Sử Dụng](#cách-sử-dụng)
- [Advanced Features](#advanced-features)
- [IAM Policy Examples](#iam-policy-examples)
- [Session Manager vs SSH Comparison](#session-manager-vs-ssh-comparison)
- [Limitations](#limitations)
- [Exam Tips](#exam-tips)
- [Khái Niệm](#khái-niệm)
- [Common Documents](#common-documents)
- [Target Selection](#target-selection)
- [Khái Niệm](#khái-niệm)
- [Parameter Types](#parameter-types)
- [Tiers](#tiers)
- [Sử dụng](#sử-dụng)
- [Integration với các Services](#integration-với-các-services)
- [Parameter Store vs Secrets Manager](#parameter-store-vs-secrets-manager)
- [Khái Niệm](#khái-niệm)
- [Patch Baseline](#patch-baseline)
- [Khái Niệm](#khái-niệm)
- [Common Use Cases](#common-use-cases)
- [EventBridge Integration](#eventbridge-integration)
- [Common Scenarios](#common-scenarios)

---

> AWS Systems Manager là bộ công cụ quản lý infrastructure, giúp quản lý EC2 instances, on-premises servers, và các AWS resources một cách tập trung.

## Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AWS Systems Manager                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Operations Management                        ││
│  │  Explorer │ OpsCenter │ CloudWatch Dashboard │ PHD              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Application Management                       ││
│  │  Parameter Store │ AppConfig                                    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Change Management                            ││
│  │  Change Manager │ Automation │ Change Calendar │ Maintenance    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Node Management                              ││
│  │  Fleet Manager │ Session Manager │ Run Command │ Patch Manager  ││
│  │  State Manager │ Inventory                                      ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Các Tính Năng Chính

| Feature | Mô tả | Use Case |
|---------|-------|----------|
| **Session Manager** | SSH/RDP không cần mở port | Secure access to instances |
| **Run Command** | Chạy commands trên nhiều instances | Batch operations |
| **Patch Manager** | Quản lý OS patches | Security compliance |
| **Parameter Store** | Lưu trữ config/secrets | Configuration management |
| **State Manager** | Maintain desired state | Compliance |
| **Automation** | Automate runbooks | Operational tasks |

---

# 1️⃣ SSM Agent

## Khái Niệm

**SSM Agent** là software chạy trên EC2/on-premises để giao tiếp với Systems Manager service.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SSM Agent Architecture                           │
│                                                                     │
│   AWS Cloud                           Your EC2/On-prem              │
│   ┌─────────────┐                    ┌─────────────────────┐        │
│   │ Systems     │ ◄─── polling ───── │ SSM Agent           │        │
│   │ Manager     │    (HTTPS 443)     │ (chạy trên server)  │        │
│   │             │                    │                     │        │
│   │             │ ─── commands ────► │  → Execute commands │        │
│   │             │                    │  → Collect inventory│        │
│   │             │ ◄─── results ───── │  → Report status    │        │
│   └─────────────┘                    └─────────────────────┘        │
│                                                                     │
│   Không cần SSH! Chỉ cần HTTPS outbound (443)                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Pre-installed AMIs

| AMI Type | SSM Agent |
|----------|-----------|
| Amazon Linux 2/2023 | ✅ Pre-installed |
| Ubuntu 16.04+ | ✅ Pre-installed |
| Windows Server 2016+ | ✅ Pre-installed |
| Other AMIs | ❌ Cần install manually |

## Requirements

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SSM Requirements                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SSM Agent installed and running                                 │
│     └── Pre-installed on modern AMIs                                │
│                                                                     │
│  2. IAM Role với managed policy:                                    │
│     └── AmazonSSMManagedInstanceCore                                │
│                                                                     │
│  3. Network connectivity:                                           │
│     └── HTTPS outbound (443) to SSM endpoints                       │
│     └── Hoặc VPC Endpoints cho private subnets                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

# 2️⃣ Session Manager (Deep Dive)

> [!IMPORTANT]
> **Session Manager** là cách được khuyến nghị để access EC2 instances - thay thế hoàn toàn SSH truyền thống.

## Khái Niệm

**Session Manager** cho phép access EC2 instances mà **không cần SSH, không cần bastion host, không cần mở port 22**.

```
┌──────────────────────────────────────────────────────────────────────┐
│                 Traditional SSH vs Session Manager                   │
│                                                                      │
│  Traditional SSH:                                                    │
│  ┌──────────┐   SSH (22)   ┌──────────┐   SSH (22)   ┌──────────┐    │
│  │ User     │────────────► │ Bastion  │────────────► │ Private  │    │
│  │          │              │ Host     │              │ EC2      │    │
│  └──────────┘              └──────────┘              └──────────┘    │
│       ⚠️ Cần quản lý SSH keys, mở ports, maintain bastion            │
│                                                                      │
│  Session Manager:                                                    │
│  ┌──────────┐  HTTPS (443) ┌──────────┐              ┌──────────┐    │
│  │ User     │────────────► │ SSM      │◄─────────────│ SSM Agent│    │
│  │ (Console │              │ Service  │   polling    │ (EC2)    │    │
│  │  or CLI) │              └──────────┘              └──────────┘    │
│       ✅ Không cần SSH keys, không mở port, có audit logs            │
└──────────────────────────────────────────────────────────────────────┘
```

## Kiến Trúc Chi Tiết

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SESSION MANAGER ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER                        AWS CLOUD                    EC2 INSTANCE   │
│  ┌─────────┐                                              ┌─────────────┐│
│  │ Browser │──┐                                           │   Private   ││
│  │   or    │  │             ┌─────────────────┐           │   Subnet    ││
│  │  CLI    │  │  HTTPS      │                 │  HTTPS    │ ┌─────────┐ ││
│  └─────────┘  └────────────►│  SSM Service    │◄──────────┤ │SSM Agent│ ││
│                             │                 │ (polling) │ └─────────┘ ││
│  ┌─────────┐                │  - Session      │           │             ││
│  │   IAM   │───authenticate─│  - WebSocket    │           │  No port 22 ││
│  │  User   │                │  - Encryption   │           │  No SSH key ││
│  └─────────┘                └────────┬────────┘           └─────────────┘│
│                                     │                                    │
│                              ┌───────┴───────┐                           │
│                              ▼               ▼                           │
│  ┌─────────┐                                              ┌─────────────┐│
│  │CloudWatch│                                              │    S3      ││
│  │  Logs   │                                              │  Bucket     ││
│  │ (Audit) │                                              │ (Audit)     ││
│  └─────────┘                                              └─────────────┘│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Lợi Ích So Với SSH

| Category | Traditional SSH | Session Manager |
|----------|-----------------|-----------------|
| **Inbound Ports** | ❌ Mở port 22 | ✅ Không cần mở port |
| **SSH Keys** | ❌ Phải quản lý, rotate | ✅ Không cần SSH keys |
| **Bastion Host** | ❌ Cần maintain, cost | ✅ Không cần bastion |
| **Authentication** | SSH keys | ✅ IAM (MFA support) |
| **Authorization** | Server-level | ✅ IAM policies (granular) |
| **Audit** | ❌ Manual logging | ✅ CloudWatch/S3 auto-log |
| **Session Recording** | ❌ Không có | ✅ Full session recording |
| **Network** | Cần direct access | ✅ Qua HTTPS, works anywhere |
| **Cross-platform** | Khác nhau theo OS | ✅ Same cho Linux/Windows |

## Requirements

```
┌──────────────────────────────────────────────────────────────────────┐
│              SESSION MANAGER REQUIREMENTS CHECKLIST                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ☑️ 1. SSM AGENT                                                     │
│     • Pre-installed on Amazon Linux 2/2023, Ubuntu 16.04+,           │
│       Windows Server 2016+                                           │
│     • Must be running                                                │
│                                                                      │
│  ☑️ 2. IAM INSTANCE PROFILE                                          │
│     • Attach role với policy: AmazonSSMManagedInstanceCore           │
│     • Hoặc custom policy với ssm:* permissions                       │
│                                                                      │
│  ☑️ 3. NETWORK CONNECTIVITY                                          │
│     Option A: Public subnet với Internet Gateway                     │
│     Option B: Private subnet + NAT Gateway                           │
│     Option C: Private subnet + VPC Endpoints (recommended)           │
│               • ssm.region.amazonaws.com                             │
│               • ssmmessages.region.amazonaws.com                     │
│               • ec2messages.region.amazonaws.com                     │
│                                                                      │
│  ☑️ 4. USER IAM PERMISSIONS                                          │
│     • ssm:StartSession                                               │
│     • ssm:ResumeSession                                              │
│     • ssm:TerminateSession                                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## VPC Endpoints cho Private Subnet

```
┌─────────────────────────────────────────────────────────────────────────┐
│           ACCESS PRIVATE EC2 WITHOUT INTERNET                           │
│                                                                         │
│     VPC                                                                 │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │                                                                 │ │
│     │  Private Subnet (No Internet)          VPC Endpoints            │ │
│     │  ┌───────────────────┐                ┌───────────────────────┐ │ │
│     │  │                   │                │ com.amazonaws.region. │ │ │
│     │  │  EC2 Instance     │       ◄────────│ ssm                   │ │ │
│     │  │  ┌─────────────┐  │                │ ssmmessages           │ │ │
│     │  │  │ SSM Agent   │──┼────────────────│ ec2messages           │ │ │
│     │  │  └─────────────┘  │                └───────────────────────┘ │ │
│     │  │                   │                         │                │ │
│     │  │  • No NAT needed  │                         │                │ │
│     │  │  • No IGW needed  │                         ▼                │ │
│     │  └───────────────────┘                   AWS PrivateLink        │ │
│     │                                          (to SSM Service)       │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Cách Sử Dụng

### 1. Qua AWS Console

```
EC2 Console → Instances → Select Instance → Connect → Session Manager
```

### 2. Qua AWS CLI

```bash
# Start session
aws ssm start-session --target i-1234567890abcdef0

# Start session với specific user (Linux)
aws ssm start-session \
    --target i-1234567890abcdef0 \
    --document-name AWS-StartInteractiveCommand \
    --parameters command="sudo su - ec2-user"

# List active sessions
aws ssm describe-sessions --state Active

# Terminate session
aws ssm terminate-session --session-id session-id
```

### 3. SSH Proxy qua Session Manager

Có thể dùng SSH commands thông qua Session Manager (để tương thích với tools cần SSH):

```bash
# ~/.ssh/config
Host i-* mi-*
    ProxyCommand sh -c "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"
    User ec2-user

# Sau đó dùng SSH bình thường
ssh i-1234567890abcdef0
scp file.txt i-1234567890abcdef0:/home/ec2-user/
```

## Advanced Features

### 1. Port Forwarding

```bash
# Forward local port 9999 → remote port 3306 (MySQL)
aws ssm start-session \
    --target i-1234567890abcdef0 \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["3306"],"localPortNumber":["9999"]}'

# Sau đó connect MySQL client đến localhost:9999
mysql -h 127.0.0.1 -P 9999 -u admin -p
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PORT FORWARDING                                  │
│                                                                     │
│  Your Laptop              SSM Service              EC2 Instance     │
│  ┌──────────┐            ┌──────────┐            ┌──────────────┐   │
│  │localhost │   HTTPS    │          │   HTTPS    │              │   │
│  │:9999     │◄──────────►│ Session  │◄──────────►│ RDS/MySQL    │   │
│  │          │  WebSocket │ Manager  │  Tunnel    │ :3306        │   │
│  └────┬─────┘            └──────────┘            └──────────────┘   │
│      │                                                              │
│       ▼                                                             │
│  ┌──────────┐                                                       │
│  │ MySQL    │  Connect to localhost:9999                            │
│  │ Client   │  → Tunnel through SSM                                 │
│  └──────────┘  → Reach RDS on :3306                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Port Forwarding to Remote Host

```bash
# Forward đến host KHÁC thông qua EC2 (như jump host)
aws ssm start-session \
    --target i-1234567890abcdef0 \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters '{"host":["rds-instance.abc123.us-east-1.rds.amazonaws.com"],"portNumber":["3306"],"localPortNumber":["9999"]}'
```

### 3. Session Logging (Audit)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SESSION LOGGING OPTIONS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Session Manager Preferences (console hoặc CLI):                    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ CloudWatch Logs:                                              │  │
│  │   • Log Group: /aws/ssm/sessions                              │  │
│  │   • Stream: session-id                                        │  │
│  │   • Contains: All commands executed                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ S3 Bucket:                                                    │  │
│  │   • Bucket: my-ssm-session-logs                               │  │
│  │   • Path: /session-id/session.log                             │  │
│  │   • Encrypt with KMS key                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ KMS Encryption:                                               │  │
│  │   • Encrypt session data in transit                           │  │
│  │   • Encrypt logs at rest                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## IAM Policy Examples

### Basic Session Manager Access

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:StartSession"
            ],
            "Resource": [
                "arn:aws:ec2:*:*:instance/*"
            ],
            "Condition": {
                "StringEquals": {
                    "ssm:resourceTag/Environment": "Development"
                }
            }
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:TerminateSession",
                "ssm:ResumeSession"
            ],
            "Resource": [
                "arn:aws:ssm:*:*:session/${aws:username}-*"
            ]
        }
    ]
}
```

### Restrict Document Types

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "ssm:StartSession",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "ssm:SessionDocumentAccessCheck": "true"
                }
            }
        },
        {
            "Effect": "Allow",
            "Action": "ssm:StartSession",
            "Resource": [
                "arn:aws:ssm:*::document/AWS-StartInteractiveCommand",
                "arn:aws:ssm:*::document/AWS-StartPortForwardingSession"
            ]
        }
    ]
}
```

## Session Manager vs SSH Comparison

```
┌───────────────────────────────────────────────────────────────────────────┐
│                SESSION MANAGER vs SSH - WHEN TO USE?                      │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ✅ USE SESSION MANAGER when:                                             │
│     • AWS EC2 instances                                                   │
│     • Need audit logging                                                  │
│     • Want to eliminate SSH key management                                │
│     • Private subnet access without bastion                               │
│     • Compliance requirements (session recording)                         │
│     • Centralized IAM access control                                      │
│                                                                           │
│  ⚠️ CONSIDER SSH when:                                                    │
│     • Non-AWS servers                                                     │
│     • Need SCP file transfer (workaround: use S3)                         │
│     • Legacy tools requiring SSH                                          │
│     • SSH tunneling for specific protocols                                │
│                                                                           │
│  💡 HYBRID: Use SSH through Session Manager proxy                         │
│     → Get benefits of both!                                               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Limitations

| Limitation | Workaround |
|------------|------------|
| **No SCP/SFTP** | Use S3 + aws s3 cp |
| **Session timeout** | Default 20 mins idle, configurable up to 60 mins |
| **File transfer** | Upload to S3, download with aws cli |
| **No X11 forwarding** | Not supported |
| **Concurrent sessions** | Default limit, can request increase |

## Exam Tips

| Topic | Remember |
|-------|----------|
| **No port 22** | Session Manager không cần mở inbound port |
| **No bastion** | Không cần bastion host |
| **IAM auth** | Sử dụng IAM để authenticate, không phải SSH keys |
| **VPC Endpoints** | Cần cho private subnet không có internet |
| **Audit** | CloudWatch Logs + S3 cho session logging |
| **Port forwarding** | Có thể tunnel ports (RDS, etc.) |

---

# 3️⃣ Run Command

## Khái Niệm

**Run Command** cho phép chạy commands trên nhiều instances cùng lúc mà không cần SSH.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Run Command Flow                               │
│                                                                     │
│  ┌──────────────┐                                                   │
│  │ Run Command  │ ──────► Select targets (tags, instance IDs)       │
│  │              │                                                   │
│  │ Document:    │ ──────► Choose document (script to run)           │
│  │ AWS-RunShell │                                                   │
│  │ Script       │ ──────► Execute on all targets                    │
│  └──────────────┘                                                   │
│        │                                                            │
│         ▼                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ EC2 #1   │ │ EC2 #2   │ │ EC2 #3   │ │ EC2 #N   │                │
│  │ (Agent)  │ │ (Agent)  │ │ (Agent)  │ │ (Agent)  │                │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

## Common Documents

| Document | Mô tả |
|----------|-------|
| **AWS-RunShellScript** | Run shell commands (Linux) |
| **AWS-RunPowerShellScript** | Run PowerShell (Windows) |
| **AWS-UpdateSSMAgent** | Update SSM Agent |
| **AWS-ConfigureAWSPackage** | Install/uninstall packages |

## Target Selection

```
Targets có thể specify bằng:

1. Instance IDs:
   --targets "Key=instanceids,Values=i-123,i-456"

2. Tags:
   --targets "Key=tag:Environment,Values=Production"

3. Resource Groups:
   --targets "Key=resource-groups:Name,Values=MyGroup"
```

---

# 4️⃣ Parameter Store

## Khái Niệm

**Parameter Store** là secure, hierarchical storage cho configuration data và secrets.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Parameter Store                                  │
│                                                                     │
│  Hierarchy:                                                         │
│  /myapp/                                                            │
│  ├── dev/                                                           │
│  │   ├── db/host          = "dev-db.example.com"                    │
│  │   ├── db/password      = "encrypted-value" (SecureString)        │
│  │   └── api-key          = "dev-key-123"                           │
│  ├── prod/                                                          │
│  │   ├── db/host          = "prod-db.example.com"                   │
│  │   ├── db/password      = "encrypted-value" (SecureString)        │
│  │   └── api-key          = "prod-key-456"                          │
│  └── shared/                                                        │
│      └── config           = "common-config"                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Parameter Types

| Type | Mô tả | Encryption | Use Case |
|------|-------|------------|----------|
| **String** | Plain text | Không | Config values |
| **StringList** | Comma-separated | Không | Lists |
| **SecureString** | Encrypted | KMS | Passwords, API keys |

## Tiers

| | **Standard** | **Advanced** |
|--|--------------|--------------|
| **Max size** | 4 KB | 8 KB |
| **Max params** | 10,000 | 100,000 |
| **Policies** | Không | Có (expiration, notification) |
| **Cost** | Free | Charged |

## Sử dụng

```bash
# Create parameter
aws ssm put-parameter \
    --name "/myapp/prod/db/password" \
    --value "secret123" \
    --type SecureString

# Get parameter
aws ssm get-parameter \
    --name "/myapp/prod/db/password" \
    --with-decryption

# Get parameters by path
aws ssm get-parameters-by-path \
    --path "/myapp/prod" \
    --recursive \
    --with-decryption
```

## Integration với các Services

```
┌─────────────────────────────────────────────────────────────────────┐
│                Parameter Store Integrations                         │
│                                                                     │
│  ┌──────────────┐                                                   │
│  │ Parameter    │                                                   │
│  │ Store        │                                                   │
│  └──────┬───────┘                                                   │
│        │                                                            │
│    ┌────┴────┬──────────┬──────────┬──────────┐                     │
│    ▼         ▼          ▼          ▼          ▼                     │
│ ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────┐ ┌──────────┐                │
│ │Lambda│ │ ECS  │ │CodeBuild │ │ EC2  │ │CloudForm.│                │
│ └──────┘ └──────┘ └──────────┘ └──────┘ └──────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

## Parameter Store vs Secrets Manager

| | **Parameter Store** | **Secrets Manager** |
|--|---------------------|---------------------|
| **Cost** | Free (Standard tier) | $0.40/secret/month |
| **Rotation** | Không có built-in | Có automatic rotation |
| **Cross-account** | Không | Có |
| **Max size** | 8 KB | 64 KB |
| **Use case** | Config, simple secrets | Database credentials, API keys với rotation |

> [!TIP]
> Dùng **Parameter Store** cho configs và secrets đơn giản. Dùng **Secrets Manager** khi cần automatic rotation (ví dụ: RDS passwords).

---

# 5️⃣ Patch Manager

## Khái Niệm

**Patch Manager** tự động hóa việc patching OS và applications.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Patch Manager Flow                               │
│                                                                     │
│  1. Define Patch Baseline                                           │
│     └── Rules cho approved/rejected patches                         │
│                                                                     │
│  2. Define Patch Groups                                             │
│     └── Group instances bằng tags                                   │
│                                                                     │
│  3. Define Maintenance Window                                       │
│     └── Schedule khi nào patch                                      │
│                                                                     │
│  4. Run Patching                                                    │
│     └── Scan → Install → Reboot (if needed)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Patch Baseline

| Component | Mô tả |
|-----------|-------|
| **Operating System** | Linux, Windows, macOS |
| **Approval Rules** | Auto-approve patches after X days |
| **Approved Patches** | Explicitly approved list |
| **Rejected Patches** | Explicitly rejected list |

---

# 6️⃣ Automation

## Khái Niệm

**Automation** cho phép tạo runbooks để automate common maintenance tasks.

## Common Use Cases

| Use Case | Document |
|----------|----------|
| **Restart instance** | AWS-RestartEC2Instance |
| **Create AMI** | AWS-CreateImage |
| **Update CloudFormation** | AWS-UpdateCloudFormationStack |
| **Remediate** | Custom remediation runbooks |

## EventBridge Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Auto-Remediation Pattern                           │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │ AWS Config   │───►│ EventBridge  │───►│ SSM          │           │
│  │ (Non-        │    │ Rule         │    │ Automation   │           │
│  │  compliant)  │    │              │    │ (Remediate)  │           │
│  └──────────────┘    └──────────────┘    └──────────────┘           │
│                                                                     │
│  Example: Security Group mở port 22 → Tự động close port            │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 📋 Exam Tips

| Topic | Remember |
|-------|----------|
| **SSM Agent** | Pre-installed on modern AMIs, cần IAM Role |
| **Session Manager** | No SSH, no port 22, uses IAM |
| **Run Command** | Execute commands on multiple instances |
| **Parameter Store** | Free tier, SecureString encrypted by KMS |
| **Secrets Manager** | Có rotation, cross-account, costs money |
| **Patch Manager** | Baselines, Patch Groups, Maintenance Windows |

## Common Scenarios

```
1. "Access EC2 trong private subnet không có SSH"
   → Session Manager + VPC Endpoints

2. "Lưu database password an toàn"
   → Parameter Store (SecureString) hoặc Secrets Manager

3. "Chạy script trên 100 EC2 instances"
   → Run Command

4. "Auto-patch OS hàng tuần"
   → Patch Manager + Maintenance Windows

5. "Auto-remediate security issues"
   → AWS Config + EventBridge + SSM Automation
```

---

# 🔗 Related Resources

- [EC2](./ec2.md) - Compute instances
- [IAM](./iam.md) - Identity and Access Management
- [VPC](./vpc.md) - Networking
- [CloudFormation](./cloudformation.md) - Infrastructure as Code
