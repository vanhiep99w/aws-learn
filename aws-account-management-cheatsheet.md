# AWS Account Management Cheatsheet

## Mục lục

- [Tổng quan 30 giây](#tổng-quan-30-giây)
- [Chọn dịch vụ nào](#chọn-dịch-vụ-nào)
- [Các cặp dễ nhầm](#các-cặp-dễ-nhầm)
- [Kiến trúc nhớ nhanh](#kiến-trúc-nhớ-nhanh)
- [Exam tips nhớ nhanh](#exam-tips-nhớ-nhanh)
- [Nguồn chính thức](#nguồn-chính-thức)

---

## Tổng quan 30 giây

Nếu phải nhớ thật nhanh phần `Account Management`, hãy nhớ theo flow này:

`Nhiều account` -> **AWS Organizations**  
`Muốn multi-account chuẩn, có guardrails sẵn` -> **AWS Control Tower**  
`Muốn người dùng đăng nhập 1 lần vào nhiều account` -> **IAM Identity Center**  
`Muốn user tự chọn template đã approve để provision` -> **AWS Service Catalog**

### Ý chính của từng dịch vụ

| Dịch vụ | Nhớ 1 câu | Từ khóa |
|---|---|---|
| **AWS Organizations** | Quản lý tập trung nhiều AWS accounts | OU, SCP, management account, member accounts, consolidated billing |
| **AWS Control Tower** | Dựng và govern môi trường multi-account theo best practices | landing zone, controls/guardrails, Account Factory, dashboard |
| **IAM Identity Center** | Cấp quyền truy cập nhiều AWS accounts từ một nơi | SSO, permission sets, workforce access, federation |
| **AWS Service Catalog** | Chỉ cho phép triển khai các sản phẩm/template đã được phê duyệt | portfolios, products, constraints, self-service |

### 3 câu thần chú

- **Organizations = structure + governance + billing**
- **Control Tower = Organizations + automation + guardrails mặc định**
- **Identity Center = đăng nhập và phân quyền cho con người**

## Chọn dịch vụ nào

| Nếu đề bài hỏi... | Chọn | Vì sao |
|---|---|---|
| Quản lý nhiều account theo OU, áp policy tập trung | **AWS Organizations** | Đây là nền tảng multi-account cốt lõi |
| Muốn 1 hóa đơn chung cho nhiều account | **AWS Organizations** | Có **consolidated billing** |
| Muốn giới hạn tối đa account member được làm gì | **SCP trong AWS Organizations** | SCP đặt **permission guardrail**, không tự cấp quyền |
| Muốn dựng landing zone theo best practices nhanh nhất | **AWS Control Tower** | Có landing zone, controls, Account Factory |
| Muốn provision account mới theo chuẩn tổ chức | **AWS Control Tower Account Factory** | Chuẩn hóa quy trình tạo account |
| Muốn nhân viên đăng nhập 1 lần rồi vào nhiều AWS accounts | **IAM Identity Center** | Quản lý workforce access tập trung |
| Muốn gán quyền theo job function trên nhiều account | **IAM Identity Center permission sets** | Reuse được across accounts |
| Muốn dev tự tạo stack đã được approve sẵn | **AWS Service Catalog** | Self-service nhưng vẫn có governance |

## Các cặp dễ nhầm

### AWS Organizations vs AWS Control Tower

| AWS Organizations | AWS Control Tower |
|---|---|
| Dịch vụ nền tảng để quản lý nhiều account | Giải pháp triển khai/govern multi-account ở mức cao hơn |
| Tự thiết kế OU, SCP, quy trình account vending | AWS dựng sẵn landing zone và controls |
| Linh hoạt hơn, nhưng làm thủ công nhiều hơn | Nhanh hơn, opinionated hơn |
| Phù hợp khi muốn custom sâu | Phù hợp khi muốn best-practice nhanh |

Mẹo nhớ:

- **Organizations = engine**
- **Control Tower = ready-made framework trên engine đó**

### IAM vs IAM Identity Center

| IAM | IAM Identity Center |
|---|---|
| Quản lý identities trong 1 account hoặc truy cập AWS resources theo cơ chế IAM truyền thống | Quản lý truy cập tập trung cho workforce users qua nhiều accounts/applications |
| Dùng users, groups, roles, policies | Dùng users/groups từ identity source + permission sets |
| Dễ thành cồng kềnh nếu mỗi account tự quản lý riêng | Phù hợp cho môi trường multi-account |

Mẹo nhớ:

- **IAM = quyền trong account**
- **Identity Center = vào nhiều account từ một cổng**

### IAM Policy vs SCP

| IAM Policy | SCP |
|---|---|
| **Grant/deny** quyền cho principal trong account | Chỉ đặt **giới hạn tối đa** cho member accounts |
| Gắn vào user/role/group hoặc resource | Gắn vào root, OU, hoặc account trong organization |
| Có thể cấp quyền thực thi thật sự | **Không cấp quyền**, chỉ chặn/giới hạn |
| Áp dụng trong management và member account tùy context IAM | **Không áp dụng cho users/roles trong management account** |

Mẹo nhớ:

- **IAM policy cho phép làm**
- **SCP giới hạn tối đa được phép làm**

## Kiến trúc nhớ nhanh

### Pattern hay gặp trong thực tế

```text
Organization
└── Root
    ├── Security OU
    │   ├── Log Archive Account
    │   └── Audit Account
    ├── Infrastructure OU
    ├── Workloads OU
    │   ├── Dev Account
    │   ├── Staging Account
    │   └── Prod Account
    └── Sandbox OU
```

### Luồng tư duy chuẩn

1. Tách workload thành nhiều account để tách **permission boundary**, **cost boundary**, và **blast radius**.
2. Dùng **AWS Organizations** để nhóm account theo OU và áp governance.
3. Nếu muốn triển khai nhanh theo chuẩn, dùng **AWS Control Tower** để có landing zone và controls.
4. Dùng **IAM Identity Center** để cấp quyền cho con người vào đúng account bằng **permission sets**.
5. Dùng **AWS Service Catalog** nếu muốn end users chỉ deploy các mẫu đã được approve.

## Exam Tips nhớ nhanh

- Câu hỏi cần **quản lý nhiều accounts tập trung**: nghĩ tới **AWS Organizations** trước.
- Câu hỏi cần **governed multi-account environment nhanh nhất**: nghiêng về **AWS Control Tower**.
- Câu hỏi cần **SSO cho workforce users vào nhiều accounts**: chọn **IAM Identity Center**.
- Câu hỏi cần **self-service nhưng vẫn kiểm soát template được phép dùng**: chọn **AWS Service Catalog**.
- Câu hỏi nói **giới hạn tối đa quyền** trên member accounts: chọn **SCP**, không phải IAM policy.
- Câu hỏi nói **SCP cấp quyền**: sai. SCP **không grant permissions**.
- Câu hỏi nói **SCP ảnh hưởng management account**: sai. SCP áp dụng cho **member accounts**, không áp dụng cho users/roles trong management account.
- Câu hỏi nói **consolidated billing**: gắn với **AWS Organizations**.

## Nguồn chính thức

- AWS Organizations: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html
- Service control policies (SCPs): https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html
- Consolidated billing for AWS Organizations: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html
- AWS Control Tower: https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html
- IAM Identity Center: https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html
- IAM Identity Center permission sets: https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html
- AWS Service Catalog: https://docs.aws.amazon.com/servicecatalog/latest/adminguide/introduction.html

### Tài liệu liên quan trong repo

- [AWS Organizations](aws-organizations.md)
- [AWS Control Tower](aws-control-tower.md)
- [AWS Service Catalog](aws-service-catalog.md)
- [IAM Management Overview](aws-iam-management-overview.md)
- [IAM Identity Center](iam-identity-center.md)
