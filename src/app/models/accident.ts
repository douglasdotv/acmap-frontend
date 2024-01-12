import { AccidentResource } from "./accident-resource";

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
  departureAirportIcao: string;
  departureAirportCity: string;
  departureAirportCountry: string;
  destinationAirportIcao: string;
  destinationAirportCity: string;
  destinationAirportCountry: string;
  flightPhase: string;
  description: string;
  isDisputed: boolean;
  categories: string[];
  resources: AccidentResource[];
}
