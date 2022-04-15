import { requestUrl, RequestUrlParam, RequestUrlResponse } from 'obsidian'
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

        try {
            return response.json
        } catch (e) {
            return response.text
        }
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

    async searchPagesByTitle(pageName: string): Promise<IConfluenceSearchResult> {
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

    async searchPagesByLabel(label: string): Promise<IConfluenceSearchResult> {
        const queryParameters = new URLSearchParams({
            cql: `space="${this._settings.space}" AND type=page AND label="${label}"`,
            // expand: 'version',
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

    async addLabelToPage(pageId: string, label: string): Promise<void> {
        return await this.sendRequest(
            {
                url: this.buildUrl(`/content/${pageId}/label`),
                method: 'POST',
                headers: this.buildHeaders(),
                body: JSON.stringify({
                    prefix: 'global',
                    name: label,
                }),
            }
        )
    }
}
