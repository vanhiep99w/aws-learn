# Elastic Fabric Adapter (EFA)

## Mục lục

- [Tóm tắt nhanh](#tóm-tắt-nhanh)
- [EFA là gì?](#efa-là-gì)
- [Vấn đề EFA giải quyết](#vấn-đề-efa-giải-quyết)
- [Mental model dễ nhớ](#mental-model-dễ-nhớ)
- [EFA hoạt động như thế nào?](#efa-hoạt-động-như-thế-nào)
- [ENA vs EFA vs EFA-only](#ena-vs-efa-vs-efa-only)
- [EFA dùng cho workload nào?](#efa-dùng-cho-workload-nào)
- [EFA không phù hợp khi nào?](#efa-không-phù-hợp-khi-nào)
- [Thành phần kỹ thuật cần nhớ](#thành-phần-kỹ-thuật-cần-nhớ)
- [Yêu cầu và giới hạn quan trọng](#yêu-cầu-và-giới-hạn-quan-trọng)
- [Cách triển khai EFA thủ công trên EC2](#cách-triển-khai-efa-thủ-công-trên-ec2)
- [Triển khai EFA với AWS ParallelCluster](#triển-khai-efa-với-aws-parallelcluster)
- [EFA trong AI/ML distributed training](#efa-trong-aiml-distributed-training)
- [EFA trong HPC/MPI](#efa-trong-hpcmpi)
- [Security Group cho EFA](#security-group-cho-efa)
- [Placement Group và subnet/AZ](#placement-group-và-subnetaz)
- [Monitoring và troubleshooting](#monitoring-và-troubleshooting)
- [Chi phí](#chi-phí)
- [So sánh EFA với các dịch vụ/công nghệ dễ nhầm](#so-sánh-efa-với-các-dịch-vụcông-nghệ-dễ-nhầm)
- [Kiến trúc mẫu](#kiến-trúc-mẫu)
- [Checklist thiết kế](#checklist-thiết-kế)
- [Mẹo nhớ nhanh](#mẹo-nhớ-nhanh)
- [Nguồn AWS chính thức](#nguồn-aws-chính-thức)

---

## Tóm tắt nhanh

**Elastic Fabric Adapter (EFA)** là network device có thể gắn vào EC2 instance để tăng tốc giao tiếp **giữa các instance** cho workload **AI/ML distributed training** và **High Performance Computing (HPC)**.

Nếu chỉ nhớ một câu:

> **EFA = card mạng đặc biệt cho EC2 cluster cần latency thấp, throughput cao, giao tiếp node-to-node cực nhanh.**

| Câu hỏi | Trả lời nhanh |
|---|---|
| EFA dùng để làm gì? | Tăng tốc inter-instance communication cho AI/ML, HPC, MPI, NCCL |
| Có phải internet/network bình thường không? | Không. EFA tối ưu traffic đặc biệt giữa instances, không thay thế VPC networking thông thường |
| Có dùng IP routing bình thường không? | EFA traffic không routable; ENA trong EFA interface vẫn xử lý IP traffic bình thường |
| Có chạy cross-AZ không? | Không cho EFA traffic. Nên đặt instances trong cùng AZ, thường cùng cluster placement group |
| Có mất thêm phí EFA không? | AWS docs: EFA là optional EC2 networking feature, không tính thêm phí trên supported instances |
| Cần thư viện gì? | Libfabric/OFI, MPI hoặc NCCL/NIXL/Neuron SDK tùy workload |
| Dễ nhầm với gì? | ENA, placement group, Direct Connect, SR-IOV, Elastic Network Interface |

---

## EFA là gì?

Theo AWS, **Elastic Fabric Adapter (EFA)** là một network device gắn vào Amazon EC2 instance để tăng tốc workload **Artificial Intelligence (AI)**, **Machine Learning (ML)** và **High Performance Computing (HPC)**.

EFA giúp đạt:

- **Latency thấp hơn và ổn định hơn** so với TCP transport truyền thống trong cloud HPC.
- **Throughput cao hơn** cho giao tiếp giữa instances.
- **OS-bypass**: ứng dụng có thể giao tiếp gần trực tiếp với EFA device thông qua Libfabric, giảm overhead của kernel networking stack.
- Tối ưu cho các framework cần giao tiếp node-to-node dày đặc như **MPI**, **NCCL**, **NIXL**, **AWS Neuron SDK**.

EFA không phải là một service độc lập kiểu database/queue. Nó là **tính năng network của EC2** cho một số instance types được hỗ trợ.

---

## Vấn đề EFA giải quyết

Trong nhiều workload compute lớn, bottleneck không chỉ là CPU/GPU mà là **network giữa các node**.

Ví dụ:

- Train mô hình deep learning trên 64 GPU instances: các node phải đồng bộ gradient liên tục.
- Mô phỏng thời tiết/CFD/physics bằng MPI: mỗi process cần trao đổi dữ liệu với process khác cực nhanh.
- Distributed inference hoặc disaggregated inference: nhiều node cần truyền tensor/activation/state với latency thấp.

Nếu dùng TCP/IP thông thường:

```text
Application
  ↓
MPI/NCCL
  ↓
Kernel TCP/IP stack
  ↓
ENA driver
  ↓
Network
```

Mỗi lần qua kernel/network stack tạo overhead. Với workload tightly-coupled, overhead nhỏ cũng làm giảm scaling efficiency.

EFA rút ngắn đường đi:

```text
Application
  ↓
MPI/NCCL/NIXL/Neuron
  ↓
Libfabric / OFI
  ↓
EFA device - OS-bypass
  ↓
AWS network
```

Kết quả: latency thấp hơn, throughput tốt hơn, hiệu quả scale-out tốt hơn.

---

## Mental model dễ nhớ

Hãy tưởng tượng cluster EC2 là một đội công nhân cần chuyền vật liệu liên tục:

- **ENA** = đường phố bình thường, xe nào cũng đi được, có biển số/IP/routing.
- **Placement Group** = sắp công nhân đứng gần nhau trong cùng khu để chuyền nhanh hơn.
- **EFA** = băng chuyền tốc độ cao giữa công nhân, chỉ dùng cho loại hàng đặc biệt HPC/AI.
- **Libfabric/MPI/NCCL** = quy tắc và tay cầm để dùng băng chuyền đó.

Câu nhớ:

> **Placement Group đưa máy lại gần nhau; EFA cho chúng nói chuyện cực nhanh; MPI/NCCL là ứng dụng biết dùng EFA.**

---

## EFA hoạt động như thế nào?

EFA cung cấp các capability quan trọng:

### 1. OS-bypass

Ứng dụng HPC/AI có thể bypass kernel networking path thông qua **Libfabric**. Việc này giảm context switch và kernel overhead.

Không phải mọi traffic đều bypass OS. Chỉ workload/libraries biết dùng Libfabric/EFA mới tận dụng lợi ích này.

### 2. SRD - Scalable Reliable Datagram

AWS docs mô tả EFA device có built-in OS-bypass và congestion control thông qua **Scalable Reliable Datagram (SRD)** protocol.

SRD là transport được AWS tối ưu trên hạ tầng AWS network để cung cấp reliable transport latency thấp cho HPC/ML.

### 3. Tích hợp thư viện HPC/AI

EFA tích hợp với:

- **Libfabric / OpenFabrics Interfaces (OFI)**
- **Open MPI 4.1+**
- **Intel MPI 2019 Update 5+**
- **NVIDIA Collective Communications Library (NCCL) 2.4.2+**
- **NVIDIA Inference Xfer Library (NIXL) 1.0.0+**
- **AWS Neuron SDK 2.3+**

### 4. RDMA support

AWS docs nêu:

- EFA hỗ trợ **RDMA write** trên hầu hết supported instance types có Nitro version 4 trở lên.
- **RDMA read** được hỗ trợ trên tất cả instances có Nitro version 4 trở lên.

Cần kiểm tra supported instance type cụ thể vì RDMA write không phải instance nào cũng có.

---

## ENA vs EFA vs EFA-only

Amazon EC2 có nhiều kiểu network interface liên quan:

| Loại | IP networking | Gán IPv4/IPv6 | Là primary ENI được không? | Mục đích |
|---|---:|---:|---:|---|
| **ENA** | Có | Có | Có | Networking thông thường trong VPC |
| **EFA with ENA** | Có | Có | Có | Vừa có IP networking, vừa có EFA device cho HPC/AI |
| **EFA-only** | Không | Không | Không | Chỉ EFA device, tách traffic EFA khỏi IP traffic |

### ENA là gì?

**Elastic Network Adapter (ENA)** là enhanced networking adapter cho EC2, phục vụ traffic IP bình thường: SSH, HTTP, database, package download, control plane app traffic.

### EFA with ENA là gì?

Một network interface vừa có:

- **ENA device** cho IP networking.
- **EFA device** cho low-latency HPC/AI communication.

Đây là kiểu dễ hiểu nhất khi bắt đầu.

### EFA-only là gì?

Interface chỉ có EFA device, **không có IP address**, không dùng cho IP routing. AWS ParallelCluster mới có thể tự cấu hình EFA-only để tách EFA traffic khỏi IP traffic, tối ưu bandwidth và tiết kiệm IP address.

---

## EFA dùng cho workload nào?

### Nên dùng EFA khi workload tightly-coupled

EFA phù hợp nhất khi các node phải trao đổi dữ liệu liên tục và performance phụ thuộc mạnh vào latency/network throughput.

| Workload | Vì sao EFA hữu ích |
|---|---|
| Distributed deep learning training | Đồng bộ gradient/all-reduce bằng NCCL |
| HPC simulation | MPI communication dày đặc giữa processes |
| Computational fluid dynamics (CFD) | Domain decomposition cần exchange boundary data |
| Weather modeling | Nhiều node trao đổi state liên tục |
| Genomics/financial risk simulation | Parallel compute cần low latency |
| Distributed inference đặc thù | Truyền tensor/state giữa node bằng NIXL hoặc framework hỗ trợ |

### Workload loosely-coupled có thể không cần EFA

Ví dụ:

- Web servers sau load balancer.
- Batch jobs độc lập, ít giao tiếp nhau.
- ETL jobs chủ yếu đọc/ghi S3.
- Microservices giao tiếp HTTP/gRPC bình thường.
- Database replication thông thường.

Các workload này thường cần ENA/network bandwidth bình thường, placement design, hoặc storage optimization hơn là EFA.

---

## EFA không phù hợp khi nào?

Không chọn EFA chỉ vì “muốn network nhanh hơn”. Chọn EFA khi ứng dụng thực sự biết dùng MPI/NCCL/Libfabric/EFA.

Không phù hợp nếu:

- App chỉ giao tiếp HTTP/TCP bình thường.
- Bottleneck là disk/S3/database chứ không phải node-to-node latency.
- Các instances nằm nhiều AZ và cần cross-AZ active-active communication.
- Bạn cần routable network path qua VPC peering/TGW/VPN/DX — EFA traffic không routable.
- Instance type hoặc OS không hỗ trợ.
- Bạn không muốn quản lý HPC/AI runtime; khi đó cân nhắc managed services như SageMaker, AWS ParallelCluster, AWS Batch, EKS với plugin phù hợp.

---

## Thành phần kỹ thuật cần nhớ

| Thành phần | Vai trò |
|---|---|
| **EC2 supported instance type** | Phần cứng/Nitro support EFA |
| **EFA network interface** | Device gắn vào instance |
| **Security Group self-reference all traffic** | Điều kiện cần để OS-bypass hoạt động giữa nodes |
| **Same subnet/AZ** | EFA traffic không cross-AZ/VPC |
| **Cluster Placement Group** | Giảm latency bằng cách đặt instances gần nhau |
| **EFA installer** | Cài driver/libfabric/plugin cần thiết |
| **Libfabric/OFI** | User-space API để app dùng EFA |
| **MPI/NCCL/NIXL/Neuron** | Communication library sử dụng EFA |
| **AMI đã cài EFA** | Dùng để launch nhiều nodes nhất quán |
| **Launch Template/ParallelCluster** | Tự động hóa cấu hình EFA |

---

## Yêu cầu và giới hạn quan trọng

### 1. Phải dùng supported instance types

Không phải EC2 instance nào cũng hỗ trợ EFA. Các dòng HPC/GPU/network-optimized/compute lớn thường có hỗ trợ, nhưng phải kiểm tra AWS docs hoặc CLI.

Ví dụ cách kiểm tra bằng AWS CLI:

```bash
aws ec2 describe-instance-types \
  --filters Name=network-info.efa-supported,Values=true \
  --query 'InstanceTypes[*].InstanceType' \
  --output table
```

### 2. Hệ điều hành phải được hỗ trợ

AWS docs liệt kê OS support theo x86_64 và Graviton/arm64, gồm các bản như:

- Amazon Linux 2023
- Amazon Linux 2
- RHEL 8/9/10
- Debian 11/12/13
- Rocky Linux 8/9
- Ubuntu 22.04/24.04
- SUSE Linux Enterprise 15 SP2+
- OpenSUSE Leap 15.5+ cho x86_64

Nếu dùng Intel MPI, cần kiểm tra thêm support từ Intel MPI documentation.

### 3. EFA traffic không cross-AZ hoặc cross-VPC

Đây là điểm cực kỳ quan trọng:

> **EFA traffic không thể đi qua Availability Zones hoặc VPCs.**

Điều này không áp dụng cho IP traffic bình thường từ ENA device của EFA interface. Nghĩa là SSH/HTTP/IP vẫn routable theo VPC, nhưng EFA device traffic thì không.

### 4. EFA traffic không routable

EFA traffic không đi qua route table/TGW/VPC peering/VPN/Direct Connect như IP traffic bình thường.

### 5. Không hỗ trợ AWS Outposts

AWS docs nêu EFA không được hỗ trợ trên AWS Outposts.

### 6. Không attach/detach khi instance đang running

Khác ENI bình thường ở một điểm quan trọng: EFA không thể attach/detach khỏi instance ở trạng thái `running`. Cần instance stopped hoặc attach khi launch.

### 7. Security Group phải cho phép all traffic self-reference

Để OS-bypass hoạt động, EFA phải thuộc security group cho phép **all inbound và all outbound traffic tới chính security group đó**.

### 8. Multiple network cards

Instance types hỗ trợ nhiều network cards có thể cấu hình **một EFA trên mỗi network card**. Các supported instance types khác thường chỉ hỗ trợ một EFA per instance.

### 9. Dedicated Instance/Host limitation

AWS docs nêu `c7g.16xlarge`, `m7g.16xlarge`, `r7g.16xlarge` Dedicated Instances và Dedicated Hosts không được hỗ trợ khi attach EFA.

### 10. Windows support bị giới hạn

EFA device của EFA with ENA interface trên Windows chỉ hỗ trợ cho AWS CDI SDK based applications. Với non-CDI SDK based applications, nó hoạt động như ENA interface, không có EFA capabilities bổ sung. EFA-only không hỗ trợ AWS CDI based applications trên Windows hoặc Linux.

---

## Cách triển khai EFA thủ công trên EC2

Flow thủ công phổ biến:

```text
1. Chọn supported instance type + OS
2. Tạo security group EFA self-reference
3. Launch temporary instance
4. Cài EFA software installer
5. Verify Libfabric/EFA
6. Cài app HPC/AI
7. Tạo AMI
8. Launch cluster trong cùng subnet/AZ + cluster placement group
9. Chạy MPI/NCCL job
```

### Bước 1: Security group

Tạo security group trong VPC sẽ chạy cluster.

Inbound:

| Type | Source |
|---|---|
| All traffic | Chính security group đó |
| SSH | IP quản trị của bạn, không nên `0.0.0.0/0` cho production |

Outbound:

| Type | Destination |
|---|---|
| All traffic | Chính security group đó |
| Cần thêm internet/NAT/VPC endpoint tùy việc cài package, gọi AWS API |

### Bước 2: Launch temporary instance

Chọn:

- Supported AMI/OS.
- Supported instance type.
- Subnet trong AZ mong muốn.
- Security group EFA.
- Enable EFA khi launch hoặc attach EFA khi instance stopped.

### Bước 3: Cài EFA software

AWS có EFA installer để cài driver, Libfabric, Open MPI integration... Tùy OS, dùng hướng dẫn AWS hiện hành.

Sau cài đặt, verify bằng các lệnh như:

```bash
fi_info -p efa
```

Nếu không thấy provider `efa`, thường do driver/library chưa đúng, instance không support, EFA chưa attach, hoặc OS/kernel không phù hợp.

### Bước 4: Tạo AMI

Khi node mẫu đã có EFA software + app dependencies, tạo AMI để launch toàn bộ cluster nhất quán.

### Bước 5: Launch cluster trong cluster placement group

Dùng **cluster placement group** để đặt instances gần nhau, tối ưu low-latency network.

### Bước 6: Chạy workload

Ví dụ MPI:

```bash
mpirun -np 16 -hostfile hosts ./my_hpc_app
```

Ví dụ NCCL workload thường thông qua framework như PyTorch Distributed, DeepSpeed, Megatron-LM, Horovod, hoặc script training tự cấu hình backend.

---

## Triển khai EFA với AWS ParallelCluster

**AWS ParallelCluster** là cách dễ hơn để tạo HPC cluster trên AWS.

Theo AWS docs, với ParallelCluster và Slurm scheduler, bật EFA bằng cấu hình:

```yaml
SlurmQueues:
  - Name: compute
    ComputeResources:
      - Name: hpc
        InstanceType: c7gn.16xlarge
        Efa:
          Enabled: true
```

AWS khuyến nghị chạy EFA-enabled instances trong **placement group** để giảm latency. ParallelCluster có cấu hình PlacementGroup trong phần Networking.

Từ AWS ParallelCluster 3.15.0, khi bật EFA, ParallelCluster tự động cấu hình **EFA-only network interfaces** để tách EFA traffic khỏi IP traffic, tối ưu bandwidth và giảm tiêu thụ IP address. Đây là default được AWS khuyến nghị cho đa số tightly-coupled HPC và distributed AI/ML training.

**Khi nên dùng ParallelCluster:**

- Bạn chạy HPC bằng Slurm.
- Cần auto scaling compute nodes.
- Muốn tránh tự viết quá nhiều automation AMI/launch template.
- Muốn cấu hình EFA, placement group, shared storage, scheduler theo mô hình chuẩn HPC.

---

## EFA trong AI/ML distributed training

Trong distributed training, nhiều GPU nodes cần truyền gradient hoặc tensor qua network. Các operation như **all-reduce**, **all-gather**, **reduce-scatter** có thể trở thành bottleneck.

EFA giúp khi framework sử dụng NCCL qua OFI/EFA:

```text
PyTorch / TensorFlow / JAX
        ↓
Distributed backend
        ↓
NCCL
        ↓
AWS OFI NCCL / Libfabric
        ↓
EFA
        ↓
AWS network
```

### Ví dụ workload

- Train LLM hoặc model thị giác lớn trên nhiều P4d/P5/Trn/Inf instances.
- Data parallel training cần gradient synchronization.
- Model parallel/pipeline parallel training cần truyền activation giữa nodes.

### Lưu ý

- EFA chỉ giúp phần communication. Nếu bottleneck là data loading từ S3/EBS/EFS/FSx, cần tối ưu storage/data pipeline.
- Với GPU training, cần đúng driver CUDA/NCCL/framework version.
- Với AWS Neuron, cần đúng Neuron SDK version và instance train/inference phù hợp.

---

## EFA trong HPC/MPI

Trong HPC, nhiều ứng dụng dùng **Message Passing Interface (MPI)**.

```text
HPC application
      ↓
Open MPI / Intel MPI
      ↓
Libfabric / OFI
      ↓
EFA
```

### EFA đặc biệt hữu ích cho tightly-coupled MPI

Ví dụ:

- CFD
- weather simulation
- molecular dynamics
- finite element analysis
- reservoir simulation

### Không phải mọi MPI job đều cần EFA

Nếu MPI job ít communication, chạy embarrassingly parallel, hoặc chủ yếu đọc/ghi file, EFA có thể không tạo khác biệt lớn.

---

## Security Group cho EFA

Security group là lỗi cấu hình phổ biến nhất với EFA.

### Rule cần có cho EFA OS-bypass

Inbound:

```text
Type: All traffic
Source: sg-xxxxxxxxxxxxxxxxx  # chính security group EFA
```

Outbound:

```text
Type: All traffic
Destination: sg-xxxxxxxxxxxxxxxxx  # chính security group EFA
```

### SSH rule

Production không nên mở SSH toàn internet. Dùng một trong các cách:

- Source là corporate IP/VPN CIDR.
- Bastion host.
- AWS Systems Manager Session Manager nếu phù hợp.

### Vì sao cần self-reference all traffic?

Các node trong cluster cần giao tiếp EFA với nhau. Self-reference rule đảm bảo tất cả instances cùng security group có thể truyền traffic cần thiết cho EFA/MPI/NCCL.

---

## Placement Group và subnet/AZ

EFA thường đi cùng **cluster placement group**.

### Cluster placement group làm gì?

Cluster placement group cố gắng đặt instances gần nhau về mặt vật lý để đạt network latency thấp và throughput cao.

### Vì sao cùng subnet/AZ quan trọng?

- EFA traffic không cross-AZ.
- Placement group cluster nằm trong một AZ.
- Các node nên được launch trong cùng subnet/AZ để tránh lỗi hoặc performance không đạt.

### Trade-off

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| Single AZ + cluster placement group | Latency thấp nhất cho EFA | Không có HA cross-AZ cho một job tightly-coupled |
| Multi-AZ | HA tốt hơn cho app web/microservices | Không phù hợp EFA traffic |

Với HPC/AI training, job thường được thiết kế checkpoint/retry hơn là active-active multi-AZ trong cùng một training job.

---

## Monitoring và troubleshooting

### Kiểm tra EFA provider

```bash
fi_info -p efa
```

Nếu lỗi:

- Instance type có support EFA không?
- EFA đã attach chưa?
- OS có support không?
- EFA installer đã cài đúng chưa?
- Security group self-reference đã đúng chưa?

### Kiểm tra network interface

```bash
ip link
lspci | grep -i efa
```

Tùy OS/AMI, tên interface và output có thể khác.

### Lỗi thường gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `fi_info -p efa` không thấy provider | Chưa cài EFA software hoặc không attach EFA | Cài installer, kiểm tra launch config |
| MPI chạy nhưng performance không khác TCP | MPI không dùng OFI/EFA provider | Kiểm tra MPI build/env vars/provider |
| Job fail khi chạy nhiều node | Security group thiếu self-reference all traffic | Thêm inbound/outbound all traffic từ chính SG |
| Không launch đủ node trong placement group | Capacity trong AZ không đủ | Thử AZ khác, capacity reservation, chọn instance type khác |
| Cross-AZ communication không dùng EFA | EFA traffic không cross-AZ | Đưa nodes về cùng AZ/subnet |
| Attach EFA vào running instance lỗi | EFA không attach/detach khi running | Stop instance hoặc attach lúc launch |

### Monitoring

AWS có hướng dẫn monitor EFA riêng. Ngoài ra cần theo dõi:

- EC2 instance metrics trong CloudWatch.
- Application-level metrics: step time, all-reduce time, throughput, samples/sec.
- NCCL/MPI debug logs.
- Network/performance benchmark như OSU Micro-Benchmarks, NCCL tests.

---

## Chi phí

Theo AWS docs:

> EFA là optional Amazon EC2 networking feature có thể bật trên supported instance, **không có chi phí bổ sung**.

Tuy nhiên vẫn có chi phí liên quan:

- EC2 instances, đặc biệt GPU/HPC instances.
- EBS/FSx/EFS/S3 data storage.
- Data transfer theo quy tắc AWS thông thường nếu có traffic tính phí khác.
- ParallelCluster/Slurm infrastructure resources nếu dùng.
- Capacity Reservation/Savings Plans/Reserved Instances nếu áp dụng.

---

## So sánh EFA với các dịch vụ/công nghệ dễ nhầm

### EFA vs ENA

| Tiêu chí | ENA | EFA |
|---|---|---|
| Mục đích | IP networking thông thường | HPC/AI low-latency communication |
| Dùng cho SSH/HTTP? | Có | EFA device không; EFA with ENA có ENA để làm việc này |
| OS-bypass | Không phải trọng tâm | Có |
| Routable | Có | EFA traffic không routable |
| Workload | Hầu hết EC2 apps | MPI/NCCL/Libfabric-aware apps |

### EFA vs Elastic Network Interface (ENI)

EFA là một loại network interface đặc biệt. ENI là khái niệm network interface chung trong VPC. EFA có thêm EFA device capability cho HPC/AI.

### EFA vs Placement Group

| EFA | Placement Group |
|---|---|
| Network device/protocol/library path | Cách đặt instances gần nhau |
| Cần app hỗ trợ EFA | Không cần app support |
| Tối ưu communication path | Tối ưu physical placement |
| Thường dùng cùng nhau | Thường là điều kiện tốt để EFA phát huy |

### EFA vs Direct Connect

| EFA | Direct Connect |
|---|---|
| Giao tiếp giữa EC2 instances trong cùng AZ/VPC context | Kết nối mạng riêng từ on-prem tới AWS |
| Không routable/cross-AZ cho EFA traffic | IP networking private/dedicated |
| Dùng cho HPC/AI cluster | Dùng cho hybrid networking |

### EFA vs SR-IOV enhanced networking

ENA enhanced networking cũng dựa trên virtualization/network offload để cải thiện performance. EFA đi xa hơn cho HPC/AI bằng OS-bypass và Libfabric/SRD path cho tightly-coupled workloads.

### EFA vs FSx for Lustre

| EFA | FSx for Lustre |
|---|---|
| Tăng tốc node-to-node communication | High-performance shared file system |
| Dùng cho MPI/NCCL communication | Dùng cho shared training/HPC datasets |
| Không lưu dữ liệu | Lưu/cung cấp dữ liệu file |

Trong HPC/AI, thường dùng cả hai:

```text
Compute nodes giao tiếp với nhau: EFA
Compute nodes đọc dataset/checkpoint: FSx for Lustre hoặc S3/EBS/EFS tùy workload
```

### EFA vs AWS ParallelCluster

| EFA | AWS ParallelCluster |
|---|---|
| Network capability của EC2 | Tool/service để tạo HPC cluster |
| Một thành phần trong cluster | Orchestrate Slurm, compute, storage, EFA, placement group |

---

## Kiến trúc mẫu

### 1. HPC MPI cluster cơ bản

```text
VPC / Single AZ
  └─ Subnet A
      └─ Cluster Placement Group
          ├─ Head/Login Node - ENA
          ├─ Compute Node 1 - EFA
          ├─ Compute Node 2 - EFA
          ├─ Compute Node 3 - EFA
          └─ Compute Node N - EFA

Shared storage: FSx for Lustre / EFS / S3
Scheduler: Slurm / AWS ParallelCluster
Communication: MPI → Libfabric → EFA
```

### 2. Distributed GPU training

```text
S3 dataset
  ↓ preload/cache
FSx for Lustre hoặc local NVMe cache
  ↓
GPU instances trong cùng AZ + Cluster Placement Group
  ├─ p5/p4/trn node 1 - EFA
  ├─ p5/p4/trn node 2 - EFA
  └─ p5/p4/trn node N - EFA

Training framework → NCCL/Neuron → Libfabric/OFI → EFA
Checkpoints → S3
Metrics/logs → CloudWatch/S3
```

### 3. ParallelCluster với EFA

```text
Admin
  ↓ pcluster create-cluster
AWS ParallelCluster
  ├─ Head node
  ├─ Slurm scheduler
  ├─ Compute queue with Efa.Enabled=true
  ├─ Cluster placement group
  └─ Shared storage
```

---

## Checklist thiết kế

Trước khi chọn EFA, kiểm tra:

- [ ] Workload có tightly-coupled node-to-node communication không?
- [ ] App/framework có hỗ trợ MPI/NCCL/NIXL/Neuron/Libfabric path không?
- [ ] Instance type có hỗ trợ EFA không?
- [ ] OS/AMI có hỗ trợ EFA không?
- [ ] Có cần RDMA read/write không, và instance type có hỗ trợ không?
- [ ] Các nodes có thể chạy trong cùng AZ/subnet không?
- [ ] Đã dùng cluster placement group chưa?
- [ ] Security group có inbound/outbound all traffic self-reference chưa?
- [ ] EFA software/Libfabric/MPI/NCCL version đúng chưa?
- [ ] Có benchmark trước/sau EFA không?
- [ ] Storage/data loading có phải bottleneck riêng không?
- [ ] Có chiến lược checkpoint/retry nếu AZ capacity hoặc job fail không?

---

## Mẹo nhớ nhanh

| Thuật ngữ | Mẹo nhớ |
|---|---|
| **EFA** | Card mạng HPC/AI cho EC2 |
| **ENA** | Card mạng IP bình thường/enhanced networking |
| **EFA with ENA** | Vừa IP traffic vừa EFA traffic |
| **EFA-only** | Chỉ EFA traffic, không IP |
| **Libfabric/OFI** | API để app nói chuyện với EFA |
| **MPI** | Chuẩn giao tiếp HPC processes |
| **NCCL** | Thư viện giao tiếp GPU distributed training |
| **SRD** | Transport AWS dùng cho EFA low-latency reliable communication |
| **Cluster Placement Group** | Đặt instances gần nhau |
| **Self-referencing Security Group** | Cho node cùng cluster nói chuyện full traffic |
| **Same AZ** | EFA traffic không cross-AZ |

Câu chốt:

> **EFA không làm mọi app nhanh hơn; EFA làm app HPC/AI biết dùng Libfabric/MPI/NCCL giao tiếp giữa EC2 nodes nhanh hơn.**

---

## Nguồn AWS chính thức

- [Elastic Fabric Adapter for AI/ML and HPC workloads on Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html) — định nghĩa EFA, OS-bypass, SRD, Libfabric, NCCL/NIXL/MPI support, EFA vs ENA vs EFA-only, supported OS, limitations, pricing.
- [Create and attach an Elastic Fabric Adapter to an Amazon EC2 instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/create-efa.html) — tạo/attach EFA, lưu ý không attach/detach khi instance running, yêu cầu security group.
- [Get started with EFA and MPI for HPC workloads on Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa-start.html) — hướng dẫn security group, cài EFA software, tạo AMI, launch cluster placement group.
- [Elastic Fabric Adapter - AWS ParallelCluster](https://docs.aws.amazon.com/parallelcluster/latest/ug/efa-v3.html) — bật EFA với ParallelCluster, khuyến nghị placement group, EFA không cross-AZ, default EFA-only network configuration từ ParallelCluster 3.15.0.
- [Placement groups for your Amazon EC2 instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/placement-groups.html) — cluster placement group cho latency thấp và tightly-coupled workloads.
