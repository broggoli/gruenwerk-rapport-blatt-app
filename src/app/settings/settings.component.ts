import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services';
import { ZiviData } from '../ziviData'
import {  Validators,
          FormGroup,
          FormControl } from '@angular/forms'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent implements OnInit {

  ziviData: ZiviData
  changeServiceError: string
  changeServiceTime: FormGroup;
  endDate: FormControl;
  password: FormControl;

  daysServed: number
  daysToServe: number
  totalDaysServing: number
  percentServed: string
  percentToServe: string

  constructor(private user: UserService) {}

  ngOnInit() {
    this.changeServiceError = "";
    this.ziviData = this.user.getZiviData();
    this.createFormControls();
    this.createForm();

    this.daysServed = this.calcDaysServed();
    this.totalDaysServing = this.calcTotalDaysServing();
    this.daysToServe = this.calcTotalDaysServing() - this.daysServed;
    this.percentServed = this.getPercentage(this.daysServed, this.totalDaysServing)
    this.percentToServe = this.getPercentage(this.daysToServe, this.totalDaysServing)
  }


  getPercentage(a, b):string { return b > 0 ?  Math.floor(a / b * 100).toString() + '%' : '0%'; }

  chnageServiceDuration() {
    if( this.changeServiceTime.valid ) {
      const newEndDate = this.endDate.value.toLowerCase().trim(),
            password = this.password.value.trim();
      console.log(newEndDate, password)

      this.user.changeServiceTime(newEndDate, password).subscribe({
        data => {
            if (data.success) {
              console.log("Success")
            }
      })

    }
  }

  createFormControls() {
    this.endDate = new FormControl(this.ziviData.date.endDate,
      [
        Validators.required,
        Validators.pattern('^([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))$')
      ])
    this.password = new FormControl('',
      [ Validators.required,
        Validators.minLength(6)
      ]);
  }
  createForm() {
    this.changeServiceTime = new FormGroup({
      endDate: this.endDate,
      password: this.password
    });
  }

  calcTotalDaysServing(): number {
    const end = new Date(this.ziviData.date.endDate).getTime()
    const start = new Date(this.ziviData.date.startDate).getTime()
    return Math.round( (end - start) / ( 1000*60*60*24) )
  }
  calcDaysServed(): number{
    const today = new Date().getTime()
    const start = new Date(this.ziviData.date.startDate).getTime()
    return Math.round( (today - start) / ( 1000*60*60*24) )
  }

  deleteAccount(){
    console.log("Deleting Account")
  }
}
