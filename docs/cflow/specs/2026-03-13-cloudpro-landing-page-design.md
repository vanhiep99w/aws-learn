# CloudPro Consulting — Landing Page Design Spec

## Overview

Single-page landing page for **CloudPro Consulting**, an AWS consulting service targeting startups and SMBs in Vietnam. The page promotes cloud architecture design, migration, and cost optimization services.

## Goals

- Generate leads via contact form and chat channels (Zalo, Messenger)
- Communicate expertise and build trust with startup/SMB decision-makers
- Drive conversions with clear value proposition and social proof

## Constraints

- **Language**: Vietnamese
- **Tech stack**: HTML/CSS/JS thuần (no framework)
- **Deployment target**: Static hosting (S3 + CloudFront or similar)
- **Responsive**: Mobile-first, works on desktop and mobile

## Visual Style

- **Theme**: Light & Modern
- **Background**: White (#FFFFFF) / Light gray (#F8FAFC)
- **Primary color**: Blue (#2563EB)
- **Accent/CTA color**: Orange (#F97316)
- **Success color**: Green (#10B981)
- **Text**: Dark navy (#0F172A) for headings, slate (#64748B) for body
- **Typography**: System font stack (Inter or similar sans-serif)
- **Border radius**: 8-12px for cards, 6px for buttons/inputs
- **Shadows**: Subtle box-shadows for cards on hover

## Page Structure

### Navbar (sticky)

- Logo: "CloudPro Consulting" with cloud icon
- Navigation links: Dich vu, Quy trinh, Vi sao chon, Khach hang
- CTA button: "Lien he" (blue, scrolls to contact form)
- Mobile: hamburger menu

### 1. Hero Section

- Background: Subtle gradient (light blue to white)
- Headline: "Toi uu ha tang AWS — Tiet kiem chi phi, tang toc phat trien"
- Subheadline: Brief description of consulting services for startups
- Two CTA buttons:
  - Primary (orange): "Dat lich tu van mien phi" → scrolls to contact form
  - Secondary (outlined blue): "Xem dich vu" → scrolls to services section
- Optional: Abstract cloud/architecture illustration or pattern

### 2. Pain Points — "Ban dang gap van de nay?"

- 3 cards in a row (stack on mobile):
  - Chi phi AWS tang khong kiem soat (icon: money)
  - Kien truc phuc tap, kho scale (icon: wrench/gear)
  - Lo ngai bao mat & compliance (icon: lock/shield)
- Each card: icon + short title + 1-2 sentence description
- Purpose: Empathy-driven, show understanding of customer problems

### 3. Services — "Dich vu chinh"

- 3 service cards with colored top border:
  - **Cloud Architecture** (blue border): Thiet ke kien truc AWS toi uu cho startup
  - **Migration** (orange border): Di chuyen tu on-premise len cloud an toan
  - **Cost Optimization** (green border): Giam toi 40% chi phi AWS
- Each card: icon + title + description + bullet points of specifics
- Cards have hover effect (subtle shadow elevation)

### 4. Process — "Quy trinh lam viec"

- 4-step horizontal timeline (vertical on mobile):
  1. Danh gia (Assessment) — Review current infrastructure
  2. De xuat (Proposal) — Architecture & cost recommendations
  3. Trien khai (Implementation) — Hands-on migration/optimization
  4. Ho tro (Support) — Ongoing monitoring & support
- Visual: numbered circles connected by lines/arrows
- Brief description under each step

### 5. Why CloudPro — "Vi sao chon CloudPro?"

- Key metrics row:
  - 50+ du an hoan thanh
  - 40% tiet kiem chi phi trung binh
  - 99.9% uptime cam ket
- Below metrics: 3-4 trust signals (AWS certifications, years of experience, customer satisfaction)
- Optional: AWS Partner badge if applicable

### 6. Testimonials — "Khach hang noi gi?"

- 2-3 testimonial cards in carousel or grid
- Each card: quote text + customer name + role + company
- Clean design with quotation marks and subtle card styling

### 7. Contact Form — "Dat lich tu van mien phi"

- Background: Light blue (#EFF6FF) to stand out
- Form fields:
  - Ho va ten (text)
  - Email (email)
  - So dien thoai (tel, optional)
  - Mo ta nhu cau (textarea)
- Submit button (orange): "Gui yeu cau tu van"
- Form submits via mailto or simple backend (Formspree/Netlify Forms for MVP)
- Side note: Response time commitment ("Chung toi se lien he trong 24h")

### 8. Footer

- Dark background (#0F172A)
- Left: Copyright + company name
- Center: Quick links (Dich vu, Quy trinh, Lien he)
- Right: Social/chat buttons (Zalo, Messenger)
- Bottom: Email + phone number

### Floating Chat Buttons

- Fixed position bottom-right
- Zalo button (blue) + Messenger button (blue)
- Always visible as user scrolls
- Small, non-intrusive with hover tooltip

## File Structure

```
landing-page/
  index.html        # Main HTML file
  css/
    style.css       # All styles
  js/
    main.js         # Smooth scroll, mobile menu, form handling
  assets/
    images/         # Icons, illustrations if any
```

## Responsive Breakpoints

- **Mobile**: < 768px — Single column, stacked cards, hamburger menu
- **Tablet**: 768px - 1024px — 2-column grids where applicable
- **Desktop**: > 1024px — Full layout as wireframed

## Interactions

- Smooth scroll navigation to sections
- Sticky navbar with background change on scroll
- Card hover effects (elevation shadow)
- Mobile hamburger menu toggle
- Form validation (required fields, email format)
- Floating chat buttons with pulse animation on first visit

## Performance

- No framework dependencies — vanilla HTML/CSS/JS
- System font stack (no web font loading)
- Minimal images — use CSS for decorative elements
- Target: < 100KB total page weight
- Lighthouse score target: 90+ across all categories

## Out of Scope

- Backend/API for form submission (use Formspree or similar service)
- CMS or content management
- Multi-language support
- Blog or content pages
- User authentication
- Analytics (can be added later with GA4 snippet)
