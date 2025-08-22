# CoralBricks Authentication & QuickBooks Integration

A full-stack TypeScript application providing authentication services and QuickBooks integration with threads functionality.

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Heroicons
- **Port**: 3002

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase integration
- **Port**: 3001

## 🚀 Features

### Core Authentication
- User signup and login
- Profile management
- Session handling with cbid-based authentication

### QuickBooks Integration
- OAuth flow for QuickBooks connection
- Company data retrieval
- Connection status management
- Both sandbox and production environments

### Threads Management
- Create and manage conversation threads
- Real-time thread listing in sidebar
- Thread-based user interactions
- Auto-generated IDs from shared PostgreSQL sequencer

## 📁 Project Structure

```
www/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── Navigation.tsx
│   │   │   └── ThreadsSidebar.tsx
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Login.tsx
│   │   │   └── Profile.tsx
│   │   ├── services/        # API clients
│   │   │   └── api.ts
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   │   ├── coralbricksAuth.ts
│   │   │   ├── quickbooksAuth.ts
│   │   │   ├── coralbricksProfile.ts
│   │   │   ├── quickbooksProfile.ts
│   │   │   └── threads.ts
│   │   ├── services/        # Business logic
│   │   │   ├── coralbricksAuth.ts
│   │   │   ├── quickbooksAuth.ts
│   │   │   ├── prismaService.ts
│   │   │   └── threadsService.ts
│   │   ├── middleware/      # Express middleware
│   │   │   └── auth.ts
│   │   └── types/           # TypeScript types
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Supabase account
- QuickBooks Developer account (for OAuth)

### Environment Variables

Create `.env` files in both frontend and backend directories:

#### Backend `.env`
```env
DATABASE_URL="postgresql://user:password@host:port/database"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
QB_CLIENT_ID="your-quickbooks-client-id"
QB_CLIENT_SECRET="your-quickbooks-client-secret"
QB_REDIRECT_URI="http://localhost:3001/quickbooks/callback"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000,http://localhost:3002,http://localhost:3004"
```

#### Frontend `.env`
```env
VITE_BACKEND_API_URL="http://localhost:3001"
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hiteshjain118/www.git
   cd www
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🗄️ Database Schema

### Core Models

- **Profile**: User profile information with auto-incrementing ID from `global_cb_profile_bigint_id` sequence
- **Threads**: Conversation threads with auto-incrementing ID from `global_non_user_seq` sequence
- **QboProfile**: QuickBooks OAuth tokens and company connections (production)
- **QboProfileSandbox**: QuickBooks OAuth tokens for sandbox environment

### Key Features
- Shared PostgreSQL sequencers for unique ID generation
- Cascading deletes for data integrity
- Proper indexing on frequently queried fields

## 🔗 API Endpoints

### Authentication
- `POST /login` - User login
- `POST /login/signup` - User registration
- `GET /profile/:cbid` - Get user profile

### QuickBooks Integration
- `GET /quickbooks/login?cbid=<id>` - Initiate OAuth flow
- `GET /quickbooks/callback` - OAuth callback handler
- `GET /quickbooks/profile/companies?cbid=<id>` - Get connected companies
- `GET /quickbooks/profile/user?cbid=<id>` - Get QB user info
- `DELETE /quickbooks/profile/disconnect/:realmId?cbid=<id>` - Disconnect company

### Threads Management
- `GET /threads?cbid=<id>` - Get user's threads
- `GET /thread/:threadId?cbid=<id>` - Get specific thread
- `POST /thread/create?cbid=<id>` - Create new thread

## 🎨 UI Components

### ThreadsSidebar
- Green "Create New Thread" button
- Scrollable thread list with timestamps
- Loading and error states
- Thread selection highlighting
- Real-time updates

### Navigation
- User authentication state
- Profile access
- Responsive design

## 🚀 Deployment

The application is configured for deployment on Vercel:

- Frontend builds to `frontend/dist/`
- Backend runs on Node.js with Express
- Database migrations handled via Prisma
- Environment variables configured per environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🔧 Development Notes

- Uses shared PostgreSQL sequencers for ID generation
- cbid-based authentication system
- CORS configured for development ports
- Prisma ORM with TypeScript
- Hot reloading enabled for both frontend and backend
- Comprehensive error handling and logging 