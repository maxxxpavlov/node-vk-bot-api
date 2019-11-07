import { VkBot } from '../lib';

const bot = new VkBot(process.env.TOKEN);

bot.noCommand((ctx) => {
  ctx.reply('Hello!');
});

bot.once('startPoll', () => {
  console.log('Bot is started');
});
bot.on('error', (err) => {
  console.log(err); // Don't forget to handle errors!
});

bot.startPolling();
