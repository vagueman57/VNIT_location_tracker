# -------------------------------------------------------
# 1) Base image - lightweight, secure, production-ready
# -------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# -------------------------------------------------------
# 2) Install dependencies in a separate layer (caching)
# -------------------------------------------------------
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# -------------------------------------------------------
# 3) Build stage (only if you have build steps)
# -------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# If you have frontend build, run it here (optional)
# RUN npm run build

# -------------------------------------------------------
# 4) Final runtime image
# -------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy only essential files
COPY --from=build /app /app

# NODE_ENV=production ensures best performance
ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Graceful shutdown for Render
STOPSIGNAL SIGTERM

# Start the server
CMD ["node", "app.js"]
