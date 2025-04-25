let decisionTree;

function parseCSV(csv) {
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

function entropy(data, target) {
    const counts = {};
    data.forEach(row => {
        counts[row[target]] = (counts[row[target]] || 0) + 1;
    });

    const total = data.length;
    if (total === 0) return 0;
    let entropy = 0;
    for (const key in counts) {
        const probability = counts[key] / total;
        if (probability > 0) { // Защита от log2(0)
            entropy -= probability * Math.log2(probability);
        }
    }
    return entropy;
}

function splitData(data, attribute) {
    const isNumeric = typeof data[0][attribute] === 'number';
    if (!isNumeric) {
        const groups = {};
        data.forEach(row => {
            const value = row[attribute];
            if (!groups[value]) groups[value] = [];
            groups[value].push(row);
        });
        return groups;
    } else {
        const sortedValues = data.map(row => row[attribute]).sort((a, b) => a - b);
        const median = sortedValues[Math.floor(sortedValues.length / 2)];
        return {
            '<=': data.filter(row => row[attribute] <= median),
            '>': data.filter(row => row[attribute] > median)
        };
    }
}

function buildTree(data, attributes, target) {
    const uniqueClasses = new Set(data.map(row => row[target]));
    if (uniqueClasses.size === 1) {
        return {type: 'leaf', value: uniqueClasses.values().next().value};
    }

    if (attributes.length === 0) {
        return {type: 'leaf', value: mostFrequentClass(data, target)};
    }

    let bestAttribute = null;
    let bestGain = -Infinity;
    const baseEntropy = entropy(data, target);


    attributes.forEach(attr => {
        const groups = splitData(data, attr);
        let newEntropy = 0;
        for (const value in groups) {
            const subset = groups[value];
            const subsetEntropy = entropy(subset, target);
            newEntropy += (subset.length / data.length) * subsetEntropy;
        }
        const gain = baseEntropy - newEntropy;

        // Отладочная информация
        console.log(`Attribute: ${attr}, Gain: ${gain}`);

        if (gain > bestGain) {
            bestGain = gain;
            bestAttribute = attr;
        }
    });
    const tree = {type: 'node', attribute: bestAttribute, children: {}};
    const remainingAttributes = attributes.filter(attr => attr !== bestAttribute);
    const groups = splitData(data, bestAttribute);
    for (const value in groups) {
        const subset = groups[value];
        if (subset.length === 0) {
            tree.children[value] = {type: 'leaf', value: mostFrequentClass(data, target)};
        } else {
            tree.children[value] = buildTree(subset, remainingAttributes, target);
        }
    }

    return tree;
}

function mostFrequentClass(data, target) {
    const classCounts = {};
    data.forEach(row => {
        classCounts[row[target]] = (classCounts[row[target]] || 0) + 1;
    });
    let mostFrequent = null;
    let maxCount = 0;
    for (const cls in classCounts) {
        if (classCounts[cls] > maxCount) {
            mostFrequent = cls;
            maxCount = classCounts[cls];
        }
    }
    return mostFrequent;
}

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

function visualizeTreeWithD3(tree, containerId) {
    const width = 630;
    const height = 630;

    d3.select(`#${containerId}`).selectAll('*').remove();

    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on("zoom", (event) => {
            svgGroup.attr("transform", event.transform);
        }))
        .append('g')
        .attr('transform', 'translate(50, 50)');

    const svgGroup = svg;

    const root = d3.hierarchy(tree, d => d.children ? Object.values(d.children) : null);

    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);
    const links = svg.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2)
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    links.each(function (d) {
        const source = d.source;
        const target = d.target;

        // Определяем условие разделения
        const condition = target.data.type === 'leaf'
            ? ''
            : Object.keys(source.data.children).find(key => source.data.children[key] === target.data);

        if (condition) {
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;

            svg.append('text')
                .attr('x', midY)
                .attr('y', midX)
                .attr('dy', '-0.3em')
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', '#333')
                .text(condition);
        }
    });

    const nodes = svg.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    nodes.append('circle')
        .attr('r', 10)
        .attr('fill', d => d.data.type === 'leaf' ? '#4caf50' : '#007bff');

    nodes.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children ? -15 : 15)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.attribute || d.data.value);
}

function visualizePredictionPath(tree, path, containerId) {
    const width = 630;
    const height = 630;

    d3.select(`#${containerId}`).selectAll('*').remove();

    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on("zoom", (event) => {
            svgGroup.attr("transform", event.transform);
        }))
        .append('g')
        .attr('transform', 'translate(50, 50)');

    const svgGroup = svg;

    const root = d3.hierarchy(tree, d => d.children ? Object.values(d.children) : null);

    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);
    svg.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2)
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    const nodes = svg.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    nodes.append('circle')
        .attr('r', 10)
        .attr('fill', d => d.data.type === 'leaf' ? '#4caf50' : '#007bff');

    nodes.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children ? -15 : 15)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.attribute || d.data.value);
    const pathNodes = [];
    let currentNode = root;
    for (const step of path) {
        if (step.type === 'node') {
            const childNode = currentNode.children.find(child =>
                child.data.attribute === step.attribute &&
                child.data.children && child.data.children[step.value]
            );
            if (childNode) {
                pathNodes.push(currentNode);
                currentNode = childNode;
            }
        } else if (step.type === 'leaf') {
            pathNodes.push(currentNode);
        }
    }

    nodes.filter(d => pathNodes.includes(d))
        .select('circle')
        .attr('fill', 'orange');

    svg.selectAll('.link')
        .filter(link => pathNodes.includes(link.source) && pathNodes.includes(link.target))
        .attr('stroke', 'orange')
        .attr('stroke-width', 4);

    svg.selectAll('.link')
        .filter(link => pathNodes.includes(link.source) && pathNodes.includes(link.target))
        .attr('marker-end', 'url(#arrowhead)');
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