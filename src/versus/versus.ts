import { Application } from "express";
import { Module } from "../module";

// Import Util
import { Config } from "../config";

const PORT_VS =  process.env.VERSUS_PORT !== undefined ? parseInt(process.env.VERSUS_PORT) : 81;

export default class VersusModule extends Module {
    register(app: Application): void {

        // Registration
        app.post("/regist", function(req, res) {

            // Get the Request Data
            var jsonString = '';

            req.on('data', function (data) {
                
                // Store the Request Data
                jsonString += data;
            });

            req.on('end', function () {

                // Error Handling if it's null
                if(!(jsonString))
                {
                    jsonString = '{}';
                }

                // Parse the JSON
                let jsonData: any = JSON.parse(jsonString);

                // Response Data
                let resParams = {
                    status_code: "0"
                }
    
                // Send the response to the client
                res.send(resParams);
            });
        });


        // Status
        app.post("/status", function(req, res) {

            // Get the Request Data
            var jsonString = '';

            req.on('data', function (data) {
                
                // Store the Request Data
                jsonString += data;
            });

            req.on('end', function () {

                // Error Handling if it's null
                if(!(jsonString))
                {
                    jsonString = '{}';
                }

                // Parse the JSON
                let jsonData: any = JSON.parse(jsonString);

                // Response Data
                let resParams = {
                    status_code: "0",
                    host: Config.getConfig().serverIp,
                    port: PORT_VS,
                    room_name: "Versus",
                    state: 0
                }
    
                // Send the response to the client
                res.send(resParams);
            });
        });
    }
}