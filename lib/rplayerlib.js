'use strict';

const recursiveDir = require('recursive-readdir');
const fs = require('fs');
const path = require('path');
const sh = require('shelljs');
const os = require('os');
const Event = require('events');
const readline = require('readline');

class RPlayer extends Event {
    constructor(options, config) {
        super();
        this.files = [];
        this.currentLog = [];
        this.lastFiles = {};
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
        this.removeListener('process:end', this._handlePlayEnd.bind(this));
        if (key.ctrl && key.name === 'c') {
            console.log('[RPLAYER] CTRL+c detected');
            process.exit();
        } else if (key.ctrl && key.name === 'q') {
            console.log('[RPLAYER] CTRL+q detected');
        } else if (key.ctrl && key.name === 'n') {
            console.log('[RPLAYER] CTRL+n detected');
            this.run();
        } else {
            console.log('[RPLAYER] key %s pressed. Nothing to do', key.name);
        }
    }

    _getFiles() {
        this.once('process:end', this._handlePlayEnd.bind(this));
        recursiveDir(this.options.path || this.currentFolder, ['*.BUP', '*.DS_Store', '*.srt', '*.fxd*', '*.rar', '*.zip'], this._handleGetFiles.bind(this));
    }

    _handlePlayEnd() {
        if (this.options.nostop) this.run();
    }

    _handleGetFiles(error, files) {
        if (error) {
            console.log('[RPLAYER] [RPLAYER] %o', error);
        } else {
            console.log('[RPLAYER] %d files found', files.length);
            this.files = files;
            this._getLastFiles();
            let fileToPlay = this._randomSelect();
            this.lastFiles[fileToPlay.fileName] = {
                path: fileToPlay.path
            };
            let child = this._playFile(fileToPlay);
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
            let curr = data.substr(data.indexOf('V:'));
            curr = parseFloat(curr.substr(initTag.length, curr.indexOf(endTag) - endTag.length));
            return curr;
        }
        return 0.0;
    }

    _handleExecData(data) {
        this.currentLog.filmLength = this._extract_LENGTH(data);
        this.currentLog.filmCurrentPos = this._extract_CURRENT_POS(data);
    }

    _handleExecClose(code) {
        console.log('[RPLAYER] Playing ends');
        this._saveLastFiles();
        this.emit('process:end');
    }

    _handleExecError(error) {
        console.error('[RPLAYER] Error message: %o', error);
    }

    _playFile(file) {
        console.log('[RPLAYER] Playing file %s', file);
        let cmd = 'mplayer ' + this.config.player.argv.join(' ') + ' "' + path.join(file.path, file.fileName) + '"';
        return sh.exec(cmd, {
            async: true
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
