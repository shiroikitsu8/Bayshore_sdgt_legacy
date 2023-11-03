import { Application } from "express";
import { Module } from "module";
import { Config } from "../config";
import { prisma } from "..";

// Import Util
import * as common from "./util/common";


export default class LoginModule extends Module {
    register(app: Application): void {

        // Check Lock
        app.post("/Login/CheckLock", function(req, res) {

            // Get the Request Data
            var jsonString = '';

            req.on('data', function (data) {
                
                // Store the Request Data
                jsonString += data;
            });

            req.on('end', async function () {

                // Error Handling if it's null
                if(!(jsonString))
                {
                    jsonString = '{}';
                }

                // Parse the JSON
                let jsonData: any = JSON.parse(jsonString);

                // Block some aime code
                if(jsonData['accesscode'].match(/0000000000/) ||
                   jsonData['accesscode'].match(/0123456789/) ||
                   jsonData['accesscode'].match(/9876543210/))
                {
                    jsonData['accesscode'] = '';
                }

                // Prevent creating user data if chip id or access code is blank or empty
                if (!(jsonData['accesscode'])) 
                {
                    let resParams = {
                        status_code: "0",

                        // Lock Result
                        // 0 = This Aime is in use
                        // 1 = Can Enter
                        // 2 = A new game version of the play data exists
                        // 3 and above = This Aime is in use
                        lock_result: 2,
                    }

                    // Send the response to the client
                    res.send(resParams);

                    return;
                }
                // Continue if it's not blank or empty


                // Response Data
                let resParams;

                // Try Catch
                try
                {
                    // Get the user from the database
                    let user = await prisma.user.findFirst({
                        where: {
                            accesscode: jsonData['accesscode']
                        }
                    });

                    // No user returned
                    if (!user) 
                    {
                        common.writeLog('No Such User');

                        // Check if new card registration is allowed or not
                        let newCardsBanned = Config.getConfig().gameOptions.newCardsBanned || 0;

                        // New card registration is allowed
                        if(newCardsBanned === 0)
                        {
                            // Create user
                            user = await prisma.user.create({
                                data: {
                                    accesscode: jsonData['accesscode']
                                }
                            });

                            // Failed to create user data
                            if(!user) 
                            {
                                let resParams = {
                                    status_code: "0",

                                    // Lock Result
                                    // 0 = This Aime is in use
                                    // 1 = Can Enter
                                    // 2 = A new game version of the play data exists
                                    // 3 and above = This Aime is in use
                                    lock_result: 2,
                                }

                                // Send the response to the client
                                res.send(resParams);

                                // Return
                                return;
                            }

                            common.writeLog(`User ID ${user.id} created`, common.event.allnet);
                        }
                        // New card registration is not allowed / closed
                        else
                        {
                            let resParams = {
                                status_code: "0",

                                // Lock Result
                                // 0 = This Aime is in use
                                // 1 = Can Enter
                                // 2 = A new game version of the play data exists
                                // 3 and above = This Aime is in use
                                lock_result: 2,
                            }

                            // Send the response to the client
                            res.send(resParams);

                            // Return
                            return;
                        }
                    }
                    // else {} continue below


                    // Get current date
                    let date = Math.floor(new Date().getTime() / 1000);

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        // Lock Result
                        // 0 = This Aime is in use
                        // 1 = Can Enter
                        // 2 = A new game version of the play data exists
                        // 3 and above = This Aime is in use
                        lock_result: 1,
                        
                        // Lock Date
                        lock_date: date,
                        daily_play: 1,

                        // Session
                        session: String(user.id),
                        shared_security_key: "security",
                        session_procseq: String(user.id),

                        // New Player
                        // 0 = Existing Player
                        // 1 and above = New Player
                        new_player: 1,

                        // Server Status
                        // 0 = Offline
                        // 1 = Online
                        server_status: 1,

                        // Take Over Data
                        /*takeover_data: [
                            {
                                takeover_user_name: "Dong Dong",
                                takeover_extract_day: "Sunday",
                                drv_level_class: 1,
                                drv_level: 1,
                                pride_level: 1,
                                swdc_drv_level_class: 1,
                                swdc_drv_level: 1,
                                full_spec_car_num_class: 1,
                                full_spec_car_num: 1,
                                mileage_class: 1,
                                mileage: 1,
                                gamever: 1
                            }
                        ]*/
                    }

                    // Check if it's new user or not
                    let checkNewUser = await prisma.userBase.count({
                        where:{
                            id: user.id
                        }
                    });

                    // New user detected
                    if(checkNewUser != 0)
                    {
                        resParams.new_player = 0;
                    }

                    // User is banned
                    if(user.banned === true)
                    {
                        resParams.lock_result = 2;
                    }

                    common.writeLog(`User ID ${user.id} logged in`, common.event.allnet);
                }
                catch(e)
                {
                    // Generate Failed Response Data
                    resParams = {
                        status_code: "1",

                        // Lock Result
                        // 0 = This Aime is in use
                        // 1 = Can Enter
                        // 2 = A new game version of the play data exists
                        // 3 and above = This Aime is in use
                        lock_result: 0,

                        // Server Status
                        // 0 = Offline
                        // 1 = Online
                        server_status: 1,
                    }

                    // Print the error
                    common.writeLog(`${common.getError(e, req.originalUrl)}`);
                }

                // Send the response to the client
                res.send(resParams);
            });
        });


        // Unlock
        app.post("/Login/UnLock", function(req, res) {

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

                    // Lock Result
                    // 0 = This Aime is in use
                    // 1 = Can Enter
                    // 2 = A new game version of the play data exists
                    // 3 and above = This Aime is in use
                    lock_result: 1,
                }
    
                // Send the response to the client
                res.send(resParams);
            });
        });


        // Relock
        app.post("/Login/ReLock", function(req, res) {

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

                // Get current date
			    let date = Math.floor(new Date().getTime() / 1000);

                // Response Data
                let resParams = {
                    status_code: "0",

                    // Lock Result
                    // 0 = This Aime is in use
                    // 1 = Can Enter
                    // 2 = A new game version of the play data exists
                    // 3 and above = This Aime is in use
                    lock_result: 1,

                    lock_date: date
                }
    
                // Send the response to the client
                res.send(resParams);
            });
        });

        // Guest Play
        app.post("/Login/GuestPlay", function(req, res) {

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

                    session: "GUEST",
                    shared_security_key: "security",
                    session_procseq: -1,
                }
    
                // Send the response to the client
                res.send(resParams);
            });
        });
    }
}