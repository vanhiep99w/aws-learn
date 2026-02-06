# AWS DataSync

## Mục lục

- [Tổng quan](#tổng-quan)
- [Cách hoạt động](#cách-hoạt-động)
- [Source và Destination](#source-và-destination)
- [DataSync Agent](#datasync-agent)
- [Task và Transfer Options](#task-và-transfer-options)
- [Use Cases](#use-cases)
- [So sánh với các giải pháp khác](#so-sánh-với-các-giải-pháp-khác)
- [Pricing](#pricing)
- [Liên kết](#liên-kết)

---

## Tổng quan

**AWS DataSync** là dịch vụ **data transfer** giúp di chuyển **large amounts of data** giữa on-premises và AWS, hoặc giữa các AWS storage services.

```
┌─────────────────────────────────────────────────────────────────┐
│              AWS DATASYNC                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  On-premises                     AWS                             │
│  ┌─────────────┐                ┌─────────────┐                 │
│  │  NFS/SMB    │                │     S3      │                 │
│  │  Storage    │ ──────────────►│     EFS     │                 │
│  └──────┬──────┘    DataSync    │     FSx     │                 │
│         │                       └─────────────┘                 │
│    ┌────┴────┐                                                   │
│    │ DataSync│  ← Agent chạy trên VM                            │
│    │  Agent  │                                                   │
│    └─────────┘                                                   │
│                                                                  │
│  ⚡ Up to 10 Gbps transfer speed                                │
│  🔄 Automatic retry, verification                               │
│  📊 Bandwidth throttling                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key benefits:**
- ⚡ **Nhanh** - Up to 10x faster than open-source tools
- 🔐 **Secure** - TLS encryption in-transit
- ✅ **Reliable** - Automatic integrity verification
- 📊 **Controlled** - Bandwidth limiting, scheduling

---

## Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│              DATASYNC WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Deploy Agent (nếu on-premises)                              │
│     ┌─────────────┐                                              │
│     │  VMware/    │                                              │
│     │  Hyper-V/   │  ← Download OVA/VHD từ AWS                  │
│     │  KVM/EC2    │                                              │
│     └──────┬──────┘                                              │
│            │                                                     │
│  2. Create Locations (Source + Destination)                     │
│            │                                                     │
│            ▼                                                     │
│     ┌─────────────┐         ┌─────────────┐                     │
│     │   Source    │ ──────► │ Destination │                     │
│     │  Location   │         │  Location   │                     │
│     └─────────────┘         └─────────────┘                     │
│            │                                                     │
│  3. Create Task (defines what/how to transfer)                  │
│            │                                                     │
│            ▼                                                     │
│     ┌─────────────┐                                              │
│     │    Task     │ ← Schedule, filters, options                │
│     └──────┬──────┘                                              │
│            │                                                     │
│  4. Run Task (manual or scheduled)                              │
│            │                                                     │
│            ▼                                                     │
│     ┌─────────────┐                                              │
│     │  Transfer   │ ← Monitor progress in Console               │
│     │  Execution  │                                              │
│     └─────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Source và Destination

### Supported Locations

| Location Type | As Source | As Destination |
|--------------|-----------|----------------|
| **NFS** (on-prem) | ✅ | ✅ |
| **SMB** (on-prem) | ✅ | ✅ |
| **HDFS** (on-prem) | ✅ | ❌ |
| **S3** | ✅ | ✅ |
| **EFS** | ✅ | ✅ |
| **FSx for Windows** | ✅ | ✅ |
| **FSx for Lustre** | ✅ | ✅ |
| **FSx for OpenZFS** | ✅ | ✅ |
| **FSx for NetApp ONTAP** | ✅ | ✅ |
| **Other cloud** (Google, Azure) | ✅ | ❌ |

### Transfer Scenarios

```
┌─────────────────────────────────────────────────────────────────┐
│              COMMON TRANSFER PATTERNS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. On-prem NFS/SMB ──► S3/EFS/FSx (Migration)                  │
│                                                                  │
│  2. S3 ──► EFS (Transform object to file)                       │
│                                                                  │
│  3. EFS ──► EFS (Cross-region replication)                      │
│                                                                  │
│  4. FSx ──► S3 (Backup/Archive)                                 │
│                                                                  │
│  5. Google Cloud Storage ──► S3 (Cloud migration)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## DataSync Agent

### Khi nào cần Agent?

| Scenario | Agent cần? |
|----------|-----------|
| On-premises NFS/SMB → AWS | ✅ Required |
| HDFS → AWS | ✅ Required |
| AWS → AWS (S3, EFS, FSx) | ❌ No agent |
| Other cloud → AWS | ❌ No agent (API-based) |

### Agent Deployment

```
On-premises:
┌─────────────────────────────────────────────────────────────────┐
│  Download Agent VM image from AWS Console:                       │
│  • VMware ESXi (.ova)                                           │
│  • Microsoft Hyper-V (.vhd)                                      │
│  • KVM (.qcow2)                                                  │
│                                                                  │
│  Requirements:                                                   │
│  • 4 vCPUs, 32 GB RAM                                           │
│  • 80 GB disk                                                   │
│  • Network access to AWS (port 443)                             │
│  • Network access to source storage (NFS/SMB)                   │
└─────────────────────────────────────────────────────────────────┘

AWS (for self-managed storage on EC2):
┌─────────────────────────────────────────────────────────────────┐
│  Launch EC2 instance with DataSync Agent AMI                     │
│  • Use for EC2 instances running NFS/SMB servers                │
└─────────────────────────────────────────────────────────────────┘
```

### Agent ↔ AWS Communication

```
Agent ──────► AWS DataSync Service (port 443, TLS)
   │
   ├── Control channel (task instructions)
   └── Data channel (encrypted data transfer)
       
⚠️ Agent KHÔNG store data, chỉ transfer
```

---

## Task và Transfer Options

### Task Configuration

```yaml
Task:
  Name: "daily-backup-to-s3"
  SourceLocation: "nfs://10.0.1.100/data"
  DestinationLocation: "s3://my-backup-bucket/data"
  
  Options:
    # What to transfer
    TransferMode: CHANGED  # or ALL
    VerifyMode: POINT_IN_TIME_CONSISTENT
    
    # How to handle existing files
    OverwriteMode: ALWAYS  # or NEVER
    PreserveDeletedFiles: PRESERVE  # or REMOVE
    
    # Metadata preservation
    PreservePosixPermissions: OWNER_AND_GROUP
    PreserveTimeStamps: PRESERVE
    
    # Performance
    BytesPerSecond: 100000000  # 100 MB/s limit
    
  Schedule:
    ScheduleExpression: "cron(0 0 * * ? *)"  # Daily at midnight
    
  Filters:
    - FilterType: SIMPLE_PATTERN
      Value: "*.log"  # Exclude log files
```

### Transfer Modes

| Mode | Behavior |
|------|----------|
| **CHANGED** | Only transfer new/modified files |
| **ALL** | Transfer everything (slower, full sync) |

### Verify Modes

| Mode | Behavior |
|------|----------|
| **POINT_IN_TIME_CONSISTENT** | Verify after transfer |
| **ONLY_FILES_TRANSFERRED** | Verify only transferred files |
| **NONE** | No verification (fastest, least safe) |

---

## Use Cases

### 1. Data Migration

```
On-premises Data Center → AWS

┌─────────────┐     ┌──────────┐     ┌─────────────┐
│ NFS/SMB     │ ──► │ DataSync │ ──► │   S3/EFS    │
│ (100 TB)    │     │  Agent   │     │             │
└─────────────┘     └──────────┘     └─────────────┘
                          │
                     10 Gbps line
                     ~2-3 days
```

### 2. Ongoing Replication

```
Hybrid Cloud - Keep data in sync

On-prem ←──────────────────────────────►  AWS
  │           Scheduled sync              │
  │           (every hour)                │
  ▼                                       ▼
NFS Share                              EFS/FSx
```

### 3. Cold Data Archiving

```
Move old data to S3 Glacier

Production ──► DataSync ──► S3 ──► Lifecycle ──► Glacier
Storage                            Policy
```

---

## So sánh với các giải pháp khác

| Feature | DataSync | Transfer Family | S3 Transfer Accel | Snow Family |
|---------|----------|-----------------|-------------------|-------------|
| **Purpose** | Bulk data sync | Partner file exchange | Speed up S3 | Physical transfer |
| **Protocol** | Native (NFS/SMB) | SFTP/FTPS/FTP | S3 API | Physical device |
| **Speed** | Up to 10 Gbps | Network limited | Edge optimized | 100 TB/device |
| **Direction** | Bidirectional | Both | S3 only | Both |
| **Agent** | Required (on-prem) | No | No | No |
| **Best for** | Large migrations | B2B exchange | Global uploads | Massive/offline |

### DataSync vs DIY (rsync, robocopy)

| Aspect | DataSync | DIY |
|--------|----------|-----|
| **Speed** | Optimized, parallel | Single-threaded |
| **Reliability** | Auto-retry, verification | Manual handling |
| **Management** | Console/API | Scripts, cron |
| **Cost** | Per-GB pricing | Free (but time cost) |
| **Monitoring** | CloudWatch integrated | Custom logging |

---

## Pricing

| Component | Cost |
|-----------|------|
| **Data copied** | $0.0125 - $0.025/GB |
| **Agent** | Free (software) |
| **EC2 for agent** | Standard EC2 pricing |

**Ví dụ:**
- 10 TB migration = ~$125 - $250
- Monthly sync 100 GB = ~$1.25 - $2.50

> 💡 **Lưu ý:** Pricing varies by region và destination type

---

## Exam Tips

> ✅ **Khi đề bài nói:**
> - "Migrate on-premises NFS/SMB to AWS"
> - "Sync data between AWS storage services"
> - "Transfer large amounts of data"
> - "Schedule recurring data transfers"
> - "Need data integrity verification"
> 
> → Nghĩ đến **AWS DataSync**

> ⚠️ **Phân biệt:**
> - **DataSync**: Bulk migration/sync, needs agent for on-prem
> - **Transfer Family**: Partner SFTP/FTP access
> - **Storage Gateway**: Ongoing hybrid access (cache locally)
> - **Snow Family**: Petabyte-scale, offline transfer

---

## Liên kết

- [S3](s3.md) - Common destination
- [EFS](efs.md) - File storage destination
- [FSx](fsx.md) - Managed file systems
- [AWS Transfer Family](aws-transfer-family.md) - SFTP/FTP service
- [Snow Family](snow-family.md) - Physical data transfer
- [AWS Storage Gateway](aws-storage-gateway.md) - Hybrid storage
- [Direct Connect](direct-connect.md) - Dedicated network (faster DataSync)
