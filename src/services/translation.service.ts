import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, catchError, map, tap } from 'rxjs';
import { environment } from '../environments/environment';

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
      'footer.copyright': 'Licensed by AMESA LTD. All rights reserved',
      
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
      'auth.signUp': 'Sign Up',
      'auth.createAccount': 'Create Account',
      'auth.fullName': 'Full Name',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.dontHaveAccount': 'Don\'t have an account?',
      'auth.alreadyHaveAccount': 'Already have an account?',
      'auth.processing': 'Processing...',
      'auth.or': 'Or continue with',
      'auth.continueWithGoogle': 'Continue with Google',
      'auth.continueWithMeta': 'Continue with Facebook',
      'auth.continueWithApple': 'Continue with Apple',
      'auth.oauthProcessing': 'Completing authentication...',
      'auth.oauthError': 'Authentication failed. Please try again.',
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
      'accessibility.hideWidget': 'Hide accessibility widget',
      
      // Promotions Page
      'promotions.heroTitle': 'Special Offers & Promotions',
      'promotions.heroSubtitle': 'Take advantage of our exclusive promotions and maximize your chances to win',
      'promotions.availablePromotions': 'Available promotions',
      'promotions.introduction': 'Discover exclusive opportunities to enhance your lottery experience',
      'promotions.becomeMember': 'Become a Member',
      'promotions.becomeMemberBrief': 'Join our exclusive membership program',
      'promotions.amesaStars': 'Amesa Stars',
      'promotions.amesaStarsBrief': 'Earn rewards and benefits',
      'promotions.takePart': 'Take Part',
      'promotions.takePartBrief': 'Participate in special events',
      'promotions.learnMore': 'Learn More',
      'promotions.purchased': 'Purchased',
      'promotions.specialPromotion': 'Special promotion',
      
      // Help Center Page
      'help.heroTitle': 'Help Center – We\'re Here for You 24/7',
      'help.heroSubtitle': 'Get instant support and answers to all your questions',
      'help.howCanWeHelp': 'How Can We Help You?',
      'help.howCanWeHelpDesc': 'Choose from the options below or search for what you need',
      'help.quickSupportOptions': 'Quick Support Options',
      'help.faqs': 'Frequently Asked Questions',
      'help.faqsDesc': 'Find instant answers to common questions',
      'help.visitFAQ': 'Visit FAQ',
      'help.emailUs': 'Email Us',
      'help.emailUsDesc': 'Get a response within 24 hours',
      'help.sendEmail': 'Send Email',
      'help.callUs': 'Call Us',
      'help.callUsDesc': 'Talk to our support team directly',
      'help.callNow': 'Call Now',
      'help.topicsWeCover': 'Topics We Cover',
      'help.responsibleGambling': 'Responsible Gambling',
      'help.responsibleGamblingDesc': 'Tools and resources for safe play',
      'help.paymentsWithdrawals': 'Payments & Withdrawals',
      'help.paymentsWithdrawalsDesc': 'Information about transactions and refunds',
      'help.technicalSupport': 'Technical Support',
      'help.technicalSupportDesc': 'Help with app and website issues',
      'help.yourAccount': 'Your Account',
      'help.yourAccountDesc': 'Manage your profile and settings',
      'help.ourCommitment': 'Our Commitment',
      'help.fastResponse': 'Fast Response',
      'help.fastResponseDesc': 'We respond to queries within 24 hours',
      'help.friendlyProfessional': 'Friendly & Professional',
      'help.friendlyProfessionalDesc': 'Our team is here to assist you',
      'help.safePrivate': 'Safe & Private',
      'help.safePrivateDesc': 'Your information is secure with us',
      'help.moneyBackGuarantee': 'Money Back Guarantee',
      'help.moneyBackGuaranteeDesc': 'Full refund if lottery doesn\'t execute',
      'help.cantFindWhatYoureLookingFor': 'Can\'t Find What You\'re Looking For?',
      'help.cantFindDesc': 'We\'re here to help with any additional questions',
      'help.sendUsMessage': 'Send Us a Message',
      'help.visitFAQSection': 'Visit FAQ Section',
      'help.getInTouch': 'Get in Touch',
      'help.getInTouchDesc': 'We\'re available 24/7 to assist you',
      'help.email': 'Email',
      'help.phone': 'Phone',
      
      // About Page
      'about.heroTitle': 'AMESA',
      'about.heroSubtitle': 'Transforming lives through transparent and fair lottery systems',
      'about.ourStory': 'Our Story',
      'about.founded': 'Amesa was founded with a vision to make property ownership accessible to everyone through transparent lottery systems.',
      'about.coreOffering': 'We provide a unique platform where participants can win premium properties at affordable entry prices.',
      'about.fourWinsModel': '4Wins Model',
      'about.fourWinsSubtitle': 'Everyone benefits from our innovative approach',
      'about.breakOdds': 'Breaking the odds of traditional property ownership, we offer realistic chances to win premium homes.',
      'about.minimumPrice': 'Entry at minimum price points makes participation accessible to everyone.',
      'about.foundedFrom': 'Built on principles of fairness, transparency, and social responsibility.',
      'about.socialImpact': 'Social Impact',
      'about.socialImpactSubtitle': 'Making a difference in communities',
      'about.profitsUsage': 'All our profits are re-invested in our community',
      'about.ourValues': 'Our Values',
      'about.trust': 'Trust',
      'about.trustDescription': 'Built on transparency and regulated practices',
      'about.accessibility': 'Accessibility',
      'about.accessibilityDescription': 'Making property ownership possible for everyone',
      'about.innovation': 'Innovation',
      'about.innovationDescription': 'Using technology to create fair opportunities',
      'about.joinUs': 'Join Us Today',
      'about.joinUsDescription': 'Be part of a community that believes in fair opportunities',
      'about.browseLotteries': 'Browse Available Lotteries',
      'about.learnMore': 'Learn More',
      
      // How It Works - Additional Keys
      'howItWorks.simpleStepsProcess': 'Simple 3 steps process',
      
      // Member Settings Page
      'member.heroTitle': 'Account Settings',
      'member.heroSubtitle': 'Manage your profile and preferences',
      'member.accountType': 'Account Type',
      'member.basic': 'Basic',
      'member.gold': 'Gold',
      'member.premium': 'Premium',
      'member.memberSince': 'Member since',
      'member.lastLogin': 'Last Login',
      'member.generalInfo': 'General Information',
      'member.firstName': 'First Name',
      'member.lastName': 'Last Name',
      'member.gender': 'Gender',
      'member.male': 'Male',
      'member.female': 'Female',
      'member.other': 'Other',
      'member.dateOfBirth': 'Date of Birth',
      'member.idNumber': 'ID Number',
      'member.readOnlyInfo': 'Read-Only Information',
      'member.email': 'Email',
      'member.phoneNumbers': 'Phone Numbers',
      'member.changePassword': 'Change Password',
      'member.cancel': 'Cancel',
      'member.saveChanges': 'Save Changes',
      'member.editProfile': 'Edit Profile',
      'member.verifyAccount': 'Verify Your Account',
      'member.verifyAccountDesc': 'Complete identity verification to unlock premium features',
      'member.startVerification': 'Start Verification',
      'member.promotions': 'Promotions',
      'member.active': 'Active',
      'member.personalLink': 'Personal Link',
      'member.copy': 'Copy',
      'member.visitPromotionsArea': 'Visit Promotions Area',
      'member.settings': 'Settings',
      'member.basicSettings': 'Basic Settings',
      'member.pushMessages': 'Push Messages',
      'member.pushMessagesDesc': 'Receive notifications about lottery updates',
      'member.darkMode': 'Dark Mode',
      'member.darkModeDesc': 'Switch between light and dark theme',
      'member.language': 'Language',
      'member.languageDesc': 'Choose your preferred language',
      'member.premiumSettings': 'Premium Settings',
      'member.aiDescription': 'AI Description',
      'member.aiDescriptionDesc': 'Get AI-powered property descriptions',
      'member.beTheFirst': 'Be the First',
      'member.beTheFirstDesc': 'Get early access to new lotteries',
      'member.stars': 'Stars',
      'member.totalStars': 'Total Stars',
      'member.activeStars': 'Active Stars',
      'member.starsHistory': 'Stars History',
      'member.expired': 'Expired',
      
      // Sponsor Page
      'sponsor.heroTitle': 'Become a Sponsor',
      'sponsor.heroSubtitle': 'Partner with us to create lasting change in communities',
      'sponsor.becomeSponsor': 'Become a Sponsor',
      'sponsor.whyWeExist': 'Why We Exist',
      'sponsor.whyWeExistSubtitle': 'Our commitment to making a difference',
      'sponsor.homelessShelters': 'Homeless Shelters',
      'sponsor.homelessSheltersDesc': 'Provide dignity and a chance to rebuild lives',
      'sponsor.orphanShelters': 'Orphan Shelters',
      'sponsor.orphanSheltersDesc': 'Give children hope and a brighter future',
      'sponsor.animalShelters': 'Animal Shelters',
      'sponsor.animalSheltersDesc': 'Care for animals in need',
      'sponsor.ourMainGoal': 'Our Main Goal',
      'sponsor.missionStatement': 'To create sustainable support systems for those in need through transparent partnerships and community engagement',
      'sponsor.propertyCircle': 'Property Ownership Circle',
      'sponsor.propertyCircleDesc1': 'Our unique model connects property opportunities with social impact.',
      'sponsor.propertyCircleDesc2': 'Every lottery contributes to our mission of supporting shelters and communities.',
      'sponsor.propertyCircleHighlight': 'Together, we create a circle of opportunity and support',
      'sponsor.realImpact': 'Real Impact',
      'sponsor.realImpactDesc': 'See the direct results of your sponsorship',
      'sponsor.transparency': 'Transparency',
      'sponsor.transparencyDesc': 'Full visibility into how funds are used',
      'sponsor.sharedPurpose': 'Shared Purpose',
      'sponsor.sharedPurposeDesc': 'Join a community of like-minded sponsors',
      'sponsor.lastingLegacy': 'Lasting Legacy',
      'sponsor.lastingLegacyDesc': 'Build something that endures',
      'sponsor.howSponsorshipHelps': 'How Your Sponsorship Helps',
      'sponsor.forHomeless': 'For the Homeless',
      'sponsor.homelessBenefit1': 'Emergency shelter and accommodation',
      'sponsor.homelessBenefit2': 'Job training and support programs',
      'sponsor.homelessBenefit3': 'Path to permanent housing',
      'sponsor.forOrphans': 'For Orphans',
      'sponsor.orphansBenefit1': 'Safe and nurturing environment',
      'sponsor.orphansBenefit2': 'Education and development programs',
      'sponsor.orphansBenefit3': 'Healthcare and nutrition',
      'sponsor.orphansBenefit4': 'Emotional support and counseling',
      'sponsor.forAnimals': 'For Animals',
      'sponsor.animalsBenefit1': 'Medical care and treatment',
      'sponsor.animalsBenefit2': 'Safe shelter and food',
      'sponsor.animalsBenefit3': 'Adoption programs',
      'sponsor.animalsBenefit4': 'Rescue operations',
      'sponsor.impactStatement': 'Every contribution makes a measurable difference in lives and communities',
      'sponsor.joinUsToday': 'Join Us Today',
      'sponsor.joinUsDescription': 'Become part of a movement that transforms lives',
      'sponsor.togetherWeCan': 'Together, we can create lasting change and build a better tomorrow',
      'sponsor.becomeSponsorNow': 'Become a Sponsor Now',
      
      // FAQ Page
      'faq.heroTitle': 'Frequently Asked Questions',
      'faq.heroSubtitle': 'Find quick answers to your questions',
      'faq.searchPlaceholder': 'Search for answers...',
      'faq.noResults': 'No results found',
      'faq.allCategories': 'All Categories',
      'faq.generalQuestions': 'General Questions',
      'faq.paymentsWithdrawals': 'Payments & Withdrawals',
      'faq.accountTechnical': 'Account & Technical',
      'faq.responsibleGambling': 'Responsible Gambling',
      'faq.supportContact': 'Support & Contact',
      'faq.stillHaveQuestions': 'Still Have Questions?',
      'faq.contactDescription': 'Our support team is ready to help',
      'faq.contactSupport': 'Contact Support',
      'faq.askAmesaAgent': 'Ask Amesa Agent',
      
      // FAQ Questions & Answers (General)
      'faq.generalQ1': 'What is the Amesa platform?',
      'faq.generalA1': 'Amesa is a lottery platform offering chances to win premium properties. All our profits are re-invested into supporting homeless shelters, orphan shelters, and animal shelters.',
      'faq.generalQ2': 'Does the winner have to pay extra beyond the ticket price?',
      'faq.generalA2': 'No extra payments required. We cover all legal fees, VAT, taxes, and accountancy related to the property transfer.',
      'faq.generalQ3': 'Who can use the platform?',
      'faq.generalA3': 'Anyone over 18 years old who meets the legal requirements in their jurisdiction can participate.',
      'faq.generalQ4': 'Is the platform regulated?',
      'faq.generalA4': 'Yes, we operate under strict regulations with full transparency and fair-play mechanisms.',
      'faq.generalQ5': 'What are the minimum requirements for a lottery to execute?',
      'faq.generalA5': 'A lottery must reach at least 75% of ticket capacity to proceed.',
      'faq.generalQ6': 'What factors determine if a lottery will execute?',
      'faq.generalA6': 'Minimum 75% participation capacity is required. If not met, full refunds are provided.',
      'faq.generalQ7': 'Can I visit the property before winning?',
      'faq.generalA7': 'Yes! You can visit with our legal team. After winning, we handle all contracts, insurance, and offer a buyback guarantee.',
      'faq.generalQ8': 'How am I rewarded for my participation?',
      'faq.generalA8': 'Winners receive the property plus legal/accounting support. Participants also earn scratch cards and delivery rewards.',
      
      // FAQ Questions & Answers (Payments)
      'faq.paymentsQ1': 'What payment methods do you accept?',
      'faq.paymentsA1': 'We accept credit cards, debit cards, PayPal, and various digital payment methods.',
      'faq.paymentsQ2': 'How long do withdrawals take?',
      'faq.paymentsA2': 'Withdrawals are typically processed within 24-48 hours.',
      'faq.paymentsQ3': 'Are payments secure?',
      'faq.paymentsA3': 'Yes, all payments are encrypted with SSL and PCI compliant security.',
      'faq.paymentsQ4': 'Do you have a money-back guarantee?',
      'faq.paymentsA4': 'Yes, if a lottery doesn\'t execute or is canceled, you receive a full refund.',
      
      // FAQ Questions & Answers (Account)
      'faq.accountQ1': 'I forgot my password, what should I do?',
      'faq.accountA1': 'Click "Forgot Password" on the login page and follow the email instructions to reset.',
      'faq.accountQ2': 'How can I change my account details?',
      'faq.accountA2': 'Go to Member Settings to update your personal information and preferences.',
      'faq.accountQ3': 'The app is not loading, how can I fix this?',
      'faq.accountA3': 'Try clearing your cache, updating the app, or checking your internet connection. Contact support if issues persist.',
      
      // FAQ Questions & Answers (Gambling)
      'faq.gamblingQ1': 'Can I set gambling limits?',
      'faq.gamblingA1': 'Yes, you can set deposit, loss, and session limits in your account settings.',
      'faq.gamblingQ2': 'Can I take a break from gambling?',
      'faq.gamblingA2': 'Yes, we offer self-exclusion options for specified periods through your account settings.',
      'faq.gamblingQ3': 'Where can I get support for problem gambling?',
      'faq.gamblingA3': 'We provide access to responsible gambling resources and helplines in the Help Center.',
      
      // FAQ Questions & Answers (Support)
      'faq.supportQ1': 'How can I contact customer support?',
      'faq.supportA1': 'You can reach us via live chat, email at support@amesa.com, or phone during business hours.',
      'faq.supportQ2': 'Is support available 24/7?',
      'faq.supportA2': 'Yes, our support team is available around the clock to assist you.',
      'faq.supportQ3': 'How do I stay updated with news and announcements?',
      'faq.supportA3': 'Follow us on social media or subscribe to our newsletter for the latest updates.'
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
      'accessibility.hideWidget': 'הסתר ווידג\'ט נגישות',
      'auth.signIn': 'התחבר',
      'auth.signUp': 'הירשם',
      'auth.createAccount': 'צור חשבון',
      'auth.fullName': 'שם מלא',
      'auth.email': 'אימייל',
      'auth.password': 'סיסמה',
      'auth.confirmPassword': 'אמת סיסמה',
      'auth.forgotPassword': 'שכחת סיסמה?',
      'auth.dontHaveAccount': 'אין לך חשבון?',
      'auth.alreadyHaveAccount': 'כבר יש לך חשבון?',
      'auth.processing': 'מעבד...',
      'auth.or': 'או המשך עם',
      'auth.continueWithGoogle': 'המשך עם Google',
      'auth.continueWithMeta': 'המשך עם Facebook',
      'auth.continueWithApple': 'המשך עם Apple',
      'auth.oauthProcessing': 'משלים אימות...',
      'auth.oauthError': 'האימות נכשל. אנא נסה שוב.'
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

  constructor(private http: HttpClient) {
    // Load initial translations
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
      return; // Already loading
    }

    this.isLoading.next(true);
    this.error.next(null);

    this.http.get<{success: boolean, data: TranslationsResponse}>(`${environment.apiUrl}/translations/${language}`)
      .pipe(
        map(response => response.data),
        tap(data => {
          const newCache = new Map(this.translationsCache());
          newCache.set(language, data.translations);
          this.translationsCache.set(newCache);
          this.lastUpdated.set(language, new Date(data.lastUpdated));
          this.isLoading.next(false);
        }),
        catchError(error => {
          console.warn(`Failed to load translations for ${language}, using fallback:`, error);
          this.error.next(`Failed to load translations for ${language}`);
          this.isLoading.next(false);
          
          // Use fallback translations
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

    return this.http.get<{success: boolean, data: TranslationsResponse}>(`${environment.apiUrl}/translations/${language}`)
      .pipe(
        map(response => response.data.translations),
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
    return this.http.get<{success: boolean, data: LanguageInfo[]}>(`${environment.apiUrl}/translations/languages`)
      .pipe(
        map(response => response.data),
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
