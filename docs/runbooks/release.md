# Release and rollback runbook

1. Verify the target is the allowlisted new Supabase project and new deployment project; run secret scan and environment gate.
2. Apply migrations to a fresh rehearsal database, run RLS negative tests, and record migration hashes.
3. Back up the target, deploy backward-compatible source, and keep risky features default-off.
4. Smoke-test public content, D-DAS submit/tracking, admin MFA/authorization, comments, sitemap, health, and security headers.
5. On failure, disable the feature flag or roll back the application while preserving schema compatibility; never revoke an acknowledged D-DAS receipt.
6. Confirm data integrity, communicate status, and record decision owner/request ID.

NO-GO: project-ref mismatch, missing MFA/RLS evidence, private-data leak, failed restore, Critical/High security issue, P0/P1 accessibility defect, or missing operational owner.
