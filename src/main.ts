import { Editor, MarkdownView, Notice, Plugin } from 'obsidian'
import { ConfluenceClient } from './confluenceClient'
import { NotesPublisher } from './notesPublisher'
import { ConfluencePublishSettingsTab } from './settings'

export default class ConfluencePublishPlugin extends Plugin {
    _settings: ConfluencePublishSettingsTab
    _notesPublisher: NotesPublisher
    _client: ConfluenceClient
    _isSyncing: boolean = false

    async onload() {
        this._settings = new ConfluencePublishSettingsTab(this.app, this)
        await this._settings.loadSettings()
        this.addSettingTab(this._settings)
        this._client = new ConfluenceClient(this._settings.getData())
        this._notesPublisher = new NotesPublisher(this.app.vault, this.addStatusBarItem(), this._settings.getData(), this._client)

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
        this.addCommand({
            id: 'obsidian-confluence-publish-open-parent',
            name: 'Open published notes root',
            callback: () => {
                window.open(this._settings.getData().host + '/spaces/' + this._settings.getData().space + '/pages/' + this._settings.getData().parentPageId)
            }
        })
        this.addCommand({
            id: 'obsidian-confluence-publish-open-note',
            name: 'Open this note in Confluence',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const currentPage = await this._client.searchPagesByTitle(view.file.basename)
                if (currentPage.size > 0) {
                    window.open(this._settings.getData().host + '/spaces/' + this._settings.getData().space + '/pages/' + currentPage.results[0].id)
                } else {
                    new Notice('This note is not published yet')
                }
            }
        })
        // TODO: Test markdown to HTML conversion
        // TODO: Create custom converters to generate custom HTML based on the markdown content
        // TODO: handle notes with the same name
    }

    onunload() {
        this._settings = null
        this._notesPublisher = null
        this._client = null
    }
}
