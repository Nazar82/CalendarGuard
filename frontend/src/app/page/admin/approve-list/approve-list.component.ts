import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {HttpErrorResponse} from "@angular/common/http";

import {UserService} from "../../../services/user.service";
import {User} from "../../../models/user";
import {SortUsersService} from "../../../services/sort-users.service";


@Component({
    selector: 'app-approve-list',
    templateUrl: './approve-list.component.html',
    styleUrls: ['./approve-list.component.css']
})
export class ApproveListComponent implements OnInit {

    ascendingOrder = false;
    sortBy = '';
    searchUserForm: FormGroup;
    users: User[] = [];

    constructor(
        private userService: UserService,
        private sortUsersService: SortUsersService
    ) {
    }

    /**
     * Creates reactive form for searching the user
     */
    createSearchUserForm(): void {
        this.searchUserForm = new FormGroup({
            'userName': new FormControl('')
        });
    }

    /**
     * Downloads users from database whose roles to be set
     */
    getUsers(): void {
        this.userService.getUsersToBeApproved().subscribe(
            (users: User[]) => {
                this.users = users;
            },
            (err: HttpErrorResponse) => {
                    console.error(err.message);
            });
    }

    /**
     * Displays caret on the table column which was sorted
     * @param sortBy
     */
    showCaret(sortBy) {
        return sortBy === this.sortBy;
    }

    /**
     * Toggles caret up and down depending on ascending or descending order
     */
    toggleCaret() {
        return this.ascendingOrder ? "fa fa-caret-down" : "fa fa-caret-up";
    }

    /**
     * Orders users on name, request reason or request date
     * @param sortBy
     */
    onSortUsers(sortBy) {
        this.users = this.sortUsersService.sortUsers(this.users, sortBy, this.ascendingOrder);
        this.ascendingOrder = !this.ascendingOrder;
        this.sortBy = sortBy;
    }

    ngOnInit() {

        this.createSearchUserForm();
        this.getUsers();

    }

}
