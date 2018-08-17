// Importing modules that proide underlying funtionality such as routing or reactive forms
// These must be added to the imports list below
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'
import {
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';

// Importing all the different pages (components)
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { RapportblattComponent } from './rapportblatt/rapportblatt.component';
import { RegistryComponent } from './registry/registry.component';
import { SettingsComponent } from './settings/settings.component';

// Is used for granting access to certain routes (pages)
import { AuthGuard } from "./auth.guard";

// This is a pipe that allowes to filter out strings that contain the given search term
import { FilterStringsPipe } from './filter-strings.pipe';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        LogoutComponent,
        RapportblattComponent,
        RegistryComponent,
        SettingsComponent,
        FilterStringsPipe
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,

        // Below are all the pages a user is able to access 
        RouterModule.forRoot([
            {
                path: "",
                component: LoginComponent

            },
            {
                path: "registrierung",
                component: RegistryComponent

            },
            {
                path: "logout",
                component: LogoutComponent

            },
            {
                path: "rapportblatt",
                component: RapportblattComponent,
                canActivate: [AuthGuard]
            },
            {
                path: "settings",
                component: SettingsComponent,
                canActivate: [AuthGuard]
            }
        ])
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
