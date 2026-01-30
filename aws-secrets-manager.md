# AWS Secrets Manager

## Tổng quan

**AWS Secrets Manager** là dịch vụ giúp bạn quản lý, truy xuất và **rotate** (thay đổi định kỳ) các secrets như:

- Database credentials (username/password)
- API keys
- OAuth tokens
- Application credentials
- Các loại secrets khác

> [!TIP]
> Thay vì hard-code credentials trong source code, bạn gọi Secrets Manager API lúc runtime để lấy credentials. Điều này tăng security vì credentials không bị lộ trong code.

---

## Tại sao cần Secrets Manager?

### Vấn đề với Hard-coded Credentials

```
┌─────────────────────────────────────────────────────────────────┐
│                 ❌ Traditional Approach                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  application.properties:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  db.username=admin                                       │   │
│  │  db.password=MySecretPassword123!    ← Lộ trong Git!    │   │
│  │  api.key=sk-abc123xyz789             ← Ai cũng thấy!    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Rủi ro:                                                        │
│  • Credentials commit vào Git → lộ lịch sử                     │
│  • Ai có access code đều thấy credentials                       │
│  • Khó rotate credentials (phải redeploy app)                   │
│  • Không có audit trail                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Giải pháp với Secrets Manager

```
┌─────────────────────────────────────────────────────────────────┐
│                  ✅ Secrets Manager Approach                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  application.properties:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  # Không có credentials trong code!                      │   │
│  │  secret.name=prod/myapp/database                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Runtime:                                                       │
│  ┌──────────────┐      ┌─────────────────┐      ┌──────────┐  │
│  │     App      │ ───► │ Secrets Manager │ ───► │ Database │  │
│  │              │ API  │  (get secret)   │      │          │  │
│  └──────────────┘      └─────────────────┘      └──────────┘  │
│                                                                 │
│  Lợi ích:                                                       │
│  • Không có credentials trong source code                       │
│  • Centralized secret management                                │
│  • Automatic rotation                                           │
│  • Fine-grained access control (IAM)                            │
│  • Audit trail với CloudTrail                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Kiến trúc và Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 Secrets Manager Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Application                           │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │  1. App gọi GetSecretValue API                     │  │   │
│  │  │  2. Secrets Manager trả về credentials             │  │   │
│  │  │  3. App dùng credentials để connect DB             │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                        │                                        │
│                        │ IAM Role/Policy                        │
│                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              AWS Secrets Manager                         │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │  Secret: prod/myapp/database                       │  │   │
│  │  │  ─────────────────────────────────────────────────│  │   │
│  │  │  {                                                 │  │   │
│  │  │    "username": "admin",                            │  │   │
│  │  │    "password": "auto-rotated-password-xyz",        │  │   │
│  │  │    "host": "mydb.xxxxx.rds.amazonaws.com",         │  │   │
│  │  │    "port": 5432                                    │  │   │
│  │  │  }                                                 │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Encryption: AWS KMS (aws/secretsmanager hoặc custom)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                        │                                        │
│                        │ Automatic Rotation                     │
│                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Database (RDS)                        │   │
│  │  Password được update tự động khi rotation               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Secret Structure

### Secret Components

| Component | Mô tả |
|-----------|-------|
| **Secret Name** | Unique identifier (e.g., `prod/myapp/database`) |
| **Secret Value** | Actual secret data (JSON, plaintext) |
| **Version ID** | UUID cho mỗi version |
| **Version Stages** | Labels: `AWSCURRENT`, `AWSPREVIOUS`, `AWSPENDING` |
| **Metadata** | Description, tags, rotation config |
| **Encryption** | KMS key để encrypt secret |

### Secret Versioning

```
┌─────────────────────────────────────────────────────────────────┐
│                     Secret Version Stages                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Secret: prod/myapp/database                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Version: abc-123-xyz                                    │   │
│  │  Stage: AWSCURRENT  ← Active version (app dùng cái này) │   │
│  │  Value: {"password": "NewPassword456"}                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Version: def-456-uvw                                    │   │
│  │  Stage: AWSPREVIOUS  ← Previous version (backup)        │   │
│  │  Value: {"password": "OldPassword123"}                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Khi rotation:                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Version: ghi-789-rst                                    │   │
│  │  Stage: AWSPENDING  ← Đang trong quá trình rotation     │   │
│  │  Value: {"password": "PendingPassword789"}               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Automatic Rotation

### Rotation Types

| Type | Mô tả | Lambda? |
|------|-------|---------|
| **Managed Rotation** | AWS quản lý hoàn toàn (RDS, Redshift, DocumentDB) | ❌ Không cần |
| **Managed External** | Cho secrets với AWS partners | ❌ Không cần |
| **Lambda Rotation** | Custom rotation logic | ✅ Cần Lambda |

### Managed Rotation (RDS)

```
┌─────────────────────────────────────────────────────────────────┐
│                   Managed Rotation Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Schedule Trigger (mỗi 30 ngày)                              │
│     │                                                           │
│     ▼                                                           │
│  2. Secrets Manager tạo AWSPENDING version                      │
│     │                                                           │
│     ▼                                                           │
│  3. Secrets Manager update password trong RDS                   │
│     │                                                           │
│     ▼                                                           │
│  4. Test new credentials                                        │
│     │                                                           │
│     ▼                                                           │
│  5. Move AWSPENDING → AWSCURRENT                                │
│     Move old AWSCURRENT → AWSPREVIOUS                           │
│     │                                                           │
│     ▼                                                           │
│  6. Done! App tự động lấy new password                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Supported:                                                │ │
│  │  • Amazon RDS (MySQL, PostgreSQL, Oracle, SQL Server,     │ │
│  │    MariaDB, Aurora)                                        │ │
│  │  • Amazon Redshift                                         │ │
│  │  • Amazon DocumentDB                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lambda Rotation (Custom)

```
┌─────────────────────────────────────────────────────────────────┐
│                   Lambda Rotation Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Secrets   │     │   Lambda    │     │   Target    │       │
│  │   Manager   │────►│  Function   │────►│   System    │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                 │
│  Lambda Function thực hiện 4 steps:                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 1: createSecret                                    │   │
│  │  • Tạo new password                                      │   │
│  │  • Lưu vào AWSPENDING version                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 2: setSecret                                       │   │
│  │  • Update password trong target system                   │   │
│  │  • Ví dụ: ALTER USER ... PASSWORD = '...'               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 3: testSecret                                      │   │
│  │  • Test connection với new credentials                   │   │
│  │  • Rollback nếu fail                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 4: finishSecret                                    │   │
│  │  • Move AWSPENDING → AWSCURRENT                          │   │
│  │  • Rotation complete                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rotation Strategies

| Strategy | Mô tả | Use Case |
|----------|-------|----------|
| **Single User** | Rotate password của 1 user | Simple apps |
| **Alternating Users** | 2 users, rotate xen kẽ | Zero-downtime apps |

#### Alternating Users Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│               Alternating Users Rotation                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Database có 2 users:                                           │
│  • app_user_1 (clone của original user)                         │
│  • app_user_2 (clone của original user)                         │
│                                                                 │
│  Rotation 1:                                                    │
│  ┌───────────────┐     ┌───────────────┐                       │
│  │  app_user_1   │     │  app_user_2   │                       │
│  │  (CURRENT)    │     │  (được rotate)│                       │
│  │  password: A  │     │  password: B  │                       │
│  └───────────────┘     └───────────────┘                       │
│         │                                                       │
│         ▼                                                       │
│  App vẫn dùng user_1 trong khi user_2 đang rotate              │
│                                                                 │
│  Rotation 2:                                                    │
│  ┌───────────────┐     ┌───────────────┐                       │
│  │  app_user_1   │     │  app_user_2   │                       │
│  │  (được rotate)│     │  (CURRENT)    │                       │
│  │  password: C  │     │  password: B  │                       │
│  └───────────────┘     └───────────────┘                       │
│                               │                                 │
│                               ▼                                 │
│  App switch sang user_2, user_1 đang rotate                    │
│                                                                 │
│  → Zero downtime vì luôn có 1 user available!                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Secrets Manager vs SSM Parameter Store

| Feature | Secrets Manager | SSM Parameter Store |
|---------|-----------------|---------------------|
| **Purpose** | Secrets với rotation | Config values, secrets |
| **Rotation** | ✅ Built-in automatic | ❌ Manual |
| **Cost** | $0.40/secret/month | Free (Standard), $0.05/10K (Advanced) |
| **Size limit** | 64 KB | 4 KB (Standard), 8 KB (Advanced) |
| **Cross-account** | ✅ Resource-based policy | ❌ Khó hơn |
| **KMS** | ✅ Bắt buộc | Optional |
| **Versioning** | ✅ Built-in | ❌ Limited |
| **CloudFormation** | ✅ Dynamic references | ✅ Dynamic references |

### Khi nào dùng gì?

```
┌─────────────────────────────────────────────────────────────────┐
│                     Decision Guide                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dùng Secrets Manager khi:                                      │
│  ✅ Cần automatic rotation                                      │
│  ✅ Database credentials (RDS, Redshift, DocumentDB)            │
│  ✅ API keys cần rotate định kỳ                                 │
│  ✅ Cross-account sharing                                       │
│  ✅ Strict compliance requirements                              │
│                                                                 │
│  Dùng Parameter Store khi:                                      │
│  ✅ Configuration values (không phải secrets)                   │
│  ✅ Feature flags                                               │
│  ✅ Budget constraint (free tier)                               │
│  ✅ Hierarchical organization (/app/prod/db/host)              │
│  ✅ Không cần rotation                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## IAM Database Authentication (Alternative)

> [!NOTE]
> Ngoài Secrets Manager, bạn có thể dùng **IAM Database Authentication** để kết nối RDS **mà không cần password**. Đây là phương pháp thay thế, không cần Secrets Manager.

### So sánh 2 cách kết nối RDS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           Cách 1: Secrets Manager (Username/Password)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  App ──► Secrets Manager ──► Get credentials ──► Connect RDS với password  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│           Cách 2: IAM Database Authentication (Không password!)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  App ──► IAM Role ──► Generate Auth Token ──► Connect RDS với token        │
│                                                                             │
│  ✅ Không cần Secrets Manager!                                              │
│  ✅ Không cần lưu password!                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### IAM DB Auth hoạt động như thế nào?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    IAM Database Authentication Flow                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   App       │                                                            │
│  │ (EC2/ECS)   │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │ 1. App có IAM Role với policy:                                    │
│         │    rds-db:connect                                                 │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                        AWS SDK/CLI                               │       │
│  │  generate-db-auth-token                                          │       │
│  │  → Tạo authentication token (có chữ ký AWS Signature V4)        │       │
│  │  → Token valid trong 15 phút                                     │       │
│  └──────────────────────────────┬──────────────────────────────────┘       │
│                                 │                                           │
│                                 │ 2. Token thay vì password                 │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                     Amazon RDS                                   │       │
│  │  • Nhận token                                                    │       │
│  │  • Verify chữ ký với IAM                                         │       │
│  │  • Cho phép connection nếu valid                                 │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### So sánh chi tiết

| | Secrets Manager | IAM DB Auth |
|--|-----------------|-------------|
| **Password** | Cần lưu & rotate | ❌ Không cần |
| **Token lifetime** | Không giới hạn | **15 phút** (phải refresh) |
| **Connections/giây** | Không giới hạn | **Max 200/giây** ⚠️ |
| **Supported DB** | Tất cả | MySQL, PostgreSQL, MariaDB |
| **SSL/TLS** | Optional | **Bắt buộc** |
| **Memory overhead** | Không | 300-1000 MiB trên DB instance |
| **Complexity** | Đơn giản hơn | Cần handle token refresh |
| **RDS Outposts** | ✅ Hỗ trợ | ❌ Không hỗ trợ |

> [!WARNING]
> **Hạn chế quan trọng của IAM DB Auth:**
> - Maximum **200 new IAM DB authentication connections per second** per DB instance
> - Nếu vượt quá limit, connection sẽ bị throttled
> - Cần thêm **300-1000 MiB memory** trên database instance
> 
> Xem thêm: [IAM database authentication - AWS Official Docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)

### Khi nào dùng gì?

| Use Case | Recommendation |
|----------|---------------|
| **High traffic app** (>200 conn/s) | ✅ Secrets Manager |
| **Lambda functions** (ít connections) | ✅ IAM DB Auth |
| **Oracle, SQL Server** | ✅ Secrets Manager (IAM Auth không hỗ trợ) |
| **Zero password management** | ✅ IAM DB Auth |
| **Microservices nhiều instances** | ✅ Secrets Manager + Connection Pool |
| **RDS on Outposts** | ✅ Secrets Manager |

### Code Example: Spring Boot với IAM DB Auth

```java
// pom.xml - Dependencies
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>rds</artifactId>
</dependency>

// RdsIamAuthConfig.java
@Configuration
public class RdsIamAuthConfig {
    
    private final String hostname = "mydb.xxxxx.rds.amazonaws.com";
    private final int port = 5432;
    private final String username = "iam_db_user";
    private final Region region = Region.AP_SOUTHEAST_1;
    
    @Bean
    public DataSource dataSource() {
        // Generate authentication token (valid 15 minutes)
        RdsUtilities rdsUtilities = RdsUtilities.builder()
            .region(region)
            .build();
        
        String authToken = rdsUtilities.generateAuthenticationToken(
            GenerateAuthenticationTokenRequest.builder()
                .hostname(hostname)
                .port(port)
                .username(username)
                .build()
        );
        
        // Use token as password
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://" + hostname + ":" + port + "/mydb");
        config.setUsername(username);
        config.setPassword(authToken);
        
        // Enable SSL (required for IAM auth)
        config.addDataSourceProperty("ssl", "true");
        config.addDataSourceProperty("sslmode", "require");
        
        return new HikariDataSource(config);
    }
}
```

### IAM Policy cho IAM DB Auth

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rds-db:connect"
            ],
            "Resource": [
                "arn:aws:rds-db:ap-southeast-1:123456789012:dbuser:db-ABCDEFGHIJKLMNOP/iam_db_user"
            ]
        }
    ]
}
```

### Setup database user cho IAM Auth

```sql
-- PostgreSQL: Tạo user và grant IAM role
CREATE USER iam_db_user WITH LOGIN;
GRANT rds_iam TO iam_db_user;

-- MySQL: Tạo user với AWSAuthenticationPlugin
CREATE USER 'iam_db_user'@'%' IDENTIFIED WITH AWSAuthenticationPlugin AS 'RDS';
GRANT ALL PRIVILEGES ON mydb.* TO 'iam_db_user'@'%';
```

### Giải pháp cho connection limit: RDS Proxy

Nếu app có nhiều connections nhưng vẫn muốn dùng IAM Auth:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RDS Proxy + IAM Auth                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Lambda    │     │   RDS       │     │    RDS      │                   │
│  │   (many     │────►│   Proxy     │────►│  Database   │                   │
│  │   instances)│     │             │     │             │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                             │
│  • App dùng IAM Auth để connect tới RDS Proxy                              │
│  • RDS Proxy pool connections tới RDS                                       │
│  • Giảm connection overhead trên database                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Access Control

### IAM Policy Example

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:prod/myapp/*"
        }
    ]
}
```

### Resource-based Policy (Cross-account)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::987654321098:root"
            },
            "Action": "secretsmanager:GetSecretValue",
            "Resource": "*"
        }
    ]
}
```

---

## Code Examples

### Python (boto3)

```python
import boto3
import json
from botocore.exceptions import ClientError

def get_secret(secret_name, region_name="ap-southeast-1"):
    """
    Retrieve secret from AWS Secrets Manager
    """
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        response = client.get_secret_value(SecretId=secret_name)
        
        # Parse secret value
        if 'SecretString' in response:
            secret = json.loads(response['SecretString'])
            return secret
        else:
            # Binary secret
            return response['SecretBinary']
            
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Secret {secret_name} not found")
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            print("Invalid request")
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            print("Invalid parameter")
        raise e

# Usage
secret = get_secret("prod/myapp/database")
db_host = secret['host']
db_user = secret['username']
db_password = secret['password']
```

### Node.js

```javascript
const { 
    SecretsManagerClient, 
    GetSecretValueCommand 
} = require("@aws-sdk/client-secrets-manager");

async function getSecret(secretName) {
    const client = new SecretsManagerClient({ 
        region: "ap-southeast-1" 
    });
    
    try {
        const command = new GetSecretValueCommand({
            SecretId: secretName,
        });
        
        const response = await client.send(command);
        
        if (response.SecretString) {
            return JSON.parse(response.SecretString);
        }
        return response.SecretBinary;
        
    } catch (error) {
        console.error("Error retrieving secret:", error);
        throw error;
    }
}

// Usage
(async () => {
    const secret = await getSecret("prod/myapp/database");
    console.log("Host:", secret.host);
    console.log("Username:", secret.username);
})();
```

### Java (Spring Boot)

```java
// application.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/mydb
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

// SecretsConfig.java
@Configuration
public class SecretsConfig {
    
    @Bean
    public DatabaseCredentials databaseCredentials(
            SecretsManagerClient secretsManager) {
        
        GetSecretValueRequest request = GetSecretValueRequest.builder()
                .secretId("prod/myapp/database")
                .build();
        
        GetSecretValueResponse response = 
            secretsManager.getSecretValue(request);
        
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(
            response.secretString(), 
            DatabaseCredentials.class
        );
    }
}
```

### AWS CLI

```bash
# Create a secret
aws secretsmanager create-secret \
    --name prod/myapp/database \
    --description "Database credentials for production" \
    --secret-string '{"username":"admin","password":"MyPassword123"}'

# Get secret value
aws secretsmanager get-secret-value \
    --secret-id prod/myapp/database \
    --query 'SecretString' \
    --output text

# Update secret
aws secretsmanager put-secret-value \
    --secret-id prod/myapp/database \
    --secret-string '{"username":"admin","password":"NewPassword456"}'

# Enable rotation
aws secretsmanager rotate-secret \
    --secret-id prod/myapp/database \
    --rotation-lambda-arn arn:aws:lambda:region:account:function:rotation-function \
    --rotation-rules AutomaticallyAfterDays=30

# Delete secret (with recovery window)
aws secretsmanager delete-secret \
    --secret-id prod/myapp/database \
    --recovery-window-in-days 7
```

---

## CloudFormation Integration

### Dynamic Reference

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MyRDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBName: mydb
      Engine: mysql
      MasterUsername: '{{resolve:secretsmanager:prod/myapp/database:SecretString:username}}'
      MasterUserPassword: '{{resolve:secretsmanager:prod/myapp/database:SecretString:password}}'
      
  MyLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Environment:
        Variables:
          DB_SECRET_ARN: !Ref MyDatabaseSecret
```

### Create Secret in CloudFormation

```yaml
Resources:
  MyDatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: prod/myapp/database
      Description: "RDS database credentials"
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: "password"
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        
  MySecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref MyDatabaseSecret
      RotationLambdaARN: !GetAtt RotationLambda.Arn
      RotationRules:
        AutomaticallyAfterDays: 30
```

---

## Monitoring và Logging

### CloudWatch Metrics

| Metric | Mô tả |
|--------|-------|
| `GetSecretValue` | Số lần gọi GetSecretValue |
| `PutSecretValue` | Số lần update secret |
| `RotationSuccessful` | Rotation thành công |
| `RotationFailed` | Rotation thất bại |

### CloudTrail Events

```json
{
    "eventName": "GetSecretValue",
    "eventSource": "secretsmanager.amazonaws.com",
    "userIdentity": {
        "arn": "arn:aws:iam::123456789012:role/MyAppRole"
    },
    "requestParameters": {
        "secretId": "prod/myapp/database"
    },
    "responseElements": null,
    "eventTime": "2024-01-15T10:30:00Z"
}
```

### EventBridge Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                  EventBridge Integration                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Secrets Manager Events:                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Secret Rotation Succeeded                             │   │
│  │  • Secret Rotation Failed                                │   │
│  │  • Secret Deleted                                        │   │
│  │  • Secret Restored                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    EventBridge Rule                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │    SNS      │     │   Lambda    │     │ Step Funcs  │       │
│  │ (alert ops) │     │ (remediate) │     │ (workflow)  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pricing

```
┌─────────────────────────────────────────────────────────────────┐
│                   Secrets Manager Pricing                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Per Secret:                                                    │
│  • $0.40 per secret per month                                   │
│  • Pro-rated per day                                            │
│                                                                 │
│  API Calls:                                                     │
│  • $0.05 per 10,000 API calls                                   │
│                                                                 │
│  Rotation:                                                      │
│  • Managed Rotation: FREE (chỉ trả Lambda nếu có)              │
│  • Lambda Rotation: Lambda invocation cost                      │
│                                                                 │
│  Encryption:                                                    │
│  • AWS managed key (aws/secretsmanager): FREE                   │
│  • Customer managed key (CMK): KMS pricing                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Example: 50 secrets, 1M API calls/month                        │
│  • Secrets: 50 × $0.40 = $20                                    │
│  • API calls: 1,000,000 / 10,000 × $0.05 = $5                   │
│  • Total: ~$25/month                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### Security

| Practice | Mô tả |
|----------|-------|
| **Least privilege** | Chỉ grant GetSecretValue cho resources cần |
| **Use IAM roles** | Không hard-code AWS credentials |
| **Enable rotation** | Rotate secrets định kỳ (30-90 ngày) |
| **Use CMK** | Customer managed key cho sensitive secrets |
| **Resource policies** | Control cross-account access |

### Development

| Practice | Mô tả |
|----------|-------|
| **Naming convention** | `{env}/{app}/{type}` (e.g., `prod/myapp/database`) |
| **Cache secrets** | Cache trong memory, không gọi API mỗi request |
| **Handle rotation** | App phải handle credential refresh |
| **Use SDK** | AWS SDK có caching và retry built-in |

### Operations

| Practice | Mô tả |
|----------|-------|
| **Monitor rotation** | Set up alerts cho rotation failures |
| **Audit access** | Review CloudTrail logs định kỳ |
| **Tag secrets** | Tags cho cost allocation và organization |
| **Recovery window** | Đặt recovery window phù hợp trước khi delete |

---

## AWS Services Integration

```
┌─────────────────────────────────────────────────────────────────┐
│            Secrets Manager Integrations                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Native Integration (Managed Rotation):                         │
│  • Amazon RDS                                                   │
│  • Amazon Redshift                                              │
│  • Amazon DocumentDB                                            │
│  • Amazon ElastiCache                                           │
│                                                                 │
│  Client-side Integration (SDK):                                 │
│  • AWS Lambda                                                   │
│  • Amazon ECS/EKS                                               │
│  • Amazon EC2                                                   │
│  • AWS Batch                                                    │
│  • AWS Glue                                                     │
│                                                                 │
│  IaC Integration:                                               │
│  • AWS CloudFormation (Dynamic References)                      │
│  • AWS CDK                                                      │
│  • Terraform                                                    │
│                                                                 │
│  Monitoring:                                                    │
│  • AWS CloudTrail (audit)                                       │
│  • Amazon CloudWatch (metrics, logs)                            │
│  • Amazon EventBridge (events)                                  │
│  • AWS Config (compliance)                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tổng kết

| Feature | Mô tả |
|---------|-------|
| **Centralized Storage** | Lưu trữ secrets an toàn, encrypted |
| **Automatic Rotation** | Rotate credentials tự động |
| **Fine-grained Access** | IAM + Resource policies |
| **Audit Trail** | CloudTrail logging |
| **Integration** | Native với RDS, Lambda, ECS, etc. |
| **Cross-account** | Resource-based policies |

> [!IMPORTANT]
> AWS Secrets Manager là lựa chọn tốt nhất khi:
> - Cần **automatic rotation** cho database credentials
> - Compliance yêu cầu **audit trail** cho secret access
> - Cần **cross-account sharing** secrets
> - Làm việc với **RDS, Redshift, DocumentDB**

> [!TIP]
> Nếu chỉ cần lưu configuration values hoặc secrets đơn giản không cần rotation, hãy cân nhắc **SSM Parameter Store** (miễn phí cho Standard tier).
