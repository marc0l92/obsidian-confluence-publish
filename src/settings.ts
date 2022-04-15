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
    parentPageId: string
    folderBodyContent: string
    deleteBeforePublish: boolean
    noteHeader: string
    label: string
    folderToPublish: string
    frontmatterToPublish: string
}

const DEFAULT_SETTINGS: IConfluencePublishSettings = {
    host: 'https://my-company.atlassian.net/wiki',
    authenticationType: EAuthenticationTypes.OPEN,
    apiBasePath: '/rest/api',
    password: '********',
    space: '',
    parentPageId: '',
    folderBodyContent: '<ac:structured-macro ac:name="children" ac:macro-id="bd02defc-cdb5-4a68-bbce-c3a43f6e0d78" />',
    deleteBeforePublish: false,
    noteHeader: 'This page has been generated automatically. Please don\'t modify it.\n\n',
    label: 'obsidian-confluence-publish',
    folderToPublish: '',
    frontmatterToPublish: '',
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
                    this._data.space = value.trim()
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Parent Page Id')
            .setDesc('Id of the page that will be used as ancestor for all the notes published. Keep the field empty to use the root of the space.')
            .addText(text => text
                .setPlaceholder('Root page of the space')
                .setValue(this._data.parentPageId)
                .onChange(async (value) => {
                    this._data.parentPageId = value.trim()
                    await this.saveSettings()
                }))

        containerEl.createEl('h2', { text: 'Publishing' })
        new Setting(containerEl)
            .setName('Folder body content')
            .setDesc('Confluence creates folders as pages with a content. Use this setting to define the content of the pages created to represent folders.')
            .addTextArea(text => text
                .setValue(this._data.folderBodyContent)
                .onChange(async (value) => {
                    this._data.folderBodyContent = value.trim()
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Note header')
            .setDesc('The content of this setting we be put at the begin of each note published. The goal of this field is to define a disclaimer that inform the readers to not modify the page because it will be regenerated automatically.')
            .addTextArea(text => text
                .setValue(this._data.noteHeader)
                .onChange(async (value) => {
                    this._data.noteHeader = value
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Delete notes before publishing')
            .setDesc('Delete all the notes from confluence before doing the publishing. This allows to clean renamed or deleted notes.')
            .addToggle(text => text
                .setValue(this._data.deleteBeforePublish)
                .onChange(async (value) => {
                    this._data.deleteBeforePublish = value
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Folder of notes to publish')
            .setDesc('Path to the folder of notes to publish. Keep it empty to publish all notes.')
            .addText(text => text
                .setPlaceholder('Empty: All folders')
                .setValue(this._data.folderToPublish)
                .onChange(async (value) => {
                    this._data.folderToPublish = value.trim()
                    await this.saveSettings()
                }))
        new Setting(containerEl)
            .setName('Frontmatter to publish')
            .setDesc('Name of the frontmatter field that identify the notes that needs to be published. Keep it empty to publish all notes.')
            .addText(text => text
                .setPlaceholder('Empty: All notes')
                .setValue(this._data.frontmatterToPublish)
                .onChange(async (value) => {
                    this._data.frontmatterToPublish = value.trim() || DEFAULT_SETTINGS.label
                    await this.saveSettings()
                }))

        containerEl.createEl('h2', { text: 'Advanced' })
        new Setting(containerEl)
            .setName('Notes label')
            .setDesc('Label to apply to all notes. This label will be used during the deletion process to identify all the notes created by this plugin')
            .addText(text => text
                .setPlaceholder('Default: obsidian-confluence-publish')
                .setValue(this._data.label)
                .onChange(async (value) => {
                    this._data.label = value.trim() || DEFAULT_SETTINGS.label
                    await this.saveSettings()
                }))
    }
}