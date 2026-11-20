# Interaction schema for the GH Ecosystem Simulator

**Version 0.1 — 4 October 2026.** Machine-readable twin: `interaction_schema.json` (same content).

> **Check before use.** Values tagged [NV] or [P], and every parameter shown as "—" / "needs calibration", must be checked against the original source or calibrated before use. Rules labelled *design inference* are proposals, not published findings.

This schema defines how the 12 required biotic interactions plug into the simulator's agents and fields. It draws only on the project research notes (`research_notes/Non trophic interactions and herd movement/`, `research_notes/Ecosystem networks and boids ABMs/`) and the earlier synthesis report. Each entry gives vocabulary terms, sign, participants, steering, encounter outcome, parameters, sources and open issues.

## Contents

1. [Conventions](#conventions)
2. [How the schema plugs into the simulator](#how-the-schema-plugs-into-the-simulator)
3. [Summary matrix](#summary-matrix)
4. [Interaction entries](#interaction-entries)
5. [Loading interaction data from GloBI](#loading-interaction-data-from-globi)
6. [References](#references)

## Conventions

- **Sign** (actor / target): Interaction sign is given as (effect on actor / effect on target). '+' = fitness or energy gain, '−' = loss, '0' = no measurable effect, '?' = context dependent. Signs are conventional ecological signs. Except where an RO definition states the sign (mutualism +/+, commensalism +/0, parasite 'benefits at the expense of' +/−), they are inferences recorded in the notes, not ontology content.
- **Actor** = The organism named as the subject of the GloBI/RO relation (e.g. the predator in preysOn, the emitter in allelopathOf, the egg-layer in laysEggsOn). **Target** = The object of the relation (prey, host, receiver, substrate organism).
- **Units:** length: m (cm or mm where the source uses them); time: s, min, h or d, as in the source; convert to simulation ticks with dt_steer and dt_eco; mass: kg (g or mg where the source uses them); rates: per unit time as stated (d⁻¹, s⁻¹, h⁻¹); dimensionless: Model coefficients from ODE papers (Valdovinos 2025; Kumawat et al. 2024; Masuda et al. 2015; Miele et al. 2019) are dimensionless or in model units and must be rescaled before use; null value: value = null (JSON) / '—' (Markdown) means no sourced value exists in the research notes: the parameter needs calibration.
- **Verification tags:**
  - **[V]** Verified in the research session from a primary source (ontology release file, source code, PubMed record, publisher page or primary PDF).
  - **[P]** Partly verified: from a secondary source quoting the primary, an abstract only, an automated summary of a PDF, or with some bibliographic fields unchecked.
  - **[NV]** Not verified: from the researchers' prior knowledge; check before use.
  - **[derived]** Computed in the research notes by arithmetic from a sourced value (e.g. a hazard from a detachment fraction, a decay constant from a half-life, the notes' own allometric fit). Not a published value.
  - **[design]** A design default proposed in the research notes or in this schema. It is not a published finding.
  - **[—]** No sourced value. Needs calibration.
- **Rule basis:** *published* = described in a cited study or model; *design inference* = proposal from the research notes or this schema.

## How the schema plugs into the simulator

### Architecture in one paragraph

Each species row holds the attributes below. An **outcome matrix** O[i][j] says what happens when an agent of species i meets species j (kill, partial transfer, drain, attachment, contest, occupancy, growth modifier). A **steering matrix** S[i][j] is *derived* from O and says how i moves relative to j. Per-agent **behavioural states** scale the rows of S each tick. Energy follows the Sibly et al. 2013 allocation priority (maintenance > growth > reproduction > storage). Producers are biomass pools or fields, and chemicals and scent marks are diffusing fields. This architecture is the design guidance of the earlier report ([Reynolds 1999](https://www.red3d.com/cwr/steer/gdc99/) vehicle model; [Angelani 2012](https://doi.org/10.1103/PhysRevLett.109.118104) sign structure; [Sibly et al. 2013](https://doi.org/10.1111/2041-210x.12002)).

### Species attributes the schema relies on

| Attribute | Type | Unit | Applies to | Description | Used by | Basis |
|---|---|---|---|---|---|---|
| `kind` | enum{animal, plant, tree, alga} | — | all | Organism kind. Plants, trees and algae are producers; animals are agents. | all entries (participant filters) | schema convention |
| `representation` | enum{agent, biomass_pool, field_cell, implicit_state} | — | all | Producers and very numerous small taxa are biomass pools/fields; focal animals are steering agents; endoparasites and pathogens are implicit host-state variables. | herbivory, allelopathy, parasitism, epibiosis | Report design guidance (hybrid ATN pools + agents; Harfoot et al. 2014 cohorts) |
| `body_mass` | float | kg | all | Adult or current body mass M. Drives allometric attack and handling rates, bite size, intake, gut retention time, metabolic rate, contest RHP seed. | predation, herbivory, dispersal, aggression, hematophagy | Rall et al. 2012; Shipley et al. 1994; Jones et al. 2017; Brown et al. 2004 |
| `body_length` | float | m | animal | Scales zonal radii (Couzin units are body lengths), surface area for epibionts, mobbing metric range (~14 BL). | epibiosis, aggression, steering | Couzin et al. 2002 via report; Ling et al. 2019 |
| `metabolic_type` | enum{endotherm, ectotherm_vertebrate, invertebrate} | — | animal | Selects allometric constants (ATN) and the Rall et al. 2012 regression group. | predation, herbivory, energy budget | Yodzis & Innes 1992; Rall et al. 2012 |
| `ecosystem_group` | enum{terrestrial, freshwater, marine} | — | animal | With metabolic_type selects the Rall et al. 2012 Table 1 attack/handling regression. | predation | Rall et al. 2012 |
| `medium` | set{air, land, water, surface} | — | all | Media the organism occupies; 'surface' = water surface (whirligigs, water striders, rafting birds). Gates which encounters are possible and which fields (soil vs water layer) an organism reads. | all entries | schema convention; herd_insect_movement.md movement classes |
| `search_dimensionality` | enum{2D, 3D} | — | animal | 2D = terrestrial/benthic, 3D = pelagic/aerial/arboreal consumer search space. Selects the consumption-rate mass exponent and the sensor shape (disc vs sphere). | predation, hematophagy, floral visitation | Pawar et al. 2012 |
| `movement_class` | enum (17 classes) | — | animal | Neighbour rule and state machine per taxon (grazer herd, migrating ungulate, primate troop, solitary mammal, bat stream, marching insect, procession insect, aggregating insect, trail ant, whirligig, water strider, mating swarm, guided bee swarm, waterbird in flight, waterbird on water, starling-like flock, fish school). | steering for all entries | herd_insect_movement.md Q11 (synthesis); report 'Give each species the neighbour rule its taxon actually uses' |
| `trophic_role` | set{producer, herbivore, carnivore, omnivore, parasite, parasitoid, micropredator, pollinator, disperser, ...} | — | all | Coarse role tags; the authoritative link set is the outcome matrix. | outcome-matrix construction | Harfoot et al. 2014 functional groups; Lafferty & Kuris 2002 |
| `consumer_strategy` | enum{solitary_predator, social_predator, micropredator, facultative_micropredator, typical_parasite, parasitoid, parasitic_castrator, pathogen, trophically_transmitted} | — | animal (per link) | Lafferty & Kuris 2002 class of a consumer link: victims per stage, lethality, host death required, intensity dependence. | predation, hematophagy, parasitism, herbivory | Lafferty & Kuris 2002 |
| `behavioural_state` | enum{forage, handling, satiated, alarmed, escape, refractory, rest, breeding/seekingNest, gravid, attending, mob, digest, questing, attached, parasitized} | — | animal | Per-agent state machine. Scales rows of the steering matrix. Markov transitions as in StarEscape. | all mobile entries | Papadopoulou et al. 2026; report layer 4 |
| `energy_reserve` | float | J (or mass-equivalent) | animal | Energy store. Allocation priority maintenance > growth > reproduction > storage; starvation mortality below a threshold. | all consumer entries | Sibly et al. 2013 |
| `reproductive_store` | float | J | animal | Energy allocated to reproduction; converted into eggs/offspring. | oviposition, nesting | Sibly et al. 2013 |
| `hunger` | float [0,1] | — | animal | Derived from energy_reserve; scales attraction to food. | predation, herbivory, hematophagy, floral visitation | Schmitz & Booth 1997 (adaptive foraging needed); report steering guidance |
| `perceived_risk` | float [0,1] | — | animal | Scales repulsion from predators and harassers. | predation, hematophagy | report steering guidance |
| `breeding_state` | enum{non-breeding, prospecting, building, laying, incubating, provisioning, fledged} | — | animal | Breeding finite-state machine; gates nest-seeking steering. | nesting, oviposition | nesting_oviposition.md Q3 (inference); Myhrvold et al. 2015 timers |
| `egg_load` | int | eggs | animal (gravid females) | Current mature egg load E and maximum E_max. Higher E = less choosy. | oviposition, parasitism (parasitoids) | Heimpel et al. 1996 |
| `cargo_slots` | list of {item_type, origin_id, origin_pos, t_pickup, exit_time or hazard, survival} | — | animal | Seeds (gut), burrs (fur zones), phoronts, attached ticks. Items ride with the agent and drop on timer or hazard. | dispersal, parasitism (ticks), epibiosis (phoresy) | aggression_dispersal.md Q10 B (inference); Jones et al. 2017 |
| `gut_retention_time` | float | min | animal (frugivores) | Mean GRT for the gamma exit-time distribution. | dispersal | Jones et al. 2017; Kleyheeg et al. 2019 |
| `surface_area` | float | m² | animal, tree | A_s ∝ L_host²; colonisation surface for epibionts / epiphytes. | epibiosis | epibiosis_allelopathy.md Q9 B (inference) |
| `epibiont_load` | list or cover φ ∈ [0,1] + mass M_e | — | animal, tree, alga | Attached epibionts per taxon; drives mass and drag penalty. | epibiosis | epibiosis_allelopathy.md Q9 B (inference) |
| `attached_to` | agent id or null | — | animal | Host id while riding (ticks, phoronts, epibionts on mobile hosts); position slaved to host. | parasitism, dispersal, epibiosis | Tardy et al. 2022; Bartlow & Agosta 2021 |
| `dominance` | float ≥ 0.01 | — | animal | DomWorld Dom value; can be seeded from body mass (RHP). | aggression | Hemelrijk 1999; Parker 1974 |
| `parasite_burden` | float / counts per parasite taxon | — | animal | Implicit endoparasite/ectoparasite load; intensity-dependent costs; infection status for vectors and pathogens. | parasitism, hematophagy, symbiosis (cleaning) | Lafferty & Kuris 2002; Kuris et al. 2008 |
| `habitat_slots` | list of {kind, size, capacity K, occupants, eggs, quality q, decayRate} | — | plant, tree, artificial structure, host nest | Substrate registry for nests, cavities, oviposition sites. | nesting, oviposition | nesting_oviposition.md Q6 A (inference) |
| `producer_biomass` | float per cell or per plant | kg or g m⁻² | plant, tree, alga | Biomass pool on a mesh/grid with growth (logistic or growback). | herbivory, allelopathy, floral visitation | Epstein & Axtell 1996; report layer 7 |
| `zoi_radius` | float | m | plant, tree | Zone-of-influence radius allometric with plant biomass; kernel width for allelochemical emission. | allelopathy | Weiner et al. 2001 |
| `floral_reward` | float per flower/plant | model units | plant, tree | Nectar standing crop R (refills at β − φR). | floral visitation | Valdovinos 2025 |
| `fruit_load` | int | fruits | plant, tree | Available fruits/seeds for frugivores and seed dispersers. | dispersal, herbivory | aggression_dispersal.md Q6 (removal = visitation × fruits per visit; no universal value) |
| `plant_height_zone` | float | m | plant | Height band used for epizoochorous attachment against animal body zones. | dispersal (epizoochory) | aggression_dispersal.md Q8 (inference) |
| `tree_traits` | {DBH, bark_roughness, wood_density, decay_class} | m, index, g cm⁻³, class | tree | Host suitability for epiphytes and excavators. | epibiosis (epiphytes), nesting | Sayago et al. 2013; Ibarra et al. 2020 |
| `allelochemical_traits` | {emission r_ik, sensitivity e_jk, hormesis f_jk, slope b_jk} | per chemical k | plant, tree, alga | Emitter and receiver dose–response parameters per chemical. | allelopathy | Brain & Cousens 1989; epibiosis_allelopathy.md Q9 A |

### Rule for deriving steering from outcomes

Keep the OUTCOME matrix (what happens at encounter) separate from the STEERING matrix (attraction/repulsion between species) and derive steering from outcomes.

- S[i][j] sign = sign of i's payoff in the outcome O[i][j] (actor sign for i as actor, target sign for i as target). If i gains (+) from meeting j, i is attracted to j; if i loses (−), i is repelled; if 0, no inter-specific steering term.
- Predation/consumption: S[consumer][resource] = +w_pursue × hunger × L_ij; S[resource][consumer] = −w_flee × risk (Angelani 2012 sign structure).
- Mutualism: both rows positive, gated by state (e.g. α_ij foraging effort for pollinators).
- Commensalism/epibiosis/nesting: actor row positive (state-gated), target row 0.
- Interference competitors and dominance-inferior agents: negative rows (repulsion), scaled by dominance difference.
- Sessile targets (plants, trees, algae, cavities) have no steering row; their effect on movers is through fields or substrate attraction.
- Field-mediated links (allelopathy, kairomones, odour plumes, scent marks) contribute gradient or speed-modulation terms, not pairwise S entries.
- Each non-zero S[i][j] carries a perception radius and a distance kernel (Ventrella 4-parameter profile or zonal radii); the diagonal is replaced by the species' own flocking rules.
- Behavioural state scales rows each tick: hunger scales attraction to food, risk scales repulsion from predators, breeding/gravid state switches on attraction to substrates. Adaptive-foraging weights (Kondoh 2003; Valdovinos et al. 2013) update attraction entries as resources change.

*Basis:* Design guidance of the earlier report ('Derive steering from interaction outcomes, not the other way round'), built on Angelani 2012, Ventrella Clusters, Shin & Cury 2001 and Schmitz & Booth 1997. The payoff-sign rule is a design inference. Sources: [Angelani 2012](https://doi.org/10.1103/PhysRevLett.109.118104); [Ventrella, Clusters](https://www.ventrella.com/Clusters/intro.html); [Couzin et al. 2002](https://jmvidal.cse.sc.edu/library/couzin02a.pdf); [Shin & Cury 2001](https://www.alr-journal.org/articles/alr/pdf/2001/02/alr1135.pdf); [Schmitz & Booth 1997](https://doi.org/10.1023/A:1018476606256); [Kondoh 2003](https://doi.org/10.1126/science.1079154); [Valdovinos et al. 2013](https://www.jstor.org/stable/41937740); [Reynolds 1999](https://www.red3d.com/cwr/steer/gdc99/).

### Multi-rate scheduling (design inference)

- Steering ticks (dt_steer) run at sub-second resolution; encounters, energy and demography run on coarser ecological ticks (dt_eco). This multi-rate schedule is a design inference of the earlier report, motivated by the scale mismatch between flocking (ms–s) and food-web dynamics (generations).
- Sourced steering step examples: ≤ 0.02 s for ants and whirligigs, ~1–2 s for mammal herds (herd_insect_movement.md synthesis; Couzin & Franks 2003 Δt = 0.02 s; Torney et al. 2018 2 s steps); 50 ms reaction / 20 ms when alarmed for starlings (Papadopoulou et al. 2026); 0.05 s for jackdaw mobbing (Ling et al. 2019).
- Sourced ecological step examples: 1 d in tick ABMs (Tardy et al. 2022); 3-day gonotrophic cycle for mosquitoes (Eckhoff 2011); daily spawning probability in inSALMO 7.
- Run each movement class with its own sub-step count inside one global ecological tick (design inference, herd_insect_movement.md Q11 implementation notes).

### Encounter-processing order per ecological tick (design inference)

1. Field update (ecological tick): diffuse/decay allelochemicals and scent marks, advect odour plumes, regrow producer biomass and floral rewards.  
2. Spatial index: rebuild the neighbour structure (RhinoCommon RTree or uniform grid hash) for all agents.  
3. Perception and state update: hunger, perceived risk, harassment H, gravidity, breeding stage, quorum counts; Markov state transitions.  
4. Steering (repeated per steering sub-step): intraspecific boids rules + state-scaled rows of the steering matrix + field-gradient terms; Reynolds 1999 integrator (truncate force, a = F/m, truncate speed, integrate).  
5. Encounter detection: list pairs (agent–agent, agent–cell, agent–substrate) inside each link's contact radius; shuffle the list to avoid order bias.  
6. Contest resolution first: aggression/kleptoparasitism contests at shared resources decide access (DomWorld outcome).  
7. Lethal trophic outcomes: predation kills, parasitoid emergence deaths; remove dead agents from further processing this tick.  
8. Non-lethal consumption: herbivory bites, hematophagy feeds, floral visits (nectar/pollen removal, pollination test), cleaning.  
9. Attachment and cargo: tick attachment, epibiont settlement, phoront pickup, seed ingestion/attachment; then cargo drops whose timer or hazard fired.  
10. Reproductive-substrate events: nest acceptance/occupancy, oviposition and brood-parasitic laying.  
11. Energy budget (ecological tick): allocate intake to maintenance > growth > reproduction > storage (Sibly et al. 2013); starvation mortality.  
12. Demography (ecological tick): advance timers (incubation, development, gut retention, parasitoid countdown), spawn recruitment pulses, background/senescence mortality.  
13. Network bookkeeping: log every realised encounter as a typed edge with a counter (GloBI label + RO IRI) to rebuild the emergent quantitative network.  

*Basis:* design inference (this schema). Steps 11–13 follow Sibly et al. 2013 and nesting_oviposition.md Q6 E; step 2 follows the report's Rhino 8 guidance.

### Global parameters

| Name | Symbol | Value | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Steering integrator | — | truncate(F, max_force); a = F/m; v = truncate(v + a, max_speed); x = x + v | — | all agents | [Reynolds 1999](https://www.red3d.com/cwr/steer/gdc99/) | P | Reynolds simple vehicle model |
| Steering time step, ants/whirligigs | dt_steer | ≤ 0.02 | s | trail ants, whirligig beetles | [Couzin & Franks 2003](https://doi.org/10.1098/rspb.2002.2210) | P | Couzin & Franks Δt = 0.02 s; synthesis in herd_insect_movement.md |
| Steering time step, mammal herds | dt_steer | 1–2 | s | ungulate herds | [Torney et al. 2018](https://doi.org/10.1098/rstb.2017.0385) | V | 2 s decision step in caribou model |
| Reaction interval, starlings (normal / alarmed) | τ_r | 0.05 / 0.02 | s | starling-like flocks | [Papadopoulou et al. 2026](https://doi.org/10.1038/s42003-026-10173-4) | V |  |
| Ecological time step, tick ABM | dt_eco | 1 | d | ticks and hosts | [Tardy et al. 2022](https://doi.org/10.1098/rsos.220245) | V |  |
| Ricker size-preference kernel optimum | R_opt | 100 | consumer/resource mass ratio | all consumers | [Schneider et al. 2016](https://doi.org/10.1038/ncomms12718); [Gauzens et al. 2023 (ATNr)](https://doi.org/10.1111/2041-210X.14212) | V | L_ij = [(M_i/M_j)/R_opt · exp(1 − (M_i/M_j)/R_opt)]^γ |
| Ricker kernel exponent | γ | 2 | — | all consumers | [Schneider et al. 2016](https://doi.org/10.1038/ncomms12718); [Gauzens et al. 2023 (ATNr)](https://doi.org/10.1111/2041-210X.14212) | V |  |
| Link pruning threshold | L_min | 0.01 | — | all consumers | [Gauzens et al. 2023 (ATNr)](https://doi.org/10.1111/2041-210X.14212) | V | Links with L_ij below threshold are removed |
| Allocation priority | — | maintenance > growth > reproduction > storage | — | all animals | [Sibly et al. 2013](https://doi.org/10.1111/2041-210x.12002) | V |  |
| Metabolic temperature dependence | E | 0.6–0.7 | eV | all | [Brown et al. 2004](https://doi.org/10.1890/03-9000) | NV | I = i₀ M^{3/4} e^{−E/kT} |

## Summary matrix

Signs are actor / target. Coverage is how well the research notes support an agent-level implementation: *strong* = agent models with numeric parameters exist; *partial* = parameters for some taxa or only model-unit values; *weak* = mostly qualitative.

| Interaction | GloBI term(s) | RO ID(s) | Sign | Steering actor | Steering target | Encounter outcome | Coverage |
|---|---|---|---|---|---|---|---|
| [Allelopathy](#allelopathy) | allelopathOf / hasAllelopath | RO_0002555 (sign not split) | 0/− (inhib.); 0/+ or +/+ (stim.) | none (sessile) | none (sessile) | growth-rate modifier (±) via field dose; mortality add-on; contact damage | partial |
| [Aggression](#aggression) | aggressorOf; kleptoparasiteOf | none for aggressorOf (NO_MATCH); RO_0008503 kleptoparasitism | −/− contest; +/− klepto | pursue burst (winner) / seek-to-mob | flee (loser) / move-on | contest: Dom update, displacement, item theft | strong |
| [Predation](#predation) | preysOn; kills | RO_0002439; RO_0002626 | +/− | pursue (tactic-based target) | flee/evade + selfish herd | kill; biomass transfer via functional response | strong |
| [Dispersal](#dispersal) | dispersalVectorOf | none (NO_MATCH); EOL records → RO_0002459 vectorOf | +/+ (endo, myrmeco); 0/+ (epizoo); +/0 (phoresy) | seek fruit; roost attractor (no extra term) | none (sessile); phoront attach/ride-along | cargo pickup → timer/hazard → drop; recruitment | strong |
| [Epibiosis](#epibiosis) | epiphyteOf; livesOn; symbiontOf | RO_0008501; none for livesOn; RO_0002440 | +/0 or +/− | none (attach) | none; v_max drag penalty | attachment; growth; detachment hazard; host mass/drag cost | partial |
| [Hematophagy](#hematophagy) | ectoparasiteOf; eats/hasHost; vectorOf | RO_0002632; RO_0002470; no hematophagy term | +/− | plume surge/cast → visual seek → land | bunch, centre-seek, upwind/relief seek | non-lethal drain (small); behavioural cost; pathogen transmission | strong |
| [Herbivory](#herbivory) | eats (plant target) | RO_0002470; no herbivory term | +/− | seek/arrive; slow in rich patches | none (sessile) | partial biomass transfer (bite allometry) | partial |
| [Symbiosis](#symbiosis) | mutualistOf; commensalistOf; symbiontOf | RO_0002442; RO_0002441; RO_0002440 | +/+ (mutualism); +/0 (commensalism) | seek partner (state-gated) | + seek (mutualism) / none (commensalism) | saturating/unimodal benefit; parasite removal; growth/recruitment facilitation | partial |
| [Nesting](#nesting) | hasHabitat; createsHabitatFor; hasRoost | RO_0002303; RO_0008505; RO_0008509; no nesting term | +/0 (or +/−) | seek substrate (quality × free capacity); quorum switch | none (sessile); occupant defends radius | substrate occupancy; breeding timers; recruitment pulse | partial |
| [Oviposition](#oviposition) | laysEggsOn; laysEggsIn | RO_0008507; RO_0002624 | +/0 (on); +/− (in, brood parasitism) | seek substrate (egg-load-gated cue field) | none (sessile) / host attends nest | egg cohort placed; recruitment pulse; host recruitment reduced (in) | partial |
| [Parasitism](#parasitism) | parasiteOf; parasitoidOf; ectoparasiteOf | RO_0002444; RO_0002208; RO_0002632 | +/− (parasitoid lethal) | chemotaxis on kairomone (parasitoid); questing/ride-along (tick) | avoid infected; group effects | non-lethal drain / lethal emergence / castration / vulnerability multiplier | strong |
| [Floral visitation](#floral-visitation) | visitsFlowersOf; pollinates | RO_0002622; RO_0002455 | +/+ (pollination); +/− (robbing) | seek flowers by adaptive effort α; MVT leaving | none (sessile) | reward removal; pollination with probability σ; seed set | partial |

## Interaction entries

<a id="allelopathy"></a>

### 1. Allelopathy (negative and positive)

**id:** `allelopathy`  
**Definition:** A producer (plant, tree, alga, phytoplankton) releases biochemicals that inhibit (negative) or stimulate (positive) the growth, survival or reproduction of other organisms nearby. In the simulator the chemical is a diffusing, decaying field, except for contact allelopathy.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `allelopathy_negative` | Inhibitory allelopathy (amensal or competitive) | Dose above the stimulation range reduces receiver growth and raises mortality. | 0/− or +/− | allelopathOf RO_0002555 with attribute sign = − |
| `allelopathy_positive` | Stimulatory allelopathy | Low doses (hormetic arm) or a +σ·N1·N2 term raise receiver growth. Keep distinct from resource-mediated facilitation (see symbiosis/commensalism). | 0/+ or +/+ | allelopathOf RO_0002555 with attribute sign = + |
| `allelopathy_contact` | Contact allelopathy (seaweed → coral) | Damage only where the emitter's footprint touches the receiver; no diffusing field. | +/− | allelopathOf RO_0002555, attribute mode = contact |
| `allelopathy_autotoxicity` | Autotoxicity | Emitter is also sensitive to its own chemical (self-limitation of monospecific patches). | −/− (self) | allelopathOf with actor = target species |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `allelopathOf` | `hasAllelopath` | RO_0002555 | RO_0020301 | [V] | all allelopathy variants | — |

**Mangal type:** amensalism (for one-sided inhibition); otherwise unspecified. Mapping is an inference.  
**Ambiguity notes:**
- RO_0002555 covers both signs: its comment says chemicals 'positively or negatively influence growth, survival or reproduction'. RO has no separate positive and negative relations, so sign must be an edge attribute.
- Direction: the RO def ('one organism is influenced by the biochemicals produced by another') reads inverse to the seeAlso gloss ('x is an allelopath of y if x produces ... biochemicals that influence y'). Use the gloss: actor = emitter.
- seeAlso EOL term http://eol.org/schema/terms/allelopathyYes.
- No RO relation for facilitation or amensalism exists (text search found none).

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java).

#### Sign and consumer strategy

- **Actor:** 0 or + — **Target:** − (inhibitory) / + (stimulatory)
- **Lafferty & Kuris 2002 class:** not applicable
- **Kéfi et al. 2012 functional class:** growth/recruitment modifier (sign ±); mortality modifier at high dose
- Actor sign is 0 when the emitter gains nothing measurable; + when inhibition frees resources (Roy 2009 'pseudo-mixotrophy'). Signs are inferences in the notes.

#### Participants

- **Actors:** plant, tree, alga
- **Targets:** plant, tree, alga, animal (sessile, e.g. coral; grazers via toxin ingestion)
- **Media:** land (soil field layer), water (water field layer)
- Terrestrial emitters write to a soil layer; aquatic emitters to a water layer. Phytoplankton act as aggregate cells, not agents.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | none (sessile) | — | — | — | — |
| target | none for sessile receivers. Optional design inference: mobile grazers could avoid toxic cells via a negative field term, not sourced. | — | chemical field | — | — |

**Steering-matrix derivation:** No pairwise S entry. Effect is field-mediated: O[emitter][receiver] is a dose–response on the receiver's growth and mortality. Steering of animals is unaffected unless a grazer-avoidance term is added (design inference).

**Steering rules**

- *(design inference)* Herbivore agents that graze seaweed reduce its footprint and therefore its contact with corals (indirect protection; trophic–non-trophic coupling). — [Rasher & Hay 2010](https://doi.org/10.1073/pnas.0912095107)

#### Encounter effect

**Contact condition:** Field mode: receiver reads C_k at its position each ecological tick. Contact mode: footprint overlap between emitter and receiver cells.

**Outcome rules**

- *(design inference)* Field update per chemical k: C ← C + Δt·(D·∇²C − λ·C + Σ_emitters r·B·K(x − x_i) − u·Σ_receivers B·C). λ = ln2/t½. K = Gaussian kernel with σ ≈ ZOI radius. Optional chain parent → persistent product. — [Macias et al. 2005](https://doi.org/10.1021/jf048702l); [Weiner et al. 2001](https://doi.org/10.1086/321988); [Sinkkonen 2005](https://doi.org/10.2201/nonlin.003.02.004)
- *(published)* Dose–response with hormesis (Brain–Cousens): f(x) = c + (d − c + f·x)/(1 + exp(b·(log x − log e))). f > 0 gives low-dose stimulation; with f > 0, e is no longer the ED50. — [Brain & Cousens 1989](https://doseresponse.github.io/drc/reference/braincousens.html)
- *(design inference)* Normalised growth multiplier R(C) = (1 + f·C_eff)/(1 + (C_eff/e)^b), with c = 0, d = 1. Positive-only: large e. Negative-only: f = 0. — [Brain & Cousens 1989](https://doseresponse.github.io/drc/reference/braincousens.html); [Cedergreen et al. 2007](https://doi.org/10.2203/dose-response.06-008.Cedergreen); [Belz 2008](https://doi.org/10.2203/dose-response.07-007.Belz)
- *(design inference)* Density-dependent dilution: C_eff = C/(1 + κ·local receiver biomass). Dense stands are protected and germination can rise at high density. — [Sinkkonen 2005](https://doi.org/10.2201/nonlin.003.02.004)
- *(published)* Spatial mortality rule: receiver death rate 1 + γ·f1, with f1 the local fraction of inhibitor neighbours (Durrett–Levin type). — [Lanchier & Mercer 2023](https://arxiv.org/pdf/2305.17016)
- *(design inference)* Mortality add-on: hazard = h0·(1 + γ·max(0, 1 − R)), so only the inhibitory range raises mortality. — [Lanchier & Mercer 2023](https://arxiv.org/pdf/2305.17016)
- *(design inference)* Apply R to an exponentially weighted exposure (time constant ~days) to reproduce over-compensation and avoid per-tick flicker. — [Belz 2008](https://doi.org/10.2203/dose-response.07-007.Belz)
- *(published)* Contact allelopathy: seaweeds bleach and kill coral tissue only where they touch; 40–70% of common seaweed species have this effect when protected from herbivores. — [Rasher & Hay 2010](https://doi.org/10.1073/pnas.0912095107)
- *(published)* Aggregate phytoplankton cells: Lotka–Volterra competition with a toxin term proportional to N1·N2; stimulatory form dq/dt = [k2 − c2·q − γ21·p + σ·p·q]·q. — [Chattopadhyay 1996](https://doi.org/10.1016/0304-3800(94)00134-0); [Kumawat et al. 2024](https://doi.org/10.1038/s41598-024-70596-z)
- *(published)* Allelopathy can allow stable coexistence on one resource if the toxin effect exceeds a threshold; stimulatory allelopathy with delay gives limit cycles. — [Roy 2009](https://doi.org/10.1016/j.tpb.2008.11.003); [Mukhopadhyay et al. 1998](https://doi.org/10.1016/s0025-5564(98)00005-4)
- *(design inference)* Autotoxicity: self-term e_ii (more sensitive than e_ij) caps monospecific patches. — [Kengwoung-Keumo 2016](https://doi.org/10.3934/mbe.2016018)

**Costs:** actor — Emission cost: needs calibration (no sourced value). Target — Growth reduction or stimulation; added mortality at high dose.  
**State changes:** Receiver growth multiplier R updated each ecological tick; Coral cells under seaweed footprint: bleached / tissue lost (contact mode).  
**Link to population dynamics:** Kéfi et al. 2012 growth/recruitment modifier: R multiplies producer growth rate r_i in the ATN/biomass-pool producer equation; the mortality add-on is a mortality modifier. In Miele et al. 2019 the comparable non-trophic terms are recruitment facilitation (e0) and increased mortality (n0).

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Hormesis parameter (Brain–Cousens) | f | — | — | all receivers | [Brain & Cousens 1989](https://doseresponse.github.io/drc/reference/braincousens.html) | [P] | Functional form sourced; per-pair values need calibration. Worked notes: b = 2, f = 0.8 → peak ≈ 1.14; f = 1.5 → peak ≈ 1.40 (notes' arithmetic). |
| Dose–response slope | b | — | — | all receivers | [Brain & Cousens 1989](https://doseresponse.github.io/drc/reference/braincousens.html) | [P] | needs calibration |
| Inflection dose | e | — | dose units | all receivers | [Brain & Cousens 1989](https://doseresponse.github.io/drc/reference/braincousens.html) | [P] | needs calibration; lower e for naive receivers in a novel-weapons scenario |
| Peak stimulation of relative growth rate | R_peak (RGR) | 1.09–1.16 | × control | Lemna minor, Pseudokirchneriella, Tripleurospermum, Stellaria (herbicides) | [Cedergreen et al. 2007](https://doi.org/10.2203/dose-response.06-008.Cedergreen) | [V] | Mean fitted RGR increase 9 ± 1% to 16 ± 16% |
| Peak stimulation of dry weight | R_peak (DW) | 1.38–1.43 | × control | two terrestrial species | [Cedergreen et al. 2007](https://doi.org/10.2203/dose-response.06-008.Cedergreen) | [V] | 38 ± 13% and 43 ± 23% |
| Share of curves with hormesis (>105% of control) | — | 25–76 | % | plants and algae | [Cedergreen et al. 2007](https://doi.org/10.2203/dose-response.06-008.Cedergreen) | [V] | per species |
| Peak leaf-area stimulation (parthenin) | R_peak | 1.38 | × control | Sinapis arvensis | [Belz 2008](https://doi.org/10.2203/dose-response.07-007.Belz) | [V] | At 13 days after treatment, only under less stressful conditions |
| ED50 (parthenin) | ED50 | 0.62 ± 0.12 | kg/ha | Sinapis arvensis | [Belz 2008](https://doi.org/10.2203/dose-response.07-007.Belz) | [V] | — |
| ED90 (parthenin) | ED90 | 1.81 ± 0.56 | kg/ha | Sinapis arvensis | [Belz 2008](https://doi.org/10.2203/dose-response.07-007.Belz) | [V] | — |
| Upper stimulatory dose (parthenin) | — | < 0.42 ± 0.04 | kg/ha | Sinapis arvensis | [Belz 2008](https://doi.org/10.2203/dose-response.07-007.Belz) | [V] | — |
| Half-life DIBOA → BOA | t½ | 43 | h | wheat-crop soils | [Macias et al. 2005](https://doi.org/10.1021/jf048702l) | [V] | — |
| Half-life BOA → APO | t½ | 2.5 | d | wheat-crop soils | [Macias et al. 2005](https://doi.org/10.1021/jf048702l) | [V] | — |
| Persistence of APO | t½ | > 90 | d | wheat-crop soils | [Macias et al. 2005](https://doi.org/10.1021/jf048702l) | [V] | Not degraded after 3 months |
| Decay constant, fast product | λ | 0.39 | d⁻¹ | DIBOA-like | [Macias et al. 2005](https://doi.org/10.1021/jf048702l) | [derived] | λ = ln2/t½ computed in notes |
| Decay constant, intermediate product | λ | 0.28 | d⁻¹ | BOA-like | [Macias et al. 2005](https://doi.org/10.1021/jf048702l) | [derived] | — |
| Decay constant, legacy product | λ | < 0.008 | d⁻¹ | APO-like | [Macias et al. 2005](https://doi.org/10.1021/jf048702l) | [derived] | — |
| Share of seaweed species harmful on contact | p_trait | 0.40–0.70 | fraction of species | Caribbean and tropical Pacific seaweeds → corals | [Rasher & Hay 2010](https://doi.org/10.1073/pnas.0912095107) | [V] | — |
| Contact damage probability per tick | p_contact | — | tick⁻¹ | seaweed → coral | — | — | needs calibration |
| Allelochemical diffusion coefficient | D_k | — | m² d⁻¹ | all | — | — | needs calibration; no sourced values for soil or seawater |
| Emission rate per unit biomass | r_ik | — | dose g⁻¹ d⁻¹ | all | — | — | needs calibration; catechin secretion flux is disputed (Bais & Kaushik 2010) |
| Characteristic radius of field | L_k = √(D_k/λ_k) | 1–2 × emitter ZOI radius | m | all emitters | [Carvalho et al. 2023](https://doi.org/10.3390/life13020512) | [design] | Design default in notes. Carvalho et al. 2023: diversity peaks at intermediate diffusion, collapses at high diffusion. |
| Dilution coefficient | κ | — | per unit receiver biomass | all | — | — | needs calibration; form from Sinkkonen 2005 |
| Allelopathic mortality strength | γ | — | — | all | — | — | needs calibration; Durrett–Levin form; Lanchier & Mercer give qualitative regimes only |
| Explicit-scheme stability limit | D·Δt/Δx² | ≤ 0.25 | — | 2D grid | — | [design] | Numerical stability constraint for an explicit diffusion scheme, stated in epibiosis_allelopathy.md Q9; not from an ecological source |
| Illustrative stimulatory phytoplankton model | k1, k2, c1, c2, γ12, γ21, σ, p0, q0 | 2, 1, 0.07, 0.08, 0.05, 0.015, 0.003, 5, 20 | dimensionless | phytoplankton test case | [Kumawat et al. 2024](https://doi.org/10.1038/s41598-024-70596-z) | [V] | Stable test case only, not field rates |
| Recruitment facilitation intensity (non-trophic layer) | e0 | 0.15–1.8 | model units | plants in bioenergetic model | [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269) | [P] | Multiplies plant growth |
| Increased mortality intensity (non-trophic layer) | n0 | 0.75–3.0 | model units | bioenergetic model | [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269) | [P] | — |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [Brain & Cousens 1989](https://doseresponse.github.io/drc/reference/braincousens.html); [Cedergreen et al. 2007](https://doi.org/10.2203/dose-response.06-008.Cedergreen); [Belz 2008](https://doi.org/10.2203/dose-response.07-007.Belz); [Belz et al. 2005](https://doi.org/10.2201/nonlin.003.02.002); [Macias et al. 2005](https://doi.org/10.1021/jf048702l); [Sinkkonen 2005](https://doi.org/10.2201/nonlin.003.02.004); [Lanchier & Mercer 2023](https://arxiv.org/pdf/2305.17016); [Carvalho et al. 2023](https://doi.org/10.3390/life13020512); [Kerr et al. 2002](https://doi.org/10.1038/nature00823); [Rasher & Hay 2010](https://doi.org/10.1073/pnas.0912095107); [Chattopadhyay 1996](https://doi.org/10.1016/0304-3800(94)00134-0); [Kumawat et al. 2024](https://doi.org/10.1038/s41598-024-70596-z); [Mukhopadhyay et al. 1998](https://doi.org/10.1016/s0025-5564(98)00005-4); [Roy et al. 2006](https://doi.org/10.1007/s11538-006-9109-5); [Roy 2009](https://doi.org/10.1016/j.tpb.2008.11.003); [Kengwoung-Keumo 2016](https://doi.org/10.3934/mbe.2016018); [Callaway & Aschehoug 2000](https://doi.org/10.1126/science.290.5491.521); [Colautti & Antunes 2025](https://doi.org/10.1111/nph.70415); [Weiner et al. 2001](https://doi.org/10.1086/321988); [Wang et al. 2013](https://doi.org/10.1371/journal.pone.0085162); [Bais et al. 2010](https://doi.org/10.4161/psb.5.3.10573); [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269); [Kefi et al. 2012](https://doi.org/10.1111/j.1461-0248.2011.01732.x)

#### Open issues / needs calibration

- No sourced diffusion coefficients, emission rates or allelopathic radii in metres. L_k is the main tuning knob.
- No IC50/EC50 values for natural allelochemicals on wild receivers beyond parthenin (field spray, kg/ha) and herbicide data.
- Novel-weapons hypothesis (Callaway & Aschehoug 2000) has weak empirical support per Colautti & Antunes 2025; present only as a scenario.
- Catechin evidence conflicts (Bais et al. 2010 failed to reproduce low-dose stimulation); microbes can convert catechin into a more phytotoxic product (Wang et al. 2013).
- Hormesis is time-dependent (Belz 2008): stimulating doses were initially inhibitory. The smoothing time constant needs calibration.

---

<a id="aggression"></a>

### 2. Aggression (agonistic interactions)

**id:** `aggression`  
**Definition:** Contests between animals over rank, space or resources, decided by relative resource-holding potential. The winner pursues briefly and the loser flees or is displaced. Includes intra- and interspecific contests.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `aggression_dominance` | Dominance contest (DomWorld) | Self-reinforcing win/loss updates of a Dom value on meeting inside personal space. | −/− contest; +/− after outcome | aggressorOf (NO_MATCH) |
| `aggression_interference` | Interference competition at food patches | Attacks among foragers within attack distance D_A lower intake. | −/− | aggressorOf; no competition term in RO/GloBI; Mangal 'competition' |
| `aggression_kleptoparasitism` | Kleptoparasitism | A searcher challenges a handler and steals its food item. | +/− | kleptoparasiteOf RO_0008503 / hasKleptoparasite RO_0008504 |
| `aggression_mobbing` | Mobbing | Prey (often several species) approach and harass a predator, which may move on. | −/− (cost to mobbers; predator displaced) | aggressorOf (actor = mobber, target = predator); no specific term |
| `aggression_territoriality` | Territorial exclusion via scent marks | Agents retreat from foreign active scent; territories emerge. | −/− | aggressorOf; no specific term |
| `aggression_interspecific` | Interspecific aggression | Aggression between species with similar signals and overlapping resources; associated with breeding-season resource overlap and hybridization in birds. | −/− | aggressorOf |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `aggressorOf` | `hasAggressor` | none (NO_MATCH) | — | [V] | all aggression variants | GloBI label exists; RO IRI = NO_MATCH |
| `kleptoparasiteOf` | `hasKleptoparasite` | RO_0008503 | RO_0008504 | [V] | kleptoparasitism | — |
| `kills` | `killedBy` | RO_0002626 | RO_0002627 | [V] | lethal fights or infanticide (optional) | No textual RO definition |
| `interactsWith` | `interactsWith` | RO_0002437 | RO_0002437 | [V] | generic fallback / ro_broader for aggression | — |

**Mangal type:** competition (interference and territorial variants)  
**Ambiguity notes:**
- No RO term exists for aggression, competition or agonistic interaction; a search of RO names and definitions for 'aggress' and 'compet' found nothing. Store ro_iri = null and ro_broader = RO_0002437.
- GloBI has no competition type; Mangal does.
- Kleptoparasitism is RO-typed under parasitism (RO_0008503) but behaves as a contest at a resource; it is kept here as a variant of aggression.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R).

#### Sign and consumer strategy

- **Actor:** − (contest cost); + for winner / kleptoparasite — **Target:** −
- **Lafferty & Kuris 2002 class:** not applicable
- **Kéfi et al. 2012 functional class:** feeding-rate modifier (interference); predator interference in Beddington–DeAngelis
- Sign pair −/− for contests and competition, +/− for kleptoparasitism (inference in notes).

#### Participants

- **Actors:** animal
- **Targets:** animal
- **Media:** air, land, water, surface
- Mobbing documented mainly in birds (74.2% of 337 papers), mammals 18.8%, fish 4.5%.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | Winner: short pursue burst, then random ±45° turn. Mobber: harmonic seek toward predator with metric alignment and a hard minimum distance. | forage / handling (contests at resources); mob (after alarm call) | vision (metric radius with field of view); acoustic alarm call for mobbing recruitment | PersSpace (encounter), NearView, MaxView; R_call | w_pursue (short), k (harmonic pull) |
| target | Loser: flee (turn 180°, move ~2 units at boosted max force). Optional repulsion from Dom-superior neighbours within NearView scaled by Dom difference. Mobbed predator: flee / move-on when mobbers exceed a threshold. | any; refractory after loss | vision | NearView | w_flee (impulse) |

**Steering-matrix derivation:** Contest outcome gives −/− expected payoff, so S entries between contest partners are negative (repulsion) and scaled by Dom difference: dominants hold position, subordinates avoid. Kleptoparasite → handler is positive (attraction) when the challenge rule holds. Mobber → predator is positive only in 'mob' state; predator → mobbers negative above a mobber count.

**Steering rules**

- *(published)* DomWorld radii map onto boids: PersSpace = separation radius and encounter trigger; NearView = cohesion radius; MaxView = search radius. Winner chases ~1 unit then turns 45°; loser turns 180° and moves ~2 units. — [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646); [Dolado et al. 2014](https://doi.org/10.18564/jasss.2356)
- *(published)* Jackdaws switch from topological alignment with 7–8 neighbours (transit) to metric interactions with a range of ~5 m (~14 body lengths) when mobbing; harmonic attraction to the predator. — [Ling et al. 2019](https://doi.org/10.1038/s41467-019-13281-4)
- *(published)* Territory formation: agents scent-mark visited sites and retreat in a random direction on meeting foreign active scent; a den attractor stabilises home ranges. — [Giuggioli et al. 2011](https://doi.org/10.1371/journal.pcbi.1002008); [Potts & Lewis 2014](https://doi.org/10.1098/rspb.2014.0231)
- *(design inference)* Scent field stores (ownerID, timestamp); cells with now − stamp < T_AS act as soft walls (containment steering). T_AS ≈ 0.5–2× boundary-return time. — [Giuggioli et al. 2011](https://doi.org/10.1371/journal.pcbi.1002008)
- *(design inference)* Predator move-on force grows with the number of mobbers in range (functional form is an assumption). — [Carlson & Griesser (preprint)](https://ecoevorxiv.org/repository/object/3921/download/7743/)

#### Encounter effect

**Contact condition:** Agent j inside i's PersSpace (and optionally both near the same resource).

**Outcome rules**

- *(published)* Win if Dom_i/(Dom_i + Dom_j) > U(0,1). Update Dom_i ← Dom_i + (w_i − p)·StepDom, Dom_j ← Dom_j − (w_i − p)·StepDom, with p = Dom_i/(Dom_i + Dom_j) and a floor of 0.01. — [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646)
- *(published)* Risk-sensitive attack: initiate only if a 'mental battle' would be won; obligate agents always attack. — [Hemelrijk et al. 2008](https://doi.org/10.1371/journal.pone.0002678)
- *(design inference)* Seed Dom from body mass^b (resource-holding potential) for interspecific contests. — [Parker 1974](https://doi.org/10.1016/0022-5193(74)90111-8); [Hemelrijk et al. 2008](https://doi.org/10.1371/journal.pone.0002678)
- *(published)* Hawk–dove: mixed ESS hawk frequency V/C when C > V. — [Maynard Smith & Price 1973](https://doi.org/10.1038/246015a0)
- *(published)* Geometric interference: P(attacked) = 1 − exp(−π·ρ·D_A²); relative intake declines exponentially with competitor density. — [Rappoldt et al. 2010](https://doi.org/10.1016/j.ecolmodel.2009.10.007)
- *(published)* Kleptoparasitism ESS: challenge a handler with probability 1 if ν_f·f·t_h < 1, else 0. Contest duration mean t_a/2. — [Broom & Ruxton 1998](https://www.vliz.be/imisdocs/publications/ocrd/133703.pdf)
- *(design inference)* Loser is displaced from the patch; winner gets exclusive feeding for t_a. Costs: lost foraging time t_a, energy ΔE ∝ StepDom·t_a, injury probability ∝ C (hawk–hawk only). — [Broom & Ruxton 1998](https://www.vliz.be/imisdocs/publications/ocrd/133703.pdf); [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646)

**Costs:** actor — Time t_a without foraging; energy ∝ intensity; injury risk; mobbing costs (rare injury or death, energy, attracting secondary predators, lost opportunity). Target — Displacement from resource; lost item (kleptoparasitism); lost foraging time.  
**State changes:** Dom values updated; Loser enters flee then refractory; Kleptoparasite gains item and enters handling; victim returns to search; Mob state on alarm call; exits when predator leaves range or after timeout.  
**Link to population dynamics:** Feeding-rate modifier: interference enters the ATN functional response as the Beddington–DeAngelis term c_i·B_i (Miele et al. 2019 predator interference i0). Validation: behaviour-based shorebird IBM predicted +3.65% vs observed +3.17% winter mortality after habitat loss (Goss-Custard et al. 2006).

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Personal space (encounter radius) | PersSpace | 2 | model units | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646) | [P] | Dolado et al. 2014 used 8; check original table |
| Personal space (variant) | PersSpace | 8 | model units | DomWorld variant | [Dolado et al. 2014](https://doi.org/10.18564/jasss.2356) | [P] | — |
| Near view (cohesion radius) | NearView | 24 | model units | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646); [Dolado et al. 2014](https://doi.org/10.18564/jasss.2356) | [P] | — |
| Max view (search radius) | MaxView | 50 | model units | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646); [Dolado et al. 2014](https://doi.org/10.18564/jasss.2356) | [P] | — |
| Search angle / vision angle | — | 90 / 120 | ° | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646) | [P] | — |
| Flee distance / chase distance / turn after chase | — | 2 / 1 / 45 | units, units, ° | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646); [Dolado et al. 2014](https://doi.org/10.18564/jasss.2356) | [P] | — |
| StepDom, despotic (female/male) | StepDom | 0.8 / 1.0 | — | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646) | [P] | — |
| StepDom, egalitarian (female/male) | StepDom | 0.1 / 0.2 | — | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646) | [P] | — |
| StepDom regimes (female/male) | StepDom | high 0.8/1.0; medium 0.5/0.5; medium-monomorphic 0.1/1.0; low 0.05/0.5 | — | DomWorld | [Seex et al. 2022](https://doi.org/10.3389/fevo.2022.982507) | [P] | — |
| StepDom, empirical mangabeys | StepDom | males 0.10; adult females 0.08; infant male 0.01 | — | Cercocebus (mangabeys) | [Dolado et al. 2014](https://doi.org/10.18564/jasss.2356) | [P] | — |
| Initial Dom (female/male) | Dom_0 | 8 / 16 (1999); 16 / 32 (2008) | — | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646); [Hemelrijk et al. 2008](https://doi.org/10.1371/journal.pone.0002678) | [P] | — |
| Dom floor | Dom_min | 0.01 | — | DomWorld | [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646) | [P] | — |
| Activation period | — | 20 activations × 10 individuals = 200 | activations | DomWorld | [Hemelrijk et al. 2008](https://doi.org/10.1371/journal.pone.0002678) | [V] | — |
| Body-mass exponent for Dom seeding | b | — | — | all | — | — | needs calibration; design inference |
| Attack distance (interference) | D_A | — | m | all | — | — | needs calibration; Stillman parameters not retrieved |
| Non-geometric interference factor | α | — | — | all | — | — | needs calibration |
| Kleptoparasitism worked example | P, t_h, t_a, ν_f, ν_h | 20, 5, 10, 0.01, 0.05 | model units | Holmgren 1995 values | [Broom & Ruxton 1998](https://www.vliz.be/imisdocs/publications/ocrd/133703.pdf) | [P] | Switch at food density f = 20 (ν_f·f·t_h = 1) |
| Predator interference intensity | i0 | 0.75–3.0 (intraspecific 0.8) | model units | bioenergetic model | [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269) | [P] | — |
| Resource value / injury cost | V, C | — | energy units | all | — | — | needs calibration |
| Mobbing flight speed | v0 | 10 | m/s | jackdaws | [Ling et al. 2019](https://doi.org/10.1038/s41467-019-13281-4) | [V] | — |
| Mobbing interaction radius / repulsion radius | r_int / r_rep | 4 / 0.5 | m | jackdaws | [Ling et al. 2019](https://doi.org/10.1038/s41467-019-13281-4) | [V] | Empirical metric range ~5 m (~14 body lengths) |
| Harmonic pull toward predator | k | 0.04 | model units | jackdaws | [Ling et al. 2019](https://doi.org/10.1038/s41467-019-13281-4) | [V] | — |
| Mobbing model noise / time step | η / dt | 0.05–0.15 / 0.05 s | — / s | jackdaws | [Ling et al. 2019](https://doi.org/10.1038/s41467-019-13281-4) | [V] | — |
| Transit-flock topological neighbours | k_topo | 7–8 | neighbours | jackdaws | [Ling et al. 2019](https://doi.org/10.1038/s41467-019-13281-4) | [V] | — |
| Minimum approach distance to predator | d_min | < 1 to ~4 | m | squirrels to giant otters | [Carlson & Griesser (preprint)](https://ecoevorxiv.org/repository/object/3921/download/7743/) | [P] | — |
| Alarm-call recruitment radius | R_call | — | m | all | — | — | needs calibration; no published recruitment–decay rule |
| Active scent time | T_AS | — | d | all | — | — | needs calibration; fox estimates stripped from retrieved text; 3–4 day takeover lag matched model |
| Territory takeover lag | — | 3–4 | d | red fox (Bristol) | [Giuggioli et al. 2011](https://doi.org/10.1371/journal.pcbi.1002008) | [V] | — |
| Memory half-lives (attribute / spatial) | t½ | 0.9 / 5.6 | d | roe deer | [Ranc et al. 2021](https://doi.org/10.1073/pnas.2014856118) | [V] | For remembered avoidance |

#### Sources

[GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R); [Hemelrijk 1999](https://doi.org/10.1098/rspb.1999.0646); [Hemelrijk et al. 2008](https://doi.org/10.1371/journal.pone.0002678); [Seex et al. 2022](https://doi.org/10.3389/fevo.2022.982507); [Dolado et al. 2014](https://doi.org/10.18564/jasss.2356); [Parker 1974](https://doi.org/10.1016/0022-5193(74)90111-8); [Maynard Smith & Price 1973](https://doi.org/10.1038/246015a0); [Rappoldt et al. 2010](https://doi.org/10.1016/j.ecolmodel.2009.10.007); [Goss-Custard et al. 2006](https://doi.org/10.1890/1051-0761(2006)016[2215:toabim]2.0.co;2); [Broom & Ruxton 1998](https://www.vliz.be/imisdocs/publications/ocrd/133703.pdf); [Ling et al. 2019](https://doi.org/10.1038/s41467-019-13281-4); [Carlson & Griesser (preprint)](https://ecoevorxiv.org/repository/object/3921/download/7743/); [Giuggioli et al. 2011](https://doi.org/10.1371/journal.pcbi.1002008); [Potts & Lewis 2014](https://doi.org/10.1098/rspb.2014.0231); [Ranc et al. 2021](https://doi.org/10.1073/pnas.2014856118); [Grether et al. 2017](https://doi.org/10.1016/j.tree.2017.07.004); [Drury et al. 2020](https://doi.org/10.1073/pnas.1921380117); [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269)

#### Open issues / needs calibration

- Hemelrijk 1999 values came through an automated PDF summary; PersSpace differs (2 vs 8 units). Check the original table.
- Converting 'flee 2 units / chase 1 unit' into steering forces is not given in the literature; calibrate so hierarchy steepness rises with StepDom and dominants become central.
- No cross-taxon allometry for fight energy cost or injury probability.
- No published mobbing ABM with recruitment–decay rule or predator move-on threshold.
- Stillman attack distances and time lost per fight not retrieved.

---

<a id="predation"></a>

### 3. Predation

**id:** `predation`  
**Definition:** An animal kills another animal and eats it, or feeds it to offspring or group members (RO 'preys on').

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `predation_solitary` | Solitary predation | Predator kills each victim (Lafferty & Kuris: solitary predator). | +/− | preysOn RO_0002439 |
| `predation_social` | Social (group) predation | Success depends on group size (wolf packs, lion prides). | +/− | preysOn RO_0002439 |
| `predation_cannibalism` | Cannibalism in marching bands | Conspecifics attack individuals from behind; drives escape-and-pursuit collective motion in locusts and Mormon crickets. | +/− | preysOn with actor = target species |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `preysOn` | `preyedUponBy` | RO_0002439 | RO_0002458 | [V] | default for animal–animal predation | — |
| `kills` | `killedBy` | RO_0002626 | RO_0002627 | [V] | lethal outcome flag | No textual RO definition |
| `eats` | `eatenBy` | RO_0002470 | RO_0002471 | [V] | consumption | RO says eatenBy is 'inverse of eats' but does not declare inverse_of |
| `trophicallyInteractsWith` | `trophicallyInteractsWith` | RO_0002438 | RO_0002438 | [V] | RO parent of preys on | — |

**Mangal type:** predation  
**Ambiguity notes:**
- GloBI typeOfPath: preysOn implies eats, kills and interactsWith; records may appear under any of these.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R).

#### Sign and consumer strategy

- **Actor:** + — **Target:** −
- **Lafferty & Kuris 2002 class:** solitary predator / social predator (several victims per stage, victim killed); facultative micropredator when victim is large (see hematophagy)
- **Kéfi et al. 2012 functional class:** trophic

#### Participants

- **Actors:** animal
- **Targets:** animal
- **Media:** air, land, water, surface
- Encounter possible only when media overlap. 2D search for terrestrial/benthic, 3D for pelagic/aerial/arboreal.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | pursue (seek predicted position) a target chosen by tactic: centroid, nearest, random or isolated prey; optional disperse-then-pick tactic. | forage (hunger-scaled); satiated suppresses | vision (metric + field of view); olfaction where relevant | r_detect (per species; ∝ M^p_d) | w_pursue × hunger × L_ij |
| target | evade/flee inside detection radius; selfish-herd attraction to local centroid; escape state machine (alarmed → escape → refractory). | alarmed, escape, refractory | vision; conspecific alarm propagation | r_detect_prey | w_flee × perceived risk |

**Steering-matrix derivation:** O[pred][prey] = kill + biomass transfer (+/−) → S[pred][prey] = +w_pursue·hunger·L_ij and S[prey][pred] = −w_flee·risk. L_ij from the Ricker size kernel or an allowed-link mask.

**Steering rules**

- *(published)* Predators attracted to and prey repelled from the nearest member of the other group (minimal signed predator–prey architecture). — [Angelani 2012](https://doi.org/10.1103/PhysRevLett.109.118104)
- *(published)* Prey should reduce their 'domain of danger' by moving toward neighbours (selfish herd). — [Hamilton 1971](https://doi.org/10.1016/0022-5193(71)90189-5)
- *(published)* Sheep under threat show strong attraction toward the flock centre; flock polarisation 0.85 ± 0.17 with a herding dog. — [King et al. 2012](https://doi.org/10.1016/j.cub.2012.05.008); [Jadhav et al. 2024](https://doi.org/10.1038/s42003-024-07245-8)
- *(published)* Each agent switches between flocking, alarmed, escape and refractory states by a Markov chain; 7 topological neighbours; reaction 50 ms, 20 ms when alarmed. — [Papadopoulou et al. 2026](https://doi.org/10.1038/s42003-026-10173-4)
- *(published)* Fish schools escape most flexibly with only 2–3 interacting neighbours. — [Inada & Kawachi 2002](https://doi.org/10.1006/jtbi.2001.2449)
- *(published)* Predator tactic choice (disperse the school, then target isolated prey) removes much of grouping's protective value. — [Demsar et al. 2015](https://doi.org/10.1016/j.ecolmodel.2015.02.018)
- *(published)* Mixed aerial and aquatic predators disrupt prey aggregations more than either alone. — [Lett et al. 2014](https://doi.org/10.1007/s12080-014-0213-0)
- *(design inference)* Flying and aquatic agents use a sphere sensor with radius ∝ M^p_d; ground agents use a disc. — [Pawar et al. 2012](https://doi.org/10.1038/nature11131)
- *(published)* Marching insects: escape from conspecifics approaching from behind and pursue those ahead; cannibalism drives the band. — [Bazazi et al. 2008](https://doi.org/10.1016/j.cub.2008.04.035); [Simpson et al. 2006](https://doi.org/10.1073/pnas.0508915103)

#### Encounter effect

**Contact condition:** Distance < capture radius while predator is in pursue state; prey not in a refuge.

**Outcome rules**

- *(published)* Holling type II per agent: f = a·N/(1 + a·h·N). Shift toward type III (Hill exponent > 1) when predator ≫ prey. — [Holling 1959](https://doi.org/10.4039/Ent91385-7); [Kalinkat et al. 2013](https://doi.org/10.1111/ele.12147)
- *(published)* Attack rate and handling time from body masses and temperature: log a = log a0 + b_i·log M_c + b_j·log M_r + E/k·(1/T − 1/T0); log h has the same form. — [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242)
- *(published)* Consumption rate scales ≈ M^0.85 for 2D and ≈ M^1.06 for 3D consumer search. — [Pawar et al. 2012](https://doi.org/10.1038/nature11131)
- *(design inference)* Search rate from steering: a_2D ≈ 2·r_detect·v; a_3D ≈ π·r_detect²·v. — [Pawar et al. 2012](https://doi.org/10.1038/nature11131)
- *(published)* Confusion: attack success falls as the number of prey in the predator's visual field rises (sufficient to evolve swarming). — [Olson et al. 2013](https://doi.org/10.1098/rsif.2013.0305)
- *(published)* Size-ratio feeding rule (OSMOSE): prey length ≤ predator length / τ, only when co-located. — [Shin & Cury 2001](https://www.alr-journal.org/articles/alr/pdf/2001/02/alr1135.pdf)
- *(published)* Mormon crickets separated from a band suffered 60% predation versus none inside it (dilution / protection by grouping). — [Lorch lab web page](https://lorchlab.wordpress.com/research/mormon-crickets/)
- *(design inference)* On success: prey agent dies; predator gains e·M_prey (assimilation efficiency) into energy reserve and enters handling for h, then satiated. — [Sibly et al. 2013](https://doi.org/10.1111/2041-210x.12002); [Brose et al. 2006](https://doi.org/10.1111/j.1461-0248.2006.00978.x)

**Costs:** actor — Pursuit locomotion; handling time h (no search). Target — Death (kill); non-lethal costs: vigilance and lost feeding time, flight energy.  
**State changes:** Prey removed; Predator: handling (duration h) → satiated; Nearby prey: alarmed → escape → refractory.  
**Link to population dynamics:** ATN consumer equation with functional response F_ij (Hill exponent h ≈ 1.2 default) and biomass loss to prey; agents and pools share allometric constants (N_i = B_i/M_i). Kéfi class: trophic.

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Consumption-rate mass exponent, 2D search | β_2D | 0.85 | — | 376 species, 5.24×10⁻¹⁴–800 kg | [Pawar et al. 2012](https://doi.org/10.1038/nature11131) | [V] | ≈ value |
| Consumption-rate mass exponent, 3D search | β_3D | 1.06 | — | 376 species | [Pawar et al. 2012](https://doi.org/10.1038/nature11131) | [V] | Giacomini et al. 2013 paraphrase c ∝ m^1.16 in 3D; inconsistency unresolved |
| Search-rate mass exponent, 2D / 3D | p_a | 0.68 / 1.05 | — | cross-taxon | [Pawar et al. 2012](https://doi.org/10.1038/nature11131); [Frontiers Ecol Evol 2019 (fevo.2019.00202)](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2019.00202/full) | [NV] | Widely quoted; full text not obtained |
| Feasible resource–consumer mass scaling, 2D / 3D | m_R ∝ m_C^x | 2.22 / 1.54 | — | cross-taxon | [Frontiers Ecol Evol 2019 (fevo.2019.00202)](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2019.00202/full) | [P] | — |
| Attack rate, all data: M_c exp, M_r exp, E | b_i, b_j, E_a | 0.47, 0.15, 0.44 eV | — | n = 648 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Handling time, all data: M_c exp, M_r exp, E | c_i, c_j, E_h | −0.48, 0.34, −0.27 eV | — | n = 648 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Attack rate regression: terrestrial invertebrates | log a0; b_i; b_j | −16.27; 0.24; 0.26 | log units (base not captured) | n = 277 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | E shared 0.42 eV |
| Attack rate regression: terrestrial endotherm vertebrates | log a0; b_i; b_j | −18.19; 0.47; 0.65 | log units | n = 11 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Attack rate regression: freshwater ectotherm vertebrates | log a0; b_i; b_j | −11.71; 0.31; 0.15 | log units | n = 115 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Attack rate regression: freshwater invertebrates | log a0; b_i; b_j | −19.09; 0.58; −0.01 | log units | n = 154 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Attack rate regression: marine ectotherm vertebrates | log a0; b_i; b_j | −18.77; 0.93; 0.15 | log units | n = 28 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Attack rate regression: marine invertebrates | log a0; b_i; b_j | −21.23; 0.85; 0.09 | log units | n = 41 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Handling time regression: terrestrial invertebrates | log h0; c_i; c_j | 9.62; −0.56; 0.56 | log units | n = 277 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | E shared −0.30 eV |
| Handling time regression: terrestrial endotherm vertebrates | log h0; c_i; c_j | 6.84; −0.21; 0.59 | log units | n = 11 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Handling time regression: freshwater ectotherm vertebrates | log h0; c_i; c_j | 5.69; −0.46; 0.25 | log units | n = 115 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Handling time regression: freshwater invertebrates | log h0; c_i; c_j | 9.25; −0.56; 0.22 | log units | n = 154 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Handling time regression: marine ectotherm vertebrates | log h0; c_i; c_j | 4.57; −0.09; −0.13 | log units | n = 28 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Handling time regression: marine invertebrates | log h0; c_i; c_j | 10.38; −0.76; 0.76 | log units | n = 41 | [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242) | [P] | — |
| Clearance-rate temperature optima, 2D / 2.5D / 3D | T_opt | 15.7 / 25.6 / 26.7 | °C | 2,083 curves | [Uiterwaal & DeLong 2020](https://doi.org/10.1002/ecy.2975) | [P] | Handling-time optimum 23.4 °C |
| Hill exponent of functional response | h | 1.2 | — | niche-model food webs | [Williams & Martinez 2004](https://doi.org/10.1140/epjb/e2004-00122-1) | [NV] | Miele et al. 2019 use 1 + q = 1.5 [P] |
| Attack coefficient (bioenergetic model) | a0 | 50 | model units | bioenergetic model | [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269) | [P] | — |
| Assimilation efficiency on animal prey | e_anim | 0.85 | — | ATN default | [Brose et al. 2006](https://doi.org/10.1111/j.1461-0248.2006.00978.x) | [NV] | Recorded from memory; verify against ATNr vignette |
| Size-ratio threshold (length) | τ | 3.5 | predator/prey length | fish (OSMOSE) | [Shin & Cury 2001](https://www.alr-journal.org/articles/alr/pdf/2001/02/alr1135.pdf) | [P] | — |
| Detection distance | r_detect | — | m | all | — | — | needs calibration; per-taxon detection distances not collected; scale ∝ M^p_d |
| Attack success probability | p_success | — | — | all | — | — | needs calibration; per-taxon values not collected |
| Confusion function | p_success(n_prey_in_view) | — | — | all | — | — | needs calibration; form sourced (Olson et al. 2013), no numeric curve |
| Topological neighbours, starling escape model | k | 7 | neighbours | starlings | [Papadopoulou et al. 2026](https://doi.org/10.1038/s42003-026-10173-4) | [V] | Cruise 9.5 m/s; NND 0.86 m |
| Prey flight speed under threat | v_flee | 1.3–1.5 | m/s | Merino sheep | [Jadhav et al. 2024](https://doi.org/10.1038/s42003-024-07245-8); [Ginelli et al. 2015](https://doi.org/10.1073/pnas.1503749112) | [V] | Dog 1.5 m/s mean, peaks > 2 m/s; dog 3–7 m from flock barycentre |
| Flexible-escape neighbour count | k | 2–3 | neighbours | fish schools (model) | [Inada & Kawachi 2002](https://doi.org/10.1006/jtbi.2001.2449) | [V] | — |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R); [Lafferty & Kuris 2002](https://doi.org/10.1016/S0169-5347(02)02615-0); [Pawar et al. 2012](https://doi.org/10.1038/nature11131); [Giacomini et al. 2013](https://doi.org/10.1038/nature11829); [Frontiers Ecol Evol 2019 (fevo.2019.00202)](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2019.00202/full); [Rall et al. 2012](https://doi.org/10.1098/rstb.2012.0242); [Kalinkat et al. 2013](https://doi.org/10.1111/ele.12147); [Uiterwaal et al. 2022](https://doi.org/10.1002/ecy.3706); [Uiterwaal & DeLong 2020](https://doi.org/10.1002/ecy.2975); [Holling 1959](https://doi.org/10.4039/Ent91385-7); [Williams & Martinez 2004](https://doi.org/10.1140/epjb/e2004-00122-1); [Brose et al. 2006](https://doi.org/10.1111/j.1461-0248.2006.00978.x); [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269); [Angelani 2012](https://doi.org/10.1103/PhysRevLett.109.118104); [Hamilton 1971](https://doi.org/10.1016/0022-5193(71)90189-5); [King et al. 2012](https://doi.org/10.1016/j.cub.2012.05.008); [Jadhav et al. 2024](https://doi.org/10.1038/s42003-024-07245-8); [Papadopoulou et al. 2026](https://doi.org/10.1038/s42003-026-10173-4); [Inada & Kawachi 2002](https://doi.org/10.1006/jtbi.2001.2449); [Olson et al. 2013](https://doi.org/10.1098/rsif.2013.0305); [Demsar et al. 2015](https://doi.org/10.1016/j.ecolmodel.2015.02.018); [Lett et al. 2014](https://doi.org/10.1007/s12080-014-0213-0); [Storms et al. 2019](https://doi.org/10.1007/s00265-018-2609-0); [Shin & Cury 2001](https://www.alr-journal.org/articles/alr/pdf/2001/02/alr1135.pdf); [Bazazi et al. 2008](https://doi.org/10.1016/j.cub.2008.04.035); [Bazazi et al. 2010](https://doi.org/10.1371/journal.pone.0015118); [Simpson et al. 2006](https://doi.org/10.1073/pnas.0508915103); [Lorch lab web page](https://lorchlab.wordpress.com/research/mormon-crickets/); [Schneider et al. 2016](https://doi.org/10.1038/ncomms12718); [Barrios-O'Neill et al. 2016](https://doi.org/10.1111/ele.12605); [Ginelli et al. 2015](https://doi.org/10.1073/pnas.1503749112); [Sibly et al. 2013](https://doi.org/10.1111/2041-210x.12002)

#### Open issues / needs calibration

- Pawar 2012 component exponents (velocity, detection distance, search rate) and CIs not verified; 1.06 vs 1.16 discrepancy unresolved.
- Rall et al. 2012 units, log base and T0 not captured; check before using regressions.
- No per-taxon detection distances or attack-success probabilities (e.g. raptor strike success, fish reactive distance).
- ATN default constants were recorded from memory.
- Barrios-O'Neill et al. 2016 report context-dependent capture-rate scaling; how to combine with Rall/Pawar is open.

---

<a id="dispersal"></a>

### 4. Dispersal (animal-mediated propagule and organism transport)

**id:** `dispersal`  
**Definition:** An animal carries seeds, spores or other organisms and releases them elsewhere. Implemented as a cargo list on the carrier: pickup event, timer or hazard, drop at the carrier's current position.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `dispersal_endozoochory` | Seed endozoochory (frugivory, waterfowl, fish) | Seeds ingested with fruit, retained for a gut retention time, defecated alive with survival probability s. | +/+ | dispersalVectorOf (NO_MATCH); eats RO_0002470 for the feeding event |
| `dispersal_ichthyochory` | Ichthyochory | Endozoochory by fish; seeds retained hours to about a week. | +/+ | dispersalVectorOf |
| `dispersal_epizoochory` | Seed epizoochory | Diaspores attach to fur/feathers on contact and detach by a body-zone-specific hazard, grooming or transfer. | 0/+ | dispersalVectorOf |
| `dispersal_myrmecochory` | Myrmecochory | Ants carry elaiosome-bearing seeds to the nest (a few metres). | +/+ | dispersalVectorOf |
| `dispersal_phoresy` | Phoresy | A small, low-mobility animal attaches to a host at a deteriorating resource and detaches at a new resource. | +/0 | no RO term; GloBI livesOn (NO_MATCH) or custom 'phoreticOn' |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `dispersalVectorOf` | `hasDispersalVector` | none (NO_MATCH) | — | [V] | animal (actor) disperses plant/organism (target) | GloBI label exists; RO IRI = NO_MATCH |
| `vectorOf (via EOL DispersalVector)` | `hasVector (via EOL HasDispersalVector)` | RO_0002459 | RO_0002460 | [V] | how GloBI maps EOL dispersal records | Same IRIs as pathogen vectors |

**Mangal type:** mutualism (frugivore dispersal); otherwise unspecified (inference)  
**Ambiguity notes:**
- No RO dispersal relation exists; GloBI marks dispersalVectorOf NO_MATCH.
- vectorOf / hasVector (RO_0002459 / RO_0002460) is shared by disease vectors and dispersal vectors. Disambiguate on import: target is a plant → dispersal; target is a pathogen → disease vector.
- GloBI typeOfPath: dispersalVectorOf implies hostOf, symbiontOf and vectorOf.
- No RO term for phoresy, epizoochory or myrmecochory.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java).

#### Sign and consumer strategy

- **Actor:** + (fruit/elaiosome reward) or 0 (epizoochory, phoresy carrier) — **Target:** + (dispersal, recruitment)
- **Lafferty & Kuris 2002 class:** not applicable
- **Kéfi et al. 2012 functional class:** recruitment modifier (deposition sets where recruits appear)

#### Participants

- **Actors:** animal
- **Targets:** plant, tree, alga (spores; not covered), animal (phoronts)
- **Media:** air, land, water
- Ants (myrmecochory), birds, mammals, fish, waterfowl; phoronts on insects, birds, mammals.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | seek fruiting plants (frugivores; herbivory/frugivory attraction); during rest phases seek roost/latrine/sleeping site where clumped deposition occurs; ants seek seeds then return to nest. | forage (pickup); rest (deposition-site attractor) | vision / odour | r_detect_fruit | w_seek × hunger × fruit_load |
| target | none (plants sessile). Phoronts: seek host when local resource quality is below a threshold; attach/ride-along; detach when resource is good. | phoront: seeking-host, attached, detached | contact | r_contact | — |

**Steering-matrix derivation:** Dispersal itself adds no pairwise steering term: the carrier's movement is set by its own rules, and the kernel emerges. The attraction to fruit comes from the herbivory/frugivory outcome. Phoront → host is positive (+/0) in seeking-host state only.

**Steering rules**

- *(published)* Among species, carrier movement drives dispersal distance more than gut passage time does. — [Rehm et al. 2019](https://doi.org/10.1098/rspb.2018.2007); [Jones et al. 2017](https://doi.org/10.1002/ece3.3113)
- *(published)* Kernel scale is set mainly by plant aggregation, kernel shape mainly by frugivore density. — [Morales & Carlo 2006](https://doi.org/10.1890/0012-9658(2006)87[1489:teopda]2.0.co;2)
- *(published)* Seeds are clumped at sleeping sites and latrines; mixture kernels fit better than single parametric kernels. — [Russo et al. 2006](https://russolab.unl.edu/PDF/Russo_et_al_2006_Ecol.pdf)
- *(design inference)* Add a deposition-site attractor during rest phases to reproduce clumped deposition. — [Russo et al. 2006](https://russolab.unl.edu/PDF/Russo_et_al_2006_Ecol.pdf); [Kleyheeg et al. 2017 (J Ecol)](https://doi.org/10.1111/1365-2745.12738)

#### Encounter effect

**Contact condition:** Endozoochory: feeding on a fruiting plant (herbivory encounter). Epizoochory: plant height zone overlaps an animal body zone. Myrmecochory: ant contacts seed. Phoresy: phoront within r_contact of a permitted host.

**Outcome rules**

- *(design inference)* Pickup: add n seeds per feeding event to cargo with plantID, origin and exit time T ~ Gamma(k, mean = GRT(M)). Assign survival s by seed size and hardness. — [Jones et al. 2017](https://doi.org/10.1002/ece3.3113); [Kleyheeg et al. 2019](https://doi.org/10.3389/fevo.2019.00040)
- *(published)* Gut retention gamma-distributed: SEADS shape 4, scale 5 (rescaled to means 15–480 min), truncated at ≤ 8 h of the waking day; mallard shape 2.7 with seed-size-dependent rate. — [Jones et al. 2017](https://doi.org/10.1002/ece3.3113); [Kleyheeg et al. 2019](https://doi.org/10.3389/fevo.2019.00040)
- *(published)* Small, hard seeds survive gut passage best; seed survival matters more than retention time for long-distance dispersal in mallards. — [Kleyheeg et al. 2017 (J Ecol)](https://doi.org/10.1111/1365-2745.12738); [Lovas-Kiss et al. 2020](https://doi.org/10.1002/ece3.5997)
- *(design inference)* Epizoochory: attach with probability P_attach; detach with hazard λ_zone = ln2/half-life; extra detachment on grooming; transfer to another agent on contact with p ≈ 0.05. — [Liehrmann et al. 2018](https://doi.org/10.1002/ece3.3768)
- *(published)* Myrmecochory: larger ants carry farther and prefer larger elaiosomes; small ants cannot move seeds once the elaiosome is removed. — [Yun et al. 2026](https://doi.org/10.3390/insects17070677)
- *(design inference)* Phoresy: attach on contact when resource quality is below threshold; position = host position + offset; detach when host enters good habitat or after max ride time. — [Bartlow & Agosta 2021](https://doi.org/10.1111/brv.12654)
- *(design inference)* Drop at current position when T is reached or the hazard fires; if T falls during rest, redirect to roost/latrine. Apply survival s; record deposition distance. — [Russo et al. 2006](https://russolab.unl.edu/PDF/Russo_et_al_2006_Ecol.pdf); [Kleyheeg et al. 2017 (J Ecol)](https://doi.org/10.1111/1365-2745.12738)
- *(published)* Seed dispersal effectiveness = quantity × quality; establishment depends on microsite and local seed density. — [Schupp et al. 2010](https://doi.org/10.1111/j.1469-8137.2010.03402.x)

**Costs:** actor — Negligible (cargo mass). Phoront carrier: small mass/drag penalty (design inference). Target — Seed mortality in gut (1 − s); phoront has near-zero metabolism while attached (inference).  
**State changes:** Cargo item added (pickup) / removed (drop); Seed becomes a recruit candidate at the drop site; Phoront: seeking-host → attached → detached.  
**Link to population dynamics:** Recruitment modifier: dropped seeds enter the producer recruitment step (probability by microsite and density), shifting where plant biomass grows. Kernels are emergent, not imposed; validate against observed seed dispersal distances (songbirds ~50–300 m, monkeys ~150–330 m, mallards up to 8–19 km/day, Colossoma mean 337–552 m).

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Gut-retention gamma shape | k | 2.7 (mallard); 4 (SEADS default) | — | Anas platyrhynchos; generic | [Kleyheeg et al. 2019](https://doi.org/10.3389/fevo.2019.00040); [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [P] | Mallard value [P]; SEADS [V] |
| SEADS gamma scale and mean range | θ; mean | 5; 15–480 | —; min | generic disperser | [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [V] | Truncated at ≤ 8 h |
| Mallard retention rate parameter (small / large seeds) | rate | 0.63 / 0.44 | presumably h⁻¹ | Anas platyrhynchos; seeds 0.2 / 20 mm³ | [Kleyheeg et al. 2019](https://doi.org/10.3389/fevo.2019.00040) | [P] | Units not confirmed |
| Gut retention allometry (endotherms) | GRT(M) | 117·M^0.43 | min (M in kg) | endotherms, n = 16, r² = 0.76 | [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [derived] | Notes' own fit to Jones et al. 2017 Table 1; not published |
| Seed dispersal distance allometry | SDD(M) | 237·M^0.20 | m (M in kg) | endotherms, r² = 0.35 | [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [derived] | Notes' own fit; weak |
| GRT, songbirds | GRT | 17–135 | min | songbirds 0.030–0.119 kg | [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [V] | MD 17–61 m; TBM 2.55–10.73 min; SDD 50–1,168 m |
| GRT, pigeon / hornbill / turaco | GRT | 120 / 57 / 70 | min | 0.65 / 0.635 / 0.25 kg | [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [V] | — |
| GRT, monkeys | GRT | 376–1,180 | min | 5.4–7.4 kg | [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [V] | SDD 317–327 m |
| GRT, cassowary / elephant | GRT | 433 / 2,370 | min | 63 / 2,840 kg | [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [V] | SDD 336 / 1,522 m |
| GRT, tortoises / lizard | GRT | 11,952–17,280 / 2,640 | min | 8.2–250 kg / 0.008 kg | [Jones et al. 2017](https://doi.org/10.1002/ece3.3113) | [V] | — |
| Gut passage, spider monkeys | GRT | 2.5–18 (mode ~3.5) | h | Ateles | [Russo et al. 2006](https://russolab.unl.edu/PDF/Russo_et_al_2006_Ecol.pdf) | [P] | Mean dispersal 151 m (all seeds), 245 m (dispersed); max ~800–1000 m |
| Deposition split, spider monkeys | — | 50% in transit, 50% sleeping sites (67% reused, 33% single-use) | fraction | Ateles | [Russo et al. 2006](https://russolab.unl.edu/PDF/Russo_et_al_2006_Ecol.pdf) | [P] | — |
| Gut passage medians, Saipan birds | GRT | 25.8–97.0 | min | 39 bird–tree pairs | [Rehm et al. 2019](https://doi.org/10.1098/rspb.2018.2007) | [P] | Median dispersal ≥ 56 m |
| Share of mallard-dispersed seeds to communal roosts | — | 0.34 | fraction | Anas platyrhynchos | [Kleyheeg et al. 2017 (J Ecol)](https://doi.org/10.1111/1365-2745.12738) | [P] | 7% between foraging areas |
| Mallard egestion window | — | most within 12 h; few viable at 24–72 h | h | Anas platyrhynchos (NZ) | [Bartel et al. 2018](https://doi.org/10.7717/peerj.4811) | [P] | 9% of intact seeds germinated; max displacement 8.0 km in 24 h, 19.2 km in 24–48 h |
| Ichthyochory dispersal distance | SDD | mean 337–552; max 5,495 | m | Colossoma macropomum | [Anderson et al. 2011](https://doi.org/10.1098/rspb.2011.0155) | [V] | ≥ 5% of seeds 1,700–2,110 m; increases with fish size |
| Epizoochory retention half-life by body zone | t½ | goat: head 14, flanks 61, rump 132; red deer: 1, 9, > 360; donkey > 360 all zones | min | dwarf goat, red deer, Poitou donkey (cocklebur) | [Liehrmann et al. 2018](https://doi.org/10.1002/ece3.3768) | [V] | Hazard λ = ln2/t½ |
| Proportion of diaspores retained after 6 h | — | donkey 0.88; red deer 0.26; goat 0.16 | fraction | ungulates | [Liehrmann et al. 2018](https://doi.org/10.1002/ece3.3768) | [V] | — |
| Grooming share of detachments / transfer between individuals | — | 0.07–0.14 / 0.05 | fraction | ungulates | [Liehrmann et al. 2018](https://doi.org/10.1002/ece3.3768) | [V] | — |
| Myrmecochory distance | SDD | mean 2.24 ± 7.19; max 180 | m | global ant survey | [Yun et al. 2026](https://doi.org/10.3390/insects17070677) | [P] | — |
| Attachment probability on contact (epizoochory) | P_attach | — | — | all | — | — | needs calibration; fur-length dependent |
| Seed survival through gut | s | — | fraction | all | — | — | needs calibration; depends on seed mass, hardness, roundness and phylogeny (Lovas-Kiss et al. 2020) |
| Fruit removal per visit | n_seeds | — | seeds visit⁻¹ | all | — | — | needs calibration; no universal value; species-specific |
| Phoront attach / detach probability and max ride time | p_a, p_d, t_ride | — | —, —, d | all | — | — | needs calibration; mechanisms 'largely unknown' (Bartlow & Agosta 2021) |

#### Sources

[GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [Morales & Carlo 2006](https://doi.org/10.1890/0012-9658(2006)87[1489:teopda]2.0.co;2); [Russo et al. 2006](https://russolab.unl.edu/PDF/Russo_et_al_2006_Ecol.pdf); [Rehm et al. 2019](https://doi.org/10.1098/rspb.2018.2007); [Jones et al. 2017](https://doi.org/10.1002/ece3.3113); [Kleyheeg et al. 2019](https://doi.org/10.3389/fevo.2019.00040); [Kleyheeg et al. 2017 (J Ecol)](https://doi.org/10.1111/1365-2745.12738); [Kleyheeg et al. 2017 (Mov Ecol)](https://doi.org/10.1186/s40462-016-0092-7); [Bartel et al. 2018](https://doi.org/10.7717/peerj.4811); [Lovas-Kiss et al. 2020](https://doi.org/10.1002/ece3.5997); [Anderson et al. 2011](https://doi.org/10.1098/rspb.2011.0155); [Liehrmann et al. 2018](https://doi.org/10.1002/ece3.3768); [Yun et al. 2026](https://doi.org/10.3390/insects17070677); [Bartlow & Agosta 2021](https://doi.org/10.1111/brv.12654); [Schupp et al. 2010](https://doi.org/10.1111/j.1469-8137.2010.03402.x); [Nathan et al. 2008](https://doi.org/10.1016/j.tree.2008.08.003)

#### Open issues / needs calibration

- Published GRT–mass allometries (birds, mammals, reptiles, fish) were not retrieved; the 117·M^0.43 fit is a heuristic.
- No universal fruit-removal probability; no phoresy attach/detach rates.
- Recruitment quality (Janzen–Connell, microsite) needs separate parameterisation.
- Pollen carryover was not covered (see floral visitation).

---

<a id="epibiosis"></a>

### 5. Epibiosis (organisms living on the surface of other organisms)

**id:** `epibiosis`  
**Definition:** An epibiont (alga, plant, sessile animal) settles and lives on the outer surface of a host (basibiont): epiphytes on trees and plants, barnacles and other epizoans on turtles, whales and fish. The host carries the epibiont; epibionts change the host's mass, drag and interface with the environment.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `epibiosis_epiphyte` | Epiphytism (plant/alga on plant) | Epiphytes on trees (phorophytes) as a patch-occupancy metapopulation. | +/0 | epiphyteOf RO_0008501 / hasEpiphyte RO_0008502 |
| `epibiosis_epizoic` | Epizoic epibiosis on mobile hosts | Barnacles, amphipods, copepods on turtles, whales, dolphins; drag and mass cost to host. | +/0 or +/− | symbiontOf RO_0002440 / commensalistOf RO_0002441 / ectoparasiteOf RO_0002632 where harmful; GloBI livesOn (NO_MATCH) |
| `epibiosis_phoresy` | Phoresy (transport epibiosis) | Temporary attachment for transport; full rules under dispersal_phoresy. | +/0 | no RO term |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `epiphyteOf` | `hasEpiphyte` | RO_0008501 | RO_0008502 | [V] | plant or alga on a plant | RO def restricts to plant/alga on another plant |
| `symbiontOf` | `symbiontOf` | RO_0002440 | RO_0002440 | [V] | animal epibionts (RO example: whales and attached barnacles) | declared is_symmetric |
| `commensalistOf` | `commensalistOf` | RO_0002441 | RO_0002441 | [V] | harmless epibionts | RO spelling 'commensually interacts with' |
| `ectoparasiteOf` | `hasEctoparasite` | RO_0002632 | RO_0002633 | [V] | harmful epibionts (e.g. Pennella) | — |
| `hasHost` | `hostOf` | RO_0002454 | RO_0002453 | [V] | alternative for organism-on-animal | — |
| `livesOn` | `livedOnBy` | none (NO_MATCH) | — | [V] | GloBI label for organism on animal | RO IRI = NO_MATCH |

**Mangal type:** commensalism (or parasitism for harmful epibionts)  
**Ambiguity notes:**
- RO has no 'epibiont of', 'epizoic' or 'phoront of' relation (text search for phore, epibio, hitchhik found none).
- epiphyteOf is restricted to plant/alga hosts; animal hosts need symbiontOf/commensalistOf/ectoparasiteOf or a custom 'epibiontOf' with ro_iri = null.
- GloBI typeOfPath: epiphyteOf implies symbiontOf; ectoparasiteOf implies parasiteOf, livesOn, eats, damages, hasHost.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java).

#### Sign and consumer strategy

- **Actor:** + — **Target:** 0 (commensal) or − (drag/weight cost; harmful epibionts)
- **Lafferty & Kuris 2002 class:** not applicable (typical parasite when harmful)
- **Kéfi et al. 2012 functional class:** habitat provision (host surface); host mortality/feeding-rate modifier when load is heavy

#### Participants

- **Actors:** alga, plant, animal (sessile or semi-sessile epizoans)
- **Targets:** tree, plant, alga (kelp), animal (turtles, whales, dolphins, crabs, fish)
- **Media:** water, air (epiphytes), land
- Settlement supply depends on the host's current environment (water temperature/region).

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | none at agent scale (settlement from an environmental supply field). Adult turtle barnacles creep up to 78.6 mm/yr against flow (sub-tick; ignore or apply as on-host position drift). | settler/attached | contact | host surface | — |
| target | Host steering unchanged except through the drag penalty on max speed (mobile hosts). Optional camouflage or associational resistance toggles change predators' detection of the host (Wahl 'ecological lever'). | any | — | — | — |

**Steering-matrix derivation:** No pairwise attraction: epibionts are attached state on the host (attach/ride-along). The host's steering row is unchanged; v_max is scaled by the drag factor. Sessile hosts have no steering.

**Steering rules**

- *(published)* Epibionts modulate host–environment interactions via drag, morphology and exchange across the body surface ('ecological lever'). — [Wahl 2008](https://doi.org/10.1080/08927010802339772)
- *(design inference)* Drag cost: δ = 1 + κ_d·φ; at constant propulsive power v_max' = v_max·δ^(−1/3); or energy per distance × δ at fixed speed. κ_d tuned so a very heavy load gives δ ≈ 2 at most. — [Baruffaldi et al. 2023](https://doi.org/10.3389/fmars.2023.1243153)

#### Encounter effect

**Contact condition:** Settlement onto host surface from an environmental supply (no agent–agent encounter); epiphytes colonise trees by connectivity to occupied trees.

**Outcome rules**

- *(design inference)* Expected new settlers per tick = s_env(x, T, t)·A_s·(1 − φ)·Δt; multiplier for wounded or large hosts. — [Chaieb et al. 2024](https://doi.org/10.3354/dao03796); [Ten et al. 2022](https://doi.org/10.1038/s41598-022-25929-1)
- *(published)* Epibiont occurrence rises modestly with whale body length; no recruitment in Antarctic waters; Xenobalanus all dead where minimum SST < 12 °C. — [Ten et al. 2022](https://doi.org/10.1038/s41598-022-25929-1)
- *(published)* Pennella balaenoptera attached exclusively to wounds on a stranded beaked whale (site selection for injured skin). — [Chaieb et al. 2024](https://doi.org/10.3354/dao03796)
- *(published)* Barnacle growth von Bertalanffy: L(t) = L∞(1 − e^(−k t)). — [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8)
- *(design inference)* Constant detachment hazard from 24.1% loss per 9–21-day interval. — [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8)
- *(published)* Heavy loads may double volume and mass of juvenile turtles; debilitated turtles carried ~1,092 barnacles vs ~139. — [Baruffaldi et al. 2023](https://doi.org/10.3389/fmars.2023.1243153)
- *(design inference)* Epiphytes: P(colonise in Δt) = 1 − exp(−c·S_i·Δt), S_i = Σ_j occupied·exp(−α·d_ij)·A_j^b; multiply by host suitability h(DBH, bark roughness, wood density); extinction tied to tree fall. — [Snall et al. 2005](https://doi.org/10.1890/04-0531); [Sayago et al. 2013](https://doi.org/10.1098/rspb.2012.2821)
- *(published)* Epiphytes are more common on large, abundant, denser-wood, rougher-bark hosts; low specialisation; nested networks. — [Sayago et al. 2013](https://doi.org/10.1098/rspb.2012.2821); [Naranjo et al. 2019](https://doi.org/10.1093/aobpla/plz011)
- *(published)* Host chemistry can filter settlers (seaweed surface metabolites attract protective and deter pathogenic epibacteria). — [Saha et al. 2019](https://doi.org/10.1111/1365-2745.13193)
- *(design inference)* Host death: obligate epibionts die with the host or within days; facultative ones and epiphytes on fallen logs persist briefly then decay; phoronts detach and search. — [Ten et al. 2022](https://doi.org/10.1038/s41598-022-25929-1)

**Costs:** actor — Exposure to host environment (temperature death). Target — Added mass M_e; drag (speed or energy penalty); possible foraging impairment under heavy load; epiphyte load cost to trees not quantified.  
**State changes:** Host epibiont list / cover φ and mass M_e updated; Host v_max scaled by δ^(−1/3); Epibionts removed on detachment, temperature death or host death.  
**Link to population dynamics:** Epibiont population dynamics driven by host density (host crashes cascade to host-specific epibionts; Ten et al. 2026). Host effect enters as a feeding-rate/energy modifier (drag). Epiphytes: metapopulation on tree patches.

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Barnacle von Bertalanffy growth constant | k | 0.0091 | d⁻¹ | Chelonibia testudinaria on green turtles | [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8) | [V] | Growth ~2× faster than on Australian loggerheads |
| Barnacle asymptotic length | L∞ | 59.5 | mm (rostro-carinal) | Chelonibia testudinaria | [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8) | [V] | — |
| Barnacle basal-area growth | dA/dt | 8.6 | mm² d⁻¹ | Chelonibia testudinaria | [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8) | [V] | Linear |
| Settlement before first nesting | — | 76 | d | Chelonibia on green turtles | [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8) | [V] | — |
| Detachment per inter-nesting interval | — | 0.241 | fraction per 9–21 d | Chelonibia testudinaria | [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8) | [V] | Host identity explained 66.4% of growth variance |
| Detachment hazard | λ_det | 0.013–0.031 (≈ 0.018 at 15 d) | d⁻¹ | Chelonibia testudinaria | [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8) | [derived] | −ln(1 − 0.241)/Δt, constant hazard assumed |
| Barnacle load, normal vs debilitated loggerheads | N_epi | 139 ± 189 vs 1,092 ± 540 | barnacles per turtle | Caretta caretta (Adriatic) | [Baruffaldi et al. 2023](https://doi.org/10.3389/fmars.2023.1243153) | [V] | Chelonibia on 90.6% of turtles; Platylepas on 45.3% |
| Adult barnacle locomotion | v_epi | up to 78.6 | mm yr⁻¹ | Chelonibia on loggerhead and green turtles | [Chan et al. 2021](https://doi.org/10.1098/rspb.2021.1620) | [V] | Mostly against water flow |
| Epibiont prevalence on Antarctic minke whales | — | amphipod 22.2%; Xenobalanus 11.1%; Coronula reginae 8.7%; Conchoderma auritum 9.0%; Pennella 0.6% | % of whales | Balaenoptera bonaerensis (125 of 333 carried epibionts) | [Ten et al. 2022](https://doi.org/10.1038/s41598-022-25929-1) | [V] | — |
| Lethal temperature for Xenobalanus | T_min | 12 | °C (minimum SST) | Xenobalanus globicipitis | [Ten et al. 2022](https://doi.org/10.1038/s41598-022-25929-1) | [V] | — |
| Environmental settlement supply | s_env | — | settlers m⁻² d⁻¹ | all | — | — | needs calibration |
| Drag coefficient of load | κ_d | — | — | all | — | — | needs calibration; no measured drag increment; physics-based upper bound δ ≤ 2 |
| Epiphyte colonisation rate / dispersal scale | c, α | — | d⁻¹, m⁻¹ | all | — | — | needs calibration; Snäll et al. 2005 estimates not read |
| Epiphyte load cost to tree | — | — | — | all | — | — | needs calibration; not quantified in any source |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [Wahl 2008](https://doi.org/10.1080/08927010802339772); [Poyatos et al. 2025](https://doi.org/10.1007/s00227-025-04683-8); [Baruffaldi et al. 2023](https://doi.org/10.3389/fmars.2023.1243153); [Chan et al. 2021](https://doi.org/10.1098/rspb.2021.1620); [Ten et al. 2022](https://doi.org/10.1038/s41598-022-25929-1); [Ten et al. 2026](https://doi.org/10.1111/1365-2656.70216); [Chaieb et al. 2024](https://doi.org/10.3354/dao03796); [Saha et al. 2019](https://doi.org/10.1111/1365-2745.13193); [Snall et al. 2005](https://doi.org/10.1890/04-0531); [Sayago et al. 2013](https://doi.org/10.1098/rspb.2012.2821); [Naranjo et al. 2019](https://doi.org/10.1093/aobpla/plz011); [Bartlow & Agosta 2021](https://doi.org/10.1111/brv.12654)

#### Open issues / needs calibration

- No measured drag increase or energetic cost of barnacles on turtles or whales; κ_d is a physical assumption.
- Snäll et al. 2005 colonisation/extinction estimates unread.
- Causality of heavy loads (sick → fouled vs fouled → sick) unresolved.
- No data retrieved on decorator crabs, associational resistance or shared doom.

---

<a id="hematophagy"></a>

### 6. Hematophagy (blood feeding)

**id:** `hematophagy`  
**Definition:** An animal feeds on the blood of a living vertebrate host without killing it. Brief-visit blood feeders (mosquitoes, tabanids, tsetse, vampire bats, leeches) are micropredators; ticks and lice that stay attached for a life stage are typical (ecto)parasites.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `hematophagy_micropredator` | Micropredation (brief-visit blood feeding) | Several victims per life stage, host survives (mosquitoes, tabanids, tsetse, vampire bats). | +/− | eats RO_0002470 + visits, or hasHost; local flag strategy = micropredator |
| `hematophagy_attached` | Attached blood-feeding ectoparasite (ticks) | One host per stage, days attached; see also parasitism. | +/− | ectoparasiteOf RO_0002632 |
| `hematophagy_vector` | Pathogen vectoring at the bite | Pathogen transmitted vector ↔ host during blood meal. | n/a | vectorOf RO_0002459 / hasVector RO_0002460 |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `ectoparasiteOf` | `hasEctoparasite` | RO_0002632 | RO_0002633 | [V] | attached blood feeders (ticks, lice, fleas, leeches) | — |
| `eats` | `eatenBy` | RO_0002470 | RO_0002471 | [V] | brief-visit blood feeders, with target constraint = blood | — |
| `hasHost` | `hostOf` | RO_0002454 | RO_0002453 | [V] | brief-visit blood feeders (alternative) | — |
| `vectorOf` | `hasVector` | RO_0002459 | RO_0002460 | [V] | pathogen carriage by the blood feeder | Shared with dispersal vectors |

**Mangal type:** parasitism (inference)  
**Ambiguity notes:**
- No dedicated hematophagy, blood-feeding or micropredator term exists in RO or GloBI (RO searched for 'blood', 'hemat', 'haemat': only anatomical vessel relations RO_0020101/0020102).
- The team must choose per taxon: ectoparasiteOf for ticks/lice/fleas/leeches that stay on the host; eats + visits or hasHost for mosquitoes and other brief visitors.
- vectorOf is shared by disease and dispersal vectors.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java).

#### Sign and consumer strategy

- **Actor:** + — **Target:** −
- **Lafferty & Kuris 2002 class:** micropredator (mosquitoes, leeches, tabanids, lampreys); facultative micropredator (vampire bats); typical parasite (hard ticks: one host per stage)
- **Kéfi et al. 2012 functional class:** trophic + mortality modifier; strong non-consumptive (behavioural) effects on hosts

#### Participants

- **Actors:** animal (flying insects, bats, leeches, ticks)
- **Targets:** animal (vertebrates)
- **Media:** air, land, water (leeches)
- Mosquito flight suppressed by wind; tabanid landings fall above ~25 km/h wind.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | Host-seeking state machine: RANGE (correlated random walk) → SURGE upwind on odour above threshold / CAST crosswind on loss → VISUAL_APPROACH (seek nearest host) → LAND (contact radius) → FEED → DIGEST/REST (no host seeking). | host-seeking (after gonotrophic/digest timer) | CO₂/odour plume + wind direction; vision at 5–15 m (mosquito); heat at short range | perception 20–50 m (landscape); visual 5–15 m; contact 0.5 m | w_seek; speed modulated by local CO₂ (orthokinesis) |
| target | Harassment response scaled by local biter density H: cohesion × (1 + k·H), centre-seeking (selfish herd), upwind or relief-habitat seeking, speed up, foraging suppression; discrete defensive actions (tail flick, skin twitch, stamp). | harassed (alarmed variant) | landing biters within radius | r_harass | w_cohesion·(1 + k·H); w_center |

**Steering-matrix derivation:** O[feeder][host] = small non-lethal energy transfer (+/−) → S[feeder][host] = +w_seek (host-seeking state only, via plume field). S[host][feeder] is not a flee term per biter; hosts respond to aggregate harassment by tighter cohesion and centre-seeking (the field-level response). Wind threshold gates feeder flight.

**Steering rules**

- *(published)* Plume tracking requires wind direction; insects surge upwind on odour and cast crosswind on loss. — [Carde & Willis 2008](https://doi.org/10.1007/s10886-008-9484-5); [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500)
- *(published)* CO₂ detection activates attraction to visual features; humans become visible to mosquitoes at 5–15 m; thermal cues at short range. — [van Breugel et al. 2015](https://doi.org/10.1016/j.cub.2015.06.046)
- *(published)* Crosswind plume-finding strategy most reliably led mosquitoes to a host; model most sensitive to maximum flight speed. — [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500)
- *(published)* Two-stage foraging: random flight until a resource is in perception range, then directional flight. — [Gu & Novak 2009](https://doi.org/10.1016/j.trstmh.2009.01.006)
- *(published)* Horses in larger groups are bothered by fewer flies; under harassment they bunch tightly; per-capita fly load rises with spacing (y = 0.53 + 0.12X). — [Rubenstein & Feinstein 2021](https://doi.org/10.3389/fevo.2021.659570)
- *(published)* Caribou in insect season: movement up to 971 m/h vs 121 m/h baseline; walk into wind; tight aggregations; interior animals less harassed. — [Joly et al. 2020](https://doi.org/10.3390/toxins12050334)
- *(published)* Mobile-parasite intensity per host decreases with host group size (encounter dilution); contagious parasites increase. — [Cote & Poulin 1995](https://doi.org/10.1093/beheco/6.2.159); [Mooring & Hart 1992](https://ucdavis.pure.elsevier.com/en/publications/animal-grouping-for-protection-from-parasites-selfish-herd-and-en)
- *(published)* Tighter host clusters give narrower odour plumes and fewer bites per host. — [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500)

#### Encounter effect

**Contact condition:** Distance to host < contact radius (0.5 m in the mosquito model); feeding continues for the feed duration unless dislodged.

**Outcome rules**

- *(published)* Feeding is a decision tree: attempt, choose host type (anthropophily), indoor/outdoor, blocked or killed, post-feed survival. — [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303)
- *(published)* Host defences (licking, twitching, tail flicking, stamping) interrupt tabanid feeding; cattle stop responding after 10–15 s; legs are least defended. — [Thinnabut et al. 2024](https://doi.org/10.3390/insects15080602)
- *(design inference)* Each second during FEED, the host dislodges the feeder with probability p_def (highest in the first 10–15 s). Interrupted feeders re-enter APPROACH (raises mechanical transmission). — [Thinnabut et al. 2024](https://doi.org/10.3390/insects15080602)
- *(published)* Blood meal ≈ 1.1–1.3× unfed body mass in most colonised Anopheles (up to ~1.9× in An. cracens). — [Phasomkusolsil et al. 2015](https://doi.org/10.1016/j.actatropica.2015.09.021)
- *(published)* Vampire bats ingest over half their body weight in blood in ~30 min and starve within 3 days without food; food sharing buffers starvation. — [Wilkinson, 'Bat blood donors'](https://science.umd.edu/faculty/wilkinson/Vampire_entry.pdf); [Carter & Wilkinson 2015](https://doi.org/10.1098/rspb.2015.2524)
- *(published)* Vector transmission at the bite: sporozoite-positive bite infects with probability ~0.5; host→mosquito modifier 0.2; infection raises feeding mortality 0.1 → 0.15 and reduces egg batch ×0.8. — [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303)
- *(published)* Larger herds attract more tsetse in total (4× from 1 to 12 cattle) but per-host risk falls; feeding success per fly rises 54% → 71%; adults and oxen take most meals. — [Torr et al. 2007](https://doi.org/10.1111/j.1365-2915.2007.00705.x)
- *(design inference)* Host cost is mostly behavioural: extra locomotion, lost intake, use of poor relief habitat; blood mass is small (≤ 125 g/day in caribou under mass harassment). — [Joly et al. 2020](https://doi.org/10.3390/toxins12050334); [Witter et al. 2012](https://doi.org/10.1111/j.1365-2656.2011.01905.x); [Buck & Weinstein 2020](https://doi.org/10.1098/rsbl.2020.0641)

**Costs:** actor — Risk of being killed by host defence; flight energy; interrupted meals. Target — Blood mass (small); lost foraging time and extra movement (dominant cost); pathogen infection; lower body condition → lower pregnancy (caribou).  
**State changes:** Feeder: FEED → DIGEST (gonotrophic timer ~3 d) → OVIPOSIT → REST; Host: harassment level H updated; foraging rate × (1 − c·H); possible infection state; Vampire bat: starvation timer reset.  
**Link to population dynamics:** Trophic link with tiny per-bite transfer; per-capita biting ~ N_biters/N_hosts weighted to edge and large hosts. Non-consumptive effects (foraging suppression) act as a feeding-rate modifier on hosts and 'can be orders of magnitude stronger than consumptive effects' (Buck & Weinstein 2020). Vector-borne pathogens add an SI-type layer.

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Mosquito flight speed (min / max) | v_min / v_max | 0.4 / 1.5 | m/s | mosquitoes (model; hosts are birds) | [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500) | [V] | Typical 1 m/s |
| CO₂ sensing threshold / saturation | — | 0.2 / 80 | ppm above ambient | mosquitoes (model) | [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500) | [V] | — |
| Crosswind cast leg duration | t_cast | U[0.5, 0.9] | s | mosquitoes (model) | [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500) | [V] | — |
| Mosquito–host contact radius | r_contact | 0.5 | m | mosquitoes (model) | [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500) | [V] | — |
| Host CO₂ release (model) | — | 1680 | ppm/s | bird hosts (model) | [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500) | [V] | — |
| Wind sensing saturation / large-scale wind | — | 0.5 / 0.2 | m/s | model | [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500) | [V] | — |
| Wind that suppresses host-seeking | u_max | 0.8 (strict) to 3–8 (permissive) | m/s | mosquitoes | [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500) | [V] | Reports conflict |
| Host-finding success in 1500 s run (upwind / downwind / crosswind) | — | 4.2 / 6.4 / 26.6 | % | mosquitoes (model) | [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500) | [V] | — |
| Visual detection of hosts | r_visual | 5–15 | m | Aedes | [van Breugel et al. 2015](https://doi.org/10.1016/j.cub.2015.06.046) | [V] | — |
| Perception neighbourhood (landscape ABM) | r_percept | 150 × 150 m (50 m cells) | m | Anopheles | [Gu & Novak 2009](https://doi.org/10.1016/j.trstmh.2009.01.006) | [V] | Trap visual response < 20 m; bait calves detected ~40 m; daily flight 200–400 m (cited empirical notes) |
| Interval between blood meals | T_gono | 2–4 (model 3) | d | female Anopheles | [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303) | [V] | EMOD Days_between_Feeds example 3 [P] |
| Blood meal volume | V_meal | 1–3 | µL | Anopheles | [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303) | [V] | — |
| Blood meal relative to body mass | m_meal/m_body | ≈ 1.1–1.3 (up to ~1.9) | × | colonised Anopheles | [Phasomkusolsil et al. 2015](https://doi.org/10.1016/j.actatropica.2015.09.021) | [V] | Unfed weight : meal volume 0.76–0.88 |
| Human blood index | HBI | 0.95 | fraction | An. gambiae, An. funestus | [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303) | [V] | — |
| Feeding mortality (uninfected / sporozoite-positive) | — | 0.1 / 0.15 | probability | Anopheles | [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303) | [V] | — |
| Infection probabilities: vector→host / host→vector modifier | b / c | ≈ 0.5 / 0.2 | probability | malaria model | [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303) | [V] | — |
| Adult life expectancy / immature period | — | 10 / 4 | d | Anopheles (model) | [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303) | [V] | — |
| Tsetse feeding interval | T_gono | ≈ 3 | d | Glossina | [Merck Veterinary Manual (tsetse)](https://www.merckvetmanual.com/integumentary-system/flies/tsetse-flies) | [P] | Grey source |
| Tabanid feeding duration | t_feed | 2.76 ± 1.77 (1.00–10.25) | min | Tabanidae on beef cattle | [Thinnabut et al. 2024](https://doi.org/10.3390/insects15080602) | [V] | — |
| Tabanid landing rate | λ_land | 6.54 per 30 min per cow (0.22/min) | landings min⁻¹ | Tabanidae on cattle | [Thinnabut et al. 2024](https://doi.org/10.3390/insects15080602) | [V] | Legs 76.35%; body 14.36%; underside 6.25%; y = 4.23·T − 116.09 |
| Tabanid blood meal | V_meal | 20–600 (up to 200 mg in minutes) | µL | Tabanidae | [Thinnabut et al. 2024](https://doi.org/10.3390/insects15080602) | [V] | Background figure quoted from Chvála et al. |
| Host stops defensive response after | — | 10–15 | s | cattle vs tabanids | [Thinnabut et al. 2024](https://doi.org/10.3390/insects15080602) | [V] | — |
| Vampire bat meal and starvation limit | — | > 0.5 body mass in ~30 min; death within 3 d | ×, min, d | Desmodus rotundus | [Wilkinson, 'Bat blood donors'](https://science.umd.edu/faculty/wilkinson/Vampire_entry.pdf) | [P] | Young bats fail ~1 night in 3; adults ~1 in 10 |
| Fly load vs inter-individual spacing | y(X) | y = 0.53 + 0.12·X | flies per horse; X = spacing | feral horses | [Rubenstein & Feinstein 2021](https://doi.org/10.3389/fevo.2021.659570) | [V] | Above 25 km/h wind ~0.33 flies per horse |
| Caribou movement rate range | v | 121–971 | m/h | Western Arctic Herd | [Joly et al. 2020](https://doi.org/10.3390/toxins12050334) | [V] | > 600 m/h only in peak insect season |
| Caribou blood loss to insects | — | ≤ 125 | g/day | caribou | [Joly et al. 2020](https://doi.org/10.3390/toxins12050334) | [V] | — |
| Tsetse visits vs herd size | — | 4× from 1 to 12 cattle; feeding success 54% → 71% | — | tsetse on cattle | [Torr et al. 2007](https://doi.org/10.1111/j.1365-2915.2007.00705.x) | [V] | Herding may cut individual risk by up to 90% |
| Host defence dislodge probability | p_def | — | s⁻¹ | all | — | — | needs calibration |
| Harassment cohesion gain | k | — | — | all | — | — | needs calibration |
| Foraging suppression coefficient | c | — | — | all | — | — | needs calibration; Witter et al. 2012 time budgets not extracted beyond abstract |
| Tsetse odour-attraction distance; leech parameters | — | — | m | all | — | — | needs calibration; not verified |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [Lafferty & Kuris 2002](https://doi.org/10.1016/S0169-5347(02)02615-0); [Carde & Willis 2008](https://doi.org/10.1007/s10886-008-9484-5); [van Breugel et al. 2015](https://doi.org/10.1016/j.cub.2015.06.046); [Cummins et al. 2012](https://doi.org/10.1371/journal.pcbi.1002500); [Gu & Novak 2009](https://doi.org/10.1016/j.trstmh.2009.01.006); [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303); [IDM EMOD documentation](https://docs.idmod.org/projects/emod-malaria/en/latest/vector-model-transmission.html); [Phasomkusolsil et al. 2015](https://doi.org/10.1016/j.actatropica.2015.09.021); [Merck Veterinary Manual (tsetse)](https://www.merckvetmanual.com/integumentary-system/flies/tsetse-flies); [Torr et al. 2007](https://doi.org/10.1111/j.1365-2915.2007.00705.x); [Thinnabut et al. 2024](https://doi.org/10.3390/insects15080602); [Wilkinson, 'Bat blood donors'](https://science.umd.edu/faculty/wilkinson/Vampire_entry.pdf); [Carter & Wilkinson 2015](https://doi.org/10.1098/rspb.2015.2524); [Mooring & Hart 1992](https://ucdavis.pure.elsevier.com/en/publications/animal-grouping-for-protection-from-parasites-selfish-herd-and-en); [Cote & Poulin 1995](https://doi.org/10.1093/beheco/6.2.159); [Rubenstein & Feinstein 2021](https://doi.org/10.3389/fevo.2021.659570); [Joly et al. 2020](https://doi.org/10.3390/toxins12050334); [Witter et al. 2012](https://doi.org/10.1111/j.1365-2656.2011.01905.x); [Buck et al. 2018](https://doi.org/10.1016/j.tree.2018.05.001); [Buck & Weinstein 2020](https://doi.org/10.1098/rsbl.2020.0641)

#### Open issues / needs calibration

- No movement-level ABM of tsetse, vampire bat or leech host location; no tsetse odour distances or meal ratio.
- No ABM coupling flying-insect agents with herd steering.
- No energetic cost per harassment hour.
- No verified grooming-rate parameters.
- Ticks are covered under parasitism (attached typical parasites).

---

<a id="herbivory"></a>

### 7. Herbivory (grazing, browsing, frugivory, algivory)

**id:** `herbivory`  
**Definition:** An animal eats plant, tree or algal tissue, usually without killing the whole producer. Producers are biomass pools or plant agents; each bite removes biomass.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `herbivory_grazing` | Grazing | Feeding on herbaceous biomass or algal films/cells. | +/− | eats RO_0002470, target = plant/alga part |
| `herbivory_browsing` | Browsing | Feeding on woody plants (leaves, shoots). | +/− | eats RO_0002470 |
| `herbivory_frugivory` | Frugivory / granivory | Feeding on fruits or seeds; frugivory links to seed dispersal. | +/− or +/+ | eats RO_0002470 (+ dispersalVectorOf if seeds survive) |
| `herbivory_algivory` | Algivory (reef/aquatic grazers) | Grazing on macroalgae or phytoplankton; reduces seaweed–coral contacts. | +/− | eats RO_0002470 |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `eats` | `eatenBy` | RO_0002470 | RO_0002471 | [V] | default herbivory edge with target guard kingdom ∈ {Plantae, algae} | — |
| `acquiresNutrientsFrom` | `providesNutrientsFor` | RO_0002457 | RO_0002469 | [V] | alternative nutrient framing | — |

**Mangal type:** herbivory  
**Ambiguity notes:**
- No herbivory term exists in RO or GloBI (verified); GloBI records herbivory as eats.
- Grazing, browsing, frugivory are sub-types in the simulator's own namespace.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R).

#### Sign and consumer strategy

- **Actor:** + — **Target:** −
- **Lafferty & Kuris 2002 class:** facultative micropredator (Lafferty & Kuris list deer and pocket gophers: switch between partial consumption and killing depending on victim size; check exact wording of the facultative categories)
- **Kéfi et al. 2012 functional class:** trophic

#### Participants

- **Actors:** animal
- **Targets:** plant, tree, alga
- **Media:** land, water, air (canopy feeders)
- Producers are sessile pools; herbivore agents are mobile.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | Sparse plants: seek/arrive at nearest plant (encounter-limited). Dense plants: slow down and graze in place (processing-limited; lower max speed). Herd species use contagious graze/walk/run switching. | forage (hunger-scaled); satiated/rest suppress | vision / odour; producer biomass field | r_detect_plant | w_seek × hunger × resource quality; speed reduced in rich patches |
| target | none (sessile) | — | — | — | — |

**Steering-matrix derivation:** O[herbivore][producer] = partial biomass transfer (+/−) → S[herbivore][producer] = +w_seek·hunger, implemented as seek toward plant agents or gradient/speed modulation on a biomass field. No reverse row (sessile).

**Steering rules**

- *(published)* Schools slow down in preferred regions and gradient tracking emerges at group level (speed modulation by a local scalar). — [Berdahl et al. 2013](https://doi.org/10.1126/science.1225883)
- *(published)* Grazing sheep alternate slow dispersion with avalanche-like regrouping; three-state graze/walk/run with allelomimetic switching. — [Ginelli et al. 2015](https://doi.org/10.1073/pnas.1503749112)
- *(design inference)* Sparse plants (inter-plant distance ≫ bite reach): intake limited by search, so steer with arrive/seek. Dense plants: intake independent of movement, so drop max speed and graze in place. — [Spalinger & Hobbs 1992](https://doi.org/10.1086/285415)
- *(published)* Nurse-plant grazing protection: G = 1 − μ·(n/p)/(1 + n/p) lowers herbivore feeding success under a nurse canopy. — [Diaz-Sierra et al. 2024](https://doi.org/10.1038/s41598-024-52447-z)

#### Encounter effect

**Contact condition:** Herbivore within bite reach of a plant agent or inside a producer cell.

**Outcome rules**

- *(published)* Maximum bite size ∝ M^0.72; cropping time ≈ 0.015 min/bite independent of mass; processing ∝ M^0.70; maximum intake ∝ M^0.71. — [Shipley et al. 1994](https://doi.org/10.1086/285648)
- *(published)* Process 1 (encounter-limited): I = v_max·w·D/(1 + δ·w·D). Process 3 (processing-limited): I = R_max·S/(S + β). — [Spalinger & Hobbs 1992](https://doi.org/10.1086/285415)
- *(design inference)* Per-tick biomass removed = bite size S(M) × bites per tick (cropping ≈ 0.9 s/bite), capped by plant biomass. — [Shipley et al. 1994](https://doi.org/10.1086/285648)
- *(published)* Sugarscape growback: each cell regrows α per step up to capacity. — [Epstein & Axtell 1996](https://jasss.soc.surrey.ac.uk/12/1/6/appendixB/EpsteinAxtell1996.html)
- *(published)* Herbivores (reef fish) suppress seaweeds and so reduce allelopathic seaweed–coral contacts. — [Rasher & Hay 2010](https://doi.org/10.1073/pnas.0912095107)

**Costs:** actor — Handling/cropping time; exposure to predators while grazing. Target — Biomass loss (partial).  
**State changes:** Producer biomass reduced; Herbivore energy reserve increased by e_plant × biomass; Graze ↔ walk ↔ run state switches by allelomimetic contagion.  
**Link to population dynamics:** ATN producer–consumer flux with assimilation e_plant; producer regrowth (logistic or growback). Terrestrial biomass pyramids: herbivores ~0.98% of producer biomass in Madingley (validation pattern).

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Maximum bite size exponent | S ∝ M^x | 0.72 | — | 12 mammal species, 0.05–547 kg | [Shipley et al. 1994](https://doi.org/10.1086/285648) | [V] | — |
| Cropping time per bite | t_crop | 0.015 | min/bite | mammalian herbivores | [Shipley et al. 1994](https://doi.org/10.1086/285648) | [V] | ≈ 0.9 s |
| Food processing exponent | ∝ M^x | 0.7 | — | mammalian herbivores | [Shipley et al. 1994](https://doi.org/10.1086/285648) | [V] | — |
| Maximum intake exponent | I_max ∝ M^x | 0.71 | — | mammalian herbivores | [Shipley et al. 1994](https://doi.org/10.1086/285648) | [V] | — |
| Spalinger–Hobbs illustrative values | v_max, δ, w, D, R_max, β | 0.5, 0.5, 0.1, 100, 2, 0.5 | model units | illustrative (Fryxell et al.) | [Spalinger & Hobbs 1992](https://doi.org/10.1086/285415) | [P] | — |
| Assimilation efficiency on plants | e_plant | 0.45 | — | ATN default | [Brose et al. 2006](https://doi.org/10.1111/j.1461-0248.2006.00978.x) | [NV] | Recorded from memory |
| Grazing protection under nurse | μ | 0.2–0.9 | — | dryland nurse–protégé model | [Diaz-Sierra et al. 2024](https://doi.org/10.1038/s41598-024-52447-z) | [V] | Grazing rate 0.00047 d⁻¹; β = 0.2–3×10⁻³ m² g⁻¹ |
| Sheep state speeds (graze / walk / run) | v0 / v1 / v2 | 0 / 0.15 / 1.5 | m/s | Merino sheep | [Ginelli et al. 2015](https://doi.org/10.1073/pnas.1503749112) | [V] | τ0→1 = 35 s, τ1→0 = 8 s, α = 15, δ = 4 |
| Herbivore / producer biomass ratio (terrestrial) | — | 0.0098 | fraction | global model output | [Harfoot et al. 2014](https://doi.org/10.1371/journal.pbio.1001841) | [V] | Validation pattern |
| Plant regrowth rate | r or α | — | d⁻¹ | all | — | — | needs calibration; regrowth and compensatory growth not collected |
| Browsing (woody) parameters | — | — | — | all | — | — | needs calibration |
| Detection distance for plants | r_detect_plant | — | m | all | — | — | needs calibration |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R); [Lafferty & Kuris 2002](https://doi.org/10.1016/S0169-5347(02)02615-0); [Shipley et al. 1994](https://doi.org/10.1086/285648); [Spalinger & Hobbs 1992](https://doi.org/10.1086/285415); [Berdahl et al. 2013](https://doi.org/10.1126/science.1225883); [Ginelli et al. 2015](https://doi.org/10.1073/pnas.1503749112); [Diaz-Sierra et al. 2024](https://doi.org/10.1038/s41598-024-52447-z); [Epstein & Axtell 1996](https://jasss.soc.surrey.ac.uk/12/1/6/appendixB/EpsteinAxtell1996.html); [Rasher & Hay 2010](https://doi.org/10.1073/pnas.0912095107); [Brose et al. 2006](https://doi.org/10.1111/j.1461-0248.2006.00978.x); [Harfoot et al. 2014](https://doi.org/10.1371/journal.pbio.1001841)

#### Open issues / needs calibration

- Plant regrowth rates and browsing-specific parameters not collected.
- Shipley allometries cover mammals only; insect and fish herbivore intake not covered.
- Spalinger & Hobbs volume/pages not verified; values are illustrative.

---

<a id="symbiosis"></a>

### 8. Symbiosis (close association: mutualism and commensalism)

**id:** `symbiosis`  
**Definition:** Two organisms live together in more or less intimate association. In the simulator, symbiosis is split by sign into mutualism (+/+) and commensalism (+/0). Facilitation (nurse plants) and cleaning mutualisms are encounter-level variants.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `symbiosis_mutualism` | Mutualism | Both partners benefit; net benefit saturating or unimodal in partner density. | +/+ | mutualistOf RO_0002442 |
| `symbiosis_cleaning` | Cleaning mutualism | Cleaner removes ectoparasites from clients at a station. | +/+ | mutualistOf RO_0002442 (+ eats for parasites removed) |
| `symbiosis_commensalism` | Commensalism | One benefits, the other is unaffected. | +/0 | commensalistOf RO_0002441 |
| `symbiosis_facilitation` | Facilitation (nurse plants) | Nurse biomass improves a shared resource (infiltration) and shelters protégés from grazers; no RO term. | 0/+ or −/+ | no RO term; commensalistOf or interactsWith; Kéfi class recruitment facilitation |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `symbiontOf` | `symbiontOf` | RO_0002440 | RO_0002440 | [V] | generic close association | declared is_symmetric in RO |
| `mutualistOf` | `mutualistOf` | RO_0002442 | RO_0002442 | [V] | mutualism | GloBI self-inverse; not flagged is_symmetric in ro.obo |
| `commensalistOf` | `commensalistOf` | RO_0002441 | RO_0002441 | [V] | commensalism | RO spelling 'commensually interacts with'; not flagged is_symmetric |

**Mangal type:** mutualism / commensalism / symbiosis  
**Ambiguity notes:**
- RO_0002442 and RO_0002441 are not declared symmetric in ro.obo, but GloBI treats them as self-inverse; store direction explicitly for commensalism (beneficiary = actor).
- Helper relations 'is mutualism' RO_0002467 and 'is commensalism' RO_0002466 exist but are flagged 'not for use in curation'.
- RO has no facilitation relation.
- Barnacles on whales are RO's own example for symbiotically interacts with (see epibiosis).

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R).

#### Sign and consumer strategy

- **Actor:** + — **Target:** + (mutualism) / 0 (commensalism)
- **Lafferty & Kuris 2002 class:** not applicable
- **Kéfi et al. 2012 functional class:** recruitment/growth facilitation; refuge provisioning (decreased mortality / reduced attack rate)

#### Participants

- **Actors:** animal, plant, tree, alga
- **Targets:** animal, plant, tree, alga
- **Media:** air, land, water
- Pollination and seed dispersal are mutualisms with their own entries (floral_visitation, dispersal).

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | Mobile mutualist seeks partner (e.g. client fish seek cleaner station; cleaner holds station). Commensal seeks host/structure. | forage or 'needs-service' state (e.g. parasite burden above threshold, design inference) | vision; station location | r_detect_partner | w_seek × need |
| target | Mutualist partner reciprocal attraction or 'pause and align' near station (clients). Commensal host: none. | — | vision | — | — |

**Steering-matrix derivation:** Mutualism +/+ → both S rows positive, each state-gated (need, satiation). Commensalism +/0 → actor row positive, target row 0. Facilitation is field-mediated (no pairwise steering).

**Steering rules**

- *(design inference)* Client agents near a cleaner station pause and align during an inspection of order 5–20 s. — [Grutter 1996](https://www.int-res.com/articles/meps/130/m130p061.pdf)
- *(design inference)* Facilitation acts through fields the nurse modifies (soil moisture/infiltration, shade, grazing refuge); herbivore foraging gain is lowered inside a nurse footprint. — [Diaz-Sierra et al. 2024](https://doi.org/10.1038/s41598-024-52447-z)

#### Encounter effect

**Contact condition:** Within partner contact radius for an inspection/visit duration; facilitation within nurse footprint (field).

**Outcome rules**

- *(published)* Net mutualistic benefit as a function of partner density is likely monotonically saturating or unimodal. — [Holland et al. 2002](https://doi.org/10.1086/338510)
- *(design inference)* Saturating benefit B(P) = B_max·P/(K + P); for pollinating seed-predators and cleaners that also eat mucus, add a faster-rising cost C(P) giving a unimodal net benefit. — [Holland et al. 2002](https://doi.org/10.1086/338510); [Holland & DeAngelis 2001](https://doi.org/10.1007/s004420000542)
- *(published)* Net benefit to the plant is unimodal in pollinator abundance relative to flower abundance (pollinating seed-eaters). — [Holland & DeAngelis 2001](https://doi.org/10.1007/s004420000542)
- *(published)* Mutualistic population model: competition within guilds plus saturating mutualism between guilds; nestedness reduces effective competition. — [Bastolla et al. 2009](https://doi.org/10.1038/nature07950)
- *(published)* Cleaner wrasse removed 0.5 ± 0.05 parasites per inspection and 4.8 ± 0.4 per minute of inspection. — [Grutter 1996](https://www.int-res.com/articles/meps/130/m130p061.pdf)
- *(design inference)* Each inspection removes Bernoulli(≈ 0.5) parasites from the client's burden; cleaner gains energy per parasite eaten. — [Grutter 1996](https://www.int-res.com/articles/meps/130/m130p061.pdf)
- *(published)* Facilitation: infiltration I(n) = (β·n + i0)/(β·n + 1); grazing protection G = 1 − μ·(n/p)/(1 + n/p). — [Diaz-Sierra et al. 2024](https://doi.org/10.1038/s41598-024-52447-z)

**Costs:** actor — Time at station or with partner. Target — Mutualism: possible exploitation cost (unimodal net benefit). Commensalism: none.  
**State changes:** Client parasite burden reduced; Cleaner energy increased; Protégé growth and survival modified under nurse.  
**Link to population dynamics:** Holland et al. 2002 functional-response benefits: partner density multiplies growth via saturating B(P) − C(P). Kéfi et al. 2012 / Miele et al. 2019 non-trophic modifiers: recruitment facilitation (e0) and decreased mortality (p0).

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Cleaner inspection time budget | — | 256 ± 11 | min/day | Labroides dimidiatus | [Grutter 1996](https://www.int-res.com/articles/meps/130/m130p061.pdf) | [V] | Daily activity 12.65 ± 0.04 h |
| Clients inspected per cleaner per day | — | 2,297 ± 83 | fish/day | Labroides dimidiatus | [Grutter 1996](https://www.int-res.com/articles/meps/130/m130p061.pdf) | [V] | — |
| Parasites removed per inspection | — | 0.5 ± 0.05 | parasites | Labroides dimidiatus (gnathiid isopods) | [Grutter 1996](https://www.int-res.com/articles/meps/130/m130p061.pdf) | [V] | 4.8 ± 0.4 per minute; 1,218 ± 118 per day |
| Inspection duration per client visit | t_inspect | ≈ 6.7 (order 5–20) | s | Labroides dimidiatus | [Grutter 1996](https://www.int-res.com/articles/meps/130/m130p061.pdf) | [derived] | 256 min ÷ 2,297 inspections (notes' arithmetic) |
| Mutualism maximum benefit / half-saturation | B_max, K | — | growth units, partner density | all | — | — | needs calibration; form from Holland et al. 2002 |
| Mutualism cost function | C(P) | — | — | all | — | — | needs calibration |
| Recruitment facilitation intensity | e0 | 0.15–1.8 | model units | bioenergetic model | [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269) | [P] | — |
| Decreased mortality intensity | p0 | 5–20 | model units | bioenergetic model | [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269) | [P] | — |
| Refuge provisioning (attack-rate reduction) | r0 | 0.25–1.75 | model units | bioenergetic model | [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269) | [P] | — |
| Nurse infiltration facilitation | β | 0.2–3 ×10⁻³ | m² g⁻¹ | dryland nurse plants | [Diaz-Sierra et al. 2024](https://doi.org/10.1038/s41598-024-52447-z) | [V] | Rainfall 600 mm/yr scenario |
| Maximum grazing protection under nurse | μ | 0.2–0.9 | — | dryland nurse plants | [Diaz-Sierra et al. 2024](https://doi.org/10.1038/s41598-024-52447-z) | [V] | — |
| Foundation-species effect on food webs | — | richness ×2.1; link density ×1.6; connectance ×0.75 | × | 58 food webs, 7 ecosystems | [van der Zee et al. 2018](https://doi.org/10.1371/journal.pone.0199152) | [V] | Validation pattern |
| Facilitation radius | r_nurse | — | m | all | — | — | needs calibration; no sourced value |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R); [Holland et al. 2002](https://doi.org/10.1086/338510); [Holland & DeAngelis 2001](https://doi.org/10.1007/s004420000542); [Bastolla et al. 2009](https://doi.org/10.1038/nature07950); [Grutter 1996](https://www.int-res.com/articles/meps/130/m130p061.pdf); [Diaz-Sierra et al. 2024](https://doi.org/10.1038/s41598-024-52447-z); [Miele et al. 2019](https://doi.org/10.1371/journal.pcbi.1007269); [Kefi et al. 2012](https://doi.org/10.1111/j.1461-0248.2011.01732.x); [van der Zee et al. 2018](https://doi.org/10.1371/journal.pone.0199152)

#### Open issues / needs calibration

- Bshary cleaner–client game parameters (cheating, mucus feeding, client jolts) not extracted.
- Bastolla et al. 2009 parameter values not extracted.
- No nurse-plant facilitation radius.
- Miele et al. 2019 values are [P] (summarising fetch).

---

<a id="nesting"></a>

### 9. Nesting (use of organisms or their structures as nest sites)

**id:** `nesting`  
**Definition:** An animal builds or occupies a nest, cavity, roost or redd in or on a substrate provided by another organism (tree, plant, other animal's structure) or an artificial structure. Substrates are slots with capacity; cavities are persistent objects that limit secondary nesters.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `nesting_cavity_excavation` | Cavity excavation (primary cavity nesters) | Excavators create cavities in trees; ecosystem engineers. | +/0 or +/− (tree damage) | createsHabitatFor RO_0008505 (excavator → secondary nester); hasHabitat RO_0002303 (excavator → tree) |
| `nesting_secondary_cavity` | Secondary cavity nesting | Non-excavators occupy existing cavities (nest webs). | +/0 | hasHabitat RO_0002303 |
| `nesting_collective_choice` | Collective nest-site choice (quorum) | Honeybee swarms and Temnothorax ants choose a site by quality-scaled recruitment and a quorum switch. | +/0 | hasHabitat RO_0002303 |
| `nesting_roost` | Roosting | Resting site use. | +/0 | hasRoost RO_0008509 / roostOf (NO_MATCH); coRoostsWith RO_0002801 |
| `nesting_redd` | Spawning redds (fish nests) | Gravel-area-weighted redd site choice with defended area. | +/0 | hasHabitat RO_0002303 (abiotic substrate; network edge only if a biotic provider) |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `hasHabitat` | `createsHabitatFor` | RO_0002303 | RO_0008505 | [V] | nest user → substrate (hasHabitat); provider → user (createsHabitatFor) | GloBI pairs createsHabitatFor ↔ hasHabitat |
| `hasRoost` | `roostOf` | RO_0008509 | — | [V] | roosting | roostOf is NO_MATCH |
| `inhabits` | `inhabitedBy` | none (NO_MATCH) | — | [V] | GloBI alternative | NO_MATCH |
| `guestOf` | `hasGuestOf` | none (NO_MATCH) | — | [V] | GloBI alternative (nest guests) | NO_MATCH |

**Mangal type:** commensalism (inference)  
**Ambiguity notes:**
- No 'nests in' relation exists in RO or GloBI (verified).
- hasHabitat RO_0002303 means 'y can sustain and allow growth of a population of x' — broader than nesting; flag nest use with a local sub-type.
- rglobi's older type table did not include egg-laying predicates; use the current GloBI source.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java).

#### Sign and consumer strategy

- **Actor:** + — **Target:** 0 (or − if the nest damages the tree)
- **Lafferty & Kuris 2002 class:** not applicable
- **Kéfi et al. 2012 functional class:** habitat provision / refuge provisioning; recruitment facilitation

#### Participants

- **Actors:** animal
- **Targets:** tree, plant, animal (nest builders' structures, host nests), artificial structure
- **Media:** air (arboreal), land, water (redds)
- Artificial Rhino geometry can be a 'habitat provider' node with the same slot schema.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | seek suitable substrates weighted by cue match × quality × free capacity (ideal-free spreading); avoid predators/parasites near sites; scouts wander, evaluate and recruit; quorum switches group to committed movement toward the chosen site (streaker-guided swarm flight). | breeding: prospecting/seekingNest; swarm scouting | vision; social information (heterospecific nest fate); encounter rate at site (ants) | R_p (perception of substrates) | w_s; despotic penalty within defence radius |
| target | none (sessile substrate). Occupant: attend nest (fraction of tick within radius r of nest), defend radius r_d. | attending/incubating | — | r_d | — |

**Steering-matrix derivation:** Nest user → substrate: positive attraction (+/0) gated by breeding state; no reverse row for sessile substrates. Occupant → conspecific prospector inside defence radius: negative (despotic distribution).

**Steering rules**

- *(design inference)* F_substrate = w_s·Σ_j [C_j·q_j·(1 − n_j/K_j)]·unit(x_j − x_i)/d_ij^α over substrates within R_p; add despotic penalty inside defence radius. — [Fretwell & Lucas 1970](https://doi.org/10.1007/BF01601953)
- *(published)* Ideal free distribution: settle where realised fitness is highest; ideal despotic: residents lower suitability for later settlers. — [Fretwell & Lucas 1970](https://doi.org/10.1007/BF01601953)
- *(published)* Pied flycatchers use heterospecific nest fate to avoid predation-linked nest-site features. — [Tolvanen et al. 2018](https://doi.org/10.1186/s12862-018-1301-3)
- *(published)* Daurian redstarts nest nearer buildings to avoid cuckoo parasitism. — [Zhang et al. 2023 (Curr Biol)](https://doi.org/10.1016/j.cub.2023.01.047)
- *(published)* Honeybee swarm site choice: scouts recruit at a rate proportional to site quality; quorum of ~10–15+ bees at a site precedes piping and liftoff. — [Seeley & Visscher 2003](https://bees.ucr.edu/sites/default/files/2020-06/bes54.pdf); [Passino & Seeley 2006](https://doi.org/10.1007/s00265-005-0067-y)
- *(published)* Fewer than 5% of a swarm are informed; streaker scouts fly fast toward the new site. — [Schultz et al. 2008](https://doi.org/10.1242/jeb.018994); [Greggers et al. 2013](https://doi.org/10.1007/s00114-013-1077-7)
- *(published)* Temnothorax ants judge quorum by encounter rate with nestmates at the site and switch from tandem running to carrying (3× faster). — [Pratt 2005](https://ideas.repec.org/a/oup/beheco/v16y2005i2p488-496.html); [Franks et al. 2009](https://doi.org/10.1098/rstb.2008.0224)

#### Encounter effect

**Contact condition:** Agent reaches substrate slot (within slot radius) while in seekingNest state.

**Outcome rules**

- *(design inference)* Acceptance P = σ(β_q·(q_j − θ_i) − β_n·n_j/K_j); individual thresholds θ_i heterogeneous. — [Masuda et al. 2015](https://doi.org/10.1098/rsos.140533)
- *(design inference)* On acceptance: add to occupants, start breeding timers (incubation_d, fledging_age_d); egg-laying 1 egg/day for passerines (inference). — [Myhrvold et al. 2015](https://esapubs.org/archive/ecol/E096/269/metadata.php)
- *(published)* Cavities persist for decades and are reused > 20 times; cavity supply limits secondary-nester density with about a one-year lag. — [Ibarra et al. 2020](https://doi.org/10.5751/ES-11590-250227); [Trzcinski et al. 2022](https://doi.org/10.1111/1365-2656.13626); [Walters 2022](https://doi.org/10.1111/1365-2656.13704)
- *(design inference)* Excavator at a suitable tree spends T_excavate ticks then spawns a cavity whose entrance scales with excavator size; per-year loss = decayRate. — [Ibarra et al. 2020](https://doi.org/10.5751/ES-11590-250227)
- *(published)* inSALMO redd choice: random draw weighted by available spawning gravel area minus area defended by guarding females; daily spawn probability 0.2 (fall-run). — [inSALMO 7 description](https://www.humboldt.edu/sites/default/files/ecological-modeling/2024-09/insalmo-72description2021-05-06.pdf)
- *(design inference)* Survival to recruitment S = S0·g(q)·h(density)·(1 − P_pred(attendance, cover))·(1 − P_parasitised); spawn round(n_eggs·S) juveniles at timer end. — [Myhrvold et al. 2015](https://esapubs.org/archive/ecol/E096/269/metadata.php)

**Costs:** actor — Search time; excavation time; nest defence and attendance (reduced foraging). Target — Tree: possible damage (not quantified); substrate capacity occupied.  
**State changes:** Slot occupancy updated; Breeding FSM: prospecting → building → laying → incubating → provisioning → fledged; Cavity objects created (excavation) and decay.  
**Link to population dynamics:** Recruitment pulse after incubation/fledging timers (Kéfi-style recruitment facilitation); cavity stock is the state variable limiting secondary-nester recruitment with ~1-year lag. Log edges (hasHabitat, createsHabitatFor) to rebuild an emergent nest web (link turnover ~26% per year).

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Cavity reuse count | — | > 20 | uses | nesting vertebrates in living trees | [Ibarra et al. 2020](https://doi.org/10.5751/ES-11590-250227) | [V] | Cavities persist several decades |
| Cavity entrance area range | A_entrance | 3.1–225 | cm² | excavators 12 g (piculet) to 260 g (Magellanic woodpecker) | [Ibarra et al. 2020](https://doi.org/10.5751/ES-11590-250227) | [V] | — |
| Tree-species hubs | — | < 20% of tree species hold > 50% of nests | — | nest webs | [Ibarra et al. 2020](https://doi.org/10.5751/ES-11590-250227) | [V] | — |
| Logging effect | — | 9× fewer cavities, 17× fewer nests | — | selectively logged vs old growth | [Ibarra et al. 2020](https://doi.org/10.5751/ES-11590-250227) | [V] | — |
| Year-to-year link conservation in nest web | — | 0.74 | fraction | British Columbia cavity nesters | [Cockle & Martin 2015](https://doi.org/10.1890/14-1256.1) | [V] | — |
| Honeybee quorum | Q | 10–15 or more | bees at site | Apis mellifera | [Seeley & Visscher 2003](https://bees.ucr.edu/sites/default/files/2020-06/bes54.pdf) | [V] | Swarm ~7,500 workers; several hundred scouts; piping ~1 h before liftoff; discovery to liftoff ~2 h 25 min to 4.5 h |
| Honeybee site preferences | — | height 5 m > 1 m; entrance 12.5 cm² > 75 cm²; volume 40 L > 10 or 100 L; > 300 m from parent colony | — | Apis mellifera | [Seeley & Morse 1978](https://link.springer.com/article/10.1007/BF02224297) | [V] | — |
| Informed fraction of swarm | — | < 0.05 | fraction | Apis mellifera | [Schultz et al. 2008](https://doi.org/10.1242/jeb.018994) | [V] | — |
| Streaker speed / swarm speed | — | up to 1.6 / ~0.33 | m/s | Apis mellifera | [Greggers et al. 2013](https://doi.org/10.1007/s00114-013-1077-7) | [P] | — |
| Ant quorum (model) | Q | 0.5·N | ants | Temnothorax (N = 100 model) | [Masuda et al. 2015](https://doi.org/10.1098/rsos.140533) | [V] | Leakage 0.05; scout fraction ~0.3; rates normalised |
| Quorum detection time | — | ≈ 2 | min | Temnothorax | [Pratt 2005](https://ideas.repec.org/a/oup/beheco/v16y2005i2p488-496.html) | [V] | — |
| Transport vs tandem-run speed | — | 3 | × faster | Temnothorax | [Franks et al. 2009](https://doi.org/10.1098/rstb.2008.0224) | [V] | — |
| Great tit breeding timers | — | clutch 9–11 (EU first clutches); incubation 12–15 d; nestling 16–22 d | eggs, d | Parus major | [Cornell All About Birds (great tit)](https://www.allaboutbirds.org/guide/Great_Tit/lifehistory) | [P] | Non-peer-reviewed |
| Life-history database coverage | — | 9,802 birds, 4,953 mammals, 6,567 reptiles | species | amniotes | [Myhrvold et al. 2015](https://esapubs.org/archive/ecol/E096/269/metadata.php) | [V] | incubation_d, fledging_age_d, clutch size, clutches per year |
| Redd area / defence area | — | 5.6 / 20 | m² | Chinook salmon (inSALMO 7) | [inSALMO 7 description](https://www.humboldt.edu/sites/default/files/ecological-modeling/2024-09/insalmo-72description2021-05-06.pdf) | [V] | Defence area ≈ radius 2.5 m (notes' arithmetic) |
| Daily spawning probability | p_spawn | 0.2 (fall-run); 0.1 (spring-run) | d⁻¹ | Chinook salmon | [inSALMO 7 description](https://www.humboldt.edu/sites/default/files/ecological-modeling/2024-09/insalmo-72description2021-05-06.pdf) | [V] | 5–14 °C, 1 Oct–30 Nov |
| Nest-defence radius / attendance fraction | r_d, f_att | — | m, — | all | — | — | needs calibration; no peer-reviewed values retrieved |
| Acceptance coefficients | β_q, β_n, θ | — | — | all | — | — | needs calibration |
| Excavation time / cavity decay rate | T_excavate, decayRate | — | d, yr⁻¹ | all | — | — | needs calibration |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [Fretwell & Lucas 1970](https://doi.org/10.1007/BF01601953); [Ibarra et al. 2020](https://doi.org/10.5751/ES-11590-250227); [Cockle & Martin 2015](https://doi.org/10.1890/14-1256.1); [Trzcinski et al. 2022](https://doi.org/10.1111/1365-2656.13626); [Walters 2022](https://doi.org/10.1111/1365-2656.13704); [Delhey 2018](https://doi.org/10.1002/ecy.2108); [Seeley & Visscher 2003](https://bees.ucr.edu/sites/default/files/2020-06/bes54.pdf); [Seeley & Morse 1978](https://link.springer.com/article/10.1007/BF02224297); [Passino & Seeley 2006](https://doi.org/10.1007/s00265-005-0067-y); [Pratt et al. 2002](https://pratt.lab.asu.edu/node/100); [Pratt 2005](https://ideas.repec.org/a/oup/beheco/v16y2005i2p488-496.html); [Franks et al. 2009](https://doi.org/10.1098/rstb.2008.0224); [Masuda et al. 2015](https://doi.org/10.1098/rsos.140533); [Schultz et al. 2008](https://doi.org/10.1242/jeb.018994); [Greggers et al. 2013](https://doi.org/10.1007/s00114-013-1077-7); [Myhrvold et al. 2015](https://esapubs.org/archive/ecol/E096/269/metadata.php); [Cornell All About Birds (great tit)](https://www.allaboutbirds.org/guide/Great_Tit/lifehistory); [inSALMO 7 description](https://www.humboldt.edu/sites/default/files/ecological-modeling/2024-09/insalmo-72description2021-05-06.pdf); [Tolvanen et al. 2018](https://doi.org/10.1186/s12862-018-1301-3); [Zhang et al. 2023 (Curr Biol)](https://doi.org/10.1016/j.cub.2023.01.047); [Cowan et al. 2021](https://doi.org/10.1111/brv.12776)

#### Open issues / needs calibration

- No colonial seabird colony-site ABM parameters.
- No nest-defence radius or attendance values.
- Temnothorax absolute rate constants not recovered (only normalised).
- Occupancy/success rates for designed habitat structures not extracted (Cowan et al. 2021: only 39% of 224 studies had controls).

---

<a id="oviposition"></a>

### 10. Oviposition (egg-laying on or in other organisms)

**id:** `oviposition`  
**Definition:** A gravid female lays eggs on the outer surface of another organism (plant, alga, animal) or inside it or its nest. Acceptance depends on substrate quality and the female's egg load; recruitment depends on substrate quality and crowding.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `oviposition_on` | Egg-laying on a host surface | Eggs on host plants or surfaces; target neither helped nor harmed (RO). | +/0 | laysEggsOn RO_0008507 |
| `oviposition_in` | Egg-laying inside a host | Eggs inside plant tissue or an animal (is_a parasite of + visits). | +/− | laysEggsIn RO_0002624 |
| `oviposition_brood_parasitism` | Brood parasitism | Eggs laid in another species' (or conspecific's) nest; host raises the young. | +/− | laysEggsIn RO_0002624 (target = host species); kleptoparasiteOf RO_0008503 alternative |
| `oviposition_skip` | Skip oviposition | Few eggs per site spread across many sites (container mosquitoes). | +/0 | laysEggsOn / laysEggsIn |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `laysEggsOn` | `hasEggsLayedOnBy` | RO_0008507 | RO_0008508 | [V] | eggs on outer surface | RO: target 'neither helped nor harmed'; RO_0008508 is the inverse 'has eggs laid on by', not 'lays eggs in' |
| `laysEggsIn` | `hasEggsLayedInBy` | RO_0002624 | RO_0002625 | [V] | eggs inside host or host nest | is_a parasite of RO_0002444 and visits RO_0002618; no textual RO definition |
| `parasitoidOf` | `hasParasitoid` | RO_0002208 | — | [V] | egg-laying that kills host (see parasitism) | — |

**Mangal type:** commensalism (on) / parasitism (in, brood parasitism) — inference  
**Ambiguity notes:**
- The brief's earlier mapping of RO_0008508 to 'lays eggs in' was wrong; correct ID is RO_0002624.
- GloBI typeOfPath: laysEggsOn and laysEggsIn imply hasHost and visits.
- No RO term for brood parasitism; laysEggsIn is the closest.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java).

#### Sign and consumer strategy

- **Actor:** + — **Target:** 0 (on) / − (in, brood parasitism)
- **Lafferty & Kuris 2002 class:** parasitoid when eggs in an animal kill it (see parasitism); otherwise not applicable
- **Kéfi et al. 2012 functional class:** recruitment modifier (oviposition sets where recruits appear)

#### Participants

- **Actors:** animal (insects, birds, fish, amphibians)
- **Targets:** plant, tree, alga, animal, animal nest
- **Media:** air, land, water, surface
- Abiotic sites (containers, water bodies, asphalt) are substrates but not network edges.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | state-dependent attraction field toward substrates whose cue strength combines chemistry, visual isolation/plant shape and (aquatic insects) horizontal polarisation; brood parasites track host-nest stage and visit when host is absent. | gravid (egg load E > 0) | chemical/olfactory; visual; polarised light; host-nest stage | R_p | w_s × (E/E_max) × cue match |
| target | none (sessile). Brood-parasite host: nest attendance reduces parasitism success. | — | — | — | — |

**Steering-matrix derivation:** Gravid female → substrate species: positive, gated by egg load. Brood parasite → host nest positive when host nest is at laying stage; host → brood parasite negative (rejection/defence; optional).

**Steering rules**

- *(published)* Isolated plants received more butterfly eggs at fine scale (~1 m); the effect was near neutral at 6 m and 36 m scales; larger plants got more eggs. — [Hasenbank & Hartley 2015](https://doi.org/10.1007/s00442-014-3103-7)
- *(published)* Monarch eggs per plant higher on isolated plants and fall with milkweed density and patch size. — [Zalucki & Suzuki 1987](https://images.peabody.yale.edu/lepsoc/jls/1980s/1987/1987-41(1)13-Zalucki.pdf)
- *(published)* Horizontally polarised light attracts water-seeking insects to oviposit on dark, smooth man-made surfaces (ecological traps). — [Szaz et al. 2015](https://doi.org/10.1371/journal.pone.0121194); [Horvath et al. 2008](https://doi.org/10.1007/s00114-008-0425-5)
- *(published)* Cuckoos choose host nests by egg-colour match and lay during the host laying stage. — [Zhang et al. 2023 (Proc R Soc B)](https://doi.org/10.1098/rspb.2022.2094); [Wang et al. 2020](https://doi.org/10.24272/j.issn.2095-8137.2020.021)
- *(published)* Skip oviposition spreads eggs among many sites and drives dispersal. — [Reiter 2007](https://doi.org/10.1089/vbz.2006.0630)
- *(design inference)* Polarised-light attraction can turn dark, glossy designed surfaces in Rhino geometry into ecological traps; flag them. — [Szaz et al. 2015](https://doi.org/10.1371/journal.pone.0121194)

#### Encounter effect

**Contact condition:** Gravid agent reaches substrate (slot radius); brood parasite reaches host nest while host is absent or present (lower success).

**Outcome rules**

- *(published)* Preference–performance holds on average for phytophagous insects; stronger in oligophages. — [Gripenberg et al. 2010](https://doi.org/10.1111/j.1461-0248.2009.01433.x)
- *(published)* As egg load decreases, females become more selective. — [Heimpel et al. 1996](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf)
- *(design inference)* P_accept = σ(β_q·(q_j − θ_i) + β_E·(E_i/E_max) − β_n·n_j/K_j). — [Heimpel et al. 1996](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf); [Masuda et al. 2015](https://doi.org/10.1098/rsos.140533)
- *(published)* Container mosquitoes prefer large containers although preference correlates negatively with pupation; removing preferred containers raises use of others. — [Wong et al. 2012](https://doi.org/10.1371/journal.pntd.0001632)
- *(design inference)* Include density-dependent larval survival in containers/water bodies or the model wrongly rewards preferred, crowded sites. — [Wong et al. 2012](https://doi.org/10.1371/journal.pntd.0001632)
- *(design inference)* Skip oviposition: deposit min(E_i, e_max_per_site) per visit and keep searching while E_i > 0. — [Reiter 2007](https://doi.org/10.1089/vbz.2006.0630)
- *(published)* Cuckoo laying takes 2.56–26.28 s (mean 7.26 s); 0–2 host eggs removed; brood parasites usually lay 1 egg per host nest. — [Wang et al. 2020](https://doi.org/10.24272/j.issn.2095-8137.2020.021); [Soler 2025](https://doi.org/10.1111/brv.70018)
- *(published)* Hosts can reject cuckoo chicks using an innate template mediated by experience of adult cuckoos. — [Noh et al. 2018](https://doi.org/10.1098/rspb.2018.0726)
- *(published)* Oviposition is reduced in sites already holding predators and competitors (priority effects). — [Pintar & Resetarits 2020](https://doi.org/10.1002/ece3.6845)
- *(design inference)* Recruitment: at end of development timer spawn round(n_eggs·S) juveniles at the substrate; S increases with host-plant quality and decreases with density in containers. — [Gripenberg et al. 2010](https://doi.org/10.1111/j.1461-0248.2009.01433.x); [Wong et al. 2012](https://doi.org/10.1371/journal.pntd.0001632)

**Costs:** actor — Search time; egg allocation from reproductive store (Sibly priority). Target — On: none (RO). In / brood parasitism: host recruits replaced or reduced; multiparasitism lowers both parasite and host success.  
**State changes:** Egg load E decreases; Substrate egg cohort {n, t_laid, species} added; Brood-parasitised host nest flagged; host recruits ≈ 0 (eviction) or reduced (nest-sharing).  
**Link to population dynamics:** Recruitment pulse from egg cohorts after development (temperature-dependent for insects; inSALMO egg development coefficients for fish). Kéfi-style recruitment modifier on the target for brood parasitism.

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Parasitoid field egg load range | E | 0–12 | mature eggs | Aphytis aonidiae | [Heimpel et al. 1996](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf) | [V] | Ovipositing females 5.0 ± 0.51; host-feeding females 3.4 ± 0.32 |
| Glanville fritillary clutch | n_clutch | ≈ 150 | eggs | Melitaea cinxia | [Duplouy et al. 2017](https://doi.org/10.7717/peerj.3371) | [V] | — |
| Fecundity loss under 50% food restriction | — | ≈ 25 | % | Melitaea cinxia | [Niitepold 2019](https://doi.org/10.1007/s00442-019-04489-8) | [V] | — |
| Monarch eggs per 100 plants | — | ≈ 0–90 | eggs | Danaus plexippus | [Zalucki & Suzuki 1987](https://images.peabody.yale.edu/lepsoc/jls/1980s/1987/1987-41(1)13-Zalucki.pdf) | [V] | — |
| Scale of resource-dilution effect | — | strong at 1 m; ~neutral at 6–36 m | m | Pieris rapae | [Hasenbank & Hartley 2015](https://doi.org/10.1007/s00442-014-3103-7) | [V] | — |
| Mosquito container preference coefficients | β | large vs small 9.18; unmanaged vs filled 5.33; preference vs pupation −3.37 | regression β | Aedes aegypti (Iquitos) | [Wong et al. 2012](https://doi.org/10.1371/journal.pntd.0001632) | [V] | — |
| Oviposition site saturation (model) | K_site | 5000 | eggs per habitat | Anopheles (landscape ABM) | [Gu & Novak 2009](https://doi.org/10.1016/j.trstmh.2009.01.006) | [V] | — |
| Eggs per oviposition (model) | n_eggs | 100 (real ~80); infected ×0.8 | eggs | Anopheles | [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303) | [V] | — |
| Ovitrap eggs per positive paddle | — | 41.2 baseline; 18.1 with control | eggs | Aedes aegypti (Goiânia) | [Tristao et al. 2025](https://doi.org/10.1371/journal.pntd.0013264) | [V] | — |
| Cuckoo laying duration | t_lay | 2.56–26.28 (mean 7.26 ± 5.02) | s | Cuculus canorus in reed warbler nests | [Wang et al. 2020](https://doi.org/10.24272/j.issn.2095-8137.2020.021) | [V] | 10.67 s host absent; 5.61 s host present |
| Cuckoo stay at nest | t_stay | 2.32–102 (mean 13.33) | s | Cuculus canorus | [Wang et al. 2020](https://doi.org/10.24272/j.issn.2095-8137.2020.021) | [V] | — |
| Cuckoo parasitism rate | — | 34.3–65.5 | % | oriental reed warbler nests | [Wang et al. 2020](https://doi.org/10.24272/j.issn.2095-8137.2020.021) | [V] | Laying 09:11–19:25 (median 16:30) |
| Host eggs removed by cuckoo | — | 0 (27 nests); 1–2 (26 nests) | eggs | Cuculus canorus | [Wang et al. 2020](https://doi.org/10.24272/j.issn.2095-8137.2020.021) | [V] | — |
| Egg-laying duration, non-parasitic birds | — | 20.7–103.7 | min per egg | 19 species review | [Wang et al. 2020](https://doi.org/10.24272/j.issn.2095-8137.2020.021) | [V] | — |
| Fish fecundity (length power law) | fecund-mult, fecund-exp | 690, 0.552 | model units | Chinook salmon | [inSALMO 7 description](https://www.humboldt.edu/sites/default/files/ecological-modeling/2024-09/insalmo-72description2021-05-06.pdf) | [V] | — |
| Egg development coefficients | A, B, C | 0.00190, 0.000500, 0.0000360 | model units | Chinook salmon | [inSALMO 7 description](https://www.humboldt.edu/sites/default/files/ecological-modeling/2024-09/insalmo-72description2021-05-06.pdf) | [V] | Redd high-temp mortality T1 = 23.0, T9 = 17.5 °C |
| Acceptance coefficients | β_q, β_E, β_n, θ | — | — | all | — | — | needs calibration |
| Maximum eggs per site (skip oviposition) | e_max_per_site | — | eggs | all | — | — | needs calibration |
| Brood-parasite host acceptance | a(match) | — | probability | all | — | — | needs calibration |
| Lifetime cuckoo fecundity | — | — | eggs/season | all | — | — | needs calibration; not retrieved |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [Gripenberg et al. 2010](https://doi.org/10.1111/j.1461-0248.2009.01433.x); [Mangel 1987](https://doi.org/10.1007/BF00275885); [Heimpel et al. 1996](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf); [Hasenbank & Hartley 2015](https://doi.org/10.1007/s00442-014-3103-7); [Zalucki & Suzuki 1987](https://images.peabody.yale.edu/lepsoc/jls/1980s/1987/1987-41(1)13-Zalucki.pdf); [Duplouy et al. 2017](https://doi.org/10.7717/peerj.3371); [Niitepold 2019](https://doi.org/10.1007/s00442-019-04489-8); [Wong et al. 2012](https://doi.org/10.1371/journal.pntd.0001632); [Reiter 2007](https://doi.org/10.1089/vbz.2006.0630); [Tristao et al. 2025](https://doi.org/10.1371/journal.pntd.0013264); [Pintar & Resetarits 2020](https://doi.org/10.1002/ece3.6845); [Szaz et al. 2015](https://doi.org/10.1371/journal.pone.0121194); [Horvath et al. 2008](https://doi.org/10.1007/s00114-008-0425-5); [inSALMO 7 description](https://www.humboldt.edu/sites/default/files/ecological-modeling/2024-09/insalmo-72description2021-05-06.pdf); [Wang et al. 2020](https://doi.org/10.24272/j.issn.2095-8137.2020.021); [Zhang et al. 2023 (Proc R Soc B)](https://doi.org/10.1098/rspb.2022.2094); [Soler 2025](https://doi.org/10.1111/brv.70018); [Field et al. 2023](https://doi.org/10.1086/726250); [Noh et al. 2018](https://doi.org/10.1098/rspb.2018.0726); [Gu & Novak 2009](https://doi.org/10.1016/j.trstmh.2009.01.006); [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303); [Outreman & Pierre 2005](https://doi.org/10.1016/j.beproc.2005.04.004); [Masuda et al. 2015](https://doi.org/10.1098/rsos.140533)

#### Open issues / needs calibration

- No mosquito oviposition ABM code with parameters; Skeeter Buster not retrieved.
- Amphibian pond-choice parameters not retrieved.
- No cuckoo or parasitoid spatial ABM code.
- Monarch eggs/female/day not found.

---

<a id="parasitism"></a>

### 11. Parasitism

**id:** `parasitism`  
**Definition:** An organism lives on or in a host and benefits at the host's expense (RO 'parasite of'). Covers typical endo- and ectoparasites, parasitoids (host death required), parasitic castrators, pathogens and trophically transmitted parasites. Most parasites are implicit host-state variables; mobile host-seekers (parasitoids, ticks) can be agents.

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `parasitism_typical` | Typical parasite (endo/ecto) | One host per stage; does not kill; harm intensity-dependent. | +/− | parasiteOf RO_0002444; endoparasiteOf RO_0002634; ectoparasiteOf RO_0002632 |
| `parasitism_tick` | Attached ectoparasite (questing ticks) | Questing ambusher attaches to passing host, rides for days, drops engorged. | +/− | ectoparasiteOf RO_0002632 |
| `parasitism_parasitoid` | Parasitoidism | Kills its host as a normal and required part of development. | +/− (lethal) | parasitoidOf RO_0002208 |
| `parasitism_castrator` | Parasitic castration | Blocks host reproduction; host stays alive. | +/− | parasiteOf RO_0002444 |
| `parasitism_trophic_transmission` | Trophically transmitted parasite / host manipulation | Needs the host to be eaten by the next host; may raise host conspicuousness. | +/− | parasiteOf; endoparasiteOf |
| `parasitism_pathogen` | Pathogen / vector-borne pathogen | Reproduces in host; transmission by contact or by a vector. | +/− | pathogenOf RO_0002556; vectorOf RO_0002459 |
| `parasitism_hyper_klepto` | Hyperparasitism and plant parasitism | Parasites of parasites; hemiparasitic and root-parasitic plants. | +/− | hyperparasiteOf RO_0002553; hemiparasiteOf RO_0002237; rootparasiteOf RO_0002236 |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `parasiteOf` | `hasParasite` | RO_0002444 | RO_0002445 | [V] | generic parasitism | RO inverse label 'parasitized by' |
| `endoparasiteOf` | `hasEndoparasite` | RO_0002634 | — | [V] | endoparasites | — |
| `ectoparasiteOf` | `hasEctoparasite` | RO_0002632 | RO_0002633 | [V] | ectoparasites incl. ticks | — |
| `parasitoidOf` | `hasParasitoid` | RO_0002208 | — | [V] | parasitoids | RO: 'a parasite that kills or sterilizes its host' |
| `hyperparasiteOf` | `—` | RO_0002553 | — | [V] | hyperparasites | — |
| `hemiparasiteOf / rootparasiteOf` | `—` | RO_0002237 / RO_0002236 | — | [V] | parasitic plants | — |
| `hasHost` | `hostOf` | RO_0002454 | RO_0002453 | [V] | host frame | — |
| `pathogenOf` | `—` | RO_0002556 | — | [P] | pathogens | From 2022 archived subset listing |
| `vectorOf` | `hasVector` | RO_0002459 | RO_0002460 | [V] | vectors of pathogens | Shared with dispersal vectors |
| `endoparasitoidOf / ectoParasitoid` | `—` | none (NO_MATCH) | — | [V] | GloBI-only labels | NO_MATCH |

**Mangal type:** parasitism  
**Ambiguity notes:**
- kills, hostOf and isVectorFor have no RO textual definition.
- GloBI endoparasitoidOf and ectoParasitoid (sic) carry no RO IRI.
- mesoparasite of (RO_0002636) appears in the 2022 subset listing; not re-checked in the 2026 release.
- No RO term for micropredator; see hematophagy for brief-visit blood feeders.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java).

#### Sign and consumer strategy

- **Actor:** + — **Target:** −
- **Lafferty & Kuris 2002 class:** typical parasite; parasitoid; parasitic castrator; pathogen; trophically transmitted typical parasite / pathogen / castrator
- **Kéfi et al. 2012 functional class:** trophic + mortality modifier; reproduction modifier (castrators); predation-vulnerability modifier (manipulation)

#### Participants

- **Actors:** animal, plant (hemi/root parasites), implicit pathogen
- **Targets:** animal, plant, tree
- **Media:** air, land, water
- Parasite biomass can exceed top-predator biomass in estuaries (Kuris et al. 2008), so book a per-host parasite biomass pool in the energy budget.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | Parasitoid: correlated random walk plus chemotaxis up a host-emitted kairomone field; scale of movement depends on internal state. Tick: stationary questing (no steering); attached ticks ride with host (position slaved). | searching (parasitoid, egg load > 0); questing / attached / engorged (ticks) | kairomone field (parasitoids); contact (ticks) | r_detect (parasitoid; not sourced) | w_chemotaxis |
| target | Hosts avoid infection risk ('landscape of disgust'): optional separation boost from infected conspecifics; group effects (contagious parasites rise with group size, mobile parasites fall). Parasitized hosts keep moving; manipulated hosts become more conspicuous. | any; parasitized | vision / chemical | — | w_sep_infected |

**Steering-matrix derivation:** Parasitoid → host: positive (+/−), gated by egg load, via kairomone gradient (field term, not pairwise). Host → parasitoid: optional negative. Implicit parasites: no steering rows; their effect is a host-state modifier (speed, conspicuousness, vulnerability).

**Steering rules**

- *(published)* Parasitoids search randomly or by chemotaxis up a host-emitted kairomone; kairomone diffusion, search strategy and host growth control patchiness and stability. — [Schofield et al. 2002](https://doi.org/10.1006/jtbi.2001.2418)
- *(published)* Limited local dispersal of hosts and parasitoids gives spiral waves, spatial chaos and persistence. — [Hassell et al. 1991](https://doi.org/10.1038/353255a0)
- *(published)* Non-consumptive effects of parasite avoidance may overshadow consumptive effects. — [Buck et al. 2018](https://doi.org/10.1016/j.tree.2018.05.001); [Buck & Weinstein 2020](https://doi.org/10.1098/rsbl.2020.0641)
- *(published)* Uninfected snails grouped with an infected snail changed behaviour (avoidance of infected conspecifics). — [Salerno et al. 2023](https://doi.org/10.1111/1365-2656.13891)
- *(published)* Contagious-parasite prevalence and intensity increase with host group size; mobile-parasite intensity decreases. — [Cote & Poulin 1995](https://doi.org/10.1093/beheco/6.2.159)
- *(published)* Bold, exploratory hosts with larger ranges tend to carry more ticks; ~20% of hosts carry ~80% of transmission potential. — [Tardy et al. 2022](https://doi.org/10.1098/rsos.220245)

#### Encounter effect

**Contact condition:** Parasitoid within contact of an unparasitized (or parasitized, if no discrimination) host; tick: host passes questing cell; contagious pathogen: hosts within contact radius r_c.

**Outcome rules**

- *(published)* Lafferty & Kuris dichotomies define the link: victims per stage, fitness eliminated, host death required, intensity dependence. — [Lafferty & Kuris 2002](https://doi.org/10.1016/S0169-5347(02)02615-0)
- *(design inference)* Link attributes {strategy, victimsPerStage, lethal ∈ {none, required, castrates}, intensityDependent, trophicTransmission, vectorOf} make predation, micropredation, parasitoidism, castration and typical parasitism parameter settings of one consumer-contact behaviour. — [Lafferty & Kuris 2002](https://doi.org/10.1016/S0169-5347(02)02615-0)
- *(published)* Parasitoid acceptance depends on egg load and host size; host discrimination costs inspection time and may not pay when host defences are costly. — [Heimpel et al. 1996](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf); [Outreman & Pierre 2005](https://doi.org/10.1016/j.beproc.2005.04.004)
- *(design inference)* Parasitoid oviposits → host state 'parasitized' with countdown; host keeps moving/feeding (possibly reduced); at countdown end host dies and ≥ 1 parasitoid emerges at its position. — [Lafferty & Kuris 2002](https://doi.org/10.1016/S0169-5347(02)02615-0); [Schofield et al. 2002](https://doi.org/10.1006/jtbi.2001.2418)
- *(published)* Ticks: daily step; questing → attached → engorged/detached; engorged ticks drop at end of step; grooming = density-dependent on-host larval mortality. — [Tardy et al. 2022](https://doi.org/10.1098/rsos.220245)
- *(published)* Tick development as temperature-dependent delays; temperature affects host-finding success. — [Ogden et al. 2005](https://doi.org/10.1016/j.ijpara.2004.12.013)
- *(design inference)* Typical parasite burden as host state; cost intake or speed × (1 − a·burden). Castrator: host reproduction = 0. — [Lafferty & Kuris 2002](https://doi.org/10.1016/S0169-5347(02)02615-0)
- *(published)* Manipulated killifish show ~4× more conspicuous behaviour and are 10–30× more likely to be eaten by bird final hosts; experimental infections 1.8× and 2.5× rises. — [Lafferty & Morris 1996](https://doi.org/10.2307/2265536); [Weinersmith et al. 2023](https://doi.org/10.1645/23-35)
- *(design inference)* Contagious pathogen: per-step transmission probability between agents within r_c; optional separation boost from infected neighbours. — [Cote & Poulin 1995](https://doi.org/10.1093/beheco/6.2.159); [Buck et al. 2018](https://doi.org/10.1016/j.tree.2018.05.001)
- *(published)* Adding parasites raises link density and connectance, especially via concomitant links (predators eating parasites inside prey). — [Dunne et al. 2013](https://doi.org/10.1371/journal.pbio.1001579)

**Costs:** actor — Parasitoid inspection time; tick mortality from grooming. Target — Energy drain (intensity-dependent); death (parasitoid); zero reproduction (castrator); higher predation risk (manipulation); avoidance costs.  
**State changes:** Host: parasitized flag + countdown / burden / infected status; Tick: questing → attached (rides host) → engorged → drops at host position (host disperses ticks); Parasitoid: egg load − n.  
**Link to population dynamics:** Nicholson–Bailey-type host–parasitoid lag reproduced by countdown emergence; spatial waves with local dispersal (Hassell et al. 1991). Trophic + mortality modifier in the network; vulnerability multiplier links parasites to predation (concomitant predation). Book parasite biomass per host.

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Tick host-finding rate (questing nymphs / adults) | p_find | ≈ 0.006 / ≈ 0.009 | d⁻¹ | Ixodes (model sensitivity thresholds) | [Tardy et al. 2022](https://doi.org/10.1098/rsos.220245) | [V] | Thresholds for high infected burdens; notes suggest calibrating 0.004–0.009 |
| Host-to-larva transmission threshold | β_h→l | ≈ 0.75 | probability | tick-borne pathogen (model) | [Tardy et al. 2022](https://doi.org/10.1098/rsos.220245) | [V] | — |
| Larvae fed to repletion on mice / killed by alternative hosts | — | ~50% fed / 83–96% killed | % | mice vs squirrels | [Tardy et al. 2022](https://doi.org/10.1098/rsos.220245) | [V] | — |
| Tick attachment durations (larva / nymph / adult female) | t_attach | 3–5 / 3–4 / 5–7 | d | Ixodes scapularis | [Patnaude & Mather (UF/IFAS)](https://ask.ifas.ufl.edu/publication/IN300) | [P] | Extension fact sheet |
| Tick landscape | — | 50 × 50 cells of 100 m; daily step | — | tick ABM | [Tardy et al. 2022](https://doi.org/10.1098/rsos.220245) | [V] | — |
| Manipulated-host conspicuousness multiplier | — | ≈ 4 (natural); 1.8–2.5 (experimental) | × | Fundulus parvipinnis / trematodes | [Lafferty & Morris 1996](https://doi.org/10.2307/2265536); [Weinersmith et al. 2023](https://doi.org/10.1645/23-35) | [P] | Natural value via 2023 summary [P]; experimental [V] |
| Manipulated-host predation multiplier | — | 10–30 | × | killifish eaten by birds | [Lafferty & Morris 1996](https://doi.org/10.2307/2265536) | [P] | — |
| Pathogen in vector: feeding mortality and egg-batch modifiers | — | 0.1 → 0.15; ×0.8 | — | malaria mosquitoes | [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303) | [V] | See hematophagy |
| Parasitoid egg load range | E | 0–12 | eggs | Aphytis aonidiae | [Heimpel et al. 1996](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf) | [V] | — |
| Host size used for oviposition vs feeding | — | 1.5 ± 0.12 vs 1.0 ± 0.11 | mm² | Aphytis aonidiae | [Heimpel et al. 1996](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf) | [V] | — |
| Parasitoid perception radius / handling time | r_detect, h | — | m, s | all | — | — | needs calibration; not verified |
| Parasitoid development countdown | t_dev | — | d | all | — | — | needs calibration |
| Intensity-dependent cost coefficient | a | — | per parasite | all | — | — | needs calibration |
| Contact transmission probability | β_c | — | per step | all | — | — | needs calibration |
| Kairomone diffusion / decay | D, λ | — | m² s⁻¹, s⁻¹ | all | — | — | needs calibration |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [RO interaction subset (2022 snapshot)](https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/purl.obolibrary.org/obo--ro--subsets--ro-interaction--owl/2022.05.24-071843/obo--ro--subsets--ro-interaction--owl_type=generatedDocu.html); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [Lafferty & Kuris 2002](https://doi.org/10.1016/S0169-5347(02)02615-0); [Buck et al. 2018](https://doi.org/10.1016/j.tree.2018.05.001); [Buck & Weinstein 2020](https://doi.org/10.1098/rsbl.2020.0641); [Salerno et al. 2023](https://doi.org/10.1111/1365-2656.13891); [Cote & Poulin 1995](https://doi.org/10.1093/beheco/6.2.159); [Tardy et al. 2022](https://doi.org/10.1098/rsos.220245); [Ogden et al. 2005](https://doi.org/10.1016/j.ijpara.2004.12.013); [Patnaude & Mather (UF/IFAS)](https://ask.ifas.ufl.edu/publication/IN300); [Hassell et al. 1991](https://doi.org/10.1038/353255a0); [Schofield et al. 2002](https://doi.org/10.1006/jtbi.2001.2418); [Kuris et al. 2008](https://doi.org/10.1038/nature06970); [Dunne et al. 2013](https://doi.org/10.1371/journal.pbio.1001579); [Lafferty & Morris 1996](https://doi.org/10.2307/2265536); [Weinersmith et al. 2023](https://doi.org/10.1645/23-35); [Heimpel et al. 1996](https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf); [Outreman & Pierre 2005](https://doi.org/10.1016/j.beproc.2005.04.004); [Eckhoff 2011](https://doi.org/10.1186/1475-2875-10-303)

#### Open issues / needs calibration

- No numeric parasitoid search parameters (perception radius, handling time).
- No spatially explicit IBM coupling boids herd movement with contact-based macroparasite transmission.
- No agent-level model of parasites altering host movement (only predation risk).
- No verified tick engorgement mass multiplier or questing height.

---

<a id="floral-visitation"></a>

### 12. Floral visitation

**id:** `floral_visitation`  
**Definition:** An animal visits flowers and takes nectar and/or pollen. A visit is the encounter; pollination is a conditional outcome gated by conspecific pollen transfer. Nectar or pollen consumption without pollination is robbery (+/−).

**Variants**

| id | Variant | Definition | Sign | Vocabulary |
|---|---|---|---|---|
| `floral_pollination` | Pollination | Visit transfers conspecific pollen; plant gains seed set; visitor gains reward. | +/+ | pollinates RO_0002455 / pollinatedBy RO_0002456 |
| `floral_nectar_consumption` | Nectar consumption (incl. nectar robbing) | Visitor extracts nectar; if no pollen transfer, plant pays reward cost only. | +/− (robbing) or +/+ (with pollination) | visitsFlowersOf RO_0002622 + eats RO_0002470; no nectar-robbing term |
| `floral_pollen_consumption` | Pollen consumption | Visitor eats pollen (pollen loss to plant); may still pollinate. | +/− or +/+ | visitsFlowersOf RO_0002622 + eats RO_0002470 |

#### Vocabulary

| GloBI label | GloBI inverse | RO ID | RO inverse | Status | Use | Note |
|---|---|---|---|---|---|---|
| `visitsFlowersOf` | `flowersVisitedBy` | RO_0002622 | RO_0002623 | [V] | every flower visit (encounter type) | is_a visits RO_0002618; no textual RO definition |
| `pollinates` | `pollinatedBy` | RO_0002455 | RO_0002456 | [V] | conditional outcome when pollen is transferred | is_a mutualistically interacts with RO_0002442; no textual definition |
| `eats` | `eatenBy` | RO_0002470 | RO_0002471 | [V] | nectar or pollen consumption | — |

**Mangal type:** mutualism (pollination); herbivory or parasitism for robbing (inference)  
**Ambiguity notes:**
- No nectar-robbing, nectarivory or pollen-feeding term exists in RO or GloBI (verified absent).
- GloBI typeOfPath: pollinates implies visitsFlowersOf, hasHost and symbiontOf, so pollination records also appear as visits.
- Web of Life provides 172 plant–pollinator networks typed at network level.

Term sources: [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java).

#### Sign and consumer strategy

- **Actor:** + — **Target:** + (pollination) / − (robbing, pollen loss) / ? (visit without known outcome)
- **Lafferty & Kuris 2002 class:** not applicable
- **Kéfi et al. 2012 functional class:** mutualistic layer; recruitment (seed set) modifier

#### Participants

- **Actors:** animal (insects, birds, bats)
- **Targets:** plant, tree
- **Media:** air, land
- Flowers are reward pools on plant agents or cells.

#### Steering effect

| Role | Behaviour | Activating state | Perception channel | Radius | Weight |
|---|---|---|---|---|---|
| actor | seek flowering plants weighted by adaptive foraging effort α_ij; leave a patch when intake falls to the habitat average (marginal value theorem); central-place trips from nest (bees). | forage (energy deficit or colony demand) | vision / odour of flowers | r_detect_flower; foraging range from nest | w_seek × α_ij |
| target | none (sessile) | — | — | — | — |

**Steering-matrix derivation:** O[visitor][plant] = reward removed (+ for visitor) and pollination probability σ (+ for plant). S[visitor][plant] = +α_ij (adaptive effort) — Valdovinos adaptive foraging maps directly onto seek weights. No reverse row (sessile).

**Steering rules**

- *(published)* Adaptive foraging: dα_ij/dt = G_j·α_ij·(c_j·τ_ij·b_ij·R_i − Σ_k α_kj·c_j·τ_kj·b_kj·R_k); without adaptation α = 1/(number of plants visited). — [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024)
- *(published)* Pollinators reallocating effort toward rewarding plants maintain network diversity. — [Valdovinos et al. 2013](https://www.jstor.org/stable/41937740)
- *(published)* Patch leaving at the marginal value theorem threshold (instantaneous intake = habitat average). — Charnov 1976
- *(published)* Bumblebee trip duration = flight distance / velocity + handling time; handling = (access + inter-flower travel)/patch filling + ingestion, × flowers per load, capped. — [BEE-STEWARD 2025](https://doi.org/10.1002/ece3.71468)

#### Encounter effect

**Contact condition:** Visitor within flower-handling radius for handling time.

**Outcome rules**

- *(published)* Visitation V_ij = α_ij·τ_j·a_j·p_i; visit quality σ_ij = V_ij/Σ_k V_kj (fraction of conspecific pollen). — [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024)
- *(published)* Floral rewards dR_i/dt = β_i·p_i − φ_i·R_i − Σ V_ij·b_ij·R_i/p_i (refill saturates at β/φ). — [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024)
- *(design inference)* Each visit removes b·R nectar (b ≈ 0.4); visit is a pollination with probability σ, raised by flower constancy; robbing visits (no pollen contact) remove reward only. — [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024)
- *(published)* Net benefit to plants of pollinating seed-eaters is unimodal in pollinator/flower ratio. — [Holland & DeAngelis 2001](https://doi.org/10.1007/s004420000542)
- *(design inference)* Pollen consumption: visitor removes a pollen fraction (cost to plant); pollination test still applies.

**Costs:** actor — Handling and flight time; energy per trip. Target — Reward production; nectar/pollen lost; benefit only if pollinated.  
**State changes:** Flower reward R reduced; Visitor energy/crop load increased; Visitor carries pollen type (constancy) for the next visit; Plant seed-set counter incremented on pollination.  
**Link to population dynamics:** Seeds per pollination event e feed plant recruitment (maximum seed recruitment fraction g); reward → pollinator birth conversion c. Mutualistic layer in multiplex networks.

#### Parameters

| Name | Symbol | Default | Units | Taxon | Source | Ver. | Notes |
|---|---|---|---|---|---|---|---|
| Visitation efficiency | τ | 1 | model units | plant–pollinator model (mean) | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Seeds per pollination event | e | 0.8 | model units | plant–pollinator model | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Plant / pollinator mortality | μ_P / μ_A | 0.001 / 0.001 | model units | plant–pollinator model | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Reward→birth conversion | c | 0.2 | model units | plant–pollinator model | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Extraction efficiency per visit | b | 0.4 | fraction of R | plant–pollinator model | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Maximum seed recruitment fraction | g | 0.4 | fraction | plant–pollinator model | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Inter- / intraspecific plant competition | u / w | 0.06 / 1.2 | model units | plant–pollinator model | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Reward production / self-limitation | β / φ | 0.2 / 0.04 | model units | plant–pollinator model | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Adaptation rate | G | 2 | model units | plant–pollinator model | [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024) | [V] | — |
| Bumblebee body mass (Harder) | m_bee | 0.195 | g | Bombus | [BEE-STEWARD 2025](https://doi.org/10.1002/ece3.71468) | [V] | Glossa length 6.9–11.1 mm |
| Fixed handling time per trip tested | — | 112.5–3600 | s | Bombus (model) | [BEE-STEWARD 2025](https://doi.org/10.1002/ece3.71468) | [V] | Trips < 300 s treated as orientation flights |
| Empirical nectar trip durations | t_trip | 18–52 (Ings); 66–82 (Westphal); 45 (MacKenzie); 57–75 (Spaethe & Weidenmüller) | min | Bombus | [BEE-STEWARD 2025](https://doi.org/10.1002/ece3.71468) | [V] | — |
| Per-flower handling time | t_handle | — | s | all | — | — | needs calibration; not verified |
| Inter-flower flight distance | d_flower | — | m | all | — | — | needs calibration |
| Nectar secretion rate | — | — | µL d⁻¹ | all | — | — | needs calibration |
| Pollen removed / deposited per visit; carryover | — | — | grains | all | — | — | needs calibration |
| Foraging range from nest | R_forage | — | m | all | — | — | needs calibration; Osborne et al. 1999 distances not extracted |

#### Sources

[RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024); [Valdovinos et al. 2013](https://www.jstor.org/stable/41937740); [BEE-STEWARD 2025](https://doi.org/10.1002/ece3.71468); Charnov 1976; [Osborne et al. 1999](https://doi.org/10.1046/j.1365-2664.1999.00428.x); [Holland & DeAngelis 2001](https://doi.org/10.1007/s004420000542); [Holland et al. 2002](https://doi.org/10.1086/338510)

#### Open issues / needs calibration

- Per-flower handling time, inter-flower distance, nectar secretion, pollen removal/deposition not verified (Heinrich, Harder, Waser, Cresswell not retrieved).
- Valdovinos parameters are dimensionless model means; rescale to simulation units.
- Charnov 1976 citation [NV].
- Pollen carryover not covered in the notes.

---

## Loading interaction data from GloBI

- Query GloBI by interaction label (the 'interactionType' names in the vocabulary tables, e.g. preysOn, visitsFlowersOf, laysEggsOn, ectoparasiteOf), not only by RO IRI: aggressorOf, dispersalVectorOf, livesOn, roostOf, inhabits and guestOf have no RO IRI (NO_MATCH), so an IRI-only filter silently drops them. GloBI is accessible from R via rglobi (get_interaction_types) and through its API (api.globalbioticinteractions.org/interactionTypes; the live API was not reachable during research, so checks used the source code).
- GloBI's internal hierarchy means one record can surface under a broader type: preysOn ⊂ eats, kills, interactsWith; pollinates ⊂ visitsFlowersOf, hasHost, symbiontOf; laysEggsOn/laysEggsIn ⊂ hasHost, visits; dispersalVectorOf ⊂ hostOf, symbiontOf, vectorOf; ectoparasiteOf ⊂ parasiteOf, livesOn, eats, damages, hasHost. De-duplicate by (source taxon, target taxon, study) and keep the most specific label.
- vectorOf / hasVector ambiguity: GloBI maps EOL 'DispersalVector' / 'HasDispersalVector' records to RO_0002459 / RO_0002460, the same IRIs used for pathogen vectors. On import, classify a vectorOf edge as dispersal when the target is a plant (kingdom Plantae) and as disease vectoring when the target is a pathogen (virus, bacterium, protist) or the record carries a host; otherwise flag for review.
- Missing RO terms: herbivory (use eats + target guard kingdom ∈ {Plantae, algae}), hematophagy (ectoparasiteOf for attached feeders, eats/visits/hasHost for brief visitors, plus local strategy flag 'micropredator'), aggression and competition (aggressorOf, NO_MATCH; Mangal 'competition'), nesting (hasHabitat / createsHabitatFor / hasRoost as nearest), dispersal (dispersalVectorOf, NO_MATCH), animal epibiosis and phoresy (livesOn NO_MATCH, symbiontOf, commensalistOf), nectar robbing (visitsFlowersOf + eats). Store each edge as {globi_label (always present), ro_iri (nullable), ro_broader (e.g. RO_0002437), local_subtype, sign}.
- Allelopathy sign: allelopathOf (RO_0002555) covers both positive and negative effects; GloBI records carry no sign. Set sign from the source study or default to 'unknown' and require user input.
- Mangal (rmangal::search_interactions) uses a flat sign-based 'type' (competition, amensalism, neutralism, commensalism, mutualism, parasitism, predation, herbivory, symbiosis, scavenger, detritivore, unspecified); use it as a coarse sign class next to the GloBI label. Web of Life provides network-level adjacency matrices (e.g. 172 plant–pollinator networks).
- Records are presence-only links. They can mask the outcome matrix (allowed links), but interaction strengths and steering weights must come from the parameters in this schema or calibration. Where species lack records, a trait-based fallback (size-ratio kernel, R_opt = 100, γ = 2) supplies a defensible link set.

Sources: [GloBI InteractType.java](https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java); [RO release 2026-09-04](https://github.com/oborel/obo-relations/blob/master/ro.obo); [rmangal search_interactions.R](https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R); [Poelen et al. 2014](https://doi.org/10.1016/j.ecoinf.2014.08.005); [Valdovinos 2025](https://doi.org/10.1093/icb/icaf024); [Gauzens et al. 2023 (ATNr)](https://doi.org/10.1111/2041-210X.14212).

## References

Only sources cited in this schema. Tags: [V] verified, [P] partly verified, [NV] not verified (see Conventions).

- **Anderson et al. 2011.** Anderson, Nuttle, Saldana Rojas, Pendergast & Flecker (2011). Proc R Soc B 278(1723): 3329-3335 (seed dispersal by Colossoma macropomum). https://doi.org/10.1098/rspb.2011.0155 [V]
- **Angelani 2012.** Angelani, L. (2012). Collective predation and escape strategies. Physical Review Letters 109(11): 118104. https://doi.org/10.1103/PhysRevLett.109.118104 [V]
- **Bais et al. 2010.** Bais, Venkatachalam & Biedrzycki (2010). Plant Signaling & Behavior 5(3): 239-246 (failure to reproduce catechin hormesis). https://doi.org/10.4161/psb.5.3.10573 [V]
- **Barrios-O'Neill et al. 2016.** Barrios-O'Neill et al. (2016). Ecology Letters 19: 668-678 (context dependence of capture-rate scaling). https://doi.org/10.1111/ele.12605 [P] — PDF: https://redpath-staff.mcgill.ca/ricciardi/Barrios-ONeill_etal2016.pdf
- **Bartel et al. 2018.** Bartel et al. (2018). PeerJ 6: e4811 (New Zealand mallard seed dispersal). https://doi.org/10.7717/peerj.4811 [P]
- **Bartlow & Agosta 2021.** Bartlow, A.W. & Agosta, S.J. (2021). Phoresy in animals: review and synthesis of a common but understudied mode of dispersal. Biological Reviews 96(1): 223-246. https://doi.org/10.1111/brv.12654 [V]
- **Baruffaldi et al. 2023.** Baruffaldi, M., Rubini, S., Ignoto, S., Angelini, V. & Tiralongo, F. (2023). Learning from Caretta caretta epibionts: a study from the Adriatic Sea. Frontiers in Marine Science 10: 1243153. https://doi.org/10.3389/fmars.2023.1243153 [V]
- **Bastolla et al. 2009.** Bastolla, U., Fortuna, M.A., Pascual-Garcia, A., et al. (2009). The architecture of mutualistic networks minimizes competition and increases biodiversity. Nature 458: 1018-1020. https://doi.org/10.1038/nature07950 [V] — Abstract verified; parameter values not extracted.
- **Bazazi et al. 2008.** Bazazi, S., Buhl, J., Hale, J.J., et al. (2008). Collective motion and cannibalism in locust migratory bands. Current Biology 18(10): 735-739. https://doi.org/10.1016/j.cub.2008.04.035 [V]
- **Bazazi et al. 2010.** Bazazi, S., Ioannou, C.C., Simpson, S.J., et al. (2010). The social context of cannibalism in migratory bands of the Mormon cricket. PLoS ONE 5(12): e15118. https://doi.org/10.1371/journal.pone.0015118 [V]
- **BEE-STEWARD 2025.** Expanding the scope of the bumblebee model BEE-STEWARD: a simple foraging module facilitates the parameterization. Ecology and Evolution (2025). PMID 40416760. https://doi.org/10.1002/ece3.71468 [V] — Numbers verified; author list not captured in notes.
- **Belz 2008.** Belz, R.G. (2008). Stimulation versus inhibition - bioactivity of parthenin, a phytochemical from Parthenium hysterophorus L. Dose-Response 6(1): 80-96. https://doi.org/10.2203/dose-response.07-007.Belz [V]
- **Belz et al. 2005.** Belz, R.G., Hurle, K. & Duke, S.O. (2005). Dose-response - a challenge for allelopathy? Nonlinearity in Biology, Toxicology, Medicine 3(2): 173-211. https://doi.org/10.2201/nonlin.003.02.002 [V]
- **Berdahl et al. 2013.** Berdahl, A., Torney, C.J., Ioannou, C.C., Faria, J.J. & Couzin, I.D. (2013). Emergent sensing of complex environments by mobile animal groups. Science 339(6119): 574-576. https://doi.org/10.1126/science.1225883 [V]
- **Brain & Cousens 1989.** Brain, P. & Cousens, R. (1989). An equation to describe dose responses where there is stimulation of growth at low doses. Weed Research 29: 93-96. https://doseresponse.github.io/drc/reference/braincousens.html [P] — Citation as given in drc docs; DOI not checked.
- **Broom & Ruxton 1998.** Broom & Ruxton (1998). Evolutionarily stable stealing: game theory applied to kleptoparasitism. Behavioral Ecology 9(4): 397-403. https://www.vliz.be/imisdocs/publications/ocrd/133703.pdf [P] — Threshold reconstructed from an automated summary and checked against the worked example.
- **Brose et al. 2006.** Brose, U., Williams, R.J. & Martinez, N.D. (2006). Allometric scaling enhances stability in complex food webs. Ecology Letters 9(11): 1228-1236. https://doi.org/10.1111/j.1461-0248.2006.00978.x [NV] — Default ATN constants quoted from memory in notes; verify against ATNr vignette.
- **Brown et al. 2004.** Brown, J.H., Gillooly, J.F., Allen, A.P., Savage, V.M. & West, G.B. (2004). Toward a metabolic theory of ecology. Ecology 85(7): 1771-1789. https://doi.org/10.1890/03-9000 [NV] — From prior knowledge [M].
- **Buck & Weinstein 2020.** Buck, J.C. & Weinstein, S.B. (2020). The ecological consequences of a pandemic. Biology Letters 16(11): 20200641. https://doi.org/10.1098/rsbl.2020.0641 [V]
- **Buck et al. 2018.** Buck, J.C., Weinstein, S.B. & Young, H.S. (2018). Ecological and evolutionary consequences of parasite avoidance. Trends Ecol Evol 33(8): 619-632. https://doi.org/10.1016/j.tree.2018.05.001 [V]
- **Callaway & Aschehoug 2000.** Callaway, R.M. & Aschehoug, E.T. (2000). Invasive plants versus their new and old neighbors: a mechanism for exotic invasion. Science 290(5491): 521-523. https://doi.org/10.1126/science.290.5491.521 [V]
- **Carde & Willis 2008.** Carde, R.T. & Willis, M.A. (2008). Navigational strategies used by insects to find distant, wind-borne sources of odor. Journal of Chemical Ecology 34(7): 854-866. https://doi.org/10.1007/s10886-008-9484-5 [V]
- **Carlson & Griesser (preprint).** Carlson & Griesser. Mobbing in animals: a thorough review and proposed future directions. EcoEvoRxiv preprint. https://ecoevorxiv.org/repository/object/3921/download/7743/ [P] — Published version believed Adv Study Behav 2022, not verified.
- **Carter & Wilkinson 2015.** Carter, G.G. & Wilkinson, G.S. (2015). Social benefits of non-kin food sharing by female vampire bats. Proc R Soc B 282(1819): 20152524. https://doi.org/10.1098/rspb.2015.2524 [V]
- **Carvalho et al. 2023.** Carvalho, S., Mota, H. & Martins, M. (2023). Landscapes of biochemical warfare: spatial self-organization woven from allelopathic interactions. Life (Basel) 13(2): 512. https://doi.org/10.3390/life13020512 [V]
- **Cedergreen et al. 2007.** Cedergreen, N., Streibig, J.C., Kudsk, P., Mathiassen, S.K. & Duke, S.O. (2007). The occurrence of hormesis in plants and algae. Dose-Response 5(2): 150-162. https://doi.org/10.2203/dose-response.06-008.Cedergreen [V]
- **Chaieb et al. 2024.** Chaieb, Ten & Aznar (2024). Diseases of Aquatic Organisms 158: 195-200 (Pennella balaenoptera attached to wounds). https://doi.org/10.3354/dao03796 [V]
- **Chan et al. 2021.** Chan, B.K.K., et al. (2021). Five hundred million years to mobility: directed locomotion and its ecological function in a turtle barnacle. Proc R Soc B 288: 20211620. https://doi.org/10.1098/rspb.2021.1620 [V]
- **Charnov 1976.** Charnov (1976). Marginal value theorem. Theoretical Population Biology 9: 129-136. [NV] — Citation from memory; no DOI recorded.
- **Chattopadhyay 1996.** Chattopadhyay, J. (1996). Effect of toxic substances on a two-species competitive system. Ecological Modelling 84(1-3): 287-289. https://doi.org/10.1016/0304-3800(94)00134-0 [V]
- **Cockle & Martin 2015.** Cockle, K.L. & Martin, K. (2015). Temporal dynamics of a commensal network of cavity-nesting vertebrates: increased diversity during an insect outbreak. Ecology 96(4): 1093-1104. https://doi.org/10.1890/14-1256.1 [V]
- **Colautti & Antunes 2025.** Colautti, R.I. & Antunes, P.M. (2025). A critical reassessment of the novel weapons hypothesis and allelopathy as an adaptive strategy that facilitates plant invasion. New Phytologist 248(2): 507-516. https://doi.org/10.1111/nph.70415 [V]
- **Cornell All About Birds (great tit).** Cornell Lab of Ornithology, All About Birds: Great Tit life history (non-peer-reviewed reference). https://www.allaboutbirds.org/guide/Great_Tit/lifehistory [P]
- **Cote & Poulin 1995.** Cote, I.M. & Poulin, R. (1995). Parasitism and group size in social animals: a meta-analysis. Behavioral Ecology 6(2): 159-165. https://doi.org/10.1093/beheco/6.2.159 [V]
- **Couzin & Franks 2003.** Couzin, I.D. & Franks, N.R. (2003). Self-organized lane formation and optimized traffic flow in army ants. Proc R Soc B 270: 139-146. https://doi.org/10.1098/rspb.2002.2210 [P] — Parameters read from a copy of the paper; not PubMed-indexed.
- **Couzin et al. 2002.** Couzin, I.D., Krause, J., James, R., Ruxton, G.D. & Franks, N.R. (2002). Collective memory and spatial sorting in animal groups. Journal of Theoretical Biology 218: 1-11. https://jmvidal.cse.sc.edu/library/couzin02a.pdf [P] — PubMed PMID 12297066 matched; DOI not verified.
- **Cowan et al. 2021.** Cowan, M.A., Callan, M.N., Watson, M.J., et al. (2021). Artificial refuges for wildlife conservation: what is the state of the science? Biological Reviews 96(6): 2735-2754. https://doi.org/10.1111/brv.12776 [V]
- **Cummins et al. 2012.** Cummins, B., Cortez, R., Foppa, I.M., Walbeck, J. & Hyman, J.M. (2012). A spatial model of mosquito host-seeking behavior. PLoS Computational Biology 8(5): e1002500. https://doi.org/10.1371/journal.pcbi.1002500 [V]
- **Delhey 2018.** Delhey, K. (2018). Nest webs beyond woodpeckers: the ecological role of other nest builders. Ecology 99(4): 985-988. https://doi.org/10.1002/ecy.2108 [V] — Abstract not available.
- **Demsar et al. 2015.** Demsar, J., Hemelrijk, C.K., Hildenbrandt, H. & Bajec, I.L. (2015). Simulating predator attacks on schools: evolving composite tactics. Ecological Modelling 304: 22-33. https://doi.org/10.1016/j.ecolmodel.2015.02.018 [V] — Web-verified.
- **Diaz-Sierra et al. 2024.** Diaz-Sierra, R., Rietkerk, M., Verwijmeren, M. & Baudena, M. (2024). Facilitation and competition deconstructed: a mechanistic modelling approach to the stress gradient hypothesis applied to drylands. Scientific Reports 14: 2205. https://doi.org/10.1038/s41598-024-52447-z [V]
- **Dolado et al. 2014.** Dolado, Beltran & Quera (2014). JASSS 17(1): 8 (DomWorld variant, mangabey StepDom). https://doi.org/10.18564/jasss.2356 [P]
- **Drury et al. 2020.** Drury, Cowen & Grether (2020). PNAS 117(23): 12923-12930 (interspecific territoriality in birds). https://doi.org/10.1073/pnas.1921380117 [V]
- **Dunne et al. 2013.** Dunne, J.A., Lafferty, K.D., Dobson, A.P., et al. (2013). Parasites affect food web structure primarily through increased diversity and complexity. PLoS Biology 11(6): e1001579. https://doi.org/10.1371/journal.pbio.1001579 [V]
- **Duplouy et al. 2017.** Duplouy, A., Wong, S.C., Corander, J., Lehtonen, R. & Hanski, I. (2017). PeerJ 5: e3371 (Glanville fritillary). https://doi.org/10.7717/peerj.3371 [V]
- **Eckhoff 2011.** Eckhoff, P.A. (2011). A malaria transmission-directed model of mosquito life cycle and ecology. Malaria Journal 10: 303. https://doi.org/10.1186/1475-2875-10-303 [V]
- **Epstein & Axtell 1996.** Epstein, J.M. & Axtell, R.L. (1996). Growing Artificial Societies: Social Science from the Bottom Up (Sugarscape). Brookings / MIT Press. https://jasss.soc.surrey.ac.uk/12/1/6/appendixB/EpsteinAxtell1996.html [V] — Book; rules from JASSS appendix.
- **Field et al. 2023.** Field, J., Savill, C. & Foster, W.A. (2023). Brood parasites that care: alternative nesting tactics in a subsocial wasp. American Naturalist 202(5): 655-666. https://doi.org/10.1086/726250 [V]
- **Franks et al. 2009.** Franks, N.R., Dechaume-Moncharmont, F.-X., Hanmore, E. & Reynolds, J.K. (2009). Speed versus accuracy in decision-making ants. Phil Trans R Soc B 364: 845-852. https://doi.org/10.1098/rstb.2008.0224 [V]
- **Fretwell & Lucas 1970.** Fretwell, S.D. & Lucas, H.L. (1970). On territorial behavior and other factors influencing habitat distribution in birds. I. Theoretical development. Acta Biotheoretica 19: 16-36. https://doi.org/10.1007/BF01601953 [P] — Citation from a secondary listing.
- **Frontiers Ecol Evol 2019 (fevo.2019.00202).** Secondary source quoting Pawar et al. 2012 search-rate exponents. Frontiers in Ecology and Evolution (2019), article 00202. https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2019.00202/full [P] — Authors not recorded in notes.
- **Gauzens et al. 2023 (ATNr).** Gauzens, B., Brose, U., Delmas, E. & Berti, E. (2023). ATNr: Allometric Trophic Network models in R. Methods in Ecology and Evolution 14(11): 2766-. https://doi.org/10.1111/2041-210X.14212 [V] — Preprint used for kernel defaults: https://www.biorxiv.org/content/10.1101/2022.08.26.505404v2.full.pdf
- **Giacomini et al. 2013.** Giacomini, Shuter, de Kerckhove & Abrams (2013). Comment on Pawar et al. Nature 493: E1-E2. https://doi.org/10.1038/nature11829 [V] — Reply by Pawar et al.: https://doi.org/10.1038/nature11830
- **Ginelli et al. 2015.** Ginelli, F., Peruani, F., Pillot, M.-H., et al. (2015). Intermittent collective dynamics emerge from conflicting imperatives in sheep herds. PNAS 112(41): 12729-12734. https://doi.org/10.1073/pnas.1503749112 [V]
- **Giuggioli et al. 2011.** Giuggioli, Potts & Harris (2011). PLoS Computational Biology 7(3): e1002008 (territorial random walk; red foxes). https://doi.org/10.1371/journal.pcbi.1002008 [V]
- **GloBI InteractType.java.** GloBI source: InteractType.java and InteractTypeUtil.java, globalbioticinteractions/globalbioticinteractions (HEAD af7082b, 2 Oct 2026). https://github.com/globalbioticinteractions/globalbioticinteractions/blob/main/eol-globi-lib/src/main/java/org/eol/globi/domain/InteractType.java [V] — Labels, RO IRIs, NO_MATCH terms, inverse pairs and typeOfPath hierarchy.
- **Goss-Custard et al. 2006.** Goss-Custard et al. (2006). Behaviour-based shorebird IBM test. Ecological Applications 16(6): 2215-2222. https://doi.org/10.1890/1051-0761(2006)016[2215:toabim]2.0.co;2 [V]
- **Greggers et al. 2013.** Greggers, U., Schoning, C., Degen, J. & Menzel, R. (2013). Scouts behave as streakers in honeybee swarms. Naturwissenschaften 100(9): 805-809. https://doi.org/10.1007/s00114-013-1077-7 [P]
- **Grether et al. 2017.** Grether, Peiman, Tobias & Robinson (2017). Aggressive and reproductive interference between species. Trends Ecol Evol 32(10): 760-772. https://doi.org/10.1016/j.tree.2017.07.004 [V] — Topic paraphrased; exact title not recorded in notes.
- **Gripenberg et al. 2010.** Gripenberg, S., Mayhew, P.J., Parnell, M. & Roslin, T. (2010). A meta-analysis of preference-performance relationships in phytophagous insects. Ecology Letters 13(3): 383-393. https://doi.org/10.1111/j.1461-0248.2009.01433.x [V]
- **Grutter 1996.** Grutter, A.S. (1996). Parasite removal rates by the cleaner wrasse Labroides dimidiatus. Marine Ecology Progress Series 130: 61-70. https://www.int-res.com/articles/meps/130/m130p061.pdf [V]
- **Gu & Novak 2009.** Gu, W. & Novak, R.J. (2009). Agent-based modelling of mosquito foraging behaviour for malaria control. Trans R Soc Trop Med Hyg 103(11): 1105-1112. https://doi.org/10.1016/j.trstmh.2009.01.006 [V]
- **Hamilton 1971.** Hamilton, W.D. (1971). Geometry for the selfish herd. Journal of Theoretical Biology 31(2): 295-311. https://doi.org/10.1016/0022-5193(71)90189-5 [V]
- **Harfoot et al. 2014.** Harfoot, M.B.J., Newbold, T., Tittensor, D.P., et al. (2014). Emergent global patterns of ecosystem structure and function from a mechanistic general ecosystem model (Madingley). PLoS Biology 12(4): e1001841. https://doi.org/10.1371/journal.pbio.1001841 [V]
- **Hasenbank & Hartley 2015.** Hasenbank, M. & Hartley, S. (2015). Weaker resource diffusion effect at coarser spatial scales observed for egg distribution of cabbage white butterflies. Oecologia 177(2): 423-430. https://doi.org/10.1007/s00442-014-3103-7 [V]
- **Hassell et al. 1991.** Hassell, M.P., Comins, H.N. & May, R.M. (1991). Spatial structure and chaos in insect population dynamics. Nature 353: 255-258. https://doi.org/10.1038/353255a0 [V]
- **Heimpel et al. 1996.** Heimpel, G.E., Rosenheim, J.A. & Mangel, M. (1996). Egg limitation, host quality, and dynamic behavior by a parasitoid in the field. Ecology 77(8): 2410-2420. https://rosenheim.faculty.ucdavis.edu/wp-content/uploads/sites/137/2014/09/Heimpel-et-al.-1996-Ecology.pdf [V] — Verified via author PDF.
- **Hemelrijk 1999.** Hemelrijk, C.K. (1999). DomWorld model of egalitarian and despotic societies. Proc R Soc B 266(1417): 361-369. https://doi.org/10.1098/rspb.1999.0646 [V] — Record verified (PMC1689690); equations and parameter values [P] via automated PDF summary. Title not recorded in notes.
- **Hemelrijk et al. 2008.** Hemelrijk, C.K., et al. (2008). Female dominance over males in primates: self-organisation and sexual dimorphism. PLoS ONE 3(7): e2678. https://doi.org/10.1371/journal.pone.0002678 [V]
- **Holland & DeAngelis 2001.** Holland, J.N. & DeAngelis, D.L. (2001). Oecologia 126(4): 575-586 (unimodal net benefit to plant of pollinating seed-eaters). https://doi.org/10.1007/s004420000542 [V]
- **Holland et al. 2002.** Holland, J.N., DeAngelis, D.L. & Bronstein, J.L. (2002). Population dynamics and mutualism: functional responses of benefits and costs. American Naturalist 159(3): 231-244. https://doi.org/10.1086/338510 [V]
- **Holling 1959.** Holling, C.S. (1959). Some characteristics of simple types of predation and parasitism. Canadian Entomologist 91(7): 385-398. https://doi.org/10.4039/Ent91385-7 [NV] — From prior knowledge [M].
- **Horvath et al. 2008.** Horvath, G., Majer, J., Horvath, L., Szivak, I. & Kriska, G. (2008). Naturwissenschaften 95(11): 1093-1100 (polarotaxis in tabanids). https://doi.org/10.1007/s00114-008-0425-5 [V]
- **Ibarra et al. 2020.** Ibarra, J.T., Cockle, K.L., Altamirano, T.A., et al. (2020). Nurturing resilient forest biodiversity: nest webs as complex adaptive systems. Ecology and Society 25(2): 27. https://doi.org/10.5751/ES-11590-250227 [V]
- **IDM EMOD documentation.** Institute for Disease Modeling, EMOD malaria documentation: vector transmission model. https://docs.idmod.org/projects/emod-malaria/en/latest/vector-model-transmission.html [P]
- **Inada & Kawachi 2002.** Inada, Y. & Kawachi, K. (2002). Order and flexibility in the motion of fish schools. Journal of Theoretical Biology 214(3): 371-387. https://doi.org/10.1006/jtbi.2001.2449 [V]
- **inSALMO 7 description.** Railsback, S.F., et al. InSALMO 7 Model Description (2021-05-06). https://www.humboldt.edu/sites/default/files/ecological-modeling/2024-09/insalmo-72description2021-05-06.pdf [V] — Document read.
- **Jadhav et al. 2024.** Jadhav, V., Pasqua, R., Zanon, C., et al. (2024). Collective responses of flocking sheep (Ovis aries) to a herding dog (border collie). Communications Biology 7: 1543. https://doi.org/10.1038/s42003-024-07245-8 [V]
- **Joly et al. 2020.** Joly, K., et al. (2020). Behavioral, physiological, demographic and ecological impacts of hematophagous and endoparasitic insects on an Arctic ungulate. Toxins 12(5): 334. https://doi.org/10.3390/toxins12050334 [V]
- **Jones et al. 2017.** Jones et al. (2017). Closing the gaps for animal seed dispersal... (SEADS individual-based model). Ecology and Evolution. https://doi.org/10.1002/ece3.3113 [V] — Full text via PMC5528214.
- **Kalinkat et al. 2013.** Kalinkat, G., Schneider, F.D., Digel, C., et al. (2013). Body masses, functional responses and predator-prey stability. Ecology Letters 16(9): 1126-1134. https://doi.org/10.1111/ele.12147 [V]
- **Kefi et al. 2012.** Kefi, S., Berlow, E.L., Wieters, E.A., et al. (2012). More than a meal... integrating non-feeding interactions into food webs. Ecology Letters 15(4): 291-300. https://doi.org/10.1111/j.1461-0248.2011.01732.x [V] — Citation and abstract verified; class names not read from full text.
- **Kengwoung-Keumo 2016.** Kengwoung-Keumo, J.-J. (2016). Competition between a nonallelopathic phytoplankton and an allelopathic phytoplankton species under predation. Math Biosci Eng 13(4): 787-812. https://doi.org/10.3934/mbe.2016018 [V]
- **Kerr et al. 2002.** Kerr, B., Riley, M.A., Feldman, M.W. & Bohannan, B.J.M. (2002). Local dispersal promotes biodiversity in a real-life game of rock-paper-scissors. Nature 418: 171-174. https://doi.org/10.1038/nature00823 [V]
- **King et al. 2012.** King, A.J., Wilson, A.M., Wilshin, S.D., et al. (2012). Selfish-herd behaviour of sheep under threat. Current Biology 22(14): R561-R562. https://doi.org/10.1016/j.cub.2012.05.008 [V]
- **Kleyheeg et al. 2017 (J Ecol).** Kleyheeg et al. (2017). Seed dispersal distributions resulting from landscape-dependent d[aily movement] (title truncated in notes). Journal of Ecology 105(5): 1279-1289. https://doi.org/10.1111/1365-2745.12738 [P] — Repository abstract.
- **Kleyheeg et al. 2017 (Mov Ecol).** Kleyheeg et al. (2017). Movement Ecology 5: 2 (GPS tracking of 97 mallards). https://doi.org/10.1186/s40462-016-0092-7 [V]
- **Kleyheeg et al. 2019.** Kleyheeg et al. (2019). Frontiers in Ecology and Evolution 7: 40 (mallard gut retention and migratory seed dispersal). https://doi.org/10.3389/fevo.2019.00040 [P] — Rate units presumably h^-1, not confirmed.
- **Kondoh 2003.** Kondoh, M. (2003). Foraging adaptation and the relationship between food-web complexity and stability. Science 299: 1388-1391. https://doi.org/10.1126/science.1079154 [NV] — From prior knowledge [M] in notes.
- **Kumawat et al. 2024.** Kumawat, Bhatter, Bhatia, Purohit & Suthar (2024). Mathematical modeling of allelopathic stimulatory phytoplankton species using fractal-fractional derivatives. Scientific Reports 14: 20019. https://doi.org/10.1038/s41598-024-70596-z [V]
- **Kuris et al. 2008.** Kuris, A.M., Hechinger, R.F., Shaw, J.C., et al. (2008). Ecosystem energetic implications of parasite and free-living biomass in three estuaries. Nature 454(7203): 515-518. https://doi.org/10.1038/nature06970 [V]
- **Lafferty & Kuris 2002.** Lafferty, K.D. & Kuris, A.M. (2002). Trophic strategies, animal diversity and body size. Trends in Ecology & Evolution 17(11): 507-513. https://doi.org/10.1016/S0169-5347(02)02615-0 [V] — Confirmed from authors' PDF: https://parasitology.msi.ucsb.edu/sites/default/files/docs/publications/trophic%20strats.pdf
- **Lafferty & Morris 1996.** Lafferty, K.D. & Morris, A.K. (1996). Altered behavior of parasitized killifish increases susceptibility to predation by bird final hosts. Ecology 77(5): 1390-1397. https://doi.org/10.2307/2265536 [P] — Numbers as summarised in Weinersmith et al. 2023.
- **Lanchier & Mercer 2023.** Lanchier, N. & Mercer, M. (2023). Durrett-Levin spatial model of allelopathy. arXiv:2305.17016. https://arxiv.org/pdf/2305.17016 [V] — Preprint; journal status not confirmed.
- **Lett et al. 2014.** Lett, C., Semeria, M., Thiebault, A. & Tremblay, Y. (2014). Effects of successive predator attacks on prey aggregations. Theoretical Ecology 7(3): 239-252. https://doi.org/10.1007/s12080-014-0213-0 [V] — Web-verified.
- **Liehrmann et al. 2018.** [First author unverified] (2018). Epizoochorous dispersal by ungulates depends on fur, grooming and social interactions. Ecology and Evolution. https://doi.org/10.1002/ece3.3768 [V] — Title/DOI/full text verified (PMC5792512); authors [P].
- **Ling et al. 2019.** Ling et al. (2019). Jackdaw transit vs mobbing flocks. Nature Communications 10: 5174. https://doi.org/10.1038/s41467-019-13281-4 [V] — Full text via PMC6858344.
- **Lorch lab web page.** Lorch lab, Mormon cricket research page (non-peer-reviewed). https://lorchlab.wordpress.com/research/mormon-crickets/ [P]
- **Lovas-Kiss et al. 2020.** Lovas-Kiss et al. (2020). Ecology and Evolution 10(3): 1413-1424 (seed survival through mallard digestion). https://doi.org/10.1002/ece3.5997 [V]
- **Macias et al. 2005.** Macias, F.A., et al. (2005). Degradation studies on benzoxazinoids. Soil degradation dynamics of DIBOA-Glc and its degradation products. J Agric Food Chem 53(3): 554-561. https://doi.org/10.1021/jf048702l [V]
- **Mangel 1987.** Mangel, M. (1987). Oviposition site selection and clutch size in insects. Journal of Mathematical Biology 25(1): 1-22. https://doi.org/10.1007/BF00275885 [V]
- **Masuda et al. 2015.** Masuda, N., O'Shea-Wheller, T.A., Doran, C. & Franks, N.R. (2015). Computational model of collective nest selection by ants with heterogeneous acceptance thresholds. R Soc Open Sci 2: 140533. https://doi.org/10.1098/rsos.140533 [V]
- **Maynard Smith & Price 1973.** Maynard Smith & Price (1973). The logic of animal conflict. Nature 246: 15-18. https://doi.org/10.1038/246015a0 [P]
- **Merck Veterinary Manual (tsetse).** Merck Veterinary Manual: Tsetse flies (secondary/grey source). https://www.merckvetmanual.com/integumentary-system/flies/tsetse-flies [P]
- **Miele et al. 2019.** Miele, V., Guill, C., Ramos-Jiliberto, R. & Kefi, S. (2019). PLoS Computational Biology (bioenergetic model with six non-trophic interaction types), e1007269. https://doi.org/10.1371/journal.pcbi.1007269 [P] — Parameter values read via a summarising fetch, not the article tables. Title not recorded in notes.
- **Mooring & Hart 1992.** Mooring, M.S. & Hart, B.L. (1992). Animal grouping for protection from parasites: selfish herd and encounter-dilution effects. Behaviour 123(3-4): 173-193. https://ucdavis.pure.elsevier.com/en/publications/animal-grouping-for-protection-from-parasites-selfish-herd-and-en [P] — No DOI seen.
- **Morales & Carlo 2006.** Morales & Carlo (2006). Ecology 87(6): 1489-1496 (spatially explicit frugivore seed-dispersal simulation). https://doi.org/10.1890/0012-9658(2006)87[1489:teopda]2.0.co;2 [V] — Title not recorded in notes.
- **Mukhopadhyay et al. 1998.** Mukhopadhyay, A., Chattopadhyay, J. & Tapaswi, P.K. (1998). A delay differential equations model of plankton allelopathy. Mathematical Biosciences 149(2): 167-189. https://doi.org/10.1016/s0025-5564(98)00005-4 [V]
- **Myhrvold et al. 2015.** Myhrvold, N.P., Baldridge, E., Chan, B., et al. (2015). An amniote life-history database to perform comparative analyses with birds, mammals, and reptiles. Ecology 96: 3109. https://esapubs.org/archive/ecol/E096/269/metadata.php [V] — DOI conflict: ESA metadata 10.1890/15-0846.1 vs Wiley URL 10.1890/15-0846R.1.
- **Naranjo et al. 2019.** Naranjo, C., Iriondo, J.M., Riofrio, M.L. & Lara-Romero, C. (2019). Evaluating the structure of commensalistic epiphyte-phorophyte networks. AoB PLANTS 11(2): plz011. https://doi.org/10.1093/aobpla/plz011 [V]
- **Nathan et al. 2008.** Nathan et al. (2008). Long-distance dispersal review. Trends Ecol Evol 23(11): 638-647. https://doi.org/10.1016/j.tree.2008.08.003 [V]
- **Niitepold 2019.** Niitepold, K. (2019). Oecologia 191(2): 271-283 (food restriction and fecundity in Melitaea cinxia). https://doi.org/10.1007/s00442-019-04489-8 [V]
- **Noh et al. 2018.** Noh, H.-J., Gloag, R. & Langmore, N.E. (2018). Proc R Soc B 285: 20180726 (innate template for rejecting cuckoo chicks). https://doi.org/10.1098/rspb.2018.0726 [V]
- **Ogden et al. 2005.** Ogden, N.H., Bigras-Poulin, M., O'Callaghan, C.J., et al. (2005). A dynamic population model to investigate effects of climate on geographic range and seasonality of the tick Ixodes scapularis. Int J Parasitol 35(4): 375-389. https://doi.org/10.1016/j.ijpara.2004.12.013 [V]
- **Olson et al. 2013.** Olson, R.S., Hintze, A., Dyer, F.C., Knoester, D.B. & Adami, C. (2013). Predator confusion is sufficient to evolve swarming behaviour. J R Soc Interface 10(85): 20130305. https://doi.org/10.1098/rsif.2013.0305 [V]
- **Osborne et al. 1999.** Osborne et al. (1999). Journal of Applied Ecology 36: 519-533 (harmonic-radar measurement of bumblebee foraging range and constancy). https://doi.org/10.1046/j.1365-2664.1999.00428.x [P] — Title and DOI only; distances not extracted.
- **Outreman & Pierre 2005.** Outreman, Y. & Pierre, J.-S. (2005). Adaptive value of host discrimination in parasitoids: when host defences are very costly. Behavioural Processes 70(2): 93-103. https://doi.org/10.1016/j.beproc.2005.04.004 [V]
- **Papadopoulou et al. 2026.** Papadopoulou, M., Hildenbrandt, H., Storms, R.F., et al. (2026). A mechanistic understanding of collective escape in starling flocks (StarEscape). Communications Biology 9: 1055. https://doi.org/10.1038/s42003-026-10173-4 [V]
- **Parker 1974.** Parker (1974). Assessment strategy and the evolution of fighting behaviour. Journal of Theoretical Biology 47(1): 223-243. https://doi.org/10.1016/0022-5193(74)90111-8 [V] — Record verified; content from general knowledge.
- **Passino & Seeley 2006.** Passino, K.M. & Seeley, T.D. (2006). Modeling and analysis of nest-site selection by honeybee swarms: the speed and accuracy trade-off. Behav Ecol Sociobiol 59: 427-442. https://doi.org/10.1007/s00265-005-0067-y [V]
- **Patnaude & Mather (UF/IFAS).** Patnaude, M.R. & Mather, T.N. Blacklegged tick, UF/IFAS EENY-143 (extension fact sheet). https://ask.ifas.ufl.edu/publication/IN300 [P]
- **Pawar et al. 2012.** Pawar, S., Dell, A.I. & Savage, V.M. (2012). Dimensionality of consumer search space drives trophic interaction strengths. Nature 486(7404): 485-489. https://doi.org/10.1038/nature11131 [V]
- **Phasomkusolsil et al. 2015.** Phasomkusolsil, S., et al. (2015). Acta Tropica 152: 220-227 (blood-meal size in seven colonised Anopheles species). https://doi.org/10.1016/j.actatropica.2015.09.021 [V]
- **Pintar & Resetarits 2020.** Pintar, M.R. & Resetarits, W.J. (2020). Ecology and Evolution 10(21): 12170-12182 (priority effects on oviposition habitat selection). https://doi.org/10.1002/ece3.6845 [V]
- **Poelen et al. 2014.** Poelen, J.H., Simons, J.D. & Mungall, C.J. (2014). Global biotic interactions: an open infrastructure to share and analyze species-interaction datasets. Ecological Informatics 24: 148-159. https://doi.org/10.1016/j.ecoinf.2014.08.005 [NV] — DOI from prior knowledge, not re-checked.
- **Potts & Lewis 2014.** Potts & Lewis (2014). Proc R Soc B 281(1784): 20140231 (review of mechanistic territory models). https://doi.org/10.1098/rspb.2014.0231 [V]
- **Poyatos et al. 2025.** Poyatos, S., Santidrian Tomillo, P., Fazzari, L., et al. (2025). Growth rates of the epibiotic barnacle Chelonibia testudinaria reveal habitat use of pre-nesting green turtles in Costa Rica. Marine Biology. https://doi.org/10.1007/s00227-025-04683-8 [V]
- **Pratt 2005.** Pratt, S.C. (2005). Quorum sensing by encounter rates in the ant Temnothorax albipennis. Behavioral Ecology 16(2): 488-496. https://ideas.repec.org/a/oup/beheco/v16y2005i2p488-496.html [V]
- **Pratt et al. 2002.** Pratt, S.C., Mallon, E.B., Sumpter, D.J.T. & Franks, N.R. (2002). Quorum sensing, recruitment, and collective decision-making during colony emigration by the ant Leptothorax albipennis. Behav Ecol Sociobiol 52: 117-127. https://pratt.lab.asu.edu/node/100 [V] — Via lab page.
- **Rall et al. 2012.** Rall, B.C., Brose, U., Hartvig, M., et al. (2012). Universal temperature and body-mass scaling of feeding rates. Phil Trans R Soc B 367(1605): 2923-2934. https://doi.org/10.1098/rstb.2012.0242 [P] — Exponents read through a summarising fetch; units, log base and T0 not captured.
- **Ranc et al. 2021.** Ranc et al. (2021). PNAS 118(15): e2014856118 (memory half-lives in roe deer foraging). https://doi.org/10.1073/pnas.2014856118 [V]
- **Rappoldt et al. 2010.** Rappoldt, Stillman & Ens (2010). Ecological Modelling 221(2): 147-151 (geometric interference). https://doi.org/10.1016/j.ecolmodel.2009.10.007 [P] — Abstract-level.
- **Rasher & Hay 2010.** Rasher, D.B. & Hay, M.E. (2010). Chemically rich seaweeds poison corals when not controlled by herbivores. PNAS 107(21): 9683-9688. https://doi.org/10.1073/pnas.0912095107 [V]
- **Rehm et al. 2019.** Rehm, Fricke, Bender, Savidge & Rogers (2019). Proc R Soc B 286(1894): 20182007 (bird seed dispersal on Saipan). https://doi.org/10.1098/rspb.2018.2007 [P]
- **Reiter 2007.** Reiter, P. (2007). Vector-Borne and Zoonotic Diseases 7(2): 261-273 (skip oviposition in Aedes aegypti). https://doi.org/10.1089/vbz.2006.0630 [V]
- **Reynolds 1999.** Reynolds, C.W. (1999). Steering Behaviors For Autonomous Characters. Proceedings of the Game Developers Conference 1999, San Jose. No DOI. https://www.red3d.com/cwr/steer/gdc99/ [P] — Content read on author's page; page numbers not verified.
- **rmangal search_interactions.R.** rmangal R client, search_interactions.R (HEAD 9c566ba, 22 Jan 2026): accepted Mangal interaction 'type' values. https://github.com/ropensci/rmangal/blob/master/R/search_interactions.R [V] — mangal.io API itself was blocked.
- **RO interaction subset (2022 snapshot).** RO interaction-relations subset, archived generated documentation of ro-interaction.owl, 2022-05-24 snapshot (Archivo, Uni Leipzig). https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/purl.obolibrary.org/obo--ro--subsets--ro-interaction--owl/2022.05.24-071843/obo--ro--subsets--ro-interaction--owl_type=generatedDocu.html [P] — Machine-generated listing; used only for IDs not re-checked in the 2026 release (mesoparasite of, pathogen of).
- **RO release 2026-09-04.** OBO Relations Ontology, ro.obo, data-version releases/2026-09-04 (oborel/obo-relations commit 091f476, 7 Sep 2026). https://github.com/oborel/obo-relations/blob/master/ro.obo [V] — Primary ontology file parsed locally; OLS4/Ontobee were blocked.
- **Roy 2009.** Roy, S. (2009). The coevolution of two phytoplankton species on a single resource: allelopathy as a pseudo-mixotrophy. Theoretical Population Biology 75(1): 68-75. https://doi.org/10.1016/j.tpb.2008.11.003 [V]
- **Roy et al. 2006.** Roy, S., Alam, S. & Chattopadhyay, J. (2006). Competing effects of toxin-producing phytoplankton on overall plankton populations in the Bay of Bengal. Bull Math Biol 68(8): 2303-2320. https://doi.org/10.1007/s11538-006-9109-5 [V]
- **Rubenstein & Feinstein 2021.** Rubenstein, D.I. & Feinstein, L.H. (2021). Bothersome flies: how free-ranging horses reduce harm while maintaining nutrition. Frontiers in Ecology and Evolution 9: 659570. https://doi.org/10.3389/fevo.2021.659570 [V]
- **Russo et al. 2006.** Russo, Portnoy & Augspurger (2006). Ecology 87(12): 3160-3174 (spider-monkey seed dispersal model). https://russolab.unl.edu/PDF/Russo_et_al_2006_Ecol.pdf [P] — Author PDF read via automated summary.
- **Saha et al. 2019.** Saha et al. (2019). Microbial 'gardening' by a seaweed holobiont: surface metabolites attract protective and deter pathogenic epibacterial settlement. Journal of Ecology. https://doi.org/10.1111/1365-2745.13193 [P]
- **Salerno et al. 2023.** Salerno, C.M., Buck, J.C. & Kamel, S.J. (2023). J Anim Ecol 92(4): 813-825 (avoidance of infected conspecifics in Littoraria). https://doi.org/10.1111/1365-2656.13891 [V]
- **Sayago et al. 2013.** Sayago, R., Lopezaraiza-Mikel, M., Quesada, M., et al. (2013). Evaluating factors that predict the structure of a commensalistic epiphyte-phorophyte network. Proc R Soc B 280: 20122821. https://doi.org/10.1098/rspb.2012.2821 [V]
- **Schmitz & Booth 1997.** Schmitz, O.J. & Booth, G. (1997). Modelling food web complexity: the consequences of individual-based, spatially explicit behavioural ecology on trophic interactions. Evolutionary Ecology 11(4): 379-398. https://doi.org/10.1023/A:1018476606256 [V]
- **Schneider et al. 2016.** Schneider, F.D., Brose, U., Rall, B.C. & Guill, C. (2016). Animal diversity and ecosystem functioning in dynamic food webs. Nature Communications 7: 12718. https://doi.org/10.1038/ncomms12718 [V] — Ricker kernel values confirmed via ATNr preprint (create_Lmatrix).
- **Schofield et al. 2002.** Schofield, Chaplain & Hubbard (2002). J Theor Biol 214(1): 31-47 (individual-based host-parasitoid model with kairomone chemotaxis). https://doi.org/10.1006/jtbi.2001.2418 [V]
- **Schultz et al. 2008.** Schultz, K.M., Passino, K.M. & Seeley, T.D. (2008). The mechanism of flight guidance in honeybee swarms: subtle guides or streaker bees? J Exp Biol 211(20): 3287-3295. https://doi.org/10.1242/jeb.018994 [V]
- **Schupp et al. 2010.** Schupp, Jordano & Gomez (2010). Seed dispersal effectiveness (SDE) framework. New Phytologist 188(2): 333-353. https://doi.org/10.1111/j.1469-8137.2010.03402.x [V]
- **Seeley & Morse 1978.** Seeley, T.D. & Morse, R.A. (1978). Nest site selection by the honey bee, Apis mellifera. Insectes Sociaux 25(4): 323-337. https://link.springer.com/article/10.1007/BF02224297 [V]
- **Seeley & Visscher 2003.** Seeley, T.D. & Visscher, P.K. (2003). Choosing a home: how the scouts in a honey bee swarm perceive the completion of their group decision making. Behav Ecol Sociobiol 54: 511-520. https://bees.ucr.edu/sites/default/files/2020-06/bes54.pdf [V] — Via authors' PDF.
- **Seex et al. 2022.** Seex, L., Sacca, & Hemelrijk, C.K. (2022). Frontiers in Ecology and Evolution 10: 982507 (DomWorld StepDom regimes). https://doi.org/10.3389/fevo.2022.982507 [P]
- **Shin & Cury 2001.** Shin, Y.-J. & Cury, P. (2001). Exploring fish community dynamics through size-dependent trophic interactions using a spatialized individual-based model (OSMOSE). Aquatic Living Resources 14: 65-80. https://www.alr-journal.org/articles/alr/pdf/2001/02/alr1135.pdf [P] — Read from PDF; DOI not verified.
- **Shipley et al. 1994.** Shipley, L.A., Gross, J.E., Spalinger, D.E., Hobbs, N.T. & Wunder, B.A. (1994). The scaling of intake rate in mammalian herbivores. American Naturalist 143(6): 1055-1082. https://doi.org/10.1086/285648 [V]
- **Sibly et al. 2013.** Sibly, R.M., Grimm, V., Martin, B.T., et al. (2013). Representing the acquisition and use of energy by individuals in agent-based models of animal populations. Methods in Ecology and Evolution 4(2): 151-161. https://doi.org/10.1111/2041-210x.12002 [V]
- **Simpson et al. 2006.** Simpson, S.J., Sword, G.A., Lorch, P.D. & Couzin, I.D. (2006). Cannibal crickets on a forced march for protein and salt. PNAS 103(11): 4152-4156. https://doi.org/10.1073/pnas.0508915103 [V]
- **Sinkkonen 2005.** Sinkkonen, A. (2005). Modeling the effect of density-dependent chemical interference upon seed germination. Nonlinearity Biol Toxicol Med 3(2): 225-233. https://doi.org/10.2201/nonlin.003.02.004 [V]
- **Snall et al. 2005.** Snall, T., et al. (2005). Colonization-extinction dynamics of an epiphyte metapopulation in a dynamic landscape. Ecology. https://doi.org/10.1890/04-0531 [P] — Parameter estimates not read (Wiley 403); data SND 1073.
- **Soler 2025.** Soler, M. (2025). Multiparasitism: why do interspecific brood parasites lay eggs so frequently in already parasitized host nests? Biological Reviews 100(4): 1660-1679. https://doi.org/10.1111/brv.70018 [V]
- **Spalinger & Hobbs 1992.** Spalinger, D.E. & Hobbs, N.T. (1992). Mechanisms of foraging in mammalian herbivores: new models of functional response. American Naturalist 140(2): 325-348. Equations as given by Fryxell et al. https://doi.org/10.1086/285415 [P] — Volume/pages NV; equations via Fryxell et al. PDF https://uknowledge.uky.edu/cgi/viewcontent.cgi?article=4099&context=igc
- **Storms et al. 2019.** Storms, R.F., Carere, C., Zoratto, F. & Hemelrijk, C.K. (2019). Complex patterns of collective escape in starling flocks under predation. Behavioral Ecology and Sociobiology 73(1): 10. https://doi.org/10.1007/s00265-018-2609-0 [V]
- **Szaz et al. 2015.** Szaz, D., Horvath, G., Barta, A., et al. (2015). PLoS ONE 10(3): e0121194 (polarised light pollution and mayfly oviposition on asphalt). https://doi.org/10.1371/journal.pone.0121194 [V]
- **Tardy et al. 2022.** Tardy, O., Vincenot, C.E., Bouchard, C., Ogden, N.H. & Leighton, P.A. (2022). Context-dependent host dispersal and habitat fragmentation determine heterogeneity in infected tick burdens: an agent-based modelling study. R Soc Open Sci 9(3): 220245. https://doi.org/10.1098/rsos.220245 [V]
- **Ten et al. 2022.** Ten, S., Konishi, K., Raga, J.A., Pastene, L.A. & Aznar, F.J. (2022). Epibiotic fauna of the Antarctic minke whale as a reliable indicator of seasonal movements. Scientific Reports 12: 22214. https://doi.org/10.1038/s41598-022-25929-1 [V]
- **Ten et al. 2026.** Ten, S., Dupont, G., Raga, J.A., Dobson, A.P. & Aznar, F.J. (2026). Long-term trends of epibionts reflect Mediterranean striped dolphin abundance shifts caused by morbillivirus epidemics. J Anim Ecol 95(3): 553-569. https://doi.org/10.1111/1365-2656.70216 [V]
- **Thinnabut et al. 2024.** Thinnabut, K., Maleewong, W. & Tangkawanit, U. (2024). Direct observation of feeding behavior of adult Tabanidae (Diptera) on beef cattle. Insects 15(8): 602. https://doi.org/10.3390/insects15080602 [V]
- **Tolvanen et al. 2018.** Tolvanen, J., et al. (2018). Interspecific information on predation risk affects nest site choice in a passerine bird. BMC Evolutionary Biology 18: 181. https://doi.org/10.1186/s12862-018-1301-3 [V]
- **Torney et al. 2018.** Torney, C.J., Lamont, M., Debell, L., et al. (2018). Inferring the rules of social interaction in migrating caribou. Phil Trans R Soc B 373(1746): 20170385. https://doi.org/10.1098/rstb.2017.0385 [V]
- **Torr et al. 2007.** Torr, S.J., Prior, A., Wilson, P.J. & Schofield, S. (2007). Is there safety in numbers? The effect of cattle herding on biting risk from tsetse flies. Medical and Veterinary Entomology 21(4): 301-311. https://doi.org/10.1111/j.1365-2915.2007.00705.x [V]
- **Tristao et al. 2025.** Tristao, W., et al. (2025). PLoS Neglected Tropical Diseases 19(6): e0013264 (ovitrap egg counts, Goiania). https://doi.org/10.1371/journal.pntd.0013264 [V]
- **Trzcinski et al. 2022.** Trzcinski, M.K., Cockle, K.L., Norris, A.R., et al. (2022). Woodpeckers and other excavators maintain the diversity of cavity-nesting vertebrates. J Anim Ecol 91(6): 1251-1265. https://doi.org/10.1111/1365-2656.13626 [V]
- **Uiterwaal & DeLong 2020.** Uiterwaal, S.F. & DeLong, J.P. (2020). Ecology 101(4): e02975 (functional responses vs temperature and mass, 2,083 curves). https://doi.org/10.1002/ecy.2975 [V] — Abstract verified; temperature optima [P] via UNL repository.
- **Uiterwaal et al. 2022.** Uiterwaal, S.F., Lagerstrom, I.T., Lyon, S.R. & DeLong, J.P. (2022). FoRAGE database: a compilation of functional responses for consumers and parasitoids. Ecology 103(7): e3706. Data DOI 10.5063/DB807S. https://doi.org/10.1002/ecy.3706 [V] — Licence CC-BY-NC-SA.
- **Valdovinos 2025.** Valdovinos, F.S. (2025). Effect of network structure and adaptive foraging on pollination services of species-rich plant-pollinator communities. Integrative and Comparative Biology. https://doi.org/10.1093/icb/icaf024 [V] — Full text via PMC12530190.
- **Valdovinos et al. 2013.** Valdovinos, F.S., Moisset de Espanes, P., Flores, J.D. & Ramos-Jiliberto, R. (2013). Adaptive foraging allows the maintenance of biodiversity of pollination networks. Oikos 122(6): 907-917. https://www.jstor.org/stable/41937740 [V] — JSTOR record verified; DOI from memory.
- **van Breugel et al. 2015.** van Breugel, F., Riffell, J., Fairhall, A. & Dickinson, M.H. (2015). Mosquitoes use vision to associate odor plumes with thermal targets. Current Biology 25(16): 2123-2129. https://doi.org/10.1016/j.cub.2015.06.046 [V]
- **van der Zee et al. 2018.** van der Zee et al. (2018). Foundation species facilitate food webs non-trophically (58 food webs, 7 ecosystems). PLoS ONE 13: e0199152. https://doi.org/10.1371/journal.pone.0199152 [V] — Finding as paraphrased in notes; exact title not recorded.
- **Ventrella, Clusters.** Ventrella, J. Clusters (web essay and simulation): asymmetric N x N force fields between particle types, 4-parameter piecewise-linear profiles. https://www.ventrella.com/Clusters/intro.html [P] — Web source, not peer reviewed.
- **Wahl 2008.** Wahl, M. (2008). Ecological lever and interface ecology: epibiosis modulates the interactions between host and environment. Biofouling 24(6): 427-438. https://doi.org/10.1080/08927010802339772 [V]
- **Walters 2022.** Walters, J.R. (2022). Cavities excavated by woodpeckers limit populations of other cavity-nesting birds. J Anim Ecol 91(6): 1052-1055. https://doi.org/10.1111/1365-2656.13704 [V]
- **Wang et al. 2013.** Wang et al. (2013). PLoS ONE 8(12): e85162 (microbial conversion of catechin to more phytotoxic protocatechuic acid). https://doi.org/10.1371/journal.pone.0085162 [V]
- **Wang et al. 2020.** Wang, L.-W., Zhong, G., He, G.-B., Zhang, Y.-H. & Liang, W. (2020). Egg laying behavior of common cuckoos (Cuculus canorus): data based on field video-recordings. Zoological Research 41(4): 458-464. https://doi.org/10.24272/j.issn.2095-8137.2020.021 [V]
- **Weiner et al. 2001.** Weiner, J., Stoll, P., Muller-Landau, H. & Jasentuliyana, A. (2001). The effects of density, spatial pattern, and competitive symmetry on size variation in simulated plant populations. American Naturalist 158(4): 438-450. https://doi.org/10.1086/321988 [V]
- **Weinersmith et al. 2023.** Weinersmith, K.L., Nadler, L.E., Bengston, E., et al. (2023). Experimental infections with Euhaplorchis californiensis and a small cyathocotylid increase conspicuous behaviors in California killifish. Journal of Parasitology 109(4): 362-376. https://doi.org/10.1645/23-35 [V]
- **Wilkinson, 'Bat blood donors'.** Wilkinson, G.S. Encyclopedia entry 'Bat blood donors', pp. 766-767 (host book and year not shown). https://science.umd.edu/faculty/wilkinson/Vampire_entry.pdf [P]
- **Williams & Martinez 2004.** Williams, R.J. & Martinez, N.D. (2004). Stabilization of chaotic and non-permanent food-web dynamics. European Physical Journal B 38: 297-303. https://doi.org/10.1140/epjb/e2004-00122-1 [NV] — From prior knowledge [M].
- **Witter et al. 2012.** Witter, L.A., Johnson, C.J., Croft, B., Gunn, A. & Gillingham, M.P. (2012). Behavioural trade-offs in response to external stimuli: time allocation of an Arctic ungulate during varying intensities of harassment by parasitic flies. J Anim Ecol 81(1): 284-295. https://doi.org/10.1111/j.1365-2656.2011.01905.x [V]
- **Wong et al. 2012.** Wong, J., Morrison, A.C., Stoddard, S.T., et al. (2012). PLoS Neglected Tropical Diseases 6(5): e1632 (Aedes aegypti oviposition preference vs larval performance). https://doi.org/10.1371/journal.pntd.0001632 [V]
- **Yun et al. 2026.** Yun et al. (2026). Insects 17(7): 677 (myrmecochory review). https://doi.org/10.3390/insects17070677 [P] — Citing Gomez & Espadaler 2013, Ecography, doi:10.1111/j.1600-0587.2013.00289.x [P].
- **Zalucki & Suzuki 1987.** Zalucki, M.P. & Suzuki, Y. (1987). Milkweed patch quality, adult population structure, and egg laying in the monarch butterfly. J Lepid Soc 41(1): 13-22. https://images.peabody.yale.edu/lepsoc/jls/1980s/1987/1987-41(1)13-Zalucki.pdf [V]
- **Zhang et al. 2023 (Curr Biol).** Zhang, J., Santema, P., Li, J., Deng, W. & Kempenaers, B. (2023). Brood parasitism risk drives birds to breed near humans. Current Biology 33(6): 1125-1129.e3. https://doi.org/10.1016/j.cub.2023.01.047 [V]
- **Zhang et al. 2023 (Proc R Soc B).** Zhang, J., Santema, P., Lin, Z., et al. (2023). Proc R Soc B 290: 20222094 (cuckoo host-nest choice by egg colour). https://doi.org/10.1098/rspb.2022.2094 [V]
