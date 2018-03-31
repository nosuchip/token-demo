const Express = require('express');
const BodyParser = require('body-parser');
const Path = require('path');

const Config = require('./server/config');

var app = Express();

app.disable('x-powered-by');

app.use(BodyParser.urlencoded({ extended: false }));
app.use(BodyParser.json());
app.use(BodyParser.text());

app.use(Express.static(Path.join(__dirname, 'public')));

// Routes
// app.use('/api/wallet', WalletRouter);

app.listen(Config.port)
console.log('Server running on the port ' + Config.port);
