# QBO Profiles Database Setup

This document describes the setup for the new QBO profiles database schema that mirrors the implementation from `builder/builder_package/qbo/qbo_user.py`.

## Overview

The schema includes two tables for QBO profiles:
- `qbo_profiles` - Production environment
- `qbo_profiles_sandbox` - Sandbox environment

## Schema Structure

Both tables have identical structure:

```sql
- cb_id (BIGINT, Primary Key) - Coral Bricks user ID
- owner_id (BIGINT, Foreign Key) - References profiles.id
- realm_id (TEXT) - QuickBooks realm ID
- access_token (TEXT) - OAuth access token
- refresh_token (TEXT) - OAuth refresh token
- expires_in (INTEGER) - Token expiration time in seconds
- refresh_token_expires_in (INTEGER) - Refresh token expiration time
- created_at (TIMESTAMP) - Record creation timestamp
- updated_at (TIMESTAMP) - Record last update timestamp
```

## Files Created

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Updated with new QBO profile models
   - Added relations to existing Profile model

2. **Migration File** (`prisma/migrations/20250821141200_add_qbo_profiles/migration.sql`)
   - SQL script to create the new tables
   - Foreign key constraints

3. **Service Layer** (`src/services/qboProfileService.ts`)
   - TypeScript service for working with QBO profiles
   - Environment-aware methods (production vs sandbox)
   - CRUD operations and utility methods

## Setup Instructions

### Option 1: Apply Migration (Recommended)

If the database connection issues are resolved:

```bash
# Generate Prisma client
npx prisma generate

# Apply the migration
npx prisma migrate dev --name add_qbo_profiles
```

### Option 2: Manual SQL Execution

If migrations continue to have connection issues, execute the SQL manually:

1. Connect to your Supabase PostgreSQL database
2. Execute the contents of `prisma/migrations/20250821141200_add_qbo_profiles/migration.sql`

### Option 3: Database Push

```bash
# Push schema changes directly
npx prisma db push
```

## Environment Detection

The service layer includes environment detection similar to the Python implementation:

- **Production**: Uses `qbo_profiles` table
- **Sandbox**: Uses `qbo_profiles_sandbox` table

## Usage Examples

```typescript
import QBOProfileService from './services/qboProfileService';

// Get profile for current environment
const profile = await QBOProfileService.getProfile(cbId, isProduction);

// Create/update profile
await QBOProfileService.upsertProfile({
  cbId: BigInt(123),
  ownerId: BigInt(456),
  realmId: 'realm123',
  accessToken: 'token123',
  refreshToken: 'refresh123',
  expiresIn: 3600
}, isProduction);

// Check connection status
const isConnected = await QBOProfileService.isProfileConnected(cbId, isProduction);
```

## Verification

After setup, verify the tables exist:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('qbo_profiles', 'qbo_profiles_sandbox');

-- Check table structure
\d qbo_profiles
\d qbo_profiles_sandbox
```

## Notes

- The schema mirrors the Python SQLAlchemy implementation exactly
- Foreign key constraints ensure data integrity
- Cascade delete ensures profiles are removed when users are deleted
- Environment separation allows for safe testing in sandbox
- The service layer provides a clean API for working with both environments 