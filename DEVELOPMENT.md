# Development Setup Guide

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```powershell
# Run the development startup script
.\start-dev.ps1
```

This script will:
- Stop any existing Node.js processes
- Clear build caches
- Start the web application
- Monitor the service and restart if it crashes

### Option 2: Manual Setup
```powershell
# Start the web application manually
pnpm run dev --filter=@artfromromania/web
```

## 🌐 Access Points

- **Web Application**: http://localhost:3000
- **API Routes**: http://localhost:3000/api/*
- **Home Page**: http://localhost:3000/en
- **Discover Page**: http://localhost:3000/en/discover

## 🏗️ Architecture

### Current Setup (Simplified)
- **Frontend**: Next.js 15 with App Router
- **API**: Next.js API Routes (mock data for development)
- **Styling**: Tailwind CSS
- **Internationalization**: Custom i18n setup

### Future Setup (Full Microservices)
- **Frontend**: Next.js 15
- **API**: Fastify server
- **Database**: PostgreSQL
- **Cache**: Redis
- **Search**: Meilisearch
- **Storage**: Cloudflare R2

## 🔧 Development Features

### ✅ Working Features
- ✅ Next.js 15 with App Router
- ✅ TypeScript with strict typing
- ✅ Tailwind CSS styling
- ✅ Internationalization (en/ro)
- ✅ Responsive design
- ✅ SEO optimization
- ✅ Mock API data
- ✅ Hot reloading
- ✅ Type-safe routing

### 🚧 In Progress
- 🔄 Full API integration
- 🔄 Database connectivity
- 🔄 Authentication system
- 🔄 Search functionality
- 🔄 Payment processing

## 📁 Project Structure

```
apps/
├── web/                    # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities
│   │   └── i18n/         # Internationalization
│   └── package.json
└── api/                   # Fastify API (future)
    ├── src/
    └── package.json

packages/                  # Shared packages
├── db/                   # Database schema & client
├── shared/               # Shared utilities
├── auth/                 # Authentication
└── ...                   # Other packages
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```powershell
   # Kill existing processes
   Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
   ```

2. **Build cache issues**
   ```powershell
   # Clear caches
   Remove-Item -Recurse -Force apps/web/.next
   Remove-Item -Recurse -Force node_modules/.cache
   ```

3. **TypeScript errors**
   ```powershell
   # Check for type errors
   pnpm run typecheck
   ```

### Development Commands

```powershell
# Start development
pnpm run dev --filter=@artfromromania/web

# Build for production
pnpm run build --filter=@artfromromania/web

# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Run tests
pnpm run test
```

## 🎯 Next Steps

1. **Fix TypeScript errors** in packages/db
2. **Set up PostgreSQL** database
3. **Integrate real API** endpoints
4. **Add authentication** system
5. **Implement search** functionality
6. **Add payment** processing
7. **Deploy to production**

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Look at the terminal output for error messages
3. Verify all dependencies are installed: `pnpm install`
4. Clear caches and restart: `.\start-dev.ps1`
