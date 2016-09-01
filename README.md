# csBridge
Example project that can be used to quick replay scenarios from the Bridge-tool developed by TNO.

Source code, Wiki's and issue tracker can all be found [here](https://github.com/TNOCS/csWeb).

# Getting started

## Tools of the trade

We need a few tools to get you going. First of all, install [node](https://nodejs.org). We are currently using version 5, and if you're on Windows, please install the msi package, as this will install the node package manager (npm) too. We work with npm version 3.

When you have node and npm installed, install typescript (to compile the TypeScript sources to javascript).

```shell
npm i -g typescript
```

We also need bower to fetch some client libraries. You can install bower using npm. 

```shell
npm i -g bower
```

If you don't have git installed, you can also have a look at the bower getting started documentation [here](http://bower.io/#install-bower)

Optionally, you may also install `nodemon` and/or `http-server` to run a local web server that serves your files. The first as it continuously watches your files and restarts when something changes. The second to run the application stand-alone (without the node server - this is useful if you wish to share your application on a public html folder without running a server).

```shell
npm i -g nodemon http-server
```

Finally, although you can use any text editor to edit the project, we use the free and open source [Visual Studio Code](https://code.visualstudio.com/Download), available for Windows, Linux and Mac.

## Getting the code
First, get the code in a local folder of your choice, either by forking this project or by downloading the zip file and unpacking it in a folder. Next, install all dependencies, compile and run node:

```shell
npm i
cd public && bower i
cd ..
tsc -p .
node server.js
``` 

*I got error messages during the first step (npm i): "TRACKER : error TRK0005: Failed to locate: "CL.exe"".
It seems that CL.exe belongs to Visual Studio. So, is seems to be another requisite to have Visual Studio installed.
Or not. The rest of the steps were completed without errors and the server/app seems to work ok.
(comment 30 Dec 15 by Reinier Sterkenburg)*

Alternatively, replace the last command with `nodemon server.js` or go to the public folder and run `http-server`.

Visit http://localhost:3003 to see the application running.

## Building BridgeConverter

The application need the BridgeConverter to convert Bridge exports (*.dbf) to csv. Therefore, build the c# project in data/BridgeConverter to compile the executable. Default it should reside in data/BridgeConverter/Debug/bin, but it can be configured in the SimulationPlayer.ts file.

## Configuring the application

If everything went well, you should now have your application up and running.
