import { Component, OnInit, OnDestroy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastService } from '@core/services/toast.service';
import { Subscription } from 'rxjs';

interface SecurityQuestion {
  id: string;
  question: string;
}

@Component({
  selector: 'app-security-questions-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ translate('auth.recovery.securityQuestions.title') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ translate('auth.recovery.securityQuestions.description') }}
        </p>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Setup Form -->
      @if (!isLoading() && questions().length > 0) {
        <form [formGroup]="setupForm" (ngSubmit)="submitSetup()" class="space-y-6">
          <!-- Question 1 -->
          <div>
            <label 
              for="question1" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ translate('auth.recovery.securityQuestions.question1') }}
            </label>
            <select
              id="question1"
              formControlName="question1"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{{ translate('auth.recovery.securityQuestions.selectQuestion') }}</option>
              @for (question of questions(); track question.id) {
                <option [value]="question.id">{{ question.question }}</option>
              }
            </select>
            @if (setupForm.get('question1')?.hasError('required') && setupForm.get('question1')?.touched) {
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ translate('auth.recovery.securityQuestions.errors.questionRequired') }}
              </p>
            }
          </div>

          <div>
            <label 
              for="answer1" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ translate('auth.recovery.securityQuestions.answer1') }}
            </label>
            <input
              id="answer1"
              type="text"
              formControlName="answer1"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
              [attr.aria-label]="translate('auth.recovery.securityQuestions.answer1')">
            @if (setupForm.get('answer1')?.hasError('required') && setupForm.get('answer1')?.touched) {
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ translate('auth.recovery.securityQuestions.errors.answerRequired') }}
              </p>
            }
          </div>

          <!-- Question 2 -->
          <div>
            <label 
              for="question2" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ translate('auth.recovery.securityQuestions.question2') }}
            </label>
            <select
              id="question2"
              formControlName="question2"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{{ translate('auth.recovery.securityQuestions.selectQuestion') }}</option>
              @for (question of questions(); track question.id) {
                <option [value]="question.id">{{ question.question }}</option>
              }
            </select>
            @if (setupForm.get('question2')?.hasError('required') && setupForm.get('question2')?.touched) {
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ translate('auth.recovery.securityQuestions.errors.questionRequired') }}
              </p>
            }
          </div>

          <div>
            <label 
              for="answer2" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ translate('auth.recovery.securityQuestions.answer2') }}
            </label>
            <input
              id="answer2"
              type="text"
              formControlName="answer2"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
              [attr.aria-label]="translate('auth.recovery.securityQuestions.answer2')">
            @if (setupForm.get('answer2')?.hasError('required') && setupForm.get('answer2')?.touched) {
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ translate('auth.recovery.securityQuestions.errors.answerRequired') }}
              </p>
            }
          </div>

          <!-- Question 3 -->
          <div>
            <label 
              for="question3" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ translate('auth.recovery.securityQuestions.question3') }}
            </label>
            <select
              id="question3"
              formControlName="question3"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{{ translate('auth.recovery.securityQuestions.selectQuestion') }}</option>
              @for (question of questions(); track question.id) {
                <option [value]="question.id">{{ question.question }}</option>
              }
            </select>
            @if (setupForm.get('question3')?.hasError('required') && setupForm.get('question3')?.touched) {
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ translate('auth.recovery.securityQuestions.errors.questionRequired') }}
              </p>
            }
          </div>

          <div>
            <label 
              for="answer3" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ translate('auth.recovery.securityQuestions.answer3') }}
            </label>
            <input
              id="answer3"
              type="text"
              formControlName="answer3"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
              [attr.aria-label]="translate('auth.recovery.securityQuestions.answer3')">
            @if (setupForm.get('answer3')?.hasError('required') && setupForm.get('answer3')?.touched) {
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ translate('auth.recovery.securityQuestions.errors.answerRequired') }}
              </p>
            }
          </div>

          @if (error()) {
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p class="text-sm text-red-800 dark:text-red-200">
                {{ error() }}
              </p>
            </div>
          }

          <div class="flex space-x-4">
            <button
              type="button"
              (click)="cancel.emit()"
              class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                     rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
                     transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
              {{ translate('auth.recovery.securityQuestions.cancel') }}
            </button>
            <button
              type="submit"
              [disabled]="isSubmitting() || setupForm.invalid"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              @if (isSubmitting()) {
                <i class="fas fa-spinner fa-spin mr-2"></i>
              }
              {{ translate('auth.recovery.securityQuestions.save') }}
            </button>
          </div>
        </form>
      }

      <!-- Error State -->
      @if (!isLoading() && questions().length === 0 && error()) {
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
export class SecurityQuestionsSetupComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  setupComplete = output<void>();
  cancel = output<void>();

  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  questions = signal<SecurityQuestion[]>([]);
  error = signal<string | null>(null);

  setupForm: FormGroup;

  private subscriptions = new Subscription();

  constructor() {
    this.setupForm = this.fb.group({
      question1: ['', Validators.required],
      answer1: ['', Validators.required],
      question2: ['', Validators.required],
      answer2: ['', Validators.required],
      question3: ['', Validators.required],
      answer3: ['', Validators.required]
    });
  }

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
          // Assuming response.data is an array of questions or has a questions property
          const questions = Array.isArray(response.data) 
            ? response.data 
            : (response.data as any).questions || [];
          this.questions.set(questions);
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

  submitSetup(): void {
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.setupForm.value;
    const questionsData = [
      { questionId: parseInt(formValue.question1), answer: formValue.answer1 },
      { questionId: parseInt(formValue.question2), answer: formValue.answer2 },
      { questionId: parseInt(formValue.question3), answer: formValue.answer3 }
    ];

    const sub = this.authService.setupSecurityQuestions(questionsData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate('auth.recovery.securityQuestions.setupSuccess'));
          this.setupComplete.emit();
        } else {
          this.error.set(response.error?.message || this.translate('auth.recovery.securityQuestions.errors.setupFailed'));
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Error setting up security questions:', err);
        this.error.set(this.getErrorMessage(err));
        this.isSubmitting.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  getErrorMessage(error: any): string {
    if (error?.error?.error?.code === 'RATE_LIMIT_EXCEEDED') {
      return this.translate('auth.recovery.securityQuestions.errors.rateLimit');
    }
    return error?.error?.error?.message || this.translate('auth.recovery.securityQuestions.errors.networkError');
  }

  translate(key: string): string {
    return this.translationService.translate(key) || key;
  }
}

