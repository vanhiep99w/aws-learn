# Shared Responsibility Model

## Tổng quan

Khi sử dụng AWS, **trách nhiệm bảo mật được chia sẻ** giữa AWS và khách hàng:

- **AWS**: Security **OF** the Cloud (bảo mật **của** cloud)
- **Khách hàng**: Security **IN** the Cloud (bảo mật **trong** cloud)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER RESPONSIBILITY                       │
│                  "Security IN the Cloud"                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Customer Data                                             │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  Platform, Applications, Identity & Access Management     │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  Operating System, Network & Firewall Configuration       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  Client-side Data     │  Server-side      │  Networking   │  │
│  │  Encryption           │  Encryption       │  Traffic      │  │
│  │                       │                   │  Protection   │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      AWS RESPONSIBILITY                          │
│                  "Security OF the Cloud"                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Software: Compute, Storage, Database, Networking         │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  Hardware/AWS Global Infrastructure                        │  │
│  │  Regions, Availability Zones, Edge Locations              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS chịu trách nhiệm gì?

AWS bảo vệ **hạ tầng** chạy tất cả services:

| Thành phần | Chi tiết |
|------------|----------|
| **Hardware** | Servers, storage devices, networking equipment |
| **Software** | Hypervisor, virtualization layer |
| **Networking** | Physical network infrastructure |
| **Facilities** | Data centers, cooling, power, physical security |
| **Regions/AZs** | Đảm bảo isolation và redundancy |

**AWS đảm bảo**:
- Data centers được bảo vệ 24/7 (guards, cameras, biometrics)
- Hardware được thay thế khi hỏng
- Infrastructure được patch và update
- Compliance certifications (SOC, ISO, PCI DSS...)

---

## Khách hàng chịu trách nhiệm gì?

Khách hàng bảo vệ **mọi thứ họ đặt lên cloud**:

| Thành phần | Chi tiết |
|------------|----------|
| **Data** | Encryption, backup, classification |
| **IAM** | Users, roles, policies, MFA |
| **OS** | Patching, hardening (với EC2) |
| **Network** | Security groups, NACLs, firewall rules |
| **Application** | Code security, input validation |
| **Encryption** | At-rest và in-transit |

---

## Trách nhiệm thay đổi theo loại service

### IaaS (EC2, EBS, VPC)
**Khách hàng chịu nhiều trách nhiệm nhất**:

```
Bạn quản lý:
├── Application code
├── Data encryption
├── OS patching & hardening
├── Security groups / Firewall
├── Network configuration
└── IAM permissions

AWS quản lý:
├── Hypervisor
├── Physical servers
└── Data center
```

### PaaS (RDS, Lambda, Elastic Beanstalk)
**AWS lo nhiều hơn, bạn lo ít hơn**:

```
Bạn quản lý:
├── Application code / Data
├── IAM permissions
└── Network configuration (VPC, security groups)

AWS quản lý:
├── OS patching
├── Runtime environment
├── Scaling
├── Hypervisor
└── Physical infrastructure
```

### SaaS (WorkMail, Chime)
**Bạn chỉ cần dùng**:

```
Bạn quản lý:
├── User accounts
└── Data bạn tạo

AWS quản lý:
└── Mọi thứ còn lại
```

### So sánh trách nhiệm theo service type

| Trách nhiệm | IaaS (EC2) | PaaS (RDS) | SaaS (WorkMail) |
|-------------|------------|------------|-----------------|
| Data encryption | 👤 Bạn | 👤 Bạn | 👤 Bạn |
| IAM | 👤 Bạn | 👤 Bạn | 👤 Bạn |
| Application | 👤 Bạn | 👤 Bạn | ☁️ AWS |
| OS patching | 👤 Bạn | ☁️ AWS | ☁️ AWS |
| Network config | 👤 Bạn | 👤 Bạn | ☁️ AWS |
| Hypervisor | ☁️ AWS | ☁️ AWS | ☁️ AWS |
| Physical | ☁️ AWS | ☁️ AWS | ☁️ AWS |

---

## Shared Controls (Trách nhiệm chung)

Một số controls **cả hai bên cùng chịu trách nhiệm**, nhưng ở các layers khác nhau:

| Control | AWS | Khách hàng |
|---------|-----|------------|
| **Patch Management** | Patch infrastructure, hypervisor | Patch guest OS, applications |
| **Configuration Management** | Configure infrastructure devices | Configure OS, databases, apps |
| **Awareness & Training** | Train AWS employees | Train your employees |

---

## Ví dụ thực tế

### Scenario 1: Data bị leak
```
Nguyên nhân: S3 bucket được set public
Ai chịu trách nhiệm? → KHÁCH HÀNG

Lý do: AWS cung cấp tools (bucket policies, Block Public Access)
       nhưng khách hàng phải configure đúng
```

### Scenario 2: EC2 bị hack qua SSH
```
Nguyên nhân: Security group mở port 22 cho 0.0.0.0/0, dùng weak password
Ai chịu trách nhiệm? → KHÁCH HÀNG

Lý do: Khách hàng config security group và quản lý credentials
```

### Scenario 3: Data center bị mất điện
```
Nguyên nhân: Sự cố điện ở data center
Ai chịu trách nhiệm? → AWS

Lý do: Physical infrastructure là trách nhiệm của AWS
       (nhưng khách hàng nên deploy Multi-AZ để HA)
```

### Scenario 4: RDS database bị SQL injection
```
Nguyên nhân: Application code không validate input
Ai chịu trách nhiệm? → KHÁCH HÀNG

Lý do: AWS quản lý database engine, nhưng application security
       là trách nhiệm của khách hàng
```

---

## Inherited Controls (Thừa hưởng từ AWS)

Một số controls bạn **không cần làm gì** vì AWS đã lo:

- ✅ Physical and environmental controls
- ✅ Data center security (guards, cameras, access control)
- ✅ Hardware disposal and destruction
- ✅ Network infrastructure security

---

## Customer-Specific Controls

Controls **chỉ khách hàng chịu trách nhiệm**:

- 🔐 Service and Communications Protection
- 🔐 Zone Security (routing data trong security environments)
- 🔐 Data classification
- 🔐 Application-level encryption
- 🔐 User access management

---

## Best Practices cho khách hàng

### 1. IAM
- ✅ Không dùng root account cho daily tasks
- ✅ Enable MFA cho tất cả users
- ✅ Áp dụng least privilege principle
- ✅ Rotate credentials định kỳ

### 2. Data Protection
- ✅ Encrypt data at-rest (S3, EBS, RDS)
- ✅ Encrypt data in-transit (TLS/SSL)
- ✅ Backup regularly
- ✅ Classify data theo sensitivity

### 3. Network Security
- ✅ Dùng VPC để isolate resources
- ✅ Configure security groups đúng cách
- ✅ Không mở ports không cần thiết
- ✅ Dùng NACLs cho additional layer

### 4. Monitoring & Logging
- ✅ Enable CloudTrail (API logging)
- ✅ Enable CloudWatch (monitoring)
- ✅ Enable VPC Flow Logs
- ✅ Set up alerts cho suspicious activities

### 5. Patching
- ✅ Patch OS regularly (EC2)
- ✅ Update application dependencies
- ✅ Dùng AWS Systems Manager cho automation

---

## Lưu ý quan trọng

⚠️ **Cloud KHÔNG có nghĩa là AWS lo hết security**

```
Sai lầm phổ biến:
"Mình dùng AWS rồi nên security không phải lo"

Thực tế:
- AWS lo infrastructure
- BẠN lo configuration, data, application
- Nếu bạn config sai → BẠN chịu trách nhiệm
```

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ:**
> - **AWS**: Security **OF** the Cloud = Infrastructure (hardware, data centers, hypervisor)
> - **Customer**: Security **IN** the Cloud = Data, configuration, applications

### Cách nhớ nhanh

```
┌─────────────────────────────────────────────────────────────────┐
│                     CÁCH NHỚ NHANH                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OF = Infrastructure VẬT LÝ → AWS lo                            │
│  ├── Data centers, servers, networking                          │
│  ├── Hypervisor, virtualization                                 │
│  └── Global infrastructure (Regions, AZs)                       │
│                                                                  │
│  IN = Những gì bạn ĐẶT LÊN cloud → Customer lo                  │
│  ├── Data encryption                                             │
│  ├── IAM (users, roles, MFA)                                    │
│  ├── OS patching (EC2)                                          │
│  ├── Security groups, network config                            │
│  └── Application code                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Ai responsible cho physical data center security? | **AWS** (OF the Cloud) |
| Ai responsible cho OS patching trên EC2? | **Customer** (IN the Cloud) |
| Ai responsible cho hypervisor security? | **AWS** |
| Ai responsible cho S3 bucket permissions? | **Customer** |
| Ai responsible cho RDS database engine patching? | **AWS** (managed service) |
| Ai responsible cho data encryption? | **Customer** |
| Ai responsible cho hardware failures? | **AWS** |
| Ai responsible cho IAM policies? | **Customer** |

### Theo loại Service

```
┌─────────────────────────────────────────────────────────────────┐
│  IaaS (EC2):     Customer lo NHIỀU nhất (OS, patching, apps)    │
│  PaaS (RDS):     AWS lo OS/patching, Customer lo data/config    │  
│  SaaS (WorkMail): AWS lo HẦU HẾT, Customer chỉ lo data/users    │
└─────────────────────────────────────────────────────────────────┘
```

### Phân biệt nhanh

| Nếu câu hỏi về... | Trả lời |
|-------------------|---------|
| Hardware, data center, physical | **AWS** |
| Data, encryption, IAM | **Customer** |
| OS patching EC2 | **Customer** |
| OS patching RDS/Lambda | **AWS** |
| Security groups | **Customer** |
| Hypervisor | **AWS** |
| Application code | **Customer** |

---

## Tài liệu tham khảo
- [AWS Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [Security Pillar - Shared Responsibility](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/shared-responsibility.html)
- [AWS Compliance Programs](https://aws.amazon.com/compliance/programs/)
