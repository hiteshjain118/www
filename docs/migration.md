# Migration Guide: Python Flask to TypeScript Node.js

This document outlines the migration from the Python Flask authentication service to the new TypeScript Node.js service.

## 🚀 What's New

### Architecture Changes
- **Language**: Python → TypeScript
- **Framework**: Flask → Express.js
- **Runtime**: Python → Node.js
- **Authentication**: Session-based → Stateless (cbid-based)
- **Deployment**: Traditional → Containerized (Docker)

### Key Improvements
- **Type Safety**: Full TypeScript implementation
- **Performance**: Node.js event-driven architecture
- **Security**: Enhanced middleware (Helmet, CORS, rate limiting)
- **Monitoring**: Structured logging with Winston
- **Scalability**: Microservice-ready architecture
- **Development**: Modern tooling (ESLint, Jest, ts-node-dev)

## 📁 File Structure Comparison

### Old Python Structure
```
auth/
├── main.py                 # Flask app
├── coralbricks_auth.py    # CoralBricks routes
├── quickbooks_auth.py     # QuickBooks routes
├── requirements.txt        # Python dependencies
├── start.sh               # Python startup script
└── README.md              # Python documentation
```

### New TypeScript Structure
```
www/
├── src/
│   ├── config/            # Configuration management
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utility functions
│   └── index.ts           # Main application
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Development environment
└── README.md              # Updated documentation
```

## 🔄 API Endpoint Mapping

### CoralBricks Authentication
| Old (Python) | New (TypeScript) | Notes |
|--------------|------------------|-------|
| `POST /auth/coralbricks/login` | `POST /auth/coralbricks/login` | Same functionality |
| `GET /auth/api/coralbricks/user?cbid=<id>` | `GET /auth/coralbricks/api/coralbricks/user?cbid=<id>` | Path updated |
| `GET /auth/coralbricks/profile?cbid=<id>` | `GET /auth/coralbricks/profile?cbid=<id>` | New endpoint |

### QuickBooks Integration
| Old (Python) | New (TypeScript) | Notes |
|--------------|------------------|-------|
| `GET /auth/quickbooks?cbid=<id>` | `GET /auth/quickbooks?cbid=<id>` | Same functionality |
| `GET /auth/callback?cbid=<id>&code=<code>&realmId=<id>` | `GET /auth/quickbooks/callback?cbid=<id>&code=<code>&realmId=<id>` | Path updated |
| `DELETE /auth/disconnect/<realm_id>?cbid=<id>` | `DELETE /auth/quickbooks/disconnect/<realm_id>?cbid=<id>` | Path updated |
| `GET /auth/api/companies?cbid=<id>` | `GET /auth/quickbooks/api/companies?cbid=<id>` | Path updated |
| `GET /auth/api/status/<realm_id>?cbid=<id>` | `GET /auth/quickbooks/api/status/<realm_id>?cbid=<id>` | Path updated |
| `GET /auth/api/quickbooks/user?cbid=<id>` | `GET /auth/quickbooks/api/quickbooks/user?cbid=<id>` | Path updated |

## 🔐 Authentication Changes

### Old Python Approach
- Session-based authentication
- Flask-Session for state management
- User data stored in session

### New TypeScript Approach
- Stateless authentication using `cbid` parameter
- No server-side sessions
- User validation on each request
- Middleware-based authentication

### Migration Steps
1. **Update Client Code**: Replace session management with cbid parameter
2. **Update API Calls**: Add `?cbid=<user_id>` to all protected endpoints
3. **Remove Session Logic**: No need to handle login/logout sessions
4. **Update Error Handling**: Handle 400/401/404 responses for authentication failures

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ (instead of Python 3.8+)
- npm 8+ (instead of pip)

### Installation
```bash
# Old Python way
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# New TypeScript way
npm install
npm run build
```

### Running the Service
```bash
# Old Python way
python3 main.py

# New TypeScript way
npm start
# or
npm run dev  # for development with auto-reload
```

### Environment Variables
```bash
# Old Python (.env)
FLASK_SECRET_KEY=your_secret_key
FLASK_ENV=development

# New TypeScript (.env)
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret
```

## 🐳 Deployment Changes

### Old Python Deployment
- Traditional server deployment
- Virtual environment management
- Process management with systemd/supervisor

### New TypeScript Deployment
- Docker containerization
- Multi-stage builds
- Health checks and monitoring
- Easy scaling with Docker Compose

### Migration Steps
1. **Build Container**: `docker build -t coralbricks-auth .`
2. **Run Container**: `docker run -p 3001:3001 --env-file .env coralbricks-auth`
3. **Use Docker Compose**: `docker-compose up -d`

## 🧪 Testing

### Old Python Testing
- Manual testing with Python scripts
- No formal test framework

### New TypeScript Testing
- Jest testing framework
- TypeScript test files
- Coverage reporting
- Automated testing pipeline

### Running Tests
```bash
# Old Python way
python3 test_setup.py

# New TypeScript way
npm test
npm run test:coverage
```

## 📊 Monitoring & Logging

### Old Python Approach
- Basic console logging
- No structured logging
- Limited monitoring

### New TypeScript Approach
- Winston structured logging
- Multiple log transports (console, file)
- Request logging middleware
- Health check endpoints
- Performance metrics

## 🔒 Security Enhancements

### New Security Features
- **Helmet**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: Request throttling
- **Input Validation**: Parameter validation
- **Error Handling**: Secure error responses

### Migration Benefits
- Better protection against common attacks
- Improved request validation
- Enhanced monitoring and logging

## 📈 Performance Improvements

### Node.js Benefits
- Event-driven architecture
- Non-blocking I/O
- Better memory management
- Faster startup times
- Improved scalability

### Migration Impact
- Reduced response times
- Better concurrent request handling
- Lower memory usage
- Easier horizontal scaling

## 🚨 Breaking Changes

### API Changes
1. **Port Change**: 5000 → 3001
2. **Path Updates**: Some endpoint paths have changed
3. **Authentication**: Session-based → cbid-based
4. **Response Format**: Standardized API response structure

### Client Code Updates Required
1. Update base URLs to use port 3001
2. Add cbid parameter to all protected endpoints
3. Handle new response formats
4. Update error handling for new status codes

## ✅ Migration Checklist

- [ ] Install Node.js 18+ and npm 8+
- [ ] Clone new TypeScript service
- [ ] Install dependencies: `npm install`
- [ ] Build service: `npm run build`
- [ ] Configure environment variables
- [ ] Test service locally: `npm start`
- [ ] Update client applications
- [ ] Deploy to staging environment
- [ ] Test all endpoints
- [ ] Deploy to production
- [ ] Monitor service health
- [ ] Remove old Python service

## 🆘 Troubleshooting

### Common Issues
1. **Port Conflicts**: Ensure port 3001 is available
2. **Environment Variables**: Check .env file configuration
3. **Dependencies**: Run `npm install` if modules are missing
4. **Build Errors**: Check TypeScript compilation with `npm run build`

### Getting Help
- Check service health: `GET /health`
- Review service status: `GET /status`
- Check logs in `logs/` directory
- Review API documentation: `GET /`

## 🎯 Next Steps

After migration:
1. **Performance Tuning**: Monitor and optimize based on usage
2. **Feature Development**: Add new authentication methods
3. **Integration**: Connect with other microservices
4. **Monitoring**: Set up production monitoring and alerting
5. **Documentation**: Update client integration guides 