# AWS Lambda và Serverless Computing


## Mục lục

- [Tổng quan](#tổng-quan)
- [️ Kiến trúc AWS Lambda](#kiến-trúc-aws-lambda)
- [Lambda Execution Model](#lambda-execution-model)
- [⚡ Lambda Triggers (Event Sources)](#lambda-triggers-event-sources)
- [Lambda Pricing](#lambda-pricing)
- [Lambda Security](#lambda-security)
- [Lambda Networking](#lambda-networking)
- [Lambda Limits và Best Practices](#lambda-limits-và-best-practices)
- [️ Lambda Layers](#lambda-layers)
- [️ Serverless Application Patterns](#serverless-application-patterns)
- [Lambda vs ECS vs EKS](#lambda-vs-ecs-vs-eks)
- [Hands-on Examples](#hands-on-examples)
- [Key Takeaways](#key-takeaways)
- [Các dịch vụ Serverless khác của AWS (Chi tiết)](#các-dịch-vụ-serverless-khác-của-aws-chi-tiết)
- [Tiếp theo](#tiếp-theo)

---

## Tổng quan

**AWS Lambda** là dịch vụ compute serverless cho phép bạn chạy code mà không cần quản lý servers. Bạn chỉ tập trung vào code, AWS lo toàn bộ infrastructure.

### Serverless là gì?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL (EC2/ECS)                            │
│                                                                     │
│   Bạn phải quản lý:                                                 │
│   ├── Provision servers (EC2 instances)                             │
│   ├── Scale up/down servers                                         │
│   ├── Patch và update OS                                            │
│   ├── Monitor server health                                         │
│   ├── Trả tiền kể cả khi idle                                       │
│   └── Capacity planning (cần bao nhiêu servers?)                    │
│                                                                     │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐                               │
│   │ Server 1│ │ Server 2│ │ Server 3│   ← Bạn quản lý TẤT CẢ        │
│   │ (EC2)   │ │ (EC2)   │ │ (EC2)   │                               │
│   └─────────┘ └─────────┘ └─────────┘                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         SERVERLESS (Lambda)                         │
│                                                                     │
│   Bạn chỉ cần:                                                      │
│   └── Viết code và deploy                                           │
│                                                                     │
│   AWS lo:                                                           │
│   ├── Provision compute resources                                   │
│   ├── Auto-scale (từ 0 đến hàng ngàn concurrent executions)         │
│   ├── Patch và update                                               │
│   ├── High availability                                             │
│   └── Bạn chỉ trả tiền khi code chạy!                               │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              ☁️  AWS MANAGED INFRASTRUCTURE  ☁️               │   │
│   │                    (Bạn không thấy servers)                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### "Serverless" KHÔNG có nghĩa là không có servers!

```
HIỂU ĐÚNG VỀ SERVERLESS:
┌─────────────────────────────────────────────────────────────────────┐
│  "Serverless" = Servers less to manage (Ít servers phải quản lý)    │
│                                                                     │
│  Thực tế:                                                           │
│  ├── Servers VẪN TỒN TẠI (đâu đó trong AWS data centers)            │
│  ├── Nhưng BẠN KHÔNG BIẾT, KHÔNG THẤY, KHÔNG QUẢN LÝ                │
│  └── AWS quản lý hoàn toàn servers đó                               │
│                                                                     │
│   ❌ Bạn: Không SSH được vào Lambda                                 │
│   ❌ Bạn: Không biết Lambda chạy trên EC2 nào                       │
│   ✅ Bạn: Chỉ upload code và chạy                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Tại sao dùng Lambda?

| Mô hình truyền thống | AWS Lambda |
|---------------------|------------|
| ❌ Phải provision servers trước | ✅ Không cần provision |
| ❌ Trả tiền kể cả khi idle | ✅ Pay-per-execution (chỉ trả khi chạy) |
| ❌ Scale thủ công hoặc setup ASG | ✅ Auto-scale tự động (0 → ∞) |
| ❌ Quản lý patches, updates | ✅ AWS quản lý infrastructure |
| ❌ Capacity planning phức tạp | ✅ Không cần plan capacity |

---

## Kiến trúc AWS Lambda

### Các thành phần chính

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LAMBDA ARCHITECTURE                          │
│                                                                     │
│   TRIGGER/EVENT SOURCE           LAMBDA FUNCTION         DESTINATION│
│   ┌─────────────────┐           ┌─────────────────┐    ┌──────────┐ │
│   │ • API Gateway   │           │                 │    │ • S3     │ │
│   │ • S3 Events     │──────────▶│   Your Code     │───▶│ • DynamoDB│ │
│   │ • DynamoDB Strm │           │   (Handler)     │    │ • SNS    │ │
│   │ • SNS/SQS       │           │                 │    │ • SQS    │ │
│   │ • CloudWatch    │           └─────────────────┘    │ • other  │ │
│   │ • EventBridge   │                   │              └──────────┘ │
│   │ • Kinesis       │                   │                           │
│   │ • ALB           │           ┌───────▼───────┐                   │
│   └─────────────────┘           │ Execution Role│                   │
│                                 │ (IAM Permissions)│                  │
│                                 └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Lambda Function Anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│                       LAMBDA FUNCTION                               │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  CONFIGURATION                                              │   │
│   │  ├── Function name: my-function                             │   │
│   │  ├── Runtime: Python 3.12, Node.js 20.x, Java 21, etc.      │   │
│   │  ├── Memory: 128 MB - 10,240 MB (10 GB)                     │   │
│   │  ├── Timeout: 1 second - 15 minutes                         │   │
│   │  ├── Execution Role: IAM role cho permissions               │   │
│   │  └── Environment Variables                                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  CODE                                                       │   │
│   │                                                             │   │
│   │  # Python example                                           │   │
│   │  def handler(event, context):                               │   │
│   │      # event = input data từ trigger                        │   │
│   │      # context = runtime information                        │   │
│   │                                                             │   │
│   │      # Your business logic here                             │   │
│   │      result = process(event)                                │   │
│   │                                                             │   │
│   │      return {                                               │   │
│   │          'statusCode': 200,                                 │   │
│   │          'body': json.dumps(result)                         │   │
│   │      }                                                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  DEPENDENCIES                                               │   │
│   │  ├── Deployment Package (ZIP) ≤ 50 MB compressed            │   │
│   │  ├── Uncompressed: ≤ 250 MB                                 │   │
│   │  └── Lambda Layers (để chia sẻ libraries)                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lambda Execution Model

### Cold Start vs Warm Start

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COLD START ❄️                                │
│      (Lần đầu tiên hoặc sau thời gian idle)                         │
│                                                                     │
│  Request ─┬─▶ [Create Container] ─▶ [Download Code] ─▶ [Init Runtime]│
│           │         ↓                      ↓               ↓        │
│           │      ~100ms               ~50ms            ~200ms       │
│          │                                                          │
│           └───────────────────────────────────────────────────────▶ │
│                            Cold Start Latency: ~500ms - 3s+         │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. AWS tạo container/microVM mới                           │   │
│   │  2. Download code từ S3                                     │   │
│   │  3. Khởi tạo runtime (Python, Node.js, Java...)             │   │
│   │  4. Chạy initialization code (outside handler)              │   │
│   │  5. Execute handler function                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         WARM START 🔥                               │
│      (Container đã có sẵn từ request trước)                         │
│                                                                     │
│  Request ─────────────────────────────────────────────▶ [Handler]   │
│                                                                     │
│                          Warm Start Latency: ~1-10ms                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Container vẫn còn "warm" → AWS reuse container             │   │
│   │  → Skip initialization → Execute handler ngay               │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Giảm Cold Start

```
┌─────────────────────────────────────────────────────────────────────┐
│              STRATEGIES ĐỂ GIẢM COLD START                          │
│                                                                     │
│  1. PROVISIONED CONCURRENCY (Tốn tiền nhưng hiệu quả)               │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │  Giữ N instances luôn WARM và sẵn sàng                  │     │
│     │  → Cold start = 0                                       │     │
│     │  → Trả tiền để giữ instances luôn sẵn sàng              │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  2. OPTIMIZE CODE                                                   │
│     ├── Giảm deployment package size                                │
│     ├── Lazy loading dependencies                                   │
│     ├── Đưa initialization code ra ngoài handler                    │
│     └── Sử dụng lightweight runtime (Python, Node.js > Java)        │
│                                                                     │
│  3. USE SNAPSTART (Java only)                                       │
│     └── Snapshot memory state sau init → restore nhanh              │
│                                                                     │
│  4. KEEP FUNCTIONS WARM                                             │
│     └── Ping function định kỳ (CloudWatch Events/EventBridge)       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lambda Triggers (Event Sources)

### Các loại triggers phổ biến

```
┌─────────────────────────────────────────────────────────────────────┐
│                      LAMBDA TRIGGERS                                │
│                                                                     │
│   SYNCHRONOUS (Đợi response)                                        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌─────────────┐    ┌────────────┐    ┌─────────────────┐   │   │
│   │  │ API Gateway │───▶│   Lambda   │───▶│ Return Response │   │   │
│   │  │ ALB         │    │            │    │ (Wait for result)│  │   │
│   │  │ SDK Invoke  │    └────────────┘    └─────────────────┘   │   │
│   │  └─────────────┘                                            │   │
│   │                                                             │   │
│   │  Use case: REST APIs, real-time responses                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ASYNCHRONOUS (Fire-and-forget)                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌─────────────┐    ┌──────────┐    ┌────────────┐          │   │
│   │  │ S3 Events   │───▶│  Queue   │───▶│   Lambda   │          │   │
│   │  │ SNS         │    │ (internal)│    │            │         │   │
│   │  │ EventBridge │    └──────────┘    └────────────┘          │   │
│   │  └─────────────┘                                            │   │
│   │                                                             │   │
│   │  • Lambda tự retry khi fail (0, 1, 2 phút)                  │   │
│   │  • Có thể configure Dead Letter Queue (DLQ)                 │   │
│   │  Use case: Background processing, notifications             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   POLL-BASED (Lambda polls from source)                             │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ┌─────────────┐          ┌────────────┐                    │   │
│   │  │ SQS Queue   │◀─ Poll ─│   Lambda   │                     │   │
│   │  │ Kinesis     │          │            │                    │   │
│   │  │ DynamoDB    │          └────────────┘                    │   │
│   │  │ Streams     │                                            │   │
│   │  └─────────────┘                                            │   │
│   │                                                             │   │
│   │  • Lambda tự động poll và lấy messages/records              │   │
│   │  • Batching: xử lý nhiều records cùng lúc                   │   │
│   │  Use case: Stream processing, message queues                │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Ví dụ: S3 → Lambda

```
┌─────────────────────────────────────────────────────────────────────┐
│              USE CASE: Image Processing Pipeline                    │
│                                                                     │
│   User uploads         S3 triggers        Lambda creates            │
│   image to S3          Lambda              thumbnail                │
│        │                  │                   │                     │
│        ▼                  ▼                    ▼                    │
│   ┌─────────┐      ┌────────────┐      ┌─────────────┐              │
│   │ S3      │      │  Lambda    │      │ S3          │              │
│   │ bucket  │─────▶│  resize-   │─────▶│ thumbnails/ │              │
│   │ uploads/│      │  image     │      │ bucket      │              │
│   └─────────┘      └────────────┘      └─────────────┘              │
│                                                                     │
│   Event example:                                                    │
│   {                                                                 │
│     "Records": [{                                                   │
│       "eventName": "ObjectCreated:Put",                             │
│       "s3": {                                                       │
│         "bucket": { "name": "my-uploads" },                         │
│         "object": { "key": "photos/vacation.jpg" }                  │
│       }                                                             │
│     }]                                                              │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lambda Pricing

### Mô hình tính giá

```
┌─────────────────────────────────────────────────────────────────────┐
│                      LAMBDA PRICING MODEL                           │
│                                                                     │
│   Trả tiền theo:                                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. NUMBER OF REQUESTS                                      │   │
│   │     • $0.20 per 1 million requests                          │   │
│   │     • Free tier: 1 million requests/month                   │   │
│   │                                                             │   │
│   │  2. DURATION (GB-seconds)                                   │   │
│   │     • $0.0000166667 per GB-second                           │   │
│   │     • Free tier: 400,000 GB-seconds/month                   │   │
│   │                                                             │   │
│   │     Duration = Time your code runs                          │   │
│   │     GB-second = Memory allocated × Duration                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   EXAMPLE CALCULATION:                                              │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Function: 512 MB memory, runs 200ms, 1 million requests    │   │
│   │                                                             │   │
│   │  GB-seconds = 0.5 GB × 0.2s × 1,000,000 = 100,000 GB-s      │   │
│   │                                                             │   │
│   │  Cost = (100,000 × $0.0000166667) + (1M × $0.20/1M)         │   │
│   │       = $1.67 + $0.20                                       │   │
│   │       = $1.87/month                                         │   │
│   │                                                             │   │
│   │  So với EC2 t3.small chạy 24/7: ~$15/month                  │   │
│   │  → Lambda rẻ hơn 8x cho workload này!                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Khi nào Lambda KHÔNG rẻ hơn?

```
┌─────────────────────────────────────────────────────────────────────┐
│           LAMBDA VS EC2: KHI NÀO CHỌN CÁI NÀO?                      │
│                                                                     │
│              Requests/second                                        │
│                  │                                                  │
│   Lambda rẻ hơn   │             EC2 rẻ hơn                          │
│         ◀─────────┼─────────────▶                                   │
│                  │                                                  │
│    ┌───────────────┼────────────────────────────────────────────┐   │
│    │               │                                           │    │
│    │   LAMBDA      │          EC2/ECS                          │    │
│    │   ✓ Sporadic  │          ✓ Constant load                  │    │
│    │   ✓ Variable  │          ✓ High traffic                   │    │
│    │   ✓ Bursty    │          ✓ Long-running                   │    │
│    │   ✓ < 15min   │          ✓ > 15min jobs                   │    │
│    │               │                                           │    │
│    └───────────────┴────────────────────────────────────────────┘   │
│                  │                                                  │
│              Break-even point                                       │
│              (~1M requests/day                                      │
│               hoặc ~11 req/sec)                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lambda Security

### IAM Execution Role

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAMBDA EXECUTION ROLE                            │
│                                                                     │
│   Lambda function cần PERMISSIONS để truy cập AWS resources         │
│   → Gán IAM Role cho Lambda                                         │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    Lambda Function                          │   │
│   │                         │                                   │   │
│   │                         │ Assumes Role                      │   │
│   │                         ▼                                   │   │
│   │              ┌─────────────────────┐                        │   │
│   │              │   Execution Role    │                        │   │
│   │              │ (IAM Role)          │                        │   │
│   │              └──────────┬──────────┘                        │   │
│   │                         │                                   │   │
│   │            ┌────────────┼────────────┐                      │   │
│   │            ▼            ▼            ▼                      │   │
│   │      ┌─────────┐  ┌─────────┐  ┌─────────┐                  │   │
│   │      │ S3      │  │ DynamoDB│  │ Secrets │                  │   │
│   │      │ Access  │  │ Access  │  │ Manager │                  │   │
│   │      └─────────┘  └─────────┘  └─────────┘                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Trust Policy (ai được assume role):                               │
│   {                                                                 │
│     "Principal": {                                                  │
│       "Service": "lambda.amazonaws.com"                             │
│     },                                                              │
│     "Action": "sts:AssumeRole"                                      │
│   }                                                                 │
│                                                                     │
│   Permission Policy (được làm gì):                                  │
│   {                                                                 │
│     "Effect": "Allow",                                              │
│     "Action": ["s3:GetObject", "dynamodb:PutItem"],                 │
│     "Resource": ["arn:aws:s3:::my-bucket/*", ...]                   │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Resource-based Policy

```
┌─────────────────────────────────────────────────────────────────────┐
│                  RESOURCE-BASED POLICY                              │
│           (Ai được phép INVOKE Lambda này?)                         │
│                                                                     │
│   ┌─────────────┐      Invoke?      ┌────────────────┐              │
│   │ API Gateway │ ─────────────────▶│ Lambda         │              │
│   └─────────────┘                   │ Function       │              │
│                                     │                │              │
│   ┌─────────────┐      Invoke?      │ Resource Policy│              │
│   │ S3 Bucket   │ ─────────────────▶│ cho phép ai    │              │
│   └─────────────┘                   │ invoke?        │              │
│                                     └────────────────┘              │
│                                                                     │
│   Ví dụ Resource Policy:                                            │
│   {                                                                 │
│     "Effect": "Allow",                                              │
│     "Principal": {                                                  │
│       "Service": "s3.amazonaws.com"                                 │
│     },                                                              │
│     "Action": "lambda:InvokeFunction",                              │
│     "Resource": "arn:aws:lambda:...:my-function",                   │
│     "Condition": {                                                  │
│       "ArnLike": {                                                  │
│         "AWS:SourceArn": "arn:aws:s3:::my-bucket"                   │
│       }                                                             │
│     }                                                               │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lambda Networking

### Lambda trong VPC

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAMBDA NETWORKING MODES                          │
│                                                                     │
│   MODE 1: Default (No VPC)                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                         Internet                            │   │
│   │                            │                                │   │
│   │                     ┌──────▼──────┐                         │   │
│   │                     │   Lambda    │ ← Có Internet access    │   │
│   │                     │   Function  │ ← Gọi được AWS APIs     │   │
│   │                     └─────────────┘ ← KHÔNG access VPC      │   │
│   │                                       resources             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   MODE 2: VPC-enabled Lambda                                        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                           VPC                               │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │  Private Subnet                                      │  │   │
│   │   │  ┌───────────┐        ┌───────────┐                 │   │   │
│   │   │  │  Lambda   │───────▶│    RDS    │                 │   │   │
│   │   │  │  (ENI)    │        │ (Private) │                 │   │   │
│   │   │  └───────────┘        └───────────┘                 │   │   │
│   │   │       │                                              │  │   │
│   │   │       │ Cần NAT Gateway                              │  │   │
│   │   │       │ để access Internet                           │  │   │
│   │   │       ▼                                              │  │   │
│   │   │  ┌───────────┐     ┌───────────┐                    │   │   │
│   │   │  │    NAT    │────▶│  Internet │                    │   │   │
│   │   │  │  Gateway  │     │  Gateway  │────▶ Internet      │   │   │
│   │   │  └───────────┘     └───────────┘                    │   │   │
│   │   └─────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ⚠️ VPC Lambda trước đây có cold start lâu (~10s) do phải tạo ENI   │
│   ✅ Từ 2019: AWS Hyperplane cải thiện xuống còn ~1s                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lambda Limits và Best Practices

### Limits quan trọng

```
┌─────────────────────────────────────────────────────────────────────┐
│                       LAMBDA LIMITS                                 │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  EXECUTION                                                  │   │
│   │  ├── Max timeout: 15 minutes                                │   │
│   │  ├── Max memory: 10,240 MB (10 GB)                          │   │
│   │  ├── Max concurrent executions: 1000 (default, có thể tăng) │   │
│   │  └── /tmp storage: 512 MB - 10,240 MB                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  DEPLOYMENT                                                 │   │
│   │  ├── Deployment package (ZIP): 50 MB compressed             │   │
│   │  ├── Uncompressed: 250 MB                                   │   │
│   │  ├── Container image: 10 GB                                 │   │
│   │  └── Environment variables: 4 KB total                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  PAYLOAD                                                    │   │
│   │  ├── Synchronous (RequestResponse): 6 MB                    │   │
│   │  └── Asynchronous (Event): 256 KB                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Best Practices

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAMBDA BEST PRACTICES                            │
│                                                                     │
│  1. KEEP FUNCTIONS SMALL & FOCUSED                                  │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │  ❌ 1 function làm: validate → process → save → notify  │     │
│     │  ✅ Tách thành nhiều functions nhỏ, mỗi cái 1 việc      │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  2. INITIALIZE OUTSIDE HANDLER                                      │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │  # ✅ ĐÚNG: Initialize một lần, reuse nhiều lần         │     │
│     │  import boto3                                           │     │
│     │  db_client = boto3.client('dynamodb')  # Outside        │     │
│     │                                                         │     │
│     │  def handler(event, context):                           │     │
│     │      db_client.put_item(...)  # Reuse connection        │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  3. USE ENVIRONMENT VARIABLES FOR CONFIG                            │
│     ┌─────────────────────────────────────────────────────────┐     │
│     │  DB_NAME = os.environ['DB_NAME']                        │     │
│     │  API_KEY = os.environ['API_KEY']  # Từ Secrets Manager  │     │
│     └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│  4. HANDLE ERRORS GRACEFULLY                                        │
│     ├── Log errors to CloudWatch                                    │
│     ├── Use Dead Letter Queue (DLQ) for async                       │
│     └── Return proper error responses                               │
│                                                                     │
│  5. RIGHT-SIZE MEMORY                                               │
│     ├── More memory = More CPU = Faster execution                   │
│     ├── Sweet spot: thử nghiệm với AWS Lambda Power Tuning          │
│     └── Đôi khi tăng memory → giảm duration → giảm cost!            │
└─────────────────────────────────────────────────────────────────────┘
```

### Khi Lambda chạy quá 15 phút (Timeout)

Nếu Lambda chạy quá **15 phút**, function sẽ bị **terminate** ngay lập tức. Đây là **hard limit** không thể thay đổi.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAMBDA 15-MINUTE TIMEOUT                         │
│                                                                     │
│   Lambda bắt đầu                                             ⚠️ FAIL │
│        │                                                      │     │
│        ▼                                                       ▼    │
│   ─────●───────────────────────────────────────────────────────●─────│
│        0 min                                              15 min    │
│                                                                     │
│   Điều gì xảy ra khi timeout:                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Function bị TERMINATE ngay lập tức                       │   │
│   │  • Error: "Task timed out after 900.00 seconds"             │   │
│   │  • KHÔNG có graceful shutdown                               │   │
│   │  • Data đang xử lý có thể bị MẤT nếu chưa save              │   │
│   │  • CloudWatch logs ghi nhận timeout event                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Giải pháp thay thế cho Long-running Tasks

```
┌─────────────────────────────────────────────────────────────────────┐
│              ALTERNATIVES FOR LONG-RUNNING TASKS                    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. CHUNKING (Chia nhỏ công việc)                           │   │
│   │                                                             │   │
│   │     ❌ Before: Lambda → Process 1M records → TIMEOUT!       │   │
│   │                                                             │   │
│   │     ✅ After:  Lambda 1 → 10K records → Done                │   │
│   │               Lambda 2 → 10K records → Done                 │   │
│   │               ...                                           │   │
│   │               Lambda 100 → 10K records → Done               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  2. STEP FUNCTIONS (Orchestration)                          │   │
│   │                                                             │   │
│   │     ┌──────────┐    ┌──────────┐    ┌──────────┐            │   │
│   │     │ Lambda 1 │───▶│ Lambda 2 │───▶│ Lambda 3 │            │   │
│   │     │ (10 min) │    │ (10 min) │    │ (10 min) │            │   │
│   │     └──────────┘    └──────────┘    └──────────┘            │   │
│   │                                                             │   │
│   │     Tổng: 30 phút, mỗi Lambda < 15 phút!                    │   │
│   │     Step Functions có thể chạy tới 1 NĂM!                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  3. FARGATE (Serverless Containers)                         │   │
│   │                                                             │   │
│   │     • Không giới hạn thời gian chạy                         │   │
│   │     • Vẫn serverless (không quản lý EC2)                    │   │
│   │     • Pay per vCPU + memory used                            │   │
│   │     • Best for: Jobs cần 15 min - vài giờ                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  4. AWS BATCH (Large Batch Processing)                      │   │
│   │                                                             │   │
│   │     • Không giới hạn thời gian                              │   │
│   │     • Tự động scale compute resources                       │   │
│   │     • Queue-based job scheduling                            │   │
│   │     • Dùng EC2 Spot Instances → tiết kiệm ~70% cost         │   │
│   │     • Best for: ETL, ML training, video processing          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  5. RECURSIVE LAMBDA (Tự gọi lại)                           │   │
│   │                                                             │   │
│   │     Lambda → Process batch → Check remaining time           │   │
│   │                                   │                         │   │
│   │                            ┌──────┴──────┐                  │   │
│   │                            ▼             ▼                  │   │
│   │                      Time left?    No time left?            │   │
│   │                            │             │                  │   │
│   │                      Continue      Invoke new Lambda        │   │
│   │                      processing    with remaining items     │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Recursive Lambda Pattern (Code Example)

```python
# recursive_processor.py
import boto3
import json

lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    """
    Lambda tự gọi lại chính nó khi gần hết thời gian
    """
    items = event.get('items', [])
    processed = event.get('processed', 0)
    
    while items:
        # Kiểm tra còn đủ thời gian không (dành 30s buffer)
        remaining_time = context.get_remaining_time_in_millis()
        
        if remaining_time < 30000:  # < 30 seconds left
            # Gọi Lambda mới để tiếp tục xử lý
            lambda_client.invoke(
                FunctionName=context.function_name,
                InvocationType='Event',  # Async invocation
                Payload=json.dumps({
                    'items': items,
                    'processed': processed
                })
            )
            return {
                'status': 'continuing',
                'processed': processed,
                'remaining': len(items)
            }
        
        # Xử lý item
        item = items.pop(0)
        process_item(item)  # Your processing logic
        processed += 1
    
    return {
        'status': 'complete',
        'total_processed': processed
    }

def process_item(item):
    # Your actual processing logic here
    pass
```

### So sánh các giải pháp

```
┌─────────────────────────────────────────────────────────────────────┐
│              COMPARISON: LONG-RUNNING TASK SOLUTIONS                │
│                                                                     │
│   ┌──────────────┬───────────┬───────────┬───────────┬───────────┐  │
│   │   Solution   │ Max Time  │Complexity │   Cost    │ Best For  │  │
│   ├──────────────┼───────────┼───────────┼───────────┼───────────┤  │
│   │ Lambda       │ 15 min    │   Low     │   Low     │ Short     │  │
│   │              │           │           │           │ tasks     │  │
│   ├──────────────┼───────────┼───────────┼───────────┼───────────┤  │
│   │ Step         │ 1 year    │  Medium   │  Medium   │ Workflows │  │
│   │ Functions    │           │           │           │ chains    │  │
│   ├──────────────┼───────────┼───────────┼───────────┼───────────┤  │
│   │ Fargate      │ Unlimited │  Medium   │  Medium   │ Long      │  │
│   │              │           │           │           │ containers│  │
│   ├──────────────┼───────────┼───────────┼───────────┼───────────┤  │
│   │ AWS Batch    │ Unlimited │   High    │ Low(Spot) │ Large     │  │
│   │              │           │           │           │ batch     │  │
│   ├──────────────┼───────────┼───────────┼───────────┼───────────┤  │
│   │ EC2          │ Unlimited │   High    │   High    │ Full      │  │
│   │              │           │           │           │ control   │  │
│   └──────────────┴───────────┴───────────┴───────────┴───────────┘  │
│                                                                     │
│   DECISION GUIDE:                                                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Task duration         → Best solution                      │   │
│   │  ───────────────────────────────────────────────────────    │   │
│   │  < 15 minutes          → Lambda ✅                          │   │
│   │  15 - 30 minutes       → Step Functions + Multiple Lambdas  │   │
│   │  30 min - vài giờ     → Fargate hoặc AWS Batch              │   │
│   │  Cần chạy liên tục    → ECS/EKS                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lambda Layers

### Lambda Layers là gì?

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LAMBDA LAYERS                                │
│                                                                     │
│   Layer = ZIP archive chứa libraries, dependencies, custom runtime  │
│   → Chia sẻ code/dependencies giữa nhiều functions                  │
│                                                                     │
│   WITHOUT LAYERS:                                                   │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  Function A          Function B          Function C        │    │
│   │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │    │
│   │  │ Your Code    │   │ Your Code    │   │ Your Code    │    │    │
│   │  │ + numpy      │   │ + numpy      │   │ + numpy      │    │    │
│   │  │ + pandas     │   │ + pandas     │   │ + pandas     │    │    │
│   │  │ + requests   │   │ + requests   │   │ + requests   │    │    │
│   │  │ (50 MB each) │   │ (50 MB each) │   │ (50 MB each) │    │    │
│   │  └──────────────┘   └──────────────┘   └──────────────┘    │    │
│   │                                                            │    │
│   │  Total: 150 MB duplicated libraries!                       │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│   WITH LAYERS:                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  Function A          Function B          Function C        │    │
│   │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │    │
│   │  │ Your Code    │   │ Your Code    │   │ Your Code    │    │    │
│   │  │ (1 MB)       │   │ (1 MB)       │   │ (1 MB)       │    │    │
│   │  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘    │    │
│   │         │                  │                  │            │    │
│   │         └──────────────────┼──────────────────┘            │    │
│   │                            ▼                               │    │
│   │              ┌──────────────────────────┐                  │    │
│   │              │    DATA SCIENCE LAYER    │                  │    │
│   │              │    numpy, pandas, etc.   │                  │    │
│   │              │    (50 MB - shared)      │                  │    │
│   │              └──────────────────────────┘                  │    │
│   │                                                            │    │
│   │  Total: 53 MB (3 + 50)                                     │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│   Benefits:                                                         │
│   ├── Reduce deployment package size                                │
│   ├── Share common dependencies                                     │
│   ├── Separate logic from dependencies                              │
│   └── Faster deployments (code changes only)                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Serverless Application Patterns

### Pattern 1: REST API

```
┌─────────────────────────────────────────────────────────────────────┐
│              PATTERN: Serverless REST API                           │
│                                                                     │
│   Client                                                            │
│   │                                                                 │
│     │ HTTPS                                                         │
│     ▼                                                               │
│   ┌─────────────────┐                                               │
│   │   API Gateway   │ ← REST API endpoint                           │
│   │   (HTTPS)       │ ← Authentication (Cognito, API Keys)          │
│   └────────┬────────┘ ← Rate limiting, caching                      │
│          │                                                          │
│      ┌─────┴─────┬─────────────┐                                    │
│      ▼           ▼             ▼                                    │
│  ┌───────┐  ┌───────┐    ┌───────┐                                  │
│  │Lambda │  │Lambda │    │Lambda │                                  │
│  │ GET   │  │ POST  │    │DELETE │                                  │
│  │/users │  │/users │    │/users │                                  │
│  └───┬───┘  └───┬───┘    └───┬───┘                                  │
│      │          │           │                                       │
│      └──────────┼──────────────┘                                    │
│                 ▼                                                   │
│         ┌─────────────┐                                             │
│         │  DynamoDB   │ ← NoSQL database                            │
│         └─────────────┘                                             │
│                                                                     │
│   Cost: Chỉ trả tiền khi có request!                                │
│   Scale: Tự động từ 0 → millions requests                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Pattern 2: Event Processing

```
┌─────────────────────────────────────────────────────────────────────┐
│           PATTERN: Event-Driven Processing                          │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     Event Sources                           │   │
│   │                                                             │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │
│   │  │   S3    │  │   SQS   │  │  SNS    │  │Kinesis  │         │   │
│   │  │ Upload  │  │ Message │  │ Notif.  │  │ Stream  │         │   │
│   │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘         │   │
│   │       │            │            │            │              │   │
│   └───────┼────────────┼────────────┼────────────┼──────────────┘   │
│           │            │            │           │                   │
│           └────────────┴─────┬──────┴────────────┘                  │
│                              ▼                                      │
│                    ┌──────────────────┐                             │
│                    │   EventBridge    │ ← Central event bus         │
│                    └────────┬─────────┘                             │
│                            │                                        │
│              ┌──────────────┼──────────────┐                        │
│              ▼              ▼              ▼                        │
│         ┌────────┐    ┌────────┐    ┌────────┐                      │
│         │Lambda  │    │Lambda  │    │Lambda  │                      │
│         │Process │    │Archive │    │Notify  │                      │
│         └────────┘    └────────┘    └────────┘                      │
│                                                                     │
│   Benefits:                                                         │
│   ├── Decoupled components                                          │
│   ├── Async processing                                              │
│   └── Easy to add new processors                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Pattern 3: Scheduled Jobs

```
┌─────────────────────────────────────────────────────────────────────┐
│              PATTERN: Scheduled/Cron Jobs                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    EventBridge Scheduler                    │   │
│   │                                                             │   │
│   │    ┌────────────────────────────────────────────────────┐   │   │
│   │    │  Schedule Expression:                               │  │   │
│   │    │  • rate(5 minutes)     → Mỗi 5 phút               │    │   │
│   │    │  • rate(1 hour)        → Mỗi giờ                  │    │   │
│   │    │  • cron(0 9 * * ? *)   → Mỗi ngày 9AM UTC         │    │   │
│   │    │  • cron(0 0 1 * ? *)   → Ngày 1 mỗi tháng         │    │   │
│   │    └────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────┬───────────────────────────┘   │
│                                    │                                │
│                                     ▼                               │
│                            ┌──────────────┐                         │
│                            │   Lambda     │                         │
│                            │              │                         │
│                            └──────┬───────┘                         │
│                                  │                                  │
│              ┌────────────────────┼────────────────────┐            │
│              ▼                    ▼                    ▼            │
│        ┌──────────┐        ┌──────────┐        ┌──────────┐         │
│        │ Cleanup  │        │ Reports  │        │  Sync    │         │
│        │ old data │        │ generate │        │  data    │         │
│        └──────────┘        └──────────┘        └──────────┘         │
│                                                                     │
│   Use cases:                                                        │
│   ├── Daily reports                                                 │
│   ├── Data cleanup/archival                                         │
│   ├── Sync with external systems                                    │
│   └── Health checks                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lambda vs ECS vs EKS

### So sánh tổng quan

```
┌─────────────────────────────────────────────────────────────────────┐
│               LAMBDA vs ECS vs EKS: KHI NÀO DÙNG GÌ?                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  LAMBDA                                                     │   │
│   │  ├── Max execution: 15 minutes                              │   │
│   │  ├── Short-lived, event-driven tasks                        │   │
│   │  ├── Auto-scale to zero                                     │   │
│   │  ├── No server management                                   │   │
│   │  └── Pay per execution                                      │   │
│   │                                                             │   │
│   │  Best for:                                                  │   │
│   │  • API backends                                             │   │
│   │  • Data processing                                          │   │
│   │  • Scheduled tasks                                          │   │
│   │  • Event handlers                                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ECS (Elastic Container Service)                            │   │
│   │  ├── Long-running containers                                │   │
│   │  ├── More control over infrastructure                       │   │
│   │  ├── Consistent performance                                 │   │
│   │  └── Fargate = serverless containers                        │   │
│   │                                                             │   │
│   │  Best for:                                                  │   │
│   │  • Web applications                                         │   │
│   │  • Microservices                                            │   │
│   │  • Batch processing                                         │   │
│   │  • Background workers                                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  EKS (Elastic Kubernetes Service)                           │   │
│   │  ├── Full Kubernetes                                        │   │
│   │  ├── Portable across clouds                                 │   │
│   │  ├── Maximum flexibility                                    │   │
│   │  └── Complex but powerful                                   │   │
│   │                                                             │   │
│   │  Best for:                                                  │   │
│   │  • Complex microservices                                    │   │
│   │  • Multi-cloud strategy                                     │   │
│   │  • Team already knows K8s                                   │   │
│   │  • Need advanced scheduling                                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Decision Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPUTE SERVICE DECISION TREE                    │
│                                                                     │
│                         Start Here                                  │
│                           │                                         │
│              ┌──────────────┴──────────────┐                        │
│              ▼                             ▼                        │
│    Runs < 15 minutes?              Runs longer?                     │
│              │                            │                         │
│       ┌──────┴──────┐              ┌───────┴───────┐                │
│       ▼             ▼              ▼               ▼                │
│   Event-driven? Always running?  Need K8s?    Just containers?      │
│       │             │              │               │                │
│       ▼             │              ▼               ▼                │
│   ┌───────┐         │          ┌───────┐     ┌──────────┐           │
│   │LAMBDA │         │          │  EKS  │     │   ECS    │           │
│   └───────┘         │          └───────┘     │(Fargate) │           │
│                     │                        └──────────┘           │
│                     ▼                                               │
│              Need to manage                                         │
│              servers yourself?                                      │
│                    │                                                │
│           ┌────────┴────────┐                                       │
│           ▼                 ▼                                       │
│       ┌─────────────┐              ┌───────────────┐                │
│       │ECS (EC2)    │              │ Fargate       │                │
│       │Full ctrl    │              │Serverless     │                │
│       └─────────────┘              └───────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Hands-on Examples

### Example 1: Simple Lambda Function (Python)

```python
# lambda_function.py
import json
import boto3
import os

# Initialize OUTSIDE handler (for warm starts)
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'users')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Simple CRUD handler for users
    
    Event structure (from API Gateway):
    {
        "httpMethod": "GET",
        "pathParameters": {"user_id": "123"},
        "body": "{\"name\": \"John\"}"
    }
    """
    http_method = event.get('httpMethod', 'GET')
    
    try:
        if http_method == 'GET':
            user_id = event['pathParameters']['user_id']
            response = table.get_item(Key={'user_id': user_id})
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(response.get('Item', {}))
            }
        
        elif http_method == 'POST':
            body = json.loads(event['body'])
            table.put_item(Item=body)
            return {
                'statusCode': 201,
                'body': json.dumps({'message': 'User created'})
            }
        
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Method not supported'})
            }
            
    except Exception as e:
        print(f"Error: {str(e)}")  # Goes to CloudWatch Logs
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

### Example 2: S3 Event Handler

```python
# image_processor.py
import boto3
import os
from PIL import Image
import io

s3 = boto3.client('s3')
THUMBNAIL_SIZE = (128, 128)
OUTPUT_BUCKET = os.environ['OUTPUT_BUCKET']

def lambda_handler(event, context):
    """
    Triggered when image uploaded to S3
    Creates thumbnail and saves to output bucket
    """
    for record in event['Records']:
        # Get bucket and key from S3 event
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Skip if not an image
        if not key.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        
        # Download image
        response = s3.get_object(Bucket=bucket, Key=key)
        image_content = response['Body'].read()
        
        # Create thumbnail
        image = Image.open(io.BytesIO(image_content))
        image.thumbnail(THUMBNAIL_SIZE)
        
        # Save to buffer
        buffer = io.BytesIO()
        image.save(buffer, 'JPEG')
        buffer.seek(0)
        
        # Upload thumbnail
        thumbnail_key = f"thumbnails/{key}"
        s3.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=thumbnail_key,
            Body=buffer,
            ContentType='image/jpeg'
        )
        
        print(f"Created thumbnail: {thumbnail_key}")
    
    return {'statusCode': 200}
```

### Example 3: Scheduled Job

```python
# daily_report.py
import boto3
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
ses = boto3.client('ses')

def lambda_handler(event, context):
    """
    Triggered daily by EventBridge
    Generates and sends daily metrics report
    """
    # Get yesterday's date
    yesterday = datetime.now() - timedelta(days=1)
    
    # Get metrics from CloudWatch
    response = cloudwatch.get_metric_statistics(
        Namespace='AWS/Lambda',
        MetricName='Invocations',
        StartTime=yesterday,
        EndTime=datetime.now(),
        Period=86400,
        Statistics=['Sum']
    )
    
    invocations = response['Datapoints'][0]['Sum'] if response['Datapoints'] else 0
    
    # Send email report
    ses.send_email(
        Source='reports@mycompany.com',
        Destination={'ToAddresses': ['team@mycompany.com']},
        Message={
            'Subject': {'Data': f'Daily Report - {yesterday.date()}'},
            'Body': {
                'Text': {'Data': f'Total Lambda invocations: {invocations}'}
            }
        }
    )
    
    return {'report_sent': True}
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────────┐
│                       LAMBDA KEY POINTS                             │
│                                                                     │
│  1. SERVERLESS ≠ NO SERVERS                                         │
│     → Servers vẫn có, AWS quản lý hoàn toàn                         │
│                                                                     │
│  2. PAY-PER-USE                                                     │
│     → Chỉ trả tiền khi code chạy (requests + duration)              │
│     → Perfect cho workloads sporadic/variable                       │
│                                                                     │
│  3. AUTO-SCALING                                                    │
│     → Scale từ 0 đến thousands concurrent executions                │
│     → Không cần configure ASG                                       │
│                                                                     │
│  4. EVENT-DRIVEN                                                    │
│     → Nhiều triggers: API Gateway, S3, SQS, SNS, EventBridge...     │
│     → Perfect cho event-driven architectures                        │
│                                                                     │
│  5. LIMITS TO REMEMBER                                              │
│     → Max timeout: 15 minutes                                       │
│     → Max memory: 10 GB                                             │
│     → Payload: 6 MB sync, 256 KB async                              │
│                                                                     │
│  6. COLD START                                                      │
│     → First invocation = slower                                     │
│     → Use Provisioned Concurrency for latency-sensitive apps        │
│                                                                     │
│  7. WHEN TO USE LAMBDA                                              │
│     ✅ Short-running tasks (< 15 min)                               │
│     ✅ Variable/sporadic traffic                                    │
│     ✅ Event-driven processing                                      │
│     ❌ Long-running processes                                       │
│     ❌ Constant high traffic (có thể tốn hơn EC2)                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Các dịch vụ Serverless khác của AWS (Chi tiết)

### Tổng quan Serverless Ecosystem

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AWS SERVERLESS ECOSYSTEM                         │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                        COMPUTE                              │   │
│   │   ┌───────────┐  ┌───────────┐  ┌───────────┐               │   │
│   │   │  Lambda   │  │  Fargate  │  │ App Runner│               │   │
│   │   │ Functions │  │ Containers│  │   Apps    │               │   │
│   │   └───────────┘  └───────────┘  └───────────┘               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                       DATA STORES                           │   │
│   │   ┌───────────┐  ┌───────────┐  ┌───────────┐               │   │
│   │   │ DynamoDB  │  │    S3     │  │  Aurora   │               │   │
│   │   │   NoSQL   │  │  Objects  │  │ Serverless│               │   │
│   │   └───────────┘  └───────────┘  └───────────┘               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                   API & INTEGRATION                         │   │
│   │   ┌───────────┐  ┌───────────┐  ┌───────────┐               │   │
│   │   │    API    │  │ EventBrdg │  │  AppSync  │               │   │
│   │   │  Gateway  │  │  Events   │  │  GraphQL  │               │   │
│   │   └───────────┘  └───────────┘  └───────────┘               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      MESSAGING                              │   │
│   │   ┌───────────┐  ┌───────────┐  ┌───────────┐               │   │
│   │   │    SQS    │  │    SNS    │  │  Kinesis  │               │   │
│   │   │   Queue   │  │   Topics  │  │  Streams  │               │   │
│   │   └───────────┘  └───────────┘  └───────────┘               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                   ORCHESTRATION                             │   │
│   │   ┌───────────┐  ┌───────────┐                              │   │
│   │   │   Step    │  │ EventBrdg │                              │   │
│   │   │ Functions │  │ Scheduler │                              │   │
│   │   └───────────┘  └───────────┘                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 1. API Gateway

**Amazon API Gateway** - Dịch vụ fully managed để tạo, publish, maintain, monitor, và secure APIs.

> 📚 **Xem chi tiết:** [API Gateway Documentation](./api-gateway.md)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  3 LOẠI API:                                                │   │
│   │                                                             │   │
│   │  1. REST API (Regional/Edge-optimized/Private)              │   │
│   │     ├── Full-featured, caching, request validation          │   │
│   │     └── API keys, usage plans, throttling                   │   │
│   │                                                             │   │
│   │  2. HTTP API (Mới hơn, rẻ hơn 70%)                          │   │
│   │     ├── Simpler, lower latency                              │   │
│   │     ├── OIDC/OAuth 2.0 built-in                             │   │
│   │     └── Best for Lambda/HTTP proxies                        │   │
│   │                                                             │   │
│   │  3. WebSocket API                                           │   │
│   │     ├── Real-time two-way communication                     │   │
│   │     └── Chat apps, live dashboards, gaming                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ARCHITECTURE:                                                     │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │                                                           │     │
│   │   Client     API Gateway            Backend               │     │
│   │     │            │                     │                  │     │
│   │     │  Request   │                     │                  │     │
│   │     │───────────▶│                     │                  │     │
│   │     │            │ • Authentication    │                  │     │
│   │     │            │ • Rate Limiting     │                  │     │
│   │     │            │ • Caching           │                  │     │
│   │     │            │ • Request Transform │                  │     │
│   │     │            │                     │                  │     │
│   │     │            │────────────────────▶│ Lambda/EC2/HTTP  │     │
│   │     │            │                     │                  │     │
│   │     │            │◀────────────────────│                  │     │
│   │     │◀───────────│                     │                  │     │
│   │     │  Response  │                     │                  │     │
│   │                                                           │     │
│   └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ use case:**
```
┌────────────────────────────────────────────────────────────────────┐
│  USE CASE: E-commerce API                                          │
│                                                                    │
│   https://api.myshop.com                                           │
│           │                                                        │
│            ▼                                                       │
│   ┌─────────────────┐                                              │
│   │   API Gateway   │                                              │
│   └────────┬────────┘                                              │
│           │                                                        │
│   ┌────────┼────────┬───────────────┐                              │
│   │        │        │               │                              │
│   ▼        ▼        ▼               ▼                              │
│ /products /orders /users         /payments                         │
│    │        │       │               │                              │
│    ▼        ▼       ▼               ▼                              │
│ Lambda   Lambda  Cognito      Third-party                          │
│ + DDB    + DDB   Authorizer   Payment API                          │
│                                                                    │
│  Features:                                                         │
│  • Rate limiting: 1000 req/s per client                            │
│  • Caching: GET /products cached 5 mins                            │
│  • Auth: JWT tokens via Cognito                                    │
│  • Throttling: Prevent abuse                                       │
└────────────────────────────────────────────────────────────────────┘
```

---

### 2. DynamoDB

**Amazon DynamoDB** - Serverless NoSQL database với single-digit millisecond performance.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DYNAMODB                                   │
│                                                                     │
│   ĐẶC ĐIỂM CHÍNH:                                                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ✅ Fully managed - không cần quản lý servers               │   │
│   │  ✅ Automatic scaling - capacity tự động điều chỉnh         │   │
│   │  ✅ Single-digit ms latency - nhanh như chớp                │   │
│   │  ✅ Built-in security - encryption at rest/in transit       │   │
│   │  ✅ Global Tables - multi-region replication                │   │
│   │  ✅ Point-in-time recovery - backup tự động                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   DATA MODEL:                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                         TABLE                               │   │
│   │  ┌───────────────────────────────────────────────────────┐  │   │
│   │  │ Partition Key │ Sort Key    │ Attributes...           │  │   │
│   │  ├───────────────┼─────────────┼─────────────────────────┤  │   │
│   │  │ user_123      │ order_001   │ {total: 150, items: []} │  │   │
│   │  │ user_123      │ order_002   │ {total: 85, items: []}  │  │   │
│   │  │ user_456      │ order_001   │ {total: 200, items: []} │  │   │
│   │  └───────────────┴─────────────┴─────────────────────────┘  │   │
│   │                                                             │   │
│   │  • Partition Key = tìm partition nào chứa data              │   │
│   │  • Sort Key = sắp xếp items trong partition                 │   │
│   │  • Attributes = schema-less, flexible                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   CAPACITY MODES:                                                   │
│   ┌──────────────────────────┬──────────────────────────────────┐   │
│   │      ON-DEMAND           │        PROVISIONED               │   │
│   │  (Pay-per-request)       │    (Reserved capacity)           │   │
│   │                          │                                  │   │
│   │  ✅ Unpredictable load   │  ✅ Predictable workload         │   │
│   │  ✅ Auto scales          │  ✅ Giá rẻ hơn ~70%              │   │
│   │  ✅ No capacity plan     │  ✅ Consistent performance       │   │
│   │  ❌ Đắt hơn nếu load cao │  ❌ Cần planning                 │   │
│   └──────────────────────────┴──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ:**
```python
# DynamoDB với Lambda
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Orders')

def lambda_handler(event, context):
    # Ghi order
    table.put_item(Item={
        'user_id': 'user_123',
        'order_id': 'order_001',
        'total': 150.00,
        'status': 'pending',
        'created_at': '2024-01-27T10:00:00Z'
    })
    
    # Query tất cả orders của user
    response = table.query(
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': 'user_123'}
    )
    
    return response['Items']
```

---

### 📧 3. SNS (Simple Notification Service)

**Amazon SNS** - Serverless pub/sub messaging service.

```
┌─────────────────────────────────────────────────────────────────────┐
│                              SNS                                    │
│                  (Publish/Subscribe Messaging)                      │
│                                                                     │
│   CONCEPT: 1 message → gửi tới NHIỀU subscribers                    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │     Publisher                    Subscribers                │   │
│   │         │                                                   │   │
│   │         │         ┌──────────┐                              │   │
│   │         │         │   SNS    │                              │   │
│   │         └────────▶│  TOPIC   │──────┬──────┬──────┬────────▶│   │
│   │                   │          │      │      │      │         │   │
│   │                   └──────────┘      │      │      │         │   │
│   │                                     ▼      ▼      ▼         │   │
│   │                                  ┌─────┐ ┌─────┐ ┌─────┐    │   │
│   │                                  │Lambda│ │ SQS │ │Email│   │   │
│   │                                  └─────┘ └─────┘ └─────┘    │   │
│   │                                                             │   │
│   │   Supported Subscribers:                                    │   │
│   │   • Lambda functions                                        │   │
│   │   • SQS queues                                              │   │
│   │   • HTTP/HTTPS endpoints                                    │   │
│   │   • Email/Email-JSON                                        │   │
│   │   • SMS                                                     │   │
│   │   • Mobile push (iOS, Android)                              │   │
│   │   • Kinesis Data Firehose                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ use case:**
```
┌────────────────────────────────────────────────────────────────────┐
│  USE CASE: Order Notification System                               │
│                                                                    │
│           Order placed                                             │
│              │                                                     │
│               ▼                                                    │
│        ┌─────────────┐                                             │
│        │ order-topic │                                             │
│        └──────┬──────┘                                             │
│              │                                                     │
│   ┌───────────┼───────────┬───────────────┐                        │
│   │           │           │               │                        │
│   ▼           ▼           ▼               ▼                        │
│ Lambda     Lambda      Lambda          Email                       │
│ Update     Send        Analytics        to                         │
│ Inventory  Email       Processing      Admin                       │
│                                                                    │
│  → 1 event kích hoạt 4 actions song song!                          │
└────────────────────────────────────────────────────────────────────┘
```

---

### 📬 4. SQS (Simple Queue Service)

**Amazon SQS** - Serverless message queue service.

```
┌─────────────────────────────────────────────────────────────────────┐
│                              SQS                                    │
│                    (Message Queue Service)                          │
│                                                                     │
│   CONCEPT: Decouple producers và consumers                          │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   Producer           Queue              Consumer            │   │
│   │                                                             │   │
│   │  ┌───────┐      ┌───────────────┐      ┌───────────┐        │   │
│   │  │ App A │─────▶│ ■ ■ ■ ■ ■ ■ │─────▶│ Lambda/   │          │   │
│   │  └───────┘      │ (messages)    │      │ Worker    │        │   │
│   │                 └───────────────┘      └───────────┘        │   │
│   │                                                             │   │
│   │   Producer gửi     Messages chờ     Consumer xử lý          │   │
│   │   nhanh chóng      trong queue       theo tốc độ riêng      │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   2 LOẠI QUEUE:                                                     │
│   ┌─────────────────────────────┬───────────────────────────────┐   │
│   │       STANDARD              │            FIFO               │   │
│   │                             │    (First-In-First-Out)       │   │
│   │                             │                               │   │
│   │  ✅ Unlimited throughput    │  ✅ Order guaranteed          │   │
│   │  ✅ At-least-once delivery  │  ✅ Exactly-once processing   │   │
│   │  ❌ Order not guaranteed    │  ❌ 3000 msg/s (with batch)   │   │
│   │                             │                               │   │
│   │  Use: Thumbnails, logs      │  Use: Orders, payments        │   │
│   └─────────────────────────────┴───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**SNS + SQS Pattern (Fan-out):**
```
┌────────────────────────────────────────────────────────────────────┐
│  PATTERN: SNS + SQS Fan-out                                        │
│                                                                    │
│                    ┌─────────────┐                                 │
│                    │  SNS Topic  │                                 │
│                    └──────┬──────┘                                 │
│                          │                                         │
│           ┌───────────────┼───────────────┐                        │
│           │               │               │                        │
│           ▼               ▼               ▼                        │
│      ┌─────────┐    ┌─────────┐    ┌─────────┐                     │
│      │  SQS 1  │    │  SQS 2  │    │  SQS 3  │                     │
│      │ Email Q │    │ Analytics│    │ Archive│                     │
│      └────┬────┘    └────┬────┘    └────┬────┘                     │
│           │              │              │                          │
│           ▼              ▼              ▼                          │
│       Lambda 1      Lambda 2       Lambda 3                        │
│       send email    process data   store S3                        │
│                                                                    │
│  Lợi ích:                                                          │
│  • Mỗi consumer xử lý độc lập                                      │
│  • Retry riêng biệt nếu fail                                       │
│  • Scale từng queue riêng                                          │
└────────────────────────────────────────────────────────────────────┘
```

---

### 5. EventBridge

**Amazon EventBridge** - Serverless event bus để kết nối applications.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EVENTBRIDGE                                 │
│               (Serverless Event Bus & Scheduler)                    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   Event Sources           Event Bus           Targets       │   │
│   │                                                             │   │
│   │  ┌───────────┐        ┌─────────────┐     ┌───────────┐     │   │
│   │  │AWS Services│       │             │     │  Lambda   │     │   │
│   │  │ S3, EC2... │──────▶│             │────▶│           │     │   │
│   │  └───────────┘        │             │     └───────────┘     │   │
│   │                       │   DEFAULT   │                       │   │
│   │  ┌───────────┐        │    BUS      │     ┌───────────┐     │   │
│   │  │ Custom    │──────▶│             │────▶│  SQS/SNS  │      │   │
│   │  │ Events    │        │    Rules    │     └───────────┘     │   │
│   │  └───────────┘        │   filter    │                       │   │
│   │                       │   & route   │     ┌───────────┐     │   │
│   │  ┌───────────┐        │             │────▶│Step Funcs │     │   │
│   │  │ SaaS Apps │──────▶│             │     └───────────┘      │   │
│   │  │Shopify etc│        └─────────────┘                       │   │
│   │  └───────────┘                                              │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   EVENT STRUCTURE:                                                  │
│   {                                                                 │
│     "version": "0",                                                 │
│     "source": "myapp.orders",                                       │
│     "detail-type": "Order Created",                                 │
│     "detail": {                                                     │
│       "order_id": "12345",                                          │
│       "customer": "user_123",                                       │
│       "total": 99.99                                                │
│     }                                                               │
│   }                                                                 │
│                                                                     │
│   RULE EXAMPLE (filter orders > $100):                              │
│   {                                                                 │
│     "source": ["myapp.orders"],                                     │
│     "detail-type": ["Order Created"],                               │
│     "detail": {                                                     │
│       "total": [{"numeric": [">", 100]}]                            │
│     }                                                               │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**EventBridge Scheduler:**
```
┌────────────────────────────────────────────────────────────────────┐
│  EVENTBRIDGE SCHEDULER (Thay thế CloudWatch Events)                │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Schedule Types:                                              │ │
│  │                                                               │ │
│  │  1. Rate-based: rate(5 minutes), rate(1 hour)                 │ │
│  │                                                               │ │
│  │  2. Cron-based: cron(0 9 * * ? *)  → 9AM daily                │ │
│  │                                                               │ │
│  │  3. One-time: at(2024-12-25T00:00:00)                         │ │
│  │                                                               │ │
│  │  Targets: Lambda, Step Functions, SQS, SNS, ECS Task...       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Use cases:                                                        │
│  • Daily reports                                                   │
│  • Database cleanup                                                │
│  • Scheduled notifications                                         │
│  • Batch processing                                                │
└────────────────────────────────────────────────────────────────────┘
```

---

### 6. Step Functions

**AWS Step Functions** - Serverless workflow orchestration.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       STEP FUNCTIONS                                │
│              (Visual Workflow / State Machine)                      │
│                                                                     │
│   Orchestrate nhiều Lambda functions và AWS services                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    STATE MACHINE EXAMPLE                    │   │
│   │                                                             │   │
│   │          ┌─────────────────┐                                │   │
│   │          │  Process Order  │ ← Start                        │   │
│   │          └────────┬────────┘                                │   │
│   │                   │                                         │   │
│   │          ┌────────▼────────┐                                │   │
│   │          │ Check Inventory │                                │   │
│   │          └────────┬────────┘                                │   │
│   │                   │                                         │   │
│   │         ┌─────────┴─────────┐                               │   │
│   │         ▼                   ▼                               │   │
│   │   In Stock?            Out of Stock                         │   │
│   │         │                   │                               │   │
│   │         ▼                   ▼                               │   │
│   │   ┌──────────┐        ┌──────────┐                          │   │
│   │   │ Payment  │        │ Backorder│                          │   │
│   │   └────┬─────┘        └────┬─────┘                          │   │
│   │        │                   │                                │   │
│   │        ▼                   │                                │   │
│   │   ┌──────────┐             │                                │   │
│   │   │ Shipping │             │ Wait for stock                 │   │
│   │   └────┬─────┘             │                                │   │
│   │        │                   │                                │   │
│   │        └───────┬───────────┘                                │   │
│   │                ▼                                            │   │
│   │          ┌──────────┐                                       │   │
│   │          │  Notify  │                                       │   │
│   │          └────┬─────┘                                       │   │
│   │               │                                             │   │
│   │               ▼                                             │   │
│   │             [End]                                           │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   STATE TYPES:                                                      │
│   • Task     - Run Lambda, call API                                 │
│   • Choice   - Branch based on condition                            │
│   • Parallel - Run states concurrently                              │
│   • Wait     - Delay for time or until timestamp                    │
│   • Map      - Process items in array                               │
│   • Pass     - Pass input to output                                 │
│   • Succeed/Fail - End states                                       │
│                                                                     │
│   2 WORKFLOW TYPES:                                                 │
│   ┌─────────────────────────┬───────────────────────────────────┐   │
│   │      STANDARD           │          EXPRESS                  │   │
│   │                         │                                   │   │
│   │  ✅ Up to 1 year        │  ✅ Up to 5 minutes               │   │
│   │  ✅ Exactly-once        │  ✅ At-least-once                 │   │
│   │  ✅ Full execution hist │  ✅ 100K executions/sec           │   │
│   │  ❌ $0.025/1K trans     │  ✅ Pay per request+duration      │   │
│   │                         │                                   │   │
│   │  Use: Long workflows    │  Use: High-volume, quick tasks    │   │
│   └─────────────────────────┴───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Ví dụ Step Functions Definition (ASL):**
```json
{
  "Comment": "Order Processing Workflow",
  "StartAt": "CheckInventory",
  "States": {
    "CheckInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:check-inventory",
      "Next": "IsInStock"
    },
    "IsInStock": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.inStock",
          "BooleanEquals": true,
          "Next": "ProcessPayment"
        }
      ],
      "Default": "NotifyBackorder"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:process-payment",
      "Next": "ShipOrder"
    },
    "ShipOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:ship-order",
      "End": true
    },
    "NotifyBackorder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:notify-backorder",
      "End": true
    }
  }
}
```

---

### 7. Fargate

**AWS Fargate** - Serverless compute engine cho containers (ECS & EKS).

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FARGATE                                    │
│              (Serverless Containers - No EC2 to manage)             │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │  TRƯỚC ĐÂY (EC2 Launch Type):                               │   │
│   │  ┌─────────────────────────────────────────────────────┐    │   │
│   │  │  Bạn phải quản lý:                                   │   │   │
│   │  │  • Provision EC2 instances                           │   │   │
│   │  │  • Scale EC2 cluster                                 │   │   │
│   │  │  • Patch/update AMIs                                 │   │   │
│   │  │  • Monitor instance health                           │   │   │
│   │  └─────────────────────────────────────────────────────┘    │   │
│   │                                                             │   │
│   │  VỚI FARGATE:                                               │   │
│   │  ┌─────────────────────────────────────────────────────┐    │   │
│   │  │  Bạn chỉ cần:                                        │   │   │
│   │  │  • Define CPU & Memory cho task                      │   │   │
│   │  │  • Deploy container                                  │   │   │
│   │  │  → AWS lo phần còn lại!                              │   │   │
│   │  └─────────────────────────────────────────────────────┘    │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   FARGATE vs EC2 vs LAMBDA:                                         │
│   ┌─────────────────┬───────────────┬────────────────────────────┐  │
│   │     Lambda      │    Fargate    │          EC2               │  │
│   ├─────────────────┼───────────────┼────────────────────────────┤  │
│   │ Max 15 mins     │ Long-running  │ Long-running               │  │
│   │ Event-driven    │ Containers    │ Full control               │  │
│   │ Auto-scale 0→∞  │ Auto-scale    │ Manual/ASG                 │  │
│   │ Pay per exec    │ Pay per vCPU  │ Pay per hour               │  │
│   │ No containers   │ Docker images │ Any software               │  │
│   └─────────────────┴───────────────┴────────────────────────────┘  │
│                                                                     │
│   USE CASES:                                                        │
│   • Web apps, APIs (long-running)                                   │
│   • Microservices                                                   │
│   • Batch processing (longer than 15 mins)                          │
│   • Machine learning inference                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 🔮 8. AppSync

**AWS AppSync** - Serverless GraphQL and Pub/Sub API service.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          APPSYNC                                    │
│                    (Managed GraphQL Service)                        │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   Client Apps              AppSync           Data Sources   │   │
│   │                                                             │   │
│   │  ┌─────────┐           ┌─────────────┐     ┌───────────┐    │   │
│   │  │  Web    │           │             │     │ DynamoDB  │    │   │
│   │  │  App    │◀─────────▶│             │────▶│           │    │   │
│   │  └─────────┘           │   GraphQL   │     └───────────┘    │   │
│   │                        │    API      │                      │   │
│   │  ┌─────────┐           │             │     ┌───────────┐    │   │
│   │  │ Mobile  │◀─────────▶│  Resolvers  │────▶│  Lambda   │    │   │
│   │  │  App    │           │             │     └───────────┘    │   │
│   │  └─────────┘           │             │                      │   │
│   │                        │             │     ┌───────────┐    │   │
│   │  ┌─────────┐           │             │────▶│   RDS     │    │   │
│   │  │   IoT   │◀─────────▶│             │     └───────────┘    │   │
│   │  │ Device  │  Real-time└─────────────┘                      │   │
│   │  └─────────┘  subscriptions                                 │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   FEATURES:                                                         │
│   • Real-time subscriptions (WebSocket)                             │
│   • Offline sync (mobile apps)                                      │
│   • Fine-grained authorization                                      │
│   • Conflict resolution                                             │
│   • Built-in caching                                                │
│                                                                     │
│   GRAPHQL vs REST:                                                  │
│   ┌──────────────────────────┬──────────────────────────────────┐   │
│   │          REST            │           GraphQL                │   │
│   │                          │                                  │   │
│   │  GET /users              │  query {                         │   │
│   │  GET /users/123          │    user(id: 123) {               │   │
│   │  GET /users/123/orders   │      name                        │   │
│   │  (3 requests)            │      orders { id, total }        │   │
│   │                          │    }                             │   │
│   │                          │  }                               │   │
│   │                          │  (1 request, exactly what needed)│   │
│   └──────────────────────────┴──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 🗄️ 9. Aurora Serverless

**Amazon Aurora Serverless** - On-demand, auto-scaling relational database.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       AURORA SERVERLESS                             │
│                 (Serverless Relational Database)                    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │  AURORA SERVERLESS V2:                                      │   │
│   │                                                             │   │
│   │  ┌─────────────────────────────────────────────────────┐    │   │
│   │  │                                                      │   │   │
│   │  │   Capacity                                           │   │   │
│   │  │      ▲                                               │   │   │
│   │  │      │            ___                                │   │   │
│   │  │      │           /   \___                            │   │   │
│   │  │      │      ___/         \___                        │   │   │
│   │  │      │   __/                  \___                   │   │   │
│   │  │      │  /                         \__                │   │   │
│   │  │      └────────────────────────────────▶ Time         │   │   │
│   │  │                                                      │   │   │
│   │  │   Auto-scales dựa trên workload thực tế            │     │   │
│   │  │   • Min: 0.5 ACU (có thể pause = $0)               │     │   │
│   │  │   • Max: 128 ACUs                                   │    │   │
│   │  │   • Scale trong vài giây                            │    │   │
│   │  │                                                      │   │   │
│   │  └─────────────────────────────────────────────────────┘    │   │
│   │                                                             │   │
│   │  AURORA SERVERLESS vs RDS:                                  │   │
│   │  ┌────────────────────────┬────────────────────────────┐    │   │
│   │  │    RDS (Provisioned)   │    Aurora Serverless       │    │   │
│   │  ├────────────────────────┼────────────────────────────┤    │   │
│   │  │ Fixed instance size    │ Auto-scaling capacity      │    │   │
│   │  │ Pay 24/7               │ Pay per ACU-seconds        │    │   │
│   │  │ Manual scaling         │ Automatic scaling          │    │   │
│   │  │ Always running         │ Can pause when idle        │    │   │
│   │  └────────────────────────┴────────────────────────────┘    │   │
│   │                                                             │   │
│   │  BEST FOR:                                                  │   │
│   │  • Variable workloads                                       │   │
│   │  • Development/test environments                            │   │
│   │  • Infrequently used applications                           │   │
│   │  • New apps with unknown load                               │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 10. Cognito

**Amazon Cognito** - Serverless authentication và user management.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          COGNITO                                    │
│            (Serverless Authentication & Authorization)              │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   2 COMPONENTS:                                             │   │
│   │                                                             │   │
│   │   1. USER POOLS (Authentication - "Who are you?")           │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │                                                      │  │   │
│   │   │   User ──▶ Sign up/Sign in ──▶ User Pool ──▶ JWT    │   │   │
│   │   │                                    │                 │  │   │
│   │   │   Features:                        │                 │  │   │
│   │   │   • Username/password              ▼                 │  │   │
│   │   │   • Social login (Google, FB)   ┌──────────┐        │   │   │
│   │   │   • MFA                         │ ID Token │        │   │   │
│   │   │   • Email/Phone verification    │ Access   │        │   │   │
│   │   │   • Password policies           │ Token    │        │   │   │
│   │   │                                 └──────────┘        │   │   │
│   │   └─────────────────────────────────────────────────────┘   │   │
│   │                                                             │   │
│   │   2. IDENTITY POOLS (Authorization - "What can you do?")    │   │
│   │   ┌─────────────────────────────────────────────────────┐   │   │
│   │   │                                                      │  │   │
│   │   │   JWT ──▶ Identity Pool ──▶ AWS Credentials          │  │   │
│   │   │   from                        │                      │  │   │
│   │   │   User Pool                   ▼                      │  │   │
│   │   │                         ┌───────────────┐           │   │   │
│   │   │   Federated             │ Temporary AWS │           │   │   │
│   │   │   identities:           │ credentials   │           │   │   │
│   │   │   • User Pool           │ (STS)         │           │   │   │
│   │   │   • Google, Facebook    └───────┬───────┘           │   │   │
│   │   │   • SAML, OIDC                  │                   │   │   │
│   │   │                                 ▼                   │   │   │
│   │   │                          Access S3, DynamoDB...     │   │   │
│   │   │                                                      │  │   │
│   │   └─────────────────────────────────────────────────────┘   │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   TYPICAL FLOW:                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   User        User Pool      Identity Pool     AWS Services │   │
│   │     │             │               │                  │      │   │
│   │     │ Login       │               │                  │      │   │
│   │     │────────────▶│               │                  │      │   │
│   │     │             │               │                  │      │   │
│   │     │◀────────────│               │                  │      │   │
│   │     │  JWT Tokens │               │                  │      │   │
│   │     │             │               │                  │      │   │
│   │     │─────────────│──────────────▶│                  │      │   │
│   │     │             │  Exchange JWT │                  │      │   │
│   │     │             │               │                  │      │   │
│   │     │◀────────────│───────────────│                  │      │   │
│   │     │   AWS Credentials           │                  │      │   │
│   │     │             │               │                  │      │   │
│   │     │─────────────│───────────────│─────────────────▶│      │   │
│   │     │             │               │   Access S3,     │      │   │
│   │     │             │               │   DynamoDB, etc  │      │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Tổng hợp: Khi nào dùng dịch vụ nào?

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVERLESS SERVICE SELECTION                      │
│                                                                     │
│   Tôi cần...              → Dùng dịch vụ                            │
│   ────────────────────────────────────────────────────────────      │
│   Run code < 15 mins      → Lambda                                  │
│   Run containers long     → Fargate (ECS/EKS)                       │
│   REST/HTTP API           → API Gateway (HTTP API)                  │
│   GraphQL API             → AppSync                                 │
│   NoSQL database          → DynamoDB                                │
│   SQL database            → Aurora Serverless                       │
│   Object storage          → S3                                      │
│   User authentication     → Cognito User Pools                      │
│   AWS credentials         → Cognito Identity Pools                  │
│   Pub/Sub messaging       → SNS                                     │
│   Queue processing        → SQS                                     │
│   Event routing           → EventBridge                             │
│   Cron jobs               → EventBridge Scheduler                   │
│   Orchestrate workflows   → Step Functions                          │
│   Real-time data          → Kinesis / AppSync subscriptions         │
│                                                                     │
│   ──────────────────────────────────────────────────────────────    │
│                                                                     │
│   EXAMPLE: E-commerce Application (100% Serverless)                 │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │          CloudFront (CDN)                                   │   │
│   │                │                                            │   │
│   │      ┌─────────┴──────────┐                                 │   │
│   │      ▼                    ▼                                 │   │
│   │   S3 (SPA)           API Gateway                            │   │
│   │   React App            │                                    │   │
│   │                ┌───────┴───────┐                            │   │
│   │                ▼               ▼                            │   │
│   │           Cognito         Lambda functions                  │   │
│   │           (Auth)           │         │                      │   │
│   │                    ┌───────┴───┐     │                      │   │
│   │                    ▼           ▼     ▼                      │   │
│   │               DynamoDB      SNS   Step Functions            │   │
│   │               (Products,     │     (Order Flow)             │   │
│   │                Orders)       │         │                    │   │
│   │                              ▼         ▼                    │   │
│   │                          Lambda    EventBridge              │   │
│   │                          (Send       (Schedule)             │   │
│   │                           Email)                            │   │
│   │                                                             │   │
│   │   Cost: Pay only when users are shopping!                   │   │
│   │   Scale: From 0 to millions automatically                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tiếp theo

- [Step Functions](./step-functions.md) - Orchestrate Lambda functions
- [API Gateway](./api-gateway.md) - Build serverless APIs  
- [DynamoDB](./dynamodb.md) - Serverless database
- [EventBridge](./eventbridge.md) - Event-driven architectures
