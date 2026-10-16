<h1 align="center">PatientCare AI</h1>

<p align="center">
  A full-stack clinical management platform for managing <strong>patients</strong>, <strong>disease histories</strong>,
  <strong>clinical visits</strong>, <strong>prescriptions</strong>, <strong>medicine regimens</strong>, and automated <strong>WhatsApp follow-up reminders</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Latest-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18+-61DAFB.svg" alt="React">
  <img src="https://img.shields.io/badge/Vite-Latest-646CFF.svg" alt="Vite">
  <img src="https://img.shields.io/badge/PostgreSQL-Required-336791.svg" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/Alembic-Migrations-orange.svg" alt="Alembic">
  <img src="https://img.shields.io/badge/WhatsApp-Cloud_API-25D366.svg" alt="WhatsApp">
  <img src="https://img.shields.io/badge/uv-Package_Manager-purple.svg" alt="uv">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

---

## Overview

**PatientCare AI** is a production-oriented, full-stack healthcare application engineered for clinics, hospitals, and outpatient departments. It eliminates fragmented clinical workflows by unifying patient management, electronic prescriptions, chronic disease tracking, and patient engagement into a single cohesive platform.

The system features:
- **FastAPI Backend** — High-performance asynchronous REST API handling normalized relational persistence, JWT authentication with role-based access (Admin, Doctor, Staff), file storage, and background reminder queues.
- **React + Vite Frontend** — A modern, accessible clinical dashboard providing 1-click visit consultations, dynamic prescription writing with auto-suggestions, interactive follow-up schedulers, and analytics reports.
- **Automated WhatsApp Pipeline** — Background engine executing concurrency-safe scheduled reminders via Meta Cloud API or a local development simulator with strict patient consent enforcement (`whatsapp_opt_in`).

---

## Features

### 🏥 Patient & Disease Management
- Comprehensive patient registration with demographics, contact details, emergency contacts, and WhatsApp consent.
- Track active and historical chronic conditions (e.g., Hypertension, Type 2 Diabetes, Asthma).
- Real-time instant search across patient names, phone numbers, and IDs.
- Safe soft-deletion with administrative restoration capabilities.

### 🩺 1-Click Clinical Visits & Consultations
- Seamless encounter recording: select visit date, consultation type, and attending doctor.
- **Integrated Diagnosis**: Tag common diseases from the catalog or type custom diagnoses directly without navigating away.
- **Clinical Observations**: Record vitals, symptoms, physical findings, and requested lab investigations.
- Single-click action saves encounter, diagnoses, prescriptions, and follow-up reminders in a single atomic transaction.

### ✏️ Full Visit & Prescription Editing
- Dedicated **Edit Visit** workflow for adjusting notes, changing follow-up intervals, or updating medication regimens.
- Automatically synchronizes associated prescription medicine lines and reschedules pending reminders.

### 💊 Prescription & Medicine Regimens
- Direct manual medicine typing with datalist autocomplete suggestions from the medicine catalog.
- Automatically registers new medicines into the central catalog upon submission.
- Complete dosage configuration: dosage strength, frequency (e.g., *Twice daily*), duration in days, and special instructions (*After food*).
- Multi-item medicine lines with dynamic addition and removal.
- Prescription document viewer for attached clinical scans and reports.

### 📅 Follow-Up Scheduling & Date Calculator
- Automatic expected date calculation based on follow-up intervals (e.g., 20 days $\rightarrow$ exact calendar date).
- Interactive calendar date override for clinic holiday adjustments.
- Instant overview of overdue, due-today, and upcoming follow-up appointments.

### 📱 WhatsApp Reminder Engine
- Automated morning-of dispatch for scheduled patient follow-up visits.
- **Strict Consent Enforcement**: Checks `whatsapp_opt_in` before queuing or dispatching messages.
- Dual-mode provider architecture:
  - `meta`: Production integration with official Meta WhatsApp Cloud API.
  - `mock`: Local development simulator with console logging and delivery simulation.
- Concurrency-safe queue worker utilizing row-level database locking (`FOR UPDATE SKIP LOCKED`).
- Bounded retry policy with detailed error tracking and delivery receipt logging.
- Manual **Send Now** trigger for immediate patient notifications.

### 📊 Clinical Dashboard & Reports
- Key clinical metric cards: Total Patients, Active Diseases, Visits Conducted, Pending Follow-Ups.
- Reminder delivery rates and success statistics.
- Exportable patient reports and follow-up schedules.

### 🔐 Authentication & Role-Based Access Control (RBAC)
- Secure JWT authentication with BCrypt password hashing.
- Three built-in permission tiers:
  - **Admin**: Full system management, user administration, and system audit logs.
  - **Doctor**: Clinical consultations, visit recording, prescription management, and diagnoses.
  - **Staff**: Patient registration, scheduling, reminder processing, and check-in.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.12+ | Core runtime environment |
| FastAPI | High-performance asynchronous REST API framework |
| SQLAlchemy 2.0 | Relational ORM with type annotations |
| PostgreSQL | Primary ACID-compliant relational database |
| Alembic | Database schema migration management |
| Pydantic v2 | Schema validation & typed settings management |
| PyJWT / Passlib | JWT token handling & BCrypt password hashing |
| WhatsApp Cloud API | Automated follow-up messaging provider |
| Uvicorn | ASGI production server |
| uv | Fast Python package and environment manager |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework & type safety |
| Vite | Frontend build tool & development server |
| Lucide React | Modern healthcare and UI iconography |
| Vanilla CSS Tokens | Lightweight, accessible, glassmorphic design system |

---

## Project Structure

```text
patientcare-ai/
├── app/
│   ├── api/
│   │   ├── auth.py              # Login, token issuance & doctor listing
│   │   ├── dashboard.py         # Summary metrics, follow-up feeds & reports
│   │   ├── deps.py              # Auth guards & database session dependency
│   │   ├── diseases.py          # Disease catalog management
│   │   ├── health.py            # API health check endpoint
│   │   ├── medicines.py         # Medicine catalog CRUD
│   │   ├── patients.py          # Patient registration, search, soft delete & restore
│   │   ├── prescriptions.py     # Prescription creation & document serving
│   │   ├── reminders.py         # Scheduled reminder queries & manual trigger
│   │   └── visits.py            # Visit creation, update & history endpoints
│   ├── core/
│   │   ├── config.py            # Typed AppSettings & environment configuration
│   │   └── security.py          # JWT generation, validation & password hashing
│   ├── db/
│   │   ├── models/              # SQLAlchemy normalized ORM models
│   │   │   ├── audit_log.py     # Administrative audit logging model
│   │   │   ├── disease.py       # Disease classification catalog
│   │   │   ├── medicine.py      # Medicine catalog model
│   │   │   ├── patient.py       # Patient demographic model
│   │   │   ├── patient_disease.py # Patient-disease join model
│   │   │   ├── prescription.py  # Clinical prescription model
│   │   │   ├── prescription_medicine.py # Itemized medicine dosage model
│   │   │   ├── reminder.py      # Visit reminder delivery queue model
│   │   │   ├── user.py          # Staff & doctor user model
│   │   │   └── visit.py         # Clinical encounter visit model
│   │   └── session.py           # Database engine & sessionmaker config
│   ├── schemas/                 # Pydantic request & response schemas
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── disease.py
│   │   ├── medicine.py
│   │   ├── patient.py
│   │   ├── prescription.py
│   │   ├── reminder.py
│   │   ├── user.py
│   │   └── visit.py
│   ├── services/
│   │   ├── audit_service.py     # System audit trail logger
│   │   ├── patient_service.py   # Patient business logic & disease history
│   │   ├── prescription_service.py # Prescription & medicine writing logic
│   │   ├── reminder_service.py  # Concurrency-safe reminder worker logic
│   │   ├── storage_service.py   # Sanitized file upload & path-traversal guard
│   │   ├── visit_service.py     # 1-click visit creation & update engine
│   │   └── whatsapp/            # WhatsApp provider abstraction (Meta / Mock)
│   ├── workers/
│   │   └── reminder_worker.py   # Background reminder polling worker
│   └── main.py                  # FastAPI entry point & lifespan startup logic
│
├── frontend/                    # React + TypeScript + Vite Single Page App
│   ├── src/
│   │   ├── components/
│   │   │   ├── CatalogsView.tsx     # Disease & Medicine catalog explorer
│   │   │   ├── DashboardView.tsx    # Clinic metrics & quick action center
│   │   │   ├── FollowUpsView.tsx    # Due follow-up tracking & filters
│   │   │   ├── Navbar.tsx           # Global navigation & user status bar
│   │   │   ├── PatientDetailView.tsx # Patient dossier, 1-click visit & edit modals
│   │   │   ├── PatientsView.tsx     # Patient directory, search & registration
│   │   │   ├── RemindersView.tsx    # WhatsApp delivery queue monitor
│   │   │   ├── ReportsView.tsx      # Clinical analytics & data export
│   │   │   ├── StatusBadge.tsx      # Color-coded status chip component
│   │   │   └── VisitsView.tsx       # Clinic-wide visit log
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Authentication state & session store
│   │   ├── api.ts                   # Typed API service client
│   │   ├── App.tsx                  # Root routing & layout controller
│   │   ├── index.css                # Healthcare design system & CSS variables
│   │   ├── main.tsx                 # DOM mounting entry
│   │   └── types.ts                 # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── storage/                     # Isolated prescription uploads directory
├── alembic/                     # Database migration revisions
├── alembic.ini                  # Alembic migration configuration
├── pyproject.toml               # Python project dependencies & metadata
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 18+ and npm**
- **PostgreSQL 14+** (running locally or remotely)
- **uv** (recommended Python package manager)

Install **uv**:
```bash
pip install uv
```

---

## Backend Setup

### 1. Clone & Navigate to Project

```bash
git clone <repository-url>
cd patientcare-ai
```

### 2. Create & Activate Virtual Environment

```bash
uv venv
```

**Windows:**
```powershell
.venv\Scripts\activate
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
uv sync
# Or with standard pip:
# pip install -e .
```

### 4. Configure Environment Variables

Create a `.env` file in the project root directory:

```env
# Application
APP_NAME="PatientCare AI"
APP_ENV=development
DEBUG=true
API_V1_PREFIX=/api/v1
LOG_LEVEL=INFO

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/patientcare_db

# Authentication (JWT)
JWT_SECRET_KEY=generate_a_secure_random_key_at_least_32_characters_long
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480

# WhatsApp Provider ('mock' for local dev, 'meta' for Meta Cloud API)
WHATSAPP_PROVIDER=mock
WHATSAPP_API_URL=https://graph.facebook.com/v20.0
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_token
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id

# Storage
UPLOAD_DIR=storage/prescriptions
MAX_UPLOAD_SIZE_MB=10

# Reminder Engine
REMINDER_RETRY_LIMIT=3
REMINDER_POLL_INTERVAL_SECONDS=30
```

### 5. Run Database Migrations

Apply Alembic migrations to generate normalized relational tables, foreign keys, and indexes:

```bash
alembic upgrade head
```

### 6. Start the Backend Server

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

### Default Clinical Accounts

On initial startup, the database is pre-seeded with default clinical users:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin` | `Admin@123` | Full clinical and administrative control |
| **Doctor** | `dr.sharma` | `Doctor@123` | Clinical visits, diagnoses, prescriptions |
| **Nurse / Staff** | `nurse.priya` | `Staff@123` | Patient registration, reminders, check-in |

---

## Frontend Setup

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

### 2. Start Vite Development Server

```bash
npm run dev
```

The frontend dashboard will be available at: **`http://localhost:5173`**

---

## Architecture

```text
┌────────────────────────────────────────────────────────┐
│             React 18 + TypeScript UI                   │
│   (Dashboard, Patients, 1-Click Visits, Reminders)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON REST
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Application                   │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   OAuth2 / JWT Guard │    │  Service Layer       │  │
│  └──────────────────────┘    └──────────┬───────────┘  │
│  ┌──────────────────────────────────────┴───────────┐  │
│  │ Visits │ Patients │ Prescriptions │ Reminders    │  │
│  └──────┬─────────────┬──────────────┬──────────────┘  │
└─────────┼─────────────┼──────────────┼─────────────────┘
          │             │              │
┌─────────▼────────┐ ┌──▼───────────┐ ┌▼─────────────────┐
│   PostgreSQL     │ │File Storage  │ │WhatsApp Provider │
│(Normalized Tables│ │(Sanitized    │ │ (Meta Cloud API /│
│ & Foreign Keys)  │ │ UUID Scans)  │ │   Mock Engine)   │
└─────────▲────────┘ └──────────────┘ └──────────────────┘
          │
┌─────────┴────────────────────────┐
│  Background Reminder Worker      │
│  (FOR UPDATE SKIP LOCKED Queue)  │
└──────────────────────────────────┘
```

- **API Layer**: Route handlers with strict Pydantic v2 validation and role guards.
- **Service Layer**: Business transactions coordinating patient records, prescriptions, and follow-ups.
- **ORM Layer**: Normalized SQLAlchemy 2.0 mapping with explicit foreign key cascading and constraints.
- **Background Worker**: Concurrency-safe queue processor with retry bounds and patient consent verification.

---

## Database Architecture (ERD)

```mermaid
erDiagram
    USERS ||--o{ VISITS : attends_as_doctor
    
    PATIENTS ||--o{ PATIENT_DISEASES : has
    DISEASES ||--o{ PATIENT_DISEASES : classifies

    PATIENTS ||--o{ VISITS : attends

    VISITS ||--o{ PRESCRIPTIONS : contains
    PRESCRIPTIONS ||--o{ PRESCRIPTION_MEDICINES : prescribes
    MEDICINES ||--o{ PRESCRIPTION_MEDICINES : specified_in

    PATIENTS ||--o{ VISIT_REMINDERS : receives
    VISITS ||--o{ VISIT_REMINDERS : triggers

    USERS ||--o{ AUDIT_LOGS : records_action

    PATIENTS {
        int patient_id PK
        string patient_name
        string whatsapp_no "Indexed"
        string email "Indexed"
        date date_of_birth
        string gender
        text address
        string emergency_contact
        boolean whatsapp_opt_in
        boolean is_deleted "Indexed"
        datetime created_at
        datetime updated_at
    }

    DISEASES {
        int disease_id PK
        string disease_name UK
        text description
        datetime created_at
        datetime updated_at
    }

    PATIENT_DISEASES {
        int patient_disease_id PK
        int patient_id FK
        int disease_id FK
        date diagnosed_at
        boolean is_active
        text notes
        datetime created_at
        datetime updated_at
    }

    VISITS {
        int visit_id PK
        int patient_id FK
        int doctor_id FK
        date visit_date "Indexed"
        date next_visit_date "Indexed"
        int follow_up_after_days
        string visit_type
        string visit_status "Indexed"
        text doctor_notes
        datetime created_at
        datetime updated_at
    }

    MEDICINES {
        int medicine_id PK
        string medicine_name UK
        string generic_name "Indexed"
        text description
        datetime created_at
        datetime updated_at
    }

    PRESCRIPTIONS {
        int prescription_id PK
        int visit_id FK
        string prescription_type
        string prescription_file
        text notes
        datetime created_at
        datetime updated_at
    }

    PRESCRIPTION_MEDICINES {
        int prescription_medicine_id PK
        int prescription_id FK
        int medicine_id FK
        string dosage
        string frequency
        int duration_days
        text instructions
        datetime created_at
        datetime updated_at
    }

    VISIT_REMINDERS {
        int reminder_id PK
        int patient_id FK
        int visit_id FK
        datetime scheduled_at "Indexed"
        text message
        string status "Indexed"
        datetime sent_at
        string delivery_status
        string reminder_type
        int attempt_count
        text failure_reason
        datetime created_at
        datetime updated_at
    }

    USERS {
        int user_id PK
        string username UK
        string email UK
        string full_name
        string hashed_password
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOGS {
        int log_id PK
        string actor
        string action "Indexed"
        string entity_type "Indexed"
        string entity_id "Indexed"
        datetime timestamp "Indexed"
        text details
    }
```

---

## Clinical Workflow

```text
Patient Registration
       │
       ▼
Open "+ Record Clinical Visit"
       │
       ├─► Tag Known / Custom Diagnoses
       ├─► Record Doctor Observations & Findings
       ├─► Write Multi-Medicine Prescription (Autocomplete)
       ├─► Specify Follow-Up Interval (e.g., 20 days)
       │    └─► System calculates Next Visit Date
       └─► Check "Auto-schedule WhatsApp reminder"
       │
       ▼ [1-Click Save]
Database Transaction:
  1. Creates Visit record
  2. Links Diagnosed Diseases to Patient
  3. Registers any new Medicines to Catalog
  4. Creates Prescription with itemized lines
  5. Schedules Visit Reminder for morning of due date
       │
       ▼
Background Worker:
  1. Polls for due reminders (FOR UPDATE SKIP LOCKED)
  2. Verifies patient's WhatsApp consent (whatsapp_opt_in)
  3. Dispatches message via Meta Cloud API or Mock simulator
  4. Logs delivery confirmation & receipt ID in patient timeline
```

---

## Security & Privacy Compliance

- **WhatsApp Consent Safeguard**: Automated messages are strictly conditioned on `whatsapp_opt_in = True`. Opt-out requests automatically cancel scheduled reminders.
- **Sanitized Document Storage**: Client-submitted file names are discarded; uploaded files are assigned randomized UUIDs to eliminate path-traversal vulnerabilities.
- **Role-Based Guards**: Endpoint access is enforced via OAuth2 bearer token dependencies checking against `admin`, `doctor`, and `staff` permissions.
- **Non-Sensitive Audit Trail**: Critical administrative and clinical events are logged with actor details, timestamps, and entity IDs without exposing sensitive patient health info.

---

## License

This project is licensed under the MIT License.
