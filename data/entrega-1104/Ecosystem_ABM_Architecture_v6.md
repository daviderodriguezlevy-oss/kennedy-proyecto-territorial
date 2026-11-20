# Ecosystem ABM — Architecture Specification v6

**Status:** Proposed implementation baseline; architecture reviewed, runtime not yet implemented or benchmarked.  
**Date:** 4 October 2026.  

This is a complete architectural proposal, not an executable C# implementation. Schemas and pseudocode specify contracts. No biological calibration, performance result, or full StarDisplay reproduction is claimed.


### 0.1 Evidence labels

- **[PUB]**: originates in a published source; not an implementation certification.
- **[SYN]**: design synthesis proposed for this engine.
- **[TPL]**: illustrative formula, schema, or approximation.
- **[CHK]**: unresolved source, unit, or applicability question.

For every enabled submodel, record: origin, transcription, applicability, numerical implementation, and empirical support. Each field has a status, evidence pointer, responsible version, and unresolved items.

An unresolved item that changes an executable equation, its units, or domain blocks that submodel in a research configuration. A parameter deliberately explored without ecosystem data is allowed as a declared hypothesis or prior, not mislabeled as empirically supported.

ODD documents the selected model and its rationale; it does not establish that a proposed implementation is correct [R1].


### 0.2 Contract tiers [SYN]

A contract binds when its capability first appears, even if that happens earlier than the indicative roadmap stage. Implement its smallest sufficient form first; full generality is not an entry requirement.

| Tier | Required by | Scope |
|---|---|---|
| **A — baseline foundation** | Stage 2 exit for its enabled processes; extended at Stage 3 | Stable identities; single ownership; pure reads; integer time and event identity; search/handling state; a serial atomic resolver; declared accounting currency; logical random addresses; quiescent checkpoint; I01–I05, I08–I09, I11, I14 |
| **B — spatial and process capabilities** | When each capability is added, including simple motion in Stage 2 | Query completeness and contact semantics; preference versus feasibility; typed relations if present; field bounds and exchanges if present; I06 and applicable parts of I10 |
| **C — optional acceleration or detail** | Before enabling the relevant capability | Buffered-query cache bounds; private substep coupling; independent synchronization groups; coarse kernels, bridges and reconstruction certificates; representation conversion; detailed-flight source gate; I07, I12–I13 where applicable |

Event localization is required whenever a configured rule needs an effect inside an interval. It is not optional merely because the rest of a build is Tier A. The first slice may use explicitly declared boundary-time ecological events with timestep convergence tests. It may use brute-force queries and a single motion step without caches, local stepping, fields, or coarse modes.

Shared correctness rules apply across tiers: an optimization cannot relax atomicity, accounting, causal order, or input validity. Capability validation rejects a configuration whose required contract is absent.

## 1. Scientific scope and operating profiles

The engine supports aerial, terrestrial, aquatic, semi-aquatic, sessile, colonial, and aggregated organisms. Species and stages select capabilities. Birds need not flock; plants need not move; a stage may change realm without becoming a different biological individual.

The questions, target patterns, domains, population representation, observation scale, and acceptable numerical/approximation error are selected before configuration.

Three operating profiles prevent advanced approximations from becoming prerequisites for the first working model:

| Profile | Purpose | Enabled behavior |
|---|---|---|
| Baseline research | Establish a reproducible reference for a stated scenario | Explicit mobile agents, fixed representation per population, declared multirate processes, shared synchronization boundaries |
| Validated hybrid research | Extend duration or abundance within a tested domain | Approved coarse movement, count/flux models, and optional representation adapters |
| Exploratory preview | Inspect scenarios interactively | Explicitly declared approximations; outputs labeled exploratory and never silently mixed into research results |

“Baseline” means an implementation reference, not ecological truth. Both the baseline and its approximations need empirical evaluation. A coarse model can agree with an incorrect explicit model.

### 1.1 Required experiment specification

The configuration contains:

- Research questions and measurable POM targets.
- Species, stages, initial populations, and representation choices.
- Habitat geometry, coordinate reference, units, boundaries, and external forcing.
- Enabled interactions and their evidence status.
- Numerical tolerances, validity domains, and approximation budgets.
- Initial conditions, warm-up policy, replicate seeds, and held-out observations.
- Requested simulated duration and performance envelope.

Temporal LOD, biological state, representation resolution, and motion fidelity are separate axes:

| Axis | Examples |
|---|---|
| Biological state | Resting, feeding, migrating, breeding |
| Representation | Individual, cohort, patch, colony, field |
| Temporal mode | Kinematic, coarse, inactive |
| Motion model/fidelity | Turn-limited, inertial, detailed flight |

Do not infer one axis from another. A resting animal can drift; an individual need not use detailed flight; a cohort need not have a spatially uniform state.

### 1.2 Baseline workload and feasibility [SYN]

Count motion updates before estimating runtime. For a group with constant population and step:

~~~text
motion-updates = active mobile population × active simulated duration / motion step
~~~

| Illustrative workload | Motion updates |
|---|---:|
| 2,000 birds, 30 minutes, 5 ms | 7.20 × 10⁸ |
| 1,000 agents, 1 day, 50 ms | 1.728 × 10⁹ |
| 10,000 agents, 30 days, 50 ms | 5.184 × 10¹¹ |
| 10,000 agents, 365 days, 50 ms | 6.3072 × 10¹² |

These are arithmetic workloads, not runtime predictions. Sum over changing populations, activity periods, and step sizes. Decision evaluations, candidate queries, protocol events, fields, bookkeeping, and output have separate counts and costs. A private motion substep is not equivalent to an agent update that performs all those operations.

Measure end-to-end simulated time per wall-clock second for a representative configuration, then estimate warm-up, replicates, checkpoints, and parameter sweeps. Stage 2 supplies an initial measurement for its own simple scene; it does not establish flock, field, or high-density throughput.

Inactive locomotion can eliminate self-propelled motion work, but physiology, transport, detection, fields, and scheduled events may remain. Annual runs are not categorically impossible, and week-long runs are not categorically affordable. Approve the requested experiment against a measured workload and budget (§16). If it is too expensive, narrow the experiment, use an appropriate fixed representation, or validate an approximation.

### 1.3 Windowed experiments and continuous bridges [SYN]

Keep two different experiment types explicit:

| Design | Interpretation |
|---|---|
| **Sampled explicit windows** | Estimate behavior or rates under declared dates, states, and forcing. Each window has a justified initial-state distribution. The unobserved periods are not simulated; no continuous seasonal trajectory is claimed. Report sampling coverage and uncertainty. |
| **Windows connected by a bridge model** | Evolve the population and resources between windows using a reduced model, then reconstruct unresolved state. This is a hybrid approximation requiring a bridge certificate and a reconstruction certificate, which may share one evidence record. Until validated it is exploratory. |

A bridge is a coarse model even if implemented as rate equations inside existing physiology and demography systems. It may be cheaper to develop than general per-encounter kernels, but it does not remove their scientific validation problem.

For a continuous hybrid experiment:

1. **Define retained state and boundaries.** Retain the stocks, counts, reserves, life stages, sites, forcing, and relation state needed by the bridge. Close explicit exposures exactly once when switching. Define how handling and other ongoing episodes cross a boundary.
2. **Define conditional processes.** Specify units, denominators, state dependence, estimation uncertainty, and validity domains for each rate. A mortality hazard, per-visit success probability, biomass flux, and displacement distribution are different objects (§6). Preserve important feedback through density, food depletion, season, and forcing; do not extrapolate one mean rate across a changing ecosystem.
3. **Advance coupled accounts.** Intake debits available food; demographic changes update counts, biomass, and relations; production and respiration use declared boundaries. Disturbances and rare events relevant to the research question need an explicit bridge mechanism. Zero observations do not demonstrate zero hazard.
4. **Reconstruct conditionally.** Retain available positions, velocities, group/site membership, cargo, and history. Any unresolved state is sampled from a declared conditional kernel. Check habitat access, capacities, spatial correlations, and switching transients. Repositioning alone cannot recreate an unmodeled dispersal process.
5. **Validate the inference.** Compare distributions and target metrics against continuous explicit runs over affordable overlapping periods, across the regimes that will be used. Vary window placement, length, bridge duration, and initialization; report uncertainty and predefined equivalence margins. One successful short comparison supports only the tested domain.
6. **Monitor validity.** Record window coverage and bridge usage separately in outputs. If state leaves the certified domain, stop before advancing outside it, shorten the bridge, or use an approved explicit transition from a valid boundary. Do not retrospectively label unsupported extrapolation as validated.

Questions dominated by rare dispersal, short interaction sequences, extreme events, or spatial memory may require continuous explicit simulation or a richer bridge. Report unrepresented mechanisms as limits on the supported inference, not merely as a footnote to a seasonal prediction.

## 2. Architecture and ownership

Use a small number of assemblies, with namespaces organizing systems. Avoid one assembly per conceptual layer until a dependency or deployment need exists.

| Subsystem | Responsibility | Authoritative data |
|---|---|---|
| Model definition and validation | Compile species, stages, rules, process capabilities, experiments | Immutable definitions and declared intervention schedule |
| World and habitat | Geometry, navigable domains, realm interfaces, forcing | Geometry/version state and boundary definitions |
| Entity and relationship storage | Identity, dense pools, traits, persistent relations | Directory, pools, component stores, relation records |
| Fields and resources | Environmental dynamics, stocks, conversions, accounting | Field cells, stocks, capacities, boundary ledgers |
| Perception and movement | Sensing, decisions, steering, physical integration | Behavioral state, controls, kinematics |
| Interaction and life cycle | Encounters, consumption, transmission, reproduction, mortality | Protocol state and proposed atomic effects |
| Engine | Time, synchronization, dependency order, commits, checkpoints | Clocks, queues, execution epochs, event identities |
| Observation and adapters | Metrics, exports, Rhino/Grasshopper access | Committed snapshots and derived outputs |

Ownership refers to the authoritative value. Read snapshots and temporary numerical buffers are allowed; independently mutable duplicate stocks are not.

Dependency rule: computation reads a declared snapshot and creates staged results. Only the engine publishes mutations. The scheduler is the sole authority for simulation time.

A resource owner supplies read, materialize-at-time, and transaction operations. Consumers do not reach into another pool's arrays.

## 3. Entity storage, identity, and relationships

### 3.1 Fixed pools

| Pool | Typical members | Required state families |
|---|---|---|
| Mobile | Birds, fish, mammals, focal insects | Identity, species/stage, position, velocity, condition, behavior |
| Sessile | Trees and individually resolved plants | Identity, species/stage, biomass, phenology, spatial influence |
| Cohort | Larvae, abundant insects, seed banks | Cohort identity, integer count, stage/trait distribution, spatial support |
| Patch | Grass, algal mats, habitat resource patches | Identity, extent/cell, biomass, process state |
| Site | Nests, cavities, burrows, oviposition sites | Identity, geometry, capacity, access and occupancy |
| Propagule | Seeds, spores, eggs in transit | Identity, parent/source, position/support, viability, development |

A colony may initially be an entity with a ColonyState component and membership relations. Introduce a dedicated pool only if colony-specific hot loops justify it. Distinguish colony reserves from member reserves.

Optional components are compact stores or sparse tables. A dictionary is acceptable for infrequent memory queries; repeated flight integration uses direct indexed access.

### 3.2 Identity contract

~~~text
EntityHandle = (HandleIndex, Generation)
EntityDirectory[HandleIndex] = (Generation, Alive, PoolKind, DenseSlot, StableEntityId)
DenseSlotToHandle[PoolKind][DenseSlot] = EntityHandle
~~~

- StableEntityId is never reused and exists for sites, cohorts, patches, and individuals.
- OrganismId identifies a tracked biological individual throughout its life.
- CohortId identifies an aggregate, not a single organism.
- LineageRecord links parents, cohort origins, splits, and merges.
- Do not use a dense slot, thread number, or hash iteration position as scientific identity.

Compaction must update the directory, reverse map, and every slot-indexed auxiliary mapping, including flight-state indexes. It does not change external handles.

Generation increments on retirement; a retired slot is not reused until cleanup is complete. Side tables keyed by HandleIndex must also validate generation. On generation exhaustion, retire that index rather than wrap silently.

### 3.3 Life-stage changes and representation changes

Metamorphosis preserves EntityHandle and OrganismId. A transition:

1. Materializes relevant condition, resources, and development at the transition time.
2. Validates the destination stage, realm, components, and available habitat.
3. Specifies transfers of biomass, reserves, cargo, and shed material.
4. Migrates storage and updates mappings.
5. Retains, modifies, or terminates each relation according to an explicit policy.
6. Invalidates stage-dependent events and caches; emits the transition event.

A failed transition cannot leave half-migrated state.

Automatic individual–cohort conversion is disabled in the initial implementation. If later enabled, it must conserve count and accounted quantities, preserve required trait distributions, and handle relations and scheduled events. Identity-critical organisms cannot be aggregated away.

Ending an explicit record through aggregation is a representation change, not mortality. Population and survival statistics must distinguish them. Cohort means alone are inadequate when nonlinear response depends on within-cohort variance; use bins, moments with a closure, or explicit subdivision according to the question.

### 3.4 Persistent relations

Use a typed multigraph, not a single record per handle pair:

~~~text
RelationId
RelationType
Participants: typed handles or stock/site references
StartTime, EndCondition, RelationEpoch
Payload: occupancy units, parasite stage/load, cargo amounts, dominance, etc.
~~~

Several relation types, or several parasite instances, may coexist between the same participants. Provide adjacency indexes for cleanup and local queries.

An encounter episode has its own identity and phase: detected, pursuing, contacting, handling, attached, or finished. Rules must not restart an ongoing feeding or attachment episode at every tick.

## 4. Definitions, rule compilation, and configuration validation

Species definitions hold shared reference traits, life stages, behavior profiles, process choices, parameter distributions, and interaction capabilities. Individuals hold actual mass, energy, condition, learned state, and trait deviations.

One registry identifies each parameter's value or distribution, units, source, uncertainty, and the five evidence checks. Convert units at ingestion; numerical kernels use declared engine units.

### 4.1 Rule schema [SYN]

~~~text
RuleId, Version, EcologicalLabel, OptionalOntologyIRI
SourceSelector, TargetSelector, RequiredCapabilities
SupportedRepresentationPairs
Directionality and ParticipantRoles
CandidateProvider and SpatialEligibility
ProcessKind: Hazard | Count | Flux | ScheduledTransition | FieldResponse
Preconditions and AcceptedStateQuality
ProtocolId and ProtocolState
TransactionTemplate and CouplingGroup
CompetitionPolicy and ConflictDomain
Cadence, TemporalSemantics, Handling/Cooldown
Explicit/CoarseExecutionContract and OwnershipPartition
Parameters, Evidence, ValidationCertificate
~~~

Sign pairs describe expected ecological effects in specified conditions. They do not compute outcomes.

At load time, compile sparse adjacency and stage/capability masks. At runtime, query appropriate local candidates and match compiled rules. There is no all-organisms-by-all-organisms scan.

### 4.2 Reject unsupported combinations early

Reject configurations with unresolved:

- Missing species/stage IDs or required components.
- Incompatible units, realms, coordinate systems, or steering conversions.
- An interaction between representations without an execution adapter.
- A hazard specified where a flux is required, or vice versa.
- Multiple owners for the same stock or exposure partition.
- Undeclared state reads/writes or impossible temporal freshness.
- An uncertified coarse rule enabled in research mode.
- A field solver that cannot satisfy positivity, conservation, or step requirements.
- A required equation still marked CHK.

Adding a species that uses existing capabilities should require data changes only. Adding a new biological process may require one tested system or protocol. Neither promise means arbitrary ecology can be encoded without new code.

## 5. Simulation time and causal execution

### 5.1 Time and state metadata

Use an integer simulation time with a declared quantum. The quantum is a numerical choice, not a biological constant. Test sensitivity to it; specify rounding of stochastic event times and prevent zero-time rescheduling loops.

Every independently evolving component/process carries, as needed:

~~~text
CommittedAt
ValidThrough
LastIntegratedAt
ProcessEpoch
DependencyVersions
PendingEvent/ExposureState
~~~

A single entity timestamp is insufficient when motion, physiology, and development update independently.

**Granularity [SYN].** This is a logical contract, not a mandatory per-entity layout. Share timestamps and epochs for a bucket whose members have the same process schedule and validity horizon. Split out exceptions before a member diverges; materialize and reconcile its anchors when moving it between buckets. Individually evolving residual hazards or lazy stocks retain the metadata they need.

Shared dependency versions are safe when every relevant mutation increments the shared version and invalidates all dependent cached values or scheduled proposals. Declare the read/write coverage before using this optimization. Coarser tracking may invalidate too much; it must not miss a write. Tests verify this coverage rather than granting permission to omit it.

### 5.2 Pure access to state

A read accessor returns either:

- A value valid at the requested time under an approved evolution rule; or
- A NeedAdvance request describing the stale dependency.

It never commits, draws fresh randomness, changes a clock, or recursively invokes another system.

Analytic evaluation of a refill or decay law is allowed only while its coefficients and dependencies are valid. Changes to food intake, temperature, stage, or rates close the current segment and start another. Materialization at a barrier occurs once.

“Latest committed” is not synonymous with “current.” Contact geometry requires a common evaluation time. Approximate fields may be sampled with a stated age/error bound; that approximation is logged.

### 5.3 Baseline synchronization and optional substeps [SYN]

**First implementation.** Use one common explicit motion step and one synchronized publication sequence. Choose the step from numerical accuracy and the declared ecological event semantics. Decision clocks remain distinct: only due policies refresh their commands; other commands retain an explicit validity horizon. A publication boundary is not automatically a new behavioral decision.

The first slice may assign ecological effects to step boundaries and document that discretization. Preserve residual stochastic state and absolute handling-completion times; never reset handling at each step. Compare smaller steps and require the chosen inference to converge. If a rule requires an earlier causal effect, enable localization before using it.

**Optional two-level integration.** Separate expensive decision evaluation from self-state integration only under these conditions:

- A synchronization horizon is bounded by the earliest due decision, queued event, input-validity expiry, field boundary, or necessary causal interruption. Reaction time alone does not establish a safe horizon.
- Private substeps integrate self-state under held commands and valid immutable inputs or approved predictors. Aerodynamic or other self-dependent terms may change at every substep. They do not read another entity's evolving private buffer.
- Candidate generation encloses participants' possible paths over the entire horizon. Compare swept paths at matching times, with body/support extent and a bound on path-approximation error. An endpoint query or intersection of two untimed curves is insufficient.
- The rule declares whether contact contributes an exposure integrated to the boundary or creates an earlier state-changing event. Endpoint batching is allowed only as that declared discretization, with convergence evidence.
- When an earlier event changes motion, stock, eligibility, or a command, locate it to the stated tolerance, resolve its simultaneous batch, discard affected future paths, and continue from the new committed boundary. Several events can occur in one proposed interval. “Shorten once” is not a correctness rule.

A submodel whose inputs cannot remain valid over private substeps uses a shorter common boundary or a tested coupled solver. Detailed reference flight retains its own verified update schedule (§9); the generic scheme does not establish a faithful reproduction.

At every synchronization boundary:

1. **Plan:** determine due processes, dependencies, and the next permitted horizon.
2. **Advance provisionally:** integrate into temporary buffers using valid inputs and stable stochastic state.
3. **Check the horizon:** detect an earlier required event or validity boundary. Localize and recompute as needed; declare tolerances, progress rules, and a retry limit that stops safely rather than accepting an invalid interval.
4. **Freeze the evaluation view:** proposals read a coherent state at the common evaluation time, plus declared interval-exposure records.
5. **Compute:** produce effects and future command proposals.
6. **Resolve:** apply ecological competition and transaction checks on staged state.
7. **Publish atomically:** commit advances, accepted effects, structural changes, and command validity metadata together.
8. **Observe:** update derived state and publish an immutable snapshot.

Use the initial committed state to initialize commands before the first advance. Boundary events may invalidate a held command without making every unrelated policy due.

Retries reuse logically addressed stochastic state. A process without valid subdivision semantics must use its approved boundaries or be disabled in that coupling. During genuine inactivity, jump directly to the next due time only while all required state evolution and dependencies remain valid.

**Independent synchronization groups: deferred.** Start with one group. A future partition must include shared stocks, relations, fields and behavioral dependencies as well as spatial candidates. Certify independence only to a stated horizon using future support bounds. Schedule a merge before possible new coupling, at a common time, and invalidate affected paths. Waiting until a normal index rebuild can be too late. Check I03, I06–I08 and compare declared outputs against the common-group configuration; preserving a spatial graph alone does not prove causal equivalence.

### 5.4 Event order and invalidation

Store EventId, due time, participants, relevant generations/epochs, causal parent, and local occurrence ordinal. Stale event rejection is a safety check; stage-dependent cancellation is not a universal biological policy.

For a shared timestamp:

- First invalidate pre-existing stale events and honor already-established constraints.
- Collect the remaining causal effects into a batch.
- Apply declared simultaneous-event semantics and competition policies.
- Make newborns or newly enabled processes eligible only in the next declared event microphase or future time.

Do not globally sort all ecological outcomes by “death first” and call that neutral. A scheduled prior death, a simultaneous attack, and accumulated damage are different cases. State the selected semantics and test sensitivity to time quantization.

System IDs and participant IDs may order equivalent computations. They do not determine winners when alternatives have different ecological consequences.

### 5.5 Multirate coupling

Each process declares its numerical integration step, decision cadence, accepted input age, and event trigger separately. Slow physiology does not imply that energy can remain unchanged during a fast feeding transaction.

Interacting components synchronize before atomic effects. Fields and organisms use a declared operator-splitting sequence with timestamped source/sink terms; step refinement must demonstrate that splitting error is acceptable.

If an input exceeds its validity horizon, the planner advances the dependency before evaluation. A read cannot repair the problem by mutating state.

## 6. Stochastic processes, feeding, and exposure

### 6.1 Distinguish mathematical objects

| Object | Units | Meaning |
|---|---|---|
| Hazard | inverse time | Instantaneous event intensity conditional on current state |
| Event probability | dimensionless | Probability for a specified opportunity or interval |
| Count intensity | items/time | Expected count rate for an explicitly defined process |
| Flux | quantity/time | Continuous transfer rate |
| Scheduled duration | time | Completion time or delay under a declared distribution |

For constant hazard r, the probability of at least one event in duration Δ is 1 − exp(−rΔ). For varying hazard, use the integrated intensity. A Bernoulli event, repeated counts, and biomass transfer are not interchangeable.

Maintain residual integrated hazard or a scheduled next event when changing interval length or temporal mode. A checkpoint must preserve this residual state.

Mutually exclusive exits use competing risks or an equivalent explicitly defined process. Independent Bernoulli draws must not allow the same organism to die twice or enter incompatible stages.

### 6.2 Handling time: replace the clipped-count rule

V3's integer cap N ≤ Δ/h fails when Δ < h: it permits no intake in every interval even if the consumer is initially free to capture prey. Clipping a Poisson count also generally changes its expectation and distribution.

The default individual feeding model therefore carries:

~~~text
FeedingState = Searching | Handling
HandlingUntil
GutCapacity and CurrentLoad
ActiveTarget/Episode
ResidualSearchHazard or NextSearchEvent
~~~

When searching, generate an eligible encounter. Resolve capture and stock competition atomically. A successful capture starts handling; completion re-enables searching. Define whether biomass transfers at capture, during handling, or at completion.

For constant search intensity λ and deterministic handling duration h, a simplified renewal model has long-run mean rate λ/(1 + λh). This is a mathematical benchmark for that specified process, not a universal feeding law.

If a chosen functional response already incorporates handling, do not impose handling again without a consistent derivation. Aggregate count or flux alternatives need separate calibration, residual-state treatment, and stock coupling. Poisson counts are valid only where that count-process assumption is justified.

### 6.3 Finite resources and unsuccessful attempts

Competition can reduce realized uptake below potential demand. Rejected proposals must not create food or double-charge costs. Model unsuccessful pursuit or attack costs as separate causal events if those costs were actually incurred.

Expected rates do not guarantee stocks are available. Every accepted discrete capture identifies an available target, cohort count, or stock debit; density alone does not authorize creating a prey item.

### 6.4 Ownership over time

Store last-processed intervals and residual exposure by active process and disjoint target partition, not an N×N history matrix.

Switching representation or temporal mode closes the current exposure segment exactly once. Transfer the residual process state to the next owner. Removing a target from the current density does not retrospectively remove exposure already integrated while that target was present.

## 7. Temporal LOD and representation coupling

### 7.1 Modes describe numerical treatment

| Mode | Contract |
|---|---|
| K — Kinematic | Position and motion explicitly integrated; error bounded by the motion solver and contact tests |
| C — Coarse | Spatial support and a declared movement kernel; no claim of an exact unresolved trajectory |
| I — Inactive locomotion | No self-propelled movement; remains detectable and physiologically active |

An inactive organism carried by water, wind, or a host still needs a transport process. Only an anchored organism has a fixed position.

Kinematic state is numerically resolved, not “exact.” Coarse support must identify whether a bound is conservative or probabilistic. A 95% region is not a guaranteed spatial enclosure.

### 7.2 Research-mode eligibility

The baseline uses K and I for individuals and fixed cohorts/patches through explicit adapters. Enable C only when the named species/stage/rule application is covered by a validation certificate containing scenarios, comparison metrics, tolerances, uncertainty, and unsupported cases.

**Reuse certificates by mechanism family and regime [SYN].** Avoid one certificate per species pair when the same adapter, equations, state variables, and assumptions apply. Record the adapter/version, mechanism family, parameter and state ranges, environmental conditions, and supported outputs. Each use records why it falls inside that scope.

Dimensionless quantities can help describe a regime: encounter radius relative to spacing, expected encounters per interval, handling duration relative to interval, and barrier obstruction. Clustering measures also need a specified sampling scale. These descriptors are candidate applicability tests, not proof that habitat topology, memory, size structure, or another omitted mechanism is irrelevant. A new rule with different semantics needs an applicability assessment and, if outside the existing scope, additional validation.

Certificates may be shared across several species and rules. Their number depends on distinct mechanisms and validated domains; it is not guaranteed to scale only with adapter count. Monitor regime validity at the required cadence, record excursions, and stop or use an approved transition before uncertified evolution. A mode controller minimizes cost within this scope; population size or a compute limit cannot authorize an unvalidated model.

### 7.3 Encounter routing

Biological roles and computational ownership are separate. A kinematic prey may provide the spatial query for a coarse predator, but the predator remains the biological source of predation.

| Participant treatment | Evaluation contract |
|---|---|
| K–K | Common-time geometry and protocol state |
| K–I or I–K | Same-time geometry; inactive participant can receive effects |
| I–I | Relation, field, or contact process if the rule supports it |
| C–C or C–I | Validated statistical adapter, finite target accounting, residual exposure |
| K–C or C–K | Refine at an approved synchronization boundary before explicit resolution, or use a certified mixed adapter |
| Individual–cohort/patch | Declared count/flux/target-sampling adapter with authoritative stock accounting |
| Any–site/resource | Site or stock contract, independent of movement mode |
| Any–field | Timestamped sampling or exposure integration |

Unsupported combinations fail validation. There is no automatic inference that every mode pair is meaningful.

Each directed rule has a canonical evaluator and candidate deduplication key. Symmetric interactions canonicalize the unordered participant pair. Reverse ecological effects may be distinct directed rules.

Partition eligible targets into disjoint explicit and aggregate supports for each rule and interval. Retain partition epochs and closure times. Do not evaluate an entire density and then add individually resolved members of that same density.

### 7.4 Conservative detection and synchronization

A coarse object advertises its spatial support valid until a specified future time. The broad phase indexes that support, including possible motion until expiry. The query must therefore find an object even when its last stored center lies outside nearby fine-grid cells.

On possible overlap with a kinematic participant:

1. Request refinement or synchronization through the scheduler.
2. Complete any outstanding exposure only up to that boundary.
3. Materialize the coarse state through its approved transition kernel.
4. Rebuild/invalidate spatial state and re-evaluate actual eligibility.
5. Start a new ownership interval.

A broad-phase overlap is not an encounter event. It grants neither a successful capture nor a resource transfer.

A coarse process must support subdivision consistently, or refinement is restricted to its established boundaries. If neither provides adequate detection before a plausible encounter, the process cannot run coarse in that scenario.

If a statistical encounter itself triggers promotion, the reconstruction must condition on the sampled encounter time, participants, and geometry. Unconditionally placing two animals and assuming they meet is invalid. A model without a validated conditional kernel resolves the encounter statistically or remains explicit.

### 7.5 State preservation and groups

K→C retains latent velocity, heading, phase, group membership, individual condition, active relations, and relevant interaction history when those influence the return to K.

C→K uses a declared reconstruction kernel that respects occupied habitat, exclusion geometry, accounted quantities, and retained state. It cannot silently teleport a preserved group into an equilibrium configuration.

Promote a group or interaction neighborhood only where the modeled effect requires it. Group membership is a dynamic hypothesis, not an immutable taxonomic fact. Define membership discovery, split/merge criteria, and the approximation used at any truncated interaction boundary.

If a requested coupling closure is too large, remain explicit for the relevant scenario, shorten the experiment, or use a separately validated group representation. Truncating closure at an arbitrary depth is an approximation requiring evidence.

### 7.6 Compute budgets

Research runs have a strict policy: promotion limits can defer wall-clock work at the same simulation time, expand compute within configured limits, or stop with a checkpoint and a recorded reason. They cannot silently convert required explicit interactions to statistical ones.

Exploratory mode may use a predeclared alternative model when a limit binds, but the transition, affected intervals, and output validity must be visible. An arbitrary “few budget hits” rule is insufficient: a single missed rare event may change extinction or recruitment.

Lowering rendering rate is normally a safe response to display pressure because it does not change the simulation.

### 7.7 Certification of approximations

Compare the explicit and coarse models over:

- Low/high density and spatial clustering.
- Habitat barriers and interfaces.
- Rare events and resource scarcity.
- Repeated encounters, group movement, and changing forcing.
- Encounter times and counts, dispersion, capture probability, depletion, survival, and recruitment.
- Long-term target patterns and feedback, where relevant.

Set equivalence margins before inspecting results. Use replicate ensembles and uncertainty estimates; failure to reject a difference does not demonstrate equivalence. Matched random numbers may improve comparisons, but mode changes do not guarantee identical paths.

## 8. Perception, behavior, steering, and physical feasibility

### 8.1 Perception is an observation model

Spatial queries produce possible candidates. A sensory model filters them by range, line of sight, field of view, occlusion, modality, realm interface, and detection uncertainty.

Exact simulation state is not automatically known to the animal. State estimates, attention, memory, and noise belong to perception or behavior.

Species/life-stage masks filter ecological compatibility, while collision candidates may include heterospecifics and geometry. A conspecific-only flock list is not a complete collision list.

### 8.2 Behavior and collective movement

Use a finite-state controller for major modes and utility selection where alternatives require it. Preserve hysteresis or dwell time to prevent unstable rapid switching. Parameters remain species/stage/state-specific.

Collective behavior is optional. A policy library may include Couzin-type zones, alignment/noise, social forces, or swarm tethers, but an implementation is enabled only after its particular equation and units are specified. A name alone is not a scientific definition.

Local movement should be allowed to affect encounters and costs, and those outcomes should feed back into condition and decisions. Avoid scripting desired population or network patterns directly.

### 8.3 Typed commands and conversions

Commands include quantity kind, units, world/body frame, priority class, validity interval, and originating policy. Initial native quantities are desired velocity or control force. Directional goals require a preferred-speed rule.

Registered examples [TPL]:

| Conversion | Definition | Required assumptions |
|---|---|---|
| Direction to velocity | v_des = preferred_speed × unit_direction | Preferred speed and zero-direction behavior |
| Velocity to force | F = m(v_des − v)/τ_control | Actual mass and response time |
| Force to velocity increment | Δv = F Δt / m | Force constant over the interval |
| Velocity to direction | Normalize only when speed exceeds a declared tolerance | Magnitude is discarded |

Do not convert several forces independently to absolute velocities and then add those velocities: that repeats the current-velocity contribution. Combine compatible forces first, or combine their velocity increments around one baseline.

Zero vectors, maximum rates, frame transformations, and invalid values have defined handling. Configuration fixes the conversion path; the runtime does not search for an arbitrary chain of converters.

### 8.4 Preferences are different from constraints

The v3 priority projection is an optional behavioral heuristic. Removing an opposing vector component does not prove that collisions are avoided. Orthogonal motion can still hit an obstacle, and two exclusive commands can conflict.

Use three stages:

1. Compose compatible behavioral preferences, respecting the selected model's internal priorities.
2. Apply a declared feasible-motion procedure for locomotion, terrain, and obstacles.
3. Integrate and check continuous or sufficiently bounded contact over the accepted interval.

The simplest implementations use turn/speed limits with swept contact checks and local substeps. More elaborate feasible-velocity or constrained-control solvers are optional.

Declare what happens when no feasible avoidance exists: contact, sliding, stopping, impact, injury, or another modeled outcome. Do not normalize an impossible vector and claim the constraint was satisfied.

**Baseline outcomes [SYN].** The scenario manifest explicitly selects the contact model:

- For simple kinematic ground motion, clip the swept path at static geometry and slide along the permitted tangent when feasible. Recheck the remaining path against corners and further obstacles; otherwise stop in a valid position. Honor body extent and geometric tolerances.
- For inertial motion, detailed flight, or transport by a current, require a response compatible with that motion model: avoidance, landing, impact, or another declared outcome. Generic instantaneous stopping/sliding is not automatically admissible. Reject unsupported boundary/motion combinations.
- Animal bodies are non-rigid in the initial baseline. Overlap is permitted, measured using the declared pair contact geometry, and has consequences only through a configured interaction rule. This choice is unsuitable for questions that require packing, crushing, or volume exclusion.
- Detailed reference reproduction uses its verified contact assumptions; generic ecosystem defaults do not alter it silently.

No forbidden penetration beyond the declared numerical tolerance may be published. Hard-body response is a separate capability, introduced only when the target question requires it.

A policy set cannot contain several mutually exclusive winners without a declared arbitration rule. IDs may settle numerically equivalent ties, not determine ecological preference.

### 8.5 Numerical integration and motion fidelity

Steps are selected from motion accuracy, contact bounds, and target patterns. Tables of “5–200 ms” are starting hypotheses, not universal defaults.

On instability or nonfinite state, discard the provisional step and apply the configured retry/stop policy. A warning counter does not authorize committing NaNs or moving through boundaries.

For an adapted model, changes in kinetic state must be consistent with its declared locomotion cost model. Mechanical energy and metabolic expenditure are distinct quantities; do not infer metabolic cost from speed alone without a stated model.

## 9. Detailed flight as an optional submodel

### 9.1 Reference and adapted implementations

Reference reproduction is a gated test configuration. It cannot use v3's partially verified code, generic arbitration, altered roll law, or extra force caps and still claim exact reproduction.

An adapted implementation may change flight control, environmental coupling, or energetic cost. Each change has a version, rationale, and comparison test. Baseline ecosystem development does not depend on implementing detailed flight.

### 9.2 Source check of the critical differences [R2]

The primary PDF gives 5 ms integration, 50 ms reaction time, and 1 s speed relaxation. Equation 18 has no division by gravity; Equation 19 is:

$$
\tan(\beta_{\mathrm{out},i})=w_{\mathrm{bout}}\sin(\beta_i)\,\Delta t.
$$

Both earlier descriptions are compatible: the tangent acts on the roll-out increment and the sine on the current bank angle. This wording issue is resolved; full implementation verification is not.

Equation 16 uses constant cruise thrust; Equations 21–22 update velocity before position. Centrality uses twice the interaction radius. Roost units and complete update ordering remain gate items.

### 9.2a Placement in the architecture [SYN]

| Responsibility | Component |
|---|---|
| Social movement | Collective policy |
| Site attraction | Goal policy |
| Stochastic forcing | Logically addressed noise process |
| Aerodynamics, speed control, banking, integration | Flight motion model |
| Decision and integration schedules | Model-specific scheduler contract |

This allocation does not prescribe which forces are held between decisions. Verify that schedule for ReferenceReproduction; record changes separately for EcosystemAdapted.

### 9.3 Implementation gate

Before enabling ReferenceReproduction, complete:

- Verified equations, parameter units, coordinate conventions, and sign tests.
- A faithful adaptive-radius implementation rather than the earlier placeholder.
- Explicit handling of empty neighborhoods and geometric degeneracies.
- Reference-specific policy ordering and integration without undocumented modifications.
- Model-level reproduction tests and documented acceptance tolerances.

The code is omitted here because an incomplete “reference implementation” would undermine this gate. The architecture permits either verified reproduction or a separately labeled adapted model.

For EcosystemAdapted:

- Use a continuously transported orthonormal frame or equivalent orientation representation. Abruptly switching the auxiliary reference axis near vertical flight can rotate the frame discontinuously.
- Use air-relative velocity for aerodynamic terms when wind is enabled.
- Include locomotion effort consistently with the chosen energy model.
- Keep numerical limits and adaptive stepping visible in diagnostics.
- Test cruise equilibrium, turning sign, frame continuity, finite state, timestep convergence, and the selected flock metrics.

## 10. Interaction protocols and atomic effects

### 10.1 Pipeline

Candidate generation, rule matching, preconditions, protocol evolution, and transaction creation are separate steps. Candidate generation may use proximity, sensing, field exposure, site lookup, density, or an existing relation.

Protocols are typed C# implementations. A small collection of typed effect operations supports resource transfer, damage, relation changes, and structural requests. Avoid an unrestricted expression language or dynamic scripting inside hot loops.

### 10.2 Transaction contract [SYN]

~~~text
TransactionId and CausalEventId
EvaluationTime and SnapshotVersion
Participants and RelevantEpochs
ReadPreconditions
Claims: stocks, capacities, targets, exclusive actions
Effects: transfers, condition changes, relations, births/deaths/transitions
ConflictDomain and CompetitionPolicy
AccountingEntries and StructuralRequests
~~~

Reservations and validation use a staged working state. All accepted effects publish together; no snapshot exposes prey death before the corresponding biomass transfer.

If a structural operation cannot allocate required state, the transaction fails before publication. Preallocate or reserve memory where appropriate. Logging failure must not create a partly applied transaction.

### 10.3 Conflicts across rules

Group proposals by shared authoritative resource, target, or coupled claim set—not only RuleId. Herbivory, mortality, decomposition, and harvesting can contend for the same biomass.

For the initial engine, use a deterministic serial resolver after parallel proposal generation. This gives a readable reference implementation. Parallel resolution later partitions the conflict graph into independent components and retains identical semantics.

Competition options include proportional allocation, weighted winner selection, time-of-arrival, and an explicit contest episode. Each rule declares whether partial fulfillment is meaningful.

Do not solve several multi-resource demands by separate proportional divisions. If an offspring requires energy, biomass, and a site, reserve those together or reject the indivisible reproduction transaction.

### 10.4 Causal effects and mortality

An entity can pay an attack cost and later lose the prey; that is a valid sequence if represented explicitly. Atomic predation does not mean every previous action must be undone when capture fails.

Specify simultaneous attacks: first successful event, competing hazards, accumulated damage, or another model. No generic resolver can infer those semantics.

Death closes physiology/exposure, distributes remains, terminates or transfers relations, cancels applicable events, and retires storage. Corpse biomass is an explicit stock when scavenging or decomposition matters.

### 10.5 Required ecological relationships

| Interaction | Supported mechanism | Essential accounting/state |
|---|---|---|
| Positive/negative allelopathy | Emission, transport, exposure, dose-response | Compound identity, dose, recipient response; distinguish chemical effects from generic facilitation |
| Aggression | Detection, contest, retreat/contact | Condition costs, injuries, dominance/history |
| Predation | Detection, pursuit, capture, handling | Target death, prey allocation, consumer gain, remains |
| Animal dispersal | Ingestion, external attachment, carrying/caching | Cargo viability, retention, destination, parent provenance |
| Abiotic dispersal | Transport kernel or resolved flow | Propagule count/viability and boundary export |
| Epibiosis | Attachment and development | Host/epibiont effects configurable, not automatically harmful |
| Hematophagy | Host location, contact, feeding | Blood/resource debit, recovery process, optional transmission |
| Herbivory | Tissue/patch encounter and intake | Tissue-specific biomass, regrowth, defense if modeled |
| Symbiotic association | Repeated exchange or persistent relation | Context-dependent effects; mutualism is the beneficial special case |
| Nesting | Site selection and occupancy | Capacity, ownership, duration, release |
| Oviposition | Egg deposition, optionally defended occupancy | Parental investment, substrate suitability, egg survival |
| Parasitism | Contact, ingestion, vector, or environmental stage | Transmission route, host state, parasite development |
| Floral visitation | Visit episode | Visit need not remove rewards or cause pollination |
| Pollination | Pickup, transport, compatible deposition, later reproduction | Pollen identity/carryover, compatibility, delay to seed/recruitment |
| Nectar/pollen consumption | Feeding on floral stocks | Actual removal, assimilation, replenishment |

A floral visit, nectar removal, pollen consumption, and pollen deposition may belong to one coupled visit episode. Independent rules must not accidentally charge or replenish the same reward several times.

Broad labels describe ecological intent. They do not force a process to be pairwise or create a benefit without a mechanism.

## 11. World, fields, resource balances, and life cycles

### 11.1 World and interfaces

Use a terrain heightfield where suitable, augmented by explicit surfaces/volumes for canopy, burrows, channels, overhangs, and other relevant geometry. A 2.5D terrain does not describe every traversable habitat.

Realm membership, support surfaces, and interface zones are versioned. A waterbird may occupy or cross several domains under stage/state-specific rules.

Convert Rhino document units and input geographic coordinates into a declared metric simulation frame. Preserve transformations for output. Do not run Euclidean neighbour searches directly on longitude/latitude degrees.

Changing water level, habitat geometry, or forcing updates geometry/field epochs and invalidates affected queries at a commit boundary.

### 11.2 Representation does not select the solver

| Process | Representation and numerical contract |
|---|---|
| Diffusion/linear decay | Grid with validated stencil, boundary flux, decay operator |
| Advection–diffusion | Conservative transport where material is tracked |
| Light/shading | Attenuation/occlusion; no automatic diffusion |
| Prescribed forcing | Time-stamped functions or data with interpolation/error policy |
| Nutrient/oxygen balance | Sources, sinks, transport, reaction, and resource competition |
| Plant influence | Geometry/resource overlap or field coupling appropriate to the mechanism |

### 11.3 Correct numerical restrictions

For constant isotropic diffusion with a standard explicit centered stencil:

$$
D\Delta t\sum_{k=1}^{d}\frac{1}{h_k^2}\leq\frac12.
$$

Equal spacing gives DΔt/h² ≤ 1/4 in 2D and ≤ 1/6 in 3D.

For an unsplit first-order upwind advection update on a Cartesian grid, a sufficient positivity bound for the constant-coefficient case is:

$$
\Delta t\sum_{k=1}^{d}\frac{|u_k|}{h_k}\leq1.
$$

Checking each axis independently is insufficient for that update. For a direct unsplit advection-plus-diffusion update, a sufficient constant-coefficient bound is:

$$
\Delta t\left(\sum_k\frac{|u_k|}{h_k}
+2D\sum_k\frac{1}{h_k^2}\right)\leq1.
$$

Other stencils, split methods, boundaries, variable coefficients, and implicit methods require their own bounds and error controls. Recompute relevant bounds when coefficients or forcing change; load-time checks alone are insufficient.

The exact exponential C_new = C_old exp(−λΔt) applies to isolated linear decay with constant λ. It is not a general solver for stiff nonlinear reactions.

Ordinary semi-Lagrangian interpolation is not automatically conservative. For a material-bearing field, use a conservative implementation or account for and bound its numerical residual.

### 11.4 Agent–field exchange

Deposits and uptake declare amount, units, time, and spatial weights. Weights sum to one over the recipient domain unless boundary export is intended. Dividing by cell volume converts amount to concentration; it does not create another source.

Concurrent uptake reserves available cell stocks. Pending source/sink amounts have one owner and a timestamp; the field solver consumes them exactly once under its declared splitting scheme.

Track material in transit and unprocessed exchange buffers in the ledger boundary. Otherwise a balanced local transfer can appear to create or destroy material globally.

### 11.5 Accounting currencies and process transformations

Default: track dry-biomass stocks, stored chemical-energy accounting, resource capacities, and declared external inputs/outputs. Elemental C/N/P budgets are enabled when needed.

Dry biomass is a useful stock measure but is not a universal conserved chemical currency across photosynthesis, respiration, and changing composition. Biological conversion processes explicitly describe substrates, products, yields, and external material/energy inputs. Elemental accounting provides stronger conservation tests when those processes are resolved.

Use one currency at a time:

$$
\Delta Q_{\mathrm{stored}} =
Q_{\mathrm{in}}-Q_{\mathrm{out}}+
Q_{\mathrm{internal\ net}}.
$$

Internal transfers cancel over the selected boundary. Declare heat, respiration products, detritus, immigration/emigration, and external production consistently.

Energy gained and biomass gained cannot be chosen independently when composition fixes their relationship. A transaction includes the conversion/yield model and units.

For intake, partition ingestion once into assimilated and unassimilated portions in the appropriate currency. Subsequent allocation to growth, maintenance, reserves, and reproduction follows that model; “respiration” must not be subtracted again under an ambiguous second efficiency.

Never silently clamp negative stocks to zero. Treat substantial negativity as a failed update. If tiny roundoff is corrected within tolerance, log the correction in residual accounting.

### 11.6 Life-cycle and producer processes

Keep physiology, production, development, reproduction, recruitment, and mortality as explicit process families.

- Producer growth consumes or receives declared material/energy inputs and responds to limiting conditions.
- Reproduction transfers parental reserves and creates propagules or offspring.
- Development uses elapsed time or integrated environmental exposure according to the chosen model.
- Dormancy suppresses specified activities, not all hazards.
- Recruitment requires habitat, resources, and viability; fertilization alone does not create an established plant.
- Mortality has a cause and reconciles remains, relations, and scheduled processes.

Use logistic growth or other population equations as deliberate aggregate models or benchmarks. Do not impose them additionally on an explicit mechanism that already represents the same density dependence.

## 12. Spatial queries and cache validity

### 12.1 Start with a correctness reference

Implement brute-force queries for small test scenes and a uniform spatial index for production scenarios. Compare candidate coverage before adding multiscale caching.

Use per-domain/scale indexes only where query distributions justify them. A sparse graph and local queries do not guarantee linear performance under unbounded local density.

For each query, declare dimension, radius/support, eligible classes, geometry versions, evaluation time, and whether its result is directed or symmetric. Query the cells intersecting the search support, not an assumed fixed 3×3 neighborhood for every radius.

Static geometry can use a bounding tree. Dynamic obstacles, growth-dependent footprints, sites, and changing interfaces must invalidate or update their spatial entries.

### 12.2 Buffered neighbor lists

A buffered list stores objects out to R_build + δ. It also stores the build time/epoch, eligibility version, and support/cutoff versions.

For bounded point motion, one sufficient rebuild criterion accounts for:

$$
d_i+\max_{j\in\mathrm{eligible\ population}}d_j
+\max(0,R_i(t)-R_{\mathrm{build}}) < \delta.
$$

Displacements are measured since that list's build epoch, including objects excluded from the original list. Checking only current candidates cannot discover a previously excluded fast neighbor.

Finite-size or coarse supports add their growth to the bound. Membership changes, generation changes, geometry changes, and crossing topology can force rebuilding earlier.

The familiar skin/displacement approach is supported by LAMMPS's neighbor-list design [R3]. The exact bound above is this engine's proposed extension, not a claim that ecological queries are identical to molecular dynamics.

For the first cached implementation, rebuild related lists on a common bucket epoch so the displacement reference is unambiguous. More incremental schemes require equivalent coverage tests.

### 12.3 Coarse support and missed paths

An uncertain object's index entry covers its entire valid spatial support, not just its last position. Expanding support invalidates affected index bounds even if the stored center has not moved.

A bound based on v_max × age is conservative only if v_max includes every permitted source of transport and is truly enforced. Diffusive or unbounded stochastic increments require another bound or a declared probability of omission; they cannot claim strict completeness.

In K mode, endpoint proximity alone can miss a contact between steps. Use swept geometry or substeps with explicit motion/error bounds. In C mode, a statistical kernel does not provide a detailed collision path unless the model explicitly generates one.

### 12.4 Query sharing and cross-realm interactions

Share candidates only if a common superset covers the maximum required support and every eligible class. Narrow-phase filters remain process-specific.

Interface zones route queries into relevant target domains. Apply actual reach, occlusion, surface crossing, and accessibility constraints afterward. Being near a water surface does not mean every aquatic target is catchable.

Periodicity, reflecting boundaries, and open migration boundaries are experiment settings. Use the same convention in queries, movement, and demographic accounting.

## 13. Randomness, parallel execution, and reproducibility

### 13.1 Stable logical randomness

Use a counter-based generator with an explicit collision-free field allocation or a documented stream construction. Conceptual addresses include:

~~~text
RunSeed
ProcessId and ProcessVersion
StableEntityId or CanonicalParticipantSet
Episode/EventId
OccurrenceOrdinal
DrawRole and DrawIndex
~~~

Two different logical draws must not unintentionally reuse an address. Counter-based generation facilitates independent streams but does not remove the application's responsibility for address uniqueness [R4].

Do not derive draws from thread identity, dense slot, wall-clock order, or the number of rejected tentative computations. Vector-valued draws declare their component roles.

Random winner selection uses the identity of the shared conflict group, not whichever proposer reaches the resolver first.

### 13.2 Parallel execution policy

Start with:

- Parallel perception, movement proposals, and independent process batches.
- Thread-local proposal buffers and deterministic merge.
- A serial ecological resolver and structural commit.
- Stable neighbor iteration and fixed reduction trees.
- Explicit ownership of scratch buffers.

Read/write declarations identify both storage conflicts and temporal dependencies. Two systems that write disjoint arrays may still be causally dependent. The engine uses a fixed documented phase/dependency graph; it is not a general dynamic scheduler in the first implementation.

Parallel resolution is optional after profiling. Independent conflict components can be resolved concurrently when no cross-component claims or events connect them.

### 13.3 Reproducibility envelope

| Claim | Required evidence |
|---|---|
| Repeatability | Same run definition and seed repeat on the supported build |
| Thread-count independence | Same logical outputs over declared worker counts |
| Restart equivalence | A checkpointed run resumes identically within the supported build/runtime |
| Storage-order independence | Compaction/reordering does not change scientific identities or numerical iteration |
| Cross-platform agreement | Tested explicitly; statistical/tolerance agreement unless bitwise identity is demonstrated |
| Step/LOD robustness | Convergence or equivalence within declared scientific margins, not identical random paths |

Floating-point hardware, vectorization, math libraries, and compiler choices can affect bitwise results. State the tested environment rather than claiming unrestricted determinism.

## 14. Checkpoints, commands, outputs, and run status

### 14.1 Checkpoint contents

Checkpoint only at a quiescent committed boundary. Store:

- Definitions/configuration hashes and schema versions.
- Entity directory, reverse mappings, pools, component stores, IDs, free lists, and allocation counters.
- Relations, protocol/episode states, active groups, and representation lineage.
- Component timestamps, validity horizons, process epochs, and dependency versions.
- Clocks, queues, event IDs, local sequence/occurrence counters, and pending structural work if any is permitted.
- Held steering controls, frames, handling timers, stochastic residual hazards, and conditional movement state.
- Fields, stock amounts, pending exchange buffers, ledger totals, and boundary accounts.
- LOD ownership partitions, transition state, certificates, and pending refinements.
- Run seed plus every logical value used to construct future random addresses.
- Intervention history/cursor, metric accumulator state, and export progress.

The generator may be stateless while the simulated stochastic processes are not.

Derived indexes/caches may be rebuilt if that cannot change state semantics or numerical ordering. Otherwise preserve the relevant build metadata. Checkpoint hashes detect corruption; incompatible schemas fail with a clear migration requirement.

### 14.2 Definitions and interventions

Baseline definitions are immutable during a run. Interactive changes are explicit interventions: parameter, value, effective time, author/source, reason, and resulting configuration epoch.

A changed rate closes its previous integration/exposure segment. A new phenotype, resource level, or habitat state is not applied retroactively.

Calibration runs either prohibit interactive intervention or include the full intervention schedule in the experiment manifest.

### 14.3 Grasshopper/Rhino boundary

The core has no Rhino or Grasshopper dependency. Engine-owned vector, bounds, and time types are converted by the adapter.

Grasshopper queues Start, Pause, Step, Load, Stop, and declared interventions. The engine applies them at safe boundaries and acknowledges the resulting simulation time.

Snapshots expose immutable committed data through bounded buffers. Rendering may skip frames when behind. Avoid copying every component or building a full DataTree at every internal step.

Keep Rhino document edits and geometry presentation on the appropriate host thread. Simulation workers operate on engine data only.

### 14.4 Output tiers and network provenance

1. Telemetry: counts, stock balances, numerical residuals, timings, memory, and validity flags.
2. Aggregates: population changes, resource flows, interaction rates, and network weights.
3. Selected event records: participant IDs, time, position/support, mode, rule version, amount, and outcome.

Every realized-network edge contribution records whether it arose from an explicit event, a sampled count, or an integrated expected flux. Expected flux is not presented as a witnessed individual event.

Report the denominator and observation effort for connectance and related metrics. Separate potential eligibility from observed links. Keep estimated, sampled, and exact-for-the-configured-process quantities distinguishable.

### 14.5 Backpressure and run validity

A full output queue has a declared policy: block wall-clock progress, reduce optional display/detail, or stop with a checkpoint. Do not silently drop required scientific events while retaining a “complete” label.

Run status is one of:

| Status | Meaning |
|---|---|
| Completed within declared numerical/approximation tolerances | Engine checks and enabled approximation gates passed; not a claim of empirical truth |
| Exploratory | Declared unvalidated approximations or interventions used |
| Invalid for specified inference | A relevant numerical or approximation requirement failed |
| Incomplete | Resource limit, interruption, or output failure prevented completion |

No automatic validity rule is based solely on the number of warnings. Severity depends on the affected scientific quantity.

## 15. Validation, calibration, and falsifiable acceptance gates

Separate four activities: code verification, numerical convergence, approximation comparison, and empirical evaluation. Passing one does not establish the others.

### 15.1 Invariants

| ID | Invariant | Enforcement |
|---|---|---|
| I01 | Stable references survive compaction and stage migration | Directory/reverse-map checks and randomized lifecycle tests |
| I02 | Reads never mutate state | Immutable views and debug mutation detection |
| I03 | An interval is not integrated twice | Per-process anchors, exposure closure, epoch checks |
| I04 | Published transactions are all-or-nothing | Failure injection and staged commit tests |
| I05 | No stock/capacity is oversubscribed | Cross-rule claim resolver and ledger checks |
| I06 | Candidate queries do not miss eligible bounded contacts | Comparison with brute-force/swept reference scenes |
| I07 | Each eligible exposure has one owner | Partition audit and explicit/coarse boundary tests |
| I08 | Logical draws have stable distinct identities | Random-address audit and event repetition tests |
| I09 | Observation does not affect dynamics | Different snapshot rates produce identical state |
| I10 | Numerical constraints are solver-specific and current | Dynamic forcing/coefficient tests |
| I11 | Checkpoint restart preserves future semantics | Mid-handling, mid-exposure, relation, and field-buffer restart tests |
| I12 | Research compute limits do not change ecological rules | Promotion pressure test with identical accepted state sequence |
| I13 | Biological identity is distinct from representation identity | Aggregation/mortality accounting tests |
| I14 | Accepted state is finite and within required domains | Pre-publication checks and failure policy |

### 15.2 Minimum adversarial scenarios

- Remove the middle of a dense pool while it is a target in relations and queued events.
- Metamorphose an individual carrying cargo and a stage-independent event.
- Let two predators and a decomposition rule claim the same biomass.
- Run feeding with Δ smaller than handling time; verify captures still occur and completion times remain correct.
- Make an excluded fast object enter a cached interaction range.
- Increase an adaptive cutoff while positions remain unchanged.
- Expand coarse support into a query region while its stored center stays outside.
- Simultaneously consume nectar and refill it at a process boundary.
- Force two contradictory avoidance preferences in an infeasible corridor.
- Increase current speed after field initialization; check runtime timestep adjustment.
- Checkpoint during handling and before a scheduled random event; resume under a different supported thread count.
- Render the same run at different frame rates and verify unchanged simulation outputs.
- Exhaust a promotion budget and confirm that only wall-clock progress or completion status changes in research mode.
- Cross two fast agents between boundaries with separated endpoints; compare same-time swept contact against the reference.
- Trigger capture followed by another contact within one proposed horizon; ensure the first event invalidates the affected future path.
- Change one member's schedule or a shared dependency in a timestamp bucket; ensure all affected views and proposals invalidate.
- Before enabling a window bridge, compare food depletion and survival under changing density/forcing, and inspect reconstruction transients.
- Before reusing a certificate, present a rule outside its mechanism family despite matching its numerical regime descriptors; require rejection or new evidence.

### 15.3 Scientific evaluation

Choose independent observed patterns with measurement definitions, uncertainty, spatial/temporal support, and a relationship to the proposed mechanisms. Hold out data or patterns where feasible.

Evaluate identifiability: several parameter sets or mechanisms may produce the same pattern. Use sensitivity analysis, alternative mechanisms, and multiple patterns rather than one visually persuasive trajectory.

Report numerical discretization, initial-condition, stochastic, parameter, structural, and representation uncertainty separately where they affect the question.

Nestedness, persistence, or species coexistence are potential observations, not mandatory success criteria independent of the actual ecosystem. Do not tune toward a desired pattern solely because it is aesthetically or theoretically attractive.

### 15.4 Source audit and remaining gates

Citation correction, equation transcription, and empirical validation are distinct tasks. A corrected reference does not certify its submodel.

| Item | Evidence state and next action |
|---|---|
| EcoSimInGrid | V5 supplies Qu, Seifan, Tielbörger & Seifan (2013), *Simulation Modelling Practice and Theory* 37: 107–124. The publisher's indexed abstract identifies the model and article [R7]; direct page retrieval was blocked during this review. Retain the reported metadata with that limit; do not claim its equations were rechecked. |
| Kéfi et al. (2012) author list | Publisher metadata checked. Use the corrected record [R6]. Applicability of any proposed interaction equations remains a separate task. |
| Super-individuals attributed to Railsback & Harvey (2002) | Attribution remains unresolved. Do not claim invention or use as the sole evidence for an adapter without locating the relevant passage. |
| Reynolds (1987) described as two-dimensional | Corrected: the original geometric-flight discussion explicitly uses three-dimensional motion [R5]. |
| “Non-Trophic Interactions & Herd Movement” report | V5 names `research/Non trophic interactions and herd movement.md`. This revision reviews the architecture, not that report's complete equation catalogue. Audit the relevant report passages and their primary sources before enabling dependent submodels. |
| Inherited equation catalogue | Encounter, functional-response, allometric, departure, pheromone, herbivory, dose-response, and growth formulas remain candidates subject to the five checks of §0.1. |
| StarDisplay | The roll-out wording is resolved against Equation 19 (§9.2). Full transcription, units, signs, adaptive radius, roost terms, and update schedule still gate reference reproduction. |

Evidence records retain the source location, checked passage/equation, reviewer or verification method, date, model version, and unresolved scope. Inspect primary sources for executable scientific claims; neither repeated review prose nor an unchecked reference list closes a gate.

## 16. Performance strategy and limits

Correctness precedes optimization, but cost is measured from the first vertical slice.

A rough per-step cost model is:

$$
T \approx T_{\mathrm{index}}
+\sum_i T_{\mathrm{candidates}(i)}
+T_{\mathrm{protocols}}
+T_{\mathrm{conflicts}}
+T_{\mathrm{fields}}
+T_{\mathrm{output}}.
$$

High local density, broad query supports, group promotion, field cell counts, or event logging can dominate even with modest organism counts. With multirate integration, weight each term by its own execution count instead of multiplying one blended cost by all private substeps.

Report end-to-end simulated time per wall-clock second, wall time per replicate, peak memory, and counts of motion substeps, decisions, candidates, accepted events, field updates, and output bytes. Record hardware/runtime, build mode, thread count, workload, warm-up, and variation across repeated measurements. Also report correctness/validity status; a fast invalid run is not a usable benchmark.

Required benchmark inputs:

| Dimension | Record before a scientific production run |
|---|---|
| Population | Peak entities by pool, species/stage, cohorts, and aggregate weights |
| Spatial load | Domain extent, dimensionality, peak local density, query-radius distribution |
| Fields | Cell counts, active regions, solver iterations/substeps |
| Time | Duration, decision cadences, expected K/C/I fractions |
| Interactions | Candidate rejection rates, event/proposal rates, conflict sizes |
| Output | Snapshot rate, detailed event selection, expected bytes |
| Compute | Supported CPU/runtime, threads, memory ceiling, wall-clock target |
| Experiment | Number of replicates, checkpoints, warm-up, and parameter sweeps |

These are required manifest fields, not invented biological defaults. Use small synthetic cases while they remain unspecified; publish no throughput guarantee from the architecture alone.

Optimization order:

1. Remove allocations and redundant copies from measured hot loops.
2. Batch by stage/process, reuse scratch buffers, and compile sparse rule lookup.
3. Choose query scales from measured radii and density; add proven cache bounds.
4. Optimize field solvers and observation volume.
5. Parallelize independent work and conflict components.
6. Introduce certified aggregation or temporal coarse models where needed.
7. Consider vectorization/GPU only when supported workloads justify transfer and determinism costs.

Sorting by stable identity on every substep can be expensive. Retain canonical order through deterministic construction or reusable sorted index arrays where possible. Do not silently abandon reproducibility to accelerate a benchmark.

## 17. C# project organization

| Assembly/project | Contents | Dependencies |
|---|---|---|
| Eco.Core | Math, time, IDs, units, schema primitives | Standard runtime only |
| Eco.Model | Definitions, loaders, validators, manifests, compiled rule data | Core |
| Eco.Engine | Storage, scheduling, spatial queries, processes, transactions, checkpointing | Core, Model |
| Eco.Analysis | Metrics, exports, calibration harness, benchmark scenarios | Core, Model, public Engine contracts |
| Eco.Rhino | Rhino/Grasshopper adapters, controls, geometry import, snapshots | Core, Model, Engine, host APIs |
| Eco.Tests | Verification and scenario gates | Projects under test |

Inside Eco.Engine use namespaces for World, Entities, Fields, Resources, Spatial, Behavior, Movement, Interaction, LifeCycle, Lod, and Execution. Split assemblies only when modular deployment or dependency control requires it.

Representative contracts are batch-based:

~~~text
StateView: read-only snapshot plus time/quality metadata
ProcessSystem: declared inputs, proposed advances, events and effects
CandidateProvider: query support, completeness conditions, candidate IDs
Protocol: persistent episode state and transaction proposals
ResourceOwner: typed view, temporal evolution, validated claims
Resolver: ecological allocation and atomic validation
Committer: publication and structural mutation
CheckpointCodec: versioned semantic state
~~~

Do not require an interface dispatch per neighbor. Dispatch once per system/profile batch and iterate densely.

## 18. Development roadmap with exit criteria

Stages describe increasing capability, not permission to postpone contracts already needed by an earlier stage. The initial scheduler, serial resolver, basic boundary treatment, and checkpoint codec belong in Stage 2; Stage 3 generalizes them.

| Stage | Deliverable | Exit criterion |
|---|---|---|
| 1. Identity and state | Pools, directory, reverse maps, pure views, process anchors | I01–I03 on small deterministic scenes |
| 2. One ecological loop | Patch resource, simple mobile consumer, handling, reserves, reproduction, starvation; common step, serial atomic effects, basic checkpoint | Accounts reconcile; handling persists across steps; smaller-step results agree within declared margins; restart and observation independence pass; workload measured |
| 3. General time and transactions | Due-time scheduler, required event localization, multiple rule conflicts, richer structural changes | No double integration or partial effects; sequential/simultaneous event cases and active-process restart pass |
| 4. Explicit space and behavior | Spatial index, sensing, contact/realm rules; optional query caches only if useful | Query and swept-contact completeness against brute-force reference; any cache bounds pass |
| 5. Relations and lifecycle breadth | Sites, cargo, parasites, propagules, fixed cohorts | Identity and accounts survive transitions; enabled representation adapters pass their tests |
| 6. Fields and producers | Exchange buffers, typed solvers, growth/competition, forcing | Stability, positivity, accounting, step/grid convergence |
| 7. Collective movement | Required social policies; private motion substeps only if justified | Selected patterns, geometric feasibility, and enabled coupling contracts pass |
| 8. Hybrid experiments | Only the coarse kernels or window bridges needed by the question | Certificates cover the enabled mechanism families, regimes, reconstruction, and reported inference |
| 9. Optional detailed flight | Reference reproduction and separate adaptation | Source gate, schedule fidelity, and regression/pattern comparisons pass |
| 10. Community studies | Calibration, held-out patterns, uncertainty, representative performance | Defined inference and performance envelope; repeatable exports |

**First vertical slice.** Use a small flat bounded domain, one regrowing patch-resource type, and one mobile consumer species with a correlated random walk, search/handling state, reserves, a reproduction threshold, and starvation mortality. Use brute-force queries, a common step, one simple motion/contact model, and synthetic parameters. Specify the production input, intake transfers, metabolic losses, reproductive transfer, and death destination in one dry-biomass ledger; energy/reserves have their own explicit units and conversion assumptions. A common currency does not make energy and matter interchangeable.

Implement this in two small increments: first resource–search–handling–reserves; then birth and death. Keep the dataset small enough to trace an event sequence manually before measuring larger populations.

The Stage 2 evidence bundle contains:

- The complete scenario and synthetic parameter file, seed, build/runtime identifiers, and selected timestep.
- A reconciled stock ledger and event trace explaining captures, handling completion, births, and deaths.
- A handling case with step shorter than handling duration; a no-food/starvation case; and multiple consumers competing for the same final resource.
- Timestep comparison for the stated metrics, checkpoint/restart during handling, and unchanged state under different snapshot rates.
- An end-to-end timing and memory report for this scene. Test thread-count independence once parallel execution is enabled; a serial-only slice makes no untested parallel claim.

**Revision stop rule.** Freeze the subsystem structure after this targeted review and implement Stage 2. Further changes should respond to a concrete implementation failure, a newly identified correctness contradiction, or a changed research requirement. Record the affected contract and evidence in a short decision note. Do not wait for coarse models, flight, complete ecological coverage, or a general-purpose framework.

Basic spatial checks already apply to Stage 2 motion; optimized indexes arrive later. Checkpointing, diagnostics, and deterministic identities start with their minimal working forms and grow with enabled capabilities.

## 19. What remains intentionally open

The proposal defines behavior at the architectural boundaries. It does not select undocumented biological constants or pretend that these research choices are resolved:

- Focal species, population sizes, domain scale, and simulation duration.
- Which ecological patterns justify explicit individuals or detailed locomotion.
- Coarse movement, encounter, and conditional reconstruction kernels for each guild.
- Empirical interaction strengths, handling times, survival, and production parameters.
- Full source transcription and reproduction of optional published movement models.
- Whether nutrient stoichiometry, genotype, disease, or colony behavior is required.
- Acceptable approximation margins and wall-clock budget.

An open choice blocks only the affected capability or production claim. It does not block development of the baseline with declared synthetic test parameters.

The recommended architecture is ready to guide incremental implementation. It is not a claim that every optional subsystem has already been designed, calibrated, or validated.

## 20. Sources and traceability

### Reviewed design record

- Ecosystem_ABM_Architecture_v3.md — supplied architecture; reviewed in full.
- Ecosystem_ABM_Architecture_v4.md — prior consolidated specification and comparison baseline.
- Ecosystem_ABM_Architecture_v5(1).md — latest supplied source, byte-identical to Ecosystem_ABM_Architecture_v5.md; all additions compared with v4 and incorporated with the dispositions in §0.
- Earlier v2 assessment in this conversation — comparison context, not independent scientific evidence.

The v3 source-status system is retained. Previous equation catalogs remain candidate submodels and are not globally re-certified by this document.

### Primary sources and verification scope

- **[R1]** Grimm, V., et al. (2020). *The ODD protocol for describing agent-based and other simulation models: A second update to improve clarity, replication, and structural realism*. Journal of Artificial Societies and Social Simulation, 23(2), 7. [Article](https://www.jasss.org/23/2/7.html).
- **[R2]** Hemelrijk, C. K., & Hildenbrandt, H. (2011). *Some causes of the variable shape of flocks of birds*. PLOS ONE, 6(8), e22479. [DOI](https://doi.org/10.1371/journal.pone.0022479). [Primary PDF](https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0022479&type=printable). Source check concentrated on Table 1 and Equations 16–22.
- **[R3]** LAMMPS developers. *Neighbor lists*, Programmer Guide. [Documentation](https://docs.lammps.org/Developer_par_neigh.html). Used for the skin-distance/rebuild principle, not ecological validity.
- **[R4]** Salmon, J. K., Moraes, M. A., Dror, R. O., & Shaw, D. E. (2011). *Parallel random numbers: As easy as 1, 2, 3*. Proceedings of SC11. [Author-hosted paper](https://www.thesalmons.org/john/random123/papers/random123sc11.pdf). Used for counter-based randomness and address-uniqueness requirements.

- **[R5]** Reynolds, C. W. (1987). *Flocks, herds, and schools: A distributed behavioral model*. Computer Graphics, 21(4), 25–34. [Author's record](https://www.red3d.com/cwr/papers/1987/boids.html). [Full text linked by the author](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/). Checked the geometric-flight discussion.
- **[R6]** Kéfi, S., Berlow, E. L., Wieters, E. A., Navarrete, S. A., Petchey, O. L., Wood, S. A., Boit, A., Joppa, L. N., Lafferty, K. D., Williams, R. J., Martinez, N. D., Menge, B. A., Blanchette, C. A., Iles, A. C., & Brose, U. (2012). *More than a meal… integrating non-feeding interactions into food webs*. Ecology Letters, 15(4), 291–300. [Publisher](https://onlinelibrary.wiley.com/doi/full/10.1111/j.1461-0248.2011.01732.x). Bibliographic metadata checked.
- **[R7]** Qu, H., Seifan, T., Tielbörger, K., & Seifan, M. (2013). *A spatially explicit agent-based simulation platform for investigating effects of shared pollination service on ecological communities*. Simulation Modelling Practice and Theory, 37, 107–124. [Publisher record](https://www.sciencedirect.com/science/article/pii/S1569190X13001032). Metadata retained from v5; retrieval limitation recorded in §15.4.

R1, R3, and R4 retain the prior revision's source checks. This revision rechecked the relevant R2 equation and R5–R6 passages/metadata, and located R7's indexed publisher abstract. It does not claim a new full audit of every cited work.

The runtime contracts, operating profiles, ownership design, acceptance gates, and development order are [SYN]. The numerical counterexamples and constant-coefficient bounds are mathematical checks under the explicitly stated assumptions. None supplies ecosystem-specific empirical calibration.
