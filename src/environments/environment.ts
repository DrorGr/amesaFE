export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',
  backendUrl: 'http://localhost:5000/api/v1',
  frontendUrl: 'http://localhost:4200',
  logLevel: 'debug',
  recaptchaSiteKey: '', // Set your Google reCAPTCHA v3 site key here
  /** Demo-only: show “Sandbox pay” in payment UI and call ticket purchase without Stripe/Crypto. Must stay false in production builds. */
  enableSandboxPayment: true
};