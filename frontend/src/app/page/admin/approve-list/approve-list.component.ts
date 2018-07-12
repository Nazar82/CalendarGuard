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
        this.userService.getUsersToSetRoles().subscribe(
            (users: User[]) => {
                this.users = users;
            },
            (err: HttpErrorResponse) => {
                console.error(err.message);
            });
    }

    /**
     * Declines user request, deletes 'wait-role' in user __global-roles__, request reason and request date in data base
     * @param userId {string}
     */
    onDeclineUserRequest(userId: string) {
        this.userService.declineUserRequest(userId).subscribe(
            () => {
                this.getUsers();
            },
            (err: HttpErrorResponse) => {
                console.error(err.message);

            }
        )
    }

    /**
     * Displays caret on the table column which was sorted
     * @param sortBy {string}
     * @return boolean
     */
    showCaret(sortBy: string) {
        return sortBy === this.sortBy;
    }

    /**
     * Toggles caret up and down depending on ascending or descending order
     */
    toggleCaret() {
        return this.ascendingOrder ? "fa fa-caret-down" : "fa fa-caret-up";
    }

    /**
     * Sorts users on name, request reason or request date
     * @param sortBy {string}
     */
    onSortUsers(sortBy: string) {
        this.users = this.sortUsersService.sortUsers(this.users, sortBy, this.ascendingOrder);
        this.ascendingOrder = !this.ascendingOrder;
        this.sortBy = sortBy;
    }

    /**
     * Sets user role
     * @param userId {string}
     * @param role {string}
     */
    onSetUserRole(userId: string, role: string) {

        let userRole = {
            role: role
        };

        this.userService.setUserRole(userRole, userId).subscribe(
            (user) => {
                console.log(user);
                this.getUsers();
                console.log(this.users);
            },
            (err: HttpErrorResponse) => {
                console.error(err.message);
            }
        );
    }

    ngOnInit() {

        this.createSearchUserForm();
        this.getUsers();

    }

}
