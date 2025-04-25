import {parseCSV} from "./parseCsv.js";
import {visualizeTreeWithD3, visualizePredictionPath} from "./visual.js";
import {buildTree, mostFrequentClass} from "./buildTree.js";

let decisionTree;

function predict(tree, row) {
    const path = [];

    function traverse(currentNode, rowData) {
        if (currentNode.type === 'leaf') {
            path.push({type: 'leaf', value: currentNode.value});
            return currentNode.value;
        }

        const attributeValue = rowData[currentNode.attribute];
        path.push({type: 'node', attribute: currentNode.attribute, value: attributeValue});
        const childKey = typeof attributeValue === 'number'
            ? (attributeValue <= rowData[currentNode.attribute] ? '<=' : '>')
            : attributeValue;

        if (currentNode.children[childKey]) {
            return traverse(currentNode.children[childKey], rowData);
        }
        return mostFrequentClass(Object.values(currentNode.children), 'value');
    }

    const result = traverse(tree, row);
    return {result, path};
}



document.addEventListener('DOMContentLoaded', () => {
    const trainContainer = document.getElementById('train-data');
    const testContainer = document.getElementById('test-data');
    const parentContainer = document.getElementById('parent-container')
    const errorModal = document.getElementById('error-modal');
    const result = document.getElementById('result');
    const errorText = document.getElementById('error-text');

    document.getElementById('train-button').addEventListener('click', () => {
        const trainData = trainContainer.value;
        if (trainData.trim() === '') {
            errorText.textContent = 'Вы не ввели данные';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        const parsedData = parseCSV(trainData);
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            errorText.textContent = 'Вы ввели некорректные данные';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        if (!parsedData[0].hasOwnProperty('Label')) {
            errorText.textContent = 'У вас нет колонки Label';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        const attributes = Object.keys(parsedData[0]).filter(key => key !== 'Label');
        const target = 'Label';
        if (attributes.length === 0) {
            errorText.textContent = 'Вы не ввели атрибуты';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        decisionTree = buildTree(parsedData, attributes, target);
        console.log(decisionTree);
        visualizeTreeWithD3(decisionTree, 'tree-container');
    });

    document.getElementById('predict-button').addEventListener('click', () => {
        if (!decisionTree){
            errorText.textContent = 'Вы не ввели тренировочные данные';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        const testData = testContainer.value;
        if (testData.trim() === '') {
            errorText.textContent = 'Вы не ввели данные';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        const parsedData = parseCSV(testData);
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            errorText.textContent = 'Вы ввели некорректные данные';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        if (parsedData.length > 2){
            errorText.textContent = 'Вы ввели много данных';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        if (parsedData[0].hasOwnProperty('Label')) {
            errorText.textContent = 'У вас есть колонка Label';
            errorModal.style.display = 'flex';
            parentContainer.classList.add('blur');
            return;
        }
        const output = parsedData.map(row => {
            const prediction = predict(decisionTree, row);
            console.log(prediction.path)
            visualizePredictionPath(decisionTree, prediction.path, 'tree-container');
            return prediction.result;
        }).join('\n');

        result.textContent = 'Результат: ' + output;
    });

    document.getElementById('error-close-button').addEventListener('click', () => {
        errorModal.style.display = 'none';
        parentContainer.classList.remove('blur');
    });
});