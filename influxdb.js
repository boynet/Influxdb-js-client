class Influxdb {
    constructor(host, sendPointsOnClose, sendOnInsert) {
        if (typeof sendPointsOnClose == 'undefined') this.sendPointsOnClose = false;
        if (typeof sendOnInsert == 'undefined') this.sendOnInsert = false;
        this.sendPointsOnClose = sendPointsOnClose;
        this.sendOnInsert = sendOnInsert;
        this.host = host;
        this.points = [];
        this.beaconSent = false;
        if (this.sendPointsOnClose) this.registerUnloadEvent();
        return this;
    }

    registerUnloadEvent() {
        var _self = this;
        //need both events to work in chrome http://stackoverflow.com/a/20322988/1368683
        window.addEventListener('unload', _self.sendBeacon, false);
        window.onbeforeunload = function (e) {
            _self.sendBeacon();
        };
    }

    sendBeacon() {
        //need this polyfill https://github.com/miguelmota/Navigator.sendBeacon
        if (this.points.length == 0) return;
        if (this.beaconSent) return;
        this.beaconSent = true;
        var data = this.implodePoints();
        navigator.sendBeacon(this.host, data);
    }

    point(key, fields, tags, time) {
        return this._addPoint(new Influxdb_Point(key, fields, tags, time));
    }

    _addPoint(point) {
        if (point.isValid) {
            this.points.push(point);
            if (this.sendOnInsert) this.send();
        }
        return this;
    }

    implodePoints() {
        if (this.points.length == 0) return '';
        var index, data='', _data = '';
        for (index = 0; index < this.points.length; ++index) {
            _data = this.points[index].getLine();
            if (index > 0 && data) data = data + '\n';
            data = data + this.points[index].getLine();
        }
        return data;
    }

    send() {
        if (this.points.length == 0) return false;
        var data = this.implodePoints();
        if (data) {
            var request = new XMLHttpRequest();
            request.open('POST', this.host, true);
            request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            request.send(data);
        }

        this.points = [];
    }


}

class Influxdb_Point {

    constructor(key, fields, tags, time) {
        this.key = key;
        if (typeof fields !== 'undefined' && !this.isEmpty(fields)) this.fields = fields;
        if (typeof tags !== 'undefined' && !this.isEmpty(fields)) this.tags = tags;
        if (typeof time !== 'undefined') this.time = time;
        if (!this.key || !this.fields) {
            this.isValid = false;
        } else {
            this.isValid = true;
        }

    }

    getLine() {
        if (!this.key && !this.fields) return;
        this.line = this.key;
        if (this.tags) {
            this.line = this.line + ',' + this.objToString(this.tags)
        }
        if (this.fields) {
            this.line = this.line + ' ' + this.objToString(this.fields);
        }
        if (this.time) {
            this.line = this.line + ' ' + this.time;
        }
        return this.line;
    }

    sortObjectByKey(obj) {
        if (!Array.prototype.forEach) return obj;
        if (!Array.prototype.sort) return obj;
        if (!Object.keys) return obj;
        var ordered = {};
        Object.keys(obj).sort().forEach(function (key) {
            ordered[key] = obj[key];
        });
        return ordered;
    }

    objToString(obj) {
        var i = 0;
        var str = '';
        var key, value;
        //Tags should be sorted by key before being sent for best performance https://docs.influxdata.com/influxdb/v0.13/write_protocols/line/#key
        obj = this.sortObjectByKey(obj);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                //todo: right now not supporting space in tags where it should be support with back slash
                key = key.replace(/\s+/g, '');
                value = obj[key].toString();
                value = value.replace(/\s+/g, '');
                i++;
                if (i > 1) str = str + ',';
                str += key + '=' + value;
            }
        }
        return str;
    }

    isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }
        if (!window.JSON) return true;
        return true && JSON.stringify(obj) === JSON.stringify({});
    }
}
