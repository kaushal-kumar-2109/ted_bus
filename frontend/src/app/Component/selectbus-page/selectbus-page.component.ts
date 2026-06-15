import { Component } from '@angular/core';
import { LanguageService } from '../../service/language.service';

@Component({
  selector: 'app-selectbus-page',
  templateUrl: './selectbus-page.component.html',
  styleUrl: './selectbus-page.component.css'
})
export class SelectbusPageComponent {
  isFilterOpen: boolean = false;

  constructor(public lang: LanguageService) {}

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }
}
