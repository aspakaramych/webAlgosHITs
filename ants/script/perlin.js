export let perlin = {
    randVect: //генерируем случайный вектор (направление от 0 до 2 пи)
        function(){
            let angle = Math.random() * 2 * Math.PI;
            return {x: Math.cos(angle), y: Math.sin(angle)}; //переводим угол в вектор
        },
    dotProdGrid:
        function(x, y, vx, vy){
            let gVect;
            let dVect = {x: x - vx, y: y - vy}; //вектор, указывающий из целочисленной точки (vx, vy) в (x, y)
            if (this.gradients[[vx,vy]]) {
                gVect = this.gradients[[vx,vy]];
            } else {
                gVect = this.randVect();
                this.gradients[[vx, vy]] = gVect;
            }
            return dVect.x * gVect.x + dVect.y * gVect.y; //возвращаем скалярное произведение между нашим gradients и новым вектором
        },
    smootherStep:
        function(x){
            return 6*x**5 - 15*x**4 + 10*x**3; //константы для сглаживания
        },
    interpolate:
        function(x, a, b){
            return a + this.smootherStep(x) * (b-a); //сглаживание
        },
    seed:
        function(){
            this.gradients = {}; //хранит случаный градиентные векторы для каждой точки
            this.memory = {}; //хранит кэш уже просчитанных координат
        },
    get:
        function(x, y) {
            if (this.memory.hasOwnProperty([x,y]))
                return this.memory[[x,y]];
            let xf = Math.floor(x);
            let yf = Math.floor(y);

            let tl = this.dotProdGrid(x, y, xf,   yf);
            let tr = this.dotProdGrid(x, y, xf+1, yf);
            let bl = this.dotProdGrid(x, y, xf,   yf+1);
            let br = this.dotProdGrid(x, y, xf+1, yf+1);

            let xt = this.interpolate(x-xf, tl, tr);
            let xb = this.interpolate(x-xf, bl, br);
            let v = this.interpolate(y-yf, xt, xb);

            this.memory[[x,y]] = v;
            return v;
        }
}
perlin.seed();
