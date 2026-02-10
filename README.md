# AWS Learning - Mục lục

## Fundamentals

- [x] [AWS Overview](aws-overview.md) - Lịch sử AWS, Global Infrastructure (Regions, AZs, Edge Locations)
- [x] [Cloud Computing Basics](cloud-computing-basics.md) - Traditional Server vs Cloud Computing, SLA
- [x] [Shared Responsibility Model](shared-responsibility-model.md) - Trách nhiệm bảo mật AWS vs Khách hàng
- [x] [AWS CLI](aws-cli.md) - Cài đặt, cấu hình, các lệnh thường dùng
- [x] [AWS Cloud Adoption Framework (CAF)](aws-caf.md) - 6 Perspectives, Cloud Transformation Roadmap
- [x] [AWS Well-Architected Framework](aws-well-architected.md) - 6 Pillars, Design Principles, Best Practices

## Compute

- [x] [EC2](ec2.md) - Elastic Compute Cloud, Instance Types, Pricing Models
- [x] [AMI](ami.md) - Amazon Machine Image, Custom AMIs, Sharing, Lifecycle
- [x] [ELB](elb.md) - Elastic Load Balancing, ALB, NLB, GWLB
- [x] [ASG](asg.md) - Auto Scaling Group, Scaling Policies, Lifecycle Hooks
- [x] [Auto Scaling](auto-scaling.md) - EC2 Auto Scaling chi tiết, Target Tracking, Warm Pools, Mixed Instances
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
- [x] [S3 Storage Lens](s3-storage-lens.md) - Organization-wide Storage Analytics, 60+ Metrics, Cost & Security Recommendations
- [x] [S3 Security](s3-security.md) - Access Control, Encryption, Block Public Access, Pre-signed URLs, VPC Endpoints
- [x] [EBS](ebs.md) - Elastic Block Store, Volume Types, Snapshots, Encryption
- [x] [EFS](efs.md) - Elastic File System, Shared Storage, Storage Classes
- [x] [FSx](fsx.md) - Managed File Systems (Lustre, NetApp ONTAP, OpenZFS, Windows)
- [x] [Snow Family](snow-family.md) - Snowcone, Snowball Edge, Physical Data Transfer
- [x] [AWS Storage Gateway](aws-storage-gateway.md) - Hybrid Cloud Storage, S3 File Gateway, Volume Gateway, Tape Gateway
- [x] [AWS Transfer Family](aws-transfer-family.md) - Managed SFTP/FTPS/FTP/AS2, File Transfer to S3/EFS
- [x] [AWS DataSync](aws-datasync.md) - Data Migration, Bulk Transfer, On-premises to AWS Sync
- [x] [AWS Storage Deep Dive](aws-storage-deep-dive.md) - So sánh chi tiết các loại Block, File, Object, Hybrid, Edge

## Database

- [x] [RDS](rds.md) - Relational Database Service, MySQL, PostgreSQL, Aurora, Multi-AZ
- [x] [RDS Read-Write Splitting](rds-read-write-splitting.md) - Multi-AZ Cluster Endpoints, Read Replica Load Balancing, Spring Boot Examples
- [x] [Amazon Aurora](aurora.md) - Aurora Architecture, Serverless v2, Global Database, Replicas, Endpoints
- [x] [DynamoDB](dynamodb.md) - NoSQL key-value và document database, Single-digit millisecond latency, Global Tables, DAX
- [x] [ElastiCache](elasticache.md) - In-Memory Caching, Redis, Memcached, Session Store
- [x] [Amazon Redshift](amazon-redshift.md) - Data Warehouse, OLAP, Columnar Storage, MPP, Spectrum, Zero-ETL
- [x] [Amazon Neptune](amazon-neptune.md) - Graph Database, Gremlin, SPARQL, Social Networks, Fraud Detection

## Migration

- [x] [Disaster Recovery & Migration Overview](aws-disaster-recovery-migration-overview.md) - Tổng quan DR Patterns, 6Rs, DMS, Snow Family, DataSync, Storage Gateway, Backup (Diagram)
- [x] [AWS DMS](aws-dms.md) - Database Migration Service, SCT, 6Rs Migration Strategies, CDC

## Data Integration

- [x] [AWS Glue](aws-glue.md) - Serverless ETL, Data Catalog, Crawlers, Spark/Python Jobs, Glue Studio
- [x] [Amazon EMR](amazon-emr.md) - Managed Big Data Platform, Spark, Hadoop, Hive, Presto, 3 deployment options

## Analytics

- [x] [Amazon Athena](amazon-athena.md) - Serverless SQL Query Service, Query S3 Data, Presto/Trino Engine, Partitioning
- [x] [Amazon QuickSight](amazon-quicksight.md) - BI Visualization, SPICE Engine, Dashboards, ML Insights, Generative BI

## Networking

- [x] [VPC](vpc.md) - Virtual Private Cloud, Subnets, NAT Gateway, VPC Peering, Transit Gateway, Client VPN, PrivateLink, VPC Endpoints
- [x] [VPC Endpoints](vpc-endpoints.md) - Gateway Endpoints, Interface Endpoints, PrivateLink, Private Access to AWS Services
- [x] [CIDR](cidr.md) - Classless Inter-Domain Routing, IP Address Ranges, Subnet Calculation
- [x] [ENI](eni.md) - Elastic Network Interface, Private/Public IPs, Multiple ENIs, Failover
- [x] [Direct Connect](direct-connect.md) - Dedicated Network Connection, Private VIF, Transit VIF, LAG, MACsec, SiteLink
- [x] [Route 53](route53.md) - DNS Service, Hosted Zones, Routing Policies, Health Checks
- [x] [DNS Deep Dive](how-dns-works.md) - Giải thích cơ chế DNS, phân biệt Registry/Registrar/Nameserver (quan trọng!)
- [x] [CloudFront](cloudfront.md) - CDN, Edge Locations, Caching, Lambda@Edge, Security
- [x] [Global Accelerator](global-accelerator.md) - Network Layer, Static Anycast IPs, TCP/UDP, Gaming/IoT

## Account Management

- [x] [AWS Organizations](aws-organizations.md) - Multi-Account Management, OUs, SCPs, Consolidated Billing
- [x] [AWS Service Catalog](aws-service-catalog.md) - Self-Service Product Catalog, Portfolios, Launch Constraints, Governance

## Security

- [x] [IAM Management Overview](aws-iam-management-overview.md) - Tổng quan Account, Users, Groups, Roles, Policies, Best Practices (Diagram)
- [x] [Security & Encryption Overview](aws-security-encryption-overview.md) - Tổng quan KMS, Shield, WAF, GuardDuty, Inspector, Macie, ACM, Cognito (Diagram)
- [x] [IAM](iam.md) - Users, Groups, Roles, Policies
- [x] [IAM Identity Center](iam-identity-center.md) - Single Sign-On (SSO), Multi-Account Access, Identity Providers, Permission Sets
- [x] [IAM Roles Deep Dive](iam-roles.md) - Trust Policy, Cross-Account, Confused Deputy, Roles Anywhere
- [x] [Security Groups](security-groups.md) - Virtual Firewall cho VPC resources
- [x] [Amazon Inspector](amazon-inspector.md) - Vulnerability Scanning cho EC2, ECR Images, Lambda Functions
- [x] [Amazon GuardDuty](amazon-guardduty.md) - Threat Detection, ML-based Security Monitoring, Malware Protection
- [x] [Amazon Macie](amazon-macie.md) - Sensitive Data Discovery trong S3, PII Detection, Compliance
- [x] [AWS Policies & Compliance](aws-policies-compliance.md) - AUP, Penetration Testing, AWS Artifact, Compliance Programs
- [x] [AWS Secrets Manager](aws-secrets-manager.md) - Secret Storage, Automatic Rotation, Cross-account Sharing
- [x] [AWS CloudHSM](aws-cloudhsm.md) - Dedicated Hardware Security Module, FIPS 140-2 Level 3, Key Management
- [x] [AWS KMS](aws-kms.md) - Key Management Service, Encryption Keys, Envelope Encryption, Key Rotation
- [x] [Amazon Cognito](amazon-cognito.md) - User Pools, Identity Pools, Authentication, Social Login, JWT Tokens
- [x] [AWS WAF](aws-waf.md) - Web Application Firewall, Web ACLs, Bot Control, Fraud Control, Shield Integration
- [x] [AWS Shield](aws-shield.md) - DDoS Protection, Shield Standard (Free), Shield Advanced, DRT, Cost Protection
- [x] [AWS Artifact](aws-artifact.md) - Compliance Reports (SOC, PCI, ISO), Agreements (HIPAA BAA, GDPR DPA)
- [x] [AWS ACM](aws-acm.md) - AWS Certificate Manager, SSL/TLS Certificates, DNS/Email Validation, Auto Renewal

## Partner & Marketplace

- [x] [AWS Partner Solutions](aws-partner-solutions.md) - Quick Starts, Automated Reference Deployments, CloudFormation Templates

## Monitoring & Management

- [x] [Monitoring & Audit Overview](aws-monitoring-audit-overview.md) - Tổng quan CloudWatch, CloudTrail, Config, X-Ray, Best Practices (Diagram)
- [x] [AWS Systems Manager (SSM)](aws-systems-manager.md) - Run Command, Session Manager, Patch Manager, Parameter Store, Automation
- [x] [SSM Deep Dive](ssm.md) - SSM Agent, Session Manager, Run Command, Patch Manager chi tiết
- [x] [AWS AppConfig](aws-appconfig.md) - Dynamic Configuration, Feature Flags, Gradual Deployment, Rollback
- [x] [AWS OpsWorks](aws-opsworks.md) - Configuration Management, Chef/Puppet, Stacks, Layers
- [x] [CloudWatch](cloudwatch.md) - Metrics, Alarms, Logs, Dashboards, Insights
- [x] [CloudTrail](cloudtrail.md) - API Logging, Audit, Security Analysis, Event History
- [x] [X-Ray](aws-xray.md) - Distributed Tracing, Service Map, Performance Analysis
- [x] [AWS Health Dashboard](aws-health-dashboard.md) - Service Status, Personal Health Events, EventBridge Integration
- [x] [AWS Trusted Advisor](aws-trusted-advisor.md) - Best Practices Recommendations (Cost, Performance, Security, Fault Tolerance, Limits)
- [x] [AWS Compute Optimizer](aws-compute-optimizer.md) - ML-based Rightsizing Recommendations cho EC2, EBS, Lambda, ECS
- [x] [AWS Config](aws-config.md) - Configuration Recording, Compliance Rules, Remediation, Multi-Account Aggregation

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
- [x] [Amazon MSK](amazon-msk.md) - Managed Streaming for Apache Kafka, Serverless, MSK Connect
- [x] [EventBridge](eventbridge.md) - Event Bus, Rules, Patterns, Pipes, Scheduler, Archive & Replay

## Global Applications Architecture

- [x] [AWS Global Infrastructure](aws-global-infrastructure.md) - Regions, AZs, Edge Locations, Local Zones, Wavelength Zones, Outposts
- [x] [Global Applications Architecture](global-applications-architecture.md) - Multi-Region patterns, DR strategies, CloudFront vs Global Accelerator

## Cost Management

- [x] [AWS Pricing Calculator](aws-pricing-calculator.md) - Estimate Costs Before Deploying, Compare Pricing Options
- [x] [AWS Cost Explorer](aws-cost-explorer.md) - Analyze Costs After Deployment, Usage Reports, Forecasting

## Support

- [x] [AWS Support Resources](aws-support-resources.md) - FREE vs PAID Resources, re:Post, Knowledge Center, Professional Services, AMS

## AI/ML Services

- [x] [AWS AI/ML Services](aws-ai-ml-services.md) - Rekognition, Textract, Polly, Transcribe, Translate, Comprehend, Lex, Kendra, Personalize, Forecast, Bedrock, SageMaker

## Application Integration

- [x] [Amazon Connect](amazon-connect.md) - Cloud Contact Center, Omnichannel, Contact Flows, AI-powered Customer Service

---

_Đánh dấu [x] khi hoàn thành mỗi chủ đề_
