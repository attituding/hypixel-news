import type {
    ClientCommand,
    ClientEvent,
} from '../@types/client';
import {
    Collection,
    CommandInteraction,
} from 'discord.js';
import { CommandConstraintErrorHandler } from '../errors/CommandConstraintErrorHandler';
import { CommandErrorHandler } from '../errors/CommandErrorHandler';
import { Constants } from '../utility/Constants';
import { ConstraintError } from '../errors/ConstraintError';
import { i18n } from '../locales/i18n';
import { Log } from '../utility/Log';
import { slashCommandResolver } from '../utility/utility';
import process from 'node:process';

const owners = JSON.parse(process.env.OWNERS!) as string[];

export const properties: ClientEvent['properties'] = {
    name: 'interactionCreate',
    once: false,
};

export const execute: ClientEvent['execute'] = async (
    interaction: CommandInteraction,
): Promise<void> => {
    try {
        if (interaction.isCommand()) {
            interaction.i18n = new i18n(interaction.locale);

            const command: ClientCommand | undefined =
                interaction.client.commands.get(interaction.commandName);

            if (typeof command === 'undefined') {
                return;
            }

            Log.interaction(interaction, slashCommandResolver(interaction));

            await interaction.deferReply({
                ephemeral: command.properties.ephemeral &&
                    interaction.inGuild(),
            });

            devModeConstraint(interaction);
            ownerConstraint(interaction, command);
            dmConstraint(interaction, command);
            cooldownConstraint(interaction, command);

            await command.execute(
                interaction,
            );
        }
    } catch (error) {
        if (error instanceof ConstraintError) {
            await CommandConstraintErrorHandler.init(
                error,
                interaction,
            );
        } else {
            await CommandErrorHandler.init(
                error,
                interaction,
            );
        }
    }
};

function devModeConstraint(
    interaction: CommandInteraction,
) {
    const { devMode } = interaction.client.config;

    if (
        devMode === true &&
        owners.includes(interaction.user.id) === false
    ) {
        throw new ConstraintError('devMode');
    }
}

function ownerConstraint(
    interaction: CommandInteraction,
    command: ClientCommand,
) {
    const { ownerOnly } = command.properties;

    if (
        ownerOnly === true &&
        owners.includes(interaction.user.id) === false
    ) {
        throw new ConstraintError('owner');
    }
}

function dmConstraint(
    interaction: CommandInteraction,
    command: ClientCommand,
) {
    const { noDM } = command.properties;

    if (
        noDM === true &&
        !interaction.inCachedGuild()
    ) {
        throw new ConstraintError('dm');
    }
}

function cooldownConstraint(
    interaction: CommandInteraction,
    command: ClientCommand,
) {
    const { client: { cooldowns }, user } = interaction;
    const { name, cooldown } = command.properties;

    const timestamps = cooldowns.get(name);

    if (typeof timestamps === 'undefined') {
        cooldowns.set(name, new Collection());
        cooldowns.get(name)!.set(user.id, Date.now());
        return;
    }

    const expireTime = Number(timestamps.get(user.id)) + cooldown;
    const isCooldown = expireTime > (Constants.ms.second * 2.5) + Date.now();
    const timeLeft = expireTime - Date.now();

    if (isCooldown === true) {
        throw new ConstraintError('cooldown', timeLeft);
    }

    timestamps.set(user.id, Date.now());
}