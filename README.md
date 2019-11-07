# nodejs-vk-bot

🤖 VK bot framework for Node.js, based on [Bots Long Poll API](https://vk.com/dev/bots_longpoll) and [Callback API](https://vk.com/dev.php?method=callback_api). Forked from [node-vk-bot-api](https://github.com/node-vk-bot-api/node-vk-bot-api)

## Install

```sh
$ npm i nodejs-vk-bot
```

## Simple example

```typescript
import { VkBot } from "nodejs-vk-bot";

const bot = new VkBot("TOKEN");

bot.command("/start", ctx => {
  ctx.reply("Hello!");
});

bot.startPolling();
bot.once("startPoll", () => {
  console.log("Long polling started");
});
```

## Examples

[There's a few simple examples.](/examples)

## Tests

```sh
$ npm test
```

## Methods

- [constructor(settings)](#constructorsettings)
- [.use(middleware)](#usemiddleware)
- [.command(triggers, ...middlewares)](#commandtriggers-middlewares)
- [.event(triggers, ...middlewares)](#eventtriggers-middlewares)
- [.noCommand(...middlewares)](#nocommmandmiddlewares)
- [.sendMessage(userId, message, attachment, keyboard, sticker)](#sendmessageuserid-message-attachment-keyboard-sticker)
- [.startPolling()](#startpollingts)
- [.on(event, handler)](#onevent-handler)
- [.once(event, handler)](#onceevent-handler)
- [.webhookCallback(...args)](#webhookcallbackargs)

### constructor(settings)

Create bot.

```typescript
// Simple usage
const bot = new VkBot("TOKEN");

// Advanced usage
const bot = new VkBot({
  token: process.env.TOKEN,
  group_id: process.env.GROUP_ID,
  execute_timeout: process.env.EXECUTE_TIMEOUT, // in ms   (50 by default)
  polling_timeout: process.env.POLLING_TIMEOUT // in secs (25 by default),
  v: '5.103', // Vk version, we do not recomend to change it
  pollingVersion: 3  // Vk Polling version, we do not recomend to change it
});
```

### .use(middleware)

Add simple middleware.

```typescript
bot.use((ctx, next) => {
  ctx.message.timestamp = new Date().getTime();

  next();
});
```

### .command(triggers, ...middlewares)

Add middlewares with triggers for `message_new` event.

```typescript
bot.command("start", ctx => {
  ctx.reply("Hello!").then(() => {
    console.log("The message is successfuly sent");
  });
});
```

### .event(triggers, ...middlewares)

Add middlewares with triggers for selected events.

```typescript
bot.event("message_edit", ctx => {
  ctx.reply("Your message was editted");
});
```

### .noCommand(...middlewares)

Add reserved middlewares without triggers.

```typescript
bot.noCommand(ctx => {
  ctx.reply("No commands for you.");
});
```

### .sendMessage(userId, message, attachment, keyboard, sticker)

Send message to user.

```typescript
// Simple usage
bot.sendMessage(145003487, "Hello!", "photo1_1");

// Multiple recipients
bot.sendMessage([145003487, 145003488], "Hello!", "photo1_1");

// Advanced usage
bot.sendMessage(145003487, {
  message: "Hello!",
  lat: 59.939095,
  lng: 30.315868
});
```

### .startPolling(ts)

Start polling
ts is timestamp of the last event you can get events after
ts is not required

```typescript
bot.startPolling(ts);
```

### .on(event, handler)

Set event listener, useful for saving last ts to DataBase

```typescript
bot.startPolling();
bot.on("poll", ts => {
  console.log(`Poll is done, ts: ${ts}`);
});

bot.on("error", err => {
  console.log(err);
});
```

### events

startPoll - emits when polling starts
poll - when poll ends, returns ts
error - emmits error

### .once(event, handler)

Set event listener which excecutes once

```typescript
bot.startPolling();
bot.once("startPoll", ts => {
  console.log("Bot started");
});
```

## Context Methods

- [.reply(message, attachment, markup, sticker)](#replymessage-attachment-keyboard-sticker)

### .reply(message, attachment, markup, sticker)

Helper method for reply to the current user.

```typescript
bot.command("start", ctx => {
  ctx.reply("Hello!");
});
```

## Markup

### Keyboards

- `Markup.keyboard(buttons, options)`: Create keyboard
- `Markup.button(label, color, payload)`: Create custom button
- `Markup.oneTime()`: Set oneTime to keyboard
- `Markup.inline()`: Send keyboard with the message

#### Simple usage

```typescript
ctx.reply(
  "Select your sport",
  null,
  Markup.keyboard(["Football", "Basketball"]).inline()
);
```

#### Advanced usage

```typescript
ctx.reply(
  "How are you doing?",
  null,
  Markup.keyboard([
    [Markup.button("Normally", "primary")],
    [Markup.button("Fine", "positive"), Markup.button("Bad", "negative")]
  ])
);
```

### .keyboard(buttons, options)

Create keyboard with optional settings.

```js
/*

  Each string has maximum 2 columns.

  | one   | two   |
  | three | four  |
  | five  | six   |

 */

Markup.keyboard(["one", "two", "three", "four", "five", "six"], { columns: 2 });
```

```typescript
/*

  By default, columns count for each string is 4.

  | one | two | three |

 */

Markup.keyboard(["one", "two", "three"]);
```

### .button(label, color, payload)

Create custom button.

```typescript
Markup.button("Start", "positive", {
  foo: "bar"
});
```

### .oneTime()

Helper method for create one time keyboard.

```typescript
Markup.keyboard(["Start", "Help"]).oneTime();
```

### .inline()

Send keyboard in message box

```typescript
Markup.keyboard(["test", "Help"]).inline();
```

## Sessions

Store anything for current user in local (or [redis](https://github.com/nodejs-vk-bot/nodejs-vk-bot-session-redis)) memory.

### Usage

```typescript
import { VkBot } from "nodejs-vk-bot";
import Session from "nodejs-vk-bot/lib/session";

const bot = new VkBot(process.env.TOKEN);
const session = new Session();

bot.use(session.middleware());

bot.on(ctx => {
  ctx.session.counter = ctx.session.counter || 0;
  ctx.session.counter++;

  ctx.reply(`You wrote ${ctx.session.counter} messages.`);
});

bot.startPolling();
```

### API

#### Options

- `key`: Context property name (default: `session`)
- `getSessionKey`: Getter for session key

##### Default `getSessionKey(ctx)`

```typescript
const getSessionKey = ctx => {
  const userId = ctx.message.from_id || ctx.message.user_id;

  return `${userId}:${userId}`;
};
```

## Stage

Scene manager.

```typescript
import { VkBot } from "nodejs-vk-bot";
import { Scene } from "nodejs-vk-bot/lib/scene";
import { Session } from "nodejs-vk-bot/lib/session";
import { Stage } from "nodejs-vk-bot/lib/stage";

const bot = new VkBot(process.env.TOKEN);
const scene = new Scene(
  "meet",
  ctx => {
    ctx.scene.next();
    ctx.reply("How old are you?");
  },
  ctx => {
    ctx.session.age = +ctx.message.text;

    ctx.scene.next();
    ctx.reply("What is your name?");
  },
  ctx => {
    ctx.session.name = ctx.message.text;

    ctx.scene.leave();
    ctx.reply(
      `Nice to meet you, ${ctx.session.name} (${ctx.session.age} years old)`
    );
  }
);
const session = new Session();
const stage = new Stage(scene);

bot.use(session.middleware());
bot.use(stage.middleware());

bot.command("/meet", ctx => {
  ctx.scene.enter("meet");
});

bot.startPolling();
```

### API

#### Stage

- `constructor(...scenes)`: Register scenes

#### Scene

- `constructor(name, ...middlewares)`: Create scene
- `.command(triggers, ...middlewares)`: Create commands for scene

#### Context

```typescript
ctx.scene.enter(name, [step]) // Enter in scene
ctx.scene.leave()             // Leave from scene
ctx.scene.next()              // Go to the next step in scene
ctx.scene.step                // Getter for step in scene
ctx.scene.step=               // Setter for step in scene
```

## License

MIT.
