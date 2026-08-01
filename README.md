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
    subgraph Client_Layer ["Client Layer"]
        A["Citizen Portal"]
        B["Staff Dashboard"]
        C["Admin Control Panel"]
    end

    subgraph Transport_Security ["Transport and Security"]
        D["Socket.IO WebSockets"]
        E["REST API Client"]
        F["JWT Auth and Bcrypt"]
    end

    subgraph Backend_Services ["Backend Services"]
        G["Express Server Engine"]
        H["Cloudinary CDN Service"]
        I["Native Priority Classifier"]
        J["Nodemailer SMTP Dispatch"]
    end

    subgraph Database_Layer ["Database Layer"]
        K[("MongoDB Atlas Cloud Database")]
    end

    A --> D
    B --> D
    C --> D
    A --> E
    B --> E
    C --> E

    E --> F
    F --> G

    G --> H
    G --> I
    G --> J
    G --> K
```

---

## 🔄 Complaint Lifecycle Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant ClientApp as React SPA Client
    participant Server as Express REST API Engine
    participant Socket as Socket.IO WebSockets
    actor Staff
    participant DB as MongoDB Atlas Database

    Citizen->>ClientApp: Submit Complaint with Photo Evidence
    ClientApp->>Server: Send POST Request to /api/complaints
    Server->>Server: Upload to Cloudinary CDN and Compute Priority
    Server->>DB: Save Complaint Record with PENDING Status
    Server->>Socket: Broadcast complaint:created to Jurisdiction Room
    Socket-->>Staff: Live Alert on Staff Dashboard Queue

    Staff->>Server: Send PUT Request with NEEDS_INFO Status
    Server->>DB: Update Status and Write Audit History
    Server->>Socket: Broadcast complaint:updated to Citizen Room
    Socket-->>Citizen: Unlock Reply Form and Display Alert Banner

    Citizen->>ClientApp: Send Reply Message and Evidence Photo
    ClientApp->>Server: Send POST Request to /api/complaints/:id/comment
    Server->>DB: Save Message and Re-set Status to PENDING
    Server->>Socket: Broadcast comment:added and complaint:updated

    Staff->>Server: Send PUT Request with COMPLETED Status
    Server->>DB: Credit 20 Reward Coins to Citizen Account
    Server->>Socket: Broadcast reward:updated to Citizen Room
    Socket-->>Citizen: Live Header Coins Badge Incremented by 20
```

---

## 🪙 Citizen Reward Coin Economy

```mermaid
flowchart LR
    A["Citizen Complaint Completed"] --> B["Credit 20 Reward Coins"]
    B --> C{"Check Balance Multiples of 100"}
    C -->|Valid| D["Select Partner Merchant Store"]
    D --> E["Generate Discount Voucher"]
    E --> F["Debit Coins Balance and Send OTP"]
    F --> G["Present Voucher at Store Counter"]
```

---

## 📁 Repository Directory Structure

```ascii
panchayat-management-system/
├── client/                     # Frontend Web Application (React 18 + Vite)
│   ├── public/                 # Static Assets & Emblem Graphics
│   └── src/
│       ├── components/         # Reusable Component Library
│       │   ├── CitizenProfileModal.jsx
│       │   ├── Footer.jsx
│       │   ├── GovernmentHeader.jsx
│       │   └── StatusTimeline.jsx
│       ├── context/            # React State Context Providers
│       │   ├── AuthContext.jsx
│       │   └── SocketContext.jsx
│       ├── pages/              # Application Views & Dashboards
│       │   ├── AdminDashboard.jsx
│       │   ├── CitizenDashboard.jsx
│       │   ├── ComplaintDetails.jsx
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── NewComplaint.jsx
│       │   ├── Register.jsx
│       │   ├── Rewards.jsx
│       │   ├── StaffDashboard.jsx
│       │   └── TopPanchayats.jsx
│       ├── services/           # Centralized Axios HTTP Client
│       │   └── api.js
│       ├── App.jsx             # React Router Route Definitions
│       ├── main.jsx            # Application Root Mounting
│       └── index.css           # Modern Glassmorphism Styling Token System
│
├── server/                     # Backend REST API + Socket.IO Server (Node.js)
│   ├── config/                 # Database, Seeder & Socket Modules
│   │   ├── db.js
│   │   ├── seedAdmin.js
│   │   └── socket.js
│   ├── controllers/            # Business Logic Route Controllers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   ├── locationController.js
│   │   └── rewardController.js
│   ├── middleware/             # JWT Authentication & Authorization
│   │   └── authMiddleware.js
│   ├── models/                 # Mongoose Data Schemas
│   │   ├── Complaint.js
│   │   ├── Jurisdiction.js
│   │   ├── Redemption.js
│   │   ├── RewardTransaction.js
│   │   ├── StatusHistory.js
│   │   └── User.js
│   ├── routes/                 # Express API Endpoint Definitions
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── locationRoutes.js
│   │   └── rewardRoutes.js
│   ├── utils/                  # Cloudinary, ML & Notification Services
│   │   ├── cloudinaryService.js
│   │   ├── idGenerator.js
│   │   ├── mlIntegration.js
│   │   ├── notificationService.js
│   │   └── shopData.js
│   └── server.js               # Express API & Socket.IO HTTP Server Entry Point
│
├── .gitignore
└── README.md
```

---

## ✨ Core Features & Technical Highlights

### 1. ⚡ Global Real-Time Bidirectional WebSockets
- **Socket.IO Engine**: Built on `http.createServer` for instant synchronization across sessions.
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
<h3>🌐 <a href="https://gramseva-frontend.onrender.com">Click Here to Visit Live Application</a></h3>

## 📄 License

This project is licensed under the **MIT License**.
