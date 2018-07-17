import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {Router} from '@angular/router';

import {AuthService} from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;

    constructor(
        private router: Router,
        private authService: AuthService
    ) {
    }

    changeState(user): void {

        // Sets userRoleLink to 'request-role' if there is none
        let userRoleLink = user.roles.__global_roles__[0] ? user.roles.__global_roles__[0] : 'request-role';

        this.router.navigate([`/${userRoleLink}`]);
    }

    /**
     * Creates reactive form for logging
     */
    createLoginForm(): void {
        this.loginForm = new FormGroup({
            'userName': new FormControl(null, Validators.required),
            'userPassword': new FormControl(null, Validators.required)
        });
    }

    isDisabledLoginButton(): boolean {
        return !this.loginForm.valid;
    }

    isFormValid(formControl): boolean {
        return !this.loginForm.get(formControl).valid && this.loginForm.get(formControl).touched;
    }

    onLogin(): void {
        let user = {
            name: this.loginForm.value.userName,
            password: this.loginForm.value.userPassword
        };

        this.authService.login(user).subscribe(
            (loggedUser) => {
                this.authService.setCurrentUserData(loggedUser.username, loggedUser._id);
                this.changeState(loggedUser);
            },
            (err: HttpErrorResponse) => {
                if (err.status === 401) {
                    alert(err.error.message);
                    console.error(err.error.message);
                } else {
                    console.error(err.message);
                }
            });

    }

    ngOnInit() {
        this.createLoginForm();
    }
}
