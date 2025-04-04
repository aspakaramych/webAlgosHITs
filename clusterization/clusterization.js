// k-means++ + silhouette coefficient

const canvas = document.getElementById('field');
document.getElementById('start').addEventListener('click', cluserizationAlgo);

const context = canvas.getContext('2d');
context.strokeRect(0, 0, canvas.width, canvas.height);

const STYLES = [
    'red',
      'blue',
       'orange',
         'green',
          'brown',
          'purple',
            'pink',
            'gray',
            'black',
             'magenta', // смесь розового и фиолетового :3
              'yellow',
               'lime'
];

let points = [];

function getCursorPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    context.fillRect(x-5, y-5, 10, 10);
    points.push({x: x, y: y});
}

canvas.addEventListener('click', getCursorPosition);

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

// kMeans++
function getCentroids(k) {
    let centroids = [points[Math.floor(Math.random() * points.length)]]; // начинаем плясать от любой рандомной точки
    
    for (let i = 1; i < k; i++) {
        let distances = [];
        for (let point of points) {
            let minDist = Infinity;
            for (let centr = 0; centr < centroids.length; centr++) {   // находим ближайший центроид к данной точке
                let dist = getDistance(point, centroids[centr]);
                if (dist < minDist) {
                    minDist = dist;
                }
            }
            distances.push(minDist * minDist);
        }
        
        let sum = 0;
        for (let dist of distances) {
            sum += dist;
        }
        
        let threshold = Math.random() * sum;
        let currSum = 0;
        
        for (let j = 0; j < points.length; j++) {               // находится точка: если текущее расстояние дало перевал через порог - 
            currSum += distances[j];                            // берем эту точку в качестве центроида (вероятность того, что эта точка
            if (currSum >= threshold) {                         // подходит в качестве центроида (достаточно удалена от уже существующих
                centroids.push(points[j]);                      // центроидов) велика из-за удалённости, но не 100%)
                break;
            }
        }
    }
    
    return centroids;
}

function centralize(centroids) {    // группируем точки в кластеры по соотв. центроидам
    let clusters = new Map();
    
    for(let centr of centroids) {
        clusters.set(`${centr.x},${centr.y}`, []);
    }
    
    for(let point of points) {
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
    
    // уточнение позиций центроидов
    for (let centr of centroids) {
        let currCluster = clusters.get(`${centr.x},${centr.y}`);
        let newCentr = getNewCentroidCoords(currCluster);
        
        if (newCentr) {
            newCentroids.push(newCentr);
        } else {
            emptyClusters.push(centr);
        }
    }
    
    // обработка пустых кластеров (перераспределяем)
    if (emptyClusters.length > 0) {
        let maxVariance = 0;                                
        let targetClusterKey = null;
        let clusterEntries = Array.from(clusters.entries());
        
        for (let j = 0; j < clusterEntries.length; j++) {
            let [key, clusterPoints] = clusterEntries[j];
            
            if (clusterPoints.length <= 1) continue;
            
            const [x, y] = key.split(',').map(Number);      // берём непустой кластер
            let currCentroid = {x: x, y: y};                // достаём его центроид
            let variance = 0;
            
            for (let k = 0; k < clusterPoints.length; k++) {
                let currPoint = clusterPoints[k];
                variance += Math.pow(getDistance(currPoint, currCentroid), 2);  // считаем внутрикластерный разброс точек
            }                                                                   // квадрат - чтобы увеличить веса "выбросов" 
            
            if (variance > maxVariance) {                   // находим кластер с наибольшим разбросом точек
                maxVariance = variance;
                targetClusterKey = key;
            }
        }
        
        // перераспределяем точки в пустые центроиды
        if (targetClusterKey) {
            let targetCluster = clusters.get(targetClusterKey);     // берём кластер
            let [x, y] = targetClusterKey.split(',').map(Number);
            let centroid = {x: x, y: y};
            
            let maxDist = 0;
            let farthestPoint = null;
            
            for (let m = 0; m < targetCluster.length; m++) {    // находим его самую удаленную точку
                let point = targetCluster[m];
                let dist = getDistance(point, centroid);
                if (dist > maxDist) {
                    maxDist = dist;
                    farthestPoint = point;
                }
            }
            
            if (farthestPoint) {
                newCentroids.push(farthestPoint);   // делаем из самой отдалённой точки центроид
                for (let n = 1; n < emptyClusters.length; n++) {
                    let currPoints = points;       // добавляем случайные точки из других кластеров
                    if (currPoints && currPoints.length > 0) { // случайные, чтобы центроиды не смещались в сторону выбросов при их наличии              
                        let randomIndex = Math.floor(Math.random() * currPoints.length);
                        newCentroids.push(currPoints[randomIndex]);
                    }
                }
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

function draw(clusters) {
    context.clearRect(1, 1, canvas.width-2, canvas.height-2);
    
    let i = 0;
    
    for (const [key, value] of clusters) {        
        context.fillStyle = STYLES[i];
        for (let point of value) {
            context.fillRect(point.x-5, point.y-5, 10, 10);
        }
        i++;
    }
}

// метод силуэтов - оценка качества кластеризации
// средняя сумма расстояний от точки до точек своего кластера должна быть меньше
// средней суммы расстояний от точки до точек другого кластера для высокой оценки кластеризации -
// высокий результат - значит, точка в нужном кластере, иначе - надо бы перераспределить её в другой
function silhouetteCoef(clusters, centroids) {
    let totalScore = 0;
    let totalPoints = 0;
    
    for (let centr of centroids) {
        let clusterKey = `${centr.x},${centr.y}`;
        let clusterPoints = clusters.get(clusterKey) || [];
        
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
            
            totalScore += isNaN(res) ? 0 : res;
            totalPoints++;
        }
    }
    
    return totalPoints > 0 ? totalScore / totalPoints : -1;
}

function cluserizationAlgo() {
    let bestK = 1;
    let bestScore = 0;
    let maxK = Math.min(10, points.length);
    let bestClusters = null;
    let bestCentroids = null;
    let k = 1;
    let nums_k = parseInt(document.getElementById('nums_k').value)
    console.log(nums_k)
    if(!isNaN(nums_k)) {
        k = nums_k;
        maxK = nums_k += 1;

    }
    for (; k < maxK; k++) {
        let centroids = getCentroids(k);
        let prevCentroids = null;
        let clusters = null;
        let iterations = 0;

        const maxIterations = 100;
        
        while (!isTheSame(prevCentroids, centroids) && iterations < maxIterations) {
            prevCentroids = centroids;
            clusters = centralize(centroids);
            centroids = updateCentroids(centroids, clusters);
            iterations++;
        }
        
        let silhouetteScore = silhouetteCoef(clusters, centroids);
        
        if (silhouetteScore > bestScore) {
            bestScore = silhouetteScore;
            bestK = k;
            bestClusters = clusters;
            bestCentroids = centroids;
        }
    }
    

    draw(bestClusters);
}