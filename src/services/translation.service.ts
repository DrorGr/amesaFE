import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'pl';

export interface Translations {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<Language>('en');
  
  private translations: Record<Language, Translations> = {
    en: {
      // Navigation
      'nav.lotteries': 'Lotteries',
      'nav.howItWorks': 'How It Works',
      'nav.winners': 'Winners',
      'nav.signIn': 'Sign In',
      'nav.getStarted': 'Get Started',
      'nav.welcome': 'Welcome',
      'nav.logout': 'Logout',
      
      // Hero Section
      'hero.title': 'Win Your Dream Home',
      'hero.subtitle': 'Enter exclusive house lotteries and get the chance to win amazing properties at a fraction of their market value.',
      'hero.browseLotteries': 'Browse Lotteries',
      'hero.howItWorks': 'How It Works',
      'hero.happyWinners': 'Happy Winners',
      'hero.propertiesWon': 'Properties Won',
      'hero.satisfaction': 'Satisfaction',
      
      // Stats Section
      'stats.happyWinners': 'Happy Winners',
      'stats.propertiesWon': 'Properties Won',
      'stats.activeLotteries': 'Active Lotteries',
      'stats.satisfactionRate': 'Satisfaction Rate',
      
      // House Grid
      'houses.title': 'Active House Lotteries',
      'houses.subtitle': 'Choose from our selection of amazing properties and enter to win your dream home today.',
      'houses.noLotteries': 'No Active Lotteries',
      'houses.checkBack': 'Check back soon for new lottery opportunities!',
      
      // House Card
      'house.ticketsSold': 'Tickets Sold',
      'house.lotteryEnds': 'Lottery ends in',
      'house.buyTicket': 'Buy Ticket',
      'house.processing': 'Processing...',
      'house.signInToParticipate': 'Sign in to participate',
      'house.perTicket': 'per ticket',
      'house.bed': 'bed',
      'house.bath': 'bath',
      'house.sqft': 'sqft',
      'house.ended': 'Ended',
      'house.active': 'Active',
      'house.upcoming': 'Coming Soon',
      
      // Auth Modal
      'auth.signIn': 'Sign In',
      'auth.createAccount': 'Create Account',
      'auth.fullName': 'Full Name',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.processing': 'Processing...',
      'auth.dontHaveAccount': "Don't have an account?",
      'auth.alreadyHaveAccount': 'Already have an account?',
      'auth.signUp': 'Sign up',
      
      // Footer
      'footer.description': 'Your trusted platform for house lotteries. Win your dream home today.',
      'footer.quickLinks': 'Quick Links',
      'footer.support': 'Support',
      'footer.helpCenter': 'Help Center',
      'footer.liveChat': 'Live Chat',
      'footer.privacyPolicy': 'Privacy Policy',
      'footer.termsConditions': 'Terms & Conditions',
      'footer.contactUs': 'Contact Us',
      'footer.winnersGallery': 'Winners Gallery',
      'footer.copyright': '© 2025 HomeLotto. All rights reserved.'
    },
    pl: {
      // Navigation
      'nav.lotteries': 'Loterie',
      'nav.howItWorks': 'Jak to działa',
      'nav.winners': 'Zwycięzcy',
      'nav.signIn': 'Zaloguj się',
      'nav.getStarted': 'Rozpocznij',
      'nav.welcome': 'Witaj',
      'nav.logout': 'Wyloguj',
      
      // Hero Section
      'hero.title': 'Wygraj Dom Swoich Marzeń',
      'hero.subtitle': 'Weź udział w ekskluzywnych loteriach domów i miej szansę wygrać niesamowite nieruchomości za ułamek ich wartości rynkowej.',
      'hero.browseLotteries': 'Przeglądaj Loterie',
      'hero.howItWorks': 'Jak to działa',
      'hero.happyWinners': 'Szczęśliwi Zwycięzcy',
      'hero.propertiesWon': 'Wygrane Nieruchomości',
      'hero.satisfaction': 'Zadowolenie',
      
      // Stats Section
      'stats.happyWinners': 'Szczęśliwi Zwycięzcy',
      'stats.propertiesWon': 'Wygrane Nieruchomości',
      'stats.activeLotteries': 'Aktywne Loterie',
      'stats.satisfactionRate': 'Wskaźnik Zadowolenia',
      
      // House Grid
      'houses.title': 'Aktywne Loterie Domów',
      'houses.subtitle': 'Wybierz spośród naszej selekcji niesamowitych nieruchomości i weź udział w loterii o dom swoich marzeń już dziś.',
      'houses.noLotteries': 'Brak Aktywnych Loterii',
      'houses.checkBack': 'Sprawdź ponownie wkrótce, aby zobaczyć nowe możliwości loterii!',
      
      // House Card
      'house.ticketsSold': 'Sprzedane Bilety',
      'house.lotteryEnds': 'Loteria kończy się za',
      'house.buyTicket': 'Kup Bilet',
      'house.processing': 'Przetwarzanie...',
      'house.signInToParticipate': 'Zaloguj się, aby wziąć udział',
      'house.perTicket': 'za bilet',
      'house.bed': 'sypialnia',
      'house.bath': 'łazienka',
      'house.sqft': 'm²',
      'house.ended': 'Zakończona',
      'house.active': 'Aktywna',
      'house.upcoming': 'Wkrótce',
      
      // Auth Modal
      'auth.signIn': 'Zaloguj się',
      'auth.createAccount': 'Utwórz Konto',
      'auth.fullName': 'Imię i Nazwisko',
      'auth.email': 'Email',
      'auth.password': 'Hasło',
      'auth.processing': 'Przetwarzanie...',
      'auth.dontHaveAccount': 'Nie masz konta?',
      'auth.alreadyHaveAccount': 'Masz już konto?',
      'auth.signUp': 'Zarejestruj się',
      
      // Footer
      'footer.description': 'Twoja zaufana platforma loterii domów. Wygraj dom swoich marzeń już dziś.',
      'footer.quickLinks': 'Szybkie Linki',
      'footer.support': 'Wsparcie',
      'footer.helpCenter': 'Centrum Pomocy',
      'footer.liveChat': 'Czat na Żywo',
      'footer.privacyPolicy': 'Polityka Prywatności',
      'footer.termsConditions': 'Regulamin',
      'footer.contactUs': 'Skontaktuj się z nami',
      'footer.winnersGallery': 'Galeria Zwycięzców',
      'footer.copyright': '© 2025 HomeLotto. Wszelkie prawa zastrzeżone.'
    }
  };

  getCurrentLanguage() {
    return this.currentLanguage.asReadonly();
  }

  setLanguage(language: Language) {
    this.currentLanguage.set(language);
  }

  translate(key: string): string {
    const currentLang = this.currentLanguage();
    return this.translations[currentLang][key] || key;
  }

  getAvailableLanguages(): { code: Language; name: string; flag: string }[] {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'pl', name: 'Polski', flag: '🇵🇱' }
    ];
  }
}