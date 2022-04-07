import { App, PluginSettingTab, Setting } from 'obsidian'
import ConfluencePublishPlugin from './main'

export enum EAuthenticationTypes {
    OPEN = 'OPEN',
    BASIC = 'BASIC',
    BEARER_TOKEN = 'BEARER_TOKEN',
}
const AUTHENTICATION_TYPE_DESCRIPTION = {
    [EAuthenticationTypes.OPEN]: 'Open',
    [EAuthenticationTypes.BASIC]: 'Basic Authentication',
    [EAuthenticationTypes.BEARER_TOKEN]: 'Bearer Token',
}

export interface IConfluencePublishSettings {
    host: string
    authenticationType: EAuthenticationTypes
    username?: string
    password?: string
    bareToken?: string
    apiBasePath: string
    space: string
    parentPage: string
}

const DEFAULT_SETTINGS: IConfluencePublishSettings = {
    host: 'https://my-company.atlassian.net/wiki',
    authenticationType: EAuthenticationTypes.OPEN,
    apiBasePath: '/rest/api',
    password: '********',
    space: '',
    parentPage: '',
}

export class ConfluencePublishSettingsTab extends PluginSettingTab {
    private _plugin: ConfluencePublishPlugin
    private _data: IConfluencePublishSettings = DEFAULT_SETTINGS

    constructor(app: App, plugin: ConfluencePublishPlugin) {
        super(app, plugin)
        this._plugin = plugin
    }

    getData(): IConfluencePublishSettings {
        return this._data
    }

    async loadSettings() {
        this._data = Object.assign({}, DEFAULT_SETTINGS, await this._plugin.loadData())
    }

    async saveSettings() {
        await this._plugin.saveData(this._data)
    }

    display(): void {
        const { containerEl } = this
        containerEl.empty()

        containerEl.createEl('h2', { text: 'Connection' })
        new Setting(containerEl)
            .setName('Host')
            .setDesc('Hostname of your company Confluence server.')
            .addText(text => text
                .setPlaceholder('Example: ' + DEFAULT_SETTINGS.host)
                .setValue(this._data.host)
                .onChange(async (value) => {
                    this._data.host = value
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Authentication type')
            .setDesc('Select how the plugin should authenticate in your Confluence server.')
            .addDropdown(dropdown => dropdown
                .addOptions(AUTHENTICATION_TYPE_DESCRIPTION)
                .setValue(this._data.authenticationType)
                .onChange(async (value) => {
                    this._data.authenticationType = value as EAuthenticationTypes
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Username')
            .setDesc('Username to access your Confluence account using HTTP basic authentication.')
            .addText(text => text
                // .setPlaceholder('')
                .setValue(this._data.username)
                .onChange(async (value) => {
                    this._data.username = value
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Password')
            .setDesc('Password or API-Token to access your Confluence account using HTTP basic authentication.')
            .addText(text => text
                // .setPlaceholder('')
                .setValue(DEFAULT_SETTINGS.password)
                .onChange(async (value) => {
                    this._data.password = value
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Bearer token')
            .setDesc('Token to access your Confluence account using OAuth2 Bearer token authentication.')
            .addText(text => text
                // .setPlaceholder('')
                .setValue(this._data.bareToken)
                .onChange(async (value) => {
                    this._data.bareToken = value
                    await this.saveSettings()
                }))


        containerEl.createEl('h2', { text: 'Publish location' })
        new Setting(containerEl)
            .setName('Space')
            .setDesc('Name of the space where the notes will be published.')
            .addText(text => text
                .setPlaceholder('~username')
                .setValue(this._data.space)
                .onChange(async (value) => {
                    this._data.space = value
                    await this.saveSettings()
                }))
    }
}