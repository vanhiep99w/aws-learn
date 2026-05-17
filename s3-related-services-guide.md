# AWS Services Làm Việc Cùng Amazon S3

## Mục lục

- [Tóm tắt nhanh](#tóm-tắt-nhanh)
- [Mental model: S3 là hồ chứa, dịch vụ khác là công cụ](#mental-model-s3-là-hồ-chứa-dịch-vụ-khác-là-công-cụ)
- [Bảng phân biệt theo nhu cầu](#bảng-phân-biệt-theo-nhu-cầu)
- [Nhóm Data Lake, SQL, ETL và BI](#nhóm-data-lake-sql-etl-và-bi)
- [Nhóm event-driven và xử lý object mới](#nhóm-event-driven-và-xử-lý-object-mới)
- [Nhóm ingest, migration và file transfer vào S3](#nhóm-ingest-migration-và-file-transfer-vào-s3)
- [Nhóm phân phối nội dung và truy cập ứng dụng](#nhóm-phân-phối-nội-dung-và-truy-cập-ứng-dụng)
- [Nhóm bảo mật, quyền truy cập và governance](#nhóm-bảo-mật-quyền-truy-cập-và-governance)
- [Nhóm monitoring, audit, inventory và tối ưu chi phí](#nhóm-monitoring-audit-inventory-và-tối-ưu-chi-phí)
- [Nhóm thao tác hàng loạt, replication và archive](#nhóm-thao-tác-hàng-loạt-replication-và-archive)
- [Nhóm AI/ML thường dùng S3 làm data store](#nhóm-aiml-thường-dùng-s3-làm-data-store)
- [Các cặp dễ nhầm nhất](#các-cặp-dễ-nhầm-nhất)
- [Kiến trúc mẫu dễ nhớ](#kiến-trúc-mẫu-dễ-nhớ)
- [Decision tree chọn dịch vụ](#decision-tree-chọn-dịch-vụ)
- [Mẹo nhớ nhanh](#mẹo-nhớ-nhanh)
- [Nguồn AWS chính thức](#nguồn-aws-chính-thức)

---

## Tóm tắt nhanh

Nếu coi **Amazon S3** là nơi chứa object/file, thì các dịch vụ liên quan thường rơi vào 8 vai trò:

| Vai trò | Dịch vụ thường gặp | Nhớ nhanh |
|---|---|---|
| **Query SQL trực tiếp trên S3** | Athena, Redshift Spectrum | Không cần load data vào DB, query file ở S3 |
| **ETL / transform / catalog schema** | AWS Glue | Crawler tìm schema, Data Catalog lưu metadata, Glue Jobs transform data |
| **Governance data lake** | Lake Formation, DataZone | Quản quyền data lake, chia sẻ, discovery |
| **BI / dashboard** | QuickSight | Vẽ dashboard từ Athena/Redshift/S3 data lake |
| **Streaming vào S3** | Data Firehose, Kinesis, MSK Connect | Đẩy log/event realtime hoặc near realtime vào S3 |
| **Object mới thì xử lý ngay** | S3 Event Notifications, Lambda, SQS, SNS, EventBridge | Upload object → bắn event → chạy workflow |
| **Transfer/migration vào S3** | DataSync, Transfer Family, Storage Gateway, Snow Family, S3 Transfer Acceleration | Chuyển dữ liệu từ on-prem/partner/client vào S3 |
| **Security/monitoring/cost** | IAM, KMS, Macie, CloudTrail, CloudWatch, GuardDuty, Storage Lens, Inventory | Bảo vệ, audit, đo dung lượng, phát hiện rủi ro |

**Câu nhớ ngắn:**

> **S3 lưu data. Athena hỏi data. Glue hiểu và biến đổi data. Lake Formation giữ cửa. Firehose/DataSync/Transfer đưa data vào. Lambda/EventBridge phản ứng khi data đến. CloudFront đưa data ra. Macie/CloudTrail/Storage Lens giám sát data.**

---

## Mental model: S3 là hồ chứa, dịch vụ khác là công cụ

S3 không phải database truyền thống. S3 là **object storage**: bạn đặt object vào bucket theo key/prefix. Vì vậy khi làm analytics hoặc application, bạn thường cần thêm dịch vụ xung quanh:

```text
Nguồn data
  ├─ App logs / IoT / clickstream ──> Data Firehose / Kinesis ─┐
  ├─ On-prem NAS/file server ───────> DataSync / Storage GW ───┤
  ├─ Partner dùng SFTP/AS2 ─────────> Transfer Family ─────────┤
  └─ Dataset rất lớn/offline ───────> Snow Family ─────────────┘
                                                               ↓
                                                         Amazon S3
                                                               ↓
        ┌───────────────┬─────────────────┬────────────────────┬─────────────────┐
        │ Glue Catalog  │ Athena SQL       │ Glue/EMR ETL       │ Lambda events   │
        │ schema/meta   │ query tại chỗ    │ transform big data │ xử lý object mới│
        └───────┬───────┴────────┬────────┴─────────┬──────────┴────────┬────────┘
                ↓                ↓                  ↓                   ↓
        Lake Formation       QuickSight          Redshift/SageMaker   EventBridge/SQS
        governance           dashboard           warehouse/ML         workflow
```

Có 3 loại thông tin cần tách rõ:

1. **Data thật**: file/object nằm trong S3, ví dụ `s3://lake/raw/orders/2026/05/17/file.parquet`.
2. **Metadata/schema**: bảng, cột, partition nằm trong **AWS Glue Data Catalog**.
3. **Quyền truy cập**: IAM/S3 bucket policy/KMS là nền tảng; **Lake Formation** thêm quyền fine-grained cho data lake.

---

## Bảng phân biệt theo nhu cầu

| Bạn muốn làm gì với S3? | Chọn dịch vụ | Vì sao |
|---|---|---|
| Chạy SQL trên CSV/JSON/Parquet trong S3 | **Amazon Athena** | Serverless, schema-on-read, dùng Glue Data Catalog |
| Tự động phát hiện schema/partition | **AWS Glue Crawler** | Crawl file trong S3 rồi tạo/update table metadata |
| Transform dữ liệu raw → clean/curated | **AWS Glue Jobs** hoặc **Amazon EMR** | Glue serverless ETL; EMR phù hợp Spark/Hadoop ecosystem phức tạp |
| Quản quyền table/column/row/cell cho data lake | **AWS Lake Formation** | Fine-grained access control trên S3 data + Glue Catalog |
| BI dashboard từ data lake | **Amazon QuickSight** | Kết nối Athena/Redshift/S3-derived datasets để trực quan hóa |
| Query S3 data từ data warehouse | **Redshift Spectrum** | Redshift query external table ở S3 và join với table trong Redshift |
| Stream logs/events vào S3 | **Amazon Data Firehose** | Managed delivery stream, buffer rồi ghi S3; có thể partition/convert format |
| Object upload xong thì chạy code | **S3 Event Notifications + Lambda** | Xử lý ảnh, validate file, tạo thumbnail, parse metadata |
| Object upload xong thì fan-out workflow | **EventBridge/SNS/SQS** | Routing, fan-out, queue, retry, decouple consumers |
| Partner dùng SFTP/FTPS/FTP/AS2 | **AWS Transfer Family** | Managed endpoint ghi/đọc S3/EFS, không tự vận hành server |
| Copy/sync NAS/on-prem/cloud khác vào S3 | **AWS DataSync** | Transfer task/schedule, preserve metadata tùy nguồn/đích |
| App on-prem muốn mount storage liên tục | **AWS Storage Gateway - File Gateway** | NFS/SMB local cache, backend là S3 |
| Dữ liệu quá lớn so với network | **AWS Snow Family** | Thiết bị vật lý để import/export/edge |
| Tăng tốc upload/download từ client xa Region | **S3 Transfer Acceleration** | Đi qua AWS edge network vào bucket S3 |
| Phân phối file tĩnh ra internet | **Amazon CloudFront** | CDN cache edge, origin thường là S3 |
| Tìm dữ liệu nhạy cảm trong S3 | **Amazon Macie** | Discover/classify PII/sensitive data trong S3 |
| Audit API access tới S3 | **AWS CloudTrail** | Ghi management events và data events cho S3 |
| Xem xu hướng dung lượng/cost/security posture | **S3 Storage Lens** | Metrics toàn account/org cho S3 |
| Liệt kê object metadata theo lịch | **S3 Inventory** | Report object list, dùng cho audit/Batch Ops/Athena |
| Thao tác hàng tỷ object | **S3 Batch Operations** | Copy/tag/encrypt/restore/invoke Lambda theo manifest |
| Tự chuyển storage class/archive/delete | **S3 Lifecycle** | Rule tự động theo tuổi object/prefix/tag |
| Replicate data sang bucket/Region khác | **S3 Replication** | CRR/SRR cho DR, compliance, latency đọc |

---

## Nhóm Data Lake, SQL, ETL và BI

### 1. Amazon Athena — hỏi S3 bằng SQL

**Bản chất:** serverless SQL query service để query dữ liệu nằm trong S3.

- Data vẫn nằm trong S3; Athena không biến S3 thành database vật lý.
- Khi tạo table, bạn mô tả **schema** và **S3 LOCATION**.
- Athena lưu schema trong **AWS Glue Data Catalog** và dùng kiểu **schema-on-read**: chỉ áp schema lúc query.
- Hợp với ad-hoc query, log analysis, data lake query, kiểm tra nhanh dataset.

**Khi nhớ Athena, nhớ câu:**

> **Athena = SELECT trên S3.**

**Ví dụ flow:**

```sql
CREATE EXTERNAL TABLE access_logs (
  ip string,
  request_time string,
  path string,
  status int
)
STORED AS PARQUET
LOCATION 's3://my-lake/curated/access_logs/';

SELECT status, count(*)
FROM access_logs
GROUP BY status;
```

**Dễ nhầm:** Athena không phải ETL engine chính. Nó có thể CTAS/INSERT để tạo dataset mới, nhưng nếu transform nặng, orchestration phức tạp, dùng Glue hoặc EMR.

### 2. AWS Glue Data Catalog — danh bạ metadata của data lake

**Bản chất:** metadata repository cho database/table/schema/partition.

- S3 giữ file thật.
- Glue Data Catalog giữ thông tin “file này đọc như table nào, cột gì, partition gì”.
- Athena, Glue, Redshift Spectrum, EMR, Lake Formation thường dùng chung catalog này.

**Câu nhớ:**

> **Glue Catalog = mục lục/schema của dữ liệu trong S3.**

### 3. AWS Glue Crawler — robot đi đọc S3 để đoán schema

**Bản chất:** scan dữ liệu trong S3, infer schema/partition, tạo hoặc cập nhật table trong Glue Data Catalog.

**Chọn Crawler khi:**

- Data mới đổ vào S3 theo prefix/partition.
- Bạn chưa muốn tự viết DDL thủ công.
- File format tương đối rõ: CSV, JSON, Parquet, ORC, Avro.

**Không nên phụ thuộc mù quáng:** schema inference có thể sai nếu dữ liệu không nhất quán. Dataset production quan trọng nên kiểm soát schema rõ ràng.

### 4. AWS Glue Jobs — ETL serverless

**Bản chất:** chạy job Spark/Python để extract-transform-load.

**Dùng khi:**

- Convert CSV/JSON raw → Parquet curated.
- Clean dữ liệu, join, deduplicate, mapping column.
- Tạo pipeline raw → cleaned → curated trên S3.

```text
s3://lake/raw/        --Glue Job-->  s3://lake/cleaned/  --Glue Job--> s3://lake/curated/
CSV/JSON                              Parquet                            partitioned Parquet
```

**Câu nhớ:**

> **Glue Job = nhà máy biến đổi dữ liệu trong data lake.**

### 5. AWS Lake Formation — bảo vệ và quản trị data lake

**Bản chất:** governance layer cho data lake trên S3 và metadata trong Glue Data Catalog.

- Quản lý quyền tập trung cho database/table/column/row/cell.
- Hỗ trợ chia sẻ Data Catalog resources qua IAM principals, accounts, AWS Organizations/OUs.
- Là lớp quyền bổ sung bên cạnh IAM/S3/KMS, đặc biệt hữu ích khi nhiều team cùng dùng Athena/Glue/EMR/Redshift Spectrum/QuickSight.

**Câu nhớ:**

> **Lake Formation = security guard của data lake.**

**Dùng khi:**

- Data lake có nhiều team: finance, marketing, data science.
- Cần cấp quyền theo table/cột/hàng, không chỉ theo bucket/prefix.
- Cần cross-account data sharing có governance.

### 6. Amazon Redshift Spectrum — Redshift đọc S3 ngoài warehouse

**Bản chất:** cho Redshift query external tables nằm trong S3.

- Tạo external schema/table trỏ tới data catalog.
- Query và join dữ liệu S3 với table trong Redshift.
- Redshift Spectrum pushdown filtering/aggregation tới tầng xử lý Spectrum để giảm tải cluster.
- External tables không hỗ trợ update như table nội bộ Redshift.

**Câu nhớ:**

> **Redshift Spectrum = Redshift vươn tay ra đọc S3.**

**Athena vs Redshift Spectrum:**

| Tiêu chí | Athena | Redshift Spectrum |
|---|---|---|
| Bạn đang ở đâu? | Chưa có warehouse hoặc muốn serverless SQL | Đã dùng Redshift |
| Mục tiêu | Query S3 trực tiếp, ad-hoc/serverless | Join S3 data với Redshift data |
| Compute | Athena managed/serverless | Redshift + Spectrum layer |
| Câu nhớ | SELECT trên S3 | Redshift đọc external S3 |

### 7. Amazon EMR — big data framework đọc/ghi S3

**Bản chất:** managed big data platform chạy Spark, Hadoop, Hive, Presto/Trino... thường dùng S3 làm storage bền vững.

- HDFS/local disk nhanh nhưng ephemeral theo cluster.
- S3 là durable data lake storage.
- EMR dùng S3A connector cho Hadoop ecosystem tương tác trực tiếp với S3.

**Chọn EMR thay vì Glue khi:**

- Cần kiểm soát cluster/framework sâu.
- Có workload Spark/Hadoop lớn, tuning phức tạp.
- Cần dùng thư viện/custom runtime không tiện trong Glue.

**Câu nhớ:**

> **EMR = xưởng big data tự điều chỉnh nhiều hơn; S3 là kho nguyên liệu và thành phẩm.**

### 8. Amazon QuickSight — dashboard/BI

**Bản chất:** BI service. QuickSight thường không “làm việc với S3 raw” trực tiếp theo kiểu ETL, mà thường đi qua Athena, Redshift, hoặc dataset đã catalog.

**Flow phổ biến:**

```text
S3 curated Parquet → Glue Catalog → Athena → QuickSight dashboard
```

**Câu nhớ:**

> **QuickSight = nhìn data, không dọn data.**

### 9. Amazon DataZone — discovery và data product governance

**Bản chất:** data management/governance service để catalog, discover, share, và govern data across organization.

- Có thể dùng với data lake trên S3, Glue Data Catalog, Lake Formation, Redshift.
- Phù hợp tổ chức lớn muốn data marketplace/data products.

**Phân biệt với Lake Formation:**

| Dịch vụ | Trọng tâm |
|---|---|
| Lake Formation | Fine-grained permission enforcement cho data lake |
| DataZone | Data portal/catalog/business metadata, publish/subscribe data products |

---

## Nhóm event-driven và xử lý object mới

### 1. S3 Event Notifications — S3 phát tín hiệu khi object thay đổi

**Bản chất:** bucket có thể gửi notification khi có event như object created, object removed, restore, replication, lifecycle, tagging, ACL PUT...

Destination được AWS docs liệt kê gồm:

- Amazon SNS topic
- Amazon SQS queue
- AWS Lambda function
- Amazon EventBridge

Lưu ý quan trọng:

- S3 event notifications được thiết kế **at least once**: consumer phải idempotent.
- Thường nhận trong vài giây, nhưng có thể mất một phút hoặc lâu hơn.
- SQS FIFO không được hỗ trợ làm destination trực tiếp; nếu cần FIFO, đi qua EventBridge.
- Tránh loop: Lambda xử lý object rồi ghi lại vào cùng prefix/bucket đang trigger có thể tự kích hoạt vô hạn.

### 2. AWS Lambda — xử lý ngay object mới

**Dùng khi:**

- Tạo thumbnail khi ảnh upload.
- Validate file, extract metadata.
- Parse JSON nhỏ rồi ghi DynamoDB/OpenSearch.
- Gửi cảnh báo nếu file sai format.

**Pattern:**

```text
User upload file → S3 ObjectCreated → Lambda → process → ghi kết quả sang prefix/bucket khác
```

**Không phù hợp nếu:** job quá lâu/nặng, cần cluster Spark, cần xử lý batch lớn. Khi đó dùng Glue/EMR/Batch.

### 3. Amazon SQS — hàng đợi để xử lý ổn định

**Dùng khi:**

- Consumer xử lý chậm hơn tốc độ upload.
- Muốn retry, DLQ, decouple producer/consumer.
- Có nhiều worker đọc queue.

```text
S3 Event → SQS Queue → ECS/Lambda/EC2 workers
```

### 4. Amazon SNS — fan-out thông báo

**Dùng khi:** một event S3 cần gửi tới nhiều subscriber: email, Lambda, SQS queues, HTTP endpoint.

```text
S3 Event → SNS Topic → Lambda A + SQS B + SQS C
```

### 5. Amazon EventBridge — event bus/routing nâng cao

**Dùng khi:**

- Muốn rule-based routing phức tạp.
- Muốn gửi S3 event tới nhiều AWS service targets.
- Muốn tích hợp workflow event-driven toàn hệ thống.
- Cần route tới SQS FIFO gián tiếp.

**Phân biệt nhanh:**

| Dịch vụ | Chọn khi |
|---|---|
| Lambda trực tiếp | Xử lý đơn giản, nhanh, ít consumer |
| SQS | Cần queue, retry, buffer, DLQ |
| SNS | Fan-out notification đơn giản |
| EventBridge | Event bus, routing/filtering/targets nâng cao |

---

## Nhóm ingest, migration và file transfer vào S3

### 1. Amazon Data Firehose — stream data vào S3

**Bản chất:** managed delivery stream. Nhận record từ app/Kinesis/MSK/CloudWatch Logs... rồi buffer và ghi tới destination như S3, Redshift, OpenSearch, Splunk, HTTP endpoint.

Với S3 destination, Firehose có các option đáng nhớ:

- Chọn S3 bucket đích.
- Có thể thêm newline delimiter để Athena query object dễ hơn.
- Dynamic partitioning để ghi theo prefix dựa trên key trong record.
- Multi-record deaggregation.
- Có thể transform bằng Lambda và convert format với Glue schema trong một số cấu hình.

**Câu nhớ:**

> **Firehose = ống nước streaming đổ vào S3.**

### 2. Kinesis Data Streams / Amazon MSK — stream backbone, S3 thường là sink

**Bản chất:** Kinesis Data Streams và MSK/Kafka giữ stream/event log. S3 thường dùng làm long-term storage hoặc data lake sink qua Firehose, Kafka Connect/MSK Connect, hoặc custom consumer.

**Phân biệt:**

| Dịch vụ | Vai trò |
|---|---|
| Kinesis Data Streams / MSK | Stream log để nhiều consumer đọc realtime |
| Firehose | Delivery managed từ stream/source tới S3/destination |
| S3 | Durable lake/archive để query batch/analytics |

### 3. AWS DataSync — copy/sync dữ liệu vào/ra S3

**Bản chất:** data transfer service để chuyển dữ liệu giữa on-premises, edge, cloud khác và AWS storage như S3/EFS/FSx.

**Dùng khi:**

- Migrate file server/NAS lên S3.
- Sync định kỳ dataset từ on-prem vào data lake.
- Transfer lớn nhưng vẫn qua network.

**Không phải:** endpoint SFTP cho partner, không phải mount storage liên tục cho app.

### 4. AWS Transfer Family — SFTP/FTPS/FTP/AS2 vào S3

**Bản chất:** managed file transfer endpoint, hỗ trợ SFTP, FTPS, FTP, AS2 với backend S3 hoặc EFS.

**Dùng khi:**

- Đối tác chỉ gửi file qua SFTP/FTPS/FTP/AS2.
- Cần modernize MFT nhưng không muốn tự quản server.
- B2B file exchange.

**Câu nhớ:**

> **Transfer Family = cửa SFTP/AS2 vào S3.**

### 5. AWS Storage Gateway — app on-prem dùng cloud storage như local

**Bản chất:** hybrid cloud storage appliance. Với **S3 File Gateway**, app on-prem mount NFS/SMB, dữ liệu được lưu thành object trong S3, có local cache.

**Dùng khi:**

- Ứng dụng on-prem cần tiếp tục đọc/ghi qua NFS/SMB.
- Cần cache local và backend cloud.
- Hybrid storage dài hạn, không chỉ migration một lần.

### 6. AWS Snow Family — chuyển dữ liệu bằng thiết bị vật lý

**Bản chất:** thiết bị vật lý để import/export data hoặc edge compute ở nơi network yếu.

**Dùng khi:**

- Dataset quá lớn so với bandwidth.
- Môi trường offline/remote.
- Cần edge compute trước khi ship/import vào S3.

### 7. S3 Transfer Acceleration — tăng tốc object transfer qua edge

**Bản chất:** dùng AWS edge locations để tăng tốc upload/download tới bucket S3, đặc biệt client ở xa Region.

**Dùng khi:**

- Người dùng global upload object lớn tới một bucket Region xa.
- Muốn tối ưu network path mà vẫn dùng S3 API.

### 8. AWS Direct Connect / Site-to-Site VPN — đường mạng, không phải công cụ copy

**Bản chất:** network connectivity tới AWS. Có thể hỗ trợ workload transfer S3 qua private/ổn định hơn, nhưng bản thân không phải dịch vụ ETL/copy.

**Câu nhớ:**

> **Direct Connect là đường cao tốc; DataSync/Transfer/Firehose là xe chở data.**

---

## Nhóm phân phối nội dung và truy cập ứng dụng

### 1. Amazon CloudFront — CDN cho object trong S3

**Bản chất:** CDN cache object ở edge locations, origin thường là S3 bucket.

**Dùng khi:**

- Website tĩnh, image/video/static assets.
- Giảm latency cho user toàn cầu.
- Che S3 origin bằng Origin Access Control (OAC) để bucket không public trực tiếp.

**Câu nhớ:**

> **S3 lưu file, CloudFront đưa file ra gần user.**

### 2. S3 Static Website Hosting — host website tĩnh trực tiếp từ bucket

**Bản chất:** S3 có website endpoint cho static site. Tuy nhiên nếu cần HTTPS custom domain, caching, WAF, global edge, thường dùng CloudFront trước S3.

### 3. API Gateway / Lambda / ECS / EC2 với S3

Ứng dụng thường dùng S3 để:

- Lưu file upload/download.
- Tạo pre-signed URL cho client upload trực tiếp.
- Lưu report/export.
- Lưu model artifact, media, document.

**Pattern tốt:** app cấp pre-signed URL, client upload trực tiếp S3, app nhận event xử lý sau. Tránh proxy file lớn qua app server nếu không cần.

### 4. S3 Object Lambda — biến đổi object lúc đọc

**Bản chất:** dùng Lambda để modify dữ liệu được trả về từ S3 GET, ví dụ redact PII, resize, filter row, watermark.

**Dùng khi:** cần biến đổi theo request mà không muốn tạo nhiều bản copy object.

---

## Nhóm bảo mật, quyền truy cập và governance

### 1. IAM, bucket policy, ACL, Access Points — lớp quyền nền tảng

| Công cụ | Dùng để |
|---|---|
| IAM policy | Cấp quyền cho user/role/service |
| Bucket policy | Resource-based policy trên bucket |
| ACL | Cơ chế cũ, nên hạn chế; dùng Object Ownership/Bucket owner enforced khi có thể |
| S3 Access Points | Tạo endpoint/policy riêng cho app/team/dataset |
| S3 Multi-Region Access Points | Global endpoint tới nhiều bucket Region |
| S3 Access Grants | Cấp quyền S3 theo identity/dataset ở quy mô lớn |

### 2. AWS KMS — mã hóa key-managed

S3 hỗ trợ server-side encryption. Khi dùng SSE-KMS, quyền đọc/ghi object còn cần quyền KMS key tương ứng. Đây là lỗi thường gặp: có `s3:GetObject` nhưng thiếu `kms:Decrypt`.

### 3. AWS Lake Formation — quyền data lake cấp bảng/cột/hàng

IAM/S3 policy giỏi ở bucket/prefix/object. Lake Formation giỏi ở cấp data catalog/table/column/row/cell cho analytics services.

```text
IAM/S3/KMS: “Role này có được đọc object/prefix/key không?”
Lake Formation: “Analyst này có được SELECT cột salary của table employees không?”
```

### 4. Amazon Macie — phát hiện dữ liệu nhạy cảm trong S3

**Bản chất:** dùng ML/pattern matching để discover/classify sensitive data như PII trong S3.

**Dùng khi:**

- Muốn tìm bucket/object chứa dữ liệu nhạy cảm.
- Compliance: PII, tài chính, health records.
- Cảnh báo bucket public hoặc policy rủi ro liên quan dữ liệu nhạy cảm.

### 5. Amazon GuardDuty Malware Protection for S3 — phát hiện malware object upload

GuardDuty có khả năng malware protection cho S3 để scan object mới upload theo cấu hình. Dùng khi bucket nhận file từ user/third-party và cần kiểm tra malware.

### 6. AWS Secrets Manager / Parameter Store

Không lưu secret trong S3 object plain text nếu app cần credential. Dùng Secrets Manager/SSM Parameter Store, còn S3 lưu data artifact/document/report.

---

## Nhóm monitoring, audit, inventory và tối ưu chi phí

### 1. AWS CloudTrail — audit API access

CloudTrail ghi lại API activity. Với S3:

- **Management events**: bucket-level operations như create/delete bucket, put bucket policy.
- **Data events**: object-level operations như GetObject/PutObject, phải bật riêng và có thể tạo nhiều log/cost.

**Câu nhớ:**

> **CloudTrail trả lời: ai gọi API gì, lúc nào, từ đâu?**

### 2. Amazon CloudWatch — metrics, alarms, logs

S3 gửi metrics cơ bản và request metrics tùy cấu hình. CloudWatch dùng để tạo alarm, dashboard, theo dõi errors/latency/request count.

### 3. S3 Storage Lens — nhìn toàn cảnh storage

**Bản chất:** analytics/metrics cho S3 storage usage, activity, cost optimization, security recommendations ở cấp account/org/bucket/prefix tùy cấu hình.

**Câu nhớ:**

> **Storage Lens = kính hiển vi/toàn cảnh cho S3 estate.**

### 4. S3 Inventory — danh sách object theo lịch

**Bản chất:** tạo report định kỳ về object và metadata, ví dụ key, version, size, storage class, encryption status, replication status.

**Dùng khi:**

- Audit hàng triệu/tỷ object mà không muốn LIST trực tiếp liên tục.
- Input manifest cho S3 Batch Operations.
- Query inventory bằng Athena để tìm object cần xử lý.

### 5. S3 Server Access Logging / CloudTrail data events

- **Server Access Logging**: log request tới bucket theo format S3 access log.
- **CloudTrail data events**: audit API object-level chi tiết hơn theo CloudTrail model.

Chọn theo mục tiêu: operational access log hay compliance/audit API.

### 6. AWS Config

Dùng để kiểm tra compliance cấu hình, ví dụ bucket public, encryption, versioning, logging, lifecycle theo rule.

### 7. AWS Backup

Có thể bảo vệ một số workload liên quan AWS storage. Với S3, AWS Backup hỗ trợ backup/restore S3 theo chính sách trong các trường hợp cần quản trị backup tập trung. Nếu chỉ cần versioning/replication/lifecycle, native S3 có thể đủ.

---

## Nhóm thao tác hàng loạt, replication và archive

### 1. S3 Batch Operations — làm việc trên hàng tỷ object

**Bản chất:** chạy một operation trên danh sách object qua manifest hoặc S3 Inventory.

AWS docs nêu Batch Operations có thể xử lý job trên **billions of objects containing exabytes of data**, theo dõi progress, gửi notification và tạo completion report.

Operation thường gặp:

- Copy objects.
- Update server-side encryption.
- Set tags/ACLs.
- Restore từ S3 Glacier Flexible Retrieval.
- Invoke Lambda cho custom action.

**Câu nhớ:**

> **Batch Operations = foreach object ở quy mô cực lớn.**

### 2. S3 Lifecycle — tự động chuyển/xóa theo thời gian

**Bản chất:** rule theo prefix/tag/tuổi object để transition storage class hoặc expire object.

Ví dụ:

```text
0-30 ngày: S3 Standard
31-90 ngày: S3 Standard-IA
> 90 ngày: S3 Glacier Instant/Flexible/Deep Archive
> 7 năm: expire/delete nếu policy cho phép
```

### 3. S3 Replication — copy tự động sang bucket khác

**Bản chất:** replicate object sang bucket khác cùng Region (SRR) hoặc khác Region (CRR).

**Dùng khi:**

- Disaster recovery.
- Compliance yêu cầu bản sao ở account/Region khác.
- Giảm latency đọc ở Region khác.
- Đồng bộ data lake cross-account.

### 4. S3 Versioning và Object Lock

- **Versioning**: giữ nhiều version của object, bảo vệ khỏi overwrite/delete nhầm.
- **Object Lock**: WORM retention/legal hold cho compliance.

### 5. S3 Glacier storage classes

Glacier không còn chỉ là “dịch vụ vault riêng” trong đa số use case S3 hiện đại; bạn thường dùng **S3 Glacier storage classes** qua lifecycle để archive object trong cùng S3 namespace.

---

## Nhóm AI/ML thường dùng S3 làm data store

Nhiều dịch vụ AI/ML dùng S3 làm nơi chứa training data, output, artifact hoặc batch input/output:

| Dịch vụ | S3 thường dùng để |
|---|---|
| Amazon SageMaker AI | Training data, model artifacts, processing output, batch transform input/output |
| Amazon Bedrock | Knowledge base documents, batch inference input/output tùy tính năng |
| Amazon Textract | Input/output tài liệu qua S3 cho async jobs |
| Amazon Rekognition | Image/video input từ S3 trong nhiều workflow |
| Amazon Transcribe | Audio input và transcript output |
| Amazon Comprehend | Document input/output cho batch jobs |

**Mẹo:** Với AI/ML, S3 thường là **dataset/artifact store**, còn service AI/ML là **compute/model/API**.

---

## Các cặp dễ nhầm nhất

### Athena vs Glue

| Athena | Glue |
|---|---|
| Query SQL | ETL + Catalog + Crawler |
| Đọc S3 tại query time | Transform/crawl/prepare data |
| Serverless SQL engine | Serverless data integration/ETL |
| “Hỏi dữ liệu” | “Hiểu và biến đổi dữ liệu” |

### Glue Data Catalog vs Lake Formation

| Glue Data Catalog | Lake Formation |
|---|---|
| Lưu metadata: database/table/column/partition | Quản trị quyền và governance |
| Cho Athena/Redshift/EMR biết data ở đâu | Cho ai được thấy/query gì |
| “Danh bạ” | “Bảo vệ và cấp quyền” |

### Glue vs EMR

| Glue | EMR |
|---|---|
| Serverless ETL managed hơn | Cluster/serverless big data linh hoạt hơn |
| Ít vận hành infrastructure | Nhiều quyền kiểm soát framework/runtime |
| Phù hợp ETL phổ biến | Phù hợp Spark/Hadoop phức tạp, tuning sâu |

### Athena vs Redshift Spectrum

| Athena | Redshift Spectrum |
|---|---|
| Query S3 serverless độc lập | Redshift query external S3 data |
| Tốt cho ad-hoc/data lake SQL | Tốt khi đã có Redshift và cần join data lake |
| Không cần warehouse | Gắn với Redshift ecosystem |

### DataSync vs Transfer Family vs Storage Gateway

| DataSync | Transfer Family | Storage Gateway |
|---|---|---|
| Copy/sync task-based | Managed SFTP/FTPS/FTP/AS2 endpoint | Hybrid storage appliance |
| Migration/replication dữ liệu | Partner/user gửi file bằng protocol cũ | App on-prem mount NFS/SMB/iSCSI/VTL |
| “Chuyển dữ liệu” | “Cửa giao thức file transfer” | “Ổ cloud hiện như local” |

### Firehose vs Lambda Event

| Firehose | S3 Event + Lambda |
|---|---|
| Streaming delivery vào S3 | Object đã vào S3 rồi mới xử lý |
| Buffer, batch, partition stream records | React theo object create/remove |
| “Đường ống đổ data” | “Chuông báo có object mới” |

### CloudTrail vs S3 Inventory vs Storage Lens

| Dịch vụ | Trả lời câu hỏi |
|---|---|
| CloudTrail | Ai gọi API gì vào S3? |
| S3 Inventory | Hiện bucket có những object/version nào? |
| S3 Storage Lens | Dung lượng, usage, cost/security posture đang thế nào? |

---

## Kiến trúc mẫu dễ nhớ

### 1. Data lake analytics cơ bản

```text
App/Logs → S3 raw → Glue Crawler → Glue Data Catalog → Athena → QuickSight
```

- S3 raw: lưu dữ liệu gốc.
- Glue Crawler: tạo metadata.
- Athena: SQL query.
- QuickSight: dashboard.

### 2. Data lake production có ETL và governance

```text
Sources → Firehose/DataSync/Transfer → S3 raw
                                      ↓
                               Glue ETL Jobs
                                      ↓
                              S3 curated Parquet
                                      ↓
                          Glue Catalog + Lake Formation
                                      ↓
                    Athena / Redshift Spectrum / EMR / QuickSight
```

### 3. Upload file và xử lý async

```text
Client → pre-signed URL → S3 uploads/incoming/
                               ↓ ObjectCreated
                            EventBridge
                               ↓
                  SQS queue → Lambda/ECS worker
                               ↓
                     S3 processed/ + DynamoDB metadata
```

### 4. Partner gửi file SFTP vào data lake

```text
Partner SFTP client → AWS Transfer Family → S3 landing/
                                               ↓
                                       S3 Event / Glue Job
                                               ↓
                                          S3 curated/
```

### 5. Static website/media delivery

```text
User browser → CloudFront → private S3 bucket
                    │
                  WAF/OAC/cache
```

---

## Decision tree chọn dịch vụ

```text
Bạn có dữ liệu ở S3 và muốn...

1) Query SQL?
   ├─ Chưa có Redshift / muốn serverless → Athena
   └─ Đã có Redshift, cần join warehouse → Redshift Spectrum

2) Tạo schema/table metadata?
   ├─ Muốn tự viết DDL → Athena/Glue DDL
   └─ Muốn auto scan schema → Glue Crawler

3) Transform dữ liệu?
   ├─ ETL managed/serverless phổ biến → Glue Jobs
   ├─ Spark/Hadoop phức tạp/tuning sâu → EMR
   └─ Xử lý nhỏ ngay khi upload → Lambda

4) Quản quyền data lake?
   ├─ Bucket/object/prefix level → IAM + S3 policy + KMS
   └─ Table/column/row/cell level → Lake Formation

5) Đưa data vào S3?
   ├─ Streaming logs/events → Data Firehose
   ├─ File server/NAS/on-prem sync → DataSync
   ├─ Partner dùng SFTP/AS2 → Transfer Family
   ├─ App on-prem cần mount NFS/SMB → Storage Gateway
   ├─ Dataset quá lớn/offline → Snow Family
   └─ Client global upload/download chậm → S3 Transfer Acceleration

6) Object mới cần phản ứng?
   ├─ Chạy code đơn giản → Lambda
   ├─ Cần buffer/retry/DLQ → SQS
   ├─ Fan-out đơn giản → SNS
   └─ Routing/workflow event bus → EventBridge

7) Theo dõi/bảo mật?
   ├─ Ai gọi API? → CloudTrail
   ├─ Có PII không? → Macie
   ├─ Storage/cost posture? → Storage Lens
   ├─ Danh sách object định kỳ? → S3 Inventory
   └─ Cấu hình có compliant? → AWS Config
```

---

## Mẹo nhớ nhanh

| Tên | Mẹo nhớ |
|---|---|
| **S3** | Cái kho object |
| **Athena** | Người hỏi SQL: “SELECT * FROM S3” |
| **Glue Catalog** | Danh bạ/schema |
| **Glue Crawler** | Con nhện đi đọc file đoán schema |
| **Glue Job** | Nhà máy ETL |
| **Lake Formation** | Bảo vệ data lake |
| **Redshift Spectrum** | Redshift đọc xuyên ra S3 |
| **EMR** | Xưởng Spark/Hadoop lớn |
| **QuickSight** | Dashboard/BI |
| **Firehose** | Ống streaming đổ vào S3 |
| **Lambda** | Công nhân phản ứng khi object mới đến |
| **SQS** | Hàng đợi chống quá tải |
| **SNS** | Loa phát thông báo nhiều nơi |
| **EventBridge** | Tổng đài routing event |
| **DataSync** | Xe tải sync dữ liệu qua mạng |
| **Transfer Family** | Cửa SFTP/AS2 cho partner |
| **Storage Gateway** | Ổ cloud giả local cho on-prem |
| **Snow Family** | Xe container chở data offline |
| **CloudFront** | CDN đưa object ra gần user |
| **Macie** | Máy dò PII trong S3 |
| **CloudTrail** | Camera ghi ai gọi API |
| **Storage Lens** | Kính nhìn usage/cost toàn S3 |
| **Inventory** | Bảng kê object định kỳ |
| **Batch Operations** | For-each hàng tỷ object |
| **Lifecycle** | Robot chuyển kho/lưu trữ/xóa theo tuổi |
| **Replication** | Máy photocopy object sang bucket khác |

---

## Nguồn AWS chính thức

- [Amazon S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html) — S3 gửi event tới SNS, SQS, Lambda, EventBridge; at-least-once delivery; lưu ý loop.
- [Create tables in Athena](https://docs.aws.amazon.com/athena/latest/ug/creating-tables.html) — Athena mô tả schema và S3 location, lưu schema trong AWS Glue Data Catalog, schema-on-read.
- [AWS Glue: Integrating with other AWS services](https://docs.aws.amazon.com/glue/latest/dg/populate-dc-other-services.html) — Lake Formation và Athena dùng/chia sẻ Glue Data Catalog; Athena có thể tạo metadata trong catalog.
- [What is AWS Lake Formation?](https://docs.aws.amazon.com/lake-formation/latest/dg/what-is-lake-formation.html) — governance/fine-grained access control cho S3 data lake và Glue Data Catalog; tích hợp Athena, QuickSight, Redshift Spectrum, EMR, Glue.
- [Amazon Redshift Spectrum overview](https://docs.aws.amazon.com/redshift/latest/dg/c-spectrum-overview.html) — Redshift query external S3 tables qua external catalog, predicate/aggregation pushdown, partition benefits.
- [Amazon EMR storage and file systems](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-file-systems.html) — EMR/Hadoop dùng HDFS và S3A; S3A cho Hadoop ecosystem tương tác với S3.
- [Amazon Data Firehose destination settings](https://docs.aws.amazon.com/firehose/latest/dev/create-destination.html) — Firehose S3 destination, newline delimiter, dynamic partitioning, deaggregation.
- [AWS Transfer Family: What is AWS Transfer Family?](https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html) — managed SFTP/FTPS/FTP/AS2 với S3/EFS.
- [AWS DataSync: Transferring to or from AWS storage](https://docs.aws.amazon.com/datasync/latest/userguide/transferring-aws-storage.html) — DataSync transfer giữa S3, EFS, FSx và nguồn khác.
- [S3 Batch Operations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/batch-ops.html) — thao tác hàng loạt trên billions of objects/exabytes, manifest, completion report.
- [Logging and monitoring in Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/monitoring-overview.html) — CloudTrail, GuardDuty, Storage Lens, CloudWatch, S3 Inventory cho monitoring.
