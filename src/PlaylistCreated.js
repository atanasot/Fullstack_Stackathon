import React from "react";

const PlaylistCreated = ({playlistId}) => {
  return <h1><a href={`https://open.spotify.com/playlist/${playlistId}`}>Checkout your new playlist on your Spotify App!</a></h1>;
};

export default PlaylistCreated;
