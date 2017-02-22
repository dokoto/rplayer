#!/usr/bin/env node

'use strict';

const Options = require('../lib/options.js');
const RPlayer = require('../lib/rplayerlib.js');

class Main {
    constructor() {
        this.rplayer = new RPlayer();
        this.options = new Options(process.argv);
    }

    run() {
        try {
            this.options.checkDependencies();
            let options = this.options.get();
            if (options.help) {
                this.options.help();
            } else {
                this.rplayer.run(options);
            }
        } catch (e) {
            console.error(e.message);
        }
    }
}

new Main().run();
