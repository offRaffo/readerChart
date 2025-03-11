const imageNames = [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg",
    "image4.jpg"
];

const repoUrl = "https://raw.githubusercontent.com/offRaffo/readerChart/main/images/";
const container = document.getElementById("image-container");

let images = [];

// Aggiungi le immagini al contenitore
imageNames.forEach(image => {
    const img = document.createElement("img");
    img.src = repoUrl + image;
    img.alt = image;
    img.classList.add("image-slide", "hidden"); // Nascondi tutte le immagini inizialmente
    container.appendChild(img);
    images.push(img);
});

let currentIndex = 1;

// Mostra la prima immagine subito e logga
images[currentIndex].classList.remove("hidden");

// Funzione per cambiare le immagini
function changeImage() {
    images[currentIndex].classList.add("hidden"); // Nasconde l'immagine corrente
    currentIndex = (currentIndex + 1) % images.length; // Passa all'immagine successiva
    images[currentIndex].classList.remove("hidden"); // Mostra la nuova immagine
}

// Avvia il ciclo dello slideshow dopo che la prima immagine è visibile
setTimeout(() => {
    setInterval(changeImage, 3000);
}, 1000); // Attendi 1 secondo prima di avviare il ciclo per assicurarti che la prima immagine sia visibile
