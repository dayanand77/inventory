# Medical College Inventory Management System

Full-stack inventory management platform for medical colleges with role-based access, stock tracking, alerts, analytics, and export features.

## Tech Stack

- Frontend: React + Vite
- Backend: Flask (Python)
- Database: MongoDB
- Authentication: Firebase Authentication + backend token verification using firebase-admin
- Charts: Recharts
- Barcode/QR: ZXing browser scanner
- Deployment: Vercel (frontend) + Render (backend)

## Features Implemented

- Role-based access:
  - Admin: full inventory management, issue/approve requests, export reports, generate low-stock alerts
  - Staff: view inventory, request and return items, view own transaction history
- Inventory management:
  - Add, update, delete items
  - Item code/barcode support
  - Search and category/location filters
- Stock transactions:
  - Issue items (admin)
  - Return items (admin/staff)
  - Request workflow with admin approval
- Dashboard and analytics:
  - Total items, available units, issued units, low-stock count
  - Category distribution
  - Monthly issuance trends
- Notifications:
  - Low-stock alert generation
  - Read/unread status
- Report export:
  - CSV export
  - PDF export
- UI/UX:
  - Responsive layout
  - Sidebar navigation
  - Modal forms
  - Loading and error feedback
  - Interactive data tables and chart visuals

## Folder Structure

project 1/
- backend/
  - app/
    - api/
      - auth_routes.py
      - inventory_routes.py
      - transaction_routes.py
      - dashboard_routes.py
      - notification_routes.py
    - core/
      - auth.py
      - config.py
      - db.py
    - models/
      - schemas.py
    - services/
      - inventory_service.py
      - transaction_service.py
      - dashboard_service.py
      - notification_service.py
      - export_service.py
  - .env.example
  - requirements.txt
  - render.yaml
  - run.py
- frontend/
  - src/
    - components/
      - charts/
      - common/
      - inventory/
      - layout/
    - context/
      - AuthContext.jsx
    - pages/
      - LoginPage.jsx
      - DashboardPage.jsx
      - InventoryPage.jsx
      - TransactionsPage.jsx
      - NotificationsPage.jsx
    - services/
      - api.js
      - firebase.js
      - inventoryService.js
      - transactionService.js
      - dashboardService.js
      - notificationService.js
    - styles/
      - global.css
    - utils/
      - formatters.js
    - App.jsx
    - main.jsx
  - .env.example
  - package.json
  - vercel.json
- README.md

## API Design

Base URL: /api

### Auth
- POST /auth/sync
  - Sync user profile after Firebase login/signup
- GET /auth/me
  - Get current user profile and role
- GET /auth/users (admin)
  - List all users
- PATCH /auth/users/:uid/role (admin)
  - Update user role

### Inventory
- GET /inventory
  - Query params: search, category, location, lowStock
- GET /inventory/:item_id
- GET /inventory/code/:item_code
- POST /inventory (admin)
- PUT /inventory/:item_id (admin)
- DELETE /inventory/:item_id (admin)
- GET /inventory/export/csv (admin)
- GET /inventory/export/pdf (admin)

### Transactions
- GET /transactions
  - Query params: type, status
- POST /transactions/request
  - Staff/Admin creates a request
- POST /transactions/issue (admin)
- POST /transactions/return
- POST /transactions/requests/:request_id/approve (admin)

### Dashboard
- GET /dashboard/metrics
- GET /dashboard/category-breakdown
- GET /dashboard/monthly-usage
- GET /dashboard/low-stock

### Notifications
- GET /notifications
- POST /notifications/generate-low-stock (admin)
- PATCH /notifications/:notification_id/read

## Data Model (MongoDB)

### users
- uid (unique)
- email
- displayName
- role (ADMIN or STAFF)
- department
- createdAt
- updatedAt

### inventory_items
- itemCode (unique)
- name
- category
- location
- unit
- description
- manufacturer
- barcode
- totalQuantity
- availableQuantity
- issuedQuantity
- minimumThreshold
- isLowStock
- usageHistory[]
- createdAt
- updatedAt
- updatedBy

### transactions
- itemId
- type (REQUEST, ISSUE, RETURN)
- status (PENDING, APPROVED, COMPLETED)
- quantity
- requesterUid
- requesterName
- department
- notes
- processedBy
- createdAt
- approvedAt
- linkedTransactionId

### notifications
- type (LOW_STOCK)
- itemId
- itemCode
- message
- isRead
- createdAt
- readAt

## Local Setup

### 1) Firebase setup
1. Create a Firebase project.
2. Enable Email/Password Authentication.
3. Generate web app credentials for frontend.
4. Create a service account JSON key for backend token verification.

### 2) Backend setup
1. Open terminal in backend directory.
2. Create virtual environment:
   - Windows PowerShell: python -m venv .venv
3. Activate environment:
   - .\.venv\Scripts\Activate.ps1
4. Install dependencies:
   - pip install -r requirements.txt
5. Copy environment template:
   - Copy .env.example to .env
6. Fill required variables:
   - MONGODB_URI
   - MONGODB_DB_NAME
   - CORS_ORIGINS
  - FIREBASE_PROJECT_ID
  - GOOGLE_APPLICATION_CREDENTIALS (recommended, path outside repo)
  - FIREBASE_SERVICE_ACCOUNT_JSON (optional fallback if GOOGLE_APPLICATION_CREDENTIALS is not set)
7. Run backend:
   - python run.py

Backend health endpoint: http://localhost:5000/health

### 3) Frontend setup
1. Open terminal in frontend directory.
2. Install dependencies:
   - npm install
3. Copy environment template:
   - Copy .env.example to .env
4. Fill required variables:
   - VITE_API_BASE_URL=http://localhost:5000/api
   - All Firebase web config variables
5. Run frontend:
   - npm run dev

Frontend URL: http://localhost:5173

## Deployment Guide

### Frontend on Vercel
1. Import frontend folder as a Vercel project.
2. Add environment variables from frontend .env.
3. Build command: npm run build
4. Output directory: dist
5. Deploy.

### Backend on Render
1. Create a new Web Service from repository.
2. Set root directory to backend.
3. Build command: pip install -r requirements.txt
4. Start command: gunicorn run:app
5. Add environment variables:
   - MONGODB_URI
   - MONGODB_DB_NAME
   - CORS_ORIGINS (your Vercel URL)
  - FIREBASE_PROJECT_ID
  - FIREBASE_SERVICE_ACCOUNT_JSON (recommended on Render)
   - LOW_STOCK_DEFAULT_THRESHOLD
6. Deploy.

## Step-by-Step Implementation Guidance

1. Initialize backend first and verify /health endpoint.
2. Configure MongoDB and confirm collections are auto-indexed on startup.
3. Enable Firebase auth in frontend and verify token-secured /auth/me call.
4. Build inventory CRUD screens and test role restrictions (admin only actions).
5. Implement transaction workflow and validate stock quantity changes.
6. Add dashboard analytics and confirm chart data from backend APIs.
7. Enable notification generation and low-stock threshold checks.
8. Add barcode scanner for item lookup and field validation.
9. Add export buttons and verify CSV/PDF downloads.
10. Deploy frontend and backend, then update CORS and API base URLs.

## Suggested Next Improvements

- Add pagination and server-side sorting for very large inventories.
- Add automated email notifications for low-stock alerts.
- Add audit logging for role changes and sensitive actions.
- Add unit/integration tests for API services and React pages.
