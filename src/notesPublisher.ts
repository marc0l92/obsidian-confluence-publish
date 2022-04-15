import { Notice, TFile, TFolder, Vault } from "obsidian"
import { ConfluenceClient } from "./confluenceClient"
import { IConfluencePage } from "./interfaces"
import { IConfluencePublishSettings } from "./settings"

const CLEAN_STATUS_BAR_DELAY = 3000


export class NotesPublisher {
    _vault: Vault
    _settings: IConfluencePublishSettings
    _client: ConfluenceClient
    _statusBar: HTMLElement
    _totalFilesToPublish: number = 0
    _cacheFoldersId: Record<string, string> = {}

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

    private buildNewPage(file: TFile, content: string, parentPage: string): IConfluencePage {
        const page: IConfluencePage = {
            type: 'page',
            title: file.basename,
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
        if (parentPage) { // TODO: test
            page.ancestors = [{
                id: parentPage
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

    private buildNewFolder(folder: TFolder, parentPage: string): IConfluencePage {
        const page: IConfluencePage = {
            type: 'page',
            title: folder.name,
            space: {
                key: this._settings.space,
            },
            body: {
                storage: {
                    value: 'This is a folder',
                    representation: 'storage',
                }
            }
        }
        if (parentPage) { // TODO: test
            page.ancestors = [{
                id: parentPage
            }]
        }
        return page
    }

    private async getNotes(): Promise<{ file: TFile, content: string }[]> {
        return await Promise.all(
            this._vault.getMarkdownFiles().map(async (file: TFile) => { return { file: file, content: await this._vault.cachedRead(file) } })
        )
    }

    private async getParentPage(folder: TFolder): Promise<string> {
        if (!folder.name) {
            if (this._settings.parentPage) {
                return this._settings.parentPage
            }
            return null
        }
        if (this._cacheFoldersId.hasOwnProperty(folder.name)) {
            return this._cacheFoldersId[folder.name]
        }

        const remotePage = await this._client.searchPageByTitle(folder.name)
        if (remotePage.size > 0) {
            return remotePage.results[0].id
        }

        const parentPage = await this.getParentPage(folder.parent)
        const newFolder = await this._client.createPage(this.buildNewFolder(folder, parentPage))
        return newFolder.id
    }

    public async publishNotes() {
        let processed = 0
        let fileInProgress: TFile = null
        this._cacheFoldersId = {}

        try {
            new Notice('Start publishing to Confluence')
            const fileContents = await this.getNotes()
            this._totalFilesToPublish = fileContents.length

            for (const { file, content } of fileContents) {
                console.log('Publishing', file)
                this.updateStatusBar(processed++)
                fileInProgress = file

                const parentPage = await this.getParentPage(file.parent)

                const remotePage = await this._client.searchPageByTitle(file.basename)
                if (remotePage.size === 0) {
                    await this._client.createPage(this.buildNewPage(file, content, parentPage))
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