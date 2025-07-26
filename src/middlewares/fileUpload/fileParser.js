import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Readable } from "stream";

// function parseCSV(buffer, options = {}) {
//   return new Promise((resolve, reject) => {
//     const resutls = [];
//     Papa.parse(buffer.toString(), {
//       header: true,
//       skipEmptyLines: true,
//       ...options,
//       worker: true,
//       step: (row) => {
//         resutls.push(row.data);
//       },
//       complete: () => resolve(resutls),
//       error: (error) => reject(new Error(`CSV parse error: ${error.message}`)),
//     });
//   });
// }

/**
 * parseCSV
 *  - Uses a Readable stream so Papa doesn’t build giant strings in memory.
 *  - header, skipEmptyLines, and worker flags preserved.
 */
function parseCSV(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer);

    Papa.parse(stream, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      ...options,          // e.g. options.delimiter, options.transformHeader
      step: ({ data }) => {
        results.push(data);
      },
      complete: () => resolve(results),
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

// function parseXLSX(buffer, options = {}) {
//   try {
//     const workbook = XLSX.read(buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, ...options });
//     return Promise.resolve(rows);
//   } catch (error) {
//     return Promise.reject(new Error(`XLSX parse error: ${error.message}`));
//   }
// }

/**
 * parseXLSX
 *  - Runs XLSX.read on setImmediate to avoid blocking the main thread.
 *  - Always resolves or rejects a Promise.
 */
function parseXLSX(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    setImmediate(() => {
      try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
          ...options,      // e.g. options.dateNF, options.header
        });
        resolve(rows);
      } catch (err) {
        reject(new Error(`XLSX parse error: ${err.message}`));
      }
    });
  });
}

// export async function parseFile(buffer, ext, options = {}) {
//   switch (ext.toLowerCase()) {
//     case "csv":
//       return parseCSV(buffer, options.csv);
//     case "xlsx":
//       return parseXLSX(buffer, options.xlsx);
//     case "xls":
//       return parseXLSX(buffer, options.xlsx);
//     default:
//       throw new Error(`Unsupported file extension: ${ext}`);
//   }
// }

export async function parseFile(buffer, ext, options = {}) {
  const lower = ext.toLowerCase();
  if (lower === "csv") {
    return parseCSV(buffer, options.csv || {});
  }
  if (lower === "xlsx" || lower === "xls") {
    return parseXLSX(buffer, options.xlsx || {});
  }
  throw new Error(`Unsupported file extension: ${ext}`);
}
