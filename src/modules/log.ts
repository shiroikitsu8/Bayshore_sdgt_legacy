import { Application } from "express";
import { Module } from "module";


export default class LogModule extends Module {
    register(app: Application): void {

        // Save Play Log
        app.post("/Log/SavePlayLog", function(req, res) {

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


        // Save End Log
        app.post("/Log/SaveEndLog", function(req, res) {

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
    }
}