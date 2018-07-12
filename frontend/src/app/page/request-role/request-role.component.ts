import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";

import {AuthService} from "../../services/auth.service";
import {UserService} from "../../services/user.service";

import {HttpErrorResponse} from "@angular/common/http";
import {Router} from "@angular/router";

@Component({
    selector: 'app-request-role',
    templateUrl: './request-role.component.html',
    styleUrls: ['./request-role.component.css']
})

export class RequestRoleComponent implements OnInit {
    requestRoleForm: FormGroup;

    constructor(
        private authService: AuthService,
        private requestRoleService: UserService,
        private router: Router
    ) {
    }

    changeState(user) {

        // Set userRole to 'request-role' if there is none
        let userRole = user.roles.__global_roles__[0] ? user.roles.__global_roles__[0] : 'request-role';
        this.router.navigate([`/${userRole}`]);
    }

    /**
     * Creates reactive form
     */
    createRequestForm(): void {
        this.requestRoleForm = new FormGroup({
            'reason': new FormControl(null, Validators.required)
        });
    }

    /**
     * Inserts request reason, request date and 'wait-role' to user document in database
     */
    onSendRequest(): void {
        let userId;

        // Sets id of the current user
        this.authService.currentUserId.subscribe(
            id => {
                userId = id;
            },
            (err) => {
                console.error(`Error occurred: ${err}`);
            });

        let reason = {
            reason: this.requestRoleForm.value.reason
        };

        this.requestRoleService.sendRequest(reason, userId).subscribe(
            user => {
                this.changeState(user);
            },
            (err: HttpErrorResponse) => {
                console.dir(err);
                console.error(`Error occurred: ${err.message}`);
            });
    }

    ngOnInit() {
        this.createRequestForm();
    }
}
