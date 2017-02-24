#!/usr/bin/env node

'use strict';

const Options = require('../lib/options.js');
const RPlayer = require('../lib/rplayerlib.js');

class Main {
    constructor() {
        this.rplayer = null;
        this.options = new Options(process.argv);
    }

    run() {
        try {
            this.options.checkDependencies();
            let options = this.options.getArgs();
            if (options.help) {
                Options.help();
            } else {
                this.rplayer = new RPlayer(options, this.options.getConfig());
                this.rplayer.run();
            }
        } catch (e) {
            console.error(e);
        }
    }
}

new Main().run();
