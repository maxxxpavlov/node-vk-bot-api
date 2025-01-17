const KEYBOARD_COLUMNS_MAX = 4;

import { MarkupClass, ButtonColor } from './types';


class Markup implements MarkupClass {
  rawKeyboard: any;
  keyboard(buttons: any[], options = { columns: KEYBOARD_COLUMNS_MAX }) {
    this.rawKeyboard = {
      buttons: Array.isArray(buttons[0])
        ? buttons
        : buttons.reduce((array: any[], label: string) => {
          const button = Markup.button(label);
          const buttons = array.length ? array[array.length - 1] : array[0];

          if (buttons && buttons.length < options.columns) {
            buttons.push(button);
          } else {
            array.push([button]);
          }

          return array;
        }, []),
    };

    return this;
  }

  oneTime(isOneTime = true) {
    this.rawKeyboard.one_time = isOneTime;
    return this;
  }

  inline(isInline = true) {
    this.rawKeyboard.inline = isInline;
    return this;
  }

  toJSON() {
    return JSON.stringify(this.rawKeyboard);
  }

  static keyboard(keyboard: any[], options = { columns: KEYBOARD_COLUMNS_MAX }) {
    return new Markup().keyboard(keyboard, options);
  }

  static button(label: string | any,
    color: ButtonColor = 'default', payload: any = { button: label }) {
    if (typeof label === 'object') {
      return label;
    }

    return {
      color,
      action: {
        label,
        type: 'text',
        payload: JSON.stringify(payload),
      },
    };
  }
}

export { Markup };
