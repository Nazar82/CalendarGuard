import {Pipe, PipeTransform} from '@angular/core';
import {Location} from "../../models/location";
import {User} from "../../models/user";

@Pipe({
    name: 'filterByInputString'
})
export class FilterByInputStringPipe implements PipeTransform {

    /**
     *  Type guard to check the the type of input objects
     * @param itemToFilter {object}
     * @return boolean
     */
    static isUser(itemToFilter: Location | User): itemToFilter is User {
        return (<User>itemToFilter).username !== undefined;
    }

    /**
     * Filters users on user input
     * @param itemsToFilter {array}
     * @param queryString {string}
     * @return users {array}
     */
    transform(itemsToFilter, queryString: string): { locations: Location[], users: User[] } {
        if (itemsToFilter.length && queryString) {
            if (FilterByInputStringPipe.isUser(itemsToFilter[0])) {
                return itemsToFilter.filter(location => location.username.toLowerCase().includes(queryString.toLowerCase()));
            } else {
                return itemsToFilter.filter(user => user.locationName.toLowerCase().includes(queryString.toLowerCase()));
            }
        }
        return itemsToFilter;
    }
}
