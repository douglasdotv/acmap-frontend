import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Accident } from './model/accident';
import { AccidentService } from './service/accident.service';

type LeafletType = typeof import('leaflet');

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  @ViewChild('map') private mapElement!: ElementRef;

  private map!: L.Map;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private accidentService: AccidentService) {}

  async ngAfterViewInit(): Promise<void> {
    const L = await this.loadLeaflet();
    if (L) {
      this.initMap(L);
      this.fetchAndPlotAccidents(L);
    }
  }

  private async loadLeaflet(): Promise<LeafletType | null> {
    if (isPlatformBrowser(this.platformId)) {
      return import('leaflet');
    }
    return null;
  }

  private initMap(L: LeafletType): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [0, 0],
      zoom: 2,
      minZoom: 3,
      maxBounds: [[-90, -210], [90, 210]],
      maxBoundsViscosity: 1.0,
    });

    const USGS_USImagery = L.tileLayer(
      'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 20,
        attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
      }
    );

    USGS_USImagery.addTo(this.map);
  }

  private fetchAndPlotAccidents(L: LeafletType): void {
    this.accidentService.getAllAccidents().subscribe({
      next: (accidents) => {
        this.plotAccidentsOnMap(accidents, L);
      },
      error: (err) => console.error(err),
    });
  }

  private plotAccidentsOnMap(accidents: Accident[], L: LeafletType): void {
    const icon = L.icon({
      iconUrl: 'assets/images/marker-icon.png',
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [20, 30],
      iconAnchor: [10, 30],
      popupAnchor: [0, -30],
      shadowSize: [30, 30]
    });
  
    accidents.forEach((accident) => {
      const marker = L.marker([accident.latitude, accident.longitude], { icon: icon });
      marker.bindPopup(this.createPopupContent(accident));
      marker.addTo(this.map);
    });
  }

  private createPopupContent(accident: Accident): string {
    const flightNumberMatch = /\d+/.exec(accident.flightNumber)
    const numericFlightNumber = flightNumberMatch ? flightNumberMatch[0] : '';
    const popupTitle = numericFlightNumber
               ? accident.operator + ' Flight ' + numericFlightNumber
               : accident.operator;

    const accidentDate = new Date(accident.date + 'T00:00:00');
    const formattedAccidentDate = accidentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    accident.categories.sort((a, b) => a.localeCompare(b));
    let accidentCategories = accident.categories
                .map((category, index) => index === 0 ? category : category.toLowerCase())
                .join(', ');
    if (accident.disputed) {
        accidentCategories += ' (disputed)';
    }
    
    const aircraftRegistrationUrl = 
      'https://www.airliners.net/search?keywords=' + accident.aircraftRegistration;
    const departureAirportUrl = 
      'https://www.world-airport-codes.com/search/?s=' + accident.departureAirportIcao;
    const destinationAirportUrl = 
      'https://www.world-airport-codes.com/search/?s=' + accident.destinationAirportIcao;
    const googleSearchUrl = 
      'https://www.google.com/search?q=' + encodeURIComponent(popupTitle);
  
    return `<div class="popup-content">
              <p class="popup-title">${popupTitle}</p>
              <p><strong>Date:</strong> ${formattedAccidentDate}</p>
              <p><strong>Location:</strong> ${accident.location} (${accident.country})</p>
              <p><strong>Occupants:</strong> ${accident.occupants}</p>
              <p><strong>Fatalities:</strong> ${accident.fatalities}</p>
              <p><strong>Aircraft:</strong> ${accident.aircraftModel} <a href="${aircraftRegistrationUrl}" target="_blank" class="popup-link">(${accident.aircraftRegistration})</a></p>
              <p><strong>Route:</strong> ${accident.departureAirportCity}, ${accident.departureAirportCountry} <a href="${departureAirportUrl}" target="_blank" class="popup-link">(${accident.departureAirportIcao})</a> to ${accident.destinationAirportCity}, ${accident.destinationAirportCountry} <a href="${destinationAirportUrl}" target="_blank" class="popup-link">(${accident.destinationAirportIcao})</a></p>
              <p><strong>Flight Phase:</strong> ${accident.flightPhase}</p>
              <p><strong>Summary:</strong> ${accidentCategories}</p>
              <p><strong>Description:</strong> ${accident.description}</p>
              <a href="${googleSearchUrl}" target="_blank" class="popup-link">More</a>
            </div>`;
  }
}
