import { Component, Input, OnInit } from '@angular/core';
import { ReviewService } from '../../../../service/review.service';
import { LanguageService } from '../../../../service/language.service';

@Component({
  selector: 'app-bus-box',
  templateUrl: './bus-box.component.html',
  styleUrl: './bus-box.component.css'
})
export class BusBoxComponent implements OnInit {
  @Input() rating: number[] = [];
  @Input() operatorname: string = '';
  @Input() bustype: string = '';
  @Input() departuretime: string = "";
  @Input() reschedulable: number = 0;
  @Input() livetracking: number = 0;
  @Input() filledseats: any[] = [];
  @Input() routedetails: any;
  @Input() busid: string = '';

  avgrating: number = 0;
  totalreview: number = 0;
  seatprivce: number = 0;
  bustypename: string = '';
  busdeparturetime: number = 0;
  busarrivaltime: number = 0;

  // Reviews Modal States
  showReviewsModal: boolean = false;
  reviews: any[] = [];
  ratingBreakdown: any = null;
  loadingReviews: boolean = false;
  isBookingOpen: boolean = false;

  constructor(
    private reviewService: ReviewService,
    public lang: LanguageService
  ) {}

  handleTabActive(isActive: boolean): void {
    this.isBookingOpen = isActive;
  }

  ngOnInit(): void {
    this.rating.forEach((item, index) => {
      this.avgrating += item;
      this.totalreview += index;
    });
    if (this.totalreview == 0) {
      this.totalreview = 1;
    }
    this.avgrating = +(this.avgrating / this.totalreview).toFixed(1);

    if (this.bustype === 'standard') {
      this.seatprivce = 50 * Math.floor(this.routedetails.duration) / 2;
      this.bustypename = 'standard';
    } else if (this.bustype === 'sleeper') {
      this.seatprivce = 100 * Math.floor(this.routedetails.duration) / 2;
      this.bustypename = 'sleeper';
    } else if (this.bustype === 'A/C Seater') {
      this.seatprivce = 125 * Math.floor(this.routedetails.duration) / 2;
      this.bustypename = 'A/C Seater';
    } else {
      this.seatprivce = 75 * Math.floor(this.routedetails.duration) / 2;
      this.bustypename = 'Non - A/C';
    }
    const numericvalue = parseInt(this.departuretime, 10);
    this.busdeparturetime = numericvalue;
    this.busarrivaltime = (numericvalue + this.routedetails.duration) % 24;
  }

  openReviewsModal(): void {
    if (!this.busid) return;
    this.loadingReviews = true;
    this.showReviewsModal = true;
    this.reviewService.getBusReviews(this.busid).subscribe({
      next: (res: any) => {
        this.reviews = res.reviews || [];
        this.ratingBreakdown = res.ratingBreakdown || null;
        this.loadingReviews = false;
      },
      error: (err) => {
        console.error('Error fetching reviews:', err);
        this.loadingReviews = false;
      }
    });
  }

  closeReviewsModal(): void {
    this.showReviewsModal = false;
  }

  markHelpful(reviewId: string, index: number): void {
    this.reviewService.markHelpful(reviewId).subscribe({
      next: (res: any) => {
        if (this.reviews[index]) {
          this.reviews[index].helpful = res.helpful;
        }
      },
      error: (err) => console.error(err)
    });
  }

  reportReview(reviewId: string, index: number): void {
    this.reviewService.reportReview(reviewId).subscribe({
      next: (res: any) => {
        if (res.isApproved === false) {
          // Hide it locally if it got auto-hidden by backend
          this.reviews.splice(index, 1);
        } else if (this.reviews[index]) {
          this.reviews[index].isReported = true;
        }
        alert(res.message);
      },
      error: (err) => console.error(err)
    });
  }
}
