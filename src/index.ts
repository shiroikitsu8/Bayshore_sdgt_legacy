import http from 'http';
import https from "https";
import net from "net";

import fs from 'fs';
import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { globalAgent } from 'https';
import { Config } from './config';
import process from 'process';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import checkdb from "./checkdb";
import { openSqlite } from "./sql";
import path from 'path';

import AllnetModule from './allnet';
import MuchaModule from './mucha';
import billing from "./billing";
import aimedb from "./aimedb";

// Import Util
import * as common from './modules/util/common';

// Dont env
import * as dotenv from "dotenv";
dotenv.config({path: __dirname + '/.env'});

globalAgent.options.keepAlive = true;

// @ts-ignore
require('http').globalAgent.options.keepAlive = true;

export const prisma = new PrismaClient();

// PORT
const PORT_ALLNET = process.env.ALLNET_PORT !== undefined ? parseInt(process.env.ALLNET_PORT) : 80;
const PORT_MUCHA = process.env.MUCHA_PORT !== undefined ? parseInt(process.env.MUCHA_PORT) : 10082;
const PORT_VS =  process.env.VERSUS_PORT !== undefined ? parseInt(process.env.VERSUS_PORT) : 81;
const PORT_P2P =  process.env.P2P_PORT !== undefined ? parseInt(process.env.P2P_PORT) : 84;
const PORT_ECHO1 =  process.env.ECHO1_PORT !== undefined ? parseInt(process.env.ECHO1_PORT) : 82;
const PORT_ECHO2 =  process.env.ECHO2_PORT !== undefined ? parseInt(process.env.ECHO2_PORT) : 83;

// Router
const appRouter = Router();
const appRouter_vs = Router();

// Express
const allnetApp = express();
const muchaApp = express();
const vsApp = express();
const vsp2pApp = express();

// Sentry
let useSentry = !!Config.getConfig().sentryDsn;
if (useSentry)
{
    Sentry.init({
        dsn: Config.getConfig().sentryDsn,
        integrations: [
            new Sentry.Integrations.Http({tracing: true}),
            new Tracing.Integrations.Express({
                router: appRouter,
            })
        ],

        tracesSampleRate: 0.5
    });

    allnetApp.use(Sentry.Handlers.requestHandler());
    allnetApp.use(Sentry.Handlers.tracingHandler());

    // Use the sentry error handler
    allnetApp.use(Sentry.Handlers.errorHandler());
}

// Logging
allnetApp.use((req, res, next) => {
    common.writeLog(`${req.method} ${req.url}`, common.event.allnet);
    next()
});

muchaApp.use((req, res, next) => {
    common.writeLog(`${req.method} ${req.url}`, common.event.mucha);
    next()
});

vsApp.use((req, res, next) => {
    common.writeLog(`${req.method} ${req.url}`, common.event.versus);
    next()
});

billing.use((req, res, next) => {
    common.writeLog(`${req.method} ${req.url}`, common.event.billing);
    next()
});


// Certificate
const tls = {
    cert: fs.readFileSync(path.resolve("./pki/server.pem")),
    key: fs.readFileSync(path.resolve("./pki/server.key")),
};


//-----------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------
// --------------- ALL.Net ----------------
// Get all of the files in the modules directory
let dirs = fs.readdirSync('dist/modules');

// Loop over the files
for (let i of dirs) 
{
    // If the file is a .js file
    if (i.endsWith('.js')) 
    {
        // Require the module file
        let mod = require(`./modules/${i.substring(0, i.length - 3)}`); // .js extension

        // Create an instance of the module
        let inst = new mod.default();

        // Register the module with the app
        inst.register(appRouter);
    }
}

// Host ALL.Net on /initiald/ path
allnetApp.use('/initiald/', appRouter);

// Register the ALL.NET / Mucha Server
new AllnetModule().register(allnetApp);
new MuchaModule().register(muchaApp);

// Create the (ALL.Net) server
http.createServer(allnetApp).listen(PORT_ALLNET, '0.0.0.0', 511, () => {
    common.writeLog(`ALL.net server listening on port ${PORT_ALLNET}!`, common.event.boot);
});
// ----------------------------------------


// ---------------- MUCHA -----------------
// Create the mucha server
https.createServer(tls, muchaApp).listen(PORT_MUCHA, '0.0.0.0', 511, () => {
    common.writeLog(`Mucha server listening on port ${PORT_MUCHA}!`, common.event.boot);
});
// ----------------------------------------


// ---------------- VERSUS ----------------
// Get all of the files in the versus directory
let dirs_vs = fs.readdirSync('dist/versus');

// Loop over the files
for (let i of dirs_vs) 
{
    // If the file is a .js file
    if (i.endsWith('.js')) 
    {
        // Require the module file
        let mod = require(`./versus/${i.substring(0, i.length - 3)}`); // .js extension

        // Create an instance of the module
        let inst = new mod.default();

        // Register the module with the app
        inst.register(appRouter_vs);
    }
}

// Host Versus on / path
vsApp.use('/', appRouter_vs);

// Create the (VS) server
http.createServer(vsApp).listen(PORT_VS, '0.0.0.0', 511, () => {
    common.writeLog(`Versus server listening on port ${PORT_VS}!`, common.event.boot);
});

http.createServer(vsp2pApp).listen(PORT_P2P, '0.0.0.0', 511, () => {
    common.writeLog(`Versus P2P server listening on port ${PORT_P2P}!`, common.event.boot);
});
// ----------------------------------------


(async function() {
    fs.mkdirSync("./data", { recursive: true });
  
    const db = openSqlite("./data/db.sqlite3");
  
    try {
      await checkdb(db);
    } catch (e) {
      console.error(e);
  
      return;
    }

    net.createServer(aimedb(db)).listen(22345, '0.0.0.0', 511, () => {
        common.writeLog(`AIME DB server listening on port 22345!`, common.event.boot);
    });

    https.createServer(tls, billing).listen(8443, '0.0.0.0', 511, () => {
        common.writeLog(`Billing server listening on port 8443!`, common.event.boot);
    });
})();