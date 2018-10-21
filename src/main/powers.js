const riftItems = [
  // Weapons
  "Biomolecular Re-atomizer Trap",
  "Christmas Crystalabra Trap",
  "Crystal Tower",
  "Focused Crystal Laser",
  "Multi-Crystal Laser",
  "Mysteriously unYielding Null-Onyx Rampart of Cascading Amperes",
  "Timesplit Dissonance Weapon",
  // Bases
  "Attuned Enerchi Induction Base",
  "Clockwork Base",
  "Enerchi Induction Base",
  "Fissure Base",
  "Fracture Base",
  "Rift Base",
  // Charms
  "Cherry Charm",
  "Enerchi Charm",
  "Gnarled Charm",
  "Stagnant Charm",
  "Super Enerchi Charm",
  "Super Spooky Charm",
  "Timesplit Charm"
];

const battery = {
  0: 0,
  1: 90,
  2: 500,
  3: 3000,
  4: 8500,
  5: 16000,
  6: 30000,
  7: 50000,
  8: 90000,
  9: 190000,
  10: 300000
};

/**
 * Calculates the total power of a given trap setup, after bonuses and special effects
 * @param {string} weapon Weapon name
 * @param {string} base Base name
 * @param {string} charm Charm name
 * @param {object} bonusObj All calculated power bonuses
 * @return {number} Integer rounded up
 */
function calcPower(weapon, base, charm, bonusObj) {
  const rawPower =
    weaponsArray[weapon][1] +
    basesArray[base][0] +
    charmsArray[charm][0] +
    bonusObj["battery"];
  const setupPowerBonus =
    weaponsArray[weapon][2] +
    basesArray[base][1] +
    charmsArray[charm][1] +
    bonusObj["power"];
  const totalBonus =
    1 + (setupPowerBonus + bonusObj["rift"] + bonusObj["cheese"]) / 100;

  return Math.ceil(rawPower * totalBonus * bonusObj["amp"] * bonusObj["brace"]);
}

/**
 * Generates the HTML string that is fed into tablesorter
 * Iterates through weapons/bases/arrays and accounts for special parameters
 * @return {string} resultsHTML
 */
function generateResults() {
  const bonusObj = {}; // Store all calculated bonuses
  let countPer = {}; // Memoize occurrences of each power value
  let countMax = 0; // Count towards max total results
  const powerType = $("#power-type").val();
  const riftMultiplier = parseInt($("input[name=rift-bonus]:checked").val());
  let resultsHTML =
    "<caption>Results</caption><thead><tr><th id='power'>Power</th><th id='weapon'>Weapon</th><th id='base'>Base</th><th id='charm'>Charm</th></tr></thead><tbody>";

  // Desired power bounds checks
  let powerMin = parseInt($("#desired-power-min").val());
  if (powerMin > 9999999) {
    powerMin = 9999999;
    $("#desired-power-min").val(9999999);
  } else if (powerMin < 0) {
    powerMin = 0;
    $("#desired-power-min").val(0);
  }

  let powerMax = parseInt($("#desired-power-max").val());
  if (powerMax > 9999999) {
    powerMax = 9999999;
    $("#desired-power-max").val(9999999);
  } else if (powerMax < 0) {
    powerMax = 0;
    $("#desired-power-max").val(0);
  }

  // Cancel early if power range is invalid
  if (powerMin > powerMax) {
    resultsHTML += "</tbody>";
    return resultsHTML;
  }

  // Power bonus bounds check
  let powerBonus = parseInt($("#power-bonus").val());
  if (powerBonus < 0) {
    powerBonus = 0;
    $("#power-bonus").val(0);
  } else if (powerBonus > 999) {
    powerBonus = 999;
    $("#power-bonus").val(999);
  }
  bonusObj["power"] = powerBonus;

  // Furoma Rift battery bounds check
  let batteryKey = parseInt($("#battery").val());
  if (batteryKey < 0) {
    batteryKey = 0;
    $("#battery").val(0);
  } else if (batteryKey > 10) {
    batteryKey = 10;
    $("#battery").val(10);
  }
  bonusObj["battery"] = battery[batteryKey];

  // ZT Tower Amplifier bounds check
  let ztBonus = parseInt($("#amp-bonus").val());
  if (ztBonus < 0) {
    ztBonus = 0;
    $("#amp-bonus").val(0);
  } else if (ztBonus > 175) {
    ztBonus = 175;
    $("#amp-bonus").val(175);
  }
  bonusObj["amp"] = ztBonus / 100;

  // Empowered cheese check
  bonusObj["cheese"] = $("#empowered-cheese").prop("checked") ? 20 : 0;

  // Per power bounds check
  let perPower = parseInt($("#per-power").val());
  if (perPower < 1) {
    perPower = 1;
    $("#per-power").val(1);
  } else if (perPower > 100) {
    perPower = 100;
    $("#per-power").val(100);
  }

  // Max results bounds check
  let maxResults = parseInt($("#max-results").val());
  if (maxResults < 1) {
    maxResults = 1;
    $("#max-results").val(1);
  } else if (maxResults > 9999) {
    maxResults = 9999;
    $("#max-results").val(9999);
  }

  for (let weapon in weaponsArray) {
    // Only dive into inner loops if power type matches
    if (weaponsArray[weapon][0] === powerType) {
      for (let base in basesArray) {
        // Physical Brace Base check
        bonusObj["brace"] =
          weaponsArray[weapon][0] === "Physical" &&
          base === "Physical Brace Base"
            ? 1.25
            : 1;
        for (let charm in charmsArray) {
          if (countMax >= maxResults) break; // Break out if max total results is exceeded
          bonusObj["rift"] = 0; // Resets to 0 every iteration
          if (riftMultiplier >= 1) {
            // Rift Bonus count
            const riftCount =
              +(riftItems.indexOf(weapon) > -1) +
              +(riftItems.indexOf(base) > -1) +
              +(riftItems.indexOf(charm) > -1 || charm.indexOf("Rift") > -1);
            if (riftCount >= 2) {
              // 2 or 3 triggers the power bonus of Rift set
              bonusObj["rift"] = 10 * riftMultiplier;
            }
          }
          const totalPower = calcPower(weapon, base, charm, bonusObj);
          const cPer = countPer[totalPower];
          if (cPer && cPer >= perPower) continue; // Skip if max results per power is exceeded
          if (totalPower >= powerMin && totalPower <= powerMax) {
            resultsHTML += `<tr><td>${totalPower}</td><td>${weapon}</td><td>${base}</td><td>${charm}</td></tr>`;
            if (typeof countPer[totalPower] === "undefined") {
              countPer[totalPower] = 1;
            } else {
              countPer[totalPower] += 1;
            }
            countMax++;
          }
        }
      }
    }
  }

  resultsHTML += "</tbody>";
  return resultsHTML;
}

window.onload = function() {
  // Initialize tablesorter
  $.tablesorter.defaults.sortInitialOrder = "desc";
  $("#trap-setups").tablesorter({
    sortReset: true,
    widthFixed: true,
    ignoreCase: false,
    widgets: ["filter"],
    widgetOptions: {
      filter_childRows: false,
      filter_childByColumn: false,
      filter_childWithSibs: true,
      filter_columnFilters: true,
      filter_columnAnyMatch: true,
      filter_cellFilter: "",
      filter_cssFilter: "", // or []
      filter_defaultFilter: {},
      filter_excludeFilter: {},
      filter_external: "",
      filter_filteredRow: "filtered",
      filter_formatter: null,
      filter_functions: null,
      filter_hideEmpty: true,
      filter_hideFilters: true,
      filter_ignoreCase: true,
      filter_liveSearch: true,
      filter_matchType: { input: "exact", select: "exact" },
      filter_onlyAvail: "filter-onlyAvail",
      filter_placeholder: { search: "Filter...", select: "" },
      filter_reset: "button.reset",
      filter_resetOnEsc: true,
      filter_saveFilters: false,
      filter_searchDelay: 420,
      filter_searchFiltered: true,
      filter_selectSource: null,
      filter_serversideFiltering: false,
      filter_startsWith: false,
      filter_useParsedData: false,
      filter_defaultAttrib: "data-value",
      filter_selectSourceSeparator: "|"
    }
  });

  $("#calculate-button").click(function() {
    console.time("Main loop duration");
    let resultsHTML = generateResults();
    console.timeEnd("Main loop duration");

    console.time("Tablesorter duration");
    document.getElementById("trap-setups").innerHTML = resultsHTML;
    const resort = true,
      callback = function() {
        const header = $("#power");
        if (header.hasClass("tablesorter-headerUnSorted")) {
          header.click();
          header.click();
        }
      };
    $("#trap-setups").trigger("updateAll", [resort, callback]);
    console.timeEnd("Tablesorter duration");
    console.log("------------------------------");
  });

  $("#reset-button").click(function() {
    $("#desired-power-min").val(2000);
    $("#desired-power-max").val(3000);
    $("#power-bonus").val(0);
    $("#battery").val(0);
    $("#amp-bonus").val(100);
    $("#per-power").val(1);
    $("#max-results").val(100);
  });

  $("#save-button").click(function() {
    // TODO: localStorage.setItem
    alert("Coming Soon");
  });
};