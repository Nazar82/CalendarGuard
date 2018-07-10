import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {LoginComponent} from '../page/login/login.component';
import {RequestRoleComponent} from "../page/request-role/request-role.component";
import {WaitRoleComponent} from "../page/wait-role/wait-role.component";


const appRoutes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'request-role', component: RequestRoleComponent},
    {path: 'wait-role', component: WaitRoleComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})

export class AppRoutingModule {
}