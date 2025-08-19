# 🚀 Deployment Guide

## Local Development Setup

### Prerequisites
- Node.js 20+
- pnpm or npm
- OpenAI API key

### Quick Setup
```bash
# Run the setup script
./setup.sh

# Or manually:
pnpm install
cp server/.env.example server/.env
# Edit server/.env with your OpenAI API key
cd server && pnpm prisma migrate dev && pnpm run seed
```

### Start Development
```bash
# Start both frontend and backend
pnpm dev

# Or separately:
# Terminal 1: Backend
cd server && pnpm dev

# Terminal 2: Frontend  
cd web && pnpm dev
```

## Production Deployment

### 1. Build the Application
```bash
# Build both frontend and backend
pnpm build

# Or separately:
cd server && pnpm build
cd web && pnpm build
```

### 2. Environment Configuration
```bash
# Copy and configure environment
cp server/.env.example server/.env
nano server/.env
```

Required production settings:
```env
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_secure_jwt_secret
SCHOOL_NAME=Your School Name
```

### 3. Database Setup
```bash
cd server
pnpm prisma migrate deploy
pnpm run seed
```

### 4. Start Production Server
```bash
# Start backend
cd server && pnpm start

# Serve frontend (using nginx or similar)
```

### 5. NGINX Configuration (Optional)
```bash
# Copy nginx config
sudo cp nginx/nginx.conf /etc/nginx/sites-available/ai-school
sudo ln -s /etc/nginx/sites-available/ai-school /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## LAN Access Configuration

### Firewall Setup
```bash
# Allow ports 3000 and 5173
sudo ufw allow 3000
sudo ufw allow 5173

# Or for specific network
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw allow from 192.168.1.0/24 to any port 5173
```

### Network Configuration
- Ensure all devices are on the same subnet
- Configure static IP for the server machine
- Test connectivity: `ping SERVER_IP`

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Configure firewall rules
- [ ] Enable HTTPS (if needed)
- [ ] Regular database backups
- [ ] Monitor logs for issues
- [ ] Update dependencies regularly

## Troubleshooting

### Common Issues

1. **Can't access from LAN**
   - Check firewall settings
   - Verify network connectivity
   - Ensure server binds to 0.0.0.0

2. **Database errors**
   - Check file permissions
   - Run migrations: `pnpm prisma migrate deploy`
   - Verify database path in .env

3. **OpenAI API errors**
   - Check API key validity
   - Verify billing status
   - Check rate limits

4. **Authentication issues**
   - Clear browser cookies
   - Check JWT secret
   - Verify user exists in database

### Logs
```bash
# Backend logs
cd server && pnpm dev

# Database logs
pnpm prisma studio

# System logs
journalctl -u nginx
```

## Maintenance

### Regular Tasks
- [ ] Backup database weekly
- [ ] Check OpenAI API usage
- [ ] Monitor disk space
- [ ] Update dependencies monthly
- [ ] Review access logs

### Annual Tasks
- [ ] Run data purge script
- [ ] Update SSL certificates
- [ ] Review security settings
- [ ] Performance optimization

## Support

For technical support:
- Check the main README.md
- Review logs for error messages
- Ensure all prerequisites are met
- Verify network configuration

---

**⚠️ Security Note**: This application is designed for LAN-only deployment. Do not expose to the public internet without proper security measures.
