import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, PagedResponse } from './api.service';

export interface ContentDto {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  type: string;
  status: string;
  categoryId?: string;
  categoryName?: string;
  tags?: string[];
  featuredImageUrl?: string;
  authorId: string;
  authorName?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface ContentCategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface CreateContentRequest {
  title: string;
  content: string;
  excerpt?: string;
  type: string;
  categoryId?: string;
  tags?: string[];
  featuredImageUrl?: string;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface UpdateContentRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  type?: string;
  categoryId?: string;
  tags?: string[];
  featuredImageUrl?: string;
  status?: string;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {

  constructor(private apiService: ApiService) {}

  // Content Management
  getContent(params?: {
    page?: number;
    limit?: number;
    type?: string;
    categoryId?: string;
    status?: string;
    isFeatured?: boolean;
    search?: string;
  }): Observable<PagedResponse<ContentDto>> {
    return this.apiService.get<PagedResponse<ContentDto>>('content', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch content');
      }),
      catchError(error => {
        console.error('Error fetching content:', error);
        return throwError(() => error);
      })
    );
  }

  getContentById(id: string): Observable<ContentDto> {
    return this.apiService.get<ContentDto>(`content/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch content');
      }),
      catchError(error => {
        console.error('Error fetching content:', error);
        return throwError(() => error);
      })
    );
  }

  createContent(contentData: CreateContentRequest): Observable<ContentDto> {
    return this.apiService.post<ContentDto>('content', contentData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to create content');
      }),
      catchError(error => {
        console.error('Error creating content:', error);
        return throwError(() => error);
      })
    );
  }

  updateContent(id: string, contentData: UpdateContentRequest): Observable<ContentDto> {
    return this.apiService.put<ContentDto>(`content/${id}`, contentData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update content');
      }),
      catchError(error => {
        console.error('Error updating content:', error);
        return throwError(() => error);
      })
    );
  }

  deleteContent(id: string): Observable<boolean> {
    return this.apiService.delete(`content/${id}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting content:', error);
        return throwError(() => error);
      })
    );
  }

  publishContent(id: string): Observable<boolean> {
    return this.apiService.put(`content/${id}/publish`, {}).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error publishing content:', error);
        return throwError(() => error);
      })
    );
  }

  unpublishContent(id: string): Observable<boolean> {
    return this.apiService.put(`content/${id}/unpublish`, {}).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error unpublishing content:', error);
        return throwError(() => error);
      })
    );
  }

  // Category Management
  getCategories(): Observable<ContentCategoryDto[]> {
    return this.apiService.get<ContentCategoryDto[]>('content/categories').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch categories');
      }),
      catchError(error => {
        console.error('Error fetching categories:', error);
        return throwError(() => error);
      })
    );
  }

  getCategoryById(id: string): Observable<ContentCategoryDto> {
    return this.apiService.get<ContentCategoryDto>(`content/categories/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch category');
      }),
      catchError(error => {
        console.error('Error fetching category:', error);
        return throwError(() => error);
      })
    );
  }

  createCategory(categoryData: CreateCategoryRequest): Observable<ContentCategoryDto> {
    return this.apiService.post<ContentCategoryDto>('content/categories', categoryData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to create category');
      }),
      catchError(error => {
        console.error('Error creating category:', error);
        return throwError(() => error);
      })
    );
  }

  updateCategory(id: string, categoryData: UpdateCategoryRequest): Observable<ContentCategoryDto> {
    return this.apiService.put<ContentCategoryDto>(`content/categories/${id}`, categoryData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to update category');
      }),
      catchError(error => {
        console.error('Error updating category:', error);
        return throwError(() => error);
      })
    );
  }

  deleteCategory(id: string): Observable<boolean> {
    return this.apiService.delete(`content/categories/${id}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error deleting category:', error);
        return throwError(() => error);
      })
    );
  }

  // Public content methods (for frontend display)
  getPublishedContent(params?: {
    page?: number;
    limit?: number;
    type?: string;
    categoryId?: string;
    isFeatured?: boolean;
    search?: string;
  }): Observable<PagedResponse<ContentDto>> {
    return this.apiService.get<PagedResponse<ContentDto>>('content/published', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch published content');
      }),
      catchError(error => {
        console.error('Error fetching published content:', error);
        return throwError(() => error);
      })
    );
  }

  getFeaturedContent(): Observable<ContentDto[]> {
    return this.apiService.get<ContentDto[]>('content/featured').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch featured content');
      }),
      catchError(error => {
        console.error('Error fetching featured content:', error);
        return throwError(() => error);
      })
    );
  }

  incrementViewCount(id: string): Observable<boolean> {
    return this.apiService.post(`content/${id}/view`, {}).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Error incrementing view count:', error);
        return throwError(() => error);
      })
    );
  }
}
