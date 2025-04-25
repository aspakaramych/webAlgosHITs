export function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(';');
    return lines.slice(1).map(line => {
        const values = line.split(';');
        return headers.reduce((obj, header, index) => {
            obj[header] = isNaN(Number(values[index])) ? values[index] : Number(values[index]);
            return obj;
        }, {});
    });
}