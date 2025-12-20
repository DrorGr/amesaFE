import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ContentListComponent } from './content-list.component';
import { ContentService, ContentDto, ContentCategoryDto, PagedResponse } from '../../services/content.service';
import { TranslationService } from '../../services/translation.service';
import { LocaleService } from '../../services/locale.service';

describe('ContentListComponent', () => {
  let component: ContentListComponent;
  let fixture: ComponentFixture<ContentListComponent>;
  let mockContentService: jasmine.SpyObj<ContentService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockLocaleService: jasmine.SpyObj<LocaleService>;

  const mockContent: ContentDto[] = [
    {
      id: '1',
      title: 'Test Content',
      excerpt: 'Test excerpt',
      content: 'Test content',
      contentType: 'article',
      categoryId: 'cat1',
      language: 'en',
      status: 'published',
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockCategories: ContentCategoryDto[] = [
    { id: 'cat1', name: 'Category 1', description: 'Test category' }
  ];

  const mockPagedResponse: PagedResponse<ContentDto> = {
    items: mockContent,
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    const contentServiceSpy = jasmine.createSpyObj('ContentService', [
      'getContent',
      'getCategories'
    ]);
    
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.returnValue('Translated text');
    
    const localeServiceSpy = jasmine.createSpyObj('LocaleService', [
      'formatDate',
      'formatCurrency',
      'getCurrencyCode'
    ]);
    localeServiceSpy.formatDate.and.returnValue('Jan 1, 2024');
    localeServiceSpy.formatCurrency.and.returnValue('$10.00');
    localeServiceSpy.getCurrencyCode.and.returnValue('USD');

    await TestBed.configureTestingModule({
      imports: [
        ContentListComponent,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ContentService, useValue: contentServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentListComponent);
    component = fixture.componentInstance;
    mockContentService = TestBed.inject(ContentService) as jasmine.SpyObj<ContentService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    mockLocaleService = TestBed.inject(LocaleService) as jasmine.SpyObj<LocaleService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load content and categories on init', () => {
    mockContentService.getContent.and.returnValue(of(mockPagedResponse));
    mockContentService.getCategories.and.returnValue(of(mockCategories));
    
    component.ngOnInit();
    
    expect(mockContentService.getContent).toHaveBeenCalled();
    expect(mockContentService.getCategories).toHaveBeenCalled();
    expect(component.content()).toEqual(mockContent);
    expect(component.categories()).toEqual(mockCategories);
  });

  it('should apply filters', () => {
    mockContentService.getContent.and.returnValue(of(mockPagedResponse));
    component.filters.set({ contentType: 'article', language: 'en' });
    
    component.applyFilters();
    
    expect(mockContentService.getContent).toHaveBeenCalledWith(
      jasmine.objectContaining({ contentType: 'article', language: 'en' })
    );
  });

  it('should clear filters', () => {
    component.filters.set({ contentType: 'article', search: 'test' });
    
    component.clearFilters();
    
    expect(component.filters().contentType).toBeUndefined();
    expect(component.filters().search).toBeUndefined();
  });

  it('should handle load error', () => {
    const error = { message: 'Failed to load content' };
    mockContentService.getContent.and.returnValue(throwError(() => error));
    
    component.ngOnInit();
    
    expect(component.isLoading()).toBe(false);
  });

  it('should navigate to next page', () => {
    component.pagination.set({ page: 1, limit: 10, total: 20, totalPages: 2 });
    mockContentService.getContent.and.returnValue(of(mockPagedResponse));
    
    component.nextPage();
    
    expect(mockContentService.getContent).toHaveBeenCalled();
  });

  it('should navigate to previous page', () => {
    component.pagination.set({ page: 2, limit: 10, total: 20, totalPages: 2 });
    mockContentService.getContent.and.returnValue(of(mockPagedResponse));
    
    component.previousPage();
    
    expect(mockContentService.getContent).toHaveBeenCalled();
  });
});




