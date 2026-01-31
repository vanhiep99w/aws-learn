# AWS CloudHSM


## Mục lục

- [Tổng quan](#tổng-quan)
- [Đặc điểm chính](#đặc-điểm-chính)
- [Hiểu đơn giản: CloudHSM làm gì?](#hiểu-đơn-giản-cloudhsm-làm-gì)
- [AWS Key Management Services - Tổng quan](#aws-key-management-services-tổng-quan)
- [FIPS 140-2 Levels](#fips-140-2-levels)
- [CloudHSM vs AWS KMS](#cloudhsm-vs-aws-kms)
- [Architecture](#architecture)
- [Use Cases](#use-cases)
- [KMS Custom Key Store](#kms-custom-key-store)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Exam Tips cho Cloud Practitioner](#exam-tips-cho-cloud-practitioner)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**AWS CloudHSM** là dịch vụ cung cấp **Hardware Security Module (HSM)** dành riêng cho bạn, chạy trong VPC của bạn. HSM là thiết bị phần cứng chuyên dụng để tạo và lưu trữ **cryptographic keys** với độ bảo mật cao nhất.

```
┌─────────────────────────────────────────────────────────────────┐
│                       AWS CloudHSM                               │
│     "Dedicated Hardware Security Module in the Cloud"           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────┐           │
│   │              Your VPC                            │           │
│   │   ┌───────────────────────────────────────┐     │           │
│   │   │           CloudHSM Cluster            │     │           │
│   │   │  ┌─────────┐  ┌─────────┐  ┌─────────┐│     │           │
│   │   │  │  HSM 1  │  │  HSM 2  │  │  HSM 3  ││     │           │
│   │   │  │  (AZ-a) │  │  (AZ-b) │  │  (AZ-c) ││     │           │
│   │   │  └─────────┘  └─────────┘  └─────────┘│     │           │
│   │   └───────────────────────────────────────┘     │           │
│   └─────────────────────────────────────────────────┘           │
│                                                                  │
│   ✅ FIPS 140-2 Level 3 certified                               │
│   ✅ Single-tenant (dedicated hardware)                         │
│   ✅ You control keys, AWS has NO access                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **FIPS 140-2 Level 3** | Chứng nhận bảo mật cao nhất cho HSM |
| **Single-Tenant** | Hardware dành riêng, không share với ai |
| **Customer-Controlled** | AWS KHÔNG có access vào keys của bạn |
| **Runs in VPC** | HSM nằm trong VPC của bạn |
| **High Availability** | Deploy HSM ở multiple AZs |
| **Standard APIs** | PKCS#11, JCE, CNG |

---

## Hiểu đơn giản: CloudHSM làm gì?

**CloudHSM** = **Cái két sắt siêu bảo mật** để giữ **chìa khóa mã hóa** (encryption keys).

```
Ví dụ đời thường:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bạn có két sắt tại nhà (encrypted data)
  └── Chìa khóa két (encryption key) để ở đâu?

  ❌ Dưới thảm chùi chân → Dễ bị tìm thấy
  ❌ Trong ngăn kéo     → Vẫn không an toàn  
  ✅ Ngân hàng giữ hộ   → AN TOÀN NHẤT (= CloudHSM)
```

**CloudHSM làm gì cụ thể:**
- **LƯU TRỮ keys** trong hardware (nếu ai cố mở/phá → tự động XÓA keys)
- **TẠO keys** random, không đoán được
- **MÃ HÓA/GIẢI MÃ** - app gửi data → HSM encrypt → trả kết quả (key không bao giờ lộ)

---

## AWS Key Management Services - Tổng quan

AWS có nhiều services liên quan đến key/secret management:

| Service | Lưu gì | Dùng khi nào | Giá |
|---------|--------|--------------|-----|
| **AWS KMS** | Encryption keys | Encrypt S3, EBS, RDS... | ~$1/key/month |
| **CloudHSM** | Keys trong hardware | FIPS Level 3, full control | ~$1,050/month |
| **Secrets Manager** | Passwords, API keys | DB credentials, auto-rotate | $0.40/secret/month |
| **Parameter Store** | Config, secrets | App config | FREE |
| **ACM** | SSL certificates | HTTPS websites | FREE |

> [!TIP]
> **90% trường hợp**: Dùng **KMS** để encrypt, **Secrets Manager** để lưu passwords. CloudHSM chỉ khi compliance yêu cầu FIPS Level 3.

---

## FIPS 140-2 Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIPS 140-2 Levels                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Level 1: Basic security, no physical protection                │
│           └── Software encryption                               │
│                                                                  │
│  Level 2: Tamper-evident seals, role-based authentication       │
│           └── AWS KMS (overall service)                         │
│                                                                  │
│  Level 3: Tamper-resistant, physical protection, identity-based │
│           └── AWS CloudHSM ✅                                   │
│           └── Zeroize keys if tampering detected                │
│                                                                  │
│  Level 4: Highest, environmental protection                     │
│           └── Extreme conditions (voltage, temperature)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **FIPS 140-2 Level 3** = Thiết bị tự động xóa keys nếu phát hiện ai đó cố mở hoặc tamper với nó.

---

## CloudHSM vs AWS KMS

| Tiêu chí | AWS KMS | AWS CloudHSM |
|----------|---------|--------------|
| **Loại service** | Multi-tenant (shared) | **Single-tenant (dedicated)** |
| **FIPS Level** | Level 2 (overall) | **Level 3** |
| **Ai quản lý keys** | AWS + Customer | **Customer 100%** |
| **AWS có access keys?** | Có (encrypted) | **KHÔNG** |
| **Pricing** | ~$1/key/month | **~$1.45/hour/HSM** |
| **Integration** | 100+ AWS services | Custom (PKCS#11, JCE) |
| **Setup complexity** | Easy | Complex |
| **Use case** | General encryption | High compliance |

### Khi nào dùng gì?

```
┌─────────────────────────────────────────────────────────────────┐
│                  Chọn KMS hay CloudHSM?                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Chọn AWS KMS khi:                                               │
│  ├── Encrypt data trong AWS services (S3, EBS, RDS)             │
│  ├── Không cần FIPS Level 3                                     │
│  ├── Muốn đơn giản, managed                                     │
│  └── Budget hạn chế                                              │
│                                                                  │
│  Chọn CloudHSM khi:                                              │
│  ├── Compliance yêu cầu FIPS 140-2 Level 3                      │
│  ├── Cần full control, AWS không được access keys               │
│  ├── Dùng standard APIs (PKCS#11, JCE)                          │
│  ├── Legacy/custom applications                                  │
│  └── High-speed crypto operations                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### CloudHSM Cluster

```
                          ┌──────────────────────────────────────┐
                          │              Your VPC                 │
                          │                                       │
                          │         CloudHSM Cluster              │
                          │  ┌────────────────────────────────┐  │
                          │  │                                 │  │
    ┌──────────────┐      │  │  ┌─────────┐    ┌─────────┐   │  │
    │ Application  │──────┼──┼──│  HSM 1  │    │  HSM 2  │   │  │
    │  (EC2/Lambda)│      │  │  │  AZ-a   │◄──►│  AZ-b   │   │  │
    └──────────────┘      │  │  └─────────┘    └─────────┘   │  │
         │                │  │        ▲              ▲        │  │
         │                │  │        │   Auto-Sync  │        │  │
         │                │  │        └──────────────┘        │  │
         ▼                │  └────────────────────────────────┘  │
    ┌──────────────┐      │                                       │
    │ CloudHSM     │      │  ENI (Elastic Network Interface)     │
    │ Client       │      │  trong các private subnets            │
    └──────────────┘      └──────────────────────────────────────┘
```

### Components

| Component | Mô tả |
|-----------|-------|
| **HSM Instance** | Physical hardware module |
| **Cluster** | Nhóm các HSMs (auto-sync keys) |
| **CloudHSM Client** | Software cài trên EC2 để connect |
| **ENI** | Network interface trong VPC |

---

## Use Cases

### 1. SSL/TLS Offloading

```
┌─────────────────────────────────────────────────────────────────┐
│              SSL/TLS Offloading with CloudHSM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client ──► Web Server ──► CloudHSM                             │
│                  │              │                                │
│                  │              └── Private key stored here     │
│                  │                  (never leaves HSM)          │
│                  │                                               │
│                  └── SSL termination, key operations            │
│                      delegated to HSM                           │
│                                                                  │
│  Benefits:                                                       │
│  • Private key never exposed to web server                      │
│  • FIPS 140-2 Level 3 protection                                │
│  • Compliance requirements met                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Document Signing (Code Signing)

- Sign software, documents với keys trong HSM
- Key never leaves the HSM
- Compliance với regulations

### 3. Database Encryption (TDE)

- Oracle TDE với CloudHSM
- SQL Server TDE
- Keys protected at highest level

### 4. Custom Applications

- Applications cần PKCS#11 hoặc JCE
- Migrate từ on-premises HSM
- Financial/Government applications

---

## KMS Custom Key Store

AWS cho phép kết hợp **KMS + CloudHSM** để có cả hai lợi ích:

```
┌─────────────────────────────────────────────────────────────────┐
│              KMS Custom Key Store (Best of Both Worlds)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────────────────┐   │
│  │    AWS KMS      │ ──────► │      CloudHSM Cluster       │   │
│  │  (API + Mgmt)   │         │   (Key Storage - Level 3)   │   │
│  └─────────────────┘         └─────────────────────────────┘   │
│                                                                  │
│  Benefits:                                                       │
│  ✅ Easy KMS API (100+ AWS service integrations)                │
│  ✅ FIPS 140-2 Level 3 key storage (CloudHSM)                   │
│  ✅ AWS cannot access your keys                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pricing

| Component | Cost |
|-----------|------|
| **HSM Instance** | ~$1.45/hour (~$1,050/month) |
| **Minimum** | 1 HSM (recommend 2+ for HA) |
| **HA Setup** | 2 HSMs = ~$2,100/month |

> [!WARNING]
> CloudHSM đắt hơn nhiều so với KMS. Chỉ dùng khi compliance yêu cầu FIPS Level 3.

---

## Best Practices

### 1. High Availability

```
┌─────────────────────────────────────────────────────────────────┐
│                    HA Best Practices                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Deploy ít nhất 2 HSMs trong 2 AZs khác nhau                 │
│  ✅ Keys tự động sync giữa các HSMs trong cluster               │
│  ✅ Client tự động failover khi 1 HSM fail                      │
│                                                                  │
│  Production recommendation: 3 HSMs trong 3 AZs                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Security

- Không share HSM credentials
- Rotate Crypto Officer password định kỳ
- Enable CloudTrail logging
- Backup cluster regularly

### 3. Backup & Recovery

- CloudHSM tự động backup keys
- Có thể restore cluster từ backup
- **QUAN TRỌNG**: Nếu mất tất cả HSMs và không có backup = **MẤT KEYS VĨNH VIỄN**

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ CloudHSM:**
> - **FIPS 140-2 Level 3** (cao nhất)
> - **Single-tenant** (dedicated hardware)
> - **Customer controls keys** (AWS has NO access)
> - **Runs in your VPC**
> - Đắt hơn KMS (~$1.45/hour)

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Service nào cung cấp dedicated HSM? | **CloudHSM** |
| Service nào FIPS 140-2 Level 3? | **CloudHSM** |
| Service nào AWS KHÔNG access được keys? | **CloudHSM** |
| KMS hay CloudHSM cho general encryption? | **KMS** |
| CloudHSM chạy ở đâu? | **Trong VPC của bạn** |
| CloudHSM dùng APIs gì? | **PKCS#11, JCE, CNG** |

### Phân biệt KMS vs CloudHSM

```
┌─────────────────────────┬─────────────────────────────────────┐
│          KMS            │            CloudHSM                  │
├─────────────────────────┼─────────────────────────────────────┤
│ Multi-tenant (shared)   │ Single-tenant (dedicated)           │
│ FIPS Level 2            │ FIPS Level 3                        │
│ AWS + Customer control  │ Customer ONLY control               │
│ Easy, managed           │ Complex, you manage                 │
│ ~$1/key/month           │ ~$1.45/hour/HSM                     │
│ 100+ AWS integrations   │ Custom integration (PKCS#11)        │
└─────────────────────────┴─────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS CloudHSM Summary                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Dedicated Hardware Security Module                          │
│  ✅ FIPS 140-2 Level 3 (highest security)                       │
│  ✅ Single-tenant (hardware dành riêng)                         │
│  ✅ Customer controls keys (AWS has NO access)                  │
│  ✅ Runs in your VPC                                             │
│  ✅ Standard APIs: PKCS#11, JCE, CNG                            │
│                                                                  │
│  Use when:                                                       │
│  • Compliance requires FIPS Level 3                             │
│  • Need full key control                                         │
│  • Legacy apps need PKCS#11/JCE                                  │
│                                                                  │
│  Cost: ~$1.45/hour per HSM (~$1,050/month)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
