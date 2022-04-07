import { MarkdownView, Notice, Plugin } from 'obsidian'
import { ConfluenceClient } from './confluenceClient'
import { ConfluencePublishProcessor } from './processor'
import { ConfluencePublishSettingsTab } from './settings'

export default class ConfluencePublishPlugin extends Plugin {
    _settings: ConfluencePublishSettingsTab
    _client: ConfluenceClient
    _processor: ConfluencePublishProcessor
    _statusBarItem: HTMLElement

    async onload() {
        this._settings = new ConfluencePublishSettingsTab(this.app, this)
        await this._settings.loadSettings()
        this.addSettingTab(this._settings)
        this._client = new ConfluenceClient(this._settings.getData())
        this._processor = new ConfluencePublishProcessor(this._settings.getData(), this._client)
        this._statusBarItem = this.addStatusBarItem()

        this.addRibbonIcon('dice', 'Publish to Confluence', async (evt: MouseEvent) => {
            await this.publishNotes()
        })

        this.addCommand({
            id: 'obsidian-confluence-publish-start',
            name: 'Publish to Confluence',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView)
                if (markdownView) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.
                    if (!checking) {
                        // new SampleModal(this.app).open()
                    }

                    // This command will only show up in Command Palette when the check function returns true
                    return true
                }
            }
        })
        // TODO: global command to open parent note in the space
        // TODO: editor command to open the current note in confluence
    }

    async publishNotes() {
        // statusBarItemEl.setText('Status Bar Text') // TODO: status bar
        new Notice('Start publishing to Confluence')
        await this._processor.publishNotes()
        new Notice('Publishing completed')
    }

    onunload() {
        this._settings = null
        this._client = null
        this._processor = null
        this._statusBarItem = null
    }
}
