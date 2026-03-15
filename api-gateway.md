# Amazon API Gateway


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các loại API](#các-loại-api)
- [️ Kiến trúc](#kiến-trúc)
- [Integration Types](#integration-types)
- [Authentication & Authorization](#authentication-authorization)
- [⚡ Features](#features)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Hands-on Examples](#hands-on-examples)
- [Liên kết](#liên-kết)
- [Key Takeaways](#key-takeaways)

---

## Tổng quan

**Amazon API Gateway** là dịch vụ fully managed giúp tạo, publish, maintain, monitor, và secure APIs ở mọi quy mô.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WHAT IS API GATEWAY?                             │
│                                                                     │
│   API Gateway = "Cửa ngõ" cho backend services                      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │    Clients              API Gateway           Backend       │   │
│   │                                                             │   │
│   │   ┌─────────┐       ┌───────────────┐      ┌───────────┐    │   │
│   │   │   Web   │       │               │      │  Lambda   │    │   │
│   │   │   App   │──────▶│ • Routing     │─────▶│           │    │   │
│   │   └─────────┘       │ • Auth        │      └───────────┘    │   │
│   │                     │ • Throttling  │                       │   │
│   │   ┌─────────┐       │ • Caching     │      ┌───────────┐    │   │
│   │   │ Mobile  │──────▶│ • Monitoring  │─────▶│   EC2     │    │   │
│   │   │   App   │       │ • Transform   │      └───────────┘    │   │
│   │   └─────────┘       │               │                       │   │
│   │                     │               │      ┌───────────┐    │   │
│   │   ┌─────────┐       │               │─────▶│   HTTP    │    │   │
│   │   │   IoT   │──────▶│               │      │ Endpoint  │    │   │
│   │   │ Device  │       └───────────────┘      └───────────┘    │   │
│   │   └─────────┘                                               │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   KEY BENEFITS:                                                     │
│   ├── ✅ Fully managed - không cần quản lý servers                  │
│   ├── ✅ Auto-scaling - xử lý hàng triệu requests                   │
│   ├── ✅ Pay-per-use - chỉ trả tiền khi có traffic                  │
│   ├── ✅ Security - IAM, Cognito, API Keys, OAuth                   │
│   ├── ✅ Monitoring - CloudWatch metrics & logs                     │
│   └── ✅ Versioning - quản lý multiple API versions                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Các loại API

API Gateway hỗ trợ 3 loại API:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY TYPES                              │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. REST API                                                │   │
│   │     ┌───────────────────────────────────────────────────┐   │   │
│   │     │  Full-featured API với nhiều tính năng:            │  │   │
│   │     │                                                     │ │   │
│   │     │  ✅ API Keys & Usage Plans                         │  │   │
│   │     │  ✅ Request/Response validation                    │  │   │
│   │     │  ✅ Request/Response transformation               │   │   │
│   │     │  ✅ Caching                                         │ │   │
│   │     │  ✅ WAF integration                                │  │   │
│   │     │  ✅ Private APIs (VPC only)                        │  │   │
│   │     │                                                     │ │   │
│   │     │  Endpoint types:                                    │ │   │
│   │     │  • Regional - Deploy in AWS Region                 │  │   │
│   │     │  • Edge-optimized - Via CloudFront                 │  │   │
│   │     │  • Private - Only within VPC                       │  │   │
│   │     │                                                     │ │   │
│   │     │  💰 $3.50 per million requests                     │  │   │
│   │     └───────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  2. HTTP API (Recommended cho đa số use cases)              │   │
│   │     ┌───────────────────────────────────────────────────┐   │   │
│   │     │  Simpler, faster, cheaper than REST API:           │  │   │
│   │     │                                                     │ │   │
│   │     │  ✅ 70% cheaper than REST API                      │  │   │
│   │     │  ✅ Lower latency                                  │  │   │
│   │     │  ✅ OIDC/OAuth 2.0 built-in                        │  │   │
│   │     │  ✅ CORS support built-in                          │  │   │
│   │     │  ✅ Auto-deploy                                     │ │   │
│   │     │                                                     │ │   │
│   │     │  ❌ Không có: API Keys, caching, WAF, transforms  │   │   │
│   │     │                                                     │ │   │
│   │     │  💰 $1.00 per million requests                     │  │   │
│   │     │                                                     │ │   │
│   │     │  Best for: Lambda/HTTP proxies, simple APIs        │  │   │
│   │     └───────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  3. WebSocket API                                           │   │
│   │     ┌───────────────────────────────────────────────────┐   │   │
│   │     │  Real-time two-way communication:                  │  │   │
│   │     │                                                     │ │   │
│   │     │  Client ◀─────────────────────────▶ Backend        │  │   │
│   │     │         Persistent connection                       │ │   │
│   │     │                                                     │ │   │
│   │     │  Routes events (JSON):                             │  │   │
│   │     │  • $connect - Client connects                      │  │   │
│   │     │  • $disconnect - Client disconnects                │  │   │
│   │     │  • $default - Default route                        │  │   │
│   │     │  • Custom routes (e.g., "sendMessage")             │  │   │
│   │     │                                                     │ │   │
│   │     │  Use cases:                                        │  │   │
│   │     │  • Chat applications                               │  │   │
│   │     │  • Live dashboards                                 │  │   │
│   │     │  • Real-time notifications                         │  │   │
│   │     │  • Gaming                                          │  │   │
│   │     │                                                     │ │   │
│   │     │  💰 $1.00 per million messages                     │  │   │
│   │     │      + $0.25 per million connection minutes        │  │   │
│   │     └───────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### So sánh REST API vs HTTP API

```
┌─────────────────────────────────────────────────────────────────────┐
│                   REST API vs HTTP API                              │
│                                                                     │
│   ┌──────────────────────────┬──────────────────────────────────┐   │
│   │        Feature           │   REST API   │    HTTP API       │   │
│   ├──────────────────────────┼──────────────┼───────────────────┤   │
│   │ Price (per 1M requests)  │    $3.50     │     $1.00         │   │
│   │ Latency                  │    Higher    │     ~40% lower    │   │
│   │ Lambda integration       │      ✅      │       ✅          │   │
│   │ HTTP backend             │      ✅      │       ✅          │   │
│   │ Private integration      │      ✅      │       ✅          │   │
│   │ JWT/OIDC authorization   │      ❌      │       ✅          │   │
│   │ IAM authorization        │      ✅      │       ✅          │   │
│   │ Lambda authorizer        │      ✅      │       ✅          │   │
│   │ API Keys                 │      ✅      │       ❌          │   │
│   │ Usage plans & quotas     │      ✅      │       ❌          │   │
│   │ Request caching          │      ✅      │       ❌          │   │
│   │ Request transformation   │      ✅      │       ❌          │   │
│   │ Request validation       │      ✅      │       ❌          │   │
│   │ WAF integration          │      ✅      │       ❌          │   │
│   │ Private endpoints        │      ✅      │       ❌          │   │
│   │ Mutual TLS               │      ✅      │       ✅          │   │
│   └──────────────────────────┴──────────────┴───────────────────┘   │
│                                                                     │
│   RECOMMENDATION:                                                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Bắt đầu với HTTP API, chỉ dùng REST API khi cần:           │   │
│   │  • API Keys & Usage Plans (monetization)                    │   │
│   │  • Request caching                                          │   │
│   │  • Request/Response transformation                          │   │
│   │  • WAF protection                                           │   │
│   │  • Private endpoints (VPC only access)                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Kiến trúc

### Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  API GATEWAY REQUEST FLOW                           │
│                                                                     │
│   Client Request                                                    │
│      │                                                              │
│        ▼                                                            │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      API GATEWAY                            │   │
│   │                                                             │   │
│   │  ┌───────────────────────────────────────────────────────┐  │   │
│   │  │  1. METHOD REQUEST                                     │ │   │
│   │  │     • Validate request parameters                      │ │   │
│   │  │     • Check API Key                                    │ │   │
│   │  │     • Authorization (IAM, Cognito, Lambda)             │ │   │
│   │  └───────────────────────────────────────────────────────┘  │   │
│   │                          │                                  │   │
│   │                          ▼                                  │   │
│   │  ┌───────────────────────────────────────────────────────┐  │   │
│   │  │  2. INTEGRATION REQUEST                                │ │   │
│   │  │     • Transform request (mapping templates)            │ │   │
│   │  │     • Add headers if needed                            │ │   │
│   │  │     • Route to backend                                 │ │   │
│   │  └───────────────────────────────────────────────────────┘  │   │
│   │                          │                                  │   │
│   └──────────────────────────┼──────────────────────────────────┘   │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     BACKEND                                 │   │
│   │         Lambda / HTTP / AWS Service / Mock                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                            │                                        │
│   ┌──────────────────────────┼───────────────────────────────────┐  │
│   │                          ▼                                   │  │
│   │  ┌───────────────────────────────────────────────────────┐  │   │
│   │  │  3. INTEGRATION RESPONSE                               │ │   │
│   │  │     • Receive response from backend                    │ │   │
│   │  │     • Transform response                               │ │   │
│   │  └───────────────────────────────────────────────────────┘  │   │
│   │                          │                                  │   │
│   │                          ▼                                   │  │
│   │  ┌───────────────────────────────────────────────────────┐  │   │
│   │  │  4. METHOD RESPONSE                                    │ │   │
│   │  │     • Set response headers                             │ │   │
│   │  │     • Set status codes                                 │ │   │
│   │  └───────────────────────────────────────────────────────┘  │   │
│   │                                                              │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                            │                                        │
│                              ▼                                      │
│                     Client Response                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Stages và Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STAGES & DEPLOYMENT                              │
│                                                                     │
│   API Definition (Resources, Methods, Integrations)                 │
│      │                                                              │
│        │  Deploy                                                    │
│        ▼                                                            │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                        STAGES                               │   │
│   │                                                             │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│   │   │    dev      │  │   staging   │  │    prod     │         │   │
│   │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │   │
│   │          │                │                │                │   │
│   │          ▼                ▼                ▼                │   │
│   │   api.com/dev/     api.com/staging/   api.com/prod/         │   │
│   │                                                             │   │
│   │   Mỗi stage có:                                             │   │
│   │   • Stage variables (như env vars)                          │   │
│   │   • Logging settings                                        │   │
│   │   • Throttling settings                                     │   │
│   │   • Cache settings                                          │   │
│   │   • Canary deployments                                      │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   STAGE VARIABLES:                                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Stage: dev                                                 │   │
│   │  ├── lambda_alias = "dev"                                   │   │
│   │  └── db_table = "users-dev"                                 │   │
│   │                                                             │   │
│   │  Stage: prod                                                │   │
│   │  ├── lambda_alias = "prod"                                  │   │
│   │  └── db_table = "users-prod"                                │   │
│   │                                                             │   │
│   │  Integration:                                               │   │
│   │  arn:aws:lambda:...:my-function:${stageVariables.lambda_alias}  │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Integration Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION TYPES                                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. LAMBDA FUNCTION                                         │   │
│   │     ┌───────────────────────────────────────────────────┐   │   │
│   │     │  API Gateway → Lambda                              │  │   │
│   │     │                                                     │ │   │
│   │     │  • Lambda Proxy: Pass entire request to Lambda    │   │   │
│   │     │    (Đơn giản, phổ biến nhất)                       │  │   │
│   │     │                                                     │ │   │
│   │     │  • Lambda Custom: Use mapping templates            │  │   │
│   │     │    (Transform request/response)                    │  │   │
│   │     └───────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  2. HTTP                                                    │   │
│   │     ┌───────────────────────────────────────────────────┐   │   │
│   │     │  API Gateway → Any HTTP endpoint                   │  │   │
│   │     │                                                     │ │   │
│   │     │  • HTTP Proxy: Forward request as-is              │   │   │
│   │     │  • HTTP Custom: Transform request/response        │   │   │
│   │     │                                                     │ │   │
│   │     │  Example: api.example.com → internal.backend.com   │  │   │
│   │     └───────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  3. AWS SERVICE                                             │   │
│   │     ┌───────────────────────────────────────────────────┐   │   │
│   │     │  API Gateway → AWS Services directly               │  │   │
│   │     │                                                     │ │   │
│   │     │  Ví dụ:                                            │  │   │
│   │     │  • POST /upload → S3 PutObject                     │  │   │
│   │     │  • POST /message → SQS SendMessage                 │  │   │
│   │     │  • POST /event → SNS Publish                       │  │   │
│   │     │  • POST /item → DynamoDB PutItem                   │  │   │
│   │     │                                                     │ │   │
│   │     │  → Không cần Lambda! Giảm cost & latency          │   │   │
│   │     └───────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  4. VPC LINK (Private Integration)                          │   │
│   │     ┌───────────────────────────────────────────────────┐   │   │
│   │     │  API Gateway → Resources in VPC                    │  │   │
│   │     │                                                     │ │   │
│   │     │  ┌─────────────┐     ┌─────────────────────────┐  │   │   │
│   │     │  │API Gateway  │────▶│    VPC Link             │  │   │   │
│   │     │  └─────────────┘     │        │                │  │   │   │
│   │     │                      │        ▼                │  │   │   │
│   │     │                      │  ┌───────────────┐     │  │    │   │
│   │     │                      │  │ NLB/ALB       │     │  │    │   │
│   │     │                      │  └───────┬───────┘     │  │    │   │
│   │     │                      │          ▼             │  │    │   │
│   │     │                      │  ┌───────────────┐     │  │    │   │
│   │     │                      │  │ ECS/EC2/EKS  │     │  │     │   │
│   │     │                      │  │ (Private)     │     │  │    │   │
│   │     │                      │  └───────────────┘     │  │    │   │
│   │     │                      └─────────────────────────┘  │   │   │
│   │     └───────────────────────────────────────────────┘       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  5. MOCK                                                    │   │
│   │     ┌───────────────────────────────────────────────────┐   │   │
│   │     │  API Gateway trả về response cố định               │  │   │
│   │     │  (Không call backend)                               │ │   │
│   │     │                                                     │ │   │
│   │     │  Use cases:                                         │ │   │
│   │     │  • Testing/Development                              │ │   │
│   │     │  • CORS preflight (OPTIONS)                        │  │   │
│   │     │  • Health checks                                   │  │   │
│   │     └───────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

```
┌──────────────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION & AUTHORIZATION                      │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  1. IAM AUTHORIZATION                                       │    │
│   │     ┌───────────────────────────────────────────────────┐    │   │
│   │     │  Client ──(SigV4)──▶ API Gateway ──▶ IAM ──▶ OK   │    │   │
│   │     │                                                     │  │   │
│   │     │  • Dùng AWS credentials để sign request            │   │   │
│   │     │  • Best for: AWS services, internal apps           │   │   │
│   │     │  • IAM Policy controls access                      │   │   │
│   │     └───────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  2. COGNITO USER POOLS                                      │    │
│   │     ┌───────────────────────────────────────────────────┐    │   │
│   │     │                                                     │  │   │
│   │     │  1. User ──(login)──▶ Cognito ──▶ JWT Token        │   │   │
│   │     │                                                     │  │   │
│   │     │  2. User ──(JWT)──▶ API Gateway ──▶ Cognito ──▶ OK │   │   │
│   │     │                                                     │  │   │
│   │     │  • Fully managed user directory                    │   │   │
│   │     │  • Built-in sign-up/sign-in                        │   │   │
│   │     │  • Social login (Google, Facebook, Apple)          │   │   │
│   │     │  • MFA support                                     │   │   │
│   │     │  • Best for: Web/mobile apps                       │   │   │
│   │     └───────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  3. LAMBDA AUTHORIZER (Custom Authorizer)                   │    │
│   │     ┌───────────────────────────────────────────────────┐    │   │
│   │     │                                                     │  │   │
│   │     │  Request ──▶ API Gateway ──▶ Lambda Authorizer     │   │   │
│   │     │                                      │              │  │   │
│   │     │                               ┌──────┴──────┐       │  │   │
│   │     │                               ▼             ▼       │  │   │
│   │     │                            Allow         Deny       │  │   │
│   │     │                               │             │       │  │   │
│   │     │                               ▼             ▼       │  │   │
│   │     │                          Backend       403 Error    │  │   │
│   │     │                                                     │  │   │
│   │     │  2 types:                                           │  │   │
│   │     │  • Token-based: Validate JWT/OAuth tokens          │   │   │
│   │     │  • Request-based: Check headers, query params      │   │   │
│   │     │                                                     │  │   │
│   │     │  Best for: Custom auth logic, 3rd party tokens     │   │   │
│   │     │                                                     │  │   │
│   │     │  ⚡ Tip: Enable caching to reduce Lambda calls     │   │   │
│   │     └───────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  4. API KEYS                                                │    │
│   │     ┌───────────────────────────────────────────────────┐    │   │
│   │     │  Request (x-api-key: xxx) ──▶ API Gateway         │    │   │
│   │     │                                                     │  │   │
│   │     │  ⚠️ Không phải auth mechanism!                     │   │   │
│   │     │     API Keys chỉ dùng để:                          │   │   │
│   │     │     • Identify clients                             │   │   │
│   │     │     • Track usage                                  │   │   │
│   │     │     • Apply quotas/throttling                      │   │   │
│   │     │                                                     │  │   │
│   │     │  Luôn kết hợp với auth mechanism khác!             │   │   │
│   │     └───────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Lambda Authorizer Example

```python
# lambda_authorizer.py
import jwt
import os

SECRET_KEY = os.environ['JWT_SECRET']

def lambda_handler(event, context):
    """
    Token-based Lambda Authorizer
    """
    token = event.get('authorizationToken', '').replace('Bearer ', '')
    method_arn = event['methodArn']
    
    try:
        # Validate JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('sub')
        
        # Return IAM policy allowing access
        return generate_policy(user_id, 'Allow', method_arn)
        
    except jwt.ExpiredSignatureError:
        raise Exception('Unauthorized')  # 401
    except jwt.InvalidTokenError:
        raise Exception('Unauthorized')  # 401

def generate_policy(principal_id, effect, resource):
    return {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': effect,
                'Resource': resource
            }]
        },
        'context': {
            'userId': principal_id  # Pass to downstream Lambda
        }
    }
```

---

## Features

### Caching

```
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY CACHING                           │
│                    (REST API only)                                  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │  Request ──▶ API Gateway ──▶ Cache Hit? ──▶ Return cached   │   │
│   │                                   │                         │   │
│   │                                   ▼ Miss                    │   │
│   │                              Backend ──▶ Cache ──▶ Return   │   │
│   │                                                             │   │
│   │  Configuration:                                             │   │
│   │  • Capacity: 0.5 GB to 237 GB                               │   │
│   │  • TTL: 0 to 3600 seconds (default 300s)                    │   │
│   │  • Per-method override                                      │   │
│   │  • Encryption option                                        │   │
│   │                                                             │   │
│   │  Cost: $0.020 - $3.800 per hour (depends on size)           │   │
│   │                                                             │   │
│   │  Cache Key:                                                 │   │
│   │  • URL path                                                 │   │
│   │  • Query strings (configurable)                             │   │
│   │  • Headers (configurable)                                   │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ⚡ Cache Invalidation:                                            │
│   • Console: Flush entire stage cache                               │
│   • Client header: Cache-Control: max-age=0                         │
│      (Requires client to have IAM permission)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Throttling

```
┌─────────────────────────────────────────────────────────────────────┐
│                       THROTTLING                                    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  DEFAULT LIMITS (per region, per account):                  │   │
│   │                                                             │   │
│   │  • 10,000 requests/second (RPS)                             │   │
│   │  • 5,000 burst capacity                                     │   │
│   │                                                             │   │
│   │  Có thể request tăng qua AWS Support                        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   THROTTLING LEVELS:                                                │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   Account Level (10,000/s)                                  │   │
│   │        │                                                    │   │
│   │        ▼                                                    │   │
│   │   Stage Level (configure per stage)                         │   │
│   │        │                                                    │   │
│   │        ▼                                                    │   │
│   │   Method Level (configure per method)                       │   │
│   │        │                                                    │   │
│   │        ▼                                                    │   │
│   │   Usage Plan (per API Key)                                  │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   When throttled: 429 Too Many Requests                             │
│                                                                     │
│   USAGE PLANS:                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Plan: Basic                                                │   │
│   │  ├── Throttle: 100 requests/second                          │   │
│   │  ├── Burst: 200 requests                                    │   │
│   │  └── Quota: 10,000 requests/month                           │   │
│   │                                                             │   │
│   │  Plan: Premium                                              │   │
│   │  ├── Throttle: 1,000 requests/second                        │   │
│   │  ├── Burst: 2,000 requests                                  │   │
│   │  └── Quota: 1,000,000 requests/month                        │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### CORS (Cross-Origin Resource Sharing)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CORS                                       │
│                                                                     │
│   Browser (https://myapp.com) ──▶ API (https://api.myapp.com)       │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  PREFLIGHT REQUEST (OPTIONS):                               │   │
│   │                                                             │   │
│   │  Browser ──(OPTIONS)──▶ API Gateway                         │   │
│   │                               │                             │   │
│   │                               ▼                             │   │
│   │  Response Headers:                                          │   │
│   │  • Access-Control-Allow-Origin: https://myapp.com           │   │
│   │  • Access-Control-Allow-Methods: GET, POST, PUT             │   │
│   │  • Access-Control-Allow-Headers: Content-Type, Auth         │   │
│   │                                                             │   │
│   │  Sau đó:                                                    │   │
│   │  Browser ──(GET/POST)──▶ API Gateway ──▶ Backend            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   HTTP API: CORS built-in, just enable                              │
│   REST API: Must configure manually or use Mock integration         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pricing

```
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY PRICING                           │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  REST API                                                   │   │
│   │  ├── First 333 million requests/month: $3.50 / million      │   │
│   │  ├── Next 667 million: $2.80 / million                      │   │
│   │  └── Over 1 billion: $2.38 / million                        │   │
│   │                                                             │   │
│   │  + Caching: $0.020 - $3.80 / hour (optional)                │   │
│   │  + Data transfer out: Standard AWS rates                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  HTTP API (70% cheaper!)                                    │   │
│   │  ├── First 300 million requests/month: $1.00 / million      │   │
│   │  └── Over 300 million: $0.90 / million                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  WebSocket API                                              │   │
│   │  ├── Messages: $1.00 / million                              │   │
│   │  └── Connection minutes: $0.25 / million                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   EXAMPLE CALCULATION:                                              │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  10 million requests/month (HTTP API):                      │   │
│   │                                                             │   │
│   │  API Gateway: 10M × $1.00/1M = $10.00                       │   │
│   │  Lambda (128MB, 100ms): ~$2.00                              │   │
│   │  DynamoDB (on-demand): ~$3.00                               │   │
│   │  ─────────────────────────────────                          │   │
│   │  Total: ~$15/month for Serverless API                       │   │
│   │                                                             │   │
│   │  So với EC2 t3.medium 24/7: ~$30/month                      │   │
│   │  → Serverless rẻ hơn 50%!                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

```
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY BEST PRACTICES                       │
│                                                                     │
│   1. CHOOSE THE RIGHT API TYPE                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Start with HTTP API (cheaper, simpler)                   │   │
│   │  • Use REST API only when you need:                         │   │
│   │    - API Keys, Usage Plans                                  │   │
│   │    - Caching                                                │   │
│   │    - Request transformation                                 │   │
│   │    - WAF integration                                        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   2. USE LAMBDA PROXY INTEGRATION                                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Simpler to set up                                        │   │
│   │  • Full control in Lambda (routing, validation)             │   │
│   │  • Easier testing (same event format)                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   3. ENABLE CACHING FOR READ-HEAVY APIs                             │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Cache GET requests                                       │   │
│   │  • Set appropriate TTL                                      │   │
│   │  • Use Cache-Control headers                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   4. IMPLEMENT PROPER ERROR HANDLING                                │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Return proper HTTP status codes                          │   │
│   │  • Consistent error response format                         │   │
│   │  • Log errors to CloudWatch                                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   5. USE STAGES FOR ENVIRONMENTS                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • dev, staging, prod stages                                │   │
│   │  • Stage variables for configuration                        │   │
│   │  • Different Lambda aliases per stage                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   6. SECURITY                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Enable CloudWatch logging                                │   │
│   │  • Use WAF for protection                                   │   │
│   │  • Set up throttling                                        │   │
│   │  • Use HTTPS only (default)                                 │   │
│   │  • Implement proper CORS                                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   7. MONITORING                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Key CloudWatch Metrics:                                    │   │
│   │  • Count (request count)                                    │   │
│   │  • 4XXError, 5XXError                                       │   │
│   │  • Latency, IntegrationLatency                              │   │
│   │  • CacheHitCount, CacheMissCount                            │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Hands-on Examples

### Example 1: REST API with Lambda (SAM Template)

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  # Lambda Function
  UsersFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.11
      CodeUri: ./src
      Events:
        GetUsers:
          Type: Api
          Properties:
            Path: /users
            Method: GET
        CreateUser:
          Type: Api
          Properties:
            Path: /users
            Method: POST
        GetUser:
          Type: Api
          Properties:
            Path: /users/{id}
            Method: GET

Outputs:
  ApiUrl:
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

### Example 2: Lambda Handler for API Gateway

```python
# app.py
import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

def lambda_handler(event, context):
    """
    REST API handler với Lambda Proxy Integration
    """
    http_method = event['httpMethod']
    path = event['path']
    path_params = event.get('pathParameters') or {}
    
    try:
        if http_method == 'GET' and path == '/users':
            return get_all_users()
        
        elif http_method == 'GET' and 'id' in path_params:
            return get_user(path_params['id'])
        
        elif http_method == 'POST' and path == '/users':
            body = json.loads(event['body'])
            return create_user(body)
        
        else:
            return response(404, {'error': 'Not Found'})
            
    except Exception as e:
        print(f"Error: {e}")
        return response(500, {'error': str(e)})

def get_all_users():
    result = table.scan()
    return response(200, result.get('Items', []))

def get_user(user_id):
    result = table.get_item(Key={'id': user_id})
    if 'Item' in result:
        return response(200, result['Item'])
    return response(404, {'error': 'User not found'})

def create_user(data):
    table.put_item(Item=data)
    return response(201, {'message': 'User created', 'user': data})

def response(status_code, body):
    """
    Format response cho API Gateway Proxy Integration
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # CORS
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
        },
        'body': json.dumps(body, default=str)
    }
```

### Example 3: HTTP API with JWT Auth (CDK)

```typescript
// lib/api-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as authorizers from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    // Lambda function
    const handler = new lambda.Function(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    // HTTP API with JWT authorizer
    const httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ['Authorization', 'Content-Type'],
      },
    });

    // JWT Authorizer (Cognito or any OIDC provider)
    const authorizer = new authorizers.HttpJwtAuthorizer(
      'JwtAuthorizer',
      'https://cognito-idp.{region}.amazonaws.com/{userPoolId}',
      {
        jwtAudience: ['your-app-client-id'],
      }
    );

    // Routes
    httpApi.addRoutes({
      path: '/users',
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('UsersIntegration', handler),
      authorizer: authorizer,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url!,
    });
  }
}
```

### Example 4: Direct Integration với DynamoDB (không cần Lambda)

```yaml
# API Gateway → DynamoDB (no Lambda!)
# CloudFormation snippet

Resources:
  ApiGatewayDynamoDBRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                Resource: !GetAtt UsersTable.Arn

  # PUT /items → DynamoDB PutItem
  PutItemMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref Api
      ResourceId: !Ref ItemsResource
      HttpMethod: PUT
      AuthorizationType: NONE
      Integration:
        Type: AWS
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:dynamodb:action/PutItem
        Credentials: !GetAtt ApiGatewayDynamoDBRole.Arn
        RequestTemplates:
          application/json: |
            {
              "TableName": "Items",
              "Item": {
                "id": {"S": "$input.path('$.id')"},
                "name": {"S": "$input.path('$.name')"}
              }
            }
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: '{"message": "Item saved"}'
      MethodResponses:
        - StatusCode: 200
```

---

## Liên kết

- [Lambda](./lambda.md) - Serverless compute
- [DynamoDB](./dynamodb.md) - NoSQL database
- [Cognito](./cognito.md) - User authentication
- [Step Functions](./step-functions.md) - Workflow orchestration

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────────┐
│                  API GATEWAY KEY POINTS                             │
│                                                                     │
│  1. 3 TYPES OF APIs                                                 │
│     • HTTP API: Simple, cheap ($1/million), recommended             │
│     • REST API: Full-featured ($3.50/million)                       │
│     • WebSocket: Real-time bidirectional                            │
│                                                                     │
│  2. INTEGRATION TYPES                                               │
│     • Lambda Proxy (most common)                                    │
│     • HTTP Proxy                                                    │
│     • AWS Service (direct DynamoDB, S3, etc.)                       │
│     • VPC Link (private resources)                                  │
│                                                                     │
│  3. AUTHENTICATION                                                  │
│     • IAM: AWS services, internal                                   │
│     • Cognito: Web/mobile apps                                      │
│     • Lambda Authorizer: Custom logic                               │
│     • API Keys: NOT for auth, only identity/throttling              │
│                                                                     │
│  4. KEY FEATURES                                                    │
│     • Caching (REST API only)                                       │
│     • Throttling (protect backend)                                  │
│     • Stages (dev/staging/prod)                                     │
│     • CORS support                                                  │
│                                                                     │
│  5. BEST PRACTICES                                                  │
│     • Start with HTTP API                                           │
│     • Use Lambda Proxy integration                                  │
│     • Enable caching for reads                                      │
│     • Monitor with CloudWatch                                       │
│     • Set proper throttling limits                                  │
└─────────────────────────────────────────────────────────────────────┘
```
