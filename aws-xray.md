# AWS X-Ray


## Mục lục

- [Tổng Quan](#tổng-quan)
- [Tại Sao Cần X-Ray?](#tại-sao-cần-x-ray)
- [️ X-Ray Core Concepts](#x-ray-core-concepts)
- [Service Map](#service-map)
- [Tích Hợp X-Ray Với AWS Services](#tích-hợp-x-ray-với-aws-services)
- [X-Ray SDK Integration](#x-ray-sdk-integration)
- [X-Ray Daemon](#x-ray-daemon)
- [Trace Analysis & Filtering](#trace-analysis-filtering)
- [X-Ray Analytics](#x-ray-analytics)
- [X-Ray vs CloudWatch ServiceLens](#x-ray-vs-cloudwatch-servicelens)
- [X-Ray vs OpenTelemetry (OTel)](#x-ray-vs-opentelemetry-otel)
- [Pricing](#pricing)
- [️ IAM Permissions](#iam-permissions)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Tổng Kết](#tổng-kết)
- [Tài Liệu Tham Khảo](#tài-liệu-tham-khảo)

---

## 🔍 Tổng Quan

**AWS X-Ray** là dịch vụ **distributed tracing** giúp bạn **analyze và debug** ứng dụng phân tán (distributed applications). X-Ray cung cấp **end-to-end view** của requests khi chúng đi qua nhiều services trong hệ thống của bạn.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AWS X-RAY OVERVIEW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User Request                                                               │
│       │                                                                      │
│       ▼                                                                      │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│   │   API   │───►│ Lambda  │───►│   SQS   │───►│ Lambda  │                 │
│   │ Gateway │    │  Fn A   │    │  Queue  │    │  Fn B   │                 │
│   └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘                 │
│        │              │              │              │                       │
│        │    X-Ray     │    X-Ray     │    X-Ray     │                       │
│        │   Segment    │   Segment    │   Segment    │   Segment             │
│        └──────────────┴──────────────┴──────────────┘                       │
│                              │                                               │
│                              ▼                                               │
│                    ┌──────────────────┐                                     │
│                    │    AWS X-Ray     │                                     │
│                    │  ┌────────────┐  │                                     │
│                    │  │  Service   │  │                                     │
│                    │  │    Map     │  │                                     │
│                    │  └────────────┘  │                                     │
│                    │  ┌────────────┐  │                                     │
│                    │  │  Traces    │  │                                     │
│                    │  └────────────┘  │                                     │
│                    │  ┌────────────┐  │                                     │
│                    │  │ Analytics  │  │                                     │
│                    │  └────────────┘  │                                     │
│                    └──────────────────┘                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tại Sao Cần X-Ray?

### Vấn Đề Với Distributed Systems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHALLENGES IN MICROSERVICES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ❌ TRƯỚC KHI CÓ X-RAY:                                                     │
│                                                                              │
│     User: "Trang checkout load chậm quá!"                                   │
│                                                                              │
│     DevOps: "Request đi qua 20 services... chậm ở đâu???"                   │
│                                                                              │
│     ┌─────┐    ┌─────┐    ┌─────┐           ┌─────┐                        │
│     │ ??? │───►│ ??? │───►│ ??? │───► ??? ──►│ ??? │                        │
│     └─────┘    └─────┘    └─────┘           └─────┘                        │
│        │          │          │                 │                            │
│        ▼          ▼          ▼                 ▼                            │
│     Logs       Logs       Logs              Logs                            │
│     (Riêng    (Riêng     (Riêng            (Riêng                          │
│      lẻ)       lẻ)        lẻ)               lẻ)                            │
│                                                                              │
│  ✅ SAU KHI CÓ X-RAY:                                                       │
│                                                                              │
│     ┌─────┐    ┌─────┐    ┌─────┐           ┌─────┐                        │
│     │ API │───►│Order│───►│ SQS │───► ───►  │ DB  │                        │
│     │ GW  │50ms│ Svc │80ms│     │10ms       │     │500ms ← BOTTLENECK!     │
│     └─────┘    └─────┘    └─────┘           └─────┘                        │
│                                                                              │
│     X-Ray cho thấy: Database query mất 500ms = Root Cause!                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### X-Ray Giúp Gì?

| Vấn Đề | X-Ray Solution |
|--------|----------------|
| **Không biết request đi qua những service nào** | Service Map visualization |
| **Không biết service nào chậm** | Latency breakdown per segment |
| **Không biết error xảy ra ở đâu** | Error tracking với stack traces |
| **Khó debug distributed transactions** | End-to-end trace correlation |
| **Performance bottleneck ẩn** | Trace analytics & filtering |

---

## 🏗️ X-Ray Core Concepts

### 1. Trace, Segment, Subsegment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       X-RAY DATA MODEL                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   TRACE (End-to-end request journey, unique ID)                             │
│   ════════════════════════════════════════════════════════════════════════  │
│   │                                                                          │
│   │  SEGMENT 1: API Gateway                                                  │
│   │  ┌─────────────────────────────────────────────────┐                    │
│   │  │ id: abc123                                       │                    │
│   │  │ name: api-gateway                                │                    │
│   │  │ start_time: 1234567890.123                       │                    │
│   │  │ end_time: 1234567890.145                         │                    │
│   │  │ http: { request: {...}, response: {...} }        │                    │
│   │  └─────────────────────────────────────────────────┘                    │
│   │                     │                                                    │
│   │  SEGMENT 2: Lambda Function (Order Service)                              │
│   │  ┌─────────────────────────────────────────────────┐                    │
│   │  │ id: def456                                       │                    │
│   │  │ name: order-service                              │                    │
│   │  │                                                  │                    │
│   │  │   SUBSEGMENT: DynamoDB Call                      │                    │
│   │  │   ┌───────────────────────────────────┐          │                    │
│   │  │   │ name: DynamoDB                     │          │                    │
│   │  │   │ namespace: aws                     │          │                    │
│   │  │   │ aws: { operation: "PutItem" }      │          │                    │
│   │  │   └───────────────────────────────────┘          │                    │
│   │  │                                                  │                    │
│   │  │   SUBSEGMENT: External HTTP Call                 │                    │
│   │  │   ┌───────────────────────────────────┐          │                    │
│   │  │   │ name: payment-api.com              │          │                    │
│   │  │   │ namespace: remote                  │          │                    │
│   │  │   │ http: { url: "..." }               │          │                    │
│   │  │   └───────────────────────────────────┘          │                    │
│   │  └─────────────────────────────────────────────────┘                    │
│   │                                                                          │
│   ════════════════════════════════════════════════════════════════════════  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Concept | Định Nghĩa | Ví Dụ |
|---------|------------|-------|
| **Trace** | Toàn bộ journey của một request qua hệ thống | User checkout → Order → Payment → Email |
| **Trace ID** | Unique identifier cho trace (format: `1-{timestamp}-{96bit random}`) | `1-5f84c7a1-0e3d8f2a1b2c3d4e5f6a7b8c` |
| **Segment** | Một service/resource xử lý request | Lambda function, EC2 instance |
| **Subsegment** | Chi tiết operations trong segment | Database query, HTTP call |
| **Annotations** | Key-value pairs để index và filter traces | `user_id=12345`, `order_type=express` |
| **Metadata** | Additional data không được index | Request body, response details |

### 2. Sampling

> [!IMPORTANT]
> **Sampling** là cơ chế quan trọng để kiểm soát chi phí. Không phải tất cả requests đều được trace!

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          X-RAY SAMPLING RULES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Incoming Requests: 1000 requests/second                                    │
│           │                                                                  │
│           ▼                                                                  │
│   ┌─────────────────────────────────────────────────────┐                   │
│   │              SAMPLING RULE ENGINE                    │                   │
│   │                                                      │                   │
│   │  Default Rule:                                       │                   │
│   │  ┌────────────────────────────────────────────────┐ │                   │
│   │  │ Reservoir: 1 request/second (first request)    │ │                   │
│   │  │ Fixed Rate: 5% of remaining requests           │ │                   │
│   │  └────────────────────────────────────────────────┘ │                   │
│   │                                                      │                   │
│   │  Custom Rule: /api/orders/*                          │                   │
│   │  ┌────────────────────────────────────────────────┐ │                   │
│   │  │ Reservoir: 10 requests/second                   │ │                   │
│   │  │ Fixed Rate: 20% (important endpoint)           │ │                   │
│   │  └────────────────────────────────────────────────┘ │                   │
│   │                                                      │                   │
│   └─────────────────────────────────────────────────────┘                   │
│           │                                                                  │
│           ▼                                                                  │
│   Traced Requests: ~60 requests/second (cost optimized)                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sampling Rule Configuration:**

```json
{
  "SamplingRule": {
    "RuleName": "OrderServiceRule",
    "Priority": 100,
    "FixedRate": 0.10,
    "ReservoirSize": 5,
    "ServiceName": "order-service",
    "ServiceType": "*",
    "Host": "*",
    "HTTPMethod": "POST",
    "URLPath": "/api/orders/*",
    "Version": 1
  }
}
```

| Parameter | Mô Tả |
|-----------|-------|
| **ReservoirSize** | Số requests/giây được trace đầu tiên (guaranteed) |
| **FixedRate** | % requests còn lại được trace (0.0 - 1.0) |
| **Priority** | Thứ tự áp dụng rules (số nhỏ = priority cao) |

---

## 📊 Service Map

### Visual Application Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          X-RAY SERVICE MAP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌──────────────┐                               │
│                              │   Client     │                               │
│                              │    👤        │                               │
│                              └──────┬───────┘                               │
│                                     │                                        │
│                                     ▼                                        │
│                              ┌──────────────┐                               │
│                              │ API Gateway  │                               │
│                              │   🌐         │                               │
│                              │ Latency: 5ms │                               │
│                              └──────┬───────┘                               │
│                                     │                                        │
│               ┌─────────────────────┼─────────────────────┐                 │
│               │                     │                     │                 │
│               ▼                     ▼                     ▼                 │
│        ┌──────────────┐     ┌──────────────┐     ┌──────────────┐          │
│        │ User Service │     │Order Service │     │Product Svc   │          │
│        │  λ           │     │  λ           │     │  λ           │          │
│        │ ✅ Healthy   │     │ ⚠️ 2% errors │     │ ✅ Healthy   │          │
│        │ Latency: 45ms│     │ Latency: 120ms│    │ Latency: 30ms│          │
│        └──────┬───────┘     └──────┬───────┘     └──────┬───────┘          │
│               │                     │                     │                 │
│               ▼                     ▼                     ▼                 │
│        ┌──────────────┐     ┌──────────────┐     ┌──────────────┐          │
│        │  DynamoDB    │     │    SQS       │     │  DynamoDB    │          │
│        │  (Users)     │     │   Queue      │     │  (Products)  │          │
│        │ 🗄️           │     │   📫        │     │ 🗄️           │          │
│        │ Latency: 15ms│     │ Latency: 8ms │     │ Latency: 12ms│          │
│        └──────────────┘     └──────┬───────┘     └──────────────┘          │
│                                     │                                        │
│                                     ▼                                        │
│                              ┌──────────────┐                               │
│                              │Payment Lambda│                               │
│                              │  λ           │                               │
│                              │ ❌ 5% errors │                               │
│                              │ Latency: 500ms│ ← BOTTLENECK!                │
│                              └──────┬───────┘                               │
│                                     │                                        │
│                                     ▼                                        │
│                              ┌──────────────┐                               │
│                              │ Stripe API   │                               │
│                              │ 💳 (Remote)  │                               │
│                              └──────────────┘                               │
│                                                                              │
│   Legend:                                                                    │
│   ✅ = Healthy (< 1% error)  ⚠️ = Degraded (1-5% error)  ❌ = Unhealthy    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Map Insights

| Insight | Mô Tả |
|---------|-------|
| **Response Time Distribution** | Histogram của latency cho mỗi service |
| **Error Rate** | % requests failed |
| **Throughput** | Requests per second |
| **Edge Connections** | Dependency giữa services |
| **Node Health** | Color-coded health status |

---

## 🧩 Tích Hợp X-Ray Với AWS Services

### Native Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    X-RAY NATIVE AWS INTEGRATIONS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  AUTOMATIC INTEGRATION (Just Enable)                                   ║ │
│   ╠═══════════════════════════════════════════════════════════════════════╣ │
│   ║                                                                        ║ │
│   ║  • AWS Lambda          → Enable "Active Tracing" in config             ║ │
│   ║  • API Gateway         → Enable X-Ray in Stage settings                ║ │
│   ║  • Elastic Beanstalk   → Enable in configuration                       ║ │
│   ║  • App Runner          → Enable tracing option                         ║ │
│   ║  • SNS/SQS             → Auto-instrumented with SDK                    ║ │
│   ║                                                                        ║ │
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  SDK INSTRUMENTATION (Cần code)                                        ║ │
│   ╠═══════════════════════════════════════════════════════════════════════╣ │
│   ║                                                                        ║ │
│   ║  • EC2 Instances       → X-Ray Daemon + SDK                            ║ │
│   ║  • ECS/EKS             → X-Ray Daemon sidecar + SDK                    ║ │
│   ║  • On-Premises         → X-Ray Daemon + SDK                            ║ │
│   ║                                                                        ║ │
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│   ╔═══════════════════════════════════════════════════════════════════════╗ │
│   ║  AUTO-CAPTURED AWS CALLS (khi dùng SDK)                                ║ │
│   ╠═══════════════════════════════════════════════════════════════════════╣ │
│   ║                                                                        ║ │
│   ║  DynamoDB │ S3 │ SQS │ SNS │ Lambda │ Step Functions │                 ║ │
│   ║  RDS │ Aurora │ ElastiCache │ Secrets Manager │ SSM                    ║ │
│   ║                                                                        ║ │
│   ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Enable X-Ray cho Lambda

**Console:**
```
Lambda Function → Configuration → Monitoring and operations tools → 
Active tracing: ✅ Enable
```

**CloudFormation/SAM:**
```yaml
Resources:
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: my-order-function
      Runtime: nodejs18.x
      Handler: index.handler
      TracingConfig:
        Mode: Active  # Enable X-Ray
      # ...
```

**CDK (TypeScript):**
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Tracing } from 'aws-cdk-lib/aws-lambda';

const myFunction = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  tracing: Tracing.ACTIVE,  // Enable X-Ray
});
```

### Enable X-Ray cho API Gateway

```yaml
Resources:
  MyApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: my-api
      
  MyStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: prod
      RestApiId: !Ref MyApi
      TracingEnabled: true  # Enable X-Ray
```

---

## 💻 X-Ray SDK Integration

### 1. Node.js/TypeScript

```typescript
// ==========================================
// AWS X-Ray Integration for Node.js
// ==========================================

// Install: npm install aws-xray-sdk

const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));  // Wrap AWS SDK
const https = AWSXRay.captureHTTPs(require('https')); // Wrap HTTP

// DynamoDB calls will now be auto-traced
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Express Integration
const express = require('express');
const app = express();

// Open segment at the start of request
app.use(AWSXRay.express.openSegment('MyApp'));

app.get('/api/orders/:id', async (req, res) => {
  const segment = AWSXRay.getSegment();
  
  // Add annotation (indexed, searchable)
  segment.addAnnotation('orderId', req.params.id);
  segment.addAnnotation('userId', req.user.id);
  
  // Add metadata (not indexed)
  segment.addMetadata('requestHeaders', req.headers);
  
  // Create custom subsegment
  const subsegment = segment.addNewSubsegment('ProcessOrder');
  try {
    const order = await dynamoDB.get({
      TableName: 'Orders',
      Key: { id: req.params.id }
    }).promise();
    
    subsegment.close();
    res.json(order.Item);
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    res.status(500).json({ error: error.message });
  }
});

// Close segment at end of request
app.use(AWSXRay.express.closeSegment());

app.listen(3000);
```

### 2. Python

```python
# ==========================================
# AWS X-Ray Integration for Python
# ==========================================

# Install: pip install aws-xray-sdk

from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch all supported libraries (boto3, requests, etc.)
patch_all()

# Flask Integration
from flask import Flask
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

app = Flask(__name__)
xray_recorder.configure(service='OrderService')
XRayMiddleware(app, xray_recorder)

@app.route('/api/orders/<order_id>')
def get_order(order_id):
    # Current segment is automatically available
    segment = xray_recorder.current_segment()
    
    # Add annotation (indexed)
    segment.put_annotation('order_id', order_id)
    
    # Add metadata (not indexed)
    segment.put_metadata('request_info', {
        'path': '/api/orders',
        'method': 'GET'
    })
    
    # Create custom subsegment
    with xray_recorder.in_subsegment('ProcessOrder') as subsegment:
        subsegment.put_annotation('step', 'fetch_order')
        order = fetch_order_from_db(order_id)
    
    return jsonify(order)


# Lambda Integration
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

def lambda_handler(event, context):
    # Lambda segment is auto-created
    subsegment = xray_recorder.begin_subsegment('ProcessPayment')
    try:
        # Business logic
        result = process_payment(event['payment_id'])
        subsegment.put_annotation('payment_status', 'success')
        return {'statusCode': 200, 'body': result}
    except Exception as e:
        subsegment.add_exception(e)
        raise
    finally:
        xray_recorder.end_subsegment()
```

### 3. Java/Spring Boot

```java
// ==========================================
// AWS X-Ray Integration for Spring Boot
// ==========================================

// pom.xml dependencies
/*
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-xray-recorder-sdk-core</artifactId>
</dependency>
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-xray-recorder-sdk-aws-sdk-v2</artifactId>
</dependency>
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-xray-recorder-sdk-spring</artifactId>
</dependency>
*/

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import com.amazonaws.xray.spring.aop.XRayEnabled;

// Enable X-Ray for all methods in @Service classes
@Configuration
@EnableAspectJAutoProxy
public class XRayConfig {
    
    @Bean
    public Filter tracingFilter() {
        return new AWSXRayServletFilter("OrderService");
    }
}

@Service
@XRayEnabled
public class OrderService {
    
    private final DynamoDbClient dynamoDb;
    
    public Order getOrder(String orderId) {
        // Add annotation to current segment
        AWSXRay.getCurrentSegment().putAnnotation("orderId", orderId);
        
        // Create custom subsegment
        Subsegment subsegment = AWSXRay.beginSubsegment("FetchFromDB");
        try {
            Order order = dynamoDb.getItem(/* ... */);
            subsegment.putMetadata("order", order);
            return order;
        } catch (Exception e) {
            subsegment.addException(e);
            throw e;
        } finally {
            AWSXRay.endSubsegment();
        }
    }
}
```

---

## 🔧 X-Ray Daemon

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          X-RAY DAEMON ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   EC2 Instance / Container                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                                                                       │  │
│   │   ┌─────────────────┐         ┌─────────────────┐                    │  │
│   │   │  Your App       │         │  X-Ray Daemon   │                    │  │
│   │   │  (with X-Ray    │  UDP    │                 │  HTTPS             │  │
│   │   │   SDK)          │────────►│  Port 2000      │────────────┐       │  │
│   │   │                 │         │  (Listens for   │            │       │  │
│   │   │                 │         │   segments)     │            │       │  │
│   │   └─────────────────┘         └─────────────────┘            │       │  │
│   │                                                               │       │  │
│   └───────────────────────────────────────────────────────────────│───────┘  │
│                                                                   │          │
│                                                                   ▼          │
│                                                        ┌──────────────────┐  │
│                                                        │   AWS X-Ray      │  │
│                                                        │   Service API    │  │
│                                                        │   (BatchWrite)   │  │
│                                                        └──────────────────┘  │
│                                                                              │
│   Why Daemon?                                                                │
│   • Buffers segments before sending (reduces API calls)                      │
│   • Handles IAM credentials                                                  │
│   • Batches multiple segments efficiently                                    │
│   • Runs in background, doesn't block your app                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Running X-Ray Daemon

**EC2:**
```bash
# Download and install
curl https://s3.us-east-2.amazonaws.com/aws-xray-assets.us-east-2/xray-daemon/aws-xray-daemon-linux-3.x.zip -o xray.zip
unzip xray.zip
sudo ./xray -o -n us-east-1  # Run in foreground

# Or as systemd service
sudo cp xray /usr/local/bin/
sudo cp cfg.yaml /etc/amazon/xray/cfg.yaml
sudo systemctl start xray
```

**ECS (Sidecar Pattern):**
```json
{
  "containerDefinitions": [
    {
      "name": "app",
      "image": "my-app:latest",
      "environment": [
        {
          "name": "AWS_XRAY_DAEMON_ADDRESS",
          "value": "xray-daemon:2000"
        }
      ]
    },
    {
      "name": "xray-daemon",
      "image": "amazon/aws-xray-daemon",
      "portMappings": [
        {
          "containerPort": 2000,
          "protocol": "udp"
        }
      ]
    }
  ]
}
```

**Kubernetes/EKS:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: my-app:latest
    env:
    - name: AWS_XRAY_DAEMON_ADDRESS
      value: "127.0.0.1:2000"
  - name: xray-daemon
    image: amazon/aws-xray-daemon
    ports:
    - containerPort: 2000
      protocol: UDP
```

> [!NOTE]
> **Lambda không cần Daemon!** Lambda has built-in X-Ray integration. Just enable Active Tracing.

---

## 🔍 Trace Analysis & Filtering

### Trace Query Syntax

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          X-RAY FILTER EXPRESSIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   // Find all 5xx errors                                                     │
│   responsetime > 5 AND http.status >= 500                                    │
│                                                                              │
│   // Find slow requests for specific user                                    │
│   annotation.userId = "user-12345" AND responsetime > 3                      │
│                                                                              │
│   // Find errors in specific service                                         │
│   service("order-service") { error = true }                                  │
│                                                                              │
│   // Complex query                                                           │
│   service("payment-service") {                                               │
│     annotation.payment_method = "credit_card" AND                            │
│     responsetime > 2 AND                                                     │
│     fault = true                                                             │
│   }                                                                          │
│                                                                              │
│   // Find by HTTP method and path                                            │
│   http.method = "POST" AND http.url CONTAINS "/api/orders"                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Common Filter Patterns

| Use Case | Filter Expression |
|----------|-------------------|
| **Slow requests** | `responsetime > 3` |
| **5xx errors** | `http.status >= 500` |
| **Specific user** | `annotation.userId = "user-123"` |
| **Errors only** | `error = true` |
| **Faults (5xx)** | `fault = true` |
| **Throttled** | `throttle = true` |
| **Specific service** | `service("my-service") { fault = true }` |
| **Partial match** | `annotation.orderId BEGINSWITH "ORD-"` |

---

## 📈 X-Ray Analytics

### Insights Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          X-RAY INSIGHTS CONSOLE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  📊 Response Time Distribution                                       │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │ █                                                              │  │   │
│   │  │ ██                                                             │  │   │
│   │  │ ████                                                           │  │   │
│   │  │ ██████                                                         │  │   │
│   │  │ █████████                                                      │  │   │
│   │  │ ████████████                                                   │  │   │
│   │  │ ███████████████                                               │  │   │
│   │  │ │    │    │    │    │    │    │    │    │    │                │  │   │
│   │  │ 0   50  100  200  500  1s   2s   5s  10s  >10s (ms)           │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   │  p50: 120ms  |  p90: 450ms  |  p99: 2.1s                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ❌ Error Breakdown                                                  │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │                                                              │    │   │
│   │  │    ValidationError     ████████████████████  45%             │    │   │
│   │  │    TimeoutError        ███████████  25%                      │    │   │
│   │  │    ConnectionError     ████████  18%                         │    │   │
│   │  │    Other               █████  12%                            │    │   │
│   │  │                                                              │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🔥 Top Root Causes (by Impact)                                      │   │
│   │  1. payment-service → Stripe API timeout (35% of errors)            │   │
│   │  2. order-service → DynamoDB throttling (28% of errors)             │   │
│   │  3. user-service → Invalid token (22% of errors)                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### X-Ray Insights (Automatic Issue Detection)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          X-RAY INSIGHTS ALERT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🚨 INCIDENT DETECTED: Elevated Error Rate                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  Service:        payment-service                                        │ │
│  │  Start Time:     2024-01-15 14:23:00 UTC                               │ │
│  │  Duration:       45 minutes (ongoing)                                   │ │
│  │  Impact:         ~2,500 failed requests                                 │ │
│  │                                                                         │ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │                                                                         │ │
│  │  Root Cause Analysis:                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────────┐    │ │
│  │  │                                                                 │    │ │
│  │  │  payment-service                                                │    │ │
│  │  │       ↓                                                         │    │ │
│  │  │  Stripe API  ←── Connection Timeout (85% of errors)            │    │ │
│  │  │       ↓                                                         │    │ │
│  │  │  [External: api.stripe.com] ← Possible Third-Party Issue       │    │ │
│  │  │                                                                 │    │ │
│  │  └────────────────────────────────────────────────────────────────┘    │ │
│  │                                                                         │ │
│  │  Recommended Actions:                                                   │ │
│  │  • Check Stripe status page: status.stripe.com                         │ │
│  │  • Increase connection timeout if appropriate                          │ │
│  │  • Consider implementing circuit breaker pattern                       │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 X-Ray vs CloudWatch ServiceLens

### Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    X-RAY + CLOUDWATCH SERVICELENS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌────────────────────────────────────┐                   │
│                    │       CloudWatch ServiceLens       │                   │
│                    │       (Unified Observability)      │                   │
│                    └─────────────────┬──────────────────┘                   │
│                                      │                                       │
│               ┌──────────────────────┼──────────────────────┐               │
│               │                      │                      │               │
│               ▼                      ▼                      ▼               │
│      ┌──────────────┐       ┌──────────────┐       ┌──────────────┐        │
│      │  CloudWatch  │       │   AWS X-Ray  │       │  CloudWatch  │        │
│      │   Metrics    │       │   Traces     │       │    Logs      │        │
│      │              │       │              │       │              │        │
│      │  • CPU       │       │  • Latency   │       │  • Errors    │        │
│      │  • Memory    │       │  • Errors    │       │  • Debug     │        │
│      │  • Network   │       │  • Map       │       │  • Events    │        │
│      └──────────────┘       └──────────────┘       └──────────────┘        │
│               │                      │                      │               │
│               └──────────────────────┼──────────────────────┘               │
│                                      │                                       │
│                                      ▼                                       │
│                         ┌────────────────────────┐                          │
│                         │  Correlated View       │                          │
│                         │  • Service Map         │                          │
│                         │  • Trace → Logs        │                          │
│                         │  • Metrics → Traces    │                          │
│                         └────────────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Use Cases

| Tool | Best For |
|------|----------|
| **X-Ray alone** | Distributed tracing, request flow debugging |
| **CloudWatch alone** | Metrics, logs, alarms |
| **ServiceLens** | Correlated observability - link traces với logs và metrics |

---

## 🆚 X-Ray vs OpenTelemetry (OTel)

### Tổng Quan So Sánh

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    X-RAY vs OPENTELEMETRY COMPARISON                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AWS X-RAY                           │   OPENTELEMETRY (OTel)              │
│   ─────────────────────────────────── │ ─────────────────────────────────── │
│                                       │                                      │
│   • AWS proprietary solution          │   • Open-source, vendor-neutral     │
│   • Tightly integrated with AWS       │   • Works with ANY backend          │
│   • Simpler setup on AWS              │   • More flexible, more complex     │
│   • Limited to AWS ecosystem          │   • Multi-cloud, on-premises        │
│                                       │                                      │
│   ┌─────────────┐                     │   ┌─────────────┐                   │
│   │   X-Ray     │                     │   │    OTel     │                   │
│   │    SDK      │─────► X-Ray         │   │    SDK      │─────► ANY Backend │
│   └─────────────┘      Console        │   └─────────────┘                   │
│                                       │          │                           │
│                                       │          ├──► Jaeger                │
│                                       │          ├──► Zipkin                │
│                                       │          ├──► X-Ray (via ADOT)      │
│                                       │          ├──► Datadog               │
│                                       │          └──► Grafana Tempo         │
│                                       │                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Feature Comparison

| Feature | AWS X-Ray | OpenTelemetry |
|---------|-----------|---------------|
| **Type** | Proprietary AWS service | Open-source CNCF project |
| **Vendor Lock-in** | ✅ Yes (AWS only) | ❌ No (vendor-neutral) |
| **Multi-Cloud** | ❌ Limited | ✅ Full support |
| **Setup Complexity** | 🟢 Easy (on AWS) | 🟡 Medium-High |
| **AWS Integration** | 🟢 Native, seamless | 🟡 Via ADOT (extra layer) |
| **Signals** | Traces only | Traces, Metrics, Logs (3 pillars) |
| **Language SDKs** | Java, Node, Python, Go, .NET, Ruby | 11+ languages |
| **Community** | AWS maintained | Large open-source community |
| **Customization** | Limited | Highly extensible |
| **Sampling** | Built-in rules | Configurable processors |
| **Backend Flexibility** | X-Ray only | Any compatible backend |

### Concept Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TERMINOLOGY MAPPING                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   X-RAY Concept              ═══════════►    OpenTelemetry Equivalent        │
│   ───────────────────────────────────────────────────────────────────────── │
│                                                                              │
│   Trace                      ═══════════►    Trace                           │
│   Segment                    ═══════════►    Span                            │
│   Subsegment                 ═══════════►    Child Span                      │
│   Annotation                 ═══════════►    Span Attribute (indexed)        │
│   Metadata                   ═══════════►    Span Attribute (non-indexed)    │
│   X-Ray Daemon               ═══════════►    OTel Collector                  │
│   Sampling Rules             ═══════════►    Sampler / Processors            │
│   Service Map                ═══════════►    Trace visualization (backend)   │
│                                                                              │
│   ───────────────────────────────────────────────────────────────────────── │
│                                                                              │
│   X-RAY ONLY Concepts:                OTel EXCLUSIVE Concepts:               │
│   • X-Ray Insights                    • Baggage (cross-service context)      │
│   • ServiceLens integration           • Metrics + Logs (unified)             │
│   • Groups                            • Exporters (multiple backends)        │
│                                       • Processors (transform data)          │
│                                       • Resource detection                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         X-RAY ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────────┐   │
│   │  Your App    │  UDP    │  X-Ray       │  HTTPS  │  AWS X-Ray       │   │
│   │  + X-Ray SDK │────────►│  Daemon      │────────►│  Service         │   │
│   └──────────────┘         └──────────────┘         └────────┬─────────┘   │
│                                                               │             │
│                                                               ▼             │
│                                                      ┌──────────────────┐   │
│                                                      │  X-Ray Console   │   │
│                                                      │  (Only option)   │   │
│                                                      └──────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      OPENTELEMETRY ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────────────────────────────────────┐ │
│   │  Your App    │  OTLP   │              OTel Collector                  │ │
│   │  + OTel SDK  │────────►│  ┌─────────┐ ┌──────────┐ ┌───────────────┐ │ │
│   └──────────────┘         │  │Receivers│►│Processors│►│   Exporters   │ │ │
│                            │  └─────────┘ └──────────┘ └───────┬───────┘ │ │
│                            └───────────────────────────────────│─────────┘ │
│                                                                 │           │
│                           ┌─────────────────────────────────────┼───────┐   │
│                           │                 │                   │       │   │
│                           ▼                 ▼                   ▼       ▼   │
│                    ┌──────────┐      ┌──────────┐      ┌──────────┐ ┌─────┐│
│                    │  Jaeger  │      │  Zipkin  │      │  X-Ray   │ │Tempo││
│                    └──────────┘      └──────────┘      └──────────┘ └─────┘│
│                                                                              │
│   💡 OTel can send to MULTIPLE backends simultaneously!                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AWS Distro for OpenTelemetry (ADOT)

> [!IMPORTANT]
> **ADOT** = AWS's supported distribution of OpenTelemetry. Đây là cầu nối giữa OTel và X-Ray!

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS DISTRO FOR OPENTELEMETRY (ADOT)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ADOT = OpenTelemetry + AWS-specific enhancements                          │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                                                                       │  │
│   │  ┌──────────────┐                      ┌────────────────────────────┐│  │
│   │  │  Your App    │                      │      ADOT Collector        ││  │
│   │  │  + OTel SDK  │────OTLP─────────────►│                            ││  │
│   │  │              │                      │  • AWS X-Ray Exporter      ││  │
│   │  └──────────────┘                      │  • CloudWatch Exporter     ││  │
│   │                                        │  • Prometheus Exporter     ││  │
│   │                                        │  • OTLP Exporter           ││  │
│   │                                        └─────────────┬──────────────┘│  │
│   │                                                      │               │  │
│   │                   ┌──────────────────────────────────┴───────────┐   │  │
│   │                   │              │              │                │   │  │
│   │                   ▼              ▼              ▼                ▼   │  │
│   │           ┌──────────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ │  │
│   │           │   X-Ray      │ │CloudWatch │ │Prometheus │ │  Any     │ │  │
│   │           │   Console    │ │  Metrics  │ │  /Grafana │ │  Backend │ │  │
│   │           └──────────────┘ └───────────┘ └───────────┘ └──────────┘ │  │
│   │                                                                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   Benefits of ADOT:                                                          │
│   ✅ AWS tested & supported                                                 │
│   ✅ Pre-configured for AWS services                                        │
│   ✅ Best of both worlds: OTel flexibility + AWS integration                │
│   ✅ Future-proof (OTel is the standard)                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Code Comparison

**X-Ray SDK (Node.js):**
```javascript
// X-Ray specific SDK
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Create custom segment
const segment = AWSXRay.getSegment();
const subsegment = segment.addNewSubsegment('MyOperation');
subsegment.addAnnotation('orderId', '12345');
subsegment.close();
```

**OpenTelemetry SDK (Node.js):**
```javascript
// Vendor-neutral OTel SDK
const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('order-service');

// Create span (equivalent to segment)
const span = tracer.startSpan('MyOperation');
span.setAttribute('orderId', '12345');  // Like annotation
span.end();
```

**Chuyển từ X-Ray SDK sang OTel với ADOT:**
```javascript
// 1. Install OTel packages
// npm install @opentelemetry/api @opentelemetry/sdk-trace-node
// npm install @opentelemetry/exporter-trace-otlp-grpc

// 2. Configure OTel to export to X-Ray via ADOT Collector
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { Resource } = require('@opentelemetry/resources');

const provider = new NodeTracerProvider({
  resource: new Resource({
    'service.name': 'order-service',
  }),
});

// Export to ADOT Collector (which sends to X-Ray)
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: 'http://localhost:4317', // ADOT Collector endpoint
    })
  )
);

provider.register();

// 3. Your code stays the same!
const span = tracer.startSpan('ProcessOrder');
span.setAttribute('orderId', orderId);
// ... business logic
span.end();
```

### Khi Nào Dùng Cái Nào?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DECISION MATRIX                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ✅ CHỌN X-RAY SDK khi:                                                    │
│   ──────────────────────                                                     │
│   • 100% AWS infrastructure                                                  │
│   • Cần setup nhanh, ít config                                              │
│   • Team mới làm quen với tracing                                            │
│   • Không có kế hoạch multi-cloud                                           │
│   • Muốn tận dụng X-Ray Insights, Groups                                    │
│                                                                              │
│   ✅ CHỌN OPENTELEMETRY khi:                                                │
│   ───────────────────────────                                                │
│   • Multi-cloud hoặc hybrid (AWS + GCP + Azure)                             │
│   • Muốn tránh vendor lock-in                                               │
│   • Cần gửi traces đến nhiều backends                                       │
│   • Đã invest vào Jaeger/Zipkin/Grafana                                     │
│   • Muốn unified observability (traces + metrics + logs)                    │
│   • Team đã familiar với OTel                                               │
│                                                                              │
│   ✅ CHỌN ADOT (AWS Distro for OTel) khi:                                   │
│   ─────────────────────────────────────────                                  │
│   • Chủ yếu AWS nhưng muốn flexibility                                      │
│   • Muốn migrate từ X-Ray SDK dần dần                                       │
│   • Cần AWS support cho OTel                                                │
│   • Future-proofing: OTel đang trở thành standard                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Migration Path: X-Ray → OpenTelemetry

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MIGRATION STRATEGY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Phase 1: Parallel Running                                                  │
│   ──────────────────────────                                                 │
│   ┌────────────┐                                                             │
│   │  Service A │──── X-Ray SDK ────► X-Ray                                  │
│   │  (Legacy)  │                                                             │
│   └────────────┘                                                             │
│                                                                              │
│   ┌────────────┐                    ┌──────────┐                            │
│   │  Service B │──── OTel SDK ─────►│   ADOT   │───► X-Ray (same console)  │
│   │  (New)     │                    │Collector │                            │
│   └────────────┘                    └──────────┘                            │
│                                                                              │
│   Phase 2: Gradual Migration                                                 │
│   ───────────────────────────                                                │
│   • Migrate service by service                                               │
│   • Both send to X-Ray, so no visibility loss                               │
│                                                                              │
│   Phase 3: Full OTel                                                         │
│   ────────────────────                                                       │
│   ┌────────────┐                    ┌──────────┐                            │
│   │ All        │──── OTel SDK ─────►│   ADOT   │───► X-Ray + Other backends│
│   │ Services   │                    │Collector │                            │
│   └────────────┘                    └──────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pros & Cons Summary

| Aspect | X-Ray | OpenTelemetry |
|--------|-------|---------------|
| **Pros** | • Zero config on AWS Lambda, API GW | • Vendor neutral, no lock-in |
| | • Deep AWS integration | • Unified signals (traces, metrics, logs) |
| | • X-Ray Insights AI | • Flexible backends |
| | • ServiceLens correlation | • Strong community |
| | • Simple sampling rules | • Future standard |
| **Cons** | • AWS only | • More complex setup |
| | • Traces only (no metrics) | • Need ADOT for AWS |
| | • Vendor lock-in | • More moving parts |
| | • Limited customization | • Steeper learning curve |

---

## 💰 Pricing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          X-RAY PRICING MODEL                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Traces Recorded                                                     │   │
│   │  ─────────────────                                                   │   │
│   │  First 100,000 traces/month: FREE                                    │   │
│   │  Beyond: $5.00 per 1 million traces                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Traces Retrieved & Scanned                                          │   │
│   │  ───────────────────────────                                         │   │
│   │  First 1,000,000 traces/month: FREE                                  │   │
│   │  Beyond: $0.50 per 1 million traces retrieved                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  X-Ray Insights                                                      │   │
│   │  ───────────────                                                     │   │
│   │  $0.0000002 per trace analyzed                                       │   │
│   │  (Automatic anomaly detection)                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   💡 Cost Optimization Tips:                                                │
│   • Use sampling effectively (reservoir + fixed rate)                       │
│   • Sample more in production, less in dev/staging                          │
│   • Use annotations wisely (they're indexed = cost)                         │
│   • Set appropriate trace retention                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ IAM Permissions

### Required Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "XRayWriteAccess",
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    },
    {
      "Sid": "XRayReadAccess",
      "Effect": "Allow",
      "Action": [
        "xray:GetSamplingRules",
        "xray:GetSamplingTargets",
        "xray:GetSamplingStatisticSummaries"
      ],
      "Resource": "*"
    }
  ]
}
```

### AWS Managed Policies

| Policy | Use Case |
|--------|----------|
| `AWSXRayDaemonWriteAccess` | For X-Ray Daemon (EC2, ECS) |
| `AWSXRayReadOnlyAccess` | For viewing traces in console |
| `AWSXRayFullAccess` | Full access for development |

---

## 📍 Best Practices

### 1. Naming Conventions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      X-RAY NAMING BEST PRACTICES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ✅ GOOD Segment Names:                                                    │
│   ─────────────────────                                                      │
│   • order-service                                                            │
│   • payment-processor                                                        │
│   • user-authentication                                                      │
│                                                                              │
│   ❌ BAD Segment Names:                                                     │
│   ────────────────────                                                       │
│   • MyService123                                                             │
│   • lambda_function                                                          │
│   • app                                                                      │
│                                                                              │
│   ✅ GOOD Annotations (indexed, searchable):                                │
│   ────────────────────────────────────────────                               │
│   • user_id: "user-123"                                                      │
│   • order_type: "express"                                                    │
│   • region: "us-east-1"                                                      │
│   • customer_tier: "premium"                                                 │
│                                                                              │
│   ✅ GOOD Metadata (not indexed):                                           │
│   ────────────────────────────────                                           │
│   • request_body: { ... }                                                    │
│   • response_payload: { ... }                                                │
│   • debug_info: { ... }                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Sampling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SAMPLING STRATEGY BY ENVIRONMENT                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DEVELOPMENT                                                                │
│   ──────────────                                                             │
│   ReservoirSize: 10                                                          │
│   FixedRate: 1.0 (100%)  ← Trace everything for debugging                   │
│                                                                              │
│   STAGING                                                                    │
│   ──────────                                                                 │
│   ReservoirSize: 5                                                           │
│   FixedRate: 0.5 (50%)   ← Good balance for testing                         │
│                                                                              │
│   PRODUCTION                                                                 │
│   ────────────                                                               │
│   ReservoirSize: 1                                                           │
│   FixedRate: 0.05 (5%)   ← Cost-effective, still statistically significant  │
│                                                                              │
│   HIGH-VALUE ENDPOINTS (e.g., /checkout, /payment)                          │
│   ──────────────────────────────────────────────────                         │
│   ReservoirSize: 10                                                          │
│   FixedRate: 0.25 (25%)  ← Higher sampling for critical paths               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Performance Tips

| Tip | Reason |
|-----|--------|
| **Use Daemon** | Buffers segments, doesn't block main thread |
| **Async subsegments** | Don't wait for subsegment close |
| **Limit metadata size** | Large metadata can slow down |
| **Avoid tracing health checks** | Noise in traces, wasted cost |

---

## 🧪 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **No traces appearing** | Check IAM permissions, verify daemon is running |
| **Missing segments** | Ensure SDK is properly patched for AWS calls |
| **Sampling too low** | Adjust sampling rules, check reservoir size |
| **High costs** | Review sampling strategy, reduce metadata size |
| **Traces not connected** | Ensure trace header is propagated across services |

### Debug Commands

```bash
# Check X-Ray daemon status (EC2)
sudo systemctl status xray

# Check daemon logs
sudo journalctl -u xray -f

# Test connectivity to X-Ray API
curl -X POST https://xray.us-east-1.amazonaws.com/

# View current sampling rules
aws xray get-sampling-rules

# Test send trace (manual)
aws xray put-trace-segments --region us-east-1 --trace-segment-documents '{...}'
```

---

## 📚 Tổng Kết

### X-Ray Key Takeaways

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          X-RAY QUICK REFERENCE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🎯 PURPOSE: Distributed tracing for debugging microservices                │
│                                                                              │
│  📦 COMPONENTS:                                                              │
│  • Traces → Full request journey                                             │
│  • Segments → Per-service work                                               │
│  • Subsegments → Detailed operations (DB calls, HTTP)                        │
│  • Annotations → Indexed, searchable metadata                                │
│  • Metadata → Non-indexed details                                            │
│                                                                              │
│  🔧 INTEGRATION:                                                             │
│  • Lambda: Enable "Active Tracing"                                           │
│  • API Gateway: Enable in stage settings                                     │
│  • EC2/ECS/EKS: X-Ray Daemon + SDK                                          │
│                                                                              │
│  💡 SAMPLING: Control costs with reservoir + fixed rate                     │
│                                                                              │
│  🔗 SERVICELENS: Combine X-Ray + CloudWatch for full observability          │
│                                                                              │
│  📊 SERVICE MAP: Visual topology of your distributed system                 │
│                                                                              │
│  🚨 INSIGHTS: Automatic anomaly detection and root cause analysis           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Related Services

| Service | Relationship |
|---------|--------------|
| **CloudWatch** | Logs + Metrics, ServiceLens integration |
| **CloudTrail** | API audit logs (who did what), not request tracing |
| **AWS Distro for OpenTelemetry** | Alternative instrumentation, sends to X-Ray |

---

## 🔗 Tài Liệu Tham Khảo

- [AWS X-Ray Developer Guide](https://docs.aws.amazon.com/xray/latest/devguide/)
- [X-Ray SDK Documentation](https://docs.aws.amazon.com/xray-sdk-for-python/latest/reference/)
- [X-Ray Pricing](https://aws.amazon.com/xray/pricing/)
- [X-Ray Daemon GitHub](https://github.com/aws/aws-xray-daemon)
