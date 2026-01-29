# S3 Transfer Acceleration

## Tổng quan

**S3 Transfer Acceleration** là tính năng giúp tăng tốc việc **upload/download** files từ/đến S3 bucket qua **long distances** (khoảng cách xa) bằng cách sử dụng mạng **AWS Edge Locations** của CloudFront.

```
WITHOUT Transfer Acceleration:
┌─────────────┐                                           ┌─────────────┐
│   User      │ ────── Public Internet (slow) ──────────► │  S3 Bucket  │
│  (Vietnam)  │              ~200ms RTT                   │  (us-east-1)│
└─────────────┘                                           └─────────────┘

WITH Transfer Acceleration:
┌─────────────┐     ┌─────────────┐                       ┌─────────────┐
│   User      │ ──► │ Edge Location│ ══ AWS Backbone ═══► │  S3 Bucket  │
│  (Vietnam)  │     │  (Singapore) │    (optimized)       │  (us-east-1)│
└─────────────┘     └─────────────┘                       └─────────────┘
     ~20ms              Fast private network
```

---

## Cách hoạt động

1. **Bật Transfer Acceleration** trên bucket
2. S3 cung cấp endpoint riêng: `bucket-name.s3-accelerate.amazonaws.com`
3. Client upload/download qua endpoint này
4. Data đi tới **Edge Location gần nhất** (200+ locations globally)
5. Từ Edge → S3 bucket qua **AWS private backbone** (optimized, low-latency)

### Tại sao nhanh hơn?

| Yếu tố | Public Internet | AWS Backbone |
|--------|-----------------|--------------|
| **Routing** | Qua nhiều ISPs, không tối ưu | AWS tự control, tối ưu path |
| **Congestion** | Có thể bị nghẽn giờ cao điểm | Private, ít congestion |
| **Packet loss** | Cao hơn khi long distance | Thấp hơn nhiều |
| **TCP optimization** | Không | AWS optimize TCP windows |

### Flow chi tiết

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TRANSFER ACCELERATION FLOW                       │
└────────────────────────────────────────────────────────────────────────┘

  Client (Vietnam)                Edge Location              S3 Bucket
       │                          (Singapore)               (us-east-1)
       │                               │                         │
       │  1. DNS lookup                │                         │
       │     bucket.s3-accelerate...   │                         │
       │  ─────────────────────────►   │                         │
       │                               │                         │
       │  2. Resolve to nearest Edge   │                         │
       │  ◄─────────────────────────   │                         │
       │                               │                         │
       │  3. HTTPS upload              │                         │
       │  ════════════════════════►    │                         │
       │     (short distance, fast)    │                         │
       │                               │                         │
       │                               │  4. Forward via         │
       │                               │     AWS backbone        │
       │                               │  ═══════════════════►   │
       │                               │     (optimized path)    │
       │                               │                         │
       │                               │  5. ACK                 │
       │                               │  ◄═══════════════════   │
       │                               │                         │
       │  6. Success response          │                         │
       │  ◄════════════════════════    │                         │
       │                               │                         │
```

---

## Khi nào dùng Transfer Acceleration?

### ✅ NÊN dùng

| Scenario | Lý do |
|----------|-------|
| **Client xa bucket** | User ở Vietnam upload lên S3 us-east-1 |
| **File lớn (GB+)** | Càng lớn càng thấy sự khác biệt |
| **Mobile/đường truyền kém** | Transfer Acceleration + Multipart = ổn định hơn |
| **Upload liên tục** | Backup từ nhiều locations, media upload |
| **Throughput quan trọng** | Thời gian = tiền (video processing pipeline) |

### ❌ KHÔNG hiệu quả khi

| Scenario | Lý do |
|----------|-------|
| **Client cùng Region** | Không có Edge nào gần hơn S3 bucket |
| **File nhỏ (< vài MB)** | Overhead không đáng |
| **Bandwidth đủ nhanh** | Bottleneck ở client side, không phải network |
| **Download nhiều hơn upload** | Dùng CloudFront thay vì |

---

## Download với Transfer Acceleration

> **Câu hỏi thường gặp:** Transfer Acceleration có dùng được cho download không? Có nhanh hơn không? Có mất phí không?

### ✅ CÓ dùng được cho Download

Transfer Acceleration hoạt động cho **cả Upload VÀ Download**:

```
DOWNLOAD với Transfer Acceleration:
┌──────────┐     ┌───────────┐                    ┌──────────┐
│  Client  │ ◄── │   Edge    │ ◄══ AWS Backbone ══│ S3 Bucket│
│ (Vietnam)│     │(Singapore)│     (optimized)    │(us-east-1)│
└──────────┘     └───────────┘                    └──────────┘
```

### ⚡ Có nhanh hơn không?

| Scenario | Kết quả |
|----------|--------|
| Client **xa** bucket (VD: Vietnam → us-east-1) | ✅ **Có thể nhanh hơn 50-300%** |
| Client **gần** bucket (VD: Singapore → ap-southeast-1) | ❌ Không cải thiện |
| Download content **lặp lại nhiều lần** | ⚠️ CloudFront tốt hơn (có cache) |

### 💰 Có mất phí không?

**CÓ, mất phí cho CẢ Download:**

| Direction | Acceleration Fee |
|-----------|------------------|
| **Upload** (Data IN via Acceleration) | $0.04 - $0.08/GB |
| **Download** (Data OUT via Acceleration) | $0.04 - $0.08/GB |

> ⚠️ **Lưu ý:** Phí acceleration **CỘNG THÊM** vào standard S3 Data Transfer OUT fee!

### 🤔 Download: Transfer Acceleration vs CloudFront

```
TRANSFER ACCELERATION (download):
Client ◄── Edge ◄── Backbone ◄── S3
                                 ▲
                         MỖI request đều fetch từ S3
                         → Phí mỗi lần download

CLOUDFRONT (download):
Client ◄── Edge (CACHE HIT) ◄─┘
                              │
                      Trả về từ cache
                      → Không cần đến S3!
```

| So sánh | Transfer Acceleration | CloudFront |
|---------|----------------------|------------|
| **Caching** | ❌ Không cache | ✅ Cache tại Edge |
| **Download 1000 lần cùng file** | Trả phí **1000 lần** | Trả phí **1 lần** fetch + edge costs |
| **Unique files** | ✅ Phù hợp | ⚠️ Overkill |
| **Static assets** | ❌ Không nên | ✅ Tốt nhất |

### ✅ Khi nào dùng Transfer Acceleration cho Download

```
✅ NÊN dùng:
- Download file UNIQUE (không lặp lại)
  VD: User download backup riêng của họ
- File thay đổi liên tục (cache không hiệu quả)
- Download 1 lần duy nhất, cần nhanh

❌ KHÔNG NÊN dùng:
- Download cùng file nhiều lần → CloudFront
- Static assets (images, CSS, JS) → CloudFront  
- Public content được nhiều users access → CloudFront
```

### Ví dụ: Download Backup File

```javascript
// Download file backup riêng của user qua Transfer Acceleration
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const client = new S3Client({ 
  region: "us-east-1",
  useAccelerateEndpoint: true  // 👈 Enable acceleration cho download
});

const command = new GetObjectCommand({
  Bucket: "my-bucket",
  Key: `backups/${userId}/backup-2024.zip`
});

const downloadUrl = await getSignedUrl(client, command, { 
  expiresIn: 3600 
});
// User ở Vietnam download nhanh hơn 50-300%
```

---

## Pricing

### Cách tính phí

- **Chỉ charge khi THỰC SỰ nhanh hơn** - nếu không cải thiện, AWS bypass và không charge
- **~$0.04-0.08/GB** (tuỳ regions) - **CỘNG THÊM** vào standard S3 fees

### Bảng giá theo Region và Direction

| Direction | Destination | Price per GB (USD) |
|-----------|-------------|-------------------|
| **Upload** (Data IN) | United States, Europe, Japan | $0.04 |
| **Upload** (Data IN) | All other AWS Regions | $0.08 |
| **Download** (Data OUT) | United States, Europe, Japan | $0.04 |
| **Download** (Data OUT) | All other AWS Regions | $0.08 |

> **Lưu ý:** Download còn phải trả thêm **standard S3 Data Transfer OUT fee** (~$0.09/GB).

### Ví dụ tính chi phí

**Upload 100 GB:**
```
Scenario: Upload 100 GB từ Vietnam → S3 us-east-1

┌─────────────────────────────────────────────────┐
│  Standard S3 upload fee:     $0.00              │
│  Transfer Acceleration fee:  $0.04 × 100 = $4   │
│  ───────────────────────────────────            │
│  TOTAL: $4.00                                   │
│                                                 │
│  Benefit: 50-500% faster upload speed           │
└─────────────────────────────────────────────────┘
```

**Download 100 GB:**
```
Scenario: Download 100 GB từ S3 us-east-1 → Vietnam

┌─────────────────────────────────────────────────┐
│  Standard S3 Data Transfer OUT: $0.09 × 100 = $9│
│  Transfer Acceleration fee:     $0.04 × 100 = $4│
│  ───────────────────────────────────            │
│  TOTAL: $13.00                                  │
│                                                 │
│  So sánh: CloudFront có thể rẻ hơn nếu content  │
│  được cache và download nhiều lần!              │
└─────────────────────────────────────────────────┘
```

---

## So sánh với CloudFront

| Feature | Transfer Acceleration | CloudFront |
|---------|----------------------|------------|
| **Mục đích chính** | **Upload** TO S3 | **Download** FROM S3 |
| **Caching** | ❌ Không cache | ✅ Cache ở 400+ Edge |
| **Data flow** | Client → Edge → S3 | S3 → Edge → Client |
| **Pricing model** | Per GB accelerated | Per GB + per request |
| **Custom domain** | ❌ Dùng s3-accelerate | ✅ Custom domain |
| **SSL certificate** | AWS managed | Custom hoặc AWS |
| **Use case** | User uploads, backups | Static content, streaming |

### Khi nào dùng cái nào?

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION FLOWCHART                            │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  Workload type? │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌──────────┐                  ┌────────────┐
       │  UPLOAD  │                  │  DOWNLOAD  │
       └────┬─────┘                  └─────┬──────┘
            │                              │
            ▼                              ▼
  ┌─────────────────┐           ┌─────────────────────┐
  │ Transfer Accel  │           │ Content cacheable?  │
  └─────────────────┘           └──────────┬──────────┘
                                           │
                            ┌──────────────┴──────────────┐
                            ▼                             ▼
                    ┌───────────┐                 ┌───────────────┐
                    │    YES    │                 │      NO       │
                    └─────┬─────┘                 └───────┬───────┘
                          │                               │
                          ▼                               ▼
                   ┌────────────┐              ┌─────────────────┐
                   │ CloudFront │              │ Transfer Accel  │
                   └────────────┘              │ (for download)  │
                                               └─────────────────┘
```

### Có thể dùng CẢ HAI!

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────┘

     UPLOAD PATH                           DOWNLOAD PATH
    (Transfer Accel)                       (CloudFront)

  ┌──────────┐                           ┌──────────┐
  │  Users   │                           │  Users   │
  │ (global) │                           │ (global) │
  └────┬─────┘                           └────┬─────┘
       │                                      │
       ▼                                      ▼
  ┌──────────┐                           ┌──────────┐
  │  Edge    │                           │  Edge    │
  │ Location │                           │ Location │
  └────┬─────┘                           └────┬─────┘
       │                                      │
       │  AWS Backbone                        │ Cache hit? → Return
       ▼                                      ▼
  ┌──────────────────────────────────────────────┐
  │                  S3 BUCKET                    │
  │          (us-east-1, single region)           │
  └──────────────────────────────────────────────┘
```

---

## Cách bật Transfer Acceleration

### Qua AWS Console

1. Mở **S3 Console** → chọn bucket
2. Tab **Properties**
3. Scroll đến **Transfer acceleration**
4. Click **Edit** → chọn **Enabled**
5. **Save changes**

### Qua AWS CLI

```bash
# Enable Transfer Acceleration
aws s3api put-bucket-accelerate-configuration \
    --bucket my-bucket \
    --accelerate-configuration Status=Enabled

# Check status
aws s3api get-bucket-accelerate-configuration \
    --bucket my-bucket

# Output:
# {
#     "Status": "Enabled"
# }
```

### Qua CloudFormation/CDK

**CloudFormation:**

```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-accelerated-bucket
      AccelerateConfiguration:
        AccelerationStatus: Enabled
```

**CDK (TypeScript):**

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

const bucket = new s3.Bucket(this, 'MyBucket', {
  bucketName: 'my-accelerated-bucket',
  transferAcceleration: true,
});
```

---

## Upload qua Acceleration Endpoint

### Endpoint format

```
Standard:     https://bucket-name.s3.region.amazonaws.com
Accelerated:  https://bucket-name.s3-accelerate.amazonaws.com
Dual-stack:   https://bucket-name.s3-accelerate.dualstack.amazonaws.com
```

### AWS CLI

```bash
# Upload file với acceleration
aws s3 cp large-file.zip s3://my-bucket/ \
    --endpoint-url https://s3-accelerate.amazonaws.com

# Hoặc dùng flag
aws s3 cp large-file.zip s3://my-bucket/ \
    --region us-east-1 \
    --accelerate
```

### AWS SDK (Node.js)

```javascript
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

// Cách 1: Config trong client
const client = new S3Client({ 
  region: "us-east-1",
  useAccelerateEndpoint: true  // 👈 Enable acceleration
});

// Upload
const command = new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "uploads/large-file.zip",
  Body: fs.createReadStream("./large-file.zip")
});

await client.send(command);
```

### Pre-signed URL với Acceleration

```javascript
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const client = new S3Client({ 
  region: "us-east-1",
  useAccelerateEndpoint: true
});

const command = new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "uploads/video.mp4",
  ContentType: "video/mp4"
});

const presignedUrl = await getSignedUrl(client, command, { 
  expiresIn: 3600  // 1 hour
});

console.log(presignedUrl);
// https://my-bucket.s3-accelerate.amazonaws.com/uploads/video.mp4?...
```

### Python (boto3)

```python
import boto3
from botocore.config import Config

# Enable acceleration
config = Config(s3={'use_accelerate_endpoint': True})
s3_client = boto3.client('s3', config=config)

# Upload
s3_client.upload_file(
    'large-file.zip',
    'my-bucket',
    'uploads/large-file.zip'
)

# Generate presigned URL
presigned_url = s3_client.generate_presigned_url(
    'put_object',
    Params={'Bucket': 'my-bucket', 'Key': 'uploads/video.mp4'},
    ExpiresIn=3600
)
```

---

## Speed Comparison Tool

AWS cung cấp tool để test tốc độ **trước khi quyết định dùng**:

🔗 **[S3 Transfer Acceleration Speed Comparison](https://s3-accelerate-speedtest.s3-accelerate.amazonaws.com/en/accelerate-speed-comparsion.html)**

Tool này sẽ:
1. Upload test file từ browser của bạn
2. Test đến nhiều AWS regions
3. So sánh Direct vs Accelerated speed

### Kết quả mẫu (từ Vietnam)

```
┌────────────────────────────────────────────────────────────────┐
│           SPEED TEST RESULTS (from Vietnam)                     │
├───────────────┬──────────┬─────────────┬───────────────────────┤
│ Region        │ Direct   │ Accelerated │ Improvement           │
├───────────────┼──────────┼─────────────┼───────────────────────┤
│ us-east-1     │ 2.5 MB/s │ 8.1 MB/s    │ 🚀 224% faster        │
│ eu-west-1     │ 1.8 MB/s │ 7.2 MB/s    │ 🚀 300% faster        │
│ sa-east-1     │ 0.9 MB/s │ 5.4 MB/s    │ 🚀 500% faster        │
│ ap-southeast-1│ 15 MB/s  │ 14 MB/s     │ ❌ No benefit (close) │
│ ap-northeast-1│ 8.2 MB/s │ 12 MB/s     │ 🚀 46% faster         │
└───────────────┴──────────┴─────────────┴───────────────────────┘
```

> **Tip**: Chạy test vào **nhiều thời điểm khác nhau** trong ngày để có kết quả chính xác hơn.

---

## Lưu ý quan trọng

### 1. Bucket naming restrictions

```
✅ WORKS:
- my-bucket
- my-accelerated-bucket
- bucket-name-123

❌ DOESN'T WORK (có dấu chấm):
- my.bucket.name
- bucket.example.com
```

**Lý do:** Bucket name với dấu chấm không compatible với SSL certificate của s3-accelerate endpoint.

### 2. Kết hợp với Multipart Upload

Cho file lớn (> 100MB), **LUÔN** kết hợp Transfer Acceleration với Multipart Upload:

```
Single upload:
┌───────────────────────────────────────────────┐
│  5 GB file ────────────────────────────────►  │
│  Nếu fail giữa chừng → upload lại từ đầu      │
└───────────────────────────────────────────────┘

Multipart + Acceleration:
┌───────────────────────────────────────────────┐
│  Part 1 (100MB) ═══►                          │
│  Part 2 (100MB) ═══►   Parallel upload        │
│  Part 3 (100MB) ═══►   qua Edge locations     │
│  ...                                          │
│  Nếu 1 part fail → retry chỉ part đó          │
└───────────────────────────────────────────────┘
```

### 3. IPv6 support (Dual-stack)

```bash
# Dùng dual-stack endpoint cho IPv6
aws s3 cp file.zip s3://my-bucket/ \
    --endpoint-url https://s3-accelerate.dualstack.amazonaws.com
```

### 4. Không phải Region nào cũng có Edge

Tuy nhiên với **450+ Edge Locations** globally, hầu hết locations đều được cover.

---

## Ví dụ thực tế

### Case 1: Video Platform

```
REQUIREMENTS:
- Users upload videos (100MB - 5GB) từ toàn cầu
- Bucket ở us-east-1 (main processing region)
- Cần upload nhanh để bắt đầu transcode sớm

SOLUTION:
┌────────────────────────────────────────────────────────────────┐
│                      VIDEO UPLOAD FLOW                          │
└────────────────────────────────────────────────────────────────┘

  Mobile/Web App
       │
       │ 1. Request presigned URL (with acceleration)
       ▼
  ┌─────────────┐
  │ API Gateway │──► Lambda ──► S3 (generate presigned URL)
  └─────────────┘
       │
       │ 2. Return presigned URL
       │    https://bucket.s3-accelerate.amazonaws.com/...
       ▼
  Mobile/Web App
       │
       │ 3. Upload directly to S3 via acceleration
       ▼
  ┌─────────────┐
  │ Edge (SG)   │═══► AWS Backbone ═══► S3 (us-east-1)
  └─────────────┘
       │
       │ 4. S3 Event triggers processing
       ▼
  ┌─────────────┐
  │ Lambda/ECS  │──► Transcode, thumbnail, etc.
  └─────────────┘

RESULT:
- Upload time giảm 50-70% cho Asia/Europe users
- Better UX: progress bar chạy nhanh hơn
- Lower drop-off rate khi upload
```

### Case 2: Multi-region Backup

```
REQUIREMENTS:
- Office ở Singapore, Tokyo, London, New York
- Central backup bucket ở us-east-1
- Daily backup 50-200GB mỗi office

SOLUTION:

  Singapore           Tokyo            London           New York
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
  ┌───────┐         ┌───────┐        ┌───────┐         ┌───────┐
  │ Edge  │         │ Edge  │        │ Edge  │         │ Edge  │
  │ (SG)  │         │ (TYO) │        │ (LHR) │         │ (NYC) │
  └───┬───┘         └───┬───┘        └───┬───┘         └───┬───┘
      │                 │                │                 │
      └────────────────►│◄───────────────┴─────────────────┘
                        │
                   AWS Backbone
                        │
                        ▼
                ┌───────────────┐
                │   S3 Bucket   │
                │  (us-east-1)  │
                └───────────────┘

COST ESTIMATE:
- 4 offices × 100GB/day × 30 days = 12TB/month
- Acceleration fee: 12,000 GB × $0.04 = $480/month
- Time saved: ~4 hours/day × 22 days = 88 hours/month
```

---

## Troubleshooting

### "AccelerateConfigurationNotSetException"

```bash
# Kiểm tra xem acceleration đã bật chưa
aws s3api get-bucket-accelerate-configuration --bucket my-bucket

# Nếu chưa, bật lên
aws s3api put-bucket-accelerate-configuration \
    --bucket my-bucket \
    --accelerate-configuration Status=Enabled
```

### Upload không nhanh hơn

1. **Kiểm tra location**: Nếu bạn ở gần bucket region → không có benefit
2. **Test vào giờ khác**: Network congestion thay đổi theo thời gian
3. **Dùng Speed Comparison Tool** để verify

### Bucket name có dấu chấm

```
Error: "The bucket name must not contain period (.)"

Solution: Tạo bucket mới với tên không có dấu chấm
```

---

## Liên kết

- [S3](s3.md) - Amazon S3 overview
- [CloudFront](cloudfront.md) - CDN service (cho download)
- [VPC](vpc.md) - Network configuration

---

## Tài liệu tham khảo

- [S3 Transfer Acceleration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html)
- [Speed Comparison Tool](https://s3-accelerate-speedtest.s3-accelerate.amazonaws.com/en/accelerate-speed-comparsion.html)
- [Transfer Acceleration Pricing](https://aws.amazon.com/s3/pricing/)
- [Using transfer acceleration with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration-examples.html)
