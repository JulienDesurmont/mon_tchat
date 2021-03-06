var myPortServeur       = '6969';
var myPrive            	= true;
//Duree de la session privé = durée de validité du cookie autorisation 
var myDureeSessionPrive	= 3600 * 24 * 1000;		// 1 journée
// Durée d'un cookie illimité : Définit à une année
var myDureeIllimite		= 3600 * 24 * 365 * 1000;
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
var myPrivateNumber		= 24;
var myLogin;
var tabLogin 			= [];
var myLoginAdmin 		= 'L@scslsdc59';
var myTabBannis 		= [];

function defineDateExpiration(parametre) {
    var dtExpiration = new Date();
    switch(parametre) {
        case 'autorisation' :
			// On multiplie par 1000 car le Time est exprimé en milliseconde
            dtExpiration.setTime(dtExpiration.getTime() + myDureeSessionPrive);
			break;
        case 'no-expire' :
			// Valeur d'un cookie qui n'expire pas : On définit une année
            dtExpiration.setTime(dtExpiration.getTime() + myDureeIllimite);
			break;
		case 'has-expired' :
			dtExpiration.setTime(dtExpiration.getTime() - myDureeSessionPrive)
			break;
    }
    return dtExpiration;
}


function generateID() 
{
	return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
}


// Gestion de session && de session sur socket
var session = require('express-session') ({
	secret: "2DedcKgr@Tg567hezvfri-TGrfqs",
	resave: true,
	saveUninitialized: true,
	cookie: {
		expires: defineDateExpiration('no-expire'),
		httpOnly: false
	}
});
var sessionSockets = require("express-socket.io-session");
var server  = http.createServer(app);
var io      = require("socket.io").listen(server);

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
	delete(myTabConnectes[loginASupprimer]);
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

function nouveauConnecte(login, id) {
	myTabConnectes[login] = id;
}


// ----------------------------------------------------------------------------------------------------------
// Création du cookie secure : Autorisation d'accès au tchat
function creerCookieAutorisation(req, res) {
	res.cookie(ajoutInfosUrl('autorisation', req), true, {expires: defineDateExpiration('autorisation')});
	return res;
}
function isAutoriser(req) {
	if (req.cookies[ajoutInfosUrl('autorisation', req)])
		return true;
	else 
		return false;
}


// Un mot de passe par jour.
function motDePasseSecurise(affichage) {
	var laDate = new Date();
	if (affichage) 
		console.log('Passe actuel :  ' + Math.trunc((laDate.getDate() + laDate.getMonth() + 1) * laDate.getFullYear() / myPortServeur.substring(3)));
	return (Math.trunc((laDate.getDate() + laDate.getMonth() + 1) * laDate.getFullYear() / myPortServeur.substring(3)));
}
// On affiche le mot de passe au démarrage de l'application
if (myPrive) 
	motDePasseSecurise(true);



// On recherche dans le tableau des personnes connectés sur le login de l'utilisateur en cours de connexion y est présent 
// SI le login est présent mais que l'identifucation de  l'utilisateur diffère c'est qu'un autre utilisateur est en ligne avec le login 
function isLoginUsed(login, id) {
	if(Object.keys(myTabConnectes).includes(login)) 
		if (myTabConnectes[login] != id) 
			return true;
	return false;
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
	var motDePasseNecessaire;
	if ((myPrive == true) && (! isAutoriser(req)))
	{
		messageAdmin = "Tchat privé : Mot de passe nécessaire";
		motDePasseNecessaire = true;
	} else {
		motDePasseNecessaire = false;
	}
	// Permet de détecter les redémarrages serveur
	if (! req.session.view) {
		req.session.view = 1;
	}

	// Lors de l'appel de la page d'accueil, on récupère le cookie login
	utilisateur = req.cookies[ajoutInfosUrl('login', req)];
	if (utilisateur) {
		if (isLoginUsed(utilisateur, req.cookies[ajoutInfosUrl('identification', req)])) 
		{
            messageAdmin = 'Le login ' + utilisateur + " est en ligne";
			// Si le login est déjà utilisé par une personne en ligne, on supprime le cookie login et le cookie identification
			res.cookie(ajoutInfosUrl('login', req), utilisateur, {expires: defineDateExpiration('has-expired')});
			res.cookie(ajoutInfosUrl('identification', req), utilisateur, {expires: defineDateExpiration('has-expired')});
			myLogin = null;
		} else {
			if (motDePasseNecessaire == true) {
				myLogin = null;
    		} else {
				// Si le cookie login n'existe pas dans le tableau des logins, cad le nom de login n'est pas utilisé -> Login permis et enregistrement du login dans le tableau des logins
				if (! Object.keys(tabLogin).includes(utilisateur)) {
					myLogin = utilisateur;
					var urlStr = 'http://' + req.headers.host + req.url;
					// Un tableau de login est un tableau associatif où le login est associé à l'url
					tabLogin[myLogin] = url.parse(urlStr).host;
					logger.log({
						level: 'info',
						message: "Connexion de " + myLogin
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
			admin: req.session.admin,
			tchatPrive: myPrive,
			dureeSessionPrivee: myDureeSessionPrive,
			motDePasseNecessaire: motDePasseNecessaire
		}
	);
	messageAdmin = '';
})

.get('/message/:titre', function(req, res){
	logger.log({
		level: 'info',
		message: "Deconnexion de " + req.params.titre
	});
	res.redirect('/accueil');
})

.post('/define/login', urlencodedParser, function(req, res) {
	if ( (myPrive == true) && (! isAutoriser(req)) ){
		if (req.body.login != motDePasseSecurise(false)) 
			messageAdmin = "Tchat privé : Mot de passe nécessaire";
		else
			res = creerCookieAutorisation(req, res);
	} else {
		// Connexion depuis le formulaire de connexion
	    if (Object.keys(tabLogin).includes(req.body.login.toLowerCase()) || (req.body.login.toLowerCase().substr(0,5) == 'admin')) {
			messageAdmin = 'Le login ' + req.body.login + " est déjà utilisé";
	    } else {
			var loginTmp;
			var id = generateID();
			// Selon le login utilisé on enregistre en variable de session si l'utilisateur est l'admin ou pas : Permet d'ajouter des infos dans la page html
			if (req.body.login == myLoginAdmin) {
				req.session.admin = true;
				loginTmp = 'Admin';
				// Cookie du compte Admin: Expire à la fin de la session
				res.cookie(ajoutInfosUrl('login', req), loginTmp);
				res.cookie(ajoutInfosUrl('identification', req), id);
			} else {
				req.session.admin = false;
				loginTmp = req.body.login.toLowerCase();
				// Cookie utilisateur : Sans date d'expiration
				res.cookie(ajoutInfosUrl('login', req), loginTmp, {expires: defineDateExpiration('no-expire')}); 
				res.cookie(ajoutInfosUrl('identification', req), id, {expires: defineDateExpiration('no-expire')});
			}
			// Enregistrement de l'utlisateru dans le tableau des membre connectés au tchat
			nouveauConnecte(loginTmp, id);
			logger.log({
				level: 'info',
				message: "Nouveau login reçu : " + loginTmp
			});
		}
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


// *********************************************************************************************************************** //

//												Partie gestion des sockets

// *********************************************************************************************************************** //

io.use(sessionSockets(session));

io.sockets.on('connection', function(socket) {

	// Pour raffraichir la listes des memnbre connecté au tchat on vide le tableau des connectés
    function actualisationListeDesConnectes() {
        // On demande aux navigateurs connectés de se signaler
		myTabConnectes = [];
		socket.emit('appelConnectes');
		socket.broadcast.emit('appelConnectes');
        // Aprés un temps d'attente, pour permettre à tous les navigateurs de répondre, on actualise la liste des personnes connectés
        setTimeout(function() {
           socket.emit('listeUtilisateurs', Object.keys(myTabConnectes).sort(), Object.keys(myTabConnectes).length);
            socket.broadcast.emit('listeUtilisateurs', Object.keys(myTabConnectes).sort(), Object.keys(myTabConnectes).length);
        }, 500);
    }
	// On actualise la liste des connectés à chaque connexion socket
    actualisationListeDesConnectes();

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
		// Le compte admin doit se rafraichir pour récupérer la nouvelle table tabLogin
		socket.broadcast.emit('admin', 'please do refresh', 'Admin');
       	myLogin = null;
	}




 	socket.on('estConnecte', function(login, id) {
		if (! Object.keys(myTabConnectes).includes(login)) 
			nouveauConnecte(login, id);
	});

    socket.on('message', function(message, login, typeEmoticons){
        if (myTabBannis.includes(login)) {
            socket.emit('messageAdmin', 'Vous avez été banni');
        } else {
            socket.emit('message', message, login, typeEmoticons);
            socket.broadcast.emit('message', message, login, typeEmoticons);
        }
    });

    socket.on('messagePersonnel', function(message, login, utilisateur, typeEmoticons) {
        if (myTabBannis.includes(login)) {
            socket.emit('messageAdmin', 'Vous avez été banni');
        } else {
            socket.emit('message', '( à ' + utilisateur + ' ) ' + message, login, typeEmoticons);
            socket.broadcast.emit(utilisateur, '( privé ) ' + message, login, typeEmoticons);
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
		socket.broadcast.emit('listeUtilisateurs', Object.keys(myTabConnectes).sort(), Object.keys(myTabConnectes).length);
		logger.log({
			level: 'info',
			message: "Déconnexion de l'utilisateur " + login
		});
		// On raffraichi la page de l'administrateur pour qu'il réinitialise sa liste des utilisateurs du tchat
		socket.broadcast.emit('admin', 'please do refresh', 'Admin');
    });

    socket.on('bannir', function(utilisateur) {
        myTabBannis.push(utilisateur);
    });

	socket.on('removeFromChat', function(user, login, typeEmoticons) {
		mySupprimeLogin(user);		
		message = "L'utilisateur " + user + " a été retiré des membres du tchat";
		// Seul l'administrateur peut envoyer cet évènement donc login = 'Admin'
		socket.emit('messageInfo', message);
		socket.emit('refresh');
	});

});

server.listen(myPortServeur);


