            var myLogin = $('#login').html();
            var myCouleur = $('#couleur').val();
            var receptionMessage;
			var myNotifications = 'false';
			var myTypeEcran;
			var myDivListeUtilisateurs;
			var myDivChat;
			var myChat = [];
			var myMaxEntreesTab = 10;

			window.onresize = function(){
        	   	if (document.body.clientWidth < 1280) {
					if (myTypeEcran != 'mobile') {
						myTypeEcran = 'mobile';
						$('#section-2').html(myDivListeUtilisateurs);
						$('#sous-section-3').html(myDivChat);
						$('#envoi-socket-message').val('\u2713');
						$('#option-notifications').html('Notifications');
						$('#option-reinitialiser').html('Réinitialiser');
					}
 				} else {
					if (myTypeEcran != 'pc') {
						myTypeEcran = 'pc';
						$('#sous-section-2').html(myDivChat);
        	        	$('#sous-section-3').html(myDivListeUtilisateurs);
                        $('#option-notifications').html("Activer les notifications");
                        $('#option-reinitialiser').html("Réinitialiser le t'chat");
					}
 				}
 			};

            function setCookie(nom, valeur, expire, chemin, domaine, securite){
                document.cookie = nom + ' = ' + escape(valeur) + '  ' +
                ((expire == undefined) ? '' : ('; expires = ' + expire.toGMTString())) +
                ((chemin == undefined) ? '' : ('; path = ' + chemin)) +
                ((domaine == undefined) ? '' : ('; domain = ' + domaine)) +
                ((securite == true) ? '; secure' : '');
            }

            function getCookie(name){
                if(document.cookie.length == 0)
                    return null;

                var regSepCookie = new RegExp('(; )', 'g');
                var cookies = document.cookie.split(regSepCookie);

                for(var i = 0; i < cookies.length; i++){
                    var regInfo = new RegExp('=', 'g');
                    var infos = cookies[i].split(regInfo);
                    if(infos[0] == name){
                        return unescape(infos[1]);
                    }
                }
                return null;
            }

			// On coche ou décoche la checkbox activation-notifications en fonction de la valeur du cookie si il exist
			if (myNotifications = getCookie('notifications')) {
				if (myNotifications == 'true') {
					$('#activation-notifications').prop("checked", true);
				}
			}
            var socket = io.connect("http://vps614872.ovh.net:6969");

   			function sendToUtilisateur(utilisateur) {
				if ($('#bannir').is(':checked')) {
					socket.emit('bannir', utilisateur);
					$('#bannir').prop('checked', false);
				} else {
                	if ($('#socket-message').val() !=  ''){
                	    socket.emit('messagePersonnel', $('#socket-message').val(), myLogin, utilisateur);
                	    $('#socket-message').val("");
                	}
				}
            }

              // Se déclanche à la réception d'un message : Fait clignoter le titre de l'onglet
                function FaireClignoterTitre(message = null){
                    if (document.title != '...') {
                        document.title = '...';
                    } else {
                        if (message != null) {
                            document.title = message;
                        } else {
                            document.title = '... ...';
                        }
                    }
                }


                $(window).focus(function() {
                    if (document.title !=  '-')  {
                        document.title = 'La com LCI';
                        receptionMessage = clearInterval(receptionMessage);
                    }
                });


                function insertion_emoticons(message){
                    return message
                        .replace(/:\)/g,        "<img src='images/emoticon_rire.gif'            height=40px; />")
                        .replace(/:-\)/g,       "<img src='images/emoticon_lol.gif'             height=35px; />")
                        .replace(/:]/g,         "<img src='images/emoticon_lol_2.gif'           height=45px; />")
                        .replace(/=\)/g,        "<img src='images/emoticon_lol_3.gif'           height=45px; />")
                        .replace(/:D/g,         "<img src='images/emoticon_mdr.gif'             height=50px; />")
                        .replace(/;D/g,         "<img src='images/emoticon_mdr_2.gif'           height=40px; />")
                        .replace(/:&#39;&#39;\(/g,   "<img src='images/emoticon_larme_2.gif'    height=35px; />")
                        .replace(/:&#39;\(/g,   "<img src='images/emoticon_larme.gif'           height=45px; />")
                        .replace(/:\(/g,        "<img src='images/emoticon_larme_3.gif'         height=45px; />")
                        .replace(/=D/g,         "<img src='images/emoticon_mdr_moque.gif'       height=45px; />")
                        .replace(/;\)f/g,       "<img src='images/emoticon_clin_oeil_feminin.gif'  height=45px; />")
                        .replace(/;\)/g,        "<img src='images/emoticon_clin_oeil.gif'       height=35px; />")
                        .replace(/;-\)/,        "<img src='images/emoticon_clin_oeil_2.gif'     height=40px; />")
                        .replace(/&#62;:O/g,    "<img src='images/emoticon_pas_content.gif'     height=40px; />")
                        .replace(/&#62;:o/g,    "<img src='images/emoticon_pas_content_2.gif'   height=40px; />")
                        .replace(/:\//g,        "<img src='images/emoticon_nul.gif'             height=40px; />")
                        .replace(/o.O/g,        "<img src='images/emoticon_hein_quoi.gif'       height=40px; />")
                        .replace(/O.o/g,        "<img src='images/emoticon_heu_quoi.gif'        height=40px; />")
                        .replace(/-_-2/g,       "<img src='images/emoticon_pouce2.gif'          height=50px; />")
                        .replace(/-_-/g,        "<img src='images/emoticon_pouce.gif'           height=50px; />")
                        .replace(/8-\|/g,       "<img src='images/emoticon_cafe.gif'            height=45px; />")
                        .replace(/8\|/g,        "<img src='images/emoticon_lunette.gif'         height=30px; />")
                        .replace(/B\|/g,        "<img src='images/emoticon_superman.gif'        height=45px; />")
                        .replace(/:P/g,         "<img src='images/emoticon_epuise.gif'          height=45px; />")
                        .replace(/:\?/g,        "<img src='images/emoticon_no_comment.gif'      height=45px; />")
                        .replace(/:X/g,         "<img src='images/emoticon_shut.gif'            height=40px; />")
                        .replace(/:\^\)/g,      "<img src='images/emoticon_mince.gif'           height=40px; />")
                        .replace(/:-\*/g,       "<img src='images/emoticon_bisou_feminin.gif'   height=40px; />")
                        .replace(/:\*r/g,       "<img src='images/emoticon_bisou_recu.gif'      height=35px; />")
                        .replace(/:\*/g,        "<img src='images/emoticon_bisou.gif'           height=35px; />");
                }

			
				function enregistreChat(nouveauMessage) {
                    myChat.push(nouveauMessage);
                    setCookie('chat', myChat);
					maxEntreesTab = myMaxEntreesTab -1;
					if (myChat.length > maxEntreesTab) {
						myChat =  myChat.slice(-1 * maxEntreesTab);
					}
					return 0;
				}





        $(document).ready(function(){
            myDivListeUtilisateurs = $($('#div-liste-utilisateurs'));
            myDivChat = $($('#chat'));

            if (document.body.clientWidth < 1280) {
                myTypeEcran = 'mobile';
                $('#section-2').html(myDivListeUtilisateurs);
                $('#sous-section-3').html(myDivChat);
				$('#envoi-socket-message').val('\u2713');
                $('#option-notifications').html('Notifications');
                $('#option-reinitialiser').html('Réinitialiser');
            } else {
                myTypeEcran = 'pc';
            }
            $('.show-on-logon').hide();

            if (myLogin != '') {
				var nouveauMessage;
                $('.show-on-logon').show();
                $('#communication-formulaire').hide();

				if (getCookie('chat')) {
					var messageChat;
					var chat = getCookie('chat').split('</div>,');
					if (chat.length != 0) {
						$(chat).each(function(key, message) {
							messageChat =  message + '</div>';
							$('#chat').prepend(messageChat);
							enregistreChat(messageChat);
						});
					}
				}



                socket.on('message', function(message, login){
                    var couleur;
                    if (login == myLogin) {
                        couleur = myCouleur;
                    } else if (login == 'Admin') {
                        couleur = "#6E33FF";
                    } else {
                        couleur = "#6F6F6F";
                    }

					if (myNotifications == 'true' ) {
                    	if (! document.hasFocus()) {
                    	    if (typeof(receptionMessage) == 'undefined') {
                    	        receptionMessage = setInterval('FaireClignoterTitre()', 1000);
                    	    }
                    	}
					}
					if(login != 'Admin') {
						nouveauMessage = "<div class='chat' style='background-color:" + couleur + "' readonly>" + login + ' : ' + insertion_emoticons(message).replace(/[\n]/g,'<br />') + "</div>";
					} else {
						nouveauMessage = "<div class='chat' style='background-color:" + couleur + "' readonly>" + login + ' : ' + insertion_emoticons(message).replace(/[\n]/g,'<br />') + "</div>";
					}
					$('#chat').prepend(nouveauMessage);
					enregistreChat(nouveauMessage);
                });


                socket.on(myLogin, function(message, login){
                    if (myNotifications == 'true' ) {
                        if (! document.hasFocus()) {
                            if (typeof(receptionMessage) == 'undefined') {
                                receptionMessage = setInterval('FaireClignoterTitre("!")', 1000);
                            }
                        }
                    }
                    if (login != 'Admin') {
						nouveauMessage = "<div class='chat'>" + login + ' : ' + insertion_emoticons(message).replace(/[\n]/g,'<br />') + "</div>";
                    } else {
						nouveauMessage = "<div class='chat'>" + login + ' : ' + insertion_emoticons(message).replace(/[\n]/g,'<br />') + "</div>";
                    }
					$('#chat').prepend(nouveauMessage);
					enregistreChat(nouveauMessage);
                });

                
                socket.on('messageAdmin', function(message){
                    $('#message-admin').html(message);
                });

                socket.on('listeUtilisateurs', function(tabUtilisateurs, nbPostesConnectes){
                    if (tabUtilisateurs.length > 1) {
                        $('#div-liste-utilisateurs h1').html("<span id='nombreDePostesConnectes'>tabUtilisateurs.length</span> &nbsp; utilisateurs : ");
                    } else if (tabUtilisateurs.length == 1) {
                        $('#div-liste-utilisateurs h1').html("Est connecté");
                    }  else { 
                        $('#div-liste-utilisateurs h1').html("0 utilisateur connectés");
                    }
                    var textHtml = '';
                    tabUtilisateurs.forEach(function(user){
                        textHtml += "<p class='utilisateur' onClick=sendToUtilisateur('" + user + "');>"+user+'</p>';
                    });
                    $('#liste-utilisateurs').html(textHtml);
                    $('#nombreDePostesConnectes').html(nbPostesConnectes);
                });

                socket.on('refresh', function(){
                    window.location.reload();
                });

                $('#envoi-socket-message').click(function(){
                    if ($('#socket-message').val() !=  ''){
                        socket.emit('message', $('#socket-message').val(), myLogin);
                        $('#socket-message').val("");
                    }
                });

				$('#activation-notifications').click(function() {
					myNotifications = String($('#activation-notifications').is(':checked'));
					var notification = $('#activation-notifications').is(':checked');
					var dtExpire = new Date();
					dtExpire.setTime(dtExpire.getTime() + 3600 * 1000);
					setCookie('notifications', notification, dtExpire, '/' );
				});
	
				$('#couleur').change(function(){
					myCouleur = $('#couleur').val();
					var dtExpire = new Date();
					dtExpire.setTime(dtExpire.getTime() + 3600 * 1000);
					setCookie('couleur', myCouleur, dtExpire, '/' );
                });

				$('#reset-chat').click(function() {
					myChat = [];
					setCookie('chat', myChat);
					$('#chat').html("");
					$('#reset-chat').prop('checked', false);
				});
        }
	 });

