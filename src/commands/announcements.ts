import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    ApplicationCommandOptionType,
    channelMention,
    ChannelType,
    ChatInputCommandInteraction,
    type NewsChannel,
    PermissionFlagsBits,
    type TextChannel,
} from 'discord.js';
import type { Category } from '../@types/Category';
import { Time } from '../enums/Time';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Options } from '../utility/Options';

export class AnnouncementsCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'announcements',
            description: 'Configure what announcements you want to receive',
            cooldownLimit: 3,
            cooldownDelay: Time.Second * 10,
            cooldownScope: BucketScope.Guild,
            preconditions: ['Base', 'DevMode', 'GuildOnly'],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'general',
                    description: 'General Hypixel News and Announcements',
                    type: 1,
                    options: [
                        {
                            name: 'channel',
                            type: ApplicationCommandOptionType.Channel,
                            channel_types: [ChannelType.GuildText],
                            description:
                                'The channel where Hypixel News and Announcements should be toggled',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'skyblock',
                    description: 'SkyBlock Patch Notes',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            type: ApplicationCommandOptionType.Channel,
                            channel_types: [ChannelType.GuildText],
                            description: 'The channel where SkyBlock Patch Notes should be toggled',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'moderation',
                    description: 'Moderation Information and Changes',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            type: ApplicationCommandOptionType.Channel,
                            channel_types: [ChannelType.GuildText],
                            description:
                                'The channel where Moderation Information and Changes should be toggled',
                            required: true,
                        },
                    ],
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild()) {
            return;
        }

        const { i18n } = interaction;

        const channel = interaction.options.getChannel('channel', true) as TextChannel;

        const userHasPermission = channel
            .permissionsFor(interaction.member)
            .has([PermissionFlagsBits.ManageWebhooks]);

        if (userHasPermission === false) {
            const missingPermission = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsAnnouncementsUserMissingPermissionTitle'))
                .setDescription(
                    i18n.getMessage('commandsAnnouncementsUserMissingPermissionDescription'),
                );

            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                'User missing permission.',
            );

            await interaction.editReply({
                embeds: [missingPermission],
            });

            return;
        }

        const botMissingPermissions = channel
            .permissionsFor(interaction.guild.members.me!)
            .missing([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageWebhooks]);

        if (botMissingPermissions.length !== 0) {
            const missingPermission = new BetterEmbed(interaction)
                .setColor(Options.colorsWarning)
                .setTitle(i18n.getMessage('commandsAnnouncementsBotMissingPermissionTitle'))
                .setDescription(
                    i18n.getMessage('commandsAnnouncementsBotMissingPermissionDescription', [
                        botMissingPermissions.join(', '),
                    ]),
                );

            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                'Bot missing permission.',
            );

            await interaction.editReply({
                embeds: [missingPermission],
            });

            return;
        }

        let type: Category;

        switch (interaction.options.getSubcommand()) {
            case 'general':
                type = 'News and Announcements';
                break;
            case 'skyblock':
                type = 'SkyBlock Patch Notes';
                break;
            default:
                type = 'Moderation Information and Changes';
        }

        const announcementChannelId = this.container.categories.find(
            (category) => category.category === type,
        )!.channelId;

        const oldWebhooks = await channel.fetchWebhooks();
        const existingAnnouncementWebhook = oldWebhooks
            .filter((webhook) => webhook.sourceChannel?.id === announcementChannelId)
            .first();

        if (typeof existingAnnouncementWebhook === 'undefined') {
            // Add webhook

            const newsChannel = (await interaction.client.channels.fetch(
                announcementChannelId,
            )) as NewsChannel;

            await newsChannel.addFollower(channel);
            const webhooks = await channel.fetchWebhooks();

            const announcementWebhook = webhooks
                .filter((webhook) => webhook.sourceChannel?.id === announcementChannelId)
                .first()!;

            await announcementWebhook.edit({
                name: type,
                avatar: interaction.client.user?.avatarURL(),
            });

            const addEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsAnnouncementsAddTitle', [type]))
                .setDescription(
                    i18n.getMessage('commandsAnnouncementsAddDescription', [
                        type,
                        channelMention(channel.id),
                    ]),
                );

            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                `${type} added from ${channel.id}.`,
            );

            await interaction.editReply({ embeds: [addEmbed] });
        } else {
            // Remove webhook

            await existingAnnouncementWebhook.delete();

            const removeEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsAnnouncementsRemoveTitle', [type]))
                .setDescription(
                    i18n.getMessage('commandsAnnouncementsRemoveDescription', [
                        type,
                        channelMention(channel.id),
                    ]),
                );

            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                `${type} removed from ${channel.id}.`,
            );

            await interaction.editReply({ embeds: [removeEmbed] });
        }
    }
}
