import { requestUrl, RequestUrlParam, RequestUrlResponse, TFile } from 'obsidian'
import { version } from 'os'
import { IConfluencePage, IConfluenceSearchResult } from './interfaces'
import { EAuthenticationTypes, IConfluencePublishSettings } from "./settings"

export class ConfluenceClient {
    private _settings: IConfluencePublishSettings

    constructor(settings: IConfluencePublishSettings) {
        this._settings = settings
    }

    private buildUrl(path: string, queryParameters: URLSearchParams = null): string {
        const url = new URL(`${this._settings.host}${this._settings.apiBasePath}${path}`)
        if (queryParameters) {
            url.search = queryParameters.toString()
        }
        return url.toString()
    }

    private buildHeaders(): Record<string, string> {
        const requestHeaders: Record<string, string> = {}
        if (this._settings.authenticationType === EAuthenticationTypes.BASIC) {
            requestHeaders['Authorization'] = 'Basic ' + Buffer.from(`${this._settings.username}:${this._settings.password}`).toString('base64')
        } else if (this._settings.authenticationType === EAuthenticationTypes.BEARER_TOKEN) {
            requestHeaders['Authorization'] = `Bearer ${this._settings.bareToken}`
        }
        requestHeaders['X-Atlassian-Token'] = 'no-check'
        requestHeaders['User-Agent'] = 'obsidian-confluence-publish'
        return requestHeaders
    }

    private async sendRequest(options: RequestUrlParam): Promise<any> {
        let response: RequestUrlResponse
        console.info('request', options)
        options.contentType = 'application/json'
        try {
            response = await requestUrl(options)
        } catch (e) {
            console.error('ConfluenceClient::response', e)
            throw 'Request error'
        }
        console.info('response', response)

        if (Math.floor(response.status / 100) !== 2) {
            console.log(response.headers)
            if (response.headers['content-type'].contains('json') && response.json && response.json.errorMessages) {
                throw response.json.errorMessages.join('\n')
            } else {
                throw 'HTTP status ' + response.status
            }
        }

        return response.json || response.text
    }

    public buildNewPage(file: TFile, content: string): IConfluencePage {
        const page: IConfluencePage = {
            type: 'page',
            title: file.name,
            space: {
                key: this._settings.space,
            },
            body: {
                storage: {
                    value: content,
                    representation: 'storage',
                    // representation: 'wiki',
                }
            }
        }
        if (this._settings.parentPage) {
            page.ancestors = [{
                id: this._settings.parentPage
            }]
        }
        return page
    }

    public buildModifiedPage(page: IConfluencePage, content: string): IConfluencePage {
        return Object.assign({}, page, {
            body: {
                storage: {
                    value: content,
                    representation: 'editor',
                }
            },
            version:{
                number: page.version.number + 1
            }
        })
    }

    async createPage(page: IConfluencePage): Promise<IConfluencePage> {
        return await this.sendRequest(
            {
                url: this.buildUrl(`/content`),
                method: 'POST',
                headers: this.buildHeaders(),
                body: JSON.stringify(page),
            }
        )
    }

    async modifyPage(page: IConfluencePage): Promise<IConfluencePage> {
        return await this.sendRequest(
            {
                url: this.buildUrl(`/content/${page.id}`),
                method: 'PUT',
                headers: this.buildHeaders(),
                body: JSON.stringify(page),
            }
        )
    }

    async readPage(pageId: string): Promise<IConfluencePage> {
        return await this.sendRequest(
            {
                url: this.buildUrl(`/content/${pageId}`),
                method: 'PUT',
                headers: this.buildHeaders(),
            }
        )
    }

    async readPageContent(pageId: string): Promise<IConfluencePage> {
        const queryParameters = new URLSearchParams({
            expand: 'body.storage',
        })
        return await this.sendRequest(
            {
                url: this.buildUrl(`/content/${pageId}`, queryParameters),
                method: 'PUT',
                headers: this.buildHeaders(),
            }
        )
    }

    async deletePage(pageId: string): Promise<void> {
        await this.sendRequest(
            {
                url: this.buildUrl(`/content/${pageId}`),
                method: 'DELETE',
                headers: this.buildHeaders(),
            }
        )
    }

    async searchPage(pageName: string): Promise<IConfluenceSearchResult> {
        const queryParameters = new URLSearchParams({
            cql: `space="${this._settings.space}" AND type=page AND title="${pageName}"`,
            expand: 'version',
            start: '0',
            limit: '1',
        })
        return await this.sendRequest(
            {
                url: this.buildUrl(`/content/search`, queryParameters),
                method: 'GET',
                headers: this.buildHeaders(),
            }
        )
    }
}
