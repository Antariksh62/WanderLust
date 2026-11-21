# Graphify Architecture Generation and Maintenance

**Project:** WanderLust  
**Audit Phase:** Phase 2  
**Environment:** Windows / Node.js v22.14.0 / Python 3.13.3 / Graphify  
**Tooling Authority:** AntiGravity Graphify Integration (`graphifyy`)  

---

## 1. Graphify Tooling & Environment Investigation

Before generating the architectural graph, the AntiGravity environment was audited for available Graphify tools:

- **Installed Extension/Module:** `graphifyy` is installed in the local Python 3.13 environment:  
  `C:\Users\antar\AppData\Roaming\Python\Python313\site-packages\graphify\__init__.py`
- **Graphify CLI / Python API Modules Available:**
  - `graphify.detect`: Corpus detection, word counting, category classification.
  - `graphify.extract`: AST structural extraction and parallel semantic extraction.
  - `graphify.build`: NetworkX graph construction from JSON extraction representations.
  - `graphify.cluster`: Louvain / Infomap community detection and cluster cohesion scoring.
  - `graphify.analyze`: Centrality, god node identification, bridge detection, and question generation.
  - `graphify.report`: Markdown architectural report generator.
  - `graphify.export`: Exporters for `graph.json`, `index.html`, `graph.html`, and `graph.graphml`.
- **Integrity Status:** All dependencies verified without mocking or hallucinated commands.

---

## 2. Graph Generation Command & Pipeline

The graph was generated from the actual source repository using the following reproducible pipeline:

### Step 1: File Detection
```powershell
python -c "import json; from graphify.detect import detect; from pathlib import Path; res = detect(Path('.')); Path('graphify-out/.graphify_detect.json').write_text(json.dumps(res, ensure_ascii=False), encoding='utf-8'); print('Detected', res['total_files'], 'files')"
```
- **Corpus Detected:** 38 files · ~115,795 words
  - Code: 31 files (`.js`, `.json`)
  - Documents: 1 file (`README.md`)
  - Images: 6 files (assets & screenshots)

### Step 2: AST Structural Extraction
```powershell
python -c "import json; from graphify.extract import collect_files, extract; from pathlib import Path; code_files = [Path(f) for f in json.loads(Path('graphify-out/.graphify_detect.json').read_text())['files']['code'] if Path(f).suffix != '.ejs']; res = extract(code_files, cache_root=Path('.')); Path('graphify-out/.graphify_ast.json').write_text(json.dumps(res, indent=2)); print(f'AST: {len(res[\"nodes\"])} nodes, {len(res[\"edges\"])} edges')"
```
- **AST Nodes:** 183 nodes
- **AST Edges:** 257 edges

### Step 3: Graph Construction, Community Clustering & Diagnostics
```powershell
python -c "import json; from graphify.build import build_from_json; from graphify.cluster import cluster, score_all; from graphify.analyze import god_nodes, surprising_connections, suggest_questions; from graphify.report import generate; from graphify.export import to_json, to_html, to_graphml; from pathlib import Path; ... G = build_from_json(merged, root='.', directed=False); to_json(G, communities, 'graphify-out/graph.json'); to_html(G, communities, 'graphify-out/index.html'); to_graphml(G, communities, 'graphify-out/graph.graphml')"
```
- **Rebuilt Graph Nodes:** 183 nodes
- **Rebuilt Graph Edges:** 218 edges
- **Identified Communities:** 11 distinct clusters

---

## 3. Discovered Architectural Communities & Relationships

Graphify's clustering algorithm partitioned the Wanderlust codebase into 11 functional modules:

| Community ID | Curated Label | Key Nodes & Members | Cohesion Score | Architectural Purpose |
|---|---|---|---|---|
| **0** | **External Dependencies & Packages** | `cloudinary`, `connect-flash`, `connect-mongo`, `dotenv`, `ejs`, `ejs-mate`, `express`, `express-session`, `mongoose`, `passport`, `joi` | 0.05 | Foundation layers & runtime ecosystem |
| **1** | **Auth & Validation Middleware** | `middleware.js`, `isLoggedIn`, `isOwner`, `isReviewAuthor`, `validateListing`, `validateReview`, `listingSchema`, `reviewSchema` | 0.09 | Request interception, RBAC, access control |
| **2** | **Express Server & Application Core** | `app.js`, `express`, `session`, `store`, `genAI`, `listingsRouter`, `reviewsRouter`, `userRouter`, error handler | 0.07 | Application entrypoint, routing composition, AI service |
| **3** | **User Authentication & Account Management** | `controllers/user.js`, `routes/user.js`, `models/user.js`, `passportLocalMongoose`, `signUp`, `logIn`, `logOut` | 0.10 | Identity, credential hashing, session lifecycles |
| **4** | **Cloud Storage & Listing Routing** | `cloudConfig.js`, `routes/listing.js`, `multer`, `CloudinaryStorage`, `storage` | 0.13 | Asset ingestion, CDN delivery, REST listing routes |
| **5** | **Review Management & Listing Relations** | `controllers/review.js`, `routes/review.js`, `models/review.js`, `createReview`, `destroyReview`, `listing.reviews` | 0.16 | Nested 1:N relations, review CRUD, author validation |
| **6** | **Package Configuration & Metadata** | `package.json`, `name`, `version`, `scripts`, `engines`, `dependencies` | 0.17 | Build manifest & runtime constraints |
| **7** | **Listing Controller & Geocoding** | `controllers/listing.js`, `createListing`, `destroyListing`, `editListing`, `updateListing`, `index`, `geoCodingClient`, `mbxGeocoding` | 0.20 | Listing business logic, Mapbox forward geocoding, filters |
| **8** | **Database Seeding & Fixtures** | `init/index.js`, `init/data.js`, `sampleListings`, `initDB` | 0.25 | Schema bootstrapping & development datasets |
| **9** | **Mapbox Client Visualization** | `public/js/map.js`, `mapboxgl.Map`, `mapboxgl.Marker`, `mapboxgl.Popup` | 0.33 | Browser map rendering & marker pin interaction |
| **10**| **Client-side UX & Theme Toggle** | `public/js/script.js`, Bootstrap form validation, dark mode switcher | 1.00 | Interactive client behaviors & DOM accessibility |

---

## 4. God Nodes (Core Architectural Abstractions)

Graphify identified the most connected abstractions (central hub nodes) in the codebase:

1. **`ExpressError` (Degree: 3):** Standardized error transport across controllers, middleware, and routing.
2. **`isLoggedIn()` (Degree: 3):** Universal authorization boundary protecting mutate routes.
3. **`validateListing()` (Degree: 3):** Schema validation gateway guarding listing creation and updates.
4. **`validateReview()` (Degree: 3):** Schema validation gateway guarding review submissions.
5. **`Listing` Model (Degree: 2):** Primary domain entity governing listings and spatial data.
6. **`Review` Model (Degree: 2):** Dependent domain entity referencing user authors.
7. **`User` Model (Degree: 2):** Core identity entity governing passport-local-mongoose authentication.
8. **`storage` (Degree: 2):** Multer-Cloudinary transport layer for media streams.

---

## 5. Graphify Artifact Locations

All Graphify-generated artifacts are maintained in the documented directory:

- **Graph Data (JSON):** [graph.json](file:///d:/Desktop/All%20projects/WanderLust/graphify-out/graph.json)
- **Interactive Visualization (HTML):** [index.html](file:///d:/Desktop/All%20projects/WanderLust/graphify-out/index.html)
- **Secondary HTML Visualization:** [graph.html](file:///d:/Desktop/All%20projects/WanderLust/graphify-out/graph.html)
- **GraphML Graph Representation:** [graph.graphml](file:///d:/Desktop/All%20projects/WanderLust/graphify-out/graph.graphml)
- **Architectural Analysis Report:** [GRAPH_REPORT.md](file:///d:/Desktop/All%20projects/WanderLust/graphify-out/GRAPH_REPORT.md)
- **Cluster Metadata Sidecar:** [`.graphify_analysis.json`](file:///d:/Desktop/All%20projects/WanderLust/graphify-out/.graphify_analysis.json)
- **Curated Labels Sidecar:** [`.graphify_labels.json`](file:///d:/Desktop/All%20projects/WanderLust/graphify-out/.graphify_labels.json)

---

## 6. Graphify Update Command

Whenever source files are added or modified, rerun:

```powershell
python -c "import sys, json; from graphify.extract import collect_files, extract; from pathlib import Path; from graphify.build import build_from_json; from graphify.cluster import cluster, score_all; from graphify.analyze import god_nodes, surprising_connections, suggest_questions; from graphify.report import generate; from graphify.export import to_json, to_html, to_graphml; code_files = [Path(f) for f in json.loads(Path('graphify-out/.graphify_detect.json').read_text())['files']['code'] if Path(f).suffix != '.ejs']; res = extract(code_files, cache_root=Path('.')); Path('graphify-out/.graphify_ast.json').write_text(json.dumps(res, indent=2)); merged = {'nodes': res['nodes'], 'edges': res['edges'], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}; G = build_from_json(merged, root='.', directed=False); communities = cluster(G); to_json(G, communities, 'graphify-out/graph.json'); to_html(G, communities, 'graphify-out/index.html'); to_graphml(G, communities, 'graphify-out/graph.graphml'); print('Graphify refreshed')"
```
