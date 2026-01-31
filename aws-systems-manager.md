# AWS Systems Manager (SSM)


## Mục lục

- [Tổng quan](#tổng-quan)
- [SSM Agent](#ssm-agent)
- [Phân loại SSM Tools](#phân-loại-ssm-tools)
- [Node Tools (Chi tiết)](#node-tools-chi-tiết)
- [Application Tools (Chi tiết)](#application-tools-chi-tiết)
- [Change Management Tools](#change-management-tools)
- [SSM Documents](#ssm-documents)
- [Use Cases phổ biến](#use-cases-phổ-biến)
- [Pricing](#pricing)
- [So sánh với các services khác](#so-sánh-với-các-services-khác)
- [Tóm tắt](#tóm-tắt)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS Systems Manager (SSM)** là dịch vụ giúp bạn **quản lý tập trung** nodes (EC2, on-premises, multicloud) ở quy mô lớn.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS Systems Manager                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Managed Nodes                                    │   │
│   │                                                                     │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │   │
│   │   │   EC2    │    │   EC2    │    │On-Premise│    │Multicloud│    │   │
│   │   │Instance  │    │Instance  │    │  Server  │    │   VM     │    │   │
│   │   │          │    │          │    │          │    │          │    │   │
│   │   │SSM Agent │    │SSM Agent │    │SSM Agent │    │SSM Agent │    │   │
│   │   └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    │   │
│   │        │               │               │               │          │   │
│   └────────┼───────────────┼───────────────┼───────────────┼──────────┘   │
│            │               │               │               │              │
│            └───────────────┴───────────────┴───────────────┘              │
│                                    │                                       │
│                                    ▼                                       │
│            ┌─────────────────────────────────────────────────┐            │
│            │           AWS Systems Manager                    │            │
│            │                                                  │            │
│            │  • Run Command      • Session Manager            │            │
│            │  • Patch Manager    • Parameter Store            │            │
│            │  • Automation       • State Manager              │            │
│            │  • Inventory        • Maintenance Windows        │            │
│            └─────────────────────────────────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SSM Agent

**SSM Agent** là phần mềm cài trên nodes để cho phép Systems Manager quản lý.

| Aspect | Chi tiết |
|--------|----------|
| **Cài đặt** | Pre-installed trên nhiều AMIs (Amazon Linux, Windows Server) |
| **Yêu cầu** | Cần IAM role với permissions cho SSM |
| **Hỗ trợ** | EC2, on-premises, edge devices, multicloud VMs |

```
Để node trở thành "Managed Node":
  1. Cài SSM Agent
  2. Attach IAM Role với AmazonSSMManagedInstanceCore policy
  3. Agent có thể kết nối với SSM service (network connectivity)
```

---

## Phân loại SSM Tools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Systems Manager Tools                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🖥️ NODE TOOLS (Quản lý nodes)                                              │
│  ─────────────────────────────────────────────────────────────              │
│  • Run Command       → Chạy commands từ xa trên nhiều nodes                │
│  • Session Manager   → SSH/RDP không cần mở port, không cần key            │
│  • Patch Manager     → Tự động patch OS và applications                    │
│  • State Manager     → Duy trì cấu hình mong muốn trên nodes               │
│  • Inventory         → Thu thập thông tin software trên nodes              │
│  • Fleet Manager     → UI dashboard quản lý fleet                          │
│  • Distributor       → Deploy packages đến nodes                           │
│  • Compliance        → Check compliance của patches, configs               │
│                                                                             │
│  🔄 CHANGE MANAGEMENT (Quản lý thay đổi)                                    │
│  ─────────────────────────────────────────────────────────────              │
│  • Automation        → Tự động hóa tasks (tạo AMI, update, etc.)           │
│  • Maintenance Win.  → Lên lịch chạy tasks định kỳ                         │
│  • Change Calendar   → Định nghĩa khi nào được/không được thay đổi         │
│  • Documents (SSM)   → Define actions (JSON/YAML)                          │
│                                                                             │
│  📦 APPLICATION TOOLS (Quản lý applications)                                │
│  ─────────────────────────────────────────────────────────────              │
│  • Parameter Store   → Lưu trữ config, secrets (FREE tier available)       │
│  • AppConfig         → Deploy app configurations với rollback              │
│                                                                             │
│  📊 OPERATIONS TOOLS (Operations management)                                │
│  ─────────────────────────────────────────────────────────────              │
│  • OpsCenter         → Central dashboard cho operational issues            │
│  • Explorer          → Aggregated view của OpsData                         │
│  • Incident Manager  → Quản lý incidents                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Node Tools (Chi tiết)

### 1. Run Command 🚀

**Mục đích**: Chạy commands từ xa trên nhiều nodes cùng lúc **mà không cần SSH**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Run Command                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ví dụ: Cần restart Apache trên 100 servers                                │
│                                                                             │
│  KHÔNG có Run Command:                                                      │
│  → SSH vào từng server                                                      │
│  → Chạy: sudo systemctl restart httpd                                       │
│  → Repeat 100 lần 😱                                                        │
│                                                                             │
│  VỚI Run Command:                                                           │
│  → Chọn target (tag, instance IDs, all)                                     │
│  → Chọn document: AWS-RunShellScript                                        │
│  → Command: sudo systemctl restart httpd                                    │
│  → Execute → Chạy trên 100 servers cùng lúc ✅                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Feature | Mô tả |
|---------|-------|
| **Không cần SSH** | Không cần mở port 22, không cần SSH keys |
| **Rate Control** | Chạy theo batches (VD: 10 servers cùng lúc) |
| **Error Threshold** | Dừng nếu quá nhiều failures |
| **Logging** | Output lưu vào S3 hoặc CloudWatch Logs |

---

### 2. Session Manager 🔐

**Mục đích**: Truy cập shell/console vào nodes **không cần SSH, không cần mở ports**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Session Manager                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   TRƯỚC ĐÂY (SSH truyền thống):                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  User → Internet → Port 22 (phải mở) → EC2 Instance               │   │
│   │         ↑                   ↑                                       │   │
│   │   SSH Key required    Security risk                                 │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   VỚI SESSION MANAGER:                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  User → AWS Console/CLI → SSM Service → SSM Agent → EC2 Instance  │   │
│   │              ↑                              ↑                       │   │
│   │      IAM Auth (no SSH key)         No inbound ports needed         │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Benefit | Mô tả |
|---------|-------|
| **Không cần SSH keys** | Authenticate bằng IAM |
| **Không cần bastion hosts** | Direct access qua SSM |
| **Không cần mở ports** | Không mở port 22 (SSH) hoặc 3389 (RDP) |
| **Fully auditable** | Mọi session được log, có thể stream to S3/CloudWatch |
| **Cross-platform** | Linux shell, Windows PowerShell |

> [!TIP]
> **Session Manager là cách recommended để access EC2 instances** vì security tốt hơn SSH truyền thống.

---

### 3. Patch Manager 🔧

**Mục đích**: Tự động patch OS và applications trên managed nodes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Patch Manager                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐                                                       │
│   │  Patch Baseline │  ← Định nghĩa rules:                                  │
│   │                 │     • Auto-approve patches sau X ngày                │
│   │                 │     • Approved/Rejected patches list                  │
│   │                 │     • Severity levels                                 │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │  Patch Group    │  ← Nhóm instances (VD: "Production", "Dev")          │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │Maintenance Win. │  ← Lên lịch patching (VD: Chủ nhật 2AM)              │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │ Patch Instances │  ← Scan → Install → Reboot (if needed)               │
│   └─────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Feature | Mô tả |
|---------|-------|
| **Patch Baselines** | Define rules cho việc approve patches |
| **Patch Groups** | Nhóm instances để apply baselines khác nhau |
| **Scan vs Install** | Có thể chỉ scan hoặc scan + install |
| **Compliance Reports** | Báo cáo patches nào missing |

---

### 4. State Manager 📋

**Mục đích**: Duy trì cấu hình mong muốn trên nodes (desired state).

```
Ví dụ Use Cases:
  • Bootstrap instances với software khi launch
  • Join Windows instances vào domain
  • Ensure antivirus luôn running
  • Configure SSH settings
```

---

### 5. Inventory 📦

**Mục đích**: Thu thập metadata về software, configurations trên managed nodes.

| Thu thập được | Ví dụ |
|--------------|-------|
| **Applications** | Installed software |
| **AWS Components** | AWS CLI version, SSM Agent version |
| **Files** | Specific files/directories |
| **Network Config** | IP addresses, MAC addresses |
| **Windows Updates** | Installed updates |
| **Instance Details** | OS version, hostname |

---

## Application Tools (Chi tiết)

### Parameter Store 🔑 (Quan trọng!)

**Mục đích**: Lưu trữ **configuration data** và **secrets** một cách secure.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Parameter Store                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Parameter Types:                                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  String         → Plain text value                                  │   │
│   │                   VD: /app/config/db_host = "db.example.com"       │   │
│   │                                                                     │   │
│   │  StringList     → Comma-separated values                            │   │
│   │                   VD: /app/config/servers = "srv1,srv2,srv3"       │   │
│   │                                                                     │   │
│   │  SecureString   → Encrypted với KMS                                 │   │
│   │                   VD: /app/secrets/db_password = "***encrypted***" │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Hierarchical Structure:                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  /myapp/                                                            │   │
│   │    ├── dev/                                                         │   │
│   │    │   ├── db_host         = "dev-db.example.com"                  │   │
│   │    │   └── db_password     = ***encrypted***                        │   │
│   │    └── prod/                                                        │   │
│   │        ├── db_host         = "prod-db.example.com"                 │   │
│   │        └── db_password     = ***encrypted***                        │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Parameter Store Tiers

| Feature | Standard (FREE) | Advanced (PAID) |
|---------|-----------------|-----------------|
| **Số parameters** | 10,000 | 100,000 |
| **Max size** | 4 KB | 8 KB |
| **Parameter policies** | ❌ | ✅ (expiration, notification) |
| **Higher throughput** | ❌ | ✅ |
| **Cost** | **FREE** | $0.05/parameter/month |

### So sánh Parameter Store vs Secrets Manager

| Aspect | Parameter Store | Secrets Manager |
|--------|-----------------|-----------------|
| **Cost** | FREE (Standard tier) | $0.40/secret/month |
| **Rotation** | Không tự động | ✅ Automatic rotation |
| **Cross-account** | Có (với RAM) | Có |
| **Use case** | General configs, simple secrets | Database credentials, API keys cần rotation |

> [!TIP]
> - Dùng **Parameter Store** cho: configs, non-rotating secrets (FREE!)
> - Dùng **Secrets Manager** cho: DB passwords cần auto-rotation

---

## Change Management Tools

### Automation 🤖

**Mục đích**: Tự động hóa các tasks phức tạp bằng **Automation Runbooks**.

```
Ví dụ Use Cases:
  • Tạo Golden AMI tự động
  • Resize EC2 instances
  • Reset Windows password
  • Patch + Reboot + Validate sequence
  • Remediate non-compliant resources
```

### Maintenance Windows ⏰

**Mục đích**: Lên lịch chạy tasks trong khung thời gian định sẵn.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Maintenance Window                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Window: "Weekly-Patching"                                           │  │
│   │  Schedule: Chủ nhật 2AM - 6AM                                        │  │
│   │                                                                      │  │
│   │  Tasks:                                                              │  │
│   │    1. Run Patch Manager scan                                         │  │
│   │    2. Install missing patches                                        │  │
│   │    3. Reboot if needed                                               │  │
│   │    4. Run health check automation                                    │  │
│   │                                                                      │  │
│   │  Targets: Tag = "PatchGroup:Production"                              │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SSM Documents

**SSM Documents** định nghĩa actions mà Systems Manager thực hiện.

| Document Type | Dùng bởi | Mục đích |
|--------------|----------|----------|
| **Command** | Run Command, State Manager | Chạy commands trên nodes |
| **Automation** | Automation | Runbooks cho automated tasks |
| **Session** | Session Manager | Configure session settings |
| **Package** | Distributor | Define software packages |

### Ví dụ Document

```yaml
# AWS-RunShellScript document
schemaVersion: "2.2"
description: "Run shell script"
parameters:
  commands:
    type: StringList
    description: "Commands to run"
mainSteps:
  - action: "aws:runShellScript"
    name: "runCommands"
    inputs:
      runCommand: "{{ commands }}"
```

---

## Use Cases phổ biến

### 1. Secure Access to EC2 (thay thế SSH)

```
Session Manager:
  ✅ No SSH keys management
  ✅ No bastion hosts
  ✅ No open ports
  ✅ Full audit logging
  ✅ IAM-based access control
```

### 2. Centralized Patch Management

```
Patch Manager + Maintenance Windows:
  → Scan all instances for missing patches
  → Apply security patches automatically
  → Schedule during maintenance windows
  → Generate compliance reports
```

### 3. Configuration Management

```
Parameter Store:
  → Store database connection strings
  → Store API keys (encrypted)
  → Reference from Lambda, ECS, EC2
  → Version control configurations
```

### 4. Automation at Scale

```
Run Command:
  → Install software on 100+ servers
  → Collect logs from all instances
  → Execute scripts without SSHing
```

---

## Pricing

| Component | Pricing |
|-----------|---------|
| **Session Manager** | FREE |
| **Run Command** | FREE |
| **Patch Manager** | FREE |
| **State Manager** | FREE |
| **Parameter Store (Standard)** | FREE (10,000 params) |
| **Parameter Store (Advanced)** | $0.05/parameter/month |
| **Automation** | FREE (first 100k steps/mo), then charges |
| **OpsCenter** | Charges per OpsItem |

> [!NOTE]
> Hầu hết SSM tools là **FREE**! Đây là điểm mạnh lớn của SSM.

---

## So sánh với các services khác

| Need | SSM Tool | Alternative |
|------|----------|-------------|
| **Store secrets** | Parameter Store | Secrets Manager |
| **SSH access** | Session Manager | Bastion Host + SSH |
| **Run commands** | Run Command | SSH scripts |
| **Patch OS** | Patch Manager | Manual patching |
| **Configuration** | State Manager | Ansible, Puppet, Chef |
| **Incident mgmt** | Incident Manager | PagerDuty, OpsGenie |

---

## Tóm tắt

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AWS Systems Manager Summary                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎯 WHAT:     Centralized management cho EC2, on-prem, multicloud          │
│  💰 COST:     Hầu hết FREE                                                  │
│  🔑 REQUIRES: SSM Agent + IAM Role                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Most Important Tools                              │   │
│  │                                                                      │   │
│  │  🚀 Run Command     → Execute commands at scale                      │   │
│  │  🔐 Session Manager → Secure shell without SSH/ports                 │   │
│  │  🔧 Patch Manager   → Automated OS patching                          │   │
│  │  🔑 Parameter Store → Store configs/secrets (FREE!)                  │   │
│  │  🤖 Automation      → Runbooks for complex tasks                     │   │
│  │  ⏰ Maint. Windows  → Schedule maintenance tasks                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Key Benefits                                   │   │
│  │                                                                      │   │
│  │  ✅ No SSH keys, no bastion hosts, no open ports                    │   │
│  │  ✅ Works with EC2, on-premises, multicloud                          │   │
│  │  ✅ Centralized visibility and control                               │   │
│  │  ✅ Mostly FREE!                                                     │   │
│  │  ✅ Integrates with Organizations                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Systems Manager User Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/)
- [SSM Agent Installation](https://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent.html)
- [Parameter Store Documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Session Manager Setup](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
