export const EMAIL_SENDER = Symbol("EMAIL_SENDER");

export interface EmailSenderPort {
  send(params: { to: string; subject: string; html: string; text: string }): Promise<void>;
}
