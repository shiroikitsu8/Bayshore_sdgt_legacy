import { Application } from "express";
import { Module } from "module";
import { prisma } from "..";

// Import Util
import * as common from "./util/common";


export default class AdvertiseModule extends Module {
    register(app: Application): void {

        // Advertise Get Ranking Data
        app.post("/Advertise/GetRankingData", function(req, res) {

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

                // Response Data
                let resParams;

                // Try Catch
                try
                {
                    let course_list = await prisma.timeTrialTime.findMany({
                        select:{
                            course_id: true
                        },
                        orderBy:{
                            course_id: 'asc'
                        },
                        distinct: ['course_id']
                    });

                    let national_best_data = [];
                    for(let i=0; i<course_list.length; i++)
                    {
                        let mycourse_best = await prisma.timeTrialTime.findMany({
                            where:{
                                course_id: course_list[i].course_id
                            },
                            orderBy: [
                                {
                                    value: 'asc'
                                },
                                {
                                    play_dt: 'desc'
                                }
                            ]
                        });

                        let rank = 1;
                        let car_list = [];
                        for(let i=0; i<mycourse_best.length; i++)
                        {
                            let get_username = await prisma.userBase.findFirst({
                                where:{
                                    id: mycourse_best[i].member
                                },
                                select:{
                                    username: true
                                }
                            });
                            
                            car_list.push({
                                rank: rank,
                                username: get_username!.username,
                                ...mycourse_best[i]
                            });

                            rank++;
                        }

                        national_best_data.push({
                            course_id: course_list[i].course_id,
                            ranking_data: car_list
                        });
                    }

                    resParams = {
                        status_code: "0",
                        national_best_data: national_best_data,
                        shop_best_data: national_best_data,
                        rank_management_flag: 0
                    }
                }
                catch(e)
                {
                    // Generate Failed Response Data
                    resParams = {
                        status_code: "0",
                    }

                    // Print the error
                    common.writeLog(`${common.getError(e, req.originalUrl)}`);
                }

                // Send the response to the client
                res.send(resParams);
            });
        });
    }
}