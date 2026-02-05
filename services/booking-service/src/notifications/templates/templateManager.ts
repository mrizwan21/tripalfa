import Handlebars from 'handlebars';
import { Notification } from '../interfaces.js';

export class TemplateManager {
  render(template: string, data: Record<string, any>): string {
    try {
      const tpl = Handlebars.compile(template);
      return tpl(data);
    } catch (err) {
      console.error('[TemplateManager] render error', err);
      return template;
    }
  }

  buildNotification(titleTpl: string, messageTpl: string, data: Record<string, any>): Partial<Notification> {
    return {
      title: this.render(titleTpl, data),
      message: this.render(messageTpl, data),
    };
  }
}
