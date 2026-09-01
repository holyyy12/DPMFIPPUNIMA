# Requirement traceability baseline

Status values: Implemented, Prepared (code/schema exists but cloud evidence pending), Blocked (requires user-owned environment or operational sign-off).

| Gate | Requirement | Current evidence | Status |
|---|---|---|---|
| AC-01/12 | Dynamic CMS, revisions, approval, schedule, rollback | Schema/migrations and admin surface; fresh Supabase E2E pending | Prepared |
| AC-02 | Featured plus 20+ media, alt/caption/rights/order | Relational media schema and publish guards specified | Prepared |
| AC-03 | Private D-DAS | Independent-secret contract, encrypted separation, sanitized timeline schema | Prepared |
| AC-04/05 | Dynamic units and role boundaries | IAM/unit schema, explicit-deny model, RLS matrix | Prepared |
| AC-06 | Isolated comments/delete-own/moderation | Public create/list/delete-own/report APIs, one-time deletion secret, AAL2 moderation queue, audited moderation RPC, and publication UI; fresh Supabase E2E pending | Prepared |
| AC-07 | URL-state filters | Public navigation/listing foundation | Prepared |
| AC-08 | WCAG 2.2 AA | Semantic/responsive UI baseline; manual SR/reflow evidence pending | Blocked |
| AC-09 | Performance budgets | Production build available; RUM/load window pending | Blocked |
| AC-10/11 | Restore and observability | Runbooks/health surface prepared; cloud dashboards/drill pending | Blocked |
| AC-13 | Security | Environment guard, headers, threat model, Supabase password session, TOTP enrollment/verification, AAL2 admin mutation gate, and RLS source; provisioned-environment and pentest evidence pending | Blocked |
| AC-14 | Legacy isolation | No legacy credentials/import/dual-write; guard enforced | Implemented |
| AC-15 | Period continuity | Period/unit model prepared; rehearsal and sign-off pending | Blocked |

The project must not be described as 100% accepted until all Blocked items have dated evidence and required owners sign off.
