import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

    currentUserName: string;

    constructor(
        private authService: AuthService
    ) {
    }

    onLogout(): void {
        this.authService.logout();
    }

    /**
     * Sets current user name after user is logged in
     */
    setCurrentUserName(): void {
        this.authService.currentUserName.subscribe(
            username => {
                this.currentUserName = username;
            },
            (err) => {
                console.error(`Error occurred: ${err}`);
            });
    }

    ngOnInit() {
        this.setCurrentUserName();
    }

}
