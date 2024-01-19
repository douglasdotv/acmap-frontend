import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    RouterOutlet,
    MapComponent,
    NavbarComponent,
    FooterComponent,
    SpinnerComponent,
  ],
})
export class AppComponent implements OnInit {
  title = 'acmap';
  showSpinner = false;

  constructor(public loadingService: LoadingService) {}

  ngOnInit() {
    this.loadingService.loading$.subscribe((isLoading) => {
      this.showSpinner = isLoading;
    });
  }
}
