let quiz = [];
let quizFiltre = [];
let toutesLesReponses = [];
let index = 0;
let score = 0;
let peutValider = true;
let categorieChoisie = "toutes";

// Pour la navigation dans l'autocomplétion
let indexSelection = -1;

// Flag pour savoir si c'est le quiz du jour
let quizDuJour = false;

/* ===== CHARGEMENT JSON ===== */
fetch("especes.json")
    .then(response => response.json())
    .then(data => {
        quiz = data;

        // uniquement vernaculaire + scientifique, sans doublons
        toutesLesReponses = [
            ...new Set(
                quiz.flatMap(e => e.reponses.slice(0, 2))
            )
        ];
    });

/* ===== OUTILS ===== */
function melanger(tab) {
    for (let i = tab.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tab[i], tab[j]] = [tab[j], tab[i]];
    }
}

function normaliser(texte) {
    return texte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[-'’]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/* ===== QUIZ ===== */
function demarrerAvecCategorie(cat) {
    categorieChoisie = cat;
    quizDuJour = false; // on réinitialise le flag
    document.getElementById("choixCategorie").style.display = "none";
    document.getElementById("quiz").style.display = "block";
    demarrerQuiz();
}

function demarrerQuiz() {
    quizFiltre = categorieChoisie === "toutes"
        ? [...quiz]
        : quiz.filter(e => e.categorie === categorieChoisie);

    melanger(quizFiltre);
    index = 0;
    score = 0;
    document.getElementById("score").textContent = score;
    document.getElementById("finQuiz").style.display = "none";
    afficherQuestion();
}

function afficherQuestion() {
    document.getElementById("photo").src = quizFiltre[index].image;
    document.getElementById("reponse").value = "";
    document.getElementById("reponse").disabled = false;
    document.getElementById("message").textContent = "";
    document.getElementById("suggestions").innerHTML = "";
    indexSelection = -1;
    document.getElementById("valider").style.display = "inline";
    document.getElementById("suivant").style.display = "none";
    document.getElementById("reponse").focus();
    peutValider = true;
}

function verifier() {
    if (!peutValider) return;
    peutValider = false;

    const saisie = normaliser(document.getElementById("reponse").value);
    const bonnesReponses = quizFiltre[index].reponses.map(normaliser);

    if (bonnesReponses.includes(saisie) && saisie !== "") {
        score++;
        document.getElementById("score").textContent = score;
        document.getElementById("message").textContent = "✔️ Bonne réponse";
        passerQuestion();
    } else {
        document.getElementById("message").textContent =
            "❌ Mauvaise réponse. Réponse correcte : " + quizFiltre[index].reponses[0];

        document.getElementById("reponse").disabled = true;
        document.getElementById("valider").style.display = "none";
        document.getElementById("suivant").style.display = "inline";
    }
}

function passerQuestion() {
    index++;
    if (index < quizFiltre.length) {
        afficherQuestion();
    } else {
        document.getElementById("message").textContent =
            `Quiz terminé 🎉 — Score : ${score} / ${quizFiltre.length}`;
        document.getElementById("valider").style.display = "none";
        document.getElementById("suivant").style.display = "none";

        // afficher finQuiz seulement si ce n'est pas le quiz du jour
        if (!quizDuJour) {
            document.getElementById("finQuiz").style.display = "block";
        }
    }
}

function suivant() { passerQuestion(); }
function rejouerCategorie() { 
    if (!quizDuJour) demarrerQuiz(); // impossible de rejouer le quiz du jour
}
function retourMenu() {
    document.getElementById("quiz").style.display = "none";
    document.getElementById("choixCategorie").style.display = "block";
}

/* ===== QUIZ DU JOUR ===== */
function demarrerQuizDuJour() {
    if (quiz.length === 0) return;

    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    const jour = maintenant.getDate();
    const midi = maintenant.getHours() >= 12;

    const cleIndex = `quizDuJour_${annee}-${mois}-${jour}_${midi ? "pm" : "am"}`;
    const cleFait = `quizDuJour_${annee}-${mois}-${jour}_${midi ? "pm" : "am"}_fait`;

    // Déjà joué ?
    if (localStorage.getItem(cleFait)) {
        document.getElementById("choixCategorie").style.display = "none";
        document.getElementById("quiz").style.display = "block";
        document.getElementById("message").textContent =
            "⛔ Tu as déjà fait le quiz du jour pour ce créneau. Reviens plus tard !";
        document.getElementById("valider").style.display = "none";
        document.getElementById("suivant").style.display = "none";
        document.getElementById("suggestions").innerHTML = "";
        return;
    }

    // Calcul d'une espèce fixe pour ce créneau
    let indexJour = localStorage.getItem(cleIndex);
    if (!indexJour) {
        indexJour = ((annee + mois + jour + (midi ? 1 : 0)) % quiz.length);
        localStorage.setItem(cleIndex, indexJour);
    } else {
        indexJour = parseInt(indexJour, 10);
    }

    quizFiltre = [quiz[indexJour]];
    index = 0;
    score = 0;
    quizDuJour = true;

    document.getElementById("choixCategorie").style.display = "none";
    document.getElementById("quiz").style.display = "block";
    document.getElementById("finQuiz").style.display = "none";
    document.getElementById("score").textContent = score;

    afficherQuestion();

    // Marquer comme joué
    localStorage.setItem(cleFait, "true");
}

/* ===== AUTOCOMPLÉTION ===== */
function afficherSuggestions(texte) {
    const box = document.getElementById("suggestions");
    box.innerHTML = "";
    indexSelection = -1;

    if (texte.length < 3) return;

    const t = normaliser(texte);

    const suggestions = toutesLesReponses
        .filter(n => normaliser(n).startsWith(t))
        .slice(0, 8);

    suggestions.forEach((nom, i) => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.textContent = nom;
        div.onclick = () => {
            document.getElementById("reponse").value = nom;
            box.innerHTML = "";
            indexSelection = -1;
        };
        box.appendChild(div);
    });
}

function updateSelection(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].style.backgroundColor = i === indexSelection ? "#b2ebf2" : "";
    }
}

/* ===== EVENTS ===== */
const reponseInput = document.getElementById("reponse");

reponseInput.addEventListener("input", e => {
    afficherSuggestions(e.target.value);
});

reponseInput.addEventListener("keydown", e => {
    const box = document.getElementById("suggestions");
    const items = box.getElementsByClassName("suggestion");

    if (items.length === 0) {
        if (e.key === "Enter") verifier();
        return;
    }

    if (e.key === "ArrowDown") {
        e.preventDefault();
        indexSelection = (indexSelection + 1) % items.length;
        updateSelection(items);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        indexSelection = (indexSelection - 1 + items.length) % items.length;
        updateSelection(items);
    } else if (e.key === "Enter") {
        if (indexSelection >= 0 && indexSelection < items.length) {
            e.preventDefault();
            items[indexSelection].click();
        } else {
            verifier();
        }
    }
});
