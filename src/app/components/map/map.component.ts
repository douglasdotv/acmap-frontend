import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Accident } from '../../models/accident';
import { AccidentService } from '../../services/accident.service';
import { MapDataService } from '../../services/map-data.service';

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private accidentService: AccidentService, private mapDataService: MapDataService) {}

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId) && L) {
      this.importLeafletMarkerCluster();
      this.initMap(L);
      this.fetchAndPlotAccidents(L);
      this.subscribeToAccidentUpdates(L);
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
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const markers = L.markerClusterGroup();

    accidents.forEach((accident) => {
      const marker = L.marker([accident.latitude, accident.longitude], { icon: icon });
      marker.bindPopup(this.createPopupContent(accident));
      marker.on(('mouseover'), () => marker.openPopup());
      marker.on(('mouseout'), () => marker.closePopup());
      markers.addLayer(marker);
    });

    this.map.addLayer(markers);
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
    const departureAirportUrl = 'https://www.world-airport-codes.com/search/?s=' + accident.departureAirportIcao;
    const destinationAirportUrl = 'https://www.world-airport-codes.com/search/?s=' + accident.destinationAirportIcao;

    const resourceLinksHtml = accident.resources.map(resource => 
      `<a href="${resource.url}" target="_blank" class="popup-link">${resource.description}</a>`).join('<br>');

    return `<div class="popup-content">
              <p class="popup-title">${popupTitle}</p>
              <p><strong>Date:</strong> ${formattedAccidentDate}</p>
              <p><strong>Location:</strong> ${accident.location} (${accident.country})</p>
              <p><strong>Occupants:</strong> ${accident.occupants}</p>
              <p><strong>Fatalities:</strong> ${accident.fatalities}</p>
              <p><strong>Aircraft:</strong> ${accident.aircraftType} <a href="${aircraftRegistrationUrl}" target="_blank" class="popup-link">(${accident.aircraftRegistration})</a></p>
              <p><strong>Route:</strong> ${accident.departureAirportCity}, ${accident.departureAirportCountry} <a href="${departureAirportUrl}" target="_blank" class="popup-link">(${accident.departureAirportIcao})</a> to ${accident.destinationAirportCity}, ${accident.destinationAirportCountry} <a href="${destinationAirportUrl}" target="_blank" class="popup-link">(${accident.destinationAirportIcao})</a></p>
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

  private clearMap(): void {
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });
  }
}
