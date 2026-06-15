import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../config';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseApiUrl: string = url + 'api/v1/notifications';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token || ''}`
      })
    };
  }

  getNotifications(unreadOnly: boolean = false): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}?unreadOnly=${unreadOnly}`, this.getHeaders());
  }

  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}/unread-count`, this.getHeaders());
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseApiUrl}/${id}/read`, {}, this.getHeaders());
  }

  markAllAsRead(): Observable<any> {
    return this.http.put<any>(`${this.baseApiUrl}/read-all`, {}, this.getHeaders());
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseApiUrl}/${id}`, this.getHeaders());
  }
}
