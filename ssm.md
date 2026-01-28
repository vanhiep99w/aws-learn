# AWS Systems Manager (SSM)

> AWS Systems Manager là bộ công cụ quản lý infrastructure, giúp quản lý EC2 instances, on-premises servers, và các AWS resources một cách tập trung.

## 📋 Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AWS Systems Manager                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Operations Management                         ││
│  │  Explorer │ OpsCenter │ CloudWatch Dashboard │ PHD              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Application Management                        ││
│  │  Parameter Store │ AppConfig                                    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Change Management                             ││
│  │  Change Manager │ Automation │ Change Calendar │ Maintenance    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Node Management                               ││
│  │  Fleet Manager │ Session Manager │ Run Command │ Patch Manager  ││
│  │  State Manager │ Inventory                                      ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Các Tính Năng Chính

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
│                    SSM Agent Architecture                            │
│                                                                      │
│   AWS Cloud                           Your EC2/On-prem              │
│   ┌─────────────┐                    ┌─────────────────────┐        │
│   │ Systems     │ ◄─── polling ───── │ SSM Agent           │        │
│   │ Manager     │    (HTTPS 443)     │ (chạy trên server)  │        │
│   │             │                    │                     │        │
│   │             │ ─── commands ────► │  → Execute commands │        │
│   │             │                    │  → Collect inventory│        │
│   │             │ ◄─── results ───── │  → Report status    │        │
│   └─────────────┘                    └─────────────────────┘        │
│                                                                      │
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
│                    SSM Requirements                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. SSM Agent installed and running                                  │
│     └── Pre-installed on modern AMIs                                │
│                                                                      │
│  2. IAM Role với managed policy:                                    │
│     └── AmazonSSMManagedInstanceCore                                │
│                                                                      │
│  3. Network connectivity:                                            │
│     └── HTTPS outbound (443) to SSM endpoints                       │
│     └── Hoặc VPC Endpoints cho private subnets                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 2️⃣ Session Manager

## Khái Niệm

**Session Manager** cho phép access EC2 instances mà **không cần SSH, không cần bastion host, không cần mở port 22**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                 Traditional SSH vs Session Manager                   │
│                                                                      │
│  Traditional SSH:                                                    │
│  ┌──────────┐   SSH (22)   ┌──────────┐   SSH (22)   ┌──────────┐  │
│  │ User     │────────────► │ Bastion  │────────────► │ Private  │  │
│  │          │              │ Host     │              │ EC2      │  │
│  └──────────┘              └──────────┘              └──────────┘  │
│       ⚠️ Cần quản lý SSH keys, mở ports, maintain bastion          │
│                                                                      │
│  Session Manager:                                                    │
│  ┌──────────┐  HTTPS (443) ┌──────────┐              ┌──────────┐  │
│  │ User     │────────────► │ SSM      │◄─────────────│ SSM Agent│  │
│  │ (Console │              │ Service  │   polling    │ (EC2)    │  │
│  │  or CLI) │              └──────────┘              └──────────┘  │
│       ✅ Không cần SSH keys, không mở port, có audit logs           │
└─────────────────────────────────────────────────────────────────────┘
```

## Lợi ích

| Feature | Mô tả |
|---------|-------|
| **No SSH keys** | Sử dụng IAM để authorize |
| **No open ports** | Chỉ cần outbound 443 |
| **No bastion host** | Tiết kiệm cost và management |
| **Audit logs** | Tất cả sessions được log vào CloudWatch/S3 |
| **Cross-platform** | Linux và Windows |
| **Port forwarding** | Tunnel ports qua SSM |

## Sử dụng

```bash
# Qua AWS CLI
aws ssm start-session --target i-1234567890abcdef0

# Port forwarding
aws ssm start-session \
    --target i-1234567890abcdef0 \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["3306"],"localPortNumber":["3306"]}'
```

---

# 3️⃣ Run Command

## Khái Niệm

**Run Command** cho phép chạy commands trên nhiều instances cùng lúc mà không cần SSH.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Run Command Flow                                │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │ Run Command  │ ──────► Select targets (tags, instance IDs)       │
│  │              │                                                   │
│  │ Document:    │ ──────► Choose document (script to run)           │
│  │ AWS-RunShell │                                                   │
│  │ Script       │ ──────► Execute on all targets                    │
│  └──────────────┘                                                   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ EC2 #1   │ │ EC2 #2   │ │ EC2 #3   │ │ EC2 #N   │               │
│  │ (Agent)  │ │ (Agent)  │ │ (Agent)  │ │ (Agent)  │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
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
│                    Parameter Store                                   │
│                                                                      │
│  Hierarchy:                                                          │
│  /myapp/                                                             │
│  ├── dev/                                                            │
│  │   ├── db/host          = "dev-db.example.com"                    │
│  │   ├── db/password      = "encrypted-value" (SecureString)        │
│  │   └── api-key          = "dev-key-123"                           │
│  ├── prod/                                                           │
│  │   ├── db/host          = "prod-db.example.com"                   │
│  │   ├── db/password      = "encrypted-value" (SecureString)        │
│  │   └── api-key          = "prod-key-456"                          │
│  └── shared/                                                         │
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
│                Parameter Store Integrations                          │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │ Parameter    │                                                   │
│  │ Store        │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                            │
│    ┌────┴────┬──────────┬──────────┬──────────┐                     │
│    ▼         ▼          ▼          ▼          ▼                     │
│ ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────┐ ┌──────────┐               │
│ │Lambda│ │ ECS  │ │CodeBuild │ │ EC2  │ │CloudForm.│               │
│ └──────┘ └──────┘ └──────────┘ └──────┘ └──────────┘               │
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
│                    Patch Manager Flow                                │
│                                                                      │
│  1. Define Patch Baseline                                            │
│     └── Rules cho approved/rejected patches                         │
│                                                                      │
│  2. Define Patch Groups                                              │
│     └── Group instances bằng tags                                   │
│                                                                      │
│  3. Define Maintenance Window                                        │
│     └── Schedule khi nào patch                                      │
│                                                                      │
│  4. Run Patching                                                     │
│     └── Scan → Install → Reboot (if needed)                        │
│                                                                      │
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
│                  Auto-Remediation Pattern                            │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │ AWS Config   │───►│ EventBridge  │───►│ SSM          │           │
│  │ (Non-        │    │ Rule         │    │ Automation   │           │
│  │  compliant)  │    │              │    │ (Remediate)  │           │
│  └──────────────┘    └──────────────┘    └──────────────┘           │
│                                                                      │
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
