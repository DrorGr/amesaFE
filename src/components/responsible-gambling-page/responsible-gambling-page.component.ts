import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

interface ResponsibleGamblingTip {
  icon: string;
  title: string;
  description: string;
}

interface PromiseItem {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface WhyChooseUsItem {
  icon: string;
  title: string;
  description: string;
}

interface SupportResource {
  icon: string;
  title: string;
  description: string;
  action: string;
  link?: string;
  actionType: 'email' | 'link' | 'contact';
}

@Component({
  selector: 'app-responsible-gambling-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <!-- Hero Section -->
      <section class="relative overflow-hidden">
        <div class="relative h-64 md:h-80">
          <!-- Background Image -->
          <div class="absolute inset-0">
            <img 
              src="https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg" 
              alt="Responsible Gambling" 
              class="w-full h-full object-cover">
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 via-green-400 via-green-300 via-green-200 via-green-100 to-transparent opacity-75"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div class="text-white max-w-4xl">
              <h1 class="text-3xl md:text-5xl font-black mb-4 leading-tight" style="font-family: 'Kalam', cursive; text-shadow: 3px 3px 6px rgba(0,0,0,0.7);">
                {{ translate('responsible.heroTitle') }}
              </h1>
              <p class="text-lg md:text-xl leading-relaxed" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                {{ translate('responsible.heroSubtitle') }}
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
              {{ translate('responsible.ourCommitment') }}
            </h2>
            <div class="w-24 h-1 bg-green-600 mx-auto rounded-full mb-6"></div>
            <p class="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
              {{ translate('responsible.introduction') }}
            </p>
          </div>
        </section>

        <!-- Our Promise Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('responsible.ourPromise') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ translate('responsible.ourPromiseDesc') }}
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (promise of ourPromises(); track promise.title) {
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8">
                <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                       [class]="promise.color">
                    <span class="text-2xl">{{ promise.icon }}</span>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {{ translate(promise.title) }}
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {{ translate(promise.description) }}
                  </p>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Tips for Responsible Gambling -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('responsible.tipsTitle') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ translate('responsible.tipsDesc') }}
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (tip of responsibleGamblingTips(); track tip.title) {
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-white text-xl">{{ tip.icon }}</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                      {{ translate(tip.title) }}
                    </h3>
                    <p class="text-blue-700 dark:text-blue-300 leading-relaxed">
                      {{ translate(tip.description) }}
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Why Choose Us Section -->
        <section class="mb-20">
          <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('responsible.whyChooseUs') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ translate('responsible.whyChooseUsDesc') }}
            </p>
          </div>

          <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 md:p-12 border border-green-200 dark:border-green-800">
            <div class="grid md:grid-cols-3 gap-8">
              @for (item of whyChooseUsItems(); track item.title) {
                <div class="text-center">
                  <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span class="text-white text-2xl">{{ item.icon }}</span>
                  </div>
                  <h3 class="text-xl font-bold text-green-900 dark:text-green-100 mb-4">
                    {{ translate(item.title) }}
                  </h3>
                  <p class="text-green-700 dark:text-green-300 leading-relaxed">
                    {{ translate(item.description) }}
                  </p>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Need Help Section -->
        <section class="mb-16">
          <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {{ translate('responsible.needHelp') }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ translate('responsible.needHelpDesc') }}
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            @for (resource of supportResources(); track resource.title) {
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8">
                <div class="text-center">
                  <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span class="text-white text-2xl">{{ resource.icon }}</span>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {{ translate(resource.title) }}
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {{ translate(resource.description) }}
                  </p>
                  @if (resource.actionType === 'email') {
                    <a 
                      [href]="'mailto:' + resource.link"
                      class="btn-primary">
                      {{ translate(resource.action) }}
                    </a>
                  } @else if (resource.actionType === 'link') {
                    <button
                      (click)="navigateToHelp()"
                      class="btn-primary">
                      {{ translate(resource.action) }}
                    </button>
                  } @else {
                    <button
                      (click)="contactSupport()"
                      class="btn-primary">
                      {{ translate(resource.action) }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Call to Action -->
        <section class="text-center">
          <div class="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 class="text-3xl md:text-4xl font-bold mb-6">
              {{ translate('responsible.callToAction') }}
            </h2>
            <p class="text-xl mb-8 max-w-3xl mx-auto">
              {{ translate('responsible.callToActionDesc') }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                (click)="navigateToHelp()"
                class="btn-outline bg-white text-green-600 hover:bg-gray-100 border-white">
                {{ translate('responsible.getHelp') }}
              </button>
              <button
                (click)="navigateToHome()"
                class="btn-outline bg-transparent text-white border-white hover:bg-white hover:text-green-600">
                {{ translate('responsible.playResponsibly') }}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
  `]
})
export class ResponsibleGamblingPageComponent {
  private translationService = inject(TranslationService);
  private router = inject(Router);

  ourPromises = signal<PromiseItem[]>([
    {
      icon: '🔍',
      title: 'responsible.transparency',
      description: 'responsible.transparencyDesc',
      color: 'bg-blue-600'
    },
    {
      icon: '🛡️',
      title: 'responsible.limitsControls',
      description: 'responsible.limitsControlsDesc',
      color: 'bg-green-600'
    },
    {
      icon: '🏠',
      title: 'responsible.safeEnvironment',
      description: 'responsible.safeEnvironmentDesc',
      color: 'bg-purple-600'
    },
    {
      icon: '🤝',
      title: 'responsible.supportAccess',
      description: 'responsible.supportAccessDesc',
      color: 'bg-orange-600'
    },
    {
      icon: '💰',
      title: 'responsible.moneyBackGuarantee',
      description: 'responsible.moneyBackGuaranteeDesc',
      color: 'bg-emerald-600'
    }
  ]);

  responsibleGamblingTips = signal<ResponsibleGamblingTip[]>([
    {
      icon: '🎲',
      title: 'responsible.tip1Title',
      description: 'responsible.tip1Desc'
    },
    {
      icon: '🕑',
      title: 'responsible.tip2Title',
      description: 'responsible.tip2Desc'
    },
    {
      icon: '⏱️',
      title: 'responsible.tip3Title',
      description: 'responsible.tip3Desc'
    },
    {
      icon: '💳',
      title: 'responsible.tip4Title',
      description: 'responsible.tip4Desc'
    },
    {
      icon: '🤝',
      title: 'responsible.tip5Title',
      description: 'responsible.tip5Desc'
    }
  ]);

  whyChooseUsItems = signal<WhyChooseUsItem[]>([
    {
      icon: '🔒',
      title: 'responsible.secureRegulated',
      description: 'responsible.secureRegulatedDesc'
    },
    {
      icon: '🎛️',
      title: 'responsible.controlTools',
      description: 'responsible.controlToolsDesc'
    },
    {
      icon: '❤️',
      title: 'responsible.communitySupport',
      description: 'responsible.communitySupportDesc'
    }
  ]);

  supportResources = signal<SupportResource[]>([
    {
      icon: '📞',
      title: 'responsible.nationalHelpline',
      description: 'responsible.nationalHelplineDesc',
      action: 'responsible.contactHelpline',
      link: 'support@amesa-group.com',
      actionType: 'email'
    },
    {
      icon: '🌐',
      title: 'responsible.supportWebsite',
      description: 'responsible.supportWebsiteDesc',
      action: 'responsible.visitHelpCenter',
      actionType: 'link'
    },
    {
      icon: '💬',
      title: 'responsible.contactSupport',
      description: 'responsible.contactSupportDesc',
      action: 'responsible.contactSupportTeam',
      actionType: 'contact'
    }
  ]);

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  navigateToHelp() {
    this.router.navigate(['/help']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  contactSupport() {
    // This could open a contact modal or navigate to a contact page
    console.log('Contact support clicked');
  }
}
