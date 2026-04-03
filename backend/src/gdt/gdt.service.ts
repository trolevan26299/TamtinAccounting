import { Injectable, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as https from 'https';
import { GDT_COMMON_HEADERS } from '../common/gdt.constants';

@Injectable()
export class GdtService {
  private readonly baseUrl: string;
  private readonly httpsAgent = new https.Agent({ rejectUnauthorized: false });

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('GDT_BASE_URL');
  }

  async getCaptcha() {
    try {
      const res = await axios.get(`${this.baseUrl}/captcha`, {
        headers: { ...GDT_COMMON_HEADERS, Action: '', 'End-Point': '/' },
        httpsAgent: this.httpsAgent,
        timeout: 60000,
      });
      return res.data;
    } catch (e) {
      throw new BadGatewayException('Không thể tải captcha từ GDT: ' + e.message);
    }
  }

  async login(username: string, password: string, cvalue: string, ckey: string) {
    try {
      const res = await axios.post(
        `${this.baseUrl}/security-taxpayer/authenticate`,
        { username, password, cvalue, ckey },
        {
          headers: {
            ...GDT_COMMON_HEADERS,
            'Content-Type': 'application/json',
            Action: '',
            'End-Point': '/',
          },
          httpsAgent: this.httpsAgent,
          timeout: 60000,
          validateStatus: () => true,
        },
      );
      return { status: res.status, data: res.data };
    } catch (e) {
      throw new BadGatewayException('Lỗi kết nối GDT: ' + e.message);
    }
  }
}
