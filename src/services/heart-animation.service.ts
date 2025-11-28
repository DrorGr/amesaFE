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
  
  getAnimationActive(): Observable<boolean> {
    return this.animationActive.asObservable();
  }

  /**
   * Animate a heart icon from one element to another
   */
  animateHeart(config: HeartAnimationConfig): void {
    if (this.animationActive.value) {
      // Animation already in progress, skip
      return;
    }

    this.animationActive.next(true);

    const { fromElement, toElement, onComplete } = config;

    // Get positions
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    // Create heart element
    const heart = document.createElement('div');
    heart.innerHTML = `
      <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
      </svg>
    `;
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

    // Trigger animation
    requestAnimationFrame(() => {
      const targetX = toRect.left + toRect.width / 2;
      const targetY = toRect.top + toRect.height / 2;
      
      heart.style.left = `${targetX}px`;
      heart.style.top = `${targetY}px`;
      heart.style.transform = 'translate(-50%, -50%) scale(1.5)';
    });

    // Add glow effect to target element's text AFTER heart reaches it (800ms delay)
    const glowClass = 'favorites-tab-glow';
    
    // Wait for heart to reach target before applying glow
    setTimeout(() => {
      toElement.classList.add(glowClass);
      
      // Remove glow after animation completes (2s animation duration)
      setTimeout(() => {
        toElement.classList.remove(glowClass);
      }, 2000); // Remove glow after animation completes
    }, 800); // Apply glow when heart reaches target

    // Clean up heart after animation
    setTimeout(() => {
      heart.style.opacity = '0';
      heart.style.transform = 'translate(-50%, -50%) scale(0.5)';
      
      setTimeout(() => {
        document.body.removeChild(heart);
        this.animationActive.next(false);
        
        if (onComplete) {
          onComplete();
        }
      }, 300);
    }, 800);
  }
}

