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
    accidents.forEach((accident) => {
      const marker = L.marker([accident.latitude, accident.longitude]);
      marker.bindPopup(this.createPopupContent(accident));
      marker.addTo(this.map);
    });
  }

  private createPopupContent(accident: Accident): string {
    return `
      <p>${accident.flightNumber}</p>
    `;
  }
}
