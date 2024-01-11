import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccidentService } from '../../services/accident.service';
import { CommonModule } from '@angular/common';
import { MapDataService } from '../../services/map-data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  searchForm!: FormGroup;

  operators: string[] = [];
  aircraftTypes: string[] = [];
  accidentCategories: string[] = [];

  constructor(private fb: FormBuilder, private accidentService: AccidentService, private mapDataService: MapDataService) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      fatalities: ['', [Validators.min(0)]],
      operator: [''],
      aircraftType: [''],
      accidentCategory: [''],
    });
  }

  private loadDropdownData(): void {
    this.fetchOperators();
    this.fetchAircraftTypes();
    this.fetchCategories();
  }

  private fetchOperators(): void {
    this.accidentService.getOperators().subscribe({
      next: (operators) => {
        this.operators = operators;
      },
      error: (err) => console.error(err),
    });
  }

  private fetchAircraftTypes(): void {
    this.accidentService.getAircraftTypes().subscribe({
      next: (aircraftTypes) => {
        this.aircraftTypes = aircraftTypes;
      },
      error: (err) => console.error(err),
    });
  }

  private fetchCategories(): void {
    this.accidentService.getCategories().subscribe({
      next: (categories) => {
        this.accidentCategories = categories;
      },
      error: (err) => console.error(err),
    });
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const form = this.searchForm.value;
      const filteredAccidents = this.accidentService.filterAccidents(form);
      this.mapDataService.updateAccidents(filteredAccidents);
    }
  }
}
