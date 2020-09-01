//Install express server
const express = require("express");
const path = require("path");
const compression = require("compression");
const sslRedirect = require("heroku-ssl-redirect");
const cors = require("cors");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const url = require("url");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(sslRedirect());
app.use(compression());
// Serve only the static files form the dist directory

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "sa-east-1",
  bucket: process.env.AWS_BUCKET_NAME,
  useAccelerateEndpoint: true,
  // signatureVersion: "v4",
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Invalid Mime Type, only JPEG and PNG"), false);
  }
};

const upload = multer({
  fileFilter,
  //storage: multer.memoryStorage(),
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "bucket-owner-full-control",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, "media/private/" + Date.now().toString() + file.originalname);
    },
  }),
});

app.post("/api/files/upload", upload.array("files", 10), function (
  req,
  res,
  next
) {
  // file : { fieldname, originalname, name, encoding, mimetype, path, extension, size, truncated, buffer }
  /*  var result = [];
  let fileNumber = 0;
  req.files.forEach((element) => {
    console.log("PRUEBA" + "UPLOAD MULTER KEY" + element.key);
    var params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: element.key,
      Expires: 30 * 100,
    };

    //var s3 = new AWS.S3();
    result[fileNumber] = {
      signedUrl: s3.getSignedUrl("putObject", params),
      s3FileName: element.key,
    };
    console.log(result[fileNumber]);
    fileNumber++;
  }); */

  res.send(JSON.stringify(req.files));
});

app.post("/api/files/s3SignedURL", upload.array("files", 10), function (
  req,
  res
) {
  var result = [];
  let fileNumber = 0;
  req.files.forEach((element) => {
    var key = "media/private/" + Date.now().toString() + element.originalname;
    console.log("key" + key);
    var params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Expires: 30 * 100,
      ContentType: "multipart/form-data;boundary=..",
    };

    result[fileNumber] = {
      signedUrl: s3.getSignedUrl("putObject", params),
      s3FileName: key,
    };
    console.log(result[fileNumber]);
    fileNumber++;

    //result.add({  });
    //keys.push(key);
  });

  res.send(result);
});

app.put("/api/files/uploadfileAWSS3", function (req, res) {
  var result = [];
  let fileNumber = 0;
  console.log(req);
  req.files.forEach((element) => {
    var key = "media/private/" + Date.now().toString() + element.originalname;
    console.log("key" + key);
    var params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Expires: 30 * 100,
      ContentType: "multipart/form-data;boundary=..",
    };

    result[fileNumber] = {
      signedUrl: s3.getSignedUrl("putObject", params),
      s3FileName: key,
    };
    console.log(result[fileNumber]);
    fileNumber++;

    //result.add({  });
    //keys.push(key);
  });

  res.send(result);
});
//app.use('/', router);
//router(app);

app.use(express.static("./dist/tupareja"));

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "/dist/tupareja/index.html"));
});

// Start the app by listening on the default Heroku port
//app.listen(process.env.PORT || 8080);
//app.listen(3000, "127.0.0.1");

const server = app.listen(process.env.PORT || 3000, function () {
  let host = server.address().address;
  let port = server.address().port;

  console.log("App listening at http://%s:%s", host, port);
});
