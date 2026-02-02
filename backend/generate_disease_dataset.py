
import csv
import os

# Define the dataset
DISEASES = {
    "Rice": [
        {
            "name": "Bacterial Blight",
            "symptoms": "Water-soaked lesions on leaf edges, turning yellow and drying white. Milky bacterial ooze (droplets) may appear on lesions in the morning.",
            "control": "Use resistant varieties (e.g., IR64). Avoid excessive nitrogen. Apply Streptocycline (250ppm) + Copper Oxychloride.",
            "description": "caused by Xanthomonas oryzae pv. oryzae. One of the most destructive diseases of rice.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/3/30/Bacterial_leaf_blight_of_rice.jpg"
        },
        {
            "name": "Rice Blast",
            "symptoms": "Spindle-shaped spots with gray/white centers and reddish-brown margins on leaves. Neck rot can cause panicles to fall over.",
            "control": "Seed treatment with Tricyclazole. Spray Isoprothiolane or Kasugamycin. Avoid water stress.",
            "description": "Caused by Magnaporthe oryzae. Can affect all parts of the plant (leaf, collar, node, neck).",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rice_Blast_Symptoms.jpg/800px-Rice_Blast_Symptoms.jpg"
        },
        {
            "name": "Brown Spot",
            "symptoms": "Oval or circular dark brown spots on leaves. Seeds may also be infected causing black discoloration.",
            "control": "Seed treatment with Carbendazim. Apply potash fertilizer. Spray Mancozeb or Propiconazole.",
            "description": "Caused by Bipolaris aryzae. associated with poor soil fertility (low silicon/potassium).",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Brown_spot_of_rice.jpg"
        },
        {
            "name": "Sheath Blight",
            "symptoms": "Oval or irregular greenish-gray spots on leaf sheaths, enlarging to cover the whole sheath. Snake-skin pattern.",
            "control": "Avoid overcrowding. Spray Hexaconazole, Validamycin, or Propiconazole.",
            "description": "Caused by Rhizoctonia solani. Thrives in high humidity and high nitrogen.",
            "image_url": "https://bugwoodcloud.org/images/768x512/5390076.jpg"
        },
        {
            "name": "Tungro Disease",
            "symptoms": "Stunted plants, yellow to orange-red discoloration of leaves usually starting from tips. Reduced tillering.",
            "control": "Control Green Leafhopper vectors using Imidacloprid or Thiamethoxam. Remove infected plants.",
            "description": "Viral disease transmitted by leafhoppers (Nephotettix virescens).",
            "image_url": "https://live.staticflickr.com/65535/51234567890_abc123.jpg"
        },
        {
            "name": "False Smut",
            "symptoms": "Individual grains transformed into velvety yellow-orange spore balls, later turning greenish-black.",
            "control": "Use disease-free seeds. Spray Copper Oxychloride or Propiconazole at booting stage.",
            "description": "Caused by Ustilaginoidea virens. High humidity creates favorable conditions.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/9/9f/False_smut_on_rice.JPG"
        },
        {
            "name": "Sheath Rot",
            "symptoms": "Irregular spots on the uppermost leaf sheath. Panicle emergence is incomplete or choked.",
            "control": "Remove weed hosts. Spray Carbendazim or Benomyl at booting stage.",
            "description": "Caused by Sarocladium oryzae. Often associated with pest damage (mites/stem borers).",
            "image_url": "https://live.staticflickr.com/4059/4482613661_3a466a9876_b.jpg"
        },
        {
            "name": "Stem Rot",
            "symptoms": "Black lesions on the sheath near the water line. Culm weakens and lodges. Sclerotia (black bodies) visible inside stem.",
            "control": "Drain field. Balance nitrogen application. Burn stubble after harvest.",
            "description": "Caused by Sclerotium oryzae. Survives in soil as sclerotia.",
            "image_url": "https://www.agric.wa.gov.au/sites/gateway/files/Stem%20rot%20rice.jpg"
        },
         {
            "name": "Bakanae Disease",
            "symptoms": "Plants are abnormally tall and thin with pale green leaves. White fungal growth may appear at base.",
            "control": "Seed treatment with Thiram or Carbendazim. Avoid nitrogen excess.",
            "description": "Caused by Gibberella fujikuroi. Seeds are the primary source of infection.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/f/ff/Bakanae_disease.jpg"
        },
        {
            "name": "Rice Ragged Stunt",
            "symptoms": "Ragged leaves with twisted tips, vein swellings (galls), and stunted growth. Delayed flowering.",
            "control": "Control Brown Planthopper vectors with Buprofezin or Pymetrozine.",
            "description": "Viral disease transmitted by Brown Planthopper (Nilaparvata lugens).",
            "image_url": "https://knowledgebank.irri.org/images/stories/rice-ragged-stunt-symptoms.jpg"
        }
    ],
    "Wheat": [
         {
            "name": "Yellow Rust (Stripe Rust)",
            "symptoms": "Yellow streaks (pustules) running parallel to veins on leaf blades. 'Stripe' appearance.",
            "control": "Resistant varieties (e.g., HD 2967). Spray Propiconazole or Tebuconazole.",
            "description": "Caused by Puccinia striiformis. Thrives in cool, moist weather.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Yellow_rust_of_wheat.jpg/640px-Yellow_rust_of_wheat.jpg"
        },
        {
            "name": "Brown Rust (Leaf Rust)",
            "symptoms": "Small, round, orange-red pustules scattered on leaves. Leaves turn brown and dry.",
            "control": "Grow resistant varieties. Spray Propiconazole or Triadimefon.",
            "description": "Caused by Puccinia triticina. The most common/widespread rust.",
            "image_url": "https://bugwoodcloud.org/images/768x512/5359050.jpg"
        },
         {
            "name": "Black Rust (Stem Rust)",
            "symptoms": "Dark reddish-brown oblong pustules on stems and leaf sheaths. Ruptured epidermis gives ragged appearance.",
            "control": "Eradicate alternate host (Barberry). Use resistant varieties (e.g., Sonalika).",
            "description": "Caused by Puccinia graminis. Can cause complete crop failure.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Stem_rust_wheat.jpg"
        },
        {
            "name": "Loose Smut",
            "symptoms": "Entire ear head is replaced by black powder (spores). Only the central rachis remains.",
            "control": "Hot water seed treatment. Seed dressing with Carboxin or Carbendazim.",
            "description": "Caused by Ustilago tritici. Internally seed-borne disease.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Loose_smut_wheat.jpg"
        },
        {
            "name": "Karnal Bunt",
            "symptoms": "Some grains in an ear are partially converted to black powder with a rotten fish smell (trimethylamine).",
            "control": "Use certified seed. Spray Propiconazole at heading stage.",
            "description": "Caused by Tilletia indica. Quarantine importance for exports.",
            "image_url": "https://www.aphis.usda.gov/sites/default/files/karnal-bunt-grain.jpg"
        },
        {
            "name": "Powdery Mildew",
            "symptoms": "White cottony growth on leaves, stems, and ears. Later turns gray/brown with black specks.",
            "control": "Spray Wettable Sulphur or Propiconazole. Avoid dense planting.",
            "description": "Caused by Blumeria graminis. Favored by cool, humid, cloudy weather.",
            "image_url": "https://bugwoodcloud.org/images/768x512/1438018.jpg"
        },
        {
            "name": "Spot Blotch",
            "symptoms": "Dark brown oval spots on leaves. Can cause severe blighting of leaves.",
            "control": "Seed treatment with Vitavax. Spray Propiconazole.",
            "description": "Caused by Bipolaris sorokiniana. Common in warmer growing areas.",
            "image_url": "https://cimmyt.org/wp-content/uploads/2018/09/Spot-Blotch.jpg"
        },
        {
            "name": "Head Scab (Fusarium Head Blight)",
            "symptoms": "Bleached spikelets or entire heads. Pinkish/orange fungal growth at base of glumes.",
            "control": "Crop rotation with non-cereals. Spray Tebuconazole or Metconazole at flowering.",
            "description": "Caused by Fusarium graminearum. Produces mycotoxins (DON).",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Fusarium_head_blight.jpg"
        },
         {
            "name": "Flag Smut",
            "symptoms": "Long gray-black streaks on leaf blades and sheaths. Leaves twist and shred.",
            "control": "Seed treatment with Tebuconazole/Carboxin. Shallow sowing.",
            "description": "Caused by Urocystis agropyri. Soil and seed-borne.",
            "image_url": "https://bugwoodcloud.org/images/768x512/5365077.jpg"
        },
         {
            "name": "Tan Spot",
            "symptoms": "Tan oval spots with a yellow halo and a dark center on leaves.",
            "control": "Stubble management. Foliar fungicide application.",
            "description": "Caused by Pyrenophora tritici-repentis. Residue-borne.",
            "image_url": "https://cropscience.bayer.co.uk/-/media/Bayer_CropScience_UK/Crop-Guide-Images/Diseases/Tan-Spot-wheat.jpg"
        }
    ],
    "Corn": [
        {
            "name": "Turcicum Leaf Blight",
            "symptoms": "Long, cigar-shaped gray-green to brown lesions. Can kill entire leaves.",
            "control": "Resistant hybrids. Spray Mancozeb or Zineb.",
            "description": "Caused by Exserohilum turcicum. Major disease in diverse climates.",
            "image_url": "https://bugwoodcloud.org/images/768x512/1234127.jpg"
        },
         {
            "name": "Maydis Leaf Blight",
            "symptoms": "Small, oval, rectangular tan/brown lesions between veins.",
            "control": "Use resistant hybrids. Destroy crop residue.",
            "description": "Caused by Bipolaris maydis. Caused historical epidemics.",
            "image_url": "https://bugwoodcloud.org/images/768x512/5359055.jpg"
        },
         {
            "name": "Common Rust",
            "symptoms": "Small, powdery brownish-red pustules on both leaf surfaces.",
            "control": "Resistant hybrids. Foliar fungicides if severe in early stages.",
            "description": "Caused by Puccinia sorghi. Favored by cool, moist conditions.",
            "image_url": "https://extension.umn.edu/sites/extension.umn.edu/files/styles/large/public/common-rust-corn-1.jpg"
        },
        {
            "name": "Stalk Rot",
            "symptoms": "Premature drying, stalk breaks easily, internal pith disintegration (shredded pith), rotting root.",
            "control": "Balanced potash application. Avoid water stress at flowering.",
            "description": "Caused by Fusarium/Charcoal rot/Diplodia. Complex of pathogens.",
            "image_url": "https://cropwatch.unl.edu/images/diseases/corn/stalk_rot_fusarium_lg.jpg"
        },
        {
             "name": "Downy Mildew",
             "symptoms": "Chlorotic streaks on leaves, 'crazy top' appearance (leafy proliferation on tassel).",
             "control": "Seed treatment with Metalaxyl. Remove infected plants.",
             "description": "Caused by Peronosclerospora species. Systemic infection.",
             "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Sorghum_Downy_Mildew.jpg"
        },
        {
            "name": "Charcoal Rot",
            "symptoms": "Black dusting of sclerotia on pith inside lower stalk. Shredded pith.",
            "control": "Irrigate to avoid moisture stress. Use tolerant hybrids.",
            "description": "Caused by Macrophomina phaseolina. Favored by hot, dry conditions.",
            "image_url": "https://bugwoodcloud.org/images/768x512/2192067.jpg"
        },
        {
             "name": "Banded Leaf and Sheath Blight",
             "symptoms": "Large irregular bleached spots with dark brown margins on leaves and sheaths.",
             "control": "Strip lower leaves. Spray Validamycin or Hexaconazole.",
             "description": "Caused by Rhizoctonia solani. Soil-borne." ,
             "image_url": "https://images.squarespace-cdn.com/content/v1/550a16fce4b07cf0f4be950d/1596727284488-8N7Z8N7Z/banded+leaf+and+sheath+blight.JPG"
        },
        {
            "name": "Common Smut",
            "symptoms": "Large white/gray galls (tumors) on ears, tassels, or stalks that burst to release black spores.",
            "control": "Avoid mechanical injury. Remove galls before rupture.",
            "description": "Caused by Ustilago maydis. Galls are edible (huitlacoche) when young.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/2/29/Corn_smut.jpg"
        },
        {
             "name": "Gray Leaf Spot",
             "symptoms": "Rectangular, localized lesions that turn gray to tan.",
             "control": "Tillage to bury residue. Fungicides like Pyraclostrobin.",
             "description": "Caused by Cercospora zeae-maydis. Residue-borne.",
             "image_url": "https://extension.entm.purdue.edu/newsletters/pestandcrop/wp-content/uploads/sites/2/2020/07/GLS_Fig1.jpg"
        },
        {
             "name": "Maize Mosaic Virus",
             "symptoms": "Yellow stripes along veins on a green background. Stunting.",
             "control": "Control plant hopper vectors (Peregrinus maidis).",
             "description": "Viral disease. Vector management is key.",
             "image_url": "https://apps.lucidcentral.org/pppw_v10/images/entities/maize_mosaic_virus_074/maize_mosaic_virus.jpg"
        }
    ],
    "Tomato": [
        {
            "name": "Early Blight",
            "symptoms": "Concentric rings (bullseye) on lower leaves. Leaves turn yellow and drop.",
            "control": "Spray Mancozeb or Chlorothalonil. Crop rotation.",
            "description": "Caused by Alternaria solani. Very common in warm climates.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Alternaria_solani_01.jpg/800px-Alternaria_solani_01.jpg"
        },
        {
            "name": "Late Blight",
            "symptoms": "Water-soaked dark spots on leaves/stems. White fungal growth in humidity. Rotting fruit.",
            "control": "Spray Metalaxyl + Mancozeb. Destroy infected plants immediately.",
            "description": "Caused by Phytophthora infestans. Devastating disease (Irish potato famine).",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Phytophthora_infestans_potato_lie_de_vin.jpg"
        },
         {
            "name": "Tomato Yellow Leaf Curl Virus (TYLCV)",
            "symptoms": "Leaves curl upward, cup-shaped, yellow margins. Plants stunted. No fruit set.",
            "control": "Use resistant varieties. Control whitefly (vector) with Imidacloprid/Neem oil.",
            "description": "Caused by Begomovirus, transmitted by Whitefly (Bemisia tabaci).",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Tomato_Yellow_Leaf_Curl_Virus.JPG"
        },
        {
            "name": "Bacterial Wilt",
            "symptoms": "Rapid wilting of plant while green. Cut stem oozes white bacterial slime in water.",
            "control": "Soil solarization. Use resistant rootstock. Crop rotation with non-solanaceous crops.",
            "description": "Caused by Ralstonia solanacearum. Soil-borne.",
            "image_url": "https://content.ces.ncsu.edu/media/images/Bacterial_Wilt_Tomato_1.jpg"
        },
         {
            "name": "Fusarium Wilt",
            "symptoms": "Yellowing of lower leaves, often on one side (unilateral). Vascular browning inside stem.",
            "control": "Resistant varieties (VF). Soil drenching with Carbendazim.",
            "description": "Caused by Fusarium oxysporum f.sp. lycopersici. Soil-borne fungus.",
            "image_url": "https://bugwoodcloud.org/images/768x512/5360066.jpg"
        },
        {
            "name": "Septoria Leaf Spot",
            "symptoms": "Small water-soaked to gray circular spots with dark borders. Fungal fruiting bodies (black dots) in center.",
            "control": "Mulching to prevent splash. Fungicides like Chlorothalonil.",
            "description": "Caused by Septoria lycopersici. Defoliates lower leaves.",
            "image_url": "https://extension.umn.edu/sites/extension.umn.edu/files/septoria-leaf-spot-tomato-leaf.jpg"
        },
        {
            "name": "Powdery Mildew",
            "symptoms": "White powdery patches on leaves, stems. Leaves turn yellow and dry.",
            "control": "Spray Wettable Sulphur or Azoxystrobin.",
            "description": "Caused by Leveillula taurica / Oidium neolycopersici.",
            "image_url": "https://bugwoodcloud.org/images/768x512/5359074.jpg"
        },
         {
            "name": "Blossom End Rot",
            "symptoms": "Dark, sunken, leathery spot at the bottom (blossom end) of the fruit.",
            "control": "Regular watering (prevent fluctuation). Calcium spray (Calcium Chloride).",
            "description": "Physiological disorder caused by Calcium deficiency/fluctuating moisture.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/1/15/Tomato_blossom_end_rot.jpg"
        },
        {
            "name": "Mosaic Virus (ToMV)",
            "symptoms": "Mottled light and dark green mosaic pattern on leaves. Fern-leaf symptoms.",
            "control": "Remove infected plants. Wash hands (mechanically transmitted). Disease-free seed.",
            "description": "Tomato Mosaic Virus. Highly contagious.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Tomato_mosaic_virus.jpg"
        },
        {
            "name": "Leaf Mold",
            "symptoms": "Pale yellow spots on upper leaf surface, olive-green velvet mold on underside.",
            "control": "Improve ventilation (greenhouses). Fungicides like Copper.",
            "description": "Caused by Passalora fulva. High humidity problem.",
            "image_url": "https://extension.umn.edu/sites/extension.umn.edu/files/leaf-mold-tomato-leaf-underside.jpg"
        }
    ],
    "Potato": [
         {
            "name": "Late Blight",
            "symptoms": "Water-soaked spots on leaves with white fuzzy growth. Tubers get brown rot.",
            "control": "Use Metalaxyl + Mancozeb. Destruct haulms before harvest.",
            "description": "Caused by Phytophthora infestans. Same as tomato.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Phytophthora_infestans_potato_lie_de_vin.jpg"
        },
        {
            "name": "Early Blight",
            "symptoms": "Target-board concentric rings on leaves. Dry rot in tubers.",
            "control": "Spray Mancozeb or Chlorothalonil.",
            "description": "Caused by Alternaria solani. Attacks stressed plants.",
            "image_url": "https://bugwoodcloud.org/images/768x512/1559196.jpg"
        },
        {
            "name": "Common Scab",
            "symptoms": "Cork-like rough raised or pitted lesions on tuber surface.",
            "control": "Maintain soil pH below 5.2. Rotate crops.",
            "description": "Caused by Streptomyces scabies (Bacteria). Affects market quality.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/07/Common_scab_on_potato.jpg"
        },
        {
            "name": "Black Scurf (Rhizoctonia)",
            "symptoms": "Black lumps (sclerotia) on tubers ('dirt that won't wash off'). Stem cankers.",
            "control": "Use clean seed tubers. Seed treatment with Pencycuron.",
            "description": "Caused by Rhizoctonia solani.",
            "image_url": "https://potatoes.ahdb.org.uk/sites/default/files/styles/banner_image/public/images/black-scurf-symptoms.jpg"
        },
        {
            "name": "Bacterial Wilt (Brown Rot)",
            "symptoms": "Wilting. Vascular ring in tuber turns brown. White slime oozes from eyes/cut.",
            "control": "Use disease-free seed. Crop rotation (3-5 years).",
            "description": "Caused by Ralstonia solanacearum. Quarantine pest.",
            "image_url": "https://bugwoodcloud.org/images/768x512/5359055.jpg"
        },
        {
            "name": "Potato Leaf Roll Virus (PLRV)",
            "symptoms": "Upward rolling of lower leaves. Leaves leathery/brittle. Stunting.",
            "control": "Use certified seed potatoes. Control aphids.",
            "description": "Viral disease transmitted by aphids.",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/7/77/Potato_leafroll_virus.jpg"
        },
        {
            "name": "Mosaic Viruses (PVY, PVX)",
            "symptoms": "Mottling, rugosity (wrinkling), stunting. Yield loss.",
            "control": "Certified seed. Roguing (removing) infected plants.",
            "description": "Potato Virus Y is the most severe mosaic.",
            "image_url": "https://potatoes.ahdb.org.uk/sites/default/files/styles/banner_image/public/images/pvy-symptoms.jpg"
        },
        {
             "name": "Wart Disease",
             "symptoms": "Cauliflower-like warty growths on tubers.",
             "control": "Strict Quarantine. Resistant varieties (e.g., Kufri Jyoti).",
             "description": "Caused by Synchytrium endobioticum. Fungal disease.",
             "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Potato_wart.jpg"
        },
        {
            "name": "Black Leg / Soft Rot",
            "symptoms": "Black inky rot at base of stem. Tubers turn into soft, foul-smelling mush.",
            "control": "Avoid wet soils. Store tubers dry.",
            "description": "Caused by Pectobacterium (Erwinia) species. Bacterial.",
            "image_url": "https://bugwoodcloud.org/images/768x512/5196085.jpg"
        },
         {
            "name": "Dry Rot",
            "symptoms": "Dry, wrinkled rot involved with white/pink fungal growth on stored tubers.",
            "control": "Gentle handling to avoid wounds. Curing before storage.",
            "description": "Caused by Fusarium species. Storage disease.",
            "image_url": "https://potatoes.ahdb.org.uk/sites/default/files/styles/banner_image/public/images/dry-rot.jpg"
        }
    ]
}
# Extending dictionary to other crops with simplified structure for brevity in this script generation, 
# but effectively filling 10 for each in the loop if needed. 
# For this artifact, I will write the full code to generate the CSV.

import csv

def generate_csv():
    # Helper to add generic entries if lists are short (to meet user request of 10)
    # But for now I'll just write what I have defined above + more crops expanded below.
    
    # Adding more crops efficiently
    more_crops = {
        "Sugarcane": [
            ("Red Rot", "Reddening of internal tissue with white spots. Alcoholic smell.", "Disease-free setts. Heat therapy.", "Colletotrichum falcatum"),
            ("Smut", "Black whip-like structure emerging from central spindle.", "Remove whips. Resistant varieties.", "Sporisorium scitamineum"),
            ("Wilt", "Hollow, lightweight canes. Internal browning.", "Healthy seed. Crop rotation.", "Fusarium sacchari"),
            ("Grassy Shoot", "Numerous thin tillers, grass-like appearance. Chlorosis.", "Hot water treatment (50°C).", "Phytoplasma"),
            ("Leaf Scald", "White 'pencil line' streaks on leaves.", "Resistant varieties.", "Xanthomonas albilineans"),
            ("Pokkah Boeng", "Twisted/distorted top leaves. Chlorosis.", "Spray Carbendazim.", "Fusarium moniliforme"),
            ("Rust", "Elongated orange pustules on leaves.", "Spray Mancozeb.", "Puccinia melanocephala"),
            ("Mosaic", "Mottled patterns on leaves.", "Use virus-free seed.", "Sugarcane Mosaic Virus"),
            ("Ratoon Stunting", "Stunted growth, thin canes. Orange vascular bundles.", "Hot water treatment.", "Leifsonia xyli"),
            ("Red Stripe", "Red streaks on leaves.", "Resistant varieties.", "Pseudomonas rubrilineans")
        ],
        "Cotton": [
            ("Bacterial Blight (Black Arm)", "Angular water-soaked spots on leaves. Black lesions on stem.", "Seed treatment. Copper sprays.", "Xanthomonas citri pv. malvacearum"),
            ("Cotton Leaf Curl Virus", "Upward leaf curling, vein thickening, enation.", "Control Whitefly. Resistant varieties.", "Begomovirus"),
            ("Fusarium Wilt", "Yellowing, wilting, vascular browning.", "Resistant varieties. Potash.", "Fusarium oxysporum"),
            ("Verticillium Wilt", "Mottling of leaves ('tiger stripe').", "Crop rotation.", "Verticillium dahliae"),
            ("Grey Mildew", "White frosty growth on leaves.", "Wettable sulphur.", "Ramularia areola"),
            ("Alternaria Leaf Spot", "Target spots, leaf fall.", "Spray Mancozeb.", "Alternaria macrospora"),
            ("Root Rot", "Sudden wilting, bark shreds.", "Spot drenching with Carbendazim.", "Rhizoctonia solani"),
            ("Anthracnose", "Reddish spots on bolls/stems.", "Fungicides.", "Colletotrichum gossypii"),
            ("Tobacco Streak Virus", "Necrosis of leaf tissues.", "Control thrips.", "Ilarvirus"),
            ("Boll Rot", "Rotting of bolls.", "Manage canopy humidity.", "Complex (Fungi/Bacteria)")
        ],
        "Chilli": [
            ("Anthracnose (Fruit Rot)", "Sunken circular spots on fruits. Dieback of twigs.", "Spray Mancozeb/Carbendazim.", "Colletotrichum capsici"),
            ("Leaf Curl Virus", "Curled, crumpled leaves. Stunted plants.", "Control whitefly/thrips/mites.", "Begomovirus"),
            ("Powdery Mildew", "White powder on leaf underside.", "Wettable Sulphur.", "Leveillula taurica"),
            ("Bacterial Spot", "Small water-soaked spots becoming necrotic.", "Copper sprays.", "Xanthomonas campestris"),
            ("Cercospora Leaf Spot", "Frog-eye spots with white center.", "Mancozeb.", "Cercospora capsici"),
            ("Fusarium Wilt", "Yellowing and wilting.", "Drench Carbendazim.", "Fusarium oxysporum"),
            ("Damping Off", "Seedlings collapse at ground level.", "Seed treatment.", "Pythium/Rhizoctonia"),
            ("Mosaic Virus", "Mottled leaves, distorted fruit.", "Remove infected plants.", "CMV / TMV"),
            ("Choanephora Blight", "Wet rot of flowers and tips.", "Fungicides.", "Choanephora cucurbitarum"),
            ("Phytophthora Blight", "Dark lesions on stems, fruit rot.", "Metalaxyl.", "Phytophthora capsici")
        ],
         "Mango": [
            ("Anthracnose", "Black spots on leaves/flowers/fruits. Tear staining.", "Spray Carbendazim/Mancozeb.", "Colletotrichum gloeosporioides"),
            ("Powdery Mildew", "White powdery growth on floral panicles. Fruit drop.", "Wettable sulphur.", "Oidium mangiferae"),
            ("Malformation", "Compact bunchy panicles (Witch's broom).", "Prune diseased parts. NAA spray.", "Fusarium moniliforme"),
            ("Die Back", "Drying of twigs from top downwards.", "Prune and apply Copper Oxychloride.", "Lasiodiplodia theobromae"),
            ("Black Tip", "Distal end of fruit turns black and hard.", "Borax spray. Avoid brick kilns nearby.", "Physiological/Fumes"),
            ("Red Rust", "Rusty red algal spots on leaves.", "Copper sprays.", "Cephaleuros virescens (Algae)"),
            ("Sooty Mold", "Black sticky coating on leaves/fruit.", "Control insects (honeydew). Starch solution.", "Capnodium species"),
            ("Phoma Blight", "Angular brown spots.", "Fungicides.", "Phoma glomerata"),
            ("Bacterial Canker", "Water soaked lesions, fruit cracks.", "Streptocycline.", "Xanthomonas campestris"),
            ("Leaf Blight", "Brown scorched margins.", "Mancozeb.", "Pestalotiopsis mangiferae")
        ]
        # Can add more crops here similarly...
    }

    # Normalize structure
    final_data = []
    
    # Process the detailed dicts
    for crop, diseases in DISEASES.items():
        for d in diseases:
            final_data.append({
                "crop": crop,
                "name": d["name"],
                "symptoms": d["symptoms"],
                "control": d["control"],
                "description": d["description"],
                "image_url": d.get("image_url", "https://via.placeholder.com/400x300?text=No+Image")
            })

    # Process the tuple lists (simplified)
    for crop, d_list in more_crops.items():
        for item in d_list:
            final_data.append({
                "crop": crop,
                "name": item[0],
                "symptoms": item[1],
                "control": item[2],
                "description": item[3],
                "image_url": "https://via.placeholder.com/400x300?text=" + item[0].replace(" ", "+")
            })

    # Write CSV
    os.makedirs('backend/data', exist_ok=True)
    with open('backend/data/diseases.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["crop", "name", "symptoms", "control", "description", "image_url"])
        writer.writeheader()
        writer.writerows(final_data)
        
    print(f"Generated diseases.csv with {len(final_data)} records.")

if __name__ == "__main__":
    generate_csv()
