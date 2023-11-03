import chalk from "chalk";
import { EmbedBuilder, WebhookClient } from 'discord.js';


// Event Type enum
export const event = {
    // Error Messages
    error: 0,

    // Boot Messages
    boot: 1,

    // Mucha Messages
    mucha: 2,

    // Allnet Messages
    allnet: 3,

    // Website Messages
    website: 4,

    // Versus Messages
    versus: 5,

    // Echo2 Messages
    billing: 6
};

// Sanitize Input not Undefined
export function sanitizeInput(value: any)
{
    return (value == null || value == undefined || value == '') ? undefined : value;
}


// Sanitize Input Number not Undefined and Zero
export function sanitizeInputNotZero(value: number)
{
    return (value !== null && value !== undefined && value !== 0) ? value : undefined;
}


// Sanitize Input Number not Undefined, Zero, and One
export function sanitizeInputNotZeroOne(value: number)
{
    return (value !== null && value !== undefined && value !== 0 && value !== 1) ? value : undefined;
}


// Get Time Stamp (for log)
export function getTimeStamp(date: Date = new Date())
{
    // Return a timestamp string for the current / provided time
    return String("[" + date.toLocaleString() + "]");
}


// Write Log
export async function writeLog(message: string, type?: number)
{
    try {
        // Get the current timestamp
        const timestamp: string = getTimeStamp();

        // Full message placeholder
        let fullMessage: string;
        let fullMessage2: string;

        // Switch on the event type
        switch (type)
        {
            case event.boot:
            {
                // Generate the message content, write to console
                fullMessage = chalk.green(timestamp) + ' | BOOT    | ' + message;
                fullMessage2 = timestamp + ' | BOOT    | ' + message;

                console.log(fullMessage);
                break;
            }
            case event.error:
            {
                // Generate the message content, write to console
                fullMessage = chalk.green(timestamp) + ' | ' + chalk.red('ERROR  ') + ' | ' + message;
                fullMessage2 = timestamp + ' | ERROR   | ' + message;

                console.log(fullMessage);
                break;
            }
            case event.mucha:
            {
                // Generate the message content, write to console
                fullMessage = chalk.green(timestamp) + ' | ' + chalk.rgb(112, 146, 190)('MUCHA  ') + ' | '  + message;
                fullMessage2 = timestamp + ' | MUCHA   | ' + message;

                console.log(fullMessage);
                break;
            }
            case event.allnet:
            {
                // Generate the message content, write to console
                fullMessage = chalk.green(timestamp) + ' | ' + chalk.cyan('ALLNET ') + ' | ' + message;
                fullMessage2 = timestamp + ' | ALLNET  | ' + message;

                console.log(fullMessage);
                break;
            }
            case event.website:
            {
                // Generate the message content, write to console
                fullMessage = chalk.green(timestamp) + ' | ' + chalk.rgb(248, 146, 233)('WEBSITE') + ' | ' + message;
                fullMessage2 = timestamp + ' | WEBSITE | ' + message;

                console.log(fullMessage);
                break;
            }
            case event.versus:
            {
                // Generate the message content, write to console
                fullMessage = chalk.green(timestamp) + ' | ' + chalk.rgb(180, 199, 243)('VERSUS ') + ' | '  + message;
                fullMessage2 = timestamp + ' | VERSUS  | ' + message;

                console.log(fullMessage);
                break;
            }
            case event.billing:
            {
                // Generate the message content, write to console
                fullMessage = chalk.green(timestamp) + ' | BILLING | '  + message;
                fullMessage2 = timestamp + ' | BILLING | ' + message;

                console.log(fullMessage);
                break;
            }
            default:
            {
                // Generate the message content, write to console
                fullMessage = chalk.green(timestamp) + ' ' + message;
                fullMessage2 = timestamp + message;

                console.log(fullMessage);
                break;
            }
        }

        // Print server log to webhook
        webhookServer(fullMessage2);
    }
    catch {
        // Failed
    }
}


// Send the server running log to webhook and print it
export function webhookServer(msg: string)
{
    if (process.env.WEBHOOK_ID_SERVER_LOGS && process.env.WEBHOOK_TOKEN_SERVER_LOGS)
    {
        const id = process.env.WEBHOOK_ID_SERVER_LOGS;
        const token = process.env.WEBHOOK_TOKEN_SERVER_LOGS;

        const webhookClient = new WebhookClient({ id: id, token: token });

        webhookClient.send(msg).catch(console.error);
    }
}


// Send the error to webhook and print it
export function webhookError(e: any, uri: string)
{
    if (process.env.WEBHOOK_ID_SERVER_ERROR_LOGS && process.env.WEBHOOK_TOKEN_SERVER_ERROR_LOGS)
    {
        const id = process.env.WEBHOOK_ID_SERVER_ERROR_LOGS;
        const token = process.env.WEBHOOK_TOKEN_SERVER_ERROR_LOGS;

        const webhookClient = new WebhookClient({ id: id, token: token });

        let string:string = e.stack;
        let title:string = 'Error';

        if(uri !== ' ')
        {
            title = ' at' + uri;
        }

        const embedString = new EmbedBuilder()
            .setTitle(title)
            .setDescription(string)
            .setTimestamp();

        webhookClient.send({
            embeds: [embedString],
        }).catch(console.error);
    }
}


// Given the error thrown in a try/catch
// block, attempts to return the human-
// readible error message for the error.
// Otherwise, returns a generic message.
export function getError(e: unknown, uri: string) 
{
    // Print error to webhook
    webhookError(e, uri);

    // e is a string (error message)
    if (typeof e === 'string')
    {
        // Return as-is
        return e;
    }
    // e is an Error object
    else if (e instanceof Error)
    {
        // Return the message
        return e.message;
    } 
    // Unhandled type
    else
    {
        // Return generic message
        return 'Unknown error type';
    }
}


// get session: string
// Given the headers from a request, filters
// the 'session' property from the
// request and returns the value. If not found, 
// returns null.
export function getHeader(headers: string[])
{
    try 
    {
        // Find user session headers
        const filtered = headers.filter(
            x => x.includes('session')
        );

        // At least one header is found
        if (filtered.length > 0)
        {
            // These should be all the same, just take the first one
            const header = filtered.pop();

            // Header is not null
            if (header)
            {
                // Header includes a semicolon
                if (header.includes('='))
                {
                    // Retrieves the user session from the header, 
                    // strips any trailing whitespace and converts to int
                    let value = header.split('=')[2].trimEnd();
                    value = value.split(',')[0].trimEnd();
                    value = value.replaceAll('"', '');
                    
                    const values = Number(value);

                    // Return the values
                    return values;
                }
                else // No semicolon
                {
                    throw Error(`No session found in header!`);
                }
            }
            else {
                throw Error(`Session header is not defined!`);
            }
        }
        else // No headers found
        {
            throw Error("Session not found!");
        }
    }
    catch (e) // Failed to get session
    {
        writeLog(`Failed to get session! ${String(e)}`);

        // No session
        return null;
    }
}


// get device_version: string
// Given the headers from a request, filters
// the 'device_version' property from the
// request and returns the value. If not found, 
// returns null.
export function getDeviceVersion(headers: string[])
{
    try 
    {
        // Find user session headers
        const filtered = headers.filter(
            x => x.includes('device_version')
        );

        // At least one header is found
        if (filtered.length > 0)
        {
            // These should be all the same, just take the first one
            const header = filtered.pop();
            let data:boolean = false

            // Header is not null
            if (header)
            {
                // Header includes a semicolon
                if (header.includes('='))
                {
                    // Retrieves the user session from the header, 
                    // strips any trailing whitespace and converts to int
                    let value = header.split('=')[6].trimEnd();
                    value = value.split(',')[0].trimEnd();
                    value = value.replaceAll('"', '');

                    if(value === '1.50.00')
                    {
                        data = true;
                    }
                    return data;
                }
                else // No semicolon
                {
                    throw Error(`No device version found in header!`);
                }
            }
            else {
                throw Error(`Device version header is not defined!`);
            }
        }
        else // No headers found
        {
            throw Error("Device version not found!");
        }
    }
    catch (e) // Failed to get device version
    {
        writeLog(`Failed to get device version! ${String(e)}`);

        // No device version
        return null;
    }
}


// Change milisecconds to minutes second miliseconds
export function millisToMinutesSecondsMilis(millis: number)
{
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000)
    let milis = (millis % 1000).toString()
    
    if (parseInt(milis) < 100 && parseInt(milis) > 10) milis = '0' + milis;
    else if (parseInt(milis) < 100) milis = '00' + milis;
    else if (parseInt(milis) === 0) milis = '000';

    return (minutes < 10 ? '0' : '') + minutes + "'" + (seconds < 10 ? '0' : '') + seconds + `"` + milis;
}


// Check is current date in this week
export function isDateInThisWeek(date: Date) {
    const todayObj = new Date();
    todayObj.setHours(0,0,0,0);
    const todayDate = todayObj.getDate();
    const todayDay = todayObj.getDay();
  
    // get first date of week
    const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay));
  
    // get last date of week
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(0,0,0,0);
  
    // if date is equal or within the first and last dates of the week
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  }