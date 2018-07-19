import {Component, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';

import {Location} from '../../../models/location';
import {User} from "../../../models/user";

import {DomService} from '../../../services/dom.service';
import {LocationService} from "../../../services/location.service";
import {ModalService} from '../../../services/modal.service';
import {Subscription} from "rxjs/internal/Subscription";
import {UserService} from "../../../services/user.service";

@Component({
    selector: 'app-manage-locations',
    templateUrl: './manage-locations.component.html',
    styleUrls: ['./manage-locations.component.css']
})

export class ManageLocationsComponent implements OnInit {
    addLocationForm: FormGroup;
    locations = [];
    modalOpened = false;
    roles = ['admin', 'user'];
    selectUserForms: FormGroup[] = [];
    searchLocationForm: FormGroup;
    users: User[] = [];
    defaultSelected = 'No user assigned';

    constructor(
        private domService: DomService,
        private modalService: ModalService,
        private locationService: LocationService,
        private userService: UserService
    ) {
    }

    // Container for modal
    @ViewChild('dynamicModal', {read: ViewContainerRef}) modalContainer;

    /**
     * Creates reactive form for adding location
     */
    createAddLocationForm(): void {
        this.addLocationForm = new FormGroup({
            locationName: new FormControl('', [Validators.required, Validators.minLength(3)])
        });
    }

    /**
     * Creates reactive form for searching location
     */
    createSearchLocationForm(): void {
        this.searchLocationForm = new FormGroup({
            location: new FormControl('')
        });
    }

    /**
     * Creates reactive forms for assigning user to location
     */
    createSelectUserForms(): void {
        this.selectUserForms = [];

        this.locations.forEach((location) => {
            let form = new FormGroup({
                userId: new FormControl(location.assignedUser)
            });

            this.selectUserForms.push(form);
        });
    }

    /**
     * Disables add button in form is invalid
     * @return boolean
     */
    isDisabledAddButton(): boolean {
        return !this.addLocationForm.valid;
    }

    /**
     * Checks if location name is valid
     * @return boolean
     */
    isLocationNameValid(): boolean {
        return !this.addLocationForm.get('locationName').valid && this.addLocationForm.get('locationName').touched
            && this.addLocationForm.value.locationName.length !== 0;
    }

    /**
     *Adds new location to database
     */
    onAddLocation(): void {
        let location: Location = new Location(
            '',
            this.addLocationForm.value.locationName.toUpperCase()
        );

        this.locationService.addLocation(location).subscribe(
            (response) => {
                if(response.success) {
                    this.onGetLocations();
                } else {
                    this.modalService.setModalText(response.message);
                    this.domService.createModal2(this.modalContainer);
                    let subscription: Subscription = this.modalService.delete.subscribe(
                        (confirm) => {

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
            },
            (err: HttpErrorResponse) => {
                console.error(`Error occurred: ${err.error.message}`);
            });
        this.addLocationForm.reset({locationName: ''});
    }

    /**
     *Removes location from database
     * @param: locationId {string}
     */
    onDeleteLocation(locationId: string): void {
        this.locationService.deleteLocation(locationId).subscribe(
            () => {
                this.onGetLocations();
            },
            (err: HttpErrorResponse) => {
                console.error(`Error occurred: ${err.message}`);
            }
        )
    };

    /**
     *Downloads locations from database
     */
    onGetLocations() {
        this.locationService.getLocations().subscribe(
            (locations) => {
                this.locations = locations;
                this.createSelectUserForms();
            },
            (err: HttpErrorResponse) => {
                console.error(`Error occurred: ${err.message}`);
            });
    }

    /**
     *Downloads users from database
     */
    onGetUsers() {
        this.userService.getUsers(this.roles).subscribe(
            (users) => {
                this.users = users;
            },
            (err: HttpErrorResponse) => {
                console.error(`Error occurred: ${err.message}`);
            });
    }

    /**
     * Opens modal on click to delete location
     * @param locationName {string}
     * @param locationId {string}
     */
    openModal(locationName: string, locationId: string) {
        let modalText = `Are you sure you want to remove ${locationName} from the database?`;

        this.modalService.setModalText(modalText);
        this.domService.createModal(this.modalContainer);

        let subscription: Subscription = this.modalService.delete.subscribe(
            (confirm) => {

                // Removes location from database if user confirms deletion
                if (confirm) {
                    this.onDeleteLocation(locationId);
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
     * Sets user to location
     * @param userId {string}
     * @param locationId {string}
     */
    onSetUser(userId: string, locationId: string) {
        this.locationService.setUserToLocation(userId, locationId).subscribe(
            () => {
            },
            (err: HttpErrorResponse) => {
                console.error(`Error occurred: ${err.message}`);
            });
    }

    ngOnInit() {
        this.createAddLocationForm();
        this.createSearchLocationForm();
        this.onGetLocations();
        this.onGetUsers();
    }
}
