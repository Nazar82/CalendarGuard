import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {LoginComponent} from '../page/login/login.component';
import {RequestRoleComponent} from '../page/request-role/request-role.component';
import {WaitRoleComponent} from '../page/wait-role/wait-role.component';
import {MasterComponent} from '../page/admin/master/master.component';
import {ApproveListComponent} from '../page/admin/approve-list/approve-list.component';
import {ManageUsersComponent} from '../page/admin/manage-users/manage-users.component';
import {ManageLocationsComponent} from '../page/admin/manage-locations/manage-locations.component';
import {ManageDevicesComponent} from '../page/admin/manage-devices/manage-devices.component';
import {SettingsComponent} from '../page/admin/settings/settings.component';
import {LogsComponent} from '../page/admin/logs/logs.component';

const appRoutes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'request-role', component: RequestRoleComponent},
    {path: 'wait-role', component: WaitRoleComponent},
    {
        path: 'admin', component: MasterComponent,
        children: [
            {
                path: '', redirectTo: '/admin/approve-list', pathMatch: 'full'
            },
            {
                path: 'approve-list', component: ApproveListComponent
            },
            {
                path: 'manage-users', component: ManageUsersComponent
            },
            {
                path: 'manage-locations', component: ManageLocationsComponent
            },
            {
                path: 'manage-devices', component: ManageDevicesComponent
            },
            {
                path: 'settings', component: SettingsComponent
            },
            {
                path: 'logs', component: LogsComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})

export class AppRoutingModule {
}
