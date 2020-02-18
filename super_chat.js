var http 				= require('http');
var express 			= require('express');
var app 				= express();
// Lecture de formulaire
var bodyParser 			= require("body-parser");
var urlencodedParser 	= bodyParser.urlencoded({extended : false});
// Sert le favicon
var favicon 			= require('serve-favicon');
// Lecture de l'URL
var url 				= require('url'); 
var path 				= require('path');
// Ecriture de logs
var winston				= require('winston');
// // Gestion de cookie
var cookieParser		= require('cookie-parser');
var cookie              = require('cookie');
// Gestion de session && de session sur socket
var session = require('express-session') ({
	secret: "2DedcKgr@Tg567hezvfri-TGrfqs",
	resave: true,
	saveUninitialized: true,
	cookie: {httpOnly: true}
});
var sessionSockets = require("express-socket.io-session");

var server  = http.createServer(app);
var io      = require("socket.io").listen(server);


var login;
var tabLogin = [];
var nombreDePostesConnectes = 0;



var capitalize = function(str1){
  return str1.charAt(0).toUpperCase() + str1.slice(1);
}



const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
	    winston.format.timestamp({
	      format: 'DD-MM-YYYY HH:mm:ss'
	    }),
	    winston.format.json()
	),
	defaultMeta: { service: 'user-service' },
	transports: [
		new winston.transports.File({filename: 'errors.log', level: 'error'}),
		new winston.transports.File({filename: 'chat.log', level: 'info'})
	]
});

var messageAdmin = '';
var tabAllLogins = [];


app.use(session)
.use(express.static(path.join(__dirname, '/public')))
.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
.use(cookieParser())
.set("view engine", "ejs")
.set("views", "./views")
.get('/', function(req, res) {
	res.redirect('/accueil');
})
.get('/accueil', function(req, res) {
	utilisateur = req.cookies['login'];
	if(utilisateur){
		login = utilisateur;
		logger.log({
			level: 'info',
			message: "Nouveau login reçu : " + login
		});
	}
	//Suppression de parametre de cookie	: res.clearCookie('login');
	//Creation de parametre de cookie 		: res.cookie('couleur', couleur, {maxAge: 9000000, httpOnly: true});
	// console.log('Cookies : ', req.cookies);
	// console.log('Signed Cookie : ', req.signedCookies);
	// res.cookie('ville', 'lille');
	couleur = req.cookies['couleur'];
	if(! couleur){
		couleur = "C2C1C1";
	}
	res.render('index.ejs', {login: login, tabLogin: tabLogin, nombreDePostesConnectes: tabLogin.length, message: messageAdmin, couleur: couleur});
	messageAdmin = '';
})
.get('/message/:titre', function(req, res){
	logger.log({
		level: 'info',
		message: "Reception du message : " + req.params.titre
	});
	res.redirect('/accueil');
})
.post('/define/login', urlencodedParser, function(req, res) {
    if (tabLogin.includes(req.body.login)) {
		messageAdmin = 'Le login ' + req.body.login + ' est déjà utilisé';
    } else {
		login = req.body.login;
		res.cookie('login', login, {maxAge: 9000000, httpOnly: true});
		logger.log({
			level: 'info',
			message: "Nouveau login reçu : " + login
		});
	}
	res.redirect('/accueil');
})
.use(function(req, res, next){
	logger.log({
		level: 'error',
		message: "Chemin inconnu demandé : " + url.parse(req.url).pathname
	});
	res.setHeader('Content-Type', 'text/plain');
	res.status('404').send('Page introuvable');
});


io.use(sessionSockets(session));
io.sockets.on('connection', function(socket) {
	// ! login si la page est affiché après la relance du serveur
	if(! login) {
		socket.emit('refresh');
	} else {
		// Si la variable de session socket 'login' n'est pas définie on va l'enregistrer
		if (! socket.handshake.session.login) {
			socket.handshake.session.login = login;
			if (! tabLogin.includes(login)) {
				nombreDePostesConnectes += 1;
				tabLogin.push(login);
				//console.log('Connexion de '+ socket.handshake.session.login + "( " + nombreDePostesConnectes +  " poste connecte)");
				login = null;
				socket.emit('message', 'Bienvenu sur le chat ' + socket.handshake.session.login, 'Admin');
				socket.broadcast.emit('messageAdmin', socket.handshake.session.login + " s'est connecté", 'Admin');
				socket.emit('listeUtilisateurs', tabLogin, nombreDePostesConnectes);
				socket.broadcast.emit('listeUtilisateurs', tabLogin, nombreDePostesConnectes);
			} 
			// var cookies = cookie.parse(socket.handshake.headers.cookie);
		}
		tabAllLogins.push(socket.handshake.session.login);

		socket.on('message', function(message, login){
			socket.emit('message', capitalize(message), login);
			socket.broadcast.emit('message', capitalize(message), login);
		});

		socket.on('messagePersonnel', function(message, login, membre) {
			socket.emit('message', '( à ' + membre + ' ) ' + capitalize(message), login); 
			socket.broadcast.emit(membre, '( privé ) ' + capitalize(message), login);
		});

		socket.on('disconnect', function(){
			var indexInAllUser = tabAllLogins.indexOf(socket.handshake.session.login);
			if (indexInAllUser != -1) {
				tabAllLogins.splice(indexInAllUser, 1);
			} 
			indexInAllUser = tabAllLogins.indexOf(socket.handshake.session.login);
			if (indexInAllUser == -1) {
				var indexUser = tabLogin.indexOf(socket.handshake.session.login);
				logger.log({
					level: 'info',
					message: "Déconnexion de l'utilisateur " + socket.handshake.session.login
				});
				//console.log('deconnexion de ' + socket.handshake.session.login);
				nombreDePostesConnectes -= 1;
				tabLogin.splice(indexUser, 1);
				socket.broadcast.emit('messageAdmin', socket.handshake.session.login + " s'est déconnecté");
				socket.broadcast.emit('listeUtilisateurs', tabLogin, nombreDePostesConnectes);
			}
		});
	}
});

server.listen(8088);


