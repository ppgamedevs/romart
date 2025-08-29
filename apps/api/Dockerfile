FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN pnpm run build --filter=@artfromromania/db
RUN pnpm run build --filter=@artfromromania/shared
RUN pnpm run build --filter=@artfromromania/auth
RUN pnpm run build --filter=@artfromromania/crypto
RUN pnpm run build --filter=@artfromromania/email
RUN pnpm run build --filter=@artfromromania/notifications
RUN pnpm run build --filter=@artfromromania/pod
RUN pnpm run build --filter=@artfromromania/pricing
RUN pnpm run build --filter=@artfromromania/qa
RUN pnpm run build --filter=@artfromromania/search
RUN pnpm run build --filter=@artfromromania/shipping
RUN pnpm run build --filter=@artfromromania/storage
RUN pnpm run build --filter=@artfromromania/tax

# Build API
RUN pnpm run build --filter=@artfromromania/api

EXPOSE 3001

CMD ["pnpm", "run", "start", "--filter=@artfromromania/api"]
