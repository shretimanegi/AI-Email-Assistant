FROM node:20-alpine

WORKDIR /app

# Install dependencies first (leverage docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy other source files
COPY . .

# Set environment variable for build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Expose build args so that Next.js can embed NEXT_PUBLIC_ env vars during build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Compile static pages
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
