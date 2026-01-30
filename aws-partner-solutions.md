# AWS Partner Solutions (formerly Quick Starts)

## Tổng quan

**AWS Partner Solutions** (trước đây gọi là **AWS Quick Starts**) là các **reference deployments** được tự động hóa, được xây dựng bởi AWS Solutions Architects và AWS Partners để giúp bạn deploy các công nghệ phổ biến trên AWS **nhanh chóng và đúng best practices**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Partner Solutions                         │
│            (formerly AWS Quick Starts)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   "Deploy popular technologies on AWS in minutes"                │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  CloudFormation Templates + Deployment Guide             │   │
│   │        ↓                                                  │   │
│   │  Production-ready architecture in minutes                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Trước: Days/Weeks để setup manually                           │
│   Sau:   Minutes/Hours với Partner Solutions                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**URL:** [https://aws.amazon.com/solutions/partners/](https://aws.amazon.com/solutions/partners/)

---

## Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Automated Deployment** | Sử dụng CloudFormation templates |
| **Best Practices** | Được AWS Solutions Architects review |
| **Production-Ready** | Multi-AZ, HA, security best practices |
| **Well-Documented** | Có deployment guide chi tiết |
| **Free** | Chỉ trả tiền cho AWS resources được tạo |
| **Partner-Built** | Hợp tác với vendors như HashiCorp, MongoDB, Datadog... |

---

## Thành phần của Partner Solution

Mỗi Partner Solution thường bao gồm:

```
┌─────────────────────────────────────────────────────────────────┐
│                  Partner Solution Components                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CloudFormation Template(s)                                  │
│     └── Infrastructure as Code (IaC)                            │
│     └── Automated resource provisioning                         │
│                                                                  │
│  2. Deployment Guide                                             │
│     └── Architecture diagrams                                    │
│     └── Step-by-step instructions                               │
│     └── Configuration options                                    │
│     └── Cost estimates                                           │
│                                                                  │
│  3. Architecture Diagram                                         │
│     └── Visual representation của infrastructure                │
│     └── Multi-AZ design                                          │
│                                                                  │
│  4. Partner Software (optional)                                  │
│     └── AMIs với pre-installed software                         │
│     └── License (BYOL hoặc qua AWS Marketplace)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Options

Hầu hết Partner Solutions cung cấp 2-3 deployment options:

| Option | Mô tả | Use Case |
|--------|-------|----------|
| **Deploy into new VPC** | Tạo VPC mới với tất cả components | Bắt đầu từ đầu, PoC |
| **Deploy into existing VPC** | Dùng VPC có sẵn | Production, có infrastructure rồi |
| **Deploy with minimal resources** | Phiên bản nhỏ gọn | Dev/Test, tiết kiệm chi phí |

---

## Các loại Partner Solutions

### 1. Infrastructure Solutions

```
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Solutions                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  • Kubernetes (Amazon EKS)                                       │
│  • HashiCorp Vault / Consul / Terraform                         │
│  • Active Directory                                              │
│  • Bastion Hosts                                                 │
│  • VPN Solutions                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Database Solutions

| Solution | Mô tả |
|----------|-------|
| **MongoDB** | NoSQL database cluster |
| **PostgreSQL** | High-availability PostgreSQL |
| **MySQL** | MySQL cluster setup |
| **Couchbase** | Distributed NoSQL |
| **Redis** | In-memory data store |

### 3. DevOps & CI/CD

- GitLab
- Jenkins
- Atlassian (Jira, Confluence, Bitbucket)
- Sonatype Nexus

### 4. Security & Compliance

- CrowdStrike Falcon
- Splunk
- Trend Micro
- Palo Alto Networks

### 5. Analytics & Big Data

- Tableau
- Snowflake
- Databricks
- Elasticsearch

---

## Cách sử dụng Partner Solution

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment Workflow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Tìm Solution                                                 │
│     └── https://aws.amazon.com/solutions/partners/              │
│     └── Tìm theo technology hoặc partner                        │
│                                                                  │
│  2. Đọc Deployment Guide                                         │
│     └── Hiểu architecture                                        │
│     └── Review prerequisites                                     │
│     └── Xem cost estimate                                        │
│                                                                  │
│  3. Launch Stack                                                 │
│     └── Click "Launch Stack" button                             │
│     └── Redirect tới CloudFormation console                     │
│     └── Fill in parameters                                       │
│                                                                  │
│  4. Wait for Deployment                                          │
│     └── CloudFormation tự động tạo resources                    │
│     └── Thường mất 15-45 phút                                   │
│                                                                  │
│  5. Access & Configure                                           │
│     └── Outputs tab có URLs, endpoints                          │
│     └── Configure application                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Parameters thường gặp

| Parameter | Mô tả |
|-----------|-------|
| **VPC CIDR** | IP range cho VPC mới |
| **Availability Zones** | Chọn AZs để deploy |
| **Instance Type** | EC2 instance size |
| **Key Pair** | SSH key để access |
| **Admin Password** | Password cho admin user |
| **License Key** | Nếu BYOL (Bring Your Own License) |

---

## Architecture Patterns

### Typical Multi-AZ Architecture

```
                        ┌──────────────────────────────────────┐
                        │              Region                   │
                        │                                       │
                        │    ┌─────────────────────────────┐   │
                        │    │            VPC               │   │
                        │    │                              │   │
                        │    │   ┌───────┐    ┌───────┐    │   │
                        │    │   │  AZ-a │    │  AZ-b │    │   │
                        │    │   │       │    │       │    │   │
        Internet ───────┼────┼──►│  ALB  │◄───│  ALB  │    │   │
                        │    │   │       │    │       │    │   │
                        │    │   │┌─────┐│    │┌─────┐│    │   │
                        │    │   ││ EC2 ││    ││ EC2 ││    │   │
                        │    │   │└─────┘│    │└─────┘│    │   │
                        │    │   │       │    │       │    │   │
                        │    │   │┌─────┐│    │┌─────┐│    │   │
                        │    │   ││ RDS ││◄───││ RDS ││    │   │
                        │    │   ││(Pri)││    ││(Sec)││    │   │
                        │    │   │└─────┘│    │└─────┘│    │   │
                        │    │   └───────┘    └───────┘    │   │
                        │    └─────────────────────────────┘   │
                        └──────────────────────────────────────┘
```

### Security Best Practices (Built-in)

```
┌─────────────────────────────────────────────────────────────────┐
│               Security Best Practices                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Public/Private subnets separation                           │
│  ✅ Security groups với least privilege                         │
│  ✅ IAM roles với minimum permissions                           │
│  ✅ Encryption at rest (EBS, S3, RDS)                           │
│  ✅ Encryption in transit (TLS/SSL)                             │
│  ✅ CloudWatch logging enabled                                   │
│  ✅ Multi-AZ for high availability                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ví dụ: Deploy HashiCorp Vault

```
Partner Solution: HashiCorp Vault on AWS

Components được tạo:
├── VPC với public/private subnets (2 AZs)
├── Auto Scaling Group với Vault instances
├── Application Load Balancer
├── DynamoDB tables (storage backend)
├── KMS key (auto-unseal)
├── IAM roles và policies
├── CloudWatch alarms
└── Security groups

Thời gian deploy: ~30 phút
Chi phí estimate: ~$200-400/month (tùy instance type)
```

---

## So sánh với các phương pháp khác

| Phương pháp | Thời gian | Best Practices | Repeatable |
|-------------|-----------|----------------|------------|
| **Manual Setup** | Days/Weeks | Phụ thuộc kỹ năng | ❌ |
| **Custom CloudFormation** | Hours/Days | Phải tự implement | ✅ |
| **Partner Solutions** | Minutes | ✅ Built-in | ✅ |
| **AWS Marketplace AMI** | Minutes | Varies | ❌ (single instance) |

---

## Khi nào nên dùng Partner Solutions?

### Nên dùng ✅

- Cần deploy nhanh production-ready environment
- Muốn learn best practices từ AWS architects
- PoC/Demo cho stakeholders
- Base template để customize thêm

### Không nên dùng ❌

- Cần architecture rất khác biệt
- Chi phí resources quá cao cho use case
- Cần fine-grained control từ đầu

---

## Liên quan đến AWS Marketplace

```
┌─────────────────────────────────────────────────────────────────┐
│         Partner Solutions vs AWS Marketplace                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Partner Solutions:                                              │
│  └── Focus: Full architecture deployment                        │
│  └── Output: VPC + EC2 + RDS + networking...                   │
│  └── Cost: Only AWS resources                                   │
│                                                                  │
│  AWS Marketplace:                                                │
│  └── Focus: Software licensing + deployment                     │
│  └── Output: AMI hoặc SaaS subscription                        │
│  └── Cost: AWS resources + software license                     │
│                                                                  │
│  Integration: Nhiều Partner Solutions dùng Marketplace AMIs     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Exam Tips cho Cloud Practitioner

> [!IMPORTANT]
> **Keywords để nhớ:**
> - Partner Solutions = Quick Starts (tên cũ)
> - Automated reference deployments
> - CloudFormation templates + Deployment Guide
> - Deploy in minutes, not days
> - Best practices built-in

### Câu hỏi thường gặp

| Câu hỏi | Trả lời |
|---------|---------|
| Quick Starts bây giờ gọi là gì? | **Partner Solutions** |
| Partner Solutions dùng công nghệ gì để deploy? | **CloudFormation** |
| Ai tạo Partner Solutions? | AWS Solutions Architects + **Partners** |
| Partner Solutions có miễn phí không? | **Có** (chỉ trả tiền resources) |
| Partner Solutions deploy nhanh cỡ nào? | **Minutes** thay vì days/weeks |

### Phân biệt với các services khác

```
┌─────────────────────────┬─────────────────────────────────────┐
│       Service           │              Purpose                 │
├─────────────────────────┼─────────────────────────────────────┤
│ Partner Solutions       │ Full architecture deployment         │
│ AWS Marketplace         │ Software licensing + purchase       │
│ AWS Service Catalog     │ Internal approved products          │
│ CloudFormation          │ IaC (build your own templates)      │
│ Elastic Beanstalk       │ App deployment (PaaS)               │
└─────────────────────────┴─────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────┐
│                AWS Partner Solutions Summary                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Automated reference deployments                             │
│  ✅ Built by AWS + Partners (HashiCorp, MongoDB, Datadog...)    │
│  ✅ CloudFormation templates + Deployment Guide                 │
│  ✅ Production-ready, Multi-AZ, Security best practices         │
│  ✅ Deploy in minutes instead of days/weeks                     │
│  ✅ Free (only pay for AWS resources)                           │
│                                                                  │
│  Nhớ: "Quick Starts" = "Partner Solutions" (tên mới)            │
│  URL: https://aws.amazon.com/solutions/partners/                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
