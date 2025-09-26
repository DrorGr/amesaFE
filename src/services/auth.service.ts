import { Injectable, signal } from '@angular/core';
import { User } from '../models/house.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  
  getCurrentUser() {
    return this.currentUser.asReadonly();
  }

  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser.set({
          id: '1',
          name: 'John Doe',
          email: email,
          isAuthenticated: true,
          provider: 'email'
        });
        resolve(true);
      }, 1000);
    });
  }

  register(name: string, email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser.set({
          id: '1',
          name: name,
          email: email,
          isAuthenticated: true,
          provider: 'email'
        });
        resolve(true);
      }, 1000);
    });
  }

  logout(): void {
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUser()?.isAuthenticated || false;
  }

  // Social Login Methods
  async loginWithGoogle(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate Google OAuth flow
        this.currentUser.set({
          id: 'google_1',
          name: 'Google User',
          email: 'user@gmail.com',
          isAuthenticated: true,
          provider: 'google'
        });
        resolve(true);
      }, 1000);
    });
  }

  async loginWithMeta(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate Meta/Facebook OAuth flow
        this.currentUser.set({
          id: 'meta_1',
          name: 'Meta User',
          email: 'user@facebook.com',
          isAuthenticated: true,
          provider: 'meta'
        });
        resolve(true);
      }, 1000);
    });
  }

  async loginWithApple(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate Apple OAuth flow
        this.currentUser.set({
          id: 'apple_1',
          name: 'Apple User',
          email: 'user@icloud.com',
          isAuthenticated: true,
          provider: 'apple'
        });
        resolve(true);
      }, 1000);
    });
  }

  async loginWithTwitter(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate Twitter OAuth flow
        this.currentUser.set({
          id: 'twitter_1',
          name: 'Twitter User',
          email: 'user@twitter.com',
          isAuthenticated: true,
          provider: 'twitter'
        });
        resolve(true);
      }, 1000);
    });
  }

  // Password Reset Methods
  async requestPasswordReset(email: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate sending password reset email
        console.log(`Password reset email sent to: ${email}`);
        resolve(true);
      }, 1000);
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate password reset
        console.log(`Password reset with token: ${token}`);
        resolve(true);
      }, 1000);
    });
  }
}