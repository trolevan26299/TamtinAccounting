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
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const invoices_service_1 = require("./invoices.service");
const class_validator_1 = require("class-validator");
class SearchDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchDto.prototype, "gdtToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchDto.prototype, "fromDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchDto.prototype, "toDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchDto.prototype, "loaiHD", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchDto.prototype, "mst", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchDto.prototype, "state", void 0);
class SearchPurchaseDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchPurchaseDto.prototype, "gdtToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchPurchaseDto.prototype, "fromDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchPurchaseDto.prototype, "toDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchPurchaseDto.prototype, "loaiHD", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchPurchaseDto.prototype, "mst", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchPurchaseDto.prototype, "pageOffset", void 0);
let InvoicesController = class InvoicesController {
    constructor(invoicesService) {
        this.invoicesService = invoicesService;
    }
    search(body) {
        return this.invoicesService.search(body.gdtToken, body.fromDate, body.toDate, body.loaiHD, body.state);
    }
    async export(body, res) {
        await this.invoicesService.exportExcel(body.gdtToken, body.fromDate, body.toDate, body.loaiHD, body.mst || '', res);
    }
    searchPurchase(body) {
        return this.invoicesService.searchPurchase(body.gdtToken, body.fromDate, body.toDate, body.loaiHD ?? 'ddt', body.pageOffset ?? 0);
    }
    async exportPurchase(body, res) {
        await this.invoicesService.exportPurchaseExcel(body.gdtToken, body.fromDate, body.toDate, body.loaiHD ?? 'ddt', body.mst || '', res);
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Post)('search'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SearchDto]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('export'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SearchDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "export", null);
__decorate([
    (0, common_1.Post)('search-purchase'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SearchPurchaseDto]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "searchPurchase", null);
__decorate([
    (0, common_1.Post)('export-purchase'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SearchPurchaseDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "exportPurchase", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_1.Controller)('invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map