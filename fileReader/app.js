import { FileManager } from './file-manager.js';
import { selectedValue, handleChannelSelection } from '../rawdata.js';
let filesQueue = [];
let prova = [];
const folderState = {};
let currentFileIndex = 0;
//const fileManager = new FileManager("https://incandescent-winter-hat.glitch.me");
const fileManager = new FileManager("http://sbnv01.itaca.upv.es:3000");

async function createTree(container, path = '/') {
    const { folders, files } = await fileManager.explore(path);

    const ul = document.createElement('ul');

    folders.forEach(folder => {
        if (folder !== "Lab") {
            const li = document.createElement('li');
            const details = document.createElement('details');
            const summary = document.createElement('summary');

            summary.textContent = folder;
            summary.className = "detailsummary";
            summary.classList.add("parent-summary");

            details.appendChild(summary);
            li.appendChild(details);
            li.dataset.path = `${path}/${folder}`;
            ul.appendChild(li);

            details.addEventListener('toggle', async () => {
                const currentPath = li.dataset.path;

                if (details.open) {
                    // Aggiungi la classe opened quando si espande
                    summary.classList.add("opened");

                    // Carica contenuti solo una volta
                    if (!folderState[currentPath]) {
                        folderState[currentPath] = true;
                        await createTree(details, currentPath); // Funzione che carica file/sottocartelle
                    }
                } else {
                    // Rimuovi la classe quando si chiude
                    summary.classList.remove("opened");
                }
            });
        }
    });


    files.forEach(file => {
        const li = document.createElement('li');
        li.classList.add('file-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = `${path}/${file}`;
        checkbox.id = `checkfile-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        checkbox.classList.add('checkfile');

        const label = document.createElement('label');
        label.textContent = file;
        label.setAttribute('for', checkbox.id);

        li.appendChild(checkbox);
        li.appendChild(label);

        li.addEventListener('click', function (e) {
            if (e.target !== checkbox && e.target !== label) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        ul.appendChild(li);
    });
    container.appendChild(ul);
}
let lastChecked = null;

document.addEventListener("click", (e) => {
    if (!e.target.matches(".checkfile")) return;

    if (e.shiftKey && lastChecked) {
        const checkboxes = Array.from(document.querySelectorAll(".checkfile"));
        const start = checkboxes.indexOf(lastChecked);
        const end = checkboxes.indexOf(e.target);


        checkboxes.slice(Math.min(start, end), Math.max(start, end) + 1)
            .forEach(cb => cb.checked = lastChecked.checked);
    }

    lastChecked = e.target;
});


function getSelectedFiles() {
    const checkboxes = document.querySelectorAll('.checkfile:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

async function processFiles() {
    filesQueue = getSelectedFiles();
    prova = filesQueue;
    handleChannelSelection(selectedValue);
    if (filesQueue.length === 0) {
        alert("Nessun file selezionato.");
        return;
    }
    document.querySelector("main.content").style.display = "flex";
    document.getElementById("overview-container").style.display = "block";
    document.getElementById("mainChart").style.display = "block";
    currentFileIndex = 0;
    document.getElementById("image-container").remove(); // Rimuove l'immagine di default

}
export { prova }

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.checkfile');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

document.getElementById("select-all").addEventListener("click", toggleSelectAll);
document.getElementById("process-files").addEventListener("click", processFiles);

document.addEventListener("DOMContentLoaded", () => {
    createTree(document.getElementById('file-tree'));
});
