var FormSaver = function($handle, inputs) {
    this.$handle = $handle;
    this.inputs = inputs || [];
};

Object.assign(FormSaver.prototype, {
    save: function(name) {
        var formData = {};

        for(var i = 0; i < this.inputs.length; i++) {
            formData[this.inputs[i]] = this.$handle.elements[this.inputs[i]].value
        }

        window.localStorage.setItem(name, JSON.stringify(formData));
    },

    loadFromStorage: function(name) {
        if(!window.localStorage.getItem(name)) {
            return false;
        }

        var formData = JSON.parse(window.localStorage.getItem(name));

        for(var key in formData) {
            this.$handle.elements[key].value = formData[key];
        }

        return true;
    },

    load: function(formData) {
        for(var key in formData) {
            this.$handle.elements[key].value = formData[key];
        }

        return true;
    },

    delete: function(name) {
        window.localStorage.removeItem(name);
    },

    getList: function() {
        var list = [];

        for (var i = 0; i < window.localStorage.length; i++){
            list.push(window.localStorage.key(i));
        }

        return list;
    }
});
