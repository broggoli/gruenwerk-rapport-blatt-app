import { Component, OnInit } from '@angular/core';
import { UserService,
        AuthService } from '../_services';
import { ZiviData } from '../ziviData'
import {  Validators,
          FormGroup,
          FormControl } from '@angular/forms'
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent implements OnInit {

  ziviData: ZiviData
  changeServiceError: string
  changeServiceTime: FormGroup;
  deleteAccountForm: FormGroup;
  dateInput: FormGroup;
  startDate: FormControl;
  endDate: FormControl;
  password: FormControl;
  passwordDA: FormControl;

  daysServed: number
  daysToServe: number
  totalDaysServing: number
  percentServed: string
  percentToServe: string
  deleteAccountError: string

  constructor(private user: UserService,
              private Auth: AuthService,
              private router: Router) {}

  ngOnInit() {
    this.changeServiceError = "";
    this.deleteAccountError = ""
    this.ziviData = this.user.getZiviData();
    this.createFormControls();
    this.createForm();
    this.calculateDays()

  }

  calculateDays(){
    this.ziviData = this.user.getZiviData();
    this.daysServed = this.calcDaysServed();
    this.totalDaysServing = this.calcTotalDaysServing();
    this.daysToServe = this.totalDaysServing - this.daysServed;
    this.percentServed = this.getPercentage(this.daysServed, this.totalDaysServing)
    this.percentToServe = this.getPercentage(this.daysToServe, this.totalDaysServing)
  }

  getPercentage(a, b):string { return b > 0 ?  Math.floor(a / b * 100).toString() + '%' : '0%'; }

  changeServiceDuration() {

    if( this.changeServiceTime.valid ) {
      this.showLoader(true)
      this.showInputsChecked(false)
      const startDate = this.startDate.value.toLowerCase().trim(),
            newEndDate = this.endDate.value.toLowerCase().trim(),
            password = this.password.value.trim();

      console.log(startDate, newEndDate, password)
      this.user.changeServiceTime(startDate, newEndDate, password).subscribe(
        data => {
            console.log(data)
            if (data.success) {
              this.changeServiceError = "";
              /* Tryes to get the user's data from the backend */
              this.Auth.login(this.ziviData.email, password).subscribe(d => {
                if (d.success) {
                    this.changeServiceError = '';
                    
                    const userData: string = d.data['encryptedZiviData'];

                    this.Auth.saveData(userData, password);
                    this.showInputsChecked(true);
                    // Wait 200 ms to show he check sign
                    setTimeout(() => this.calculateDays(), this.showLoader(false), 200);
                    
                } else {
                  this.showInputsChecked(false);
                  this.changeServiceError = d.message;
                  console.log(d);
                }
              });
            }else{
              this.changeServiceError = data.message;
              console.log(this.changeServiceError)
              this.showLoader(false)
              this.showInputsChecked(false)
            }
      })
    }
  }

  createFormControls() {
    this.startDate = new FormControl(this.ziviData.date.startDate,
      [
        Validators.required,
        Validators.pattern('^([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))$')
      ])
    this.endDate = new FormControl(this.ziviData.date.endDate,
      [
        Validators.required,
        Validators.pattern('^([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))$')
      ])
    this.password = new FormControl('',
      [ Validators.required,
        Validators.minLength(6)
      ]);
    this.passwordDA = new FormControl('',
      [ Validators.required,
        Validators.minLength(6)
      ]);
  }
  createForm() {
    this.dateInput = new FormGroup({
      startDate: this.startDate,
      endDate: this.endDate
    }, dateValidator)
    console.log(this.dateInput)
    this.changeServiceTime = new FormGroup({
      dateInput: this.dateInput,
      password: this.password
    });
    this.deleteAccountForm = new FormGroup({
      passwordDA: this.passwordDA
    });
  }

  calcTotalDaysServing(): number {
    const end = new Date(this.ziviData.date.endDate).getTime()
    const start = new Date(this.ziviData.date.startDate).getTime()
    return Math.round( (end - start) / ( 1000*60*60*24) ) + 1
  }
  calcDaysServed(): number{
    const today = new Date().getTime()
    const start = new Date(this.ziviData.date.startDate).getTime()
    return Math.round( (today - start) / ( 1000*60*60*24) )
  }

  deleteAccount(){
    if( this.deleteAccountForm.valid ) {
      this.showLoader(true)
      this.showInputsChecked(false)
      const password = this.passwordDA.value.trim();

      this.user.deleteAccount(password).subscribe(
        data => {
            console.log(data)
            if (data.success) {

              this.deleteAccountError = "";
              // if the backend says everything is ok -> redirect to logout page
              this.showLoader(false)
              this.showInputsChecked(true);
              setTimeout(() => this.router.navigate(['logout']), 500);
            }else{
              this.deleteAccountError = data.message;
              console.log(this.deleteAccountError)
              this.showLoader(false)
              this.showInputsChecked(false)
            }
      })
    }
  }


  showLoader( show: boolean ) {
    showElement( show, ".loadingAnim");
  }
  showInputsChecked( show: boolean ) {
    showElement( show, '.inputsChecked');
    if( show === true){
      setTimeout(() => showElement( false, '.inputsChecked'), 2000)
    }
  }
}
function showElement( show: boolean, elementClass: string) {
    const element : HTMLElement = document.querySelector(elementClass);
    show ? element.style.display = 'block' :
          element.style.display = 'none';
}

function dateValidator(group: FormGroup){
  const startDate = Date.parse(group.get('startDate').value)
  const endDate = Date.parse(group.get('endDate').value)

  // If the starting date is after the ending date, return a validation error
  if(endDate && startDate)
  {
    return endDate > startDate ? null : { endBeforeStart: true }
  }
}