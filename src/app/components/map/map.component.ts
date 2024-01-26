import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Accident } from '../../models/accident';
import { AccidentService } from '../../services/accident.service';
import { MapDataService } from '../../services/map-data.service';
import { MarkerClusterGroup } from 'leaflet';
import { LoadingService } from '../../services/loading.service';

declare let L: any;
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
  private markers!: MarkerClusterGroup;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private accidentService: AccidentService, 
    private mapDataService: MapDataService,
    private loadingService: LoadingService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId) && L) {
      this.importLeafletMarkerCluster();
      this.initMap(L);
      this.fetchAndPlotAccidents(L);
      this.subscribeToAccidentUpdates(L);
      this.subscribeToResetZoom();
    }
  }

  private async importLeafletMarkerCluster(): Promise<void> {
    await import('leaflet.markercluster');
  }

  private initMap(L: LeafletType): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [0, 0],
      zoom: 3,
      minZoom: 3,
      maxBounds: [[-90, -210], [90, 210]],
      maxBoundsViscosity: 1.0,
    });

    const OpenStreetMap_Mapnik = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    OpenStreetMap_Mapnik.addTo(this.map);
  }

  private fetchAndPlotAccidents(L: LeafletType): void {
    this.loadingService.showSpinner();
    this.accidentService.getAllAccidents().subscribe({
      next: (accidents) => {
        this.plotAccidentsOnMap(accidents, L);
        this.loadingService.hideSpinner();
      },
      error: (err) => {
        console.error(err);
        this.loadingService.hideSpinner();
      },
    });
  }

  private plotAccidentsOnMap(accidents: Accident[], L: LeafletType): void {
    const icon = L.icon({
      iconUrl: 'assets/images/marker-icon.png',
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.markers = L.markerClusterGroup();

    accidents.forEach((accident) => {
      const marker = L.marker([accident.latitude, accident.longitude], { icon: icon });
      marker.bindPopup(this.createPopupContent(accident));
      marker.on('mouseover', () => marker.openPopup());
      this.markers.addLayer(marker);
    });

    this.map.addLayer(this.markers);
  }

  private createPopupContent(accident: Accident): string {
    const flightNumberMatch = /\d+/.exec(accident.flightNumber);
    const numericFlightNumber = flightNumberMatch ? flightNumberMatch[0] : '';
    const popupTitle = numericFlightNumber ? accident.operator + ' Flight ' + numericFlightNumber : accident.operator;

    const accidentDate = new Date(accident.date + 'T00:00:00');
    const formattedAccidentDate = accidentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    accident.categories.sort((a, b) => a.localeCompare(b));
    const accidentCategories = accident.categories.map((category, index) => index === 0 ? category : category.toLowerCase()).join(', ');
    const disputedText = accident.isDisputed ? ' (disputed)' : '';
    
    const aircraftRegistrationUrl = 'https://www.airliners.net/search?keywords=' + accident.aircraftRegistration;

    const departureAirportUrl = 'https://www.flightradar24.com/data/airports/' + accident.departureAirport.iataCode.toLowerCase();
    const destinationAirportUrl = 'https://www.flightradar24.com/data/airports/' + accident.destinationAirport.iataCode.toLowerCase();
    const stopoversHtml = accident.stopovers.length > 0
    ? '(via ' + accident.stopovers.map((stopover, index, array) => {
        const isLast = index === array.length - 1;
        let prefix = '';
        if (index !== 0) {
          prefix = isLast ? ' and ' : ', ';
        }
        return `${prefix}${stopover.airport.city} (<a href="https://www.flightradar24.com/data/airports/${stopover.airport.iataCode}" target="_blank" class="popup-link">${stopover.airport.icaoCode}</a>)`;
      }).join('') + ')'
    : '';
    const routeHtml = `${accident.departureAirport.city}, ${accident.departureAirport.country} (<a href="${departureAirportUrl}" target="_blank" class="popup-link">${accident.departureAirport.icaoCode}</a>) to ${accident.destinationAirport.city}, ${accident.destinationAirport.country} (<a href="${destinationAirportUrl}" target="_blank" class="popup-link">${accident.destinationAirport.icaoCode}</a>)<br>${stopoversHtml}`;

    const resourceLinksHtml = accident.resources.map(resource => 
      `<a href="${resource.url}" target="_blank" class="popup-link">${resource.description}</a>`).join('<br>');

    return `<div class="popup-content">
              <p class="popup-title">${popupTitle}</p>
              <p><strong>Date:</strong> ${formattedAccidentDate}</p>
              <p><strong>Location:</strong> ${accident.location} (${accident.country})</p>
              <p><strong>Occupants:</strong> ${accident.occupants}</p>
              <p><strong>Fatalities:</strong> ${accident.fatalities}</p>
              <p><strong>Aircraft:</strong> ${accident.aircraftType} (<a href="${aircraftRegistrationUrl}" target="_blank" class="popup-link">${accident.aircraftRegistration}</a>)</p>
              <p><strong>Route:</strong> ${routeHtml}</p>
              <p><strong>Flight Phase:</strong> ${accident.flightPhase}</p>
              <p><strong>Summary:</strong> ${accidentCategories}${disputedText}</p>
              <p><strong>Description:</strong> ${accident.description}</p>
              <p><strong>Resources:</strong><br>${resourceLinksHtml}</p>
            </div>`;
  }

  private subscribeToAccidentUpdates(L: LeafletType): void {
    this.mapDataService.currentAccidents.subscribe((accidents) => {
      this.clearMap();
      this.plotAccidentsOnMap(accidents, L);
    });
  }

  private subscribeToResetZoom(): void {
    this.mapDataService.resetZoom$.subscribe(() => {
      this.resetMapZoom();
    });
  }

  private resetMapZoom(): void {
    this.map.setView([0, 0], 3);
  }

  private clearMap(): void {
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    if (this.markers) {
      this.markers.clearLayers();
    }
  }
}
