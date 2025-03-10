const app = require('./app');
require('dotenv').config();

const hostname = process.env.HOSTNAME || '127.0.0.1';
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});