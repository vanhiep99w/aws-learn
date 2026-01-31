# AWS Support Resources

## Mục lục

- [Tổng quan](#tổng-quan)
- [AWS re:Post (Developer Forums)](#aws-repost-developer-forums)
- [AWS Documentation](#aws-documentation)
- [AWS Knowledge Center](#aws-knowledge-center)
- [AWS Prescriptive Guidance](#aws-prescriptive-guidance)
- [AWS Whitepapers](#aws-whitepapers)
- [AWS Blogs](#aws-blogs)
- [AWS Training và Certification](#aws-training-và-certification)
- [AWS Professional Services](#aws-professional-services)
- [AWS Managed Services](#aws-managed-services)
- [So sánh các Support Resources](#so-sánh-các-support-resources)
- [Exam Tips](#exam-tips)

---

## Tổng quan

AWS cung cấp nhiều **FREE resources** để học và troubleshoot, ngoài các Support Plans có phí:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS SUPPORT RESOURCES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FREE RESOURCES                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • AWS re:Post (Community Q&A)                          │   │
│  │  • AWS Documentation                                     │   │
│  │  • AWS Knowledge Center                                  │   │
│  │  • AWS Whitepapers                                       │   │
│  │  • AWS Blogs                                             │   │
│  │  • AWS Training (Free digital courses)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   PAID SUPPORT                           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • AWS Support Plans (Developer/Business/Enterprise)    │   │
│  │  • AWS Professional Services                             │   │
│  │  • AWS Managed Services (AMS)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS re:Post (Developer Forums)

### re:Post là gì?

**AWS re:Post** = Cộng đồng hỏi đáp chính thức của AWS, thay thế AWS Discussion Forums cũ.

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS re:Post                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔗 https://repost.aws/                                         │
│                                                                  │
│  Workflow:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  1. Search → Tìm câu hỏi/answer đã có                  │   │
│  │                 │                                       │   │
│  │                 ▼                                       │   │
│  │  2. Ask Question → Đặt câu hỏi mới                     │   │
│  │                 │                                       │   │
│  │                 ▼                                       │   │
│  │  3. Get Answers → Community + AWS Experts trả lời      │   │
│  │                 │                                       │   │
│  │                 ▼                                       │   │
│  │  4. Accept Answer → Đánh dấu giải quyết               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Đặc điểm

| Feature | Mô tả |
|---------|-------|
| **Free** | Miễn phí cho tất cả AWS users |
| **Community-driven** | AWS users giúp đỡ lẫn nhau |
| **AWS Experts** | AWS engineers cũng tham gia trả lời |
| **Searchable** | Index bởi search engines |
| **Reputation** | Points, badges như Stack Overflow |
| **Private spaces** | Enterprise customers có private communities |

### Khi nào dùng re:Post?

| ✅ Nên dùng | ❌ Không nên dùng |
|------------|-------------------|
| Câu hỏi kỹ thuật chung | Vấn đề cần support ngay (dùng Support) |
| Best practices | Account/billing issues |
| Troubleshooting errors | Sensitive/confidential info |
| Learning từ community | Production outages |

---

## AWS Documentation

### Docs là gì?

**AWS Documentation** = Tài liệu chính thức, chi tiết cho mọi AWS service.

🔗 https://docs.aws.amazon.com/

### Các loại Documentation

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **User Guides** | Hướng dẫn sử dụng chi tiết | EC2 User Guide |
| **Developer Guides** | Cho developers, API usage | Lambda Developer Guide |
| **API Reference** | Chi tiết mọi API operations | EC2 API Reference |
| **CLI Reference** | AWS CLI commands | `aws ec2 describe-instances` |
| **SDK References** | Các language SDKs | Boto3 (Python), AWS SDK for Java |
| **Tutorials** | Step-by-step guides | "Getting Started with S3" |

---

## AWS Knowledge Center

### Knowledge Center là gì?

**Knowledge Center** = Bộ sưu tập các **FAQ** và **troubleshooting articles** phổ biến nhất.

🔗 https://aws.amazon.com/premiumsupport/knowledge-center/

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Knowledge Center                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  "How do I..." articles:                                         │
│                                                                  │
│  • How do I reset my root password?                             │
│  • How do I troubleshoot EC2 connectivity issues?               │
│  • How do I reduce my S3 costs?                                 │
│  • How do I configure VPC peering?                              │
│                                                                  │
│  → Short, focused answers cho common questions                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Prescriptive Guidance

### Prescriptive Guidance là gì?

**Prescriptive Guidance** = Best practices, patterns, và guides cho **cloud migrations và modernization**.

🔗 https://aws.amazon.com/prescriptive-guidance/

| Content Type | Mô tả |
|--------------|-------|
| **Migration patterns** | Strategies cho migrating workloads |
| **Modernization guides** | Refactoring legacy apps |
| **Implementation guides** | Step-by-step implementations |
| **Architecture patterns** | Proven architectural designs |

---

## AWS Whitepapers

### Whitepapers là gì?

**AWS Whitepapers** = Technical documents về architecture, security, best practices.

🔗 https://aws.amazon.com/whitepapers/

### Whitepapers quan trọng cho exam

| Whitepaper | Nội dung |
|------------|----------|
| **AWS Well-Architected Framework** | 6 pillars của cloud architecture |
| **AWS Security Best Practices** | Security guidelines |
| **Architecting for the Cloud** | Cloud-native design principles |
| **AWS Pricing** | Pricing models và optimization |
| **Overview of Amazon Web Services** | Tổng quan tất cả services |

---

## AWS Blogs

### Blogs là gì?

**AWS Blogs** = Announcements, deep dives, và tutorials từ AWS teams.

🔗 https://aws.amazon.com/blogs/

| Blog | Focus |
|------|-------|
| **AWS News Blog** | Service announcements, new features |
| **Architecture Blog** | Design patterns, case studies |
| **Security Blog** | Security best practices, updates |
| **DevOps Blog** | CI/CD, automation, IaC |
| **Database Blog** | RDS, DynamoDB, Aurora tips |

---

## AWS Training và Certification

### Training Resources

| Resource | Cost | Mô tả |
|----------|------|-------|
| **AWS Skill Builder** | Free tier + Paid | Digital courses, labs |
| **AWS Classroom Training** | Paid | Instructor-led training |
| **AWS Workshops** | Free | Hands-on workshops |
| **AWS Events** | Free/Paid | re:Invent, Summits |

🔗 https://aws.amazon.com/training/

---

## AWS Professional Services

### Professional Services là gì?

**AWS Professional Services** = Đội ngũ **chuyên gia tư vấn của AWS** giúp customers với cloud migrations và transformations.

```
┌─────────────────────────────────────────────────────────────────┐
│                AWS PROFESSIONAL SERVICES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AWS gửi consultants đến làm việc trực tiếp với bạn:            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📋 Migration Planning                                   │   │
│  │     └─ Đánh giá, lập kế hoạch migration                 │   │
│  │                                                         │   │
│  │  🏗️ Architecture Design                                 │   │
│  │     └─ Thiết kế solution trên AWS                       │   │
│  │                                                         │   │
│  │  🚀 Implementation                                       │   │
│  │     └─ Triển khai, migrate workloads                    │   │
│  │                                                         │   │
│  │  📚 Training & Enablement                                │   │
│  │     └─ Đào tạo team của bạn                             │   │
│  │                                                         │   │
│  │  🔒 Security Assessments                                 │   │
│  │     └─ Đánh giá và cải thiện security                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  💰 Cost: Project-based (very expensive - enterprise level)    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Khi nào dùng Professional Services?

| ✅ Nên dùng | ❌ Không cần |
|------------|-------------|
| Large-scale migrations (100+ servers) | Small migrations |
| Enterprise transformations | Simple deployments |
| Thiếu expertise in-house | Có AWS-certified team |
| Complex, mission-critical workloads | Standard workloads |
| Need hands-on AWS guidance | Self-service đủ |

### So sánh với Support Plans

| Aspect | Professional Services | Support Plans |
|--------|----------------------|---------------|
| **Type** | Proactive consulting | Reactive support |
| **Who** | AWS consultants on-site | Support engineers via tickets |
| **Focus** | Projects, migrations | Issues, troubleshooting |
| **Engagement** | Project-based | Subscription |
| **Cost** | Very high (custom quotes) | Monthly fee |

---

## AWS Managed Services

### Managed Services (AMS) là gì?

**AWS Managed Services (AMS)** = AWS **operates your infrastructure** cho bạn.

```
┌─────────────────────────────────────────────────────────────────┐
│                  AWS MANAGED SERVICES (AMS)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AWS quản lý infrastructure của bạn 24/7:                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Your Apps ────────────────►  Bạn quản lý              │   │
│  │                                                         │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │                                                         │   │
│  │  OS, Patching ────────────►  AWS AMS quản lý           │   │
│  │  Monitoring   ────────────►  AWS AMS quản lý           │   │
│  │  Security     ────────────►  AWS AMS quản lý           │   │
│  │  Backup       ────────────►  AWS AMS quản lý           │   │
│  │  Compliance   ────────────►  AWS AMS quản lý           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  → Bạn focus vào business, AWS lo infrastructure               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AMS bao gồm gì?

| Service | Mô tả |
|---------|-------|
| **Incident Management** | 24/7 monitoring và response |
| **Security Management** | Patching, compliance, vulnerability scanning |
| **Change Management** | Deployment, config changes |
| **Backup & Recovery** | Automated backups, DR |
| **Reporting** | Operational reports, dashboards |

---

## So sánh các Support Resources

| Resource | Type | Cost | Best For |
|----------|------|------|----------|
| **re:Post** | Community Q&A | FREE | Technical questions, troubleshooting |
| **Documentation** | Official docs | FREE | Learning services, API reference |
| **Knowledge Center** | FAQ articles | FREE | Common issues, how-to |
| **Whitepapers** | Technical papers | FREE | Deep dive, exam prep |
| **Blogs** | Articles | FREE | New features, case studies |
| **Skill Builder** | Training | FREE/Paid | Structured learning |
| **Support Plans** | Direct support | Paid | Production issues, TAM |

---

## Exam Tips

> [!IMPORTANT]
> **Cloud Practitioner Exam**: Biết phân biệt các FREE vs PAID support resources!

### Câu hỏi thường gặp

| Scenario | Answer |
|----------|--------|
| "Free community-based Q&A?" | **AWS re:Post** |
| "Official technical documentation?" | **AWS Documentation** |
| "Common troubleshooting articles?" | **AWS Knowledge Center** |
| "Best practices whitepapers?" | **AWS Whitepapers** |
| "24/7 technical support?" | **Support Plans** (Business/Enterprise) |
| "Dedicated Technical Account Manager?" | **Enterprise Support** |

### Key Points

- **re:Post** = FREE community support (không có SLA)
- **Support Plans** = PAID với response time SLAs
- **Documentation/Whitepapers** = Self-service learning resources
- **Knowledge Center** = Curated FAQs từ common support cases

---

## Tài liệu tham khảo

- [AWS re:Post](https://repost.aws/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [AWS Knowledge Center](https://aws.amazon.com/premiumsupport/knowledge-center/)
- [AWS Whitepapers](https://aws.amazon.com/whitepapers/)
- [AWS Training](https://aws.amazon.com/training/)
