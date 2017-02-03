# WeatherPlus
Descrizione:
	Quest'applicazione permette di conoscere le informazioni meteo di una città e di condividerle tramite Google+.

Come funziona:
	Quando si accede all'homepage dell'applicazione si hanno davanti una casella di testo e due pulsanti.
	
	La casella di testo permette di inserire il nome della città desiderata.
	Il primo bottone ("Invia") ci indirizza su un'altra pagina che ci permette di conoscere le informazioni meteorologiche 
	riguardanti tale città e postarle su Google+ tramite il bottone "Posta su Google+".
	Proseguendo, dopo esserci autenticati con l'account di Google, verrà postato il messaggio e si verrà reindirizzati in una 
  pagina  di conferma dell'avvenuta condivisione dove sarà possibile accedere al post su Google+.

	Il secondo bottone ("Cronologia") indirizzandoci su un'altra pagina, da la possibilità di sapere la storia di tutte le richieste
	effettuate dagli utenti.
 
 	
	A completamento delle form il messaggio verrà generato automaticamente ed inviato dal sistema attraverso un
	tweet  15 minuti prima dell'effettiva partenza.

Servizi REST usati:
	Per questa applicazione sono stati utilizzati due servizi REST:
	- API Google+ Domains
	- API weathers.co

Per quanto riguarda Google+ è stata implementata l'autenticazione e autorizzazione OAUTH (per
	eventuali informazioni riferirsi al seguente link: https://developers.google.com/+/domains/posts/creating)
	E inoltre, per poter inviare il post con le informazioni relative del meteo è stata utilizzata
	la chiamata POST.

Invece con le API rest di weathers.co si ottengono le informazioni meteorologiche della città scelta (temperatura, umidità, ecc.)
	Per ulteriori informazioni riferirsi al seguente link: http://weathers.co/api

Servizio di messaggeria asincrona:
	Rabbitmq è il servizio scelto. E' stato implementato nel seguente modo: si utilizza una singola coda
	di messaggi in cui viene inviato un messaggio contenente le informazioni postate dall'utente su Google+ 
	Il server di rabbitmq si attiva all'avvio dell'applicazione.
	Legge i messaggi presenti nella coda e ciascun messaggio letto viene scritto sul file SVLogger.log, utile all'applicazione per 
  conoscere la cronologia delle ricerche effettuate.
	Per ulteriori informazioni sul servizio riferirsi al seguente link: https://www.rabbitmq.com
