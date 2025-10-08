import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';

/**
 * Service for handling security-related operations including input validation,
 * sanitization, and XSS prevention.
 * 
 * @example
 * ```typescript
 * constructor(private securityService: SecurityService) {}
 * 
 * validateUserInput(input: string) {
 *   if (this.securityService.isValidEmail(input)) {
 *     return this.securityService.sanitizeInput(input);
 *   }
 *   throw new Error('Invalid email format');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  /**
   * Creates an instance of SecurityService.
   * @param sanitizer - Angular's DomSanitizer for HTML/URL sanitization
   */
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitizes HTML content to prevent XSS attacks.
   * @param html - The HTML string to sanitize
   * @returns SafeHtml object that can be safely used in templates
   * @example
   * ```typescript
   * const safeHtml = this.securityService.sanitizeHtml('<p>User content</p>');
   * ```
   */
  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(1, html) || '';
  }

  /**
   * Sanitizes URL to prevent malicious redirects.
   * @param url - The URL string to sanitize
   * @returns SafeUrl object that can be safely used in templates
   * @example
   * ```typescript
   * const safeUrl = this.securityService.sanitizeUrl('https://example.com');
   * ```
   */
  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.sanitize(2, url) || '';
  }

  /**
   * Validates email format using regex pattern.
   * @param email - The email string to validate
   * @returns True if email format is valid, false otherwise
   * @example
   * ```typescript
   * if (this.securityService.isValidEmail('user@example.com')) {
   *   // Process valid email
   * }
   * ```
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates phone number format.
   * @param phone - The phone number string to validate
   * @returns True if phone format is valid, false otherwise
   * @example
   * ```typescript
   * if (this.securityService.isValidPhone('+1234567890')) {
   *   // Process valid phone
   * }
   * ```
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Escapes HTML characters to prevent XSS attacks.
   * @param text - The text to escape
   * @returns HTML-escaped string
   * @example
   * ```typescript
   * const escaped = this.securityService.escapeHtml('<script>alert("xss")</script>');
   * // Returns: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
   * ```
   */
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Validates URL format.
   * @param url - The URL string to validate
   * @returns True if URL format is valid, false otherwise
   * @example
   * ```typescript
   * if (this.securityService.isValidUrl('https://example.com')) {
   *   // Process valid URL
   * }
   * ```
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates a cryptographically secure random token.
   * @param length - The length of the token in bytes (default: 32)
   * @returns Hexadecimal string representation of the random token
   * @example
   * ```typescript
   * const token = this.securityService.generateSecureToken(16);
   * // Returns: "a1b2c3d4e5f6..." (32 characters for 16 bytes)
   * ```
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validates input length against minimum and maximum constraints.
   * @param input - The input string to validate
   * @param min - Minimum allowed length
   * @param max - Maximum allowed length
   * @returns True if input length is within constraints, false otherwise
   * @example
   * ```typescript
   * if (this.securityService.isValidLength('password', 8, 50)) {
   *   // Process valid length input
   * }
   * ```
   */
  isValidLength(input: string, min: number, max: number): boolean {
    return input.length >= min && input.length <= max;
  }

  /**
   * Sanitizes user input by removing potentially dangerous characters and patterns.
   * @param input - The input string to sanitize
   * @returns Sanitized string with dangerous content removed
   * @example
   * ```typescript
   * const clean = this.securityService.sanitizeInput('Hello<script>alert("xss")</script>');
   * // Returns: "Helloalert("xss")"
   * ```
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
}
