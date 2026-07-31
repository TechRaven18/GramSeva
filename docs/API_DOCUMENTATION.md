# Panchayat & Municipality Civic Issue Management System - API & Architecture Documentation

## System Architecture

```
                       ┌─────────────────────────┐
                       │  React 18 + Vite Web UI │
                       └────────────┬────────────┘
                                    │ HTTP / REST (JWT)
                                    ▼
                       ┌─────────────────────────┐
                       │ Node.js / Express API   │
                       └─────┬──────────────┬────┘
                             │              │
       MongoDB Data Store    │              │  Inference Request
                             ▼              ▼
                    ┌──────────────┐   ┌────────────────────────┐
                    │  MongoDB     │   │ Python FastAPI         │
                    │  Database    │   │ CNN Image Classifier   │
                    └──────────────┘   └────────────────────────┘
```

---

## Data Models & Collections

1. **Users**: `name`, `mobile`, `email`, `password` (hashed), `role` (`CITIZEN`, `STAFF`, `ADMIN`), `address`, `rewardCoins`, `jurisdiction`.
2. **Jurisdictions**: `district`, `block`, `panchayat`, `type` (`PANCHAYAT` / `MUNICIPALITY`), `villages`.
3. **Complaints**: `complaintId` (`CMP-YYYYMMDD-XXXX`), `citizen`, `location`, `jurisdictionId`, `category`, `description`, `images`, `status` (`PENDING`, `NEEDS_INFO`, `ACCEPTED`, `SANCTIONED`, `COMPLETED`, `REJECTED`), `priority` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), `cnnResult`, `priorityOverride`.
4. **StatusHistory**: `complaint`, `fromStatus`, `toStatus`, `actor`, `actorRole`, `message`, `timestamp`.
5. **RewardTransactions**: `citizen`, `complaint`, `type` (`CREDIT` / `DEBIT`), `amount`, `description`, `balanceAfter`.
6. **Redemptions**: `redemptionId`, `citizen`, `merchantName`, `coins`, `otp` (6-digit), `otpExpiresAt`, `status`.

---

## Core API Endpoints

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: Citizen registration.
- `POST /api/auth/login`: Authenticates Citizen, Staff, or Admin. Returns JWT.
- `GET /api/auth/me`: Returns profile of authenticated user.

### 2. Location Hierarchy (`/api/locations`)
- `GET /api/locations/districts`: Returns distinct districts.
- `GET /api/locations/blocks?district=...`: Returns blocks in district.
- `GET /api/locations/panchayats?district=...&block=...`: Returns Panchayats/Municipalities.
- `GET /api/locations/villages?jurisdictionId=...`: Returns villages under a Panchayat.

### 3. Complaints & Routing (`/api/complaints`)
- `POST /api/complaints`: Submits complaint with photo upload. Auto-routes by location & analyzes with CNN service.
- `GET /api/complaints/my`: Citizen views submitted complaints.
- `GET /api/complaints/staff-queue`: Staff views jurisdiction complaints ordered by CNN priority (`CRITICAL` > `HIGH` > `MEDIUM` > `LOW`).
- `GET /api/complaints/:id`: Fetches complaint details & status history timeline.
- `PUT /api/complaints/:id/status`: Staff updates status (triggers +20 reward coins on first acceptance).
- `PUT /api/complaints/:id/priority-override`: Staff overrides CNN priority with audit trail.

### 4. Reward Ledger & Redemption (`/api/rewards`)
- `GET /api/rewards/my`: Citizen views coin balance and transaction history.
- `POST /api/rewards/request-redemption`: Generates 6-digit redemption OTP code.
- `POST /api/rewards/verify-redemption`: Merchant verifies OTP and deducts coins atomically.

### 5. Admin Management & Analytics (`/api/admin`)
- `POST /api/admin/staff`: Creates staff account assigned to a jurisdiction.
- `GET /api/admin/staff`: Lists all staff accounts and jurisdiction assignments.
- `PUT /api/admin/staff/:id/toggle-status`: Activates / deactivates staff account.
- `PUT /api/admin/staff/:id/reset-password`: Resets staff password.
- `GET /api/admin/analytics`: Panchayat resolution ranking & completion rate metrics.
