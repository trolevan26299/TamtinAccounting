"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcryptjs");
const user_schema_1 = require("./schemas/user.schema");
let UsersService = UsersService_1 = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async onModuleInit() {
        await this.seedDefaultUser();
    }
    async seedDefaultUser() {
        try {
            const admin = await this.userModel.findOne({ username: 'tamtin' });
            if (!admin) {
                const hash = await bcrypt.hash('Tamtin@2026', 10);
                await this.userModel.create({
                    username: 'tamtin',
                    password: hash,
                    fullName: 'Quản trị viên TT Kế Toán',
                    role: 'admin',
                });
                this.logger.log('✅ Tạo user mặc định: tamtin / Tamtin@2026');
            }
            else {
                if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
                    admin.password = await bcrypt.hash(admin.password, 10);
                    admin.role = 'admin';
                    await admin.save();
                    this.logger.log('✅ Đã mã hóa bcrypt cho tài khoản admin hiện tại');
                }
            }
        }
        catch (e) {
            this.logger.warn('Seed user error: ' + e.message);
        }
    }
    async findByUsername(username) {
        return this.userModel.findOne({ username: username.toLowerCase(), isActive: true });
    }
    async updateLastLogin(id) {
        return this.userModel.findByIdAndUpdate(id, { lastLogin: new Date() });
    }
    async findAll() {
        const users = await this.userModel
            .find({}, { password: 0 })
            .sort({ createdAt: -1 })
            .lean();
        return users;
    }
    async createUser(username, password, fullName) {
        const existing = await this.userModel.findOne({ username: username.toLowerCase() });
        if (existing)
            throw new common_1.ConflictException(`Tên đăng nhập "${username}" đã tồn tại`);
        if (password.length < 6)
            throw new common_1.BadRequestException('Mật khẩu phải ít nhất 6 ký tự');
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
    async toggleLock(id) {
        const user = await this.userModel.findById(id);
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        if (user.role === 'admin')
            throw new common_1.BadRequestException('Không thể khóa tài khoản admin');
        user.isActive = !user.isActive;
        await user.save();
        return { id: user._id, username: user.username, isActive: user.isActive };
    }
    async deleteUser(id) {
        const user = await this.userModel.findById(id);
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        if (user.role === 'admin')
            throw new common_1.BadRequestException('Không thể xóa tài khoản admin');
        await this.userModel.findByIdAndDelete(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map