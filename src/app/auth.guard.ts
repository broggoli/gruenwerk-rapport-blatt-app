import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from "./_services"
import { Router } from "@angular/router"

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private Auth: AuthService, private router: Router){}
  
  // Returns an observable boolean that tells angular whether the user is allowed to access certain routs of the app
  // For example the Rapportblatt or the settings page should only be accessed if the user is logged in
  // This means that the user's data is saved in local storage php has got a user session running.
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {

      return this.Auth.isLoggedIn.pipe(tap( loginStatus => {
        // If the user isn't logged in he gets redirected to the main login page
        if( loginStatus !== true ) {
          this.router.navigate([""])
        }
      }))
  }
}
