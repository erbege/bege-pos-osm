# POS (Point of Sale) System - Project Context

## Project Overview

This is a **Laravel 12-based Point of Sale (POS) and Restaurant Management System** built with modern full-stack technologies. The application handles comprehensive restaurant operations including:

- **POS Operations**: Cashier panel, order management, payment processing
- **Kitchen Display System (KDS)**: Order tracking, item status management
- **Inventory Management**: Stock tracking, purchase orders, stock opname, transfers
- **HR Management**: Employee attendance, payroll, leave requests, overtime, performance reviews
- **Reservation System**: Table booking, reservation events, payment
- **Financial Management**: Expenses, income, financial ledger reporting
- **Multi-branch Support**: Branch management and switching
- **Customer-Facing**: Online menu, cart, checkout, order status tracking

## Technology Stack

### Backend
- **Framework**: Laravel 12.x
- **PHP**: 8.2+
- **Database**: SQLite (default), supports MySQL/PostgreSQL
- **Authentication**: Laravel Sanctum + Laravel Breeze
- **Authorization**: Spatie Laravel Permission (roles: Admin, Owner, Cashier, Kitchen)
- **Real-time**: Laravel Reverb (WebSocket server), Laravel Echo, Pusher
- **PDF Generation**: DomPDF
- **Excel Export**: Maatwebsite Excel
- **Activity Logging**: Spatie Laravel Activitylog
- **Notifications**: SweetAlert2

### Frontend
- **Library**: React 18.x
- **Inertia.js**: Server-driven SPA (Inertia React adapter)
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand
- **Charts**: Recharts
- **Build Tool**: Vite 7.x
- **UI Components**: Headless UI

## Project Structure

```
├── app/
│   ├── Actions/           # Action classes (business logic)
│   ├── Broadcasting/      # Event broadcasting classes
│   ├── Console/           # Artisan commands
│   ├── Domain/            # Domain-driven design modules (Payment, Reservation)
│   ├── DTO/               # Data Transfer Objects
│   ├── Events/            # Event classes
│   ├── Exports/           # Excel/PDF export classes
│   ├── Http/
│   │   ├── Controllers/   # Request handlers (Admin, POS, Kitchen, Customer)
│   │   ├── Middleware/    # HTTP middleware
│   │   └── Requests/      # Form request validation
│   ├── Jobs/              # Queueable job classes
│   ├── Listeners/         # Event listeners
│   ├── Models/            # Eloquent models (40+ entities)
│   ├── Notifications/     # Notification classes
│   ├── Providers/         # Service providers
│   ├── Scopes/            # Eloquent query scopes
│   ├── Services/          # Service classes
│   ├── States/            # State management classes
│   └── Traits/            # Reusable traits
├── bootstrap/             # Application bootstrapping
├── config/                # Configuration files
├── database/
│   ├── factories/         # Model factories for testing
│   ├── migrations/        # Database migrations
│   └── seeders/           # Database seeders
├── public/                # Public assets (entry point)
├── resources/
│   ├── css/               # Stylesheets
│   ├── js/
│   │   ├── Components/    # React components
│   │   ├── Layouts/       # Layout components
│   │   ├── Lib/           # JavaScript libraries
│   │   ├── Pages/         # Inertia page components
│   │   │   ├── Admin/     # Admin panel pages
│   │   │   ├── POS/       # POS interface
│   │   │   ├── Kitchen/   # Kitchen display
│   │   │   ├── Customer/  # Customer-facing pages
│   │   │   └── Reservation/ # Reservation pages
│   │   ├── Stores/        # Zustand state stores
│   │   └── app.jsx        # Frontend entry point
│   └── views/             # Blade templates
├── routes/
│   ├── web.php            # Web routes (main routing)
│   ├── api.php            # API routes
│   ├── auth.php           # Authentication routes
│   └── channels.php       # Broadcasting channels
├── storage/               # Logs, uploads, cache
└── tests/                 # PHPUnit tests
```

## Key Domain Models

### Core Business
- `Branch`, `Setting`, `AuditLog`
- `User`, `Employee`, `Shift`, `Attendance`, `AttendanceCorrection`, `AttendanceSetting`
- `Category`, `Menu`, `Recipe`, `Material`, `Modifier`, `ModifierIngredient`
- `Table`, `Room`, `Reservation`, `ReservationMenu`, `ReservationPayment`, `ReservationTable`, `ReservationEvent`

### Orders & Transactions
- `Order`, `OrderItem`, `Transaction`, `Payment`
- `ProductionOrder`, `StockReservation`

### Inventory & Supply Chain
- `StockMovement`, `StockOpnameSession`, `StockOpnameItem`
- `StockTransfer`, `PurchaseOrder`, `PurchaseOrderItem`, `Supplier`

### HR & Payroll
- `LeaveRequest`, `OvertimeRequest`, `Payroll`, `CashAdvance`, `PerformanceReview`

### Finance
- `Expense`, `Income`

## Building and Running

### Initial Setup
```bash
# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Run migrations and seeders
php artisan migrate --seed

# Build frontend assets
npm run build

# Start development server
php artisan serve
```

### Development Mode (Recommended)
```bash
# Run all development services concurrently (server, queue, logs, vite)
composer run dev
```

### Alternative Manual Start
```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite dev server
npm run dev

# Terminal 3: Queue worker
php artisan queue:work

# Terminal 4: Reverb (WebSocket server)
php artisan reverb:start
```

### Testing
```bash
# Run all tests
composer run test
# or
php artisan test

# Run specific test suite
php artisan test --testsuite=Unit
php artisan test --testsuite=Feature
```

### Code Quality
```bash
# Format code with Laravel Pint
./vendor/bin/pint

# Static analysis (if PHPStan/Psalm configured)
./vendor/bin/phpstan
```

## Architecture Patterns

### Domain-Driven Design (DDD)
The project uses DDD principles with domain-specific directories:
- `app/Domain/Payment/` - Payment-related logic, enums, value objects
- `app/Domain/Reservation/` - Reservation business logic

### Inertia.js Pattern
- Controllers return `Inertia::render()` with props instead of Blade views
- React components in `resources/js/Pages/` map to routes
- Shared layouts in `resources/js/Layouts/`

### State Management
- **Zustand** stores in `resources/js/Stores/` for client-side state
- Server state managed through Inertia props

### Repository/Service Pattern
- Business logic encapsulated in `app/Services/` and `app/Actions/`
- DTOs in `app/DTO/` for structured data transfer

## Key Features

### Payment Integration
- Multiple payment providers (QRIS, etc.)
- Webhook callbacks with signature verification
- Payment simulation endpoint for testing

### Role-Based Access Control (RBAC)
- **Admin/Owner**: Full access to all features
- **Cashier**: POS, pending orders, payment confirmation
- **Kitchen**: Kitchen display, order status updates

### Real-time Features
- Order status updates via WebSockets
- Kitchen order notifications
- Live dashboard updates

### Stock Management
- Automated stock deduction on orders
- Stock opname (inventory counting) workflow
- Inter-branch stock transfers
- Purchase order planning and approval

## Environment Variables

Key configuration in `.env`:

```env
# Database
DB_CONNECTION=sqlite
# Or MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=pos_db
# DB_USERNAME=root
# DB_PASSWORD=

# Session, Cache, Queue (using database for persistence)
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# Broadcasting (Real-time)
BROADCAST_CONNECTION=log  # Use 'reverb' or 'pusher' in production

# Payment Gateway
FONNTE_TOKEN=your_fonnte_token_here
```

## Development Conventions

### Naming Conventions
- **Controllers**: PascalCase with suffix (e.g., `MenuController`, `StockOpnameController`)
- **Models**: Singular PascalCase (e.g., `Order`, `PurchaseOrder`)
- **Routes**: kebab-case with descriptive prefixes (e.g., `admin.stock-opname.index`)
- **React Components**: PascalCase (e.g., `OrderTable.jsx`, `PaymentModal.jsx`)

### Code Organization
- Controllers organized by domain (Admin/, POS/, Customer/)
- Related functionality grouped in nested controllers (e.g., `Pos/PosOrderController`)
- Complex business logic in Actions/Services, not controllers

### Testing Practices
- Feature tests in `tests/Feature/`
- Unit tests in `tests/Unit/`
- Uses SQLite in-memory database for fast test execution
- Model factories for test data generation

## API Endpoints

### Internal APIs
- `POST /api/v1/discounts/validate` - Validate discount codes
- `POST /api/v1/tables/layout` - Update table layout

### Webhooks
- `POST /payment/callback/{provider}` - Payment provider webhooks
- `GET /payment/simulate` - Payment simulation (testing)

## Common Tasks

### Add New Menu Item
```bash
php artisan make:controller Admin/NewFeatureController --resource
php artisan make:model NewFeature -mfs  # migration, factory, seeder
```

### Create New Domain Module
```bash
mkdir -p app/Domain/NewDomain/{Actions,Enums,Services,DTO}
```

### Database Operations
```bash
# Create migration
php artisan make:migration create_new_table

# Run migrations
php artisan migrate

# Rollback
php artisan migrate:rollback

# Seed database
php artisan db:seed
```

### Frontend Development
```bash
# Start Vite dev server with HMR
npm run dev

# Production build
npm run build
```

## Troubleshooting

### Common Issues

**Queue not processing:**
```bash
php artisan queue:restart
php artisan queue:work --tries=3
```

**WebSocket not connecting:**
```bash
# Check Reverb is running
php artisan reverb:start

# Verify BROADCAST_CONNECTION in .env
```

**Asset build errors:**
```bash
rm -rf node_modules public/build
npm install
npm run build
```

**Database issues:**
```bash
# Reset SQLite database
rm database/database.sqlite
touch database/database.sqlite
php artisan migrate --seed
```

## Additional Resources

- **Laravel Docs**: https://laravel.com/docs
- **Inertia.js Docs**: https://inertiajs.com
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
