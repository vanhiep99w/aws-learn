# AWS OpsWorks


## Mục lục

- [Tổng quan](#tổng-quan)
- [3 Loại OpsWorks](#3-loại-opsworks)
- [OpsWorks Stacks](#opsworks-stacks)
- [OpsWorks for Chef Automate](#opsworks-for-chef-automate)
- [OpsWorks for Puppet Enterprise](#opsworks-for-puppet-enterprise)
- [So sánh các Configuration Management Tools](#so-sánh-các-configuration-management-tools)
- [OpsWorks vs Các AWS Services khác](#opsworks-vs-các-aws-services-khác)
- [Use Cases](#use-cases)
- [Exam Tips](#exam-tips)

---

## Tổng quan

**AWS OpsWorks** là dịch vụ **configuration management** cho phép quản lý servers bằng **Chef** hoặc **Puppet**.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AWS OpsWorks là gì?                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Configuration Management = Tự động hóa việc cấu hình servers              │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  MANUAL (Không có OpsWorks)                                         │   │
│   │  ─────────────────────────                                          │   │
│   │  • SSH vào từng server                                              │   │
│   │  • Cài đặt packages thủ công                                        │   │
│   │  • Cấu hình app thủ công                                            │   │
│   │  • Repeat cho mỗi server mới                                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  AUTOMATED (Với OpsWorks)                                           │   │
│   │  ─────────────────────────                                          │   │
│   │  • Viết recipes/manifests một lần                                   │   │
│   │  • OpsWorks tự động apply lên tất cả servers                        │   │
│   │  • Consistent configuration                                         │   │
│   │  • Version controlled                                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Chef vs Puppet

| Tool | Language | Files |
|------|----------|-------|
| **Chef** | Ruby DSL | Recipes, Cookbooks |
| **Puppet** | Puppet DSL | Manifests, Modules |

Cả hai đều làm cùng việc: **Định nghĩa infrastructure as code** để tự động configure servers.

---

## 3 Loại OpsWorks

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         3 Flavors của OpsWorks                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. OpsWorks STACKS                                                         │
│      ─────────────────                                                       │
│      • AWS-managed Chef (embedded)                                           │
│      • Dùng Chef recipes                                                     │
│      • Organize apps into layers                                             │
│      • Legacy - ít dùng cho projects mới                                    │
│                                                                              │
│   2. OpsWorks for CHEF AUTOMATE                                              │
│      ────────────────────────────                                            │
│      • Fully managed Chef server                                             │
│      • Full Chef ecosystem                                                   │
│      • Chef Automate features                                                │
│                                                                              │
│   3. OpsWorks for PUPPET ENTERPRISE                                          │
│      ──────────────────────────────                                          │
│      • Fully managed Puppet master                                           │
│      • Full Puppet Enterprise features                                       │
│      • Puppet manifests & modules                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Loại | Chef/Puppet | Managed by | Best for |
|------|-------------|------------|----------|
| **Stacks** | Chef (embedded) | AWS | Legacy apps, simple use cases |
| **Chef Automate** | Full Chef | AWS | Teams đã dùng Chef |
| **Puppet Enterprise** | Full Puppet | AWS | Teams đã dùng Puppet |

---

## OpsWorks Stacks

### Kiến trúc

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         OpsWorks Stacks Architecture                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STACK (= Your Application)                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   LAYER: Load Balancer                                              │   │
│   │   ┌──────────────────────────────────────────────────────────┐      │   │
│   │   │  ELB (auto-configured)                                   │      │   │
│   │   └──────────────────────────────────────────────────────────┘      │   │
│   │                              │                                       │   │
│   │   LAYER: Application Servers ▼                                      │   │
│   │   ┌──────────────────────────────────────────────────────────┐      │   │
│   │   │  ┌──────┐  ┌──────┐  ┌──────┐                            │      │   │
│   │   │  │ EC2  │  │ EC2  │  │ EC2  │   ← Chef recipes applied  │      │   │
│   │   │  └──────┘  └──────┘  └──────┘                            │      │   │
│   │   └──────────────────────────────────────────────────────────┘      │   │
│   │                              │                                       │   │
│   │   LAYER: Database            ▼                                      │   │
│   │   ┌──────────────────────────────────────────────────────────┐      │   │
│   │   │  RDS MySQL                                               │      │   │
│   │   └──────────────────────────────────────────────────────────┘      │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Các thành phần

| Component | Mô tả |
|-----------|-------|
| **Stack** | Container cho toàn bộ application |
| **Layer** | Nhóm instances có cùng purpose (web, app, db) |
| **Instance** | EC2 instances trong layer |
| **App** | Code được deploy lên instances |
| **Recipes** | Chef scripts định nghĩa configuration |

### Lifecycle Events

OpsWorks Stacks tự động chạy recipes tại các events:

| Event | Khi nào | Ví dụ |
|-------|---------|-------|
| **Setup** | Instance khởi động lần đầu | Install packages |
| **Configure** | Instance join/leave stack | Update config files |
| **Deploy** | Deploy app | Pull code, restart service |
| **Undeploy** | Remove app | Clean up files |
| **Shutdown** | Instance stopping | Graceful shutdown |

---

## OpsWorks for Chef Automate

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    OpsWorks for Chef Automate                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AWS-managed Chef Server                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   Chef Automate Server (Managed by AWS)                             │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │  • Chef Infra Server                                        │   │   │
│   │   │  • Chef Automate (compliance, visibility)                   │   │   │
│   │   │  • Automatic backups                                        │   │   │
│   │   │  • Patching handled by AWS                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   │                              │                                       │   │
│   │              ┌───────────────┼───────────────┐                      │   │
│   │              ▼               ▼               ▼                       │   │
│   │         ┌────────┐      ┌────────┐      ┌────────┐                  │   │
│   │         │ Node 1 │      │ Node 2 │      │ Node 3 │                  │   │
│   │         │ (EC2)  │      │ (EC2)  │      │On-prem │                  │   │
│   │         │chef-cli│      │chef-cli│      │chef-cli│                  │   │
│   │         └────────┘      └────────┘      └────────┘                  │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ✅ Supports EC2 và On-premises servers                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## OpsWorks for Puppet Enterprise

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    OpsWorks for Puppet Enterprise                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AWS-managed Puppet Master                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   Puppet Enterprise Master (Managed by AWS)                         │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │  • Puppet Master                                            │   │   │
│   │   │  • Puppet Console (GUI)                                     │   │   │
│   │   │  • Automatic backups                                        │   │   │
│   │   │  • Patching handled by AWS                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   │                              │                                       │   │
│   │         Puppet Agents connect to Master                             │   │
│   │              ┌───────────────┼───────────────┐                      │   │
│   │              ▼               ▼               ▼                       │   │
│   │         ┌────────┐      ┌────────┐      ┌────────┐                  │   │
│   │         │ Agent  │      │ Agent  │      │ Agent  │                  │   │
│   │         │ (EC2)  │      │ (EC2)  │      │On-prem │                  │   │
│   │         └────────┘      └────────┘      └────────┘                  │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## So sánh các Configuration Management Tools

| Tool | Language | Model | AWS Service |
|------|----------|-------|-------------|
| **Chef** | Ruby | Pull (agent) | OpsWorks Stacks, OpsWorks for Chef |
| **Puppet** | Puppet DSL | Pull (agent) | OpsWorks for Puppet |
| **Ansible** | YAML | Push (agentless) | ❌ Không có managed service |
| **SSM** | JSON/YAML | Push | AWS Systems Manager |

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Push vs Pull Model                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PULL MODEL (Chef, Puppet):                                                 │
│   ─────────────────────────                                                  │
│   ┌──────────┐         ┌────────┐                                           │
│   │  Master  │◄────────│ Agent  │  Agent chủ động "pull" config từ master   │
│   │  Server  │         │ (Node) │  Mỗi 30 phút (configurable)               │
│   └──────────┘         └────────┘                                           │
│                                                                              │
│   PUSH MODEL (Ansible, SSM):                                                 │
│   ──────────────────────────                                                 │
│   ┌──────────┐         ┌────────┐                                           │
│   │ Control  │────────►│  Node  │  Control node "push" config khi run       │
│   │  Node    │ SSH/WinRM│        │  Không cần agent                         │
│   └──────────┘         └────────┘                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## OpsWorks vs Các AWS Services khác

| Service | Purpose | Use When |
|---------|---------|----------|
| **OpsWorks** | Configuration management (Chef/Puppet) | Đã có Chef/Puppet code |
| **Elastic Beanstalk** | Deploy apps (managed platform) | Muốn đơn giản, không cần Chef/Puppet |
| **CloudFormation** | Provision infrastructure | Infrastructure as Code |
| **Systems Manager** | Manage & patch servers | Native AWS, không cần Chef/Puppet |
| **CodeDeploy** | Deploy applications | CI/CD pipelines |

### Khi nào dùng OpsWorks?

| Scenario | Service |
|----------|---------|
| Đã có **Chef cookbooks** sẵn | **OpsWorks** ✅ |
| Đã có **Puppet manifests** sẵn | **OpsWorks** ✅ |
| Muốn **migrate từ on-prem Chef/Puppet** | **OpsWorks** ✅ |
| Mới bắt đầu, muốn **đơn giản** | Elastic Beanstalk hoặc SSM |
| Muốn **AWS native** | Systems Manager |

---

## Use Cases

| Use Case | Mô tả |
|----------|-------|
| **Migrate Chef/Puppet** | Move existing Chef/Puppet to AWS |
| **Hybrid infrastructure** | Manage EC2 + on-premises |
| **Compliance** | Enforce consistent configs |
| **Application deployment** | Deploy multi-tier apps |

---

## Exam Tips

> [!IMPORTANT]
> **Các điểm quan trọng cho AWS Certification:**

### 1. Nhớ keywords

| Keyword | Service |
|---------|---------|
| **Chef**, **Recipes**, **Cookbooks** | OpsWorks |
| **Puppet**, **Manifests** | OpsWorks |
| **Configuration management** | OpsWorks |

### 2. 3 Flavors

| Type | Quick description |
|------|-------------------|
| **Stacks** | Legacy, embedded Chef |
| **Chef Automate** | Full managed Chef server |
| **Puppet Enterprise** | Full managed Puppet master |

### 3. So sánh nhanh

| Câu hỏi | Đáp án |
|---------|--------|
| Có sẵn Chef cookbooks? | **OpsWorks** |
| Có sẵn Puppet manifests? | **OpsWorks** |
| Muốn managed Chef server? | **OpsWorks for Chef Automate** |
| Chưa có Chef/Puppet, muốn đơn giản? | **Elastic Beanstalk** hoặc **SSM** |
| Provision infrastructure? | **CloudFormation** |

### 4. Important notes

- OpsWorks **supports on-premises** servers (hybrid)
- OpsWorks Stacks is **legacy** - AWS recommends newer services
- OpsWorks = **Configuration** | CloudFormation = **Provisioning**

---

## Tài liệu tham khảo

- [AWS OpsWorks Documentation](https://docs.aws.amazon.com/opsworks/)
- [OpsWorks Stacks User Guide](https://docs.aws.amazon.com/opsworks/latest/userguide/)
- [OpsWorks for Chef Automate](https://docs.aws.amazon.com/opsworks/latest/userguide/welcome_opscm.html)
