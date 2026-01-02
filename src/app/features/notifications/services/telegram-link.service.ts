import { Injectable, signal, computed } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';

export interface TelegramLink {
  id: string;
  userId: string;
  telegramUserId: number;
  telegramUsername?: string;
  verified: boolean;
  createdAt: Date;
}

export interface TelegramLinkRequest {
  verificationCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class TelegramLinkService {
  private linkStatus = signal<TelegramLink | null>(null);
  private verificationCode = signal<string | null>(null);

  constructor(private apiService: ApiService) {}

  getLinkStatus() {
    return computed(() => this.linkStatus());
  }

  getVerificationCode() {
    return computed(() => this.verificationCode());
  }

  fetchStatus(): Observable<TelegramLink | null> {
    return this.apiService.get<TelegramLink>('notifications/telegram/status').pipe(
      tap(response => {
        if (response.success) {
          this.linkStatus.set(response.data ?? null);
        }
      }),
      map(response => response.data ?? null),
      catchError(error => {
        console.error('Error fetching Telegram link status:', error);
        return throwError(() => error);
      })
    );
  }

  requestLink(): Observable<TelegramLink> {
    return this.apiService.post<TelegramLink>('notifications/telegram/link', {}).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.linkStatus.set(response.data);
          // Extract verification code from message if present
          if (response.message) {
            const codeMatch = response.message.match(/Verification code: (\w+)/);
            if (codeMatch) {
              this.verificationCode.set(codeMatch[1]);
            }
          }
        }
      }),
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to request Telegram link');
      }),
      catchError(error => {
        console.error('Error requesting Telegram link:', error);
        return throwError(() => error);
      })
    );
  }

  verifyLink(verificationCode: string): Observable<TelegramLink> {
    const request: TelegramLinkRequest = { verificationCode };
    return this.apiService.post<TelegramLink>('notifications/telegram/verify', request).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.linkStatus.set(response.data);
          this.verificationCode.set(null);
        }
      }),
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to verify Telegram link');
      }),
      catchError(error => {
        console.error('Error verifying Telegram link:', error);
        return throwError(() => error);
      })
    );
  }

  unlink(): Observable<boolean> {
    return this.apiService.delete<boolean>('notifications/telegram/unlink').pipe(
      tap(response => {
        if (response.success) {
          this.linkStatus.set(null);
          this.verificationCode.set(null);
        }
      }),
      map(response => response.success),
      catchError(error => {
        console.error('Error unlinking Telegram account:', error);
        return throwError(() => error);
      })
    );
  }
}

