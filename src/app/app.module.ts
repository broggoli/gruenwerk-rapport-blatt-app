import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'
import {  FormsModule,
          ReactiveFormsModule} from '@angular/forms';

import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { RapportblattComponent } from './rapportblatt/rapportblatt.component';
import { RegistryComponent } from './registry/registry.component';
import { SettingsComponent } from './settings/settings.component';

import { AuthGuard } from "./auth.guard";
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
