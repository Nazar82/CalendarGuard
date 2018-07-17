import {Injectable} from '@angular/core';

import {User} from '../models/user';

@Injectable()

export class SortUsersService {

    constructor() {
    }

    /**
     * Orders users on name, request reason or request date
     * @param users {array}
     * @param sortBy {string}
     * @param ascendingOrder {boolean}
     * @return users {array}
     */
    sortUsers(users: User[], sortBy: string, ascendingOrder: boolean): User[] {
        if (sortBy === 'username') {
            return users.sort((a, b) => {
                if (ascendingOrder) {
                    return a[sortBy].localeCompare(b[sortBy]);
                }
                return b[sortBy].localeCompare(a[sortBy]);
            });
        }

        if (sortBy === 'reason') {
            return users.sort((a, b) => {
                if (ascendingOrder) {
                    return a.request[sortBy].localeCompare(b.request[sortBy]);
                }
                return b.request[sortBy].localeCompare(a.request[sortBy]);
            });
        }

        if (sortBy === 'requestDate') {
            return users.sort((a, b) => {
                if (ascendingOrder) {
                    return +new Date(a.request[sortBy]) - +new Date(b.request[sortBy]);
                }
                return +new Date(b.request[sortBy]) - +new Date(a.request[sortBy]);
            });
        }
    }
}

