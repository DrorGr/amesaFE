import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@core/services/translation.service';
import { inject } from '@angular/core';
import { MobileDetectionService } from '@core/services/mobile-detection.service';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative py-16 md:py-24 overflow-hidden" aria-labelledby="stats-section-title">
      <!-- Vibrant Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-800 dark:to-blue-900" aria-hidden="true"></div>
      
      <!-- Dynamic Pattern Overlay -->
      <div class="absolute inset-0 opacity-40 dark:opacity-20" aria-hidden="true">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);"></div>
      </div>
      
      <!-- Centered Header -->
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-16">
        <div class="text-center">
          <h2 id="stats-section-title" class="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Live Statistics
          </h2>
          <p class="text-gray-700 dark:text-gray-300 text-base md:text-lg font-medium">
            Real-time lottery performance metrics
          </p>
          <div class="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full" aria-hidden="true"></div>
        </div>
      </div>
      
      <!-- Full Width Carousel Container -->
      <div class="relative w-full overflow-hidden">
          <!-- Perfect Left Fade Mask -->
          <div class="absolute left-0 top-0 bottom-0 w-24 md:w-40 lg:w-48 z-20 pointer-events-none bg-gradient-to-r from-blue-50 via-blue-50/95 via-indigo-50/90 via-indigo-50/70 via-purple-50/50 via-purple-50/30 via-purple-50/10 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:via-slate-800/90 dark:via-slate-800/70 dark:via-blue-900/50 dark:via-blue-900/30 dark:via-blue-900/10 dark:to-transparent"></div>
          
          <!-- Perfect Right Fade Mask -->
          <div class="absolute right-0 top-0 bottom-0 w-24 md:w-40 lg:w-48 z-20 pointer-events-none bg-gradient-to-l from-blue-50 via-blue-50/95 via-indigo-50/90 via-indigo-50/70 via-purple-50/50 via-purple-50/30 via-purple-50/10 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:via-slate-800/90 dark:via-slate-800/70 dark:via-blue-900/50 dark:via-blue-900/30 dark:via-blue-900/10 dark:to-transparent"></div>
          
          <!-- Seamless Infinite Scrolling Stats -->
          <div class="flex animate-infinite-scroll space-x-12 md:space-x-16 lg:space-x-20 py-8 px-4">
            <!-- First Set -->
            @for (stat of stats; track stat.labelKey + '-1') {
              <div class="flex-shrink-0 min-w-[180px] md:min-w-[220px] lg:min-w-[280px]">
                <div class="group text-center">
                  <!-- Vibrant Stat Card -->
                  <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-700 ease-out border border-blue-100/50 dark:border-gray-700/50 group-hover:border-blue-300/70 dark:group-hover:border-blue-600/70 group-hover:bg-white dark:group-hover:bg-gray-800"
                       role="article"
                       [attr.aria-label]="getStatLabel(stat.labelKey) + ': ' + stat.value">
                    
                    <!-- Large Number -->
                    <div class="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-500 ease-out"
                         [attr.aria-label]="'Value: ' + stat.value">
                      {{ stat.value }}
                    </div>
                    
                    <!-- Icon -->
                    <div class="text-2xl md:text-3xl mb-4 opacity-70 group-hover:opacity-100 transition-all duration-600 ease-out group-hover:scale-105 transform"
                         [attr.aria-label]="'Icon for ' + getStatLabel(stat.labelKey)"
                         aria-hidden="true">
                      {{ getStatIcon(stat.labelKey) }}
                    </div>
                    
                    <!-- Label -->
                    <div class="text-slate-600 dark:text-gray-300 font-semibold text-sm md:text-base leading-tight group-hover:text-slate-800 dark:group-hover:text-gray-100 transition-colors duration-500 ease-out">
                      {{ getStatLabel(stat.labelKey) }}
                    </div>
                    
                  </div>
                </div>
              </div>
            }
            <!-- Seamless Duplicate Set -->
            @for (stat of stats; track stat.labelKey + '-2') {
              <div class="flex-shrink-0 min-w-[180px] md:min-w-[220px] lg:min-w-[280px]">
                <div class="group text-center">
                  <!-- Vibrant Stat Card -->
                  <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-700 ease-out border border-blue-100/50 dark:border-gray-700/50 group-hover:border-blue-300/70 dark:group-hover:border-blue-600/70 group-hover:bg-white dark:group-hover:bg-gray-800"
                       role="article"
                       [attr.aria-label]="getStatLabel(stat.labelKey) + ': ' + stat.value"
                       aria-hidden="true">
                    
                    <!-- Large Number -->
                    <div class="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-500 ease-out">
                      {{ stat.value }}
                    </div>
                    
                    <!-- Icon -->
                    <div class="text-2xl md:text-3xl mb-4 opacity-70 group-hover:opacity-100 transition-all duration-600 ease-out group-hover:scale-105 transform"
                         aria-hidden="true">
                      {{ getStatIcon(stat.labelKey) }}
                    </div>
                    
                    <!-- Label -->
                    <div class="text-slate-600 dark:text-gray-300 font-semibold text-sm md:text-base leading-tight group-hover:text-slate-800 dark:group-hover:text-gray-100 transition-colors duration-500 ease-out">
                      {{ getStatLabel(stat.labelKey) }}
                    </div>
                    
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
        
    </section>
  `,
  styles: [`
    /* Seamless infinite scroll animation */
    @keyframes seamless-scroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(calc(-100% / 2));
      }
    }
    
    @-webkit-keyframes seamless-scroll {
      0% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
      }
      100% {
        -webkit-transform: translateX(calc(-100% / 2));
        transform: translateX(calc(-100% / 2));
      }
    }
    
    .animate-infinite-scroll {
      -webkit-animation: seamless-scroll 30s linear infinite;
      animation: seamless-scroll 30s linear infinite;
      -webkit-animation-fill-mode: both;
      animation-fill-mode: both;
      -webkit-animation-iteration-count: infinite;
      animation-iteration-count: infinite;
      will-change: transform;
    }
    
    .animate-infinite-scroll:hover {
      -webkit-animation-play-state: paused;
      animation-play-state: paused;
    }
    
    /* Gentler card hover effects */
    .group:hover .bg-white\\/90 {
      background-color: rgba(255, 255, 255, 0.95);
      transform: translateY(-2px) scale(1.01);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.06);
    }
    
    .dark .group:hover .dark\\:bg-gray-800\\/90 {
      background-color: rgba(31, 41, 55, 0.92);
      transform: translateY(-2px) scale(1.01);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.3), 0 4px 8px -2px rgba(0, 0, 0, 0.2);
    }
    
    /* Responsive Design */
    @media (max-width: 640px) {
      .animate-infinite-scroll {
        -webkit-animation: seamless-scroll 20s linear infinite;
        animation: seamless-scroll 20s linear infinite;
      }
      
      /* Perfect mobile fade overlays */
      .w-24 {
        width: 4rem !important;
      }
      
      /* Adjusted spacing on mobile */
      .space-x-12 > * + * {
        margin-left: 2rem !important;
      }
    }
    
    @media (min-width: 641px) and (max-width: 1023px) {
      .animate-infinite-scroll {
        -webkit-animation: seamless-scroll 25s linear infinite;
        animation: seamless-scroll 25s linear infinite;
      }
      
      /* Perfect tablet fade overlays */
      .md\\:w-40 {
        width: 8rem !important;
      }
    }
    
    @media (min-width: 1024px) {
      .animate-infinite-scroll {
        -webkit-animation: seamless-scroll 30s linear infinite;
        animation: seamless-scroll 30s linear infinite;
      }
      
      /* Perfect desktop fade overlays */
      .lg\\:w-48 {
        width: 10rem !important;
      }
    }
    
    /* Gentler transitions */
    * {
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    /* Ensure seamless blending */
    .bg-gradient-to-r,
    .bg-gradient-to-l {
      background-attachment: local;
    }
    
    /* Grid pattern styling */
    svg pattern path {
      opacity: 0.5;
      transition: opacity 0.8s ease-out;
    }
    
    .dark svg pattern path {
      opacity: 0.3;
      transition: opacity 0.8s ease-out;
    }
    
  `]
})
export class StatsSectionComponent {
  private translationService = inject(TranslationService);
  private mobileDetectionService = inject(MobileDetectionService);
  
  // Use global mobile detection
  isMobile = this.mobileDetectionService.isMobile;

  stats = [
    { value: '1:2,500', labelKey: 'stats.oddsToWin' },
    { value: '€2.5M', labelKey: 'stats.currentPrizes' },
    { value: '12', labelKey: 'stats.activeLotteries' },
    { value: '98%', labelKey: 'stats.satisfaction' },
    { value: '500+', labelKey: 'stats.happyWinners' },
    { value: '€50M+', labelKey: 'stats.totalPrizes' },
    { value: '47', labelKey: 'stats.firstPrizeWinners' },
    { value: '156', labelKey: 'stats.secondPrizeWinners' },
    { value: '312', labelKey: 'stats.thirdPrizeWinners' }
  ];

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getStatLabel(labelKey: string): string {
    return this.translate(labelKey);
  }

  getStatIcon(labelKey: string): string {
    const iconMap: { [key: string]: string } = {
      'stats.oddsToWin': '🎯',
      'stats.currentPrizes': '💰',
      'stats.activeLotteries': '🏠',
      'stats.satisfaction': '😊',
      'stats.happyWinners': '🎉',
      'stats.totalPrizes': '💎',
      'stats.firstPrizeWinners': '🥇',
      'stats.secondPrizeWinners': '🥈',
      'stats.thirdPrizeWinners': '🥉'
    };
    return iconMap[labelKey] || '📊';
  }
}