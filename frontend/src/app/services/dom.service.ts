import {ComponentFactoryResolver, Injectable} from '@angular/core';

import {ModalComponent} from '../page/modal/modal.component';

@Injectable()
export class DomService {
    modal;

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver
    ) {
    }

    /**
     * Creates modal and appends it to container
     * @param container
     */
    createModal(container): void {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = container.createComponent(componentFactory);
    }

    /**
     * Removes modal from container
     * @param container
     */
    closeModal(container) {
        container.remove(container.indexOf(this.modal));
        this.modal = null;
    }
}
