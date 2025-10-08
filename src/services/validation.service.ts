import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Interface for validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Interface for field validation rules
 */
export interface ValidationRule {
  name: string;
  validator: ValidatorFn;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Service for comprehensive form validation with custom rules and messages.
 * Provides reusable validation functions and centralized validation logic.
 * 
 * @example
 * ```typescript
 * constructor(private validationService: ValidationService) {}
 * 
 * validateEmail(email: string): ValidationResult {
 *   return this.validationService.validateField(email, 'email');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private validationRules: Map<string, ValidationRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initializes default validation rules
   */
  private initializeDefaultRules(): void {
    // Email validation
    this.addValidationRule('email', {
      name: 'email',
      validator: this.emailValidator(),
      message: 'Please enter a valid email address',
      severity: 'error'
    });

    // Password validation
    this.addValidationRule('password', {
      name: 'minLength',
      validator: this.minLengthValidator(8),
      message: 'Password must be at least 8 characters long',
      severity: 'error'
    });

    this.addValidationRule('password', {
      name: 'hasUpperCase',
      validator: this.patternValidator(/[A-Z]/),
      message: 'Password must contain at least one uppercase letter',
      severity: 'error'
    });

    this.addValidationRule('password', {
      name: 'hasLowerCase',
      validator: this.patternValidator(/[a-z]/),
      message: 'Password must contain at least one lowercase letter',
      severity: 'error'
    });

    this.addValidationRule('password', {
      name: 'hasNumber',
      validator: this.patternValidator(/\d/),
      message: 'Password must contain at least one number',
      severity: 'error'
    });

    this.addValidationRule('password', {
      name: 'hasSpecialChar',
      validator: this.patternValidator(/[!@#$%^&*(),.?":{}|<>]/),
      message: 'Password must contain at least one special character',
      severity: 'error'
    });

    // Phone validation
    this.addValidationRule('phone', {
      name: 'phone',
      validator: this.phoneValidator(),
      message: 'Please enter a valid phone number',
      severity: 'error'
    });

    // Name validation
    this.addValidationRule('name', {
      name: 'minLength',
      validator: this.minLengthValidator(2),
      message: 'Name must be at least 2 characters long',
      severity: 'error'
    });

    this.addValidationRule('name', {
      name: 'maxLength',
      validator: this.maxLengthValidator(50),
      message: 'Name must be less than 50 characters',
      severity: 'error'
    });

    this.addValidationRule('name', {
      name: 'pattern',
      validator: this.patternValidator(/^[a-zA-Z\s'-]+$/),
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
      severity: 'error'
    });
  }

  /**
   * Adds a validation rule for a specific field type
   * @param fieldType - The field type (e.g., 'email', 'password')
   * @param rule - The validation rule
   */
  addValidationRule(fieldType: string, rule: ValidationRule): void {
    if (!this.validationRules.has(fieldType)) {
      this.validationRules.set(fieldType, []);
    }
    this.validationRules.get(fieldType)!.push(rule);
  }

  /**
   * Validates a field value against its type rules
   * @param value - The value to validate
   * @param fieldType - The field type to validate against
   * @returns Validation result with errors and warnings
   */
  validateField(value: any, fieldType: string): ValidationResult {
    const rules = this.validationRules.get(fieldType) || [];
    const errors: string[] = [];
    const warnings: string[] = [];

    rules.forEach(rule => {
      const control = { value } as AbstractControl;
      const validationResult = rule.validator(control);
      
      if (validationResult) {
        if (rule.severity === 'error') {
          errors.push(rule.message);
        } else {
          warnings.push(rule.message);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validates multiple fields at once
   * @param fields - Object with field names and their values/types
   * @returns Object with validation results for each field
   */
  validateFields(fields: { [key: string]: { value: any; type: string } }): { [key: string]: ValidationResult } {
    const results: { [key: string]: ValidationResult } = {};
    
    Object.entries(fields).forEach(([fieldName, fieldData]) => {
      results[fieldName] = this.validateField(fieldData.value, fieldData.type);
    });
    
    return results;
  }

  /**
   * Creates an email validator
   * @returns Validator function for email
   */
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(control.value) ? null : { email: true };
    };
  }

  /**
   * Creates a phone number validator
   * @returns Validator function for phone numbers
   */
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = control.value.replace(/\s/g, '');
      return phoneRegex.test(cleanPhone) ? null : { phone: true };
    };
  }

  /**
   * Creates a minimum length validator
   * @param minLength - Minimum required length
   * @returns Validator function for minimum length
   */
  minLengthValidator(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      return control.value.length >= minLength ? null : { minlength: { requiredLength: minLength, actualLength: control.value.length } };
    };
  }

  /**
   * Creates a maximum length validator
   * @param maxLength - Maximum allowed length
   * @returns Validator function for maximum length
   */
  maxLengthValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      return control.value.length <= maxLength ? null : { maxlength: { requiredLength: maxLength, actualLength: control.value.length } };
    };
  }

  /**
   * Creates a pattern validator
   * @param pattern - Regular expression pattern
   * @returns Validator function for pattern matching
   */
  patternValidator(pattern: RegExp): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      return pattern.test(control.value) ? null : { pattern: true };
    };
  }

  /**
   * Creates a required field validator
   * @returns Validator function for required fields
   */
  requiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value && control.value.toString().trim() ? null : { required: true };
    };
  }

  /**
   * Creates a password confirmation validator
   * @param passwordControl - The password control to match against
   * @returns Validator function for password confirmation
   */
  passwordMatchValidator(passwordControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !passwordControl.value) return null;
      
      return control.value === passwordControl.value ? null : { passwordMismatch: true };
    };
  }

  /**
   * Creates a date range validator
   * @param minDate - Minimum allowed date
   * @param maxDate - Maximum allowed date
   * @returns Validator function for date range
   */
  dateRangeValidator(minDate?: Date, maxDate?: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const date = new Date(control.value);
      const errors: ValidationErrors = {};
      
      if (minDate && date < minDate) {
        errors['minDate'] = { minDate, actualDate: date };
      }
      
      if (maxDate && date > maxDate) {
        errors['maxDate'] = { maxDate, actualDate: date };
      }
      
      return Object.keys(errors).length ? errors : null;
    };
  }

  /**
   * Creates a number range validator
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Validator function for number range
   */
  numberRangeValidator(min?: number, max?: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const num = Number(control.value);
      const errors: ValidationErrors = {};
      
      if (min !== undefined && num < min) {
        errors['min'] = { min, actual: num };
      }
      
      if (max !== undefined && num > max) {
        errors['max'] = { max, actual: num };
      }
      
      return Object.keys(errors).length ? errors : null;
    };
  }

  /**
   * Gets all validation rules for a field type
   * @param fieldType - The field type
   * @returns Array of validation rules
   */
  getValidationRules(fieldType: string): ValidationRule[] {
    return this.validationRules.get(fieldType) || [];
  }

  /**
   * Removes a validation rule
   * @param fieldType - The field type
   * @param ruleName - The rule name to remove
   */
  removeValidationRule(fieldType: string, ruleName: string): void {
    const rules = this.validationRules.get(fieldType);
    if (rules) {
      const index = rules.findIndex(rule => rule.name === ruleName);
      if (index > -1) {
        rules.splice(index, 1);
      }
    }
  }

  /**
   * Clears all validation rules for a field type
   * @param fieldType - The field type
   */
  clearValidationRules(fieldType: string): void {
    this.validationRules.delete(fieldType);
  }
}
