# AWS Learning - Mục lục

## Fundamentals

- [x] [AWS Overview](aws-overview.md) - Lịch sử AWS, Global Infrastructure (Regions, AZs, Edge Locations)
- [x] [Cloud Computing Basics](cloud-computing-basics.md) - Traditional Server vs Cloud Computing, SLA
- [x] [Shared Responsibility Model](shared-responsibility-model.md) - Trách nhiệm bảo mật AWS vs Khách hàng
- [x] [AWS CLI](aws-cli.md) - Cài đặt, cấu hình, các lệnh thường dùng

## Compute

- [x] [EC2](ec2.md) - Elastic Compute Cloud, Instance Types, Pricing Models
- [x] [AMI](ami.md) - Amazon Machine Image, Custom AMIs, Sharing, Lifecycle
- [x] [ELB](elb.md) - Elastic Load Balancing, ALB, NLB, GWLB
- [x] [ASG](asg.md) - Auto Scaling Group, Scaling Policies, Lifecycle Hooks
- [x] [Load Balancing Patterns](load-balancing-patterns.md) - So sánh AWS vs K8s vs Spring Cloud
- [x] [Lambda](lambda.md) - Serverless Functions, Triggers, Cold Start, Pricing
- [x] [API Gateway](api-gateway.md) - REST/HTTP/WebSocket APIs, Lambda Integration
- [x] [ECS](ecs.md) - Elastic Container Service, Task Definitions, Services, Fargate
- [x] [EKS](eks.md) - Elastic Kubernetes Service, K8s Core Concepts, Node Types
- [x] [AWS Batch](aws-batch.md) - Batch Computing, Job Definitions, Compute Environments
- [x] [Lightsail](lightsail.md) - Simple Virtual Private Server (VPS), Pre-configured Stacks (WordPress, LAMP)
- [x] [Elastic Beanstalk](elastic-beanstalk.md) - PaaS, Deploy apps không lo infrastructure, Deployment Policies
- [x] [AWS Outposts](aws-outposts.md) - Hybrid Cloud, AWS infrastructure tại on-premises data center
- [x] [AWS Wavelength](aws-wavelength.md) - 5G Edge Computing, ultra-low latency cho mobile apps
- [x] [AWS Local Zones](aws-local-zones.md) - AWS mini DC gần thành phố lớn, low latency cho city users

## Storage

- [x] [S3](s3.md) - Simple Storage Service, Storage Classes, Lifecycle, Security
- [x] [S3 Transfer Acceleration](s3-transfer-acceleration.md) - Tăng tốc upload/download qua Edge Locations
- [x] [EBS](ebs.md) - Elastic Block Store, Volume Types, Snapshots, Encryption
- [x] [EFS](efs.md) - Elastic File System, Shared Storage, Storage Classes
- [x] [FSx](fsx.md) - Managed File Systems (Lustre, NetApp ONTAP, OpenZFS, Windows)
- [x] [Snow Family](snow-family.md) - Snowcone, Snowball Edge, Physical Data Transfer
- [x] [AWS Storage Deep Dive](aws-storage-deep-dive.md) - So sánh chi tiết các loại Block, File, Object, Hybrid, Edge

## Database

- [x] [RDS](rds.md) - Relational Database Service, MySQL, PostgreSQL, Aurora, Multi-AZ
- [x] [DynamoDB](dynamodb.md) - NoSQL key-value và document database, Single-digit millisecond latency, Global Tables, DAX
- [ ] ElastiCache

## Networking

- [x] [VPC](vpc.md) - Virtual Private Cloud, Subnets, NAT Gateway, VPC Peering, Transit Gateway, Client VPN, PrivateLink, VPC Endpoints
- [x] [Route 53](route53.md) - DNS Service, Hosted Zones, Routing Policies, Health Checks
- [x] [DNS Deep Dive](how-dns-works.md) - Giải thích cơ chế DNS, phân biệt Registry/Registrar/Nameserver (quan trọng!)
- [x] [CloudFront](cloudfront.md) - CDN, Edge Locations, Caching, Lambda@Edge, Security

## Account Management

- [x] [AWS Organizations](aws-organizations.md) - Multi-Account Management, OUs, SCPs, Consolidated Billing

## Security

- [x] [IAM](iam.md) - Users, Groups, Roles, Policies
- [x] [IAM Roles Deep Dive](iam-roles.md) - Trust Policy, Cross-Account, Confused Deputy, Roles Anywhere
- [x] [Security Groups](security-groups.md) - Virtual Firewall cho VPC resources
- [ ] KMS
- [ ] Cognito

## Monitoring & Management

- [x] [SSM](ssm.md) - Systems Manager, Parameter Store, Session Manager, Run Command
- [x] [CloudWatch](cloudwatch.md) - Metrics, Alarms, Logs, Dashboards, Insights
- [x] [CloudTrail](cloudtrail.md) - API Logging, Audit, Security Analysis, Event History
- [x] [X-Ray](aws-xray.md) - Distributed Tracing, Service Map, Performance Analysis
- [x] [AWS Health Dashboard](aws-health-dashboard.md) - Service Status, Personal Health Events, EventBridge Integration

## Developer Tools

- [x] [AWS Developer Tools](aws-developer-tools.md) - CodeCommit, CodeBuild, CodeDeploy, CodePipeline, CodeArtifact

## Infrastructure as Code

- [x] [CloudFormation](cloudformation.md) - IaC với YAML/JSON, Templates, Stacks, Intrinsic Functions
- [x] [CDK](cdk.md) - Cloud Development Kit, IaC với TypeScript/Python, Constructs (L1, L2, L3)

## Messaging & Streaming

- [x] [Messaging Patterns Comparison](messaging-patterns-comparison.md) - **So sánh Queue vs Pub/Sub vs Streaming vs Event Bus**
- [x] [SQS](sqs.md) - Simple Queue Service, Standard vs FIFO, DLQ, Long Polling
- [x] [SNS](sns.md) - Simple Notification Service, Pub/Sub, Fan-out, Message Filtering
- [x] [Kinesis](kinesis.md) - Data Streams, Firehose, Analytics, Real-time Streaming
- [x] [Amazon MQ](amazon-mq.md) - Managed ActiveMQ/RabbitMQ, Migration từ on-premises
- [x] [EventBridge](eventbridge.md) - Event Bus, Rules, Patterns, Pipes, Scheduler, Archive & Replay

## Global Applications Architecture

- [x] [Global Applications Architecture](global-applications-architecture.md) - Multi-Region patterns, DR strategies, CloudFront vs Global Accelerator

---

_Đánh dấu [x] khi hoàn thành mỗi chủ đề_
