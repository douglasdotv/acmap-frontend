import { Accident } from '../../models/accident';
import { AccidentResource } from '../../models/accident-resource';
import { Stopover } from '../../models/stopover';

export class PopupContentBuilder {
  private static readonly AIRLINERS_URL =
    'https://www.airliners.net/search?keywords=';
  private static readonly FLIGHTRADAR_URL =
    'https://www.flightradar24.com/data/airports/';

  static buildPopupContent(accident: Accident): string {
    const popupTitle = this.getOperatorWithFlightNumber(accident);
    const formattedAccidentDate = this.getFormattedDate(accident.date);
    const accidentCategories = this.getAccidentCategories(accident.categories);
    const disputedText = accident.isDisputed ? ' (disputed)' : '';
    const aircraftRegistrationUrl =
      this.AIRLINERS_URL + accident.aircraftRegistration;
    const routeHtml = this.getRouteHtml(accident);
    const resourceLinksHtml = this.getResourceLinksHtml(accident.resources);

    return `<div class="popup-content">
                <p class="popup-title">${popupTitle}</p>
                <p><strong>Date:</strong> ${formattedAccidentDate}</p>
                <p><strong>Location:</strong> ${accident.location} (${accident.country})</p>
                <p><strong>Occupants:</strong> ${accident.occupants}</p>
                <p><strong>Fatalities:</strong> ${accident.fatalities}</p>
                <p><strong>Aircraft:</strong> ${accident.aircraftType} (<a href="${aircraftRegistrationUrl}" target="_blank" class="popup-link">${accident.aircraftRegistration}</a>)</p>
                <p><strong>Route:</strong> ${routeHtml}</p>
                <p><strong>Flight Phase:</strong> ${accident.flightPhase}</p>
                <p><strong>Summary:</strong> ${accidentCategories}${disputedText}</p>
                <p><strong>Description:</strong> ${accident.description}</p>
                <p><strong>Resources:</strong><br>${resourceLinksHtml}</p>
              </div>`;
  }

  private static getOperatorWithFlightNumber(accident: Accident): string {
    const fnregex = /\d+/;
    const fnmatch = fnregex.exec(accident.flightNumber);
    const flightNumber = fnmatch ? fnmatch[0] : '';
    return flightNumber
      ? `${accident.operator} Flight ${flightNumber}`
      : accident.operator;
  }

  private static getFormattedDate(date: string): string {
    const accidentDate = new Date(date + 'T00:00:00');
    return accidentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private static getAccidentCategories(categories: string[]): string {
    categories.sort((a, b) => a.localeCompare(b));
    return categories
      .map((category, index) =>
        index === 0 ? category : category.toLowerCase()
      )
      .join(', ');
  }

  private static getRouteHtml(accident: Accident): string {
    const departureAirportUrl =
      this.FLIGHTRADAR_URL + accident.departureAirport.iataCode.toLowerCase();
    const destinationAirportUrl =
      this.FLIGHTRADAR_URL + accident.destinationAirport.iataCode.toLowerCase();
    const stopoversHtml = this.createStopoversHtml(accident.stopovers);

    return `${accident.departureAirport.city}, ${accident.departureAirport.country} (<a href="${departureAirportUrl}" target="_blank" class="popup-link">${accident.departureAirport.icaoCode}</a>) to ${accident.destinationAirport.city}, ${accident.destinationAirport.country} (<a href="${destinationAirportUrl}" target="_blank" class="popup-link">${accident.destinationAirport.icaoCode}</a>)<br>${stopoversHtml}`;
  }

  private static getResourceLinksHtml(resources: AccidentResource[]): string {
    return resources
      .map(
        (resource) =>
          `<a href="${resource.url}" target="_blank" class="popup-link">${resource.description}</a>`
      )
      .join('<br>');
  }

  private static createStopoversHtml(stopovers: Stopover[]): string {
    if (stopovers.length === 0) {
      return '';
    }

    return (
      '(via ' +
      stopovers
        .map((stopover, index, array) => {
          const isLast = index === array.length - 1;
          let prefix = '';
          if (index !== 0) {
            prefix = isLast ? ' and ' : ', ';
          }
          return `${prefix}${stopover.airport.city} (<a href="${this.FLIGHTRADAR_URL}${stopover.airport.iataCode}" target="_blank" class="popup-link">${stopover.airport.icaoCode}</a>)`;
        })
        .join('') +
      ')'
    );
  }
}
