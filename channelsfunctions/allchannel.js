// Dichiarazioni degli elementi
const fileInput = document.getElementById('fileInput');
const filename = document.getElementById('filename');
const plotButton = document.getElementById('plotButton');
const nextvalid = document.getElementById('nextvalid');
const prevalid = document.getElementById('prevalid');
import { decodeData } from '../rawdata.js';
import { prova } from '../fileReader/app.js';
let minX = 0;
let maxX = 0;
let currentstart = 0;
let overviewChart = null;
let cycleifles = false;
let mainChart = null;
let DecodedData = null;
nextvalid.disabled = false;
plotButton.disabled = false;
let chartinstance = null;
let currentFileIndex = 0;  // File corrente
let filesQueue = [];  // Queue per i file
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
    console.log("funzione handleplot carico loader...");
    const files = fileInput.files; // Ottieni tutti i file selezionati
    if (files.length > 0) {
        filesQueue = Array.from(files);  // Salva i file nella queue
        processFiles();  // Avvia l'elaborazione automatica dei file
    }
    if (chartinstance !== null) {
        chartinstance.destroy();
    }
    document.querySelector('.loader-container').style.display = 'none';
    console.log("funzione handlepot scarico loader...");

}
function startModuleProcessing(receivedFilesQueue, receivedFileIndex) {
    if (!receivedFilesQueue || receivedFilesQueue.length === 0) {
        console.warn("File queue vuota! Ricarico i file dall'input...");
        const files = fileInput.files;
        if (files.length > 0) {
            filesQueue = Array.from(files);
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

    console.log(`Modulo avviato. Riprendo dal file ${currentFileIndex + 1} di ${filesQueue.length}`);
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
    if (cycleifles) {
        if (currentFileIndex >= filesQueue.length) {
            alert("Hai visualizzato tutti i file.");
            currentFileIndex = 0; // Opzionale: resetta l'indice se tutti i file sono stati processati
            return;
        }

        document.querySelector('.loader-container').style.display = 'flex';
        console.log("funzione processfile carico loader...");

        const file = filesQueue[currentFileIndex];
        console.log(`Elaborazione del file ${file.name}...`);

        try {
            const response = await fetch(`https://sbnv01.itaca.upv.es/ftp/download?file=${file}`);
            const data = await response.arrayBuffer(); // Ottieni il file come ArrayBuffer

            // Converte l'ArrayBuffer in un Uint8Array (compatibile con il codice esistente)
            const buffer = new Uint8Array(data);
            console.log(buffer);
            DecodedData = await decodeData(buffer);

            console.log("Dati decodificati:", DecodedData);

            if (DecodedData.length === 0 || DecodedData === undefined) {
                await mostraPopup(); // Mostra il popup e aspetta che venga chiuso
            } else {
                plotData(DecodedData); // Plotta i dati se validi
                filename.innerText = `${currentFileIndex + 1}/${filesQueue.length} ${filesQueue[currentFileIndex]}`;
            }
        } catch (error) {
            console.error("Errore nella lettura del file:", error);
        }

        document.querySelector('.loader-container').style.display = 'none';
        console.log("funzione processfiles scarico loader...");

        // **Aspetta il click dell'utente prima di passare al file successivo**
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
    // 4. Ripristinare i controlli UI
    //plotButton.disabled = true;
    //nextvalid.disabled = true;

    // 6. Ripristinare le variabili dell'interfaccia utente
    const windowElement = document.getElementById('window');
    windowElement.style.left = '0%';
    windowElement.style.width = '10%';
}
export async function init(receivedFilesQueue = [], receivedFileIndex = 0, currentwindowstart = 0) {
    document.querySelector('.loader-container').style.display = 'flex';
    cycleifles = true;
    receivedFilesQueue = prova;
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

// Generazione dei dataset per i canali
function datasetsFromChannels(decodedData) {
    const labels = decodedData.map((_, index) => `Pacchetto ${index + 1}`);
    const datasets = decodedData[0].map((_, channelIndex) => ({
        label: `Canale ${channelIndex + 1}`,
        data: decodedData.map((packet, index) => ({ x: index + 1, y: packet[channelIndex] })),
        borderColor: `hsl(${(channelIndex * 360) / decodedData[0].length}, 70%, 50%)`,
        backgroundColor: `hsl(${(channelIndex * 360) / decodedData[0].length}, 70%, 70%, 0.2)`,
        fill: false,
        borderWidth: 1,
        pointRadius: 0,
        pointBorderWidth: 1,
    }));
    return { labels, datasets };
}

// Funzione per ottenere i dati dei canali con media mobile
function getChannelData(decodedData) {
    const windowSize = Math.floor(decodedData.length * 0.01);
    const datasets = [];
    const numberOfChannels = decodedData[0].length;

    for (let channelIndex = 0; channelIndex < numberOfChannels; channelIndex++) {
        const channelData = decodedData.map(packet => packet[channelIndex]);
        const movingAverages = [];

        for (let i = 0; i <= channelData.length - windowSize; i++) {
            const window = channelData.slice(i, i + windowSize);
            const sum = window.reduce((acc, val) => acc + val, 0);
            if (sum!=0 && !isNaN(sum)) {
                movingAverages.push({ x: i, y: sum / windowSize });
            }
        }

        datasets.push({
            label: `Canale ${channelIndex + 1}`,
            data: movingAverages,
            borderColor: `hsl(${(channelIndex * 360) / numberOfChannels}, 70%, 50%)`,
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
        });
    }

    return datasets;
}

// Funzione per il rendering dei dati nel grafico

plotButton.addEventListener('click', handlePlotClick);

function plotData(decodedData) {
    const channel2Data = getChannelData(decodedData);
    console.log(channel2Data[0].data.length);
    let validata = false;
    for (let i in channel2Data) {
        console.log("data channel:", i);
        for (let j in channel2Data[i].data) {
            if (channel2Data[i].data[j].y !== 0 && !isNaN(channel2Data[i].data[j].y)) {
                validata = true;
            }

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
    const overviewCtx = canvas.getContext('2d');

    if (overviewChart) {
        overviewChart.destroy();
    }

    overviewChart = new Chart(overviewCtx, {
        type: 'line',
        data: { labels, datasets: channel2Data },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            layout: { padding: 0 },
            scales: {
                x: { type: 'linear', display: false, max: labels.length, beginAtZero: true },
                y: { type: 'linear', display: false, beginAtZero: true },
            },
        },
    });

    overviewChart.update();

    const mainCtx = document.getElementById('mainChart').getContext('2d');
    let selectedPoints = [];
    if (mainChart) {
        mainChart.destroy();
    }

    mainChart = new Chart(mainCtx, {
        type: 'line',
        data: { labels: [], 
            datasets: [{ data: [] }],
         },
        options: {
            responsive: true,
            animation: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: false },
                zoom: {
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
                    },                    pan: { enabled: true, mode: 'x', modifierKey: 'shift' },
                    pinch: { enabled: true }
                },
            },
            onClick: (event, elements) => {
                handleMainChartClick(event, elements, selectedPoints);
            },
            scales: {
                x: {
                    type: 'linear',
                    ticks: {
                        callback: function (value) {
                            return `${(value / 6377).toFixed(2)}s`;
                        },
                    },
                },
                y: { type: 'linear' },
            },
        },
    });

    const windowElement = document.getElementById('window');
    let windowWidth = 100;
    let windowStart = currentstart; // Posizione iniziale della finestra

    document.getElementById('updateWindow').addEventListener('click', updateWindowWidth);

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

    function updateMainChart() {
        if (cycleifles) {
            const startIndex = Math.floor((windowStart / 100) * datasets[0].data.length);
            const endIndex = Math.floor(((windowStart + windowWidth) / 100) * datasets[0].data.length);
                const filteredDatasets = datasets.map(dataset => {
                    const filteredData = dataset.data.slice(startIndex, endIndex).map(channelData => {
                        // Filtra solo i dati dove x > 0 e y > 0
                        if (channelData.y > 0)  return channelData; // Restituisce l'oggetto completo se x e y sono > 0
                        return null; // Escludi l'oggetto se x o y sono <= 0
                    }).filter(item => item !== null); // Rimuove eventuali oggetti nulli che non soddisfano la condizione
                
                    return {
                        ...dataset,
                        data: filteredData, // I dati filtrati per ogni canale
                        borderWidth: 1,
                        pointRadius: 1,
                        pointHitRadius: 10, // Aumenta l'area sensibile per il touch
                    };
                });
                const canaliConDati = [];

                // Itera su ogni canale e raccogli gli indici dei canali che hanno dati
                filteredDatasets.forEach((channel, index) => {
                    if (channel.data.length > 0) {
                        canaliConDati.push(index); // Aggiungi l'indice del canale all'array
                    }
                });
                
                // Dopo il forEach, stampa gli indici dei canali che contengono dati
                console.log("Canali con dati:", canaliConDati);
                
                
            
            
            
            console.log(filteredDatasets)
            const filteredLabels = filteredDatasets[1].data.map((_, index) => `${startIndex + index}`);
            console.log(filteredLabels);
            minX = Math.min(...filteredLabels);
            maxX = Math.max(...filteredLabels);
    
            // Log per verificare i valori min e max
            console.log('minX:', minX, 'maxX:', maxX);
    
            // Aggiorna i limiti dell'asse X
            mainChart.options.scales.x.min = minX;
            mainChart.options.scales.x.max = maxX;
            mainChart.data.labels = filteredLabels;
            mainChart.data.datasets = filteredDatasets;
            mainChart.update();
        }
    }

    function handleMainChartClick(event, elements, selectedPoints) {
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
                selectedPoints[0] = selectedPoints[2];
                document.getElementById('point1').innerText = `Label: ${selectedPoints[0]}`;
                document.getElementById('point2').innerText = "Nessun punto selezionato";
                selectedPoints.splice(1, 2);
            }
        }
    }

    enableDrag(windowElement);
    windowElement.style.left = `${windowStart}%`;
    windowElement.style.width = `${windowWidth}%`;
    updateMainChart();


    function enableDrag(element) {
        let startX = 0;
        const onDragStart = (e) => {
            if (cycleifles) {
                startX = e.touches ? e.touches[0].clientX : e.clientX;
                document.addEventListener(e.touches ? 'touchmove' : 'mousemove', onDragMove);
                document.addEventListener(e.touches ? 'touchend' : 'mouseup', onDragEnd);
                console.log("muovo anche allchannels");
            }
        };

        const onDragMove = (e) => {
            mainChart.resetZoom();
            const currentX = e.touches ? e.touches[0].clientX : e.clientX;
            const deltaX = currentX - startX;
            startX = currentX;

            const containerWidth = overviewContainer.offsetWidth;
            const deltaPercent = (deltaX / containerWidth) * 100;
            windowStart = Math.min(Math.max(windowStart + deltaPercent, 0), 100 - windowWidth);

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
}
