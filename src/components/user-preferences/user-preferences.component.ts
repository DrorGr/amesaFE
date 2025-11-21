import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { TranslationService } from '../../services/translation.service';
import { LoggingService } from '../../services/logging.service';
import { 
  UserPreferences, 
  ThemeMode, 
  Language, 
  UIDensity, 
  FontSize,
  AnimationLevel 
} from '../../interfaces/user-preferences.interface';

@Component({
  selector: 'app-user-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {{ translationService.translate('preferences.title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ translationService.translate('preferences.subtitle') }}
        </p>
      </div>

      <!-- Preference Categories Tabs -->
      <div class="mb-8">
        <nav class="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab.set(tab.id)"
            [class]="getTabClasses(tab.id)"
            class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200"
          >
            <i [class]="tab.icon" class="mr-2"></i>
            {{ translationService.translate(tab.label) }}
          </button>
        </nav>
      </div>

      <!-- Preference Forms -->
      <form [formGroup]="preferencesForm" (ngSubmit)="savePreferences()">
        
        <!-- Appearance Tab -->
        <div *ngIf="activeTab() === 'appearance'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Theme Selection -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ translationService.translate('preferences.theme') }}
              </label>
              <select 
                formControlName="theme"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="light">{{ translationService.translate('preferences.theme.light') }}</option>
                <option value="dark">{{ translationService.translate('preferences.theme.dark') }}</option>
                <option value="auto">{{ translationService.translate('preferences.theme.auto') }}</option>
              </select>
            </div>

            <!-- Font Size -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ translationService.translate('preferences.fontSize') }}
              </label>
              <select 
                formControlName="fontSize"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="small">{{ translationService.translate('preferences.fontSize.small') }}</option>
                <option value="medium">{{ translationService.translate('preferences.fontSize.medium') }}</option>
                <option value="large">{{ translationService.translate('preferences.fontSize.large') }}</option>
                <option value="extra-large">{{ translationService.translate('preferences.fontSize.extraLarge') }}</option>
              </select>
            </div>

            <!-- UI Density -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ translationService.translate('preferences.uiDensity') }}
              </label>
              <select 
                formControlName="uiDensity"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="compact">{{ translationService.translate('preferences.uiDensity.compact') }}</option>
                <option value="comfortable">{{ translationService.translate('preferences.uiDensity.comfortable') }}</option>
                <option value="spacious">{{ translationService.translate('preferences.uiDensity.spacious') }}</option>
              </select>
            </div>

            <!-- Animations -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="showAnimations"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.showAnimations') }}
                </span>
              </label>
            </div>

          </div>
        </div>

        <!-- Language & Localization Tab -->
        <div *ngIf="activeTab() === 'localization'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Language Selection -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ translationService.translate('preferences.language') }}
              </label>
              <select 
                formControlName="language"
                (change)="onLanguageChange($event)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="he">עברית (Hebrew)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="pl">Polski (Polish)</option>
              </select>
            </div>

            <!-- Date Format -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ translationService.translate('preferences.dateFormat') }}
              </label>
              <select 
                formControlName="dateFormat"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD MMM YYYY">DD MMM YYYY</option>
              </select>
            </div>

            <!-- Time Format -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ translationService.translate('preferences.timeFormat') }}
              </label>
              <select 
                formControlName="timeFormat"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>

            <!-- Currency -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ translationService.translate('preferences.currency') }}
              </label>
              <select 
                formControlName="currency"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="ILS">ILS (₪)</option>
                <option value="SAR">SAR (ر.س)</option>
              </select>
            </div>

          </div>
        </div>

        <!-- Accessibility Tab -->
        <div *ngIf="activeTab() === 'accessibility'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- High Contrast -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="highContrast"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.highContrast') }}
                </span>
              </label>
            </div>

            <!-- Color Blind Assist -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="colorBlindAssist"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.colorBlindAssist') }}
                </span>
              </label>
            </div>

            <!-- Screen Reader Optimized -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="screenReaderOptimized"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.screenReaderOptimized') }}
                </span>
              </label>
            </div>

            <!-- Keyboard Navigation -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="keyboardNavigation"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.keyboardNavigation') }}
                </span>
              </label>
            </div>

            <!-- Reduced Motion -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="reducedMotion"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.reducedMotion') }}
                </span>
              </label>
            </div>

            <!-- Large Click Targets -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="largeClickTargets"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.largeClickTargets') }}
                </span>
              </label>
            </div>

          </div>
        </div>

        <!-- Notifications Tab -->
        <div *ngIf="activeTab() === 'notifications'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Email Notifications -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="emailNotifications"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.emailNotifications') }}
                </span>
              </label>
            </div>

            <!-- Push Notifications -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="pushNotifications"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.pushNotifications') }}
                </span>
              </label>
            </div>

            <!-- Lottery Results -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="lotteryResults"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.lotteryResults') }}
                </span>
              </label>
            </div>

            <!-- New Lotteries -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="newLotteries"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.newLotteries') }}
                </span>
              </label>
            </div>

            <!-- Promotions -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="promotions"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.promotions') }}
                </span>
              </label>
            </div>

            <!-- Sound Enabled -->
            <div class="space-y-3">
              <label class="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  formControlName="soundEnabled"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ translationService.translate('preferences.soundEnabled') }}
                </span>
              </label>
            </div>

          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex flex-wrap gap-4 justify-between">
          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="!preferencesForm.dirty || isSaving()"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <i class="fas fa-save mr-2" *ngIf="!isSaving()"></i>
              <i class="fas fa-spinner fa-spin mr-2" *ngIf="isSaving()"></i>
              {{ translationService.translate('preferences.save') }}
            </button>

            <button
              type="button"
              (click)="resetToDefaults()"
              class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              <i class="fas fa-undo mr-2"></i>
              {{ translationService.translate('preferences.resetDefaults') }}
            </button>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              (click)="exportPreferences()"
              class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              <i class="fas fa-download mr-2"></i>
              {{ translationService.translate('preferences.export') }}
            </button>

            <button
              type="button"
              (click)="importPreferences()"
              class="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
            >
              <i class="fas fa-upload mr-2"></i>
              {{ translationService.translate('preferences.import') }}
            </button>
          </div>
        </div>

      </form>

      <!-- Hidden file input for import -->
      <input
        #fileInput
        type="file"
        accept=".json"
        (change)="onFileSelected($event)"
        class="hidden"
      >

      <!-- Status Messages -->
      <div *ngIf="statusMessage()" class="mt-4 p-4 rounded-md" [class]="getStatusClasses()">
        <i [class]="getStatusIcon()" class="mr-2"></i>
        {{ statusMessage() }}
      </div>

    </div>
  `,
  styles: [`
    .tab-active {
      @apply bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm;
    }
    
    .tab-inactive {
      @apply text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300;
    }
  `]
})
export class UserPreferencesComponent implements OnInit, OnDestroy {
  // Services
  public userPreferencesService = inject(UserPreferencesService);
  public translationService = inject(TranslationService);
  private logger = inject(LoggingService);
  private fb = inject(FormBuilder);

  // Component state
  public activeTab = signal<string>('appearance');
  public isSaving = signal<boolean>(false);
  public statusMessage = signal<string>('');
  public statusType = signal<'success' | 'error' | 'info'>('info');

  // Form
  public preferencesForm!: FormGroup;
  private subscription = new Subscription();

  // Tab configuration
  public tabs = [
    { id: 'appearance', label: 'preferences.tabs.appearance', icon: 'fas fa-palette' },
    { id: 'localization', label: 'preferences.tabs.localization', icon: 'fas fa-globe' },
    { id: 'accessibility', label: 'preferences.tabs.accessibility', icon: 'fas fa-universal-access' },
    { id: 'notifications', label: 'preferences.tabs.notifications', icon: 'fas fa-bell' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentPreferences();
    this.setupFormSubscriptions();
    this.logger.info('UserPreferencesComponent initialized', undefined, 'UserPreferencesComponent');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initializeForm(): void {
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

  private loadCurrentPreferences(): void {
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

  private setupFormSubscriptions(): void {
    // Auto-apply certain preferences immediately
    this.subscription.add(
      this.preferencesForm.get('theme')?.valueChanges.subscribe(theme => {
        this.userPreferencesService.setTheme(theme);
      })
    );

    this.subscription.add(
      this.preferencesForm.get('fontSize')?.valueChanges.subscribe(fontSize => {
        this.userPreferencesService.setFontSize(fontSize);
      })
    );

    this.subscription.add(
      this.preferencesForm.get('highContrast')?.valueChanges.subscribe(enabled => {
        this.userPreferencesService.setHighContrast(enabled);
      })
    );
  }

  public savePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.showStatus('Please fix the errors before saving', 'error');
      return;
    }

    this.isSaving.set(true);
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
      this.logger.info('User preferences saved', formValue, 'UserPreferencesComponent');
      
    } catch (error) {
      this.showStatus('Failed to save preferences. Please try again.', 'error');
      this.logger.error('Failed to save preferences', { error }, 'UserPreferencesComponent');
    } finally {
      this.isSaving.set(false);
    }
  }

  public onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const language = target.value as Language;
    this.translationService.setLanguage(language);
    this.userPreferencesService.setLanguage(language);
  }

  public resetToDefaults(): void {
    if (confirm(this.translationService.translate('preferences.confirmReset'))) {
      this.userPreferencesService.resetToDefaults();
      this.loadCurrentPreferences();
      this.showStatus('Preferences reset to defaults', 'info');
      this.logger.info('User preferences reset to defaults', undefined, 'UserPreferencesComponent');
    }
  }

  public exportPreferences(): void {
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
      this.logger.info('User preferences exported', undefined, 'UserPreferencesComponent');
    } catch (error) {
      this.showStatus('Failed to export preferences', 'error');
      this.logger.error('Failed to export preferences', { error }, 'UserPreferencesComponent');
    }
  }

  public importPreferences(): void {
    const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  public onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        this.userPreferencesService.importPreferences(jsonString).subscribe({
          next: () => {
            this.loadCurrentPreferences();
            this.showStatus('Preferences imported successfully!', 'success');
            this.logger.info('User preferences imported', undefined, 'UserPreferencesComponent');
          },
          error: (error) => {
            this.showStatus('Failed to import preferences. Please check the file format.', 'error');
            this.logger.error('Failed to import preferences', { error }, 'UserPreferencesComponent');
          }
        });
      } catch (error) {
        this.showStatus('Invalid file format', 'error');
        this.logger.error('Invalid preferences file format', { error }, 'UserPreferencesComponent');
      }
    };
    
    reader.readAsText(file);
    target.value = ''; // Reset file input
  }

  public getTabClasses(tabId: string): string {
    return this.activeTab() === tabId ? 'tab-active' : 'tab-inactive';
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    this.statusMessage.set(message);
    this.statusType.set(type);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.statusMessage.set('');
    }, 5000);
  }

  public getStatusClasses(): string {
    const type = this.statusType();
    const baseClasses = 'flex items-center';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-100 border border-green-400 text-green-700`;
      case 'error':
        return `${baseClasses} bg-red-100 border border-red-400 text-red-700`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-100 border border-blue-400 text-blue-700`;
    }
  }

  public getStatusIcon(): string {
    const type = this.statusType();
    
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'info':
      default:
        return 'fas fa-info-circle';
    }
  }
}

