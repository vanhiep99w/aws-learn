# AWS Application Discovery Service


## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Discovery Methods](#2-discovery-methods)
- [3. Dữ liệu thu thập được](#3-dữ-liệu-thu-thập-được)
- [4. Tích hợp Migration Hub](#4-tích-hợp-migration-hub)
- [5. So sánh với các dịch vụ liên quan](#5-so-sánh-với-các-dịch-vụ-liên-quan)
- [6. Pricing](#6-pricing)
- [7. Exam Tips](#7-exam-tips)
- [8. Tài liệu tham khảo](#8-tài-liệu-tham-khảo)

---

## 1. Tổng quan

**AWS Application Discovery Service** giúp bạn **khám phá (discover) và thu thập thông tin** về các servers, VMs, databases đang chạy trên on-premises — để **lập kế hoạch migration** lên AWS.

### Vấn đề nó giải quyết

```
Bạn muốn migrate 500 servers lên AWS:
  😰 "Mình có bao nhiêu server? Chạy gì? CPU/RAM bao nhiêu?
       Server nào kết nối với server nào? Migrate cái nào trước?"
  → Application Discovery Service giúp TRẢ LỜI tất cả câu hỏi này
```

| Vấn đề | Giải pháp |
|---|---|
| Không biết có bao nhiêu servers | **Auto-discover** tất cả VMs trong VMware vCenter |
| Không biết server config (CPU, RAM, disk) | **Thu thập** configuration data tự động |
| Không biết server nào liên kết với nhau | **Map dependencies** — network connections giữa servers |
| Không biết utilization thực tế | **Thu thập metrics**: CPU usage, memory, disk I/O |
| Migrate cái nào trước? | **Group servers** thành applications trong Migration Hub |

---

## 2. Discovery Methods

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     2 Phương pháp Discovery                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐    │
│  │  🔍 AGENTLESS DISCOVERY         │  │  🔍 AGENT-BASED DISCOVERY       │    │
│  │  ────────────────────────────── │  │  ────────────────────────────── │    │
│  │                                 │  │                                 │    │
│  │  Cài đặt: Agentless Collector   │  │  Cài đặt: Discovery Agent       │    │
│  │  (OVA file trên VMware vCenter) │  │  (install trên MỖI server)      │    │
│  │                                 │  │                                 │    │
│  │  Thu thập:                      │  │  Thu thập:                      │    │
│  │  • VM inventory                 │  │  • Tất cả của Agentless         │    │
│  │  • Server hostnames, IPs        │  │  • + Network connections đầy đủ │    │
│  │  • CPU, RAM, disk config        │  │  • + Running processes          │    │
│  │  • Utilization metrics          │  │  • + System performance (chi    │    │
│  │  • Database inventory           │  │    tiết theo time-series)       │    │
│  │                                 │  │                                 │    │
│  │  ✅ Không cần install trên      │  │  ✅ Data chi tiết hơn nhiều     │    │
│  │     từng server                 │  │  ✅ Map dependencies chính xác  │    │
│  │  ✅ Nhanh, dễ deploy            │  │  ❌ Phải install trên MỖI       │    │
│  │  ❌ Data ít chi tiết hơn        │  │     server (tốn thời gian)      │    │
│  │                                 │  │                                 │    │
│  │  Best for:                      │  │  Best for:                      │    │
│  │  → Bước đầu khảo sát nhanh      │  │  → Phân tích sâu, cần biết      │    │
│  │  → VMware environments          │  │     dependencies chính xác      │    │
│  └─────────────────────────────────┘  └─────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### So sánh 2 methods

| Feature | Agentless | Agent-based |
|---|---|---|
| **Cài đặt** | 1 Collector OVA trên vCenter | Agent trên MỖI server |
| **OS support** | VMware VMs | Windows + Linux |
| **Config data** | ✅ Hostname, CPU, RAM, disk | ✅ Hostname, CPU, RAM, disk |
| **Utilization metrics** | ✅ Cơ bản | ✅ Chi tiết (time-series) |
| **Network connections** | ✅ Cơ bản (2024 update) | ✅ Đầy đủ (inbound + outbound) |
| **Running processes** | ❌ | ✅ |
| **Database discovery** | ✅ (Oracle, SQL Server, MySQL, PostgreSQL) | ❌ |
| **Effort** | Thấp | Cao (install từng server) |
| **Best for** | Quick scan, VMware | Deep analysis, dependencies |

---

## 3. Dữ liệu thu thập được

### Ví dụ thực tế

Sau khi chạy Discovery, bạn sẽ biết:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Discovery Results Example                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Server: web-server-01                                                       │
│  ├── OS: Ubuntu 20.04                                                        │
│  ├── CPU: 4 vCPU (avg usage: 35%)                                            │
│  ├── RAM: 16 GB (avg usage: 60%)                                             │
│  ├── Disk: 200 GB SSD (avg usage: 45%)                                       │
│  ├── Network:                                                                │
│  │   ├── → app-server-01:8080 (100 req/s)                                    │
│  │   ├── → db-server-01:3306 (50 queries/s)                                  │
│  │   └── ← load-balancer:443                                                 │
│  └── Processes: nginx, node, pm2                                             │
│                                                                              │
│  → Recommendation: Migrate to t3.large (4 vCPU, 16GB)                        │
│  → Dependencies: PHẢI migrate cùng app-server-01 và db-server-01             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Tích hợp Migration Hub

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Discovery → Migration Hub → Migrate                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: Discover                                                            │
│  ┌────────────────────────────────────────────┐                              │
│  │  Application Discovery Service             │                              │
│  │  → Collect server data from on-premises    │                              │
│  └─────────────────────┬──────────────────────┘                              │
│                        ▼                                                     │
│  STEP 2: Plan                                                                │
│  ┌────────────────────────────────────────────┐                              │
│  │  AWS Migration Hub                         │                              │
│  │  → View discovered servers                 │                              │
│  │  → Group into applications                 │                              │
│  │  → Plan migration waves                    │                              │
│  └─────────────────────┬──────────────────────┘                              │
│                        ▼                                                     │
│  STEP 3: Migrate                                                             │
│  ┌────────────────────────────────────────────┐                              │
│  │  Migration Tools:                          │                              │
│  │  • AWS MGN (Application Migration Service) │                              │
│  │  • AWS DMS (Database Migration Service)    │                              │
│  │  • AWS SMS (Server Migration Service)      │                              │
│  └────────────────────────────────────────────┘                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Application Discovery Service **chỉ discover và plan** — nó KHÔNG migrate. Migrate dùng **AWS MGN** (servers) hoặc **AWS DMS** (databases). Data từ Discovery Service được hiển thị trong **Migration Hub** để bạn plan migration.

---

## 5. So sánh với các dịch vụ liên quan

| Service | Chức năng | Phase |
|---|---|---|
| **Application Discovery Service** | Discover servers, collect config + utilization data | **Discover & Plan** |
| **AWS Migration Hub** | Dashboard tổng hợp, track migration progress | **Plan & Track** |
| **AWS MGN** (Application Migration) | Lift-and-shift servers lên AWS | **Migrate** |
| **AWS DMS** (Database Migration) | Migrate databases | **Migrate** |
| **AWS Transform** (successor) | Kế thừa Discovery Service + AI-enhanced (2025+) | **Discover & Plan** |

```
Migration Journey:

  On-Premises                                              AWS Cloud
  ───────────                                              ─────────
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ Discover │ ──► │   Plan   │ ──► │ Migrate  │ ──► │ Optimize │
  │          │     │          │     │          │     │          │
  │ Discovery│     │Migration │     │ MGN      │     │ Compute  │
  │ Service  │     │ Hub      │     │ DMS      │     │ Optimizer│
  └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

---

## 6. Pricing

| Component | Cost |
|---|---|
| **Application Discovery Service** | **FREE** |
| **Data storage** | Free (stored in Migration Hub) |

> [!NOTE]
> Dịch vụ hoàn toàn miễn phí. Bạn chỉ cần deploy Agentless Collector hoặc install Agent.

---

## 7. Exam Tips

1. **Application Discovery Service** = "discover on-premises servers để plan migration" → chọn khi đề nói "plan migration", "understand on-premises environment"
2. **2 methods**: Agentless (VMware OVA, nhanh, ít data) vs Agent-based (install từng server, nhiều data, dependencies)
3. **Chỉ DISCOVER, không MIGRATE** — migrate dùng AWS MGN hoặc DMS
4. Data được lưu trong **Migration Hub** home Region
5. Thu thập: server config, utilization metrics, network dependencies, running processes (agent-based only)
6. **FREE service**
7. Agent-based cho nhiều data hơn: **network connections + running processes** — quan trọng để hiểu app dependencies
8. Khi đề hỏi "understand dependencies between servers" → **Agent-based discovery**
9. Khi đề hỏi "quick inventory of VMware VMs" → **Agentless discovery**

---

## 8. Tài liệu tham khảo

- [AWS Application Discovery Service Documentation](https://docs.aws.amazon.com/application-discovery/)
- [Agentless Collector User Guide](https://docs.aws.amazon.com/application-discovery/latest/userguide/agentless-collector.html)
- [Discovery Agent User Guide](https://docs.aws.amazon.com/application-discovery/latest/userguide/discovery-agent.html)
- [AWS Migration Hub](https://docs.aws.amazon.com/migrationhub/)
- [AWS Disaster Recovery & Migration Overview](aws-disaster-recovery-migration-overview.md)
