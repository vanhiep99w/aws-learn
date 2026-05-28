# Amazon Data Firehose

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Amazon Data Firehose giải quyết vấn đề gì?](#amazon-data-firehose-giải-quyết-vấn-đề-gì)
- [Khái niệm cốt lõi](#khái-niệm-cốt-lõi)
- [Kiến trúc và luồng dữ liệu](#kiến-trúc-và-luồng-dữ-liệu)
- [Nguồn dữ liệu](#nguồn-dữ-liệu)
- [Đích đến được hỗ trợ](#đích-đến-được-hỗ-trợ)
- [Buffering, batching và độ trễ](#buffering-batching-và-độ-trễ)
- [Transform dữ liệu bằng AWS Lambda](#transform-dữ-liệu-bằng-aws-lambda)
- [Convert format sang Parquet/ORC](#convert-format-sang-parquetorc)
- [Dynamic partitioning với Amazon S3](#dynamic-partitioning-với-amazon-s3)
- [Backup, retry và xử lý lỗi](#backup-retry-và-xử-lý-lỗi)
- [Bảo mật](#bảo-mật)
- [Monitoring và troubleshooting](#monitoring-và-troubleshooting)
- [Quotas quan trọng](#quotas-quan-trọng)
- [Pricing](#pricing)
- [So sánh Firehose với các dịch vụ liên quan](#so-sánh-firehose-với-các-dịch-vụ-liên-quan)
- [Use cases phổ biến](#use-cases-phổ-biến)
- [Best practices](#best-practices)
- [Ví dụ triển khai nhanh](#ví-dụ-triển-khai-nhanh)
- [Exam tips](#exam-tips)
- [Nguồn chính thức](#nguồn-chính-thức)

---

## Giới thiệu

**Amazon Data Firehose** là dịch vụ **fully managed streaming ETL / delivery service** dùng để **nhận, xử lý nhẹ, buffer, và delivery dữ liệu streaming gần real-time** đến các đích như **Amazon S3, Amazon Redshift, Amazon OpenSearch Service, OpenSearch Serverless, Splunk, Snowflake, Apache Iceberg Tables, HTTP endpoint và nhiều dịch vụ third-party**.

Tên cũ thường gặp trong tài liệu/đề thi là **Amazon Kinesis Data Firehose**. Hiện AWS dùng tên **Amazon Data Firehose**, nhưng nhiều API, CloudFormation resource và CLI namespace vẫn còn chữ `firehose` hoặc `KinesisFirehose`.

### Ý tưởng cực ngắn

> Producer chỉ cần gửi record vào Firehose stream; Firehose tự scale, gom batch, có thể transform/convert/partition, rồi ghi vào destination.

### Đặc điểm chính

| Đặc điểm | Ý nghĩa |
|---|---|
| **Fully managed** | Không cần quản lý server/shard/consumer app cho pipeline delivery cơ bản |
| **Near real-time** | Dữ liệu được buffer theo size/time rồi delivery, thường tính bằng giây đến phút |
| **Auto scaling** | Tự scale theo throughput; Direct PUT có quota mặc định và có thể tăng |
| **Built-in transform** | Có thể gọi AWS Lambda để biến đổi record trước khi delivery |
| **Format conversion** | Có thể đổi JSON sang Parquet hoặc ORC khi ghi S3 |
| **Dynamic partitioning** | Có thể partition S3 prefix dựa trên field trong record |
| **Compression/encryption** | Hỗ trợ compression và server-side encryption cho S3 |
| **Monitoring tích hợp** | CloudWatch metrics/logs, CloudTrail API logging |

---

## Amazon Data Firehose giải quyết vấn đề gì?

Không có Firehose, bạn thường phải tự viết nhiều phần trong pipeline:

```text
App / Server / IoT / Logs
        │
        ▼
Custom ingestion service
        │   ├─ scale theo traffic
        │   ├─ retry khi destination lỗi
        │   ├─ batch dữ liệu
        │   ├─ compress/encrypt
        │   ├─ transform format
        │   └─ monitor lỗi
        ▼
S3 / Redshift / OpenSearch / Splunk / HTTP ...
```

Với Firehose:

```text
App / Logs / Kinesis Data Streams / MSK / AWS Services
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Amazon Data Firehose                       │
│  buffer + optional Lambda transform + optional conversion    │
│  + optional dynamic partitioning + retry + monitoring        │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
S3 / Redshift / OpenSearch / Splunk / Snowflake / HTTP ...
```

Bạn dùng Firehose khi muốn **đưa stream data vào data lake, warehouse, search/log platform hoặc endpoint khác mà không muốn tự vận hành pipeline delivery**.

---

## Khái niệm cốt lõi

| Khái niệm | Giải thích |
|---|---|
| **Firehose stream** | Entity chính của Firehose. Bạn tạo stream, cấu hình source/destination, rồi gửi dữ liệu vào stream đó. |
| **Record** | Một đơn vị dữ liệu producer gửi vào Firehose. Với Direct PUT, record tối đa **1,000 KiB trước base64 encoding**. |
| **Data producer** | Nguồn tạo dữ liệu: app server, log agent, Kinesis Data Streams, Amazon MSK, AWS service logs... |
| **Destination** | Nơi Firehose delivery dữ liệu: S3, Redshift, OpenSearch, Splunk, Snowflake, HTTP endpoint... |
| **Buffer size** | Lượng dữ liệu Firehose gom lại trước khi delivery. |
| **Buffer interval** | Thời gian tối đa Firehose chờ trước khi delivery batch. |
| **Backup S3 bucket** | Nơi lưu source record hoặc failed record tùy destination/cấu hình. |
| **Dynamic partitioning** | Cơ chế tạo S3 prefix động theo field trong record, ví dụ `country=VN/year=2026/`. |

---

## Kiến trúc và luồng dữ liệu

### Luồng tổng quát

```text
┌──────────────┐
│  Producers   │
│ App / Logs   │
│ KDS / MSK    │
└──────┬───────┘
       │ PutRecord / source integration
       ▼
┌──────────────────────────────────────────────────────────────┐
│                   Firehose stream                            │
│                                                              │
│  1. Ingest records                                           │
│  2. Deaggregate nếu cần                                      │
│  3. Decompress CloudWatch Logs nếu cấu hình                  │
│  4. Lambda transform nếu bật                                 │
│  5. Dynamic partitioning nếu ghi S3                          │
│  6. Convert JSON → Parquet/ORC nếu bật                       │
│  7. Buffer theo size/time                                    │
│  8. Deliver đến destination                                  │
└──────────────────────────────────────────────────────────────┘
       │
       ├────────► Amazon S3 / Apache Iceberg Tables
       ├────────► Amazon Redshift qua S3 staging + COPY
       ├────────► Amazon OpenSearch / OpenSearch Serverless
       ├────────► Splunk / Datadog / New Relic / Elastic ...
       └────────► HTTP endpoint / Snowflake / MongoDB Atlas ...
```

### Luồng đến Amazon S3

```text
Producer → Firehose → optional Lambda → optional partition/format conversion → S3 objects
```

S3 là destination phổ biến nhất vì phù hợp làm **data lake**. Bạn có thể dùng Athena, Glue, EMR, Redshift Spectrum hoặc Lake Formation để phân tích tiếp.

### Luồng đến Amazon Redshift

```text
Producer → Firehose → S3 staging bucket → Redshift COPY → Redshift table
```

Firehose không ghi trực tiếp từng record vào Redshift. Nó ghi dữ liệu vào S3 trước, sau đó dùng lệnh **COPY** để load vào Redshift. Theo tài liệu AWS, delivery đến Redshift yêu cầu Redshift cluster có thể truy cập công khai trong giới hạn được nêu bởi Firehose.

### Luồng đến OpenSearch/Splunk/HTTP

```text
Producer → Firehose → destination
                  └→ optional S3 backup
```

Với các destination ngoài S3, bạn thường cấu hình S3 backup để giữ lại failed records hoặc tất cả records tùy nhu cầu audit/replay.

---

## Nguồn dữ liệu

Firehose có thể nhận dữ liệu từ nhiều kiểu source:

| Source | Khi nào dùng |
|---|---|
| **Direct PUT** | App gọi API `PutRecord` hoặc `PutRecordBatch` trực tiếp vào Firehose. Đơn giản nhất. |
| **Kinesis Data Streams** | Khi cần stream layer có retention, nhiều consumer, replay, ordering theo shard. Firehose đọc từ KDS và delivery đến destination. |
| **Amazon MSK** | Khi dữ liệu đang ở Kafka/MSK và muốn delivery sang S3/analytics destinations. |
| **AWS service logs / vended logs** | Nhiều dịch vụ AWS có thể gửi log/event vào Firehose. |
| **Kinesis Agent / Fluent Bit / agent khác** | Thu thập log từ server/container rồi gửi vào Firehose. |

### Direct PUT vs Kinesis Data Streams source

| Tiêu chí | Direct PUT vào Firehose | Kinesis Data Streams → Firehose |
|---|---|---|
| Đơn giản | Rất đơn giản | Phức tạp hơn |
| Replay dữ liệu | Không phải mục tiêu chính | Có retention/replay trong KDS |
| Nhiều consumer độc lập | Không phù hợp | Rất phù hợp |
| Ordering theo shard | Không phải trọng tâm | Có ordering trong shard |
| Use case | Logs/events đi thẳng vào S3/OpenSearch | Streaming platform có nhiều consumer + Firehose là một consumer delivery |

---

## Đích đến được hỗ trợ

Theo AWS Documentation, Amazon Data Firehose hỗ trợ nhiều destination, gồm:

| Destination | Ghi chú |
|---|---|
| **Amazon S3** | Data lake, raw/processed logs, partitioned datasets |
| **Apache Iceberg Tables** | Ghi vào Iceberg table cho lakehouse workloads |
| **Amazon Redshift** | Firehose staging qua S3 rồi `COPY` vào Redshift |
| **Amazon OpenSearch Service** | Index logs/events để search/observability |
| **Amazon OpenSearch Serverless** | Serverless search/analytics destination |
| **Splunk** | Log/security analytics |
| **Snowflake** | Cloud data platform destination |
| **HTTP endpoint** | Custom endpoint hoặc SaaS endpoint hỗ trợ |
| **Third-party providers** | Ví dụ Datadog, Dynatrace, LogicMonitor, MongoDB, New Relic, Coralogix, Elastic... |

> Lưu ý: destination support có thể khác theo Region và có thể thay đổi. Khi triển khai thật, kiểm tra AWS docs/console cho Region đang dùng.

---

## Buffering, batching và độ trễ

Firehose không nhất thiết gửi từng record ngay lập tức. Nó **buffer** record theo hai điều kiện:

1. **Buffer size**: đủ dung lượng MB đã cấu hình.
2. **Buffer interval**: đủ thời gian chờ đã cấu hình.

Khi một trong hai điều kiện đạt ngưỡng, Firehose delivery batch đến destination.

```text
Incoming records
  r1 r2 r3 r4 r5 ...
       │
       ▼
Firehose buffer
  ├─ flush khi đủ size
  └─ hoặc flush khi tới interval
       │
       ▼
Destination object / batch / request
```

### Tác động của buffer

| Buffer nhỏ | Buffer lớn |
|---|---|
| Latency thấp hơn | Latency cao hơn |
| Nhiều object/request hơn | Ít object/request hơn |
| Có thể tăng cost/overhead ở destination | Tối ưu throughput/cost hơn |
| Phù hợp alert/log gần real-time | Phù hợp data lake/batch analytics |

Theo AWS quota docs, **buffer interval hints nằm trong khoảng 60–900 giây**.

---

## Transform dữ liệu bằng AWS Lambda

Firehose có thể invoke **AWS Lambda** để transform record trước khi delivery.

### Khi nào cần Lambda transform?

- Parse log text thành JSON.
- Mask hoặc xoá PII trước khi ghi S3.
- Thêm metadata như `source`, `env`, `tenant_id`.
- Chuẩn hóa timestamp.
- Lọc record không hợp lệ.
- Convert CSV hoặc custom text sang JSON để sau đó Firehose convert sang Parquet/ORC.
- Tạo partition key động phức tạp cho S3 dynamic partitioning.

### Flow

```text
Record gốc
   │
   ▼
Firehose invokes Lambda
   │
   ├─ Ok: transformed record
   ├─ Dropped: bỏ record
   └─ ProcessingFailed: đưa vào error flow / backup
   ▼
Destination
```

### Lưu ý quan trọng

- Lambda phải trả response theo format Firehose yêu cầu.
- Nếu Lambda lỗi hoặc timeout, Firehose retry theo cấu hình và có thể đưa record vào error backup.
- Với Amazon MSK source, tài liệu AWS nêu record max **6 MB nếu bật Lambda** do Lambda quota; **10 MB nếu không bật Lambda** trong ngữ cảnh MSK source.
- Không nên làm transform quá nặng trong Firehose Lambda. Nếu ETL phức tạp, cân nhắc AWS Glue, EMR, Flink hoặc consumer riêng.

---

## Convert format sang Parquet/ORC

Firehose có thể đổi dữ liệu **JSON → Apache Parquet hoặc Apache ORC** trước khi lưu vào S3.

### Vì sao nên dùng Parquet/ORC?

| JSON | Parquet/ORC |
|---|---|
| Row-oriented | Columnar |
| Dễ đọc/debug | Tối ưu analytics |
| Tốn dung lượng hơn | Nén tốt hơn |
| Athena scan nhiều data hơn | Athena/Redshift Spectrum scan ít data hơn |

### Firehose cần gì để convert format?

Theo AWS docs, Firehose cần 3 thành phần:

1. **Deserializer** để đọc JSON input:
   - Apache Hive JSON SerDe
   - OpenX JSON SerDe
2. **Schema** trong **AWS Glue Data Catalog** để hiểu cấu trúc dữ liệu.
3. **Serializer** để ghi output:
   - Parquet SerDe
   - ORC SerDe

```text
JSON records
   │
   ▼
Deserializer + Glue schema
   │
   ▼
Parquet/ORC serializer
   │
   ▼
S3 optimized objects
```

### Lưu ý

- Input format phải là JSON. Nếu source là CSV/text, dùng Lambda transform sang JSON trước.
- Schema trong Glue phải khớp cấu trúc input; field không có trong schema có thể không xuất hiện trong output converted data.
- Nested JSON cần schema kiểu `STRUCT` tương ứng.
- Khi bật record format conversion, use case chính là delivery đến S3.

---

## Dynamic partitioning với Amazon S3

**Dynamic partitioning** cho phép Firehose ghi record vào các S3 prefix khác nhau dựa trên nội dung record.

Ví dụ record:

```json
{
  "event_time": "2026-05-28T10:15:00Z",
  "country": "VN",
  "service": "checkout",
  "level": "ERROR"
}
```

Có thể ghi vào S3 prefix:

```text
s3://my-log-bucket/events/country=VN/service=checkout/year=2026/month=05/day=28/
```

### Lợi ích

- Athena/Glue query scan ít dữ liệu hơn.
- Dữ liệu vào S3 đã sẵn sàng cho partition-based analytics.
- Tránh phải chạy job repartition sau khi data landed.

### Cách tạo partition key

| Cách | Mô tả |
|---|---|
| **Inline parsing** | Dùng jq expression để trích field từ JSON. AWS docs nêu Firehose hỗ trợ jq 1.6. |
| **Lambda function** | Dùng Lambda để tạo partition key, phù hợp dữ liệu nén/mã hóa/non-JSON hoặc logic phức tạp. |
| **Kết hợp cả hai** | Có thể dùng cả inline parsing và Lambda partition key. |

### Thứ tự xử lý khi dynamic partitioning với S3

Theo tài liệu AWS cho destination S3, Firehose xử lý theo thứ tự:

```text
KPL deaggregation
→ JSON/delimiter deaggregation
→ Lambda processing
→ data partitioning
→ data format conversion
→ S3 delivery
```

### Lưu ý quan trọng

- Dynamic partitioning khi đã bật trên một Firehose stream thì theo AWS docs **không thể disable** trên stream đó.
- Nếu data được aggregate nhiều event trong một API call, cần bật deaggregation để Firehose tách record trước khi partition.
- Quota mặc định cho dynamic partitioning là **500 active partitions** trên mỗi Firehose stream.
- Thiết kế partition key quá high-cardinality có thể làm tăng active partitions, tạo nhiều object nhỏ và gây lỗi/cost cao.

---

## Backup, retry và xử lý lỗi

Firehose được thiết kế để retry khi destination tạm thời lỗi, nhưng bạn vẫn cần cấu hình backup/error path đúng.

### Các kiểu lỗi thường gặp

| Nhóm lỗi | Ví dụ |
|---|---|
| Permission | IAM role thiếu quyền ghi S3, KMS key policy sai, OpenSearch policy sai |
| Network/destination | HTTP endpoint down, Splunk unavailable, Redshift không truy cập được |
| Format | JSON không match schema Glue, Lambda output sai format |
| Quota | Direct PUT throughput bị throttle, active partitions vượt quota |
| Data quality | Record quá lớn, encoding sai, timestamp/field thiếu |

### Retention khi destination unavailable

Theo AWS quota docs:

- Với source **Direct PUT**, Firehose lưu record tối đa **24 giờ** nếu destination unavailable.
- Với source **Kinesis Data Streams**, retention phụ thuộc cấu hình retention của Kinesis Data Streams.

### S3 backup

Nên cấu hình S3 backup cho:

- Failed records từ destination ngoài S3.
- Source records trước transform nếu cần audit/replay.
- Error prefix rõ ràng để debug, ví dụ:

```text
s3://my-bucket/firehose-errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/
```

---

## Bảo mật

### IAM role

Firehose dùng IAM role để access destination và các dịch vụ liên quan:

- Ghi object vào S3.
- Dùng KMS key nếu mã hóa SSE-KMS.
- Invoke Lambda transform.
- Đọc schema AWS Glue Data Catalog khi format conversion.
- Ghi vào OpenSearch/Redshift/Snowflake/HTTP destination theo cấu hình.

Ví dụ quyền tối thiểu cho S3 destination thường cần:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-firehose-bucket",
        "arn:aws:s3:::my-firehose-bucket/*"
      ]
    }
  ]
}
```

### Encryption

- S3 destination hỗ trợ server-side encryption, gồm SSE-KMS.
- Có thể dùng AWS managed key hoặc customer managed KMS key.
- Nếu dùng customer managed key, cần key policy cho Firehose role.

### Network/private connectivity

- Với một số destination hoặc source, cần chú ý VPC access, security group, endpoint/network reachability.
- Nếu ghi đến HTTP endpoint public, cần xác thực và bảo vệ secret/token.
- Không log plaintext secret trong Lambda transform hoặc CloudWatch Logs.

### Data protection

- Mask PII trước khi delivery nếu destination không nên lưu dữ liệu nhạy cảm.
- Dùng S3 bucket policy, Block Public Access, Object Ownership, lifecycle và retention phù hợp.
- Bật CloudTrail để audit API calls liên quan Firehose.

---

## Monitoring và troubleshooting

Firehose publish metrics vào namespace **`AWS/Firehose`**. AWS khuyến nghị bật alarm cho các metrics liên quan destination để phát hiện lỗi kịp thời.

### Metrics nên biết

| Metric | Ý nghĩa |
|---|---|
| `IncomingBytes` | Số bytes ingest vào Firehose |
| `IncomingRecords` | Số records ingest vào Firehose |
| `DeliveryToS3.Success` | Delivery S3 thành công |
| `DeliveryToS3.DataFreshness` | Tuổi của record cũ nhất chưa được delivery xong đến S3 |
| `DeliveryToRedshift.Success` | Redshift COPY thành công |
| `DeliveryToAmazonOpenSearchService.Success` | Index OpenSearch thành công |
| `DeliveryToSplunk.Success` | Delivery Splunk thành công |
| `DeliveryToHttpEndpoint.Success` | Delivery HTTP endpoint thành công |
| `ThrottledRecords` | Records bị throttle với Direct PUT/API-level scenario |
| `DeliveryToS3.ObjectCount` | Số object tạo ra trên S3, hữu ích để phát hiện small files |
| `PartitionCount` | Số active partitions khi bật dynamic partitioning |
| `PartitionCountExceeded` | Báo vượt active partition limit |
| Lambda transform metrics | Theo dõi lỗi/duration transform |
| Format conversion metrics | Theo dõi lỗi convert JSON sang Parquet/ORC |

### Checklist debug nhanh

```text
1. Không thấy dữ liệu ở destination?
   ├─ Kiểm tra IncomingRecords/IncomingBytes có tăng không
   ├─ Kiểm tra buffer interval: có thể chưa flush
   ├─ Kiểm tra CloudWatch Logs của Firehose nếu đã bật
   ├─ Kiểm tra IAM role/KMS/bucket policy
   └─ Kiểm tra error backup prefix trong S3

2. Dữ liệu đến chậm?
   ├─ Xem DataFreshness
   ├─ Buffer size/interval có quá lớn không
   ├─ Destination có throttle/lỗi không
   └─ Lambda transform có chậm/lỗi không

3. Quá nhiều file nhỏ ở S3?
   ├─ Tăng buffer size/interval nếu latency cho phép
   ├─ Giảm cardinality partition key
   └─ Kiểm tra quota Direct PUT có bị set quá cao so với traffic thực không

4. Dynamic partitioning lỗi?
   ├─ Kiểm tra jq expression
   ├─ Kiểm tra missing field/null value
   ├─ Kiểm tra active partitions
   └─ Kiểm tra error-output prefix
```

---

## Quotas quan trọng

Một số quota được AWS docs nêu rõ:

| Quota | Giá trị / ghi chú |
|---|---|
| Max record size với Direct PUT | **1,000 KiB trước base64 encoding** |
| `PutRecordBatch` | Tối đa **500 records/call** hoặc **4 MiB/call**, lấy điều kiện nhỏ hơn |
| Buffer interval hints | **60–900 giây** |
| Direct PUT throughput mặc định ở us-east-1, us-west-2, eu-west-1 | **500,000 records/s**, **2,000 requests/s**, **5 MiB/s** mỗi stream |
| Direct PUT throughput mặc định ở Regions khác | **100,000 records/s**, **1,000 requests/s**, **1 MiB/s** mỗi stream |
| Dynamic partitioning active partitions | Mặc định **500 active partitions** mỗi stream |
| Dynamic partitioning per active partition throughput | Tối đa **1 GB/s** mỗi active partition |
| Retention khi Direct PUT destination unavailable | Tối đa **24 giờ** |
| Amazon MSK source read throughput | Mặc định **10 MB/s per partition** |
| Amazon MSK source max record size | **10 MB**, hoặc **6 MB nếu bật Lambda** |
| Control plane APIs | Một số API như Create/Delete/Describe/List/Update có hard limit **5 invocations/s** |
| Customer managed CMK encryption | Có thể encrypt tối đa **500 Firehose streams** với CMK type `CUSTOMER_MANAGED_CMK` |

> Quotas thay đổi theo Region và thời gian. Khi thiết kế production, luôn kiểm tra Service Quotas và AWS General Reference.

---

## Pricing

Amazon Data Firehose có mô hình **pay-as-you-go**. Các nhóm chi phí chính thường gồm:

| Nhóm chi phí | Mô tả |
|---|---|
| **Ingestion** | Tính theo GB dữ liệu ingest; với Direct PUT/KDS thường làm tròn theo record size increment nhất định. |
| **Format conversion** | Phí khi convert JSON sang Parquet/ORC. |
| **Dynamic partitioning** | Phí bổ sung khi bật dynamic partitioning. |
| **VPC delivery** | Có thể có phí cho delivery qua VPC tùy destination/cấu hình. |
| **Destination costs** | S3 storage/PUT, Redshift, OpenSearch, Splunk/SaaS, KMS, Lambda, CloudWatch Logs... tính riêng. |

### Cost traps hay gặp

- Gửi quá nhiều record nhỏ: pricing ingestion có thể làm tròn theo kích thước record, nên nhiều record nhỏ có thể đắt hơn ít record lớn với cùng tổng bytes.
- Dynamic partitioning high-cardinality tạo nhiều S3 object nhỏ.
- Lambda transform chạy lâu hoặc memory cao.
- CloudWatch Logs debug bật quá verbose.
- Destination như OpenSearch/Redshift/Snowflake có cost riêng đáng kể.

---

## So sánh Firehose với các dịch vụ liên quan

### Firehose vs Kinesis Data Streams

| Tiêu chí | Amazon Data Firehose | Amazon Kinesis Data Streams |
|---|---|---|
| Mục tiêu | Delivery stream data đến destination | Streaming backbone cho producers/consumers |
| Quản lý consumer | Firehose quản lý delivery | Bạn tự viết consumer hoặc dùng Lambda/Flink/etc. |
| Replay | Không phải điểm mạnh | Có retention và replay |
| Multi-consumer | Không phải trọng tâm | Rất phù hợp |
| Latency | Near real-time, phụ thuộc buffer | Millisecond/sub-second tùy consumer |
| Scaling | Fully managed, auto scaling | Theo shard/on-demand mode |
| Use case | Logs/events → S3/OpenSearch/Redshift/SaaS | Event streaming, nhiều consumer, real-time processing |

**Mẹo nhớ:**

- Cần **stream platform + replay + nhiều consumers** → Kinesis Data Streams.
- Cần **đưa data vào S3/Redshift/OpenSearch/Splunk nhanh, ít vận hành** → Firehose.

### Firehose vs AWS Glue

| Tiêu chí | Firehose | AWS Glue |
|---|---|---|
| Kiểu xử lý | Streaming delivery + transform nhẹ | ETL batch/streaming phức tạp |
| Latency | Gần real-time | Thường batch hoặc streaming job |
| Transform | Lambda đơn giản | Spark/Python/Glue ETL mạnh hơn |
| Use case | Ingest logs/events vào data lake | Clean/join/enrich large datasets |

### Firehose vs Amazon MSK / Kafka

| Tiêu chí | Firehose | MSK/Kafka |
|---|---|---|
| Vai trò | Managed delivery pipeline | Distributed event streaming platform |
| Consumer model | Destination-oriented | Topic/partition/consumer group |
| Replay | Không phải trọng tâm | Retention/replay là core feature |
| Ops | Rất ít | Nhiều khái niệm hơn dù MSK managed |

### Firehose vs CloudWatch Logs subscription

| Tiêu chí | Firehose | CloudWatch Logs subscription |
|---|---|---|
| Vai trò | Destination delivery service | Cơ chế xuất log từ CloudWatch Logs |
| Quan hệ | Có thể là destination của log subscription | Có thể gửi log vào Firehose |

---

## Use cases phổ biến

### 1. Centralized logging vào S3 data lake

```text
Applications / Servers / Containers
        │
        ▼
Firehose
        │
        ├─ Lambda mask PII
        ├─ Dynamic partition by app/env/date
        └─ Convert JSON → Parquet
        ▼
S3 Data Lake → Glue Catalog → Athena/QuickSight
```

### 2. Near real-time search logs bằng OpenSearch

```text
App logs → Firehose → OpenSearch
                    └→ S3 backup failed/all records
```

Dùng khi muốn query log nhanh trên OpenSearch nhưng vẫn giữ raw data ở S3 để archive/replay.

### 3. Clickstream analytics

```text
Web/mobile events → Firehose → S3 partitioned by date/country/app
                              → Athena/Redshift Spectrum
```

### 4. Security events vào SIEM/Splunk

```text
AWS logs / security events → Firehose → Splunk
                                      └→ S3 backup
```

### 5. Kafka/MSK data lake sink

```text
Amazon MSK topic → Firehose → S3 / Iceberg / Snowflake
```

Phù hợp khi đội data muốn lấy Kafka topic vào lake/warehouse mà không tự vận hành Kafka Connect sink.

---

## Best practices

### Thiết kế S3 data lake

- Dùng prefix có cấu trúc rõ ràng:

```text
s3://bucket/raw/service=checkout/env=prod/year=2026/month=05/day=28/hour=10/
```

- Dùng Parquet/ORC nếu query bằng Athena/Redshift Spectrum thường xuyên.
- Tránh partition key quá high-cardinality như `user_id` nếu traffic lớn.
- Bật newline delimiter nếu lưu JSON và muốn Athena đọc record dễ hơn.

### Reliability

- Luôn cấu hình S3 backup/error prefix cho destination ngoài S3.
- Bật CloudWatch alarms cho destination success/failure/data freshness.
- Producer nên retry với exponential backoff khi Direct PUT bị throttle.
- Với use case cần replay chắc chắn, đặt Kinesis Data Streams hoặc MSK trước Firehose.

### Performance/cost

- Điều chỉnh buffer size/interval theo trade-off latency vs object size.
- Gom record nhỏ ở producer nếu hợp lý để giảm overhead/cost.
- Theo dõi `DeliveryToS3.ObjectCount` và số lượng small files.
- Với Athena, partition + Parquet thường giảm cost scan đáng kể.

### Security

- IAM role theo least privilege.
- Mã hóa S3 với SSE-KMS nếu dữ liệu nhạy cảm.
- Không đưa secret vào record/log.
- Mask/tokenize PII trước khi lưu vào destination rộng quyền truy cập.

### Schema evolution

- Nếu convert sang Parquet/ORC, quản lý schema trong Glue cẩn thận.
- Thay đổi field/type cần test trước vì schema không khớp có thể gây mất field hoặc lỗi conversion.
- Cân nhắc versioned prefix: `schema_version=1/`, `schema_version=2/`.

---

## Ví dụ triển khai nhanh

> Ví dụ minh họa để học. Khi chạy thật, thay bucket/role/region phù hợp và kiểm tra IAM trust policy cho Firehose.

### 1. Tạo S3 bucket làm destination

```bash
aws s3 mb s3://my-firehose-demo-bucket --region ap-southeast-1
```

### 2. Tạo IAM role cho Firehose

Trust policy ví dụ:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "firehose.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Policy tối thiểu cho S3 destination cần quyền ghi bucket như phần Security ở trên.

### 3. Tạo Firehose stream Direct PUT đến S3 bằng CLI

File `s3-destination.json`:

```json
{
  "RoleARN": "arn:aws:iam::123456789012:role/firehose-s3-role",
  "BucketARN": "arn:aws:s3:::my-firehose-demo-bucket",
  "Prefix": "raw/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/",
  "ErrorOutputPrefix": "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/",
  "BufferingHints": {
    "SizeInMBs": 5,
    "IntervalInSeconds": 60
  },
  "CompressionFormat": "GZIP"
}
```

Tạo stream:

```bash
aws firehose create-delivery-stream \
  --delivery-stream-name demo-directput-to-s3 \
  --delivery-stream-type DirectPut \
  --s3-destination-configuration file://s3-destination.json \
  --region ap-southeast-1
```

### 4. Gửi một record test

```bash
aws firehose put-record \
  --delivery-stream-name demo-directput-to-s3 \
  --record 'Data={"event":"signup","user_id":"u-001","country":"VN"}' \
  --region ap-southeast-1
```

Sau khi buffer flush, kiểm tra S3:

```bash
aws s3 ls s3://my-firehose-demo-bucket/raw/ --recursive
```

### 5. CloudFormation resource name

Trong CloudFormation, resource type vẫn là:

```yaml
Type: AWS::KinesisFirehose::DeliveryStream
```

Điều này dễ gây nhầm vì service đã đổi tên marketing thành Amazon Data Firehose.

---

## Exam tips

- **Firehose = delivery/load streaming data**, không phải general-purpose stream processing engine.
- Nếu đề nói **load streaming logs to S3/Redshift/OpenSearch/Splunk with minimal administration** → chọn Firehose.
- Nếu cần **replay, nhiều consumer, ordering theo shard** → chọn Kinesis Data Streams, có thể kết hợp Firehose làm một consumer.
- Nếu cần **ETL phức tạp, join/enrich lớn** → Glue/EMR/Flink phù hợp hơn Lambda transform trong Firehose.
- Firehose đến **Redshift**: nhớ luồng **S3 staging → Redshift COPY**.
- Firehose có thể **convert JSON sang Parquet/ORC** khi ghi S3, cần **Glue Data Catalog schema**.
- **Dynamic partitioning** giúp ghi S3 prefix theo field trong record; tránh high-cardinality.
- Firehose là **near real-time**, không phải low-latency millisecond pipeline.
- S3 backup/error prefix rất quan trọng cho troubleshooting và replay.

---

## Nguồn chính thức

- AWS Documentation — What is Amazon Data Firehose: <https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html>
- AWS Documentation — Configure destination settings: <https://docs.aws.amazon.com/firehose/latest/dev/create-destination.html>
- AWS Documentation — Configure record transformation and format conversion: <https://docs.aws.amazon.com/firehose/latest/dev/create-transform.html>
- AWS Documentation — Convert input data format: <https://docs.aws.amazon.com/firehose/latest/dev/record-format-conversion.html>
- AWS Documentation — Dynamic partitioning: <https://docs.aws.amazon.com/firehose/latest/dev/dynamic-partitioning.html>
- AWS Documentation — Amazon Data Firehose quotas: <https://docs.aws.amazon.com/firehose/latest/dev/limits.html>
- AWS Documentation — Monitor with CloudWatch metrics: <https://docs.aws.amazon.com/firehose/latest/dev/monitoring-with-cloudwatch-metrics.html>
- AWS Pricing — Amazon Data Firehose Pricing: <https://aws.amazon.com/firehose/pricing/>
- AWS FAQs — Amazon Data Firehose FAQs: <https://aws.amazon.com/firehose/faqs/>
