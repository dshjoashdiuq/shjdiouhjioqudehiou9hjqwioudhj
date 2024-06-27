const fs = require('node:fs');
const path = require('node:path');
const express = require("express")

const app = express()
app.use(express.json())

const STORED_DATA_DIR = path.join(__dirname, 'StoredData');
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// Function to cleanup old files
const cleanupOldFiles = () => {
  try {
    const now = Date.now();
    const THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
  
    fs.readdir(STORED_DATA_DIR, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return;
      }
  
      files.forEach(file => {
        const filePath = path.join(STORED_DATA_DIR, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error('Error getting file stats:', err);
            return;
          }
  
          if (now - stats.mtimeMs > THRESHOLD) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Error deleting file:', err);
              } else {
                console.log(`Deleted old file: ${filePath}`);
              }
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
};

const startCleanupSchedule = () => {
  try {
    cleanupOldFiles(); 
    setInterval(cleanupOldFiles, CLEANUP_INTERVAL)
  } catch (error) {
    console.error('Error starting cleanup schedule:', error);
  }
};

app.get('/', (request, response) => {
  response.send('Hello World!')
})

app.post('/saveData', (request, response) => {
  try {
    const data = request.body;
    data.timestamp = Date.now()
    const filePath = path.join(__dirname, 'StoredData', `${data.Key}.json`);
  
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('Error writing file:', err);
        response.status(500).send('Internal Server Error');
      } else {
        console.log(`Data saved to ${filePath}`);
        response.send('Data saved successfully');
      }
    });
  } catch (error) {
    console.error('Error starting cleanup schedule:', error);
  }
})

app.post('/hasData', (request, response) =>{
  try {
    const data = request.body;
    const filePath = path.join(__dirname, 'StoredData', `${data.Key}.json`);
  
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log(`No data found for key: ${data.Key}`);
        response.send('No Data');
      } else {
        console.log(`Data found for key: ${data.Key}`);
        response.send('Data Found');
      }
    });
  }
})

app.post('/getData', (request, response) => {
  try {
    const data = request.body
    const filePath = path.join(__dirname, 'StoredData', `${data.Key}.json`)
    
    if (filePath) {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading file:', err)
          response.status(500).send('Internal Server Error')
        } else {
          const jsonData = JSON.parse(data)
          response.send(jsonData.Data)
          console.log(`Data send: ${filePath}`)
          
          fs.unlink(filePath, (deleteErr) => {
            if (deleteErr) {
              console.error('Error deleting file:', deleteErr)
            } else {
              console.log('File deleted successfully:', filePath)
            }
          })
        }
      })
    } else {
      response.status(404).send('Data not found');
    }
  } catch (error) {
    console.error('Error starting cleanup schedule:', error);
  }
})


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  startCleanupSchedule()
})