'use strict';

const sh = require('shelljs');
const fs = require('fs');

class Options {
    constructor(options) {
        this.config = require('../config/main');
        this._processOptions(options);
    }

    _processOptions(options) {
        this.options = {};
        this.options.norepeat = (options.indexOf('--norepeat') !== -1);
        this.options.reset = (options.indexOf('--reset') !== -1);
        this.options.help = (options.indexOf('--help') !== -1);
        this.options.nostop = (options.indexOf('--nostop') !== -1);
        if (options.indexOf('--path') !== -1) {
            this.options.path = options[options.indexOf('--path') + 1];
            if (!fs.existsSync(this.options.path)) {
                console.warn('[RPLAYER] Path %s no exists', this.options.path);
                this.options.path = undefined;
            }
        }
        console.log('[RPLAYER] options ', this.options);
        console.log('[RPLAYER] config ', this.config);
    }

    help() {
        console.log('[RPLAYER] ====> HELP <==== ');
        console.log('use: $> rplayer [options]');
        console.log('[OPTIONS] --help: This help');
        console.log('[OPTIONS] --path: Path to movie files sample: $> rplayer --path /home/tito/movies');
        console.log('[OPTIONS] --norepeat : No repeat last movies saw');
        console.log('[OPTIONS] --reset: Remove list of last movies saw');
        console.log('[OPTIONS] --nostop: Play random video');
        console.log('[KEYS] rplayer listen key event as:');
        console.log('[KEYS] CTRL+c : Stop video playback and don\'t save a registry of video played to play again');
        console.log('[KEYS] CTRL+q : Stop video playback and save time position to play again next time');
        console.log('[KEYS] CTRL+n : Stop video playback and play next random video [dont\'t save time position, but save to avoid play again]');
    }

    checkDependencies() {
        if (!sh.which(this.config.player.cmd)) {
            throw new Error('[RPLAYER] %s must be installed and in PATH env var', this.config.playerCmd);
        }
    }

    getArgs() {
        return this.options;
    }

    getConfig() {
        return this.config;
    }

}

module.exports = Options;
