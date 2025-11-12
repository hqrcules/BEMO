# Bemo Investment - Cryptocurrency Trading Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![Django](https://img.shields.io/badge/django-5.0-green.svg)
![React](https://img.shields.io/badge/react-18.3-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.5-blue.svg)

A professional cryptocurrency trading platform with automated bot trading, real-time market data, and comprehensive portfolio management. Built with Django REST Framework, React, and WebSocket support for live updates.

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Bot Trading System](#-bot-trading-system)
- [Internationalization](#-internationalization)
- [Theme System](#-theme-system)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)

## ✨ Features

### Trading & Portfolio Management
- 🚀 **Real-time Market Data** - Live cryptocurrency prices via WebSocket
- 🤖 **Automated Trading Bots** - Multiple bot types (Basic, Premium, Specialist)
- 📊 **Advanced Charts** - Interactive candlestick charts with technical indicators
- 💼 **Portfolio Tracking** - Real-time balance updates and transaction history
- 📈 **Trading Statistics** - Win rate, profit/loss tracking, and performance analytics

### User Experience
- 🌙 **Dark/Light Theme** - Seamless theme switching with persistent preferences
- 🌍 **Multi-language Support** - i18n support (English, Russian, Spanish, German, French, Japanese, Chinese, Arabic, Kazakh, Dutch, Czech)
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- ⚡ **Real-time Updates** - WebSocket-powered live balance and trade updates
- 🔔 **Live Notifications** - Instant feedback on trades and account activities

### Security & Administration
- 🔔 **JWT Authentication** - Secure token-based authentication
- 👤 **User Profiles** - Complete profile management with wallet addresses
- 💰 **Deposit/Withdrawal System** - Transaction management with admin review
- 💬 **Live Support Chat** - Real-time chat with admin support team
- 🔔 **Role-based Access Control** - Admin panel for user and transaction management

### Technical Features
- ⚡ **Optimized Performance** - React Query for efficient data fetching
- 🔷 **Type Safety** - Full TypeScript implementation
- 📦 **Modular Architecture** - Clean separation of concerns
- 🐳 **Docker Support** - Containerized deployment
- 🔔 **Background Tasks** - Celery for async processing and scheduled jobs

## 🚀 Tech Stack

### Backend
- **Framework:** Django 5.0 + Django REST Framework
- **Real-time:** Django Channels (WebSockets) + Daphne ASGI server
- **Task Queue:** Celery + Redis
- **Database:** SQLite (Development) / PostgreSQL (Production)
- **Authentication:** JWT (djangorestframework-simplejwt)
- **API Documentation:** drf-spectacular (OpenAPI 3.0)
- **Validation:** python-decouple for environment variables

### Frontend
- **Framework:** React 18.3 with TypeScript 5.5
- **Build Tool:** Vite 5.4
- **State Management:** Redux Toolkit
- **Routing:** React Router v6
- **UI Framework:** Tailwind CSS
- **Charts:** Recharts, Lightweight Charts
- **HTTP Client:** Axios
- **Internationalization:** react-i18next
- **Icons:** Lucide React

### DevOps & Tools
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **Message Broker:** Redis 7
- **Version Control:** Git
- **Code Quality:** ESLint, Prettier (frontend)


### Key Components

1. **Frontend (React + TypeScript)**
   - Modern SPA with React Router for navigation
   - Redux for global state management
   - WebSocket hooks for real-time updates
   - Theme context for dark/light mode
   - i18n integration for multi-language support

2. **Backend (Django + DRF)**
   - RESTful API with comprehensive endpoints
   - JWT-based authentication
   - WebSocket consumers for real-time communication
   - Celery tasks for bot trading and scheduled operations

3. **Real-time Layer (Django Channels)**
   - WebSocket connections for live market data
   - Real-time balance updates
   - Bot trade notifications
   - Support chat messaging

4. **Task Queue (Celery + Redis)**
   - Bot trading simulations
   - Market data fetching
   - Scheduled statistics updates
   - Background processing

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **Docker & Docker Compose** - [Download Docker](https://www.docker.com/products/docker-desktop)
- **Git** - [Download Git](https://git-scm.com/downloads)
- **Redis** (if running locally) - [Download Redis](https://redis.io/download)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/crypto-exchange.git
cd crypto-exchange
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Unix or MacOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Build for production (optional)
npm run build
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Django Settings
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_SETTINGS_MODULE=config.settings.development

# Database (SQLite is default)
# For PostgreSQL, uncomment and configure:
# DB_NAME=bemo_db
# DB_USER=bemo_user
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Channel Layers
CHANNEL_LAYERS_HOST=localhost
CHANNEL_LAYERS_PORT=6379

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# External APIs (Optional)
COINGECKO_API_KEY=your-api-key
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# WebSocket Port
VITE_WS_PORT=8000

# Environment
VITE_ENV👤evelopment
```

##  Running the Application

### Option 1: Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild containers
docker-compose up -d --build
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Admin Panel:** http://localhost:8000/admin
- **API Documentation:** http://localhost:8000/api/schema/swagger-ui/

### Option 2: Running Locally

#### Terminal 1 - Redis
```bash
redis-server
```

#### Terminal 2 - Django Backend
```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python manage.py runserver
```

#### Terminal 3 - Celery Worker
```bash
cd backend
source .venv/bin/activate
celery -A config worker --loglevel=info
```

#### Terminal 4 - Celery Beat (Scheduler)
```bash
cd backend
source .venv/bin/activate
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

#### Terminal 5 - React Frontend
```bash
cd frontend
npm run dev
```

## 🚀 Project Structure

```
crypto-exchange/
├── backend/
│   ├── apps/
│   │   ├── accounts/                    # User authentication & profiles
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── forms.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   ├── views.py
│   │   │   └── tests.py
│   │   ├── admin_panel/                 # Admin dashboard & management
│   │   │   ├── __init__.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── templates/
│   │   │       └── dashboard.html
│   │   ├── support/                     # Customer support chat
│   │   │   ├── __init__.py
│   │   │   ├── consumers.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   ├── views.py
│   │   │   └── templates/
│   │   │       └── chat.html
│   │   ├── trading/                     # Trading engine & bot system
│   │   │   ├── __init__.py
│   │   │   ├── consumers.py
│   │   │   ├── services.py
│   │   │   ├── tasks.py
│   │   │   └── bot/
│   │   │       ├── __init__.py
│   │   │       ├── simulator.py         # Bot trading logic
│   │   │       ├── strategies.py        # Trading strategies
│   │   │       └── indicators.py        # Technical analysis indicators
│   │   └── transactions/                # Deposits & withdrawals
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── views.py
│   │       ├── serializers.py
│   │       └── urls.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── asgi.py                      # ASGI configuration
│   │   ├── celery.py                    # Celery configuration
│   │   ├── urls.py                      # URL routing
│   │   ├── wsgi.py                      # WSGI configuration
│   │   └── settings/
│   │       ├── __init__.py
│   │       ├── base.py                  # Base settings
│   │       ├── development.py           # Dev settings
│   │       └── production.py            # Prod settings
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/                  # Reusable components
│   │   │   ├── charts/                  # Chart components
│   │   │   │   ├── BalanceChart.tsx
│   │   │   │   ├── ProfitChart.tsx
│   │   │   │   └── VolumeChart.tsx
│   │   │   ├── layout/                  # Layout components (Header, Sidebar, Footer)
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── AdminSupportChat.tsx
│   │   │   └── SupportChat.tsx
│   │   ├── contexts/                    # React contexts
│   │   │   ├── ThemeContext.tsx
│   │   │   └── AuthContext.tsx
│   │   ├── features/                    # Feature-based modules
│   │   │   ├── admin/                   # Admin panel pages
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── UsersTable.tsx
│   │   │   ├── auth/                    # Authentication pages
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── ResetPassword.tsx
│   │   │   ├── balance/                 # Balance & transactions
│   │   │   │   ├── BalancePage.tsx
│   │   │   │   └── TransactionHistory.tsx
│   │   │   ├── dashboard/               # Dashboard pages
│   │   │   │   ├── Overview.tsx
│   │   │   │   └── Stats.tsx
│   │   │   ├── profile/                 # User profile
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   └── EditProfile.tsx
│   │   │   ├── support/                 # Support page
│   │   │   │   ├── SupportPage.tsx
│   │   │   │   └── FAQ.tsx
│   │   │   └── trading/                 # Trading pages & bot
│   │   │       ├── TradingPage.tsx
│   │   │       ├── Orders.tsx
│   │   │       └── BotSettings.tsx
│   │   ├── i18n/                        # Internationalization
│   │   │   ├── i18n.ts
│   │   │   └── locales/
│   │   │       ├── en.json              # English translations
│   │   ├── services/                    # API services
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── profileService.ts
│   │   │   ├── tradingService.ts
│   │   │   └── supportService.ts
│   │   ├── shared/                      # Shared utilities
│   │   │   ├── hooks/                   # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useFetch.ts
│   │   │   │   └── useTheme.ts
│   │   │   ├── types/                   # TypeScript types
│   │   │   │   ├── auth.ts
│   │   │   │   ├── trading.ts
│   │   │   │   └── user.ts
│   │   │   └── utils/                   # Utility functions
│   │   │       ├── formatDate.ts
│   │   │       ├── formatCurrency.ts
│   │   │       └── validation.ts
│   │   ├── store/                       # Redux store
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── tradingSlice.ts
│   │   │   │   └── websocketSlice.ts
│   │   │   ├── hooks.ts
│   │   │   └── store.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   ├── favicon.ico
│   │   └── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── LICENSE
```

## 🚀 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register/              # Register new user
POST   /api/auth/login/                 # Login user
POST   /api/auth/logout/                # Logout user
POST   /api/auth/token/refresh/         # Refresh JWT token
GET    /api/auth/me/                    # Get current user
PATCH  /api/auth/profile/details/       # Update user profile
POST   /api/auth/change-password/       # Change password
```

### Trading Endpoints

```
GET    /api/trading/stats/              # Get trading statistics
GET    /api/trading/trades/             # List user trades
GET    /api/trading/open-positions/     # Get open positions
GET    /api/trading/active-session/     # Get active trading session
POST   /api/trading/trades/             # Create manual trade
```

### Transaction Endpoints

```
GET    /api/transactions/               # List transactions
POST   /api/transactions/deposits/      # Create deposit request
POST   /api/transactions/withdrawals/   # Create withdrawal request
GET    /api/transactions/{id}/          # Get transaction details
```

### Admin Endpoints

```
GET    /api/admin/users/                # List all users
PATCH  /api/admin/users/{id}/           # Update user
GET    /api/admin/transactions/         # List all transactions
PATCH  /api/admin/transactions/{id}/    # Update transaction status
GET    /api/admin/payment-details/      # Get payment details
POST   /api/admin/payment-details/      # Create payment method
```

### Support Endpoints

```
GET    /api/support/messages/           # Get support messages
POST   /api/support/messages/           # Send support message
POST   /api/support/messages/upload/    # Upload attachment
```

### Interactive API Documentation

Visit `http://localhost:8000/api/schema/swagger-ui/` for interactive API documentation with Swagger UI.

##  WebSocket Events

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/market/');
const userWs = new WebSocket('ws://localhost:8000/ws/user/{userId}/');
```

### Market Data Events

**Sent by server:**
```json
{
  "type": "price_update",
  "symbol": "BTC",
  "price": 45230.50,
  "change_24h": 2.5,
  "volume": 1234567890,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### User Events

**Balance Update:**
```json
{
  "type": "balance_update",
  "balance": "15250.75",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Bot Trade Update:**
```json
{
  "type": "bot_trade_update",
  "balance": "15377.60",
  "trade": {
    "id": "trade-uuid",
    "symbol": "BTC/USDT",
    "side": "buy",
    "entry_price": "45230.50",
    "exit_price": "45450.75",
    "quantity": "0.5",
    "profit_loss": "110.12",
    "profit_loss_percent": "0.49",
    "opened_at": "2025-01-15T10:25:00Z",
    "closed_at": "2025-01-15T10:30:00Z"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

##  Bot Trading System

### Bot Types

1. **Basic Bot** - Entry-level automated trading
   - Simple moving average strategy
   - Lower risk tolerance
   - Suitable for beginners

2. **Premium Bot** - Advanced trading algorithms
   - Multiple technical indicators
   - Medium risk tolerance
   - Better profit potential

3. **Specialist Bot** - Professional-grade trading
   - Complex strategies
   - Dynamic risk management
   - Maximum performance

### Bot Configuration

Bots are configured per-user in the admin panel. Key parameters:

```python
BOT_CONFIG = {
    'risk_level': 'medium',  # low, medium, high
    'max_position_size': 0.1,  # % of balance
    'stop_loss': 0.02,  # 2%
    'take_profit': 0.05,  # 5%
    'trading_pairs': ['BTC/USDT', 'ETH/USDT'],
}
```

### Bot Simulation

To run a bot simulation:

```bash
cd backend
python manage.py run_bot_simulation <user_id> --trades=50 --duration=3600
```

## 
 Internationalization

### Supported Languages

- English (en)
- Russian (ru)
- Spanish (es)
- German (de)
- French (fr)
- Japanese (ja)
-  Chinese (zh)
-  Arabic (ar)
-  Kazakh (kk)
-  Dutch (nl)
- Czech (cs)

### Adding New Translations

1. Add translation keys to `frontend/src/i18n/locales/{lang}.json`
2. Use the `t()` function in components:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('dashboard.greeting')}</h1>;
}
```

### Translation File Structure

```json
{
  "nav": {
    "home": "Home",
    "market": "Market"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout"
  }
}
```

## Theme System

### Theme Configuration

The application supports both dark and light themes with automatic system preference detection.

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Switch to {theme === 'dark' ? 'light' : 'dark'} mode
    </button>
  );
}
```

### Theme Classes

Use the `useThemeClasses` hook for consistent styling:

```tsx
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';

function MyComponent() {
  const tc = useThemeClasses();

  return (
    <div className={`${tc.bg} ${tc.textPrimary}`}>
      Content
    </div>
  );
}
```

##  Development

### Running Tests

**Backend:**
```bash
cd backend
python manage.py test
```

**Frontend:**
```bash
cd frontend
npm run test
```

### Code Quality

**Frontend Linting:**
```bash
npm run lint
npm run lint:fix
```

**Frontend Type Checking:**
```bash
npm run type-check
```

### Database Management

**Create migrations:**
```bash
python manage.py makemigrations
```

**Apply migrations:**
```bash
python manage.py migrate
```

**Reset database:**
```bash
python manage.py flush
```

### Creating Demo Data

```bash
python manage.py shell

from apps.accounts.models import User
from decimal import Decimal

# Create test user
user = User.objects.create_user(
    email='test@example.com',
    password='testpass123',
    first_name='Test',
    last_name='User',
    balance=Decimal('10000.00'),
    bot_type='premium'
)
```

## > Testing

### Backend Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.trading

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in Django settings
- [ ] Configure secure `SECRET_KEY`
- [ ] Set up PostgreSQL database
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS properly
- [ ] Set up static file serving (CDN)
- [ ] Configure email backend
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backups
- [ ] Set up load balancing (if needed)
- [ ] Enable security headers
- [ ] Configure rate limiting

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale celery_worker=3
```

### Environment-specific Settings

Create separate environment files:
- `.env.development` - Development settings
- `.env.staging` - Staging environment
- `.env.production` - Production settings

##  Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- Follow PEP 8 for Python code
- Follow ESLint configuration for TypeScript/React
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed


