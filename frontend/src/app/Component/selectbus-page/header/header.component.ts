import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../../service/language.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  departure:string=''
  arrival:string=''
  date:string=''
  constructor(private route:ActivatedRoute, public lang: LanguageService){}
  ngOnInit(): void{
    this.route.queryParams.subscribe(params =>{
      const departure=params['departure'];
      const arrival=params['arrival'];
      const date=params['date'];

      this.departure=departure
      this.arrival=arrival
      this.date=date
    });
  }
}
