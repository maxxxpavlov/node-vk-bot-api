import { ContextClass } from './types';

interface SessionSettings {
  store?: Map<any, any>;
  key?: string;
  getSessionKey?: any;
}

interface SessionClass {
  store: any;
  key: string;
  getSessionKey: any;
}

class Session implements SessionClass {
  store = new Map();
  key = 'session';

  constructor(settings: SessionSettings = {}) {
    Object.assign(this, {}, settings);
  }

  getSessionKey = (ctx: any): string => {
    const userId = ctx.message.from_id || ctx.message.user_id;
    return `${userId}:${userId}`;
  }

  middleware() {
    return (ctx: ContextClass, next) => {
      const key = this.getSessionKey(ctx);
      let session = this.store.get(key) || {};

      Object.defineProperty(ctx, this.key, {
        get: () => session,
        set: (value) => {
          session = value;
        },
      });

      this.store.set(key, session);

      next();
    };
  }
}

export { Session };
