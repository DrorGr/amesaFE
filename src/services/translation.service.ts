import { Injectable, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, of, catchError, map, tap } from 'rxjs';
import { ApiService } from './api.service';

export type Language = 'en' | 'he' | 'ar' | 'es' | 'fr' | 'pl';

export interface Translations {
  [key: string]: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName?: string;
  flagUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

export interface TranslationsResponse {
  languageCode: string;
  translations: Translations;
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<Language>('en');
  private translationsCache = signal<Map<Language, Translations>>(new Map());
  private lastUpdated = new Map<Language, Date>();
  private isLoading = new BehaviorSubject<boolean>(false);
  private error = new BehaviorSubject<string | null>(null);
  
  // Fallback translations for when backend is unavailable
  private fallbackTranslations: Record<Language, Translations> = {
    en: {
      'nav.lotteries': 'Lotteries',
      'nav.promotions': 'Promotions',
      'nav.howItWorks': 'How It Works',
      'nav.winners': 'Winners',
      
      // How It Works Page
      'howItWorks.heroTitle': 'How Amesa Lottery Works',
      'howItWorks.heroSubtitle': 'Your path to winning a dream home is simple and transparent.',
      'howItWorks.simpleProcess': 'Simple Process',
      'howItWorks.introduction': 'Participating in our house lotteries is straightforward and secure. Follow these simple steps to get started on your journey to homeownership.',
      'howItWorks.step1Title': 'Choose Your Lottery',
      'howItWorks.step1Desc': 'Browse our exclusive selection of luxury homes. Each property is a separate lottery with a limited number of tickets.',
      'howItWorks.step2Title': 'Buy Tickets',
      'howItWorks.step2Desc': 'Purchase tickets for your chosen lottery. The more tickets you buy, the higher your chances of winning. All transactions are secure and transparent.',
      'howItWorks.step3Title': 'Win & Own',
      'howItWorks.step3Desc': 'If you win, you become the proud owner of your dream property with all legal fees covered.',
      'howItWorks.readyToStart': 'Ready to Get Started?',
      'howItWorks.ctaDescription': 'Join thousands of participants who are already on their way to winning their dream homes.',
      'howItWorks.browseLotteries': 'Browse Available Lotteries',
      
      // Footer
      'footer.description': 'Your trusted partner in making homeownership dreams come true through transparent and fair lottery systems.',
      'footer.supportCause': 'Supporting a Good Cause',
      'footer.supportDescription': 'Every ticket you purchase contributes to charitable causes and community development projects. Together, we\'re building a better future.',
      'footer.community': 'Community',
      'footer.about': 'About Us',
      'footer.makeSponsorship': 'Make Sponsorship',
      'footer.partners': 'Partners',
      'footer.responsibleGaming': 'Responsible Gaming',
      'footer.support': 'Support',
      'footer.helpCenter': 'Help Center',
      'footer.liveChat': 'Live Chat',
      'footer.contactUs': 'Contact Us',
      'footer.faq': 'FAQ',
      'footer.drawCalendar': 'Draw Calendar',
      'footer.branchMap': 'Branch Map',
      'footer.legal': 'Legal',
      'footer.regulations': 'Regulations',
      'footer.termsConditions': 'Terms & Conditions',
      'footer.privacyPolicy': 'Privacy Policy',
      'footer.gdprInfo': 'GDPR Info',
      'footer.news': 'News',
      'footer.legalPartners': 'Legal Partners',
      'footer.comingSoon': 'Coming Soon..',
      'footer.copyright': '© 2024 Amesa Group. All rights reserved. Licensed and regulated lottery operator.',
      
      // Partners Section
      'partners.legalPartner': 'Legal Office',
      'partners.accountingPartner': 'Accounting Partner',
      
      // Stats Section
      'stats.oddsToWin': 'Odds to Win',
      'stats.currentPrizes': 'Current Prizes',
      'stats.activeLotteries': 'Active Lotteries',
      'stats.satisfaction': 'Satisfaction Rate',
      'stats.happyWinners': 'Happy Winners',
      'stats.totalPrizes': 'Total Prizes Won',
      'stats.firstPrizeWinners': '1st Prize Winners',
      'stats.secondPrizeWinners': '2nd Prize Winners',
      'stats.thirdPrizeWinners': '3rd Prize Winners',
      
      // Carousel Section
      'carousel.propertyValue': 'Property Value',
      'carousel.ticketPrice': 'Ticket Price',
      'carousel.ticketsSold': 'Tickets Sold',
      'carousel.drawDate': 'Draw Date',
      'carousel.progress': 'Progress',
      'carousel.buyTicket': 'Buy Ticket',
      
      'nav.about': 'About',
      'nav.sponsorship': 'Sponsorship',
      'nav.faq': 'FAQ',
      'nav.help': 'Help',
      'nav.partners': 'Partners',
      'nav.responsibleGambling': 'Responsible Gambling',
      'nav.register': 'Register',
      'nav.memberSettings': 'My Account',
      'nav.signIn': 'Sign In',
      'nav.getStarted': 'Get Started',
      'nav.welcome': 'Welcome',
      'nav.logout': 'Logout',
      'hero.title': 'Win Your Dream Home',
      'hero.subtitle': 'Enter exclusive house lotteries and get the chance to win amazing properties at a fraction of their market value.',
      'auth.signIn': 'Sign In',
      'auth.createAccount': 'Create Account',
      'auth.fullName': 'Full Name',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.forgotPassword': 'Forgot Password?',
      'houses.title': 'Active Lotteries',
      'houses.bedrooms': 'Bedrooms',
      'houses.bathrooms': 'Bathrooms',
      'houses.sqft': 'Sq Ft',
      'houses.ticketPrice': 'Ticket Price',
      'houses.totalTickets': 'Total Tickets',
      'houses.soldTickets': 'Sold Tickets',
      'houses.remainingTickets': 'Remaining Tickets',
      'houses.lotteryEnds': 'Lottery Ends',
      'houses.purchaseTicket': 'Purchase Ticket',
      'houses.viewDetails': 'View Details',
      
      // House Card (individual house display)
      'house.bed': 'bed',
      'house.bath': 'bath',
      'house.sqft': 'sq ft',
      'house.ticketsSold': 'tickets sold',
      'house.lotteryEnds': 'Lottery ends',
      'house.processing': 'Processing...',
      'house.buyTicket': 'Buy Ticket',
      'house.signInToParticipate': 'Buy Ticket',
      'house.perTicket': 'per ticket',
      'house.active': 'Active',
      'house.ended': 'Ended',
      'house.upcoming': 'Upcoming',
      'house.odds': 'Odds',
      'house.onlyTicketsAvailable': 'Only {count} tickets available',
      'house.lotteryDate': 'Lottery Date',
      'house.city': 'City',
      'house.address': 'Address',
      'house.currentlyViewing': 'Currently Viewing',
      'house.lotteryCountdown': 'Time Remaining',
      'house.propertyOfYourOwn': 'Property of your own with a price of obiad',
      
      // Chatbot
      'chatbot.title': 'Amesa Assistant',
      'chatbot.subtitle': 'Online now',
      'chatbot.welcomeMessage': 'Hi! How can I help you with your lottery questions?',
      'chatbot.placeholder': 'Type your message...',
      'chatbot.response.help': 'I\'m here to help! You can ask me about lotteries, tickets, prizes, or how our platform works.',
      'chatbot.response.lottery': 'Our lotteries offer amazing prizes including luxury properties! Each lottery has different odds and ticket prices.',
      'chatbot.response.tickets': 'You can purchase tickets directly from any active lottery. Just click \'Buy Ticket\' on the lottery you\'re interested in!',
      'chatbot.response.winners': 'We\'ve had hundreds of happy winners! Check out our statistics section to see our latest prize winners.',
      'chatbot.response.contact': 'For more detailed assistance, you can contact our support team through the Help Center or FAQ section.',
      'chatbot.hideWidget': 'Hide chatbot',
      'chatbot.close': 'Close chat',
      
      // Accessibility
      'accessibility.title': 'Accessibility Settings',
      'accessibility.subtitle': 'Customize your experience',
      'accessibility.close': 'Close accessibility settings',
      'accessibility.toggleWidget': 'Toggle accessibility settings',
      'accessibility.quickActions': 'Quick Actions',
      'accessibility.reset': 'Reset',
      'accessibility.save': 'Save',
      'accessibility.fontSize': 'Font Size',
      'accessibility.contrast': 'Contrast',
      'accessibility.contrastNormal': 'Normal',
      'accessibility.contrastHigh': 'High Contrast',
      'accessibility.contrastInverted': 'Inverted Colors',
      'accessibility.colorBlind': 'Color Blind Support',
      'accessibility.colorBlindNone': 'None',
      'accessibility.colorBlindProtanopia': 'Protanopia (Red-Green)',
      'accessibility.colorBlindDeuteranopia': 'Deuteranopia (Red-Green)',
      'accessibility.colorBlindTritanopia': 'Tritanopia (Blue-Yellow)',
      'accessibility.cursorSize': 'Cursor Size',
      'accessibility.cursorNormal': 'Normal',
      'accessibility.cursorLarge': 'Large',
      'accessibility.cursorExtraLarge': 'Extra Large',
      'accessibility.toggleSettings': 'Toggle Settings',
      'accessibility.reduceMotion': 'Reduce Motion',
      'accessibility.focusIndicator': 'Enhanced Focus',
      'accessibility.textSpacing': 'Text Spacing',
      'accessibility.linkHighlight': 'Link Highlight',
      'accessibility.readingGuide': 'Reading Guide',
      'accessibility.hideWidget': 'Hide accessibility widget'
    },
    pl: {
      'nav.lotteries': 'Loterie',
      'nav.promotions': 'Promocje',
      'nav.howItWorks': 'Jak to działa',
      'nav.winners': 'Zwycięzcy',
      
      // How It Works Page
      'howItWorks.heroTitle': 'Jak działa Loteria Amesa',
      'howItWorks.heroSubtitle': 'Twoja droga do wygrania wymarzonego domu jest prosta i przejrzysta.',
      'howItWorks.simpleProcess': 'Prosty Proces',
      'howItWorks.introduction': 'Udział w naszych loteriach domów jest prosty i bezpieczny. Wykonaj te proste kroki, aby rozpocząć swoją podróż do posiadania domu.',
      'howItWorks.step1Title': 'Wybierz swoją loterię',
      'howItWorks.step1Desc': 'Przeglądaj naszą ekskluzywną ofertę luksusowych domów. Każda nieruchomość to osobna loteria z ograniczoną liczbą biletów.',
      'howItWorks.step2Title': 'Kup bilety',
      'howItWorks.step2Desc': 'Kup bilety na wybraną loterię. Im więcej biletów kupisz, tym większe masz szanse na wygraną. Wszystkie transakcje są bezpieczne i przejrzyste.',
      'howItWorks.step3Title': 'Wygraj i Posiadaj',
      'howItWorks.step3Desc': 'Jeśli wygrasz, stajesz się dumnym właścicielem wymarzonej nieruchomości ze wszystkimi opłatami prawnymi pokrytymi.',
      'howItWorks.readyToStart': 'Gotowy, aby zacząć?',
      'howItWorks.ctaDescription': 'Dołącz do tysięcy uczestników, którzy już są na drodze do wygrania swoich wymarzonych domów.',
      'howItWorks.browseLotteries': 'Przeglądaj dostępne loterie',
      
      // Footer
      'footer.description': 'Twój zaufany partner w realizacji marzeń o własnym domu poprzez przejrzyste i uczciwe systemy loterii.',
      'footer.supportCause': 'Wspieranie Dobrej Sprawy',
      'footer.supportDescription': 'Każdy zakupiony bilet przyczynia się do celów charytatywnych i projektów rozwoju społeczności. Razem budujemy lepszą przyszłość.',
      'footer.community': 'Społeczność',
      'footer.about': 'O nas',
      'footer.makeSponsorship': 'Zostań Sponsorem',
      'footer.partners': 'Partnerzy',
      'footer.responsibleGaming': 'Odpowiedzialna Gra',
      'footer.support': 'Wsparcie',
      'footer.helpCenter': 'Centrum Pomocy',
      'footer.liveChat': 'Czat na Żywo',
      'footer.contactUs': 'Skontaktuj się z nami',
      'footer.faq': 'FAQ',
      'footer.drawCalendar': 'Kalendarz Losowań',
      'footer.branchMap': 'Mapa Oddziałów',
      'footer.legal': 'Prawne',
      'footer.regulations': 'Regulaminy',
      'footer.termsConditions': 'Warunki i Zasady',
      'footer.privacyPolicy': 'Polityka Prywatności',
      'footer.gdprInfo': 'Informacje RODO',
      'footer.news': 'Aktualności',
      'footer.legalPartners': 'Partnerzy Prawni',
      'footer.comingSoon': 'Wkrótce..',
      'footer.copyright': '© 2024 Grupa Amesa. Wszelkie prawa zastrzeżone. Licencjonowany i regulowany operator loterii.',
      
      // Partners Section
      'partners.legalPartner': 'Biuro Prawne',
      'partners.accountingPartner': 'Partner Księgowy',
      
      // Stats Section
      'stats.oddsToWin': 'Szanse na Wygraną',
      'stats.currentPrizes': 'Aktualne Nagrody',
      'stats.activeLotteries': 'Aktywne Loterie',
      'stats.satisfaction': 'Wskaźnik Zadowolenia',
      'stats.happyWinners': 'Szczęśliwi Zwycięzcy',
      'stats.totalPrizes': 'Łączne Wygrane Nagrody',
      'stats.firstPrizeWinners': 'Zwycięzcy 1. Nagrody',
      'stats.secondPrizeWinners': 'Zwycięzcy 2. Nagrody',
      'stats.thirdPrizeWinners': 'Zwycięzcy 3. Nagrody',
      
      // Carousel Section
      'carousel.propertyValue': 'Wartość Nieruchomości',
      'carousel.ticketPrice': 'Cena Biletu',
      'carousel.ticketsSold': 'Sprzedane Bilety',
      'carousel.drawDate': 'Data Losowania',
      'carousel.progress': 'Postęp',
      'carousel.buyTicket': 'Kup Bilet',
      
      'nav.about': 'O nas',
      'nav.sponsorship': 'Sponsoring',
      'nav.faq': 'FAQ',
      'nav.help': 'Pomoc',
      'nav.partners': 'Partnerzy',
      'nav.responsibleGambling': 'Odpowiedzialna Gra',
      'nav.register': 'Zarejestruj się',
      'nav.memberSettings': 'Moje Konto',
      'nav.signIn': 'Zaloguj się',
      'nav.getStarted': 'Rozpocznij',
      'nav.welcome': 'Witaj',
      'nav.logout': 'Wyloguj',
      'hero.title': 'Wygraj Dom Swoich Marzeń',
      'hero.subtitle': 'Weź udział w ekskluzywnych loteriach domów i miej szansę wygrać niesamowite nieruchomości za ułamek ich wartości rynkowej.',
      'auth.signIn': 'Zaloguj się',
      'auth.createAccount': 'Utwórz Konto',
      'auth.fullName': 'Imię i Nazwisko',
      'auth.email': 'Email',
      'auth.password': 'Hasło',
      'auth.confirmPassword': 'Potwierdź Hasło',
      'auth.forgotPassword': 'Zapomniałeś hasła?',
      'houses.title': 'Aktywne Loterie',
      'houses.bedrooms': 'Sypialnie',
      'houses.bathrooms': 'Łazienki',
      'houses.sqft': 'M²',
      'houses.ticketPrice': 'Cena Biletu',
      'houses.totalTickets': 'Łączne Bilety',
      'houses.soldTickets': 'Sprzedane Bilety',
      'houses.remainingTickets': 'Pozostałe Bilety',
      'houses.lotteryEnds': 'Loterie Kończy Się',
      'houses.purchaseTicket': 'Kup Bilet',
      'houses.viewDetails': 'Zobacz Szczegóły',
      
      // House Card (individual house display)
      'house.bed': 'sypialnia',
      'house.bath': 'łazienka',
      'house.sqft': 'm²',
      'house.ticketsSold': 'biletów sprzedanych',
      'house.lotteryEnds': 'Loteria kończy się',
      'house.processing': 'Przetwarzanie...',
      'house.buyTicket': 'Kup Bilet',
      'house.signInToParticipate': 'Kup Bilet',
      'house.perTicket': 'za bilet',
      'house.active': 'Aktywny',
      'house.ended': 'Zakończony',
      'house.upcoming': 'Nadchodzący',
      'house.odds': 'Szanse',
      'house.onlyTicketsAvailable': 'Tylko {count} biletów dostępnych',
      'house.lotteryDate': 'Data Loterii',
      'house.city': 'Miasto',
      'house.address': 'Adres',
      'house.currentlyViewing': 'Obecnie Oglądają',
      'house.lotteryCountdown': 'Pozostały Czas',
      'house.propertyOfYourOwn': 'Nieruchomość na własność w cenie obiadu',
      
      // Chatbot (Polish)
      'chatbot.title': 'Asystent Amesa',
      'chatbot.subtitle': 'Online teraz',
      'chatbot.welcomeMessage': 'Cześć! Jak mogę pomóc z pytaniami o loterie?',
      'chatbot.placeholder': 'Napisz swoją wiadomość...',
      'chatbot.response.help': 'Jestem tutaj, aby pomóc! Możesz zapytać mnie o loterie, bilety, nagrody lub jak działa nasza platforma.',
      'chatbot.response.lottery': 'Nasze loterie oferują niesamowite nagrody, w tym luksusowe nieruchomości! Każda loteria ma różne szanse i ceny biletów.',
      'chatbot.response.tickets': 'Możesz kupić bilety bezpośrednio z dowolnej aktywnej loterii. Po prostu kliknij \'Kup Bilet\' przy loterii, która Cię interesuje!',
      'chatbot.response.winners': 'Mieliśmy setki szczęśliwych zwycięzców! Sprawdź naszą sekcję statystyk, aby zobaczyć najnowszych zwycięzców nagród.',
      'chatbot.response.contact': 'Aby uzyskać bardziej szczegółową pomoc, możesz skontaktować się z naszym zespołem wsparcia przez Centrum Pomocy lub sekcję FAQ.',
      'chatbot.hideWidget': 'Ukryj chatbota',
      'chatbot.close': 'Zamknij czat',
      
      // Accessibility (Polish)
      'accessibility.title': 'Ustawienia Dostępności',
      'accessibility.subtitle': 'Dostosuj swoje doświadczenie',
      'accessibility.close': 'Zamknij ustawienia dostępności',
      'accessibility.toggleWidget': 'Przełącz ustawienia dostępności',
      'accessibility.quickActions': 'Szybkie Akcje',
      'accessibility.reset': 'Resetuj',
      'accessibility.save': 'Zapisz',
      'accessibility.fontSize': 'Rozmiar Czcionki',
      'accessibility.contrast': 'Kontrast',
      'accessibility.contrastNormal': 'Normalny',
      'accessibility.contrastHigh': 'Wysoki Kontrast',
      'accessibility.contrastInverted': 'Odwrócone Kolory',
      'accessibility.colorBlind': 'Wsparcie Daltonizmu',
      'accessibility.colorBlindNone': 'Brak',
      'accessibility.colorBlindProtanopia': 'Protanopia (Czerwono-Zielona)',
      'accessibility.colorBlindDeuteranopia': 'Deuteranopia (Czerwono-Zielona)',
      'accessibility.colorBlindTritanopia': 'Tritanopia (Niebiesko-Żółta)',
      'accessibility.cursorSize': 'Rozmiar Kursora',
      'accessibility.cursorNormal': 'Normalny',
      'accessibility.cursorLarge': 'Duży',
      'accessibility.cursorExtraLarge': 'Bardzo Duży',
      'accessibility.toggleSettings': 'Ustawienia Przełączników',
      'accessibility.reduceMotion': 'Ogranicz Animacje',
      'accessibility.focusIndicator': 'Wzmocniony Fokus',
      'accessibility.textSpacing': 'Odstępy w Tekście',
      'accessibility.linkHighlight': 'Podświetlenie Linków',
      'accessibility.readingGuide': 'Przewodnik Czytania',
      'accessibility.hideWidget': 'Ukryj widget dostępności'
    },
    he: {
      'nav.lotteries': 'הגרלות',
      'nav.promotions': 'מבצעים',
      'nav.howItWorks': 'איך זה עובד',
      'nav.winners': 'זוכים',
      'accessibility.hideWidget': 'הסתר ווידג\'ט נגישות'
    },
    ar: {
      'nav.lotteries': 'اليانصيب',
      'nav.promotions': 'العروض',
      'nav.howItWorks': 'كيف يعمل',
      'nav.winners': 'الفائزون',
      'accessibility.hideWidget': 'إخفاء أداة إمكانية الوصول'
    },
    es: {
      'nav.lotteries': 'Loterías',
      'nav.promotions': 'Promociones',
      'nav.howItWorks': 'Cómo Funciona',
      'nav.winners': 'Ganadores',
      'accessibility.hideWidget': 'Ocultar widget de accesibilidad'
    },
    fr: {
      'nav.lotteries': 'Loteries',
      'nav.promotions': 'Promotions',
      'nav.howItWorks': 'Comment ça marche',
      'nav.winners': 'Gagnants',
      'accessibility.hideWidget': 'Masquer le widget d\'accessibilité'
    }
  };

  constructor(private apiService: ApiService) {
    console.log('[Translation Service] Constructor called');
    console.log('[Translation Service] Initial language:', this.currentLanguage());
    console.log('[Translation Service] API Service baseUrl:', this.apiService.getBaseUrl());
    // Load initial translations
    console.log('[Translation Service] Loading initial translations...');
    this.loadTranslations(this.currentLanguage());
  }

  // Public observables
  getCurrentLanguage = this.currentLanguage.asReadonly();
  isLoading$ = this.isLoading.asObservable();
  error$ = this.error.asObservable();

  // Computed signal for current translations
  currentTranslations = computed(() => {
    const lang = this.currentLanguage();
    return this.translationsCache().get(lang) || this.fallbackTranslations[lang];
  });

  // Available languages with their info
  availableLanguages: LanguageInfo[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flagUrl: 'https://flagcdn.com/w40/us.png',
      isActive: true,
      isDefault: true,
      displayOrder: 1
    },
    {
      code: 'he',
      name: 'Hebrew',
      nativeName: 'עברית',
      flagUrl: 'https://flagcdn.com/w40/il.png',
      isActive: true,
      isDefault: false,
      displayOrder: 2
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flagUrl: 'https://flagcdn.com/w40/sa.png',
      isActive: true,
      isDefault: false,
      displayOrder: 3
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flagUrl: 'https://flagcdn.com/w40/es.png',
      isActive: true,
      isDefault: false,
      displayOrder: 4
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flagUrl: 'https://flagcdn.com/w40/fr.png',
      isActive: true,
      isDefault: false,
      displayOrder: 5
    },
    {
      code: 'pl',
      name: 'Polish',
      nativeName: 'Polski',
      flagUrl: 'https://flagcdn.com/w40/pl.png',
      isActive: true,
      isDefault: false,
      displayOrder: 6
    }
  ];

  /**
   * Get translation for a key in the current language
   */
  translate(key: string): string {
    const translations = this.currentTranslations();
    return translations[key] || key; // Return the key if translation not found
  }

  /**
   * Set the current language and load translations if not cached
   */
  setLanguage(language: Language): void {
    if (this.currentLanguage() === language) {
      return; // Already set to this language
    }

    this.currentLanguage.set(language);
    
    // Load translations if not in cache or cache is stale
    if (!this.translationsCache().has(language) || this.isCacheStale(language)) {
      this.loadTranslations(language);
    }
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): LanguageInfo[] {
    return this.availableLanguages.filter(lang => lang.isActive);
  }

  /**
   * Load translations from backend API
   */
  private loadTranslations(language: Language): void {
    if (this.isLoading.value) {
      console.log(`[Translation Service] Already loading translations for ${language}, skipping...`);
      return; // Already loading
    }

    console.log(`[Translation Service] Loading translations for language: ${language}`);
    this.isLoading.next(true);
    this.error.next(null);

    const url = `translations/${language}`;
    console.log(`[Translation Service] Making API request to: ${url}`);
    
    this.apiService.get<TranslationsResponse>(url)
      .pipe(
        tap(response => {
          console.log(`[Translation Service] API Response received:`, response);
        }),
        map(response => {
          if (response.success && response.data) {
            console.log(`[Translation Service] Translations data:`, response.data);
            console.log(`[Translation Service] Translation count:`, Object.keys(response.data.translations || {}).length);
            return response.data;
          }
          console.error(`[Translation Service] Invalid response format:`, response);
          throw new Error('Invalid response format');
        }),
        tap(data => {
          console.log(`[Translation Service] Caching translations for ${language}`);
          const newCache = new Map(this.translationsCache());
          newCache.set(language, data.translations);
          this.translationsCache.set(newCache);
          this.lastUpdated.set(language, new Date(data.lastUpdated));
          this.isLoading.next(false);
          console.log(`[Translation Service] Translations loaded successfully for ${language}`);
        }),
        catchError(error => {
          console.error(`[Translation Service] Failed to load translations for ${language}:`, error);
          console.error(`[Translation Service] Error details:`, {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url
          });
          this.error.next(`Failed to load translations for ${language}`);
          this.isLoading.next(false);
          
          // Use fallback translations
          console.warn(`[Translation Service] Using fallback translations for ${language}`);
          const newCache = new Map(this.translationsCache());
          newCache.set(language, this.fallbackTranslations[language]);
          this.translationsCache.set(newCache);
          this.lastUpdated.set(language, new Date());
          
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Check if cache is stale (older than 1 hour)
   */
  private isCacheStale(language: Language): boolean {
    const lastUpdate = this.lastUpdated.get(language);
    if (!lastUpdate) {
      return true;
    }
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastUpdate < oneHourAgo;
  }

  /**
   * Refresh translations for current language
   */
  refreshTranslations(): void {
    const currentLang = this.currentLanguage();
    const newCache = new Map(this.translationsCache());
    newCache.delete(currentLang);
    this.translationsCache.set(newCache);
    this.lastUpdated.delete(currentLang);
    this.loadTranslations(currentLang);
  }

  /**
   * Get all translations for a specific language (useful for debugging)
   */
  getTranslations(language: Language): Observable<Translations> {
    if (this.translationsCache().has(language) && !this.isCacheStale(language)) {
      return of(this.translationsCache().get(language)!);
    }

    return this.apiService.get<TranslationsResponse>(`translations/${language}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data.translations;
          }
          throw new Error('Invalid response format');
        }),
        tap(translations => {
          const newCache = new Map(this.translationsCache());
          newCache.set(language, translations);
          this.translationsCache.set(newCache);
          this.lastUpdated.set(language, new Date());
        }),
        catchError(error => {
          console.warn(`Failed to load translations for ${language}:`, error);
          return of(this.fallbackTranslations[language]);
        })
      );
  }

  /**
   * Get available languages from backend (future enhancement)
   */
  getAvailableLanguagesFromBackend(): Observable<LanguageInfo[]> {
    return this.apiService.get<LanguageInfo[]>(`translations/languages`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        }),
        tap(languages => {
          // Update available languages from backend
          this.availableLanguages = languages.filter(lang => lang.isActive);
        }),
        catchError(error => {
          console.warn('Failed to load languages from backend:', error);
          return of(this.availableLanguages);
        })
      );
  }
}
