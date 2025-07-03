import { plotData } from '../channelsfunctions/channel1.js';

export class FileManager {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.filesQueue = [];
        this.currentFileIndex = 0;
        this.cycleFiles = true; // Flag per abilitare/disabilitare il ciclo
    }

    async explore(path = "/") {
        try {
            const response = await fetch(`${this.baseUrl}/ftp/explore?path=${path}`);
            if (!response.ok) throw new Error("Errore nella richiesta FTP.");
            return await response.json();
        } catch (error) {
            console.error("Errore nel recupero delle cartelle FTP:", error);
            return { folders: [], files: [] };
        }
    }

    async loadFilesFromFTP(path = "/") {
        const { files } = await this.explore(path);
        this.filesQueue = files.map(file => `${path}/${file}`);
        console.log(this.filesQueue)
        this.currentFileIndex = 0;
        return files;
    }

    async getCurrentFileData() {
        const name_files=await this.loadFilesFromFTP();
        if (!this.cycleFiles) {
            console.log("----------------- Ciclo dei file disabilitato ----------------");
            return;
        }

        if (this.currentFileIndex >= this.filesQueue.length) {
            alert("Hai visualizzato tutti i file.");
            this.currentFileIndex = 0; // Resetta l'indice opzionalmente
            return;
        }

        document.querySelector('.loader-container').style.display = 'flex';

        const filePath = this.filesQueue[this.currentFileIndex];

        try {
            const response = await fetch(`${this.baseUrl}/ftp/data?file=${filePath}`);
            if (!response.ok) throw new Error("Errore nel caricamento dei dati.");
            const buffer = await response.arrayBuffer();
            const path = "/"
            const find = await fetch(`http://sbnv01.itaca.upv.es:3000/ftp/data?file=${path}/${name_files[0]}`);
            const data = await find.json();
            plotData(data);
            document.getElementById("filename").innerText =
                `${this.currentFileIndex + 1}/${this.filesQueue.length} ${filePath.split('/').pop()}`;
        } catch (error) {
            console.error("Errore nella lettura del file:", error);
        }

        document.querySelector('.loader-container').style.display = 'none';
    }

}
