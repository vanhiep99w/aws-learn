# AWS Step Functions

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc và Core Concepts](#kiến-trúc-và-core-concepts)
- [Workflow Types: Standard vs Express](#workflow-types-standard-vs-express)
- [Workflow States](#workflow-states)
- [Amazon States Language (ASL)](#amazon-states-language-asl)
- [Service Integrations](#service-integrations)
- [Error Handling](#error-handling)
- [Security](#security)
- [Pricing](#pricing)
- [Quotas và Limits](#quotas-và-limits)
- [So sánh với các Orchestration Tools khác](#so-sánh-với-các-orchestration-tools-khác)
- [Best Practices](#best-practices)
- [Hands-on Examples](#hands-on-examples)
- [Liên kết](#liên-kết)

---

## Tổng quan

**AWS Step Functions** là dịch vụ **serverless orchestration** cho phép bạn kết hợp các AWS services thành các workflows (state machines) để xây dựng distributed applications, automate processes, orchestrate microservices, và tạo data/ML pipelines.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WHAT IS AWS STEP FUNCTIONS?                     │
│                                                                     │
│   Step Functions = Serverless Workflow Orchestration Service        │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   Event Sources        Step Functions         AWS Services  │   │
│   │                                                             │   │
│   │  ┌───────────┐      ┌─────────────────┐    ┌───────────┐    │   │
│   │  │ API       │      │                 │    │  Lambda   │    │   │
│   │  │ Gateway   │─────▶│  State Machine  │───▶│           │    │   │
│   │  └───────────┘      │                 │    └───────────┘    │   │
│   │                     │  ┌───────────┐  │                     │   │
│   │  ┌───────────┐      │  │  Task     │  │    ┌───────────┐    │   │
│   │  │ Event     │─────▶│  │  Choice   │  │───▶│ DynamoDB  │    │   │
│   │  │ Bridge    │      │  │  Parallel │  │    └───────────┘    │   │
│   │  └───────────┘      │  │  Map      │  │                     │   │
│   │                     │  │  Wait     │  │    ┌───────────┐    │   │
│   │  ┌───────────┐      │  │  Pass     │  │───▶│ ECS/EKS   │    │   │
│   │  │ Schedule  │─────▶│  │  Succeed  │  │    └───────────┘    │   │
│   │  │ (cron)    │      │  │  Fail     │  │                     │   │
│   │  └───────────┘      │  └───────────┘  │    ┌───────────┐    │   │
│   │                     │                 │───▶│ SNS/SQS   │    │   │
│   │  ┌───────────┐      │  Visual Editor  │    └───────────┘    │   │
│   │  │ Lambda    │─────▶│  (Workflow      │                     │   │
│   │  │ (nested)  │      │   Studio)       │    ┌───────────┐    │   │
│   │  └───────────┘      └─────────────────┘───▶│ 200+ AWS  │    │   │
│   │                                            │ Services  │    │   │
│   │                                            └───────────┘    │   │
│   │                                                             │   │
│   │   KEY BENEFITS:                                             │   │
│   ├── ✅ Visual workflows - thiết kế bằng drag-and-drop         │   │
│   ├── ✅ Built-in error handling - Retry, Catch, Fallback       │   │
│   ├── ✅ State management - tự động track state giữa các steps  │   │
│   ├── ✅ 200+ AWS SDK integrations - gọi bất kỳ AWS service     │   │
│   ├── ✅ Parallel & Map - xử lý song song và lặp dynamic        │   │
│   └── ✅ Pay-per-use - chỉ trả cho state transitions thực tế    │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Khi nào dùng Step Functions?

| Use Case | Ví dụ |
|----------|-------|
| **Microservice Orchestration** | Gọi nhiều Lambda/ECS services theo thứ tự |
| **Data Processing / ETL** | Xử lý dữ liệu qua nhiều bước: extract → transform → load |
| **ML Pipeline** | Train model → evaluate → deploy → monitor |
| **Human Approval Workflows** | Order processing với bước approve thủ công |
| **IT Automation** | Security incident response, auto-remediation |
| **Media Processing** | Transcode video → generate thumbnails → publish |

> **Nguồn**: [AWS Step Functions - What is Step Functions?](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)

---

## Kiến trúc và Core Concepts

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP FUNCTIONS ARCHITECTURE                      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                   STATE MACHINE (Workflow)                  │   │
│   │                                                             │   │
│   │   Input ──▶ ┌─────────┐    ┌─────────┐    ┌─────────┐       │   │
│   │             │  State  │───▶│  State  │───▶│  State  │       │   │
│   │             │  (Task) │    │ (Choice)│    │  (Task) │       │   │
│   │             └─────────┘    └────┬────┘    └─────────┘       │   │
│   │                                 │                           │   │
│   │                          ┌──────┴──────┐                    │   │
│   │                          │             │                    │   │
│   │                     ┌────▼────┐  ┌─────▼────┐               │   │
│   │                     │ Branch  │  │ Branch   │               │   │
│   │                     │   A     │  │   B      │               │   │
│   │                     └────┬────┘  └─────┬────┘               │   │
│   │                          │             │                    │   │
│   │                          └──────┬──────┘                    │   │
│   │                                 │                           │   │
│   │                          ┌──────▼──────┐                    │   │
│   │                          │   End       │ ──▶ Output         │   │
│   │                          └─────────────┘                    │   │
│   │                                                             │   │
│   │   EXECUTION = 1 lần chạy state machine                      │   │
│   │   STATE = 1 bước trong workflow                             │   │
│   │   TRANSITION = di chuyển từ state này sang state kế tiếp    │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Concepts

| Concept | Mô tả |
|---------|-------|
| **State Machine** | Workflow definition (JSON/YAML) chứa các states và transitions |
| **State** | Một bước trong workflow (Task, Choice, Parallel, Map, Wait, Pass, Succeed, Fail) |
| **Execution** | Một lần chạy (instance) của state machine |
| **Transition** | Di chuyển từ state này sang state tiếp theo |
| **Amazon States Language (ASL)** | JSON-based language để định nghĩa state machines |
| **Workflow Studio** | Visual editor (drag-and-drop) trong AWS Console |
| **Activity** | Worker bên ngoài Step Functions (long-running tasks) |
| **Task Token** | Token cho phép external process callback về Step Functions |

---

## Workflow Types: Standard vs Express

Step Functions có **2 loại workflow**, và **không thể thay đổi** sau khi tạo.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STANDARD vs EXPRESS WORKFLOWS                    │
│                                                                     │
│   ┌──────────────────────────┐   ┌──────────────────────────┐       │
│   │     STANDARD WORKFLOW    │   │     EXPRESS WORKFLOW     │       │
│   │                          │   │                          │       │
│   │  Duration: tối đa 1 NĂM  │   │  Duration: tối đa 5 PHÚT │       │
│   │                          │   │                          │       │
│   │  Execution: exactly-once │   │  Execution: at-least-once│       │
│   │                          │   │  (async) / at-most-once  │       │
│   │  Rate: 2,000/giây        │   │  (sync)                  │       │
│   │                          │   │  Rate: 100,000/giây      │       │
│   │  Billing: per state      │   │                          │       │
│   │  transition              │   │  Billing: per execution  │       │
│   │                          │   │  + duration + memory     │       │
│   │  History: Step Functions │   │                          │       │
│   │  console (90 ngày)       │   │  History: CloudWatch Logs│       │
│   │                          │   │                          │       │
│   │  Use for:                │   │  Use for:                │       │
│   │  • Long-running workflows│   │  • High-volume events    │       │
│   │  • Non-idempotent actions│   │  • IoT data ingestion    │       │
│   │  • Human approval steps  │   │  • Streaming processing  │       │
│   │  • Audit trail needed    │   │  • Idempotent actions    │       │
│   │                          │   │  • API backends          │       │
│   │  Supports:               │   │                          │       │
│   │  ✅ Request Response     │   │  Supports:               │       │
│   │  ✅ Run a Job (.sync)    │   │  ✅ Request Response     │       │
│   │  ✅ Wait for Callback    │   │  ❌ Run a Job (.sync)    │       │
│   │  ✅ Distributed Map      │   │  ❌ Wait for Callback    │       │
│   │  ✅ Activities           │   │  ❌ Distributed Map      │       │
│   │                          │   │  ❌ Activities           │       │
│   └──────────────────────────┘   └──────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### So sánh chi tiết

| Tiêu chí | Standard | Express |
|-----------|----------|---------|
| **Max duration** | 1 năm | 5 phút |
| **Execution rate** | 2,000/giây | 100,000/giây |
| **State transition rate** | 4,000/giây (soft limit) | Gần như không giới hạn |
| **Execution semantics** | Exactly-once | At-least-once (async) / At-most-once (sync) |
| **Pricing** | Per state transition ($0.000025/transition) | Per execution + duration + memory |
| **Execution history** | Console + API (90 ngày) | CloudWatch Logs |
| **Run a Job (.sync)** | ✅ | ❌ |
| **Wait for Callback** | ✅ | ❌ |
| **Distributed Map** | ✅ | ❌ |
| **Activities** | ✅ | ❌ |

### Express Workflow: Synchronous vs Asynchronous

| Loại | Mô tả | Execution semantics | Trigger |
|------|--------|---------------------|---------|
| **Async Express** | Start workflow, KHÔNG đợi kết quả | At-least-once | EventBridge, nested workflow, `StartExecution` API |
| **Sync Express** | Start workflow, ĐỢI kết quả trả về | At-most-once | API Gateway, Lambda, `StartSyncExecution` API |

> **Lưu ý**: Workflow type **không thể thay đổi** sau khi tạo state machine.

> **Nguồn**: [Choosing workflow type](https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html)

---

## Workflow States

Step Functions có **8 loại state** chia thành 2 nhóm: **Task states** (action) và **Flow states** (điều khiển luồng).

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW STATES                             │
│                                                                     │
│   ┌─── ACTION STATE ───────────────────────────────────────────┐    │
│   │                                                            │    │
│   │  ┌──────────┐                                              │    │
│   │  │   TASK   │  Thực hiện 1 unit of work                    │    │
│   │  │          │  → Gọi Lambda, DynamoDB, ECS, HTTP, v.v.     │    │
│   │  └──────────┘                                              │    │
│   │                                                            │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│   ┌─── FLOW STATES ────────────────────────────────────────────┐    │
│   │                                                            │    │
│   │  ┌──────────┐  Rẽ nhánh dựa trên điều kiện (if/else)       │    │
│   │  │  CHOICE  │  → Kiểm tra input và chọn branch phù hợp     │    │
│   │  └──────────┘                                              │    │
│   │                                                            │    │
│   │  ┌──────────┐  Chạy nhiều branches SONG SONG               │    │
│   │  │ PARALLEL │  → Tất cả branches phải hoàn thành           │    │
│   │  └──────────┘                                              │    │
│   │                                                            │    │
│   │  ┌──────────┐  Lặp qua từng phần tử trong array            │    │
│   │  │   MAP    │  → Inline (trong state machine)              │    │
│   │  │          │  → Distributed (child executions, lên tới    │    │
│   │  │          │    10,000 parallel)                          │    │
│   │  └──────────┘                                              │    │
│   │                                                            │    │
│   │  ┌──────────┐  Chờ một khoảng thời gian hoặc timestamp     │    │
│   │  │   WAIT   │  → Seconds, Timestamp, SecondsPath,          │    │
│   │  │          │    TimestampPath                             │    │
│   │  └──────────┘                                              │    │
│   │                                                            │    │
│   │  ┌──────────┐  Truyền input → output (có thể transform)    │    │
│   │  │   PASS   │  → Dùng để inject fixed data hoặc debug      │    │
│   │  └──────────┘                                              │    │
│   │                                                            │    │
│   │  ┌──────────┐  Kết thúc workflow THÀNH CÔNG                │    │
│   │  │ SUCCEED  │                                              │    │
│   │  └──────────┘                                              │    │
│   │                                                            │    │
│   │  ┌──────────┐  Kết thúc workflow THẤT BẠI (Error + Cause)  │    │
│   │  │   FAIL   │                                              │    │
│   │  └──────────┘                                              │    │
│   │                                                            │    │
│   └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Chi tiết từng State

| State | Type | Mô tả | Ví dụ |
|-------|------|--------|-------|
| **Task** | Action | Gọi AWS service hoặc activity | Invoke Lambda, PutItem DynamoDB |
| **Choice** | Flow | Rẽ nhánh theo điều kiện | If order > $100 → approve, else → reject |
| **Parallel** | Flow | Chạy nhiều branches đồng thời | Gửi email + SMS + push notification cùng lúc |
| **Map** | Flow | Lặp qua array items | Xử lý từng file trong S3 bucket |
| **Wait** | Flow | Pause execution | Chờ 30 giây, chờ đến ngày cụ thể |
| **Pass** | Flow | Pass-through, transform data | Inject default values, reshape data |
| **Succeed** | Flow | Terminal state - thành công | Kết thúc workflow |
| **Fail** | Flow | Terminal state - thất bại | Trả về error code + message |

> **Nguồn**: [Discovering workflow states](https://docs.aws.amazon.com/step-functions/latest/dg/workflow-states.html)

---

## Amazon States Language (ASL)

ASL là **JSON-based language** để định nghĩa state machines.

### Ví dụ: Order Processing Workflow

```json
{
  "Comment": "Order Processing Workflow",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ValidateOrder",
      "Next": "CheckInventory",
      "Retry": [
        {
          "ErrorEquals": ["ServiceUnavailable"],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "Next": "OrderFailed"
        }
      ]
    },

    "CheckInventory": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:getItem",
      "Parameters": {
        "TableName": "Inventory",
        "Key": {
          "ProductId": {
            "S.$": "$.productId"
          }
        }
      },
      "Next": "IsInStock"
    },

    "IsInStock": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.Item.Stock.N",
          "NumericGreaterThan": 0,
          "Next": "ProcessPayment"
        }
      ],
      "Default": "OutOfStock"
    },

    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessPayment",
      "Next": "SendNotifications"
    },

    "SendNotifications": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "SendEmail",
          "States": {
            "SendEmail": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sns:publish",
              "Parameters": {
                "TopicArn": "arn:aws:sns:us-east-1:123456789012:OrderEmail",
                "Message.$": "$.orderId"
              },
              "End": true
            }
          }
        },
        {
          "StartAt": "UpdateDatabase",
          "States": {
            "UpdateDatabase": {
              "Type": "Task",
              "Resource": "arn:aws:states:::dynamodb:putItem",
              "Parameters": {
                "TableName": "Orders",
                "Item": {
                  "OrderId": { "S.$": "$.orderId" },
                  "Status": { "S": "COMPLETED" }
                }
              },
              "End": true
            }
          }
        }
      ],
      "Next": "OrderSucceeded"
    },

    "OutOfStock": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:NotifyOutOfStock",
      "Next": "OrderFailed"
    },

    "OrderSucceeded": {
      "Type": "Succeed"
    },

    "OrderFailed": {
      "Type": "Fail",
      "Error": "OrderProcessingError",
      "Cause": "Order could not be processed"
    }
  }
}
```

### Map State - Xử lý hàng loạt

```json
{
  "ProcessAllFiles": {
    "Type": "Map",
    "ItemsPath": "$.files",
    "MaxConcurrency": 10,
    "ItemProcessor": {
      "ProcessorConfig": {
        "Mode": "INLINE"
      },
      "StartAt": "ProcessFile",
      "States": {
        "ProcessFile": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessFile",
          "End": true
        }
      }
    },
    "Next": "Done"
  }
}
```

### Distributed Map - Xử lý large-scale (Standard Workflow only)

```json
{
  "ProcessLargeDataset": {
    "Type": "Map",
    "ItemProcessor": {
      "ProcessorConfig": {
        "Mode": "DISTRIBUTED",
        "ExecutionType": "EXPRESS"
      },
      "StartAt": "ProcessItem",
      "States": {
        "ProcessItem": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessItem",
          "End": true
        }
      }
    },
    "ItemReader": {
      "Resource": "arn:aws:states:::s3:getObject",
      "ReaderConfig": {
        "InputType": "CSV",
        "CSVHeaderLocation": "FIRST_ROW"
      },
      "Parameters": {
        "Bucket": "my-bucket",
        "Key": "data.csv"
      }
    },
    "MaxConcurrency": 1000,
    "Next": "Done"
  }
}
```

---

## Service Integrations

Step Functions tích hợp với **200+ AWS services** qua 9,000+ API actions.

### Integration Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICE INTEGRATION PATTERNS                     │
│                                                                     │
│   1️⃣  REQUEST RESPONSE (default)                                    │
│   ┌─────────┐     ┌──────────┐     ┌────────┐                       │
│   │  Step   │────▶│  AWS     │────▶│ Next   │   Gọi service,        │
│   │Functions│     │ Service  │     │ State  │   nhận HTTP response, │
│   └─────────┘     └──────────┘     └────────┘ chuyển ngay next state│
│                                                                     │
│   2️⃣  RUN A JOB (.sync) - Standard only                             │
│   ┌─────────┐     ┌──────────┐                  ┌────────┐          │
│   │  Step   │────▶│  AWS     │  ⏳ đợi job      │ Next   │          │
│   │Functions│     │ Service  │  hoàn thành ────▶│ State  │          │
│   └─────────┘     └──────────┘                  └────────┘          │
│                                                                     │
│   3️⃣  WAIT FOR CALLBACK (.waitForTaskToken) - Standard only         │
│   ┌─────────┐     ┌──────────┐                  ┌────────┐          │
│   │  Step   │────▶│  SQS/    │  ⏳ đợi external │ Next   │          │
│   │Functions│     │ Lambda   │  process gọi     │ State  │          │
│   │ (pause) │     │ + token  │  SendTaskSuccess └────────┘          │
│   └─────────┘     └──────────┘                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Optimized Integrations (các service phổ biến)

| AWS Service | Request Response | Run a Job (.sync) | Wait for Callback |
|-------------|:---:|:---:|:---:|
| **Lambda** | Standard & Express | ❌ | Standard |
| **DynamoDB** | Standard & Express | ❌ | ❌ |
| **ECS/Fargate** | Standard & Express | Standard | Standard |
| **EKS** | Standard & Express | Standard | Standard |
| **SNS** | Standard & Express | ❌ | Standard |
| **SQS** | Standard & Express | ❌ | Standard |
| **AWS Batch** | Standard & Express | Standard | ❌ |
| **Glue** | Standard & Express | Standard | ❌ |
| **SageMaker** | Standard & Express | Standard | ❌ |
| **Athena** | Standard & Express | Standard | ❌ |
| **Bedrock** | Standard & Express | Standard | Standard |
| **CodeBuild** | Standard & Express | Standard | ❌ |
| **API Gateway** | Standard & Express | ❌ | Standard |
| **EventBridge** | Standard & Express | ❌ | Standard |
| **Step Functions** | Standard & Express | Standard | Standard |

### HTTP Task

Step Functions hỗ trợ gọi **HTTPS APIs** (public hoặc private) trực tiếp từ workflow mà không cần Lambda.

```json
{
  "CallExternalAPI": {
    "Type": "Task",
    "Resource": "arn:aws:states:::http:invoke",
    "Parameters": {
      "ApiEndpoint": "https://api.example.com/orders",
      "Method": "POST",
      "Headers": {
        "Content-Type": "application/json"
      },
      "RequestBody": {
        "orderId.$": "$.orderId"
      },
      "Authentication": {
        "ConnectionArn": "arn:aws:events:us-east-1:123456789012:connection/MyConnection"
      }
    },
    "Next": "ProcessResponse"
  }
}
```

> **Nguồn**: [Integrating services with Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/integrate-services.html)

---

## Error Handling

Step Functions cung cấp **built-in error handling** với `Retry` và `Catch`.

### Retry

```json
{
  "ProcessOrder": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:us-east-1:123456789012:function:Process",
    "Retry": [
      {
        "ErrorEquals": ["States.TaskFailed"],
        "IntervalSeconds": 3,
        "MaxAttempts": 5,
        "BackoffRate": 2.0,
        "MaxDelaySeconds": 60,
        "JitterStrategy": "FULL"
      },
      {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 1,
        "MaxAttempts": 2
      }
    ],
    "Next": "Done"
  }
}
```

| Field | Mô tả | Default |
|-------|--------|---------|
| **ErrorEquals** | Danh sách error names để match | (bắt buộc) |
| **IntervalSeconds** | Thời gian chờ trước retry đầu tiên | 1 |
| **MaxAttempts** | Số lần retry tối đa | 3 |
| **BackoffRate** | Multiplier cho mỗi lần retry | 2.0 |
| **MaxDelaySeconds** | Giới hạn delay tối đa | Không giới hạn |
| **JitterStrategy** | Thêm random jitter (`FULL` hoặc `NONE`) | `NONE` |

### Catch (Fallback)

```json
{
  "ProcessOrder": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:us-east-1:123456789012:function:Process",
    "Catch": [
      {
        "ErrorEquals": ["CustomValidationError"],
        "Next": "HandleValidationError",
        "ResultPath": "$.error"
      },
      {
        "ErrorEquals": ["States.ALL"],
        "Next": "HandleGenericError",
        "ResultPath": "$.error"
      }
    ],
    "Next": "Done"
  }
}
```

### Built-in Error Types

| Error | Mô tả |
|-------|--------|
| `States.ALL` | Match tất cả errors |
| `States.HeartbeatTimeout` | Task không gửi heartbeat kịp thời |
| `States.Timeout` | Task chạy quá thời gian cho phép |
| `States.TaskFailed` | Task execution failed |
| `States.Permissions` | Insufficient privileges |
| `States.ResultPathMatchFailure` | ResultPath không match được với input |
| `States.IntrinsicFailure` | Intrinsic function failed |

---

## Security

### IAM Execution Role

Step Functions cần một **IAM execution role** để gọi các AWS services.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/Orders"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:us-east-1:123456789012:OrderNotifications"
    }
  ]
}
```

### Security Best Practices

| Practice | Mô tả |
|----------|-------|
| **Least privilege** | Chỉ cấp quyền cần thiết cho execution role |
| **Resource-level permissions** | Specify exact ARNs thay vì `*` |
| **Encryption** | Data at rest được mã hóa bằng AWS-owned key (default) hoặc customer managed KMS key |
| **VPC** | Dùng VPC endpoints để truy cập Step Functions từ private subnets |
| **CloudTrail** | Logging tất cả API calls cho audit |
| **Tagging** | Tag state machines cho cost allocation và access control |

---

## Pricing

### Standard Workflows

| Hạng mục | Chi phí (US East - N. Virginia) |
|----------|---:|
| **Free Tier** | 4,000 state transitions/tháng (vĩnh viễn, không hết hạn sau 12 tháng) |
| **Per state transition** | $0.000025 |

**Ví dụ tính giá:**

```
Workflow có 4 states, chạy 100,000 lần/tháng:

  State transitions = 4 × 100,000 = 400,000
  Billable = 400,000 - 4,000 (Free Tier) = 396,000
  Chi phí = 396,000 × $0.000025 = $9.90/tháng
```

### Express Workflows

| Hạng mục | Chi phí |
|----------|---:|
| **Requests** | $1.00 per 1 triệu requests |
| **Duration** | Tính theo GB-giây (giá thay đổi theo memory tier) |

**Ví dụ tính giá:**

```
1 triệu executions/tháng, mỗi execution 3 giây, dùng 64MB memory:

  Request charges = 1,000,000 × $0.000001 = $1.00
  Duration = 1,000,000 × 3s × (64MB/1024MB) = 187,500 GB-giây
  Duration charges = 187,500 × $0.00001667 ≈ $3.13
  Tổng ≈ $4.13/tháng
```

> **Lưu ý**: Retry do error cũng tính thêm state transitions (Standard) hoặc thêm duration (Express).

> **Nguồn**: [AWS Step Functions Pricing](https://aws.amazon.com/step-functions/pricing/)

---

## Quotas và Limits

### Account-level Quotas

| Resource | Default | Adjustable |
|----------|---------|:---:|
| Max registered state machines | 100,000 | ✅ (lên 150,000) |
| Max registered activities | 100,000 | ✅ (lên 150,000) |
| Max state machine definition size | 1 MB | ❌ (hard limit) |
| Max open executions per account | 1,000,000 | ✅ (hàng triệu) |
| Max open Map Runs | 1,000 | ❌ (hard limit) |
| Max parallel Map Run child executions | 10,000 | ❌ (hard limit) |

### Execution Quotas (Hard Limits)

| Resource | Limit |
|----------|-------|
| Max execution history size | 25,000 events |
| Max execution time (Standard) | 1 năm (365 ngày) |
| Max execution time (Express) | 5 phút |
| Max input/output data size per state | 256 KB |
| Execution history retention (Standard) | 90 ngày |
| State machine name length | 80 ký tự |

### Throttling Quotas (Soft Limits)

| Metric | Standard | Express |
|--------|----------|---------|
| **StateTransition** | 800 bucket / 400 refill/s (default) | Không giới hạn |
| **StartExecution** | 1,300 bucket / 300 refill/s | 6,000 bucket / 6,000 refill/s |

> **Nguồn**: [Step Functions service quotas](https://docs.aws.amazon.com/step-functions/latest/dg/service-quotas.html)

---

## So sánh với các Orchestration Tools khác

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                  │  Step Functions  │  EventBridge     │  SQS + Lambda    │
│                  │                  │  (Event-driven)  │  (Queue-based)   │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Pattern          │ Orchestration    │ Choreography     │ Point-to-point   │
│                  │ (central control)│ (event routing)  │ (decoupled)      │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ State            │ ✅ Managed by    │ ❌ Stateless     │ ❌ Stateless     │
│ Management       │ Step Functions   │                  │                  │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Visual           │ ✅ Workflow      │ ❌               │ ❌               │
│ Debugging        │ Studio           │                  │                  │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Error Handling   │ ✅ Built-in      │ ⚠️ DLQ + retry   │ ⚠️ DLQ + retry   │
│                  │ Retry/Catch      │                  │                  │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Human Approval   │ ✅ Callback      │ ❌               │ ❌               │
│                  │ pattern          │                  │                  │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Best for         │ Complex,         │ Event routing,   │ Simple async     │
│                  │ multi-step       │ many consumers   │ processing       │
│                  │ workflows        │                  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

### Step Functions vs Amazon MWAA (Managed Airflow)

| Tiêu chí | Step Functions | MWAA |
|-----------|---------------|------|
| **Infrastructure** | Serverless, no provisioning | Cần provision, maintenance windows |
| **Authoring** | ASL (JSON), Workflow Studio | Python DAGs |
| **Cost khi idle** | $0 (pay-per-use) | Vẫn tốn tiền (environment luôn chạy) |
| **Max duration** | 1 năm | Không giới hạn |
| **AWS Integration** | Native (200+ services) | Qua Airflow operators/hooks |
| **Best for** | Event-driven, serverless workflows | Data engineering, ETL pipelines phức tạp |

---

## Best Practices

### Design

1. **Chọn đúng workflow type**
   - Standard cho long-running, non-idempotent, cần audit
   - Express cho high-volume, short-duration, idempotent

2. **Nest Express trong Standard** để tối ưu chi phí
   - Standard workflow gọi Express sub-workflow cho high-throughput steps

3. **Dùng Parallel state** thay vì sequential khi các tasks độc lập

4. **Distributed Map** cho large-scale data processing (thay vì inline Map)

5. **Tránh polling loops** - dùng `.sync` hoặc `.waitForTaskToken` thay vì loop + Wait

### Error Handling

1. **Luôn có Retry** với exponential backoff cho transient errors
2. **Luôn có Catch** cho mỗi Task state quan trọng
3. **Dùng `States.ALL`** làm catch-all cuối cùng
4. **Set TimeoutSeconds** cho mỗi Task để tránh stuck executions

### Cost Optimization

1. **Express workflow** cho high-volume workloads (rẻ hơn Standard nhiều)
2. **Giảm state transitions** - combine logic khi có thể
3. **Dùng SDK integrations** trực tiếp thay vì wrap trong Lambda (giảm Lambda cost)
4. **Tránh retry không cần thiết** - mỗi retry = thêm state transitions

### Monitoring

```
CloudWatch Metrics quan trọng:
├── ExecutionsStarted      - Số executions bắt đầu
├── ExecutionsSucceeded    - Số executions thành công
├── ExecutionsFailed       - Số executions thất bại
├── ExecutionsTimedOut     - Số executions timeout
├── ExecutionThrottled     - Số executions bị throttle
└── ExecutionTime          - Thời gian chạy trung bình
```

---

## Hands-on Examples

### 1. CDK - Order Processing Workflow

```typescript
import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class StepFunctionsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda functions
    const validateFn = new lambda.Function(this, 'ValidateFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          if (!event.orderId) throw new Error('Missing orderId');
          return { ...event, validated: true };
        };
      `),
    });

    const processFn = new lambda.Function(this, 'ProcessFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { ...event, status: 'PROCESSED' };
        };
      `),
    });

    // DynamoDB table
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
    });

    // Step Functions tasks
    const validateOrder = new tasks.LambdaInvoke(this, 'Validate Order', {
      lambdaFunction: validateFn,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const checkAmount = new sfn.Choice(this, 'Check Order Amount')
      .when(
        sfn.Condition.numberGreaterThan('$.amount', 1000),
        new sfn.Pass(this, 'Require Approval', {
          result: sfn.Result.fromObject({ approved: false }),
          resultPath: '$.approval',
        })
      )
      .otherwise(
        new sfn.Pass(this, 'Auto Approve', {
          result: sfn.Result.fromObject({ approved: true }),
          resultPath: '$.approval',
        })
      );

    const processOrder = new tasks.LambdaInvoke(this, 'Process Order', {
      lambdaFunction: processFn,
      outputPath: '$.Payload',
    });

    const saveOrder = new tasks.DynamoPutItem(this, 'Save Order', {
      table: ordersTable,
      item: {
        orderId: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt('$.orderId')
        ),
        status: tasks.DynamoAttributeValue.fromString('COMPLETED'),
      },
    });

    const orderSucceeded = new sfn.Succeed(this, 'Order Succeeded');
    const orderFailed = new sfn.Fail(this, 'Order Failed', {
      error: 'OrderProcessingError',
      cause: 'Order could not be processed',
    });

    // Define workflow
    const definition = validateOrder
      .addCatch(orderFailed)
      .next(checkAmount)
      .afterwards()
      .next(processOrder)
      .addCatch(orderFailed)
      .next(saveOrder)
      .addCatch(orderFailed)
      .next(orderSucceeded);

    // Create state machine
    new sfn.StateMachine(this, 'OrderStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      stateMachineType: sfn.StateMachineType.STANDARD,
      timeout: cdk.Duration.minutes(30),
      tracingEnabled: true,
      logs: {
        destination: new cdk.aws_logs.LogGroup(this, 'SfnLogs'),
        level: sfn.LogLevel.ALL,
      },
    });
  }
}
```

### 2. SAM Template - Express Workflow

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  ProcessingStateMachine:
    Type: AWS::Serverless::StateMachine
    Properties:
      DefinitionUri: statemachine/processing.asl.json
      Type: EXPRESS
      Logging:
        Destinations:
          - CloudWatchLogsLogGroup:
              LogGroupArn: !GetAtt StateMachineLogGroup.Arn
        IncludeExecutionData: true
        Level: ALL
      Policies:
        - LambdaInvokePolicy:
            FunctionName: !Ref ProcessFunction
        - DynamoDBCrudPolicy:
            TableName: !Ref DataTable
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /process
            Method: post

  ProcessFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: python3.12
      Handler: app.handler
      CodeUri: src/

  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST

  StateMachineLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: 14
```

### 3. Callback Pattern (Human Approval)

```json
{
  "Comment": "Human Approval Workflow",
  "StartAt": "SendApprovalRequest",
  "States": {
    "SendApprovalRequest": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
      "Parameters": {
        "QueueUrl": "https://sqs.us-east-1.amazonaws.com/123456789012/ApprovalQueue",
        "MessageBody": {
          "TaskToken.$": "$$.Task.Token",
          "RequestDetails.$": "$.request"
        }
      },
      "TimeoutSeconds": 86400,
      "Next": "CheckApproval",
      "Catch": [
        {
          "ErrorEquals": ["States.Timeout"],
          "Next": "ApprovalTimeout"
        }
      ]
    },
    "CheckApproval": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.approved",
          "BooleanEquals": true,
          "Next": "Approved"
        }
      ],
      "Default": "Rejected"
    },
    "Approved": { "Type": "Succeed" },
    "Rejected": {
      "Type": "Fail",
      "Error": "RequestRejected",
      "Cause": "The request was rejected by approver"
    },
    "ApprovalTimeout": {
      "Type": "Fail",
      "Error": "ApprovalTimeout",
      "Cause": "No approval received within 24 hours"
    }
  }
}
```

---

## Liên kết

- [AWS Step Functions - What is Step Functions?](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)
- [AWS Step Functions Developer Guide](https://docs.aws.amazon.com/step-functions/latest/dg/)
- [AWS Step Functions API Reference](https://docs.aws.amazon.com/step-functions/latest/apireference/)
- [AWS Step Functions Pricing](https://aws.amazon.com/step-functions/pricing/)
- [AWS Step Functions Features](https://aws.amazon.com/step-functions/features/)
- [AWS Step Functions Use Cases](https://aws.amazon.com/step-functions/use-cases/)
- [Step Functions Workflow Studio](https://docs.aws.amazon.com/step-functions/latest/dg/workflow-studio.html)
- [The Step Functions Workshop](https://catalog.workshops.aws/stepfunctions)

---

## Key Takeaways

1. **Step Functions = Serverless Workflow Orchestration** - Kết hợp AWS services thành workflows có visual editor
2. **2 Workflow Types** - Standard (long-running, exactly-once, 1 năm) vs Express (high-volume, 5 phút, at-least-once)
3. **8 State Types** - Task, Choice, Parallel, Map, Wait, Pass, Succeed, Fail
4. **200+ AWS Integrations** - Gọi trực tiếp AWS services không cần Lambda wrapper
5. **3 Integration Patterns** - Request Response, Run a Job (.sync), Wait for Callback
6. **Built-in Error Handling** - Retry với exponential backoff + Catch fallback
7. **Distributed Map** - Xử lý large-scale data song song (lên tới 10,000 child executions)
8. **Free Tier vĩnh viễn** - 4,000 Standard state transitions/tháng (không hết hạn sau 12 tháng)
9. **Dùng Step Functions khi**: Cần orchestrate nhiều services, complex workflows, human approval, error handling
10. **Dùng EventBridge khi**: Event routing đơn giản, choreography pattern, nhiều consumers
