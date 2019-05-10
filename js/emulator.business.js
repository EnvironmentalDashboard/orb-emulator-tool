/**
 * Domain Model initialization
 */
var Entity = {};
var Service = {};

/**
 * Color entity
 * @type {Object}
 */
Entity.ColorSwatch = function(h, s, l) {
    this.setHSL(
        h || 360,
        s || 1 ,
        l || 1
    );
};

Object.assign(Entity.ColorSwatch.prototype, {
    setHSL: function(h, s, l) {
        this.hue = 360;
        this.saturation = 1;
        this.lightness = 1;

        this.setHue(h || this.hue);
        this.setSaturation(s || this.saturation);
        this.setLightness(l || this.lightness);
    },

    setHue: function(hue) {
        hue = parseInt(hue);

        if(hue >= 0 && hue <= 360) {
            this.hue = hue;
        }
    },

    setSaturation: function(saturation) {
        saturation = parseFloat(saturation);

        if(saturation >= 0 && saturation <= 1) {
            this.saturation = saturation;
        }
    },

    setLightness: function(lightness) {
        lightness = parseFloat(lightness);

        if(lightness >= 0 && lightness <= 1) {
            this.lightness = lightness;
        }
    },

    getSwatch: function(arr) {
        if(arr) {
            return [this.hue, this.saturation, this.lightness];
        }

        return {
            hue: this.hue,
            saturation: this.saturation,
            lightness: this.lightness
        };
    }
});

/**
 * Bulb state entity
 * @type {Object}
 */
Entity.BulbState = function(state, duration_s, frequencyFormula_Hz, colorPalette) {
    this.state = 0;
    this.duration_s = 0;
    this.frequencyFormula_Hz = 'x';
    this.colorPalette = new Array(6).fill([]);

    this.setState(state || this.state);
    this.setDuration_s(duration_s || this.duration_s);
    this.setFrequencyFormula_Hz(frequencyFormula_Hz || this.frequencyFormula_Hz);
    this.setColorPalette(colorPalette || this.colorPalette);
};

Object.assign(Entity.BulbState.prototype, {
    setState: function(state) {
        state = parseInt(state);

        if(state <= 9 && state >= 0) {
            this.state = state;
        }
    },

    getState: function() {
        return this.state;
    },

    setColorPalette: function(colorPalette) {
        this.colorPalette = Object.assign(new Array(10).fill([]), colorPalette);
    },

    setDuration_s: function(duration_s) {
        duration_s = parseInt(duration_s);

        if(duration_s > 0) {
            this.duration_s = duration_s;
        }
    },

    getDuration_s: function(duration_s) {
        return this.duration_s;
    },

    setFrequencyFormula_Hz: function(frequencyFormula_Hz) {
         this.frequencyFormula_Hz = frequencyFormula_Hz.replace(/[^(0-9)x\+\-\*\/\%\.\(\)]/g, "");
    },

    calculateFrequency_Hz: function(percentage) {
        var x = percentage;

        return eval(this.frequencyFormula_Hz);
    },

    toParams: function(state) {
        var frequency_Hz = this.calculateFrequency_Hz((this.state % 5) * 25);

        return {
            period: 1 / frequency_Hz,
            cycles: this.duration_s * frequency_Hz * 2,
            color: this.colorPalette[this.state][0],
            from_color: this.colorPalette[this.state][1],
            persist: false
        };
    }
});

/**
 * Generic observer service
 */
Service.EmulatorObserver = function() {
    this.messageLog = [];
    this.callback = new Function();

    this.log = function(level, message) {
        var entry = {
            level: level,
            message: message
        };

        this.callback(entry);
        this.messageLog.push(entry);
    };
};

Object.assign(Service.EmulatorObserver.prototype, {
    setCallback: function(callable) {
        this.callback = callable;
    },

    error: function(message) {
        this.log('error', message);
    },

    notice: function(message) {
        this.log('notice', message);
    },

    info: function(message) {
        this.log('info', message);
    }
});

/**
 * Lifx API
 *
 * @overview Wraps the LIFX api and utilizes the generic observer
 */
Service.LifxAPI = function(observer) {
    this.observer = observer;
}

Object.assign(Service.LifxAPI.prototype, {
    color: {
        toLifxHSL: function(colorSwatch) {
            var color = colorSwatch.getSwatch();

            return  "hue:" + color.hue
                    + " saturation:" + color.saturation
                    + " brightness:" + color.lightness;
        }
    },
    breathe: function(authToken, path, body, observer) {
        var me = this;

        return new Promise(function(resolve, reject) {
            var url = "https://api.lifx.com/v1/lights/id:" + path.selector + "/effects/breathe";

            var request = new XMLHttpRequest(),
                responseText;

            if(body.from_color && body.from_color instanceof Entity.ColorSwatch) {
                body.from_color = me.color.toLifxHSL(body.from_color);
            }

            if(body.color && body.color instanceof Entity.ColorSwatch) {
                body.color = me.color.toLifxHSL(body.color);
            }

            request.open("POST", url, true);
            request.setRequestHeader("Content-type", "application/json");
            request.setRequestHeader("Authorization", "Bearer " + authToken);

            observer.info('Making HTTP request ...');
            request.send(JSON.stringify(body));

            request.onreadystatechange = function() {
                if(request.readyState < 4) {
                    return ;
                }

                observer.info('HTTP request complete (DONE).');

                switch (request.status) {
                    case 200:
                    case 207:
                        return resolve(request.response);

                        break;

                    case 400:
                    case 401:
                    case 403:
                    case 404:
                    case 422:
                    case 426:
                    case 429:
                    case 500:
                    case 502:
                    case 503:
                    case 523:
                        var response = JSON.parse(request.response);

                        return reject(new Error(request.status + " : " + response.error));

                        break;
                }
            };
        });
    }
});

/**
 * Emulator
 *
 * @overview Responsible for building sequence & dispatching instructions
 * Build with `new` keyword
 */
Service.Emulator = function(lifxAPI, observer) {
    this.observer = observer;
    this.lifxAPI = lifxAPI;

    this.pathParams = {};
    this.authToken = '';

    this.bulbStateSequence = [];
};

Object.assign(Service.Emulator.prototype, {
    emulate: function(accessParams, bulbStateSequence) {
        this.authToken = accessParams.authToken;
        this.pathParams = {
            selector: accessParams.selector
        };

        this.bulbStateSequence = bulbStateSequence;

        this.observer.info('About to begin dispatch sequence ...')

        this.dispatchNextState();
    },

    clearStates: function() {
        this.observer.info('Clearing sequence ...');
        this.bulbStateSequence = [];
    },

    dispatchNextState: function() {
        if (!Array.isArray(this.bulbStateSequence) || this.bulbStateSequence.length < 1) {
            this.observer.notice('Dispatching sequence complete');

            return;
        }

        var bulbState = this.bulbStateSequence.shift();

        this.observer.notice('Dispatching bulb state ' + bulbState.getState() + ' ...');

        var me = this;

        this.lifxAPI.breathe(
            this.authToken,
            this.pathParams,
            bulbState.toParams(),
            this.observer
        ).then(function() {
            var interval_ms = bulbState.getDuration_s() * 1000;

            me.observer.notice('Dispatch success.');

            if (!Array.isArray(me.bulbStateSequence) || me.bulbStateSequence.length < 1) {
                me.observer.notice('Dispatching sequence complete.');

                return ;
            }

            me.observer.info('Setting timer for ' + interval_ms + ' ms ...');

            setTimeout(me.dispatchNextState.bind(me), interval_ms);
        }).catch(function(err) {
            me.observer.error('Dispatch failed. LIFX server error ' + err.message);
            me.clearStates();
        });
    }
});
