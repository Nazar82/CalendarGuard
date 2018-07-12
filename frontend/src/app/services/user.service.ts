import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';


@Injectable()

export class UserService {
    constructor(private http: HttpClient) {
    }

    /**
     * Downloads users from database whose roles to be set
     */
    getUsersToSetRoles(): Observable<any> {
        return this.http.get('http://localhost:3000/api/users');
    }

    /**
     * Declines user request, deletes 'wait-role' in user __global-roles__, request reason and request date in data base
     * @param userId {string}
     */
    declineUserRequest(userId: string): Observable<any> {
        console.log(userId);
        return this.http.put(`http://localhost:3000/auth/decline-request/user/${userId}`, null);
    }

    /**
     * Inserts request reason, request date and 'wait-role' to user document in database
     * @param request {object}
     * @param userId {string}
     */
    sendRequest(request: object, userId: string): Observable<any> {
        return this.http.put(`http://localhost:3000/auth/request-role/user/${userId}`, request);
    }

    /**
     * Sets user role
     * @param userId {string}
     * @param role {string}
     */
    setUserRole(role: object, userId: string): Observable<any> {
        return this.http.put(`http://localhost:3000/auth/set-role/user/${userId}`, role);
    }

}