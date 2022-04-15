import { MarkdownView, Notice, Plugin } from 'obsidian'
import { ConfluenceClient } from './confluenceClient'
import { NotesPublisher } from './notesPublisher'
import { ConfluencePublishSettingsTab } from './settings'

export default class ConfluencePublishPlugin extends Plugin {
    _settings: ConfluencePublishSettingsTab
    _notesPublisher: NotesPublisher
    _isSyncing: boolean = false

    async onload() {
        this._settings = new ConfluencePublishSettingsTab(this.app, this)
        await this._settings.loadSettings()
        this.addSettingTab(this._settings)
        this._notesPublisher = new NotesPublisher(this.app.vault, this.addStatusBarItem(), this._settings.getData())

        this.addRibbonIcon('cloud', 'Publish to Confluence', async (evt: MouseEvent) => {
            if (this._isSyncing) {
                new Notice('Syncing already on going')
                return
            }
            this._isSyncing = true
            await this._notesPublisher.publishNotes()
            this._isSyncing = false
        })

        this.addCommand({
            id: 'obsidian-confluence-publish-start',
            name: 'Publish to Confluence',
            checkCallback: (checking: boolean) => {
                if (!this._isSyncing) {
                    if (!checking) {
                        this._isSyncing = true
                        this._notesPublisher.publishNotes().finally(() => {
                            this._isSyncing = false
                        })
                    }
                    return true
                }
            }
        })

        this.addCommand({
            id: 'obsidian-confluence-publish-delete',
            name: 'Delete published notes from Confluence',
            checkCallback: (checking: boolean) => {
                if (!this._isSyncing) {
                    if (!checking) {
                        this._isSyncing = true
                        this._notesPublisher.deleteNotes().finally(() => {
                            this._isSyncing = false
                        })
                    }
                    return true
                }
            }
        })
        // TODO: global command to start syncing
        // TODO: global command to open parent note in the space
        // TODO: editor command to open the current note in confluence
        // TODO: create an option to delete or not all the notes in that folder before doing the sync
        // TODO: create option for a disclamer at the begin/end of the page saying that his page is generated automatically
        // TODO: settings to define the content of the folder notes
    }

    onunload() {
        this._settings = null
        this._notesPublisher = null
    }
}
