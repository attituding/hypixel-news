import { type Guild } from 'discord.js';
import { Listener } from '@sapphire/framework';
import { ErrorHandler } from '../errors/ErrorHandler';
import { Events } from '../enums/Events';
import {
    formattedUnix,
    setPresence,
} from '../utility/utility';

export class RateLimitListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.GuildDelete,
        });
    }

    public run(guild: Guild) {
        if (
            guild.available === false
            || !guild.client.isReady()
        ) {
            return;
        }

        const joinedAt = formattedUnix({
            ms: guild.joinedTimestamp,
            date: true,
            utc: true,
        })!;

        this.container.logger.info(
            this.container.i18n.getMessage(
                'eventsGuildDelete', [
                    joinedAt,
                    guild.name,
                    guild.id,
                    guild.ownerId,
                    guild.memberCount - 1,
                ],
            ),
        );

        try {
            setPresence();
        } catch (error) {
            new ErrorHandler(error).init();
        }
    }
}