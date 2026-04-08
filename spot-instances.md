# Amazon EC2 Spot Instances

## Mục lục

- [Tổng quan](#tổng-quan)
- [Spot Instance hoạt động như thế nào](#spot-instance-hoạt-động-như-thế-nào)
- [Vòng đời của Spot Instance](#vòng-đời-của-spot-instance)
- [One-time request vs Persistent request](#one-time-request-vs-persistent-request)
- [Interruption là gì](#interruption-là-gì)
- [Interruption behavior: terminate, stop, hibernate](#interruption-behavior-terminate-stop-hibernate)
- [Spot Fleet và EC2 Fleet liên quan gì tới Spot](#spot-fleet-và-ec2-fleet-liên-quan-gì-tới-spot)
- [Spot so với On-Demand, Reserved Instances, Savings Plans](#spot-so-với-on-demand-reserved-instances-savings-plans)
- [Use cases phù hợp và không phù hợp](#use-cases-phù-hợp-và-không-phù-hợp)
- [Best practices khi dùng Spot](#best-practices-khi-dùng-spot)
- [CLI và các tín hiệu cần theo dõi](#cli-và-các-tín-hiệu-cần-theo-dõi)
- [Tóm tắt cần nhớ](#tóm-tắt-cần-nhớ)
- [Tham khảo](#tham-khảo)

---

## Tổng quan

**Amazon EC2 Spot Instances** là các EC2 instances sử dụng **spare EC2 capacity** của AWS với mức giá thấp hơn đáng kể so với **On-Demand**.

Theo tài liệu AWS:

- Spot có thể tiết kiệm **lên đến 90%** so với On-Demand
- Không cần cam kết 1-3 năm như **Reserved Instances** hoặc **Savings Plans**
- Đổi lại, AWS có thể **interrupt** Spot Instance khi cần lấy lại capacity

Spot phù hợp nhất cho các workload:

- **Fault-tolerant**
- **Flexible**
- **Time-flexible**
- Có thể chấp nhận việc instance bị **stop**, **hibernate**, hoặc **terminate**

Ví dụ điển hình:

- Batch processing
- Big data / analytics
- CI/CD runners
- Rendering
- Stateless workers
- Container workloads

> Nguồn AWS: [Spot Instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)

---

## Spot Instance hoạt động như thế nào

Spot hoạt động theo cơ chế rất đơn giản:

1. Bạn tạo **Spot request** hoặc để một dịch vụ như **EC2 Fleet**, **Spot Fleet**, **EC2 Auto Scaling**, **AWS Batch**, **ECS**, **EKS** tạo request giúp bạn.
2. AWS kiểm tra xem hiện tại có **capacity dư** phù hợp với yêu cầu của bạn hay không.
3. Nếu có capacity, AWS **launch Spot Instance**.
4. Instance chạy giống EC2 bình thường trong lúc còn capacity.
5. Khi AWS cần lấy lại capacity, Spot Instance có thể bị **interrupt**.

Điểm quan trọng:

- Khi đang chạy, Spot **không khác gì** một EC2 bình thường về CPU, RAM, network, EBS
- Khác biệt nằm ở chỗ **AWS có quyền lấy lại instance**

AWS mô tả:

> Spot Instances are exactly the same as On-Demand Instances while running.

Nhưng:

> Spot does not guarantee that you can keep your running instances long enough to finish your workloads.

Tức là:

- **Compute behavior**: giống EC2 bình thường
- **Availability guarantee**: thấp hơn On-Demand

---

## Vòng đời của Spot Instance

Diagram dưới đây tóm tắt vòng đời cơ bản:

```text
┌──────────────────────┐
│ Tạo Spot request     │
│ one-time/persistent  │
└──────────┬───────────┘
           │
           v
┌──────────────────────┐
│ Request = open       │
│ Chờ capacity         │
└──────────┬───────────┘
           │ có capacity
           v
┌──────────────────────┐
│ Request = active     │
│ Spot Instance chạy   │
└───────┬────────┬─────┘
        │        │
        │        ├───────────────┐
        │        │ bạn stop      │
        │        v               │
        │   ┌──────────────────┐ │
        │   │ Request=disabled │ │
        │   │ Instance stopped │ │
        │   └──────────────────┘ │
        │                        │
        │ AWS interrupt          │
        v                        │
┌──────────────────────┐         │
│ Interruption         │         │
│ terminate/stop/hiber │         │
└───────┬──────────────┘         │
        │                        │
        ├──────── terminate ─────┘
        │
        v
┌──────────────────────────────┐
│ One-time: request đóng       │
│ Persistent: request mở lại   │
│ để tìm capacity mới          │
└──────────────────────────────┘
```

Các trạng thái request quan trọng theo AWS:

- `open` — đang chờ được fulfill
- `active` — đã có Spot Instance đang chạy
- `failed` — request sai tham số
- `closed` — instance bị interrupted hoặc terminated
- `disabled` — bạn **stop** Spot Instance
- `cancelled` — bạn tự hủy request hoặc request hết hạn

> Nguồn AWS: [How Spot Instances work](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/how-spot-instances-work.html)

---

## One-time request vs Persistent request

Đây là phần rất dễ bị nhầm.

### One-time request

Đây là yêu cầu kiểu “thử launch một lần”.

- AWS cố fulfill request
- Nếu instance kết thúc vòng đời đó, request thường coi như xong
- Không phù hợp nếu bạn muốn AWS tự tìm lại Spot mới sau khi instance bị mất

### Persistent request

Đây là yêu cầu “tiếp tục giữ request sống cho tôi”.

- Request còn hiệu lực cho đến khi bạn **cancel** hoặc nó **expire**
- Nếu instance bị **terminated**, request có thể được **open lại** để AWS launch Spot mới
- Nếu instance bị interrupt theo behavior `stop` hoặc `hibernate`, AWS có thể **start/resume** lại khi capacity quay lại

AWS mô tả:

> A persistent Spot Instance request remains active until it expires or you cancel it, even if the request is fulfilled.

Vì vậy cần nhớ:

- **persistent request** không có nghĩa là instance sẽ sống mãi
- nó chỉ có nghĩa là **request vẫn tồn tại**

---

## Interruption là gì

**Spot interruption** là sự kiện AWS lấy lại Spot Instance của bạn.

AWS nêu 3 nhóm lý do chính:

- **Capacity**: AWS cần reclaim lại capacity
- **Price**: Spot price vượt quá maximum price mà bạn đặt
- **Constraints**: request của bạn có constraint như launch group / AZ group và constraint đó không còn thỏa mãn

AWS viết rõ:

> When Amazon EC2 reclaims a Spot Instance, we call this event a Spot Instance interruption.

Với đa số người dùng, nguyên nhân quan trọng nhất cần nhớ là:

- AWS cần capacity đó cho nhu cầu khác

Đây là khác biệt cốt lõi giữa:

- **Spot** — có thể bị AWS reclaim
- **On-Demand** — bạn tự quyết định khi nào stop / terminate

---

## Interruption behavior: terminate, stop, hibernate

Khi tạo Spot request, bạn có thể chọn interruption behavior.

### 1. Terminate

Đây là **mặc định**.

- AWS terminate instance khi interruption xảy ra
- Nếu `DeleteOnTermination=true`, EBS root volume có thể bị xóa
- Phù hợp với workload **stateless**

### 2. Stop

- Chỉ áp dụng trong các điều kiện nhất định
- Với Spot request riêng lẻ, request phải là **persistent**
- Khi instance bị stop:
  - EBS vẫn còn
  - bạn chỉ bị charge cho EBS trong lúc stopped
  - AWS có thể start lại khi capacity quay lại

Phù hợp với:

- Batch jobs có checkpoint
- Workload cần giữ disk state

### 3. Hibernate

- Trạng thái RAM được ghi xuống EBS
- Resume nhanh hơn stop
- Phù hợp với workload cần giữ memory state

Lưu ý:

- Khi interruption behavior là `hibernate`, notice vẫn có nhưng hibernation bắt đầu **ngay lập tức**
- Không nên kỳ vọng luôn có đủ 2 phút để xử lý như `terminate` hoặc `stop`

> Nguồn AWS: [Behavior of Spot Instance interruptions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/interruption-behavior.html)

---

## Spot Fleet và EC2 Fleet liên quan gì tới Spot

Khi không muốn quản lý từng Spot request riêng lẻ, bạn thường dùng **Fleet** hoặc **Auto Scaling**.

### Spot Fleet

Spot Fleet giúp bạn request và quản lý nhiều Spot Instances như một nhóm.

Hai request type chính:

- `request`
- `maintain`

`maintain` nghĩa là:

- bạn đặt **target capacity**
- nếu một số Spot Instances bị interrupt
- Fleet sẽ cố **launch replacement instances** để giữ mức capacity đó

Ví dụ:

- target capacity = 10
- đang chạy 10 instances
- 3 instances bị interrupt
- Fleet cố launch thêm 3 instances khác để quay lại 10

### EC2 Fleet

**EC2 Fleet** linh hoạt hơn Spot Fleet vì có thể trộn:

- Spot Instances
- On-Demand Instances

Request type của EC2 Fleet:

- `request`
- `maintain`
- `instant`

AWS hiện thiên về dùng **EC2 Fleet** hoặc **EC2 Auto Scaling groups** hơn là Spot Fleet API cũ cho các workload mới.

### Auto Scaling Group với mixed instances

Đây là cách rất phổ biến trong thực tế:

- baseline bằng On-Demand
- phần mở rộng dùng Spot
- ASG tự thay instance khi cần

Phù hợp cho:

- stateless web tiers
- worker pools
- microservices autoscaling

> Nguồn AWS: [Best practices for Amazon EC2 Spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html)

---

## Spot so với On-Demand, Reserved Instances, Savings Plans

| Tiêu chí | Spot Instances | On-Demand | Reserved Instances | Savings Plans |
|----------|----------------|-----------|--------------------|---------------|
| Giá | Rẻ nhất, có thể tới 90% | Cao nhất | Giảm giá do cam kết | Giảm giá do cam kết |
| Cam kết | Không | Không | 1 hoặc 3 năm | 1 hoặc 3 năm |
| Có thể bị AWS lấy lại | Có | Không | Không, vì RI là billing discount | Không, vì SP là billing discount |
| Tính chất | Capacity thật | Capacity thật | Billing discount | Billing discount |
| Phù hợp | Batch, fault-tolerant | Workload ngắn hạn / cần ổn định | Workload ổn định, cấu hình rõ | Workload ổn định nhưng cần linh hoạt |

Điểm rất quan trọng:

- **Reserved Instances không phải một loại EC2 instance riêng**
- **Savings Plans cũng không phải instance**
- Cả hai là **billing discount**

Còn Spot là:

- một **purchasing option** cho chính EC2 capacity

AWS cũng nêu rõ:

- Spot **không được cover bởi Savings Plans**
- Spend cho Spot **không tính vào Compute Savings Plans commitment**

---

## Use cases phù hợp và không phù hợp

### Phù hợp

- Batch processing
- ETL jobs
- CI/CD build runners
- Media rendering
- HPC linh hoạt
- Stateless containers / workers
- Background processing

### Không phù hợp

- Database production chính
- Stateful workload khó checkpoint
- Workload cần giữ đủ target capacity mọi lúc
- Hệ thống tightly coupled giữa các node
- Ứng dụng không chấp nhận việc mất instance đột ngột

AWS khuyến nghị Spot cho:

- **stateless**
- **fault-tolerant**
- **flexible**

Không khuyến nghị cho workload:

- **inflexible**
- **stateful**
- **fault-intolerant**

---

## Best practices khi dùng Spot

### 1. Chuẩn bị cho interruption

- Dùng checkpoint
- Lưu progress ra S3 / DynamoDB / EFS / DB
- Bắt interruption notice bằng **EventBridge**
- Poll **instance metadata** nếu cần

### 2. Linh hoạt về instance type và AZ

Không nên chỉ yêu cầu đúng 1 loại instance và 1 AZ.

Ví dụ:

- Thay vì chỉ `c6i.large`
- hãy cho phép nhiều lựa chọn tương đương như `c6a.large`, `c5.large`, `m6i.large`, `m5.large` nếu workload chịu được

### 3. Dùng fleet hoặc Auto Scaling

Đừng quản lý Spot bằng tay nếu workload có nhiều instances.

Ưu tiên:

- **EC2 Auto Scaling group**
- **EC2 Fleet**

### 4. Dùng allocation strategy phù hợp

AWS thường khuyến nghị:

- **price-capacity-optimized**
- hoặc **capacity-optimized**

để giảm nguy cơ interruption so với chỉ chọn pool rẻ nhất.

### 5. Thiết kế app như thể instance có thể mất bất cứ lúc nào

Đây là mindset quan trọng nhất khi dùng Spot.

App nên:

- stateless nếu có thể
- idempotent
- dễ restart
- dễ phân tán lại công việc

---

## CLI và các tín hiệu cần theo dõi

### Xem giá Spot lịch sử

```bash
aws ec2 describe-spot-price-history \
  --instance-types m6i.large \
  --product-descriptions Linux/UNIX
```

### Xem interruption notice trong instance metadata

```bash
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

curl -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/spot/instance-action
```

Ví dụ output:

```json
{"action":"terminate","time":"2026-04-08T03:22:00Z"}
```

### EventBridge event

Spot interruption warning có thể đi vào EventBridge với `detail-type`:

```text
EC2 Spot Instance Interruption Warning
```

Điều này rất hữu ích để:

- drain worker
- checkpoint dữ liệu
- gửi alert
- trigger workflow cleanup

> Nguồn AWS: [Spot Instance interruption notices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html)

---

## Tóm tắt cần nhớ

- Spot là **EC2 capacity dư** của AWS với giá rẻ hơn nhiều so với On-Demand
- Khi chạy, Spot **giống EC2 bình thường**
- Khác biệt lớn nhất là Spot có thể bị **interrupt**
- Interruption có thể dẫn tới `terminate`, `stop`, hoặc `hibernate`
- **Persistent request** nghĩa là request còn sống, không phải instance sống mãi
- Đừng dùng Spot cho workload không chịu được gián đoạn
- Nên dùng Spot qua **ASG**, **EC2 Fleet**, hoặc service tích hợp như **ECS**, **EKS**, **AWS Batch**

---

## Tham khảo

- AWS Docs — [Spot Instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
- AWS Docs — [How Spot Instances work](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/how-spot-instances-work.html)
- AWS Docs — [Spot Instance interruptions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html)
- AWS Docs — [Behavior of Spot Instance interruptions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/interruption-behavior.html)
- AWS Docs — [Spot Instance interruption notices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html)
- AWS Docs — [Best practices for Amazon EC2 Spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html)
- Liên quan trong repo:
  - [Amazon EC2](./ec2.md)
  - [ASG](./asg.md)
  - [Auto Scaling](./auto-scaling.md)
  - [AWS Batch](./aws-batch.md)
  - [ECS](./ecs.md)
