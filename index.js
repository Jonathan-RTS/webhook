const express = require('express');
const bodyParser = require('body-parser');
const simpleGit = require('simple-git');
const { exec } = require('child_process');
const fs = require('fs');

// Paramètres de configuration
const PORT = 9000;
const REPO_PATH = 'C:\\Users\\admindsi\\webhook\\index.js';
const BRANCH = 'main';

if (!fs.existsSync(REPO_PATH)) {
    console.error(`Le chemin du dépôt local n'existe pas: ${REPO_PATH}`);
}
// Initialisation du serveur Express
const app = express();
app.use(bodyParser.json());

// Endpoint pour le webhook qui sera déclenché par GitHub lorsqu'un push est effectué
app.post('/webhook', (req, res) => {

    const body = req.body;

    // On vérifie qu'il s'agit bien d'un push sur la branche spécifiée
    if (body.ref === `refs/heads/${BRANCH}`) {
        console.log(`Changement détecté sur la branche ${BRANCH}. Début du processus de mise à jour...`);

        // Initialisation de simple-git pour le dépôt local
        const git = simpleGit(REPO_PATH);

        // Pull de la dernière version du code
        git.pull('origin', BRANCH, (err, update) => {
            if (err) {
                console.error('Echec lors du pull de la branch', err);
                return res.status(500).send('Internal Server Error');
            }

            if (update && update.summary.changes) {
                console.log('Code mis à jour. Exécution de la commande de build...');

                // Run your build command (adjust as necessary)
                exec('npm install && npm run build', { cwd: REPO_PATH }, (buildErr, stdout, stderr) => {
                    if (buildErr) {
                        console.error('echec du build:', buildErr);
                        console.error(stderr);
                        return res.status(500).send('Internal Server Error');
                    }
                    console.log('Build terminé avec succes:', stdout);
                    res.status(200).send('webhook recu et traité avec succes');
                });
            } else {
                console.log('Actualisation non nécessaire. Aucun changement détecté.');
                res.status(200).send('Actualisation non nécessaire. Aucun changement détecté.');
            }
        });
    } else {
        res.status(200).send('Push effectué sur une autre branche. Aucune action nécessaire.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`le serveur est lancé et écoute sur le port: ${PORT}`);
});
