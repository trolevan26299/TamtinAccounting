import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

class CreateUserDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() @MinLength(6) password: string;
  @IsOptional() @IsString() fullName?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAll() {
    return this.usersService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto.username, dto.password, dto.fullName);
  }

  @Patch(':id/toggle-lock')
  toggleLock(@Param('id') id: string) {
    return this.usersService.toggleLock(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
