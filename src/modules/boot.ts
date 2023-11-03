import { Application } from "express";
import { Module } from "module";
import { Config } from "../config";
import path from 'path';

// Import Util
import * as common from "./util/common";

// Import JSON
import { gacha_reward } from "../json/BootGetGachaData";
import { time_release } from "../json/BootGetTimeReleaseData";
import { stamp_info } from "../json/BootStampInfo";


export default class BootModule extends Module {
    register(app: Application): void {

        // Alive Get
        app.post("/Alive/Get", function(req, res) {

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
                let resParams;

                // Try Catch
                try
                {
                    // Get current date
			        let date = Math.floor(new Date().getTime() / 1000);

                    // Get the Device Version
                    let device_version = common.getDeviceVersion(req.rawHeaders);

                    if(!(device_version))
                    {
                        // Generate Failed Response Data
                        resParams = {
                            status_code: "1",
                        }
                    }
                    else
                    {
                        // Generate Success Response Data
                        resParams = {
                            status_code: "0",
        
                            // Server Status
                            // 0 = Offline
                            // 1 = Online
                            server_status : 1,
        
                            // Force Reboot Time
                            force_reboot_time: date - 86400
                        }
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


        // Get Config Data
        app.post("/Boot/GetConfigData", function(req, res) {

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
                let resParams;

                // Try Catch
                try
                {
                    // Get the Device Version
                    common.getDeviceVersion(req.rawHeaders);

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        // Free Continue
                        free_continue_enable: 1,
                        free_continue_new: 1,
                        free_continue_play: 1,

                        // Game Status
                        difference_time_to_jp: -2,
                        asset_version: "1",
                        optional_version: 1,
                        disconnect_offset: 0,

                        // Game System
                        boost_balance_version: "0",
                        time_release_number: "0",
                        play_stamp_enable: 1,
                        play_stamp_bonus_coin: 1,
                        gacha_chara_needs: 1,
                        both_win_system_control: 1,
                        subcard_system_congrol: 1,

                        // Server Maintenance
                        server_maintenance_start_hour: 0,
                        server_maintenance_start_minutes: 0,
                        server_maintenance_end_hour: 0,
                        server_maintenance_end_minutes: 0,

                        // Domain
                        domain_api_game: "http://" + Config.getConfig().serverIp + ":80",
                        domain_matching: "http://" + Config.getConfig().serverIp + ":81",
                        domain_echo1: Config.getConfig().serverIp + ":82",
                        domain_echo2: Config.getConfig().serverIp + ":83",
                        domain_ping: Config.getConfig().serverIp,


                        battle_gift_event_master: [
                            {
                                battle_gift_event_id: 1,
                                event_nm: 'Dong Dong',
                                start_dt: 0,
                                end_dt: 1861916400,
                                mode_id: 1,
                                delivery_type: 1,
                                gift_data: {
                                    gift_id: 1,
                                    battle_gift_event_id: 1,
                                    reward_category: 1,
                                    reward_type: 1,
                                    reward_name: "Dong Dong",
                                    rarity: 1,
                                    cash_rate: 1,
                                    customize_point_rate: 1,
                                    avatar_point_rate: 1,
                                    first_distribution_rate: 1
                                }
                            }
                        ],

                        // Round Event
                        round_event: [
                            {
                                round_event_id: 2,
                                round_event_nm: "Dong Dong",
                                start_dt: 0,
                                end_dt: 1861916400,
                                round_start_rank: 1,
                                save_filename: "Dong Dong",
                                vscount: [
                                    {
                                        reward_upper_limit: 99,
                                        reward_lower_limit: 0,
                                        reward: {
                                            reward_category: 1,
                                            reward_type: 1
                                        }
                                    }
                                ],
                                rank: [
                                    {
                                        reward_upper_limit: 99,
                                        reward_lower_limit: 0,
                                        reward: {
                                            reward_category: 1,
                                            reward_type: 1
                                        }
                                    }
                                ],
                                point: [
                                    {
                                        reward_upper_limit: 99,
                                        reward_lower_limit: 0,
                                        reward: {
                                            reward_category: 1,
                                            reward_type: 1
                                        }
                                    }
                                ],
                                playable_course_list: [
                                    {
                                        course_id: 4,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 4,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 6,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 6,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 8,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 8,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 10,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 10,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 12,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 12,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 14,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 14,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 16,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 16,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 18,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 18,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 20,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 20,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 22,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 22,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 24,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 24,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 26,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 26,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 36,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 36,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 38,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 38,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 40,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 40,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 42,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 42,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 44,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 44,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 46,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 46,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 48,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 48,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 50,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 50,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 52,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 52,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 54,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 54,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 56,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 56,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 58,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 58,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 68,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 68,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 70,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 70,
                                        course_day: 1
                                    }
                                ]
                            }
                        ],
                        last_round_event: [
                            {
                                round_event_id: 1,
                                round_event_nm: "Dong Dong",
                                start_dt: 0,
                                end_dt: 1861916400,
                                round_start_rank: 1,
                                save_filename: "Dong Dong",
                                vscount: [
                                    {
                                        reward_upper_limit: 99,
                                        reward_lower_limit: 0,
                                        reward: {
                                            reward_category: 1,
                                            reward_type: 1
                                        }
                                    }
                                ],
                                rank: [
                                    {
                                        reward_upper_limit: 99,
                                        reward_lower_limit: 0,
                                        reward: {
                                            reward_category: 1,
                                            reward_type: 1
                                        }
                                    }
                                ],
                                point: [
                                    {
                                        reward_upper_limit: 99,
                                        reward_lower_limit: 0,
                                        reward: {
                                            reward_category: 1,
                                            reward_type: 1
                                        }
                                    }
                                ],
                                playable_course_list: [
                                    {
                                        course_id: 4,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 4,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 6,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 6,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 8,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 8,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 10,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 10,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 12,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 12,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 14,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 14,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 16,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 16,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 18,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 18,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 20,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 20,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 22,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 22,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 24,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 24,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 26,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 26,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 36,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 36,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 38,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 38,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 40,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 40,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 42,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 42,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 44,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 44,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 46,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 46,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 48,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 48,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 50,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 50,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 52,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 52,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 54,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 54,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 56,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 56,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 58,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 58,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 68,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 68,
                                        course_day: 1
                                    },
                                    {
                                        course_id: 70,
                                        course_day: 0
                                    },
                                    {
                                        course_id: 70,
                                        course_day: 1
                                    }
                                ]
                            }
                        ],
                        last_round_event_ranking: [
                            {
                                round_rank: 1,
                                round_point: 10,
                                round_play_count: 1,
                                username: "Dong Dong",
                                country: 12,
                                store: 4843,
                                online_battle_rank: 30,
                                mytitle_id: 10,
                                mytitle_effect_id: 10,
                                car_data: [
                                    {
                                        style_car_id: 515
                                    },
                                ],
                                user_avatar: {

                                }
                            }
                        ],
                        round_event_exp: [
                            {
                                online_rank_id: 1,
                                winbase: 1,
                                losebase: 1,
                                winnum: 1
                            }
                        ],

                        // Stamp Info
                        stamp_info: stamp_info,

                        // Time Release
                        timerelease_no: 2,
                        timerelease_avatar_gacha_no: 1,

                        // Take Over Reward
                        takeover_reward: [
                            {
                                takeover_reward_type: 1,
                                takeover_reward_data: {
                                    reward_no: 1,
                                    reward_category: 1,
                                    reward_type: 1
                                }
                            }
                        ],
                        
                        subcard_judge: [
                            {
                                condition_id: 1,
                                lower_rank: 0,
                                higher_rank: 10,
                                condition_start: 2,
                                condition_end: 3
                            }
                        ],
                        special_promote: [
                            {
                                counter: 1,
                                online_rank_id: 1
                            }
                        ],
                        matching_id: 1,
                        matching_group: [
                            {
                                group_id: 1,
                                group_percent: 1
                            }
                        ],
                        timetrial_disp_date: 1861916400,
                        buy_car_need_cash: 5000,
                        time_extension_limit: 30,
                        collabo_id: 0,
                        driver_debut_end_date: 0, //1861916400

                        // Online Battle Parameter
                        online_battle_param1: 1,
                        online_battle_param2: 2,
                        online_battle_param3: 3,
                        online_battle_param4: 4,
                        online_battle_param5: 5,
                        online_battle_param6: 6,
                        online_battle_param7: 7,
                        online_battle_param8: 8,

                        // Theory of Street
                        theory_open_version: "1.30",
                        theory_close_version: "1.50",

                        // Special Mode Event
                        special_mode_data: {
                            start_dt: 0,
                            end_dt: 1861916400,
                            story_type: 4
                        },

                        // Time Trial Event Data
                        timetrial_event_data: {
                            timetrial_event_id: 4,
                            name: "レミリア・スカーレット",
                            start_dt: 0,
                            end_dt: 1861916400,
                            course_id: 52,

                            // Point for each category
                            point: [
                                // Retire
                                70, 

                                // Rookie
                                80, 80, 80, 80, 

                                // Regular
                                100, 100, 100, 100, 

                                // Specialist
                                120, 120, 120, 120,

                                // Expert
                                140, 140, 140, 140,

                                // Professional
                                160, 160, 160, 160,

                                // Master
                                180, 180, 180, 180,

                                // Master+
                                200, 200, 200, 200,
                            ],

                            // Reward
                            reward: [
                                {
                                    point: 500,
                                    reward_category_a: 21,
                                    reward_type_a: 492,
                                    reward_category_b: 0,
                                    reward_type_b: 0
                                },
                                {
                                    point: 1000,
                                    reward_category_a: 21,
                                    reward_type_a: 493,
                                    reward_category_b: 0,
                                    reward_type_b: 0
                                },
                                {
                                    point: 1500,
                                    reward_category_a: 18,
                                    reward_type_a: 116,
                                    reward_category_b: 0,
                                    reward_type_b: 0
                                }
                            ]
                        }
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


        // Book Keep
        app.post("/Boot/Bookkeep", function(req, res) {

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
                let resParams;

                // Try Catch
                try
                {
                    // Get the Device Version
                    common.getDeviceVersion(req.rawHeaders);

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0"
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


        // Get Gacha Data
        app.post("/Boot/getGachaData", function(req, res) {

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
                let resParams;

                // Try Catch
                try
                {
                    // Get the Device Version
                    common.getDeviceVersion(req.rawHeaders);

                    /*
                    Reward category types:
                    9: Face
                    10: Eye
                    11: Mouth
                    12: Hair
                    13: Glasses
                    14: Face accessories
                    15: Body
                    18: Background
                    */
            

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",
                        avatar_gacha_data: [
                            {
                                avatar_gacha_id: 0,
                                avatar_gacha_nm: "Standard",
                                gacha_type: 0,
                                save_filename: "0",
                                use_ticket_cnt: 1,
                                start_dt: 0,
                                end_dt: 1861916400,
                                gacha_reward: gacha_reward
                            }
                        ]
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


        // For Getting Image Banner
        app.get('/images/:filename', async function(req, res) {

            let paths = path.resolve('images/' + req.params.filename);

            res.set({'Content-Type': 'image/png'});
            res.sendFile(paths);
        });


        // Get Time Release Data
        app.post("/Boot/getTimereleaseData", function(req, res) {

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
                let resParams;

                // Try Catch
                try
                {
                    // Get the Device Version
                    common.getDeviceVersion(req.rawHeaders);

                     /*
                    timerelease_story:
                    1 = Story: 1, 2, 3, 4, 5, 6, 7, 8, 9, 19 (Chapter 10), (29 Chapter 11 lol?)
                    2 = MF Ghost: 10, 11, 12, 13, 14, 15
                    3 = Bunta: 15, 16, 17, 18, 19, 20, (21, 21, 22?)
                    4 = Special Event: 23, 24, 25, 26, 27, 28 (Touhou Project)
                    */

                    // Generate Success Response Data
                    resParams = time_release;
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
    }
}