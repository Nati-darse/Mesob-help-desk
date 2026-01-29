# Admin Ticket Visibility Solution

## Problem
Tickets are created successfully and show in Analytics, but DON'T appear in:
- Command Center (Live Dispatch Inbox)
- Manual Assignment page

## Root Cause
The backend `getTickets()` function was fixed, but the **server needs to be restarted** for the changes to take effect.

## Solution Steps

### Step 1: Restart the Server ⚠️ CRITICAL
```bash
# Stop the current server (Ctrl+C)
# Then restart it:
cd server
npm start
```

### Step 2: Verify Tickets in Database (Optional)
Run the test script to see what tickets exist:
```bash
node server/test-ticket-visibility.js
```

This will show:
- Total tickets in database
- Tickets with status 'New'
- Unassigned tickets
- What each admin should see

### Step 3: Clear Browser Cache
1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Refresh the page (Ctrl+F5)

### Step 4: Verify API Response
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to Command Center or Manual Assignment
4. Look for the `/api/tickets?pageSize=100` request
5. Check the response - it should contain your tickets

## Expected Behavior After Fix

### Command Center
- Should show unassigned tickets in "Live Dispatch Inbox"
- Filter: `status === 'New' || !technician`
- Should display ticket title, company, priority, category

### Manual Assignment
- Should show unassigned tickets in the list
- Filter: `status === 'New' || !t.technician`
- Should allow clicking "Assign" button

## Troubleshooting

### If tickets still don't show:

1. **Check ticket status in database**
   ```bash
   node server/test-ticket-visibility.js
   ```

2. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for red errors in Console tab

3. **Check API response**
   - Network tab → Find `/api/tickets` request
   - Click on it → Preview tab
   - Should see array of tickets

4. **Verify admin role**
   - System Admin / Super Admin → Should see ALL tickets
   - Admin → Should see tickets from their company
   - Check user's companyId matches ticket's companyId

5. **Check server logs**
   - Look for any errors when fetching tickets
   - Verify the updated `getTickets()` function is running

## Quick Test

1. **Create a test ticket** as a user/team lead
2. **Login as Admin**
3. **Go to Command Center** → Should see ticket in "Live Dispatch Inbox"
4. **Go to Manual Assignment** → Should see ticket in unassigned list
5. **Click "Dispatch" or "Assign"** → Should open assignment dialog

## Code Changes Made

### File: `server/src/controllers/ticketController.js`

**Changed the role-based filtering logic:**

```javascript
// OLD (restrictive):
if (globalAdminRoles.includes(req.user.role) && isMesobStaff) {
    // Only Mesob admins could see all
}

// NEW (correct):
if (globalAdminRoles.includes(req.user.role)) {
    // System Admin and Super Admin see ALL tickets
}
```

## Summary

✅ Backend code is fixed
⚠️ **SERVER MUST BE RESTARTED** for changes to take effect
✅ Test script available to verify database state
✅ Clear browser cache after server restart

**Most likely issue**: Server not restarted after code fix!
