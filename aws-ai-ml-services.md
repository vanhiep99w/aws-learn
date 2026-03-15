# AWS AI/ML Services (For Cloud Practitioner)


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. Vision Services](#1-vision-services)
- [2. Speech Services](#2-speech-services)
- [3. Language Services](#3-language-services)
- [4. Chatbot Services](#4-chatbot-services)
- [5. Search & Personalization](#5-search-personalization)
- [6. Forecasting & Fraud](#6-forecasting-fraud)
- [7. Developer AI Services](#7-developer-ai-services)
- [8. Generative AI](#8-generative-ai)
- [9. ML Platform](#9-ml-platform)
- [10. Quick Reference Table](#10-quick-reference-table)
- [11. Exam Tips](#11-exam-tips)
- [Tổng kết](#tổng-kết)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

AWS cung cấp rất nhiều AI/ML services, được chia thành **3 layers**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS AI/ML STACK                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   LAYER 3: AI SERVICES (Pre-trained, No ML knowledge needed)                │
│   ─────────────────────────────────────────────────────────────────────     │
│   │ Rekognition │ Textract │ Polly │ Transcribe │ Translate   │             │
│   │ Comprehend  │ Lex      │ Kendra│ Personalize │ Forecast   │             │
│   │ Fraud Detector │ CodeGuru │ Bedrock │ Q   │                             │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   LAYER 2: ML SERVICES (Build custom models)                                │
│   ─────────────────────────────────────────────────────────────────────     │
│   │ SageMaker │ SageMaker Canvas │ SageMaker Ground Truth   │               │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   LAYER 1: ML FRAMEWORKS & INFRASTRUCTURE                                   │
│   ─────────────────────────────────────────────────────────────────────     │
│   │ EC2 (GPU instances) │ Deep Learning AMIs │ Containers   │               │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Vision Services

### Amazon Rekognition - Image & Video Analysis

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON REKOGNITION                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🎯 WHAT: Nhận dạng hình ảnh và video bằng Deep Learning                    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  CAPABILITIES:                                                      │    │
│   │                                                                     │    │
│   │  👤 Face Detection & Analysis                                       │    │
│   │     • Detect faces trong images/videos                              │    │
│   │     • Analyze emotions (happy, sad, angry...)                       │    │
│   │     • Age range, gender, glasses, beard...                          │    │
│   │                                                                     │    │
│   │  🔍 Face Comparison & Search                                        │    │
│   │     • Compare faces (is this the same person?)                      │    │
│   │     • Search faces in a collection                                  │    │
│   │                                                                     │    │
│   │  🏷️ Object & Scene Detection                                        │    │
│   │     • Detect objects: car, tree, dog, cat...                        │    │
│   │     • Detect scenes: beach, office, kitchen...                      │    │
│   │                                                                     │    │
│   │  📝 Text Detection (in images)                                      │    │
│   │     • Read text from images (signs, documents)                      │    │
│   │                                                                     │    │
│   │  🔞 Content Moderation                                              │    │
│   │     • Detect inappropriate content                                  │    │
│   │     • NSFW filtering                                                │    │
│   │                                                                     │    │
│   │  👥 Celebrity Recognition                                           │    │
│   │     • Identify famous people                                        │    │
│   │                                                                     │    │
│   │  🎬 Video Analysis                                                  │    │
│   │     • Track people across video frames                              │    │
│   │     • Detect activities                                             │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   USE CASES:                                                                 │
│   • User verification (face login)                                           │
│   • Content moderation for social media                                      │
│   • People counting in retail                                                │
│   • Celebrity detection in media                                             │
│   • Security surveillance                                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Amazon Textract - Document Text Extraction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON TEXTRACT                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Trích xuất text, tables, forms từ documents                      │
│                                                                             │
│   So sánh với OCR truyền thống:                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  OCR cũ: Chỉ extract raw text                                       │   │
│   │  Textract: Extract text + UNDERSTAND structure (tables, forms)      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   CAPABILITIES:                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  📄 Text Detection                                                  │   │
│   │     • Extract printed text từ documents                             │   │
│   │     • Handwritten text recognition                                  │   │
│   │                                                                     │   │
│   │  📊 Tables Extraction                                               │   │
│   │     • Detect và extract tables                                      │   │
│   │     • Preserve row/column structure                                 │   │
│   │                                                                     │   │
│   │  📋 Forms (Key-Value Pairs)                                         │   │
│   │     • Extract form fields: "Name: John Doe"                         │   │
│   │     • Understand checkboxes, signatures                             │   │
│   │                                                                     │   │
│   │  🆔 Identity Documents                                              │   │
│   │     • Driver's licenses, passports                                  │   │
│   │     • Extract Name, DOB, Address automatically                      │   │
│   │                                                                     │   │
│   │  💰 Expense Documents                                               │   │
│   │     • Invoices, receipts                                            │   │
│   │     • Extract vendor, total, line items                             │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   USE CASES:                                                                │
│   • Automate document processing                                            │
│   • Extract data from invoices                                              │
│   • Process loan applications                                               │
│   • Digitize paper records                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Speech Services

### Amazon Polly - Text-to-Speech (TTS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON POLLY                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Chuyển TEXT → SPEECH (Đọc văn bản thành giọng nói)               │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  Input: "Hello, welcome to Amazon Web Services"                     │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │                   ┌──────────┐                                      │   │
│   │                   │  POLLY   │                                      │   │
│   │                   └──────────┘                                      │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │  Output: 🔊 Audio file (MP3, OGG, PCM)                              │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   FEATURES:                                                                 │
│   • 60+ voices in 30+ languages                                             │
│   • Neural TTS (more natural sounding)                                      │
│   • SSML support (control pronunciation, pauses, emphasis)                  │
│   • Real-time streaming                                                     │
│   • Lexicons (custom pronunciations)                                        │
│                                                                             │
│   USE CASES:                                                                │
│   • E-learning (đọc bài giảng)                                              │
│   • Accessibility (cho người khiếm thị)                                     │
│   • News reading apps                                                       │
│   • IVR systems (automated phone menus)                                     │
│   • Audiobook generation                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Amazon Transcribe - Speech-to-Text (STT)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON TRANSCRIBE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Chuyển SPEECH → TEXT (Nhận dạng giọng nói thành văn bản)         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  Input: 🎤 Audio/Video file hoặc real-time stream                   │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │                   ┌───────────┐                                     │   │
│   │                   │TRANSCRIBE │                                     │   │
│   │                   └───────────┘                                     │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │  Output: "Hello, welcome to Amazon Web Services"                    │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   FEATURES:                                                                 │
│   • Automatic language detection                                            │
│   • Speaker identification (phân biệt người nói)                            │
│   • Custom vocabulary (technical terms)                                     │
│   • Content redaction (hide sensitive info: PII)                            │
│   • Real-time transcription                                                 │
│   • Medical transcription (Transcribe Medical)                              │
│   • Call Analytics (analyze call center recordings)                         │
│                                                                             │
│   USE CASES:                                                                │
│   • Subtitle generation cho videos                                          │
│   • Meeting transcription                                                   │
│   • Call center analytics                                                   │
│   • Medical documentation                                                   │
│   • Voice search                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Polly vs Transcribe - Nhớ nhanh

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POLLY vs TRANSCRIBE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────┐         ┌──────────────────────┐                 │
│   │      POLLY           │         │    TRANSCRIBE        │                 │
│   │   Text → Speech      │         │   Speech → Text      │                 │
│   │                      │         │                      │                 │
│   │  "Hello" → 🔊        │         │  🎤 → "Hello"        │                 │
│   │                      │         │                      │                 │
│   │  TTS (Text-to-Speech)│         │  STT (Speech-to-Text)│                 │
│   └──────────────────────┘         └──────────────────────┘                 │
│                                                                             │
│   💡 Nhớ:                                                                   │
│   • Polly = Parrot (con vẹt) = NÓI                                          │
│   • Transcribe = Ghi chép = VIẾT                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Language Services

### Amazon Translate - Language Translation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON TRANSLATE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Dịch text từ ngôn ngữ này sang ngôn ngữ khác                     │
│                                                                             │
│   "Hello, how are you?" ──► "Xin chào, bạn khỏe không?"                     │
│          (English)                    (Vietnamese)                          │
│                                                                             │
│   FEATURES:                                                                 │
│   • 75+ languages supported                                                 │
│   • Real-time và batch translation                                          │
│   • Custom terminology (giữ nguyên terms như brand names)                   │
│   • Neural machine translation (high quality)                               │
│   • Automatic language detection                                            │
│                                                                             │
│   USE CASES:                                                                │
│   • Website localization                                                    │
│   • Multilingual customer support                                           │
│   • Real-time chat translation                                              │
│   • Document translation                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Amazon Comprehend - Natural Language Processing (NLP)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON COMPREHEND                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🎯 WHAT: Phân tích và hiểu nội dung văn bản (NLP)                          │
│                                                                              │
│   CAPABILITIES:                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                                                                     │    │
│   │  😊😠😐 Sentiment Analysis                                          │    │
│   │     Input: "I love this product! Best purchase ever!"               │    │
│   │     Output: POSITIVE (98% confidence)                               │    │
│   │                                                                     │    │
│   │  🏷️ Entity Recognition (NER)                                        │    │
│   │     Input: "John works at Amazon in Seattle"                        │    │
│   │     Output: John (PERSON), Amazon (ORGANIZATION), Seattle (LOCATION)│    │
│   │                                                                     │    │
│   │  🔑 Key Phrase Extraction                                           │    │
│   │     Input: "The quick brown fox jumps over the lazy dog"            │    │
│   │     Output: ["quick brown fox", "lazy dog"]                         │    │
│   │                                                                     │    │
│   │  🌐 Language Detection                                              │    │
│   │     Input: "Bonjour, comment allez-vous?"                           │    │
│   │     Output: French (fr)                                             │    │
│   │                                                                     │    │
│   │  📂 Topic Modeling                                                  │    │
│   │     Analyze documents to find common topics                         │    │
│   │                                                                     │    │
│   │  🔒 PII Detection (Comprehend + PII)                                │    │
│   │     Detect và redact personal information                           │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   🏥 COMPREHEND MEDICAL:                                                     │
│   • Specialized cho medical text                                             │
│   • Detect diseases, medications, dosages, procedures                        │
│   • Extract PHI (Protected Health Information)                               │
│                                                                              │
│   USE CASES:                                                                 │
│   • Customer review analysis                                                 │
│   • Social media monitoring                                                  │
│   • Document classification                                                  │
│   • Call center analytics                                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Chatbot Services

### Amazon Lex - Conversational AI (Chatbots)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON LEX                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Build conversational chatbots (SAME technology as Alexa!)        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  User: "I want to book a hotel in Paris for 3 nights"               │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │          ┌──────────────────────────────┐                           │   │
│   │          │         AMAZON LEX           │                           │   │
│   │          │  ┌────────────────────────┐  │                           │   │
│   │          │  │ 1. ASR (Speech→Text)   │  │                           │   │
│   │          │  │ 2. NLU (Understand     │  │                           │   │
│   │          │  │    intent + entities)  │  │                           │   │
│   │          │  └────────────────────────┘  │                           │   │
│   │          └──────────────────────────────┘                           │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │  Intent: BookHotel                                                  │   │
│   │  Slots: City="Paris", Nights=3                                      │   │
│   │                         │                                           │   │
│   │                         ▼ (Trigger Lambda)                          │   │
│   │  Bot: "Great! I found hotels in Paris. Which one would you like?"   │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   KEY CONCEPTS:                                                             │
│   • Intent: Mục đích của user (BookHotel, OrderPizza, CheckBalance)         │
│   • Slot: Thông tin cần thu thập (city, date, amount)                       │
│   • Fulfillment: Action sau khi có đủ slots (Lambda function)               │
│                                                                             │
│   USE CASES:                                                                │
│   • Customer service chatbots                                               │
│   • Voice assistants                                                        │
│   • Booking systems                                                         │
│   • FAQ bots                                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Search & Personalization

### Amazon Kendra - Intelligent Search

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON KENDRA                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Enterprise search powered by ML (Natural Language Search)        │
│                                                                             │
│   So sánh với keyword search:                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Keyword Search: "vacation policy" → Tìm documents có từ này        │   │
│   │  Kendra: "How many vacation days do I get?" → TRẢ LỜI câu hỏi       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   FEATURES:                                                                 │
│   • Natural language queries (hỏi bằng ngôn ngữ tự nhiên)                   │
│   • Incremental learning (học từ user feedback)                             │
│   • FAQ matching                                                            │
│   • Document ranking                                                        │
│                                                                             │
│   DATA SOURCES:                                                             │
│   • S3                                                                      │
│   • SharePoint                                                              │
│   • Salesforce                                                              │
│   • ServiceNow                                                              │
│   • Databases                                                               │
│   • Custom connectors                                                       │
│                                                                             │
│   USE CASES:                                                                │
│   • Internal knowledge base search                                          │
│   • Customer support portal                                                 │
│   • Research document search                                                │
│   • HR policy search                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Amazon Personalize - Recommendation Engine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON PERSONALIZE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Real-time personalization và recommendations                     │
│           (Same technology as Amazon.com!)                                  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  Input: User behavior data                                          │   │
│   │  • User A viewed: iPhone, AirPods, MacBook                          │   │
│   │  • User A purchased: iPhone case                                    │   │
│   │                                                                     │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │                   ┌────────────┐                                    │   │
│   │                   │PERSONALIZE │                                    │   │
│   │                   └────────────┘                                    │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │                                                                     │   │
│   │  Output: "Users who bought this also bought..."                     │   │
│   │  • Apple Watch                                                      │   │
│   │  • Lightning Cable                                                  │   │
│   │  • Screen Protector                                                 │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   USE CASES:                                                                │
│   • Product recommendations (e-commerce)                                    │
│   • Content recommendations (streaming)                                     │
│   • Personalized marketing                                                  │
│   • Search re-ranking                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Forecasting & Fraud

### Amazon Forecast - Time-series Forecasting

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON FORECAST                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Dự đoán time-series data bằng ML                                 │
│           (Same technology as Amazon.com forecasting!)                      │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  Input: Historical data                                             │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec │    │   │
│   │  │  100  110  95   120  130  150  180  200  160  140  170  250 │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   │                                                                     │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │                   ┌──────────┐                                      │   │
│   │                   │ FORECAST │                                      │   │
│   │                   └──────────┘                                      │   │
│   │                         │                                           │   │
│   │                         ▼                                           │   │
│   │                                                                     │   │
│   │  Output: Predicted values for next period                           │   │
│   │  Next Jan: 115, Next Feb: 125, Next Mar: 105...                     │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   USE CASES:                                                                │
│   • Inventory planning                                                      │
│   • Demand forecasting                                                      │
│   • Resource capacity planning                                              │
│   • Financial forecasting                                                   │
│   • Workforce planning                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Amazon Fraud Detector

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON FRAUD DETECTOR                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Detect potential fraud using ML                                  │
│                                                                             │
│   FRAUD TYPES IT CAN DETECT:                                                │
│   • Online payment fraud                                                    │
│   • New account fraud                                                       │
│   • Account takeover                                                        │
│   • Promotional abuse                                                       │
│                                                                             │
│   HOW IT WORKS:                                                             │
│   1. Upload historical fraud data                                           │
│   2. Fraud Detector trains ML model                                         │
│   3. Get fraud predictions in real-time                                     │
│                                                                             │
│   USE CASES:                                                                │
│   • E-commerce fraud detection                                              │
│   • Banking transaction monitoring                                          │
│   • Account security                                                        │
│   • Promotional abuse prevention                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Developer AI Services

### Amazon CodeGuru - Code Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON CODEGURU                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: ML-powered code review và performance recommendations            │
│                                                                             │
│   2 COMPONENTS:                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  📝 CODEGURU REVIEWER                                               │   │
│   │     • Automated code reviews                                        │   │
│   │     • Find bugs, security issues, best practices                    │   │
│   │     • Supports Java, Python                                         │   │
│   │     • Integrates với GitHub, CodeCommit, Bitbucket                  │   │
│   │                                                                     │   │
│   │  📊 CODEGURU PROFILER                                               │   │
│   │     • Analyze application runtime behavior                          │   │
│   │     • Find expensive lines of code                                  │   │
│   │     • CPU utilization analysis                                      │   │
│   │     • Heap summary analysis                                         │   │
│   │     • Detect anomalies                                              │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   USE CASES:                                                                │
│   • Automate code reviews                                                   │
│   • Find performance bottlenecks                                            │
│   • Reduce production issues                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Amazon DevOps Guru - Operations Intelligence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON DEVOPS GURU                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: ML-powered để detect operational issues                          │
│                                                                             │
│   WHAT IT DOES:                                                             │
│   • Analyze CloudWatch metrics, Config, CloudTrail, X-Ray                   │
│   • Detect anomalous behavior                                               │
│   • Identify potential problems BEFORE they impact users                    │
│   • Provide recommendations cho remediation                                 │
│                                                                             │
│   USE CASES:                                                                │
│   • Proactive operations monitoring                                         │
│   • Reduce MTTR (Mean Time To Resolution)                                   │
│   • Prevent outages                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Generative AI

### Amazon Bedrock - Foundation Models

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON BEDROCK                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Fully managed service để access Foundation Models (LLMs)         │
│            Không cần manage infrastructure!                                 │
│                                                                             │
│   FOUNDATION MODELS AVAILABLE:                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  🔹 Amazon Titan (Amazon's own)                                     │   │
│   │     • Text generation, embeddings, image generation                 │   │
│   │                                                                     │   │
│   │  🔹 Anthropic Claude                                                │   │
│   │     • Advanced reasoning, analysis, coding                          │   │
│   │                                                                     │   │
│   │  🔹 Meta Llama 2                                                    │   │
│   │     • Open-source LLM                                               │   │
│   │                                                                     │   │
│   │  🔹 Stability AI (Stable Diffusion)                                 │   │
│   │     • Image generation                                              │   │
│   │                                                                     │   │
│   │  🔹 Cohere                                                          │   │
│   │     • Enterprise-focused language models                            │   │
│   │                                                                     │   │
│   │  🔹 AI21 Labs (Jurassic)                                            │   │
│   │     • Text generation                                               │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   KEY FEATURES:                                                             │
│   • Serverless (không manage infrastructure)                                │
│   • Fine-tuning với custom data (private, secure)                           │
│   • Knowledge Bases (RAG - Retrieval Augmented Generation)                  │
│   • Agents cho complex tasks                                                │
│   • Guardrails cho responsible AI                                           │
│                                                                             │
│   USE CASES:                                                                │
│   • Chatbots, virtual assistants                                            │
│   • Text summarization                                                      │
│   • Content generation                                                      │
│   • Code generation                                                         │
│   • Image generation                                                        │
│   • Search với semantic understanding                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Amazon Q - Generative AI Assistant

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON Q                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🎯 WHAT: Generative AI-powered assistant for work                         │
│                                                                             │
│   2 MAIN PRODUCTS:                                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │  💼 AMAZON Q BUSINESS                                               │   │
│   │     • AI assistant for employees                                    │   │
│   │     • Connect to enterprise data (S3, SharePoint, Salesforce...)    │   │
│   │     • Answer questions from company knowledge                       │   │
│   │     • Summarize documents                                           │   │
│   │     • Draft emails, reports                                         │   │
│   │                                                                     │   │
│   │  💻 AMAZON Q DEVELOPER                                              │   │
│   │     • AI coding assistant (like GitHub Copilot)                     │   │
│   │     • Code suggestions in IDE                                       │   │
│   │     • Explain code                                                  │   │
│   │     • Debug and fix issues                                          │   │
│   │     • Security scanning                                             │   │
│   │     • Upgrade code (e.g., Java 8 → Java 17)                         │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ALSO AVAILABLE IN:                                                        │
│   • AWS Console (Q in Console)                                              │
│   • QuickSight (Q for BI)                                                   │
│   • AWS Connect (contact center)                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. ML Platform

### Amazon SageMaker - Full ML Platform

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AMAZON SAGEMAKER                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🎯 WHAT: Complete platform để build, train, deploy ML models               │
│            End-to-end ML lifecycle management                                │
│                                                                              │
│   ML LIFECYCLE:                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                                                                     │    │
│   │  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐      │   │
│   │  │ Label  │──►│ Build  │──►│ Train  │──►│ Tune   │──►│ Deploy │      │   │
│   │  │ (GT)   │   │(Studio)│   │(Jobs)  │   │(HPO)   │   │(Endpoint)│    │   │
│   │  └────────┘   └────────┘   └────────┘   └────────┘   └────────┘      │   │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   KEY COMPONENTS:                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                                                                     │    │
│   │  🏷️ GROUND TRUTH                                                    │    │
│   │     • Data labeling service                                         │    │
│   │     • Human labelers + ML-assisted labeling                         │    │
│   │                                                                     │    │
│   │  📊 SAGEMAKER STUDIO                                                │    │
│   │     • Web-based IDE cho ML                                          │    │
│   │     • Jupyter notebooks                                             │    │
│   │     • Experiment tracking                                           │    │
│   │                                                                     │    │
│   │  🎨 SAGEMAKER CANVAS                                                │    │
│   │     • No-code ML!                                                   │    │
│   │     • Build models với visual interface                             │    │
│   │     • For business analysts (không cần code)                        │    │
│   │                                                                     │    │
│   │  🚀 TRAINING JOBS                                                   │    │
│   │     • Distributed training                                          │    │
│   │     • Built-in algorithms + custom                                  │    │
│   │     • Spot instances for cost savings                               │    │
│   │                                                                     │    │
│   │  🎯 HYPERPARAMETER TUNING                                           │    │
│   │     • Automatic model optimization                                  │    │
│   │                                                                     │    │
│   │  🌐 ENDPOINTS                                                       │    │
│   │     • Real-time inference                                           │    │
│   │     • Batch transform                                               │    │
│   │     • Serverless inference                                          │    │
│   │                                                                     │    │
│   │  📦 MODEL REGISTRY                                                  │    │
│   │     • Version control cho models                                    │    │
│   │                                                                     │    │
│   │  🔄 PIPELINES                                                       │    │
│   │     • MLOps automation                                              │    │
│   │     • CI/CD for ML                                                  │    │
│   │                                                                     │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   💡 For Cloud Practitioner: Focus on knowing SageMaker = full ML platform   │
│      Canvas = No-code ML, Ground Truth = Data labeling                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Quick Reference Table

### All AI Services - Cheat Sheet

| Service | What it does | Input → Output |
|---------|--------------|----------------|
| **Rekognition** | Image/Video analysis | Image → Faces, objects, text |
| **Textract** | Document extraction | Document → Text, tables, forms |
| **Polly** | Text-to-Speech | Text → Audio |
| **Transcribe** | Speech-to-Text | Audio → Text |
| **Translate** | Translation | Text (lang A) → Text (lang B) |
| **Comprehend** | NLP analysis | Text → Sentiment, entities, topics |
| **Lex** | Chatbots | Voice/Text → Intent + Response |
| **Kendra** | Enterprise search | Question → Answer from docs |
| **Personalize** | Recommendations | User behavior → Recommendations |
| **Forecast** | Time-series prediction | Historical data → Future values |
| **Fraud Detector** | Fraud detection | Transaction → Fraud score |
| **CodeGuru** | Code analysis | Code → Reviews + Performance tips |
| **DevOps Guru** | Operations intelligence | Metrics → Anomalies + Fixes |
| **Bedrock** | Foundation Models | Prompt → Generated content |
| **Q** | AI assistant | Question → Answer/Action |
| **SageMaker** | Full ML platform | Data → Custom ML model |

---

## 11. Exam Tips

### Câu hỏi thường gặp

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAMPLE EXAM QUESTIONS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ❓ "Service để detect faces trong images?"                                  │
│    → Amazon Rekognition                                                     │
│                                                                             │
│ ❓ "Service để extract text từ scanned documents với tables?"               │
│    → Amazon Textract                                                        │
│                                                                             │
│ ❓ "Convert text to natural sounding speech?"                               │
│    → Amazon Polly                                                           │
│                                                                             │
│ ❓ "Convert audio recordings to text?"                                      │
│    → Amazon Transcribe                                                      │
│                                                                             │
│ ❓ "Analyze sentiment of customer reviews?"                                 │
│    → Amazon Comprehend                                                      │
│                                                                             │
│ ❓ "Build chatbot like Alexa?"                                              │
│    → Amazon Lex                                                             │
│                                                                             │
│ ❓ "Intelligent search that understands natural language questions?"        │
│    → Amazon Kendra                                                          │
│                                                                             │
│ ❓ "Product recommendations for e-commerce?"                                │
│    → Amazon Personalize                                                     │
│                                                                             │
│ ❓ "Predict future demand/inventory?"                                       │
│    → Amazon Forecast                                                        │
│                                                                             │
│ ❓ "No-code ML for business analysts?"                                      │
│    → Amazon SageMaker Canvas                                                │
│                                                                             │
│ ❓ "Full ML platform để build và deploy models?"                            │
│    → Amazon SageMaker                                                       │
│                                                                             │
│ ❓ "Access to foundation models like Claude, Llama?"                        │
│    → Amazon Bedrock                                                         │
│                                                                             │
│ ❓ "AI coding assistant?"                                                   │
│    → Amazon Q Developer (hoặc CodeWhisperer)                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mnemonics - Nhớ nhanh

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY TRICKS                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🦜 Polly = Parrot = SPEAKS (Text → Speech)                                 │
│   📝 Transcribe = WRITES DOWN what you say (Speech → Text)                   │
│   👁️ Rekognition = RECOGNIZES faces/objects in images                        │
│   📄 Textract = EXTRACTS text from documents                                 │
│   🌐 Translate = TRANSLATES languages                                        │
│   🧠 Comprehend = COMPREHENDS/understands text                               │
│   💬 Lex = aLEXa = CHATBOT                                                   │
│   🔍 Kendra = SMART SEARCH                                                   │
│   🛒 Personalize = RECOMMENDATIONS (like Amazon.com)                         │
│   📈 Forecast = PREDICTS future (like Amazon logistics)                      │
│   🛡️ Fraud Detector = Detects FRAUD                                          │
│   💻 CodeGuru = GURU reviews your code                                       │
│   🤖 Bedrock = FOUNDATION for AI apps                                        │
│   🎓 SageMaker = MAKES ML models (full platform)                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS AI/ML SERVICES SUMMARY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   VISION:        Rekognition, Textract                                      │
│   SPEECH:        Polly (TTS), Transcribe (STT)                              │
│   LANGUAGE:      Translate, Comprehend                                      │
│   CHATBOT:       Lex                                                        │
│   SEARCH:        Kendra                                                     │
│   RECOMMENDATIONS: Personalize                                              │
│   FORECASTING:   Forecast, Fraud Detector                                   │
│   DEVELOPER:     CodeGuru, DevOps Guru                                      │
│   GENERATIVE AI: Bedrock, Q                                                 │
│   ML PLATFORM:   SageMaker (Canvas for no-code)                             │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   KEY POINT FOR EXAM:                                                       │
│   • Biết service nào làm gì                                                 │
│   • Biết input/output của mỗi service                                       │
│   • Không cần biết cách implement chi tiết                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tài liệu tham khảo

- [AWS Machine Learning](https://aws.amazon.com/machine-learning/)
- [Amazon Rekognition](https://aws.amazon.com/rekognition/)
- [Amazon Textract](https://aws.amazon.com/textract/)
- [Amazon Polly](https://aws.amazon.com/polly/)
- [Amazon Transcribe](https://aws.amazon.com/transcribe/)
- [Amazon Translate](https://aws.amazon.com/translate/)
- [Amazon Comprehend](https://aws.amazon.com/comprehend/)
- [Amazon Lex](https://aws.amazon.com/lex/)
- [Amazon Kendra](https://aws.amazon.com/kendra/)
- [Amazon Personalize](https://aws.amazon.com/personalize/)
- [Amazon Forecast](https://aws.amazon.com/forecast/)
- [Amazon Bedrock](https://aws.amazon.com/bedrock/)
- [Amazon Q](https://aws.amazon.com/q/)
- [Amazon SageMaker](https://aws.amazon.com/sagemaker/)
