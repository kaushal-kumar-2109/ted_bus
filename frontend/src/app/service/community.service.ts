import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { url } from '../config';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private baseApiUrl: string = url + 'api/v1/';

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers: HttpHeaders } {
    const token = sessionStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token || ''}`
      })
    };
  }

  // --- POSTS (Journey Stories & Tips) ---

  getPosts(category?: string, page: number = 1, limit: number = 10): Observable<any> {
    let queryParams = `?page=${page}&limit=${limit}`;
    if (category) {
      queryParams += `&category=${category}`;
    }
    return this.http.get<any>(`${this.baseApiUrl}posts${queryParams}`);
  }

  getTrendingPosts(limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}posts/trending/all?limit=${limit}`);
  }

  getPostById(postId: string): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}posts/${postId}`);
  }

  createPost(postData: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}posts`, postData, this.getHeaders());
  }

  likePost(postId: string): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}posts/${postId}/like`, {}, this.getHeaders());
  }

  reportPost(postId: string, reportData: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}posts/${postId}/report`, reportData, this.getHeaders());
  }

  deletePost(postId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseApiUrl}posts/${postId}`, this.getHeaders());
  }

  // --- COMMENTS ---

  getCommentsForPost(postId: string, page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}comments/post/${postId}?page=${page}&limit=${limit}`);
  }

  addComment(commentData: { postId: string; content: string; parentCommentId?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}comments`, commentData, this.getHeaders());
  }

  likeComment(commentId: string): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}comments/${commentId}/like`, {}, this.getHeaders());
  }

  // --- FORUMS & THREADS ---

  getForums(): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}forums`);
  }

  getForumThreads(forumId: string): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}threads/forum/${forumId}`);
  }

  createThread(threadData: { forumId: string; title: string; content: string; tags?: string[] }): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}threads`, threadData, this.getHeaders());
  }

  // --- VERIFICATION & PROFILE ---

  getUserProfile(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}users/${userId}/profile`);
  }

  submitVerification(documentUrl: string, documentType: string = 'ID'): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}users/verify-request`, { documentUrl, documentType }, this.getHeaders());
  }
}
