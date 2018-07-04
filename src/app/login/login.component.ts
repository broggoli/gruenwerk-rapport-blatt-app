import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services'
import { Router } from "@angular/router"

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  constructor(private Auth: AuthService,
              private router: Router) { }

  ngOnInit() {
    //Auto log in from index if data is already safed in localStorage
    if(this.Auth.isLoggedIn){
      this.router.navigate(["rapportblatt"])
    }else{
      document.querySelector("#logOutButton").classList.add("loggedOut")
    }
  }

  login(event){
    event.preventDefault()
    const target = event.target
    const userName = this.getUserName()
    const password = this.getPassword()

    /* Tryes to get the user's data from the backend */
    this.Auth.getEncryptedData(userName, password).subscribe(data => {
        if(data.success){
            this.Auth.saveData(data.data, password)
            document.querySelector("#logOutButton").classList.remove("loggedOut")

            //if the backend says everything is ok -> redirect to user's page
            this.router.navigate(["rapportblatt"])
        }else{
            console.log(data)
        }
    })
  }

  getUserName() {return document.querySelector("#userName").value};
  getPassword() {return document.querySelector("#password").value};
}