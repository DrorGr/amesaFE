import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HeartAnimationConfig {
  fromElement: HTMLElement;
  toElement: HTMLElement;
  onComplete?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class HeartAnimationService {
  private animationActive = new BehaviorSubject<boolean>(false);
  private activeTimers: number[] = [];
  
  getAnimationActive(): Observable<boolean> {
    return this.animationActive.asObservable();
  }

  /**
   * Clear all active timers to prevent memory leaks
   */
  private clearAllTimers(): void {
    this.activeTimers.forEach(timerId => clearTimeout(timerId));
    this.activeTimers = [];
  }

  /**
   * Animate a heart icon from one element to another
   */
  animateHeart(config: HeartAnimationConfig): void {
    if (this.animationActive.value) {
      // Animation already in progress, skip
      return;
    }

    // Clear any existing timers from previous animations
    this.clearAllTimers();

    this.animationActive.next(true);

    const { fromElement, toElement, onComplete } = config;

    // Get positions
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    // Create heart element using DOM API to avoid XSS vulnerability
    const heart = document.createElement('div');
    
    // Create SVG element using DOM API instead of innerHTML
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-6 h-6 text-red-500');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z');
    
    svg.appendChild(path);
    heart.appendChild(svg);
    heart.style.position = 'fixed';
    heart.style.left = `${fromRect.left + fromRect.width / 2}px`;
    heart.style.top = `${fromRect.top + fromRect.height / 2}px`;
    heart.style.width = '24px';
    heart.style.height = '24px';
    heart.style.zIndex = '10000';
    heart.style.pointerEvents = 'none';
    heart.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    heart.style.transform = 'translate(-50%, -50%)';
    heart.style.opacity = '1';

    document.body.appendChild(heart);

    // Force a reflow to ensure initial position is rendered before animation starts
    // This is critical for the CSS transition to work properly
    void heart.offsetHeight;

    // Trigger animation in next frame after reflow
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetX = toRect.left + toRect.width / 2;
        const targetY = toRect.top + toRect.height / 2;
        
        heart.style.left = `${targetX}px`;
        heart.style.top = `${targetY}px`;
        heart.style.transform = 'translate(-50%, -50%) scale(1.5)';
      });
    });

    // Add glow effect to target element's text AFTER heart reaches it (800ms delay)
    const glowClass = 'favorites-tab-glow';
    
    // Wait for heart to reach target before applying glow
    const timer1 = window.setTimeout(() => {
      if (document.body.contains(toElement)) {
        toElement.classList.add(glowClass);
      }
      
      // Remove glow after animation completes (2s animation duration)
      const timer2 = window.setTimeout(() => {
        if (document.body.contains(toElement)) {
          toElement.classList.remove(glowClass);
        }
        this.activeTimers = this.activeTimers.filter(t => t !== timer2);
      }, 2000);
      this.activeTimers.push(timer2);
      this.activeTimers = this.activeTimers.filter(t => t !== timer1);
    }, 800);
    this.activeTimers.push(timer1);

    // Clean up heart after animation
    const timer3 = window.setTimeout(() => {
      if (document.body.contains(heart)) {
        heart.style.opacity = '0';
        heart.style.transform = 'translate(-50%, -50%) scale(0.5)';
      }
      
      const timer4 = window.setTimeout(() => {
        if (document.body.contains(heart)) {
          document.body.removeChild(heart);
        }
        this.animationActive.next(false);
        this.activeTimers = this.activeTimers.filter(t => t !== timer4);
        
        if (onComplete) {
          onComplete();
        }
      }, 300);
      this.activeTimers.push(timer4);
      this.activeTimers = this.activeTimers.filter(t => t !== timer3);
    }, 800);
      this.activeTimers.push(timer3);
  }

  /**
   * Clean up all active animations and timers
   * Call this when service is destroyed or needs cleanup
   */
  cleanup(): void {
    this.clearAllTimers();
    this.animationActive.next(false);
  }
}

