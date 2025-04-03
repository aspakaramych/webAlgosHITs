import {parseCSV} from "./parseCsv.js";
import {buildDecisionTree, predict} from "./decisionTree.js";

let decisionTree = null;
const targetColumn = 'label';

document.getElementById('build-tree').addEventListener('click', () => {
    const csvData = document.getElementById('training-data').value;
    if (!csvData) {
        alert('Enter training data');
        return;
    }
    try {
        const parsedCSV = parseCSV(csvData);
        decisionTree = buildDecisionTree(parsedCSV, targetColumn);
        document.getElementById('tree-out').textContent = JSON.stringify(decisionTree, null, 2);
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('predict').addEventListener('click', () => {
    if (!decisionTree) {
        alert('Please build the decision tree first.');
        return;
    }

    const csvData = document.getElementById('new-data').value;
    if (!csvData) {
        alert('Please enter new data.');
        return;
    }

    try {
        const parsedData = parseCSV(csvData);
        const predictions = predictAll(decisionTree, parsedData);
        document.getElementById('classification-result').textContent = predictions.join('\n');
    } catch (error) {
        alert(`Error during classification: ${error.message}`);
    }
});