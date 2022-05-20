const port = process.env.PORT || 8888;
const app = require("./app")

const start = () => {
    app.listen(port, () => console.log(`listening on port ${port}`));
  };
  
start();

