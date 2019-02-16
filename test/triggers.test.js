const { expect } = require('chai');
const VkBot = require('../lib');

const bot = new VkBot('TOKEN');

describe('triggers', () => {
  beforeEach(() => {
    bot.middlewares = [];
  });

  describe('unit', () => {
    it('should define valid text trigger', () => {
      bot.command('Start', () => {});

      expect(bot.middlewares[0]).to.be.an('object');
      expect(bot.middlewares[0].fn).to.be.a('function');
      expect(bot.middlewares[0].triggerType).to.be.a('string').and.equal('text');
      expect(bot.middlewares[0].triggers).to.be.an('array').and.to.have.length(1);
      expect(bot.middlewares[0].triggers[0]).to.be.a('string');
    });

    it('should define valid button trigger', () => {
      bot.button({ command: 'start' }, () => {});

      expect(bot.middlewares[0]).to.be.an('object');
      expect(bot.middlewares[0].fn).to.be.a('function');
      expect(bot.middlewares[0].triggerType).to.be.a('string').and.equal('payload');
      expect(bot.middlewares[0].triggers).to.be.an('array').and.to.have.length(1);
      expect(bot.middlewares[0].triggers[0]).to.be.an('object').and.satisfy(
        value => JSON.stringify(value) === JSON.stringify({ command: 'start' }),
      );
    });
  });

  describe('e2e', () => {
    it('should match text trigger', (done) => {
      bot.command(/[sс]t?a[Rр]t/g, () => done());
      bot.next({
        message: {
          type: 'message_new',
          text: 'сaRt',
        },
      });
    });

    it('should execute button trigger and not text', (done) => {
      bot.command({ command: 'start' }, () => {
        throw new Error('text trigger was called');
      });

      bot.button({ command: 'start' }, () => {
        done();
      });

      bot.next({
        message: {
          type: 'message_new',
          text: 'Start',
          payload: JSON.stringify({ command: 'start' }),
        },
      });
    });
  });
});
