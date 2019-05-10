(function() {
    /**
     * DOM element handles
     */
    var $emulatorLog = document.getElementById('emulator-log');
    var $emulatorForm = document.getElementById('emulator-form');

    // Presentation action when notified of new log entry
    $emulatorLog.notify = function(entry) {
        var container_p = document.createElement('p');
        var level_span = document.createElement('span');
        var message_span = document.createElement('span');

        container_p.className = entry.level;
        level_span.className = 'level';
        message_span.className = 'message';

        level_span.appendChild(document.createTextNode(entry.level));
        message_span.appendChild(document.createTextNode(entry.message));

        container_p.appendChild(level_span);
        container_p.appendChild(message_span);

        $emulatorLog.appendChild(container_p);
    };

    // Presentation action to clear log (not hooked up to business layer)
    $emulatorLog.clear = function() {
        while($emulatorLog.firstChild){
            $emulatorLog.removeChild($emulatorLog.firstChild);
        }
    }

    /**
     * Emulator dependencies
     */
    var emulatorObserver = new Service.EmulatorObserver();
    var lifxAPI = new Service.LifxAPI(emulatorObserver);

    // Set up the observer callback to print messages onto the page's log
    emulatorObserver.setCallback($emulatorLog.notify);

    /**
     * Emulator
     */
    var emulator = new Service.Emulator(lifxAPI, emulatorObserver);

    $emulatorForm.onsubmit = function(event) {
        event.preventDefault();

        emulator.clearStates();
        $emulatorLog.clear();

        var me = this;

        var createColorArrFromInput = function(prefix) {
            return [
                me.elements[prefix + '_h'].value,
                me.elements[prefix + '_s'].value,
                me.elements[prefix + '_l'].value
            ];
        };

        var colorPaletteNamePrefixes = [
            ['color_0_i', 'color_0_f'],
            ['color_1_i', 'color_1_f'],
            ['color_2_i', 'color_2_f'],
            ['color_3_i', 'color_3_f'],
            ['color_4_i', 'color_4_f'],
            ['color_5_i', 'color_5_f'],
            ['color_6_i', 'color_6_f'],
            ['color_7_i', 'color_7_f'],
            ['color_8_i', 'color_8_f'],
            ['color_9_i', 'color_9_f']
        ];

        var colorPalette = colorPaletteNamePrefixes.map(function(element) {
            return element.map(function(prefix) {
                var color = createColorArrFromInput(prefix);

                return new Entity.ColorSwatch(color[0], color[1], color[2]);
            });
        });

        var frequencyFormula_Hz = this.elements.frequency_formula_Hz.value;

        var interval_s = this.elements.interval_s.value;

        var bulbStateSequence = this.elements.bulb_state_sequence.value
            .split('').map(function(state) {
                return new Entity.BulbState(
                    state, interval_s, frequencyFormula_Hz, colorPalette
                );
            });

        emulator.emulate(
            {
                authToken: this.elements.auth_token.value,
                selector: this.elements.selector.value
            },
            bulbStateSequence,
            emulatorObserver
        );
    }
})();
