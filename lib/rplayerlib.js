'use strict';

const recursiveDir = require('recursive-readdir');
const fs = require('fs');
const path = require('path');
const sh = require('shelljs');
const os = require('os');
const Event = require('events');
const readline = require('readline');
const Options = require('./options.js');

class RPlayer extends Event {
    constructor(options, config) {
        super();
        this.files = [];
        this.currentLog = [];
        this.lastFiles = {};
        this.currentLog.filmCurrentPos = 0.0;
        this.currentLog.filmLength = 0.0;
        this.currentFolder = process.cwd();
        this.options = options;
        this.config = config;
        this._activateKeypressHandler();
    }

    _activateKeypressHandler() {
        readline.emitKeypressEvents(process.stdin);
        process.stdin.on('keypress', this._handleKeypress.bind(this));
        process.stdin.setRawMode(true);
        process.stdin.resume();
    }

    _handleKeypress(str, key) {
        this._analyzePlayerOutput();
        if (key.ctrl && key.name === 'e') {
            console.log('[RPLAYER] CTRL+e detected. Exiting from app.');
            this._saveLastFiles({
                'TAKE_SNAPSHOT': false
            });
            process.exit();
        } else if (key.ctrl && key.name === 'q') {
            console.log('[RPLAYER] CTRL+q detected. Saving current position and exit.');
            this._saveLastFiles({
                'TAKE_SNAPSHOT': true
            });
            process.exit();
        } else if (key.ctrl && key.name === 'n') {
            console.log('[RPLAYER] CTRL+n detected. Continue with next random video.');
            this._saveLastFiles({
                'TAKE_SNAPSHOT': false
            });
            this.fileToPlay = null;
            this.currentLog = [];
            this.lastFiles = {};
            this.currentLog.filmCurrentPos = 0.0;
            this.currentLog.filmLength = 0.0;
            this.run();
        } else {
            Options.helpKeys();
        }
    }

    _getFiles() {
        recursiveDir(this.options.path || this.currentFolder, ['*.BUP', '*.DS_Store', '*.srt', '*.fxd*', '*.rar', '*.zip', '*.jpeg', '*.jpg'], this._handleGetFiles.bind(this));
    }

    _handleGetFiles(error, files) {
        if (error) {
            console.log('[RPLAYER] [RPLAYER] %o', error);
        } else {
            console.log('[RPLAYER] %d files found', files.length);
            this.files = files;
            this._getLastFiles();
            this.fileToPlay = (this.lastFiles.SNAPSHOT) ? this.lastFiles.SNAPSHOT : this._randomSelect();
            this.lastFiles[this.fileToPlay.fileName] = {
                path: this.fileToPlay.path,
                fileName: this.fileToPlay.fileName
            };
            let child = this._playFile();
            child.stdout.on('data', this._handleExecData.bind(this));
            child.on('close', this._handleExecClose.bind(this));
            child.stderr.on('close', this._handleExecError.bind(this));
        }
    }

    _analyzePlayerOutput() {
        if (this.currentLog) {
            this.currentLog = null;
        }
    }

    _extract_LENGTH(data) {
        let i = data.indexOf('ID_LENGTH');
        if (i != -1) {
            let length = data.substr(i);
            length = parseFloat(length.substr(0, length.indexOf('\n')).split('=')[1]);
            return length;
        }
        return 0.0;
    }

    _extract_CURRENT_POS(data) {
        const initTag = 'V:';
        const endTag = '0/';

        let i = data.indexOf(initTag);
        if (i != -1) {
            let curr = data.substr(data.indexOf('V:') + initTag.length).trim();
            curr = parseFloat(curr.substr(0, curr.indexOf(' ')));
            return curr;
        }
        return 0.0;
    }

    _handleExecData(data) {
        this.currentLog.filmLength = (!this.currentLog.filmLength) ? this._extract_LENGTH(data) : this.currentLog.filmLength;
        let currentPost = this._extract_CURRENT_POS(data);
        this.currentLog.filmCurrentPos = (this.currentLog.filmCurrentPos < currentPost) ? currentPost : this.currentLog.filmCurrentPos;
    }

    _handleExecClose(code) {
        console.log('[RPLAYER] Playing ends at %d second of %d seconds', this.currentLog.filmCurrentPos, this.currentLog.filmLength);
        this.lastFiles[this.fileToPlay.fileName].filmLength = this.currentLog.filmLength;
        this.lastFiles[this.fileToPlay.fileName].filmCurrentPos = this.currentLog.filmCurrentPos;
        Options.helpKeys();
    }

    _handleExecError(error) {
        console.error('[RPLAYER] Error in process: %s', JSON.stringify(error));
    }

    _playFile() {
        console.log('[RPLAYER] Playing file: "%s"', this.fileToPlay.fileName);
        let cmd = 'mplayer ' + this.config.player.argv.join(' ') + ' "' + path.join(this.fileToPlay.path, this.fileToPlay.fileName) + '"';
        if (this.fileToPlay.filmCurrentPos) {
            cmd += ' -ss ' + this.fileToPlay.filmCurrentPos;
        }
        console.log('[RPLAYER] %s', cmd);
        return sh.exec(cmd, {
            async: true,
            silent: true
        });
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
                    fs.writeFile(path.join(os.homedir(), '.lastFiles.json'), '{}', 'utf8');
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

    _saveLastFiles(type) {
        if (type.TAKE_SNAPSHOT) {
            let clone = Object.assign(this.lastFiles[this.fileToPlay.fileName]);
            delete this.lastFiles[this.fileToPlay.fileName];
            this.lastFiles.SNAPSHOT = clone;
        } else {
            delete this.lastFiles.SNAPSHOT;
        }
        if (Object.keys(this.lastFiles).length > 0) {
            console.log('[RPLAYER] Saving files in %s with files %d', path.join(os.homedir(), '.lastFiles.json'), Object.keys(this.lastFiles).length);
            fs.writeFileSync(path.join(os.homedir(), '.lastFiles.json'), JSON.stringify(this.lastFiles), 'utf8');
        } else {
            console.warn('[RPLAYER] Nothing to save, no files');
        }
    }

    run() {
        this._getFiles();
    }
}

module.exports = RPlayer;
