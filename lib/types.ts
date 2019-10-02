interface Settings {
  token?: string;
  polling_timeout?: number;
  execute_timeout?: number;
  group_id?: number;
  confirmation?: string;
  secret?: string;
}

interface BotClass {
  middlewares: any[];
  methods: any[];
  settings: Settings;
  callExecute: any;
  command: any;
  sendMessage;
  startPolling;
  getLongPollParams;
  use;
  next;
  execute;
  webhookCallback;
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
export { Settings, BotClass, ContextClass, SceneClass, StageClass, ContextOptions };
