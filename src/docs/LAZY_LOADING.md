# Lazy Loading Implementation

This document describes the lazy loading implementation for the AmesaBase Angular application.

## Overview

The application has been refactored to use Angular Router with lazy-loaded components instead of a custom navigation system. This provides better performance, code splitting, and user experience.

## Key Features

### 1. Lazy-Loaded Routes
- All page components are loaded on-demand using `loadComponent()`
- Routes are defined in `src/app.routes.ts`
- Each route loads its component only when accessed

### 2. Custom Preloading Strategy
- Implemented in `src/app.preloading-strategy.ts`
- Routes are preloaded based on priority:
  - **High Priority** (0ms delay): about, faq, help
  - **Medium Priority** (2s delay): sponsorship, partners, how-it-works
  - **Low Priority** (5s delay): register, member-settings, promotions, responsible-gambling

### 3. Route Guards
- `AuthGuard` protects authenticated routes (e.g., member-settings)
- Automatically redirects unauthenticated users to home page

### 4. Loading States
- `RouteLoadingService` tracks navigation state
- `LoadingComponent` shows spinner during route transitions
- Performance monitoring tracks load times

### 5. Performance Monitoring
- `PerformanceService` tracks route load times
- `RoutePerformanceInterceptor` automatically measures performance
- Provides insights into slow-loading routes

## File Structure

```
src/
├── app.routes.ts                    # Route configuration
├── app.preloading-strategy.ts       # Custom preloading logic
├── components/
│   ├── home/
│   │   └── home.component.ts        # Home page component
│   └── loading/
│       └── loading.component.ts     # Loading spinner
├── guards/
│   └── auth.guard.ts               # Authentication guard
├── interceptors/
│   └── route-performance.interceptor.ts # Performance tracking
└── services/
    ├── route-loading.service.ts     # Loading state management
    └── performance.service.ts       # Performance monitoring
```

## Benefits

1. **Faster Initial Load**: Only essential code loads initially
2. **Better Performance**: Components load on-demand
3. **Code Splitting**: Automatic bundle splitting by route
4. **User Experience**: Smooth transitions with loading states
5. **Monitoring**: Performance tracking for optimization

## Usage

The lazy loading is transparent to users. Navigation works the same way, but with improved performance:

```typescript
// Navigation using Angular Router
this.router.navigate(['/about']);
this.router.navigate(['/member-settings']); // Protected route
```

## Configuration

To modify preloading behavior, update the `CustomPreloadingStrategy`:

```typescript
private getPreloadDelay(route: Route): number {
  // Customize delay based on route priority
  const highPriorityRoutes = ['about', 'faq', 'help'];
  // ... rest of logic
}
```
