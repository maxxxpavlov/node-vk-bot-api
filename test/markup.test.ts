import { expect } from 'chai';
import { Markup } from '../lib/markup';

describe('markup', () => {
  const test = (keyboard, oneTime, buttons) => {
    expect(keyboard.rawKeyboard).to.be.an('object');
    expect(keyboard.rawKeyboard.buttons[0]).to.be.an('array').to.have.length(buttons.length);

    if (oneTime) {
      expect(keyboard.rawKeyboard.one_time).to.be.equal(oneTime);
    }

    keyboard.rawKeyboard.buttons[0].forEach((button, index) => {
      const sourceButton = buttons[index];

      expect(button).to.be.an('object');
      expect(button.action).to.be.an('object');
      expect(button.action.type).to.be.equal('text');

      if (typeof sourceButton === 'string') {
        expect(button.color).to.be.equal('default');
        expect(button.action.payload).to.be.equal(JSON.stringify({ button: sourceButton }));
        expect(button.action.label).to.be.equal(sourceButton);
      } else {
        expect(button.color).to.be.equal(sourceButton.color);
        expect(button.action.payload).to.be.equal(JSON.stringify(sourceButton.payload));
        expect(button.action.label).to.be.equal(sourceButton.label);
      }
    });
  };

  it('should create simple keyboard', () => {
    const buttons = ['one', 'two', 'three'];
    const keyboard = Markup.keyboard(buttons);

    test(keyboard, false, buttons);
  });

  it('should create one time simple keyboard', () => {
    const buttons = ['one'];
    const keyboard = Markup.keyboard(buttons).oneTime();

    test(keyboard, true, buttons);
  });

  it('should create advanced keyboard', () => {
    const buttons = [
      {
        label: 'One',
        color: 'negative',
        payload: {
          foo: 'bar',
        },
      },
      {
        label: 'Two',
        color: 'positive',
        payload: {
          bar: 'beez',
        },
      },
    ];

    const keyboard = Markup.keyboard(
      // @ts-ignore
      buttons.map(item => Markup.button(item.label, item.color, item.payload)),
    );

    test(keyboard, false, buttons);
  });

  it('should create new keyboard and not crash first keyboard', () => {
    const buttons = ['one', 'two'];
    const keyboard = Markup.keyboard(buttons);

    test(keyboard, false, buttons);

    // create new keyboard and crash first
    Markup.keyboard(['Crash']);

    test(keyboard, false, buttons);
  });

  it('should create keyboard with two strings', () => {
    const buttons = ['one', 'two', 'three', 'four', 'five', 'six'];
    const keyboard = Markup.keyboard(buttons);

    expect(keyboard.rawKeyboard.buttons).to.be.an('array').to.have.length(2);
    expect(keyboard.rawKeyboard.buttons[0]).to.be.an('array').to.have.length(4);
    expect(keyboard.rawKeyboard.buttons[1]).to.be.an('array').to.have.length(2);
  });
});
