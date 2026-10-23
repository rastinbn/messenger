export class EmptyMessageError extends Error {
  constructor() {
    super('A message must have text content or at least one attachment.');
    this.name = 'EmptyMessageError';
  }
}

/** The message id does not exist, is soft-deleted, or belongs to another conversation. */
export class MessageNotFoundError extends Error {
  constructor() {
    super('Message not found.');
    this.name = 'MessageNotFoundError';
  }
}

/** Only the author may delete a message. */
export class MessageNotOwnedError extends Error {
  constructor() {
    super('You can only delete your own messages.');
    this.name = 'MessageNotOwnedError';
  }
}
