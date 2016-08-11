import fs = require('fs');
import path = require('path');
import Winston = require('winston');
import async = require('async');
import proj4 = require('proj4');

import csweb = require('csweb');
import _ = require('underscore');

interface Unit {
    name: string;
    geometry: csComp.Services.IGeoJsonGeometry;
    lastUpdated: number;
    color: number;
}

interface CustomTime {
    hours: number;
    minutes: number;
    seconds: number;
};
/**
 * FileParser Simulator.
 *
 * FileParser reads a BRIDGE-log-export, converts the objects (at a certain time and location),
 * and from then on publishes them to the map.
 *
 */
export class SimulationPlayer {
    private activeScenario: {
        startTime: Date,
        file: string,
        lines: string[],
        headers: string[],
        /* seconds */
        fileStartTime: number
    };
    private features: { [id: string]: IFeature };
    private isStarted: boolean = false;

    constructor(address: string, private api: csweb.ApiManager) {
        proj4.defs('RD', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 ' +
            ' +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
        this.activeScenario = <any>{};
        this.features = {};
    }

    public play(file: string) {
        if (this.isStarted === true) {
            return;
        }
        fs.readFile(file, 'utf8', (err: NodeJS.ErrnoException, data: string) => {
            if (err) {
                Winston.error(`Error reading file: ${err}.`);
                return;
            }
            this.activeScenario.file = file;
            Winston.info(`Read ${file}.`);
            this.parseScenario(data);
            this.isStarted = true;
            setTimeout(() => {
                this.processTillTime(0, true);
            }, 0);
        });
    }

    private parseScenario(data) {
        var lines = data.split('\n');
        var headers = lines.splice(0, 1);
        this.activeScenario.headers = headers;
        this.activeScenario.lines = lines;
    }

    private processTillTime(maxTime: number, initial: boolean = false) {
        console.log("Process till " + maxTime);
        //Process every line that has a timeStamp lower or equal than the max time.
        var lastLine = 0;
        this.activeScenario.lines.every((line: string, index: number) => {
            if (!line) return false;
            //Parse time
            let cols = line.split(';');
            if (cols.length < 16) return false;
            let time = cols[0].split(':');
            let customTime: CustomTime = { hours: +time[0], minutes: +time[1], seconds: +time[2] };
            let seconds = this.secondsFromTime(customTime);
            if (initial) {
                this.activeScenario.fileStartTime = seconds;
                initial = false;
            }
            // console.log(seconds - this.activeScenario.fileStartTime);
            //Calculate time between start and timestamp
            if (seconds - this.activeScenario.fileStartTime <= maxTime) {
                switch (+cols[1]) {
                    case 0:
                    case 1:
                        let unit: Unit = { name: cols[3], geometry: this.parseGeometry(cols[15]), color: +cols[10], lastUpdated: seconds - this.activeScenario.fileStartTime };
                        this.features[unit.name] = <any>{ id: unit.name, geometry: unit.geometry, type: "Feature", properties: { Name: unit.name, lastUpdated: unit.lastUpdated, color: unit.color, featureTypeId: "Unit_{color}" } };
                        this.api.updateFeature('unitobjects', this.features[unit.name], <csweb.ApiMeta>{}, () => { });
                        break;
                    default:
                        break;
                }
                lastLine = index + 1;
                return true;
            } else {
                return false;
            }
        });
        this.activeScenario.lines.splice(0, lastLine);
        if (this.activeScenario.lines.length <= 0) {
            this.isStarted = false;
            return;
        } else {
            setTimeout(() => {
                this.processTillTime(maxTime + 600, false);
            }, 1000);
        }
    }

    /**
     * Return number of seconds passed since scenario start
     */
    private secondsFromTime(t: CustomTime): number {
        return (t.hours * 60 * 60) + (t.minutes * 60) + t.seconds;
    }

    private parseGeometry(data: string): csComp.Services.IGeoJsonGeometry {
        if (!data) return { type: 'Point', coordinates: [0, 0] };
        let coords = data.split('/');
        let converted = proj4('RD', 'WGS84', [+coords[0], +coords[1]]);
        Winston.info(`Parsed ${data} to ${converted}`);
        return { type: 'Point', coordinates: converted };
    }
}