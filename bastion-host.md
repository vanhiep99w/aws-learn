# Bastion Host

## Mục lục

- [Tổng quan](#tổng-quan)
- [Bastion Host dùng để làm gì](#bastion-host-dùng-để-làm-gì)
- [Kiến trúc cơ bản](#kiến-trúc-cơ-bản)
- [Luồng truy cập SSH qua Bastion Host](#luồng-truy-cập-ssh-qua-bastion-host)
- [Security Group mẫu](#security-group-mẫu)
- [Network ACL cần lưu ý](#network-acl-cần-lưu-ý)
- [Bastion Host truyền thống vs Session Manager](#bastion-host-truyền-thống-vs-session-manager)
- [Best Practices](#best-practices)
- [Lỗi hiểu nhầm thường gặp](#lỗi-hiểu-nhầm-thường-gặp)
- [Nguồn AWS chính thức](#nguồn-aws-chính-thức)

---

## Tổng quan

**Bastion Host** hay **Jump Box** là một server trung gian dùng làm **điểm truy cập duy nhất** từ mạng bên ngoài vào các tài nguyên nằm trong private network.

Trong AWS, Bastion Host thường là một **EC2 instance đặt trong public subnet**. Người quản trị SSH vào Bastion Host trước, sau đó từ Bastion Host mới SSH tiếp vào các EC2 instance trong private subnet.

Mục tiêu chính:

- Không expose trực tiếp EC2 private ra Internet
- Gom luồng quản trị SSH/RDP vào một điểm kiểm soát
- Dễ audit, logging, hardening và giới hạn source IP

AWS Prescriptive Guidance định nghĩa bastion host là server cung cấp một single point of access từ external network vào resources trong private network.

---

## Bastion Host dùng để làm gì

Giả sử bạn có kiến trúc:

```text
Internet
   |
   | SSH 22
   v
Public Subnet
[Bastion Host]
   |
   | SSH 22 private IP
   v
Private Subnet
[App Server] [Database Admin Server] [Internal EC2]
```

Các EC2 trong private subnet:

- Không có public IP
- Không nhận SSH trực tiếp từ Internet
- Chỉ cho phép SSH từ Security Group của Bastion Host

Bastion Host đóng vai trò như “cổng vào quản trị”.

---

## Kiến trúc cơ bản

Một setup Bastion Host truyền thống thường có:

| Thành phần | Vị trí | Vai trò |
|---|---|---|
| Internet Gateway | Gắn với VPC | Cho public subnet ra/vào Internet |
| Public subnet | Có route `0.0.0.0/0` tới Internet Gateway | Chứa Bastion Host |
| Bastion Host | EC2 có public IP hoặc Elastic IP | Nhận SSH từ admin |
| Private subnet | Không route trực tiếp tới Internet Gateway | Chứa app/database/internal EC2 |
| Security Group của Bastion | Allow SSH từ IP admin |
| Security Group của private EC2 | Allow SSH từ SG của Bastion |

Ví dụ route table:

```text
Public subnet route table:
10.0.0.0/16    local
0.0.0.0/0      igw-xxxxxxxx

Private subnet route table:
10.0.0.0/16    local
# Không có route trực tiếp tới Internet Gateway
# Có thể có NAT Gateway nếu private EC2 cần outbound Internet
```

---

## Luồng truy cập SSH qua Bastion Host

Ví dụ:

```text
Admin laptop public IP: 203.0.113.10
Bastion public IP:      54.10.10.10
Bastion private IP:     10.0.1.10
Private EC2 IP:         10.0.2.20
```

### Bước 1: Admin SSH vào Bastion Host

```bash
ssh -i bastion-key.pem ec2-user@54.10.10.10
```

Luồng traffic:

```text
203.0.113.10 ---> 54.10.10.10:22
```

Security Group của Bastion cần allow:

```text
Inbound:
TCP 22 từ 203.0.113.10/32
```

### Bước 2: Từ Bastion SSH vào EC2 private

```bash
ssh ec2-user@10.0.2.20
```

Luồng traffic:

```text
10.0.1.10 ---> 10.0.2.20:22
```

Security Group của EC2 private nên allow source là **Security Group của Bastion**, không nên allow toàn bộ VPC nếu không cần.

```text
Inbound:
TCP 22 từ sg-bastion
```

---

## Security Group mẫu

### Bastion Host Security Group

Inbound:

| Type | Protocol | Port | Source | Ghi chú |
|---|---|---:|---|---|
| SSH | TCP | 22 | `203.0.113.10/32` | Chỉ IP admin hoặc VPN office |

Outbound:

| Type | Protocol | Port | Destination | Ghi chú |
|---|---|---:|---|---|
| SSH | TCP | 22 | Private subnet CIDR hoặc SG private EC2 | SSH vào máy private |
| HTTPS | TCP | 443 | `0.0.0.0/0` | Optional: update package, SSM, download tools |

### Private EC2 Security Group

Inbound:

| Type | Protocol | Port | Source | Ghi chú |
|---|---|---:|---|---|
| SSH | TCP | 22 | `sg-bastion` | Chỉ Bastion được SSH vào |
| App port | TCP | 8080/443/... | ALB SG hoặc app SG | Tùy workload |

Outbound:

| Type | Protocol | Port | Destination | Ghi chú |
|---|---|---:|---|---|
| HTTPS | TCP | 443 | `0.0.0.0/0` hoặc VPC endpoints | Optional |

Security Group là **stateful**, nên response traffic tự động được cho phép. Không cần mở rule ngược riêng cho response.

---

## Network ACL cần lưu ý

Network ACL là **stateless**, nên nếu bạn dùng NACL để siết subnet, phải mở cả chiều request và response.

### Trường hợp Internet SSH vào Bastion

Client ngoài Internet kết nối:

```text
Client ephemeral port 54321 ---> Bastion port 22
```

Response từ Bastion:

```text
Bastion port 22 ---> Client ephemeral port 54321
```

NACL cho public subnet chứa Bastion thường cần:

Inbound:

```text
ALLOW TCP 22 từ IP admin
```

Outbound:

```text
ALLOW TCP 1024-65535 đến IP admin
```

Nếu chỉ mở inbound port 22 mà outbound không cho ephemeral ports, packet SSH có thể đi vào subnet nhưng Bastion không trả lời ra được, kết quả là SSH timeout.

### Trường hợp Bastion SSH vào private EC2

NACL của private subnet chứa EC2 private cần:

Inbound:

```text
ALLOW TCP 22 từ private IP/CIDR của Bastion subnet
```

Outbound:

```text
ALLOW TCP 1024-65535 về Bastion subnet
```

Cách nhớ:

```text
NACL = stateless = phải mở cả request và response
Security Group = stateful = mở request là response tự được phép
```

---

## Bastion Host truyền thống vs Session Manager

AWS hiện khuyến nghị cân nhắc **AWS Systems Manager Session Manager** để giảm nhu cầu mở inbound SSH hoặc duy trì Bastion Host truyền thống.

Theo AWS Systems Manager documentation, Session Manager cho phép quản lý EC2/managed nodes mà không cần mở inbound ports, không cần duy trì bastion hosts hoặc SSH keys.

| Tiêu chí | Bastion truyền thống | Session Manager |
|---|---|---|
| Cần public IP | Thường có | Không cần |
| Cần mở inbound SSH | Có, nếu SSH từ Internet | Không cần mở inbound port |
| Access control | SSH key + SG + OS user | IAM policy + SSM permissions |
| Logging | Tự cấu hình thêm | Có thể tích hợp CloudTrail, S3, CloudWatch Logs |
| Attack surface | Bastion exposed ra Internet nếu đặt public | Nhỏ hơn vì không mở inbound SSH |
| Phù hợp | Mô hình cũ, tooling cần SSH trực tiếp | Mô hình quản trị hiện đại hơn |

AWS Prescriptive Guidance cũng có pattern dùng Session Manager và EC2 Instance Connect để truy cập bastion host mà không cần long-term SSH keys hoặc open inbound port ra Internet.

---

## Best Practices

### Nếu vẫn dùng Bastion Host truyền thống

- Chỉ mở SSH từ IP cố định của admin/VPN, ví dụ `203.0.113.10/32`
- Không mở SSH từ `0.0.0.0/0`
- Dùng key riêng cho bastion, quản lý private key chặt chẽ
- Tắt password authentication trên OS
- Bật MFA ở tầng IAM/VPN nếu có thể
- Cập nhật OS thường xuyên
- Bật CloudTrail, VPC Flow Logs, CloudWatch Agent hoặc audit logs
- Dùng Elastic IP nếu cần IP cố định
- Không đặt database trong public subnet chỉ vì cần admin access
- Private EC2 chỉ allow SSH từ Security Group của Bastion, không allow từ Internet

### Nếu dùng Session Manager

- Gắn IAM role phù hợp cho EC2, ví dụ policy cho Systems Manager managed instance
- Đảm bảo SSM Agent chạy trên instance
- Instance cần kết nối được tới Systems Manager endpoint qua Internet/NAT hoặc VPC endpoints
- Dùng IAM policy để giới hạn user nào được start session vào instance nào
- Bật logging session vào S3 hoặc CloudWatch Logs nếu cần audit

---

## Lỗi hiểu nhầm thường gặp

### 1. “Private subnet nghĩa là không ai truy cập được”

Không đúng. Private subnet nghĩa là subnet không có route trực tiếp từ Internet Gateway cho inbound public access. Tài nguyên bên trong vẫn có thể được truy cập qua:

- Bastion Host
- VPN
- Direct Connect
- Session Manager
- PrivateLink
- Peering/Transit Gateway tùy route và security controls

### 2. “Bastion Host làm app server an toàn hơn”

Bastion không thay thế Security Group, IAM, patching, logging hoặc hardening. Nó chỉ là một điểm trung gian để quản trị.

### 3. “Có Bastion thì private EC2 cần public IP”

Không cần. Bastion SSH vào private EC2 bằng **private IP** trong VPC.

### 4. “Network ACL chỉ cần mở inbound SSH”

Không đủ nếu NACL đang siết chặt outbound. Vì NACL stateless, response phải được allow ở chiều ngược lại.

---

## Nguồn AWS chính thức

- [AWS Prescriptive Guidance - Access a bastion host by using Session Manager and Amazon EC2 Instance Connect](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/access-a-bastion-host-by-using-session-manager-and-amazon-ec2-instance-connect.html)
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [Start a session - AWS Systems Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html)
- [Compare security groups and network ACLs - Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html#VPC_Security_Comparison)
