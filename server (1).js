"use strict";
/*
  Imposter Lineup: multiplayer server. No dependencies, needs Node 18 or newer.
  Run:  node server.js   then open http://localhost:3000
  Lobbies live in memory, so they reset when the server restarts.
*/
const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 12;
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const PACKS = {
  animals: { name: "Animals", words: ["Elephant","Penguin","Octopus","Giraffe","Kangaroo","Dolphin","Peacock","Camel","Owl","Tiger","Crocodile","Flamingo","Hedgehog","Squirrel","Cobra","Jellyfish","Panda","Bat","Rhinoceros","Parrot","Seahorse","Monkey","Buffalo","Turtle"] },
  food: { name: "Food and drink", words: ["Pizza","Sushi","Pancake","Noodles","Burger","Chocolate","Popcorn","Lemonade","Sandwich","Ice cream","Omelette","Dumpling","Pasta","Watermelon","Coffee","Cheese","Mango","Waffle","Soup","Taco","Cupcake","Pickle","Smoothie","Salad"] },
  places: { name: "Places", words: ["Airport","Library","Hospital","Cinema","Beach","Museum","Railway station","Zoo","Supermarket","Stadium","Bakery","Hotel","Farm","Lighthouse","Desert","Waterfall","Playground","Bank","Gym","Castle","Island","Jungle","School","Post office"] },
  jobs: { name: "Jobs", words: ["Doctor","Pilot","Chef","Farmer","Teacher","Plumber","Detective","Barber","Astronaut","Tailor","Lawyer","Electrician","Journalist","Dentist","Carpenter","Magician","Postman","Fisherman","Architect","Mechanic","Singer","Firefighter","Judge","Cashier"] },
  objects: { name: "Everyday objects", words: ["Umbrella","Toothbrush","Scissors","Pillow","Mirror","Backpack","Candle","Remote control","Key","Spectacles","Bucket","Kettle","Ladder","Wallet","Clock","Hammer","Broom","Sofa","Charger","Headphones","Notebook","Torch","Blanket","Comb"] },
  sports: { name: "Sports", words: ["Cricket","Football","Badminton","Tennis","Swimming","Hockey","Chess","Boxing","Cycling","Kabaddi","Archery","Basketball","Wrestling","Golf","Volleyball","Skating","Surfing","Table tennis","Marathon","Gymnastics","Rowing","Skiing","Polo","Carrom"] },
  desi: { name: "Desi life", words: ["Chai","Auto-rickshaw","Samosa","Diwali","Monsoon","Biryani","Dosa","Rangoli","Jalebi","Pani puri","Holi","Taj Mahal","Tiffin","Lassi","Cricket bat","Mehndi","Bollywood","Local train","Banyan tree","Kite","Baraat","Temple bell","Sari","Ludo","Paratha","Mango pickle","Dhaba","Ceiling fan"] },
  marvel: { name: "Marvel", words: ["Iron Man","Thor","Hulk","Black Widow","Spider-Man","Black Panther","Doctor Strange","Thanos","Loki","Captain America","Wakanda","Infinity Stones","Hawkeye","Ant-Man","Groot","Rocket Raccoon","Deadpool","Wolverine","Mjolnir","Vibranium","Avengers Tower","Scarlet Witch","Nick Fury","Captain Marvel","Ultron","Asgard"] },
  starwars: { name: "Star Wars", words: ["Lightsaber","Darth Vader","Yoda","Millennium Falcon","Death Star","Tatooine","Chewbacca","Stormtrooper","Jedi","Han Solo","R2-D2","C-3PO","Baby Yoda","Mandalorian","Princess Leia","X-wing","Jabba the Hutt","Obi-Wan","The Force","Wookiee","Ewok","Hoth","Kylo Ren","Sith","Blaster","BB-8"] },
  pokemon: { name: "Pokémon", words: ["Pikachu","Charizard","Bulbasaur","Squirtle","Eevee","Snorlax","Mewtwo","Jigglypuff","Gengar","Magikarp","Psyduck","Meowth","Lucario","Gyarados","Pokéball","Ash Ketchum","Team Rocket","Pokédex","Gym Leader","Charmander","Togepi","Onix","Mimikyu","Rayquaza","Poké Center","Machamp"] },
  anime: { name: "Anime", words: ["Naruto","Goku","Luffy","Sailor Moon","Death Note","Totoro","Attack on Titan","Demon Slayer","Doraemon","Shinchan","Spirited Away","Dragon Ball","One Piece","Pikachu","Sasuke","Light Yagami","Tanjiro","Studio Ghibli","Fullmetal Alchemist","Hunter x Hunter","Sensei","Ramen shop","Ninja","Samurai"] },
  harrypotter: { name: "Harry Potter", words: ["Hogwarts","Quidditch","Golden Snitch","Butterbeer","Dumbledore","Hermione","Voldemort","Dementor","Sorting Hat","Platform 9¾","Hagrid","Patronus","Invisibility Cloak","Gringotts","Hedwig","Polyjuice Potion","Diagon Alley","Snape","Horcrux","Hogsmeade","Marauder's Map","Dobby","Basilisk","Whomping Willow"] },
  disney: { name: "Disney and Pixar", words: ["Elsa","Simba","Woody","Buzz Lightyear","Nemo","Mickey Mouse","Aladdin","Moana","Genie","Rapunzel","Olaf","Stitch","Mulan","Cinderella","Wall-E","Lightning McQueen","Baloo","Scar","Ariel","Maui","Dory","Mike Wazowski","Belle","Pumbaa"] },
  games: { name: "Video games", words: ["Minecraft","Mario","Zelda","Fortnite","Among Us","Pac-Man","Tetris","Sonic","GTA","Roblox","Free Fire","BGMI","Candy Crush","Subway Surfers","Angry Birds","FIFA","Valorant","Call of Duty","Temple Run","Counter-Strike","Creeper","Battle royale","Joystick","Boss fight"] },
  movies: { name: "Movies and shows", words: ["Titanic","Avatar","Jurassic Park","Squid Game","Stranger Things","Sholay","3 Idiots","Baahubali","Frozen","The Lion King","Money Heist","Friends","Game of Thrones","Lord of the Rings","Batman","Inception","Interstellar","RRR","Dangal","Harry Potter","The Matrix","Breaking Bad","Naruto","Mission Impossible"] }
};
const PACK_LIST = [{ key: "mix", name: "Mixed" }].concat(Object.keys(PACKS).map((k) => ({ key: k, name: PACKS[k].name })));

/* The imposter's look-alike word, in the same order as each pack's words above. */
const DECOYS = {
  animals: ["Hippo","Puffin","Squid","Zebra","Wallaby","Shark","Pheasant","Llama","Eagle","Lion","Alligator","Stork","Porcupine","Chipmunk","Python","Starfish","Koala","Bird","Hippo","Crow","Eel","Gorilla","Bison","Tortoise"],
  food: ["Flatbread","Sashimi","Crepe","Spaghetti","Hot dog","Caramel","Chips","Orange juice","Wrap","Frozen yogurt","Scrambled eggs","Momo","Macaroni","Melon","Tea","Butter","Papaya","Donut","Stew","Burrito","Muffin","Olive","Milkshake","Coleslaw"],
  places: ["Bus stand","Bookshop","Clinic","Theatre","Lake","Art gallery","Metro station","Aquarium","Mall","Arena","Cafe","Hostel","Ranch","Watchtower","Savannah","River","Park","Insurance office","Yoga studio","Palace","Peninsula","Forest","College","Courier office"],
  jobs: ["Nurse","Air hostess","Baker","Gardener","Professor","Welder","Police officer","Hairdresser","Scientist","Weaver","Notary","Technician","Editor","Surgeon","Mason","Clown","Courier","Sailor","Engineer","Driver","Dancer","Paramedic","Magistrate","Accountant"],
  objects: ["Raincoat","Hairbrush","Knife","Cushion","Window","Suitcase","Lamp","Game controller","Lock","Sunglasses","Mug","Pressure cooker","Stairs","Purse","Watch","Screwdriver","Mop","Armchair","Power bank","Earphones","Diary","Lantern","Quilt","Brush"],
  sports: ["Baseball","Rugby","Squash","Badminton","Diving","Ice hockey","Checkers","Kickboxing","Jogging","Kho-kho","Shooting","Netball","Judo","Mini golf","Handball","Rollerblading","Paddleboarding","Pickleball","Sprint","Yoga","Canoeing","Snowboarding","Horse racing","Billiards"],
  desi: ["Coffee","Taxi","Kachori","Navratri","Cyclone","Pulao","Uttapam","Kolam","Imarti","Bhel puri","Lohri","Red Fort","Lunchbox","Buttermilk","Hockey stick","Tattoo","Hollywood","Metro","Peepal tree","Balloon","Reception","Church bell","Lehenga","Snakes and ladders","Roti","Lemon pickle","Restaurant","Air cooler"],
  marvel: ["War Machine","Odin","Abomination","Gamora","Miles Morales","Falcon","Wong","Kang","Mysterio","Winter Soldier","Latveria","Tesseract","Star-Lord","Wasp","Drax","Cosmo","Cable","Sabretooth","Stormbreaker","Adamantium","Sanctum Sanctorum","Vision","Maria Hill","Ms Marvel","Red Skull","Xandar"],
  starwars: ["Vibroblade","Darth Maul","Mace Windu","Slave I","Starkiller Base","Jakku","Lando","Clone trooper","Padawan","Cassian Andor","Chopper","K-2SO","Porg","Boba Fett","Padme","TIE fighter","Greedo","Qui-Gon","Midichlorians","Gungan","Jawa","Endor","Anakin","Inquisitor","Bowcaster","D-O"],
  pokemon: ["Raichu","Dragonite","Ivysaur","Wartortle","Vaporeon","Slaking","Mew","Clefairy","Haunter","Feebas","Golduck","Persian","Riolu","Milotic","Great Ball","Misty","Team Aqua","Pokégear","Elite Four","Charmeleon","Pichu","Steelix","Sableye","Salamence","Poké Mart","Machop"],
  anime: ["Boruto","Vegeta","Zoro","Cardcaptor Sakura","Code Geass","Ponyo","Tokyo Ghoul","Jujutsu Kaisen","Perman","Chibi Maruko-chan","Howl's Moving Castle","Bleach","Fairy Tail","Meowth","Itachi","L","Nezuko","Pixar","Soul Eater","Yu Yu Hakusho","Senpai","Sushi bar","Assassin","Ronin"],
  harrypotter: ["Beauxbatons","Gobstones","Quaffle","Firewhisky","McGonagall","Luna","Grindelwald","Boggart","Goblet of Fire","Knight Bus","Filch","Animagus","Time-Turner","Ministry of Magic","Crookshanks","Veritaserum","Knockturn Alley","Lupin","Philosopher's Stone","Godric's Hollow","Pensieve","Kreacher","Acromantula","Forbidden Forest"],
  disney: ["Anna","Mufasa","Jessie","Woody","Marlin","Donald Duck","Hercules","Merida","Magic carpet","Tiana","Sven","Lilo","Pocahontas","Snow White","EVE","Mater","Mowgli","Jafar","Jasmine","Tamatoa","Bruce","Sulley","Aurora","Timon"],
  games: ["Terraria","Luigi","Skyrim","Apex Legends","Fall Guys","Donkey Kong","Puyo Puyo","Crash Bandicoot","Red Dead Redemption","Rec Room","PUBG","Call of Duty Mobile","Bejeweled","Jetpack Joyride","Cut the Rope","PES","Overwatch","Battlefield","Crossy Road","Rainbow Six","Enderman","Deathmatch","Gamepad","Mini boss"],
  movies: ["The Notebook","Dune","Jurassic World","Alice in Borderland","Dark","Deewar","Munna Bhai MBBS","KGF","Tangled","Jungle Book","Narcos","How I Met Your Mother","House of the Dragon","The Hobbit","Superman","Tenet","Gravity","Pushpa","Sultan","Percy Jackson","Blade Runner","Better Call Saul","Bleach","James Bond"]
};
for (const k of Object.keys(PACKS)) {
  if (!DECOYS[k] || DECOYS[k].length !== PACKS[k].words.length) throw new Error("Decoy list for " + k + " does not match its word list");
}

/* ---------- helpers ---------- */
const lobbies = new Map();
const rid = (n) => crypto.randomBytes(n).toString("hex");
const pick = (a) => a[crypto.randomInt(a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const sameWord = (a, b) => { const x = norm(a), y = norm(b); return !!x && (x === y || x + "s" === y || y + "s" === x); };
const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);

function genCode() {
  for (let t = 0; t < 50; t++) {
    let c = ""; for (let i = 0; i < 5; i++) c += ALPHA[crypto.randomInt(ALPHA.length)];
    if (!lobbies.has(c)) return c;
  }
  return null;
}
class Fail extends Error { constructor(m, status) { super(m); this.status = status || 400; } }

function newLobby(code, hostId, hostName) {
  const l = {
    code, hostId, players: new Map(), phase: "lobby", round: 0, category: "", word: "",
    imposters: [], order: [], clues: {}, votes: {}, guesses: {},
    settings: { pack: "mix", imposters: 1 }, result: null, scores: {}, used: [],
    clients: new Map(), touched: Date.now()
  };
  l.players.set(hostId, { id: hostId, name: hostName, joinedAt: Date.now() });
  lobbies.set(code, l);
  return l;
}
const present = (l, ids) => ids.filter((id) => l.players.has(id));
const sortedPlayers = (l) => [...l.players.values()].sort((a, b) => a.joinedAt - b.joinedAt || (a.id < b.id ? -1 : 1));

/* ---------- views: each player only gets what they may see ---------- */
function view(l, pid) {
  const inGame = l.phase !== "lobby";
  const isImp = l.imposters.includes(pid);
  const v = {
    code: l.code, me: pid, hostId: l.hostId, phase: l.phase, round: l.round,
    settings: l.settings, packs: PACK_LIST, max: MAX_PLAYERS,
    players: sortedPlayers(l).map((p) => ({
      id: p.id, name: p.name, score: l.scores[p.id] || 0,
      guessed: l.guesses[p.id] !== undefined
    }))
  };
  if (inGame) {
    v.category = l.category;
    // Nobody is told they are the imposter until the vote is in.
    v.isImposter = isImp && (l.phase === "guess" || l.phase === "reveal");
    v.word = isImp ? l.decoy : l.word;
    v.partners = [];
    v.order = present(l, l.order);
    v.clues = {};
    for (const id of v.order) if (l.clues[id]) v.clues[id] = l.clues[id];
    v.myVote = l.votes[pid] || null;
    v.votesIn = [...l.players.keys()].filter((id) => l.votes[id] && l.players.has(l.votes[id])).length;
    if (l.phase === "guess" && l.result) v.top = l.result.top;
    if (l.phase === "reveal" && l.result) {
      v.reveal = Object.assign({}, l.result, { word: l.word, decoy: l.decoy, imposters: l.imposters, votes: l.votes });
    }
  }
  return v;
}
function send(res, event, data) {
  if (event) res.write("event: " + event + "\n");
  res.write("data: " + JSON.stringify(data) + "\n\n");
}
function broadcast(l) {
  for (const [pid, set] of l.clients) {
    if (!l.players.has(pid)) continue;
    const v = view(l, pid);
    for (const res of set) send(res, null, v);
  }
}
function closeClients(l, pid, event) {
  const set = l.clients.get(pid); if (!set) return;
  for (const res of set) { try { send(res, event, {}); res.end(); } catch (e) {} }
  l.clients.delete(pid);
}

/* ---------- game logic ---------- */
function startRound(l) {
  const ids = sortedPlayers(l).map((p) => p.id);
  if (ids.length < 3) throw new Fail("You need at least 3 players.");
  let key = l.settings.pack;
  if (key === "mix" || !PACKS[key]) key = pick(Object.keys(PACKS));
  const pack = PACKS[key];
  let pool = pack.words.filter((w) => !l.used.includes(w));
  if (!pool.length) pool = pack.words;
  const word = pick(pool);
  const k = ids.length >= 6 ? Math.min(2, l.settings.imposters || 1) : 1;
  l.used = l.used.slice(-60).concat([word]);
  l.phase = "clues"; l.round += 1; l.category = pack.name; l.word = word;
  l.decoy = DECOYS[key][pack.words.indexOf(word)];
  l.imposters = shuffle(ids.slice()).slice(0, k);
  l.order = shuffle(ids.slice());
  l.clues = {}; l.votes = {}; l.guesses = {}; l.result = null;
}
function closeVoting(l) {
  const tally = {};
  for (const [voter, target] of Object.entries(l.votes)) {
    if (l.players.has(voter) && l.players.has(target) && voter !== target) tally[target] = (tally[target] || 0) + 1;
  }
  const e = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const top = e.length && (e.length === 1 || e[0][1] > e[1][1]) ? e[0][0] : null;
  const caught = !!top && l.imposters.includes(top);
  l.result = { tally, top, caught };
  if (caught && present(l, l.imposters).length) l.phase = "guess";
  else finalize(l);
}
function finalize(l) {
  const res = l.result || { tally: {}, top: null, caught: false };
  const guesses = {};
  for (const id of l.imposters) if (l.guesses[id]) guesses[id] = l.guesses[id];
  const guessCorrect = !!res.caught && Object.values(guesses).some((g) => sameWord(g, l.word));
  const winner = res.caught && !guessCorrect ? "crew" : "imposters";
  const delta = {};
  for (const id of l.players.keys()) {
    const imp = l.imposters.includes(id);
    delta[id] = winner === "crew" ? (imp ? 0 : 2) : (imp ? 3 : 0);
    l.scores[id] = (l.scores[id] || 0) + delta[id];
  }
  l.result = { tally: res.tally || {}, top: res.top || null, caught: !!res.caught, guesses, guessCorrect, winner, delta };
  l.phase = "reveal";
}
function maybeFinishGuess(l) {
  if (l.phase !== "guess") return;
  const imps = present(l, l.imposters);
  if (!imps.length || imps.every((id) => l.guesses[id] !== undefined)) finalize(l);
}

function act(l, pid, body) {
  const host = l.hostId === pid;
  const need = (ok, msg) => { if (!ok) throw new Fail(msg || "Not allowed right now.", 403); };
  switch (body.type) {
    case "settings": {
      need(host && l.phase === "lobby");
      const p = String(body.pack || "mix");
      l.settings = { pack: p === "mix" || PACKS[p] ? p : "mix", imposters: Number(body.imposters) === 2 ? 2 : 1 };
      break;
    }
    case "kick": {
      need(host && l.phase === "lobby");
      const t = String(body.target || "");
      need(t !== pid && l.players.has(t));
      l.players.delete(t); delete l.scores[t];
      closeClients(l, t, "kicked");
      break;
    }
    case "resetScores": need(host); l.scores = {}; break;
    case "start": need(host && (l.phase === "lobby" || l.phase === "reveal")); startRound(l); break;
    case "clue": {
      need(l.phase === "clues");
      const next = present(l, l.order).find((id) => !l.clues[id]);
      need(next === pid, "It's not your turn yet.");
      const text = clean(body.text, 24);
      if (!text) throw new Fail("Type a clue first.");
      if (sameWord(text, l.imposters.includes(pid) ? l.decoy : l.word)) throw new Fail("That's your secret word. Pick a different clue.");
      l.clues[pid] = text;
      break;
    }
    case "toVote": need(host && l.phase === "clues"); l.phase = "vote"; break;
    case "vote": {
      need(l.phase === "vote");
      const t = String(body.target || "");
      need(t !== pid && l.players.has(t));
      l.votes[pid] = t;
      break;
    }
    case "closeVote": need(host && l.phase === "vote"); closeVoting(l); break;
    case "guess": {
      need(l.phase === "guess" && l.imposters.includes(pid) && l.guesses[pid] === undefined);
      const text = clean(body.text, 30);
      if (!text) throw new Fail("Type your guess first.");
      l.guesses[pid] = text;
      maybeFinishGuess(l);
      break;
    }
    case "skipGuess": need(host && l.phase === "guess"); finalize(l); break;
    case "backLobby": need(host && l.phase === "reveal"); l.phase = "lobby"; break;
    case "leave": {
      if (host) {
        for (const id of [...l.clients.keys()]) closeClients(l, id, "closed");
        lobbies.delete(l.code);
        return false;
      }
      l.players.delete(pid);
      closeClients(l, pid, "left");
      maybeFinishGuess(l);
      break;
    }
    default: throw new Fail("Unknown action.");
  }
  return true;
}

/* ---------- http ---------- */
function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > 10000) { reject(new Fail("Request too large.", 413)); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}")); } catch (e) { reject(new Fail("Bad request.")); } });
    req.on("error", reject);
  });
}
function json(res, status, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(s);
}
function getLobby(code) { const l = lobbies.get(String(code || "").toUpperCase()); if (!l) throw new Fail("No lobby with that code.", 404); l.touched = Date.now(); return l; }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      return res.end(HTML);
    }
    if (req.method === "GET" && url.pathname === "/healthz") return json(res, 200, { ok: true, lobbies: lobbies.size });

    if (req.method === "GET" && url.pathname === "/events") {
      const l = getLobby(url.searchParams.get("code")); const pid = url.searchParams.get("pid") || "";
      if (!l.players.has(pid)) throw new Fail("You are not in this lobby.", 404);
      res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no" });
      res.write("retry: 2000\n\n");
      if (!l.clients.has(pid)) l.clients.set(pid, new Set());
      l.clients.get(pid).add(res);
      send(res, null, view(l, pid));
      const beat = setInterval(() => { try { res.write(": ping\n\n"); } catch (e) {} }, 15000);
      req.on("close", () => { clearInterval(beat); const set = l.clients.get(pid); if (set) { set.delete(res); if (!set.size) l.clients.delete(pid); } });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/state") {
      const l = getLobby(url.searchParams.get("code")); const pid = url.searchParams.get("pid") || "";
      if (!l.players.has(pid)) throw new Fail("You are not in this lobby.", 404);
      return json(res, 200, view(l, pid));
    }
    if (req.method === "POST" && url.pathname === "/api/create") {
      const b = await readJson(req); const name = clean(b.name, 16);
      if (!name) throw new Fail("Enter your name first.");
      if (lobbies.size >= 500) throw new Fail("The server is busy. Try again in a few minutes.", 503);
      const code = genCode(); if (!code) throw new Fail("Couldn't find a free code. Try again.", 503);
      const pid = rid(12); newLobby(code, pid, name);
      return json(res, 200, { code, pid });
    }
    if (req.method === "POST" && url.pathname === "/api/join") {
      const b = await readJson(req); const name = clean(b.name, 16);
      if (!name) throw new Fail("Enter your name first.");
      const l = getLobby(b.code);
      if (b.pid && l.players.has(b.pid)) { l.players.get(b.pid).name = name; broadcast(l); return json(res, 200, { code: l.code, pid: b.pid }); }
      if (l.phase !== "lobby") throw new Fail("That game already started. Ask the host to go back to the lobby.", 409);
      if (l.players.size >= MAX_PLAYERS) throw new Fail("That lobby is full (" + MAX_PLAYERS + " players).", 409);
      const pid = rid(12);
      l.players.set(pid, { id: pid, name, joinedAt: Date.now() });
      broadcast(l);
      return json(res, 200, { code: l.code, pid });
    }
    if (req.method === "POST" && url.pathname === "/api/act") {
      const b = await readJson(req); const l = getLobby(b.code);
      if (!l.players.has(String(b.pid))) throw new Fail("You are not in this lobby.", 404);
      const alive = act(l, String(b.pid), b);
      if (alive !== false) broadcast(l);
      return json(res, 200, { ok: true });
    }
    json(res, 404, { error: "Not found." });
  } catch (e) {
    const status = e instanceof Fail ? e.status : 500;
    if (!(e instanceof Fail)) console.error(e);
    if (res.headersSent) { try { res.end(); } catch (x) {} return; }
    json(res, status, { error: e instanceof Fail ? e.message : "Something went wrong." });
  }
});

setInterval(() => {
  const cutoff = Date.now() - 8 * 3600 * 1000;
  for (const [code, l] of lobbies) if (l.touched < cutoff && !l.clients.size) lobbies.delete(code);
}, 600000).unref();

server.listen(PORT, () => console.log("Imposter Lineup is running on port " + PORT));

/* ---------- the game page ---------- */
const HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Imposter Lineup</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
:root {
  --wall: #e3e8eb; --card: #ffffff; --ink: #13202a; --ink-2: #4a5a66; --line: #c2ccd3; --edge: #13202a;
  --plate: #13202a; --on-plate: #ffffff; --marker: #f2c230; --marker-shadow: #b58d0f; --marker-soft: #fff3c4;
  --on-marker: #13202a; --alarm: #c93a25; --alarm-soft: #fde7e2; --ok: #217553; --focus: #1f5fae;
  --display: "Big Shoulders Display", "Arial Narrow", Impact, sans-serif;
  --body: "Barlow", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --wall: #0f171d; --card: #18232b; --ink: #e8eef1; --ink-2: #9baab5; --line: #2a3943; --edge: #3b4c58;
    --plate: #e8eef1; --on-plate: #0f171d; --marker-shadow: #8c6a09; --marker-soft: #3a3216;
    --alarm: #f0654f; --alarm-soft: #3b1d19; --ok: #4fb98a; --focus: #7db7ff; color-scheme: dark;
  }
}
* { box-sizing: border-box; }
html { background: var(--wall); }
body { margin: 0; background: var(--wall); color: var(--ink); font: 400 16px/1.45 var(--body);
  padding-block: 0 48px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
[hidden] { display: none !important; }
.wrap { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
button, input, select { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.chart { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding: 22px 0 12px; border-bottom: 3px solid var(--edge); min-height: 120px; }
.chart-lines { position: absolute; inset: 0 0 12px 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
.chart-lines span { border-top: 1px solid var(--line); font: 500 11px/1 var(--mono); color: var(--ink-2); text-align: right; padding-top: 3px; }
.chart h1 { position: relative; margin: 0; font: 800 54px/0.88 var(--display); text-transform: uppercase; letter-spacing: 0.01em; }
.chart.compact { min-height: 0; padding-top: 14px; align-items: center; }
.chart.compact .chart-lines { display: none; }
.chart.compact h1 { font-size: 28px; line-height: 1; }
#roomchip { position: relative; display: flex; align-items: center; gap: 8px; }
#roomchip .mono { font: 600 14px var(--mono); letter-spacing: 0.12em; background: var(--plate); color: var(--on-plate); padding: 6px 9px; border-radius: 3px; }
.panel { background: var(--card); border: 2px solid var(--edge); border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.panel h2 { margin: 0; font: 800 26px/1 var(--display); text-transform: uppercase; letter-spacing: 0.02em; }
.eyebrow { margin: 0; font: 600 12px/1 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-2); }
.hint { margin: 0; color: var(--ink-2); font-size: 15px; }
.err { margin: 0; color: var(--alarm); font-weight: 600; min-height: 1.45em; }
.view { display: flex; flex-direction: column; gap: 16px; }
label.fld { display: flex; flex-direction: column; gap: 6px; font: 600 12px/1 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-2); }
input[type=text], select { width: 100%; min-height: 48px; padding: 10px 12px; font-size: 18px; background: var(--wall); border: 2px solid var(--edge); border-radius: 4px; }
input.codein { font: 600 24px var(--mono); letter-spacing: 0.2em; text-transform: uppercase; text-align: center; }
.row { display: flex; gap: 10px; flex-wrap: wrap; }
.row > * { flex: 1 1 0; min-width: 0; }
.btn { min-height: 48px; padding: 10px 18px; font: 800 20px/1 var(--display); letter-spacing: 0.05em; text-transform: uppercase; background: var(--card); border: 2px solid var(--edge); border-radius: 4px; cursor: pointer; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn.primary { background: var(--marker); color: var(--on-marker); border-color: transparent; box-shadow: 0 3px 0 var(--marker-shadow); }
.btn.primary:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 var(--marker-shadow); }
.btn.small { min-height: 36px; padding: 6px 12px; font-size: 16px; }
.btn.danger { background: var(--alarm); color: #fff; border-color: transparent; }
.or { display: flex; align-items: center; gap: 10px; color: var(--ink-2); font: 600 12px var(--mono); letter-spacing: 0.1em; text-transform: uppercase; }
.or::before, .or::after { content: ""; flex: 1; border-top: 1px solid var(--line); }
details.how { border-top: 1px solid var(--line); padding-top: 12px; }
details.how summary { cursor: pointer; font: 600 12px var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-2); }
details.how ol { margin: 10px 0 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
.codebox { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.code { font: 600 52px/1 var(--mono); letter-spacing: 0.16em; margin: 0; }
ul.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.slot { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 8px 12px 8px 8px; background: var(--card); border: 1px solid var(--line); border-radius: 4px; animation: drop 0.25s ease-out; }
.slot .no { display: grid; place-items: center; height: 36px; background: var(--plate); color: var(--on-plate); font: 800 22px/1 var(--display); letter-spacing: 0.04em; border-radius: 2px; }
.slot .who { min-width: 0; overflow-wrap: anywhere; font-weight: 600; }
.slot .end, .slot .clue { font-weight: 500; text-align: right; overflow-wrap: anywhere; }
.slot .clue { font: 600 17px var(--body); }
.slot .clue i { color: var(--ink-2); font-weight: 400; }
.slot.cur { background: var(--marker-soft); border-color: var(--marker); border-width: 2px; }
button.suspect { cursor: pointer; border: 2px solid var(--edge); font: inherit; }
button.suspect.picked { border-color: var(--alarm); background: var(--alarm-soft); }
.stamp { display: inline-block; border: 2px solid var(--alarm); color: var(--alarm); padding: 2px 8px; font: 800 15px/1.2 var(--display); letter-spacing: 0.08em; text-transform: uppercase; transform: rotate(-4deg); }
.tag { font: 600 10px/1 var(--mono); letter-spacing: 0.08em; text-transform: uppercase; background: var(--marker-soft); color: var(--ink); border: 1px solid var(--marker); padding: 2px 5px; border-radius: 2px; font-style: normal; margin-left: 4px; vertical-align: middle; }
.x { width: 30px; height: 30px; margin-left: 8px; border: 1px solid var(--line); background: var(--wall); border-radius: 3px; cursor: pointer; font-size: 18px; line-height: 1; }
.phase { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { font: 600 12px/1 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; padding: 7px 10px; border: 2px solid var(--edge); border-radius: 3px; background: var(--card); }
.chip.hot { background: var(--marker); color: var(--on-marker); border-color: transparent; }
.role { display: block; width: 100%; min-height: 116px; padding: 16px; text-align: left; cursor: pointer; background: var(--card); border: 2px solid var(--edge); border-radius: 6px; }
.role.covered { border-style: dashed; background: repeating-linear-gradient(135deg, transparent 0 11px, var(--line) 11px 12px), var(--card); }
.role .cover { font: 800 26px/1.1 var(--display); text-transform: uppercase; letter-spacing: 0.03em; display: block; }
.role .sub { display: block; color: var(--ink-2); font-size: 15px; margin-top: 6px; }
.role .face { display: flex; flex-direction: column; gap: 4px; }
.role .lbl { font: 600 12px var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-2); }
.role .word { font: 800 46px/1 var(--display); text-transform: uppercase; letter-spacing: 0.02em; overflow-wrap: anywhere; }
.role .imp { font: 800 46px/1 var(--display); text-transform: uppercase; color: var(--alarm); }
.verdict { margin: 0; font: 800 56px/0.9 var(--display); text-transform: uppercase; }
.verdict.crew { color: var(--ok); }
.verdict.imp { color: var(--alarm); }
dl.facts { margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
dl.facts div { border-top: 2px solid var(--edge); padding-top: 6px; min-width: 0; }
dl.facts dt { font: 600 11px var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-2); }
dl.facts dd { margin: 2px 0 0; font: 800 26px/1.05 var(--display); text-transform: uppercase; overflow-wrap: anywhere; }
.slot small { display: block; color: var(--ink-2); font-weight: 400; font-size: 13px; }
.pts { font: 800 20px var(--display); }
.pts em { font-style: normal; color: var(--ok); margin-right: 6px; }
#toast { position: fixed; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); max-width: min(92vw, 420px); background: var(--plate); color: var(--on-plate); padding: 10px 16px; border-radius: 4px; font-weight: 600; z-index: 20; }
@keyframes drop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .slot { animation: none; } }
@media (max-width: 420px) { .chart h1 { font-size: 44px; } .code { font-size: 44px; } .verdict { font-size: 46px; } }
</style>
</head>
<body>
<div class="wrap">
  <header class="chart" id="top">
    <div class="chart-lines" aria-hidden="true"><span>190 cm</span><span>180</span><span>170</span><span>160</span></div>
    <h1>Imposter<br>Lineup</h1>
    <div id="roomchip" hidden>
      <span class="mono" id="chipcode"></span>
      <button type="button" class="btn small" id="leaveBtn">Leave</button>
    </div>
  </header>

  <section class="view" id="v-home">
    <div class="panel">
      <label class="fld" for="name">Your name
        <input type="text" id="name" maxlength="16" autocomplete="nickname" placeholder="What should we call you?">
      </label>
      <button type="button" class="btn primary" id="createBtn">Create a lobby</button>
      <div class="or">or join a friend</div>
      <div class="row">
        <input type="text" class="codein" id="joincode" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE" aria-label="Lobby code" style="flex: 2 1 0;">
        <button type="button" class="btn" id="joinBtn" style="flex: 1 1 0;">Join</button>
      </div>
      <p class="err" id="homeErr" role="alert"></p>
      <details class="how">
        <summary>How to play</summary>
        <ol>
          <li>One person creates a lobby and shares the 5-letter code. Everyone else opens this page and joins with it.</li>
          <li>Everyone gets a secret word from the same category. Most players get the same word, but the imposter gets a similar one and doesn't know it.</li>
          <li>Take turns giving a one-word clue about your word. Listen closely, because one clue won't quite fit.</li>
          <li>Vote for who you think the imposter is. If they are caught, they get one guess at the crew's word to steal the win.</li>
          <li>Crew scores 2 points each for a clean catch. Imposters score 3 for escaping or guessing the word.</li>
        </ol>
      </details>
    </div>
  </section>

  <section class="view" id="v-lobby" hidden>
    <div class="panel">
      <p class="eyebrow">Lobby code</p>
      <div class="codebox">
        <p class="code" id="codeText"></p>
        <button type="button" class="btn small" id="copyBtn">Copy code</button>
      </div>
      <p class="hint">Friends open this page, enter the code and tap Join.</p>
      <button type="button" class="btn small" id="copyLink">Copy page link</button>
    </div>
    <div class="panel">
      <div class="codebox">
        <h2>In the lineup</h2>
        <p class="eyebrow" id="pcount"></p>
      </div>
      <ul class="list" id="plist"></ul>
    </div>
    <div class="panel" id="hostset" hidden>
      <h2>Host controls</h2>
      <div class="row">
        <label class="fld" for="packSel">Word pack <select id="packSel"></select></label>
        <label class="fld" for="impSel">Imposters
          <select id="impSel"><option value="1">1 imposter</option><option value="2" id="imp2">2 imposters (6+ players)</option></select>
        </label>
      </div>
      <button type="button" class="btn primary" id="startBtn">Start round</button>
      <p class="hint" id="startHint">You need at least 3 players.</p>
      <button type="button" class="btn small" id="resetScores">Reset scores</button>
    </div>
    <p class="hint" id="waitHost" hidden>Waiting for the host to start the round.</p>
  </section>

  <section class="view" id="v-game" hidden>
    <div class="phase" id="phaseLine"></div>
    <button type="button" class="role covered" id="role" aria-pressed="false"></button>
    <div class="panel" id="p-board">
      <p class="eyebrow">Clues, in speaking order</p>
      <ul class="list" id="board"></ul>
    </div>
    <div class="panel" id="p-clues">
      <h2>Your clue</h2>
      <p class="hint" id="clueNote"></p>
      <form id="clueForm" class="row" autocomplete="off" hidden>
        <input type="text" id="clue" maxlength="24" placeholder="One word" aria-label="Your clue" style="flex: 3 1 0;">
        <button type="submit" class="btn primary" style="flex: 1 1 0;">Send</button>
      </form>
      <button type="button" class="btn" id="toVote">Open voting</button>
    </div>
    <div class="panel" id="p-vote">
      <h2>Who is the imposter?</h2>
      <p class="hint">Tap a player to vote. You can change your vote until the host reveals the result.</p>
      <ul class="list" id="suspects"></ul>
      <p class="eyebrow" id="voteCount"></p>
      <button type="button" class="btn" id="closeVote">Reveal result</button>
    </div>
    <div class="panel" id="p-guess">
      <h2>Last guess</h2>
      <p class="hint" id="guessMsg"></p>
      <form id="guessForm" class="row" autocomplete="off" hidden>
        <input type="text" id="guess" maxlength="30" placeholder="The crew's word" aria-label="Your guess at the crew's word" style="flex: 3 1 0;">
        <button type="submit" class="btn primary" style="flex: 1 1 0;">Guess</button>
      </form>
      <button type="button" class="btn" id="skipGuess">Skip guess</button>
    </div>
    <div class="panel" id="p-reveal">
      <div id="revealBody"></div>
      <div class="row" id="revealHost">
        <button type="button" class="btn primary" id="nextRound">Next round</button>
        <button type="button" class="btn" id="backLobby">Back to lobby</button>
      </div>
      <p class="hint" id="waitNext">Waiting for the host to start the next round.</p>
    </div>
  </section>
</div>
<div id="toast" role="status" hidden></div>

<script>
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };

  var S = null, es = null, sess = null, roleShown = false, roleKey = "", toastTimer = null, armed = null, packsBuilt = false;
  var isHost = function () { return !!S && S.hostId === S.me; };
  var P = function (id) { for (var i = 0; i < S.players.length; i++) if (S.players[i].id === id) return S.players[i]; return null; };
  var nm = function (id) { var p = S && P(id); return p ? p.name : "Someone"; };

  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
  }
  function api(path, body) {
    return fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Something went wrong."); return j; }); });
  }
  function act(type, extra) {
    var b = { code: sess.code, pid: sess.pid, type: type };
    for (var k in (extra || {})) b[k] = extra[k];
    return api("/api/act", b).catch(function (e) { toast(e.message); });
  }

  /* ---------- connect ---------- */
  function connect(code, pid) {
    sess = { code: code, pid: pid };
    try { localStorage.setItem("imp.session", JSON.stringify(sess)); } catch (e) {}
    if (es) es.close();
    es = new EventSource("/events?code=" + encodeURIComponent(code) + "&pid=" + encodeURIComponent(pid));
    es.onmessage = function (e) { S = JSON.parse(e.data); render(); };
    es.addEventListener("closed", function () { toast("The host closed the lobby."); drop(); });
    es.addEventListener("kicked", function () { toast("You were removed from the lobby."); drop(); });
    es.addEventListener("left", function () { drop(); });
    es.onerror = function () { if (es && es.readyState === 2) { toast("That lobby has ended."); drop(); } };
  }
  function drop() {
    if (es) { es.close(); es = null; }
    S = null; sess = null; armed = null;
    try { localStorage.removeItem("imp.session"); } catch (e) {}
    render();
  }
  function readName() {
    var n = $("#name").value.trim().slice(0, 16);
    if (!n) { $("#homeErr").textContent = "Enter your name first."; $("#name").focus(); return null; }
    try { localStorage.setItem("imp.name", n); } catch (e) {}
    return n;
  }
  function createLobby() {
    $("#homeErr").textContent = ""; var name = readName(); if (!name) return;
    $("#createBtn").disabled = true;
    api("/api/create", { name: name }).then(function (r) { connect(r.code, r.pid); })
      .catch(function (e) { $("#homeErr").textContent = e.message; })
      .then(function () { $("#createBtn").disabled = false; });
  }
  function joinLobby() {
    $("#homeErr").textContent = ""; var name = readName(); if (!name) return;
    var c = $("#joincode").value.trim().toUpperCase();
    if (c.length !== 5) { $("#homeErr").textContent = "Lobby codes have 5 characters."; $("#joincode").focus(); return; }
    var old = null; try { var s = JSON.parse(localStorage.getItem("imp.session") || "null"); if (s && s.code === c) old = s.pid; } catch (e) {}
    $("#joinBtn").disabled = true;
    api("/api/join", { code: c, name: name, pid: old }).then(function (r) { connect(r.code, r.pid); })
      .catch(function (e) { $("#homeErr").textContent = e.message; })
      .then(function () { $("#joinBtn").disabled = false; });
  }

  /* ---------- render ---------- */
  function render() {
    var inRoom = !!S;
    $("#v-home").hidden = inRoom;
    $("#roomchip").hidden = !inRoom;
    $("#top").classList.toggle("compact", inRoom);
    $("#v-lobby").hidden = !(inRoom && S.phase === "lobby");
    $("#v-game").hidden = !(inRoom && S.phase !== "lobby");
    if (!inRoom) return;
    $("#chipcode").textContent = S.code;
    if (armed !== "leave") $("#leaveBtn").textContent = isHost() ? "Close lobby" : "Leave";
    if (S.phase === "lobby") renderLobby(); else renderGame();
  }

  function renderLobby() {
    var list = S.players, host = isHost();
    $("#codeText").textContent = S.code;
    $("#pcount").textContent = list.length + " of " + S.max;
    $("#plist").innerHTML = list.map(function (p, i) {
      return '<li class="slot"><span class="no">' + pad(i + 1) + '</span><span class="who">' + esc(p.name) +
        (p.id === S.hostId ? '<em class="tag">Host</em>' : "") + (p.id === S.me ? '<em class="tag">You</em>' : "") +
        '</span><span class="end">' + (p.score ? '<span class="pts">' + p.score + " pts</span>" : "") +
        (host && p.id !== S.me ? '<button type="button" class="x" data-kick="' + esc(p.id) + '" aria-label="Remove ' + esc(p.name) + '">×</button>' : "") + "</span></li>";
    }).join("");
    $("#hostset").hidden = !host;
    $("#waitHost").hidden = host;
    if (!host) return;
    if (!packsBuilt) {
      $("#packSel").innerHTML = S.packs.map(function (k) { return '<option value="' + esc(k.key) + '">' + esc(k.name) + "</option>"; }).join("");
      packsBuilt = true;
    }
    if (document.activeElement !== $("#packSel")) $("#packSel").value = S.settings.pack;
    $("#imp2").disabled = list.length < 6;
    if (document.activeElement !== $("#impSel")) $("#impSel").value = list.length < 6 ? "1" : String(S.settings.imposters);
    $("#startBtn").disabled = list.length < 3;
    $("#startHint").textContent = list.length < 3 ? "You need at least 3 players. Share the code above." : list.length + " players ready.";
    $("#resetScores").hidden = !list.some(function (p) { return p.score; });
  }

  function renderRole() {
    var b = $("#role"), imp = S.isImposter;
    b.setAttribute("aria-pressed", String(roleShown));
    b.classList.toggle("covered", !roleShown);
    if (!roleShown) {
      b.innerHTML = '<span class="cover">Tap to see your role</span><span class="sub">Keep your screen out of sight. Tap again to hide it.</span>';
    } else {
      b.innerHTML = '<span class="face"><span class="lbl">Your secret word</span><span class="word">' + esc(S.word) + "</span><span>Category: <b>" + esc(S.category) + "</b>. Hint at it without saying it. Someone has a similar but different word.</span></span>";
    }
  }

  function renderGame() {
    var ph = S.phase, r = S.round, host = isHost(), imp = S.isImposter;
    var labels = { clues: "Clues", vote: "Voting", guess: "Last guess", reveal: "Result" };
    $("#phaseLine").innerHTML = '<span class="chip">Round ' + r + '</span><span class="chip hot">' + labels[ph] + "</span>";
    var key = r + ":" + S.me; if (key !== roleKey) { roleKey = key; roleShown = false; }
    $("#role").hidden = ph === "reveal";
    if (ph !== "reveal") renderRole();

    var order = S.order, turnId = null;
    for (var i = 0; i < order.length; i++) if (!S.clues[order[i]]) { turnId = order[i]; break; }
    $("#p-board").hidden = ph === "reveal";
    $("#board").innerHTML = order.map(function (id, i) {
      var cur = ph === "clues" && id === turnId;
      return '<li class="slot' + (cur ? " cur" : "") + '"><span class="no">' + pad(i + 1) + '</span><span class="who">' + esc(nm(id)) +
        (id === S.me ? '<em class="tag">You</em>' : "") + '</span><span class="clue">' +
        (S.clues[id] ? esc(S.clues[id]) : cur ? "<i>thinking…</i>" : "<i>waiting</i>") + "</span></li>";
    }).join("");

    $("#p-clues").hidden = ph !== "clues";
    if (ph === "clues") {
      var mine = turnId === S.me;
      $("#clueForm").hidden = !mine;
      $("#clueNote").textContent = turnId
        ? (mine ? "Your turn. Give one word that hints at your secret word without saying it." : "Waiting for " + nm(turnId) + "…")
        : "All clues are in. Talk it over, then the host opens voting.";
      $("#toVote").hidden = !host;
      $("#toVote").textContent = turnId ? "Skip to voting" : "Open voting";
      $("#toVote").classList.toggle("primary", !turnId);
    }

    $("#p-vote").hidden = ph !== "vote";
    if (ph === "vote") {
      $("#suspects").innerHTML = S.players.map(function (p, i) {
        if (p.id === S.me) return "";
        var on = p.id === S.myVote;
        return '<li><button type="button" class="slot suspect' + (on ? " picked" : "") + '" data-vote="' + esc(p.id) + '" aria-pressed="' + on + '"><span class="no">' + pad(i + 1) + '</span><span class="who">' + esc(p.name) + '</span><span class="end">' + (on ? '<b class="stamp">Suspect</b>' : "") + "</span></button></li>";
      }).join("");
      $("#voteCount").textContent = "Votes in: " + S.votesIn + " of " + S.players.length;
      $("#closeVote").hidden = !host;
      $("#closeVote").classList.toggle("primary", S.votesIn === S.players.length);
      $("#closeVote").textContent = S.votesIn === S.players.length ? "Reveal result" : "Reveal now";
    }

    $("#p-guess").hidden = ph !== "guess";
    if (ph === "guess") {
      var me = P(S.me), guessed = me && me.guessed;
      $("#guessForm").hidden = !(imp && !guessed);
      $("#guessMsg").textContent = imp
        ? (guessed ? "Guess locked in. Waiting for the others." : "You were the imposter. Everyone else had a different word. Guess theirs to steal the win.")
        : "The crew caught " + nm(S.top) + ", the imposter. They now get one guess at the crew's word.";
      $("#skipGuess").hidden = !host;
    }

    $("#p-reveal").hidden = ph !== "reveal";
    if (ph === "reveal") renderReveal(host);
  }

  function renderReveal(host) {
    var res = S.reveal, crew = res.winner === "crew";
    var impNames = res.imposters.map(nm).map(esc).join(", ");
    var why;
    if (res.caught) why = esc(nm(res.top)) + (res.guessCorrect ? " was caught, but the imposters guessed the word." : " was caught and the guess missed.");
    else if (res.top) why = "The crew voted out " + esc(nm(res.top)) + ", who was innocent.";
    else why = "The vote was tied, so nobody was caught.";
    var all = S.players;
    var votes = all.map(function (p) {
      var by = all.filter(function (q) { return res.votes[q.id] === p.id; }).map(function (q) { return esc(q.name); });
      return { p: p, n: (res.tally && res.tally[p.id]) || 0, by: by };
    }).sort(function (a, b) { return b.n - a.n; });
    var ranked = all.slice().sort(function (a, b) { return b.score - a.score; });
    var guessLine = Object.keys(res.guesses || {}).map(function (id) { return esc(nm(id)) + " guessed “" + esc(res.guesses[id]) + "”"; }).join(". ");
    $("#revealBody").innerHTML =
      '<div style="display:flex;flex-direction:column;gap:14px">' +
      '<p class="eyebrow">Round ' + S.round + " result, " + esc(S.category) + "</p>" +
      '<h2 class="verdict ' + (crew ? "crew" : "imp") + '">' + (crew ? "Crew wins" : "Imposters win") + "</h2>" +
      '<p class="hint">' + why + (guessLine ? " " + guessLine + "." : "") + "</p>" +
      '<dl class="facts"><div><dt>Crew word</dt><dd>' + esc(res.word) + "</dd></div><div><dt>Imposter word</dt><dd>" + esc(res.decoy) + "</dd></div><div><dt>Imposter" + (res.imposters.length > 1 ? "s" : "") + "</dt><dd>" + impNames + "</dd></div></dl>" +
      '<p class="eyebrow">Votes</p><ul class="list">' + votes.map(function (v) {
        return '<li class="slot"><span class="no">' + v.n + '</span><span class="who">' + esc(v.p.name) + "<small>" + (v.by.length ? "Voted by " + v.by.join(", ") : "No votes") + '</small></span><span class="end">' + (res.imposters.indexOf(v.p.id) >= 0 ? '<b class="stamp">Imposter</b>' : "") + "</span></li>";
      }).join("") + "</ul>" +
      '<p class="eyebrow">Scoreboard</p><ul class="list">' + ranked.map(function (p, i) {
        var d = res.delta && res.delta[p.id];
        return '<li class="slot"><span class="no">' + pad(i + 1) + '</span><span class="who">' + esc(p.name) + '</span><span class="end pts">' + (d ? "<em>+" + d + "</em>" : "") + p.score + " pts</span></li>";
      }).join("") + "</ul></div>";
    $("#revealHost").hidden = !host;
    $("#waitNext").hidden = host;
  }

  /* ---------- events ---------- */
  $("#createBtn").addEventListener("click", createLobby);
  $("#joinBtn").addEventListener("click", joinLobby);
  $("#joincode").addEventListener("input", function (e) { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
  $("#joincode").addEventListener("keydown", function (e) { if (e.key === "Enter") joinLobby(); });
  $("#name").addEventListener("keydown", function (e) { if (e.key === "Enter") { if ($("#joincode").value.trim()) joinLobby(); else createLobby(); } });

  $("#leaveBtn").addEventListener("click", function () {
    var b = $("#leaveBtn");
    if (isHost() && armed !== "leave") {
      armed = "leave"; b.textContent = "Tap to confirm"; b.classList.add("danger");
      setTimeout(function () { if (armed === "leave") { armed = null; b.classList.remove("danger"); if (S) b.textContent = isHost() ? "Close lobby" : "Leave"; } }, 3000);
      return;
    }
    b.classList.remove("danger"); armed = null;
    var s = sess; if (s) api("/api/act", { code: s.code, pid: s.pid, type: "leave" }).catch(function () {});
    drop();
  });
  function copy(text, okMsg) {
    try { navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, function () { toast("Copy failed. It is " + text); }); }
    catch (e) { toast("Copy failed. It is " + text); }
  }
  $("#copyBtn").addEventListener("click", function () { copy(S.code, "Code copied"); });
  $("#copyLink").addEventListener("click", function () { copy(location.origin + "/", "Link copied"); });
  $("#plist").addEventListener("click", function (e) {
    var k = e.target.closest("[data-kick]"); if (k && isHost()) act("kick", { target: k.getAttribute("data-kick") });
  });
  $("#packSel").addEventListener("change", function () { if (isHost()) act("settings", { pack: $("#packSel").value, imposters: +$("#impSel").value }); });
  $("#impSel").addEventListener("change", function () { if (isHost()) act("settings", { pack: $("#packSel").value, imposters: +$("#impSel").value }); });
  $("#startBtn").addEventListener("click", function () { if (isHost()) act("start"); });
  $("#resetScores").addEventListener("click", function () { if (isHost()) act("resetScores"); });
  $("#role").addEventListener("click", function () { roleShown = !roleShown; renderRole(); });
  $("#clueForm").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("#clue").value.trim(); if (!t) return;
    act("clue", { text: t }).then(function () { $("#clue").value = ""; });
  });
  $("#toVote").addEventListener("click", function () { if (isHost()) act("toVote"); });
  $("#suspects").addEventListener("click", function (e) {
    var b = e.target.closest("[data-vote]"); if (b) act("vote", { target: b.getAttribute("data-vote") });
  });
  $("#closeVote").addEventListener("click", function () { if (isHost()) act("closeVote"); });
  $("#guessForm").addEventListener("submit", function (e) {
    e.preventDefault(); var t = $("#guess").value.trim(); if (!t) return;
    act("guess", { text: t }).then(function () { $("#guess").value = ""; });
  });
  $("#skipGuess").addEventListener("click", function () { if (isHost()) act("skipGuess"); });
  $("#nextRound").addEventListener("click", function () { if (isHost()) act("start"); });
  $("#backLobby").addEventListener("click", function () { if (isHost()) act("backLobby"); });

  try { var n = localStorage.getItem("imp.name"); if (n) $("#name").value = n; } catch (e) {}
  try { var s = JSON.parse(localStorage.getItem("imp.session") || "null"); if (s && s.code && s.pid) connect(s.code, s.pid); } catch (e) {}
  render();
})();
</script>
</body>
</html>`;
