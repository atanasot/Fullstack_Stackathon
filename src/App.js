import React, { Component } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

const access_token = new URLSearchParams(window.location.search).get(
  "access_token"
);

class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return access_token ? <Dashboard access_token={access_token} /> : <Login />;
  }
}

export default App;
