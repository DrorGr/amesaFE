import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-translation-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible) {
      <div class="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center z-50"
           role="status"
           aria-live="polite"
           aria-label="Loading translations">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"
             aria-hidden="true"></div>
      </div>
    }
  `,
  styles: []
})
export class TranslationLoaderComponent {
  @Input() isVisible = false;
}