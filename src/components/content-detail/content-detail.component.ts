import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContentService, ContentDto } from '../../services/content.service';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-content-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div class="max-w-4xl mx-auto">
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
                  @if (error() === 'NOT_FOUND') {
                    {{ translate('content.error.notFound') || 'Content Not Found' }}
                  } @else {
                    {{ translate('content.error.title') || 'Error Loading Content' }}
                  }
                </h3>
                @if (error() !== 'NOT_FOUND') {
                  <p class="text-red-700 dark:text-red-300 mb-4">{{ error() }}</p>
                }
                <div class="flex gap-4">
                  <button
                    (click)="loadContent()"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    {{ translate('common.retry') || 'Retry' }}
                  </button>
                  <button
                    (click)="goBack()"
                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                    {{ translate('common.back') || 'Back' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Content Display -->
        @else if (content()) {
          <article class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <!-- Featured Image -->
            @if (content()!.featuredImageUrl) {
              <div class="h-64 md:h-96 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <img
                  [src]="content()!.featuredImageUrl"
                  [alt]="content()!.title"
                  class="w-full h-full object-cover">
              </div>
            }

            <!-- Content Header -->
            <div class="p-6 md:p-8">
              <!-- Category and Featured Badge -->
              <div class="flex items-center gap-2 mb-4">
                @if (content()!.categoryName) {
                  <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-semibold rounded-full">
                    {{ content()!.categoryName }}
                  </span>
                }
                @if (content()!.isFeatured) {
                  <span class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-semibold rounded-full">
                    {{ translate('content.featured') || 'Featured' }}
                  </span>
                }
              </div>

              <!-- Title -->
              <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {{ content()!.title }}
              </h1>

              <!-- Metadata -->
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                @if (content()!.publishedAt) {
                  <div class="flex items-center">
                    <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>{{ translate('content.detail.date') || 'Published' }}: {{ formatDate(content()!.publishedAt!) }}</span>
                  </div>
                }
                @if (content()!.authorName) {
                  <div class="flex items-center">
                    <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>{{ translate('content.detail.author') || 'Author' }}: {{ content()!.authorName }}</span>
                  </div>
                }
                @if (content()!.viewCount !== undefined) {
                  <div class="flex items-center">
                    <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <span>{{ content()!.viewCount }} {{ translate('content.views') || 'views' }}</span>
                  </div>
                }
                @if (content()!.categoryName) {
                  <div class="flex items-center">
                    <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    <span>{{ translate('content.detail.category') || 'Category' }}: {{ content()!.categoryName }}</span>
                  </div>
                }
              </div>

              <!-- Excerpt -->
              @if (content()!.excerpt) {
                <p class="text-xl text-gray-700 dark:text-gray-300 mb-6 italic">
                  {{ content()!.excerpt }}
                </p>
              }

              <!-- Content Body -->
              <div class="prose prose-lg dark:prose-invert max-w-none mb-8">
                <div [innerHTML]="content()!.content"></div>
              </div>

              <!-- Tags -->
              @if (content()!.tags && content()!.tags!.length > 0) {
                <div class="flex flex-wrap gap-2 mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ translate('content.tags') || 'Tags' }}:</span>
                  @for (tag of content()!.tags; track tag) {
                    <span class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {{ tag }}
                    </span>
                  }
                </div>
              }

              <!-- Back Button -->
              <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  (click)="goBack()"
                  class="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors">
                  <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                  {{ translate('common.back') || 'Back to Content' }}
                </button>
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    /* Prose styles for content body */
    .prose {
      color: rgb(55 65 81);
    }

    .dark .prose {
      color: rgb(209 213 219);
    }

    .prose h1, .prose h2, .prose h3, .prose h4 {
      font-weight: 700;
      margin-top: 2em;
      margin-bottom: 1em;
    }

    .prose p {
      margin-bottom: 1.25em;
      line-height: 1.75;
    }

    .prose a {
      color: rgb(37 99 235);
      text-decoration: underline;
    }

    .dark .prose a {
      color: rgb(96 165 250);
    }

    .prose img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1.5em 0;
    }

    .prose ul, .prose ol {
      margin: 1.25em 0;
      padding-left: 1.625em;
    }

    .prose li {
      margin: 0.5em 0;
    }

    .prose blockquote {
      border-left: 4px solid rgb(209 213 219);
      padding-left: 1em;
      margin: 1.5em 0;
      font-style: italic;
    }

    .dark .prose blockquote {
      border-left-color: rgb(75 85 99);
    }
  `]
})
export class ContentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contentService = inject(ContentService);
  private translationService = inject(TranslationService);
  localeService = inject(LocaleService);

  content = signal<ContentDto | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const contentId = params.get('id');
      if (contentId) {
        this.loadContent(contentId);
      } else {
        this.error.set('NOT_FOUND');
        this.isLoading.set(false);
      }
    });
  }

  async loadContent(contentId?: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    const id = contentId || this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('NOT_FOUND');
      this.isLoading.set(false);
      return;
    }

    try {
      const data = await firstValueFrom(this.contentService.getContentById(id));
      this.content.set(data);
      
      // Increment view count
      try {
        await firstValueFrom(this.contentService.incrementViewCount(id));
      } catch (err) {
        // Don't show error for view count increment
        console.warn('Failed to increment view count:', err);
      }
    } catch (err: any) {
      console.error('Error loading content:', err);
      if (err.status === 404 || err.error?.code === 'NOT_FOUND') {
        this.error.set('NOT_FOUND');
      } else {
        this.error.set(err.message || this.translate('content.error.loadFailed') || 'Failed to load content');
      }
    } finally {
      this.isLoading.set(false);
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

  goBack(): void {
    this.router.navigate(['/content']);
  }
}





