import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '@core/services/analytics.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';
import { firstValueFrom } from 'rxjs';

interface ActivityLogItem {
  id: string;
  activityType: string;
  activityName: string;
  timestamp: Date | string;
  details?: any;
  // Note: IP address and User-Agent are NOT included (PII redaction)
}

interface ActivityFilters {
  startDate?: string;
  endDate?: string;
  activityType?: string;
}

interface ActivityResponse {
  items: ActivityLogItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {{ translate('analytics.activity.title') || 'Activity Log' }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            {{ translate('analytics.activity.description') || 'View your account activity history' }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Filters Sidebar -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {{ translate('analytics.activity.filters.title') || 'Filters' }}
              </h2>

              <!-- Date Range -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('analytics.activity.filters.dateRange') || 'Date Range' }}
                </label>
                <div class="space-y-2">
                  <input
                    type="date"
                    [(ngModel)]="filters().startDate"
                    (ngModelChange)="applyFilters()"
                    [attr.aria-label]="translate('analytics.activity.filters.startDate') || 'Start Date'"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <input
                    type="date"
                    [(ngModel)]="filters().endDate"
                    (ngModelChange)="applyFilters()"
                    [attr.aria-label]="translate('analytics.activity.filters.endDate') || 'End Date'"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                </div>
              </div>

              <!-- Activity Type Filter -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ translate('analytics.activity.filters.activityType') || 'Activity Type' }}
                </label>
                <select
                  [(ngModel)]="filters().activityType"
                  (ngModelChange)="applyFilters()"
                  [attr.aria-label]="translate('analytics.activity.filters.activityType') || 'Activity Type'"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{{ translate('analytics.activity.filters.allTypes') || 'All Types' }}</option>
                  <option value="page_view">{{ translate('analytics.activity.types.pageView') || 'Page View' }}</option>
                  <option value="user_action">{{ translate('analytics.activity.types.userAction') || 'User Action' }}</option>
                  <option value="ecommerce">{{ translate('analytics.activity.types.ecommerce') || 'E-commerce' }}</option>
                  <option value="custom">{{ translate('analytics.activity.types.custom') || 'Custom' }}</option>
                </select>
              </div>

              <!-- Reset Filters -->
              <button
                (click)="resetFilters()"
                [attr.aria-label]="translate('analytics.activity.filters.reset') || 'Reset Filters'"
                class="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors">
                {{ translate('analytics.activity.filters.reset') || 'Reset Filters' }}
              </button>
            </div>
          </div>

          <!-- Activity List -->
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
                      {{ translate('analytics.activity.error.title') || 'Error Loading Activity' }}
                    </h3>
                    <p class="text-red-700 dark:text-red-300 mb-4">{{ error() }}</p>
                    <button
                      (click)="loadActivity()"
                      class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      {{ translate('common.retry') || 'Retry' }}
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Empty State -->
            @else if (!isLoading() && activityData() && activityData()!.items.length === 0) {
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                <svg class="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {{ translate('analytics.activity.empty.title') || 'No Activity Found' }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ translate('analytics.activity.empty.message') || 'No activity records found for the selected filters.' }}
                </p>
              </div>
            }

            <!-- Activity List -->
            @else if (activityData() && activityData()!.items.length > 0) {
              <div class="space-y-4">
                <!-- Results Header -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p class="text-gray-600 dark:text-gray-400">
                    {{ translate('analytics.activity.resultsCount', { count: activityData()!.totalItems }) || ('Found ' + activityData()!.totalItems + ' activities') }}
                  </p>
                </div>

                <!-- Activity Items -->
                <div class="space-y-3">
                  @for (item of activityData()!.items; track item.id) {
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-2">
                            <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                              {{ getActivityTypeLabel(item.activityType) }}
                            </span>
                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                              {{ item.activityName }}
                            </span>
                          </div>
                          @if (item.details && hasDetails(item.details)) {
                            <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <details class="cursor-pointer">
                                <summary class="font-medium">{{ translate('analytics.activity.details') || 'Details' }}</summary>
                                <pre class="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs overflow-x-auto">{{ formatDetails(item.details) }}</pre>
                              </details>
                            </div>
                          }
                        </div>
                        <div class="ml-4 text-right">
                          <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ formatDate(item.timestamp) }}
                          </p>
                          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {{ formatTime(item.timestamp) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Pagination -->
                @if (activityData()!.totalPages > 1) {
                  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                      <button
                        (click)="previousPage()"
                        [disabled]="currentPage() === 1"
                        [attr.aria-label]="translate('analytics.activity.pagination.previous') || 'Previous Page'"
                        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ translate('analytics.activity.pagination.previous') || 'Previous' }}
                      </button>
                      <span class="text-gray-600 dark:text-gray-400">
                        {{ translate('analytics.activity.pagination.page', { current: currentPage(), total: activityData()!.totalPages }) || ('Page ' + currentPage() + ' of ' + activityData()!.totalPages) }}
                      </span>
                      <button
                        (click)="nextPage()"
                        [disabled]="currentPage() >= activityData()!.totalPages"
                        [attr.aria-label]="translate('analytics.activity.pagination.next') || 'Next Page'"
                        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ translate('analytics.activity.pagination.next') || 'Next' }}
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
export class ActivityLogComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService);

  // State
  activityData = signal<ActivityResponse | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  pageSize = signal(20);

  // Filters
  filters = signal<ActivityFilters>({
    startDate: undefined,
    endDate: undefined,
    activityType: undefined
  });

  ngOnInit(): void {
    this.loadActivity();
  }

  async loadActivity(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const params: any = {
        page: this.currentPage(),
        limit: this.pageSize()
      };

      if (this.filters().startDate) {
        params.startDate = this.filters().startDate;
      }
      if (this.filters().endDate) {
        params.endDate = this.filters().endDate;
      }
      if (this.filters().activityType) {
        params.activityType = this.filters().activityType;
      }

      const data = await firstValueFrom(this.analyticsService.getActivity(params));
      
      // Transform response to ActivityResponse format
      // Backend may return different structure, so we normalize it
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          // If it's just an array, wrap it
          this.activityData.set({
            items: data.map(this.normalizeActivityItem),
            totalItems: data.length,
            totalPages: 1,
            currentPage: 1,
            pageSize: this.pageSize()
          });
        } else if (data.items || data.data) {
          // If it has items or data property
          const items = data.items || data.data || [];
          this.activityData.set({
            items: items.map(this.normalizeActivityItem),
            totalItems: data.totalItems || data.total || items.length,
            totalPages: data.totalPages || Math.ceil((data.totalItems || items.length) / this.pageSize()),
            currentPage: data.currentPage || this.currentPage(),
            pageSize: data.pageSize || this.pageSize()
          });
        }
      } else {
        this.activityData.set({
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: this.pageSize()
        });
      }
    } catch (err: any) {
      console.error('Error loading activity:', err);
      this.error.set(err.message || this.translate('analytics.activity.error.loadFailed') || 'Failed to load activity');
    } finally {
      this.isLoading.set(false);
    }
  }

  normalizeActivityItem(item: any): ActivityLogItem {
    return {
      id: item.id || item.activityId || '',
      activityType: item.activityType || item.eventType || item.type || 'unknown',
      activityName: item.activityName || item.eventName || item.name || 'Unknown Activity',
      timestamp: item.timestamp || item.createdAt || item.date || new Date().toISOString(),
      details: item.details || item.properties || item.data
      // Explicitly NOT including IP address or User-Agent (PII redaction)
    };
  }

  applyFilters(): void {
    this.currentPage.set(1); // Reset to first page when filters change
    this.loadActivity();
  }

  resetFilters(): void {
    this.filters.set({
      startDate: undefined,
      endDate: undefined,
      activityType: undefined
    });
    this.currentPage.set(1);
    this.loadActivity();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadActivity();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.activityData() && this.currentPage() < this.activityData()!.totalPages) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadActivity();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getActivityTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'page_view': this.translate('analytics.activity.types.pageView') || 'Page View',
      'user_action': this.translate('analytics.activity.types.userAction') || 'User Action',
      'ecommerce': this.translate('analytics.activity.types.ecommerce') || 'E-commerce',
      'custom': this.translate('analytics.activity.types.custom') || 'Custom'
    };
    return labels[type] || type;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.localeService.formatDate(d, 'medium');
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.localeService.formatTime(d);
  }

  hasDetails(details: any): boolean {
    if (!details || typeof details !== 'object' || details === null) {
      return false;
    }
    return Object.keys(details).length > 0;
  }

  formatDetails(details: any): string {
    // Remove any PII that might have slipped through
    const safeDetails = { ...details };
    delete safeDetails.ipAddress;
    delete safeDetails.userAgent;
    delete safeDetails.ip;
    delete safeDetails.user_agent;
    return JSON.stringify(safeDetails, null, 2);
  }

  translate(key: string, params?: any): string {
    if (params) {
      return this.translationService.translateWithParams(key, params);
    }
    return this.translationService.translate(key);
  }
}




