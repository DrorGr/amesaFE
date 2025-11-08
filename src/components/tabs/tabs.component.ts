import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tab Item Interface
 */
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  badge?: string | number;
}

/**
 * Tab Panel Directive
 * Used to mark content for each tab
 */
import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[tabPanel]',
  standalone: true
})
export class TabPanelDirective {
  @Input('tabPanel') id: string = '';
  
  constructor(public template: TemplateRef<any>) {}
}

/**
 * Tabs Component
 * Reusable tabs with keyboard navigation and animations
 * 
 * Usage:
 * <app-tabs 
 *   [tabs]="tabItems"
 *   [(activeTab)]="currentTab"
 *   [variant]="'underline'"
 *   (tabChange)="onTabChange($event)">
 *   
 *   <ng-template tabPanel="tab1">
 *     Content for tab 1
 *   </ng-template>
 *   
 *   <ng-template tabPanel="tab2">
 *     Content for tab 2
 *   </ng-template>
 * </app-tabs>
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, TabPanelDirective],
  template: `
    <div class="w-full">
      <!-- Tab Headers -->
      <div 
        [class]="tabContainerClasses"
        role="tablist"
        [attr.aria-label]="ariaLabel">
        
        @for (tab of tabs; track tab.id; let i = $index) {
          <button
            [id]="'tab-' + tab.id"
            type="button"
            role="tab"
            [class]="getTabClasses(tab)"
            [disabled]="tab.disabled"
            [attr.aria-selected]="activeTab === tab.id"
            [attr.aria-controls]="'tabpanel-' + tab.id"
            [attr.tabindex]="activeTab === tab.id ? 0 : -1"
            (click)="selectTab(tab.id)"
            (keydown)="onKeyDown($event, i)">
            
            <!-- Icon -->
            @if (tab.icon) {
              <span 
                class="mr-2 flex-shrink-0"
                [innerHTML]="tab.icon">
              </span>
            }
            
            <!-- Label -->
            <span>{{ tab.label }}</span>
            
            <!-- Badge -->
            @if (tab.badge !== undefined && tab.badge !== null) {
              <span class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-current/10">
                {{ tab.badge }}
              </span>
            }
          </button>
        }
        
        <!-- Active indicator (for underline variant) -->
        @if (variant === 'underline' && activeTabElement) {
          <div 
            class="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            [style.left.px]="indicatorLeft"
            [style.width.px]="indicatorWidth">
          </div>
        }
      </div>
      
      <!-- Tab Panels -->
      <div class="mt-4">
        @for (tab of tabs; track tab.id) {
          <div
            [id]="'tabpanel-' + tab.id"
            role="tabpanel"
            [attr.aria-labelledby]="'tab-' + tab.id"
            [attr.hidden]="activeTab !== tab.id ? true : null"
            [class.hidden]="activeTab !== tab.id"
            class="focus:outline-none animate-fadeIn">
            
            @if (activeTab === tab.id) {
              <ng-container *ngTemplateOutlet="getPanelTemplate(tab.id)"></ng-container>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }

    /* Smooth tab transition */
    button[role="tab"] {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Focus styles */
    button[role="tab"]:focus-visible {
      outline: 2px solid rgb(59 130 246);
      outline-offset: 2px;
      border-radius: 0.375rem;
    }

    /* Disabled state */
    button[role="tab"]:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class TabsComponent implements AfterContentInit {
  @Input() tabs: TabItem[] = [];
  @Input() activeTab: string = '';
  @Input() variant: 'underline' | 'pills' | 'bordered' = 'underline';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth: boolean = false;
  @Input() ariaLabel: string = 'Tabs';

  @Output() activeTabChange = new EventEmitter<string>();
  @Output() tabChange = new EventEmitter<string>();

  @ContentChildren(TabPanelDirective) tabPanels!: QueryList<TabPanelDirective>;

  // For underline indicator
  indicatorLeft = 0;
  indicatorWidth = 0;
  activeTabElement: HTMLElement | null = null;

  ngAfterContentInit() {
    // Set first tab as active if not specified
    if (!this.activeTab && this.tabs.length > 0) {
      this.activeTab = this.tabs[0].id;
    }

    // Update indicator on init
    setTimeout(() => this.updateIndicator(), 0);
  }

  get tabContainerClasses(): string {
    const baseClasses = 'relative flex gap-1';
    
    const variantClasses = {
      underline: 'border-b border-gray-200 dark:border-gray-700',
      pills: '',
      bordered: 'border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800'
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${baseClasses} ${variantClasses[this.variant]} ${widthClass}`;
  }

  getTabClasses(tab: TabItem): string {
    const isActive = this.activeTab === tab.id;
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg'
    };

    const baseClasses = `
      inline-flex items-center justify-center font-medium
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      transition-all duration-200
      ${sizeClasses[this.size]}
      ${this.fullWidth ? 'flex-1' : ''}
      ${tab.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    `.trim();

    const variantClasses = {
      underline: isActive
        ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent',
      
      pills: isActive
        ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-lg'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg',
      
      bordered: isActive
        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow rounded-lg'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg'
    };

    return `${baseClasses} ${variantClasses[this.variant]}`;
  }

  selectTab(tabId: string) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || tab.disabled) {
      return;
    }

    this.activeTab = tabId;
    this.activeTabChange.emit(tabId);
    this.tabChange.emit(tabId);

    // Update indicator
    this.updateIndicator();

    // Focus the tab
    setTimeout(() => {
      const tabElement = document.getElementById(`tab-${tabId}`);
      tabElement?.focus();
    }, 0);
  }

  onKeyDown(event: KeyboardEvent, currentIndex: number) {
    let targetIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        targetIndex = currentIndex - 1;
        if (targetIndex < 0) targetIndex = this.tabs.length - 1;
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        targetIndex = currentIndex + 1;
        if (targetIndex >= this.tabs.length) targetIndex = 0;
        break;
      
      case 'Home':
        event.preventDefault();
        targetIndex = 0;
        break;
      
      case 'End':
        event.preventDefault();
        targetIndex = this.tabs.length - 1;
        break;
      
      default:
        return;
    }

    // Skip disabled tabs
    while (this.tabs[targetIndex]?.disabled) {
      if (event.key === 'ArrowLeft' || event.key === 'End') {
        targetIndex--;
        if (targetIndex < 0) targetIndex = this.tabs.length - 1;
      } else {
        targetIndex++;
        if (targetIndex >= this.tabs.length) targetIndex = 0;
      }
    }

    this.selectTab(this.tabs[targetIndex].id);
  }

  getPanelTemplate(tabId: string): TemplateRef<any> | null {
    const panel = this.tabPanels?.find(p => p.id === tabId);
    return panel?.template || null;
  }

  private updateIndicator() {
    if (this.variant !== 'underline') return;

    const activeTabEl = document.getElementById(`tab-${this.activeTab}`);
    if (activeTabEl) {
      this.activeTabElement = activeTabEl;
      const parentLeft = activeTabEl.parentElement?.getBoundingClientRect().left || 0;
      const tabLeft = activeTabEl.getBoundingClientRect().left;
      
      this.indicatorLeft = tabLeft - parentLeft;
      this.indicatorWidth = activeTabEl.offsetWidth;
    }
  }
}

