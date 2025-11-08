# OAuth Implementation Plan - Google & Facebook Login

**Date**: 2025-10-31  
**Status**: Ready for Implementation  
**Priority**: HIGH

---

## Current State

### ✅ What's Already Done:
1. **UI Components Ready**:
   - Auth modal has Google, Facebook (Meta), and Apple login buttons
   - File: `FE/src/components/auth-modal/auth-modal.component.ts`
   - Lines 33-64: Social login buttons with proper styling
   
2. **Method Calls Exist**:
   - `loginWithGoogle()` (line 353)
   - `loginWithMeta()` (line 368)
   - `loginWithApple()` (line 383)

### ❌ What's Missing:
- Actual OAuth implementation in `auth.service.ts`
- Backend API endpoints for OAuth
- OAuth provider configuration (Google & Facebook App IDs)

---

## Implementation Steps

### Phase 1: Frontend OAuth Service (Angular)

#### 1.1 Update `auth.service.ts`

Add these methods:

```typescript
// OAuth Login Methods
async loginWithGoogle(): Promise<boolean> {
  try {
    // Initialize Google OAuth 2.0
    const googleAuthUrl = `${this.apiUrl}/api/auth/google`;
    
    // Open popup window for OAuth
    const popup = this.openOAuthPopup(googleAuthUrl, 'Google Login');
    
    // Wait for OAuth callback
    const result = await this.waitForOAuthCallback(popup);
    
    if (result.success) {
      this.setSession(result.token, result.user);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return false;
  }
}

async loginWithMeta(): Promise<boolean> {
  try {
    const facebookAuthUrl = `${this.apiUrl}/api/auth/facebook`;
    const popup = this.openOAuthPopup(facebookAuthUrl, 'Facebook Login');
    const result = await this.waitForOAuthCallback(popup);
    
    if (result.success) {
      this.setSession(result.token, result.user);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return false;
  }
}

private openOAuthPopup(url: string, title: string): Window | null {
  const width = 500;
  const height = 600;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  return window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
  );
}

private waitForOAuthCallback(popup: Window | null): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      popup?.close();
      reject(new Error('OAuth timeout'));
    }, 300000); // 5 minute timeout
    
    window.addEventListener('message', (event) => {
      // Verify origin
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data.type === 'oauth-success') {
        clearTimeout(timeout);
        popup?.close();
        resolve(event.data);
      } else if (event.data.type === 'oauth-error') {
        clearTimeout(timeout);
        popup?.close();
        reject(new Error(event.data.message));
      }
    }, { once: true });
  });
}
```

#### 1.2 Create OAuth Callback Component

Create `FE/src/components/oauth-callback/oauth-callback.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Get token and user data from URL params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const user = params['user'] ? JSON.parse(params['user']) : null;
      const error = params['error'];

      if (error) {
        // Send error to parent window
        window.opener?.postMessage({
          type: 'oauth-error',
          message: error
        }, window.location.origin);
      } else if (token && user) {
        // Send success to parent window
        window.opener?.postMessage({
          type: 'oauth-success',
          success: true,
          token,
          user
        }, window.location.origin);
      }

      // Close this popup window
      setTimeout(() => window.close(), 500);
    });
  }
}
```

#### 1.3 Update App Routes

Add OAuth callback route in `app.routes.ts`:

```typescript
{
  path: 'auth/callback',
  component: OAuthCallbackComponent
}
```

---

### Phase 2: Backend API Implementation (.NET)

#### 2.1 Install NuGet Packages

```bash
dotnet add package Microsoft.AspNetCore.Authentication.Google
dotnet add package Microsoft.AspNetCore.Authentication.Facebook
```

#### 2.2 Update `appsettings.json`

```json
{
  "Authentication": {
    "Google": {
      "ClientId": "YOUR_GOOGLE_CLIENT_ID",
      "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
    },
    "Facebook": {
      "AppId": "YOUR_FACEBOOK_APP_ID",
      "AppSecret": "YOUR_FACEBOOK_APP_SECRET"
    }
  }
}
```

#### 2.3 Configure Authentication in `Program.cs`

```csharp
// Add after services.AddControllers();

services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = configuration["Authentication:Google:ClientId"];
        options.ClientSecret = configuration["Authentication:Google:ClientSecret"];
        options.CallbackPath = "/api/auth/google-callback";
        options.SaveTokens = true;
    })
    .AddFacebook(options =>
    {
        options.AppId = configuration["Authentication:Facebook:AppId"];
        options.AppSecret = configuration["Authentication:Facebook:AppSecret"];
        options.CallbackPath = "/api/auth/facebook-callback";
        options.SaveTokens = true;
        options.Fields.Add("email");
        options.Fields.Add("name");
    });
```

#### 2.4 Create OAuth Controller

Create `BE/Controllers/OAuthController.cs`:

```csharp
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth")]
public class OAuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IJwtService _jwtService;

    public OAuthController(IUserService userService, IJwtService jwtService)
    {
        _userService = userService;
        _jwtService = jwtService;
    }

    [HttpGet("google")]
    public IActionResult GoogleLogin()
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(GoogleCallback))
        };
        return Challenge(properties, "Google");
    }

    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        var result = await HttpContext.AuthenticateAsync("Google");
        
        if (!result.Succeeded)
        {
            return Redirect($"{GetFrontendUrl()}/auth/callback?error=Google login failed");
        }

        var claims = result.Principal.Claims;
        var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
        var googleId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        // Find or create user
        var user = await _userService.FindOrCreateOAuthUser(email, name, "google", googleId);
        
        // Generate JWT token
        var token = _jwtService.GenerateToken(user);
        
        var userJson = Uri.EscapeDataString(JsonSerializer.Serialize(new
        {
            user.Id,
            user.Email,
            user.Username
        }));

        return Redirect($"{GetFrontendUrl()}/auth/callback?token={token}&user={userJson}");
    }

    [HttpGet("facebook")]
    public IActionResult FacebookLogin()
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(FacebookCallback))
        };
        return Challenge(properties, "Facebook");
    }

    [HttpGet("facebook-callback")]
    public async Task<IActionResult> FacebookCallback()
    {
        var result = await HttpContext.AuthenticateAsync("Facebook");
        
        if (!result.Succeeded)
        {
            return Redirect($"{GetFrontendUrl()}/auth/callback?error=Facebook login failed");
        }

        var claims = result.Principal.Claims;
        var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
        var facebookId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        var user = await _userService.FindOrCreateOAuthUser(email, name, "facebook", facebookId);
        var token = _jwtService.GenerateToken(user);
        
        var userJson = Uri.EscapeDataString(JsonSerializer.Serialize(new
        {
            user.Id,
            user.Email,
            user.Username
        }));

        return Redirect($"{GetFrontendUrl()}/auth/callback?token={token}&user={userJson}");
    }

    private string GetFrontendUrl()
    {
        return Configuration["FrontendUrl"] ?? "http://localhost:4200";
    }
}
```

#### 2.5 Update User Service

Add method to `IUserService` and `UserService`:

```csharp
public async Task<User> FindOrCreateOAuthUser(string email, string name, string provider, string providerId)
{
    // Check if user exists
    var user = await _context.Users
        .FirstOrDefaultAsync(u => u.Email == email);

    if (user == null)
    {
        // Create new user
        user = new User
        {
            Email = email,
            Username = email.Split('@')[0],
            FirstName = name?.Split(' ').FirstOrDefault() ?? "",
            LastName = name?.Split(' ').Skip(1).FirstOrDefault() ?? "",
            AuthProvider = provider,
            ProviderId = providerId,
            IsEmailVerified = true, // OAuth emails are pre-verified
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }
    else
    {
        // Update OAuth info if not set
        if (string.IsNullOrEmpty(user.ProviderId))
        {
            user.AuthProvider = provider;
            user.ProviderId = providerId;
            user.IsEmailVerified = true;
            await _context.SaveChangesAsync();
        }
    }

    return user;
}
```

---

### Phase 3: OAuth Provider Setup

#### 3.1 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized JavaScript origins:
   - `http://localhost:4200` (dev)
   - `https://d2rmamd755wq7j.cloudfront.net` (dev)
   - `https://d2ejqzjfslo5hs.cloudfront.net` (staging)
   - `https://dpqbvdgnenckf.cloudfront.net` (production)
7. Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google-callback` (dev)
   - `http://amesa-backend-stage-alb-467028641.eu-north-1.elb.amazonaws.com/api/auth/google-callback` (stage)
   - `http://amesa-backend-alb-509078867.eu-north-1.elb.amazonaws.com/api/auth/google-callback` (prod)
8. Copy Client ID and Client Secret

#### 3.2 Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing
3. Add "Facebook Login" product
4. Settings → Basic:
   - App Domains: `localhost`, your CloudFront domains
5. Facebook Login → Settings:
   - Valid OAuth Redirect URIs:
     - `http://localhost:5000/api/auth/facebook-callback`
     - `http://amesa-backend-stage-alb-467028641.eu-north-1.elb.amazonaws.com/api/auth/facebook-callback`
     - `http://amesa-backend-alb-509078867.eu-north-1.elb.amazonaws.com/api/auth/facebook-callback`
6. Copy App ID and App Secret

---

### Phase 4: Environment Configuration

#### 4.1 GitHub Secrets (for CI/CD)

Add these secrets in GitHub repository:

**Development:**
- `GOOGLE_CLIENT_ID_DEV`
- `GOOGLE_CLIENT_SECRET_DEV`
- `FACEBOOK_APP_ID_DEV`
- `FACEBOOK_APP_SECRET_DEV`

**Staging:**
- `GOOGLE_CLIENT_ID_STAGE`
- `GOOGLE_CLIENT_SECRET_STAGE`
- `FACEBOOK_APP_ID_STAGE`
- `FACEBOOK_APP_SECRET_STAGE`

**Production:**
- `GOOGLE_CLIENT_ID_PROD`
- `GOOGLE_CLIENT_SECRET_PROD`
- `FACEBOOK_APP_ID_PROD`
- `FACEBOOK_APP_SECRET_PROD`

#### 4.2 AWS ECS Environment Variables

Update task definitions with:

```json
{
  "environment": [
    {
      "name": "Authentication__Google__ClientId",
      "value": "from-secrets"
    },
    {
      "name": "Authentication__Google__ClientSecret",
      "value": "from-secrets"
    },
    {
      "name": "Authentication__Facebook__AppId",
      "value": "from-secrets"
    },
    {
      "name": "Authentication__Facebook__AppSecret",
      "value": "from-secrets"
    }
  ]
}
```

---

## Testing Plan

### Manual Testing

1. **Google Login**:
   - Click "Continue with Google" button
   - Popup opens with Google login
   - Select account
   - Popup closes, user logged in
   - Check JWT token stored
   - Check user data in database

2. **Facebook Login**:
   - Click "Continue with Meta" button
   - Popup opens with Facebook login
   - Enter credentials
   - Popup closes, user logged in
   - Verify token and data

3. **Edge Cases**:
   - User cancels OAuth popup
   - Network error during OAuth
   - Email already registered with different provider
   - Invalid OAuth credentials

### Automated Testing

```typescript
// auth.service.spec.ts
describe('OAuth Login', () => {
  it('should login with Google successfully', async () => {
    // Test implementation
  });

  it('should login with Facebook successfully', async () => {
    // Test implementation
  });

  it('should handle OAuth popup close', async () => {
    // Test implementation
  });
});
```

---

## Security Considerations

1. **HTTPS Required**: OAuth must use HTTPS in production
2. **CSRF Protection**: Built into OAuth flow
3. **Token Validation**: Verify OAuth tokens on backend
4. **Secure Storage**: Store OAuth secrets in environment variables, not code
5. **Rate Limiting**: Add rate limiting to OAuth endpoints
6. **Email Verification**: OAuth emails are pre-verified

---

## Rollout Plan

### Phase 1: Development (Week 1)
- ✅ Implement frontend OAuth service
- ✅ Create OAuth callback component
- ✅ Set up Google OAuth app (dev)
- ✅ Set up Facebook OAuth app (dev)
- ✅ Test locally

### Phase 2: Backend (Week 1)
- ✅ Install .NET OAuth packages
- ✅ Configure authentication
- ✅ Create OAuth controller
- ✅ Update user service
- ✅ Test end-to-end

### Phase 3: Staging (Week 2)
- Deploy to staging environment
- Configure staging OAuth apps
- Test with staging URLs
- Fix any issues

### Phase 4: Production (Week 2)
- Deploy to production
- Configure production OAuth apps
- Monitor logs
- Gather user feedback

---

## Success Metrics

- ✅ Google login works end-to-end
- ✅ Facebook login works end-to-end
- ✅ OAuth popup opens and closes correctly
- ✅ User data saved correctly
- ✅ JWT token generated and stored
- ✅ No security vulnerabilities
- ✅ Error handling works properly

---

## Next Steps

1. Review this plan
2. Get OAuth app credentials from Google and Facebook
3. Implement frontend OAuth service
4. Implement backend OAuth controller
5. Test locally
6. Deploy to staging
7. Deploy to production

---

**Status**: Ready to implement  
**Estimated Time**: 2-3 days  
**Complexity**: Medium  
**Dependencies**: OAuth app credentials from Google and Facebook


