import { Controller, Post, Body, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

class SearchDto {
  @IsString() @IsNotEmpty() gdtToken: string;
  @IsString() @IsNotEmpty() fromDate: string;
  @IsString() @IsNotEmpty() toDate: string;
  @IsString() @IsNotEmpty() loaiHD: string; // mtt | ddt
  @IsOptional() @IsString() mst?: string;
  @IsOptional() @IsString() state?: string;
}

class SearchPurchaseDto {
  @IsString() @IsNotEmpty() gdtToken: string;
  @IsString() @IsNotEmpty() fromDate: string;
  @IsString() @IsNotEmpty() toDate: string;
  @IsOptional() @IsString() loaiHD?: string;   // 'mtt' | 'ddt'
  @IsOptional() @IsString() mst?: string;
  @IsOptional() @IsNumber() pageOffset?: number;
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body() body: SearchDto) {
    return this.invoicesService.search(body.gdtToken, body.fromDate, body.toDate, body.loaiHD, body.state);
  }

  @Post('export')
  async export(@Body() body: SearchDto, @Res() res: Response) {
    await this.invoicesService.exportExcel(body.gdtToken, body.fromDate, body.toDate, body.loaiHD, body.mst || '', res);
  }

  @Post('search-purchase')
  @HttpCode(HttpStatus.OK)
  searchPurchase(@Body() body: SearchPurchaseDto) {
    return this.invoicesService.searchPurchase(body.gdtToken, body.fromDate, body.toDate, body.loaiHD ?? 'ddt', body.pageOffset ?? 0);
  }

  @Post('export-purchase')
  async exportPurchase(@Body() body: SearchPurchaseDto, @Res() res: Response) {
    await this.invoicesService.exportPurchaseExcel(body.gdtToken, body.fromDate, body.toDate, body.loaiHD ?? 'ddt', body.mst || '', res);
  }
}
