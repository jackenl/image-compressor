const express = require('express');

const PORT = 3000 || process.PORT;

const app = new express();

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`The App is listening here: http://localhost:${PORT}`);
});
