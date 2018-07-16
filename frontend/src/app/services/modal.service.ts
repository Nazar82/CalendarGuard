import {Injectable} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

@Injectable()

export class ModalService {
    modalText = '';

    //Creates Behaviour Subject to emit values
    delete = new BehaviorSubject<boolean>(false);

    getModalText(): string {
        return this.modalText;
    }

    setModalText(modalText: string): void {
        this.modalText = modalText;
    }
}


