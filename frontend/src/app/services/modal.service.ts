import {Injectable} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

@Injectable()

export class ModalService {
    modalText = '';

    // Creates Behaviour Subject to emit values
    delete = new BehaviorSubject<boolean>(false);

    /**
     * Returns text to be displayed in modal
     * @return modal text {string}
     */
    getModalText(): string {
        return this.modalText;
    }

    /**
     * Sets text to be displayed in modal
     * @param modalText {string}
     */
    setModalText(modalText: string): void {
        this.modalText = modalText;
    }
}
