# Amazon GuardDuty


## Mục lục

- [Tổng quan](#tổng-quan)
- [Đặc điểm chính](#đặc-điểm-chính)
- [Data Sources - Nguồn dữ liệu phân tích](#data-sources-nguồn-dữ-liệu-phân-tích)
- [Kiến trúc hoạt động](#kiến-trúc-hoạt-động)
- [Protection Plans Chi tiết](#protection-plans-chi-tiết)
- [Threat Intelligence Sources](#threat-intelligence-sources)
- [Finding Types - Các loại phát hiện](#finding-types-các-loại-phát-hiện)
- [Multi-Account Management](#multi-account-management)
- [Automated Response](#automated-response)
- [So sánh với các Security Services khác](#so-sánh-với-các-security-services-khác)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Use Cases thực tế](#use-cases-thực-tế)
- [Exam Tips cho Cloud Practitioner](#exam-tips-cho-cloud-practitioner)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**Amazon GuardDuty** là một dịch vụ **threat detection** (phát hiện mối đe dọa) được quản lý hoàn toàn, sử dụng **machine learning**, **anomaly detection** và **threat intelligence** để liên tục giám sát và phát hiện các hoạt động đáng ngờ trong AWS environment.

```
┌─────────────────────────────────────────────────────────────────┐
│                       Amazon GuardDuty                           │
│       "Intelligent Threat Detection for AWS"                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│   │  Machine    │ + │  Anomaly    │ + │     Threat          │   │
│   │  Learning   │   │  Detection  │   │  Intelligence       │   │
│   └─────────────┘   └─────────────┘   └─────────────────────┘   │
│                                                                  │
│   Phát hiện: Unauthorized access, Crypto-mining, Malware,       │
│              Data exfiltration, Compromised instances...         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Fully Managed** | Không cần deploy/quản lý infrastructure |
| **Continuous Monitoring** | Giám sát 24/7 tự động |
| **One-Click Enable** | Bật với 1 click, không cần cấu hình phức tạp |
| **Multi-Account Support** | Quản lý tập trung qua AWS Organizations |
| **Agentless** | Không cần cài đặt agent trên EC2/EKS |
| **30-Day Free Trial** | Dùng thử miễn phí 30 ngày |

---

## Data Sources - Nguồn dữ liệu phân tích

GuardDuty phân tích nhiều nguồn dữ liệu để phát hiện threats:

### 1. Foundational Data Sources (Mặc định)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Foundational Data Sources                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐                                        │
│  │  VPC Flow Logs      │  Network traffic metadata              │
│  │  (không cần enable) │  IP, ports, protocols, bytes...        │
│  └─────────────────────┘                                        │
│                                                                  │
│  ┌─────────────────────┐                                        │
│  │  CloudTrail Events  │  API calls trong AWS account           │
│  │  (Management Events)│  Who did what, when, from where        │
│  └─────────────────────┘                                        │
│                                                                  │
│  ┌─────────────────────┐                                        │
│  │  DNS Logs           │  DNS queries từ EC2 instances          │
│  │                     │  Phát hiện C2 communication            │
│  └─────────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> GuardDuty KHÔNG yêu cầu bạn phải enable VPC Flow Logs hay CloudTrail. Nó đọc trực tiếp từ AWS internal data sources.

### 2. Optional Protection Plans

| Protection | Data Source | Phát hiện gì |
|------------|-------------|--------------|
| **S3 Protection** | CloudTrail S3 data events | Data exfiltration, suspicious access |
| **EKS Protection** | EKS audit logs + Runtime | Compromised pods, privilege escalation |
| **RDS Protection** | RDS login events | Brute-force, anomalous login |
| **Lambda Protection** | VPC network logs | Malicious network activity |
| **EC2 Malware Protection** | EBS volume scanning | Malware trong EC2 instances |
| **S3 Malware Protection** | S3 object scanning | Malware trong uploaded files |

---

## Kiến trúc hoạt động

```
                    ┌─────────────────────────────┐
                    │       GuardDuty Engine      │
                    │  ┌─────────────────────────┐│
                    │  │ Machine Learning Models ││
                    │  │ Threat Intelligence     ││
                    │  │ Anomaly Detection       ││
                    │  └─────────────────────────┘│
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │              │           │           │              │
        ▼              ▼           ▼           ▼              ▼
  ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │VPC Flow  │  │CloudTrail│ │   DNS    │ │   EKS    │ │   S3     │
  │  Logs    │  │  Events  │ │  Logs    │ │  Logs    │ │  Events  │
  └──────────┘  └──────────┘ └──────────┘ └──────────┘ └──────────┘

                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │         FINDINGS            │
                    │   (Các phát hiện đáng ngờ)  │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼              ▼           ▼           ▼              ▼
  ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │EventBridge│  │ Security │ │ CloudWatch│ │  Lambda  │ │   SNS    │
  │(Automate)│  │   Hub    │ │ (Metrics)│ │(Remediate)│ │ (Alert)  │
  └──────────┘  └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Protection Plans Chi tiết

### 1. S3 Protection

Giám sát API calls liên quan đến S3 để phát hiện data exfiltration và suspicious access.

```
┌─────────────────────────────────────────────────────────────────┐
│                      S3 Protection                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phát hiện:                                                      │
│  ├── Unusual data access patterns (bất thường về thời gian/IP)  │
│  ├── Disabled logging hoặc versioning                           │
│  ├── Public bucket modifications                                 │
│  ├── Data exfiltration attempts                                  │
│  └── Access từ known malicious IPs                              │
│                                                                  │
│  Data Source: CloudTrail S3 Data Events                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. EKS Protection

Bảo vệ Amazon EKS clusters với 2 components:

```
┌─────────────────────────────────────────────────────────────────┐
│                       EKS Protection                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────┐                    │
│  │   EKS Audit Log Monitoring              │                    │
│  │   ├── Analyze Kubernetes API calls      │                    │
│  │   ├── Detect privilege escalation       │                    │
│  │   ├── Identify anonymous access         │                    │
│  │   └── Find policy violations            │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  ┌─────────────────────────────────────────┐                    │
│  │   EKS Runtime Monitoring (Agent-based)  │                    │
│  │   ├── File system activity              │                    │
│  │   ├── Process execution                 │                    │
│  │   ├── Network connections               │                    │
│  │   └── Container-level threats           │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. RDS Protection

Phát hiện suspicious login attempts vào Amazon RDS databases.

| Threat | Mô tả |
|--------|-------|
| **Brute-force attacks** | Nhiều failed login attempts |
| **Anomalous login** | Login từ unusual location/time |
| **Successful login after brute-force** | Compromised credentials |

**Supported Databases:** Amazon Aurora (MySQL & PostgreSQL), RDS for PostgreSQL, RDS for MySQL

### 4. Lambda Protection

```
┌─────────────────────────────────────────────────────────────────┐
│                     Lambda Protection                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Giám sát VPC network activity của Lambda functions:            │
│                                                                  │
│  ├── Communication với known malicious IPs/domains             │
│  ├── Crypto-mining activity                                      │
│  ├── Command & Control (C2) communication                       │
│  └── Data exfiltration qua network                              │
│                                                                  │
│  ⚠️ Chỉ áp dụng cho Lambda functions chạy trong VPC             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Malware Protection

#### EC2 Malware Protection

```
┌─────────────────────────────────────────────────────────────────┐
│                   EC2 Malware Protection                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Trigger: Khi có behavioral finding đáng ngờ                    │
│           (ví dụ: EC2 đang communicate với C2 server)           │
│                                                                  │
│  Process:                                                        │
│  1. GuardDuty tự động tạo EBS snapshot                          │
│  2. Scan snapshot tìm malware (AGENTLESS)                       │
│  3. Tạo finding nếu phát hiện malware                           │
│  4. Xóa snapshot sau khi scan xong                              │
│                                                                  │
│  ✅ Không impact performance của running instance               │
│  ✅ Không cần cài agent                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### S3 Malware Protection (New 2024)

```
┌─────────────────────────────────────────────────────────────────┐
│                   S3 Malware Protection                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tự động scan objects mới upload lên S3:                        │
│                                                                  │
│  Upload ─────► GuardDuty Scan ─────► Tag Object                 │
│                     │                    │                       │
│                     ▼                    ▼                       │
│              ┌──────────┐         ┌──────────────┐              │
│              │ Finding  │         │ CLEAN hoặc   │              │
│              │ (nếu có) │         │ THREATS_FOUND│              │
│              └──────────┘         └──────────────┘              │
│                                                                  │
│  Use case: User uploads, untrusted data pipelines               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Threat Intelligence Sources

GuardDuty sử dụng nhiều nguồn threat intelligence:

```
┌─────────────────────────────────────────────────────────────────┐
│                   Threat Intelligence Sources                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Built-in (AWS managed):                                         │
│  ├── AWS internal threat intelligence                           │
│  ├── CrowdStrike                                                 │
│  └── Proofpoint                                                  │
│                                                                  │
│  Custom (User managed):                                          │
│  ├── Trusted IP Lists (whitelist - không generate findings)    │
│  └── Threat IP Lists (blacklist - luôn generate findings)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Finding Types - Các loại phát hiện

### Categories

| Category | Prefix | Mô tả |
|----------|--------|-------|
| **Backdoor** | `Backdoor:` | EC2 bị cài backdoor |
| **Behavior** | `Behavior:` | Hành vi bất thường |
| **CryptoCurrency** | `CryptoCurrency:` | Crypto mining |
| **Impact** | `Impact:` | Tấn công gây hại |
| **Pentest** | `PenTest:` | Phát hiện pentesting tools |
| **Recon** | `Recon:` | Reconnaissance/scanning |
| **Stealth** | `Stealth:` | Che giấu hoạt động |
| **Trojan** | `Trojan:` | Malware trojan |
| **UnauthorizedAccess** | `UnauthorizedAccess:` | Truy cập trái phép |

### Ví dụ Finding Types phổ biến

```
┌─────────────────────────────────────────────────────────────────┐
│                     Common Finding Types                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EC2 Findings:                                                   │
│  ├── CryptoCurrency:EC2/BitcoinTool.B!DNS                       │
│  │    └── EC2 đang query crypto mining domains                  │
│  ├── UnauthorizedAccess:EC2/SSHBruteForce                       │
│  │    └── SSH brute-force attack                                │
│  └── Backdoor:EC2/C&CActivity.B!DNS                             │
│       └── EC2 communicating với C2 server                       │
│                                                                  │
│  IAM Findings:                                                   │
│  ├── UnauthorizedAccess:IAMUser/MaliciousIPCaller               │
│  │    └── API call từ known malicious IP                        │
│  └── Recon:IAMUser/UserPermissions                              │
│       └── Unusual IAM reconnaissance                            │
│                                                                  │
│  S3 Findings:                                                    │
│  ├── Exfiltration:S3/AnomalousBehavior                          │
│  │    └── Unusual data access pattern                           │
│  └── Policy:S3/BucketBlockPublicAccessDisabled                  │
│       └── Public access được enable                             │
│                                                                  │
│  Kubernetes Findings:                                            │
│  ├── PrivilegeEscalation:Kubernetes/PrivilegedContainer         │
│  │    └── Container chạy với privileged mode                    │
│  └── Execution:Kubernetes/ExecInKubeSystemPod                   │
│       └── Exec into kube-system pod                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Finding Severity

| Severity | Range | Mô tả |
|----------|-------|-------|
| **Low** | 1.0 - 3.9 | Suspicious nhưng chưa compromise |
| **Medium** | 4.0 - 6.9 | Deviation từ normal behavior |
| **High** | 7.0 - 8.9 | Likely compromised, cần action ngay |
| **Critical** | 9.0 - 10.0 | Actively compromised |

---

## Multi-Account Management

### Với AWS Organizations

```
┌─────────────────────────────────────────────────────────────────┐
│                   GuardDuty Multi-Account                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                  ┌─────────────────────┐                        │
│                  │  Delegated Admin    │                        │
│                  │  Account            │                        │
│                  │  (Central View)     │                        │
│                  └──────────┬──────────┘                        │
│                             │                                    │
│        ┌────────────────────┼────────────────────┐              │
│        │                    │                    │              │
│        ▼                    ▼                    ▼              │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐          │
│  │ Member   │        │ Member   │        │ Member   │          │
│  │Account 1 │        │Account 2 │        │Account 3 │          │
│  └──────────┘        └──────────┘        └──────────┘          │
│                                                                  │
│  ✅ Aggregated findings trong single view                       │
│  ✅ Centralized configuration                                    │
│  ✅ Auto-enable cho new member accounts                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Automated Response

### EventBridge Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Automated Response Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GuardDuty                                                       │
│      │                                                           │
│      ▼                                                           │
│  EventBridge Rule ───► Match: severity >= 7                     │
│      │                                                           │
│      │   ┌──────────────────────────────────────────┐           │
│      ├──►│ Lambda: Isolate EC2 (modify SG)         │           │
│      │   └──────────────────────────────────────────┘           │
│      │   ┌──────────────────────────────────────────┐           │
│      ├──►│ SNS: Alert Security Team                 │           │
│      │   └──────────────────────────────────────────┘           │
│      │   ┌──────────────────────────────────────────┐           │
│      └──►│ Step Functions: Incident Response        │           │
│          └──────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ví dụ Auto-Remediation

```python
# Lambda function để isolate compromised EC2
import boto3

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    
    # Lấy instance ID từ GuardDuty finding
    instance_id = event['detail']['resource']['instanceDetails']['instanceId']
    
    # Tạo isolation Security Group (no inbound/outbound)
    isolation_sg = 'sg-isolation-xxxxx'
    
    # Apply isolation SG
    ec2.modify_instance_attribute(
        InstanceId=instance_id,
        Groups=[isolation_sg]
    )
    
    return {'status': 'Instance isolated', 'instanceId': instance_id}
```

---

## So sánh với các Security Services khác

```
┌────────────────────────────────────────────────────────────────────┐
│              AWS Security Services - Chọn service nào?              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  "Ai đang tấn công AWS account của tôi?"                           │
│      └──► Amazon GuardDuty (Threat Detection)                      │
│                                                                     │
│  "Sensitive data trong S3 ở đâu?"                                  │
│      └──► Amazon Macie (Data Discovery)                            │
│                                                                     │
│  "EC2/Container có vulnerabilities không?"                         │
│      └──► Amazon Inspector (Vulnerability Scanning)                │
│                                                                     │
│  "Resources có đúng cấu hình không?"                               │
│      └──► AWS Config (Configuration Compliance)                    │
│                                                                     │
│  "Tổng hợp tất cả security findings?"                              │
│      └──► AWS Security Hub (Aggregation)                           │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

| Service | Focus | Method | Target |
|---------|-------|--------|--------|
| **GuardDuty** | Threat Detection | Behavioral analysis | Account-wide |
| **Macie** | Data Discovery | ML + Pattern matching | S3 only |
| **Inspector** | Vulnerabilities | CVE scanning | EC2, ECR, Lambda |
| **Config** | Compliance | Rule evaluation | AWS resources |
| **Security Hub** | Aggregation | Consolidation | All services |

---

## Pricing

### Pricing Model

| Component | Pricing Basis |
|-----------|---------------|
| **VPC Flow Logs** | Per GB analyzed |
| **CloudTrail Events** | Per million events |
| **DNS Logs** | Per million queries |
| **S3 Data Events** | Per million events |
| **EKS Logs** | Per million events |
| **Malware Scan** | Per GB scanned |

### Free Trial

- **30 days free** cho tất cả features
- Hiển thị estimated monthly cost trong trial period

> [!TIP]
> Trong free trial, GuardDuty sẽ hiển thị chi phí ước tính hàng ngày để bạn dự đoán chi phí khi trial kết thúc.

---

## Best Practices

### 1. Enable Across All Accounts & Regions

```
┌─────────────────────────────────────────────────────────────────┐
│                   GuardDuty Best Practices                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  □ Enable GuardDuty trong TẤT CẢ regions (không chỉ region     │
│    đang dùng - attackers có thể exploit unused regions)         │
│                                                                  │
│  □ Enable cho TẤT CẢ AWS accounts trong organization           │
│                                                                  │
│  □ Designate delegated administrator account                    │
│                                                                  │
│  □ Enable auto-enable cho new member accounts                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Enable All Protection Plans

| Plan | Recommendation |
|------|----------------|
| S3 Protection | ✅ Enable (mặc định ON) |
| EKS Protection | ✅ Enable nếu dùng EKS |
| RDS Protection | ✅ Enable nếu dùng RDS |
| Lambda Protection | ✅ Enable nếu dùng Lambda in VPC |
| Malware Protection | ✅ Enable cho critical workloads |

### 3. Setup Automated Response

- Integrate với EventBridge
- Setup alerts cho High/Critical findings
- Automate common remediation actions
- Integrate với ticketing system (Jira, ServiceNow)

### 4. Regular Review

- Review findings weekly
- Tune suppression rules để reduce noise
- Update trusted/threat IP lists
- Test detection với penetration testing

---

## Use Cases thực tế

### 1. Phát hiện Crypto Mining

```
Scenario: EC2 instance bị compromise, bắt đầu mine Bitcoin

GuardDuty Detection:
├── CryptoCurrency:EC2/BitcoinTool.B!DNS
│    └── EC2 query mining pool domains
├── UnauthorizedAccess:EC2/TorClient
│    └── Communication qua Tor network
└── Behavior:EC2/NetworkPortUnusual
     └── Traffic trên unusual ports

Response:
1. EventBridge trigger Lambda
2. Lambda isolate EC2 (change Security Group)
3. SNS notify security team
4. Create snapshot for forensics
```

### 2. Phát hiện Data Exfiltration

```
Scenario: Compromised IAM credentials được dùng để download S3 data

GuardDuty Detection:
├── UnauthorizedAccess:IAMUser/MaliciousIPCaller
│    └── API calls từ known bad IP
├── Exfiltration:S3/AnomalousBehavior  
│    └── Unusual large data download
└── Recon:IAMUser/UserPermissions
     └── Listing nhiều buckets bất thường

Response:
1. Disable compromised IAM credentials
2. Review CloudTrail logs
3. Assess data exposure
4. Rotate all related secrets
```

### 3. Kubernetes Attack Detection

```
Scenario: Attacker exploit vulnerable container để escalate privileges

GuardDuty Detection:
├── Execution:Kubernetes/ExecInKubeSystemPod
│    └── Exec vào kube-system pod
├── PrivilegeEscalation:Kubernetes/PrivilegedContainer
│    └── Container với privilege mode
└── Discovery:Kubernetes/SuccessfulAnonymousAccess
     └── Anonymous access tới API server

Response:
1. Kill malicious pod
2. Review RBAC permissions
3. Patch vulnerable images
4. Audit cluster configuration
```

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ GuardDuty:**
> - Threat Detection
> - Machine Learning + Anomaly Detection
> - VPC Flow Logs, CloudTrail, DNS Logs
> - Protect: EC2, S3, EKS, RDS, Lambda
> - Agentless (mostly)
> - 30-day free trial

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------| 
| GuardDuty dùng data sources nào? | VPC Flow Logs, CloudTrail, DNS logs |
| Có cần enable VPC Flow Logs trước? | **KHÔNG**, GuardDuty đọc internal data |
| GuardDuty và Macie khác nhau thế nào? | GuardDuty = **Threats**, Macie = **Sensitive Data** |
| GuardDuty có cần agent không? | Hầu hết **KHÔNG** (trừ EKS Runtime) |
| GuardDuty findings gửi đi đâu? | EventBridge, Security Hub, CloudWatch |

### Phân biệt với Macie và Inspector

```
┌─────────────────┬─────────────────┬─────────────────┐
│   GuardDuty     │     Macie       │   Inspector     │
├─────────────────┼─────────────────┼─────────────────┤
│ THREAT detection│ DATA discovery  │ VULNERABILITY   │
│ "Ai đang attack"│ "Data ở đâu"    │ scanning        │
│ Behavioral      │ Pattern matching│ CVE database    │
│ Account-wide    │ S3 only         │ EC2/ECR/Lambda  │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                   Amazon GuardDuty Summary                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Intelligent threat detection using ML                       │
│  ✅ Analyzes VPC Flow Logs, CloudTrail, DNS logs                │
│  ✅ Protection: S3, EKS, RDS, Lambda, Malware                   │
│  ✅ Agentless (mostly) - easy to enable                         │
│  ✅ Multi-account support via Organizations                     │
│  ✅ Integration: EventBridge, Security Hub                      │
│  ✅ 30-day free trial                                            │
│                                                                  │
│  Nhớ: GuardDuty = "Security Guard" cho AWS account              │
│       Phát hiện kẻ xấu đang làm gì trong account của bạn        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
