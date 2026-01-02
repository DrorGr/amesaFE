import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ContentService, ContentDto, ContentCategoryDto } from './content.service';

describe('ContentService', () => {
  let service: ContentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContentService]
    });
    service = TestBed.inject(ContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get content list', () => {
    const mockResponse = {
      success: true,
      data: {
        items: [
          {
            id: '1',
            title: 'Test Content',
            content: 'Test content',
            type: 'article',
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date(),
            viewCount: 0,
            isFeatured: false
          }
        ],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      }
    };

    service.getContent({ page: 1, limit: 10 }).subscribe(response => {
      expect(response.items.length).toBe(1);
      expect(response.page).toBe(1);
    });

    const req = httpMock.expectOne(req => req.url.includes('/api/v1/content') && req.method === 'GET');
    req.flush(mockResponse);
  });

  it('should get content by id', () => {
    const mockResponse = {
      success: true,
      data: {
        id: '1',
        title: 'Test Content',
        content: 'Test content',
        type: 'article',
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        isFeatured: false
      }
    };

    service.getContentById('1').subscribe(response => {
      expect(response.id).toBe('1');
      expect(response.title).toBe('Test Content');
    });

    const req = httpMock.expectOne('/api/v1/content/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get categories', () => {
    const mockResponse = {
      success: true,
      data: [
        {
          id: '1',
          name: 'Category 1',
          slug: 'category-1',
          isActive: true,
          sortOrder: 1,
          createdAt: new Date()
        }
      ]
    };

    service.getCategories().subscribe(response => {
      expect(response.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/v1/content/categories');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should filter content by language', () => {
    const mockResponse = {
      success: true,
      data: {
        items: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };

    service.getContent({ language: 'en' }).subscribe();

    const req = httpMock.expectOne(req => req.url.includes('/api/v1/content') && req.params.get('language') === 'en');
    req.flush(mockResponse);
  });

  it('should handle content load error', () => {
    service.getContent().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(req => req.url.includes('/api/v1/content'));
    req.flush({ error: { message: 'Server error' } }, { status: 500, statusText: 'Internal Server Error' });
  });
});








