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
          isAuthenticated: true
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
          isAuthenticated: true
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
}