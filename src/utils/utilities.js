const fs = require('fs');
const path = require("path");

const getFilePaths = (dir) => {
  const filePaths = [];

  const getPaths = (dir) => {
    fs.readdirSync(dir).forEach((name) => {
      const filePath = path.join(dir, name);

      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        filePaths.push(filePath);
      } else if (stat.isDirectory()) {
        getPaths(filePath);
      }
    });
  }

  getPaths(dir);
  return filePaths;
};

const getContentType = (extension) => {
  let imageExtensions = ["gif", "png", "jpeg"]
  let textExtensions = ["css", "html"];
  
  if (imageExtensions.includes(extension)) {
    return `image/${extension}`
  } else if (textExtensions.includes(extension)) {
    return `text/${extension}`
  }
}

// const createWaitingRoomPoller = async (stagePollingUrl) => {
// setInterval(async () => {
//   const URL = `https://zehv5d8rcc.execute-api.us-east-2.amazonaws.com/sealbuzz-production/polling`;
//   let response = await fetch(URL, {
//     credentials: "include"
//   });

//   let json = await response.json();

//   if (json.allow) {
//     let origin = json.origin;
//     window.location.href = origin;
//   }

// }, 5000);

//   try {

//   } catch (err) {

//   }
// }


module.exports = {
  getFilePaths,
  getContentType
}