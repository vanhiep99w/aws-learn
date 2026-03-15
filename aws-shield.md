# AWS Shield

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Shield Standard vs Advanced](#shield-standard-vs-advanced)
- [Protected Resources](#protected-resources)
- [DDoS Response Team (DRT)](#ddos-response-team-drt)
- [Pricing](#pricing)
- [So sánh Shield vs WAF vs Firewall Manager](#so-sánh-shield-vs-waf-vs-firewall-manager)
- [Exam Tips](#exam-tips)

---

## Giới thiệu

**AWS Shield** là **managed DDoS protection service** bảo vệ ứng dụng chạy trên AWS khỏi các cuộc tấn công **DDoS (Distributed Denial of Service)**.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AWS Shield Overview                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🌐 INTERNET                                                                │
│        │                                                                     │
│        │  ⚡ DDoS Attack                                                     │
│        │  • Volumetric attacks                                               │
│        │  • Protocol attacks                                                 │
│        │  • Application layer attacks                                        │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                      🛡️ AWS Shield                                  │    │
│   │                                                                     │    │
│   │   Standard (FREE)           │    Advanced ($3,000/mo)                │   │
│   │   ─────────────────         │    ─────────────────                   │   │
│   │   • Layer 3/4 protection    │    • Layer 3/4/7 protection            │   │
│   │   • Always-on detection     │    • 24/7 DRT access                   │   │
│   │   • Automatic mitigation    │    • Cost protection                   │   │
│   │                             │    • Real-time visibility              │   │
│   └─────────────────────────────────────────────────────────────────────┘    │
│        │                                                                     │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                 ✅ Your Protected Application                       │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### DDoS Attack Types

| Layer | Attack Type | Ví dụ |
|-------|-------------|-------|
| **Layer 3 (Network)** | Volumetric | UDP floods, ICMP floods |
| **Layer 4 (Transport)** | Protocol | SYN floods, TCP connection attacks |
| **Layer 7 (Application)** | Application | HTTP floods, DNS query floods |

---

## Shield Standard vs Advanced

### So sánh chi tiết

| Feature | Shield Standard | Shield Advanced |
|---------|:---------------:|:---------------:|
| **Giá** | ✅ **FREE** | $3,000/tháng + DTO |
| **Protection** | Layer 3, 4 | Layer 3, 4, **7** |
| **Detection** | Always-on | Always-on + Enhanced |
| **Mitigation** | Automatic | Automatic + Custom |
| **DRT Access** | ❌ | ✅ 24/7 |
| **Cost Protection** | ❌ | ✅ |
| **Real-time Visibility** | Basic | ✅ Advanced |
| **WAF Integration** | ❌ | ✅ Included |
| **Commitment** | None | 1 year |

### Shield Standard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SHIELD STANDARD (FREE)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ✅ Tự động bật cho TẤT CẢ AWS customers                                   │
│   ✅ Không cần cấu hình                                                     │
│   ✅ Always-on detection và mitigation                                      │
│                                                                             │
│   PROTECTS AGAINST:                                                         │
│   • SYN/UDP floods                                                          │
│   • Reflection attacks                                                      │
│   • Other Layer 3/4 attacks                                                 │
│                                                                             │
│   BEST WITH:                                                                │
│   • CloudFront                                                              │
│   • Route 53                                                                │
│   → Comprehensive Layer 3/4 protection                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Shield Advanced

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   SHIELD ADVANCED ($3,000/month)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Everything in Standard PLUS:                                               │
│                                                                              │
│   🛡️ ENHANCED PROTECTION                                                     │
│   • Layer 7 (Application) protection                                         │
│   • Larger và more sophisticated attacks                                     │
│   • Custom mitigation rules                                                  │
│                                                                              │
│   👨‍💻 DDoS RESPONSE TEAM (DRT)                                                │
│   • 24/7 expert support                                                      │
│   • Proactive engagement during attacks                                      │
│   • Custom mitigation policies                                               │
│                                                                              │
│   💰 COST PROTECTION                                                         │
│   • Refund for scaling charges from DDoS                                     │
│   • Covers EC2, ELB, CloudFront, Route 53...                                 │
│                                                                              │
│   📊 VISIBILITY                                                              │
│   • Real-time attack metrics                                                 │
│   • Advanced diagnostics                                                     │
│   • CloudWatch integration                                                   │
│                                                                              │
│   🔗 WAF INTEGRATION                                                         │
│   • AWS WAF included (no extra cost)                                         │
│   • Up to 50B WAF requests/month                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Protected Resources

| Resource | Standard | Advanced |
|----------|:--------:|:--------:|
| **Amazon CloudFront** | ✅ | ✅ |
| **Amazon Route 53** | ✅ | ✅ |
| **AWS Global Accelerator** | ✅ | ✅ |
| **Elastic Load Balancing** | ✅ | ✅ |
| **Amazon EC2** | ✅ | ✅ |
| **Elastic IP** | - | ✅ |

> **Tip:** Đặt CloudFront/Route 53 phía trước để tận dụng Shield Standard tối đa!

---

## DDoS Response Team (DRT)

**DRT** = Đội ngũ chuyên gia DDoS của AWS (chỉ có với Shield Advanced)

| Feature | Chi tiết |
|---------|----------|
| **Availability** | 24/7/365 |
| **Contact** | Phone, chat, ticket |
| **Proactive engagement** | Tự động liên hệ khi phát hiện attack |
| **Custom mitigations** | Viết rules riêng cho ứng dụng của bạn |

### Khi nào DRT giúp?

```
Attack detected → DRT proactively contacts you
                         ↓
              Analyze attack patterns
                         ↓
              Apply custom mitigations
                         ↓
              Attack mitigated ✅
```

---

## Pricing

### Shield Standard
- **FREE** - Tự động bật cho tất cả AWS customers

### Shield Advanced

| Component | Chi phí |
|-----------|---------|
| **Monthly fee** | $3,000/tháng/organization |
| **Commitment** | 1 năm |
| **Data Transfer Out** | Varies by resource |
| **WAF** | ✅ Included (up to 50B requests) |

### Cost Protection (Advanced)

Nếu DDoS attack gây ra scaling charges, AWS sẽ **credit lại**:

```
Ví dụ:
─────────
Bình thường bạn trả: $500/tháng cho EC2
DDoS attack → Auto Scaling tạo thêm instances
Tháng đó bạn bị charge: $2,500

Shield Advanced Cost Protection:
→ AWS credit lại $2,000 (phần tăng thêm do DDoS)
```

---

## So sánh Shield vs WAF vs Firewall Manager

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Security Services Comparison                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🛡️ AWS SHIELD                                                              │
│   ─────────────────────────────────────                                      │
│   • DDoS protection (Layer 3, 4, 7)                                          │
│   • Volumetric và protocol attacks                                           │
│                                                                              │
│   🔥 AWS WAF                                                                 │
│   ─────────────────────────────────────                                      │
│   • Layer 7 protection (Application)                                         │
│   • SQL injection, XSS, bad bots                                             │
│   • Custom rules                                                             │
│                                                                              │
│   🎛️ AWS FIREWALL MANAGER                                                    │
│   ─────────────────────────────────────                                      │
│   • Centrally manage security across accounts                                │
│   • Manage WAF, Shield, Security Groups                                      │
│   • Requires AWS Organizations                                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| | Shield | WAF | Firewall Manager |
|--|--------|-----|------------------|
| **Purpose** | DDoS protection | Web app security | Central management |
| **Layer** | 3, 4, 7 | 7 only | N/A (management) |
| **Attack type** | DDoS | SQL injection, XSS, bots | N/A |
| **Pricing** | Free / $3K/mo | Per rule, request | Per policy |

---

## Exam Tips

### Key Points

| Câu hỏi | Đáp án |
|---------|--------|
| "DDoS protection miễn phí?" | **Shield Standard** |
| "24/7 DDoS response team?" | **Shield Advanced** |
| "Cost protection from DDoS scaling?" | **Shield Advanced** |
| "Layer 7 DDoS protection?" | **Shield Advanced** |
| "Protect against SQL injection?" | **WAF** (không phải Shield) |

### Nhớ

```
Shield Standard:
├── FREE cho tất cả
├── Layer 3/4 only
├── Always-on, automatic
└── Best với CloudFront + Route 53

Shield Advanced:
├── $3,000/month (1-year commitment)
├── Layer 3/4/7
├── 24/7 DRT access
├── Cost protection
└── WAF included
```

### Phân biệt

| Scenario | Service |
|----------|---------|
| Block DDoS attacks | **Shield** |
| Block SQL injection | **WAF** |
| Block specific IPs | **WAF** or **Security Group** |
| Manage across multiple accounts | **Firewall Manager** |

---

## Tài liệu tham khảo

- [AWS Shield Documentation](https://docs.aws.amazon.com/shield/)
- [AWS Shield Pricing](https://aws.amazon.com/shield/pricing/)
- [AWS Shield Features](https://aws.amazon.com/shield/features/)
