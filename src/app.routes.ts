import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./components/about-page/about-page.component').then(m => m.AboutPageComponent)
  },
  {
    path: 'sponsorship',
    loadComponent: () => import('./components/sponsorship-page/sponsorship-page.component').then(m => m.SponsorshipPageComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('./components/faq-page/faq-page.component').then(m => m.FAQPageComponent)
  },
  {
    path: 'help',
    loadComponent: () => import('./components/help-center-page/help-center-page.component').then(m => m.HelpCenterPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/registration-page/registration-page.component').then(m => m.RegistrationPageComponent)
  },
  {
    path: 'member-settings',
    loadComponent: () => import('./components/member-settings-page/member-settings-page.component').then(m => m.MemberSettingsPageComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'partners',
    loadComponent: () => import('./components/partners-page/partners-page.component').then(m => m.PartnersPageComponent)
  },
  {
    path: 'promotions',
    loadComponent: () => import('./components/promotions-page/promotions-page.component').then(m => m.PromotionsPageComponent)
  },
  {
    path: 'responsible-gambling',
    loadComponent: () => import('./components/responsible-gambling-page/responsible-gambling-page.component').then(m => m.ResponsibleGamblingPageComponent)
  },
  {
    path: 'how-it-works',
    loadComponent: () => import('./components/how-it-works-page/how-it-works-page.component').then(m => m.HowItWorksPageComponent)
  },
  {
    path: 'lottery-results',
    loadComponent: () => import('./components/lottery-results-page/lottery-results-page.component').then(m => m.LotteryResultsPageComponent)
  },
  {
    path: 'lottery-result/:id',
    loadComponent: () => import('./components/lottery-result-detail/lottery-result-detail.component').then(m => m.LotteryResultDetailComponent)
  },
  {
    path: 'lottery/dashboard',
    loadComponent: () => import('./components/lottery-dashboard/lottery-dashboard.component').then(m => m.LotteryDashboardComponent)
  },
  {
    path: 'lottery/favorites',
    loadComponent: () => import('./components/lottery-favorites/lottery-favorites.component').then(m => m.LotteryFavoritesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/entries/active',
    loadComponent: () => import('./components/active-entries/active-entries.component').then(m => m.ActiveEntriesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lottery/entries/history',
    loadComponent: () => import('./components/entry-history/entry-history.component').then(m => m.EntryHistoryComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'house/:id',
    loadComponent: () => import('./components/house-detail/house-detail.component').then(m => m.HouseDetailComponent)
  },
  {
    path: 'houses/:id',
    loadComponent: () => import('./components/house-detail/house-detail.component').then(m => m.HouseDetailComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./components/search-page/search-page.component').then(m => m.SearchPageComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./components/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'settings/sessions',
    loadComponent: () => import('./components/sessions-management/sessions-management.component').then(m => m.SessionsManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./components/product-selector/product-selector.component').then(m => m.ProductSelectorComponent)
  },
  {
    path: 'payment/checkout',
    loadComponent: () => import('./components/payment-checkout/payment-checkout.component').then(m => m.PaymentCheckoutComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/stripe',
    loadComponent: () => import('./components/stripe-payment/stripe-payment.component').then(m => m.StripePaymentComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/crypto',
    loadComponent: () => import('./components/crypto-payment/crypto-payment.component').then(m => m.CryptoPaymentComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/methods',
    loadComponent: () => import('./components/payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

