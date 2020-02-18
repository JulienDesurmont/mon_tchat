           $('.show-on-logon').hide();
            var socket = io.connect("http://vps614872.ovh.net:8087");

            var myLogin = $('#login').html();
            var myCouleur = $('#couleur').val();
            var reception_message;

            if (myLogin != '') {
                $('.show-on-logon').show();
                $('#communication-formulaire').hide();


                socket.on('message', function(message, login){
                    var couleur;
                    if (login == myLogin) {
                        couleur = myCouleur;
                    } else if (login == 'Admin') {
                        couleur = "#6E33FF";
                    } else {
                        couleur = "#6F6F6F";
                    }

                    if (! document.hasFocus()) {
                        if (typeof(reception_message) == 'undefined') {
                            reception_message = setInterval('FaireClignoterTitre()', 1000);
                        }
                    }

                    $('#chat').prepend("<div class='chat' style='background-color:" + couleur + "' readonly>" + login + ' : ' + insertion_emoticons(message) + "</div>");
                });
                
                socket.on('messageAdmin', function(message){
                    $('#message-admin').html(message);
                });

                socket.on('listeUtilisateurs', function(tabUtilisateurs, nbPostesConnectes){
                    if (tabUtilisateurs.length > 1) {
                        $('#div-liste-utilisateurs h1').html("Liste des <span id='nombreDePostesConnectes'>tabUtilisateurs.length</span> &nbsp; membres connectés");
                    } else if (tabUtilisateurs.length == 1) {
                        $('#div-liste-utilisateurs h1').html("Membre connecté");
                    }  else { 
                        $('#div-liste-utilisateurs h1').html("0 membre connectés");
                    }
                    var textHtml = '';
                    tabUtilisateurs.forEach(function(user){
                        textHtml += "<p class='membre' onClick=sendToMembre('" + user + "');>"+user+'</p>';
                    });
                    $('#listeUtilisateurs').html(textHtml);
                    $('#nombreDePostesConnectes').html(nbPostesConnectes);
                });

                socket.on(myLogin, function(message, login){
                    if (! document.hasFocus()) {
                        if (typeof(reception_message) == 'undefined') {
                            reception_message = setInterval('FaireClignoterTitre("!")', 1000);
                        }
                    }
                    $('#chat').prepend("<div class='chat'>" + login + ' : ' + insertion_emoticons(message) + "</div>");
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

                $('#couleur').change(function(){
                    $('#formCouleur').submit();
                });

                function sendToMembre(membre) {
                    if ($('#socket-message').val() !=  ''){             
                        socket.emit('messagePersonnel', $('#socket-message').val(), myLogin, membre);
                        $('#socket-message').val("");
                    }                   
                }
                        

                var reception_message;

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
                        reception_message = clearInterval(reception_message);
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
        }
