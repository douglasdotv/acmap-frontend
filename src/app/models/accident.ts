import { AccidentResource } from "./accident-resource";
import { Airport } from "./airport";
import { Stopover } from "./stopover";

export interface Accident {
  date: string;
  operator: string;
  flightNumber: string;
  aircraftType: string;
  aircraftRegistration: string;
  occupants: number;
  fatalities: number;
  location: string;
  latitude: number;
  longitude: number;
  country: string;
  departureAirport: Airport,
  destinationAirport: Airport,
  flightPhase: string;
  description: string;
  isDisputed: boolean;
  categories: string[];
  resources: AccidentResource[];
  stopovers: Stopover[];
}
