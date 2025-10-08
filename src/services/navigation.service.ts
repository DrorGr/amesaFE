import { Injectable, signal } from '@angular/core';

export type Page = 'home' | 'about' | 'sponsorship' | 'faq' | 'help' | 'register' | 'member-settings' | 'partners' | 'promotions' | 'responsible-gambling' | 'how-it-works';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private currentPage = signal<Page>('home');
  
  getCurrentPage() {
    return this.currentPage.asReadonly();
  }
  
  navigateTo(page: Page) {
    this.currentPage.set(page);
  }
  
  isCurrentPage(page: Page): boolean {
    return this.currentPage() === page;
  }
}
