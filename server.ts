import Winston = require('winston');
import SimPlayer = require('./simulation/SimulationPlayer');
import * as csweb from "csweb";

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    label: 'csWeb',
    prettyPrint: true
});

var startDatabaseConnection = false;

var cs = new csweb.csServer(__dirname, <csweb.csServerOptions>{
    port: 3005,
    swagger: false,
    //connectors: { mqtt: { server: 'localhost', port: 1883 }, mongo: { server : '127.0.0.1', port: 27017} }
});
cs.start(() => {
    this.config = new csweb.ConfigurationService('./configuration.json');
    this.config.add('server', 'http://localhost:' + cs.options.port);

    if (startDatabaseConnection) {
        var bagDatabase = new csweb.BagDatabase(this.config);
        var mapLayerFactory = new csweb.MapLayerFactory(<any>bagDatabase, cs.messageBus, cs.api);
    }

    var simPlayer = new SimPlayer.SimulationPlayer('unitobjects', cs.api);
    cs.server.post('/playSimulation', (req, res) => {
        if (req.body && req.body.command && req.body.command === 'play') {
            simPlayer.play();
            res.status(200).send({ "features": [], "type": "FeatureCollection" });
            res.end();
        } else if (req.body && req.body.command && req.body.command === 'pause') {
            simPlayer.pause();
            res.status(200).send({ "features": [], "type": "FeatureCollection" });
            res.end();
        } else {
            res.status(404).send({});
            res.end();
        }
    });

    cs.server.post('/loadSimulation', (req, res) => {
        if (req.body && req.body.simulationName) {
            simPlayer.load(req.body.simulationName, (code) => {
                if (code === 0) {
                    res.status(200).send({ "features": [], "type": "FeatureCollection" });
                    res.end();
                } else {
                    res.status(404).send({});
                    res.end();
                }
            });
        } else {
            console.log(`Filename not found in request.`);
            res.status(404).send({});
            res.end();
        }
    });

    console.log('really started');
    //    //{ key: "imb", s: new ImbAPI.ImbAPI("app-usdebug01.tsn.tno.nl", 4000),options: {} }
    //    var ml = new MobileLayer.MobileLayer(api, "mobilelayer", "/api/resources/SGBO", server, messageBus, cm);
});
