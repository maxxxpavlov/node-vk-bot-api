import { BotClass, ContextOptions } from './types';


class Context {
  message: any;
  bot: BotClass;
  client_info: any;
  constructor({ type, object: update }: ContextOptions, bot: BotClass) {
    if (type === 'message_new' && 'client_info' in update) {
      this.message = { type, ...update.message };
      this.client_info = update.client_info;
    } else {
      this.message = { ...update, type };
    }
    this.bot = bot;
  }

  reply(...args: any[]) {
    return this.bot.sendMessage(this.message.peer_id || this.message.user_id, ...args);
  }
}

export { Context };
