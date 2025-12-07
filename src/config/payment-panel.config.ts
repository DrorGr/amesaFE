/**
 * Payment Panel Configuration
 * Centralized constants for the responsive payment panel component
 */

export const PAYMENT_PANEL_CONFIG = {
  // Panel dimensions
  DESKTOP_PANEL_WIDTH: 672, // pixels
  DESKTOP_PANEL_MIN_HEIGHT: 400, // pixels
  DESKTOP_PANEL_MAX_HEIGHT_PERCENT: 90, // percentage of viewport height
  
  // Mobile breakpoint (matches MobileDetectionService)
  MOBILE_BREAKPOINT: 990, // pixels
  
  // Z-index layers
  BACKDROP_Z_INDEX: 119,
  PANEL_Z_INDEX: 120,
  
  // Animation timings (milliseconds)
  PROCESSING_STEP_DURATION: 1500,
  ANIMATION_DURATION: 500,
  FOCUS_TRAP_DELAY: 300,
  DEBOUNCE_DELAY: 300,
  
  // Crypto polling
  CRYPTO_POLL_INTERVAL: 3000, // milliseconds
  CRYPTO_MAX_POLLS: 60, // 3 minutes max (60 * 3 seconds)
  
  // Timeouts
  STRIPE_ELEMENT_MOUNT_DELAY: 200,
  STRIPE_ELEMENT_INIT_DELAY: 50,
  
  // Webhook polling (HIGH-4)
  WEBHOOK_POLL_INTERVAL: 2000, // Poll every 2 seconds
  WEBHOOK_MAX_POLLS: 30, // 60 seconds max (30 * 2 seconds)
} as const;

export type PaymentPanelConfig = typeof PAYMENT_PANEL_CONFIG;
