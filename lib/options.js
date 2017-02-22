'use strict';


const sh = require('shelljs');

class Options {
    constructor(options) {
        this._processOptions(options);
    }

    _processOptions(options) {
        this.options = {};
        this.options.norepeat = (options.indexOf('--norepeat') !== -1);
        this.options.reset = (options.indexOf('--reset') !== -1);
        this.options.help = (options.indexOf('--help') !== -1);
        console.log('[RPLAYER] options ', this.options);
    }

    help() {
        console.log('[RPLAYER] use: $> rplayer [options]');
        console.log('[RPLAYER] --norepeat : No repeat last movies saw');
        console.log('[RPLAYER] --reset: Remove list of last movies saw');
        console.log('[RPLAYER] --help: This help');
    }

    checkDependencies() {
        if (!sh.which('mplayer')) {
            throw new Error('[RPLAYER] mplayer must be installed and in PATH env var');
        }
    }

    get() {
        return this._options;
    }

}

module.exports = Options;
