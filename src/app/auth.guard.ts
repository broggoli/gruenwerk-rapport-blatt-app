import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
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

    // If the user isn't logged in he gets redirected to the main login page
    if( !this.Auth.isLoggedIn.local ){
      this.router.navigate([""])
    }
    const loginStatus = this.Auth.isLoggedIn;
    if ( loginStatus.local ) {
      return true
      /*return <Observable<boolean>>loginStatus.online.subscribe( data => {
        if(data.success){
          if(data.data === true) {
            return true            
          }else{
            this.router.navigate(['']);
            return false
          }
        }else{
          console.log(JSON.stringify(data))
          alert("Konnte nicht herausfinden ob Sie eingelogged sind!")
        }
      })*/
    } else {
      this.router.navigate(['']);
      return false
    }
  }
}
