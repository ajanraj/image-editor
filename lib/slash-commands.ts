export type SlashField = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export type SlashCommand = {
  id: string;
  title: string;
  description?: string;
  fields: SlashField[];
  buildPrompt: (values: Record<string, string>) => string;
  presets?: { label: string; values: Record<string, string> }[];
  variants?: Record<string, Record<string, string[]>>; // e.g. gender -> { fieldName: options[] }
};

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "film",
    title: "Fujifilm Film Look",
    description: "Create or edit with Fujifilm simulations",
    fields: [
      { name: "subject", label: "Subject", placeholder: "person | landscape", required: true, options: ["person", "landscape"] },
      { name: "simulation", label: "Film Simulation", placeholder: "Classic Chrome (default)", options: ["Classic Chrome", "Classic Neg", "Provia", "Velvia", "Astia", "Eterna"] },
      { name: "camera", label: "Camera", placeholder: "Fujifilm X-T4 (default)", options: ["Fujifilm X-T4", "Fujifilm X-H2", "Fujifilm X-Pro3"] },
      { name: "lens", label: "Lens", placeholder: "56mm f/1.2 (person) / 23mm f/1.4 (landscape)", options: ["56mm f/1.2", "90mm f/2", "23mm f/1.4", "16mm f/1.4"] },
      { name: "grain", label: "Grain", placeholder: "fine (optional)", options: ["none", "fine", "medium", "strong"] },
    ],
    presets: [
      {
        label: "Portrait · Classic Chrome · 56mm",
        values: {
          subject: "person",
          simulation: "Classic Chrome",
          camera: "Fujifilm X-T4",
          lens: "56mm f/1.2",
          grain: "fine",
        },
      },
      {
        label: "Portrait · Classic Neg · 90mm",
        values: {
          subject: "person",
          simulation: "Classic Neg",
          camera: "Fujifilm X-T4",
          lens: "90mm f/2",
          grain: "fine",
        },
      },
      {
        label: "Landscape · Classic Chrome · 23mm",
        values: {
          subject: "landscape",
          simulation: "Classic Chrome",
          camera: "Fujifilm X-T4",
          lens: "23mm f/1.4",
          grain: "medium",
        },
      },
      {
        label: "Landscape · Eterna · 16mm",
        values: {
          subject: "landscape",
          simulation: "Eterna",
          camera: "Fujifilm X-T4",
          lens: "16mm f/1.4",
          grain: "none",
        },
      },
    ],
    buildPrompt: (v) => {
      const subject = (v.subject || "person").toLowerCase().includes("land")
        ? "landscape"
        : "person";
      const sim = (v.simulation?.trim() || "Classic Chrome").replace(/\s+/g, " ");
      const camera = v.camera?.trim() || "Fujifilm X-T4";
      const lens = v.lens?.trim() || (subject === "person" ? "56mm f/1.2" : "23mm f/1.4");
      const wantGrain = (v.grain || "").toLowerCase().includes("no") ? false : true;

      const simDescMap: Record<string, string> = {
        "classic chrome": "slightly muted tones, natural skin warmth, and rich greens/blues with cinematic contrast",
        "classic neg": "subdued colors, soft contrast, a vintage street-film palette",
        provia: "balanced contrast and neutral color rendition",
        velvia: "high saturation with crisp contrast and vibrant greens/blues",
        astia: "soft contrast and smooth skin tones",
        eterna: "cinematic low-saturation look with gentle highlights",
      };
      const key = sim.toLowerCase();
      const simDesc = simDescMap[key] || `${sim} film simulation look`;

      if (subject === "person" && key === "classic chrome") {
        return [
          `Edit this photo to look like it was shot on a ${camera} with a ${lens} lens.`,
          `Apply the Fujifilm Classic Chrome film simulation: slightly muted tones, natural skin warmth, and rich greens/blues with cinematic contrast.`,
          `Introduce strong subject isolation by simulating the creamy bokeh and background compression of the ${lens} lens.`,
          `Subject should stand out dramatically against a softly blurred backdrop, evoking a cinematic movie still with shallow depth of field.`,
          wantGrain ? `Add fine film grain for texture.` : "",
        ]
          .filter(Boolean)
          .join(" ");
      }

      if (subject === "landscape" && key === "classic chrome") {
        return [
          `Edit this photo to look like it was shot on a ${camera} with a ${lens} lens.`,
          `Apply the Fujifilm Classic Chrome film simulation: slightly muted colors, soft contrast, rich greens, deep blues, and warm highlights.`,
          `Add subtle film grain and cinematic tonal balance.`,
          `Emphasize high dynamic range so details in sky, land, and water are preserved, with a gentle roll-off in highlights and shadows.`,
          `The look should feel like a cinematic still frame, natural yet moody, with a timeless Fujifilm film aesthetic.`,
        ]
          .filter(Boolean)
          .join(" ");
      }

      // Generic builder for other sims
      if (subject === "person") {
        return [
          `Edit this photo to look like it was shot on a ${camera} with a ${lens} lens.`,
          `Apply the Fujifilm ${sim} film simulation: ${simDesc}.`,
          `Simulate shallow depth of field and pleasing background separation so the subject stands out.`,
          wantGrain ? `Add fine film grain for subtle texture.` : "",
        ]
          .filter(Boolean)
          .join(" ");
      }

      // Landscape generic
      return [
        `Edit this photo to look like it was shot on a ${camera} with a ${lens} lens.`,
        `Apply the Fujifilm ${sim} film simulation: ${simDesc}.`,
        `Emphasize natural color, balanced contrast, and preserved highlight/shadow detail across the scene.`,
        wantGrain ? `Add subtle film grain for a timeless look.` : "",
      ]
        .filter(Boolean)
        .join(" ");
    },
  },
  {
    id: "retouch",
    title: "Retouch",
    description: "Skin, eyes, teeth, flyaways — with texture preserved",
    fields: [
      { name: "style", label: "Style", options: ["subtle", "clean commercial", "natural film", "beauty editorial"] },
      { name: "skin", label: "Skin Smoothing", options: ["off", "soft", "medium", "high"] },
      { name: "texture", label: "Texture Preservation", options: ["high", "medium", "low"] },
      { name: "teeth", label: "Teeth Whitening", options: ["no", "yes"] },
      { name: "eyes", label: "Eye Enhance", options: ["no", "yes"] },
      { name: "flyaways", label: "Flyaway Hair", options: ["keep", "reduce", "remove"] },
      { name: "grade", label: "Color Grade", options: ["neutral", "warm", "cool"] },
    ],
    presets: [
      { label: "Subtle · Texture High · Neutral", values: { style: "subtle", skin: "soft", texture: "high", teeth: "no", eyes: "no", flyaways: "reduce", grade: "neutral" } },
      { label: "Clean Commercial · Soft · Warm", values: { style: "clean commercial", skin: "soft", texture: "medium", teeth: "yes", eyes: "yes", flyaways: "reduce", grade: "warm" } },
      { label: "Beauty Editorial · Medium · Cool", values: { style: "beauty editorial", skin: "medium", texture: "medium", teeth: "no", eyes: "yes", flyaways: "remove", grade: "cool" } },
    ],
    buildPrompt: (v) =>
      [
        v.style ? `Retouch in a ${v.style} style.` : `Retouch subtly.`,
        v.skin && v.skin !== "off" ? `Apply ${v.skin} skin smoothing while preserving pores.` : `Keep skin natural; avoid plastic look.`,
        v.texture ? `Texture preservation: ${v.texture}.` : "Preserve texture.",
        v.teeth === "yes" ? "Whiten teeth naturally." : "",
        v.eyes === "yes" ? "Brighten eyes slightly; remove red veins." : "",
        v.flyaways && v.flyaways !== "keep" ? `${v.flyaways === "remove" ? "Remove" : "Reduce"} flyaway hairs."` : "",
        v.grade ? `Overall color grade: ${v.grade}.` : "",
        "Avoid over-retouching; maintain realistic skin and features.",
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
  },
  {
    id: "makeup",
    title: "Makeup",
    description: "Add or adjust makeup by style and palette",
    fields: [
      { name: "gender", label: "Subject", options: ["women", "men"] },
      { name: "style", label: "Style", options: ["no-makeup look", "soft glam", "evening glam", "smokey eye", "editorial"] },
      { name: "lip", label: "Lip Color", options: ["nude", "soft pink", "classic red", "berry"] },
      { name: "shadow", label: "Eyeshadow", options: ["neutral", "bronze", "plum", "rose", "emerald"] },
      { name: "liner", label: "Eyeliner", options: ["none", "soft wing", "classic wing", "dramatic"] },
      { name: "blush", label: "Blush", options: ["peach", "rose", "bronze"] },
      { name: "finish", label: "Finish", options: ["matte", "dewy", "glossy"] },
    ],
    presets: [
      { label: "No‑Makeup · Nude · Neutral", values: { gender: "women", style: "no-makeup look", lip: "nude", shadow: "neutral", liner: "none", blush: "peach", finish: "dewy" } },
      { label: "Soft Glam · Rose · Wing", values: { gender: "women", style: "soft glam", lip: "soft pink", shadow: "rose", liner: "classic wing", blush: "rose", finish: "dewy" } },
      { label: "Classic Red · Bronze · Matte", values: { gender: "women", style: "evening glam", lip: "classic red", shadow: "bronze", liner: "soft wing", blush: "bronze", finish: "matte" } },
      { label: "Men · Groomed · Natural", values: { gender: "men", style: "no-makeup look", lip: "nude", shadow: "neutral", liner: "none", blush: "bronze", finish: "matte" } },
    ],
    buildPrompt: (v) =>
      [
        v.style ? `Apply ${v.style} makeup.` : "Apply subtle, natural makeup.",
        v.lip && `Lips: ${v.lip}.`,
        v.shadow && `Eyeshadow: ${v.shadow}.`,
        v.liner && `Eyeliner: ${v.liner}.`,
        v.blush && `Blush: ${v.blush}.`,
        v.finish && `Overall finish: ${v.finish}.`,
        "Blend realistically; respect lighting and skin tone.",
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
  },
  {
    id: "remove",
    title: "Object Removal",
    description: "Remove people/objects and fill background naturally",
    fields: [
      { name: "target", label: "Targets", options: ["people", "crowd", "random bystanders", "cars", "trash", "street signs", "wires"] },
      { name: "intensity", label: "Amount", options: ["light", "medium", "heavy"] },
      { name: "fill", label: "Background Fill", options: ["continue background", "natural bokeh", "sky", "foliage", "water"] },
      { name: "shadows", label: "Shadows", options: ["auto", "preserve", "remove"] },
    ],
    presets: [
      { label: "Remove Stray People (Light)", values: { target: "random bystanders", intensity: "light", fill: "continue background", shadows: "auto" } },
      { label: "Clean Street (Cars + Signs)", values: { target: "cars", intensity: "medium", fill: "continue background", shadows: "preserve" } },
      { label: "Uncrowd Beach (Heavy)", values: { target: "crowd", intensity: "heavy", fill: "natural bokeh", shadows: "auto" } },
    ],
    buildPrompt: (v) =>
      [
        `Remove ${v.target || "distractions"} from the scene`,
        v.intensity && `with ${v.intensity} aggressiveness`,
        v.fill && `and fill with ${v.fill}`,
        v.shadows && `; ${v.shadows === "preserve" ? "preserve" : v.shadows === "remove" ? "remove" : "match"} shadows and lighting naturally`,
        ". Seamlessly inpaint backgrounds; avoid artifacts and repetitions.",
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
  },
  {
    id: "weather",
    title: "Weather / Atmosphere",
    description: "Change time, weather, season and mood",
    fields: [
      { name: "condition", label: "Condition", options: ["clear", "golden hour", "overcast", "rain", "snow", "fog", "storm", "sunset", "sunrise"] },
      { name: "intensity", label: "Intensity", options: ["light", "normal", "heavy"] },
      { name: "time", label: "Time", options: ["day", "night", "blue hour"] },
      { name: "season", label: "Season", options: ["spring", "summer", "autumn", "winter"] },
      { name: "extras", label: "Extras", options: ["wet surfaces", "puddles & reflections", "raindrops on lens", "mist layers"] },
    ],
    presets: [
      { label: "Golden Hour Glow", values: { condition: "golden hour", intensity: "normal", time: "day", season: "summer", extras: "warm reflections" } },
      { label: "Moody Overcast", values: { condition: "overcast", intensity: "normal", time: "day", season: "autumn", extras: "mist layers" } },
      { label: "Misty Sunrise", values: { condition: "sunrise", intensity: "light", time: "blue hour", season: "spring", extras: "mist layers" } },
      { label: "Heavy Rain · Night Neon", values: { condition: "rain", intensity: "heavy", time: "night", season: "summer", extras: "puddles & reflections" } },
      { label: "Snowy Winter", values: { condition: "snow", intensity: "normal", time: "day", season: "winter", extras: "soft haze" } },
    ],
    buildPrompt: (v) =>
      [
        `Change weather to ${v.condition || "clear"}`,
        v.intensity && `with ${v.intensity} intensity`,
        v.time && `at ${v.time}`,
        v.season && `in ${v.season}`,
        v.extras && `; add ${v.extras}`,
        ". Adjust lighting, shadows and reflections to be physically plausible.",
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
  },
  {
    id: "hair",
    title: "Hair Edit",
    description: "Edit hairstyle, color and vibe",
    fields: [
      { name: "style", label: "Style", placeholder: "bob, curly, pixie", options: ["bob", "curly", "pixie", "wavy", "slicked back"] },
      { name: "color", label: "Color", placeholder: "platinum blonde, auburn", options: ["platinum blonde", "auburn", "jet black", "ash brown", "copper"] },
      { name: "vibe", label: "Vibe", placeholder: "natural, glossy, edgy", options: ["natural", "glossy", "edgy", "windswept"] },
    ],
    presets: [
      // Women presets
      { label: "Women · Wavy · Platinum · Glossy", values: { gender: "women", style: "wavy", color: "platinum blonde", vibe: "glossy" } },
      { label: "Women · Bob · Jet Black · Natural", values: { gender: "women", style: "bob", color: "jet black", vibe: "natural" } },
      { label: "Women · Curly · Auburn · Volume", values: { gender: "women", style: "curly", color: "auburn", vibe: "windswept" } },
      // Men presets
      { label: "Men · Fade · Jet Black · Matte", values: { gender: "men", style: "mid fade", color: "jet black", vibe: "matte" } },
      { label: "Men · Pompadour · Ash Brown · Clean", values: { gender: "men", style: "pompadour", color: "ash brown", vibe: "clean" } },
    ],
    variants: {
      women: {
        style: [
          "bob",
          "lob",
          "pixie",
          "wavy",
          "curly",
          "long layers",
          "shag",
          "wolf cut",
          "slicked back",
          "updo",
          "bangs",
        ],
        color: [
          "platinum blonde",
          "golden blonde",
          "strawberry blonde",
          "auburn",
          "copper",
          "chocolate brown",
          "ash brown",
          "jet black",
          "balayage",
          "highlights",
        ],
        vibe: ["natural", "glossy", "voluminous", "textured", "windswept"],
      },
      men: {
        style: [
          "buzz cut",
          "crew cut",
          "pompadour",
          "quiff",
          "undercut",
          "slick back",
          "mid fade",
          "high fade",
          "low fade",
          "curly top",
          "man bun",
          "long layers",
        ],
        color: [
          "natural black",
          "dark brown",
          "cool ash",
          "warm chestnut",
          "salt and pepper",
        ],
        vibe: ["clean", "matte", "textured", "messy", "windblown"],
      },
    },
    buildPrompt: (v) =>
      [
        "Edit the subject's hair",
        v.style && `to a ${v.style} style`,
        v.color && `with ${v.color} color`,
        v.vibe && `, ${v.vibe} finish`,
        ". Keep face structure and identity consistent. Natural hairlines, realistic strands, high detail.",
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
  },
  {
    id: "outfit",
    title: "Outfit Edit",
    description: "Change clothing style and colors",
    fields: [
      { name: "style", label: "Style", placeholder: "streetwear, formal suit", options: ["streetwear", "formal suit", "casual", "athleisure", "business casual", "club", "party", "swimwear", "evening gown", "cocktail dress", "festival", "beachwear"] },
      { name: "colors", label: "Colors", placeholder: "black & white", options: ["black & white", "earth tones", "pastel", "monochrome", "neon", "metallics", "bright primaries", "tropical palette"] },
      { name: "notes", label: "Notes", placeholder: "minimal logos, tailored fit", options: ["minimal logos", "tailored fit", "oversized", "layered", "sequins", "reflective", "sporty", "lightweight fabrics", "water-friendly"] },
    ],
    presets: [
      { label: "Formal · B&W · Tailored", values: { style: "formal suit", colors: "black & white", notes: "tailored fit" } },
      { label: "Streetwear · Earth · Oversized", values: { style: "streetwear", colors: "earth tones", notes: "oversized" } },
      { label: "Club · Neon · Sequins", values: { style: "club", colors: "neon", notes: "sequins" } },
      { label: "Party · Metallics · Tailored", values: { style: "party", colors: "metallics", notes: "tailored fit" } },
      { label: "Swim · Tropical · Lightweight", values: { style: "swimwear", colors: "tropical palette", notes: "lightweight fabrics, water-friendly" } },
      { label: "Festival · Bright · Layered", values: { style: "festival", colors: "bright primaries", notes: "layered" } },
    ],
    buildPrompt: (v) =>
      [
        "Edit the outfit",
        v.style && `to ${v.style}`,
        v.colors && `in ${v.colors}`,
        v.notes && `(${v.notes})`,
        ". Preserve pose and body proportions. Fabric folds and lighting should match the scene.",
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
  },
  {
    id: "background",
    title: "Background",
    description: "Replace background scene",
    fields: [
      { name: "scene", label: "Scene", placeholder: "sunset beach, studio gray", options: ["studio gray", "sunset beach", "urban night", "forest trail", "coffee shop"] },
      { name: "lighting", label: "Lighting", placeholder: "soft rim light, warm key", options: ["soft rim light", "warm key", "golden hour", "overcast softbox"] },
    ],
    presets: [
      { label: "Studio · Soft Rim", values: { scene: "studio gray", lighting: "soft rim light" } },
      { label: "Sunset · Golden Hour", values: { scene: "sunset beach", lighting: "golden hour" } },
    ],
    buildPrompt: (v) =>
      [
        "Replace background to",
        v.scene,
        v.lighting && `with ${v.lighting}`,
        ". Keep subject edges clean and natural shadows.",
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
  },
  {
    id: "style",
    title: "Style Grade",
    description: "Overall style and color grading",
    fields: [
      { name: "look", label: "Look", placeholder: "cinematic teal-orange, film noir", options: ["cinematic teal-orange", "film noir", "warm vintage", "high-contrast bw"] },
      { name: "extras", label: "Extras", placeholder: "grain, soft bloom", options: ["grain", "soft bloom", "halation"] },
    ],
    presets: [
      { label: "Cinematic + Grain", values: { look: "cinematic teal-orange", extras: "grain" } },
      { label: "Film Noir + Halation", values: { look: "film noir", extras: "halation" } },
    ],
    buildPrompt: (v) =>
      [
        "Apply overall style",
        v.look,
        v.extras && `with ${v.extras}`,
        ". Keep composition and key details consistent.",
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
  },
];

export function filterSlashCommands(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) => c.id.includes(s) || c.title.toLowerCase().includes(s),
  );
}
