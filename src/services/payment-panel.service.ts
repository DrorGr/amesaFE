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

  open(data: PaymentPanelData) {
    this.panelData.set(data);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    // Clear data after a short delay to allow animations to complete
    setTimeout(() => {
      this.panelData.set(null);
    }, 300);
  }
}

