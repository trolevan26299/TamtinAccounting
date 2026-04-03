import { ConfigService } from '@nestjs/config';
export declare class GdtService {
    private config;
    private readonly baseUrl;
    private readonly httpsAgent;
    constructor(config: ConfigService);
    getCaptcha(): Promise<any>;
    login(username: string, password: string, cvalue: string, ckey: string): Promise<{
        status: number;
        data: any;
    }>;
}
