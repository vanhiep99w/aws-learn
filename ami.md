# Amazon Machine Image (AMI)


## Mục lục

- [AMI là gì?](#ami-là-gì)
- [AMI vs Volume vs Snapshot](#ami-vs-volume-vs-snapshot)
- [Flow tạo AMI và Launch Instance](#flow-tạo-ami-và-launch-instance)
- [AMI lưu gì từ Instance?](#ami-lưu-gì-từ-instance)
- [Đặc điểm của AMI](#đặc-điểm-của-ami)
- [Nguồn AMI](#nguồn-ami)
- [Launch Permissions](#launch-permissions)
- [Root Volume Type](#root-volume-type)
- [Virtualization Types](#virtualization-types)
- [AMI Lifecycle](#ami-lifecycle)
- [Tạo Custom AMI](#tạo-custom-ami)
- [Copy AMI giữa các Regions](#copy-ami-giữa-các-regions)
- [Share AMI](#share-ami)
- [AMI Billing](#ami-billing)
- [Tìm AMI](#tìm-ami)
- [Deregister AMI](#deregister-ami)
- [Liên kết với các dịch vụ khác](#liên-kết-với-các-dịch-vụ-khác)

---

## AMI là gì?

**Amazon Machine Image (AMI)** là một **template/metadata** dùng để launch EC2 instance. 

> ⚠️ **Quan trọng**: AMI **không chứa data thật** - nó chỉ chứa metadata và **trỏ đến các EBS Snapshots**.

### AMI bao gồm

- **Metadata**: OS type, architecture, virtualization type
- **Block device mapping**: Định nghĩa các snapshots sẽ dùng để tạo volumes khi launch
- **Launch permissions**: Xác định ai có quyền sử dụng AMI

> 📌 **Bắt buộc**: Phải chỉ định AMI khi launch instance. AMI phải tương thích với instance type đã chọn.

## AMI vs Volume vs Snapshot

```
┌─────────────────────────────────────────────────────────────────┐
│                         AMI                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  METADATA (không phải data thật)                          │  │
│  │  • OS type: Amazon Linux 2023                             │  │
│  │  • Architecture: x86_64                                   │  │
│  │  • Virtualization: HVM                                    │  │
│  │  • Block device mapping: root = snap-abc, data = snap-xyz │  │
│  │  • Launch permissions: account 123456789012               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│                     Trỏ đến Snapshots                           │
│           ┌─────────────────┴─────────────────┐                 │
│           ▼                                   ▼                 │
│   ┌──────────────┐                   ┌──────────────┐           │
│   │  Snapshot A  │                   │  Snapshot B  │           │
│   │  (Root: OS)  │                   │  (Data disk) │           │
│   │  Lưu trong S3│                   │  Lưu trong S3│           │
│   └──────────────┘                   └──────────────┘           │
│         │                                   │                   │
│         │      (DATA THẬT Ở ĐÂY)            │                   │
└─────────┴───────────────────────────────────┴───────────────────┘
```

| Thành phần | Là gì? | Lưu gì? |
|------------|--------|---------|
| **EBS Volume** | Ổ đĩa ảo (đang chạy) | Data thật, gắn vào EC2 instance |
| **Snapshot** | Bản backup của Volume | Data thật, lưu trong S3 (compressed) |
| **AMI** | **Template/Recipe** | Chỉ lưu **metadata** + **trỏ đến snapshots** |

## Flow tạo AMI và Launch Instance

### Khi tạo AMI từ Instance

```
EC2 Instance
├── EBS Volume 1 (root): /dev/xvda - 50GB, đang dùng 20GB
└── EBS Volume 2 (data): /dev/xvdb - 200GB, đang dùng 100GB

         │
         ▼ aws ec2 create-image
         
Bước 1: AWS tự động tạo SNAPSHOTS cho mỗi volume
├── snap-111 ← copy từ Volume 1 → ~15-20GB (compressed)
└── snap-222 ← copy từ Volume 2 → ~70-90GB (compressed)
        │
        └── Lưu vào S3 (incremental, compressed)

Bước 2: Tạo AMI (chỉ là metadata)
AMI = {
    "ImageId": "ami-xxx",
    "Architecture": "x86_64",
    "BlockDeviceMappings": [
        "/dev/xvda" → snap-111 (size: 50GB),
        "/dev/xvdb" → snap-222 (size: 200GB)
    ]
}
```

### Snapshot Size vs Volume Size

| Volume | Dung lượng | Data thực | Snapshot size |
|--------|------------|-----------|---------------|
| Root | 50GB | 20GB | ~15-20GB (compressed) |
| Data | 200GB | 100GB | ~70-90GB (compressed) |

> 📌 **Snapshot chỉ lưu blocks có data**, bỏ qua blocks trống + có compression.

### Khi Launch Instance từ AMI

```
AMI (snap-111, snap-222)
        │
        ├──► Launch Instance 1
        │    ├── vol-aaa (MỚI, 50GB từ snap-111)
        │    └── vol-bbb (MỚI, 200GB từ snap-222)
        │
        ├──► Launch Instance 2
        │    ├── vol-ccc (MỚI, 50GB từ snap-111)
        │    └── vol-ddd (MỚI, 200GB từ snap-222)
        │
        └──► Launch Instance 3
             ├── vol-eee (MỚI, 50GB từ snap-111)
             └── vol-fff (MỚI, 200GB từ snap-222)
```

> 📌 **Mỗi instance = Volumes MỚI riêng biệt**, độc lập với nhau.

### Terminate Instance gốc thì sao?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NGÀY 1: Tạo EC2 Instance                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   EC2 Instance (i-111)                                                      │
│   ├── vol-aaa (root, 50GB)  ← DeleteOnTermination = true (mặc định)         │
│   └── vol-bbb (data, 200GB) ← DeleteOnTermination = false                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ NGÀY 2: Tạo AMI                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   aws ec2 create-image --instance-id i-111 --name "MyAMI"                   │
│                                    │                                        │
│                                    ▼                                        │
│   AWS tự động tạo Snapshots:                                                │
│   ├── snap-111 ← copy từ vol-aaa (root) ──► Lưu vào S3                      │
│   └── snap-222 ← copy từ vol-bbb (data) ──► Lưu vào S3                      │
│                                    │                                        │
│                                    ▼                                        │
│   AMI (ami-xxx) = {                                                         │
│       "BlockDeviceMappings": [                                              │
│           "/dev/xvda" → snap-111,                                           │
│           "/dev/xvdb" → snap-222                                            │
│       ]                                                                     │
│   }                                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ NGÀY 3: Terminate Instance                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   aws ec2 terminate-instances --instance-ids i-111                          │
│                                                                             │
│   ├── i-111:    TERMINATED ❌                                               │
│   ├── vol-aaa:  BỊ XÓA ❌ (DeleteOnTermination=true)                        │
│   ├── vol-bbb:  VẪN CÒN ✅ (DeleteOnTermination=false) ← orphan volume      │
│   ├── snap-111: VẪN CÒN ✅ (độc lập trong S3)                               │
│   ├── snap-222: VẪN CÒN ✅ (độc lập trong S3)                               │
│   └── ami-xxx:  VẪN CÒN ✅ (trỏ đến snap-111, snap-222)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ NGÀY 4: Launch Instance mới từ AMI                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   aws ec2 run-instances --image-id ami-xxx                                  │
│                                    │                                        │
│                                    ▼                                        │
│   AWS đọc AMI → tạo volumes MỚI từ snapshots:                               │
│   ├── snap-111 ──► vol-ccc (MỚI, 50GB root)                                 │
│   └── snap-222 ──► vol-ddd (MỚI, 200GB data)                                │
│                                    │                                        │
│                                    ▼                                        │
│   EC2 Instance MỚI (i-222)                                                  │
│   ├── vol-ccc (root) ← hoàn toàn độc lập với vol-aaa (đã xóa)               │
│   └── vol-ddd (data) ← hoàn toàn độc lập với vol-bbb                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> 📌 **Snapshot là bản copy độc lập trong S3**, không phụ thuộc vào volume gốc.

### Snapshot lưu trong S3 nhưng bạn không thấy được

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│  S3 (AWS managed, internal)    │  ≠  │  S3 Bucket của bạn              │
├─────────────────────────────────┤     ├─────────────────────────────────┤
│                                 │     │                                 │
│  Snapshots lưu ở đây            │     │  Bạn KHÔNG thấy snapshots       │
│  (bạn KHÔNG access được)        │     │  ở đây                          │
│                                 │     │                                 │
└─────────────────────────────────┘     └─────────────────────────────────┘
              │
              ▼
   Chỉ xóa được qua EC2 Console/CLI
   KHÔNG xóa được qua S3
```

### Xóa Snapshot thì sao?

| Trường hợp | Kết quả |
|------------|---------|
| Xóa snapshot trong khi AMI vẫn trỏ đến | ❌ AMI bị **hỏng**, launch sẽ **fail** |
| Deregister AMI trước, rồi xóa snapshot | ✅ OK |

```bash
# Quy trình xóa đúng cách
# Bước 1: Deregister AMI trước
aws ec2 deregister-image --image-id ami-xxx

# Bước 2: Rồi mới xóa snapshots
aws ec2 delete-snapshot --snapshot-id snap-111
aws ec2 delete-snapshot --snapshot-id snap-222
```

> ⚠️ AWS **không tự động xóa snapshots** khi deregister AMI → phải xóa thủ công để tránh phí storage.

## AMI lưu gì từ Instance?

### ✅ Những gì ĐƯỢC lưu (trên EBS volumes)

| Thành phần | Ví dụ |
|------------|-------|
| Hệ điều hành | Amazon Linux, Ubuntu, Windows |
| Phần mềm đã cài | nginx, Docker, Java, Python... |
| Cấu hình hệ thống | /etc/nginx/nginx.conf, systemd services |
| Files trên disk | Code, scripts, database files |
| User accounts | Users tạo trong OS |

### ❌ Những gì KHÔNG được lưu

| Thành phần | Lý do |
|------------|-------|
| Instance type | Chọn lại khi launch |
| Security Groups | Chọn lại khi launch |
| IAM Role | Chọn lại khi launch |
| Key pair | Chọn lại khi launch |
| Network settings | IP, subnet - chọn lại khi launch |
| RAM state | Chỉ lưu disk, không lưu memory |
| Instance Store data | Ephemeral - mất khi tạo AMI |

## Đặc điểm của AMI

AMI được phân loại theo các đặc điểm sau:

| Đặc điểm | Mô tả |
|----------|-------|
| **Region** | AMI chỉ hoạt động trong Region cụ thể (có thể copy sang Region khác) |
| **Operating System** | Linux, Windows, macOS |
| **Processor Architecture** | 32-bit, 64-bit (x86), 64-bit (Arm) |
| **Root Volume Type** | EBS-backed hoặc Instance Store-backed |
| **Virtualization Type** | HVM hoặc PV (Paravirtual) |

## Nguồn AMI

Bạn có thể sử dụng AMI từ nhiều nguồn:

1. **AWS-provided AMIs**: AMIs do AWS cung cấp (Amazon Linux, Ubuntu, Windows Server...)
2. **AWS Marketplace**: AMIs từ các vendor bên thứ ba (có thể mất phí)
3. **Community AMIs**: AMIs công khai từ cộng đồng
4. **Shared AMIs**: AMIs được chia sẻ từ tài khoản AWS khác
5. **Custom AMIs**: AMIs tự tạo từ EC2 instances của bạn

## Launch Permissions

| Loại | Mô tả |
|------|-------|
| **Public** | Tất cả AWS accounts đều có thể sử dụng |
| **Explicit** | Chỉ các accounts/organizations được chỉ định mới có quyền |
| **Implicit** | Chủ sở hữu AMI tự động có quyền sử dụng |

## Root Volume Type

AMI được phân loại theo **loại root volume** khi launch instance:

```
                         AMI
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
   EBS-backed AMI              Instance Store-backed AMI
          │                               │
          ▼                               ▼
   Khi launch:                     Khi launch:
   Root volume = EBS               Root volume = Instance Store
```

### Sự khác biệt chính: Root data nằm ở đâu?

```
EBS-backed: Root data nằm BÊN NGOÀI instance (EBS server riêng)
┌──────────────┐          ┌──────────────┐
│   Instance   │◄─Network─│  EBS Volume  │  ← Root data ở ĐÂY
│   (chạy app) │          │  (root /)    │
└──────────────┘          └──────────────┘


Instance Store-backed: Root data nằm BÊN TRONG instance (local disk)
┌────────────────────────────────────┐
│   Instance                         │
│   ┌──────────────────────────────┐ │
│   │  Instance Store (root /)     │ │  ← Root data ở ĐÂY
│   └──────────────────────────────┘ │
└────────────────────────────────────┘
```

### Hình dung trong Data Center

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Data Center                              │
│                                                                 │
│  EBS-backed Instance:                                           │
│  ┌─────────────────┐           ┌─────────────────┐              │
│  │ Physical Server │           │ EBS Storage     │              │
│  │ ┌─────────────┐ │           │ Server          │              │
│  │ │EC2 Instance │ │◄─Network─►│ ┌─────────────┐ │              │
│  │ │(chạy app)   │ │           │ │ EBS Volume  │ │              │
│  │ └─────────────┘ │           │ │ (root data) │ │              │
│  └─────────────────┘           │ └─────────────┘ │              │
│                                └─────────────────┘              │
│  → Stop instance = Server rảnh, EBS Volume VẪN CÒN              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Instance Store-backed Instance:                                │
│  ┌─────────────────────────────────┐                            │
│  │ Physical Server                 │                            │
│  │ ┌─────────────────────────────┐ │                            │
│  │ │ EC2 Instance                │ │                            │
│  │ │ ┌─────────────────────────┐ │ │                            │
│  │ │ │ Local SSD (root data)   │ │ │ ← Data trong server        │
│  │ │ └─────────────────────────┘ │ │                            │
│  │ └─────────────────────────────┘ │                            │
│  └─────────────────────────────────┘                            │
│  → Stop instance = Server giải phóng = Local SSD XÓA = MẤT DATA │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AMI type chỉ quyết định ROOT volume

```
EBS-backed AMI:
├── Root volume: BẮT BUỘC là EBS
└── Data volumes: Tuỳ bạn chọn (EBS hoặc Instance Store)


Instance Store-backed AMI:
├── Root volume: BẮT BUỘC là Instance Store
└── Data volumes: Tuỳ bạn chọn (EBS hoặc Instance Store)
```

Ví dụ: Dùng EBS-backed AMI nhưng vẫn có thể attach Instance Store cho data:

```
┌─────────────────────────────────────────────┐
│  EC2 Instance (từ EBS-backed AMI)           │
│                                             │
│  ├── /dev/xvda (root): EBS 50GB             │  ← Bắt buộc EBS
│  ├── /dev/xvdb (data): EBS 200GB            │  ← Tuỳ chọn
│  └── /dev/nvme1n1: Instance Store 75GB      │  ← Tuỳ chọn (cache, temp)
│                                             │
└─────────────────────────────────────────────┘
```

### Khi nào dùng Instance Store?

| Dùng EBS | Dùng Instance Store |
|----------|---------------------|
| Database, files quan trọng | Cache, temp files |
| Cần data còn sau khi stop | Chấp nhận mất data |
| Cần backup (snapshot) | Cần I/O cực nhanh (local NVMe) |

> 📌 Instance Store cho **data volume** (cache, logs) vẫn phổ biến. Nhưng Instance Store cho **root volume** thì gần như không ai dùng nữa.

### So sánh chi tiết

| Đặc điểm | EBS-backed | Instance Store-backed |
|----------|------------|----------------------|
| Root data nằm ở | Server riêng (EBS) | Trong instance (local) |
| Boot time | < 1 phút | < 5 phút |
| Stop instance | ✅ Được, data còn | ❌ Không stop được |
| Terminate instance | ✅ Có thể giữ root volume | ❌ Mất hết |
| Thay đổi instance type | ✅ Có thể (khi stopped) | ❌ Không thể |
| Chi phí | Instance + EBS + Snapshot | Instance + S3 storage |

> ⚠️ **Lưu ý**: Instance Store-backed AMIs được coi là **end of life** và chỉ hỗ trợ trên các instance types cũ: C1, C3, D2, I2, M1, M2, M3, R3, X1.

### Thực tế hiện nay dùng gì?

```
┌─────────────────────────────────────────────────────────────────┐
│                     THỰC TẾ 2024+                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   EBS-backed AMI: 99% ████████████████████████████████████████  │
│                                                                 │
│   Instance Store-backed AMI: 1% █                               │
│   (chỉ còn legacy systems)                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Tại sao EBS-backed thắng tuyệt đối?**

| Lý do | Chi tiết |
|-------|----------|
| **Stop/Start được** | Tắt máy ban đêm tiết kiệm tiền, data vẫn còn |
| **Dễ backup** | Tạo snapshot dễ dàng |
| **Thay đổi instance type** | Nâng/hạ cấu hình linh hoạt |
| **Reliability** | Server lỗi → data vẫn an toàn ở EBS |
| **AWS khuyến nghị** | Tất cả AMI mới đều là EBS-backed |

**Khi nào vẫn dùng Instance Store?**

| Trường hợp | Ví dụ |
|------------|-------|
| **Data volume** (không phải root) | Cache Redis, temp files, logs |
| **Stateless applications** | Workers xử lý job, không cần lưu state |
| **Cần I/O cực cao** | Big data processing, local NVMe SSD |

> 📌 **Kết luận**: Khi chọn AMI trên AWS Console (Amazon Linux, Ubuntu, Windows...), **mặc định đều là EBS-backed**. Bạn không cần lo về Instance Store-backed AMI.

### So sánh Cost

**Chi phí trực tiếp:**

| | EBS-backed | Instance Store |
|---|------------|----------------|
| Instance cost | Trả theo giờ chạy | Trả theo giờ chạy |
| Storage cost | Trả thêm EBS ($/GB/tháng) | **Miễn phí** (đã gồm trong instance) |
| Snapshot cost | Trả thêm ($/GB/tháng) | Không có snapshot |

**Nhưng thực tế phức tạp hơn:**

```
Instance Store chỉ có trên một số instance types (có chữ "d"):
├── m5d, m6id, c5d, c6id, i3, i4i, d2, d3...
└── Những instance này ĐẮTT HƠN instance thường

Ví dụ (us-east-1):
┌────────────────┬─────────────┬──────────────────┐
│ Instance Type  │ Giá/giờ     │ Instance Store   │
├────────────────┼─────────────┼──────────────────┤
│ m5.large       │ $0.096      │ Không có         │
│ m5d.large      │ $0.113      │ 75GB NVMe SSD    │
└────────────────┴─────────────┴──────────────────┘

Chênh lệch: $0.017/giờ = ~$12/tháng
Trong khi 75GB EBS gp3 chỉ ~$6/tháng
```

**Stop instance ảnh hưởng cost:**

| | EBS-backed | Instance Store-backed |
|---|------------|----------------------|
| Stop được không? | ✅ Được | ❌ Không |
| Khi Stop | Không trả instance cost, vẫn trả EBS | Không stop được |
| Tiết kiệm ban đêm/weekend | ✅ Stop để tiết kiệm | ❌ Phải chạy 24/7 hoặc mất data |

**Ví dụ thực tế:**

```
Scenario: Server chạy 8 tiếng/ngày (giờ làm việc)

EBS-backed (m5.large + 50GB EBS):
├── Instance: $0.096 × 8h × 30 ngày = $23
├── EBS 50GB: $4/tháng
└── Total: ~$27/tháng

Instance Store-backed (phải chạy 24/7 vì không stop được):
├── Instance: $0.113 × 24h × 30 ngày = $81
└── Total: ~$81/tháng (ĐẮT HƠN 3 LẦN!)
```

**Kết luận về cost:**

| Trường hợp | Rẻ hơn |
|------------|--------|
| Server chạy 24/7, cần I/O cao | Instance Store có thể rẻ hơn |
| Server có thể Stop (dev, staging) | EBS-backed rẻ hơn nhiều |
| Cần flexibility | EBS-backed (Stop/Start thoải mái) |

> 📌 **Thực tế**: EBS-backed thường **rẻ hơn** vì có thể Stop instance khi không dùng.

## Virtualization Types

**AMI chứa thông tin virtualization type** - cách AWS ảo hóa phần cứng để chạy instance:

```
AMI metadata:
{
    "ImageId": "ami-xxx",
    "Architecture": "x86_64",
    "VirtualizationType": "hvm",   ← LƯU Ở ĐÂY
    "RootDeviceType": "ebs",
    ...
}
```

### 2 loại Virtualization

```
┌─────────────────────────────────────────────────────────────────┐
│  HVM (Hardware Virtual Machine)                                 │
├─────────────────────────────────────────────────────────────────┤
│  Physical Hardware                                              │
│        │                                                        │
│        ▼                                                        │
│  ┌───────────────┐                                              │
│  │  Hypervisor   │  ← Ảo hóa TOÀN BỘ phần cứng                  │
│  └───────────────┘                                              │
│        │                                                        │
│        ▼                                                        │
│  ┌───────────────┐                                              │
│  │ EC2 Instance  │  ← Nghĩ mình đang chạy trên máy thật         │
│  │ (Guest OS)    │    Không cần sửa đổi OS                      │
│  └───────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PV (Paravirtual) - Legacy                                      │
├─────────────────────────────────────────────────────────────────┤
│  Physical Hardware                                              │
│        │                                                        │
│        ▼                                                        │
│  ┌───────────────┐                                              │
│  │  Hypervisor   │  ← Ảo hóa MỘT PHẦN                           │
│  └───────────────┘                                              │
│        │                                                        │
│        ▼                                                        │
│  ┌───────────────┐                                              │
│  │ EC2 Instance  │  ← Biết mình đang chạy ảo                    │
│  │ (Modified OS) │    OS phải được sửa đổi để "hợp tác"         │
│  └───────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Ảnh hưởng khi chọn AMI

| AMI type | Launch được trên |
|----------|------------------|
| HVM | Tất cả instance types hiện tại |
| PV | Chỉ C1, M1, M2, M3, T1 (cũ) |

### So sánh

| | HVM | PV |
|---|-----|-----|
| OS biết đang ảo hóa? | Không (nghĩ là máy thật) | Có (phải sửa đổi OS) |
| Enhanced Networking | ✅ Có | ❌ Không |
| GPU support | ✅ Có | ❌ Không |
| Instance types | Tất cả hiện tại | Chỉ cũ |

### Thực tế hiện nay

```
2024+: 
├── HVM: 100% █████████████████████████████████████████
└── PV:  0%   (không ai dùng nữa)
```

> 📌 **Kết luận**: Tất cả AMI hiện tại đều là **HVM**. Bạn không cần chọn hay lo về virtualization type - AWS tự động dùng HVM.

## AMI Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        AMI LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  Create  │───▶│ Register │───▶│   Use    │───▶│Deregister│ │
│   │   AMI    │    │   AMI    │    │   AMI    │    │   AMI    │ │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│        │                               │                        │
│        │                               ▼                        │
│        │                         ┌──────────┐                   │
│        │                         │   Copy   │                   │
│        │                         │ to other │                   │
│        │                         │  Region  │                   │
│        │                         └──────────┘                   │
│        │                               │                        │
│        ▼                               ▼                        │
│   ┌──────────┐                   ┌──────────┐                   │
│   │  Share   │                   │  Launch  │                   │
│   │  with    │                   │Instances │                   │
│   │ Others   │                   └──────────┘                   │
│   └──────────┘                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tạo Custom AMI

### Từ EC2 Instance

```bash
# Bước 1: Tạo AMI từ instance đang chạy
aws ec2 create-image \
    --instance-id i-1234567890abcdef0 \
    --name "My-Custom-AMI" \
    --description "AMI created from my web server" \
    --no-reboot

# Bước 2: Kiểm tra trạng thái AMI
aws ec2 describe-images --image-ids ami-0123456789abcdef0
```

| Tham số | Mô tả |
|---------|-------|
| `--no-reboot` | Không reboot instance khi tạo AMI (có thể gây inconsistency) |
| `--reboot` | Reboot instance để đảm bảo file system consistency (mặc định) |

### Best Practices khi tạo AMI

1. **Clean up trước khi tạo AMI**:
   - Xóa temporary files, logs
   - Xóa SSH keys, credentials
   - Clear bash history

2. **Sử dụng `--reboot`** để đảm bảo data consistency

3. **Tag AMI** với metadata hữu ích (version, purpose, owner)

## Copy AMI giữa các Regions

```bash
aws ec2 copy-image \
    --source-image-id ami-0123456789abcdef0 \
    --source-region us-east-1 \
    --region ap-southeast-1 \
    --name "My-AMI-Copy-Singapore"
```

> 📌 AMI copy là **asynchronous**. Snapshot được copy trước, sau đó AMI mới được register.

## Share AMI

### Share với account cụ thể

```bash
# Thêm launch permission cho account khác
aws ec2 modify-image-attribute \
    --image-id ami-0123456789abcdef0 \
    --launch-permission "Add=[{UserId=123456789012}]"

# Xem launch permissions hiện tại
aws ec2 describe-image-attribute \
    --image-id ami-0123456789abcdef0 \
    --attribute launchPermission
```

### Make AMI public

```bash
aws ec2 modify-image-attribute \
    --image-id ami-0123456789abcdef0 \
    --launch-permission "Add=[{Group=all}]"
```

> ⚠️ **Cảnh báo**: Không public AMI chứa credentials, keys, hoặc data nhạy cảm.

## AMI Billing

| Thành phần | Chi phí |
|------------|---------|
| **AMI storage** | EBS Snapshot storage costs |
| **Data transfer** | Khi copy AMI giữa các Regions |
| **Marketplace AMIs** | Có thể có phí license từ vendor |

## Tìm AMI

### Qua Console

1. EC2 Console → **AMIs** (sidebar)
2. Chọn filter: **Owned by me**, **Public images**, hoặc **Private images**
3. Sử dụng search filters: Architecture, Root device type, Virtualization type

### Qua CLI

```bash
# Tìm Amazon Linux 2023 AMIs
aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-*" \
              "Name=architecture,Values=x86_64" \
              "Name=virtualization-type,Values=hvm" \
    --query 'Images | sort_by(@, &CreationDate) | [-1]'

# Tìm Ubuntu AMIs
aws ec2 describe-images \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-*-22.04-amd64-server-*" \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId'
```

## Deregister AMI

```bash
# Bước 1: Deregister AMI
aws ec2 deregister-image --image-id ami-0123456789abcdef0

# Bước 2: Xóa snapshot liên quan (tuỳ chọn)
aws ec2 delete-snapshot --snapshot-id snap-0123456789abcdef0
```

> 📌 Deregister AMI **không tự động xóa** EBS snapshots. Bạn phải xóa thủ công để tránh chi phí storage.

## Liên kết với các dịch vụ khác

- [EC2](ec2.md) - Launch instances từ AMI
- [EBS](ebs.md) - Root volume và snapshots cho EBS-backed AMIs
- [IAM](iam.md) - Permissions để tạo, share, và sử dụng AMIs

---

**Nguồn tham khảo:**
- [Amazon Machine Images (AMI) - AWS Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html)
- [AMI Types - AWS Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ComponentsAMIs.html)
