import { Component, OnInit } from '@angular/core';
import { RegistryService } from "../_services"
import { Router } from "@angular/router"

@Component({
  selector: 'registry',
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.sass']
})
export class RegistryComponent implements OnInit {

  constructor(private registry: RegistryService,
              private router: Router) { }

  ngOnInit() {
  }

  register(){
    const data = this.getFormData()

    if(this.validateRegister(data)){
      const password = this.getRegisterPassword();
      // TODO: validate password

      this.registry.saveNewUser(data, password)
          .subscribe( data => {
              console.log(data);
              if(data.success === true){
                // TODO: Output Message
                alert("Erfolgreich Registriert!");
                this.router.navigate([""])
              }else{
                // TODO: Output Message
                alert("Error: "+data.message);
              }
          }
    }else {
      // TODO: Output Message
      console.log("Validation failed!");
    }
  }
  getFormData() {
        return {
            ziviName : this.getRegisterUserName(),
            dates: {
                start : this.getSDate(),
                end : this.getEDate()
            },
            email : this.getEmail(),
            abo: this.getAbo()
        }
    }

    // TODO: Validtion of fields
    validateRegister(data){
        return true;
    }

    //Functions for getting the values of the input Fields
    getRegisterUserName() { return document.querySelector("#registerUserName").value };
    getRegisterPassword() { return document.querySelector("#registerPassword").value };
    getSDate() { return document.querySelector("#startDate").value };
    getEDate(){ return document.querySelector("#endDate").value };
    getEmail(){ return document.querySelector("#email").value };
    getAbo(){ return document.querySelector("#abo").value };
}
