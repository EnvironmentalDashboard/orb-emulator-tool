(function() {
    var $form = document.getElementById('emulator-form');
    var $savedForms = document.getElementById('formsaver-saved-forms');
    var $refresh = document.getElementById('formsaver-refresh');
    var $open = document.getElementById('formsaver-open');
    var $save = document.getElementById('formsaver-save');
    var $saveAs = document.getElementById('formsaver-save-as');
    var $delete = document.getElementById('formsaver-delete');
    var $loadDefault = document.getElementById('formsaver-default');

    var inputs = [
        'auth_token',
        'selector',
        'color_0_i_h', 'color_0_i_s', 'color_0_i_l',
        'color_0_f_h', 'color_0_f_s', 'color_0_f_l',
        'color_1_i_h', 'color_1_i_s', 'color_1_i_l',
        'color_1_f_h', 'color_1_f_s', 'color_1_f_l',
        'color_2_i_h', 'color_2_i_s', 'color_2_i_l',
        'color_2_f_h', 'color_2_f_s', 'color_2_f_l',
        'color_3_i_h', 'color_3_i_s', 'color_3_i_l',
        'color_3_f_h', 'color_3_f_s', 'color_3_f_l',
        'color_4_i_h', 'color_4_i_s', 'color_4_i_l',
        'color_4_f_h', 'color_4_f_s', 'color_4_f_l',
        'color_5_i_h', 'color_5_i_s', 'color_5_i_l',
        'color_5_f_h', 'color_5_f_s', 'color_5_f_l',
        'color_6_i_h', 'color_6_i_s', 'color_6_i_l',
        'color_6_f_h', 'color_6_f_s', 'color_6_f_l',
        'color_7_i_h', 'color_7_i_s', 'color_7_i_l',
        'color_7_f_h', 'color_7_f_s', 'color_7_f_l',
        'color_8_i_h', 'color_8_i_s', 'color_8_i_l',
        'color_8_f_h', 'color_8_f_s', 'color_8_f_l',
        'color_9_i_h', 'color_9_i_s', 'color_9_i_l',
        'color_9_f_h', 'color_9_f_s', 'color_9_f_l',
        'frequency_formula_Hz',
        'interval_s',
        'bulb_state_sequence',
    ];

    var defaults = {
        red: JSON.parse('{"auth_token":"","selector":"","color_0_i_h":"120","color_0_i_s":"1","color_0_i_l":"0.6","color_0_f_h":"120","color_0_f_s":"1","color_0_f_l":"0.45","color_1_i_h":"83","color_1_i_s":"1","color_1_i_l":"0.6","color_1_f_h":"83","color_1_f_s":"1","color_1_f_l":"0.45","color_2_i_h":"60","color_2_i_s":"1","color_2_i_l":"0.6","color_2_f_h":"60","color_2_f_s":"1","color_2_f_l":"0.45","color_3_i_h":"38","color_3_i_s":"1","color_3_i_l":"0.6","color_3_f_h":"38","color_3_f_s":"1","color_3_f_l":"0.45","color_4_i_h":"0","color_4_i_s":"1","color_4_i_l":"0.6","color_4_f_h":"0","color_4_f_s":"1","color_4_f_l":"0.45","color_5_i_h":"180","color_5_i_s":"1","color_5_i_l":"0.6","color_5_f_h":"180","color_5_f_s":"1","color_5_f_l":"0.45","color_6_i_h":"220","color_6_i_s":"1","color_6_i_l":"0.6","color_6_f_h":"220","color_6_f_s":"1","color_6_f_l":"0.45","color_7_i_h":"250","color_7_i_s":"1","color_7_i_l":"0.6","color_7_f_h":"250","color_7_f_s":"1","color_7_f_l":"0.45","color_8_i_h":"285","color_8_i_s":"1","color_8_i_l":"0.6","color_8_f_h":"280","color_8_f_s":"1","color_8_f_l":"0.45","color_9_i_h":"315","color_9_i_s":"1","color_9_i_l":"0.6","color_9_f_h":"315","color_9_f_s":"1","color_9_f_l":"0.45","frequency_formula_Hz":"x*0.017+.25","interval_s":"6","bulb_state_sequence":""}'),
    };

    var formSaver = new FormSaver($form, inputs);

    var loadList = function() {
        var list = formSaver.getList();

        // Clear current options
        while($savedForms.firstChild){
            $savedForms.removeChild($savedForms.firstChild);
        }

        var chooseOption = document.createElement('option');

        chooseOption.value = '';
        chooseOption.appendChild(document.createTextNode('Choose ...'));

        $savedForms.appendChild(chooseOption);

        for(var i = 0; i < list.length; i++) {
            var option = document.createElement('option');

            option.value = list[i];
            option.appendChild(document.createTextNode(list[i]));

            $savedForms.appendChild(option);
        }
    };

    loadList();

    $loadDefault.onclick = function() {
        formSaver.load(defaults.red);
    };

    $refresh.onclick = loadList;

    $saveAs.onclick = function() {
        var name = window.prompt('Enter a configuration name.');

        if(name == "") {
            alert('Invalid configuration name.');
            return false;
        }

        if(name) {
            formSaver.save(name);
        }
    };

    $save.onclick = function() {
        var name = $savedForms.options[$savedForms.selectedIndex].value;

        if(name == "" || !name) {
            alert('No option selected. Either choose an option to write over, or select \'Save as...\'');
            return false;
        }

        var confirm = window.confirm(
            'You are about to save over an existing configuration. Continue?'
        );

        if(confirm) {
            formSaver.save(name);
        }
    };

    $delete.onclick = function() {
        var name = $savedForms.options[$savedForms.selectedIndex].value;

        if(name == "" || !name) {
            alert('No option selected.');
            return false;
        }

        var confirm = window.confirm(
            'You are about to delete an existing configuration. Continue?'
        );

        if(confirm) {
            formSaver.delete(name);
        }

        $refresh.onclick();
    }

    $open.onclick = function() {
        var name = $savedForms.options[$savedForms.selectedIndex].value;

        if(name == "") {
            alert('Please choose an entry.');
            return false;
        }

        var error = !formSaver.loadFromStorage(
            $savedForms.options[$savedForms.selectedIndex].value
        );

        if(error) {
            alert('Problem encountered while loading entry.');
        }
    };
})();
