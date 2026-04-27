# AWS Policies Overview — Phân biệt tất cả các loại "Policy"

> File này là **bản đồ tổng** giúp bạn không còn nhầm giữa hàng chục thứ trong AWS đều gọi là "policy". Đọc file này TRƯỚC khi đi sâu vào từng loại.

## Mục lục

- [Tại sao hay bị nhầm?](#tại-sao-hay-bị-nhầm)
- [AWS thiết kế Policy để làm gì? (Triết lý)](#aws-thiết-kế-policy-để-làm-gì-triết-lý)
- [Bản đồ tổng — 5 nhóm policy](#bản-đồ-tổng--5-nhóm-policy)
- [Nhóm A — IAM / Access Policies (quyền truy cập)](#nhóm-a--iam--access-policies-quyền-truy-cập)
- [Nhóm B — AWS Organizations Policies (governance toàn org)](#nhóm-b--aws-organizations-policies-governance-toàn-org)
- [Nhóm C — Network & Firewall Policies (chặn/lọc traffic)](#nhóm-c--network--firewall-policies-chặnlọc-traffic)
- [Nhóm D — Service-specific Behavioral Policies (cấu hình hành vi service)](#nhóm-d--service-specific-behavioral-policies-cấu-hình-hành-vi-service)
- [Nhóm E — Legal & Compliance Documents](#nhóm-e--legal--compliance-documents)
- [Confusion Matrix — Những cặp hay nhầm nhất](#confusion-matrix--những-cặp-hay-nhầm-nhất)
- [Decision Tree — "Tôi muốn... thì dùng policy nào?"](#decision-tree--tôi-muốn-thì-dùng-policy-nào)
- [Cấu trúc JSON chung của IAM-style policies](#cấu-trúc-json-chung-của-iam-style-policies)
- [Cheatsheet — Khi thấy chữ X, đó là loại nào?](#cheatsheet--khi-thấy-chữ-x-đó-là-loại-nào)
- [Nguồn](#nguồn)

---

## Tại sao hay bị nhầm?

Trong AWS, từ **"policy"** bị **overload** — dùng cho ÍT NHẤT 5 khái niệm hoàn toàn khác nhau:

1. **JSON access policy** (IAM family) — `Effect/Action/Resource` để cấp quyền.
2. **Organizations policy** — guardrail/cấu hình toàn org (SCP, RCP, Tag, Backup…).
3. **Network/firewall policy** — rule lọc traffic (SG rule, NACL, WAF rule, Firewall Manager).
4. **Behavioral policy** — cấu hình **hành vi** của service (Routing Policy của Route 53, Scaling Policy của ASG, Lifecycle Policy của S3, Cache Policy của CloudFront, Deployment Policy của Beanstalk…). **Hoàn toàn không liên quan tới quyền.**
5. **Legal/Compliance document** — AUP, Privacy Policy, Service Terms.

> [!IMPORTANT]
> **Cùng một chữ "policy" nhưng cú pháp, cơ chế đánh giá, nơi gắn, và mục đích khác nhau hoàn toàn.** Khi gặp tài liệu nói "policy", luôn hỏi: *policy cho cái gì? Gắn vào đâu? Cấp quyền hay giới hạn quyền hay chỉ là cấu hình?*

---

## AWS thiết kế Policy để làm gì? (Triết lý)

Để hiểu tại sao policy AWS phức tạp như vậy, phải nhìn vào **bài toán gốc** mà AWS phải giải. AWS không phải hệ thống nhỏ — họ chạy hàng triệu khách hàng, mỗi giây hàng tỷ API call, lưu hàng nghìn tỷ object. Mô hình access control kiểu cũ (RBAC đơn giản, `/etc/sudoers`...) **không đủ**.

### Bài toán AWS phải giải đồng thời

| Mục tiêu | Vấn đề thực tế |
|---------|---------------|
| **Least Privilege at scale** | 1 công ty 10K developer không thể cấp quyền thủ công |
| **Default Deny / Zero Trust** | Một quyền cấp nhầm = data breach hàng tỷ đô |
| **Cross-account / cross-org sharing** | Phải share data giữa các account mà không copy credential |
| **Delegation an toàn** | Cho dev tự quản nhưng không vượt giới hạn |
| **Auditability & Compliance** | SOC2, HIPAA, PCI yêu cầu chứng minh ai làm gì khi nào |
| **Automation friendly** | IaC, CI/CD, bot, Lambda → cần lập trình được |

→ AWS phát minh ra **một ngôn ngữ policy declarative**, chia thành **nhiều layer độc lập**, mỗi layer phục vụ 1 vai trò trong tổ chức.

### 7 nguyên tắc thiết kế cốt lõi

#### 1. Declarative thay vì Imperative

Policy mô tả **"WHAT" — điều kiện được phép**, không phải **"HOW"**. Engine của AWS tự đánh giá. Hệ quả:

- **Audit được** không cần chạy code
- **Verify formally**: AWS Zelkova và IAM Access Analyzer dùng SMT solver để **chứng minh toán học** không có lỗ hổng
- **Version control** trong Git như source code
- **Tooling** đa dạng: lint, simulator, policy generator

#### 2. Default Deny + Explicit Allow + Explicit Deny Wins

```
Implicit Deny  ──►  Allow nếu có  ──►  Deny luôn thắng
```

- An toàn mặc định: chưa cấp = không có quyền
- Explicit Deny **không thể bị bypass** → guardrail tuyệt đối (SCP/RCP/Boundary dựa trên cơ chế này)

#### 3. Separation of Concerns — mỗi layer có "chủ" khác nhau

Đây là chìa khóa hiểu **tại sao có nhiều loại policy đến vậy**. Mỗi loại policy phản ánh **một vai trò trong tổ chức**:

| Layer | Ai sở hữu | Mục đích |
|-------|----------|----------|
| **SCP / RCP** | Org admin (CISO) | "Toàn công ty không được làm X" |
| **Identity Policy** | Account admin (team lead) | "Team tôi được làm Y" |
| **Permissions Boundary** | Senior dev / platform team | "Cho dev tự tạo role nhưng max ceiling Z" |
| **Resource Policy** | Resource owner | "Bucket của tôi cho ai vào" |
| **Trust Policy** | Role owner | "Ai được hoá thân thành role này" |
| **Session Policy** | Caller (app/CLI) | "Tôi tự giảm phạm vi token tạm" |

→ Tổ chức không có **cấu trúc kiểm soát 1 chiều** → AWS phải có nhiều layer chồng nhau, mỗi layer trao cho 1 nhóm người 1 phần kiểm soát mà không cần can thiệp nhóm khác.

#### 4. Intersection Logic (AND tất cả layer)

Quyền thật = **phép giao** của tất cả layer cho phép, trừ đi mọi explicit Deny:

```
Effective = SCP ∩ RCP ∩ Identity Policy ∩ Resource Policy
            ∩ Permissions Boundary ∩ Session Policy
            – (any explicit Deny)
```

→ Cho phép **delegation an toàn**: admin tin dev tự tạo role mà không sợ dev cấp quyền vượt boundary. Đây là điều RBAC truyền thống không làm được.

#### 5. Identity-based ↔ Resource-based — hai chiều của cùng quyền

```
"User A được đọc Bucket X"     ↔     "Bucket X cho User A đọc"
   (Identity Policy)                     (Resource Policy)
```

Tại sao cần **cả hai**?

- **Cross-account**: Account A muốn cho User của Account B đọc bucket → Account A KHÔNG thể chỉnh IAM của Account B → phải có Resource-based để **bên owner resource** chủ động cấp quyền.
- **Two-way handshake**: Cross-account thường yêu cầu **cả 2 bên đều allow** → khó bị share nhầm.
- **Service-to-service**: Lambda invoke từ S3 event — S3 không có IAM identity → resource-based policy là lối duy nhất.

#### 6. Time-bound credentials thay vì long-lived keys

AWS thiết kế để **STS (temporary credentials)** là mặc định, long-lived access key là exception:

- Role assumption → token chỉ sống vài giờ
- Session policy giảm phạm vi runtime của token
- Federation với IdP công ty (SAML/OIDC) → không cần tạo IAM user

→ Giảm **blast radius** khi bị leak credentials.

#### 7. Auditability First-class

Mọi quyết định policy đều log vào **CloudTrail**: ai gọi (principal) — làm gì (action) — lên resource nào — policy nào allow/deny.

Cộng với **IAM Access Analyzer** dùng formal proof để phát hiện cấu hình lệch (ví dụ: bucket policy public mà bạn không biết). Đây là lý do AWS có thể nói "policy của bạn an toàn" mà không cần chạy thử.

### Tóm tắt 1 câu

> AWS thiết kế policy như một **ngôn ngữ declarative đa lớp** để **nhiều vai trò trong tổ chức** có thể **độc lập** đặt ra constraint cho cùng một request, kết hợp lại theo **least privilege + default deny + explicit deny wins**, đồng thời vẫn cho phép **delegation an toàn**, **cross-account sharing**, **auditability** và **automation** — ở quy mô internet.

### Tại sao "loạn loại policy" — và đó không phải bug mà là feature

5 nhóm policy ở phần dưới không phải vì AWS tham lam đặt tên. Mỗi nhóm sinh ra để giải 1 bài toán cụ thể:

| Nhóm | Sinh ra để giải bài toán... |
|------|----------------------------|
| **A. IAM / Access** | Quyền truy cập có thể lập trình, cross-account, delegation |
| **B. Organizations** | Multi-account governance, compliance, billing tách bạch |
| **C. Network / Firewall** | Phòng thủ ở tầng mạng (defense in depth) |
| **D. Behavioral** | Cấu hình hành vi service một cách declarative (Routing, Scaling, Lifecycle... cũng nên là policy để IaC được) |
| **E. Legal** | Hợp đồng pháp lý — không phải kỹ thuật |

Sự "trùng tên" gây nhầm thực ra phản ánh một triết lý chung của AWS: **cái gì cấu hình được bằng cách khai báo (declarative), AWS gọi là policy** — kể cả khi nó không liên quan gì tới quyền. Hệ quả phụ là **bạn phải biết policy đó thuộc nhóm nào** trước khi đọc.

---

## Bản đồ tổng — 5 nhóm policy

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        AWS — Tất cả các loại "Policy"                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  A. IAM / ACCESS  ── Cấp/giới hạn QUYỀN (JSON: Effect/Action/Resource)         │
│     ├─ Identity-based policy   (gắn vào User/Group/Role)                       │
│     ├─ Resource-based policy   (gắn vào Resource — có Principal)               │
│     ├─ Trust policy            (Resource-based đặc biệt cho IAM Role)          │
│     ├─ Permissions Boundary    (giới hạn max của Identity)                     │
│     ├─ Session policy          (giới hạn session khi AssumeRole)               │
│     ├─ ACL                     (legacy, S3 / VPC NACL)                         │
│     └─ IAM Password Policy     (chính sách password cho IAM users)             │
│                                                                                │
│  B. ORGANIZATIONS  ── Guardrail/cấu hình TOÀN TỔ CHỨC (gắn vào Root/OU/Acc)    │
│     ├─ Authorization policies                                                  │
│     │   ├─ SCP — Service Control Policy (giới hạn principal)                   │
│     │   └─ RCP — Resource Control Policy (giới hạn resource)                   │
│     └─ Management policies                                                     │
│         ├─ Tag policy                                                          │
│         ├─ Backup policy                                                       │
│         ├─ AI services opt-out policy                                          │
│         ├─ Chat applications policy (Slack/Teams)                              │
│         ├─ Declarative policy                                                  │
│         ├─ Security Hub policy                                                 │
│         ├─ Amazon Inspector policy                                             │
│         ├─ Amazon Bedrock policy                                               │
│         ├─ Upgrade rollout policy                                              │
│         └─ Amazon S3 policy (cấu hình S3 toàn org)                             │
│                                                                                │
│  C. NETWORK / FIREWALL  ── Chặn/lọc TRAFFIC ở các tầng                         │
│     ├─ Security Group rules        (stateful, instance-level)                  │
│     ├─ Network ACL (NACL)          (stateless, subnet-level)                   │
│     ├─ AWS WAF Web ACL & rules     (L7 HTTP)                                   │
│     ├─ AWS Network Firewall policy (L3-L7, VPC)                                │
│     ├─ AWS Firewall Manager policy (multi-account quản lý SG/WAF/NF)           │
│     └─ AWS Shield Advanced protection (DDoS)                                   │
│                                                                                │
│  D. SERVICE-SPECIFIC BEHAVIORAL  ── Cấu hình HÀNH VI service (KHÔNG phải quyền)│
│     ├─ Route 53 Routing Policy     (Simple/Weighted/Latency/Geo/Failover…)     │
│     ├─ Auto Scaling Policy         (Target Tracking/Step/Simple/Predictive)    │
│     ├─ S3 Lifecycle Policy         (chuyển storage class, expire object)       │
│     ├─ EBS Snapshot Lifecycle (DLM)                                            │
│     ├─ ECR Lifecycle Policy        (xóa image cũ)                              │
│     ├─ CloudFront Cache Policy / Origin Request / Response Headers             │
│     ├─ Elastic Beanstalk Deployment Policy (AllAtOnce/Rolling/Immutable…)      │
│     ├─ CodeDeploy Deployment Configuration (Canary/Linear/AllAtOnce)           │
│     ├─ KMS Key Policy + Grants     (vừa là access vừa cấu hình key)            │
│     ├─ VPC Endpoint Policy         (giới hạn API call qua endpoint)            │
│     └─ Backup Vault Access Policy / Backup Plan                                │
│                                                                                │
│  E. LEGAL / COMPLIANCE                                                         │
│     ├─ AWS Acceptable Use Policy (AUP)                                         │
│     ├─ AWS Customer Agreement, Service Terms                                   │
│     ├─ Privacy Policy                                                          │
│     └─ Penetration Testing Policy                                              │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

| Nhóm | Bản chất | Ngôn ngữ | Câu hỏi nó trả lời |
|------|----------|----------|--------------------|
| **A. IAM / Access** | Cấp / giới hạn quyền | JSON IAM | "Ai được làm gì với resource nào?" |
| **B. Organizations** | Guardrail toàn org | JSON-ish (mỗi loại khác cú pháp) | "Org cho phép gì? Cấu hình mặc định ra sao?" |
| **C. Network/Firewall** | Lọc gói tin | Rule (port, CIDR, header…) | "Traffic này có được đi qua không?" |
| **D. Behavioral** | Cấu hình hành vi | Tham số service (không JSON IAM) | "Service hoạt động thế nào?" |
| **E. Legal** | Văn bản pháp lý | Văn bản tự nhiên | "Điều khoản sử dụng AWS là gì?" |

> [!TIP]
> **Mẹo phân biệt nhanh**: Nếu policy có `Effect/Action/Resource` → **Nhóm A hoặc B** (IAM-style). Nếu không có cú pháp đó → **Nhóm C/D/E** (chỉ tình cờ trùng tên gọi).

---

## Nhóm A — IAM / Access Policies (quyền truy cập)

Tất cả đều dùng **JSON IAM policy language** với cú pháp `Version / Statement / Effect / Action / Resource / [Principal] / [Condition]`. Chi tiết: <ref_file file="/home/hieptran/Desktop/aws-learn/iam-json-policy-types.md" />.

| Loại | Gắn vào | Có `Principal`? | Cấp quyền? | Giới hạn quyền? | Mục đích |
|------|---------|----------------|------------|-----------------|----------|
| **Identity-based** | User / Group / Role | ❌ | ✅ | ❌ | "User A được làm gì?" |
| **Resource-based** | Resource (S3, SQS, SNS, Lambda, KMS, ECR, Secrets Manager…) | ✅ | ✅ | ❌ | "Resource X cho ai vào?" |
| **Trust Policy** | IAM **Role** (1 role có đúng 1 trust policy) | ✅ | ✅ (chỉ `sts:AssumeRole*`) | ❌ | "Ai được phép assume role này?" |
| **Permissions Boundary** | User / Role | ❌ | ❌ | ✅ (max ceiling) | "Identity này tối đa được làm gì?" |
| **Session Policy** | Session tạm thời (qua `AssumeRole`, federation) | ❌ | ❌ | ✅ (intersection) | "Session tạm này được làm gì?" |
| **ACL** (legacy) | S3 bucket/object, VPC subnet (NACL) | (XML cho S3) | ✅ | (NACL: lọc traffic) | Cross-account legacy / subnet firewall |
| **IAM Password Policy** | Toàn account | — | ❌ | — | Quy tắc password cho IAM users |

### Identity-based vs Resource-based — cách phân biệt nhanh

```
Identity-based                    Resource-based
──────────────                    ──────────────
GẮN vào: User/Group/Role          GẮN vào: Resource (S3, SQS, KMS…)
KHÔNG có "Principal"              CÓ "Principal"
"Tôi (User) được làm gì?"         "Resource cho phép ai?"

    ┌──────────┐                     ┌───────────┐
    │  User A  │── policy            │ S3 Bucket │── bucket policy
    └──────────┘  được đọc S3        └───────────┘  Account B đọc được
```

### Trust Policy — đừng nhầm với Resource-based thông thường

Trust policy **chỉ tồn tại trên IAM Role**, action duy nhất là `sts:AssumeRole` (và biến thể), `Principal` chỉ ai được phép **đảm nhận** role. Khác với Resource-based policy (S3 bucket policy…) là cấp quyền **dùng** resource. Chi tiết: <ref_file file="/home/hieptran/Desktop/aws-learn/iam-roles.md" />.

```json
// Trust policy cho phép EC2 service assume role
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
```

### Permissions Boundary vs Session Policy — đều "giới hạn", khác lúc nào?

| | Permissions Boundary | Session Policy |
|---|---|---|
| **Khi nào áp dụng?** | Vĩnh viễn (gắn vào User/Role) | Chỉ trong session tạm (AssumeRole/GetFederationToken) |
| **Ai gắn?** | Admin gắn lên User/Role | Caller truyền lúc gọi `AssumeRole --policy` |
| **Use case** | Cho dev tự tạo role nhưng không vượt quá ceiling | Token tạm cấp cho ứng dụng/CLI giảm phạm vi |

### IAM Password Policy

**Không phải JSON policy** dù mang chữ "policy". Đây là **cấu hình toàn account** (1 password policy / 1 account) quy định: độ dài tối thiểu, ký tự bắt buộc, max age, lịch sử password, tự đổi…

---

## Nhóm B — AWS Organizations Policies (governance toàn org)

Organizations chia policies thành **2 nhóm con**: **Authorization** (giới hạn quyền) và **Management** (cấu hình service). Tất cả gắn vào **Root / OU / Account**, áp dụng theo inheritance.

### B.1 Authorization Policies (giới hạn quyền)

| Loại | Tác động lên | Cú pháp | Giải thích ngắn |
|------|--------------|---------|-----------------|
| **SCP — Service Control Policy** | **Principals** (IAM users/roles) trong account | JSON IAM-style (Effect/Action/Resource/Condition, **không có Principal**) | "Trần (ceiling) tối đa quyền của user/role" |
| **RCP — Resource Control Policy** | **Resources** trong account (hiện hỗ trợ S3, SQS, Secrets Manager, STS, KMS — kiểm tra docs để cập nhật) | JSON IAM-style (Effect/Action/Resource/**Principal**) | "Trần tối đa ai được dùng resource trong account" |

> [!IMPORTANT]
> **SCP và RCP KHÔNG cấp quyền**, chỉ **giới hạn**. Bạn vẫn cần IAM policy/Resource policy thực sự cấp quyền. Hiệu lực thật = **Identity policy ∩ Resource policy ∩ SCP ∩ RCP ∩ Permissions Boundary ∩ Session policy** (và bất kỳ `Deny` nào ưu tiên trước).

### B.2 Management Policies (cấu hình service)

| Loại | Mục đích | Tác động management account? | Max attach (root/OU/account) |
|------|---------|------------------------------|------------------------------|
| **Tag Policy** | Chuẩn hoá tag (key/value, case) trên resources | ✅ | 10 |
| **Backup Policy** | Áp dụng AWS Backup plan tập trung | ✅ | 10 |
| **AI services opt-out Policy** | Opt-out training với data của bạn (Comprehend, Lex, Polly, Rekognition, Textract, Transcribe, Translate) | ✅ | 5 |
| **Chat applications policy** | Kiểm soát Slack/Teams truy cập org | ✅ | 5 |
| **Declarative policy** | Khai báo cấu hình mong muốn cho service (giữ nguyên kể cả khi service ra feature mới) | ✅ | 10 |
| **Security Hub policy** | Bật/cấu hình Security Hub đa account | ✅ | 10 |
| **Amazon Inspector policy** | Bật/cấu hình Inspector đa account | ✅ | 10 |
| **Amazon Bedrock policy** | Áp Bedrock Guardrails cho mọi inference call | ✅ | 10 |
| **Upgrade rollout policy** | Stagger auto-upgrade nhiều resources/account | ✅ | 10 |
| **Amazon S3 policy** | Cấu hình S3 (vd: block public access) tập trung | ✅ | 10 |

> Authorization policies (SCP/RCP) **không** ảnh hưởng management account. Management policies thì **có** áp lên cả management account.

Chi tiết SCP/RCP: <ref_file file="/home/hieptran/Desktop/aws-learn/aws-organizations.md" />.

---

## Nhóm C — Network & Firewall Policies (chặn/lọc traffic)

Đây **không phải IAM JSON** — chỉ là **rule** lọc gói tin. Hay bị gọi là "policy" trong tài liệu mạng.

| Loại | Tầng | Stateful? | Phạm vi | Allow/Deny |
|------|------|-----------|---------|------------|
| **Security Group** rules | L4 (port/proto/IP) | ✅ Stateful | ENI/Instance | **Chỉ Allow** (implicit deny) |
| **Network ACL (NACL)** | L4 | ❌ Stateless | Subnet | Allow + Deny (có rule number) |
| **AWS WAF** Web ACL & rules | L7 (HTTP) | — | ALB/CloudFront/API GW/AppSync/Cognito | Allow/Block/Count/CAPTCHA |
| **AWS Network Firewall** policy | L3–L7 | ✅ Stateful (Suricata) | VPC | Stateful + Stateless rules |
| **AWS Firewall Manager** policy | Meta — quản lý SG/WAF/Network Firewall/Shield đa account | — | Org | — |
| **AWS Shield Standard / Advanced** | L3/L4/L7 DDoS | — | Edge / Resource | DDoS protection |

> [!NOTE]
> **NACL** (Network ACL) đôi khi bị gọi là "ACL" và xếp vào nhóm IAM legacy. Thực ra NACL là **subnet firewall**, hoàn toàn khác với **S3 ACL** dù trùng tên.

Chi tiết: <ref_file file="/home/hieptran/Desktop/aws-learn/security-groups.md" />, <ref_file file="/home/hieptran/Desktop/aws-learn/vpc.md" />.

---

## Nhóm D — Service-specific Behavioral Policies (cấu hình hành vi service)

**KHÔNG phải về quyền.** Chỉ tình cờ AWS dùng chữ "policy" để mô tả cách cấu hình hành vi service. Đây là khu vực **gây nhầm nhiều nhất** cho người học.

| Service | Tên "policy" | Nó thực sự là gì? |
|---------|-------------|-------------------|
| **Route 53** | Routing Policy | Cách DNS trả lời record (Simple, Weighted, Latency, Failover, Geolocation, Geoproximity, Multi-Value, IP-based) |
| **EC2 Auto Scaling Group** | Scaling Policy | Quy tắc khi nào scale: Target Tracking, Step Scaling, Simple Scaling, Predictive |
| **S3** | Lifecycle Policy (Lifecycle Configuration) | Tự chuyển storage class hoặc expire object theo thời gian |
| **EBS** | Snapshot Lifecycle (DLM) | Tự tạo/xoá EBS snapshots định kỳ |
| **ECR** | Lifecycle Policy | Tự xoá image cũ theo rule |
| **CloudFront** | Cache Policy / Origin Request Policy / Response Headers Policy | Cấu hình cache key, headers gửi tới origin, headers trả về client |
| **Elastic Beanstalk** | Deployment Policy | Cách triển khai code mới: All at once, Rolling, Rolling with additional batch, Immutable, Blue/Green, Traffic Splitting |
| **CodeDeploy** | Deployment Configuration | Phần trăm traffic chuyển: Canary/Linear/AllAtOnce |
| **KMS** | Key Policy + Grants | Vừa là **resource-based access policy** (Nhóm A) vừa là cấu hình key — hợp nhất 2 vai trò |
| **VPC** | VPC Endpoint Policy | Giới hạn API call nào được đi qua endpoint (gateway/interface) |
| **AWS Backup** | Backup Plan / Vault Access Policy | Plan = lịch backup (behavioral); Vault Access Policy = resource-based (Nhóm A) |
| **API Gateway** | API Gateway Resource Policy | Resource-based (Nhóm A) — ai gọi API được |
| **Lambda** | Function Policy | Resource-based (Nhóm A) — ai invoke được |
| **SNS / SQS** | Topic / Queue Access Policy | Resource-based (Nhóm A) |
| **Glue / Lake Formation** | Data Lake Permissions / Resource Policy | Mix giữa IAM và Lake Formation grants |

> [!IMPORTANT]
> Nhìn chữ "policy" trong nhóm D, **đừng tìm `Effect/Action/Resource`**. Nó là cấu hình. Xem doc của từng service.

Chi tiết:
- Routing Policy: <ref_file file="/home/hieptran/Desktop/aws-learn/route53.md" />
- Scaling Policy: <ref_file file="/home/hieptran/Desktop/aws-learn/asg.md" />, <ref_file file="/home/hieptran/Desktop/aws-learn/auto-scaling.md" />
- Deployment Policy (Beanstalk): <ref_file file="/home/hieptran/Desktop/aws-learn/elastic-beanstalk.md" />
- S3 Lifecycle: <ref_file file="/home/hieptran/Desktop/aws-learn/s3.md" />
- CloudFront: <ref_file file="/home/hieptran/Desktop/aws-learn/cloudfront.md" />

---

## Nhóm E — Legal & Compliance Documents

Đây là **văn bản pháp lý**, không phải kỹ thuật.

| Document | Nội dung | Vị trí |
|----------|---------|--------|
| **AWS Customer Agreement** | Hợp đồng tổng | aws.amazon.com/agreement |
| **AWS Acceptable Use Policy (AUP)** | Những gì được/không được làm | aws.amazon.com/aup |
| **AWS Service Terms** | Điều khoản theo từng service | aws.amazon.com/service-terms |
| **AWS Privacy Policy** | Cách AWS xử lý data | aws.amazon.com/privacy |
| **AWS Penetration Testing Policy** | Pentest được/không được, dịch vụ nào | aws.amazon.com/security/penetration-testing |

Chi tiết: <ref_file file="/home/hieptran/Desktop/aws-learn/aws-policies-compliance.md" />.

---

## Confusion Matrix — Những cặp hay nhầm nhất

### 1. SCP vs IAM Policy vs Permissions Boundary

```
                   Cấp quyền?   Giới hạn?   Gắn vào
SCP                ❌            ✅          Root/OU/Account
IAM Policy         ✅            ❌          User/Group/Role
Perms Boundary     ❌            ✅          User/Role
```

- **SCP** = guardrail toàn account/OU (bạn không thể vượt qua)
- **Permissions Boundary** = ceiling cho 1 user/role cụ thể
- **IAM Policy** = thực sự cấp quyền (vẫn phải có Allow)

> Hiệu lực thật = **AND** của tất cả + **bất kỳ Deny nào thắng**.

### 2. SCP vs RCP

| | SCP | RCP |
|---|-----|-----|
| Đối tượng kiểm soát | **Principal** (IAM user/role) | **Resource** |
| Có `Principal` trong JSON? | ❌ | ✅ |
| Áp dụng cross-account access? | Chặn principals trong org gọi ngoài | Chặn principals ngoài (kể cả AWS account khác/anon) gọi vào resource trong org |
| Service hỗ trợ | Tất cả | Hiện hỗ trợ tập con (S3, SQS, Secrets Manager, STS, KMS — kiểm tra docs để cập nhật) |

### 3. Resource-based Policy vs Trust Policy

Cả hai đều có `Principal`, nên dễ nhầm.

| | Resource-based (S3 bucket policy) | Trust Policy |
|---|---|---|
| Gắn vào | S3, SQS, SNS, KMS, Lambda… | **IAM Role** |
| Action điển hình | `s3:GetObject`, `sqs:SendMessage`, `lambda:InvokeFunction` | `sts:AssumeRole`, `sts:AssumeRoleWithWebIdentity`, `sts:AssumeRoleWithSAML`, `sts:TagSession` |
| Mục đích | Cho phép dùng resource trực tiếp | Cho phép **đảm nhận** role để lấy temp creds |

### 4. S3 Bucket Policy vs S3 ACL vs Block Public Access vs S3 Object Ownership

| Cơ chế | Loại | Khuyến nghị |
|--------|------|-------------|
| **Bucket Policy** | Resource-based JSON (Nhóm A) | ✅ Cách chính để cấp quyền |
| **Object ACL / Bucket ACL** | Legacy XML | ⚠️ AWS khuyến nghị tắt (Object Ownership = "Bucket owner enforced") |
| **Block Public Access** | Setting cấp account/bucket | ✅ Bật mặc định để chặn nhầm public |
| **S3 Object Ownership** | Setting | "Bucket owner enforced" → tắt ACL hoàn toàn |

### 5. NACL vs Security Group vs S3 ACL

Cả 3 đều là "ACL" hoặc rule firewall, nhưng:

| | Security Group | NACL | S3 ACL |
|---|---|---|---|
| Tầng | Instance/ENI | Subnet | Object/Bucket |
| Mạng hay quyền? | Mạng | Mạng | Quyền (legacy) |
| Stateful? | ✅ | ❌ | — |

### 6. Routing Policy (Route 53) vs IAM Policy

**Hoàn toàn không liên quan.** Routing Policy là cách Route 53 quyết định trả về DNS record nào (Weighted/Latency/Failover…). Không có `Effect/Action/Resource`.

### 7. Scaling Policy vs Lifecycle Policy

| | Scaling Policy (ASG) | Lifecycle Policy (S3/ECR/EBS) |
|---|---|---|
| Mục đích | Tự thay đổi số lượng instances | Tự chuyển/xóa data theo thời gian |
| Trigger | CloudWatch metric | Tuổi của object/snapshot/image |

### 8. Deployment Policy (Beanstalk) vs Deployment Configuration (CodeDeploy)

Cả hai cùng nói về cách deploy code, nhưng nằm ở 2 service khác:
- **Beanstalk**: All at once, Rolling, Rolling with additional batch, Immutable, Blue/Green, Traffic splitting
- **CodeDeploy**: Canary (10%/5min, 10%/15min…), Linear (10% mỗi N phút), AllAtOnce

---

## Decision Tree — "Tôi muốn... thì dùng policy nào?"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Tôi muốn...                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ─ Cấp quyền cho 1 USER/ROLE làm gì đó                                       │
│   → Identity-based policy (Nhóm A)                                          │
│                                                                             │
│ ─ Cho ACCOUNT KHÁC truy cập resource của tôi không qua AssumeRole           │
│   → Resource-based policy (Bucket Policy, KMS Key Policy, Lambda…)          │
│                                                                             │
│ ─ Cho 1 SERVICE (vd: EC2, Lambda) đảm nhận role                             │
│   → Trust Policy (Principal: Service)                                       │
│                                                                             │
│ ─ GIỚI HẠN tối đa quyền của 1 user/role (delegation an toàn)                │
│   → Permissions Boundary                                                    │
│                                                                             │
│ ─ Giảm phạm vi của 1 SESSION tạm khi AssumeRole                             │
│   → Session Policy                                                          │
│                                                                             │
│ ─ Cấm TOÀN account/OU không được dùng service nào đó                        │
│   → SCP (Service Control Policy)                                            │
│                                                                             │
│ ─ Cấm TOÀN account/OU truy cập resource từ ngoài tổ chức                    │
│   → RCP (Resource Control Policy)                                           │
│                                                                             │
│ ─ Bắt mọi resource phải có TAG đúng chuẩn                                   │
│   → Tag Policy (Organizations) + IAM condition `aws:RequestTag`             │
│                                                                             │
│ ─ Backup tập trung mọi account                                              │
│   → Backup Policy (Organizations) + AWS Backup                              │
│                                                                             │
│ ─ Chặn/lọc traffic vào EC2                                                  │
│   → Security Group (instance) + NACL (subnet) (Nhóm C)                      │
│                                                                             │
│ ─ Chặn HTTP attack (SQLi/XSS/bot)                                           │
│   → AWS WAF Web ACL                                                         │
│                                                                             │
│ ─ DNS routing thông minh (multi-region failover)                            │
│   → Route 53 Routing Policy (Failover/Latency/Weighted)                     │
│                                                                             │
│ ─ EC2 tự scale theo CPU                                                     │
│   → ASG Scaling Policy (Target Tracking)                                    │
│                                                                             │
│ ─ Tự chuyển S3 object sang Glacier sau N ngày                               │
│   → S3 Lifecycle Policy                                                     │
│                                                                             │
│ ─ Cách deploy app Beanstalk                                                 │
│   → Beanstalk Deployment Policy (Rolling/Immutable…)                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cấu trúc JSON chung của IAM-style policies

Áp dụng cho: Identity-based, Resource-based, Trust, Permissions Boundary, Session, SCP, RCP, KMS Key Policy, VPC Endpoint Policy, S3 Bucket Policy, SNS/SQS/Lambda policies…

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "OptionalStatementId",
      "Effect": "Allow",                  // hoặc "Deny"
      "Principal": { "...": "..." },      // CHỈ resource-based & trust policy
      "Action": [ "service:Operation" ],  // hoặc "NotAction"
      "Resource": [ "arn:aws:..." ],      // hoặc "NotResource"
      "Condition": {
        "StringEquals": { "aws:RequestedRegion": "ap-southeast-1" }
      }
    }
  ]
}
```

| Field | Bắt buộc? | Ghi chú |
|-------|-----------|---------|
| `Version` | ✅ | Luôn `"2012-10-17"` |
| `Sid` | ❌ | Tên định danh statement |
| `Effect` | ✅ | `Allow` / `Deny` (Deny luôn thắng) |
| `Principal` | Chỉ resource-based / trust | `AWS`, `Service`, `Federated`, `CanonicalUser` |
| `Action` / `NotAction` | ✅ (1 trong 2) | API operations |
| `Resource` / `NotResource` | ✅ (trừ trust policy) | ARN |
| `Condition` | ❌ | Constraint (IP, MFA, time, tag…) |

> **Quy tắc đánh giá**: Implicit deny → Explicit `Allow` → Explicit `Deny` thắng tất cả.

---

## Cheatsheet — Khi thấy chữ X, đó là loại nào?

| Khi gặp chữ... | Đó là... | Nhóm |
|---------------|---------|------|
| "Bucket policy" | S3 resource-based JSON | A (resource-based) |
| "Trust policy" / "AssumeRolePolicyDocument" | IAM Role trust | A (trust) |
| "Inline policy" | Identity-based (1-1) | A (identity) |
| "Managed policy" | Identity-based (AWS Managed / Customer Managed) | A (identity) |
| "Permissions boundary" | Ceiling cho User/Role | A (boundary) |
| "Session policy" | Inline policy khi AssumeRole | A (session) |
| "Service control policy" / "SCP" | Org Authorization | B |
| "Resource control policy" / "RCP" | Org Authorization | B |
| "Tag policy" / "Backup policy" / "AI opt-out policy" | Org Management | B |
| "Security group" / "NACL" / "WAF rule" | Network firewall | C |
| "Routing policy" | Route 53 DNS behavior | D |
| "Scaling policy" | ASG behavior | D |
| "Lifecycle policy" / "Lifecycle configuration" | S3/ECR/EBS behavior | D |
| "Cache policy" / "Origin request policy" | CloudFront behavior | D |
| "Deployment policy" | Beanstalk behavior | D |
| "Key policy" | KMS — vừa A vừa D | A+D |
| "VPC endpoint policy" | Hạn chế API qua endpoint | A (resource-based) |
| "Password policy" | IAM Account-level config | A (config) |
| "Acceptable Use Policy / AUP" | Văn bản pháp lý | E |

---

## Nguồn

- [AWS — Policies and permissions in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)
- [AWS — Identity-based vs Resource-based policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html)
- [AWS — Permissions boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)
- [AWS — Session policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#policies_session)
- [AWS Organizations — Managing organization policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies.html)
- [AWS Organizations — SCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [AWS Organizations — RCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html)
- [AWS Organizations — Tag policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies.html)
- [AWS Organizations — Declarative policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_declarative.html)
- [AWS — Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [AWS Acceptable Use Policy](https://aws.amazon.com/aup/)
- [Route 53 — Routing policy](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html)
- [Auto Scaling — Scaling policies](https://docs.aws.amazon.com/autoscaling/ec2/userguide/scale-your-group.html)
- [S3 — Lifecycle configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [Elastic Beanstalk — Deployment policies](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.deploy-existing-version.html)

---

## Liên quan

- <ref_file file="/home/hieptran/Desktop/aws-learn/iam-json-policy-types.md" /> — chi tiết 6 loại IAM JSON policy
- <ref_file file="/home/hieptran/Desktop/aws-learn/iam-roles.md" /> — Trust policy, Cross-account
- <ref_file file="/home/hieptran/Desktop/aws-learn/aws-organizations.md" /> — SCP/RCP và các Org policy
- <ref_file file="/home/hieptran/Desktop/aws-learn/aws-policies-compliance.md" /> — AUP, compliance
- <ref_file file="/home/hieptran/Desktop/aws-learn/aws-sts.md" /> — Session policy chi tiết
- <ref_file file="/home/hieptran/Desktop/aws-learn/iam.md" /> — IAM tổng quan
