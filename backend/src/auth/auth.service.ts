import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');

    await this.usersService.updateLastLogin(user._id.toString());

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
