import { Application } from "express";
import { Module } from "module";
import { prisma } from "..";
import { Config } from "../config";
import { EmbedBuilder, WebhookClient } from 'discord.js';
import { carModel, courseName } from "../json/dataMapping";

// Import Util
import * as common from "./util/common";


export default class UserModule extends Module {
    register(app: Application): void {

        // Get Data
        app.post("/User/GetData", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Get User Base Data
                    let user_base_data = await prisma.userBase.findFirst({
                        where:{
                            id: Number(id)
                        },
                        include:{
                            mode_rank_data: true
                        }
                    });

                    // Get Avatar Data
                    let avatar_data = await prisma.avatar.findFirst({
                        where:{
                            id: Number(id)
                        },
                    });

                    // Get Car Data
                    let car = await prisma.car.findMany({
                        where:{
                            user_id: Number(id)
                        },
                        orderBy:{
                            id: 'asc'
                        }
                    });

                    // Pick Up Car Data
                    let pick_up_car_data = [];
                    for(let i=0; i<car.length; i++)
                    {
                        // Fix the parts_list format
                        let parts_list = [];
                        for(let j=0; j<car[i].parts_list.length; j++)
                        {
                            // Push the data
                            parts_list.push({ parts: car[i].parts_list[j] });
                        }

                        // Push the data
                        pick_up_car_data.push({
                            ...car[i],
                            parts_list: parts_list
                        });
                    }

                    // Get Story Data
                    let story = await prisma.story.findMany({
                        where:{
                            user_id: Number(id)
                        },
                        orderBy:{
                            chapter: 'asc'
                        }
                    });

                    let story_data = [];
                    for(let i=0; i<story.length; i++)
                    {
                        // Get Story Episode Data
                        let story_episode = await prisma.storyEpisode.findMany({
                            where:{
                                story_id: story[i].id
                            },
                            orderBy:{
                                episode: 'asc'
                            }
                        });
                        let episode_data = [];

                        for(let j=0; j<story_episode.length; j++)
                        {
                            episode_data.push({
                                episode: story_episode[j].episode,
                                play_status: story_episode[j].play_status,
                                difficulty_data: [
                                    {
                                        difficulty: story_episode[j].difficulty,
                                        play_count: story_episode[j].play_count,
                                        clear_count: story_episode[j].clear_count,
                                        play_status: story_episode[j].play_status,
                                        play_score: story_episode[j].play_score,
                                    }
                                ]
                            });
                        }

                        // Push the data
                        story_data.push({
                            story_type: story[i].story_type,
                            chapter: story[i].chapter,
                            loop_count: story[i].loop_count,
                            episode_data: episode_data
                        });
                    }

                    // Get Stock Data
                    let stock_data = await prisma.stock.findFirst({
                        where:{
                            id: Number(id)
                        },
                    });

                    // Get Time Trial Course Skill
                    let course_data = await prisma.timeTrialCourseSkill.findMany({
                        where:{
                            member: Number(id)
                        }
                    });

                    // Get Config Data
                    let config_data = await prisma.config.findFirst({
                        where:{
                            id: Number(id)
                        }
                    });

                    // Get Ticket Data
                    let ticket = await prisma.ticket.findMany({
                        where:{
                            user_id: Number(id)
                        },
                        orderBy:{
                            id: 'asc'
                        }
                    });

                    let ticket_data = [];
                    for(let i=0; i<ticket.length; i++)
                    {
                        ticket_data.push({
                            ticket_id: ticket[i].ticket_id,
                            ticket_cnt: ticket[i].ticket_cnt,
                        });
                    }

                    // Get Stamp Event Data
                    let stamp_event_data = await prisma.stampEvent.findMany({
                        where:{
                            user_id: Number(id)
                        },
                        orderBy:{
                            id: 'desc'
                        }
                    });

                    // Get Stamp Event Last Play Data
                    let user_last_stamp = await prisma.user.findFirst({
                        where:{
                            id: Number(id)
                        },
                        select:{
                            last_daily_bingo_dt: true,
                            last_weekly_bingo_dt: true
                        }
                    });

                    // Reset Stamp Bonus
                    if(stamp_event_data)
                    {
                        // Get current date
                        let date = new Date();
                        let getDate = date.getDate();
                        let getMonth = date.getMonth() + 1; 
                        let getYear = date.getFullYear();
                        let current_date = Number(getDate + '' + getMonth + '' + getYear);

                        if(user_last_stamp?.last_daily_bingo_dt)
                        {
                            if(current_date !== user_last_stamp.last_daily_bingo_dt)
                            {
                                for(let i=0; i<stamp_event_data.length; i++)
                                {
                                    stamp_event_data[i].daily_bonus = 0;
                                }
                            }
                        }

                        if(user_last_stamp?.last_weekly_bingo_dt)
                        {
                            if(!(common.isDateInThisWeek(new Date(user_last_stamp?.last_weekly_bingo_dt))))
                            {
                                for(let i=0; i<stamp_event_data.length; i++)
                                {
                                    stamp_event_data[i].weekly_bonus = 0;
                                    stamp_event_data[i].weekday_bonus = 0;
                                    stamp_event_data[i].weekend_bonus = 0;
                                    stamp_event_data[i].total_bonus = 0;
                                }
                            }
                        }
                    }
                    

                    // Get Special Mode Data
                    let special_mode = await prisma.specialModeResult.findMany({
                        where:{
                            user_id: Number(id)
                        }
                    });

                    let special_mode_data = [];
                    let special_mode_hint_data_story_type: number = 0;
                    let special_mode_hint_data_hint_display_flag: number = 0;
                    for(let i=0; i<special_mode.length; i++)
                    {
                        special_mode_data.push({
                            story_type: special_mode[i].story_type,
                            vs_type: special_mode[i].vs_type,
                            max_clear_lv: special_mode[i].cleared_difficulty,
                            last_play_lv: special_mode[i].play_difficulty,
                            last_play_course_id: special_mode[i].last_play_course_id,
                        });

                        if(i == 0)
                        {
                            special_mode_hint_data_story_type = special_mode[i].story_type;
                            special_mode_hint_data_hint_display_flag = special_mode[i].hint_display_flag;
                        }
                    }

                    // Get Challenge Mode Data
                    let challenge_mode = await prisma.challengeModeResult.findMany({
                        where:{
                            user_id: Number(id)
                        }
                    });

                    let challenge_mode_data = [];
                    for(let i=0; i<challenge_mode.length; i++)
                    {
                        challenge_mode_data.push({
                            story_type: challenge_mode[i].story_type,
                            vs_type: challenge_mode[i].vs_type,
                            max_clear_lv: challenge_mode[i].cleared_difficulty,
                            last_play_lv: challenge_mode[i].play_difficulty,
                            last_play_course_id: challenge_mode[i].last_play_course_id,
                        });
                    }


                    // Get Theory Data
                    let theory_data = await prisma.theoryData.findFirst({
                        where:{
                            user_id: Number(id)
                        }
                    });

                    // Get Theory Course Data
                    let theory_course_data = await prisma.theoryCourseData.findMany({
                        where:{
                            user_id: Number(id)
                        }
                    });

                    // Get Theory Partner Data
                    let theory_partner_data = await prisma.theoryPartnerData.findMany({
                        where:{
                            user_id: Number(id)
                        }
                    });

                    // Get Theory Course Data
                    let theory_running_pram_data = await prisma.theoryRunningPramData.findMany({
                        where:{
                            user_id: Number(id)
                        }
                    });

                    // Get Trime Trial Point Event Data
                    let timetrial_event_data = await prisma.timetrialPoint.findFirst({
                        where:{
                            user_id: Number(id),
                            timetrial_event_id: Number(1)
                        }
                    });

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        // User Base Data
                        user_base_data: user_base_data,
                            
                        // Avatar Data
                        avatar_data: avatar_data,

                        // Car Data
                        pickup_on_car_ids: [],
                        pick_up_car_data: pick_up_car_data,

                        // Story Data
                        story_data: story_data,

                        // VS Info Data
                        vsinfo_data: [],

                        // Stock Data
                        stock_data: stock_data,

                        // Mission Data
                        mission_data: {
                            id: 1,
                            achieve_flag: 0,
                            received_flag: 0,
                            update_dt: 1688641956
                        },
                        weekly_mission_data: [
                            {
                                id: 1,
                                internal_index: 0,
                                mission_no: 1,
                                reward_no: 1,
                                progress: 0
                            }
                        ],

                        // Time Trial Course Data
                        course_data: course_data,

                        // Event Data
                        toppatu_event_data: {
                            id: 1,
                            event_id: 1,
                            count1: 1,
                            count2: 2,
                            count3: 3,
                            accept_flag: 1
                        },
                        event_data: {
                            id: 1,
                            active_event_id: 1,
                            dialog_show_date: 0,
                            show_start_dialog_flag: 1,
                            show_progress_dialog_flag: 2,
                            show_end_dialog_flag: 1688641956,
                            end_event_id: 1
                        },

                        // Reward Data
                        rewards_data: {
                            rewards_id: 1,
                            rewards_reason: "Dong Dong",
                            rewards: [
                                {
                                    reward_category: 1,
                                    reward_type: 1
                                }
                            ]
                        },

                        // Login Bonus Data
                        login_bonus_data: {
                            gacha_id: 0,
                            gacha_item_id: 0,
                            category: 0,
                            type: 0
                        },

                        // Frozen Data
                        frozen_data: {
                            frozen_status: 2
                        },

                        // Penalty Data
                        penalty_data: {
                            penalty_flag: 0,
                            penalty_2_level: 0
                        },

                        // Config Data
                        config_data: config_data,

                        // Battle Gift Data
                        battle_gift_data: [
                            {
                                first_distribution_flag: 1,
                                gift_data: [
                                    {
                                        gift_id: 1,
                                        gift_get_status: 1
                                    }
                                ]
                            }
                        ],

                        // Ticket Data
                        // 3 = Dress Up Point
                        // 5 = Avatar Gacha Point
                        // 25 = Full Tune Ticket
                        // 34 = Full Tune Ticket Fragments
                        ticket_data: ticket_data,

                        // Other Event Data
                        round_event: [],
                        last_round_event: [],
                        past_round_event: [],
                        total_round_point: 0,

                        // Stamp Event Data
                        stamp_event_data: stamp_event_data,

                        // Avatar Gacha Lottery Data
                        avatar_gacha_lottery_data: {
                            avatar_gacha_id: 0
                        },

                        // Other Data
                        fulltune_count: 1,
                        total_car_parts_count: 19,
                        car_layout_count: [],
                        car_style_count: [],
                        car_use_count: [],
                        maker_use_count: [],

                        // Story Course
                        story_course: [
                            {
                                course_id: 0,
                                count: 1
                            }
                        ],

                        driver_debut: {
                            // play_count: 0,
                            // daily_play: 0,
                            // last_play_dt: 0,
                            // use_start_date: 0, 
                            // use_end_date: 0,
                            // ticket_cnt: 0,
                            // ticket_get_bit: 0
                        },   

                        // Theory of Street Data
                        theory_data: theory_data,
                        theory_course_data: theory_course_data,
                        theory_partner_data: theory_partner_data,
                        theory_running_pram_data: theory_running_pram_data,

                        // Special Mode
                        special_mode_data: special_mode_data,
                        challenge_mode_data: challenge_mode_data,

                        // Other
                        season_rewards_data: [],
                        timetrial_event_data: timetrial_event_data,
                        special_mode_hint_data: {
                            story_type: 0,
                            hint_display_flag: 0
                        },

                        // Tips Info
                        tips_info: {
                            tips_list: user_base_data?.tips_list,
                            timetrial_play_count: 0,
                            story_play_count: 0,
                            store_battle_play_count: 0,
                            online_battle_play_count: 0,
                            special_play_count: 0,
                            challenge_play_count: 0,
                            theory_play_count: 0
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


        // Create Account
        app.post("/User/CreateAccount", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Get current date
			        let date = Math.floor(new Date().getTime() / 1000);

                    // Generate Mode Rank
                    await prisma.modeRank.create({
                        data: {
                            id: Number(id),
                        }
                    });

                    // Generate Config
                    await prisma.config.create({
                        data: {
                            id: Number(id),
                        }
                    });

                    /* Country
                    0 - 46 = JPN Prefecture
                    47 = MAC
                    48 = HKG
                    49 = KOR
                    50 = MYS
                    51 = SGP
                    52 = TWN
                    53 = IDN
                    54 = PHL
                    55 = THA
                    56 = USA
                    57 = VNM
                    58 = MMR
                    59 = AUS
                    60 = NZL
                    61 = KHM
                    62 and above = out of range
                    */

                    // Generate User Base
                    await prisma.userBase.create({
                        data: {
                            id: Number(id),
                            country: Number(53),
                            username: common.sanitizeInput(jsonData['username']),
                            mode_rank_data_dbid: Number(id),
                            create_date: date,
                            store_name: Config.getConfig().shopName,
                            have_car_cnt: Number(1)
                        }
                    });

                    // Generate Part List
                    let parts_list = [];
                    for(let i=0; i<jsonData['car_obj']['parts_list'].length; i++)
                    {
                        parts_list.push(jsonData['car_obj']['parts_list'][i]['parts']);
                    }

                    // Generate First Car
                    await prisma.car.create({
                        data:{
                            user_id: Number(id),
                            car_id: Number(jsonData['car_obj']['car_id']),
                            style_car_id: Number(jsonData['car_obj']['style_car_id']),
                            color: Number(jsonData['car_obj']['color']),
                            bureau: Number(jsonData['car_obj']['bureau']),
                            kana: Number(jsonData['car_obj']['kana']),
                            s_no: Number(jsonData['car_obj']['s_no']),
                            l_no: Number(jsonData['car_obj']['l_no']),
                            car_flag: Number(jsonData['car_obj']['car_flag']),
                            tune_point: Number(jsonData['car_obj']['tune_point']),
                            tune_parts: Number(jsonData['car_obj']['tune_parts']),
                            color_stock_list: common.sanitizeInput(jsonData['car_obj']['color_stock_list']),
                            color_stock_new_list: common.sanitizeInput(jsonData['car_obj']['color_stock_new_list']),
                            parts_stock_list: common.sanitizeInput(jsonData['car_obj']['parts_stock_list']),
                            parts_stock_new_list: common.sanitizeInput(jsonData['car_obj']['parts_stock_new_list']),
                            parts_set_equip_list: common.sanitizeInput(jsonData['car_obj']['parts_set_equip_list']),
                            parts_list: parts_list,
                            equip_parts_count: Number(jsonData['car_obj']['equip_parts_count']),
                        }
                    });

                    // Generate Avatar
                    await prisma.avatar.create({
                        data: {
                            id: Number(id),
                            sex: Number(jsonData['avatar_obj']['sex']),
                            face: Number(jsonData['avatar_obj']['face']),
                            eye: Number(jsonData['avatar_obj']['eye']),
                            mouth: Number(jsonData['avatar_obj']['mouth']),
                            hair: Number(jsonData['avatar_obj']['hair']),
                            glasses: Number(jsonData['avatar_obj']['glasses']),
                            face_accessory: Number(jsonData['avatar_obj']['face_accessory']),
                            body: Number(jsonData['avatar_obj']['body']),
                            body_accessory: Number(jsonData['avatar_obj']['body_accessory']),
                            behind: Number(jsonData['avatar_obj']['behind']),
                            bg: Number(jsonData['avatar_obj']['bg']),
                            effect: Number(jsonData['avatar_obj']['effect']),
                            special: Number(jsonData['avatar_obj']['special']),
                        }
                    });

                    // Generate Stock
                    await prisma.stock.create({
                        data: {
                            id: Number(id),
                            mytitle_list: common.sanitizeInput(jsonData['takeover_stock_obj']['mytitle_list']),
                            mytitle_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['mytitle_new_list']),
                            avatar_face_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_face_list']),
                            avatar_face_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_face_new_list']),
                            avatar_eye_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_eye_list']),
                            avatar_eye_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_eye_new_list']),
                            avatar_hair_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_hair_list']),
                            avatar_hair_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_hair_new_list']),
                            avatar_body_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_body_list']),
                            avatar_body_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_body_new_list']),
                            avatar_mouth_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_mouth_list']),
                            avatar_mouth_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_mouth_new_list']),
                            avatar_glasses_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_glasses_list']),
                            avatar_glasses_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_glasses_new_list']),
                            avatar_face_accessory_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_face_accessory_list']),
                            avatar_face_accessory_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_face_accessory_new_list']),
                            avatar_body_accessory_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_body_accessory_list']),
                            avatar_body_accessory_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_body_accessory_new_list']),
                            avatar_behind_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_behind_list']),
                            avatar_behind_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_behind_new_list']),
                            avatar_bg_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_bg_list']),
                            avatar_bg_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_bg_new_list']),
                            avatar_effect_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_effect_list']),
                            avatar_effect_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_effect_new_list']),
                            avatar_special_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_special_list']),
                            avatar_special_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['avatar_special_new_list']),
                            stamp_list: common.sanitizeInput(jsonData['takeover_stock_obj']['stamp_list']),
                            stamp_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['stamp_new_list']),
                            keyholder_list: common.sanitizeInput(jsonData['takeover_stock_obj']['keyholder_list']),
                            keyholder_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['keyholder_new_list']),
                            papercup_list: common.sanitizeInput(jsonData['takeover_stock_obj']['papercup_list']),
                            papercup_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['papercup_new_list']),
                            tachometer_list: common.sanitizeInput(jsonData['takeover_stock_obj']['tachometer_list']),
                            tachometer_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['tachometer_new_list']),
                            aura_list: common.sanitizeInput(jsonData['takeover_stock_obj']['aura_list']),
                            aura_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['aura_new_list']),
                            aura_color_list: common.sanitizeInput(jsonData['takeover_stock_obj']['aura_color_list']),
                            aura_color_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['aura_color_new_list']),
                            aura_line_list: common.sanitizeInput(jsonData['takeover_stock_obj']['aura_line_list']),
                            aura_line_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['aura_line_new_list']),
                            bgm_list: common.sanitizeInput(jsonData['takeover_stock_obj']['bgm_list']),
                            bgm_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['bgm_new_list']),
                            dx_color_list: common.sanitizeInput(jsonData['takeover_stock_obj']['dx_color_list']),
                            dx_color_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['dx_color_new_list']),
                            start_menu_bg_list: common.sanitizeInput(jsonData['takeover_stock_obj']['start_menu_bg_list']),
                            start_menu_bg_new_list: common.sanitizeInput(jsonData['takeover_stock_obj']['start_menu_bg_new_list']),
                            under_neon_list: common.sanitizeInput(jsonData['takeover_stock_obj']['under_neon_list']),
                        }
                    });


                    // Generate Ticket
                    for(let i=0; i<jsonData['takeover_ticket'].length; i++)
                    {
                        await prisma.ticket.create({
                            data:{
                                user_id: Number(id),
                                ticket_id: Number(jsonData['takeover_ticket'][i]['ticket_id']),
                                ticket_cnt: Number(jsonData['takeover_ticket'][i]['ticket_cnt'])
                            }
                        });
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",
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


        // Update Login
        app.post("/User/UpdateLogin", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Update User Base
                    await prisma.userBase.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mytitle_id: common.sanitizeInputNotZero(jsonData['mytitle_id']),
                            mytitle_efffect_id: common.sanitizeInputNotZero(jsonData['mytitle_efffect_id']),
                            sticker_id: common.sanitizeInputNotZero(jsonData['sticker_id']),
                            sticker_effect_id: common.sanitizeInputNotZero(jsonData['sticker_effect_id']),
                            keyholder_id: common.sanitizeInputNotZero(jsonData['keyholder_id']),
                            papercup_id: common.sanitizeInputNotZero(jsonData['papercup_id']),
                            tachometer_id: common.sanitizeInputNotZero(jsonData['tachometer_id']),
                            aura_id: common.sanitizeInputNotZeroOne(jsonData['aura_id']),
                            aura_color_id: common.sanitizeInputNotZero(jsonData['aura_color_id']),
                            aura_line_id: common.sanitizeInputNotZero(jsonData['aura_line_id']),
                            bgm_id: common.sanitizeInputNotZero(jsonData['bgm_id']),
                            start_menu_bg_id: common.sanitizeInputNotZero(jsonData['start_menu_bg_id']),
                            cash: common.sanitizeInputNotZero(jsonData['cash']),
                            total_cash: common.sanitizeInputNotZero(jsonData['total_cash']),
                            dressup_point: Number(jsonData['dressup_point']),
                            avatar_point: Number(jsonData['avatar_point']),
                        }
                    });

                    // Update Stock
                    await prisma.stock.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mytitle_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_list']),
                            mytitle_new_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_new_list']),
                            avatar_face_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_list']),
                            avatar_face_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_new_list']),
                            avatar_eye_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_list']),
                            avatar_eye_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_new_list']),
                            avatar_hair_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_list']),
                            avatar_hair_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_new_list']),
                            avatar_body_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_list']),
                            avatar_body_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_new_list']),
                            avatar_mouth_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_list']),
                            avatar_mouth_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_new_list']),
                            avatar_glasses_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_list']),
                            avatar_glasses_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_new_list']),
                            avatar_face_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_list']),
                            avatar_face_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_new_list']),
                            avatar_body_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_list']),
                            avatar_body_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_new_list']),
                            avatar_behind_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_list']),
                            avatar_behind_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_new_list']),
                            avatar_bg_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_list']),
                            avatar_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_new_list']),
                            avatar_effect_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_list']),
                            avatar_effect_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_new_list']),
                            avatar_special_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_list']),
                            avatar_special_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_new_list']),
                            stamp_list: common.sanitizeInput(jsonData['stock_obj']['stamp_list']),
                            stamp_new_list: common.sanitizeInput(jsonData['stock_obj']['stamp_new_list']),
                            keyholder_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_list']),
                            keyholder_new_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_new_list']),
                            papercup_list: common.sanitizeInput(jsonData['stock_obj']['papercup_list']),
                            papercup_new_list: common.sanitizeInput(jsonData['stock_obj']['papercup_new_list']),
                            tachometer_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_list']),
                            tachometer_new_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_new_list']),
                            aura_list: common.sanitizeInput(jsonData['stock_obj']['aura_list']),
                            aura_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_new_list']),
                            aura_color_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_list']),
                            aura_color_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_new_list']),
                            aura_line_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_list']),
                            aura_line_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_new_list']),
                            bgm_list: common.sanitizeInput(jsonData['stock_obj']['bgm_list']),
                            bgm_new_list: common.sanitizeInput(jsonData['stock_obj']['bgm_new_list']),
                            dx_color_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_list']),
                            dx_color_new_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_new_list']),
                            start_menu_bg_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_list']),
                            start_menu_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_new_list']),
                            under_neon_list: common.sanitizeInput(jsonData['stock_obj']['under_neon_list'])
                        }
                    });


                    // Update Avatar
                    await prisma.avatar.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            sex: common.sanitizeInputNotZero(jsonData['avatar_obj']['sex']),
                            face: common.sanitizeInputNotZero(jsonData['avatar_obj']['face']),
                            eye: common.sanitizeInputNotZero(jsonData['avatar_obj']['eye']),
                            mouth: common.sanitizeInputNotZero(jsonData['avatar_obj']['mouth']),
                            hair: common.sanitizeInputNotZero(jsonData['avatar_obj']['hair']),
                            glasses: common.sanitizeInputNotZero(jsonData['avatar_obj']['glasses']),
                            face_accessory: common.sanitizeInputNotZero(jsonData['avatar_obj']['face_accessory']),
                            body: common.sanitizeInputNotZero(jsonData['avatar_obj']['body']),
                            body_accessory: common.sanitizeInputNotZero(jsonData['avatar_obj']['body_accessory']),
                            behind: common.sanitizeInputNotZero(jsonData['avatar_obj']['behind']),
                            bg: common.sanitizeInputNotZero(jsonData['avatar_obj']['bg']),
                            effect: common.sanitizeInputNotZero(jsonData['avatar_obj']['effect']),
                            special: common.sanitizeInputNotZero(jsonData['avatar_obj']['special'])
                        }
                    });

                    // Update Ticket Data
                    for(let i=0; i<jsonData['ticket_data'].length; i++)
                    {
                        await prisma.ticket.updateMany({
                            where:{
                                user_id: Number(id),
                                ticket_id: Number(jsonData['ticket_data'][i]['ticket_id'])
                            },
                            data:{
                                ticket_cnt: Number(jsonData['ticket_data'][i]['ticket_cnt'])
                            }
                        });
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",
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


        // Update Stamp Info
        app.post("/User/UpdateStampInfo", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    for(let i=0; i<jsonData['stamp_event_data'].length; i++)
                    {
                        let checkPrevStamp = await prisma.stampEvent.findFirst({
                            where:{
                                m_stamp_event_id: jsonData['stamp_event_data'][i]['m_stamp_event_id'],
                                user_id: Number(id)
                            }
                        });

                        if(checkPrevStamp)
                        {
                            await prisma.stampEvent.update({
                                where:{
                                    id: checkPrevStamp.id
                                },
                                data:{
                                    select_flag: common.sanitizeInput(jsonData['stamp_event_data'][i]['select_flag']),
                                    stamp_masu: common.sanitizeInput(jsonData['stamp_event_data'][i]['stamp_masu']),
                                    daily_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['daily_bonus']),
                                    weekly_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['weekly_bonus']),
                                    weekday_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['weekday_bonus']),
                                    weekend_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['weekend_bonus']),
                                    total_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['total_bonus']),
                                    day_total_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['day_total_bonus']),
                                    store_battle_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['store_battle_bonus']),
                                    story_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['story_bonus']),
                                    online_battle_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['online_battle_bonus']),
                                    timetrial_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['timetrial_bonus']),
                                    fasteststreetlegaltheory_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['fasteststreetlegaltheory_bonus']),
                                    collaboration_bonus: common.sanitizeInput(jsonData['stamp_event_data'][i]['collaboration_bonus']),
                                    add_bonus_daily_flag_1: common.sanitizeInput(jsonData['stamp_event_data'][i]['add_bonus_daily_flag_1']),
                                    add_bonus_daily_flag_2: common.sanitizeInput(jsonData['stamp_event_data'][i]['add_bonus_daily_flag_2']),
                                    add_bonus_daily_flag_3: common.sanitizeInput(jsonData['stamp_event_data'][i]['add_bonus_daily_flag_3'])
                                }
                            });
                        }
                        else
                        {
                            await prisma.stampEvent.create({
                                data:{
                                    m_stamp_event_id: jsonData['stamp_event_data'][i]['m_stamp_event_id'],
                                    user_id: Number(id),
                                    select_flag: jsonData['stamp_event_data'][i]['select_flag'],
                                    stamp_masu: jsonData['stamp_event_data'][i]['stamp_masu'],
                                    daily_bonus: jsonData['stamp_event_data'][i]['daily_bonus'],
                                    weekly_bonus: jsonData['stamp_event_data'][i]['weekly_bonus'],
                                    weekday_bonus: jsonData['stamp_event_data'][i]['weekday_bonus'],
                                    weekend_bonus: jsonData['stamp_event_data'][i]['weekend_bonus'],
                                    total_bonus: jsonData['stamp_event_data'][i]['total_bonus'],
                                    day_total_bonus: jsonData['stamp_event_data'][i]['day_total_bonus'],
                                    store_battle_bonus: jsonData['stamp_event_data'][i]['store_battle_bonus'],
                                    story_bonus: jsonData['stamp_event_data'][i]['story_bonus'],
                                    online_battle_bonus: jsonData['stamp_event_data'][i]['online_battle_bonus'],
                                    timetrial_bonus: jsonData['stamp_event_data'][i]['timetrial_bonus'],
                                    fasteststreetlegaltheory_bonus: jsonData['stamp_event_data'][i]['fasteststreetlegaltheory_bonus'],
                                    collaboration_bonus: jsonData['stamp_event_data'][i]['collaboration_bonus'],
                                    add_bonus_daily_flag_1: jsonData['stamp_event_data'][i]['add_bonus_daily_flag_1'],
                                    add_bonus_daily_flag_2: jsonData['stamp_event_data'][i]['add_bonus_daily_flag_2'],
                                    add_bonus_daily_flag_3: jsonData['stamp_event_data'][i]['add_bonus_daily_flag_3']
                                }
                            });
                        }
                    }

                    if(jsonData['stamp_event_data'])
                    {
                        let getUserBingoTime = await prisma.user.findFirst({
                            where:{
                                id: Number(id)
                            },
                            select:{
                                last_daily_bingo_dt: true,
                                last_weekly_bingo_dt: true
                            }
                        });

                        if(getUserBingoTime)
                        {
                            // Get current date
                            let date = new Date();
                            let getDate = date.getDate();
                            let getMonth = date.getMonth() + 1; 
                            let getYear = date.getFullYear();
                            let last_daily = Number(getDate + '' + getMonth + '' + getYear);

                            const last_weekday = new Date();

                            await prisma.user.update({
                                where:{
                                    id: Number(id)
                                },
                                data:{
                                    last_daily_bingo_dt: last_daily,
                                    last_weekly_bingo_dt: last_weekday.toISOString()
                                }
                            });
                        }
                        
                    }

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


        // Update Story Result
        app.post("/User/UpdateStoryResult", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Check Car Data
                    let car_data = await prisma.car.findFirst({
                        where:{
                            user_id: Number(id),
                            style_car_id: jsonData['style_car_id'],
                        }
                    });

                    // Update Car
                    await prisma.car.updateMany({
                        where:{
                            id: car_data!.id
                        },
                        data:{
                            car_mileage: Number(jsonData['car_mileage']),
                            tune_point: Number(jsonData['tune_point']),
                            tune_level: Number(jsonData['tune_level']),
                            story_use_count: Number(car_data!.story_use_count + 1)
                        }
                    });

                    // Insert or Update Story Data
                    let check_story = await prisma.story.findFirst({
                        where:{
                            user_id: Number(id),
                            story_type: jsonData['story_type'],
                            chapter: jsonData['chapter'],
                        }
                    });
                    let new_story;

                    // Story Data Found
                    if(check_story)
                    {
                        // Update the record
                        new_story = await prisma.story.update({
                            where:{
                                id: check_story.id
                            },
                            data:{
                                story_type: Number(jsonData['story_type']),
                                chapter: Number(jsonData['chapter']),
                            }
                        });
                    }
                    // Story Data not Found
                    else
                    {
                        // Create new record
                        new_story = await prisma.story.create({
                            data:{
                                user_id: Number(id),
                                story_type: Number(jsonData['story_type']),
                                chapter: Number(jsonData['chapter']),
                                loop_count: Number(1),
                            }
                        });
                    }

                    // Insert or Update Story Episode
                    let check_episode = await prisma.storyEpisode.findFirst({
                        where:{
                            story_id: new_story.id,
                            episode: jsonData['episode'],
                            difficulty: Number(jsonData['difficulty'])
                        }
                    });

                    // Story Episode Data Found
                    if(check_episode)
                    {
                        let play_count = check_episode.play_count + 1;

                        // Update the record
                        await prisma.storyEpisode.update({
                            where:{
                                id: check_episode.id
                            },
                            data:{
                                play_status: Number(jsonData['play_status']),
                                difficulty: Number(jsonData['difficulty']),
                                play_count: Number(play_count),
                                clear_count: Number(play_count),
                                play_score: Number(jsonData['play_score'])
                            }
                        });
                    }
                    // Story Episode Data not Found
                    else
                    {
                        // Update the record
                        await prisma.storyEpisode.create({
                            data:{
                                story_id: new_story.id,
                                episode: Number(jsonData['episode']),
                                play_status: Number(jsonData['play_status']),
                                difficulty: Number(jsonData['difficulty']),
                                play_count: Number(1),
                                clear_count: Number(1),
                                play_score: Number(jsonData['play_score'])
                            }
                        });
                    }

                    // Check Loop
                    let checkLoop = await prisma.storyEpisode.count({
                        where:{
                            story_id: new_story.id,
                            difficulty: new_story.loop_count
                        }
                    });

                    if(checkLoop === 5)
                    {
                        let loop_count = new_story.loop_count + 1;

                        await prisma.story.update({
                            where:{
                                id: new_story.id
                            },
                            data:{
                                loop_count: loop_count
                            }
                        });
                    }

                    // Update Stock
                    await prisma.stock.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mytitle_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_list']),
                            mytitle_new_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_new_list']),
                            avatar_face_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_list']),
                            avatar_face_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_new_list']),
                            avatar_eye_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_list']),
                            avatar_eye_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_new_list']),
                            avatar_hair_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_list']),
                            avatar_hair_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_new_list']),
                            avatar_body_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_list']),
                            avatar_body_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_new_list']),
                            avatar_mouth_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_list']),
                            avatar_mouth_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_new_list']),
                            avatar_glasses_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_list']),
                            avatar_glasses_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_new_list']),
                            avatar_face_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_list']),
                            avatar_face_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_new_list']),
                            avatar_body_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_list']),
                            avatar_body_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_new_list']),
                            avatar_behind_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_list']),
                            avatar_behind_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_new_list']),
                            avatar_bg_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_list']),
                            avatar_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_new_list']),
                            avatar_effect_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_list']),
                            avatar_effect_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_new_list']),
                            avatar_special_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_list']),
                            avatar_special_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_new_list']),
                            stamp_list: common.sanitizeInput(jsonData['stock_obj']['stamp_list']),
                            stamp_new_list: common.sanitizeInput(jsonData['stock_obj']['stamp_new_list']),
                            keyholder_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_list']),
                            keyholder_new_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_new_list']),
                            papercup_list: common.sanitizeInput(jsonData['stock_obj']['papercup_list']),
                            papercup_new_list: common.sanitizeInput(jsonData['stock_obj']['papercup_new_list']),
                            tachometer_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_list']),
                            tachometer_new_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_new_list']),
                            aura_list: common.sanitizeInput(jsonData['stock_obj']['aura_list']),
                            aura_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_new_list']),
                            aura_color_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_list']),
                            aura_color_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_new_list']),
                            aura_line_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_list']),
                            aura_line_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_new_list']),
                            bgm_list: common.sanitizeInput(jsonData['stock_obj']['bgm_list']),
                            bgm_new_list: common.sanitizeInput(jsonData['stock_obj']['bgm_new_list']),
                            dx_color_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_list']),
                            dx_color_new_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_new_list']),
                            start_menu_bg_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_list']),
                            start_menu_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_new_list']),
                            under_neon_list: common.sanitizeInput(jsonData['stock_obj']['under_neon_list'])
                        }
                    });

                    // Update User Base
                    await prisma.userBase.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mileage: Number(jsonData['mileage']),
                            cash: Number(jsonData['cash']),
                            total_cash: Number(jsonData['total_cash']),
                            dressup_point: Number(jsonData['dressup_point']),
                            avatar_point: Number(jsonData['avatar_point']),
                            aura_id: Number(jsonData['aura_id']),
                            aura_color_id: Number(jsonData['aura_color_id']),
                            aura_line_id: Number(jsonData['aura_line_id'])
                        }
                    });

                    // Update Ticket Data
                    for(let i=0; i<jsonData['ticket_data'].length; i++)
                    {
                        await prisma.ticket.updateMany({
                            where:{
                                user_id: Number(id),
                                ticket_id: Number(jsonData['ticket_data'][i]['ticket_id'])
                            },
                            data:{
                                ticket_cnt: Number(jsonData['ticket_data'][i]['ticket_cnt'])
                            }
                        })
                    }

                    // Update Mode Rank
                    await prisma.modeRank.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            story_rank: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank']),
                            story_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank_exp']),
                            time_trial_rank: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank']),
                            time_trial_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank_exp']),
                            online_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank']),
                            online_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank_exp']),
                            store_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank']),
                            store_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank_exp']),
                            theory_rank: common.sanitizeInput(jsonData['mode_rank_obj']['theory_rank']),
                            theory_exp: common.sanitizeInput(jsonData['mode_rank_obj']['theory_exp']),
                            pride_group_id: common.sanitizeInput(jsonData['mode_rank_obj']['pride_group_id']),
                            pride_point: common.sanitizeInput(jsonData['mode_rank_obj']['pride_point']),
                            is_last_max: common.sanitizeInput(jsonData['mode_rank_obj']['is_last_max']),
                            grade: common.sanitizeInput(jsonData['mode_rank_obj']['grade']),
                            grade_exp: common.sanitizeInput(jsonData['mode_rank_obj']['grade_exp']),
                        }
                    });

                    // Get Story Data
                    let story = await prisma.story.findMany({
                        where:{
                            user_id: Number(id)
                        },
                        orderBy:{
                            chapter: 'asc'
                        }
                    });
                    let story_data = [];

                    for(let i=0; i<story.length; i++)
                    {
                        // Get Story Episode Data
                        let story_episode = await prisma.storyEpisode.findMany({
                            where:{
                                story_id: story[i].id
                            },
                            orderBy:{
                                episode: 'asc'
                            }
                        });
                        let episode_data = [];

                        for(let j=0; j<story_episode.length; j++)
                        {
                            episode_data.push({
                                episode: story_episode[j].episode,
                                play_status: story_episode[j].play_status,
                                difficulty_data: [
                                    {
                                        difficulty: story_episode[j].difficulty,
                                        play_count: story_episode[j].play_count,
                                        clear_count: story_episode[j].clear_count,
                                        play_status: story_episode[j].play_status,
                                        play_score: story_episode[j].play_score,
                                    }
                                ]
                            });
                        }

                        // Push the data
                        story_data.push({
                            story_type: story[i].story_type,
                            chapter: story[i].chapter,
                            loop_count: story[i].loop_count,
                            episode_data: episode_data
                        });
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        // Story Data
                        story_data: story_data
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


        // Update Car Tune
        app.post("/User/UpdateCarTune", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Check Car Data
                    let car_data = await prisma.car.findFirst({
                        where:{
                            user_id: Number(id),
                            style_car_id: jsonData['style_car_id'],
                        }
                    });

                    // Additional Tune if Using Full Tune Ticket
                    let additinal_tune = {};
                    if(jsonData['use_ticket'] === 1)
                    {
                        additinal_tune = {
                            tune_level: Number(16),
                            tune_parts: Number(131068),
                        }

                        let getTicket = await prisma.ticket.findFirst({
                            where:{
                                user_id: Number(id),
                                ticket_id: Number(25)
                            }
                        });

                        await prisma.ticket.updateMany({
                            where:{
                                id: getTicket!.id
                            },
                            data:{
                                ticket_cnt: Number(getTicket!.ticket_cnt - 1)
                            }
                        });
                    }
                    else
                    {
                        additinal_tune = {
                            tune_level: Number(jsonData['tune_level']),
                            tune_parts: Number(jsonData['tune_parts']),
                        }
                    }

                    // Update Car
                    await prisma.car.updateMany({
                        where:{
                            id: car_data!.id
                        },
                        data:{
                            car_flag: Number(jsonData['car_flag']),
                            tune_point: Number(jsonData['tune_point']),

                            ...additinal_tune
                        }
                    });

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


        // Update Mode Result
        app.post("/User/UpdateModeResult", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Get current date
			        let date = Math.floor(new Date().getTime() / 1000);

                    // Update User Base
                    await prisma.userBase.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            total_play: {
                                increment: 1
                            },
                            daily_play: {
                                increment: 1
                            },
                            day_play: {
                                increment: 1
                            },
                            mileage: common.sanitizeInput(jsonData['mileage']),
                            mytitle_id: common.sanitizeInput(jsonData['mytitle_id']),
                            mytitle_efffect_id: Number(jsonData['mytitle_efffect_id']),
                            standby_play_flag: Number(jsonData['standby_play_flag']),
                            mode_id: common.sanitizeInput(jsonData['mode_id']),
                            tips_list: common.sanitizeInput(jsonData['tips_list']),
                            last_played_date: date
                        }
                    });

                    // Update Config
                    await prisma.config.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            steering_intensity: Number(jsonData['config_obj']['steering_intensity']),
                            transmission_type: Number(jsonData['config_obj']['transmission_type']),
                            default_viewpoint: Number(jsonData['config_obj']['default_viewpoint']),
                            favorite_bgm: Number(jsonData['config_obj']['favorite_bgm']),
                            bgm_volume: Number(jsonData['config_obj']['bgm_volume']),
                            se_volume: Number(jsonData['config_obj']['se_volume']),
                            master_volume: Number(jsonData['config_obj']['master_volume']),
                            store_battle_policy: Number(jsonData['config_obj']['store_battle_policy']),
                            battle_onomatope_display: Number(jsonData['config_obj']['battle_onomatope_display']),
                            cornering_guide: Number(jsonData['config_obj']['cornering_guide']),
                            minimap: Number(jsonData['config_obj']['minimap']),
                            line_guide: Number(jsonData['config_obj']['line_guide']),
                            ghost: Number(jsonData['config_obj']['ghost']),
                            race_exit: Number(jsonData['config_obj']['race_exit']),
                            result_skip: Number(jsonData['config_obj']['result_skip']),
                            stamp_select_skip: Number(jsonData['config_obj']['stamp_select_skip'])
                        }
                    });

                    //  Update Stock
                    await prisma.stock.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mytitle_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_list']),
                            mytitle_new_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_new_list']),
                            avatar_face_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_list']),
                            avatar_face_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_new_list']),
                            avatar_eye_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_list']),
                            avatar_eye_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_new_list']),
                            avatar_hair_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_list']),
                            avatar_hair_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_new_list']),
                            avatar_body_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_list']),
                            avatar_body_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_new_list']),
                            avatar_mouth_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_list']),
                            avatar_mouth_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_new_list']),
                            avatar_glasses_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_list']),
                            avatar_glasses_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_new_list']),
                            avatar_face_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_list']),
                            avatar_face_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_new_list']),
                            avatar_body_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_list']),
                            avatar_body_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_new_list']),
                            avatar_behind_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_list']),
                            avatar_behind_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_new_list']),
                            avatar_bg_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_list']),
                            avatar_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_new_list']),
                            avatar_effect_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_list']),
                            avatar_effect_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_new_list']),
                            avatar_special_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_list']),
                            avatar_special_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_new_list']),
                            stamp_list: common.sanitizeInput(jsonData['stock_obj']['stamp_list']),
                            stamp_new_list: common.sanitizeInput(jsonData['stock_obj']['stamp_new_list']),
                            keyholder_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_list']),
                            keyholder_new_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_new_list']),
                            papercup_list: common.sanitizeInput(jsonData['stock_obj']['papercup_list']),
                            papercup_new_list: common.sanitizeInput(jsonData['stock_obj']['papercup_new_list']),
                            tachometer_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_list']),
                            tachometer_new_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_new_list']),
                            aura_list: common.sanitizeInput(jsonData['stock_obj']['aura_list']),
                            aura_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_new_list']),
                            aura_color_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_list']),
                            aura_color_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_new_list']),
                            aura_line_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_list']),
                            aura_line_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_new_list']),
                            bgm_list: common.sanitizeInput(jsonData['stock_obj']['bgm_list']),
                            bgm_new_list: common.sanitizeInput(jsonData['stock_obj']['bgm_new_list']),
                            dx_color_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_list']),
                            dx_color_new_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_new_list']),
                            start_menu_bg_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_list']),
                            start_menu_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_new_list']),
                            under_neon_list: common.sanitizeInput(jsonData['stock_obj']['under_neon_list'])
                        }
                    });

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        // Server Status
                        // 0 = Offline
                        // 1 = Online
                        server_status: 1
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


        // Update Time Trial Result
		app.post("/User/UpdateTimeTrialResult", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Goal Time Must Not 0
                    if(jsonData['goal_time'] !== 0)
                    {
                        // Check previous user's time trial time
                        let checkTimeTrialTime = await prisma.timeTrialTime.findFirst({
                            where:{
                                member: Number(id),
                                style_car_id: jsonData['style_car_id'],
                                course_id: jsonData['course_id']
                            }
                        });
                        
                        // For Webhook Stuff
                        let newRecord: boolean = false;

                        // Time Trial Time Found
                        if(checkTimeTrialTime)
                        {
                            if(jsonData['goal_time'] < checkTimeTrialTime.value)
                            {
                                newRecord = true;

                                // Update previous record
                                await prisma.timeTrialTime.update({
                                    where:{
                                        id: checkTimeTrialTime.id
                                    },
                                    data:{
                                        value: common.sanitizeInputNotZero(jsonData['goal_time']),
                                        section_time_1: common.sanitizeInputNotZero(jsonData['section_time_1']),
                                        section_time_2: common.sanitizeInputNotZero(jsonData['section_time_2']),
                                        section_time_3: common.sanitizeInputNotZero(jsonData['section_time_3']),
                                        section_time_4: common.sanitizeInputNotZero(jsonData['section_time_4']),
                                        mission: common.sanitizeInput(jsonData['mission']),
                                    }
                                });
                            }
                        }
                        // Time Trial Time Not Found
                        else
                        {
                            newRecord = true;

                            // Get Current Date
                            let date = Math.floor(new Date().getTime() / 1000);

                            // Get Car ID
                            let get_car_id = await prisma.car.findFirst({
                                where:{
                                    user_id: Number(id),
                                    style_car_id: jsonData['style_car_id']
                                },
                                select:{
                                    car_id: true
                                }
                            });

                            // Create New Record
                            await prisma.timeTrialTime.create({
                                data:{
                                    member: Number(id),
                                    course_id: Number(jsonData['course_id']),
                                    value: Number(jsonData['goal_time']),
                                    store: Config.getConfig().shopName || 'Bayshore',
                                    car_id: Number(get_car_id?.car_id) || 0,
                                    style_car_id: Number(jsonData['style_car_id']),
                                    play_dt: date,
                                    section_time_1: Number(jsonData['section_time_1']),
                                    section_time_2: Number(jsonData['section_time_2']),
                                    section_time_3: Number(jsonData['section_time_3']),
                                    section_time_4: Number(jsonData['section_time_4']),
                                    mission: Number(jsonData['mission']),
                                }
                            });
                        }

                        // Send Record to Webhook
                        if(newRecord)
                        {
                            if (process.env.WEBHOOK_ID_TA_LOGS && process.env.WEBHOOK_TOKEN_TA_LOGS)
                            {
                                const ids = process.env.WEBHOOK_ID_TA_LOGS;
                                const token = process.env.WEBHOOK_TOKEN_TA_LOGS;

                                const webhookClient = new WebhookClient({ id: ids, token: token });

                                let taPersonalRank = [{ username: " ", uniqueid: " ", position: 0 }];
                                try {
                                    taPersonalRank = await prisma.$queryRaw`
                                    select "username", "uniqueid", "position" from (
                                        select *, row_number() over(order by "value" ASC) as "position" 
                                        from "timeTrialTime" join "userBase" on "timeTrialTime"."member" = "userBase"."id" 
                                        join "user" on "timeTrialTime"."member" = "user"."id"
                                        where "course_id" = ${jsonData['course_id']}
                                    ) result
                                    where "style_car_id" = ${jsonData['style_car_id']} and "member" = ${Number(id)}`;
                                } catch (e) {
                                    // Print the error
                                    common.writeLog(`${common.getError(e, req.originalUrl)}`);
                                }

                                // Embed Description
                                let description: string = `<:user:1160564775911178362> <@${taPersonalRank[0].uniqueid}>`+
                                                          `\n:round_pushpin: *${courseName[jsonData['course_id']]}*`+
                                                          `\n:stopwatch: *${common.millisToMinutesSecondsMilis(jsonData['goal_time'])}*`+
                                                          `\n:red_car: *${carModel[jsonData['style_car_id']]}*`;

                                // Build the embed
                                const embedString = new EmbedBuilder()
                                    .setTitle(`${taPersonalRank[0].username}`)
                                    .setDescription(description)
                                    .setTimestamp()
                                    .setFooter({ text: `Rank ${taPersonalRank[0].position}` });

                                // Send the embed to webhook
                                webhookClient.send({
                                    content: `**New Time Trial Personal Record!**`,
                                    embeds: [embedString],
                                }).catch(console.error);
                            }
                        }

                        // Check previous user's time trial course skill
                        let checkTimeTrialCourseSkill = await prisma.timeTrialCourseSkill.findFirst({
                            where:{
                                member: Number(id),
                                course_id: jsonData['course_id']
                            }
                        });

                        // Time Trial Course Skill Found
                        if(checkTimeTrialCourseSkill)
                        {
                            // Update previous record
                            await prisma.timeTrialCourseSkill.update({
                                where:{
                                    id: checkTimeTrialCourseSkill.id
                                },
                                data:{
                                    run_counts: Number(checkTimeTrialCourseSkill.run_counts + 1),
                                    skill_level_exp: common.sanitizeInputNotZero(jsonData['skill_level_exp'])
                                }
                            });
                        }
                        // Time Trial Course Skill Not Found
                        else
                        {
                            // Create New Record
                            await prisma.timeTrialCourseSkill.create({
                                data:{
                                    member: Number(id),
                                    course_id: jsonData['course_id'],
                                    run_counts: 1,
                                    skill_level_exp: Number(jsonData['skill_level_exp'])
                                }
                            });
                        }

                        // Update Mode Rank
                        await prisma.modeRank.update({
                            where:{
                                id: Number(id)
                            },
                            data:{
                                story_rank: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank']),
                                story_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank_exp']),
                                time_trial_rank: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank']),
                                time_trial_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank_exp']),
                                online_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank']),
                                online_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank_exp']),
                                store_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank']),
                                store_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank_exp']),
                                theory_rank: common.sanitizeInput(jsonData['mode_rank_obj']['theory_rank']),
                                theory_exp: common.sanitizeInput(jsonData['mode_rank_obj']['theory_exp']),
                                pride_group_id: common.sanitizeInput(jsonData['mode_rank_obj']['pride_group_id']),
                                pride_point: common.sanitizeInput(jsonData['mode_rank_obj']['pride_point']),
                                is_last_max: common.sanitizeInput(jsonData['mode_rank_obj']['is_last_max']),
                                grade: common.sanitizeInput(jsonData['mode_rank_obj']['grade']),
                                grade_exp: common.sanitizeInput(jsonData['mode_rank_obj']['grade_exp']),
                            }
                        });
                    }
                    
                    // Time Trial Event
                    if(Number(jsonData['event_point']) !== 0)
                    {
                        // Check previous user's time trial event point
                        let checkTimeTrialPoint = await prisma.timetrialPoint.findFirst({
                            where:{
                                user_id: Number(id),
                                timetrial_event_id: Number(4)
                            }
                        });

                        if(checkTimeTrialPoint)
                        {
                            await prisma.timetrialPoint.update({
                                where:{
                                    id: checkTimeTrialPoint.id
                                },
                                data:{
                                    point: common.sanitizeInputNotZero(jsonData['event_point'])
                                }
                            });
                        }
                        else
                        {
                            await prisma.timetrialPoint.create({
                                data:{
                                    user_id: Number(id),
                                    timetrial_event_id: Number(1),
                                    point: Number(jsonData['event_point'])
                                }
                            });
                        }
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        course_rank: Number(jsonData['skill_level_exp']),

                        timetrial_event_data: {
                            timetrial_event_id: Number(1),
                            point: Number(jsonData['event_point'])
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


        // Update Theory Result
		app.post("/User/UpdateTheoryResult", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Get current date
			        let date = Math.floor(new Date().getTime() / 1000);

                    // Update User Base
                    await prisma.userBase.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mileage: common.sanitizeInput(jsonData['mileage']),
                            total_cash: common.sanitizeInput(jsonData['total_cash']),
                        }
                    });

                    // Update Mode Rank
                    await prisma.modeRank.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            story_rank: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank']),
                            story_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank_exp']),
                            time_trial_rank: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank']),
                            time_trial_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank_exp']),
                            online_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank']),
                            online_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank_exp']),
                            store_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank']),
                            store_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank_exp']),
                            theory_rank: common.sanitizeInput(jsonData['mode_rank_obj']['theory_rank']),
                            theory_exp: common.sanitizeInput(jsonData['mode_rank_obj']['theory_exp']),
                            pride_group_id: common.sanitizeInput(jsonData['mode_rank_obj']['pride_group_id']),
                            pride_point: common.sanitizeInput(jsonData['mode_rank_obj']['pride_point']),
                            is_last_max: common.sanitizeInput(jsonData['mode_rank_obj']['is_last_max']),
                            grade: common.sanitizeInput(jsonData['mode_rank_obj']['grade']),
                            grade_exp: common.sanitizeInput(jsonData['mode_rank_obj']['grade_exp']),
                            grade_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['grade_reward_dist']),
                            story_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['story_rank_reward_dist']),
                            time_trial_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['time_trial_rank_reward_dist']),
                            online_battle_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['online_battle_rank_reward_dist']),
                            store_battle_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['store_battle_rank_reward_dist']),
                            theory_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['theory_rank_reward_dist']),
                        }
                    });

                    //  Update Stock
                    await prisma.stock.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mytitle_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_list']),
                            mytitle_new_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_new_list']),
                            avatar_face_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_list']),
                            avatar_face_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_new_list']),
                            avatar_eye_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_list']),
                            avatar_eye_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_new_list']),
                            avatar_hair_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_list']),
                            avatar_hair_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_new_list']),
                            avatar_body_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_list']),
                            avatar_body_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_new_list']),
                            avatar_mouth_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_list']),
                            avatar_mouth_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_new_list']),
                            avatar_glasses_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_list']),
                            avatar_glasses_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_new_list']),
                            avatar_face_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_list']),
                            avatar_face_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_new_list']),
                            avatar_body_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_list']),
                            avatar_body_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_new_list']),
                            avatar_behind_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_list']),
                            avatar_behind_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_new_list']),
                            avatar_bg_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_list']),
                            avatar_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_new_list']),
                            avatar_effect_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_list']),
                            avatar_effect_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_new_list']),
                            avatar_special_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_list']),
                            avatar_special_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_new_list']),
                            stamp_list: common.sanitizeInput(jsonData['stock_obj']['stamp_list']),
                            stamp_new_list: common.sanitizeInput(jsonData['stock_obj']['stamp_new_list']),
                            keyholder_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_list']),
                            keyholder_new_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_new_list']),
                            papercup_list: common.sanitizeInput(jsonData['stock_obj']['papercup_list']),
                            papercup_new_list: common.sanitizeInput(jsonData['stock_obj']['papercup_new_list']),
                            tachometer_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_list']),
                            tachometer_new_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_new_list']),
                            aura_list: common.sanitizeInput(jsonData['stock_obj']['aura_list']),
                            aura_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_new_list']),
                            aura_color_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_list']),
                            aura_color_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_new_list']),
                            aura_line_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_list']),
                            aura_line_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_new_list']),
                            bgm_list: common.sanitizeInput(jsonData['stock_obj']['bgm_list']),
                            bgm_new_list: common.sanitizeInput(jsonData['stock_obj']['bgm_new_list']),
                            dx_color_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_list']),
                            dx_color_new_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_new_list']),
                            start_menu_bg_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_list']),
                            start_menu_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_new_list']),
                            under_neon_list: common.sanitizeInput(jsonData['stock_obj']['under_neon_list'])
                        }
                    });

                    // Update Ticket Data
                    for(let i=0; i<jsonData['ticket_data'].length; i++)
                    {
                        await prisma.ticket.updateMany({
                            where:{
                                user_id: Number(id),
                                ticket_id: Number(jsonData['ticket_data'][i]['ticket_id'])
                            },
                            data:{
                                ticket_cnt: Number(jsonData['ticket_data'][i]['ticket_cnt'])
                            }
                        });
                    }

                    // Update Theory Data
                    let checkTheoryData = await prisma.theoryData.findFirst({
                        where:{
                            user_id: Number(id)
                        }
                    });

                    if(checkTheoryData)
                    {
                        await prisma.theoryData.update({
                            where:{
                                id: checkTheoryData.id
                            },
                            data:{
                                play_count: Number(checkTheoryData.play_count + 1),
                                play_count_multi: 0,
                                partner_id: common.sanitizeInput(jsonData['partner_id']),
                                partner_progress: common.sanitizeInput(jsonData['partner_progress']),
                                partner_progress_score: common.sanitizeInput(jsonData['partner_progress_score']),
                                practice_start_rank: common.sanitizeInput(jsonData['practice_start_rank']),
                                general_flag: common.sanitizeInput(jsonData['general_flag']),
                                vs_history: common.sanitizeInput(jsonData['vs_history']),
                                vs_history_multi: common.sanitizeInput(jsonData['vs_history_multi']),
                                win_count: 0,
                                win_count_multi: 0
                            }
                        });
                    }
                    else
                    {
                        await prisma.theoryData.create({
                            data:{
                                user_id: Number(id),
                                play_count: Number(1),
                                play_count_multi: Number(0),
                                partner_id: Number(jsonData['partner_id']),
                                partner_progress: Number(jsonData['partner_progress']),
                                partner_progress_score: Number(jsonData['partner_progress_score']),
                                practice_start_rank: Number(jsonData['practice_start_rank']),
                                general_flag: Number(jsonData['general_flag']),
                                vs_history: Number(jsonData['vs_history']),
                                vs_history_multi: Number(0),
                                win_count: Number(0),
                                win_count_multi: Number(0)
                            }
                        });
                    }

                    // Update Theory Course Mode
                    let checkTheoryCourseData = await prisma.theoryCourseData.findFirst({
                        where:{
                            user_id: Number(id),
                            course_id: Number(jsonData['course_id'])
                        }
                    });

                    if(checkTheoryCourseData)
                    {
                        await prisma.theoryCourseData.update({
                            where:{
                                id: checkTheoryCourseData.id
                            },
                            data:{
                                max_victory_grade: common.sanitizeInput(jsonData['max_victory_grade']),
                                run_count: Number(checkTheoryCourseData.run_count + 1),
                                powerhouse_lv: common.sanitizeInput(jsonData['powerhouse_lv']),
                                powerhouse_exp: common.sanitizeInput(jsonData['powerhouse_exp']),
                                played_powerhouse_lv: common.sanitizeInput(jsonData['powerhouse_lv']),
                                update_dt: date
                            }
                        });
                    }
                    else
                    {
                        await prisma.theoryCourseData.create({
                            data:{
                                user_id: Number(id),
                                course_id: Number(jsonData['course_id']),
                                max_victory_grade: Number(jsonData['max_victory_grade']),
                                run_count: Number(0),
                                powerhouse_lv: Number(jsonData['powerhouse_lv']),
                                powerhouse_exp: Number(jsonData['powerhouse_exp']),
                                played_powerhouse_lv: Number(jsonData['powerhouse_lv']),
                                update_dt: date,
                            }
                        });
                    }

                    // Update Theory Partner Data
                    let checkTheoryPartnerData = await prisma.theoryPartnerData.findFirst({
                        where:{
                            user_id: Number(id),
                            partner_id: Number(jsonData['partner_id'])
                        }
                    });

                    if(checkTheoryPartnerData)
                    {
                        await prisma.theoryPartnerData.update({
                            where:{
                                id: checkTheoryPartnerData.id
                            },
                            data:{
                                fellowship_lv: common.sanitizeInput(jsonData['fellowship_lv']),
                                fellowship_exp: common.sanitizeInput(jsonData['fellowship_exp']),
                            }
                        });
                    }
                    else
                    {
                        await prisma.theoryPartnerData.create({
                            data:{
                                user_id: Number(id),
                                partner_id: Number(jsonData['partner_id']),
                                fellowship_lv: Number(jsonData['fellowship_lv']),
                                fellowship_exp: Number(jsonData['fellowship_exp']),
                            }
                        });
                    }

                    // Update Theory Running Pram Mode
                    let checkTheoryRunningPramData = await prisma.theoryRunningPramData.findFirst({
                        where:{
                            user_id: Number(id),
                            course_id: Number(jsonData['course_id'])
                        }
                    });

                    if(checkTheoryRunningPramData)
                    {
                        await prisma.theoryRunningPramData.update({
                            where:{
                                id: checkTheoryRunningPramData.id
                            },
                            data:{
                                attack: common.sanitizeInput(jsonData['attack']),
                                defense: common.sanitizeInput(jsonData['defense']),
                                safety: common.sanitizeInput(jsonData['safety']),
                                runaway: common.sanitizeInput(jsonData['runaway']),
                                trick_flag: common.sanitizeInput(jsonData['trick_flag']),
                            }
                        });
                    }
                    else
                    {
                        await prisma.theoryRunningPramData.create({
                            data:{
                                user_id: Number(id),
                                course_id: Number(jsonData['course_id']),
                                attack: Number(jsonData['attack']),
                                defense: Number(jsonData['defense']),
                                safety: Number(jsonData['safety']),
                                runaway: Number(jsonData['runaway']),
                                trick_flag: Number(jsonData['trick_flag']),
                            }
                        });
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",
                        played_powerhouse_lv: jsonData['powerhouse_lv'],
                        car_use_count: [],
                        maker_use_count: [],
                        play_count: 1,
                        play_count_multi: 1,
                        win_count: 1,
                        win_count_multi: 1
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


        // Update Special Mode Result
		app.post("/User/UpdateSpecialModeResult", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Check Car Data
                    let car_data = await prisma.car.findFirst({
                        where:{
                            user_id: Number(id),
                            style_car_id: jsonData['style_car_id'],
                        }
                    });

                    // Update Car
                    await prisma.car.updateMany({
                        where:{
                            id: car_data!.id
                        },
                        data:{
                            car_mileage: Number(jsonData['car_mileage']),
                            timetrial_use_count: Number(car_data!.timetrial_use_count + 1)
                        }
                    });

                    // Check User's Special Mode Result
                    let checkSpecialModeResult = await prisma.specialModeResult.findFirst({
                        where:{
                            user_id: Number(id),
                            story_type: jsonData['story_type'],
                            vs_type: jsonData['vs_type']
                        }
                    });

                    let specialModeResultData = {
                        story_type: Number(jsonData['story_type']),
                        vs_type: Number(jsonData['vs_type']),
                        play_difficulty: Number(jsonData['play_difficulty']),
                        cleared_difficulty: Number(jsonData['cleared_difficulty']),
                        weak_difficulty: Number(jsonData['weak_difficulty']),
                        eval_id: Number(jsonData['eval_id']),
                        advantage: Number(jsonData['advantage']),
                        sec1_advantage_avg: Number(jsonData['sec1_advantage_avg']),
                        sec2_advantage_avg: Number(jsonData['sec2_advantage_avg']),
                        sec3_advantage_avg: Number(jsonData['sec3_advantage_avg']),
                        sec4_advantage_avg: Number(jsonData['sec4_advantage_avg']),
                        nearby_advantage_rate: Number(jsonData['nearby_advantage_rate']),
                        win_flag: Number(jsonData['win_flag']),
                        result: Number(jsonData['result']),
                        record: Number(jsonData['record']),
                        course_id: Number(jsonData['course_id']),
                        last_play_course_id: Number(jsonData['last_play_course_id']),
                        course_day: Number(jsonData['course_day']),
                        hint_display_flag: Number(jsonData['hint_display_flag']),
                    }

                    // Win the Race
                    if(specialModeResultData.advantage >= 0)
                    {
                        // Get current date
			            let date = Math.floor(new Date().getTime() / 1000);

                        // Special Mode Result found
                        if(checkSpecialModeResult)
                        {
                            // Update the record
                            await prisma.specialModeResult.updateMany({
                                where:{
                                    user_id: Number(id),
                                    story_type: jsonData['story_type'],
                                    vs_type: jsonData['vs_type']
                                },
                                data: {
                                    ...specialModeResultData,
                                    play_dt: date,
                                    store: Config.getConfig().shopName || 'Bayshore',
                                }
                            });
                        }
                        // Special Mode Result not found
                        else
                        {
                            // Create new record
                            await prisma.specialModeResult.create({
                                data: {
                                    ...specialModeResultData,
                                    user_id: Number(id),
                                    style_car_id: Number(jsonData['style_car_id']),
                                    play_dt: date,
                                    store: Config.getConfig().shopName || 'Bayshore',
                                }
                            });
                        }
                    }

                    //  Update Stock
                    await prisma.stock.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mytitle_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_list']),
                            mytitle_new_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_new_list']),
                            avatar_face_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_list']),
                            avatar_face_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_new_list']),
                            avatar_eye_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_list']),
                            avatar_eye_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_new_list']),
                            avatar_hair_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_list']),
                            avatar_hair_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_new_list']),
                            avatar_body_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_list']),
                            avatar_body_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_new_list']),
                            avatar_mouth_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_list']),
                            avatar_mouth_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_new_list']),
                            avatar_glasses_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_list']),
                            avatar_glasses_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_new_list']),
                            avatar_face_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_list']),
                            avatar_face_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_new_list']),
                            avatar_body_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_list']),
                            avatar_body_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_new_list']),
                            avatar_behind_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_list']),
                            avatar_behind_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_new_list']),
                            avatar_bg_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_list']),
                            avatar_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_new_list']),
                            avatar_effect_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_list']),
                            avatar_effect_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_new_list']),
                            avatar_special_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_list']),
                            avatar_special_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_new_list']),
                            stamp_list: common.sanitizeInput(jsonData['stock_obj']['stamp_list']),
                            stamp_new_list: common.sanitizeInput(jsonData['stock_obj']['stamp_new_list']),
                            keyholder_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_list']),
                            keyholder_new_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_new_list']),
                            papercup_list: common.sanitizeInput(jsonData['stock_obj']['papercup_list']),
                            papercup_new_list: common.sanitizeInput(jsonData['stock_obj']['papercup_new_list']),
                            tachometer_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_list']),
                            tachometer_new_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_new_list']),
                            aura_list: common.sanitizeInput(jsonData['stock_obj']['aura_list']),
                            aura_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_new_list']),
                            aura_color_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_list']),
                            aura_color_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_new_list']),
                            aura_line_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_list']),
                            aura_line_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_new_list']),
                            bgm_list: common.sanitizeInput(jsonData['stock_obj']['bgm_list']),
                            bgm_new_list: common.sanitizeInput(jsonData['stock_obj']['bgm_new_list']),
                            dx_color_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_list']),
                            dx_color_new_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_new_list']),
                            start_menu_bg_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_list']),
                            start_menu_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_new_list']),
                            under_neon_list: common.sanitizeInput(jsonData['stock_obj']['under_neon_list'])
                        }
                    });

                    // Update User Base
                    await prisma.userBase.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            cash: common.sanitizeInputNotZero(jsonData['cash']),
                            total_cash: common.sanitizeInputNotZero(jsonData['total_cash']),
                            dressup_point: common.sanitizeInputNotZero(jsonData['dressup_point']),
                            avatar_point: common.sanitizeInputNotZero(jsonData['avatar_point']),
                            aura_id: common.sanitizeInputNotZero(jsonData['aura_id']),
                            aura_color_id: common.sanitizeInputNotZero(jsonData['aura_color_id']),
                            aura_line_id: common.sanitizeInputNotZero(jsonData['aura_line_id']),
                            mileage: common.sanitizeInputNotZero(jsonData['mileage'])
                        }
                    });

                    // Update Ticket Data
                    for(let i=0; i<jsonData['ticket_data'].length; i++)
                    {
                        await prisma.ticket.updateMany({
                            where:{
                                user_id: Number(id),
                                ticket_id: Number(jsonData['ticket_data'][i]['ticket_id'])
                            },
                            data:{
                                ticket_cnt: Number(jsonData['ticket_data'][i]['ticket_cnt'])
                            }
                        });
                    }

                    // Update Mode Rank
                    await prisma.modeRank.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            story_rank: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank']),
                            story_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank_exp']),
                            time_trial_rank: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank']),
                            time_trial_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank_exp']),
                            online_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank']),
                            online_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank_exp']),
                            store_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank']),
                            store_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank_exp']),
                            theory_rank: common.sanitizeInput(jsonData['mode_rank_obj']['theory_rank']),
                            theory_exp: common.sanitizeInput(jsonData['mode_rank_obj']['theory_exp']),
                            pride_group_id: common.sanitizeInput(jsonData['mode_rank_obj']['pride_group_id']),
                            pride_point: common.sanitizeInput(jsonData['mode_rank_obj']['pride_point']),
                            is_last_max: common.sanitizeInput(jsonData['mode_rank_obj']['is_last_max']),
                            grade: common.sanitizeInput(jsonData['mode_rank_obj']['grade']),
                            grade_exp: common.sanitizeInput(jsonData['mode_rank_obj']['grade_exp']),
                            grade_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['grade_reward_dist']),
                            story_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['story_rank_reward_dist']),
                            time_trial_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['time_trial_rank_reward_dist']),
                            online_battle_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['online_battle_rank_reward_dist']),
                            store_battle_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['store_battle_rank_reward_dist']),
                            theory_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['theory_rank_reward_dist']),
                        }
                    });

                    // Get Special Mode Data
                    let special_mode = await prisma.specialModeResult.findMany({
                        where:{
                            user_id: Number(id)
                        }
                    });

                    let special_mode_data = [];
                    for(let i=0; i<special_mode.length; i++)
                    {
                        special_mode_data.push({
                            story_type: special_mode[i].story_type,
                            vs_type: special_mode[i].vs_type,
                            max_clear_lv: special_mode[i].cleared_difficulty,
                            last_play_lv: special_mode[i].play_difficulty,
                            last_play_course_id: special_mode[i].last_play_course_id,
                        });
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        // Special Mode Data
                        special_mode_data: special_mode_data,

                        // Car Use Count
                        car_use_count: [],

                        // Maker Use Count
                        maker_use_count: []
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

        // Update Challenge Mode Result
		app.post("/User/UpdateChallengeModeResult", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Check User's Challenge Mode Result
                    let checkChallengeModeResult = await prisma.challengeModeResult.findFirst({
                        where:{
                            user_id: Number(id),
                            story_type: jsonData['story_type'],
                            vs_type: jsonData['vs_type']
                        }
                    });

                    let challengeModeResultData = {
                        story_type: Number(jsonData['story_type']),
                        vs_type: Number(jsonData['vs_type']),
                        play_difficulty: Number(jsonData['play_difficulty']),
                        cleared_difficulty: Number(jsonData['cleared_difficulty']),
                        eval_id: Number(jsonData['eval_id']),
                        advantage: Number(jsonData['advantage']),
                        sec1_advantage_avg: Number(jsonData['sec1_advantage_avg']),
                        sec2_advantage_avg: Number(jsonData['sec2_advantage_avg']),
                        sec3_advantage_avg: Number(jsonData['sec3_advantage_avg']),
                        sec4_advantage_avg: Number(jsonData['sec4_advantage_avg']),
                        nearby_advantage_rate: Number(jsonData['nearby_advantage_rate']),
                        win_flag: Number(jsonData['win_flag']),
                        result: Number(jsonData['result']),
                        record: Number(jsonData['record']),
                        course_id: Number(jsonData['course_id']),
                        last_play_course_id: Number(jsonData['last_play_course_id']),
                        course_day: Number(jsonData['course_day']),
                    }

                    // Win the Race
                    if(challengeModeResultData.advantage >= 0)
                    {
                        // Get current date
			            let date = Math.floor(new Date().getTime() / 1000);

                        // Challenge Mode Result found
                        if(checkChallengeModeResult)
                        {
                            // Update the record
                            await prisma.challengeModeResult.updateMany({
                                where:{
                                    user_id: Number(id),
                                    story_type: jsonData['story_type'],
                                    vs_type: jsonData['vs_type']
                                },
                                data: {
                                    ...challengeModeResultData,
                                    play_dt: date,
                                    store: Config.getConfig().shopName || 'Bayshore',
                                }
                            });
                        }
                        // Special Mode Result not found
                        else
                        {
                            // Create new record
                            await prisma.challengeModeResult.create({
                                data: {
                                    ...challengeModeResultData,
                                    user_id: Number(id),
                                    style_car_id: Number(jsonData['style_car_id']),
                                    play_dt: date,
                                    store: Config.getConfig().shopName || 'Bayshore',
                                }
                            });
                        }
                        
                        if (process.env.WEBHOOK_ID_BUNTA_LOGS && process.env.WEBHOOK_TOKEN_BUNTA_LOGS)
                        {
                            const ids = process.env.WEBHOOK_ID_BUNTA_LOGS;
                            const token = process.env.WEBHOOK_TOKEN_BUNTA_LOGS;

                            const webhookClient = new WebhookClient({ id: ids, token: token });

                            const advantage = Number(jsonData['advantage']) / 10;

                            let getUniqueId = await prisma.user.findFirst({
                                where:{
                                    id: Number(id)
                                },
                                select:{
                                    uniqueid: true
                                }
                            });

                            // Embed Description
                            let description: string = `<:user:1160564775911178362> <@${getUniqueId?.uniqueid}>`+
                                                      `\n:round_pushpin: *${courseName[jsonData['course_id']]}*`+
                                                      `\n:star: *${jsonData['cleared_difficulty']} (${advantage}m)*`+
                                                      `\n:red_car: *${carModel[jsonData['style_car_id']]}*`;

                            let username = await prisma.userBase.findFirst({
                                where:{
                                    id: Number(id)
                                },
                                select:{
                                    username: true
                                }
                            });

                            // Build the embed
                            const embedString = new EmbedBuilder()
                                .setTitle(`${username?.username}`)
                                .setDescription(description)
                                .setTimestamp();

                            // Send the embed to webhook
                            webhookClient.send({
                                content: `**New Bunta Challenge Personal Record!**`,
                                embeds: [embedString],
                            }).catch(console.error);
                        }
                        
                    }

                    //  Update Stock
                    await prisma.stock.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mytitle_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_list']),
                            mytitle_new_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_new_list']),
                            avatar_face_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_list']),
                            avatar_face_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_new_list']),
                            avatar_eye_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_list']),
                            avatar_eye_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_new_list']),
                            avatar_hair_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_list']),
                            avatar_hair_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_new_list']),
                            avatar_body_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_list']),
                            avatar_body_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_new_list']),
                            avatar_mouth_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_list']),
                            avatar_mouth_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_new_list']),
                            avatar_glasses_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_list']),
                            avatar_glasses_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_new_list']),
                            avatar_face_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_list']),
                            avatar_face_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_new_list']),
                            avatar_body_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_list']),
                            avatar_body_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_new_list']),
                            avatar_behind_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_list']),
                            avatar_behind_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_new_list']),
                            avatar_bg_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_list']),
                            avatar_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_new_list']),
                            avatar_effect_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_list']),
                            avatar_effect_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_new_list']),
                            avatar_special_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_list']),
                            avatar_special_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_new_list']),
                            stamp_list: common.sanitizeInput(jsonData['stock_obj']['stamp_list']),
                            stamp_new_list: common.sanitizeInput(jsonData['stock_obj']['stamp_new_list']),
                            keyholder_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_list']),
                            keyholder_new_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_new_list']),
                            papercup_list: common.sanitizeInput(jsonData['stock_obj']['papercup_list']),
                            papercup_new_list: common.sanitizeInput(jsonData['stock_obj']['papercup_new_list']),
                            tachometer_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_list']),
                            tachometer_new_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_new_list']),
                            aura_list: common.sanitizeInput(jsonData['stock_obj']['aura_list']),
                            aura_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_new_list']),
                            aura_color_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_list']),
                            aura_color_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_new_list']),
                            aura_line_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_list']),
                            aura_line_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_new_list']),
                            bgm_list: common.sanitizeInput(jsonData['stock_obj']['bgm_list']),
                            bgm_new_list: common.sanitizeInput(jsonData['stock_obj']['bgm_new_list']),
                            dx_color_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_list']),
                            dx_color_new_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_new_list']),
                            start_menu_bg_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_list']),
                            start_menu_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_new_list']),
                            under_neon_list: common.sanitizeInput(jsonData['stock_obj']['under_neon_list'])
                        }
                    });

                    // Update User Base
                    await prisma.userBase.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            cash: common.sanitizeInputNotZero(jsonData['cash']),
                            total_cash: common.sanitizeInputNotZero(jsonData['total_cash']),
                            dressup_point: common.sanitizeInputNotZero(jsonData['dressup_point']),
                            avatar_point: common.sanitizeInputNotZero(jsonData['avatar_point']),
                            aura_id: common.sanitizeInputNotZero(jsonData['aura_id']),
                            aura_color_id: common.sanitizeInputNotZero(jsonData['aura_color_id']),
                            aura_line_id: common.sanitizeInputNotZero(jsonData['aura_line_id']),
                            mileage: common.sanitizeInputNotZero(jsonData['mileage'])
                        }
                    });

                    // Update Ticket Data
                    for(let i=0; i<jsonData['ticket_data'].length; i++)
                    {
                        await prisma.ticket.updateMany({
                            where:{
                                user_id: Number(id),
                                ticket_id: Number(jsonData['ticket_data'][i]['ticket_id'])
                            },
                            data:{
                                ticket_cnt: Number(jsonData['ticket_data'][i]['ticket_cnt'])
                            }
                        })
                    }

                    // Update Mode Rank
                    await prisma.modeRank.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            story_rank: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank']),
                            story_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank_exp']),
                            time_trial_rank: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank']),
                            time_trial_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank_exp']),
                            online_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank']),
                            online_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank_exp']),
                            store_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank']),
                            store_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank_exp']),
                            theory_rank: common.sanitizeInput(jsonData['mode_rank_obj']['theory_rank']),
                            theory_exp: common.sanitizeInput(jsonData['mode_rank_obj']['theory_exp']),
                            pride_group_id: common.sanitizeInput(jsonData['mode_rank_obj']['pride_group_id']),
                            pride_point: common.sanitizeInput(jsonData['mode_rank_obj']['pride_point']),
                            is_last_max: common.sanitizeInput(jsonData['mode_rank_obj']['is_last_max']),
                            grade: common.sanitizeInput(jsonData['mode_rank_obj']['grade']),
                            grade_exp: common.sanitizeInput(jsonData['mode_rank_obj']['grade_exp']),
                            grade_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['grade_reward_dist']),
                            story_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['story_rank_reward_dist']),
                            time_trial_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['time_trial_rank_reward_dist']),
                            online_battle_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['online_battle_rank_reward_dist']),
                            store_battle_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['store_battle_rank_reward_dist']),
                            theory_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['theory_rank_reward_dist']),
                        }
                    });

                    // Get Challenge Mode Data
                    let challenge_mode = await prisma.challengeModeResult.findMany({
                        where:{
                            user_id: Number(id)
                        }
                    });
                    
                    let challenge_mode_data = [];
                    for(let i=0; i<challenge_mode.length; i++)
                    {
                        challenge_mode_data.push({
                            story_type: challenge_mode[i].story_type,
                            vs_type: challenge_mode[i].vs_type,
                            max_clear_lv: challenge_mode[i].cleared_difficulty,
                            last_play_lv: challenge_mode[i].play_difficulty,
                            last_play_course_id: challenge_mode[i].last_play_course_id,
                        });
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",

                        // Challenge Mode Data
                        challenge_mode_data: challenge_mode_data,

                        // Car Use Count
                        car_use_count: [],

                        // Maker Use Count
                        maker_use_count: []
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


        // Update Store Battle Result
        app.post("/User/UpdateStoreBattleResult", function(req, res) {

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
                    // Get the Session ID
                    let id = common.getHeader(req.rawHeaders);

                    // Check Car Data
                    let car_data = await prisma.car.findFirst({
                        where:{
                            user_id: Number(id),
                            style_car_id: jsonData['style_car_id'],
                        }
                    });

                    // Update Car
                    await prisma.car.updateMany({
                        where:{
                            id: car_data!.id
                        },
                        data:{
                            car_mileage: Number(jsonData['car_mileage'])
                        }
                    });

                    // Update User Base
                    await prisma.userBase.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            mileage: Number(jsonData['mileage']),
                            cash: Number(jsonData['cash']),
                            total_cash: Number(jsonData['total_cash']),
                            dressup_point: Number(jsonData['dressup_point']),
                            avatar_point: Number(jsonData['avatar_point']),
                            aura_id: Number(jsonData['aura_id']),
                            aura_color_id: Number(jsonData['aura_color_id']),
                            aura_line_id: Number(jsonData['aura_line_id'])
                        }
                    });

                    // Generate Stock
                    await prisma.stock.create({
                        data: {
                            id: Number(id),
                            mytitle_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_list']),
                            mytitle_new_list: common.sanitizeInput(jsonData['stock_obj']['mytitle_new_list']),
                            avatar_face_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_list']),
                            avatar_face_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_new_list']),
                            avatar_eye_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_list']),
                            avatar_eye_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_eye_new_list']),
                            avatar_hair_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_list']),
                            avatar_hair_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_hair_new_list']),
                            avatar_body_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_list']),
                            avatar_body_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_new_list']),
                            avatar_mouth_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_list']),
                            avatar_mouth_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_mouth_new_list']),
                            avatar_glasses_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_list']),
                            avatar_glasses_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_glasses_new_list']),
                            avatar_face_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_list']),
                            avatar_face_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_face_accessory_new_list']),
                            avatar_body_accessory_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_list']),
                            avatar_body_accessory_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_body_accessory_new_list']),
                            avatar_behind_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_list']),
                            avatar_behind_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_behind_new_list']),
                            avatar_bg_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_list']),
                            avatar_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_bg_new_list']),
                            avatar_effect_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_list']),
                            avatar_effect_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_effect_new_list']),
                            avatar_special_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_list']),
                            avatar_special_new_list: common.sanitizeInput(jsonData['stock_obj']['avatar_special_new_list']),
                            stamp_list: common.sanitizeInput(jsonData['stock_obj']['stamp_list']),
                            stamp_new_list: common.sanitizeInput(jsonData['stock_obj']['stamp_new_list']),
                            keyholder_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_list']),
                            keyholder_new_list: common.sanitizeInput(jsonData['stock_obj']['keyholder_new_list']),
                            papercup_list: common.sanitizeInput(jsonData['stock_obj']['papercup_list']),
                            papercup_new_list: common.sanitizeInput(jsonData['stock_obj']['papercup_new_list']),
                            tachometer_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_list']),
                            tachometer_new_list: common.sanitizeInput(jsonData['stock_obj']['tachometer_new_list']),
                            aura_list: common.sanitizeInput(jsonData['stock_obj']['aura_list']),
                            aura_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_new_list']),
                            aura_color_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_list']),
                            aura_color_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_color_new_list']),
                            aura_line_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_list']),
                            aura_line_new_list: common.sanitizeInput(jsonData['stock_obj']['aura_line_new_list']),
                            bgm_list: common.sanitizeInput(jsonData['stock_obj']['bgm_list']),
                            bgm_new_list: common.sanitizeInput(jsonData['stock_obj']['bgm_new_list']),
                            dx_color_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_list']),
                            dx_color_new_list: common.sanitizeInput(jsonData['stock_obj']['dx_color_new_list']),
                            start_menu_bg_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_list']),
                            start_menu_bg_new_list: common.sanitizeInput(jsonData['stock_obj']['start_menu_bg_new_list']),
                            under_neon_list: common.sanitizeInput(jsonData['stock_obj']['under_neon_list']),
                        }
                    });

                    // Update Ticket Data
                    for(let i=0; i<jsonData['ticket_data'].length; i++)
                    {
                        await prisma.ticket.updateMany({
                            where:{
                                user_id: Number(id),
                                ticket_id: Number(jsonData['ticket_data'][i]['ticket_id'])
                            },
                            data:{
                                ticket_cnt: Number(jsonData['ticket_data'][i]['ticket_cnt'])
                            }
                        })
                    }

                    // Update Mode Rank
                    await prisma.modeRank.update({
                        where:{
                            id: Number(id)
                        },
                        data:{
                            story_rank: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank']),
                            story_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['story_rank_exp']),
                            time_trial_rank: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank']),
                            time_trial_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['time_trial_rank_exp']),
                            online_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank']),
                            online_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['online_battle_rank_exp']),
                            store_battle_rank: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank']),
                            store_battle_rank_exp: common.sanitizeInput(jsonData['mode_rank_obj']['store_battle_rank_exp']),
                            theory_rank: common.sanitizeInput(jsonData['mode_rank_obj']['theory_rank']),
                            theory_exp: common.sanitizeInput(jsonData['mode_rank_obj']['theory_exp']),
                            pride_group_id: common.sanitizeInput(jsonData['mode_rank_obj']['pride_group_id']),
                            pride_point: common.sanitizeInput(jsonData['mode_rank_obj']['pride_point']),
                            is_last_max: common.sanitizeInput(jsonData['mode_rank_obj']['is_last_max']),
                            grade: common.sanitizeInput(jsonData['mode_rank_obj']['grade']),
                            grade_exp: common.sanitizeInput(jsonData['mode_rank_obj']['grade_exp']),
                            grade_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['grade_reward_dist']),
                            story_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['story_rank_reward_dist']),
                            time_trial_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['time_trial_rank_reward_dist']),
                            online_battle_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['online_battle_rank_reward_dist']),
                            store_battle_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['store_battle_rank_reward_dist']),
                            theory_rank_reward_dist: common.sanitizeInput(jsonData['reward_dist_obj']['theory_rank_reward_dist']),
                        }
                    });

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


        // Get Player Data's Time Trial Data
        app.post("/User/GetTAData", function(req, res) {

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
                    
                    // Get User's time trial data
                    let timeTrialData = await prisma.timeTrialTime.findMany({
                        where:{
                            member: Number(id)
                        },
                        orderBy:{
                            course_id: 'asc'
                        },
                        distinct: ['course_id']
                    });

                    // Store the time trial data end get the course skill
                    let timetrialdataarr = [];
                    for(let i=0; i<timeTrialData.length; i++)
                    {
                        let timeTrialSkillData = await prisma.timeTrialCourseSkill.findFirst({
                            where:{
                                member: Number(id),
                                course_id: timeTrialData[i].course_id
                            }
                        });

                        // Get TA Ranking
                        let taRanking = [{ rank: 0 }];
                        taRanking = await prisma.$queryRaw`
                        select "rank" from 
                        (select *, row_number() over(order by "value" ASC) as "rank" from "timeTrialTime" 
                        where "course_id" = ${timeTrialData[i].course_id}) "timeTrialTime" where "member" = ${Number(id)}`;

                        timetrialdataarr.push({
                            style_car_id: timeTrialData[i].style_car_id,
                            course_id: timeTrialData[i].course_id,
                            skill_level_exp: timeTrialSkillData?.skill_level_exp || 0,
                            goal_time: timeTrialData[i].value,
                            rank: Number(taRanking[0].rank),
                            rank_dt: timeTrialData[i].play_dt,
                        });
                    }

                    // Generate Success Response Data
                    resParams = {
                        status_code: "0",
                        season_id: 2,
                        timetrial_data: timetrialdataarr,
                        past_season_timetrial_data: timetrialdataarr
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
    }
}