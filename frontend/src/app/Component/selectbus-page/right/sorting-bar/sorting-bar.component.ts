import { Component } from '@angular/core';
import { LanguageService } from '../../../../service/language.service';

@Component({
  selector: 'app-sorting-bar',
  templateUrl: './sorting-bar.component.html',
  styleUrl: './sorting-bar.component.css'
})
export class SortingBarComponent {
  constructor(public lang: LanguageService) {}
}
