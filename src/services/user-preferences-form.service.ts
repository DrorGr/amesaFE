import { Injectable, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserPreferencesService } from './user-preferences.service';
import { TranslationService } from './translation.service';
import { LoggingService } from './logging.service';
import { Language } from '../interfaces/user-preferences.interface';

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesFormService {
  private userPreferencesService: UserPreferencesService;
  private translationService: TranslationService;
  private logger: LoggingService;
  private fb: FormBuilder;

  // State
  private _isSaving = signal<boolean>(false);
  private _statusMessage = signal<string>('');
  private _statusType = signal<'success' | 'error' | 'info'>('info');
  private _subscription = new Subscription();

  // Form
  preferencesForm!: FormGroup;

  // Readonly signals
  isSaving = this._isSaving.asReadonly();
  statusMessage = this._statusMessage.asReadonly();
  statusType = this._statusType.asReadonly();

  constructor(
    userPreferencesService: UserPreferencesService,
    translationService: TranslationService,
    logger: LoggingService,
    fb: FormBuilder
  ) {
    this.userPreferencesService = userPreferencesService;
    this.translationService = translationService;
    this.logger = logger;
    this.fb = fb;
    // Initialize form immediately
    this.initializeForm();
  }

  // Form initialization
  initializeForm(): void {
    this.preferencesForm = this.fb.group({
      // Appearance
      theme: ['auto'],
      fontSize: ['medium'],
      uiDensity: ['comfortable'],
      showAnimations: [true],
      
      // Localization
      language: ['en'],
      dateFormat: ['MM/DD/YYYY'],
      timeFormat: ['12h'],
      currency: ['USD'],
      
      // Accessibility
      highContrast: [false],
      colorBlindAssist: [false],
      screenReaderOptimized: [false],
      keyboardNavigation: [true],
      reducedMotion: [false],
      largeClickTargets: [false],
      
      // Notifications
      emailNotifications: [true],
      pushNotifications: [false],
      lotteryResults: [true],
      newLotteries: [true],
      promotions: [false],
      soundEnabled: [true]
    });
  }

  // Load current preferences into form
  loadCurrentPreferences(): void {
    const preferences = this.userPreferencesService.getPreferences();
    
    this.preferencesForm.patchValue({
      // Appearance
      theme: preferences.appearance.theme,
      fontSize: preferences.appearance.fontSize,
      uiDensity: preferences.appearance.uiDensity,
      showAnimations: preferences.appearance.showAnimations,
      
      // Localization
      language: preferences.localization.language,
      dateFormat: preferences.localization.dateFormat,
      timeFormat: preferences.localization.timeFormat,
      currency: preferences.localization.currency,
      
      // Accessibility
      highContrast: preferences.accessibility.highContrast,
      colorBlindAssist: preferences.accessibility.colorBlindAssist,
      screenReaderOptimized: preferences.accessibility.screenReaderOptimized,
      keyboardNavigation: preferences.accessibility.keyboardNavigation,
      reducedMotion: preferences.appearance.reducedMotion,
      largeClickTargets: preferences.accessibility.largeClickTargets,
      
      // Notifications
      emailNotifications: preferences.notifications.emailNotifications,
      pushNotifications: preferences.notifications.pushNotifications,
      lotteryResults: preferences.notifications.lotteryResults,
      newLotteries: preferences.notifications.newLotteries,
      promotions: preferences.notifications.promotions,
      soundEnabled: preferences.notifications.soundEnabled
    });
  }

  // Setup form subscriptions for auto-apply
  setupFormSubscriptions(): void {
    // Auto-apply certain preferences immediately
    this._subscription.add(
      this.preferencesForm.get('theme')?.valueChanges.subscribe(theme => {
        this.userPreferencesService.setTheme(theme);
      })
    );

    this._subscription.add(
      this.preferencesForm.get('fontSize')?.valueChanges.subscribe(fontSize => {
        this.userPreferencesService.setFontSize(fontSize);
      })
    );

    this._subscription.add(
      this.preferencesForm.get('highContrast')?.valueChanges.subscribe(enabled => {
        this.userPreferencesService.setHighContrast(enabled);
      })
    );
  }

  // Save preferences
  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.showStatus('Please fix the errors before saving', 'error');
      return;
    }

    this._isSaving.set(true);
    const formValue = this.preferencesForm.value;

    try {
      // Update appearance preferences
      this.userPreferencesService.updateAppearance({
        theme: formValue.theme,
        fontSize: formValue.fontSize,
        uiDensity: formValue.uiDensity,
        showAnimations: formValue.showAnimations,
        reducedMotion: formValue.reducedMotion
      });

      // Update localization preferences
      const currentPrefs = this.userPreferencesService.getPreferences();
      const updatedPrefs = {
        ...currentPrefs,
        localization: {
          ...currentPrefs.localization,
          language: formValue.language,
          dateFormat: formValue.dateFormat,
          timeFormat: formValue.timeFormat,
          currency: formValue.currency
        }
      };
      
      // Update accessibility preferences
      this.userPreferencesService.updateAccessibility({
        highContrast: formValue.highContrast,
        colorBlindAssist: formValue.colorBlindAssist,
        screenReaderOptimized: formValue.screenReaderOptimized,
        keyboardNavigation: formValue.keyboardNavigation,
        largeClickTargets: formValue.largeClickTargets
      });

      // Update notification preferences
      this.userPreferencesService.updateNotifications({
        emailNotifications: formValue.emailNotifications,
        pushNotifications: formValue.pushNotifications,
        lotteryResults: formValue.lotteryResults,
        newLotteries: formValue.newLotteries,
        promotions: formValue.promotions,
        soundEnabled: formValue.soundEnabled
      });

      this.preferencesForm.markAsPristine();
      this.showStatus('Preferences saved successfully!', 'success');
      this.logger.info('User preferences saved', formValue, 'UserPreferencesFormService');
      
    } catch (error) {
      this.showStatus('Failed to save preferences. Please try again.', 'error');
      this.logger.error('Failed to save preferences', { error }, 'UserPreferencesFormService');
    } finally {
      this._isSaving.set(false);
    }
  }

  // Language change
  onLanguageChange(language: Language): void {
    this.translationService.setLanguage(language);
    this.userPreferencesService.setLanguage(language);
  }

  // Reset to defaults
  resetToDefaults(): boolean {
    if (confirm(this.translationService.translate('preferences.confirmReset'))) {
      this.userPreferencesService.resetToDefaults();
      this.loadCurrentPreferences();
      this.showStatus('Preferences reset to defaults', 'info');
      this.logger.info('User preferences reset to defaults', undefined, 'UserPreferencesFormService');
      return true;
    }
    return false;
  }

  // Export preferences
  exportPreferences(): void {
    try {
      const preferencesJson = this.userPreferencesService.exportPreferences();
      const blob = new Blob([preferencesJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `amesa-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.showStatus('Preferences exported successfully!', 'success');
      this.logger.info('User preferences exported', undefined, 'UserPreferencesFormService');
    } catch (error) {
      this.showStatus('Failed to export preferences', 'error');
      this.logger.error('Failed to export preferences', { error }, 'UserPreferencesFormService');
    }
  }

  // Import preferences
  importPreferences(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        this.userPreferencesService.importPreferences(jsonString).subscribe({
          next: () => {
            this.loadCurrentPreferences();
            this.showStatus('Preferences imported successfully!', 'success');
            this.logger.info('User preferences imported', undefined, 'UserPreferencesFormService');
          },
          error: (error) => {
            this.showStatus('Failed to import preferences. Please check the file format.', 'error');
            this.logger.error('Failed to import preferences', { error }, 'UserPreferencesFormService');
          }
        });
      } catch (error) {
        this.showStatus('Invalid file format', 'error');
        this.logger.error('Invalid preferences file format', { error }, 'UserPreferencesFormService');
      }
    };
    
    reader.readAsText(file);
  }

  // Status management
  showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    this._statusMessage.set(message);
    this._statusType.set(type);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this._statusMessage.set('');
    }, 5000);
  }

  getStatusClasses(): string {
    const type = this._statusType();
    const baseClasses = 'flex items-center';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800`;
      default:
        return baseClasses;
    }
  }

  getStatusIcon(): string {
    const type = this._statusType();
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  }

  // Cleanup
  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}

