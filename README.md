# PatientCare AI — Patient Management, Prescription & Follow-Up System

A production-oriented clinical management application engineered for healthcare clinics and outpatient departments to manage patients, chronic disease histories, clinical visits, prescriptions, medicines, follow-up schedules, and automated WhatsApp reminders.

---

## 1. Architecture Overview

PatientCare AI follows a clean, modular, and decoupled architecture:

- **Backend**: FastAPI with Python 3.12, Pydantic v2 schemas, and SQLAlchemy 2.0 ORM.
- **Database**: Strictly normalized PostgreSQL with schema migrations managed by Alembic.
- **Messaging Pipeline**: WhatsApp Business API provider abstraction (`WhatsAppProvider`) supporting both Meta Cloud API and a development mock engine with consent enforcement (`whatsapp_opt_in`).
- **Background Worker**: Safe concurrency-guarded worker with row-level locking (`FOR UPDATE SKIP LOCKED`) and bounded retry handling.
- **Document Management**: Isolated filesystem storage with sanitized UUID filenames and path-traversal protection.
- **Frontend**: Single Page Application built with React 18, TypeScript, and Vite featuring a modern, accessible healthcare dashboard.

```
                              ┌──────────────────────────────────┐
                              │      React + TypeScript UI       │
                              │   (Dashboard, Patients, Visits)  │
                              └────────────────┬─────────────────┘
                                               │ JSON / REST
                                               ▼
                              ┌──────────────────────────────────┐
                              │       FastAPI Application        │
                              │   (OAuth2, Routers, Services)    │
                              └───────┬──────────────────┬───────┘
                                      │                  │
                ┌─────────────────────┼────────────┐     │
                │                     ▼            │     ▼
    ┌───────────┴──────────┐   ┌──────────────┐    │ ┌──────────────────┐
    │  Storage Service     │   │ PostgreSQL   │    │ │ WhatsApp Provider│
    │(Sanitized UUID PDF/  │   │  Normalized  │    │ │  (Meta Cloud /   │
    │      Images)         │   │   Database   │    │ │     Mock Dev)    │
    └──────────────────────┘   └───────┬──────┘    │ └──────────────────┘
                                       ▲           │
                                       │           ▼
                              ┌────────┴─────────────────────────┐
                              │     Reminder Worker Engine       │
                              │(Consent Check, Bounded Retries)  │
                              └──────────────────────────────────┘
```

---

## 2. Normalized Database Entity-Relationship (ER) Diagram

The system adheres strictly to a normalized relational schema. Patient records do not store denormalized visit dates or disease names directly; these are determined dynamically via relational queries.

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
        int patient_id FK "CASCADE"
        int disease_id FK "RESTRICT"
        date diagnosed_at
        boolean is_active
        text notes
        datetime created_at
        datetime updated_at
    }

    VISITS {
        int visit_id PK
        int patient_id FK "RESTRICT"
        int doctor_id FK "SET NULL"
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
        int visit_id FK "RESTRICT"
        string prescription_type
        string prescription_file
        text notes
        datetime created_at
        datetime updated_at
    }

    PRESCRIPTION_MEDICINES {
        int prescription_medicine_id PK
        int prescription_id FK "CASCADE"
        int medicine_id FK "RESTRICT"
        string dosage
        string frequency
        int duration_days
        text instructions
        datetime created_at
        datetime updated_at
    }

    VISIT_REMINDERS {
        int reminder_id PK
        int patient_id FK "RESTRICT"
        int visit_id FK "RESTRICT"
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

## 3. Technology Stack

### Backend
- **Python**: 3.12+
- **Framework**: FastAPI (async REST endpoints)
- **Validation**: Pydantic v2 (`pydantic-settings`)
- **Database Driver & ORM**: PostgreSQL via `psycopg` (v3 binary) and SQLAlchemy 2.0
- **Migrations**: Alembic
- **Authentication**: OAuth2 Password Flow + JWT (`python-jose`) + BCrypt (`passlib`)
- **Server**: Uvicorn

### Frontend
- **Framework**: React 18 with TypeScript
- **Tooling**: Vite
- **Icons**: Lucide React
- **Design System**: Vanilla CSS healthcare palette (glassmorphism cards, responsive tables, modal overlays)

---

## 4. Environment Configuration

All configuration is managed through typed settings in `app/core/config.py`. Configure the following environment variables:

| Variable | Default Value | Description |
|---|---|---|
| `APP_ENV` | `development` | Environment mode (`development`, `production`) |
| `DATABASE_URL` | `postgresql+psycopg://user:pass@localhost:5432/patientcare` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | *(Dev key)* | Secret key for signing authentication tokens (min 32 bytes) |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Access token lifespan (in minutes) |
| `WHATSAPP_PROVIDER` | `mock` | Active provider: `mock` (simulated dev) or `meta` (Meta Business Cloud API) |
| `WHATSAPP_API_URL` | `https://graph.facebook.com/v20.0` | Meta Graph API endpoint URL |
| `WHATSAPP_ACCESS_TOKEN` | `None` | Meta Cloud API System User Bearer Token |
| `WHATSAPP_PHONE_NUMBER_ID` | `None` | WhatsApp Sender Phone Number ID |
| `UPLOAD_DIR` | `storage/prescriptions` | Local directory for prescription documents |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum prescription file size in megabytes |
| `REMINDER_RETRY_LIMIT` | `3` | Maximum retry attempts for failed WhatsApp messages |
| `REMINDER_POLL_INTERVAL_SECONDS`| `30` | Interval for background reminder evaluation |
| `LOG_LEVEL` | `INFO` | Application logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

---

## 5. PostgreSQL & Alembic Database Setup

1. **Create the Database in PostgreSQL**:
   ```sql
   CREATE DATABASE patientcare;
   ```

2. **Run Alembic Migrations**:
   Apply all migration revisions to generate tables, foreign keys, and indexes:
   ```bash
   alembic upgrade head
   ```

3. **Schema Rollback (if required)**:
   ```bash
   alembic downgrade base
   ```

---

## 6. Starting the Backend Server

1. **Install Dependencies**:
   ```bash
   uv sync
   # or: pip install -e .
   ```

2. **Launch FastAPI with Uvicorn**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

3. **Default Seed Accounts**:
   Upon first startup, the database is automatically seeded with default clinical accounts:
   - **Administrator**: Username: `admin` | Password: `Admin@123` (Role: `admin`)
   - **Doctor**: Username: `dr.sharma` | Password: `Doctor@123` (Role: `doctor`)
   - **Staff**: Username: `nurse.priya` | Password: `Staff@123` (Role: `staff`)

4. **Interactive API Documentation**:
   - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 7. Starting the Frontend Application

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm.cmd install
   ```

3. **Start the Vite development server**:
   ```bash
   npm.cmd run dev
   ```

4. **Access the application**:
   Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 8. Clinical Workflows

### Primary Patient Workflow
```text
Register Patient
      ↓
Attach Chronic Disease History
      ↓
Conduct Clinical Visit
      ↓
Record Diagnosis & Doctor Notes
      ↓
Input Follow-Up Interval (e.g., 20 days)
      ↓
System calculates next_visit_date (Overrideable)
      ↓
Prescribe Multi-Medicine Regimen
      ↓
Upload Scanned Prescription Document (Safe UUID)
      ↓
System schedules Visit Reminder (09:00 AM on due date)
      ↓
Background Worker checks WhatsApp Consent
      ↓
WhatsApp Provider dispatches message
      ↓
Delivery confirmation recorded in Patient Profile
```

### Reminder Background Worker Workflow
1. The background worker polls the database on a configurable interval (`REMINDER_POLL_INTERVAL_SECONDS`).
2. Queries for `VisitReminder` records where `status = 'pending'`, `scheduled_at <= now()`, and `attempt_count < REMINDER_RETRY_LIMIT`.
3. Employs `FOR UPDATE SKIP LOCKED` row locking to prevent multi-worker duplicate delivery.
4. Validates the recipient's `whatsapp_opt_in` consent. If opted out, transitions status to `cancelled` with reason logged.
5. Invokes `WhatsAppProvider.send_message()`.
6. Upon HTTP 200/201: updates `status = 'sent'`, records `sent_at` and provider delivery receipt ID.
7. Upon network/API failure: increments `attempt_count`. If retries reach `REMINDER_RETRY_LIMIT`, marks `status = 'failed'` with the exact error logged in `failure_reason`.

---

## 9. File Storage & Security

- **Path-Traversal Protection**: Filenames submitted by clients are discarded. Files are stored as `prescription_<uuid4>.{pdf|jpg|png}`.
- **Size & Format Restrictions**: Only `.pdf`, `.jpg`, `.jpeg`, and `.png` files under `10MB` are accepted.
- **Access Control**: Prescription files are served through the authenticated `/prescriptions/{id}/file` endpoint with role-based checks.
- **Audit Logging**: Uploads, file views, patient modifications, and reminder events are logged to the `audit_logs` table without recording confidential health records.

---

## 10. Known Limitations & Future Improvements

1. **Webhooks for Inbound WhatsApp Messages**: Implement Meta webhook listeners for real-time delivery receipt confirmation and patient replies.
2. **Cloud Object Storage (S3 / GCS)**: Transition the `StorageService` interface to Amazon S3 or Google Cloud Storage buckets for multi-instance deployments.
3. **Automated Patient WhatsApp Scheduling Bot**: Enable patients to request rescheduling by replying directly through WhatsApp.
