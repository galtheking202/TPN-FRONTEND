# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy web app
COPY apps/web ./apps/web

# Install deps from workspace root (resolves @tpn/shared)
RUN npm install --workspace=apps/web

# Build
RUN npm run build --workspace=apps/web

# Stage 2: serve
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf.template

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
