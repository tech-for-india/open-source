# 🏫 AI-School-Assistant

A lightweight, self-hosted AI chat system designed for schools to provide AI assistance to students and teachers within their local network. The system runs on one main computer and is accessible to everyone on the same LAN/Wi-Fi network.

## 🎯 Goal

Build a secure, local AI chat system that:
- Runs entirely within the school's network
- Provides AI assistance to students and teachers
- Maintains complete data privacy (no external data storage)
- Is easy to deploy and manage by non-technical staff
- Supports role-based access (Super Admin, Admin, User)

## 🔒 Security & Privacy

- **LAN-only access**: No internet exposure required
- **Local data storage**: All data stays within the school
- **Role-based permissions**: Granular access control
- **Password policies**: Secure authentication with forced password changes
- **Rate limiting**: Prevents abuse and ensures fair usage

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   React Frontend│    │  Node.js Backend│
│   (Students/    │◄──►│   (Port 5173)   │◄──►│  (Port 3000)    │
│   Teachers)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   SQLite DB     │
                                              │   (Local File)  │
                                              └─────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Prisma ORM
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: JWT with HttpOnly cookies
- **AI**: OpenAI GPT-4o-mini (streaming)
- **Logging**: Pino

## 📁 Project Structure

```
AI-School-Assistant/
├── server/                 # Backend Express application
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, rate limiting, etc.
│   │   ├── models/         # Prisma schema and models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── prisma/             # Database schema and migrations
│   └── scripts/            # Database seeding and utilities
├── web/                    # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API calls
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
├── nginx/                  # Sample NGINX configuration
├── scripts/                # Maintenance and utility scripts
└── docs/                   # Documentation and guides
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- pnpm or npm
- OpenAI API key
- School LAN environment

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd projects/AI-School-Assistant

# Install dependencies for both server and web
pnpm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit the environment file
nano server/.env
```

Required environment variables:
```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_random_jwt_secret_here

# Optional (with defaults)
APP_PORT=3000
SCHOOL_NAME=Your School Name
DATA_RETENTION_MONTHS=12
THEME=dark
SUPERADMIN_USERNAME=admin
SUPERADMIN_PASSWORD=admin123
```

### 3. Initialize Database

```bash
# Navigate to server directory
cd server

# Install Prisma CLI
pnpm add -g prisma

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed the super admin
pnpm run seed
```

### 4. Start the Application

```bash
# Terminal 1: Start the backend
cd server
pnpm dev

# Terminal 2: Start the frontend
cd web
pnpm dev
```

### 5. Access the Application

- **Local**: http://localhost:5173
- **LAN**: http://YOUR_MACHINE_IP:5173

## 👥 User Roles

### Super Admin
- Create and manage other admins
- Full system access
- User management
- System configuration

### Admin
- Create and manage users
- View reports and analytics
- Monitor chat usage
- Batch user creation

### User (Students/Teachers)
- Create and manage chats
- Ask AI questions
- View chat history
- Change personal settings

## 📊 Features

### For Users
- 🤖 AI chat with streaming responses
- 💬 Multiple chat sessions
- 🌙 Dark/Light theme toggle
- 🔒 Secure authentication
- 📱 Responsive design

### For Admins
- 👥 User management (create, delete, batch import)
- 📈 Usage reports and analytics
- 🔍 Chat monitoring
- 📊 Token usage tracking
- 🗂️ Data export capabilities

### For Super Admins
- ⚙️ System configuration
- 👨‍💼 Admin user management
- 🔧 Database maintenance
- �� System health monitoring

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `JWT_SECRET` | Yes | - | Secret for JWT tokens |
| `APP_PORT` | No | 3000 | Backend server port |
| `SCHOOL_NAME` | No | "AI School Assistant" | School name for branding |
| `DATA_RETENTION_MONTHS` | No | 12 | How long to keep chat data |
| `THEME` | No | "dark" | Default theme (dark/light) |
| `SUPERADMIN_USERNAME` | No | "admin" | Initial super admin username |
| `SUPERADMIN_PASSWORD` | No | "admin123" | Initial super admin password |

### LAN Configuration

To make the application accessible from other devices on the LAN:

1. **Configure Firewall**: Allow incoming connections on port 3000
2. **Optional NGINX**: Use the provided nginx configuration for reverse proxy
3. **Network Access**: Ensure devices are on the same subnet

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Users (Admin only)
- `POST /api/users` - Create single user
- `POST /api/users/batch` - Batch create users from CSV
- `GET /api/users` - List users
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset user password

### Chats
- `GET /api/chats` - List user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:chatId` - Get chat messages
- `DELETE /api/chats/:chatId` - Delete chat
- `POST /api/chats/:chatId/message` - Send message to AI

### Reports (Admin only)
- `GET /api/reports/usage` - Usage analytics

## 🗄️ Database Schema

### Users
- Basic info (name, username, role)
- Class and roll number
- Family information (for password generation)
- Authentication details

### Chats
- Chat metadata (title, timestamps)
- User association
- Message count and usage stats

### Messages
- Message content and role
- AI model used
- Token usage tracking
- Timestamps

## 🔄 Maintenance

### Annual Data Purge

```bash
# Run the purge script to clean old data
cd scripts
pnpm run purge-annual
```

### Database Backup

```bash
# Backup the SQLite database
cp server/prisma/dev.db backup_$(date +%Y%m%d).db
```

### User Import

```bash
# Import users from CSV
cd scripts
pnpm run import-users path/to/users.csv
```

## 🛡️ Security Considerations

- **LAN-only access**: Application should not be exposed to the internet
- **Strong passwords**: Users must change default passwords
- **Rate limiting**: Prevents abuse of AI endpoints
- **JWT security**: HttpOnly cookies prevent XSS attacks
- **Data retention**: Automatic cleanup of old data

## 🐛 Troubleshooting

### Common Issues

1. **Can't access from other devices**
   - Check firewall settings
   - Verify network connectivity
   - Ensure correct IP address

2. **Database errors**
   - Run `pnpm prisma migrate reset`
   - Check file permissions on database file

3. **OpenAI API errors**
   - Verify API key is correct
   - Check API quota and billing

4. **Authentication issues**
   - Clear browser cookies
   - Check JWT_SECRET configuration

## 📞 Support

For technical support and questions:
- **Author**: Shekhar Bhattacharya
- **License**: Free for Non-Profit schools and educational institutes
- **Network**: LAN-only deployment

## 🔄 Updates and Maintenance

- Regular security updates
- Database schema migrations
- Feature enhancements
- Performance optimizations

## 📋 Project Status & Remaining Work

### ✅ **Completed Features**

#### Core System
- ✅ **Authentication System**: Login, logout, JWT tokens, password management
- ✅ **User Management**: Create, edit, delete users, role-based access
- ✅ **AI Chat System**: Real-time streaming with OpenAI GPT-4o-mini
- ✅ **Database**: SQLite with Prisma ORM, migrations, seeding
- ✅ **Frontend**: React + TypeScript + Vite with Tailwind CSS
- ✅ **Backend**: Node.js + Express + TypeScript API
- ✅ **Security**: Rate limiting, password policies, JWT authentication

#### User Features
- ✅ **Chat Interface**: Create chats, send messages, real-time streaming
- ✅ **Chat Management**: View chat history, delete chats
- ✅ **Password Change**: User self-service password updates
- ✅ **Theme Support**: Dark/light mode toggle
- ✅ **Responsive Design**: Works on all screen sizes

#### Admin Features
- ✅ **User Management**: Add, edit, delete users, batch import from CSV
- ✅ **Password Management**: Reset user passwords, view generated passwords (superadmin)
- ✅ **Chat Monitoring**: View all chats, delete chats, monitor usage
- ✅ **Reports**: Basic usage statistics and analytics
- ✅ **Role Management**: Super admin, admin, user roles

#### Technical Features
- ✅ **API Endpoints**: Complete REST API for all features
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Logging**: Server-side logging with Pino
- ✅ **Database Schema**: Complete user, chat, and message models
- ✅ **Environment Configuration**: Flexible configuration system

### 🚧 **Remaining Work**

#### High Priority
1. **Settings/Configuration Page** ⚠️
   - School name configuration
   - Data retention settings
   - System preferences
   - Theme configuration

2. **Enhanced Reports & Analytics** 📊
   - Detailed usage charts and graphs
   - User activity tracking
   - Token usage analytics
   - Export functionality

3. **Data Export/Import** 📁
   - Export chat data
   - Export user data
   - Backup/restore functionality
   - Data migration tools

#### Medium Priority
4. **Advanced Chat Features** 💬
   - Chat search functionality
   - Chat categorization/tags
   - Message editing/deletion
   - File upload support
   - Chat templates

5. **User Experience Improvements** 🎨
   - Better loading states
   - Offline support
   - Keyboard shortcuts
   - Accessibility improvements
   - Mobile app (PWA)

6. **Admin Dashboard Enhancements** 📈
   - Real-time monitoring
   - System health indicators
   - Performance metrics
   - User activity feeds

#### Low Priority
7. **Advanced Features** 🔧
   - Multi-language support
   - Custom AI models integration
   - Advanced security features
   - API rate limiting dashboard
   - System notifications

8. **Deployment & DevOps** 🚀
   - Docker containerization
   - Production deployment guide
   - Automated backups
   - Monitoring and alerting
   - CI/CD pipeline

9. **Documentation & Testing** 📚
   - API documentation
   - User manual
   - Admin guide
   - Unit tests
   - Integration tests
   - End-to-end tests

#### Maintenance Tasks
10. **System Maintenance** 🔧
    - Annual data purge script (exists but needs testing)
    - Database optimization
    - Performance monitoring
    - Security audits
    - Dependency updates

### 🎯 **Current Status: 85% Complete**

The core functionality is fully implemented and working. The application is ready for basic deployment and use. The remaining work focuses on:
- Enhanced admin features
- Better user experience
- Production readiness
- Documentation and testing

### 🚀 **Ready for Production**

The current version is suitable for:
- ✅ Basic school deployment
- ✅ User management and chat functionality
- ✅ Admin monitoring and control
- ✅ Secure LAN-only operation

---

**⚠️ Important**: This system is designed for LAN-only deployment. Do not expose to the public internet without proper security measures.

**🎓 Educational Use**: This software is provided free of charge for non-profit educational institutions. Commercial use requires separate licensing.
