import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from "./map/map.component";
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [CommonModule, RouterOutlet, MapComponent, NavbarComponent, FooterComponent]
})
export class AppComponent {
  title = 'acmap';
}
