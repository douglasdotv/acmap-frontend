import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { Accident } from '../models/accident';
import { SearchForm } from '../models/search-form';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AccidentService {
  private readonly API_URL = environment.apiUrl;
  private allAccidents: Accident[] = [];
  private accidentsSubject: BehaviorSubject<Accident[]> = new BehaviorSubject<Accident[]>([]);
  accidents$: Observable<Accident[]> = this.accidentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllAccidents(): Observable<Accident[]> {
    if (this.allAccidents.length === 0) {
      return this.http.get<Accident[]>(this.API_URL + '/accidents').pipe(
        tap(accidents => {
          this.allAccidents = accidents;
          this.accidentsSubject.next(accidents);
        })
      );
    } else {
      this.accidentsSubject.next(this.allAccidents);
      return of(this.allAccidents);
    }
  }

  getOperators(): string[] {
    const uniqueOperators = [...new Set(this.allAccidents.map(accident => accident.operator))];
    return uniqueOperators.sort((a, b) => a.localeCompare(b));
  }

  getAircraftTypes(): string[] {
    const uniqueAircraftTypes = [...new Set(this.allAccidents.map(accident => accident.aircraftType))];
    return uniqueAircraftTypes.sort((a, b) => a.localeCompare(b));
  }

  getCategories(): string[] {
    const categories = this.allAccidents.flatMap(accident => accident.categories);
    const uniqueCategories = [...new Set(categories)];
    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }

  filterAccidents(form: SearchForm): Accident[] {
    return this.allAccidents.filter(accident => {
      return (!form.fatalities || accident.fatalities >= form.fatalities) &&
             (!form.operator || accident.operator === form.operator) &&
             (!form.aircraftType || accident.aircraftType.includes(form.aircraftType)) &&
             (!form.accidentCategory || accident.categories.includes(form.accidentCategory));
    });
  }  
}
