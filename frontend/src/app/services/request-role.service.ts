import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';


@Injectable()

export class RequestRoleService {
    constructor(private http: HttpClient) {
    }

    sendRequest(userDara: Object): Observable<any> {
        return this.http.put('http://localhost:3000/auth/request-role', userDara);
    }

}