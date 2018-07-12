import {Pipe, PipeTransform} from '@angular/core';

import {User} from "../../models/user";

@Pipe({
    name: 'filterUsers'
})
export class FilterUsersPipe implements PipeTransform {

    /**
     * Filters users on user input
     * @param users {array}
     * @param queryString {string}
     * @return users {array}
     */
    transform(users: User[], queryString: string): User[] {
        if (users.length && queryString) {
            return users.filter(user => user.username.includes(queryString));
        }
        return users;
    }

}
