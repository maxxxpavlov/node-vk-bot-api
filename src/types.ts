interface Settings {
  token?: string;
  polling_timeout?: number;
  execute_timeout?: number;
  group_id?: number;
  confirmation?: string;
  secret?: string;
}
type Next = (ctx: ContextClass, idx: number) => boolean;
type Middleware = (ctx: ContextClass, next: Next) => any;

interface BotClass {
  middlewares: any[];
  methods: any[];
  settings: Settings;
  callExecute: any;
  command: any;
  sendMessage(userId: number | number[], message?: string | undefined | null,
    attachment?: string | undefined | null, keyboard?: MarkupClass, sticker?: null | string | undefined): void;
  startPolling(ts: number): Promise<any>;
  getLongPollParams(): void;
  use(middleware: any): void;
  next: Next;
  execute;
  webhookCallback(...args: any[]);
}
interface ContextClass {
  message: any;
  bot: any;
  session?: any;
  scene?: any;
  res?: any;
}
interface SceneClass {
  name: string;
  middlewares: any[];
  // enter: any;
  // leave: any;
  // next: any;
  // selectStep: any;
}
interface StageClass {
  scenes: any;
}
interface ContextOptions {
  type: string;
  object: any;
}

interface MarkupClass {
  rawKeyboard: any;
  toJSON(): string;
  oneTime(idOneTime: boolean);
}
interface ButtonClass {
  color?: 'default' | 'primary' | 'negative' | 'positive' | string;
  action?: any;
  label?: string;
}

export { Settings, BotClass, ContextClass, SceneClass, StageClass, ContextOptions, MarkupClass, ButtonClass, Middleware };
