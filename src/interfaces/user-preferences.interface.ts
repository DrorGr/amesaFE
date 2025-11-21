// User Preferences Interface Definitions
// Comprehensive type definitions for all user preference categories

export type ThemeMode = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'he' | 'ar' | 'es' | 'fr' | 'pl';
export type UIDensity = 'compact' | 'comfortable' | 'spacious';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY';
export type TimeFormat = '12h' | '24h';
export type NumberFormat = 'US' | 'EU' | 'UK' | 'IN';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'ILS' | 'SAR';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type AnimationLevel = 'none' | 'reduced' | 'normal' | 'enhanced';

/**
 * Appearance and Theme Preferences
 */
export interface AppearancePreferences {
  theme: ThemeMode;
  primaryColor: string;
  accentColor: string;
  fontSize: FontSize;
  fontFamily: string;
  uiDensity: UIDensity;
  borderRadius: number; // 0-20px
  showAnimations: boolean;
  animationLevel: AnimationLevel;
  reducedMotion: boolean;
}

/**
 * Language and Localization Preferences
 */
export interface LocalizationPreferences {
  language: Language;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  numberFormat: NumberFormat;
  currency: Currency;
  timezone: string;
  rtlSupport: boolean;
}

/**
 * Accessibility Preferences
 */
export interface AccessibilityPreferences {
  highContrast: boolean;
  colorBlindAssist: boolean;
  colorBlindType: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none';
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  skipLinks: boolean;
  altTextVerbosity: 'minimal' | 'standard' | 'detailed';
  captionsEnabled: boolean;
  audioDescriptions: boolean;
  largeClickTargets: boolean;
  reducedFlashing: boolean;
}

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  browserNotifications: boolean;
  smsNotifications: boolean;
  
  // Specific notification types
  lotteryResults: boolean;
  newLotteries: boolean;
  promotions: boolean;
  accountUpdates: boolean;
  securityAlerts: boolean;
  
  // Notification timing
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
  
  // Sound preferences
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  customSounds: boolean;
}

/**
 * Interaction and Behavior Preferences
 */
export interface InteractionPreferences {
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  confirmationDialogs: boolean;
  doubleClickToOpen: boolean;
  hoverEffects: boolean;
  tooltipDelay: number; // milliseconds
  scrollSpeed: number; // 1-10 scale
  
  // Keyboard shortcuts
  keyboardShortcuts: boolean;
  customShortcuts: Record<string, string>;
  
  // Mouse/Touch
  clickSensitivity: number; // 1-10 scale
  touchGestures: boolean;
  rightClickContext: boolean;
}

/**
 * Lottery-specific Preferences
 */
export interface LotteryPreferences {
  favoriteCategories: string[];
  priceRangeMin: number;
  priceRangeMax: number;
  preferredLocations: string[];
  houseTypes: string[]; // 'apartment', 'house', 'villa', etc.
  
  // Display preferences
  defaultView: 'grid' | 'list' | 'map';
  itemsPerPage: number;
  sortBy: 'price' | 'date' | 'popularity' | 'odds';
  sortOrder: 'asc' | 'desc';
  
  // Alerts
  priceDropAlerts: boolean;
  newMatchingLotteries: boolean;
  endingSoonAlerts: boolean;
  winnerAnnouncements: boolean;
}

/**
 * Privacy and Data Preferences
 */
export interface PrivacyPreferences {
  analyticsTracking: boolean;
  performanceTracking: boolean;
  marketingTracking: boolean;
  personalizedAds: boolean;
  dataSharing: boolean;
  cookieConsent: boolean;
  locationTracking: boolean;
  
  // Data retention
  historyRetention: number; // days
  autoDeleteOldData: boolean;
  
  // Profile visibility
  profileVisibility: 'public' | 'private' | 'friends';
  showActivity: boolean;
  showWinnings: boolean;
}

/**
 * Performance and Technical Preferences
 */
export interface PerformancePreferences {
  imageQuality: 'low' | 'medium' | 'high' | 'auto';
  preloadImages: boolean;
  lazyLoading: boolean;
  cacheSize: number; // MB
  offlineMode: boolean;
  
  // Network
  dataSaver: boolean;
  prefetchContent: boolean;
  backgroundSync: boolean;
  
  // Debug (for development)
  debugMode: boolean;
  showPerformanceMetrics: boolean;
  verboseLogging: boolean;
}

/**
 * Main User Preferences Interface
 * Combines all preference categories
 */
export interface UserPreferences {
  // Metadata
  userId?: string;
  version: string;
  lastUpdated: Date;
  syncEnabled: boolean;
  
  // Preference categories
  appearance: AppearancePreferences;
  localization: LocalizationPreferences;
  accessibility: AccessibilityPreferences;
  notifications: NotificationPreferences;
  interaction: InteractionPreferences;
  lottery: LotteryPreferences;
  privacy: PrivacyPreferences;
  performance: PerformancePreferences;
}

/**
 * Default preferences factory
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  version: '1.0.0',
  lastUpdated: new Date(),
  syncEnabled: true,
  
  appearance: {
    theme: 'auto',
    primaryColor: '#3B82F6',
    accentColor: '#10B981',
    fontSize: 'medium',
    fontFamily: 'Inter, system-ui, sans-serif',
    uiDensity: 'comfortable',
    borderRadius: 8,
    showAnimations: true,
    animationLevel: 'normal',
    reducedMotion: false
  },
  
  localization: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: 'US',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    rtlSupport: false
  },
  
  accessibility: {
    highContrast: false,
    colorBlindAssist: false,
    colorBlindType: 'none',
    screenReaderOptimized: false,
    keyboardNavigation: true,
    focusIndicators: true,
    skipLinks: true,
    altTextVerbosity: 'standard',
    captionsEnabled: false,
    audioDescriptions: false,
    largeClickTargets: false,
    reducedFlashing: false
  },
  
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    browserNotifications: false,
    smsNotifications: false,
    lotteryResults: true,
    newLotteries: true,
    promotions: false,
    accountUpdates: true,
    securityAlerts: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    soundEnabled: true,
    soundVolume: 50,
    customSounds: false
  },
  
  interaction: {
    autoSave: true,
    autoSaveInterval: 5,
    confirmationDialogs: true,
    doubleClickToOpen: false,
    hoverEffects: true,
    tooltipDelay: 500,
    scrollSpeed: 5,
    keyboardShortcuts: true,
    customShortcuts: {},
    clickSensitivity: 5,
    touchGestures: true,
    rightClickContext: true
  },
  
  lottery: {
    favoriteCategories: [],
    priceRangeMin: 0,
    priceRangeMax: 1000000,
    preferredLocations: [],
    houseTypes: [],
    defaultView: 'grid',
    itemsPerPage: 12,
    sortBy: 'date',
    sortOrder: 'desc',
    priceDropAlerts: false,
    newMatchingLotteries: false,
    endingSoonAlerts: false,
    winnerAnnouncements: true
  },
  
  privacy: {
    analyticsTracking: true,
    performanceTracking: true,
    marketingTracking: false,
    personalizedAds: false,
    dataSharing: false,
    cookieConsent: false,
    locationTracking: false,
    historyRetention: 90,
    autoDeleteOldData: false,
    profileVisibility: 'private',
    showActivity: false,
    showWinnings: false
  },
  
  performance: {
    imageQuality: 'auto',
    preloadImages: true,
    lazyLoading: true,
    cacheSize: 100,
    offlineMode: false,
    dataSaver: false,
    prefetchContent: true,
    backgroundSync: true,
    debugMode: false,
    showPerformanceMetrics: false,
    verboseLogging: false
  }
};

/**
 * Preference validation schemas
 */
export interface PreferenceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Preference sync status
 */
export interface PreferenceSyncStatus {
  lastSync: Date;
  syncInProgress: boolean;
  syncError?: string;
  conflictResolution: 'local' | 'remote' | 'merge';
}
