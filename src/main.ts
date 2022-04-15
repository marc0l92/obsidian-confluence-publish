import { Editor, MarkdownView, Notice, Plugin } from 'obsidian'
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
        this.addCommand({
            id: 'obsidian-confluence-publish-open-parent',
            name: 'Open published notes root in Confluence',
            callback: () => {
                // TODO: global command to open parent note in the space
            }
        })
        this.addCommand({
            id: 'obsidian-confluence-publish-open-note',
            name: 'Open this note in Confluence',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                // TODO: editor command to open the current note in confluence
            }
        })
        // TODO: Test markdown to HTML conversion
        // TODO: Create custom converters to generate custom HTML based on the markdown content
    }

    onunload() {
        this._settings = null
        this._notesPublisher = null
    }
}
