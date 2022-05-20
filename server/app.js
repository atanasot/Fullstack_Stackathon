const express = require("express");
const app = express();
const axios = require("axios");
const path = require("path");
const querystring = require("query-string");
const request = require("request");

app.use("/dist", express.static(path.join(__dirname, "../dist")));

app.use(express.static(path.join(__dirname, "../public")));

app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res, next) => {
  try {
    res.send("heyy");
  } catch (err) {
    next(err);
  }
});

app.get("/login", function (req, res) {
  var state = Math.floor(Math.random() * 10000000000);
  var scope =
    "user-read-private user-read-email playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private user-library-modify user-library-read user-top-read user-read-playback-position user-read-recently-played user-follow-read user-follow-modify user-read-playback-state user-modify-playback-state user-read-currently-playing";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.CLIENT_ID,
        scope: scope,
        redirect_uri: process.env.CALLBACK_URI,
        state: state,
      })
  );
});

app.get("/callback", function (req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;

  if (state === null) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: process.env.CALLBACK_URI,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
          ).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        var refresh_token = body.refresh_token;

        res.redirect(
          "/?" +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            })
        );
      } else {
        res.redirect(
          "/#" +
            querystring.stringify({
              error: "invalid_token",
            })
        );
      }
    });
  }
});

//******************************** These are the routes for Ticket Master ********************************/
const ticketMasterFunc = async (city) => {
  let link = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.API_KEY}&city=${city}&radius=5&unit=miles&classificationId=KZFzniwnSyZfZ7v7nJ&daterange=all&size=100`;

  const getEvents = async () => {
    try {
      const data = (await axios.get(link)).data;
      seenArtists = {};
      let artists = data._embedded.events.reduce((acc, event) => {
        if (
          event.name &&
          event._embedded.attractions &&
          event._embedded.attractions.length > 0 &&
          event._embedded.attractions[0].externalLinks &&
          event._embedded.attractions[0].externalLinks.spotify &&
          !seenArtists[event._embedded.attractions[0].name]
        ) {
          acc.push({
            name: event.name,
            artist: event._embedded.attractions[0].name,
          });
          seenArtists[event._embedded.attractions[0].name] = true;
        }
        return acc;
      }, []);
      return artists;
    } catch (err) {
      console.log(err);
    }
  };

  return getEvents();
};

app.get("/events", async (req, res, next) => {
  try {
    let artists = await ticketMasterFunc(req.query.city);
    res.send(artists);
  } catch (err) {
    next(err);
  }
});

module.exports = app;
