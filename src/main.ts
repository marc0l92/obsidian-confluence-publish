import { MarkdownView, Plugin } from 'obsidian'
import { ConfluenceClient } from './confluenceClient'
import { NotesPublisher } from './notesPublisher'
import { ConfluencePublishSettingsTab } from './settings'

export default class ConfluencePublishPlugin extends Plugin {
    _settings: ConfluencePublishSettingsTab
    _notesPublisher: NotesPublisher

    async onload() {
        this._settings = new ConfluencePublishSettingsTab(this.app, this)
        await this._settings.loadSettings()
        this.addSettingTab(this._settings)
        this._notesPublisher = new NotesPublisher(this.app.vault, this.addStatusBarItem(), this._settings.getData())

        this.addRibbonIcon('cloud', 'Publish to Confluence', async (evt: MouseEvent) => {
            await this._notesPublisher.publishNotes()
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
