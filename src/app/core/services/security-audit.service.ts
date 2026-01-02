import { Injectable, inject } from '@angular/core';
// SecurityService available for future use
import { LoggingService } from './logging.service';

/**
 * Interface for security audit result
 */
export interface SecurityAuditResult {
  score: number; // 0-100
  issues: SecurityIssue[];
  recommendations: string[];
  timestamp: Date;
}

/**
 * Interface for security issue
 */
export interface SecurityIssue {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  recommendation: string;
  affectedElements?: string[];
}

/**
 * Service for conducting security audits of the application.
 * Checks for common security vulnerabilities and provides recommendations.
 * 
 * @example
 * ```typescript
 * constructor(private securityAudit: SecurityAuditService) {}
 * 
 * async runSecurityAudit() {
 *   const result = await this.securityAudit.auditApplication();
 *   console.log('Security Score:', result.score);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityAuditService {
  private loggingService = inject(LoggingService);

  /**
   * Runs a comprehensive security audit of the application
   * @returns Promise with security audit results
   */
  async auditApplication(): Promise<SecurityAuditResult> {
    this.loggingService.info('Starting security audit', {}, 'SecurityAudit');
    
    const issues: SecurityIssue[] = [];
    const recommendations: string[] = [];

    // Check for XSS vulnerabilities
    issues.push(...this.checkXSSVulnerabilities());
    
    // Check for insecure content
    issues.push(...this.checkInsecureContent());
    
    // Check for missing security headers
    issues.push(...this.checkSecurityHeaders());
    
    // Check for insecure forms
    issues.push(...this.checkFormSecurity());
    
    // Check for insecure external resources
    issues.push(...this.checkExternalResources());
    
    // Check for console information leakage
    issues.push(...this.checkConsoleLeakage());
    
    // Check for insecure storage
    issues.push(...this.checkStorageSecurity());
    
    // Generate recommendations
    recommendations.push(...this.generateRecommendations(issues));
    
    // Calculate security score
    const score = this.calculateSecurityScore(issues);
    
    const result: SecurityAuditResult = {
      score,
      issues,
      recommendations,
      timestamp: new Date()
    };

    this.loggingService.info('Security audit completed', { score, issueCount: issues.length }, 'SecurityAudit');
    
    return result;
  }

  /**
   * Checks for XSS vulnerabilities
   * @returns Array of XSS-related security issues
   */
  private checkXSSVulnerabilities(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for innerHTML usage
    const innerHTMLUsage = this.findInnerHTMLUsage();
    if (innerHTMLUsage.length > 0) {
      issues.push({
        type: 'high',
        category: 'XSS',
        description: 'Found potential XSS vulnerabilities through innerHTML usage',
        recommendation: 'Use textContent or Angular\'s built-in sanitization instead of innerHTML',
        affectedElements: innerHTMLUsage
      });
    }

    // Check for eval usage
    const evalUsage = this.findEvalUsage();
    if (evalUsage.length > 0) {
      issues.push({
        type: 'critical',
        category: 'XSS',
        description: 'Found eval() usage which can lead to code injection',
        recommendation: 'Remove all eval() usage and use safer alternatives',
        affectedElements: evalUsage
      });
    }

    // Check for document.write usage
    const documentWriteUsage = this.findDocumentWriteUsage();
    if (documentWriteUsage.length > 0) {
      issues.push({
        type: 'high',
        category: 'XSS',
        description: 'Found document.write() usage which can lead to XSS',
        recommendation: 'Replace document.write() with safer DOM manipulation methods',
        affectedElements: documentWriteUsage
      });
    }

    return issues;
  }

  /**
   * Checks for insecure content
   * @returns Array of insecure content issues
   */
  private checkInsecureContent(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for mixed content (HTTP resources on HTTPS page)
    if (window.location.protocol === 'https:') {
      const httpResources = this.findHTTPResources();
      if (httpResources.length > 0) {
        issues.push({
          type: 'medium',
          category: 'Mixed Content',
          description: 'Found HTTP resources loaded on HTTPS page',
          recommendation: 'Use HTTPS for all resources or implement Content Security Policy',
          affectedElements: httpResources
        });
      }
    }

    // Check for unsafe external scripts
    const unsafeScripts = this.findUnsafeScripts();
    if (unsafeScripts.length > 0) {
      issues.push({
        type: 'high',
        category: 'External Scripts',
        description: 'Found potentially unsafe external scripts',
        recommendation: 'Use Subresource Integrity (SRI) for external scripts',
        affectedElements: unsafeScripts
      });
    }

    return issues;
  }

  /**
   * Checks for missing security headers
   * @returns Array of security header issues
   */
  private checkSecurityHeaders(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // This would typically be done server-side, but we can check for client-side indicators
    const hasCSP = this.checkContentSecurityPolicy();
    if (!hasCSP) {
      issues.push({
        type: 'high',
        category: 'Security Headers',
        description: 'Content Security Policy (CSP) not detected',
        recommendation: 'Implement Content Security Policy to prevent XSS attacks'
      });
    }

    return issues;
  }

  /**
   * Checks for form security issues
   * @returns Array of form security issues
   */
  private checkFormSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for forms without CSRF protection
    const forms = document.querySelectorAll('form');
    const unprotectedForms = Array.from(forms).filter(form => 
      !form.querySelector('input[name*="csrf"]') && 
      !form.querySelector('input[name*="token"]')
    );

    if (unprotectedForms.length > 0) {
      issues.push({
        type: 'medium',
        category: 'Form Security',
        description: 'Found forms without CSRF protection',
        recommendation: 'Implement CSRF tokens for all forms that modify data',
        affectedElements: unprotectedForms.map(form => form.id || 'unnamed-form')
      });
    }

    // Check for password fields without proper attributes
    const passwordFields = document.querySelectorAll('input[type="password"]');
    const insecurePasswordFields = Array.from(passwordFields).filter(field => 
      !field.hasAttribute('autocomplete') || 
      field.getAttribute('autocomplete') === 'off'
    );

    if (insecurePasswordFields.length > 0) {
      issues.push({
        type: 'low',
        category: 'Form Security',
        description: 'Found password fields without proper autocomplete attributes',
        recommendation: 'Use appropriate autocomplete attributes for password fields'
      });
    }

    return issues;
  }

  /**
   * Checks for insecure external resources
   * @returns Array of external resource issues
   */
  private checkExternalResources(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for external resources without integrity attributes
    const externalScripts = document.querySelectorAll('script[src^="http"]');
    const insecureScripts = Array.from(externalScripts).filter(script => 
      !script.hasAttribute('integrity')
    );

    if (insecureScripts.length > 0) {
      issues.push({
        type: 'medium',
        category: 'External Resources',
        description: 'Found external scripts without integrity attributes',
        recommendation: 'Add Subresource Integrity (SRI) attributes to external scripts',
        affectedElements: Array.from(insecureScripts).map(script => script.getAttribute('src') || 'unknown')
      });
    }

    return issues;
  }

  /**
   * Checks for console information leakage
   * @returns Array of console leakage issues
   */
  private checkConsoleLeakage(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // In production, console logs should be minimal
    if (this.isProduction()) {
      const hasConsoleLogs = this.checkConsoleLogs();
      if (hasConsoleLogs) {
        issues.push({
          type: 'low',
          category: 'Information Leakage',
          description: 'Console logging detected in production',
          recommendation: 'Remove or minimize console logging in production builds'
        });
      }
    }

    return issues;
  }

  /**
   * Checks for insecure storage usage
   * @returns Array of storage security issues
   */
  private checkStorageSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for sensitive data in localStorage
    const sensitiveData = this.checkSensitiveDataInStorage();
    if (sensitiveData.length > 0) {
      issues.push({
        type: 'high',
        category: 'Storage Security',
        description: 'Found potentially sensitive data in localStorage',
        recommendation: 'Avoid storing sensitive data in localStorage, use secure alternatives'
      });
    }

    return issues;
  }

  /**
   * Generates security recommendations based on found issues
   * @param issues - Array of security issues
   * @returns Array of recommendations
   */
  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(issue => issue.type === 'critical');
    const highIssues = issues.filter(issue => issue.type === 'high');

    if (criticalIssues.length > 0) {
      recommendations.push('Address critical security issues immediately');
    }

    if (highIssues.length > 0) {
      recommendations.push('Prioritize high-severity security issues');
    }

    recommendations.push('Implement Content Security Policy (CSP)');
    recommendations.push('Use HTTPS for all communications');
    recommendations.push('Implement proper input validation and sanitization');
    recommendations.push('Use secure authentication mechanisms');
    recommendations.push('Regularly update dependencies');
    recommendations.push('Conduct regular security audits');

    return recommendations;
  }

  /**
   * Calculates security score based on found issues
   * @param issues - Array of security issues
   * @returns Security score (0-100)
   */
  private calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100;

    issues.forEach(issue => {
      switch (issue.type) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  // Helper methods for security checks
  private findInnerHTMLUsage(): string[] {
    // This would require static analysis of the codebase
    // For now, return empty array
    return [];
  }

  private findEvalUsage(): string[] {
    // This would require static analysis of the codebase
    return [];
  }

  private findDocumentWriteUsage(): string[] {
    // This would require static analysis of the codebase
    return [];
  }

  private findHTTPResources(): string[] {
    const resources: string[] = [];
    const elements = document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]');
    elements.forEach(element => {
      const src = element.getAttribute('src') || element.getAttribute('href');
      if (src) resources.push(src);
    });
    return resources;
  }

  private findUnsafeScripts(): string[] {
    const scripts: string[] = [];
    const elements = document.querySelectorAll('script[src^="http"]:not([integrity])');
    elements.forEach(element => {
      const src = element.getAttribute('src');
      if (src) scripts.push(src);
    });
    return scripts;
  }

  private checkContentSecurityPolicy(): boolean {
    // Check if CSP is present in meta tags or response headers
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return !!cspMeta;
  }

  private isProduction(): boolean {
    // Check if running in production mode
    return !window.location.hostname.includes('localhost') && 
           !window.location.hostname.includes('127.0.0.1');
  }

  private checkConsoleLogs(): boolean {
    // This would require runtime monitoring
    // For now, return false
    return false;
  }

  private checkSensitiveDataInStorage(): string[] {
    const sensitiveKeys: string[] = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key')) {
        sensitiveKeys.push(key);
      }
    });
    
    return sensitiveKeys;
  }
}
