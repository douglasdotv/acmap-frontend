import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Accident } from '../model/accident';

@Injectable({
  providedIn: 'root',
})
export class AccidentService {
  private readonly API_URL = 'http://localhost:8080/api/accidents';

  constructor(private http: HttpClient) {}

  getAllAccidents(): Observable<Accident[]> {
    return this.http.get<Accident[]>(this.API_URL);
  }
}