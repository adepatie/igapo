import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/amazon.db');

export function initializeDatabase() {
  const db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      description TEXT,
      historical_note TEXT,
      year_established INTEGER,
      biome TEXT,
      dangers TEXT,
      resources TEXT,
      indigenous_groups TEXT
    );

    CREATE TABLE IF NOT EXISTS animals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      common_name TEXT NOT NULL,
      scientific_name TEXT,
      category TEXT NOT NULL,
      size TEXT,
      danger_level TEXT,
      habitat TEXT,
      behavior TEXT,
      diet TEXT,
      conservation_status TEXT,
      interesting_fact TEXT,
      indigenous_name TEXT,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      common_name TEXT NOT NULL,
      scientific_name TEXT,
      medicinal_use TEXT,
      edible BOOLEAN,
      dangerous BOOLEAN,
      habitat TEXT,
      description TEXT,
      indigenous_use TEXT
    );
  `);

  // Check if data already exists
  const locationCount = db.prepare('SELECT COUNT(*) as count FROM locations').get();
  if (locationCount.count > 0) {
    console.log('Database already initialized.');
    return db;
  }

  console.log('Populating database with Amazon data...');

  // Insert historical Amazon locations (1930s era)
  const insertLocation = db.prepare(`
    INSERT INTO locations (name, type, latitude, longitude, description, historical_note, year_established, biome, dangers, resources, indigenous_groups)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const locations = [
    ['Iquitos', 'city', -3.7437, -73.2516, 'The largest city in the Peruvian Amazon, accessible only by river or air. Hub of the rubber boom.', 'Founded in 1750s, became major rubber trading center in 1880s-1920s. By 1930s, still a vital trading post.', 1757, 'urban riverside', 'Yellow fever, malaria, dangerous river currents', 'Trading post, medical supplies, boat repairs', 'Iquito, Yagua'],
    
    ['Manaus', 'city', -3.1190, -60.0217, 'Brazilian city at the confluence of Negro and Solimões rivers. Once the richest city in South America during rubber boom.', 'Opera house built in 1896. By 1930s, economy declined but remained important port.', 1669, 'urban riverside', 'Flooding during wet season, tropical diseases', 'Major supply depot, hospital, telegraph station', 'Manaó, Baré'],
    
    ['Leticia', 'town', -4.2153, -69.9406, 'Colombian border town where Brazil, Colombia, and Peru meet. Strategic trading point.', 'Established as Colombian outpost in 1867. Disputed territory until 1930s.', 1867, 'border riverside', 'Border conflicts, smugglers, rapids', 'International trade, diverse supplies', 'Tikuna, Yagua'],
    
    ['Santarém', 'town', -2.4426, -54.7083, 'At the confluence of Tapajós and Amazon rivers. Famous for the Meeting of Waters phenomenon.', 'Founded 1661. Important rubber collection point in 1930s.', 1661, 'river confluence', 'Strong currents, river pirates', 'Fishing, trading center, indigenous medicines', 'Tapajós, Maué'],
    
    ['Belém', 'city', -1.4558, -48.5039, 'Gateway to the Amazon at the mouth of the river. Portuguese colonial architecture.', 'Founded 1616. Major export port for rubber, Brazil nuts, and tropical hardwoods in 1930s.', 1616, 'tidal estuary', 'Tidal flooding, ocean storms, port diseases', 'Modern hospital, telegraph, ocean shipping', 'Tupinambá'],
    
    ['Porto Velho', 'town', -8.7619, -63.9039, 'Endpoint of the infamous Madeira-Mamoré Railway. Gateway to rubber territories.', 'Founded 1907 during railway construction. Thousands died of disease. Operating in 1930s.', 1907, 'riverside', 'Malaria endemic, railway accidents, jaguars', 'Railway access, mining equipment, medical station', 'Karitiana, Karipuna'],
    
    ['Tefe', 'town', -3.3828, -64.7103, 'Remote trading post deep in the Amazon. Used by naturalists including Henry Bates.', 'Mission established 1759. Henry Walter Bates studied here 1850s. Active in 1930s.', 1759, 'deep jungle riverside', 'Isolation, limited supplies, anacondas', 'Natural history specimens, indigenous guides', 'Tikuna, Miranha'],
    
    ['Parintins', 'town', -2.6308, -56.7353, 'Island town known for indigenous culture and folklore. Folklore festival origins here.', 'Founded 1796. Indigenous cultural center. Folklore traditions documented in 1930s.', 1796, 'river island', 'Flooding, limited medical care', 'Indigenous crafts, folklore knowledge, fish', 'Sateré-Mawé'],
    
    ['Tabatinga', 'outpost', -4.2489, -69.9361, 'Remote Brazilian military outpost on the Peru-Colombia border.', 'Military post established 1776. Strategic location monitored in 1930s.', 1776, 'tri-border jungle', 'Complete isolation, hostile encounters, diseases', 'Military protection, emergency shelter', 'Tikuna'],
    
    ['Óbidos', 'town', -1.9067, -55.5158, 'Narrow point of the Amazon where river is only 1.5 km wide. Natural fortress.', 'Founded 1697. Narrowest point of Amazon. Defended against invaders.', 1697, 'river narrows', 'Treacherous currents, whirlpools', 'Strategic passage, fishing', 'Tapajó'],
    
    ['Fordlândia', 'plantation', -3.8228, -55.4886, 'Henry Ford\'s failed rubber plantation. American town in the jungle.', 'Established 1928 by Henry Ford. Attempt to break British rubber monopoly. Active but struggling in 1930s.', 1928, 'plantation clearing', 'Leaf blight fungus, labor unrest, isolation', 'American supplies, machinery, medical care', 'Munduruku (displaced)'],
    
    ['Marajó Island', 'island', -1.0000, -49.5000, 'Largest river island in the world. Buffalo ranching and ancient indigenous sites.', 'Inhabited for millennia. Buffalo introduced 1700s. Ranching economy in 1930s.', 0, 'river island savanna', 'Flooding six months/year, buffalo attacks', 'Buffalo meat, indigenous pottery, fish', 'Marajoara descendants'],
    
    ['Alter do Chão', 'village', -2.5072, -54.9536, 'Small village with white sand beaches. Called "Caribbean of the Amazon."', 'Ancient indigenous settlement. "Discovered" by explorers in 1930s.', 0, 'white sand beaches', 'Remote, limited supplies, jaguars nearby', 'Pristine nature, medicinal plants', 'Borari'],
    
    ['São Gabriel da Cachoeira', 'mission', -0.1300, -67.0892, 'Remote mission town on Rio Negro. Highest indigenous population in Brazil.', 'Mission founded 1668. Multiple indigenous languages spoken. Remote in 1930s.', 1668, 'black water river', 'Extreme remoteness, limited food, rapids', 'Indigenous knowledge, unique river species', 'Baniwa, Baré, Tukano'],
    
    ['Pongo de Manseriche', 'canyon', -4.5000, -77.5833, 'Dramatic canyon where the Marañón River cuts through the Andes. Most dangerous rapids.', 'Expedition site for explorers. Many deaths attempting passage. Legendary in 1930s.', 0, 'mountain canyon', 'Deadly rapids, narrow gorges, waterfalls', 'None - survival passage only', 'Aguaruna'],
  ];

  const insertMany = db.transaction((locations) => {
    for (const loc of locations) {
      insertLocation.run(...loc);
    }
  });
  insertMany(locations);

  // Insert Amazon animals
  const insertAnimal = db.prepare(`
    INSERT INTO animals (common_name, scientific_name, category, size, danger_level, habitat, behavior, diet, conservation_status, interesting_fact, indigenous_name, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const animals = [
    // Mammals
    ['Jaguar', 'Panthera onca', 'mammal', 'large', 'high', 'all forest types', 'Solitary apex predator, excellent swimmer, hunts caimans and capybaras', 'carnivore', 'Near Threatened', 'Has the strongest bite force of any big cat, can crush turtle shells and skulls', 'Yaguareté', 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Standing_jaguar.jpg'],
    ['Giant River Otter', 'Pteronura brasiliensis', 'mammal', 'large', 'medium', 'rivers and lakes', 'Social family groups, aggressive territory defense, hunt cooperatively', 'carnivore', 'Endangered', 'Called "river wolf" by locals, can grow to 6 feet long, hunts piranhas', 'Ariranhas', 'https://upload.wikimedia.org/wikipedia/commons/9/91/Giant_otter_in_Cantao.jpg'],
    ['Pink River Dolphin', 'Inia geoffrensis', 'mammal', 'large', 'low', 'rivers and flooded forests', 'Intelligent, uses echolocation, neck is flexible unlike ocean dolphins', 'carnivore', 'Endangered', 'Legend says they transform into handsome men at night. Actually pink due to blood vessels.', 'Boto', 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Amazonriverdolphin2.jpg'],
    ['Three-toed Sloth', 'Bradypus variegatus', 'mammal', 'medium', 'low', 'canopy', 'Moves incredibly slowly, algae grows on fur for camouflage, sleeps 15-20 hours daily', 'herbivore', 'Least Concern', 'Only defecates once per week, climbing down puts them at risk from predators', 'Pelejo', 'https://upload.wikimedia.org/wikipedia/commons/1/18/Bradypus.jpg'],
    ['Capybara', 'Hydrochoerus hydrochaeris', 'mammal', 'large', 'low', 'rivers and wetlands', 'World\'s largest rodent, semi-aquatic, lives in groups up to 100', 'herbivore', 'Least Concern', 'Can stay underwater for 5 minutes, frequently preyed upon by jaguars and anacondas', 'Carpincho', 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Capybara_%28Hydrochoerus_hydrochaeris%29.JPG'],
    ['Howler Monkey', 'Alouatta seniculus', 'mammal', 'medium', 'low', 'canopy', 'Loudest land animal, calls can be heard 3 miles away, uses prehensile tail', 'herbivore', 'Least Concern', 'Their roar comes from an enlarged hyoid bone in their throat', 'Araguato', 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Alouatta_seniculus_%28Kok%C3%AD%29_-_Flickr_-_Alejandro_Bayer_%282%29.jpg'],
    ['Tapir', 'Tapirus terrestris', 'mammal', 'large', 'low', 'forest floor and rivers', 'Ancient lineage, excellent swimmers, use trunk-like nose for foraging', 'herbivore', 'Vulnerable', 'Closest living relatives are horses and rhinos, despite looking like pigs', 'Anta', 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Lowland_Tapir.jpg'],
    ['Puma', 'Puma concolor', 'mammal', 'large', 'high', 'various forests', 'Second largest cat in Americas, solitary hunter, ambush predator', 'carnivore', 'Least Concern', 'Can leap 18 feet vertically and 40 feet horizontally', 'León', 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Mountain_Lion_in_Glacier_National_Park.jpg'],
    ['Giant Anteater', 'Myrmecophaga tridactyla', 'mammal', 'large', 'medium', 'grasslands and forests', 'Eats 30,000 insects daily, 2-foot-long tongue, powerful claws can kill jaguars', 'insectivore', 'Vulnerable', 'No teeth, sticky saliva traps ants. Claws so large they walk on knuckles.', 'Oso hormiguero', 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Myrmecophaga_tridactyla_-_05.jpg'],
    ['Spider Monkey', 'Ateles belzebuth', 'mammal', 'medium', 'low', 'canopy', 'Highly intelligent, prehensile tail acts as fifth limb, acrobatic', 'frugivore', 'Endangered', 'Their tail is so strong it can support their entire body weight', 'Maquisapa', 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Ateles_belzebuth_3.jpg'],
    ['Ocelot', 'Leopardus pardalis', 'mammal', 'medium', 'medium', 'various forests', 'Nocturnal spotted cat, excellent climber, solitary hunter', 'carnivore', 'Least Concern', 'Unlike most cats, ocelots are good swimmers and often hunt fish', 'Tigrillo', 'https://upload.wikimedia.org/wikipedia/commons/1/15/Ocelot_%28Jaguatirica%29_Zoo_Itatiba.jpg'],
    ['Kinkajou', 'Potos flavus', 'mammal', 'small', 'low', 'canopy', 'Nocturnal, prehensile tail, related to raccoons, feeds on fruit and honey', 'omnivore', 'Least Concern', 'Has a 5-inch tongue for extracting honey, pollinate flowers while feeding', 'Mono de noche', 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Kinkajou_%28Potos_flavus%29_2.jpg'],
    
    // Reptiles
    ['Green Anaconda', 'Eunectes murinus', 'reptile', 'giant', 'high', 'rivers and swamps', 'Largest snake by weight, ambush predator, constricts prey, can stay submerged 10 minutes', 'carnivore', 'Least Concern', 'Can grow over 29 feet and weigh 550 lbs, eats caimans and capybaras whole', 'Sucuri', 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Eunectes_murinus_-_National_Zoo_-_01.jpg'],
    ['Black Caiman', 'Melanosuchus niger', 'reptile', 'giant', 'high', 'rivers and lakes', 'Largest predator in Amazon, hunts at night, can grow 16+ feet', 'carnivore', 'Conservation Dependent', 'Once nearly extinct from hunting, apex predator, attacks humans occasionally', 'Jacaré-açu', 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Black-Caiman.jpg'],
    ['Spectacled Caiman', 'Caiman crocodilus', 'reptile', 'medium', 'medium', 'rivers and wetlands', 'Most common crocodilian, bony ridge between eyes like spectacles', 'carnivore', 'Least Concern', 'Can survive in brackish and salt water, unlike most caimans', 'Babilla', 'https://upload.wikimedia.org/wikipedia/commons/2/29/Spectacled_Caiman.jpg'],
    ['Yellow-footed Tortoise', 'Chelonoidis denticulatus', 'reptile', 'medium', 'low', 'forest floor', 'Herbivorous, long-lived (50+ years), important seed dispersers', 'herbivore', 'Vulnerable', 'Males make clucking sounds during mating, highly prized for meat historically', 'Motelo', 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Chelonoidis_denticulata_2.jpg'],
    ['Emerald Tree Boa', 'Corallus caninus', 'reptile', 'large', 'low', 'canopy', 'Bright green camouflage, heat-sensing pits, coils on branches', 'carnivore', 'Least Concern', 'Babies are born red or orange, turn green after one year', 'Boa verde', 'https://upload.wikimedia.org/wikipedia/commons/5/59/Corallus_caninus_001.JPG'],
    ['Bushmaster', 'Lachesis muta', 'reptile', 'large', 'extreme', 'forest floor', 'Largest pit viper in Americas, most dangerous snake in Amazon, rarely seen', 'carnivore', 'Least Concern', 'Extremely venomous but rarely encounters humans, vibrates tail like rattlesnake', 'Surucucu', 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Bushmaster_at_Whiteoak_%285833547769%29.jpg'],
    ['Poison Dart Frog', 'Dendrobates tinctorius', 'amphibian', 'tiny', 'extreme', 'forest floor', 'Toxic skin secretions, bright warning colors, carry tadpoles on back', 'insectivore', 'Least Concern', 'Indigenous people used their toxins on blow darts. Toxicity comes from diet.', 'Rana venenosa', 'https://upload.wikimedia.org/wikipedia/commons/5/55/Dendrobates_tinctorius_%22azureus%22.jpg'],
    ['Glass Frog', 'Centrolenidae family', 'amphibian', 'small', 'low', 'trees near water', 'Transparent belly shows organs, lays eggs on leaves over water', 'insectivore', 'Various', 'You can see their heart beating and watch digestion happening', 'Rana de cristal', 'https://upload.wikimedia.org/wikipedia/commons/b/be/Boophis_sp_1.jpg'],
    ['Boa Constrictor', 'Boa constrictor', 'reptile', 'large', 'medium', 'various forests', 'Powerful constrictor, hunts mammals and birds, non-venomous', 'carnivore', 'Least Concern', 'Can grow to 13 feet long, heat-sensing scales detect warm-blooded prey', 'Boa', 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Boa_constrictor_%28Saint-Aignan-sur-Cher%29.JPG'],
    ['Matamata Turtle', 'Chelus fimbriata', 'reptile', 'medium', 'low', 'slow rivers', 'Bizarre leaf-like appearance, vacuum-feeding method, completely aquatic', 'carnivore', 'Least Concern', 'Opens its mouth rapidly creating suction that pulls in fish whole', 'Matamata', 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Mata_mata.jpg'],
    
    // Birds
    ['Harpy Eagle', 'Harpia harpyja', 'bird', 'large', 'medium', 'canopy', 'Most powerful raptor, hunts monkeys and sloths, crowned head', 'carnivore', 'Near Threatened', 'Talons are same size as grizzly bear claws, can carry prey equal to their body weight', 'Águila arpía', 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Harpia_harpyja_-Belize_Zoo%2C_Belize-8a.jpg'],
    ['Scarlet Macaw', 'Ara macao', 'bird', 'large', 'low', 'canopy', 'Intelligent, mate for life, loud calls, spectacular red-yellow-blue plumage', 'herbivore', 'Least Concern', 'Eats clay to neutralize toxins from unripe seeds. Can live 50+ years.', 'Guacamayo', 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Ara_macao_-Diergaarde_Blijdorp-8a.jpg'],
    ['Hoatzin', 'Opisthocomus hoazin', 'bird', 'medium', 'low', 'riverside vegetation', 'Called "stinkbird" for manure-like smell, chicks have wing claws', 'herbivore', 'Least Concern', 'Only bird that ferments food like a cow. Chicks swim if threatened.', 'Chenchena', 'https://upload.wikimedia.org/wikipedia/commons/9/90/Hoatzin_%28Opisthocomus_hoazin%29.JPG'],
    ['Toucan', 'Ramphastos toco', 'bird', 'medium', 'low', 'canopy', 'Massive colorful bill (1/3 of body length), social, regulates temperature with bill', 'omnivore', 'Least Concern', 'Bill is hollow and filled with air pockets, surprisingly lightweight despite size', 'Tucán', 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Ramphastos_toco_-Birdworld%2C_Farnham%2C_Surrey%2C_England-8a.jpg'],
    ['Jabiru Stork', 'Jabiru mycteria', 'bird', 'giant', 'low', 'wetlands', 'Tallest flying bird in Americas (5 feet), massive wingspan (9 feet)', 'carnivore', 'Least Concern', 'One of only two storks with no voice box, makes clattering sounds instead', 'Tuiuiú', 'https://upload.wikimedia.org/wikipedia/commons/2/25/Jabiru_mycteria_-Iberaquera_Lake%2C_near_Laguna%2C_Santa_Catarina%2C_Brazil-8.jpg'],
    ['King Vulture', 'Sarcoramphus papa', 'bird', 'large', 'low', 'various', 'Colorful head, tears open carcasses that others cannot, excellent sense of smell', 'scavenger', 'Least Concern', 'Mayan legends say it was a king or message-bearer between humans and gods', 'Rey zamuro', 'https://upload.wikimedia.org/wikipedia/commons/3/34/King_Vulture_%28Sarcoramphus_papa%29_adult_head.jpg'],
    ['Blue-and-yellow Macaw', 'Ara ararauna', 'bird', 'large', 'low', 'forest edges', 'Intelligent parrot, strong pair bonds, loud vocalizations', 'herbivore', 'Least Concern', 'Can crack Brazil nuts with 200 psi bite force, use tools in captivity', 'Guacamayo azul', 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Ara_ararauna_-two_captive-8a.jpg'],
    ['Roseate Spoonbill', 'Platalea ajaja', 'bird', 'medium', 'low', 'wetlands', 'Distinctive spoon-shaped bill, sweeps side-to-side to catch fish', 'carnivore', 'Least Concern', 'Pink color comes from carotenoid pigments in crustaceans they eat', 'Garza rosada', 'https://upload.wikimedia.org/wikipedia/commons/5/51/Roseate_Spoonbill_-_Myakka_River_State_Park.jpg'],
    
    // Fish
    ['Red-bellied Piranha', 'Pygocentrus nattereri', 'fish', 'small', 'medium', 'rivers', 'Sharp teeth, feeds in schools, attracted to blood and splashing', 'carnivore', 'Least Concern', 'More dangerous when river levels drop and they\'re concentrated. Usually eat fish.', 'Palometa', 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Piranha_fish.jpg'],
    ['Electric Eel', 'Electrophorus electricus', 'fish', 'large', 'high', 'muddy rivers', 'Not actually an eel, produces 600-volt shocks, breathes air', 'carnivore', 'Least Concern', 'Can discharge multiple times, uses electricity to stun prey and navigate murky water', 'Anguila eléctrica', 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Electric-eel.jpg'],
    ['Arapaima', 'Arapaima gigas', 'fish', 'giant', 'low', 'rivers and lakes', 'One of largest freshwater fish (10 feet+), breathes air, ancient species', 'carnivore', 'Data Deficient', 'Has bony scales like armor, must surface for air every 20 minutes', 'Pirarucu', 'https://upload.wikimedia.org/wikipedia/commons/1/13/Arapaima_gigas_at_Kuda-Kura_Zoo.jpg'],
    ['Candiru', 'Vandellia cirrhosa', 'fish', 'tiny', 'high', 'rivers', 'Parasitic catfish, attracted to blood and urea, can enter body openings', 'parasite', 'Least Concern', 'Feared by locals, documented cases of entering human urethra, nearly impossible to remove', 'Canero', 'https://upload.wikimedia.org/wikipedia/commons/9/98/Vandellia_cirrhosa.jpg'],
    ['Payara', 'Hydrolycus scomberoides', 'fish', 'medium', 'medium', 'fast rivers', 'Vampire fangs (6 inches long), aggressive predator, leaps from water', 'carnivore', 'Least Concern', 'Fangs fit into sockets in upper jaw, swallows fish whole after impaling them', 'Cachorra', 'https://upload.wikimedia.org/wikipedia/commons/4/41/Hydrolycus_scomberoides.jpg'],
    ['Discus', 'Symphysodon aequifasciatus', 'fish', 'small', 'low', 'black water rivers', 'Brightly colored disc-shaped fish, secretes mucus to feed fry', 'omnivore', 'Least Concern', 'Both parents produce skin secretions to feed their young', 'Acará disco', 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Symphysodon_discus_2009_G1.jpg'],
    ['Stingray', 'Potamotrygon motoro', 'fish', 'medium', 'high', 'river bottoms', 'Venomous barbed tail, camouflages on sandy bottom', 'carnivore', 'Data Deficient', 'Freshwater stingray, sting is extremely painful and can be fatal if untreated', 'Raya', 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Potamotrygon_motoro_2.jpg'],
    
    // Insects & Arachnids
    ['Bullet Ant', 'Paraponera clavata', 'insect', 'small', 'extreme', 'forest floor', 'Most painful insect sting in the world (lasts 24 hours), inch-long', 'omnivore', 'Least Concern', 'Named because sting feels like being shot. Indigenous rites use ant gloves for boys to become men.', 'Hormiga bala', 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Paraponera_clavata.jpg'],
    ['Brazilian Wandering Spider', 'Phoneutria fera', 'arachnid', 'medium', 'extreme', 'forest floor', 'Most venomous spider, aggressive when threatened, wanders instead of building webs', 'carnivore', 'Least Concern', 'Guinness Record for most venomous spider. Venom causes painful erections.', 'Araña errante', 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Phoneutria_fera_in_the_Brazilian_Amazon.jpg'],
    ['Morpho Butterfly', 'Morpho menelaus', 'insect', 'small', 'low', 'forest and edges', 'Brilliant iridescent blue wings (6-inch wingspan), flash to startle predators', 'herbivore', 'Least Concern', 'Blue color comes from microscopic scales reflecting light, not pigment', 'Mariposa azul', 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Blue_morpho_butterfly.jpg'],
    ['Leafcutter Ant', 'Atta cephalotes', 'insect', 'tiny', 'low', 'forest floor', 'Cuts leaves to farm fungus underground, creates highways, superorganism colonies', 'fungivore', 'Least Concern', 'Consume more vegetation than any other animal group in rainforest', 'Hormiga culona', 'https://upload.wikimedia.org/wikipedia/commons/1/17/Atta_cephalotes-pjt.jpg'],
    ['Titan Beetle', 'Titanus giganteus', 'insect', 'large', 'low', 'forest floor', 'One of largest beetles (6.5 inches), powerful jaws, rare sightings', 'herbivore', 'Data Deficient', 'Adults don\'t eat, survive on fat reserves. Larval stage remains unknown.', 'Escarabajo titán', 'https://upload.wikimedia.org/wikipedia/commons/3/35/Titanus_giganteus.jpg'],
    ['Owl Butterfly', 'Caligo sp.', 'insect', 'medium', 'low', 'forest floor', 'Large eye-spots on wings mimic owl eyes to scare predators', 'herbivore', 'Various', 'Wingspan up to 8 inches, active at dusk when owls hunt', 'Mariposa búho', 'https://upload.wikimedia.org/wikipedia/commons/2/25/Caligo_eurilochus_2.jpg'],
    ['Hercules Beetle', 'Dynastes hercules', 'insect', 'large', 'low', 'canopy', 'Males have huge horns for fighting, one of strongest animals for body size', 'herbivore', 'Least Concern', 'Can carry 850 times their own body weight', 'Escarabajo hércules', 'https://upload.wikimedia.org/wikipedia/commons/4/45/Dynastes_hercules_ecuatorianus_MHNT_Dos.jpg'],
    ['Tarantula', 'Theraphosa blondi', 'arachnid', 'large', 'medium', 'forest floor burrows', 'Goliath birdeater, world\'s largest spider by mass (6 oz), rarely eats birds', 'carnivore', 'Least Concern', 'Despite name, mainly eats insects and worms. Hisses by rubbing leg hairs', 'Tarántula gigante', 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Theraphosa_blondi_-_01.JPG'],
  ];

  const insertManyAnimals = db.transaction((animals) => {
    for (const animal of animals) {
      insertAnimal.run(...animal);
    }
  });
  insertManyAnimals(animals);

  // Insert medicinal and important plants
  const insertPlant = db.prepare(`
    INSERT INTO plants (common_name, scientific_name, medicinal_use, edible, dangerous, habitat, description, indigenous_use)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const plants = [
    ['Ayahuasca Vine', 'Banisteriopsis caapi', 'Spiritual healing, purgative, visions', 0, 1, 'primary forest', 'Woody vine used in sacred ceremonies, contains MAO inhibitors', 'Shamanic ceremonies, spiritual healing, divination'],
    ['Cat\'s Claw', 'Uncaria tomentosa', 'Immune boost, anti-inflammatory, arthritis relief', 1, 0, 'primary forest', 'Climbing vine with claw-like thorns, powerful medicinal bark', 'Wound healing, stomach ailments, immune support'],
    ['Brazil Nut Tree', 'Bertholletia excelsa', 'Nutritious food source, selenium-rich', 1, 0, 'terra firme forest', 'Massive tree (150+ feet), produces hard pods with 12-20 nuts', 'Food staple, trade commodity, tool construction'],
    ['Açaí Palm', 'Euterpe oleracea', 'Heart health, antioxidants, energy', 1, 0, 'várzea floodplains', 'Produces purple berries rich in nutrients and antioxidants', 'Food staple, energy source, palm heart vegetable'],
    ['Curare Vine', 'Chondrodendron tomentosum', 'Muscle relaxant, hunting poison, surgery paralytic', 0, 1, 'primary forest', 'Contains alkaloids that cause paralysis, used on blow darts', 'Hunting poison for darts, paralytic for surgery'],
    ['Cinchona Tree', 'Cinchona officinalis', 'Malaria treatment (quinine), fever reducer', 1, 0, 'Andean foothills', 'Bark contains quinine, only cure for malaria until 1940s', 'Fever treatment, malaria cure, essential medicine'],
    ['Copaiba Tree', 'Copaifera officinalis', 'Antiseptic, wound healing, anti-inflammatory oil', 0, 0, 'terra firme forest', 'Produces medicinal oil-resin from trunk, used like antiseptic', 'Wound healing, skin infections, fuel for lamps'],
    ['Rubber Tree', 'Hevea brasiliensis', 'Latex harvesting for rubber industry', 0, 0, 'várzea forests', 'Source of natural rubber, basis of Amazon rubber boom 1880s-1920s', 'Waterproofing, tool construction, trade'],
    ['Tobacco', 'Nicotiana tabacum', 'Ritual purification, insect repellent, offerings', 1, 1, 'cleared areas', 'Strong hallucinogenic variety used in shamanic rituals', 'Spiritual ceremonies, insect repellent, trade'],
    ['Guarana', 'Paullinia cupana', 'Energy boost, cognitive enhancement, caffeine source', 1, 0, 'forest', 'Seeds contain 2x caffeine of coffee, traditional energy source', 'Energy and stamina, hunting preparation, trade'],
  ];

  const insertManyPlants = db.transaction((plants) => {
    for (const plant of plants) {
      insertPlant.run(...plant);
    }
  });
  insertManyPlants(plants);

  console.log(`Database initialized with ${locations.length} locations, ${animals.length} animals, and ${plants.length} plants.`);
  
  return db;
}

export function getDatabase() {
  const db = new Database(dbPath);
  return db;
}
