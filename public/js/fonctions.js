var myPortServeur = 6969;
// Dimension estimé pour passage à l'afficahge mobile : ! En cas de modification  : Modifer le css en conséquence
var myWidthMobile = 700;



var myLogin = $('#login').html().toLowerCase().trim();
var myCouleur = $('#couleur').val();
var myCouleurTexte = $('#couleurTexte').val();
var myDureeSessionPrivee = $('#textbox-login').data('duree-session');
var myPrive	= $('#textbox-login').data('is-prive');
var receptionMessage;
var myNotifications = 'false';
var myAffichageVoiture;
var myTypeEmoticons = 'smiley'
var myTypeEcran;
var myDivListeUtilisateurs;
var myDivChat;
var myChat = [];
var myTabLogin = $('#tab-login').data('tab-login').split(',');
var myMaxEntreesTab = 10;
var socket;
// Valeur d'un cookie qui n'expire pas : On définie une années
// On multiplie par 1000 car le Time est exprimé en milliseconde
var dtNoExpiration = new Date();
dtNoExpiration.setTime(dtNoExpiration.getTime() + (3600 * 24 * 365 * 1000));
// Date inférieure à la date du moment pour supprimer le cookie Autorisation 
var dtDelete = new Date();
dtDelete.setTime(dtDelete.getTime() - 20 * 1000);


myDivListeUtilisateurs = $($('#div-liste-utilisateurs'));
myDivChat = $($('#chat'));

// Mise en forme mobile lors de la connexion
if (document.body.clientWidth < myWidthMobile) 
{
	myTypeEcran = 'mobile';
	$('#section-2').html(myDivListeUtilisateurs);
	$('#sous-section-3').html(myDivChat);
	$('#envoi-socket-message').val('\u2713');
	$('#option-activation-notifications').html('Notifications');
	$('#option-reset-chat').html('Réinitialiser');
	$('#spn-deconnexion span').html('Logout');
} else 
	myTypeEcran = 'pc';

$('.show-on-logon').hide();

// Mise en forme mobile et pc lors du redimensionnement de la page
window.onresize = function(){
	if (document.body.clientWidth < myWidthMobile) 
	{
		if (myTypeEcran != 'mobile') 
		{
			myTypeEcran = 'mobile';
			$('#section-2').html(myDivListeUtilisateurs);
			$('#sous-section-3').html(myDivChat);
			$('#envoi-socket-message').val('\u2713');
			$('#option-activation-notifications').html('Notifications');
			$('#option-reset-chat').html('Réinitialiser');
			$('#spn-deconnexion span').html('Logout');
		}
	} else {
		if (myTypeEcran != 'pc') 
		{	
			myTypeEcran = 'pc';
			$('#sous-section-2').html(myDivChat);
			$('#sous-section-3').html(myDivListeUtilisateurs);
			$('#envoi-socket-message').val('Envoyer le message à tous');
			$('#option-activation-notifications').html("Activer les notifications");
			$('#option-reset-chat').html("Réinitialiser le t'chat");
			$('#spn-deconnexion span').html('Déconnexion');
		}
	}
};


function setCookie(nom, valeur, expire, chemin, domaine, securite){
	document.cookie = nom + '_' + location.host.split(':').join('') + ' = ' + escape(valeur) + '  ' +
	((expire == undefined) ? '' : ('; expires = ' + expire.toGMTString())) +
	((chemin == undefined) ? '' : ('; path = ' + chemin)) +
	((domaine == undefined) ? '' : ('; domain = ' + domaine)) +
	((securite == true) ? '; secure' : '');
}

function getCookie(name){
	name = name + '_' + location.host.split(':').join('')
	if(document.cookie.length == 0)
		return null;
	var regSepCookie = new RegExp('(; )', 'g');
	var cookies = document.cookie.split(regSepCookie);
	for(var i = 0; i < cookies.length; i++)
	{
		var regInfo = new RegExp('=', 'g');
		var infos = cookies[i].split(regInfo);
		if(infos[0] == name)
			return unescape(infos[1]);
	}
	return null;
}


// On coche ou décoche la checkbox activation-notifications en fonction de la valeur du cookie si il existe
if (myNotifications = getCookie('notifications')) 
	if (myNotifications == 'true') 
		$('#activation-notifications').prop("checked", true);

if (myAffichageVoiture = getCookie('affichageVoiture'))
    if (myAffichageVoiture == 'true') 
        $('#affichage-voiture').prop("checked", true);


// On coche ou décoche la checkbox emoticon en fonction de la valeur du cookie si il existe
if (getCookie('typeEmoticons'))
{
	myTypeEmoticons = getCookie('typeEmoticons');
    if (myTypeEmoticons == 'emojis')
        $('#emoticons-animes').prop("checked", true);
}



// Se déclanche à la réception d'un message : Fait clignoter le titre de l'onglet
function FaireClignoterTitre(message = null)
{
	if (document.title != '...') 
		document.title = '...';
	else {
		if (message != null) 
			document.title = message;
		else
			document.title = '... ...';
	}
}


$(window).focus(function() 
{
	if (document.title !=  '-')  
	{
		document.title = 'La com LCI';
		receptionMessage = clearInterval(receptionMessage);
	}
});


function insertion_emoticons(message, typeEmoticons)
{
	//alert('URI-Component -> ' + encodeURIComponent((message.trim())));
	//alert(decodeURIComponent(encodeURIComponent(message.trim())));

	//alert('URI ---> ' + encodeURI(message));
	//alert(decodeURI(encodeURI(message)));

	return encodeURI(message.trim())
		.replace(/:\)/g,        	"<img src='images/" + typeEmoticons + "_emoticon_rire.gif'            	height=40px; />")
		.replace(/:-\)/g,       	"<img src='images/" + typeEmoticons + "_emoticon_lol.gif'             	height=35px; />")
		.replace(/:%5D/g,         	"<img src='images/" + typeEmoticons + "_emoticon_lol_2.gif'           	height=45px; />")
		.replace(/=\)/g,        	"<img src='images/" + typeEmoticons + "_emoticon_lol_3.gif'           	height=45px; />")
		.replace(/:D/g,         	"<img src='images/" + typeEmoticons + "_emoticon_mdr.gif'             	height=50px; />")
		.replace(/;D/g,         	"<img src='images/" + typeEmoticons + "_emoticon_mdr_2.gif'           	height=40px; />")
		.replace(/:\'\'\(/g,  		"<img src='images/" + typeEmoticons + "_emoticon_larme_2.gif'    		height=35px; />")
		.replace(/:\'\(/g,   		"<img src='images/" + typeEmoticons + "_emoticon_larme.gif'           	height=45px; />")
		.replace(/:\(/g,        	"<img src='images/" + typeEmoticons + "_emoticon_larme_3.gif'         	height=45px; />")
		.replace(/=D/g,         	"<img src='images/" + typeEmoticons + "_emoticon_mdr_moque.gif'       	height=45px; />")
		.replace(/;\)f/g,       	"<img src='images/" + typeEmoticons + "_emoticon_clin_oeil_feminin.gif'  height=45px; />")
		.replace(/;\)/g,        	"<img src='images/" + typeEmoticons + "_emoticon_clin_oeil.gif'       	height=35px; />")
		.replace(/;-\)/,        	"<img src='images/" + typeEmoticons + "_emoticon_clin_oeil_2.gif'     	height=40px; />")
		.replace(/%3E:O/g,    		"<img src='images/" + typeEmoticons + "_emoticon_pas_content.gif'     	height=40px; />")
		.replace(/%3E:o/g,    		"<img src='images/" + typeEmoticons + "_emoticon_pas_content_2.gif'   	height=40px; />")
		.replace(/:\//g,        	"<img src='images/" + typeEmoticons + "_emoticon_nul.gif'             	height=40px; />")
		.replace(/o.O/g,        	"<img src='images/" + typeEmoticons + "_emoticon_hein_quoi.gif'       	height=40px; />")
		.replace(/O.o/g,        	"<img src='images/" + typeEmoticons + "_emoticon_heu_quoi.gif'        	height=40px; />")
		.replace(/-_-2/g,       	"<img src='images/" + typeEmoticons + "_emoticon_pouce2.gif'          	height=50px; />")
		.replace(/-_-/g,        	"<img src='images/" + typeEmoticons + "_emoticon_pouce.gif'           	height=50px; />")
		.replace(/8-\%7C/g,       	"<img src='images/" + typeEmoticons + "_emoticon_cafe.gif'            	height=45px; />")
		.replace(/8\%7C/g,        	"<img src='images/" + typeEmoticons + "_emoticon_lunette.gif'         	height=30px; />")
		.replace(/B\%7C/g,        	"<img src='images/" + typeEmoticons + "_emoticon_superman.gif'       	height=45px; />")
		.replace(/:P/g,         	"<img src='images/" + typeEmoticons + "_emoticon_epuise.gif'         	height=45px; />")
		.replace(/:\?/g,        	"<img src='images/" + typeEmoticons + "_emoticon_no_comment.gif'      	height=45px; />")
		.replace(/:X/g,         	"<img src='images/" + typeEmoticons + "_emoticon_shut.gif'            	height=40px; />")
		.replace(/:\^\)/g,      	"<img src='images/" + typeEmoticons + "_emoticon_mince.gif'           	height=40px; />")
		.replace(/:-\*/g,       	"<img src='images/" + typeEmoticons + "_emoticon_bisou_feminin.gif'   	height=40px; />")
		.replace(/:\*r/g,       	"<img src='images/" + typeEmoticons + "_emoticon_bisou_recu.gif'      	height=35px; />")
		.replace(/:\*/g,        	"<img src='images/" + typeEmoticons + "_emoticon_bisou.gif'           	height=35px; />")
		.replace(/%20/g," ")
		.replace(/%C3%A9/g, 'é')
		.replace(/%C3%A8/g, 'è')
		.replace(/%C3%A0/g, 'à')
		.replace(/%C3%A7/g, 'ç')
		.replace(/%C3%B4/g, 'ô')
		.replace(/%C3%94/g, 'Ô')
		.replace(/%C3%B9/g, 'ù')
		.replace(/%22/g, '"')
		.replace(/%5B/g, '[')
		.replace(/%5D/, ']');
}

			
function enregistreChat(nouveauMessage) 
{
	myChat.push(nouveauMessage);
	// On redefini le cookie tchat à chaque réception de message : Expiration à la fin de la session
	setCookie('chat', myChat);
	maxEntreesTab = myMaxEntreesTab -1;
	if (myChat.length > maxEntreesTab) 
		myChat =  myChat.slice(-1 * maxEntreesTab);
	return 0;
}


function sendToUtilisateur(utilisateur)
{
	if ($('#bannir').is(':checked')) 
	{
		socket.emit('bannir', utilisateur);
		$('#bannir').prop('checked', false);
	} else {
		if ($('#socket-message').val() !=  '')
		{
			socket.emit('messagePersonnel', $('#socket-message').val(), myLogin, utilisateur.trim(), myTypeEmoticons);
			$('#socket-message').val("");
			// On retire l'image des émoticons si elle est affichée lors de l'envoi d'un message.
            removeListeEmoticons();
		}
	}
}

// fonction qui retourne la classe des messages tchat en fonction d'affichage avec loupe ou non
function getChatClass() {
	var classes;
    if (myAffichageVoiture == 'true')
        classes = ' loupe-possible loupe ';
    else
        classes = ' loupe-possible ';
	return classes;
}

function removeListeEmoticons() 
{
	// On retire l'image des emoticons si elle est affichée lors de l'envoi d'un message.
	if($('.div-liste-emoticons').length)
	{
		$('#liste-emoticons').prop('checked', false);
		$('.div-liste-emoticons').remove();
		$('.chat').removeClass('cacher');
	}
}

function removeFromChat(utilisateur) {
	socket.emit('removeFromChat', utilisateur, myLogin, myTypeEmoticons);
}




$(document).ready(function()
{
	socket = io.connect("http://vps614872.ovh.net:" + myPortServeur);

	if (myLogin != '') 
	{
	    // Si on est dans une session privé, rafraichissment automatique de la page après le delais max de la session privée
	    if(myDureeSessionPrivee != 0) {
	        setInterval(function() {
				setCookie('autorisation','', dtDelete);
	            window.location.assign(window.location.href);
	        }, myDureeSessionPrivee);
	    }

		var nouveauMessage;
		$('.show-on-logon').show();
		$('#communication-formulaire').hide();
		$('#liste-emoticons').prop('checked', false);

		if (getCookie('chat')) 
		{
			var messageChat;
			var chat = getCookie('chat').split('</div>,');
			if (chat.length != 0) 
				$(chat).each(function(key, message) 
				{
					messageChat =  message + '</div>';
					$('#chat').prepend(messageChat);
					enregistreChat(messageChat);
				});
		}

		$('#envoi-socket-message').click(function()
		{
			if ($('#socket-message').val() !=  '')
			{
				socket.emit('message', $('#socket-message').val(), myLogin, myTypeEmoticons);
				$('#socket-message').val("");
				removeListeEmoticons();
			}
		});

		$('#option-activation-notifications').click(function() {
			$('#activation-notifications').trigger("click");
		});
		$('#activation-notifications').click(function() 
		{
			myNotifications = String($('#activation-notifications').is(':checked'));
			var notification = $('#activation-notifications').is(':checked');
			// Cookie de notification : Sans date d'expiration
			setCookie('notifications', notification, dtNoExpiration, '/' );
		});


		/* Lors du clic sur la checkbox loupe on passe tous les éléments du DOM ayant la classe .loupe-possible en mode loupe */
		$('#option-affichage-voiture').click(function() {
            $('#affichage-voiture').trigger("click");
        });
		$('#affichage-voiture').click(function()
        {
			myAffichageVoiture = String($('#affichage-voiture').is(':checked'));
			var affichageVoiture = $('#affichage-voiture').is(':checked');
			if (affichageVoiture) 
				$('.loupe-possible').addClass('loupe');
			else 
				$('.loupe-possible').removeClass('loupe');
			// Cookie d'affichage en mode voiture : Sans date d'expiration
			setCookie('affichageVoiture', affichageVoiture, dtNoExpiration, '/' );
        });
		// On lance l'affichage en mode loupe si la checkbox est cochée
		if(myAffichageVoiture == 'true')
            $('#affichage-voiture').triggerHandler("click");


		$('#option-emoticons-animes').click(function() {
            $('#emoticons-animes').trigger("click");
        });
		$('#emoticons-animes').click(function()
        {
			if ($('#emoticons-animes').is(':checked')) 
            	myTypeEmoticons = 'emojis';
			else
            	myTypeEmoticons = 'smiley';
            // Cookie du choix d'emoticon : anime(emojis) ou smiley 
            setCookie('typeEmoticons', myTypeEmoticons, dtNoExpiration, '/' );
        });

		$('#option-reset-chat').click(function() {
            $('#reset-chat').trigger("click");
        });
        $('#reset-chat').click(function()
        {
            myChat = [];
            // Cookie de tchat : Expire à la fin de la session
            setCookie('chat', myChat);
            $('#chat').html("");
            $('#reset-chat').prop('checked', false);
        });



	
		$('#couleur').change(function()
		{
			myCouleur = $('#couleur').val();
			// Cookie de couleur : Sans date d'expiration
			setCookie('couleur', myCouleur, dtNoExpiration, '/' );
			$('#socket-message').css('background', myCouleur);
		});

		$('#couleurTexte').change(function()
		{
			myCouleurTexte = $('#couleurTexte').val();
			// Cookie de couleur du texte : Sans date d'expiration
			setCookie('couleurTexte', myCouleurTexte, dtNoExpiration, '/' );
			$('#socket-message').css('color', myCouleurTexte);
		});
		$('#couleur').triggerHandler('change');
		$('#couleurTexte').triggerHandler('change');


		$('#spn-deconnexion').click(function() 
		{
			// Suppression du login pour éviter la reconnexion automatique par cookie et pour pouvoir changer de login
			setCookie('login', '');
			setCookie('identification', '');
			socket.emit('logout', myLogin);
			window.location.assign(window.location.href);
		});

		$('#liste-emoticons').click(function()
        {
			var div = "<div class='div-liste-emoticons'></div>";
			if ($('#liste-emoticons').is(':checked')) {
				$('#chat').prepend(div);
				$('#section-2').prepend(div);
				$('.chat').addClass('cacher');
			} else {
				$('.div-liste-emoticons').remove();
                $('.chat').removeClass('cacher');
			}
        });
	} else {
		// Transformation de l'input text du login en input password et inversement
		$('#spn-secure').click(function() 
		{ 
			$('#secure').trigger('click');
		});
		$('#secure').click(function()
		{
			if ($('#secure').is(':checked')) 
				$('#textbox-login').prop('type', 'password');
			else
				$('#textbox-login').prop('type', 'text');
		});

		$('#textbox-login').keyup(function() 
		{
			if ($('#textbox-login').val() == 'L@') 
				$('#textbox-login').prop('type', 'password');
			else if (($('#textbox-login').val() == '') && ($('#textbox-login').attr('type') == 'password')) 
				$('#textbox-login').prop('type', 'text');
		});

		setTimeout(function() 
		{
			$("#communication-formulaire").removeClass('cacher');
		}, 100);
	}


    socket.on(myLogin, function(message, login, typeEmoticons)
    {
		var action = false;
		if (myLogin == 'admin') 
		{
			switch(message) {
				case 'please do refresh' :
					action = true;
					window.location.assign(window.location.href);
					break;
			}
		}

		if (action == false) 
		{
        	if (myNotifications == 'true')
        	    if (! document.hasFocus())
        	        if (typeof(receptionMessage) == 'undefined')
        	            receptionMessage = setInterval('FaireClignoterTitre("!")', 1000);
        	nouveauMessage = "<div class='chat " + getChatClass() + "'>" + login + ' : ' + insertion_emoticons(message, typeEmoticons).replace(/[\n]/g,'<br />') + "</div>";
        	$('#chat').prepend(nouveauMessage);
        	enregistreChat(nouveauMessage);
		}
    });


	// Reception d'un message de Tchat
	socket.on('message', function(message, login, typeEmoticons)
	{
		var couleur;
		var couleurTexte;
		if (login == myLogin) 
		{
			couleur = myCouleur;
			couleurTexte = myCouleurTexte;
		} else if (login == 'Admin') 
		{
			couleur = "#FF0000";
			couleurTexte = "#000000";
		} else {
			couleur = "#6F6F6F";
			couleurTexte = "#000000";
		}

		if (myNotifications == 'true' ) 
			if (! document.hasFocus()) 
				if (typeof(receptionMessage) == 'undefined') 
					receptionMessage = setInterval('FaireClignoterTitre()', 1000);
		nouveauMessage = "<div class='chat " + getChatClass() + "' style='background-color:" + couleur + ";color:" + couleurTexte + "' readonly>" + login + ' : ' + insertion_emoticons(message, typeEmoticons).replace(/[\n]/g,'<br />') + "</div>";
		$('#chat').prepend(nouveauMessage);
		enregistreChat(nouveauMessage);
	});


	// Réception d'une information privé pour le compte de l'Administrateur 
    socket.on('messageInfo', function(message, login, typeEmoticons)
    {
		nouveauMessage = "<div class='chat " + getChatClass() + "' style='background-color:" + couleur + ";color:" + couleurTexte + "' readonly>" + message + "</div>";
		$('#chat').prepend(nouveauMessage);
        enregistreChat(nouveauMessage);
	});



	socket.on('messageAdmin', function(message)
	{
		$('.message-admin').html(message);
	});

	socket.on('listeUtilisateurs', function(tabUtilisateurs, nbPostesConnectes)
	{
		var textHtml = '';
        if (myLogin == 'admin')
        {
			myTabLogin.forEach(function(user) {
				if (tabUtilisateurs.includes(user) || (user == 'Admin')) {
					textHtml += "<p class='utilisateur option " + getChatClass() + "' onClick=sendToUtilisateur('" + user + "');>" + user + '</p>';
				} else {
					textHtml += "<p class='utilisateur option " + getChatClass() + "' onClick=removeFromChat('" + user + "');>" + user + ' (non connecté)</p>';
				}
			});	
        } else {
			if (tabUtilisateurs.length > 1)
        	    $('#div-liste-utilisateurs h1').html("<span id='nombreDePostesConnectes'>tabUtilisateurs.length</span> &nbsp; utilisateurs : ");
        	else if (tabUtilisateurs.length == 1)
        	    $('#div-liste-utilisateurs h1').html("Est connecté");
        	else
            	$('#div-liste-utilisateurs h1').html("0 utilisateur connectés");

			tabUtilisateurs.forEach(function(user){
				textHtml += "<p class='utilisateur option " + getChatClass() + "' onClick=sendToUtilisateur('" + user + "');>" + user + '</p>';
			});
		}
		$('#liste-utilisateurs').html(textHtml);
		$('#nombreDePostesConnectes').html(nbPostesConnectes);
	});

	// Fonction appelée pour demander le renvoi de la variable Login si elle existe
	socket.on('refresh', function()
	{
		if (myLogin != '') 
			window.location.assign(window.location.href);
	});

	// Réponse à l'appel de navigaterus connectes
	socket.on('appelConnectes', function() {
		if (myLogin !=  '') 
		{
			socket.emit('estConnecte', myLogin, getCookie('identification'));
		}
	});

});
