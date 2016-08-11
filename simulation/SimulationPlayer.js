"use strict";
var fs = require('fs');
var Winston = require('winston');
var proj4 = require('proj4');
;
/**
 * FileParser Simulator.
 *
 * FileParser reads a BRIDGE-log-export, converts the objects (at a certain time and location),
 * and from then on publishes them to the map.
 *
 */
var SimulationPlayer = (function () {
    function SimulationPlayer(address, api) {
        this.api = api;
        this.isStarted = false;
        proj4.defs('RD', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 ' +
            ' +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
        this.activeScenario = {};
        this.features = {};
    }
    SimulationPlayer.prototype.play = function (file) {
        var _this = this;
        if (this.isStarted === true) {
            return;
        }
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                Winston.error("Error reading file: " + err + ".");
                return;
            }
            _this.activeScenario.file = file;
            Winston.info("Read " + file + ".");
            _this.parseScenario(data);
            _this.isStarted = true;
            setTimeout(function () {
                _this.processTillTime(0, true);
            }, 0);
        });
    };
    SimulationPlayer.prototype.parseScenario = function (data) {
        var lines = data.split('\n');
        var headers = lines.splice(0, 1);
        this.activeScenario.headers = headers;
        this.activeScenario.lines = lines;
    };
    SimulationPlayer.prototype.processTillTime = function (maxTime, initial) {
        var _this = this;
        if (initial === void 0) { initial = false; }
        console.log("Process till " + maxTime);
        //Process every line that has a timeStamp lower or equal than the max time.
        var lastLine = 0;
        this.activeScenario.lines.every(function (line, index) {
            if (!line)
                return false;
            //Parse time
            var cols = line.split(';');
            if (cols.length < 16)
                return false;
            var time = cols[0].split(':');
            var customTime = { hours: +time[0], minutes: +time[1], seconds: +time[2] };
            var seconds = _this.secondsFromTime(customTime);
            if (initial) {
                _this.activeScenario.fileStartTime = seconds;
                initial = false;
            }
            // console.log(seconds - this.activeScenario.fileStartTime);
            //Calculate time between start and timestamp
            if (seconds - _this.activeScenario.fileStartTime <= maxTime) {
                switch (+cols[1]) {
                    case 0:
                    case 1:
                        var unit = { name: cols[3], geometry: _this.parseGeometry(cols[15]), color: +cols[10], lastUpdated: seconds - _this.activeScenario.fileStartTime };
                        _this.features[unit.name] = { id: unit.name, geometry: unit.geometry, type: "Feature", properties: { Name: unit.name, lastUpdated: unit.lastUpdated, color: unit.color, featureTypeId: "Unit_{color}" } };
                        _this.api.updateFeature('unitobjects', _this.features[unit.name], {}, function () { });
                        break;
                    default:
                        break;
                }
                lastLine = index + 1;
                return true;
            }
            else {
                return false;
            }
        });
        this.activeScenario.lines.splice(0, lastLine);
        if (this.activeScenario.lines.length <= 0) {
            this.isStarted = false;
            return;
        }
        else {
            setTimeout(function () {
                _this.processTillTime(maxTime + 600, false);
            }, 1000);
        }
    };
    /**
     * Return number of seconds passed since scenario start
     */
    SimulationPlayer.prototype.secondsFromTime = function (t) {
        return (t.hours * 60 * 60) + (t.minutes * 60) + t.seconds;
    };
    SimulationPlayer.prototype.parseGeometry = function (data) {
        if (!data)
            return { type: 'Point', coordinates: [0, 0] };
        var coords = data.split('/');
        var converted = proj4('RD', 'WGS84', [+coords[0], +coords[1]]);
        Winston.info("Parsed " + data + " to " + converted);
        return { type: 'Point', coordinates: converted };
    };
    return SimulationPlayer;
}());
exports.SimulationPlayer = SimulationPlayer;
