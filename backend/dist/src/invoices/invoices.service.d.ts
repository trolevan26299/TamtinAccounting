import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
export declare class InvoicesService {
    private config;
    private readonly baseUrl;
    private readonly httpsAgent;
    constructor(config: ConfigService);
    private formatGDTDate;
    private formatDisplay;
    private buildSearchQuery;
    private splitDateRange;
    private getBuyerName;
    private getTrangThai;
    fetchPage(gdtToken: string, searchQuery: string, loaiHD: string, state?: string, size?: number, retries?: number): Promise<any>;
    fetchAllPages(gdtToken: string, searchQuery: string, loaiHD: string): Promise<any[]>;
    search(gdtToken: string, fromDate: string, toDate: string, loaiHD: string, state?: string): Promise<{
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
    exportExcel(gdtToken: string, fromDate: string, toDate: string, loaiHD: string, mst: string, res: Response): Promise<void>;
    fetchPurchasePage(gdtToken: string, searchQuery: string, from: number, loaiHD?: string, size?: number, retries?: number): Promise<any>;
    searchPurchase(gdtToken: string, fromDate: string, toDate: string, loaiHD?: string, pageOffset?: number): Promise<{
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
    exportPurchaseExcel(gdtToken: string, fromDate: string, toDate: string, loaiHD: string, mst: string, res: Response): Promise<void>;
}
