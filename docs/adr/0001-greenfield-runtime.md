# ADR-0001 — Greenfield runtime and isolation

Status: Accepted for implementation; production provisioning pending user authorization.

## Decision

PRD v3.0 remains the WHAT authority and MIS v1.0 the HOW authority. Supabase migrations in this repository are the only database schema source. No legacy DPM database, Auth tenant, Storage bucket, Vercel project, key, dump, or importer may be accessed.

The current Sites/Vinext deployment is a private preview surface, not evidence that the mandated new Vercel/Supabase production environment is complete. Production release requires a newly provisioned, allowlisted Supabase project and a new Vercel project.

## Consequences

Remote operations abort unless URL ref, expected ref, and requested ref match. UI may remain available while data mutations report unavailable until the new backend is configured. This is preferable to unsafe browser storage or silent connection to an unverified project.
