import type { config as Config } from '@prisma/client';
import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import { ApplicationCommandOptionType, type ChatInputCommandInteraction } from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Options } from '../utility/Options';

export class ConfigCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'config',
            description: 'Configure and change settings',
            cooldownLimit: 0,
            cooldownDelay: 0,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'OwnerOnly'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'core',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: 'Toggle the core',
                },
                {
                    name: 'devmode',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: 'Toggle Developer Mode',
                },
                {
                    name: 'interval',
                    description: 'Set the RSS fetch interval',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'milliseconds',
                            type: ApplicationCommandOptionType.Integer,
                            description: 'The interval in milliseconds',
                            required: true,
                            minValue: 60,
                            maxValue: 3600000,
                        },
                    ],
                },
                {
                    name: 'loglevel',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: 'Set the minimum severity for logs to appear',
                    options: [
                        {
                            name: 'level',
                            type: ApplicationCommandOptionType.Integer,
                            description: 'The minimum level for logs to appear',
                            required: true,
                            choices: [
                                {
                                    name: 'Trace',
                                    value: 10,
                                },
                                {
                                    name: 'Debug',
                                    value: 20,
                                },
                                {
                                    name: 'Info',
                                    value: 30,
                                },
                                {
                                    name: 'Warn',
                                    value: 40,
                                },
                                {
                                    name: 'Error',
                                    value: 50,
                                },
                                {
                                    name: 'Fatal',
                                    value: 60,
                                },
                                {
                                    name: 'None',
                                    value: 100,
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'ownerguilds',
                    description: 'Set the guild(s) where owner commands should be set',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'guilds',
                            type: ApplicationCommandOptionType.String,
                            description: 'The Ids of the guilds separated by a comma (no spaces)',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'owners',
                    description: 'Set the application owner(s)',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'owners',
                            type: ApplicationCommandOptionType.String,
                            description: 'The Ids of the owners separated by a comma (no spaces)',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'requesttimeout',
                    description: 'Set the request timeout before an abort error is thrown',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'milliseconds',
                            type: ApplicationCommandOptionType.Integer,
                            description: 'The timeout in milliseconds',
                            required: true,
                            minValue: 0,
                            maxValue: 100000,
                        },
                    ],
                },
                {
                    name: 'requestretrylimit',
                    description: 'Set the number of request retries before throwing',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'limit',
                            type: ApplicationCommandOptionType.Integer,
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
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'core':
                await this.core(interaction);
                break;
            case 'devmode':
                await this.devMode(interaction);
                break;
            case 'interval':
                await this.interval(interaction);
                break;
            case 'loglevel':
                await this.logLevel(interaction);
                break;
            case 'restrequesttimeout':
                await this.requestTimeout(interaction);
                break;
            case 'retrylimit':
                await this.requestRetryLimit(interaction);
                break;
            case 'ownerguilds':
                await this.ownerGuilds(interaction);
                break;
            case 'owners':
                await this.owners(interaction);
                break;
            case 'view':
                await this.view(interaction);
                break;
            default:
                throw new RangeError();
        }
    }

    public async core(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        await this.handleConfigUpdate(
            interaction,
            'core',
            this.container.config.core === false,
            i18n.getMessage('commandsConfigCoreTitle'),
            i18n.getMessage('commandsConfigCoreDescription', [
                this.container.config.core === false
                    ? i18n.getMessage('on')
                    : i18n.getMessage('off'),
            ]),
        );
    }

    private async devMode(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        await this.handleConfigUpdate(
            interaction,
            'devMode',
            this.container.config.devMode === false,
            i18n.getMessage('commandsConfigDevModeTitle'),
            i18n.getMessage('commandsConfigDevModeDescription', [
                this.container.config.devMode === false
                    ? i18n.getMessage('on')
                    : i18n.getMessage('off'),
            ]),
        );
    }

    public async interval(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const milliseconds = interaction.options.getInteger('milliseconds', true);

        await this.handleConfigUpdate(
            interaction,
            'interval',
            milliseconds,
            i18n.getMessage('commandsConfigIntervalTitle'),
            i18n.getMessage('commandsConfigIntervalDescription', [milliseconds]),
        );
    }

    private async logLevel(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const level = interaction.options.getInteger('level', true);

        await this.handleConfigUpdate(
            interaction,
            'logLevel',
            level,
            i18n.getMessage('commandsConfigLogLevelTitle'),
            i18n.getMessage('commandsConfigLogLevelDescription', [level]),
        );

        // @ts-ignore
        this.container.logger.level = this.container.config.logLevel;
    }

    private async ownerGuilds(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const guilds = interaction.options.getString('guilds', true).split(',');

        await this.handleConfigUpdate(
            interaction,
            'ownerGuilds',
            guilds,
            i18n.getMessage('commandsConfigOwnerGuildsTitle'),
            i18n.getMessage('commandsConfigOwnerGuildsDescription', [guilds.join(', ')]),
        );
    }

    private async owners(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const owners = interaction.options.getString('owners', true).split(',');

        await this.handleConfigUpdate(
            interaction,
            'owners',
            owners,
            i18n.getMessage('commandsConfigOwnersTitle'),
            i18n.getMessage('commandsConfigOwnersDescription', [owners.join(', ')]),
        );
    }

    private async requestTimeout(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const milliseconds = interaction.options.getInteger('milliseconds', true);

        await this.handleConfigUpdate(
            interaction,
            'requestTimeout',
            milliseconds,
            i18n.getMessage('commandsConfigRequestTimeoutTitle'),
            i18n.getMessage('commandsConfigRequestTimeoutDescription', [milliseconds]),
        );
    }

    private async requestRetryLimit(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const limit = interaction.options.getInteger('limit', true);

        await this.handleConfigUpdate(
            interaction,
            'requestRetryLimit',
            limit,
            i18n.getMessage('commandsConfigRequestRetryLimitTitle'),
            i18n.getMessage('commandsConfigRequestRetryLimitDescription', [limit]),
        );
    }

    private async view(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const { config } = this.container;

        const viewEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigViewTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigViewDescription', [
                    config.core === true ? i18n.getMessage('on') : i18n.getMessage('off'),
                    config.devMode === true ? i18n.getMessage('on') : i18n.getMessage('off'),
                    config.interval,
                    config.logLevel,
                    config.ownerGuilds.join(', '),
                    config.owners.join(', '),
                    config.requestTimeout,
                    config.requestRetryLimit,
                ]),
            );

        await interaction.editReply({ embeds: [viewEmbed] });
    }

    private async handleConfigUpdate(
        interaction: ChatInputCommandInteraction,
        key: keyof Config,
        value: typeof this.container.config[typeof key],
        title: string,
        description: string,
    ) {
        // @ts-ignore
        this.container.config[key] = value;

        await this.container.database.config.update({
            data: {
                [key]: this.container.config[key],
            },
            where: {
                index: 0,
            },
        });

        const configEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(title)
            .setDescription(description);

        await interaction.editReply({ embeds: [configEmbed] });

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            `${key} is now ${this.container.config[key]}.`,
        );
    }
}
