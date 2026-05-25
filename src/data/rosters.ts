// Auto-generated from world_cup_2026_complete.json

export interface TeamHistory {
  appearances: number;
  passed_group_stage: number;
  quarter_finals: number;
  semi_finals: number;
  finals: number;
  wins: number;
}

export interface TeamSquad {
  goalkeepers: string[];
  defenders: string[];
  midfielders: string[];
  forwards: string[];
}

export interface TeamRoster {
  coach: string;
  history: TeamHistory;
  squad: TeamSquad;
}

export const ROSTERS: Record<string, TeamRoster> = {
  mex: {
    coach: "Javier Aguirre",
    history: { appearances: 18, passed_group_stage: 9, quarter_finals: 2, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Álex Padilla", "Antonio Rodríguez", "Carlos Acevedo", "Carlos Moreno", "Guillermo Ochoa", "Raúl Rangel"],
      defenders: ["Bryan González", "César Montes", "Edson Álvarez", "Eduardo Águila", "Everardo López", "Israel Reyes", "Jesús Angulo", "Jesús Gallardo", "Jesús Gómez", "Johan Vásquez", "Jorge Sánchez", "Julián Araujo", "Luis Rey", "Mateo Chávez", "Ramón Juárez", "Richard Ledezma", "Víctor Guzmán"],
      midfielders: ["Alexei Domínguez", "Alexis Gutiérrez", "Álvaro Fidalgo", "Brian Gutiérrez", "Carlos Rodríguez", "Denzell Garcia", "Diego Lainez", "Efrain Álvarez", "Elias Montiel", "Erick Sánchez", "Erik Lira", "Gilberto Mora", "Isaías Violante", "Jeremy Márquez", "Jordan Carrillo", "Jorge Ruvalcaba", "Kevin Castañeda", "Luis Chávez", "Luis Romo", "Marcel Ruiz", "Obed Vargas", "Orbelín Pineda", "Jesús Angulo"],
      forwards: ["Alexis Vega", "Armando González", "César Huerta", "Germán Berterame", "Guillermo Martínez", "Julián Quiñones", "Raúl Jiménez", "Roberto Alvarado", "Santiago Giménez"],
    },
  },
  zaf: {
    coach: "Hugo Broos",
    history: { appearances: 4, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Ronwen Williams", "Ricardo Goss", "Sipho Chaine", "Brandon Petersen"],
      defenders: ["Khuliso Mudau", "Olwethu Makhanya", "Bradley Cross", "Thabiso Monyane", "Thabang Matuludi", "Nkosinathi Sibisi", "Aubrey Modiba", "Khulumani Ndamane", "Ime Okon", "Samukele Kabini", "Mbekezeli Mbokazi"],
      midfielders: ["Teboho Mokoena", "Jayden Adams", "Brooklyn Poggenpoel", "Lebohang Maboe", "Thalente Mbatha", "Sphephelo Sithole"],
      forwards: ["Oswin Appollis", "Tshepang Moremi", "Evidence Makgopa", "Lyle Foster", "Iqraam Rayners", "Relebohile Mofokeng", "Themba Zwane", "Patrick Maswanganyi", "Kamogelo Sebelebele", "Thapelo Morena", "Thapelo Maseko"],
    },
  },
  kor: {
    coach: "Hong Myung-bo",
    history: { appearances: 12, passed_group_stage: 4, quarter_finals: 1, semi_finals: 1, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Song Bum-keun", "Jo Hyeon-woo", "Kim Seung-gyu"],
      defenders: ["Jens Castrop", "Lee Han-beom", "Park Jin-seob", "Lee Ki-hyuk", "Kim Min-jae", "Kim Moon-hwan", "Kim Tae-hyeon", "Lee Tae-seok", "Seol Young-woo", "Cho Yu-min"],
      midfielders: ["Lee Dong-gyeong", "Hwang Hee-chan", "Yang Hyun-jun", "Hwang In-beom", "Lee Jae-sung", "Kim Jin-kyu", "Eom Ji-sung", "Bae Jun-ho", "Lee Kang-in", "Paik Seung-ho"],
      forwards: ["Cho Gue-sung", "Son Heung-min", "Oh Hyeon-gyu"],
    },
  },
  cze: {
    coach: "Miroslav Koubek",
    history: { appearances: 10, passed_group_stage: 4, quarter_finals: 2, semi_finals: 2, finals: 2, wins: 0 },
    squad: {
      goalkeepers: ["Lukáš Horníček", "Matěj Kovář", "Jindřich Staněk"],
      defenders: ["Vladimír Coufal", "David Douděra", "Tomáš Holeš", "Robin Hranáč", "Štěpán Chaloupek", "David Jurásek", "Ladislav Krejčí", "Jaroslav Zelený", "David Zima"],
      midfielders: ["Pavel Bucha", "Lukáš Červ", "Vladimír Darida", "Tomáš Ladra", "Lukáš Provod", "Michal Sadílek", "Hugo Sochůrek", "Alexandr Sojka", "Tomáš Souček", "Pavel Šulc", "Denis Višinský"],
      forwards: ["Tomáš Chorý", "Adam Hložek", "Mojmír Chytil", "Christophe Kabongo", "Jan Kuchta", "Patrik Schick"],
    },
  },
  can: {
    coach: "Jesse Marsch",
    history: { appearances: 3, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Milan Borjan", "Dayne St. Clair", "Maxime Crépeau"],
      defenders: ["Alphonso Davies", "Alistair Johnston", "Richie Laryea", "Derek Cornelius", "Moïse Bombito", "Kamal Miller", "Joel Waterman", "Lucas Cavallini"],
      midfielders: ["Stephen Eustáquio", "Ismaël Koné", "Jonathan Osorio", "Samuel Piette", "Mathieu Choinière", "Liam Fraser", "Harry Paton"],
      forwards: ["Jonathan David", "Cyle Larin", "Tajon Buchanan", "Jacob Shaffelburg", "Theo Corbeanu", "Iké Ugbo", "Tani Oluwaseyi"],
    },
  },
  bih: {
    coach: "Sergej Barbarez",
    history: { appearances: 2, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Nikola Vasilj", "Martin Zlomislić", "Osman Hadžikić"],
      defenders: ["Sead Kolašinac", "Amar Dedić", "Nihad Mujakić", "Nikola Katić", "Tarik Muharemović", "Stjepan Radeljić", "Dennis Hadžikadunić", "Nidal Čelik"],
      midfielders: ["Amir Hadžiahmetović", "Ivan Šunjić", "Ivan Bašić", "Dženis Burnić", "Ermin Mahmić", "Benjamin Tahirović", "Amar Memić", "Armin Gigović"],
      forwards: ["Kerim Alajbegović", "Esmir Bajraktarević", "Ermedin Demirović", "Jovo Lukić", "Samed Baždar", "Haris Tabaković", "Edin Džeko"],
    },
  },
  qat: {
    coach: "Julen Lopetegui",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Shehab Elleithy", "Salah Zakaria", "Meshaal Barsham", "Mahmoud Abunada"],
      defenders: ["Boualem Khoukhi", "Pedro Miguel", "Sultan Al Brake", "Tarek Salman", "Al-Hashmi Al-Hussain", "Ayoub Al-Alawi", "Bassam Al-Rawi", "Rayyan Al-Ali", "Issa Laye", "Lucas Mendes", "Mohammed Waad", "Niall Mason"],
      midfielders: ["Ahmed Fathi", "Jassim Gaber", "Assim Madibo", "Abdulaziz Hatem", "Karim Boudiaf", "Mohammed Mannai", "Homam Al-Amin"],
      forwards: ["Almoez Ali", "Akram Afif", "Tahsin Mohammed", "Edmílson Junior", "Ahmed Al-Ganehi", "Ahmed Alaa", "Sebastián Soria", "Hassan Al-Haydos", "Mubarak Shannan", "Mohammed Muntari", "Yusuf Abdurisag"],
    },
  },
  che: {
    coach: "Murat Yakin",
    history: { appearances: 13, passed_group_stage: 8, quarter_finals: 3, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Gregor Kobel", "Yvon Mvogo", "Marvin Keller"],
      defenders: ["Manuel Akanji", "Nico Elvedi", "Ricardo Rodríguez", "Silvan Widmer", "Miro Muheim", "Aurèle Amenda", "Eray Cömert", "Luca Jaquez"],
      midfielders: ["Granit Xhaka", "Johan Manzambi", "Remo Freuler", "Denis Zakaria", "Ardon Jashari", "Djibril Sow", "Christian Fassnacht", "Michel Aebischer", "Fabian Rieder", "Rubén Vargas"],
      forwards: ["Breel Embolo", "Noah Okafor", "Dan Ndoye", "Zeki Amdouni", "Cedric Itten"],
    },
  },
  bra: {
    coach: "Carlo Ancelotti",
    history: { appearances: 23, passed_group_stage: 20, quarter_finals: 14, semi_finals: 9, finals: 7, wins: 5 },
    squad: {
      goalkeepers: ["Alisson", "Ederson", "Weverton"],
      defenders: ["Wesley", "Douglas Santos", "Alex Sandro", "Gabriel Magalhães", "Marquinhos", "Danilo", "Bremer", "Ibañez", "Léo Pereira"],
      midfielders: ["Bruno Guimarães", "Casemiro", "Danilo Santos", "Fabinho", "Lucas Paquetá", "Raphinha", "Neymar"],
      forwards: ["Vinícius Júnior", "Luiz Henrique", "Matheus Cunha", "Gabriel Martinelli", "Igor Thiago", "Endrick", "Rayan"],
    },
  },
  hai: {
    coach: "Sébastien Migné",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Johny Placide", "Alexandre Pierre", "Josué Duverger"],
      defenders: ["Carlens Arcus", "Wilguens Paugain", "Duke Lacroix", "Martin Expérience", "Jean-Kévin Duverne", "Ricardo Adé", "Hannes Delcroix", "Keeto Thermoncy"],
      midfielders: ["Carl Sainté", "Leverton Pierre", "Danley Jean Jacques", "Jean-Ricner Bellegarde", "Woodensky Pierre", "Dominique Simon"],
      forwards: ["Don Deedson Louicius", "Josué Casimir", "Derrick Etienne", "Ruben Providence", "Duckens Nazon", "Frantzdy Pierrot", "Wilson Isidor", "Yassin Fortuné", "Lenny Joseph"],
    },
  },
  mar: {
    coach: "Mohamed Ouahbi",
    history: { appearances: 7, passed_group_stage: 2, quarter_finals: 1, semi_finals: 1, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Al Harrar El Mehdi", "El Kajoui Munir", "Benchaouch Yanis"],
      defenders: ["Gomis Ibrahim", "Baouf Ismaël", "Saadane Marouane", "Ait Boudlal Abdelhamid", "Chibi Mohamed", "Salahedine Anass", "El Mourabet Samir", "Targhalline Oussama", "Bouftini Soufiane", "Belammari Youssef", "El Karouani Souffian"],
      midfielders: ["Louza Imran", "Gessime Yassine", "Saibari Ismael", "Begraoui Yanis", "Bentayeb Tawfik", "Bouaddi Ayyoub", "Amaimouni-Echghouyab Ayoube", "El-Faouzi Soufiane"],
      forwards: ["Boufal Soufiane", "Bounida Rayane", "Zabriri Yassir", "Maama Othmane", "Benjdida Soufiane", "El Kaabi Ayoub"],
    },
  },
  sco: {
    coach: "Steve Clarke",
    history: { appearances: 9, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Angus Gunn", "Craig Gordon", "Liam Kelly"],
      defenders: ["Aaron Hickey", "Nathan Patterson", "Andy Robertson", "Kieran Tierney", "Grant Hanley", "Jack Hendry", "John Souttar", "Scott McKenna", "Dom Hyam", "Anthony Ralston"],
      midfielders: ["Scott McTominay", "John McGinn", "Billy Gilmour", "Ryan Christie", "Lewis Ferguson", "Kenny McLean", "Ben Gannon-Doak", "Findlay Curtis"],
      forwards: ["Lawrence Shankland", "Lyndon Dykes", "Ché Adams", "George Hirst", "Ross Stewart"],
    },
  },
  usa: {
    coach: "Mauricio Pochettino",
    history: { appearances: 12, passed_group_stage: 6, quarter_finals: 1, semi_finals: 1, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Matt Turner", "Zack Steffen", "Ethan Horvath"],
      defenders: ["Sergiño Dest", "Antonee Robinson", "Chris Richards", "Tim Ream", "Miles Robinson", "Walker Zimmerman", "Joe Scally", "Cameron Carter-Vickers"],
      midfielders: ["Tyler Adams", "Weston McKennie", "Yunus Musah", "Giovanni Reyna", "Luca de la Torre", "Malik Tillman", "Johnny Cardoso"],
      forwards: ["Christian Pulisic", "Timothy Weah", "Folarin Balogun", "Ricardo Pepi", "Josh Sargent", "Haji Wright", "Brandon Vazquez"],
    },
  },
  pry: {
    coach: "Gustavo Alfaro",
    history: { appearances: 9, passed_group_stage: 2, quarter_finals: 1, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Roberto Fernández", "Orlando Gill", "Gastón Olveira", "Carlos Coronel", "Santiago Rojas", "Juan Espínola"],
      defenders: ["Gustavo Gómez", "Júnior Alonso", "Fabián Balbuena", "Omar Alderete", "Juan Cáceres", "Blas Riveros", "Alan Benítez", "Agustín Sández", "Mateo Gamarra", "Saúl Salcedo", "José Canale", "Diego León", "Alexandro Maidana", "Alcides Benítez", "Ronaldo Dejesús", "Alan Núñez"],
      midfielders: ["Miguel Almirón", "Mathías Villasanti", "Kaku", "Andrés Cubas", "Ramón Sosa", "Diego Gómez", "Damián Bobadilla", "Braian Ojeda", "Matías Galarza", "Robert Piris Da Motta", "Álvaro Campuzano", "Diego González", "Hugo Cuenca", "Maurício Magalhães", "Lucas Romero", "Enso González", "Rubén Lezcano"],
      forwards: ["Óscar Romero", "Ángel Romero", "Antonio Sanabria", "Julio Enciso", "Gabriel Ávalos", "Carlos González", "Álex Arce", "Adam Bareiro", "Lorenzo Melgarejo", "Isidro Pitta", "Ronaldo Martínez", "Gustavo Caballero", "Robert Morales", "Adrián Alcaraz", "Rodney Redes"],
    },
  },
  aus: {
    coach: "Tony Popovic",
    history: { appearances: 7, passed_group_stage: 2, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Mathew Ryan", "Paul Izzo", "Patrick Beach"],
      defenders: ["Milos Degenek", "Jacob Italiano", "Jordan Bos", "Kai Trewin", "Aziz Behich", "Jason Geria", "Cameron Burgess", "Alessandro Circati", "Lucas Herrington", "Kye Rowles"],
      midfielders: ["Connor Metcalfe", "Ajdin Hrustic", "Aiden O'Neill", "Riley McGree", "Patrick Yazbek", "Paul Okon-Engstler", "Alex Robertson"],
      forwards: ["Martin Boyle", "Nestory Irankunda", "Nishan Velupillay", "Awer Mabil", "Deni Juric", "Ante Suto"],
    },
  },
  tur: {
    coach: "Vincenzo Montella",
    history: { appearances: 3, passed_group_stage: 1, quarter_finals: 1, semi_finals: 1, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Altay Bayındır", "Ersin Destanoğlu", "Mert Günok", "Muhammed Şengezer", "Uğurcan Çakır"],
      defenders: ["Abdülkerim Bardakcı", "Ahmetcan Kaplan", "Çağlar Söyüncü", "Eren Elmalı", "Ferdi Kadıoğlu", "Merih Demiral", "Mert Müldür", "Mustafa Eskihellaç", "Ozan Kabak", "Samet Akaydın", "Yusuf Akçiçek", "Zeki Çelik"],
      midfielders: ["Atakan Karazor", "Demir Ege Tıknaz", "Hakan Çalhanoğlu", "İsmail Yüksek", "Kaan Ayhan", "Orkun Kökçü", "Salih Özcan"],
      forwards: ["Aral Şimşir", "Arda Güler", "Barış Alper Yılmaz", "Can Uzun", "Deniz Gül", "İrfan Can Kahveci", "Kenan Yıldız", "Kerem Aktürkoğlu", "Oğuz Aydın", "Yunus Akgün", "Yusuf Sarı"],
    },
  },
  deu: {
    coach: "Julian Nagelsmann",
    history: { appearances: 21, passed_group_stage: 18, quarter_finals: 16, semi_finals: 13, finals: 8, wins: 4 },
    squad: {
      goalkeepers: ["Oliver Baumann", "Manuel Neuer", "Alexander Nübel"],
      defenders: ["Joshua Kimmich", "Nico Schlotterbeck", "Nathaniel Brown", "David Raum", "Waldemar Anton", "Pascal Groß", "Antonio Rüdiger", "Malick Thiaw", "Jonathan Tah"],
      midfielders: ["Jamal Musiala", "Jamie Leweling", "Aleksandar Pavlović", "Nadiem Amiri", "Felix Nmecha", "Angelo Stiller", "Leon Goretzka"],
      forwards: ["Kai Havertz", "Deniz Undav", "Maximilian Beier", "Florian Wirtz", "Nick Woltemade", "Lennart Karl", "Leroy Sané"],
    },
  },
  civ: {
    coach: "Emerse Faé",
    history: { appearances: 4, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Yahia Fofana", "Mohamed Koné", "Alban Lafont"],
      defenders: ["Emmanuel Agbadou", "Clément Akpa", "Ousmane Diomande", "Guéla Doué", "Ghislain Konan", "Odilon Kossounou", "Evan Ndicka", "Wilfried Singo"],
      midfielders: ["Seko Fofana", "Parfait Guiagon", "Franck Kessié", "Christ Oulaï", "Ibrahim Sangaré", "Jean Michaël Seri"],
      forwards: ["Simon Adingra", "Ange-Yoan Bonny", "Amad Diallo", "Oumar Diakité", "Yan Diomande", "Evann Guessand", "Nicolas Pépé", "Bazoumana Touré", "Elye Wahi"],
    },
  },
  ecu: {
    coach: "Sebastián Beccacece",
    history: { appearances: 5, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Hernan Galindez", "Gonzalo Valle", "Moises Ramirez", "David Cabezas"],
      defenders: ["Angelo Preciado", "Pervis Estupinan", "Piero Hincapie", "Felix Torres", "Willian Pacho", "Joel Ordonez", "Jose Hurtado", "Jackson Porozo", "Leonardo Realpe"],
      midfielders: ["Moises Caicedo", "Alan Franco", "Gonzalo Plata", "Kendry Paez", "John Yeboah", "Alan Minda", "Pedro Vite", "Jordy Alcivar", "Denil Castillo", "Yaimar Medina", "Patrik Mercado", "Bryan Ramirez"],
      forwards: ["Enner Valencia", "Kevin Rodriguez", "Jordy Caicedo", "Nilson Angulo", "Janner Corozo", "John Mercado", "Jeremy Arevalo", "Elias Legendre", "Anthony Valencia"],
    },
  },
  cuw: {
    coach: "Dick Advocaat",
    history: { appearances: 1, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Tyrick Bodak", "Trevor Doornbusch", "Eloy Room"],
      defenders: ["Riechedly Bazoer", "Joshua Brenet", "Roshon Van Eijma", "Sherel Floranus", "Deveron Fonville", "Juriën Gaari", "Armando Obispo", "Shurandy Sambo"],
      midfielders: ["Juninho Bacuna", "Leandro Bacuna", "Livano Comenencia", "Kevin Felida", "Ar'jany Martha", "Tyrese Noslin", "Godfried Roemeratoe"],
      forwards: ["Jeremy Antonisse", "Tahith Chong", "Kenji Gorré", "Sontje Hansen", "Gervane Kastaneer", "Brandley Kuwas", "Jürgen Locadia", "Jearl Margaritha"],
    },
  },
  nld: {
    coach: "Ronald Koeman",
    history: { appearances: 12, passed_group_stage: 10, quarter_finals: 7, semi_finals: 4, finals: 3, wins: 0 },
    squad: {
      goalkeepers: ["Bart Verbruggen", "Justin Bijlow", "Mark Flekken", "Nick Olij"],
      defenders: ["Virgil van Dijk", "Nathan Aké", "Matthijs de Ligt", "Jurriën Timber", "Denzel Dumfries", "Jeremie Frimpong", "Micky van de Ven", "Lutsharel Geertruida", "Daley Blind", "Ian Maatsen"],
      midfielders: ["Frenkie de Jong", "Xavi Simons", "Tijjani Reijnders", "Ryan Gravenberch", "Joey Veerman", "Mats Wieffer", "Quinten Timber", "Kenneth Taylor", "Guus Til"],
      forwards: ["Cody Gakpo", "Memphis Depay", "Steven Bergwijn", "Brian Brobbey", "Wout Weghorst", "Joshua Zirkzee", "Noa Lang"],
    },
  },
  jpn: {
    coach: "Hajime Moriyasu",
    history: { appearances: 8, passed_group_stage: 4, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Zion Suzuki", "Keisuke Ōsako", "Tomoki Hayakawa"],
      defenders: ["Yūto Nagatomo", "Shōgo Taniguchi", "Ko Itakura", "Tsuyoshi Watanabe", "Takehiro Tomiyasu", "Hiroki Ito", "Ayumu Seko", "Yukinari Sugawara"],
      midfielders: ["Junnosuke Suzuki", "Wataru Endō", "Junya Ito", "Daichi Kamada", "Ritsu Dōan", "Ao Tanaka", "Keito Nakamura", "Kaishū Sano", "Takefusa Kubo", "Yuito Suzuki"],
      forwards: ["Koki Ogawa", "Daizen Maeda", "Ayase Ueda", "Kento Shiogai", "Keisuke Gotō"],
    },
  },
  swe: {
    coach: "Graham Potter",
    history: { appearances: 13, passed_group_stage: 8, quarter_finals: 6, semi_finals: 4, finals: 1, wins: 0 },
    squad: {
      goalkeepers: ["Viktor Johansson", "Kristoffer Nordfeldt", "Jacob Widell Zetterström"],
      defenders: ["Hjalmar Ekdal", "Gabriel Gudmundsson", "Isak Hien", "Emil Holm", "Gustaf Lagerbielke", "Victor Lindelöf", "Eric Smith", "Carl Starfelt", "Elliot Stroud", "Daniel Svensson"],
      midfielders: ["Taha Ali", "Yasin Ayari", "Lucas Bergvall", "Jesper Karlström", "Ken Sema", "Mattias Svanberg", "Besfort Zeneli"],
      forwards: ["Alexander Bernhardsson", "Anthony Elanga", "Viktor Gyökeres", "Alexander Isak", "Gustaf Nilsson", "Benjamin Nygren"],
    },
  },
  tun: {
    coach: "Sabri Lamouchi",
    history: { appearances: 7, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Sabri Ben Hessen", "Abdelmouhib Chamakh", "Aymen Dahman"],
      defenders: ["Ali Abdi", "Adem Arous", "Mohamed Amine Ben Hamida", "Dylan Bronn", "Raed Chikhaoui", "Moutaz Neffati", "Omar Rekik", "Montassar Talbi", "Yan Valery"],
      midfielders: ["Mortadha Ben Ouanes", "Anis Ben Slimane", "Ismaël Gharbi", "Rani Khedira", "Mohamed Belhadj Mahmoud", "Hannibal", "Ellyes Skhiri"],
      forwards: ["Elias Achouri", "Khalil Ayari", "Firas Chaouat", "Rayan Elloumi", "Hazem Mastouri", "Elias Saad", "Sebastian Tounekti"],
    },
  },
  bel: {
    coach: "Rudi Garcia",
    history: { appearances: 15, passed_group_stage: 7, quarter_finals: 3, semi_finals: 2, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Thibaut Courtois", "Senne Lammens", "Mike Penders"],
      defenders: ["Timothy Castagne", "Zeno Debast", "Maxim De Cuyper", "Koni De Winter", "Brandon Mechele", "Thomas Meunier", "Nathan Ngoy", "Joaquin Seys", "Arthur Theate"],
      midfielders: ["Kevin De Bruyne", "Amadou Onana", "Nicolas Raskin", "Youri Tielemans", "Hans Vanaken", "Axel Witsel"],
      forwards: ["Charles De Ketelaere", "Jeremy Doku", "Matias Fernandez Pardo", "Romelu Lukaku", "Dodi Lukebakio", "Diego Moreira", "Alexis Saelemaekers", "Leandro Trossard"],
    },
  },
  egy: {
    coach: "Hossam Hassan",
    history: { appearances: 4, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Mohamed El Shenawy", "Mostafa Shobeir", "El-Mahdi Soliman", "Mohamed Alaa"],
      defenders: ["Mohamed Hani", "Tarek Alaa", "Hamdy Fathy", "Rami Rabia", "Yasser Ibrahim", "Hossam Abdelmaguid", "Mohamed Abdelmonem", "Ahmed Fotouh", "Karim Hafez"],
      midfielders: ["Marwan Attia", "Mohanad Lasheen", "Nabil Emad", "Mahmoud Saber", "Ahmed Zizo", "Emam Ashour", "Mostafa Ziko", "Mahmoud Trezeguet", "Ibrahim Adel", "Haissem Hassan"],
      forwards: ["Mohamed Salah", "Omar Marmoush", "Aqtay Abdallah", "Hamza Abdelkarim"],
    },
  },
  irn: {
    coach: "Amir Ghalenoei",
    history: { appearances: 7, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Alireza Beiranvand", "Seyed Hossein Hosseini", "Mohammad Khalifeh", "Payam Niazmand"],
      defenders: ["Danial Eiri", "Ehsan Hajsafi", "Saleh Hardani", "Hossein Kanaani", "Shoja Khalilzadeh", "Milad Mohammadi", "Ali Nemati", "Omid Noorafkan", "Ramin Rezaeian"],
      midfielders: ["Rouzbeh Cheshmi", "Saeid Ezatolahi", "Mehdi Ghaedi", "Saman Ghoddos", "Mohammad Ghorbani", "Alireza Jahanbakhsh", "Mohammad Mohebi", "Amir Mohammad Razzaghinia", "Mehdi Torabi", "Aria Yousefi"],
      forwards: ["Ali Alipour", "Dennis Dargahi", "Hadi Habibinejad", "Amirhossein Hosseinzadeh", "Amirhossein Mahmoudi", "Kasra Taheri", "Mehdi Taremi"],
    },
  },
  nzl: {
    coach: "Darren Bazeley",
    history: { appearances: 3, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Max Crocombe", "Oliver Sail", "Michael Woud"],
      defenders: ["Michael Boxall", "Liberato Cacace", "Tim Payne", "Nando Pijnaker", "Scott Wootton", "Tommy Smith", "Bill Tuiloma", "Finn Surman"],
      midfielders: ["Joe Bell", "Marko Stamenić", "Matt Garbett", "Clayton Lewis", "Alex Rufer", "Callum McCowatt", "Ben Old"],
      forwards: ["Chris Wood", "Elijah Just", "Ben Waine", "Max Mata", "Kosta Barbarouses", "Cameron Howieson"],
    },
  },
  esp: {
    coach: "Luis de la Fuente",
    history: { appearances: 17, passed_group_stage: 11, quarter_finals: 6, semi_finals: 2, finals: 1, wins: 1 },
    squad: {
      goalkeepers: ["Unai Simón", "David Raya", "Álex Remiro", "Joan García"],
      defenders: ["Marcos Llorente", "Pedro Porro", "Aymeric Laporte", "Pau Cubarsí", "Dean Huijsen", "Christian Mosquera", "Marc Cucurella", "Alejandro Grimaldo"],
      midfielders: ["Rodrigo Hernández", "Martín Zubimendi", "Pedri González", "Pablo Fornals", "Carlos Soler", "Dani Olmo", "Fermín López"],
      forwards: ["Yeremy Pino", "Álex Baena", "Ander Barrenetxea", "Víctor Muñoz", "Mikel Oyarzabal", "Ferran Torres", "Borja Iglesias", "Lamine Yamal"],
    },
  },
  cpv: {
    coach: "Bubista",
    history: { appearances: 1, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Josimar Dias 'Vozinha'", "Márcio da Rosa", "Carlos Santos"],
      defenders: ["Steven Moreira", "Wagner Pina", "João Paulo Fernandes", "Sidny Lopes Cabral", "Logan Costa", "Roberto Lopes 'Pico'", "Kelvin Pires", "Ianique Tavares 'Stopira'", "Edilson Borges 'Diney'"],
      midfielders: ["Jamiro Monteiro", "Telmo Arcanjo", "Yannick Semedo", "Laros Duarte", "Deroy Duarte", "Kevin Pina"],
      forwards: ["Ryan Mendes", "Willy Semedo", "Garry Rodrigues", "Jovane Cabral", "Nuno Da Costa", "Dailon Livramento", "Gilson Benchimol", "Hélio Varela"],
    },
  },
  sau: {
    coach: "Georgios Donis",
    history: { appearances: 7, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Mohammed Al-Owais", "Fawaz Al-Qarni", "Nawaf Al-Aqidi"],
      defenders: ["Sultan Al-Ghannam", "Yasser Al-Shahrani", "Mohammed Al-Breik", "Ali Al-Bulaihi", "Abdulelah Al-Amri", "Hassan Tambakti", "Saud Abdulhamid", "Awn Al-Saluli"],
      midfielders: ["Salem Al-Dawsari", "Salman Al-Faraj", "Abdullah Otayf", "Mohamed Kanno", "Fahad Al-Muwallad", "Nasser Al-Dawsari", "Ali Al-Hassan", "Musab Al-Juwayr"],
      forwards: ["Saleh Al-Shehri", "Firas Al-Buraikan", "Abdullah Al-Hamdan", "Sami Al-Najei", "Meshari Al-Nemer", "Abdulrahman Ghareeb"],
    },
  },
  uru: {
    coach: "Marcelo Bielsa",
    history: { appearances: 15, passed_group_stage: 10, quarter_finals: 8, semi_finals: 5, finals: 2, wins: 2 },
    squad: {
      goalkeepers: ["Sergio Rochet", "Franco Israel", "Santiago Mele"],
      defenders: ["Ronald Araújo", "José María Giménez", "Sebastián Coates", "Matías Viña", "Guillermo Varela", "Nahitan Nández", "Bruno Méndez", "Santiago Bueno", "Lucas Olaza"],
      midfielders: ["Federico Valverde", "Rodrigo Bentancur", "Manuel Ugarte", "Nicolás de la Cruz", "Giorgian de Arrascaeta", "Matías Vecino", "Agustín Canobbio", "Emiliano Martínez"],
      forwards: ["Darwin Núñez", "Luis Suárez", "Edinson Cavani", "Facundo Pellistri", "Maximiliano Araújo", "Cristian Olivera", "Federico Viñas", "Brian Rodríguez"],
    },
  },
  fra: {
    coach: "Didier Deschamps",
    history: { appearances: 17, passed_group_stage: 9, quarter_finals: 8, semi_finals: 7, finals: 4, wins: 2 },
    squad: {
      goalkeepers: ["Mike Maignan", "Brice Samba", "Robin Risser"],
      defenders: ["Dayot Upamecano", "William Saliba", "Lucas Digne", "Theo Hernández", "Lucas Hernández", "Ibrahima Konaté", "Jules Koundé", "Malo Gusto", "Maxence Lacroix"],
      midfielders: ["N'Golo Kanté", "Adrien Rabiot", "Manu Koné", "Aurélien Tchouaméni", "Warren Zaïre-Emery"],
      forwards: ["Maghnes Akliouche", "Kylian Mbappé", "Ousmane Dembélé", "Michael Olise", "Désiré Doué", "Bradley Barcola", "Rayan Cherki", "Marcus Thuram", "Jean-Philippe Mateta"],
    },
  },
  sen: {
    coach: "Aliou Cissé",
    history: { appearances: 4, passed_group_stage: 2, quarter_finals: 1, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Édouard Mendy", "Mory Diaw", "Yehvann Diouf"],
      defenders: ["Krépin Diatta", "Antoine Mendy", "Kalidou Koulibaly", "El Hadji Malick Diouf", "Mamadou Sarr", "Moussa Niakhaté", "Moustapha Mbow", "Abdoulaye Seck", "Ismaïl Jakobs", "Ilay Camara"],
      midfielders: ["Idrissa Gana Gueye", "Pape Gueye", "Lamine Camara", "Habib Diarra", "Pathé Ciss", "Pape Matar Sarr", "Bara Sapoko Ndiaye"],
      forwards: ["Sadio Mané", "Ismaïla Sarr", "Iliman Ndiaye", "Assane Diao", "Ibrahim Mbaye", "Nicolas Jackson", "Bamba Dieng", "Chérif Ndiaye"],
    },
  },
  irq: {
    coach: "Graham Arnold",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Ahmed Basil", "Kamel Al-Rekabe"],
      defenders: ["Zaid Tahseen", "Akam Hashim", "Ahmed Maknzi"],
      midfielders: ["Ibrahim Bayesh", "Amir Al-Ammari", "Hasan Abdulkareem", "Marko Farji", "Kevin Yakob", "Peter Gwargis", "Zaid Ismail"],
      forwards: ["Aymen Hussein", "Mohanad Ali", "Ali Al-Hamadi", "Ali Yousif"],
    },
  },
  nor: {
    coach: "Ståle Solbakken",
    history: { appearances: 4, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Ørjan Nyland", "Egil Selvik", "Leopold Wahlstedt"],
      defenders: ["Julian Ryerson", "Stian Rode Gregersen", "Kristoffer Ajer", "Leo Skiri Østigård", "David Møller Wolfe", "Erlend Dahl Reitan", "Marcus Holmgren Pedersen", "Henrik Bjørdal"],
      midfielders: ["Martin Ødegaard", "Sander Berge", "Kristian Thorstvedt", "Mats Møller Dæhli", "Morten Thorsby", "Patrick Berg", "Hugo Vetlesen", "Tobias Gulliksen"],
      forwards: ["Erling Haaland", "Alexander Sørloth", "Jørgen Strand Larsen", "Antonio Nusa", "Erik Botheim", "Bård Finne", "Oscar Bobb"],
    },
  },
  arg: {
    coach: "Lionel Scaloni",
    history: { appearances: 19, passed_group_stage: 13, quarter_finals: 9, semi_finals: 6, finals: 6, wins: 3 },
    squad: {
      goalkeepers: ["Emiliano Martínez", "Gerónimo Rulli", "Juan Musso", "Walter Benítez", "Facundo Cambeses", "Santiago Beltrán"],
      defenders: ["Agustín Giay", "Gonzalo Montiel", "Nahuel Molina", "Nicolás Capaldo", "Kevin Mac Allister", "Lucas Martínez Quarta", "Marcos Senesi", "Lisandro Martínez", "Nicolás Otamendi", "Germán Pezzella", "Leonardo Balerdi", "Cristian Romero", "Lautaro Di Lollo", "Zaid Romero", "Facundo Medina", "Marcos Acuña", "Nicolás Tagliafico", "Gabriel Rojas"],
      midfielders: ["Máximo Perrone", "Leandro Paredes", "Guido Rodríguez", "Aníbal Moreno", "Milton Delgado", "Alan Varela", "Ezequiel Fernández", "Rodrigo De Paul", "Exequiel Palacios", "Enzo Fernández", "Alexis Mac Allister", "Giovani Lo Celso", "Nicolás Domínguez", "Emiliano Buendía", "Valentín Barco"],
      forwards: ["Lionel Messi", "Nicolás Paz", "Franco Mastantuono", "Thiago Almada", "Tomás Aranda", "Nicolás González", "Alejandro Garnacho", "Giuliano Simeone", "Matías Soulé", "Claudio Echeverri", "Gianluca Prestianni", "Santiago Castro", "Lautaro Martínez", "José Manuel López", "Julián Álvarez", "Mateo Pellegrino"],
    },
  },
  dza: {
    coach: "Vladimir Petković",
    history: { appearances: 5, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Luca Zidane", "Alexis Guendouz", "Anthony Mandrea"],
      defenders: ["Aissa Mandi", "Emile Dorval", "Mohamed Amine Tougai", "Zineddine Belaid", "Jaouen Hadjam", "Rayan Ait-Nouri", "Ramy Bensebaini", "Rafik Belghali", "Samir Chergui", "Achraf Abada"],
      midfielders: ["Houssem Aouar", "Adil Aouchiche", "Hicham Boudaoui", "Ismael Bennacer", "Fares Chaibi", "Ibrahim Maza", "Yacine Titraoui", "Ramiz Zerrouki", "Nabil Bentaleb", "Ilan Kebbal"],
      forwards: ["Mohamed Amoura", "Nadir Benbouali", "Redouane Berkane", "Adil Boulbina", "Amin Chiakha", "Amine Gouiri", "Fares Ghedjemis", "Anis Hadj-Moussa", "Riyad Mahrez", "Baghdad Bounedjah"],
    },
  },
  aut: {
    coach: "Ralf Rangnick",
    history: { appearances: 8, passed_group_stage: 4, quarter_finals: 2, semi_finals: 2, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Alexander Schlager", "Florian Wiegele", "Patrick Pentz"],
      defenders: ["David Affengruber", "Kevin Danso", "Stefan Posch", "David Alaba", "Philipp Lienhart", "Phillipp Mwene", "Alexander Prass", "Marco Friedl", "Michael Svoboda"],
      midfielders: ["Xaver Schlager", "Nicolas Seiwald", "Marcel Sabitzer", "Florian Grillitsch", "Carney Chukwuemeka", "Romano Schmid", "Christoph Baumgartner", "Konrad Laimer", "Patrick Wimmer", "Paul Wanner", "Alessandro Schöpf"],
      forwards: ["Marko Arnautović", "Michael Gregoritsch", "Saša Kalajdžić"],
    },
  },
  jor: {
    coach: "Jamal Sellami",
    history: { appearances: 1, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Yazid Abu Layla", "Abdullah Al-Fakhouri", "Ahmad Al-Juaidi"],
      defenders: ["Mohammad Abu Zraiq", "Anas Bani Yaseen", "Yazan Al-Arab", "Ibrahim Sadeh", "Bara' Marei", "Mohammad Al-Maharmeh", "Feras Shelbaieh", "Mohammad Abu Hasheesh"],
      midfielders: ["Noor Al-Rawabdeh", "Rajaei Ayed", "Mahmoud Al-Mardi", "Nizar Al-Rashdan", "Mohammad Al-Zu'bie", "Ibrahim Saadeh", "Saleh Rateb", "Mousa Al-Tamari", "Youssef Abu Jalboush"],
      forwards: ["Yazan Al-Naimat", "Ali Olwan", "Hamza Al-Dardour", "Baha' Faisal", "Ahmad Arsalan", "Mohammad Al-Zu'bi"],
    },
  },
  prt: {
    coach: "Roberto Martínez",
    history: { appearances: 9, passed_group_stage: 5, quarter_finals: 2, semi_finals: 2, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Diogo Costa", "José Sá", "Rui Silva", "Ricardo Velho"],
      defenders: ["Diogo Dalot", "Matheus Nunes", "Nélson Semedo", "João Cancelo", "Nuno Mendes", "Gonçalo Inácio", "Renato Veiga", "Rúben Dias", "Tomás Araújo"],
      midfielders: ["Rúben Neves", "Samuel Costa", "João Neves", "Vitinha", "Bruno Fernandes", "Bernardo Silva"],
      forwards: ["João Félix", "Francisco Trincão", "Francisco Conceição", "Pedro Neto", "Rafael Leão", "Gonçalo Guedes", "Gonçalo Ramos", "Cristiano Ronaldo"],
    },
  },
  cod: {
    coach: "Sébastien Desabre",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Timothy Fayulu", "Lionel Mpasi", "Mike Epolo"],
      defenders: ["Aaron Wan-Bissaka", "Gédéon Kalulu", "Joris Kayembe", "Arthur Masuaku", "Steve Kapuadi", "Rocky Bushiri", "Axel Tuanzebe", "Chancel Mbemba", "Dylan Batubinsika"],
      midfielders: ["Noah Sadiki", "Samuel Moutoussamy", "Edo Kayembe", "Nathan Mukau", "Charles Pickel", "Ngal'ayel Mukau Mbuku", "Brian Cipenga", "Théo Bongonda", "Gaël Kakuta"],
      forwards: ["Meschack Elia", "Fiston Mayele", "Cédric Bakambu", "Simon Banza", "Yoane Wissa"],
    },
  },
  col: {
    coach: "Néstor Lorenzo",
    history: { appearances: 7, passed_group_stage: 3, quarter_finals: 1, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["David Ospina", "Álvaro Montero", "Camilo Vargas", "Mosquera Marmolejo", "Aldair Quintana", "Kevin Mier"],
      defenders: ["Daniel Muñoz", "Jhon Lucumí", "Álvaro Angulo", "Santiago Arias", "Davinson Sánchez", "Johan Mojica", "Yerry Mina", "Cristian Borja", "Juan Cabal", "Carlos Cuesta", "Willer Ditta", "Junior Hernández", "Deiver Machado", "Yerson Mosquera", "Édier Ocampo", "Jhohan Romaña", "Andrés Román"],
      midfielders: ["Jorge Carrascal", "Sebastian Gomez", "Nelson Deossa", "Kevin Castaño", "Gustavo Puerta", "Juan Manuel Rengifo", "Johan Rojas", "Juan Fernando Quintero", "Juan Portilla", "Jordan Barrera", "Jhon Solís", "Jefferson Lerma", "Richard Ríos", "Jhon Arias", "Wilmar Barrios", "Juan Cuadrado", "Yáser Asprilla", "James Rodríguez"],
      forwards: ["Luis Díaz", "Jhon Córdoba", "Luis Suárez", "Sebastián Villa", "Neyser Villarreal", "Kevin Viveros", "Stiven Mendoza", "Edwuin Cetré", "Jhon Durán", "Andrés Gómez", "Rafael Santos Borré", "Jaminton Campaz", "Johan Carbonero", "Cucho Hernández"],
    },
  },
  uzb: {
    coach: "Fabio Cannavaro",
    history: { appearances: 1, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Utkir Yusupov", "Vladimir Nazarov", "Abduvohid Nematov"],
      defenders: ["Umar Eshmurodov", "Farrukh Sayfiev", "Rustam Ashurmatov", "Abdukodir Khusanov", "Mukhammadkodir Khamraliev", "Zafarmurod Abdurakhmatov", "Sherzod Nasrullaev", "Khojiakbar Alijonov"],
      midfielders: ["Odiljon Hamrobekov", "Jaloliddin Masharipov", "Otabek Shukurov", "Azizbek Turgunboev", "Jasurbek Yakhshiboev", "Ibrokhimkhalil Yuldoshev", "Umar Adkhamzoda", "Khojimaruf Erkinov", "Oston Urunov"],
      forwards: ["Eldor Shomurodov", "Igor Sergeev", "Otabek Jurakuziev", "Khusayin Norchaev", "Alisher Odilov", "Abbosbek Fayzullaev"],
    },
  },
  eng: {
    coach: "Thomas Tuchel",
    history: { appearances: 17, passed_group_stage: 11, quarter_finals: 8, semi_finals: 2, finals: 1, wins: 1 },
    squad: {
      goalkeepers: ["Jordan Pickford", "Aaron Ramsdale", "Dean Henderson", "James Trafford"],
      defenders: ["Kyle Walker", "Trent Alexander-Arnold", "Reece James", "Luke Shaw", "John Stones", "Harry Maguire", "Marc Guéhi", "Ezri Konsa", "Lewis Hall", "Levi Colwill", "Ben White", "Jarrad Branthwaite"],
      midfielders: ["Declan Rice", "Jude Bellingham", "Phil Foden", "Cole Palmer", "Bukayo Saka", "Jack Grealish", "Conor Gallagher", "Kobbie Mainoo", "Morgan Gibbs-White", "James Maddison", "Curtis Jones"],
      forwards: ["Harry Kane", "Ollie Watkins", "Ivan Toney", "Eddie Nketiah", "Dominic Solanke", "Anthony Gordon", "Jarrod Bowen", "Eberechi Eze"],
    },
  },
  hrv: {
    coach: "Zlatko Dalić",
    history: { appearances: 7, passed_group_stage: 3, quarter_finals: 3, semi_finals: 3, finals: 1, wins: 0 },
    squad: {
      goalkeepers: ["Dominik Livaković", "Ivica Ivušić", "Nediljko Labrović"],
      defenders: ["Joško Gvardiol", "Josip Juranović", "Borna Sosa", "Josip Stanišić", "Marin Pongračić", "Martin Erlić", "Domagoj Vida", "Duje Ćaleta-Car", "Stjepan Radeljić"],
      midfielders: ["Luka Modrić", "Mateo Kovačić", "Marcelo Brozović", "Mario Pašalić", "Lovro Majer", "Nikola Vlašić", "Martin Baturina", "Luka Sučić", "Kristijan Jakić"],
      forwards: ["Andrej Kramarić", "Ivan Perišić", "Bruno Petković", "Ante Budimir", "Marco Pašalić", "Dion Drena Beljo", "Franjo Ivanović"],
    },
  },
  gha: {
    coach: "Otto Addo",
    history: { appearances: 5, passed_group_stage: 2, quarter_finals: 1, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Richard Ofori", "Lawrence Ati-Zigi", "Abdul Manaf Nurudeen"],
      defenders: ["Tariq Lamptey", "Alidu Seidu", "Mohammed Salisu", "Alexander Djiku", "Gideon Mensah", "Jerome Opoku", "Nicholas Opoku", "Joseph Aidoo", "Kingsley Schindler"],
      midfielders: ["Thomas Partey", "Mohammed Kudus", "Salis Abdul Samed", "Elisha Owusu", "Daniel-Kofi Kyereh", "Abdul Fatawu Issahaku", "Kamaldeen Sulemana", "Ernest Nuamah", "Ibrahim Osman"],
      forwards: ["Jordan Ayew", "Inaki Williams", "Ernest Nuamah", "Antoine Semenyo", "Kwasi Okyere Wriedt", "Joel Fameyeh", "Nathaniel Adjei"],
    },
  },
  pan: {
    coach: "Thomas Christiansen",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Luis Mejía", "Orlando Mosquera", "César Samudio"],
      defenders: ["Andrés Andrade", "Harold Cummings", "Fidel Escobar", "Michael Amir Murillo", "José Córdoba", "Eric Davis", "César Blackman", "Roderick Miller"],
      midfielders: ["Aníbal Godoy", "Adalberto Carrasquilla", "Yoel Bárcenas", "César Yanis", "Jovani Welch", "Eduardo Guerrero", "Cristian Martínez", "Abdiel Ayarza"],
      forwards: ["José Fajardo", "Cecilio Waterman", "Ismael Díaz", "Ricardo Clarke", "Tomás Rodríguez", "Rolando Blackburn", "Alfredo Stephens"],
    },
  },
};