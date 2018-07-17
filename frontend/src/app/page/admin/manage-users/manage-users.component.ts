import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';

import {ApproveListComponent} from '../approve-list/approve-list.component';

@Component({
    selector: 'app-manage-users',
    templateUrl: './manage-users.component.html',
    styleUrls: ['./manage-users.component.css']
})

export class ManageUsersComponent extends ApproveListComponent implements OnInit {

    selectRoleForm: FormGroup;
    roles = ['admin', 'user'];

    /**
     * Creates reactive form for selecting user role
     */
    createSelectRoleForm(): void {
        this.selectRoleForm = new FormGroup({
            role: new FormControl('')
        });
    }

    ngOnInit() {
        this.onGetUsers();
        this.createSearchUserForm();
        this.createSelectRoleForm();
    }
}
