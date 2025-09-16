# Database & Models Documentation

## Overview

Coral Bricks uses Prisma ORM with PostgreSQL/Supabase for data persistence. The database schema is shared across backend and chat services.

## Database Schema

### Core Models

#### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String
  lastName  String
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  qboProfiles QBOProfile[]
  threads     Thread[]
  messages    Message[]
}
```

#### QBOProfile (QuickBooks Integration)
```prisma
model QBOProfile {
  cbId                  BigInt   @id @default(autoincrement())
  userId                String
  companyId             String
  accessToken           String
  refreshToken          String
  accessTokenExpiresAt  DateTime
  refreshTokenExpiresAt DateTime
  
  // Relations
  user User @relation(fields: [userId], references: [id])
}
```

#### Thread (Chat Conversations)
```prisma
model Thread {
  cbId      BigInt    @id @default(autoincrement())
  userId    String
  title     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  // Relations
  user     User      @relation(fields: [userId], references: [id])
  messages Message[]
}
```

#### Message (Chat Messages)
```prisma
model Message {
  cbId       BigInt   @id @default(autoincrement())
  threadId   BigInt
  senderId   String
  receiverId String
  body       String
  createdAt  DateTime @default(now())
  
  // Relations
  thread Thread @relation(fields: [threadId], references: [cbId])
  sender User   @relation(fields: [senderId], references: [id])
}
```

#### ToolCall (Tool Execution Logs)
```prisma
model ToolCall {
  id        String   @id @default(cuid())
  userId    String
  toolName  String
  input     Json
  output    Json?
  status    String
  createdAt DateTime @default(now())
  
  // Relations
  user User @relation(fields: [userId], references: [id])
}
```

## Database Configuration

### Supabase Setup (Recommended)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### Local PostgreSQL
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/coralbricks
```

## Prisma Operations

### Schema Management
```bash
cd common_js

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration-name

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (development)
npx prisma migrate reset
```

### Database Inspection
```bash
# Open Prisma Studio (database browser)
npx prisma studio

# View database status
npx prisma db push --preview-feature
```

### Data Seeding
```bash
# Run seed script
npx prisma db seed
```

## Common Patterns

### User Authentication
```typescript
// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
});

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});
```

### Thread Management
```typescript
// Create thread with initial message
const thread = await prisma.thread.create({
  data: {
    userId: user.id,
    title: 'Chat about QuickBooks',
    messages: {
      create: {
        senderId: user.id,
        receiverId: 'ai-assistant',
        body: 'Hello, I need help with QuickBooks'
      }
    }
  },
  include: { messages: true }
});
```

### QuickBooks Profile
```typescript
// Store QBO credentials
const qboProfile = await prisma.qBOProfile.create({
  data: {
    userId: user.id,
    companyId: 'qbo-company-id',
    accessToken: 'token',
    refreshToken: 'refresh-token',
    accessTokenExpiresAt: new Date(Date.now() + 3600000),
    refreshTokenExpiresAt: new Date(Date.now() + 8760 * 3600000)
  }
});
```

## Migration History

### Initial Schema (v1.0)
- Basic user management
- Thread and message models
- QuickBooks integration

### Recent Updates
- Added tool call logging
- Enhanced user roles
- Improved indexing for performance

## Performance Considerations

### Indexing
```sql
-- Key indexes for performance
CREATE INDEX idx_messages_thread_id ON "Message"("threadId");
CREATE INDEX idx_messages_created_at ON "Message"("createdAt");
CREATE INDEX idx_qbo_profiles_user_id ON "QBOProfile"("userId");
CREATE INDEX idx_threads_user_id ON "Thread"("userId");
```

### Query Optimization
- Use `include` for related data instead of separate queries
- Implement pagination for large message lists
- Cache frequently accessed data

## Backup & Maintenance

### Database Backups
```bash
# Supabase automatic backups
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Maintenance Tasks
- Regular cleanup of old messages
- Optimize database performance
- Monitor query performance
- Update access tokens for QBO profiles

## Development Tools

### Database Browser
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Schema Visualization
The Prisma schema can be visualized using tools like:
- Prisma Studio
- Database diagram tools
- ER diagram generators

## Testing Database

### Test Database Setup
```bash
# Use separate test database
DATABASE_URL_TEST=postgresql://test:test@localhost:5432/coralbricks_test

# Run tests with test DB
NODE_ENV=test npm test
```

### Test Data Management
- Use factories for test data creation
- Clean database between tests
- Use transactions for test isolation

For detailed test structure, see [testing.md](testing.md).

## Troubleshooting

### Common Issues

#### Migration Errors
```bash
# Reset and reapply migrations
npx prisma migrate reset
npx prisma migrate deploy
```

#### Connection Issues
```bash
# Test connection
npx prisma db push --preview-feature
```

#### Schema Sync Issues
```bash
# Regenerate client
npx prisma generate
```

### Debug Tools
- Enable Prisma query logging
- Use database query logs
- Monitor connection pools

For more implementation details, see the Prisma-related documentation in individual service directories.
