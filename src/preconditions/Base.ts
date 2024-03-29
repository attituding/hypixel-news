import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { i18n } from '../locales/i18n';

export class BasePrecondition extends Precondition {
    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        return this.command(interaction);
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
        return this.command(interaction);
    }

    private async command(
        interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
    ) {
        Object.defineProperty(interaction, 'i18n', {
            value: new i18n(interaction.locale),
        });

        await interaction.deferReply({
            ephemeral: true,
        });

        return this.ok();
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        Base: never;
    }
}

declare module 'discord.js' {
    interface BaseInteraction {
        i18n: i18n;
    }
}
