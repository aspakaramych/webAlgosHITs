const canvas = document.getElementById('field');
document.getElementById('start').addEventListener('click', cluserizationAlgo);
context = canvas.getContext('2d');
context.strokeRect(0, 0, canvas.width, canvas.height);

let styles = ['red', 'pink', 'blue', 'orange', 'purple']

let points = [];
let pointsForRedrawing = [];

function getCursorPosition(event) {
    const rect = canvas.getBoundingClientRect();
    // console.log(   rect.right,          rect.left,         rect.top,    rect.bottom)
    //               868.6666717529297   168.6666717529297      150.5         750.5
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    context.fillRect(x-5, y-5, 10, 10);
    points.push({x: x, y: y});
    // console.log("x: " + x + " y: " + y);
    // console.log(points);
}

canvas.addEventListener('click', function(e) {
    getCursorPosition(e)
})

function getDistance(point1, point2) {
    return Math.sqrt((point2.x - point1.x)*(point2.x - point1.x) + (point2.y - point1.y)*(point2.y - point1.y));
}

function getNewCentroidCoords(cluster) {
    let xSum = 0;
    let ySum = 0;
    let length = cluster.length;
    for(let point of cluster) {
        xSum += point.x;
        ySum += point.y;
    }
    return {x: (xSum/length), y: (ySum/length)};
}

function getNormalizedCentroids(centroids, clusters) {
    for(let i = 0; i < clusters.size; i++) {
        if(!clusters.has(`${centroids[i].x},${centroids[i].y}`)) {
            centroids.splice(i, 1);
        }
        else {
            centroids[i] = getNewCentroidCoords(clusters.get(`${centroids[i].x},${centroids[i].y}`))
        }
    }
    return centroids;
}

function getWcss(map, centroids) {
    let wcss = 0;
    let currCentroid = 0;
    for (const [key, value] of map) {
        for(const i of map.get(key)) {
            let dist = getDistance(i, centroids[currCentroid]);
            wcss += dist*dist;
        }
        currCentroid++;
    }
    return wcss;
}

function getRandomCentroids(k) {
    const left = 0, right = 700;
    const top = 0, bottom = 600;
    centroids = [];
    for(let i = 0; i < k; i++) {
        const x = (Math.random() * (right - left) + left);
        const y = (Math.random() * (bottom - top) + top);
        centroids.push({x: x, y: y});
    }

    return centroids;
}

function centralize(centroids) {
    let clusters = new Map();
    for(const point of points) {
        let min = 100000;
        let nearestCentr = null;
        for(const centr of centroids) {
            let currDist = getDistance(point, centr);
            if(currDist < min) {
                min = currDist;
                nearestCentr = centr;
            }
        }
        if(!clusters.has(`${nearestCentr.x},${nearestCentr.y}`)) {
            clusters.set(`${nearestCentr.x},${nearestCentr.y}`, []);
        }
        clusters.get(`${nearestCentr.x},${nearestCentr.y}`).push(point);
    }
    // if(clusters.size < centroids.length) {
    //     clusters.set()
    // }
    return clusters;
}

function draw(result) {
    context.clearRect(1, 1, canvas.width-2, canvas.height-2);
    const rect = canvas.getBoundingClientRect();
    let i = 0;
    // console.log(result);
    for(const [key, value] of result) {
        for(point of value) {
            context.fillStyle = styles[i];
            context.fillRect(point.x-5, point.y-5, 10, 10);
        }
        i++;
    }
}

function mapEquation(map1, map2) {
    if(map1 == null || map2 == null) {
        return false;
    }
    let lengths = [];
    for (const [key, value] of map1) {
        lengths.push(value.length);
    }
    let i = 0;
    for (const [key, value] of map2) {
        if(lengths[i++] != value.length) {
            return false;
        }
    }
    return true;
}

function cluserizationAlgo() {
    let currCentroids = [];
    let cluster = null;
    let wcssHistory = new Map();
    let wcssValues = []
    
    for(let k = 1; k < 15; k++) {
        currCentroids = getRandomCentroids(k);
        let currCluster = centralize(currCentroids);
        while(!mapEquation(cluster, currCluster)) {
            cluster = currCluster;
            currCentroids = getNormalizedCentroids(currCentroids, currCluster);
            currCluster = centralize(currCentroids);
        }
        let currWcss = getWcss(currCluster, currCentroids);
        wcssValues.push(currWcss);
        wcssHistory.set(currWcss, currCluster);
        // console.log(currWcss);

        cluster = null;
    }

    let index = 0;
    let maxDiff = 0;
    for(let i = 1; i < wcssValues.length - 1; i++) {
        let currDiff = wcssValues[i-1] - wcssValues[i] + (wcssValues[i] - wcssValues[i]);
        if(currDiff > maxDiff) {
            index = i;
            maxDiff = currDiff;
        }
    }

    let result = wcssHistory.get(wcssValues[index]);

    console.log(wcssHistory);

    draw(result);

}