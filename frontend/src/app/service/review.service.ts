import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../config';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseApiUrl: string = url + 'api/v1/reviews';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = sessionStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token || ''}`
      })
    };
  }

  addReview(reviewData: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}`, reviewData, this.getHeaders());
  }

  getBusReviews(busId: string): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}/bus/${busId}`);
  }

  editReview(reviewId: string, reviewData: { title?: string; description?: string }): Observable<any> {
    return this.http.put<any>(`${this.baseApiUrl}/${reviewId}`, reviewData, this.getHeaders());
  }

  reportReview(reviewId: string): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}/${reviewId}/report`, {}, this.getHeaders());
  }

  markHelpful(reviewId: string): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}/${reviewId}/helpful`, {}, this.getHeaders());
  }
}
