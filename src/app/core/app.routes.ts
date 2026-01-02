import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from '../features/shared/components/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'about',
    loadComponent: () => import('../features/shared/components/about-page/about-page.component').then(m => m.AboutPageComponent)
  },
  {
    path: 'sponsorship',
    loadComponent: () => import('../features/shared/components/sponsorship-page/sponsorship-page.component').then(m => m.SponsorshipPageComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('../features/shared/components/faq-page/faq-page.component').then(m => m.FAQPageComponent)
  },
  {
    path: 'help',
    loadComponent: () => import('../features/shared/components/help-center-page/help-center-page.component').then(m => m.HelpCenterPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('../features/auth/components/registration-page/registration-page.component').then(m => m.RegistrationPageComponent)
  },
  {
    path: 'member-settings',
    loadComponent: () => import('../features/user/components/member-settings-page/member-settings-page.component').then(m => m.MemberSettingsPageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'partners',
    loadComponent: () => import('../features/shared/components/partners-page/partners-page.component').then(m => m.PartnersPageComponent)
  },
  {
    path: 'promotions',
    loadComponent: () => import('../features/promotions/components/promotions-page/promotions-page.component').then(m => m.PromotionsPageComponent)
  },
  {
    path: 'responsible-gambling',
    loadComponent: () => import('../features/shared/components/responsible-gambling-page/responsible-gambling-page.component').then(m => m.ResponsibleGamblingPageComponent)
  },
  {
    path: 'how-it-works',
    loadComponent: () => import('../features/shared/components/how-it-works-page/how-it-works-page.component').then(m => m.HowItWorksPageComponent)
  },
  {
    path: 'lottery-results',
    loadComponent: () => import('../features/lottery/components/lottery-results-page/lottery-results-page.component').then(m => m.LotteryResultsPageComponent)
  },
  {
    path: 'lottery-result/:id',
    loadComponent: () => import('../features/lottery/components/lottery-result-detail/lottery-result-detail.component').then(m => m.LotteryResultDetailComponent)
  },
  {
    path: 'lottery/dashboard',
    loadComponent: () => import('../features/lottery/components/lottery-dashboard/lottery-dashboard.component').then(m => m.LotteryDashboardComponent)
  },
  {
    path: 'lottery/favorites',
    loadComponent: () => import('../features/lottery/components/lottery-favorites/lottery-favorites.component').then(m => m.LotteryFavoritesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/favorites/analytics',
    loadComponent: () => import('../features/lottery/components/favorites-analytics/favorites-analytics.component').then(m => m.FavoritesAnalyticsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/entries/active',
    loadComponent: () => import('../features/lottery/components/active-entries/active-entries.component').then(m => m.ActiveEntriesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/entries/history',
    loadComponent: () => import('../features/lottery/components/entry-history/entry-history.component').then(m => m.EntryHistoryComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/tickets/:id',
    loadComponent: () => import('../features/lottery/components/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'house/:id',
    loadComponent: () => import('../features/lottery/components/house-detail/house-detail.component').then(m => m.HouseDetailComponent)
  },
  {
    path: 'houses/:id',
    loadComponent: () => import('../features/lottery/components/house-detail/house-detail.component').then(m => m.HouseDetailComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('../features/shared/components/search-page/search-page.component').then(m => m.SearchPageComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('../features/auth/components/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('../features/auth/components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'settings/sessions',
    loadComponent: () => import('../features/user/components/sessions-management/sessions-management.component').then(m => m.SessionsManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('../features/payment/components/product-selector/product-selector.component').then(m => m.ProductSelectorComponent)
  },
  {
    path: 'payment/checkout',
    loadComponent: () => import('../features/payment/components/payment-checkout/payment-checkout.component').then(m => m.PaymentCheckoutComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/stripe',
    loadComponent: () => import('../features/payment/components/stripe-payment/stripe-payment.component').then(m => m.StripePaymentComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/crypto',
    loadComponent: () => import('../features/payment/components/crypto-payment/crypto-payment.component').then(m => m.CryptoPaymentComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/methods',
    loadComponent: () => import('../features/payment/components/payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'content',
    loadComponent: () => import('../features/content/components/content-list/content-list.component').then(m => m.ContentListComponent)
  },
  {
    path: 'content/:id',
    loadComponent: () => import('../features/content/components/content-detail/content-detail.component').then(m => m.ContentDetailComponent)
  },
  {
    path: 'analytics/activity',
    loadComponent: () => import('../features/user/components/activity-log/activity-log.component').then(m => m.ActivityLogComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

