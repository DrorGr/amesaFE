import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-translation-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isVisible" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
      [class.opacity-100]="isVisible"
      [class.opacity-0]="!isVisible"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl max-w-sm mx-4 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ title }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          {{ message }}
        </p>
        <div class="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            [style.width.%]="progress"
          ></div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {{ progressText }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }
    
    :host(.visible) {
      pointer-events: all;
    }
  `]
})
export class TranslationLoaderComponent {
  @Input() isVisible = false;
  @Input() title = 'Loading Translations';
  @Input() message = 'Please wait while we load the language data...';
  @Input() progress = 0;
  @Input() progressText = 'Initializing...';
}