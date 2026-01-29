# Ticket Visibility Issue - Debug Analysis

## Problem
Tickets are created successfully but not visible on admin side for assignment.

## Root Cause Analysis

### Backend Logic (ticketController.js - getTickets)

```javascript
const globalAdminRoles = ['System Admin', 'Super Admin', 'Admin'];
const isMesobStaff = req.user.companyId === 20;

if (globalAdminRoles.includes(req.user.role) && isMesobStaff) {
    // Global admins from Mesob can see everything
    if (req.tenantId) {
        criteria.companyId = req.tenantId;
    }
} else if (req.user.role === 'Technician' && isMesobStaff) {
    // Technicians from Mesob see their assigned tickets
    criteria.technician = req.user._id;
} else {
    // Client employees are scoped to their company
    criteria.companyId = req.user.companyId;
    
    if (req.user.role === 'Worker') {
        criteria.requester = req.user._id;
    }
}
```

### The Issue

**Scenario 1: Admin is from Company 20 (Mesob)**
- ✅ Can see ALL tickets from all companies
- ✅ Works correctly

**Scenario 2: Admin is from Company X (NOT Company 20)**
- ❌ Can ONLY see tickets from Company X
- ❌ Cannot see tickets from other companies
- This is the PROBLEM!

### Expected Behavior

Admins should be able to see tickets based on their role:
- **System Admin**: See ALL tickets (global)
- **Super Admin**: See ALL tickets (global)  
- **Admin**: See tickets from their company OR all if they're Mesob staff
- **Team Lead**: See tickets from their company
- **Worker**: See only their own tickets

### Current Behavior

The logic treats ALL non-Mesob admins as "client employees" and restricts them to their company only.

## Solution Options

### Option 1: Make All Admins Global (Recommended)
Remove the `isMesobStaff` check for System Admin and Super Admin roles.

### Option 2: Use Tenant Header
Admins can pass `x-tenant-id` header to see tickets from specific companies.

### Option 3: Change Company Scoping Logic
Allow Admins to see tickets from their company + any company they manage.

## Recommended Fix

Update the logic to:
1. System Admin & Super Admin = See ALL tickets (regardless of company)
2. Admin = See tickets from their company only
3. Team Lead = See tickets from their company only
4. Worker = See only their own tickets
