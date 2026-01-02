import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SecurityQuestionsRecoveryComponent } from './security-questions-recovery.component';
import { AuthService } from '@core/services/auth.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastService } from '@core/services/toast.service';

describe('SecurityQuestionsRecoveryComponent', () => {
  let component: SecurityQuestionsRecoveryComponent;
  let fixture: ComponentFixture<SecurityQuestionsRecoveryComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockQuestions = [
    { id: 1, question: 'What is your mother\'s maiden name?' },
    { id: 2, question: 'What city were you born in?' }
  ];

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getSecurityQuestions',
      'verifySecurityQuestion'
    ]);
    
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        SecurityQuestionsRecoveryComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityQuestionsRecoveryComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load questions on init', () => {
    mockAuthService.getSecurityQuestions.and.returnValue(of(mockQuestions));
    
    component.ngOnInit();
    
    expect(mockAuthService.getSecurityQuestions).toHaveBeenCalled();
    expect(component.questions()).toEqual(mockQuestions);
    expect(component.currentQuestionIndex()).toBe(0);
  });

  it('should verify answer and move to next question', () => {
    component.questions.set(mockQuestions);
    component.currentQuestionIndex.set(0);
    component.answer.set('Smith');
    mockAuthService.verifySecurityQuestion.and.returnValue(of({ success: true, nextQuestionId: 2 }));
    
    component.submitAnswer();
    
    expect(mockAuthService.verifySecurityQuestion).toHaveBeenCalledWith(1, 'Smith');
    expect(component.currentQuestionIndex()).toBe(1);
  });

  it('should complete recovery after last question', () => {
    component.questions.set(mockQuestions);
    component.currentQuestionIndex.set(1);
    component.answer.set('New York');
    mockAuthService.verifySecurityQuestion.and.returnValue(of({ success: true, nextQuestionId: null }));
    
    component.submitAnswer();
    
    expect(mockToastService.success).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should handle verification error', () => {
    component.answer.set('Wrong answer');
    const error = { message: 'Incorrect answer' };
    mockAuthService.verifySecurityQuestion.and.returnValue(throwError(() => error));
    
    component.submitAnswer();
    
    expect(mockToastService.error).toHaveBeenCalled();
    expect(component.answer()).toBe('');
  });

  it('should not submit with empty answer', () => {
    component.answer.set('');
    
    component.submitAnswer();
    
    expect(mockAuthService.verifySecurityQuestion).not.toHaveBeenCalled();
  });
});








