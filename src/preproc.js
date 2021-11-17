const fs = require('fs/promises');
const path = require('path');

const Excel = require('exceljs');

async function start() {
    const wb = new Excel.Workbook();
    await wb.xlsx.readFile(path.join(__dirname, '..', 'data', 'data.xlsx'));

    const ws = wb.worksheets[0];

    const rows = ws.getRows(4, 200);

    const data = { x1: [], x2: [] };

    for (let i = 1; i <= 11; i++) {
        data[`v${i}`] = { y: [], z: [] };
    }

    rows.forEach(row => {
        const x1c = row.getCell(1);
        const x2c = row.getCell(2);

        data.x1.push(x1c.value);
        data.x2.push(x2c.value);

        for (let i = 0; i < 11; i++) {
            const yc = row.getCell(4 + i * 3);
            const zc = row.getCell(5 + i * 3);

            const v = data[`v${i + 1}`];
            v.y.push(yc.value);
            v.z.push(zc.value);
        }
    });

    await fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(data));
}

start();
