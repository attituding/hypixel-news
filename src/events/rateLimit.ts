import type { ClientEvent } from '../@types/client';
import type { RateLimitData } from 'discord.js';
import { client } from '../main';
import { Log } from '../utility/Log';
import { Sentry } from '../errors/Sentry';
import { Severity } from '@sentry/node';

export const properties: ClientEvent['properties'] = {
    name: 'rateLimit',
    once: false,
};

export const execute: ClientEvent['execute'] = (rateLimitInfo: RateLimitData): void => {
    Log.error(
        client.i18n.getMessage('eventsRateLimit'),
        rateLimitInfo,
    );

    new Sentry()
        .setSeverity(Severity.Warning)
        .captureException(rateLimitInfo);
};