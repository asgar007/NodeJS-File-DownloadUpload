const stream = require("stream");
const express = require("express");
const multer = require("multer");
const path = require("path");
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");
const { file } = require("googleapis/build/src/apis/file");
const axios = require('axios');

const uploadRouter = express.Router();
const upload = multer();

const KEYFILEPATH = path.join(__dirname, "apiKey.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});


const uploadFile = async (fileObject) =>{
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);
    const { data } = await google.drive({ version:"v3", auth:auth }).files.create({
        media:{
            mimeType:fileObject.mimeType,
            body: bufferStream
        },
        requestBody:{
            name: fileObject.originalname,
            parents: ['19mTv-A_xSLQ7F9Byk7BGqF49tLtJtXXC']
        },
        fields:"id,name"
    })
    console.log(`uploaded file ${data.name} ${data.id}`);
}

uploadRouter.post('/upload', upload.any(), async (req, res)=>{
    try{
        const { body, files } = req
        for(let f=0; f<files.length; f++){
            await uploadFile(files[f]);
        }
        console.log(body);
        res.status(200).send("Form Submitted")
    }
    catch(error){
        res.send(error.message)
    }
})

uploadRouter.get('/download/avatar', async (req, res) => {
    try {
        const folderId = '1e7mym0jd29wCKn7Ny_d_bvoR6GH0Nu3m';
        const fileName = 'avatar.jpg';

        const response = await google.drive({ version: 'v3', auth: auth }).files.list({
            q: `'${folderId}' in parents and name = '${fileName}'`,
            fields: 'files(id, name)',
        });

        if (response.data.files.length === 0) {
            res.status(404).send('Avatar file not found.');
            return;
        }

        const fileId = response.data.files[0].id;

        const fileResponse = await google.drive({ version: 'v3', auth: auth }).files.get({
            fileId: fileId,
            alt: 'media'
        }, { responseType: 'stream' });
     


        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        // res.setHeader('Content-Type', fileResponse.data.mimeType);

        fileResponse.data
            .on('end', () => {
                console.log('Avatar file downloaded successfully.');
            })
            .on('error', (err) => {
                console.error('Error downloading avatar file.', err);
                res.status(500).send('Error downloading avatar file.');
            })
            .pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading avatar file.');
    }
});


uploadRouter.post('/download/avatar/upload', async (req, res) => {
    try {
        const folderId = '1e7mym0jd29wCKn7Ny_d_bvoR6GH0Nu3m';
        const fileName = 'avatar.jpg';

        // Download file from Google Drive
        const response = await google.drive({ version: 'v3', auth: auth }).files.list({
            q: `'${folderId}' in parents and name = '${fileName}'`,
            fields: 'files(id, name)',
        });

        if (response.data.files.length === 0) {
            res.status(404).send('Avatar file not found.');
            return;
        }

        const fileId = response.data.files[0].id;
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

        // Initiate download and upload processes
        const downloadStream = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream',
        });

        
        const bufferStream = new stream.PassThrough();
        const uploadStream = await google.drive({ version: 'v3', auth: auth }).files.create({
            media: {
                // mimeType: 'image/jpeg', 
                body: bufferStream,
            },
            requestBody: {
                name: fileName,
                parents: ['19mTv-A_xSLQ7F9Byk7BGqF49tLtJtXXC'], 
            },
            fields: 'id, name',
        });

        downloadStream.data.pipe(bufferStream).pipe(uploadStream.data);

        res.status(200).send('Download and Upload initiated successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error initiating Download and Upload process.');
    }
});


module.exports = uploadRouter