# AWS AppConfig

## Mục lục

- [Tổng quan](#tổng-quan)
- [1. Vấn đề AppConfig giải quyết](#1-vấn-đề-appconfig-giải-quyết)
- [2. Kiến trúc và Components](#2-kiến-trúc-và-components)
- [3. Configuration Types](#3-configuration-types)
- [4. Deployment Strategies](#4-deployment-strategies)
- [5. Feature Flags](#5-feature-flags)
- [6. So sánh với các services khác](#6-so-sánh-với-các-services-khác)
- [7. Use Cases](#7-use-cases)
- [8. Exam Tips](#8-exam-tips)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**AWS AppConfig** là một service thuộc **AWS Systems Manager** giúp bạn:
- **Quản lý application configuration** một cách an toàn
- **Deploy configuration changes** mà KHÔNG cần redeploy application
- **Feature flags** - bật/tắt features động
- **Gradual rollout** - triển khai config dần dần với validation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           AWS AppConfig                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   "Deploy configuration changes SAFELY without code deployment"             │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   TRƯỚC (không có AppConfig):                                       │   │
│   │   ─────────────────────────────                                     │   │
│   │   Config thay đổi → Phải redeploy app → Downtime risk              │   │
│   │                                                                     │   │
│   │   SAU (có AppConfig):                                               │   │
│   │   ──────────────────                                                │   │
│   │   Config thay đổi → AppConfig deploy → App pull config             │   │
│   │                    → Gradual rollout → Validation                   │   │
│   │                    → Rollback nếu lỗi                               │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Vấn đề AppConfig giải quyết

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Problems Solved by AppConfig                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ❌ VẤN ĐỀ TRUYỀN THỐNG:                                                    │
│   ─────────────────────────                                                  │
│   1. Config trong code → Phải rebuild + redeploy                            │
│   2. Config trong env vars → Phải restart container/instance                │
│   3. Config sai → App crash, không có rollback                              │
│   4. Feature release → All-or-nothing, không gradual                        │
│   5. Không validate → Config sai format gây lỗi runtime                     │
│                                                                              │
│   ✅ APPCONFIG GIẢI QUYẾT:                                                   │
│   ─────────────────────────                                                  │
│   1. ✅ Dynamic config update - không cần redeploy                          │
│   2. ✅ Gradual deployment - 10% → 50% → 100%                               │
│   3. ✅ Automatic rollback - nếu CloudWatch alarm triggered                 │
│   4. ✅ Validation - JSON Schema, Lambda validator                          │
│   5. ✅ Feature flags - enable/disable features dynamically                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kiến trúc và Components

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AppConfig Architecture                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          APPLICATION                                │   │
│   │   (logical grouping - e.g., "MyWebApp")                            │   │
│   │                                                                     │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│   │   │ ENVIRONMENT  │  │ ENVIRONMENT  │  │ ENVIRONMENT  │            │   │
│   │   │   "dev"      │  │   "staging"  │  │   "prod"     │            │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘            │   │
│   │                                                                     │   │
│   │   ┌──────────────────────────────────────────────────────────────┐ │   │
│   │   │               CONFIGURATION PROFILE                          │ │   │
│   │   │   (what config to deploy)                                    │ │   │
│   │   │                                                              │ │   │
│   │   │   ┌────────────────────────────────────────────────────────┐│ │   │
│   │   │   │  Configuration Source:                                 ││ │   │
│   │   │   │  • SSM Parameter Store                                 ││ │   │
│   │   │   │  • SSM Documents                                       ││ │   │
│   │   │   │  • S3 bucket                                           ││ │   │
│   │   │   │  • AppConfig Hosted Configuration                      ││ │   │
│   │   │   └────────────────────────────────────────────────────────┘│ │   │
│   │   │                                                              │ │   │
│   │   │   ┌────────────────────────────────────────────────────────┐│ │   │
│   │   │   │  Validators (optional):                                ││ │   │
│   │   │   │  • JSON Schema                                         ││ │   │
│   │   │   │  • Lambda function                                     ││ │   │
│   │   │   └────────────────────────────────────────────────────────┘│ │   │
│   │   └──────────────────────────────────────────────────────────────┘ │   │
│   │                                                                     │   │
│   │   ┌──────────────────────────────────────────────────────────────┐ │   │
│   │   │               DEPLOYMENT STRATEGY                            │ │   │
│   │   │   (how to deploy - gradual rollout)                          │ │   │
│   │   └──────────────────────────────────────────────────────────────┘ │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Components summary:

| Component | Mô tả |
|-----------|-------|
| **Application** | Logical grouping (ví dụ: tên app) |
| **Environment** | dev, staging, prod |
| **Configuration Profile** | Config gì, lấy từ đâu, validate như nào |
| **Deployment Strategy** | Deploy như thế nào (gradual, immediate) |

---

## 3. Configuration Types

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                       Configuration Sources                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. APPCONFIG HOSTED CONFIGURATION:                                         │
│      ─────────────────────────────────                                       │
│      • Lưu trực tiếp trong AppConfig                                        │
│      • Max 1MB per config                                                    │
│      • JSON, YAML, or text                                                   │
│      • ✅ Recommended cho feature flags                                      │
│                                                                              │
│   2. SSM PARAMETER STORE:                                                    │
│      ────────────────────                                                    │
│      • Dùng existing parameters                                              │
│      • Tích hợp với SSM ecosystem                                           │
│      • Standard (4KB) or Advanced (8KB)                                      │
│                                                                              │
│   3. SSM DOCUMENT:                                                           │
│      ─────────────                                                           │
│      • Dùng SSM Documents                                                    │
│      • JSON or YAML                                                          │
│                                                                              │
│   4. S3:                                                                     │
│      ────                                                                    │
│      • Cho large configurations                                              │
│      • Bất kỳ format nào                                                    │
│      • Max object size của S3                                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Deployment Strategies

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Deployment Strategies                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. ALL AT ONCE (Immediate):                                                │
│      ─────────────────────────                                               │
│      Deploy 100% ngay lập tức                                               │
│      • Bake time: 0 minutes                                                 │
│      • Use case: Dev/Test environments                                      │
│                                                                              │
│   2. LINEAR:                                                                 │
│      ────────                                                                │
│      Tăng dần đều theo %                                                    │
│      • Linear50PercentEvery30Seconds                                        │
│      • 0% → 50% → 100% (mỗi 30s)                                           │
│                                                                              │
│   3. EXPONENTIAL:                                                            │
│      ─────────────                                                           │
│      Tăng theo hàm mũ                                                       │
│      • Exponential10PercentEvery1Minute                                     │
│      • 10% → 20% → 40% → 80% → 100%                                        │
│      • ✅ Recommended cho Production                                        │
│                                                                              │
│   Timeline Example (Exponential):                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Time:    0m      1m      2m      3m      4m      5m               │   │
│   │           │       │       │       │       │       │                │   │
│   │  %:      10%     20%     40%     80%    100%    ──                 │   │
│   │           │       │       │       │       │                        │   │
│   │           └───────┴───────┴───────┴───────┘                        │   │
│   │                                                                     │   │
│   │  → Nếu CloudWatch alarm → Automatic ROLLBACK!                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Built-in Strategies:

| Strategy | Growth Factor | Final Bake Time |
|----------|---------------|-----------------|
| **AllAtOnce** | 100% | 0 min |
| **Linear50PercentEvery30Seconds** | 50% mỗi 30s | 1 min |
| **Canary10Percent20Minutes** | 10% → 100% | 20 min |
| **Exponential10PercentEvery1Minute** | Exponential 10% | 0 min |

### "% Deployment" nghĩa là gì?

> [!IMPORTANT]
> **% trong AppConfig = % THỜI GIAN, KHÔNG PHẢI % instances!**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│              % Deployment = Thời gian chờ để monitor                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ❌ HIỂU SAI: 20% instances nhận config mới, 80% nhận config cũ            │
│                                                                              │
│   ✅ HIỂU ĐÚNG:                                                              │
│   • Sau 20% thời gian → Config MỚI đã available                             │
│   • TẤT CẢ instances poll → Nhận config MỚI                                 │
│   • AppConfig CHỜ thêm thời gian để MONITOR                                 │
│   • % tiếp theo = checkpoint để kiểm tra alarms                             │
│                                                                              │
│   VÍ DỤ: 10 EC2 instances, deployment time = 20 phút                        │
│   ─────────────────────────────────────────────────                          │
│                                                                              │
│   T=0:     AppConfig bắt đầu deployment                                     │
│   T=0-30s: Tất cả 10 instances poll → Nhận config MỚI ngay                 │
│   T=0-4m:  AppConfig monitor (20% time checkpoint)                          │
│            → Có alarm? Rollback! Không alarm? Tiếp tục                      │
│   T=4-8m:  Monitor (40% checkpoint)                                          │
│   ...                                                                        │
│   T=20m:   100% complete, deployment finalized                              │
│                                                                              │
│   → % là THỜI GIAN chờ monitor, KHÔNG phải traffic split!                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### App lấy config như thế nào?

```
┌──────────────────────────────────────────────────────────────────────────────┐
│              3 cách App lấy config từ AppConfig                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ⚠️ KHÔNG dùng SSM Agent! AppConfig có cách riêng:                         │
│                                                                              │
│   1️⃣ APPCONFIG AGENT (Recommended cho EC2/ECS)                              │
│   ────────────────────────────────────────────                               │
│   • Agent RIÊNG, KHÁC với SSM Agent                                         │
│   • Caching + polling tự động                                               │
│                                                                              │
│   ┌─────────────────┐    localhost:2772    ┌─────────────────┐              │
│   │   Your App      │ ◄─────────────────── │ AppConfig Agent │              │
│   └─────────────────┘                       └────────┬────────┘              │
│                                                      │ polling               │
│                                             ┌────────▼────────┐              │
│                                             │ AppConfig API   │              │
│                                             └─────────────────┘              │
│                                                                              │
│   2️⃣ LAMBDA EXTENSION (Cho Lambda)                                          │
│   ──────────────────────────────────                                         │
│   • Lambda layer, không cần agent                                           │
│   • Tự động cache config                                                    │
│                                                                              │
│   3️⃣ DIRECT API CALL (Simple cases)                                         │
│   ────────────────────────────────                                           │
│   • App gọi thẳng GetConfiguration API                                      │
│   • Phải tự handle caching                                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Auto Rollback hoạt động như thế nào?

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Auto Rollback                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AppConfig KHÔNG "hiểu" logs!                                              │
│   Chỉ watch CloudWatch ALARMS mà BẠN setup trước.                           │
│                                                                              │
│   Logic đơn giản:                                                           │
│   ────────────────                                                           │
│   Đang deploy + Alarm triggered = GIẢ ĐỊNH là do config mới → ROLLBACK     │
│                                                                              │
│   VÍ DỤ:                                                                    │
│   ───────                                                                    │
│   BẠN setup alarm: "Error rate > 5% → trigger"                             │
│   BẠN config AppConfig: "Monitor alarm này khi deploy"                      │
│                                                                              │
│   T=0:  Start deployment                                                    │
│   T=3m: Error rate tăng 1% → 8%                                             │
│         CloudWatch: ALARM!                                                   │
│         AppConfig: "Có alarm trong khi deploy → ROLLBACK!"                  │
│   T=3m: Tất cả instances poll → Nhận lại config CŨ                          │
│                                                                              │
│   ⚠️ LƯU Ý:                                                                 │
│   • AppConfig KHÔNG biết error có phải do config hay không                  │
│   • Chỉ dựa vào correlation (trùng hợp thời gian)                          │
│   • Philosophy: "Better safe than sorry" - rollback trước, điều tra sau    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### So sánh với Canary Deployment (CodeDeploy)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│             Canary Deployment vs AppConfig Deployment                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   GIỐNG NHAU:                                                               │
│   • Gradual rollout                                                         │
│   • Monitor metrics                                                         │
│   • Auto rollback nếu lỗi                                                  │
│                                                                              │
│   KHÁC NHAU:                                                                │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│   CANARY (CodeDeploy/Lambda):                                               │
│   ──────────────────────────                                                 │
│   Deploy: CODE mới                                                          │
│   Cơ chế: Route % TRAFFIC đến version mới                                  │
│                                                                              │
│        10% traffic → v2.0 (new code)                                        │
│        90% traffic → v1.0 (old code)                                        │
│                                                                              │
│   → Có 2 versions chạy song song                                           │
│   → 10% users thấy app mới, 90% thấy app cũ                                │
│                                                                              │
│   ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│   APPCONFIG:                                                                 │
│   ──────────                                                                 │
│   Deploy: CONFIG mới (không phải code)                                      │
│   Cơ chế: Rollout theo THỜI GIAN                                           │
│                                                                              │
│        Tất cả instances → Cùng code, CONFIG mới                            │
│        % = thời gian chờ monitor                                            │
│                                                                              │
│   → 1 version code, config mới                                              │
│   → Tất cả users thấy cùng app với config mới                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| | Canary (CodeDeploy) | AppConfig |
|--|---------------------|-----------|
| **Deploy cái gì?** | CODE | CONFIG |
| **% nghĩa là?** | % traffic | % thời gian |
| **Có 2 versions song song?** | ✅ Có | ❌ Không |
| **Traffic split?** | ✅ Có | ❌ Không |
| **Rollback như nào?** | Shift traffic | Instances poll config cũ |

> [!TIP]
> - **Canary** = Deploy CODE, split TRAFFIC
> - **AppConfig** = Deploy CONFIG, split THỜI GIAN
> - Có thể dùng CẢ HAI: Deploy code bằng Canary, bật feature bằng AppConfig!

## 5. Feature Flags

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Feature Flags                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Feature flags = Bật/tắt features động mà KHÔNG cần redeploy code         │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Feature Flag Configuration Example:                                │   │
│   │                                                                     │   │
│   │  {                                                                  │   │
│   │    "feature_dark_mode": {                                          │   │
│   │      "enabled": true                                                │   │
│   │    },                                                               │   │
│   │    "feature_new_checkout": {                                       │   │
│   │      "enabled": false,                                             │   │
│   │      "rollout_percentage": 25                                      │   │
│   │    },                                                               │   │
│   │    "max_items_cart": 50                                            │   │
│   │  }                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   Use Cases:                                                                 │
│   ──────────                                                                 │
│   • Dark launch - deploy code nhưng feature TẮT                             │
│   • A/B testing - bật feature cho % users                                   │
│   • Kill switch - tắt feature ngay nếu có bug                               │
│   • Gradual rollout - 10% → 50% → 100% users                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. So sánh với các services khác

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AppConfig vs Other Services                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   APPCONFIG vs SSM PARAMETER STORE:                                          │
│   ───────────────────────────────────                                        │
│   Parameter Store: Chỉ LƯU config                                           │
│   AppConfig:       Lưu + DEPLOY config với validation + rollback            │
│                                                                              │
│   APPCONFIG vs SECRETS MANAGER:                                              │
│   ───────────────────────────────                                            │
│   Secrets Manager: Lưu SECRETS (passwords, API keys) + rotation             │
│   AppConfig:       Lưu APP CONFIG (feature flags, settings)                 │
│                                                                              │
│   APPCONFIG vs LAMBDA ENVIRONMENT VARIABLES:                                 │
│   ────────────────────────────────────────────                               │
│   Env Vars:  Static, phải redeploy Lambda                                   │
│   AppConfig: Dynamic, update runtime không cần redeploy                     │
│                                                                              │
│   APPCONFIG vs CODEDEPLOY:                                                   │
│   ─────────────────────────                                                  │
│   CodeDeploy: Deploy CODE                                                   │
│   AppConfig:  Deploy CONFIG (không cần rebuild code)                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Feature | AppConfig | Parameter Store | Secrets Manager |
|---------|-----------|-----------------|-----------------|
| **Mục đích** | Config deployment | Config storage | Secret storage |
| **Gradual rollout** | ✅ | ❌ | ❌ |
| **Validation** | ✅ | ❌ | ❌ |
| **Auto rollback** | ✅ | ❌ | ❌ |
| **Feature flags** | ✅ | ❌ | ❌ |
| **Rotation** | ❌ | ❌ | ✅ |
| **Encryption** | ✅ | ✅ | ✅ |

---

## 7. Use Cases

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Use Cases                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ✅ DÙNG APPCONFIG KHI:                                                     │
│   ────────────────────────                                                   │
│   • Feature flags - bật/tắt features động                                   │
│   • Operational configs - timeout, batch size, thresholds                   │
│   • Gradual rollout với validation                                          │
│   • Config changes cần rollback nếu lỗi                                     │
│   • Multi-environment configs (dev/staging/prod)                            │
│                                                                              │
│   ❌ KHÔNG DÙNG APPCONFIG KHI:                                               │
│   ──────────────────────────                                                 │
│   • Secrets (passwords, API keys) → dùng Secrets Manager                    │
│   • Simple key-value không cần deployment → Parameter Store                 │
│   • Code deployment → CodeDeploy                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Exam Tips

> [!IMPORTANT]
> **Keywords nhận biết AppConfig:**
> - "Feature flags"
> - "Deploy configuration without redeploying application"
> - "Gradual configuration rollout"
> - "Configuration validation"
> - "Automatic rollback on errors"

### Quick Facts:

| Câu hỏi | Trả lời |
|---------|---------|
| Feature flags? | **AppConfig** |
| Config deployment với rollback? | **AppConfig** |
| Gradual config rollout? | **AppConfig** |
| Store secrets với rotation? | **Secrets Manager** |
| Simple config storage? | **Parameter Store** |

### So sánh nhanh:

```
Config STORAGE:      Parameter Store, Secrets Manager
Config DEPLOYMENT:   AppConfig
Code DEPLOYMENT:     CodeDeploy
```

---

## Tài liệu tham khảo

- [AWS AppConfig Documentation](https://docs.aws.amazon.com/appconfig/)
- [AWS AppConfig Feature Flags](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-feature-flags.html)
- [AppConfig Deployment Strategies](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-deployment-strategy.html)
