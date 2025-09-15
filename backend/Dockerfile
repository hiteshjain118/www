# Multi-stage build for backend service
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy common_js first and build it
COPY common_js ./common_js
WORKDIR /app/common_js
RUN npm ci && npm run build && npx prisma generate

# Switch to backend directory
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install all dependencies for building
RUN npm ci

# Copy backend source code
COPY backend .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install OpenSSL and other dependencies for Prisma compatibility
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Set working directory
WORKDIR /app

# Copy common_js built package
COPY --from=builder /app/common_js ./common_js

# Copy backend package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Fix the symlink for coralbricks-common to point to the correct path
RUN rm -f node_modules/coralbricks-common && ln -s ../common_js node_modules/coralbricks-common

# Install the local common_js package and regenerate Prisma client
WORKDIR /app/common_js
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

# Switch back to main app directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/backend/dist ./dist

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"] 