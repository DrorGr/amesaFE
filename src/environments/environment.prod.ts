export const environment = {
  production: true,
  apiUrl: 'https://amesa-group.net/api/v1',
  backendUrl: 'https://amesa-group.net/api/v1',
  frontendUrl: 'https://amesa-group.net',
  logLevel: 'error',
  recaptchaSiteKey: '', // Set your Google reCAPTCHA v3 site key here (from AWS Secrets Manager or config)
  // Demo: bypass Stripe/Crypto in payment modal via "Sandbox pay". Set back to false after the demo.
  enableSandboxPayment: true
};