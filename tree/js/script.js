let decisionTree;

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(';');
    return lines.slice(1).map(line => {
        const values = line.split(';');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
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
    let entropy = 0;
    for (const key in counts) {
        const probability = counts[key] / total;
        entropy -= probability * Math.log2(probability);
    }
    return entropy;
}

function splitData(data, attribute) {
    const groups = {};
    data.forEach(row => {
        const value = row[attribute];
        if (!groups[value]) groups[value] = [];
        groups[value].push(row);
    });
    return groups;
}

function buildTree(data, attributes, target) {
    const uniqueClasses = new Set(data.map(row => row[target]));
    if (uniqueClasses.size === 1) {
        return {type: 'leaf', value: uniqueClasses.values().next().value};
    }

    if (attributes.length === 0) {
        const classCounts = {};
        data.forEach(row => {
            classCounts[row[target]] = (classCounts[row[target]] || 0) + 1;
        });
        let mostFrequentClass = null;
        let maxCount = 0;
        for (const cls in classCounts) {
            if (classCounts[cls] > maxCount) {
                mostFrequentClass = cls;
                maxCount = classCounts[cls];
            }
        }
        return {type: 'leaf', value: mostFrequentClass};
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
        if (gain > bestGain) {
            bestGain = gain;
            bestAttribute = attr;
        }
    });

    const tree = {type: 'node', attribute: bestAttribute, children: {}};
    const remainingAttributes = attributes.filter(attr => attr !== bestAttribute);
    const groups = splitData(data, bestAttribute);

    for (const value in groups) {
        tree.children[value] = buildTree(groups[value], remainingAttributes, target);
    }

    return tree;
}

function predict(tree, row) {
    if (tree.type === 'leaf') {
        return tree.value;
    }
    const value = row[tree.attribute];
    if (tree.children[value]) {
        return predict(tree.children[value], row);
    }
    return null;
}

function visualizeTreeWithD3(tree, containerId) {
    const width = 800;
    const height = 600;

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
}

document.getElementById('train-button').addEventListener('click', () => {
    const trainData = document.getElementById('train-data').value;
    const parsedData = parseCSV(trainData);

    const attributes = Object.keys(parsedData[0]).filter(key => key !== 'Play');
    const target = 'Play';

    decisionTree = buildTree(parsedData, attributes, target);
    console.log(decisionTree);

    visualizeTreeWithD3(decisionTree, 'tree-container');
});


document.getElementById('predict-button').addEventListener('click', () => {
    const testData = document.getElementById('test-data').value;
    const parsedData = parseCSV(testData);

    const output = parsedData.map(row => {
        const prediction = predict(decisionTree, row);
        return `Prediction for ${JSON.stringify(row)}: ${prediction}`;
    }).join('\n');

    document.getElementById('prediction-output').textContent = output;
});