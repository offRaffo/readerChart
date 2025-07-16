import { FileManager } from './file-manager.js';
import { selectedValue, handleChannelSelection } from '../rawdata.js';
let filesQueue = [];
let prova = [];
const folderState = {}; // Cache per lo stato delle cartelle
const fileCache = {};   // Cache per i file caricati
let currentFileIndex = 0;
const fileManager = new FileManager("https://sbnv01.itaca.upv.es");
async function createTree(container, path = '/', depth = 0, loadRecursively = false) {
    const { folders, files } = await fileManager.explore(path);

    const ul = document.createElement('ul');

    // Processa le cartelle
    for (const folder of folders) {
        if (folder !== "Lab") {
            const li = document.createElement('li');
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            const label = document.createElement('span');
            label.textContent = folder;
            label.classList.add('folder-name');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `foldercheck-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            checkbox.classList.add('foldercheck');
            checkbox.addEventListener('change', function (e) {
                e.stopPropagation();

                const folderPath = li.dataset.path;
                const isChecked = checkbox.checked;

                // Se l'evento è stato scatenato da noi stessi, lo ignoriamo
                if (e.detail?.fromParent) {
                    return;
                }

                // Seleziona tutti i file e le sottocartelle sotto questa cartella
                selectAllUnderFolder(folderPath, isChecked, checkbox);
            });
            const checkboxLabel = document.createElement('label');
            checkboxLabel.setAttribute('for', checkbox.id);
            checkboxLabel.classList.add('custom-checkbox-label');

            summary.className = "detailsummary";
            summary.classList.add("parent-summary");
            summary.classList.add(`depth-${depth}`);

            summary.appendChild(label);
            summary.appendChild(checkbox);
            summary.appendChild(checkboxLabel);
            details.appendChild(summary);
            li.appendChild(details);
            li.dataset.path = `${path}/${folder}`;
            ul.appendChild(li);

            // Aggiungi un evento toggle per caricare i figli se non sono stati caricati
            details.addEventListener('toggle', async () => {
                const currentPath = li.dataset.path;

                if (details.open && !folderState[currentPath]) {
                    folderState[currentPath] = true;
                    await createTree(details, currentPath, depth + 1, loadRecursively); // Passa loadRecursively
                }
            });

            // Se loadRecursively è true, carica subito i figli
            if (loadRecursively) {
                folderState[li.dataset.path] = true;
                await createTree(details, li.dataset.path, depth + 1, loadRecursively);
                //details.open = true; // Espandi automaticamente
            }
        }
    }

    // Processa i file
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

    ul.classList.add(`depth-${depth}`);
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
function selectAllUnderFolder(folderPath, isChecked, parentCheckbox = null) {
    const allFiles = document.querySelectorAll('.checkfile');
    const allFolders = document.querySelectorAll('.foldercheck');

    // 1. Seleziona tutti i file che iniziano con folderPath
    allFiles.forEach(file => {
        if (file.value.startsWith(folderPath)) {
            file.checked = isChecked;
            file.dispatchEvent(new Event('change'));
        }
    });

    // 2. Seleziona tutte le sottocartelle che iniziano con folderPath
    allFolders.forEach(folder => {
        const folderLi = folder.closest('li');
        const subFolderPath = folderLi?.dataset?.path;

        if (subFolderPath && subFolderPath !== folderPath && subFolderPath.startsWith(folderPath)) {
            folder.checked = isChecked;
            folder.dispatchEvent(new CustomEvent('change', {
                detail: { fromParent: true } // <-- Flag per evitare loop
            }));
        }
    });
}
function toggleSelectAll() {
    const folderCheckboxes = document.querySelectorAll('.foldercheck');
    const fileCheckboxes = document.querySelectorAll('.checkfile');

    const allChecked = Array.from(folderCheckboxes).every(cb => cb.checked);

    const newState = !allChecked;

    // 1. Seleziona tutte le cartelle
    folderCheckboxes.forEach(cb => {
        cb.checked = newState;
        cb.dispatchEvent(new Event('change'));
    });

    // 2. Seleziona tutti i file
    fileCheckboxes.forEach(file => {
        file.checked = newState;
        file.dispatchEvent(new Event('change'));
    });
}

document.getElementById("select-all").addEventListener("click", toggleSelectAll);
document.getElementById("process-files").addEventListener("click", processFiles);

document.addEventListener("DOMContentLoaded", async () => {
    createTree(document.getElementById('file-tree'), '/', 0, true);
});
