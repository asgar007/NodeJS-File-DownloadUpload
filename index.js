const express = require('express');
const { google } = require('googleapis');
const { authenticate, uploadVideo, monitorProgress } = require('./controllers/file_handllers');
const app = express();
app.use(express.json());
const uploadRouter = require('./router');

// app.post('/api/authenticate', authenticate);
// app.post('/api/upload', uploadVideo);
// app.get('/api/progress/:taskId', monitorProgress);
app.get('/', (req, res)=>{
  res.sendFile(__dirname + "/index.html")
})

app.use(express.urlencoded({ extended: true }))
app.use(uploadRouter);
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});