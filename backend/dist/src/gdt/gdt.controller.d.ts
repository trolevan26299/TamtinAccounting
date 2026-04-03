import { Response } from 'express';
import { GdtService } from './gdt.service';
declare class GdtLoginDto {
    username: string;
    password: string;
    cvalue: string;
    ckey: string;
}
export declare class GdtController {
    private gdtService;
    constructor(gdtService: GdtService);
    getCaptcha(): Promise<any>;
    gdtLogin(body: GdtLoginDto, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
