interface Settings {
  token: string;
  v?: string;
  polling_timeout?: number;
  execute_timeout?: number;
  group_id?: number;
  confirmation?: string;
  secret?: string;
  pollingVersion?: number;
}

type Next = (ctx?: ContextClass, idx?: number) => boolean;
type Middleware = (ctx: ContextClass, next: Next) => any;
type pollHandler = (ts: number) => any;

interface PollingParams {
  key: string;
  server: string;
  ts: number;
}

interface Context {
  message: any;
  bot: any;
  session?: any;
  scene?: any;
  res?: any;
  client_info?: any;
}
type ContextClass = any & Context;

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
type ButtonColor = 'default' | 'primary' | 'negative' | 'positive';

interface ButtonClass {
  color?: ButtonColor | null | undefined;
  action?: any;
  label?: string;
}

export {
  Settings,
  ContextClass,
  SceneClass,
  StageClass,
  ContextOptions,
  MarkupClass,
  ButtonClass,
  Middleware,
  pollHandler,
  ButtonColor,
  PollingParams
};
