import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable, BehaviorSubject} from 'rxjs';

@Injectable()

export class AuthService {
    currentUserName = new BehaviorSubject<string>('');
    currentUserId = new BehaviorSubject<string>('');

    constructor(
        private http: HttpClient) {
    }

    /**
     * Sends request to log in the user
     * @param user
     * @return Observable
     */
    login(user: {}): Observable<any> {
        return this.http.post('http://localhost:3000/auth/login', user);
    }

    /**
     * Emits name and id of the current user
     * @param userName
     * @param userId
     */
    setCurrentUserData(userName, userId): void {
        this.currentUserName.next(userName);
        this.currentUserId.next(userId);
    }

    logout() {
        // return this.http.get('https://gloapis.globallogic.com/00b4300d2d9babnhksuield1faf1b79f3b69/gloapis/login');
    }

}