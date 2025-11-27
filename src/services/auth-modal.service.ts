import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {
  private _isOpen = signal(false);
  private _mode = signal<'login' | 'register'>('login');
  
  isOpen = this._isOpen.asReadonly();
  mode = this._mode.asReadonly();
  
  open(mode: 'login' | 'register' = 'login'): void {
    this._mode.set(mode);
    this._isOpen.set(true);
  }
  
  close(): void {
    this._isOpen.set(false);
  }
  
  setMode(mode: 'login' | 'register'): void {
    this._mode.set(mode);
  }
}

