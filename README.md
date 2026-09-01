# DPM FIPP UNIMA Digital Institutional Platform

Greenfield implementation based on PRD v3.0 FINAL and MIS v1.0 FINAL. This repository contains the public portal, admin management system, Supabase schema source of truth, security controls, and release evidence.

## Non-negotiable isolation

- Use only a newly created Supabase project owned by the user.
- Never request, inspect, copy, or connect to the legacy DPM Supabase/Auth/Storage/Vercel environment.
- Every remote Supabase command must pass `scripts/assert-project-ref.mjs`.
- Real secrets belong in the deployment secret manager, never in source or `NEXT_PUBLIC_*` variables.
- Non-production data must be synthetic.

## Local verification

Copy `.env.example` to `.env.local`, keep `APP_ENV=local`, and leave placeholders until a new project is provisioned. Run `pnpm check` for environment, migration, type, unit, and production-build gates.

## Current release boundary

The UI is deployable as a private preview. Production data operations remain disabled until the user provisions and allowlists the new Supabase project, enables admin MFA, applies all migrations on a fresh database, and completes the release evidence in `docs/traceability/requirements.md`.
