import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

interface AccessibilitySettings {
  fontSize: number;
  contrast: 'normal' | 'high' | 'inverted';
  colorBlind: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicator: boolean;
  textSpacing: boolean;
  cursorSize: 'normal' | 'large' | 'extra-large';
  readingGuide: boolean;
  linkHighlight: boolean;
}

@Component({
  selector: 'app-accessibility-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Fixed Accessibility Widget -->
    @if (!isHidden()) {
      <div class="fixed top-6 right-6 z-50 flex flex-col items-end">
        
        <!-- Accessibility Panel -->
        @if (isOpen()) {
          <div class="mb-4 w-80 md:w-96 max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-slide-left">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 p-4 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"></path>
                      <path d="M10 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-sm">{{ translate('accessibility.title') }}</h3>
                    <p class="text-xs opacity-90">{{ translate('accessibility.subtitle') }}</p>
                  </div>
                </div>
                <button 
                  (click)="toggleWidget()"
                  class="text-white/80 hover:text-white transition-colors duration-200 p-1 focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
                  [attr.aria-label]="translate('accessibility.close')">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Settings Area -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              
              <!-- Quick Actions -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3 text-sm">{{ translate('accessibility.quickActions') }}</h4>
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <button 
                    (click)="resetSettings()"
                    class="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {{ translate('accessibility.reset') }}
                  </button>
                  <button 
                    (click)="saveSettings()"
                    class="px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {{ translate('accessibility.save') }}
                  </button>
                </div>
                <button 
                  (click)="testAllFeatures()"
                  class="w-full px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500">
                  🧪 Test All Features
                </button>
              </div>
              
              <!-- Font Size -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <label class="block font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  {{ translate('accessibility.fontSize') }}
                </label>
                <div class="flex items-center space-x-3">
                  <span class="text-xs text-gray-600 dark:text-gray-400">A</span>
                  <input 
                    type="range" 
                    min="12" 
                    max="24" 
                    step="2"
                    [(ngModel)]="settings.fontSize"
                    (input)="applySettings()"
                    class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    [attr.aria-label]="translate('accessibility.fontSize')">
                  <span class="text-lg text-gray-600 dark:text-gray-400">A</span>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ settings.fontSize }}px</div>
              </div>
              
              <!-- Contrast -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <label class="block font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  {{ translate('accessibility.contrast') }}
                </label>
                <select 
                  [(ngModel)]="settings.contrast"
                  (change)="applySettings()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="normal">{{ translate('accessibility.contrastNormal') }}</option>
                  <option value="high">{{ translate('accessibility.contrastHigh') }}</option>
                  <option value="inverted">{{ translate('accessibility.contrastInverted') }}</option>
                </select>
              </div>
              
              <!-- Color Blind Support -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <label class="block font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  {{ translate('accessibility.colorBlind') }}
                </label>
                <select 
                  [(ngModel)]="settings.colorBlind"
                  (change)="applySettings()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="none">{{ translate('accessibility.colorBlindNone') }}</option>
                  <option value="protanopia">{{ translate('accessibility.colorBlindProtanopia') }}</option>
                  <option value="deuteranopia">{{ translate('accessibility.colorBlindDeuteranopia') }}</option>
                  <option value="tritanopia">{{ translate('accessibility.colorBlindTritanopia') }}</option>
                </select>
              </div>
              
              <!-- Cursor Size -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <label class="block font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  {{ translate('accessibility.cursorSize') }}
                </label>
                <select 
                  [(ngModel)]="settings.cursorSize"
                  (change)="applySettings()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  <option value="normal">{{ translate('accessibility.cursorNormal') }}</option>
                  <option value="large">{{ translate('accessibility.cursorLarge') }}</option>
                  <option value="extra-large">{{ translate('accessibility.cursorExtraLarge') }}</option>
                </select>
              </div>
              
              <!-- Toggle Settings -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3 text-sm">{{ translate('accessibility.toggleSettings') }}</h4>
                <div class="space-y-3">
                  
                  <!-- Reduce Motion -->
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ translate('accessibility.reduceMotion') }}</span>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.reduceMotion"
                      (change)="applySettings()"
                      class="sr-only">
                    <div class="relative">
                      <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                           [class.bg-purple-600]="settings.reduceMotion"></div>
                      <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                           [class.translate-x-4]="settings.reduceMotion"></div>
                    </div>
                  </label>
                  
                  <!-- Focus Indicator -->
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ translate('accessibility.focusIndicator') }}</span>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.focusIndicator"
                      (change)="applySettings()"
                      class="sr-only">
                    <div class="relative">
                      <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                           [class.bg-purple-600]="settings.focusIndicator"></div>
                      <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                           [class.translate-x-4]="settings.focusIndicator"></div>
                    </div>
                  </label>
                  
                  <!-- Text Spacing -->
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ translate('accessibility.textSpacing') }}</span>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.textSpacing"
                      (change)="applySettings()"
                      class="sr-only">
                    <div class="relative">
                      <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                           [class.bg-purple-600]="settings.textSpacing"></div>
                      <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                           [class.translate-x-4]="settings.textSpacing"></div>
                    </div>
                  </label>
                  
                  <!-- Link Highlight -->
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ translate('accessibility.linkHighlight') }}</span>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.linkHighlight"
                      (change)="applySettings()"
                      class="sr-only">
                    <div class="relative">
                      <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                           [class.bg-purple-600]="settings.linkHighlight"></div>
                      <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                           [class.translate-x-4]="settings.linkHighlight"></div>
                    </div>
                  </label>
                  
                  <!-- Reading Guide -->
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ translate('accessibility.readingGuide') }}</span>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.readingGuide"
                      (change)="applySettings()"
                      class="sr-only">
                    <div class="relative">
                      <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-200" 
                           [class.bg-purple-600]="settings.readingGuide"></div>
                      <div class="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-200 transform"
                           [class.translate-x-4]="settings.readingGuide"></div>
                    </div>
                  </label>
                  
                </div>
              </div>
              
            </div>
            
          </div>
        }
        
        <!-- Accessibility Toggle Button -->
        <div class="relative">
          <button
            (click)="toggleWidget()"
            class="w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
            [attr.aria-label]="translate('accessibility.toggleWidget')"
            [attr.aria-expanded]="isOpen()">
            
            <!-- New Accessibility Icon -->
            <svg class="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9M15 7.5L12 8L9 7.5V9M9 7.5L3 7V9M12 8C10.9 8 10 8.9 10 10V22H12V16H14V22H16V10C16 8.9 15.1 8 14 8H12Z"/>
            </svg>
            
          </button>
          
          <!-- Small Close Button -->
          @if (showCloseButton()) {
            <button
              (click)="hideWidget()"
              class="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
              [attr.aria-label]="translate('accessibility.hideWidget')">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          }
        </div>
      </div>
    }
    
    <!-- Reading Guide Line -->
    @if (settings.readingGuide) {
      <div 
        class="fixed left-0 right-0 h-0.5 bg-purple-500 opacity-70 pointer-events-none z-40 transition-all duration-200"
        [style.top.px]="mouseY()"
        id="reading-guide"></div>
    }
    
    <!-- Color Blind Filter SVG Definitions -->
    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <!-- Protanopia Filter -->
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0
                                               0.558 0.442 0 0 0
                                               0 0.242 0.758 0 0
                                               0 0 0 1 0"/>
        </filter>
        
        <!-- Deuteranopia Filter -->
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0
                                               0.7 0.3 0 0 0
                                               0 0.3 0.7 0 0
                                               0 0 0 1 0"/>
        </filter>
        
        <!-- Tritanopia Filter -->
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0
                                               0 0.433 0.567 0 0
                                               0 0.475 0.525 0 0
                                               0 0 0 1 0"/>
        </filter>
      </defs>
    </svg>
  `,
  styles: [`
    @keyframes slide-left {
      from {
        opacity: 0;
        transform: translateX(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
    
    .animate-slide-left {
      animation: slide-left 0.3s ease-out;
    }
    
    /* Custom scrollbar for settings */
    .overflow-y-auto::-webkit-scrollbar {
      width: 4px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.5);
      border-radius: 2px;
    }
    
    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
      background: rgba(75, 85, 99, 0.5);
    }
    
    /* Accessibility styles */
    .accessibility-high-contrast {
      filter: contrast(150%);
    }
    
    .accessibility-inverted {
      filter: invert(1) hue-rotate(180deg);
    }
    
    .accessibility-protanopia {
      filter: url('#protanopia-filter');
    }
    
    .accessibility-deuteranopia {
      filter: url('#deuteranopia-filter');
    }
    
    .accessibility-tritanopia {
      filter: url('#tritanopia-filter');
    }
    
    .accessibility-large-cursor {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M8 4l4 20 4-4 8 8-4 4-8-8-4 4z" fill="black"/><path d="M8 4l4 20 4-4 8 8-4 4-8-8-4 4z" fill="white" stroke="black" stroke-width="1"/></svg>') 16 16, auto !important;
    }
    
    .accessibility-extra-large-cursor {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M12 6l6 30 6-6 12 12-6 6-12-12-6 6z" fill="black"/><path d="M12 6l6 30 6-6 12 12-6 6-12-12-6 6z" fill="white" stroke="black" stroke-width="2"/></svg>') 24 24, auto !important;
    }
    
    .accessibility-text-spacing {
      line-height: 1.8 !important;
      letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important;
    }
    
    .accessibility-focus-indicator *:focus {
      outline: 3px solid #8b5cf6 !important;
      outline-offset: 2px !important;
    }
    
    .accessibility-link-highlight a {
      background-color: rgba(139, 92, 246, 0.1) !important;
      border-bottom: 2px solid #8b5cf6 !important;
    }
    
    /* Smooth transitions */
    * {
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    /* Reduce motion when requested */
    @media (prefers-reduced-motion: reduce) {
      .accessibility-reduce-motion *,
      .accessibility-reduce-motion *::before,
      .accessibility-reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `]
})
export class AccessibilityWidgetComponent {
  private translationService = inject(TranslationService);
  
  // State
  isOpen = signal(false);
  mouseY = signal(0);
  isHidden = signal(false);
  
  // Default settings
  settings: AccessibilitySettings = {
    fontSize: 16,
    contrast: 'normal',
    colorBlind: 'none',
    reduceMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicator: false,
    textSpacing: false,
    cursorSize: 'normal',
    readingGuide: false,
    linkHighlight: false
  };
  
  constructor() {
    // Load saved settings
    this.loadSettings();
    
    // Widgets should always appear on page refresh
    // Hidden state is only for current session
    this.isHidden.set(false);
    
    // Apply settings on load
    this.applySettings();
    
    // Track mouse for reading guide
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (e) => {
        this.mouseY.set(e.clientY);
      });
    }
  }
  
  translate(key: string): string {
    return this.translationService.translate(key);
  }
  
  toggleWidget() {
    this.isOpen.update(open => !open);
  }
  
  hideWidget() {
    this.isHidden.set(true);
    this.isOpen.set(false);
    // Only hide for current session, not permanently
    console.log('Accessibility widget hidden for current session');
  }
  
  showWidget() {
    this.isHidden.set(false);
    console.log('Accessibility widget shown');
  }
  
  showCloseButton() {
    return !this.isHidden();
  }
  
  applySettings() {
    if (typeof document === 'undefined') return;
    
    const body = document.body;
    const html = document.documentElement;
    
    // Remove existing accessibility classes
    body.className = body.className.replace(/accessibility-[\w-]+/g, '');
    
    // Apply font size to root element
    html.style.fontSize = `${this.settings.fontSize}px`;
    
    // Apply contrast settings
    if (this.settings.contrast === 'high') {
      body.classList.add('accessibility-high-contrast');
    } else if (this.settings.contrast === 'inverted') {
      body.classList.add('accessibility-inverted');
    }
    
    // Apply color blind filters
    if (this.settings.colorBlind !== 'none') {
      body.classList.add(`accessibility-${this.settings.colorBlind}`);
    }
    
    // Apply cursor size
    if (this.settings.cursorSize === 'large') {
      body.classList.add('accessibility-large-cursor');
    } else if (this.settings.cursorSize === 'extra-large') {
      body.classList.add('accessibility-extra-large-cursor');
    }
    
    // Apply text spacing
    if (this.settings.textSpacing) {
      body.classList.add('accessibility-text-spacing');
    }
    
    // Apply focus indicator
    if (this.settings.focusIndicator) {
      body.classList.add('accessibility-focus-indicator');
    }
    
    // Apply link highlight
    if (this.settings.linkHighlight) {
      body.classList.add('accessibility-link-highlight');
    }
    
    // Apply reduce motion
    if (this.settings.reduceMotion) {
      body.classList.add('accessibility-reduce-motion');
      // Also set CSS custom property for motion preference
      html.style.setProperty('--motion-preference', 'reduce');
    } else {
      html.style.removeProperty('--motion-preference');
    }
    
    // Log applied settings for testing
    console.log('Accessibility settings applied:', {
      fontSize: this.settings.fontSize,
      contrast: this.settings.contrast,
      colorBlind: this.settings.colorBlind,
      cursorSize: this.settings.cursorSize,
      appliedClasses: Array.from(body.classList).filter(c => c.startsWith('accessibility-'))
    });
    
    // Auto-save settings
    this.saveSettings();
  }
  
  resetSettings() {
    this.settings = {
      fontSize: 16,
      contrast: 'normal',
      colorBlind: 'none',
      reduceMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicator: false,
      textSpacing: false,
      cursorSize: 'normal',
      readingGuide: false,
      linkHighlight: false
    };
    this.applySettings();
  }
  
  saveSettings() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('amesa-accessibility-settings', JSON.stringify(this.settings));
    }
  }
  
  loadSettings() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('amesa-accessibility-settings');
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
          console.log('Accessibility settings loaded:', this.settings);
        } catch (e) {
          console.warn('Failed to load accessibility settings:', e);
        }
      }
    }
  }
  
  // Test method to verify all features
  testAllFeatures() {
    console.log('🧪 Testing all accessibility features...');
    
    // Test font size
    console.log('📝 Testing font size changes...');
    const originalFontSize = this.settings.fontSize;
    this.settings.fontSize = 20;
    this.applySettings();
    setTimeout(() => {
      this.settings.fontSize = originalFontSize;
      this.applySettings();
    }, 2000);
    
    // Test contrast modes
    console.log('🎨 Testing contrast modes...');
    setTimeout(() => {
      this.settings.contrast = 'high';
      this.applySettings();
      setTimeout(() => {
        this.settings.contrast = 'inverted';
        this.applySettings();
        setTimeout(() => {
          this.settings.contrast = 'normal';
          this.applySettings();
        }, 2000);
      }, 2000);
    }, 3000);
    
    // Test color blind filters
    console.log('🌈 Testing color blind filters...');
    setTimeout(() => {
      this.settings.colorBlind = 'protanopia';
      this.applySettings();
      setTimeout(() => {
        this.settings.colorBlind = 'deuteranopia';
        this.applySettings();
        setTimeout(() => {
          this.settings.colorBlind = 'tritanopia';
          this.applySettings();
          setTimeout(() => {
            this.settings.colorBlind = 'none';
            this.applySettings();
          }, 2000);
        }, 2000);
      }, 2000);
    }, 8000);
    
    // Test cursor sizes
    console.log('🖱️ Testing cursor sizes...');
    setTimeout(() => {
      this.settings.cursorSize = 'large';
      this.applySettings();
      setTimeout(() => {
        this.settings.cursorSize = 'extra-large';
        this.applySettings();
        setTimeout(() => {
          this.settings.cursorSize = 'normal';
          this.applySettings();
        }, 2000);
      }, 2000);
    }, 15000);
    
    // Test toggle features
    console.log('🔄 Testing toggle features...');
    setTimeout(() => {
      this.settings.textSpacing = true;
      this.settings.focusIndicator = true;
      this.settings.linkHighlight = true;
      this.settings.readingGuide = true;
      this.applySettings();
      
      setTimeout(() => {
        this.settings.textSpacing = false;
        this.settings.focusIndicator = false;
        this.settings.linkHighlight = false;
        this.settings.readingGuide = false;
        this.applySettings();
        console.log('✅ All accessibility features tested!');
      }, 3000);
    }, 20000);
  }
}
