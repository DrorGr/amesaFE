import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';

interface UserSession {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastActivity: Date | string;
  isCurrent: boolean;
  sessionToken?: string; // For logout operations
}

@Component({
  selector: 'app-sessions-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          <div class="mb-8">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('auth.activeSessions') }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              {{ translate('auth.activeSessionsDescription') }}
            </p>
          </div>

          @if (isLoading()) {
            <div class="text-center py-12">
              <svg class="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          } @else if (sessions().length === 0) {
            <div class="text-center py-12">
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('auth.noActiveSessions') }}
              </p>
            </div>
          } @else {
            <div class="space-y-4 mb-8">
              @for (session of sessions(); track session.id) {
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center mb-2">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mr-3">
                          {{ session.deviceName }}
                        </h3>
                        @if (session.isCurrent) {
                          <span class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200 rounded-full">
                            {{ translate('auth.currentSession') }}
                          </span>
                        }
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <span class="font-medium">{{ translate('auth.ipAddress') }}:</span> {{ session.ipAddress }}
                        </p>
                        <p>
                          <span class="font-medium">{{ translate('auth.lastActivity') }}:</span> 
                          {{ formatDate(session.lastActivity) }}
                        </p>
                      </div>
                    </div>
                    @if (!session.isCurrent) {
                      <button
                        (click)="logoutFromDevice(session.id)"
                        [disabled]="isLoggingOut()"
                        class="ml-4 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-transparent border-2 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50">
                        {{ translate('auth.logoutFromDevice') }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                (click)="logoutAllDevices()"
                [disabled]="isLoggingOut()"
                class="w-full px-6 py-3 text-lg font-semibold text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 rounded-lg transition-all duration-200 disabled:opacity-50">
                @if (isLoggingOut()) {
                  <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ translate('auth.loggingOut') }}
                  </span>
                } @else {
                  {{ translate('auth.logoutAllDevices') }}
                }
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class SessionsManagementComponent implements OnInit {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);

  sessions = signal<UserSession[]>([]);
  isLoading = signal(true);
  isLoggingOut = signal(false);

  ngOnInit() {
    this.loadSessions();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  async loadSessions() {
    this.isLoading.set(true);
    try {
      const sessions = await this.authService.getActiveSessions().toPromise() || [];
      // Mark current session
      const currentSessionToken = localStorage.getItem('refresh_token');
      const sessionsWithCurrent = sessions.map((s: any) => ({
        id: s.id || s.sessionToken || '',
        deviceName: s.deviceName || 'Unknown Device',
        ipAddress: s.ipAddress || 'Unknown',
        lastActivity: s.lastActivity || s.lastActivityAt || new Date(),
        sessionToken: s.sessionToken || s.id || '',
        isCurrent: (s.sessionToken || s.id) === currentSessionToken
      }));
      this.sessions.set(sessionsWithCurrent);
    } catch (error) {
      console.error('Error loading sessions:', error);
      this.toastService.error(this.translate('auth.failedToLoadSessions'), 3000);
    } finally {
      this.isLoading.set(false);
    }
  }

  async logoutFromDevice(sessionId: string) {
    if (!confirm(this.translate('auth.confirmLogoutFromDevice'))) {
      return;
    }

    this.isLoggingOut.set(true);
    try {
      const session = this.sessions().find(s => s.id === sessionId);
      if (!session || !session.sessionToken) {
        throw new Error('Session not found');
      }

      const success = await this.authService.logoutFromDevice(session.sessionToken).toPromise();
      if (success) {
        this.toastService.success(this.translate('auth.loggedOutFromDevice'), 3000);
        await this.loadSessions();
      }
    } catch (error) {
      console.error('Error logging out from device:', error);
      this.toastService.error(this.translate('auth.failedToLogoutFromDevice'), 3000);
    } finally {
      this.isLoggingOut.set(false);
    }
  }

  async logoutAllDevices() {
    if (!confirm(this.translate('auth.confirmLogoutAllDevices'))) {
      return;
    }

    this.isLoggingOut.set(true);
    try {
      const success = await this.authService.logoutAllDevices().toPromise();
      if (success) {
        this.toastService.success(this.translate('auth.loggedOutAllDevices'), 3000);
        // Redirect to login after logging out all devices
        setTimeout(() => {
          this.authService.logout();
        }, 1000);
      }
    } catch (error) {
      console.error('Error logging out all devices:', error);
      this.toastService.error(this.translate('auth.failedToLogoutAllDevices'), 3000);
    } finally {
      this.isLoggingOut.set(false);
    }
  }
}

