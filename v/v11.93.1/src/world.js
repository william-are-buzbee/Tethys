// world.js — the islands: their geology as a terrain function (records, v11.61; the land term, v11.62), the condition fields, the wave function, landmark placement
// ---------- world shape ----------
// A young oceanic shield volcano, almost drowned (PLANET.md, Geology), standing in a silled basin (v11.58, below). 120x120 cells,
// the island's own square the middle 16. The summit is a caldera whose rim is the
// last land; the shelf is the shield's upper flank; the slope ring carries drowned shorelines (terraces) as rings; one flank
// has collapsed (a scarp and a debris fan: the rockfall); the oldest flank has its radial dikes exhumed as ridges;
// two rift arms run from the summit, one with a pit crater on it and a hydrothermal fissure at its deep end; beyond the apron
// the floor goes on down the seamount's flank toward the plate (v11.28; to v11.27 a cliff into a void at -810). There are no biomes: sample(x,z) returns the ground height and the physical CONDITIONS
// at a point (substrate, current, wave exposure, food, turbidity, the age of the rock, heat, shelter, relief), and every
// species — sessile or swimming — has a tolerance envelope over those (envW). Nothing downstream reads a label.
const CELL=215,NCELL=240,HALF=CELL*NCELL/2; // v11.65 (ARCHIPELAGO step 4): 240 cells, 51.6 km — the giant whole (its centre 15.4 km out, its foot to 29) and the sill's crest with 23 km of the ocean's flank beyond it; 120 (25.8 km) from v11.58, 16 (3.4 km) to v11.57. Must divide by 4 (far.js regions)
// the geology's parameters: angles are radians from +x toward +z
const WIND_A=3.49,CUR_A=2.3; // the directions the wind (so the waves) and the ocean current travel toward: the waves strike the old flank (0.35), the current the north-east flank (5.44), the lee is the collapse's side
const RIFT_A=[2.6,5.6]; // the two rift arms
const COLL={a:3.9,hw:0.40}; // the flank collapse: the amphitheatre's centre and half-width at the scarp (it widens downslope)
const DIKE={a:0.35,hw:0.62}; // the oldest flank, wave-cut deepest in the lowstands: its radial dike swarm stands as ridges
const RIM_R=245,RIM_W=34; // the caldera rim: crest radius, width
const FLANK_R=1560,FLANK_W=250,FLANK_S0=0.30,FLANK_S1=0.22,FLANK_A=600,FLANK_B=2600; // the lower flank (sample(), v11.28): the apron's toe, the ramp's width, the slopes (tan) at the top and eased, the easing's span beyond the toe
const VENT={a:2.6,r0:1200,r1:1420}; // the hydrothermal fissure: the deep end of rift arm 0
const ISLE={x:Math.cos(5.5)*500,z:Math.sin(5.5)*500}; // a flank cone on rift arm 1: the island
// The island as a tuff cone (v11.86, the person, 23 Sep 2026: the round hill with a plume "looks too neat to feel like it could've been any island
// in the game"). A small vent erupting into shallow water on a shield's flank builds a tuff cone — Diamond Head, Koko Crater, Capelinhos — and
// its shape is the forces on it: a ring round a crater, not a hill; the rim highest downwind, where the ash fell (Diamond Head's high point is on
// its trade-wind rim), h × (1 + lean) there and × (1 − lean) upwind; the sea broke in on the windward side, so the rim is breached there (a gap
// gapA rad either side of the upwind axis, its floor gapH) and the crater floor is a pond at floor, tidal through the gap; the windward outer slope
// is cut back to a cliff over a wave-cut platform at plat, with a boulder apron below (sub reads the ring as rock); the lee keeps the flat of
// bars and pools at flat, reaching flatR all round, spit further down-current and leeR further downwind — the spit points down the current, which
// here runs toward the caldera rim, and its reach is v11.85's 200 so the saddle between the cone and the rim is untouched. The tuff is
// palagonite, tan (chunks.js terrainColor, coneK), and the cone is cold: no plume (the strike above).
const CONE={r:70,wIn:16,wOut:60,h:30,lean:0.6,gapA:0.8,gapH:-2.5,floor:0.8,flat:-0.6,plat:-3,flatR:120,spit:80,leeR:40}; // the rim's radius and its inner and outer widths (m), its height and the downwind lean; the breach's half-angle (rad) and floor; the crater floor; the lee flat, the windward platform; the flat's reach and its extra down-current and downwind
function coneK(x,z){let k=0;for(const R of ISLANDS){if(!R.isle)continue;let lx=x-R.x,lz=z-R.z;if(R.rot){const c=Math.cos(R.rot),s=Math.sin(R.rot),tx=lx*c+lz*s;lz=lz*c-lx*s;lx=tx;}if(R.sc!==1){lx/=R.sc;lz/=R.sc;}
  k=Math.max(k,smooth(CONE.r+CONE.wOut*1.6,CONE.r+CONE.wOut*0.4,Math.hypot(lx-R.isle.x,lz-R.isle.z)));}return k;} // 1 on the ring, 0 past its foot: the tuff's colour (chunks.js)
const PIT=[Math.cos(2.6)*470,Math.sin(2.6)*470]; // a pit crater on rift arm 0
// ---------- the basin and the sill (v11.58) ----------
// DIRECTION.md (12 Sep) and PLANET, The basin: the island stands in a silled basin far larger than the world. The floor is abyssal
// plain at BASIN.h — pelagic mud over abyssal hills of ±BASIN.hill, ~1.5 km across — and the flank meets it through a sediment apron
// (smax's knee: the toe filled to a rounded foot, as a seamount's is). The sill's nearest segment crosses the north-east corner: a
// ridge of drowned older shields of the same province (the Iceland-Faroe Ridge is the Earth case, a hotspot track subsided to a 480 m
// sill), crest SILL.crest with summits rising SILL.summit toward the light and saddles at SILL.gap — the sill proper, 20 m over the
// chemocline, so the water under the saddles never leaves the basin (Cariaco, the Black Sea: the chemocline sits below the sill). The
// ridge runs across the current's axis with its main gap on it (SILL.a is CUR_A reversed): the inflow through the gap is what strikes
// the north-east flank, so the upwelling (upW) is the gap's. Beyond the crest the outer flank goes on down toward the plate — the
// ordinary ocean, whose deep is oxic; the game's chemocline is the basin's and is wrong there (open: since v11.65 the world reaches 23 km
// past the crest, where the outer flank goes on down the ridge's own 12° to the plate at SILL.plate — PLANET's ~-3800 — and lies flat; to
// v11.64 the clamp kept the player within 5 km of the crest and the flank stopped at the sill's window). The seamount effect (the island's share of nut and the current's wake) fades out over BASIN.fade of rw.
// Nothing inside r 2400 changes: the flank there is above -600, the floor under -1040, and smax is exact past its knee.
const BASIN={h:-1100,hill:60,knee:200,fade:[3000,6000]}; // the floor; the hills' amplitude; the apron's blend band; where the island's upwelling fades, in rw
const SILL={a:CUR_A+Math.PI,d:13000,crest:-410,gap:-430,summit:260,slope:0.21,wobble:450,w:150,plate:-3800}; // plate (v11.65): the ocean floor beyond the ridge, where the outer flank ends // the ridge's normal (from the island toward the crest: the current's source), the crest's distance, its height, the saddles', the summits' rise, the flanks (tan 12°), the crest's wander, its rounding
const SILL_C=Math.cos(SILL.a),SILL_S=Math.sin(SILL.a);
// the condition fields, by index in sample().f
const FI={sub:0,flow:1,expo:2,nut:3,turb:4,young:5,heat:6,shel:7,rel:8},NF=9;
// ---------- the clock and the tide ----------
// Mean sea level is 0; the water stands TIDE above it now. One large close moon (PLANET, Moon): semidiurnal tides of 6–9 m on a
// 30 h day — the tide's period is half the lunar day (31.2 h: two a day, ~1.2 h later each day), the range swings from 6 m at
// neaps to 9 m at springs over half a lunar month (13 days). The clock runs at CLOCK_RATE game hours per real second: a day in
// forty minutes, a tide in twenty-one, the water at mid-tide on a spring moving ~2 cm a second. It starts at mid-flood on a spring
// (tideAt(0) = 0 and rising), so the first thing the world does is come in. Day and night will run on the same clock (PLANET).
// The intertidal band on the rocks (scene.js addTint) is the spring range, ±TIDE_A1; the wet line follows TIDE.
const DAY_H=30,LUNAR_H=31.2,TIDE_P=LUNAR_H/2,SPRING_D=13,TIDE_A0=3.0,TIDE_A1=4.5; // hours in a day; the moon's day; the tide's period; days spring to spring; neap and spring amplitudes
const CLOCK_RATE=DAY_H/(40*60); // game hours per real second
let clockH=0,TIDE=0; // game hours since boot; the tide now (main.js sets both once a frame)
function tideAmp(h){return lerp(TIDE_A0,TIDE_A1,0.5+0.5*Math.cos(TAU*h/(DAY_H*SPRING_D)));}
function tideAt(h){return tideAmp(h)*Math.sin(TAU*h/TIDE_P);}
function tideRate(h){return tideAmp(h)/TIDE_A1*Math.cos(TAU*h/TIDE_P);} // the rise, as a fraction of a spring's fastest: +1 mid-flood, -1 mid-ebb, 0 at high and low water
// The tidal stream: the ocean's tide moves water past the island as a rectilinear stream along TIDE_A (toward it on the flood,
// back on the ebb) that the shield deflects — potential flow round a cylinder the size of the slope (TIDE_R: over the shelf and
// the terraces the water is too shallow to go over, so it goes round). Nothing at the two points on the axis (the fed flank, the
// wake), twice the far-field speed along the flanks square to it, tangential — so it splits at the upstream point and rejoins
// downstream, unlike the steady current, which goes one way round: on the collapse side the flood adds to it, on the dikes the
// ebb does, and there the current visibly turns twice a day. Inside the rim it runs pass to pass at half speed: the lagoon flushes
// as a through-flow, not by its own volume (a 250 m lagoon filling 9 m through its passes would run at centimetres a second).
// tidalAt gives the stream at full flood (rate 1); chunks.js currentOf adds it to the steady current times tideRate.
const TIDE_A=CUR_A,TIDE_U=0.5,TIDE_R=900; // the stream's axis; its far-field speed at mid-tide on a spring, m/s (1.0 on the flanks); the cylinder
function tidalAt(x,z,out){const r=Math.hypot(x,z),ex=Math.cos(TIDE_A),ez=Math.sin(TIDE_A);
  if(r<1e-3){out.set(ex*TIDE_U*0.5,0,ez*TIDE_U*0.5);return out;}
  const q=Math.max(r,TIDE_R),R2=TIDE_R*TIDE_R/(q*q),rx=x/r,rz=z/r,d=ex*rx+ez*rz; // inside the cylinder the surface flow: 2U tangential
  const ox=TIDE_U*(ex+R2*(ex-2*d*rx)),oz=TIDE_U*(ez+R2*(ez-2*d*rz)),k=smooth(RIM_R+RIM_W,RIM_R-RIM_W,r); // k: 1 inside the rim
  out.set(lerp(ox,ex*TIDE_U*0.5,k),0,lerp(oz,ez*TIDE_U*0.5,k));return out;}
// ---------- the depth curve: one definition, for the JS and the GLSL (v11.32) ----------
// This was written six times between atmosphere.js, chunks.js and scene.js's shader strings, and had drifted.
// The daylight curve — how much of the surface's light is left at a depth, the number the fog's veil, the ambient, the sun's
// own scale and the shadows all read — measured depth from the tide in the JS and from sea level in the GLSL. The difference
// is the tide over DL_REF: at most 2.2% of the light at spring, nothing below -302 where the curve clamps, so this fixes a
// disagreement nobody could see rather than a look. The person's call (12 Sep): depth is from the water's surface, so the
// shader follows the JS. The shader reads TIDE as uFogW.x (scene.js; main.js writes it each frame with the other clock uniforms).
// The canopy fade (CAN_LO/CAN_HI, canopyFade) that sat here to v11.80 went with the canopy's paint (v11.81, PLANKTON.md §12).
const DL_REF=420,DL_MIN=0.28; // the depth the daylight curve would reach zero at, and its floor
function daylightAt(y){return clamp(1+Math.min(0,y-TIDE)/DL_REF,DL_MIN,1);}
// The chemocline (PLANET): one depth, and the bands the water's look and the sessile life take from it. It was a bare -450
// in a dozen places with -444/-446/-448/-452/-455/-458/-462/-464/-465/-470 around it, so moving it meant finding all of them.
const CHEMO=-450,CHEMO_PLATE=2,CHEMO_TINT=[CHEMO+4,CHEMO-12]; // the milky plate's half-thickness; the band the water browns over
// ---------- the sky's clock: the sun, the moon, the weather (v11) ----------
// Day and night run on the same clock as the tide (PLANET, Moon: a 30 h day, bright nights under the big moon). The island is
// tropical (a 26–28 °C mixed layer), so it sits at a low latitude LAT and the sun passes nearly overhead; no axial tilt has
// been decided, so there are no seasons and day and night are 15 h each. Boot is late morning (SOLAR_H0): sunset is 11.5 h
// (15 real minutes) in, and the moon — full at boot, since a spring tide is a full or a new moon and a full one is the better
// first night — rises with it. The moon's upper transit is at local midnight (MOON_T0); the tide's high water follows it by
// half an hour (a lunitidal interval). The moon itself: ~3× Earth's tidal force — 1.44× the Moon's diameter at the Moon's density
// (MOON_R, below; to v11.16 it was drawn at three times the Moon's), twice the Moon's light, drawn brighter as a look (MOONL) — one
// synodic month of 26 days (two springs, SPRING_D 13 apart). East is +x, north is -z (the compass), so the sun rises over the dikes and sets over the
// collapse. Everything here is a function of the hour, deterministic: skyDir gives a body's direction for an hour angle.
const LAT=0.2,SOLAR_H0=11,MOON_T0=19; // latitude (rad); local hour at boot; the moon's first upper transit (clockH)
// The year (v11.83, PLANKTON.md §6, PLANET "Decided 22 Sep 2026"): YEAR_D local days of DAY_H, derived from the star by Kepler (~0.63 Earth years);
// a modest tilt TILT — a big close moon holds the obliquity steady, and at 11.5° N with 15° the sun passes overhead twice a year: a tropical
// year with two mild peaks, not a summer. The sun's declination is TILT·sin(2π·phase), the equinox at phase 0 with the sun heading north;
// the moon and the wanderers keep declination 0 (the moon's orbit's tilt is the moon pass's). The season is the WIND, not the temperature:
// the trades blow harder and steadier while the sun is south (an 11.5° N island's winter, as Earth's north-east trades do) and slacken while
// it is north — seasonAt is +1 at the windy peak, −1 at the still one; weatherAt biases the calms and the showers by it, and the plankton
// (bloomC) deepens the mixed layer and feeds the gold in the windy half, sharpens the deep maximum in the still. Boot is YEAR_P0 of the
// year in: early in the windy half (the sun south of the equator, heading to its southern peak at 0.75). The ledger's capacity does not read the season (census untouched); the swarms of pass 4 will.
const YEAR_D=185,TILT=0.262,YEAR_P0=0.6; // local days in the year; the axial tilt (rad, 15°); the year's phase at boot
function yearPhase(h){const p=(h/(DAY_H*YEAR_D)+YEAR_P0)%1;return p<0?p+1:p;}
function sunDec(h){return TILT*Math.sin(TAU*yearPhase(h));}
function seasonAt(h){return -Math.sin(TAU*yearPhase(h));} // +1 the windy peak (the sun south), −1 the still
// The star and the orbit (v11.17). PLANET decides a late G / early K at ~5300 K and nothing else, so these are placeholders with the
// derivation shown, to be replaced when the planet is put in its place. A 5300 K dwarf has R ~0.85 R☉ and L = R²(T/5772)⁴ ~0.51 L☉; a
// 26–28 °C sea wants about Earth's insolation, so a = √L ~0.71 AU, and the disc is R/a = 1.2× the Sun's apparent size: SUN_R 0.0056
// rad (0.32°; the Sun is 0.27°). The year at that orbit is ~0.65 Earth years, unused: no year is decided, so the stars are the same
// every night and turn with the sun (uStarT). The moon (PLANET: one, ~3× the Moon's tidal force; the lunar day 31.2 h against the
// 30 h day gives an orbit of 26 days, so it sits at about the Moon's distance): tidal force goes as M/a³ and apparent size as R/a,
// so at the Moon's density 3× the force is 3^(1/3) = 1.44× the Moon's diameter whatever the split between mass and distance —
// MOON_R 0.0065 rad (0.37°). Until v11.17 it was drawn at 0.75° (three times the Moon's) as a look; the light MOONL stays the look it
// was (the renderer has no exposure; a moonlit night is drawn as the eye sees it). Not modelled: both bodies run at declination 0,
// so every full moon is exactly antisolar (an eclipse at midnight) and every new moon exactly solar — the moon's orbit wants a few
// degrees of tilt when it is decided (MOON_INC would go into skyDir). The moon still lights the disc from the sun's true direction.
const STAR={T:5300,R:0.85,L:0.51,a:0.71}; // K, R☉, L☉, AU — placeholders (see above)
const SUN_R=STAR.R*0.00465/STAR.a,MOON_R=0.0065,UMBRA_R=0.0122; // apparent radii (rad): 0.00465 is the Sun's from 1 AU; the planet's shadow at the moon (Earth's at the Moon, 0.7°, at the same size and distance)
// Eclipses (v11.17.1; the person kept declination 0): every full moon passes through the planet's shadow at midnight — partial for ~2.3 h
// each side, total for ~0.7 h (the moon moves 0.46°/h against the sun) — and every new moon crosses the sun at noon, total for a few
// minutes since the moon is the bigger disc. discOverlap gives the fraction of a disc of radius a covered by one of radius b at
// separation d (the lens area).
function discOverlap(d,a,b){if(d>=a+b)return 0;if(d<=Math.abs(a-b))return b>=a?1:b*b/(a*a);const x=(d*d+a*a-b*b)/(2*d),y=Math.sqrt(Math.max(0,a*a-x*x));const A=a*a*Math.acos(clamp(x/a,-1,1))+b*b*Math.acos(clamp((d-x)/b,-1,1))-d*y;return clamp(A/(Math.PI*a*a),0,1);}
// The wanderers (v11.17): the system's other planets, seen as steady bright points on the sun's path — with no axial tilt the
// ecliptic is the equator, so they sit on the sun's own track at a fixed elongation east (+) or west (−) of it, for now (a real
// orbit moves them along it over weeks). Non-specific placeholders until the system is designed: an inner one that is the evening
// star, a big outer one, a faint outer one. [elongation (deg, + east), colour, brightness]
const PLANETS=[[38,[1.0,0.96,0.88],1.0],[141,[0.98,0.92,0.80],0.7],[-73,[0.85,0.90,1.0],0.35]];
function skyDir(ha,out,dec){const c=Math.cos(ha),sl=Math.sin(LAT),cl=Math.cos(LAT),cd=dec?Math.cos(dec):1,sd=dec?Math.sin(dec):0;return out.set(-cd*Math.sin(ha),sl*sd+cl*cd*c,sl*cd*c-cl*sd);} // hour angle 0 at upper transit; declination dec (v11.83; 0 to v11.82: rises east, transits south of the zenith by LAT, sets west): the standard alt-az from latitude, +z south
function sunHA(h){return TAU*((h+SOLAR_H0)%DAY_H-DAY_H/2)/DAY_H;}
function moonHA(h){return TAU*(h-MOON_T0)/LUNAR_H;}
// (v11.33: moonIllum is gone — the lit fraction comes from the sun's and moon's own directions since v11, atmosphere.js updateSky.)
// The weather: trade-wind weather over a warm sea — fair-weather cloud most of the time (cover 0.15–0.6 on a slow noise over
// a few game hours), and now and then a shower cell passing through on the wind (rain 0..1 for half an hour to an hour of
// game time — a minute or so real — under a dark, thicker sky). One function of the hour so it is the same on every visit.
// v11.17.1 adds `wind` — the trades blow about three days in four (Hawaii's figure); the rest are calms, light and variable, on their
// own slow noise: the chop dies to the swell, the spray stops, the clouds hang, and a clear calm night can mist the lagoon at dawn.
// v11.17 adds `cirrus`: the high ice cloud's cover on its own slower noise — not the trades' cloud but the outflow of convection far
// away (the planet has a rain belt somewhere), so it comes and goes on its own and moves with the upper wind.
// v11.87 (CLOUDS.md §2) gives the weather its clocks. The day: over a tropical sea cloud and showers peak in the last hours of the night and at dawn
// (the cloud tops cool by radiation all night and the deck destabilises; the sea's own surface hardly warms by day) and thin by mid afternoon — a
// fifteen-hour night deepens that, so `day` is +1 at local 5 h (two and a half hours before sunrise) and −1 at 20 h. The waves: in the trades the
// weather comes in easterly waves every three to five days — a day or two of thicker deck and squalls, then suppressed clear days (`wave`, −1..1 on
// a noise with ~4-day features). The year: with the sun south the rain belt is far and the trades strong and steady (streets, brief showers, a
// clear upper sky); with the sun north the belt comes near 11.5° N — calms, deeper congestus, and cirrus as the outflow of that convection, so the
// cirrus is the still season's (to v11.86 it was a coin toss, 69% of hours), the congestus deeper (`deep`), the haze whiter with the humidity
// (`hazeK`). `spread`: a full deck without rain at the night's end and in the morning spreads its tops flat under the inversion (stratocumulus from
// cumulus, the morning look in the trades) — the deck's threshold rises less with height.
function weatherAt(h,out){const o=out||{};const s=seasonAt(h),lh=(h+SOLAR_H0)%DAY_H,di=Math.cos(TAU*(lh-5.0)/DAY_H),wv=clamp((fbm(h*0.011+3.3,8.8,2)-0.5)*3.2,-1,1); // the season; the local hour (noon 15, sunrise ~7.5); the day's cycle; the easterly waves
  const w=fbm(h*0.13+22.1,17.3,3),q=fbm(h*0.85+5.1,5.1,2),c=fbm(h*0.055+41.7,9.9,2); // seeds chosen so boot is fair (cover ~0.4) with the first shower a few hours in
  const rt=0.71-0.02*s-0.035*wv-0.025*di;o.rain=smooth(rt,rt+0.07,q); // v11.83: more showers in the windy half; v11.87: on a disturbed day and toward dawn; v11.88: the trigger only — an episode births a shower cell with a place (clouds.js updateCells), whose rain at the camera is the rain
  o.cover=clamp(0.15+1.4*(w-0.32)+0.10*wv+0.06*di,0.08,0.92);o.cirrus=clamp(2.4*(c-0.36)-0.22-0.35*s+0.15*wv,0,1);
  o.wind=Math.max(smooth(0.33-0.06*s,0.46-0.06*s,fbm(h*0.09+77.3,2.2,2)+0.05*wv),o.rain); // rain ~8% of the time; wind 1 the trades, 0 a calm (~25% of the time at the year's mean — v11.83: ~15% at the windy peak, ~40% at the still one, hours at a stretch; a shower is a gust front)
  o.deep=1+0.5*Math.max(0,-s)+0.3*Math.max(0,wv);o.spread=smooth(0.5,0.75,o.cover-0.5*o.rain)*(1-o.rain)*smooth(-0.3,0.6,di);o.hazeK=1+0.5*Math.max(0,-s);
  o.season=s;o.wave=wv;o.day=di;return o;}
// The wind (PLANET, Wind and current): one prevailing wind toward WIND_A at WIND_U m/s — the waves travel with it and so do the
// clouds and the rain; the wind blows harder under a shower. Real time, not game time: a cloud crossing the sky at 45× would be
// a film run fast, and the waves are already real-time.
// The upper wind (v11.17): above the trade inversion the wind backs and strengthens — Earth's anti-trades — so the cirrus streams the
// other way and faster; the two decks crossing is the look of a trade-wind sky.
const WIND_U=7.0,UPPER_A=WIND_A+2.6,UPPER_U=18.0; // WIND_U is the trades'; a calm (weatherAt().wind) brings it to 0.15 of that
// ---------- the clouds and the fog above the water (v11.17) ----------
// What the climate gives (from PLANET, not a look): a small island in a steady trade wind over a 26–28 °C sea, no seasons, no
// continent, no cold current. That is the trade-wind sky — subsiding air with an inversion at ~2 km and under it a deck of small
// cumulus with flat bases at the lifting condensation level, CLOUD_H (~650 m over a warm sea: Hawaii's are 600–900), and tops
// CLOUD_T higher, capped by the inversion; a shower is one of them grown to congestus, its base lower and ragged scud (fractus)
// under it. Cirrus far above (CIRRUS_H), from elsewhere. The island (six hectares, +6 m) is too small to make its own cloud. And
// no sea fog: fog on the sea needs warm air over cold water (Peru, the Canaries, the Grand Banks — a cold current or a cold
// upwelling), or cold air over warm water (sea smoke: arctic outbreaks), or land cooling all night (radiation fog, which a
// six-hectare rim cannot make); warm trade air over a warmer sea, its dew point below the sea's temperature, never saturates —
// Hawaii, Réunion and the Marquesas have none at sea level. What there is instead is haze: sea salt lifted by a Beaufort-4 wind,
// visibility 15–30 km (AIR.dens), whiter and thicker in the lowest degree or two of the sky (the boundary layer seen edge-on:
// HAZE.dens over HAZE.h, a layer on the water every ray integrates), spray over the breakers on the windward shore (HAZE.spray, by
// the wave-exposure field at the camera), and under a shower rain and mist to a few km. The two things that could change this are
// not decided and are the person's: a fuming vent above water (vog — a sulfate haze downwind — and steam where hot water meets
// air) and a calm — the trades slackening — under which a clear night could put a dawn mist on the lagoon.
const CLOUD_H=650,CLOUD_T=900,CIRRUS_H=9500,CLD_SHADE=0.85; // the cumulus base and the deck's thickness (the inversion caps it), the cirrus height (m); how much of the beam a cloud takes (v11.87: the shadow at the player and in the shaders, clouds.js)
// v11.87: the deck itself is clouds.js — one field in the wind's frame (streets while the trades blow, the tops leaning downwind, a cap over the giant, whose
// summit at 900 m stands into a deck based at 650: the trades forced up its flank wear a cloud on it all day that swells through the afternoon), read by
// the dome, the sea, the land and the beam at the player alike. Our own island is still too small to make cloud.
let SEA_CHOP=1; // the short waves' amplitude now, 0.25 in a calm to 1 in the trades (atmosphere.js updateHaze; read by waveH and the wave GLSL's uChop): the swell (L ≥ 20) is from weather far away and keeps running
// The fumarole and the vog (v11.17.1, the person's call of 10 Sep) are struck (v11.86, the person, 23 Sep 2026: the summit read as a "cute little
// volcano", a tutorial zone): the island is a tuff cone now (CONE, below) — a monogenetic vent that erupted once into shallow water and went cold,
// so it neither steams nor degasses. The steam plume (FUME) and the sulfate haze downwind (VOG) went with it; the dawn mist stays.
// A dawn mist on the lagoon (v11.17.1, the person's call): on a clear calm night the rim's flat and the shallow lagoon radiate and cool
// below the sea's mixed layer, and the lagoon's water, warmer than the air over it by dawn, steams — the same evaporation mist a
// tropical mangrove creek makes at first light. It needs all three (clear: cover low; calm: wind low; the sheltered water: the lagoon
// field at the camera), lies a few metres deep (MIST_DAWN.h) and burns off within the hour after sunrise.
const MIST_DAWN={dens:0.020,h:6,from:-3.0,peak:0.0,to:1.2}; // extinction at the water at full mist; its depth; the hours before sunrise it builds from, the peak, when it is gone
const HAZE={dens:1.7e-4,h:70,spray:0.0025,sprayH:4.0,glow:0.8,lift:0.3}; // the marine haze's extinction at the water and its scale height (m); the spray's over the surf and its height; the forward glow toward the light; how far the haze's colour is lifted from the horizon's toward the light
// ---------- the sea surface ----------
// The surface is a sum of directional waves obeying deep-water dispersion (long waves travel faster) with crests sharpened by
// wsh(), on top of the tide. waveH(x,z) is the water level at a point now: the player and creature physics, the surface mesh
// (the wave sum in GLSL, see WAVE_GLSL in scene.js, plus uTide) and the rafts' bob all read it. [wavelength, amplitude, direction].
// The direction is where the wave *travels toward* (the phase is dot(p,dir)·k − ω·t): the swell runs with the wind (WIND_A) and the wind sea fans
// ±0.6 rad round it (v11.42, WATER.md item 1: to v11.41 the swell ran toward 0.35 — dead against the wind and the caustic's ripple trains — and the rest to every quarter).
// The long swell (v11.45, WATER.md G, the person's answer 14 Sep: "maximum compatibility and most believable"): 150 m, 0.30 m, period 9.8 s, from a far
// storm upwind in the trade belt (within 0.08 rad of WIND_A), so it strikes the flank the exposure field already gives surf, cones and spray to — a
// swell from another belt would put the surf on a shore the geology says is a lee. Last in the table so the caustic's carry (CAU_SWELL), the
// spray and the audio, which index the first entries, keep the 46 m as "the swell"; every sum reads the whole table. Drawn to ~1.4 km by the grid.
// v11.46: the 46 m swell is two trains at ±0.15 rad of 0.28 (the person on v11.45: the rows "could be a little less row-like"): a swell has a directional
// spread, so its crests are ~150 m long and the sea is a lattice of lozenges rather than rulings to the horizon; 0.56 where they meet, 0.4 rms — the same sea.
// The first CAU_SWELL entries carry the caustic's ripples (both 46 m trains, the 29 and the 15 now; the 8.5 dropped out of the carry, a centimetre of it).
const WAVES=[[46,0.28,WIND_A-0.15],[46,0.28,WIND_A+0.15],[29,0.32,WIND_A-0.19],[15,0.18,WIND_A+0.36],[8.5,0.11,WIND_A-0.49],[6,0.06,WIND_A+0.56],[150,0.30,WIND_A+0.08]].map(w=>{const k=TAU/w[0];return {L:w[0],A:w[1],dx:Math.cos(w[2]),dz:Math.sin(w[2]),k:k,w:Math.sqrt(9.8*k),ph:w[2]*7.3};});
const WAVE_AMP=WAVES.reduce((a,w)=>a+w.A,0);
const GRAV=9.8; // 1 g, 1 unit = 1 m (PLANET.md); what pulls a body back down once it is out of the water. Was 14 to v9.3.
function wsh(s){return 2*Math.pow((s+1)*0.5,1.7)-1;}
// Shoaling, breaking and shelter (v11.44, WATER.md D). Each wave's amplitude at a point is its deep-water amplitude × Green's law as the floor
// comes up (the energy flux held as the group slows: (L/2d)^¼ once the water is shallower than half the wavelength, capped at WAVE_SHOAL_MAX),
// × the place's wave energy (WF: the wind sea by it whole, the swell by half — the swell wraps the island, the chop does not; 1 on the struck
// flank, 0.35 in the lee, a quarter of that inside the lagoon; far.js wmFill from the expo and shel fields), and no more than WAVE_BRK × the
// water depth — the breaking limit H/d 0.78, past which the crest is white water (the surface's foam). The wavelength does not shorten: that is
// a phase integral along the wave's path, not a local factor, and a local k(d) would scramble the phase. The depth is the blurred floor map
// (far.js wmFloor, ~70 m) plus the tide, so the surf zone is a band along the shore where the map says the water is shallower than a wave or
// two; at the strand itself the amplitude goes to nothing and the water stands at the tide — no more puddles winking on the sand. Every wave
// sum reads waveFac: this, the GLSL (scene.js WAVE_GLSL, the surface, the kelp's fold, the rafts, the fog's level) and the caustic's carry.
const WAVE_BRK=0.39,WAVE_SHOAL_MAX=1.6; // the breaking limit as amplitude over depth (H/d 0.78); the most Green's law may raise a wave
// The place's wave energy (v11.46; far.js wmFill writes it into the floor map's green). v11.44 read it off the *expo* field, which is a shore field — zero
// wherever the water is deeper than 30 m — so the open sea had 35% of its chop and two thirds of its swell everywhere (measured 14 Sep: 0.35 at every
// azimuth at r 1000). The sea is full on the open water; what takes from it is the island's wind shadow — the lee: downwind of the shield (LEE_DW past the
// centre along the wind), within its width across the wind (LEE_CW), fading over LEE_L — and the lagoon's shelter (shel). The struck shore keeps expo's 1.
const LEE=[0.65,400,600,1000,1500]; // the chop lost in the lee at most; the downwind distance the shadow starts; the across-wind half-width whole and gone; the fade length beyond
function waveEnergy(x,z,s){const wx=Math.cos(WIND_A),wz=Math.sin(WIND_A),dw=x*wx+z*wz,cw=Math.abs(x*wz-z*wx);
  const lee=smooth(0,LEE[1],dw)*(1-smooth(LEE[2],LEE[3],cw))*Math.exp(-Math.max(dw-2*LEE[1],0)/LEE[4]);
  return Math.max(1-LEE[0]*lee,lerp(0.35,1,s.f[FI.expo]))*(1-0.75*s.f[FI.shel]);}
const _wfac=new Float32Array(WAVES.length*2);
function waveFac(x,z,out){const d=Math.max(wmFloor(x,z)+TIDE,0.05),wf=wmWave(x,z),cap=WAVE_BRK*d;for(let i=0;i<WAVES.length;i++){const w=WAVES[i];const a=w.A*(w.L<20?SEA_CHOP*wf:0.5+0.5*wf)*Math.min(Math.max(Math.pow(w.L*0.5/d,0.25),1),WAVE_SHOAL_MAX);out[i]=Math.min(a,cap);out[WAVES.length+i]=Math.max(0,(a-cap)/cap);}return out;} // out: the amplitude now per wave, then the breaking excess per wave
function waveH(x,z){const f=waveFac(x,z,_wfac);let h=TIDE;for(let i=0;i<WAVES.length;i++){const w=WAVES[i];h+=f[i]*wsh(Math.sin((x*w.dx+z*w.dz)*w.k-w.w*t+w.ph));}return h;}
// ---------- land ----------
// Three things break the surface: the caldera rim (broken by passes), the flank cone on rift arm 1 (the island, with a tidal
// flat), and a few blocks of the collapse near its scarp. Ground above 0.5 is the strand at mean sea level; with the tide the
// water's edge walks ±3–4.5 m up and down it twice a day (the rim is awash at high springs, the passes 9.5 to 18.5 deep).
// 1 inside a sector of half-width hw around centre c (angles wrap), fading to 0 over the last `fade` radians
function sectorW(a,c,hw,fade){let d=(a-c)%TAU;if(d<0)d+=TAU;if(d>Math.PI)d-=TAU;return smooth(hw,hw-fade,Math.abs(d));}
// ---------- the islands as records (v11.61) ----------
// The archipelago (the person, 15 Sep 2026: one chain south-west along the rift axis, ages rising north-east toward the sill). An island is a
// record: where it stands, how it is turned, its radial scale, and every number its geology had as a constant to v11.60 — the shield's
// profile as steps, the terraces, the rim and the lagoon, the collapse, the dikes, the rift arms, the fissure, the pit, the flank cone, the
// lower flank. islandH() is the old sample() body in the island's own frame; sample() takes the smooth max of every island in reach over the
// basement (the basin and the sill), and the conditions from the island that stands highest there. ISLANDS[0] is our island, its record
// the old constants exactly, so its ground and fields are the same doubles as v11.60's (test/ident-style check, CHANGELOG v11.61). A
// second island gets its own record, its own noise offset (ns) and, for land above the water, terms this kit does not have yet.
// v11.62 (ARCHIPELAGO step 2): the kit's last radii that were ours by constant are the record's now — riftR (the rift arms' radial extent), the
// shelf edge (read off the terraces' band), the upwelling's fade (fade, in rw) — and a record without a rim has no lagoon; `land` is the term the
// kit lacked, the subaerial shield (islandH, below). Ours carries its old numbers by name, so its doubles are v11.61's.
const ISLANDS=[
  {id:'home',x:0,z:0,rot:0,sc:1,ns:0,h0:-14,prof:[[RIM_R+RIM_W*0.3,330,6],[330,700,40],[1000,1200,94],[1200,1600,40]],terr:{r0:700,r1:1000,n:8,step:12},
   rimR:RIM_R,rimW:RIM_W,lagH:-22,coll:COLL,dike:DIKE,rifts:RIFT_A,riftR:[280,340,1600,1300],vent:VENT,pit:PIT,isle:ISLE,flank:{r:FLANK_R,w:FLANK_W,s0:FLANK_S0,s1:FLANK_S1,a:FLANK_A,b:FLANK_B},fade:BASIN.fade,reach:8500},
  // The giant (v11.62; ARCHIPELAGO's table, the person's plan of 15 Sep 2026): 18 km south-west along the chain at 2.6 rad, the member one step
  // behind the hotspot — its shield just finished, so it is the biggest and now only loses. 14 km of land (r 7000, the coast wavy ±16% of that
  // by the kit) rising to 900 m with a summit caldera 1.4 km across and 110 m deep; rain gullies down the windward flank (the wind is the
  // world's: the flank facing 0.35 rad, the east-south-east, the side toward our world); its last flows down the two rift zones, which lie
  // on the chain's axis (2.6 toward the young shield, 5.74 toward us); a wave-cut cliff of 40 m where the surf strikes, a plain to the sand in
  // the lee; a shelf of 1 km to -60 (a mature island's: wave-cut, reef-built) with the eight 12 m terraces at its edge (eustatic, so the same
  // steps as ours); the slope to -290 by 9.8 km and the flank at 12° (the table) to the floor at ~13.8 km, which reaches ours: a saddle. The
  // current is the world's too, so its fed flank (5.44 rad) is the one toward us, and its upwelling fades from the apron's toe out. No collapse,
  // dikes, vent, pit or cone: nothing decided them yet (the person's open questions, ARCHIPELAGO). In metres (sc 1: the noise keeps our grain);
  // its own noise offset. Its centre is 2.5 km past the world's edge until step 4 (NCELL 240): what stands inside the world is its eastern
  // flank from ~600 m down to the shore, the shelf and the saddle.
  {id:'giant',x:-15400,z:9200,rot:0,sc:1,ns:500,h0:0,prof:[[7000,7300,8],[7300,8000,52],[8800,9300,94],[9300,9800,40]],terr:{r0:8000,r1:8800,n:8,step:12},
   rifts:[2.6,5.74],riftR:[600,900,9800,8800],flank:{r:9800,w:250,s0:0.21,s1:0.21,a:600,b:2600},fade:[9800,12800],reach:16000,
   land:{r:7000,h:900,cliff:40,cald:{r:700,d:110,w:40},gully:{n:36,lee:0.2},flows:{n:60,h:8,hw:0.5}}}
]; // reach: past this radius (unwarped) the island is not computed — its flank is under -1500 there (the giant's -1390 at worst, with its ribs), 300 m or more under the floor's highest hill, and smax is exact past its knee
const _islA={},_islB={}; // the islands' intermediates for the fields: the winner's and a spare, reused (nothing allocates per sample)
// the island's ground in its own frame (lx,lz local, scaled) and the intermediates the conditions read, into `o`
function islandH(R,x,z,o){
  let lx=x-R.x,lz=z-R.z;if(R.rot){const c=Math.cos(R.rot),s=Math.sin(R.rot),tx=lx*c+lz*s;lz=lz*c-lx*s;lx=tx;}if(R.sc!==1){lx/=R.sc;lz/=R.sc;}
  const ns=R.ns,r=Math.hypot(lx,lz),a=Math.atan2(lz,lx);
  const aw=a+0.32*angNoise(a,1.6,11+ns)+0.22*(fbm(lx*0.0035+80+ns,lz*0.0035+20,3)-0.5)*2; // warped angle: wavy sectors
  const rw=r*(1+0.16*angNoise(aw,1.2,29+ns)); // warped radius: wavy contours
  let awn=aw%TAU;if(awn<0)awn+=TAU;
  const ag=R.rot?a+R.rot:a,ca=Math.cos(ag),sa=Math.sin(ag); // the wind and the current are the world's, so they read the unrotated angle (v11.62; rot 0 on both records, the same doubles)
  let expoW=0.5-0.5*(ca*Math.cos(WIND_A)+sa*Math.sin(WIND_A)); // 1 on the shore the waves strike (let since v11.86: the cone has its own aspect)
  const upW=0.5-0.5*(ca*Math.cos(CUR_A)+sa*Math.sin(CUR_A)); // 1 on the flank the current strikes (upwelling); 0 in its wake
  const C=R.coll,collW=C?sectorW(awn,C.a,C.hw*(1+0.55*smooth(380,1000,rw)),0.14):0,cw=C?collW*smooth(300,350,rw)*smooth(1250,1000,rw):0;
  const D=R.dike,dikeW=D?sectorW(awn,D.a,D.hw,0.2):0,dk=D?dikeW*smooth(700,790,rw)*smooth(1220,1080,rw):0;
  // the shield's bare profile: the steps of R.prof (ours: the rim's outer slope to -20 at 330, the shelf to -60 at 700, the slope to -156 at
  // 1000 and -250 at 1200, the apron to -290 at 1600)
  const T=R.terr,tS=smooth(T.r0,T.r1,rw);
  let hb=R.h0;for(const s of R.prof)hb-=s[2]*smooth(s[0],s[1],rw);
  const hills=8*(fbm(lx*0.006+3+ns,lz*0.006+7,4)-0.5)*2+2.5*(fbm(lx*0.03+9+ns,lz*0.03+1,3)-0.5)*2;
  hb+=hills*(0.5+0.5*smooth(0,270,rw));
  const tAll=T.n*T.step;let hSmooth=hb-tAll*tS;
  // the terraces: the slope between -60 and -156 cut into eight 12 m steps at the stillstands, rings round the whole island,
  // buried where the collapse debris lies over them (cw)
  const tv=tS*T.n,tf=Math.floor(tv),tfr=tv-tf,tStep=(tf+smooth(0.36,0.64,tfr))*T.step;
  let h=hb-lerp(tStep,tAll*tS,cw);
  // the dikes: on the oldest flank between the terraces, radial ridges every 2π/22, sharp, 8-34 m, each varying along its length
  let dkr=0;
  if(dk>0){const q=((awn*22/TAU)%1+1)%1,rg=1-Math.abs(2*q-1);dkr=Math.pow(rg,2.6)*dk*(0.55+0.45*fbm(lx*0.005+61+ns,lz*0.005+17,2));h+=34*dkr;}
  // the collapse: a headwall (75 m across 90 m of radius, from just outside the rim), then the debris fan — hummocky, biggest near the
  // scarp, thickening the slope by 20 m where it piles and thinning to nothing by the apron; a few blocks stand out near the scarp
  // The hummocks are rounded mounds (v11.19.1): a smoothstep of the noise, so every crest and every foot has a continuous slope. To v11.19
  // they were rg² of a tent (1-|2f-1|) — a crease along every crest and a kink at every foot — and everything settled on them clipped
  // (the person: "strange jagged terrain", 10 Sep). The same noise, so the mounds stand where the old ones stood.
  if(cw>0){const fn=fbm(lx*0.016+13+ns,lz*0.016+41,3),mnd=smooth(0.5,0.68,fn),near=smooth(1100,430,rw);
    const scarp=-75*smooth(340,430,rw),bump=20*smooth(430,640,rw)*smooth(1150,900,rw),hum=(6+24*near)*mnd+(4+10*near)*(fbm(lx*0.007+77+ns,lz*0.007+5,3)-0.5)*2;
    h+=cw*(scarp+bump+hum);
    h+=cw*44*smooth(0.68,0.78,fn)*smooth(450,400,rw)*smooth(360,400,rw)*smooth(0.55,0.75,0.5+0.5*angNoise(aw,2.5,88+ns));} // blocks that break the surface: the highest mounds nearest the scarp
  // the rift arms: low broad ridges of younger flows from the summit out; the fissure at the deep end of arm 0 with mounds along it
  let young=cw*smooth(340,400,rw),heat=0;
  // ---- land (v11.62, ARCHIPELAGO step 2): the subaerial shield inside R.land.r, the term the kit lacked ----
  // The shield's surface (PLANET, The shield: subaerial flows lie at 4-8°) rises from the shore to the summit at L.h as a mix of a cone and an
  // S-curve, so the coastal plain and the summit are the gentle parts (4° at both ends, 9° mid-flank; 7.3° mean at 900 over 7000). Where the
  // surf strikes (expoW) the coast is cut back to a cliff of L.cliff over the first 55 m inland (Molokai's, Kohala's, in small); in the lee a
  // plain runs down to the sand. The rain is the trades' and falls on the windward flank, so the gullies are there: L.gully.n valleys round the
  // island on their own angle (unevenly spaced, slowly bent), each cut from the interfluve surface toward a graded floor — L.h·tl^1.8, base level
  // at the coast (a bay through the cliff), meeting the surface below the summit (amphitheatre heads) — with a rounded floor and the shield's
  // old surface left flat between (the planezes of a dissected shield); how far each gets is the rain (1 windward, L.gully.lee in the lee) times
  // its own draw, so a few are master valleys to the floor and most are gulches. The last flows ran down the rift zones (R.rifts: the chain's
  // axis) and lie on the surface as ridges L.flows.h high — half the slots of a comb of L.flows.n round the island, within L.flows.hw of a rift,
  // from the caldera's rim over the shore onto the shelf — and are fresh rock (young). A summit caldera (L.cald, the shield's normal end: Mauna
  // Loa's, Kilauea's): a flat floor L.cald.d under the rim, its wall L.cald.w wide, the valley heads that reach the rim notched into it. The
  // gullies go on h alone; hSmooth carries the surface less a third of the cut, so a valley floor reads as relief 0 and a planeze as a crest.
  if(R.land){const L=R.land,u=rw/L.r;
    if(u<1){const tl=1-u,S=tl*tl*(3-2*tl),ridge=L.h*(0.55*tl+0.45*S),cl=L.cliff*smooth(0.45,0.85,expoW)*smooth(0,0.008,tl);
      let fh=0;const FL=L.flows;
      if(FL&&R.rifts){let fw=0;for(const ra of R.rifts){const w=sectorW(awn,ra,FL.hw,FL.hw*0.6);if(w>fw)fw=w;}
        if(fw>0){const fq=aw*FL.n/TAU,fi=Math.floor(fq),ft=1-Math.abs(2*(fq-fi)-1);if(hash(fi&255,77+ns)>0.45){const flow=fw*smooth(0.55,1,ft)*(0.7+0.3*fbm(lx*0.004+23+ns,lz*0.004+61,2));fh=FL.h*flow;young=Math.max(young,0.6*flow);}}}
      const G=L.gully,av=a+0.12*angNoise(a,2.2,150+ns)+0.10*(fbm(lx*0.0012+31+ns,lz*0.0012+57,2)-0.5)*2,vq=av*G.n/TAU,vi=Math.floor(vq),tent=1-Math.abs(2*(vq-vi)-1);
      const vw=smooth(0.3,1,tent),wet=lerp(G.lee,1,smooth(0.25,0.85,expoW)),draw=Math.min(1,wet*(0.45+0.9*hash(vi&255,150+ns))),top=ridge+cl+fh,deep=Math.max(0,top-L.h*Math.pow(tl,1.8))*draw;
      let lnd=top-vw*deep,lndS=top-0.35*deep;
      const K=L.cald;if(K){const ck=smooth(K.r+K.w,K.r-K.w,rw);if(ck>0){const tr=1-K.r/L.r,fl=L.h*(0.55*tr+0.45*tr*tr*(3-2*tr))-K.d;lnd=lerp(lnd,fl,ck);lndS=lerp(lndS,fl,ck);young=Math.max(young,0.5*ck);}}
      h+=lnd;hSmooth+=lndS;}}
  if(R.rifts){const RR=R.riftR;for(let k=0;k<R.rifts.length;k++){const rwk=sectorW(awn,R.rifts[k],0.13,0.09)*smooth(RR[0],RR[1],rw)*smooth(RR[2],RR[3],rw);h+=8*rwk;young=Math.max(young,0.7*rwk);}} // the arms' radial extent is the record's (v11.62)
  if(R.vent){const V=R.vent,vw=sectorW(awn,V.a,0.1,0.07)*smooth(V.r0-70,V.r0,rw)*smooth(V.r1+70,V.r1,rw);if(vw>0){heat=vw;h+=22*vw*Math.pow(fbm(lx*0.03+50+ns,lz*0.03+50,3),3)*1.6;young=Math.max(young,vw);}}
  // the lower flank beyond the apron (v11.28; PLANET, The shield), and the pit crater. To v11.27 the floor fell 520 m in 90-250 m here —
  // a cliff into "the void" at -810, the world's rocky wrapping (the person, 10 Sep: "an artificial border to wrap the world up in rocky
  // bubble wrap"). A seamount whose summit reaches the surface stands 3-4 km off the plate on flanks of 10-20°; the apron of its own
  // debris is a local thickening on that flank, not its foot. So past the apron's toe (FLANK_R, wavy: gullies and slide scars) the
  // slope ramps with no crease from the apron's 5.7° to FLANK_S0 (16.7°) over FLANK_W, eases to FLANK_S1 (12.4°) between FLANK_A and
  // FLANK_B (the lower flank), and goes on down: -320 at the old square's edge on an axis, ~-580 at a corner, and (v11.58) into the
  // basin's floor at -1100 some 5.7 km out. To v11.57 it went on forever toward a plate 15 km out. Ribbed ±15% by sector.
  const F=R.flank,rf=rw-(F.r+60*angNoise(aw,2.5,99+ns));
  if(rf>0){const t=Math.min(rf/F.w,1),d0=rf<F.w?F.w*(t*t*t-0.5*t*t*t*t):rf-0.5*F.w; // ∫smoothstep(0,W): the ramp's drop
    const u=clamp((rf-F.a)/(F.b-F.a),0,1),d1=rf<F.a?0:rf<F.b?(F.b-F.a)*(u*u*u-0.5*u*u*u*u):rf-0.5*(F.a+F.b); // ∫smoothstep(A,B): the easing's
    h-=(F.s0*d0-(F.s0-F.s1)*d1)*(1+0.15*angNoise(aw,3.0,131+ns));}
  if(R.pit){const pd=Math.hypot(lx-R.pit[0],lz-R.pit[1]);if(pd<130)h-=520*smooth(100,40,pd);}
  // the caldera: a flat sandy floor at -22 inside a rim of land broken by passes (the passes run at -14: the lagoon's flushing)
  let lag=0,rimA=0,rimK=0;
  if(R.rimR!==undefined){lag=smooth(R.rimR-R.rimW*0.4,R.rimR-R.rimW*1.6,rw); // a record without a rim has no lagoon and no passes (v11.62: the giant)
    if(lag>0)h=lerp(h,R.lagH+1.5*(fbm(lx*0.02+5+ns,lz*0.02+3,2)-0.5)*2,lag);
    rimA=smooth(0.3,0.62,0.5+0.5*angNoise(aw,2.4,77+ns));rimK=smooth(R.rimR-R.rimW,R.rimR-R.rimW*0.3,rw)*smooth(R.rimR+R.rimW,R.rimR+R.rimW*0.3,rw);
    if(rimK>0){h=lerp(h,2.5+3.5*(fbm(lx*0.02+5+ns,lz*0.02+3,2)-0.5)*2,rimK*rimA);h-=3*(1-rimA)*rimK;}}
  // the island: a tuff cone (v11.86, CONE above; to v11.85 a round 40 m hill on a round flat of bars and pools) — a breached ring round a tidal
  // crater, high downwind, cliffed to windward, the flat and its spit in the lee and down the current. Within 270 m of the cone only
  let coneRock=0;
  if(R.isle){const I=R.isle,idx=lx-I.x,idz=lz-I.z,id=Math.hypot(idx,idz);
    if(id<270){const C=CONE,dw=id*(1+0.3*(fbm(lx*0.008+7+ns,lz*0.008+3,3)-0.5)*2);
      const ac=Math.atan2(idz,idx)+(R.rot||0),cd=Math.cos(ac-WIND_A),cc=Math.cos(ac-CUR_A),up=smooth(-0.1,0.6,-cd); // the cone's own aspect: cd 1 downwind (the lee), −1 on the face the waves strike; cc 1 down-current; up 1 on the windward face
      let dA=(ac-WIND_A-Math.PI)%TAU;if(dA<0)dA+=TAU;if(dA>Math.PI)dA=TAU-dA; // the angle off the upwind axis
      const hr=lerp(C.h*(1+C.lean*cd)*(1+0.25*(fbm(lx*0.02+9+ns,lz*0.02+8,2)-0.5)*2),C.gapH,smooth(C.gapA,C.gapA*0.45,dA)); // the rim: highest downwind, breached upwind
      const w=dw<C.r?C.wIn:C.wOut,g=Math.exp(-(dw-C.r)*(dw-C.r)/(w*w)),ridge=hr*g*(1-up*smooth(C.r+6,C.r+22,dw)); // the ring, its outer slope cut to a cliff on the windward face
      const n2=(fbm(lx*0.03+11+ns,lz*0.03+2,2)-0.5)*2,flat=lerp(C.flat+2.6*n2,C.plat+1.2*n2,up); // the lee's bars and pools; the windward wave-cut platform
      const fEnd=C.flatR+C.spit*Math.max(0,cc)+C.leeR*Math.max(0,cd),k=smooth(fEnd+80,fEnd,dw),inK=smooth(C.r-C.wIn*0.5,C.r-C.wIn*1.8,dw); // the flat's reach by side; inside the crater
      h=lerp(lerp(h,flat,k),C.floor+0.5*n2,inK)+ridge;
      coneRock=smooth(2,8,ridge); // the ring stands as tuff rock (sub); its foot and the crater are ash and sand
      expoW=lerp(expoW,0.5-0.5*cd,smooth(240,150,dw));}} // the exposure round the cone is the cone's own: the waves strike its windward face, its lee is sheltered
  o.coneRock=coneRock;o.h=h;o.hs=hSmooth;o.rw=rw;o.cw=cw;o.dkr=dkr;o.young=young;o.heat=heat;o.lag=lag;o.rimK=rimK;o.rimA=rimA;o.pass=(1-rimA)*rimK;o.shelfEdge=smooth(T.r0-50,T.r0+30,rw)*smooth(T.r1+150,T.r1-50,rw);o.upW=upW;o.expoW=expoW;
  return h;
}
// sample(x,z) → {h, f}: the ground and the conditions. `out` may be passed to reuse the field array.
// Substrate f[sub] here leaves out steepness (the cell adds it from its grid; far.js from two extra samples: fixF).
function sample(x,z,out){
  // the islands: the highest in reach wins the conditions; the rest raise the ground under it through smax (a volcano on another's flank)
  let o=_islA,spare=_islB,best=null,h=-1e9,hSmooth=-1e9,rNear=1e9;
  for(const R of ISLANDS){const d=Math.hypot(x-R.x,z-R.z);if(d<rNear)rNear=d;if(d>R.reach*R.sc)continue;
    if(best){islandH(R,x,z,spare);if(spare.h>o.h){h=smax(spare.h,h,BASIN.knee);hSmooth=smax(spare.hs,hSmooth,BASIN.knee);const t=o;o=spare;spare=t;best=R;}else{h=smax(h,spare.h,BASIN.knee);hSmooth=smax(hSmooth,spare.hs,BASIN.knee);}}
    else{h=islandH(R,x,z,o);hSmooth=o.hs;best=R;}}
  if(!best){o.rw=rNear;o.cw=0;o.dkr=0;o.young=0;o.heat=0;o.lag=0;o.rimK=0;o.rimA=0;o.pass=0;o.shelfEdge=0;o.upW=0;o.expoW=0;o.coneRock=0;} // open water: the basin's conditions alone
  const rw=o.rw,cw=o.cw,dkr=o.dkr,heat=o.heat,lag=o.lag,rimK=o.rimK,pass=o.pass,shelfEdge=o.shelfEdge,upW=o.upW,expoW=o.expoW,coneRock=o.coneRock;let young=o.young;
  // the basin and the sill (v11.58; BASIN, SILL above). Skipped within 2400 of an island's centre: the warped radius is under 2900 there, the
  // flank above -600, the floor under -1040, and smax is exact past its knee — the island is untouched to the bit
  let isl=1,gapF=0,summitK=0;
  if(rNear>2400){const bx=x*SILL_C+z*SILL_S,bt=z*SILL_C-x*SILL_S; // across the ridge (+ toward the crest) and along it
    let base=BASIN.h+BASIN.hill*(fbm(x*0.0007+23,z*0.0007+71,3)-0.5)*2,baseS=BASIN.h;
    if(bx-SILL.d>-7000){const s=bx-SILL.d-SILL.wobble*(fbm(bt*0.00035+9,3.7,3)-0.5)*2,knob=fbm(bt*0.0007+41,7.1,3),gapK=smooth(1100,350,Math.abs(bt)); // the ridge's window is one-sided since v11.65: 7 km on the basin's side, open beyond the crest (the world reaches 23 km past it)
      const kn=Math.pow(smooth(0.4,0.75,knob),1.2)*(1-gapK),hc=lerp(SILL.crest+SILL.summit*kn-(SILL.crest-SILL.gap)*smooth(0.45,0.3,knob),SILL.gap,gapK); // the crest along the ridge: summits where the knob noise is high, saddles at the sill where it is low, the gap on the axis
      const prof=SILL.slope*(Math.sqrt(s*s+SILL.w*SILL.w)-SILL.w),ridge=hc-prof*(1+0.15*(fbm(bt*0.0012+5,s*0.0012+8,2)-0.5)*2),ridgeS=SILL.crest-prof,out=s>0?Math.min(0.3*s,BASIN.h-SILL.plate):0; // out floors at the plate (v11.65); the ridge's flank then runs down at SILL.slope to meet it ~16 km past the crest // the flanks either side of a rounded crest; past the crest the floor falls away under the outer flank
      base=smax(base-out,ridge,BASIN.knee);baseS=smax(baseS-out,ridgeS,BASIN.knee);
      summitK=kn*smooth(-650,-450,ridge)*smooth(BASIN.knee,0,base-ridge);gapF=smooth(1300+0.3*Math.abs(s),250,Math.abs(bt))*smooth(3500,0,Math.abs(s));} // bare rock on the summits' upper 200 m; the inflow's jet through the gap, spreading either side
    const fd=best?best.fade:BASIN.fade;isl=smooth(fd[1],fd[0],rw);h=smax(h,base,BASIN.knee);hSmooth=smax(hSmooth,baseS,BASIN.knee);} // the upwelling's fade is the island's (v11.62): ours BASIN.fade by name
  // ---- the conditions ----
  const f=out||new Float32Array(NF),light=smooth(-150,-10,h);
  const flow=clamp(Math.max((lerp(0.4,0.2+0.6*upW,isl)*(0.55+0.45*shelfEdge)+0.8*pass)*(1-0.85*lag),0.95*gapF),0,1); // v11.58: the wake fades to the basin's steady 0.4 past the island; the gap's jet is the strongest steady current there is
  const expo=clamp((0.25+0.75*expoW)*smooth(-30,-6,h)*(1-0.9*lag),0,1);
  const nut=clamp((0.12+(0.10+0.45*upW)*isl+0.3*shelfEdge+0.5*heat)*(1-0.65*lag)+0.35*gapF,0,1); // v11.58: the seamount effect is the island's; the basin's water is sparse (0.12) but for what the gap brings in
  // sediment cover: mud with depth; sand where the waves don't strip it (the lee), in patches, and on the lagoon floor; nothing
  // stays on the fan's fresh blocks or the dikes' crests
  const shelfS=smooth(-75,-12,h);
  let cover=0.1+0.75*smooth(-90,-260,h)+shelfS*(0.65*Math.pow(1-expoW,1.3)+0.25*(fbm(x*0.008+41,z*0.008+23,3)-0.5)*2)+0.45*lag-0.5*cw-0.6*dkr;
  let sub=clamp(1-cover,0,1);sub=lerp(sub,0.66,cw*(1-0.5*smooth(500,1000,rw)));sub=lerp(sub,0.33,lag); // the fan is rubble; the lagoon floor is sand
  sub=Math.max(sub,Math.min(1,dkr*1.6),rimK,Math.min(1,1.6*cw*smooth(350,430,rw)*smooth(470,430,rw))); // bare rock: the dikes' crests, the rim band, the fan's blocks near the scarp (v11.12: a lost newline had left this line inside the comment above, so it never ran)
  if(h>0.5)sub=Math.max(sub,0.3);
  if(coneRock>0)sub=Math.max(sub,0.85*coneRock); // the tuff cone's ring and its cliffs are rock (v11.86)
  if(summitK>0)sub=Math.max(sub,0.9*summitK); // the sill's drowned summits are bare rock (v11.58)
  const turb=clamp(expo*(1-sub)*0.7+0.4*nut*light+0.5*heat,0,1);
  const rel=clamp(0.5+(h-hSmooth)/40,0,1);
  f[0]=sub;f[1]=flow;f[2]=expo;f[3]=nut;f[4]=turb;f[5]=Math.min(1,young);f[6]=heat;f[7]=lag;f[8]=rel;
  return {h:h,f:f};
}
// steepness into the substrate: a steep face is bare rock whatever lies around it (sl is |grad h|)
function fixF(f,sl){f[0]=Math.max(f[0],smooth(0.35,0.8,sl));return f;}
// envW(env,h,sl,f): a species' tolerance, 0..1 — the product over its envelope's keys of a plateau [lo,hi] with a soft edge
// (r[2]; default 15% of the range, and for h at most 10 m — a band of 700 m must not bleed 100 m past its edge). Keys: h (ground
// height), slope, and the fields of FI. No key: 1.
function envW(env,h,sl,f){let w=1;
  for(const k in env){const r=env[k],v=k==='h'?h:k==='slope'?sl:f[FI[k]],lo=r[0],hi=r[1],e=r[2]!==undefined?r[2]:k==='h'?Math.min(10,(hi-lo)*0.15):(hi-lo)*0.15;
    if(v<lo)w*=clamp(1-(lo-v)/e,0,1);else if(v>hi)w*=clamp(1-(v-hi)/e,0,1);if(w<=0)return 0;}
  return w;}
// The retention field (v11.81, PLANKTON.md §12; the canopy mask `canopyW` to v11.80): three eddies in the seamount's wake — downstream of
// the current, where a Taylor-column lee retains what drifts into it (PLANET, the colony). What is retained is productive (the island mass
// effect), so the crop is higher here (plank, below), and the drifting colonies pile up in the convergence: the sailer fleets (chunks.js
// spawnChunkCreatures) and the buttons' `leePer` (flora.js). Three patches [angle, radius, size], each a core (1 inside 0.55*size) with a
// halo thinning to 0 at size, edges warped by noise; leeW(x,z) is 0..1. The positions are the v9 canopy's: they are in the wake, which is
// where the eddy belongs. What the mask no longer does: tint the water green (WATER_CANOPY), shade the floor, thicken the snow's floc, act
// as a lid for the light, the shafts and the sound — a patch of green with nothing above it was exactly what the rule of 8 Sep forbids.
const EDDY=[[2.3,1440,470],[1.35,1400,300],[3.25,1420,300]].map(p=>({x:Math.cos(p[0])*p[1],z:Math.sin(p[0])*p[1],R:p[2]}));
function leeW(x,z){
  if(Math.hypot(x,z)<900)return 0;
  let w=0;
  for(const c of EDDY){const d=Math.hypot(x-c.x,z-c.z);if(d>c.R*1.3)continue;
    const dw=d*(1+0.28*(fbm(x*0.0045+120,z*0.0045+66,2)-0.5)*2),v=smooth(c.R,c.R*0.55,dw);if(v>w)w=v;}
  return w;
}
// The colour of the lit water column over a point, *before* depth darkens it: by the floor's depth (the approved v5-v7 shelf
// look at the shallow end, holding the deep blue below 250: the darkness of the deep is the light's, v11.28), toward a silty green-grey with turbidity,
// brown in a vent's plume. The plankton's green is not here since v11.81: it is the crop's, by kind, from the bloom map (plank, below; the veil
// applies it at the ray's own depth). To v11.80 this held a guess at it (nut × the floor's light × 0.3, greener) and the canopy's WATER_CANOPY.
const WCOL=[[0,[0.10,0.46,0.58]],[20,[0.10,0.42,0.52]],[60,[0.09,0.34,0.40]],[150,[0.07,0.26,0.36]],[250,[0.05,0.20,0.32]]]; // v11.28: the table ends at the deep blue. It went on to (0.03,0.08,0.16) at 400 and (0.006,0.01,0.03) at 451 — "dark on purpose over the deep and the void" — a black water. Water is not black: the deep is dark because little light reaches it, and that is the daylight term (dl in the fog block and updateAtmosphere), not the colour. The person, 10 Sep: no deliberately black fog.
const WCOL_D=WCOL[WCOL.length-1][0];
// The table at a depth (the JS and the GLSL of the same curve — the veil reads it by the ray's own depth since v11.27, see FLOOR_H)
function wcolAt(d){d=clamp(d,0,WCOL_D);let c=WCOL[WCOL.length-1][1];
  for(let i=1;i<WCOL.length;i++)if(d<=WCOL[i][0]){const a=WCOL[i-1],b=WCOL[i],t=(d-a[0])/(b[0]-a[0]);c=[lerp(a[1][0],b[1][0],t),lerp(a[1][1],b[1][1],t),lerp(a[1][2],b[1][2],t)];break;}
  return c;}
const WCOL_GLSL='vec3 wcol(float d){vec3 c=vec3('+WCOL[0][1].map(v=>v.toFixed(3)).join(',')+');'+WCOL.slice(1).map((e,i)=>'c=mix(c,vec3('+e[1].map(v=>v.toFixed(3)).join(',')+'),clamp((d-'+WCOL[i][0].toFixed(1)+')/'+(e[0]-WCOL[i][0]).toFixed(1)+',0.0,1.0));').join('')+'return c;}'; // the chain of mixes is the piecewise line exactly: each clamp saturates before the next begins
// The floor's say in the veil (v11.27). WCOL is indexed by the *floor's* depth, which made the veil's colour a map of the floor: over the
// void (h -800, the table's last entry, near black) and the pit the water read black in every direction from 260 units off, and the
// void's edge stood on the horizon as a dark band — "the edge of the world" (the person, 10 Sep). Now the veil at a point is the table
// at the point's own depth (never brighter than the table at OPEN_D: the sand's bounce is the floor's, not open water's) blended toward
// the floor's entry (with its turbidity, plankton and heat) by exp(-(height above the floor - FLOOR_FREE)/FLOOR_H): the floor's colour
// whole within FLOOR_FREE of it (the shelf from the surface as it was, within 4%), fading over FLOOR_H above that; over deep water the
// colour is the water's at that depth, whatever lies far below (the surface over the slope is ~13% brighter than it was: open water at
// the surface is not darker than open water at -120). The shader reads the floor from floorMap (scene.js; far.js fills it beside the
// water map); updateAtmosphere does the same on the CPU for the ambient. Not on the tuner: the readout's keys are all taken.
const FLOOR_H=80,FLOOR_FREE=30,OPEN_D=150;
function waterColor(s,out){const c=wcolAt(-s.h);
  const f=s.f,tb=f[FI.turb]*0.45,ht=f[FI.heat]*0.6,o=out||[0,0,0];
  o[0]=lerp(lerp(c[0],0.16,tb),0.09,ht);o[1]=lerp(lerp(c[1],0.40,tb),0.06,ht);o[2]=lerp(lerp(c[2],0.36,tb),0.05,ht);return o;}
// ---------- the plankton (v11.81, PLANKTON.md §3–4, §7; pass 1 of §13) ----------
// The water's own life as a field, never organisms: a standing stock C in mg/m³ of pigment, the product of where (the column, from the
// world's fields) and how deep (the vertical shape, from the light and the nutricline), in three pigment kinds (TAXA: the open ocean's
// plankton came in three, each keeping its slice of the spectrum, each the ancestor of a sessile line) — green (the greens': bright,
// shallow, fed), gold (the floaters': the opportunist that blooms on a nutrient pulse — stirred water, the flank, days after a storm) and
// red (the reds': the dim deep maximum under the mixed layer). The colour of the water is which kind is winning here.
//   the column (plank, static per place, written into the water and floor maps' free channels — far.js wmFill, scene.js floorMap):
//     C = c0·10^(cexp·nutP), nutP the food less the vents' share (chemosynthetic, not pigment): the basin's 0.12 → 0.06 (a gyre's 0.03–0.08),
//     the sides' 0.45 → 0.3 (island water 0.2–0.5), the fed flank's 0.67–0.97 → 0.9–3.8 (an upwelling flank 1–3); × (1 + shallow·(the floor
//     within the lit layer)·(1 + 0.6·shel)) — benthic regeneration: over a shallow floor the nutrients come back within the light (the shelf,
//     the lagoon); × (1 + lee·leeW) — the retention field. The lit layer's crop is split green/gold by the stirred share (the current and the
//     waves); the red is the column's under it, where the floor is deep enough to hold a maximum and the column is not mixed.
//   the front (the water map's alpha): X = log10(depth/u³), Simpson–Hunter's criterion with u the tidal stream at full flood on a spring (tidalAt).
//     Mixed top to bottom where X is small, stratified where it is large, and the front between them — the richest water of a shelf sea —
//     is a Gaussian on X about xc (2.1: at springs the break, ~125 m, where the stream round the rim's cylinder is 1 m/s, and the shelf's ~55 m where it is 0.75) of width xs. The shader and
//     bloomC apply it by the clock: the stream scales with the tide's amplitude, so X shifts by 3·log10(amp/springAmp) and the ring moves
//     onto the shelf at neaps (h ∝ u³: 0.3× the depth) and out to the break at springs — the 13-day breathing of §4. The stream is a
//     potential flow round the rim's cylinder, so u is ~0 on the current's axis and the ring is broken at the two stagnation points:
//     the fed flank's centre and the lee. The front feeds the lit layer (× (1 + front·fr)) and unmakes the deep maximum (× (1 − 0.7·fr)).
//   the pulse (uFogB.z, far.js bloomTick): the gold's crop × (1 + storm·pulse), pulse the rain of the past four days through a kernel that
//     rises over a day and decays over three (weatherAt; the shower is the storm's proxy — the wind that mixed the nutricline up came with
//     it), less the pulse a shower most days keeps (calm — the trades' climatology is not a storm). The bloom of §7: gold on the flank days after a storm, olive to brown at its peak.
//   the vertical (bloomC): green 1 to 45 m fading out by 85 (the mixed layer to the thermocline at 64), gold to 60 fading by 110 (it sinks),
//     red a Gaussian at 95 ± 35 — the deep chlorophyll maximum on the nutricline, gone by the 1% light level (~165 in clear water: TAXA's
//     deep rind stops there, so the flora and the water share one floor). The mixed layer's depth by season is pass 3.
//   the colour (bloomTint): a kind's crop at the point's depth saturates twice, w1 = C/(C+k1) for the kind's tint (pigment absorbs blue and
//     red and leaves green; the reds keep blue and red and leave a dimmer plum) and w2 = C/(C+k2) for the heavy stage (olive, brown) — each
//     a multiplier on the column's colour so depth's darkening stands. Every number is a start, to be tuned after a look (the person, 22 Sep:
//     "go with what is ecologically plausible … then see if it looks good").
// The maps hold the lit layer's two crops on a log scale (plankEnc: cmin → 0, cmax → 1) in the floor map's blue and alpha and X as (X−1)/5 in
// the water map's alpha (far.js wmFill/wmBlur, beside the colour and the floor: the fragment shaders were at WebGL's 16 texture units, so
// a third map could not be bound — seen, 22 Sep: every tinted material failed to compile and the world was the veil alone). The red is not
// stored: it is the lit crop's under the mixed layer, derived in bloomC from the two crops and the floor's depth, the floor map's red, the
// same way in the JS and the GLSL below, generated from these tables so the shader and bloomC cannot drift. plankAt(x,y,z) is the field
// exactly (from sample), for the snow (pass 2) and the tests.
const PLK={c0:0.035,cexp:2.1,shallow:1.5,lee:1.5,red:0.5,xc:2.1,xs:0.3,front:1.2,storm:4.0,calm:0.15,k1:1.5,k2:6.0,cmin:0.03,cmax:20}; // mg/m³ and log10 units; front, storm, shallow, lee are multipliers (+1); calm: the pulse the trades' own showers keep (a shower most days), below which the gold is not fed
const PIGK=[{m1:[1.05,1.06,0.62],m2:[1.15,0.92,0.70]},{m1:[1.35,1.06,0.58],m2:[1.20,0.88,0.60]},{m1:[0.90,0.70,0.83],m2:[1,1,1]}]; // green, gold, red: the tint at saturation, and the heavy stage
const PLK_ENC=Math.log2(PLK.cmax/PLK.cmin); // the log scale's span
function plankEnc(C){return clamp(Math.log2(Math.max(C,PLK.cmin)/PLK.cmin)/PLK_ENC,0,1);}
const _plkV=new THREE.Vector3();
// the column at a place: out = [green, gold (mg/m³, the lit layer's standing stock), X]; s = sample(x,z)
function plank(x,z,s,out){const f=s.f,h=s.h,o=out||[0,0,0];
  const nutP=clamp(f[FI.nut]-0.5*f[FI.heat],0,1),sh=smooth(-60,-8,h);
  const C=PLK.c0*Math.pow(10,PLK.cexp*nutP)*(1+PLK.shallow*sh*(1+0.6*f[FI.shel]))*(1+PLK.lee*leeW(x,z));
  const stir=clamp(0.9*f[FI.flow]+0.3*f[FI.expo],0,1),gold=stir*(1-0.5*sh);
  o[0]=C*(1-gold);o[1]=C*gold;
  tidalAt(x,z,_plkV);const u=Math.max(Math.sqrt(_plkV.x*_plkV.x+_plkV.z*_plkV.z),0.05);o[2]=h>-2?6:clamp(Math.log10(Math.max(-h,1)/(u*u*u)),1,6);
  return o;}
// the maps' texel for a place (0..1 ×3: the two crops encoded, X), as wmFill writes it
function plankTexel(x,z,s,out){const o=plank(x,z,s,out);o[0]=plankEnc(o[0]);o[1]=plankEnc(o[1]);o[2]=(o[2]-1)/5;return o;}
// the clock's part, shared by the shader (uFogB) and the JS: x = xc + 3·log10(amp/spring), y = 1/xs, z = storm·pulse, w = the season (v11.83:
// seasonAt — the mixed layer 64 m × (1 + 0.3·s), the green's floor and the gold's scaled with it, the deep maximum at its base + 31 and
// narrower in the still half; the gold × (1 + 0.35·s), the green × (1 + 0.15·s), the red × (1 − 0.3·s): the windy half high and shallow, the
// still half low at the surface with a sharp deep maximum — §6's table)
const FOG_B=new Float32Array([PLK.xc,1/PLK.xs,0,0]);
// the crops at a depth d (from the tide) over a floor fd deep, from a texel b (0..1 ×3, bilinear), by the clock: out = [green, gold, red] mg/m³.
// The red: the lit crop's share under the mixed layer — where the floor is deep enough to hold a maximum and the column is not stirred
// (the stirred share read back off the gold's share of the lit crop, the shallow term undone)
function bloomC(b,fd,d,out){const o=out||[0,0,0],X=b[2]*5+1,fx=(X-FOG_B[0])*FOG_B[1],fr=Math.exp(-fx*fx),lit=1+PLK.front*fr,s=FOG_B[3],ml=64*(1+0.3*s);
  const Cg=PLK.cmin*Math.pow(2,b[0]*PLK_ENC),Cf=PLK.cmin*Math.pow(2,b[1]*PLK_ENC),sh=smooth(60,8,fd),stir=clamp(Cf/(Cg+Cf)/(1-0.5*sh),0,1);
  o[0]=Cg*lit*(1+0.15*s)*(1-smooth(0.7*ml,1.33*ml,d));o[1]=Cf*lit*(1+FOG_B[2])*(1+0.35*s)*(1-smooth(0.94*ml,1.72*ml,d));
  const r=(d-ml-31)/(35*(1+0.2*s));o[2]=(Cg+Cf)*PLK.red*(1-0.3*s)*smooth(60,140,fd)*(1-0.6*stir)*(1-0.7*fr)*Math.exp(-r*r);return o;}
// the column's colour c tinted by the crops C (bloomC's), in place
function bloomTint(c,C){for(let k=0;k<3;k++){const P=PIGK[k],w1=C[k]/(C[k]+PLK.k1),w2=C[k]/(C[k]+PLK.k2);for(let i=0;i<3;i++)c[i]*=lerp(1,P.m1[i],w1)*lerp(1,P.m2[i],w2);}return c;}
const _plkT=[0,0,0];
// the lit layer's standing stock at a place (green + gold, mg/m³, before the clock): the swarms' capacity reads it (ecology.js ecoCap, v11.84)
function cropAt(x,z,s){const c=plank(x,z,s,_plkT);return c[0]+c[1];}
// the field at a point in the world, exactly (the snow and the tests): out = [green, gold, red] mg/m³ at that depth, now
function plankAt(x,y,z,out){const s=sample(x,z);return bloomC(plankTexel(x,z,s,_plkT),-s.h,TIDE-y,out);}
const _v3=v=>'vec3('+v.map(n=>n.toFixed(3)).join(',')+')';
const BLOOM_GLSL='vec3 bloomC(vec3 b,float fd,float d){float fx=(b.z*5.0+1.0-uFogB.x)*uFogB.y;float fr=exp(-fx*fx);float lit=1.0+'+PLK.front.toFixed(2)+'*fr;float s=uFogB.w;float ml=64.0*(1.0+0.3*s);float r=(d-ml-31.0)/(35.0*(1.0+0.2*s));'+
  'vec2 C='+PLK.cmin.toFixed(3)+'*exp2(b.xy*'+PLK_ENC.toFixed(4)+');float sh=1.0-smoothstep(8.0,60.0,fd);float stir=clamp(C.y/(C.x+C.y)/(1.0-0.5*sh),0.0,1.0);'+
  'return vec3(C.x*lit*(1.0+0.15*s)*(1.0-smoothstep(0.7*ml,1.33*ml,d)),C.y*lit*(1.0+uFogB.z)*(1.0+0.35*s)*(1.0-smoothstep(0.94*ml,1.72*ml,d)),(C.x+C.y)*'+PLK.red.toFixed(2)+'*(1.0-0.3*s)*smoothstep(60.0,140.0,fd)*(1.0-0.6*stir)*(1.0-0.7*fr)*exp(-r*r));}\n'+
  'vec3 bloomTint(vec3 c,vec3 C){vec3 w1=C/(C+'+PLK.k1.toFixed(2)+'),w2=C/(C+'+PLK.k2.toFixed(2)+');'+
  PIGK.map((P,k)=>{const s='w1.'+'rgb'[k],t='w2.'+'rgb'[k];return 'c*=mix(vec3(1.0),'+_v3(P.m1)+','+s+')'+(P.m2.every(v=>v===1)?'':'*mix(vec3(1.0),'+_v3(P.m2)+','+t+')')+';';}).join('')+'return c;}\n'; // the same curves as bloomC and bloomTint above, from the same tables
// The water. One density everywhere (there is no per-biome fog: WATER is a colour that belongs to the place, not a veil you
// walk into). Transmittance with distance d is share*exp(-(dens*d)^2) + (1-share)*exp(-far*d): the near haze as it always was
// (share 1 is exactly the pre-v8 fog) plus a slow extinction that leaves a ghost of things far off, so the far layer reads
// as hazy terrain instead of ending at 300 units. Contrast (dens 0.0068, share 0.88, far 0.0015): 66% at 100 units, 22% at
// 200, 8.8% at 300, 6.6% at 400, 4.9% at 600, 3.6% at 800, 2.7% at 1000, 1.3% at 1500 — the near field is the old game's,
// the tail is a 12% ghost that is gone by ~1000. To see further: lower far. Closer to the old cut-off: share toward 1.
// `shareS` is the share for small things (flora, small creatures, impostors: MAT, MATFAR and the sway materials; big things
// — terrain, structures, landmarks, glow, the surface, big creatures — use `share`); it is equal to `share` by default and
// exists as a knob (v8.2 shipped 0.82/0.90 and the person could see the ground and the objects fogging differently).
// The veil's colour is the water's, read from the world map (WATER by floor biome, canopy weight in alpha): 1-placeMix of it at
// the camera and placeMix of it `reach` units along the ray (or at the fragment if nearer) — the light scattered into the eye
// comes from the water near it, so the void beyond the rim and a silty biome far off never paint the distance. Daylight is read
// at the same bounded point (dlAt 1 = there, 0 = at the camera), so the veil is darker looking down into the deep and lighter
// looking up; `sun` brightens it toward the sun (pow 6 of the cosine, scaled by daylight); `bright` scales the whole veil;
// `ground` is the upwelling ambient (hemisphere ground colour) as a fraction of the veil colour (the sky side is 1.8), so
// undersides and down-tilted faces are lit water-dark rather than black — 1.2 makes the light field top:side:bottom
// 1.8:1.5:1.2, a diffuse underwater light with the sun as a 2-3:1 key on top; at 0.8 the flanks of the big rocks read as
// black polygons the fog could not soften (v8.3 screenshots). Every number is live-tunable from the readout (main.js, `FOG_TUNE`).
const SEA_FOG={dens:0.0068,share:0.88,shareS:0.88,far:0.0015,dlAt:1.0,placeMix:0.4,reach:260,bright:1.0,sun:0.8,ground:1.2,cau:0.8,shd:0.55}; // cau, shd (v11.13): the caustics' and the bodies' shadows' strength (scene.js LIGHT_K; the readout's t-y and u-i)
// above the surface: one sky, one haze, the same two-population curve (about 47% contrast at 300, 13% at 600, 4% at 1000).
const AIR={fog:[0.72,0.80,0.86],dens:0.0009,share:0.35,far:0.00003,zenith:[0.34,0.55,0.78],hemiSky:0xc4dcea,hemiGround:0x6e6a58}; // the noon sky (the approved v6 look); v11 reads it as the day keyframe of SKYC. v11.64: the air is a trade-wind day — dens 0.0009 / share 0.35 / far 0.00003: the near population is the look (35% of the contrast gone by 2 km, a light general haze), the far term is clear air (130 km), and the physics of the distance is the boundary layer (HAZE.dens 1.7e-4 over 70 m: Koschmieder's 23 km at the water), which the fog already integrates along every ray — so from the water the giant's foot at 18 km is lost in the layer (~3%) while a ray to its summit climbs out of it (~30%): the peak floating on the haze, as a far island looks. The horizon tier (horizon.js) draws it; to v11.63 it was 0.0024 / 0.6 / 0.0018, "a hazy coast" of ~1 km (WATER.md P6: the person's call, and the numbers to go back to). A shower still thickens it (applyFog)
// The sky by the sun's height (v11, atmosphere.js updateSky): keyframes on sin(altitude) — night, deep twilight, the sun on the
// horizon, day — for the zenith, the horizon haze (which is the air fog's colour: the sea's far edge merges into it), the glow
// round the sun's azimuth near the horizon, and the sunlight itself. The star is a late G / early K at ~5300 K (PLANET): its
// light is a warm white at noon, and the Rayleigh sky is a touch less saturated than Earth's; low, it goes amber-orange
// quickly. Moonlight (MOONC) is drawn blue-grey — the eye's night vision, the convention every night scene uses, not a
// property of the moon — at MOONL of noon's light when full and high (a moon nine times the Moon's area: bright nights).
// Overcast pulls the sky toward grey (GREYC) by the cover, and a shower darkens it further.
const SKYC=[ // [sinAlt, zenith, horizon, glow, sunlight]
  [-0.30,[0.012,0.016,0.035],[0.030,0.036,0.058],[0,0,0],[0,0,0]],
  [-0.12,[0.045,0.060,0.135],[0.170,0.130,0.170],[0.55,0.22,0.12],[0,0,0]],
  [-0.03,[0.140,0.200,0.400],[0.500,0.400,0.420],[1.00,0.42,0.16],[1.0,0.40,0.16]],
  [0.06,[0.240,0.400,0.660],[0.700,0.640,0.640],[1.00,0.60,0.28],[1.0,0.62,0.32]],
  [0.35,AIR.zenith,AIR.fog,[0.30,0.24,0.14],[1.0,0.94,0.84]]];
const MOONC=[0.72,0.80,0.96],MOONL=0.28,GREYC=[0.52,0.55,0.59],STARL=0.035; // moonlight's colour and its strength at full; the overcast sky; a moonless night's floor (starlight, airglow)
// ---------- landmarks ----------
// The one-offs are placed by the geology where the geology names the place (the pit crater and the chimney on rift arm 0) and
// searched for on the analytic terrain otherwise (seed 4242, a fixed sequence — new ones go on the end so earlier ones don't
// move). findSpot(rng, ok, r0, r1): the flattest patch in the radius band whose sample passes ok(s), checked over ±36.
function findSpot(rng,ok,r0,r1){
  let best=null;
  for(let k=0;k<2500;k++){
    const a=rng()*TAU,r=r0+rng()*(r1-r0);const x=Math.cos(a)*r,z=Math.sin(a)*r;
    const s=sample(x,z);if(!ok(s))continue;
    let good=true,hmin=1e9,hmax=-1e9;
    for(let dx=-36;dx<=36;dx+=36)for(let dz=-36;dz<=36;dz+=36){const q=sample(x+dx,z+dz);if(!ok(q))good=false;hmin=Math.min(hmin,q.h);hmax=Math.max(hmax,q.h);}
    if(!good)continue;const rough=hmax-hmin;
    if(!best||rough<best.rough)best={x:x,z:z,h:s.h,rough:rough};
    if(best.rough<7)break;
  }
  return best||{x:Math.cos(1)*(r0+r1)/2,z:Math.sin(1)*(r0+r1)/2,h:-100,rough:0};
}
const LM={};
(function(){const rng=mulberry(4242);
  LM.pit={x:PIT[0],z:PIT[1],h:sample(PIT[0],PIT[1]).h,r:190}; // r: structures keep this clear (the hole is 130 across the rim; a 60 m plate at 111 hung over it)
  const mud=s=>s.h<-230&&s.h>CHEMO&&s.f[FI.sub]<0.35&&s.f[FI.heat]<0.1;
  LM.bones=findSpot(rng,mud,1290,1430);
  {const vr=(VENT.r0+VENT.r1)/2,x=Math.cos(VENT.a)*vr,z=Math.sin(VENT.a)*vr;LM.chimney={x:x,z:z,h:sample(x,z).h};} // on the fissure
    LM.all=Object.keys(LM).map(k=>LM[k]);})();
