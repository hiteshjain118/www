# Scripts Directory

This directory contains all deployment and utility scripts for the Coral Bricks project.

## Scripts Overview

### Deployment Scripts

- **`deploy-all.sh`** - Deploy all services (backend + chat) with proper dependencies
- **`update-frontend-urls.sh`** - Auto-configure frontend with deployed service URLs

### Development Scripts

- **`start.sh`** - Start local development environment
- **`setup-env.sh`** - Set up environment variables and configuration
- **`validate-docker.sh`** - Validate Docker installation and configuration

## Usage

### Deploy All Services

```bash
# From www root (recommended)
./deploy.sh

# Or from scripts directory
cd scripts
./deploy-all.sh
```

### Update Frontend Configuration

```bash
cd scripts
./update-frontend-urls.sh
```

### Local Development

```bash
cd scripts
./start.sh
```

## Script Requirements

All deployment scripts require:
- `GOOGLE_CLOUD_PROJECT` environment variable set
- gcloud CLI authenticated
- Required Google Cloud APIs enabled

## Directory Context

Scripts expect to be run from the `scripts/` directory and will automatically navigate to the correct project directories as needed.

## Service-Specific Deployment

For individual service deployment, use the scripts in each service directory:
- Backend: `cd backend && ./deploy.sh`
- Chat: `cd chat_js && ./deploy.sh`

These are preferred for individual service updates after the initial full deployment.
