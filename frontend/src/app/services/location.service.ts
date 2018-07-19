import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable} from 'rxjs';

import {Location} from '../models/location';

@Injectable()

export class LocationService {

    constructor(
        private http: HttpClient
    ) {

    }

    /**
     * Adds new location to database
     * @param location {object}
     * @return Observable
     */
    addLocation(location: Location): Observable<any> {
        return this.http.post('http://localhost:3000/api/locations', location);
    }

    /**
     * Removes location from database
     * @param locationId {string}
     * @return Observable
     */
    deleteLocation(locationId: string): Observable<any> {
        return this.http.delete(`http://localhost:3000/api/locations/${locationId}`);
    }

    /**
     * Downloads locations from database
     * @return Observable
     */
    getLocations(): Observable<any> {
        return this.http.get('http://localhost:3000/api/locations');
    }

    /**
     * Sets user to location
     * @param userId {string}
     * @param locationId {string}
     * @return Observable
     */
    setUserToLocation(userId: string, locationId: string): Observable<any> {
        let data = {
            userId
        };

        return this.http.put(`http://localhost:3000/api/locations/${locationId}`, data);
    }
}
