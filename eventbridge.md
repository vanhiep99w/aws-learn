# Amazon EventBridge


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. Core Concepts](#1-core-concepts)
- [2. Event Buses](#2-event-buses)
- [3. Rules & Event Patterns](#3-rules-event-patterns)
- [4. Targets](#4-targets)
- [5. Event Replay & Archive](#5-event-replay-archive)
- [6. Schema Registry](#6-schema-registry)
- [7. Pipes](#7-pipes)
- [8. Scheduler](#8-scheduler)
- [9. Security](#9-security)
- [10. Best Practices](#10-best-practices)
- [11. Common Exam Questions](#11-common-exam-questions)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Amazon EventBridge** là serverless **event bus** service để xây dựng event-driven architectures. Nó là phiên bản nâng cấp của CloudWatch Events.

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENTBRIDGE OVERVIEW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   EVENT SOURCES                EVENT BUS              TARGETS   │
│   ┌──────────────┐         ┌─────────────┐      ┌───────────┐  │
│   │ AWS Services │────────→│             │─────→│  Lambda   │  │
│   │ (S3, EC2...) │         │             │      └───────────┘  │
│   └──────────────┘         │  EventBridge│      ┌───────────┐  │
│   ┌──────────────┐         │   Event Bus │─────→│    SQS    │  │
│   │  Custom Apps │────────→│             │      └───────────┘  │
│   └──────────────┘         │  ┌────────┐ │      ┌───────────┐  │
│   ┌──────────────┐         │  │ Rules  │ │─────→│    SNS    │  │
│   │   SaaS Apps  │────────→│  └────────┘ │      └───────────┘  │
│   │(Zendesk,etc) │         │             │      ┌───────────┐  │
│   └──────────────┘         └─────────────┘─────→│Step Funcs │  │
│                                                 └───────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### EventBridge vs SNS vs SQS

| Feature | EventBridge | SNS | SQS |
|---------|-------------|-----|-----|
| **Model** | Event Bus | Pub/Sub | Queue |
| **Filtering** | Advanced (100+ rules) | Basic | None |
| **Targets** | 20+ AWS services | Limited | Consumer apps |
| **Schema** | Schema Registry | No | No |
| **Replay** | Archive & Replay | No | No |
| **SaaS Integration** | Yes | No | No |

---

1. [Core Concepts](#1-core-concepts)
2. [Event Buses](#2-event-buses)
3. [Rules & Event Patterns](#3-rules--event-patterns)
4. [Targets](#4-targets)
5. [Event Replay & Archive](#5-event-replay--archive)
6. [Schema Registry](#6-schema-registry)
7. [Pipes](#7-pipes)
8. [Scheduler](#8-scheduler)
9. [Security](#9-security)
10. [Best Practices](#10-best-practices)

---

## 1. Core Concepts

### 1.1 Events

```
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT STRUCTURE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   {                                                             │
│     "version": "0",                                             │
│     "id": "12345678-1234-1234-1234-123456789012",               │
│     "detail-type": "EC2 Instance State-change Notification",    │
│     "source": "aws.ec2",                                        │
│     "account": "123456789012",                                  │
│     "time": "2024-01-01T00:00:00Z",                             │
│     "region": "us-east-1",                                      │
│     "resources": [                                              │
│       "arn:aws:ec2:us-east-1:123456789012:instance/i-1234"      │
│     ],                                                          │
│     "detail": {                                                 │
│       "instance-id": "i-1234567890abcdef0",                     │
│       "state": "stopped"                                        │
│     }                                                           │
│   }                                                             │
│                                                                 │
│   Key Fields:                                                   │
│   • source      → Who sent the event                            │
│   • detail-type → What type of event                            │
│   • detail      → Actual event data (varies by source)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│              EVENTBRIDGE COMPONENTS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌────────────────────────────────────────────────────────┐   │
│   │                     EVENT BUS                          │   │
│   │  ┌─────────────────────────────────────────────────┐   │   │
│   │  │                   RULES                         │   │   │
│   │  │  ┌───────────────┐    ┌───────────────┐        │   │   │
│   │  │  │ Rule 1        │    │ Rule 2        │        │   │   │
│   │  │  │ ┌───────────┐ │    │ ┌───────────┐ │        │   │   │
│   │  │  │ │Event      │ │    │ │Event      │ │        │   │   │
│   │  │  │ │Pattern    │ │    │ │Pattern    │ │        │   │   │
│   │  │  │ └───────────┘ │    │ └───────────┘ │        │   │   │
│   │  │  │       ↓       │    │       ↓       │        │   │   │
│   │  │  │ ┌───────────┐ │    │ ┌───────────┐ │        │   │   │
│   │  │  │ │ Targets   │ │    │ │ Targets   │ │        │   │   │
│   │  │  │ │(Lambda,   │ │    │ │(SQS,      │ │        │   │   │
│   │  │  │ │ SQS...)   │ │    │ │ SNS...)   │ │        │   │   │
│   │  │  │ └───────────┘ │    │ └───────────┘ │        │   │   │
│   │  │  └───────────────┘    └───────────────┘        │   │   │
│   │  └─────────────────────────────────────────────────┘   │   │
│   └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Event Buses

### 2.1 Types of Event Buses

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT BUS TYPES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. DEFAULT EVENT BUS:                                         │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • Receives events from AWS services                    │  │
│   │  • One per account per region                           │  │
│   │  • Cannot delete                                        │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   2. CUSTOM EVENT BUS:                                          │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • For your own application events                      │  │
│   │  • Can create multiple                                  │  │
│   │  • Can share cross-account                              │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   3. PARTNER EVENT BUS:                                         │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • SaaS integrations (Zendesk, Datadog, Auth0...)       │  │
│   │  • Created when you enable partner integration          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Cross-Account Event Sharing

```
┌─────────────────────────────────────────────────────────────────┐
│              CROSS-ACCOUNT EVENTS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Account A (Source)                Account B (Target)          │
│   ┌───────────────────┐            ┌───────────────────┐       │
│   │ Event Bus         │            │ Event Bus         │       │
│   │ ┌───────────────┐ │            │ ┌───────────────┐ │       │
│   │ │ Rule          │ │            │ │ Rule          │ │       │
│   │ │ Target: →──────┼┼────────────┼→│               │ │       │
│   │ │ Account B Bus │ │            │ │ Target:Lambda │ │       │
│   │ └───────────────┘ │            │ └───────────────┘ │       │
│   └───────────────────┘            └───────────────────┘       │
│                                                                 │
│   Requirements:                                                 │
│   • Resource-based policy on target event bus                   │
│   • Allow source account to put events                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Rules & Event Patterns

### 3.1 Event Pattern Matching

```
┌─────────────────────────────────────────────────────────────────┐
│                   EVENT PATTERN EXAMPLES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BASIC MATCHING:                                               │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Match all EC2 state changes:                           │  │
│   │  {                                                      │  │
│   │    "source": ["aws.ec2"],                               │  │
│   │    "detail-type": ["EC2 Instance State-change"]         │  │
│   │  }                                                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   CONTENT FILTERING:                                            │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Match only "stopped" state:                            │  │
│   │  {                                                      │  │
│   │    "source": ["aws.ec2"],                               │  │
│   │    "detail": {                                          │  │
│   │      "state": ["stopped"]                               │  │
│   │    }                                                    │  │
│   │  }                                                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Advanced Pattern Operators

| Operator | Example | Matches |
|----------|---------|---------|
| **Exact** | `"state": ["running"]` | state = "running" |
| **Prefix** | `"source": [{"prefix": "aws."}]` | source starts with "aws." |
| **Suffix** | `"file": [{"suffix": ".png"}]` | file ends with ".png" |
| **Anything-but** | `"state": [{"anything-but": "running"}]` | state != "running" |
| **Numeric** | `"price": [{"numeric": [">", 100]}]` | price > 100 |
| **Exists** | `"detail.error": [{"exists": true}]` | error field exists |
| **IP** | `"ip": [{"cidr": "10.0.0.0/24"}]` | IP in CIDR range |
| **OR** | `"state": ["running", "stopped"]` | state = running OR stopped |

### 3.3 Complex Pattern Example

```json
{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Instance State-change Notification"],
  "detail": {
    "state": ["terminated", "stopped"],
    "instance-id": [{"prefix": "i-prod-"}]
  }
}
```
→ Match EC2 events when production instances are stopped or terminated

---

## 4. Targets

### 4.1 Supported Targets

```
┌─────────────────────────────────────────────────────────────────┐
│                     TARGET TYPES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   COMPUTE:                    MESSAGING:                        │
│   • Lambda                    • SQS                             │
│   • ECS Task                  • SNS                             │
│   • Step Functions            • Kinesis Data Streams            │
│   • Batch Job                 • Kinesis Firehose                │
│   • EC2 (Create Snapshot)     • EventBridge Bus (another)       │
│                                                                 │
│   ORCHESTRATION:              API:                              │
│   • CodePipeline              • API Gateway                     │
│   • CodeBuild                 • API Destination (HTTP)          │
│   • Systems Manager                                             │
│                                                                 │
│   STORAGE:                    OTHER:                            │
│   • S3 (via Batch)            • CloudWatch Log Group            │
│   • Redshift                  • Incident Manager                │
│                                                                 │
│   ⚠️ Max 5 targets per rule                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 API Destinations

```
┌─────────────────────────────────────────────────────────────────┐
│                  API DESTINATIONS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Send events to ANY HTTP endpoint:                             │
│                                                                 │
│   EventBridge → API Destination → External API                  │
│                       │                                         │
│                       ↓                                         │
│              ┌─────────────────┐                                │
│              │ Connection      │                                │
│              │ (API Key,       │                                │
│              │  OAuth, Basic)  │                                │
│              └─────────────────┘                                │
│                                                                 │
│   Use Cases:                                                    │
│   • Slack/Teams notifications                                   │
│   • Webhook integrations                                        │
│   • Third-party APIs                                            │
│   • Internal microservices                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Input Transformation

```
┌─────────────────────────────────────────────────────────────────┐
│                INPUT TRANSFORMATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Transform event before sending to target:                     │
│                                                                 │
│   Original Event:                                               │
│   {                                                             │
│     "detail": {                                                 │
│       "instance-id": "i-123",                                   │
│       "state": "stopped"                                        │
│     }                                                           │
│   }                                                             │
│                                                                 │
│   Input Transformer:                                            │
│   InputPathsMap: { "id": "$.detail.instance-id" }               │
│   InputTemplate: "Instance <id> was stopped!"                   │
│                                                                 │
│   Target receives:                                              │
│   "Instance i-123 was stopped!"                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Event Replay & Archive

### 5.1 Archive

```
┌─────────────────────────────────────────────────────────────────┐
│                      ARCHIVE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Event Bus                       Archive                       │
│   ┌──────────────┐              ┌──────────────┐               │
│   │ Events       │─────────────→│ Stored       │               │
│   │              │              │ Events       │               │
│   └──────────────┘              └──────────────┘               │
│                                       │                         │
│                                       ↓                         │
│                               ┌──────────────┐                  │
│                               │   Replay     │                  │
│                               │ (to event    │                  │
│                               │    bus)      │                  │
│                               └──────────────┘                  │
│                                                                 │
│   Settings:                                                     │
│   • Retention: 1 day - Indefinitely                             │
│   • Filter: Optional event pattern                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Replay Use Cases

| Use Case | Description |
|----------|-------------|
| **Debugging** | Replay events to debug failed processing |
| **Testing** | Test new rules with historical events |
| **Recovery** | Re-process events after fixing bugs |
| **New Consumers** | Catch up new services with past events |

---

## 6. Schema Registry

### 6.1 Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   SCHEMA REGISTRY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Store and manage event schemas:                               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Events → Schema Discovery → Schema Registry           │  │
│   │                                      │                  │  │
│   │                                      ↓                  │  │
│   │                             ┌─────────────────┐         │  │
│   │                             │ Code Bindings   │         │  │
│   │                             │ (Java, Python,  │         │  │
│   │                             │  TypeScript)    │         │  │
│   │                             └─────────────────┘         │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Features:                                                     │
│   • Auto-discover schemas from events                           │
│   • Version control                                             │
│   • Generate code bindings                                      │
│   • OpenAPI 3.0 / JSONSchema Draft 4                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Pipes

### 7.1 EventBridge Pipes

```
┌─────────────────────────────────────────────────────────────────┐
│                   EVENTBRIDGE PIPES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Point-to-point integration with optional processing:          │
│                                                                 │
│   Source → (Filter) → (Enrichment) → Target                     │
│                                                                 │
│   ┌────────┐  ┌────────┐  ┌────────────┐  ┌────────┐           │
│   │ Source │→ │ Filter │→ │ Enrichment │→ │ Target │           │
│   │        │  │(pattern)│  │ (Lambda)   │  │        │           │
│   └────────┘  └────────┘  └────────────┘  └────────┘           │
│                                                                 │
│   Sources:             Targets:                                 │
│   • DynamoDB Streams   • Lambda                                 │
│   • Kinesis Streams    • Step Functions                         │
│   • SQS                • API Gateway                            │
│   • Kafka (MSK)        • EventBridge Bus                        │
│   • MQ (ActiveMQ)      • SNS, SQS, Kinesis                      │
│                                                                 │
│   Use Cases:                                                    │
│   • Stream processing with enrichment                           │
│   • Replace Lambda glue code                                    │
│   • DynamoDB → EventBridge integration                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Pipes vs Rules

| | Pipes | Rules |
|---|-------|-------|
| **Model** | Point-to-point | Fan-out |
| **Sources** | Streaming (DynamoDB, Kinesis, SQS, Kafka) | Event Bus |
| **Enrichment** | Yes (Lambda, API Gateway, Step Functions) | No (use input transformer) |
| **Max Targets** | 1 | 5 |
| **Use Case** | Stream to target | Event routing |

---

## 8. Scheduler

### 8.1 EventBridge Scheduler

```
┌─────────────────────────────────────────────────────────────────┐
│                 EVENTBRIDGE SCHEDULER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Schedule tasks at scale (millions of schedules):              │
│                                                                 │
│   SCHEDULE TYPES:                                               │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Rate-based:    rate(5 minutes)                         │  │
│   │  Cron:          cron(0 12 * * ? *)  ← Every day at noon │  │
│   │  One-time:      at(2024-12-31T23:59:00)                 │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   vs CloudWatch Events scheduled rules:                         │
│   • More scalable (millions vs thousands)                       │
│   • Better time zone support                                    │
│   • Flexible retry policy                                       │
│   • One-time schedules                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Scheduler Targets

Same as EventBridge rules: Lambda, Step Functions, SQS, SNS, etc.

---

## 9. Security

### 9.1 IAM & Resource Policies

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   IAM POLICIES:                                                 │
│   • events:PutEvents     → Send events                          │
│   • events:PutRule       → Create rules                         │
│   • events:PutTargets    → Add targets to rules                 │
│                                                                 │
│   RESOURCE-BASED POLICIES:                                      │
│   • On Event Bus: Allow cross-account event sending             │
│   • On Rules: Allow other accounts to manage                    │
│                                                                 │
│   ENCRYPTION:                                                   │
│   • Events encrypted in transit (HTTPS)                         │
│   • Archive encryption with KMS                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Best Practices

### 10.1 Design Patterns

| Pattern | Description |
|---------|-------------|
| **Event Sourcing** | Store all events, replay to rebuild state |
| **Fan-out** | One event triggers multiple targets |
| **Cross-Account** | Central event bus, distributed consumers |
| **Event Enrichment** | Add context via Pipes + Lambda |

### 10.2 Recommendations

| Practice | Recommendation |
|----------|---------------|
| **Event Design** | Use consistent naming, include correlation IDs |
| **Filtering** | Filter at EventBridge, not in target |
| **Dead Letter Queue** | Configure DLQ for each target |
| **Retry** | Use built-in retry with backoff |
| **Archive** | Enable for critical events |

---

## 11. Common Exam Questions

### Q1: EventBridge vs SNS?
**A:** EventBridge = advanced filtering, schema registry, replay. SNS = simple pub/sub.

### Q2: Max targets per rule?
**A:** 5 targets

### Q3: How to integrate with third-party APIs?
**A:** API Destinations with Connection (auth)

### Q4: How to replay past events?
**A:** Archive events, then create Replay

### Q5: EventBridge Pipes vs Rules?
**A:** Pipes = point-to-point + enrichment. Rules = fan-out routing.

### Q6: Cross-account events?
**A:** Resource-based policy on target event bus

---

## Tài liệu tham khảo

- [Amazon EventBridge User Guide](https://docs.aws.amazon.com/eventbridge/latest/userguide/)
- [Event Patterns](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
- [EventBridge Pipes](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-pipes.html)
