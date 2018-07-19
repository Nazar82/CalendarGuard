import { Component, OnInit } from '@angular/core';
import {ModalService} from "../../services/modal.service";

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {
    modalText;

  constructor(
      private modalService: ModalService
  ) { }

    /**
     * Emits 'true' or 'false' depending on user response to modal
     * @param confirm {boolean}
     */
    handleResponse(confirm: boolean): void {
        this.modalService.delete.next(confirm);
    }

  ngOnInit() {
      this.modalText = this.modalService.getModalText();
  }

}
