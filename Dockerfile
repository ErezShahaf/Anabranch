FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# -------------------------------------------------------------------

FROM node:22-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Cursor CLI (optional -- only needed when agent.provider is "cursor")
RUN curl https://cursor.com/install -fsSL | bash || true

# Install Claude Code CLI (optional -- only needed when agent.provider is "claude-code")
RUN npm install -g @anthropic-ai/claude-code || true

RUN useradd --create-home --shell /bin/bash anabranch
USER anabranch

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY config/default.yaml ./config/default.yaml
COPY config/config.schema.json ./config/config.schema.json

VOLUME ["/data/workspaces", "/config", "/secrets"]

EXPOSE 3000

CMD ["node", "dist/main.js"]
