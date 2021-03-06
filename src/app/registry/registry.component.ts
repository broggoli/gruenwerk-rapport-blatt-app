import {  Component,
          OnInit} from '@angular/core'
import {  Validators,
          FormGroup,
          FormControl } from '@angular/forms'
import { RegistryService } from "../_services"
import { Router } from "@angular/router"

@Component({
  selector: 'registry',
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.sass']
})
export class RegistryComponent implements OnInit {

  registerForm: FormGroup
  names: FormGroup
  firstName: FormControl
  lastName: FormControl
  abo: FormControl
  email: FormControl
  password: FormControl
  passwordInputs: FormGroup
  repeatPassword: FormControl
  startDate: FormControl
  endDate: FormControl
  dateInputs: FormGroup
  registerError: string = ""
  stdAboOpts: string[]
  aboValue: string = ""

  constructor( private registry: RegistryService,
               private router: Router) { }

  aboOptions() {

  }

  ngOnInit() {
    this.stdAboOpts = [
      "kein ÖV-Abo",
      "GA",
      "ZVV-Netzpass"
    ]
    this.createFormControls()
    this.createForm()
  }

  createFormControls(){
    this.firstName = new FormControl("",
                  [ Validators.required,
                    Validators.pattern("^[-'a-zA-ZÀ-ÖØ-öø-ſ]+$")
                  ])
    this.lastName = new FormControl("",
                  [ Validators.required,
                    Validators.pattern("^[-'a-zA-ZÀ-ÖØ-öø-ſ]+$")
                  ])
    this.abo = new FormControl("")
    this.email = new FormControl("",
            [ Validators.required
            ])
    this.password = new FormControl("",
                [ Validators.required,
                  Validators.minLength(6)
                ])
    this.repeatPassword = new FormControl("",
                [ Validators.required,
                  Validators.minLength(6)
                ])
    this.startDate = new FormControl("",
                [
                  Validators.required,
                  Validators.pattern('^([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))$')
                ])
    this.endDate = new FormControl("",
                [
                  Validators.required,
                  Validators.pattern('^([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))$')
                ])
  }
  createForm(){
    this.passwordInputs = new FormGroup({
      password: this.password,
      repeatPassword: this.repeatPassword
    }, equalValidator)

    this.dateInputs = new FormGroup({
      startDate: this.startDate,
      endDate: this.endDate
    }, dateValidator)

    this.names = new FormGroup({
      firstName: this.firstName,
      lastName: this.lastName
    })
    this.registerForm = new FormGroup({
      names: this.names,
      abo: this.abo,
      email: this.email,
      dateInputs: this.dateInputs,
      passwordInputs: this.passwordInputs
    })
  }

  register(){
    if( this.registerForm.valid )
    {
      console.log("registring!")
      // this.registerForm.disable()
      this.showLoader(true)
      const password = this.password.value.trim()
      const userData = this.getUserDataObj
      console.log(userData)
        this.registry.saveNewUser(userData, password)
            .subscribe( data => {

                this.showLoader(false)
                console.log(data);
                if(data.success === true){
                  this.registerForm.reset()
                  this.registerError = ""
                  alert("Erfolgreich Registriert!");
                  // this.registerForm.enable()
                  this.showInputsChecked(true)
                  setTimeout(() => this.router.navigate([""]), 500)
                }else{
                  this.registerError = data.message
                  this.showInputsChecked(false)
                  // alert("Error: "+data.message);
                }
            })

    }else {
      validateAllFormFields(this.registerForm)
      // this.registerForm.enable()
      console.log("Validation failed!");
    }
  }

  get getUserDataObj(){
    return {
      name: {
                firstName: this.firstName.value.trim(),
                lastName: this.lastName.value.trim()
              },
      email: this.email.value.toLowerCase().trim(),
      abo: this.abo.value.trim(),
      date: {
        startDate: this.startDate.value.trim(),
        endDate: this.endDate.value.trim()
      }
    }
  }
  toggleDropDown(event: Event) {
    const target = <HTMLInputElement>event.target;
    console.log(target.nextElementSibling)
    if (target.nextElementSibling !== null) {
      target.nextElementSibling.classList.toggle("invisible");
    }
  }
  set setAboValue(value) {
    this.aboValue = value
  }
  disableDropDown(event: Event) {
    const target = <HTMLInputElement>event.target;
    //target.nextElementSibling.classList.add("windUp")
    setTimeout(() => {
      if (target.nextElementSibling !== null) {
        target.nextElementSibling.classList.add("invisible");
      }
    }, 200);
  }
  showLoader( show: boolean ) {
    showElement( show, ".loadingAnim");
  }
  showInputsChecked( show: boolean ) {
    showElement( show, '.inputsChecked');
  }
}

function showElement( show: boolean, elementClass: string) {
    const element : HTMLElement = document.querySelector(elementClass);
    show ? element.style.display = 'block' :
          element.style.display = 'none';
}

function validateAllFormFields(formGroup: FormGroup) {         //{1}
    Object.keys(formGroup.controls).forEach(field => {  //{2}
      const control = formGroup.get(field);             //{3}
      if (control instanceof FormControl) {             //{4}
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {        //{5}
        validateAllFormFields(control);            //{6}
      }
  })
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

function equalValidator(group: FormGroup){
  const password = group.get('password').value
  const repeatPassword = group.get('repeatPassword').value


  // If the first password doesn't match the second, return a validation error
  return password === repeatPassword ? null : { mismatch: true }
}
