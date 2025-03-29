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
})