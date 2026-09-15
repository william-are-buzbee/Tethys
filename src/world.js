// world.js — the island: its geology as a terrain function, the condition fields, the wave function, landmark placement
// ---------- world shape ----------
// A young oceanic shield volcano, almost drowned (PLANET.md, Geology). 16x16 cells. The summit is a caldera whose rim is the
// last land; the shelf is the shield's upper flank; the slope ring carries drowned shorelines (terraces) as rings; one flank
// has collapsed (a scarp and a debris fan: the rockfall); the oldest flank has its radial dikes exhumed as ridges;
// two rift arms run from the summit, one with a pit crater on it and a hydrothermal fissure at its deep end; beyond the apron
// the floor goes on down the seamount's flank toward the plate (v11.28; to v11.27 a cliff into a void at -810). There are no biomes: sample(x,z) returns the ground height and the physical CONDITIONS
// at a point (substrate, current, wave exposure, food, turbidity, the age of the rock, heat, shelter, relief), and every
// species — sessile or swimming — has a tolerance envelope over those (envW). Nothing downstream reads a label.
const CELL=215,NCELL=16,HALF=CELL*NCELL/2;
// the geology's parameters: angles are radians from +x toward +z
const WIND_A=3.49,CUR_A=2.3; // the directions the wind (so the waves) and the ocean current travel toward: the waves strike the old flank (0.35), the current the north-east flank (5.44), the lee is the collapse's side
const RIFT_A=[2.6,5.6]; // the two rift arms
const COLL={a:3.9,hw:0.40}; // the flank collapse: the amphitheatre's centre and half-width at the scarp (it widens downslope)
const DIKE={a:0.35,hw:0.62}; // the oldest flank, wave-cut deepest in the lowstands: its radial dike swarm stands as ridges
const RIM_R=245,RIM_W=34; // the caldera rim: crest radius, width
const FLANK_R=1560,FLANK_W=250,FLANK_S0=0.30,FLANK_S1=0.22,FLANK_A=600,FLANK_B=2600; // the lower flank (sample(), v11.28): the apron's toe, the ramp's width, the slopes (tan) at the top and eased, the easing's span beyond the toe
const VENT={a:2.6,r0:1200,r1:1420}; // the hydrothermal fissure: the deep end of rift arm 0
const ISLE={x:Math.cos(5.5)*500,z:Math.sin(5.5)*500}; // a flank cone on rift arm 1: the island
const PIT=[Math.cos(2.6)*470,Math.sin(2.6)*470]; // a pit crater on rift arm 0
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
// ---------- the depth curves: one definition each, for the JS and the GLSL (v11.32) ----------
// Both of these were written six times between atmosphere.js, chunks.js and scene.js's shader strings, and both had drifted.
// The daylight curve — how much of the surface's light is left at a depth, the number the fog's veil, the ambient, the sun's
// own scale and the shadows all read — measured depth from the tide in the JS and from sea level in the GLSL. The difference
// is the tide over DL_REF: at most 2.2% of the light at spring, nothing below -302 where the curve clamps, so this fixes a
// disagreement nobody could see rather than a look. The person's call (12 Sep): depth is from the water's surface, so the
// shader follows the JS. The shader reads TIDE as uFogW.x (scene.js; main.js writes it each frame with the other clock uniforms).
// The canopy fade — how much of the mats' water a point takes — was a smoothstep over [-90,-60] in the shader and a hard cut
// at -70 in the JS, so between those depths the ambient light and the fog colour disagreed with the veil actually drawn.
// The shader's ramp is the right one (the person, 12 Sep) and the JS follows it.
const DL_REF=420,DL_MIN=0.28; // the depth the daylight curve would reach zero at, and its floor
function daylightAt(y){return clamp(1+Math.min(0,y-TIDE)/DL_REF,DL_MIN,1);}
const CAN_LO=-90,CAN_HI=-60; // the canopy's water reaches this far down, faded over the band
function canopyFade(y){return smooth(CAN_LO,CAN_HI,y);}
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
function skyDir(ha,out){const c=Math.cos(ha),sl=Math.sin(LAT);return out.set(-Math.sin(ha),Math.cos(LAT)*c,sl*c);} // hour angle 0 at upper transit, declination 0: rises east, transits south of the zenith by LAT, sets west
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
function weatherAt(h,out){const o=out||{};const w=fbm(h*0.13+22.1,17.3,3),q=fbm(h*0.85+5.1,5.1,2),c=fbm(h*0.055+41.7,9.9,2); // seeds chosen so boot is fair (cover 0.44) with the first shower 3 h in
  o.rain=smooth(0.71,0.78,q);o.cover=clamp(0.15+1.4*(w-0.32)+0.5*o.rain,0.08,0.92);o.cirrus=clamp(2.4*(c-0.36),0,1);
  o.wind=Math.max(smooth(0.33,0.46,fbm(h*0.09+77.3,2.2,2)),o.rain);return o;} // rain ~10% of the time; wind 1 the trades, 0 a calm (~25% of the time, hours at a stretch; a shower is a gust front)
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
const CLOUD_H=650,CLOUD_T=900,CIRRUS_H=9500;
let SEA_CHOP=1; // the short waves' amplitude now, 0.25 in a calm to 1 in the trades (atmosphere.js updateHaze; read by waveH and the wave GLSL's uChop): the swell (L ≥ 20) is from weather far away and keeps running
// The fumarole (v11.17.1, the person's call, 10 Sep): the flank cone is a young cone on a live shield — hot at the vents and the chimney
// below — and young cones on such shields degas: fumaroles at the summit venting steam and SO2 (Kilauea, Piton de la Fournaise). Two
// consequences, both real: a steam plume off the summit that rises, leans downwind and thins (FUME: the puffs' rise, lifetime, size),
// and vog — the SO2 gone to sulfate aerosol downwind, a warm-grey haze in a widening plume (VOG: a Gaussian plume from the summit,
// half-width w0 growing by spread per metre, deeper than the salt haze since the plume is buoyant; sampled at the camera like the
// spray). Vog reddens a sunset and greys the sky; no sulphur rain, no ash — a quiet vent, not an eruption.
const FUME={x:ISLE.x,z:ISLE.z,y:40,rise:1.6,life:70,r0:4,r1:22,n:96}; // the summit; the puffs' rise (m/s at birth), life (s), radius at birth and death, count
const VOG={dens:4.0e-4,w0:70,spread:0.16,h:140,reach:2400}; // extinction at the plume's axis near the cone, the plume's half-width and its growth, its scale height, how far it is felt
// A dawn mist on the lagoon (v11.17.1, the person's call): on a clear calm night the rim's flat and the shallow lagoon radiate and cool
// below the sea's mixed layer, and the lagoon's water, warmer than the air over it by dawn, steams — the same evaporation mist a
// tropical mangrove creek makes at first light. It needs all three (clear: cover low; calm: wind low; the sheltered water: the lagoon
// field at the camera), lies a few metres deep (MIST_DAWN.h) and burns off within the hour after sunrise.
const MIST_DAWN={dens:0.020,h:6,from:-3.0,peak:0.0,to:1.2}; // extinction at the water at full mist; its depth; the hours before sunrise it builds from, the peak, when it is gone
 // the cumulus base and the deck's thickness (the inversion caps it), the cirrus height (m)
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
// sample(x,z) → {h, f}: the ground and the conditions. `out` may be passed to reuse the field array.
// Substrate f[sub] here leaves out steepness (the cell adds it from its grid; far.js from two extra samples: fixF).
function sample(x,z,out){
  const r=Math.hypot(x,z),a=Math.atan2(z,x);
  const aw=a+0.32*angNoise(a,1.6,11)+0.22*(fbm(x*0.0035+80,z*0.0035+20,3)-0.5)*2; // warped angle: wavy sectors
  const rw=r*(1+0.16*angNoise(aw,1.2,29)); // warped radius: wavy contours
  let awn=aw%TAU;if(awn<0)awn+=TAU;
  const ca=Math.cos(a),sa=Math.sin(a);
  const expoW=0.5-0.5*(ca*Math.cos(WIND_A)+sa*Math.sin(WIND_A)); // 1 on the shore the waves strike
  const upW=0.5-0.5*(ca*Math.cos(CUR_A)+sa*Math.sin(CUR_A)); // 1 on the flank the current strikes (upwelling); 0 in its wake
  const collW=sectorW(awn,COLL.a,COLL.hw*(1+0.55*smooth(380,1000,rw)),0.14),cw=collW*smooth(300,350,rw)*smooth(1250,1000,rw);
  const dikeW=sectorW(awn,DIKE.a,DIKE.hw,0.2),dk=dikeW*smooth(700,790,rw)*smooth(1220,1080,rw);
  // the shield's bare profile: the rim's outer slope to -20 at 330, the shelf to -60 at 700, the slope to -156 at 1000 and -250
  // at 1200, the apron to -290 at 1600
  const tS=smooth(700,1000,rw);
  let hb=-14-6*smooth(RIM_R+RIM_W*0.3,330,rw)-40*smooth(330,700,rw)-94*smooth(1000,1200,rw)-40*smooth(1200,1600,rw);
  const hills=8*(fbm(x*0.006+3,z*0.006+7,4)-0.5)*2+2.5*(fbm(x*0.03+9,z*0.03+1,3)-0.5)*2;
  hb+=hills*(0.5+0.5*smooth(0,270,rw));
  const hSmooth=hb-96*tS;
  // the terraces: the slope between -60 and -156 cut into eight 12 m steps at the stillstands, rings round the whole island,
  // buried where the collapse debris lies over them (cw)
  const tv=tS*8,tf=Math.floor(tv),tfr=tv-tf,tStep=(tf+smooth(0.36,0.64,tfr))*12;
  let h=hb-lerp(tStep,96*tS,cw);
  // the dikes: on the oldest flank between the terraces, radial ridges every 2π/22, sharp, 8-34 m, each varying along its length
  let dkr=0;
  if(dk>0){const q=((awn*22/TAU)%1+1)%1,rg=1-Math.abs(2*q-1);dkr=Math.pow(rg,2.6)*dk*(0.55+0.45*fbm(x*0.005+61,z*0.005+17,2));h+=34*dkr;}
  // the collapse: a headwall (75 m across 90 m of radius, from just outside the rim), then the debris fan — hummocky, biggest near the
  // scarp, thickening the slope by 20 m where it piles and thinning to nothing by the apron; a few blocks stand out near the scarp
  // The hummocks are rounded mounds (v11.19.1): a smoothstep of the noise, so every crest and every foot has a continuous slope. To v11.19
  // they were rg² of a tent (1-|2f-1|) — a crease along every crest and a kink at every foot — and everything settled on them clipped
  // (the person: "strange jagged terrain", 10 Sep). The same noise, so the mounds stand where the old ones stood.
  if(cw>0){const fn=fbm(x*0.016+13,z*0.016+41,3),mnd=smooth(0.5,0.68,fn),near=smooth(1100,430,rw);
    const scarp=-75*smooth(340,430,rw),bump=20*smooth(430,640,rw)*smooth(1150,900,rw),hum=(6+24*near)*mnd+(4+10*near)*(fbm(x*0.007+77,z*0.007+5,3)-0.5)*2;
    h+=cw*(scarp+bump+hum);
    h+=cw*44*smooth(0.68,0.78,fn)*smooth(450,400,rw)*smooth(360,400,rw)*smooth(0.55,0.75,0.5+0.5*angNoise(aw,2.5,88));} // blocks that break the surface: the highest mounds nearest the scarp
  // the rift arms: low broad ridges of younger flows from the summit out; the fissure at the deep end of arm 0 with mounds along it
  let young=cw*smooth(340,400,rw),heat=0;
  for(let k=0;k<2;k++){const rwk=sectorW(awn,RIFT_A[k],0.13,0.09)*smooth(280,340,rw)*smooth(1600,1300,rw);h+=8*rwk;young=Math.max(young,0.7*rwk);}
  {const vw=sectorW(awn,VENT.a,0.1,0.07)*smooth(VENT.r0-70,VENT.r0,rw)*smooth(VENT.r1+70,VENT.r1,rw);if(vw>0){heat=vw;h+=22*vw*Math.pow(fbm(x*0.03+50,z*0.03+50,3),3)*1.6;young=Math.max(young,vw);}}
  // the lower flank beyond the apron (v11.28; PLANET, The shield), and the pit crater. To v11.27 the floor fell 520 m in 90-250 m here —
  // a cliff into "the void" at -810, the world's rocky wrapping (the person, 10 Sep: "an artificial border to wrap the world up in rocky
  // bubble wrap"). A seamount whose summit reaches the surface stands 3-4 km off the plate on flanks of 10-20°; the apron of its own
  // debris is a local thickening on that flank, not its foot. So past the apron's toe (FLANK_R, wavy: gullies and slide scars) the
  // slope ramps with no crease from the apron's 5.7° to FLANK_S0 (16.7°) over FLANK_W, eases to FLANK_S1 (12.4°) between FLANK_A and
  // FLANK_B (the lower flank), and goes on down forever: -320 at the square's edge on an axis, ~-580 at a corner, ~-850 where the far
  // layer's apron ends 2000 m out, the plate (~-3800 on a young plate) 15 km out — where the world grows. Ribbed ±15% by sector.
  const rf=rw-(FLANK_R+60*angNoise(aw,2.5,99));
  if(rf>0){const t=Math.min(rf/FLANK_W,1),d0=rf<FLANK_W?FLANK_W*(t*t*t-0.5*t*t*t*t):rf-0.5*FLANK_W; // ∫smoothstep(0,W): the ramp's drop
    const u=clamp((rf-FLANK_A)/(FLANK_B-FLANK_A),0,1),d1=rf<FLANK_A?0:rf<FLANK_B?(FLANK_B-FLANK_A)*(u*u*u-0.5*u*u*u*u):rf-0.5*(FLANK_A+FLANK_B); // ∫smoothstep(A,B): the easing's
    h-=(FLANK_S0*d0-(FLANK_S0-FLANK_S1)*d1)*(1+0.15*angNoise(aw,3.0,131));}
  const pd=Math.hypot(x-PIT[0],z-PIT[1]);if(pd<130)h-=520*smooth(100,40,pd);
  // the caldera: a flat sandy floor at -22 inside a rim of land broken by passes (the passes run at -14: the lagoon's flushing)
  const lag=smooth(RIM_R-RIM_W*0.4,RIM_R-RIM_W*1.6,rw);
  if(lag>0)h=lerp(h,-22+1.5*(fbm(x*0.02+5,z*0.02+3,2)-0.5)*2,lag);
  const rimA=smooth(0.3,0.62,0.5+0.5*angNoise(aw,2.4,77)),rimK=smooth(RIM_R-RIM_W,RIM_R-RIM_W*0.3,rw)*smooth(RIM_R+RIM_W,RIM_R+RIM_W*0.3,rw);
  if(rimK>0){h=lerp(h,2.5+3.5*(fbm(x*0.02+5,z*0.02+3,2)-0.5)*2,rimK*rimA);h-=3*(1-rimA)*rimK;}
  // the island: a flank cone with a tidal flat of bars and pools and a hill behind it
  const id=Math.hypot(x-ISLE.x,z-ISLE.z);
  if(id<270){const dw=id*(1+0.3*(fbm(x*0.008+7,z*0.008+3,3)-0.5)*2);const k=smooth(200,105,dw);
    if(k>0)h=lerp(h,-0.6+2.6*(fbm(x*0.03+11,z*0.03+2,2)-0.5)*2,k)+40*smooth(88,18,dw)*(1+0.3*(fbm(x*0.02+9,z*0.02+8,2)-0.5)*2);}
  // ---- the conditions ----
  const f=out||new Float32Array(NF),light=smooth(-150,-10,h),shelfEdge=smooth(650,730,rw)*smooth(1150,950,rw),pass=(1-rimA)*rimK;
  const flow=clamp(((0.2+0.6*upW)*(0.55+0.45*shelfEdge)+0.8*pass)*(1-0.85*lag),0,1);
  const expo=clamp((0.25+0.75*expoW)*smooth(-30,-6,h)*(1-0.9*lag),0,1);
  const nut=clamp((0.22+0.45*upW+0.3*shelfEdge+0.5*heat)*(1-0.65*lag),0,1);
  // sediment cover: mud with depth; sand where the waves don't strip it (the lee), in patches, and on the lagoon floor; nothing
  // stays on the fan's fresh blocks or the dikes' crests
  const shelfS=smooth(-75,-12,h);
  let cover=0.1+0.75*smooth(-90,-260,h)+shelfS*(0.65*Math.pow(1-expoW,1.3)+0.25*(fbm(x*0.008+41,z*0.008+23,3)-0.5)*2)+0.45*lag-0.5*cw-0.6*dkr;
  let sub=clamp(1-cover,0,1);sub=lerp(sub,0.66,cw*(1-0.5*smooth(500,1000,rw)));sub=lerp(sub,0.33,lag); // the fan is rubble; the lagoon floor is sand
  sub=Math.max(sub,Math.min(1,dkr*1.6),rimK,Math.min(1,1.6*cw*smooth(350,430,rw)*smooth(470,430,rw))); // bare rock: the dikes' crests, the rim band, the fan's blocks near the scarp (v11.12: a lost newline had left this line inside the comment above, so it never ran)
  if(h>0.5)sub=Math.max(sub,0.3);
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
// The canopy is a surface mask, not a floor: patches of the outer world where floating colonies and rafts cover the water. They
// sit in the seamount's wake — downstream of the current, where the eddies retain what drifts (PLANET, the colony). Three
// patches [angle, radius, size], each a dense core (mask 1 inside 0.55*size) with a halo that thins to 0 at size, edges
// warped by noise. canopyW(x,z) is the mask, 0..1; flora density scales with it, so the halo is the thinner fringe.
const CANOPY=[[2.3,1440,470],[1.35,1400,300],[3.25,1420,300]].map(p=>({x:Math.cos(p[0])*p[1],z:Math.sin(p[0])*p[1],R:p[2]}));
function canopyW(x,z){
  if(Math.hypot(x,z)<900)return 0;
  let w=0;
  for(const c of CANOPY){const d=Math.hypot(x-c.x,z-c.z);if(d>c.R*1.3)continue;
    const dw=d*(1+0.28*(fbm(x*0.0045+120,z*0.0045+66,2)-0.5)*2),v=smooth(c.R,c.R*0.55,dw);if(v>w)w=v;}
  return w;
}
// The colour of the lit water column over a point, *before* depth darkens it: by the floor's depth (the approved v5-v7 shelf
// look at the shallow end, holding the deep blue below 250: the darkness of the deep is the light's, v11.28), toward a silty green-grey with turbidity, greener where
// there is plankton (food in the light), brown in a vent's plume. Under the canopy: WATER_CANOPY at full weight (v5's, approved).
const WCOL=[[0,[0.10,0.46,0.58]],[20,[0.10,0.42,0.52]],[60,[0.09,0.34,0.40]],[150,[0.07,0.26,0.36]],[250,[0.05,0.20,0.32]]]; // v11.28: the table ends at the deep blue. It went on to (0.03,0.08,0.16) at 400 and (0.006,0.01,0.03) at 451 — "dark on purpose over the deep and the void" — a black water. Water is not black: the deep is dark because little light reaches it, and that is the daylight term (dl in the fog block and updateAtmosphere), not the colour. The person, 10 Sep: no deliberately black fog.
const WCOL_D=WCOL[WCOL.length-1][0];
const WATER_CANOPY=[0.09,0.37,0.34];
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
  const f=s.f,tb=f[FI.turb]*0.45,pk=f[FI.nut]*smooth(-150,-10,s.h)*0.3,ht=f[FI.heat]*0.6,o=out||[0,0,0];
  o[0]=lerp(lerp(c[0],0.16,tb)*(1+0.1*pk),0.09,ht);o[1]=lerp(lerp(c[1],0.40,tb)*(1+0.22*pk),0.06,ht);o[2]=lerp(lerp(c[2],0.36,tb)*(1-0.08*pk),0.05,ht);return o;}
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
const AIR={fog:[0.72,0.80,0.86],dens:0.0024,share:0.6,far:0.0018,zenith:[0.34,0.55,0.78],hemiSky:0xc4dcea,hemiGround:0x6e6a58}; // the noon sky (the approved v6 look); v11 reads it as the day keyframe of SKYC
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
