import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CustomerService } from '../../service/customer.service';
import { LanguageService } from '../../service/language.service';

declare var google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private customerService: CustomerService,
    private router: Router,
    public lang: LanguageService
  ) {}

  ngOnInit(): void {
    // If user is already logged in, redirect to home page
    if (sessionStorage.getItem('Loggedinuser')) {
      this.router.navigate(['/']);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      try {
        google.accounts.id.initialize({
          client_id: "129421237209-jricn8ed4fgld4glk6k716deq5ebsmpb.apps.googleusercontent.com",
          callback: (response: any) => this.handleGoogleLogin(response)
        });

        const googlebtn = document.getElementById('google-btn-login');
        if (googlebtn) {
          google.accounts.id.renderButton(googlebtn, {
            theme: 'outline',
            size: 'large',
            shape: 'rectangular',
            width: 384 // matches input box width of max-w-md
          });
        }
      } catch (e) {
        console.warn('Google Auth renderButton error:', e);
      }
    }
  }

  private decodetoken(token: string) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  handleGoogleLogin(response: any): void {
    this.loading = true;
    this.errorMessage = '';
    const payload = this.decodetoken(response.credential);
    if (!payload) {
      this.errorMessage = 'Google authentication failed to decode payload.';
      this.loading = false;
      return;
    }

    this.customerService.addcustomermongo(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res) {
          // Normalize user response format just like manual login mapping
          const userObj = res.user || res;
          const mappedUser = {
            _id: userObj._id || userObj.id,
            id: userObj._id || userObj.id,
            name: userObj.name || `${payload.given_name} ${payload.family_name}`,
            email: userObj.email || payload.email,
            profilepicture: userObj.profilepicture || userObj.profilePicture || payload.picture,
            role: userObj.role || 'user'
          };
          sessionStorage.setItem('Loggedinuser', JSON.stringify(mappedUser));
          if (res.token) {
            sessionStorage.setItem('token', res.token);
          }
          this.router.navigate(['/']).then(() => {
            window.location.reload();
          });
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Google login failed on database registration.';
        console.error('Google login error', err);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.user) {
          sessionStorage.setItem('Loggedinuser', JSON.stringify(res.user));
          const tokenVal = res.token || res.accessToken || (res.data?.accessToken || res.data?.token);
          if (tokenVal) {
            sessionStorage.setItem('token', tokenVal);
          }
          this.router.navigate(['/']).then(() => {
            window.location.reload();
          });
        } else {
          this.errorMessage = res.message || 'Login failed. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid email or password.';
        console.error('Login error', err);
      }
    });
  }
}
