# Test Credentials for Mesob Help Desk System

## Super Admin
- **Email**: admin@mesob.com
- **Password**: admin123
- **Role**: Super Admin
- **Access**: Full system control, all entities, analytics dashboard

## System Admin (God Mode)
- **Email**: sysadmin@mesob.com
- **Password**: sysadmin123
- **Role**: System Admin
- **Access**: Global settings, user management, audit logs, company registry

## Team Lead
- **Email**: lead@mesob.com
- **Password**: lead123
- **Role**: Team Lead
- **Access**: Team management, ticket assignment, reports

## Technicians
- **Primary Technician**
  - **Email**: tech@mesob.com
  - **Password**: tech123
  - **Role**: Technician
  - **Access**: Ticket management, status updates, resolution
- **Secondary Technician**
  - **Email**: solomon@mesob.com
  - **Password**: tech123
  - **Role**: Technician
  - **Access**: Same as above, for a different company
- **🆕 Enhanced Technician (MESOB Internal Staff)**
  - **Email**: techtest@mesob.com
  - **Password**: tech123
  - **Role**: Technician
  - **Company**: MESOB Internal (ID: 1)
  - **Department**: IT Support
  - **Features**: Cross-tenant access, KPI tracking, duty status, performance metrics
  - **Access**: ALL company tickets, enhanced dashboard, mission control workspace

## Employees (Workers)
- **EEU Employee**
  - **Email**: ermias@eeu.com
  - **Password**: emp123
  - **Role**: Worker
  - **Access**: Create tickets, view own tickets
- **CBE Employee**
  - **Email**: abebe@cbe.com
  - **Password**: emp123
  - **Role**: Worker
  - **Access**: Create tickets, view own tickets
- **Ethio Telecom Employee**
  - **Email**: sara@ethiotelecom.com
  - **Password**: emp123
  - **Role**: Worker
  - **Access**: Create tickets, view own tickets
- **AACAA Employee**
  - **Email**: daniel@aacaa.gov.et
  - **Password**: emp123
  - **Role**: Worker
  - **Access**: Create tickets, view own tickets

## Test Companies (24 Entities)
1. **FDR** - Federal Democratic Republic
2. **PMO** - Prime Minister Office
3. **MFA** - Ministry of Foreign Affairs
4. **MOD** - Ministry of Defense
5. **MOF** - Ministry of Finance
6. **MOJ** - Ministry of Justice
7. **MOH** - Ministry of Health
8. **MOE** - Ministry of Education
9. **MOT** - Ministry of Transport
10. **MOW** - Ministry of Works
11. **MOA** - Ministry of Agriculture
12. **MOC** - Ministry of Culture
13. **MOIT** - Ministry of Innovation & Technology
14. **MOTI** - Ministry of Trade & Industry
15. **MOL** - Ministry of Labor
16. **MOEWD** - Ministry of Energy & Water
17. **MOTC** - Ministry of Tourism & Culture
18. **MOP** - Ministry of Planning
19. **MOS** - Ministry of Sports
20. **MOG** - Ministry of Gender
21. **MOY** - Ministry of Youth
22. **MESOB** - Mesob Technologies
23. **ETHIO** - Ethiopian Airlines
24. **TELE** - Ethio Telecom

## Testing Routes

### Super Admin Routes
- `/admin` - Super Admin Dashboard
- `/admin/dashboard` - Analytics Dashboard
- `/admin/assign` - Smart Assignment Center
- `/admin/companies` - Company Directory

### System Admin Routes
- `/sys-admin` - Global Dashboard
- `/sys-admin/accounts` - **🆕 Account Management** (Create Super Admin, Technician, Team Lead accounts)
- `/sys-admin/companies` - Company Registry
- `/sys-admin/users` - Master User Table
- `/sys-admin/audit-logs` - Audit Logs
- `/sys-admin/settings` - Global Settings
- `/sys-admin/broadcast` - Broadcast Center

### Technician Routes
- `/tech` - 🎯 **Unified Technician Dashboard** (Performance Metrics, Duty Status, Mission Control)
- `/tech/tickets/:id` - Ticket Resolution Page (Enhanced with Accept Button)

### Employee Routes
- `/portal` - User Dashboard
- `/portal/new-ticket` - Create Ticket
- `/portal/tickets/:id` - View Ticket

## Quick Test Steps

1. **Login as Super Admin** (admin@mesob.com / admin123)
   - Navigate to `/admin/dashboard`
   - Check real-time analytics
   - Test AI assignment feature
   - Browse company directory

2. **Login as System Admin** (sysadmin@mesob.com / sysadmin123)
   - Navigate to `/sys-admin`
   - Check Mesob Gold theme
   - **🆕 Test Account Management** - Navigate to `/sys-admin/accounts`
     - Create new Super Admin, Technician, or Team Lead accounts
     - View account statistics and management table
     - Edit and delete privileged accounts
     - All actions are logged in audit trail
   - Test user management
   - View audit logs

3. **🆕 Login as Enhanced Technician** (techtest@mesob.com / tech123)
   - Navigate to `/tech` - **Unified dashboard** with all features:
     - Performance metrics with KPI tracking
     - Duty status toggle (Online, On-Site, Break, Offline)
     - Mission Control access to cross-tenant tickets
     - Professional MESOB branding
   - Click "Open Mission Control" to access tickets from all companies
   - Accept tickets using new "Accept Ticket" button in ticket details
   - Resolve tickets with required Root Cause and Action Taken fields
   - Monitor real-time performance metrics (Response Time, Resolution Time)

4. **Login as Technician** (tech@mesob.com / tech123)
   - Navigate to `/tech`
   - View assigned tickets
   - Update ticket status

5. **Login as Employee** (example: ermias@eeu.com / emp123)
   - Navigate to `/portal`
   - Create new ticket
   - View ticket history

## Theme Testing
- **System Admin**: Gold accent (#FFD700) theme
- **Super Admin**: Blue accent (#1976d2) theme
- **Other Roles**: Default blue theme

## Features to Test
- ✅ Real-time data updates
- ✅ AI-powered ticket assignment
- ✅ Role-based routing
- ✅ Company directory (24 entities)
- ✅ Responsive design
- ✅ Theme switching
- 🆕 **Cross-tenant technician access**
- 🆕 **KPI performance tracking**
- 🆕 **Duty status management**
- 🆕 **Enhanced resolution workflow**
- 🆕 **Real-time performance metrics**
- 🆕 **System Admin Account Management** - Create privileged accounts with proper role assignment
