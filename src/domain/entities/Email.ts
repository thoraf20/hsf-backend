import { PartialInstantiable } from '@shared/types/partials'

export class Email extends PartialInstantiable<Email> {
    to: string;
    subject?: string;
    html: string;
    text?: string
}
