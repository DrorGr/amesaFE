import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, ApiResponse } from '@core/services/api.service';

export interface SecurityQuestion {
  id: string;
  question: string;
  category?: string;
}

export interface SecurityQuestionDto {
  question: string;
  answer: string;
  order?: number;
}

export interface SetupSecurityQuestionsRequest {
  questions: SecurityQuestionDto[];
}

export interface VerifySecurityQuestionRequest {
  question: string;
  answer: string;
}

export interface SecurityQuestionStatusDto {
  isSetup: boolean;
  questionsCount: number;
  questions?: SecurityQuestion[];
}

@Injectable({
  providedIn: 'root'
})
export class SecurityQuestionsService {

  constructor(private apiService: ApiService) { }

  /**
   * Sets up security questions for the current user.
   * @param request The security questions setup request.
   * @returns An Observable indicating success.
   */
  setupSecurityQuestions(request: SetupSecurityQuestionsRequest): Observable<boolean> {
    return this.apiService.post<any>('auth/recovery/security-questions', request).pipe(
      map(response => {
        if (response.success) {
          return true;
        }
        throw new Error(response.error?.message || 'Failed to setup security questions');
      }),
      catchError(error => {
        console.error('Error setting up security questions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifies a security question answer.
   * @param question The security question text.
   * @param answer The answer to verify.
   * @returns An Observable indicating if the answer is correct.
   */
  verifySecurityQuestion(question: string, answer: string): Observable<boolean> {
    const request: VerifySecurityQuestionRequest = { question, answer };
    return this.apiService.post<any>(`auth/recovery/verify-question`, request).pipe(
      map(response => {
        if (response.success) {
          return true;
        }
        throw new Error(response.error?.message || 'Failed to verify security question');
      }),
      catchError(error => {
        console.error('Error verifying security question:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets the security questions status for the current user.
   * @returns An Observable with the security questions status.
   */
  getSecurityQuestionsStatus(): Observable<SecurityQuestionStatusDto> {
    return this.apiService.get<SecurityQuestionStatusDto>('auth/security-questions/status').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to get security questions status');
      }),
      catchError(error => {
        console.error('Error getting security questions status:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets available security questions for setup.
   * @returns An Observable with a list of available security questions.
   */
  getAvailableQuestions(): Observable<SecurityQuestion[]> {
    return this.apiService.get<SecurityQuestion[]>('auth/security-questions/available').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to get available security questions');
      }),
      catchError(error => {
        console.error('Error getting available security questions:', error);
        return throwError(() => error);
      })
    );
  }
}

