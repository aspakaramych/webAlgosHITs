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
        if (probability > 0) {
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

export function buildTree(data, attributes, target) {
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

export function mostFrequentClass(data, target) {
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