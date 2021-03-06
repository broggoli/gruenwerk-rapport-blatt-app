import { Component, OnInit } from '@angular/core';
import {  Validators,
          FormGroup,
          FormControl } from '@angular/forms';
import { AuthService } from '../_services';
import { Router } from '@angular/router';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  email: FormControl;
  password: FormControl;
  loginError = '';

  constructor(private Auth: AuthService,
                private router: Router) {
      this.createFormControls();
      this.createForm();
    }

  ngOnInit() {
    if(lsTest() === true){
      // Auto log in from index if data is already safed in localStorage
      this.Auth.isLoggedIn.subscribe( loginStatus => {
        if( loginStatus === true) {
          this.router.navigate(['rapportblatt']);
        }
      });
    }else{
      // LocalStorage isn't avalable
      alert("Benutzen Sie bitte einen anderen Browser um diese App zu benutzen!")
    }
  }
  createFormControls() {
    this.email = new FormControl('',
            [ Validators.required
            ]);
    this.password = new FormControl('',
                [ Validators.required,
                  Validators.minLength(6)
                ]);
  }
  createForm() {
    this.loginForm = new FormGroup({
      email: this.email,
      password: this.password
    });
  }
  login() {

    if ( this.loginForm.valid ) {
      this.showLoader(true);
      const email = this.email.value.toLowerCase().trim(),
            password = this.password.value.trim();
      /* Tryes to get the user's data from the backend */
      this.Auth.login(email, password).subscribe(data => {

          this.showLoader(false);
          if (data.success) {
              console.log(data)
              this.loginError = '';

              // if the backend says everything is ok -> redirect to user's page
              this.showInputsChecked(true);
              setTimeout(() => this.router.navigate(['rapportblatt']), 500);

          } else {
            this.showInputsChecked(false);
            this.loginError = data.message;
            console.log(JSON.stringify(data));
          }
      });
    }
  }
  showLoader( show: boolean ) {
    const loadingAnim: HTMLElement = document.querySelector('.loadingAnim');
    show ?  loadingAnim.style.display = 'block' :
            loadingAnim.style.display = 'none';
  }
  showInputsChecked( show: boolean ) {
    const loadingAnim: HTMLElement = document.querySelector('.inputsChecked');
    show ?  loadingAnim.style.display = 'block' :
          loadingAnim.style.display = 'none';
  }
}

function lsTest(){
  var test = 'test';
  try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
  } catch(e) {
      return false;
  }
}