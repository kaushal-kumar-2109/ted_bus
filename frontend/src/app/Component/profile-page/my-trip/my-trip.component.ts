import { Component, Input, OnInit } from '@angular/core';
import { LanguageService } from '../../../service/language.service';
import { ReviewService } from '../../../service/review.service';
import { url } from '../../../config';

@Component({
  selector: 'app-my-trip',
  templateUrl: './my-trip.component.html',
  styleUrl: './my-trip.component.css'
})
export class MyTripComponent implements OnInit {
  @Input() booking: any[] = [];
 
  activeTab: string = 'bus';
  expandedBookingId: string | null = null;

  showReviewModal: boolean = false;
  selectedBooking: any = null;
  overallRating: number = 5;
  cleanlinessRating: number = 5;
  safetyRating: number = 5;
  comfortRating: number = 5;
  driverRating: number = 5;
  reviewTitle: string = '';
  reviewDescription: string = '';
  isEditing: boolean = false;
  editingReviewId: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  imageArr = [
    { _id: { $oid: "6049b8a97501a24470b9a526" }, images: "https://s3-ap-southeast-1.amazonaws.com/rb-plus/BI/APP/IND/WM/2323/1087/GW/DL/6fNUIf.jpeg" },
    { _id: { $oid: "6049b8a97501a24470b9a527" }, images: "https://s3-ap-southeast-1.amazonaws.com/rb-plus/BI/APP/IND/WM/2323/1087/GW/DL/6fNUIf.jpeg" },
    { _id: { $oid: "6049b8a97501a24470b9a528" }, images: "https://s3-ap-southeast-1.amazonaws.com/rb-plus/BI/APP/IND/WM/9365/1087/GW/DL/hDsqel.jpeg" },
    { _id: { $oid: "6049b8a97501a24470b9a529" }, images: "https://s3-ap-southeast-1.amazonaws.com/rb-plus/BI/APP/IND/WM/10/411/ST/L/penRe7.jpeg" },
    { _id: { $oid: "6049b8a97501a24470b9a52a" }, images: "https://s3-ap-southeast-1.amazonaws.com/rb-plus/BI/APP/IND/WM/19449/814/FR/DL/PuizKJ.jpeg" },
    { _id: { $oid: "6049b8a97501a24470b9a52b" }, images: "https://s3-ap-southeast-1.amazonaws.com/rb-plus/BI/APP/IND/WM/2323/450/OT/L/lejRej.jpeg" },
    { _id: { $oid: "6049b8a97501a24470b9a52c" }, images: "https://s3-ap-southeast-1.amazonaws.com/rb-plus/BI/APP/IND/WM/2323/54/ST/DL/11XMg2.jpeg" }
  ];

  randomimage: string = '';

  constructor(
    public lang: LanguageService,
    private reviewService: ReviewService
  ) {}

  ngOnInit() {
    const randomindex = Math.floor(Math.random() * this.imageArr.length);
    this.randomimage = this.imageArr[randomindex].images;
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  togglePassengers(bookingId: string): void {
    this.expandedBookingId = this.expandedBookingId === bookingId ? null : bookingId;
  }

  get filteredBookings() {
    if (!this.booking) return [];
    return this.booking.filter((b: any) => {
      const type = b.type || 'bus';
      return type.toLowerCase() === this.activeTab;
    });
  }

  checkCanEdit(booking: any): boolean {
    if (!booking.hasReviewed || !booking.review) return false;
    const createdAt = booking.review.createdAt || booking.review.updatedAt;
    if (!createdAt) return false;
    const diffTime = Math.abs(new Date().getTime() - new Date(createdAt).getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= 24;
  }

  openReviewModal(booking: any): void {
    this.selectedBooking = booking;
    this.isEditing = false;
    this.overallRating = 5;
    this.cleanlinessRating = 5;
    this.safetyRating = 5;
    this.comfortRating = 5;
    this.driverRating = 5;
    this.reviewTitle = '';
    this.reviewDescription = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showReviewModal = true;
  }

  openEditReviewModal(booking: any): void {
    this.selectedBooking = booking;
    this.isEditing = true;
    this.editingReviewId = booking.review?._id || booking.review;
    this.overallRating = booking.reviewRating || 5;
    this.reviewTitle = booking.review?.title || '';
    this.reviewDescription = booking.review?.description || '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedBooking = null;
  }

  selectOverallRating(rating: number): void {
    this.overallRating = rating;
  }

  submitReview(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.reviewDescription.trim().length < 20) {
      this.errorMessage = this.lang.text['min_char_limit'] || 'Minimum 20 characters required for description.';
      return;
    }

    if (this.isEditing) {
      this.reviewService.editReview(this.editingReviewId, {
        title: this.reviewTitle,
        description: this.reviewDescription
      }).subscribe({
        next: (res: any) => {
          this.successMessage = this.lang.text['review_success'] || 'Review updated successfully!';
          if (this.selectedBooking) {
            this.selectedBooking.review = res.review;
          }
          setTimeout(() => this.closeReviewModal(), 1500);
        },
        error: (err: any) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Error updating review';
        }
      });
    } else {
      const reviewData = {
        busId: this.selectedBooking.busId,
        bookingId: this.selectedBooking._id,
        title: this.reviewTitle || `Review for ${this.selectedBooking.bookingId}`,
        description: this.reviewDescription,
        overallRating: this.overallRating,
        cleanlinessRating: this.cleanlinessRating,
        safetyRating: this.safetyRating,
        comfortRating: this.comfortRating,
        driverRating: this.driverRating
      };

      this.reviewService.addReview(reviewData).subscribe({
        next: (res: any) => {
          this.successMessage = this.lang.text['review_success'] || 'Review submitted successfully!';
          this.selectedBooking.hasReviewed = true;
          this.selectedBooking.reviewRating = this.overallRating;
          this.selectedBooking.review = res.review;
          setTimeout(() => this.closeReviewModal(), 1500);
        },
        error: (err: any) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Error submitting review';
        }
      });
    }
  }

  downloadTicket(booking: any): void {
    const bookingId = booking._id || booking.id;
    if (bookingId) {
      const downloadUrl = `${url}api/v1/bookings/${bookingId}/download`;
      window.open(downloadUrl, '_blank');
    }
  }
}
