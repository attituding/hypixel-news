import type { ClientCommand } from '../@types/client';
import type { WebhookEditMessageOptions } from 'discord.js';
import { BetterEmbed } from '../utility/utility';
import { Constants } from '../utility/Constants';
import { Database } from '../utility/database';
import { Log } from '../utility/Log';

export const properties: ClientCommand['properties'] = {
    name: 'config',
    description: 'Configure the bot.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'config',
        description: 'Toggles dynamic settings',
        options: [
            {
                name: 'core',
                type: 1,
                description: 'Toggle the core',
            },
            {
                name: 'devmode',
                type: 1,
                description: 'Toggle Developer Mode',
            },
            {
                name: 'interval',
                description: 'Set the RSS fetch interval',
                type: 1,
                options: [
                    {
                        name: 'milliseconds',
                        type: 4,
                        description: 'The timeout in milliseconds',
                        required: true,
                        minValue: 180000,
                        maxValue: 3600000,
                    },
                ],
            },
            {
                name: 'restrequesttimeout',
                description: 'Set the request timeout before an abort error is thrown',
                type: 1,
                options: [
                    {
                        name: 'milliseconds',
                        type: 4,
                        description: 'The timeout in milliseconds',
                        required: true,
                        minValue: 0,
                        maxValue: 100000,
                    },
                ],
            },
            {
                name: 'retrylimit',
                description: 'Set the number of request retries before throwing',
                type: 1,
                options: [
                    {
                        name: 'limit',
                        type: 4,
                        description: 'The number of retries',
                        required: true,
                        minValue: 0,
                        maxValue: 100,
                    },
                ],
            },
            {
                name: 'view',
                description: 'View the current configuration',
                type: 1,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
): Promise<void> => {
    const { i18n } = interaction;

    const payload: WebhookEditMessageOptions = {};

    const client = interaction.client;

    switch (interaction.options.getSubcommand()) {
        case 'core':
            await coreCommand();
            break;
        case 'devmode':
            await devModeCommand();
            break;
        case 'interval':
            await interval();
            break;
        case 'restrequesttimeout':
            await restRequestTimeoutCommand();
            break;
        case 'retrylimit':
            await retryLimitCommand();
            break;
        case 'view':
            viewCommand();
            break;
        //no default
    }

    async function coreCommand() {
        client.config.core = !client.config.core;

        await Database.query(
            'UPDATE config SET config = $1 WHERE index = 0',
            [client.config],
        );

        const coreEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(i18n.getMessage('commandsConfigCoreTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigCoreDescription', [
                    client.config.core === true
                        ? i18n.getMessage('on')
                        : i18n.getMessage('off'),
                ]),
            );

        payload.embeds = [coreEmbed];

        Log.interaction(interaction, coreEmbed.description);
    }

    async function devModeCommand() {
        client.config.devMode = !client.config.devMode;

        await Database.query(
            'UPDATE config SET config = $1 WHERE index = 0',
            [client.config],
        );

        const devModeEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(i18n.getMessage('commandsConfigDevModeTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigDevModeDescription', [
                    client.config.devMode === true
                        ? i18n.getMessage('on')
                        : i18n.getMessage('off'),
                ]),
            );

        payload.embeds = [devModeEmbed];

        Log.interaction(interaction, devModeEmbed.description);
    }

    async function interval() {
        const milliseconds = interaction.options.getInteger(
            'milliseconds',
            true,
        );

        client.config.interval = milliseconds;

        await Database.query(
            'UPDATE config SET config = $1 WHERE index = 0',
            [client.config],
        );

        const intervalEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(i18n.getMessage('commandsConfigIntervalTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigIntervalDescription', [
                    milliseconds,
                ]),
            );

        payload.embeds = [intervalEmbed];

        Log.interaction(interaction, intervalEmbed.description);
    }

    async function restRequestTimeoutCommand() {
        const milliseconds = interaction.options.getInteger(
            'milliseconds',
            true,
        );

        client.config.restRequestTimeout = milliseconds;

        await Database.query(
            'UPDATE config SET config = $1 WHERE index = 0',
            [client.config],
        );

        const keyPercentageEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(i18n.getMessage('commandsConfigRestRequestTimeoutTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigRestRequestTimeoutDescription', [
                    milliseconds,
                ]),
            );

        payload.embeds = [keyPercentageEmbed];

        Log.interaction(interaction, keyPercentageEmbed.description);
    }

    async function retryLimitCommand() {
        const limit = interaction.options.getInteger(
            'limit',
            true,
        );

        client.config.retryLimit = limit;

        await Database.query(
            'UPDATE config SET config = $1 WHERE index = 0',
            [client.config],
        );

        const keyPercentageEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(i18n.getMessage('commandsConfigRetryLimitTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigRetryLimitDescription', [limit]),
            );

        payload.embeds = [keyPercentageEmbed];

        Log.interaction(interaction, keyPercentageEmbed.description);
    }

    function viewCommand() {
        const viewEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(i18n.getMessage('commandsConfigViewTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigViewDescription', [
                    client.config.core === true
                        ? i18n.getMessage('on')
                        : i18n.getMessage('off'),
                    client.config.devMode === true
                        ? i18n.getMessage('on')
                        : i18n.getMessage('off'),
                    client.config.interval,
                    client.config.restRequestTimeout,
                    client.config.retryLimit,
                ]),
            );

        payload.embeds = [viewEmbed];
    }

    await interaction.editReply(payload);
};