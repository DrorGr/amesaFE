import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LiveInventoryComponent } from './live-inventory.component';
import { ReservationService } from '../../services/reservation.service';
import { RealtimeService } from '@core/services/realtime.service';

describe('LiveInventoryComponent', () => {
  let component: LiveInventoryComponent;
  let fixture: ComponentFixture<LiveInventoryComponent>;
  let reservationService: jasmine.SpyObj<ReservationService>;
  let realtimeService: jasmine.SpyObj<RealtimeService>;

  const mockInventory = {
    houseId: 'house-1',
    totalTickets: 1000,
    availableTickets: 500,
    reservedTickets: 0,
    soldTickets: 500,
    lotteryEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    timeRemaining: 7 * 24 * 60 * 60 * 1000,
    isSoldOut: false,
    isEnded: false
  };

  beforeEach(async () => {
    const reservationServiceSpy = jasmine.createSpyObj('ReservationService', ['getInventoryStatus']);
    const realtimeServiceSpy = jasmine.createSpyObj('RealtimeService', ['ensureConnection', 'joinLotteryGroup'], {
      inventoryUpdates$: of()
    });

    reservationServiceSpy.getInventoryStatus.and.returnValue(of(mockInventory));
    realtimeServiceSpy.ensureConnection.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [LiveInventoryComponent, HttpClientTestingModule],
      providers: [
        { provide: ReservationService, useValue: reservationServiceSpy },
        { provide: RealtimeService, useValue: realtimeServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LiveInventoryComponent);
    component = fixture.componentInstance;
    reservationService = TestBed.inject(ReservationService) as jasmine.SpyObj<ReservationService>;
    realtimeService = TestBed.inject(RealtimeService) as jasmine.SpyObj<RealtimeService>;

    fixture.componentRef.setInput('houseId', 'house-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load inventory on init', () => {
    expect(reservationService.getInventoryStatus).toHaveBeenCalledWith('house-1', false);
  });

  it('should join lottery group for real-time updates', (done) => {
    setTimeout(() => {
      expect(realtimeService.ensureConnection).toHaveBeenCalled();
      expect(realtimeService.joinLotteryGroup).toHaveBeenCalledWith('house-1');
      done();
    }, 100);
  });

  it('should display inventory status', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('500'); // Available tickets
  });

  it('should handle errors', () => {
    reservationService.getInventoryStatus.and.returnValue(throwError(() => new Error('Failed')));
    component.ngOnInit();
    fixture.detectChanges();

    // Error should be displayed
    expect(component.error()).not.toBeNull();
  });
});




