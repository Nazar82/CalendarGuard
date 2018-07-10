import {BrowserModule} from '@angular/platform-browser';
import {ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './routing/app.routing.module';

import {AppComponent} from './page/main/app.component';
import {LoginComponent} from './page/login/login.component';
import { RequestRoleComponent } from './page/request-role/request-role.component';
import { WaitRoleComponent } from './page/wait-role/wait-role.component'

import {AuthService} from './services/auth.service';
import {RequestRoleService} from "./services/request-role.service";
import { HeaderComponent } from './page/header/header.component';
import { ApproveListComponent } from './page/admin/approve-list/approve-list.component';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        RequestRoleComponent,
        WaitRoleComponent,
        HeaderComponent,
        ApproveListComponent,
    ],
    imports: [
        AppRoutingModule, BrowserModule, HttpClientModule, ReactiveFormsModule
    ],
    providers: [AuthService, RequestRoleService],
    bootstrap: [AppComponent]
})

export class AppModule {
}
