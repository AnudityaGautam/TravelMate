# TravelMate ✈️ - Smart Travel Planner & Group Expense Splitter

> A modern, responsive, and privacy-first travel planning platform built with pure **HTML5, CSS3, and Vanilla JavaScript**. Designed for solo backpackers, group travelers, and adventure planning with zero dependencies.

---

## 🌟 Key Features

1. **🗺️ Destination Explorer & Live Budgeting:**
   - Curated travel destinations across India with daily budget estimates, weather badges, and top attraction tags.
   - Live search bar and instant category filters (Beaches, Hill Stations, Heritage, Metros).
   - Direct "Plan Trip" button linking destination itineraries straight into the expense planner.

2. **💸 Intelligent Group Expense Splitter & Settlement Math:**
   - Multi-payer expense logging with categorized breakdowns (Stay, Food, Travel, Activities, Shopping).
   - Real-time calculations of total trip cost, member spending, and fair per-person shares.
   - **Greedy Debt Minimization Algorithm**: Computes the exact "Who Owes Whom" direct settlement transfers in the minimal number of transactions.

3. **🎯 Target Budget Health Meter:**
   - Set customizable planned trip budgets.
   - Color-coded progress indicators:
     - 🟢 **Safe (≤ 80%):** Spending within budget with remaining funds highlighted.
     - 🟡 **Warning (80–100%):** Approaching budget limit.
     - 🔴 **Over Budget (> 100%):** Highlights overspend amount immediately.

4. **📊 Category Spending Analytics:**
   - Pure CSS/SVG stacked distribution charts and category summary cards.
   - 100% offline and dependency-free.

5. **🔐 Two-Factor OTP Authentication & Profile Management:**
   - User account registration and secure login protected by 6-digit OTP verification.
   - Flexible delivery channels: **Gmail (Email)** and **WhatsApp Click-to-Chat**.
   - Interactive verification UI with auto-advance digit boxes, 60-second resend timer, and 1-click test fill helper.
   - Floating interactive notification toast with audio chime simulating incoming Gmail and WhatsApp codes.
   - Dynamic user profile avatars and role chips in the navigation bar.
   - Password recovery and reset flow.

6. **🌓 Zero-Flicker Dark & Light Mode System:**
   - Full dark/light mode system with pre-render head bootstrap script preventing theme flash.
   - High-contrast accessible styling for all cards, form inputs on focus, active trip banners, and debt settlement tables.

6. **📥 Instant Export to Excel (CSV) & Printable PDF Invoice:**
   - 1-Click CSV export downloads clean spreadsheet data that opens in Microsoft Excel or Google Sheets.
   - Formatted printable invoice using clean `@media print` CSS.

7. **🎒 Itinerary Planner & Packing Checklist:**
   - Interactive day-by-day activity scheduler with cost tracking.
   - Per-trip checkable travel essentials checklist.

8. **🚨 24x7 Emergency SOS Tourist Helplines:**
   - One-tap access to national emergency, police, tourist helpline, and roadside assistance numbers.

---

## 📁 Project Structure

```text
TravelMate/
│
├── index.html                    # Homepage & Platform Showcase
├── destinations.html             # Destination Explorer with Live Search & Filters
├── budget.html                   # Multi-Trip Expense Tracker & Settlement Engine
├── about.html                    # About Platform, Creators & Contact Form
├── login.html                    # User Sign In, Registration & Password Reset
│
├── css/
│   └── style.css                 # Complete Design System & Dark/Light Themes
│
├── js/
│   ├── script.js                 # Core Application Engine & Settlement Math
│   └── qrcode.min.js             # Client-Side QR Code Generator
│
├── images/                       # Project Graphics & Assets
├── launch.bat                    # 1-Click Windows Launcher
├── serve.ps1                     # Lightweight Local Web Server
├── PROJECT_REPORT.md             # Formal Technical Architecture Report
└── README.md                     # Project Documentation
```

---

## 🚀 How to Run Locally

### Option 1: Double-Click Launcher (Windows)
Double-click **`launch.bat`** in the project root directory. It will start the local server and open the web app in your default browser.

### Option 2: PowerShell Web Server
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Then visit: `http://localhost:8000/index.html`

### Option 3: Direct Browser Launch
Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).

---

## 👥 Contributors & Team

- **Avisneh Kushwaha** — Full-Stack Architecture & Logic
- **Anuditya Gautam** — UI/UX Design & Settlement Math
- **Dipali Sinha** — QA, Usability & Documentation

---

© 2026 TravelMate. Built for seamless travel planning and group expense management.
