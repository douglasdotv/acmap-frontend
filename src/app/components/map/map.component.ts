import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Accident } from '../../models/accident';
import { AccidentService } from '../../services/accident.service';
import { MapDataService } from '../../services/map-data.service';
import { MarkerClusterGroup } from 'leaflet';
import { LoadingService } from '../../services/loading.service';
import { PopupContentBuilder } from './popup-content-builder';

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
      marker.bindPopup(PopupContentBuilder.buildPopupContent(accident));
      marker.on('mouseover', () => marker.openPopup());
      this.markers.addLayer(marker);
    });

    this.map.addLayer(this.markers);
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
