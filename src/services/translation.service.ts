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
      'nav.promotions': 'Promotions',
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
      'hero.winnerKeys': 'Winner Keys',
      'hero.dreamHome': 'Dream Home',
      'hero.totalSlots': 'Total Slots',
      'hero.totalPrize': 'Total Prize',
      
      // Stats Section
      'stats.oddsToWin': 'Odds to Win',
      'stats.currentPrizes': 'Current Prizes',
      'stats.activeLotteries': 'Active Lotteries',
      'stats.satisfaction': 'Satisfaction Rate',
      'stats.happyWinners': 'Happy Winners',
      'stats.totalPrizes': 'Total Prizes Won',
      
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
      'footer.downloadApp': 'Download Our App',
      'footer.community': 'Community',
      'footer.about': 'About',
      'footer.makeSponsorship': 'Make a Sponsorship Offer',
      'footer.partners': 'Partners',
      'footer.responsibleGaming': 'Responsible Gaming',
      'footer.support': 'Support',
      'footer.legal': 'Legal',
      'footer.helpCenter': 'Help Center',
      'footer.liveChat': 'Live Chat',
      'footer.faq': 'FAQ',
      'footer.drawCalendar': 'Draw Calendar',
      'footer.branchMap': 'Branch Map',
      'footer.regulations': 'Regulations',
      'footer.privacyPolicy': 'Privacy Policy',
      'footer.termsConditions': 'Terms & Conditions',
      'footer.gdprInfo': 'GDPR Information',
      'footer.news': 'News',
      'footer.contactUs': 'Contact Us',
      'footer.copyright': '© 2025 Amesa. All rights reserved.',
      'footer.supportCause': 'We Support Community',
      'footer.supportDescription': 'Part of our proceeds go to support local housing initiatives and community development.',
      'footer.legalPartners': 'Legal Partners',
      'footer.attorneyOffice': 'Attorney Office',
      'footer.legalSupport': 'Legal support and compliance',
      'footer.accountingPartner': 'Accounting Partner',
      'footer.financialServices': 'Financial services and audit',
      
      // House Data
      'house.1.title': 'Modern Downtown Condo',
      'house.1.description': 'Stunning 2-bedroom condo in the heart of downtown with city views and modern amenities.',
      'house.1.location': 'Downtown, City Center',
      'house.2.title': 'Suburban Family Home',
      'house.2.description': 'Beautiful 4-bedroom family home with large backyard and garage in quiet neighborhood.',
      'house.2.location': 'Maple Heights Suburb',
      'house.3.title': 'Luxury Waterfront Villa',
      'house.3.description': 'Exclusive waterfront villa with private beach access and panoramic ocean views.',
      'house.3.location': 'Oceanfront District'
    },
    pl: {
      // Navigation
      'nav.lotteries': 'Loterie',
      'nav.promotions': 'Promocje',
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
      'hero.winnerKeys': 'Klucze Zwycięzcy',
      'hero.dreamHome': 'Dom Marzeń',
      'hero.totalSlots': 'Łączne Sloty',
      'hero.totalPrize': 'Łączna Nagroda',
      
      // Stats Section
      'stats.oddsToWin': 'Szanse na Wygraną',
      'stats.currentPrizes': 'Aktualne Nagrody',
      'stats.activeLotteries': 'Aktywne Loterie',
      'stats.satisfaction': 'Wskaźnik Zadowolenia',
      'stats.happyWinners': 'Szczęśliwi Zwycięzcy',
      'stats.totalPrizes': 'Łączne Wygrane Nagrody',
      
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
      'footer.community': 'Społeczność',
      'footer.about': 'O nas',
      'footer.partners': 'Partnerzy',
      'footer.sponsorship': 'Sponsoring',
      'footer.responsibleGaming': 'Odpowiedzialna Gra',
      'footer.support': 'Wsparcie',
      'footer.legal': 'Prawne',
      'footer.helpCenter': 'Centrum Pomocy',
      'footer.liveChat': 'Czat na Żywo',
      'footer.faq': 'FAQ',
      'footer.privacyPolicy': 'Polityka Prywatności',
      'footer.termsConditions': 'Regulamin',
      'footer.gdprInfo': 'Informacje RODO',
      'footer.contactUs': 'Skontaktuj się z nami',
      'footer.copyright': '© 2025 Amesa. Wszelkie prawa zastrzeżone.',
      'footer.supportCause': 'Wspieramy Społeczność',
      'footer.supportDescription': 'Część naszych dochodów przeznaczamy na wsparcie lokalnych inicjatyw mieszkaniowych i rozwoju społeczności.',
      'footer.legalPartners': 'Partnerzy Prawni',
      'footer.attorneyOffice': 'Kancelaria Prawna',
      'footer.legalSupport': 'Wsparcie prawne i zgodność',
      'footer.accountingPartner': 'Partner Księgowy',
      'footer.financialServices': 'Usługi finansowe i audyt',
      
      // House Data
      'house.1.title': 'Nowoczesne Mieszkanie w Centrum',
      'house.1.description': 'Oszałamiające 2-pokojowe mieszkanie w sercu centrum z widokiem na miasto i nowoczesnymi udogodnieniami.',
      'house.1.location': 'Centrum Miasta',
      'house.2.title': 'Dom Rodzinny na Przedmieściach',
      'house.2.description': 'Piękny 4-pokojowy dom rodzinny z dużym podwórkiem i garażem w spokojnej okolicy.',
      'house.2.location': 'Przedmieścia Maple Heights',
      'house.3.title': 'Luksusowa Willa nad Wodą',
      'house.3.description': 'Ekskluzywna willa nad wodą z prywatnym dostępem do plaży i panoramicznym widokiem na ocean.',
      'house.3.location': 'Dzielnica Nadmorska'
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
      { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
      { code: 'pl', name: 'Polski', flag: 'https://flagcdn.com/w40/pl.png' }
    ];
  }
}