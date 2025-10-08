import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  searchTerms: string[];
}

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-64 md:h-80">
          <!-- Background Image -->
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="FAQ Support" 
              class="w-full h-full object-cover">
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('faq.heroTitle') }}
              </h1>
              <p class="text-2xl md:text-xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('faq.heroSubtitle') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Search Section -->
        <section class="mb-12">
          <div class="max-w-2xl mx-auto">
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                [placeholder]="translate('faq.searchPlaceholder')"
                class="w-full px-6 py-4 pl-12 text-2xl border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg">
              <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            @if (searchQuery && filteredFAQs().length === 0) {
              <p class="text-center text-gray-600 dark:text-gray-400 mt-4">
                {{ translate('faq.noResults') }}
              </p>
            }
          </div>
        </section>

        <!-- Category Filter -->
        <section class="mb-12">
          <div class="flex flex-wrap justify-center gap-4">
            <button
              (click)="filterByCategory('all')"
              [class]="selectedCategory() === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
              class="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
              {{ translate('faq.allCategories') }}
            </button>
            @for (category of categories; track category.id) {
              <button
                (click)="filterByCategory(category.id)"
                [class]="selectedCategory() === category.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
                class="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                {{ translate(category.name) }}
              </button>
            }
          </div>
        </section>

        <!-- FAQ Content -->
        <section class="mb-16">
          @if (searchQuery) {
            <!-- Search Results -->
            <div class="space-y-6">
              @for (faq of filteredFAQs(); track faq.id) {
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <button
                    (click)="toggleFAQ(faq.id)"
                    class="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none">
                    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white pr-4">
                      {{ translate(faq.question) }}
                    </h3>
                    <svg 
                      [class.rotate-180]="openFAQs().includes(faq.id)"
                      class="w-6 h-6 text-blue-600 dark:text-blue-400 transition-transform duration-200 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  @if (openFAQs().includes(faq.id)) {
                    <div class="px-8 pb-6">
                      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {{ translate(faq.answer) }}
                        </p>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <!-- Category-based FAQ -->
            @for (category of categories; track category.id) {
              @if (selectedCategory() === 'all' || selectedCategory() === category.id) {
                <div class="mb-12">
                  <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                    <span class="text-3xl mr-4">{{ category.icon }}</span>
                    {{ translate(category.name) }}
                  </h2>
                  <div class="space-y-4">
                    @for (faq of getFAQsByCategory(category.id); track faq.id) {
                      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                        <button
                          (click)="toggleFAQ(faq.id)"
                          class="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none">
                          <h3 class="text-2xl font-semibold text-gray-900 dark:text-white pr-4">
                            {{ translate(faq.question) }}
                          </h3>
                          <svg 
                            [class.rotate-180]="openFAQs().includes(faq.id)"
                            class="w-6 h-6 text-blue-600 dark:text-blue-400 transition-transform duration-200 flex-shrink-0" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </button>
                        @if (openFAQs().includes(faq.id)) {
                          <div class="px-8 pb-6">
                            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {{ translate(faq.answer) }}
                              </p>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            }
          }
        </section>

        <!-- Contact CTA Section -->
        <section class="text-center">
          <div class="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 class="text-3xl md:text-4xl font-bold mb-6">
              {{ translate('faq.stillHaveQuestions') }}
            </h2>
            <p class="text-xl mb-8 max-w-2xl mx-auto">
              {{ translate('faq.contactDescription') }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button class="btn-primary bg-white text-blue-600 hover:bg-gray-100 text-2xl px-8 py-4">
                {{ translate('faq.contactSupport') }}
              </button>
              <button class="btn-outline border-white text-white hover:bg-white hover:text-blue-600 text-2xl px-8 py-4">
                {{ translate('faq.askAmesaAgent') }}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
  `]
})
export class FAQPageComponent {
  private translationService = inject(TranslationService);

  searchQuery = '';
  selectedCategory = signal('all');
  openFAQs = signal<string[]>([]);

  categories = [
    { id: 'general', name: 'faq.generalQuestions', icon: '🎲' },
    { id: 'payments', name: 'faq.paymentsWithdrawals', icon: '💳' },
    { id: 'account', name: 'faq.accountTechnical', icon: '🧑‍💻' },
    { id: 'gambling', name: 'faq.responsibleGambling', icon: '🛡' },
    { id: 'support', name: 'faq.supportContact', icon: '📞' }
  ];

  faqs: FAQItem[] = [
    // General Questions
    {
      id: 'general-1',
      question: 'faq.generalQ1',
      answer: 'faq.generalA1',
      category: 'general',
      searchTerms: ['platform', 'about', 'what', 'lottery', 'entertainment', 'profits', 'shelters']
    },
    {
      id: 'general-2',
      question: 'faq.generalQ2',
      answer: 'faq.generalA2',
      category: 'general',
      searchTerms: ['winner', 'pay', 'extra', 'payments', 'vat', 'tax', 'legal', 'accountancy']
    },
    {
      id: 'general-3',
      question: 'faq.generalQ3',
      answer: 'faq.generalA3',
      category: 'general',
      searchTerms: ['who', 'can', 'use', 'platform', 'age', 'requirements', 'legal']
    },
    {
      id: 'general-4',
      question: 'faq.generalQ4',
      answer: 'faq.generalA4',
      category: 'general',
      searchTerms: ['regulated', 'platform', 'compliance', 'fair-play', 'security', 'transparency']
    },
    {
      id: 'general-5',
      question: 'faq.generalQ5',
      answer: 'faq.generalA5',
      category: 'general',
      searchTerms: ['minimum', 'requirements', 'lottery', 'participation', 'capacity', '75%']
    },
    {
      id: 'general-6',
      question: 'faq.generalQ6',
      answer: 'faq.generalA6',
      category: 'general',
      searchTerms: ['factors', 'lottery', 'execute', 'participation', 'capacity', 'refund']
    },
    {
      id: 'general-7',
      question: 'faq.generalQ7',
      answer: 'faq.generalA7',
      category: 'general',
      searchTerms: ['condo', 'visit', 'see', 'asset', 'win', 'contract', 'attorney', 'insurance', 'buyback']
    },
    {
      id: 'general-8',
      question: 'faq.generalQ8',
      answer: 'faq.generalA8',
      category: 'general',
      searchTerms: ['rewarded', 'prize', 'attorney', 'accountant', 'scratch', 'cards', 'delivery']
    },

    // Payments & Withdrawals
    {
      id: 'payments-1',
      question: 'faq.paymentsQ1',
      answer: 'faq.paymentsA1',
      category: 'payments',
      searchTerms: ['payment', 'methods', 'accept', 'credit', 'debit', 'cards', 'paypal', 'stripe']
    },
    {
      id: 'payments-2',
      question: 'faq.paymentsQ2',
      answer: 'faq.paymentsA2',
      category: 'payments',
      searchTerms: ['withdrawals', 'how', 'long', 'take', 'processed', 'hours']
    },
    {
      id: 'payments-3',
      question: 'faq.paymentsQ3',
      answer: 'faq.paymentsA3',
      category: 'payments',
      searchTerms: ['payments', 'secure', 'encrypted', 'ssl', 'pci', 'compliant']
    },
    {
      id: 'payments-4',
      question: 'faq.paymentsQ4',
      answer: 'faq.paymentsA4',
      category: 'payments',
      searchTerms: ['money', 'back', 'guarantee', 'refund', 'lottery', 'execute', 'cancel']
    },

    // Account & Technical Issues
    {
      id: 'account-1',
      question: 'faq.accountQ1',
      answer: 'faq.accountA1',
      category: 'account',
      searchTerms: ['forgot', 'password', 'reset', 'email', 'login']
    },
    {
      id: 'account-2',
      question: 'faq.accountQ2',
      answer: 'faq.accountA2',
      category: 'account',
      searchTerms: ['change', 'account', 'details', 'personal', 'info', 'settings']
    },
    {
      id: 'account-3',
      question: 'faq.accountQ3',
      answer: 'faq.accountA3',
      category: 'account',
      searchTerms: ['app', 'loading', 'fix', 'cache', 'update', 'internet', 'connection', 'support']
    },

    // Responsible Gambling
    {
      id: 'gambling-1',
      question: 'faq.gamblingQ1',
      answer: 'faq.gamblingA1',
      category: 'gambling',
      searchTerms: ['gambling', 'limits', 'deposit', 'loss', 'session', 'settings']
    },
    {
      id: 'gambling-2',
      question: 'faq.gamblingQ2',
      answer: 'faq.gamblingA2',
      category: 'gambling',
      searchTerms: ['break', 'self-exclusion', 'pause', 'account', 'period']
    },
    {
      id: 'gambling-3',
      question: 'faq.gamblingQ3',
      answer: 'faq.gamblingA3',
      category: 'gambling',
      searchTerms: ['support', 'problem', 'gambling', 'helplines', 'responsible']
    },

    // Support & Contact
    {
      id: 'support-1',
      question: 'faq.supportQ1',
      answer: 'faq.supportA1',
      category: 'support',
      searchTerms: ['customer', 'support', 'chat', 'email', 'call', 'contact']
    },
    {
      id: 'support-2',
      question: 'faq.supportQ2',
      answer: 'faq.supportA2',
      category: 'support',
      searchTerms: ['support', 'available', '24/7', 'hours', 'team']
    },
    {
      id: 'support-3',
      question: 'faq.supportQ3',
      answer: 'faq.supportA3',
      category: 'support',
      searchTerms: ['updates', 'announcements', 'news', 'social', 'media', 'newsletter']
    }
  ];

  filteredFAQs = signal<FAQItem[]>([]);

  constructor() {
    this.filteredFAQs.set(this.faqs);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredFAQs.set(this.faqs);
      return;
    }

    const query = this.searchQuery.toLowerCase();
    const filtered = this.faqs.filter(faq => 
      faq.searchTerms.some(term => term.toLowerCase().includes(query)) ||
      this.translate(faq.question).toLowerCase().includes(query) ||
      this.translate(faq.answer).toLowerCase().includes(query)
    );
    
    this.filteredFAQs.set(filtered);
  }

  filterByCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.searchQuery = '';
    
    if (categoryId === 'all') {
      this.filteredFAQs.set(this.faqs);
    } else {
      this.filteredFAQs.set(this.faqs.filter(faq => faq.category === categoryId));
    }
  }

  getFAQsByCategory(categoryId: string): FAQItem[] {
    return this.faqs.filter(faq => faq.category === categoryId);
  }

  toggleFAQ(faqId: string) {
    const currentOpen = this.openFAQs();
    if (currentOpen.includes(faqId)) {
      this.openFAQs.set(currentOpen.filter(id => id !== faqId));
    } else {
      this.openFAQs.set([...currentOpen, faqId]);
    }
  }
}
