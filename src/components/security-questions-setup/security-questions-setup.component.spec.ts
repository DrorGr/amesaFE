import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { SecurityQuestionsSetupComponent } from './security-questions-setup.component';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

describe('SecurityQuestionsSetupComponent', () => {
  let component: SecurityQuestionsSetupComponent;
  let fixture: ComponentFixture<SecurityQuestionsSetupComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockQuestions = [
    { id: 1, question: 'What is your mother\'s maiden name?' },
    { id: 2, question: 'What city were you born in?' },
    { id: 3, question: 'What was the name of your first pet?' }
  ];

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getSecurityQuestions',
      'setupSecurityQuestions'
    ]);
    
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        SecurityQuestionsSetupComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityQuestionsSetupComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load questions on init', () => {
    mockAuthService.getSecurityQuestions.and.returnValue(of(mockQuestions));
    
    component.ngOnInit();
    
    expect(mockAuthService.getSecurityQuestions).toHaveBeenCalled();
    expect(component.questions()).toEqual(mockQuestions);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle questions load error', () => {
    const error = { message: 'Failed to load questions' };
    mockAuthService.getSecurityQuestions.and.returnValue(throwError(() => error));
    
    component.ngOnInit();
    
    expect(component.isLoading()).toBe(false);
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should submit security questions successfully', () => {
    component.questions.set(mockQuestions);
    component.selectedQuestions.set([
      { questionId: 1, answer: 'Smith' },
      { questionId: 2, answer: 'New York' },
      { questionId: 3, answer: 'Fluffy' }
    ]);
    mockAuthService.setupSecurityQuestions.and.returnValue(of({ success: true }));
    
    component.submitQuestions();
    
    expect(mockAuthService.setupSecurityQuestions).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should handle submit error', () => {
    component.selectedQuestions.set([
      { questionId: 1, answer: 'Smith' }
    ]);
    const error = { message: 'Setup failed' };
    mockAuthService.setupSecurityQuestions.and.returnValue(throwError(() => error));
    
    component.submitQuestions();
    
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should not submit with incomplete questions', () => {
    component.selectedQuestions.set([
      { questionId: 1, answer: 'Smith' }
    ]);
    
    component.submitQuestions();
    
    expect(mockAuthService.setupSecurityQuestions).not.toHaveBeenCalled();
  });

  it('should add question selection', () => {
    component.questions.set(mockQuestions);
    
    component.selectQuestion(1);
    
    expect(component.selectedQuestions().length).toBe(1);
    expect(component.selectedQuestions()[0].questionId).toBe(1);
  });

  it('should remove question selection', () => {
    component.selectedQuestions.set([
      { questionId: 1, answer: 'Smith' }
    ]);
    
    component.removeQuestion(1);
    
    expect(component.selectedQuestions().length).toBe(0);
  });
});




