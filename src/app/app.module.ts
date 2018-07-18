import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'
import {  FormsModule,
          ReactiveFormsModule} from '@angular/forms';
import {  MatDatepickerModule,
          MatNativeDateModule,
          MatFormFieldModule } from '@angular/material';

import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { RapportblattComponent } from './rapportblatt/rapportblatt.component';

import { AuthGuard } from "./auth.guard";
import { RegistryComponent } from './registry/registry.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LogoutComponent,
    RapportblattComponent,
    RegistryComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
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

      }])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
