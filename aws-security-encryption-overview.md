# AWS Security & Encryption - Tổng Quan & Diagrams

## 📋 Mục lục

- [Overview Diagram](#overview-diagram)
- [Encryption: Tổng quan](#encryption-tổng-quan)
- [KMS - Key Management Service](#kms---key-management-service)
- [Encryption At Rest vs In Transit](#encryption-at-rest-vs-in-transit)
- [Threat Detection & Protection](#threat-detection--protection)
- [Secrets & Certificate Management](#secrets--certificate-management)
- [Authentication: Cognito](#authentication-cognito)
- [Tổng hợp: Khi nào dùng service nào?](#tổng-hợp-khi-nào-dùng-service-nào)
- [Security Layers tổng thể](#security-layers-tổng-thể)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Overview Diagram

### Toàn cảnh hệ thống Security & Encryption trong AWS

```mermaid
graph TB
    subgraph PERIMETER["🛡️ PERIMETER DEFENSE - Chặn tấn công"]
        SHIELD["🛡️ Shield<br/>DDoS Protection<br/>Layer 3/4/7"]
        WAF["🔥 WAF<br/>Web App Firewall<br/>SQL injection, XSS"]
        FW_MGR["📋 Firewall Manager<br/>Quản lý tập trung<br/>Multi-Account"]
    end

    subgraph DETECT["🔍 THREAT DETECTION - Phát hiện mối đe dọa"]
        GD["🕵️ GuardDuty<br/>Intelligent Threat Detection<br/>ML-based"]
        INSP["🔎 Inspector<br/>Vulnerability Scanning<br/>EC2, ECR, Lambda"]
        MACIE["🔒 Macie<br/>Sensitive Data Discovery<br/>PII trong S3"]
        SECHUB["📊 Security Hub<br/>Tổng hợp findings<br/>Single pane of glass"]
    end

    subgraph ENCRYPT["🔐 ENCRYPTION - Mã hóa dữ liệu"]
        KMS["🔑 KMS<br/>Key Management<br/>Encrypt/Decrypt"]
        HSM["🏦 CloudHSM<br/>Dedicated Hardware<br/>FIPS 140-2 Level 3"]
        ACM["📜 ACM<br/>SSL/TLS Certificates<br/>HTTPS"]
    end

    subgraph SECRETS["🤫 SECRETS - Quản lý bí mật"]
        SM["🔐 Secrets Manager<br/>DB passwords, API keys<br/>Auto-rotation"]
        SSM_PS["📝 SSM Parameter Store<br/>Config & Secrets<br/>Free tier"]
    end

    subgraph AUTH["👤 AUTHENTICATION - Xác thực"]
        COGNITO["🧠 Cognito<br/>User Pools + Identity Pools<br/>Social Login, JWT"]
        IAM_AUTH["🛡️ IAM<br/>Users, Roles, Policies"]
    end

    subgraph COMPLIANCE["📋 COMPLIANCE - Tuân thủ & Audit"]
        ARTIFACT["📄 Artifact<br/>Download AWS Compliance Reports<br/>SOC, PCI, ISO, HIPAA BAA"]
        AUDIT_MGR["📝 Audit Manager<br/>Automated Evidence Collection<br/>GDPR, HIPAA, PCI DSS Frameworks"]
    end

    PERIMETER -->|"chặn trước"| DETECT
    DETECT -->|"phát hiện sau"| SECHUB
    ENCRYPT -.->|"mã hóa data"| KMS
    SECRETS -.-|"dùng KMS encrypt"| KMS
    DETECT -.-|"evidence cho"| AUDIT_MGR

    style PERIMETER fill:#3b1520,color:#ecf0f1,stroke:#e74c3c,stroke-width:2px
    style DETECT fill:#2c1810,color:#ecf0f1,stroke:#e67e22,stroke-width:2px
    style ENCRYPT fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style SECRETS fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style AUTH fill:#2c1830,color:#ecf0f1,stroke:#8e44ad,stroke-width:2px
    style COMPLIANCE fill:#1a2740,color:#ecf0f1,stroke:#f39c12,stroke-width:2px

    style SHIELD fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style WAF fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:2px
    style FW_MGR fill:#78281f,color:#fff,stroke:#c0392b,stroke-width:2px
    style GD fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style INSP fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style MACIE fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style SECHUB fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style KMS fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style HSM fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style ACM fill:#0e6655,color:#fff,stroke:#16a085,stroke-width:2px
    style SM fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style SSM_PS fill:#1a5276,color:#fff,stroke:#2980b9,stroke-width:2px
    style COGNITO fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style IAM_AUTH fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style ARTIFACT fill:#d4ac0d,color:#fff,stroke:#f1c40f,stroke-width:2px
    style AUDIT_MGR fill:#b7950b,color:#fff,stroke:#f39c12,stroke-width:2px
```

### Bảng so sánh nhanh

| Service | Câu hỏi trả lời | Ví dụ |
|---------|-----------------|-------|
| **Shield** | Chống DDoS? | UDP flood, SYN flood |
| **WAF** | Chặn web attack? | SQL injection, XSS, bot |
| **GuardDuty** | Ai đang tấn công? | Unusual API calls, crypto mining |
| **Inspector** | Có lỗ hổng bảo mật? | CVE trong EC2, ECR images |
| **Macie** | Có dữ liệu nhạy cảm lộ? | PII, credit cards trong S3 |
| **Security Hub** | Tổng hợp findings? | Aggregate từ tất cả services |
| **KMS** | Encrypt/Decrypt data? | S3, EBS, RDS encryption |
| **CloudHSM** | Cần FIPS Level 3? | Banking, government compliance |
| **ACM** | SSL/TLS certificates? | HTTPS cho ALB, CloudFront |
| **Secrets Manager** | Lưu passwords? | DB credentials, API keys |
| **Cognito** | User authentication? | Login, social auth, JWT |
| **Artifact** | AWS compliance reports? | Download SOC, PCI, ISO certs từ AWS |
| **Audit Manager** | Chuẩn bị audit? | Thu thập evidence tự động cho GDPR, HIPAA, PCI DSS |

---

## Encryption: Tổng quan

### 3 loại Encryption trong AWS

```mermaid
graph TB
    subgraph AT_REST["💾 Encryption At Rest - Dữ liệu lưu trữ"]
        SSE["Server-Side Encryption<br/>AWS encrypt/decrypt cho bạn"]
        CSE["Client-Side Encryption<br/>BẠN encrypt trước khi gửi"]
    end

    subgraph IN_TRANSIT["🔄 Encryption In Transit - Dữ liệu đang truyền"]
        TLS["TLS/SSL<br/>HTTPS connections<br/>ACM certificates"]
        VPN["VPN / Direct Connect<br/>Encrypted tunnels"]
    end

    subgraph SSE_TYPES["SSE Types cho S3"]
        SSE_S3["SSE-S3<br/>AWS managed key<br/>✅ Mặc định"]
        SSE_KMS["SSE-KMS<br/>KMS managed key<br/>✅ Audit + control"]
        SSE_C["SSE-C<br/>Customer key<br/>⚠️ Bạn quản lý key"]
    end

    SSE --> SSE_TYPES

    style AT_REST fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style IN_TRANSIT fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style SSE_TYPES fill:#1c2833,color:#ecf0f1,stroke:#f1c40f,stroke-width:1px
    style SSE fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style CSE fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style TLS fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style VPN fill:#1a5276,color:#fff,stroke:#2980b9,stroke-width:2px
    style SSE_S3 fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style SSE_KMS fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style SSE_C fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ENCRYPTION AT REST vs IN TRANSIT                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  💾 AT REST (stored data)              🔄 IN TRANSIT (moving data)          │
│  ═════════════════════════             ═══════════════════════════          │
│                                                                             │
│  Data nằm trên disk/storage            Data đang di chuyển qua network      │
│                                                                             │
│  • S3: SSE-S3, SSE-KMS, SSE-C         • HTTPS (TLS 1.2/1.3)                 │
│  • EBS: KMS encryption                • VPN tunnels                         │
│  • RDS: KMS encryption                • Direct Connect + MACsec             │
│  • DynamoDB: KMS encryption            • API calls (SDK tự động TLS)        │
│  • EFS: KMS encryption                                                      │
│                                                                             │
│  ⚡ Hầu hết services hỗ trợ           ⚡ Hầu hết services ENFORCE           │
│     KMS encryption at rest                TLS in transit by default         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## KMS - Key Management Service

### "Quản lý keys để encrypt/decrypt data"

```mermaid
graph TB
    subgraph KEY_TYPES["🔑 Các loại KMS Keys"]
        AWS_OWNED["AWS Owned Keys<br/>AWS quản lý 100%<br/>Miễn phí<br/>Không thấy trong console"]
        AWS_MANAGED["AWS Managed Keys<br/>aws/s3, aws/rds...<br/>Miễn phí<br/>Auto-rotate 1 năm"]
        CMK["Customer Managed Keys<br/>Bạn tạo & quản lý<br/>$1/key/tháng<br/>Full control"]
    end

    subgraph ENVELOPE["📦 Envelope Encryption"]
        MASTER["🔑 KMS Key<br/>Master Key<br/>KHÔNG rời khỏi KMS"]
        DATA_KEY["🗝️ Data Key<br/>Encrypt data thực tế<br/>Dùng rồi xóa plaintext"]
        DATA["📄 Your Data<br/>Encrypted bởi Data Key"]
    end

    MASTER -->|"1. GenerateDataKey"| DATA_KEY
    DATA_KEY -->|"2. Encrypt locally"| DATA

    subgraph INTEGRATIONS["🔗 100+ AWS Services"]
        direction LR
        I_S3["📦 S3"]
        I_EBS["💿 EBS"]
        I_RDS["🗄️ RDS"]
        I_SM["🔐 Secrets Mgr"]
        I_SSM["📝 SSM Params"]
        I_LAMBDA["⚡ Lambda"]
    end

    CMK -->|"encrypt"| INTEGRATIONS

    style KEY_TYPES fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style ENVELOPE fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style INTEGRATIONS fill:#1c2833,color:#ecf0f1,stroke:#3498db,stroke-width:1px
    style AWS_OWNED fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:2px
    style AWS_MANAGED fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style CMK fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style MASTER fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style DATA_KEY fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style DATA fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:2px
    style I_S3 fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style I_EBS fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style I_RDS fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style I_SM fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style I_SSM fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style I_LAMBDA fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
```

### KMS vs CloudHSM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          KMS vs CloudHSM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔑 KMS (90% cases)                   🏦 CloudHSM (compliance)              │
│  ════════════════════                  ═══════════════════════              │
│                                                                             │
│  • Multi-tenant HSMs                   • Single-tenant dedicated HSMs       │
│  • FIPS 140-2 Level 2                  • FIPS 140-2 Level 3 ⭐              │
│  • AWS manages hardware               • BẠN quản lý keys                    │
│  • Symmetric + Asymmetric             • Full crypto library                 │
│  • $1/key/month                        • ~$1.45/hour (~$1,050/month)        │
│  • Auto-integrates 100+ services       • Manual integration                 │
│                                                                             │
│  ✅ Dùng khi:                          ✅ Dùng khi:                         │
│  • Cần encryption cho AWS services     • FIPS Level 3 required              │
│  • General encryption needs            • Oracle TDE, SSL offloading         │
│  • Cost-effective                      • Custom crypto (PKCS#11)            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Encryption At Rest vs In Transit

### Cách encrypt từng loại resource

```mermaid
graph LR
    subgraph REST["💾 At Rest"]
        S3_E["📦 S3<br/>SSE-S3 / SSE-KMS / SSE-C"]
        EBS_E["💿 EBS<br/>KMS encryption<br/>Encrypt khi tạo volume"]
        RDS_E["🗄️ RDS<br/>KMS encryption<br/>Encrypt khi tạo DB"]
        DDB_E["📊 DynamoDB<br/>AWS owned / KMS<br/>Mặc định encrypted"]
        EFS_E["📁 EFS<br/>KMS encryption"]
    end

    subgraph TRANSIT["🔄 In Transit"]
        ALB_E["⚖️ ALB<br/>ACM Certificate<br/>TLS termination"]
        CF_E["🌐 CloudFront<br/>ACM Cert (us-east-1)<br/>Viewer + Origin HTTPS"]
        API_E["🚪 API Gateway<br/>TLS by default"]
        VPN_E["🔒 VPN<br/>IPSec tunnels"]
    end

    KMS_C["🔑 KMS"] -->|"keys cho"| REST
    ACM_C["📜 ACM"] -->|"certs cho"| TRANSIT

    style REST fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style TRANSIT fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style S3_E fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style EBS_E fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style RDS_E fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style DDB_E fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style EFS_E fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style ALB_E fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style CF_E fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style API_E fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style VPN_E fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style KMS_C fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style ACM_C fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
```

---

## Threat Detection & Protection

### Tầng bảo vệ từ ngoài vào trong

```mermaid
graph TB
    INTERNET["🌍 Internet / Attackers"]

    INTERNET --> SHIELD_L["🛡️ Shield<br/>DDoS Protection"]
    SHIELD_L --> WAF_L["🔥 WAF<br/>Web Application Firewall"]
    WAF_L --> SG["🔒 Security Groups<br/>Instance-level Firewall"]
    SG --> APP["🏗️ Application"]

    APP -.->|"logs & data"| GD_L["🕵️ GuardDuty<br/>Threat Detection"]
    APP -.->|"scan"| INSP_L["🔎 Inspector<br/>Vulnerability Scan"]
    APP -.->|"S3 data"| MACIE_L["🔒 Macie<br/>Sensitive Data"]

    GD_L --> HUB["📊 Security Hub"]
    INSP_L --> HUB
    MACIE_L --> HUB

    HUB --> EB_L["📡 EventBridge<br/>→ SNS, Lambda, Auto-fix"]

    style INTERNET fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:3px
    style SHIELD_L fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:2px
    style WAF_L fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:2px
    style SG fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style APP fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:2px
    style GD_L fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style INSP_L fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style MACIE_L fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style HUB fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style EB_L fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
```

### So sánh Threat Detection services

| Service | Scan gì? | Target | Tự động? |
|---------|----------|--------|----------|
| **GuardDuty** | Threats & attacks | VPC Flow, CloudTrail, DNS | ✅ Continuous, ML-based |
| **Inspector** | Vulnerabilities (CVE) | EC2, ECR, Lambda | ✅ Continuous scanning |
| **Macie** | Sensitive data (PII) | S3 buckets | ✅ / Scheduled jobs |
| **Security Hub** | Aggregate findings | All security services | ✅ Centralized view |

### Shield + WAF: Chống tấn công từ bên ngoài

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       SHIELD + WAF                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🛡️ SHIELD                             🔥 WAF                                │
│  ═══════════                           ═════                                 │
│                                                                              │
│  Chống DDoS attacks:                   Chặn web attacks:                     │
│  • Layer 3: UDP/ICMP floods            • SQL Injection                       │
│  • Layer 4: SYN floods                 • Cross-Site Scripting (XSS)          │
│  • Layer 7: HTTP floods                • IP blacklist/whitelist              │
│                                        • Rate limiting                       │
│  Standard: FREE (auto bật)             • Geo-blocking                        │
│  Advanced: $3,000/month                • Bot Control                         │
│  → DRT team, cost protection           • Custom rules                        │
│                                                                              │
│  Deploy trên:                          Deploy trên:                          │
│  • CloudFront                          • CloudFront                          │
│  • Route 53                            • ALB                                 │
│  • ALB / NLB                           • API Gateway                         │
│  • Global Accelerator                  • AppSync                             │
│  • EC2 (Advanced only)                 • Cognito User Pool                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Secrets & Certificate Management

### Lưu trữ và quản lý secrets

```mermaid
graph TB
    subgraph SECRETS_MGMT["🤫 Quản lý Secrets"]
        SM_D["🔐 Secrets Manager<br/>$0.40/secret/month<br/>Auto-rotation ✅<br/>DB credentials, API keys"]
        PS_D["📝 SSM Parameter Store<br/>Standard: FREE<br/>Advanced: $0.05/param<br/>Config values, secrets"]
    end

    subgraph CERTS["📜 Certificate Management"]
        ACM_D["📜 ACM<br/>SSL/TLS Certificates<br/>FREE với AWS services<br/>Auto-renewal ✅"]
        ACM_PCA["🔒 ACM Private CA<br/>Private certificates<br/>Internal apps"]
    end

    subgraph USAGE["🔗 Sử dụng"]
        APP_D["⚡ Applications<br/>GetSecretValue API"]
        ALB_D["⚖️ ALB → HTTPS"]
        CF_D["🌐 CloudFront → HTTPS"]
        APIGW_D["🚪 API Gateway → HTTPS"]
    end

    SM_D -->|"credentials"| APP_D
    PS_D -->|"config"| APP_D
    ACM_D -->|"certificates"| ALB_D
    ACM_D -->|"certs (us-east-1)"| CF_D
    ACM_D -->|"certificates"| APIGW_D

    style SECRETS_MGMT fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style CERTS fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style USAGE fill:#1c2833,color:#ecf0f1,stroke:#7f8c8d,stroke-width:1px
    style SM_D fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style PS_D fill:#1a5276,color:#fff,stroke:#2980b9,stroke-width:2px
    style ACM_D fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style ACM_PCA fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style APP_D fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style ALB_D fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style CF_D fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
    style APIGW_D fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:1px
```

### Secrets Manager vs Parameter Store

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               Secrets Manager vs SSM Parameter Store                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔐 Secrets Manager                    📝 Parameter Store                   │
│  ════════════════════                  ═══════════════════                  │
│                                                                             │
│  • $0.40/secret/month                  • Standard: FREE (10,000 params)     │
│  • Auto-rotation ✅ (native)            • Advanced: $0.05/param/month       │
│  • Cross-account sharing ✅             • Manual rotation (Lambda)          │
│  • RDS/Redshift/DocumentDB native       • Parameter policies (expiration)   │
│  • Force encryption (KMS)              • Encryption optional                │
│  • Built-in Lambda rotation             • Hierarchical paths (/app/db/pass) │
│                                                                             │
│  ✅ Dùng khi:                          ✅ Dùng khi:                         │
│  • DB credentials cần auto-rotate      • Config values (feature flags)      │
│  • 3rd party API keys                  • Non-sensitive parameters           │
│  • Cross-account secrets               • Cost-sensitive (FREE tier)         │
│  • Compliance: rotation required        • Simple secrets (no rotation)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication: Cognito

### User Pools vs Identity Pools

```mermaid
graph LR
    USER["👤 User"]

    subgraph UP["🧠 User Pool - WHO are you?"]
        LOGIN["Login / Sign Up<br/>Email, Social, SAML"]
        JWT["📋 JWT Tokens<br/>ID + Access + Refresh"]
    end

    subgraph IP["🎫 Identity Pool - WHAT can you do?"]
        CREDS["🔑 AWS Credentials<br/>Temporary STS"]
        ACCESS["🏗️ AWS Resources<br/>S3, DynamoDB..."]
    end

    USER -->|"1. authenticate"| LOGIN
    LOGIN -->|"2. returns"| JWT
    JWT -->|"3. exchange"| IP
    CREDS -->|"4. access"| ACCESS

    style UP fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style IP fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style USER fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style LOGIN fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style JWT fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style CREDS fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style ACCESS fill:#2c3e50,color:#fff,stroke:#7f8c8d,stroke-width:2px
```

```
User Pool → "Bạn là AI?" → JWT Token
Identity Pool → "Bạn ĐƯỢC LÀM GÌ trong AWS?" → AWS Credentials
Thường dùng CẢ HAI: User Pool → authenticate → Identity Pool → AWS access
```

---

## Tổng hợp: Khi nào dùng service nào?

```mermaid
graph TB
    Q["❓ Bạn cần gì?"]

    Q -->|"DDoS Layer 3/4?<br/>UDP, SYN flood"| A1["🛡️ Shield<br/>Absorb volumetric attacks"]
    Q -->|"DDoS Layer 7?<br/>HTTP flood"| DDOS7{"🌊 HTTP Flood"}
    DDOS7 -->|"Auto detect"| A1B["🛡️ Shield Advanced"]
    DDOS7 -->|"Rate limiting"| A2B["🔥 WAF Rate-based Rules"]
    Q -->|"SQL injection,<br/>XSS, bots?"| A2["🔥 WAF<br/>Web ACL Rules"]
    Q -->|"Block IPs /<br/>Geo-blocking?"| A2C["🔥 WAF<br/>IP Set / Geo Rules"]
    Q -->|"Encrypt data?"| A3["🔑 KMS"]
    Q -->|"FIPS Level 3?"| A4["🏦 CloudHSM"]
    Q -->|"SSL/TLS cert?"| A5["📜 ACM"]
    Q -->|"Lưu DB password?"| A6["🔐 Secrets Manager"]
    Q -->|"Config values?"| A7["📝 Parameter Store"]
    Q -->|"Threat detection?"| A8["🕵️ GuardDuty"]
    Q -->|"Vulnerability scan?"| A9["🔎 Inspector"]
    Q -->|"PII trong S3?"| A10["🔒 Macie"]
    Q -->|"User auth?"| A11["🧠 Cognito"]
    Q -->|"Tổng hợp findings?"| A12["📊 Security Hub"]
    Q -->|"WAF multi-account?"| A13["📋 Firewall Manager"]
    Q -->|"AWS compliance<br/>reports/certs?"| A14["📄 Artifact<br/>Download SOC, PCI, ISO"]
    Q -->|"Chuẩn bị audit<br/>evidence?"| A15["📝 Audit Manager<br/>Automated Evidence"]

    style Q fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:3px
    style DDOS7 fill:#78281f,color:#fff,stroke:#c0392b,stroke-width:2px
    style A1 fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style A1B fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style A2 fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:2px
    style A2B fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:2px
    style A2C fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:2px
    style A3 fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style A4 fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style A5 fill:#0e6655,color:#fff,stroke:#16a085,stroke-width:2px
    style A6 fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style A7 fill:#1a5276,color:#fff,stroke:#2980b9,stroke-width:2px
    style A8 fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style A9 fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style A10 fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style A11 fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style A12 fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style A13 fill:#78281f,color:#fff,stroke:#c0392b,stroke-width:2px
    style A14 fill:#d4ac0d,color:#fff,stroke:#f1c40f,stroke-width:2px
    style A15 fill:#b7950b,color:#fff,stroke:#f39c12,stroke-width:2px
```

> [!NOTE]
> **Shield vs WAF cho DDoS:**
> - **Layer 3/4** (UDP flood, SYN flood) → **CHỈ Shield** xử lý được (WAF không hiểu traffic này)
> - **Layer 7** (HTTP flood) → **CẢ HAI** đều chặn được: Shield Advanced detect pattern bất thường, WAF dùng rate-based rules
> - Exam hỏi "chống DDoS?" → đáp án là **Shield**. Hỏi "rate limit HTTP?" → **WAF**

### Câu hỏi thường gặp trong exam

| Câu hỏi | Đáp án |
|----------|--------|
| "Encrypt S3 objects?" | **KMS (SSE-KMS)** hoặc SSE-S3 |
| "FIPS 140-2 Level 3?" | **CloudHSM** (không phải KMS!) |
| "Auto-rotate DB password?" | **Secrets Manager** |
| "Free SSL certificate?" | **ACM** |
| "CloudFront SSL cert ở region nào?" | **us-east-1** (bắt buộc) |
| "Chống DDoS?" | **Shield** (Standard = free) |
| "Block specific IPs?" | **WAF** (IP Set rules) |
| "Ai đang crypto mining trên EC2?" | **GuardDuty** |
| "EC2 có CVE vulnerabilities?" | **Inspector** |
| "PII data trong S3 buckets?" | **Macie** |
| "User login cho mobile app?" | **Cognito User Pool** |
| "Mobile access S3 directly?" | **Cognito Identity Pool** |
| "Tổng hợp security findings?" | **Security Hub** |
| "Quản lý WAF multi-account?" | **Firewall Manager** |
| "Download AWS compliance reports?" | **Artifact** (AWS's certs) |
| "Thu thập evidence cho audit?" | **Audit Manager** (YOUR compliance) |

---

## Security Layers tổng thể

### Defense in Depth - Bảo mật nhiều lớp

```mermaid
graph TB
    subgraph L1["🏢 Layer 1: Account & Organization"]
        ORG["AWS Organizations + SCPs"]
        IAM_L["IAM Policies + MFA"]
    end

    subgraph L2["🌐 Layer 2: Network"]
        VPC_L["VPC + Subnets"]
        NACL["NACLs"]
        SG_L["Security Groups"]
    end

    subgraph L3["🛡️ Layer 3: Edge & Perimeter"]
        CF_L["CloudFront"]
        SHIELD_P["Shield + WAF"]
    end

    subgraph L4["🔐 Layer 4: Data"]
        KMS_L["KMS Encryption"]
        ACM_L["TLS/SSL (ACM)"]
    end

    subgraph L5["🔍 Layer 5: Detection"]
        GD_DL["GuardDuty"]
        INS_DL["Inspector"]
        MAC_DL["Macie"]
        CT_DL["CloudTrail"]
    end

    L3 --> L2 --> L1
    L4 -.->|"protects data"| L1
    L5 -.->|"monitors"| L1

    style L1 fill:#1b2631,color:#ecf0f1,stroke:#5dade2,stroke-width:2px
    style L2 fill:#1a2740,color:#ecf0f1,stroke:#3498db,stroke-width:2px
    style L3 fill:#3b1520,color:#ecf0f1,stroke:#e74c3c,stroke-width:2px
    style L4 fill:#1a332a,color:#ecf0f1,stroke:#2ecc71,stroke-width:2px
    style L5 fill:#2c1810,color:#ecf0f1,stroke:#e67e22,stroke-width:2px
    style ORG fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style IAM_L fill:#6c3483,color:#fff,stroke:#8e44ad,stroke-width:2px
    style VPC_L fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style NACL fill:#1a5276,color:#fff,stroke:#2980b9,stroke-width:2px
    style SG_L fill:#2471a3,color:#fff,stroke:#3498db,stroke-width:2px
    style CF_L fill:#c0392b,color:#fff,stroke:#e74c3c,stroke-width:2px
    style SHIELD_P fill:#943126,color:#fff,stroke:#e74c3c,stroke-width:2px
    style KMS_L fill:#1e8449,color:#fff,stroke:#27ae60,stroke-width:2px
    style ACM_L fill:#117a65,color:#fff,stroke:#1abc9c,stroke-width:2px
    style GD_DL fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
    style INS_DL fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style MAC_DL fill:#b7950b,color:#fff,stroke:#f1c40f,stroke-width:2px
    style CT_DL fill:#d35400,color:#fff,stroke:#e67e22,stroke-width:2px
```

---

## Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SECURITY & ENCRYPTION BEST PRACTICES                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣  ENCRYPTION                                                             │
│  ├── ✅ Encrypt EVERYTHING at rest (S3, EBS, RDS, DynamoDB)                 │
│  ├── ✅ Enforce TLS in transit                                              │
│  ├── ✅ Dùng SSE-KMS (customer managed key) cho audit trail                 │
│  ├── ✅ Enable key rotation                                                 │
│  └── ❌ KHÔNG dùng SSE-C trừ khi có lý do đặc biệt                          │
│                                                                             │
│  2️⃣  SECRETS MANAGEMENT                                                     │
│  ├── ✅ KHÔNG hard-code credentials trong source code                       │
│  ├── ✅ Dùng Secrets Manager cho DB passwords (auto-rotate)                 │
│  ├── ✅ Dùng Parameter Store cho config values                              │
│  └── ✅ Rotate secrets định kỳ (30-90 ngày)                                 │
│                                                                             │
│  3️⃣  THREAT DETECTION                                                       │
│  ├── ✅ Enable GuardDuty cho tất cả accounts/regions                        │
│  ├── ✅ Enable Inspector cho EC2 + ECR                                      │
│  ├── ✅ Enable Macie cho sensitive S3 buckets                               │
│  └── ✅ Aggregate vào Security Hub                                          │
│                                                                             │
│  4️⃣  PERIMETER                                                              │
│  ├── ✅ Shield Standard luôn bật (free)                                     │
│  ├── ✅ WAF cho tất cả public ALB/CloudFront                                │
│  ├── ✅ Dùng Managed Rules trước, custom rules sau                          │
│  └── ✅ Firewall Manager cho multi-account                                  │
│                                                                             │
│  5️⃣  CERTIFICATES                                                           │
│  ├── ✅ Dùng ACM (FREE) thay vì mua third-party                             │
│  ├── ✅ DNS validation (tự động renew)                                      │
│  ├── ✅ CloudFront cert PHẢI ở us-east-1                                    │
│  └── ✅ Request cả root + wildcard (example.com + *.example.com)            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips

> [!TIP]
> **Ghi nhớ nhanh:**
> - **KMS** = encrypt data, quản lý keys (dùng cho hầu hết services)
> - **CloudHSM** = FIPS Level 3, dedicated hardware (banking/government)
> - **ACM** = SSL/TLS certificates (FREE)
> - **Secrets Manager** = passwords + auto-rotation
> - **Parameter Store** = config values (FREE tier)
> - **Shield** = DDoS protection (Standard = FREE)
> - **WAF** = web attacks (SQL injection, XSS, bots)
> - **GuardDuty** = threat detection (ML-based)
> - **Inspector** = vulnerability scanning (CVE)
> - **Macie** = PII discovery trong S3
> - **Cognito** = user authentication (User Pool + Identity Pool)
> - **Artifact** = download AWS's compliance reports (SOC, PCI, ISO)
> - **Audit Manager** = thu thập evidence tự động cho YOUR audit

> [!CAUTION]
> **Dễ nhầm lẫn:**
> - KMS vs CloudHSM? → KMS = Level 2, CloudHSM = Level 3
> - Secrets Manager vs Parameter Store? → SM = auto-rotate / PS = free
> - Shield Standard vs Advanced? → Standard = free, auto / Advanced = $3K, DRT
> - GuardDuty vs Inspector? → GD = threats / Inspector = vulnerabilities
> - Macie vs GuardDuty? → Macie = S3 sensitive data / GD = account threats
> - User Pool vs Identity Pool? → UP = authentication / IP = AWS credentials
> - ACM region cho CloudFront? → **us-east-1 ONLY!**
> - SSE-S3 vs SSE-KMS? → KMS có audit trail + key control
> - Artifact vs Audit Manager? → Artifact = AWS's reports / Audit Manager = YOUR evidence

---

## Liên kết tài liệu

- [KMS chi tiết](./aws-kms.md)
- [CloudHSM chi tiết](./aws-cloudhsm.md)
- [Secrets Manager chi tiết](./aws-secrets-manager.md)
- [ACM chi tiết](./aws-acm.md)
- [WAF chi tiết](./aws-waf.md)
- [Shield chi tiết](./aws-shield.md)
- [GuardDuty chi tiết](./amazon-guardduty.md)
- [Inspector chi tiết](./amazon-inspector.md)
- [Macie chi tiết](./amazon-macie.md)
- [Cognito chi tiết](./amazon-cognito.md)
- [Artifact chi tiết](./aws-artifact.md)
- [Audit Manager chi tiết](./aws-audit-manager.md)
- [IAM Overview](./aws-iam-management-overview.md)
- [Security Groups](./security-groups.md)
