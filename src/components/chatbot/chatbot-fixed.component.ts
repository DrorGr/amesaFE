import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Fixed Chatbot Container -->
    @if (!isHidden()) {
      <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        
        <!-- Chat Window -->
        @if (isOpen()) {
          <div class="mb-4 w-80 md:w-96 h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-slide-up">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-4 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-sm">{{ translate('chatbot.title') }}</h3>
                    <p class="text-xs opacity-90">{{ translate('chatbot.subtitle') }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button 
                    (click)="toggleChat()"
                    class="text-white/80 hover:text-white transition-colors duration-200 p-1"
                    [attr.aria-label]="translate('chatbot.close')">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                  <button 
                    (click)="hideWidget()"
                    class="text-white/80 hover:text-red-300 transition-colors duration-200 p-1"
                    [attr.aria-label]="translate('chatbot.hideWidget')">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Messages Area -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              @if (messages().length === 0) {
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                  <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <p class="text-sm">{{ translate('chatbot.welcomeMessage') }}</p>
                </div>
              }
              
              @for (message of messages(); track message.id) {
                <div class="flex" [class.justify-end]="message.isUser">
                  <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl" 
                       [class]="message.isUser ? 
                         'bg-blue-600 text-white rounded-br-md' : 
                         'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-600'">
                    <p class="text-sm">{{ message.text }}</p>
                    <p class="text-xs mt-1 opacity-70">
                      {{ formatTime(message.timestamp) }}
                    </p>
                  </div>
                </div>
              }
              
              @if (isTyping()) {
                <div class="flex">
                  <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl rounded-bl-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600">
                    <div class="flex space-x-1">
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
            
            <!-- Input Area -->
            <div class="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div class="flex space-x-2">
                <input
                  [(ngModel)]="currentMessage"
                  (keyup.enter)="sendMessage()"
                  [placeholder]="translate('chatbot.placeholder')"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  [disabled]="isTyping()">
                <button
                  (click)="sendMessage()"
                  [disabled]="!currentMessage.trim() || isTyping()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        }
        
        <!-- Chat Toggle Button -->
        <div class="relative">
          <button
            (click)="toggleChat()"
            class="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group transform hover:scale-105">
            
            @if (!isOpen()) {
              <svg class="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
              </svg>
            } @else {
              <svg class="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            }
            
            <!-- Notification Badge -->
            @if (!isOpen() && hasUnreadMessages()) {
              <div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {{ unreadCount() }}
              </div>
            }
          </button>
          
          <!-- Small Close Button -->
          @if (showCloseButton()) {
            <button
              (click)="hideWidget()"
              class="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
              [attr.aria-label]="translate('chatbot.hideWidget')">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
    
    /* Custom scrollbar for messages */
    .overflow-y-auto::-webkit-scrollbar {
      width: 4px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.5);
      border-radius: 2px;
    }
    
    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
      background: rgba(75, 85, 99, 0.5);
    }
    
    /* Smooth transitions */
    * {
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class ChatbotComponent {
  private translationService = inject(TranslationService);
  
  // State
  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentMessage = '';
  isTyping = signal(false);
  unreadCount = signal(0);
  isHidden = signal(false);
  
  // Computed
  hasUnreadMessages = computed(() => this.unreadCount() > 0);
  
  // Predefined responses for demo
  private responses = [
    'chatbot.response.help',
    'chatbot.response.lottery',
    'chatbot.response.tickets',
    'chatbot.response.winners',
    'chatbot.response.contact'
  ];
  
  constructor() {
    // Load hidden state on initialization
    this.loadHiddenState();
  }
  
  translate(key: string): string {
    return this.translationService.translate(key);
  }
  
  toggleChat() {
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      this.unreadCount.set(0);
    }
  }
  
  hideWidget() {
    this.isHidden.set(true);
    this.isOpen.set(false);
    // Save hidden state to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('amesa-chatbot-widget-hidden', 'true');
    }
  }
  
  showWidget() {
    this.isHidden.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('amesa-chatbot-widget-hidden');
    }
  }
  
  showCloseButton() {
    return !this.isHidden();
  }
  
  loadHiddenState() {
    if (typeof localStorage !== 'undefined') {
      const hidden = localStorage.getItem('amesa-chatbot-widget-hidden');
      if (hidden === 'true') {
        this.isHidden.set(true);
      }
    }
  }
  
  sendMessage() {
    if (!this.currentMessage.trim() || this.isTyping()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: this.currentMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };
    
    this.messages.update(msgs => [...msgs, userMessage]);
    this.currentMessage = '';
    
    // Simulate bot typing
    this.isTyping.set(true);
    
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: this.translate(this.getRandomResponse()),
        isUser: false,
        timestamp: new Date()
      };
      
      this.messages.update(msgs => [...msgs, botResponse]);
      this.isTyping.set(false);
      
      if (!this.isOpen()) {
        this.unreadCount.update(count => count + 1);
      }
    }, 1000 + Math.random() * 2000);
  }
  
  private getRandomResponse(): string {
    return this.responses[Math.floor(Math.random() * this.responses.length)];
  }
  
  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
