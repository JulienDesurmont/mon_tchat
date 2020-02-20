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


var dtSuppressionCookie = new Date();

// Valeur d'un cookie qui n'expire pas : On définie une années
// On multiplie par 1000 car le Time est exprimé en milliseconde
var dtNoExpirationCookie = new Date();
dtNoExpirationCookie.setTime(dtNoExpirationCookie.getTime() + (3600 * 24 * 365 * 1000));


// Gestion de session && de session sur socket
var session = require('express-session') ({
	secret: "2DedcKgr@Tg567hezvfri-TGrfqs",
	resave: true,
	saveUninitialized: true,
	cookie: {
		expires: dtNoExpirationCookie,
		httpOnly: false
	}
});
var sessionSockets = require("express-socket.io-session");

var server  = http.createServer(app);
var io      = require("socket.io").listen(server);


var myLogin;
var tabLogin = [];
var myLoginAdmin = 'L@scslsdc59';
var myTabBannis = [];

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


function myGetCookie(jsonCookies, searchParametre) {
	var tabCookies = jsonCookies.split(';');
	for (index in tabCookies) {
		var tabParametre = tabCookies[index].split('=');
		if (searchParametre.trim() == tabParametre[0].trim()) {
			return tabParametre[1].trim();
		} 
	}
	return null;
}


function mySupprimeLogin(loginASupprimer) {
    delete(tabLogin[loginASupprimer]);
}

function myIndexOf(searchParametre) {
	var index = 1;
    for(login in tabLogin) {
		if(searchParametre.trim() == login.trim()) {
			return index;
		}
		index ++;
    }
	return -1;
}

function myConnectSid(searchParametre) {
    for(login in tabLogin) {
        if(searchParametre.trim() == login.trim()) {
            return tabLogin[login];
        }
    }
    return -1;
}




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
	// Permet de détecter les redemarrages serveur
	if (! req.session.view) {
		req.session.view = 1;
	}
	/*
	} else {
		req.session.view ++;
	}
	/*console.log('nb de connexion : ' + req.session.view);*/
	utilisateur = req.cookies['login'];
	if (utilisateur) {
		// Si le cookie existe mais que le login est déjà utilisé on supprime le cookie (on definit expires a 'maintenant')
		if (! Object.keys(tabLogin).includes(utilisateur)) {
			myLogin = utilisateur;
			tabLogin[myLogin] = req.cookies['connect.sid'];
			//console.log('include avec acceuil');
			logger.log({
				level: 'info',
				message: "Nouveau login reçu : " + myLogin
			});
		} else {
			// Si le login est trouvé dans le tableau des logins en cours on vérifie qu'il apparatien à une autre session
			if (myConnectSid(utilisateur).substr(-10) != req.cookies['connect.sid'].trim().substr(-10)) {
				//console.log(myConnectSid(utilisateur).substr(-10) + ' != '+ req.cookies['connect.sid'].substr(-10));
				messageAdmin = 'Le précédent login utilisé : ' + utilisateur + " est déjà en cours d'utilisation";
			} else {
				// Si il appartient à la session courante on redefini le login 
				myLogin = utilisateur;
			}
		}
	} else {
		myLogin = null;
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
	res.render('index.ejs', {login: myLogin, tabLogin: Object.keys(tabLogin), nombreDePostesConnectes: Object.keys(tabLogin).length, message: messageAdmin, couleur: couleur, admin: req.session.admin});
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
	// Connexion depuis le formulaire de connexion
    if (Object.keys(tabLogin).includes(req.body.login.toLowerCase())) {
		messageAdmin = 'Le login ' + req.body.login + " est déjà en cours d'utilisation";
    } else {
		var loginTmp;
		// Selon le login utilisé on enregistre en variable de session si l'utilisateur est l'admin ou pas : Permet d'ajouter des info dans la page html
		if (req.body.login == myLoginAdmin) {
			req.session.admin = true;
			loginTmp = 'Admin';
			// Cookie du compte Admin: Expire à la fin de la session
			res.cookie('login', loginTmp, {httpOnly: true});
		} else {
			req.session.admin = false;
			loginTmp = req.body.login.toLowerCase();
			// Cookie utilisateur : Sans date d'expiration
			res.cookie('login', loginTmp, {expires: dtNoExpirationCookie});
		}
		logger.log({
			level: 'info',
			message: "Nouveau login reçu : " + loginTmp
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
	// ! login si la page est affichée après la relance du serveur
	if(! myLogin) {
		socket.emit('refresh');
	} else {
		//console.log(myGetCookie(socket.handshake.headers.cookie, 'connect.sid'));
		
		// Si la variable de session socket 'login' n'est pas définie on va l'enregistrer
		socket.handshake.session.login = myLogin;
		socket.emit('messageAdmin', 'Bienvenu sur le chat ' + socket.handshake.session.login, 'Admin');
		socket.broadcast.emit('messageAdmin', socket.handshake.session.login + " s'est connecté", 'Admin');
		// On recherche dans les clés du tableau tabLogin le parametre de nom 'login' et on vérifie son connect.sid
		if (! Object.keys(tabLogin).includes(myLogin)) {
			//console.log('include avec socket');
			tabLogin[myLogin] = myGetCookie(socket.handshake.headers.cookie, 'connect.sid');
		}
		socket.emit('listeUtilisateurs', Object.keys(tabLogin), Object.keys(tabLogin).length);
		socket.broadcast.emit('listeUtilisateurs', Object.keys(tabLogin), Object.keys(tabLogin).length);
        myLogin = null;
	}

    socket.on('message', function(message, login){
        if (myTabBannis.includes(login)) {
            socket.emit('messageAdmin', 'Vous avez été banni');
        } else {
            socket.emit('message', capitalize(message), login);
            socket.broadcast.emit('message', capitalize(message), login);
        }
    });

    socket.on('messagePersonnel', function(message, login, utilisateur) {
        if (myTabBannis.includes(login)) {
            socket.emit('messageAdmin', 'Vous avez été banni');
        } else {
            socket.emit('message', '( à ' + utilisateur + ' ) ' + capitalize(message), login);
            socket.broadcast.emit(utilisateur, '( privé ) ' + capitalize(message), login);
        }
    });

    socket.on('disconnect', function(){
        //console.log('disconnect');
		if (socket.handshake.session.login) {
         	mySupprimeLogin(socket.handshake.session.login);
           	socket.broadcast.emit('messageAdmin', socket.handshake.session.login + " s'est déconnecté");
           	socket.broadcast.emit('listeUtilisateurs', Object.keys(tabLogin), Object.keys(tabLogin).length);
           	logger.log({
           	    level: 'info',
           	    message: "Déconnexion de l'utilisateur " + socket.handshake.session.login
           	});
		}
    });

    socket.on('bannir', function(utilisateur) {
        myTabBannis.push(utilisateur);
    });

});

server.listen(6969);


