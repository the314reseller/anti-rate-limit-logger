const express = require("express");
const request = require("request");
const MongoClient = require("mongodb").MongoClient;

const app = express();
let successCollection;
let authCollection;

const embedColor = "INPUTHERE";
const footerName = "INPUTHERE";
const footerIcon = "INPUTHERE";
const mongoUrl = "INPUTHERE";
const webhook = "INPUTHERE";
const successDatabaseName = "INPUTHERE";
const successCollectionName = "INPUTHERE";
const authDatabaseName = "INPUTHERE";
const authCollectionName = "INPUTHERE";

MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, database) => {

    successCollection = database.db(successDatabaseName).collection(successCollectionName)
    authCollection = database.db(authDatabaseName).collection(authCollectionName)

});

app.use(express.json());

sending = false;

function sendWebhooks () {

    if(sending == true){

        successCollection.findOne({ sent: false }, async (err, item) => {

            if(item == null) sending = false;
            else {

                request({
                    url: webhook,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    json: {
                        "embeds": [
                            {
                                "title": "Successfully checked out!",
                                "description": `${item.sku}: ${item.product}`,
                                "color": embedColor,
                                "fields": [
                                    {
                                        "name": "Size:",
                                        "value": item.size,
                                        "inline": true
                                    },
                                    {
                                        "name": "Price:",
                                        "value": `$${item.price}`,
                                        "inline": true
                                    },
                                    {
                                        "name": "User:",
                                        "value": `<@${item.user}>`,
                                        "inline": true
                                    }
                                ],
                                "author": {
                                    "name": item.site
                                },
                                "footer": {
                                    "text": `${footerName} | ${item.time}`,
                                    "icon_url": footerIcon
                                },
                                "thumbnail": {
                                    "url": item.image
                                }
                            }
                        ]
                    }
                }, async (err, resp, body) => {

                    if(body == undefined){

                        successCollection.updateOne({ _id: item._id }, { "$set": { sent: true }}, async (err, newItem) => {

                            setTimeout(() => sendWebhooks(), 2000);

                        });

                    } else setTimeout(() => sendWebhooks(), 2000);
                
                });

            };

        });

    };

};

app.post("/submitwebhook", async (req, res) => {

    let authKey = req.headers.authorization;
    let json = req.body;

    authCollection.findOne({ key: authKey }, async (err, item) => {

        if(item == null) return res.end("failure");
        else {

            successCollection.insertOne({
                key: authKey,
                site: json.site,
                sku: json.sku,
                product: json.product,
                size: json.size,
                price: json.price,
                image: json.image,
                user: json.user,
                time: json.time,
                sent: false
            }, async (err, result) => {

                if(sending == false){

                    sending = true;
                    sendWebhooks();

                };

                res.end("success");

            });

        };

    });

});

app.listen(420, () => console.log("Running on port 420!"));