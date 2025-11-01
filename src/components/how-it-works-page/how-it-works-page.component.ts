import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-64 md:h-80">
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="How It Works" 
              class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 via-blue-400 via-blue-300 via-blue-200 via-blue-100 to-transparent opacity-75"></div>
          </div>
          
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('howItWorks.heroTitle') }}
              </h1>
              <p class="text-2xl md:text-xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('howItWorks.heroSubtitle') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <!-- Introduction -->
        <section class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('howItWorks.simpleStepsProcess') }}
            </h2>
            <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {{ translate('howItWorks.introduction') }}
            </p>
          </div>
        </section>

        <!-- Steps -->
        <section class="mb-16">
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="text-white text-2xl font-bold">1</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('howItWorks.step1Title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('howItWorks.step1Desc') }}
              </p>
            </div>

            <div class="text-center">
              <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="text-white text-2xl font-bold">2</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('howItWorks.step2Title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('howItWorks.step2Desc') }}
              </p>
            </div>

            <div class="text-center">
              <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="text-white text-2xl font-bold">3</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {{ translate('howItWorks.step3Title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ translate('howItWorks.step3Desc') }}
              </p>
            </div>
          </div>
        </section>

        <!-- AM-65, AM-66: Detailed Explanation -->
        <section class="mb-20">
          <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 md:p-12">
            <div class="text-center mb-8">
              <h2 class="text-4xl md:text-5xl font-black text-blue-600 dark:text-blue-400 mb-6">
                Wow!
              </h2>
            </div>

            <div class="space-y-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                Our innovative idea and top end developments enable us to let you enjoy the entire lottery experience. Once you realize that your odds to fulfil your biggest dreams are the best in the market, and stand on just <strong class="text-blue-600 dark:text-blue-400">1 to 15K</strong> for the biggest and first prize!
              </p>

              <p class="text-2xl font-bold text-center text-blue-600 dark:text-blue-400 py-4">
                Take a moment to read it again, just 1 to 15K to win your dream home.
              </p>

              <p>
                All you need to do is to buy a ticket to the lottery. Ignoring our launching prices, that are real low, and regardless of the published Promotions and coupons, for just <strong>1 ticket</strong> you get <strong>1 to 15K odds</strong> to win the 1st prize. For <strong>3 tickets</strong> you get a <strong>1 to 5K</strong> to actually be the owner of your own property in a prime location!
              </p>

              <p>
                First, we are publishing assets at 1st price. Our assets are going under a full property check and are ready to change ownership as soon as the papers are ready after our attorney office fixes all the papers with your own details. You do not need to do anything but corporate with the legal procedure. <strong>No extra money is needed once you win the lottery.</strong>
              </p>

              <p>
                Each lottery will hold its own winner and details. The lottery should take place on its due date if the minimum requirements have reached. If the lottery reaches its maximum capacity, the lottery will take place <strong>96 hours after reaching the bar</strong>. If the lottery didn't reach its minimum requirements, the lottery is cancelled, a new lottery will be re-scheduled and <strong>you are fully refunded!</strong>
              </p>

              <!-- Prizes Section -->
              <div class="mt-8 bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  Lottery Prizes:
                </h3>
                
                <div class="space-y-4">
                  <!-- 1st Prize -->
                  <div class="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg">
                    <div class="flex-shrink-0">
                      <div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span class="text-white text-xl font-bold">🏆</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-lg font-bold text-gray-900 dark:text-white">1st Prize</div>
                      <div class="text-gray-700 dark:text-gray-300">A prime locationed property</div>
                    </div>
                  </div>

                  <!-- 2nd Prize -->
                  <div class="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg">
                    <div class="flex-shrink-0">
                      <div class="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                        <span class="text-white text-xl font-bold">🥈</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-lg font-bold text-gray-900 dark:text-white">2nd Prize</div>
                      <div class="text-gray-700 dark:text-gray-300">Nintendo Switch / iPad / etc</div>
                    </div>
                  </div>

                  <!-- 3rd Prize -->
                  <div class="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg">
                    <div class="flex-shrink-0">
                      <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <span class="text-white text-xl font-bold">🥉</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-lg font-bold text-gray-900 dark:text-white">3rd Prize</div>
                      <div class="text-gray-700 dark:text-gray-300">Apple AirPods Pro / etc</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Call to Action -->
        <section class="text-center">
          <div class="cta-section-shrink rounded-2xl text-white">
            <h2 class="font-bold">
              {{ translate('howItWorks.readyToStart') }}
            </h2>
            <p class="max-w-3xl mx-auto">
              {{ translate('howItWorks.ctaDescription') }}
            </p>
            <button
              (click)="navigateToHome()"
              class="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border-2 border-white">
              {{ translate('howItWorks.browseLotteries') }}
            </button>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
    
    /* AM-71: Shrink CTA section + gold background */
    .cta-section-shrink {
      padding: 2rem 1.5rem !important;
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
      box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
    }
    
    .cta-section-shrink h2 {
      font-size: 2rem !important;
      line-height: 1.3 !important;
      margin-bottom: 1rem !important;
    }
    
    .cta-section-shrink p {
      font-size: 1.125rem !important;
      line-height: 1.5 !important;
      margin-bottom: 1.5rem !important;
    }
    
    @media (min-width: 768px) {
      .cta-section-shrink {
        padding: 3rem 2rem !important;
      }
      
      .cta-section-shrink h2 {
        font-size: 2.5rem !important;
      }
      
      .cta-section-shrink p {
        font-size: 1.25rem !important;
      }
    }
  `]
})
export class HowItWorksPageComponent {
  private translationService = inject(TranslationService);
  private router = inject(Router);

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToHome() {
    this.router.navigate(['/']);
    this.scrollToTop();
  }

  private scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
