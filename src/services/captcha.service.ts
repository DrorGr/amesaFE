import { Injectable, inject } from '@angular/core';
import { environment } from '../environments/environment';

declare var grecaptcha: any;

@Injectable({
  providedIn: 'root'
})
export class CaptchaService {
  private siteKey: string = environment.recaptchaSiteKey || '';
  private isLoaded = false;

  constructor() {
    // Only load reCAPTCHA if site key is configured
    if (this.siteKey) {
      this.loadRecaptchaScript();
    }
  }

  private loadRecaptchaScript(): void {
    if (this.isLoaded || !this.siteKey) {
      return;
    }

    // Load reCAPTCHA Enterprise JavaScript API
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${this.siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      this.isLoaded = true;
    };
  }

  async execute(action: string = 'register'): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.isLoaded || typeof grecaptcha === 'undefined' || typeof grecaptcha.enterprise === 'undefined') {
        // If reCAPTCHA Enterprise not loaded, return null (backend will handle gracefully)
        console.warn('reCAPTCHA Enterprise not loaded, skipping verification');
        resolve(null);
        return;
      }

      try {
        // Use reCAPTCHA Enterprise API
        grecaptcha.enterprise.ready(async () => {
          try {
            const token = await grecaptcha.enterprise.execute(this.siteKey, { action });
            resolve(token);
          } catch (error: any) {
            console.error('reCAPTCHA Enterprise execution error:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('reCAPTCHA Enterprise error:', error);
        reject(error);
      }
    });
  }

  setSiteKey(siteKey: string): void {
    this.siteKey = siteKey;
    // Reload script with new site key
    if (this.isLoaded) {
      const script = document.querySelector('script[src*="recaptcha"]');
      if (script) {
        script.remove();
        this.isLoaded = false;
      }
      this.loadRecaptchaScript();
    }
  }
}

