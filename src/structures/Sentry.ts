import * as SentryClient from '@sentry/node';
import {
    BaseInteraction,
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    GuildChannel,
    TextChannel,
} from 'discord.js';
import type { Core } from '../core/Core';
import { HTTPError } from '../errors/HTTPError';
import { chatInputResolver, contextMenuResolver } from '../utility/utility';

export class Sentry {
    public readonly scope: SentryClient.Scope;

    public constructor() {
        this.scope = new SentryClient.Scope();
    }

    public baseErrorContext(incidentId: string) {
        this.scope.setTags({
            incidentId: incidentId,
        });

        return this;
    }

    public baseInteractionContext(interaction: BaseInteraction) {
        const { user, guild, channel, client } = interaction;

        this.scope.setTags({
            interactionCommand:
                // eslint-disable-next-line no-nested-ternary
                interaction instanceof ChatInputCommandInteraction
                    ? chatInputResolver(interaction).slice(0, 200)
                    : interaction instanceof ContextMenuCommandInteraction
                        ? contextMenuResolver(interaction)
                        : null,
            interactionCreatedTimestamp: interaction.createdTimestamp,
            userId: user.id,
            interactionId: interaction.id,
            guildId: guild?.id,
            guildName: guild?.name,
            guildOwnerId: guild?.ownerId,
            guildMemberCount: guild?.memberCount,
            guildPermissions: guild?.members?.me?.permissions.bitfield.toString(),
            channelId: channel?.id,
            channelType: channel?.type,
            channelName: channel instanceof TextChannel ? channel.name : null,
            channelPermissions:
                channel instanceof GuildChannel
                    ? guild?.members?.me?.permissionsIn(channel).bitfield.toString()
                    : null,
            ping: client.ws.ping,
        });

        return this;
    }

    public captureException(exception: unknown) {
        SentryClient.captureException(exception, this.scope);

        return this;
    }

    public captureMessages(...messages: string[]) {
        messages.forEach((message) => {
            SentryClient.captureMessage(message, this.scope);
        });

        return this;
    }

    public baseInteractionPreconditionContext(precondition: string) {
        this.scope.setTags({
            precondition: precondition,
        });

        return this;
    }

    public requestContext(error: unknown, core: Core) {
        this.scope.setTags({
            type: error instanceof Error ? error.name : null,
            resumingIn: core.errors.getTimeout(),
            lastHourAbort: core.errors.abort.getLastHour(),
            lastHourGeneric: core.errors.generic.getLastHour(),
            lastHourHTTP: core.errors.http.getLastHour(),
            nextTimeoutAbort: core.errors.abort.getTimeout(),
            nextTimeoutGeneric: core.errors.generic.getTimeout(),
            nextTimeoutHTTP: core.errors.http.getTimeout(),
            uses: core.uses,
            status: error instanceof HTTPError ? error.status : null,
            statusText: error instanceof HTTPError ? error.statusText : null,
        });

        return this;
    }

    public setSeverity(level: SentryClient.SeverityLevel) {
        this.scope.setLevel(level);

        return this;
    }
}
