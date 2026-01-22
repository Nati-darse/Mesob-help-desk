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

### Admin Routes (Consolidated)
- `/admin` - Admin Command Center (Standard Admin Access)
- `/admin/dashboard` - Analytics & Pulse Dashboard
- `/admin/assign` - Smart Assignment Center
- `/admin/companies` - Organization Registry
- `/admin/users` - Global User Directory (Register Staff)
- `/admin/broadcast` - Broadcast Center (Unified)
- `/admin/settings` - Global Settings (Unified)

### Team Lead Routes
- `/team-lead` - Team Leader Portal
- `/team-lead` - Real-time Request Tracking & History
- `/team-lead` - Integrated "Raise Request" Form

### Shared Routes
- `/profile` - User Profile Management (Password & Photo)
- `/tickets` - General Ticket List
- `/tickets/:id` - Ticket Details

## Quick Test Steps

1. **Login as Super Admin** (admin@mesob.com / admin123)
   - Navigate to `/admin/dashboard`
   - Check real-time analytics
   - Test AI assignment feature
   - Browse company directory

2. **Login as System Admin** (sysadmin@mesob.com / sysadmin123)
   - Navigate to `/sys-admin`
   - Check Mesob Gold theme
   - Test user management
   - View audit logs

3. **Login as Team Lead** (lead@mesob.com / lead123)
   - Navigate to `/team-lead`
   - Test "Raise Request" with floor number
   - Wait for tech assignment (real-time tracking)
   - Test "I Got Service" feedback button on resolved tickets

4. **Login as Technician** (tech@mesob.com / tech123)
   - Navigate to `/tech`
   - View assigned tickets from Team Leads
   - Update ticket status to "Resolved"

5. **Profile Management (All Users)**
   - Navigate to `/profile`
   - Update profile picture URL
   - Change password and verify

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
