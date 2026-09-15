# SAMIA MIKOPO TANZANIA

A responsive web-based loan application and administration portal for **SAMIA MIKOPO TANZANIA**.

The system allows applicants to submit loan applications online while authorized administrators can securely review applications, applicant information, loan details, and uploaded documents through an administrative dashboard.

---

## Features

### Applicant Portal

- Responsive landing page
- Online loan application form
- Personal information collection
- Contact information collection
- Identification information
- Loan amount selection
- Interest information
- Payment/receiving information
- Borrower photo upload
- Identification document upload
- Client-side form validation
- Application submission
- Application confirmation
- WhatsApp communication support
- Mobile-friendly interface

### Admin Portal

- Secure administrator login
- Supabase Authentication
- Role-based administrator authorization
- Dashboard overview
- Total applications KPI
- Today's applications KPI
- Total requested loan amount KPI
- Application search
- Search by applicant name
- Search by phone number
- Search by region
- Compact applications table
- Applicant details page
- Applicant document viewing
- Direct phone-call action
- WhatsApp action
- Logout functionality
- Responsive mobile navigation

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Responsive Web Design
- SVG Icons

### Backend / Database

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Row Level Security (RLS)

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Local HTTP Server

---

## Project Structure

```text
samia-mikopo-tanzania/
│
├── index.html
├── form.html
├── README.md
├── .gitignore
│
├── assets/
│   ├── css/
│   │   └── style.css
│   │
│   ├── img/
│   │   ├── airtel.png
│   │   ├── halopesa.jpeg
│   │   ├── logo.webp
│   │   ├── vodacom.png
│   │   └── yas.jpg
│   │
│   └── js/
│       ├── app.js
│       └── supabase.js
│
├── images/
│   ├── doc1.jpg
│   ├── doc2.jpg
│   ├── doc3.jpg
│   ├── doc4.jpg
│   └── hero.jpg
│
└── admin/
    │
    ├── login.html
    ├── dashboard.html
    ├── details.html
    │
    ├── css/
    │   ├── login.css
    │   ├── dashboard.css
    │   └── details.css
    │
    └── js/
        ├── admin-auth.js
        ├── dashboard.js
        └── details.js