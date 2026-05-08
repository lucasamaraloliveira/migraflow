# Security Specification for MigraFlow

## Data Invariants
1. A migration must be associated with a valid existing client.
2. Only authenticated users can read or write data.
3. Timestamps `createdAt` and `updatedAt` must be set by the server.
4. `clientId` in a migration must not be changed after creation.

## The Dirty Dozen (Test Payloads)
1. Unauthenticated write to `clients`.
2. Write to `clients` with 1MB string in `name`.
3. Unauthenticated read from `migrations`.
4. Create `migration` with non-existent `clientId`.
5. Update `migration.clientId` (Immutability check).
6. Create `migration` without required `status`.
7. Inject "role: admin" into a user profile (Escalation).
8. Delete `client` by unauthorized user (if RBAC applied).
9. Create `client` with invalid email format.
10. Update `migration.status` to an invalid enum value.
11. PII exposure: Listing all users if not owner (if user profiles existed).
12. Shadow update: Adding `isVerified: true` to a client document.

## Security Rules Plan
- Reusable helpers for ID validation and auth state.
- Strict schema validation for each collection using `isValid[Entity]` functions.
- Default deny for all other paths.
