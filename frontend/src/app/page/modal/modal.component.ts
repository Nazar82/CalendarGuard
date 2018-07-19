import {Component, OnInit, OnDestroy} from '@angular/core';

import {ModalService} from '../../services/modal.service';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css']
})

export class ModalComponent implements OnInit, OnDestroy {
    modalText = '';

    constructor(
        private modalService: ModalService
    ) {
    }

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

    ngOnDestroy() {
        this.modalText = '';
        this.modalService.delete.next(false);
    }
}
