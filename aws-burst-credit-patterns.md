# AWS Burst Credit Patterns

## Mục lục

- [Tổng quan](#tổng-quan)
- [Mental model: baseline + credits + burst](#mental-model-baseline--credits--burst)
- [Amazon EC2 T instances: CPU credits](#amazon-ec2-t-instances-cpu-credits)
- [Amazon EFS Bursting throughput: burst credits](#amazon-efs-bursting-throughput-burst-credits)
- [Amazon EBS gp2: I/O credits](#amazon-ebs-gp2-io-credits)
- [Amazon EBS st1 và sc1: throughput credits](#amazon-ebs-st1-và-sc1-throughput-credits)
- [Amazon DynamoDB provisioned mode: burst capacity](#amazon-dynamodb-provisioned-mode-burst-capacity)
- [Những dịch vụ dễ nhầm nhưng không dùng burst credits](#những-dịch-vụ-dễ-nhầm-nhưng-không-dùng-burst-credits)
- [So sánh nhanh](#so-sánh-nhanh)
- [Cách nhận diện trong đề thi AWS](#cách-nhận-diện-trong-đề-thi-aws)
- [Nguồn tham khảo](#nguồn-tham-khảo)

---

## Tổng quan

Trong AWS, một số service/feature có behavior kiểu:

> **Dùng thấp hơn baseline → tích credit/capacity.**  
> **Dùng cao hơn baseline → tiêu credit/capacity để burst.**  
> **Hết credit → quay về baseline, throttle, hoặc bị tính thêm phí tùy service.**

Đây là pattern phổ biến cho workload **trung bình thấp nhưng thỉnh thoảng tăng vọt**:

```text
Traffic / I/O / CPU
^
|                         Burst: tiêu credits
|                            ┌──────────┐
|                            │          │
| baseline ──────────────────┼──────────┼────────────
|          Tích credits      │          │
|       ┌──────┐ ┌──────┐    │          │
|       │ low  │ │ low  │    │          │
|       └──────┘ └──────┘    └──────────┘
+----------------------------------------------------> time
```

Các service/feature quan trọng có behavior này:

- **EC2 T instances** (`t2`, `t3`, `t3a`, `t4g`) — CPU credits
- **EFS Bursting throughput** — burst credits cho file system throughput
- **EBS gp2** — I/O credits cho IOPS
- **EBS st1/sc1** — throughput credits / burst bucket
- **DynamoDB provisioned mode** — burst capacity ngắn hạn

---

## Mental model: baseline + credits + burst

Hãy nhớ 3 lớp:

```text
1. Baseline
   Mức hiệu năng có thể duy trì lâu dài.

2. Credit / bucket / burst capacity
   Phần hiệu năng chưa dùng được giữ lại để dùng sau.

3. Burst
   Chạy cao hơn baseline trong thời gian giới hạn bằng cách tiêu credit.
```

Ví dụ đời thường:

```text
Lương tháng = baseline
Tiền tiết kiệm = credits
Tháng có việc lớn = burst, lấy tiền tiết kiệm ra dùng
Tiền tiết kiệm hết = quay về mức chi theo lương tháng
```

Điểm quan trọng: **burst không phải vô hạn**. Nó chỉ phù hợp khi workload có peak ngắn hạn, không phải workload cao liên tục.

---

## Amazon EC2 T instances: CPU credits

Các instance burstable như:

```text
t2.micro
t3.micro
t3a.small
t4g.medium
```

có **baseline CPU utilization** và **CPU credits**.

AWS định nghĩa CPU credit là đơn vị vCPU-time:

```text
1 CPU credit = 1 vCPU chạy 100% trong 1 phút
             = 1 vCPU chạy 50% trong 2 phút
             = 2 vCPU chạy 25% trong 2 phút
```

Cơ chế:

```text
CPU < baseline  → tích CPU credits
CPU = baseline  → earn và spend cân bằng
CPU > baseline  → tiêu CPU credits
```

### Standard mode

Trong **Standard mode**:

```text
Có credits      → burst trên baseline
Hết credits     → CPU bị kéo dần về baseline
```

Phù hợp nếu bạn muốn kiểm soát chi phí và chấp nhận performance giảm khi hết credits.

### Unlimited mode

Trong **Unlimited mode**:

```text
Có credits      → dùng credits để burst
Hết credits     → dùng surplus credits để vẫn burst
Nếu average CPU vượt baseline trong rolling 24h → bị tính thêm phí
```

T3/T3a/T4g thường dùng Unlimited mặc định. Vì vậy có thể thấy instance vẫn chạy CPU cao dù `CPUCreditBalance` thấp, nhưng có khả năng phát sinh charge thêm.

### Metrics cần monitor

CloudWatch metrics:

- `CPUCreditBalance` — số CPU credits còn lại
- `CPUCreditUsage` — CPU credits đã dùng
- `CPUSurplusCreditBalance` — surplus credits trong Unlimited mode
- `CPUSurplusCreditsCharged` — surplus credits bị tính phí

### Khi nên dùng

Dùng EC2 T instances khi workload:

- CPU thường thấp
- thỉnh thoảng spike
- không cần CPU cao liên tục

Ví dụ:

- bastion host
- dev/test server
- small web app
- low-traffic API

Không nên dùng nếu app cần CPU cao liên tục. Khi đó nên chọn fixed-performance instances như `m`, `c`, `r` families tùy workload.

---

## Amazon EFS Bursting throughput: burst credits

EFS Bursting throughput dùng **burst credits** cho file system throughput.

Cơ chế:

```text
Dùng dưới baseline throughput  → tích burst credits
Dùng trên baseline throughput  → tiêu burst credits
Hết burst credits              → quay về baseline throughput
```

Baseline phụ thuộc vào lượng data trong **EFS Standard storage class**:

```text
Baseline write throughput = 50 KiB/s cho mỗi GiB trong EFS Standard
```

Ví dụ:

```text
100 GiB data  → baseline write ~5 MiB/s
1 TiB data    → baseline write ~50 MiB/s
10 TiB data   → baseline write ~500 MiB/s
```

Read throughput được tính ưu đãi hơn write:

```text
Baseline read throughput ≈ 3 × baseline write throughput
```

| Size trong EFS Standard | Baseline write | Burst write | Baseline read | Burst read |
|---:|---:|---:|---:|---:|
| **100 GiB** | 5 MiB/s | 100 MiB/s | 15 MiB/s | 300 MiB/s |
| **1 TiB** | 50 MiB/s | 100 MiB/s | 150 MiB/s | 300 MiB/s |
| **10 TiB** | 500 MiB/s | 1 GiB/s | 1.5 GiB/s | 3 GiB/s |

Max burst credit balance:

| File system size | Max burst credit balance |
|---|---:|
| **Nhỏ hơn 1 TiB** | 2.1 TiB credits |
| **Lớn hơn 1 TiB** | 2.1 TiB credits cho mỗi 1 TiB stored |

Điều này cho phép file system burst liên tục tối đa khoảng **12 giờ** khi credits đầy.

### Ví dụ 100 GiB

```text
Baseline = 5 MiB/s
Idle 24h → tích: 5 MiB/s × 86,400s = 432,000 MiB credits

Nếu burst write ở 100 MiB/s:
432,000 MiB ÷ 100 MiB/s = 4,320s ≈ 72 phút
```

### Metrics cần monitor

- `BurstCreditBalance` — số burst credits còn lại
- `PermittedThroughput` — throughput tối đa EFS đang cho phép
- `MeteredIOBytes` — throughput thực tế đang dùng

### Lưu ý hiện đại

AWS hiện khuyến nghị **Elastic throughput** cho workload spiky/unpredictable hoặc khó forecast. Elastic throughput tự scale theo activity và **không accrues/consumes burst credits**.

Vì vậy:

```text
Đề thi cũ / option không có Elastic → Bursting có thể là đáp án đúng
Thiết kế thực tế mới / option có Elastic → cân nhắc Elastic trước
```

---

## Amazon EBS gp2: I/O credits

`gp2` là General Purpose SSD thế hệ cũ của EBS. Nó dùng **I/O credits** để burst IOPS.

Baseline IOPS:

```text
Baseline = 3 IOPS mỗi GiB
```

Quy tắc:

```text
Volume nhỏ hơn 1 TiB và baseline < 3,000 IOPS
→ có thể burst lên 3,000 IOPS bằng I/O credits
```

Ví dụ:

```text
100 GiB gp2
Baseline = 100 × 3 = 300 IOPS
Burst tối đa = 3,000 IOPS
```

Cơ chế:

```text
I/O demand <= baseline  → tích I/O credits
I/O demand > baseline   → tiêu I/O credits để burst
Hết credits             → quay về baseline IOPS
```

AWS cho biết `gp2` có:

```text
I/O credit accrual limit = 5.4 million I/O credits
```

Số này đủ để volume burst tối đa 3,000 IOPS trong ít nhất khoảng **30 phút**.

### Ví dụ burst duration

Formula:

```text
Burst duration = I/O credit balance / (Burst IOPS - Baseline IOPS)
```

Với `100 GiB gp2`:

```text
Credit balance = 5,400,000
Burst IOPS = 3,000
Baseline IOPS = 300

Duration = 5,400,000 / (3,000 - 300)
         = 5,400,000 / 2,700
         = 2,000 giây ≈ 33 phút
```

### Metric cần monitor

- `BurstBalance` — phần trăm I/O credits còn lại

### Đừng nhầm với gp3

`gp3` **không dùng burst performance**. `gp3` có baseline ổn định và có thể provision thêm IOPS/throughput độc lập với volume size.

```text
gp2 → performance gắn với size + burst credits
gp3 → performance provision rõ ràng, sustain lâu dài
```

---

## Amazon EBS st1 và sc1: throughput credits

`st1` và `sc1` là HDD-backed EBS volumes, tối ưu theo **throughput** hơn là IOPS.

- `st1` — Throughput Optimized HDD, cho dữ liệu thường xuyên truy cập, sequential I/O lớn
- `sc1` — Cold HDD, cho dữ liệu ít truy cập, chi phí thấp hơn

Cả hai dùng **burst bucket model**:

```text
Dùng dưới baseline throughput → tích throughput credits
Dùng trên baseline throughput → tiêu throughput credits
Bucket hết                    → quay về baseline throughput
```

### st1

Với `st1`:

```text
Baseline = 40 MiB/s mỗi TiB
Burst    = 250 MiB/s mỗi TiB
Max      = 500 MiB/s
```

Ví dụ `1 TiB st1`:

```text
Baseline throughput = 40 MiB/s
Burst throughput    = 250 MiB/s
Bucket capacity     = 1 TiB-worth credits
```

### sc1

Với `sc1`:

```text
Baseline = 12 MiB/s mỗi TiB
Burst    = 80 MiB/s mỗi TiB
Max      = 250 MiB/s
```

Ví dụ `1 TiB sc1`:

```text
Baseline throughput = 12 MiB/s
Burst throughput    = 80 MiB/s
Bucket capacity     = 1 TiB-worth credits
```

### Khi nên dùng

Dùng `st1`/`sc1` khi workload là:

- large sequential reads/writes
- log processing
- big data scan
- data warehouse staging
- cold data scan

Không phù hợp cho workload small random I/O. Với random I/O, dùng SSD volume như `gp3` hoặc `io2`.

---

## Amazon DynamoDB provisioned mode: burst capacity

DynamoDB có behavior gần giống, nhưng không gọi là credit balance kiểu EC2/EFS.

Trong **provisioned mode**, bạn cấu hình:

```text
RCU = read capacity units
WCU = write capacity units
```

Nếu table không dùng hết capacity, DynamoDB có thể giữ lại unused capacity để xử lý spike ngắn hạn.

AWS nói DynamoDB giữ tối đa:

```text
5 phút = 300 giây unused read/write capacity
```

Ví dụ:

```text
Table provisioned: 100 WCU
Trong vài phút chỉ dùng: 20 WCU
→ có unused write capacity

Sau đó spike lên: 180 WCU trong thời gian ngắn
→ burst capacity có thể giúp request thành công thay vì throttle ngay
```

### Khác với EC2/EFS/EBS

DynamoDB burst capacity có vài điểm khác:

- Không nên coi là capacity đảm bảo tuyệt đối.
- DynamoDB có thể dùng burst capacity cho background maintenance mà không báo trước.
- Chi tiết burst capacity có thể thay đổi trong tương lai.
- Nếu spike kéo dài hoặc vượt quá table/partition limit, vẫn bị throttle.

DynamoDB còn có **adaptive capacity** để xử lý hot partition tốt hơn. Adaptive capacity tự động tăng capacity cho partition nhận traffic cao, miễn là không vượt tổng table capacity hoặc partition maximum.

---

## Những dịch vụ dễ nhầm nhưng không dùng burst credits

Không phải cứ “scale” hoặc “burst traffic” là dùng credit bucket.

### EBS gp3

`gp3` không dùng burst performance.

```text
gp3 có baseline 3,000 IOPS và 125 MiB/s included
Có thể provision thêm IOPS/throughput
Có thể sustain full provisioned performance lâu dài
```

### EFS Elastic throughput

EFS Elastic throughput tự scale theo workload activity và không dùng burst credits.

```text
Elastic throughput → scale tự động, pay by usage
Bursting throughput → baseline theo size + burst credits
```

### Lambda

Lambda scale bằng concurrency và quota, không phải burst credit bucket theo kiểu EC2 T/EFS/EBS. Có các khái niệm như account concurrency, reserved concurrency, provisioned concurrency, scaling rate — nhưng không phải “tích credit lúc idle rồi tiêu lúc peak”.

### Auto Scaling Group

ASG scale bằng cách tăng/giảm số EC2 instances theo policy. Đây là horizontal scaling, không phải burst credits.

---

## So sánh nhanh

| Service / Feature | Resource burst | Baseline dựa trên | Credit/capacity | Hết credit/capacity |
|---|---|---|---|---|
| **EC2 T instances** | CPU | Instance type | CPU credits | Standard: về baseline; Unlimited: có thể tính phí thêm |
| **EFS Bursting** | File throughput | EFS Standard size | Burst credits | Về baseline throughput |
| **EBS gp2** | IOPS | Volume size | I/O credits | Về baseline IOPS |
| **EBS st1** | Throughput | Volume size | Throughput credits | Về baseline throughput |
| **EBS sc1** | Throughput | Volume size | Throughput credits | Về baseline throughput |
| **DynamoDB provisioned** | RCU/WCU ngắn hạn | Provisioned capacity chưa dùng | Burst capacity ~5 phút | Throttle nếu vượt khả năng phục vụ |

---

## Cách nhận diện trong đề thi AWS

Nếu đề có các keyword sau, nghĩ tới burst-credit pattern:

```text
burstable
baseline
credits
spiky workload
occasional spikes
low average utilization
unpredictable bursts
cost-effective for intermittent workload
```

Map keyword sang service:

| Keyword trong đề | Nên nghĩ tới |
|---|---|
| CPU low average, occasional high CPU | EC2 T instances |
| Shared file system, throughput scales with storage, burst credits | EFS Bursting |
| EBS SSD old generation, burst to 3,000 IOPS | EBS gp2 |
| Large sequential HDD workload, throughput burst bucket | EBS st1/sc1 |
| Provisioned RCU/WCU, temporary read/write spike | DynamoDB burst capacity |

Cách chọn nhanh:

```text
CPU spike        → EC2 T CPU credits
File throughput  → EFS Bursting / Elastic
Block IOPS       → EBS gp2
HDD throughput   → EBS st1/sc1
NoSQL RCU/WCU    → DynamoDB burst/adaptive capacity
```

> [!TIP]
> Trong thiết kế thực tế, nếu workload spike **thường xuyên, kéo dài, hoặc khó dự đoán**, đừng chỉ dựa vào credits. Hãy cân nhắc mode/service có performance ổn định hoặc tự scale tốt hơn: `gp3`, `EFS Elastic throughput`, DynamoDB on-demand, hoặc EC2 fixed-performance instances.

---

## Nguồn tham khảo

- [Key concepts for burstable performance instances - Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html)
- [Monitor CPU credits for burstable instances - Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances-monitoring-cpu-credits.html)
- [Amazon EFS performance specifications](https://docs.aws.amazon.com/efs/latest/ug/performance.html)
- [CloudWatch metrics for Amazon EFS](https://docs.aws.amazon.com/efs/latest/ug/efs-metrics.html)
- [Amazon EBS General Purpose SSD volumes](https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html)
- [Amazon EBS Throughput Optimized HDD and Cold HDD volumes](https://docs.aws.amazon.com/ebs/latest/userguide/hdd-vols.html)
- [Amazon EBS CloudWatch metrics](https://docs.aws.amazon.com/ebs/latest/userguide/using_cloudwatch_ebs.html)
- [DynamoDB burst and adaptive capacity](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/burst-adaptive-capacity.html)
