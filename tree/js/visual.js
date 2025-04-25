export function visualizeTreeWithD3(tree, containerId) {
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

export function visualizePredictionPath(tree, path, containerId) {
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