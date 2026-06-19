// Updated from wc2026_complete_rosters.json — official June 2026 squads

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
  nickname: string;
  coach: string;
  history: TeamHistory;
  squad: TeamSquad;
}

export const ROSTERS: Record<string, TeamRoster> = {
  mex: {
    nickname: "El Tri",
    coach: "Javier Aguirre",
    history: { appearances: 18, passed_group_stage: 9, quarter_finals: 2, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Carlos Acevedo", "Guillermo Ochoa", "Raúl Rangel"],
      defenders: ["Jesús Gallardo", "Israel Reyes", "César Montes", "Jorge Sánchez", "Johan Vásquez", "Mateo Chávez"],
      midfielders: ["Gilberto Mora", "Edson Álvarez", "Orbelín Pineda", "Luis Romo", "Brian Gutiérrez", "Obed Vargas", "César Huerta", "Luis Chávez", "Erik Lira", "Álvaro Fidalgo", "Roberto Alvarado"],
      forwards: ["Armando González", "Raúl Jiménez", "Julián Quiñones", "Santiago Giménez", "Guillermo Martínez", "Alexis Vega"],
    },
  },
  zaf: {
    nickname: "Bafana Bafana",
    coach: "Hugo Broos",
    history: { appearances: 4, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Ronwen Williams", "Ricardo Goss", "Sipho Chaine"],
      defenders: ["Khuliso Mudau", "Nkosinathi Sibisi", "Ime Okon", "Khulumani Ndamane", "Aubrey Modiba", "Samukelo Kabini", "Thabang Matuludi", "Olwethu Makhanya", "Kamogelo Sebelebele", "Bradley Cross", "Mbekezeli Mbokazi"],
      midfielders: ["Teboho Mokoena", "Thalente Mbatha", "Yaya Sithole", "Jayden Adams"],
      forwards: ["Oswin Appollis", "Iqraam Rayners", "Tshepang Moremi", "Relebohile Mofokeng", "Evidence Makgopa", "Themba Zwane", "Lyle Foster", "Thapelo Maseko"],
    },
  },
  kor: {
    nickname: "Taeguk Warriors",
    coach: "Hong Myung-Bo",
    history: { appearances: 12, passed_group_stage: 4, quarter_finals: 1, semi_finals: 1, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Jo Hyun-Woo", "Kim Seung-Gyu", "Song Bum-Keun"],
      defenders: ["Kim Min-Jae", "Jo Yu-Min", "Lee Han-Beom", "Kim Tae-Hyun", "Park Jin-Seop", "Lee Ki-Hyeok", "Lee Tae-Seok", "Seol Young-Woo", "Jens Castrop", "Kim Moon-Hwan"],
      midfielders: ["Yang Hyun-Jun", "Paik Seung-Ho", "Hwang In-Beom", "Kim Jin-Kyu", "Bae Jun-Ho", "Um Ji-Sung", "Hwang Hee-Chan", "Lee Dong-Gyeong", "Lee Jae-Sung", "Lee Kang-In"],
      forwards: ["Oh Hyun-Kyu", "Son Heung-Min", "Cho Kyu-Sung"],
    },
  },
  cze: {
    nickname: "Lokomotiva",
    coach: "Miroslav Koubek",
    history: { appearances: 10, passed_group_stage: 4, quarter_finals: 2, semi_finals: 2, finals: 2, wins: 0 },
    squad: {
      goalkeepers: ["Lukas Hornicek", "Jan Koutny", "Jindrich Stanek"],
      defenders: ["Vladimír Coufal", "David Douděra", "Tomáš Holeš", "Robin Hranáč", "Štěpán Chaloupek", "David Jurásek", "Ladislav Krejčí", "Jaroslav Zelený", "David Zima"],
      midfielders: ["Lukáš Červ", "Vladimír Darida", "Lukáš Provod", "Michal Sadílek", "Hugo Sochůrek", "Alexandr Sojka", "Tomáš Souček"],
      forwards: ["Adam Hložek", "Tomáš Chorý", "Mojmír Chytil", "Jan Kuchta", "Patrik Schick", "Matěj Vydra", "Denis Višinský"],
    },
  },
  can: {
    nickname: "Les Rouges",
    coach: "Jesse Marsch",
    history: { appearances: 3, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Dayne St. Clair", "Maxime Crépeau", "Owen Goodman"],
      defenders: ["Moïse Bombito", "Derek Cornelius", "Alphonso Davies", "Luc De Fougerolles", "Alistair Johnston", "Alfie Jones", "Richie Laryea", "Niko Sigur", "Joel Waterman"],
      midfielders: ["Ali Ahmed", "Tajon Buchanan", "Mathieu Choinière", "Stephen Eustáquio", "Marcelo Flores", "Ismaël Koné", "Liam Millar", "Jonathan Osorio", "Nathan Saliba", "Jacob Shaffelburg"],
      forwards: ["Jonathan David", "Promise David", "Cyle Larin", "Tani Oluwaseyi"],
    },
  },
  bih: {
    nickname: "Zmajevi",
    coach: "Sergej Barbarez",
    history: { appearances: 2, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Nikola Vasilj", "Martin Zlomislic", "Osman Hadzikic"],
      defenders: ["Sead Kolasinac", "Amar Dedic", "Nihad Mujakic", "Nikola Katic", "Tarik Muharemovic", "Stjepan Radeljic", "Dennis Hadzikadunic", "Nidal Celik"],
      midfielders: ["Amir Hadziahmetovic", "Ivan Sunjic", "Ivan Basic", "Dzenis Burnic", "Ermin Mahmic", "Benjamin Tahirovic", "Amar Memic", "Armin Gigovic", "Kerim Alajbegovic", "Esmir Bajraktarevic"],
      forwards: ["Ermedin Demirovic", "Jovo Lukic", "Samed Bazdar", "Haris Tabakovic", "Edin Dzeko"],
    },
  },
  qat: {
    nickname: "The Maroons",
    coach: "Julen Lopetegui",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Salah Zakaria", "Meshaal Barsham", "Mahmoud Abunada"],
      defenders: ["Boualem Khoukhi", "Pedro Miguel", "Sultan Al Brake", "Al-Hashmi Al-Hussain", "Ayoub Al-Alawi", "Issa Laye", "Lucas Mendes", "Homam Al-Amin"],
      midfielders: ["Ahmed Fathi", "Jassim Gaber", "Assim Madibo", "Abdulaziz Hatem", "Karim Boudiaf", "Mohammed Mannai"],
      forwards: ["Almoez Ali", "Akram Afif", "Tahsin Mohammed", "Edmílson Junior", "Ahmed Al-Ganehi", "Ahmed Alaa", "Hassan Al-Haydos", "Mohammed Muntari", "Yusuf Abdurisag"],
    },
  },
  che: {
    nickname: "La Nati",
    coach: "Murat Yakin",
    history: { appearances: 13, passed_group_stage: 8, quarter_finals: 3, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Gregor Kobel", "Yvon Mvogo", "Marvin Keller"],
      defenders: ["Manuel Akanji", "Nico Elvedi", "Ricardo Rodriguez", "Silvan Widmer", "Miro Muheim", "Aurèle Amenda", "Eray Cömert", "Luca Jaquez"],
      midfielders: ["Granit Xhaka", "Johan Manzambi", "Remo Freuler", "Denis Zakaria", "Ardon Jashari", "Djibril Sow", "Christian Fassnacht", "Michel Aebischer", "Fabian Rieder", "Rubén Vargas"],
      forwards: ["Breel Embolo", "Noah Okafor", "Dan Ndoye", "Zeki Amdouni", "Cedric Itten"],
    },
  },
  bra: {
    nickname: "A Canarinha",
    coach: "Carlo Ancelotti",
    history: { appearances: 23, passed_group_stage: 20, quarter_finals: 14, semi_finals: 9, finals: 7, wins: 5 },
    squad: {
      goalkeepers: ["Alisson", "Éderson", "Weverton"],
      defenders: ["Alex Sandro", "Bremer", "Danilo", "Douglas Santos", "Gabriel Magalhães", "Léo Pereira", "Marquinhos", "Roger Ibañez", "Wesley"],
      midfielders: ["Bruno Guimarães", "Casemiro", "Danilo Santos", "Fabinho", "Lucas Paquetá"],
      forwards: ["Endrick", "Gabriel Martinelli", "Igor Thiago", "Luiz Henrique", "Matheus Cunha", "Neymar", "Raphinha", "Rayan", "Vinícius Júnior"],
    },
  },
  hai: {
    nickname: "Les Grenadiers",
    coach: "Sebastien Migne",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Johny Placide", "Alexandre Pierre", "Josue Duverger"],
      defenders: ["Carlens Arcus", "Wilguens Paugain", "Duke Lacroix", "Martin Expérience", "Jean-Kévin Duverne", "Ricardo Adé", "Hannes Delcroix", "Keeto Thermoncy"],
      midfielders: ["Carl Fred Sainté", "Leverton Pierre", "Danley Jean Jacques", "Jean-Ricner Bellegarde", "Woodensky Pierre", "Dominique Simon"],
      forwards: ["Don Deedson Louicius", "Josué Casimir", "Derrick Etienne", "Ruben Providence", "Duckens Nazon", "Frantzdy Pierrot", "Wilson Isidor", "Yassin Fortuné", "Lenny Joseph"],
    },
  },
  mar: {
    nickname: "Atlas Lions",
    coach: "Mohamed Ouahbi",
    history: { appearances: 7, passed_group_stage: 2, quarter_finals: 1, semi_finals: 1, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Yassine Bounou", "Munir El Kajoui", "Reda Tagnaouti"],
      defenders: ["Noussair Mazraoui", "Anass Salah-Eddine", "Youssef Belammari", "Achraf Hakimi", "Zakaria El Ouahdi", "Chadi Riad", "Nayef Aguerd", "Redouane Halhal", "Issa Diop"],
      midfielders: ["Samir El Mourabet", "Ayyoub Bouaddi", "Neil El Aynaoui", "Sofyan Amrabat", "Azzedine Ounahi", "Bilal El Khannouss", "Ismael Saibari"],
      forwards: ["Abde Ezzalzouli", "Chemsdine Talbi", "Soufiane Rahimi", "Ayoub El Kaabi", "Brahim Díaz", "Gessime Yassine", "Ayoube Amaimouni"],
    },
  },
  sco: {
    nickname: "The Tartan Terriers",
    coach: "Steve Clarke",
    history: { appearances: 9, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Craig Gordon", "Angus Gunn", "Liam Kelly"],
      defenders: ["Grant Hanley", "Jack Hendry", "Aaron Hickey", "Dom Hyam", "Scott McKenna", "Nathan Patterson", "Anthony Ralston", "Andy Robertson", "John Souttar", "Kieran Tierney"],
      midfielders: ["Ryan Christie", "Finlay Curtis", "Lewis Ferguson", "Ben Gannon-Doak", "Billy Gilmour", "John McGinn", "Kenny McLean", "Scott McTominay"],
      forwards: ["Ché Adams", "Lyndon Dykes", "George Hirst", "Lawrence Shankland", "Ross Stewart"],
    },
  },
  usa: {
    nickname: "Stars and Stripes",
    coach: "Mauricio Pochettino",
    history: { appearances: 12, passed_group_stage: 6, quarter_finals: 1, semi_finals: 1, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Chris Brady", "Matt Freese", "Matt Turner"],
      defenders: ["Max Arfsten", "Sergiño Dest", "Alex Freeman", "Mark McKenzie", "Tim Ream", "Chris Richards", "Antonee Robinson", "Miles Robinson", "Joe Scally", "Auston Trusty"],
      midfielders: ["Tyler Adams", "Sebastian Berhalter", "Weston McKennie", "Cristian Roldan", "Brenden Aaronson", "Malik Tillman", "Tim Weah", "Alejandro Zendejas"],
      forwards: ["Christian Pulisic", "Gio Reyna", "Folarin Balogun", "Ricardo Pepi", "Haji Wright"],
    },
  },
  pry: {
    nickname: "La Albirroja",
    coach: "Gustavo Alfaro",
    history: { appearances: 9, passed_group_stage: 2, quarter_finals: 1, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Carlos Coronel", "Gatito Fernández", "Santiago Rojas"],
      defenders: ["Omar Alderete", "Gustavo Gómez", "Fabián Balbuena", "Matías Espinoza", "Júnior Alonso", "Diego Gómez", "Mathías Villasanti", "Iván Ramírez"],
      midfielders: ["Miguel Almirón", "Andrés Cubas", "Hugo Quintana", "Damián Bobadilla", "Julio Enciso", "Hernesto Caballero"],
      forwards: ["Antonio Sanabria", "Ángel Romero", "Adam Bareiro", "Ramón Sosa", "Dionicio Pérez", "Alex Arce"],
    },
  },
  aus: {
    nickname: "Socceroos",
    coach: "Tony Popovic",
    history: { appearances: 7, passed_group_stage: 2, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Mathew Ryan", "Paul Izzo", "Patrick Beach"],
      defenders: ["Jordan Bos", "Aziz Behich", "Harry Souttar", "Alessandro Circati", "Lucas Herrington", "Cameron Burgess", "Kai Trewin", "Milos Degenek", "Jason Geria", "Jacob Italiano"],
      midfielders: ["Jackson Irvine", "Aiden O'Neill", "Paul Okon Jr", "Cameron Devlin"],
      forwards: ["Connor Metcalfe", "Mathew Leckie", "Nishan Velupillay", "Cristian Volpato", "Nestory Irankunda", "Awer Mabil", "Ajdin Hrustic", "Mohamed Toure", "Tete Yengi"],
    },
  },
  tur: {
    nickname: "Ay-Yıldızlılar",
    coach: "Vincenzo Montella",
    history: { appearances: 3, passed_group_stage: 1, quarter_finals: 1, semi_finals: 1, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Mert Günok", "Uğurcan Çakır", "Altay Bayındır"],
      defenders: ["Mert Müldür", "Zeki Çelik", "Abdülkerim Bardakcı", "Samet Akaydin", "Ferdi Kadıoğlu", "Ahmetcan Kaplan", "Eren Elmalı", "Kaan Ayhan"],
      midfielders: ["Hakan Çalhanoğlu", "Orkun Kökçü", "Salih Özcan", "İrfan Can Kahveci", "Arda Güler", "Kenan Yıldız", "Yusuf Yazıcı", "Okay Yokuşlu"],
      forwards: ["Cenk Tosun", "Kerem Aktürkoğlu", "Barış Alper Yılmaz", "Semih Kılıçsoy", "Enes Ünal", "Bertuğ Yıldırım"],
    },
  },
  deu: {
    nickname: "Die Mannschaft",
    coach: "Julian Nagelsmann",
    history: { appearances: 21, passed_group_stage: 18, quarter_finals: 16, semi_finals: 13, finals: 8, wins: 4 },
    squad: {
      goalkeepers: ["Manuel Neuer", "Marc-André ter Stegen", "Oliver Baumann"],
      defenders: ["Joshua Kimmich", "Antonio Rüdiger", "Jonathan Tah", "Nico Schlotterbeck", "David Raum", "Benjamin Henrichs", "Robin Koch", "Waldemar Anton", "Maximilian Mittelstädt"],
      midfielders: ["Ilkay Gündogan", "Jamal Musiala", "Florian Wirtz", "Kai Havertz", "Leon Goretzka", "Pascal Groß", "Emre Can", "Chris Führich"],
      forwards: ["Niclas Füllkrug", "Leroy Sané", "Serge Gnabry", "Timo Werner", "Deniz Undav", "Maximilian Beier"],
    },
  },
  civ: {
    nickname: "Les Éléphants",
    coach: "Emerse Faé",
    history: { appearances: 4, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Yahia Fofana", "Mohamed Kone", "Alban Lafont"],
      defenders: ["Emmanuel Agbadou", "Clement Akpa", "Ousmane Diomande", "Guela Doue", "Ghislain Konan", "Odilon Kossonou", "Evan Ndicka", "Wilfried Singo"],
      midfielders: ["Seko Fofana", "Parfait Guiagon", "Franck Kessie", "Christ Oulai", "Ibrahim Sangare", "Jean-Michael Seri"],
      forwards: ["Simon Adingra", "Ange-Yoan Bonny", "Amad Diallo", "Oumar Diakite", "Yan Diomande", "Evann Guessand", "Nicolas Pepe", "Bazoumana Toure", "Elye Wahi"],
    },
  },
  ecu: {
    nickname: "La Tri",
    coach: "Sebastián Beccacece",
    history: { appearances: 5, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Hernán Galíndez", "Alexander Domínguez", "Moisés Ramírez"],
      defenders: ["Piero Hincapié", "William Pacho", "Felix Torres", "Jackson Porozo", "Ángelo Preciado", "Layan Loor", "José Hurtado", "Jhoanner Chávez"],
      midfielders: ["Moisés Caicedo", "Alan Franco", "Joao Ortiz", "Jeremy Sarmiento", "Kendry Páez", "Janner Corozo", "Jhegson Méndez"],
      forwards: ["Enner Valencia", "Jordy Caicedo", "Kevin Rodríguez", "Ángel Mena", "John Yeboah", "Djorkaeff Reasco"],
    },
  },
  cuw: {
    nickname: "The Blue Wave",
    coach: "Dick Advocaat",
    history: { appearances: 1, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Eloy Room", "Trevor Doornbusch", "Joshua Brenet"],
      defenders: ["Jurien Gaari", "Nathan Holder", "Roshon van Eijma", "Sherel Floranus", "Darryl Lachman"],
      midfielders: ["Leandro Bacuna", "Vurnon Anita", "Kenji Gorré", "Elson Hooi", "Juninho Bacuna", "Michaël Maria"],
      forwards: ["Rangelo Janga", "Jürgen Locadia", "Anthony van den Hurk", "Gino van Kessel", "Joshua Zimmerman"],
    },
  },
  nld: {
    nickname: "Oranje",
    coach: "Ronald Koeman",
    history: { appearances: 12, passed_group_stage: 10, quarter_finals: 7, semi_finals: 4, finals: 3, wins: 0 },
    squad: {
      goalkeepers: ["Bart Verbruggen", "Robin Roefs", "Mark Flekken"],
      defenders: ["Jurriën Timber", "Virgil van Dijk", "Nathan Aké", "Jan Paul van Hecke", "Mats Wieffer", "Micky van de Ven", "Denzel Dumfries", "Jorrel Hato"],
      midfielders: ["Marten de Roon", "Justin Kluivert", "Ryan Gravenberch", "Tijjani Reijnders", "Guus Til", "Teun Koopmeiners", "Frenkie de Jong", "Quinten Timber"],
      forwards: ["Wout Weghorst", "Memphis Depay", "Cody Gakpo", "Noa Lang", "Donyell Malen", "Brian Brobbey", "Crysencio Summerville"],
    },
  },
  jpn: {
    nickname: "Samurai Blue",
    coach: "Hajime Moriyasu",
    history: { appearances: 8, passed_group_stage: 4, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Zion Suzuki", "Keisuke Osako", "Tomoki Hayakawa"],
      defenders: ["Yuta Nagatomo", "Shogo Taniguchi", "Ko Itakura", "Tsuyoshi Watanabe", "Takehiro Tomiyasu", "Hiroki Ito", "Ayumu Seko", "Yukinari Sugawara"],
      midfielders: ["Junnosuke Suzuki", "Wataru Endo", "Junya Ito", "Daichi Kamada", "Ritsu Doan", "Ao Tanaka", "Keito Nakamura", "Kaishu Sano", "Takefusa Kubo", "Yuito Suzuki"],
      forwards: ["Koki Ogawa", "Daizen Maeda", "Ayase Ueda", "Kento Shiogai", "Keisuke Goto"],
    },
  },
  swe: {
    nickname: "Blågult",
    coach: "Jon Dahl Tomasson",
    history: { appearances: 13, passed_group_stage: 8, quarter_finals: 6, semi_finals: 4, finals: 1, wins: 0 },
    squad: {
      goalkeepers: ["Robin Olsen", "Kristoffer Nordfeldt", "Viktor Johansson"],
      defenders: ["Victor Nilsson Lindelöf", "Emil Krafth", "Gabriel Gudmundsson", "Hjalmar Ekdal", "Isak Hien", "Carl Starfelt", "Edvin Kurtulus", "Samuel Dahl"],
      midfielders: ["Emil Forsberg", "Dejan Kulusevski", "Mattias Svanberg", "Kristoffer Olsson", "Lucas Bergvall", "Sebastian Nanasi", "Yasin Ayari", "Hugo Larsson"],
      forwards: ["Alexander Isak", "Viktor Gyökeres", "Anthony Elanga", "Jesper Karlsson", "Erik Botheim", "Gustav Engvall"],
    },
  },
  tun: {
    nickname: "Eagles of Carthage",
    coach: "Montasser Louhichi",
    history: { appearances: 7, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Aymen Dahmen", "Sabri Ben Hassan", "Abdelmouhib Chamakh"],
      defenders: ["Montassar Talbi", "Dylan Bronn", "Omar Rekik", "Adem Arous", "Yan Valery", "Moutaz Neffati", "Raed Chikhaoui", "Ali Abdi", "Mohamed Amine Ben Hamida"],
      midfielders: ["Ellyes Skhiri", "Mohamed Hadj-Mahmoud", "Rani Khedira", "Hannibal Mejbri", "Anis Ben Slimane", "Mortadha Ben Ouanes", "Ismaël Gharbi"],
      forwards: ["Khalil Ayari", "Sebastian Tounekti", "Elias Achouri", "Firas Chaouat", "Hazem Mastouri", "Elias Saad", "Rayan Elloumi"],
    },
  },
  bel: {
    nickname: "Red Devils",
    coach: "Rudi Garcia",
    history: { appearances: 15, passed_group_stage: 7, quarter_finals: 3, semi_finals: 2, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Thibaut Courtois", "Senne Lammens", "Mike Penders"],
      defenders: ["Zeno Debast", "Arthur Theate", "Branden Mechele", "Maxim De Cuyper", "Thomas Meunier", "Koni De Winter", "Joaquin Seys", "Timothy Castagne", "Nathan Ngoy"],
      midfielders: ["Axel Witsel", "Kevin De Bruyne", "Youri Tielemans", "Diego Moreira", "Hans Vanaken", "Alexis Saelemaekers", "Nicolas Raskin", "Amadou Onana"],
      forwards: ["Romelu Lukaku", "Leandro Trossard", "Jeremy Doku", "Dodi Lukebakio", "Charles De Ketelaere", "Matias Fernandez-Pardo"],
    },
  },
  egy: {
    nickname: "The Pharaohs",
    coach: "Hossam Hassan",
    history: { appearances: 4, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Mohamed El Shenawy", "El Mahdy Soliman", "Mostafa Shobeir", "Mohamed Alaa"],
      defenders: ["Yasser Ibrahim", "Mohamed Hany", "Hossam Abdelmaguid", "Ramy Rabia", "Mohamed Abdelmonem", "Ahmed Abou El Fotouh", "Karim Hafez", "Tarek Alaa"],
      midfielders: ["Emam Ashour", "Mostafa Ziko", "Hamdy Fathy", "Mohanad Lasheen", "Nabil Emad", "Marwan Attia", "Mahmoud Saber"],
      forwards: ["Trezeguet", "Hamza Abdelkarim", "Mohamed Salah", "Haissem Hassan", "Ibrahim Adel", "Omar Marmoush", "Zizo"],
    },
  },
  irn: {
    nickname: "Team Melli",
    coach: "Amir Ghalenoei",
    history: { appearances: 7, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Alireza Beiranvand", "Hossein Hosseini", "Payam Niazmand"],
      defenders: ["Danial Eiri", "Ehsan Hajsafi", "Saleh Hardani", "Hossein Kanaani", "Shoka Khalilzadeh", "Milad Mohammadi", "Ali Nemati", "Omid Noorafkan", "Ramin Rezaeian"],
      midfielders: ["Rouzbeh Cheshmi", "Saeid Ezatolahi", "Mehdi Ghaedi", "Saman Ghoddos", "Mohammad Ghorbani", "Alireza Jahanbakhsh", "Mohammad Mohebi", "Amir Mohammad Razzaghinia", "Mehdi Torabi", "Aria Yousefi"],
      forwards: ["Ali Alipour", "Dennis Dargahi", "Amirhossein Hosseinzadeh", "Amirhossein Mahmoudi", "Mehdi Taremi"],
    },
  },
  nzl: {
    nickname: "All Whites",
    coach: "Darren Bazeley",
    history: { appearances: 3, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Max Crocombe", "Alex Paulsen", "Michael Woud"],
      defenders: ["Tim Payne", "Francis De Vries", "Tyler Bindon", "Michael Boxall", "Liberato Cacace", "Nando Pijnaker", "Finn Surman", "Callan Elliot", "Tommy Smith"],
      midfielders: ["Joe Bell", "Matt Garbett", "Marko Stamenic", "Sarpreet Singh", "Alex Rufer", "Ryan Thomas"],
      forwards: ["Chris Wood", "Eli Just", "Kosta Barbarouses", "Ben Waine", "Ben Old", "Callum McCowatt", "Jesse Randall", "Lachlan Bayliss"],
    },
  },
  esp: {
    nickname: "La Roja",
    coach: "Luis de la Fuente",
    history: { appearances: 17, passed_group_stage: 11, quarter_finals: 6, semi_finals: 2, finals: 1, wins: 1 },
    squad: {
      goalkeepers: ["David Raya", "Unai Simón", "Álex Remiro"],
      defenders: ["Dani Carvajal", "Aymeric Laporte", "Robin Le Normand", "Pau Cubarsí", "Alejandro Grimaldo", "Marc Cucurella", "Jesús Navas", "Pau Torres"],
      midfielders: ["Rodri", "Fabián Ruiz", "Martín Zubimendi", "Pedri", "Dani Olmo", "Mikel Merino", "Álex Baena", "Nico Williams"],
      forwards: ["Álvaro Morata", "Lamine Yamal", "Ferran Torres", "Joselu", "Gerard Moreno", "Bryan Zaragoza"],
    },
  },
  cpv: {
    nickname: "Tubarões Azuis",
    coach: "Bubista",
    history: { appearances: 1, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Vozinha", "Dinis", "Ivan"],
      defenders: ["Roberto Lopes", "Dylan Tavares", "Steven Moreira", "Jeffry Fortes", "João Paulo Fernandes", "Kelvin Pires", "Diney"],
      midfielders: ["Jamiro Monteiro", "Patrick Andrade", "Laros Duarte", "Kenny Rocha Santos", "Deroy Duarte", "Delmiro"],
      forwards: ["Ryan Mendes", "Jovane Cabral", "Garry Rodrigues", "Bryan Teixeira", "Willy Semedo", "Bebé"],
    },
  },
  sau: {
    nickname: "Green Falcons",
    coach: "Georgios Donis",
    history: { appearances: 7, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Mohammed Al Owais", "Nawaf Al Aqidi", "Ahmed Al Kassar"],
      defenders: ["Abdulelah Al Amri", "Hassan Tambakti", "Jehad Thikri", "Ali Lajami", "Hassan Kadesh", "Saud Abdulhamid", "Mohammed Abu Al Shamat", "Ali Majrashi", "Moteb Al Harbi", "Nawaf Boushal", "Sultan Al-Ghannam"],
      midfielders: ["Mohammed Kanno", "Abdullah Al Khaibari", "Ziyad Al Johani", "Nasser Al Dawsari", "Musab Al Juwayr", "Alaa Al Hajji", "Salem Al Dawsari", "Khalid Al Ghannam", "Ayman Yahya"],
      forwards: ["Firas Al Buraikan", "Saleh Al Shehri", "Abdullah Al Hamdan"],
    },
  },
  uru: {
    nickname: "La Celeste",
    coach: "Marcelo Bielsa",
    history: { appearances: 15, passed_group_stage: 10, quarter_finals: 8, semi_finals: 5, finals: 2, wins: 2 },
    squad: {
      goalkeepers: ["Fernando Muslera", "Sergio Rochet", "Santiago Mele"],
      defenders: ["Ronald Araújo", "José María Giménez", "Santiago Bueno", "Sebastián Cáceres", "Mathías Olivera", "Guillermo Varela", "Matías Viña", "Joaquín Piquerez", "Juan Manuel Sanabria"],
      midfielders: ["Federico Valverde", "Rodrigo Bentancur", "Manuel Ugarte", "Emiliano Martínez", "Rodrigo Zalazar", "Giorgian De Arrascaeta", "Nicolás De La Cruz", "Agustín Canobbio", "Maximiliano Araújo", "Brian Rodríguez", "Facundo Pellistri"],
      forwards: ["Darwin Núñez", "Federico Viñas", "Rodrigo Aguirre"],
    },
  },
  fra: {
    nickname: "Les Bleus",
    coach: "Didier Deschamps",
    history: { appearances: 17, passed_group_stage: 9, quarter_finals: 8, semi_finals: 7, finals: 4, wins: 2 },
    squad: {
      goalkeepers: ["Mike Maignan", "Brice Samba", "Lucas Chevalier"],
      defenders: ["Jules Koundé", "Dayot Upamecano", "Ibrahima Konaté", "William Saliba", "Théo Hernández", "Ferland Mendy", "Jonathan Clauss", "Leny Yoro"],
      midfielders: ["Aurélien Tchouaméni", "Eduardo Camavinga", "Youssouf Fofana", "Warren Zaïre-Emery", "Manu Koné", "Khéphren Thuram", "Bradley Barcola", "Rayan Cherki"],
      forwards: ["Kylian Mbappé", "Ousmane Dembélé", "Randal Kolo Muani", "Marcus Thuram", "Kingsley Coman", "Désiré Doué"],
    },
  },
  sen: {
    nickname: "Lions of Teranga",
    coach: "Aliou Cissé",
    history: { appearances: 4, passed_group_stage: 2, quarter_finals: 1, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Édouard Mendy", "Alfred Gomis", "Pape Mamadou Sy"],
      defenders: ["Kalidou Koulibaly", "Abdou Diallo", "Formose Mendy", "Youssouf Sabaly", "Fodé Ballo-Touré", "Nampalys Mendy", "Moussa Niakhaté"],
      midfielders: ["Idrissa Gueye", "Cheikhou Kouyaté", "Pape Matar Sarr", "Lamine Camara", "Pathé Cissé", "Pape Gueye"],
      forwards: ["Sadio Mané", "Ismaïla Sarr", "Nicolas Jackson", "Boulaye Dia", "Habib Diallo", "Pape Ousmane Sakho"],
    },
  },
  irq: {
    nickname: "Lions of Mesopotamia",
    coach: "Graham Arnold",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Fahad Talib", "Jalal Hassan", "Ahmed Basil"],
      defenders: ["Hussein Ali", "Manaf Younis", "Zaid Tahseen", "Rebin Sulaka", "Akam Hashem", "Merchas Doski", "Ahmed Yahya", "Zaid Ismail", "Frans Putros", "Mustafa Saadoon"],
      midfielders: ["Amir Al-Ammari", "Kevin Yakob", "Zidane Iqbal", "Aimar Sher", "Ibrahim Bayesh", "Ahmed Qasim", "Youssef Amyn", "Marko Farji"],
      forwards: ["Ali Jasim", "Ali Al-Hamadi", "Ali Yousef", "Aymen Hussein", "Mohanad Ali"],
    },
  },
  nor: {
    nickname: "Landslaget",
    coach: "Ståle Solbakken",
    history: { appearances: 4, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Ørjan Nyland", "Egil Selvik", "Sander Tangvik"],
      defenders: ["Julian Ryerson", "Kristoffer Ajer", "Leo Østigård", "David Møller Wolfe", "Marcus Pedersen", "Torbjørn Heggem", "Fredrik André Bjørkan", "Henrik Falchener", "Sondre Langås"],
      midfielders: ["Martin Ødegaard", "Sander Berge", "Patrick Berg", "Kristian Thorstvedt", "Morten Thorsby", "Thelo Aasgaard", "Andreas Schjelderup", "Jens Petter Hauge", "Fredrik Aursnes", "Oscar Bobb", "Antonio Nusa"],
      forwards: ["Erling Haaland", "Alexander Sørloth", "Jørgen Strand Larsen"],
    },
  },
  arg: {
    nickname: "La Albiceleste",
    coach: "Lionel Scaloni",
    history: { appearances: 19, passed_group_stage: 13, quarter_finals: 9, semi_finals: 6, finals: 6, wins: 3 },
    squad: {
      goalkeepers: ["Emiliano Martínez", "Franco Armani", "Gerónimo Rulli"],
      defenders: ["Nahuel Molina", "Cristian Romero", "Nicolás Otamendi", "Lisandro Martínez", "Marcos Acuña", "Nicolás Tagliafico", "Gonzalo Montiel"],
      midfielders: ["Rodrigo De Paul", "Leandro Paredes", "Enzo Fernández", "Giovani Lo Celso", "Alexis Mac Allister", "Exequiel Palacios", "Thiago Almada", "Nico Paz"],
      forwards: ["Lionel Messi", "Lautaro Martínez", "Julián Álvarez", "Nicolás González", "Paulo Dybala", "Giuliano Simeone", "Valentín Carboni", "Alejandro Garnacho"],
    },
  },
  dza: {
    nickname: "Les Fennecs",
    coach: "Vladimir Petković",
    history: { appearances: 5, passed_group_stage: 1, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Anthony Mandrea", "Raïs M'Bolhi", "Oussama Benbot"],
      defenders: ["Youcef Atal", "Rayan Aït-Nouri", "Aïssa Mandi", "Ramiz Zerrouki", "Mohamed Amine Tougai", "Jaouen Hadjam", "Houcine Benayada"],
      midfielders: ["Sofiane Feghouli", "Ismaël Bennacer", "Hicham Boudaoui", "Adem Zorgane", "Nabil Bentaleb", "Farès Chaïbi", "Amine Gouiri"],
      forwards: ["Riyad Mahrez", "Saïd Benrahma", "Islam Slimani", "Baghdad Bounedjah", "Mohamed Amoura", "Youcef Belaïli"],
    },
  },
  aut: {
    nickname: "Das Team",
    coach: "Ralf Rangnick",
    history: { appearances: 8, passed_group_stage: 4, quarter_finals: 2, semi_finals: 2, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Patrick Pentz", "Heinz Lindner", "Christian Früchtl"],
      defenders: ["Phillipp Lienhart", "Kevin Danso", "Maximilian Wöber", "Stefan Posch", "Flavius Daniliuc", "Gernot Trauner", "Philipp Mwene", "Andreas Ulmer"],
      midfielders: ["Marcel Sabitzer", "Konrad Laimer", "Florian Grillitsch", "Romano Schmid", "Christoph Baumgartner", "Patrick Wimmer", "Muhammed Cham", "Nicolas Seiwald"],
      forwards: ["Marko Arnautović", "Michael Gregoritsch", "Saša Kalajdžić", "Philipp Hosiner", "Manfred Fischer", "Andreas Weimann"],
    },
  },
  jor: {
    nickname: "Al-Nashama",
    coach: "Hussein Ammouta",
    history: { appearances: 1, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Yazid Abu Layla", "Abdullah Al-Fakhouri", "Ahmad Al-Juaidi"],
      defenders: ["Yazan Al-Arab", "Mohammad Abu Hashish", "Anas Bani Yaseen", "Ihsan Haddad", "Baraa Marei", "Feras Shelbaieh", "Mohammad Al-Masri"],
      midfielders: ["Noor Al-Rawabdeh", "Rajaei Ayed", "Mahmoud Al-Mardi", "Ibrahim Sadeh", "Mohammad Abu Zrayq", "Saleh Rateb"],
      forwards: ["Musa Al-Taamari", "Yazan Al-Naimat", "Ali Olwan", "Hamza Al-Dardour", "Ahmad Arslan"],
    },
  },
  prt: {
    nickname: "A Seleção das Quinas",
    coach: "Roberto Martínez",
    history: { appearances: 9, passed_group_stage: 5, quarter_finals: 2, semi_finals: 2, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Diogo Costa", "Jose Sa", "Rui Silva"],
      defenders: ["Ruben Dias", "Joao Cancelo", "Nelson Semedo", "Nuno Mendes", "Diogo Dalot", "Goncalo Inacio", "Renato Veiga", "Tomas Araujo"],
      midfielders: ["Bernardo Silva", "Bruno Fernandes", "Ruben Neves", "Vitinha", "Joao Neves", "Matheus Nunes", "Francisco Trincao", "Samu Costa"],
      forwards: ["Cristiano Ronaldo", "Joao Felix", "Rafael Leao", "Goncalo Guedes", "Goncalo Ramos", "Pedro Neto", "Francisco Conceicao"],
    },
  },
  cod: {
    nickname: "Les Léopards",
    coach: "Sébastien Desabre",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Lionel Mpasi", "Timothy Fayulu", "Matthieu Epolo"],
      defenders: ["Chancel Mbemba", "Arthur Masuaku", "Gedeon Kalulu", "Joris Kayembe", "Dylan Batubinsika", "Axel Tuanzebe", "Aaron Wan-Bissaka", "Steve Kapuadi"],
      midfielders: ["Meschak Elia", "Samuel Moutoussamy", "Edo Kayembe", "Theo Bongonda", "Charles Pickel", "Gael Kakuta", "Noah Sadiki", "Nathanael Mbuku", "Aaron Tshibola", "Ngal'ayel Mukau", "Brian Cipenga"],
      forwards: ["Cedric Bakambu", "Fiston Mayele", "Yoane Wissa", "Simon Banza"],
    },
  },
  col: {
    nickname: "Los Cafeteros",
    coach: "Néstor Lorenzo",
    history: { appearances: 7, passed_group_stage: 3, quarter_finals: 1, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["David Ospina", "Camilo Vargas", "Álvaro Montero"],
      defenders: ["Davinson Sánchez", "Yerry Mina", "Jhon Lucumí", "Santiago Arias", "Johan Mojica", "Daniel Muñoz", "Carlos Cuesta", "Deiver Machado"],
      midfielders: ["James Rodríguez", "Juan Cuadrado", "Mateus Uribe", "Jefferson Lerma", "Richard Ríos", "Jhon Arias", "Kevin Castaño", "Gustavo Puerta"],
      forwards: ["Luis Díaz", "Radamel Falcao", "Rafael Santos Borré", "Jhon Córdoba", "Luis Sinisterra", "Jhon Durán"],
    },
  },
  uzb: {
    nickname: "White Wolves",
    coach: "Timur Kapadze",
    history: { appearances: 1, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Utkir Yusupov", "Abduvohid Nematov", "Botirali Ergashev"],
      defenders: ["Rustam Ashurmatov", "Farrukh Sayfiev", "Khojiakbar Alijonov", "Sherzod Nasrullaev", "Umar Eshmurodov", "Abdukodir Khusanov", "Abdulla Abdullaev", "Bekhruz Karimov", "Jakhongir Urozov", "Avazbek Ulmasaliev"],
      midfielders: ["Otabek Shukurov", "Jaloliddin Masharipov", "Odiljon Hamrobekov", "Oston Urunov", "Jamshid Iskanderov", "Dostonbek Khamdamov", "Abbosbek Fayzullaev", "Akmal Mozgovoy", "Azizjon Ganiev", "Sherzod Esanov"],
      forwards: ["Eldor Shomurodov", "Igor Sergeev", "Azizbek Amonov"],
    },
  },
  eng: {
    nickname: "Three Lions",
    coach: "Thomas Tuchel",
    history: { appearances: 17, passed_group_stage: 11, quarter_finals: 8, semi_finals: 2, finals: 1, wins: 1 },
    squad: {
      goalkeepers: ["Jordan Pickford", "Dean Henderson", "James Trafford"],
      defenders: ["Ezri Konsa", "Nico O'Reilly", "John Stones", "Marc Guehi", "Tino Livramento", "Dan Burn", "Reece James", "Djed Spence", "Jarell Quansah"],
      midfielders: ["Declan Rice", "Elliot Anderson", "Jude Bellingham", "Jordan Henderson", "Kobbie Mainoo", "Morgan Rogers", "Eberechi Eze"],
      forwards: ["Bukayo Saka", "Harry Kane", "Marcus Rashford", "Anthony Gordon", "Ollie Watkins", "Noni Madueke", "Ivan Toney"],
    },
  },
  hrv: {
    nickname: "Vatreni",
    coach: "Zlatko Dalić",
    history: { appearances: 7, passed_group_stage: 3, quarter_finals: 3, semi_finals: 3, finals: 1, wins: 0 },
    squad: {
      goalkeepers: ["Dominik Livaković", "Dominik Kotarski", "Ivo Pandur"],
      defenders: ["Joško Gvardiol", "Duje Ćaleta-Car", "Josip Šutalo", "Josip Stanišić", "Marin Pongračić", "Martin Erlić", "Luka Vušković"],
      midfielders: ["Luka Modrić", "Mateo Kovačić", "Mario Pašalić", "Nikola Vlašić", "Luka Sučić", "Martin Baturina", "Kristijan Jakić", "Petar Sučić", "Nikola Moro", "Toni Fruk"],
      forwards: ["Ivan Perišić", "Andrej Kramarić", "Ante Budimir", "Marco Pašalić", "Petar Musa", "Igor Matanović"],
    },
  },
  gha: {
    nickname: "Black Stars",
    coach: "Carlos Queiroz",
    history: { appearances: 5, passed_group_stage: 2, quarter_finals: 1, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Lawrence Ati-Zigi", "Benjamin Asare", "Joseph Anang"],
      defenders: ["Abdul Rahman Baba", "Gideon Mensah", "Alidu Seidu", "Jerome Opoku", "Jonas Adjetey", "Abdul Mumin", "Kojo Oppong Peprah", "Marvin Senaya", "Derrick Luckassen"],
      midfielders: ["Thomas Partey", "Abdul Fatawu Issahaku", "Elisha Owusu", "Caleb Yirenkyi", "Kwasi Sibo", "Augustine Boakye"],
      forwards: ["Jordan Ayew", "Antoine Semenyo", "Kamaldeen Sulemana", "Iñaki Williams", "Ernest Nuamah", "Christopher Bonsu Baah", "Brandon Thomas-Asante", "Prince Kwabena Adu"],
    },
  },
  pan: {
    nickname: "Los Canaleros",
    coach: "Thomas Christiansen",
    history: { appearances: 2, passed_group_stage: 0, quarter_finals: 0, semi_finals: 0, finals: 0, wins: 0 },
    squad: {
      goalkeepers: ["Luis Mejía", "Orlando Mosquera", "César Samudio"],
      defenders: ["Eric Davis", "Fidel Escobar", "Michael Amir Murillo", "Roderick Miller", "Andres Andrade", "Cesar Blackman", "Jose Cordoba", "Jiovany Ramos", "Jorge Gutierrez", "Edgardo Farina"],
      midfielders: ["Anibal Godoy", "Alberto Quintero", "Yoel Barcenas", "Adalberto Carrasquilla", "Jose Luis Rodriguez", "Cristian Martinez", "Cesar Yanis", "Carlos Harvey", "Azarias Londono"],
      forwards: ["Jose Fajardo", "Ismael Diaz", "Cecilio Waterman", "Tomas Rodriguez"],
    },
  },
};
