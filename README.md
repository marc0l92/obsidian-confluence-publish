# Obsidian confluence publish

This plugin allows you to publish your [Obsidian](https://obsidian.md/) notes to [Atlassian Confluence](https://www.atlassian.com/software/confluence).

## Usage

### Configuration

Use the plugin options to configure the connection to your company Atlassian Confluence server: host, username and password.

There are three authentication methods:

- Open: used for server without authentication.
- [Basic](https://datatracker.ietf.org/doc/html/rfc7617): username and password are used to login in your server.
- [Bearer](https://datatracker.ietf.org/doc/html/rfc6750): a token is used to login in your server.

This plugin stores your credential in clear in the configuration file of this plugin.


## Commands

Use the ribbon button to start syncing your notes

![ribbon](./doc/ribbon.png)

- Publish to Confluence: scan your notes and publish them to your company Confluence server.
- Open Published notes root: open the parent page where all your notes are published.
- Open this note in Confluence: open the note you are currently editing in your company Confluence server.
- Delete published notes from Confluence: delete all the notes published by this plugin on your company Confluence server.


## Installation
From the obsidian app go in `Settings > Third-party plugins > Community Plugins > Browse` and search for `Obsidian Publish`.
