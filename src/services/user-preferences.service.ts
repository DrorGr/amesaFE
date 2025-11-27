import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap, map } from 'rxjs/operators';
import { 
  UserPreferences, 
  DEFAULT_USER_PREFERENCES, 
  PreferenceValidation,
  PreferenceSyncStatus,
  ThemeMode,
  Language,
  AppearancePreferences,
  AccessibilityPreferences,
  NotificationPreferences,
  PrivacyPreferences
} from '../interfaces/user-preferences.interface';
import { ApiService } from './api.service';
import { LoggingService } from './logging.service';
import { AuthService } from './auth.service';

/**
 * Comprehensive User Preferences Service
 * Manages all user preferences with localStorage backup and API sync
 */
@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly STORAGE_KEY = 'amesa_user_preferences';
  private readonly SYNC_DEBOUNCE_TIME = 2000; // 2 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;

  // Core services
  private apiService = inject(ApiService);
  private logger = inject(LoggingService);
  private authService = inject(AuthService);
  
  // Theme service will be injected lazily to avoid circular dependency
  private themeService?: any;

  // Reactive state
  private preferencesSubject = new BehaviorSubject<UserPreferences>(DEFAULT_USER_PREFERENCES);
  private syncStatusSubject = new BehaviorSubject<PreferenceSyncStatus>({
    lastSync: new Date(0),
    syncInProgress: false,
    conflictResolution: 'local'
  });
  private validationSubject = new BehaviorSubject<PreferenceValidation>({
    isValid: true,
    errors: [],
    warnings: []
  });

  // Signals for reactive UI
  private preferencesSignal = signal<UserPreferences>(DEFAULT_USER_PREFERENCES);
  
  // Public observables
  public preferences$ = this.preferencesSubject.asObservable();
  public syncStatus$ = this.syncStatusSubject.asObservable();
  public validation$ = this.validationSubject.asObservable();

  // Computed signals for specific preference categories
  public appearance = computed(() => this.preferencesSignal().appearance);
  public localization = computed(() => this.preferencesSignal().localization);
  public accessibility = computed(() => this.preferencesSignal().accessibility);
  public notifications = computed(() => this.preferencesSignal().notifications);
  public interaction = computed(() => this.preferencesSignal().interaction);
  public lottery = computed(() => this.preferencesSignal().lottery);
  public privacy = computed(() => this.preferencesSignal().privacy);
  public performance = computed(() => this.preferencesSignal().performance);

  // Quick access computed properties
  public currentTheme = computed(() => this.appearance().theme);
  public currentLanguage = computed(() => this.localization().language);
  public isHighContrast = computed(() => this.accessibility().highContrast);
  public notificationsEnabled = computed(() => this.notifications().emailNotifications);

  constructor() {
    this.logger.info('UserPreferencesService initialized', undefined, 'UserPreferencesService');
    
    // Load preferences on startup
    this.loadPreferences();
    
    // Set up auto-sync when user is authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.syncWithServer();
      }
    });

    // Set up debounced sync on preference changes
    this.preferences$.pipe(
      debounceTime(this.SYNC_DEBOUNCE_TIME),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(preferences => {
      this.saveToLocalStorage(preferences);
      if (this.authService.isAuthenticated()) {
        this.syncWithServer();
      }
    });
  }

  /**
   * Load preferences from localStorage and server
   */
  private loadPreferences(): void {
    try {
      // Load from localStorage first
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserPreferences;
        const migrated = this.migratePreferences(parsed);
        this.updatePreferences(migrated);
        this.logger.debug('Preferences loaded from localStorage', { version: migrated.version }, 'UserPreferencesService');
      }
    } catch (error) {
      this.logger.error('Failed to load preferences from localStorage', { error }, 'UserPreferencesService');
      this.updatePreferences(DEFAULT_USER_PREFERENCES);
    }
  }

  /**
   * Update preferences and notify subscribers
   */
  private updatePreferences(preferences: UserPreferences): void {
    const validation = this.validatePreferences(preferences);
    this.validationSubject.next(validation);
    
    if (validation.isValid) {
      preferences.lastUpdated = new Date();
      this.preferencesSubject.next(preferences);
      this.preferencesSignal.set(preferences);
      this.logger.debug('Preferences updated', { version: preferences.version }, 'UserPreferencesService');
    } else {
      this.logger.warn('Invalid preferences detected', { errors: validation.errors }, 'UserPreferencesService');
    }
  }

  /**
   * Get current preferences
   */
  public getPreferences(): UserPreferences {
    return this.preferencesSubject.value;
  }

  /**
   * Update specific preference category
   */
  public updateAppearance(appearance: Partial<AppearancePreferences>): void {
    const current = this.getPreferences();
    const updated = {
      ...current,
      appearance: { ...current.appearance, ...appearance }
    };
    this.updatePreferences(updated);
    
    // Notify theme service if theme changed
    if (appearance.theme && this.themeService) {
      this.themeService.updateThemeFromPreferences(appearance.theme);
    }
    
    this.logger.info('Appearance preferences updated', appearance, 'UserPreferencesService');
  }

  public updateAccessibility(accessibility: Partial<AccessibilityPreferences>): void {
    const current = this.getPreferences();
    const updated = {
      ...current,
      accessibility: { ...current.accessibility, ...accessibility }
    };
    this.updatePreferences(updated);
    this.logger.info('Accessibility preferences updated', accessibility, 'UserPreferencesService');
  }

  public updateNotifications(notifications: Partial<NotificationPreferences>): void {
    const current = this.getPreferences();
    const updated = {
      ...current,
      notifications: { ...current.notifications, ...notifications }
    };
    this.updatePreferences(updated);
    this.logger.info('Notification preferences updated', notifications, 'UserPreferencesService');
  }

  public updatePrivacy(privacy: Partial<PrivacyPreferences>): void {
    const current = this.getPreferences();
    const updated = {
      ...current,
      privacy: { ...current.privacy, ...privacy }
    };
    this.updatePreferences(updated);
    this.logger.info('Privacy preferences updated', privacy, 'UserPreferencesService');
  }

  /**
   * Set theme service reference (to avoid circular dependency)
   */
  public setThemeService(themeService: any): void {
    this.themeService = themeService;
  }

  /**
   * Quick setters for common preferences
   */
  public setTheme(theme: ThemeMode): void {
    this.updateAppearance({ theme });
  }

  public setLanguage(language: Language): void {
    const current = this.getPreferences();
    const updated = {
      ...current,
      localization: { ...current.localization, language }
    };
    this.updatePreferences(updated);
    this.logger.info('Language preference updated', { language }, 'UserPreferencesService');
  }

  public setHighContrast(enabled: boolean): void {
    this.updateAccessibility({ highContrast: enabled });
  }

  public setFontSize(fontSize: AppearancePreferences['fontSize']): void {
    this.updateAppearance({ fontSize });
  }

  /**
   * Reset preferences to defaults
   */
  public resetToDefaults(): void {
    const defaults = { ...DEFAULT_USER_PREFERENCES };
    defaults.userId = this.getPreferences().userId; // Preserve user ID
    this.updatePreferences(defaults);
    this.logger.info('Preferences reset to defaults', undefined, 'UserPreferencesService');
  }

  /**
   * Reset specific category to defaults
   */
  public resetCategoryToDefaults(category: keyof Omit<UserPreferences, 'userId' | 'version' | 'lastUpdated' | 'syncEnabled'>): void {
    const current = this.getPreferences();
    const updated = {
      ...current,
      [category]: DEFAULT_USER_PREFERENCES[category]
    };
    this.updatePreferences(updated);
    this.logger.info('Preference category reset to defaults', { category }, 'UserPreferencesService');
  }

  /**
   * Export preferences as JSON
   */
  public exportPreferences(): string {
    const preferences = this.getPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  public importPreferences(jsonString: string): Observable<boolean> {
    try {
      const imported = JSON.parse(jsonString) as UserPreferences;
      const migrated = this.migratePreferences(imported);
      const validation = this.validatePreferences(migrated);
      
      if (validation.isValid) {
        this.updatePreferences(migrated);
        this.logger.info('Preferences imported successfully', { version: migrated.version }, 'UserPreferencesService');
        return of(true);
      } else {
        this.logger.error('Invalid preferences format', { errors: validation.errors }, 'UserPreferencesService');
        return throwError(() => new Error('Invalid preferences format'));
      }
    } catch (error) {
      this.logger.error('Failed to parse preferences JSON', { error }, 'UserPreferencesService');
      return throwError(() => new Error('Invalid JSON format'));
    }
  }

  /**
   * Save preferences to localStorage
   */
  private saveToLocalStorage(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
      this.logger.debug('Preferences saved to localStorage', undefined, 'UserPreferencesService');
    } catch (error) {
      this.logger.error('Failed to save preferences to localStorage', { error }, 'UserPreferencesService');
    }
  }

  /**
   * Sync preferences with server
   */
  private syncWithServer(): void {
    if (!this.authService.isAuthenticated()) {
      this.logger.debug('User not authenticated, skipping server sync', undefined, 'UserPreferencesService');
      return;
    }

    const syncStatus = this.syncStatusSubject.value;
    if (syncStatus.syncInProgress) {
      this.logger.debug('Sync already in progress, skipping', undefined, 'UserPreferencesService');
      return;
    }

    this.syncStatusSubject.next({ ...syncStatus, syncInProgress: true });
    this.logger.debug('Starting preferences sync with server', undefined, 'UserPreferencesService');

    const preferences = this.getPreferences();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e31aa3d2-de06-43fa-bc0f-d7e32a4257c3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user-preferences.service.ts:syncWithServer',message:'Syncing preferences',data:{preferencesKeys:Object.keys(preferences),preferencesSize:JSON.stringify(preferences).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Backend expects preferences wrapped in a 'preferences' field
    this.apiService.post<UserPreferences>('user/preferences', { preferences })
      .pipe(
        catchError(error => {
          // Don't log 400 errors to console - might be validation issues
          // Only log to logger service for debugging, not console
          if (error.status === 400) {
            // Silently handle validation errors - don't spam console
            this.logger.debug('Preferences validation error (400)', { 
              error: error.error?.message || error.message
            }, 'UserPreferencesService');
          } else if (error.status !== 401 && error.status !== 403) {
            // Only log non-auth errors
            this.logger.error('Failed to sync preferences with server', { error }, 'UserPreferencesService');
          }
          this.syncStatusSubject.next({
            ...syncStatus,
            syncInProgress: false,
            syncError: error.status === 400 ? 'Validation error' : error.message
          });
          return of(null);
        })
      )
      .subscribe(response => {
        if (response?.success) {
          this.syncStatusSubject.next({
            lastSync: new Date(),
            syncInProgress: false,
            conflictResolution: 'local'
          });
          this.logger.info('Preferences synced successfully with server', undefined, 'UserPreferencesService');
        } else if (response && !response.success) {
          // Handle case where response exists but success is false
          this.logger.warn('Preferences sync returned unsuccessful response', { response }, 'UserPreferencesService');
          this.syncStatusSubject.next({
            ...syncStatus,
            syncInProgress: false,
            syncError: response.error?.message || 'Sync failed'
          });
        }
      });
  }

  /**
   * Sanitize preferences for logging (remove sensitive data)
   */
  private sanitizePreferencesForLogging(preferences: UserPreferences): Record<string, any> {
    return {
      version: preferences.version,
      lastUpdated: preferences.lastUpdated,
      // Don't log full preferences object to avoid sensitive data
    };
  }

  /**
   * Load preferences from server
   */
  public loadFromServer(): Observable<UserPreferences> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.logger.debug('Loading preferences from server', undefined, 'UserPreferencesService');

    return this.apiService.get<UserPreferences>('user/preferences').pipe(
      tap(response => {
        if (response.success && response.data) {
          const migrated = this.migratePreferences(response.data);
          this.updatePreferences(migrated);
          this.logger.info('Preferences loaded from server', { version: migrated.version }, 'UserPreferencesService');
        }
      }),
      map(response => response.data!),
      catchError(error => {
        this.logger.error('Failed to load preferences from server', { error }, 'UserPreferencesService');
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate preferences structure and values
   */
  private validatePreferences(preferences: UserPreferences): PreferenceValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!preferences.version) {
      errors.push('Missing version information');
    }

    if (!preferences.appearance) {
      errors.push('Missing appearance preferences');
    }

    if (!preferences.localization) {
      errors.push('Missing localization preferences');
    }

    // Value validation
    if (preferences.appearance?.fontSize && !['small', 'medium', 'large', 'extra-large'].includes(preferences.appearance.fontSize)) {
      errors.push('Invalid font size value');
    }

    if (preferences.localization?.language && !['en', 'he', 'ar', 'es', 'fr', 'pl'].includes(preferences.localization.language)) {
      errors.push('Invalid language value');
    }

    // Warnings for deprecated or unusual values
    if (preferences.version !== DEFAULT_USER_PREFERENCES.version) {
      warnings.push('Preferences version mismatch - migration may be needed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Migrate preferences from older versions
   */
  private migratePreferences(preferences: UserPreferences): UserPreferences {
    // Create a copy to avoid mutating the original
    let migrated = { ...preferences };

    // Migration logic for different versions
    if (!migrated.version || migrated.version < '1.0.0') {
      this.logger.info('Migrating preferences to v1.0.0', undefined, 'UserPreferencesService');
      
      // Add any missing properties with defaults
      migrated = {
        ...DEFAULT_USER_PREFERENCES,
        ...migrated,
        version: '1.0.0'
      };
    }

    // Ensure all required properties exist
    Object.keys(DEFAULT_USER_PREFERENCES).forEach(key => {
      if (!(key in migrated)) {
        (migrated as any)[key] = (DEFAULT_USER_PREFERENCES as any)[key];
      }
    });

    return migrated;
  }

  /**
   * Get preference by path (e.g., 'appearance.theme')
   */
  public getPreferenceByPath(path: string): any {
    const preferences = this.getPreferences();
    return path.split('.').reduce((obj: any, key) => obj?.[key], preferences as any);
  }

  /**
   * Set preference by path
   */
  public setPreferenceByPath(path: string, value: any): void {
    const preferences = { ...this.getPreferences() } as any;
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj: any, key) => obj[key], preferences);
    
    if (target) {
      target[lastKey] = value;
      this.updatePreferences(preferences);
      this.logger.debug('Preference updated by path', { path, value }, 'UserPreferencesService');
    }
  }

  /**
   * Check if a feature is enabled based on preferences
   */
  public isFeatureEnabled(feature: string): boolean {
    switch (feature) {
      case 'darkMode':
        return this.currentTheme() === 'dark';
      case 'highContrast':
        return this.isHighContrast();
      case 'animations':
        return this.appearance().showAnimations;
      case 'notifications':
        return this.notificationsEnabled();
      case 'rtl':
        return this.localization().rtlSupport;
      default:
        return false;
    }
  }

  /**
   * Get preferences summary for debugging
   */
  public getPreferencesSummary(): Record<string, any> {
    const prefs = this.getPreferences();
    return {
      version: prefs.version,
      lastUpdated: prefs.lastUpdated,
      theme: prefs.appearance.theme,
      language: prefs.localization.language,
      accessibility: {
        highContrast: prefs.accessibility.highContrast,
        fontSize: prefs.appearance.fontSize
      },
      notifications: prefs.notifications.emailNotifications,
      syncEnabled: prefs.syncEnabled
    };
  }
}
