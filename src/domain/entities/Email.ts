export class Email {
    recipient: string;
    subject: string;
    html: string;
    type: string
  
    constructor(data: Partial<Email>) {
        Object.assign(this, {
            ...data
        });
    }
}
