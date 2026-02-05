# RDS Read-Write Splitting Patterns

## Mục lục

- [Tổng quan](#tổng-quan)
- [Sync vs Async Replication](#sync-vs-async-replication)
- [Multi-AZ Cluster: 2 Endpoints](#multi-az-cluster-2-endpoints)
- [Read Replicas: Multiple Endpoints](#read-replicas-multiple-endpoints)
- [Spring Boot Implementation](#spring-boot-implementation)
- [Stale Read Problem](#stale-read-problem)
- [Best Practices](#best-practices)

---

## Tổng quan

RDS có nhiều cách để scale reads và đảm bảo high availability, mỗi cách có cách sử dụng endpoints khác nhau:

| Deployment | Endpoints | Load Balance |
|------------|-----------|--------------|
| **Single-AZ** | 1 | - |
| **Multi-AZ Instance** | 1 | AWS (failover) |
| **Multi-AZ Cluster** | 2 (Writer + Reader) | AWS tự động |
| **Read Replicas** | 1 + N (mỗi replica 1 EP) | Tự làm |

---

## Sync vs Async Replication

### Synchronous Replication (Multi-AZ Standby)

```
App ──► PRIMARY ──────────────────────► STANDBY
           │                               │
           │  1. Write data                │
           │  2. Gửi data đến Standby      │
           │  3. ĐỢI Standby confirm ◄─────┤
           │  4. Return SUCCESS cho App    │

✅ Data 100% giống nhau giữa Primary và Standby
✅ Không mất data khi failover
❌ Write CHẬM hơn (phải đợi Standby confirm)
```

### Asynchronous Replication (Read Replica)

```
App ──► PRIMARY ──────────────────────► REPLICA
           │                               │
           │  1. Write data                │
           │  2. Return SUCCESS ngay ◄─────┤ (KHÔNG đợi)
           │  3. Gửi data đến Replica      │
           │     (background, SAU đó)      │

✅ Write NHANH (không đợi Replica)
✅ Có thể cross-region
❌ Replica có thể LAG (data cũ hơn Primary)
❌ Có thể mất data nếu Primary chết trước khi replicate
```

### So sánh

| | Multi-AZ Standby | Multi-AZ Cluster Readers | Read Replica |
|--|------------------|--------------------------|--------------|
| **Có thể đọc?** | ❌ KHÔNG | ✅ CÓ | ✅ CÓ |
| **Replication** | **Sync** | **Semi-sync** (~10-20ms) | **Async** (seconds-minutes) |
| **Auto failover?** | ✅ Có | ✅ Có | ❌ Không (manual) |
| **Mục đích** | HA only | HA + Read scaling | Read scaling |

---

## Multi-AZ Cluster: 2 Endpoints

```
WRITER ENDPOINT:
mydb.cluster-abc123.ap-southeast-2.rds.amazonaws.com
→ Luôn trỏ đến WRITER instance
→ Dùng cho: INSERT, UPDATE, DELETE

READER ENDPOINT:
mydb.cluster-ro-abc123.ap-southeast-2.rds.amazonaws.com
→ Load balance giữa 2 READERS (tự động)
→ Dùng cho: SELECT
```

### Traffic Flow

```
App Server
    │
    ├── Writes ──────────► WRITER ENDPOINT ──────► Writer Instance
    │
    └── Reads ───────────► READER ENDPOINT ──┬──► Reader 1
                           (load balanced)   └──► Reader 2
```

### Khi nào dùng endpoint nào?

| Operation | Dùng Endpoint nào? | Tại sao? |
|-----------|-------------------|----------|
| `INSERT`, `UPDATE`, `DELETE` | **WRITER** | Chỉ Writer mới ghi được |
| `SELECT` general (listings, reports) | **READER** | Phân tải, chấp nhận lag nhỏ |
| `SELECT` ngay sau `WRITE` | **WRITER** | Tránh stale read |

---

## Read Replicas: Multiple Endpoints

```
PRIMARY:
mydb.abc123.ap-southeast-2.rds.amazonaws.com

READ REPLICA 1:
mydb-replica-1.abc123.ap-southeast-2.rds.amazonaws.com

READ REPLICA 2:
mydb-replica-2.abc123.ap-southeast-2.rds.amazonaws.com

⚠️ KHÔNG có Reader Endpoint chung như Multi-AZ Cluster!
→ Bạn phải tự load balance giữa các replicas
```

### Giải pháp Load Balancing cho Read Replicas

| Giải pháp | Khi nào dùng? |
|-----------|---------------|
| **RDS Proxy** | Serverless (Lambda), cần connection pooling |
| **Route 53 Weighted** | Multi-region, DNS-based routing |
| **Application-level** | Đơn giản, ít replicas |

#### RDS Proxy (Recommended)

```
Lambda ──► RDS Proxy (read endpoint) ──┬──► Replica 1
                                       ├──► Replica 2
                                       └──► Replica 3

RDS Proxy tự động:
• Connection pooling
• Load balancing
• Health checks
```

#### Route 53 Weighted Routing

```hcl
# Terraform example
resource "aws_route53_record" "read_replicas" {
  count   = 3
  zone_id = aws_route53_zone.main.zone_id
  name    = "read.mydb.example.com"
  type    = "CNAME"
  
  weighted_routing_policy {
    weight = 1
  }
  
  set_identifier = "replica-${count.index}"
  records        = [aws_db_instance.replica[count.index].address]
}
```

---

## Spring Boot Implementation

### application.yml

```yaml
spring:
  datasource:
    writer:
      url: jdbc:mysql://mydb.cluster-xxx.rds.amazonaws.com:3306/mydb
      username: admin
      password: ${DB_PASSWORD}
      hikari:
        pool-name: writer-pool
        maximum-pool-size: 10

    reader:
      url: jdbc:mysql://mydb.cluster-ro-xxx.rds.amazonaws.com:3306/mydb
      username: admin
      password: ${DB_PASSWORD}
      hikari:
        pool-name: reader-pool
        maximum-pool-size: 20
```

### DataSource Config

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.writer")
    public DataSource writerDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.reader")
    public DataSource readerDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public DataSource routingDataSource(
            @Qualifier("writerDataSource") DataSource writer,
            @Qualifier("readerDataSource") DataSource reader) {
        
        RoutingDataSource routing = new RoutingDataSource();
        Map<Object, Object> dataSources = new HashMap<>();
        dataSources.put(DataSourceType.WRITER, writer);
        dataSources.put(DataSourceType.READER, reader);
        
        routing.setTargetDataSources(dataSources);
        routing.setDefaultTargetDataSource(writer);
        return routing;
    }
}
```

### Custom @ReadOnly Annotation

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ReadOnly {}

@Aspect
@Component
public class DataSourceAspect {

    @Before("@annotation(ReadOnly)")
    public void setReadDataSource() {
        DataSourceContextHolder.setDataSourceType(DataSourceType.READER);
    }

    @After("@annotation(ReadOnly)")
    public void clearDataSource() {
        DataSourceContextHolder.clear();
    }
}
```

### Service Usage

```java
@Service
public class OrderService {

    // WRITE → dùng WRITER (default)
    @Transactional
    public Order createOrder(Long userId, Long productId, int quantity) {
        return orderRepository.save(new Order(...));
    }

    // READ → dùng READER
    @ReadOnly
    @Transactional(readOnly = true)
    public List<Product> getProducts(String category) {
        return productRepository.findByCategory(category);
    }

    // WRITE + READ ngay sau → dùng WRITER cho cả 2
    @Transactional
    public User updateProfile(Long userId, String newName) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setName(newName);
        return userRepository.save(user);  // Trả về từ WRITER
    }
}
```

---

## Stale Read Problem

Với Async Replication (Read Replica), có thể xảy ra **Stale Read**:

```
T+0ms    User WRITES: UPDATE balance = 1000
T+1ms    Write SUCCESS ✅
T+2ms    User READS từ REPLICA: balance = 500 ❌ (data CŨ!)
T+50ms   Replication arrives: balance = 1000 ✅
```

### Giải quyết

| Read Type | Đọc từ đâu? |
|-----------|-------------|
| User vừa update → xem lại | **Primary/Writer** |
| Dashboard analytics | **Replica/Reader** (chấp nhận lag) |
| Order vừa đặt → xem status | **Primary/Writer** |
| Product listing | **Replica/Reader** |

---

## Best Practices

1. **Multi-AZ Cluster > Read Replicas** nếu cần cả HA và Read scaling với auto load balance

2. **Read-after-write từ Writer** để tránh stale read

3. **Connection pooling riêng** cho mỗi endpoint

4. **RDS Proxy** cho Serverless (Lambda) workloads

5. **Aurora** nếu chưa chọn engine - có sẵn Reader endpoint tự động

---

## Exam Tips

- **Standby = Sync, Read Replica = Async**
- **Multi-AZ Cluster** có 2 endpoints (Writer + Reader)
- **Read Replicas** không có chung Reader endpoint
- **RDS Proxy** hoặc **Route 53** để load balance Read Replicas
- **Aurora** có sẵn Reader endpoint như Multi-AZ Cluster
