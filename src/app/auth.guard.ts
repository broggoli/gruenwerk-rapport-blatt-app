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
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

      return this.Auth.isLoggedIn.pipe(tap( loginStatus => {
        // If the user isn't logged in he gets redirected to the main login page
        if( loginStatus !== true ) {
          this.router.navigate([""])
        }
      }))
      }
}
