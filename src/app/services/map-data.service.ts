import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Accident } from '../models/accident';

@Injectable({
  providedIn: 'root'
})
export class MapDataService {
  private accidentSource: BehaviorSubject<Accident[]> = new BehaviorSubject<Accident[]>([]);
  currentAccidents: Observable<Accident[]> = this.accidentSource.asObservable();

  updateAccidents(accidents: Accident[]): void {
    this.accidentSource.next(accidents);
  }
}
