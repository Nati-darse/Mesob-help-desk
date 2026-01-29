# Account Creation Process - System Admin & Super Admin

## Overview
This document provides detailed information about how System Admins and Super Admins create user accounts in the MESOB Help Desk system.

---

## Table of Contents
1. [User Roles & Permissions](#user-roles--permissions)
2. [Account Creation Interface](#account-creation-interface)
3. [Backend Registration Process](#backend-registration-process)
4. [Password Management](#password-management)
5. [Company Assignment Rules](#company-assignment-rules)
6. [Email Notifications](#email-notifications)
7. [Account Management Features](#account-management-features)
8. [Security & Audit Trail](#security--audit-trail)

---

## User Roles & Permissions

### Available Roles
The system supports 6 user roles with different permission levels:

1. **Worker** - Basic employee role
2. **Team Lead** - Department/team management role
3. **Technician** - IT support technician
4. **Admin** - Company administrator
5. **Super Admin** - Multi-company administrator
6. **System Admin** - Global system administrator

### Who Can Create Accounts?
- **System Admin**: Can create ALL user types across ALL companies
- **Super Admin**: Can create users within their scope (implementation may vary)

---

## Account Creation Interface

### Location
**Frontend Component**: `client/src/features/system-admin/pages/GlobalUserEditor.jsx`

### Access Path
1. System Admin logs in
2. Navigates to System Admin Dashboard
3. Clicks "Global User Directory" or "User Management"
4. Clicks "Register New User" button

### Registration Form Fields

#### 1. **Full Name** (Required)
- Text input field
- User's complete name
- Example: "John Doe"

#### 2. **Email Address** (Required)
- Email input field
- Must be unique in the system
- Used for login credentials
- Example: "john.doe@example.com"

#### 3. **Role** (Required)
- Dropdown selection
- Available options:
  - Administrator
  - IT Technician
  - Team Lead
- Default: None (must be selected)

#### 4. **Organization / Company** (Conditional)
- Dropdown selection
- Lists all 24+ companies/bureaus in the system
- **Auto-disabled** for IT roles (Admin, Technician)
- **Required** for non-IT roles (Team Lead, Worker)

---

## Backend Registration Process

### API Endpoint
**Route**: `POST /api/auth/register-user`  
**Controller**: `server/src/controllers/authController.js`  
**Access**: Private (Admin only)

### Step-by-Step Process

#### Step 1: Validation
```javascript
// Check if email already exists
const userExists = await User.findOne({ email });
if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
}
```

#### Step 2: Role Assignment
```javascript
const finalRole = role || 'Worker';
```

#### Step 3: Company Assignment Logic
```javascript
const mesobRoles = ['Technician', 'Admin', 'Super Admin', 'System Admin'];
let userCompanyId = companyId || 1;
let userDept = 'General';

// IT roles MUST be assigned to Company ID 20 (Digitalization Bureau)
if (mesobRoles.includes(finalRole)) {
    userCompanyId = 20;
    userDept = 'Mesob-Digitalization-Team/IT-Support';
}
```

#### Step 4: Password Generation
```javascript
// Generate secure random password
const generatedPassword = generateSecurePassword();
```

**Password Requirements** (from `server/src/utils/passwordValidator.js`):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Example Generated Password**: `Mesob@2024Xk9`

#### Step 5: User Creation
```javascript
const user = await User.create({
    name,
    email,
    password: generatedPassword, // Will be hashed by pre-save hook
    role: finalRole,
    companyId: userCompanyId,
    department: userDept
});
```

#### Step 6: Password Hashing
The User model has a pre-save hook that automatically hashes passwords:

```javascript
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});
```

---

## Password Management

### Default Password
- **NOT** a static default like "Mesob@123"
- **Dynamically generated** using `generateSecurePassword()`
- Each user gets a unique, secure password

### Password Delivery Methods

#### 1. Email Notification (Primary)
```javascript
await sendEmail(
    user.email,
    'Your Mesob Help Desk Account',
    `Hello ${user.name}, your account has been created. 
     Your temporary password is: ${generatedPassword}. 
     Please change it after your first login.`,
    // HTML version with formatting
);
```

#### 2. API Response (Fallback)
If email fails, the password is included in the API response:
```javascript
res.status(201).json({
    ...user.toObject(),
    temporaryPassword: generatedPassword // Fallback if email fails
});
```

### Password Reset
Users are instructed to change their password after first login for security.

---

## Company Assignment Rules

### Automatic Assignment for IT Roles

**Rule**: All IT-related roles are automatically assigned to **Company ID 20** (Digitalization Bureau)

**Affected Roles**:
- Technician
- Admin
- Super Admin
- System Admin

**Department**: `Mesob-Digitalization-Team/IT-Support`

**Frontend Behavior**:
```javascript
const handleRoleChange = (role) => {
    const isITRole = role === ROLES.ADMIN || role === ROLES.TECHNICIAN;
    setRegFormData({ 
        ...regFormData, 
        role, 
        companyId: isITRole ? 19 : regFormData.companyId
    });
};
```

**UI Indication**:
- Company dropdown is **disabled** for IT roles
- Alert message displays: "IT roles are automatically assigned to Digitalization Bureau"

### Manual Assignment for Non-IT Roles

**Roles**:
- Team Lead
- Worker

**Process**:
- Admin selects company from dropdown
- Can choose from all 24+ companies/bureaus
- Company dropdown remains **enabled**

---

## Email Notifications

### Welcome Email Template

**Subject**: "Your Mesob Help Desk Account"

**Plain Text Version**:
```
Hello [Name],

Your account has been created.
Your temporary password is: [Generated Password]

Please change it after your first login.
```

**HTML Version**:
```html
<h2>Welcome to Mesob Help Desk</h2>
<p>Hello <b>[Name]</b>,</p>
<p>Your account has been created as a <b>[Role]</b>.</p>
<p><b>Temporary Password:</b> <code>[Generated Password]</code></p>
<p><b>Important:</b> Please change your password after your first login for security.</p>
```

### Email Service
- Uses `sendEmail()` from `server/src/services/notificationService.js`
- Non-blocking operation (doesn't fail user creation if email fails)
- Errors are logged but don't prevent account creation

---

## Account Management Features

### Available Actions (Post-Creation)

#### 1. **Suspend Account**
- **Icon**: Block icon (🚫)
- **Action**: Temporarily disable user access
- **Requires**: Reason for suspension
- **Logged**: Yes, in audit trail
- **Restriction**: Cannot suspend System Admin accounts

#### 2. **Activate Account**
- **Icon**: Check circle icon (✓)
- **Action**: Re-enable suspended account
- **Requires**: No reason needed
- **Logged**: Yes, in audit trail

#### 3. **Reset Password**
- **Icon**: Key icon (🔑)
- **Action**: Generate new temporary password
- **Requires**: Reason for reset
- **Logged**: Yes, in audit trail
- **Restriction**: Cannot reset System Admin passwords

#### 4. **Delete Account**
- **Icon**: Delete icon (🗑️)
- **Action**: Permanently remove user
- **Requires**: Detailed reason
- **Logged**: Yes, in audit trail
- **Warning**: Permanent and cannot be undone
- **Restriction**: Cannot delete System Admin accounts

#### 5. **View History**
- **Icon**: History icon (📜)
- **Action**: View user's activity log
- **Requires**: No reason needed
- **Shows**: Login history, actions performed, etc.

#### 6. **Edit Role**
- **Icon**: Edit icon (✏️)
- **Action**: Change user's role
- **Warning**: Immediately affects permissions
- **Logged**: Yes, in audit trail

#### 7. **Impersonate User**
- **Icon**: Login icon (🔐)
- **Action**: Log in as the selected user
- **Purpose**: Troubleshooting, testing
- **Requires**: Confirmation dialog
- **Logged**: Yes, with full audit trail
- **Restriction**: Cannot impersonate other System Admins
- **Security**: Creates audit log with admin details

---

## Security & Audit Trail

### Audit Logging

All administrative actions are logged in the `AuditLog` collection:

```javascript
await AuditLog.create({
    action: 'IMPERSONATE', // or 'CREATE_USER', 'SUSPEND', etc.
    performedBy: req.user._id,
    targetUser: user._id,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    metadata: {
        adminName: req.user.name,
        adminEmail: req.user.email,
        targetName: user.name,
        targetEmail: user.email,
        targetRole: user.role,
        reason: reason // For actions requiring justification
    }
});
```

### Logged Actions
- User creation
- Role changes
- Account suspension/activation
- Password resets
- Account deletion
- User impersonation
- Permission changes

### Security Features

1. **Password Strength Enforcement**
   - Minimum 8 characters
   - Mixed case required
   - Numbers required
   - Special characters required

2. **Email Uniqueness**
   - Prevents duplicate accounts
   - Validated at database level

3. **Role-Based Access Control**
   - Only System Admins can create users
   - Certain actions restricted (e.g., can't delete System Admins)

4. **Audit Trail**
   - All actions logged with timestamp
   - IP address and user agent captured
   - Reason required for sensitive actions

5. **Impersonation Tracking**
   - Full audit log of who impersonated whom
   - Console logging for security monitoring
   - Cannot impersonate System Admins

---

## User Model Schema

### Database Fields

```javascript
{
    name: String (required),
    email: String (required, unique),
    password: String (required, hashed, min 6 chars),
    role: Enum ['Worker', 'Technician', 'Team Lead', 'Admin', 'System Admin', 'Super Admin'],
    department: String (default: ''),
    companyId: Number (required, default: 1),
    isAvailable: Boolean (default: true),
    dutyStatus: Enum ['Online', 'On-Site', 'Break', 'Offline'] (default: 'Online'),
    phone: String (default: ''),
    profilePic: String (default: ''),
    createdAt: Date (auto-generated)
}
```

### Default Values
- **role**: 'Worker'
- **companyId**: 1
- **isAvailable**: true
- **dutyStatus**: 'Online'
- **department**: '' (or auto-assigned for IT roles)

---

## Frontend Components

### Main Components

1. **GlobalUserEditor.jsx**
   - User directory table
   - Registration dialog
   - Role editing dialog
   - Filtering by company
   - User impersonation

2. **AccountManagement.jsx**
   - Account status management
   - Suspend/activate accounts
   - Password reset
   - Account deletion
   - Activity history
   - Filtering by status and company

3. **MasterUserTable.jsx**
   - Comprehensive user listing
   - Advanced filtering
   - Search functionality
   - Export to CSV
   - Pagination

---

## API Endpoints Summary

### User Creation & Management

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/api/auth/register-user` | POST | Create new user | System Admin |
| `/api/users/global` | GET | Get all users | System Admin |
| `/api/users/:id/role` | PUT | Update user role | System Admin |
| `/api/auth/impersonate` | POST | Impersonate user | System Admin |
| `/api/users/:id/account-action` | POST | Account actions (suspend, etc.) | System Admin |

---

## Best Practices

### For System Admins

1. **Always provide detailed reasons** for account actions
2. **Verify email addresses** before creating accounts
3. **Inform users** when their accounts are created
4. **Use impersonation sparingly** and only for troubleshooting
5. **Review audit logs regularly** for security monitoring
6. **Ensure proper role assignment** based on user responsibilities
7. **Follow up** to ensure users change their temporary passwords

### Security Recommendations

1. **Never share temporary passwords** via insecure channels
2. **Encourage immediate password changes** after first login
3. **Monitor failed login attempts** for compromised accounts
4. **Review user permissions periodically**
5. **Disable accounts** for inactive users
6. **Document reasons** for all administrative actions

---

## Troubleshooting

### Common Issues

#### 1. Email Not Received
- **Cause**: Email service failure
- **Solution**: Password is included in API response as fallback
- **Action**: Manually share password with user securely

#### 2. User Already Exists
- **Cause**: Email address already registered
- **Solution**: Use different email or check if user needs reactivation

#### 3. Company Assignment Error
- **Cause**: IT role selected but company manually changed
- **Solution**: System auto-corrects to Company ID 20 for IT roles

#### 4. Cannot Impersonate User
- **Cause**: Trying to impersonate System Admin
- **Solution**: System Admins cannot impersonate each other for security

---

## Summary

The account creation process in MESOB Help Desk is designed with security and automation in mind:

✅ **Secure password generation** - Unique, strong passwords for each user  
✅ **Automatic company assignment** - IT roles go to Digitalization Bureau  
✅ **Email notifications** - Users receive credentials automatically  
✅ **Comprehensive audit trail** - All actions logged for security  
✅ **Role-based restrictions** - Prevents unauthorized actions  
✅ **Flexible management** - Full account lifecycle management  

The system ensures that user creation is both secure and efficient, with proper safeguards and logging at every step.
