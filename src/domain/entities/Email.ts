export class Email {
    to: string;
    subject?: string;
    html: string;
    text?: string
  
    constructor(data: Partial<Email>) {
        Object.assign(this, {
            ...data
        });
    }
}
