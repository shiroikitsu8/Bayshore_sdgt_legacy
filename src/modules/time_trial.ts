import { Application } from "express";
import { Module } from "module";
import { prisma } from "..";

// Import Util
import * as common from "./util/common";


export default class TimeTrialModule extends Module {
    register(app: Application): void {

        // Get Best Record Pre TA
        app.post("/TimeTrial/GetBestRecordPreTA", function(req, res) {

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

                // Response data
                let resParams;

                // Try Catch
                try
                {
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    let course_list = await prisma.timeTrialTime.findMany({
                        where:{
                            member: Number(id),
                        },
                        select:{
                            course_id: true
                        },
                        orderBy:{
                            course_id: 'asc'
                        },
                        distinct: ['course_id']
                    });

                    let course_mybest_data = [];
                    let course_pickup_car_best_data = [];
                    for(let i=0; i<course_list.length; i++)
                    {
                        let mycourse_best = await prisma.timeTrialTime.findMany({
                            where:{
                                member: Number(id),
                                course_id: course_list[i].course_id
                            },
                            orderBy: [
                                {
                                    value: 'desc'
                                },
                                {
                                    play_dt: 'asc'
                                }
                            ],
                        });

                        let rank = mycourse_best.length;
                        let car_list = [];
                        for(let i=0; i<mycourse_best.length; i++)
                        {
                            car_list.push({
                                rank: rank,
                                ...mycourse_best[i]
                            });

                            rank--;
                        }

                        course_pickup_car_best_data.push({
                            course_id: course_list[i].course_id,
                            car_list: car_list
                        });
                        
                        course_mybest_data.push(...car_list);
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        // Course My Best Data
                        course_mybest_data: course_mybest_data,

                        // Location Course Store Best Data
                        location_course_store_best_data: course_pickup_car_best_data,

                        // Course Pick Up Car Best Data
                        course_pickup_car_best_data: course_pickup_car_best_data
                    }
                }
                catch(e)
                {
                    // Generate Failed Response Data
                    resParams = {
                        status_code: "1",
                    }

                    // Print the error
                    common.writeLog(`${common.getError(e, req.originalUrl)}`);
                }
    
                // Send the response to the client
                res.send(resParams);
            });
        });

        // Get Best Record Pre Race
		app.post("/TimeTrial/GetBestRecordPreRace", function(req, res) {

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

                // Response data
                let resParams;

                // Try Catch
                try
                {
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    let course_best = await prisma.timeTrialTime.findMany({
                        where:{
                            member: Number(id),
                            course_id: jsonData['course_id']
                        },
                        orderBy: [
                            {
                                value: 'desc'
                            },
                            {
                                play_dt: 'asc'
                            }
                        ]
                    });

                    let course_best_data = [];
                    let rank = course_best.length;
                    for(let i=0; i<course_best.length; i++)
                    {
                        course_best_data.push({
                            rank: rank,
                            ...course_best
                        });

                        rank--;
                    }

                    // Generate Failed Response Data
                    resParams = {
                        status_code: "0",
                        course_best_data: course_best_data
                    }
                }
                catch(e)
                {
                    // Generate Failed Response Data
                    resParams = {
                        status_code: "1",
                    }

                    // Print the error
                    common.writeLog(`${common.getError(e, req.originalUrl)}`);
                }
    
                // Send the response to the client
                res.send(resParams);
            });
        });


        // Get Best Record Pre Battle
		app.post("/TimeTrial/GetBestRecordPreBattle", function(req, res) {

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


        // Get Car Best
		app.post("/TimeTrial/GetCarBest", function(req, res) {

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