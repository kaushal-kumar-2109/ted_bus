import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { DataserviceService } from '../../service/dataservice.service';
import { HttpClient } from '@angular/common/http';
import { BusService } from '../../service/bus.service';
import { LanguageService } from '../../service/language.service';
import { Subscription } from 'rxjs';
import { url } from '../../config';
import { NotificationService } from '../../service/notification.service';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrl: './payment-page.component.css'
})
export class PaymentPageComponent implements OnInit, OnDestroy {
  passseatarray:any[]=[]
  passfare:number=0
  routedetails:any=[]
  busdepauturetime:number=0
  busarrivaltime:number=0
  customerid:any={}
  operatorname:string=''
  passengerdetails:any=[]
  email:string=''
  fare:number=0
  busid:string=''
  phonenumber:string=''
  departuredetails:any={}
  arrivaldetails:any={}
  duration:string=''
  isbuisnesstravel:boolean=false
  isinsurance:boolean=false
  iscoviddonated:Boolean=false
  bookingdate:string=new Date().toISOString().split('T')[0]

  // Abandonment & pre-creation state
  bookingIdMongo: string = '';
  isPreCreated: boolean = false;
  isProgressed: boolean = false;
  isTriggered: boolean = false;
  private routerSubscription!: Subscription;

  constructor(
    private route:ActivatedRoute, 
    private dataservice : DataserviceService,
    private http:HttpClient,
    private busservice:BusService, 
    public lang: LanguageService, 
    private router: Router,
    private notifyService: NotificationService
  ){}

  ngOnInit(): void {
    this.route.params.subscribe(params=>{
      const passSeatsArray = params['selectedseat'];
      const email = params['passemail'];
      const phoneNumber = params['passphn'];
      const isBusinessTravel = params['passisbuisness'];
      const isInsurance = params['passinsurance'];
      const passFare=params['seatprice'];
      const busId=params['busid'];
      const busArrivalTime=params['busarrivaltime'];
      const busDepartureTime=params['busdeparturetime'];
      const iscoviddonated=params['passiscoviddonate'];
      const operatorname=params['operatorname']
      this.operatorname=operatorname
      this.passseatarray=passSeatsArray
      this.email=email
      this.phonenumber=phoneNumber
      this.isbuisnesstravel=isBusinessTravel
      this.isinsurance=isInsurance
      this.passfare=passFare
      this.busid=busId
      this.busarrivaltime=busArrivalTime
      this.busdepauturetime=busDepartureTime
      this.iscoviddonated=iscoviddonated
      this.getloggedinuser()
      this.preCreateBooking();
    })
    
    this.dataservice.currentdata.subscribe(data=>{
      this.routedetails=data;
      console.log(data)
      this.preCreateBooking();
    })
    this.dataservice.passdata.subscribe(data=>{
      this.passengerdetails=data;
      console.log(data)
      this.preCreateBooking();
    })

    // Listen to route changes
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (!this.isProgressed && this.bookingIdMongo) {
          this.triggerPaymentAbandonment();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (!this.isProgressed && !this.isTriggered && this.bookingIdMongo) {
      this.triggerPaymentAbandonment();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any): void {
    if (!this.isProgressed && !this.isTriggered && this.bookingIdMongo) {
      this.triggerPaymentAbandonmentKeepAlive();
    }
  }

  getloggedinuser():any{
      const loggedinuserjson=sessionStorage.getItem("Loggedinuser");
      if(loggedinuserjson){
        this.customerid=JSON.parse(loggedinuserjson)
      }
      else{
        alert("please login to continue")
      }
      return null;
  }

  preCreateBooking(): void {
    if (this.isPreCreated) return;
    if (!this.customerid || !this.busid || !this.routedetails?.departureLocation || !this.passengerdetails?.length) {
      return;
    }
    this.isPreCreated = true;

    let myBooking: any = {};
    myBooking.customerId = this.customerid._id || this.customerid.id;
    myBooking.passengerDetails = this.passengerdetails;
    myBooking.email = this.email || this.customerid.email;
    myBooking.phoneNumber = this.phonenumber;
    myBooking.fare = this.passfare;
    myBooking.status = "pending"; // pre-created with status pending
    myBooking.busId = this.busid;
    let date = new Date();
    myBooking.bookingDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    myBooking.seats = this.passseatarray;
    myBooking.departureDetails = {
      city: this.routedetails.departureLocation.name,
      time: this.busdepauturetime,
      date: this.bookingdate
    };
    myBooking.arrivalDetails = {
      city: this.routedetails.arrivalLocation.name,
      time: this.busarrivaltime,
      date: this.bookingdate
    };
    myBooking.duration = this.routedetails.duration;
    myBooking.isBusinessTravel = this.isbuisnesstravel;
    myBooking.isInsurance = this.isinsurance;
    myBooking.isCovidDonated = this.iscoviddonated;

    this.busservice.addbusmongo(myBooking).subscribe({
      next: (response: any) => {
        console.log('Pre-created pending booking success', response);
        this.bookingIdMongo = response._id;
      },
      error: (error) => {
        console.error('Pre-creating booking failed', error);
      }
    });
  }

  triggerPaymentAbandonment(): void {
    if (this.isTriggered || !this.bookingIdMongo) return;
    this.isTriggered = true;

    const token = sessionStorage.getItem('token');
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch(`${url}api/v1/bookings/abandonment/payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bookingId: this.bookingIdMongo
      })
    }).then(() => {
      this.notifyService.refreshNotifications$.next();
    }).catch(err => {
      console.error('Failed to trigger payment abandonment notification', err);
    });
  }

  triggerPaymentAbandonmentKeepAlive(): void {
    if (this.isTriggered || !this.bookingIdMongo) return;
    this.isTriggered = true;

    const token = sessionStorage.getItem('token');
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    fetch(`${url}api/v1/bookings/abandonment/payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bookingId: this.bookingIdMongo
      }),
      keepalive: true
    });
  }

  makepayment(): void {
    this.isProgressed = true; // Mark as progressed to prevent abandonment trigger
    if (this.bookingIdMongo) {
      this.busservice.confirmPayment(this.bookingIdMongo).subscribe({
        next: (response) => {
          console.log('Confirm payment success', response);
          alert('Booking completed successfully! Ticket details have been sent to your email.');
          this.router.navigate(['/profile'], { queryParams: { tab: 'trips' } });
        },
        error: (error) => {
          console.error('Confirm payment failed', error);
          this.isProgressed = false;
          alert('Booking payment failed. Please try again.');
        }
      });
    } else {
      // Fallback
      let myBooking: any = {};
      myBooking.customerId = this.customerid._id || this.customerid.id;
      myBooking.passengerDetails = this.passengerdetails;
      myBooking.email = this.email || this.customerid.email;
      myBooking.phoneNumber = this.phonenumber;
      myBooking.fare = this.passfare;
      myBooking.status = "upcoming";
      myBooking.busId = this.busid;
      let date=new Date();
      myBooking.bookingDate=`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
      myBooking.seats = this.passseatarray;
      myBooking.departureDetails = {city:this.routedetails.departureLocation.name,
        time:this.busdepauturetime,
        date:this.bookingdate
      }
      myBooking.arrivalDetails = {city:this.routedetails.arrivalLocation.name,
        time:this.busarrivaltime,
        date:this.bookingdate
      }
      myBooking.duration = this.routedetails.duration;
      myBooking.isBusinessTravel = this.isbuisnesstravel;
      myBooking.isInsurance = this.isinsurance;
      myBooking.isCovidDonated = this.iscoviddonated;
      this.busservice.addbusmongo(myBooking).subscribe({
        next:(response)=>{
          console.log('Bus booking success',response);
          alert('Booking completed successfully! Ticket details have been sent to your email.');
          this.router.navigate(['/profile'], { queryParams: { tab: 'trips' } });
        },
        error:(error)=>{
          console.error('Post request failed',error);
          this.isProgressed = false;
          alert('Booking payment failed. Please try again.');
        }
      })
    }
  }
}
