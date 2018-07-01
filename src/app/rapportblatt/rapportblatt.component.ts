import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services'

@Component({
  selector: 'app-rapportblatt',
  templateUrl: './rapportblatt.component.html',
  styleUrls: ['./rapportblatt.component.sass']
})
export class RapportblattComponent implements OnInit {

  constructor(private user: UserService) { }

  ngOnInit() {
    console.log(this.user.getZiviData())
  }

}
