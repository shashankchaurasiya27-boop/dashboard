
generate a complete frontend application (Next.js + Tailwind + API integration)
---

# 🚀 Ultimate Frontend Generation Prompt

*(Paste this into your AI code generator)*

---

Build a **production-ready Next.js 14 dashboard application** for **Intelli-Credit AI**, an enterprise fintech platform that performs automated corporate credit appraisal.

The frontend must connect to an existing FastAPI backend that provides the following endpoints:

```id="api_endpoints"
POST /upload
GET /history
GET /evaluation/{id}
```

The platform is used by **credit risk analysts** to upload company financial documents, verify extracted data, and review AI-generated credit decisions and CAM reports.

The application must be written in:

```id="tech_stack"
Next.js 14 (App Router)
TypeScript
TailwindCSS
ShadCN UI
Recharts for charts
Axios for API requests
```

Organize the code using **clean component architecture** and **reusable UI components**.

---

# 🎨 Design System

Theme must support **Dark Mode by default** with a toggle to Light Mode.

Dark theme:

```
Background: #0F172A
Card Surface: #1E293B
Primary Accent: #6366F1
Text: #E2E8F0
```

Status colors:

```
Approved: #10B981
Pending: #F59E0B
Rejected: #EF4444
```

Typography:

```
Font: Inter
```

UI style:

* glassmorphism cards
* soft shadows
* rounded corners (8px)
* hover transitions
* subtle button glow
* loading skeletons

---

# 🧱 Application Layout

Create a **persistent layout shell** with:

### Sidebar Navigation

Left fixed sidebar.

Top:

```
Intelli-Credit AI
```

Navigation links:

```
Dashboard
New Appraisal
Pending Drafts
Evaluation History
Reports
Settings
```

Bottom section:

User profile card showing:

```
Avatar
Name
Role: Credit Risk Analyst
```

---

### Top Navigation Bar

Contains:

```
Breadcrumb navigation
Global search
Notification bell
Dark / Light mode toggle
User avatar dropdown
```

---

# 📊 Page 1 — Dashboard

Route:

```
/dashboard
```

Purpose: overview of credit activity.

Top section contains **4 KPI cards**:

```
Total Evaluations
Pending Drafts
Average Risk Score
Approval Rate
```

Each card includes:

```
large number
small trend indicator
mini sparkline chart
```

---

### Main Chart

Display:

```
Credit Evaluations by Industry
```

Use **Recharts line chart**.

Industries:

```
Manufacturing
Technology
Retail
Real Estate
Hospitality
Pharma
```

---

### Recent Evaluations Table

Fetch data from:

```
GET /history
```

Columns:

```
Company
Date
Risk Score
Decision
Action
```

Action button:

```
View Report
```

When clicked:

```
navigate to /evaluation/{id}
```

---

# 📄 Page 2 — New Appraisal

Route:

```
/new-appraisal
```

Header:

```
Initiate New Credit Evaluation
```

Main component:

Drag-and-drop upload zone.

Text:

```
Drag & drop financial PDFs
or click to browse
```

After file upload call:

```
POST /upload
```

Show:

```
upload progress
loading animation
processing status
```

When evaluation completes:

```
redirect to evaluation page
```

---

# 🧾 Page 3 — Pending Drafts

Route:

```
/drafts
```

Display a table of documents waiting for manual review.

Columns:

```
Draft ID
Company
Industry
Created Date
AI Confidence
Status
Action
```

Action button:

```
Review Draft
```

---

# 🧠 Draft Review Interface

Split screen layout.

Left side:

```
PDF viewer component
```

Right side:

Form with extracted financial data.

Fields:

```
Revenue
Net Profit
Total Debt
```

Each field shows:

```
AI extracted value
confidence score
editable input
```

Buttons:

```
Save Draft
Finalize Evaluation
```

---

# 📈 Page 4 — Evaluation Result

Route:

```
/evaluation/[id]
```

Fetch evaluation from:

```
GET /evaluation/{id}
```

Display:

### Header

```
Company Name
Evaluation Date
```

Large decision badge:

```
APPROVED / REJECTED
```

---

### Risk Score Gauge

Circular gauge showing:

```
Final Risk Score
```

---

### Risk Breakdown Cards

Show:

```
Base Risk Score
News Risk Adjustment
Final Score
```

---

### Financial Metrics Card

Display:

```
Revenue
Net Profit
Total Debt
Profit Margin
Debt to Revenue
```

---

### AI Explanation Section

Title:

```
AI Decision Rationale
```

Display the explanation text returned from backend.

---

### CAM Download

Button:

```
Download CAM PDF
```

Use the `pdf_path` returned from backend.

---

# 📜 Page 5 — Evaluation History

Route:

```
/history
```

Fetch:

```
GET /history
```

Display full table.

Columns:

```
Evaluation ID
Company
Risk Score
Decision
Date
Actions
```

Actions:

```
View Report
Download CAM
```

Include:

```
sorting
search
filter by decision
```

---

# 📦 Required Reusable Components

Create reusable UI components:

```
Button
Card
Badge
DataTable
Modal
ChartCard
MetricCard
FileUpload
PDFViewer
ScoreGauge
```

---

# ⚡ API Integration

Create service layer:

```
lib/api.ts
```

Implement functions:

```
uploadDocuments()
getHistory()
getEvaluation()
```

Use Axios for requests.

---

# 📁 Project Folder Structure

Generate project structure:

```
/app
  /dashboard
  /new-appraisal
  /drafts
  /evaluation/[id]
  /history

/components
  ui/
  charts/
  tables/

/lib
  api.ts

/hooks
  useEvaluations.ts
```

---

# 🎯 Expected Result

Generate a **fully working Next.js dashboard application** with:

* responsive layout
* reusable components
* API integration
* enterprise fintech design
* clean folder architecture

The UI should feel like a **premium SaaS platform used by banks and financial institutions**.



