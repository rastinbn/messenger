/**
 * Service interfaces — the Phase 1/Phase 2 boundary.
 *
 * Every piece of data the UI needs flows through these interfaces.
 * Phase 1 provides Mock implementations (in-memory fixtures + simulated
 * latency). Phase 2 provides Http/Socket implementations calling the
 * real NestJS API. Components and hooks depend ONLY on these interfaces,
 * never on a concrete implementation, via ServiceProvider (see
 * components/providers/ServiceProvider.tsx).
 */
import type {
  AuthSession,
  Conversation,
  LoginInput,
  Message,
  Notification,
  PublicUser,
  RegisterInput,
  SendMessageInput,
  User,
  UserStatus
} from "@messenger/shared-types";

export interface AuthService {
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;

  /** Resends the verification email to the currently logged-in user. */
  resendVerificationEmail(): Promise<void>;
  /** Confirms an email address using the token from the verification email link. */
  confirmEmailVerification(token: string): Promise<void>;

  /** Requests a one-time login link be emailed to the given address, if an account exists for it. */
  requestMagicLink(email: string): Promise<void>;
  /** Exchanges a magic link token for a real session. */
  consumeMagicLink(token: string): Promise<AuthSession>;
}

export interface UserService {
  getCurrentUser(): Promise<User>;
  updateProfile(patch: Partial<Pick<User, "displayName" | "avatarUrl" | "statusMessage">>): Promise<User>;
  updateStatus(status: UserStatus): Promise<User>;
  searchUsers(query: string): Promise<PublicUser[]>;
  getUser(userId: string): Promise<PublicUser | null>;
}

export interface ContactsService {
  listContacts(): Promise<PublicUser[]>;
  addContact(userId: string): Promise<void>;
  removeContact(userId: string): Promise<void>;
}

export interface ChatService {
  listConversations(): Promise<Conversation[]>;
  getConversation(conversationId: string): Promise<Conversation | null>;
  getMessages(conversationId: string, cursor?: string): Promise<{ messages: Message[]; nextCursor: string | null }>;
  sendMessage(input: SendMessageInput): Promise<Message>;
  /** Soft-deletes one of the current user's messages; resolves with the tombstone. */
  deleteMessage(messageId: string): Promise<Message>;
  /** Copies a message into another conversation, marked as forwarded. */
  forwardMessage(input: { messageId: string; conversationId: string }): Promise<Message>;
  markRead(conversationId: string): Promise<void>;
  createConversation(participantIds: string[], name?: string): Promise<Conversation>;
  setTyping(conversationId: string, isTyping: boolean): void;
  onTyping(conversationId: string, cb: (userId: string, isTyping: boolean) => void): () => void;
  onMessage(conversationId: string, cb: (message: Message) => void): () => void;
  onMessageDeleted(conversationId: string, cb: (message: Message) => void): () => void;
}

export interface NotificationService {
  listNotifications(): Promise<Notification[]>;
  markAllRead(): Promise<void>;
  markRead(id: string): Promise<void>;
  onNotification(cb: (n: Notification) => void): () => void;
}

export interface Services {
  auth: AuthService;
  user: UserService;
  contacts: ContactsService;
  chat: ChatService;
  notifications: NotificationService;
}
