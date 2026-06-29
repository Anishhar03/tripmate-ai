(function () {
  "use strict";

  const STORAGE_KEY = "tripmate-ai-static-v1";
  const icon = (name, size = 18) => `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const money = (amount, currency = "USD") => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  const profiles = {
    kyoto: {
      country: "Japan", currency: "USD",
      image: "./public/kyoto.jpg",
      map: "https://www.openstreetmap.org/export/embed.html?bbox=135.73%2C34.96%2C135.80%2C35.04&layer=mapnik",
      areas: ["Higashiyama", "Gion", "Arashiyama", "Nishiki", "Fushimi"],
      activities: [
        ["Fushimi Inari sunrise walk", "Fushimi", "Landmark", 0, "Arrive before 7:30 for quiet paths and soft light."],
        ["Kiyomizu-dera and old lanes", "Higashiyama", "Culture", 4, "Walk downhill through Sannenzaka and Ninenzaka."],
        ["Seasonal kaiseki lunch", "Gion", "Food", 54, "A compact tasting menu keeps the afternoon flexible."],
        ["Philosopher's Path", "Sakyo", "Nature", 0, "Take the canal path north and pause at small temples."],
        ["Nishiki Market tasting loop", "Nishiki", "Food", 22, "Share small portions and keep cash for family stalls."],
        ["Arashiyama bamboo and riverside", "Arashiyama", "Nature", 12, "Start at the grove, finish beside Katsura River."],
        ["Tea ceremony with host", "Gion", "Culture", 38, "Book a small-group session with an English guide."],
        ["Pontocho evening walk", "Pontocho", "Neighborhood", 28, "Choose a counter-style dinner on a side lane."]
      ]
    },
    lisbon: {
      country: "Portugal", currency: "EUR",
      image: "./public/lisbon.jpg",
      map: "https://www.openstreetmap.org/export/embed.html?bbox=-9.18%2C38.69%2C-9.10%2C38.74&layer=mapnik",
      areas: ["Alfama", "Baixa", "Belem", "Chiado", "Graca"],
      activities: [
        ["Alfama viewpoint walk", "Alfama", "Neighborhood", 0, "Take the uphill route early and return by tram."],
        ["Tile museum visit", "Xabregas", "Culture", 8, "Allow extra time for the panoramic church interior."],
        ["Petiscos lunch", "Mouraria", "Food", 26, "Order three sharing plates and a house lemonade."],
        ["Belem riverside circuit", "Belem", "Landmark", 14, "Link the monastery, riverfront, and discovery monument."],
        ["Pastel tasting", "Belem", "Food", 7, "Try one classic custard tart and one seasonal flavor."],
        ["Sunset at Miradouro da Senhora", "Graca", "Nature", 0, "Arrive 35 minutes before sunset for a bench."],
        ["LX Factory studios", "Alcantara", "Design", 12, "Browse independent shops before dinner nearby."],
        ["Fado listening room", "Alfama", "Music", 42, "Pick a performance-first venue, not a large dinner show."]
      ]
    },
    cappadocia: {
      country: "Turkiye", currency: "USD",
      image: "./public/cappadocia.jpg",
      map: "https://www.openstreetmap.org/export/embed.html?bbox=34.78%2C38.61%2C34.91%2C38.69&layer=mapnik",
      areas: ["Goreme", "Uchisar", "Avanos", "Red Valley", "Kaymakli"],
      activities: [
        ["Balloon sunrise viewpoint", "Goreme", "Nature", 0, "Check wind status the evening before and keep a backup day."],
        ["Goreme Open Air Museum", "Goreme", "Culture", 18, "Enter at opening and add the Dark Church ticket."],
        ["Clay-pot lunch", "Avanos", "Food", 24, "Reserve a family-run restaurant with a terrace."],
        ["Red Valley ridge hike", "Red Valley", "Adventure", 8, "Carry water and finish before the trail loses daylight."],
        ["Uchisar Castle panorama", "Uchisar", "Landmark", 7, "The upper viewpoint has exposed stairs; wear grip shoes."],
        ["Underground city guided route", "Kaymakli", "Culture", 28, "Use the signed short route if enclosed spaces feel difficult."],
        ["Avanos pottery workshop", "Avanos", "Craft", 31, "A hands-on session gives you time with a local artisan."],
        ["Anatolian tasting dinner", "Goreme", "Food", 35, "Choose a menu that highlights regional grains and herbs."]
      ]
    }
  };
  const fallback = {
    country: "Explore locally", currency: "USD",
    image: "./public/travelers.jpg",
    map: "https://www.openstreetmap.org/export/embed.html?bbox=-0.2%2C51.45%2C0.05%2C51.56&layer=mapnik",
    areas: ["Old Town", "Riverside", "Arts District", "Central Market"],
    activities: [
      ["Historic center orientation walk", "Old Town", "Culture", 0, "Start with a compact route to learn the city's layout."],
      ["Local market tasting", "Central Market", "Food", 20, "Choose busy stalls and ask for regional specialties."],
      ["Independent museum visit", "Arts District", "Culture", 14, "Check the current exhibition before setting out."],
      ["Riverside cycle route", "Riverside", "Nature", 18, "Use a protected lane and stop at the public gardens."],
      ["Neighborhood cafe break", "North Quarter", "Food", 11, "Keep this flexible as a recovery window."],
      ["Golden-hour viewpoint", "Upper District", "Nature", 0, "Allow time for the walk back before dinner."],
      ["Chef-led regional dinner", "Old Town", "Food", 48, "Reserve a counter seat to learn about local ingredients."],
      ["Small live performance", "Arts District", "Music", 25, "Check start time and public transport after the show."]
    ]
  };

  function profileFor(destination) {
    const key = Object.keys(profiles).find((name) => destination.toLowerCase().includes(name));
    return key ? profiles[key] : fallback;
  }
  function dayCount(start, end) {
    const a = new Date(`${start}T12:00:00`); const b = new Date(`${end}T12:00:00`);
    const count = Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) ? 4 : Math.floor((b - a) / 86400000) + 1;
    return Math.min(7, Math.max(2, count));
  }
  function makeTrip(request) {
    const profile = profileFor(request.destination); const count = dayCount(request.startDate, request.endDate);
    const perDay = request.pace === "easy" ? 2 : request.pace === "packed" ? 4 : 3;
    const days = Array.from({ length: count }, (_, dayIndex) => {
      const date = new Date(`${request.startDate}T12:00:00`); date.setDate(date.getDate() + dayIndex);
      return {
        date: new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(date),
        title: dayIndex === 0 ? "Arrive and get oriented" : `${profile.areas[dayIndex % profile.areas.length]} at your pace`,
        theme: dayIndex % 2 ? "Neighborhoods + open air" : "Culture + local flavor",
        walkingKm: (4.2 + dayIndex * .8 + perDay * .4).toFixed(1),
        activities: Array.from({ length: perDay }, (_, itemIndex) => {
          const sourceIndex = (dayIndex * perDay + itemIndex) % profile.activities.length;
          const source = profile.activities[sourceIndex];
          return { id: `a-${Date.now()}-${dayIndex}-${itemIndex}`, time: ["08:30", "11:30", "14:30", "18:30"][itemIndex], title: source[0], area: source[1], category: source[2], cost: source[3], note: source[4], duration: ["2 hr", "1.5 hr", "2.5 hr"][sourceIndex % 3], saved: itemIndex === 0 };
        })
      };
    });
    const budget = Number(request.budget);
    return {
      id: `trip-${Date.now()}`, destination: request.destination || "Kyoto", country: profile.country,
      startDate: request.startDate, endDate: request.endDate, travelers: Number(request.travelers), budget,
      currency: profile.currency, pace: request.pace, styles: request.styles, image: profile.image, map: profile.map,
      summary: `${count} thoughtful days balancing ${(request.styles || []).slice(0, 2).join(" and ") || "local culture"}, short transfers, and recovery time. Built for ${request.travelers} traveler${Number(request.travelers) === 1 ? "" : "s"} with a ${request.pace} pace.`,
      days,
      budgetItems: [["Stay", .38, "#ef6a4c"], ["Food", .23, "#f2b84b"], ["Local travel", .14, "#3e8f89"], ["Experiences", .17, "#5474a8"], ["Buffer", .08, "#8b7aa8"]].map(([category, ratio, color]) => ({ category, amount: Math.round(budget * ratio), color })),
      checklist: [
        { id: "documents", label: "Entry documents", detail: "Verify passport validity and current entry rules.", done: true },
        { id: "insurance", label: "Travel insurance", detail: "Cover health, delay, and activity-specific risks.", done: false },
        { id: "transit", label: "Arrival transfer", detail: "Save the airport-to-stay route for offline use.", done: true },
        { id: "offline", label: "Offline access", detail: "Download your plan, maps, and key addresses.", done: false }
      ],
      agentNotes: ["Research agent grouped places by neighborhood to reduce transit churn.", `Budget agent kept an 8% buffer inside the ${profile.currency} ${budget.toLocaleString()} cap.`, "Safety agent left flexible windows and flagged plans that need live verification.", "Route agent alternated dense and lighter days to protect trip energy."]
    };
  }

  const demo = makeTrip({ destination: "Kyoto", startDate: "2026-10-12", endDate: "2026-10-16", travelers: 2, budget: 2400, pace: "balanced", styles: ["culture", "food", "nature"] });
  const stored = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [demo]; } catch { return [demo]; } })();
  const state = { trips: stored, activeId: stored[0].id, view: "plan", day: 0, sidebar: false, modal: false, chat: false, draftStyles: ["culture", "food", "nature"] };
  const trip = () => state.trips.find((item) => item.id === state.activeId) || state.trips[0];
  const range = (item) => `${new Date(`${item.startDate}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })} - ${new Date(`${item.endDate}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`;
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state.trips));
  const refreshIcons = () => window.lucide && window.lucide.createIcons();

  function tabs() {
    return `<nav class="view-tabs" aria-label="Trip sections">
      ${[["plan", "list-checks", "Itinerary"], ["budget", "circle-dollar-sign", "Budget"], ["map", "map", "Route map"]].map(([view, name, label]) => `<button class="${state.view === view ? "active" : ""}" onclick="TripMate.setView('${view}')">${icon(name,17)} ${label}</button>`).join("")}
    </nav>`;
  }
  function itinerary(item) {
    const day = item.days[state.day] || item.days[0];
    return `<div class="content-grid"><section class="itinerary-column">
      <div class="day-strip">${item.days.map((entry, index) => `<button class="${index === state.day ? "active" : ""}" onclick="TripMate.setDay(${index})"><span>Day ${index + 1}</span><strong>${escapeHtml(entry.date.split(",")[1] || entry.date)}</strong></button>`).join("")}</div>
      <div class="day-heading"><div><span class="eyebrow">${escapeHtml(day.theme)}</span><h2>${escapeHtml(day.title)}</h2></div><div class="day-metrics"><span>${icon("route",15)} ${day.walkingKm} km</span><span>${icon("circle-dollar-sign",15)} ${money(day.activities.reduce((sum,a)=>sum+a.cost,0),item.currency)}</span></div></div>
      <div class="timeline">${day.activities.map((activity) => `<article class="activity-row">
        <time>${activity.time}</time><div class="timeline-node"></div>${icon("grip-vertical",17).replace("<i ","<i class=\"drag-handle\" ")}
        <div class="activity-main"><div class="activity-topline"><span>${escapeHtml(activity.category)}</span><small>${icon("map-pin",13)} ${escapeHtml(activity.area)}</small></div><h3>${escapeHtml(activity.title)}</h3><p>${escapeHtml(activity.note)}</p><div class="activity-meta"><span>${icon("clock-3",14)} ${activity.duration}</span><span>${activity.cost ? money(activity.cost,item.currency) : "Free"}</span></div></div>
        <div class="activity-actions"><button class="${activity.saved ? "saved" : ""}" title="Bookmark activity" onclick="TripMate.bookmark('${activity.id}')">${icon("bookmark",17)}</button><button title="Remove activity" onclick="TripMate.removeActivity('${activity.id}')">${icon("trash-2",17)}</button></div>
      </article>`).join("")}</div>
      <button class="add-activity" onclick="TripMate.addActivity()">${icon("plus",17)} Add flexible activity</button>
    </section><aside class="insights-column">
      <section class="summary-block"><div class="section-title"><span>${icon("sparkles",17)}</span><div><small>Agent briefing</small><h3>Why this plan works</h3></div></div><p>${escapeHtml(item.summary)}</p><ul>${item.agentNotes.map(note=>`<li>${escapeHtml(note)}</li>`).join("")}</ul></section>
      <section class="readiness-block"><div class="section-title"><span class="yellow">${icon("list-checks",17)}</span><div><small>Before you go</small><h3>Travel readiness</h3></div></div><div class="checklist">${item.checklist.map(check=>`<button onclick="TripMate.check('${check.id}')"><span class="check-circle ${check.done?"done":""}">${check.done?icon("check",13):""}</span><span><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.detail)}</small></span></button>`).join("")}</div></section>
    </aside></div>`;
  }
  function budgetView(item) {
    const planned = item.days.flatMap(day=>day.activities).reduce((sum,a)=>sum+a.cost,0); const percent=Math.min(100,Math.round(planned/item.budget*100));
    return `<div class="budget-layout"><section class="budget-overview"><span class="eyebrow">Live trip budget</span><div class="budget-total"><div><small>Planned so far</small><strong>${money(planned,item.currency)}</strong></div><span>of ${money(item.budget,item.currency)}</span></div><div class="progress-track"><span style="width:${percent}%"></span></div><p>${100-percent}% remains for stays, transport, spontaneous stops, and your safety buffer.</p></section>
      <section class="budget-categories"><div class="section-heading"><div><span class="eyebrow">Recommended allocation</span><h2>Keep every category in view</h2></div><button class="text-button" onclick="TripMate.toast('Budget rebalanced')">${icon("refresh-cw",16)} Rebalance</button></div><div class="budget-bars">${item.budgetItems.map(row=>`<div class="budget-row"><span class="budget-swatch" style="background:${row.color}"></span><strong>${row.category}</strong><div class="mini-track"><span style="width:${row.amount/item.budget*100}%;background:${row.color}"></span></div><span>${money(row.amount,item.currency)}</span></div>`).join("")}</div></section>
      <section class="budget-tip">${icon("circle-dollar-sign",22)}<div><strong>Budget agent note</strong><p>Your itinerary clusters paid attractions with free neighborhoods, keeping an 8% buffer untouched until the final day.</p></div></section></div>`;
  }
  function mapView(item) {
    const activities=item.days.flatMap(day=>day.activities).slice(0,7);
    return `<div class="map-layout"><section class="map-frame"><iframe title="${escapeHtml(item.destination)} route map" src="${item.map}" loading="lazy"></iframe><div class="map-label">${icon("navigation",16)}<span><strong>Neighborhood-first route</strong><small>Fewer transfers, more time on the ground</small></span></div></section><aside class="route-list"><span class="eyebrow">Trip route</span><h2>Stops in travel order</h2>${activities.map((activity,index)=>`<div class="route-stop"><span>${index+1}</span><div><strong>${escapeHtml(activity.title)}</strong><small>${escapeHtml(activity.area)} · ${activity.duration}</small></div></div>`).join("")}</aside></div>`;
  }
  function modal() {
    if (!state.modal) return "";
    return `<div class="modal-backdrop"><section class="planner-modal" role="dialog" aria-modal="true"><div class="modal-visual"><button class="icon-btn back-button" onclick="TripMate.closeModal()" aria-label="Close planner">${icon("arrow-left",19)}</button><div><span class="trip-kicker">${icon("sparkles",14)} Your next journey</span><h2>Tell us how you like to travel.</h2><p>Four planning agents will research, route, budget, and safety-check the result.</p></div></div>
      <form class="planner-form" onsubmit="TripMate.submitTrip(event)"><div class="modal-title"><div><span class="eyebrow">New trip</span><h2>Build your brief</h2></div><button type="button" class="icon-btn" onclick="TripMate.closeModal()">${icon("x",19)}</button></div>
      <label>Where are you going?<input name="destination" required value="Lisbon" placeholder="City or region"></label><div class="field-row"><label>Start date<input name="startDate" required type="date" value="2026-11-05"></label><label>End date<input name="endDate" required type="date" value="2026-11-09"></label></div><div class="field-row"><label>Travelers<input name="travelers" min="1" max="12" type="number" value="2"></label><label>Total budget<input name="budget" min="100" step="50" type="number" value="2200"></label></div>
      <fieldset><legend>What matters most?</legend><div class="choice-grid">${["culture","food","nature","adventure","relaxed"].map(style=>`<button type="button" class="${state.draftStyles.includes(style)?"selected":""}" onclick="TripMate.toggleDraftStyle('${style}')">${style}</button>`).join("")}</div></fieldset>
      <fieldset><legend>Daily pace</legend><div class="segmented"><button type="button" onclick="TripMate.setDraftPace(this,'easy')">easy</button><button type="button" class="selected" onclick="TripMate.setDraftPace(this,'balanced')">balanced</button><button type="button" onclick="TripMate.setDraftPace(this,'packed')">packed</button><input name="pace" type="hidden" value="balanced"></div></fieldset>
      <label>Anything else?<textarea name="notes" rows="3" placeholder="Diet, mobility, celebrations, must-sees..."></textarea></label><button class="generate-button" type="submit">${icon("sparkles",18)} Generate my trip ${icon("chevron-right",18)}</button></form></section></div>`;
  }
  function chat(item) {
    if (!state.chat) return "";
    return `<aside class="chat-panel"><div class="chat-head"><div><span>${icon("bot",18)}</span><div><strong>TripMate copilot</strong><small>Grounded in this itinerary</small></div></div><button class="icon-btn" onclick="TripMate.closeChat()">${icon("x",19)}</button></div><div class="chat-messages" id="messages"><div class="chat-message agent">I know your ${escapeHtml(item.destination)} plan. Ask me to swap an activity, lower the budget, or explain a route choice.</div></div><div class="suggestions"><button onclick="TripMate.prefill('Make day two more relaxed')">Relax day two</button><button onclick="TripMate.prefill('Find a lower-cost dinner')">Lower dinner cost</button></div><form class="chat-input" onsubmit="TripMate.sendChat(event)"><input id="chat-input" placeholder="Ask about your plan..."><button>${icon("send",17)}</button></form></aside>`;
  }
  function render() {
    const item=trip(); document.getElementById("app").innerHTML=`<div class="app-shell"><header class="topbar"><button class="icon-btn mobile-only" onclick="TripMate.openSidebar()">${icon("menu",20)}</button><div class="brand-mark"><span>${icon("navigation",18)}</span><strong>TripMate</strong></div><div class="topbar-center"><span class="live-dot"></span><span>Local agents ready</span></div><div class="topbar-actions"><button class="icon-btn" title="Export offline copy" onclick="TripMate.exportTrip()">${icon("download",18)}</button><button class="share-button" onclick="TripMate.share()">${icon("share-2",17)}<span>Share</span></button><button class="avatar">AK</button></div></header>
      <div class="workspace"><aside class="sidebar ${state.sidebar?"sidebar-open":""}"><div class="sidebar-head"><div><span class="eyebrow">Travel workspace</span><h2>Your journeys</h2></div><button class="icon-btn close-sidebar" onclick="TripMate.closeSidebar()">${icon("x",19)}</button></div><button class="new-trip" onclick="TripMate.openModal()">${icon("plus",18)} Plan a new trip</button><nav class="trip-list">${state.trips.map(t=>`<button class="trip-list-item ${t.id===item.id?"active":""}" onclick="TripMate.selectTrip('${t.id}')"><span class="trip-thumb" style="background-image:url('${t.image}')"></span><span class="trip-copy"><strong>${escapeHtml(t.destination)}</strong><small>${range(t)}</small></span>${icon("chevron-right",16)}</button>`).join("")}</nav><div class="agent-status"><div class="agent-status-icon">${icon("bot",18)}</div><div><strong>4 planning agents</strong><small>Research, route, budget, safety</small></div><span class="status-pill">Ready</span></div></aside>${state.sidebar?`<button class="sidebar-scrim" onclick="TripMate.closeSidebar()"></button>`:""}
      <main class="main-stage"><section class="trip-hero" style="background-image:linear-gradient(90deg,rgba(10,31,30,.88),rgba(10,31,30,.34)),url('${item.image}')"><div class="trip-hero-content"><span class="trip-kicker">${icon("sparkles",14)} AI-curated journey</span><h1>${escapeHtml(item.destination)}</h1><p>${escapeHtml(item.country)}<span></span>${range(item)}</p></div><div class="trip-hero-stats"><div>${icon("calendar-days",18)}<span><strong>${item.days.length} days</strong><small>planned</small></span></div><div>${icon("users",18)}<span><strong>${item.travelers}</strong><small>travelers</small></span></div><div>${icon("wallet-cards",18)}<span><strong>${money(item.budget,item.currency)}</strong><small>trip budget</small></span></div></div></section>${tabs()}${state.view==="plan"?itinerary(item):state.view==="budget"?budgetView(item):mapView(item)}</main></div>
      <button class="chat-launcher" onclick="TripMate.openChat()">${icon("message-circle",21)}<span>Ask TripMate</span></button>${chat(item)}${modal()}
      <nav class="mobile-nav"><button class="${state.view==="plan"?"active":""}" onclick="TripMate.setView('plan')">${icon("list-checks",20)}<span>Plan</span></button><button class="${state.view==="budget"?"active":""}" onclick="TripMate.setView('budget')">${icon("circle-dollar-sign",20)}<span>Budget</span></button><button class="mobile-new" onclick="TripMate.openModal()">${icon("plus",22)}</button><button class="${state.view==="map"?"active":""}" onclick="TripMate.setView('map')">${icon("map",20)}<span>Map</span></button><button onclick="TripMate.openChat()">${icon("message-circle",20)}<span>Ask AI</span></button></nav></div>`; refreshIcons();
  }

  const api = {
    setView(view){state.view=view;render()}, setDay(day){state.day=day;render()}, openSidebar(){state.sidebar=true;render()}, closeSidebar(){state.sidebar=false;render()},
    selectTrip(id){state.activeId=id;state.day=0;state.sidebar=false;render()}, openModal(){state.modal=true;render()}, closeModal(){state.modal=false;render()}, openChat(){state.chat=true;render()}, closeChat(){state.chat=false;render()},
    toggleDraftStyle(style){state.draftStyles=state.draftStyles.includes(style)?state.draftStyles.filter(s=>s!==style):state.draftStyles.concat(style);render()},
    setDraftPace(button,pace){button.parentElement.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));button.classList.add("selected");button.parentElement.querySelector("input").value=pace},
    submitTrip(event){event.preventDefault();const data=new FormData(event.target);const request={destination:data.get("destination"),startDate:data.get("startDate"),endDate:data.get("endDate"),travelers:data.get("travelers"),budget:data.get("budget"),pace:data.get("pace"),styles:state.draftStyles};state.modal=false;document.body.insertAdjacentHTML("beforeend",`<div class="modal-backdrop agent-backdrop" id="agent-loading"><section class="agent-overlay"><div class="agent-orbit">${icon("sparkles",26)}<span></span><span></span></div><span class="eyebrow">Multi-agent planning</span><h2>Researching places, routes, budget, and safety</h2><div class="agent-progress"><span class="active"></span><span class="active"></span><span class="active"></span><span class="active"></span></div><p>Four agents are sharing one trip state.</p></section></div>`);refreshIcons();setTimeout(()=>{document.getElementById("agent-loading")?.remove();const next=makeTrip(request);state.trips.unshift(next);state.activeId=next.id;state.day=0;state.view="plan";save();render();api.toast("Your trip is ready")},1800)},
    bookmark(id){trip().days.forEach(day=>day.activities.forEach(a=>{if(a.id===id)a.saved=!a.saved}));save();render()},
    removeActivity(id){trip().days.forEach(day=>day.activities=day.activities.filter(a=>a.id!==id));save();render();api.toast("Activity removed")},
    addActivity(){trip().days[state.day].activities.push({id:`custom-${Date.now()}`,time:"16:30",title:"Flexible discovery window",area:trip().destination,category:"Free time",cost:0,note:"Keep this slot open for a local recommendation or a slower afternoon.",duration:"1.5 hr",saved:false});save();render();api.toast("Flexible activity added")},
    check(id){const item=trip().checklist.find(c=>c.id===id);if(item)item.done=!item.done;save();render()},
    toast(message){document.querySelector(".toast")?.remove();document.body.insertAdjacentHTML("beforeend",`<div class="toast">${icon("check",17)} ${escapeHtml(message)}</div>`);refreshIcons();setTimeout(()=>document.querySelector(".toast")?.remove(),2400)},
    async share(){const text=`TripMate plan: ${trip().destination}, ${range(trip())}`;try{if(navigator.share)await navigator.share({title:`${trip().destination} trip`,text});else await navigator.clipboard.writeText(text);api.toast(navigator.share?"Share sheet opened":"Plan summary copied")}catch{api.toast("Sharing was cancelled")}},
    exportTrip(){const blob=new Blob([JSON.stringify(trip(),null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${trip().destination.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-trip.json`;a.click();URL.revokeObjectURL(url);api.toast("Offline trip file downloaded")},
    prefill(value){document.getElementById("chat-input").value=value;document.getElementById("chat-input").focus()},
    sendChat(event){event.preventDefault();const input=document.getElementById("chat-input");const value=input.value.trim();if(!value)return;const messages=document.getElementById("messages");messages.insertAdjacentHTML("beforeend",`<div class="chat-message user">${escapeHtml(value)}</div><div class="chat-message agent">For ${escapeHtml(trip().destination)}, I would keep the neighborhood order and adjust the flexible afternoon slot first. Your saved plan remains unchanged until you approve an edit.</div>`);input.value="";messages.scrollTop=messages.scrollHeight}
  };
  window.TripMate=api; render();
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>undefined));
})();
