import { Component, inject, signal, output } from '@angular/core';
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
  selector: 'app-accessibility-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Accessibility Section -->
    <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
    <div class="px-4 py-2">
      <button
        (click)="toggleExpanded()"
        class="w-full text-left flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-2 rounded transition-colors">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
          </svg>
          <span class="font-medium">{{ translate('userMenu.accessibility') }}</span>
        </div>
        <svg 
          class="w-4 h-4 transition-transform duration-200" 
          [class.rotate-180]="isExpanded()"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      @if (isExpanded()) {
        <div class="mt-2 space-y-3 px-2 pb-2">
          <!-- Quick Actions -->
          <div class="flex gap-2">
            <button 
              (click)="resetSettings()"
              class="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors">
              {{ translate('accessibility.reset') }}
            </button>
            <button 
              (click)="saveSettings()"
              class="flex-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded text-xs font-medium transition-colors">
              {{ translate('accessibility.save') }}
            </button>
          </div>
          
          <!-- Font Size -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ translate('accessibility.fontSize') }}
            </label>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">A</span>
              <input 
                type="range" 
                min="12" 
                max="24" 
                step="2"
                [(ngModel)]="settings.fontSize"
                (input)="applySettings()"
                class="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
              <span class="text-sm text-gray-500">A</span>
            </div>
          </div>
          
          <!-- Contrast -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ translate('accessibility.contrast') }}
            </label>
            <select
              [(ngModel)]="settings.contrast"
              (ngModelChange)="applySettings()"
              class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="normal">{{ translate('accessibility.contrastNormal') }}</option>
              <option value="high">{{ translate('accessibility.contrastHigh') }}</option>
              <option value="inverted">{{ translate('accessibility.contrastInverted') }}</option>
            </select>
          </div>
          
          <!-- Color Blind -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ translate('accessibility.colorBlind') }}
            </label>
            <select
              [(ngModel)]="settings.colorBlind"
              (ngModelChange)="applySettings()"
              class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="none">{{ translate('accessibility.colorBlindNone') }}</option>
              <option value="protanopia">{{ translate('accessibility.colorBlindProtanopia') }}</option>
              <option value="deuteranopia">{{ translate('accessibility.colorBlindDeuteranopia') }}</option>
              <option value="tritanopia">{{ translate('accessibility.colorBlindTritanopia') }}</option>
            </select>
          </div>
          
          <!-- Toggles -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="settings.reduceMotion"
                (ngModelChange)="applySettings()"
                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500">
              {{ translate('accessibility.reduceMotion') }}
            </label>
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="settings.focusIndicator"
                (ngModelChange)="applySettings()"
                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500">
              {{ translate('accessibility.focusIndicator') }}
            </label>
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="settings.textSpacing"
                (ngModelChange)="applySettings()"
                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500">
              {{ translate('accessibility.textSpacing') }}
            </label>
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="settings.linkHighlight"
                (ngModelChange)="applySettings()"
                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500">
              {{ translate('accessibility.linkHighlight') }}
            </label>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AccessibilityMenuComponent {
  private translationService = inject(TranslationService);
  
  close = output<void>();
  isExpanded = signal(false);
  
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
    // Apply settings on load
    this.applySettings();
  }
  
  toggleExpanded(): void {
    this.isExpanded.update(expanded => !expanded);
  }
  
  loadSettings(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('accessibility_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  }
  
  saveSettings(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem('accessibility_settings', JSON.stringify(this.settings));
      this.applySettings();
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  }
  
  resetSettings(): void {
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
    this.saveSettings();
  }
  
  applySettings(): void {
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
    
    // Apply reduce motion
    if (this.settings.reduceMotion) {
      body.classList.add('accessibility-reduce-motion');
    }
    
    // Apply focus indicator
    if (this.settings.focusIndicator) {
      body.classList.add('accessibility-focus-indicator');
    }
    
    // Apply text spacing
    if (this.settings.textSpacing) {
      body.classList.add('accessibility-text-spacing');
    }
    
    // Apply link highlight
    if (this.settings.linkHighlight) {
      body.classList.add('accessibility-link-highlight');
    }
  }
  
  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

