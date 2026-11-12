import type { Service } from "./types";

/**
 * Service page content. Copy is limited to verified company facts (see company.ts)
 * and general, accurate information about the work itself. No prices, timelines,
 * warranties, credentials or response-time promises belong here.
 */
export const services: Service[] = [
  {
    slug: "boilers-heating",
    name: "Boilers & Heating",
    eyebrow: "Boilers & Heating",
    title: "Boilers and hydronic heating, sized to the house you actually live in",
    summary:
      "Boiler replacement, combi boilers and hydronic heating for Greater Boston homes and buildings, sized to the heat the building needs.",
    intro: [
      "A boiler is the center of a hydronic heating system, but only one part of it. The piping, circulators, zone valves, expansion tank, venting and controls decide how evenly a house heats and how hard the equipment has to work. We look at the whole system before recommending what goes into the boiler room.",
      "Many older Massachusetts homes run on boilers that were oversized when they went in, or sized for a house that has since been insulated, re-windowed or extended. Replacing like for like tends to repeat that mistake. An estimate of the building's heat loss, and a look at the existing radiators and piping, tell us what the house needs now.",
      "We install and replace gas-fired boilers, combination boilers that also supply domestic hot water, and the piping and controls around them. Most work of this kind requires a permit; we'll explain what applies to your job before anything is scheduled.",
    ],
    image: "boiler",
    projectTypes: [
      {
        title: "Boiler replacement",
        detail:
          "Removing an aging boiler and installing a correctly sized replacement, with updated near-boiler piping and controls.",
      },
      {
        title: "Combination boiler installation",
        detail:
          "One wall-hung unit for heat and on-demand hot water, where the household's hot-water use suits it.",
      },
      {
        title: "Boiler with indirect water heater",
        detail:
          "A separate storage tank heated by the boiler, for homes that draw a lot of hot water at once.",
      },
      {
        title: "Zoning and controls",
        detail:
          "Adding or reworking zones, circulators, zone valves and thermostats so rooms heat more evenly.",
      },
      {
        title: "Venting for high-efficiency equipment",
        detail:
          "Sidewall or direct-vent configurations for condensing boilers, planned around clearances and condensate drainage.",
      },
      {
        title: "Radiator and baseboard changes",
        detail:
          "Adding, relocating or replacing radiators and baseboard as part of a renovation or addition.",
      },
    ],
    considerations: [
      {
        title: "Size to the building, not the old boiler",
        body: "A boiler should match the building's heat loss. An oversized unit turns on and off frequently, which wastes fuel and wears components faster.",
      },
      {
        title: "Combi boiler or separate hot-water tank",
        body: "A combi boiler saves space and heats water on demand, but it can only deliver so much hot water at once. Homes with several bathrooms in use at the same time are often better served by a boiler with an indirect tank.",
      },
      {
        title: "Venting and condensate",
        body: "Condensing boilers usually vent through plastic pipe in a sidewall and produce acidic condensate that needs a drain. Where the vent can terminate, and where the condensate can go, shape the installation.",
      },
      {
        title: "Plan before the heating season",
        body: "A planned replacement leaves time to compare equipment and schedule the work on your terms. If an old boiler is showing signs of trouble, it is worth having the conversation before the first cold night.",
      },
    ],
    faqs: [
      {
        q: "Should my boiler be repaired or replaced?",
        a: "It depends on the boiler's age and condition, whether parts are still available, and how well it heats the house today. We'll look at the system and tell you plainly whether a repair is reasonable or whether replacement makes more sense.",
      },
      {
        q: "How long does a boiler replacement take?",
        a: "It depends on the equipment, the condition of the existing piping and whether the venting has to change. A direct swap is shorter than a job that adds new venting or zones. The heat is off while the old boiler is out, so we plan the sequence to keep that window as short as practical, and we'll give you an expected timeline after seeing the boiler room.",
      },
      {
        q: "Can I keep my existing radiators?",
        a: "Often, yes. Cast-iron radiators and baseboard can usually stay when the boiler is replaced, as long as the piping is sound. A modern boiler may need different water temperatures or near-boiler piping to work well with older radiators, and we'll explain any changes before making them.",
      },
      {
        q: "Why does my boiler turn on and off so often?",
        a: "Short cycling is commonly caused by an oversized boiler, a control setting or a zoning problem. It is worth diagnosing before replacing anything, because the cause decides the fix.",
      },
      {
        q: "Is a high-efficiency boiler worth it?",
        a: "Condensing boilers are most efficient when the system can run at lower water temperatures, which depends on the radiators and the house. In some homes the gain is substantial; in others it is smaller than the label suggests. We'll tell you which situation you're in.",
      },
    ],
    related: ["water-heaters", "residential-plumbing"],
    cta: "Request a boiler consultation",
    seo: {
      title: "Boilers & Heating in Greater Boston | Plumbers on Call CORP",
      description:
        "Boiler replacement, combi boilers and hydronic heating for Greater Boston homes, sized to the building. Call Plumbers on Call CORP at (781) 299-5011.",
    },
  },
  {
    slug: "water-heaters",
    name: "Water Heaters",
    eyebrow: "Water Heaters",
    title: "Water heaters chosen for the way your household uses hot water",
    summary:
      "Tank, tankless and indirect water heater installation and replacement in Greater Boston, matched to your demand, fuel and space.",
    intro: [
      "The right water heater depends less on the equipment than on the household: how many people live there, how many showers run at once, whether there is a large tub, and what fuel and venting the house already has. We start with those questions.",
      "Tank heaters store a fixed volume and recover over time. Tankless units heat water as it flows and don't run out, but they have a maximum flow rate and usually need a larger gas supply and new venting. Indirect tanks take their heat from a boiler. Each is a sound choice in the right house.",
      "We replace failing heaters, convert between types where it makes sense, and correct the details older installations often lack: expansion tanks, relief-valve discharge piping, proper venting and gas connections.",
    ],
    image: "waterHeater",
    projectTypes: [
      {
        title: "Tank water heater replacement",
        detail:
          "Like-for-like or resized replacement of gas or electric storage heaters, with the connections and safety components the installation requires.",
      },
      {
        title: "Tankless installation",
        detail:
          "Wall-mounted on-demand heaters, with the gas supply, venting and condensate drainage the unit needs.",
      },
      {
        title: "Indirect water heater",
        detail:
          "A storage tank heated by a new or existing boiler, piped and controlled as its own zone.",
      },
      {
        title: "Conversion between types",
        detail:
          "Moving from tank to tankless, or from a standalone heater to an indirect tank, when the house and usage support it.",
      },
      {
        title: "Relocation and safety updates",
        detail:
          "Moving a heater, or bringing an existing installation's expansion tank, relief-valve piping and venting up to current requirements.",
      },
    ],
    considerations: [
      {
        title: "Size for peak use",
        body: "Plan around the busiest moment, such as two showers and a dishwasher at once, not just the number of people. An undersized tank runs cold; an undersized tankless unit drops in temperature when demand exceeds its flow rating.",
      },
      {
        title: "Gas supply and venting",
        body: "Gas tankless heaters typically need a larger gas line than a tank, and every gas heater must vent correctly. The existing meter, pipe sizes and vent route often decide what is practical.",
      },
      {
        title: "Water quality and maintenance",
        body: "Mineral content varies by water source, and private wells differ from municipal supplies. Where scale builds up, periodic flushing, and descaling for tankless units, keeps the heater working as designed.",
      },
      {
        title: "Space and access",
        body: "A tankless unit frees floor space; a tank needs room for itself, its clearances and service access. A basement corner and a condo utility closet raise different questions.",
      },
    ],
    faqs: [
      {
        q: "How long does a water heater last?",
        a: "Many tank water heaters last roughly 8 to 12 years, depending on water quality, maintenance and how they were installed. Age alone isn't a reason to replace one, but rust at the base, leaking or loud rumbling are worth having looked at.",
      },
      {
        q: "Is a tankless water heater worth it?",
        a: "It can be, if you value continuous hot water and floor space and the house can supply the gas and venting it needs. Installation is usually more involved than a tank swap, and the unit needs periodic maintenance, so it isn't the right answer everywhere. We'll go through the trade-offs for your house specifically.",
      },
      {
        q: "My water heater is leaking. What should I do?",
        a: "Close the cold-water valve on the pipe feeding the heater, then turn the gas control to off or switch off the breaker for an electric unit. If water is spreading and you can't stop it, shut the main water valve. Then call (781) 299-5011; we're available 24/7.",
      },
      {
        q: "Why is my hot water running out sooner than it used to?",
        a: "In a tank heater, sediment build-up, a failing burner or element, or a broken dip tube can all reduce usable hot water. Sometimes household use has simply grown. We'll find out which before recommending a replacement.",
      },
      {
        q: "Does replacing a water heater need a permit?",
        a: "In Massachusetts, water heater replacement generally requires a permit, and gas connections must be made by a licensed professional. We'll explain what applies to your installation.",
      },
    ],
    related: ["boilers-heating", "residential-plumbing", "emergency-plumbing"],
    cta: "Plan a water heater replacement",
    seo: {
      title: "Water Heater Installation in Greater Boston | Plumbers on Call",
      description:
        "Tank, tankless and indirect water heaters installed and replaced across Greater Boston, sized to how you use hot water. Call (781) 299-5011, 24/7.",
    },
  },
  {
    slug: "bathroom-plumbing",
    name: "Bathroom Plumbing",
    eyebrow: "Bathroom Plumbing",
    title: "Bathroom plumbing for remodels, from rough-in to the final fixture",
    summary:
      "Plumbing for Greater Boston bathroom remodels: rough-in, fixture relocation, shower valves and freestanding tubs, coordinated with your contractor or designer.",
    intro: [
      "Most of the plumbing in a finished bathroom is never seen: drains pitched correctly, vents sized and routed, supply lines and valves set at the right height and depth. That work happens before the tile goes up, and it decides whether the room works for decades or has to be opened again.",
      "We handle the plumbing for bathroom remodels, working from a designer's drawings, alongside a general contractor's schedule, or directly with homeowners running their own renovation. We rough in before the walls close and return to set fixtures once the finishes are done.",
      "Moving a toilet, adding a second sink or replacing a tub with a curbless shower is possible in many homes, but each depends on the floor framing, the drain path and where the main stack runs. We'll tell you what is straightforward and what isn't before the design is final.",
    ],
    image: "bathroomModern",
    projectTypes: [
      {
        title: "Remodel rough-in",
        detail:
          "New drain, waste, vent and supply piping laid out to the finished design, ready for inspection.",
      },
      {
        title: "Fixture relocation",
        detail:
          "Moving toilets, vanities and showers, with drains re-routed and re-vented to suit the new layout.",
      },
      {
        title: "Shower valves and systems",
        detail:
          "Pressure-balancing and thermostatic valves, handheld and overhead showers, set to the finished wall thickness.",
      },
      {
        title: "Curbless and walk-in showers",
        detail:
          "Linear or point drains positioned with the tile installer so the floor falls to the drain.",
      },
      {
        title: "Freestanding tubs",
        detail:
          "Floor-mounted fillers and drains placed precisely under a tub with no wall to hide the plumbing.",
      },
      {
        title: "Fixture installation",
        detail:
          "Toilets, wall-hung fixtures and in-wall carriers, vanities and faucets set and connected after finishes.",
      },
    ],
    considerations: [
      {
        title: "Choose fixtures before rough-in",
        body: "Shower valves, tub fillers and wall-hung toilets each have their own rough-in dimensions. Selecting them before the walls are framed avoids opening finished work later.",
      },
      {
        title: "Framing decides the drain path",
        body: "Drains need continuous slope, and floor joists can't be cut freely. The direction of the framing often determines where a toilet or shower drain can go.",
      },
      {
        title: "Supply and hot water capacity",
        body: "Multiple shower heads or a large soaking tub can ask more than the existing supply lines or water heater can deliver. It is worth checking before fixtures are ordered.",
      },
      {
        title: "Inspection in the schedule",
        body: "Most remodel plumbing requires a permit, and rough plumbing is typically inspected before the walls close. Building that step into the schedule keeps the tile and drywall trades from waiting.",
      },
    ],
    faqs: [
      {
        q: "Do you work with my contractor or designer?",
        a: "Yes. We can work from drawings and fixture schedules, take part in site meetings, and sequence our rough-in and finish visits around the other trades.",
      },
      {
        q: "Can I choose my own fixtures?",
        a: "Many remodels use fixtures selected by the homeowner or designer. What matters is having the specification sheets before rough-in, so we can confirm dimensions and flag any fixture that needs a particular valve, carrier or supply size.",
      },
      {
        q: "Can I move the toilet to the other side of the room?",
        a: "Sometimes. It depends on the floor framing, the distance to the main stack and whether a vent can be run. We'll check from below or through an opening before you commit to the layout.",
      },
      {
        q: "How does the plumbing fit into the remodel timeline?",
        a: "Our work comes in two stages: rough-in before the walls close, and finish after tile and paint, with an inspection in between. How long each takes depends on the scope; we'll set a schedule that fits your contractor's.",
      },
      {
        q: "Is a freestanding tub harder to plumb?",
        a: "It takes more planning. The drain and filler come up through the floor in an exposed position, so they have to be placed exactly, and the space below has to allow the drain to be routed. We'll want the tub's specification sheet and the final layout before rough-in.",
      },
    ],
    related: ["residential-plumbing", "water-heaters"],
    cta: "Discuss your bathroom project",
    seo: {
      title: "Bathroom Remodel Plumbing in Greater Boston | Plumbers on Call",
      description:
        "Rough-in, fixture relocation, shower valves and freestanding tubs for bathroom remodels in Greater Boston, coordinated with your team. (781) 299-5011.",
    },
  },
  {
    slug: "residential-plumbing",
    name: "Residential Plumbing",
    eyebrow: "Residential Plumbing",
    title: "Residential plumbing, planned as one system rather than a list of repairs",
    summary:
      "Repiping, water and gas lines, and fixture installation for Greater Boston homes, approached as one connected system.",
    intro: [
      "A house's plumbing is several connected systems: the water service coming in, the supply piping that distributes it, the drains and vents that carry it away, and in many homes, gas piping to appliances. A problem in one often traces back to another.",
      "Our residential work centers on installations and larger projects: replacing aging supply piping, running lines for new appliances and additions, upgrading the main shut-off and water entry, and installing fixtures during renovations. We also handle the repairs that come up between projects.",
      "Many Greater Boston homes contain materials from several decades at once, such as galvanized steel, copper, cast-iron drains and newer PEX or PVC. Knowing what you have, and how each part is aging, makes it possible to plan work in a sensible order.",
    ],
    image: "residentialPipes",
    projectTypes: [
      {
        title: "Repiping",
        detail:
          "Replacing galvanized or deteriorating supply piping with copper or PEX, planned to limit wall openings.",
      },
      {
        title: "Gas piping for appliances",
        detail:
          "New or extended gas lines for ranges, dryers, fireplaces and outdoor grills, sized for the total load.",
      },
      {
        title: "Water entry and main shut-off",
        detail:
          "Replacing the main valve and the piping where the water service enters the house.",
      },
      {
        title: "Kitchen and laundry plumbing",
        detail:
          "Sinks, dishwashers, refrigerator lines, washer boxes and drains for kitchen and laundry renovations.",
      },
      {
        title: "Additions and finished basements",
        detail:
          "Extending supply, drain and vent systems to new bathrooms, kitchens and living space.",
      },
      {
        title: "Shut-off valves and pressure control",
        detail:
          "Replacing seized fixture and main shut-offs, and installing pressure-reducing valves where pressure runs high.",
      },
    ],
    considerations: [
      {
        title: "Pipe material",
        body: "Galvanized steel corrodes from the inside and restricts flow over time, and older copper can develop pinhole leaks. Copper and PEX each have trade-offs in cost, installation and how much wall needs to be opened.",
      },
      {
        title: "Timing with renovation",
        body: "Plumbing upgrades are least disruptive when walls are already open. If a renovation is planned, decide early whether to replace nearby piping at the same time.",
      },
      {
        title: "Gas lines and appliance load",
        body: "Gas piping must be sized for every appliance it serves, and gas work in Massachusetts is permitted and inspected. Adding an appliance can mean upsizing part of the existing line.",
      },
      {
        title: "Living in the house during the work",
        body: "Repiping an occupied home is done in stages so the water is off for limited periods. We plan the order of work around how you use the house.",
      },
    ],
    faqs: [
      {
        q: "Do I need to repipe the whole house?",
        a: "Not always. If the problems are concentrated in one area or one material, a partial replacement may be sensible. We'll look at what you have and lay out the options, including what waiting would mean.",
      },
      {
        q: "Copper or PEX?",
        a: "Both are used for water supply. Copper is durable and familiar; PEX is flexible, needs fewer fittings and is often easier to route through finished walls. The right choice depends on the house and the scope of work.",
      },
      {
        q: "Can you run a gas line for a new range or dryer?",
        a: "Yes, gas piping for appliances is part of our residential work. We'll check whether the existing line can carry the added load, and explain the permit and inspection involved.",
      },
      {
        q: "What causes low water pressure?",
        a: "Common causes include corroded galvanized piping, a partly closed or failing main valve, a faulty pressure-reducing valve, or a water service too small for the house. Low pressure at a single fixture usually points to something local, like a clogged aerator or cartridge.",
      },
      {
        q: "Do you also handle smaller repairs?",
        a: "Yes. Leaking valves, failing shut-offs and fixture problems are part of looking after a house. If a repair points to a larger issue, we'll tell you.",
      },
    ],
    related: ["bathroom-plumbing", "water-heaters", "boilers-heating"],
    cta: "Plan your plumbing project",
    seo: {
      title: "Residential Plumbing in Greater Boston | Plumbers on Call CORP",
      description:
        "Repiping, gas lines for appliances, water lines and fixture installation for Greater Boston homes, planned as one system. Call (781) 299-5011.",
    },
  },
  {
    slug: "commercial-plumbing",
    name: "Commercial Plumbing",
    eyebrow: "Commercial Plumbing",
    title: "Commercial plumbing, scheduled around the way your building operates",
    summary:
      "Plumbing installation, replacement and service for offices, retail, restaurants and managed properties in Greater Boston, with clear coordination and records.",
    intro: [
      "In a commercial building, the plumbing is only part of the job. The rest is access, timing, tenant notice, and making sure the people responsible for the property know what was done and why.",
      "We work with property managers, building owners, restaurant and retail operators and office tenants on installations, replacements and service. Where water has to be shut off or a space closed, we plan the work for the hours that disrupt the fewest people, including outside business hours when the building needs it.",
      "Each job is documented in plain terms: what we found, what we did, and what we recommend next. That record serves the manager, the owner and whoever works on the system after us.",
    ],
    image: "commercial",
    projectTypes: [
      {
        title: "Restroom fixture replacement",
        detail:
          "Toilets, urinals, lavatories, flush valves and sensor faucets in multi-user restrooms.",
      },
      {
        title: "Commercial water heating",
        detail:
          "Replacing or adding water heaters for restaurants, offices and multi-unit buildings, sized to peak demand.",
      },
      {
        title: "Restaurant and food-service plumbing",
        detail:
          "Sinks, floor drains, grease interceptors and equipment connections for commercial kitchens.",
      },
      {
        title: "Tenant fit-out",
        detail:
          "Rough-in and fixture work for new or reconfigured office, retail and restaurant spaces.",
      },
      {
        title: "Multi-unit building systems",
        detail:
          "Domestic water risers, shut-off valves and drain lines in apartment and condominium buildings.",
      },
      {
        title: "Backflow prevention",
        detail:
          "Installing and replacing backflow prevention devices where the water supply requires protection.",
      },
    ],
    considerations: [
      {
        title: "Operations come first",
        body: "Shutdowns, noise and access are agreed with the property contact in advance, so tenants and customers can be notified and the work happens when it affects the fewest people.",
      },
      {
        title: "One point of contact on each side",
        body: "Commercial jobs move faster when questions go to one person. We'll agree on who that is at the start, and keep that person informed through to close-out.",
      },
      {
        title: "Records for the building",
        body: "A written scope before work and a clear summary afterward help with budgeting, inspections and future work on the system. We provide both.",
      },
      {
        title: "Permits and building requirements",
        body: "Commercial plumbing and gas work generally requires permits, and many buildings have their own rules for access, insurance documentation and working hours. We'll sort out what applies before scheduling.",
      },
    ],
    faqs: [
      {
        q: "Can you work after hours?",
        a: "Yes. We're available 24/7, and planned work can be scheduled for evenings or weekends when daytime shutdowns aren't practical. We'll confirm timing with you in advance.",
      },
      {
        q: "Do you work with property management companies?",
        a: "Yes. We'll follow your process for approvals and building access, and keep both the manager and the owner informed as the work progresses.",
      },
      {
        q: "How are tenants handled during a shutdown?",
        a: "We give the property contact the shutdown window and the affected areas ahead of time so notices can go out, and we restore service as soon as the work allows.",
      },
      {
        q: "Do you handle restaurant plumbing?",
        a: "Yes. Sinks, floor drains, grease interceptors and equipment connections are part of our commercial work. We schedule around service hours so the kitchen can keep operating where possible.",
      },
      {
        q: "What should we do in a commercial plumbing emergency?",
        a: "Call (781) 299-5011 at any hour. If you can, shut off water to the affected area or the building, and tell us how to reach the on-site contact. We'll document what we find and what we did for your records.",
      },
    ],
    related: ["emergency-plumbing", "water-heaters"],
    cta: "Discuss a commercial project",
    seo: {
      title: "Commercial Plumbing in Greater Boston | Plumbers on Call CORP",
      description:
        "Commercial plumbing for offices, retail, restaurants and managed properties in Greater Boston, scheduled around operations. Call (781) 299-5011, 24/7.",
    },
  },
  {
    slug: "emergency-plumbing",
    name: "Emergency Plumbing",
    eyebrow: "Emergency Plumbing · 24/7",
    title: "In a plumbing emergency, a few steps first, then one call",
    summary:
      "24/7 emergency plumbing for Greater Boston homes and businesses. Shut off the water, leave if you smell gas, and call (781) 299-5011.",
    intro: [
      "If water is coming through a ceiling or a pipe has burst, stop the water first. The main shut-off is usually where the water line enters the building, often in the basement near the meter; turn it clockwise until it stops. If water is near outlets or fixtures, switch off power to that area only if you can reach the panel without standing in water.",
      "If you smell gas, don't look for the source and don't operate switches, appliances or anything that could spark. Leave the building, and from outside call your gas utility's emergency line or 911. Once it is safe, we can repair the piping or appliance connections involved.",
      "Then call us at (781) 299-5011. We're available 24/7 for residential and commercial emergencies across Greater Boston. Tell us what is happening and what you've already shut off, and we'll tell you what to do while we arrange to get to you.",
    ],
    image: "emergency",
    projectTypes: [
      {
        title: "Burst and leaking pipes",
        detail: "Split pipes, failed fittings and leaks inside walls and ceilings.",
      },
      {
        title: "Frozen pipes",
        detail:
          "Thawing and repairing lines in exterior walls, crawl spaces and unheated areas after a cold snap.",
      },
      {
        title: "Water heater failures",
        detail: "Leaking tanks, discharging relief valves and sudden loss of hot water.",
      },
      {
        title: "Loss of heat",
        detail: "Boiler shutdowns and heating failures, which become urgent quickly in cold weather.",
      },
      {
        title: "Sewer and drain backups",
        detail: "Backups into basements, floor drains and lower-level fixtures.",
      },
      {
        title: "Commercial emergencies",
        detail: "Leaks, backups and failures affecting tenants, customers or operations.",
      },
    ],
    considerations: [
      {
        title: "Know your shut-offs before you need them",
        body: "Find the main water valve, the cold-water valve above the water heater and the shut-offs under sinks and toilets. A valve that hasn't been turned in years may be stiff; if it won't move, don't force it until it breaks.",
      },
      {
        title: "If a pipe has frozen",
        body: "Open the faucet the pipe feeds and warm the area gradually with a hair dryer or a space heater kept at a safe distance. Never use an open flame. If you suspect the pipe has split, shut off the water before it thaws.",
      },
      {
        title: "If sewage is backing up",
        body: "Stop using sinks, toilets and appliances that drain into the system, since every gallon used upstairs adds to the backup below. Keep people and pets away from the affected water.",
      },
      {
        title: "Protect what you can",
        body: "Move belongings away from the water and take photos for your insurer. Stay out of standing water that may be in contact with electrical outlets or equipment.",
      },
    ],
    faqs: [
      {
        q: "How soon can you get here?",
        a: "It depends on where you are, the time of day, the weather and what else is happening across the area. We'll give you an honest estimate when you call, and tell you what to do in the meantime.",
      },
      {
        q: "Are you available at night and on weekends?",
        a: "Yes. Plumbers on Call is available 24/7 by phone, including nights, weekends and holidays.",
      },
      {
        q: "I smell gas. Should I call you first?",
        a: "No. Leave the building, then call your gas utility's emergency number or 911 from outside. The utility and emergency services handle a suspected leak first; once it is safe, we can repair or replace the affected piping or connections.",
      },
      {
        q: "What if I can't find or turn the main shut-off?",
        a: "Call us and describe what you see, and we'll help you work out where it is. If the valve is broken or inaccessible, many water utilities can shut off service at the street in an emergency.",
      },
      {
        q: "Is this an emergency, or can it wait until morning?",
        a: "Call now if water is leaking and can't be stopped at a valve, if there's no heat in freezing weather, if sewage is backing up, or if no toilet in the building works. A dripping faucet or a slow drain can usually wait for a scheduled visit.",
      },
    ],
    related: ["residential-plumbing", "commercial-plumbing", "water-heaters"],
    cta: "Call now — 24/7",
    seo: {
      title: "24/7 Emergency Plumber in Greater Boston | Plumbers on Call",
      description:
        "24/7 emergency plumbing in Greater Boston. Shut off the main water valve, leave if you smell gas, then call Plumbers on Call CORP at (781) 299-5011.",
    },
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
