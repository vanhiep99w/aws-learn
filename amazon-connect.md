# Amazon Connect

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Kiến trúc và thành phần](#kiến-trúc-và-thành-phần)
- [Tính năng chính](#tính-năng-chính)
- [Contact Flows](#contact-flows)
- [Amazon Connect AI/ML Features](#amazon-connect-aiml-features)
- [Tích hợp với các dịch vụ AWS khác](#tích-hợp-với-các-dịch-vụ-aws-khác)
- [Pricing](#pricing)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

> [!NOTE]
> **Đừng nhầm lẫn!** Amazon Connect ≠ AWS Direct Connect
> - **Amazon Connect**: Dịch vụ **contact center** (tổng đài) - xây dựng hệ thống CSKH trên cloud
> - **AWS Direct Connect**: Dịch vụ **networking** - kết nối mạng riêng từ on-premises đến AWS
>
> Xem thêm: [AWS Direct Connect](./direct-connect.md)

## Giới thiệu

**Amazon Connect** là dịch vụ **Contact Center as a Service (CCaaS)** được xây dựng trên cùng công nghệ mà Amazon sử dụng cho hệ thống chăm sóc khách hàng của chính họ.

### Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Cloud-native** | 100% trên cloud, không cần phần cứng |
| **Omnichannel** | Hỗ trợ voice, chat, tasks, email |
| **Pay-per-use** | Chỉ trả tiền cho phút sử dụng |
| **Self-service** | Dễ dàng setup và quản lý |
| **AI-powered** | Tích hợp sẵn AI/ML capabilities |
| **Scalable** | Tự động scale từ 10 đến hàng chục nghìn agents |

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Amazon Connect Overview                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Customers                    Amazon Connect                    Agents      │
│                                                                              │
│   ┌─────────┐                 ┌──────────────────┐          ┌─────────────┐  │
│   │ 📞 Phone│────────────────►│                  │──────────►│ Agent CCP  │  │
│   └─────────┘                 │                  │          │ (Softphone) │  │
│                               │   Contact        │          └─────────────┘  │
│   ┌─────────┐                 │   Center          │                          │
│   │ 💬 Chat  │────────────────►│                  │         ┌─────────────┐  │
│   └─────────┘                 │   ┌────────────┐ │─────────►│ Supervisor  │  │
│   │          │ Contact         │                  │         │ Dashboard   │  │
│   ┌─────────┐                 │   │ Flows      │ │          └─────────────┘  │
│   │ 📧 Email │────────────────►│                  └─────────┘             │  │
│   └─────────┘                 │                  │          ┌─────────────┐  │
│   │         ┌─────────────────┐                  │─────────►│ Analytics   │  │
│   ┌─────────┐                 │   │ AI/ML      │ │          │ Reports     │  │
│   │ 📱 SMS   │────────────────►│   │ Features   │ │         └─────────────┘  │
│   └─────────┘                 │                  └──────────┘             │  │
│                               └──────────────────┘                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Kiến trúc và thành phần

### Các thành phần chính

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Amazon Connect Architecture                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Amazon Connect Instance                         │ │
│  │                                                                         │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │ │
│  │  │  Phone        │  │  Routing      │  │  Queues       │                │ │
│  │  │  Numbers      │  │  Profiles     │  │               │                │ │
│  │  │  (DID/Toll-   │  │               │  │  • Sales      │                │ │
│  │  │   free)       │  │               │  │  • Support    │                │ │
│  │  └───────────────┘  └───────────────┘  │  • Billing    │                │ │
│  │                                         └───────────────┘               │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │ │
│  │  │  Contact      │  │  Hours of     │  │  Users        │                │ │
│  │  │  Flows        │  │  Operation    │  │  (Agents)     │                │ │
│  │  │  (IVR Logic)  │  │               │  │               │                │ │
│  │  └───────────────┘  └───────────────┘  └───────────────┘                │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Integrations:                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Lambda   │ │ Lex      │ │ Kinesis  │ │ S3       │ │ DynamoDB │            │
│  │          │ │ (Bots)   │ │(Streams) │ │(Record)  │ │          │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Thành phần chi tiết

| Thành phần | Mô tả |
|------------|-------|
| **Instance** | Container chính chứa toàn bộ cấu hình contact center |
| **Phone Numbers** | Số điện thoại DID hoặc Toll-free từ AWS |
| **Contact Flows** | IVR logic định nghĩa trải nghiệm khách hàng |
| **Queues** | Hàng đợi để routing contacts đến đúng agents |
| **Routing Profiles** | Quy định agent nào handle queue nào |
| **Hours of Operation** | Giờ làm việc của contact center |
| **Users** | Agents, supervisors, admins |

---

## Tính năng chính

### 1. Voice (Điện thoại)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Voice Features                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Inbound/Outbound Calls                                       │
│  • Softphone (CCP - Contact Control Panel)                      │
│  • Desk phone support                                           │
│  • Call recording                                               │
│  • Real-time transcription                                      │
│  • Voicemail                                                    │
│  • Callback in queue                                            │
│  • High-quality audio (OPUS codec)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Chat

| Tính năng | Mô tả |
|-----------|-------|
| **Web Chat** | Widget có thể nhúng vào website |
| **Mobile Chat** | SDK cho iOS và Android |
| **Persistent Chat** | Lưu lịch sử chat xuyên suốt sessions |
| **Rich Messaging** | Hỗ trợ attachments, links, formatted text |
| **Chat Transcripts** | Lưu trữ toàn bộ conversation |

### 3. Tasks

```
┌─────────────────────────────────────────────────────────────────┐
│                         Tasks Feature                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cho phép agents quản lý công việc ngoài contacts:              │
│                                                                 │
│  • Follow-up tasks từ cuộc gọi/chat                             │
│  • CRM integrations (Salesforce, Zendesk)                       │
│  • External systems via API                                     │
│  • Task routing giống như voice/chat                            │
│                                                                 │
│  Use case:                                                      │
│  Agent nhận cuộc gọi → tạo task "Follow up sau 24h"             │
│  → Task được route đến agent available                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Agent Workspace

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          Agent Workspace (CCP)                            │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  ┌──────────────┐  ┌──────────────────────────────────────────┐     │  │
│  │  │   Contact    │  │           Customer Profile                │    │  │
│  │  │   Controls   │  │                                          │     │  │
│  │  │              │  │  Name: John Doe                          │     │  │
│  │  │  📞 Answer   │  │  Phone: +1-xxx-xxx-xxxx                  │     │  │
│  │  │  🔇 Mute     │  │  Last Contact: 3 days ago                │     │  │
│  │  │  ⏸️ Hold     │  │  Open Cases: 2                           │     │  │
│  │  │  📲 Transfer │  │                                          │     │  │
│  │  │  ❌ End      │  └──────────────────────────────────────────┘     │  │
│  │  │              │                                                   │  │
│  │  └──────────────┘  ┌──────────────────────────────────────────┐     │  │
│  │                    │           Agent Assist                    │    │  │
│  │  Status:           │                                          │     │  │
│  │  🟢 Available      │  Suggested Response:                     │     │  │
│  │  🟡 After Call     │  "I understand you're having an issue    │     │  │
│  │  🔴 Offline        │   with your billing..."                  │     │  │
│  │                    │                                          │     │  │
│  │                    │  Knowledge Articles:                     │     │  │
│  │                    │  • Billing FAQ                           │     │  │
│  │                    │  • Refund Policy                         │     │  │
│  │                    └──────────────────────────────────────────┘     │  │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Contact Flows

**Contact Flow** là trái tim của Amazon Connect - định nghĩa trải nghiệm khách hàng từ khi gọi đến đến khi kết thúc.

### Các loại Contact Flow

| Loại | Mục đích |
|------|----------|
| **Inbound Contact Flow** | Flow chính cho inbound contacts |
| **Customer Queue Flow** | Trải nghiệm khi khách đang chờ trong queue |
| **Customer Whisper Flow** | Thông báo cho khách trước khi connect với agent |
| **Agent Whisper Flow** | Thông báo cho agent trước khi nhận call |
| **Transfer to Agent Flow** | Khi transfer đến agent cụ thể |
| **Transfer to Queue Flow** | Khi transfer đến queue khác |
| **Outbound Whisper Flow** | Cho outbound campaigns |

### Ví dụ Contact Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Example: Customer Service Contact Flow                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐            │
│  │ Customer │───►│ Play     │───►│ Get      │───►│ Check Hours  │            │
│  │ Calls    │    │ Welcome  │    │ Customer │    │ of Operation │            │
│  └──────────┘    │ Message  │    │ Input    │    └──────┬───────┘            │
│                  └──────────┘    └──────────┘            │                   │
│                                                          │                   │
│                    ┌─────────────────────────────────────┴─────────────┐     │
│                    │                                                   │     │
│                    ▼                                                   ▼     │
│            ┌──────────────┐                               ┌──────────────┐   │
│            │ Within Hours │                               │ Outside Hours│   │
│            └──────┬───────┘                               └──────┬───────┘   │
│                   │                                               │          │
│                   ▼                                              ▼           │
│        ┌─────────────────────┐                     ┌──────────────────────┐  │
│        │ Press 1: Sales      │                     │ Leave Voicemail      │  │
│        │ Press 2: Support    │                     │ or                   │  │
│        │ Press 3: Billing    │                     │ Request Callback     │  │
│        └──────────┬──────────┘                     └──────────────────────┘  │
│                    │                                                         │
│         ┌─────────┴─────────┐                                                │
│         │                    │                                               │
│         ▼                   ▼                                                │
│  ┌─────────────┐    ┌─────────────┐                                          │
│  │ Invoke      │    │ Transfer to │                                          │
│  │ Lex Bot     │    │ Queue       │                                          │
│  │ (Self-serve)│    │             │                                          │
│  └──────┬──────┘    └──────┬──────┘                                          │
│         │                   │                                                │
│         ▼                  ▼                                                 │
│  ┌─────────────┐    ┌─────────────┐                                          │
│  │ Resolved?   │    │ Agent       │                                          │
│  │ Yes/No      │    │ Available   │                                          │
│  └─────────────┘    └─────────────┘                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Contact Flow Blocks

| Block Type | Mô tả |
|------------|-------|
| **Play prompt** | Phát audio hoặc text-to-speech |
| **Get customer input** | DTMF hoặc speech input |
| **Set working queue** | Đặt queue cho contact |
| **Transfer to queue** | Chuyển contact vào queue |
| **Invoke AWS Lambda** | Gọi Lambda function |
| **Set contact attributes** | Lưu metadata của contact |
| **Check contact attributes** | Conditional branching |
| **Invoke Lex bot** | Chuyển sang conversational AI |

---

## Amazon Connect AI/ML Features

### 1. Contact Lens

**Contact Lens for Amazon Connect** cung cấp real-time và post-call analytics sử dụng ML.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Contact Lens Features                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Real-time Analysis                      Post-call Analysis                  │
│  ──────────────────                      ──────────────────                  │
│                                                                              │
│  • Real-time transcription               • Full call transcription           │
│  • Sentiment detection                   • Sentiment trends                  │
│  • Issue detection                       • Theme detection                   │
│  • Supervisor alerts                     • Conversation characteristics      │
│  • Agent assist prompts                  • Compliance detection              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │                    Sentiment Timeline                              │      │
│  │                                                                    │      │
│  │   😊 ──────────╮                    ╭────────── 😊                 │      │
│  │                │                    │                               │     │
│  │   😐 ──────────┼────────────────────┼────────────────────── 😐     │      │
│  │                │                    │                               │     │
│  │   😠 ──────────┴────────────────────┴────────────────────── 😠     │      │
│  │       Start              Issue mentioned        Resolved    End    │      │
│  │                                                                    │      │
│  └────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2. Amazon Q in Connect (Wisdom)

| Tính năng | Mô tả |
|-----------|-------|
| **Real-time recommendations** | Gợi ý knowledge articles trong lúc call |
| **Intent detection** | Tự động detect customer intent |
| **Search** | Tìm kiếm knowledge base |
| **Integration** | Kết nối với Salesforce, ServiceNow, etc. |

### 3. Voice ID

```
┌─────────────────────────────────────────────────────────────────┐
│                         Voice ID                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Biometric voice authentication:                                │
│                                                                 │
│  1. Enrollment (lần đầu)                                        │
│     Customer nói → Voiceprint được tạo và lưu                   │
│                                                                 │
│  2. Authentication (các lần sau)                                │
│     Customer gọi → So sánh voice với voiceprint                 │
│                  → Authenticated hoặc Not authenticated         │
│                                                                 │
│  3. Fraud Detection                                             │
│     So sánh voice với known fraudster voiceprints               │
│     → Alert nếu match                                           │
│                                                                 │
│  Benefits:                                                      │
│  ✅ Giảm thời gian xác thực từ 30-60s xuống vài giây            │
│  ✅ Tăng bảo mật - không thể đánh cắp như password              │
│  ✅ Cải thiện customer experience                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Outbound Campaigns

```
┌─────────────────────────────────────────────────────────────────┐
│                     High-volume Outbound Campaigns              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Predictive dialing                                           │
│  • ML-powered answering machine detection                       │
│  • Campaign management                                          │
│  • List management                                              │
│  • Time zone aware calling                                      │
│  • Integration với Pinpoint                                     │
│                                                                 │
│  Use cases:                                                     │
│  • Appointment reminders                                        │
│  • Payment reminders                                            │
│  • Marketing campaigns                                          │
│  • Surveys                                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tích hợp với các dịch vụ AWS khác

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Amazon Connect + AWS Services                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              Amazon Connect                                  │
│                                    │                                         │
│     ┌──────────────────────────────┼──────────────────────────────┐          │
│     │              │               │               │               │         │
│     ▼              ▼               ▼               ▼              ▼          │
│  ┌──────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐      │
│  │Lambda│    │Amazon Lex│    │ Kinesis  │    │   S3    │    │DynamoDB │      │
│  │      │    │          │    │          │    │         │    │         │      │
│  │Custom│    │Chatbots  │    │Real-time │    │Call     │    │Customer │      │
│  │Logic │    │IVR       │    │Analytics │    │Recording│    │Data     │      │
│  └──────┘    └──────────┘    └──────────┘    └─────────┘    └─────────┘      │
│                                    │                                         │
│                    ┌───────────────┴───────────────┐                         │
│                    ▼                               ▼                         │
│              ┌──────────┐                    ┌──────────┐                    │
│              │QuickSight│                    │ Redshift │                    │
│              │          │                    │          │                    │
│              │BI Reports│                    │Analytics │                    │
│              └──────────┘                    └──────────┘                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tích hợp phổ biến

| Service | Integration |
|---------|-------------|
| **AWS Lambda** | Custom logic trong Contact Flows, data lookup, CRM integration |
| **Amazon Lex** | Conversational bots, IVR tự động |
| **Amazon S3** | Lưu trữ call recordings, chat transcripts |
| **Kinesis Data Streams** | Real-time contact trace records (CTRs) |
| **Amazon Polly** | Natural text-to-speech cho prompts |
| **AWS IAM** | Access control cho users và resources |
| **CloudWatch** | Monitoring và alerting |
| **EventBridge** | Event-driven integrations |

---

## Pricing

### Mô hình giá

Amazon Connect sử dụng mô hình **pay-per-use**, không có upfront costs, long-term commitments, hoặc minimum fees.

### Chi phí chính

| Component | Pricing (US East) |
|-----------|-------------------|
| **Voice - Inbound** | $0.018/minute |
| **Voice - Outbound** | $0.018/minute + telephony |
| **Chat** | $0.004/message |
| **Tasks** | $0.04/task |
| **Phone Numbers (DID)** | $0.03/day |
| **Phone Numbers (Toll-free)** | $0.06/day |

### Ví dụ tính giá

```
┌─────────────────────────────────────────────────────────────────┐
│               Monthly Cost Example                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Small Contact Center (10 agents, 10,000 calls/month)           │
│                                                                 │
│  Assumptions:                                                   │
│  • Average call duration: 5 minutes                             │
│  • 80% inbound, 20% outbound                                    │
│  • 5 DID phone numbers                                          │
│                                                                 │
│  Voice Usage:                                                   │
│    10,000 calls × 5 min = 50,000 minutes                        │
│    50,000 min × $0.018 = $900.00                                │
│                                                                 │
│  Phone Numbers:                                                 │
│    5 DID × $0.03/day × 30 days = $4.50                          │
│                                                                 │
│  ─────────────────────────────────────────                      │
│  ESTIMATED TOTAL: ~$904.50/month                                │
│  (+ telephony charges for outbound)                             │
│                                                                 │
│  So với on-premises: Tiết kiệm 50-80%                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Free Tier

| Feature | Free Tier |
|---------|-----------|
| **Voice** | 90 minutes/month (12 months) |
| **Chat** | 500 messages/month (12 months) |
| **Phone Number** | 1 DID included (12 months) |

---

## Use Cases

### 1. Customer Service Center

```
Scenario: E-commerce company cần hệ thống CSKH
Solution: Amazon Connect + Lex + Contact Lens
Benefits:
  • Self-service bots cho FAQ
  • Agent assist cho complex issues
  • Sentiment analysis để cải thiện quality
```

### 2. Technical Support

```
Scenario: SaaS company cần technical support hotline
Solution: Amazon Connect + Lambda (CRM lookup) + Wisdom
Benefits:
  • Customer identification tự động
  • Knowledge base suggestions
  • Escalation workflows
```

### 3. Healthcare Contact Center

```
Scenario: Bệnh viện cần appointment scheduling
Solution: Amazon Connect + Lex + HIPAA compliance
Benefits:
  • Automated appointment booking
  • Prescription refill requests
  • Compliant call recording
```

### 4. Financial Services

```
Scenario: Ngân hàng cần secure customer authentication
Solution: Amazon Connect + Voice ID + MFA
Benefits:
  • Biometric authentication
  • Fraud detection
  • Reduced handle time
```

---

## Best Practices

### 1. Contact Flow Design

| Practice | Mô tả |
|----------|-------|
| **Simple menus** | Tối đa 4-5 options per menu |
| **Announce wait time** | Cho khách biết thời gian chờ |
| **Callback option** | Cung cấp callback thay vì wait |
| **Test thoroughly** | Test tất cả branches trước production |

### 2. Agent Experience

```
┌─────────────────────────────────────────────────────────────────┐
│                  Agent Experience Best Practices                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Cung cấp đủ context trước khi connect call                  │
│  ✅ Tích hợp CRM để agent có customer info                      │
│  ✅ Sử dụng Agent Assist để suggest responses                   │
│  ✅ Monitor và coach với Contact Lens                           │
│  ✅ Reasonable break time giữa các calls                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Quality Management

- Enable **Contact Lens** cho tất cả calls
- Set up **alerts** cho negative sentiment
- Regular **coaching** based on analytics
- **A/B test** Contact Flows

### 4. Security

| Aspect | Recommendation |
|--------|----------------|
| **Access control** | Least privilege với IAM |
| **Data protection** | Enable encryption at rest và in transit |
| **Compliance** | Enable call recording cho compliance |
| **Authentication** | Implement Voice ID cho secure auth |

---

## Exam Tips

### Key Points for AWS Exams

1. **Amazon Connect vs AWS Direct Connect**
   - Connect = Contact Center (CSKH)
   - Direct Connect = Networking (kết nối on-prem)

2. **Pricing Model**
   - Pay-per-minute/message
   - No upfront, no long-term commitment
   - Tiết kiệm 50-80% so với on-premises

3. **Core Features**
   - Omnichannel: Voice, Chat, Tasks
   - Contact Flows = IVR logic
   - CCP = Agent softphone

4. **AI/ML Features**
   - Contact Lens = Analytics + Transcription + Sentiment
   - Voice ID = Biometric authentication
   - Lex integration = Chatbots/IVR

5. **Integration**
   - Lambda cho custom logic
   - S3 cho call recording
   - Kinesis cho real-time CTRs

### Common Exam Scenarios

| Scenario | Answer |
|----------|--------|
| Cloud-based contact center | Amazon Connect |
| Biometric voice authentication | Voice ID |
| Real-time sentiment analysis | Contact Lens |
| IVR chatbot | Amazon Lex + Connect |
| Call recording storage | S3 |
| Real-time analytics | Kinesis + Connect |

---

## So sánh với các giải pháp khác

| Feature | Amazon Connect | Genesys Cloud | Twilio Flex |
|---------|----------------|---------------|-------------|
| **Deployment** | Cloud-native | Cloud | Cloud |
| **Pricing** | Per-minute | Per-user/month | Per-hour |
| **AI/ML** | Built-in | Add-on | Add-on |
| **AWS Integration** | Native | Limited | Limited |
| **Customization** | High | Medium | Very High |
| **Setup time** | Minutes | Days-weeks | Days |

---

## Liên kết liên quan

- [AWS Direct Connect](./direct-connect.md) - Networking service (khác hoàn toàn!)
- [Amazon Lex](./aws-ai-ml-services.md) - Chatbot service
- [AWS Lambda](./lambda.md)
- [Amazon S3](./s3.md)
- [Amazon Kinesis](./kinesis.md)
