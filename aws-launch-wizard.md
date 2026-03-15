# AWS Launch Wizard


## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Supported Applications](#2-supported-applications)
- [3. Workflow](#3-workflow)
- [4. Key Features](#4-key-features)
- [5. So sánh với các dịch vụ khác](#5-so-sánh-với-các-dịch-vụ-khác)
- [6. Pricing](#6-pricing)
- [7. Exam Tips](#7-exam-tips)
- [8. Tài liệu tham khảo](#8-tài-liệu-tham-khảo)

---

## 1. Tổng quan

**AWS Launch Wizard** là dịch vụ giúp bạn **dễ dàng deploy các enterprise applications** (SAP, SQL Server, Active Directory...) lên AWS. Thay vì phải tự chọn instance type, cấu hình network, storage... Launch Wizard **hướng dẫn từng bước** và **tự động provision** resources theo best practices.

### Launch Wizard giải quyết vấn đề gì?

| Vấn đề truyền thống | Giải pháp với Launch Wizard |
|---|---|
| Deploy SAP/SQL Server phức tạp | **Guided wizard** - hướng dẫn từng bước |
| Không biết chọn instance type nào | **Auto-recommend** EC2 type dựa trên requirements |
| Khó ước tính chi phí | **Cost estimation** trước khi deploy |
| Setup thủ công dễ sai | **Automated provisioning** theo AWS best practices |
| Không có template tái sử dụng | **CloudFormation templates** được generate tự động |

### Ví dụ thực tế

```
KHÔNG có Launch Wizard:
  Bạn muốn deploy SQL Server HA trên AWS:
  😰 Phải tự:
     1. Chọn EC2 instance type phù hợp
     2. Tạo VPC, subnets, NAT Gateway
     3. Setup Active Directory
     4. Cài SQL Server
     5. Cấu hình Always On Availability Groups
     6. Setup monitoring
     → Mất nhiều NGÀY, dễ sai config

CÓ Launch Wizard:
  😎 Mở Launch Wizard → Chọn "SQL Server HA"
     → Nhập requirements (performance, memory)
     → Wizard tự recommend resources + show cost
     → Click Deploy → Tất cả tự động setup
     → Mất vài GIỜ, theo best practices
```

---

## 2. Supported Applications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Supported Applications                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  💾 SQL Server      │  │  📦 SAP             │  │  🏢 Active Directory│  │
│  │  ─────────────────  │  │  ─────────────────  │  │  ─────────────────  │  │
│  │                     │  │                     │  │                     │  │
│  │  • Single instance  │  │  • SAP HANA         │  │  • Self-managed     │  │
│  │  • HA (Always On)   │  │  • SAP NetWeaver    │  │    on EC2           │  │
│  │  • Failover Cluster │  │  • SAP S/4HANA      │  │  • AWS Managed      │  │
│  │    Instance (FCI)   │  │  • SAP BW/4HANA     │  │    Microsoft AD     │  │
│  │                     │  │  • SAP ASE          │  │                     │  │
│  │  Tự động setup:     │  │  Tự động setup:     │  │  Tự động setup:     │  │
│  │  • VPC + Subnets    │  │  • EC2 instances    │  │  • Domain           │  │
│  │  • NAT Gateway      │  │  • EBS + EFS storage│  │    Controllers      │  │
│  │  • AD Domain        │  │  • Backint Agent    │  │  • VPC + Subnets    │  │
│  │  • RDGW instances   │  │  • Data Provider    │  │  • Security Groups  │  │
│  │  • Monitoring       │  │                     │  │  • DNS              │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. SQL Server

**Mục đích**: Deploy Microsoft SQL Server trên AWS với các cấu hình từ đơn giản đến HA phức tạp.

| Deployment Type | Mô tả | Khi nào dùng |
|---|---|---|
| **Single Instance** | 1 EC2 chạy SQL Server | Dev/test, workload nhỏ |
| **High Availability (Always On)** | SQL Server Always On Availability Groups, multi-AZ | Production, cần uptime cao |
| **Failover Cluster Instance (FCI)** | Windows Server Failover Cluster + shared storage | Cần failover cấp instance |

**Launch Wizard tự động tạo gì cho SQL Server?**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                SQL Server HA - Auto Provisioned                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────── VPC ──────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ┌──── Public Subnet ────┐    ┌──── Public Subnet ────┐          │   │
│  │  │  NAT Gateway          │    │  NAT Gateway          │          │   │
│  │  │  RDGW (Remote Desktop)│    │  RDGW (Remote Desktop)│          │   │
│  │  └───────────────────────┘    └───────────────────────┘          │   │
│  │                                                                  │   │
│  │  ┌──── Private Subnet ───┐    ┌──── Private Subnet ───┐          │   │
│  │  │  AD Domain Controller │    │  AD Domain Controller │          │   │
│  │  │  SQL Server Node 1    │    │  SQL Server Node 2    │          │   │
│  │  │  (Primary)            │    │  (Secondary)          │          │   │
│  │  └───────────────────────┘    └───────────────────────┘          │   │
│  │         AZ 1                         AZ 2                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  + CloudWatch Monitoring (one-click setup)                              │
│  + Security Groups auto-configured                                      │
│  + SNS notifications                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> Nếu không có Launch Wizard, bạn phải tự tạo **VPC, 4 subnets, 2 NAT Gateways, 2 AD Domain Controllers, 2 SQL Servers, configure Always On AG, RDGW, monitoring** — dễ tốn vài ngày. Launch Wizard làm hết trong vài giờ.

### 2.2. SAP

**Mục đích**: Deploy SAP applications (ERP, CRM, BI) trên AWS. SAP là hệ thống enterprise phức tạp nhất — Launch Wizard đặc biệt hữu ích ở đây.

**SAP là gì?** SAP là phần mềm **ERP** (Enterprise Resource Planning) — quản lý toàn bộ hoạt động doanh nghiệp (tài chính, nhân sự, kho, sản xuất, bán hàng...) trong 1 hệ thống. Tương tự **Odoo** nhưng dành cho **tập đoàn lớn** (Fortune 500):

| | SAP | Odoo |
|---|---|---|
| **Target** | Enterprise lớn (Samsung, Toyota) | SME, startup |
| **Giá** | Hàng triệu USD/năm | Open-source / rẻ |
| **Infra** | Cần **TB-level RAM** (SAP HANA) | 1 EC2 `t3.medium` là đủ |
| **Deploy** | Rất phức tạp → cần **Launch Wizard** | Đơn giản, tự setup |

| SAP System | Mô tả | Database |
|---|---|---|
| **SAP HANA** | In-memory database platform | HANA (single hoặc multi-node) |
| **SAP S/4HANA** | ERP thế hệ mới chạy trên HANA | HANA |
| **SAP BW/4HANA** | Data warehouse trên HANA | HANA |
| **SAP NetWeaver** | Application server platform | HANA hoặc ASE |
| **SAP ASE** | Sybase Adaptive Server Enterprise | ASE |

**Launch Wizard tự động tạo gì cho SAP?**

| Component | Chi tiết |
|---|---|
| **EC2 Instances** | Memory-optimized (x1, x2idn, u-series) cho HANA |
| **EBS Volumes** | Tối ưu IOPS cho HANA data + log |
| **EFS** | Transport directory, shared file systems cho HA |
| **Backint Agent** | Backup HANA database → S3 |
| **Data Provider** | Gửi SAP metrics → CloudWatch |
| **OS Config** | Linux kernel parameters tối ưu cho HANA |

> [!IMPORTANT]
> SAP HANA yêu cầu **rất nhiều RAM** (up to 24TB). Launch Wizard tự chọn đúng instance type (ví dụ `x2idn.32xlarge` = 2TB RAM) dựa trên database size bạn nhập — tránh chọn sai instance rất tốn kém.

### 2.3. Active Directory

**Mục đích**: Setup Active Directory trên AWS — dùng để quản lý users, computers, group policies trong doanh nghiệp.

| Deployment Option | Mô tả | Khi nào dùng |
|---|---|---|
| **Self-managed AD on EC2** | Tự install AD Domain Services trên EC2 | Cần full control, custom config |
| **AWS Managed Microsoft AD** | Dùng AWS Directory Service (managed) | Muốn AWS quản lý, ít maintenance |

**Launch Wizard tự động tạo gì cho AD?**

```
┌─────────────────────────────────────────────────────────────────────────┐
│           Active Directory - Auto Provisioned                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────── VPC ──────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ┌──── AZ 1 ─────────────┐    ┌──── AZ 2 ─────────────┐          │   │
│  │  │                       │    │                       │          │   │
│  │  │  Domain Controller 1  │    │  Domain Controller 2  │          │   │
│  │  │  (Primary)            │◄──►│  (Replica)            │          │   │
│  │  │                       │    │                       │          │   │
│  │  │  DNS Server           │    │  DNS Server           │          │   │
│  │  │                       │    │                       │          │   │
│  │  └───────────────────────┘    └───────────────────────┘          │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  + Security Groups (ports 53, 88, 389, 445, 636...)                     │
│  + Route tables + NAT Gateways                                          │
│  + AD-integrated DNS auto-configured                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> Launch Wizard tự mở đúng **Security Group ports** cho AD (DNS=53, Kerberos=88, LDAP=389, SMB=445, LDAPS=636...). Setup thủ công rất dễ quên port → AD không hoạt động.

---

## 3. Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Launch Wizard Workflow                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Choose Application                                                 │
│  ┌──────────────────────────────────────────────┐                           │
│  │  SQL Server / SAP / Active Directory         │                           │
│  └────────────────────┬─────────────────────────┘                           │
│                       ▼                                                     │
│  STEP 2: Specify Requirements                                               │
│  ┌──────────────────────────────────────────────┐                           │
│  │  Performance, memory, users, HA needs        │                           │
│  └────────────────────┬─────────────────────────┘                           │
│                       ▼                                                     │
│  STEP 3: Review Recommendations                                             │
│  ┌──────────────────────────────────────────────┐                           │
│  │  • Recommended EC2 instance types            │                           │
│  │  • Storage (EBS volumes)                     │                           │
│  │  • 💰 Estimated cost                         │                           │
│  │  → Có thể modify trước khi deploy            │                           │
│  └────────────────────┬─────────────────────────┘                           │
│                       ▼                                                     │
│  STEP 4: Deploy                                                             │
│  ┌──────────────────────────────────────────────┐                           │
│  │  • Launch Wizard tạo CloudFormation stack    │                           │
│  │  • Tự động provision tất cả resources        │                           │
│  │  • Tạo Resource Group để quản lý             │                           │
│  └────────────────────┬─────────────────────────┘                           │
│                       ▼                                                     │
│  STEP 5: Monitor & Manage                                                   │
│  ┌──────────────────────────────────────────────┐                           │
│  │  • SNS notifications cho deployment status   │                           │
│  │  • CloudWatch monitoring (SQL Server)        │                           │
│  │  • Reusable CloudFormation template          │                           │
│  └──────────────────────────────────────────────┘                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Features

| Feature | Mô tả |
|---|---|
| **Guided Deployment** | Wizard hướng dẫn từng bước, không cần expert |
| **Resource Recommendation** | Tự recommend EC2 type, EBS volume dựa trên requirements |
| **Cost Estimation** | Xem estimated cost TRƯỚC khi deploy, modify ngay |
| **CloudFormation Templates** | Generate reusable templates cho lần deploy sau |
| **Early Input Validation** | Check prerequisites sớm, tránh fail giữa chừng |
| **Resource Groups** | Tự tạo resource group để dễ quản lý |
| **SNS Notifications** | Alert khi deployment thành công/thất bại |
| **Programmatic Deployment** | Hỗ trợ API + CloudFormation (từ 2024) |
| **Best Practices** | Deploy theo AWS Well-Architected Framework |

---

## 5. So sánh với các dịch vụ khác

| Feature | Launch Wizard | Elastic Beanstalk | CloudFormation | Service Catalog |
|---|---|---|---|---|
| **Focus** | Enterprise apps (SAP, SQL) | Web apps (Java, .NET, Node) | Any infrastructure | Governed product catalog |
| **Target user** | IT admins | Developers | DevOps engineers | End users (self-service) |
| **Guided wizard** | ✅ Step-by-step | ✅ Simple | ❌ Write templates | ✅ Launch products |
| **Cost estimation** | ✅ Trước deploy | ❌ | ❌ | ❌ |
| **Auto resource selection** | ✅ Recommend EC2/EBS | ✅ Auto scale | ❌ Bạn chọn | ❌ Admin chọn |
| **Generates CFN template** | ✅ Reusable | ✅ (internal) | Là CFN | Dùng CFN |
| **Best for** | SAP, SQL Server, AD | Web applications | Custom infrastructure | Governed deployments |

> [!IMPORTANT]
> **Launch Wizard** = deploy **enterprise applications** (SAP, SQL Server, AD) với guided wizard
> **Elastic Beanstalk** = deploy **web applications** (Java, .NET, Python, Node.js)
> **CloudFormation** = deploy **ANY infrastructure** bằng templates (IaC)

---

## 6. Pricing

| Component | Cost |
|---|---|
| **Launch Wizard** | **FREE** |
| **Deployed resources** | Trả tiền cho EC2, EBS, VPC... như bình thường |

> [!NOTE]
> Launch Wizard hoàn toàn miễn phí. Bạn chỉ trả tiền cho các AWS resources mà nó provision (EC2, EBS, NAT Gateway, etc.).

---

## 7. Exam Tips

1. **Launch Wizard** = "guided deployment cho enterprise apps" → chọn khi đề nói "easily deploy SAP/SQL Server on AWS"
2. **FREE service** - chỉ trả tiền cho resources được deploy
3. Supports: **SQL Server** (single + HA), **SAP** (HANA, S/4HANA), **Active Directory**
4. Tự động **recommend EC2 instance types** và **estimate cost** trước khi deploy
5. Generate **reusable CloudFormation templates** cho lần deploy sau
6. **Launch Wizard vs Elastic Beanstalk**: Launch Wizard = enterprise apps, Beanstalk = web apps
7. **Launch Wizard vs CloudFormation**: Launch Wizard **dùng** CloudFormation bên dưới, nhưng thêm guided wizard + recommendations
8. Deploy theo **AWS best practices** và **Well-Architected Framework**

---

## 8. Tài liệu tham khảo

- [AWS Launch Wizard Documentation](https://docs.aws.amazon.com/launchwizard/)
- [AWS Launch Wizard for SQL Server](https://docs.aws.amazon.com/launchwizard/latest/userguide/launch-wizard-sql.html)
- [AWS Launch Wizard for SAP](https://docs.aws.amazon.com/launchwizard/latest/userguide/launch-wizard-sap.html)
- [AWS Launch Wizard for Active Directory](https://docs.aws.amazon.com/launchwizard/latest/userguide/launch-wizard-active-directory.html)
- [Elastic Beanstalk](elastic-beanstalk.md) - So sánh: deploy web apps
- [CloudFormation](aws-cloudformation.md) - So sánh: IaC templates
