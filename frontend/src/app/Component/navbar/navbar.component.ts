import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../service/language.service';
import { ThemeService } from '../../service/theme.service';
import { NotificationService } from '../../service/notification.service';

declare var google: any;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  isloggedIn: boolean = false;
  currentUser: any = null;
  
  // Mobile menu state
  isMobileMenuOpen: boolean = false;

  // Notification States
  notifications: any[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;

  constructor(
    private router: Router,
    public lang: LanguageService,
    public theme: ThemeService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    const userStr = sessionStorage.getItem("Loggedinuser");
    const token = sessionStorage.getItem("token");
    if (userStr && !token) {
      sessionStorage.removeItem('Loggedinuser');
      sessionStorage.removeItem('token');
      this.isloggedIn = false;
      this.currentUser = null;
    } else if (userStr) {
      this.isloggedIn = true;
      this.currentUser = JSON.parse(userStr);
      this.fetchNotifications();
    } else {
      this.isloggedIn = false;
    }
  }

  fetchNotifications(): void {
    if (!this.isloggedIn) return;
    this.notify.getNotifications().subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.notifications = res.data || [];
          this.unreadCount = res.unreadCount || 0;
        }
      },
      error: (err) => console.error('Error fetching notifications list', err)
    });
  }

  toggleNotificationPanel(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.fetchNotifications();
    }
  }

  markRead(id: string): void {
    this.notify.markAsRead(id).subscribe({
      next: () => this.fetchNotifications(),
      error: (err) => console.error('Error marking read', err)
    });
  }

  markAllRead(): void {
    this.notify.markAllAsRead().subscribe({
      next: () => this.fetchNotifications(),
      error: (err) => console.error('Error marking all read', err)
    });
  }

  deleteNotification(id: string): void {
    this.notify.deleteNotification(id).subscribe({
      next: () => this.fetchNotifications(),
      error: (err) => console.error('Error deleting notification', err)
    });
  }

  changeLanguage(langCode: string): void {
    this.lang.setLanguage(langCode);
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }

  handlelogout() {
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      try {
        google.accounts.id.disableAutoSelect();
      } catch (e) {
        console.warn('Google Auth disableAutoSelect error:', e);
      }
    }
    sessionStorage.removeItem('Loggedinuser');
    sessionStorage.removeItem('token');
    window.location.reload();
  }

  navigate(route: string, tab?: string) {
    if (tab) {
      this.router.navigate([route], { queryParams: { tab } });
    } else {
      this.router.navigate([route]);
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
