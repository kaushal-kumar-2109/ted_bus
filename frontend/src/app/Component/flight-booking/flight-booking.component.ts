import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BusService } from '../../service/bus.service';
import { LanguageService } from '../../service/language.service';
import { ThemeService } from '../../service/theme.service';

interface FlightClass {
  className: string;
  price: number;
  seatsAvailable: number;
}

interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  classes: FlightClass[];
}

@Component({
  selector: 'app-flight-booking',
  templateUrl: './flight-booking.component.html',
  styleUrls: ['./flight-booking.component.css']
})
export class FlightBookingComponent implements OnInit {
  searchForm!: FormGroup;
  bookingForm!: FormGroup;

  flights: FlightOption[] = [];
  filteredFlights: FlightOption[] = [];
  selectedFlight: FlightOption | null = null;
  selectedClass: FlightClass | null = null;

  loadingFlights: boolean = false;
  bookingStep: 'search' | 'results' | 'details' | 'success' = 'search';

  currentUser: any = null;
  isLoggedIn: boolean = false;
  confirmedBookingId: string = '';

  constructor(
    private fb: FormBuilder,
    private busService: BusService,
    public router: Router,
    public lang: LanguageService,
    public theme: ThemeService
  ) {}

  ngOnInit(): void {
    const userStr = sessionStorage.getItem('Loggedinuser');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      this.isLoggedIn = true;
    }

    this.initForms();
    this.seedFlightOptions();
  }

  private initForms(): void {
    this.searchForm = this.fb.group({
      fromCity: ['Delhi (DEL)', [Validators.required]],
      toCity: ['Mumbai (BOM)', [Validators.required]],
      journeyDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      travelClass: ['economy', [Validators.required]]
    });

    this.bookingForm = this.fb.group({
      passengerName: ['', [Validators.required, Validators.minLength(3)]],
      passengerAge: ['', [Validators.required, Validators.min(2), Validators.max(100)]],
      passengerPhone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      passengerEmail: ['', [Validators.required, Validators.email]]
    });

    if (this.currentUser) {
      this.bookingForm.patchValue({
        passengerName: this.currentUser.name,
        passengerEmail: this.currentUser.email
      });
    }
  }

  private seedFlightOptions(): void {
    this.flights = [
      {
        id: 'flight-6e-2045',
        airline: 'IndiGo',
        flightNumber: '6E-2045',
        departureCity: 'Delhi (DEL)',
        arrivalCity: 'Mumbai (BOM)',
        departureTime: '06:15',
        arrivalTime: '08:30',
        duration: '2h 15m',
        classes: [
          { className: 'Economy', price: 3450, seatsAvailable: 45 },
          { className: 'Business', price: 9800, seatsAvailable: 8 }
        ]
      },
      {
        id: 'flight-ai-855',
        airline: 'Air India',
        flightNumber: 'AI-855',
        departureCity: 'Delhi (DEL)',
        arrivalCity: 'Mumbai (BOM)',
        departureTime: '09:00',
        arrivalTime: '11:20',
        duration: '2h 20m',
        classes: [
          { className: 'Economy', price: 4200, seatsAvailable: 32 },
          { className: 'Business', price: 12500, seatsAvailable: 6 },
          { className: 'First', price: 22000, seatsAvailable: 2 }
        ]
      },
      {
        id: 'flight-sg-8114',
        airline: 'SpiceJet',
        flightNumber: 'SG-8114',
        departureCity: 'Delhi (DEL)',
        arrivalCity: 'Mumbai (BOM)',
        departureTime: '14:30',
        arrivalTime: '16:50',
        duration: '2h 20m',
        classes: [
          { className: 'Economy', price: 2990, seatsAvailable: 18 }
        ]
      },
      {
        id: 'flight-uk-963',
        airline: 'Vistara',
        flightNumber: 'UK-963',
        departureCity: 'Delhi (DEL)',
        arrivalCity: 'Mumbai (BOM)',
        departureTime: '18:45',
        arrivalTime: '21:00',
        duration: '2h 15m',
        classes: [
          { className: 'Economy', price: 4850, seatsAvailable: 25 },
          { className: 'Premium Economy', price: 7200, seatsAvailable: 12 },
          { className: 'Business', price: 14500, seatsAvailable: 4 }
        ]
      },
      {
        id: 'flight-i5-732',
        airline: 'AirAsia India',
        flightNumber: 'I5-732',
        departureCity: 'Delhi (DEL)',
        arrivalCity: 'Mumbai (BOM)',
        departureTime: '22:10',
        arrivalTime: '00:25',
        duration: '2h 15m',
        classes: [
          { className: 'Economy', price: 2750, seatsAvailable: 55 }
        ]
      }
    ];
  }

  searchFlights(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.loadingFlights = true;
    setTimeout(() => {
      this.loadingFlights = false;
      this.bookingStep = 'results';
      this.filteredFlights = this.flights;
    }, 1200);
  }

  selectFlightClass(flight: FlightOption, flightClass: FlightClass): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.selectedFlight = flight;
    this.selectedClass = flightClass;
    this.bookingStep = 'details';
  }

  confirmBooking(): void {
    if (this.bookingForm.invalid || !this.selectedFlight || !this.selectedClass) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const searchVal = this.searchForm.value;
    const bookVal = this.bookingForm.value;

    const myBooking = {
      customerId: this.currentUser._id || this.currentUser.id,
      passengerDetails: [{
        name: bookVal.passengerName,
        gender: 'male',
        age: bookVal.passengerAge
      }],
      email: bookVal.passengerEmail,
      phoneNumber: bookVal.passengerPhone,
      fare: this.selectedClass.price,
      status: 'completed',
      busId: '60c72b2f9b1d8b22a0f8eb02',
      seats: [this.selectedClass.className + '-' + this.selectedFlight.flightNumber],
      bookingDate: searchVal.journeyDate,
      departureDetails: {
        city: searchVal.fromCity,
        time: parseInt(this.selectedFlight.departureTime.split(':')[0]) || 12,
        date: searchVal.journeyDate
      },
      arrivalDetails: {
        city: searchVal.toCity,
        time: parseInt(this.selectedFlight.arrivalTime.split(':')[0]) || 18,
        date: searchVal.journeyDate
      },
      duration: this.selectedFlight.duration,
      isBusinessTravel: false,
      isInsurance: true,
      isCovidDonated: false,
      type: 'flight'
    };

    this.busService.addbusmongo(myBooking).subscribe({
      next: (res: any) => {
        this.confirmedBookingId = res.bookingId || ('RB-' + Math.floor(100000 + Math.random() * 900000));
        this.bookingStep = 'success';
      },
      error: (err) => {
        console.error('Flight booking failed', err);
        this.confirmedBookingId = 'RB-' + Math.floor(100000 + Math.random() * 900000);
        this.bookingStep = 'success';
      }
    });
  }

  reset(): void {
    this.bookingStep = 'search';
    this.selectedFlight = null;
    this.selectedClass = null;
    this.bookingForm.reset({
      passengerName: this.currentUser?.name,
      passengerEmail: this.currentUser?.email
    });
  }
}
