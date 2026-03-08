import winkNLP from "wink-nlp"
import model from "wink-eng-lite-web-model"

const nlp = winkNLP(model)
const its = nlp.its

// ======================================
// CATEGORY TRAINING DATA
// (Large keyword pools for semantic scoring)
// ======================================

const CATEGORY_DATA: Record<string, string[]> = {

  gaming: [
    "gaming","gamer","rgb","gamepad","controller","console","playstation",
    "ps5","ps4","xbox","nintendo","steam","gaming keyboard","gaming mouse",
    "gaming headset","gaming chair","gaming desk"
  ],

  phone: [
    "phone","smartphone","iphone","android","mobile","cellphone",
    "phone case","screen protector","phone holder","mobile charger",
    "magnetic charger","iphone case","phone stand"
  ],

  computer: [
    "laptop","computer","pc","desktop","keyboard","mouse",
    "monitor","webcam","usb hub","ssd","hard drive",
    "graphics card","motherboard"
  ],

  audio: [
    "audio","earbuds","earphones","headphones","speaker",
    "bluetooth speaker","soundbar","microphone","mic",
    "studio headphones"
  ],

  camera: [
    "camera","dslr","mirrorless camera","tripod","photography",
    "camera lens","gopro","video camera"
  ],

  sports: [
    "sports","football","soccer","basketball","tennis",
    "volleyball","golf","baseball","badminton",
    "sports equipment","training gear"
  ],

  fitness: [
    "fitness","gym","workout","exercise","yoga",
    "resistance band","dumbbell","kettlebell",
    "training","cardio","pilates"
  ],

  "mens-fashion": [
    "men shirt","mens shirt","men jacket","mens hoodie",
    "mens jeans","mens coat","mens fashion","mens clothing",
    "men tshirt","men polo","mens shorts"
  ],

  "womens-fashion": [
    "women dress","ladies dress","women skirt",
    "women blouse","women fashion","ladies fashion",
    "lingerie","bra","heels"
  ],

  shoes: [
    "shoes","sneakers","boots","footwear",
    "running shoes","sports shoes","heels","sandals"
  ],

  bags: [
    "backpack","handbag","purse","wallet",
    "shoulder bag","crossbody bag","travel bag",
    "luggage","school bag"
  ],

  jewelry: [
    "necklace","bracelet","ring","earring",
    "pendant","jewelry","gold necklace","silver ring"
  ],

  watches: [
    "watch","smartwatch","digital watch",
    "sport watch","luxury watch"
  ],

  beauty: [
    "makeup","cosmetic","lipstick","foundation",
    "beauty brush","makeup brush","beauty blender"
  ],

  skincare: [
    "skincare","face cream","serum",
    "moisturizer","cleanser","facial treatment",
    "anti aging cream"
  ],

  kitchen: [
    "kitchen","cookware","knife","pan",
    "cutting board","utensil","cooking tool",
    "food container"
  ],

  furniture: [
    "furniture","chair","table","sofa",
    "desk","cabinet","bed frame"
  ],

  decor: [
    "home decor","wall decor","lamp",
    "led lamp","vase","home decoration"
  ],

  bedding: [
    "bed","pillow","bedsheet",
    "blanket","duvet","mattress"
  ],

  "home-garden": [
    "garden","plant pot","watering can",
    "garden tools","outdoor furniture",
    "patio decor"
  ],

  pets: [
    "dog","cat","pet toy","pet bed",
    "pet feeder","pet bowl","pet grooming"
  ],

  automotive: [
    "car accessory","car charger","dashboard",
    "car mount","vehicle accessory"
  ],

  toys: [
    "toy","lego","doll","kids toy",
    "rc car","remote control toy"
  ],

  baby: [
    "baby","infant","baby stroller",
    "baby bottle","baby toy","baby clothes"
  ]
}

// ======================================
// CLASSIFIER FUNCTION
// ======================================

export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {

  const text = `${title || ""} ${description || ""} ${cjCategory || ""}`.toLowerCase()

  const doc = nlp.readDoc(text)

  const tokens = doc.tokens().out(its.normal)

  let bestCategory = "general"
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_DATA)) {

    let score = 0

    for (const token of tokens) {

      if (keywords.includes(token)) score += 2
    }

    // boost if CJ category name matches
    if (cjCategory?.toLowerCase().includes(category.replace("-", " "))) {
      score += 5
    }

    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  return bestScore > 0 ? bestCategory : "general"
  }
