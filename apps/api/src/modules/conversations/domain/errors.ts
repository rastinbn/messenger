export class ConversationNotFoundError extends Error {
  constructor(id: string) {
    super(`Conversation "${id}" was not found.`);
    this.name = 'ConversationNotFoundError';
  }
}

export class NotAConversationParticipantError extends Error {
  constructor() {
    super('You are not a participant in this conversation.');
    this.name = 'NotAConversationParticipantError';
  }
}
