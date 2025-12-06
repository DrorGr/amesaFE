import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface ProductDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  productType: string;
  status: string;
  basePrice: number;
  currency: string;
  pricingModel?: string;
  pricingMetadata?: Record<string, any>;
  availableFrom?: Date;
  availableUntil?: Date;
  maxQuantityPerUser?: number;
  totalQuantityAvailable?: number;
  quantitySold: number;
  productMetadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductValidationRequest {
  productId: string;
  quantity: number;
}

export interface ProductValidationResponse {
  isValid: boolean;
  errors: string[];
  calculatedPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private apiService: ApiService) {}

  getProducts(type?: string): Observable<ProductDto[]> {
    const url = type ? `products?type=${type}` : 'products';
    return this.apiService.get<ProductDto[]>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch products');
      }),
      catchError(error => {
        console.error('Error fetching products:', error);
        return throwError(() => error);
      })
    );
  }

  getProduct(id: string): Observable<ProductDto> {
    return this.apiService.get<ProductDto>(`products/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch product');
      }),
      catchError(error => {
        console.error('Error fetching product:', error);
        return throwError(() => error);
      })
    );
  }

  validateProduct(request: ProductValidationRequest): Observable<ProductValidationResponse> {
    return this.apiService.post<ProductValidationResponse>(`products/${request.productId}/validate`, request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to validate product');
      }),
      catchError(error => {
        console.error('Error validating product:', error);
        return throwError(() => error);
      })
    );
  }

  getProductPrice(productId: string, quantity: number = 1): Observable<number> {
    return this.validateProduct({ productId, quantity }).pipe(
      map(response => response.calculatedPrice),
      catchError(error => {
        console.error('Error getting product price:', error);
        return throwError(() => error);
      })
    );
  }

  getProductByHouseId(houseId: string): Observable<ProductDto> {
    return this.apiService.get<ProductDto>(`products/by-house/${houseId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch product for house');
      }),
      catchError(error => {
        console.error('Error fetching product for house:', error);
        return throwError(() => error);
      })
    );
  }
}

