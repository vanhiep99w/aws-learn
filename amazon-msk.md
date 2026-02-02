# Amazon MSK (Managed Streaming for Apache Kafka)


## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
- [Các thành phần chính](#các-thành-phần-chính)
- [MSK Serverless vs Provisioned](#msk-serverless-vs-provisioned)
- [MSK Connect](#msk-connect)
- [Security](#security)
- [So sánh MSK vs Kinesis](#so-sánh-msk-vs-kinesis)
- [Pricing](#pricing)
- [Use Cases](#use-cases)
- [Exam Tips](#exam-tips)

---

## Tổng quan

**Amazon MSK** là dịch vụ **fully managed Apache Kafka** cho phép build và run applications sử dụng Kafka để xử lý streaming data.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Amazon MSK là gì?                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Apache Kafka = Open-source streaming platform                              │
│                  (pub/sub, message queue, real-time processing)              │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  Self-managed Kafka trên EC2                                        │    │
│   │  ───────────────────────────                                        │    │
│   │  ❌ Phải quản lý cluster, brokers, ZooKeeper                        │    │
│   │  ❌ Phải lo patching, scaling, monitoring                           │    │
│   │  ❌ Availability & durability tự setup                              │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  Amazon MSK (Fully Managed)                                         │    │
│   │  ──────────────────────────                                         │    │
│   │  ✅ AWS quản lý brokers, ZooKeeper (hoặc KRaft mode)                │    │
│   │  ✅ Auto patching, monitoring tích hợp                              │    │
│   │  ✅ Multi-AZ high availability                                      │    │
│   │  ✅ Data replication tự động                                        │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Lợi ích chính

| Lợi ích | Mô tả |
|---------|-------|
| **Fully managed** | AWS lo brokers, patching, monitoring |
| **Compatible** | 100% tương thích Apache Kafka APIs |
| **Highly available** | Multi-AZ replication |
| **Secure** | VPC, encryption, IAM, TLS |
| **Scalable** | Scale brokers và storage dễ dàng |

---

## Kiến trúc

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MSK Cluster Architecture                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│         PRODUCERS                           CONSUMERS                        │
│    ┌──────────────────┐                ┌──────────────────┐                 │
│    │  Application 1   │                │  Application A   │                 │
│    │  Application 2   │                │  Lambda          │                 │
│    │  IoT Devices     │                │  Kinesis Firehose│                 │
│    └────────┬─────────┘                └────────▲─────────┘                 │
│             │                                   │                            │
│             ▼                                   │                            │
│    ┌────────────────────────────────────────────┴──────────────────────┐    │
│    │                        MSK CLUSTER                                 │    │
│    │                                                                    │    │
│    │   AZ-a              AZ-b              AZ-c                        │    │
│    │  ┌────────┐        ┌────────┐        ┌────────┐                   │    │
│    │  │Broker 1│        │Broker 2│        │Broker 3│                   │    │
│    │  │        │◄──────►│        │◄──────►│        │                   │    │
│    │  │ Topic  │        │ Topic  │        │ Topic  │                   │    │
│    │  │Replica │        │Replica │        │Replica │                   │    │
│    │  └────────┘        └────────┘        └────────┘                   │    │
│    │       │                 │                 │                        │    │
│    │  ┌────────┐        ┌────────┐        ┌────────┐                   │    │
│    │  │ZooKeeper│       │ZooKeeper│       │ZooKeeper│  (hoặc KRaft)    │    │
│    │  └────────┘        └────────┘        └────────┘                   │    │
│    │                                                                    │    │
│    └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Producer ──publish──► Topic ──subscribe──► Consumer

Topic được chia thành PARTITIONS:
┌─────────────────────────────────────────────────────────────────┐
│  Topic: "orders"                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Partition 0  │ │ Partition 1  │ │ Partition 2  │             │
│  │ [1][2][3][4] │ │ [1][2][3]    │ │ [1][2][3][4] │             │
│  │ Broker 1     │ │ Broker 2     │ │ Broker 3     │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│  • Messages ordered WITHIN partition                             │
│  • Consumer groups đọc song song từ partitions                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Các thành phần chính

### 1. Brokers

| Đặc điểm | Mô tả |
|----------|-------|
| **Là gì** | Kafka servers xử lý read/write |
| **Số lượng** | Tối thiểu 2, recommended 3+ (multi-AZ) |
| **Instance types** | kafka.m5.large → kafka.m5.24xlarge |
| **Storage** | EBS volumes, auto-scaling available |

### 2. Topics & Partitions

| Thành phần | Mô tả |
|------------|-------|
| **Topic** | Category/feed của messages |
| **Partition** | Subset của topic, distributed across brokers |
| **Replication** | Copies of partitions (default: 3) |
| **Retention** | Bao lâu giữ messages (default: 7 days, max: unlimited) |

### 3. ZooKeeper vs KRaft

| Mode | Mô tả |
|------|-------|
| **ZooKeeper** | Legacy, AWS quản lý ZooKeeper nodes riêng |
| **KRaft** | Mới, không cần ZooKeeper, metadata trong Kafka brokers |

> [!TIP]
> **KRaft mode** được recommend cho clusters mới - đơn giản hơn và performance tốt hơn.

---

## MSK Serverless vs Provisioned

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    MSK Serverless vs MSK Provisioned                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   MSK SERVERLESS                           MSK PROVISIONED                   │
│   ─────────────                            ───────────────                   │
│   ✅ Auto-scales                           ✅ Full control                   │
│   ✅ No capacity planning                  ✅ Custom broker configs          │
│   ✅ Pay per use                           ✅ Predictable pricing             │
│   ❌ Limited configs                       ❌ Manual scaling                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Tiêu chí | MSK Serverless | MSK Provisioned |
|----------|----------------|-----------------|
| **Quản lý capacity** | Tự động | Manual |
| **Pricing** | Per partition-hour + data | Per broker-hour + storage |
| **Max partitions** | 120 per cluster | Unlimited |
| **Custom configs** | Limited | Full access |
| **Use case** | Variable/unpredictable workloads | Steady, predictable workloads |

---

## MSK Connect

**MSK Connect** cho phép stream data GIỮA MSK và các services khác mà không cần code.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MSK Connect                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   SOURCE CONNECTORS              MSK              SINK CONNECTORS            │
│   (Đưa data VÀO Kafka)          CLUSTER          (Lấy data RA từ Kafka)     │
│                                                                              │
│   ┌─────────────┐                                 ┌─────────────┐            │
│   │   S3        │──────►                   ──────►│   S3        │            │
│   │   RDS       │──────►  ┌─────────────┐  ──────►│   Redshift  │            │
│   │   DynamoDB  │──────►  │    MSK      │  ──────►│ OpenSearch  │            │
│   │   MongoDB   │──────►  │   Cluster   │  ──────►│   Splunk    │            │
│   │   PostgreSQL│──────►  └─────────────┘  ──────►│ Snowflake   │            │
│   └─────────────┘                                 └─────────────┘            │
│                                                                              │
│   Dùng Kafka Connect plugins (open-source hoặc commercial)                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Security

### 1. Network Security

| Layer | Options |
|-------|---------|
| **VPC** | MSK cluster trong private subnets |
| **Security Groups** | Control traffic vào brokers |
| **Private connectivity** | VPC endpoints, PrivateLink |

### 2. Encryption

| Type | Mô tả |
|------|-------|
| **At-rest** | EBS encryption với KMS |
| **In-transit** | TLS between clients và brokers |
| **In-cluster** | TLS between brokers |

### 3. Authentication & Authorization

| Method | Mô tả |
|--------|-------|
| **IAM** | AWS IAM policies cho Kafka APIs |
| **SASL/SCRAM** | Username/password authentication |
| **TLS mutual auth** | Client certificates |
| **ACLs** | Kafka Access Control Lists |

---

## So sánh MSK vs Kinesis

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          MSK vs Kinesis Data Streams                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AMAZON MSK                               KINESIS DATA STREAMS              │
│   ──────────                               ────────────────────              │
│   Apache Kafka                             AWS Proprietary                   │
│   Open-source compatible                   AWS SDK only                      │
│                                                                              │
│   ┌─────────────────────────────┐         ┌─────────────────────────────┐   │
│   │  Kafka Ecosystem            │         │  AWS Ecosystem              │   │
│   │  • Kafka clients (any lang) │         │  • AWS SDK                  │   │
│   │  • Kafka Connect            │         │  • Kinesis Firehose         │   │
│   │  • Kafka Streams            │         │  • Kinesis Analytics        │   │
│   │  • Schema Registry          │         │  • Lambda integration       │   │
│   └─────────────────────────────┘         └─────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Tiêu chí | Amazon MSK | Kinesis Data Streams |
|----------|------------|---------------------|
| **Protocol** | Apache Kafka | AWS proprietary |
| **Message size** | Default 1MB, configurable | Max 1MB |
| **Retention** | Unlimited | Max 365 days |
| **Replication** | Configurable | 3 AZs (fixed) |
| **Partition scaling** | Manual/add brokers | Shard splitting (auto available) |
| **Ordering** | Per partition | Per shard |
| **Pricing model** | Per broker + storage | Per shard-hour + data |
| **Serverless** | ✅ MSK Serverless | ✅ On-demand mode |
| **Migration from Kafka** | ✅ Easy (same APIs) | ❌ Code changes needed |

### Khi nào dùng MSK vs Kinesis?

| Scenario | Chọn |
|----------|------|
| Đã có Kafka on-premises, muốn migrate | **MSK** ✅ |
| Team đã biết Kafka ecosystem | **MSK** ✅ |
| Muốn AWS native, ít operational overhead | **Kinesis** ✅ |
| Cần Lambda trigger dễ dàng | **Kinesis** ✅ |
| Cần message retention vô hạn | **MSK** ✅ |
| Cần Kafka Connect plugins | **MSK** ✅ |

---

## Pricing

### MSK Provisioned

| Component | Pricing |
|-----------|---------|
| **Broker hours** | Per instance type per hour |
| **Storage** | Per GB-month |
| **Data transfer** | Standard AWS rates |

### MSK Serverless

| Component | Pricing |
|-----------|---------|
| **Cluster hours** | Per hour cluster runs |
| **Partition hours** | Per partition per hour |
| **Data in/out** | Per GB |
| **Storage** | Per GB-month |

---

## Use Cases

| Use Case | Mô tả |
|----------|-------|
| **Log aggregation** | Collect logs từ nhiều sources |
| **Real-time analytics** | Process streaming data |
| **Event-driven architecture** | Decouple microservices |
| **Data pipeline** | ETL, data lake ingestion |
| **IoT data streaming** | Sensor data processing |
| **Clickstream analysis** | User behavior tracking |

---

## Exam Tips

> [!IMPORTANT]
> **Các điểm quan trọng cho AWS Certification:**

### 1. MSK vs Kinesis
- **Đã có Kafka** → MSK (zero code changes)
- **AWS native** → Kinesis
- **Unlimited retention** → MSK

### 2. MSK Serverless vs Provisioned
- **Variable workload** → Serverless
- **Predictable, high throughput** → Provisioned
- **Max customization** → Provisioned

### 3. Security
- MSK trong **VPC private subnets**
- **TLS + KMS** cho encryption
- **IAM auth** cho managed authentication

### 4. Integration patterns
```
Common pattern: MSK → Lambda (via Event Source Mapping)
Common pattern: MSK → Kinesis Firehose → S3
Common pattern: MSK Connect → OpenSearch
```

### 5. Câu hỏi thường gặp

| Câu hỏi | Đáp án |
|---------|--------|
| Migrate Kafka to AWS? | **MSK** (Kafka compatible) |
| Real-time + AWS native? | **Kinesis** |
| Kafka Connect plugins? | **MSK Connect** |
| Serverless Kafka? | **MSK Serverless** |

---

## Tài liệu tham khảo

- [Amazon MSK Documentation](https://docs.aws.amazon.com/msk/)
- [MSK Developer Guide](https://docs.aws.amazon.com/msk/latest/developerguide/)
- [MSK Pricing](https://aws.amazon.com/msk/pricing/)
