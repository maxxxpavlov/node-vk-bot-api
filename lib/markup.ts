const KEYBOARD_COLUMNS_MAX = 4;

interface MarkupClass {
  __keyboard: any;
}
interface ButtonClass {
  color?: 'default' | 'primary' | 'negative' | 'positive' | string;
  action?: any;
  label?: string;
}

class Markup implements MarkupClass {
  __keyboard: any;
  keyboard(buttons: any[], options = { columns: KEYBOARD_COLUMNS_MAX }) {
    this.__keyboard = {
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

  oneTime(idOneTime = true) {
    this.__keyboard.one_time = idOneTime;

    return this;
  }

  toJSON() {
    return JSON.stringify(this.__keyboard);
  }

  static keyboard(keyboard: any[], options = { columns: KEYBOARD_COLUMNS_MAX }) {
    return new Markup().keyboard(keyboard, options);
  }

  static button(label: string | any[],
    color: 'default' | 'primary' | 'negative' | 'positive' | string = 'default', payload: any = { button: label }) {
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

export default Markup;
