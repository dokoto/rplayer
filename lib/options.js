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
        if (options.indexOf('--nostop') !== -1) {
            this.options.path = options[options.indexOf('--nostop') + 1];
            if (!fs.existsSync(this.options.path)) {
                console.warn('[RPLAYER] Path %s no exists', this.options.path);
                this.options.path = undefined;
            }
        }
        console.log('[RPLAYER] options ', this.options);
        console.log('[RPLAYER] config ', this.config);
    }

    help() {
        console.log('[RPLAYER] use: $> rplayer [options]');
        console.log('[RPLAYER] --help: This help');
        console.log('[RPLAYER] --path: Path to movie files sample: $> rplayer --path /home/tito/movies');
        console.log('[RPLAYER] --norepeat : No repeat last movies saw');
        console.log('[RPLAYER] --reset: Remove list of last movies saw');
        console.log('[RPLAYER] --nostop: Play random video');
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
