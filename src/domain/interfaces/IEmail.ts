import { Email } from "../entities/Email";

export interface IEmailService {
    sendEmail(email: Email): Promise<void>;
}
