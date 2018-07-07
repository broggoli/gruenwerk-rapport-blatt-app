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

    this.formData = {
        email: "",
        password: ""
    }
  }

  login(event){
    event.preventDefault()
    const target = event.target

    /* Tryes to get the user's data from the backend */
    this.Auth.getEncryptedData(this.formData.email, this.formData.password).subscribe(data => {
        if(data.success){
            this.Auth.saveData(data.data, this.formData.password)
            console.log(data)
            //Display the logout bnutton
            document.querySelector("#logOutButton").classList.remove("loggedOut")

            //if the backend says everything is ok -> redirect to user's page
            this.router.navigate(["rapportblatt"])
        }else{
            console.log(data)
        }
    })
  }
}
