import { Component, OnInit } from '@angular/core';
import { BusService } from '../../service/bus.service';
import { Booking } from '../../model/booking.model';
import { LanguageService } from '../../service/language.service';
import { ThemeService } from '../../service/theme.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../service/notification.service';
import { CustomerService } from '../../service/customer.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent implements OnInit{
  selecteditem:string='trips';
  currentcustomer:any=[]
  currentname:string=''
  currentemail:string=''
  mytrip:Booking[]=[]
  isVerified:boolean = false;

  // Notification Preferences
  emailNotifications: boolean = true;
  bookingNotifications: boolean = true;
  promotionalNotifications: boolean = true;
  socialNotifications: boolean = true;

  // Notification History Log
  notificationHistory: any[] = [];
  loadingNotifications: boolean = false;

  handlelistitemclick(selected:string):void{
    this.selecteditem=selected;
    if (selected === 'notifications') {
      this.fetchNotificationHistory();
    }
  }

  constructor(
    private busbooking:BusService,
    public lang: LanguageService,
    public theme: ThemeService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private customerService: CustomerService
  ){}

  ngOnInit(): void {
    this.currentcustomer = sessionStorage.getItem('Loggedinuser');
    if (this.currentcustomer) {
      try {
        const user = JSON.parse(this.currentcustomer);
        this.currentname = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        this.currentemail = user.email;
        this.isVerified = user.isProfileVerified || user.role === 'admin' || user.role === 'moderator';
        
        const userId = user._id || user.id;
        if (userId) {
          this.busbooking.getbusmongo(userId).subscribe((response: any) => {
            this.mytrip = response;
          });
        }
      } catch (e) {
        console.error('Failed to parse logged in user session', e);
      }

      // Fetch fresh settings and notification history from server
      this.customerService.getCurrentUser().subscribe({
        next: (res: any) => {
          if (res?.success && res.user) {
            const serverUser = res.user;
            this.isVerified = serverUser.isProfileVerified || serverUser.role === 'admin' || serverUser.role === 'moderator';
            
            // Sync with local storage
            const localUser = JSON.parse(this.currentcustomer);
            localUser.isProfileVerified = serverUser.isProfileVerified;
            localUser.role = serverUser.role;
            sessionStorage.setItem('Loggedinuser', JSON.stringify(localUser));

            if (serverUser.notifications) {
              this.emailNotifications = serverUser.notifications.emailNotifications;
              this.bookingNotifications = serverUser.notifications.bookingNotifications;
              this.promotionalNotifications = serverUser.notifications.postNotifications;
              this.socialNotifications = serverUser.notifications.commentNotifications;
            }
          }
        },
        error: (err) => console.error('Error fetching user server profile', err)
      });
      
      this.fetchNotificationHistory();
    }

    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selecteditem = params['tab'];
        if (params['tab'] === 'notifications') {
          this.fetchNotificationHistory();
        }
      }
    });
  }

  fetchNotificationHistory(): void {
    this.loadingNotifications = true;
    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        this.notificationHistory = res.data || [];
        this.loadingNotifications = false;
      },
      error: (err) => {
        console.error('Error fetching notification history', err);
        this.loadingNotifications = false;
      }
    });
  }

  saveNotificationPreferences(): void {
    const prefData = {
      notifications: {
        emailNotifications: this.emailNotifications,
        bookingNotifications: this.bookingNotifications,
        postNotifications: this.promotionalNotifications,
        commentNotifications: this.socialNotifications,
        followNotifications: this.socialNotifications
      }
    };
    this.customerService.updateProfile(prefData).subscribe({
      next: (res: any) => {
        alert('Notification preferences updated successfully!');
      },
      error: (err) => {
        console.error('Error updating notification preferences', err);
        alert('Failed to update notification preferences.');
      }
    });
  }

  markNotificationAsRead(notifyId: string): void {
    this.notificationService.markAsRead(notifyId).subscribe({
      next: (res: any) => {
        const notify = this.notificationHistory.find(n => n._id === notifyId);
        if (notify) notify.isRead = true;
      }
    });
  }

  deleteNotificationFromHistory(notifyId: string): void {
    this.notificationService.deleteNotification(notifyId).subscribe({
      next: (res: any) => {
        this.notificationHistory = this.notificationHistory.filter(n => n._id !== notifyId);
      }
    });
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }

  changeLanguage(langCode: string): void {
    this.lang.setLanguage(langCode);
  }

  clearAllNotifications(): void {
    this.notificationService.clearAllNotifications().subscribe({
      next: (res: any) => {
        this.notificationHistory = [];
      },
      error: (err) => {
        console.error('Error clearing notifications', err);
        // Fallback UI clear
        this.notificationHistory = [];
      }
    });
  }
}
