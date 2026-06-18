import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ReviewService } from '../../../../../service/review.service';

@Component({
  selector: 'app-bottom-tab',
  templateUrl: './bottom-tab.component.html',
  styleUrl: './bottom-tab.component.css'
})
export class BottomTabComponent {
@Input() filledseats:number[]=[]
@Input() seatprice:number=0;
@Input() routedetials:any;
@Input() busarrivaltime: number=0;
@Input() busdeparturetime:number=0;
@Input() operatorname: string=''
@Input() busid:string=''

@Output() tabActive = new EventEmitter<boolean>();

tabstate:boolean[]=[false,false,false,false,false]

// Reviews state
reviews: any[] = [];
avgrating: number = 0;
ratingBreakdown: any = null;
loadingReviews: boolean = false;

constructor(private reviewService: ReviewService) {}

handletabstate(value:number):void{
  for(let i=0;i<this.tabstate.length;i++){
    this.tabstate[i]=(i===value && !this.tabstate[i])
  }
  const anyActive = this.tabstate.some(state => state === true);
  this.tabActive.emit(anyActive);

  // If reviews tab is active, load reviews
  if (this.tabstate[2] && this.busid) {
    this.loadReviews();
  }
}

loadReviews(): void {
  this.loadingReviews = true;
  this.reviewService.getBusReviews(this.busid).subscribe({
    next: (res: any) => {
      this.reviews = res.reviews || [];
      this.ratingBreakdown = res.ratingBreakdown || null;
      
      if (this.reviews.length > 0) {
        let sum = this.reviews.reduce((acc: number, r: any) => acc + r.overallRating, 0);
        this.avgrating = +(sum / this.reviews.length).toFixed(1);
      } else {
        this.avgrating = 0;
      }
      this.loadingReviews = false;
    },
    error: (err: any) => {
      console.error('Error loading reviews in bottom tab', err);
      this.loadingReviews = false;
    }
  });
}

}
