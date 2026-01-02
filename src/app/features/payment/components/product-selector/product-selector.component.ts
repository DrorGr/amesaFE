import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductDto } from '../../services/product.service';
import { TranslationService } from '@core/services/translation.service';
import { LocaleService } from '@core/services/locale.service';

@Component({
  selector: 'app-product-selector',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Screen reader announcement -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        @if (loading()) {
          {{ translate('product.selector.loading') }}
        } @else if (error()) {
          {{ translate('product.selector.error') }}: {{ error() }}
        } @else {
          {{ translate('product.selector.ready') }}
        }
      </div>

      <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ translate('product.selector.title') }}
      </h1>
      
      <!-- Filter -->
      <div class="mb-6">
        <label 
          for="product-type-filter"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ translate('product.selector.filter') }}
        </label>
        <select 
          id="product-type-filter"
          [(ngModel)]="selectedType" 
          (change)="filterProducts()"
          [attr.aria-label]="translate('product.selector.filter')"
          class="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
          <option value="">{{ translate('product.selector.allProducts') }}</option>
          <option value="lottery_ticket">{{ translate('product.selector.lotteryTickets') }}</option>
          <option value="subscription">{{ translate('product.selector.subscriptions') }}</option>
          <option value="timed_event">{{ translate('product.selector.timedEvents') }}</option>
        </select>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div 
          class="text-center py-8 text-gray-700 dark:text-gray-300"
          [attr.aria-live]="'polite'"
          [attr.aria-busy]="true">
          {{ translate('product.selector.loading') }}
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div 
          class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4"
          role="alert"
          [attr.aria-live]="'assertive'">
          {{ error() }}
        </div>
      }

      <!-- Products Grid -->
      @if (!loading() && !error() && filteredProducts().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (product of filteredProducts(); track product.id) {
            <div 
              class="border border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800"
              (click)="selectProduct(product)"
              (keydown.enter)="selectProduct(product)"
              (keydown.space)="selectProduct(product); $event.preventDefault()"
              [attr.aria-label]="translate('product.selector.selectProduct', { name: product.name })"
              role="button"
              tabindex="0">
              <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{{ product.name }}</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">{{ product.description }}</p>
              <div class="flex justify-between items-center">
                <span class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ formatPrice(product.basePrice, product.currency) }}
                </span>
                <button 
                  (click)="selectProduct(product); $event.stopPropagation()"
                  (keydown.enter)="selectProduct(product); $event.stopPropagation()"
                  (keydown.space)="selectProduct(product); $event.stopPropagation(); $event.preventDefault()"
                  [attr.aria-label]="translate('product.selector.selectButton', { name: product.name })"
                  class="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none">
                  {{ translate('product.selector.select') }}
                </button>
              </div>
              @if (product.maxQuantityPerUser) {
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {{ translate('product.selector.maxQuantity', { count: product.maxQuantityPerUser.toString() }) }}
                </p>
              }
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && filteredProducts().length === 0) {
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          {{ translate('product.selector.empty') }}
        </div>
      }
    </div>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `]
})
export class ProductSelectorComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private translationService = inject(TranslationService);
  private localeService = inject(LocaleService);

  products = signal<ProductDto[]>([]);
  filteredProducts = computed(() => {
    const type = this.selectedType();
    if (!type) return this.products();
    return this.products().filter(p => p.productType === type);
  });
  loading = signal(false);
  error = signal<string | null>(null);
  selectedType = signal<string>('');

  translate(key: string, params?: Record<string, string>): string {
    let translation = this.translationService.translate(key);
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value);
      });
    }
    return translation;
  }

  formatPrice(price: number, currency: string): string {
    return this.localeService.formatCurrency(price, currency);
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.translate('product.selector.failedToLoad'));
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  filterProducts(): void {
    // Filtering is handled by computed property
  }

  selectProduct(product: ProductDto): void {
    // Navigate to checkout with product ID
    this.router.navigate(['/payment/checkout'], {
      queryParams: { productId: product.id }
    });
  }
}
