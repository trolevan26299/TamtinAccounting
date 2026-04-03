import { Injectable, BadGatewayException } from '@nestjs/common';
// Force re-compile

import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import axios from 'axios';
import * as https from 'https';
import * as ExcelJS from 'exceljs';
import { GDT_COMMON_HEADERS } from '../common/gdt.constants';

const PAGE_SIZE = 50;

@Injectable()
export class InvoicesService {
  private readonly baseUrl: string;
  private readonly httpsAgent = new https.Agent({ rejectUnauthorized: false });

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('GDT_BASE_URL');
  }

  // ─── Date helpers ───
  private formatGDTDate(date: Date, endOfDay = false): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}T${endOfDay ? '23:59:59' : '00:00:00'}`;
  }

  private formatDisplay(isoDate: string): string {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  private buildSearchQuery(from: Date, to: Date, includeTtxly = false): string {
    const base = `tdlap=ge=${this.formatGDTDate(from)};tdlap=le=${this.formatGDTDate(to, true)}`;
    return includeTtxly ? `${base};ttxly==5` : base;
  }

  private splitDateRange(from: Date, to: Date, chunkDays = 10): { from: Date; to: Date }[] {
    const chunks: { from: Date; to: Date }[] = [];
    let current = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const chunkEnd = new Date(current);
      chunkEnd.setDate(chunkEnd.getDate() + chunkDays - 1);
      if (chunkEnd > end) chunkEnd.setTime(end.getTime());
      chunks.push({ from: new Date(current), to: new Date(chunkEnd) });
      current.setDate(current.getDate() + chunkDays);
    }
    return chunks;
  }

  private getBuyerName(rec: any): string {
    return rec.nmten || rec.nmtnmua || '';
  }

  private getTrangThai(tthai: number): string {
    const map: Record<number, string> = {
      1: 'Hợp lệ', 2: 'Đã xóa/hủy', 3: 'Có điều chỉnh',
      4: 'Bị điều chỉnh', 5: 'Đã thay thế', 6: 'Bị thay thế',
    };
    return map[tthai] || `Code ${tthai}`;
  }

  // ─── Fetch one page from GDT (With Retries) ───
  async fetchPage(gdtToken: string, searchQuery: string, loaiHD: string, state?: string, size = PAGE_SIZE, retries = 3) {
    const isMtt = loaiHD === 'mtt';
    const endpoint = isMtt ? '/sco-query/invoices/sold' : '/query/invoices/sold';
    const actionStr = isMtt
      ? 'Tìm kiếm (hóa đơn máy tính tiền bán ra)'
      : 'Tìm kiếm (hóa đơn bán ra)';

    let url = `${this.baseUrl}${endpoint}?sort=tdlap:desc&size=${size}&search=${encodeURIComponent(searchQuery)}`;
    if (state) url += `&state=${encodeURIComponent(state)}`;

    let lastError = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios.get(url, {
          headers: {
            ...GDT_COMMON_HEADERS,
            Authorization: `Bearer ${gdtToken}`,
            'End-Point': '/tra-cuu/tra-cuu-hoa-don',
            Action: encodeURIComponent(actionStr),
          },
          httpsAgent: this.httpsAgent,
          timeout: 60000, // Tăng thêm thời gian chờ lên 60s
          validateStatus: () => true,
        });

        // Nếu GDT chặn hoặc quá tải, thử lại
        if ([500, 502, 503, 504].includes(res.status) && attempt < retries) {
          console.log(`[Lần ${attempt}] GDT quá tải (${res.status}). Đợi 10s để thử lại...`);
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }

        return res;
      } catch (err: any) {
        lastError = err;
        if ((err.code === 'ECONNABORTED' || err.message?.includes('timeout')) && attempt < retries) {
          console.log(`[Lần ${attempt}] GDT Timeout. Đợi 10s để thử lại...`);
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        if (attempt >= retries) break;
      }
    }

    if (lastError) {
      if (lastError.code === 'ECONNABORTED' || lastError.message?.includes('timeout')) {
        return { status: 504, data: { message: `Kết nối tới GDT server bị quá hạn (Timeout) sau ${retries} lần thử. Hệ thống Thuế hiện đang quá tải nặng.` } } as any;
      }
      return { status: 502, data: { message: 'Không thể kết nối đến GDT: ' + lastError.message } } as any;
    }
    return { status: 502, data: { message: `Đã thử chạy lại ${retries} lần nhưng GDT vẫn báo lỗi quá tải.` } } as any;
  }

  // ─── Fetch all pages for a range ───
  async fetchAllPages(gdtToken: string, searchQuery: string, loaiHD: string): Promise<any[]> {
    const all: any[] = [];
    let state: string | null = null;
    let total = 0;

    do {
      if (all.length > 0) {
        console.log(`Đã tải ${all.length}/${total} hóa đơn, chờ 1 giây để tải trang tiếp...`);
        await new Promise((r) => setTimeout(r, 1000));
      }

      console.log(`Đang gọi GDT lấy dữ liệu export... Size: 50, State: ${state || 'bắt đầu'}`);
      const res = await this.fetchPage(gdtToken, searchQuery, loaiHD, state, 50);
      
      if (res.status === 204 || res.status === 404) {
        // GDT trả về rỗng khi không có hóa đơn
        state = null;
        break;
      }
      
      if (res.status !== 200) {
        const errorDetail = typeof res.data === 'string' ? res.data : (res.data?.message || res.data?.error || res.statusText || 'unknown');
        console.error(`GDT Lỗi khi export: status = ${res.status}, data = `, res.data);
        throw new BadGatewayException(`GDT lỗi ${res.status}: ${errorDetail}`);
      }
      
      const { datas = [], state: nextState, total: t } = res.data || {};
      total = t || 0;
      all.push(...datas);
      state = nextState && datas.length > 0 ? nextState : null;
    } while (state && all.length < total);

    return all;
  }

  // ─── Search (paginated) ───
  async search(gdtToken: string, fromDate: string, toDate: string, loaiHD: string, state?: string) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const searchQuery = this.buildSearchQuery(from, to);
    const res = await this.fetchPage(gdtToken, searchQuery, loaiHD, state);

    if (res.status === 401) {
      return { gdtExpired: true, error: 'Token GDT đã hết hạn, vui lòng đăng nhập lại GDT' };
    }
    if (res.status === 204 || res.status === 404) {
      return { datas: [], total: 0, state: null };
    }
    if (res.status !== 200) {
      const errorDetail = typeof res.data === 'string' ? res.data : (res.data?.message || res.data?.error || 'Lỗi từ GDT');
      throw new BadGatewayException(errorDetail);
    }

    return {
      datas: res.data?.datas || [],
      total: res.data?.total || 0,
      state: res.data?.state || null,
    };
  }

  // ─── Export Excel ───
  async exportExcel(
    gdtToken: string,
    fromDate: string,
    toDate: string,
    loaiHD: string,
    mst: string,
    res: Response,
  ) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let allData: any[] = [];
    if (diffDays <= 10) {
      const q = this.buildSearchQuery(from, to);
      allData = await this.fetchAllPages(gdtToken, q, loaiHD);
    } else {
      const chunks = this.splitDateRange(from, to, 10);
      for (const chunk of chunks) {
        if (allData.length > 0) {
          console.log(`Chờ 1 giây trước khi query mốc thời gian tiếp theo...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
        const q = this.buildSearchQuery(chunk.from, chunk.to);
        const data = await this.fetchAllPages(gdtToken, q, loaiHD);
        allData.push(...data);
      }
    }

    if (allData.length === 0) {
      res.status(400).json({ error: 'Không có dữ liệu hóa đơn nào trong điều kiện tra cứu này để xuất file.' });
      return;
    }

    // ─── Build Excel ───
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TamTin System';
    const sheet = workbook.addWorksheet('Hóa đơn', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // Title
    sheet.mergeCells('A1:K1');
    const title = sheet.getCell('A1');
    title.value = `BẢNG KÊ HÓA ĐƠN CHỨNG TỪ HÀNG HÓA, DỊCH VỤ BÁN RA`;
    title.font = { bold: true, size: 14, name: 'Times New Roman' };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 24;

    sheet.mergeCells('A2:K2');
    const subtitle = sheet.getCell('A2');
    subtitle.value = `Kèm theo tờ khai thuế GTGT`;
    subtitle.font = { size: 12, name: 'Times New Roman' };
    subtitle.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 18;

    sheet.mergeCells('A3:K3');
    const period = sheet.getCell('A3');
    period.value = `Kỳ ${this.formatDisplay(fromDate)} - ${this.formatDisplay(toDate)}`;
    period.font = { italic: true, size: 12, name: 'Times New Roman' };
    period.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 18;

    // Company info
    const nbten = allData[0]?.nbten || '...................................................';
    const nbmst = allData[0]?.nbmst || '';

    sheet.mergeCells('A5:E5');
    sheet.getCell('A5').value = `Tên cơ sở kinh doanh : ${nbten}`;
    sheet.getCell('A5').font = { bold: true, size: 11, name: 'Times New Roman' };

    sheet.mergeCells('H5:K5');
    sheet.getCell('H5').value = `Mã số thuế : ${nbmst}`;
    sheet.getCell('H5').font = { bold: true, size: 11, name: 'Times New Roman' };

    sheet.mergeCells('A6:K6');
    sheet.getCell('A6').value = `Địa chỉ : .......................................................................................................`;
    sheet.getCell('A6').font = { size: 11, name: 'Times New Roman' };

    // Set columns width
    sheet.columns = [
      { key: 'a', width: 6 },  // STT
      { key: 'b', width: 13 }, // Seri
      { key: 'c', width: 10 }, // Số HĐ
      { key: 'd', width: 12 }, // Ngày HĐ
      { key: 'e', width: 40 }, // Tên người mua
      { key: 'f', width: 15 }, // MST
      { key: 'g', width: 25 }, // Mặt hàng
      { key: 'h', width: 16 }, // Chưa thuế
      { key: 'i', width: 8 },  // Thuế suất
      { key: 'j', width: 14 }, // Thuế GTGT
      { key: 'k', width: 16 }, // Ghi chú (Total)
    ];

    // Headers Row 7 & 8
    sheet.mergeCells('A7:A8'); sheet.getCell('A7').value = 'STT';
    sheet.mergeCells('B7:D7'); sheet.getCell('B7').value = 'Hóa đơn chứng từ bán';
    sheet.getCell('B8').value = 'Seri';
    sheet.getCell('C8').value = 'Số HĐ';
    sheet.getCell('D8').value = 'Ngày HĐ';
    sheet.mergeCells('E7:E8'); sheet.getCell('E7').value = 'Tên người mua';
    sheet.mergeCells('F7:F8'); sheet.getCell('F7').value = 'Mã số thuế';
    sheet.mergeCells('G7:G8'); sheet.getCell('G7').value = 'Mặt hàng';
    sheet.mergeCells('H7:H8'); sheet.getCell('H7').value = 'Doanh số bán\nchưa thuế';
    sheet.mergeCells('I7:I8'); sheet.getCell('I7').value = 'Thuế\nsuất';
    sheet.mergeCells('J7:J8'); sheet.getCell('J7').value = 'Thuế\nGTGT';
    sheet.mergeCells('K7:K8'); sheet.getCell('K7').value = 'Ghi chú';

    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    [7, 8].forEach(r => {
      const row = sheet.getRow(r);
      row.height = 20;
      for (let c = 1; c <= 11; c++) {
        const cell = row.getCell(c);
        cell.font = { bold: true, size: 10, name: 'Times New Roman' };
        if (cell.value) { // chỉ set fill cho top row của merge
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } };
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = borderThin;
      }
    });

    // Write Data
    allData.forEach((inv, idx) => {
      let percent: string | number = '';
      if (inv.tgtcthue && inv.tgtthue) {
        percent = Math.round((inv.tgtthue / inv.tgtcthue) * 100);
      }
      
      const row = sheet.addRow([
        idx + 1,
        inv.khhdon,
        inv.shdon,
        this.formatDisplay(inv.tdlap),
        this.getBuyerName(inv),
        inv.nmmst || '',
        '', // Không có mặt hàng trong list API
        inv.tgtcthue || 0,
        percent,
        inv.tgtthue || 0,
        inv.tgtttbso || 0 // Tổng tiền
      ]);

      for (let c = 1; c <= 11; c++) {
        const cell = row.getCell(c);
        cell.border = borderThin;
        cell.font = { size: 10, name: 'Times New Roman' };
        if (c >= 8 && c <= 11 && c !== 9) { // 8(chưa thuế), 10(thuế), 11(ghi chú/tổng)
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else if (c === 1 || c === 3 || c === 4 || c === 6 || c === 9) { 
          // 1:STT, 3:Số HĐ, 4:Ngày, 6:MST, 9:% 
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      }
    });

    // Total Row
    const sumRow = sheet.addRow([
      '', '', '', '', 'Tổng cộng:', '', '',
      allData.reduce((s, r) => s + (r.tgtcthue || 0), 0),
      '',
      allData.reduce((s, r) => s + (r.tgtthue || 0), 0),
      allData.reduce((s, r) => s + (r.tgtttbso || 0), 0)
    ]);
    sheet.mergeCells(`A${sumRow.number}:G${sumRow.number}`);
    sumRow.getCell('A').alignment = { horizontal: 'center', vertical: 'middle' };
    sumRow.getCell('A').value = 'Tổng cộng:';

    for (let c = 1; c <= 11; c++) {
      const cell = sumRow.getCell(c);
      cell.border = borderThin;
      cell.font = { bold: true, size: 10, name: 'Times New Roman' };
      if (c >= 8 && c <= 11 && c !== 9) {
        cell.numFmt = '#,##0';
      }
    }

    const loaiLabel = loaiHD === 'mtt' ? 'MTT' : 'DDT';
    const mstStr = (mst || 'MST').replace(/[^a-zA-Z0-9]/g, '');
    const fromStr = this.formatDisplay(fromDate).replace(/\//g, '');
    const toStr = this.formatDisplay(toDate).replace(/\//g, '');
    const fileName = `${mstStr} - ${fromStr}-${toStr} - Ban Ra - ${loaiLabel}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    await workbook.xlsx.write(res);
    res.end();
  }

  // ─── Fetch one page from GDT purchase (mua vao) ───
  async fetchPurchasePage(gdtToken: string, searchQuery: string, from: number, loaiHD = 'ddt', size = PAGE_SIZE, retries = 3) {
    const isMtt = loaiHD === 'mtt';
    const endpoint = isMtt ? '/sco-query/invoices/purchase' : '/query/invoices/purchase';
    const actionStr = isMtt
      ? 'Tìm kiếm (hóa đơn máy tính tiền mua vào)'
      : 'Tìm kiếm (hóa đơn mua vào)';
    const url = `${this.baseUrl}${endpoint}?sort=tdlap:desc&size=${size}&from=${from}&search=${encodeURIComponent(searchQuery)}`;
    let lastError = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios.get(url, {
          headers: {
            ...GDT_COMMON_HEADERS,
            Authorization: `Bearer ${gdtToken}`,
            'End-Point': '/tra-cuu/tra-cuu-hoa-don',
            Action: encodeURIComponent(actionStr),
          },
          httpsAgent: this.httpsAgent,
          timeout: 60000,
          validateStatus: () => true,
        });
        if ([500, 502, 503, 504].includes(res.status) && attempt < retries) {
          console.log(`[Lần ${attempt}] GDT mua vào (${loaiHD}) quá tải (${res.status}). Đợi 3s...`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        return res;
      } catch (err: any) {
        lastError = err;
        if ((err.code === 'ECONNABORTED' || err.message?.includes('timeout')) && attempt < retries) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        if (attempt >= retries) break;
      }
    }
    if (lastError) return { status: 502, data: { message: 'Không thể kết nối GDT (mua vào): ' + lastError.message } } as any;
    return { status: 502, data: { message: `Đã thử ${retries} lần nhưng GDT mua vào vẫn lỗi.` } } as any;
  }

  // ─── Search purchase (offset-based pagination) ───
  async searchPurchase(gdtToken: string, fromDate: string, toDate: string, loaiHD = 'ddt', pageOffset = 0) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const searchQuery = this.buildSearchQuery(from, to, true);
    const res = await this.fetchPurchasePage(gdtToken, searchQuery, pageOffset * PAGE_SIZE, loaiHD);

    if (res.status === 401) return { gdtExpired: true, error: 'Token GDT đã hết hạn' };
    if (res.status === 204 || res.status === 404) return { datas: [], total: 0, offset: pageOffset };
    if (res.status !== 200) {
      const errorDetail = typeof res.data === 'string' ? res.data : (res.data?.message || res.data?.error || 'Lỗi từ GDT (mua vào)');
      throw new BadGatewayException(errorDetail);
    }

    return {
      datas: res.data?.datas || [],
      total: res.data?.total || 0,
      offset: pageOffset,
    };
  }

  // ─── Export Purchase Excel ───
  async exportPurchaseExcel(gdtToken: string, fromDate: string, toDate: string, loaiHD = 'ddt', mst: string, res: Response) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const allData: any[] = [];
    const chunks = diffDays <= 10 ? [{ from, to }] : this.splitDateRange(from, to, 10);

    for (const chunk of chunks) {
      if (allData.length > 0) await new Promise(r => setTimeout(r, 1000));
      const q = this.buildSearchQuery(chunk.from, chunk.to, true);
      let offset = 0;
      let total = 0;
      do {
        if (offset > 0) await new Promise(r => setTimeout(r, 1000));
        const pageRes = await this.fetchPurchasePage(gdtToken, q, offset, loaiHD, 50);
        if (pageRes.status !== 200) {
          const errorDetail = typeof pageRes.data === 'string' ? pageRes.data : (pageRes.data?.message || pageRes.data?.error || 'Lỗi từ GDT');
          throw new BadGatewayException(`Lỗi GDT (mua vào): ${errorDetail}`);
        }
        const { datas = [], total: t = 0 } = pageRes.data || {};
        if (datas.length === 0) break; // Thoát vòng lặp nếu không có dữ liệu trả về để tránh lặp vô hạn
        total = t;
        allData.push(...datas);
        offset += 50;
      } while (offset < total);
    }

    if (allData.length === 0) {
      res.status(400).json({ error: 'Không có dữ liệu hóa đơn mua vào nào để xuất file.' });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TamTin System';
    const sheet = workbook.addWorksheet('Hóa đơn mua vào', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    sheet.mergeCells('A1:K1');
    const title = sheet.getCell('A1');
    title.value = `BẢNG KÊ HÓA ĐƠN CHỨNG TỪ HÀNG HÓA, DỊCH VỤ MUA VÀO`;
    title.font = { bold: true, size: 14, name: 'Times New Roman' };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 24;

    sheet.mergeCells('A2:K2');
    const sub = sheet.getCell('A2');
    sub.value = `Kèm theo tờ khai thuế GTGT`;
    sub.font = { size: 12, name: 'Times New Roman' };
    sub.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 18;

    sheet.mergeCells('A3:K3');
    const period = sheet.getCell('A3');
    period.value = `Kỳ ${this.formatDisplay(fromDate)} - ${this.formatDisplay(toDate)}`;
    period.font = { italic: true, size: 12, name: 'Times New Roman' };
    period.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 18;

    const nmten = allData[0]?.nmten || '...';
    const nmmst = allData[0]?.nmmst || '';
    sheet.mergeCells('A5:E5');
    sheet.getCell('A5').value = `Tên cơ sở kinh doanh : ${nmten}`;
    sheet.getCell('A5').font = { bold: true, size: 11, name: 'Times New Roman' };
    sheet.mergeCells('H5:K5');
    sheet.getCell('H5').value = `Mã số thuế : ${nmmst}`;
    sheet.getCell('H5').font = { bold: true, size: 11, name: 'Times New Roman' };
    sheet.mergeCells('A6:K6');
    sheet.getCell('A6').value = `Địa chỉ : ...............................................................................................................`;
    sheet.getCell('A6').font = { size: 11, name: 'Times New Roman' };

    sheet.columns = [
      { key: 'a', width: 6 }, { key: 'b', width: 13 }, { key: 'c', width: 10 },
      { key: 'd', width: 12 }, { key: 'e', width: 40 }, { key: 'f', width: 15 },
      { key: 'g', width: 25 }, { key: 'h', width: 16 }, { key: 'i', width: 8 },
      { key: 'j', width: 14 }, { key: 'k', width: 16 },
    ];

    sheet.mergeCells('A7:A8'); sheet.getCell('A7').value = 'STT';
    sheet.mergeCells('B7:D7'); sheet.getCell('B7').value = 'Hóa đơn chứng từ mua';
    sheet.getCell('B8').value = 'Seri';
    sheet.getCell('C8').value = 'Số HĐ';
    sheet.getCell('D8').value = 'Ngày HĐ';
    sheet.mergeCells('E7:E8'); sheet.getCell('E7').value = 'Tên người bán';
    sheet.mergeCells('F7:F8'); sheet.getCell('F7').value = 'MST người bán';
    sheet.mergeCells('G7:G8'); sheet.getCell('G7').value = 'Mặt hàng';
    sheet.mergeCells('H7:H8'); sheet.getCell('H7').value = 'Giá trị hàng hóa\nchưa thuế';
    sheet.mergeCells('I7:I8'); sheet.getCell('I7').value = 'Thuế\nsuất';
    sheet.mergeCells('J7:J8'); sheet.getCell('J7').value = 'Thuế\nGTGT';
    sheet.mergeCells('K7:K8'); sheet.getCell('K7').value = 'Ghi chú';

    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    [7, 8].forEach(r => {
      const row = sheet.getRow(r);
      row.height = 20;
      for (let c = 1; c <= 11; c++) {
        const cell = row.getCell(c);
        cell.font = { bold: true, size: 10, name: 'Times New Roman' };
        if (cell.value) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = borderThin;
      }
    });

    allData.forEach((inv, idx) => {
      let percent: string | number = '';
      if (inv.tgtcthue && inv.tgtthue) percent = Math.round((inv.tgtthue / inv.tgtcthue) * 100);
      const row = sheet.addRow([
        idx + 1,
        inv.khhdon,
        inv.shdon,
        this.formatDisplay(inv.tdlap),
        inv.nbten || '', // Người bán
        inv.nbmst || '', // MST người bán
        '',
        inv.tgtcthue || 0,
        percent,
        inv.tgtthue || 0,
        inv.tgtttbso || 0,
      ]);
      for (let c = 1; c <= 11; c++) {
        const cell = row.getCell(c);
        cell.border = borderThin;
        cell.font = { size: 10, name: 'Times New Roman' };
        if (c >= 8 && c <= 11 && c !== 9) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else if ([1, 3, 4, 6, 9].includes(c)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      }
    });

    const sumRow = sheet.addRow([
      '', '', '', '', 'Tổng cộng:', '', '',
      allData.reduce((s, r) => s + (r.tgtcthue || 0), 0), '',
      allData.reduce((s, r) => s + (r.tgtthue || 0), 0),
      allData.reduce((s, r) => s + (r.tgtttbso || 0), 0),
    ]);
    sheet.mergeCells(`A${sumRow.number}:G${sumRow.number}`);
    sumRow.getCell('A').alignment = { horizontal: 'center', vertical: 'middle' };
    sumRow.getCell('A').value = 'Tổng cộng:';
    for (let c = 1; c <= 11; c++) {
      const cell = sumRow.getCell(c);
      cell.border = borderThin;
      cell.font = { bold: true, size: 10, name: 'Times New Roman' };
      if (c >= 8 && c <= 11 && c !== 9) cell.numFmt = '#,##0';
    }

    const loaiLabel = loaiHD === 'mtt' ? 'MTT' : 'DDT';
    const mstStr = (mst || 'MST').replace(/[^a-zA-Z0-9]/g, '');
    const fromStr = this.formatDisplay(fromDate).replace(/\//g, '');
    const toStr = this.formatDisplay(toDate).replace(/\//g, '');
    const fileName = `${mstStr} - ${fromStr}-${toStr} - Mua Vao - ${loaiLabel}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
