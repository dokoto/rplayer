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
        console.log('[RPLAYER] options ', JSON.stringify(this.options));
        console.log('[RPLAYER] config ', JSON.stringify(this.config));
    }

    static help() {
        console.log('[RPLAYER] ====> HELP <==== ');
        console.log('use: $> rplayer [options]');
        console.log('[OPTIONS] --help: This help');
        console.log('[OPTIONS] --path: Path to movie files sample: $> rplayer --path /home/tito/movies');
        console.log('[OPTIONS] --norepeat : No repeat last movies saw');
        console.log('[OPTIONS] --reset: Remove list of last movies saw');
        console.log('[OPTIONS] --nostop: Play random video');
        Options.helpKeys();
    }

    static helpKeys() {
      console.log('[KEYS] rplayer listen key event as:');
      console.log('[KEYS] CTRL+e : STOP & EXIT');
      console.log('[KEYS] CTRL+q : STOP & EXIT & SAVE POSITION');
      console.log('[KEYS] CTRL+n : PLAY NEXT VIDEO');
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
