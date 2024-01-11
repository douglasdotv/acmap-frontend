import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { Accident } from '../models/accident';
import { SearchForm } from '../models/search-form';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AccidentService {
  private readonly API_URL = environment.apiUrl;

  private allAccidents: Accident[] = [];

  constructor(private http: HttpClient) {}

  getAllAccidents(): Observable<Accident[]> {
    if (this.allAccidents.length === 0) {
      return this.http.get<Accident[]>(this.API_URL + '/accidents').pipe(
        tap(accidents => this.allAccidents = accidents)
      );
    } else {
      return of(this.allAccidents);
    }
  }

  getOperators(): Observable<string[]> {
    return this.http.get<string[]>(this.API_URL + '/accidents/operators');
  }

  getAircraftTypes(): Observable<string[]> {
    return this.http.get<string[]>(this.API_URL + '/accidents/aircraft-types');
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(this.API_URL + '/accidents/categories');
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
