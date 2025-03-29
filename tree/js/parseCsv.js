export function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(';');
    return lines.slice(1).map(line => {
        const val = line.split(';');
        return headers.reduce((obj, header, idx) => {
            obj[header] = val[idx];
            return obj;
        }, {});
    });
}