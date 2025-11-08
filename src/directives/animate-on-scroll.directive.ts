import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

/**
 * Animate On Scroll Directive
 * Usage: <div animateOnScroll="fade-in">Content</div>
 */
@Directive({
  selector: '[animateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit, OnDestroy {
  @Input() animateOnScroll: string = 'fade-in';
  @Input() animationDelay: number = 0;
  @Input() animationThreshold: number = 0.1;
  @Input() once: boolean = true; // Only animate once

  private observer: IntersectionObserver | null = null;
  private hasAnimated = false;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    // Initially hide the element
    this.el.nativeElement.style.opacity = '0';
    this.el.nativeElement.classList.add('will-animate');

    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && (!this.once || !this.hasAnimated)) {
            this.animate();
          } else if (!entry.isIntersecting && !this.once && this.hasAnimated) {
            // Reset animation if not "once" mode
            this.reset();
          }
        });
      },
      {
        threshold: this.animationThreshold,
        rootMargin: '50px'
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private animate() {
    setTimeout(() => {
      this.el.nativeElement.classList.add('animated', this.animateOnScroll);
      this.el.nativeElement.style.opacity = '1';
      this.hasAnimated = true;
    }, this.animationDelay);
  }

  private reset() {
    this.el.nativeElement.classList.remove('animated', this.animateOnScroll);
    this.el.nativeElement.style.opacity = '0';
    this.hasAnimated = false;
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

