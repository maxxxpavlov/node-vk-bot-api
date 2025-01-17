import { expect } from 'chai';
import { VkBot } from '../lib';
import { sendRequest } from './config';

const bot = new VkBot({
  token: 'TOKEN',
  confirmation: 'CONFIRMATION',
});

describe('webhooks', () => {
  describe('unit', () => {
    it('should return webhook callback', () => {
      expect(bot.webhookCallback).to.be.a('function');
    });
  });

  describe('e2e', () => {
    it('should send confirmation for express request', () => {
      const { res } = sendRequest(
        'express',
        {
          type: 'confirmation',
          object: {}
        },
        bot,
      );

      expect(res.body).to.be.equal(bot.settings.confirmation);
    });

    it('should send confirmation for koa request', () => {
      const { res } = sendRequest(
        'koa',
        {
          type: 'confirmation',
          object: {}
        },
        bot,
      );

      expect(res.body).to.be.equal(bot.settings.confirmation);
    });

    it('should send ok for express request', () => {
      const { res } = sendRequest(
        'express',
        {
          type: 'message_new',
          object: {}
        },
        bot,
      );

      expect(res.body).to.be.equal('ok');
    });

    it('should send ok for koa request', () => {
      const { res } = sendRequest(
        'koa',
        {
          type: 'message_new',
          object: {}

        },
        bot,
      );

      expect(res.body).to.be.equal('ok');
    });

    it('should send not ok for express request with invalid secret key', () => {
      // setup bot via secret key
      bot.settings.secret = 'SECRET';

      const { res } = sendRequest(
        'koa',
        {
          type: 'message_new',
          object: {}

        },
        bot,
      );

      expect(res.body).to.be.not.equal('ok');
    });

    it('should send not ok for koa request with invalid secret key', () => {
      const { res } = sendRequest(
        'koa',
        {
          type: 'message_new',
          object: {}
        },
        bot,
      );

      expect(res.body).to.be.not.equal('ok');
    });

    it('should send ok for express request with valid secret key', () => {
      const { res } = sendRequest(
        'express',
        {
          type: 'message_new',
          secret: bot.settings.secret,
          object: {}
        },
        bot,
      );

      expect(res.body).to.be.equal('ok');
    });

    it('should send ok for koa request with valid secret key', () => {
      const { res } = sendRequest(
        'koa',
        {
          type: 'message_new',
          secret: bot.settings.secret,
          object: {}
        },
        bot,
      );

      expect(res.body).to.be.equal('ok');
    });
  });
});
