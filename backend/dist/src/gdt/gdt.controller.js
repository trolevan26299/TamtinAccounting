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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdtController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const gdt_service_1 = require("./gdt.service");
const class_validator_1 = require("class-validator");
class GdtLoginDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GdtLoginDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GdtLoginDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GdtLoginDto.prototype, "cvalue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GdtLoginDto.prototype, "ckey", void 0);
let GdtController = class GdtController {
    constructor(gdtService) {
        this.gdtService = gdtService;
    }
    getCaptcha() {
        return this.gdtService.getCaptcha();
    }
    async gdtLogin(body, res) {
        let { status, data } = await this.gdtService.login(body.username, body.password, body.cvalue, body.ckey);
        if (status === 401) {
            status = 400;
        }
        return res.status(status).json(data);
    }
};
exports.GdtController = GdtController;
__decorate([
    (0, common_1.Get)('captcha'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GdtController.prototype, "getCaptcha", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GdtLoginDto, Object]),
    __metadata("design:returntype", Promise)
], GdtController.prototype, "gdtLogin", null);
exports.GdtController = GdtController = __decorate([
    (0, common_1.Controller)('gdt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [gdt_service_1.GdtService])
], GdtController);
//# sourceMappingURL=gdt.controller.js.map