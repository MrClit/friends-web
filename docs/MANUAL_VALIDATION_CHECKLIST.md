# Profile Feature – Manual Validation Checklist

**Objective:** Verify Profile implementation works end-to-end  
**Duration:** ~30-40 minutes  
**Prerequisites:** Backend running on localhost:3000, Frontend on localhost:5173, Google OAuth configured

---

## Pre-Flight Setup

1. **Backend Running:**

   ```bash
   cd apps/backend
   pnpm dev
   # Should see: [Nest] listening on port 3000
   ```

2. **Frontend Running:**

   ```bash
   cd apps/frontend
   pnpm dev
   # Should see: VITE v... ready in ... ms
   ```

3. **Test User Accounts:**
   - Google account with email (primary test account)
   - Note the account's current display name from Google (e.g., "John Doe")

4. **Database State:**
   - Ensure test user exists or will be auto-created on first Google login
   - Clear browser localStorage to remove stale auth tokens (optional but clean)

---

## Test Case 1: Google Login + Initial Profile Load

**Objective:** Verify that first-time Google login seeds user profile with Google name and timestamps

**Steps:**

1. Open http://localhost:5173 in private/incognito browser window
2. Click "Login with Google"
3. Complete Google OAuth flow
4. Verify redirect to Home page
5. Click Header user avatar → See dropdown with name and email
   - ✅ Name should show Google's display name
   - ✅ Email should match Google account

**Expected Result:**

- User logged in with Google name populated
- No console errors
- JWT token visible in Application tab → Local Storage → `token`

**Pass/Fail:** **\_\_\_**

---

## Test Case 2: Access Profile Page

**Objective:** Verify Profile page loads and displays full profile

**Steps:**

1. From Home page, click Header user avatar → "Profile" (or navigate directly to /#/profile)
2. Profile page should load with:
   - Avatar section (current avatar or initials fallback)
   - Two buttons: "Choose photo" and "Take photo"
   - Name field (populated with current name)
   - Email field (grayed out, readonly)
   - Role badge (e.g., "USER")
   - "Member since" date (createdAt formatted)
   - "Last updated" date (updatedAt formatted)
   - "Save" button

**Expected Result:**

- All fields visible and properly formatted
- No layout shifts or overflow
- Responsive on mobile (avatar left, form right on desktop; stacked on mobile)
- No console errors

**Pass/Fail:** **\_\_\_**

---

## Test Case 3: Edit Name + Save

**Objective:** Verify user can edit name and save changes

**Steps:**

1. In Profile, locate Name field
2. Clear current text
3. Type new name: "Custom Name for Testing"
4. Verify "Save" button is not disabled
5. Click "Save"
6. Verify toast appears: "Profile updated successfully" (or translated equivalent)
7. Verify Name field still shows "Custom Name for Testing"

**Expected Result:**

- API call succeeds (check Network tab: PATCH /api/users/me returns 200)
- Toast feedback shown
- No console errors
- Button re-enables after save

**Pass/Fail:** **\_\_\_**

---

## Test Case 4: Edit Name + Verify Header Reflects Change

**Objective:** Verify Header avatar/name immediately updates after Profile save

**Steps:**

1. From previous test, name is now "Custom Name for Testing"
2. Click "Close Profile" or navigate to Home
3. Verify Header shows updated name: "Custom Name for ..."
4. Avatar/initials still correct (should show first letter of new name if applicable)

**Expected Result:**

- Header name matches Profile name
- No refresh required (optimistic update working)
- Cache invalidation occurred

**Pass/Fail:** **\_\_\_**

---

## Test Case 5: Google Re-Login + Name Preservation (CRITICAL)

**Objective:** Verify custom name persists when re-logging in with Google

**Steps:**

1. From Home, click "Sign out"
2. Confirm redirect to login page
3. Click "Login with Google"
4. Complete OAuth (should use same Google account as before)
5. Redirect to Home
6. Open Profile again
7. Check Name field

**Expected Result:**

- Name field shows "Custom Name for Testing" (NOT overwritten by Google's display name)
- This is the **critical business rule fix**: custom names survive re-login
- If Google's display name is different from custom name, custom name wins

**Pass/Fail:** **\_\_\_**

---

## Test Case 6: Avatar Upload from Gallery

**Objective:** Verify avatar file selection, preview, and upload

**Steps:**

1. Go to Profile
2. Click "Choose photo" button
3. Select a JPG or PNG file from your device (any image, ~2 MB or smaller)
4. Verify preview appears on screen (shows selected image)
5. Verify "Save" button is now active (not disabled)
6. Click "Save"
7. Verify toast: "Profile updated successfully"
8. Verify Header avatar changes to new image (not initials fallback)

**Expected Result:**

- File picker opens
- Preview renders immediately
- API call succeeds (Network: PATCH /api/users/me)
- Header updates without refresh
- No console errors

**Note:** If no Cloudinary credentials set, file won't persist but preview should work. Check backend logs for warnings about Cloudinary being disabled.

**Pass/Fail:** **\_\_\_**

---

## Test Case 7: Avatar Upload from Camera (Mobile/Simulator)

**Objective:** Verify camera capture works on mobile

**Steps:**

1. Access app on mobile device or browser simulator (Mobile Safari or Chrome DevTools)
2. Go to Profile
3. Click "Take photo" button
4. Native camera app should open (on mobile) or file picker should show camera option
5. Take a photo
6. Auto-return to Profile with preview
7. Click "Save"
8. Verify avatar updates

**Expected Result:**

- Camera intent triggered (or camera option in picker available)
- Photo captured and previewed
- Save succeeds
- Header avatar updated

**Note:** Desktop browsers may not support `capture="user"` — falls back to file picker, which is acceptable.

**Pass/Fail:** **\_\_\_**

---

## Test Case 8: Email & Role Readonly (Security Check)

**Objective:** Verify email and role cannot be modified

**Steps:**

1. In Profile, attempt to click on Email field → should be disabled/readonly
2. Open browser DevTools → Console
3. Paste:
   ```javascript
   document.querySelector('input[name="email"]').disabled;
   // Should return: true
   ```
4. Check Role display (should be badge or text, not input field)
5. Manually edit FormData request in DevTools (next save):
   ```javascript
   // Before save, intercept and add email field
   formData.append('email', 'hacker@evil.com');
   ```
6. Save and verify server rejects (or ignores email field) — user's email unchanged

**Expected Result:**

- Email field truly disabled (cannot type, tab, focus)
- No email sent in PATCH request
- Server-side validation drops any email/role fields
- User cannot change email or role via this endpoint

**Pass/Fail:** **\_\_\_**

---

## Test Case 9: Cache Invalidation + Participant Selector Sync

**Objective:** Verify participant pickers and admin tables reflect name changes

**Steps:**

1. Change name in Profile to "New Name"
2. Save
3. Navigate to event creation or edit
4. Open participant selector (Typeahead/autocomplete)
5. Search for user by name: "New Name"
6. Verify updated name appears in autocomplete list

**Alternative (if admin):**

1. Go to Admin → Users
2. Verify user's name in table is updated to "New Name"
3. No page refresh required

**Expected Result:**

- Participant selector shows updated name
- Admin table (if applicable) shows updated name
- React Query cache invalidation working
- No stale data lingering

**Pass/Fail:** **\_\_\_**

---

## Test Case 10: Logout + Re-Access Profile (Auth Guard)

**Objective:** Verify Profile page is protected

**Steps:**

1. In Profile, manually clear auth token:
   - DevTools → Application → Local Storage → remove `token`
2. Refresh page Or navigate away and back to /#/profile
3. Should redirect to login page

**Expected Result:**

- Automatic redirect to login (no access to Profile without token)
- Network request to GET /api/users/me fails with 401
- Protected route guard working

**Pass/Fail:** **\_\_\_**

---

## Test Case 11: Error Handling + Retry

**Objective:** Verify Profile handles errors gracefully

**Steps:**

1. In Profile, throttle network to "Slow 3G" (DevTools → Network tab)
2. Click "Save" with any changes
3. Verify request times out or fails
4. Verify error toast appears (or error message)
5. Verify "Save" button re-enables
6. Restore network speed
7. Click "Save" again → should succeed

**Expected Result:**

- Error handling toast displayed
- Form remains editable (not locked in error state)
- User can retry without page reload

**Pass/Fail:** **\_\_\_**

---

## Test Case 12: Memory Cleanup (Avatar Preview)

**Objective:** Verify ObjectURL cleanup on unmount (avoiding memory leaks)

**Steps:**

1. In Profile, select an avatar file → preview shows
2. Open DevTools → Memory tab → Take heap snapshot
3. Leave Profile (navigate away)
4. Take another heap snapshot
5. Compare: ObjectURL should be released (no dangling blob URLs)

**Expected Result:**

- No unclaimed memory attributed to avatar preview
- ObjectURL properly revoked on unmount

**Note:** This is a developer/performance test. Acceptable to skip in basic validation.

**Pass/Fail:** **\_\_\_**

---

## Test Case 13: File Size Validation

**Objective:** Verify oversized files are rejected

**Steps:**

1. Create a dummy image >5 MB (e.g., 10 MB)
2. Try to upload in Profile
3. Observe:
   - Browser validator (might block before upload) OR
   - Server rejects with 400 Bad Request
   - Error toast: "File too large" or similar

**Expected Result:**

- Files >5 MB are rejected
- User-friendly error message
- Form not locked

**Pass/Fail:** **\_\_\_**

---

## Test Case 14: MIME Type Validation

**Objective:** Verify non-image files are rejected

**Steps:**

1. Try to upload a `.txt`, `.pdf`, or `.zip` file
2. Observe:
   - Browser validator (file input accept="image/\*") OR
   - Server rejects with 400 Bad Request
   - Error message about invalid file type

**Expected Result:**

- Only image MIME types accepted (JPEG, PNG, WebP, GIF, HEIC, HEIF)
- Non-image files rejected
- User-friendly error

**Pass/Fail:** **\_\_\_**

---

## Test Case 15: Internationalization (i18n)

**Objective:** Verify Profile page appears in correct language

**Steps:**

1. In Header, switch language (if language picker exists)
2. Reload Profile page
3. Verify:
   - "Profile" title in correct language
   - "Member since" label translated
   - "Last updated" label translated
   - Button labels translated
   - Toast messages translated

**Languages to check:** Spanish (es, default), English (en), Catalan (ca)

**Expected Result:**

- All i18n keys present and not showing `undefined`
- Translations appear correctly
- No English fallback unless intentional

**Pass/Fail:** **\_\_\_**

---

## Post-Testing Checklist

- [ ] All 15 test cases completed
- [ ] No console errors or warnings (except expected Cloudinary warnings if disabled)
- [ ] No TypeScript errors in DevTools
- [ ] Backend test suite still passing: `pnpm test`
- [ ] Frontend test suite still passing: `pnpm test`
- [ ] No performance regressions (Profile page loads <2s)

---

## Regression Checklist (Core Features Should Still Work)

- [ ] Home page loads and lists events
- [ ] Event detail page loads and displays participants
- [ ] Create event with participants (uses cache-invalidated user list)
- [ ] Admin users page (if applicable) shows updated users
- [ ] Logout and re-login works
- [ ] Participant selector autocomplete works

---

## Summary

**Total Test Cases:** 15  
**Passed:** **_ / 15  
**Failed:** _** / 15  
**Skipped:** \_\_\_ / 15

**Critical Path (Must Pass):**

- Test Case 1 (Google login)
- Test Case 5 (Name preservation re-login) ⭐
- Test Case 6 (Avatar upload)
- Test Case 10 (Auth guard)

**Optional/Performance Tests:**

- Test Case 12 (Memory cleanup)

---

**Validation Date:** ****\_\_****  
**Validator Name:** ****\_\_****  
**Notes:** **********************\_**********************
