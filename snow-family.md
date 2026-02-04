# AWS Snow Family


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các thiết bị Snow Family](#các-thiết-bị-snow-family)
  - [Snowcone](#1-aws-snowcone)
  - [Snowball Edge Storage Optimized](#2-snowball-edge-storage-optimized)
  - [Snowball Edge Compute Optimized](#3-snowball-edge-compute-optimized)
  - [Snowmobile](#4-aws-snowmobile)
- [Quy trình sử dụng](#quy-trình-sử-dụng)
- [Security](#security)
- [AWS OpsHub](#aws-opshub)
- [Pricing](#pricing)
- [Khi nào dùng Snow Family?](#khi-nào-dùng-snow-family)
- [So sánh với các giải pháp khác](#so-sánh-với-các-giải-pháp-khác)
- [Liên kết](#liên-kết)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Vấn đề:** Bạn có **petabytes data** cần chuyển lên AWS, nhưng:
- Internet quá chậm (1 Gbps ≈ 3 năm để transfer 100 TB)
- Không có kết nối mạng ổn định
- Cần xử lý data ở edge (remote locations, factories, ships)

**Giải pháp:** AWS ship thiết bị vật lý đến, bạn copy data vào, ship lại → AWS upload lên S3.

```
Tại sao dùng Snow Family thay vì upload qua internet?

100 TB data với các tốc độ mạng:
┌─────────────────┬──────────────────┐
│ Tốc độ mạng     │ Thời gian        │
├─────────────────┼──────────────────┤
│ 100 Mbps        │ ~100 ngày        │
│ 1 Gbps          │ ~10 ngày         │
│ 10 Gbps         │ ~1 ngày          │
│ Snowball Edge   │ ~1 tuần (ship)   │
└─────────────────┴──────────────────┘

→ Với data lớn + mạng chậm, ship vật lý nhanh hơn!
```

> ⚠️ **Lưu ý:** Snowball Edge **không còn nhận khách hàng mới** (từ 2024). AWS khuyến nghị:
> - Online transfer → **AWS DataSync**
> - Physical transfer → **AWS Data Transfer Terminal**
> - Edge computing → **AWS Outposts**
>
> **Nguồn:** [Snowball Edge availability change](https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html)

---

## Các thiết bị Snow Family

### Bảng so sánh

| | Snowcone | Snowball Edge Storage | Snowball Edge Compute | Snowmobile |
|---|----------|----------------------|----------------------|------------|
| **Storage** | 8-14 TB | 80-210 TB | 28-42 TB + NVMe | 100 PB |
| **vCPUs** | 2 | 40-104 | 104 | N/A |
| **RAM** | 4 GB | 80-416 GB | 416-512 GB | N/A |
| **Kích thước** | 2.1 kg | ~23 kg | ~23 kg | 45-foot container |
| **Use case** | Edge IoT | Data migration | Edge compute, ML | Exabyte migration |
| **Cluster** | Không | Có | Có | Không |
| **EC2/Lambda** | Limited | Có | Có | Không |

---

### 1. AWS Snowcone

**Thiết bị nhỏ nhất** trong Snow Family - portable, rugged.

- **Storage:** 8 TB HDD hoặc 14 TB SSD
- **Compute:** 2 vCPUs, 4 GB RAM
- **Kích thước:** 227mm x 148.6mm x 82.65mm
- **Trọng lượng:** 2.1 kg (có thể mang theo ba lô!)
- **Có thể chạy:** EC2 instances, IoT Greengrass

**Use cases:**
- Thu thập data từ IoT sensors
- Edge locations không có rack space
- Content distribution cho remote locations
- Tactical edge (quân sự, thám hiểm)

---

### 2. Snowball Edge Storage Optimized

**Tối ưu cho data migration** - capacity lớn.

- **Storage:** 80 TB hoặc 210 TB usable
- **Compute:** 40-104 vCPUs, 80-416 GB RAM
- **Network:** 10/25/100 Gbps
- **Có thể cluster:** 3-16 devices (lên đến 3+ PB)

**Use cases:**
- Large-scale data migrations (data center → AWS)
- Disaster recovery
- Remote locations với data lớn

---

### 3. Snowball Edge Compute Optimized

**Tối ưu cho edge computing** - xử lý tại chỗ.

- **Storage:** 28 TB HDD + 7.68 TB NVMe SSD
- **Compute:** 104 vCPUs, 416-512 GB RAM
- **GPU:** Optional NVIDIA Tesla V100 (cho ML)
- **Network:** 10/25/100 Gbps

**Use cases:**
- Machine learning inference tại edge
- Video transcoding, analysis
- Industrial IoT với processing nặng
- Disconnected environments (ships, mines, oil rigs)

---

### 4. AWS Snowmobile

**Thiết bị lớn nhất** trong Snow Family - xe container 45-foot cho exabyte-scale data migration.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS SNOWMOBILE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🚛  ════════════════════════════════════════════════════════════   │   │
│   │       45-foot shipping container trên xe tải                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   Storage:     100 PB (100,000 TB) per Snowmobile                           │
│   Security:    GPS tracking, 24/7 video surveillance, security escort       │
│   Encryption:  256-bit encryption                                           │
│   Network:     Multiple 40 Gbps connections                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Đặc điểm | Thông số |
|----------|----------|
| **Storage** | 100 PB (100 Petabytes) |
| **Container** | 45-foot ruggedized shipping container |
| **Transfer speed** | Up to 1 Tb/s (multiple 40 Gbps connections) |
| **Time to fill** | ~10 days để fill 100 PB |
| **Security** | GPS, alarm, 24/7 video, security escort |
| **Encryption** | 256-bit with multiple encryption keys |

**Use cases:**

- **Exabyte-scale migration**: Data center shutdown, mass migration
- **Video libraries**: Massive video archives (Hollywood studios)
- **Scientific data**: Genomics, satellite imagery, seismic data
- **Disaster recovery**: Moving entire data centers

**Quy trình:**

```
1. AWS đưa Snowmobile đến data center của bạn
2. Kết nối Snowmobile với network (multiple 40 Gbps)
3. Copy data vào Snowmobile (~10 days cho 100 PB)
4. AWS đưa Snowmobile về và upload vào S3
```

**So sánh Snowmobile vs Snowball Edge:**

| | Snowball Edge | Snowmobile |
|---|---------------|------------|
| **Capacity** | 80-210 TB | 100 PB (100,000 TB) |
| **Size** | Vali lớn (~23 kg) | Container 45-foot trên xe tải |
| **Best for** | 10 TB - 10 PB | 10 PB - 100 PB |
| **Cluster needed** | Có (nhiều devices) | Không (1 Snowmobile) |

> [!NOTE]
> **Rule of thumb**: Nếu cần transfer hơn **10 PB**, cân nhắc dùng Snowmobile thay vì cluster nhiều Snowball Edge devices.

## Quy trình sử dụng

```
┌─────────────────────────────────────────────────────────────────┐
│                     Quy trình Snow Family                       │
└─────────────────────────────────────────────────────────────────┘

1. ORDER
   └── AWS Console → Chọn device → Tạo job → Chọn S3 bucket đích

2. SHIP TO YOU
   └── AWS chuẩn bị device → Ship đến địa chỉ của bạn

3. CONNECT & COPY
   └── Power on → Unlock bằng AWS OpsHub → Copy data vào device
   └── (Optional) Chạy EC2/Lambda workloads trên device

4. SHIP BACK
   └── Tắt device → E Ink tự hiện shipping label → Gửi lại AWS

5. UPLOAD TO S3
   └── AWS nhận device → Upload data vào S3 bucket
   └── Xóa sạch data trên device (secure erase)

6. VERIFY
   └── Kiểm tra data trong S3 → Job complete
```

---

## Security

Snow Family có nhiều lớp bảo mật:

| Layer | Mô tả |
|-------|-------|
| **Encryption** | Data được encrypt với KMS keys (256-bit) |
| **Tamper-resistant** | Device có tamper-evident enclosure |
| **TPM** | Trusted Platform Module cho secure boot |
| **Chain of custody** | AWS theo dõi device location |
| **Secure erase** | Data bị xóa sau khi import vào S3 |
| **E Ink display** | Shipping label tự động, không thể giả mạo |

```
Data flow:
Your Data → Encrypt (KMS) → Copy to Device → Ship → AWS Decrypt → S3

→ Data LUÔN encrypted, kể cả trong transit
```

---

## AWS OpsHub

**GUI tool** để quản lý Snow devices (thay vì CLI):

- Unlock và setup device
- Transfer files (drag & drop)
- Launch EC2 instances
- Monitor device status
- Manage clustering

---

## Pricing

| Thành phần | Chi phí |
|------------|---------|
| **Service fee** | Per job (thuê device) |
| **Shipping** | Phụ thuộc location |
| **Extra days** | Phí giữ device quá thời hạn |
| **Data transfer IN** | **Miễn phí** (vào S3) |
| **Data transfer OUT** | Tính phí (từ S3 ra device) |

> **Nguồn:** [AWS Snowball Pricing](https://aws.amazon.com/snowball/pricing/)

---

## Khi nào dùng Snow Family?

| Scenario | Giải pháp đề xuất |
|----------|-------------------|
| Data < 10 TB, internet tốt | Upload trực tiếp hoặc **S3 Transfer Acceleration** |
| Data 10-80 TB, internet ổn | **AWS DataSync** |
| Data > 80 TB, mạng chậm/không ổn định | **Snowball Edge** |
| Edge computing cần cao | **Snowball Edge Compute** hoặc **Outposts** |
| Remote nhỏ, IoT | **Snowcone** |
| Data center migration (PB scale) | **Multiple Snowball Edge** (cluster) |

---

## So sánh với các giải pháp khác

| | Snow Family | DataSync | Direct Connect | S3 Transfer Acceleration |
|---|-------------|----------|----------------|-------------------------|
| **Transfer method** | Physical ship | Online | Dedicated line | Internet (optimized) |
| **Best for** | Massive data, no network | Ongoing sync | Hybrid, consistent | Long-distance uploads |
| **Speed** | Days (shipping) | Network-dependent | 1-100 Gbps | Faster than regular |
| **One-time cost** | Per job | Per GB | Port + data | Per GB |

---

## Liên kết

- [S3](s3.md) - Destination cho Snow Family data
- [AWS Overview](aws-overview.md) - Regions và infrastructure

---

## Tài liệu tham khảo

- [AWS Snowball Developer Guide](https://docs.aws.amazon.com/snowball/latest/developer-guide/)
- [AWS Snow Family](https://aws.amazon.com/snow/)
- [Snowball Edge availability change](https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html)
