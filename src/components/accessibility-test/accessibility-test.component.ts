import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accessibility-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto p-8 space-y-8">
      
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🧪 Accessibility Features Test Page
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300">
          Use the accessibility widget in the top-right corner to test all features on this page.
        </p>
      </div>
      
      <!-- Font Size Test -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">📝 Font Size Test</h2>
        <p class="text-base text-gray-700 dark:text-gray-300 mb-4">
          This paragraph will change size when you adjust the font size slider. 
          Try different sizes from 12px to 24px to see how it affects readability.
        </p>
        <div class="space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">Small text example</p>
          <p class="text-base text-gray-700 dark:text-gray-300">Regular text example</p>
          <p class="text-lg text-gray-800 dark:text-gray-200">Large text example</p>
        </div>
      </div>
      
      <!-- Contrast Test -->
      <div class="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl p-6">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">🎨 Contrast Test</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          Test different contrast modes: Normal, High Contrast, and Inverted Colors.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-red-200 dark:bg-red-800 p-4 rounded-lg">
            <h3 class="font-semibold text-red-800 dark:text-red-200">Red Section</h3>
            <p class="text-red-700 dark:text-red-300">Red color test</p>
          </div>
          <div class="bg-green-200 dark:bg-green-800 p-4 rounded-lg">
            <h3 class="font-semibold text-green-800 dark:text-green-200">Green Section</h3>
            <p class="text-green-700 dark:text-green-300">Green color test</p>
          </div>
          <div class="bg-blue-200 dark:bg-blue-800 p-4 rounded-lg">
            <h3 class="font-semibold text-blue-800 dark:text-blue-200">Blue Section</h3>
            <p class="text-blue-700 dark:text-blue-300">Blue color test</p>
          </div>
        </div>
      </div>
      
      <!-- Color Blind Test -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">🌈 Color Blind Support Test</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          These colors should look different with various color blind filters applied.
        </p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-red-500 text-white p-4 rounded-lg text-center font-semibold">Red</div>
          <div class="bg-green-500 text-white p-4 rounded-lg text-center font-semibold">Green</div>
          <div class="bg-blue-500 text-white p-4 rounded-lg text-center font-semibold">Blue</div>
          <div class="bg-yellow-500 text-black p-4 rounded-lg text-center font-semibold">Yellow</div>
        </div>
      </div>
      
      <!-- Interactive Elements Test -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">🖱️ Interactive Elements Test</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          Test cursor sizes, focus indicators, and link highlighting on these elements.
        </p>
        <div class="space-y-4">
          <div class="flex flex-wrap gap-4">
            <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Test Button 1
            </button>
            <button class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500">
              Test Button 2
            </button>
            <button class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
              Test Button 3
            </button>
          </div>
          
          <div class="space-y-2">
            <p class="text-gray-700 dark:text-gray-300">
              Test links: 
              <a href="#" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">Sample Link 1</a>, 
              <a href="#" class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline">Sample Link 2</a>, 
              <a href="#" class="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline">Sample Link 3</a>
            </p>
          </div>
          
          <div class="space-y-2">
            <input type="text" placeholder="Test input field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <textarea placeholder="Test textarea" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
          </div>
        </div>
      </div>
      
      <!-- Text Spacing Test -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">📖 Text Spacing Test</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          This paragraph will show increased line height, letter spacing, and word spacing when text spacing is enabled.
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Smaller text also benefits from improved spacing for better readability and reduced eye strain.
        </p>
      </div>
      
      <!-- Motion Test -->
      <div class="bg-gradient-to-r from-pink-100 to-yellow-100 dark:from-pink-900 dark:to-yellow-900 rounded-xl p-6">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">🎭 Motion Test</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          These elements have animations that will be reduced when "Reduce Motion" is enabled.
        </p>
        <div class="flex flex-wrap gap-4">
          <div class="w-16 h-16 bg-blue-500 rounded-full animate-bounce"></div>
          <div class="w-16 h-16 bg-green-500 rounded-full animate-pulse"></div>
          <div class="w-16 h-16 bg-purple-500 rounded-full animate-spin"></div>
        </div>
      </div>
      
      <!-- Reading Guide Test -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">📏 Reading Guide Test</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          When the reading guide is enabled, move your mouse over this text to see a horizontal line that follows your cursor.
          This helps with reading long paragraphs and keeping track of your position.
        </p>
        <div class="space-y-4 text-gray-700 dark:text-gray-300">
          <p>Line 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <p>Line 2: Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <p>Line 3: Ut enim ad minim veniam, quis nostrud exercitation ullamco.</p>
          <p>Line 4: Duis aute irure dolor in reprehenderit in voluptate velit esse.</p>
          <p>Line 5: Excepteur sint occaecat cupidatat non proident, sunt in culpa.</p>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    /* Test animations for motion reduction */
    .animate-bounce {
      animation: bounce 1s infinite;
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes bounce {
      0%, 100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
      }
      50% {
        transform: none;
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }
    
    @keyframes pulse {
      50% {
        opacity: .5;
      }
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class AccessibilityTestComponent {
}
