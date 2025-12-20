import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface SecurityQuestion {
  id: string;
  question: string;
}

@Component({
  selector: 'app-security-questions-recovery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ translate('auth.recovery.securityQuestions.recoveryTitle') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ translate('auth.recovery.securityQuestions.recoveryDescription') }}
        </p>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Question Display -->
      @if (!isLoading() && currentQuestion()) {
        <div class="space-y-6">
          <!-- Current Question -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 class="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">
              {{ translate('auth.recovery.securityQuestions.question') }} {{ currentQuestionIndex() + 1 }} / {{ totalQuestions() }}
            </h3>
            <p class="text-xl text-blue-800 dark:text-blue-300 font-medium">
              {{ currentQuestion()!.question }}
            </p>
          </div>

          <!-- Answer Input -->
          <form (ngSubmit)="verifyAnswer()" class="space-y-4">
            <div>
              <label 
                for="answer" 
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ translate('auth.recovery.securityQuestions.answer') }}
              </label>
              <input
                id="answer"
                type="text"
                [(ngModel)]="currentAnswer"
                name="answer"
                [placeholder]="translate('auth.recovery.securityQuestions.answerPlaceholder')"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                [attr.aria-label]="translate('auth.recovery.securityQuestions.answer')"
                autocomplete="off"
                autofocus>
            </div>

            @if (error()) {
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p class="text-sm text-red-800 dark:text-red-200">
                  {{ error() }}
                </p>
              </div>
            }

            <button
              type="submit"
              [disabled]="isVerifying() || !currentAnswer().trim()"
              class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              @if (isVerifying()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
              }
              {{ translate('auth.recovery.securityQuestions.verify') }}
            </button>
          </form>
        </div>
      }

      <!-- Success State -->
      @if (isRecoveryComplete()) {
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div class="flex items-start">
            <svg class="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-green-800 dark:text-green-200">
                {{ translate('auth.recovery.securityQuestions.recoverySuccess') }}
              </h3>
              <p class="mt-2 text-sm text-green-700 dark:text-green-300">
                {{ translate('auth.recovery.securityQuestions.recoverySuccessMessage') }}
              </p>
              <button
                (click)="navigateToReset()"
                class="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                       transition-colors duration-200">
                {{ translate('auth.recovery.securityQuestions.resetPassword') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (!isLoading() && !currentQuestion() && !isRecoveryComplete() && error()) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p class="text-sm text-red-800 dark:text-red-200 mb-4">
            {{ error() }}
          </p>
          <button
            (click)="loadQuestions()"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                   transition-colors duration-200">
            {{ translate('auth.recovery.securityQuestions.retry') }}
          </button>
        </div>
      }
    </div>
  `
})
export class SecurityQuestionsRecoveryComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  isVerifying = signal<boolean>(false);
  questions = signal<SecurityQuestion[]>([]);
  currentQuestionIndex = signal<number>(0);
  currentAnswer = signal<string>('');
  isRecoveryComplete = signal<boolean>(false);
  error = signal<string | null>(null);

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.loadQuestions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadQuestions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const sub = this.authService.getSecurityQuestions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const questions = Array.isArray(response.data) 
            ? response.data 
            : (response.data as any).questions || [];
          this.questions.set(questions);
          if (questions.length > 0) {
            this.currentQuestionIndex.set(0);
          }
        } else {
          this.error.set(response.error?.message || this.translate('auth.recovery.securityQuestions.errors.loadFailed'));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading security questions:', err);
        this.error.set(this.getErrorMessage(err));
        this.isLoading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  verifyAnswer(): void {
    const answer = this.currentAnswer().trim();
    if (!answer) {
      return;
    }

    this.isVerifying.set(true);
    this.error.set(null);

    const sub = this.authService.verifySecurityQuestion(answer).subscribe({
      next: (response) => {
        if (response.success) {
          const nextIndex = this.currentQuestionIndex() + 1;
          if (nextIndex < this.questions().length) {
            // Move to next question
            this.currentQuestionIndex.set(nextIndex);
            this.currentAnswer.set('');
            this.toastService.success(this.translate('auth.recovery.securityQuestions.answerCorrect'));
          } else {
            // All questions answered correctly
            this.isRecoveryComplete.set(true);
            this.toastService.success(this.translate('auth.recovery.securityQuestions.recoverySuccess'));
          }
        } else {
          this.error.set(response.error?.message || this.translate('auth.recovery.securityQuestions.errors.invalidAnswer'));
        }
        this.isVerifying.set(false);
      },
      error: (err) => {
        console.error('Error verifying security question:', err);
        this.error.set(this.getErrorMessage(err));
        this.isVerifying.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  navigateToReset(): void {
    this.router.navigate(['/auth/reset-password']);
  }

  currentQuestion(): SecurityQuestion | null {
    const index = this.currentQuestionIndex();
    const questions = this.questions();
    return questions.length > index ? questions[index] : null;
  }

  totalQuestions(): number {
    return this.questions().length;
  }

  getErrorMessage(error: any): string {
    if (error?.error?.error?.code === 'RATE_LIMIT_EXCEEDED') {
      return this.translate('auth.recovery.securityQuestions.errors.rateLimit');
    }
    if (error?.error?.error?.code === 'INVALID_ANSWER') {
      return this.translate('auth.recovery.securityQuestions.errors.invalidAnswer');
    }
    return error?.error?.error?.message || this.translate('auth.recovery.securityQuestions.errors.networkError');
  }

  translate(key: string): string {
    return this.translationService.translate(key) || key;
  }
}




