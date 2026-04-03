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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdtService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const https = require("https");
const gdt_constants_1 = require("../common/gdt.constants");
let GdtService = class GdtService {
    constructor(config) {
        this.config = config;
        this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
        this.baseUrl = this.config.get('GDT_BASE_URL');
    }
    async getCaptcha() {
        try {
            const res = await axios_1.default.get(`${this.baseUrl}/captcha`, {
                headers: { ...gdt_constants_1.GDT_COMMON_HEADERS, Action: '', 'End-Point': '/' },
                httpsAgent: this.httpsAgent,
                timeout: 60000,
            });
            return res.data;
        }
        catch (e) {
            throw new common_1.BadGatewayException('Không thể tải captcha từ GDT: ' + e.message);
        }
    }
    async login(username, password, cvalue, ckey) {
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/security-taxpayer/authenticate`, { username, password, cvalue, ckey }, {
                headers: {
                    ...gdt_constants_1.GDT_COMMON_HEADERS,
                    'Content-Type': 'application/json',
                    Action: '',
                    'End-Point': '/',
                },
                httpsAgent: this.httpsAgent,
                timeout: 60000,
                validateStatus: () => true,
            });
            return { status: res.status, data: res.data };
        }
        catch (e) {
            throw new common_1.BadGatewayException('Lỗi kết nối GDT: ' + e.message);
        }
    }
};
exports.GdtService = GdtService;
exports.GdtService = GdtService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GdtService);
//# sourceMappingURL=gdt.service.js.map