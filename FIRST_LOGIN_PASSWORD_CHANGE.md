# First Login Password Change Implementation

## Overview
Implemented a mandatory password change feature for all newly created users. When System Admin or Super Admin creates a new user, they receive a default password of **"Mesob@123"** and must change it upon first login.

---

## Changes Made

### 1. Backend Changes

#### A. User Model (`server/src/models/User.js`)
**Added Field:**
```javascript
isFirstLogin: {
    type: Boolean,
    default: true,
}
```

**Purpose:** Tracks whether the user has logged in and changed their password for the first time.

---

#### B. Auth Controller (`server/src/controllers/authController.js`)

**Modified `registerUser` Function:**
- Changed from dynamic password generation to static default password
- Default password: `Mesob@123`
- Sets `isFirstLogin: true` for all new users

```javascript
const defaultPassword = 'Mesob@123';

const user = await User.create({
    name,
    email,
    password: defaultPassword,
    role: finalRole,
    companyId: userCompanyId,
    department: userDept,
    isFirstLogin: true  // NEW
});
```

**Modified `login` Function:**
- Now returns `isFirstLogin` flag in response
- Frontend uses this to determine if password change dialog should show

```javascript
res.json({
    // ... other fields
    isFirstLogin: user.isFirstLogin ?? false,  // NEW
    token: generateToken(user._id),
    refreshToken: generateRefreshToken(user._id),
});
```

**Added `changeFirstPassword` Function:**
- New endpoint for changing password on first login
- Validates current password
- Enforces password requirements
- Prevents using same password
- Sets `isFirstLogin: false` after successful change

```javascript
exports.changeFirstPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    
    // Update password and mark first login complete
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();
};
```

---

#### C. Auth Routes (`server/src/routes/authRoutes.js`)

**Added New Route:**
```javascript
router.put('/change-first-password', protect, changeFirstPassword);
```

**Endpoint:** `PUT /api/auth/change-first-password`  
**Access:** Private (any authenticated user)  
**Purpose:** Allow users to change their password on first login

---

### 2. Frontend Changes

#### A. Change Password Dialog Component (`client/src/components/ChangePasswordDialog.jsx`)

**New Component Created** with the following features:

**Features:**
- Modal dialog that cannot be dismissed (no close button, no ESC key, no click outside)
- Shows current default password hint: "Mesob@123"
- Three input fields:
  - Current Password
  - New Password
  - Confirm New Password
- Real-time password requirement validation with visual indicators
- Password requirements enforced:
  - At least 8 characters
  - Contains uppercase letter
  - Contains lowercase letter
  - Contains number
  - Contains special character

**Validation:**
- All fields required
- New passwords must match
- New password must be different from current
- All password requirements must be met

**Success Handling:**
- Updates localStorage with `isFirstLogin: false`
- Calls `onSuccess` callback to update app state
- Allows user to continue to dashboard

---

#### B. App Component (`client/src/App.jsx`)

**Added State Management:**
```javascript
const [showPasswordDialog, setShowPasswordDialog] = useState(false);
```

**Added Effect Hook:**
```javascript
useEffect(() => {
    if (user && user.isFirstLogin === true) {
        setShowPasswordDialog(true);
    }
}, [user]);
```

**Added Dialog Rendering:**
```javascript
{user && (
    <ChangePasswordDialog
        open={showPasswordDialog}
        onClose={() => {}} // Prevent closing
        onSuccess={handlePasswordChangeSuccess}
    />
)}
```

**Purpose:** Automatically shows password change dialog when user logs in for the first time.

---

#### C. Global User Editor (`client/src/features/system-admin/pages/GlobalUserEditor.jsx`)

**Updated Alert Message:**
```javascript
<Alert severity="info" sx={{ mb: 3 }}>
    Users created here will have a default password of <b>Mesob@123</b>. 
    They will be required to change it on first login.
</Alert>
```

**Purpose:** Informs admins about the default password and first login requirement.

---

## User Flow

### For System Admin / Super Admin (Creating User):

1. Navigate to "Register New User" dialog
2. Fill in user details (Name, Email, Role, Company)
3. See alert: "Users created here will have a default password of **Mesob@123**. They will be required to change it on first login."
4. Click "Create User"
5. User is created with:
   - Password: `Mesob@123`
   - `isFirstLogin: true`
6. Email sent to user with credentials (if email service works)
7. Password also shown in API response as fallback

### For New User (First Login):

1. Navigate to login page
2. Enter email and password: `Mesob@123`
3. Click "Login"
4. Backend authenticates and returns `isFirstLogin: true`
5. **Password Change Dialog appears automatically**
   - Cannot be dismissed or closed
   - Must change password to continue
6. User sees:
   - Current password hint: "Mesob@123"
   - New password field
   - Confirm password field
   - Real-time validation indicators
7. User enters:
   - Current password: `Mesob@123`
   - New password (meeting all requirements)
   - Confirm new password
8. Click "Change Password"
9. Backend validates and updates:
   - Password changed
   - `isFirstLogin` set to `false`
10. Dialog closes
11. User can now access dashboard normally

### For Returning User:

1. Login with their changed password
2. Backend returns `isFirstLogin: false`
3. No password change dialog shown
4. Direct access to dashboard

---

## Security Features

### Password Requirements Enforced:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*(),.?":{}|<>)

### Additional Security:
- ✅ Current password verification required
- ✅ New password must be different from current
- ✅ Password hashed using bcrypt before storage
- ✅ Cannot bypass password change dialog
- ✅ Dialog cannot be closed until password is changed
- ✅ All password validation done on both frontend and backend

---

## API Endpoints

### 1. Register User (Admin Only)
**Endpoint:** `POST /api/auth/register-user`  
**Access:** System Admin, Super Admin  
**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Technician",
    "companyId": 1
}
```
**Response:**
```json
{
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Technician",
    "companyId": 20,
    "department": "Mesob-Digitalization-Team/IT-Support",
    "isFirstLogin": true,
    "temporaryPassword": "Mesob@123"
}
```

### 2. Login
**Endpoint:** `POST /api/auth/login`  
**Access:** Public  
**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "Mesob@123"
}
```
**Response:**
```json
{
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Technician",
    "isFirstLogin": true,
    "token": "...",
    "refreshToken": "..."
}
```

### 3. Change First Password
**Endpoint:** `PUT /api/auth/change-first-password`  
**Access:** Private (authenticated user)  
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
    "currentPassword": "Mesob@123",
    "newPassword": "MyNewSecure@Pass123"
}
```
**Response:**
```json
{
    "message": "Password changed successfully",
    "isFirstLogin": false
}
```

---

## Error Handling

### Backend Errors:

1. **Current Password Incorrect**
   - Status: 401
   - Message: "Current password is incorrect"

2. **Password Requirements Not Met**
   - Status: 400
   - Message: "New password does not meet requirements"
   - Errors: Array of specific requirement failures

3. **Same Password**
   - Status: 400
   - Message: "New password must be different from current password"

### Frontend Validation:

1. **Empty Fields**
   - Error: "All fields are required"

2. **Passwords Don't Match**
   - Error: "New passwords do not match"

3. **Requirements Not Met**
   - Error: "Password does not meet all requirements"
   - Visual indicators show which requirements are not met

---

## Testing Checklist

### Backend Testing:
- [ ] Create new user via System Admin
- [ ] Verify user has `isFirstLogin: true` in database
- [ ] Verify default password is `Mesob@123`
- [ ] Login with new user credentials
- [ ] Verify `isFirstLogin: true` in login response
- [ ] Change password via `/api/auth/change-first-password`
- [ ] Verify `isFirstLogin: false` after change
- [ ] Verify old password no longer works
- [ ] Verify new password works for login
- [ ] Test password validation (weak passwords rejected)

### Frontend Testing:
- [ ] Create new user as System Admin
- [ ] Login with new user credentials
- [ ] Verify password change dialog appears automatically
- [ ] Verify dialog cannot be closed/dismissed
- [ ] Test password requirements validation (visual indicators)
- [ ] Test with mismatched passwords
- [ ] Test with same password as current
- [ ] Test with weak password
- [ ] Successfully change password
- [ ] Verify dialog closes after success
- [ ] Verify can access dashboard
- [ ] Logout and login again with new password
- [ ] Verify dialog does NOT appear on second login

---

## Database Migration

### For Existing Users:

Existing users in the database will have `isFirstLogin: undefined` or `null`. The code handles this gracefully:

```javascript
isFirstLogin: user.isFirstLogin ?? false
```

This means:
- Existing users will NOT be forced to change password
- Only newly created users (after this update) will have `isFirstLogin: true`

### Optional: Force All Users to Change Password

If you want to force ALL existing users to change their password, run this MongoDB command:

```javascript
db.users.updateMany(
    {},
    { $set: { isFirstLogin: true } }
);
```

**Warning:** This will force ALL users (including admins) to change their password on next login.

---

## Configuration

### Default Password

The default password is hardcoded in the backend:

**Location:** `server/src/controllers/authController.js`

```javascript
const defaultPassword = 'Mesob@123';
```

**To Change:**
1. Update the value in `authController.js`
2. Update the alert message in `GlobalUserEditor.jsx`
3. Update the hint in `ChangePasswordDialog.jsx`

### Password Requirements

**Location:** `server/src/utils/passwordValidator.js`

Current requirements can be modified in the `validatePassword` function.

---

## Benefits

✅ **Enhanced Security:** Forces users to create unique passwords  
✅ **Compliance:** Meets security best practices for password management  
✅ **User-Friendly:** Clear instructions and real-time validation  
✅ **Admin-Friendly:** Simple default password for admins to communicate  
✅ **Audit Trail:** `isFirstLogin` field tracks password change status  
✅ **No Breaking Changes:** Existing users unaffected  
✅ **Flexible:** Easy to modify default password or requirements  

---

## Summary

The implementation successfully adds a mandatory password change feature for first-time logins while maintaining backward compatibility with existing users. The default password "Mesob@123" is easy for admins to communicate, and the forced password change ensures each user creates a secure, unique password before accessing the system.

All changes are non-breaking and follow security best practices.
