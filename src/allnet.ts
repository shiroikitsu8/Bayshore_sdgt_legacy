import bodyParser from "body-parser";
import { Application } from "express";
import { Module } from "./module";
import { unzipSync } from "zlib";
import iconv from "iconv-lite";
import { Config } from "./config";
import express from 'express';
import path from 'path';
import { region } from './json/allnetRegion';
import addHours from "date-fns/addHours";

// Server IP
const STARTUP_URI = `http://${Config.getConfig().serverIp || "localhost"}:80`;
const STARTUP_HOST = `${Config.getConfig().serverIp || "localhost"}:80`;


export default class AllnetModule extends Module {
    register(app: Application): void {
        
        app.use(bodyParser.raw({
            type: '*/*',
            limit: '50mb' // idk.. i got PayloadTooLargeError: request entity too large (adding this solve the problem)
        }));
        

        app.use(bodyParser.urlencoded({
            extended: true
        }));


        app.use(express.static(path.resolve('images')));

        
        app.use(bodyParser.json());


        app.use("/sys/servlet/PowerOn", function(req, res, next) {

            console.log('amauthd');

            if (req.method !== "POST")
            {
                return res.status(405).end();
            }
        
            if (!req.is("application/x-www-form-urlencoded"))
            {
                return next();
            }
        
            const base64 = req.body.toString('ascii');
            const zbytes = Buffer.from(base64, "base64");
            const bytes = unzipSync(zbytes);
            const str = bytes.toString("ascii").trim();
        
            const kvps = str.split("&");
            const reqParams: any = {};
        
            // Keys and values are not URL-escaped
        
            kvps.forEach(kvp => {
                const [key, val] = kvp.split("=");
        
                reqParams[key] = val;
            });
        
            const send_ = res.send;
        
            req.body = reqParams;
            res.send = resParams => {
                const str =
                    Object.entries(resParams)
                        .map(([key, val]) => key + "=" + val)
                        .join("&") + "\n";
        
                res.set("content-type", "text/plain");
        
                const bin = iconv.encode(str, "shift_jis");
        
                return send_.apply(res, [bin]);
            };
        
            return next();
        });
        

        app.post("/sys/servlet/PowerOn", function(req, res) {
            
            console.log('ALL.net: Startup request');

            // Cut milliseconds out of ISO timestamp
            const now = new Date();
            const adjusted = addHours(now, -7);
            const isoStrWithMs = adjusted.toISOString();
            const isoStr = isoStrWithMs.substr(0, 19) + "Z";

            let shopName = Config.getConfig().shopName || 'Bayshore';
            let placeId = Config.getConfig().placeId || 701;
            let country = Config.getConfig().country || 'IDN';
            let regionId = Config.getConfig().regionId || 701;

            // Response Data
            const resParams = {
                stat: 1,
                uri: STARTUP_URI,
                host: STARTUP_HOST,
                place_id: placeId,
                name: shopName,
                nickname: shopName,
                region0: regionId,
                region_name0: region[0][64][2],
                region_name1: region[1][5][0],
                region_name2: region[0][64][2],
                region_name3: region[0][64][2],
                setting: 1,
                country: country,
                allnet_id: regionId,
                client_timezone: '+0700',
                utc_time: isoStr,
                res_ver: req.body.format_ver,
                token: req.body.token
            };
            
            res.send(resParams);
        });


        app.use("/sys/servlet/DownloadOrder", function(req, res, next) {

            console.log('downloadorder');

            if (req.method !== "POST")
            {
                return res.status(405).end();
            }
        
            if (!req.is("application/x-www-form-urlencoded"))
            {
                return next();
            }
        
            const base64 = req.body.toString('ascii');
            const zbytes = Buffer.from(base64, "base64");
            const bytes = unzipSync(zbytes);
            const str = bytes.toString("ascii").trim();
        
            const kvps = str.split("&");
            const reqParams: any = {};
        
            // Keys and values are not URL-escaped
        
            kvps.forEach(kvp => {
                const [key, val] = kvp.split("=");
        
                reqParams[key] = val;
            });
        
            const send_ = res.send;
        
            req.body = reqParams;
            res.send = resParams => {
                const str =
                    Object.entries(resParams)
                        .map(([key, val]) => key + "=" + val)
                        .join("&") + "\n";
        
                res.set("content-type", "text/plain");
        
                const bin = iconv.encode(str, "shift_jis");
        
                return send_.apply(res, [bin]);
            };
        
            return next();
        });


        app.post("/sys/servlet/DownloadOrder", function(req, res) {

            console.log('ALL.net: Download Order request');

            // Response Data
            const resParams = {
                stat: 1,
                serial: req.body.serial,
                uri: '' // STARTUP_URI/dl/ini/SDGT-150-app.ini
            };
            
            res.send(resParams);
        });


        app.get("/dl/ini/:filename", function(req, res) {

            res.send(200)
        });
    }
}