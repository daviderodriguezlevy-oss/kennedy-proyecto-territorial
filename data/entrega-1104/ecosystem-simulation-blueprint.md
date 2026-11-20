# Executive Summary & Technical Blueprint: Multi-Realm Agent-Based Ecosystem Simulation

This document provides a complete theoretical, mathematical, and architectural blueprint for developing a multi-realm agent-based ecosystem simulation. The simulation integrates flying (birds, insects), terrestrial (mammals, insects), and aquatic (fish, birds, insects) fauna alongside flora (plants, trees, algae). It incorporates complex trophic and non-trophic interactions (allelopathy, aggression, predation, dispersal, epibiosis, hematophagy, herbivory, symbiosis, nesting, oviposition, parasitism, and floral visitation/pollination).

---

## 1. Conceptual Inheritance Mapping by Topic

| Simulation Subsystem / Topic | Primary Source Reference | Key Conceptual Inheritance & Mechanisms |
| :--- | :--- | :--- |
| **3D Movement & Kinematics** | Couzin et al. (2002)<br>Lin & Abaid (2013) | Continuous 3D space vector kinematics, turning rate limits ($\theta$), velocity re-orientation, and vector-valued Gaussian noise for stochastic random walks. |
| **Collective Behavior & Self-Sorting** | Couzin et al. (2002) | Three concentric interaction zones (Repulsion $z_{or}$, Orientation $z_{oo}$, Attraction $z_{oa}$) with sensory blind spots $(360-\alpha)^\circ$. Emergent group states (Swarm, Torus/Milling, Dynamic Parallel, Highly Parallel), hysteresis/collective memory, and passive spatial self-sorting based on trait variance. |
| **Ecological Agents & Population Dynamics** | Qu et al. (2013) (*EcoSimInGrid*) | Spatially explicit agent lifecycle engines. Modules for annual step processing: resource competition, plant growth/mortality, lottery competition seed banks, exponential seed dispersal, and forager workload limits. |
| **Non-Trophic Interaction Semantics** | Kéfi et al. (2015) | Formal categorization of non-feeding links alongside food webs. Trait-based prediction of non-trophic interactions (sessile vs. mobile, body mass ratios, trophic vulnerability/generality) for space competition, refuge provisioning, epibiosis, and interference. |
| **Multilayer Network Architecture** | Pilosof et al. (2017) | Multi-aspect network representation $\mathcal{M} = (V_M, E_M, V, \mathbf{L})$ using supra-adjacency matrices. Decouples and links trophic layers, non-trophic positive/negative layers, spatial habitats/realms, and temporal snapshots via intralayer and interlayer edges. |
| **Swarm Predator/Prey Mechanics** | Lin & Abaid (2013) | 3D bat-inspired predator-prey dynamics. Predators feature 3D spherical cone sonar sensing patterns ($r_s, \hat{\phi}, r_e$) and targeted pursuit. Prey utilize Vicsek alignment or independent random walks under varying noise levels. |
| **Plant–Pollinator Subsystem** | Qu et al. (2013) (*EcoSimInGrid*) | Flower traits (size, color, scent, nectar replenishment) paired with pollinator cognitive traits (perceptual range, instant memory, 3D two-way learning space for attractive vs. repugnant flowers, pollen basket transport). |
| **Pattern-Oriented Modeling (POM)** | Grimm et al. (2005) | Engineering strategy to calibrate and validate ABMs. Uses multi-scale observed patterns to identify the optimal complexity zone (**Medawar zone**), test alternative behavioral rules (**strong inference**), and calibrate uncertain parameters (**inverse parameterization**). |

---

## 2. Core Equations & Mathematical Formalism

### A. Flocking Kinematics & Interaction Zones (Couzin et al., 2002)
For an agent $i$ at position vector $\mathbf{c}_i(t)$ with unit velocity vector $\mathbf{v}_i(t)$ in continuous 3D space:

1. **Zone of Repulsion Vector** ($r \le r_r$, Highest Priority):
   $$\mathbf{d}_r(t+\Delta t) = -\sum_{j \neq i}^{n_r} \frac{\mathbf{r}_{ij}(t)}{|\mathbf{r}_{ij}(t)|}, \quad \text{where } \mathbf{r}_{ij}(t) = \frac{\mathbf{c}_j(t) - \mathbf{c}_i(t)}{|\mathbf{c}_j(t) - \mathbf{c}_i(t)|}$$

2. **Zone of Orientation Vector** ($r_r < r \le r_o$):
   $$\mathbf{d}_o(t+\Delta t) = \sum_{j=1}^{n_o} \frac{\mathbf{v}_j(t)}{|\mathbf{v}_j(t)|}$$

3. **Zone of Attraction Vector** ($r_o < r \le r_a$):
   $$\mathbf{d}_a(t+\Delta t) = \sum_{j \neq i}^{n_a} \frac{\mathbf{r}_{ij}(t)}{|\mathbf{r}_{ij}(t)|}$$

4. **Combined Directional Vector** (when neighbors exist in both $z_{oo}$ and $z_{oa}$):
   $$\mathbf{d}_i(t+\Delta t) = \frac{1}{2} \left[ \mathbf{d}_o(t+\Delta t) + \mathbf{d}_a(t+\Delta t) \right]$$

5. **Group Order Metrics**:
   * **Polarization** ($p_{\text{group}} \in [0, 1]$): $p_{\text{group}}(t) = \frac{1}{N} \left| \sum_{i=1}^N \mathbf{v}_i(t) \right|$
   * **Angular Momentum / Milling Radius** ($m_{\text{group}} \in [0, 1]$): $m_{\text{group}}(t) = \frac{1}{N} \left| \sum_{i=1}^N \mathbf{r}_{ic}(t) \times \mathbf{v}_i(t) \right|$, where $\mathbf{r}_{ic}(t) = \mathbf{c}_i(t) - \mathbf{c}_{\text{group}}(t)$

---

### B. 3D Swarm Predator–Prey Dynamics (Lin & Abaid, 2013)
For predators with speed $\hat{s}$ and prey with speed $s$:

1. **Predator Targeted Hunting Velocity**:
   When prey occupy the predator's 3D spherical cone sonar space ($r \le \hat{r}_s$, angle $\le \hat{\phi}$), predator $i$ targets the closest prey $k^*$:
   $$\mathbf{\hat{v}}_i^h(t+\Delta t) = \hat{s} \frac{\mathbf{x}_{k^*}(t) - \mathbf{\hat{x}}_i(t)}{\|\mathbf{x}_{k^*}(t) - \mathbf{\hat{x}}_i(t)\|}$$

2. **Predator Unaligned Random Walk Velocity**:
   $$\mathbf{\hat{v}}_i^w(t+\Delta t) = \hat{s} \frac{\mathbf{\hat{v}}_i(t) + \mathbf{\omega}(\hat{\eta})}{\|\mathbf{\hat{v}}_i(t) + \mathbf{\omega}(\hat{\eta})\|}$$
   *(where $\mathbf{\omega}(\hat{\eta})$ is Gaussian random noise orthogonal to $\mathbf{\hat{v}}_i(t)$ with standard deviation $\hat{s} \tan(\hat{\eta}\pi)$).*

3. **Prey Vicsek Alignment Velocity Update**:
   $$\mathbf{u}_k(t+\Delta t) = s \frac{\sum_{l \in N_k(t)} \mathbf{v}_l(t)}{\left\| \sum_{l \in N_k(t)} \mathbf{v}_l(t) \right\|}, \quad \mathbf{v}_k(t+\Delta t) = s \frac{\mathbf{u}_k(t+\Delta t) + \mathbf{\omega}(\eta)}{\|\mathbf{u}_k(t+\Delta t) + \mathbf{\omega}(\eta)\|}$$

4. **Prey Group Cohesion Index**:
   $$c(t) = \exp \left( -\frac{1}{N L_d} \sum_{k=1}^N d_k(t) \right), \quad d_k(t) = \min_{l \neq k} \|\mathbf{x}_l(t) - \mathbf{x}_k(t)\|$$

---

### C. Plant Growth, Seed Dispersal & Pollinator Foraging (Qu et al., 2013)

1. **Gompertz Biomass Growth Rate**:
   $$\text{GrowthRate} = \text{MaxGrowthRate} \cdot 2^{-\exp(-\text{slope} \cdot (1 - \text{Resource}) \cdot e^{-t})}$$

2. **Isotropic Exponential Seed Dispersal**:
   $$f(r) = \lambda e^{-\lambda r}, \quad r \in [0, r_{\text{max}}]; \quad \theta \sim U[0, 2\pi)$$

3. **3D Feature Space Floral Attractiveness**:
   Given flower size ($FS$), color ($FC$), scent ($FF$), and pollinator instant attractive ($PSIP, PCIP, PFIP$) and repugnant ($PSIN, PCIN, PFIN$) memories:
   $$DPV_{i,j} = \sqrt{(PSIP_i - FS_j)^2 + (PCIP_i - FC_j)^2 + (PFIP_i - FF_j)^2}$$
   $$DNV_{i,j} = \sqrt{(PSIN_i - FS_j)^2 + (PCIN_i - FC_j)^2 + (PFIN_i - FF_j)^2}$$
   $$\text{Attractiveness}_{i,j} = \left( \frac{1 + DNV_{i,j}}{1 + DPV_{i,j}} \right)^2$$

4. **Distance-Weighted Cell Attractiveness Landscape**:
   $$\text{Attractiveness}(d) = \frac{\text{CellAttractiveness}(x,y)}{(1 + d)^{1/2}}$$

---

### D. Multilayer Network Formalism (Pilosof et al., 2017; Kéfi et al., 2015)

1. **Multilayer Network Definition**:
   $$\mathcal{M} = (V_M, E_M, V, \mathbf{L})$$
   * $V$: Physical species nodes ($N$ species).
   * $\mathbf{L} = \{L_1, L_2, \dots, L_d\}$: Sequence of $d$ aspect sets.
     * $L_1 = \{\text{Trophic}, \text{Non-Trophic Positive}, \text{Non-Trophic Negative}\}$
     * $L_2 = \{\text{Aerial}, \text{Terrestrial}, \text{Aquatic}\}$
   * $V_M \subseteq V \times L_1 \times \dots \times L_d$: State nodes representing species in specific layer contexts.
   * $E_M$: Edge set containing intralayer links (interactions within a realm/type) and interlayer links (cross-realm movements, ontogenetic habitat shifts, and cross-interaction coupling).

2. **Supra-Adjacency Matrix Structure**:
   $$\mathbf{\mathcal{A}} = \begin{pmatrix} 
   \mathbf{A}^{(1)} & \mathbf{C}^{(1,2)} & \dots & \mathbf{C}^{(1,M)} \\
   \mathbf{C}^{(2,1)} & \mathbf{A}^{(2)} & \dots & \mathbf{C}^{(2,M)} \\
   \vdots & \vdots & \ddots & \vdots \\
   \mathbf{C}^{(M,1)} & \mathbf{C}^{(M,2)} & \dots & \mathbf{A}^{(M)}
   \end{pmatrix}$$
   Where $\mathbf{A}^{(\alpha)}$ represents intralayer connectivity within layer $\alpha$, and $\mathbf{C}^{(\alpha, \beta)}$ represents interlayer coupling between layers $\alpha$ and $\beta$.

---

## 3. Recommended Simulation Architecture & Execution Pipeline

1. **Spatial World Engine**: Continuous 3D spatial container divided into discrete voxel grids for neighborhood searches, light/resource diffusion, and cellular plant growth.
2. **Layered Supra-Graph Manager**: Maintains the active multilayer network ($\mathcal{M}$), updating dynamic interaction strengths (e.g., clearance of refuge space via herbivory, pollination efficiency via floral density).
3. **Agent Lifecycle Loop (Per Step/Year)**:
   - **Phase 1: Environment & Plant Update**: Soil/water resource diffusion $\rightarrow$ Gompertz biomass growth $\rightarrow$ Allelopathy toxin spreading $\rightarrow$ Seed production & exponential dispersal.
   - **Phase 2: Animal Perception & Kinematics**: Sensory evaluation (3D sonar cone / local zones) $\rightarrow$ Flocking vector calculation (Repulsion, Orientation, Attraction) $\rightarrow$ Turning rate constraint integration $\rightarrow$ Position update.
   - **Phase 3: Interaction Execution**: Trophic events (Predation, Herbivory, Hematophagy) $\rightarrow$ Non-trophic events (Floral visitation, Parasitism, Epibiosis, Nesting, Interference) $\rightarrow$ Energy/Workload accumulation & mortality evaluation.
4. **POM Calibration & Verification**: Measure macroscopic observables (Polarization $p_{\text{group}}$, Milling $m_{\text{group}}$, Species Richness, Spatial Modularity) against target real-world data patterns to filter agent parameter sets.

---

## References & Source Grounding
- **Couzin et al. (2002)**: *Collective Memory and Spatial Sorting in Animal Groups*. J. Theor. Biol.
- **Grimm et al. (2005)**: *Pattern-Oriented Modeling of Agent-Based Complex Systems*. Science.
- **Kéfi et al. (2015)**: *Network structure beyond food webs: mapping non-trophic and trophic interactions*. Ecology.
- **Lin & Abaid (2013)**: *Collective behavior and predation success in a predator-prey model inspired by hunting bats*. Phys. Rev. E.
- **Pilosof et al. (2017)**: *The multilayer nature of ecological networks*. Nat. Ecol. Evol.
- **Qu et al. (2013)**: *EcoSimInGrid: A spatially explicit agent-based simulation platform*. Sim. Mod. Pract. Theory.
