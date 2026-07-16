# Migration Policy — Schema Freeze (effective PR1)

Production operations and instant rollbacks depend on one discipline:
**the running application version N-1 must always work against schema version N.**

## Rules
1. **Additive only.** New tables, new nullable columns, new enum values, new indexes. Nothing else.
2. **No renames.** Not tables, not columns, not enums. Need a better name? Add the new one,
   dual-write, migrate reads, deprecate the old in docs — remove only in a major version with
   a standalone, scheduled migration.
3. **No drops** outside a major version cleanup that follows a full deprecation cycle.
4. **New columns are nullable or defaulted.** Old code inserting rows must keep working.
5. **No breaking API changes.** New fields in responses are fine; removing/renaming fields or
   changing types requires a new endpoint version.
6. **Rollback = redeploy old app, keep new schema.** Down-migrations are never run in
   production; they exist only for local development.
7. Every migration PR states: "Old app version against this schema: works because ___."

## Precedent already set
`points` displays as "Vertical Meters" without a rename; ACCEPTED/QUALITY_CHECK were added as
enum values without touching existing ones; guest fields were added nullable. Keep it that way.
