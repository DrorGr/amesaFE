/**
 * OAuth Extension for AuthService
 * 
 * This file contains OAuth login methods for Google, Facebook, and Apple.
 * These methods should be added to the AuthService class in auth.service.ts
 * 
 * Integration Instructions:
 * 1. Copy these methods into the AuthService class
 * 2. Make sure apiUrl is available as a property
 * 3. Ensure setSession() method exists for storing tokens
 * 4. Add environment configuration for OAuth endpoints
 */

export class OAuthServiceMethods {
  
  /**
   * Login with Google OAuth
   * Opens popup window for Google authentication
   */
  async loginWithGoogle(): Promise<boolean> {
    try {
      // Get backend API URL from environment
      const apiUrl = this.getApiUrl();
      const googleAuthUrl = `${apiUrl}/api/auth/google`;
      
      // Open OAuth popup
      const popup = this.openOAuthPopup(googleAuthUrl, 'Google Login');
      
      if (!popup) {
        console.error('Failed to open OAuth popup. Please check popup blockers.');
        return false;
      }
      
      // Wait for OAuth callback
      const result = await this.waitForOAuthCallback(popup);
      
      if (result.success && result.token && result.user) {
        // Store authentication data
        this.setSession(result.token, result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Google OAuth error:', error);
      return false;
    }
  }

  /**
   * Login with Facebook (Meta) OAuth
   * Opens popup window for Facebook authentication
   */
  async loginWithMeta(): Promise<boolean> {
    try {
      const apiUrl = this.getApiUrl();
      const facebookAuthUrl = `${apiUrl}/api/auth/facebook`;
      
      const popup = this.openOAuthPopup(facebookAuthUrl, 'Facebook Login');
      
      if (!popup) {
        console.error('Failed to open OAuth popup. Please check popup blockers.');
        return false;
      }
      
      const result = await this.waitForOAuthCallback(popup);
      
      if (result.success && result.token && result.user) {
        this.setSession(result.token, result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      return false;
    }
  }

  /**
   * Login with Apple OAuth
   * Opens popup window for Apple authentication
   */
  async loginWithApple(): Promise<boolean> {
    try {
      const apiUrl = this.getApiUrl();
      const appleAuthUrl = `${apiUrl}/api/auth/apple`;
      
      const popup = this.openOAuthPopup(appleAuthUrl, 'Apple Login');
      
      if (!popup) {
        console.error('Failed to open OAuth popup. Please check popup blockers.');
        return false;
      }
      
      const result = await this.waitForOAuthCallback(popup);
      
      if (result.success && result.token && result.user) {
        this.setSession(result.token, result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Apple OAuth error:', error);
      return false;
    }
  }

  /**
   * Opens OAuth popup window with optimal sizing and positioning
   * @param url - OAuth provider URL
   * @param title - Window title
   * @returns Window object or null
   */
  private openOAuthPopup(url: string, title: string): Window | null {
    const width = 600;
    const height = 700;
    const left = Math.max(0, (screen.width - width) / 2);
    const top = Math.max(0, (screen.height - height) / 2);
    
    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'toolbar=no',
      'menubar=no',
      'scrollbars=yes',
      'resizable=yes',
      'status=no',
      'location=yes'
    ].join(',');
    
    try {
      const popup = window.open(url, title, features);
      
      // Focus popup if it opened
      if (popup) {
        popup.focus();
      }
      
      return popup;
    } catch (error) {
      console.error('Failed to open popup:', error);
      return null;
    }
  }

  /**
   * Waits for OAuth callback message from popup window
   * Implements timeout and proper cleanup
   * @param popup - Popup window reference
   * @returns Promise with OAuth result
   */
  private waitForOAuthCallback(popup: Window | null): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!popup) {
        reject(new Error('No popup window available'));
        return;
      }

      // 5 minute timeout for OAuth flow
      const timeout = setTimeout(() => {
        popup?.close();
        reject(new Error('OAuth authentication timed out. Please try again.'));
      }, 300000);

      // Check if popup was closed by user
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          clearTimeout(timeout);
          reject(new Error('Authentication cancelled'));
        }
      }, 500);

      // Listen for OAuth callback message
      const messageHandler = (event: MessageEvent) => {
        // Security: Verify message origin
        if (event.origin !== window.location.origin) {
          console.warn('Received message from unauthorized origin:', event.origin);
          return;
        }

        // Handle OAuth success
        if (event.data.type === 'oauth-success') {
          clearTimeout(timeout);
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageHandler);
          
          popup?.close();
          resolve(event.data);
        }
        
        // Handle OAuth error
        else if (event.data.type === 'oauth-error') {
          clearTimeout(timeout);
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageHandler);
          
          popup?.close();
          reject(new Error(event.data.message || 'OAuth authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  /**
   * Get API URL from environment or use default
   * This method should be implemented based on your environment configuration
   */
  private getApiUrl(): string {
    // This should be replaced with your actual API URL logic
    // Example: return environment.apiUrl;
    return window.location.origin; // Placeholder
  }

  /**
   * Store authentication session
   * This method should already exist in AuthService
   * @param token - JWT token
   * @param user - User data
   */
  private setSession(token: string, user: any): void {
    // Store token in localStorage or sessionStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    // Update any observables or subjects
    // Example: this.currentUserSubject.next(user);
  }
}


/**
 * INTEGRATION EXAMPLE:
 * 
 * In your auth.service.ts, add these methods to the AuthService class:
 * 
 * ```typescript
 * export class AuthService {
 *   private apiUrl = environment.apiUrl;
 *   
 *   // ... existing methods ...
 *   
 *   // Add OAuth methods from auth.service.oauth.ts here
 *   async loginWithGoogle(): Promise<boolean> {
 *     // ... copy implementation ...
 *   }
 *   
 *   async loginWithMeta(): Promise<boolean> {
 *     // ... copy implementation ...
 *   }
 *   
 *   async loginWithApple(): Promise<boolean> {
 *     // ... copy implementation ...
 *   }
 *   
 *   private openOAuthPopup(url: string, title: string): Window | null {
 *     // ... copy implementation ...
 *   }
 *   
 *   private waitForOAuthCallback(popup: Window | null): Promise<any> {
 *     // ... copy implementation ...
 *   }
 * }
 * ```
 */

