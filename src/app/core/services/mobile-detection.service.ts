import { Injectable, signal, HostListener } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MobileDetectionService {
  private readonly MOBILE_BREAKPOINT = 990;
  
  // Signal for reactive mobile state
  public isMobile = signal(false);
  
  constructor() {
    this.checkMobile();
  }

  @HostListener('window:resize', ['$event'])
  onResize(_event: any) {
    this.checkMobile();
  }

  private checkMobile() {
    const mobile = window.innerWidth <= this.MOBILE_BREAKPOINT;
    this.isMobile.set(mobile);
    console.log('Global mobile detection:', mobile, 'Width:', window.innerWidth);
  }

  // Getter for non-signal usage
  get isMobileView(): boolean {
    return this.isMobile();
  }

  // Getter for the breakpoint
  get breakpoint(): number {
    return this.MOBILE_BREAKPOINT;
  }
}
