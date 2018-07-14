import { Component, OnInit } from '@angular/core';
import { UserService } from "../_services"
import { Router } from "@angular/router"

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.sass']
})
export class LogoutComponent implements OnInit {

  constructor(private user: UserService, private router: Router) { }

  ngOnInit() {
    this.user.logout().subscribe( data => {
      if(data.success){
        this.router.navigate([""])
        localStorage.removeItem("userData")
        localStorage.removeItem("savedRapportblatt")
          console.log(data.success)
      }else{
        alert("some problem!")
      }
    })
  }

}
