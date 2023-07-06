/*Cloud function that lists all items in a GCS bucket
Then posts the names of the items to an incoming webhook of a chat space*/

const spaceWebhookURL = '';
const bucketName = '';

const { Storage } = require('@google-cloud/storage');
const axios = require('axios');

exports.listReportFiles = async (req, res) => {
    /*Get the name of the file received*/
    const fileRecieved = req.name;
    console.log(fileRecieved);

    /*Connect to GCS*/
    const storage = new Storage();
    /*Get all files in the bucket supplied*/
    /*const [files] = await storage.bucket(bucketName).getFiles();*/

    /*Convert the filenames to a string separated by newline characters*/
    /*const fileNamesText = files.map(file => file.name).join('\n');*/

    /*Message heading telling us the name of the file received*/
    const messageHeading = `*File Received*: ${fileRecieved}`;

    /*Combine the message heading and the names of  all the files in the bucket*/
    /*const completeMessage = messageHeading + fileNamesText;*/

    try {
        /*Post the filenames string to the space webhook. The param expected is "text"*/
        const response = await axios.post(spaceWebhookURL, {
            text: messageHeading
        });
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
};