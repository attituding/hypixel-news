import { Client } from 'discord.js';
import { constants } from '../utility/constants';
import { CoreChanges } from './CoreChanges';
import { CoreComponents } from './CoreComponents';
import { CoreDispatch } from './CoreDispatch';
import { CoreEmbeds } from './CoreEmbeds';
import { CoreErrors } from './CoreErrors';
import { CoreFormat } from './CoreFormat';
import { CoreRequests } from './CoreRequests';
import { ErrorHandler } from '../errors/ErrorHandler';
import { HTTPError } from '../errors/HTTPError';
import { Log } from '../utility/Log';
import { RequestErrorHandler } from '../errors/RequestErrorHandler';
import { setTimeout } from 'node:timers/promises';

/* eslint-disable no-await-in-loop */

export type Performance = typeof constants.defaults.performance;

export class Core {
    client: Client;
    performance: {
        latest: Performance | null;
        history: Performance[];
    };
    dispatch: CoreDispatch;
    errors: CoreErrors;
    request: CoreRequests;
    uses: number;

    constructor(client: Client) {
        this.client = client;
        this.performance = {
            latest: null,
            history: [],
        };
        this.dispatch = new CoreDispatch(this.client);
        this.errors = new CoreErrors();
        this.request = new CoreRequests(this.client);
        this.uses = 0;
    }

    async init() {
        while (true) {
            try {
                await this.checkSystem();
            } catch (error) {
                new ErrorHandler(error).init();
            }
        }
    }

    private async checkSystem() {
        if (this.errors.isTimeout()) {
            await setTimeout(this.errors.getTimeout());
        }

        if (this.client.config.core === false) {
            await setTimeout(2500);
            return;
        }

        const urls = constants.urls.rss;

        if (urls.length === 0) {
            await setTimeout(2500);
            return;
        }

        await this.refresh(urls);
    }

    private async refresh(urls: string[]) {
        for (const url of urls) {
            const performance = {
                ...constants.defaults.performance,
                start: Date.now(),
                uses: this.uses,
            };

            try {
                const xmlString = await this.request.request(url);
                performance.fetch = Date.now();

                const rssJSON = CoreFormat.parse(xmlString);
                performance.parse = Date.now();

                const changes = await CoreChanges.check(rssJSON);
                performance.check = Date.now();

                if (changes.items.length > 0) {
                    const newPosts = changes.items.filter(
                        item => item.edited === false,
                    );

                    const editedPosts = changes.items.filter(
                        item => item.edited === true,
                    );

                    Log.log(this.client.i18n.getMessage('coreCoreLogNewPosts', [
                        newPosts.length,
                        newPosts.map(post => post.link).join(', '),
                    ]));

                    Log.log(this.client.i18n.getMessage('coreCoreLogEditedPosts', [
                        editedPosts.length,
                        editedPosts.map(post => post.link).join(', '),
                    ]));

                    const embeds = CoreEmbeds.create(changes);
                    const components = CoreComponents.create(changes);
                    await this.dispatch.dispatch(embeds, components, changes);

                    Log.log(this.client.i18n.getMessage('coreCoreLogFinishedPosts', [
                        changes.title,
                    ]));
                }

                performance.send = Date.now();

                this.uses += 1;

                this.updatePerformance(performance);
            } catch (error) {
                if (error instanceof HTTPError) {
                    new RequestErrorHandler(error, this).init();
                } else {
                    this.errors.addGeneric();
                    new ErrorHandler(error).init();
                }

                const regularInterval = (
                    this.client.config.interval /
                    constants.urls.rss.length
                );

                if (regularInterval > this.errors.getTimeout()) {
                    await setTimeout(regularInterval);
                }

                return;
            }

            await setTimeout(
                this.client.config.interval /
                constants.urls.rss.length,
            );
        }
    }

    private updatePerformance(performance: Performance) {
        //Turns the ms since the Jan 1st 1970 into relative
        performance.total = performance.send - performance.start;
        performance.send -= performance.check;
        performance.check -= performance.parse;
        performance.parse -= performance.fetch;
        performance.fetch -= performance.start;

        this.performance.latest = performance;

        const { history } = this.performance;

        if (history[0]?.start + constants.ms.hour > Date.now()) return;

        history.unshift(performance);

        history.splice(constants.limits.performanceHistory);
    }
}