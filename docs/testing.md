# Testing Documentation

## Overview

The Coral Bricks project uses Jest for testing across all services with service-specific test configurations.

## Test Structure

```
www/
├── backend/
│   ├── tests/           # Backend tests
│   ├── src/__tests__/   # Unit tests alongside source
│   └── jest.config.js   # Backend Jest config
├── chat_js/
│   ├── src/tests/       # Chat service tests
│   └── jest.config.js   # Chat Jest config
├── common_js/
│   ├── tests/           # Common library tests
│   └── jest.config.js   # Common Jest config
└── frontend/
    ├── src/__tests__/   # Frontend tests
    └── vite.config.ts   # Frontend test config (Vitest)
```

## Running Tests

### All Services
```bash
# From project root
npm test

# With coverage
npm run test:coverage
```

### Individual Services
```bash
# Backend tests
cd backend && npm test

# Chat service tests
cd chat_js && npm test

# Common library tests
cd common_js && npm test

# Frontend tests
cd frontend && npm test
```

### Watch Mode
```bash
# Backend
cd backend && npm run test:watch

# Chat service
cd chat_js && npm run test:watch
```

## Test Categories

### Unit Tests
Test individual functions and components in isolation.

#### Backend Unit Tests
```typescript
// Example: Testing user service
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };
    
    const user = await userService.create(userData);
    expect(user.email).toBe(userData.email);
  });
});
```

#### Chat Service Unit Tests
```typescript
// Example: Testing tool call runner
describe('ToolCallRunner', () => {
  it('should execute QB data retrieval', async () => {
    const runner = new ToolCallRunner(threadId, userId);
    const result = await runner.runTool('qb_data_retriever', params);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

### Integration Tests
Test service interactions and API endpoints.

#### API Integration Tests
```typescript
// Example: Testing backend API endpoints
describe('Auth API', () => {
  it('should login user with valid credentials', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: 'test@example.com',
        password: 'password'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
  });
});
```

#### Database Integration Tests
```typescript
// Example: Testing Prisma operations
describe('User Database Operations', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });
  
  it('should store and retrieve user', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com', firstName: 'John', lastName: 'Doe' }
    });
    
    const retrieved = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    expect(retrieved).toEqual(user);
  });
});
```

### End-to-End Tests
Test complete user workflows across services.

#### WebSocket E2E Tests
```typescript
// Example: Testing chat flow
describe('Chat E2E', () => {
  it('should complete chat conversation', async () => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3004');
    
    // Send message
    ws.send(JSON.stringify({
      type: 'chat',
      message: 'Hello',
      threadId: 'test-thread'
    }));
    
    // Wait for response
    const response = await waitForMessage(ws);
    expect(response.type).toBe('chat');
    expect(response.message).toBeDefined();
  });
});
```

## Test Configuration

### Backend Jest Config
```javascript
// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Chat Service Jest Config
```javascript
// chat_js/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.ts', '**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts']
};
```

### Frontend Test Config
```typescript
// frontend/vite.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true
  }
});
```

## Test Environment Setup

### Database Testing
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST
    }
  }
});

beforeAll(async () => {
  // Setup test database
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database between tests
  await prisma.user.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.message.deleteMany();
});
```

### Mock Services
```typescript
// tests/mocks/openai.ts
export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          message: { content: 'Mock AI response' }
        }]
      })
    }
  }
};
```

## Testing Patterns

### Factory Pattern for Test Data
```typescript
// tests/factories/user.factory.ts
export const createUser = (overrides = {}) => ({
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  ...overrides
});

export const createUserInDB = async (overrides = {}) => {
  return await prisma.user.create({
    data: createUser(overrides)
  });
};
```

### API Testing Helpers
```typescript
// tests/helpers/api.ts
export const authenticatedRequest = (app, user) => {
  const token = generateJWT(user);
  return request(app).set('Authorization', `Bearer ${token}`);
};
```

### WebSocket Testing Helpers
```typescript
// tests/helpers/websocket.ts
export const waitForMessage = (ws, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    
    ws.onmessage = (event) => {
      clearTimeout(timer);
      resolve(JSON.parse(event.data));
    };
  });
};
```

## Coverage Requirements

### Coverage Targets
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## Continuous Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:coverage
```

## Testing Best Practices

### Test Organization
1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the behavior
3. **Keep tests independent** and isolated
4. **Test edge cases** and error conditions

### Test Data Management
1. **Use factories** for consistent test data
2. **Clean up** after each test
3. **Use separate test database**
4. **Mock external services**

### Performance Testing
1. **Test API response times**
2. **Monitor database query performance**
3. **Test WebSocket connection limits**
4. **Load test critical endpoints**

## Debugging Tests

### Debug Configuration
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Test Debugging Tips
1. **Use `console.log`** for quick debugging
2. **Run single tests** with `it.only`
3. **Use debugger breakpoints**
4. **Check test database state**

## Common Test Issues

### Database Connection
```bash
# Ensure test database is available
createdb coralbricks_test
export DATABASE_URL_TEST=postgresql://localhost/coralbricks_test
```

### Async Test Issues
```typescript
// Properly handle async operations
it('should handle async operation', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});
```

### Mock Cleanup
```typescript
// Clean mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
```

For service-specific testing details, see the test directories in each service and the TEST_STRUCTURE.md file in common_js.
