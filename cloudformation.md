# AWS CloudFormation - Infrastructure as Code


## Mục lục

- [Tổng quan](#tổng-quan)
- [️ Các khái niệm cốt lõi](#các-khái-niệm-cốt-lõi)
- [Cấu trúc Template](#cấu-trúc-template)
- [Intrinsic Functions](#intrinsic-functions)
- [Ví dụ thực tế](#ví-dụ-thực-tế)
- [Stack Updates và Change Sets](#stack-updates-và-change-sets)
- [Rollback và Protection](#rollback-và-protection)
- [Nested Stacks và Cross-Stack References](#nested-stacks-và-cross-stack-references)
- [️ Drift Detection](#drift-detection)
- [CloudFormation vs Terraform](#cloudformation-vs-terraform)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Tổng kết](#tổng-kết)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## 📖 Tổng quan

**AWS CloudFormation** là dịch vụ **Infrastructure as Code (IaC)** cho phép bạn mô hình hóa và cung cấp toàn bộ hạ tầng AWS bằng code (JSON/YAML).

### IaC là gì?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL (Manual)                              │
│                                                                       │
│   DevOps Engineer:                                                   │
│   ├── Login AWS Console                                              │
│   ├── Click tạo VPC                                                  │
│   ├── Click tạo Subnet                                               │
│   ├── Click tạo Security Group                                       │
│   ├── Click tạo EC2...                                               │
│   └── Repeat 100 lần cho Production!                                │
│                                                                       │
│   Problems:                                                          │
│   ├── ❌ Human errors (quên config, typo)                           │
│   ├── ❌ Không reproducible (dev ≠ prod)                            │
│   ├── ❌ Không version control                                       │
│   └── ❌ Tốn thời gian                                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE AS CODE                            │
│                                                                       │
│   DevOps Engineer:                                                   │
│   └── Viết 1 file YAML → Deploy → Done!                             │
│                                                                       │
│   ┌────────────────────────┐         ┌────────────────────────┐     │
│   │   template.yaml        │  ──▶   │   AWS Resources        │     │
│   │   (Định nghĩa infra)   │ Deploy  │   (VPC, EC2, RDS...)  │     │
│   └────────────────────────┘         └────────────────────────┘     │
│                                                                       │
│   Benefits:                                                          │
│   ├── ✅ Reproducible (chạy lại y hệt)                              │
│   ├── ✅ Version control (Git)                                       │
│   ├── ✅ Review changes trước khi apply                             │
│   ├── ✅ Rollback khi có lỗi                                        │
│   └── ✅ Tự động hóa hoàn toàn                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### CloudFormation vs Các IaC Tools khác

| Feature | CloudFormation | Terraform | AWS CDK | Pulumi |
|---------|---------------|-----------|---------|--------|
| **Vendor** | AWS native | HashiCorp | AWS | Pulumi |
| **Multi-cloud** | ❌ AWS only | ✅ Yes | ❌ AWS focused | ✅ Yes |
| **Language** | JSON/YAML | HCL | TypeScript, Python, Java... | Any language |
| **State** | AWS managed | Self-managed | CloudFormation | Self-managed |
| **Cost** | Free | Free/Paid | Free | Free/Paid |
| **Learning curve** | Medium | Medium | Low (nếu biết code) | Low |

---

## 🏗️ Các khái niệm cốt lõi

### Template, Stack, và Resources

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFORMATION CONCEPTS                           │
│                                                                       │
│   ┌─────────────────┐                                                │
│   │    TEMPLATE     │  ← File JSON/YAML định nghĩa resources        │
│   │   (Blueprint)   │                                                │
│   └────────┬────────┘                                                │
│            │                                                         │
│            │ Deploy (create-stack)                                   │
│            ▼                                                         │
│   ┌─────────────────┐                                                │
│   │     STACK       │  ← Instance của template                      │
│   │   (Instance)    │  ← Quản lý lifecycle của resources            │
│   └────────┬────────┘                                                │
│            │                                                         │
│            │ Creates & manages                                       │
│            ▼                                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      RESOURCES                               │   │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │   │
│   │   │   VPC   │  │   EC2   │  │   RDS   │  │ Lambda...   │   │   │
│   │   └─────────┘  └─────────┘  └─────────┘  └─────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Workflow cơ bản

```
┌─────────────────────────────────────────────────────────────────────┐
│                 CLOUDFORMATION WORKFLOW                              │
│                                                                       │
│   1. WRITE TEMPLATE                                                  │
│      ┌─────────────────────────────────────────────────────────┐    │
│      │  AWSTemplateFormatVersion: '2010-09-09'                 │    │
│      │  Resources:                                              │    │
│      │    MyBucket:                                             │    │
│      │      Type: AWS::S3::Bucket                               │    │
│      │      Properties:                                         │    │
│      │        BucketName: my-unique-bucket                       │    │
│      └─────────────────────────────────────────────────────────┘    │
│                            │                                         │
│                            ▼                                         │
│   2. VALIDATE TEMPLATE                                               │
│      aws cloudformation validate-template --template-body file://... │
│                            │                                         │
│                            ▼                                         │
│   3. CREATE STACK                                                    │
│      aws cloudformation create-stack --stack-name my-stack \         │
│          --template-body file://template.yaml                        │
│                            │                                         │
│                            ▼                                         │
│   4. MONITOR PROGRESS                                                │
│      ┌──────────────────────────────────────────────────────────┐   │
│      │  CREATE_IN_PROGRESS → CREATE_COMPLETE                    │   │
│      │             or                                            │   │
│      │  CREATE_IN_PROGRESS → CREATE_FAILED → ROLLBACK_COMPLETE  │   │
│      └──────────────────────────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│   5. UPDATE STACK (khi cần thay đổi)                                │
│      aws cloudformation update-stack ...                             │
│                            │                                         │
│                            ▼                                         │
│   6. DELETE STACK (cleanup)                                          │
│      aws cloudformation delete-stack --stack-name my-stack           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Cấu trúc Template

### Template Anatomy

```yaml
AWSTemplateFormatVersion: '2010-09-09'    # Phiên bản template (cố định)
Description: 'Mô tả template của bạn'      # Optional nhưng nên có

# ═══════════════════════════════════════════════════════════════════
# PARAMETERS - Input values từ user khi deploy
# ═══════════════════════════════════════════════════════════════════
Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
    Default: dev

# ═══════════════════════════════════════════════════════════════════
# MAPPINGS - Static key-value lookup tables
# ═══════════════════════════════════════════════════════════════════
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-12345678
    ap-southeast-1:
      AMI: ami-87654321

# ═══════════════════════════════════════════════════════════════════
# CONDITIONS - Conditional resource creation
# ═══════════════════════════════════════════════════════════════════
Conditions:
  IsProduction: !Equals [!Ref Environment, prod]

# ═══════════════════════════════════════════════════════════════════
# RESOURCES - AWS resources to create (BẮT BUỘC)
# ═══════════════════════════════════════════════════════════════════
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'my-bucket-${Environment}'

# ═══════════════════════════════════════════════════════════════════
# OUTPUTS - Values to export/return
# ═══════════════════════════════════════════════════════════════════
Outputs:
  BucketArn:
    Value: !GetAtt MyBucket.Arn
    Export:
      Name: MyBucketArn
```

### Giải thích các sections

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TEMPLATE SECTIONS                                 │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  PARAMETERS (Optional)                                       │   │
│   │  ├── Input từ user khi deploy                               │   │
│   │  ├── Có thể set default values                              │   │
│   │  ├── Validation: AllowedValues, AllowedPattern              │   │
│   │  └── Ví dụ: Environment, InstanceType, DBPassword            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  MAPPINGS (Optional)                                         │   │
│   │  ├── Static lookup tables                                    │   │
│   │  ├── Không thể dynamic (phải hardcode)                      │   │
│   │  └── Ví dụ: AMI IDs per region, instance sizes per env      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  CONDITIONS (Optional)                                       │   │
│   │  ├── Tạo resource có điều kiện                              │   │
│   │  ├── Dựa trên parameter values                               │   │
│   │  └── Ví dụ: Chỉ tạo RDS replica nếu env = prod             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  RESOURCES (Required - Phần quan trọng nhất!)               │   │
│   │  ├── Định nghĩa AWS resources cần tạo                       │   │
│   │  ├── Mỗi resource có Type và Properties                     │   │
│   │  └── CloudFormation tự xác định dependency order            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  OUTPUTS (Optional)                                          │   │
│   │  ├── Return values sau khi stack tạo xong                   │   │
│   │  ├── Export để stack khác reference                          │   │
│   │  └── Ví dụ: VPC ID, Load Balancer DNS, API endpoint         │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Intrinsic Functions

CloudFormation cung cấp các built-in functions để xử lý dynamic values:

### Các functions thường dùng

```yaml
# ═══════════════════════════════════════════════════════════════════
# !Ref - Reference parameter hoặc resource
# ═══════════════════════════════════════════════════════════════════
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceTypeParam    # Reference parameter
      SubnetId: !Ref MySubnet                  # Reference resource

# ═══════════════════════════════════════════════════════════════════
# !GetAtt - Lấy attribute của resource
# ═══════════════════════════════════════════════════════════════════
Outputs:
  InstancePublicIP:
    Value: !GetAtt MyInstance.PublicIp        # Lấy Public IP
  BucketArn:
    Value: !GetAtt MyBucket.Arn               # Lấy ARN
  BucketDomainName:
    Value: !GetAtt MyBucket.DomainName        # Lấy domain

# ═══════════════════════════════════════════════════════════════════
# !Sub - String substitution (thay thế biến)
# ═══════════════════════════════════════════════════════════════════
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'my-app-${Environment}-${AWS::Region}'
      # Kết quả: my-app-prod-us-east-1

  # Với mapping phức tạp:
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub
        - '${Prefix}-${Env}-handler'
        - Prefix: myapp
          Env: !Ref Environment

# ═══════════════════════════════════════════════════════════════════
# !Join - Nối strings
# ═══════════════════════════════════════════════════════════════════
Outputs:
  ConnectionString:
    Value: !Join
      - ''                                     # Delimiter
      - - 'https://'
        - !GetAtt MyALB.DNSName
        - '/api/v1'
    # Kết quả: https://my-alb-12345.elb.amazonaws.com/api/v1

# ═══════════════════════════════════════════════════════════════════
# !If - Conditional values
# ═══════════════════════════════════════════════════════════════════
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !If
        - IsProduction              # Condition name
        - m5.xlarge                 # If true
        - t3.micro                  # If false

# ═══════════════════════════════════════════════════════════════════
# !FindInMap - Lookup từ Mappings
# ═══════════════════════════════════════════════════════════════════
Mappings:
  RegionAMI:
    us-east-1:
      HVM64: ami-12345678
    ap-southeast-1:
      HVM64: ami-87654321

Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap
        - RegionAMI                # Map name
        - !Ref 'AWS::Region'       # Top-level key
        - HVM64                    # Second-level key

# ═══════════════════════════════════════════════════════════════════
# !ImportValue - Import từ stack khác
# ═══════════════════════════════════════════════════════════════════
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      SubnetId: !ImportValue NetworkStack-SubnetId   # Export name từ stack khác
```

### Pseudo Parameters (Built-in)

```yaml
# AWS cung cấp sẵn các pseudo parameters:
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-${AWS::Region}-${AWS::AccountId}'
      
# Các pseudo parameters:
# ├── AWS::StackName      → Tên stack hiện tại
# ├── AWS::StackId        → ID của stack
# ├── AWS::Region         → Region đang deploy (us-east-1, ap-southeast-1...)
# ├── AWS::AccountId      → AWS Account ID (123456789012)
# ├── AWS::NotificationARNs → SNS topic ARNs cho stack events
# ├── AWS::NoValue        → Bỏ qua property (dùng với !If)
# └── AWS::URLSuffix      → amazonaws.com (hoặc amazonaws.com.cn cho China)
```

---

## 🚀 Ví dụ thực tế

### Ví dụ 1: S3 Bucket đơn giản

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Simple S3 Bucket'

Parameters:
  BucketName:
    Type: String
    Description: Name of the S3 bucket

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

Outputs:
  BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt MyBucket.Arn
  BucketName:
    Description: Name of the S3 bucket
    Value: !Ref MyBucket
```

### Ví dụ 2: VPC với Public/Private Subnets

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC with Public and Private Subnets'

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]

Resources:
  # ═══════════════════════════════════════════════════════════════
  # VPC
  # ═══════════════════════════════════════════════════════════════
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'

  # ═══════════════════════════════════════════════════════════════
  # Internet Gateway
  # ═══════════════════════════════════════════════════════════════
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # ═══════════════════════════════════════════════════════════════
  # Public Subnet
  # ═══════════════════════════════════════════════════════════════
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  # ═══════════════════════════════════════════════════════════════
  # Private Subnet
  # ═══════════════════════════════════════════════════════════════
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet'

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-VpcId'
  
  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${Environment}-PublicSubnetId'
  
  PrivateSubnetId:
    Description: Private Subnet ID
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${Environment}-PrivateSubnetId'
```

### Ví dụ 3: EC2 với Security Group

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'EC2 Instance with Security Group'

Parameters:
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues: [t3.micro, t3.small, t3.medium]
  
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
  
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC to deploy into
  
  SubnetId:
    Type: AWS::EC2::Subnet::Id
    Description: Subnet to deploy into

Mappings:
  RegionAMI:
    us-east-1:
      AMI: ami-0c02fb55956c7d316    # Amazon Linux 2
    ap-southeast-1:
      AMI: ami-0753e0e42b20e96e3

Resources:
  # Security Group
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP and SSH
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: web-sg

  # EC2 Instance
  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
      SubnetId: !Ref SubnetId
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Hello from CloudFormation!</h1>" > /var/www/html/index.html
      Tags:
        - Key: Name
          Value: WebServer

Outputs:
  InstanceId:
    Value: !Ref WebServer
  PublicIP:
    Value: !GetAtt WebServer.PublicIp
  PublicDNS:
    Value: !GetAtt WebServer.PublicDnsName
```

---

## 🔄 Stack Updates và Change Sets

### Update Behaviors

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UPDATE BEHAVIORS                                  │
│                                                                       │
│   Khi update stack, mỗi property có thể có behavior khác nhau:      │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. NO INTERRUPTION                                          │   │
│   │     └── Update in-place, không downtime                     │   │
│   │     └── Ví dụ: Thêm tag, update security group rules        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  2. SOME INTERRUPTION                                        │   │
│   │     └── Resource bị restart/reboot                          │   │
│   │     └── Ví dụ: Thay đổi instance type                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  3. REPLACEMENT ⚠️                                           │   │
│   │     └── Resource bị DELETE và CREATE mới                     │   │
│   │     └── DATA CÓ THỂ BỊ MẤT!                                  │   │
│   │     └── Ví dụ: Thay đổi DBInstanceIdentifier, InstanceId     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   Luôn check documentation để biết update behavior!                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Change Sets

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CHANGE SETS                                       │
│      Preview changes trước khi apply!                                │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. Create Change Set                                        │   │
│   │     aws cloudformation create-change-set \                   │   │
│   │       --stack-name my-stack \                                │   │
│   │       --change-set-name my-changes \                         │   │
│   │       --template-body file://template.yaml                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  2. Review Changes                                           │   │
│   │     aws cloudformation describe-change-set \                 │   │
│   │       --change-set-name my-changes \                         │   │
│   │       --stack-name my-stack                                  │   │
│   │                                                               │   │
│   │     Output:                                                   │   │
│   │     ┌─────────────────────────────────────────────────────┐  │   │
│   │     │ Resource: MyInstance                                 │  │   │
│   │     │ Action: Modify                                       │  │   │
│   │     │ Replacement: True  ⚠️ CAUTION!                      │  │   │
│   │     │ Details:                                             │  │   │
│   │     │   - InstanceType: t3.micro → t3.large               │  │   │
│   │     └─────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  3. Execute or Delete                                        │   │
│   │     # Apply changes:                                         │   │
│   │     aws cloudformation execute-change-set \                  │   │
│   │       --change-set-name my-changes \                         │   │
│   │       --stack-name my-stack                                  │   │
│   │                                                               │   │
│   │     # Or cancel:                                             │   │
│   │     aws cloudformation delete-change-set \                   │   │
│   │       --change-set-name my-changes \                         │   │
│   │       --stack-name my-stack                                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Rollback và Protection

### Rollback Behaviors

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ROLLBACK BEHAVIORS                                │
│                                                                       │
│   CREATE STACK FAILURE:                                              │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Default: Rollback on failure (delete all created resources) │   │
│   │                                                               │   │
│   │  Options:                                                     │   │
│   │  ├── --on-failure ROLLBACK  (default)                        │   │
│   │  ├── --on-failure DELETE                                     │   │
│   │  └── --on-failure DO_NOTHING (để debug)                     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   UPDATE STACK FAILURE:                                              │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Default: Rollback về state trước đó                        │   │
│   │                                                               │   │
│   │  Stack status: UPDATE_ROLLBACK_COMPLETE                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Stack Protection

```yaml
# Termination Protection
# Ngăn xóa stack vô tình
aws cloudformation update-termination-protection \
  --stack-name my-stack \
  --enable-termination-protection

# Stack Policy - Ngăn update resources cụ thể
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "Update:*",
      "Principal": "*",
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": "Update:Replace",
      "Principal": "*",
      "Resource": "LogicalResourceId/ProductionDatabase"
    }
  ]
}
```

### DeletionPolicy

```yaml
Resources:
  # Giữ lại S3 bucket khi xóa stack
  ImportantBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    
  # Tạo snapshot RDS trước khi xóa
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      # ...

  # Xóa luôn (default behavior)
  TempBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete

# DeletionPolicy values:
# ├── Delete   - Xóa resource khi xóa stack (default)
# ├── Retain   - Giữ lại resource, không xóa
# └── Snapshot - Tạo snapshot trước khi xóa (RDS, EC2 volumes)
```

---

## 🔗 Nested Stacks và Cross-Stack References

### Nested Stacks

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NESTED STACKS                                     │
│      Chia template lớn thành nhiều templates nhỏ                    │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     ROOT STACK                               │   │
│   │                    (main.yaml)                               │   │
│   │                         │                                    │   │
│   │     ┌───────────────────┼───────────────────┐               │   │
│   │     ▼                   ▼                   ▼               │   │
│   │  ┌───────────┐    ┌───────────┐    ┌───────────┐           │   │
│   │  │  Network  │    │  Compute  │    │  Database │           │   │
│   │  │  Stack    │    │  Stack    │    │  Stack    │           │   │
│   │  │(vpc.yaml) │    │(ec2.yaml) │    │(rds.yaml) │           │   │
│   │  └───────────┘    └───────────┘    └───────────┘           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   Benefits:                                                          │
│   ├── Reusable components                                            │
│   ├── Easier to maintain                                             │
│   ├── Overcome 500 resource limit                                    │
│   └── Parallel updates                                               │
└─────────────────────────────────────────────────────────────────────┘
```

```yaml
# main.yaml (Root Stack)
Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/vpc.yaml
      Parameters:
        Environment: !Ref Environment

  ComputeStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/ec2.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetId: !GetAtt NetworkStack.Outputs.SubnetId
```

### Cross-Stack References

```yaml
# Stack A - Exports values
Outputs:
  VpcId:
    Value: !Ref VPC
    Export:
      Name: SharedVpcId      # ← Export name (unique trong region)

# Stack B - Imports values
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      SubnetId: !ImportValue SharedVpcId    # ← Import bằng export name
```

---

## 🛠️ Drift Detection

Phát hiện khi resources bị thay đổi NGOÀI CloudFormation (manual changes):

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DRIFT DETECTION                                   │
│                                                                       │
│   ┌───────────────────┐         ┌───────────────────┐               │
│   │   CloudFormation  │  vs     │   Actual State    │               │
│   │   Template State  │         │   (AWS Resources) │               │
│   └─────────┬─────────┘         └─────────┬─────────┘               │
│             │                             │                          │
│             └──────────┬──────────────────┘                          │
│                        ▼                                             │
│              ┌─────────────────────┐                                 │
│              │   DRIFT DETECTED!   │                                 │
│              │                     │                                 │
│              │   Security Group:   │                                 │
│              │   Expected: port 80 │                                 │
│              │   Actual: port 80,  │                                 │
│              │           port 443  │← Someone added 443 manually!    │
│              └─────────────────────┘                                 │
│                                                                       │
│   Commands:                                                          │
│   # Start drift detection                                            │
│   aws cloudformation detect-stack-drift --stack-name my-stack        │
│                                                                       │
│   # Check drift status                                               │
│   aws cloudformation describe-stack-drift-detection-status \         │
│     --stack-drift-detection-id <id>                                  │
│                                                                       │
│   # View drift details                                               │
│   aws cloudformation describe-stack-resource-drifts \                │
│     --stack-name my-stack                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 CloudFormation vs Terraform

```
┌─────────────────────────────────────────────────────────────────────┐
│              CLOUDFORMATION vs TERRAFORM                             │
│                                                                       │
│   ┌───────────────────────────┬───────────────────────────────────┐ │
│   │      CloudFormation       │           Terraform               │ │
│   ├───────────────────────────┼───────────────────────────────────┤ │
│   │ AWS native                │ Multi-cloud                       │ │
│   │ JSON/YAML                 │ HCL (HashiCorp Language)          │ │
│   │ State managed by AWS      │ State file (S3, Terraform Cloud)  │ │
│   │ Free                      │ Free / Paid (Cloud)               │ │
│   │ Drift detection built-in  │ Drift detection (terraform plan)  │ │
│   │ Nested stacks             │ Modules                           │ │
│   │ Change Sets               │ terraform plan                    │ │
│   │ Rollback automatic        │ Manual rollback                   │ │
│   │ AWS Support               │ Community + HashiCorp             │ │
│   └───────────────────────────┴───────────────────────────────────┘ │
│                                                                       │
│   Choose CloudFormation if:                                          │
│   ├── 100% AWS infrastructure                                        │
│   ├── Want AWS-managed state                                         │
│   ├── Need AWS Support                                               │
│   └── Using AWS CDK                                                  │
│                                                                       │
│   Choose Terraform if:                                               │
│   ├── Multi-cloud (AWS + GCP + Azure)                               │
│   ├── Want HCL syntax                                                │
│   ├── Need non-AWS providers                                         │
│   └── Team already knows Terraform                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### So sánh Syntax: VPC + Subnet + EC2

**CloudFormation (YAML):**

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC with EC2'

Resources:
  # Tạo VPC
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: my-vpc

  # Tạo Subnet
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: public-subnet

  # Tạo Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref InternetGateway

  # Tạo EC2
  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: ami-0c02fb55956c7d316
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: web-server

Outputs:
  VpcId:
    Value: !Ref MyVPC
  InstancePublicIP:
    Value: !GetAtt WebServer.PublicIp
```

**Terraform (HCL) - Tương đương:**

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Tạo VPC
resource "aws_vpc" "my_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags = {
    Name = "my-vpc"
  }
}

# Tạo Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.my_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet"
  }
}

# Tạo Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.my_vpc.id

  tags = {
    Name = "my-igw"
  }
}

# Tạo EC2
resource "aws_instance" "web_server" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "web-server"
  }
}

# Outputs
output "vpc_id" {
  value = aws_vpc.my_vpc.id
}

output "instance_public_ip" {
  value = aws_instance.web_server.public_ip
}
```

### So sánh Workflow

| Bước | CloudFormation | Terraform |
|------|----------------|-----------|
| **1. Validate** | `aws cloudformation validate-template` | `terraform validate` |
| **2. Preview** | `create-change-set` + `describe-change-set` | `terraform plan` |
| **3. Deploy** | `create-stack` hoặc `execute-change-set` | `terraform apply` |
| **4. View** | `describe-stacks` | `terraform show` |
| **5. Delete** | `delete-stack` | `terraform destroy` |

### So sánh Reference Syntax

| Thao tác | CloudFormation | Terraform |
|----------|----------------|-----------|
| **Reference resource** | `!Ref MyVPC` | `aws_vpc.my_vpc.id` |
| **Get attribute** | `!GetAtt MyVPC.VpcId` | `aws_vpc.my_vpc.id` |
| **String interpolation** | `!Sub 'prefix-${Var}'` | `"prefix-${var.name}"` |
| **Conditional** | `!If [Cond, A, B]` | `condition ? A : B` |
| **Join strings** | `!Join ["-", [a, b]]` | `join("-", [a, b])` |

### Terraform có thể tạo TẤT CẢ resources mà CloudFormation tạo được

```
┌─────────────────────────────────────────────────────────────────────┐
│                TERRAFORM AWS PROVIDER                                │
│                                                                       │
│   Terraform AWS Provider hỗ trợ TẤT CẢ AWS services:                │
│                                                                       │
│   ├── VPC, Subnet, Security Group, NAT Gateway                      │
│   ├── EC2, EBS, AMI, Launch Template, ASG                           │
│   ├── S3, CloudFront, Route53                                        │
│   ├── RDS, DynamoDB, ElastiCache, Redshift                          │
│   ├── Lambda, API Gateway, Step Functions                            │
│   ├── ECS, EKS, Fargate                                              │
│   ├── IAM Roles, Policies, Users                                     │
│   ├── CloudWatch, SNS, SQS, EventBridge                             │
│   ├── Cognito, Secrets Manager, SSM Parameter Store                 │
│   └── ... và 1000+ resource types khác!                             │
│                                                                       │
│   Bonus: Terraform còn hỗ trợ:                                       │
│   ├── Google Cloud (GCP)                                             │
│   ├── Microsoft Azure                                                │
│   ├── Kubernetes                                                      │
│   ├── GitHub, GitLab                                                 │
│   ├── Datadog, PagerDuty                                             │
│   └── 3000+ providers khác!                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Pricing

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFORMATION PRICING                            │
│                                                                       │
│   CloudFormation Service = $0 (MIỄN PHÍ!)                           │
│                                                                       │
│   Bạn chỉ trả tiền cho resources trong template:                    │
│   ├── EC2 Instances                                                  │
│   ├── RDS Databases                                                  │
│   ├── S3 Buckets                                                     │
│   ├── Load Balancers                                                 │
│   ├── Lambda Functions                                               │
│   └── ... tất cả resources khác                                     │
│                                                                       │
│   ⚠️ PHÍ CHỈ PHÁT SINH khi dùng:                                    │
│   └── 3rd-party resource types (từ AWS Public Registry)            │
│       → Rất ít dùng, hầu hết không cần                              │
└─────────────────────────────────────────────────────────────────────┘
```

### So sánh pricing các IaC tools

| Tool | Service Cost | Resource Cost | Paid Options |
|------|--------------|---------------|--------------|
| **CloudFormation** | FREE | Trả tiền resources | 3rd-party types (hiếm) |
| **CDK** | FREE | Trả tiền resources | Không |
| **Terraform** | FREE (Open Source) | Trả tiền resources | Terraform Cloud (enterprise) |
| **Elastic Beanstalk** | FREE | Trả tiền resources | Không |

**Tóm lại**: Tất cả deployment/IaC tools đều **miễn phí** - chỉ trả tiền cho EC2, RDS, S3... mà bạn tạo ra!

---

## 💡 Best Practices

### 1. Template Organization

```
project/
├── templates/
│   ├── main.yaml           # Root stack
│   ├── network/
│   │   ├── vpc.yaml
│   │   └── security-groups.yaml
│   ├── compute/
│   │   ├── ec2.yaml
│   │   └── asg.yaml
│   └── database/
│       └── rds.yaml
├── parameters/
│   ├── dev.json
│   ├── staging.json
│   └── prod.json
└── scripts/
    ├── deploy.sh
    └── destroy.sh
```

### 2. Naming Conventions

```yaml
# Use consistent naming
Resources:
  # Format: {Project}{Environment}{ResourceType}{Purpose}
  MyAppProdVpcMain:
    Type: AWS::EC2::VPC
    # ...
    
  MyAppProdSubnetPublic:
    Type: AWS::EC2::Subnet
    # ...
```

### 3. Always Use Parameters

```yaml
# ❌ BAD - Hardcoded values
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-prod-bucket-12345

# ✅ GOOD - Parameterized
Parameters:
  Environment:
    Type: String
  BucketSuffix:
    Type: String

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'my-${Environment}-bucket-${BucketSuffix}'
```

### 4. Use Outputs và Exports

```yaml
# Export important values for other stacks
Outputs:
  VpcId:
    Description: VPC ID for reference
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'
```

### 5. Tag Everything

```yaml
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      # ...
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-server'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: MyProject
        - Key: ManagedBy
          Value: CloudFormation
        - Key: CostCenter
          Value: Engineering
```

---

## 🎯 Tổng kết

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFORMATION SUMMARY                            │
│                                                                       │
│   ✅ Infrastructure as Code cho AWS                                 │
│   ✅ Reproducible, version-controlled infrastructure                │
│   ✅ Tự động rollback khi có lỗi                                    │
│   ✅ Change Sets để preview trước khi apply                         │
│   ✅ Drift Detection phát hiện manual changes                       │
│   ✅ Nested Stacks cho large infrastructures                        │
│   ✅ Cross-stack references để share values                         │
│                                                                       │
│   📚 Recommended Learning Path:                                      │
│   1. Viết template đơn giản (S3, EC2)                               │
│   2. Hiểu intrinsic functions (!Ref, !Sub, !GetAtt)                │
│   3. Sử dụng Parameters và Conditions                                │
│   4. Practice với Change Sets                                        │
│   5. Học Nested Stacks                                               │
│   6. Explore AWS CDK (nếu muốn dùng programming language)           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Tài liệu tham khảo

- [CloudFormation User Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
- [Resource Types Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html)
- [Intrinsic Functions Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html)
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
