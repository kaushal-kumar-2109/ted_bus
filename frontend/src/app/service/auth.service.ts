import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { url } from '../config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseAuthUrl: string = url + 'api/v1/auth/';

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.baseAuthUrl}register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.baseAuthUrl}login`, credentials).pipe(
      map(res => {
        if (res && res.success) {
          const user = res.user || (res.data ? res.data.user : null);
          if (user) {
            // Map response data to match existing frontend expectations (Customer model)
            const mappedUser = {
              _id: user.id || user._id,
              id: user.id || user._id,
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
              email: user.email,
              gender: user.gender,
              phone: user.phone,
              profilepicture: user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName || 'User'}+${user.lastName || ''}&size=200&background=d02b2b&color=fff`,
              role: user.role || 'user'
            };
            return {
              success: true,
              user: mappedUser,
              token: res.token || res.accessToken || (res.data ? (res.data.token || res.data.accessToken) : null)
            };
          }
        }
        return res;
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseAuthUrl}forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseAuthUrl}reset-password/${token}`, { password });
  }
}
