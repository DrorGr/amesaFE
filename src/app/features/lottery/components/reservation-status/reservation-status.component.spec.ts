import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ReservationStatusComponent } from './reservation-status.component';
import { ReservationService } from '../../services/reservation.service';
import { RealtimeService } from '@core/services/realtime.service';

describe('ReservationStatusComponent', () => {
  let component: ReservationStatusComponent;
  let fixture: ComponentFixture<ReservationStatusComponent>;
  let reservationService: jasmine.SpyObj<ReservationService>;
  let realtimeService: jasmine.SpyObj<RealtimeService>;

  const mockReservation = {
    id: 'reservation-1',
    houseId: 'house-1',
    userId: 'user-1',
    quantity: 5,
    totalPrice: 250,
    status: 'pending',
    reservationToken: 'token-123',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const reservationServiceSpy = jasmine.createSpyObj('ReservationService', ['getReservation', 'cancelReservation']);
    const realtimeServiceSpy = jasmine.createSpyObj('RealtimeService', [], {
      reservationStatusUpdates$: of()
    });

    reservationServiceSpy.getReservation.and.returnValue(of(mockReservation));
    reservationServiceSpy.cancelReservation.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [ReservationStatusComponent, HttpClientTestingModule],
      providers: [
        { provide: ReservationService, useValue: reservationServiceSpy },
        { provide: RealtimeService, useValue: realtimeServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationStatusComponent);
    component = fixture.componentInstance;
    reservationService = TestBed.inject(ReservationService) as jasmine.SpyObj<ReservationService>;
    realtimeService = TestBed.inject(RealtimeService) as jasmine.SpyObj<RealtimeService>;

    fixture.componentRef.setInput('reservationId', 'reservation-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reservation on init', () => {
    expect(reservationService.getReservation).toHaveBeenCalledWith('reservation-1');
  });

  it('should display reservation status', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Pending');
    expect(compiled.textContent).toContain('5'); // Quantity
    expect(compiled.textContent).toContain('250'); // Total price
  });

  it('should allow cancelling pending reservation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.cancelReservation();
    expect(reservationService.cancelReservation).toHaveBeenCalledWith('reservation-1');
  });

  it('should handle errors', () => {
    reservationService.getReservation.and.returnValue(throwError(() => new Error('Failed')));
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.error()).not.toBeNull();
  });
});




