import { toArray } from './utils/toArray';

import { SceneClass } from './types';

class Scene implements SceneClass {
  name: string;
  middlewares: any[];

  constructor(name: string, ...middlewares) {
    this.name = name;
    this.middlewares = middlewares.map(fn => ({ fn }));
  }

  command(botTriggers: string | string[] | RegExp, ...middlewares: any[]) {
    const triggers = toArray(botTriggers)
      .map(item => (item instanceof RegExp ? item : item.toLowerCase()));

    this.middlewares.push(
      ...middlewares.map(fn => ({
        fn,
        triggers,
      })),
    );
  }
}

export { Scene };
