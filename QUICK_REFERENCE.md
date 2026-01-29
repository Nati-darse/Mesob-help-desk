# Quick Reference: Default Password & First Login

## 🔑 Default Password
```
Mesob@123
```

## 📍 Key Locations

### Backend:
- **User Model:** `server/src/models/User.js` (added `isFirstLogin` field)
- **Auth Controller:** `server/src/controllers/authController.js` (default password logic)
- **Auth Routes:** `server/src/routes/authRoutes.js` (new endpoint)

### Frontend:
- **Password Dialog:** `client/src/components/ChangePasswordDialog.jsx` (new component)
- **App Integration:** `client/src/App.jsx` (dialog trigger logic)
- **Admin UI:** `client/src/features/system-admin/pages/GlobalUserEditor.jsx` (alert message)

## 🔗 API Endpoints

### Change Password (New):
```
PUT /api/auth/change-first-password
Authorization: Bearer <token>

Body:
{
    "currentPassword": "Mesob@123",
    "newPassword": "YourNewPassword@123"
}
```

### Login (Modified):
```
POST /api/auth/login

Body:
{
    "email": "user@example.com",
    "password": "Mesob@123"
}

Response includes:
{
    ...
    "isFirstLogin": true/false
}
```

### Register User (Modified):
```
POST /api/auth/register-user
Authorization: Bearer <token>

Body:
{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Technician",
    "companyId": 1
}

Response includes:
{
    ...
    "isFirstLogin": true,
    "temporaryPassword": "Mesob@123"
}
```

## ✅ Password Requirements

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*(),.?":{}|<>)

## 🎯 Quick Test

### 1. Create User (as System Admin):
```
Navigate to: /sys-admin/users
Click: "Register New User"
Fill: Name, Email, Role, Company
Click: "Create User"
```

### 2. First Login (as New User):
```
Navigate to: /login
Email: <new user email>
Password: Mesob@123
Click: "Login"
→ Password change dialog appears
```

### 3. Change Password:
```
Current Password: Mesob@123
New Password: <strong password>
Confirm Password: <same strong password>
Click: "Change Password"
→ Dialog closes, access dashboard
```

### 4. Verify:
```
Logout
Login with new password
→ No dialog, direct to dashboard
```

## 🔧 Configuration

### Change Default Password:
**File:** `server/src/controllers/authController.js`
```javascript
// Line ~180
const defaultPassword = 'Mesob@123'; // Change this
```

**Also update:**
- `client/src/features/system-admin/pages/GlobalUserEditor.jsx` (alert message)
- `client/src/components/ChangePasswordDialog.jsx` (hint message)

### Force All Users to Change Password:
```javascript
// MongoDB command
db.users.updateMany(
    {},
    { $set: { isFirstLogin: true } }
);
```

## 🐛 Troubleshooting

### Dialog Not Appearing:
1. Check login response has `isFirstLogin: true`
2. Check browser console for errors
3. Clear localStorage/sessionStorage
4. Verify user in database has `isFirstLogin: true`

### Cannot Change Password:
1. Verify current password is `Mesob@123`
2. Check new password meets all requirements
3. Check network tab for API errors
4. Verify endpoint `/api/auth/change-first-password` exists

### Dialog Can Be Closed:
1. Check `ChangePasswordDialog` props
2. Verify `onClose={() => {}}` is empty function
3. Check `disableEscapeKeyDown` is set

## 📊 Database Fields

### User Document:
```javascript
{
    _id: ObjectId("..."),
    name: "John Doe",
    email: "john@example.com",
    password: "$2a$10$...", // hashed
    role: "Technician",
    companyId: 20,
    department: "Mesob-Digitalization-Team/IT-Support",
    isFirstLogin: true, // NEW FIELD
    // ... other fields
}
```

### After Password Change:
```javascript
{
    // ... same fields
    isFirstLogin: false, // CHANGED
    password: "$2a$10$...", // NEW HASH
}
```

## 📝 Admin Instructions

### Creating New User:
1. Login as System Admin or Super Admin
2. Go to User Management
3. Click "Register New User"
4. Fill in user details
5. Note: Default password is `Mesob@123`
6. User will be forced to change on first login

### Communicating Credentials:
**Option 1:** Email (automatic)
- Email sent automatically with credentials
- Check spam folder if not received

**Option 2:** Manual
- Tell user: "Your password is Mesob@123"
- Inform: "You must change it on first login"

## 🔒 Security Notes

- ✅ All passwords hashed with bcrypt
- ✅ Cannot bypass password change dialog
- ✅ Strong password requirements enforced
- ✅ Current password verified before change
- ✅ Cannot reuse current password
- ✅ All actions logged in audit trail

## 📚 Documentation

- **Full Technical Docs:** `FIRST_LOGIN_PASSWORD_CHANGE.md`
- **Testing Guide:** `TEST_FIRST_LOGIN.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Account Creation Process:** `ACCOUNT_CREATION_PROCESS.md`

## ⚡ Quick Commands

### Check User Status:
```javascript
// MongoDB
db.users.findOne({ email: "user@example.com" })
```

### Reset User to First Login:
```javascript
// MongoDB
db.users.updateOne(
    { email: "user@example.com" },
    { $set: { isFirstLogin: true } }
)
```

### Count Users Needing Password Change:
```javascript
// MongoDB
db.users.countDocuments({ isFirstLogin: true })
```

## 🎉 Success Indicators

✅ User created with default password  
✅ Email sent with credentials  
✅ First login shows password dialog  
✅ Dialog cannot be dismissed  
✅ Password requirements validated  
✅ Password changed successfully  
✅ Dialog closes after change  
✅ User accesses dashboard  
✅ Second login works with new password  
✅ Old password rejected  
✅ Database shows `isFirstLogin: false`  

---

**Quick Reference Version:** 1.0  
**Last Updated:** January 28, 2026
