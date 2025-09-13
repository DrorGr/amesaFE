import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = signal<Theme>('light');
  
  constructor() {
    // Load theme from localStorage on initialization
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    } else {
      // Check system preference
      this.currentTheme.set('light');
    }
    
    // Apply theme changes to document
    effect(() => {
      const theme = this.currentTheme();
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    });
  }
  
  getCurrentTheme() {
    return this.currentTheme.asReadonly();
  }
  
  toggleTheme() {
    this.currentTheme.set(this.currentTheme() === 'light' ? 'dark' : 'light');
  }
  
  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
  }
}