'use strict';

const recursiveDir = require('recursive-readdir');
const fs = require('fs');
const path = require('path');
const sh = require('shelljs');
const os = require('os');

class RPlayer {
    constructor(options) {
        this.files = [];
        this.lastFiles = {};
        this.currentFolder = process.cwd();
        this.options = options;
    }

    _getFiles() {
        recursiveDir(this.currentFolder, ['*.BUP', '*.DS_Store', '*.srt', '*.fxd*', '*.rar', '*.zip'], this._handleGetFiles.bind(this));
    }

    _handleGetFiles(error, files) {
        if (error) {
            console.log('[RPLAYER] [RPLAYER] %o', error);
        } else {
            console.log('[RPLAYER] %d files found', files.length);
            this.files = files;
            this._getLastFiles();
            let fileToPlay = this._randomSelect();
            this.lastFiles[fileToPlay.fileName] = fileToPlay.path;
            this._saveLastFiles();
            this._playFile(fileToPlay);
        }
    }

    _playFile(file) {
        console.log('[RPLAYER] Playing file %o', file);
        sh.exec('mplayer "' + path.join(file.path, file.fileName) + '"');
    }

    _randomSelect() {
        let index = this._randomInt(0, this.files.length);
        let file = this._splitFileName(this.files[index]);
        if (this.lastFiles[file.fileName] && this.options.norepeat) {
            console.log('[RPLAYER] File %s exist in lastFiles saw', file.fileName);
            this._randomSelect();
        } else {
            return file;
        }
    }

    _splitFileName(file) {
        return {
            fileName: file.substr(file.lastIndexOf(path.sep) + 1),
            path: file.substr(0, file.lastIndexOf(path.sep))
        };
    }

    _randomInt(low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
    }

    _getLastFiles() {
        if (fs.existsSync(path.join(os.homedir(), '.lastFiles.json'))) {
            try {
                if (this.options.reset) {
                    console.log('[RPLAYER] Reseting lastfiles');
                    fs.writeFile(path.join(os.homedir(), '.lastFiles.json'), '', 'utf8');
                } else {
                    this.lastFiles = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.lastFiles.json'), 'utf8'));
                    console.log('[RPLAYER] %d lastFiles found', Object.keys(this.lastFiles).length);
                }
            } catch (error) {
                console.error('[RPLAYER] %o ', error);
                this.lastFiles = {};
            }
        } else {
            console.warn('[RPLAYER] No lastfiles found');
        }
    }


    _saveLastFiles() {
        if (Object.keys(this.lastFiles).length > 0) {
            console.log('[RPLAYER] Saving files in %s with files %d', path.join(os.homedir(), '.lastFiles.json'), Object.keys(this.lastFiles).length);
            fs.writeFile(path.join(os.homedir(), '.lastFiles.json'), JSON.stringify(this.lastFiles), 'utf8');
        } else {
            console.warn('[RPLAYER] Nothing to save, no files');
        }
    }

    run() {
        this._getFiles();
    }
}

module.exports = RPlayer;
