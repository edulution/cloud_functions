function saveNewAttachmentsToDrive() {
  var folderId = "FOLDER_ID"; // ID of the destination folder in Google Drive
  var searchQuery = "to:REPLACE_WITH_RECEIVER_EMAIL from:REPLACE_WITH_SENDER_EMAIL has:attachment"; // Search query to find emails with attachments
  var lastExecutionTime = getLastExecutionDate();
  var threads = GmailApp.search(searchQuery + " after:" + lastExecutionTime);
  var driveFolder = DriveApp.getFolderById(folderId);
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      var attachments = message.getAttachments();
      for (var k = 0; k < attachments.length; k++) {
        var attachment = attachments[k];
        var attachmentBlob = attachment.copyBlob();

        var fileName =  attachment.getName();

        // Check if the attachment is a pdf, xls, or xlsx file
        if (fileName.toLowerCase().endsWith(".pdf") ||
            fileName.toLowerCase().endsWith(".xls") ||
            fileName.toLowerCase().endsWith(".xlsx")) {

            // Get current timestamp of the current session running the script*/
            var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmss");

            var fileNameWithTimestamp =  timestamp + "_" + attachment.getName();
            driveFolder.createFile(attachmentBlob).setName(fileName);
            console.log("Created file: " + fileNameWithTimestamp + " on Google Drive" )

          }
        
      }
    }
  }
  updateLastExecutionDate();
}

function getLastExecutionDate() {
  var properties = PropertiesService.getUserProperties();
  return properties.getProperty("lastExecutionDate") || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function resetLastExecutionDate() {
  PropertiesService.getUserProperties().deleteProperty("lastExecutionDate");
}

function updateLastExecutionDate() {
  var now = new Date();
  var dateString = now.toISOString().split("T")[0];
  var properties = PropertiesService.getUserProperties();
  properties.setProperty("lastExecutionDate", dateString);
}