import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './Component/navbar/navbar.component';
import { FooterComponent } from './Component/footer/footer.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LandingPageComponent } from './Component/landing-page/landing-page.component';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import { MatDialogModule} from '@angular/material/dialog';
import { DialogComponent } from './Component/landing-page/dialog/dialog.component';
import {MatTableModule} from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectbusPageComponent } from './Component/selectbus-page/selectbus-page.component';
import { HeaderComponent } from './Component/selectbus-page/header/header.component';
import { LeftComponent } from './Component/selectbus-page/left/left.component';
import { RightComponent } from './Component/selectbus-page/right/right.component';
import {MatIconModule} from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SortingBarComponent } from './Component/selectbus-page/right/sorting-bar/sorting-bar.component';
import { BusBoxComponent } from './Component/selectbus-page/right/bus-box/bus-box.component'; 
import {MatDividerModule} from '@angular/material/divider';
import {MatSidenavModule} from '@angular/material/sidenav';
import { BottomTabComponent } from './Component/selectbus-page/right/bus-book/bottom-tab/bottom-tab.component';
import { ViewSeatsComponent } from './Component/selectbus-page/right/view-seats/view-seats.component';
import { FormDrawerComponent } from './Component/selectbus-page/right/form-drawer/form-drawer.component';
import { SmallSeatsComponent } from './Component/selectbus-page/right/small-seats/small-seats.component';
import { BusBookingFormComponent } from './Component/selectbus-page/right/bus-booking-form/bus-booking-form.component';
import { PaymentPageComponent } from './Component/payment-page/payment-page.component';
import { ProfilePageComponent } from './Component/profile-page/profile-page.component';
import { MyTripComponent } from './Component/profile-page/my-trip/my-trip.component';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './Component/login/login.component';
import { SignupComponent } from './Component/signup/signup.component';
import { ForgotPasswordComponent } from './Component/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './Component/reset-password/reset-password.component';
import { CommunityComponent } from './Component/community/community.component';
import { RoutePlannerComponent } from './Component/route-planner/route-planner.component';
import { CabRentalComponent } from './Component/cab-rental/cab-rental.component';
import { TrainTicketsComponent } from './Component/train-tickets/train-tickets.component';
import { FlightBookingComponent } from './Component/flight-booking/flight-booking.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    LandingPageComponent,
    DialogComponent,
    SelectbusPageComponent,
    HeaderComponent,
    LeftComponent,
    RightComponent,
    SortingBarComponent,
    BusBoxComponent,
    BottomTabComponent,
    ViewSeatsComponent,
    FormDrawerComponent,
    SmallSeatsComponent,
    BusBookingFormComponent,
    PaymentPageComponent,
    ProfilePageComponent,
    MyTripComponent,
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    CommunityComponent,
    RoutePlannerComponent,
    CabRentalComponent,
    TrainTicketsComponent,
    FlightBookingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatMenuModule,
    MatButtonModule,
    BrowserAnimationsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    MatSidenavModule,
    MatDividerModule,
    HttpClientModule
  ],
  providers: [provideNativeDateAdapter()],
  bootstrap: [AppComponent]
})
export class AppModule { }
