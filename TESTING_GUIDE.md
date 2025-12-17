# Filter Isolation Testing Guide

This guide will help you verify that the filter isolation fix is working correctly.

## Prerequisites
- Two test accounts: one Client and one Admin (or any two different roles)
- Access to browser developer tools (F12)

## Test Case 1: Client to Admin Filter Isolation

### Steps:
1. **Login as Client**
   - Navigate to the login page
   - Login with Client credentials

2. **Apply Filters**
   - On the Client panel, apply some filters (e.g., select Division, District, School)
   - Navigate to different pages to verify filters are working
   - **Open DevTools → Application → Local Storage** and verify you see:
     - Key: `pef_dashboard_filters_client` (or appropriate role name)
     - Value: Your filter selections in JSON format

3. **Logout**
   - Click the Logout button
   - **Verify in DevTools:** The `pef_dashboard_filters_client` key should be removed

4. **Login as Admin**
   - Login with Admin credentials
   - **Expected Result:** No filters should be applied
   - All filter dropdowns should be in their default/empty state
   - **Verify in DevTools:** No filter keys exist yet for admin role

5. **Apply Admin Filters**
   - Apply different filters as Admin
   - **Verify in DevTools:** A new key `pef_dashboard_filters_admin` is created
   - The filter values should be different from what you set as Client

6. **Logout and Login as Client Again**
   - Logout from Admin
   - Login as Client again
   - **Expected Result:** No filters applied (fresh state due to logout clearing)

## Test Case 2: Filter Persistence Within Session

### Steps:
1. **Login as Client**
   - Login with Client credentials

2. **Apply Filters**
   - Select some filters (e.g., Division: "Division A", District: "District 1")

3. **Navigate Between Pages**
   - Click through different pages (Dashboard, Schools, Sessions, etc.)
   - **Expected Result:** Filters should persist across page navigation
   - The same filters should still be applied

4. **Refresh Browser**
   - Press F5 or Ctrl+R to refresh the page
   - **Expected Result:** Filters should still be applied after refresh
   - This verifies localStorage persistence is working

5. **Logout**
   - Click Logout
   - **Expected Result:** All filters cleared

## Test Case 3: Division Role User (Special Case)

### Steps:
1. **Login as Division Role User**
   - Login with Division role credentials
   - **Expected Result:** Division filter should be automatically set and locked
   - You should not be able to change the Division filter

2. **Apply Additional Filters**
   - Select District, Tehsil, or School filters
   - **Verify in DevTools:** Key `pef_dashboard_filters_division_role` should contain:
     - Division: (automatically set, locked)
     - Your additional selections

3. **Logout and Login as Admin**
   - Logout from Division role
   - Login as Admin
   - **Expected Result:** No division lock, all filters available and empty

## Test Case 4: Multiple Browser Tabs

### Steps:
1. **Open Two Browser Tabs**
   - Tab 1: Login as Client
   - Tab 2: Login as Admin (in the same browser, using a different login mechanism if needed, or use incognito for second tab)

2. **Apply Different Filters**
   - Tab 1 (Client): Apply Client-specific filters
   - Tab 2 (Admin): Apply Admin-specific filters

3. **Verify Isolation**
   - **In Tab 1 DevTools:** Check `pef_dashboard_filters_client`
   - **In Tab 2 DevTools:** Check `pef_dashboard_filters_admin`
   - Both should have different values

4. **Refresh Both Tabs**
   - Both tabs should maintain their respective filters

## Verification Checklist

✅ **Filter Isolation**
- [ ] Client filters don't affect Admin filters
- [ ] Admin filters don't affect Client filters
- [ ] Each role has its own localStorage key

✅ **Logout Behavior**
- [ ] All filter keys are removed on logout
- [ ] Next login starts with clean filters
- [ ] No filter carry-over between sessions

✅ **Filter Persistence**
- [ ] Filters persist during navigation within a session
- [ ] Filters persist after page refresh
- [ ] Filters are cleared on logout

✅ **Division Role Special Handling**
- [ ] Division filter is auto-applied for division_role users
- [ ] Division filter is locked (cannot be changed)
- [ ] Other filters work normally for division_role users

✅ **No Errors**
- [ ] No console errors during filter operations
- [ ] No console errors during login/logout
- [ ] No console errors during role switching

## Debugging Tips

If something doesn't work as expected:

1. **Check Browser Console**
   - Open DevTools → Console tab
   - Look for any error messages related to filters or authentication

2. **Check LocalStorage**
   - Open DevTools → Application → Local Storage
   - Verify the correct keys exist with expected values:
     - `pef_dashboard_filters_{role}` - Filter data
     - `pef.accessToken` - Auth token
     - `pef.userRole` - Current user role

3. **Clear Everything and Retry**
   - DevTools → Application → Local Storage → Right-click → Clear
   - Refresh page and login again

4. **Check Network Requests**
   - DevTools → Network tab
   - Filter by "Fetch/XHR"
   - Verify API calls include correct filter parameters

## Expected Behavior Summary

| Scenario | Expected Result |
|----------|----------------|
| Login as Client → Apply filters → Logout → Login as Admin | Admin sees NO filters (fresh state) |
| Login as Admin → Apply filters → Logout → Login as Client | Client sees NO filters (fresh state) |
| Login as Client → Apply filters → Navigate pages | Filters persist across navigation |
| Login as Client → Apply filters → Refresh browser | Filters persist after refresh |
| Login as Client → Apply filters → Logout → Login as Client | Client sees NO filters (logout clears all) |
| Login as division_role → Check division filter | Division is auto-set and locked |

## Success Criteria

The fix is working correctly if:
1. ✅ Each user role maintains separate filter storage
2. ✅ Logout completely clears all filter data
3. ✅ No filter cross-contamination between roles
4. ✅ Filters persist within a session but not across sessions
5. ✅ No console errors or unexpected behavior

---

**Note:** If you encounter any issues during testing, please document:
- The exact steps you took
- The expected behavior
- The actual behavior
- Any console errors
- Screenshot of DevTools showing localStorage state

