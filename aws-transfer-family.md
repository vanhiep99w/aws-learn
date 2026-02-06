# AWS Transfer Family

## Mục lục

- [Tổng quan](#tổng-quan)
- [Protocols hỗ trợ](#protocols-hỗ-trợ)
- [Storage backends](#storage-backends)
- [Authentication](#authentication)
- [Kiến trúc](#kiến-trúc)
- [Use Cases](#use-cases)
- [Pricing](#pricing)
- [So sánh với các giải pháp khác](#so-sánh-với-các-giải-pháp-khác)
- [Liên kết](#liên-kết)

---

## Tổng quan

**AWS Transfer Family** là dịch vụ **fully managed** cho phép transfer files **vào/ra AWS storage** (S3, EFS) sử dụng các protocols truyền thống:

```
┌─────────────────────────────────────────────────────────────────┐
│              AWS TRANSFER FAMILY                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Legacy Systems / Partners / Clients                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │  SFTP   │ │  FTPS   │ │   FTP   │ │   AS2   │               │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘               │
│       │           │           │           │                      │
│       └───────────┴─────┬─────┴───────────┘                      │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │   Transfer Family   │  ← Fully managed            │
│              │      Server         │    No infrastructure        │
│              └──────────┬──────────┘                             │
│                         │                                        │
│           ┌─────────────┴─────────────┐                          │
│           ▼                           ▼                          │
│    ┌─────────────┐            ┌─────────────┐                    │
│    │     S3      │            │     EFS     │                    │
│    └─────────────┘            └─────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key benefits:**
- ❌ Không cần quản lý SFTP/FTP servers
- ✅ Tích hợp native với S3/EFS
- ✅ Giữ nguyên workflows hiện tại (partners vẫn dùng SFTP như cũ)
- ✅ High availability, scalability tự động

---

## Protocols hỗ trợ

| Protocol | Port | Mô tả | Use case |
|----------|------|-------|----------|
| **SFTP** | 22 | SSH File Transfer Protocol | Phổ biến nhất, secure |
| **FTPS** | 21 | FTP over SSL/TLS | Legacy systems cần encryption |
| **FTP** | 21 | Plain FTP (unencrypted) | Legacy, không khuyến khích |
| **AS2** | 443 | Applicability Statement 2 | EDI, B2B transactions |

### SFTP vs FTPS vs FTP

```
┌─────────────────────────────────────────────────────────────────┐
│              PROTOCOL COMPARISON                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SFTP (SSH File Transfer Protocol):                              │
│  • Chạy trên SSH (port 22)                                      │
│  • Mọi thứ encrypted                                            │
│  • ✅ Recommended cho new implementations                        │
│                                                                  │
│  FTPS (FTP Secure):                                              │
│  • FTP + TLS/SSL encryption                                      │
│  • 2 modes: Explicit (port 21) / Implicit (port 990)            │
│  • Dùng khi partner chỉ support FTPS                            │
│                                                                  │
│  FTP (Plain):                                                    │
│  • ⚠️ KHÔNG encrypted - chỉ dùng nội bộ                         │
│  • Legacy compatibility only                                     │
│                                                                  │
│  AS2:                                                            │
│  • HTTP-based, EDI transactions                                  │
│  • Digital signatures, encryption, receipts                      │
│  • B2B commerce (retail, healthcare)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Storage backends

### Amazon S3

```
Transfer Family Server ──► S3 Bucket
                              │
                              ├── /user1/uploads/
                              ├── /user2/uploads/
                              └── /shared/
```

**Features với S3:**
- Map users đến specific prefixes (folders)
- Dùng S3 features: versioning, lifecycle, encryption
- Cross-region replication vẫn hoạt động

### Amazon EFS

```
Transfer Family Server ──► EFS File System
                              │
                              ├── /home/user1/
                              ├── /home/user2/
                              └── /shared/
```

**Features với EFS:**
- POSIX permissions
- Shared access với EC2, Lambda, etc.
- NFS mount từ on-premises

---

## Authentication

### 3 phương thức authentication

```
┌─────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION OPTIONS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Service-managed (AWS managed):                               │
│     • SSH keys stored in AWS                                    │
│     • Đơn giản nhất                                             │
│     • Quản lý qua Console/API                                   │
│                                                                  │
│  2. AWS Directory Service:                                       │
│     • Microsoft AD / AD Connector                               │
│     • Username/password từ AD                                   │
│     • Tích hợp với existing AD                                  │
│                                                                  │
│  3. Custom Identity Provider (Lambda):                          │
│     • Lambda function xử lý authentication                      │
│     • Tích hợp với bất kỳ IdP nào                               │
│     • Flexible nhất                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Custom Identity Provider example

```
User login ──► Transfer Family ──► API Gateway ──► Lambda
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │ Your database │
                                              │ LDAP, Okta,   │
                                              │ Cognito, etc. │
                                              └───────────────┘
```

```python
# Lambda function example
def lambda_handler(event, context):
    username = event['username']
    password = event['password']
    
    # Validate against your IdP
    if validate_user(username, password):
        return {
            'Role': 'arn:aws:iam::123456789:role/transfer-user-role',
            'HomeDirectory': f'/my-bucket/{username}',
            'Policy': '...'  # Optional scoped-down policy
        }
    else:
        return {}  # Empty = authentication failed
```

---

## Kiến trúc

### Endpoint types

| Type | Accessibility | IP Address | Use case |
|------|--------------|------------|----------|
| **Public** | Internet | AWS-owned | Partners truy cập qua internet |
| **VPC** | VPC only | Private IP | Internal, on-premises via VPN/DX |
| **VPC with Internet** | Both | Elastic IP | Fixed IP cho firewall whitelist |

### VPC Endpoint Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPC                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │  Private Subnet │         │  Private Subnet │                │
│  │     (AZ-a)      │         │     (AZ-b)      │                │
│  │  ┌───────────┐  │         │  ┌───────────┐  │                │
│  │  │  ENI      │  │         │  │  ENI      │  │                │
│  │  │ 10.0.1.5  │  │         │  │ 10.0.2.5  │  │                │
│  │  └─────┬─────┘  │         │  └─────┬─────┘  │                │
│  └────────┼────────┘         └────────┼────────┘                │
│           │                           │                          │
│           └───────────┬───────────────┘                          │
│                       ▼                                          │
│              ┌─────────────────┐                                 │
│              │ Transfer Family │                                 │
│              │     Server      │                                 │
│              └────────┬────────┘                                 │
│                       │                                          │
│                       ▼                                          │
│              ┌─────────────────┐                                 │
│              │       S3        │                                 │
│              └─────────────────┘                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
        │
        │ VPN / Direct Connect
        ▼
┌─────────────────┐
│   On-premises   │
└─────────────────┘
```

---

## Use Cases

| Use Case | Protocol | Storage |
|----------|----------|---------|
| **Partner data exchange** | SFTP | S3 |
| **EDI/B2B transactions** | AS2 | S3 |
| **Migrate FTP servers** | FTPS/SFTP | S3/EFS |
| **Data lake ingestion** | SFTP | S3 |
| **Shared file storage** | SFTP | EFS |

### Ví dụ: Partner uploads

```
Partner A (SFTP) ──┐
                   │     ┌──────────────┐     ┌─────────────┐
Partner B (SFTP) ──┼────►│ Transfer     │────►│  S3 Bucket  │
                   │     │ Family Server│     │             │
Partner C (AS2)  ──┘     └──────────────┘     └──────┬──────┘
                                                      │
                                                      ▼
                                              ┌─────────────┐
                                              │ Lambda/Glue │
                                              │ Processing  │
                                              └─────────────┘
```

---

## Pricing

| Component | Cost |
|-----------|------|
| **Endpoint** | ~$0.30/hour (~$216/month) per protocol |
| **Data transfer** | $0.04/GB (upload), $0.04/GB (download) |
| **AS2 messages** | $0.005 per message traded |

**Ví dụ:**
- 1 SFTP server chạy 24/7 = ~$216/month
- Upload 100GB/month = $4
- **Total: ~$220/month**

> ⚠️ **Lưu ý:** Cost chính là endpoint hourly fee, data transfer thường nhỏ hơn

---

## So sánh với các giải pháp khác

| Feature | Transfer Family | Self-managed SFTP | Third-party |
|---------|-----------------|-------------------|-------------|
| **Management** | Fully managed | You manage EC2 | Varies |
| **Scalability** | Automatic | Manual | Varies |
| **HA** | Built-in (Multi-AZ) | You configure | Varies |
| **S3 integration** | Native | Custom | Custom |
| **Cost** | Pay per hour | EC2 + storage | Varies |

### Khi nào dùng Transfer Family?

✅ **Nên dùng:**
- Có partners/clients cần SFTP/FTP
- Muốn migrate off self-managed FTP servers
- Cần tích hợp với S3/EFS
- Không muốn quản lý infrastructure

❌ **Không nên dùng:**
- Chỉ internal transfers (dùng S3 CLI/SDK)
- Low volume, occasional transfers (cost cao)
- Cần nhiều custom features (dùng self-managed)

---

## Exam Tips

> ✅ **Khi đề bài nói:**
> - "SFTP to S3"
> - "Partners upload files"
> - "Migrate FTP server to AWS"
> - "B2B EDI transactions" (AS2)
> 
> → Nghĩ đến **AWS Transfer Family**

---

## Liên kết

- [S3](s3.md) - Storage backend chính
- [EFS](efs.md) - Alternative storage backend
- [VPC](vpc.md) - VPC endpoints
- [Lambda](lambda.md) - Custom identity provider
- [Direct Connect](direct-connect.md) - On-premises connectivity
