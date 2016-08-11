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
    port: 3003,
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
    cs.server.get('/playSimulation', (req, res) => {
        simPlayer.play('data/run1rd.csv');
        res.status(200).send({ "features": [], "type": "FeatureCollection" });
        res.end();
    });

    console.log('really started');
    //    //{ key: "imb", s: new ImbAPI.ImbAPI("app-usdebug01.tsn.tno.nl", 4000),options: {} }
    //    var ml = new MobileLayer.MobileLayer(api, "mobilelayer", "/api/resources/SGBO", server, messageBus, cm);
});
