const canvas = document.getElementById('field');
document.getElementById('kmeans').addEventListener('click', kMeans);
document.getElementById('kmeans++').addEventListener('click', kmeansPlusPlus);
document.getElementById('DBSCAN').addEventListener('click', dbscan);
document.getElementById('clear').addEventListener('click', clear);

const context = canvas.getContext('2d');
context.strokeRect(0, 0, canvas.width, canvas.height);
canvas.addEventListener('click', getCursorPosition);

let POINTS = [];

function getDistance(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
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

// kMeans++
function getCentroids(k) {
    let centroids = [POINTS[Math.floor(Math.random() * POINTS.length)]]; // начинаем плясать от рандомной точки
    
    for (let i = 1; i < k; i++) {
        let distancesBetweenPointsAndCentroids = [];
        for (let point of POINTS) {
            let minDist = Infinity;
            for (let centr = 0; centr < centroids.length; centr++) {   // находим ближайший центроид к данной точке
                let dist = getDistance(point, centroids[centr]);
                if (dist < minDist) {
                    minDist = dist;
                }
            }
            distancesBetweenPointsAndCentroids.push(minDist * minDist);
        }
        
        let sumDist = 0;
        for (let dist of distancesBetweenPointsAndCentroids) {
            sumDist += dist;
        }
        
        let threshold = Math.random() * sumDist;
        let currSum = 0;
        
        for (let j = 0; j < POINTS.length; j++) {               // находится точка: если текущее расстояние дало перевал через порог - 
            currSum += distancesBetweenPointsAndCentroids[j];   // берем эту точку в качестве центроида (вероятность того, что эта точка
            if (currSum >= threshold) {                         // подходит в качестве центроида (достаточно удалена от уже существующих
                centroids.push(POINTS[j]);                      // центроидов) велика из-за удалённости, но не 100%)
                break;
            }
        }
    }
    
    return centroids;
}

function centralize(centroids) {    // группируем точки в кластеры по соотв. центроидам
    let clusters = new Map();
    
    for(const centr of centroids) {
        clusters.set(`${centr.x},${centr.y}`, []);
    }
    
    for(const point of POINTS) {
        let min = Infinity;
        let nearestCentr = null;
        for(const centr of centroids) {
            let currDist = getDistance(point, centr);
            if(currDist < min) {
                min = currDist;
                nearestCentr = centr;
            }
        }
        clusters.get(`${nearestCentr.x},${nearestCentr.y}`).push(point);
    }
    
    return clusters;
}

function updateCentroids(centroids, clusters) {
    let newCentroids = [];
    let emptyClusters = [];
    
    // уточняем позиции центроидов
    for (let centr of centroids) {
        let currCluster = clusters.get(`${centr.x},${centr.y}`);
        let newCentr = getNewCentroidCoords(currCluster);
        
        if (newCentr) {
            newCentroids.push(newCentr);
        } else {
            emptyClusters.push(centr);
        }
    }
    
    // находим кластер с наибольшим разбросом точек
    if (emptyClusters.length > 0) {
        let maxDispersion = 0;                                
        let targetClusterKey = null;
        let clusterEntries = Array.from(clusters.entries());
        
        for (let j = 0; j < clusterEntries.length; j++) {
            let [key, clusterPoints] = clusterEntries[j];
            
            if (clusterPoints.length <= 1) continue;
            
            const [x, y] = key.split(',').map(Number);
            let currCentroid = {x: x, y: y};
            let dispersion = 0;
            
            for (let k = 0; k < clusterPoints.length; k++) {
                let currPoint = clusterPoints[k];
                dispersion += Math.pow(getDistance(currPoint, currCentroid), 2);    // считаем внутрикластерный разброс точек
            }                                                                       // квадрат, чтобы увеличить веса "выбросов" 
            
            if (dispersion > maxDispersion) {
                maxDispersion = dispersion;
                targetClusterKey = key;
            }
        }
        
        // перераспределяем точки в пустые центроиды
        if (targetClusterKey) {
            let targetCluster = clusters.get(targetClusterKey);
            let [x, y] = targetClusterKey.split(',').map(Number);
            let centroid = {x: x, y: y};
            
            // cортируем все точки кластера по удалённости от текущего центроида
            let sortedPoints = targetCluster.sort((a, b) => {
                return getDistance(b, centroid) - getDistance(a, centroid);
            });
            
            // берём n самых удалённых точек (т = количество пустых центроидов)
            for (let n = 0; n < emptyClusters.length; n++) {
                newCentroids.push(sortedPoints[n]);
            }
        }
    }
    
    return newCentroids;
}

// проверка на идентичность, чтобы прекратить итерации
function isTheSame(oldCentroids, newCentroids, threshold = 1) {
    if (!oldCentroids || oldCentroids.length !== newCentroids.length) return false;
    
    for (let i = 0; i < oldCentroids.length; i++) {
        if (getDistance(oldCentroids[i], newCentroids[i]) > threshold) {
            return false;
        }
    }
    
    return true;
}

// метод силуэтов - оценка качества кластеризации
// средняя сумма расстояний от точки до точек своего кластера должна быть меньше
// средней суммы расстояний от точки до точек другого кластера для высокой оценки кластеризации -
// высокий результат - значит, точка в нужном кластере, иначе - надо бы перераспределить её в другой
function silhouetteCoef(clusters, centroids) {
    let totalScore = 0;
    
    for (let centr of centroids) {
        let clusterPoints = clusters.get(`${centr.x},${centr.y}`) || [];
        
        for (let point of clusterPoints) {
            let a = 0;

            if (clusterPoints.length > 1) {                 // среднее расстояние до точек своего кластера (a)
                let sumDist = 0;
                let count = 0;
                
                for (let otherPoint of clusterPoints) {
                    if (otherPoint === point) continue;
                    sumDist += getDistance(point, otherPoint);
                    count++;
                }
                a = sumDist / count;
            }
            
            let minAvgDist = Infinity;                      // минимальное среднее расстояние до точек других кластеров (b)
            
            for (let otherCentr of centroids) {
                if (otherCentr === centr) continue;
                
                let otherClusterKey = `${otherCentr.x},${otherCentr.y}`;
                let otherCluster = clusters.get(otherClusterKey) || [];
                
                if (otherCluster.length === 0) continue;
                
                let sumDist = 0;
                for (let otherPoint of otherCluster) {
                    sumDist += getDistance(point, otherPoint);
                }

                let avgDist = sumDist / otherCluster.length;
                if (avgDist < minAvgDist) {
                    minAvgDist = avgDist;                   // среднее расстояние до точек другого кластера
                }
            }
            
            let b = minAvgDist === Infinity ? 0 : minAvgDist;   // вычисляем силуэт
            let res = Math.max(a, b) !== 0 ? (b - a) / Math.max(a, b) : 0; 
            
            totalScore += res;
        }
    }
    
    return totalScore;
}

function kmeansPlusPlus() {
    let bestScore = 0;
    let maxK = Math.min(10, POINTS.length);
    let bestClusters = null;
    let bestCentroids = null;
    let k = 1;

    let res = validateUserInput(k, maxK);
    k = res.k;
    maxK = res.maxK;

    for (let i = k; i < maxK; i++) {
        let centroids = getCentroids(i);
        let prevCentroids = null;
        let clusters = null;
        let iterations = 0;

        const MAXITERATIONS = 100;
        
        while (!isTheSame(prevCentroids, centroids) && iterations < MAXITERATIONS) {
            prevCentroids = centroids;
            clusters = centralize(centroids);
            centroids = updateCentroids(centroids, clusters);
            iterations++;
        }
        
        let silhouetteScore = silhouetteCoef(clusters, centroids);
        if (silhouetteScore > bestScore || maxK - k === 1) {
            bestScore = silhouetteScore;
            bestClusters = clusters;
            bestCentroids = centroids;
        }
    }
    
    drawWithCentroids(bestClusters, bestCentroids);
}

function validateUserInput(k, maxK) {
    let nums_k = parseInt(document.getElementById('nums_k').value)

    if(!isNaN(nums_k)) {
        k = nums_k;
        maxK = nums_k + 1;

    }

    if(POINTS.length === 1) {
        maxK = 2;
    }

    return {k: k, maxK: maxK};
}

function drawWithCentroids(clusters, centroids) {
    context.clearRect(1, 1, canvas.width-2, canvas.height-2);
    
    let i = 0;
    for (const [key, value] of clusters) {        
        context.fillStyle = getRandomColor();
        for (let point of value) {
            context.fillRect(point.x-5, point.y-5, 10, 10);
        }
        context.beginPath();
        context.arc(centroids[i].x, centroids[i].y, 10, 0, 2 * Math.PI);
        context.fill();
        i++;
    }
}


// DBSCAN
function epsilonLocalityScan(currPointIndex, epsilon) {
    let neighbours = [];
    for(let i = 0; i < POINTS.length; i++) {
        if(getDistance(POINTS[currPointIndex], POINTS[i]) <= epsilon) {
            neighbours.push(i);
        }
    }
    return neighbours;
}

function expandCluster(currPointIndex, neighbours, visited, epsilon) {
    let currCluster = [];
    currCluster.push(currPointIndex);

    for(const neighbourPointIndex of neighbours) {
        if(!visited[neighbourPointIndex]) {
            visited[neighbourPointIndex] = true;
            let neighbourPointNeighbours = epsilonLocalityScan(neighbourPointIndex, epsilon);
            if(neighbourPointNeighbours.length >= MINPOINTS) {
                for(let index of neighbourPointNeighbours) {
                    if(!visited[index]) {
                        neighbours.push(index);
                    }
                }
            }
            currCluster.push(neighbourPointIndex);
        }
    }
    return currCluster;
}

let MINPOINTS = 2;

function dbscan() {
    let clusters = [];
    let visited = new Array(POINTS.length).fill(false);
    let noises = [];

    let epsilon = document.getElementById("epsilon-value").value;

    for(let i = 0; i < POINTS.length; i++) {
        if(!visited[i]) {
            visited[i] = true;
            let neighbours = epsilonLocalityScan(i, epsilon);
            if(neighbours.length >= MINPOINTS) {
                clusters.push(expandCluster(i, neighbours, visited, epsilon));          
            }
            else {
                noises.push(i);
            }
        }
    }


    draw_dbscan(clusters, noises);
}

function draw_dbscan(clusters, noises) {
    context.clearRect(1, 1, canvas.width-2, canvas.height-2);

    for (let cluster of clusters) {  
        context.fillStyle = getRandomColor();
        for (let point of cluster) {
            context.fillRect(POINTS[point].x-5, POINTS[point].y-5, 10, 10);
        }
    }

    for (let point of noises) {  
        context.fillStyle = getRandomColor();
        context.fillRect(POINTS[point].x-5, POINTS[point].y-5, 10, 10);
    }

}

// kMeans standart
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
    const left = 0, right = canvas.width;
    const bottom = 0, top = canvas.height;

    centroids = [];
    for(let i = 0; i < k; i++) {
        const x = (Math.random() * (right - left) + left);
        const y = (Math.random() * (top - bottom) + top);
        centroids.push({x: x, y: y});
    }

    return centroids;
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

function kMeans() {
    let currCentroids = [];
    let cluster = null;
    let wcssHistory = new Map();
    let wcssValues = []
    let centroidsHistory = new Map();
    let k = 1;
    let maxK = 15;
    
    let res = validateUserInput(k, maxK);
    k = res.k;
    maxK = res.maxK;

    for(let i = k; i < maxK; i++) {
        currCentroids = getRandomCentroids(i);
        let currCluster = centralize(currCentroids);
        while(!mapEquation(cluster, currCluster)) {
            cluster = currCluster;
            currCentroids = getNormalizedCentroids(currCentroids, currCluster);
            currCluster = centralize(currCentroids);
        }
        let currWcss = getWcss(currCluster, currCentroids);
        wcssValues.push(currWcss);
        wcssHistory.set(currWcss, currCluster);
        centroidsHistory.set(currWcss, currCentroids);

        cluster = null;
    }

    let index = 0;
    if(k === 1) {
        let maxDiff = 0;
        for(let i = 1; i < wcssValues.length - 1; i++) {
            let currDiff = wcssValues[i-1] - wcssValues[i];
            if(currDiff > maxDiff) {
                index = i;
                maxDiff = currDiff;
            }
        }
    }

    let resultPoints = wcssHistory.get(wcssValues[index]);
    let resultCentroids = centroidsHistory.get(wcssValues[index]);

    drawWithCentroids(resultPoints, resultCentroids);
}

function clear() {
    POINTS = [];
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getCursorPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    context.fillRect(x-5, y-5, 10, 10);
    POINTS.push({x: x, y: y});
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