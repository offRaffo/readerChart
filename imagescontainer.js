const imageNames = [
    "images1.jpeg",
    "images2.avif",
    "images3.jpeg",
    "images4.jpg",
    "images5.jpg"
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
    console.log(`Aggiunta immagine: ${image}`);
});

let currentIndex = 1;

// Mostra la prima immagine subito e logga
images[currentIndex].classList.remove("hidden");
console.log(`Immagine mostrata: ${imageNames[currentIndex]}`);

// Funzione per cambiare le immagini
function changeImage() {
    console.log(`Immagine cambiata: ${imageNames[currentIndex]}`);
    images[currentIndex].classList.add("hidden"); // Nasconde l'immagine corrente
    currentIndex = (currentIndex + 1) % images.length; // Passa all'immagine successiva
    images[currentIndex].classList.remove("hidden"); // Mostra la nuova immagine
}

// Avvia il ciclo dello slideshow dopo che la prima immagine è visibile
setTimeout(() => {
    console.log("Avvio slideshow...");
    setInterval(changeImage, 3000);
}, 1000); // Attendi 1 secondo prima di avviare il ciclo per assicurarti che la prima immagine sia visibile
