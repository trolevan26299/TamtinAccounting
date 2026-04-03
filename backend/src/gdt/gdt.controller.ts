import { Controller, Get, Post, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GdtService } from './gdt.service';

import { IsNotEmpty, IsString } from 'class-validator';

class GdtLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  cvalue: string;

  @IsString()
  @IsNotEmpty()
  ckey: string;
}

@Controller('gdt')
@UseGuards(JwtAuthGuard)
export class GdtController {
  constructor(private gdtService: GdtService) {}

  @Get('captcha')
  getCaptcha() {
    return this.gdtService.getCaptcha();
  }

  @Post('login')
  async gdtLogin(@Body() body: GdtLoginDto, @Res() res: Response) {
    let { status, data } = await this.gdtService.login(
      body.username,
      body.password,
      body.cvalue,
      body.ckey,
    );
    // Ngăn conflict: 401 từ GDT sẽ làm văng session hệ thống (do logic chặn 401 của axios)
    // Chuyển thành mã 400 (Bad Request) để báo lỗi đăng nhập GDT trên UI thay vì bị văng app
    if (status === 401) {
      status = 400;
    }
    return res.status(status).json(data);
  }
}
