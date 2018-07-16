import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {HttpErrorResponse} from "@angular/common/http";

import {User} from "../../../models/user";

import {SortUsersService} from "../../../services/sort-users.service";
import {UserService} from "../../../services/user.service";

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
    ascendingOrder = false;
    sortBy = '';
    searchUserForm: FormGroup;
    users: User[] = [];

  constructor(
      private userService: UserService,
      private sortUsersService: SortUsersService
  ) { }

    /**
     * Creates reactive form for searching the user
     */
    createSearchUserForm(): void {
        this.searchUserForm = new FormGroup({
            'userName': new FormControl('')
        });
    }

    /**
     * Downloads users from database
     */
    onGetUsers() {
        this.userService.getUsers('user', 'admin').subscribe(
            (users: User[]) => {
                this.users = users;
                console.log(this.users);
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
        this.userService.deleteUser(userId).subscribe(
            () => {
                this.onGetUsers();
            },
            (err: HttpErrorResponse) => {
                console.error(err.message);
            }
        )
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
     * Displays caret on the table column which was sorted
     * @param sortBy {string}
     * @return boolean
     */
    showCaret(sortBy: string): boolean {
        return sortBy === this.sortBy;
    }

    /**
     * Toggles caret up and down depending on ascending or descending order
     * @return css class {string}
     */
    toggleCaret(): string {
        return this.ascendingOrder ? 'fa fa-caret-down' : 'fa fa-caret-up';
    }

  ngOnInit() {
        this.onGetUsers();
        this.createSearchUserForm();
  }
}
