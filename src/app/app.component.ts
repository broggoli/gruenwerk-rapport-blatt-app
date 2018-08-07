import { Component } from '@angular/core';
import { Router } from "@angular/router"
import { AuthService } from "./_services";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./sass/main.sass']
})
export class AppComponent {
  title = 'RapportblattApp'
  loggedIn: boolean

  constructor(private auth: AuthService,
              private router: Router) {
  }
  isActive(route: string){
    return "/"+route === this.router.url ? true : false
  }

  get isLoggedIn():boolean { return this.auth.isLoggedIn.local }

}
