import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  HostListener, 
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Dropdown Menu Item Interface
 */
export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  children?: DropdownItem[];
  action?: () => void;
  routerLink?: string;
  badge?: string | number;
  shortcut?: string;
  danger?: boolean;
}

/**
 * Dropdown Component
 * Feature-rich dropdown menu with nested support and keyboard navigation
 * 
 * Usage:
 * <app-dropdown
 *   [items]="menuItems"
 *   [trigger]="'click'"
 *   [position]="'bottom-left'"
 *   (itemClick)="onItemClick($event)">
 *   <button trigger-button>Menu</button>
 * </app-dropdown>
 */
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block" #dropdownContainer>
      <!-- Trigger -->
      <div 
        #triggerElement
        (click)="onTriggerClick()"
        (mouseenter)="onTriggerHover()"
        [attr.aria-expanded]="isOpen"
        [attr.aria-haspopup]="true"
        class="cursor-pointer">
        <ng-content select="[trigger-button]"></ng-content>
      </div>

      <!-- Dropdown Menu -->
      @if (isOpen) {
        <div
          #menuElement
          [class]="getMenuClasses()"
          class="absolute z-50 mt-2 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] animate-slideDown"
          role="menu"
          [attr.aria-orientation]="'vertical'"
          (click)="$event.stopPropagation()">
          
          @for (item of items; track item.id; let i = $index) {
            <!-- Divider -->
            @if (item.divider) {
              <div class="my-1 border-t border-gray-200 dark:border-gray-700"></div>
            } @else {
              <!-- Menu Item -->
              <div
                [id]="'dropdown-item-' + item.id"
                [class]="getItemClasses(item, i)"
                role="menuitem"
                [attr.tabindex]="item.disabled ? -1 : 0"
                [attr.aria-disabled]="item.disabled"
                (click)="onItemClick(item, $event)"
                (mouseenter)="onItemHover(item, i)"
                (mouseleave)="onItemLeave(item)"
                (keydown)="onItemKeyDown($event, item, i)">
                
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <!-- Icon -->
                    @if (item.icon) {
                      <span 
                        class="flex-shrink-0 w-5 h-5"
                        [innerHTML]="item.icon">
                      </span>
                    }
                    
                    <!-- Label -->
                    <span class="truncate">{{ item.label }}</span>
                  </div>
                  
                  <div class="flex items-center gap-2 ml-3">
                    <!-- Badge -->
                    @if (item.badge !== undefined && item.badge !== null) {
                      <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {{ item.badge }}
                      </span>
                    }
                    
                    <!-- Shortcut -->
                    @if (item.shortcut) {
                      <span class="text-xs text-gray-400 dark:text-gray-500">
                        {{ item.shortcut }}
                      </span>
                    }
                    
                    <!-- Submenu indicator -->
                    @if (item.children && item.children.length > 0) {
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    }
                  </div>
                </div>
                
                <!-- Submenu -->
                @if (item.children && item.children.length > 0 && activeSubmenuId === item.id) {
                  <div
                    class="absolute left-full top-0 ml-1 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] animate-slideRight"
                    role="menu"
                    (click)="$event.stopPropagation()">
                    
                    @for (childItem of item.children; track childItem.id; let j = $index) {
                      @if (childItem.divider) {
                        <div class="my-1 border-t border-gray-200 dark:border-gray-700"></div>
                      } @else {
                        <div
                          [class]="getItemClasses(childItem, j)"
                          role="menuitem"
                          [attr.tabindex]="childItem.disabled ? -1 : 0"
                          (click)="onItemClick(childItem, $event)"
                          (keydown)="onItemKeyDown($event, childItem, j)">
                          
                          <div class="flex items-center gap-3">
                            @if (childItem.icon) {
                              <span 
                                class="w-5 h-5"
                                [innerHTML]="childItem.icon">
                              </span>
                            }
                            <span>{{ childItem.label }}</span>
                          </div>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideRight {
      from {
        opacity: 0;
        transform: translateX(-8px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .animate-slideDown {
      animation: slideDown 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .animate-slideRight {
      animation: slideRight 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Smooth transitions */
    [role="menuitem"] {
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    /* Focus visible styles */
    [role="menuitem"]:focus-visible {
      outline: 2px solid rgb(59 130 246);
      outline-offset: -2px;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .animate-slideDown,
      .animate-slideRight,
      [role="menuitem"] {
        animation: none !important;
        transition: none !important;
      }
    }
  `]
})
export class DropdownComponent implements AfterViewInit, OnDestroy {
  @Input() items: DropdownItem[] = [];
  @Input() trigger: 'click' | 'hover' = 'click';
  @Input() position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' = 'bottom-left';
  @Input() closeOnClick: boolean = true;
  @Input() disabled: boolean = false;

  @Output() itemClick = new EventEmitter<DropdownItem>();
  @Output() openChange = new EventEmitter<boolean>();

  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('triggerElement') triggerElement!: ElementRef;
  @ViewChild('menuElement') menuElement!: ElementRef;

  isOpen = false;
  activeSubmenuId: string | null = null;
  focusedItemIndex = 0;
  private hoverTimeout: any;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    // Any initialization if needed
  }

  ngOnDestroy() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  onTriggerClick() {
    if (this.disabled || this.trigger !== 'click') return;
    this.toggle();
  }

  onTriggerHover() {
    if (this.disabled || this.trigger !== 'hover') return;
    
    this.hoverTimeout = setTimeout(() => {
      this.open();
    }, 200);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    if (this.disabled) return;
    
    this.isOpen = true;
    this.openChange.emit(true);
    
    // Focus first non-disabled item
    setTimeout(() => {
      this.focusFirstItem();
    }, 50);
  }

  close() {
    this.isOpen = false;
    this.activeSubmenuId = null;
    this.openChange.emit(false);
  }

  onItemClick(item: DropdownItem, event: MouseEvent) {
    if (item.disabled || item.divider) return;
    
    event.stopPropagation();

    // If item has children, toggle submenu
    if (item.children && item.children.length > 0) {
      this.activeSubmenuId = this.activeSubmenuId === item.id ? null : item.id;
      return;
    }

    // Execute action
    if (item.action) {
      item.action();
    }

    // Emit event
    this.itemClick.emit(item);

    // Close dropdown
    if (this.closeOnClick) {
      this.close();
    }
  }

  onItemHover(item: DropdownItem, index: number) {
    if (item.disabled || item.divider) return;
    
    this.focusedItemIndex = index;
    
    // Show submenu on hover
    if (item.children && item.children.length > 0) {
      this.activeSubmenuId = item.id;
    } else {
      this.activeSubmenuId = null;
    }
  }

  onItemLeave(item: DropdownItem) {
    // Keep submenu open briefly for better UX
    if (item.children && item.children.length > 0) {
      setTimeout(() => {
        // Only close if mouse is not in submenu
        if (this.activeSubmenuId === item.id) {
          // this.activeSubmenuId = null;
        }
      }, 300);
    }
  }

  onItemKeyDown(event: KeyboardEvent, item: DropdownItem, index: number) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onItemClick(item, event as any);
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.focusNextItem();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousItem();
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (item.children && item.children.length > 0) {
          this.activeSubmenuId = item.id;
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        this.activeSubmenuId = null;
        break;

      case 'Escape':
        event.preventDefault();
        this.close();
        break;

      case 'Home':
        event.preventDefault();
        this.focusFirstItem();
        break;

      case 'End':
        event.preventDefault();
        this.focusLastItem();
        break;
    }
  }

  private focusFirstItem() {
    const firstItem = this.items.find(item => !item.disabled && !item.divider);
    if (firstItem) {
      const element = document.getElementById(`dropdown-item-${firstItem.id}`);
      element?.focus();
      this.focusedItemIndex = this.items.indexOf(firstItem);
    }
  }

  private focusLastItem() {
    const items = [...this.items].reverse();
    const lastItem = items.find(item => !item.disabled && !item.divider);
    if (lastItem) {
      const element = document.getElementById(`dropdown-item-${lastItem.id}`);
      element?.focus();
      this.focusedItemIndex = this.items.indexOf(lastItem);
    }
  }

  private focusNextItem() {
    const enabledItems = this.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled && !item.divider);

    if (enabledItems.length === 0) return;

    const currentEnabledIndex = enabledItems.findIndex(
      ({ index }) => index === this.focusedItemIndex
    );
    
    const nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
    const nextItem = enabledItems[nextIndex];

    const element = document.getElementById(`dropdown-item-${nextItem.item.id}`);
    element?.focus();
    this.focusedItemIndex = nextItem.index;
  }

  private focusPreviousItem() {
    const enabledItems = this.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled && !item.divider);

    if (enabledItems.length === 0) return;

    const currentEnabledIndex = enabledItems.findIndex(
      ({ index }) => index === this.focusedItemIndex
    );
    
    const prevIndex = currentEnabledIndex <= 0 
      ? enabledItems.length - 1 
      : currentEnabledIndex - 1;
    
    const prevItem = enabledItems[prevIndex];

    const element = document.getElementById(`dropdown-item-${prevItem.item.id}`);
    element?.focus();
    this.focusedItemIndex = prevItem.index;
  }

  getMenuClasses(): string {
    const positions = {
      'bottom-left': 'top-full left-0 mt-2',
      'bottom-right': 'top-full right-0 mt-2',
      'top-left': 'bottom-full left-0 mb-2',
      'top-right': 'bottom-full right-0 mb-2'
    };

    return positions[this.position] || positions['bottom-left'];
  }

  getItemClasses(item: DropdownItem, index: number): string {
    const baseClasses = `
      relative px-4 py-2 text-sm cursor-pointer
      flex items-center
      transition-colors duration-150
    `.trim();

    const stateClasses = [];

    if (item.disabled) {
      stateClasses.push('opacity-50 cursor-not-allowed');
    } else {
      if (item.danger) {
        stateClasses.push(
          'text-red-600 dark:text-red-400',
          'hover:bg-red-50 dark:hover:bg-red-900/20'
        );
      } else {
        stateClasses.push(
          'text-gray-700 dark:text-gray-200',
          'hover:bg-gray-100 dark:hover:bg-gray-700'
        );
      }
    }

    if (this.focusedItemIndex === index) {
      stateClasses.push('bg-gray-50 dark:bg-gray-700/50');
    }

    return `${baseClasses} ${stateClasses.join(' ')}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) {
      this.close();
    }
  }
}

