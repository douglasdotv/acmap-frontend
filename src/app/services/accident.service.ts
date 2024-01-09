import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Accident } from '../models/accident';
import { SearchForm } from '../models/search-form';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AccidentService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllAccidents(): Observable<Accident[]> {
    return this.http.get<Accident[]>(this.API_URL + '/accidents');
  }

  searchAccidents(form: SearchForm): Observable<Accident[]> {
    return this.http.post<Accident[]>(this.API_URL + '/accidents/search', form);
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
}
