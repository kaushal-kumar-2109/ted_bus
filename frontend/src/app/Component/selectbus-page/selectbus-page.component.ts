import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { LanguageService } from '../../service/language.service';
import { Subscription } from 'rxjs';
import { url } from '../../config';
import { NotificationService } from '../../service/notification.service';

@Component({
  selector: 'app-selectbus-page',
  templateUrl: './selectbus-page.component.html',
  styleUrl: './selectbus-page.component.css'
})
export class SelectbusPageComponent implements OnInit, OnDestroy {
  isFilterOpen: boolean = false;
  
  // Abandonment tracking state
  departure: string = '';
  arrival: string = '';
  date: string = '';
  isProgressed: boolean = false;
  isTriggered: boolean = false;
  private routerSubscription!: Subscription;

  constructor(
    public lang: LanguageService,
    private route: ActivatedRoute,
    private router: Router,
    private notifyService: NotificationService
  ) {}

  ngOnInit(): void {
    // Extract query params
    this.route.queryParams.subscribe(params => {
      this.departure = params['departure'] || '';
      this.arrival = params['arrival'] || '';
      this.date = params['date'] || '';
    });

    // Listen to route changes
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        const targetUrl = event.url;
        // If navigating away and NOT to payment page, then they abandoned search!
        if (!targetUrl.includes('/payment') && !targetUrl.includes('/select-bus')) {
          this.triggerSearchAbandonment();
        } else if (targetUrl.includes('/payment')) {
          this.isProgressed = true;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    // Trigger if component gets destroyed and they haven't progressed or triggered yet
    if (!this.isProgressed && !this.isTriggered) {
      this.triggerSearchAbandonment();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any): void {
    if (!this.isProgressed && !this.isTriggered) {
      this.triggerSearchAbandonmentKeepAlive();
    }
  }

  triggerSearchAbandonment(): void {
    if (this.isTriggered || !this.departure || !this.arrival) return;
    this.isTriggered = true;

    const token = sessionStorage.getItem('token');
    if (!token) return; // Only notify authenticated users

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch(`${url}api/v1/bookings/abandonment/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: this.departure,
        destination: this.arrival,
        date: this.date
      })
    }).then(() => {
      // Broadcast real-time badge count update
      this.notifyService.refreshNotifications$.next();
    }).catch(err => {
      console.error('Failed to dispatch search abandonment notification', err);
    });
  }

  triggerSearchAbandonmentKeepAlive(): void {
    if (this.isTriggered || !this.departure || !this.arrival) return;
    this.isTriggered = true;

    const token = sessionStorage.getItem('token');
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch(`${url}api/v1/bookings/abandonment/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: this.departure,
        destination: this.arrival,
        date: this.date
      }),
      keepalive: true // Ensured completion on close
    });
  }

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }
}
