import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()

export class UserService {

    constructor(private http: HttpClient
    ) {
    }

    /**
     * Downloads users from database
     * @param roles {array}
     * @return Observable
     */
    getUsers(roles): Observable<any> {
        let params = new HttpParams().set('firstRole', roles[0]).set('secondRole', roles[1]);

        return this.http.get('http://localhost:3000/api/users', {params});
    }

    /**
     * Removes user from date in data base
     * @param userId {string}
     * @return Observable
     */
    deleteUser(userId: string): Observable<any> {
        return this.http.delete(`http://localhost:3000/api/delete-user/${userId}`);
    }

    /**
     * Inserts request reason, request date and 'wait-role' to user document in database
     * @param request {object}
     * @param userId {string}
     * @return Observable
     */
    sendRequest(request: object, userId: string): Observable<any> {
        return this.http.put(`http://localhost:3000/api/request-role/user/${userId}`, request);
    }

    /**
     * Sets user role
     * @param userId {string}
     * @param role {string}
     * @return Observable
     */
    setUserRole(role: object, userId: string): Observable<any> {
        return this.http.put(`http://localhost:3000/api/set-role/user/${userId}`, role);
    }
}
