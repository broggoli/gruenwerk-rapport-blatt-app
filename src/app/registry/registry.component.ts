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
      // this.formData = {
      //         name : {
      //             prename: "",
      //             surname: ""
      //         },
      //         dates: {
      //             start : "",
      //             end : ""
      //         },
      //         email : "",
      //         abo: ""
      //     }
      //   this.password = ""
     }
  register(){
console.log(registryForm)

    if(this.validateRegister(this.formData)){
      // TODO: validate password

      this.registry.saveNewUser(this.formData, this.password)
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
          })
    }else {
      // TODO: Output Message
      console.log("Validation failed!");
    }
  }
    // TODO: Validtion of fields
    validateRegister(data){
        return true;
    }
}
