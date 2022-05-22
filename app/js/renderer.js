// modules
const { ipcRenderer } = require('electron')
const AdmZip = require("adm-zip");
const fs = require('fs');

// global functions
function e(id) {
    return document.getElementById(id);
}

function applyFileSize(file) {
    fs.stat(file, (err, stats) => {
        if (err) {
            // rien
        } else {
            let size = stats.size;
            let fkb = size / 1000;

            e("fSize").innerHTML = " – " + fkb.toFixed(1) + " KB";
        }
    });
}

let openedURL;

// open preview image
function openPreviewImg(url) {
    e("previewImg").src = url;
}

let fnm;
let fex;

// open vsg file
ipcRenderer.on('FILE_OPEN', (event, args) => {
    openFile(args)
})

ipcRenderer.on('FILE_ARG', (event, args) => {
    openFile(args)
})

let currentZip;
let currentVSG = [];

let firstExt;

let openedFile;

function openFile(args) {
    openedFile = args;
    readZipArchive(args)

    fnm = args.split("\\")[args.split("\\").length - 1];
    fex = fnm.split(".")[args.split(".").length - 1];
    applyFileSize(args);

    e("fileName").innerHTML = fnm;
    e("fData").innerHTML = fex.toUpperCase() + " file";
}

async function readZipArchive(filepath) {
    try {
        currentZip = new AdmZip(filepath);
        for (const zipEntry of currentZip.getEntries()) {
            currentVSG.push(zipEntry);
        }

        let firstName = currentVSG[0].name;
        firstExt = currentVSG[0].name.split(".")[currentVSG[0].name.split(".").length - 1]

        openedURL = firstName;

        let firstData = currentZip.readFile(firstName);
        let base64Val = Buffer.from(firstData).toString('base64');
        let source = `data:image/svg+xml;base64,${base64Val}`

        openPreviewImg(source)

        getVSGStructure(currentVSG);

    } catch (e) {
        alert(`Something went wrong. ${e}`);
    }
}

let keys = [];
let values = [];

function getVSGStructure(vsg) {
    for(let fileID in vsg) {
        let file = vsg[fileID];
        let fname = file.name;

        let eachPart = fname.split(",");

        for (let part in eachPart) {
            let key = eachPart[part].split("=")[0].split(".")[0].trim();

            if(!keys.includes(key)) {
                keys.push(key)

                let ed = [];
                values.push(ed)
            }
        }

        for (let part in eachPart) {
            let value = eachPart[part].split("=")[1].split(".")[0].trim();

            if(!values[part].includes(value)) {
                values[part].push(value)
            }
        }
    }

    console.log(values);

    for(let key in keys) {
        e("vars").innerHTML+= `
            <div class="variant">
                <p class="native">${keys[key]}</p>
                <select class="native" onchange="change()" id="select_${key}">
                </select>
            </div>
        `
    }

    for(let key in values) {
        for(let vr in values[key]) {
            e("select_"+key).innerHTML+= `
                <option value="${values[key][vr]}">${values[key][vr]}</option>
            `
        }
    }
}

function change(a) {
    let fileN = "";

    for(let key in keys) {
        let nam = keys[key];
        let val = e("select_"+key).options[e("select_"+key).selectedIndex].value;

        fileN += `${nam}=${val}, `
    }

    let finalN = fileN.slice(0, -2) + "." + firstExt;

    let firstData = currentZip.readFile(finalN);
    let base64Val = Buffer.from(firstData).toString('base64');
    let source = `data:image/svg+xml;base64,${base64Val}`

    openPreviewImg(source)
}

const random = (length = 8) => {
    return Math.random().toString(16).substr(2, length);
};

function exporta() {
    ipcRenderer.send("EXPORT", fnm.split(".")[0] + "_" + random(6) + "." + firstExt)
}

ipcRenderer.on('EXPORT_PATH', (event, args) => {
    console.log(args)

    let path = args.split("\\");
    path.pop();
    path = path.join('\\');

    let fname = args.split("\\")[args.split("\\").length - 1]
    console.log(fname)

    let fl = openedURL;
    currentZip.extractEntryTo(fl, path, false, true, false, fname);
})