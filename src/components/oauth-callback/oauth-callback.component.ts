import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="text-center p-8">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <p class="text-xl text-gray-600 dark:text-gray-400 font-medium">
          Completing authentication...
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
          This window will close automatically
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Get token and user data from URL params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const userParam = params['user'];
      const error = params['error'];

      if (error) {
        // Send error to parent window
        this.sendMessageToParent({
          type: 'oauth-error',
          message: error
        });
      } else if (token && userParam) {
        try {
          // Parse user data
          const user = JSON.parse(decodeURIComponent(userParam));
          
          // Send success to parent window
          this.sendMessageToParent({
            type: 'oauth-success',
            success: true,
            token,
            user
          });
        } catch (e) {
          console.error('Failed to parse user data:', e);
          this.sendMessageToParent({
            type: 'oauth-error',
            message: 'Failed to process authentication data'
          });
        }
      } else {
        // No data received
        this.sendMessageToParent({
          type: 'oauth-error',
          message: 'No authentication data received'
        });
      }

      // Close this popup window after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    });
  }

  private sendMessageToParent(data: any) {
    if (window.opener) {
      window.opener.postMessage(data, window.location.origin);
    }
  }
}

