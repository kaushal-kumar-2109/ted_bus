import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './Component/landing-page/landing-page.component';
import { SelectbusPageComponent } from './Component/selectbus-page/selectbus-page.component';
import { PaymentPageComponent } from './Component/payment-page/payment-page.component';
import { ProfilePageComponent } from './Component/profile-page/profile-page.component';
import { LoginComponent } from './Component/login/login.component';
import { SignupComponent } from './Component/signup/signup.component';
import { ForgotPasswordComponent } from './Component/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './Component/reset-password/reset-password.component';
import { CommunityComponent } from './Component/community/community.component';
import { RoutePlannerComponent } from './Component/route-planner/route-planner.component';
import { CabRentalComponent } from './Component/cab-rental/cab-rental.component';
import { TrainTicketsComponent } from './Component/train-tickets/train-tickets.component';
import { FlightBookingComponent } from './Component/flight-booking/flight-booking.component';

const routes: Routes = [
  {path: '',component:LandingPageComponent},
  {path: 'select-bus',component:SelectbusPageComponent},
  {path:'payment',component:PaymentPageComponent},
  {path:'profile',component:ProfilePageComponent},
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: SignupComponent},
  {path: 'forgot-password', component: ForgotPasswordComponent},
  {path: 'reset-password/:token', component: ResetPasswordComponent},
  {path: 'community', component: CommunityComponent},
  {path: 'planner', component: RoutePlannerComponent},
  {path: 'cabs', component: CabRentalComponent},
  {path: 'trains', component: TrainTicketsComponent},
  {path: 'flights', component: FlightBookingComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
