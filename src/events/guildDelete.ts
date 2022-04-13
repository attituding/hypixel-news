import type { ClientEvent } from '../@types/client';
import type { Guild } from 'discord.js';
import { ErrorHandler } from '../utility/errors/ErrorHandler';
import {
    formattedUnix,
    setPresence,
} from '../utility/utility';
import { Log } from '../utility/Log';

export const properties: ClientEvent['properties'] = {
    name: 'guildDelete',
    once: false,
};

export const execute: ClientEvent['execute'] = async (guild: Guild): Promise<void> => {
    if (
        guild.available === false ||
        !guild.client.isReady()
    ) {
        return;
    }

    const joinedAt = formattedUnix({
        ms: guild.joinedTimestamp,
        date: true,
        utc: true,
    });

    Log.log(
        `Bot has left a guild; joined ${joinedAt}. Guild: ${
            guild.name
        } | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${
            guild.memberCount - 1
        } (new count)`,
    );

    try {
        setPresence(guild.client);
    } catch (error) {
        await ErrorHandler.init(error);
    }
};