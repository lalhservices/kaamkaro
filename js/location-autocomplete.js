(function () {
  "use strict";

  var selectedByContext = {};

  var fallbackLocations = [
    { city: "Bainsa", district: "Shaheed Bhagat Singh Nagar", state: "Punjab", country: "India", formatted_location: "Bainsa, Shaheed Bhagat Singh Nagar, Punjab, India", place_id: "in-bainsa-sbsn-pb", lat: 31.105, lng: 76.38 },
    { city: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", country: "India", formatted_location: "Gandhinagar, Gujarat, India", place_id: "in-gandhinagar-gj", lat: 23.2156, lng: 72.6369 },
    { city: "Gandhinagar", district: "Kolhapur", state: "Maharashtra", country: "India", formatted_location: "Gandhinagar, Kolhapur, Maharashtra, India", place_id: "in-gandhinagar-kolhapur-mh", lat: 16.705, lng: 74.243 },
    { city: "Gandhinagar District", district: "Gandhinagar", state: "Gujarat", country: "India", formatted_location: "Gandhinagar District, Gujarat, India", place_id: "in-gandhinagar-district-gj", lat: 23.223, lng: 72.65 },
    { city: "Balachaur", district: "Nawanshahr", state: "Punjab", country: "India", formatted_location: "Balachaur, Nawanshahr, Punjab, India", place_id: "in-balachaur-pb", lat: 31.06, lng: 76.3 },
    { city: "Chandigarh", district: "Chandigarh", state: "Chandigarh", country: "India", formatted_location: "Chandigarh, India", place_id: "in-chandigarh", lat: 30.7333, lng: 76.7794 },
    { city: "Delhi", district: "Delhi", state: "Delhi", country: "India", formatted_location: "Delhi, India", place_id: "in-delhi", lat: 28.6139, lng: 77.209 },
    { city: "Pune", district: "Pune", state: "Maharashtra", country: "India", formatted_location: "Pune, Maharashtra, India", place_id: "in-pune-mh", lat: 18.5204, lng: 73.8567 },
    { city: "Kochi", district: "Ernakulam", state: "Kerala", country: "India", formatted_location: "Kochi, Ernakulam, Kerala, India", place_id: "in-kochi-kl", lat: 9.9312, lng: 76.2673 },
    { city: "Hyderabad", district: "Hyderabad", state: "Telangana", country: "India", formatted_location: "Hyderabad, Telangana, India", place_id: "in-hyderabad-ts", lat: 17.385, lng: 78.4867 },
    { city: "Mumbai", district: "Mumbai", state: "Maharashtra", country: "India", formatted_location: "Mumbai, Maharashtra, India", place_id: "in-mumbai-mh", lat: 19.076, lng: 72.8777 },
    { city: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", country: "India", formatted_location: "Bengaluru, Karnataka, India", place_id: "in-bengaluru-ka", lat: 12.9716, lng: 77.5946 },
    { city: "Jaipur", district: "Jaipur", state: "Rajasthan", country: "India", formatted_location: "Jaipur, Rajasthan, India", place_id: "in-jaipur-rj", lat: 26.9124, lng: 75.7873 },
    { city: "Surat", district: "Surat", state: "Gujarat", country: "India", formatted_location: "Surat, Gujarat, India", place_id: "in-surat-gj", lat: 21.1702, lng: 72.8311 },
    { city: "Amritsar", district: "Amritsar", state: "Punjab", country: "India", formatted_location: "Amritsar, Punjab, India", place_id: "in-amritsar-pb", lat: 31.634, lng: 74.8723 },
    { city: "Karimnagar", district: "Karimnagar", state: "Telangana", country: "India", formatted_location: "Karimnagar, Telangana, India", place_id: "in-karimnagar-ts", lat: 18.4386, lng: 79.1288 },
    { city: "Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", formatted_location: "Tiruchirappalli, Tamil Nadu, India", place_id: "in-tiruchirappalli-tn", lat: 10.7905, lng: 78.7047 }
  ];

  function cfg() {
    return window.KaamKaroSupabase && window.KaamKaroSupabase.config ? window.KaamKaroSupabase.config() : {};
  }

  function normalize(loc) {
    if (!loc) return null;
    var city = loc.city || loc.village || loc.name || "";
    var district = loc.district || city;
    var state = loc.state || district || city;
    return {
      city: city,
      district: district,
      state: state,
      country: loc.country || "India",
      formatted_location: loc.formatted_location || [city, district !== city ? district : "", state !== district ? state : "", "India"].filter(Boolean).join(", "),
      place_id: loc.place_id || loc.placeId || "",
      lat: loc.lat == null ? null : Number(loc.lat),
      lng: loc.lng == null ? null : Number(loc.lng)
    };
  }

  function label(loc) {
    var item = normalize(loc);
    if (!item) return "";
    var parts = [];
    [item.city, item.district, item.state].forEach(function (part) {
      if (part && parts.map(function (value) { return value.toLowerCase(); }).indexOf(part.toLowerCase()) < 0) parts.push(part);
    });
    return parts.join(", ");
  }

  function localSearch(query) {
    var q = String(query || "").toLowerCase().trim();
    var rows = q ? fallbackLocations.filter(function (loc) {
      return [loc.city, loc.district, loc.state, loc.formatted_location, label(loc)].join(" ").toLowerCase().indexOf(q) >= 0;
    }) : fallbackLocations;
    return rows.slice(0, 8).map(normalize);
  }

  function findByPlaceId(placeId) {
    return fallbackLocations.map(normalize).find(function (loc) { return loc.place_id === placeId; }) ||
      Object.keys(selectedByContext).map(function (key) { return selectedByContext[key]; }).find(function (loc) { return loc && loc.place_id === placeId; }) ||
      null;
  }

  function findByInput(value) {
    var text = String(value || "").trim().toLowerCase();
    if (!text) return null;
    return fallbackLocations.map(normalize).find(function (loc) {
      return label(loc).toLowerCase() === text || String(loc.formatted_location || "").toLowerCase() === text;
    }) || Object.keys(selectedByContext).map(function (key) { return selectedByContext[key]; }).find(function (loc) {
      return loc && (label(loc).toLowerCase() === text || String(loc.formatted_location || "").toLowerCase() === text);
    }) || null;
  }

  async function search(query) {
    var local = localSearch(query);
    var backendUrl = String(cfg().backendUrl || "").replace(/\/$/, "");
    if (!backendUrl || String(query || "").trim().length < 2) return local;
    try {
      var response = await fetch(backendUrl + "/locations/autocomplete?q=" + encodeURIComponent(query));
      if (!response.ok) return local;
      var json = await response.json();
      var remote = Array.isArray(json.locations) ? json.locations.map(normalize).filter(Boolean) : [];
      return remote.length ? remote.slice(0, 8) : local;
    } catch (error) {
      return local;
    }
  }

  function renderDropdown(input, locations) {
    var dropdown = input._kaamLocationDropdown;
    if (!dropdown) return;
    input._kaamLocationResults = locations.slice();
    if (!locations.length) {
      dropdown.innerHTML = '<div class="location-empty">No exact match. Please select a location from the list.</div>';
      dropdown.classList.add("show");
      return;
    }
    dropdown.innerHTML = locations.map(function (loc) {
      return '<button type="button" data-location-place="' + loc.place_id + '"><b>' + label(loc) + '</b><small>' + loc.formatted_location + '</small></button>';
    }).join("");
    dropdown.classList.add("show");
  }

  function choose(input, loc) {
    var item = normalize(loc);
    if (!item) return;
    var context = input.dataset.locationInput || "location";
    selectedByContext[context] = item;
    input.value = label(item);
    input.dataset.selectedPlaceId = item.place_id;
    if (input._kaamLocationDropdown) input._kaamLocationDropdown.classList.remove("show");
    input.dispatchEvent(new CustomEvent("kaamkaro:location-selected", {
      bubbles: true,
      detail: { context: context, location: item }
    }));
  }

  function attach(input) {
    if (!input || input._kaamLocationAttached) return;
    input._kaamLocationAttached = true;
    input.setAttribute("autocomplete", "off");
    input.placeholder = "City, district, state";

    var anchor = input.closest("label") || input.parentElement || input;
    var dropdown = document.createElement("div");
    dropdown.className = "location-autocomplete";
    anchor.insertAdjacentElement("afterend", dropdown);
    input._kaamLocationDropdown = dropdown;

    input.addEventListener("focus", async function () {
      renderDropdown(input, await search(input.value));
    });
    input.addEventListener("input", async function () {
      delete selectedByContext[input.dataset.locationInput || "location"];
      input.removeAttribute("data-selected-place-id");
      renderDropdown(input, await search(input.value));
    });
    dropdown.addEventListener("mousedown", function (event) {
      event.preventDefault();
      var button = event.target.closest("[data-location-place]");
      if (!button) return;
      var loc = (input._kaamLocationResults || []).find(function (item) { return item.place_id === button.dataset.locationPlace; }) ||
        findByPlaceId(button.dataset.locationPlace) ||
        localSearch(input.value).find(function (item) { return item.place_id === button.dataset.locationPlace; });
      choose(input, loc);
    });
  }

  function attachAll(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-location-input]"), attach);
  }

  document.addEventListener("click", function (event) {
    Array.prototype.forEach.call(document.querySelectorAll(".location-autocomplete.show"), function (dropdown) {
      if (!dropdown.previousElementSibling || (!dropdown.contains(event.target) && !dropdown.previousElementSibling.contains(event.target))) {
        dropdown.classList.remove("show");
      }
    });
  });

  window.KaamKaroLocation = {
    fallbackLocations: fallbackLocations.map(normalize),
    attach: attach,
    attachAll: attachAll,
    search: search,
    localSearch: localSearch,
    findByInput: findByInput,
    findByPlaceId: findByPlaceId,
    formatLabel: label,
    normalize: normalize,
    getSelected: function (context) { return selectedByContext[context] || null; },
    setSelected: function (context, loc) { selectedByContext[context] = normalize(loc); }
  };
})();
