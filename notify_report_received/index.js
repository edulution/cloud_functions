/*Cloud function that notifies when a file is received in a GCS bucket
Then posts the names of the file to an incoming webhook of a chat space*/

const spaceWebhookURL = process.env.TECH_NOTIFICATIONS_SPACE_WEBHOOK_URL;
const bucketName = process.env.REPORTS_BUCKET_NAME;

const axios = require('axios');

exports.notifyFileReceived = async (req, res) => {
    /*Get the name of the file received*/
    const fileRecieved = req.name;
    /*Log the name of the file received*/
    console.log(fileRecieved);

    /*Message heading telling us the name of the file received*/
    const notificationMessage = `*File Received*: ${fileRecieved}`;

    try {
        /*Post the notification message string to the space webhook URL. The param expected is "text"*/
        const response = await axios.post(spaceWebhookURL, {
            text: notificationMessage
        });
        /*Log the response data*/
        console.log(response.data);
    } catch (error) {
        /*Log any errors*/
        console.error(error);
    }
};