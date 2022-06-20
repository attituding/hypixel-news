import {
    Constants,
    MessageActionRow,
    MessageButton,
} from 'discord.js';
import { Base } from '../structures/Base';
import { type RssJSON } from './Format';

export class Components extends Base {
    public create(data: RssJSON) {
        const rows: MessageActionRow[] = [];

        data.items.forEach((item) => {
            const button = new MessageButton()
                .setLabel(
                    this.container.i18n.getMessage(
                        'coreComponentsButtonsReadMoreLabel',
                    ),
                )
                .setStyle(Constants.MessageButtonStyles.LINK)
                .setURL(item.link);

            const row = new MessageActionRow()
                .setComponents(button);

            rows.unshift(row);
        });

        return rows;
    }
}