import { Injectable, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { ThemeService } from './theme.service';
import { TranslationService } from './translation.service';
import { Router } from '@angular/router';

export interface UserProfile {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  idNumber: string;
  email: string;
  phoneNumbers: string[];
  isVerified: boolean;
  accountType: 'basic' | 'gold' | 'premium';
  joinDate: string;
  lastLogin: string;
}

@Injectable({
  providedIn: 'root'
})
export class MemberSettingsService {
  private authService: AuthService;
  private userService: UserService;
  private themeService: ThemeService;
  private translationService: TranslationService;
  private router: Router;
  private fb: FormBuilder;

  // State
  private _activeTab = signal<string>('profile');
  private _isEditingProfile = signal<boolean>(false);
  private _userProfile = signal<UserProfile>({
    firstName: '',
    lastName: '',
    gender: 'male',
    dateOfBirth: '',
    idNumber: '',
    email: '',
    phoneNumbers: [],
    isVerified: false,
    accountType: 'basic',
    joinDate: '',
    lastLogin: ''
  });
  private _copySuccess = signal<boolean>(false);

  // Forms
  profileForm: FormGroup;

  // Readonly signals
  activeTab = this._activeTab.asReadonly();
  isEditingProfile = this._isEditingProfile.asReadonly();
  userProfile = this._userProfile.asReadonly();
  copySuccess = this._copySuccess.asReadonly();

  constructor(
    authService: AuthService,
    userService: UserService,
    themeService: ThemeService,
    translationService: TranslationService,
    router: Router,
    fb: FormBuilder
  ) {
    this.authService = authService;
    this.userService = userService;
    this.themeService = themeService;
    this.translationService = translationService;
    this.router = router;
    this.fb = fb;

    // Initialize profile form
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['male', Validators.required],
      dateOfBirth: ['', Validators.required],
      idNumber: ['']
    });
  }

  // Tab management
  setActiveTab(tabId: string): void {
    this._activeTab.set(tabId);
  }

  // Profile editing
  startEdit(): void {
    this._isEditingProfile.set(true);
    // Populate form with current profile data
    const profile = this._userProfile();
    this.profileForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
      idNumber: profile.idNumber
    });
  }

  cancelEdit(): void {
    this._isEditingProfile.set(false);
    // Reset form to current profile data
    const profile = this._userProfile();
    this.profileForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
      idNumber: profile.idNumber
    });
  }

  // Load user profile
  async loadUserProfile(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser()();
      if (currentUser) {
        // Load user data from service
        const userData = await this.userService.getUserProfile().toPromise();
        if (userData) {
          this._userProfile.set({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            gender: (userData.gender as 'male' | 'female' | 'other') || 'male',
            dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
            idNumber: userData.idNumber || '',
            email: userData.email || '',
            phoneNumbers: userData.phone ? [userData.phone] : [],
            isVerified: userData.emailVerified || false,
            accountType: 'basic' as 'basic' | 'gold' | 'premium', // Default to basic, can be enhanced later
            joinDate: userData.createdAt ? new Date(userData.createdAt).toISOString() : '',
            lastLogin: userData.lastLoginAt ? new Date(userData.lastLoginAt).toISOString() : ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  // Profile submission
  async onProfileSubmit(): Promise<void> {
    if (this.profileForm.valid && !this._userProfile().isVerified) {
      try {
        const formValue = this.profileForm.value;
        
        // Prepare update request
        const updateRequest = {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          gender: formValue.gender.charAt(0).toUpperCase() + formValue.gender.slice(1), // Capitalize first letter
          dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : undefined,
          idNumber: formValue.idNumber || undefined
        };
        
        // Update user profile (returns Observable)
        const updatedUser = await this.userService.updateUserProfile(updateRequest).toPromise();

        if (updatedUser) {
          // Reload user profile to get updated data
          await this.loadUserProfile();
          this._isEditingProfile.set(false);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error; // Re-throw to allow component to handle
      }
    }
  }

  // Password change
  changePassword(): void {
    // Navigate to password change page or show modal
    this.router.navigate(['/change-password']);
  }

  // Account verification
  verifyAccount(): void {
    // Navigate to verification page
    this.router.navigate(['/verify-account']);
  }

  // Utility functions
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this._copySuccess.set(true);
      setTimeout(() => this._copySuccess.set(false), 2000);
    });
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  changeLanguage(language: string = 'en'): void {
    // Language change logic - can be enhanced later
    // For now, this is a placeholder
  }

  // Star rewards calculations
  totalStars(): number {
    // Calculate total stars from rewards
    return 0; // Placeholder
  }

  activeStars(): number {
    // Calculate active (non-expired) stars
    return 0; // Placeholder
  }

  // Translation helper
  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

