import { Component, OnInit } from '@angular/core';
import {  Validators,
          FormGroup,
          FormControl } from '@angular/forms'
import { AuthService } from '../_services'
import { Router } from "@angular/router"

interface ZiviDBObj {
  ziviDataHeader: string,
  encryptedZiviData: string,
  expirationDate: number
}
interface loginData{
  success: boolean,
  data: ZiviDBObj,
  message: string
}

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup
  email: FormControl
  password: FormControl
  loginError: string = ""

  constructor(private Auth: AuthService,
              private router: Router) { }

  ngOnInit() {
    //Auto log in from index if data is already safed in localStorage
    if(this.Auth.isLoggedIn){
      this.router.navigate(["rapportblatt"])
    }else{
      document.querySelector("#logOutButton").classList.add("loggedOut")
      this.createFormControls()
      this.createForm()
    }
  }
  createFormControls(){
    this.email = new FormControl("",
            [ Validators.required
            ])
    this.password = new FormControl("",
                [ Validators.required,
                  Validators.minLength(6)
                ])
  }
  createForm(){
    this.loginForm = new FormGroup({
      email: this.email,
      password: this.password
    })
  }
  login(){

    if( this.loginForm.valid )
    {
      this.showLoader(true)
      const email = this.email.value.toLowerCase().trim(),
            password = this.password.value.trim()
      /* Tryes to get the user's data from the backend */
      this.Auth.getEncryptedData(email, password).subscribe(data => {

          this.showLoader(false)
          if(data.success){
              this.loginError = ""
              //let ziviDBObj: ZiviDBObj = data.data
              const userData:string = data.data["encryptedZiviData"]
              console.log("asd", data, typeof data.data)
              this.Auth.saveData(userData, password)
              console.log("data", data)
              //Display the logout bnutton
              document.querySelector("#logOutButton").classList.remove("loggedOut")

              //if the backend says everything is ok -> redirect to user's page
              this.showInputsChecked(true)
              setTimeout(() => this.router.navigate(["rapportblatt"]), 500)

          }else{
            this.showInputsChecked(false)
            this.loginError = data.message
            console.log(data)
          }
      })
    }
  }
  showLoader( show:boolean ) {
    let loadingAnim: HTMLElement = document.querySelector(".loadingAnim")
    show ?  loadingAnim.style.display = "block" :
            loadingAnim.style.display = "none"
  }
  showInputsChecked( show:boolean ) {
    let loadingAnim: HTMLElement = document.querySelector(".inputsChecked")
    show ?  loadingAnim.style.display = "block" :
          loadingAnim.style.display = "none"
  }
}
