/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const { ipcRenderer } = require('electron')
const { Status } = require('minecraft-java-core')
const fs = require('fs');
const pkg = require('../package.json');
const { Client } = require('discord-rpc');
const rpc = new Client({ transport: 'ipc' });
const clientId = '1193220212082880552';

import config from './utils/config.js';
import database from './utils/database.js';
import logger from './utils/logger.js';
import popup from './utils/popup.js';
import { skin2D } from './utils/skin.js';
import slider from './utils/slider.js';

async function setBackground(theme) {
    if (typeof theme == 'undefined') {
        let databaseLauncher = new database();
        let configClient = await databaseLauncher.readData('configClient');
        theme = configClient?.launcher_config?.theme || "auto"
        theme = await ipcRenderer.invoke('is-dark-theme', theme).then(res => res)
    }
    let body = document.body;
    body.className = theme ? 'dark global' : 'light global';

    // Définir les styles pour les thèmes sombre et clair
    const darkTheme = {
        backgroundColor: 'hsla(213,26%,40%,1)',
        backgroundImage: `
            radial-gradient(at 73% 81%, hsla(230,20%,22%,1) 0px, transparent 50%),
            radial-gradient(at 10% 13%, hsla(230,20%,22%,1) 0px, transparent 50%)
        `
    };

    const lightTheme = {
        backgroundColor: 'hsla(32,55%,75%,1)',
        backgroundImage: `
            radial-gradient(at 73% 81%, hsla(30,28%,60%,1) 0px, transparent 50%),
            radial-gradient(at 10% 13%, hsla(30,45%,82%,1) 0px, transparent 50%)
        `
    };

    const currentTheme = theme ? darkTheme : lightTheme;

    // Appliquer le style directement sur le body
    body.style.backgroundColor = currentTheme.backgroundColor;
    body.style.backgroundImage = currentTheme.backgroundImage;
    body.style.backgroundSize = '200% 200%';
    body.style.animation = 'gradient 13s ease infinite';

    // Ajouter l'animation keyframes si elle n'existe pas déjà
    if (!document.querySelector('#gradientAnimation')) {
        const style = document.createElement('style');
        style.id = 'gradientAnimation';
        style.textContent = `
            @keyframes gradient {
                0% { background-position: 0% 20%; }
                25% { background-position: 100% 50%; }
                50% { background-position: 50% 70%; }
                100% { background-position: 0% 20%; }
            }
        `;
        document.head.appendChild(style);
    }
}

async function changePanel(id) {
    let panel = document.querySelector(`.${id}`);
    let active = document.querySelector(`.active`)
    if (active) active.classList.toggle("active");
    panel.classList.add("active");
}

async function appdata() {
    return await ipcRenderer.invoke('appData').then(path => path)
}

async function addAccount(data) {
    let skin = false
    if (data?.profile?.skins[0]?.base64) skin = await new skin2D().creatHeadTexture(data.profile.skins[0].base64);
    let div = document.createElement("div");
    div.classList.add("account");
    div.id = data.ID;
    div.innerHTML = `
        <div class="profile-image" ${skin ? 'style="background-image: url(' + skin + ');"' : ''}></div>
        <div class="profile-infos">
            <div class="profile-pseudo">${data.name}</div>
            <div class="profile-uuid">${data.uuid}</div>
        </div>
        <div class="delete-profile" id="${data.ID}">
            <div class="icon-account-delete delete-profile-icon"></div>
        </div>
    `
    return document.querySelector('.accounts-list').appendChild(div);
}

async function accountSelect(data) {
    let account = document.getElementById(`${data.ID}`);
    let activeAccount = document.querySelector('.account-select')

    if (activeAccount) activeAccount.classList.toggle('account-select');
    account.classList.add('account-select');
    if (data?.profile?.skins[0]?.base64) headplayer(data.profile.skins[0].base64);
}

async function headplayer(skinBase64) {
    let skin = await new skin2D().creatHeadTexture(skinBase64);
    document.querySelector(".player-head").style.backgroundImage = `url(${skin})`;
}

async function setStatus(opt) {
    let nameServerElement = document.querySelector('.server-status-name')
    let statusServerElement = document.querySelector('.server-status-text')
    let playersOnline = document.querySelector('.status-player-count .player-count')

    if (!opt) {
        statusServerElement.classList.add('red')
        statusServerElement.innerHTML = `Ferme - 0 ms`
        document.querySelector('.status-player-count').classList.add('red')
        playersOnline.innerHTML = '0'
        return
    }

    let { ip, port, nameServer } = opt
    nameServerElement.innerHTML = nameServer
    let status = new Status(ip, port);
    let statusServer = await status.getStatus().then(res => res).catch(err => err);

    if (!statusServer.error) {
        statusServerElement.classList.remove('red')
        document.querySelector('.status-player-count').classList.remove('red')
        statusServerElement.innerHTML = `En ligne - ${statusServer.ms} ms`
        playersOnline.innerHTML = statusServer.playersConnect
    } else {
        statusServerElement.classList.add('red')
        statusServerElement.innerHTML = `Ferme - 0 ms`
        document.querySelector('.status-player-count').classList.add('red')
        playersOnline.innerHTML = '0'
    }
}

async function setRichPresence() {
    try {
        await rpc.login({ clientId });
        rpc.setActivity({
            details: 'Beyond the Horizon',
            state: 'Bienvenue sur le launcher',
            startTimestamp: new Date(),
            largeImageKey: 'icon',
            largeImageText: 'EpicExplorers',
            smallImageKey: 'group_6',
            smallImageText: 'Launcher',
            buttons: [
                { label: 'Site Web', url: 'https://epicexplorers.fr' },
                { label: 'Télécharger le launcher', url: 'https://epicexplorers.fr/telecharger' }
            ]
        });
    } catch (error) {
        console.error('Erreur lors de la configuration du Rich Presence:', error);
    }
}


export {
    appdata as appdata,
    changePanel as changePanel,
    config as config,
    database as database,
    logger as logger,
    popup as popup,
    setBackground as setBackground,
    skin2D as skin2D,
    addAccount as addAccount,
    accountSelect as accountSelect,
    slider as Slider,
    pkg as pkg,
    setStatus as setStatus,
    setRichPresence as setRichPresence
}