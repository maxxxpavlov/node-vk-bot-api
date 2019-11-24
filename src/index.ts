import EventEmitter from 'events';
import { Settings, ContextClass, PollingParams, MarkupClass, Middleware, pollHandler } from './types';
import axios from 'axios';
import { stringify } from 'querystring';
import { Context } from './context';
import { Request } from './request';
import { toArray } from './utils/toArray';
import { uploadPhoto } from './utils/uploadPhoto';
import { Markup } from './markup';
import { Scene } from './scene';
import { Session } from './session';
import { Stage } from './stage';

const CONFIRMATION_TYPE = 'confirmation';
const defaultSettings = {
  polling_timeout: 25,
  execute_timeout: 50,
  v: '5.103',
  pollingVersion: 3
};

class PollingError extends Error { }

/*
  Create vk bot instance
*/

class VkBot extends EventEmitter {
  middlewares: any[];
  methods: any[];
  settings: Settings;
  longPollParams: PollingParams | null;
  pollingHandlers: pollHandler[] = [];

  constructor(userSettings: string | Settings) {
    super();
    if (!userSettings) {
      throw new Error('You must pass token into settings');
    } else if (typeof userSettings === 'object' && !userSettings.token) {
      throw new Error('You must set token param in settings');
    }

    this.middlewares = [];
    this.methods = [];

    if (typeof userSettings === 'object') {
      this.settings = {
        ...defaultSettings,
        ...userSettings
      };
    } else {
      this.settings = {
        ...defaultSettings,
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
        ...settings,
        v: this.settings.v
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

    for (const fn of middlewares) {
      const idx = this.middlewares.length;

      this.middlewares.push({
        triggers,
        fn: (ctx: ContextClass) => fn(ctx, () => this.next(ctx, idx)),
      });
    }
  }

  execute(method: string, settings: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.methods.push({
        callback: { resolve, reject },
        code: `API.${method}(${JSON.stringify({
          ...settings,
          v: this.settings.v
        })})`,
      });
    });
  }

  getLongPollParams(): Promise<PollingParams> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.settings.group_id) {
          const { response } = await this.api('groups.getById', {
            access_token: this.settings.token,
            v: this.settings.v
          }).catch((err) => {
            this.emit('error', err);
            reject(err);
          });
          this.settings.group_id = response[0].id;
        }
      } catch (err) {
        reject(err);
        return;
      }
      this.api('groups.getLongPollServer', {
        group_id: this.settings.group_id,
        access_token: this.settings.token,
        v: this.settings.v
      }).then(({ response }) => {
        resolve(response);
      }).catch((err) => {
        const { error } = JSON.parse(err.toString());
        reject(error);
      });
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

  sendMessage(userId: number | number[],
    message: string | undefined | null = null,
    attachment: string | undefined | null | Buffer = null,
    keyboard: null | MarkupClass = null,
    sticker: null | string | undefined = null): Promise<{ id: number, img: any[] }> {
    return new Promise((resolve, reject) => {
      const userIds = toArray(userId);
      if (userIds.length > 100) {
        reject('Message can\'t be sent to more than 100 recipients.');
        return;
      }
      const attachments: Buffer[] | string[] = toArray(attachment);
      const randomId = Math.random() * (1000000000 - 1) + 1;
      let uploaded: Promise<any>;
      if (attachments[0] instanceof Buffer) {
        if (attachments.length > 10) {
          return reject('Too many attachments');
        }
        uploaded = uploadPhoto(this, Array.isArray(userId) ? userId[0] : userId, <Buffer[]>attachments);
      } else {
        uploaded = Promise.resolve(null);
      }
      uploaded.then((img: any[] | null) => {
        const imageIDs = img ? img.reduce(ids => `${ids},photo${img[0].owner_id}_${img[0].id}`, '') : null;

        this.execute('messages.send', {
          message,
          user_ids: userIds.join(','),
          attachment: imageIDs ? imageIDs : toArray(attachment).join(','),
          sticker_id: sticker,
          keyboard: keyboard ? keyboard.toJSON() : undefined,
          random_id: randomId
        }).then((id) => {
          resolve({ id, img });
        });
      }).catch((err) => {
        this.emit('error', err);
      });
    });
  }

  startPolling(ts: number = 0): void {
    this.getLongPollParams().then((params) => {
      this.emit('startPoll');
      this.longPollParams = params;
      this.poll(ts);
    }).catch((err) => {
      this.emit('error', new PollingError());
    });
  }

  poll(ts: number = 0) {
    axios.get(this.longPollParams.server, {
      params: {
        ...this.longPollParams,
        ts,
        act: 'a_check',
        wait: this.settings.polling_timeout,
        version: this.settings.pollingVersion
      },
    }).then(({ data }) => {
      if (data.failed) {
        switch (data.failed) {
          case 1:
            return this.poll(data.ts);
          case 2:
            return this.startPolling(ts);
          case 3:
            return this.startPolling(ts);
          default:
            return this.emit('error', new PollingError());
        }
      }
      this.poll(data.ts);
      this.emit('poll', parseInt(data.ts, 10));
      data.updates.forEach((update: any) => {
        this.next(new Context(update, this));
      });
    }).catch((err) => {
      this.emit('error', new PollingError(err));
      this.startPolling(ts);
    });

  }

  use(...middlewares: Middleware[]): void {
    for (const middleware of middlewares) {
      const idx: number = this.middlewares.length;

      this.middlewares.push({
        fn: (ctx: ContextClass) => middleware(ctx, () => this.next(ctx, idx)),
      });
    }
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
        code: `return [${slicedMethods.map(item => item.code)}]; `,
        access_token: this.settings.token,
      })
        .then(({ response, execute_errors = [] }) => {
          execute_errors.forEach((err) => {
            this.emit('error', err);
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

  noCommand(...middlewares: any[]) {
    this.command([], ...middlewares);
  }
}

export { VkBot, Context, Markup, Session, Request, Stage, Scene, Settings, Middleware, PollingError };
