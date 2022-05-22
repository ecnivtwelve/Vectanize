const { app, BrowserWindow, Menu, MenuItem, dialog, ipcMain, shell} = require('electron')
const path = require('path')

let win;
let splash;

function createWindow () {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Vectanize',
        icon: 'build/icon.png',
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    win.loadFile('./app/index.html')

    splash = new BrowserWindow({
        width: 500,
        height: 300,
        transparent: true,
        icon: 'build/icon.png',
        title: 'Vectanize',
        frame: false,
        alwaysOnTop: true
    });

    splash.loadFile('./app/splash.html');
    splash.center();
}

const template = [
    {
        label: 'Vectanize',
        submenu: [
            {
                label: 'Open',
                accelerator: 'CmdOrCtrl+O',
                click() {
                    // construct the select file dialog
                    dialog.showOpenDialog({
                        title: "Open a Vectanize file",
                        properties: ['openFile'],
                        filters: [
                            { name: 'Vectanize Archives', extensions: ['vsg', 'zip'] },
                            { name: 'All Files', extensions: ['*'] }
                        ]
                    })
                        .then(function(fileObj) {
                            // the fileObj has two props
                            if (!fileObj.canceled) {
                                let paths = fileObj.filePaths
                                win.webContents.send('FILE_OPEN', paths[0])
                            }
                        })
                        // should always handle the error yourself, later Electron release might crash if you don't
                        .catch(function(err) {
                            console.error(err)
                        })
                }
            }
        ]
    },
    {
        label: 'About',
        submenu: [
            {
                label: 'Visit GitHub',
                click() {
                    shell.openExternal("https://github.com/ecnivtwelve/Vectanize")
                }
            },
            {
                label: 'made by ecnivtwelve',
                enabled : false
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

ipcMain.on('EXPORT', (event, arg) => {
    dialog.showSaveDialog({
        title: "Open a Vectanize file",
        defaultPath: arg,
        buttonLabel: "Export"
    })
        .then(function(fileObj) {
            // the fileObj has two props
            if (!fileObj.canceled) {
                let paths = fileObj.filePath
                win.webContents.send('EXPORT_PATH', paths)
            }
        })
        // should always handle the error yourself, later Electron release might crash if you don't
        .catch(function(err) {
            console.error(err)
        })
})

app.whenReady().then(() => {
    createWindow()

    win.on('ready-to-show', () => {
        setTimeout(function () {
            splash.close();
            win.show();
        }, 1000);
    })

    if(process.argv.length >= 2) {
        let filePath = process.argv[1];
        win.webContents.send('FILE_ARG', filePath)
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})