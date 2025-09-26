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
    path: '**',
    redirectTo: ''
  }
];
