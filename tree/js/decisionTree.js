function entropy(labels) {
    const counts = {}
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
        const values = [...new Set(subset.map(item => item[feature]))];
        const gain = informationGain(subset, feature, values, targetColumn);
        if (gain > bestGain) {
            bestGain = gain;
            bestFeature = feature;
        }
    }

    const node = { feature: bestFeature, children: {} };
    const values = [...new Set(subset.map(item => item[bestFeature]))];
    for (const value of values) {
        const subdata = subset.filter(item => item[bestFeature] === value);
        node.children[value] = buildNode(subdata, features, targetColumn);
    }
    return node;
}