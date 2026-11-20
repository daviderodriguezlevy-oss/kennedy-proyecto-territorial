# Ecosystem Boids Simulator — Evaluation of the Non-Trophic Interactions & Herd Movement Report

Oct 4, 2026 · @Carlos

## Verdict

Its weaknesses are a thin foundational-modelling bibliography, several key parameter sets read through automated summaries, and no plan for running four clocks inside Grasshopper.

| Dimension | Rating | Why |
| --- | --- | --- |
| Evidence transparency | Strong | Every claim carries \[V\], \[P\] or \[NV\]; unverified parts are named; corrections are tabled |
| Architectural synthesis | Strong, with gaps | Five mechanisms cover all twelve interactions at rule level; it omits a footprint mechanism, persistent bonds, abiotic dispersal and life-stage medium changes (see the architecture section) |
| Coverage of your interaction list | Complete in rules, uneven in numbers | Hematophagy, aggression, herd movement and seed dispersal are well parameterised; insect and fish herbivory, plant parasites and persistent symbioses are thin |
| Parameter reliability | Mixed | DomWorld radii, Rall's regressions, Miele's intensities, Couzin & Franks' ant values and Buhl's densities are \[P\]; physical constants (diffusion, release, drag) are absent |
| Foundational modelling literature | Weak | Reynolds' boids, Vicsek, Hamilton's selfish herd, Holling, Grimm's pattern-oriented modelling and ODD, and the core multilayer-network papers are not cited |
| Implementation feasibility | Not addressed | One simulated day at a 0.02 s step is 4.32 million steps; the four-clock plan needs a coarse-graining strategy to run in Rhino |

One limit on this review: my own knowledge runs to June 2026. I cannot vouch for items dated after that, including the RO release of 2026-09-04, the GloBI commit of 2 October 2026, Papadopoulou et al. 2026, Ten et al. 2026, Verdolin & Red 2026 and Yun et al. 2026.

## Spot-checks and errors found

Of fifteen claims checked, most hold. Three need a correction before coding (herbivore intake units, the encounter speed term, Euler decay), and four are citation or labelling fixes. Rows marked "sourced" were checked against a page this session; the rest are arithmetic or dimensional checks I ran myself.

| Claim in the report | What the check found | Action |
| --- | --- | --- |
| Myrmecochory averages 2.24 m, max about 180 m (Yun et al. 2026, \[P\]) | The primary source is [Gómez & Espadaler 2013](https://doi.org/10.1111/j.1600-0587.2013.00289.x): 2.24 ± 7.19 m across 183 species-by-study means, 1.99 m across 7,889 raw observations, tail to 180 m. [Yun et al.](https://doi.org/10.3390/insects17070677) is quoting it (sourced) | Cite Gómez & Espadaler 2013; use 1.99 m for per-seed kernels, 2.24 m for per-species means |
| Buhl et al. 2006 first author "Buhl C" on PubMed | PubMed does index "Buhl C", but [Science, JSTOR and MPG list J. (Jérôme) Buhl](https://www.jstor.org/stable/3846386). The PubMed record is the error (sourced) | Keep "Buhl, J." as the bibliography already does |
| Sparse-bite herbivore intake I = v\_max·w·D/(1 + δ·w·D) | Without bite mass S this yields bites per second, not grams per second. Spalinger & Hobbs' dense-bite form is asymptotic in bite mass ([Mezzalira et al. 2017](https://besjournals.onlinelibrary.wiley.com/doi/10.1111/1365-2656.12698), sourced) | Multiply the sparse form by S; check against the 1992 original before coding |
| Kéfi et al. 2012 classes give the multilayer basis | True, but the stronger source is [Kéfi et al. 2016, PLoS Biology](https://journals.plos.org/plosbiology/article?id=10.1371%2Fjournal.pbio.1002527): a trophic, positive and negative non-trophic multiplex with open Dryad data (sourced). The report does not cite it | Add it as the main multilayer reference |
| Brain–Cousens with b = 2, f = 0.8–1.5 peaks at 1.14–1.40 | Correct. With C in units of e, the peak has the closed form R\_max = (1 + √(1 + f²))/2, giving 1.140 and 1.401. The normalised curve equals Brain–Cousens with c = 0, d = 1 | Use as written; note f is in units of 1/e |
| Barnacle detachment 0.013–0.031 per day | Correct: −ln(0.759)/21 = 0.0131 and −ln(0.759)/9 = 0.0306 | Use as written |
| Doubling drag area cuts speed by about 21% | Correct for quadratic drag at constant power (2^−1/3 = 0.794). For small insects in viscous flow, speed scales as drag^−1/2 (−29%) | Choose the drag regime by Reynolds number |
| Cleaner wrasse about 7 s per client | Correct: 256 min / 2,297 clients = 6.7 s | Use as written |
| Anopheles meal 1.1–1.3× body mass (text) vs 1–1.3× (table) | 1/0.88 to 1/0.76 gives 1.14–1.32×. The table's lower bound is wrong | Use 1.1–1.3× |
| Locust speed 1.9 cm/s (model) vs 3–4 cm/s (movement table) | Two different quantities: a fitted model parameter and an observed individual speed | Label which one each class uses |
| Encounter area a ≈ 2rv (2D) and πr²v (3D) | Dimensionally right but assumes stationary prey. Moving prey need mean relative speed (Gerritsen & Strickler 1977, not cited) | Use relative speed (equations section) |
| Contagion rule r = r₀(1 + α·n\_target)^β / (1 + n\_other)^γ | A synthesis: Pillot et al. published μ = α·D^β/S^γ; Ginelli's rates were reconstructed. No paper uses the unified form | Mark as a design choice; fit β, γ per class |
| First-order field decay with λ = ln 2 / half-life | Correct, but explicit Euler (1 − λΔt) goes negative once λΔt > 1, which happens for scent fields on a daily tick | Apply exp(−λΔt) exactly |
| Floral visit counts as pollination with probability σ | Workable at population level, but it discards pollen carryover between flowers, which an agent model can represent directly | Carry pollen as cargo with per-visit deposition |
| Twelve interactions reduce to five mechanisms | Holds for the rules shown; three behaviours used elsewhere in the report fall outside the five (next section) | Add a footprint mechanism and generalise cargo to bonds |

## The five-mechanism architecture: keep it, extend it to seven

Keep the reduction, but build seven modules, not five. The report already relies on two behaviours its five mechanisms do not name: plant footprint overlap (zone of influence, contact-only seaweed allelopathy) and persistent associations (mutualistic symbionts, attached ticks, epibionts). A thin life-cycle layer is also needed above the modules, because several of your species change medium during their lives.

The strengths are real. Lafferty & Kuris' four dichotomies make one contact routine cover predation through parasitoidism. DomWorld makes aggression a two-parameter module. Kéfi's functional classes give every module a clean interface to population dynamics: each interaction modifies feeding, mortality or recruitment.

| Module | Covers | State it carries | Change I recommend |
| --- | --- | --- | --- |
| Contact | Predation, herbivory, hematophagy, brief parasitism, parasitoid oviposition, floral visits, cleaning | Lethality, victims per stage, contact duration, biomass moved | Keep. Use relative speed in encounter rates; split detection, approach and capture into states |
| Contest | Aggression, interference, kleptoparasitism, territoriality, mobbing | Dom, StepDom, radii, impulses, fight cost | Keep. Seed Dom from body mass; add a give-up time so contests cannot stall |
| Bond (was Cargo) | Seeds, burrs, phoronts, epibionts, attached ticks, pollen loads, and persistent symbionts | Partner, attach time, exit hazard, growth, per-tick flux (benefit or cost to each side) | Generalise cargo into a bond with a flux function. Mycorrhizae, coral–algae and lichen-like pairs are bonds, not repeated contacts |
| Occupancy | Nesting, oviposition, brood parasitism, roosts, redds | Substrate quality, capacity, occupants, egg cohorts, lifetime | Add creation and decay events, so excavators make cavities and tree death removes them |
| Field | Allelochemicals, scent marks, pheromone, odour plumes, kairomones, trails | Grid values, emission, decay, diffusion, product chains | Keep. Use exact decay; expose diffusion length L as the main dial |
| Footprint (new) | Plant–plant competition, shading, contact allelopathy, nurse-plant facilitation, epiphyte shading of hosts | Zone-of-influence radius from biomass, overlap partition rule | Add. Sessile organisms interact mainly through overlapping areas, which none of the five mechanisms models |
| Dispersal kernel (new) | Wind- and water-borne seeds, spores and algal propagules | Kernel family and parameters, advection by flow | Add. Your list says "dispersal" without restricting it to animals; the report covers only animal vectors |

Four further gaps sit outside the modules:

- **Life-cycle layer.** Mosquitoes, mayflies and caddisflies switch from aquatic larva to flying adult, and diving birds cross media within minutes. Each agent needs a stage machine that swaps its movement class, sensors and allowed interactions.
- **Energy and demography.** The report defers this to its earlier round. It is the glue that turns interaction events into population dynamics, so it must be explicit: intake, metabolic cost, reproduction, mortality.
- **Exploitative competition.** It needs no rule of its own. It emerges if plants and prey deplete when eaten, so resource bookkeeping must be exact.
- **Plant demography.** Growth, regrowth after grazing, seed set and microsite-dependent establishment are needed for dispersal and herbivory to feed back on plant populations.

## Coverage audit: interactions by species group

Aerial and terrestrial animals are well covered; aquatic animals and plant-side processes are where the report runs thin. "Strong" means rule plus parameters, "Partial" means a rule with few or \[P\] numbers, "Gap" means no rule or values.

| Interaction | Flying animals | Land animals | Aquatic animals | Plants, trees, algae | Biggest missing piece |
| --- | --- | --- | --- | --- | --- |
| Allelopathy (+/−) | Not applicable | Not applicable | Partial: seaweed–coral contact | Partial: field and hormesis curve, no constants | Release rates and diffusion coefficients |
| Aggression | Strong: mobbing, interspecific territoriality | Strong: DomWorld, scent territories | Partial: redd guarding only | Not applicable | Fish dominance and territorial rules |
| Predation | Strong: 3D allometry, starling escape | Strong: 2D allometry, selfish herd | Partial: fish-school escape carried over from earlier round | Not applicable | Strike success and detection distances per taxon |
| Dispersal | Strong: bird endozoochory | Strong: mammals, fur, ants | Partial: tambaqui, mallards | Partial: receiver side only | Abiotic kernels; spores and algal propagules |
| Epibiosis | Gap: phoretic mites on insects | Partial: phoresy, ticks | Strong: barnacles on turtles and whales | Partial: epiphyte metapopulations | Load cost to hosts; epiphytic algae shading seagrass |
| Hematophagy | Strong: mosquito five-stage cascade | Partial: host responses, tick ambush | Gap: leeches, lampreys | Not applicable | Leech, lamprey and vampire-bat movement |
| Herbivory | Partial: no insect intake rates | Strong: mammal bite allometry | Partial: grazing fish appear only as reef protectors | Partial: biomass removal, no regrowth | Insect and fish herbivory rates; plant regrowth |
| Symbiosis / mutualism | Partial: pollinators | Gap: ant–aphid tending | Partial: cleaner wrasse | Gap: mycorrhizae, coral–zooxanthellae | Persistent bonds and their flux functions |
| Nesting | Strong: cavity nest webs, bee quorum | Partial: dens as attractors | Partial: redds, penguin huddles | Strong as substrate: tree cavities | Burrow and den construction |
| Oviposition | Strong: egg load, polarotaxis traps | Partial | Strong: salmon redds, mayflies | Strong as substrate | Oviposition on algae and aquatic plants |
| Parasitism | Partial: parasitoids | Strong: ticks, parasitoids | Partial: trematode-altered killifish | Gap: hemiparasitic plants | Within-host load dynamics; plant parasites |
| Floral visitation | Strong: bees, adaptive foraging | Partial: walking visitors | Not applicable | Strong: reward refill | Pollen carryover; nectar secretion rates |

## Best conceptual inheritance, by category

If you read only eight cited papers first, read Couzin et al. 2002, Ginelli et al. 2015, Hildenbrandt et al. 2010, Hemelrijk 1999, Lafferty & Kuris 2002, Kéfi et al. 2012, Valdovinos 2025 and Hassell, Comins & May 1991. Together they give steering, state switching, validated flocking, contests, consumer semantics, interaction-to-dynamics mapping, pollination and the spatial persistence result your model must reproduce.

Each category lists the cited papers in rank order, then foundational papers the report does not cite. The uncited ones come from my own knowledge and are marked "verify" unless I checked them this session; confirm details before citing them.

### 1. Movement

| Rank | Cited paper | What to inherit |
| --- | --- | --- |
| 1 | Couzin et al. 2002 | Zones of repulsion, orientation and attraction; blind angle; turning-rate limit; all radii in body lengths. The base steering kernel for fish and birds |
| 2 | Ballerini et al. 2008 | Topological neighbourhood of about 7; a switch between metric and topological neighbour selection |
| 3 | Ginelli et al. 2015; Pillot et al. 2011 | A behavioural-state layer (graze, walk, run) above steering, with socially contagious switching |
| 4 | Torney et al. 2018 | Distance-weighted neighbours, and the method of fitting interaction rules to tracking data |
| 5 | Potts & Lewis 2014; Ranc et al. 2021 | Memory decay, home-range attractors, and the equivalence of step-selection and mechanistic movement kernels |
| 6 | Cardé & Willis 2008; Cummins et al. 2012 | Field-guided movement: surge upwind, cast crosswind, switch cues by range |

Not cited, add: Reynolds 1987, *Computer Graphics* 21(4) (boids; steering forces with max force and max speed, verify); Vicsek et al. 1995, *Phys Rev Lett* 75:1226 (alignment plus noise and the order parameter, checked); Nathan et al. 2008, *PNAS* 105:19052 (movement-ecology paradigm: internal state, motion capacity, navigation capacity, external factors, verify); Codling, Plank & Benhamou 2008, *J R Soc Interface* 5:813 (random-walk models, verify).

### 2. Biologically plausible collective behaviour

| Rank | Cited paper | What to inherit |
| --- | --- | --- |
| 1 | Hildenbrandt, Carere & Hemelrijk 2010 | Flight physics, topological neighbours and roost attraction, validated against starling data. The best template for a credible flying flock |
| 2 | Katz et al. 2011; Heras et al. 2019; Puy et al. 2024 | Rules inferred from fish data: speed regulation and attention to faster neighbours matter more than explicit alignment |
| 3 | Couzin et al. 2005; Strandburg-Peshkin et al. 2015 | Informed minorities steer groups; compromise below about 90° of disagreement, majority above |
| 4 | Buhl et al. 2006; Romanczuk et al. 2009 | Density-driven order; collective motion from escape and pursuit with no alignment term |
| 5 | Sumpter 2006; Conradt & Roper 2005 | Positive feedback, quorum thresholds and consensus as general design principles |
| 6 | Attanasi et al. 2014; Sayin et al. 2025 | Counter-examples: swarms without order, and cognitive choice replacing alignment. Keep alignment optional per class |

Not cited, add: Sumpter 2010, *Collective Animal Behavior*, Princeton (verify); Herbert-Read et al. 2011, *PNAS* 108:18726 (rules inferred from mosquitofish, verify).

### 3. Ecological agents and emergent population dynamics

| Rank | Cited paper | What to inherit |
| --- | --- | --- |
| 1 | Hassell, Comins & May 1991 | Local movement makes unstable host–parasitoid dynamics persist as waves and patterns. The headline emergent result to reproduce |
| 2 | Railsback et al., inSALMO 7 | A fully specified, documented IBM: habitat cells, daily ticks, spawning and redd rules. A structural template |
| 3 | Goss-Custard et al. 2006 | A behaviour-based IBM that predicted population mortality after habitat loss (3.65% vs 3.17% observed) |
| 4 | Weiner et al. 2001; Schwinning & Weiner 1998; Berger et al. 2008 | Zone-of-influence plant IBMs and size-asymmetric competition |
| 5 | Morales & Carlo 2006; Jones et al. 2017 | Emergent dispersal kernels from animal movement plus retention time |
| 6 | Tardy et al. 2022; Magori et al. 2009; Eckhoff 2011 | Vector and parasite ABMs on daily steps with stage machines |
| 7 | Rall et al. 2012; Pawar et al. 2012; Kalinkat et al. 2013 | Allometric generators for attack rate and handling time, so parameters are not hand-tuned |
| 8 | Kerr et al. 2002 | Local interaction preserves diversity; global mixing destroys it |

Not cited, add: DeAngelis & Mooij 2005, *Annu Rev Ecol Evol Syst* 36:147 (verify); Grimm & Railsback 2005, *Individual-based Modeling and Ecology*, Princeton (verify); Brose, Williams & Martinez 2006, *Ecol Lett* 9:1228 (allometric trophic network, a population-level benchmark, verify); Brown et al. 2004, *Ecology* 85:1771 (metabolic theory for energy budgets, verify).

### 4. Non-trophic interaction semantics

| Rank | Cited paper | What to inherit |
| --- | --- | --- |
| 1 | Kéfi et al. 2012 | Classify each non-trophic interaction by the dynamic parameter it changes: feeding, mortality or recruitment |
| 2 | Lafferty & Kuris 2002 | Four yes/no questions that define every consumer strategy, including micropredation |
| 3 | OBO RO release file; Poelen et al. 2014 (GloBI) | Identifiers, inverse relations, implied relations and the import pitfalls (vector collision) |
| 4 | Holland, DeAngelis & Bronstein 2002 | Benefit as a saturating or unimodal function of partner density |
| 5 | Wahl 2008; Bartlow & Agosta 2021 | Epibiosis as a modifier of host–environment exchange; phoresy as dispersal |
| 6 | Buck, Weinstein & Young 2018 | Non-consumptive effects of parasites, which can exceed consumption |
| 7 | Jones, Lawton & Shachak 1994 | Ecosystem engineering, which underlies cavity creation |

Not cited, add: Lafferty et al. 2008, *Ecol Lett* 11:533 (parasites in food webs, verify); Bruno, Stachowicz & Bertness 2003, *TREE* 18:119 (facilitation in theory, verify); Bertness & Callaway 1994, *TREE* 9:191 (original stress-gradient hypothesis, verify); Lima & Dill 1990, *Can J Zool* 68:619 (non-lethal predator effects, verify).

### 5. Multilayer network architecture

This is the report's weakest category: it cites the conceptual paper but not the multilayer literature itself.

| Rank | Cited paper | What to inherit |
| --- | --- | --- |
| 1 | Miele et al. 2019 | Six non-trophic types running in one multiplex bioenergetic model. The nearest cited implementation |
| 2 | Kéfi et al. 2012 | Layer semantics by modified parameter |
| 3 | Dunne et al. 2013 | Parasite layer coupling, including concomitant links |
| 4 | Bastolla et al. 2009 | Mutualistic layer structure and its effect on coexistence |
| 5 | Cockle & Martin 2015; Naranjo et al. 2019 | Temporal nest-web layers; epiphyte layer structure as validation targets |

Not cited, add (the most important additions in this review): Kéfi et al. 2016, *PLoS Biol* 14:e1002527 (trophic, positive and negative layers, open data; checked); Kéfi et al. 2015, *Ecology* 96:291 (the underlying Chilean data, checked via citation); Pilosof et al. 2017, *Nat Ecol Evol* 1:0101 (intra- and inter-layer edges, the formal vocabulary; checked via citation); Pocock, Evans & Memmott 2012, *Science* 335:973 (a farm "network of networks" joining pollination, seed dispersal, herbivory and parasitism, the closest empirical match to your list, verify); Fontaine et al. 2011, *Ecol Lett* 14:1170 (merging network types, verify); Mougi & Kondoh 2012, *Science* 337:349 (mixing interaction types and stability, verify).

### 6. Swarm predator–prey mechanics

| Rank | Cited paper | What to inherit |
| --- | --- | --- |
| 1 | Papadopoulou et al. 2026; Hildenbrandt et al. 2010 | Mechanistic collective escape in starling flocks (2026 paper unverified by me) |
| 2 | Ling et al. 2019 | Prey attacking predators: a switch from topological to metric neighbours plus a harmonic pull to the predator |
| 3 | King et al. 2012 | Selfish-herd centre attraction under threat, measured in sheep |
| 4 | Strömbom et al. 2014; Jadhav et al. 2024 | The collect-and-drive heuristic for a predator or dog pushing a flock |
| 5 | Romanczuk et al. 2009; Bazazi et al. 2008 | Escape and pursuit inside the group, driven by cannibalism |
| 6 | Cummins et al. 2012; Côté & Poulin 1995; Rubenstein & Feinstein 2021 | Grouping against flying parasites: attack abatement and dilution |
| 7 | Lafferty & Morris 1996 | Parasites raising a host's predation risk: a cross-layer coupling |

Not cited, add: Hamilton 1971, *J Theor Biol* 31:295 (selfish herd and domain of danger, verify); Ioannou, Guttal & Couzin 2012, *Science* 337:1212 (predators select for coordinated prey, verify); Olson et al. 2013, *J R Soc Interface* 10:20130305 (predator confusion, verify); Holling 1959, *Can Entomol* 91:385 (functional response, verify).

### 7. Plant–pollinator subsystem

| Rank | Cited paper | What to inherit |
| --- | --- | --- |
| 1 | Valdovinos 2025 | Consumer–resource pollination with refilling rewards, visit quality and adaptive foraging, with a parameter table |
| 2 | BEE-STEWARD 2025 | Trip-level forager: distance, velocity, per-flower handling from corolla depth and patch filling |
| 3 | Holland & DeAngelis 2001; Holland et al. 2002 | Benefit saturation, and the unimodal case when pollinators also eat ovules |
| 4 | Bastolla et al. 2009 | Nestedness as structure and validation pattern |
| 5 | Osborne et al. 1999; Charnov 1976 | Foraging range, flower constancy and the marginal-value patch-leaving rule |

Not cited, add: Valdovinos et al. 2013, *Oikos* 122:907 (the original adaptive-foraging model, verify); Valdovinos et al. 2016, *Ecol Lett* 19:1277 (niche partitioning via adaptive foraging, verify); Bascompte et al. 2003, *PNAS* 100:9383 (nestedness of mutualistic networks, verify); Becher et al. 2014, *J Appl Ecol* 51:470 (BEEHAVE, verify).

### 8. Pattern-oriented modelling

The report practises pattern-oriented modelling in its validation table but never cites the method.

| Rank | Cited paper | What to inherit |
| --- | --- | --- |
| 1 | Goss-Custard et al. 2006 | Test an IBM against a population pattern it was not fitted to |
| 2 | Railsback et al., inSALMO 7 | Documentation discipline from the group that formalised the method |
| 3 | Hemelrijk 1999; Izar et al. 2021 | One model reproducing several patterns at once, then confirmed in the field |
| 4 | Grether et al. 2020; Kovalev et al. 2021 | Quantitative fit criteria: share of outcomes matched; KS test on nearest-neighbour distances |
| 5 | Giuggioli et al. 2011; Ginelli et al. 2015 | Dynamic patterns (takeover lag, avalanche regrouping) as validation targets |

Not cited, add: Grimm et al. 2005, *Science* 310:987 (pattern-oriented modelling, verify); Wiegand et al. 2003, *Oikos* 100:209 (POM to reveal hidden information, verify); Grimm et al. 2020, *JASSS* 23(2):7 (ODD protocol update, verify); Hartig et al. 2011, *Ecol Lett* 14:816 (statistical inference for stochastic simulators, for calibrating the \[P\] parameters, verify).

## Core equations for implementation

About thirty equations implement all seven modules. Each is tagged with its source and status: "published" (in the cited paper), "report synthesis", or "template" (my generic form, to be fitted). Keep SI units internally and steering radii in body lengths (BL), then scale per species.

### A. Time stepping and rates

Semi-implicit Euler with a speed clamp, for every mobile agent:

```latex
\mathbf{v}_{t+\Delta t} = \mathrm{clamp}\left(\mathbf{v}_t + \mathbf{a}_t\,\Delta t,\ v_{\min},\ v_{\max}\right), \qquad \mathbf{x}_{t+\Delta t} = \mathbf{x}_t + \mathbf{v}_{t+\Delta t}\,\Delta t
```

Convert every rate (switching, detachment, mortality, host finding) to a per-step probability:

```latex
p = 1 - e^{-r\,\Delta t}
```

Use this rather than p = rΔt whenever rΔt exceeds about 0.1. If simulated time is compressed by a factor s, multiply ecological rates by s and leave movement speeds alone.

### B. Steering

Reynolds-style steering sum (Reynolds 1987, not cited in the report). Each behaviour k proposes a desired heading; the force is the truncated difference from current velocity:

```latex
\mathbf{a}_i = \frac{1}{m_i}\sum_k w_k\,\mathrm{trunc}\left(v_{\max}\,\hat{\mathbf{d}}_k - \mathbf{v}_i,\ F_{\max}\right)
```

Couzin zonal rule (Couzin et al. 2002, published). Repulsion overrides everything; otherwise orientation and attraction are averaged, or either is used alone if the other zone is empty:

```latex
\mathbf{d}_i = \begin{cases} -\displaystyle\sum_{j \in Z_r} \frac{\mathbf{r}_{ij}}{\lVert \mathbf{r}_{ij} \rVert} & Z_r \neq \varnothing \\[2ex] \dfrac{1}{2}\left( \displaystyle\sum_{j \in Z_o} \frac{\mathbf{v}_j}{\lVert \mathbf{v}_j \rVert} + \displaystyle\sum_{j \in Z_a} \frac{\mathbf{r}_{ij}}{\lVert \mathbf{r}_{ij} \rVert} \right) & \text{otherwise} \end{cases}
```

Turn toward d\_i by at most θ·τ per step (θ = 40°/s, τ = 0.1 s), with r\_r = 1 BL and a 270° field of view.

Vicsek alignment with noise, and the polarisation order parameter used for validation (Vicsek et al. 1995, not cited):

```latex
\theta_i(t+\Delta t) = \arg\Big(\sum_{j \in N_i} e^{\,\mathrm{i}\,\theta_j(t)}\Big) + \eta\,\xi_i, \qquad \varphi = \frac{1}{N}\Big\lVert \sum_i \hat{\mathbf{v}}_i \Big\rVert
```

Neighbour selection has three modes: metric (radius r), topological (k nearest; about 7 for starlings, 4–6 for baboons) and distance-weighted (Torney et al. 2018, published):

```latex
w_{ij} = \exp\left(-\frac{d_{ij}}{\lambda}\right)
```

Escape and pursuit without alignment (after Romanczuk et al. 2009; simplified template). Pursue neighbours ahead, flee those closing from behind:

```latex
\mathbf{a}_i^{\mathrm{ep}} = \mu_p \sum_{j \in \mathrm{front}} \hat{\mathbf{r}}_{ij} \;-\; \mu_e \sum_{j \in \mathrm{rear},\ \dot d_{ij} < 0} \hat{\mathbf{r}}_{ij}
```

Spring-tethered mating swarm (Butail et al. 2013, published). Use ω\_n = 2π × 0.8–1.0 Hz with ζ ≈ 0.5 horizontally, and 2π × 0.41 Hz with ζ ≈ 1.4 vertically:

```latex
\ddot{\mathbf{x}}_i = -\omega_n^2\,(\mathbf{x}_i - \mathbf{c}) - 2\zeta\omega_n\,\dot{\mathbf{x}}_i + \sigma\,\boldsymbol{\xi}_i
```

For the selfish herd under threat, add a centroid pull whose weight rises with threat level (King et al. 2012; Hamilton 1971).

### C. Behavioural state switching

Follower departure rate in sheep (Pillot et al. 2011, published), with D departed and S still stationary:

```latex
\mu = \alpha\,\frac{D^{\beta}}{S^{\gamma}} \qquad (\alpha = 0.19\ \mathrm{s^{-1}},\ \beta = 1.16,\ \gamma = 0.6)
```

Unified switching rate for any class (report synthesis; fit β and γ per class):

```latex
r_{a \to b} = r_0\,\frac{(1 + \alpha\,n_b)^{\beta}}{(1 + n_{\neg b})^{\gamma}}
```

Quorum as a steep Hill switch (template). Q is about 10–15 scouts for honeybees and about 4 of 24 for whirligig flash expansion; large k approaches a hard threshold:

```latex
P(\mathrm{commit}) = \frac{n^{k}}{n^{k} + Q^{k}}
```

### D. Encounters and consumption

Encounter rate with mean relative speed (Gerritsen & Strickler 1977, not cited; verify). Here v is the faster speed and u the slower, with random 3D headings. Explicit proximity checks do this automatically; the formula is needed when movement is coarse-grained:

```latex
\lambda_{2D} = 2r\,\bar v_{\mathrm{rel}}\,\rho, \qquad \lambda_{3D} = \pi r^{2}\,\bar v_{\mathrm{rel}}\,\rho, \qquad \bar v_{\mathrm{rel}} = \frac{u^{2} + 3v^{2}}{3v}\ \ (v \ge u)
```

Functional responses: generalised Holling (q = 0 is type II; q = 0.2–1 is type III, used when consumer mass is much larger than prey mass, after Kalinkat et al. 2013) and Beddington–DeAngelis interference (published forms):

```latex
f(R) = \frac{a R^{q+1}}{1 + a h R^{q+1}}, \qquad f_{\mathrm{BD}}(R,P) = \frac{aR}{1 + ahR + cP}
```

Allometric and temperature generator for attack rate and handling time (Rall et al. 2012; exponents \[P\]). Use E\_a = 0.44 eV, E\_h = −0.27 eV, k = 8.617 × 10⁻⁵ eV/K, and group intercepts from Rall's table after checking units:

```latex
a = a_0\,M_C^{0.47}\,M_R^{0.15}\,e^{E_a (T - T_0)/(k T T_0)}, \qquad h = h_0\,M_C^{-0.48}\,M_R^{0.34}\,e^{E_h (T - T_0)/(k T T_0)}
```

In the agent model, a becomes detection radius × relative speed × capture probability, and h becomes a handling-state timer.

Mammalian herbivory (Shipley et al. 1994; Spalinger & Hobbs 1992). Bite size scales with body mass; dense swards are chewing-limited; sparse plants are encounter-limited. The sparse form below restores bite mass S, which the report's version lacks (verify against the 1992 paper):

```latex
S_{\max} = s_0\,M^{0.72}, \qquad I_{\mathrm{dense}} = \frac{R_{\max}\,S}{S + \beta}, \qquad I_{\mathrm{sparse}} \approx S\,\frac{v\,w\,D}{1 + h\,v\,w\,D}
```

### E. Contests

DomWorld (Hemelrijk 1999, published structure; parameter values \[P\]). The loser's Dom falls by the same amount; the winner chases about 1 unit and the loser flees about 2:

```latex
P_i = \frac{\mathrm{Dom}_i}{\mathrm{Dom}_i + \mathrm{Dom}_j}, \qquad w_i = \mathbf{1}\left[P_i > U(0,1)\right], \qquad \mathrm{Dom}_i \leftarrow \max\left(0.01,\ \mathrm{Dom}_i + (w_i - P_i)\,\mathrm{StepDom}\right)
```

Interference at food patches, with competitor density ρ and attack distance D\_A (Rappoldt et al. 2010, \[P\]):

```latex
P(\mathrm{attacked}) = 1 - e^{-\pi \rho D_A^{2}}
```

Two decision rules complete the module. Steal from a handler when ν\_f·f·t\_h < 1 (Broom & Ruxton 1998, reconstructed, \[P\]). Escalate with probability V/C when injury cost C exceeds resource value V (hawk–dove).

### F. Bonds (cargo, attachment, symbiosis)

Gut retention time is gamma-distributed: shape 4 with the mean set to 15–480 min (Jones et al. 2017), or shape about 2.7 for mallards. Detachment uses the per-step probability from section A, with λ ≈ 0.013–0.031 per day for turtle barnacles. Epibiont growth follows von Bertalanffy (Poyatos et al. 2025):

```latex
L(t) = L_\infty\left(1 - e^{-k\,(t - t_0)}\right) \qquad (L_\infty = 59.5\ \mathrm{mm},\ k = 0.0091\ \mathrm{d^{-1}})
```

Host speed under epibiont load at constant propulsive power (physics; choose by Reynolds number):

```latex
\frac{v}{v_0} = \left(\frac{C_dA}{(C_dA)_0}\right)^{-1/3} \text{ (inertial)}, \qquad \frac{v}{v_0} = \left(\frac{C_dA}{(C_dA)_0}\right)^{-1/2} \text{ (viscous)}
```

Bond benefit per tick as a saturating function of partner quantity P (Holland et al. 2002, published), with a quadratic cost as a unimodal template:

```latex
B(P) = \frac{B_{\max}\,P}{K + P}, \qquad B_{\mathrm{net}}(P) = \frac{B_{\max}\,P}{K + P} - c\,P^{2}
```

Pollen carryover (generic exponential carryover; verify against the pollination literature). The k-th flower after pickup receives this share of load P₀, so visit quality σ emerges instead of being fixed:

```latex
\mathrm{deposit}_k = d\,(1 - d)^{k-1}\,P_0
```

### G. Occupancy

Site suitability that falls as a site fills, with residents' depression of value for despotic species, and a soft choice among sites (template after Fretwell & Lucas 1970):

```latex
S_i(n_i) = Q_i\left(1 - \frac{n_i}{K_i}\right) - \delta\,n_i^{\mathrm{res}}, \qquad P(i) = \frac{e^{\kappa S_i}}{\sum_j e^{\kappa S_j}}
```

Egg-load acceptance (template; direction from Heimpel et al. 1996): females accept a site of quality q when q ≥ θ\_max·(1 − E/E\_max), so low egg load E means choosier females.

### H. Fields

Explicit reaction–diffusion on a grid, with exact decay. Keep D·Δt/Δx² ≤ 1/4, set λ = ln 2 / half-life, and treat the diffusion length L = √(D/λ) as the main user dial:

```latex
C^{t+\Delta t}_{x,y} = e^{-\lambda\Delta t}\left[C^{t}_{x,y} + \frac{D\,\Delta t}{\Delta x^{2}}\left(C_{x+1,y} + C_{x-1,y} + C_{x,y+1} + C_{x,y-1} - 4C_{x,y}\right)\right] + S_{x,y}\,\Delta t
```

For soil legacies, chain two layers: the parent's decayed mass feeds the product layer. DIBOA (half-life 43 h) yields BOA (2.5 d), which yields persistent APO (Macías et al. 2005).

Dose–response read by every receiver (Brain–Cousens with c = 0, d = 1; closed-form peak derived here):

```latex
R(C) = \frac{1 + f\,C}{1 + (C/e)^{b}}, \qquad R_{\max}\big|_{b=2,\ e=1} = \frac{1 + \sqrt{1 + f^{2}}}{2}
```

In lattice form, a susceptible plant's death rate is h = 1 + γ·f, where f is the local fraction of allelopaths (Lanchier & Mercer 2023).

Ant trail choice at a fork (Deneubourg and colleagues, \[P\]):

```latex
P_A = \frac{(k + A)^{n}}{(k + A)^{n} + (k + B)^{n}} \qquad (k \approx 20,\ n \approx 2)
```

Mosquito plume tracking is a state rule rather than an equation: surge upwind while CO₂ exceeds ambient by 0.2 ppm, cast crosswind in 0.5–0.9 s legs when it does not, switch to visual approach within 5–15 m, and land within 0.5 m (Cummins et al. 2012; van Breugel et al. 2015).

### I. Plants and footprints

Zone-of-influence growth (template after Weiner et al. 2001 and Schwinning & Weiner 1998; verify their exact forms). Overlapped area is split by size raised to p: p = 0 gives equal shares, p = 1 size-proportional shares, large p near-total asymmetry:

```latex
\frac{dB_i}{dt} = r\,A_i^{\mathrm{eff}}\left(1 - \frac{B_i}{B_{\max}}\right), \qquad A_i^{\mathrm{eff}} = A_i^{\mathrm{free}} + \sum_{o} A_o\,\frac{B_i^{\,p}}{\sum_{j \in o} B_j^{\,p}}, \qquad A_i \propto B_i^{2/3}
```

Nurse-plant facilitation raises water infiltration with nurse biomass n (Díaz-Sierra et al. 2024, published):

```latex
I(n) = \frac{\beta n + i_0}{\beta n + 1}
```

### J. Floral rewards and adaptive foraging

Per-flower nectar standing crop refills toward β/φ and loses a fraction b per visit (Valdovinos 2025: β = 0.2, φ = 0.04, b = 0.4). Use the exact solution so long ticks do not overshoot:

```latex
R(t+\Delta t) = \frac{\beta}{\phi} + \left(R(t) - \frac{\beta}{\phi}\right)e^{-\phi\Delta t}, \qquad R \leftarrow (1 - b)\,R \ \text{ per visit}
```

Adaptive foraging effort (replicator form after Valdovinos et al. 2013; verify). In the agent version, α\_ij is pollinator i's seek weight toward plant species j, which rises when j's recent reward beats the agent's average:

```latex
\frac{d\alpha_{ij}}{dt} = G\,\alpha_{ij}\left(\tau_j\,b\,R_j - \sum_k \alpha_{ik}\,\tau_k\,b\,R_k\right)
```

### K. Population-level checks

Nicholson–Bailey, run per patch with local dispersal to reproduce Hassell, Comins & May 1991:

```latex
H_{t+1} = \lambda H_t\,e^{-aP_t}, \qquad P_{t+1} = c\,H_t\left(1 - e^{-aP_t}\right)
```

Bioenergetic food-web model, for comparing summed agent biomass against theory (Yodzis & Innes 1992; Brose et al. 2006; not cited, verify):

```latex
\frac{dB_i}{dt} = r_i G_i B_i - x_i B_i + \sum_j x_i y_{ij} B_i F_{ij} - \sum_k \frac{x_k y_{ki} B_k F_{ki}}{e_{ki}}
```

Non-trophic modifier applied to a growth, feeding or mortality parameter θ (template in the spirit of Kéfi et al. 2016 and Miele et al. 2019; check their exact forms). δ > 0 facilitates and δ < 0 inhibits:

```latex
\theta_i' = \theta_i\left(1 + \delta_\theta\,\frac{\sum_j A^{\theta}_{ij} B_j}{B_0 + \sum_j A^{\theta}_{ij} B_j}\right)
```

### L. Validation metrics

Alongside polarisation φ (section B), compute group milling, connectance C = L/S² of the logged interaction network, nearest-neighbour distance distributions, nestedness and hierarchy steepness:

```latex
m = \frac{1}{N}\Big\lVert \sum_i \hat{\mathbf{r}}_{ic} \times \hat{\mathbf{v}}_i \Big\rVert
```

## Running it in Grasshopper and Rhino 8

Run the simulation as a compiled engine that Grasshopper only configures and displays. The report's four clocks cannot run at full resolution any other way: one simulated day is 4.32 million steps at 0.02 s and 1.73 million at 0.05 s.

&#91;embedded content: simulator architecture · inputs, engine, seven modules, outcomes, outputs\]

Read top-down: Rhino geometry and two tables feed one engine, which calls seven modules; their outcomes update agent state each ecological tick (left arrow) and are logged as a multilayer network.

Seven practices make this feasible:

- **Coarse-grain time.** Run fine-step movement in short episodes within each ecological tick, then carry forward the encounter rates, states and positions. Between episodes, displace agents with movement kernels fitted to the fine-step model.
- **Step each class on its own clock.** Only classes whose clock fires are updated; daily processes advance on the ecological tick.
- **Use a spatial hash.** A uniform grid with cell size equal to the largest interaction radius turns neighbour search from O(N²) into roughly O(N). RhinoCommon's RTree works for static substrates such as trees and cavities.
- **Keep state out of Grasshopper data trees.** Hold agents in C# arrays that persist across solutions, in the Rhino 8 Script component or a compiled plugin. Draw through preview or a display conduit rather than baking geometry each frame.
- **Prototype in Python, ship in C#.** Rhino 8's CPython is convenient for testing rules; port hot loops (steering, neighbour queries, diffusion) to C#.
- **Put fields on a regular grid.** Rasterise water, land and designed surfaces from Rhino geometry into habitat masks. Diffusion on irregular meshes needs a graph Laplacian with its own stability limit.
- **Make runs reproducible.** Seed the random generator and log every parameter per run, so pattern-oriented calibration can be repeated.

Culebra and Quelea implement boids-style agents in Grasshopper and are worth inspecting for code patterns. I have not checked their Rhino 8 compatibility.

## Parameter verification priorities and build roadmap

Verify ten parameter sets before hard-coding them, then build in six phases, each closed by a published pattern. Verification order follows how many modules depend on each set.

| Priority | Parameter set | Status in report | Used by | What to check |
| --- | --- | --- | --- | --- |
| 1 | Rall et al. 2012 attack and handling regressions | \[P\], via summary | Contact, for every consumer | Group intercepts, units, log base, temperature reference |
| 2 | Ginelli et al. 2015 rate functions | Reconstructed | Herd state switching | Exact rate forms in Methods; whether α applies to walk and run alike |
| 3 | DomWorld radii and StepDom | \[P\]; PersSpace 2 vs 8 conflict | Contest | Original 1999 table; whether sex-specific StepDom is from 1999 or later papers |
| 4 | Spalinger & Hobbs sparse-bite equation | \[P\] | Herbivory | Original form and the missing bite-mass term |
| 5 | Couzin & Franks 2003 ant values | \[P\] | Trail ants, field | Zone sizes, speed, pheromone diffusion |
| 6 | Buhl et al. 2006 density thresholds and model | \[P\] | Marching insects, validation | 17.7 and 73.8 per m²; model speed and range |
| 7 | Miele et al. 2019 intensities | \[P\] | Non-trophic modifiers | Functional forms, not only ranges |
| 8 | Valdovinos 2025 parameter table | \[V\] | Pollination | Per-plant vs per-flower scaling of β |
| 9 | Broom & Ruxton 1998 threshold | Reconstructed | Kleptoparasitism | Fight-time terms in the condition |
| 10 | Allelochemical release and diffusion | Absent | Field | No source exists; calibrate against the intermediate-diffusion diversity peak |

Build in this order, and do not start a phase until the previous phase reproduces its pattern:

1. **Engine and steering.** Scheduler, spatial index, Couzin and Vicsek kernels, three neighbour modes. Gate: Couzin's swarm, torus and parallel states, and Buhl's density transition.
2. **Herd states and collective decisions.** Contagious switching, quorum, leadership. Gate: Ginelli's avalanche regrouping and Strandburg-Peshkin's 90° compromise rule.
3. **Contact and contest.** Allometric encounters, functional responses, DomWorld. Gate: hierarchy steepness rising with StepDom; type II to III shift with mass ratio.
4. **Fields and footprints.** Grid diffusion, hormesis, zone-of-influence plants, trails and scent. Gate: diversity peaking at intermediate diffusion; territories with takeover lag.
5. **Bonds, occupancy and dispersal.** Retention times, epibionts, cavities, egg load, abiotic kernels. Gate: emergent seed kernels in published ranges; one-year excavator lag in nest webs.
6. **Pollination, life cycles and full coupling.** Rewards, adaptive foraging, pollen carryover, stage machines, energy budgets. Gate: Hassell spatial persistence; nested pollination networks; harassment tightening herds.

## Sources checked this session

- [Gómez & Espadaler 2013, Ecography 36:1193](https://doi.org/10.1111/j.1600-0587.2013.00289.x)
- [Yun et al. 2026, Insects 17:677](https://doi.org/10.3390/insects17070677)
- [Buhl et al. 2006 on JSTOR](https://www.jstor.org/stable/3846386) and the [PubMed record listing "Buhl C"](https://pubmed.ncbi.nlm.nih.gov/16741102/)
- [Mezzalira et al. 2017, J Anim Ecol](https://besjournals.onlinelibrary.wiley.com/doi/10.1111/1365-2656.12698) (Spalinger & Hobbs process 3)
- [Kéfi et al. 2016, PLoS Biol 14:e1002527](https://journals.plos.org/plosbiology/article?id=10.1371%2Fjournal.pbio.1002527) and its [Dryad data](https://datadryad.org/dataset/doi:10.5061/dryad.b4vg0)

All other judgements rest on the attached report, my own arithmetic, and my knowledge to June 2026; papers marked "verify" above were not opened.
