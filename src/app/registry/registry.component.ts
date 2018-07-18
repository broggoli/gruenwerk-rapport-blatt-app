import {  Component,
          OnInit,
          ViewChild,
          Directive} from '@angular/core'
import { NG_VALIDATORS } from '@angular/forms'
import { RegistryService } from "../_services"
import { Router } from "@angular/router"

class RegistryData {
  constructor(
    public firstName:string = "",
    public lastName:string = "",
    public email:string = "",
    public abo:string = "",
    public password:string = "",
    public startDate:string = "",
    public endDate:string = ""
  ){}
}
@Component({
  selector: 'registry',
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.sass']
})
export class RegistryComponent implements OnInit {

  constructor(private registry: RegistryService,
              private router: Router) { }


  model: RegistryData = new RegistryData()
  //ViewChild importd -^ used to watch the template reference variable of the form
  @ViewChild("registryForm") form: any
  ngOnInit() {
        document.querySelector("#logOutButton").classList.add("loggedOut")
     }

  register(){
    if( this.form.valid )
    {
      console.log("registring!")
      const password = model.password
      const userData = this.getUserDataObj
      console.log(userData)
      if(this.validateRegister(userData)){
        // TODO: validate password

        this.registry.saveNewUser(userData, password.registerPassword1)
            .subscribe( data => {
                console.log(data);
                if(data.success === true){
                  // TODO: Output Message
                  this.form.reset()
                  alert("Erfolgreich Registriert!");
                  this.router.navigate([""])
                }else{
                  // TODO: Output Message
                  alert("Error: "+data.message);
                }
            })
      }else {
        // TODO: Output Message
        console.log("Validation failed!");
      }
    }
  }

  get getUserDataObj(){
    return {
      name: {
                firstName: model.firstName.trim(),
                lastName: model.lastName.trim()
              },
      email: model.email.trim(),
      abo: model.abo.trim(),
      date: {
        startDate: model.startDate.trim(),
        endDate: model.endDate.trim()
      }
    }
  }

}

function equalValidator(group: FormGroup){
  console.log("asds")
  const password = group.get('password').value
  const repeatPassword = group.get('repeatPassword').value

  return password === repeatPassword ? null : { mismatch: true }
}
@Directive({
  selector: "[equal][ngModel]",
  providers: [
    {provide: NG_VALIDATORS,
    useValue: equalValidator,
    multi: true}
  ]
})
class EqualValidator {
}
