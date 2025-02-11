let currentModule = null; // Traccia il modulo attivo
let selectedValue = null;
document.addEventListener('DOMContentLoaded', function () {
    const selectElement = document.getElementById('Chosechannel');
    selectElement.addEventListener('change', selected_channel);
});

window.chiudiPopup = function () {
    document.getElementById("popupOverlay").classList.remove("show");
    document.getElementById("popup").classList.remove("show");
};

function selected_channel() {
    const selectElement = document.getElementById('Chosechannel');
    selectedValue = selectElement.value;
    const selectedText = selectElement.options[selectElement.selectedIndex]?.text;

    if (selectedValue !== null && selectedValue !== "") {
        console.log(`Canale selezionato: ${selectedText} (ID: ${selectedValue})`);
        document.getElementById("label-channel").style.display = "none";
        handleChannelSelection(selectedValue);
    } else {
        console.log("Nessun canale selezionato!");
    }
}
export { selectedValue };


export async function handleChannelSelection(channel_selector) {
    let updatedFileIndex = 0;
    let updatedFilesQueue = [];
    let currentwindowstart = 0;

    if (currentModule && typeof currentModule.cleanup === "function") {
        console.log("Cleanup del modulo precedente.");
        ({ updatedFileIndex, updatedFilesQueue, currentwindowstart } = currentModule.cleanup() || {});
        updatedFileIndex = updatedFileIndex ?? 0;
        currentwindowstart = currentwindowstart ?? 0;
        updatedFilesQueue = updatedFilesQueue ?? [];
        currentModule = null;
    }

    const moduleMap = {
        "0": './channelsfunctions/channel1.js',
        "1": './channelsfunctions/channel2.js',
        "2": './channelsfunctions/channel3.js',
        "all": './channelsfunctions/allchannel.js'
    };

    if (moduleMap[channel_selector]) {
        try {
            const module = await import(moduleMap[channel_selector]);
            console.log(`Modulo ${channel_selector} importato.`);
            currentModule = module;

            if (typeof module.init === "function") {
                module.init(updatedFilesQueue, updatedFileIndex, currentwindowstart, decodeData);
            }

        } catch (error) {
            console.error(`Errore nell'importazione del modulo ${channel_selector}`, error);
        }
    } else {
        console.log("Selezione non valida o nessun canale selezionato.");
    }
}

// Funzione per decodificare i dati direttamente nel browser
export function decodeData(buffer) {
    const PACKET_MARK = 0xAA;
    const PACKET_LEN = 10;
    const PACKET_CHANNELS = 3;

    let decodedData = [];
    let i = 0;

    while (i <= buffer.length - PACKET_LEN) {
        if (buffer[i] === PACKET_MARK) {
            let packet = [];
            for (let j = 0; j < PACKET_CHANNELS; j++) {
                const freq = buffer[i + 1 + j * 3] + (buffer[i + 2 + j * 3] << 8) + (buffer[i + 3 + j * 3] << 16);
                packet.push(freq);
            }
            decodedData.push(packet);
            i += PACKET_LEN;
        } else {
            i++;
        }
    }

    return decodedData;
}
