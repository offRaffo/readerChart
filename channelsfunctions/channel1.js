const fileInput = document.getElementById('fileInput');
const filename = document.getElementById('filename');
const plotButton = document.getElementById('plotButton');
const nextvalid = document.getElementById('nextvalid');
const prevalid = document.getElementById('prevalid');
import { decodeData } from '../rawdata.js';
import { FileManager } from '../fileReader/file-manager.js';
import { prova } from '../fileReader/app.js';
const chindex = 0;
let currentstart = 0;
let minX = 0;
let maxX = 0;
let cycleifles = false;
let overviewChart = null;
let mainChart = null;
nextvalid.disabled = false;
plotButton.disabled = false;
let DecodedData = null;
let chartinstance = null;
let currentFileIndex = 0;  // Variabile per tenere traccia del file corrente
let filesQueue = [];  // Queue per memorizzare i file da elaborare
function checkFile() {
    if (fileInput.files.length > 0) {
        plotButton.disabled = false;
    } else {
        plotButton.disabled = true;
    }
}

// Aggiungi un ascoltatore per l'evento 'change' sull'input file
fileInput.setAttribute('multiple', 'true');

fileInput.addEventListener('change', checkFile);
function handlePlotClick() {
    document.querySelector('.loader-container').style.display = 'flex';
    const files = fileInput.files; // Ottieni tutti i file selezionati
    if (files.length > 0) {
        filesQueue = Array.from(files);  // Salva i file nella queue
        processFiles();  // Avvia l'elaborazione automatica dei file
    }
    if (chartinstance !== null) {
        chartinstance.destroy();
    }
    document.querySelector('.loader-container').style.display = 'none';

}
async function startModuleProcessing(receivedFilesQueue, receivedFileIndex) {
    if (!receivedFilesQueue || receivedFilesQueue.length === 0) {
        console.warn("File queue vuota! Ricarico i file dall'input...");
        const files = fileInput.files;
        if (files.length > 0) {
            let path = "/";
            const { ftpfiles } = await explore(path);
            filesQueue = ftpfiles.map(file => `${path}/${file}`);
            console.log(filesQueue, "file queue");
            currentFileIndex = 0;
        } else {
            console.error("Nessun file selezionato! Impossibile avviare il processo.");
            return;
        }
    } else {
        filesQueue = receivedFilesQueue;
        currentFileIndex = (receivedFileIndex !== null && receivedFileIndex >= 0 && receivedFileIndex < filesQueue.length)
            ? receivedFileIndex
            : 0;
    }

    processFiles();
}

function mostraPopup() {
    return new Promise((resolve) => {
        document.getElementById("popupOverlay").classList.add("show");
        document.getElementById("popup").classList.add("show");

        // Aspetta un breve momento per assicurarsi che il popup sia visibile
        setTimeout(resolve, 100);
    });
}
async function processFiles() {
    if (cycleifles == true) {
        if (currentFileIndex >= filesQueue.length) {
            alert("Hai visualizzato tutti i file.");
            currentFileIndex = 0; // Opzionale: resetta l'indice se tutti i file sono stati processati
            return;
        }

        document.querySelector('.loader-container').style.display = 'flex';

        const file = filesQueue[currentFileIndex];

        try {
            // Usa fetch per ottenere il file dal server FTP
            const response = await fetch(`https://sbnv01.itaca.upv.es/ftp/download?file=${file}`);
            const data = await response.arrayBuffer(); // Ottieni il file come ArrayBuffer

            // Converte l'ArrayBuffer in un Uint8Array (compatibile con il codice esistente)
            const buffer = new Uint8Array(data);
            console.log(buffer);
            // Decodifica i dati usando decodeData
            DecodedData = await decodeData(buffer);
            plotData(DecodedData); // Plotta i dati se validi
            filename.innerText = `${currentFileIndex + 1}/${filesQueue.length} ${filesQueue[currentFileIndex]}`;
        } catch (error) {
            console.error("Errore nella lettura del file:", error);
        }

        document.querySelector('.loader-container').style.display = 'none';

        // **Aspetta il click dell'utente prima di passare al file successivo**
    } else {
        console.log("-----------------Ciclo dei file disabilitato ----------------");
    }
}


// Funzione helper per leggere il file come ArrayBuffer con Promise
function readFileAsBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(new Uint8Array(event.target.result));
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

// Funzione per avanzare al prossimo file quando l'utente preme il pulsante "nextvalid"
function nextValidClick() {
    if (cycleifles) {
        if (currentFileIndex < filesQueue.length - 1) {
            currentFileIndex++;
            processFiles(); // Carica il prossimo file
        } else {
            alert("Hai visualizzato tutti i file.");
        }
    }
}
function preValidClick() {
    console.log(currentFileIndex, cycleifles);

    if (cycleifles == true) {
        if (currentFileIndex > 0) {
            currentFileIndex--;
            processFiles(); // Carica il prossimo file
        } else {
            alert("Hai visualizzato tutti i file.");
        }
    }
}

// Aggiunge l'event listener per il pulsante "nextvalid"
nextvalid.addEventListener('click', nextValidClick);
prevalid.addEventListener('click', preValidClick);



function destroyModule() {
    // 1. Distruggere i grafici
    if (overviewChart) {
        overviewChart.destroy();
        overviewChart = null;
    }
    if (mainChart) {
        mainChart.destroy();
        mainChart = null;
    }

    // 2. Rimuovere gli event listeners
    fileInput.removeEventListener('change', checkFile);
    plotButton.removeEventListener('click', startModuleProcessing);

    // Rimuovere il listener per il pulsante nextvalid
    //nextvalid.removeEventListener('click', nextValidClick);  // Rimuove il listener dal pulsante

    // 3. Ripulire le variabili globali
    DecodedData = null;
    chartinstance = null;


    // 6. Ripristinare le variabili dell'interfaccia utente
    const windowElement = document.getElementById('window');
    windowElement.style.left = '0%';
    windowElement.style.width = '10%';
}
export async function init(receivedFilesQueue = [], receivedFileIndex = 0, currentwindowstart = 0) {
    document.querySelector('.loader-container').style.display = 'flex';
    cycleifles = true;
    receivedFilesQueue = prova;
    console.log(filesQueue, "file queue");
    console.log("Modulo inizializzato.");
    currentstart = currentwindowstart;
    startModuleProcessing(receivedFilesQueue, receivedFileIndex);
    // ✅ Rimuove il vecchio canvas e ne crea uno nuovo
    const oldCanvas = document.getElementById("overview");
    const oldmain = document.getElementById("mainChart");
    if (oldCanvas) {
        oldCanvas.parentNode.removeChild(oldCanvas);
        console.log("Canvas 'overview' rimosso.");
        oldmain.parentNode.removeChild(oldmain);
    }

    // ✅ Crea un nuovo canvas con lo stesso ID
    const newmain = document.createElement("canvas");
    const newCanvas = document.createElement("canvas");
    newCanvas.id = "overview";
    newmain.id = "mainChart";
    document.getElementById("overview-container").appendChild(newCanvas); // Assicurati che esista un contenitore con questo ID
    document.querySelector("#mainChartcontainer").appendChild(newmain);

} export function cleanup() {
    cycleifles = false;
    destroyModule();
    return {
        updatedFileIndex: currentFileIndex,  // Rinomina per coerenza con handleChannelSelection
        updatedFilesQueue: filesQueue,
        currentwindowstart: currentstart
    };
}

// Pulsante per passare al file successivo

function datasetsFromChannels(decodedData) {
    try {
        const labels = decodedData.map((_, index) => `Pacchetto ${index + 1}`);
        const datasets = decodedData[0].map((_, channelIndex) => {
            return {
                label: `Canale ${channelIndex + 1}`,
                data: decodedData.map((packet, index) => ({
                    x: index + 1,
                    y: packet[chindex] // Modificato per usare il canale corretto
                })),
                borderColor: `hsl(${channelIndex * 120}, 70%, 50%)`,
                backgroundColor: `hsl(${channelIndex * 120}, 70%, 70%, 0.2)`,
                fill: false
            };
        });
    } catch (error) {
        console.error("Errore nella creazione dei dataset:", error);
    }

    return { labels, datasets }; // Restituisci le etichette e i dataset
}



plotButton.addEventListener('click', handlePlotClick);
export function plotData(decodedData) {
    function getChannelData(channelIndex) {
        const windowSize = Math.floor(decodedData.length * 0.01); // Dimensione della finestra dell'1%
        const channelData = decodedData.map(packet => packet[channelIndex]);
        const movingAverages = [];

        for (let i = 0; i <= channelData.length - windowSize; i++) {
            const window = channelData.slice(i, i + windowSize);
            const sum = window.reduce((acc, val) => acc + val, 0);
            const average = sum / windowSize;
            movingAverages.push({ x: i, y: average });
        }

        return movingAverages;
    }
    function getMaxValue(datasets) {
        let maxValue = -Infinity;
        datasets.forEach(dataset => {
            dataset.data.forEach(point => {
                if (point.y > maxValue) {
                    maxValue = point.y;
                }
            });
        });
        return maxValue;
    }
    function getMinValue(datasets) {
        let minValue = Infinity;
        datasets.forEach(dataset => {
            dataset.data.forEach(point => {
                if (point.y < minValue) {
                    minValue = point.y;
                }
            });
        });
        console.log("MinValue", minValue);
        return minValue;
    }

    function datasetsFromChannels(decodedData) {
        if (decodedData === undefined || decodedData.length === 0) {
            console.error("Nessun dato decodificato!");
            return; // Esci dalla funzione se i dati non sono disponibili
        }

        if (decodedData[chindex] === undefined) {
            console.error(`Errore: il canale ${chindex} non esiste nei dati decodificati.`);
            return; // Esci dalla funzione se il canale specificato non esiste
        }
        console.log("Creazione dei dataset dai canali...");
        const labels = decodedData.map((_, index) => `Pacchetto ${index + 1}`);
        const datasets = decodedData[chindex].map((_, channelIndex) => {
            return {
                label: `Canale ${channelIndex + 1}`,
                data: decodedData.map((packet, index) => ({
                    x: index + 1,
                    y: packet[channelIndex] // Usa il canale corretto
                })),
                borderColor: `hsl(${channelIndex * 120}, 70%, 50%)`,
                backgroundColor: `hsl(${channelIndex * 120}, 70%, 70%, 0.2)`,
                fill: false
            };
        });
        console.log("Dataset creato");
        console.log(datasets); // Aggiungi questo log per vedere cosa restituisce la funzione
        return { labels, datasets }; // Restituisci le etichette e i dataset
    }

    const channel2Data = getChannelData(chindex);
    let validata = false;
    for (let i in channel2Data) {
        if (channel2Data[i].y !== 0 && !isNaN(channel2Data[i].y)) {
            validata = true;
        }

    }
    if (validata == false) {
        mostraPopup();
        if (overviewChart) {
            overviewChart.destroy();
            overviewChart = null;
        }
        if (mainChart) {
            mainChart.destroy();
            mainChart = null;
        }
        return;
    }


    const { labels, datasets } = datasetsFromChannels(decodedData);
    const canvas = document.getElementById('overview');
    const overviewContainer = document.getElementById('overview-container');
    canvas.width = overviewContainer.offsetWidth;
    canvas.height = overviewContainer.offsetHeight;
    console.log("dimensioni", canvas.width, canvas.height);
    const overviewCtx = canvas.getContext('2d');
    // Pulisce il canvas se c'è un grafico esistente
    if (overviewChart) {
        console.log("Distruggo il grafico esistente...");
        overviewChart.destroy();
        overviewChart = null;
    }

    console.log("Creazione nuovo grafico...");

    overviewChart = new Chart(overviewCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Media Mobile Canale 2',
                data: channel2Data,
                borderColor: 'black',
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            layout: {
                padding: 0
            },
            scales: {
                x: {
                    type: 'linear',
                    display: false,
                    min: 0,
                    max: labels.length
                },
                y: {
                    type: 'linear',
                    display: false,
                    beginAtZero: true,
                    max: getMaxValue([{ data: channel2Data }]),
                    min: getMinValue([{ data: channel2Data }]),
                }
            }
        }
    });

    console.log("chart 1 OverviewChart creato:", overviewChart);

    // Ora che il grafico esiste, possiamo aggiornarlo
    overviewChart.update();






    // Configurazione grafico "main" (dati filtrati dalla finestra)
    // Otteniamo il contesto del canvas
    const mainCtx = document.getElementById('mainChart').getContext('2d');
    let selectedPoints = [];
    let handlepan = false;
    // Se esiste già un grafico, lo distruggiamo
    if (mainChart) {
        mainChart.destroy();
    }

    mainChart = new Chart(mainCtx, {
        type: 'line',
        data: {
            labels: [],  // Assicurati di popolare le label con i dati corretti
            datasets: [{
                label: 'Dati Filtrati',
                data: [],  // I dati da visualizzare
                borderColor: 'red',
                borderWidth: 1,
                pointRadius: 1,      // I punti non vengono disegnati
                pointHitRadius: 10,  // Aumenta l'area sensibile per il touch
            }]
        },
        options: {
            responsive: true,
            animation: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: false },
                zoom: {
                    // Configurazione dello zoom
                    zoom: {
                        mode: 'x', // Lo zoom è limitato all'asse x
                        wheel: { enabled: true, modifierKey: 'ctrl' }, // Abilita lo zoom con la rotella del mouse
                        pinch: { enabled: true },  // Abilita lo zoom tramite pinch sui dispositivi mobile
                        limits: {
                            x: { min: 0, max: 100 }  // Limiti di zoom sull'asse X (sostituisci 100 con il tuo valore massimo)
                        },
                        onZoom: function ({ chart }) {
                            const xScale = chart.scales.x;
                            console.log('Zoom attuale - Min:', xScale.min, 'Max:', xScale.max);
                            console.log('Zoom limits:', minX,maxX);
                            if (xScale.min < minX && xScale.max > maxX) {
                                chart.options.plugins.zoom.pan.enabled = false;
                            }
                            else {
                                chart.options.plugins.zoom.pan.enabled = true;
                            }
                            if (xScale.min < minX){
                                chart.resetZoom();
                            }
                        },
                    },
                    // Configurazione del pan (inizialmente disabilitato)
                    pan: {
                        enabled: true, // Abilita il pan
                        mode: 'x',
                        limits: {
                            x: { min: minX, max: maxX } // Imposta i limiti basati sui tuoi valori
                        }
                    },
                    onPan: function ({ chart }) {
                        console.log("pan completato");
                        const xScale = chart.scales.x;
                        console.log('Pan attuale - Min:', xScale.min, 'Max:', xScale.max);
                        console.log('Limiti del pan:', minX, maxX);
                    
                        // Se l'utente prova a spostarsi oltre i limiti, riportiamo il grafico dentro i limiti
                        if (xScale.min < minX || xScale.max > maxX) {
                            chart.pan({
                                x: xScale.min < minX ? minX : xScale.max > maxX ? maxX : xScale.min
                            });
                        }
                    },
                    
                }
            },
            // Gestione del click (o tap) per la selezione dei punti
            onClick: (event, elements) => {
                const points = mainChart.getElementsAtEventForMode(
                    event,
                    'nearest',
                    { intersect: true },
                    false
                );

                if (points.length) {
                    const firstPoint = points[0];
                    const label = mainChart.data.labels[firstPoint.index];
                    const value = mainChart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
                    const labelMatch = label.match(/(\d+)/);
                    const labelNumber = labelMatch ? Number(labelMatch[0]) : NaN;
                    console.log(labelNumber);

                    if (!isNaN(labelNumber)) {
                        selectedPoints.push(labelNumber);
                    }

                    if (selectedPoints.length === 1) {
                        document.getElementById('point1').innerText = `Label: ${selectedPoints[0]}`;
                    } else if (selectedPoints.length === 2) {
                        document.getElementById('point2').innerText = `Label: ${selectedPoints[1]}`;
                                const velocity = ((0.316 / (Math.abs(selectedPoints[1] - selectedPoints[0]) / 6377)) * 3.6).toFixed(2);
                        document.getElementById('velocity').innerHTML = `${velocity} km/h`;
                    } else if (selectedPoints.length === 3) {
                        // Se viene selezionato un terzo punto, il primo viene sostituito e si resetta la selezione
                        selectedPoints[0] = selectedPoints[2];
                        document.getElementById('point1').innerText = `Label: ${selectedPoints[0]}`;
                        document.getElementById('point2').innerText = "Nessun punto selezionato";
                        selectedPoints.splice(1, 2);
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    // Converte il valore della label in secondi (ad es.)
                    ticks: {
                        callback: function (value, index, values) {
                            return `${(value / 6377).toFixed(2)}s`;
                        }
                    },
                },
                y: { type: 'linear' }
            }
        }
    });

    // Salviamo i valori originali dell'asse x per poterli confrontare nelle callback
    mainChart.$originalXMin = mainChart.scales.x.min;
    mainChart.$originalXMax = mainChart.scales.x.max;






    // Variabili per la finestra trasparente
    const windowElement = document.getElementById('window');
    let windowWidth = 100; // Percentuale della larghezza della finestra
    let windowStart = currentstart; // Posizione iniziale della finestra

    // Aggiorna il grafico principale
    document.getElementById('updateWindow').addEventListener('click', updateWindowWidth);
    //document.getElementById('calcvelocity').addEventListener('click', evaluateVelocity);

function updateMainChart() {
    if (cycleifles) {
        // Calcolo degli indici per il range dei dati
        const startIndex = Math.floor((windowStart / 100) * datasets[chindex].data.length);
        const endIndex = Math.floor(((windowStart + windowWidth) / 100) * datasets[chindex].data.length);
        const filteredData = datasets[chindex].data.slice(startIndex, endIndex);

        const filteredLabels = filteredData.map((_, index) => `${(startIndex + index)}`);

        // Aggiorna i dati del grafico
        mainChart.data.labels = filteredLabels;
        mainChart.data.datasets[0].data = filteredData;

        // Calcola i valori minimi e massimi per l'asse X in base ai nuovi dati
        minX = Math.min(...filteredLabels);
        maxX = Math.max(...filteredLabels);

        // Log per verificare i valori min e max
        console.log('minX:', minX, 'maxX:', maxX);

        // Aggiorna i limiti dell'asse X
        mainChart.options.scales.x.min = minX;
        mainChart.options.scales.x.max = maxX;

        // Imposta i limiti di zoom per evitare zoom oltre il massimo
        mainChart.options.plugins.zoom.zoom.limits = {
            x: {
                min: minX,  // Imposta il limite minimo di zoom
                max: maxX   // Imposta il limite massimo di zoom
            }
        };

        // Log per verificare i limiti di zoom
        console.log('Zoom limits:', mainChart.options.plugins.zoom.zoom.limits);

        // Forza un aggiornamento del grafico
        mainChart.update();
    }
}

    

    // Drag per dispositivi desktop e mobile
    function enableDrag(element) {
        let startX = 0;

        const onDragStart = (e) => {
            if (cycleifles) {

                startX = e.touches ? e.touches[0].clientX : e.clientX;
                document.addEventListener(e.touches ? 'touchmove' : 'mousemove', onDragMove);
                document.addEventListener(e.touches ? 'touchend' : 'mouseup', onDragEnd);
            }
        };

        const onDragMove = (e) => {
            mainChart.resetZoom();
            mainChart.options.plugins.zoom.pan.enabled = false;
            mainChart.update('none');
            const currentX = e.touches ? e.touches[0].clientX : e.clientX;
            console.log("currentX", currentX);
            const deltaX = currentX - startX;
            startX = currentX;
            const containerWidth = overviewContainer.offsetWidth;
            const deltaPercent = (deltaX / containerWidth) * 100;
            windowStart = Math.min(Math.max(windowStart + deltaPercent, 0), 100 - windowWidth);

            // Aggiorna posizione finestra e grafico
            element.style.left = `${windowStart}%`;
            currentstart = windowStart;
            updateMainChart();
        };

        const onDragEnd = () => {
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
            document.removeEventListener('touchmove', onDragMove);
            document.removeEventListener('touchend', onDragEnd);
        };

        element.addEventListener('mousedown', onDragStart);
        element.addEventListener('touchstart', onDragStart);
    }

    // Funzione per aggiornare la larghezza della finestra
    function updateWindowWidth() {
        const inputValue = parseInt(document.getElementById('windowWidthInput').value, 10);
        if (inputValue >= 1 && inputValue <= 100) {
            windowWidth = inputValue;
            windowElement.style.width = `${windowWidth}%`;
            updateMainChart();
        } else {
            alert('Inserisci un valore tra 1 e 100');
        }
    }
    //function evaluateVelocity() {
    //    start=document.getElementById('startpacket').value;
    //    document.getElementById('velocity').innerText = ;
    //}

    // Posizione iniziale della finestra
    windowElement.style.left = `${windowStart}%`;
    windowElement.style.width = `${windowWidth}%`;

    // Abilita il drag sulla finestra
    enableDrag(windowElement);

    // Inizializza il grafico principale con la posizione iniziale
    updateMainChart();
}
