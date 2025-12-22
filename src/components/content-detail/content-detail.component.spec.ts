import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ContentDetailComponent } from './content-detail.component';
import { ContentService, ContentDto } from '../../services/content.service';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';

describe('ContentDetailComponent', () => {
  let component: ContentDetailComponent;
  let fixture: ComponentFixture<ContentDetailComponent>;
  let mockContentService: jasmine.SpyObj<ContentService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockLocaleService: jasmine.SpyObj<LocaleService>;
  let mockActivatedRoute: any;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockContent: ContentDto = {
    id: '1',
    title: 'Test Content',
    excerpt: 'Test excerpt',
    content: 'Test content body',
    contentType: 'article',
    categoryId: 'cat1',
    language: 'en',
    status: 'published',
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const contentServiceSpy = jasmine.createSpyObj('ContentService', ['getContentById']);
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const localeServiceSpy = jasmine.createSpyObj('LocaleService', ['formatDate']);
    localeServiceSpy.formatDate.and.returnValue('Jan 1, 2024');
    
    mockActivatedRoute = {
      params: of({ id: '1' })
    };
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        ContentDetailComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ContentService, useValue: contentServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentDetailComponent);
    component = fixture.componentInstance;
    mockContentService = TestBed.inject(ContentService) as jasmine.SpyObj<ContentService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockLocaleService = TestBed.inject(LocaleService) as jasmine.SpyObj<LocaleService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load content on init', () => {
    mockContentService.getContentById.and.returnValue(of(mockContent));
    
    component.ngOnInit();
    
    expect(mockContentService.getContentById).toHaveBeenCalledWith('1');
    expect(component.content()).toEqual(mockContent);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle load error', () => {
    const error = { message: 'Content not found' };
    mockContentService.getContentById.and.returnValue(throwError(() => error));
    
    component.ngOnInit();
    
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBeTruthy();
  });

  it('should navigate back', () => {
    component.goBack();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/content']);
  });
});






