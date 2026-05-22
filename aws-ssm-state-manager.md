# AWS Systems Manager State Manager

## Mục lục

- [Tổng quan](#tổng-quan)
- [Khái niệm cốt lõi — Association](#khái-niệm-cốt-lõi--association)
- [Cách State Manager hoạt động](#cách-state-manager-hoạt-động)
- [SSM Documents dùng với State Manager](#ssm-documents-dùng-với-state-manager)
- [Targeting — Chọn nodes mục tiêu](#targeting--chọn-nodes-mục-tiêu)
- [Scheduling — Lên lịch chạy](#scheduling--lên-lịch-chạy)
- [Rate Controls — Kiểm soát tốc độ](#rate-controls--kiểm-soát-tốc-độ)
- [State Manager + Automation Runbooks](#state-manager--automation-runbooks)
- [Compliance Reporting](#compliance-reporting)
- [Use Cases phổ biến](#use-cases-phổ-biến)
- [So sánh State Manager vs các công cụ khác](#so-sánh-state-manager-vs-các-công-cụ-khác)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Tóm tắt](#tóm-tắt)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**State Manager** là tool trong AWS Systems Manager giúp **tự động duy trì trạng thái mong muốn (desired state)** trên managed nodes và các AWS resources khác.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        State Manager                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   VẤN ĐỀ: Configuration Drift                                               │
│   ─────────────────────────────                                             │
│   • Server A cài antivirus, Server B quên                                   │
│   • Dev tắt firewall rule rồi quên bật lại                                  │
│   • Instance mới launch thiếu software cần thiết                            │
│   • SSH config bị thay đổi thủ công                                         │
│                                                                             │
│   GIẢI PHÁP: State Manager Associations                                     │
│   ──────────────────────────────────────                                    │
│   • Định nghĩa trạng thái mong muốn (desired state)                         │
│   • Tự động apply lên tất cả target nodes                                   │
│   • Lên lịch chạy định kỳ → phát hiện & fix drift                           │
│   • Nodes mới tự động nhận cấu hình khi match target                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> State Manager **MIỄN PHÍ hoàn toàn**. Không tính phí cho associations hay executions.

---

## Khái niệm cốt lõi — Association

**Association** là đơn vị cấu hình chính của State Manager — nó định nghĩa:

| Thành phần | Vai trò | Ví dụ |
|-----------|---------|-------|
| **SSM Document** | Hành động cần thực hiện | `AWS-RunShellScript`, `AWS-ConfigureAWSPackage` |
| **Parameters** | Tham số cho document | Tên package, commands cần chạy |
| **Targets** | Nodes/resources áp dụng | Tag `Environment=Production`, tất cả nodes |
| **Schedule** | Khi nào chạy | `rate(1 day)`, `cron(0 2 ? * SUN *)` |
| **Rate Controls** | Kiểm soát tốc độ deploy | Concurrency: 10, Error Threshold: 5% |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Association                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│   │ SSM Document │    │   Targets    │    │   Schedule   │                  │
│   │              │    │              │    │              │                  │
│   │ "CÀI CÁI GÌ" │    │ "CÀI Ở ĐÂU"  │    │ "CÀI KHI NÀO"│                  │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│          │                   │                   │                          │
│          └───────────────────┼───────────────────┘                          │
│                              │                                              │
│                              ▼                                              │
│                    ┌──────────────────┐                                     │
│                    │  State Manager   │                                     │
│                    │  thực thi trên   │                                     │
│                    │  managed nodes   │                                     │
│                    └──────────────────┘                                     │
│                                                                             │
│   Giới hạn: Mỗi managed node tối đa 20 associations                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cách State Manager hoạt động

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Workflow — 4 bước                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BƯỚC 1: Xác định Desired State                                             │
│  ────────────────────────────────                                           │
│  "Tôi muốn tất cả EC2 phải cài CloudWatch Agent"                            │
│                                                                             │
│                    ▼                                                        │
│                                                                             │
│  BƯỚC 2: Chọn SSM Document                                                  │
│  ────────────────────────────                                               │
│  → Dùng document có sẵn: AWS-ConfigureAWSPackage                            │
│  → Hoặc tạo custom document                                                 │
│                                                                             │
│                    ▼                                                        │
│                                                                             │
│  BƯỚC 3: Tạo Association                                                    │
│  ──────────────────────────                                                 │
│  → Chọn targets (tags, instance IDs, resource groups, all)                  │
│  → Đặt schedule: rate(1 day)                                                │
│  → Cấu hình parameters                                                      │
│                                                                             │
│                    ▼                                                        │
│                                                                             │
│  BƯỚC 4: State Manager tự động enforce                                      │
│  ──────────────────────────────────────                                     │
│  → Chạy ngay khi tạo association (mặc định)                                 │
│  → Chạy lại theo schedule                                                   │
│  → Chạy khi có thay đổi (config, target, document)                          │
│  → Nodes mới match target → tự động apply                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Khi nào Association tự động chạy lại?

| Trigger | Mô tả |
|---------|-------|
| **Tạo mới** | Chạy ngay lập tức (mặc định) |
| **Theo schedule** | Theo cron/rate đã định |
| **Edit association** | Khi thay đổi document version, parameters, schedule, output location |
| **Edit document** | Khi document `$DEFAULT`/`$LATEST` version thay đổi |
| **Node online lần đầu** | Node mới match target → apply ngay |
| **Node reconnect** | Node offline rồi online lại (miss scheduled run) |
| **Node trở lại sau 30+ ngày** | Node stopped > 30 ngày rồi start lại |
| **Manual** | User chạy thủ công từ console/CLI |

> [!NOTE]
> Có thể tắt auto-run khi target thay đổi bằng option **Apply association only at the next specified Cron interval** (`ApplyOnlyAtCronInterval=true`). Hữu ích khi dùng Automation runbooks để tránh phát sinh chi phí khi launch nhiều instances.

---

## SSM Documents dùng với State Manager

State Manager hỗ trợ 3 loại documents:

| Document Type | Mô tả | Ví dụ |
|--------------|-------|-------|
| **Command** | Chạy commands trên nodes | `AWS-RunShellScript`, `AWS-RunPowerShellScript` |
| **Policy** | Apply cấu hình liên tục | `AWS-GatherSoftwareInventory` |
| **Automation** | Chạy runbooks phức tạp | `AWS-RestartEC2Instance`, `AWS-CreateSnapshot` |

### Documents phổ biến cho State Manager

| Document | Mục đích |
|----------|---------|
| `AWS-ConfigureAWSPackage` | Cài/gỡ/update AWS packages (CloudWatch Agent, v.v.) |
| `AWS-RunShellScript` | Chạy shell script trên Linux |
| `AWS-RunPowerShellScript` | Chạy PowerShell trên Windows |
| `AWS-UpdateSSMAgent` | Tự động update SSM Agent |
| `AWS-ApplyDSCMofs` | Apply PowerShell DSC configurations |
| `AWS-JoinDirectoryServiceDomain` | Join Windows vào Active Directory domain |
| `AWS-GatherSoftwareInventory` | Thu thập inventory data |
| `AWS-ApplyAnsiblePlaybooks` | Chạy Ansible playbooks |
| `AWS-ApplyChefRecipes` | Chạy Chef recipes |

---

## Targeting — Chọn nodes mục tiêu

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       4 cách Target                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SPECIFY TAGS (Recommended ⭐)                                           │
│  ──────────────────────────────────                                         │
│  --targets Key=tag:Environment,Values=Production                            │
│                                                                             │
│  ✅ Nodes mới có tag match → tự động nhận association                       │
│  ✅ Xóa tag → ngừng chạy association                                        │
│  ✅ Best practice cho Auto Scaling Groups                                   │
│                                                                             │
│  2. CHOOSE INSTANCES MANUALLY                                               │
│  ──────────────────────────────                                             │
│  --targets Key=InstanceIds,Values=i-0123abc,i-0456def                       │
│                                                                             │
│  3. RESOURCE GROUPS                                                         │
│  ────────────────────                                                       │
│  --targets Key=resource-groups:Name,Values=MyWebServers                     │
│                                                                             │
│  ⚠️ Resource group tối đa 5 tag keys                                        │
│                                                                             │
│  4. ALL MANAGED NODES                                                       │
│  ──────────────────────                                                     │
│  Target tất cả nodes trong account + region hiện tại                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Luôn ưu tiên dùng Tags** để target, đặc biệt khi dùng Command/Policy documents và Auto Scaling Groups. Nodes mới launch với đúng tags sẽ tự động nhận association.

---

## Scheduling — Lên lịch chạy

### Cron và Rate Expressions

| Loại | Ví dụ | Ý nghĩa |
|------|-------|---------|
| **Rate** | `rate(1 day)` | Mỗi ngày 1 lần |
| **Rate** | `rate(12 hours)` | Mỗi 12 giờ |
| **Cron** | `cron(0 2 ? * SUN *)` | Chủ nhật lúc 2AM UTC |
| **Cron** | `cron(30 23 ? * TUE#3 *)` | Thứ 3 tuần thứ 3 mỗi tháng, 23:30 UTC |
| **Cron** | `cron(0 0 ? * 3L *)` | Thứ 3 cuối cùng mỗi tháng, 0:00 UTC |

### Schedule Offset

Cho phép **delay** thêm N ngày sau ngày scheduled. Ví dụ:

```
Schedule: cron(0 0 ? * THU#2 *)     → Thứ 5 tuần thứ 2
Offset:   3                          → + 3 ngày
Kết quả:  Chạy vào Chủ nhật sau Thứ 5 tuần thứ 2

→ Hữu ích khi muốn chạy sau Patch Tuesday
```

> [!NOTE]
> State Manager **không hỗ trợ** chỉ định months trong cron expressions cho associations.

---

## Rate Controls — Kiểm soát tốc độ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Rate Controls                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CONCURRENCY — Bao nhiêu nodes chạy đồng thời?                              │
│  ──────────────────────────────────────────────                             │
│  • Absolute: "Tối đa 20 nodes cùng lúc"                                     │
│  • Percentage: "Tối đa 10% fleet cùng lúc"                                  │
│  • Mặc định (nếu không set): 50 nodes                                       │
│                                                                             │
│  ⚠️ Nodes mới match target khi đang chạy:                                   │
│     → Nếu chưa vượt concurrency → chạy luôn                                 │
│     → Nếu đã vượt → chờ interval tiếp theo                                  │
│                                                                             │
│  ERROR THRESHOLD — Bao nhiêu lỗi thì dừng?                                  │
│  ────────────────────────────────────────────                               │
│  • Absolute: "Dừng sau 10 lỗi"                                              │
│  • Percentage: "Dừng sau 10% nodes lỗi"                                     │
│  • Mặc định (nếu không set): 100% (không giới hạn)                          │
│                                                                             │
│  💡 Muốn đảm bảo không vượt error threshold:                                │
│     → Set Concurrency = 1 (chạy từng node một)                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## State Manager + Automation Runbooks

State Manager không chỉ chạy commands trên nodes, mà còn **schedule Automation runbooks** để quản lý AWS resources rộng hơn:

| Hành động | Ví dụ Runbook |
|-----------|--------------|
| Attach IAM role cho EC2 | Custom runbook |
| Enforce Security Group rules | Custom runbook |
| Tạo/xóa DynamoDB backups | `AWS-CreateDynamoDBBackup` |
| Tạo/xóa EBS snapshots | `AWS-CreateSnapshot` |
| Tắt S3 public access | Custom runbook |
| Start/Stop EC2 theo giờ | `AWS-StartEC2Instance`, `AWS-StopEC2Instance` |
| Patch AMIs | `AWS-UpdateLinuxAmi` |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│          State Manager + Automation = Quản lý resources rộng                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Command/Policy Documents          Automation Runbooks                      │
│  ────────────────────────          ─────────────────────                    │
│  Target: Managed Nodes             Target: ANY AWS Resources                │
│  Scope: Chạy scripts/configs       Scope: Multi-step workflows              │
│                                                                             │
│  Ví dụ:                            Ví dụ:                                   │
│  • Cài software                    • Enforce SG rules                       │
│  • Update agent                    • Tạo EBS snapshot                       │
│  • Join AD domain                  • Stop EC2 ngoài giờ                     │
│  • Chạy shell script               • Tạo DynamoDB backup                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!WARNING]
> Khi dùng Automation runbooks target "all instances" và launch nhiều instances thường xuyên, runbook sẽ chạy trên mỗi instance mới → **có thể phát sinh chi phí Automation cao**. Dùng `ApplyOnlyAtCronInterval=true` để tránh.

**Giới hạn**: Tối đa **100 concurrent automations** running trong 1 AWS account.

---

## Compliance Reporting

State Manager tích hợp với **SSM Compliance** để báo cáo trạng thái tuân thủ:

| Status | Ý nghĩa |
|--------|---------|
| **Compliant** | Association chạy thành công, node ở desired state |
| **Non-Compliant** | Association fail hoặc node không ở desired state |

- Có thể gán **Compliance Severity** (Critical, High, Medium, Low, Unspecified)
- Kết hợp với **Change Calendar** để kiểm soát khi nào association được phép chạy
- Output có thể lưu vào **S3 bucket** để audit

---

## Use Cases phổ biến

### 1. Bootstrap instances khi launch

```
Association: Cài CloudWatch Agent cho mọi EC2 mới
─────────────────────────────────────────────────
Document:    AWS-ConfigureAWSPackage
Parameters:  action=Install, name=AmazonCloudWatchAgent
Targets:     Tag: Role=WebServer
Schedule:    rate(1 day)

→ Instance mới launch với tag Role=WebServer
→ State Manager tự động cài CloudWatch Agent
→ Mỗi ngày kiểm tra lại → cài lại nếu bị gỡ
```

### 2. Tự động update SSM Agent

```
Association: Giữ SSM Agent luôn mới nhất
──────────────────────────────────────
Document:    AWS-UpdateSSMAgent
Targets:     All managed instances
Schedule:    rate(14 days)
```

### 3. Join Windows vào Active Directory

```
Association: Tự động join AD domain
────────────────────────────────
Document:    AWS-JoinDirectoryServiceDomain
Parameters:  directoryId, directoryName, dnsIpAddresses
Targets:     Tag: OS=Windows, JoinAD=true
Schedule:    rate(1 day)
```

### 4. Enforce security configs

```
Association: Đảm bảo SSH config đúng chuẩn
────────────────────────────────────────
Document:    AWS-RunShellScript (custom)
Commands:    
  - Disable root login
  - Set SSH timeout
  - Restrict key-based auth only
Targets:     Tag: Compliance=PCI
Schedule:    rate(6 hours)
```

### 5. Stop/Start EC2 ngoài giờ (tiết kiệm chi phí)

```
Association 1: Stop instances lúc 8PM
──────────────────────────────────────
Document:    AWS-StopEC2Instance (Automation)
Targets:     Tag: AutoStop=true
Schedule:    cron(0 20 ? * MON-FRI *)

Association 2: Start instances lúc 7AM
──────────────────────────────────────
Document:    AWS-StartEC2Instance (Automation)
Targets:     Tag: AutoStop=true  
Schedule:    cron(0 7 ? * MON-FRI *)

→ Tiết kiệm ~60% chi phí EC2 cho dev/test environments
```

---

## So sánh State Manager vs các công cụ khác

### State Manager vs Maintenance Windows

| Tiêu chí | State Manager | Maintenance Windows |
|----------|---------------|-------------------|
| **Mục đích** | Duy trì desired state liên tục | Chạy tasks trong khung giờ cho phép |
| **Focus** | Compliance & configuration | Time-sensitive operations |
| **Scheduling** | Cron/rate, chạy khi target thay đổi | Chỉ trong maintenance window |
| **Auto-apply cho nodes mới** | ✅ Có | ❌ Không |
| **Use case** | "EC2 phải luôn cài antivirus" | "Patch OS vào Chủ nhật 2AM" |

### State Manager vs các công cụ ngoài AWS

| Tiêu chí | State Manager | Ansible | Puppet/Chef |
|----------|---------------|---------|-------------|
| **Chi phí** | **FREE** | Free (community) / Paid | Paid |
| **Agent** | SSM Agent (có sẵn) | Agentless (SSH) | Agent required |
| **Setup** | Minimal | Cần setup | Cần master server |
| **AWS integration** | Native | Qua modules | Qua modules |
| **Scope** | AWS resources | Any server | Any server |
| **Learning curve** | Thấp | Trung bình | Cao |

### State Manager vs AWS Config

| Tiêu chí | State Manager | AWS Config |
|----------|---------------|-----------|
| **Vai trò** | **Enforce** desired state | **Detect** configuration changes |
| **Hành động** | Apply configs, fix drift | Record & evaluate compliance |
| **Remediation** | Trực tiếp qua associations | Gián tiếp qua SSM Automation |

> [!TIP]
> **Kết hợp cả hai**: AWS Config phát hiện drift → trigger SSM Automation → State Manager enforce lại desired state.

---

## Pricing

| Component | Chi phí |
|-----------|--------|
| **State Manager** | **FREE** |
| **Associations** | FREE |
| **Association executions** | FREE |
| **SSM Agent** | FREE |

> [!NOTE]
> State Manager hoàn toàn miễn phí. Tuy nhiên, nếu dùng **Automation runbooks** qua State Manager, phí Automation vẫn áp dụng (free 100,000 steps/tháng, sau đó tính phí).

---

## Best Practices

1. **Dùng Tags để target** — Tự động apply cho nodes mới, dễ quản lý
2. **Set Rate Controls** — Tránh impact toàn bộ fleet cùng lúc
3. **Dùng `ApplyOnlyAtCronInterval`** cho Automation runbooks — Tránh chi phí bất ngờ
4. **Kết hợp Change Calendar** — Ngăn association chạy trong freeze periods
5. **Lưu output vào S3** — Giữ audit trail cho compliance
6. **Tách associations theo environment** — Dev/Staging/Prod dùng tags khác nhau
7. **Monitor Compliance dashboard** — Phát hiện non-compliant nodes sớm
8. **Custom IAM role cho AssociationDispatchAssumeRole** — Kiểm soát permissions chặt chẽ

---

## Tóm tắt

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   State Manager — Key Takeaways                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎯 WHAT:   Tool trong SSM để duy trì desired state trên nodes/resources    │
│  💰 COST:   FREE (Automation steps có thể tính phí riêng)                   │
│  🔑 CORE:   Association = Document + Targets + Schedule + Rate Controls     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  Khi nào dùng State Manager?                        │    │
│  │                                                                     │    │
│  │  ✅ Bootstrap instances khi launch (cài software, join domain)      │    │
│  │  ✅ Enforce security configs liên tục (SSH, firewall, antivirus)    │    │
│  │  ✅ Tự động update agents (SSM Agent, CloudWatch Agent)             │    │
│  │  ✅ Chống configuration drift ở quy mô lớn                          │    │
│  │  ✅ Schedule Automation runbooks (stop/start EC2, snapshots)        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  Nhớ nhanh cho exam                                 │    │
│  │                                                                     │    │
│  │  • "Desired state" / "Configuration drift" → State Manager          │    │
│  │  • "Bootstrap EC2 at launch" → State Manager + Tags                 │    │
│  │  • "Ensure software always installed" → State Manager               │    │
│  │  • "Schedule automation" → State Manager + Automation Runbook       │    │
│  │  • "FREE configuration management" → State Manager                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Systems Manager State Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-state.html)
- [Understanding how State Manager works](https://docs.aws.amazon.com/systems-manager/latest/userguide/state-manager-about.html)
- [Creating associations](https://docs.aws.amazon.com/systems-manager/latest/userguide/state-manager-associations-creating.html)
- [Targets and rate controls](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-state-manager-targets-and-rate-controls.html)
- [Scheduling automations with State Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/scheduling-automations-state-manager-associations.html)
- [AWS Systems Manager Pricing](https://aws.amazon.com/systems-manager/pricing/)
