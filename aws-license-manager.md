# AWS License Manager

## Mục lục

- [Tổng quan](#tổng-quan)
- [Vấn đề License Manager giải quyết](#vấn-đề-license-manager-giải-quyết)
- [Các khái niệm cốt lõi](#các-khái-niệm-cốt-lõi)
- [Self-managed License — Cách hoạt động](#self-managed-license--cách-hoạt-động)
- [License Rules chi tiết](#license-rules-chi-tiết)
- [Hard Limit vs Soft Limit](#hard-limit-vs-soft-limit)
- [Notification với SNS](#notification-với-sns)
- [Tích hợp với AWS Services khác](#tích-hợp-với-aws-services-khác)
- [BYOL — Bring Your Own License](#byol--bring-your-own-license)
- [Multi-account với License Asset Groups](#multi-account-với-license-asset-groups)
- [Use Cases điển hình](#use-cases-điển-hình)
- [So sánh với các service dễ nhầm](#so-sánh-với-các-service-dễ-nhầm)
- [Giới hạn và Quota](#giới-hạn-và-quota)
- [Nguồn tham khảo](#nguồn-tham-khảo)

---

## Tổng quan

**AWS License Manager** là dịch vụ giúp quản lý software licenses từ các vendor (Microsoft, SAP, Oracle, IBM, ...) trên AWS và môi trường on-premises.

> "AWS License Manager makes it easier to manage your software licenses from software vendors (for example, Microsoft, SAP, Oracle, and IBM) across multiple AWS regions and accounts within an organization, offering consolidated visibility and comprehensive reporting for software license compliance at scale."
>
> *→ AWS License Manager giúp quản lý license phần mềm từ các vendor như Microsoft, SAP, Oracle, IBM trên nhiều AWS Region và account, cung cấp visibility tập trung và báo cáo compliance toàn diện.*

**Tóm tắt nhanh:**

- Khai báo licensing rules theo số lượng vCPU, Core, Socket, hoặc Instance
- Gắn rules vào EC2 AMI / launch template → tự động enforce khi launch
- **Block launch EC2** khi vượt hard limit (không cần can thiệp thủ công)
- Gửi notification qua **Amazon SNS** khi gần/hết license
- Hỗ trợ BYOL (Bring Your Own License)
- Tích hợp với AWS Organizations để quản lý cross-account

---

## Vấn đề License Manager giải quyết

Không có License Manager, các tổ chức phải tự theo dõi thủ công:

```
Không có License Manager:
  Dev launch EC2 → không ai biết đang dùng bao nhiêu license
  → Cuối kỳ audit: phát hiện đã dùng 80 license mà chỉ mua 50
  → Vi phạm compliance → phạt tiền
```

Với License Manager:

```
Có License Manager:
  Dev launch EC2 → License Manager kiểm tra tự động
  → Còn license: cho launch, trừ 1 license khỏi pool
  → Hết license: BLOCK ngay, không cho launch
  → Gần hết: SNS gửi alert cho admin
```

---

## Các khái niệm cốt lõi

| Khái niệm | Mô tả |
|---|---|
| **Self-managed License** | Cấu hình license rules cho BYOL software trong 1 account |
| **License Asset Group** | Quản lý license tập trung cross-account / cross-region trong Organizations |
| **License Configuration** | Tên cũ của Self-managed License |
| **Counting Type** | Cách đếm license: `vCPU`, `Core`, `Socket`, `Instance` |
| **Hard Limit** | Chặn hoàn toàn khi vượt quota |
| **Soft Limit** | Cho phép vượt nhưng gửi cảnh báo |
| **BYOL** | Bring Your Own License — dùng license đã mua từ vendor |
| **Automated Discovery** | Tự động phát hiện software đang chạy trên managed instances |

---

## Self-managed License — Cách hoạt động

### Luồng hoạt động đầy đủ

```
Bước 1 — Admin khai báo license:
┌─────────────────────────────────────┐
│ Self-managed License                │
│  Name: Windows-Server-BYOL          │
│  Counting type: vCPU                │
│  Count: 100 (tổng vCPU được phép)   │
│  Enforce limit: Hard Limit ✅        │
│  Associated AMI: Windows AMI ID     │
└─────────────────────────────────────┘

Bước 2 — Gắn license vào AMI / Launch Template:
  → Mọi EC2 launch từ AMI đó đều được License Manager giám sát

Bước 3 — Dev nhấn "Launch Instance":
  License Manager kiểm tra:
  ┌─ Còn quota? ──────────────────────────────────────────┐
  │  YES → ✅ Allow launch, đếm vCPU instance vào pool    │
  │  NO  → ❌ Block launch, báo lỗi                       │
  └───────────────────────────────────────────────────────┘

Bước 4 — SNS notification:
  → Usage vượt soft limit → SNS alert
  → Admin nhận email/SMS/webhook
```

### Các thông số khi tạo Self-managed License

| Tham số | Mô tả | Ví dụ |
|---|---|---|
| **Name** | Tên license configuration | `Windows-Server-BYOL` |
| **License type** | Cách đếm | `vCPU`, `Cores`, `Sockets`, `Instances` |
| **Number of licenses** | Tổng quota | `50` (50 vCPU) |
| **Enforce license limit** | Bật hard limit | `Enabled` |
| **Expiry Date** | Ngày hết hạn license (optional) | `2025-12-31` |
| **Product information** | Phần mềm cần track | `Windows Server 2022` |
| **Rules** | Ràng buộc bổ sung | Min/Max vCPU, Tenancy, ... |

---

## License Rules chi tiết

Các rules khả dụng theo từng counting type:

| Rule | vCPU | Core | Socket | Instance |
|---|:---:|:---:|:---:|:---:|
| `maximumVcpus` | ✅ | | | ✅ |
| `minimumVcpus` | ✅ | | | ✅ |
| `maximumCores` | | ✅ | | ✅ |
| `minimumCores` | | ✅ | | ✅ |
| `maximumSockets` | | | ✅ | ✅ |
| `minimumSockets` | | | ✅ | ✅ |
| `allowedTenancy` | ✅ | ✅ | ✅ | ✅ |
| `licenseAffinityToHost` | | ✅ | ✅ | |
| `honorVcpuOptimization` | ✅ | | | |
| `includedStoppedInstances` | ✅ | ✅ | ✅ | ✅ |

**Giải thích các rule quan trọng:**

- **`allowedTenancy`**: Giới hạn tenancy — `Shared` / `DedicatedInstance` / `DedicatedHost`. Nếu counting type là Core hoặc Socket → bắt buộc phải dùng Dedicated Host.
- **`licenseAffinityToHost`**: Khóa license vào host cụ thể trong N ngày (1–180). Hữu ích với Windows Server BYOL trên Dedicated Host.
- **`includedStoppedInstances`**: Nếu `True` → instance đang stopped vẫn được tính vào license usage. Mặc định `False` → instance stopped giải phóng license về pool.
- **`honorVcpuOptimization`**: Nếu `True` → đếm vCPU theo số vCPU tùy chỉnh của EC2 CPU optimization, không phải số mặc định.

---

## Hard Limit vs Soft Limit

| | **Hard Limit** | **Soft Limit** |
|---|---|---|
| **Hành động khi vượt** | ❌ Block launch instance hoàn toàn | ⚠️ Cho phép vượt, gửi cảnh báo |
| **Use case** | Compliance nghiêm ngặt, không được vượt | Monitoring và cảnh báo chủ động |
| **Notification** | SNS khi bị block | SNS khi vượt threshold |
| **Console option** | `Enforce license limit: Enabled` | `Enforce license limit: Disabled` |

> "Set hard or soft limits to control license usage and prevent the launch of a new, non-compliant instance. A hard limit blocks the launch of an out-of-compliance instance."
>
> *→ Đặt hard/soft limit để kiểm soát license usage và ngăn launch instance không compliant. Hard limit sẽ chặn launch instance vượt rule.*

**Khi nào dùng Hard Limit?**
- Công ty mua đúng 50 licenses Windows Server → không được vượt → dùng Hard Limit
- Audit compliance yêu cầu không bao giờ vượt quota

**Khi nào dùng Soft Limit?**
- Muốn cảnh báo sớm khi gần hết license nhưng không muốn block đột ngột
- Môi trường dev/test linh hoạt hơn

---

## Notification với SNS

License Manager gửi thông báo qua **Amazon SNS** khi:

- Usage vượt **soft limit**
- Instance launch bị **block** (hard limit)
- License sắp hết hạn

> "When license usage exceeds soft limits, License Manager sends notifications to license administrators and end users with Amazon Simple Notification Service (SNS)."
>
> *→ Khi license usage vượt soft limit, License Manager gửi notification cho administrators và end users qua Amazon SNS.*

**Cách thiết lập:**

```
1. Tạo SNS Topic
2. Tạo Subscription (Email / SMS / SQS / Lambda / ...)
3. Trong License Manager settings → chỉ định SNS Topic ARN
4. License Manager tự động publish message khi cần
```

---

## Tích hợp với AWS Services khác

### Amazon EC2

License Manager enforce trực tiếp trong lifecycle của EC2:

- **AMI**: Gắn license configuration vào AMI → mọi instance launch từ AMI đó đều bị kiểm tra
- **Launch Template**: Embed license rules vào template
- **Dedicated Hosts**: License Manager quản lý Host Resource Groups cho BYOL
- **Spot Instances & Spot Fleet**: Được hỗ trợ tracking

### AWS Systems Manager

- SSM Inventory dùng để **Automated Discovery** — tự phát hiện software đang chạy trên managed instances
- Phát hiện Windows Server, SQL Server, Oracle RDS đang dùng bao nhiêu license

### Amazon RDS

- Track vCPU-based BYOL license cho **RDS for Oracle** và **RDS for Db2**

### AWS Organizations

- Quản lý license policy cross-account trong Organizations
- Dùng **License Asset Groups** để tập trung governance nhiều account

---

## BYOL — Bring Your Own License

BYOL cho phép dùng lại license đã mua từ vendor (Microsoft, Oracle, ...) thay vì mua thêm "license included" từ AWS.

### Windows Server BYOL — Lưu ý quan trọng

| Điều kiện BYOL Windows Server | Chi tiết |
|---|---|
| **License loại** | Phải là perpetual license (vĩnh viễn) |
| **Thời điểm mua** | Phải mua trước ngày 1/10/2019 (Windows Server 2022 có thể khác) |
| **Phiên bản** | Windows Server 2019 trở xuống (theo điều kiện license mobility) |
| **Tenancy yêu cầu** | **Dedicated Host** (không chạy trên shared tenancy vì Windows Server không có License Mobility) |

> **Tại sao phải Dedicated Host cho Windows Server BYOL?**
>
> Microsoft không cho phép License Mobility cho Windows Server, nên bạn phải chạy trên phần cứng riêng biệt (Dedicated Host). SQL Server có Software Assurance mới được License Mobility → có thể chạy trên shared tenancy.

### License Type Conversion

License Manager hỗ trợ chuyển đổi giữa:
- **License Included** (AWS trả tiền) ↔ **BYOL** (bạn tự mua)

Không cần redeploy workload — chuyển đổi ngay trên instance đang chạy.

---

## Multi-account với License Asset Groups

Với tổ chức có nhiều AWS accounts:

```
Không có License Asset Groups:
  Account A: 30/50 licenses
  Account B: 45/50 licenses
  → Tổng: 75 licenses nhưng mỗi account track riêng → không biết tổng

Với License Asset Groups:
  Organization Master Account
  └── License Asset Group (tổng 100 licenses)
       ├── Account A: 30 licenses used
       ├── Account B: 45 licenses used
       └── Account C: 25 licenses used
       → Tổng: 100 licenses → alert khi gần 100
```

**Lợi ích:**
- Centralized governance qua Organizations
- Một dashboard tổng hợp toàn bộ
- Policy enforcement cross-account

---

## Use Cases điển hình

### Use Case 1 — Windows Server BYOL (câu thi phổ biến)

> Công ty mua 50 licenses Windows Server, license tính theo vCPU. Dev không được launch EC2 khi hết license.

```
Giải pháp:
1. Tạo Self-managed License:
   - Counting type: vCPU
   - License count: 100 (nếu mỗi instance 2 vCPU thì max 50 instances)
   - Enforce limit: Hard Limit ✅
2. Gắn vào Windows Server AMI
3. Configure SNS topic để nhận alert
4. Dev launch instance → License Manager tự động check và block nếu hết
```

### Use Case 2 — SQL Server BYOL trên Dedicated Host

> Công ty có SQL Server Enterprise licenses với Software Assurance → BYOL trên EC2 Dedicated Host.

```
Giải pháp:
1. Tạo Self-managed License:
   - Counting type: Cores (SQL Server tính theo core)
   - Rules: allowedTenancy = DedicatedHost
   - Rules: licenseAffinityToHost = 90 ngày
2. Tạo Dedicated Host
3. License Manager track cores đang dùng
```

### Use Case 3 — Inventory Discovery on-premises

> Muốn biết on-premises servers đang dùng bao nhiêu Oracle licenses.

```
Giải pháp:
1. Cài SSM Agent trên on-premises servers
2. Register với AWS Systems Manager (Hybrid Activations)
3. License Manager dùng SSM Inventory để discover Oracle software
4. Kết quả hiển thị trên License Manager dashboard
```

### Use Case 4 — Cross-account governance

> Tập đoàn có 20 AWS accounts, muốn quản lý tổng license pool tập trung.

```
Giải pháp:
1. Bật AWS Organizations
2. Tạo License Asset Group ở management account
3. Share với member accounts qua AWS RAM
4. Tất cả usage được track về 1 dashboard
```

---

## So sánh với các service dễ nhầm

| Service | Mục đích thực sự | Sai lầm thường gặp |
|---|---|---|
| **AWS License Manager** | Track và enforce software license usage khi launch EC2 | ✅ Đây là service đúng cho bài toán license count |
| **AWS Systems Manager Fleet Manager** | Quản trị và vận hành fleet EC2 instances (patch, session, inventory) | ❌ Không quản lý software license count |
| **AWS Certificate Manager (ACM)** | Quản lý SSL/TLS certificates | ❌ "Certificate" ≠ "License" — hoàn toàn khác nhau |
| **AWS Resource Access Manager (RAM)** | Share AWS resources giữa accounts | ❌ Share resources, không enforce license count |
| **AWS Service Catalog** | Quản lý catalog sản phẩm/template được approved | ❌ Governance về deployment, không về license count |
| **AWS Config** | Track configuration changes và compliance | ❌ Detect sau khi đã launch, không block trước |

> **⚠️ Đừng nhầm:** AWS Config có thể **detect** vi phạm license compliance sau khi instance đã launch, nhưng **không block** việc launch. License Manager **block trước** (preventive control). Config là **detective control**.

---

## Giới hạn và Quota

| Quota | Giá trị |
|---|---|
| Self-managed licenses tối đa / Region | **25** |
| Self-managed licenses gắn vào 1 resource | **10** |
| License Asset Groups / Region | Xem Service Quotas |

**Nguồn:** [AWS License Manager Service Quotas](https://docs.aws.amazon.com/general/latest/gr/licensemanager.html#limits_license-manager-quotas)

---

## Nguồn tham khảo

- [What is AWS License Manager?](https://docs.aws.amazon.com/license-manager/latest/userguide/license-manager.html) — AWS Official Docs
- [Self-managed license parameters and rules](https://docs.aws.amazon.com/license-manager/latest/userguide/config-overview.html) — AWS Official Docs
- [Use AWS License Manager API operations to manage software licenses](https://aws.amazon.com/blogs/mt/use-aws-license-manager-api-operations-to-manage-your-software-licenses-in-the-cloud/) — AWS Blog
- [Operating BYOL Windows Server Workloads Effectively on AWS](https://aws.amazon.com/blogs/modernizing-with-aws/operating-byol-windows-server-workloads-effectively-on-aws/) — AWS Blog
- [BYOL Best Practices for Microsoft Workloads](https://docs.aws.amazon.com/wellarchitected/latest/microsoft-workloads-lens/msftcost02-bp03.html) — AWS Well-Architected
