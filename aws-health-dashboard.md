# AWS Health Dashboard

## 🏥 Tổng Quan

**AWS Health Dashboard** cung cấp thông tin về **service health** và **events** ảnh hưởng đến tài nguyên AWS của bạn. Đây là "bệnh viện" cho AWS resources - giúp bạn biết khi nào có vấn đề và cần làm gì.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AWS HEALTH DASHBOARD                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    🌐 SERVICE HEALTH                                 │   │
│   │                    (Public - Tất cả AWS)                            │   │
│   │                                                                      │   │
│   │  "Toàn bộ EC2 ở us-east-1 đang gặp sự cố"                          │   │
│   │  "S3 đang bị degraded performance"                                  │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    👤 YOUR ACCOUNT HEALTH                            │   │
│   │                    (Private - Chỉ Account của bạn)                   │   │
│   │                                                                      │   │
│   │  "EC2 instance i-1234567890abcdef0 của bạn sẽ bị retire"           │   │
│   │  "RDS instance prod-db cần maintenance window"                      │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Hai Loại Dashboard

### 1. Service Health Dashboard (Public)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVICE HEALTH DASHBOARD                                  │
│                    https://health.aws.amazon.com/                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   📋 WHAT IT SHOWS:                                                         │
│   • Current status của TẤT CẢ AWS services                                  │
│   • Historical incidents                                                     │
│   • Planned maintenance windows                                              │
│   • Service disruptions                                                      │
│                                                                              │
│   🌍 SCOPE: Global view - Không cần login                                   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Service         │ Region      │ Status                             │   │
│   │  ─────────────────────────────────────────────────────────────────  │   │
│   │  Amazon EC2      │ us-east-1   │ ✅ Operational                     │   │
│   │  Amazon S3       │ us-west-2   │ ⚠️ Degraded Performance           │   │
│   │  Amazon RDS      │ eu-west-1   │ ✅ Operational                     │   │
│   │  AWS Lambda      │ ap-south-1  │ 🔴 Service Disruption              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ❌ LIMITATIONS:                                                           │
│   • Không cho biết TÀI NGUYÊN CỤ THỂ của bạn bị ảnh hưởng                  │
│   • Chỉ hiển thị service-level issues                                       │
│   • Không có personalized alerts                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Personal Health Dashboard (Account-specific)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERSONAL HEALTH DASHBOARD                                 │
│                    (AWS Console → Health)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   📋 WHAT IT SHOWS:                                                         │
│   • Events ảnh hưởng đến RESOURCES CỤ THỂ của bạn                          │
│   • Scheduled changes cho tài nguyên của bạn                                │
│   • Account notifications                                                    │
│   • Proactive recommendations                                                │
│                                                                              │
│   👤 SCOPE: Account-specific - Cần login AWS Console                        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ⚠️ OPEN ISSUES                                                      │   │
│   │  ────────────────────────────────────────────────────────────────── │   │
│   │  🔴 EC2 Instance Retirement                                          │   │
│   │     Instance: i-1234567890abcdef0                                    │   │
│   │     Region: us-east-1                                                │   │
│   │     Retirement Date: 2024-02-15                                      │   │
│   │     Action: Migrate to new instance                                  │   │
│   │                                                                      │   │
│   │  ⚠️ RDS Maintenance Window                                           │   │
│   │     Instance: prod-database                                          │   │
│   │     Window: 2024-01-20 03:00-04:00 UTC                              │   │
│   │     Action: Plan for brief downtime                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  📅 SCHEDULED CHANGES                                                │   │
│   │  ────────────────────────────────────────────────────────────────── │   │
│   │  📋 Certificate Expiration                                           │   │
│   │     ACM Certificate: *.example.com                                   │   │
│   │     Expires: 2024-03-01                                              │   │
│   │     Action: Renew certificate                                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔔 Event Types

### Phân Loại Events

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AWS HEALTH EVENT TYPES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  1. ACCOUNT NOTIFICATIONS                                              ║ │
│   ╠═══════════════════════════════════════════════════════════════════════╣ │
│   ║  • Thông báo chung về account                                          ║ │
│   ║  • Service announcements                                               ║ │
│   ║  • Policy updates                                                      ║ │
│   ║  • Billing alerts                                                      ║ │
│   ║                                                                        ║ │
│   ║  Example: "AWS will deprecate Python 3.8 runtime in Lambda"           ║ │
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  2. SCHEDULED CHANGES                                                  ║ │
│   ╠═══════════════════════════════════════════════════════════════════════╣ │
│   ║  • Planned maintenance                                                 ║ │
│   ║  • Hardware retirement                                                 ║ │
│   ║  • Software updates                                                    ║ │
│   ║  • Certificate expirations                                             ║ │
│   ║                                                                        ║ │
│   ║  Example: "EC2 instance i-xxx scheduled for retirement on 2024-02-15" ║ │
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  3. ISSUES (Ongoing Problems)                                          ║ │
│   ╠═══════════════════════════════════════════════════════════════════════╣ │
│   ║  • Active service issues                                               ║ │
│   ║  • Performance degradation                                             ║ │
│   ║  • Outages                                                             ║ │
│   ║  • Resource-specific problems                                          ║ │
│   ║                                                                        ║ │
│   ║  Example: "Your EBS volume vol-xxx is impaired"                       ║ │
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Event Status Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EVENT LIFECYCLE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│   │  Open   │───►│Upcoming │───►│ Ongoing │───►│ Closed  │                 │
│   │  📋     │    │  ⏰     │    │  🔄     │    │  ✅     │                 │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘                 │
│                                                                              │
│   Open:                                                                      │
│   • Event đã được tạo                                                        │
│   • Chưa bắt đầu                                                            │
│   • Cần action từ user                                                       │
│                                                                              │
│   Upcoming:                                                                  │
│   • Scheduled nhưng chưa xảy ra                                             │
│   • Thường là maintenance windows                                           │
│                                                                              │
│   Ongoing:                                                                   │
│   • Đang diễn ra                                                            │
│   • AWS đang xử lý                                                          │
│                                                                              │
│   Closed:                                                                    │
│   • Đã resolved                                                              │
│   • Historical record                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 AWS Health API

### API Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AWS HEALTH API                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ⚠️ IMPORTANT: Chỉ available với Business/Enterprise Support Plan!        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  AWS Health API                                                      │   │
│   │  ─────────────────                                                   │   │
│   │                                                                      │   │
│   │  Programmatic access to:                                             │   │
│   │  • Personal Health Dashboard events                                  │   │
│   │  • Affected resources                                                │   │
│   │  • Event details and descriptions                                    │   │
│   │  • Historical events                                                 │   │
│   │                                                                      │   │
│   │  Use cases:                                                          │   │
│   │  • Build custom dashboards                                           │   │
│   │  • Integrate với alerting systems                                   │   │
│   │  • Automate responses to health events                              │   │
│   │  • Feed into SIEM/monitoring tools                                  │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Operations

| Operation | Mô Tả |
|-----------|-------|
| `DescribeEvents` | List health events matching filter criteria |
| `DescribeEventDetails` | Get detailed info about specific events |
| `DescribeAffectedEntities` | Get resources affected by an event |
| `DescribeEventTypes` | List available event types |
| `DescribeEventAggregates` | Get aggregated event counts |

### Code Examples

**Python (boto3):**
```python
import boto3
from datetime import datetime, timedelta

# Create Health client
health = boto3.client('health', region_name='us-east-1')
# Note: Health API is only available in us-east-1

# Get recent events
events = health.describe_events(
    filter={
        'eventStatusCodes': ['open', 'upcoming'],
        'eventTypeCategories': ['scheduledChange', 'issue'],
        'startTimes': [
            {
                'from': datetime.now() - timedelta(days=7)
            }
        ]
    }
)

for event in events['events']:
    print(f"Event: {event['eventTypeCode']}")
    print(f"Service: {event['service']}")
    print(f"Region: {event.get('region', 'global')}")
    print(f"Status: {event['statusCode']}")
    print("---")

# Get affected resources for an event
affected = health.describe_affected_entities(
    filter={
        'eventArns': ['arn:aws:health:us-east-1::event/EC2/...']
    }
)

for entity in affected['entities']:
    print(f"Resource: {entity['entityValue']}")
    print(f"Status: {entity['statusCode']}")
```

**AWS CLI:**
```bash
# List open events
aws health describe-events \
    --region us-east-1 \
    --filter "eventStatusCodes=open,upcoming"

# Get event details
aws health describe-event-details \
    --region us-east-1 \
    --event-arns "arn:aws:health:us-east-1::event/EC2/..."

# Get affected entities
aws health describe-affected-entities \
    --region us-east-1 \
    --filter "eventArns=arn:aws:health:..."
```

---

## 🔔 EventBridge Integration

### Automated Response to Health Events

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  HEALTH + EVENTBRIDGE INTEGRATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────┐         ┌───────────────┐         ┌───────────────────┐│
│   │  AWS Health   │────────►│  EventBridge  │────────►│  Targets          ││
│   │  Event        │ auto    │  Rule         │         │                   ││
│   └───────────────┘         └───────────────┘         │  • Lambda         ││
│                                                        │  • SNS            ││
│                                                        │  • SQS            ││
│                                                        │  • Step Functions ││
│                                                        │  • SSM Automation ││
│                                                        └───────────────────┘│
│                                                                              │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   Example Flow:                                                              │
│                                                                              │
│   EC2 Retirement  ──►  EventBridge  ──►  Lambda  ──►  Create New Instance  │
│   Notification         Rule              Function     + Migrate Data        │
│                                                                              │
│                                    ──►  SNS  ──►  Email/Slack Notification  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### EventBridge Rule Pattern

```json
{
  "source": ["aws.health"],
  "detail-type": ["AWS Health Event"],
  "detail": {
    "service": ["EC2"],
    "eventTypeCategory": ["scheduledChange"],
    "eventTypeCode": ["AWS_EC2_INSTANCE_RETIREMENT_SCHEDULED"]
  }
}
```

### Lambda Handler Example

```python
import json
import boto3

def lambda_handler(event, context):
    """
    Handle AWS Health Event from EventBridge
    """
    print(f"Received Health Event: {json.dumps(event)}")
    
    detail = event['detail']
    event_type = detail['eventTypeCode']
    service = detail['service']
    
    # Get affected resources
    affected_entities = detail.get('affectedEntities', [])
    
    if event_type == 'AWS_EC2_INSTANCE_RETIREMENT_SCHEDULED':
        for entity in affected_entities:
            instance_id = entity['entityValue']
            handle_ec2_retirement(instance_id)
    
    elif event_type == 'AWS_RDS_MAINTENANCE_SCHEDULED':
        for entity in affected_entities:
            db_instance = entity['entityValue']
            notify_team_about_maintenance(db_instance, detail)
    
    return {'statusCode': 200}


def handle_ec2_retirement(instance_id):
    """
    Automated response to EC2 retirement
    """
    ec2 = boto3.client('ec2')
    sns = boto3.client('sns')
    
    # Get instance details
    response = ec2.describe_instances(InstanceIds=[instance_id])
    instance = response['Reservations'][0]['Instances'][0]
    
    # Send notification
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:ops-alerts',
        Subject=f'EC2 Retirement Alert: {instance_id}',
        Message=f'''
        Instance {instance_id} is scheduled for retirement.
        
        Instance Details:
        - Type: {instance['InstanceType']}
        - AZ: {instance['Placement']['AvailabilityZone']}
        - Private IP: {instance.get('PrivateIpAddress', 'N/A')}
        
        Action Required:
        1. Create a new instance
        2. Migrate workloads
        3. Update DNS/Load Balancer
        '''
    )
    
    # Optional: Create AMI backup
    ec2.create_image(
        InstanceId=instance_id,
        Name=f'retirement-backup-{instance_id}',
        Description='Automated backup before retirement'
    )


def notify_team_about_maintenance(db_instance, event_detail):
    """
    Notify team about scheduled RDS maintenance
    """
    sns = boto3.client('sns')
    
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:ops-alerts',
        Subject=f'RDS Maintenance Scheduled: {db_instance}',
        Message=f'''
        Database {db_instance} has scheduled maintenance.
        
        Details:
        {json.dumps(event_detail, indent=2)}
        
        Please ensure:
        1. Application can handle brief downtime
        2. Maintenance window is acceptable
        3. Modify maintenance window if needed
        '''
    )
```

---

## 🏢 AWS Organizations Health

### Aggregated View Across Accounts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  AWS ORGANIZATIONS + HEALTH                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     Management Account                               │   │
│   │                        (Org Master)                                  │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │              Organization Health Dashboard                   │    │   │
│   │  │                                                              │    │   │
│   │  │  📊 Aggregated Health Events from ALL member accounts       │    │   │
│   │  │                                                              │    │   │
│   │  │  ┌─────────────────────────────────────────────────────┐   │    │   │
│   │  │  │ Account: Production (123456789012)                   │   │    │   │
│   │  │  │ └── 2 EC2 retirements scheduled                      │   │    │   │
│   │  │  │ └── 1 RDS maintenance                                │   │    │   │
│   │  │  │                                                      │   │    │   │
│   │  │  │ Account: Development (234567890123)                  │   │    │   │
│   │  │  │ └── 0 open issues                                    │   │    │   │
│   │  │  │                                                      │   │    │   │
│   │  │  │ Account: Staging (345678901234)                      │   │    │   │
│   │  │  │ └── 1 certificate expiring                           │   │    │   │
│   │  │  └─────────────────────────────────────────────────────┘   │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   API: DescribeEventsForOrganization                                        │
│   (Requires enabling Organizational Health in AWS Organizations)            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Enable Organizational Health

```python
import boto3

# Enable organizational health view
organizations = boto3.client('organizations')
health = boto3.client('health', region_name='us-east-1')

# Enable health access for organization
health.enable_health_service_access_for_organization()

# Query health events across all accounts
events = health.describe_events_for_organization(
    filter={
        'eventStatusCodes': ['open', 'upcoming'],
    }
)

for event in events['events']:
    print(f"Account: {event.get('awsAccountId', 'N/A')}")
    print(f"Service: {event['service']}")
    print(f"Event: {event['eventTypeCode']}")
    print("---")
```

---

## 📱 Common Event Types

### EC2 Events

| Event Type Code | Mô Tả | Severity |
|-----------------|-------|----------|
| `AWS_EC2_INSTANCE_RETIREMENT_SCHEDULED` | Instance sẽ bị retire | ⚠️ High |
| `AWS_EC2_INSTANCE_STORE_DRIVE_PERFORMANCE_DEGRADED` | Disk performance issue | ⚠️ Medium |
| `AWS_EC2_SYSTEM_MAINTENANCE_EVENT` | Planned maintenance | 📋 Low |
| `AWS_EC2_PERSISTENT_INSTANCE_RETIREMENT` | Phải migrate ngay | 🔴 Critical |

### RDS Events

| Event Type Code | Mô Tả | Severity |
|-----------------|-------|----------|
| `AWS_RDS_MAINTENANCE_SCHEDULED` | Scheduled maintenance window | 📋 Low |
| `AWS_RDS_HARDWARE_MAINTENANCE` | Hardware needs replacement | ⚠️ Medium |
| `AWS_RDS_SECURITY_NOTIFICATION` | Security-related update | 🔴 Critical |

### EBS Events

| Event Type Code | Mô Tả | Severity |
|-----------------|-------|----------|
| `AWS_EBS_VOLUME_ISSUE` | Volume impaired | 🔴 Critical |
| `AWS_EBS_VOLUME_IO_PERFORMANCE_ISSUE` | I/O degradation | ⚠️ High |

---

## 🛠️ Terraform Configuration

### Create EventBridge Rule for Health Events

```hcl
# EventBridge Rule for Health Events
resource "aws_cloudwatch_event_rule" "health_events" {
  name        = "capture-health-events"
  description = "Capture all AWS Health events"

  event_pattern = jsonencode({
    source = ["aws.health"]
    detail-type = ["AWS Health Event"]
  })
}

# SNS Topic for notifications
resource "aws_sns_topic" "health_alerts" {
  name = "aws-health-alerts"
}

# EventBridge Target - SNS
resource "aws_cloudwatch_event_target" "health_to_sns" {
  rule      = aws_cloudwatch_event_rule.health_events.name
  target_id = "send-to-sns"
  arn       = aws_sns_topic.health_alerts.arn

  input_transformer {
    input_paths = {
      eventTypeCode = "$.detail.eventTypeCode"
      service       = "$.detail.service"
      region        = "$.region"
      description   = "$.detail.eventDescription[0].latestDescription"
    }
    input_template = <<EOF
{
  "message": "AWS Health Alert: <eventTypeCode>",
  "service": "<service>",
  "region": "<region>",
  "description": "<description>"
}
EOF
  }
}

# Allow EventBridge to publish to SNS
resource "aws_sns_topic_policy" "health_alerts_policy" {
  arn = aws_sns_topic.health_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.health_alerts.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.health_events.arn
          }
        }
      }
    ]
  })
}

# Lambda for automated response
resource "aws_lambda_function" "health_handler" {
  filename         = "health_handler.zip"
  function_name    = "health-event-handler"
  role             = aws_iam_role.health_lambda_role.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.health_alerts.arn
    }
  }
}

# EventBridge Target - Lambda
resource "aws_cloudwatch_event_target" "health_to_lambda" {
  rule      = aws_cloudwatch_event_rule.health_events.name
  target_id = "invoke-lambda"
  arn       = aws_lambda_function.health_handler.arn
}

# Allow EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_handler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_events.arn
}
```

---

## 📊 Best Practices

### 1. Monitoring & Alerting

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BEST PRACTICES                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ✅ DO:                                                                    │
│   ─────                                                                      │
│   • Set up EventBridge rules for critical event types                       │
│   • Create SNS topics for different severity levels                         │
│   • Automate responses where possible (EC2 retirement → create AMI)        │
│   • Use Organization Health for multi-account visibility                    │
│   • Check Health Dashboard during outages before debugging                  │
│   • Integrate with incident management (PagerDuty, OpsGenie)               │
│                                                                              │
│   ❌ DON'T:                                                                 │
│   ───────                                                                    │
│   • Ignore scheduled maintenance notifications                              │
│   • Wait until retirement date to migrate resources                         │
│   • Overlook certificate expiration warnings                                │
│   • Skip Health Dashboard check during troubleshooting                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Prioritization Matrix

| Event Category | Response Time | Action |
|----------------|---------------|--------|
| **Critical Issues** | Immediate | Page on-call, investigate |
| **Hardware Retirement** | Within 24h | Plan migration |
| **Scheduled Maintenance** | Before window | Prepare, notify stakeholders |
| **Account Notifications** | Weekly | Review and plan |

### 3. Automation Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTOMATION RECOMMENDATIONS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   EC2 Retirement Events:                                                     │
│   ☐ Auto-create AMI backup                                                  │
│   ☐ Notify team via Slack/Email                                             │
│   ☐ Create Jira ticket for migration                                        │
│   ☐ Update CMDB/inventory                                                   │
│                                                                              │
│   RDS Maintenance:                                                           │
│   ☐ Send calendar invite for maintenance window                             │
│   ☐ Notify application owners                                               │
│   ☐ Check if maintenance window is acceptable                               │
│                                                                              │
│   Certificate Expiration:                                                    │
│   ☐ Alert 30 days before expiry                                             │
│   ☐ Auto-renew if using ACM managed certificates                           │
│   ☐ Create ticket for manual renewal if needed                              │
│                                                                              │
│   EBS Volume Issues:                                                         │
│   ☐ Page on-call immediately                                                │
│   ☐ Create snapshot automatically                                           │
│   ☐ Prepare replacement volume                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🆚 So Sánh Với Services Khác

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HEALTH DASHBOARD vs OTHER SERVICES                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Service              │ Purpose                │ Scope                     │
│   ─────────────────────────────────────────────────────────────────────────│
│   Health Dashboard     │ AWS service issues      │ Infrastructure health    │
│                        │ Affected resources      │                          │
│   ─────────────────────────────────────────────────────────────────────────│
│   CloudWatch           │ Metrics & alarms        │ Application monitoring   │
│                        │ Logs analysis           │                          │
│   ─────────────────────────────────────────────────────────────────────────│
│   CloudTrail           │ API audit logs          │ Who did what             │
│                        │ Security & compliance   │                          │
│   ─────────────────────────────────────────────────────────────────────────│
│   X-Ray                │ Distributed tracing     │ Request flow debugging   │
│                        │ Performance analysis    │                          │
│   ─────────────────────────────────────────────────────────────────────────│
│   Systems Manager      │ Operations management   │ Resource management      │
│                        │ Patch management        │                          │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                              │
│   💡 TIP: Use ALL of them together for complete observability!             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Tổng Kết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS HEALTH DASHBOARD SUMMARY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🏥 TWO DASHBOARDS:                                                        │
│   • Service Health (Public) - Status của tất cả AWS services               │
│   • Personal Health (Private) - Issues affecting YOUR resources            │
│                                                                              │
│   🔔 THREE EVENT TYPES:                                                     │
│   • Account Notifications - General announcements                           │
│   • Scheduled Changes - Maintenance, retirements                            │
│   • Issues - Ongoing problems                                               │
│                                                                              │
│   🔗 KEY INTEGRATIONS:                                                      │
│   • EventBridge → Automated responses                                       │
│   • SNS → Notifications (Email, Slack, PagerDuty)                          │
│   • Lambda → Custom automation                                              │
│   • Organizations → Multi-account visibility                                │
│                                                                              │
│   ⚠️ IMPORTANT:                                                             │
│   • Health API requires Business/Enterprise Support                         │
│   • Always check Health Dashboard first during outages                      │
│   • Automate responses to critical events                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Tài Liệu Tham Khảo

- [AWS Health Dashboard](https://health.aws.amazon.com/)
- [Personal Health Dashboard Guide](https://docs.aws.amazon.com/health/latest/ug/)
- [AWS Health API Reference](https://docs.aws.amazon.com/health/latest/APIReference/)
- [EventBridge + Health Integration](https://docs.aws.amazon.com/health/latest/ug/cloudwatch-events-health.html)
