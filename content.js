/* =========================================================
   Alle Inhalte der Website an einer Stelle.
   Die verspielten Designs (Pixel, später Knete, Wald, Steampunk)
   bauen sich komplett aus dieser Datei.
   Neuer Talk? Einfach oben in "talks" einen Eintrag ergänzen.
   ========================================================= */
window.SITE = {
  name: "Christian Schiffer",
  roles: ["Journalist", "Autor", "Speaker", "Trainer"],
  tagline: ["Journalismus, KI, Technologie, Games", "BR/ARD & freelance", "Speaker, Trainer & Moderator"],
  city: "München",
  since: 1979,

  email: "christian.schiffer@gmx.de",
  socials: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/christian-schiffer-417a0525/" },
    { name: "Bluesky", url: "https://bsky.app/profile/did:plc:knibznsq5po4xlo24pw3bejr" },
    { name: "X / Twitter", url: "https://x.com/Wurzelbier" },
    { name: "Instagram", url: "https://www.instagram.com/schiffersspielebude/" }
  ],
  phoneNote: "Telefonische Anfragen bitte nur nach vorheriger Terminvereinbarung per E-Mail oder LinkedIn.",

  steckbrief: "Christian Schiffer ist Journalist, Moderator und Autor mit Sitz in München. Als Redakteur beim Bayerischen Rundfunk leitet er das Ressort „Netzwelt“. Seine Arbeit beschäftigt sich intensiv mit den gesellschaftlichen Auswirkungen der Digitalisierung – dort, wo Technik auf den Menschen trifft.",
  zitat: "Digitalisierung ist kein technisches Nischenthema, sondern prägt unseren Alltag – und damit Politik, Ökonomie und Kultur.",

  bio: [
    "Christian Schiffer operiert seit Jahren zielsicher in den Untiefen der digitalen Revolution und hilft anderen zu dechiffrieren, warum im Internet alles so ist, wie es ist.",
    "Seine Laufbahn begann beim Szenemagazin „Zündfunk“ des Bayerischen Rundfunks. Heute leitet er das Ressort „Netzwelt“ bei BR24. Für seine Arbeit wurde er mehrfach ausgezeichnet, zuletzt 2024 mit dem Grimme Online Award. Er ist außerdem Redakteur von „Der KI-Podcast“, dem ARD-Podcast zur KI-Revolution, und Co-Autor des Erfolgspodcasts „Die Peter Thiel-Story“.",
    "Schiffer ist stets analytisch, humorvoll und – wenn der Einsatz es erfordert – auch mal unbequem. Er ist Journalist, Autor, Speaker, Moderator und Trainer, aber vor allem: ein Erklärer in einer Welt, die zunehmend erklärungsbedürftig wird."
  ],
  portrait: "graphics/portrait_about.jpg",

  zeugen: [
    { rolle: "Journalist & KI-Experte", name: "Michael Förtsch", text: "Sein Metabolismus ist ein medizinisches Wunder. Ich habe gesehen, wie er Club-Mate und bayerischen Schweinsbraten in pure journalistische Exzellenz umwandelt – ohne nennenswerte Reibungsverluste." },
    { rolle: "Filmemacher & Redakteur", name: "Klaus Uhrig", text: "Christians Feingefühl ist legendär. Er besitzt die seltene Gabe, einem Gesprächspartner völlig charmant zu erklären, dass er gerade kompletten Unsinn geredet hat, sodass dieser sich am Ende dafür bedankt." },
    { rolle: "Vertraulich", name: "Fritz Espenlaub", text: "Unfassbare Trinkfestigkeit. Wenn andere Journalisten schon längst unter dem Tisch liegen, fängt Christian gerade erst an, die geopolitischen Implikationen der 90er Jahre zu analysieren. Ein Fels in der Brandung." }
  ],

  journalismusIntro: "Seit 2018 leite ich das Ressort „Netzwelt“ beim Bayerischen Rundfunk. Mich interessiert weniger Technik an sich als die Frage, was passiert, wenn sie auf Menschen trifft – im Alltag, in der Politik, in der Wirtschaft und in der Kultur. Ich arbeite zu Künstlicher Intelligenz, Digitalökonomie, Big Tech, Netzpolitik und digitaler Kultur, aber auch zu Ideologien, internationaler Politik, Verschwörungserzählungen und Machtfragen.",

  journalismus: [
    {
      titel: "Podcasts",
      intro: "Podcasts erlauben es mir, komplexe Geschichten über mehrere Folgen hinweg zu erzählen – mit der Zeit, die diese Themen verdienen.",
      items: [
        { tag: "Deutschlandfunk", titel: "Die Peter Thiel-Story", text: "Ein mehrteiliger Podcast über den Tech-Milliardär, der mit PayPal und Facebook reich wurde: Thiels radikal-libertäre Ideenwelt, sein Einfluss auf Trump und seine Vision einer post-demokratischen Zukunft.", link: "https://www.deutschlandfunk.de/die-peter-thiel-story-100.html", linkText: "Anhören" },
        { tag: "WDR", titel: "Die Elon Musk-Story", text: "Fünf Teile über den umstrittensten Tech-Milliardär unserer Zeit. Von SpaceX über Tesla bis zur chaotischen Übernahme von Twitter – wer ist dieser Mann wirklich?", link: "https://www.ardaudiothek.de/sendung/1live-die-elon-musk-story/urn:ard:show:54d819d5fb6a8835/", linkText: "Anhören" },
        { tag: "Grimme Online Award", titel: "In 5 Tagen Mord", text: "Die Krimi-Challenge mit KI: Comedian Janina Rook und ich schreiben in fünf Tagen ein Krimi-Hörspiel im Stil der 50er-Jahre – mit Expert:innen und ChatGPT.", link: "https://www.ardaudiothek.de/sendung/in-5-tagen-mord-die-krimi-challenge-mit-ki/urn:ard:show:b1e64d8fa156b4f2/", linkText: "Anhören" }
      ]
    },
    {
      titel: "Radio-Dokus",
      intro: "Radio-Features sind für mich die journalistische Königsdisziplin: aufwendig recherchiert, atmosphärisch erzählt, tief eintauchend.",
      items: [
        { tag: "ARD Radiofeature", titel: "Künstliche Nähe", text: "Doku über KI, Vertrauen und Abhängigkeit. Was passiert, wenn Maschinen zu Freunden und Therapeuten werden?", link: "https://www.ardaudiothek.de/episode/urn:ard:section:b5a7480aad89b0b6/", linkText: "Anhören" },
        { tag: "Hugo-Junkers-Preis", titel: "Der Krieg von morgen", text: "Wie Drohnen den Kampf um die Ukraine verändern. Zusammen mit Fritz Espenlaub untersuche ich, wie Krieg heute funktioniert.", link: "https://www.ardaudiothek.de/episode/urn:ard:episode:c92fa7ac3ca62e2b/", linkText: "Anhören" },
        { tag: "Prix Marulić", titel: "Im Schutz der Dunkelheit", text: "Eine Expedition ins Darknet – in den digitalen Untergrund, wo Anonymität kriminelle Geschäfte ermöglicht, aber auch Dissidenten schützt." }
      ]
    },
    {
      titel: "Feldversuche",
      intro: "Manchmal muss man Dinge am eigenen Leib erfahren, um wirklich zu verstehen, was Technologie mit uns macht.",
      items: [
        { tag: "VR", titel: "24 Stunden in der VR verbracht", text: "Brille auf, Welt aus: Zusammen mit Christian Alt habe ich den Selbstversuch gewagt und 24 Stunden in der virtuellen Realität verbracht.", link: "https://www.br-klassik.de/video/puls-im-tv-24h-virtual-reality-100.html", linkText: "Video ansehen" },
        { tag: "KI", titel: "ChatGPT zum Abitur geschickt", text: "Kann eine KI das bayerische Abitur bestehen? Zusammen mit Philipp Gawlik habe ich ChatGPT in vier Fächern antreten lassen – mit überraschendem Ergebnis.", link: "https://www.youtube.com/watch?v=Oi8CV9YuRbk", linkText: "Video ansehen" }
      ]
    },
    {
      titel: "Gaming-Journalismus",
      intro: "Als einer der ersten Journalisten in Deutschland habe ich Videospiele ernst genommen – lange bevor es selbstverständlich war.",
      items: [
        { tag: "Herausgeber", titel: "WASD – Bookazine", text: "Zusammen mit Markus Weissenhorn habe ich das mehrfach ausgezeichnete Magazin über Videospiele als Kulturgut gegründet und herausgegeben.", link: "https://de.wikipedia.org/wiki/WASD_%E2%80%93_Bookazine_f%C3%BCr_Gameskultur", linkText: "Mehr erfahren" },
        { tag: "ZDFinfo Doku-Reihe", titel: "Die Killerspiel-Debatte", text: "Drei Dokumentationen über die deutsche „Killerspiel“-Debatte, 2017 für den Grimme-Preis nominiert.", link: "https://www.youtube.com/watch?v=HYmAzJsEXFU", linkText: "Ansehen" },
        { tag: "Zeit / Medium", titel: "Kein „Continue“ im echten Leben", text: "Ein Porträt über den verstorbenen Spieler Dmitri und die Frage, wie Videospiele mit existenziellen Themen umgehen.", link: "https://www.zeit.de/digital/games/2016-11/tod-games-spieler-gehirntumor/komplettansicht", linkText: "Lesen" },
        { tag: "Bayerischer Rundfunk", titel: "Games im Hörfunk", text: "Seit 15 Jahren bespreche ich Videospiele für den BR und den Deutschlandfunk. New Games Journalism, radiofon produziert." }
      ]
    }
  ],

  buecher: [
    { titel: "Angela Merkel ist Hitlers Tochter", untertitel: "Im Land der Verschwörungstheorien", verlag: "Hanser Verlag, 2018", cover: "graphics/buch_merkel.jpg" },
    { titel: "Die Wahrheit ist (n)irgendwo da draußen", untertitel: "Was der UFO-Hype verrät", verlag: "Goldmann Verlag, 2023", cover: "graphics/buch_wasd.jpg" },
    { titel: "Titel noch streng geheim", untertitel: "Work in Progress", verlag: "Erscheint 202X", cover: null }
  ],

  preise: [
    { jahr: 2026, preis: "Deutscher Podcast Award („Doku“ & „Podcast of the year“)", werk: "Die Peter Thiel-Story" },
    { jahr: 2026, preis: "RIAS Media Award", werk: "Die Peter Thiel-Story" },
    { jahr: 2026, preis: "Concordia-Preis", werk: "Die Peter Thiel-Story" },
    { jahr: 2025, preis: "Hugo-Junkers-Preis", werk: "Der Krieg von morgen" },
    { jahr: 2024, preis: "Grimme Online Award (Sonderpreis KI)", werk: "In 5 Tagen Mord" },
    { jahr: 2021, preis: "Medienpreis für digitale Aufklärung (3. Platz)", werk: "Fake-Video basteln" },
    { jahr: 2021, preis: "Journalistenpreis BV Herzkranke Kinder", werk: "Herzbubble auf Instagram" },
    { jahr: 2020, preis: "Datenschutz Medienpreis", werk: "Tracking: Ein Tag im Internet" },
    { jahr: 2017, preis: "Goethe Medienpreis (2. Platz)", werk: "It's the economy, stupid!" },
    { jahr: 2017, preis: "Robert Geisendörfer Preis", werk: "Schöner neuer Wahn" },
    { jahr: 2015, preis: "Prix Marulić (3. Platz, Documentary)", werk: "Im Schutz der Dunkelheit" },
    { jahr: 2012, preis: "Kurt-Magnus-Preis (4. Platz)", werk: "Radio-Features zu digitalen Themen" }
  ],

  talksIntro: "Ich liebe es, auf Bühnen zu stehen. Meine Vorträge sind bunt, lehrreich und unterhaltsam. Bei der re:publica gehöre ich seit Jahren zum Inventar. Dazu Panels und Diskussionsrunden im Hörfunk, in der Phoenix-Runde oder auf Konferenz- und Festivalbühnen. Ich moderiere außerdem Bühnenformate und Panels.",
  talks: [
    { tag: "3sat · NANO Talk", titel: "Ist die Menschheit noch zu retten?", text: "Zu Gast bei Stephanie Rohde im Wissenschaftstalk von 3sat. Klimakrise, Artensterben, künstliche Intelligenz: Hat der Mensch als Maß aller Dinge ausgedient?", link: "https://www.zdf.de/video/talk/nano-talk-110/260511-talk-nano-ist-die-menschheit-noch-zu-retten-ntk-100" },
    { tag: "re:publica 2026", titel: "Der KI-Kapitalismus", text: "Eine Milliarde Menschen sprechen jede Woche mit einem Chatbot – nicht mehr nur als Tool, sondern als Gegenüber. Über das größte psychosoziale Experiment der Menschheit und eine neue Phase des Kapitalismus, die unser Bedürfnis nach Nähe ausbeutet.", link: "https://www.youtube.com/watch?v=8sLs96k7Awc" },
    { tag: "phoenix runde", titel: "Musk, Bezos, Thiel – Die Macht der Tech-Milliardäre", text: "Diskussion auf Phoenix über die großen Tech-Konzerne und wie wir in Europa zu mehr digitaler Souveränität kommen.", link: "https://www.ardmediathek.de/video/phoenix-runde/musk-bezos-thiel-die-macht-der-tech-milliardaere/phoenix/Y3JpZDovL3Bob2VuaXguZGUvNDk4MDAwNw" },
    { tag: "TINCON Berlin", titel: "Wir haben eine KI zum Abi geschickt", text: "Besteht ChatGPT das bayerische Abitur? Zusammen mit dem BR AI & Automation Lab haben wir es getestet – und zeigen, was man daraus lernen kann.", link: "https://www.youtube.com/watch?v=Oi8CV9YuRbk" }
  ],
  talkFotos: ["graphics/Panel2.jpg", "graphics/talk_stage_2.jpg"],

  workshops: {
    titel: "Die KI-Werkstatt",
    text: [
      "Ich liebe es, mein Wissen zu teilen. Und ich liebe KI – in meinen Workshops kommt beides zusammen. Egal ob an der ARD/ZDF-Medienakademie, bei der Caritas oder für die Maschmeyer Group: Ich bringe Menschen bei, wie sie generative KI richtig einsetzen.",
      "ChatGPT, Copilot und Co. krempeln nicht nur den Journalismus um, sondern verändern die Art, wie wir arbeiten, recherchieren und kreativ sind. Wann lohnt sich generative KI für Texte, Bilder, Audio oder Recherchen? Wie erkennt man Fakes? Und welche ethischen Fragen ergeben sich?"
    ],
    zitat: "In meinen Workshops setzen Sie sich mit verschiedenen KI-Werkzeugen für Text, Ton, Bild und Recherche auseinander – immer mit praktischen Übungen.",
    formate: ["Tagesseminar", "Wochenseminar", "90-Minuten-Crashkurs"],
    fotos: ["graphics/workshop_1.jpg", "graphics/workshop_2.jpg"]
  },

  impressum: "impressum.html"
};
