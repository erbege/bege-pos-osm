# GEMINI.md - POS & Reservation System

This document provides architectural context, development standards, and operational guidelines for the POS and Reservation System project.

## Project Overview

A comprehensive Point of Sale (POS) and Reservation system built on **Laravel 12** and **React 18** via **Inertia.js**. The application manages complex inventory (Recipes/BOM), real-time table reservations, order processing, and back-office management (HR, Payroll, Reports).

### Core Technologies
- **Backend:** Laravel 12, PHP 8.2+
- **Frontend:** React 18, Tailwind CSS 4, Inertia.js (SSR supported)
- **Broadcasting:** Laravel Reverb (WebSockets) + Echo
- **State Management:** Zustand (Frontend), Service/Action Pattern (Backend)
- **Database:** MySQL/SQLite (supports multi-branch/tenant concepts)
- **Key Libraries:** Spatie Permission, Spatie Activity Log, DomPDF, Laravel Excel, SweetAlert

---

## Architecture & Patterns

The project follows a modern, decoupled architecture blending standard Laravel with Domain-Driven Design (DDD) elements.

### Directory Structure & Intent
- `app/Actions`: Single-responsibility classes for business logic (e.g., `ApproveStockOpnameAction`). Prefer these for complex operations over "fat" controllers.
- `app/Domain`: Domain-specific logic and entities (e.g., `Reservation`, `Payment`).
- `app/DTO`: Strongly typed Data Transfer Objects for passing data between layers (e.g., `StockMovementDTO`).
- `app/Services`: Larger service classes and "Engines" for complex calculations (e.g., `TableAvailabilityEngine`, `RecipeEngineService`).
- `app/Events`: Event-driven hooks (e.g., `OrderPaid`, `StockAdjusted`).
- `app/Models`: Eloquent models with custom accessors, scopes, and relationships.
- `resources/js/Pages`: React components organized by module (Admin, Pos, Kitchen).

### Backend Development Standards
- **Actions over Controllers:** Controllers should validate input (via FormRequests) and delegate logic to Action classes or Services.
- **Type Safety:** Use DTOs for complex payloads. Always type-hint parameters and return types.
- **Events:** Use Domain Events for side effects (notifications, ledger entries, stock adjustments).
- **Service Layer:** Abstract complex calculations (like recipe cost or table availability) into dedicated Service classes.

### Frontend Development Standards
- **Component Styling:** Use **Tailwind CSS 4**.
- **State Management:** Use **Zustand** for local/shared state that doesn't belong in the Inertia props.
- **React Patterns:** Prefer functional components and hooks. Use standard Inertia.js patterns for form handling and navigation.

---

## Building and Running

### Setup
```powershell
composer setup  # Runs install, env copy, key gen, migrate, npm install, and build
```

### Local Development
```powershell
composer dev    # Concurrently runs: artisan serve, queue, logs, and vite
```

### Key Commands
- **Serve:** `php artisan serve`
- **Vite:** `npm run dev`
- **Queue:** `php artisan queue:listen`
- **Broadcasting:** `php artisan reverb:start`
- **Testing:** `php artisan test`
- **Linting:** `php artisan pint`

---

## Module Specifics

### Inventory (Refactored 2026)
- **Stock Opname:** Supports "Blind Count", Variance Thresholds, and Approval workflows.
- **Recipe Engine:** Handles Bill of Materials (BOM), nested recipes, and automatic cost/availability calculation.
- **Ledger:** Detailed audit trail of every stock movement (`StockMovement` model).

### Reservations
- **Availability Engine:** `TableAvailabilityEngine` handles real-time table locking and scheduling.
- **Status Workflow:** Draft → Pending → Confirmed → Checked-In → Completed/Expired.

---

## Development Notes
- **Testing:** New features MUST include feature/unit tests in `tests/`.
- **Permissions:** Use Spatie permissions for RBAC. Check permissions in both Middleware and UI (Inertia shared props).
- **UI Consistency:** Follow the existing "Admin" and "POS" design language.

---

## TODOs / Roadmap
- [x] Implement Real-time Stock Dashboard (Added `StockDashboardController` and `StockDashboard.jsx`)
- [x] Enhance Production UI (Batch Production) (Added Recipe Explosion and availability checks)
- [x] Expand Feature Test coverage (Added `InventoryTest.php` covering Dashboard & Production)
- [x] Implement Demand Forecasting for Purchase Planning (Added `ReplenishmentService` forecasting & ADC trends)
- [x] Implement Multi-Branch Stock Transfers with Approval Workflow (3-step: Approved/Reserved → Shipped → Received)
- [x] Add AI-driven Waste Reduction Recommendations (Added `WasteAnalysisService` & Insights UI)
- [x] Develop Mobile App for Kitchen Prep and Stock Counts (Added `Kitchen/Inventory.jsx` mobile-first UI)
- [x] Integrate with External Supplier APIs for Real-time Pricing (Added `SupplierApiService` driver pattern)
- [x] Enhance HR & Attendance Module (Added complete profiles, hourly payroll, late penalties, and UI overhaul)
- [ ] Implement Multi-Currency Support for International Branches
- [ ] Add Integration for POS Hardware (Printers, Cash Drawers) via Local Bridge
- [ ] Develop Advanced Staff Performance Gamification Module
- [ ] Implement Offline-First Capabilities for Mobile Inventory Apps
