import { requestUrl, RequestUrlParam, RequestUrlResponse } from 'obsidian'
import { IConfluenceContent } from './interfaces'
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
        return requestHeaders
    }

    private async sendRequest(options: RequestUrlParam): Promise<any> {
        let response: RequestUrlResponse
        try {
            response = await requestUrl(options)
        } catch (e) {
            console.error('ConfluenceClient::response', e)
            throw 'Request error'
        }
        console.info('response', response)

        if (response.status !== 200) {
            console.log(response.headers)
            if (response.headers['content-type'].contains('json') && response.json && response.json.errorMessages) {
                throw response.json.errorMessages.join('\n')
            } else {
                throw 'HTTP status ' + response.status
            }
        }

        return response.json
    }

    async createPage(issue: string): Promise<IConfluenceContent> {
        return await this.sendRequest(
            {
                url: this.buildUrl(`/issue/${issue}`),
                method: 'POST',
                headers: this.buildHeaders(),
            }
        )
    }

    // async getSearchResults(query: string, max: number): Promise<IJiraSearchResults> {
    //     const queryParameters = new URLSearchParams({
    //         jql: query,
    //         startAt: "0",
    //         maxResults: max.toString(),
    //     })
    //     return await this.sendRequest(
    //         {
    //             url: this.buildUrl(`/search`, queryParameters),
    //             method: 'GET',
    //             headers: this.buildHeaders(),
    //         }
    //     )
    // }

}
