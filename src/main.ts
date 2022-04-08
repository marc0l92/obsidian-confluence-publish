import { MarkdownView, Notice, Plugin, TFile } from 'obsidian'
import { ConfluenceClient } from './confluenceClient'
import { ConfluencePublishSettingsTab } from './settings'

export default class ConfluencePublishPlugin extends Plugin {
    _settings: ConfluencePublishSettingsTab
    _client: ConfluenceClient
    _statusBarItem: HTMLElement

    async onload() {
        this._settings = new ConfluencePublishSettingsTab(this.app, this)
        await this._settings.loadSettings()
        this.addSettingTab(this._settings)
        this._client = new ConfluenceClient(this._settings.getData())
        this._statusBarItem = this.addStatusBarItem()
        this._statusBarItem.empty()

        this.addRibbonIcon('cloud', 'Publish to Confluence', async (evt: MouseEvent) => {
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
        // TODO: global command to start syncing
        // TODO: global command to open parent note in the space
        // TODO: editor command to open the current note in confluence
    }

    updateStatusBar(current: number, total: number) {
        this._statusBarItem.setText(`📤${current}/${total}`)
    }

    async publishNotes() {
        const { vault } = this.app
        let processed = 0
        let total = 0
        let fileInProgress: TFile = null

        try {
            new Notice('Start publishing to Confluence')
            const fileContents: { file: TFile, content: string }[] = await Promise.all(
                vault.getMarkdownFiles().map(async (file: TFile) => { return { file: file, content: await vault.cachedRead(file) } })
            )
            total = fileContents.length
            this.updateStatusBar(processed, total)
            for (const { file, content } of fileContents) {
                fileInProgress = file
                const remotePage = await this._client.searchPage(file.name)
                if (remotePage.size === 0) {
                    await this._client.createPage(this._client.buildNewPage(file, content))
                } else {
                    await this._client.modifyPage(this._client.buildModifiedPage(remotePage.results[0], content))
                }

                processed++
                this.updateStatusBar(processed, total)
            }

            new Notice('Publishing completed')
        } catch (error) {
            console.error('Confluence Publish error:', { fileInProgress, error })
            new Notice('Publishing failed')
        }

        this._statusBarItem.empty()
    }

    onunload() {
        this._settings = null
        this._client = null
        this._statusBarItem = null
    }
}
