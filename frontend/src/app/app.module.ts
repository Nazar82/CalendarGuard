import {BrowserModule} from '@angular/platform-browser';
import {ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './routing/app.routing.module';

import {AppComponent} from './page/main/app.component';
import {LoginComponent} from './page/login/login.component';
import { RequestRoleComponent } from './page/request-role/request-role.component';
import { WaitRoleComponent } from './page/wait-role/wait-role.component';

import {AuthService} from './services/auth.service';
import {UserService} from './services/user.service';
import { HeaderComponent } from './page/header/header.component';
import { ApproveListComponent } from './page/admin/approve-list/approve-list.component';
import { MasterComponent } from './page/admin/master/master.component';
import { ManageUsersComponent } from './page/admin/manage-users/manage-users.component';
import { ManageLocationsComponent } from './page/admin/manage-locations/manage-locations.component';
import { ManageDevicesComponent } from './page/admin/manage-devices/manage-devices.component';
import { SettingsComponent } from './page/admin/settings/settings.component';
import { LogsComponent } from './page/admin/logs/logs.component';
import { FilterUsersPipe } from './pipes/filter-users/filter-users.pipe';
import {SortUsersService} from './services/sort-users.service';
import {DomService} from './services/dom.service';
import { ModalComponent } from './page/modal/modal.component';
import {ModalService} from './services/modal.service';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        RequestRoleComponent,
        WaitRoleComponent,
        HeaderComponent,
        ApproveListComponent,
        MasterComponent,
        ManageUsersComponent,
        ManageLocationsComponent,
        ManageDevicesComponent,
        SettingsComponent,
        LogsComponent,
        FilterUsersPipe,
        ModalComponent,
    ],
    imports: [
        AppRoutingModule, BrowserModule, HttpClientModule, ReactiveFormsModule
    ],
    providers: [AuthService, DomService, ModalService, UserService, SortUsersService],
    bootstrap: [AppComponent],
    entryComponents: [ModalComponent]
})

export class AppModule {
}
