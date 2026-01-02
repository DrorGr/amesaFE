import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContentService, ContentDto, ContentCategoryDto } from '../../services/content.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { firstValueFrom } from 'rxjs';
import { PagedResponse } from '@core/services/api.service';

interface ContentFilters {
  contentType?: string;
  categoryId?: string;
  language?: string;
  search?: string;
  status?: string;
  isFeatured?: boolean;
}

@Component({
  selector: 'app-content-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('content.list.title') || 'Content' }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            {{ translate('content.list.subtitle') || 'Browse our content library' }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Filters Sidebar -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {{ translate('content.filters.title') || 'Filters' }}
              </h2>

              <!-- Search Input -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('content.filters.search') || 'Search' }}
                </label>
                <input
                  type="text"
                  [(ngModel)]="filters().search"
                  (ngModelChange)="applyFilters()"
                  [placeholder]="translate('content.filters.searchPlaceholder') || 'Search content...'"
                  [attr.aria-label]="translate('content.filters.search') || 'Search'"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <!-- Content Type Filter -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('content.filters.contentType') || 'Content Type' }}
                </label>
                <select
                  [(ngModel)]="filters().contentType"
                  (ngModelChange)="applyFilters()"
                  [attr.aria-label]="translate('content.filters.contentType') || 'Content Type'"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{{ translate('content.filters.allTypes') || 'All Types' }}</option>
                  <option value="article">{{ translate('content.types.article') || 'Article' }}</option>
                  <option value="blog">{{ translate('content.types.blog') || 'Blog' }}</option>
                  <option value="news">{{ translate('content.types.news') || 'News' }}</option>
                  <option value="guide">{{ translate('content.types.guide') || 'Guide' }}</option>
                </select>
              </div>

              <!-- Category Filter -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('content.filters.category') || 'Category' }}
                </label>
                <select
                  [(ngModel)]="filters().categoryId"
                  (ngModelChange)="applyFilters()"
                  [attr.aria-label]="translate('content.filters.category') || 'Category'"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{{ translate('content.filters.allCategories') || 'All Categories' }}</option>
                  @for (category of categories(); track category.id) {
                    <option [value]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>

              <!-- Language Filter -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('content.filters.language') || 'Language' }}
                </label>
                <select
                  [(ngModel)]="filters().language"
                  (ngModelChange)="applyFilters()"
                  [attr.aria-label]="translate('content.filters.language') || 'Language'"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{{ translate('content.filters.allLanguages') || 'All Languages' }}</option>
                  <option value="en">{{ translate('languages.en') || 'English' }}</option>
                  <option value="es">{{ translate('languages.es') || 'Spanish' }}</option>
                  <option value="fr">{{ translate('languages.fr') || 'French' }}</option>
                  <option value="pl">{{ translate('languages.pl') || 'Polish' }}</option>
                </select>
              </div>

              <!-- Featured Filter -->
              <div class="mb-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="filters().isFeatured"
                    (ngModelChange)="applyFilters()"
                    class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ translate('content.filters.featuredOnly') || 'Featured Only' }}
                  </span>
                </label>
              </div>

              <!-- Reset Filters -->
              <button
                (click)="resetFilters()"
                [attr.aria-label]="translate('content.filters.reset') || 'Reset Filters'"
                class="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors">
                {{ translate('content.filters.reset') || 'Reset Filters' }}
              </button>
            </div>
          </div>

          <!-- Content List -->
          <div class="lg:col-span-3">
            <!-- Loading State -->
            @if (isLoading()) {
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                  <p class="mt-4 text-gray-600 dark:text-gray-400">
                    {{ translate('common.loading') || 'Loading...' }}
                  </p>
                </div>
              </div>
            }

            <!-- Error State -->
            @else if (error()) {
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-red-200 dark:border-red-800 border-l-4">
                <div class="flex items-start">
                  <svg class="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      {{ translate('content.error.title') || 'Error Loading Content' }}
                    </h3>
                    <p class="text-red-700 dark:text-red-300 mb-4">{{ error() }}</p>
                    <button
                      (click)="loadContent()"
                      class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      {{ translate('common.retry') || 'Retry' }}
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Empty State -->
            @else if (!isLoading() && contentData() && contentData()!.items.length === 0) {
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                <svg class="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {{ translate('content.empty.title') || 'No Content Found' }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  {{ translate('content.empty.message') || 'Try adjusting your filters to find more content.' }}
                </p>
                <button
                  (click)="resetFilters()"
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  {{ translate('content.filters.reset') || 'Reset Filters' }}
                </button>
              </div>
            }

            <!-- Content Grid -->
            @else if (contentData() && contentData()!.items.length > 0) {
              <div class="space-y-4">
                <!-- Results Header -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p class="text-gray-600 dark:text-gray-400">
                    {{ translate('content.list.resultsCount', { count: contentData()!.total }) || ('Found ' + contentData()!.total + ' items') }}
                  </p>
                </div>

                <!-- Content Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  @for (item of contentData()!.items; track item.id) {
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                      @if (item.featuredImageUrl) {
                        <div class="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <img
                            [src]="item.featuredImageUrl"
                            [alt]="item.title"
                            class="w-full h-full object-cover">
                        </div>
                      }
                      <div class="p-6">
                        <div class="flex items-center justify-between mb-2">
                          @if (item.categoryName) {
                            <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                              {{ item.categoryName }}
                            </span>
                          }
                          @if (item.isFeatured) {
                            <span class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded-full">
                              {{ translate('content.featured') || 'Featured' }}
                            </span>
                          }
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {{ item.title }}
                        </h3>
                        @if (item.excerpt) {
                          <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                            {{ item.excerpt }}
                          </p>
                        }
                        <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                          @if (item.publishedAt) {
                            <span>{{ formatDate(item.publishedAt) }}</span>
                          }
                          @if (item.viewCount !== undefined) {
                            <span>{{ item.viewCount }} {{ translate('content.views') || 'views' }}</span>
                          }
                        </div>
                        <a
                          [routerLink]="['/content', item.id]"
                          class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                          {{ translate('content.readMore') || 'Read More' }}
                        </a>
                      </div>
                    </div>
                  }
                </div>

                <!-- Pagination -->
                @if (contentData()!.totalPages > 1) {
                  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                      <button
                        (click)="previousPage()"
                        [disabled]="currentPage() === 1"
                        [attr.aria-label]="translate('content.pagination.previous') || 'Previous Page'"
                        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ translate('content.pagination.previous') || 'Previous' }}
                      </button>
                      <span class="text-gray-600 dark:text-gray-400">
                        {{ translate('content.pagination.page', { current: currentPage(), total: contentData()!.totalPages }) || ('Page ' + currentPage() + ' of ' + contentData()!.totalPages) }}
                      </span>
                      <button
                        (click)="nextPage()"
                        [disabled]="currentPage() >= contentData()!.totalPages"
                        [attr.aria-label]="translate('content.pagination.next') || 'Next Page'"
                        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ translate('content.pagination.next') || 'Next' }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ContentListComponent implements OnInit {
  private contentService = inject(ContentService);
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService);

  // State
  contentData = signal<PagedResponse<ContentDto> | null>(null);
  categories = signal<ContentCategoryDto[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);

  // Filters
  filters = signal<ContentFilters>({
    contentType: undefined,
    categoryId: undefined,
    language: undefined,
    search: undefined,
    status: 'published',
    isFeatured: undefined
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadContent();
  }

  async loadCategories(): Promise<void> {
    try {
      const cats = await firstValueFrom(this.contentService.getCategories());
      this.categories.set(cats.filter(c => c.isActive));
    } catch (err: any) {
      console.error('Error loading categories:', err);
      // Don't show error for categories, just log it
    }
  }

  async loadContent(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const params: any = {
        page: this.currentPage(),
        limit: this.pageSize()
      };

      if (this.filters().contentType) {
        params.type = this.filters().contentType;
      }
      if (this.filters().categoryId) {
        params.categoryId = this.filters().categoryId;
      }
      if (this.filters().language) {
        params.language = this.filters().language;
      }
      if (this.filters().search) {
        params.search = this.filters().search;
      }
      if (this.filters().status) {
        params.status = this.filters().status;
      }
      if (this.filters().isFeatured !== undefined) {
        params.isFeatured = this.filters().isFeatured;
      }

      const data = await firstValueFrom(this.contentService.getContent(params));
      this.contentData.set(data);
    } catch (err: any) {
      console.error('Error loading content:', err);
      this.error.set(err.message || this.translate('content.error.loadFailed') || 'Failed to load content');
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilters(): void {
    this.currentPage.set(1); // Reset to first page when filters change
    this.loadContent();
  }

  resetFilters(): void {
    this.filters.set({
      contentType: undefined,
      categoryId: undefined,
      language: undefined,
      search: undefined,
      status: 'published',
      isFeatured: undefined
    });
    this.currentPage.set(1);
    this.loadContent();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadContent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.contentData() && this.currentPage() < this.contentData()!.totalPages) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadContent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.localeService.formatDate(d, 'medium');
  }

  translate(key: string, params?: any): string {
    if (params) {
      return this.translationService.translateWithParams(key, params);
    }
    return this.translationService.translate(key);
  }
}




