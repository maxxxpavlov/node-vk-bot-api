import { BotClass, ContextOptions } from './types';


class Context {
  message: any;
  bot: BotClass;

  constructor({ type, object: update }: ContextOptions, bot: BotClass) {
    this.message = { ...update, type };
    this.bot = bot;
  }

  reply(...args: any[]) {
    this.bot.sendMessage(this.message.peer_id || this.message.user_id, ...args);
  }
}

export { Context };
