import { Injectable, signal } from '@angular/core';

export interface PaymentPanelData {
  productId: string;
  houseId?: string;
  houseTitle?: string;
  triggerButton?: HTMLElement;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentPanelService {
  isOpen = signal(false);
  panelData = signal<PaymentPanelData | null>(null);
  private openTimeout?: ReturnType<typeof setTimeout>;
  private closeTimeout?: ReturnType<typeof setTimeout>;

  open(data: PaymentPanelData) {
    // Cancel any pending open timeout (prevent race conditions)
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }

    // Close existing panel if open (prevent duplicate panels)
    if (this.isOpen()) {
      this.close();
      // Wait a brief moment for cleanup
      this.openTimeout = setTimeout(() => {
        this.panelData.set(data);
        this.isOpen.set(true);
        this.openTimeout = undefined;
      }, 50);
    } else {
      this.panelData.set(data);
      this.isOpen.set(true);
    }
  }

  close() {
    // Cancel any pending open timeout
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }

    this.isOpen.set(false);
    // Clear data after a short delay to allow animations to complete
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.closeTimeout = setTimeout(() => {
      this.panelData.set(null);
      this.closeTimeout = undefined;
    }, 300);
  }
}

