import React, { Component } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import axios from "axios";
import Question from "./Question";
import PlaylistCreated from "./PlaylistCreated";

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      me: {},
      city: "",
      events: [],
      loading: true,
      displayMessages: false,
      displayCreated: false,
      playlistId: "",
    };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.createPlaylist = this.createPlaylist.bind(this);
    this.displayLoadingPlaylist = this.displayLoadingPlaylist.bind(this);
    this.displayPlaylistCreated = this.displayPlaylistCreated.bind(this);
  }
  onChange(ev) {
    const change = {};
    change[ev.target.name] = ev.target.value;
    this.setState(change);
  }

  async onSubmit(ev) {
    try {
      this.displayPlaylistCreated(false);
      ev.preventDefault();
      const city = this.state.city;
      const events = (await axios.get(`/events?city=${city}`)).data;
      this.setState({
        events,
        city,
      });
    } catch (err) {
      console.log(err);
    }
  }

  displayLoadingPlaylist(value) {
    this.setState({
      displayMessages: value,
    });
  }

  displayPlaylistCreated(value) {
    this.setState({
      displayCreated: value,
    });
  }

  async createPlaylist() {
    this.displayLoadingPlaylist(true);
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(this.props.access_token);
    const playlistResponse = await spotifyApi.createPlaylist(
      `Concerts in ${this.state.city}`,
      {
        description:
          "This playlist was created based on the artists playing in town!",
        public: true,
      }
    );
    const playlistId = playlistResponse.body.id;
    this.setState({
      playlistId,
    });
    let tracks = [];
    let seenArtistIds = {};
    for (let i = 0; i < this.state.events.length; i++) {
      const event = this.state.events[i];
      const artistResponse = await spotifyApi.searchArtists(event.artist);
      if (
        !(
          artistResponse.statusCode === 200 &&
          artistResponse.body.artists.items &&
          artistResponse.body.artists.items.length > 0 &&
          !seenArtistIds[artistResponse.body.artists.items[0].id]
        )
      ) {
        continue;
      }
      seenArtistIds[artistResponse.body.artists.items[0].id] = true;
      const tracksResponse = await spotifyApi.getArtistTopTracks(
        artistResponse.body.artists.items[0].id,
        "US"
      );
      if (
        !(
          tracksResponse.statusCode === 200 &&
          tracksResponse.body.tracks &&
          tracksResponse.body.tracks.length > 0
        )
      ) {
        continue;
      }
      tracks = tracks.concat(tracksResponse.body.tracks.slice(0, 2));
    }
    const trackUris = tracks.reduce((acc, track) => {
      acc.push(track.uri);
      return acc;
    }, []);
    await spotifyApi.addTracksToPlaylist(playlistId, trackUris.slice(0, 100));
    this.displayLoadingPlaylist(false);
    this.displayPlaylistCreated(true);
  }

  async componentDidMount() {
    try {
      const spotifyApi = new SpotifyWebApi();
      spotifyApi.setAccessToken(this.props.access_token);
      const me = await spotifyApi.getMe();
      this.setState({
        me,
        loading: false,
      });
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    if (this.state.loading) return <h2>Loading...</h2>;

    const { city, events, displayMessages, displayCreated, playlistId } =
      this.state;
    const username = this.state.me.body.display_name;
    const { onChange, onSubmit, createPlaylist } = this;
    return (
      <div>
        <h1>
          Hello <a id="username">{username}</a>
        </h1>
        <form onSubmit={onSubmit}>
          <input type="text" name="city" value={city} onChange={onChange} />
          <button disabled={!city}>Enter City</button>
        </form>
        {events.length ? <h2>Check out these concerts in town!</h2> : ""}
        <ul>
          {!events.length
            ? []
            : events.map((event, idx) => <li key={idx}>{event.artist}</li>)}
        </ul>
        <button
          onClick={createPlaylist}
          disabled={!this.state.city}
          id="playlist-button"
        >
          Create Playlist
        </button>
        {displayMessages ? <Question /> : null}
        {displayCreated ? <PlaylistCreated playlistId={playlistId} /> : null}
      </div>
    );
  }
}

export default Dashboard;
