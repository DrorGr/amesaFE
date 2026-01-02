import { Routes } from '@angular/router';
import { AuthGuard } from './app/core/guards/auth.guard';
import { HomeComponent } from './app/features/shared/components/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'about',
    loadComponent: () => import('./app/features/shared/components/about-page/about-page.component').then(m => m.AboutPageComponent)
  },
  {
    path: 'sponsorship',
    loadComponent: () => import('./app/features/shared/components/sponsorship-page/sponsorship-page.component').then(m => m.SponsorshipPageComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('./app/features/shared/components/faq-page/faq-page.component').then(m => m.FAQPageComponent)
  },
  {
    path: 'help',
    loadComponent: () => import('./app/features/shared/components/help-center-page/help-center-page.component').then(m => m.HelpCenterPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./app/features/auth/components/registration-page/registration-page.component').then(m => m.RegistrationPageComponent)
  },
  {
    path: 'member-settings',
    loadComponent: () => import('./app/features/user/components/member-settings-page/member-settings-page.component').then(m => m.MemberSettingsPageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'partners',
    loadComponent: () => import('./app/features/shared/components/partners-page/partners-page.component').then(m => m.PartnersPageComponent)
  },
  {
    path: 'promotions',
    loadComponent: () => import('./app/features/promotions/components/promotions-page/promotions-page.component').then(m => m.PromotionsPageComponent)
  },
  {
    path: 'responsible-gambling',
    loadComponent: () => import('./app/features/shared/components/responsible-gambling-page/responsible-gambling-page.component').then(m => m.ResponsibleGamblingPageComponent)
  },
  {
    path: 'how-it-works',
    loadComponent: () => import('./app/features/shared/components/how-it-works-page/how-it-works-page.component').then(m => m.HowItWorksPageComponent)
  },
  {
    path: 'lottery-results',
    loadComponent: () => import('./app/features/lottery/components/lottery-results-page/lottery-results-page.component').then(m => m.LotteryResultsPageComponent)
  },
  {
    path: 'lottery-result/:id',
    loadComponent: () => import('./app/features/lottery/components/lottery-result-detail/lottery-result-detail.component').then(m => m.LotteryResultDetailComponent)
  },
  {
    path: 'lottery/dashboard',
    loadComponent: () => import('./app/features/lottery/components/lottery-dashboard/lottery-dashboard.component').then(m => m.LotteryDashboardComponent)
  },
  {
    path: 'lottery/favorites',
    loadComponent: () => import('./app/features/lottery/components/lottery-favorites/lottery-favorites.component').then(m => m.LotteryFavoritesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/favorites/analytics',
    loadComponent: () => import('./app/features/lottery/components/favorites-analytics/favorites-analytics.component').then(m => m.FavoritesAnalyticsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/entries/active',
    loadComponent: () => import('./app/features/lottery/components/active-entries/active-entries.component').then(m => m.ActiveEntriesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/entries/history',
    loadComponent: () => import('./app/features/lottery/components/entry-history/entry-history.component').then(m => m.EntryHistoryComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/tickets/:id',
    loadComponent: () => import('./app/features/lottery/components/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'house/:id',
    loadComponent: () => import('./app/features/lottery/components/house-detail/house-detail.component').then(m => m.HouseDetailComponent)
  },
  {
    path: 'houses/:id',
    loadComponent: () => import('./app/features/lottery/components/house-detail/house-detail.component').then(m => m.HouseDetailComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./app/features/shared/components/search-page/search-page.component').then(m => m.SearchPageComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./app/features/auth/components/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./app/features/auth/components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'settings/sessions',
    loadComponent: () => import('./app/features/user/components/sessions-management/sessions-management.component').then(m => m.SessionsManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./app/features/payment/components/product-selector/product-selector.component').then(m => m.ProductSelectorComponent)
  },
  {
    path: 'payment/checkout',
    loadComponent: () => import('./app/features/payment/components/payment-checkout/payment-checkout.component').then(m => m.PaymentCheckoutComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/stripe',
    loadComponent: () => import('./app/features/payment/components/stripe-payment/stripe-payment.component').then(m => m.StripePaymentComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/crypto',
    loadComponent: () => import('./app/features/payment/components/crypto-payment/crypto-payment.component').then(m => m.CryptoPaymentComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/methods',
    loadComponent: () => import('./app/features/payment/components/payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'content',
    loadComponent: () => import('./app/features/content/components/content-list/content-list.component').then(m => m.ContentListComponent)
  },
  {
    path: 'content/:id',
    loadComponent: () => import('./app/features/content/components/content-detail/content-detail.component').then(m => m.ContentDetailComponent)
  },
  {
    path: 'analytics/activity',
    loadComponent: () => import('./app/features/user/components/activity-log/activity-log.component').then(m => m.ActivityLogComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

