# ORMAWA Units beneath the ORMAWA role

The existing `ormawa` role is retained. BEM, KPRM, HIMAPSI, and other unit
identities are stored separately in `ormawa_units`, not as roles or DPM units.
Super Admin can create/edit units and assign existing ORMAWA users. New ORMAWA
accounts select an active unit; switching role clears incompatible selections.

`user_roles.ormawa_unit_id` and the account reservation carry the assignment
through Auth account creation. Only ORMAWA role assignments may reference these
units, and DPM/ORMAWA unit fields cannot both be populated. Existing unassigned
accounts are preserved and may be assigned through the admin user list.

Unit management requires active Super Admin and `iam.update.all`. Table writes
are RPC-only, audited, and denied to public clients. An ORMAWA user can read its
own assigned unit, not the whole directory. Existing action permissions are not
changed or expanded. This feature identifies organizations; it does not replace
the separate public organization profile or grant ownership of that profile.

No sample units, accounts, roles, or public pages are seeded. Verify using the
rollback-only `tests/integration/ormawa-units.sql` and account creation unit tests.
