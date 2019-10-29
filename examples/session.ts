import { VkBot, Session } from '../lib';

const bot = new VkBot(process.env.TOKEN);
const session = new Session();

bot.use(session.middleware());

bot.on((ctx) => {
  ctx.session.counter = ctx.session.counter || 0;
  ctx.session.counter += 1;

  ctx.reply(`You wrote ${ctx.session.counter} messages.`);
});

bot.startPolling();
