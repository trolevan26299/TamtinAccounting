"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExcelJS = require("exceljs");
async function test() {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Hóa đơn');
        sheet.columns = [
            { key: 'a', width: 6 },
            { key: 'b', width: 13 },
            { key: 'c', width: 10 },
            { key: 'd', width: 12 },
            { key: 'e', width: 40 },
            { key: 'f', width: 15 },
            { key: 'g', width: 25 },
            { key: 'h', width: 16 },
            { key: 'i', width: 8 },
            { key: 'j', width: 14 },
            { key: 'k', width: 16 },
        ];
        const sumRow = sheet.addRow([
            '', '', '', '', 'Tổng cộng:', '', '',
            1000,
            '',
            100,
            1100
        ]);
        sheet.mergeCells(`A${sumRow.number}:G${sumRow.number}`);
        sumRow.getCell('A').alignment = { horizontal: 'center', vertical: 'middle' };
        await workbook.xlsx.writeFile('test.xlsx');
        console.log("Success");
    }
    catch (e) {
        console.error("Error generating excel:", e);
    }
}
test();
//# sourceMappingURL=test-excel.js.map