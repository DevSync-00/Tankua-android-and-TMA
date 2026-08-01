/**
 * fill_missing_regions.js
 * 
 * Knowledge-based resolver for Ethiopian destination region/city data.
 * Uses a comprehensive lookup table of Ethiopian geography to resolve
 * missing region and city fields from destination names, tags, and descriptions.
 * 
 * Outputs:
 *   - database/destinations_fill_regions.sql (transaction with UPDATE statements)
 *   - database/destinations_fill_regions_report.csv (full report)
 *   - database/destinations_unresolved.csv (unresolved destinations)
 */
const fs = require('fs');
const path = require('path');

// ─── Ethiopian Geography Lookup ─────────────────────────────────────────────
// Each entry: keyword → { region, city }
// Keywords are matched against destination name, tags, and description.
// More specific entries (multi-word) are checked before generic ones.
// The city values follow conventions already used in the database.

const PLACE_LOOKUP = {
  // ═══════════════════════════════════════════════════════════
  // ADDIS ABABA
  // ═══════════════════════════════════════════════════════════
  'meskel square':         { region: 'Addis Ababa', city: 'Kirkos' },
  'bole road':             { region: 'Addis Ababa', city: 'Bole' },
  'bole medhanealem':      { region: 'Addis Ababa', city: 'Bole' },
  'edna mall':             { region: 'Addis Ababa', city: 'Bole' },
  'bole international':    { region: 'Addis Ababa', city: 'Bole' },
  'piazza':                { region: 'Addis Ababa', city: 'Addis Ketema' },
  'merkato':               { region: 'Addis Ababa', city: 'Addis Ketema' },
  'mercato':               { region: 'Addis Ababa', city: 'Addis Ketema' },
  'addis merkato':         { region: 'Addis Ababa', city: 'Addis Ketema' },
  'jan meda':              { region: 'Addis Ababa', city: 'Gulale' },
  'entoto':                { region: 'Addis Ababa', city: 'Gulale' },
  'mount entoto':          { region: 'Addis Ababa', city: 'Gulale' },
  'national museum':       { region: 'Addis Ababa', city: 'Addis Ketema' },
  'ethnological museum':   { region: 'Addis Ababa', city: 'Gulale' },
  'hilton addis':          { region: 'Addis Ababa', city: 'Kirkos' },
  'hyatt regency':         { region: 'Addis Ababa', city: 'Kirkos' },
  'sheraton addis':        { region: 'Addis Ababa', city: 'Kirkos' },
  'marriott executive':    { region: 'Addis Ababa', city: 'Kirkos' },
  'ramada':                { region: 'Addis Ababa', city: 'Bole' },
  'capital hotel':         { region: 'Addis Ababa', city: 'Bole' },
  'tomoca':                { region: 'Addis Ababa', city: 'Kirkos' },
  'filwoha':               { region: 'Addis Ababa', city: 'Kirkos' },
  'science museum':        { region: 'Addis Ababa', city: 'Kirkos' },
  'postal museum':         { region: 'Addis Ababa', city: 'Lideta' },
  'kadisco':               { region: 'Addis Ababa', city: 'Bole' },
  'hayat hospital':        { region: 'Addis Ababa', city: 'Bole' },
  'kotebe':                { region: 'Addis Ababa', city: 'Yeka' },
  'dembel city':           { region: 'Addis Ababa', city: 'Kirkos' },
  'getu commercial':       { region: 'Addis Ababa', city: 'Kirkos' },
  'inter luxury':          { region: 'Addis Ababa', city: 'Kirkos' },
  'imperial club':         { region: 'Addis Ababa', city: 'Kirkos' },
  'abebe bikila stadium':  { region: 'Addis Ababa', city: 'Addis Ketema' },
  'abebe bikila':          { region: 'Addis Ababa', city: 'Addis Ketema' },
  'youth & sports academy':{ region: 'Addis Ababa', city: 'Addis Ketema' },
  'sports academy':        { region: 'Addis Ababa', city: 'Addis Ketema' },
  'saris':                 { region: 'Addis Ababa', city: 'Kirkos' },
  'kera':                  { region: 'Addis Ababa', city: 'Kirkos' },
  'gotera':                { region: 'Addis Ababa', city: 'Kirkos' },
  'sarbet':                { region: 'Addis Ababa', city: 'Kirkos' },
  'bob marley':            { region: 'Addis Ababa', city: 'Kirkos' },
  'imperial square':       { region: 'Addis Ababa', city: 'Kirkos' },
  'grand palace hotel':    { region: 'Addis Ababa', city: 'Kirkos' },
  'grand palace':          { region: 'Addis Ababa', city: 'Kirkos' },
  'golden tulip':          { region: 'Addis Ababa', city: 'Bole' },
  'getfam hotel':          { region: 'Addis Ababa', city: 'Kirkos' },
  'elilly hotel':          { region: 'Addis Ababa', city: 'Bole' },
  'friendship park':       { region: 'Addis Ababa', city: 'Bole' },
  'addis ababa':           { region: 'Addis Ababa', city: 'Addis Ababa' },
  'red terror museum':     { region: 'Addis Ababa', city: 'Kirkos' },
  'red terror':            { region: 'Addis Ababa', city: 'Kirkos' },
  'holy trinity cathedral':{ region: 'Addis Ababa', city: 'Kirkos' },
  'st. george cathedral':  { region: 'Addis Ababa', city: 'Addis Ketema' },
  'africa hall':           { region: 'Addis Ababa', city: 'Kirkos' },
  'unity park':            { region: 'Addis Ababa', city: 'Kirkos' },
  'millennium hall':       { region: 'Addis Ababa', city: 'Bole' },
  'african union':         { region: 'Addis Ababa', city: 'Kirkos' },
  'atlas hotel':           { region: 'Addis Ababa', city: 'Bole' },
  'skylight':              { region: 'Addis Ababa', city: 'Bole' },
  'kazanchis':             { region: 'Addis Ababa', city: 'Kirkos' },
  'mexico square':         { region: 'Addis Ababa', city: 'Lideta' },
  'lideta':                { region: 'Addis Ababa', city: 'Lideta' },
  'arada':                 { region: 'Addis Ababa', city: 'Arada' },
  'shiro meda':            { region: 'Addis Ababa', city: 'Gulale' },
  'italian occupation':    { region: 'Addis Ababa', city: 'Gulale' },
  'zipline':               { region: 'Addis Ababa', city: 'Gulale' },  // Entoto zipline
  'rope course':           { region: 'Addis Ababa', city: 'Gulale' },
  'planetarium':           { region: 'Addis Ababa', city: 'Gulale' },
  'entoto planetarium':    { region: 'Addis Ababa', city: 'Gulale' },
  'nefas silk':            { region: 'Addis Ababa', city: 'Nefas Silk' },
  'churchill avenue':      { region: 'Addis Ababa', city: 'Kirkos' },
  'churchill':             { region: 'Addis Ababa', city: 'Kirkos' },
  'radisson blu':          { region: 'Addis Ababa', city: 'Kirkos' },
  'radisson':              { region: 'Addis Ababa', city: 'Kirkos' },
  'harmony hotel':         { region: 'Addis Ababa', city: 'Bole' },
  'best western':          { region: 'Addis Ababa', city: 'Bole' },
  'habesha 2000':          { region: 'Addis Ababa', city: 'Bole' },
  'habesha-2000':          { region: 'Addis Ababa', city: 'Bole' },
  'century mall':          { region: 'Addis Ababa', city: 'Kirkos' },
  'century-mall':          { region: 'Addis Ababa', city: 'Kirkos' },
  'posta bet':             { region: 'Addis Ababa', city: 'Addis Ketema' },
  'posta-bet':             { region: 'Addis Ababa', city: 'Addis Ketema' },
  'menelik hospital':      { region: 'Addis Ababa', city: 'Addis Ketema' },
  'menelik ii':            { region: 'Addis Ababa', city: 'Addis Ketema' },
  'menelik':               { region: 'Addis Ababa', city: 'Addis Ketema' },
  'bete maryam':           { region: 'Addis Ababa', city: 'Kirkos' },
  'bete-maryam':           { region: 'Addis Ababa', city: 'Kirkos' },
  'abebech gobena':        { region: 'Addis Ababa', city: 'Bole' },
  'abebech-gobena':        { region: 'Addis Ababa', city: 'Bole' },
  'gullele botanic':       { region: 'Addis Ababa', city: 'Gulale' },
  'gullele':               { region: 'Addis Ababa', city: 'Gulale' },
  'teferra':               { region: 'Addis Ababa', city: 'Bole' },
  'cardiac clinic':        { region: 'Addis Ababa', city: 'Bole' },
  'downtown':              { region: 'Addis Ababa', city: 'Kirkos' },
  'project ethiopia':      { region: 'Addis Ababa', city: 'Addis Ababa' },
  'nyala':                 { region: 'Addis Ababa', city: 'Kirkos' },
  'nyala-club':            { region: 'Addis Ababa', city: 'Kirkos' },
  'st george':             { region: 'Addis Ababa', city: 'Addis Ketema' },
  'st-george':             { region: 'Addis Ababa', city: 'Addis Ketema' },
  'saint george':          { region: 'Addis Ababa', city: 'Addis Ketema' },
  'st. pauls':             { region: 'Addis Ababa', city: 'Addis Ketema' },
  'st-pauls':              { region: 'Addis Ababa', city: 'Addis Ketema' },
  'alem bekagn':           { region: 'Addis Ababa', city: 'Kirkos' },
  'alem-bekagn':           { region: 'Addis Ababa', city: 'Kirkos' },
  'yeka mikael':           { region: 'Addis Ababa', city: 'Yeka' },
  'yeka-mikael':           { region: 'Addis Ababa', city: 'Yeka' },
  'haile grand':           { region: 'Addis Ababa', city: 'Bole' },
  'haile-grand':           { region: 'Addis Ababa', city: 'Bole' },
  'bole brass':            { region: 'Addis Ababa', city: 'Bole' },
  'bole-brass':            { region: 'Addis Ababa', city: 'Bole' },
  'bole ambassader':       { region: 'Addis Ababa', city: 'Bole' },
  'bole fawkner':          { region: 'Addis Ababa', city: 'Bole' },
  'ethio-american':        { region: 'Addis Ababa', city: 'Bole' },
  'megenagna':             { region: 'Addis Ababa', city: 'Yeka' },
  'meganagna':             { region: 'Addis Ababa', city: 'Yeka' },
  'zoological museum':     { region: 'Addis Ababa', city: 'Gulale' },
  'zoological-museum':     { region: 'Addis Ababa', city: 'Gulale' },
  'aau-science':           { region: 'Addis Ababa', city: 'Gulale' },
  'cardiovascular hospital':{ region: 'Addis Ababa', city: 'Kirkos' },
  'cardiology':            { region: 'Addis Ababa', city: 'Kirkos' },

  // ═══════════════════════════════════════════════════════════
  // OROMIA
  // ═══════════════════════════════════════════════════════════
  'bishoftu':         { region: 'Oromia', city: 'Bishoftu' },
  'debre zeit':       { region: 'Oromia', city: 'Bishoftu' },
  'lake hora':        { region: 'Oromia', city: 'Bishoftu' },
  'lake babogaya':    { region: 'Oromia', city: 'Bishoftu' },
  'babogaya':         { region: 'Oromia', city: 'Bishoftu' },
  'lake kilole':      { region: 'Oromia', city: 'Bishoftu' },
  'kilole':           { region: 'Oromia', city: 'Bishoftu' },
  'kuriftu':          { region: 'Oromia', city: 'Bishoftu' },
  'pyramids resort':  { region: 'Oromia', city: 'Bishoftu' },
  'debre libanos':    { region: 'Oromia', city: 'Debre Libanos' },
  'tekle haymanot':   { region: 'Oromia', city: 'Debre Libanos' },
  'sululta':          { region: 'Oromia', city: 'Sululta' },
  'yaya':             { region: 'Oromia', city: 'Sululta' },
  'sendafa':          { region: 'Oromia', city: 'Sendafa' },
  'jimma':            { region: 'Oromia', city: 'Jimma' },
  'jimma university': { region: 'Oromia', city: 'Jimma' },
  'limmu':            { region: 'Oromia', city: 'Jimma' },
  'adama':            { region: 'Oromia', city: 'Adama' },
  'nazret':           { region: 'Oromia', city: 'Adama' },
  'sodere':           { region: 'Oromia', city: 'Sodere' },
  'ambo':             { region: 'Oromia', city: 'Ambo' },
  'ambo university':  { region: 'Oromia', city: 'Ambo' },
  'wenchi':           { region: 'Oromia', city: 'Wenchi' },
  'wenchi crater':    { region: 'Oromia', city: 'Wenchi' },
  'loleha':           { region: 'Oromia', city: 'Wenchi' },
  'waliso':           { region: 'Oromia', city: 'Waliso' },
  'negash lodge':     { region: 'Oromia', city: 'Waliso' },
  'asella':           { region: 'Oromia', city: 'Asella' },
  'asela':            { region: 'Oromia', city: 'Asella' },
  'mount chilalo':    { region: 'Oromia', city: 'Asella' },
  'chilalo':          { region: 'Oromia', city: 'Asella' },
  'bekoji':           { region: 'Oromia', city: 'Bekoji' },
  'kenenisa':         { region: 'Oromia', city: 'Bekoji' },
  'langano':          { region: 'Oromia', city: 'Langano' },
  'lake langano':     { region: 'Oromia', city: 'Langano' },
  'sabana beach':     { region: 'Oromia', city: 'Arsi Negelle' },
  'bishangari':       { region: 'Oromia', city: 'Langano' },
  'arsi negelle':     { region: 'Oromia', city: 'Arsi Negelle' },
  'tiya':             { region: 'Oromia', city: 'Tiya' },
  'senkele':          { region: 'Oromia', city: 'Wajira Hudo' },
  'hartebeest':       { region: 'Oromia', city: 'Wajira Hudo' },
  'yabello':          { region: 'Oromia', city: 'Yabēlo' },
  'yabelo':           { region: 'Oromia', city: 'Yabēlo' },
  'borena':           { region: 'Oromia', city: 'Yabēlo' },
  'moyale':           { region: 'Oromia', city: 'Moyale' },
  'gore':             { region: 'Oromia', city: 'Gore' },
  'metu':             { region: 'Oromia', city: 'Metu' },
  'nekemte':          { region: 'Oromia', city: 'Nekemte' },
  'bedele':           { region: 'Oromia', city: 'Bedele' },
  'fincha':           { region: 'Oromia', city: "Finicha'a" },
  'metahara':         { region: 'Oromia', city: 'Metehara' },
  'awash':            { region: 'Oromia', city: 'Awash' },  // Awash town (Oromia side)
  'lake ziway':       { region: 'Oromia', city: 'East Shewa' },
  'ziway':            { region: 'Oromia', city: 'East Shewa' },
  'sheik hussein':    { region: 'Oromia', city: 'Sheik Hussein' },
  'sheikh hussein':   { region: 'Oromia', city: 'Sheik Hussein' },
  'sof omar':         { region: 'Oromia', city: 'Sof Omar' },
  'mount zuqualla':   { region: 'Oromia', city: 'Dendi' },
  'zuqualla':         { region: 'Oromia', city: 'Dendi' },
  'menagesha':        { region: 'Oromia', city: 'Menagesha' },
  'jibat':            { region: 'Oromia', city: 'Jibat' },
  'dinsho':           { region: 'Oromia', city: 'Dinsho' },
  'goba':             { region: 'Oromia', city: 'Goba' },
  'bale mountains':   { region: 'Oromia', city: 'Dinsho' },
  'bale mountain':    { region: 'Oromia', city: 'Dinsho' },
  'sanetti':          { region: 'Oromia', city: 'Dinsho' },
  'harenna':          { region: 'Oromia', city: 'Dinsho' },
  'fentale':          { region: 'Oromia', city: 'Metehara' },
  'mount fentale':    { region: 'Oromia', city: 'Metehara' },
  'shashemene':       { region: 'Oromia', city: 'Shashemene' },
  'shakiso':          { region: 'Oromia', city: 'Shakiso' },
  'guji':             { region: 'Oromia', city: 'Shakiso' },
  'lake abijatta':    { region: 'Oromia', city: 'Arsi Negelle' },
  'abijatta':         { region: 'Oromia', city: 'Arsi Negelle' },
  'lake shalla':      { region: 'Oromia', city: 'Arsi Negelle' },
  'shalla':           { region: 'Oromia', city: 'Arsi Negelle' },
  'abijatta-shalla':  { region: 'Oromia', city: 'Arsi Negelle' },
  'tulu moye':        { region: 'Oromia', city: 'Arsi Negelle' },
  'melka wakena':     { region: 'Oromia', city: 'Bale' },
  'melka awash':      { region: 'Oromia', city: 'Melka Awash' },
  'melka kunture':    { region: 'Oromia', city: 'Melka Awash' },
  'sor waterfall':    { region: 'Oromia', city: 'Metu' },
  'sor river':        { region: 'Oromia', city: 'Metu' },
  'gibe sheleko':     { region: 'Oromia', city: 'Jimma' },
  'gibe':             { region: 'Oromia', city: 'Jimma' },
  'yayu':             { region: 'Oromia', city: 'Yayu' },
  'suba forest':      { region: 'Oromia', city: 'Walmara' },
  'walmara':          { region: 'Oromia', city: 'Walmara' },
  'rift valley':      { region: 'Oromia', city: 'Arsi Negelle' },
  'great rift':       { region: 'Oromia', city: 'Arsi Negelle' },
  'debre zeit':       { region: 'Oromia', city: 'Bishoftu' },
  'grand royal hotel':{ region: 'Oromia', city: 'Bishoftu' },
  'grand royal':      { region: 'Oromia', city: 'Bishoftu' },
  'gura dhamole':     { region: 'Oromia', city: 'Bale' },
  'holeta':            { region: 'Oromia', city: 'Holeta' },
  'wolisso':           { region: 'Oromia', city: 'Waliso' },
  'woliso':            { region: 'Oromia', city: 'Waliso' },
  'wonchi':            { region: 'Oromia', city: 'Wenchi' },
  'lake besaka':       { region: 'Oromia', city: 'Metehara' },
  'besaka':            { region: 'Oromia', city: 'Metehara' },
  'fantale':           { region: 'Oromia', city: 'Metehara' },
  'embabo':            { region: 'Oromia', city: 'Gore' },
  'wollega':           { region: 'Oromia', city: 'Nekemte' },
  'gatira':            { region: 'Oromia', city: 'Asella' },
  'nekemte':           { region: 'Oromia', city: 'Nekemte' },
  'nigat lake':        { region: 'Oromia', city: 'Nekemte' },
  'nigat-lake':        { region: 'Oromia', city: 'Nekemte' },
  'haromaya':          { region: 'Oromia', city: 'Haromaya' },
  'arsi':              { region: 'Oromia', city: 'Asella' },
  'koka':              { region: 'Oromia', city: 'Adama' },
  'koka dam':          { region: 'Oromia', city: 'Adama' },
  'koka-dam':          { region: 'Oromia', city: 'Adama' },
  'karrayyu':          { region: 'Oromia', city: 'Metehara' },
  'east-shewa':        { region: 'Oromia', city: 'Adama' },
  'dera denboli':      { region: 'Oromia', city: 'Bishoftu' },
  'liben-plains':      { region: 'Oromia', city: 'Yabēlo' },
  'liben plains':      { region: 'Oromia', city: 'Yabēlo' },
  'tulu-moye':         { region: 'Oromia', city: 'Arsi Negelle' },
  'wonji':             { region: 'Oromia', city: 'Adama' },
  'wonji-shoa':        { region: 'Oromia', city: 'Adama' },
  'tulu lafto':        { region: 'Oromia', city: 'Jimma' },
  'tulu-lafto':        { region: 'Oromia', city: 'Jimma' },
  'haramaya':          { region: 'Oromia', city: 'Haromaya' },
  'bate':              { region: 'Oromia', city: 'Haromaya' },

  // ═══════════════════════════════════════════════════════════
  // AMHARA
  // ═══════════════════════════════════════════════════════════
  'lalibela':           { region: 'Amhara', city: 'Lalibela' },
  'yemrehanna kristos': { region: 'Amhara', city: 'Lalibela' },
  'yemrehanna-kristos': { region: 'Amhara', city: 'Lalibela' },
  'yemrehanna':         { region: 'Amhara', city: 'Lalibela' },
  'gondar':             { region: 'Amhara', city: 'Gondar' },
  'gonder':             { region: 'Amhara', city: 'Gonder' },
  'fasil':              { region: 'Amhara', city: 'Gonder' },
  'fasiladas':          { region: 'Amhara', city: 'Gonder' },
  'bahir dar':          { region: 'Amhara', city: 'Bahir Dar' },
  'blue nile falls':    { region: 'Amhara', city: 'Tis Abay' },
  'tis abay':           { region: 'Amhara', city: 'Tis Abay' },
  'tis issat':          { region: 'Amhara', city: 'Tis Abay' },
  'lake tana':          { region: 'Amhara', city: 'Bahir Dar Special Zone' },
  'tana qirqos':        { region: 'Amhara', city: 'Bahir Dar Special Zone' },
  'zegie':              { region: 'Amhara', city: 'Bahir Dar Special Zone' },
  'dek island':         { region: 'Amhara', city: 'Bahir Dar Special Zone' },
  'gorgora':            { region: 'Amhara', city: 'Gorgora' },
  'dessie':             { region: 'Amhara', city: 'Dessie' },
  'kombolcha':          { region: 'Amhara', city: 'Kombolcha' },
  'combolcha':          { region: 'Amhara', city: 'Kombolcha' },
  'ankober':            { region: 'Amhara', city: 'Ankober' },
  'debre birhan':       { region: 'Amhara', city: 'Debre Birhan' },
  'debre markos':       { region: 'Amhara', city: 'Debre Markos' },
  'debre marqos':       { region: 'Amhara', city: 'Debre Markos' },
  'debre tabor':        { region: 'Amhara', city: 'Debre Tabor' },
  'woldiya':            { region: 'Amhara', city: 'Woldia' },
  'woldia':             { region: 'Amhara', city: 'Woldia' },
  'hayq':               { region: 'Amhara', city: 'Hayq' },
  'lake hayq':          { region: 'Amhara', city: 'Hayq' },
  'simien':             { region: 'Amhara', city: 'Debark' },
  'simien mountains':   { region: 'Amhara', city: 'Debark' },
  'ras dashen':         { region: 'Amhara', city: 'Debark' },
  'debark':             { region: 'Amhara', city: 'Debark' },
  'limalimo':           { region: 'Amhara', city: 'Debark' },
  'choke mountain':     { region: 'Amhara', city: 'Debre Markos' },
  'choke':              { region: 'Amhara', city: 'Debre Markos' },
  'menz':               { region: 'Amhara', city: 'North Shewa' },
  'guassa':             { region: 'Amhara', city: 'North Shewa' },
  'menz guassa':        { region: 'Amhara', city: 'North Shewa' },
  'mount abuye':        { region: 'Amhara', city: 'North Shewa' },
  'abuye meda':         { region: 'Amhara', city: 'North Shewa' },
  'gishen':             { region: 'Amhara', city: 'Wollo' },
  'gishen debre':       { region: 'Amhara', city: 'Wollo' },
  'injibara':           { region: 'Amhara', city: 'Injibara' },
  'awi':                { region: 'Amhara', city: 'Injibara' },
  'agew':               { region: 'Amhara', city: 'Injibara' },
  'bati':               { region: 'Amhara', city: 'Bati' },
  'enferaz':            { region: 'Amhara', city: 'Enferaz' },
  'gojjam':             { region: 'Amhara', city: 'Debre Markos' },
  'alatish':            { region: 'Amhara', city: 'Alatish' },
  'tekeze':             { region: 'Amhara', city: 'Tekeze' },
  'sekota':             { region: 'Amhara', city: 'Sekota' },
  'zeret':              { region: 'Amhara', city: 'Dessie' },
  'zeret cave':         { region: 'Amhara', city: 'Dessie' },
  'dahana':             { region: 'Amhara', city: 'Dahana' },
  'adet':               { region: 'Amhara', city: 'Adet' },
  'sebatamit':          { region: 'Amhara', city: 'Sebatamit' },
  'mount guna':          { region: 'Amhara', city: 'Debre Tabor' },
  'guna':                { region: 'Amhara', city: 'Debre Tabor' },
  'magdala':             { region: 'Amhara', city: 'Dessie' },
  'tewodros':            { region: 'Amhara', city: 'Dessie' },
  'tewodros-ii':         { region: 'Amhara', city: 'Dessie' },
  'blue nile gorge':     { region: 'Amhara', city: 'Debre Markos' },
  'blue nile':           { region: 'Amhara', city: 'Debre Markos' },
  'weyto':               { region: 'Amhara', city: 'Bahir Dar Special Zone' },
  'grand resort':        { region: 'Amhara', city: 'Bahir Dar' },
  'grand-resort':        { region: 'Amhara', city: 'Bahir Dar' },
  'dega estifanos':      { region: 'Amhara', city: 'Bahir Dar Special Zone' },
  'dega-estifanos':      { region: 'Amhara', city: 'Bahir Dar Special Zone' },
  'lake ardibo':         { region: 'Amhara', city: 'Dessie' },
  'ardibo':              { region: 'Amhara', city: 'Dessie' },
  'guge mountain':       { region: 'Amhara', city: 'Debre Tabor' },
  'guge-mountain':       { region: 'Amhara', city: 'Debre Tabor' },
  'anchem':              { region: 'Amhara', city: 'Ankober' },
  'dogali':              { region: 'Amhara', city: 'Dessie' },  // Dogali memorial in Ethiopia

  // ═══════════════════════════════════════════════════════════
  // TIGRAY
  // ═══════════════════════════════════════════════════════════
  'mekelle':          { region: 'Tigray', city: "Mek'elē" },
  'mekele':           { region: 'Tigray', city: "Mek'elē" },
  "mek'ele":          { region: 'Tigray', city: "Mek'elē" },
  'degua tembien':    { region: 'Tigray', city: 'Halah Gheralta' },
  'degua-tembien':    { region: 'Tigray', city: 'Halah Gheralta' },
  'tembien':          { region: 'Tigray', city: 'Halah Gheralta' },
  'kahtasa':          { region: 'Tigray', city: 'Halah Gheralta' },
  'korem':            { region: 'Tigray', city: 'Alamata' },
  'maichew':          { region: 'Tigray', city: 'Alamata' },
  'debre bizen':      { region: 'Tigray', city: 'Axum' },
  'gura battlefield': { region: 'Tigray', city: 'Adwa' },
  'gura':             { region: 'Tigray', city: 'Adwa' },  // Battle of Gura was near Adwa
  'axum':             { region: 'Tigray', city: 'Axum' },
  'aksum':            { region: 'Tigray', city: 'Axum' },
  'yeha':             { region: 'Tigray', city: 'Yeha' },
  'gheralta':         { region: 'Tigray', city: 'Halah Gheralta' },
  'hawzen':           { region: 'Tigray', city: 'Hawzen' },
  'wukro':            { region: 'Tigray', city: 'Wukro' },
  'adwa':             { region: 'Tigray', city: 'Adwa' },
  'debre damo':       { region: 'Tigray', city: 'Debre Damo' },
  'abuna yemata':     { region: 'Tigray', city: 'Halah Gheralta' },
  'al-nejashi':       { region: 'Tigray', city: 'Felegsha' },
  'negash':           { region: 'Tigray', city: 'Felegsha' },
  'humera':           { region: 'Tigray', city: 'Humera' },
  'alamata':          { region: 'Tigray', city: 'Alamata' },
  'lake ashenge':     { region: 'Tigray', city: 'Hashenge' },
  'ashenge':          { region: 'Tigray', city: 'Hashenge' },
  'petros and paulos':{ region: 'Tigray', city: 'Gheralta' },

  // ═══════════════════════════════════════════════════════════
  // AFAR
  // ═══════════════════════════════════════════════════════════
  'danakil':          { region: 'Afar', city: 'Dallol' },
  'dallol':           { region: 'Afar', city: 'Dallol' },
  'erta ale':         { region: 'Afar', city: 'Dallol' },
  'lake abbe':        { region: 'Afar', city: 'Asaita' },
  'semera':           { region: 'Afar', city: 'Semera' },
  'asaita':           { region: 'Afar', city: 'Asaita' },
  'tendaho':          { region: 'Afar', city: 'Tendaho' },
  'doho lodge':       { region: 'Afar', city: 'Awash' },
  'doho':             { region: 'Afar', city: 'Awash' },
  'yangudi rassa':    { region: 'Afar', city: 'Semera' },
  'yangudi':          { region: 'Afar', city: 'Semera' },
  'argobba':          { region: 'Afar', city: 'Semera' },
  'raya azebo':       { region: 'Afar', city: 'Semera' },
  'assab':            { region: 'Afar', city: 'Semera' },
  'assab road':       { region: 'Afar', city: 'Semera' },
  'mount ayalu':      { region: 'Afar', city: 'Semera' },
  'ayalu':            { region: 'Afar', city: 'Semera' },
  'melabday':         { region: 'Afar', city: 'Melabday' },
  'ledi-geraru':      { region: 'Afar', city: 'Semera' },
  'ledi geraru':      { region: 'Afar', city: 'Semera' },
  'hamedela':         { region: 'Afar', city: 'Dallol' },
  'hamadela':         { region: 'Afar', city: 'Dallol' },
  'ahmed ela':        { region: 'Afar', city: 'Dallol' },
  'woranso-mille':    { region: 'Afar', city: 'Semera' },
  'woranso':          { region: 'Afar', city: 'Semera' },
  'chorora':          { region: 'Afar', city: 'Semera' },
  'logipi':           { region: 'Afar', city: 'Semera' },
  'gona':             { region: 'Afar', city: 'Semera' },
  'dikika':           { region: 'Afar', city: 'Semera' },

  // ═══════════════════════════════════════════════════════════
  // SIDAMA
  // ═══════════════════════════════════════════════════════════
  'hawassa':          { region: 'Sidama', city: 'Hawassa' },
  'awassa':           { region: 'Sidama', city: 'Hawassa' },
  'wondo genet':      { region: 'Sidama', city: 'Wondo Genet' },
  'lewi resort':      { region: 'Sidama', city: 'Hawassa' },
  'haile resort hawassa': { region: 'Sidama', city: 'Hawassa' },
  'lake hawassa':     { region: 'Sidama', city: 'Hawassa' },
  'irgalem':          { region: 'Sidama', city: 'Irgalem' },
  'aleta wendo':      { region: 'Sidama', city: 'Aleta Wendo' },
  'gidabo':           { region: 'Sidama', city: 'Hawassa' },
  'leku':             { region: 'Sidama', city: 'Hawassa' },
  'sidama':           { region: 'Sidama', city: 'Hawassa' },
  'yirga alem':       { region: 'Sidama', city: 'Hawassa' },

  // ═══════════════════════════════════════════════════════════
  // SOUTH ETHIOPIA REGIONAL STATE (former SNNPR south)
  // ═══════════════════════════════════════════════════════════
  'karo village':     { region: 'South Ethiopia Regional State', city: 'Omorate' },
  'korcho':            { region: 'South Ethiopia Regional State', city: 'Omorate' },
  'karo':              { region: 'South Ethiopia Regional State', city: 'Omorate' },
  'arba minch':       { region: 'South Ethiopia Regional State', city: 'Arba Minch' },
  'nechisar':         { region: 'South Ethiopia Regional State', city: 'Arba Minch' },
  'lake chamo':       { region: 'South Ethiopia Regional State', city: 'Arba Minch' },
  'chamo':            { region: 'South Ethiopia Regional State', city: 'Arba Minch' },
  'dorze':            { region: 'South Ethiopia Regional State', city: 'Dorze' },
  'chencha':          { region: 'South Ethiopia Regional State', city: 'Chencha' },
  'halala kella':     { region: 'South Ethiopia Regional State', city: 'Kindo Koysha' },
  'koysha':           { region: 'South Ethiopia Regional State', city: 'Kindo Koysha' },
  'kindo koysha':     { region: 'South Ethiopia Regional State', city: 'Kindo Koysha' },
  'jinka':            { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'south omo':        { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'south-omo':        { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'turmi':            { region: 'South Ethiopia Regional State', city: 'Turmi' },
  'hamer':            { region: 'South Ethiopia Regional State', city: 'Turmi' },
  'dimeka':           { region: 'South Ethiopia Regional State', city: 'Dimeka' },
  'key afer':         { region: 'South Ethiopia Regional State', city: 'Keyafer' },
  'key-afer':         { region: 'South Ethiopia Regional State', city: 'Keyafer' },
  'arbore':           { region: 'South Ethiopia Regional State', city: 'Arbore' },
  'omorate':          { region: 'South Ethiopia Regional State', city: 'Omorate' },
  'dassanech':        { region: 'South Ethiopia Regional State', city: 'Omorate' },
  'konso':            { region: 'South Ethiopia Regional State', city: 'Konso' },
  'maze':             { region: 'South Ethiopia Regional State', city: 'Sawla' },
  'maze national':    { region: 'South Ethiopia Regional State', city: 'Sawla' },
  'mago':             { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'mago national':    { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'mursi':            { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'wolayta sodo':     { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'wolayta':          { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'sodo':             { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'damota':           { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'mount damota':     { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'yirga cheffe':     { region: 'South Ethiopia Regional State', city: 'Yirga Cheffe' },
  'yirgacheffe':      { region: 'South Ethiopia Regional State', city: 'Yirga Cheffe' },
  'gedeo':            { region: 'South Ethiopia Regional State', city: 'Yirga Cheffe' },
  'gidole':           { region: 'South Ethiopia Regional State', city: 'Gidole' },
  'gofa':             { region: 'South Ethiopia Regional State', city: 'Sawla' },
  'sawla':            { region: 'South Ethiopia Regional State', city: 'Sawla' },
  'omo valley':       { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'lower omo':        { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'omo national':     { region: 'South Ethiopia Regional State', city: 'Jinka' },
  'tut fela':         { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'tut-fela':         { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'paradise lodge':   { region: 'South Ethiopia Regional State', city: 'Arba Minch' },
  'lake abaya':       { region: 'South Ethiopia Regional State', city: 'Arba Minch' },
  'lake-abaya':       { region: 'South Ethiopia Regional State', city: 'Arba Minch' },
  'chew bahir':       { region: 'South Ethiopia Regional State', city: 'Konso' },
  'chew-bahir':       { region: 'South Ethiopia Regional State', city: 'Konso' },
  'nyangatom':        { region: 'South Ethiopia Regional State', city: 'Omorate' },
  'kibish':           { region: 'South Ethiopia Regional State', city: 'Omorate' },
  'chelba tutiti':    { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'chelba-tutiti':    { region: 'South Ethiopia Regional State', city: 'Wolaita Sodo' },
  'lake boyo':        { region: 'South Ethiopia Regional State', city: 'Sawla' },
  'boyo':             { region: 'South Ethiopia Regional State', city: 'Sawla' },
  'yem':              { region: 'South Ethiopia Regional State', city: 'Sawla' },
  'sagan':            { region: 'South Ethiopia Regional State', city: 'Konso' },
  'sagan river':      { region: 'South Ethiopia Regional State', city: 'Konso' },

  // ═══════════════════════════════════════════════════════════
  // SOUTH WEST ETHIOPIA PEOPLES (former SNNPR west)
  // ═══════════════════════════════════════════════════════════
  'bonga':            { region: 'South West Ethiopia Peoples', city: 'Bonga' },
  'kafa':             { region: 'South West Ethiopia Peoples', city: 'Bonga' },
  'kafa biosphere':   { region: 'South West Ethiopia Peoples', city: 'Bonga' },
  'bebeka':           { region: 'South West Ethiopia Peoples', city: 'Mizan Aman' },
  'gura ferda':       { region: 'South West Ethiopia Peoples', city: 'Mizan Aman' },
  'gura-ferda':       { region: 'South West Ethiopia Peoples', city: 'Mizan Aman' },
  'suri':             { region: 'South West Ethiopia Peoples', city: 'Mizan Aman' },
  'bodi':             { region: 'South West Ethiopia Peoples', city: 'Mizan Aman' },
  'bench maji':       { region: 'South West Ethiopia Peoples', city: 'Mizan Aman' },
  'mizan':            { region: 'South West Ethiopia Peoples', city: 'Mizan Aman' },
  'mizan teferi':     { region: 'South West Ethiopia Peoples', city: 'Mizan Aman' },
  'sheka':            { region: 'South West Ethiopia Peoples', city: 'Masha' },
  'masha':            { region: 'South West Ethiopia Peoples', city: 'Masha' },
  'teppi':            { region: 'South West Ethiopia Peoples', city: 'Teppi' },
  'tepi':             { region: 'South West Ethiopia Peoples', city: 'Teppi' },
  'wushwush':         { region: 'South West Ethiopia Peoples', city: 'Wushwush' },
  'chebera churchura':{ region: 'South West Ethiopia Peoples', city: 'Bonga' },
  'chebera':          { region: 'South West Ethiopia Peoples', city: 'Bonga' },
  'dembi waterfall':  { region: 'South West Ethiopia Peoples', city: 'Bonga' },

  // ═══════════════════════════════════════════════════════════
  // CENTRAL ETHIOPIA REGIONAL STATE (former SNNPR central zones)
  // ═══════════════════════════════════════════════════════════
  'kambaata':         { region: 'Central Ethiopia Regional State', city: 'Durame' },
  'kambata':          { region: 'Central Ethiopia Regional State', city: 'Durame' },
  'durame':           { region: 'Central Ethiopia Regional State', city: 'Durame' },
  'silte':            { region: 'Central Ethiopia Regional State', city: 'Worabe' },
  'worabe':           { region: 'Central Ethiopia Regional State', city: 'Worabe' },
  'welkite':          { region: 'Central Ethiopia Regional State', city: 'Welkite' },
  'gurage':           { region: 'Central Ethiopia Regional State', city: 'Welkite' },
  'hadiya':           { region: 'Central Ethiopia Regional State', city: 'Hosaina' },
  'hosaina':          { region: 'Central Ethiopia Regional State', city: 'Hosaina' },
  'hossaena':         { region: 'Central Ethiopia Regional State', city: 'Hosaina' },

  // ═══════════════════════════════════════════════════════════
  // GAMBELA
  // ═══════════════════════════════════════════════════════════
  'gambela':          { region: 'Gambela', city: 'Gambela' },
  'gambella':         { region: 'Gambela', city: 'Gambela' },
  'anuak':            { region: 'Gambela', city: 'Gambela' },
  'nuer':             { region: 'Gambela', city: 'Gambela' },

  // ═══════════════════════════════════════════════════════════
  // BENISHANGUL-GUMUZ
  // ═══════════════════════════════════════════════════════════
  'assosa':           { region: 'Benishangul-Gumuz', city: 'Assosa' },
  'benishangul':      { region: 'Benishangul-Gumuz', city: 'Assosa' },
  'gumuz':            { region: 'Benishangul-Gumuz', city: 'Assosa' },
  'mount belaya':     { region: 'Benishangul-Gumuz', city: 'Assosa' },
  'belaya':           { region: 'Benishangul-Gumuz', city: 'Assosa' },
  'dati wolel':       { region: 'Benishangul-Gumuz', city: 'Assosa' },
  'dati-wolel':       { region: 'Benishangul-Gumuz', city: 'Assosa' },
  'metekel':          { region: 'Benishangul-Gumuz', city: 'Assosa' },

  // ═══════════════════════════════════════════════════════════
  // DIRE DAWA
  // ═══════════════════════════════════════════════════════════
  'dire dawa':        { region: 'Dire Dawa', city: 'Dire Dawa' },
  'dil chora':        { region: 'Dire Dawa', city: 'Dire Dawa' },
  'dire-dawa':        { region: 'Dire Dawa', city: 'Dire Dawa' },

  // ═══════════════════════════════════════════════════════════
  // HARAR / HARARI
  // ═══════════════════════════════════════════════════════════
  'harar':            { region: 'Harar', city: 'Harar' },
  'harari':           { region: 'Harar', city: 'Harar' },
  'jugol':            { region: 'Harar', city: 'Harar' },
  'hyena feeding':    { region: 'Harar', city: 'Harar' },
  'hyena man':        { region: 'Harar', city: 'Harar' },
  'kundudo':          { region: 'Harar', city: 'Harar' },
  'mount kundudo':    { region: 'Harar', city: 'Harar' },
  'hararghe':         { region: 'Harar', city: 'Harar' },
  'beynuna':          { region: 'Harar', city: 'Harar' },

  // ═══════════════════════════════════════════════════════════
  // SOMALI
  // ═══════════════════════════════════════════════════════════
  'jijiga':           { region: 'Somali', city: 'Jijiga' },
  'geralle':          { region: 'Somali', city: 'Jijiga' },
  'babile':           { region: 'Somali', city: 'Jijiga' },

  // ═══════════════════════════════════════════════════════════
  // AWASH NATIONAL PARK (spans Oromia/Afar border — using Oromia convention)
  // ═══════════════════════════════════════════════════════════
  'awash national':   { region: 'Oromia', city: 'Awash' },
  'awash falls':      { region: 'Oromia', city: 'Awash' },
};

// ─── City lookup for missing-city-only destinations ──────────────────────────
// Maps known region + keywords → city
const REGION_CITY_LOOKUP = {
  'Oromia': {
    'langano':        'Langano',
    'bale':           'Dinsho',
    'bale-mountains': 'Dinsho',
    'bale mountains': 'Dinsho',
    'sanetti':        'Dinsho',
    'harenna':        'Dinsho',
    'bale-mountain':  'Dinsho',
    'dinsho':         'Dinsho',
    'shashemene':     'Shashemene',
    'abijatta':       'Arsi Negelle',
    'shalla':         'Arsi Negelle',
    'rift-valley':    'Arsi Negelle',
    'rift valley':    'Arsi Negelle',
    'bishangari':     'Langano',
    'fentale':        'Metehara',
    'melka-wakena':   'Bale',
    'zuqualla':       'Dendi',
    'choke':          'Debre Markos',
    'gerbi':          'Bishoftu',
    'tulu-moye':      'Arsi Negelle',
    'tulu moye':      'Arsi Negelle',
    'geothermal':     'Arsi Negelle',
    'limmu':          'Jimma',
    'jimma':          'Jimma',
    'gibe':           'Jimma',
    'gibe-sheleko':   'Jimma',
    'sor-waterfall':  'Metu',
    'sor waterfall':  'Metu',
    'illubabor':      'Metu',
    'overland':       'Arsi Negelle',
    'paragliding':    'Arsi Negelle',
    'watersports':    'Langano',
    'windsurfing':    'Langano',
    'sabana':         'Langano',
    'awash':          'Awash',
  },
  'Amhara': {
    'simien':          'Debark',
    'simien-mountains':'Debark',
    'simien mountains':'Debark',
    'ras-dashen':      'Debark',
    'ras dashen':      'Debark',
    'debark':          'Debark',
    'jinbar':          'Debark',
    'jinbar-waterfall':'Debark',
    'lake-tana':       'Bahir Dar Special Zone',
    'lake tana':       'Bahir Dar Special Zone',
    'tana-qirqos':     'Bahir Dar Special Zone',
    'bahir-dar':       'Bahir Dar Special Zone',
    'bahir dar':       'Bahir Dar Special Zone',
    'zegie':           'Bahir Dar Special Zone',
    'choke':           'Debre Markos',
    'choke-mountain':  'Debre Markos',
    'choke mountain':  'Debre Markos',
    'gojjam':          'Debre Markos',
    'guassa':          'North Shewa',
    'menz':            'North Shewa',
    'menz-guassa':     'North Shewa',
    'abuye-meda':      'North Shewa',
    'abuye meda':      'North Shewa',
    'gishen':          'Wollo',
    'lalibela':        'Lalibela',
    'alatish':         'Alatish',
    'zeret':           'Dessie',
    'zeret-cave':      'Dessie',
    'dima':            'Debre Markos',
  },
  'Tigray': {
    'yeha':            'Yeha',
    'yeha-museum':     'Yeha',
    'tekeze':          'Tekeze',
    'tekeze-dam':      'Tekeze',
  },
  'Afar': {
    'dallol':          'Dallol',
    'danakil':         'Dallol',
    'erta-ale':        'Dallol',
    'erta ale':        'Dallol',
    'lake-abbe':       'Asaita',
    'lake abbe':       'Asaita',
    'doho-lodge':      'Awash',
    'doho':            'Awash',
    'tendaho':         'Tendaho',
    'raya-azebo':      'Semera',
    'mohoni':          'Semera',
    'salt-flats':      'Dallol',
    'camel-caravan':   'Dallol',
    'yangudi-rassa':   'Semera',
    'yangudi':         'Semera',
    'volcano':         'Dallol',
    'ayalu':           'Semera',
    'aliyu-amba':       'Semera',
    'argobba':          'Semera',
  },
  'South Ethiopia Regional State': {
    'konso':           'Konso',
    'chamo':           'Arba Minch',
    'arba-minch':      'Arba Minch',
    'arba minch':      'Arba Minch',
    'nechisar':        'Arba Minch',
    'mago':            'Jinka',
    'maze':            'Sawla',
    'lake-chamo':      'Arba Minch',
  },
  'Sidama': {
    'gidabo':          'Hawassa',
  },
  'South West Ethiopia Peoples': {
    'chebera-churchura':'Bonga',
    'chebera':         'Bonga',
    'teppi':           'Teppi',
    'kafa':            'Bonga',
  },
  'Somali': {
    'geralle':         'Jijiga',
  },
  'Central Ethiopia Regional State': {
    'kambaata':        'Durame',
    'durame':          'Durame',
  },
};


// ─── CSV Parser ──────────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ─── Matching Logic ──────────────────────────────────────────────────────────
function resolveDestination(name, tags, description) {
  // Build searchable text combining name, tags, and description
  const searchText = `${name} ${tags} ${description}`.toLowerCase();
  
  // Sort keys by length (longest first) for most-specific-first matching
  const sortedKeys = Object.keys(PLACE_LOOKUP).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (searchText.includes(key)) {
      return { ...PLACE_LOOKUP[key], matchedOn: key };
    }
  }
  
  return null;
}

function resolveCityOnly(region, name, tags, description) {
  const regionLookup = REGION_CITY_LOOKUP[region];
  if (!regionLookup) return null;
  
  const searchText = `${name} ${tags} ${description}`.toLowerCase();
  
  // Sort keys by length for most-specific matching
  const sortedKeys = Object.keys(regionLookup).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (searchText.includes(key)) {
      return { city: regionLookup[key], matchedOn: key };
    }
  }
  
  return null;
}

// ─── Escape SQL string ───────────────────────────────────────────────────────
function escapeSql(str) {
  return str.replace(/'/g, "''");
}

// ─── Main ────────────────────────────────────────────────────────────────────
function main() {
  const csvPath = path.resolve(__dirname, '..', 'destinations_rows (2).csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  const header = lines[0].split(',');
  const idIdx = header.indexOf('id');
  const nameIdx = header.indexOf('name');
  const descIdx = header.indexOf('description');
  const regionIdx = header.indexOf('region');
  const cityIdx = header.indexOf('city');
  const tagsIdx = header.indexOf('tags');
  
  const sqlStatements = [];
  const reportRows = [];
  const unresolvedRows = [];
  
  let resolvedBoth = 0;
  let resolvedCityOnly = 0;
  let failedBoth = 0;
  let failedCity = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 5) continue;
    
    const id = fields[idIdx];
    const name = fields[nameIdx];
    const description = fields[descIdx] || '';
    const region = fields[regionIdx]?.trim();
    const city = fields[cityIdx]?.trim();
    const tags = fields[tagsIdx] || '';
    
    // Skip if already complete
    if (region && city) continue;
    
    if (!region && !city) {
      // Missing both
      const result = resolveDestination(name, tags, description);
      if (result) {
        sqlStatements.push(
          `UPDATE public.destinations\n` +
          `SET region = '${escapeSql(result.region)}', city = '${escapeSql(result.city)}'\n` +
          `WHERE id = '${id}'::uuid;`
        );
        reportRows.push({
          id, name, type: 'both',
          region: result.region, city: result.city,
          matchedOn: result.matchedOn,
          status: 'RESOLVED'
        });
        resolvedBoth++;
      } else {
        unresolvedRows.push({ id, name, type: 'both', tags, description: description.substring(0, 100) });
        reportRows.push({ id, name, type: 'both', region: '', city: '', matchedOn: '', status: 'UNRESOLVED' });
        failedBoth++;
      }
    } else if (region && !city) {
      // Missing city only
      const result = resolveCityOnly(region, name, tags, description);
      if (result) {
        sqlStatements.push(
          `UPDATE public.destinations\n` +
          `SET city = '${escapeSql(result.city)}'\n` +
          `WHERE id = '${id}'::uuid;`
        );
        reportRows.push({
          id, name, type: 'city_only',
          region, city: result.city,
          matchedOn: result.matchedOn,
          status: 'RESOLVED'
        });
        resolvedCityOnly++;
      } else {
        unresolvedRows.push({ id, name, type: 'city_only', existingRegion: region, tags, description: description.substring(0, 100) });
        reportRows.push({ id, name, type: 'city_only', region, city: '', matchedOn: '', status: 'UNRESOLVED' });
        failedCity++;
      }
    }
  }
  
  // ─── Write SQL ───────────────────────────────────────────────────────────
  const sqlContent = [
    '-- Auto-generated by scripts/fill_missing_regions.js',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Resolved: ${resolvedBoth + resolvedCityOnly} destinations`,
    `-- Unresolved: ${failedBoth + failedCity} destinations`,
    '',
    'BEGIN;',
    '',
    ...sqlStatements.map(s => s + '\n'),
    'COMMIT;',
    ''
  ].join('\n');
  
  const sqlPath = path.resolve(__dirname, '..', 'database', 'destinations_fill_regions.sql');
  fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
  
  // ─── Write Report CSV ────────────────────────────────────────────────────
  const reportHeader = 'id,name,type,region,city,matched_on,status';
  const reportLines = reportRows.map(r =>
    `"${r.id}","${r.name.replace(/"/g, '""')}","${r.type}","${r.region}","${r.city}","${r.matchedOn}","${r.status}"`
  );
  const reportPath = path.resolve(__dirname, '..', 'database', 'destinations_fill_regions_report.csv');
  fs.writeFileSync(reportPath, [reportHeader, ...reportLines].join('\n'), 'utf-8');
  
  // ─── Write Unresolved CSV ────────────────────────────────────────────────
  if (unresolvedRows.length > 0) {
    const unresHeader = 'id,name,type,existing_region,tags,description_snippet';
    const unresLines = unresolvedRows.map(r =>
      `"${r.id}","${r.name.replace(/"/g, '""')}","${r.type}","${r.existingRegion || ''}","${(r.tags || '').replace(/"/g, '""')}","${(r.description || '').replace(/"/g, '""')}"`
    );
    const unresPath = path.resolve(__dirname, '..', 'database', 'destinations_unresolved.csv');
    fs.writeFileSync(unresPath, [unresHeader, ...unresLines].join('\n'), 'utf-8');
  }
  
  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║     DESTINATION REGION/CITY FILL RESULTS        ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Missing both resolved:    ${String(resolvedBoth).padStart(4)}                ║`);
  console.log(`║  Missing city resolved:    ${String(resolvedCityOnly).padStart(4)}                ║`);
  console.log(`║  Total resolved:           ${String(resolvedBoth + resolvedCityOnly).padStart(4)}                ║`);
  console.log(`║  ────────────────────────────────────────        ║`);
  console.log(`║  Failed (both):            ${String(failedBoth).padStart(4)}                ║`);
  console.log(`║  Failed (city only):       ${String(failedCity).padStart(4)}                ║`);
  console.log(`║  Total unresolved:         ${String(failedBoth + failedCity).padStart(4)}                ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\nSQL: database/destinations_fill_regions.sql`);
  console.log(`Report: database/destinations_fill_regions_report.csv`);
  if (unresolvedRows.length > 0) {
    console.log(`Unresolved: database/destinations_unresolved.csv`);
  }
}

main();
