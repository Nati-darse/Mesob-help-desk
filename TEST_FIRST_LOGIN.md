# Testing First Login Password Change Feature

## Quick Test Guide

### Prerequisites
- Server running on port 5000
- Client running on port 5173
- MongoDB connected
- System Admin account available

---

## Test Scenario 1: Create New User

### Steps:
1. **Login as System Admin**
   - Email: `sysadmin@mesob.com` (or your System Admin email)
   - Password: Your System Admin password

2. **Navigate to User Management**
   - Go to: `/sys-admin/users`
   - Or click "Global User Directory" from System Admin dashboard

3. **Click "Register New User"**
   - Dialog should open

4. **Verify Default Password Message**
   - Should see alert: "Users created here will have a default password of **Mesob@123**. They will be required to change it on first login."

5. **Fill in User Details**
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Role: Select any role (e.g., "Team Lead")
   - Company: Select a company (auto-selected for IT roles)

6. **Click "Create User"**
   - User should be created successfully
   - Check console/network tab for response
   - Should see `isFirstLogin: true` in response

---

## Test Scenario 2: First Login & Password Change

### Steps:
1. **Logout from System Admin**
   - Click profile menu → Logout

2. **Login with New User**
   - Email: `testuser@example.com`
   - Password: `Mesob@123`
   - Click "Login"

3. **Verify Password Change Dialog Appears**
   - Dialog should appear automatically
   - Cannot be closed by clicking outside
   - Cannot be closed with ESC key
   - No close button visible

4. **Verify Dialog Content**
   - Title: "Change Your Password"
   - Alert showing: "Your current password is: **Mesob@123**"
   - Three input fields visible:
     - Current Password
     - New Password
     - Confirm New Password
   - Password requirements list visible

5. **Test Invalid Inputs**

   **Test A: Empty Fields**
   - Leave all fields empty
   - Button should be disabled

   **Test B: Wrong Current Password**
   - Current Password: `WrongPassword`
   - New Password: `NewSecure@Pass123`
   - Confirm: `NewSecure@Pass123`
   - Click "Change Password"
   - Should show error: "Current password is incorrect"

   **Test C: Passwords Don't Match**
   - Current Password: `Mesob@123`
   - New Password: `NewSecure@Pass123`
   - Confirm: `DifferentPass@456`
   - Should show error: "New passwords do not match"

   **Test D: Same as Current**
   - Current Password: `Mesob@123`
   - New Password: `Mesob@123`
   - Confirm: `Mesob@123`
   - Should show error: "New password must be different from current password"

   **Test E: Weak Password (No Uppercase)**
   - Current Password: `Mesob@123`
   - New Password: `weakpass123!`
   - Confirm: `weakpass123!`
   - Requirements list should show red X for "Contains uppercase letter"
   - Should show error: "Password does not meet all requirements"

   **Test F: Weak Password (No Special Character)**
   - Current Password: `Mesob@123`
   - New Password: `WeakPass123`
   - Confirm: `WeakPass123`
   - Requirements list should show red X for "Contains special character"

   **Test G: Weak Password (Too Short)**
   - Current Password: `Mesob@123`
   - New Password: `Pass@1`
   - Confirm: `Pass@1`
   - Requirements list should show red X for "At least 8 characters"

6. **Test Valid Password Change**
   - Current Password: `Mesob@123`
   - New Password: `MyNewSecure@Pass123`
   - Confirm: `MyNewSecure@Pass123`
   - All requirements should show green checkmarks
   - Click "Change Password"
   - Should show success
   - Dialog should close
   - Should be redirected to appropriate dashboard

7. **Verify Dashboard Access**
   - Should see dashboard for user's role
   - No password dialog should appear

---

## Test Scenario 3: Second Login (No Password Change Required)

### Steps:
1. **Logout**
   - Click profile menu → Logout

2. **Login Again with New Password**
   - Email: `testuser@example.com`
   - Password: `MyNewSecure@Pass123` (the new password you set)
   - Click "Login"

3. **Verify No Password Dialog**
   - Should login successfully
   - Password change dialog should NOT appear
   - Should go directly to dashboard

4. **Verify Old Password Doesn't Work**
   - Logout again
   - Try to login with old password: `Mesob@123`
   - Should show error: "Invalid credentials"

---

## Test Scenario 4: Database Verification

### Using MongoDB Compass or CLI:

1. **Find the Test User**
   ```javascript
   db.users.findOne({ email: "testuser@example.com" })
   ```

2. **Verify Fields**
   - `isFirstLogin` should be `false` (after password change)
   - `password` should be a hashed string (not plain text)
   - Password hash should be different from initial hash

3. **Before Password Change** (if you check immediately after creation):
   - `isFirstLogin` should be `true`

---

## Test Scenario 5: Multiple Users

### Steps:
1. **Create Multiple Users**
   - Create 3-5 test users with different roles
   - All should have default password `Mesob@123`

2. **Login with Each User**
   - Each should be forced to change password
   - Each can set different password

3. **Verify Independence**
   - Password change for one user doesn't affect others
   - Each user maintains their own `isFirstLogin` status

---

## Test Scenario 6: Existing Users (Backward Compatibility)

### Steps:
1. **Login with Existing User**
   - Use a user created BEFORE this update
   - Should login normally
   - Password change dialog should NOT appear
   - `isFirstLogin` will be `undefined` or `false`

2. **Verify No Disruption**
   - Existing users can continue using their current passwords
   - No forced password change for existing users

---

## Test Scenario 7: Admin Creating Multiple Roles

### Test Each Role:

1. **Create Technician**
   - Should auto-assign to Company ID 20
   - Company dropdown should be disabled
   - Alert: "IT roles are automatically assigned to Digitalization Bureau"

2. **Create Admin**
   - Should auto-assign to Company ID 20
   - Company dropdown should be disabled

3. **Create Team Lead**
   - Company dropdown should be enabled
   - Can select any company

4. **Login with Each**
   - All should be forced to change password
   - All should have default password `Mesob@123`

---

## Expected Results Summary

### ✅ Success Criteria:

1. **User Creation:**
   - [x] Default password is `Mesob@123`
   - [x] `isFirstLogin` is `true`
   - [x] Email sent with credentials (if email service configured)
   - [x] Password shown in API response as fallback

2. **First Login:**
   - [x] Password change dialog appears automatically
   - [x] Dialog cannot be dismissed
   - [x] Current password hint shown
   - [x] Real-time validation works
   - [x] All password requirements enforced

3. **Password Change:**
   - [x] Current password verified
   - [x] New password validated
   - [x] Cannot use same password
   - [x] `isFirstLogin` set to `false`
   - [x] User can access dashboard after change

4. **Subsequent Logins:**
   - [x] No password dialog shown
   - [x] New password works
   - [x] Old password rejected

5. **Security:**
   - [x] Password hashed in database
   - [x] All requirements enforced
   - [x] Cannot bypass password change

6. **Backward Compatibility:**
   - [x] Existing users unaffected
   - [x] No breaking changes

---

## Troubleshooting

### Issue: Password Dialog Doesn't Appear

**Check:**
1. User has `isFirstLogin: true` in database
2. Login response includes `isFirstLogin: true`
3. `localStorage` or `sessionStorage` has correct user data
4. No JavaScript errors in console

**Fix:**
- Clear browser cache and localStorage
- Check network tab for login response
- Verify backend is returning `isFirstLogin` field

### Issue: Cannot Change Password

**Check:**
1. Current password is correct (`Mesob@123`)
2. New password meets all requirements
3. Passwords match
4. Network request succeeds (check Network tab)

**Fix:**
- Check backend logs for errors
- Verify `/api/auth/change-first-password` endpoint exists
- Check authentication token is valid

### Issue: Dialog Can Be Closed

**Check:**
1. `onClose` prop is set to empty function: `onClose={() => {}}`
2. `disableEscapeKeyDown` prop is set
3. No custom close handlers interfering

**Fix:**
- Review `ChangePasswordDialog.jsx` props
- Ensure dialog is rendered conditionally based on `isFirstLogin`

---

## Performance Testing

### Load Test:
1. Create 10+ users rapidly
2. All should have default password
3. All should be forced to change password on first login

### Concurrent Test:
1. Have multiple users login simultaneously
2. Each should see their own password change dialog
3. No interference between users

---

## Security Testing

### Penetration Test:
1. Try to bypass password change by:
   - Manually navigating to dashboard URL
   - Modifying localStorage
   - Tampering with API requests
2. All attempts should fail
3. User should remain on password change dialog

### Password Strength Test:
1. Try various weak passwords
2. All should be rejected
3. Only strong passwords should be accepted

---

## Cleanup

After testing, you can:

1. **Delete Test Users:**
   ```javascript
   db.users.deleteMany({ email: /testuser/ })
   ```

2. **Reset Test User Password:**
   ```javascript
   db.users.updateOne(
       { email: "testuser@example.com" },
       { $set: { isFirstLogin: true } }
   )
   ```

---

## Test Checklist

- [ ] Create new user as System Admin
- [ ] Verify default password message in UI
- [ ] Login with new user (default password)
- [ ] Verify password change dialog appears
- [ ] Test invalid password inputs
- [ ] Successfully change password
- [ ] Verify dialog closes
- [ ] Access dashboard
- [ ] Logout and login with new password
- [ ] Verify no password dialog on second login
- [ ] Verify old password doesn't work
- [ ] Check database for `isFirstLogin: false`
- [ ] Test with existing user (no forced change)
- [ ] Test with multiple roles
- [ ] Test concurrent users
- [ ] Test security (cannot bypass)

---

## Success!

If all tests pass, the first login password change feature is working correctly! 🎉
