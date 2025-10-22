const quotes = [
  "Only what grows in silence can rise without breaking.",
  "I've been building systems for years — but the most complex one was myself.",
  "The fire that burned me once — now keeps me warm.",
];

const quoteElement = document.querySelector("[data-quote]");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

let quoteIndex = 0;
let intervalId = null;

function cycleQuotes() {
  if (!quoteElement) return;

  quoteElement.classList.add("is-fading-out");

  window.setTimeout(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    quoteElement.textContent = quotes[quoteIndex];
    quoteElement.classList.remove("is-fading-out");
  }, 600);
}

function startRotation() {
  if (prefersReducedMotion.matches || intervalId !== null) return;
  intervalId = window.setInterval(cycleQuotes, 4000);
}

function stopRotation() {
  if (intervalId === null) return;
  window.clearInterval(intervalId);
  intervalId = null;
}

if (quoteElement) {
  quoteElement.textContent = quotes[quoteIndex];

  if (!prefersReducedMotion.matches) {
    startRotation();
  }

  const handleMotionPreferenceChange = (event) => {
    if (event.matches) {
      stopRotation();
    } else {
      quoteIndex = 0;
      quoteElement.textContent = quotes[quoteIndex];
      stopRotation();
      startRotation();
    }
  };

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener(
      "change",
      handleMotionPreferenceChange,
    );
  } else if (typeof prefersReducedMotion.addListener === "function") {
    prefersReducedMotion.addListener(handleMotionPreferenceChange);
  }
}

const interestData = {
  clusters: [
    { id: "creative", label: "Creative", center: [0.25, 0.4], radius: 0.26 },
    { id: "mind", label: "Mind", center: [0.5, 0.58], radius: 0.24 },
    { id: "tech", label: "Tech", center: [0.75, 0.42], radius: 0.26 },
  ],
  nodes: [
    {
      id: "video_editing",
      label: "Video Editing",
      cluster: "creative",
      weight: 0.9,
      desc: "Experimentiere mit Schnitt, Sounddesign und Motion Graphics.",
    },
    {
      id: "picture_editing",
      label: "Picture Editing",
      cluster: "creative",
      weight: 0.75,
      desc: "Bildkomposition und Farblooks in Lightroom und Photoshop.",
    },
    {
      id: "kunst",
      label: "Kunst",
      cluster: "creative",
      weight: 0.6,
      desc: "Skizzieren, Museumsbesuche und das Ausprobieren neuer Stile.",
    },
    {
      id: "typewriter",
      label: "Typewriter",
      cluster: "creative",
      weight: 0.5,
      desc: "Sammeln und Restaurieren mechanischer Schreibmaschinen.",
    },
    {
      id: "philosophy",
      label: "Philosophy",
      cluster: "mind",
      weight: 0.8,
      desc: "Diskussionen über Ethik, Logik und die großen Fragen.",
    },
    {
      id: "neurobiology",
      label: "Neurobiology",
      cluster: "mind",
      weight: 0.7,
      desc: "Neugier auf neuronale Netzwerke und kognitive Prozesse.",
    },
    {
      id: "mentality",
      label: "Mentality",
      cluster: "mind",
      weight: 0.55,
      desc: "Mindset-Training, Journaling und kontinuierliche Reflexion.",
    },
    {
      id: "jordan_peterson",
      label: "Jordan Peterson",
      cluster: "mind",
      weight: 0.5,
      desc: "Analyse seiner Vorträge zu Verantwortung und persönlichem Wachstum.",
    },
    {
      id: "video_games",
      label: "Video Games",
      cluster: "tech",
      weight: 0.7,
      desc: "Strategie- und Simulationsspiele als Sandbox für Teamwork.",
    },
    {
      id: "bmw",
      label: "BMW",
      cluster: "tech",
      weight: 0.85,
      desc: "Leidenschaft für Ingenieurskunst, Motorsport und Fahrdynamik.",
    },
  ],
  edges: [
    ["video_editing", "picture_editing"],
    ["picture_editing", "kunst"],
    ["philosophy", "neurobiology"],
    ["philosophy", "mentality"],
    ["video_games", "bmw"],
  ],
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const chart = document.querySelector("[data-bubble-chart]");
const edgesSvg = chart?.querySelector("[data-edges]");
const filterButtons = document.querySelectorAll("[data-filter]");
const bubbleLabel = document.querySelector("[data-interest-label]");
const bubbleDescription = document.querySelector("[data-interest-description]");

const chartState = {
  bubbles: new Map(),
  clusters: new Map(),
  edges: [],
  adjacency: new Map(),
  activeId: null,
  currentFilter: "all",
  resizeTimer: null,
};

function createClusterElements(container) {
  const layer = document.createElement("div");
  layer.className = "bubble-chart__cluster-layer";
  container.prepend(layer);

  interestData.clusters.forEach((cluster) => {
    const clusterEl = document.createElement("div");
    clusterEl.className = "cluster";
    clusterEl.dataset.clusterId = cluster.id;

    const ring = document.createElement("div");
    ring.className = "cluster__ring";
    const label = document.createElement("span");
    label.className = "cluster__label";
    label.textContent = cluster.label;

    clusterEl.append(ring, label);
    layer.append(clusterEl);

    chartState.clusters.set(cluster.id, {
      element: clusterEl,
      data: cluster,
    });
  });

  return layer;
}

function createBubbleElements(container) {
  const layer = document.createElement("div");
  layer.className = "bubble-chart__node-layer";
  container.append(layer);

  interestData.nodes.forEach((node) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bubble";
    button.dataset.nodeId = node.id;
    button.dataset.cluster = node.cluster;
    button.textContent = node.label;
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => setActiveBubble(node.id));
    button.addEventListener("mouseenter", () => setActiveBubble(node.id));
    button.addEventListener("focus", () => setActiveBubble(node.id));

    layer.append(button);

    chartState.bubbles.set(node.id, {
      element: button,
      data: node,
      position: { x: 0, y: 0 },
      baseTranslate: { x: 0, y: 0 },
      clusterCenter: { x: 0, y: 0 },
      radius: 0,
      filterTranslate: { x: 0, y: 0 },
    });
  });

  return layer;
}

function buildAdjacency() {
  chartState.adjacency.clear();
  interestData.nodes.forEach((node) => {
    chartState.adjacency.set(node.id, new Set());
  });

  chartState.edges = interestData.edges
    .filter(([sourceId, targetId]) => {
      const source = chartState.bubbles.get(sourceId)?.data;
      const target = chartState.bubbles.get(targetId)?.data;
      return source && target && source.cluster === target.cluster;
    })
    .map(([sourceId, targetId]) => {
      chartState.adjacency.get(sourceId)?.add(targetId);
      chartState.adjacency.get(targetId)?.add(sourceId);

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.classList.add("bubble-chart__edge");
      path.dataset.source = sourceId;
      path.dataset.target = targetId;

      return {
        element: path,
        sourceId,
        targetId,
        cluster: chartState.bubbles.get(sourceId)?.data.cluster ?? "",
      };
    });
}

function packCluster(cluster, clusterNodes, dimensions) {
  const width = dimensions.width;
  const height = dimensions.height;
  const center = {
    x: cluster.center[0] * width,
    y: cluster.center[1] * height,
  };
  const clusterRadius = cluster.radius * Math.min(width, height);
  const sortedNodes = [...clusterNodes].sort((a, b) => b.weight - a.weight);
  const padding = 6;
  const minRatio = 0.2;
  const maxRatio = 0.38;

  let shrink = 1;
  while (shrink > 0.45) {
    const placements = [];
    let failed = false;

    for (let index = 0; index < sortedNodes.length; index += 1) {
      const node = sortedNodes[index];
      const baseRadius =
        clusterRadius * (minRatio + node.weight * (maxRatio - minRatio));
      const radius = Math.max(
        baseRadius * shrink,
        clusterRadius * 0.16 * shrink,
      );

      if (radius * 2 > clusterRadius * 2) {
        failed = true;
        break;
      }

      if (index === 0) {
        placements.push({
          nodeId: node.id,
          x: center.x,
          y: center.y,
          radius,
          clusterCenter: center,
          clusterRadius,
        });
        continue;
      }

      let attempts = 1;
      let placed = false;
      const spiralBase = radius + padding;
      const spiralStep = radius * 0.9 + padding;

      while (attempts < 500 && !placed) {
        const theta = attempts * GOLDEN_ANGLE;
        const rho = spiralBase + spiralStep * attempts;
        const candidateX = center.x + Math.cos(theta) * rho;
        const candidateY = center.y + Math.sin(theta) * rho;
        const distanceToCenter = Math.hypot(
          candidateX - center.x,
          candidateY - center.y,
        );

        if (distanceToCenter + radius > clusterRadius) {
          attempts += 1;
          continue;
        }

        let hasCollision = false;
        for (const placedNode of placements) {
          const distance = Math.hypot(
            candidateX - placedNode.x,
            candidateY - placedNode.y,
          );
          if (distance < placedNode.radius + radius + padding) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          placements.push({
            nodeId: node.id,
            x: candidateX,
            y: candidateY,
            radius,
            clusterCenter: center,
            clusterRadius,
          });
          placed = true;
        }

        attempts += 1;
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (!failed) {
      return placements;
    }

    shrink *= 0.95;
  }

  const fallback = [];
  const angleStep = (Math.PI * 2) / sortedNodes.length;
  sortedNodes.forEach((node, index) => {
    const radius = clusterRadius * 0.22;
    if (index === 0) {
      fallback.push({
        nodeId: node.id,
        x: center.x,
        y: center.y,
        radius,
        clusterCenter: center,
        clusterRadius,
      });
      return;
    }

    const angle = angleStep * index;
    const distance = clusterRadius * 0.55;
    fallback.push({
      nodeId: node.id,
      x: center.x + Math.cos(angle) * distance,
      y: center.y + Math.sin(angle) * distance,
      radius,
      clusterCenter: center,
      clusterRadius,
    });
  });

  return fallback;
}

function updateEdges() {
  if (!edgesSvg) return;

  edgesSvg.innerHTML = "";

  chartState.edges.forEach((edge) => {
    const source = chartState.bubbles.get(edge.sourceId);
    const target = chartState.bubbles.get(edge.targetId);
    if (!source || !target) return;

    const controlX =
      (source.position.x + target.position.x) / 2 +
      (source.clusterCenter.x - source.position.x) * 0.25;
    const controlY =
      (source.position.y + target.position.y) / 2 +
      (source.clusterCenter.y - source.position.y) * 0.25;

    edge.element.setAttribute(
      "d",
      `M ${source.position.x} ${source.position.y} Q ${controlX} ${controlY} ${target.position.x} ${target.position.y}`,
    );

    edgesSvg.append(edge.element);
  });
}

function applyFilter(filterId, options = { skipActiveUpdate: false }) {
  chartState.currentFilter = filterId;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filterId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  chartState.clusters.forEach((clusterState, clusterId) => {
    const dim = filterId !== "all" && clusterId !== filterId;
    clusterState.element.classList.toggle("cluster--dim", dim);
  });

  chartState.bubbles.forEach((bubbleState) => {
    if (filterId === "all") {
      bubbleState.filterTranslate = { x: 0, y: 0 };
      return;
    }

    if (bubbleState.data.cluster !== filterId) {
      bubbleState.filterTranslate = { x: 0, y: 0 };
      return;
    }

    const shiftX = (bubbleState.clusterCenter.x - bubbleState.position.x) * 0.1;
    const shiftY = (bubbleState.clusterCenter.y - bubbleState.position.y) * 0.1;
    bubbleState.filterTranslate = { x: shiftX, y: shiftY };
  });

  if (!options.skipActiveUpdate) {
    if (
      chartState.activeId &&
      filterId !== "all" &&
      chartState.bubbles.get(chartState.activeId)?.data.cluster !== filterId
    ) {
      const nextBubble = [...chartState.bubbles.values()].find(
        (bubble) => bubble.data.cluster === filterId,
      );
      chartState.activeId = nextBubble?.data.id ?? null;
    }

    updateActiveState();
  }
}

function updateActiveState() {
  const activeId = chartState.activeId;
  const neighborIds = new Set();

  if (activeId) {
    const neighbors = chartState.adjacency.get(activeId);
    neighbors?.forEach((neighborId) => neighborIds.add(neighborId));
  }

  chartState.clusters.forEach((clusterState, clusterId) => {
    const isActiveCluster =
      !!activeId &&
      chartState.bubbles.get(activeId)?.data.cluster === clusterId;
    clusterState.element.classList.toggle("cluster--active", isActiveCluster);
  });

  chartState.bubbles.forEach((bubbleState, bubbleId) => {
    const element = bubbleState.element;
    const baseTranslate = bubbleState.baseTranslate;
    const filterTranslate = bubbleState.filterTranslate ?? { x: 0, y: 0 };
    let translateX = baseTranslate.x + filterTranslate.x;
    let translateY = baseTranslate.y + filterTranslate.y;
    let scale = 1;

    const isActive = bubbleId === activeId;
    const isNeighbor = neighborIds.has(bubbleId);
    const matchesFilter =
      chartState.currentFilter === "all" ||
      bubbleState.data.cluster === chartState.currentFilter;

    if (isActive) {
      const focusX =
        (bubbleState.clusterCenter.x - bubbleState.position.x) * 0.08;
      const focusY =
        (bubbleState.clusterCenter.y - bubbleState.position.y) * 0.08;
      translateX += focusX;
      translateY += focusY;
      scale = 1.08;
    }

    element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    element.classList.toggle("bubble--active", isActive);

    const shouldDim =
      (!!activeId && !isActive && !isNeighbor) ||
      (chartState.currentFilter !== "all" && !matchesFilter);
    element.classList.toggle("bubble--dim", shouldDim);
    element.setAttribute("aria-pressed", String(isActive));
  });

  updateEdgesHighlight(activeId, neighborIds);

  if (activeId) {
    const activeBubble = chartState.bubbles.get(activeId);
    if (activeBubble && bubbleLabel && bubbleDescription) {
      bubbleLabel.textContent = activeBubble.data.label;
      bubbleDescription.textContent =
        activeBubble.data.desc ?? "Mehr zu diesem Schwerpunkt folgt in Kürze.";
    }
  }
}

function updateEdgesHighlight(activeId, neighborIds) {
  chartState.edges.forEach((edge) => {
    const { element, sourceId, targetId } = edge;
    const matchesFilter =
      chartState.currentFilter === "all" ||
      edge.cluster === chartState.currentFilter;
    const isConnected = activeId === sourceId || activeId === targetId;
    const neighborConnection =
      neighborIds.has(sourceId) || neighborIds.has(targetId) || isConnected;

    const dimByActive = !!activeId && !neighborConnection;
    const dimByFilter = chartState.currentFilter !== "all" && !matchesFilter;

    element.classList.toggle("edge--active", isConnected);
    element.classList.toggle("edge--dim", dimByActive || dimByFilter);
  });
}

function layoutChart() {
  if (!chart || !edgesSvg) return;
  const rect = chart.getBoundingClientRect();
  const dimensions = { width: rect.width, height: rect.height };

  buildAdjacency();

  interestData.clusters.forEach((cluster) => {
    const nodes = interestData.nodes.filter(
      (node) => node.cluster === cluster.id,
    );
    const placements = packCluster(cluster, nodes, dimensions);

    const clusterState = chartState.clusters.get(cluster.id);
    if (clusterState && placements.length) {
      const diameter = placements[0].clusterRadius * 2;
      const translateX = placements[0].clusterCenter.x - diameter / 2;
      const translateY = placements[0].clusterCenter.y - diameter / 2;
      clusterState.element.style.width = `${diameter}px`;
      clusterState.element.style.height = `${diameter}px`;
      clusterState.element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    }

    placements.forEach((placement) => {
      const bubbleState = chartState.bubbles.get(placement.nodeId);
      if (!bubbleState) return;

      const diameter = placement.radius * 2;
      bubbleState.element.style.width = `${diameter}px`;
      bubbleState.element.style.height = `${diameter}px`;
      bubbleState.position = { x: placement.x, y: placement.y };
      bubbleState.clusterCenter = placement.clusterCenter;
      bubbleState.radius = placement.radius;
      bubbleState.baseTranslate = {
        x: placement.x - placement.radius,
        y: placement.y - placement.radius,
      };
    });
  });

  updateEdges();
  applyFilter(chartState.currentFilter, { skipActiveUpdate: false });
}

function setActiveBubble(nodeId) {
  if (!chartState.bubbles.has(nodeId)) return;
  chartState.activeId = nodeId;
  updateActiveState();
}

function initSpecialInterests() {
  if (!chart || !edgesSvg) return;

  createClusterElements(chart);
  const bubbleLayer = createBubbleElements(chart);
  chart.append(edgesSvg);
  chart.append(bubbleLayer);

  layoutChart();

  const initialId = chartState.activeId ?? interestData.nodes[0]?.id;
  if (initialId) {
    chartState.activeId = initialId;
    updateActiveState();
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filterId = button.dataset.filter ?? "all";
      applyFilter(filterId);
    });
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(chartState.resizeTimer);
    chartState.resizeTimer = window.setTimeout(() => {
      layoutChart();
    }, 150);
  });
}

if (chart && edgesSvg) {
  initSpecialInterests();
}
