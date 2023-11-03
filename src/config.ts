import fs from 'fs';

export interface ConfigFile 
{
    shopName: string;
    timeReleaseId: string;
    country: string;
    placeId: string;
    regionId: number;
    serverIp: string;
    website: number;
    websiteLog: number;
    gameOptions: GameOptions;
    unix?: UnixOptions;
    notices?: string[];
    sentryDsn?: string;
}

export interface UnixOptions 
{
    setuid: number;
    setgid: number;
}

export interface GameOptions 
{
    // Amount of full-tunes to grant to newly registered cards
    grantFullTuneTicketToNewUsers: number;
    
    // if the new card is not in the User table
    // set this option to 1 will not create a new card
    // and prevent new card registration
    // 1 is on, 0 is off
    newCardsBanned: number; 
}

export class Config 
{
    private static cfg: ConfigFile;

    static load() 
    {
        console.log('Loading config file...');
        let cfg = fs.readFileSync('./config.json', 'utf-8');
        let json = JSON.parse(cfg);
        this.cfg = json as ConfigFile;
    }

    static getConfig(): ConfigFile 
    {
        if (!this.cfg)
            this.load();
        
        return this.cfg;
    }
}