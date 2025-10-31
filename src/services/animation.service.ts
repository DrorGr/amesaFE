import { Injectable } from '@angular/core';

/**
 * Animation Service
 * Provides reusable animation utilities for the application
 */
@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  
  /**
   * Animate element on scroll into view
   */
  observeElement(element: HTMLElement, animationClass: string, threshold: number = 0.1): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(animationClass);
            // Optionally unobserve after animation
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '50px'
      }
    );

    observer.observe(element);
  }

  /**
   * Animate multiple elements with staggered delay
   */
  staggeredAnimation(
    elements: HTMLElement[],
    animationClass: string,
    delayMs: number = 100
  ): void {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add(animationClass);
      }, index * delayMs);
    });
  }

  /**
   * Smooth scroll to element
   */
  scrollToElement(elementId: string, offset: number = 0): void {
    const element = document.getElementById(elementId);
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  /**
   * Smooth scroll to top
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Parallax scroll effect
   */
  applyParallax(element: HTMLElement, speed: number = 0.5): void {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * speed;
      element.style.transform = `translate3d(0, ${rate}px, 0)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Return cleanup function
    return () => window.removeEventListener('scroll', handleScroll);
  }

  /**
   * Fade in animation
   */
  fadeIn(element: HTMLElement, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms ease-in`;
      
      // Trigger reflow
      element.offsetHeight;
      
      element.style.opacity = '1';
      
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  /**
   * Fade out animation
   */
  fadeOut(element: HTMLElement, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      element.style.opacity = '1';
      element.style.transition = `opacity ${duration}ms ease-out`;
      
      // Trigger reflow
      element.offsetHeight;
      
      element.style.opacity = '0';
      
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  /**
   * Slide in from direction
   */
  slideIn(
    element: HTMLElement,
    direction: 'left' | 'right' | 'top' | 'bottom' = 'left',
    distance: number = 100,
    duration: number = 400
  ): Promise<void> {
    return new Promise((resolve) => {
      const transforms = {
        left: `translateX(-${distance}px)`,
        right: `translateX(${distance}px)`,
        top: `translateY(-${distance}px)`,
        bottom: `translateY(${distance}px)`
      };

      element.style.opacity = '0';
      element.style.transform = transforms[direction];
      element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      
      // Trigger reflow
      element.offsetHeight;
      
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
      
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  /**
   * Scale animation
   */
  scale(
    element: HTMLElement,
    from: number = 0.8,
    to: number = 1,
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      element.style.transform = `scale(${from})`;
      element.style.opacity = '0';
      element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      
      // Trigger reflow
      element.offsetHeight;
      
      element.style.transform = `scale(${to})`;
      element.style.opacity = '1';
      
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  /**
   * Bounce animation
   */
  bounce(element: HTMLElement, intensity: number = 20): void {
    element.style.animation = `bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
    
    // Create keyframes if not exists
    if (!document.getElementById('bounce-keyframes')) {
      const style = document.createElement('style');
      style.id = 'bounce-keyframes';
      style.textContent = `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-${intensity}px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      element.style.animation = '';
    }, 600);
  }

  /**
   * Shake animation (for errors)
   */
  shake(element: HTMLElement): void {
    element.style.animation = 'shake 0.5s';
    
    // Create keyframes if not exists
    if (!document.getElementById('shake-keyframes')) {
      const style = document.createElement('style');
      style.id = 'shake-keyframes';
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      element.style.animation = '';
    }, 500);
  }

  /**
   * Pulse animation (for notifications)
   */
  pulse(element: HTMLElement, duration: number = 1000): void {
    element.style.animation = `pulse ${duration}ms ease-in-out`;
    
    // Create keyframes if not exists
    if (!document.getElementById('pulse-keyframes')) {
      const style = document.createElement('style');
      style.id = 'pulse-keyframes';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      element.style.animation = '';
    }, duration);
  }

  /**
   * Ripple effect (for buttons)
   */
  ripple(event: MouseEvent, element: HTMLElement, color: string = 'rgba(255, 255, 255, 0.6)'): void {
    const ripple = document.createElement('span');
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;

    const rect = element.getBoundingClientRect();
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = color;
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s ease-out';
    ripple.style.pointerEvents = 'none';

    // Create keyframes if not exists
    if (!document.getElementById('ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Card flip animation
   */
  flipCard(element: HTMLElement, duration: number = 600): Promise<void> {
    return new Promise((resolve) => {
      element.style.transition = `transform ${duration}ms`;
      element.style.transformStyle = 'preserve-3d';
      
      // Flip
      element.style.transform = 'rotateY(180deg)';
      
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  /**
   * Loading spinner with customizable size and color
   */
  createLoadingSpinner(size: number = 40, color: string = '#3B82F6'): HTMLElement {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.width = `${size}px`;
    spinner.style.height = `${size}px`;
    spinner.style.border = `${size / 10}px solid #f3f4f6`;
    spinner.style.borderTop = `${size / 10}px solid ${color}`;
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';

    // Create keyframes if not exists
    if (!document.getElementById('spin-keyframes')) {
      const style = document.createElement('style');
      style.id = 'spin-keyframes';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    return spinner;
  }

  /**
   * Progress bar animation
   */
  animateProgress(element: HTMLElement, targetPercent: number, duration: number = 1000): void {
    let currentPercent = 0;
    const increment = targetPercent / (duration / 16); // 60fps
    
    const interval = setInterval(() => {
      currentPercent += increment;
      
      if (currentPercent >= targetPercent) {
        currentPercent = targetPercent;
        clearInterval(interval);
      }
      
      element.style.width = `${currentPercent}%`;
    }, 16);
  }

  /**
   * Count up animation for numbers
   */
  countUp(
    element: HTMLElement,
    start: number,
    end: number,
    duration: number = 2000,
    suffix: string = ''
  ): void {
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;
    
    const interval = setInterval(() => {
      current += increment;
      
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(interval);
      }
      
      element.textContent = Math.floor(current) + suffix;
    }, 16);
  }
}

