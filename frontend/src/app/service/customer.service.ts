import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../model/customer.model';
import { url } from '../config';
@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiurl:string=url + 'customer/'
  constructor(private http:HttpClient) { }

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token || ''}`
      })
    };
  }

  addcustomermongo(user:any):Observable<Customer>{
    const customer:Customer={
      name:user.name,
      email:user.email,
      googleId:user.id,
      profilepicture:user.picture
    }
    return this.http.post<Customer>(this.apiurl,customer)
  }

  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${url}api/v1/auth/me`, this.getHeaders());
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put<any>(`${url}api/v1/users/me`, profileData, this.getHeaders());
  }
}
