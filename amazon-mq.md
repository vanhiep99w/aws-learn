# Amazon MQ


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. Broker Engines](#1-broker-engines)
- [2. Architecture](#2-architecture)
- [3. Deployment Modes](#3-deployment-modes)
- [4. Protocols & Features](#4-protocols-features)
- [5. Security](#5-security)
- [6. So sánh SQS/SNS vs Amazon MQ](#6-so-sánh-sqssns-vs-amazon-mq)
- [7. Best Practices](#7-best-practices)
- [8. Common Exam Questions](#8-common-exam-questions)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Amazon MQ** là managed message broker service hỗ trợ **Apache ActiveMQ** và **RabbitMQ**. Dành cho việc **migrate** từ on-premises messaging systems sang AWS mà không cần thay đổi code.

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHY AMAZON MQ?                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   On-Premises                              AWS                  │
│   ┌──────────────┐                    ┌──────────────┐         │
│   │  ActiveMQ /  │                    │  SQS + SNS   │         │
│   │  RabbitMQ /  │  ──Migrate to──→   │              │         │
│   │  IBM MQ      │                    │  (Cloud-     │         │
│   │              │                    │   native)    │         │
│   └──────────────┘                    └──────────────┘         │
│         │                                   │                   │
│         │  ❌ Requires code changes         │                   │
│         │  ❌ Different APIs                │                   │
│         │                                   │                   │
│         ↓                                   │                   │
│   ┌──────────────┐                         │                   │
│   │  Amazon MQ   │ ←── OR migrate to ──────┘                   │
│   │  (Managed    │                                             │
│   │   Broker)    │                                             │
│   └──────────────┘                                             │
│         │                                                       │
│         ✅ Same APIs (AMQP, MQTT, OpenWire, STOMP)              │
│         ✅ No code changes needed                               │
│         ✅ Managed by AWS                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Khi nào dùng Amazon MQ vs SQS/SNS?

| Scenario | Recommend |
|----------|-----------|
| **New cloud-native app** | SQS + SNS |
| **Migrate existing apps using standard protocols** | Amazon MQ |
| **Need AMQP, MQTT, STOMP, OpenWire** | Amazon MQ |
| **Serverless, auto-scaling** | SQS + SNS |
| **Maximum throughput, unlimited scale** | SQS + SNS |

---

1. [Broker Engines](#1-broker-engines)
2. [Architecture](#2-architecture)
3. [Deployment Modes](#3-deployment-modes)
4. [Protocols & Features](#4-protocols--features)
5. [Security](#5-security)
6. [So sánh SQS/SNS vs Amazon MQ](#6-so-sánh-sqssns-vs-amazon-mq)
7. [Best Practices](#7-best-practices)

---

## 1. Broker Engines

### 1.1 Apache ActiveMQ

```
┌─────────────────────────────────────────────────────────────────┐
│                    APACHE ACTIVEMQ                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Features:                                                     │
│   • Queue và Topic support                                      │
│   • Multiple protocols: OpenWire, STOMP, AMQP, MQTT             │
│   • Mature, widely used                                         │
│   • Complex routing patterns                                    │
│                                                                 │
│   Instance Types:                                               │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  mq.t3.micro   → Dev/Test (cheaper)                     │  │
│   │  mq.m5.large   → Production                             │  │
│   │  mq.m5.xlarge  → High throughput                        │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Storage:                                                      │
│   • EFS (shared storage for HA)                                 │
│   • EBS (single instance)                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 RabbitMQ

```
┌─────────────────────────────────────────────────────────────────┐
│                      RABBITMQ                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Features:                                                     │
│   • AMQP 0-9-1 protocol                                         │
│   • Advanced routing (exchanges, bindings)                      │
│   • Lightweight, fast                                           │
│   • Plugin ecosystem                                            │
│                                                                 │
│   Key Concepts:                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Producer → Exchange → Binding → Queue → Consumer      │  │
│   │                                                         │  │
│   │   Exchange Types:                                       │  │
│   │   • Direct   → Route by exact routing key               │  │
│   │   • Topic    → Route by pattern matching                │  │
│   │   • Fanout   → Broadcast to all queues                  │  │
│   │   • Headers  → Route by message headers                 │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Storage: EBS only (faster but not shared)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 ActiveMQ vs RabbitMQ

| Feature | ActiveMQ | RabbitMQ |
|---------|----------|----------|
| **Protocols** | OpenWire, STOMP, AMQP, MQTT | AMQP 0-9-1 |
| **Routing** | Basic | Advanced (Exchanges) |
| **HA Storage** | EFS (shared) | Cluster replication |
| **Management UI** | Web console | Management plugin |
| **Use Case** | JMS-based Java apps | Modern microservices |

---

## 2. Architecture

### 2.1 Single-Instance Broker

```
┌─────────────────────────────────────────────────────────────────┐
│                  SINGLE-INSTANCE BROKER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────────────────────────────────────────┐     │
│   │                   Single AZ                          │     │
│   │  ┌─────────────────────────────────────────────┐     │     │
│   │  │              Amazon MQ Broker               │     │     │
│   │  │                                             │     │     │
│   │  │   ┌─────────────┐    ┌─────────────┐        │     │     │
│   │  │   │   ActiveMQ  │ or │  RabbitMQ   │        │     │     │
│   │  │   │   Instance  │    │  Instance   │        │     │     │
│   │  │   └──────┬──────┘    └──────┬──────┘        │     │     │
│   │  │          │                  │               │     │     │
│   │  │          ↓                  ↓               │     │     │
│   │  │   ┌─────────────────────────────────┐       │     │     │
│   │  │   │          EBS Storage            │       │     │     │
│   │  │   └─────────────────────────────────┘       │     │     │
│   │  └─────────────────────────────────────────────┘     │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                 │
│   ⚠️  Not recommended for production (no failover)              │
│   ✅ Good for development/testing                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Active/Standby Broker (ActiveMQ)

```
┌─────────────────────────────────────────────────────────────────┐
│              ACTIVE/STANDBY (HIGH AVAILABILITY)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────┐    ┌─────────────────────┐           │
│   │     AZ 1            │    │     AZ 2            │           │
│   │  ┌───────────────┐  │    │  ┌───────────────┐  │           │
│   │  │    ACTIVE     │  │    │  │   STANDBY     │  │           │
│   │  │   (Running)   │  │    │  │  (Waiting)    │  │           │
│   │  └───────┬───────┘  │    │  └───────┬───────┘  │           │
│   └──────────│──────────┘    └──────────│──────────┘           │
│              │                          │                       │
│              └──────────┬───────────────┘                       │
│                         ↓                                       │
│              ┌─────────────────────────┐                        │
│              │   Amazon EFS (shared)   │                        │
│              │   Message Storage       │                        │
│              └─────────────────────────┘                        │
│                                                                 │
│   Failover:                                                     │
│   • Active fails → Standby takes over (1-2 minutes)             │
│   • Same DNS endpoint, transparent to clients                   │
│   • Messages persisted in EFS                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Cluster Deployment (RabbitMQ)

```
┌─────────────────────────────────────────────────────────────────┐
│              RABBITMQ CLUSTER DEPLOYMENT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                      VPC                                │  │
│   │  ┌─────────┐    ┌─────────┐    ┌─────────┐              │  │
│   │  │  AZ 1   │    │  AZ 2   │    │  AZ 3   │              │  │
│   │  │ ┌─────┐ │    │ ┌─────┐ │    │ ┌─────┐ │              │  │
│   │  │ │Node1│◄├────┼─┤Node2│◄├────┼─┤Node3│ │              │  │
│   │  │ └─────┘ │    │ └─────┘ │    │ └─────┘ │              │  │
│   │  └─────────┘    └─────────┘    └─────────┘              │  │
│   │                                                         │  │
│   │        Message replication across nodes                 │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   • 3 or 5 nodes across AZs                                     │
│   • Quorum queues for high availability                         │
│   • Automatic leader election                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Deployment Modes

| Mode | Engine | Use Case | HA |
|------|--------|----------|-----|
| **Single-Instance** | ActiveMQ, RabbitMQ | Dev/Test | ❌ |
| **Active/Standby** | ActiveMQ only | Production HA | ✅ |
| **Cluster** | RabbitMQ only | Production HA | ✅ |

### Network Accessibility

```
┌─────────────────────────────────────────────────────────────────┐
│              NETWORK ACCESS OPTIONS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PUBLIC ACCESS:                                                │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Internet ──→ Internet Gateway ──→ Amazon MQ            │  │
│   │  • Accessible from anywhere                             │  │
│   │  • ⚠️ Security risk (use strong auth)                   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   PRIVATE ACCESS (Recommended):                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  VPC only ──→ Amazon MQ (private endpoints)             │  │
│   │  • Not accessible from internet                         │  │
│   │  • Access via VPN, Direct Connect, or VPC peering       │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Protocols & Features

### 4.1 Supported Protocols

| Protocol | Description | Port |
|----------|-------------|------|
| **OpenWire** | Native ActiveMQ protocol | 61617 |
| **AMQP 1.0** | Advanced Message Queuing Protocol | 5671 |
| **STOMP** | Simple Text Oriented Messaging | 61614 |
| **MQTT** | IoT messaging protocol | 8883 |
| **WebSocket** | Browser-based clients | 61619 |

### 4.2 Message Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                  MESSAGE PATTERNS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   QUEUE (Point-to-Point):                                       │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Producer ──→ Queue ──→ Consumer (1 message = 1 consumer)│  │
│   │                                                         │  │
│   │  Similar to SQS                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   TOPIC (Pub/Sub):                                              │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Publisher ──→ Topic ──┬──→ Subscriber 1                │  │
│   │                        ├──→ Subscriber 2                │  │
│   │                        └──→ Subscriber 3                │  │
│   │                                                         │  │
│   │  Similar to SNS                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Virtual Topics (ActiveMQ):                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Combine Topic semantics with Queue guarantees          │  │
│   │  Publisher ──→ Virtual Topic ──→ Consumer Queue 1       │  │
│   │                               ──→ Consumer Queue 2       │  │
│   │                                                         │  │
│   │  Similar to SNS + SQS Fan-out                           │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Security

### 5.1 Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   AUTHENTICATION:                                               │
│   • Username/Password (Simple Authentication)                   │
│   • LDAP integration (ActiveMQ)                                 │
│                                                                 │
│   AUTHORIZATION:                                                │
│   • Broker-level permissions                                    │
│   • Queue/Topic-level access control                            │
│                                                                 │
│   ENCRYPTION:                                                   │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  In-transit: TLS/SSL (required for public brokers)      │  │
│   │  At-rest: SSE with KMS                                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   NETWORK:                                                      │
│   • Security Groups                                             │
│   • VPC endpoints                                               │
│   • Private deployment                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. So sánh SQS/SNS vs Amazon MQ

### 6.1 Bảng so sánh

| Feature | **SQS/SNS** | **Amazon MQ** |
|---------|-------------|---------------|
| **Type** | Cloud-native | Managed broker |
| **Protocol** | AWS APIs | AMQP, MQTT, STOMP, OpenWire |
| **Scaling** | Unlimited, auto | Limited by instance |
| **Management** | Serverless | Manage instances |
| **Migration** | New apps | Lift-and-shift |
| **Cost** | Pay per message | Pay per instance hour |
| **Features** | Basic | Rich (routing, transactions) |
| **HA** | Built-in | Configure Active/Standby |

### 6.2 Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION TREE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Building new cloud-native application?                        │
│        │                                                        │
│   ┌────┴────┐                                                   │
│   ↓         ↓                                                   │
│  YES       NO                                                   │
│   │         │                                                   │
│   ↓         ↓                                                   │
│  SQS/     Migrating existing app?                               │
│  SNS           │                                                │
│           ┌────┴────┐                                           │
│           ↓         ↓                                           │
│          YES       NO                                           │
│           │         │                                           │
│           ↓         ↓                                           │
│       Amazon MQ   Need AMQP/MQTT/JMS?                           │
│                        │                                        │
│                   ┌────┴────┐                                   │
│                   ↓         ↓                                   │
│                  YES       NO                                   │
│                   │         │                                   │
│                   ↓         ↓                                   │
│               Amazon MQ   SQS/SNS                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Best Practices

### 7.1 When to use Amazon MQ

| Use Case | Recommendation |
|----------|---------------|
| Migrate from on-prem ActiveMQ/RabbitMQ | ✅ Amazon MQ |
| Need JMS compatibility | ✅ Amazon MQ (ActiveMQ) |
| Need AMQP/MQTT protocols | ✅ Amazon MQ |
| New serverless application | ❌ Use SQS/SNS |
| Need unlimited scale | ❌ Use SQS/SNS |

### 7.2 Production Recommendations

| Practice | Recommendation |
|----------|---------------|
| **Deployment** | Active/Standby hoặc Cluster |
| **Network** | Private access (VPC only) |
| **Instance size** | Start with m5.large, scale up |
| **Monitoring** | CloudWatch metrics + Broker logs |
| **Backup** | Automatic + manual snapshots |

### 7.3 High Availability

```
┌─────────────────────────────────────────────────────────────────┐
│                HA RECOMMENDATIONS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ActiveMQ:                                                     │
│   • Use Active/Standby with EFS                                 │
│   • Enable automatic failover                                   │
│   • Configure client reconnection                               │
│                                                                 │
│   RabbitMQ:                                                     │
│   • Use 3-node cluster across AZs                               │
│   • Use Quorum Queues (not Classic Mirrored)                    │
│   • Configure publisher confirms                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Common Exam Questions

### Q1: When to use Amazon MQ over SQS/SNS?
**A:** Migrate existing apps using JMS, AMQP, MQTT, STOMP. No code changes needed.

### Q2: Amazon MQ HA modes?
**A:** Single-instance (no HA), Active/Standby (ActiveMQ), Cluster (RabbitMQ)

### Q3: Storage for ActiveMQ HA?
**A:** Amazon EFS (shared storage between Active/Standby)

### Q4: Protocols supported?
**A:** OpenWire, AMQP, STOMP, MQTT, WebSocket

### Q5: Can Amazon MQ scale automatically like SQS?
**A:** No, limited by broker instance size. SQS has unlimited scale.

---

## Tài liệu tham khảo

- [Amazon MQ Developer Guide](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/)
- [Amazon MQ FAQs](https://aws.amazon.com/amazon-mq/faqs/)
- [ActiveMQ vs RabbitMQ](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/choosing-broker.html)
