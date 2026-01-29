# 🔥 CRITICAL FIX: Super Admin Seeing 0 Tickets Due to Tenant Header

## Problem Identified

**Server logs showed:**
```
[GetTickets] Request from user: { name: 'Mesob Super Commander', role: 'Super Admin', companyId: 20, tenantId: 20 }
[GetTickets] Global admin detected - should see ALL tickets
[GetTickets] Filtering by tenant: 20  ← PROBLEM!
[GetTickets] Final criteria: {"companyId":20}
[GetTickets] Total tickets matching criteria: 0
```

## Root Cause

The `AuthContext.jsx` was **automatically setting the `x-tenant-id` header** to the user's `companyId` for **ALL users**, including Super Admin and System Admin.

This caused:
- Super Admin (company 20) → `x-tenant-id: 20` header sent
- Backend sees tenant header → Filters to company 20 only
- **Company 20 has 0 tickets** → Returns 0 tickets
- All tickets are in companies 1, 2, 3, 4, 5, 11, etc.

## The Fix

Modified `client/src/features/auth/context/AuthContext.jsx` to **NOT set the tenant header** for Super Admin and System Admin:

### Before:
```javascript
// Always set tenant header for ALL users
axios.defaults.headers.common['x-tenant-id'] = String(userData.companyId || '');
```

### After:
```javascript
// Only set tenant header for non-global admins
// Super Admin and System Admin should see ALL tickets across all companies
const globalAdminRoles = ['Super Admin', 'System Admin'];
if (!globalAdminRoles.includes(userData.role)) {
    axios.defaults.headers.common['x-tenant-id'] = String(userData.companyId || '');
}
```

## Changes Made

Updated 3 locations in `AuthContext.jsx`:
1. **useEffect** (session restore) - Line ~20
2. **login** function - Line ~45
3. **register** function - Line ~63

## Expected Result After Fix

### Server Logs (After Fix):
```
[GetTickets] Request from user: { name: 'Mesob Super Commander', role: 'Super Admin', companyId: 20, tenantId: undefined }
[GetTickets] Global admin detected - should see ALL tickets
[GetTickets] No tenant filter - showing ALL tickets  ← FIXED!
[GetTickets] Final criteria: {}
[GetTickets] Total tickets matching criteria: 23
[GetTickets] Returning 23 tickets to client
```

### Browser Console (After Fix):
```
[AdminCommandCenter] Fetching tickets...
[AdminCommandCenter] Tickets received: 23
[AdminCommandCenter] Unassigned tickets: 19
```

### UI (After Fix):
- ✅ LIVE REQUESTS: 20
- ✅ UNASSIGNED: 19
- ✅ Live Dispatch Inbox: 19 PENDING ACTION
- ✅ List of 19 unassigned tickets visible
- ✅ Can click "Dispatch" to assign tickets

## How to Apply

### 1. Commit and Push Changes
```bash
git add client/src/features/auth/context/AuthContext.jsx
git commit -m "Fix: Remove tenant header for Super Admin and System Admin to see all tickets"
git push origin main
```

### 2. Rebuild Frontend (if needed)
```bash
cd client
npm run build
```

### 3. Clear Browser Cache and Logout/Login
**CRITICAL**: The tenant header is set during login, so you MUST:
1. **Logout** from the application
2. **Clear browser cache** (F12 → Application → Clear site data)
3. **Close and reopen browser**
4. **Login again** as Super Admin

### 4. Verify Fix
After logging in again:
- Go to Command Center
- Check browser console (F12)
- Check server terminal
- Should see 23 tickets returned

## Why Logout/Login is Required

The `x-tenant-id` header is set in `axios.defaults.headers.common` during login. This persists for the entire session. Simply refreshing the page won't remove it.

You MUST logout and login again to trigger the new logic that skips setting the header for Super Admin.

## Files Modified

1. `client/src/features/auth/context/AuthContext.jsx` - Fixed tenant header logic

## Technical Details

### Tenant Header Purpose
The `x-tenant-id` header is used for **multi-tenancy** to allow:
- Mesob Admin (company 20) to filter tickets by specific client company
- Regular admins to only see their company's tickets

### Why Super Admin Shouldn't Have It
- Super Admin and System Admin are **global roles**
- They should see **ALL tickets across ALL companies**
- Setting the tenant header restricts them to one company
- This defeats the purpose of having a global admin role

## Impact

- **High Priority**: Blocks entire admin workflow
- **Affects**: Super Admin, System Admin
- **Does NOT affect**: Regular Admin, Team Lead, Technician, Worker

---

**Status**: ✅ Fixed - Logout and login again to apply
**Next Action**: Logout → Clear cache → Login → Test
