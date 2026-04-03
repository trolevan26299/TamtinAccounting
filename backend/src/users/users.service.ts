import {
  Injectable, OnModuleInit, Logger,
  ConflictException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedDefaultUser();
  }

  // ─── Seed admin ───
  private async seedDefaultUser() {
    try {
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || 'AdminPassword123';

      const admin = await this.userModel.findOne({ username: adminUser });
      if (!admin) {
        const hash = await bcrypt.hash(adminPass, 10);
        await this.userModel.create({
          username: adminUser,
          password: hash,
          fullName: 'Quản trị viên Hệ thống',
          role: 'admin',
        });
        this.logger.log(`✅ Tạo user mặc định: ${adminUser}`);
      } else {
        // Migrate plain text password to bcrypt if needed
        if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
          admin.password = await bcrypt.hash(admin.password, 10);
          admin.role = 'admin'; // ensure role is admin
          await admin.save();
          this.logger.log(`✅ Đã mã hóa bcrypt cho tài khoản ${adminUser} hiện tại`);
        }
      }
    } catch (e) {
      this.logger.warn('Seed user error: ' + e.message);
    }
  }

  // ─── Auth helpers ───
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.toLowerCase(), isActive: true });
  }

  async updateLastLogin(id: string) {
    return this.userModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  // ─── Admin: list all ───
  async findAll() {
    const users = await this.userModel
      .find({}, { password: 0 })
      .sort({ createdAt: -1 })
      .lean();
    return users;
  }

  // ─── Admin: create user ───
  async createUser(username: string, password: string, fullName?: string) {
    const existing = await this.userModel.findOne({ username: username.toLowerCase() });
    if (existing) throw new ConflictException(`Tên đăng nhập "${username}" đã tồn tại`);

    if (password.length < 6) throw new BadRequestException('Mật khẩu phải ít nhất 6 ký tự');

    const hash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      username: username.toLowerCase().trim(),
      password: hash,
      fullName: fullName?.trim() || username,
      role: 'user',
    });

    const { password: _, ...result } = user.toObject();
    return result;
  }

  // ─── Admin: toggle lock/unlock ───
  async toggleLock(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    if (user.role === 'admin') throw new BadRequestException('Không thể khóa tài khoản admin');

    user.isActive = !user.isActive;
    await user.save();
    return { id: user._id, username: user.username, isActive: user.isActive };
  }

  // ─── Admin: delete user ───
  async deleteUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    if (user.role === 'admin') throw new BadRequestException('Không thể xóa tài khoản admin');

    await this.userModel.findByIdAndDelete(id);
  }
}
