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
    this.accidentService.accidents$.subscribe({
      next: () => {
        this.loadDropdownData();
      },
      error: (err) => console.error(err),
    });
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
    this.operators = this.accidentService.getOperators();
    this.aircraftTypes = this.accidentService.getAircraftTypes();
    this.accidentCategories = this.accidentService.getCategories();
  }

  onSearch(): void {
    if (this.searchForm.value.fatalities < 0) {
      window.alert('Fatalities must be a non-negative number.');
      return;
    }

    if (this.searchForm.valid) {
      const form = this.searchForm.value;
      const filteredAccidents = this.accidentService.filterAccidents(form);
      this.mapDataService.updateAccidents(filteredAccidents);
    }
  }

  onReset(): void {
    this.mapDataService.resetMapZoom();
    this.searchForm.reset({
      fatalities: '',
      operator: '',
      aircraftType: '',
      accidentCategory: ''
    });
    this.onSearch();
  }
}
