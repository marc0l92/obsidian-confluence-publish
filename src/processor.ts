import { ConfluenceClient } from "./confluenceClient"
import { IConfluencePublishSettings } from "./settings"


export class ConfluencePublishProcessor {
    private _settings: IConfluencePublishSettings
    private _client: ConfluenceClient

    constructor(settings: IConfluencePublishSettings, client: ConfluenceClient) {
        this._settings = settings
        this._client = client
    }

    async publishNotes(): Promise<void> {

    }
}