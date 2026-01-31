# AWS CLI (Command Line Interface)


## Mục lục

- [Tổng quan](#tổng-quan)
- [Cài đặt](#cài-đặt)
- [Cấu hình Credentials](#cấu-hình-credentials)
- [Thứ tự ưu tiên Credentials](#thứ-tự-ưu-tiên-credentials)
- [Cấu trúc lệnh](#cấu-trúc-lệnh)
- [Các lệnh thường dùng](#các-lệnh-thường-dùng)
- [Output Formats](#output-formats)
- [Query với --query (JMESPath)](#query-với-query-jmespath)
- [Các Tips hữu ích](#các-tips-hữu-ích)
- [AWS CloudShell](#aws-cloudshell)
- [Local vs EC2: Không cần config trên EC2](#local-vs-ec2-không-cần-config-trên-ec2)
- [Best Practices](#best-practices)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS CLI** là công cụ dòng lệnh để tương tác với AWS services.

```
┌─────────────────────────────────────────────────────────┐
│                    Cách truy cập AWS                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. AWS Console (Web UI)     - Dùng browser            │
│  2. AWS CLI (Command Line)   - Dùng terminal    ← này  │
│  3. AWS SDK (Code)           - Dùng trong app          │
│  4. AWS CloudShell           - CLI trong browser       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Khi nào dùng CLI?**
- Automation, scripting
- Nhanh hơn click trên Console
- CI/CD pipelines
- Quản lý nhiều resources cùng lúc

---

## Cài đặt

### Linux

```bash
# Download và cài đặt
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Kiểm tra
aws --version
# aws-cli/2.x.x Python/3.x.x Linux/x86_64
```

### macOS

```bash
# Download và cài đặt
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Hoặc dùng Homebrew
brew install awscli

# Kiểm tra
aws --version
```

### Windows

```powershell
# Download installer từ:
# https://awscli.amazonaws.com/AWSCLIV2.msi

# Hoặc dùng winget
winget install Amazon.AWSCLI

# Kiểm tra
aws --version
```

---

## Cấu hình Credentials

### Cách 1: `aws configure` (Đơn giản nhất)

```bash
aws configure

# Nhập thông tin:
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-southeast-1
Default output format [None]: json
```

**File được tạo:**

```
~/.aws/
├── credentials     # Access keys
└── config          # Region, output format
```

```ini
# ~/.aws/credentials
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# ~/.aws/config
[default]
region = ap-southeast-1
output = json
```

### Cách 2: Nhiều Profiles

Khi làm việc với nhiều AWS accounts:

```bash
# Tạo profile mới
aws configure --profile dev
aws configure --profile prod
```

```ini
# ~/.aws/credentials
[default]
aws_access_key_id = AKIA...DEFAULT

[dev]
aws_access_key_id = AKIA...DEV
aws_secret_access_key = ...

[prod]
aws_access_key_id = AKIA...PROD
aws_secret_access_key = ...
```

```bash
# Sử dụng profile
aws s3 ls --profile dev
aws s3 ls --profile prod

# Hoặc set environment variable
export AWS_PROFILE=dev
aws s3 ls  # Dùng profile dev
```

### Cách 3: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=ap-southeast-1

# Dùng cho CI/CD, Docker containers
```

### Cách 4: Assume Role trong Config

```ini
# ~/.aws/config
[profile dev]
region = ap-southeast-1

[profile prod]
role_arn = arn:aws:iam::123456789012:role/ProductionRole
source_profile = dev
region = ap-southeast-1

# CLI tự động assume role khi dùng profile prod
```

---

## Thứ tự ưu tiên Credentials

```
CLI tìm credentials theo thứ tự:

1. Command line options     --profile, --region
         │
         ▼
2. Environment variables    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
         │
         ▼
3. ~/.aws/credentials       [default] hoặc [profile]
         │
         ▼
4. ~/.aws/config            role_arn (assume role)
         │
         ▼
5. EC2 Instance Metadata    Role gắn vào EC2
         │
         ▼
6. ECS Task Role / Lambda Role
```

---

## Cấu trúc lệnh

```
aws <service> <command> [subcommand] [options]

Ví dụ:
aws   s3      ls                           # List buckets
aws   s3      cp      file.txt s3://bucket # Copy file
aws   ec2     describe-instances           # List EC2 instances
aws   iam     list-users                   # List IAM users
```

---

## Các lệnh thường dùng

### S3

```bash
# List buckets
aws s3 ls

# List objects trong bucket
aws s3 ls s3://my-bucket
aws s3 ls s3://my-bucket/folder/

# Copy file
aws s3 cp file.txt s3://my-bucket/
aws s3 cp s3://my-bucket/file.txt ./

# Sync folder
aws s3 sync ./local-folder s3://my-bucket/folder/
aws s3 sync s3://my-bucket/folder/ ./local-folder

# Delete
aws s3 rm s3://my-bucket/file.txt
aws s3 rm s3://my-bucket/folder/ --recursive

# Tạo bucket
aws s3 mb s3://my-new-bucket

# Xóa bucket (phải rỗng)
aws s3 rb s3://my-bucket
aws s3 rb s3://my-bucket --force  # Xóa cả objects
```

### EC2

```bash
# List instances
aws ec2 describe-instances

# Chỉ lấy thông tin cần thiết
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \
  --output table

# Start/Stop instance
aws ec2 start-instances --instance-ids i-1234567890abcdef0
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# Terminate instance
aws ec2 terminate-instances --instance-ids i-1234567890abcdef0
```

### IAM

```bash
# List users
aws iam list-users

# List roles
aws iam list-roles

# Xem policy của user
aws iam list-attached-user-policies --user-name john

# Xem ai đang dùng credentials này
aws sts get-caller-identity
```

### Lambda

```bash
# List functions
aws lambda list-functions

# Invoke function
aws lambda invoke \
  --function-name my-function \
  --payload '{"key": "value"}' \
  response.json

# View logs
aws logs tail /aws/lambda/my-function --follow
```

---

## Output Formats

```bash
# JSON (default)
aws iam list-users --output json

# Table (dễ đọc)
aws iam list-users --output table

# Text (dễ parse với grep, awk)
aws iam list-users --output text

# YAML
aws iam list-users --output yaml
```

---

## Query với --query (JMESPath)

Lọc output với JMESPath syntax:

```bash
# Lấy tất cả UserName
aws iam list-users --query 'Users[*].UserName'

# Lấy user đầu tiên
aws iam list-users --query 'Users[0]'

# Lấy nhiều fields
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name]'

# Filter với điều kiện
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[?State.Name==`running`].InstanceId'
```

---

## Các Tips hữu ích

### 1. Auto-complete

```bash
# Bash
complete -C '/usr/local/bin/aws_completer' aws

# Zsh - thêm vào ~/.zshrc
autoload bashcompinit && bashcompinit
complete -C '/usr/local/bin/aws_completer' aws
```

### 2. Dry-run (test trước khi chạy)

```bash
# Kiểm tra xem command có chạy được không (không thực sự chạy)
aws ec2 run-instances --dry-run --image-id ami-12345 --instance-type t2.micro
```

### 3. Wait (đợi resource sẵn sàng)

```bash
# Đợi instance running
aws ec2 wait instance-running --instance-ids i-1234567890abcdef0

# Đợi instance terminated
aws ec2 wait instance-terminated --instance-ids i-1234567890abcdef0
```

### 4. Pagination

```bash
# Mặc định CLI tự paginate, nhưng có thể control
aws s3api list-objects-v2 --bucket my-bucket --max-items 100

# Lấy tất cả (cẩn thận với buckets lớn)
aws s3api list-objects-v2 --bucket my-bucket --no-paginate
```

### 5. Debug

```bash
# Xem request/response chi tiết
aws s3 ls --debug
```

---

## AWS CloudShell

CLI chạy ngay trong browser, không cần cài đặt:

```
┌─────────────────────────────────────────────────────────┐
│  AWS Console → Click icon CloudShell (góc trên phải)   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ Đã cài sẵn AWS CLI                                 │
│  ✅ Đã authenticate với user đang login Console        │
│  ✅ Có 1GB storage persistent                          │
│  ✅ Miễn phí                                           │
│                                                         │
│  Hạn chế:                                              │
│  - Timeout sau 20 phút idle                            │
│  - Không có ở tất cả regions                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Local vs EC2: Không cần config trên EC2

```
LOCAL:                            EC2 với Role:
──────                            ─────────────
aws configure                     Không cần configure!
  ↓                                    ↓
~/.aws/credentials                CLI tự dùng Instance Role
  ↓                                    ↓
aws s3 ls                         aws s3 ls  ← Just works
```

Xem thêm: [IAM - Local vs EC2](iam.md#local-vs-ec2-credentials-khác-nhau-code-giống-nhau)

---

## Best Practices

### 1. Dùng Profiles cho nhiều accounts
```bash
aws s3 ls --profile prod   # Rõ ràng đang dùng account nào
```

### 2. Không commit credentials
```bash
# .gitignore
.aws/
*.pem
```

### 3. Rotate Access Keys định kỳ
```bash
# Tạo key mới
aws iam create-access-key --user-name my-user

# Xóa key cũ
aws iam delete-access-key --user-name my-user --access-key-id AKIA...OLD
```

### 4. Dùng Role trên EC2/Lambda thay vì Access Keys
```bash
# Trên EC2 với Role, không cần config
aws s3 ls  # Tự động dùng Instance Role
```

### 5. Kiểm tra identity trước khi chạy lệnh quan trọng
```bash
aws sts get-caller-identity
# Đảm bảo đúng account trước khi delete/modify
```

---

## Tài liệu tham khảo

- [AWS CLI User Guide](https://docs.aws.amazon.com/cli/latest/userguide/)
- [AWS CLI Command Reference](https://docs.aws.amazon.com/cli/latest/reference/)
- [Installing AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
