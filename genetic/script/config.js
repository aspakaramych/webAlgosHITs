//параметры
export const cntPopulation = 1000; //численность популяции
export const cntEpoch = 10000; //количество итераций (поколений)
export const mutationRate = 0.5; //процент мутирующих особей
export const tournamentSize = 20; //количество особей, участвующих в отборе на родителя
export const cntPairs = 500; //количество браков (скрещиваний) в одном поколении
export const thresholdStagnation = 200; //количество поколений без улучшения, после которых наступает катаклизм
export const inbreeding = 0.1; //минимальный порог разницы между родителями

//переменные для отрисовки
export const render = 1;
export const radDots = 8;