# AWS CDK (Cloud Development Kit)

## 📖 Tổng quan

**AWS CDK** là framework cho phép bạn định nghĩa AWS infrastructure **bằng programming languages** (TypeScript, Python, Java, C#, Go) thay vì JSON/YAML.

### CDK vs CloudFormation vs Terraform

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE AS CODE TOOLS                      │
│                                                                       │
│   CloudFormation          Terraform              AWS CDK             │
│   ─────────────           ─────────              ───────             │
│   YAML/JSON               HCL                    TypeScript/Python   │
│       │                     │                         │              │
│       │                     │                         │              │
│       ▼                     ▼                         ▼              │
│   Declarative           Declarative             Imperative          │
│   (mô tả state)         (mô tả state)           (viết logic)        │
│                                                       │              │
│                                                       ▼              │
│                                              ┌───────────────┐       │
│                                              │ CDK Synth     │       │
│                                              │ (compile)     │       │
│                                              └───────┬───────┘       │
│                                                      │               │
│                                                      ▼               │
│                                              CloudFormation          │
│                                              Template (YAML)         │
└─────────────────────────────────────────────────────────────────────┘
```

**Tóm lại**: CDK = Viết code → Generate CloudFormation template → Deploy

### Tại sao dùng CDK?

| Vấn đề với YAML/JSON | CDK giải quyết |
|---------------------|----------------|
| ❌ Không có IDE support (autocomplete) | ✅ Full IDE support, type checking |
| ❌ Copy-paste nhiều | ✅ Dùng loops, functions, classes |
| ❌ Khó test | ✅ Unit testing với Jest/pytest |
| ❌ Không có abstraction | ✅ High-level constructs (L2, L3) |
| ❌ Syntax lạ (!Ref, !Sub) | ✅ Native programming language |

---

## 🏗️ Các khái niệm cốt lõi

### App, Stack, Construct

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CDK ARCHITECTURE                              │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                          APP                                 │   │
│   │   (Entry point - 1 app có thể có nhiều stacks)              │   │
│   │                                                               │   │
│   │   ┌─────────────────────┐   ┌─────────────────────┐         │   │
│   │   │       STACK 1       │   │       STACK 2       │         │   │
│   │   │   (NetworkStack)    │   │   (ComputeStack)    │         │   │
│   │   │                     │   │                     │         │   │
│   │   │   ┌───────────────┐ │   │   ┌───────────────┐ │         │   │
│   │   │   │  CONSTRUCT    │ │   │   │  CONSTRUCT    │ │         │   │
│   │   │   │    (VPC)      │ │   │   │    (EC2)      │ │         │   │
│   │   │   └───────────────┘ │   │   └───────────────┘ │         │   │
│   │   │   ┌───────────────┐ │   │   ┌───────────────┐ │         │   │
│   │   │   │  CONSTRUCT    │ │   │   │  CONSTRUCT    │ │         │   │
│   │   │   │   (Subnet)    │ │   │   │   (Lambda)    │ │         │   │
│   │   │   └───────────────┘ │   │   └───────────────┘ │         │   │
│   │   └─────────────────────┘   └─────────────────────┘         │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   App    = Container cho tất cả stacks                               │
│   Stack  = Tương đương 1 CloudFormation stack                        │
│   Construct = Building block (VPC, EC2, Lambda, S3...)              │
└─────────────────────────────────────────────────────────────────────┘
```

### Construct Levels (L1, L2, L3)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONSTRUCT LEVELS                                  │
│                                                                       │
│   L3 - PATTERNS (High-level)                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  ApplicationLoadBalancedFargateService                       │   │
│   │  → Tạo ALB + ECS Fargate + Target Group + Security Groups   │   │
│   │  → 1 dòng code = 10+ resources                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   L2 - CURATED (Recommended)                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  s3.Bucket, ec2.Vpc, lambda.Function                        │   │
│   │  → Sensible defaults, helper methods                         │   │
│   │  → bucket.grantRead(lambda) thay vì viết IAM policy         │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   L1 - CFN RESOURCES (Low-level)                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  CfnBucket, CfnVPC, CfnFunction                             │   │
│   │  → 1:1 mapping với CloudFormation resources                  │   │
│   │  → Không có helper methods                                   │   │
│   │  → Prefix: Cfn*                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   Recommendation: Dùng L2 cho hầu hết cases, L3 khi có sẵn          │
└─────────────────────────────────────────────────────────────────────┘
```

| Level | Ví dụ | Khi nào dùng |
|-------|-------|--------------|
| **L1** | `CfnBucket` | Cần access CloudFormation property chưa có ở L2 |
| **L2** | `Bucket` | **Recommended** - đủ cho hầu hết use cases |
| **L3** | `ApplicationLoadBalancedFargateService` | Common patterns, muốn nhanh |

---

## 🚀 Getting Started

### Cài đặt

```bash
# Cài CDK CLI
npm install -g aws-cdk

# Verify
cdk --version
```

### Tạo project mới

```bash
# TypeScript (recommended)
mkdir my-cdk-app && cd my-cdk-app
cdk init app --language typescript

# Python
cdk init app --language python
source .venv/bin/activate
pip install -r requirements.txt
```

### Cấu trúc project (TypeScript)

```
my-cdk-app/
├── bin/
│   └── my-cdk-app.ts       # Entry point (App)
├── lib/
│   └── my-cdk-app-stack.ts # Stack definition
├── test/
│   └── my-cdk-app.test.ts  # Unit tests
├── cdk.json                 # CDK config
├── package.json
└── tsconfig.json
```

---

## 📝 Ví dụ Code

### Ví dụ 1: S3 Bucket

**CloudFormation (YAML):**
```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-bucket
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
```

**CDK (TypeScript):**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    new s3.Bucket(this, 'MyBucket', {
      bucketName: 'my-bucket',
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
  }
}
```

### Ví dụ 2: VPC với Subnets

**CDK (TypeScript):**
```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';

// 1 dòng code tạo VPC với:
// - 2 AZs
// - Public subnets (có Internet Gateway)
// - Private subnets (có NAT Gateway)
// - Route tables configured
const vpc = new ec2.Vpc(this, 'MyVpc', {
  maxAzs: 2,
  natGateways: 1,
});
```

**So sánh**: CloudFormation cần ~100 dòng YAML, CDK chỉ cần 5 dòng!

### Ví dụ 3: Lambda + API Gateway

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// Lambda function
const handler = new lambda.Function(this, 'MyHandler', {
  runtime: lambda.Runtime.NODEJS_18_X,
  code: lambda.Code.fromAsset('lambda'),  // thư mục chứa code
  handler: 'index.handler',
  environment: {
    TABLE_NAME: 'my-table',
  },
});

// API Gateway - tự tạo REST API + Integration + Deployment
const api = new apigateway.RestApi(this, 'MyApi');
api.root.addMethod('GET', new apigateway.LambdaIntegration(handler));
```

### Ví dụ 4: Permissions với grant* methods

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';

const bucket = new s3.Bucket(this, 'DataBucket');
const fn = new lambda.Function(this, 'Processor', { /* ... */ });

// Thay vì viết IAM Policy thủ công:
bucket.grantRead(fn);         // Lambda có thể đọc bucket
bucket.grantReadWrite(fn);    // Lambda có thể đọc/ghi
bucket.grantDelete(fn);       // Lambda có thể xóa objects

// CDK tự động:
// 1. Tạo IAM policy với đúng permissions
// 2. Attach policy vào Lambda execution role
// 3. Thêm bucket ARN vào Resource
```

---

## 🔧 CDK Commands

| Command | Mô tả |
|---------|-------|
| `cdk init` | Tạo project mới |
| `cdk synth` | Generate CloudFormation template (không deploy) |
| `cdk diff` | So sánh local vs deployed |
| `cdk deploy` | Deploy stack |
| `cdk destroy` | Xóa stack |
| `cdk bootstrap` | Tạo CDK toolkit stack (chạy 1 lần per account/region) |
| `cdk ls` | List stacks trong app |
| `cdk watch` | Auto-deploy khi code thay đổi (dev mode) |

### Workflow thường dùng

```bash
# 1. Bootstrap (chỉ chạy 1 lần per account/region)
cdk bootstrap aws://123456789012/us-east-1

# 2. Develop
code lib/my-stack.ts        # Viết code

# 3. Preview changes
cdk diff                    # Xem changes

# 4. Deploy
cdk deploy                  # Deploy to AWS

# 5. Cleanup
cdk destroy                 # Xóa stack
```

---

## 🌐 Cross-Stack References

```typescript
// network-stack.ts
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;  // Export để stack khác dùng
  
  constructor(scope: cdk.App, id: string) {
    super(scope, id);
    this.vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2 });
  }
}

// compute-stack.ts
export class ComputeStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: { vpc: ec2.Vpc }) {
    super(scope, id);
    
    // Dùng VPC từ NetworkStack
    new ec2.Instance(this, 'Instance', {
      vpc: props.vpc,  // Reference VPC từ stack khác
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
    });
  }
}

// bin/app.ts
const app = new cdk.App();
const networkStack = new NetworkStack(app, 'NetworkStack');
new ComputeStack(app, 'ComputeStack', { vpc: networkStack.vpc });
```

---

## 🧪 Testing CDK

```typescript
// test/my-stack.test.ts
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyStack } from '../lib/my-stack';

test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const stack = new MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  // Assert bucket exists
  template.hasResourceProperties('AWS::S3::Bucket', {
    VersioningConfiguration: { Status: 'Enabled' },
  });
});

test('Lambda Has Correct Runtime', () => {
  // ...
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs18.x',
  });
});
```

---

## 📊 CDK vs CloudFormation vs Terraform

| Feature | CloudFormation | Terraform | CDK |
|---------|---------------|-----------|-----|
| **Language** | YAML/JSON | HCL | TypeScript, Python, Java... |
| **IDE Support** | Limited | Plugin | Full (autocomplete, types) |
| **Abstraction** | Low | Low | High (L2, L3 constructs) |
| **Testing** | Hard | Hard | Easy (Jest, pytest) |
| **Learning Curve** | Medium | Medium | Low (nếu biết code) |
| **Multi-cloud** | ❌ AWS only | ✅ Yes | ❌ AWS only (có CDK for Terraform) |
| **Loops/Conditions** | !If, !ForEach (limited) | for_each, count | Native loops, if/else |
| **Output** | Direct | Direct | → CloudFormation templates |

### Khi nào chọn CDK?

```
✅ Dùng CDK nếu:
├── Team quen với TypeScript/Python
├── Cần logic phức tạp (loops, conditions, functions)
├── Muốn unit testing infrastructure
├── Cần high-level abstractions (ít code hơn)
└── Chỉ dùng AWS

❌ Không dùng CDK nếu:
├── Multi-cloud (AWS + GCP + Azure) → dùng Terraform
├── Team chỉ quen YAML → dùng CloudFormation hoặc SAM
├── Cần simple infrastructure → CloudFormation đủ rồi
└── Không muốn thêm layer abstraction
```

---

## 💡 Best Practices

### 1. Tổ chức code theo feature

```
lib/
├── network/
│   └── vpc-stack.ts
├── compute/
│   ├── lambda-stack.ts
│   └── ecs-stack.ts
├── storage/
│   └── s3-stack.ts
└── constructs/           # Custom constructs tái sử dụng
    └── secure-bucket.ts
```

### 2. Dùng Environment Variables

```typescript
const app = new cdk.App();

new MyStack(app, 'MyStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

### 3. Tạo Custom Constructs

```typescript
// constructs/secure-bucket.ts
export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket;
  
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    this.bucket = new s3.Bucket(this, 'Bucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}

// Sử dụng:
new SecureBucket(this, 'DataBucket');
```

### 4. Context Values

```json
// cdk.json
{
  "context": {
    "dev": {
      "vpcCidr": "10.0.0.0/16",
      "instanceType": "t3.micro"
    },
    "prod": {
      "vpcCidr": "10.1.0.0/16",
      "instanceType": "m5.large"
    }
  }
}
```

```typescript
const env = this.node.tryGetContext('env') || 'dev';
const config = this.node.tryGetContext(env);

new ec2.Instance(this, 'Instance', {
  instanceType: new ec2.InstanceType(config.instanceType),
  // ...
});
```

---

## 🎯 Tổng kết

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS CDK SUMMARY                              │
│                                                                       │
│   ✅ Viết Infrastructure bằng TypeScript/Python                     │
│   ✅ Full IDE support (autocomplete, type checking)                 │
│   ✅ High-level abstractions (ít code hơn CloudFormation)           │
│   ✅ grant* methods tự động tạo IAM policies                        │
│   ✅ Unit testing với Jest/pytest                                    │
│   ✅ Generates CloudFormation templates                              │
│                                                                       │
│   📚 Learning Path:                                                  │
│   1. Cài đặt CDK CLI                                                 │
│   2. cdk init → tạo project                                          │
│   3. Viết Stack với L2 constructs                                    │
│   4. cdk synth → xem generated template                              │
│   5. cdk deploy → deploy to AWS                                      │
│   6. Học custom constructs để tái sử dụng                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Tài liệu tham khảo

- [CDK Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
- [CDK Patterns](https://cdkpatterns.com/)
- [CDK Workshop](https://cdkworkshop.com/)
