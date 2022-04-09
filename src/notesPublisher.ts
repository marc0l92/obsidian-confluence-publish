import { Notice, TFile, Vault } from "obsidian"
import { ConfluenceClient } from "./confluenceClient"
import { IConfluencePage } from "./interfaces"
import { IConfluencePublishSettings } from "./settings"

const CLEAN_STATUS_BAR_DELAY = 3000

function removeExtension(fileName: string) {
    return fileName.replace(/\.[^/.]+$/, "")
}


export class NotesPublisher {
    _vault: Vault
    _settings: IConfluencePublishSettings
    _client: ConfluenceClient
    _statusBar: HTMLElement
    _totalFilesToPublish: number = 0

    public constructor(vault: Vault, statusBar: HTMLElement, settings: IConfluencePublishSettings) {
        this._vault = vault
        this._statusBar = statusBar
        this._settings = settings

        this._client = new ConfluenceClient(this._settings)
        this._statusBar.empty()
    }

    private updateStatusBar(current: number) {
        this._statusBar.setText(`☁️${current}/${this._totalFilesToPublish}`)
    }

    private buildNewPage(file: TFile, content: string): IConfluencePage {
        const page: IConfluencePage = {
            type: 'page',
            title: removeExtension(file.name),
            space: {
                key: this._settings.space,
            },
            body: {
                storage: {
                    value: content,
                    representation: 'storage',
                    // representation: 'wiki',
                }
            }
        }
        if (this._settings.parentPage) { // TODO: test
            page.ancestors = [{
                id: this._settings.parentPage
            }]
        }
        return page
    }

    private buildModifiedPage(page: IConfluencePage, content: string): IConfluencePage {
        return Object.assign({}, page, {
            body: {
                storage: {
                    value: content,
                    representation: 'editor',
                }
            },
            version: {
                number: page.version.number + 1
            }
        })
    }

    private async getNotes(): Promise<{ file: TFile, content: string }[]> {
        return await Promise.all(
            this._vault.getMarkdownFiles().map(async (file: TFile) => { return { file: file, content: await this._vault.cachedRead(file) } })
        )
    }

    public async publishNotes() {
        let processed = 0
        let fileInProgress: TFile = null

        try {
            new Notice('Start publishing to Confluence')
            const fileContents = await this.getNotes()
            this._totalFilesToPublish = fileContents.length

            for (const { file, content } of fileContents) {
                this.updateStatusBar(processed++)
                fileInProgress = file

                const remotePage = await this._client.searchPageByTitle(removeExtension(file.name))
                if (remotePage.size === 0) {
                    await this._client.createPage(this.buildNewPage(file, content))
                } else {
                    await this._client.modifyPage(this.buildModifiedPage(remotePage.results[0], content))
                }
            }
            this.updateStatusBar(processed)

            new Notice('Publishing completed')
        } catch (error) {
            console.error('Confluence Publish error:', { fileInProgress, error })
            new Notice('Publishing failed')
        }
        setTimeout(() => this._statusBar.empty(), CLEAN_STATUS_BAR_DELAY)
    }
}