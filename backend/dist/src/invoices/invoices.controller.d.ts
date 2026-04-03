import { Response } from 'express';
import { InvoicesService } from './invoices.service';
declare class SearchDto {
    gdtToken: string;
    fromDate: string;
    toDate: string;
    loaiHD: string;
    mst?: string;
    state?: string;
}
declare class SearchPurchaseDto {
    gdtToken: string;
    fromDate: string;
    toDate: string;
    loaiHD?: string;
    mst?: string;
    pageOffset?: number;
}
export declare class InvoicesController {
    private invoicesService;
    constructor(invoicesService: InvoicesService);
    search(body: SearchDto): Promise<{
        gdtExpired: boolean;
        error: string;
        datas?: undefined;
        total?: undefined;
        state?: undefined;
    } | {
        datas: any;
        total: any;
        state: any;
        gdtExpired?: undefined;
        error?: undefined;
    }>;
    export(body: SearchDto, res: Response): Promise<void>;
    searchPurchase(body: SearchPurchaseDto): Promise<{
        gdtExpired: boolean;
        error: string;
        datas?: undefined;
        total?: undefined;
        offset?: undefined;
    } | {
        datas: any;
        total: any;
        offset: number;
        gdtExpired?: undefined;
        error?: undefined;
    }>;
    exportPurchase(body: SearchPurchaseDto, res: Response): Promise<void>;
}
export {};
