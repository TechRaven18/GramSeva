# GramSeva
Full-stack e-governance platform for Panchayat &amp; Municipality grievance reporting, tracking, and resolution.


<div align="center">

# 🏛️ GramSeva — Panchayat & Municipality Civic Issue Management System

  <p align="center">
    <strong>Full-Stack Digital Grievance Reporting, Real-Time WebSocket Tracking & Automated Resolution Platform for Local Self-Government (Panchayats & Municipalities)</strong>
  </p>

  <p align="center">
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.4.21-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 5" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-4.22-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB_Atlas-8.24-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas" /></a>
    <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-4.8.1-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" /></a>
    <a href="https://cloudinary.com/"><img src="https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" /></a>
  </p>

</div>

---

## 📌 Executive Summary

**GramSeva** is a production-grade e-governance platform designed for rural Panchayats and urban Municipalities across India. It empowers citizens to file location-tagged civic grievances with photo evidence, tracks complaint lifecycles via real-time WebSocket notifications, rewards citizens with store discount vouchers upon issue resolution, and provides administrators with high-impact analytical tools.

---

## 📐 System Architecture

```mermaid
graph TD
    subgraph Client Layer (React 18 + Vite)
        A[Citizen Portal]
        B[Staff Dashboard]
        C[Admin Control Panel]
    end

    subgraph Transport & Security
        D[Socket.IO WebSockets]
        E[REST API Client / Axios]
        F[JWT Authentication & Bcrypt]
    end

    subgraph Backend Services (Node.js + Express)
        G[Express Server API Engine]
        H[Cloudinary CDN Service]
        I[Native Priority Classifier Engine]
        J[Nodemailer SMTP Dispatch]
    end

    subgraph Database Layer
        K[(MongoDB Atlas Cloud Cluster)]
    end

    A -->|Live Events| D
    B -->|Live Events| D
    C -->|Live Events| D
    A -->|HTTP REST| E
    B -->|HTTP REST| E
    C -->|HTTP REST| E

    E --> F
    F --> G

    G -->|Zero-Latency Uploads| H
    G -->|Rule Evaluation| I
    G -->|Real Email Alerts| J
    G -->|Mongoose ODM| K
```

---

## 🔄 Complaint Lifecycle Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant ClientApp as React SPA
    participant Server as Express REST API
    participant Socket as Socket.IO Engine
    actor Staff
    participant DB as MongoDB Atlas

    Citizen->>ClientApp: Submit Complaint + Photo Evidence
    ClientApp->>Server: POST /api/complaints (Multipart)
    Server->>Server: Upload to Cloudinary CDN & Compute Priority
    Server->>DB: Save Complaint Record (Status: PENDING)
    Server->>Socket: Emit complaint:created (Jurisdiction Room)
    Socket-->>Staff: Live Alert on Staff Dashboard (0ms refresh)
    
    Staff->>Server: PUT /api/complaints/:id/status (Status: NEEDS_INFO)
    Server->>DB: Update Status & Log Audit Trail
    Server->>Socket: Emit complaint:updated (Citizen Room)
    Socket-->>Citizen: Unlock Reply Form + Banner Alert

    Citizen->>ClientApp: Send Reply Message & Attachment
    ClientApp->>Server: POST /api/complaints/:id/comment
    Server->>DB: Save Comment & Re-set Status to PENDING
    Server->>Socket: Emit comment:added & complaint:updated

    Staff->>Server: PUT /api/complaints/:id/status (Status: COMPLETED)
    Server->>DB: Credit +20 Reward Coins to Citizen Account
    Server->>Socket: Emit reward:updated (Citizen Room)
    Socket-->>Citizen: Update Live Header Coins Badge (+20)
```

---

## 🪙 Citizen Reward Coin Economy

```mermaid
flowchart LR
    A[Citizen Complaint Completed] -->|System Credit| B[+20 Reward Coins]
    B --> C{Coin Balance Multiples of 100?}
    C -->|Yes| D[Select Partner Merchant Store]
    D --> E[Generate Counter Coupon]
    E -->|Instant Debit| F[Immediate Balance Debit & Email OTP]
    F --> G[Present Coupon at Store Counter]
```

---

## ✨ Core Features & Technical Highlights

### 1. ⚡ Global Real-Time Bidirectional WebSockets
- **Socket.IO Engine**: Built on `http.createServer` for instant synchronization.
- **Isolated Channels**:
  - `citizen_{userId}`: Live status updates, comment replies, and coin balance sync.
  - `jurisdiction_{jurisdictionId}`: Instant arrival alerts for staff work queues.
  - `complaint_{complaintId}`: Live intercommunication message feed.
  - `admin_global`: System-wide metrics.

### 2. ☁️ Cloud Storage & Zero Disk Dependency
- **Cloudinary CDN Integration**: All citizen evidence photos and comment attachments are uploaded directly to Cloudinary cloud storage.
- **Local Cleanup**: Temporary local disk files are deleted immediately using `fs.unlinkSync()`, ensuring images are globally accessible across all devices without relying on local server storage.
- **1.5s Fast Timeout**: Uses `Promise.race` timeouts to guarantee instant (0ms) form submissions even under unstable network conditions.

### 3. 🔒 Conditional Citizen Intercommunication
- **Locked State**: Once a complaint is filed, citizens cannot post follow-up comments or photos while staff is actively investigating (`PENDING`, `ACCEPTED`, `SANCTIONED`).
- **Dynamic Unlock**: Reply forms unlock automatically when staff sets status to `NEEDS_INFO`.
- **Staff Messaging**: Staff members maintain full permission to message citizens at any point in the workflow.

### 4. 🛒 Partner Merchant Store Coin Voucher Ledger
- Citizens redeem coins in multiples of 100 (100, 200, 300, 400 Coins) for discounts at verified partner outlets:
  - `SHOP-RATION-101`: GramSeva Fair Price Ration Shop
  - `SHOP-ELEC-202`: Electricity Bill Payment Counter
  - `SHOP-WATER-303`: Panchayat Drinking Water Board
  - `SHOP-GAS-404`: PM Ujjwala Gas Agency Outlet
  - `SHOP-AGRI-505`: Fertilizer & Seed Co-operative Store

### 5. 🏆 Public Panchayat Resolution Leaderboard
- Ranks local authorities by resolution rate %, total resolved cases, and response speed.

---

## 🛠️ Tech Stack & Technical Logos

| Category | Technology | Logo | Usage |
| :--- | :--- | :---: | :--- |
| **Frontend Core** | React 18 | <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/react/react.png" width="30"/> | Component Architecture |
| **Build Tool** | Vite 5 | <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/vite/vite.png" width="30"/> | HMR & Production Bundling |
| **UI Icons** | Lucide React | <img src="https://lucide.dev/logo.svg" width="30"/> | Modern Vector Iconography |
| **Backend Runtime** | Node.js | <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/nodejs/nodejs.png" width="30"/> | Server Engine |
| **Web Framework** | Express.js | <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/express/express.png" width="30"/> | RESTful API Routes |
| **Real-Time Engine** | Socket.IO | <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/socket-io/socket-io.png" width="30"/> | Bidirectional WebSockets |
| **Database** | MongoDB Atlas | <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mongodb/mongodb.png" width="30"/> | Cloud NoSQL Storage |
| **Cloud Storage** | Cloudinary | <img src="https://res.cloudinary.com/cloudinary/image/upload/new_cloudinary_logo_square.png" width="30"/> | CDN Image Host |
| **Authentication** | JWT & Bcrypt | <img src="https://jwt.io/img/pic_logo.svg" width="30"/> | Secure Token Verification |

---

## 📡 REST API Reference

### 🔑 Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new Citizen account.
- `POST /api/auth/login`: Authenticate with Email & Password.
- `POST /api/auth/send-login-otp`: Send passwordless email OTP.
- `POST /api/auth/verify-login-otp`: Verify email OTP.

### 📋 Complaints (`/api/complaints`)
- `POST /api/complaints`: Submit new complaint with photo attachments.
- `GET /api/complaints/my`: Get citizen's active complaints.
- `GET /api/complaints/staff-queue`: Get staff jurisdiction queue.
- `GET /api/complaints/:id`: Get complaint details & timeline.
- `PUT /api/complaints/:id/status`: Update complaint status (Staff/Admin).
- `POST /api/complaints/:id/comment`: Post intercommunication message.

### 🪙 Rewards (`/api/rewards`)
- `GET /api/rewards/partner-shops`: Get verified partner store directory.
- `GET /api/rewards/my`: Get citizen coin balance & transaction history.
- `POST /api/rewards/request-redemption`: Redeem coins (multiples of 100) for Counter Coupons.

### 🛡️ Admin (`/api/admin`)
- `POST /api/admin/staff`: Create new Staff account under a specific jurisdiction.
- `GET /api/admin/staff`: Get staff directory list.
- `PUT /api/admin/staff/:id/toggle-status`: Activate or deactivate staff login access.
- `DELETE /api/admin/staff/:id`: Delete staff account permanently.
- `GET /api/admin/analytics`: Get Panchayat resolution metrics.

---





## 📄 License

This project is licensed under the **MIT License**.
