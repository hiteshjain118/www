# Coral Bricks Documentation

This directory contains all project documentation, organized for easy navigation.

## 📖 Documentation Overview

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Installation & Setup](setup.md) - Environment setup and installation guide

### Deployment & Operations
- [Deployment Guide](deployment.md) - Complete deployment instructions for all services
- [Docker Guide](docker.md) - Docker setup and container management
- [Scripts Guide](../scripts/README.md) - Deployment and utility scripts

### Service Documentation
- [Backend Service](backend.md) - Backend API documentation and setup
- [Chat Service](chat.md) - Chat/WebSocket service documentation
- [Frontend](frontend.md) - Frontend application documentation

### Implementation Details
- [WebSocket Integration](websocket.md) - WebSocket implementation details
- [QuickBooks Integration](quickbooks.md) - QBO setup and data handling
- [Database & Models](database.md) - Prisma implementation and data models

### Development
- [Testing](testing.md) - Test structure and running tests
- [Migration Guide](migration.md) - Upgrading and migration instructions

## 🗂️ File Organization

```
docs/
├── README.md              # This file
├── setup.md              # Installation & environment setup
├── deployment.md         # Unified deployment guide
├── docker.md             # Docker documentation
├── backend.md            # Backend service docs
├── chat.md               # Chat service docs
├── frontend.md           # Frontend docs
├── websocket.md          # WebSocket implementation
├── quickbooks.md         # QuickBooks integration
├── database.md           # Database & Prisma docs
├── testing.md            # Testing documentation
└── migration.md          # Migration guides
```

## 🔗 Quick Links

- **Deploy Everything**: Run `./deploy.sh` from project root
- **Individual Services**: See [deployment.md](deployment.md)
- **Local Development**: See [setup.md](setup.md)
- **Troubleshooting**: Check service-specific docs
