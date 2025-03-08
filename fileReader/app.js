import { FileManager } from './file-manager.js';
import {selectedValue,handleChannelSelection} from '../rawdata.js';
let filesQueue = [];
let prova =[];
let currentFileIndex = 0;
const fileManager = new FileManager("https://incandescent-winter-hat.glitch.me");

async function createTree(container, path = '/') {
    const { folders, files } = await fileManager.explore(path);

    container.innerHTML = "";

    const ul = document.createElement('ul');

    folders.forEach(folder => {
        const li = document.createElement('li');
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = folder;
        details.appendChild(summary);
        li.appendChild(details);
        li.dataset.path = `${path}/${folder}`;

        details.addEventListener('toggle', async () => {
            if (details.open) {
                await createTree(details, li.dataset.path);
            }
        });

        ul.appendChild(li);
    });

    files.forEach(file => {
        const li = document.createElement('li');
        li.classList.add('file-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = `${path}/${file}`;
        checkbox.classList.add('file-checkbox');

        const label = document.createElement('label');
        label.textContent = file;

        li.appendChild(checkbox);
        li.appendChild(label);
        ul.appendChild(li);
    });

    container.appendChild(ul);
}

function getSelectedFiles() {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

async function processFiles() {
    filesQueue = getSelectedFiles();
    prova=filesQueue;
    handleChannelSelection(selectedValue);
    if (filesQueue.length === 0) {
        alert("Nessun file selezionato.");
        return;
    }
    document.querySelector("main.content").style.display = "flex";
    document.getElementById("overview-container").style.display="block";
    document.getElementById("mainChart").style.display="block";
    currentFileIndex = 0;
    document.getElementById("image-container").remove(); // Rimuove l'immagine di default

}
export {prova}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.file-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

document.getElementById("select-all").addEventListener("click", toggleSelectAll);
document.getElementById("process-files").addEventListener("click", processFiles);

document.addEventListener("DOMContentLoaded", () => {
    createTree(document.getElementById('file-tree'));
});
