# Mesob Help Desk – Project Summary

This file summarizes the Mesob Help Desk system so you can quickly understand and navigate the codebase.

---

## 1. Architecture Overview

- **Stack**: MERN (MongoDB, Express, React, Node) with Socket.io and Material UI.
- **Backend**: `server/` – Express API, MongoDB via Mongoose, JWT auth, role-based access, email/SMS notifications.
- **Frontend**: `client/` – React (Vite), Material UI, React Router, React Query, Axios.
- **Multi-tenant**: Each user and ticket is tagged with a `companyId` (bureau/organization).
- **Roles**:
  - `System Admin` – global “god mode” across all entities.
  - `Super Admin` / `Admin` – tenant-level administration and analytics.
  - `Technician` / `Team Lead` – work on and manage tickets.
  - `Worker` / `Employee` – requesters who create and track tickets.

---

## 2. Backend Summary (`server/`)

**Entry point**

- `server/src/index.js`
  - Loads environment variables via `dotenv` from `server/.env`.
  - Requires `MONGODB_URI`, `PORT`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` to be set; fails fast if any are missing.
  - Connects to MongoDB via `connectDB()` (`server/src/config/db.js`).
  - Creates Express app and HTTP server, attaches Socket.io with CORS for `http://localhost:5173`.
  - Registers main route groups:
    - `/api/auth` – authentication & impersonation
    - `/api/tickets` – core ticket lifecycle
    - `/api/users` – technician & user management
    - `/api/dashboard` – stats & analytics
    - `/api/technician` – technician workspace APIs
  - Adds `/api/health` health-check endpoint.

**Models**

- `User` (`server/src/models/User.js`)
  - Fields: `name`, `email` (unique), `password` (hashed, not selected by default), `role`, `department`, `companyId`, `isAvailable`, `createdAt`.
  - Roles: `Worker`, `Technician`, `Team Lead`, `Admin`, `System Admin`, `Super Admin`.
  - Hooks:
    - `pre('save')` hashes `password` with bcrypt.
  - Methods:
    - `matchPassword(enteredPassword)` compares plain password to hash.

- `Ticket` (`server/src/models/Ticket.js`)
  - Core fields: `title`, `description`, `category`, `priority`, `status`.
    - `category`: `Software | Hardware | Network | Account | Other`
    - `priority`: `Low | Medium | High | Critical`
    - `status`: `New | Assigned | In Progress | Resolved | Closed`
  - Relations: `requester` (User), `technician` (User), `department`, `companyId`.
  - Optional fields:
    - `buildingWing`, `attachments[]`, `comments[]`, `rating`, `feedback`, `workLog[]`.
  - `pre('save')` keeps `updatedAt` in sync.

**Auth & security**

- Middleware: `server/src/middleware/authMiddleware.js`
  - `protect`:
    - Reads `Authorization: Bearer <token>`.
    - Verifies JWT with `JWT_SECRET`.
    - Attaches `req.user` (User without password).
  - `authorize(...roles)`:
    - Ensures `req.user.role` is in the allowed set.

- Token utilities: `server/src/utils/token.js`
  - `generateToken(id)` – access token (1h).
  - `generateRefreshToken(id)` – refresh token (7d).

**Notifications**

- `server/src/services/notificationService.js`
  - Email via Nodemailer (`SMTP_*` env vars).
  - SMS via Twilio (`TWILIO_*` env vars).
  - If not configured, email/SMS are simulated by console logging.

**Main controllers**

- Auth (`server/src/controllers/authController.js`)
  - `register`:
    - First ever user becomes `Admin`, others default to `Worker` (or input role).
    - Sends welcome email.
    - Returns user profile + JWT.
  - `login`:
    - Validates credentials, returns profile + `token` + `refreshToken`.
  - `getMe`:
    - Returns currently authenticated user.
  - `impersonateUser` (System Admin only):
    - Returns tokens as if another user logged in.

- Tickets (`server/src/controllers/ticketController.js`)
  - `createTicket`:
    - Uses `req.user` for `requester`, `department`, `companyId`.
    - Sends email confirmation and emits `ticket_created` via Socket.io.
  - `getTickets`:
    - Role-based filtering:
      - Worker → own tickets.
      - Technician → assigned tickets.
      - Admin/lead/global roles → all tickets.
  - `getTicket`:
    - Returns a single ticket with populated relations.
    - Ensures workers can only see their own tickets.
  - `updateTicket`:
    - Generic `findByIdAndUpdate` for ticket fields.
  - `assignTicket`:
    - Sets `technician`, updates status to `Assigned`, notifies technician via email and SMS (for critical tickets), emits `ticket_updated`.
  - `addComment`:
    - Pushes a comment (`user`, `text`) and emits `ticket_updated`.
  - `resolveTicket`:
    - Marks ticket `Resolved` and emits `ticket_updated`.
  - `rateTicket`:
    - Requester sets `rating`, `feedback`, and closes ticket.
  - `addWorkLog`:
    - Technician/Admin add structured entries to `workLog`.

- Users (`server/src/controllers/userController.js`)
  - `getTechnicians`:
    - Lists available technicians (`role='Technician'`, `isAvailable=true`).
  - `updateAvailability`:
    - Current user toggles `isAvailable`.
  - System Admin only:
    - `getAllUsers` – global user list.
    - `updateUserRole` – change a user’s `role`.

- Dashboard (`server/src/controllers/dashboardController.js`)
  - `getStats` (per-user scope):
    - For non-global admins, filters by `companyId`.
    - Returns ticket counts and aggregates by priority and category.
  - `getAdminStats` (global):
    - Aggregates tickets per `companyId`.
    - Counts active technicians (`isAvailable=true`).
    - Computes total downtime (sum of resolution hours) and longest response time.

- Technician (`server/src/controllers/technicianController.js`)
  - Provides technician-centric ticket views and actions:
    - `getAssignedTickets`, `getTicketById`, `updateTicket`.
    - `addInternalNotes`, `addCustomerUpdate`.
    - `resolveTicket` with detailed resolution metadata.

**Routes overview**

- `/api/auth` – auth & impersonation.
- `/api/tickets` – core ticket operations (create, list, assign, resolve, rate, comment, work logs).
- `/api/users` – technicians, availability, global users, role updates.
- `/api/dashboard` – user-scoped stats and global admin stats.
- `/api/technician` – technician workspace endpoints.

---

## 3. Frontend Summary (`client/`)

**Core setup**

- Tooling: Vite + React 19, MUI v7 (+ MUI Lab/X Data Grid), React Router v7, React Query v5, Axios, Emotion for styling.
- Entrypoint: `client/src/main.jsx` (standard Vite entry).
- Root app: `client/src/App.jsx`
  - Wraps everything in:
    - `QueryClientProvider`
    - `ColorModeProvider` (dark/light)
    - `AuthProvider` (auth state)
    - `ThemeProvider` (tenant and role-aware theme)

**Auth client logic**

- `client/src/features/auth/context/AuthContext.jsx`
  - Holds `user` and `loading` state.
  - On mount (in current test setup) clears any stored user and auth header.
  - `login(email, password)` / `register(userData)`:
    - Calls `/api/auth/login` or `/api/auth/register`.
    - On success:
      - Stores user in `localStorage` (`mesob_user`).
      - Sets `axios.defaults.headers.Authorization = Bearer <token>`.
  - `logout()` clears user, storage, and auth header.
  - `updateAvailability(isAvailable)`:
    - Calls `/api/users/availability` and updates `user.isAvailable`.

**Routing & protection**

- Protected routes: `client/src/components/ProtectedRoute.jsx`
  - Shows full-screen spinner while `loading`.
  - If no `user` → redirects to `/login`.
  - If `allowedRoles` is provided and `user.role` not allowed → redirects to `/unauthorized`.
  - Otherwise renders children via `<Outlet />`.

- Role-based redirect: `client/src/components/RoleBasedRedirect.jsx`
  - Maps roles to their main dashboards:
    - System Admin → `/sys-admin`
    - Super Admin → `/admin`
    - Technician / Team Lead → `/tech`
    - Employee/Worker → `/portal`
    - Default → `/dashboard`

- Main route layout (`App.jsx`)
  - Public:
    - `/` (Landing page)
    - `/login`, `/register`
    - `/unauthorized`
    - `/redirect` (role-based redirect)
  - System Admin (wrapped in `SystemAdminLayout`):
    - `/sys-admin` – global dashboard
    - `/sys-admin/companies` – tenant/company registry
    - `/sys-admin/users` – master user list
    - `/sys-admin/audit-logs` – audit logs
    - `/sys-admin/settings` – global settings
    - `/sys-admin/broadcast` – broadcast center
  - Super Admin (wrapped in `SuperAdminLayout`):
    - `/admin`, `/admin/dashboard`, `/admin/assign`, `/admin/companies`
  - Technician:
    - `/tech` – technician dashboard (placeholder)
    - `/tech/tickets/:id` – resolution workspace
  - Employee/Worker:
    - `/portal` – user dashboard
    - `/portal/new-ticket` – ticket wizard
    - `/portal/tickets/:id` – ticket detail view
  - Legacy/general:
    - `/dashboard` – general dashboard
    - `/tickets` – table of tickets
    - `/tickets/new`, `/tickets/:id` – older ticket pages

**Navigation & theming**

- `client/src/components/Navbar.jsx`
  - Shows Mesob logo and title.
  - If logged in:
    - Technicians see an availability switch tied to `updateAvailability`.
    - System Admin sees quick `SysAdmin` button.
    - Everyone sees `Dashboard`, `Tickets`, and `Logout`.
  - If not logged in:
    - Shows `Login` and `Register` buttons.
  - Uses `getCompanyById(user.companyId)` to show the tenant name for non-System-Admin users.

**System Admin UI**

- Layout: `client/src/features/system-admin/layouts/SystemAdminLayout.jsx`
  - Left-hand permanent drawer with “GOD MODE / System Administrator” badge.
  - Navigation items route to global dashboard, companies, users, audit logs, broadcast, global settings.

- Global dashboard: `client/src/features/system-admin/pages/GlobalDashboard.jsx`
  - Only visible for `System Admin`.
  - Uses simulated data for:
    - Real-time pulse chart (Recharts).
    - Platform health (database, socket, SMTP, API).
    - Quick summary stats (active entities, total users, active tickets, uptime).

**Employee UI**

- User dashboard: `client/src/features/employee/pages/UserDashboard.jsx`
  - Personalized dashboard for the current employee:
    - Greets user with their name and tenant/bureau.
    - Shows cards for total tickets, active tickets, and resolved tickets.
    - Bureau-specific news and announcements.
    - “My Active Tickets” list linking into detailed ticket view.

- Ticket creation wizard: `client/src/features/employee/pages/TicketWizard.jsx`
  - Three-step flow:
    1. Choose category (Hardware, Software, Network, Building).
    2. Enter title, description, buildingWing/location, priority.
    3. Review and submit.
  - On submit:
    - POSTs to `/api/tickets` with ticket fields and `companyId`.
    - Navigates back to `/portal`.

- Ticket detail view: `client/src/features/employee/pages/UserTicketView.jsx`
  - Fetches ticket from `/api/tickets/:id`.
  - Shows:
    - Title, company name, created date, status chip.
    - Status stepper (New → Assigned → In Progress → Resolved → Closed).
    - Category, priority, building/location.
    - Conversation section:
      - Lists comments, tagging technician replies.
      - Allows employee to add new comments (`POST /api/tickets/:id/comment`).

**Technician UI**

- Technician dashboard:
  - Route `/tech` uses `TechDashboard`, which presents a focused technician workspace landing page with quick access to tickets.
  - A more detailed technician workspace exists in `TechWorkspace.jsx` but is not yet wired to routes.

- Resolution workspace: `client/src/features/technician/pages/ResolutionPage.jsx`
  - Route `/tech/tickets/:id`.
  - Fetches technician ticket detail from `/api/technician/:id`.
  - Left side:
    - Ticket metadata (priority, company initials, status).
    - Description.
    - Timeline of activity (created, internal notes, customer updates, resolution).
    - Resolution form: category, resolution code, time spent, parts used, next steps; final “Mark as Resolved” button.
  - Right side:
    - Internal notes editor (`PUT /api/technician/:id/internal-notes`).
    - Customer update editor (`POST /api/technician/:id/updates`).
    - Contact info (requester name, email, phone, location).

**Tickets list**

- `client/src/features/tickets/pages/TicketList.jsx`
  - Uses React Query `useTickets` hook (`/api/tickets`).
  - Displays tickets in a table:
    - Title, bureau, category, priority, status, created date.
  - Employee users see a “New Ticket” button linking to `/tickets/new` (legacy).
  - Clicking a row opens `/tickets/:id`.

**Multi-tenant helper**

- `client/src/utils/companies.js`
  - Provides list of tenant organizations (`COMPANIES`) with `id`, `name`, `initials`.
  - Helper `getCompanyById(id)` returns the matching company or a default.
  - Used throughout the UI to label tickets and dashboards per bureau.

---

## 4. How to Run (Short Version)

From the project root:

1. Backend
   - `cd server`
   - `npm install`
   - Run `node setup_env.js` once to generate `.env` with required variables (port, Mongo URI, JWT secrets).
   - Ensure MongoDB is running locally (or update `MONGODB_URI` in `.env`).
   - `npm run dev` (starts API at `http://localhost:5000`).

2. Frontend
   - `cd client`
   - `npm install`
   - `npm run dev` (starts Vite dev server, typically at `http://localhost:5173`).

3. Access
   - Open the printed Vite URL in the browser (for example, `http://localhost:5173`).
   - First registered user becomes `Admin` and can manage tickets and dashboards.

