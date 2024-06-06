const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');

const amqplib = require('amqplib');

const cloudinary = require('cloudinary').v2;
const fs = require("fs");
const activeWin = require('magic-active-win');

let trackingInterval;
let mainWindow;

let screenshotInterval;
let i = 1;
let id;
function createLoginWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
  

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
     
    },
  });

  
  mainWindow.loadFile('login.html');



}

function createDashboardWindow() {
  mainWindow.loadFile('dashboard.html');





}

app.on('ready', createLoginWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoginWindow();
  }
});

ipcMain.on('login-success', () => {

  createDashboardWindow();
});

ipcMain.on('start-tracking', (event) => {
  trackingInterval = setInterval(async () => {
    const winDetails = await activeWin();
    event.sender.send('update-active-window', winDetails);
  }, 1000);
});

ipcMain.on('stop-tracking', () => {
  clearInterval(trackingInterval);
});

ipcMain.on('reset-tracking', (event) => {
  clearInterval(trackingInterval);
  event.sender.send('reset-active-window');
});


ipcMain.handle('start-screenshot', () => {
  startScreenshot();
});

ipcMain.handle('stop-screenshot', () => {
  stopScreenshot();
});


ipcMain.on('save-username', (event, username) => {
  console.log("idhar hae " ,username)
  id=username;


  //const filePath = path.join(app.getPath('userData'), 'username.txt');
  fs.writeFile('username.txt', username, (err) => {
      if (err) {
          console.error('Failed to save username', err);
      } else {
          console.log('Username saved successfully');
      }
  });
});

ipcMain.handle('get-username', async () => {
 // const filePath = path.join(app.getPath('userData'), 'username.txt');
  try {
      const username = await fs.promises.readFile('username.txt', 'utf-8');
       id=username;
  } catch (err) {
      console.error('Failed to read username', err);
      return null;
  }
});

async function startScreenshot() {

  const conn = await amqplib.connect('amqps://pnobhkqa:JS0dSYi04rHRdExqdtDPNa3Qki3xHDF4@octopus.rmq3.cloudamqp.com/pnobhkqa');

  const ch1 = await conn.createChannel();
  const q=await ch1.assertQueue("jythu-screenshots");
  screenshotInterval = setInterval(async () => {
    try {
      const img = await takeScreenshot();

 



      cloudinary.config({ 
        cloud_name: "dfg4vmqky", 
        api_key: "393556989756425", 
        api_secret: "wXRnSt-3JO19b-bgMWinA8ZMnGY",
        secure: true
    });

   
    imagePath =`shot${i}.jpg`;
    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    };
   
    try {

     const result = await cloudinary.uploader.upload(imagePath, options);


const msg = {
  "id":`${id}`,
  "url":`${result.url}`,
  "filename":`${result.public_id}`,
  "time":`${new Date()}`



}

ch1.sendToQueue('jythu-screenshots', Buffer.from(JSON.stringify(msg)));
  

console.log(q)


    } catch (error) {
      console.error(error);
    }
   
      const delimagePath = path.join(__dirname, imagePath);

      // Asynchronous deletion
      fs.unlink(delimagePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`);
          
        }
        console.log(delimagePath,' File deleted successfully');
      });
      
      // OR, Synchronous deletion
      // try {
      //   fs.unlinkSync(imagePath);
      //   console.log('File deleted successfully');
      // } catch (err) {
      //   console.error(`Error deleting file: ${err.message}`);
      // }
   
      i++;
      
    } catch (err) {
      console.error('Error:', err);
    }
  }, 10000); // 120000 milliseconds = 120 seconds
}

function stopScreenshot() {
  clearInterval(screenshotInterval);
}

async function takeScreenshot() {
  try {
    const img = await screenshot({ filename: `shot${i}.jpg` });
    return img;
  } catch (err) {
    throw err;
  }
}