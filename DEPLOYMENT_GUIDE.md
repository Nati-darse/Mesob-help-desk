# 🚀 Deployment Guide - Authentication Fixes

## Prerequisites
- Node.js installed
- MongoDB connection working
- Environment variables configured

## Step-by-Step Deployment

### 1️⃣ Verify Current State
```bash
cd server
node verify-roles.js
```

**Expected Output:**
- Shows all users and their roles
- Identifies any users with old `'TECHNICIAN'` role (all caps)

### 2️⃣ Run Database Migration
```bash
node migrate-technician-role.js
```

**What it does:**
- Updates all `'TECHNICIAN'` roles to `'Technician'`
- Shows before/after counts
- Verifies the migration

**Expected Output:**
```
🔄 Starting Technician Role Migration...
✓ MongoDB Connected
📋 Found X user(s) with role "TECHNICIAN"
🔧 Updating roles to "Technician"...
✅ Migration Complete!
```

### 3️⃣ Verify Migration Success
```bash
node verify-roles.js
```

**Expected Output:**
- No warnings about `'TECHNICIAN'` role
- All roles should be properly formatted
- Message: "✅ No action required"

### 4️⃣ Test Authentication
```bash
node test-auth.js
```

**Expected Output:**
```
🧪 Starting Authentication Tests...
Testing sysadmin@mesob.com... ✅ PASSED (System Admin)
Testing admin@mesob.com... ✅ PASSED (Super Admin)
Testing tech@mesob.com... ✅ PASSED (Technician)
Testing solomon@mesob.com... ✅ PASSED (Technician)
Testing lead@mesob.com... ✅ PASSED (Team Lead)
Testing ermias@eeu.com... ✅ PASSED (Worker)

📊 Test Results:
   ✅ Passed: 6/6
   ❌ Failed: 0/6

🎉 All authentication tests passed!
```

### 5️⃣ Restart Server
```bash
# Development
npm run dev

# Production
npm start
```

### 6️⃣ Rebuild Client (if needed)
```bash
cd ../client
rm -rf node_modules/.cache dist
npm run build
```

### 7️⃣ Test Login for Each Role

#### System Admin
- URL: http://localhost:5173/login
- Email: `sysadmin@mesob.com`
- Password: `sysadmin123`
- Expected: Redirect to `/sys-admin`

#### Super Admin
- Email: `admin@mesob.com`
- Password: `admin123`
- Expected: Redirect to `/admin`

#### Technician
- Email: `tech@mesob.com`
- Password: `tech123`
- Expected: Redirect to `/tech`

#### Team Lead
- Email: `lead@mesob.com`
- Password: `lead123`
- Expected: Redirect to `/team-lead`

#### Worker/Employee
- Email: `ermias@eeu.com`
- Password: `emp123`
- Expected: Redirect to `/portal`

## 🔍 Troubleshooting

### Issue: Migration script shows "No users found"
**Solution:** Users might already be migrated or seed data not loaded
```bash
node seed.js  # Re-seed database
node migrate-technician-role.js  # Run migration again
```

### Issue: Login fails with "Invalid credentials"
**Possible Causes:**
1. Migration not run
2. Password hash issue
3. Database connection problem

**Solution:**
```bash
node verify-roles.js  # Check roles
node test-auth.js     # Test authentication
```

### Issue: Redirect to wrong dashboard
**Possible Causes:**
1. Role constants not updated in client
2. Browser cache

**Solution:**
```bash
cd client
rm -rf node_modules/.cache
npm run dev  # Restart dev server
# Clear browser cache (Ctrl+Shift+Delete)
```

### Issue: 403 Forbidden on technician routes
**Cause:** Authorization middleware now enforces role checks

**Solution:** Ensure user has `'Technician'` role (not `'TECHNICIAN'`)
```bash
node verify-roles.js
```

## 📋 Post-Deployment Checklist

- [ ] Migration script completed successfully
- [ ] Verification script shows no warnings
- [ ] Authentication tests all pass
- [ ] Server restarted without errors
- [ ] Client rebuilt (if production)
- [ ] System Admin can login
- [ ] Super Admin can login
- [ ] Technician can login
- [ ] Team Lead can login
- [ ] Worker can login
- [ ] Role-based routing works
- [ ] Technician can access /tech routes
- [ ] No console errors in browser
- [ ] No authorization errors in server logs

## 🔄 Rollback Procedure

If critical issues occur:

### 1. Rollback Database
```javascript
// In MongoDB shell or script
db.users.updateMany(
  { role: 'Technician' },
  { $set: { role: 'TECHNICIAN' } }
)
```

### 2. Rollback Code
```bash
git revert HEAD  # Or specific commit
npm install
npm start
```

### 3. Verify Rollback
```bash
node verify-roles.js
```

## 📞 Support

### Check Logs
```bash
# Server logs
tail -f server/logs/error.log

# PM2 logs (if using PM2)
pm2 logs

# Browser console
F12 → Console tab
```

### Common Error Messages

**"User role Technician is not authorized"**
- Migration successful, authorization working correctly
- User needs proper role assigned

**"Invalid credentials"**
- Check email/password
- Verify user exists in database
- Check password hash

**"Not authorized, no token"**
- Token not being sent
- Check axios headers
- Verify sessionStorage

## 🎯 Success Criteria

✅ All 6 test accounts can login
✅ Each role redirects to correct dashboard
✅ Technicians can access technician routes
✅ Authorization middleware blocks unauthorized access
✅ No role-related errors in logs
✅ Role hierarchy system working

---

**Last Updated:** [Current Date]
**Version:** 2.0.0
**Status:** Production Ready
