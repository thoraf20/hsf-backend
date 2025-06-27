
export interface EmailContact {
  name: string;
  email: string;
}

export class Email {
  subject: string;
  content: string; // <-- your `html`
  to: EmailContact[];
  sender?: EmailContact;
  replyTo?: EmailContact;
  bcc?: EmailContact[];
  cc?: EmailContact[];
  tags?: string[];

      constructor(data: Partial<Email>) {
        Object.assign(this, data ?? {});
      }
}
