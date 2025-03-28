document.getElementById('InputCsv').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        const csvContent = e.target.result;
        const data = parseCSV(csvContent);
        displayTable(data);
    };

    reader.onerror = function () {
        alert('Error reading the file.');
    };

    reader.readAsText(file);
}

function parseCSV(csvContent) {
    const rows = csvContent.split('\n');
    return rows.map(row => row.split(';'));
}

function displayTable(data) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Очищаем предыдущее содержимое

    if (data.length === 0) {
        outputDiv.textContent = 'No data to display.';
        return;
    }

    const table = document.createElement('table');

    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const cellElement = rowIndex === 0 ? document.createElement('th') : document.createElement('td');
            cellElement.textContent = cell.trim();
            tr.appendChild(cellElement);
        });
        table.appendChild(tr);
    });

    outputDiv.appendChild(table);
}