# AWS Config


## Mục lục

- [Tổng quan](#tổng-quan)
- [Tại sao cần AWS Config?](#tại-sao-cần-aws-config)
- [Kiến trúc và Components](#kiến-trúc-và-components)
- [Configuration Items (CI)](#configuration-items-ci)
- [Config Rules](#config-rules)
- [Custom Rules](#custom-rules)
- [Conformance Packs](#conformance-packs)
- [Remediation](#remediation)
- [Multi-Account Multi-Region Aggregation](#multi-account-multi-region-aggregation)
- [Advanced Queries](#advanced-queries)
- [Notifications và Events](#notifications-và-events)
- [AWS Config vs CloudTrail](#aws-config-vs-cloudtrail)
- [Pricing](#pricing)
- [CLI Examples](#cli-examples)
- [Best Practices](#best-practices)
- [Integration với AWS Services](#integration-với-aws-services)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

**AWS Config** là dịch vụ giúp bạn **assess, audit, và evaluate** cấu hình của AWS resources. AWS Config liên tục monitors và records resource configurations, cho phép bạn:

- Theo dõi configuration changes theo thời gian
- Evaluate compliance với internal policies
- Troubleshoot configuration issues
- Security analysis

> [!TIP]
> AWS Config **KHÔNG ngăn chặn** changes - nó chỉ **recording và evaluating**. Để prevent changes, dùng kết hợp với SCPs, IAM policies.

---

## Tại sao cần AWS Config?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Problems AWS Config Solves                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ❌ Không có AWS Config:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Ai đã thay đổi Security Group?                                   │   │
│  │  • S3 bucket public từ khi nào?                                     │   │
│  │  • Có bao nhiêu EC2 instances không có encryption?                  │   │
│  │  • Resources nào violate compliance policies?                        │   │
│  │  • Cấu hình trước khi xảy ra incident là gì?                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ✅ Với AWS Config:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Configuration history của tất cả resources                        │   │
│  │  • Continuous compliance monitoring                                  │   │
│  │  • Resource relationships và dependencies                            │   │
│  │  • Timeline view cho troubleshooting                                 │   │
│  │  • Automatic remediation cho violations                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Kiến trúc và Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AWS Config Architecture                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AWS Resources                                 │   │
│  │  EC2 │ S3 │ RDS │ VPC │ IAM │ Lambda │ Security Groups │ ...       │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                            │
│                                │ Configuration Changes                      │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AWS Config                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ Recorder    │  │Configuration│  │ Config      │                  │   │
│  │  │ (records    │  │ Items       │  │ Rules       │                  │   │
│  │  │  changes)   │  │ (CI)        │  │ (evaluate)  │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └───────────────────────────┬─────────────────────────────────────────┘   │
│               │              │              │                               │
│               ▼              ▼              ▼                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    S3       │  │    SNS      │  │ EventBridge │  │ Systems     │        │
│  │  (history)  │  │ (notify)    │  │  (events)   │  │ Manager     │        │
│  │             │  │             │  │             │  │ (remediate) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Mô tả |
|-----------|-------|
| **Configuration Recorder** | Captures configuration changes của resources |
| **Configuration Item (CI)** | Point-in-time view của resource configuration |
| **Configuration History** | Collection of CIs cho 1 resource theo thời gian |
| **Configuration Snapshot** | Collection of CIs cho tất cả resources tại 1 thời điểm |
| **Config Rules** | Desired configuration settings để evaluate |
| **Conformance Packs** | Collection of Config Rules deploy cùng nhau |

---

## Configuration Items (CI)

### CI Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Configuration Item Example                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  {                                                                          │
│    "configurationItemVersion": "1.3",                                       │
│    "configurationItemCaptureTime": "2024-01-15T10:30:00.000Z",             │
│    "configurationStateId": "1234567890123",                                 │
│    "resourceType": "AWS::EC2::SecurityGroup",                               │
│    "resourceId": "sg-0abc123def456789",                                     │
│    "resourceName": "web-server-sg",                                         │
│    "awsRegion": "ap-southeast-1",                                           │
│    "accountId": "123456789012",                                             │
│    "configuration": {                                                       │
│      "groupId": "sg-0abc123def456789",                                      │
│      "groupName": "web-server-sg",                                          │
│      "ipPermissions": [                                                     │
│        {                                                                    │
│          "fromPort": 443,                                                   │
│          "toPort": 443,                                                     │
│          "ipRanges": [{"cidrIp": "0.0.0.0/0"}]                             │
│        }                                                                    │
│      ]                                                                      │
│    },                                                                       │
│    "relationships": [                                                       │
│      {                                                                      │
│        "resourceType": "AWS::EC2::Instance",                                │
│        "resourceId": "i-0abc123def456789",                                  │
│        "relationshipName": "Is associated with Instance"                    │
│      }                                                                      │
│    ]                                                                        │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Supported Resource Types

AWS Config hỗ trợ 300+ resource types, bao gồm:

| Category | Resource Types |
|----------|----------------|
| **Compute** | EC2 Instance, Auto Scaling Group, Lambda Function |
| **Storage** | S3 Bucket, EBS Volume, EFS |
| **Database** | RDS Instance, DynamoDB Table, ElastiCache |
| **Network** | VPC, Subnet, Security Group, ACL, Route Table |
| **Security** | IAM User, Role, Policy, KMS Key |
| **Management** | CloudFormation Stack, CloudTrail Trail |

---

## Config Rules

### Rule Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS Config Rule Types                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Managed Rules                                   │   │
│  │  • 300+ pre-built rules by AWS                                       │   │
│  │  • Ready to use, no coding required                                  │   │
│  │  • Examples: s3-bucket-public-read-prohibited,                       │   │
│  │              ec2-instance-no-public-ip, rds-storage-encrypted        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Custom Rules                                    │   │
│  │  • Lambda-based: Run your own Lambda function                        │   │
│  │  • Guard-based: Use AWS CloudFormation Guard DSL                     │   │
│  │  • Full flexibility với custom logic                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Organizational Rules                               │   │
│  │  • Deploy rules across all accounts in AWS Organizations             │   │
│  │  • Centralized management                                            │   │
│  │  • Consistent compliance across organization                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Trigger Types

| Trigger | Mô tả | Use Case |
|---------|-------|----------|
| **Configuration Changes** | Evaluate khi resource thay đổi | Real-time compliance |
| **Periodic** | Evaluate theo schedule (1h, 3h, 6h, 12h, 24h) | Regular audits |
| **Hybrid** | Cả configuration changes và periodic | Best coverage |

### Popular Managed Rules

| Rule | Mô tả |
|------|-------|
| `s3-bucket-public-read-prohibited` | S3 bucket không public read |
| `s3-bucket-ssl-requests-only` | S3 bucket chỉ chấp nhận SSL |
| `ec2-instance-no-public-ip` | EC2 không có public IP |
| `rds-storage-encrypted` | RDS storage được encrypted |
| `rds-multi-az-support` | RDS có Multi-AZ enabled |
| `encrypted-volumes` | EBS volumes được encrypted |
| `iam-password-policy` | IAM password policy đủ strong |
| `iam-user-mfa-enabled` | IAM users có MFA enabled |
| `root-account-mfa-enabled` | Root account có MFA |
| `vpc-flow-logs-enabled` | VPC có Flow Logs enabled |
| `cloudtrail-enabled` | CloudTrail enabled |
| `required-tags` | Resources có required tags |

### Config Rule Evaluation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Config Rule Evaluation Flow                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Resource Change                                                            │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────┐                                                        │
│  │  AWS Config     │                                                        │
│  │  records CI     │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  Trigger Rule   │                                                        │
│  │  Evaluation     │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Evaluation Result                               │   │
│  │                                                                      │   │
│  │  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │   │
│  │  │  COMPLIANT   │     │NON_COMPLIANT │     │NOT_APPLICABLE│         │   │
│  │  │      ✅      │     │      ❌      │     │      ➖      │         │   │
│  │  │              │     │              │     │              │         │   │
│  │  │ Resource     │     │ Resource     │     │ Rule doesn't │         │   │
│  │  │ meets rule   │     │ violates     │     │ apply to     │         │   │
│  │  │ conditions   │     │ rule         │     │ this resource│         │   │
│  │  └──────────────┘     └──────────────┘     └──────────────┘         │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │                    ┌──────────────┐                                  │   │
│  │                    │ Remediation  │ (Optional - SSM Automation)      │   │
│  │                    └──────────────┘                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Custom Rules

### Lambda-based Custom Rule

```python
# Lambda function cho custom Config rule
import json
import boto3

def lambda_handler(event, context):
    """
    Custom rule: Kiểm tra EC2 instances có tag 'Environment'
    """
    config = boto3.client('config')
    
    # Parse configuration item
    invoking_event = json.loads(event['invokingEvent'])
    configuration_item = invoking_event['configurationItem']
    
    # Extract instance info
    resource_id = configuration_item['resourceId']
    resource_type = configuration_item['resourceType']
    
    # Default compliance
    compliance = 'NON_COMPLIANT'
    annotation = 'Missing required tag: Environment'
    
    # Check tags
    tags = configuration_item.get('configuration', {}).get('tags', [])
    for tag in tags:
        if tag.get('key') == 'Environment':
            compliance = 'COMPLIANT'
            annotation = 'Resource has required Environment tag'
            break
    
    # Put evaluation result
    config.put_evaluations(
        Evaluations=[
            {
                'ComplianceResourceType': resource_type,
                'ComplianceResourceId': resource_id,
                'ComplianceType': compliance,
                'Annotation': annotation,
                'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
            }
        ],
        ResultToken=event['resultToken']
    )
    
    return {
        'compliance': compliance,
        'resourceId': resource_id
    }
```

### Guard-based Custom Rule

```yaml
# CloudFormation Guard rule
let s3_buckets = Resources.*[ Type == 'AWS::S3::Bucket' ]

rule s3_bucket_encryption_check {
    %s3_buckets {
        Properties.BucketEncryption.ServerSideEncryptionConfiguration[*] {
            ServerSideEncryptionByDefault.SSEAlgorithm == 'AES256' or
            ServerSideEncryptionByDefault.SSEAlgorithm == 'aws:kms'
        }
    }
}

rule s3_bucket_versioning_check {
    %s3_buckets {
        Properties.VersioningConfiguration.Status == 'Enabled'
    }
}
```

---

## Conformance Packs

### Tổng quan

**Conformance Pack** là collection of Config Rules và Remediation Actions được deploy như một đơn vị, giúp:

- Đơn giản hóa compliance management
- Deploy consistent rules across accounts
- Audit compliance với frameworks (PCI-DSS, HIPAA, NIST)

### Available Sample Templates

| Template | Use Case |
|----------|----------|
| **Operational Best Practices for AWS Identity and Access Management** | IAM security |
| **Operational Best Practices for Amazon S3** | S3 security |
| **Operational Best Practices for Amazon DynamoDB** | DynamoDB |
| **Operational Best Practices for Encryption and Keys** | Encryption |
| **Operational Best Practices for Logging** | Logging |
| **AWS Control Tower Detective Guardrails** | Control Tower |
| **PCI-DSS** | Payment Card Industry |
| **HIPAA Security** | Healthcare |
| **NIST 800-53** | Government |
| **CIS AWS Foundations Benchmark** | CIS |

### Conformance Pack Template Example

```yaml
# conformance-pack-s3-security.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Conformance Pack for S3 Security'

Resources:
  S3BucketPublicReadProhibited:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: s3-bucket-public-read-prohibited
      Description: Check S3 buckets do not allow public read
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_READ_PROHIBITED
      MaximumExecutionFrequency: TwentyFour_Hours

  S3BucketSSLRequestsOnly:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: s3-bucket-ssl-requests-only
      Description: Check S3 buckets require SSL
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SSL_REQUESTS_ONLY

  S3BucketEncrypted:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Description: Check S3 buckets have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  S3BucketVersioning:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: s3-bucket-versioning-enabled
      Description: Check S3 buckets have versioning enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_VERSIONING_ENABLED
```

---

## Remediation

### Automatic Remediation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Automatic Remediation Flow                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐   │
│  │  Config     │     │  Detect     │     │   Systems Manager           │   │
│  │  Rule       │────►│  NON_       │────►│   Automation                │   │
│  │  Evaluates  │     │  COMPLIANT  │     │                             │   │
│  └─────────────┘     └─────────────┘     │   ┌───────────────────────┐ │   │
│                                           │   │ Remediation Document  │ │   │
│                                           │   │ (SSM Automation)      │ │   │
│                                           │   │                       │ │   │
│                                           │   │ Example:              │ │   │
│                                           │   │ AWS-EnableS3          │ │   │
│                                           │   │ BucketEncryption      │ │   │
│                                           │   └───────────────────────┘ │   │
│                                           └─────────────┬───────────────┘   │
│                                                         │                   │
│                                                         ▼                   │
│                                           ┌─────────────────────────────┐   │
│                                           │   Resource Fixed!           │   │
│                                           │   Re-evaluate → COMPLIANT   │   │
│                                           └─────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Remediation Types

| Type | Mô tả | Use Case |
|------|-------|----------|
| **Manual** | Operator triggers remediation | Sensitive resources, cần review |
| **Automatic** | Remediation runs automatically | Non-critical resources |
| **Automatic with retry** | Retry nếu remediation fails | Reliable remediation |

### Common SSM Automation Documents

| Document | Action |
|----------|--------|
| `AWS-EnableS3BucketEncryption` | Enable S3 bucket encryption |
| `AWS-DisableS3BucketPublicReadWrite` | Disable public access |
| `AWS-EnableEbsEncryptionByDefault` | Enable EBS encryption |
| `AWS-EnableCloudTrailLogFileValidation` | Enable CloudTrail validation |
| `AWS-ConfigureS3BucketLogging` | Enable S3 access logging |

---

## Multi-Account Multi-Region Aggregation

### Aggregator

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Config Aggregator                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     Management Account                                 │ │
│  │                        (Aggregator)                                    │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │              Aggregated Dashboard                                │  │ │
│  │  │  • Compliance summary across all accounts                        │  │ │
│  │  │  • Resource inventory                                            │  │ │
│  │  │  • Non-compliant resources                                       │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                        ▲           ▲           ▲                            │
│                        │           │           │                            │
│         ┌──────────────┴───┐  ┌────┴────┐  ┌───┴──────────────┐            │
│         │                  │  │         │  │                  │            │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌┴─────────────┐                    │
│  │  Account A  │    │  Account B  │    │  Account C   │                    │
│  │  Region 1+2 │    │  Region 1   │    │  Region 1+3  │                    │
│  │             │    │             │    │              │                    │
│  │ Config data │    │ Config data │    │ Config data  │                    │
│  └─────────────┘    └─────────────┘    └──────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Aggregator Setup

```bash
# Create aggregator for AWS Organization
aws configservice put-configuration-aggregator \
    --configuration-aggregator-name MyOrganizationAggregator \
    --organization-aggregation-source OrganizationEnabled=true,AllAwsRegions=true

# Create aggregator for specific accounts
aws configservice put-configuration-aggregator \
    --configuration-aggregator-name MyAccountAggregator \
    --account-aggregation-sources '[
        {
            "AccountIds": ["111111111111", "222222222222"],
            "AwsRegions": ["us-east-1", "ap-southeast-1"],
            "AllAwsRegions": false
        }
    ]'
```

---

## Advanced Queries

### SQL-like Queries

AWS Config hỗ trợ SQL-like queries để query configuration data:

```sql
-- Find all EC2 instances with specific instance type
SELECT
    resourceId,
    resourceName,
    configuration.instanceType,
    configuration.state.name
WHERE
    resourceType = 'AWS::EC2::Instance'
    AND configuration.instanceType = 't3.micro'

-- Find S3 buckets without encryption
SELECT
    resourceId,
    resourceName,
    configuration.bucketName
WHERE
    resourceType = 'AWS::S3::Bucket'
    AND configuration.serverSideEncryptionConfiguration IS NULL

-- Find Security Groups with 0.0.0.0/0 on port 22
SELECT
    resourceId,
    configuration.groupName,
    configuration.ipPermissions
WHERE
    resourceType = 'AWS::EC2::SecurityGroup'
    AND configuration.ipPermissions.ipRanges.cidrIp = '0.0.0.0/0'
    AND configuration.ipPermissions.fromPort = 22

-- Count resources by type
SELECT
    resourceType,
    COUNT(*)
GROUP BY
    resourceType
ORDER BY
    COUNT(*) DESC
```

### Query via CLI

```bash
# Run advanced query
aws configservice select-resource-config \
    --expression "SELECT resourceId, configuration.instanceType 
                  WHERE resourceType = 'AWS::EC2::Instance'"

# Run aggregated query
aws configservice select-aggregate-resource-config \
    --configuration-aggregator-name MyAggregator \
    --expression "SELECT resourceId, accountId, awsRegion 
                  WHERE resourceType = 'AWS::S3::Bucket'"
```

---

## Notifications và Events

### SNS Notifications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AWS Config Notifications                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AWS Config                                                                 │
│       │                                                                     │
│       │ Configuration Stream                                                │
│       ▼                                                                     │
│  ┌─────────────┐                                                            │
│  │    SNS      │─────────► Email, SMS, HTTP endpoint                        │
│  │   Topic     │                                                            │
│  └─────────────┘                                                            │
│                                                                             │
│  Notification Types:                                                        │
│  • Configuration Item Changes                                               │
│  • Configuration Snapshot Delivery Status                                   │
│  • Configuration History Delivery Status                                    │
│  • Compliance State Changes                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### EventBridge Integration

```json
// EventBridge Rule cho Config compliance changes
{
    "source": ["aws.config"],
    "detail-type": ["Config Rules Compliance Change"],
    "detail": {
        "configRuleName": ["s3-bucket-public-read-prohibited"],
        "newEvaluationResult": {
            "complianceType": ["NON_COMPLIANT"]
        }
    }
}
```

---

## AWS Config vs CloudTrail

| Feature | AWS Config | CloudTrail |
|---------|------------|------------|
| **Focus** | Resource **configuration** | API **activities** |
| **Records** | What resources look like | Who did what, when |
| **Question answered** | S3 bucket hiện config thế nào? | Ai đã tạo S3 bucket này? |
| **History** | Configuration history | API call history |
| **Compliance** | ✅ Config Rules | ❌ No rules |
| **Remediation** | ✅ SSM Automation | ❌ No remediation |
| **Use case** | Compliance, auditing configuration | Security investigation, troubleshooting |

### Complementary Usage

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                CloudTrail + Config = Complete Picture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Security Incident Investigation:                                           │
│                                                                             │
│  CloudTrail: "User John called ModifySecurityGroup at 10:30 AM"            │
│       +                                                                     │
│  AWS Config: "Security Group configuration before/after the change"         │
│       =                                                                     │
│  Complete Picture: WHO changed WHAT and the EXACT changes made             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pricing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS Config Pricing                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Configuration Items:                                                       │
│  • $0.003 per configuration item recorded                                   │
│                                                                             │
│  Config Rules:                                                              │
│  • $0.001 per rule evaluation                                               │
│  • First 100,000 evaluations: included in price                             │
│                                                                             │
│  Conformance Packs:                                                         │
│  • $0.0012 per conformance pack evaluation per Region                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Example - Medium organization:                                             │
│  • 1,000 resources, changes 5 times/month each = 5,000 CIs                 │
│  • 20 rules, evaluate 5,000 times = 100,000 evaluations                    │
│                                                                             │
│  Cost = (5,000 × $0.003) + (100,000 × $0.001) = $15 + $100 = ~$115/month   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CLI Examples

```bash
# Start recording
aws configservice start-configuration-recorder \
    --configuration-recorder-name default

# Stop recording
aws configservice stop-configuration-recorder \
    --configuration-recorder-name default

# Put a Config rule
aws configservice put-config-rule \
    --config-rule '{
        "ConfigRuleName": "s3-bucket-encryption",
        "Description": "Check S3 bucket encryption",
        "Source": {
            "Owner": "AWS",
            "SourceIdentifier": "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
        },
        "Scope": {
            "ComplianceResourceTypes": ["AWS::S3::Bucket"]
        }
    }'

# Get compliance details
aws configservice get-compliance-details-by-config-rule \
    --config-rule-name s3-bucket-encryption \
    --compliance-types NON_COMPLIANT

# Get resource configuration history
aws configservice get-resource-config-history \
    --resource-type AWS::EC2::SecurityGroup \
    --resource-id sg-0abc123def456789 \
    --limit 5

# Deliver configuration snapshot
aws configservice deliver-config-snapshot \
    --delivery-channel-name default
```

---

## Best Practices

### Setup

| Practice | Mô tả |
|----------|-------|
| **Enable in all Regions** | Config changes có thể xảy ra ở bất kỳ Region |
| **Use Aggregator** | Centralized view cho multi-account |
| **Deploy via Organizations** | Consistent setup across accounts |
| **Enable all resource types** | Đừng miss important resources |

### Config Rules

| Practice | Mô tả |
|----------|-------|
| **Start with managed rules** | Quick wins, đã tested |
| **Use Conformance Packs** | Organized, versioned, deployable |
| **Enable remediation** | Auto-fix non-compliant resources |
| **Set appropriate frequency** | Balance between real-time và cost |

### Monitoring

| Practice | Mô tả |
|----------|-------|
| **Set up SNS notifications** | Alert on non-compliance |
| **Use EventBridge** | Trigger workflows on changes |
| **Regular compliance reports** | Audit và review |
| **Integrate with Security Hub** | Centralized security view |

---

## Integration với AWS Services

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS Config Integrations                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Security:                                                                  │
│  • Security Hub ──────► Aggregate findings, compliance scores               │
│  • GuardDuty ──────────► Threat detection                                   │
│  • IAM Access Analyzer ► Access analysis                                    │
│                                                                             │
│  Management:                                                                │
│  • CloudTrail ─────────► API correlation                                    │
│  • Systems Manager ────► Remediation automation                             │
│  • Organizations ──────► Multi-account deployment                           │
│  • Control Tower ──────► Guardrails                                         │
│                                                                             │
│  Monitoring:                                                                │
│  • CloudWatch ─────────► Metrics, alarms                                    │
│  • EventBridge ────────► Event-driven automation                            │
│  • SNS ────────────────► Notifications                                      │
│                                                                             │
│  Storage:                                                                   │
│  • S3 ─────────────────► Configuration history, snapshots                   │
│  • Athena ─────────────► Query historical data                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tổng kết

| Feature | Mô tả |
|---------|-------|
| **Configuration Recording** | Liên tục record resource configurations |
| **Configuration History** | Timeline của configuration changes |
| **Config Rules** | Evaluate compliance với desired state |
| **Conformance Packs** | Deploy nhiều rules cùng lúc |
| **Remediation** | Auto-fix non-compliant resources |
| **Aggregation** | Multi-account, multi-region view |
| **Advanced Queries** | SQL-like queries trên configuration data |

> [!IMPORTANT]
> AWS Config là **essential service** cho:
> - **Compliance auditing** - Chứng minh compliance với regulations
> - **Security analysis** - Detect misconfigurations
> - **Change management** - Track và understand changes
> - **Troubleshooting** - "What changed before the incident?"

> [!TIP]
> Combine AWS Config với **CloudTrail** để có complete picture: **WHO** (CloudTrail) changed **WHAT** (Config) and **WHEN** (both).
