function entropy(labels) {
    const counts = {};
    labels.forEach(label => counts[label] = (counts[label] || 0) + 1);
    const total = labels.length;
    return -Object.values(counts).reduce((sum, count) => {
        const probability = count / total;
        return sum + probability * Math.log2(probability);
    }, 0);
}


function informationGain(data, feature, values, targetColumn) {
    const totalEntropy = entropy(data.map(item => item[targetColumn]));
    let weightedEntropy = 0;

    for (const value of values) {
        const subset = data.filter(item => item[feature] === value);
        const proportion = subset.length / data.length;
        weightedEntropy += proportion * entropy(subset.map(item => item[targetColumn]));
    }

    return totalEntropy - weightedEntropy;
}


function buildNode(subset, features, targetColumn) {
    if (subset.length === 0) return null;

    const labels = subset.map(item => item[targetColumn]);
    const uniqueLabels = [...new Set(labels)];
    if (uniqueLabels.length === 1) {
        return { label: uniqueLabels[0] };
    }

    let bestFeature = null;
    let bestGain = -Infinity;
    for (const feature of features) {
        const featureValues = [...new Set(subset.map(item => item[feature]))];
        const gain = informationGain(subset, feature, featureValues, targetColumn);
        if (gain > bestGain) {
            bestGain = gain;
            bestFeature = feature;
        }
    }

    const node = { feature: bestFeature, children: {} };
    const featureValues = [...new Set(subset.map(item => item[bestFeature]))];
    for (const value of featureValues) {
        const subdata = subset.filter(item => item[bestFeature] === value);
        node.children[value] = buildNode(subdata, features, targetColumn);
    }
    return node;
}


export function buildDecisionTree(data, targetColumn) {
    if (!data || data.length === 0) {
        throw new Error('No data');
    }
    const keys = Object.keys(data[0]);
    if (!keys.includes(targetColumn)) {
        throw new Error('No target column');
    }
    const features = keys.filter(key => key !== targetColumn);
    return buildNode(data, features, targetColumn);
}


function predict(tree, dataPoint) {
    let currentNode = tree;

    while (currentNode) {
        if (currentNode.label !== undefined) {
            return currentNode.label;
        }

        const feature = currentNode.feature;
        const value = dataPoint[feature];

        if (currentNode.children && currentNode.children[value]) {
            currentNode = currentNode.children[value];
        } else {
            throw new Error(`No matching rule found for feature '${feature}' with value '${value}'.`);
        }
    }

    throw new Error("Tree traversal ended unexpectedly.");
}

export function predictAll(tree, dataPoints) {
    return dataPoints.map(dataPoint => predict(tree, dataPoint));
}
