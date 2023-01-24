const room_webhook_url = '';
const bucketName = '';


const {Storage} = require('@google-cloud/storage');
const axios = require('axios');

exports.listBucketItems = async (req, res) => {

    const storage = new Storage();
    const [files] = await storage.bucket(bucketName).getFiles();

    const fileNamesArr = files.map(file => file.name).join('\n');

    try {
        const response = await axios.post(room_webhook_url, {
            text: fileNamesText
        });
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
};
