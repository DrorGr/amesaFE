import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-skip-links',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav 
      class="skip-links"
      aria-label="{{ translate('skipLinks.navigation') }}">
      <a
        href="#main-content"
        (click)="skipTo('main-content', $event)"
        class="skip-link"
        [attr.aria-label]="translate('skipLinks.toMainContent')">
        {{ translate('skipLinks.toMainContent') }}
      </a>
      <a
        href="#main-navigation"
        (click)="skipTo('main-navigation', $event)"
        class="skip-link"
        [attr.aria-label]="translate('skipLinks.toNavigation')">
        {{ translate('skipLinks.toNavigation') }}
      </a>
      <a
        href="#footer"
        (click)="skipTo('footer', $event)"
        class="skip-link"
        [attr.aria-label]="translate('skipLinks.toFooter')">
        {{ translate('skipLinks.toFooter') }}
      </a>
    </nav>
  `,
  styles: [`
    .skip-links {
      position: absolute;
      top: -100px;
      left: 0;
      z-index: 1000;
    }

    .skip-link {
      position: absolute;
      top: 0;
      left: 0;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      font-weight: 600;
      border-radius: 0 0 4px 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transform: translateY(-100%);
      transition: transform 0.2s ease-in-out;
      z-index: 1001;
    }

    .skip-link:focus {
      transform: translateY(0);
      outline: 3px solid #fbbf24;
      outline-offset: 2px;
    }

    .skip-link:hover {
      background-color: #2563eb;
    }

    .dark .skip-link {
      background-color: #60a5fa;
      color: #111827;
    }

    .dark .skip-link:hover {
      background-color: #3b82f6;
    }

    .dark .skip-link:focus {
      outline-color: #fbbf24;
    }
  `]
})
export class SkipLinksComponent {
  private translationService = inject(TranslationService);

  constructor() {
    // Component initialized
  }

  /**
   * Skip to target element
   */
  skipTo(targetId: string, event: MouseEvent): void {
    event.preventDefault();
    
    const target = document.getElementById(targetId);
    if (target) {
      // Make target focusable if it's not already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      
      // Focus the target
      target.focus();
      
      // Scroll to target smoothly
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Remove tabindex after focus (to restore normal tab order)
      setTimeout(() => {
        target.removeAttribute('tabindex');
      }, 1000);
    }
  }

  /**
   * Translate a key
   */
  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

