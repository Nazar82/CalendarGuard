import {Component, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';

import {Subscription} from 'rxjs/internal/Subscription';

import {User} from '../../../models/user';

import {DomService} from '../../../services/dom.service';
import {ModalService} from '../../../services/modal.service';
import {SortUsersService} from '../../../services/sort-users.service';
import {UserService} from '../../../services/user.service';


@Component({
    selector: 'app-approve-list',
    templateUrl: './approve-list.component.html',
    styleUrls: ['./approve-list.component.css']
})
export class ApproveListComponent implements OnInit {

    // Container for modal
    @ViewChild('dynamicModal', {read: ViewContainerRef}) modalContainer;

    ascendingOrder = false;
    modalOpened = false;
    searchUserForm: FormGroup;
    sortBy = '';
    users: User[] = [];

    constructor(
        private userService: UserService,
        private sortUsersService: SortUsersService,
        private domService: DomService,
        private modalService: ModalService
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
    onGetUsers() {
        this.userService.getUsers('wait-role').subscribe(
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
    onDeleteUser(userId) {
        console.log('User deleted!');
        // this.userService.deleteUser(userId).subscribe(
        //     () => {
        //         this.onGetUsers();
        //     },
        //     (err: HttpErrorResponse) => {
        //         console.error(err.message);
        //
        //     }
        // )
    }

    /**
     * Opens modal on click to delete user
     * @param userId {string}
     * @param username {string}
     */
    openModal(userId, username) {
        let modalText = `Are you sure you want to remove ${username} from the database?`;

        this.modalService.setModalText(modalText);
        this.domService.createModal(this.modalContainer);

        let subscription: Subscription = this.modalService.delete.subscribe(
            (confirm) => {

                // Removes user from database if user confirms deletion
                if (confirm) {
                    this.onDeleteUser(userId);
                }

                // Closes modal and unsubscribes from Behaviour Object
                if (this.modalOpened) {
                    this.domService.closeModal(this.modalContainer);
                    subscription.unsubscribe();

                    this.modalOpened = false;
                }
            },
            (err) => {
                console.error(`Error occurred: ${err}.`);
            }
        );

        this.modalOpened = true;
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
     * @return css class {string}
     */
    toggleCaret() {
        return this.ascendingOrder ? 'fa fa-caret-down' : 'fa fa-caret-up';
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
                this.onGetUsers();
                console.log(this.users);
            },
            (err: HttpErrorResponse) => {
                console.error(err.message);
            }
        );
    }

    ngOnInit() {
        this.createSearchUserForm();
        this.onGetUsers();
    }
}
