var http 				= require('http');
var express 			= require('express');
var app 				= express();
// Lecture de l'URL
var url                 = require('url');
var path                = require('path');
// Lecture de formulaire
var bodyParser 			= require("body-parser");
var urlencodedParser 	= bodyParser.urlencoded({extended : false});
// Sert le favicon
var favicon 			= require('serve-favicon');
// Ecriture de logs
var winston				= require('winston');
// // Gestion de cookie
var cookieParser		= require('cookie-parser');
var cookie              = require('cookie');

var myDefaultColor		= "#C2C1C1";
var myDefaultColorText	= "#FFFFFF";

var myTabConnectes		= [];

var dtSuppressionCookie = new Date();

// Valeur d'un cookie qui n'expire pas : On définit une années
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


// Fonction qui retourne la valeur du login du tableau tabLogin: Cette valeur correspond à l'host utilisé lors de l'enregistrement du login dans le tableau
function myGetHost(searchParametre) {
    for(login in tabLogin) {
        if(searchParametre.trim() == login.trim()) {
            return tabLogin[login];
        }
    }
    return -1;
}


function ajoutInfosUrl(name, req) {
	return (name + '_' +  req.headers.host.split(':').join(''));
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
	// Lors de l'appel de la page d'accueil, on récupère le cookie login
	utilisateur = req.cookies[ajoutInfosUrl('login', req)];
	if (utilisateur) {
		// Si le cookie login n'existe pas dans le tableau des logins, cad le nom de login n'est pas utilisé -> Login permis et enregistrement du login dans le tableau des logins
		if (! Object.keys(tabLogin).includes(utilisateur)) {
			myLogin = utilisateur;
			var urlStr = 'http://' + req.headers.host + req.url;
			// Un tableau de login est un tableau associatif où le login est associé à l'url
			tabLogin[myLogin] = url.parse(urlStr).host;
			logger.log({
				level: 'info',
				message: "Nouveau login reçu : " + myLogin
			});
		} else {
			var urlStr = 'http://' + req.headers.host + req.url;
			// Si le login du cookie est trouvé dans le tableau des logins en cours on vérifie si il est associé à l'url en cours d'utilisation : Permet d'avoir un tableau de login par url:port
			if (myGetHost(utilisateur) != url.parse(urlStr).host) {
				// Si il n'est pas associé à l'url courante dans le tableau des logins : on redirige vers la page de login
				myLogin = null;
			} else {
				// Si il appartient à la session courante on redéfinit le login 
				myLogin = utilisateur;
			}
		}
	} else {
		// Si le cookie login n'existe pas on redirige vers la page des logins.
		myLogin = null;
	}
	//Suppression de parametre de cookie	: res.clearCookie('login');
	//Création de paramètre de cookie 		: res.cookie('couleur', couleur, {maxAge: 9000000, httpOnly: true});
	// console.log('Cookies : ', req.cookies);
	// console.log('Signed Cookie : ', req.signedCookies);
	// res.cookie('ville', 'lille');
	couleur = req.cookies[ajoutInfosUrl('couleur', req)];
	couleurTexte = req.cookies[ajoutInfosUrl('couleurTexte', req)];
	if(! couleur){
		couleur = myDefaultColor;
	}
	if (! couleurTexte) {
		couleurTexte = myDefaultColorText;
	}
	res.render('index.ejs', {
			login: myLogin, 
			tabLogin: Object.keys(tabLogin), 
			nombreDePostesConnectes: Object.keys(tabLogin).length, 
			message: messageAdmin, 
			couleur: couleur, 
			couleurTexte: couleurTexte,
			admin: req.session.admin
		}
	);
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
    if (Object.keys(tabLogin).includes(req.body.login.toLowerCase()) || (req.body.login.toLowerCase().substr(0,5) == 'admin')) {
		messageAdmin = 'Le login ' + req.body.login + " est déjà utilisé";
    } else {
		var loginTmp;
		// Selon le login utilisé on enregistre en variable de session si l'utilisateur est l'admin ou pas : Permet d'ajouter des info dans la page html
		if (req.body.login == myLoginAdmin) {
			req.session.admin = true;
			loginTmp = 'Admin';
			// Cookie du compte Admin: Expire à la fin de la session
			res.cookie('login_' + req.headers.host.split(':').join(''), loginTmp);
		} else {
			req.session.admin = false;
			loginTmp = req.body.login.toLowerCase();
			nomCookieLogin = 'login_' + req.headers.host.split(':').join('');
			// Cookie utilisateur : Sans date d'expiration
			res.cookie(nomCookieLogin, loginTmp, {expires: dtNoExpirationCookie}); 
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
    function appelConnectes() {
        myTabConnectes = [];
		socket.emit('appelConnectes');
        socket.broadcast.emit('appelConnectes');
        return 0;
    }
    function actualisationListeDesConnectes() {
        // On demande aux navigateurs connectés de se signaler
        appelConnectes();
        // Aprés un temps d'attente, pour permettre à tous les navigateurs de répondre, on actualise la liste des personnes connectés
        setTimeout(function() {
            socket.emit('listeUtilisateurs', myTabConnectes, myTabConnectes.length);
            socket.broadcast.emit('listeUtilisateurs', myTabConnectes, myTabConnectes.length);
        }, 1000);
    }



	// ! login si la page est affichée après la relance du serveur
	if(! myLogin) {
		socket.emit('refresh');
	} else {
		// Si le nombre de connectés différe du nombre sauvegardé en mémoire de programme, c'est qu'un nouvel utilisateur est arrivé (ce n'est pas un rafraichissement de page)
		// Cela indique également que le bug deconnexion avant connexion lors de rafraichissement à eu lieu. Il faut donc actualiser la liste des utilisateurs du tableau tabLogin
		// On enregistre le login dans une variable de session (de type socket.session) pour retrouver le login de la session lors de la demande de logout
		socket.handshake.session.login = myLogin;
		socket.emit('messageAdmin', 'Bienvenu sur le tchat ' + socket.handshake.session.login, 'Admin');
		socket.broadcast.emit('messageAdmin', socket.handshake.session.login + " s'est connecté", 'Admin');

		actualisationListeDesConnectes();
       	myLogin = null;
	}




 	socket.on('estConnecte', function(login) {
		if(! myTabConnectes.includes(login)) {
			myTabConnectes.push(login);
		}
	});

    socket.on('message', function(message, login, typeEmoticons){
        if (myTabBannis.includes(login)) {
            socket.emit('messageAdmin', 'Vous avez été banni');
        } else {
            socket.emit('message', capitalize(message), login, typeEmoticons);
            socket.broadcast.emit('message', capitalize(message), login, typeEmoticons);
        }
    });

    socket.on('messagePersonnel', function(message, login, utilisateur, typeEmoticons) {
        if (myTabBannis.includes(login)) {
            socket.emit('messageAdmin', 'Vous avez été banni');
        } else {
            socket.emit('message', '( à ' + utilisateur + ' ) ' + capitalize(message), login, typeEmoticons);
            socket.broadcast.emit(utilisateur, '( privé ) ' + capitalize(message), login, typeEmoticons);
        }
    });

	// Fonction de déconnexion socket : appelée automatiquement à la fermeture du navigateur et parfois lors des rafraichissement de la page
    socket.on('disconnect', function() {
		if (socket.handshake.session.login) {
			actualisationListeDesConnectes();
           	socket.broadcast.emit('messageAdmin', socket.handshake.session.login + " s'est déconnecté");
           	logger.log({
           	    level: 'info',
           	    message: "Déconnexion de l'utilisateur " + socket.handshake.session.login
           	});
		}
    });

	// Fonction appelée lors de la demande de déconnexion
	socket.on('logout',  function(login){
        mySupprimeLogin(login);
        socket.broadcast.emit('messageAdmin', login + " s'est déconnecté");
		socket.broadcast.emit('listeUtilisateurs', Object.keys(tabLogin), Object.keys(tabLogin).length);
		logger.log({
			level: 'info',
			message: "Déconnexion de l'utilisateur " + login
		});
    });

    socket.on('bannir', function(utilisateur) {
        myTabBannis.push(utilisateur);
    });

});

server.listen(6969);


