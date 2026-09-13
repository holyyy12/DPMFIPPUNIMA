# Admin login with email and password

Date: 2026-09-12. Status: accepted by the site owner.

The owner's latest decision replaces the earlier mandatory MFA/AAL2 requirement
in the PRD/MIS baseline. Admins enter the portal after Supabase verifies their
email/password credentials. The application no longer enrolls or challenges TOTP.
The legacy MFA page redirects to the dashboard and the retired API returns 410.

An active, undeleted profile and a currently active assigned role are required.
Action-specific permissions, scoped D-DAS access, RLS, Super Admin-only directory
operations, and audit records remain enforced. Neither user metadata nor a
client-supplied role is trusted for authorization. No authentication token is
rewritten to pretend that a second factor was verified.

Existing Supabase MFA enrollments are not deleted, but are not required by this
application. Losing the second factor reduces protection against stolen
passwords; use unique, strong passwords and revoke compromised sessions.

Verification: `tests/integration/password-admin.sql`, the password-only
`admin-editing.sql` integration checks, and `public-comments.sql` (wrapped in a
rollback transaction). These checks do not replace a real interactive login test.
