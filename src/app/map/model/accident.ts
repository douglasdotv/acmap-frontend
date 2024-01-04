export interface Accident {
  date: string;
  operator: string;
  flightNumber: string;
  aircraftModel: string;
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
  disputed: boolean;
  categories: string[];
}
