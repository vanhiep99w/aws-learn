# AWS AppSync

## Mục lục

- [Tổng quan](#tổng-quan)
- [GraphQL Fundamentals](#graphql-fundamentals)
- [Kiến trúc](#kiến-trúc)
- [Data Sources](#data-sources)
- [Real-time & Subscriptions](#real-time--subscriptions)
- [Caching](#caching)
- [Security](#security)
- [Pricing](#pricing)
- [So sánh với API Gateway](#so-sánh-với-api-gateway)
- [Best Practices](#best-practices)
- [Hands-on Examples](#hands-on-examples)
- [Liên kết](#liên-kết)

---

## Tổng quan

**AWS AppSync** là dịch vụ fully managed giúp xây dựng GraphQL APIs với khả năng real-time và offline capabilities.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WHAT IS AWS APPSYNC?                         │
│                                                                       │
│   AppSync = Serverless GraphQL Service                                │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                               │   │
│   │    Clients              AppSync              Data Sources     │   │
│   │                                                               │   │
│   │   ┌─────────┐       ┌───────────────┐      ┌───────────┐    │   │
│   │   │   Web   │       │               │      │  DynamoDB │    │   │
│   │   │   App   │──────▶│ • GraphQL API │─────▶│           │    │   │
│   │   └─────────┘       │ • Resolvers   │      └───────────┘    │   │
│   │                     │ • Subscriptions│                     │   │
│   │   ┌─────────┐       │ • Caching     │      ┌───────────┐    │   │
│   │   │ Mobile  │──────▶│ • Offline Sync│─────▶│  Lambda   │    │   │
│   │   │   App   │       │ • Security    │      └───────────┘    │   │
│   │   └─────────┘       │               │                        │   │
│   │                     │               │      ┌───────────┐    │   │
│   │   ┌─────────┐       │               │─────▶│    RDS    │    │   │
│   │   │   IoT   │──────▶│               │      │ (Aurora)  │    │   │
│   │   │ Device  │       └───────────────┘      └───────────┘    │   │
│   │   └─────────┘                                                │   │
│   │                                                               │   │
│   │   KEY BENEFITS:                                               │
│   ├── ✅ Fully managed - không cần quản lý servers              │
│   ├── ✅ Real-time subscriptions - WebSocket                    │
│   ├── ✅ Offline data sync - client cache                        │
│   ├── ✅ Flexible data sources - SQL/NoSQL/Lambda               │
│   ├── ✅ Fine-grained access control - Cognito, IAM, API Keys   │
│   └── ✅ Enterprise caching - improved performance              │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Concepts

| Concept | Mô tả |
|---------|-------|
| **GraphQL Schema** | Định nghĩa types, queries, mutations, subscriptions |
| **Resolver** | Code xử lý request, mapping giữa GraphQL và data source |
| **Data Source** | Nơi lưu trữ data: DynamoDB, Lambda, RDS, HTTP endpoints |
| **Pipeline Resolver** | Chain nhiều functions/VTL steps |
| **Subscription** | Real-time updates qua WebSocket |

---

## GraphQL Fundamentals

### GraphQL vs REST

```
┌──────────────────┬──────────────────────┬──────────────────────┐
│      Aspect      │        REST          │      GraphQL         │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Data Fetching    │ Nhiều endpoints      │ Một endpoint         │
│                  │ cho từng resource    │ lấy đúng data cần    │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Over-fetching    │ Thường lấy thừa data │ Chỉ lấy what u need  │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Under-fetching   │ Cần nhiều calls      │ Một query đủ data    │
│                  │ cho relational data  │                      │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Schema           │ Không có type system │ Strongly typed       │
│                  │                      │ schema               │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Real-time        │ Polling hoặc         │ Subscriptions        │
│                  │ WebSocket riêng      │ (built-in)           │
└──────────────────┴──────────────────────┴──────────────────────┘
```

### GraphQL Operations

```graphql
# Query - Lấy data (tương đương GET)
query GetPost {
  getPost(id: "post-123") {
    id
    title
    author {
      name
      email
    }
    comments {
      text
      createdAt
    }
  }
}

# Mutation - Thay đổi data (tương đương POST/PUT/DELETE)
mutation CreatePost {
  createPost(input: {
    title: "Bài viết mới"
    content: "Nội dung..."
    authorId: "user-456"
  }) {
    id
    title
    createdAt
  }
}

# Subscription - Real-time updates (WebSocket)
subscription OnNewComment {
  onCreateComment(postId: "post-123") {
    id
    text
    author {
      name
    }
    createdAt
  }
}
```

### Schema Definition

```graphql
type Post {
  id: ID!
  title: String!
  content: String
  author: User!
  comments: [Comment!]!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
  createdAt: AWSDateTime!
}

type Query {
  getPost(id: ID!): Post
  listPosts(limit: Int, nextToken: String): PostConnection
  searchPosts(query: String!): [Post!]!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Post
}

type Subscription {
  onCreatePost: Post @aws_subscribe(mutations: ["createPost"])
  onUpdatePost(postId: ID!): Post @aws_subscribe(mutations: ["updatePost"])
  onDeletePost: Post @aws_subscribe(mutations: ["deletePost"])
}

input CreatePostInput {
  title: String!
  content: String
  authorId: ID!
}

type PostConnection {
  items: [Post!]!
  nextToken: String
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}
```

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPSYNC ARCHITECTURE                          │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                        Clients                               │   │
│   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │   │
│   │   │   Web   │   │ Mobile  │   │   IoT   │   │   SPA   │   │   │
│   │   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   │   │
│   └────────┼─────────────┼─────────────┼─────────────┼────────┘   │
│            │             │             │             │            │
│            └─────────────┴──────────┬──┴─────────────┘            │
│                                    │                               │
│                           ┌────────▼────────┐                     │
│                           │   AppSync API   │                     │
│                           │  (GraphQL Edge) │                     │
│                           └────────┬────────┘                     │
│                                    │                               │
│                    ┌───────────────┼───────────────┐              │
│                    │               │               │              │
│           ┌────────▼────┐ ┌───────▼───────┐ ┌──────▼────────┐    │
│           │   Queries    │ │  Mutations    │ │ Subscriptions │    │
│           │  & Reads     │ │  & Writes     │ │ (WebSocket)   │    │
│           └──────┬───────┘ └───────┬───────┘ └───────┬────────┘    │
│                    │               │               │              │
│           ┌────────▼───────┐ ┌─────▼────────┐ ┌─────▼────────┐    │
│           │  Unit Resolver │ │ Pipeline     │ │ Subscription │    │
│           │  or Pipeline   │ │ Resolver     │ │ Handler      │    │
│           └────────┬───────┘ └──────┬───────┘ └──────────┬────┘    │
│                    │                │                     │         │
│                    └────────────────┼─────────────────────┘         │
│                                     │                               │
│    ┌────────────────────────────────┼────────────────────────┐     │
│    │                         DATA SOURCES                    │     │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │     │
│    │  │  DynamoDB   │  │    Lambda    │  │     RDS     │    │     │
│    │  │  (NoSQL)    │  │  (Any DB)    │  │ (PostgreSQL │    │     │
│    │  │             │  │              │  │  MySQL)     │    │     │
│    │  └─────────────┘  └─────────────┘  └─────────────┘    │     │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │     │
│    │  │    HTTP     │  │   Amazon     │  │    Open     │    │     │
│    │  │  Endpoints  │  │  Elasticsearch│  │  Search    │    │     │
│    │  │ (REST/SOAP)│  │              │  │             │    │     │
│    │  └─────────────┘  └─────────────┘  └─────────────┘    │     │
│    └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     APPSYNC REQUEST FLOW                            │
│                                                                       │
│   1. Client sends GraphQL Request                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  query GetPost { getPost(id: "123") { title } }            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   2. AppSync validates against Schema                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  • Parse GraphQL query                                      │   │
│   │  • Validate operation type & arguments                     │   │
│   │  • Check authorization                                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   3. Find Resolver for the field                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  getPost(id: ID!): Post  ──────▶  Resolver: DynamoDB        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   4. Execute Resolver (VTL or Pipeline)                             │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  {                                                            │   │
│   │    "version": "2017-02-28",                                  │   │
│   │    "operation": "GetItem",                                    │   │
│   │    "key": { "id": $util.toJson($ctx.args.id) }              │   │
│   │  }                                                            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   5. Query Data Source                                             │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  DynamoDB.GetItem({ TableName: "Posts", Key: { id: "123" }})│   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   6. Return Response to Client                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  { "data": { "getPost": { "title": "Hello World" } } }      │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

### Supported Data Sources

| Data Source | Use Case | Pricing Impact |
|-------------|----------|----------------|
| **DynamoDB** | NoSQL, high throughput | Data transfer |
| **Lambda** | Custom logic, any DB | Lambda invocations |
| **RDS (Aurora)** | Relational data | RDS costs |
| **HTTP** | Connect to external APIs | Data transfer |
| **Amazon OpenSearch | Full-text search | OpenSearch costs |
| **EventBridge** | Event-driven apps | EventBridge costs |

### DynamoDB Resolver (VTL)

```json
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.toJson($ctx.args.id)
  },
  "condition": {
    "expression": "attribute_exists(#id)",
    "expressionNames": {
      "#id": "id"
    }
  }
}
```

```json
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "title": $util.dynamodb.toDynamoDBJson($ctx.args.input.title),
    "content": $util.dynamodb.toDynamoDBJson($ctx.args.input.content),
    "authorId": $util.dynamodb.toDynamoDBJson($ctx.args.input.authorId),
    "createdAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
  }
}
```

### Lambda Resolver

```javascript
// Lambda function handler
exports.handler = async (event) => {
  // event.info.fieldName - tên field GraphQL
  // event.arguments - arguments từ query/mutation
  
  switch (event.info.fieldName) {
    case 'getPost':
      return await getPost(event.arguments.id);
    case 'listPosts':
      return await listPosts(event.arguments.limit);
    case 'createPost':
      return await createPost(event.arguments.input);
    default:
      throw new Error(`Unknown field: ${event.info.fieldName}`);
  }
};
```

### HTTP Data Source

```json
{
  "version": "2018-05-29",
  "method": "GET",
  "headers": {
    "Authorization": "$ctx.request.headers.Authorization"
  },
  "params": {
    "id": "$ctx.args.id"
  },
  "uri": "https://api.example.com/posts/${params.id}",
  "cacheNamespace": "posts"
}
```

### Pipeline Resolvers

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PIPELINE RESOLVER                                │
│                                                                       │
│   Request Mapping Template                                           │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  { "version": "2017-02-28" }                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Function 1: Validate Input                                │   │
│   │  - Check required fields                                  │   │
│   │  - Sanitize data                                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Function 2: Transform Data                               │   │
│   │  - Format dates                                           │   │
│   │  - Add computed fields                                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Function 3: Business Logic (Lambda)                      │   │
│   │  - Process data                                           │   │
│   │  - Call external services                                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   Response Mapping Template                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  $util.toJson($ctx.result)                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Real-time & Subscriptions

### How Subscriptions Work

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION ARCHITECTURE                         │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    Client A (Subscriber)                   │   │
│   │                                                              │   │
│   │  subscription {                                            │   │
│   │    onCreateComment(postId: "123") {                        │   │
│   │      id                                                     │   │
│   │      text                                                   │   │
│   │    }                                                        │   │
│   │  }                                                          │   │
│   │                        │                                     │   │
│   │                        │ 1. Connect (WebSocket)             │   │
│   │                        ▼                                     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    ▼                                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    AppSync Service                           │   │
│   │                                                              │   │
│   │   ┌────────────────────────────────────────────────────┐    │   │
│   │   │           Subscription Connection Table          │    │   │
│   │   │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │   │
│   │   │  │Client A  │ │Client B  │ │Client C  │          │    │   │
│   │   │  │onCreate  │ │onCreate  │ │onUpdate  │          │    │   │
│   │   │  │PostId:123│ │PostId:123│ │PostId:456│          │    │   │
│   │   │  └──────────┘ └──────────┘ └──────────┘          │    │   │
│   │   └────────────────────────────────────────────────────┘    │   │
│   │                                                              │   │
│   │            │ 2. Mutation triggers subscription              │   │
│   │            │ 3. AppSync pushes to subscribers               │   │
│   │            ▼                                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│          ┌─────────────────────────┼─────────────────────────┐      │
│          │                         │                         │      │
│          ▼                         ▼                         ▼      │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   │  Client A  │          │  Client B  │          │  Client C  │
│   │  receives  │          │  receives  │          │  receives  │
│   │  new data! │          │  new data! │          │  new data! │
│   └─────────────┘          └─────────────┘          └─────────────┘
```

### Subscription Example

```graphql
# Schema
type Mutation {
  createComment(input: CreateCommentInput!): Comment!
}

type Subscription {
  onCreateComment(postId: ID!): Comment 
    @aws_subscribe(mutations: ["createComment"])
}

# Client subscribes
const COMMENT_SUBSCRIPTION = `
  subscription OnComment($postId: ID!) {
    onCreateComment(postId: $postId) {
      id
      text
      author {
        name
      }
    }
  }
`;

// Using AppSync SDK
const subscription = API.graphql({
  query: COMMENT_SUBSCRIPTION,
  variables: { postId: "123" }
}).subscribe({
  next: ({ data }) => {
    console.log("New comment:", data.onCreateComment);
  },
  error: (error) => {
    console.error("Error:", error);
  }
});
```

### Real-time Features

| Feature | Mô tả |
|---------|-------|
| **Subscriptions** | WebSocket-based real-time updates |
| **mqtt.over.wss** | Alternative protocol for IoT |
| **Authorization** | Có thể áp dụng auth cho subscriptions |
| **Filtering** | Lọc subscription messages phía server |
| **Connection** | Persistent connections với keep-alive |

---

## Caching

### Caching Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                      APPSYNC CACHING                                 │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    API Caching                               │   │
│   │                                                               │   │
│   │   Request ──▶ ┌─────────┐ ──▶ Cache Hit? ──▶ Response      │   │
│   │                │  Redis  │              │                    │   │
│   │                │  Cache  │ ──▶ No ──▶ ──▶ Data Source       │   │
│   │                │         │         │          │               │   │
│   │                │         │         └──────────▶ Cache Store   │   │
│   │                └─────────┘                                │   │
│   │                                                               │   │
│   │   TTL: 1 minute - 24 hours                                  │   │
│   │   Scope: Per API or Per-Operation                            │   │
│   └─────────────────────────────────────────────────────────────┘   │
```

### Caching Configuration

| Setting | Options | Mô tả |
|---------|---------|-------|
| **Caching Type** | FULL_RESPONSE_CACHING, PER_RESOLVER_CACHING | Toàn bộ response hoặc từng resolver |
| **TTL** | 1-3600 seconds | Thời gian cache valid |
| **Cache Key** | Full / Minimal | Định nghĩa cache key |
| **Encryption** | Enabled by default (2025) | Mã hóa at-rest và in-transit |

### Operation-level Caching (New 2025)

```graphql
# Enable caching for specific queries
query GetPopularPosts {
  getPosts(type: "popular", limit: 10) @cache(ttl: 300) {
    id
    title
    viewCount
  }
}

# Per-resolver caching
# Trong AppSync console, chọn:
# - Enable caching
# - TTL: 300 seconds  
# - Cache key: FULL or MINIMAL
```

---

## Security

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APPSYNC SECURITY                                  │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. API Key                                                  │   │
│   │     - Simple, temp credentials                               │   │
│   │     - Good for development                                   │   │
│   │     - Expire after configurable time                         │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  2. IAM (AWS Identity and Access Management)                 │   │
│   │     - AWS credentials                                        │   │
│   │     - Fine-grained access control                            │   │
│   │     - Best for server-to-server                               │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  3. Amazon Cognito                                          │   │
│   │     - User pools + Identity pools                            │   │
│   │     - JWT tokens                                             │   │
│   │     - Best for mobile/web apps                               │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  4. OpenID Connect                                          │   │
│   │     - Any OIDC provider                                      │   │
│   │     - Custom authentication                                   │   │
│   └─────────────────────────────────────────────────────────────┘   │
```

### Fine-grained Access Control (VTL)

```json
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.toJson($ctx.args.id)
  },
  "condition": {
    "expression": "authorId = :authorId",
    "expressionValues": {
      ":authorId": $util.dynamodb.toDynamoDBJson($ctx.identity.claims.get("sub"))
    }
  }
}
```

### Authorization Modes

| Mode | Use Case | Provider |
|------|----------|----------|
| **API_KEY** | Development, simple APIs | AWS generated |
| **AWS_IAM** | Server applications | AWS credentials |
| **AMAZON_COGNITO_USER_POOLS** | End user apps | Cognito |
| **OPENID_CONNECT** | Custom auth | Any OIDC |
| **LAMBA_AUTHORIZER** | Custom logic | Lambda function |

### Security Best Practices

- **Always enable encryption** for caching (default since 2025)
- **Use IAM roles** for server-to-server communication
- **Implement proper Cognito** for user authentication
- **Use VPC endpoints** for private APIs
- **Enable WAF** for protection against common attacks
- **Rotate API keys** regularly

---

## Pricing

### AppSync Pricing (2025)

| Operation | Price (us-east-1) |
|-----------|------------------|
| **Query & Mutation** | $4.00 per million requests |
| **Real-time Updates** | $2.00 per million messages |
| **Connection Time** | $0.08 per million minutes |
| **Data Transfer** | EC2 data transfer rates |

### Pricing Examples

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRICING EXAMPLES                                │
│                                                                       │
│   Scenario 1: Basic API (100K requests/month)                       │
│   ├── Queries: 100K × $4.00/M = $0.40                              │
│   └── Total: ~$0.40/month                                          │
│                                                                       │
│   Scenario 2: Medium API (10M requests/month)                       │
│   ├── Queries: 10M × $4.00/M = $40.00                              │
│   ├── Real-time: 5M msgs × $2.00/M = $10.00                       │
│   └── Total: ~$50.00/month                                          │
│                                                                       │
│   Scenario 3: High Traffic (100M requests/month)                    │
│   ├── Queries: 100M × $4.00/M = $400.00                            │
│   ├── Real-time: 50M msgs × $2.00/M = $100.00                      │
│   └── Total: ~$500.00/month                                         │
│                                                                       │
│   Note: Lambda & Data Source costs separate!                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Cost Optimization Tips

- **Enable caching** - giảm số requests tới data sources
- **Use appropriate TTL** - cache data ít thay đổi lâu hơn
- **Optimize subscriptions** - chỉ subscribe what you need
- **Batch operations** - reduce number of API calls

---

## So sánh với API Gateway

```
┌────────────────────┬─────────────────────┬──────────────────────────┐
│      Feature       │    API Gateway      │       AppSync            │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Protocol           │ REST, HTTP, WebSocket│ GraphQL                  │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Data Fetching      │ Fixed endpoints      │ Flexible queries         │
│                    │ over-fetch/under    │ exact data needed        │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Real-time          │ WebSocket (manual)  │ Subscriptions (built-in) │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Offline Support    │ Không có            │ ✅ Client SDK            │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Data Sources       │ Lambda, HTTP,       │ DynamoDB, Lambda, RDS,  │
│                    │ Lambda, Mock        │ HTTP, OpenSearch, Event  │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Caching            │ API Gateway Cache   │ AppSync Cache            │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Schema            │ Không có            │ Strongly typed           │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Pricing           │ $3.50/M requests    │ $4.00/M requests        │
│                    │ + cache costs       │ + real-time costs       │
├────────────────────┼─────────────────────┼──────────────────────────┤
│ Best For          │ REST APIs           │ Complex data models     │
│                    │ Legacy integration  │ Real-time apps          │
│                    │ Simple CRUD         │ Mobile apps             │
└────────────────────┴─────────────────────┴──────────────────────────┘
```

### When to Use AppSync

| Use Case | Recommended |
|----------|-------------|
| Mobile apps với offline | AppSync ✅ |
| Complex relational data | AppSync ✅ |
| Real-time chat/notifications | AppSync ✅ |
| Simple REST APIs | API Gateway |
| Microservices (REST) | API Gateway |
| Legacy SOAP integration | API Gateway |

---

## Best Practices

### Design Best Practices

1. **Use proper schema design**
   - Nên define types rõ ràng
   - Sử dụng interfaces/unions khi cần
   - Avoid deeply nested queries

2. **Implement proper caching**
   - Cache frequently accessed data
   - Set appropriate TTL
   - Use cache invalidation when needed

3. **Optimize resolver performance**
   - Use Pipeline Resolvers for complex logic
   - Batch DynamoDB operations when possible
   - Avoid N+1 query problems

4. **Security-first approach**
   - Always use authentication
   - Implement authorization at resolver level
   - Use VPC for sensitive data

### Operational Best Practices

```yaml
# CloudFormation template snippet
Resources:
  GraphQLAPI:
    Type: AWS::AppSync::GraphQLApi
    Properties:
      Name: my-app-api
      AuthenticationType: AMAZON_COGNITO_USER_POOLS
      AdditionalAuthenticationProviders:
        - AuthenticationType: AWS_IAM
      LogConfig:
        FieldLogLevel: ALL
        CloudWatchLogsRoleArn: !GetAtt CloudWatchRole.Arn

  GraphQLSchema:
    Type: AWS::AppSync::Schema
    Properties:
      ApiId: !Ref GraphQLAPI
      Definition: |
        type Query {
          getPost(id: ID!): Post
        }
        # ... more schema
```

### Monitoring

```javascript
// CloudWatch Metrics to monitor
const metrics = [
  'AppSync.Requests',           // Total requests
  'AppSync.MutationRequests',   // Mutation count
  'AppSync.QueryRequests',      // Query count
  'AppSync.SubscriptionRequests', // Subscription count
  'AppSync.Latency',            // Response time
  'AppSync.Error率',            // Error rate
  'AppSync.CacheHit率',         // Cache hit rate
];
```

---

## Hands-on Examples

### 1. Create AppSync API with CDK

```typescript
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';

export class AppsyncStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const table = new dynamodb.Table(this, 'PostsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    // Create Lambda resolver function
    const resolverFunction = new lambda.Function(this, 'ResolverFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          if (event.info.fieldName === 'getPost') {
            // Return post data
            return { id: event.arguments.id, title: 'Sample Post' };
          }
        };
      `),
    });

    // Create GraphQL API
    const api = new appsync.GraphQLApi(this, 'MyAPI', {
      name: 'my-appsync-api',
      schema: appsync.SchemaFile.fromAsset('schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
    });

    // Add Lambda data source
    const lambdaDs = api.addLambdaDataSource('LambdaDataSource', resolverFunction);

    // Attach resolver
    lambdaDs.createResolver({
      typeName: 'Query',
      fieldName: 'getPost',
    });
  }
}
```

### 2. Schema File (schema.graphql)

```graphql
type Post {
  id: ID!
  title: String!
  content: String
  author: User!
  createdAt: AWSDateTime!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Query {
  getPost(id: ID!): Post
  listPosts(limit: Int, nextToken: String): PostConnection
  searchPosts(query: String!): [Post!]!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Post
}

type Subscription {
  onCreatePost: Post @aws_subscribe(mutations: ["createPost"])
  onUpdatePost(postId: ID!): Post @aws_subscribe(mutations: ["updatePost"])
}

input CreatePostInput {
  title: String!
  content: String
  authorId: ID!
}

input UpdatePostInput {
  title: String
  content: String
}

type PostConnection {
  items: [Post!]!
  nextToken: String
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}
```

### 3. Client Example (React)

```javascript
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';
import * as subscriptions from './graphql/subscriptions';

import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

const client = generateClient();

// Query
const getPost = async (id) => {
  const result = await client.graphql({
    query: queries.getPost,
    variables: { id },
  });
  return result.data.getPost;
};

// Mutation
const createPost = async (input) => {
  const result = await client.graphql({
    query: mutations.createPost,
    variables: { input },
  });
  return result.data.createPost;
};

// Subscription
const subscribeToComments = (postId) => {
  return client.graphql({
    query: subscriptions.onCreateComment,
    variables: { postId },
  }).subscribe({
    next: ({ data }) => {
      console.log('New comment:', data.onCreateComment);
    },
    error: (error) => console.error('Error:', error),
  });
};
```

---

## Liên kết

- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/)
- [AWS AppSync Developer Guide](https://docs.aws.amazon.com/appsync/latest/devguide/what-is-appsync.html)
- [AWS AppSync Pricing](https://aws.amazon.com/appsync/pricing/)
- [AWS AppSync Features](https://aws.amazon.com/appsync/product-details/)
- [AWS AppSync API Reference](https://docs.aws.amazon.com/appsync/latest/api-reference/)
- [Amplify Framework Documentation](https://docs.amplify.aws/)

---

## Key Takeaways

1. **AppSync = Serverless GraphQL** - Fully managed GraphQL service với real-time capabilities
2. **Flexible Data Sources** - Connect to DynamoDB, Lambda, RDS, HTTP, OpenSearch
3. **Real-time Built-in** - Subscriptions provide WebSocket-based real-time updates
4. **Offline Support** - Client SDKs cache data for offline use
5. **Strong Security** - Multiple auth options: API Key, IAM, Cognito, OIDC
6. **Caching** - Server-side caching improves performance, encrypted by default (2025+)
7. **Use AppSync when**: Mobile apps, complex data models, real-time features needed
8. **Use API Gateway when**: Simple REST APIs, legacy integrations, HTTP endpoints
