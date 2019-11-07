import { Settings, ContextClass, MarkupClass, Middleware, pollHandler } from './types';
import axios from 'axios';
import { stringify } from 'querystring';
import { Context } from './context';
import { Request } from './request';
import { toArray } from './utils/toArray';
import { Markup } from './markup';
import { Scene } from './scene';
import { Session } from './session';
import { Stage } from './stage';

const CONFIRMATION_TYPE = 'confirmation';

class PollingError extends Error { }

/*
  Create vk bot instance
*/

class VkBot {
  middlewares: any[];
  methods: any[];
  settings: Settings;
  longPollParams: any;
  pollingHandlers: pollHandler[] = [];

  constructor(userSettings: string | Settings) {
    if (!userSettings) {
      throw new Error('You must pass token into settings');
    } else if (typeof userSettings === 'object' && !userSettings.token) {
      throw new Error('You must set token param in settings');
    }

    this.middlewares = [];
    this.methods = [];

    if (typeof userSettings === 'object') {
      this.settings = {
        polling_timeout: 25,
        execute_timeout: 50,
        ...userSettings
      };
    } else {
      this.settings = {
        polling_timeout: 25,
        execute_timeout: 50,
        token: userSettings
      };
    }

    setInterval(() => {
      this.callExecute(this.methods);
      this.methods = [];
    }, this.settings.execute_timeout);
  }

  api(method: string, settings = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      axios.post(`https://api.vk.com/method/${method}`, stringify({
        v: 5.103,
        ...settings
      })).then(({ data }) => {
        if (data.error) {
          reject(JSON.stringify(data));
        } else {
          resolve(data);
        }
      }).catch((err) => {
        reject(typeof err === 'object' ? JSON.stringify(err) : err);
      });
    });
  }

  command(givenTriggers: string | string[], ...middlewares: ContextClass[]) {
    const triggers = toArray(givenTriggers)
      .map(item => (item instanceof RegExp ? item : item.toLowerCase()));

    middlewares.forEach((fn) => {
      const idx = this.middlewares.length;

      this.middlewares.push({
        triggers,
        fn: (ctx: ContextClass) => fn(ctx, () => this.next(ctx, idx))
      });
    });
  }

  execute(method: any, settings: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.methods.push({
        callback: { resolve, reject },
        code: `API.${method}(${JSON.stringify({
          v: '5.101',
          ...settings,
        })})`,
      });
    });
  }

  getLongPollParams() {
    return new Promise(async (resolve, reject) => {
      if (!this.settings.group_id) {
        const { response } = await this.api('groups.getById', {
          access_token: this.settings.token,
        });

        this.settings.group_id = response[0].id;
      }

      const { response } = await this.api('groups.getLongPollServer', {
        group_id: this.settings.group_id,
        access_token: this.settings.token,
      }).catch((err) => {
        const { error } = JSON.parse(err.toString());
        reject(error);
      });

      resolve(response);
    });
  }

  next(ctx: ContextClass, idx = -1): boolean {
    if (this.middlewares.length > idx + 1) {
      const { fn, triggers } = this.middlewares[idx + 1];
      const isTriggered = (triggers || []).some(
        (trigger: any) => {
          if (ctx.message.type === 'message_new' && trigger !== 'message_new') {
            const message = (ctx.message.text || ctx.message.body || '').toLowerCase();

            if (trigger instanceof RegExp) {
              return trigger.test(message);
            }

            return message === trigger;
          }

          return ctx.message.type === trigger;
        },
      );

      if (!triggers || (!triggers.length && ctx.message.type === 'message_new') || isTriggered) {
        return fn(ctx);
      }

      return this.next(ctx, idx + 1);
    }
    return false;
  }

  sendMessage(userId: number | number[], message: string | undefined | null = null,
    attachment: string | undefined | null = null,
    keyboard: null | MarkupClass = null, sticker: null | string | undefined = null): Promise<void> {

    if (Array.isArray(userId) && userId.length > 100) {
      throw new Error('Message can\'t be sent to more than 100 recipients.');
    }
    const randomId = Math.random() * (1000000000 - 9) + 10;
    return this.execute(
      'messages.send',
      Object.assign(
        Array.isArray(userId)
          ? { user_ids: userId.join(',') }
          : { peer_id: userId },
        typeof userId === 'object'
          ? userId[0]
          : {
            message,
            attachment: toArray(attachment).join(','),
            sticker_id: sticker,
            keyboard: keyboard ? keyboard.toJSON() : undefined,
            random_id: randomId
          },
      ),
    );
  }

  onPoll(handler: pollHandler) {
    this.pollingHandlers.push(handler);
  }
  startPolling(ts: number = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      this.poll(ts).catch((err) => {
        reject(err);
      });
      resolve();
    });
  }

  async poll(ts: number = 0) {
    try {
      if (!this.longPollParams) {
        this.longPollParams = await this.getLongPollParams().catch((err) => {
        });
      }
      const { data } = await axios.get(this.longPollParams.server, {
        params: {
          ...this.longPollParams,
          ts,
          act: 'a_check',
          wait: this.settings.polling_timeout,
        },
      }).catch((err) => {
        throw new PollingError();
      });
      if (data.failed) {
        switch (data.failed) {
          case 1:
            return this.poll(data.ts);
          case 2:
          case 3:
            this.longPollParams = null;
            return this.poll();
          default:
            throw new PollingError();
        }
      }
      for (const handler of this.pollingHandlers) {
        handler(data.ts);
      }
      for (const update of data.updates) {
        this.next(new Context(update, this));
      }
      this.poll(data.ts);
    } catch (err) {
      throw err;
    }
  }

  use(middleware: Middleware): void {
    const idx: number = this.middlewares.length;

    this.middlewares.push({
      fn: (ctx: ContextClass) => middleware(ctx, () => this.next(ctx, idx)),
    });
  }

  webhookCallback(...args: any[]) {
    const request = new Request(...args);
    if (
      request.body.type !== CONFIRMATION_TYPE
      && this.settings.secret
      && this.settings.secret !== request.body.secret
    ) {
      request.body = 'error';

      return;
    }

    if (request.body.type !== CONFIRMATION_TYPE) {
      request.body = 'ok';

      return this.next(new Context(request.body, this));
    }
    if (this.settings.confirmation) {
      request.body = this.settings.confirmation.toString();
    }
  }

  callExecute(methods: any[]) {
    for (let i = 0, j = Math.ceil(methods.length / 25); i < j; i += 1) {
      const slicedMethods = methods.slice(i * 25, i * 25 + 25);
      this.api('execute', {
        code: `return [ ${slicedMethods.map(item => item.code)} ];`,
        access_token: this.settings.token,
      })
        .then(({ response, execute_errors = [] }) => {
          execute_errors.forEach((err) => {
            console.error(`Execute Error: ${JSON.stringify(err)}`);
          });
          response.forEach((body, i) => {
            slicedMethods[i].callback.resolve(body);
          });
        })
        .catch(err => console.error(err));
    }
  }

  event(triggers: string | string[], ...middlewares: any[]) {
    this.command(triggers, ...middlewares);
  }

  on(...middlewares: any[]) {
    this.command([], ...middlewares);
  }
}

export { VkBot, Context, Markup, Session, Request, Stage, Scene, Settings, Middleware };
