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
  firstName: FormControl
  lastName: FormControl
  abo: FormControl
  email: FormControl
  password: FormControl
  passwordInput: FormGroup
  repeatPassword: FormControl
  startDate: FormControl
  endDate: FormControl
  dateInput: FormGroup
  registerError: string = ""

  constructor(private registry: RegistryService,
              private router: Router) { }


  ngOnInit() {
    this.createFormControls()
    this.createForm()
    document.querySelector("#logOutButton").classList.add("loggedOut")
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
    this.passwordInput = new FormGroup({
      password: this.password,
      repeatPassword: this.repeatPassword
    }, equalValidator)

    this.dateInput = new FormGroup({
      startDate: this.startDate,
      endDate: this.endDate
    }, dateValidator)

    this.registerForm = new FormGroup({
      name: new FormGroup({
        firstName: this.firstName,
        lastName: this.lastName
      }),
      abo: this.abo,
      email: this.email,
      date: this.dateInput,
      passwordInputs: this.passwordInput
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
                  // TODO: Output Message
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
      // TODO: Output Message
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

  showLoader(show:boolean) {
    let loadingAnim: HTMLElement = document.querySelector(".loadingAnim")
    show ?  loadingAnim.style.display = "block" :
            loadingAnim.style.display = "none"
  }
  showInputsChecked( show:boolean ) {
    let inputsChecked: HTMLElement = document.querySelector(".inputsChecked")
    show ?  inputsChecked.style.display = "block" :
            inputsChecked.style.display = "none"
  }
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
